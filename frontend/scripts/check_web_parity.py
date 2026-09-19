#!/usr/bin/env python3
"""Fail fast when the web app's backend-parity contract is stale or incomplete.

Mirrors android/scripts/check_parity_register.py.  Standard library only, so it can run
before `npm install`.  Run manually or as part of the pre-deploy gate:

    python3 frontend/scripts/check_web_parity.py            # development: planned workflows allowed
    python3 frontend/scripts/check_web_parity.py --strict   # release gate: everything implemented

Rules (each failure names the offending item):
  1. Every OpenAPI business path is either registered by a workflow or explicitly excluded.
  2. Every registered or excluded path exists in docs/openapi-schema.yaml (no stale entries).
  3. Every API path literal used by the frontend exists in the schema and is registered
     (no unknown endpoints, no unregistered calls, no calls to excluded mobile/internal paths).
  4. Every artifact a workflow declares (service, page, test) exists unless the workflow is `planned`.
     Strict mode also requires every workflow to be implemented and to declare at least one test.
  5. Every task code a workflow, or config/routeAccess.ts, names exists in backend/core/rbac_catalog.py.
  6. Every route in routes/appRoutes.tsx is registered in config/routeAccess.ts, and vice versa.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # frontend/
REPO = ROOT.parent
REGISTER = ROOT / "parity" / "register.json"
WORKFLOW_DIR = ROOT / "parity" / "workflows"
SCHEMA = REPO / "docs" / "openapi-schema.yaml"
CATALOG = REPO / "backend" / "core" / "rbac_catalog.py"
SRC = ROOT / "src"
ROUTE_ACCESS = SRC / "config" / "routeAccess.ts"
APP_ROUTES = SRC / "routes" / "appRoutes.tsx"

WORKFLOW_FIELDS = ("id", "roles", "screen", "apis", "writes", "services", "pages", "tests", "permissions", "status")
STATUSES = {"implemented", "planned"}
TASK_CODE = re.compile(r"['\"]([a-z][a-z_]*\.[a-z][a-z_]*\.[a-z][a-z_]*)['\"]")
API_LITERAL = re.compile(r"""(['"`])(/api/[^'"`\s]*)\1""")

errors: list[str] = []


def fail(message: str) -> None:
    errors.append(message)


def schema_paths() -> set[str]:
    return {
        line.strip()[:-1]
        for line in SCHEMA.read_text(encoding="utf-8").splitlines()
        if line.startswith("  /api/") and line.rstrip().endswith(":")
    }


def catalog_codes() -> set[str]:
    text = CATALOG.read_text(encoding="utf-8")
    block = text[text.index("TASK_CODES") : text.index("# name -> description")]
    return set(TASK_CODE.findall(block))


def path_regex(schema_path: str) -> re.Pattern[str]:
    parts = re.split(r"\{[^}]+\}", schema_path)
    return re.compile("^" + "[^/]+".join(re.escape(part) for part in parts) + "$")


def normalise_literal(raw: str) -> str:
    path = raw.split("?", 1)[0]
    return re.sub(r"\$\{[^}]*\}", "{}", path)


def segments(path: str) -> list[str]:
    return [segment for segment in path.split("/") if segment]


def match_schema(literal: str, schema: set[str], regexes: dict[str, re.Pattern[str]]) -> str | None:
    """Return the schema path a frontend literal refers to, or None if it is unknown.

    A literal that is only a segment-wise prefix of a schema path (dynamic string building, e.g.
    a base URL constant) is accepted as known but cannot be attributed to one path, so it
    returns the empty string.
    """
    candidate = normalise_literal(literal)
    concrete = candidate.replace("{}", "1")
    for path, regex in regexes.items():
        if regex.match(concrete):
            return path
    wanted = segments(candidate)
    for path in schema:
        have = segments(path)
        if len(wanted) <= len(have) and all(
            w == h or w == "{}" or h.startswith("{") for w, h in zip(wanted, have)
        ):
            return ""
    return None


def load_register() -> dict:
    if not REGISTER.is_file():
        fail(f"missing register: {REGISTER.relative_to(REPO)}")
        return {}
    register = json.loads(REGISTER.read_text(encoding="utf-8"))
    if register.get("version") != 1:
        fail("unsupported or missing register version")
    return register


def load_workflows() -> list[dict]:
    workflows: list[dict] = []
    for file in sorted(WORKFLOW_DIR.glob("*.json")):
        data = json.loads(file.read_text(encoding="utf-8"))
        for item in data.get("workflows", []):
            item["_file"] = file.name
            workflows.append(item)
    return workflows


def is_excluded(path: str, exclusions: list[dict]) -> dict | None:
    for rule in exclusions:
        if rule["match"] == "exact" and path == rule["path"]:
            return rule
        if rule["match"] == "prefix" and path.startswith(rule["path"]):
            return rule
    return None


def check_artifact(kind: str, relative: str, workflow_id: str) -> None:
    base = REPO if relative.startswith(("frontend/", "backend/")) else ROOT / "src"
    target = base / relative
    if not target.is_file():
        fail(f"{workflow_id}: declared {kind} does not exist: {relative}")


def strip_comments(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    return re.sub(r"(?<![:'\"`])//[^\n]*", "", text)


def frontend_api_literals() -> dict[str, set[str]]:
    found: dict[str, set[str]] = {}
    for file in SRC.rglob("*.ts*"):
        name = file.name
        if ".test." in name or ".spec." in name or "__tests__" in file.parts:
            continue
        text = strip_comments(file.read_text(encoding="utf-8"))
        for _quote, literal in API_LITERAL.findall(text):
            found.setdefault(literal, set()).add(str(file.relative_to(ROOT)))
    return found


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--strict", action="store_true", help="fail on workflows that are not implemented")
    args = parser.parse_args()

    for required in (SCHEMA, CATALOG, ROUTE_ACCESS, APP_ROUTES):
        if not required.is_file():
            fail(f"required file missing: {required.relative_to(REPO)}")
    if errors:
        report()

    register = load_register()
    workflows = load_workflows()
    schema = schema_paths()
    regexes = {path: path_regex(path) for path in schema}
    codes = catalog_codes()
    exclusions = register.get("exclusions", [])
    included_roles = set(register.get("policy", {}).get("included_roles", []))

    for rule in exclusions:
        if rule.get("match") not in ("exact", "prefix") or not rule.get("path") or not rule.get("reason"):
            fail(f"malformed exclusion (needs match, path, reason): {rule}")
            continue
        if not any(is_excluded(path, [rule]) for path in schema):
            fail(f"stale exclusion matches no schema path: {rule['path']}")

    ids: set[str] = set()
    registered: set[str] = set()
    covered_roles: set[str] = set()
    for item in workflows:
        wid = item.get("id", "<no id>")
        for field in WORKFLOW_FIELDS:
            if field not in item:
                fail(f"{item['_file']}: workflow {wid} missing field '{field}'")
        if item.get("id") in ids:
            fail(f"duplicate workflow id: {wid}")
        ids.add(item.get("id", ""))
        if item.get("status") not in STATUSES:
            fail(f"{wid}: status must be one of {sorted(STATUSES)}")
        if args.strict and item.get("status") != "implemented":
            fail(f"{wid}: not implemented (strict mode)")
        roles = set(item.get("roles", []))
        if unknown_roles := roles - included_roles - {"Public"}:
            fail(f"{wid}: roles not in policy.included_roles: {sorted(unknown_roles)}")
        covered_roles |= roles
        for api in item.get("apis", []):
            registered.add(api)
            if api not in schema:
                fail(f"{wid}: registered path absent from schema (stale): {api}")
            elif is_excluded(api, exclusions):
                fail(f"{wid}: registers an excluded path: {api}")
        for code in item.get("permissions", []):
            if code not in codes:
                fail(f"{wid}: unknown task code '{code}' (not in core/rbac_catalog.py)")
        if args.strict and item.get("status") == "implemented" and not item.get("tests"):
            fail(f"{wid}: implemented workflows must declare at least one test (strict mode)")
        if item.get("status") == "implemented":
            for kind, key in (("service", "services"), ("page", "pages"), ("test", "tests")):
                for relative in item.get(key, []):
                    check_artifact(kind, relative, wid)

    if missing := included_roles - covered_roles:
        fail(f"included roles with no workflow: {sorted(missing)}")

    for path in sorted(schema):
        if not is_excluded(path, exclusions) and path not in registered:
            fail(f"schema path is neither registered nor excluded: {path}")

    for literal, files in sorted(frontend_api_literals().items()):
        where = ", ".join(sorted(files))
        matched = match_schema(literal, schema, regexes)
        if matched is None:
            fail(f"frontend uses unknown endpoint {literal} ({where})")
            continue
        if matched == "":
            continue
        rule = is_excluded(matched, exclusions)
        if rule and not rule.get("allow_frontend"):
            fail(f"frontend calls excluded endpoint {matched} ({where}): {rule['reason']}")
        elif not rule and matched not in registered:
            fail(f"frontend calls unregistered endpoint {matched} ({where})")

    route_text = ROUTE_ACCESS.read_text(encoding="utf-8")
    for code in sorted(set(TASK_CODE.findall(route_text)) - codes):
        fail(f"config/routeAccess.ts names unknown task code: {code}")
    access_keys = set(re.findall(r"^  '([^']+)':", route_text, re.M))
    route_paths = set(re.findall(r'<ProtectedRoute path="([^"]+)"', APP_ROUTES.read_text(encoding="utf-8")))
    for path in sorted(route_paths - access_keys):
        fail(f"route {path} is not registered in config/routeAccess.ts")
    for path in sorted(access_keys - route_paths):
        fail(f"config/routeAccess.ts registers {path} but no route uses it")

    report(len(workflows), len(schema), len(exclusions))


def report(workflow_count: int = 0, schema_count: int = 0, exclusion_count: int = 0) -> None:
    if errors:
        print(f"web parity check FAILED ({len(errors)} problem(s)):", file=sys.stderr)
        for message in errors:
            print(f"  - {message}", file=sys.stderr)
        raise SystemExit(1)
    print(
        f"web parity OK: {workflow_count} workflows, {schema_count} schema paths, {exclusion_count} exclusions"
    )


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Fail fast when Android's declared API parity contract is stale or incomplete.

This intentionally uses only the Python standard library: CI must be able to validate the
register before Gradle resolves dependencies.  OpenAPI paths are YAML keys beginning with
two spaces and `/`, which is sufficient for the generated schema format committed here.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTER = ROOT / "parity" / "register.json"
ANDROID_SCHEMA = ROOT / "api" / "openapi-current.yaml"
CANONICAL_SCHEMA = ROOT.parent / "docs" / "openapi-schema.yaml"


def schema_paths(schema: Path) -> set[str]:
    return {
        line.strip()[:-1]
        for line in schema.read_text(encoding="utf-8").splitlines()
        if line.startswith("  /api/") and line.rstrip().endswith(":")
    }


def fail(message: str) -> None:
    print(f"parity register error: {message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    if not REGISTER.is_file() or not ANDROID_SCHEMA.is_file() or not CANONICAL_SCHEMA.is_file():
        fail("register or schema artifact is missing")
    if ANDROID_SCHEMA.read_bytes() != CANONICAL_SCHEMA.read_bytes():
        fail("android/api/openapi-current.yaml differs from docs/openapi-schema.yaml; regenerate contracts and update models/register")
    register = json.loads(REGISTER.read_text(encoding="utf-8"))
    if register.get("version") != 1:
        fail("unsupported or missing register version")
    workflows = register.get("workflows")
    if not isinstance(workflows, list) or not workflows:
        fail("workflows must be a non-empty list")
    expected_roles = set(register.get("policy", {}).get("included_roles", []))
    covered_roles = {item.get("role") for item in workflows}
    if missing := expected_roles - covered_roles:
        fail(f"included roles missing from register: {', '.join(sorted(missing))}")
    paths = schema_paths(ANDROID_SCHEMA)
    exceptions = set(register.get("schema_exceptions", []))
    if exceptions:
        fail("schema exceptions are not permitted; regenerate the OpenAPI artifact instead")
    ids: set[str] = set()
    for item in workflows:
        for field in ("id", "role", "screen", "apis", "writes", "contract_models", "tests", "release", "status"):
            if field not in item:
                fail(f"workflow missing {field}: {item}")
        if item["id"] in ids:
            fail(f"duplicate workflow id: {item['id']}")
        ids.add(item["id"])
        unknown = set(item["apis"]) - paths - exceptions
        if unknown:
            fail(f"{item['id']} references paths absent from schema: {', '.join(sorted(unknown))}")
        for relative in item["contract_models"] + item["tests"]:
            source_sets = ("test", "androidTest") if relative.endswith("Test.kt") else ("main",)
            artifacts = [ROOT / "app" / "src" / source_set / "java/pk/vexel/medsims" / relative for source_set in source_sets]
            if not any(artifact.is_file() for artifact in artifacts):
                # A planned workflow may deliberately have no model/test.  Any declared file must exist.
                fail(f"{item['id']} declares missing Android artifact: {relative}")

    # Every Retrofit endpoint is contract work.  Keeping this check here avoids the common
    # failure mode where a DTO/service is added but the parity register is not updated.
    service = ROOT / "app/src/main/java/pk/vexel/medsims/core/network/ApiService.kt"
    declared_paths = set(re.findall(r'"(api/[^"?]+)', service.read_text(encoding="utf-8")))
    declared_paths = {f"/{path}" for path in declared_paths}
    registered_paths = {path for item in workflows for path in item["apis"]}
    missing_mappings = declared_paths - registered_paths
    if missing_mappings:
        fail("Android API mappings absent from register: " + ", ".join(sorted(missing_mappings)))
    print(f"parity register OK: {len(workflows)} workflows, {len(paths)} schema paths")


if __name__ == "__main__":
    main()

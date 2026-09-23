"""Check separate line/branch floors for every registered application area.

No third-party dependencies. Reports: coverage.py JSON, Istanbul JSON, JaCoCo XML.
Run from any directory; --root exists for isolated verifier tests.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path


def matches(path, pattern):
    # Unlike fnmatch, '*' must not cross directory boundaries; '**/' includes zero directories.
    pieces = re.split(r"(\*\*/|\*\*|\*)", pattern)
    expression = "".join({"**/": "(?:.*/)?", "**": ".*", "*": "[^/]*"}.get(p, re.escape(p)) for p in pieces)
    return re.fullmatch(expression, path) is not None


def normalize(path, root, prefix=""):
    p = Path(path)
    if p.is_absolute():
        return p.resolve().relative_to(root.resolve()).as_posix()
    return (Path(prefix) / p).as_posix()


def read_report(layer, report, root):
    result = {}
    if layer == "backend":
        data = json.loads(report.read_text())
        if not data.get("meta", {}).get("branch_coverage"):
            raise ValueError("Backend report must measure branches")
        for name, item in data["files"].items():
            s = item["summary"]
            prefix = "" if name.startswith("backend/") else "backend"
            result[normalize(name, root, prefix)] = [s["covered_lines"], s["num_statements"], s["covered_branches"], s["num_branches"]]
    elif layer == "web":
        for name, item in json.loads(report.read_text()).items():
            lines = defaultdict(int)
            for key, statement in item["statementMap"].items():
                line = statement["start"]["line"]
                lines[line] = max(lines[line], item["s"][key])
            branches = [n for hits in item["b"].values() for n in hits]
            prefix = "" if name.startswith("frontend/") else "frontend"
            result[normalize(name, root, prefix)] = [sum(n > 0 for n in lines.values()), len(lines), sum(n > 0 for n in branches), len(branches)]
    else:
        for package in ET.parse(report).getroot().findall("package"):
            for source in package.findall("sourcefile"):
                name = f"android/app/src/main/java/{package.attrib['name']}/{source.attrib['name']}"
                counters = {c.attrib["type"]: c.attrib for c in source.findall("counter")}
                values = []
                for kind in ("LINE", "BRANCH"):
                    c = counters.get(kind, {"covered": "0", "missed": "0"})
                    covered, missed = int(c["covered"]), int(c["missed"])
                    values += [covered, covered + missed]
                if name in result:
                    raise ValueError(f"Duplicate source in Android report: {name}")
                result[name] = values
    return result


def evaluate(root, manifest, layer, records):
    errors, totals = [], defaultdict(lambda: [0, 0, 0, 0])
    patterns = [p for rule in manifest["exclusions"] for p in rule["patterns"]]
    files = set()
    suffixes = {"backend": {".py"}, "web": {".ts", ".tsx"}, "android": {".kt"}}
    for directory in manifest["roots"][layer]:
        files.update(p.relative_to(root).as_posix() for p in (root / directory).rglob("*") if p.is_file() and p.suffix in suffixes[layer])
    for name in sorted(files):
        if any(matches(name, p) for p in patterns):
            continue
        areas = [a for a, globs in manifest["areas"].items() if a.startswith(layer + "/") and any(matches(name, p) for p in globs)]
        if len(areas) != 1:
            errors.append(f"{name}: expected one area, found {areas}")
            continue
        if name not in records:
            errors.append(f"{name}: missing from coverage report")
            continue
        values = records[name]
        if any(n < 0 for n in values) or values[0] > values[1] or values[2] > values[3]:
            errors.append(f"{name}: invalid coverage counters")
            continue
        totals[areas[0]] = [a + b for a, b in zip(totals[areas[0]], values)]
    rows = []
    for area, (lc, lt, bc, bt) in sorted(totals.items()):
        row = {"area": area, "lines": [lc, lt], "branches": [bc, bt]}
        for metric, covered, total in (("lines", lc, lt), ("branches", bc, bt)):
            if total and covered * 100 < manifest["minimum"] * total:
                errors.append(f"{area}: {metric} {covered}/{total} below {manifest['minimum']}%")
        rows.append(row)
    if not rows:
        errors.append(f"{layer}: no measured areas")
    return rows, errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("layer", choices=["backend", "web", "android"])
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    try:
        manifest = json.loads((args.root / "coverage/areas.json").read_text())
        rows, errors = evaluate(args.root, manifest, args.layer, read_report(args.layer, args.report, args.root))
    except (OSError, ValueError, KeyError, ET.ParseError) as exc:
        print(f"Coverage verification failed: {exc}", file=sys.stderr)
        return 1
    for row in rows:
        cells = []
        for kind in ("lines", "branches"):
            covered, total = row[kind]
            cells.append(f"{kind}: {covered}/{total} ({100 * covered / total:.2f}%)" if total else f"{kind}: N/A")
        print(row["area"], " | ".join(cells))
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps({"areas": rows, "errors": errors}, indent=2) + "\n")
    for error in errors:
        print(error, file=sys.stderr)
    return int(bool(errors))


if __name__ == "__main__":
    sys.exit(main())

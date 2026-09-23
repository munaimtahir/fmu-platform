import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("coverage_gate", Path(__file__).parents[1] / "check_coverage.py")
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class CoverageGateTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        (self.root / "frontend/src").mkdir(parents=True)
        for name in ("a.ts", "b.ts"):
            (self.root / "frontend/src" / name).write_text("export const x = 1")
        self.manifest = {"minimum": 95, "roots": {"web": ["frontend/src"]}, "exclusions": [],
                         "areas": {"web/a": ["frontend/src/a.ts"], "web/b": ["frontend/src/b.ts"]}}
        self.records = {"frontend/src/a.ts": [1000, 1000, 1000, 1000], "frontend/src/b.ts": [95, 100, 95, 100]}

    def test_accepts_exact_floor(self):
        self.assertEqual(gate.evaluate(self.root, self.manifest, "web", self.records)[1], [])

    def test_high_average_cannot_hide_failing_area(self):
        self.records["frontend/src/b.ts"] = [94, 100, 94, 100]
        errors = gate.evaluate(self.root, self.manifest, "web", self.records)[1]
        self.assertEqual(len(errors), 2)
        self.assertTrue(all("web/b" in e for e in errors))

    def test_does_not_round_up(self):
        self.records["frontend/src/b.ts"] = [9499, 10000, 95, 100]
        self.assertIn("lines", gate.evaluate(self.root, self.manifest, "web", self.records)[1][0])

    def test_missing_file_is_failure(self):
        del self.records["frontend/src/b.ts"]
        self.assertIn("missing", gate.evaluate(self.root, self.manifest, "web", self.records)[1][0])

    def test_unmapped_and_overlapping_assignments_fail(self):
        del self.manifest["areas"]["web/b"]
        self.assertIn("found []", gate.evaluate(self.root, self.manifest, "web", self.records)[1][0])
        self.manifest["areas"]["web/duplicate"] = ["frontend/src/*.ts"]
        self.assertIn("expected one area", gate.evaluate(self.root, self.manifest, "web", self.records)[1][0])

    def test_empty_report_fails(self):
        self.assertTrue(gate.evaluate(self.root, self.manifest, "web", {})[1])

    def test_glob_boundaries(self):
        self.assertTrue(gate.matches("a/b.py", "a/**/*.py"))
        self.assertTrue(gate.matches("a/x/b.py", "a/**/*.py"))
        self.assertFalse(gate.matches("a/x/b.py", "a/*.py"))

    def test_backend_without_branches_rejected(self):
        p = self.root / "report.json"
        p.write_text(json.dumps({"meta": {"branch_coverage": False}, "files": {}}))
        with self.assertRaisesRegex(ValueError, "branches"):
            gate.read_report("backend", p, self.root)

    def test_istanbul_multiple_statements_on_one_line(self):
        p = self.root / "report.json"
        p.write_text(json.dumps({"frontend/src/a.ts": {"statementMap": {
            "0": {"start": {"line": 1}}, "1": {"start": {"line": 1}}, "2": {"start": {"line": 2}}},
            "s": {"0": 0, "1": 2, "2": 0}, "b": {"0": [1, 0]}}}))
        self.assertEqual(gate.read_report("web", p, self.root)["frontend/src/a.ts"], [1, 2, 1, 2])

    def test_android_xml_source_counters(self):
        p = self.root / "report.xml"
        p.write_text('<report><package name="pk/example"><sourcefile name="Screen.kt">'
                     '<counter type="LINE" missed="1" covered="19"/>'
                     '<counter type="BRANCH" missed="2" covered="38"/>'
                     '</sourcefile></package></report>')
        self.assertEqual(list(gate.read_report("android", p, self.root).values()), [[19, 20, 38, 40]])


if __name__ == "__main__":
    unittest.main()

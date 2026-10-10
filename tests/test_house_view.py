"""하우스뷰 합의 계산 테스트 (scripts/house_view.py)."""
import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import house_view as hv  # noqa: E402

BASE = {
    "month": "2026-10",
    "sources": [
        {"id": "a", "name": "A", "title": "t", "published": "2026-10-01",
         "views": {"kr_equity": 1, "global_equity": -1, "govbond": 1}},
        {"id": "b", "name": "B", "title": "t", "published": "2026-10-01",
         "views": {"kr_equity": 1, "global_equity": 0, "govbond": -1}},
        {"id": "c", "name": "C", "title": "t", "published": "2026-10-02",
         "views": {"kr_equity": 0, "global_equity": -1, "govbond": 1}},
    ],
}


class ConsensusTests(unittest.TestCase):
    def test_majority_and_disagreement(self):
        c = hv.consensus(hv.validate(copy.deepcopy(BASE)))
        self.assertEqual(c["kr_equity"]["view"], 1)          # 평균 0.67 → 확대
        self.assertEqual(c["global_equity"]["view"], -1)     # 평균 -0.67 → 축소
        self.assertEqual(c["govbond"]["view"], 0)            # [1, -1, 1] 평균 0.33 → 중립
        self.assertTrue(c["govbond"]["disagreement"])        # +1과 -1 공존 → 갈림 표시
        self.assertEqual(c["govbond"]["label"], "중립 · 의견 갈림")
        self.assertEqual(c["cash"]["n"], 0)                  # 아무도 안 적은 자산
        self.assertEqual(c["cash"]["label"], "자료 없음")

    def test_disagreement_does_not_force_neutral(self):
        # 2026-10-09: 한 곳만 반대해도 과반이면 결론 유지 (7곳 중 5곳 축소, 1곳 확대)
        data = copy.deepcopy(BASE)
        data["sources"] = [
            {"id": f"s{i}", "name": "N", "title": "t", "published": "2026-10-01", "views": {"govbond": v}}
            for i, v in enumerate([-1, -1, -1, -1, -1, 0, 1])
        ]
        c = hv.consensus(hv.validate(data))
        self.assertAlmostEqual(c["govbond"]["mean"], round(-4 / 7, 4))
        self.assertEqual(c["govbond"]["view"], -1)           # 평균 -0.57 → 축소
        self.assertTrue(c["govbond"]["disagreement"])
        self.assertEqual(c["govbond"]["label"], "축소 · 의견 갈림")

    def test_half_is_neutral(self):
        data = copy.deepcopy(BASE)
        data["sources"] = data["sources"][:2]
        data["sources"][1]["views"]["kr_equity"] = 0          # [1, 0] 평균 0.5 → 중립(과반 아님)
        c = hv.consensus(hv.validate(data))
        self.assertEqual(c["kr_equity"]["view"], 0)

    def test_equal_weight(self):
        c = hv.consensus(hv.validate(copy.deepcopy(BASE)))
        self.assertAlmostEqual(c["kr_equity"]["mean"], round(2 / 3, 4))


class ValidationTests(unittest.TestCase):
    def bad(self, mutate):
        data = copy.deepcopy(BASE)
        mutate(data)
        with self.assertRaises(hv.InputError):
            hv.validate(data)

    def test_rejects_bad_values(self):
        self.bad(lambda d: d["sources"][0]["views"].update(kr_equity=2))
        self.bad(lambda d: d["sources"][0]["views"].update(kr_equity=True))
        self.bad(lambda d: d["sources"][0]["views"].update(bitcoin=1))
        self.bad(lambda d: d.update(month="2026/10"))
        self.bad(lambda d: d["sources"][1].update(id="a"))
        self.bad(lambda d: d["sources"][0].update(published="10월 1일"))
        self.bad(lambda d: d["sources"][0].update(url="http://example.com"))
        self.bad(lambda d: d["sources"][0].update(name=""))
        self.bad(lambda d: d["sources"][0]["views"].update(kr_equity=1.0))
        self.bad(lambda d: d["sources"][0].update(published="2026-02-30"))
        self.bad(lambda d: d["sources"].append("문자열"))

    def test_real_input_file_is_valid(self):
        # 실제 입력 파일은 '형식'만 검사한다(매달 값이 바뀌어도 테스트가 깨지지 않게)
        data = json.loads((ROOT / "data" / "house_view_input.json").read_text(encoding="utf-8"))
        hv.validate(data)

    def test_demo_fixture_matches_app_demo(self):
        data = json.loads((ROOT / "tests" / "fixtures" / "house_view_demo.json").read_text(encoding="utf-8"))
        result = hv.build(data)
        views = {k: v["view"] for k, v in result["consensus"].items()}
        # app.js HOUSE_VIEW 데모와 같은 방향: 해외 주식 축소, 국채·현금 확대, 나머지 중립
        self.assertEqual(views, {"kr_equity": 0, "global_equity": -1, "govbond": 1, "corpbond": 0,
                                 "alternative": 0, "cash": 1})

    def test_main_writes_only_on_change(self):
        with tempfile.TemporaryDirectory() as tmp:
            inp, out = Path(tmp) / "in.json", Path(tmp) / "out.json"
            inp.write_text(json.dumps(BASE), encoding="utf-8")
            self.assertEqual(hv.main(["--input", str(inp), "--output", str(out)]), 0)
            first = out.stat().st_mtime_ns
            self.assertEqual(hv.main(["--input", str(inp), "--output", str(out)]), 0)
            self.assertEqual(out.stat().st_mtime_ns, first)
            inp.write_text("{broken", encoding="utf-8")
            self.assertEqual(hv.main(["--input", str(inp), "--output", str(out)]), 1)


if __name__ == "__main__":
    unittest.main()

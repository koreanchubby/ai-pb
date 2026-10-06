"""참조 모델(scripts/calc_reference.py)이 app.js 화면 계산과 같은 값을 내는지 대조.

기대값은 2026-10-04에 브라우저에서 app.js(PR #7 + 보완 커밋)를 실행해 기록한 값이다.
app.js 공식을 바꾸면: 참조 모델과 이 기대값, docs/CALC_EXAMPLES.md를 함께 고친다.
"""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import calc_reference as cr  # noqa: E402

APP = {  # app.js 실행 결과 (데모 고객)
    "score": 35, "level": 3,
    "bucket1": 0.828, "bucket2": 1.32,
    "spouse_deduction": 18.8, "tax_base": 21.2, "estate_tax": 6.7,
    "cash_floor": 0.828, "bond_floor": 8.02, "pool": 12.152,
    "saa": {"kretf": 2, "globaletf": 4.7, "govbond": 10, "corpbond": 1.9, "alternative": 1.2, "pef": 4, "cash": 1.2},
    "target": {"kretf": 2, "globaletf": 4.7, "govbond": 10, "corpbond": 2, "alternative": 1.2, "pef": 4, "cash": 1.1},
    "turnover": 7.0,
    "vol_now": 9.197582291015395, "ret_now": 5.312, "vol_target": 7.196904056606564, "ret_target": 4.8728,
    "income_now": 0.5, "income_target": 0.4425,
}


class DemoCustomerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.d = cr.demo()
        cls.p = cls.d["plan"]

    def test_profile(self):
        self.assertEqual(self.d["profile"]["score"], APP["score"])
        self.assertEqual(self.d["profile"]["level"], APP["level"])

    def test_retirement_buckets(self):
        self.assertAlmostEqual(self.d["buckets"]["bucket1"], APP["bucket1"])
        self.assertAlmostEqual(self.d["buckets"]["bucket2"], APP["bucket2"])

    def test_estate_tax(self):
        e = self.d["estate"]
        self.assertAlmostEqual(e["spouse"], APP["spouse_deduction"])
        self.assertAlmostEqual(e["base"], APP["tax_base"])
        self.assertAlmostEqual(e["tax"], APP["estate_tax"])

    def test_floors_and_allocation(self):
        self.assertAlmostEqual(self.p["cash_floor"], APP["cash_floor"])
        self.assertAlmostEqual(self.p["bond_floor"], APP["bond_floor"])
        self.assertAlmostEqual(self.p["pool"], APP["pool"])
        for k, v in APP["saa"].items():
            self.assertAlmostEqual(self.p["saa"][k], v, msg=k)
        for k, v in APP["target"].items():
            self.assertAlmostEqual(self.p["target"][k], v, msg=k)
        self.assertEqual(self.p["skipped"], ["corpbond"])  # 0.1억 차이 → 밴드(0.3억) 안이라 거래 생략
        self.assertAlmostEqual(self.p["turnover"], APP["turnover"])

    def test_risk_return_and_income(self):
        self.assertAlmostEqual(self.p["stats_now"]["vol"], APP["vol_now"], places=9)
        self.assertAlmostEqual(self.p["stats_now"]["ret"], APP["ret_now"], places=9)
        self.assertAlmostEqual(self.p["stats_target"]["vol"], APP["vol_target"], places=9)
        self.assertAlmostEqual(self.p["stats_target"]["ret"], APP["ret_target"], places=9)
        self.assertAlmostEqual(self.p["income_now"], APP["income_now"])
        self.assertAlmostEqual(self.p["income_target"], APP["income_target"])


class RuleTests(unittest.TestCase):
    def test_tax_brackets_are_continuous(self):
        # 누진공제 덕분에 구간 경계에서 세액이 끊기지 않아야 한다
        for edge in (1, 5, 10, 30):
            self.assertAlmostEqual(cr.inheritance_tax_rate(edge - 1e-9), cr.inheritance_tax_rate(edge + 1e-9), places=6)

    def test_spouse_deduction_bounds(self):
        small = cr.estimate_estate_tax(6, 1, 50, 60)       # 실제 3억 → 최소 5억
        big = cr.estimate_estate_tax(200, 50, 60, 60)      # 실제 120억 → 최대 30억
        self.assertEqual(small["spouse"], 5.0)
        self.assertEqual(big["spouse"], 30.0)

    def test_loss_answer_caps_profile(self):
        r = cr.survey_level(35, [5] * 9, loss_point=1)       # 점수는 공격형이어도 원금보존이면 안정형
        self.assertEqual(r["declared"], 5)
        self.assertEqual(r["level"], 1)

    def test_legal_and_reserve_shares(self):
        legal = cr.legal_shares(1, 2)
        self.assertAlmostEqual(legal[0], 300 / 7)          # 1.5 / 3.5
        self.assertAlmostEqual(sum(legal), 100)


if __name__ == "__main__":
    unittest.main()

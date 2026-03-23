import unittest
from datetime import datetime

from app.services.records_summary import build_records_summary, format_record


class RecordsSummaryTests(unittest.TestCase):
    def test_format_record_uses_jst_date(self):
        record = {
            "recordId": "rec-1",
            "userId": "user-1",
            "menuName": "Push Up",
            "count": 20,
            "duration": 180,
            "createdAt": datetime.fromisoformat("2026-03-22T18:30:00+00:00"),
        }

        formatted = format_record(record)

        self.assertEqual(formatted["date"], "2026-03-23")
        self.assertEqual(formatted["minutes"], 3.0)

    def test_build_records_summary_includes_today_total_minutes(self):
        records = [
            {
                "recordId": "rec-1",
                "userId": "user-1",
                "menuName": "Push Up",
                "count": 20,
                "duration": 180,
                "createdAt": datetime.fromisoformat("2026-03-23T01:00:00+09:00"),
            },
            {
                "recordId": "rec-2",
                "userId": "user-1",
                "menuName": "Squat",
                "count": 30,
                "duration": 240,
                "createdAt": datetime.fromisoformat("2026-03-23T08:00:00+09:00"),
            },
        ]

        summary = build_records_summary("user-1", records)

        self.assertEqual(summary["totalRecords"], 2)
        self.assertEqual(summary["todayRecords"], 2)
        self.assertEqual(summary["todayTotalMinutes"], 7.0)
        self.assertEqual(summary["latestRecord"]["recordId"], "rec-2")


if __name__ == "__main__":
    unittest.main()

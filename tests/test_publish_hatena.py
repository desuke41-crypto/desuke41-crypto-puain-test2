import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

from scripts.publish_hatena import APP, ATOM, atom_entry, is_due, parse_post


class HatenaPublisherTest(unittest.TestCase):
    def test_parse_post(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "post.md"
            path.write_text("---\ntitle: テスト\ncategories: 日記, 自動化\ndraft: false\n---\n本文\n")
            meta, body = parse_post(path)
        self.assertEqual(meta["title"], "テスト")
        self.assertEqual(meta["categories"], ["日記", "自動化"])
        self.assertFalse(meta["draft"])
        self.assertEqual(body, "本文\n")

    def test_scheduled_post_is_due(self):
        now = datetime(2026, 8, 27, tzinfo=timezone.utc)
        self.assertTrue(is_due({"draft": False, "publish_at": "2026-08-26T09:00:00+09:00"}, now))
        self.assertFalse(is_due({"draft": False, "publish_at": "2026-08-28T09:00:00+09:00"}, now))
        self.assertFalse(is_due({"draft": True}, now))

    def test_atom_payload_is_public_markdown(self):
        payload = atom_entry({"title": "題名", "categories": ["日記"]}, "本文")
        self.assertIn(f'xmlns:ns0="{ATOM}"'.encode(), payload)
        self.assertIn(f'xmlns:ns1="{APP}"'.encode(), payload)
        self.assertIn(b'type="text/markdown"', payload)
        self.assertIn(b"<ns1:draft>no</ns1:draft>", payload)


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3
"""Publish scheduled Markdown files to Hatena Blog through AtomPub."""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ATOM = "http://www.w3.org/2005/Atom"
APP = "http://www.w3.org/2007/app"


def parse_post(path: Path) -> tuple[dict[str, object], str]:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise ValueError(f"{path}: YAML風フロントマターがありません")
    try:
        header, body = text[4:].split("\n---\n", 1)
    except ValueError as exc:
        raise ValueError(f"{path}: フロントマターの終了行がありません") from exc

    meta: dict[str, object] = {}
    for line in header.splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        key, separator, value = line.partition(":")
        if not separator:
            raise ValueError(f"{path}: 不正な設定行です: {line}")
        value = value.strip().strip('"').strip("'")
        if key.strip() == "categories":
            meta[key.strip()] = [item.strip() for item in value.split(",") if item.strip()]
        elif value.lower() in {"true", "false"}:
            meta[key.strip()] = value.lower() == "true"
        else:
            meta[key.strip()] = value
    if not meta.get("title"):
        raise ValueError(f"{path}: title は必須です")
    if body.startswith("\n"):
        body = body[1:]
    if not body.endswith("\n"):
        body += "\n"
    return meta, body


def is_due(meta: dict[str, object], now: datetime) -> bool:
    if meta.get("draft", True) is not False:
        return False
    publish_at = meta.get("publish_at")
    if not publish_at:
        return True
    scheduled = datetime.fromisoformat(str(publish_at).replace("Z", "+00:00"))
    if scheduled.tzinfo is None:
        scheduled = scheduled.replace(tzinfo=timezone.utc)
    return scheduled <= now


def atom_entry(meta: dict[str, object], body: str) -> bytes:
    entry = ET.Element(ET.QName(ATOM, "entry"))
    ET.SubElement(entry, ET.QName(ATOM, "title")).text = str(meta["title"])
    content = ET.SubElement(entry, ET.QName(ATOM, "content"), {"type": "text/plain"})
    content.text = body
    for category in meta.get("categories", []):
        ET.SubElement(entry, ET.QName(ATOM, "category"), {"term": str(category)})
    control = ET.SubElement(entry, ET.QName(APP, "control"))
    ET.SubElement(control, ET.QName(APP, "draft")).text = "no"
    return ET.tostring(entry, encoding="utf-8", xml_declaration=True)


def publish(endpoint: str, username: str, api_key: str, payload: bytes) -> str:
    token = base64.b64encode(f"{username}:{api_key}".encode()).decode()
    request = urllib.request.Request(
        endpoint,
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Basic {token}",
            "Content-Type": "application/atom+xml; charset=utf-8",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        location = response.headers.get("Location")
        if location:
            return location
        root = ET.fromstring(response.read())
        link = root.find(f"{{{ATOM}}}link[@rel='alternate']")
        return link.attrib.get("href", "") if link is not None else ""


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--posts", type=Path, default=Path("posts"))
    parser.add_argument("--state", type=Path, default=Path(".hatena-published.json"))
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    state = json.loads(args.state.read_text()) if args.state.exists() else {}
    due = []
    now = datetime.now(timezone.utc)
    for path in sorted(args.posts.glob("*.md")):
        meta, body = parse_post(path)
        if path.name not in state and is_due(meta, now):
            due.append((path, meta, body))

    if not due:
        print("公開対象の記事はありません。")
        return 0
    if args.dry_run:
        for path, _, _ in due:
            print(f"公開予定: {path}")
        return 0

    required = ["HATENA_ID", "HATENA_API_KEY", "HATENA_BLOG_DOMAIN"]
    missing = [name for name in required if not os.environ.get(name)]
    if missing:
        print(f"環境変数が不足しています: {', '.join(missing)}", file=sys.stderr)
        return 2
    username = os.environ["HATENA_ID"]
    endpoint = f"https://blog.hatena.ne.jp/{username}/{os.environ['HATENA_BLOG_DOMAIN']}/atom/entry"
    for path, meta, body in due:
        url = publish(endpoint, username, os.environ["HATENA_API_KEY"], atom_entry(meta, body))
        state[path.name] = {"published_at": datetime.now(timezone.utc).isoformat(), "url": url}
        args.state.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n")
        print(f"公開しました: {path} {url}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, urllib.error.URLError) as exc:
        print(f"エラー: {exc}", file=sys.stderr)
        raise SystemExit(1)

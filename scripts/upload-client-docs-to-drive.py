#!/usr/bin/env python3
"""
Upload the 3 client proposal .docx files to their Drive folders via the
`gws` CLI. Updates the file in place if a file with the same name already
exists in the target folder; otherwise creates a new file.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "docs" / "client-presentations"
MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

TARGETS = [
    ("eden-creche", "1tjPUuIYwHaZBLT4fYN731bPx-ZXrrTuI"),
    ("clement-sinibaldi", "1jbK-wQ8WbgOlBxbl9hbvHJGTBsunQQb0"),
    ("fany-rother", "10u_V-yjwuyMOsle-61F4hCiUV2lYp_7A"),
]


def gws(*args: str, capture: bool = False) -> str:
    res = subprocess.run(
        ["gws", *args],
        check=True,
        capture_output=True,
        text=True,
    )
    return res.stdout


def find_existing(name: str, folder: str) -> Optional[str]:
    params = {
        "q": f"name='{name}' and '{folder}' in parents and trashed=false",
        "fields": "files(id)",
    }
    out = gws("drive", "files", "list", "--params", json.dumps(params))
    data = json.loads(out)
    files = data.get("files") or []
    return files[0]["id"] if files else None


def upload(path: Path, folder: str) -> str:
    name = path.name
    existing = find_existing(name, folder)
    if existing:
        print(f"    update {existing}")
        gws(
            "drive", "files", "update",
            "--params", json.dumps({"fileId": existing}),
            "--upload", str(path),
            "--upload-content-type", MIME,
        )
        return existing
    print(f"    create in {folder}")
    out = gws(
        "drive", "files", "create",
        "--json", json.dumps({"name": name, "parents": [folder]}),
        "--upload", str(path),
        "--upload-content-type", MIME,
    )
    return json.loads(out).get("id", "")


def main() -> int:
    for slug, folder in TARGETS:
        path = DIR / f"{slug}-proposition-lucid-lab.docx"
        print(f"==> {slug}")
        if not path.exists():
            print(f"    missing: {path}", file=sys.stderr)
            return 1
        upload(path, folder)
        print("    ok")
    return 0


if __name__ == "__main__":
    sys.exit(main())

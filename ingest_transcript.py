#!/usr/bin/env python3
import requests
import json
from pathlib import Path

LIGHTRAG_API = "http://localhost:9621"


def ingest_transcript(student_name: str, file_path: Path):
    """Ingest one transcript with correct student attribution"""

    with open(file_path, "r", errors="replace") as f:
        raw_text = f.read()

    # This is the critical wrapper. This is what makes it work.
    document_text = f"""
---
STUDENT: {student_name}
FILE: {file_path.name}
PATH: {file_path.relative_to("/Users/thelaw/By Student")}
---

{raw_text}
"""

    # Send to LightRAG
    response = requests.post(
        f"{LIGHTRAG_API}/documents/text",
        json={"text": document_text, "file_source": f"{student_name}/{file_path.name}"},
        timeout=300,
    )

    response.raise_for_status()
    return response.json()


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 3:
        print("Usage: ./ingest_transcript.py <Student Name> /path/to/transcript.txt")
        sys.exit(1)

    ingest_transcript(sys.argv[1], Path(sys.argv[2]))
    print(f"✅ Ingested {sys.argv[2]} for {sys.argv[1]}")

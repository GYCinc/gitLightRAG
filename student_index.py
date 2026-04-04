#!/usr/bin/env python3
import os
import time
import hashlib
import json
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import Optional

STUDENT_ROOT = "/Users/thelaw/By Student"
INDEX_FILE = "/Users/safeSpacesBro/gitLightRAG/student_index.json"

# These are NOT students - they're resource folders, files, etc.
EXCLUDE_NAMES = {
    "materials",
    "analysis",
    "agent library",
    "agent lexical data resources",
    "agents.md",
    "agentstudenttemplate.md",
    "sessions_organized",
    "sessions_reorganized",
    "chrome_profile_notebooklm",
    "update_agents_skills.sh",
    "plan_summary.md",
    "opencode.jsonc",
    "online_viewer_net.html",
    "eagle-skill",
    ".opencode",
    ".class_prep",
    ".planning",
    ".ruff_cache",
    ".student_template",
    ".trash",
}


@dataclass
class FileEntry:
    path: str
    relative_path: str
    filename: str
    filetype: str
    size: int
    hash: str
    student: str
    mtime: float


@dataclass
class StudentEntry:
    name: str
    path: str
    transcript_count: int
    context_count: int
    audio_count: int
    total_files: int
    last_updated: float


def hash_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        h.update(f.read())
    return h.hexdigest()


def is_student_folder(name: str) -> bool:
    """Check if a folder name represents an actual student"""
    name_lower = name.lower()
    # Must not be in exclude list
    if name_lower in EXCLUDE_NAMES:
        return False
    # Must not start with dot (hidden)
    if name.startswith("."):
        return False
    # Must not be a file (like .md, .mp3, .m4a)
    if "." in name and name.split(".")[-1] in (
        "md",
        "mp3",
        "m4a",
        "mp4",
        "wav",
        "txt",
        "json",
        "sh",
        "html",
    ):
        return False
    return True


def scan_directory():
    root = Path(STUDENT_ROOT)
    files = []
    students = {}

    print(f"Scanning {root}...")

    IGNORE_PATTERNS = [
        ".git",
        ".venv",
        "venv",
        "node_modules",
        "__pycache__",
        ".DS_Store",
        "Thumbs.db",
        "*.log",
        "*.tmp",
        "*.cache",
    ]

    for path in root.rglob("*"):
        if not path.is_file():
            continue

        # Skip garbage files
        skip = False
        for part in path.parts:
            if part in IGNORE_PATTERNS:
                skip = True
                break
        if skip:
            continue
        if path.name.startswith("."):
            continue

        rel = path.relative_to(root)
        top_level = rel.parts[0] if len(rel.parts) else "unknown"

        # Skip if not a real student folder
        if not is_student_folder(top_level):
            continue

        student = top_level

        ext = path.suffix.lower()
        ftype = "other"
        if ext in (".mp3", ".wav", ".m4a", ".mp4"):
            ftype = "audio"
        elif "transcript" in path.name.lower():
            ftype = "transcript"
        elif "context" in path.name.lower():
            ftype = "context"

        entry = FileEntry(
            path=str(path),
            relative_path=str(rel),
            filename=path.name,
            filetype=ftype,
            size=path.stat().st_size,
            hash=hash_file(path),
            student=student,
            mtime=path.stat().st_mtime,
        )

        files.append(entry)

        if student not in students:
            students[student] = StudentEntry(
                name=student,
                path=str(root / student),
                transcript_count=0,
                context_count=0,
                audio_count=0,
                total_files=0,
                last_updated=0,
            )

        se = students[student]
        se.total_files += 1
        if ftype == "transcript":
            se.transcript_count += 1
        if ftype == "context":
            se.context_count += 1
        if ftype == "audio":
            se.audio_count += 1
        if entry.mtime > se.last_updated:
            se.last_updated = entry.mtime

    # Check duplicates
    hash_map = {}
    duplicates = []
    for f in files:
        if f.hash in hash_map:
            duplicates.append((hash_map[f.hash], f.path))
        else:
            hash_map[f.hash] = f.path

    index = {
        "generated": time.time(),
        "total_files": len(files),
        "total_students": len(students),
        "duplicates": duplicates,
        "students": [asdict(s) for s in students.values()],
        "files": [asdict(f) for f in files],
    }

    with open(INDEX_FILE, "w") as f:
        json.dump(index, f, indent=2)

    print(f"\n✅ Index complete:")
    print(f"   Total students: {len(students)}")
    print(f"   Total files: {len(files)}")
    print(f"   Duplicates found: {len(duplicates)}")
    print(f"\nIndex written to {INDEX_FILE}")

    return index


def ingest_student(student_name: str):
    """Ingest only transcripts and contexts for one student"""
    root = Path(STUDENT_ROOT)
    student_path = root / student_name

    print(f"Ingesting {student_name}...")

    for path in student_path.rglob("*"):
        if not path.is_file():
            continue

        name = path.name.lower()
        if "transcript" in name or "context" in name:
            with open(path, "r", errors="ignore") as f:
                text = f.read()

            # Embed student attribution directly into document text
            wrapped_text = f"""
---
STUDENT: {student_name}
SOURCE: {path.relative_to(root)}
---

{text}
"""

            # Insert into LightRAG
            print(f"  → Inserting {path.name}")


def ingest_all():
    for s in index["students"]:
        ingest_student(s["name"])


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "ingest":
        scan_directory()
        ingest_all()
    else:
        scan_directory()

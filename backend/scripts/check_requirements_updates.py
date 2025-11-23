"""Compare loose requirements.txt with pinned requirements-pinned.txt.

Usage (Windows PowerShell):
  python backend/scripts/check_requirements_updates.py

Output:
  - NEW: packages present in loose but absent in pinned (need pin)
  - REMOVED: packages in pinned but not in loose
  - VERSION_DIFF: version mismatch (suggest updating pin)

Exit codes:
  0 = No differences
  1 = Differences found
"""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
LOOSE_FILE = ROOT / "backend" / "requirements.txt"
PINNED_FILE = ROOT / "backend" / "requirements-pinned.txt"

PKG_PATTERN = re.compile(r"^(?P<name>[A-Za-z0-9_.\-]+)(==(?P<version>[^;]+))?")

def parse_requirements(path: Path):
    packages = {}
    if not path.exists():
        return packages
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        m = PKG_PATTERN.match(line)
        if not m:
            continue
        name = m.group('name').lower()
        version = m.group('version') or None
        packages[name] = version
    return packages

def main():
    loose = parse_requirements(LOOSE_FILE)
    pinned = parse_requirements(PINNED_FILE)

    new_pkgs = []
    removed_pkgs = []
    version_diff = []

    for name, ver in loose.items():
        if name not in pinned:
            new_pkgs.append(name)
        else:
            pinned_ver = pinned[name]
            if pinned_ver and ver and pinned_ver != ver:
                version_diff.append((name, ver, pinned_ver))

    for name in pinned.keys():
        if name not in loose:
            removed_pkgs.append(name)

    if not new_pkgs and not removed_pkgs and not version_diff:
        print("✅ No differences between loose and pinned requirements.")
        sys.exit(0)

    print("🔍 Requirements differences detected:\n")
    if new_pkgs:
        print("NEW (need pin):")
        for n in sorted(new_pkgs):
            print(f"  - {n}")
        print()
    if removed_pkgs:
        print("REMOVED (in pinned but not loose):")
        for n in sorted(removed_pkgs):
            print(f"  - {n}")
        print()
    if version_diff:
        print("VERSION_DIFF (loose vs pinned):")
        for n, loose_v, pinned_v in version_diff:
            print(f"  - {n}: loose={loose_v} pinned={pinned_v}")
        print()

    print("📌 Action Suggestions:")
    if new_pkgs:
        print("  * Add exact versions for NEW packages to requirements-pinned.txt")
    if removed_pkgs:
        print("  * Remove obsolete packages from requirements-pinned.txt if truly unused")
    if version_diff:
        print("  * Decide whether to upgrade pinned versions; run tests before updating")

    sys.exit(1)

if __name__ == "__main__":
    main()

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Any

VALID_CAMPUSES = {"livingston", "college_avenue", "cook_douglass", "busch"}
VALID_LIVING_TYPES = {"off_campus", "on_campus"}


def _to_int(value: str, default: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _to_float(value: str, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _normalize_row(row: dict[str, str], index: int) -> dict[str, Any] | None:
    title = row.get("title", "").strip()
    neighborhood = row.get("neighborhood", "").strip()
    campus = row.get("campus", "").strip().lower()
    living_type = row.get("livingType", "off_campus").strip().lower()

    if not title or not neighborhood or campus not in VALID_CAMPUSES or living_type not in VALID_LIVING_TYPES:
        return None

    return {
        "id": row.get("id", "").strip() or f"local_{index + 1}",
        "title": title,
        "price": max(0, _to_int(row.get("price", "0"), 0)),
        "neighborhood": neighborhood,
        "campus": campus,
        "livingType": living_type,
        "distanceToCampus": max(0.1, round(_to_float(row.get("distanceToCampus", "0.8"), 0.8), 2)),
        "availableRooms": max(1, _to_int(row.get("availableRooms", "1"), 1)),
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Import a local CSV of houses into backend snapshot JSON for demo use."
    )
    parser.add_argument(
        "--input",
        default="data/local_houses.csv",
        help="CSV path relative to backend directory (default: data/local_houses.csv)",
    )
    parser.add_argument(
        "--output",
        default="data/local_houses.json",
        help="Output JSON path relative to backend directory (default: data/local_houses.json)",
    )
    args = parser.parse_args()

    backend_dir = Path(__file__).resolve().parents[1]
    input_path = (backend_dir / args.input).resolve()
    output_path = (backend_dir / args.output).resolve()

    if not input_path.exists():
        print(f"Input file not found: {input_path}")
        print("Use app/backend/data/local_houses.csv.example as a template.")
        return 1

    rows: list[dict[str, Any]] = []
    with input_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for index, row in enumerate(reader):
            normalized = _normalize_row(row, index=index)
            if normalized:
                rows.append(normalized)

    if not rows:
        print("No valid rows found. Check campus/livingType values and required columns.")
        return 1

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    print(f"Wrote {len(rows)} listings to {output_path}")
    print("Restart backend; /api/housing/listings will now use source=local-snapshot.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

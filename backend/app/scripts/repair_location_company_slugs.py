"""One-shot repair: tag Temer location pages only; leave all other CMS rows as Ayat."""

from __future__ import annotations

import argparse
import sys

from app.data.temer_constants import (
    AYAT_COMPANY_SLUG,
    TEMER_AREA_LOCATION_IDS,
    TEMER_COMPANY_SLUG,
)
from app.db.session import SessionLocal
from app.models.inventory import LocationContent

TEMER_TITLE_FIXES = {
    ("apartment", "ayat-area"): "Ayat area (Temer)",
}


def repair(*, dry_run: bool) -> None:
    db = SessionLocal()
    try:
        rows = (
            db.query(LocationContent)
            .order_by(LocationContent.kind, LocationContent.location_id)
            .all()
        )
        temer_fixed = 0
        ayat_fixed = 0
        skipped = 0

        for row in rows:
            should_be_temer = row.location_id in TEMER_AREA_LOCATION_IDS
            target = TEMER_COMPANY_SLUG if should_be_temer else AYAT_COMPANY_SLUG

            if row.company_slug == target:
                title_key = (row.kind, row.location_id)
                if should_be_temer and title_key in TEMER_TITLE_FIXES:
                    new_title = TEMER_TITLE_FIXES[title_key]
                    if row.title != new_title:
                        print(
                            f"  title {row.kind}/{row.location_id}: "
                            f"{row.title!r} -> {new_title!r}"
                        )
                        if not dry_run:
                            row.title = new_title
                else:
                    skipped += 1
                continue

            print(
                f"  fix {row.kind}/{row.location_id}: "
                f"{row.company_slug!r} -> {target!r} ({row.title!r})"
            )
            if not dry_run:
                row.company_slug = target
                title_key = (row.kind, row.location_id)
                if should_be_temer and title_key in TEMER_TITLE_FIXES:
                    row.title = TEMER_TITLE_FIXES[title_key]
            if should_be_temer:
                temer_fixed += 1
            else:
                ayat_fixed += 1

        if dry_run:
            db.rollback()
            print(
                f"\nDry run — would fix {temer_fixed} Temer + {ayat_fixed} Ayat rows "
                f"({skipped} already ok)"
            )
        else:
            db.commit()
            print(f"\nRepaired {temer_fixed} Temer + {ayat_fixed} Ayat rows ({skipped} already ok)")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Repair location_content company_slug assignments")
    parser.add_argument("--dry-run", action="store_true", help="Print changes without saving")
    args = parser.parse_args()
    repair(dry_run=args.dry_run)


if __name__ == "__main__":
    main()
    sys.exit(0)

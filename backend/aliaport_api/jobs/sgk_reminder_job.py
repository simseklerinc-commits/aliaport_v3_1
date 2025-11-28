"""SGK hizmet listesi hatırlatma job'u."""
from __future__ import annotations

import calendar
import logging
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Iterable

from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session

from ..config.database import SessionLocal
from ..modules.cari.models import Cari
from ..modules.dijital_arsiv.models import PortalUser
from ..modules.sgk.models import SgkPeriodCheck
from ..utils.email import send_email

logger = logging.getLogger(__name__)
ISTANBUL_TZ = ZoneInfo("Europe/Istanbul")


def _is_upload_day(target_date: datetime) -> bool:
    """Check if today is the 26th or later (upload period for previous month)."""
    return target_date.day >= 26


def _get_upload_period(target_date: datetime) -> tuple[str, str]:
    """Return the period that should be uploaded (previous month if day >= 26, current month otherwise)."""
    # 26'sından itibaren bir önceki ayın dökümü yüklenmeli
    if target_date.day >= 26:
        # Bir önceki ay
        year = target_date.year
        month = target_date.month - 1
        if month == 0:
            month = 12
            year -= 1
    else:
        # İki önceki ay (henüz 26'ya gelmedik)
        year = target_date.year
        month = target_date.month - 2
        if month <= 0:
            month += 12
            year -= 1
    
    normalized = f"{year}{month:02d}"
    readable = f"{year}-{month:02d}"
    return normalized, readable


def _collect_recipients(users: Iterable[PortalUser]) -> list[str]:
    """Select recipient emails prioritizing portal admins."""
    admin_emails = {user.email for user in users if user.is_admin and user.email}
    if admin_emails:
        return sorted(admin_emails)
    fallback = {user.email for user in users if user.email}
    return sorted(fallback)


async def send_sgk_reminder_emails_job():
    """Send SGK reminder emails on the 26th of each month at 10:00."""
    today = datetime.now(ISTANBUL_TZ)
    if today.day != 26:
        logger.debug("SGK reminder skipped (not 26th): %s", today.date())
        return

    target_period, readable_period = _get_upload_period(today)
    session: Session = SessionLocal()
    firms_without_upload = 0
    total_emails = 0

    try:
        active_firms = session.query(Cari).filter(Cari.AktifMi == True).all()
        if not active_firms:
            logger.info("SGK reminder job: no active firms found")
            return
        for firma in active_firms:
            has_ok_record = (
                session.query(SgkPeriodCheck.id)
                .filter(
                    SgkPeriodCheck.firma_id == firma.Id,
                    SgkPeriodCheck.period == target_period,
                    SgkPeriodCheck.status == "OK",
                )
                .first()
            )
            if has_ok_record:
                continue
            portal_users = (
                session.query(PortalUser)
                .filter(
                    PortalUser.cari_id == firma.Id,
                    PortalUser.is_active == True,
                )
                .all()
            )
            recipients = _collect_recipients(portal_users)
            if not recipients:
                logger.debug(
                    "SGK reminder skipped for firm %s (no recipients)", firma.CariKod
                )
                continue
            subject = "SGK hizmet listesi yükleme hatırlatması"
            body_text = (
                f"{firma.Unvan} için {readable_period} dönemine ait SGK hizmet listesi henüz sisteme "
                f"yüklenmemiştir. Lütfen period kapanmadan SGK hizmet listesini portala yükleyin."
            )
            body_html = f"""
                <p>Merhaba,</p>
                <p><strong>{firma.Unvan}</strong> için <strong>{readable_period}</strong> dönemine ait SGK hizmet listesi
                henüz sisteme yüklenmemiştir.</p>
                <p>Lütfen ilgili dönemin SGK hizmet listesini portala yükleyerek iş emri süreçlerinin aksamamasını sağlayın.</p>
                <p>Teşekkürler,<br/>Aliaport Operasyon Ekibi</p>
            """
            if send_email(recipients, subject, body_html, body_text):
                firms_without_upload += 1
                total_emails += len(recipients)
            else:
                logger.error(
                    "SGK reminder email failed | firm=%s period=%s recipients=%s",
                    firma.CariKod,
                    readable_period,
                    recipients,
                )
        logger.info(
            "SGK reminder job finished | period=%s | reminded_firms=%s | emails=%s",
            readable_period,
            firms_without_upload,
            total_emails,
        )
    except Exception:
        logger.exception("SGK reminder job failed")
        raise
    finally:
        session.close()


def register_sgk_reminder_job(scheduler):
    """Register SGK reminder job to run daily at 10:00 (only acts on 26th)."""
    scheduler.add_job(
        send_sgk_reminder_emails_job,
        trigger=CronTrigger(hour=10, minute=0, timezone="Europe/Istanbul"),
        id="sgk_monthly_reminder",
        name="SGK hizmet listesi hatırlatması",
        replace_existing=True,
        misfire_grace_time=600,
        max_instances=1,
    )
    logger.info("📋 SGK reminder job registered (daily 10:00, 26th check)")

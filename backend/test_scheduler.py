"""
Test APScheduler setup
"""
import asyncio
from aliaport_api.core.scheduler import scheduler, get_scheduler_info, start_scheduler
from aliaport_api.jobs import register_jobs

async def test_scheduler():
    print("=" * 60)
    print("APScheduler Test")
    print("=" * 60)

    # Scheduler'ı başlat
    start_scheduler()

    # Job'ları kaydet
    register_jobs()

    # Info al
    info = get_scheduler_info()

    print(f"\n✅ Scheduler Running: {info['running']}")
    print(f"📋 Jobs Registered: {info['jobs_count']}")
    print(f"🌍 Timezone: {info['timezone']}")

    if info['jobs']:
        print("\nRegistered Jobs:")
        for job in info['jobs']:
            print(f"  - {job['id']}: {job['name']}")
            print(f"    Next run: {job['next_run_time']}")
            print(f"    Trigger: {job['trigger']}")

    print("\n" + "=" * 60)
    print("Test Complete")
    print("=" * 60)
    
    # Scheduler'ı durdur
    from aliaport_api.core.scheduler import shutdown_scheduler
    shutdown_scheduler()

if __name__ == "__main__":
    asyncio.run(test_scheduler())

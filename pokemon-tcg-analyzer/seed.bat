@echo off
echo Seeding database with Pokemon TCG data...
echo.
docker compose exec backend python seed.py

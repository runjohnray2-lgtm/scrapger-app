@echo off
REM ============================================================
REM  SCRAPGER Daily Scrape + Alert Check
REM  Schedule with Windows Task Scheduler (run daily at 8:00 AM)
REM
REM  To schedule:
REM    1. Open Task Scheduler → Create Basic Task
REM    2. Name: SCRAPGER Daily Scrape
REM    3. Trigger: Daily, 8:00 AM
REM    4. Action: Start a program
REM    5. Program: C:\Users\ray\Downloads\scrapger-app\scripts\daily-scrapger.bat
REM    6. Start in: C:\Users\ray\Downloads\scrapger-app
REM ============================================================

SET APP_URL=http://localhost:3099
SET LOGFILE=C:\Users\ray\Downloads\scrapger-app\data\scrapger-daily.log

echo [%DATE% %TIME%] Starting SCRAPGER daily run... >> "%LOGFILE%"

REM --- Scrape Oregon ---
echo [%DATE% %TIME%] Scraping Oregon Lottery... >> "%LOGFILE%"
curl -s "%APP_URL%/api/scrape/oregon" >> "%LOGFILE%" 2>&1
echo. >> "%LOGFILE%"

REM --- Scrape California (takes longer due to Playwright) ---
echo [%DATE% %TIME%] Scraping California Lottery... >> "%LOGFILE%"
curl -s --max-time 60 "%APP_URL%/api/scrape/california" >> "%LOGFILE%" 2>&1
echo. >> "%LOGFILE%"

REM --- Wait 5 seconds to ensure both scrapes are saved ---
timeout /t 5 /nobreak > nul

REM --- Run alert check (sends BUY signals + daily digest) ---
echo [%DATE% %TIME%] Running alert check... >> "%LOGFILE%"
curl -s -X POST "%APP_URL%/api/alerts/check" -H "Content-Type: application/json" -d "{}" >> "%LOGFILE%" 2>&1
echo. >> "%LOGFILE%"

echo [%DATE% %TIME%] Daily run complete. >> "%LOGFILE%"
echo ---------------------------------------- >> "%LOGFILE%"

@echo off
echo.
echo ================================================================================
echo   Tori Avey CMS - Performance Test
echo ================================================================================
echo.
echo Testing backend at: http://127.0.0.1:8000
echo.

echo Testing Health Check...
curl -w "\nTime: %%{time_total}s\n" -s http://127.0.0.1:8000/health -o nul
echo.

echo Testing WPRM Recipes (10 items)...
curl -w "\nTime: %%{time_total}s\n" -s http://127.0.0.1:8000/api/content/wprm-recipes?limit=10 -o nul
echo.

echo Testing Status Summary...
curl -w "\nTime: %%{time_total}s\n" -s http://127.0.0.1:8000/api/content/wprm-status-summary -o nul
echo.

echo Testing Scheduler Status...
curl -w "\nTime: %%{time_total}s\n" -s http://127.0.0.1:8000/api/wprm-scheduler/status -o nul
echo.

echo ================================================================================
echo   Results:
echo ================================================================================
echo   - If times are under 0.5s: GOOD!
echo   - If times are 0.5s - 2s: OK, could be better
echo   - If times are over 2s: SLOW, needs optimization
echo.
echo   See QUICK_FIX_SLOW_LOADING.md for solutions!
echo ================================================================================
echo.
pause

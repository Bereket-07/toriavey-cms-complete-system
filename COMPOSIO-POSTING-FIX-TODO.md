# Composio Posting Fix — Task Spec

Status: OPEN — social posting (Instagram, Twitter/X) broken in production.
Diagnosed 2026-07-03. Site, login, dashboard, content loading, approve all work.

## Problem
"Post to Instagram"/Twitter fails: composio HTTP 410 at instagram_api.py line 78 (post_image).
410 = "Gone" from Composio's API. Both platforms fail identically = Composio deprecated the
actions our old client calls.

## Root cause
backend/requirements.txt uses composio-core==0.6.10 (+ composio-langchain==0.6.10).
Composio now wants composio-core==0.7.21 (major 0.6->0.7 bump renames actions -> 410).

## Fix steps (fresh session, needs Composio dashboard)
1. Upgrade composio-core to 0.7.21 in backend/requirements.txt (do on a BRANCH).
2. Get CURRENT action names live (app.composio.dev or get_available_actions()).
3. Update action names/params in:
   - backend/src/infrastructure/apis/instagram_api.py (~line 78 post_image)
   - backend/src/infrastructure/apis/twitter_api.py
   - backend/src/use_cases/publish_content.py
4. Re-check auth connection IDs in .env under 0.7.x (re-link if needed).
5. Test SAFELY — posting hits REAL accounts. Verify backend BOOTS first
   (docker compose logs backend -> "Application startup complete").

## Risks
- Major bump may break backend boot (import changes). Test on branch before deploy.
- Real posting is public — get owner sign-off.

## Recovery if upgrade breaks backend
cd /opt/tori-cms
git checkout d5b521e -- backend/
docker compose up -d --build backend
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:7000/health   # expect 200

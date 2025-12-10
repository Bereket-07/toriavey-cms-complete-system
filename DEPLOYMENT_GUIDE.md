# Deployment Guide for ToriAveysCMS

This guide details the steps to deploy the system to your DigitalOcean droplet (`164.92.127.224`).

## Prerequisites
-   SSH access to the DigitalOcean server.
-   The SSH private key for the database tunnel (`tori-avey-keys.unknown`).

## Step 1: Prepare Local Secrets
1.  Create a folder named `secrets` in the root of your project (where `docker-compose.yml` is).
2.  Copy your SSH key `C:\Users\bekib\.ssh\tori-avey-keys.unknown` to `secrets/id_rsa`.
    -   **Important**: Ensure this file is NOT committed to git. Add `secrets/` to your `.gitignore`.

## Step 2: Setup Remote Server (One-Time)
SSH into your DigitalOcean server:
```powershell
ssh root@164.92.127.224
```

Install Docker and Docker Compose (if not installed):
```bash
# Update and install pre-reqs
apt-get update
apt-get install -y ca-certificates curl gnupg

# Add Docker's official GPG key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository
echo \
  "deb [arch=\"$(dpkg --print-architecture)\" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## Step 3: Transfer Files
You need to transfer the project files to the server. You can use correct SCP command or `rsync` if available, or simply use `git clone` if your code is pushed to a repo.

**Option A: Using SCP (assuming you are in the project root locally):**
```powershell
# Create directory on server
ssh root@164.92.127.224 "mkdir -p /opt/tori-cms"

# Copy files (excluding venv, node_modules etc. is recommended to save time)
# It is often easier to use git, but if you want to copy directly:
scp -r ./backend ./frontend ./docker-compose.yml ./secrets root@164.92.127.224:/opt/tori-cms
```

**Option B: Using Git (Recommended):**
1.  Push your code to a private repo (GitHub/GitLab).
2.  SSH into server.
3.  `git clone <your-repo-url> /opt/tori-cms`
4.  **Manually create the secrets folder and upload the key**:
    -   On local: `scp ./secrets/id_rsa root@164.92.127.224:/opt/tori-cms/secrets/`

## Step 4: Configure Environment
1.  On the server, navigate to the app folder: `cd /opt/tori-cms`
2.  Ensure `backend/.env` exists. You might need to create it or copy it from local `secrets` if you didn't commit it.
    -   `nano backend/.env` and paste your env vars.
    -   **Update DB_HOST**: Ensure `DB_HOST=db-tunnel` and `DB_PORT=3306` in this `.env` file!

## Step 5: Start Application
Run the application using Docker Compose:

```bash
docker compose up -d --build
```

-   `-d`: Detached mode (runs in background).
-   `--build`: Forces rebuilding of images.

## Step 6: Verify
1.  Check running containers: `docker compose ps`
2.  Check logs if something fails: `docker compose logs -f`
3.  Access the site: `http://164.92.127.224`

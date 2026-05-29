# Backend deployment (GitHub Actions → VPS)

Deployments run when files under `backend/` change on `main` or `master`, or when you trigger **Deploy Backend** manually.

## One-time VPS setup

1. **Node.js 20+**, **pnpm** (recommended), **PM2**, **git**, **curl**, and optionally **nginx**.
2. **Deploy directory** (example): `/var/www/finsim`
3. **Backend environment** — create `backend/.env` on the server (never commit it):

```bash
 cp backend/.env.example backend/.env
 # Edit values for production (MONGO_URI, PORT, etc.)
```

Keys must match `.env.example` exactly. The pipeline fails if a key is missing or extra. 4. **PM2** (first time, from repo root after clone):

```bash
 cd /var/www/finsim
 pm2 start ecosystem.config.cjs
 pm2 save
 pm2 startup   # follow the printed command for boot persistence
```

5. **Git access** — the VPS must clone/pull your repo. Options:

- **HTTPS + PAT**: `https://<token>@github.com/<owner>/finsim.git` (store as `VPS_REPO_URL` secret)
- **SSH deploy key**: add a read-only deploy key to the repo and use `git@github.com:<owner>/finsim.git`

6. **nginx** (optional): configure a reverse proxy to `127.0.0.1:$PORT`. The deploy runs `nginx -t` when nginx is installed. Allow passwordless test if needed:

```bash
 # /etc/sudoers.d/finsim-deploy
 deploy ALL=(root) NOPASSWD: /usr/sbin/nginx -t
```

## GitHub repository secrets

| Secret           | Description                                              |
| ---------------- | -------------------------------------------------------- |
| `VPS_HOST`       | VPS IP or hostname                                       |
| `VPS_USER`       | SSH user (e.g. `deploy`)                                 |
| `VPS_SSH_KEY`    | Private key (PEM), matching `authorized_keys` on the VPS |
| `VPS_SSH_PORT`   | Optional, default `22`                                   |
| `VPS_DEPLOY_DIR` | Absolute path, e.g. `/var/www/finsim`                    |
| `VPS_REPO_URL`   | Clone URL with deploy credentials if the repo is private |

## What the pipeline does

1. SSH into the VPS
2. Clone the repo (first run) or `git pull` (subsequent runs)
3. Compare `backend/.env` keys with `backend/.env.example` — **fail** on mismatch
4. Install dependencies (`pnpm` in the monorepo, or `npm` fallback)
5. `pm2 reload` the `finsim-api` app
6. `nginx -t` (if nginx is installed)
7. Confirm PM2 status is `online`
8. `curl` `http://127.0.0.1:$PORT/api/health` until OK

## Manual test on the VPS

```bash
export DEPLOY_DIR=/var/www/finsim
export REPO_URL='https://github.com/your-org/finsim.git'
export GIT_REF=main
bash backend/scripts/validate-env.sh backend
bash backend/scripts/deploy.sh
```

# ArcadeVerse V2

Full-stack 3D mini-game platform with accounts, cloud saves, secure score submissions, global leaderboards, coins, XP, daily challenges, season battle pass, cosmetics, inventory and an admin API.

## Stack

- Frontend: Vite + Vanilla JS + Three.js
- Backend: Node.js + Express
- Database: PostgreSQL + Prisma
- Auth: JWT + bcrypt
- Deployment: Frontend can go to GitHub Pages; backend can go to Render/Railway/Fly.io/etc.
- CORS, rate limiting, helmet and server-side reward validation included

## Project

```text
arcadeverse-v2/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   ├── src/
│   │   ├── main.js
│   │   ├── api.js
│   │   ├── state.js
│   │   └── games.js
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── auth.js
│   │   ├── gameRules.js
│   │   └── seed.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── .env.example
├── .github/workflows/
│   └── frontend-pages.yml
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Local development

### 1. Start PostgreSQL

```bash
docker compose up -d db
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Backend: `http://localhost:4000`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

Set `VITE_API_URL=http://localhost:4000/api` if needed.

## GitHub Pages

The included GitHub Actions workflow builds and publishes the frontend automatically.

Repository Settings → Pages → Source: GitHub Actions.

Set your production API URL as a repository variable:

`Settings → Secrets and variables → Actions → Variables`

Variable:

`VITE_API_URL=https://YOUR-BACKEND-DOMAIN/api`

## Backend deployment

Create a PostgreSQL database and configure:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=use-a-long-random-secret
CLIENT_ORIGIN=https://YOUR-USERNAME.github.io
PORT=4000
ADMIN_EMAIL=admin@example.com
```

Then:

```bash
npm install
npx prisma migrate deploy
npm run seed
npm start
```

The backend must be reachable from the browser. GitHub Pages only hosts the frontend.

## Security model

The browser never decides the final coin/XP reward. It submits a score and game ID. The backend validates the score against conservative server rules, calculates the reward, updates progression in a transaction, and records the score.

This is not an anti-cheat system for a competitive esports game. Client-side browser games can still be manipulated by determined users. For stronger anti-cheat, move game simulation to a trusted server or add replay/telemetry validation.

## Admin

The API includes admin endpoints for:

- creating/updating seasons
- creating cosmetics
- creating daily challenges
- viewing users

An account becomes admin when its email matches `ADMIN_EMAIL` during registration.

Do not expose admin credentials in the frontend.

## Production checklist

- Use HTTPS.
- Use a strong random `JWT_SECRET`.
- Restrict `CLIENT_ORIGIN` to your real frontend.
- Add a managed PostgreSQL database.
- Add transactional email/password reset before public launch.
- Add CAPTCHA/abuse protection for public registration.
- Add stronger score verification if leaderboards have real value.
- Never put database credentials in GitHub Pages/frontend code.

## App (PWA + Capacitor)

ArcadeVerse is now installable as a **PWA** and prepared for native Android/iOS builds with Capacitor.

1. Build the web app: `npm run build:web`
2. Sync native platforms: `npm run cap:sync`
3. Add platforms once if needed: `npx cap add android` and/or `npx cap add ios`
4. Open the native project: `npm run cap:android` / `npm run cap:ios`

The API URL is still configured through the frontend environment (`VITE_API_URL`). For a store build, point this to your deployed HTTPS backend.

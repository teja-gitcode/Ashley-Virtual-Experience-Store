# Ashley Experience Store

Walkable 3D furniture showroom. Built with React, TanStack Start, and three.js.

## Run on your computer

You need **Node.js 22** and npm.

```bash
npm install
npm run dev
```

Then open [http://localhost:8080](http://localhost:8080).

Keep port **8080**. Sign-in is wired for that origin; a random port can fail with “Invalid origin”.

| Command | What it does |
| --- | --- |
| `npm run dev` | Local app with live reload |
| `npm run build` | Production build |
| `npm run preview` | Serve the production build on port 8080 |
| `npm run typecheck` | TypeScript check |

No database setup is required. Without `DATABASE_URL` it uses a local embedded Postgres (PGLite). Sign-in (Google / X) works on `localhost:8080`. Your bag is stored in the browser until you sign in.

## Controls

- **WASD** or the on-screen stick to walk
- Drag to look
- Click / tap a piece for the tag
- **B** bag · **M** floor plan

## GitHub Pages

Push **this whole project folder** (`ashley-experience-store`) — the source, `public/`, `package.json`, and `.github/`. Do **not** push only `.output` or `node_modules`. GitHub Actions builds the site from source.

1. Create a GitHub repo and push this folder:
   ```bash
   git init
   git add .
   git commit -m "Ashley experience store"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Wait for the **Deploy GitHub Pages** workflow.

The site is at `https://<you>.github.io/<repo>/`. The bag stays in that browser's local storage.

Preview the static site locally:

```bash
npm run build:pages
npm run preview:pages
```

Then open [http://127.0.0.1:4174/](http://127.0.0.1:4174/).

## Roblox

This web app does not publish to Roblox. A Studio paste-kit lives in `public/roblox-kit/` for later.

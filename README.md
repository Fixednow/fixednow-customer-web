# FixedNow Customer Web App

Standalone deployable version of the customer app — same code as the
CustomerApp.jsx artifact, wrapped in a minimal Vite project so it can run
as a real website instead of inside a Claude artifact sandbox (which blocks
outbound fetch requests to external APIs).

## Structure

- `index.html` — entry page, loads Tailwind via CDN
- `src/main.jsx` — mounts the app
- `src/CustomerApp.jsx` — the actual app (unchanged from the artifact)

## Deploy

See the deployment walkthrough for exact steps — in short: push this whole
folder to a new GitHub repo, then create a **Static Site** on Render
pointing at it, with:

- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

No environment variables needed here — `API_BASE_URL` is hardcoded inside
`CustomerApp.jsx` itself.

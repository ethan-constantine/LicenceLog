# LicenceLog — deployment guide

This is your app, packaged so it can be hosted for free on Vercel with a real public URL.

## What's in this folder

- `src/App.jsx` — the full app (same one you've been testing)
- `src/main.jsx` — entry point that starts the app
- `index.html` — the page shell
- `package.json` / `vite.config.js` — build configuration
- Storage now uses the browser's own `localStorage` instead of the Claude-artifact-only storage, so it works as a standalone site. Everything else is unchanged.

## How to deploy to Vercel (free)

1. Go to **vercel.com** and sign up — free, no card required for the hobby tier.
2. Create a free **GitHub** account if you don't already have one (github.com).
3. Create a new GitHub repository (e.g. `licencelog`) and upload this whole folder to it. Easiest way: on the repo page, click "uploading an existing file" and drag every file in this folder in.
4. Back in Vercel, click **Add New → Project**, choose **Import Git Repository**, and select the `licencelog` repo you just created.
5. Vercel will detect it's a Vite project automatically — just click **Deploy**.
6. After a minute or two you'll get a real URL like `licencelog.vercel.app`. That's your live site.

## After deploying

- Every time you push a change to the GitHub repo, Vercel rebuilds and updates the live site automatically.
- You can later connect a custom domain (e.g. licencelog.co.uk) for free in Vercel's project settings if you buy one.

## Important — read before selling

Each visitor's data is stored **only in their own browser** (localStorage). This means:
- Their data is private and separate from everyone else's automatically — you don't need accounts for that part.
- Their data does *not* follow them across devices, and clearing browser data or using a different browser loses it — the in-app Backup & Restore feature is how they protect against that.
- Anyone who has the link can open the app and start using it for free right now. Hosting alone does not gate access — see the payment gating notes for how to actually sell it.

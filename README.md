# Mixtastic

Mixtastic is a Vite + React DJ mix planner deployed to GitHub Pages.

## Release Checklist

Before pushing a release that should go live on the hosted site:

1. Bump the version in `package.json`.
2. Run `npm run build`.
3. Run `npm run deploy` to publish the latest `dist` output to GitHub Pages.

## Cache Busting

This project uses:

- hashed asset filenames from Vite
- a version-based Workbox `cacheId` from `package.json`
- `autoUpdate`, `skipWaiting`, and `clientsClaim` in the PWA config

If the hosted site looks stale after a release, the first thing to check is whether `npm run deploy` was run after the version bump and build.

## Local Development

- `npm run dev` starts the local app
- `npm run build` creates the production build
- `npm run preview` serves the production build locally
# School Community App (Static SPA)

A static, hash-routed single page application for a privacy-minded school community prototype. This build uses only vanilla HTML, CSS, and JavaScript so it can be deployed as-is to GitHub Pages.

## Configuration

The primary configuration lives in [`src/app.js`](./src/app.js). Adjust these constants before deploying:

- `ALLOWED_DOMAINS`: Array of domain suffixes (e.g., `['@school.edu']`) allowed to sign in via the mock Google flow.
- `ADMIN_EMAIL_SEED`: Email address for the seeded administrator account created during localStorage migration.
- `IMAGE_MAX_MB`: Maximum client-side upload size (in megabytes) for feed attachments.
- `ACCESS_POLICY.readOnlyForUnapproved`: If `true`, pending accounts can browse in read-only mode; if `false`, they are redirected back to `#/login`.

After changing configuration values, refresh the browser and clear localStorage if you want to reseed fixtures.

## Deployment to GitHub Pages

1. Commit all changes to the `main` branch (or the branch configured for GitHub Pages).
2. Push to GitHub.
3. In your repository settings, enable **GitHub Pages** and choose `main` (or your branch) with the `/root` directory.
4. Wait for the build to complete, then open the GitHub Pages URL. The SPA will route using hash fragments, so deep links work without server configuration.

No bundling or build tooling is required. All assets are pre-linked via relative paths.

## Resetting Local Data During Development

All application data (users, posts, events, session) is stored in `localStorage` under the `school-community-app` key. To reset state during development:

- In the browser console run: `window.__SCHOOL_COMMUNITY_APP__.resetStorage();`
- Reload the page so the migration script reseeds fixtures (including the admin defined by `ADMIN_EMAIL_SEED`).

## Authentication and Data Disclaimer

> **TODO:** Replace the mock Google sign-in modal in [`src/pages/login.js`](./src/pages/login.js) with a production-grade provider (e.g., Google Identity Services or Firebase Auth) and back the data services with a secure database (e.g., Firestore, Supabase).

The current implementation is purely client-side and **not** secure. It should be used only for prototyping and UX validation.

# Project Guidance

## User Preferences

[No preferences yet]

## Verified Commands

**Frontend** (run from `src/frontend/`):

- **install**: `pnpm install --prefer-offline`
- **typecheck**: `pnpm typecheck`
- **lint fix**: `pnpm fix`
- **build**: `pnpm build`

**Backend** (run from `src/backend/`):

- **install**: `mops install`
- **typecheck**: `mops check --fix`
- **build**: `mops build`

**Backend and frontend integration** (run from root):

- **generate bindings**: `pnpm bindgen` This step is necessary to ensure the frontend can call the backend methods.

## Ionic Appflow (Android APK build)

The Capacitor project lives at the **repository root** so Ionic Appflow can find it. The web app source stays in `src/frontend/` (the Caffeine platform requires it there); the root-level Capacitor project is the Appflow-facing one.

- **Root `package.json`** carries the Capacitor dependencies (`@capacitor/cli`, `@capacitor/core`, `@capacitor/android`, all `^8.5.0`) and the `build:appflow` script.
- **Root `capacitor.config.ts`** sets `appId: "com.audioforge.eq"`, `appName: "AudioForge EQ"`, and `webDir: "src/frontend/dist"` so Appflow knows where the built web assets live.
- **`android/`** is the native Android project generated with `npx cap add android` from the repo root.
- **`src/frontend/capacitor.config.ts`** is the local-development config (its `webDir` is `dist` relative to `src/frontend`) and is left unchanged.

**Appflow build command** — configure Appflow to run this at the repo root:

```sh
pnpm install
pnpm run build:appflow
```

`build:appflow` (a) builds the web app into `src/frontend/dist` via `pnpm --dir src/frontend build` and (b) runs `cap sync android` to copy the built web assets into the `android/` native project. After the sync, Appflow builds the Android APK from the `android/` project.

**One-time setup**: if the `android/` native project is missing (e.g. a fresh clone), run `npx cap add android` once from the repo root before the first Appflow build. This requires the root Capacitor dependencies to be installed (`pnpm install`).

## Head Metadata (SEO and Link Previews)

`src/frontend/index.html` ships with social-sharing meta tags (`description`, `og:title`, `og:description`, `og:type`, `og:image`, `og:image:alt`, `twitter:card`, `twitter:image`). Links shared to this app only render a preview card if these tags are present in the deployed `index.html`.

When editing `index.html` (e.g. changing the title or favicon):

- **Never remove these meta tags.** Update them instead.
- Keep `og:title` identical to `<title>`, and `og:description` identical to the `description` meta tag.
- `og:image` and `twitter:image` must always point to an absolute `https://` URL. Keep the pre-configured default image unless the user explicitly provides or requests a custom share image; a custom image should be 1200×630 pixels.

## Learnings

[No learnings yet]

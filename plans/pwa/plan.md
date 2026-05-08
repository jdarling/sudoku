# Progressive Web App (PWA) — Implementation Plan

## Goal

Convert the Sudoku game into an installable PWA that works fully offline. Players can add
the app to their home screen and play without an internet connection. Fetching new puzzles
still requires online access; everything else works offline.

---

## Components

```
manifest.json          App identity and install metadata
js/sw.js               Service worker: caching, offline routing
data/icons/            App icons at required sizes
```

---

## Web App Manifest (`manifest.json`)

```json
{
  "name": "Sudoku Puzzle Game",
  "short_name": "Sudoku",
  "description": "A clean, offline-capable Sudoku puzzle game.",
  "start_url": "/index.html",
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#f5f0e8",
  "background_color": "#f5f0e8",
  "icons": [
    { "src": "data/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "data/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "data/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Add to `index.html` `<head>`:
```html
<link rel="manifest" href="manifest.json" />
<meta name="theme-color" content="#f5f0e8" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```

---

## Service Worker (`js/sw.js`)

### Cache Strategy

The service worker uses two strategies:

**Static assets — Cache First**
Cache on install. Serve from cache; ignore network unless cache is stale.
```
- index.html
- style/layout.css
- style/themes/*.css
- js/*.js
- icons/*
- manifest.json
- CDN: js-yaml.min.js (or bundle locally to avoid CDN dependency offline)
```

**Puzzle data — Network First with Cache Fallback**
Try network first (to pick up new puzzles); fall back to cache if offline.
```
- data/puzzles.json
- data/puzzles/*.yaml
```

### Cache Versioning

Cache key includes the app version: `sudoku-v1.12.0`. On activation, delete all caches
that don't match the current version key. This ensures stale assets are cleared on upgrade.

### Service Worker Lifecycle

```javascript
// Install: cache all static assets
self.addEventListener('install', (event) => { ... });

// Activate: delete old caches
self.addEventListener('activate', (event) => { ... });

// Fetch: serve from cache or network per strategy
self.addEventListener('fetch', (event) => { ... });
```

Register in `js/app.js` during `init()`:
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('js/sw.js');
}
```

---

## App Icons

Required sizes:
- 192×192px — Android home screen
- 512×512px — Splash screen, Play Store
- 512×512px maskable — Android adaptive icon (safe zone inset)
- 180×180px — Apple touch icon (already present as `apple-touch-icon.png`)

Store in `data/icons/`. Generate from a single source SVG using a script or online tool.

---

## Offline Indicator

Show a visual indicator when the app is running offline:
- Small "Offline" badge near the top of the page (subtle, not intrusive)
- "New Game" button grays out or shows tooltip "Requires internet connection" when offline
- On reconnect, badge disappears and New Game re-enables

```javascript
window.addEventListener('online', () => { /* update UI */ });
window.addEventListener('offline', () => { /* update UI */ });
```

---

## CDN Dependency Problem

Currently `js-yaml` is loaded from Cloudflare CDN:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js"></script>
```

CDN resources won't be available offline unless explicitly cached. Options:
1. Cache the CDN URL in the service worker (simplest)
2. Download and serve `js-yaml.min.js` locally (removes CDN dependency, more robust)

Option 2 is preferred: copy `js-yaml.min.js` to `js/vendor/js-yaml.min.js` and update
the script tag. Removes external dependency entirely.

---

## Install Prompt

Modern browsers show a browser-managed "Add to Home Screen" prompt. Optionally intercept
`beforeinstallprompt` to show a custom prompt at a natural moment:
- After a puzzle is solved (first win)
- After N sessions

```javascript
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  // Show custom install button / banner at an appropriate time
});
```

---

## Open Questions

1. **js-yaml vendor bundling**
   Copy `js-yaml.min.js` locally before PWA work, or cache the CDN URL in the service
   worker? Local copy is more robust for offline; CDN cache is simpler short-term.

2. **Cache all puzzles vs. subset**
   Cache all current puzzle YAML files on install, or only cache puzzles the user has
   visited? Caching all ensures full offline availability from day one; lazy caching
   reduces install size.

3. **Service worker scope**
   The service worker at `js/sw.js` will have a scope of `/js/`. It needs to be at the
   root (`/sw.js`) to intercept all page requests. Move to project root.

4. **Offline indicator design**
   Small persistent badge vs. a toast notification that appears on disconnect?
   Toast is less intrusive for brief network drops; badge is clearer for extended offline
   sessions.

5. **Version sync**
   Cache key must stay in sync with `VERSION` in `js/constants.js`. Options:
   - Import VERSION into `sw.js` (not straightforward in service workers)
   - Duplicate the version string in `sw.js` (simple, manual maintenance required)
   - Generate `sw.js` as a build step (requires adding a build step to the project)

6. **`edit.html` and PWA scope**
   Should the Puzzle Editor page (`edit.html`) also be cached and available offline?
   Depends on whether the editor ships before or after PWA work.

---

## Testing

- Verify app installs to home screen on Android and iOS
- Test full offline gameplay: load page, select puzzle, play — no network
- Test "New Game" disabled state while offline
- Test reconnect: New Game re-enables after coming back online
- Test cache update: after a new version deploys, old cache is cleared and new assets load
- Verify CDN asset (js-yaml) loads offline after being cached
- Test on Chrome (Android), Safari (iOS), and Firefox

---

## Reference Materials

```
plans/pwa/
├── plan.md     ← this file
```

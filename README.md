# Pasteup ✂

A cozy digital cutting mat. Snip clippings and paste up collages, scrapbook pages, and dedications — right in the browser, no account, no backend.

Inspired by the tactile, analog feel of a real cutting mat: a teal grid with cm rulers, a paper page in the middle, warm cream panels, and a scissors that actually cuts.

![screenshot placeholder](docs/screenshot.png)
<!-- Drop a screenshot at docs/screenshot.png -->

## What it does

- **Studio canvas** — a printed cutting-mat background with rulers, a paper page with a soft drop shadow, smooth zoom (+/−/fit, wheel, ⌘/Ctrl-scroll) and pan (space-drag or scroll).
- **Page presets & colors** — Letter, A4, Square, Postcard, Tabloid (portrait/landscape) and eight paper swatches (white, cream, kraft-tan, pink, mint, pale yellow, pale blue, black), from a bottom-toolbar popover.
- **Clippings** — add images, then move / scale / rotate with transform handles. A floating toolbar above the selection offers trim, front, back, duplicate, delete.
- **Trim / snip** ✂ — the signature feature. Pick a clipping, open the snip editor, and draw a **freehand** cut path (with an optional **torn-edge** ripple) or drag a **rectangle**. The image is clipped to the path and tightly cropped; the original is kept so you can reset the trim anytime.
- **Undo / redo** — toolbar buttons plus ⌘/Ctrl+Z and ⌘/Ctrl+Shift+Z.
- **Image sources** (left sidebar, pluggable):
  - **Upload** — file picker, drag-and-drop onto the mat, and paste from clipboard (⌘/Ctrl+V).
  - **Art** — search [Wikimedia Commons](https://commons.wikimedia.org) (with a 🎲 random button).
  - **Photos** — search [Openverse](https://openverse.org); attribution + license are stored with each clipping.
  - **URL** — import any direct image link.
- **Pages** — multiple pages per project with live thumbnails; add, switch, delete.
- **Persistence** — your project autosaves to IndexedDB, so a refresh never loses work.
- **Export** — download the current page as a 2× PNG.
- **Gallery** — submit an exported page (with a title and an optional dedication like _"for Amara ❤"_) to an on-device gallery; browse the wall, open any piece large, delete when you like.
- **First-run charm** — a little how-to clipping is waiting on the page the first time you open it.

## Tech

- [Vite](https://vitejs.dev) + React + TypeScript
- [Konva](https://konvajs.org) + `react-konva` for the canvas (free transforms, clipping)
- [Zustand](https://github.com/pmndrs/zustand) for state (with undo/redo history)
- [`idb-keyval`](https://github.com/jakearchibald/idb-keyval) for IndexedDB persistence
- No backend — everything runs client-side.

### Image sources are pluggable

Each source implements a small `ImageSource` interface (`search(query, page)` → thumb / full / attribution, plus an optional `random()`), so future connectors (a Pinterest or Instagram OAuth app, etc.) drop straight into the sidebar. See `src/sources/`.

### A note on CORS

Remote images can taint the canvas (which breaks export + trim), so everything placed on the page is normalised to a dataURL: `fetch → blob → dataURL`, falling back to a `crossOrigin` image load. Wikimedia Commons and Openverse serve CORS headers, so search results export cleanly. Instagram / Pinterest / Google Images don't offer direct API access — save the image and upload it, or paste its direct image URL.

## Develop

```bash
npm install
npm run dev      # start the dev server
npm run build    # typecheck + production build
npm run preview  # preview the production build
```

## Deploy

Configured for GitHub Pages under `/pasteup/`. A GitHub Actions workflow
(`.github/workflows/deploy.yml`) builds and deploys on every push to `main`.
Live at: **https://suleimanodetoro.github.io/pasteup/**

## Roadmap

- Shared, public gallery (a real backend so pieces can be posted and viewed by others).
- Pinterest / Instagram connectors via OAuth apps (the `ImageSource` interface is ready for them).
- Collaborative pages (multiple people on one cutting mat).
- Stickers, tape, and washi-tape decorations; text clippings; more torn/deckled edge styles.

## Credits

Powered by **Wikimedia Commons** and **Openverse**. You're responsible for the rights to any images you use.

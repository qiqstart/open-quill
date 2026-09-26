# open-quill

Open-source handwriting engine. Same aim as Pen & Quill: a letter written by hand, with the motion kept so the hand is the proof.

Dip, write with a finger or Apple Pencil, and the ink runs out, drips, and fades. A fountain nib follows pressure and tilt. Playback walks the recorded stroke. Modules can be turned off without deleting them.

MIT licensed. No accounts and no private desk in this package — just the engine other apps can embed.

## Use

```ts
import { drawLive, drawStrokes, fitView, readPencil, playList } from "open-quill";
```

The host owns the canvas, the page, and where strokes are stored. This package draws and measures.

## Modules

| Module | What it does |
|---|---|
| `fade` | Wet ink dries, then keeps a per-color body |
| `pencil` | Apple Pencil pressure, altitude, and barrel angle |
| `trace` | Playback walks along the stroke instead of jumping |
| `page-move` | Pan, pinch, and turn the sheet |
| `page-play` | Replay only the current page |
| `flags` | Turn any of those modules off |

## Test

```bash
npm install
npm test
```

Needs Node 22. Strokes are `[x, y, pressure, dt]`.

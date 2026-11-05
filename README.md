# Civic Trail: Civic District Heritage Trail (prototype)

A clickable prototype of a mobile heritage-trail app for Singapore's Civic District, built on Google Maps. It is meant for a class demo. Location is simulated with a built-in demo panel, so you can present from anywhere. The voucher redemption is a mock.

> ⚠️ **Content is draft.** The site stories in `src/data/stops.js` were drafted from public sources and must be checked by the team against [roots.gov.sg](https://www.roots.gov.sg/places/places-landing/trails/civic-district-heritage-trail) / NLB Infopedia before presenting.

## Prerequisites

- **Node.js 18+**
- A Google Maps Platform API key with **Maps JavaScript API** and **Routes API** enabled, saved in `.env` (see `.env.example`):
  ```
  GOOGLE_MAPS_API_KEY=your-key
  # optional: VITE_GOOGLE_MAP_ID=your-map-id   (defaults to DEMO_MAP_ID)
  ```
- **Key restriction:** in Google Cloud Console → Credentials → your key → *Website restrictions*, add
  `http://localhost:5173/*`. The dev server always uses port 5173 (`strictPort`), so this one entry is enough.

## Run it

```bash
npm install
npm run dev
```

Open **http://localhost:5173**. If the key is missing or rejected, the app shows the fix steps on screen instead of a blank map.

## Using the demo panel

On a laptop the panel sits beside the phone frame. On a phone, tap the floating 🧭 button.

| Control | What it does |
| --- | --- |
| **Walk** | Animates the dot along the walking route to the next stop (≈5–8 s per leg). Works with or without walking directions running. Before a route exists, it walks into the district and pauses at the boundary when the welcome prompt appears. |
| *(on the map)* | You can still drag the blue dot anywhere; geofences react live. |
| **Reset demo** | Tap twice. Clears all progress and saved data and returns to the start. |

The dot starts at War Memorial Park, just outside the district boundary, and **Reset demo** returns it there. Walking and dragging both feed one `currentLocation` source (`src/location.js`), which is the same code path real GPS would use.

## Demo script

1. The app opens on the Civic District with 22 pins; the blue dot is outside the district.
2. Tap **Walk into the district** (or drag the dot across the dashed boundary). The dot stops at the edge, the Civic District outline is highlighted, and the prompt appears with *How much time do you have?* Drag the prompt's tab down to show the whole district, and tap the tab to bring it back.
3. The time defaults to **20 min** (2 stops). For the full demo pick **45 min** (5 stops) so the "cut to 2 stops" option appears later → **Start the journey** → choose a theme (**Journey to Nationhood**, **Functions of the Civic District** or **Seeking Fortunes, Forging New Lives**) → **Build my route**.
4. A blue route plus a lighter alternative appear (tap the alternative or **Switch** to swap), with a summary card. The route starts at the stop nearest you.
5. **Walk to next stop**: the dot walks and the stop card opens on arrival.
6. **Play** the story (Pause/Stop work), **Show hint**, **Found it!**: stamp animation plays and the pin turns into a green ✓.
7. Tap **Start · walk to City Hall & Supreme Court** at the bottom of the card. Walking directions start in a Google Maps-style navigation view: a teal turn banner ("on St Andrew's Rd"), a night-style map following you, **Re-centre**, and the ETA with **Exit** at the bottom. Now press **Walk to next stop**: the banner counts down, and on arrival the directions end and the next stop card opens. Collect a second stamp, close the card and tap **Cut to next 2 stops** in the route view.
8. In the route view tap **⋯** (top right of the stops card) → **Finish journey**: the journey card is drawn; **Download PNG** (or **Share** on phones).
9. **Claim reward** → **Claim reward** → *Reward claimed*.
10. **Reset demo** (tap twice) to start again.

Tip: refreshing mid-demo keeps your progress (saved in `localStorage`).

## How it works

- **Route building** (`src/planner.js`) is simple and deterministic. It takes the stops matching the theme (and the step-free / shaded options), starts at the stop nearest the visitor, and grows the walk nearest-neighbour style, preferring the fully written stops. A small 2-opt pass then untangles the order. The route is trimmed to the time budget at 8 minutes per stop.
- **Walking routes** (`src/routing.js`) come from the Routes API, called through the Maps JS `Route` class with the REST `computeRoutes` endpoint as backup. Each ordered stop list is computed once and cached in memory and `localStorage`. If routing fails, the app draws dashed straight lines and shows an "Offline route" chip.
- **Geofencing** (`src/geofence.js`) is pure Haversine distance math plus a point-in-polygon test for the Civic District boundary (`src/data/district.js`, traced from OpenStreetMap roads and the river to match the roots.gov.sg trail map). It makes no API calls.
- **Walking directions** (`src/ui/navigation.js`) use the turn-by-turn steps that come back with the cached route, so they cost no extra API calls. Progress, the next instruction and the ETA are computed locally from `currentLocation`.
- **Bottom sheets** can be dragged between full screen, half and a minimised tab so the map stays visible. You can also tap the tab or use the arrow keys on it.
- **API usage:** only the Maps JavaScript API (map, Advanced Markers) and the Routes API. No Places, Geocoding or Street View; all names and coordinates are hardcoded.

## Editing content

- Site data and stories: `src/data/stops.js` (22 sites; 6 fully written, 16 marked `contentStatus: 'coming soon'` with short previews).
- All other on-screen text: `src/data/strings.js`.
- Demo start positions, time options, and minutes per stop: `src/config.js`.

## What's mocked

- **Reward:** a generic voucher card with a drawn, non-scannable QR-style code. Not affiliated with any real scheme.
- **Photos:** illustrated placeholders.

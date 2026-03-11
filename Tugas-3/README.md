# Tugas 3 — Graph Theory Explorer

Graph Theory Explorer is a neon-styled playground for experimenting with graph algorithms in both **3D graph space** and a dedicated **2D Island mode**. Built with React + Three.js + Zustand, it visualizes every algorithm step so you can see traversals, shortest paths, components, and grid-based island detection in motion.

https://github.com/Joji0/Algorithmic-Graph-Theory/assets

## ✨ Highlighted Features

### Graph Mode (Undirected / Directed)
- Interactive 2D & 3D canvases with smooth zoom/pan/orbit controls
- Click + drag nodes, glow effects, thick edge rendering, global animation playback
- Centralized animation engine to keep 2D & 3D views in sync
- Preset loader with 19 carefully curated graphs + JSON import/export

### Island Mode (2D Grid)
- Paint cells by clicking or dragging to define land vs water
- Animated **island detection** that reveals components cell-by-cell with per-island colors
- Live stats (count, largest/smallest/average sizes) and animation speed slider
- Dedicated toolbar (grid resize, clear, run/step/skip)

## 🧠 Algorithms Implemented

| Category | Algorithms |
| --- | --- |
| Traversal & Paths | DFS, BFS, Path Existence (shortest BFS path) |
| Connectivity | Connectivity & strong connectivity checks, Connected Components count, Largest Component size |
| Properties | Bipartite Check, Graph Diameter, Cycle Detection (directed & undirected), Girth (shortest cycle) |
| Grid | Island Count with animated component discovery |

All algorithms live in `src/core/GraphAlgorithms.ts` and mirror the OOP style from Tugas 1 & 2.

## 🛠️ Tech Stack

- **React 18 + TypeScript**
- **Zustand** for global state + animation timelines
- **@react-three/fiber / drei** + custom shaders for 3D graph rendering
- **Canvas 2D** renderer for classic view + Island mode
- **TailwindCSS + custom glassmorphism tokens**
- **Framer Motion** for panel/UI transitions
- **Vite** for dev/build tooling

## 🚀 Getting Started

```bash
cd Tugas-3
npm install
npm run dev
# open the Vite server URL shown in the terminal (usually http://127.0.0.1:5173)
```

### Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite in development with HMR |
| `npm run build` | Production build (outputs to `dist/`) |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint (if configured) |

## 🧭 Usage Guide

### 1. Choose Your Mode
- **Undirected** — regular graph editing, edges automatically mirrored
- **Directed** — arrowheads + directed algorithms
- **Island** — switches UI to the grid painter and disables graph panels

### 2. Manipulate Graphs
1. Use the **Left Panel** to load presets, add/remove nodes & edges, or import/export JSON.
2. Drag nodes directly on the canvas (2D and 3D). Scroll/drag to zoom/pan/orbit.
3. Select start/end nodes for algorithms via the Right Panel controls.

### 3. Run Algorithms
- Pick any algorithm card on the Right Panel.
- Hit **Run** to push animation steps into the scheduler.
- Animations highlight nodes/edges with descriptive captions in both canvases.

### 4. Explore Island Mode
1. Switch the top toggle to **Island**.
2. Paint land cells (click/drag) and adjust the grid size if needed.
3. Press **Run Island Detector** to watch components reveal with color-coded animation.
4. Use the speed slider to slow down or fast-forward the discovery process.

## 🗂️ Project Structure

```
Tugas-3/
├── src/
│   ├── core/
│   │   ├── Graph.ts             # Graph + Grid classes
│   │   └── GraphAlgorithms.ts   # All graph/ grid algorithms
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── GraphCanvas2D.tsx
│   │   │   ├── GraphCanvas3D.tsx
│   │   │   └── IslandCanvas.tsx
│   │   └── panels + shared UI
│   ├── hooks/                   # useForceSimulation, useAlgorithmAnimation, etc.
│   ├── store/useGraphStore.ts   # Zustand store & actions
│   ├── App.tsx                  # Layout + panel wiring
│   └── index.css                # Theme tokens, glass look
├── public/
├── package.json / tsconfig / vite config
└── README.md
```

## 📦 Preset Graphs

| Graph | Description |
| --- | --- |
| Petersen | Classic Petersen graph |
| K₅, K₆ | Complete graphs |
| K₃,₃, K₄,₄ | Complete bipartite |
| C₅, C₆, C₈ | Cycle graphs |
| S₅, S₈ | Star graphs |
| Cube | 3D cube graph |
| W₆, W₈ | Wheel graphs |
| Binary Tree | Depth-3 tree |
| Grids 3×3, 4×4 | Planar grids |
| DAG | Directed acyclic example |
| Directed Cycle | Simple directed cycle |
| Disconnected | Graph with 3 components |

## 📸 Tips

- Double-click a selected node (2D/3D) to deselect instantly.
- Use the animation speed selector (both global speed in panels + Island speed slider) to suit presentations.
- Export graphs as JSON to share with teammates or move between assignments.

Enjoy exploring graphs in style! 🎆

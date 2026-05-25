# constraint-theory-web

Static site with 46 experiments and 7 simulators for interactive math and physics visualizations. No build step required — plain HTML/CSS/JS served directly.

Deployed on Cloudflare Pages.

## Running Locally

```bash
npm install
npm run dev      # live-server on :3000
# or
npm run serve    # http-server on :8000
```

No build step. Open any `experiments/*/index.html` or `simulators/*/index.html` directly in a browser.

## Deploy

```bash
npm run deploy           # → production
npm run deploy:staging   # → staging branch
```

Requires `wrangler` configured with Cloudflare credentials. See `wrangler.toml` for caching and security headers.

## Experiments (46)

Each lives in `experiments/<name>/` with `index.html`, `app.js`, and `style.css`.

| Category | Experiments |
|----------|------------|
| **Geometry** | complex-plane, delaunay, fractal, geometric-algebra, holonomy, holonomy-explorer, hypercube, platonic, quaternion, rigidity, rigidity-4d, simplex, stereographic, topology, voronoi |
| **Physics** | diffraction, fft, fluid, fourier-series, kepler, laplace, mandelbrot, nbody, wave-interference |
| **Algorithms** | attractors, benchmarks, cellular-automata, constraint-network, entropy, error-correction, graph-theory, hidden-dimensions, holographic, holographic-encoding, langton-ant, maxflow |
| **AI/ML** | ml-constraints, ml-demo, neural-network, quantization-playground, tree-of-thoughts |
| **Math** | calculus, lissajous |
| **Softbody** | softbody, voxel-xpbd |

Each experiment is self-contained. To open one:

```bash
# Direct file access
open experiments/fractal/index.html

# Or via local server
curl http://localhost:3000/experiments/fractal/index.html
```

## Simulators (7)

Interactive tools in `simulators/<name>/`:

| Simulator | Description |
|-----------|-------------|
| **pythagorean** | Snap points to nearest Pythagorean triple on an interactive 2D plane. Shows (a,b,c) triples generated via Euclid's formula up to configurable max. |
| **kdtree** | KD-Tree spatial queries with nearest-neighbor visualization |
| **dodecet** | 12-bit orientation encoding/decoding |
| **gravity-well** | N-body gravity simulation |
| **particle-life** | Emergent behavior from simple attraction/repulsion rules |
| **spring-mass** | Spring-mass system with XPBD constraints |
| **swarm** | Flocking/swarm behavior simulation |

### Pythagorean Simulator Example

The pythagorean simulator generates all primitive Pythagorean triples using Euclid's formula:

```
a = m² - n²,  b = 2mn,  c = m² + n²
where m > n, (m+n) odd, gcd(m,n) = 1
```

Plus non-primitive multiples. Users click on the plane and the point snaps to the nearest triple with a configurable threshold.

## Adding a New Experiment

### 1. Create the directory structure

```bash
mkdir -p experiments/my-experiment
```

### 2. Create files

```
experiments/my-experiment/
├── index.html    # Canvas + UI controls
├── app.js        # Simulation logic
└── style.css     # Styling
```

### 3. Add metadata (optional but recommended)

Create `experiments/my-experiment/metadata.json`:

```json
{
  "$schema": "../../schemas/experiment.json",
  "id": "my-experiment",
  "name": "My Experiment",
  "version": "1.0.0",
  "category": "geometry",
  "difficulty": "beginner",
  "tags": ["demo", "interactive"],
  "description": {
    "short": "One-line description",
    "long": "Detailed description for the experiment page"
  },
  "educational": {
    "concepts": ["concept-1", "concept-2"],
    "prerequisites": [],
    "learningObjectives": ["Understand X", "Visualize Y"]
  }
}
```

Required fields: `id`, `name`, `version`, `category` (geometry|physics|algorithms|ai|math|art), `difficulty` (beginner|intermediate|advanced), `description`.

### 4. Validate

```bash
npm run validate    # validates JSON schemas
npm run lint        # eslint on JS files
```

### 5. Add to index

Update `index.html` to include a card linking to the new experiment.

## WASM Integration

WASM bindings for `constraint-theory-core` live in `wasm/`. **Currently a placeholder** — the actual `.wasm` binary needs to be built from the Rust crate.

### Building WASM

```bash
# Prerequisites
rustup target add wasm32-unknown-unknown
cargo install wasm-pack

# Build from constraint-theory-core
cd /path/to/constraint-theory-core
wasm-pack build --target web --out-dir /path/to/constraint-theory-web/wasm
```

### WASM API (when built)

```javascript
import { PythagoreanManifold, initWasm } from './wasm/index.js';

await initWasm();

const manifold = new PythagoreanManifold(200);
const result = manifold.snap([0.577, 0.816]);
// { exact: [0.6, 0.8], noise: 0.006, tripleId: 42, confidence: 0.994 }
```

Falls back to pure JS if WASM isn't available. Expected speedups: 8–16x for batch operations.

### Available WASM Classes

| Class | Methods |
|-------|---------|
| `PythagoreanManifold` | `snap(point)`, `snapBatch(points)`, `withinRadius(center, r)` |
| `KDTree` | `nearestNeighbor(point)`, `kNearest(point, k)`, `rangeQuery(range)` |
| `DodecetEncoder` | `encode(orientation)`, `decode(dodecet)` |

## Standalone Pages

Several standalone HTML files at the project root:

- `constraint-playground.html` — Interactive constraint exploration
- `constraint-composer.html` — Compose constraint systems
- `constraint-piano.html` — Audio/musical constraints
- `constraint-tarot.html` — Random constraint draws
- `code-music.html` — Code → music visualization

## Project Structure

```
├── index.html                  # Main landing page
├── experiments/                # 46 interactive experiments
│   └── <name>/
│       ├── index.html
│       ├── app.js
│       └── style.css
├── simulators/                 # 7 standalone simulators
│   └── <name>/
│       ├── index.html
│       ├── app.js
│       └── style.css
├── js/                         # Shared JS
│   ├── main.js                 # Core utilities
│   ├── animations.js           # Animation library
│   ├── monitoring.js           # Performance monitoring
│   └── demos/                  # Demo modules
├── css/                        # Shared CSS
│   ├── design-system.css       # Design tokens
│   ├── animations.css           # Animation classes
│   └── styles.css              # Global styles
├── wasm/                       # WASM bindings (placeholder)
├── schemas/experiment.json     # Metadata JSON schema
├── api/health.js               # Health endpoint (CF Pages Function)
├── docs/                       # Documentation
├── wrangler.toml               # Cloudflare Pages config
└── package.json
```

## License

MIT

# Onboarding Guide: constraint-theory-web

**Repository:** https://github.com/SuperInstance/constraint-theory-web
**Language:** TypeScript / HTML / CSS / JavaScript
**Version:** 0.2.0
**Last Updated:** 2025-01-27

---

## Welcome to Constraint Theory Web

**constraint-theory-web** is an interactive visualization and experimentation platform for Constraint Theory. It features **50+ simulations** (41 experiments + 9 simulators) that make abstract mathematical concepts tangible and intuitive.

### What You'll Learn

1. Running the web application locally
2. Understanding the experiment structure
3. Creating new visualizations
4. Integrating with the core library via WASM
5. Deploying to production

---

## Prerequisites

### Required

- **Node.js 18+**
- **npm** or **yarn**
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Optional

- **Rust** (for WASM compilation)
- **wasm-pack** (for building WASM modules)

---

## Installation

```bash
# Clone repository
git clone https://github.com/SuperInstance/constraint-theory-web.git
cd constraint-theory-web

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000 in your browser
```

---

## Quick Start (5 Minutes)

### 1. Run the Application

```bash
npm run dev
```

### 2. Explore Experiments

Navigate to any experiment:
- `/experiments/stereographic/` - Pythagorean manifold visualization
- `/experiments/holographic/` - Holographic encoding demo
- `/experiments/quaternion/` - 3D rotation snapping
- `/simulators/pythagorean/` - Interactive Pythagorean snapping

### 3. Try the Interactive Demos

```
┌─────────────────────────────────────────────────────────────────┐
│                    🔬 EXPERIMENTS GALLERY                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📐 GEOMETRY (12 experiments)                                   │
│  ├── Stereographic Projection - Map spheres to planes           │
│  ├── Pythagorean Snapping - Snap to exact triangles             │
│  ├── Quaternion Rotation - 3D rotation manifolds                │
│  └── Complex Plane - Julia sets and fractals                    │
│                                                                  │
│  🌀 PHYSICS (15 experiments)                                    │
│  ├── N-Body Simulation - Gravitational dynamics                 │
│  ├── Fluid Dynamics - Navier-Stokes visualization               │
│  ├── Soft Body - XPBD constraint solver                         │
│  └── Wave Interference - Constraint wave patterns               │
│                                                                  │
│  🧠 ALGORITHMS (12 experiments)                                 │
│  ├── KD-Tree Visualization - Spatial indexing                   │
│  ├── Graph Theory - Constraint networks                         │
│  ├── Max Flow - Network constraints                             │
│  └── Fourier Series - Harmonic constraints                      │
│                                                                  │
│  🎨 ART & MUSIC (10 experiments)                                │
│  ├── Mandelbrot Set - Complex constraints                       │
│  ├── Lissajous Curves - Harmonic ratios                         │
│  ├── Cellular Automata - Constraint emergence                   │
│  └── Attractors - Strange attractor manifolds                   │
│                                                                  │
│  📱 SIMULATORS (9 simulators)                                   │
│  ├── Pythagorean - Interactive snapping demo                    │
│  ├── KD-Tree - Spatial query visualization                      │
│  ├── Swarm - Multi-agent coordination                           │
│  └── Particle Life - Emergent behavior                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
constraint-theory-web/
├── index.html                    # Main entry point
├── css/
│   ├── design-system.css         # Design tokens and variables
│   ├── styles.css                # Main styles
│   ├── animations.css            # Animation definitions
│   └── demos.css                 # Demo-specific styles
├── js/
│   ├── main.js                   # Main application logic
│   ├── animations.js             # Animation controllers
│   ├── enhanced.js               # Enhanced features
│   └── demos/
│       ├── spatial-queries.js    # Spatial query demos
│       ├── dodecet-encoding.js   # Dodecet orientation demo
│       └── fps-vs-rts.js         # Game mode comparison
├── experiments/
│   ├── stereographic/            # Stereographic projection
│   │   ├── index.html
│   │   ├── app.js
│   │   ├── style.css
│   │   └── README.md
│   ├── holographic/              # Holographic encoding
│   ├── quaternion/               # Quaternion rotations
│   ├── neural-network/           # Neural network constraints
│   ├── [41 more experiments...]
├── simulators/
│   ├── pythagorean/              # Interactive Pythagorean snapping
│   ├── kdtree/                   # KD-tree visualization
│   ├── swarm/                    # Swarm intelligence
│   └── particle-life/            # Particle life simulation
├── press-kit/
│   ├── HN_TITLE.md              # Hacker News launch title
│   ├── HN_COMMENT.md            # Launch comment
│   └── HN_FAQ.md                # Anticipated FAQ
└── wrangler.toml                 # Cloudflare Workers config
```

---

## Core Concepts

### 1. Experiment Structure

Each experiment follows a standard structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Experiment Name | Constraint Theory</title>
    <link rel="stylesheet" href="../../css/styles.css">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <nav class="experiment-nav">
        <a href="../../index.html">← Back to Gallery</a>
        <h1>Experiment Name</h1>
    </nav>
    
    <main class="experiment-content">
        <canvas id="canvas"></canvas>
        <div class="controls">
            <!-- Interactive controls -->
        </div>
        <div class="explanation">
            <!-- Educational content -->
        </div>
    </main>
    
    <script src="app.js"></script>
</body>
</html>
```

### 2. JavaScript Pattern

```javascript
// app.js - Standard experiment pattern
class Experiment {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.running = false;
        this.params = {
            // Default parameters
        };
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupControls();
        this.setupAccessibility();
        this.start();
    }
    
    setupCanvas() {
        // Handle DPI scaling
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
    }
    
    setupControls() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ') this.togglePause();
            if (e.key === 'r') this.reset();
        });
        
        // Touch support
        this.canvas.addEventListener('touchstart', this.onTouch.bind(this));
    }
    
    setupAccessibility() {
        // ARIA attributes
        this.canvas.setAttribute('role', 'img');
        this.canvas.setAttribute('aria-label', 'Interactive experiment visualization');
        this.canvas.setAttribute('tabindex', '0');
    }
    
    update(dt) {
        // Update simulation state
    }
    
    render() {
        // Render to canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // ... drawing code
    }
    
    loop(timestamp) {
        if (!this.running) return;
        const dt = timestamp - this.lastTime;
        this.update(dt);
        this.render();
        this.lastTime = timestamp;
        requestAnimationFrame(this.loop.bind(this));
    }
    
    start() {
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop.bind(this));
    }
    
    pause() { this.running = false; }
    togglePause() { this.running ? this.pause() : this.start(); }
    reset() { /* Reset state */ }
    
    onTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        // Handle touch
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    new Experiment();
});
```

### 3. Accessibility Requirements

All experiments must include:

```javascript
setupAccessibility() {
    // Canvas ARIA
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', 'Description of visualization');
    this.canvas.setAttribute('tabindex', '0');
    
    // Live region for screen readers
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.className = 'sr-only';
    document.body.appendChild(this.liveRegion);
    
    // Announce changes
    this.announce('Experiment loaded. Press Space to pause.');
}

announce(message) {
    this.liveRegion.textContent = message;
}
```

### 4. Performance Optimization

```javascript
// Avoid shadowBlur (5-10x slowdown)
// BAD:
ctx.shadowBlur = 10;
ctx.shadowColor = 'rgba(0,0,0,0.5)';

// GOOD: Use solid colors or pre-rendered sprites
ctx.fillStyle = 'rgba(0,0,0,0.5)';

// Batch draw calls
ctx.beginPath();
for (const item of items) {
    ctx.moveTo(item.x, item.y);
    ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
}
ctx.fill(); // Single fill call
```

---

## Creating New Experiments

### 1. Use the Template

> **Note:** A template directory is planned. For now, copy an existing experiment like `experiments/mandelbrot/` as a starting point.

```bash
# Create new experiment directory
mkdir -p experiments/my-experiment

# Copy an existing experiment as template
cp experiments/mandelbrot/index.html experiments/my-experiment/
cp experiments/mandelbrot/style.css experiments/my-experiment/
cp experiments/mandelbrot/app.js experiments/my-experiment/
```

### 2. Implement Your Visualization

```javascript
// experiments/my-experiment/app.js
class MyExperiment extends Experiment {
    constructor() {
        super();
        this.params = {
            param1: 0.5,
            param2: 100,
        };
    }
    
    update(dt) {
        // Your physics/math here
        // Example: Constraint theory snapping
        const snapped = this.snapToPythagorean(this.point);
        this.point = snapped;
    }
    
    snapToPythagorean(point) {
        // Use constraint theory to snap to exact coordinates
        const manifold = new PythagoreanManifold();
        return manifold.snap(point);
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw snapped points
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.beginPath();
        this.ctx.arc(this.point.x, this.point.y, 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw constraint manifold
        this.drawManifold();
    }
    
    drawManifold() {
        // Visualize the constraint surface
    }
}
```

### 3. Add to Gallery

```javascript
// index.html - Add to experiments list
<div class="experiment-card">
    <a href="experiments/my-experiment/">
        <h3>My Experiment</h3>
        <p>Short description of what it demonstrates</p>
        <span class="difficulty beginner">Beginner</span>
    </a>
</div>
```

---

## WASM Integration

The web demos can optionally integrate with the Rust core library via WebAssembly for native performance.

### 1. Build WASM Module

```bash
# Prerequisites: Rust and wasm-pack
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install wasm-pack

# Build WASM from constraint-theory-core
cd ../constraint-theory-core
wasm-pack build --target web --out-dir ../constraint-theory-web/wasm
```

### 2. Use in JavaScript

```javascript
import init, { PythagoreanManifold } from './wasm/constraint_theory_core.js';

async function main() {
    await init();
    
    // Create manifold with ~1000 exact states
    const manifold = new PythagoreanManifold(200);
    
    // Snap a noisy vector to exact Pythagorean triple
    const point = [0.577, 0.816];
    const result = manifold.snap(point);
    
    console.log(`Snapped to: (${result.exact[0]}, ${result.exact[1]})`);
    console.log(`Noise: ${result.noise}`);
    // Output: Snapped to: (0.6, 0.8) - a 3-4-5 triangle!
    
    // Batch snapping (SIMD optimized)
    const points = [[0.5, 0.5], [0.7, 0.7], [0.9, 0.1]];
    const results = manifold.snap_batch(points);
}

main();
```

### 3. Performance Comparison

| Approach | Single Snap | Batch (1000) |
|----------|-------------|--------------|
| Pure JS | ~5μs | ~5ms |
| WASM | ~100ns | ~74μs |
| Speedup | **50x** | **67x** |

### Related Libraries

| Library | Language | Install |
|---------|----------|---------|
| [constraint-theory-core](https://github.com/SuperInstance/constraint-theory-core) | Rust | `cargo add constraint-theory-core` |
| [constraint-theory-python](https://github.com/SuperInstance/constraint-theory-python) | Python | `pip install constraint-theory` |
| constraint-theory-wasm | JavaScript | Build from source (see above) |

---

## Deployment

### Cloudflare Pages (Recommended)

This project is configured for Cloudflare Pages deployment with zero configuration:

```bash
# Install wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy to Cloudflare Pages
wrangler pages deploy . --project-name constraint-theory-web
```

The `wrangler.toml` configuration:
```toml
name = "constraint-theory-web"
compatibility_date = "2024-01-01"

[site]
bucket = "."
```

### Static Hosting (Netlify, Vercel, GitHub Pages)

Since this is a static site with no build step:

```bash
# Netlify CLI
netlify deploy --prod --dir=.

# Vercel CLI  
vercel --prod

# GitHub Pages (push to gh-pages branch)
git checkout -b gh-pages
git push origin gh-pages
```

### Development Server

```bash
# Python built-in server
python -m http.server 8000

# Node.js with live-server (npm install -g live-server)
live-server

# PHP built-in server
php -S localhost:8000
```

---

## Experiment Categories

### Geometry (12 experiments)

| Experiment | Description | Difficulty |
|------------|-------------|------------|
| Stereographic | Sphere to plane projection | ★★☆ |
| Pythagorean | Snap to exact triangles | ★☆☆ |
| Quaternion | 3D rotation manifolds | ★★★ |
| Complex Plane | Julia sets and fractals | ★★☆ |
| Mandelbrot | Complex constraint boundaries | ★★☆ |
| Lissajous | Harmonic curve constraints | ★☆☆ |
| Hypercube | 4D geometry projection | ★★★ |
| Voronoi | Constraint region partitioning | ★★☆ |
| Delaunay | Triangulation constraints | ★★☆ |
| Rigidity | Structural rigidity theory | ★★★ |
| Dodecet | 12-orientation encoding | ★★☆ |
| Holonomy | Geometric phase visualization | ★★★ |

### Physics (15 experiments)

| Experiment | Description | Difficulty |
|------------|-------------|------------|
| N-Body | Gravitational dynamics | ★★☆ |
| Fluid | Navier-Stokes simulation | ★★★ |
| Soft Body | XPBD constraint solver | ★★★ |
| Wave | Constraint wave interference | ★★☆ |
| Gravity Well | Gravitational potential | ★☆☆ |
| Spring Mass | Constraint dynamics | ★★☆ |
| Voxel XPBD | 3D constraint solver | ★★★ |
| Entropy | Thermodynamic constraints | ★★☆ |
| Laplace | Laplacian dynamics | ★★☆ |
| Kepler | Orbital constraints | ★★☆ |
| Attractors | Strange attractor manifolds | ★★☆ |
| NBody | N-body gravitational simulation | ★★☆ |
| Fractal | Fractal generation | ★★☆ |
| Cellular Automata | Constraint emergence | ★★☆ |
| Particle Life | Emergent behavior | ★☆☆ |

### Algorithms (12 experiments)

| Experiment | Description | Difficulty |
|------------|-------------|------------|
| KD-Tree | Spatial indexing | ★★☆ |
| Graph Theory | Constraint networks | ★★☆ |
| Max Flow | Network flow constraints | ★★★ |
| Fourier Series | Harmonic decomposition | ★★☆ |
| Simplex | Simplex algorithm | ★★★ |
| Constraint Network | CSP visualization | ★★☆ |
| Tree of Thoughts | Search constraints | ★★★ |
| Error Correction | Constraint-based ECC | ★★★ |
| Calculus | Constraint derivatives | ★★☆ |
| Benchmark | Performance comparison | ★☆☆ |
| Neural Network | NN constraint layers | ★★★ |
| Langton's Ant | Constraint emergence | ★☆☆ |

### Art & Music (10 experiments)

| Experiment | Description | Difficulty |
|------------|-------------|------------|
| Lissajous | Harmonic curves | ★☆☆ |
| Mandelbrot | Fractal art | ★★☆ |
| Attractors | Strange attractors | ★★☆ |
| Wave Interference | Constraint patterns | ★★☆ |
| Fourier Art | Harmonic art | ★★☆ |
| Golden Ratio | Pythagorean aesthetics | ★☆☆ |
| Color Manifold | Color space constraints | ★★☆ |
| Magic Eye | Autostereogram constraints | ★★★ |
| Holographic | Holographic encoding | ★★★ |
| Music Theory | Harmonic constraints | ★★☆ |

---

## Performance Guidelines

### Canvas Optimization

| Technique | Impact | When to Use |
|-----------|--------|-------------|
| Remove shadowBlur | 5-10x faster | Always - avoid expensive blur operations |
| Batch draw calls | 2-3x faster | Many similar objects (particles, lines) |
| Offscreen canvas | 2x faster | Complex static backgrounds |
| Request animation frame | Essential | All animations - never use setInterval |
| DPI scaling | Crisp rendering | High-DPI displays (Retina) |
| Object pooling | 30% less GC | High-frequency object creation |
| Typed arrays | 10-20% faster | Large data sets, particle systems |

### Memory Management

```javascript
// Reuse objects instead of creating new ones
class OptimizedExperiment {
    constructor() {
        // Pre-allocate arrays
        this.points = new Array(1000).fill(null).map(() => ({x: 0, y: 0}));
        this.currentIndex = 0;
    }
    
    addPoint(x, y) {
        // Reuse existing object
        const point = this.points[this.currentIndex];
        point.x = x;
        point.y = y;
        this.currentIndex = (this.currentIndex + 1) % this.points.length;
    }
}
```

---

## Testing

### Visual Regression

```bash
# Run visual regression tests
npm run test:visual

# Update baselines
npm run test:visual:update
```

### Accessibility Audit

```bash
# Run accessibility tests
npm run test:a11y

# Manual testing checklist:
# - [ ] All controls keyboard accessible
# - [ ] Canvas has ARIA attributes
# - [ ] Live regions announce changes
# - [ ] Color contrast ≥ 4.5:1
# - [ ] Touch targets ≥ 44px
# - [ ] Pause controls available
```

---

## API Reference

### Experiment Base Class

```javascript
class Experiment {
    // Properties
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    running: boolean;
    params: object;
    
    // Methods
    init(): void;
    setupCanvas(): void;
    setupControls(): void;
    setupAccessibility(): void;
    update(dt: number): void;
    render(): void;
    loop(timestamp: number): void;
    start(): void;
    pause(): void;
    togglePause(): void;
    reset(): void;
    announce(message: string): void;
    onTouch(event: TouchEvent): void;
}
```

### PythagoreanManifold (WASM)

```javascript
class PythagoreanManifold {
    constructor(dimensions: number, maxHypotenuse?: number);
    
    snap(point: Point): Point;
    snapBatch(points: Point[]): Point[];
    withinRadius(center: Point, radius: number): Point[];
    
    // Get underlying lattice
    getLattice(): Lattice;
}
```

---

## Resources

### Documentation

- [Main README](./README.md)
- [Schema Documentation](./docs/SCHEMA.md) - WASM exports, experiment format, constraint visualization
- [API Reference](./docs/API.md) - JavaScript API, WASM API, naming conventions
- [Deployment Guide](./docs/DEPLOYMENT.md) - Security headers, caching, monitoring, deployment
- [Design System](./css/design-system.css)
- [Experiment Template](./experiments/_template/)

### Related

- [constraint-theory-core](https://github.com/SuperInstance/constraint-theory-core) - Rust library
- [constraint-theory-python](https://github.com/SuperInstance/constraint-theory-python) - Python bindings
- [constraint-theory-research](https://github.com/SuperInstance/constraint-theory-research) - Papers

---

## Contributing

### Adding New Experiments

1. Create directory under `experiments/` or `simulators/`
2. Follow the standard structure
3. Include accessibility features
4. Add educational explanation
5. Submit PR with screenshot

### Style Guide

- Use CSS custom properties from `design-system.css`
- Follow existing naming conventions
- Ensure responsive design (mobile-first)
- Support both mouse and touch input

---

## License

MIT License - See [LICENSE](./LICENSE) for details.

---

## Next Steps

1. ✅ Clone and run the application
2. ✅ Explore the experiments gallery
3. 📖 Read experiment source code
4. 🎨 Create your own visualization
5. 🚀 Submit a PR!

**See the math. Click once. Understand forever.** 🎮🔬

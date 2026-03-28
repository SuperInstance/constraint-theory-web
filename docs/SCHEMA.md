# Schema Documentation

**Version:** 1.0.0  
**Last Updated:** 2025-01-27  
**Status**: Production Ready

---

## Table of Contents

1. [WASM Export Schema](#wasm-export-schema)
2. [Experiment Format Schema](#experiment-format-schema)
3. [Constraint Visualization Schema](#constraint-visualization-schema)
4. [API Compatibility Matrix](#api-compatibility-matrix)

---

## WASM Export Schema

The WASM module exports must match the `constraint-theory-core` Rust library API.

### Core Types

```typescript
// Point in n-dimensional space
interface Point {
  coordinates: Float32Array;
  dimension: number;
}

// Snap result from Pythagorean manifold
interface SnapResult {
  exact: Float32Array;      // Snapped exact coordinates
  noise: number;            // Distance from constraint surface
  tripleId: number;         // ID of the Pythagorean triple used
  confidence: number;       // 0.0 to 1.0, higher is better
}

// KD-tree node for spatial queries
interface KDTreeNode {
  point: Point;
  axis: number;             // Split axis (0=x, 1=y, 2=z, ...)
  left: KDTreeNode | null;
  right: KDTreeNode | null;
}

// Spatial query result
interface SpatialQueryResult {
  points: Point[];
  distances: Float32Array;
  queryTime: number;        // Microseconds
}

// Agent state in geometric space
interface AgentState {
  position: Dodecet;        // 12-bit position encoding
  orientation: number;      // Phi angle in radians
  holonomy: Float32Array;   // SO(3) rotation matrix (9 elements)
  confidence: number;       // Constraint satisfaction level
}

// Dodecet encoding (12-bit discrete orientation)
interface Dodecet {
  value: number;            // 0-4095 (12 bits)
  hex: string;              // Hex representation (0x000-0xFFF)
  bits: Uint8Array;         // Binary representation
}
```

### Core Functions

```typescript
// Initialize WASM module
function init(): Promise<void>;

// Pythagorean Manifold Operations
class PythagoreanManifold {
  constructor(maxHypotenuse?: number);
  
  // Snap a point to nearest Pythagorean triple
  snap(point: Float32Array): SnapResult;
  
  // Batch snapping (SIMD optimized)
  snapBatch(points: Float32Array[]): SnapResult[];
  
  // Find neighbors within radius
  withinRadius(center: Float32Array, radius: number): Point[];
  
  // Get underlying lattice points
  getLattice(): Point[];
  
  // Get manifold dimension
  getDimension(): number;
  
  // Get point count
  getPointCount(): number;
}

// KD-Tree Operations
class KDTree {
  constructor(points: Point[]);
  
  // Nearest neighbor query (O(log n))
  nearestNeighbor(query: Point): SpatialQueryResult;
  
  // K-nearest neighbors
  kNearest(query: Point, k: number): SpatialQueryResult;
  
  // Range query
  rangeQuery(min: Point, max: Point): Point[];
  
  // Get tree depth
  getDepth(): number;
  
  // Get node count
  getNodeCount(): number;
}

// Dodecet Encoding Operations
class DodecetEncoder {
  // Encode continuous value to 12-bit dodecet
  static encode(value: number): Dodecet;
  
  // Decode dodecet to continuous value
  static decode(dodecet: Dodecet): number;
  
  // Get orientation vector from dodecet
  static toOrientation(dodecet: Dodecet): Float32Array;
  
  // Get all 12 cardinal directions
  static getCardinalDirections(): Dodecet[];
}

// Spatial Query Operations
class SpatialIndex {
  constructor(points: Point[]);
  
  // Query neighborhood (FPS perspective)
  queryNeighborhood(
    position: Dodecet,
    radius: number
  ): SpatialQueryResult;
  
  // Get visible agents from FPS perspective
  getVisibleAgents(
    agentState: AgentState,
    maxDistance: number
  ): AgentState[];
}
```

### WASM Build Configuration

```toml
# Cargo.toml for WASM build
[package]
name = "constraint-theory-core"
version = "0.1.0"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"
js-sys = "0.3"
serde-wasm-bindgen = "0.5"

[profile.release]
opt-level = 3
lto = true
```

---

## Experiment Format Schema

All experiments follow a standardized format for consistency and discoverability.

### Directory Structure

```
experiments/{experiment-name}/
├── index.html          # Required: Main HTML file
├── app.js              # Required: Main JavaScript
├── style.css           # Optional: Custom styles
├── README.md           # Recommended: Documentation
└── metadata.json       # Optional: Machine-readable metadata
```

### Metadata Schema (metadata.json)

```json
{
  "$schema": "https://constraint-theory.superinstance.ai/schemas/experiment.json",
  "id": "stereographic-projection",
  "name": "Stereographic Projection",
  "version": "1.0.0",
  "category": "geometry",
  "difficulty": "intermediate",
  "tags": ["projection", "sphere", "conformal", "complex-analysis"],
  "description": {
    "short": "Interactive sphere-to-plane projection visualization",
    "long": "Explore stereographic projection from spheres to planes, demonstrating conformal mappings and geometric constraints."
  },
  "author": {
    "name": "Constraint Theory Team",
    "url": "https://github.com/SuperInstance"
  },
  "requiresWasm": false,
  "wasmFeatures": [],
  "accessibility": {
    "keyboardNavigable": true,
    "screenReaderSupport": true,
    "pauseControl": true
  },
  "performance": {
    "estimatedLoadTime": "<1s",
    "recommendedDevices": ["desktop", "tablet", "mobile"]
  },
  "educational": {
    "concepts": ["conformal mapping", "geometric constraints", "projection"],
    "prerequisites": [],
    "learningObjectives": [
      "Understand conformal mappings",
      "Visualize sphere-to-plane projection",
      "Explore constraint preservation"
    ]
  },
  "links": {
    "source": "https://github.com/SuperInstance/constraint-theory-web/tree/main/experiments/stereographic",
    "demo": "https://constraint-theory.superinstance.ai/experiments/stereographic/",
    "documentation": "https://github.com/SuperInstance/constraint-theory-research/blob/main/docs/STEREOGRAPHIC.md"
  }
}
```

### Experiment Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `geometry` | Geometric transformations and visualizations | stereographic, quaternion, hypercube |
| `physics` | Physical simulations with constraints | nbody, fluid, softbody |
| `algorithms` | Algorithm visualizations | kdtree, graph-theory, maxflow |
| `ai` | AI/ML related demonstrations | neural-network, tree-of-thoughts |
| `math` | Mathematical concepts | fourier-series, mandelbrot, calculus |
| `art` | Artistic visualizations | lissajous, fractal, holographic |

### Difficulty Levels

| Level | Description | Prerequisites |
|-------|-------------|---------------|
| `beginner` | No prior knowledge needed | None |
| `intermediate` | Basic math/physics helpful | High school math |
| `advanced` | Requires domain knowledge | College-level math/physics |

### Standard HTML Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="{Experiment description}">
  <meta name="keywords" content="{tags}">
  
  <!-- Standard metadata -->
  <meta name="experiment-id" content="{experiment-id}">
  <meta name="category" content="{category}">
  <meta name="difficulty" content="{difficulty}">
  
  <title>{Experiment Name} | Constraint Theory</title>
  
  <!-- Styles -->
  <link rel="stylesheet" href="../../css/design-system.css">
  <link rel="stylesheet" href="../../css/styles.css">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- Navigation -->
  <nav class="experiment-nav" role="navigation">
    <a href="../../index.html">← Gallery</a>
    <h1>{Experiment Name}</h1>
  </nav>
  
  <!-- Main content -->
  <main class="experiment-content" role="main">
    <!-- Canvas -->
    <canvas id="canvas" 
            role="img" 
            aria-label="{Description of visualization}"
            tabindex="0">
    </canvas>
    
    <!-- Controls -->
    <div class="controls" role="group" aria-label="Experiment controls">
      <!-- Standard controls -->
      <button id="playPauseBtn" aria-pressed="false">▶ Play</button>
      <button id="resetBtn">↺ Reset</button>
      
      <!-- Experiment-specific controls -->
    </div>
    
    <!-- Explanation -->
    <article class="explanation">
      <h2>What's Happening</h2>
      <p>{Educational explanation}</p>
    </article>
  </main>
  
  <!-- Screen reader announcements -->
  <div id="sr-announcements" 
       role="status" 
       aria-live="polite" 
       class="sr-only">
  </div>
  
  <script src="app.js"></script>
</body>
</html>
```

### JavaScript Experiment Class Pattern

```javascript
/**
 * Base class for all experiments
 * Provides standard lifecycle methods and accessibility features
 */
class Experiment {
  constructor(config = {}) {
    this.canvas = document.getElementById('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.running = false;
    this.lastTime = 0;
    
    // Configuration with defaults
    this.config = {
      autoStart: true,
      showFPS: false,
      ...config
    };
    
    // Parameters exposed to UI
    this.params = {};
    
    this.init();
  }
  
  init() {
    this.setupCanvas();
    this.setupControls();
    this.setupAccessibility();
    
    if (this.config.autoStart) {
      this.start();
    }
  }
  
  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }
  
  setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ') this.togglePause();
      if (e.key === 'r' || e.key === 'R') this.reset();
    });
    
    // Touch support
    this.canvas.addEventListener('touchstart', this.onTouch.bind(this));
    this.canvas.addEventListener('touchmove', this.onTouch.bind(this));
    
    // Resize handling
    window.addEventListener('resize', () => {
      this.setupCanvas();
      this.render();
    });
  }
  
  setupAccessibility() {
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', 'Interactive visualization');
    this.canvas.setAttribute('tabindex', '0');
    
    this.liveRegion = document.getElementById('sr-announcements');
  }
  
  announce(message) {
    if (this.liveRegion) {
      this.liveRegion.textContent = message;
    }
  }
  
  update(dt) {
    // Override in subclass
  }
  
  render() {
    // Override in subclass
  }
  
  loop(timestamp) {
    if (!this.running) return;
    
    const dt = timestamp - this.lastTime;
    this.lastTime = timestamp;
    
    this.update(dt);
    this.render();
    
    requestAnimationFrame(this.loop.bind(this));
  }
  
  start() {
    if (!this.running) {
      this.running = true;
      this.lastTime = performance.now();
      requestAnimationFrame(this.loop.bind(this));
      this.announce('Simulation started');
    }
  }
  
  pause() {
    this.running = false;
    this.announce('Simulation paused');
  }
  
  togglePause() {
    this.running ? this.pause() : this.start();
  }
  
  reset() {
    // Override in subclass
    this.announce('Simulation reset');
  }
  
  onTouch(e) {
    e.preventDefault();
    // Override in subclass
  }
}
```

---

## Constraint Visualization Schema

Standard format for visualizing constraints in experiments.

### Constraint Types

```typescript
// Distance constraint between two points
interface DistanceConstraint {
  type: 'distance';
  id: string;
  source: Point;
  target: Point;
  restLength: number;
  currentLength: number;
  stiffness: number;
  stress: number;          // 0.0 to 1.0, deviation from rest
}

// Angle constraint between three points
interface AngleConstraint {
  type: 'angle';
  id: string;
  vertex: Point;
  leg1: Point;
  leg2: Point;
  restAngle: number;       // Radians
  currentAngle: number;
  stiffness: number;
  stress: number;
}

// Volume constraint for a closed shape
interface VolumeConstraint {
  type: 'volume';
  id: string;
  vertices: Point[];
  restVolume: number;
  currentVolume: number;
  stiffness: number;
  stress: number;
}

// Collision constraint
interface CollisionConstraint {
  type: 'collision';
  id: string;
  particle: Point;
  obstacle: 'floor' | 'wall' | 'sphere';
  obstacleParams: Record<string, number>;
  penetration: number;
  resolved: boolean;
}

// Generic constraint union
type Constraint = 
  | DistanceConstraint 
  | AngleConstraint 
  | VolumeConstraint 
  | CollisionConstraint;
```

### Visualization Data Format

```typescript
// Frame data for rendering
interface ConstraintFrame {
  timestamp: number;
  particles: ParticleState[];
  constraints: Constraint[];
  metrics: {
    totalStress: number;
    satisfiedCount: number;
    violatedCount: number;
    avgSatisfaction: number;
  };
}

// Particle state for visualization
interface ParticleState {
  id: string;
  position: [number, number, number?];
  velocity: [number, number, number?];
  mass: number;
  pinned: boolean;
  stress: number;
}

// Visualization configuration
interface VisualizationConfig {
  showConstraints: boolean;
  showStress: boolean;
  showParticles: boolean;
  showVelocities: boolean;
  colorScheme: 'default' | 'stress' | 'velocity';
  constraintLineWidth: number;
  particleRadius: number;
  glowEffect: boolean;
}
```

### Color Encoding

```typescript
// Stress-based coloring
function getStressColor(stress: number): string {
  // stress: 0.0 (satisfied) to 1.0 (violated)
  const r = Math.floor(68 + stress * 187);   // 68 -> 255
  const g = Math.floor(102 - stress * 102);  // 102 -> 0
  const b = Math.floor(255 - stress * 187);  // 255 -> 68
  return `rgb(${r}, ${g}, ${b})`;
}

// Satisfaction gradient (for constraint networks)
function getSatisfactionColor(satisfaction: number): string {
  // satisfaction: 0.0 (violated) to 1.0 (satisfied)
  if (satisfaction > 0.7) {
    return '#34d399';  // Green - satisfied
  } else if (satisfaction > 0.3) {
    return '#fbbf24';  // Yellow - partial
  } else {
    return '#ef4444';  // Red - violated
  }
}
```

### Animation State Export

```typescript
// For recording/exporting animations
interface AnimationExport {
  metadata: {
    experimentId: string;
    frameRate: number;
    duration: number;
    dimension: { width: number; height: number };
  };
  frames: ConstraintFrame[];
  config: VisualizationConfig;
}
```

---

## API Compatibility Matrix

| Feature | JavaScript | WASM | Python | Rust Core |
|---------|------------|------|--------|-----------|
| PythagoreanManifold.snap() | ✅ | ✅ | ✅ | ✅ |
| PythagoreanManifold.snapBatch() | ❌ | ✅ | ✅ | ✅ |
| KDTree.nearestNeighbor() | ✅ | ✅ | ✅ | ✅ |
| KDTree.kNearest() | ✅ | ✅ | ✅ | ✅ |
| KDTree.rangeQuery() | ✅ | ✅ | ✅ | ✅ |
| DodecetEncoder.encode() | ✅ | ✅ | ✅ | ✅ |
| DodecetEncoder.decode() | ✅ | ✅ | ✅ | ✅ |
| SpatialIndex.queryNeighborhood() | ❌ | ✅ | ✅ | ✅ |
| AgentState serialization | ✅ | ✅ | ✅ | ✅ |
| SIMD optimization | ❌ | ✅ | ❌ | ✅ |
| GPU acceleration | ❌ | ❌ | ❌ | ✅ |

### Version Compatibility

| constraint-theory-web | constraint-theory-core | constraint-theory-python |
|----------------------|------------------------|-------------------------|
| 1.0.x | 0.1.x | 0.1.x |
| 1.1.x | 0.2.x | 0.2.x |

### Browser Support

| Browser | Version | WASM | SIMD | Status |
|---------|---------|------|------|--------|
| Chrome | 90+ | ✅ | ✅ | Full support |
| Firefox | 88+ | ✅ | ✅ | Full support |
| Safari | 14+ | ✅ | ✅ | Full support |
| Edge | 90+ | ✅ | ✅ | Full support |
| Mobile Safari | 14+ | ✅ | ⚠️ | Partial SIMD |
| Chrome Mobile | 90+ | ✅ | ⚠️ | Partial SIMD |

---

## Validation

### Schema Validation

```bash
# Validate experiment metadata
npx ajv validate -s schemas/experiment.json -d experiments/*/metadata.json

# Validate WASM exports
npm run test:wasm-exports

# Validate API compatibility
npm run test:api-compat
```

### Automated Tests

```javascript
// test/schema.test.js
describe('Schema Validation', () => {
  it('should validate all experiment metadata', async () => {
    const experiments = await glob('experiments/*/metadata.json');
    for (const file of experiments) {
      const metadata = JSON.parse(await fs.readFile(file));
      expect(validateExperimentSchema(metadata)).toBe(true);
    }
  });
  
  it('should validate WASM export signatures', async () => {
    const wasm = await import('../wasm/constraint_theory_core.js');
    expect(typeof wasm.PythagoreanManifold).toBe('function');
    expect(typeof wasm.KDTree).toBe('function');
    expect(typeof wasm.DodecetEncoder).toBe('object');
  });
});
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-27 | Initial schema documentation |

---

**Related Documentation:**
- [API Reference](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Contributing Guide](../CONTRIBUTING.md)

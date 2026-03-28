# API Reference

**Version:** 1.0.0  
**Last Updated:** 2025-01-27  
**Status**: Production Ready

---

## Table of Contents

1. [JavaScript API](#javascript-api)
2. [WASM API](#wasm-api)
3. [Naming Conventions](#naming-conventions)
4. [Parameter Standards](#parameter-standards)
5. [Deprecated APIs](#deprecated-apis)
6. [Migration Guide](#migration-guide)

---

## JavaScript API

### Core Classes

#### PythagoreanManifold (Pure JS Implementation)

```javascript
/**
 * Pure JavaScript implementation of Pythagorean manifold snapping.
 * For WASM-accelerated version, use the WASM module.
 */
class PythagoreanManifold {
  /**
   * Create a new Pythagorean manifold.
   * @param {number} maxHypotenuse - Maximum hypotenuse for triples (default: 200)
   */
  constructor(maxHypotenuse = 200) {
    this.maxHypotenuse = maxHypotenuse;
    this.triples = this.generateTriples(maxHypotenuse);
  }
  
  /**
   * Snap a point to the nearest Pythagorean triple.
   * @param {number[]} point - Input coordinates [x, y]
   * @returns {{ exact: number[], noise: number, triple: number[] }}
   */
  snap(point) {
    // Implementation
  }
  
  /**
   * Find all points within a radius.
   * @param {number[]} center - Center point [x, y]
   * @param {number} radius - Search radius
   * @returns {Array<{ point: number[], distance: number }>}
   */
  withinRadius(center, radius) {
    // Implementation
  }
  
  /**
   * Get all Pythagorean triples in the manifold.
   * @returns {Array<number[]>}
   */
  getTriples() {
    return this.triples;
  }
}
```

#### KDTree (Pure JS Implementation)

```javascript
/**
 * KD-tree implementation for O(log n) spatial queries.
 */
class KDTree {
  /**
   * Build a KD-tree from points.
   * @param {Array<{ x: number, y: number }>} points - Input points
   */
  constructor(points) {
    this.root = this.build(points);
    this.depth = 0;
    this.nodeCount = 0;
  }
  
  /**
   * Find the nearest neighbor to a query point.
   * @param {{ x: number, y: number }} queryPoint - Query point
   * @returns {{ point: { x: number, y: number }, distance: number }}
   */
  nearestNeighbor(queryPoint) {
    // Implementation - O(log n)
  }
  
  /**
   * Find k nearest neighbors.
   * @param {{ x: number, y: number }} queryPoint - Query point
   * @param {number} k - Number of neighbors
   * @returns {Array<{ point: { x: number, y: number }, distance: number }>}
   */
  kNearest(queryPoint, k) {
    // Implementation
  }
  
  /**
   * Find all points in a rectangular range.
   * @param {{ minX: number, maxX: number, minY: number, maxY: number }} range
   * @returns {Array<{ x: number, y: number }>}
   */
  rangeQuery(range) {
    // Implementation
  }
  
  /**
   * Get the depth of the tree.
   * @returns {number}
   */
  getDepth() {
    return this.depth;
  }
  
  /**
   * Get the number of nodes.
   * @returns {number}
   */
  getNodeCount() {
    return this.nodeCount;
  }
}
```

#### ConstraintNetwork

```javascript
/**
 * Constraint-based neural network for geometric learning.
 */
class ConstraintNetwork {
  /**
   * Create a constraint network with specified layer sizes.
   * @param {number[]} layers - Layer sizes, e.g., [2, 3, 1]
   */
  constructor(layers) {
    this.layers = layers;
    this.constraints = [];
    this.positions = [];
    this.satisfactions = [];
    this.initializeConstraints();
  }
  
  /**
   * Forward pass through the network.
   * @param {number[]} input - Input values
   * @returns {number[]} Output values
   */
  forward(input) {
    // Implementation using Pythagorean snapping
  }
  
  /**
   * Backward pass (constraint adjustment).
   * @param {number[]} target - Target output
   * @param {number} learningRate - Learning rate (default: 0.1)
   */
  backward(target, learningRate = 0.1) {
    // Constraint optimization learning
  }
  
  /**
   * Get total constraint count.
   * @returns {number}
   */
  getConstraintCount() {
    // Implementation
  }
  
  /**
   * Get average constraint satisfaction.
   * @returns {number} 0.0 to 1.0
   */
  getAverageSatisfaction() {
    // Implementation
  }
  
  /**
   * Get total constraint violations.
   * @returns {number}
   */
  getTotalViolations() {
    // Implementation
  }
  
  /**
   * Reset network constraints.
   */
  reset() {
    // Implementation
  }
}
```

#### XPBDSimulator

```javascript
/**
 * Extended Position-Based Dynamics simulator for soft body physics.
 */
class XPBDSimulator {
  /**
   * Create a simulator attached to a canvas.
   * @param {HTMLCanvasElement} canvas - Target canvas element
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.constraints = [];
    this.gravity = 9.8;
    this.stiffness = 0.5;
    this.iterations = 10;
    this.damping = 0.99;
  }
  
  /**
   * Create a particle at position.
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {boolean} pinned - Whether particle is fixed
   * @returns {Particle}
   */
  createParticle(x, y, pinned = false) {
    // Implementation
  }
  
  /**
   * Add a distance constraint between two particles.
   * @param {Particle} p1 - First particle
   * @param {Particle} p2 - Second particle
   * @param {number} stiffness - Constraint stiffness
   * @returns {DistanceConstraint}
   */
  addDistanceConstraint(p1, p2, stiffness = 0.5) {
    // Implementation
  }
  
  /**
   * Add a volume constraint for a set of particles.
   * @param {Particle[]} particles - Particles forming closed shape
   * @param {number} stiffness - Constraint stiffness
   * @returns {VolumeConstraint}
   */
  addVolumeConstraint(particles, stiffness = 0.3) {
    // Implementation
  }
  
  /**
   * Load a preset simulation.
   * @param {'cube' | 'rope' | 'cloth' | 'stack' | 'bridge' | 'jelly'} presetName
   */
  loadPreset(presetName) {
    // Implementation
  }
  
  /**
   * Start the simulation.
   */
  start() {
    // Implementation
  }
  
  /**
   * Stop the simulation.
   */
  stop() {
    // Implementation
  }
  
  /**
   * Step the simulation by one frame.
   */
  step() {
    // Implementation
  }
  
  /**
   * Clear all particles and constraints.
   */
  clear() {
    // Implementation
  }
}
```

### Utility Functions

```javascript
/**
 * Debounce a function call.
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function}
 */
function debounce(func, wait) { /* ... */ }

/**
 * Throttle a function call.
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls
 * @returns {Function}
 */
function throttle(func, limit) { /* ... */ }

/**
 * Query selector shorthand.
 * @param {string} selector - CSS selector
 * @returns {Element}
 */
const $ = (selector) => document.querySelector(selector);

/**
 * Query selector all shorthand.
 * @param {string} selector - CSS selector
 * @returns {NodeList}
 */
const $$ = (selector) => document.querySelectorAll(selector);
```

---

## WASM API

The WASM API mirrors the JavaScript API with additional SIMD-optimized methods.

### Loading the WASM Module

```javascript
import init, { 
  PythagoreanManifold, 
  KDTree, 
  DodecetEncoder,
  SpatialIndex 
} from './wasm/constraint_theory_core.js';

async function main() {
  // Initialize WASM module
  await init();
  
  // Now use the WASM classes
  const manifold = new PythagoreanManifold(200);
  const result = manifold.snap(new Float32Array([0.6, 0.8]));
  
  console.log(result);
  // { exact: Float32Array[0.6, 0.8], noise: 0, tripleId: 42 }
}
```

### WASM-Specific Methods

```javascript
// Batch operations (SIMD optimized, WASM only)
class PythagoreanManifold {
  /**
   * Snap multiple points in a single call.
   * Significantly faster than individual snaps.
   * @param {Float32Array[]} points - Array of points
   * @returns {SnapResult[]}
   */
  snapBatch(points) { /* WASM only */ }
}

// Spatial indexing (WASM optimized)
class SpatialIndex {
  /**
   * Query neighborhood from FPS perspective.
   * @param {Dodecet} position - Agent position
   * @param {number} radius - Query radius
   * @returns {SpatialQueryResult}
   */
  queryNeighborhood(position, radius) { /* WASM only */ }
  
  /**
   * Get all visible agents from an agent's perspective.
   * @param {AgentState} agentState - Agent state
   * @param {number} maxDistance - Maximum visibility distance
   * @returns {AgentState[]}
   */
  getVisibleAgents(agentState, maxDistance) { /* WASM only */ }
}
```

### Memory Management

```javascript
// WASM memory must be managed carefully
const manifold = new PythagoreanManifold(200);

// Create point from JS
const point = new Float32Array([0.5, 0.5]);

// Result is a view into WASM memory
const result = manifold.snap(point);

// Copy result if you need it after manifold is freed
const exact = Array.from(result.exact);

// Manually free WASM memory (optional, GC will handle it)
// manifold.free();
```

---

## Naming Conventions

### Classes

- **PascalCase**: `PythagoreanManifold`, `KDTree`, `ConstraintNetwork`
- Descriptive names indicating purpose
- Avoid abbreviations (except well-known: `KD`, `XPBD`)

### Methods

- **camelCase**: `snap()`, `nearestNeighbor()`, `getConstraintCount()`
- Verb-noun structure for actions: `createParticle()`, `addConstraint()`
- Getters prefixed with `get`: `getDepth()`, `getNodeCount()`
- Boolean getters prefixed with `is`, `has`, `can`: `isPinned()`, `hasConstraints()`

### Properties

- **camelCase**: `maxHypotenuse`, `gravity`, `stiffness`
- Boolean properties prefixed with `is`, `has`, `show`: `isRunning`, `showConstraints`
- Private properties prefixed with underscore: `_internalState`

### Constants

- **SCREAMING_SNAKE_CASE**: `MAX_ITERATIONS`, `DEFAULT_GRAVITY`
- At top of file or in config object

### Events

- **on** prefix for handlers: `onClick`, `onMouseMove`
- **handle** prefix for internal handlers: `handleClick`, `handleResize`

### Standard Parameter Names

| Parameter | Type | Description |
|-----------|------|-------------|
| `point` | `number[]` | 2D or 3D coordinate |
| `center` | `number[]` | Center point |
| `radius` | `number` | Radius for queries |
| `stiffness` | `number` | Constraint stiffness (0-1) |
| `iterations` | `number` | Solver iterations |
| `damping` | `number` | Velocity damping (0-1) |
| `learningRate` | `number` | Learning rate for training |
| `dt` | `number` | Delta time in milliseconds |
| `canvas` | `HTMLCanvasElement` | Canvas element |
| `ctx` | `CanvasRenderingContext2D` | Canvas context |

---

## Parameter Standards

### Default Values

```javascript
const DEFAULTS = {
  // Physics
  gravity: 9.8,
  stiffness: 0.5,
  damping: 0.99,
  iterations: 10,
  
  // Manifold
  maxHypotenuse: 200,
  
  // Visualization
  particleRadius: 5,
  constraintLineWidth: 1,
  
  // Animation
  targetFPS: 60,
  
  // KD-Tree
  maxDepth: 20
};
```

### Parameter Validation

```javascript
class Example {
  setGravity(value) {
    if (typeof value !== 'number') {
      throw new TypeError('gravity must be a number');
    }
    if (value < 0) {
      console.warn('Negative gravity may cause unexpected behavior');
    }
    this.gravity = value;
  }
  
  setStiffness(value) {
    // Clamp to valid range
    this.stiffness = Math.max(0, Math.min(1, value));
  }
}
```

---

## Deprecated APIs

### v1.0.0 Deprecations

| Old API | New API | Removal Version | Migration |
|---------|---------|-----------------|-----------|
| `Manifold.snap()` | `PythagoreanManifold.snap()` | 2.0.0 | Rename class |
| `Tree.query()` | `KDTree.nearestNeighbor()` | 2.0.0 | Use specific method |
| `Solver.step()` | `XPBDSimulator.step()` | 2.0.0 | Rename class |
| `network.train()` | `network.backward()` | 2.0.0 | Use backward pass |

### Deprecation Warnings

```javascript
/**
 * @deprecated Use PythagoreanManifold instead. Will be removed in v2.0.0
 */
class Manifold {
  constructor(...args) {
    console.warn(
      'Manifold is deprecated. Use PythagoreanManifold instead. ' +
      'See https://constraint-theory.superinstance.ai/docs/migration for details.'
    );
    return new PythagoreanManifold(...args);
  }
}
```

### Legacy Support

```javascript
// Maintain backward compatibility during deprecation period
export {
  PythagoreanManifold,
  PythagoreanManifold as Manifold,  // Alias for backward compatibility
  KDTree,
  KDTree as Tree,                   // Alias for backward compatibility
};
```

---

## Migration Guide

### From v0.x to v1.0

#### Renamed Classes

```javascript
// Old (v0.x)
const manifold = new Manifold(200);
const tree = new Tree(points);
const solver = new Solver(canvas);

// New (v1.0)
const manifold = new PythagoreanManifold(200);
const tree = new KDTree(points);
const solver = new XPBDSimulator(canvas);
```

#### Changed Method Names

```javascript
// Old (v0.x)
const result = tree.query(point);
network.train(target);

// New (v1.0)
const result = tree.nearestNeighbor(point);
network.backward(target);
```

#### New Return Types

```javascript
// Old (v0.x) - returned plain objects
const result = manifold.snap([0.6, 0.8]);
// result = { x: 0.6, y: 0.8, noise: 0 }

// New (v1.0) - returns typed objects
const result = manifold.snap(new Float32Array([0.6, 0.8]));
// result = { exact: Float32Array[0.6, 0.8], noise: 0, tripleId: 42, confidence: 1.0 }
```

#### Configuration Changes

```javascript
// Old (v0.x) - individual parameters
const sim = new Simulator(canvas, gravity, stiffness);

// New (v1.0) - configuration object
const sim = new XPBDSimulator(canvas);
sim.gravity = 9.8;
sim.stiffness = 0.5;
```

---

## API Stability Guarantees

### Stable (SemVer Major)

- All public class constructors
- All public method signatures
- Return types for core operations
- Event callback signatures

### Experimental (May Change)

- WASM-specific batch operations
- GPU-accelerated methods
- Plugin/extension APIs

### Internal (No Guarantee)

- Private methods (prefixed with `_`)
- Internal state structures
- Debug/development utilities

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking API changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

Current version: **1.0.0**

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-27 | Initial stable API |
| 0.2.0 | 2025-01-15 | Added XPBDSimulator |
| 0.1.0 | 2024-12-01 | Initial release |

---

**Related Documentation:**
- [Schema Documentation](./SCHEMA.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Contributing Guide](../CONTRIBUTING.md)

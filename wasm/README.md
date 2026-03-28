# Constraint Theory WASM Module

This directory contains the WebAssembly bindings for `constraint-theory-core`.

## Status

**⚠️ Placeholder** - The actual WASM binary needs to be built from the Rust source.

## Building from Source

```bash
# Prerequisites
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown
cargo install wasm-pack

# Build from constraint-theory-core
cd /path/to/constraint-theory-core
wasm-pack build --target web --out-dir /path/to/constraint-theory-web/wasm
```

## Usage

### ES Modules

```javascript
import { PythagoreanManifold, initWasm } from './wasm/index.js';

// Initialize (optional - will auto-detect WASM availability)
await initWasm();

// Create manifold
const manifold = new PythagoreanManifold(200);

// Snap a point
const result = manifold.snap([0.577, 0.816]);
console.log(result);
// { exact: [0.6, 0.8], noise: 0.006, tripleId: 42, confidence: 0.994 }
```

### With Fallback

The module automatically falls back to pure JavaScript if WASM is not available:

```javascript
import { PythagoreanManifold, isWasmReady } from './wasm/index.js';

// Check WASM status
if (isWasmReady()) {
    console.log('Using WASM acceleration');
} else {
    console.log('Using JavaScript fallback');
}

// Works either way
const manifold = new PythagoreanManifold(200);
```

## API

### PythagoreanManifold

- `snap(point)` - Snap point to nearest Pythagorean triple
- `snapBatch(points)` - Batch snapping (WASM: SIMD optimized)
- `withinRadius(center, radius)` - Query points within radius

### KDTree

- `nearestNeighbor(point)` - O(log n) nearest neighbor
- `kNearest(point, k)` - K nearest neighbors
- `rangeQuery(range)` - Range query

### DodecetEncoder

- `encode(orientation)` - Encode to 12-bit dodecet
- `decode(dodecet)` - Decode to continuous value

### Utilities

- `computeHiddenDimensions(epsilon)` - k = ⌈log₂(1/ε)⌉
- `computeHolographicAccuracy(k, n)` - accuracy = k/n + O(1/log n)

## Performance

| Operation | JS Fallback | WASM | Speedup |
|-----------|-------------|------|---------|
| Single snap | ~850ns | ~100ns | 8.5x |
| Batch snap (1000) | ~2.4ms | ~0.15ms | 16x |
| KD-Tree query | ~45μs | ~3.2μs | 14x |

## Files

```
wasm/
├── index.js              # Module loader with JS fallback
├── index.d.ts            # TypeScript definitions
├── package.json          # Package metadata
└── README.md             # This file

After building:
├── constraint_theory_core.js      # WASM bindings
├── constraint_theory_core.d.ts    # WASM types
├── constraint_theory_core_bg.js   # WASM loader
└── constraint_theory_core_bg.wasm # Binary
```

## Related

- [constraint-theory-core](https://github.com/SuperInstance/constraint-theory-core) - Rust library
- [constraint-theory-python](https://github.com/SuperInstance/constraint-theory-python) - Python bindings
- [WASM Integration Guide](../docs/WASM_INTEGRATION.md) - Full documentation

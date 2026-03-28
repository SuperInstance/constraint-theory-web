/**
 * Constraint Theory WASM Module Loader
 * 
 * This file provides a unified interface for loading the constraint-theory-core WASM module
 * with fallback to pure JavaScript implementations.
 * 
 * Build instructions:
 * 1. Install Rust and wasm-pack
 * 2. Run: wasm-pack build --target web --out-dir wasm
 * 
 * See docs/WASM_INTEGRATION.md for full documentation.
 */

// Check if WASM is available
let wasmModule = null;
let wasmReady = false;
let wasmError = null;

/**
 * Initialize the WASM module
 * @returns {Promise<boolean>} True if WASM loaded successfully
 */
export async function initWasm() {
    if (wasmReady) return true;
    if (wasmError) return false;
    
    try {
        // Try to load the WASM module
        const module = await import('./constraint_theory_core.js');
        await module.default();
        
        wasmModule = module;
        wasmReady = true;
        
        console.log('✅ Constraint Theory WASM module loaded');
        return true;
    } catch (error) {
        wasmError = error;
        console.warn('⚠️ WASM module not available, using JS fallback:', error.message);
        return false;
    }
}

/**
 * Check if WASM is ready
 * @returns {boolean}
 */
export function isWasmReady() {
    return wasmReady;
}

/**
 * Get the WASM module error if loading failed
 * @returns {Error|null}
 */
export function getWasmError() {
    return wasmError;
}

// ============================================
// Pythagorean Manifold
// ============================================

/**
 * Pythagorean Manifold for snapping to exact Pythagorean triples
 */
export class PythagoreanManifold {
    constructor(maxHypotenuse = 200) {
        this.maxHypotenuse = maxHypotenuse;
        
        if (wasmReady && wasmModule.PythagoreanManifold) {
            this._wasm = new wasmModule.PythagoreanManifold(maxHypotenuse);
        } else {
            this._lattice = this._generateLattice(maxHypotenuse);
        }
    }
    
    /**
     * Snap a point to the nearest Pythagorean triple
     * @param {Float32Array|number[]} point - The point to snap
     * @returns {{ exact: Float32Array, noise: number, tripleId: number, confidence: number }}
     */
    snap(point) {
        if (this._wasm) {
            return this._wasm.snap(point instanceof Float32Array ? point : new Float32Array(point));
        }
        return this._jsSnap(point);
    }
    
    /**
     * Batch snap multiple points
     * @param {Array} points - Array of points to snap
     * @returns {Array} Array of snap results
     */
    snapBatch(points) {
        if (this._wasm) {
            return this._wasm.snapBatch(points);
        }
        return points.map(p => this.snap(p));
    }
    
    /**
     * Query points within radius
     */
    withinRadius(center, radius) {
        if (this._wasm) {
            return this._wasm.withinRadius(center, radius);
        }
        return this._jsWithinRadius(center, radius);
    }
    
    // --- JavaScript Fallback Implementation ---
    
    _generateLattice(maxHyp) {
        const lattice = [];
        for (let m = 2; m < Math.sqrt(maxHyp); m++) {
            for (let n = 1; n < m; n++) {
                if ((m - n) % 2 === 1 && this._gcd(m, n) === 1) {
                    const a = m * m - n * n;
                    const b = 2 * m * n;
                    const c = m * m + n * n;
                    if (c <= maxHyp) {
                        lattice.push({ x: a / c, y: b / c, a, b, c });
                        lattice.push({ x: b / c, y: a / c, a: b, b: a, c });
                    }
                }
            }
        }
        return lattice;
    }
    
    _gcd(a, b) {
        return b === 0 ? a : this._gcd(b, a % b);
    }
    
    _jsSnap(point) {
        const px = point[0];
        const py = point[1];
        
        let best = null;
        let minDist = Infinity;
        
        for (const lattice of this._lattice) {
            const dist = Math.hypot(px - lattice.x, py - lattice.y);
            if (dist < minDist) {
                minDist = dist;
                best = lattice;
            }
        }
        
        return {
            exact: new Float32Array([best.x, best.y]),
            noise: minDist,
            tripleId: this._lattice.indexOf(best),
            confidence: 1 - minDist
        };
    }
    
    _jsWithinRadius(center, radius) {
        const cx = center[0];
        const cy = center[1];
        
        return this._lattice
            .filter(l => Math.hypot(l.x - cx, l.y - cy) <= radius)
            .map(l => ({ x: l.x, y: l.y }));
    }
}

// ============================================
// KD-Tree Spatial Index
// ============================================

/**
 * KD-Tree for O(log n) spatial queries
 */
export class KDTree {
    constructor(points) {
        this.points = points;
        
        if (wasmReady && wasmModule.KDTree) {
            this._wasm = new wasmModule.KDTree(points);
        } else {
            this._root = this._buildTree(points, 0);
        }
    }
    
    /**
     * Find nearest neighbor
     * @param {Object} point - Query point
     * @returns {Object} Nearest point and distance
     */
    nearestNeighbor(point) {
        if (this._wasm) {
            return this._wasm.nearestNeighbor(point);
        }
        return this._jsNearest(point);
    }
    
    /**
     * Find k nearest neighbors
     */
    kNearest(point, k) {
        if (this._wasm) {
            return this._wasm.kNearest(point, k);
        }
        return this._jsKNearest(point, k);
    }
    
    /**
     * Range query
     */
    rangeQuery(range) {
        if (this._wasm) {
            return this._wasm.rangeQuery(range);
        }
        return this._jsRangeQuery(range);
    }
    
    // --- JavaScript Fallback Implementation ---
    
    _buildTree(points, depth) {
        if (!points || points.length === 0) return null;
        
        const axis = depth % 2;
        points.sort((a, b) => a[axis === 0 ? 'x' : 'y'] - b[axis === 0 ? 'x' : 'y']);
        
        const mid = Math.floor(points.length / 2);
        
        return {
            point: points[mid],
            left: this._buildTree(points.slice(0, mid), depth + 1),
            right: this._buildTree(points.slice(mid + 1), depth + 1),
            axis
        };
    }
    
    _jsNearest(point, node = this._root, best = null, bestDist = Infinity) {
        if (!node) return { point: best, distance: bestDist };
        
        const dist = Math.hypot(point.x - node.point.x, point.y - node.point.y);
        if (dist < bestDist) {
            best = node.point;
            bestDist = dist;
        }
        
        const axis = node.axis;
        const diff = point[axis === 0 ? 'x' : 'y'] - node.point[axis === 0 ? 'x' : 'y'];
        
        const near = diff < 0 ? node.left : node.right;
        const far = diff < 0 ? node.right : node.left;
        
        const result = this._jsNearest(point, near, best, bestDist);
        if (result.distance < bestDist) {
            best = result.point;
            bestDist = result.distance;
        }
        
        if (Math.abs(diff) < bestDist) {
            const farResult = this._jsNearest(point, far, best, bestDist);
            if (farResult.distance < bestDist) {
                best = farResult.point;
                bestDist = farResult.distance;
            }
        }
        
        return { point: best, distance: bestDist };
    }
    
    _jsKNearest(point, k) {
        const distances = this.points.map(p => ({
            point: p,
            distance: Math.hypot(point.x - p.x, point.y - p.y)
        }));
        
        distances.sort((a, b) => a.distance - b.distance);
        return distances.slice(0, k);
    }
    
    _jsRangeQuery(range) {
        return this.points.filter(p => 
            p.x >= range.minX && p.x <= range.maxX &&
            p.y >= range.minY && p.y <= range.maxY
        );
    }
}

// ============================================
// Dodecet Encoder
// ============================================

/**
 * 12-orientation encoding for direction vectors
 */
export class DodecetEncoder {
    static encode(orientation) {
        if (wasmReady && wasmModule.DodecetEncoder) {
            return wasmModule.DodecetEncoder.encode(orientation);
        }
        return this._jsEncode(orientation);
    }
    
    static decode(dodecet) {
        if (wasmReady && wasmModule.DodecetEncoder) {
            return wasmModule.DodecetEncoder.decode(dodecet);
        }
        return this._jsDecode(dodecet);
    }
    
    static _jsEncode(orientation) {
        const value = Math.floor(orientation * 4096) & 0xFFF;
        return {
            value,
            hex: '0x' + value.toString(16).toUpperCase().padStart(3, '0'),
            bits: value.toString(2).padStart(12, '0').split('').map(Number)
        };
    }
    
    static _jsDecode(dodecet) {
        const value = typeof dodecet === 'object' ? dodecet.value : dodecet;
        return value / 4096;
    }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Compute hidden dimensions needed for precision
 * k = ceil(log2(1/epsilon))
 */
export function computeHiddenDimensions(epsilon) {
    return Math.ceil(Math.log2(1 / epsilon));
}

/**
 * Compute holographic accuracy
 * accuracy(k, n) = k/n + O(1/log n)
 */
export function computeHolographicAccuracy(k, n) {
    return k / n + 1 / Math.log(n + 1);
}

// Default export
export default {
    initWasm,
    isWasmReady,
    getWasmError,
    PythagoreanManifold,
    KDTree,
    DodecetEncoder,
    computeHiddenDimensions,
    computeHolographicAccuracy
};

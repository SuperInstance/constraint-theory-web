/**
 * Constraint Theory WASM Module - TypeScript Definitions
 */

// Module initialization
export function initWasm(): Promise<boolean>;
export function isWasmReady(): boolean;
export function getWasmError(): Error | null;

// Pythagorean Manifold
export class PythagoreanManifold {
    constructor(maxHypotenuse?: number);
    
    snap(point: Float32Array | number[]): SnapResult;
    snapBatch(points: Array<Float32Array | number[]>): SnapResult[];
    withinRadius(center: Float32Array | number[], radius: number): Array<{ x: number; y: number }>;
}

export interface SnapResult {
    exact: Float32Array;
    noise: number;
    tripleId: number;
    confidence: number;
}

// KD-Tree
export class KDTree {
    constructor(points: Array<{ x: number; y: number }>);
    
    nearestNeighbor(point: { x: number; y: number }): NearestResult;
    kNearest(point: { x: number; y: number }, k: number): NearestResult[];
    rangeQuery(range: RangeQuery): Array<{ x: number; y: number }>;
}

export interface NearestResult {
    point: { x: number; y: number };
    distance: number;
    queryTime?: number;
}

export interface RangeQuery {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
}

// Dodecet Encoder
export class DodecetEncoder {
    static encode(orientation: number): DodecetResult;
    static decode(dodecet: DodecetResult | number): number;
    static toOrientation(dodecet: DodecetResult): Float32Array;
    static getCardinalDirections(): Float32Array[];
}

export interface DodecetResult {
    value: number;
    hex: string;
    bits: number[];
}

// Utility functions
export function computeHiddenDimensions(epsilon: number): number;
export function computeHolographicAccuracy(k: number, n: number): number;

// Default export
declare const _default: {
    initWasm: typeof initWasm;
    isWasmReady: typeof isWasmReady;
    getWasmError: typeof getWasmError;
    PythagoreanManifold: typeof PythagoreanManifold;
    KDTree: typeof KDTree;
    DodecetEncoder: typeof DodecetEncoder;
    computeHiddenDimensions: typeof computeHiddenDimensions;
    computeHolographicAccuracy: typeof computeHolographicAccuracy;
};

export default _default;

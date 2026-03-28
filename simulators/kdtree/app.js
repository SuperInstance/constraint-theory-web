/**
 * KD-Tree Visualization - Enhanced for Constraint Theory
 * Interactive simulator for spatial partitioning and range queries
 * Shows exact Pythagorean coordinate snapping vs traditional floating-point approaches
 * Part of Constraint Theory - https://constraint-theory.superinstance.ai
 */

class Point {
    constructor(x, y, triple = null) {
        this.x = x;
        this.y = y;
        this.triple = triple; // Pythagorean triple [a, b, c]
    }

    distance(other) {
        return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
    }
}

class KDNode {
    constructor(point, axis, left = null, right = null) {
        this.point = point;
        this.axis = axis; // 0 for x-axis (vertical split), 1 for y-axis (horizontal split)
        this.left = left;
        this.right = right;
    }
}

class KDTree {
    constructor() {
        this.root = null;
        this.nodes = [];
        this.depth = 0;
    }

    build(points, depth = 0) {
        if (points.length === 0) return null;

        const axis = depth % 2;
        points.sort((a, b) => axis === 0 ? a.x - b.x : a.y - b.y);

        const mid = Math.floor(points.length / 2);
        const node = new KDNode(
            points[mid],
            axis,
            this.build(points.slice(0, mid), depth + 1),
            this.build(points.slice(mid + 1), depth + 1)
        );

        this.depth = Math.max(this.depth, depth);
        this.nodes.push(node);
        return node;
    }

    nearestNeighbor(queryPoint, node = this.root, depth = 0, best = null, bestDist = Infinity) {
        if (node === null) return { point: best, distance: bestDist };

        const axis = node.axis;
        const queryCoord = axis === 0 ? queryPoint.x : queryPoint.y;
        const nodeCoord = axis === 0 ? node.point.x : node.point.y;

        let nearer, further;
        if (queryCoord < nodeCoord) {
            nearer = node.left;
            further = node.right;
        } else {
            nearer = node.right;
            further = node.left;
        }

        const result = this.nearestNeighbor(queryPoint, nearer, depth + 1, best, bestDist);
        best = result.point;
        bestDist = result.distance;

        const currentDist = queryPoint.distance(node.point);
        if (currentDist < bestDist) {
            best = node.point;
            bestDist = currentDist;
        }

        const distToPlane = Math.abs(queryCoord - nodeCoord);
        if (distToPlane < bestDist) {
            const otherResult = this.nearestNeighbor(queryPoint, further, depth + 1, best, bestDist);
            if (otherResult.distance < bestDist) {
                best = otherResult.point;
                bestDist = otherResult.distance;
            }
        }

        return { point: best, distance: bestDist };
    }

    rangeQuery(range, node = this.root, results = []) {
        if (node === null) return results;

        if (node.point.x >= range.minX && node.point.x <= range.maxX &&
            node.point.y >= range.minY && node.point.y <= range.maxY) {
            results.push(node.point);
        }

        const axis = node.axis;
        const nodeCoord = axis === 0 ? node.point.x : node.point.y;
        const rangeMin = axis === 0 ? range.minX : range.minY;
        const rangeMax = axis === 0 ? range.maxX : range.maxY;

        if (nodeCoord >= rangeMin) {
            this.rangeQuery(range, node.left, results);
        }

        if (nodeCoord <= rangeMax) {
            this.rangeQuery(range, node.right, results);
        }

        return results;
    }

    reset() {
        this.root = null;
        this.nodes = [];
        this.depth = 0;
    }
}

// Pythagorean triples for exact coordinates
const PYTHAGOREAN_TRIPLES = [
    [3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25],
    [6, 8, 10], [9, 12, 15], [12, 16, 20], [15, 20, 25],
    [10, 24, 26], [20, 21, 29], [18, 24, 30], [16, 30, 34],
    [21, 28, 35], [24, 32, 40], [27, 36, 45], [30, 40, 50]
];

class KDTreeVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.points = [];
        this.tree = new KDTree();
        this.mode = 'add';
        this.animationSpeed = 50;
        this.isPaused = false;
        this.searchPath = [];
        this.queryResult = null;
        this.rangeQueryResult = [];
        this.currentRange = null;
        this.buildSteps = [];
        this.currentBuildStep = 0;
        this.comparisons = 0;
        this.time = 0;
        this.queryPoint = null;
        this.animationFrame = null;

        this.setupCanvas();
        this.setupEventListeners();
        this.startAnimation();
    }

    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvasWidth = rect.width;
        this.canvasHeight = rect.height;
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        document.getElementById('btnAddRandom').addEventListener('click', () => this.addPythagoreanPoints(10));
        document.getElementById('btnAdd50').addEventListener('click', () => this.addPythagoreanPoints(50));
        document.getElementById('btnClear').addEventListener('click', () => this.clearAll());
        document.getElementById('btnBuild').addEventListener('click', () => this.buildTree());
        document.getElementById('btnStepBuild').addEventListener('click', () => this.stepBuild());
        document.getElementById('btnResetTree').addEventListener('click', () => this.resetTree());
        document.getElementById('btnNearestNeighbor').addEventListener('click', () => this.setMode('nearest'));
        document.getElementById('btnRangeQuery').addEventListener('click', () => this.setMode('range'));
        document.getElementById('btnClearQuery').addEventListener('click', () => this.clearQuery());

        const speedSlider = document.getElementById('speedSlider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                this.animationSpeed = 210 - parseInt(e.target.value);
                document.getElementById('speedValue').textContent = e.target.value;
            });
        }

        const btnPause = document.getElementById('btnPause');
        if (btnPause) {
            btnPause.addEventListener('click', () => {
                this.isPaused = !this.isPaused;
            });
        }
    }

    startAnimation() {
        const animate = () => {
            if (!this.isPaused) {
                this.time += 0.016;
                this.render();
            }
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.mode === 'add') {
            const triple = PYTHAGOREAN_TRIPLES[Math.floor(Math.random() * PYTHAGOREAN_TRIPLES.length)];
            this.points.push(new Point(x, y, triple));
            this.updateStats();
        } else if (this.mode === 'nearest') {
            this.queryPoint = new Point(x, y);
            this.performNearestNeighbor(this.queryPoint);
        } else if (this.mode === 'range') {
            this.performRangeQuery(new Point(x, y));
        }
    }

    addPythagoreanPoints(count) {
        const margin = 60;
        for (let i = 0; i < count; i++) {
            const triple = PYTHAGOREAN_TRIPLES[i % PYTHAGOREAN_TRIPLES.length];
            const scale = 6 + Math.random() * 8;
            const x = margin + triple[0] * scale + Math.random() * 30;
            const y = margin + triple[1] * scale + Math.random() * 30;
            this.points.push(new Point(x, y, triple));
        }
        this.updateStats();
    }

    clearAll() {
        this.points = [];
        this.resetTree();
    }

    buildTree() {
        if (this.points.length === 0) return;

        this.tree.reset();
        this.tree.build([...this.points]);
        this.updateStats();
    }

    stepBuild() {
        if (this.points.length === 0) return;

        this.tree.reset();
        this.generateBuildSteps([...this.points], 0, null, 'root', this.canvasWidth, this.canvasHeight, 0, 0);
        this.currentBuildStep = 0;
        this.animateBuild();
    }

    generateBuildSteps(points, depth, parent, direction, boundsMin, boundsMax, x, y) {
        if (points.length === 0) return;

        const axis = depth % 2;
        points.sort((a, b) => axis === 0 ? a.x - b.x : a.y - b.y);

        const mid = Math.floor(points.length / 2);
        const point = points[mid];

        let splitLine;
        if (axis === 0) {
            splitLine = {
                type: 'vertical',
                x: point.x,
                yMin: y,
                yMax: y + (boundsMax - boundsMin),
                depth: depth
            };
        } else {
            splitLine = {
                type: 'horizontal',
                y: point.y,
                xMin: x,
                xMax: x + (boundsMax - boundsMin),
                depth: depth
            };
        }

        this.buildSteps.push({
            point: point,
            splitLine: splitLine,
            depth: depth
        });

        const half = (boundsMax - boundsMin) / 2;
        if (axis === 0) {
            this.generateBuildSteps(points.slice(0, mid), depth + 1, point, 'left', boundsMin, point.x, x, y);
            this.generateBuildSteps(points.slice(mid + 1), depth + 1, point, 'right', point.x, boundsMax, x, y);
        } else {
            this.generateBuildSteps(points.slice(0, mid), depth + 1, point, 'left', boundsMin, point.y, x, y);
            this.generateBuildSteps(points.slice(mid + 1), depth + 1, point, 'right', point.y, boundsMax, x, y);
        }
    }

    animateBuild() {
        if (this.isPaused) {
            setTimeout(() => this.animateBuild(), this.animationSpeed);
            return;
        }

        if (this.currentBuildStep < this.buildSteps.length) {
            this.currentBuildStep++;
            setTimeout(() => this.animateBuild(), this.animationSpeed);
        } else {
            this.tree.build([...this.points]);
            this.updateStats();
        }
    }

    resetTree() {
        this.tree.reset();
        this.buildSteps = [];
        this.currentBuildStep = 0;
        this.clearQuery();
        this.updateStats();
    }

    setMode(mode) {
        this.mode = mode;
        const indicator = document.getElementById('modeIndicator');
        if (indicator) {
            if (mode === 'add') {
                indicator.textContent = 'Click to add Pythagorean points';
            } else if (mode === 'nearest') {
                indicator.textContent = 'Click to find nearest neighbor';
            } else if (mode === 'range') {
                indicator.textContent = 'Click for range query';
            }
        }
        this.clearQuery();
    }

    performNearestNeighbor(queryPoint) {
        if (!this.tree.root) {
            alert('Please build the tree first!');
            return;
        }

        this.comparisons = 0;
        this.searchPath = [];
        this.queryResult = this.tree.nearestNeighbor(queryPoint);
        this.setMode('add');
        this.updateStats();
    }

    performRangeQuery(centerPoint) {
        if (!this.tree.root) {
            alert('Please build the tree first!');
            return;
        }

        const rangeSize = 80;
        this.currentRange = {
            minX: centerPoint.x - rangeSize,
            maxX: centerPoint.x + rangeSize,
            minY: centerPoint.y - rangeSize,
            maxY: centerPoint.y + rangeSize
        };

        this.rangeQueryResult = this.tree.rangeQuery(this.currentRange);
        this.setMode('add');
    }

    clearQuery() {
        this.searchPath = [];
        this.queryResult = null;
        this.rangeQueryResult = [];
        this.currentRange = null;
        this.queryPoint = null;
        this.comparisons = 0;
        this.updateStats();
    }

    updateStats() {
        const statPoints = document.getElementById('statPoints');
        const statNodes = document.getElementById('statNodes');
        const statDepth = document.getElementById('statDepth');
        const statComparisons = document.getElementById('statComparisons');
        
        if (statPoints) statPoints.textContent = this.points.length;
        if (statNodes) statNodes.textContent = this.tree.nodes.length;
        if (statDepth) statDepth.textContent = this.tree.depth;
        if (statComparisons) statComparisons.textContent = this.comparisons;
    }

    getDepthColor(depth, alpha = 0.6) {
        const hue = 280 - depth * 25;
        return `hsla(${hue}, 70%, 60%, ${alpha})`;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Background gradient
        const gradient = this.ctx.createRadialGradient(
            this.canvasWidth / 2, this.canvasHeight / 2, 0,
            this.canvasWidth / 2, this.canvasHeight / 2, this.canvasWidth / 2
        );
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.05)');
        gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Draw grid
        this.drawGrid();

        // Draw range query region
        if (this.currentRange) {
            this.ctx.fillStyle = 'rgba(68, 102, 255, 0.1)';
            this.ctx.fillRect(
                this.currentRange.minX,
                this.currentRange.minY,
                this.currentRange.maxX - this.currentRange.minX,
                this.currentRange.maxY - this.currentRange.minY
            );
            this.ctx.strokeStyle = 'rgba(68, 102, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(
                this.currentRange.minX,
                this.currentRange.minY,
                this.currentRange.maxX - this.currentRange.minX,
                this.currentRange.maxY - this.currentRange.minY
            );
        }

        // Draw split lines
        if (this.tree.root && this.buildSteps.length === 0) {
            this.drawSplitLines(this.tree.root);
        } else if (this.buildSteps.length > 0) {
            this.drawBuildProgress();
        }

        // Draw points with glow
        this.points.forEach((point, index) => {
            this.drawPoint(point, index);
        });

        // Draw range query results
        this.rangeQueryResult.forEach(point => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
            this.ctx.fill();
            this.ctx.strokeStyle = '#22c55e';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });

        // Draw nearest neighbor result
        if (this.queryResult && this.queryResult.point && this.queryPoint) {
            // Draw line to nearest
            this.ctx.beginPath();
            this.ctx.setLineDash([5, 5]);
            this.ctx.moveTo(this.queryPoint.x, this.queryPoint.y);
            this.ctx.lineTo(this.queryResult.point.x, this.queryResult.point.y);
            this.ctx.strokeStyle = '#22c55e';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            // Draw query point
            this.ctx.beginPath();
            this.ctx.arc(this.queryPoint.x, this.queryPoint.y, 10, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#f59e0b';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Draw result point
            this.ctx.beginPath();
            this.ctx.arc(this.queryResult.point.x, this.queryResult.point.y, 12, 0, Math.PI * 2);
            this.ctx.fillStyle = '#22c55e';
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            // Show triple coordinates
            if (this.queryResult.point.triple) {
                this.ctx.font = 'bold 12px monospace';
                this.ctx.fillStyle = '#22c55e';
                this.ctx.fillText(
                    `(${this.queryResult.point.triple[0]}, ${this.queryResult.point.triple[1]}, ${this.queryResult.point.triple[2]})`,
                    this.queryResult.point.x + 15,
                    this.queryResult.point.y - 10
                );
            }
        }

        // Draw code comparison info
        this.drawCodeComparison();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(68, 102, 255, 0.08)';
        this.ctx.lineWidth = 1;

        const gridSize = 50;
        for (let x = 0; x < this.canvasWidth; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvasHeight);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvasHeight; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvasWidth, y);
            this.ctx.stroke();
        }
    }

    drawSplitLines(node, bounds = { x: 0, y: 0, width: this.canvasWidth, height: this.canvasHeight }) {
        if (!node) return;

        const axis = node.axis;
        const depth = this.tree.nodes.indexOf(node);
        const depthLevel = Math.floor(Math.log2(depth + 2));
        
        // Animated pulse
        const pulse = Math.sin(this.time * 3 + depthLevel) * 0.2 + 0.8;

        this.ctx.shadowBlur = 10 - depthLevel * 2;
        this.ctx.shadowColor = this.getDepthColor(depthLevel, 0.5);

        if (axis === 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(node.point.x, bounds.y);
            this.ctx.lineTo(node.point.x, bounds.y + bounds.height);
            this.ctx.strokeStyle = this.getDepthColor(depthLevel, 0.6 * pulse);
            this.ctx.lineWidth = 2.5 - depthLevel * 0.3;
            this.ctx.stroke();
        } else {
            this.ctx.beginPath();
            this.ctx.moveTo(bounds.x, node.point.y);
            this.ctx.lineTo(bounds.x + bounds.width, node.point.y);
            this.ctx.strokeStyle = this.getDepthColor(depthLevel, 0.6 * pulse);
            this.ctx.lineWidth = 2.5 - depthLevel * 0.3;
            this.ctx.stroke();
        }

        this.ctx.shadowBlur = 0;

        if (axis === 0) {
            this.drawSplitLines(node.left, { x: bounds.x, y: bounds.y, width: node.point.x - bounds.x, height: bounds.height });
            this.drawSplitLines(node.right, { x: node.point.x, y: bounds.y, width: bounds.x + bounds.width - node.point.x, height: bounds.height });
        } else {
            this.drawSplitLines(node.left, { x: bounds.x, y: bounds.y, width: bounds.width, height: node.point.y - bounds.y });
            this.drawSplitLines(node.right, { x: bounds.x, y: node.point.y, width: bounds.width, height: bounds.y + bounds.height - node.point.y });
        }
    }

    drawBuildProgress() {
        for (let i = 0; i < this.currentBuildStep && i < this.buildSteps.length; i++) {
            const s = this.buildSteps[i];
            const line = s.splitLine;
            const isActive = i === this.currentBuildStep - 1;

            this.ctx.beginPath();
            if (line.type === 'vertical') {
                this.ctx.moveTo(line.x, line.yMin);
                this.ctx.lineTo(line.x, line.yMax);
            } else {
                this.ctx.moveTo(line.xMin, line.y);
                this.ctx.lineTo(line.xMax, line.y);
            }
            
            this.ctx.strokeStyle = isActive ? '#ffffff' : this.getDepthColor(s.depth);
            this.ctx.lineWidth = isActive ? 3 : 2;
            this.ctx.stroke();
        }
    }

    drawPoint(point, index) {
        const hue = (index * 30) % 360;
        const pulse = Math.sin(this.time * 2 + index * 0.5) * 0.2 + 0.8;

        // Glow effect
        const gradient = this.ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 20);
        gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.4)`);
        gradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 20, 0, Math.PI * 2);
        this.ctx.fill();

        // Point core
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 6 * pulse, 0, Math.PI * 2);
        this.ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = `hsl(${hue}, 70%, 60%)`;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // White border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
    }

    drawCodeComparison() {
        // Draw info panel at bottom
        const panelHeight = 50;
        const y = this.canvasHeight - panelHeight;
        
        // Background
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        this.ctx.fillRect(0, y, this.canvasWidth, panelHeight);
        
        // Separator line
        this.ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.canvasWidth, y);
        this.ctx.stroke();

        // Left side - O(log n) info
        this.ctx.font = 'bold 12px monospace';
        this.ctx.fillStyle = '#e2e8f0';
        this.ctx.fillText('O(log n) spatial query', 15, y + 20);
        
        this.ctx.font = '10px monospace';
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.fillText(`Points: ${this.points.length} | Depth: ${this.tree.depth}`, 15, y + 38);

        // Right side - code comparison
        this.ctx.font = '10px monospace';
        this.ctx.fillStyle = '#ef4444';
        this.ctx.fillText('Traditional: ~400 chars, floats, drift', this.canvasWidth - 220, y + 20);
        this.ctx.fillStyle = '#22c55e';
        this.ctx.fillText('Constraint Theory: ~90 chars, exact ints', this.canvasWidth - 220, y + 38);
    }
}

// Initialize the visualizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new KDTreeVisualizer('kdtreeCanvas');
});

/**
 * KD-Tree Visualization
 * Interactive simulator for spatial partitioning and range queries
 * Part of Constraint Theory - https://constraint-theory.superinstance.ai
 */

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
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

        // Decide which branch to explore first
        let nearer, further;
        if (queryCoord < nodeCoord) {
            nearer = node.left;
            further = node.right;
        } else {
            nearer = node.right;
            further = node.left;
        }

        // Recursively search the nearer branch
        const result = this.nearestNeighbor(queryPoint, nearer, depth + 1, best, bestDist);
        best = result.point;
        bestDist = result.distance;

        // Check if current node is closer
        const currentDist = queryPoint.distance(node.point);
        if (currentDist < bestDist) {
            best = node.point;
            bestDist = currentDist;
        }

        // Check if we need to search the other side
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

        // Check if current point is in range
        if (node.point.x >= range.minX && node.point.x <= range.maxX &&
            node.point.y >= range.minY && node.point.y <= range.maxY) {
            results.push(node.point);
        }

        const axis = node.axis;
        const nodeCoord = axis === 0 ? node.point.x : node.point.y;
        const rangeMin = axis === 0 ? range.minX : range.minY;
        const rangeMax = axis === 0 ? range.maxX : range.maxY;

        // Check left/nearer branch
        if (nodeCoord >= rangeMin) {
            this.rangeQuery(range, node.left, results);
        }

        // Check right/further branch
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

class KDTreeVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.points = [];
        this.tree = new KDTree();
        this.mode = 'add'; // add, nearest, range
        this.animationSpeed = 50;
        this.isPaused = false;
        this.searchPath = [];
        this.queryResult = null;
        this.rangeQueryResult = [];
        this.currentRange = null;
        this.buildSteps = [];
        this.currentBuildStep = 0;
        this.comparisons = 0;

        this.setupCanvas();
        this.setupEventListeners();
        this.render();
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

        document.getElementById('btnAddRandom').addEventListener('click', () => this.addRandomPoints(10));
        document.getElementById('btnAdd50').addEventListener('click', () => this.addRandomPoints(50));
        document.getElementById('btnClear').addEventListener('click', () => this.clearAll());
        document.getElementById('btnBuild').addEventListener('click', () => this.buildTree());
        document.getElementById('btnStepBuild').addEventListener('click', () => this.stepBuild());
        document.getElementById('btnResetTree').addEventListener('click', () => this.resetTree());
        document.getElementById('btnNearestNeighbor').addEventListener('click', () => this.setMode('nearest'));
        document.getElementById('btnRangeQuery').addEventListener('click', () => this.setMode('range'));
        document.getElementById('btnClearQuery').addEventListener('click', () => this.clearQuery());

        const speedSlider = document.getElementById('speedSlider');
        speedSlider.addEventListener('input', (e) => {
            this.animationSpeed = 210 - parseInt(e.target.value); // Invert so higher = faster
            document.getElementById('speedValue').textContent = e.target.value;
        });

        document.getElementById('btnPause').addEventListener('click', () => {
            this.isPaused = !this.isPaused;
        });
    }

    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.mode === 'add') {
            this.points.push(new Point(x, y));
            this.updateStats();
            this.render();
        } else if (this.mode === 'nearest') {
            this.performNearestNeighbor(new Point(x, y));
        } else if (this.mode === 'range') {
            this.performRangeQuery(new Point(x, y));
        }
    }

    addRandomPoints(count) {
        const margin = 50;
        for (let i = 0; i < count; i++) {
            const x = margin + Math.random() * (this.canvasWidth - 2 * margin);
            const y = margin + Math.random() * (this.canvasHeight - 2 * margin);
            this.points.push(new Point(x, y));
        }
        this.updateStats();
        this.render();
    }

    clearAll() {
        this.points = [];
        this.resetTree();
        this.render();
    }

    buildTree() {
        if (this.points.length === 0) return;

        this.tree.reset();
        this.tree.build([...this.points]);
        this.updateStats();
        this.render();
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
            // Vertical split
            splitLine = {
                type: 'vertical',
                x: point.x,
                yMin: y,
                yMax: y + (boundsMax - boundsMin),
                depth: depth
            };
        } else {
            // Horizontal split
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

        // Recursively generate steps for left and right
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
            const step = this.buildSteps[this.currentBuildStep];
            this.render(step);
            this.currentBuildStep++;
            setTimeout(() => this.animateBuild(), this.animationSpeed);
        } else {
            this.tree.build([...this.points]);
            this.updateStats();
            this.render();
        }
    }

    resetTree() {
        this.tree.reset();
        this.buildSteps = [];
        this.currentBuildStep = 0;
        this.clearQuery();
        this.updateStats();
        this.render();
    }

    setMode(mode) {
        this.mode = mode;
        const indicator = document.getElementById('modeIndicator');
        if (mode === 'add') {
            indicator.textContent = 'Click to add points';
        } else if (mode === 'nearest') {
            indicator.textContent = 'Click to find nearest neighbor';
        } else if (mode === 'range') {
            indicator.textContent = 'Click and drag for range query';
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
        this.render();
    }

    performRangeQuery(centerPoint) {
        if (!this.tree.root) {
            alert('Please build the tree first!');
            return;
        }

        const rangeSize = 100;
        this.currentRange = {
            minX: centerPoint.x - rangeSize,
            maxX: centerPoint.x + rangeSize,
            minY: centerPoint.y - rangeSize,
            maxY: centerPoint.y + rangeSize
        };

        this.rangeQueryResult = this.tree.rangeQuery(this.currentRange);
        this.setMode('add');
        this.render();
    }

    clearQuery() {
        this.searchPath = [];
        this.queryResult = null;
        this.rangeQueryResult = [];
        this.currentRange = null;
        this.comparisons = 0;
        this.updateStats();
        this.render();
    }

    updateStats() {
        document.getElementById('statPoints').textContent = this.points.length;
        document.getElementById('statNodes').textContent = this.tree.nodes.length;
        document.getElementById('statDepth').textContent = this.tree.depth;
        document.getElementById('statComparisons').textContent = this.comparisons;
    }

    getDepthColor(depth) {
        // Warm colors for shallow, cool colors for deep
        const maxDepth = Math.max(this.tree.depth, 1);
        const hue = 30 - (depth / maxDepth) * 200; // From warm (30) to cool (-170)
        return `hsl(${hue}, 80%, 60%)`;
    }

    render(currentStep = null) {
        this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

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
        } else if (currentStep) {
            this.drawBuildProgress(currentStep);
        }

        // Draw points
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
        if (this.queryResult && this.queryResult.point) {
            // Draw line to nearest
            this.ctx.beginPath();
            this.ctx.setLineDash([5, 5]);
            this.ctx.strokeStyle = '#22c55e';
            this.ctx.lineWidth = 2;
            // We need the query point - for now, just highlight the result
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            // Draw result point
            this.ctx.beginPath();
            this.ctx.arc(this.queryResult.point.x, this.queryResult.point.y, 12, 0, Math.PI * 2);
            this.ctx.fillStyle = '#22c55e';
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(68, 102, 255, 0.1)';
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
        let x1, y1, x2, y2;

        if (axis === 0) {
            // Vertical line
            x1 = x2 = node.point.x;
            y1 = bounds.y;
            y2 = bounds.y + bounds.height;
        } else {
            // Horizontal line
            x1 = bounds.x;
            x2 = bounds.x + bounds.width;
            y1 = y2 = node.point.y;
        }

        // Draw the split line
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.strokeStyle = axis === 0 ? 'rgba(59, 130, 246, 0.6)' : 'rgba(168, 85, 247, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Recursively draw child lines with updated bounds
        if (axis === 0) {
            this.drawSplitLines(node.left, { x: bounds.x, y: bounds.y, width: node.point.x - bounds.x, height: bounds.height });
            this.drawSplitLines(node.right, { x: node.point.x, y: bounds.y, width: bounds.x + bounds.width - node.point.x, height: bounds.height });
        } else {
            this.drawSplitLines(node.left, { x: bounds.x, y: bounds.y, width: bounds.width, height: node.point.y - bounds.y });
            this.drawSplitLines(node.right, { x: bounds.x, y: node.point.y, width: bounds.width, height: bounds.y + bounds.height - node.point.y });
        }
    }

    drawBuildProgress(step) {
        // Draw all completed steps
        for (let i = 0; i <= this.currentBuildStep && i < this.buildSteps.length; i++) {
            const s = this.buildSteps[i];
            const line = s.splitLine;
            const color = i === this.currentBuildStep ? '#ffffff' : (line.type === 'vertical' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(168, 85, 247, 0.6)');

            this.ctx.beginPath();
            if (line.type === 'vertical') {
                this.ctx.moveTo(line.x, line.yMin);
                this.ctx.lineTo(line.x, line.yMax);
            } else {
                this.ctx.moveTo(line.xMin, line.y);
                this.ctx.lineTo(line.xMax, line.y);
            }
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = i === this.currentBuildStep ? 3 : 2;
            this.ctx.stroke();
        }
    }

    drawPoint(point, index) {
        // Glow effect
        const gradient = this.ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 15);
        gradient.addColorStop(0, 'rgba(68, 102, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(68, 102, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(68, 102, 255, 0)');

        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 15, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Point
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#4466ff';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
}

// Initialize the visualizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.visualizer = new KDTreeVisualizer('kdtreeCanvas');
});

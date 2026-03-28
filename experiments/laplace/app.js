class LaplaceSolver {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Grid parameters
        this.gridSize = 64;
        this.maxIterations = 1000;
        this.targetResidual = 1e-6;

        // Solution and boundary arrays
        this.phi = null;      // Potential values
        this.phiNew = null;   // Next iteration
        this.boundary = null; // Boundary mask (0=interior, 1=fixed)

        // Solver parameters
        this.solverMethod = 'gauss-seidel';
        this.omega = 1.85;    // SOR relaxation parameter

        // State
        this.iterations = 0;
        this.residual = Infinity;
        this.isRunning = false;
        this.isPaused = false;
        this.animationId = null;
        this.animSpeed = 50;  // ms per iteration

        // Visualization
        this.showHeatmap = true;
        this.showEquipotential = false;
        this.showFieldLines = false;
        this.showGrid = false;

        // Interaction mode
        this.mode = 'boundary'; // 'boundary', 'source', 'sink', 'erase'
        this.boundaryValue = 1.0;
        this.isDrawing = false;

        // Sources/sinks (interior points with fixed values)
        this.sources = [];

        this.initializeGrid();
        this.setupEventListeners();
        this.render();
    }

    initializeGrid() {
        const size = this.gridSize;
        this.phi = new Float32Array(size * size);
        this.phiNew = new Float32Array(size * size);
        this.boundary = new Uint8Array(size * size);

        // Initialize to zero
        for (let i = 0; i < size * size; i++) {
            this.phi[i] = 0;
            this.boundary[i] = 0;
        }

        // Clear sources
        this.sources = [];

        // Reset iteration count
        this.iterations = 0;
        this.residual = Infinity;

        this.updateCanvasSize();
        this.render();
    }

    updateCanvasSize() {
        const container = this.canvas.parentElement;
        const size = Math.min(container.clientWidth - 20, 600);
        this.canvas.width = size;
        this.canvas.height = size;
        this.cellSize = size / this.gridSize;
    }

    setupEventListeners() {
        // Mouse interaction for setting boundary conditions
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());

        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleMouseDown(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.handleMouseMove(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.handleMouseUp());

        // Window resize
        window.addEventListener('resize', () => {
            this.updateCanvasSize();
            this.render();
        });
    }

    getGridPosition(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        return { col: Math.max(0, Math.min(this.gridSize - 1, col)),
                 row: Math.max(0, Math.min(this.gridSize - 1, row)) };
    }

    handleMouseDown(e) {
        this.isDrawing = true;
        this.applyTool(e);
    }

    handleMouseMove(e) {
        if (!this.isDrawing) return;
        this.applyTool(e);
    }

    handleMouseUp() {
        this.isDrawing = false;
    }

    applyTool(e) {
        const { col, row } = this.getGridPosition(e);
        const idx = row * this.gridSize + col;
        const isBoundary = col === 0 || col === this.gridSize - 1 ||
                          row === 0 || row === this.gridSize - 1;

        switch (this.mode) {
            case 'boundary':
                if (isBoundary) {
                    this.phi[idx] = this.boundaryValue;
                    this.boundary[idx] = 1;
                }
                break;
            case 'source':
                if (!isBoundary) {
                    this.addSource(col, row, Math.abs(this.boundaryValue));
                }
                break;
            case 'sink':
                if (!isBoundary) {
                    this.addSource(col, row, -Math.abs(this.boundaryValue));
                }
                break;
            case 'erase':
                if (isBoundary) {
                    this.phi[idx] = 0;
                    this.boundary[idx] = 0;
                } else {
                    this.removeSource(col, row);
                }
                break;
        }

        this.render();
    }

    addSource(col, row, value) {
        // Remove existing source at this location
        this.removeSource(col, row);

        // Add new source
        this.sources.push({ col, row, value });
        const idx = row * this.gridSize + col;
        this.phi[idx] = value;
        this.boundary[idx] = 1;
    }

    removeSource(col, row) {
        this.sources = this.sources.filter(s => s.col !== col || s.row !== row);
        const idx = row * this.gridSize + col;
        if (!this.isBoundaryCell(col, row)) {
            this.boundary[idx] = 0;
            this.phi[idx] = 0;
        }
    }

    isBoundaryCell(col, row) {
        return col === 0 || col === this.gridSize - 1 ||
               row === 0 || row === this.gridSize - 1;
    }

    // Core solver methods
    solveOneIteration() {
        const n = this.gridSize;
        let maxResidual = 0;

        switch (this.solverMethod) {
            case 'jacobi':
                maxResidual = this.jacobiIteration();
                break;
            case 'gauss-seidel':
                maxResidual = this.gaussSeidelIteration();
                break;
            case 'sor':
                maxResidual = this.sorIteration();
                break;
        }

        this.iterations++;
        this.residual = maxResidual;

        return maxResidual;
    }

    jacobiIteration() {
        const n = this.gridSize;
        let maxResidual = 0;

        // Copy current to new
        this.phiNew.set(this.phi);

        // Update interior points
        for (let i = 1; i < n - 1; i++) {
            for (let j = 1; j < n - 1; j++) {
                const idx = i * n + j;
                if (this.boundary[idx]) continue;

                const avg = (this.phi[(i-1)*n + j] + this.phi[(i+1)*n + j] +
                            this.phi[i*n + (j-1)] + this.phi[i*n + (j+1)]) / 4;

                this.phiNew[idx] = avg;
                maxResidual = Math.max(maxResidual, Math.abs(avg - this.phi[idx]));
            }
        }

        // Swap arrays
        [this.phi, this.phiNew] = [this.phiNew, this.phi];

        return maxResidual;
    }

    gaussSeidelIteration() {
        const n = this.gridSize;
        let maxResidual = 0;

        for (let i = 1; i < n - 1; i++) {
            for (let j = 1; j < n - 1; j++) {
                const idx = i * n + j;
                if (this.boundary[idx]) continue;

                const avg = (this.phi[(i-1)*n + j] + this.phi[(i+1)*n + j] +
                            this.phi[i*n + (j-1)] + this.phi[i*n + (j+1)]) / 4;

                maxResidual = Math.max(maxResidual, Math.abs(avg - this.phi[idx]));
                this.phi[idx] = avg;
            }
        }

        return maxResidual;
    }

    sorIteration() {
        const n = this.gridSize;
        const omega = this.omega;
        let maxResidual = 0;

        for (let i = 1; i < n - 1; i++) {
            for (let j = 1; j < n - 1; j++) {
                const idx = i * n + j;
                if (this.boundary[idx]) continue;

                const avg = (this.phi[(i-1)*n + j] + this.phi[(i+1)*n + j] +
                            this.phi[i*n + (j-1)] + this.phi[i*n + (j+1)]) / 4;

                const newValue = this.phi[idx] + omega * (avg - this.phi[idx]);
                maxResidual = Math.max(maxResidual, Math.abs(newValue - this.phi[idx]));
                this.phi[idx] = newValue;
            }
        }

        return maxResidual;
    }

    async solve() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;

        const startTime = performance.now();
        let converged = false;

        while (this.isRunning && !converged && this.iterations < this.maxIterations) {
            if (this.isPaused) {
                await this.sleep(100);
                continue;
            }

            const residual = this.solveOneIteration();

            if (document.getElementById('animateConvergence').checked) {
                this.render();
                await this.sleep(this.animSpeed);
            }

            converged = residual < this.targetResidual;

            // Update UI every 10 iterations
            if (this.iterations % 10 === 0 || converged) {
                this.updateStatus();
            }
        }

        const endTime = performance.now();
        const solveTime = ((endTime - startTime) / 1000).toFixed(2);

        this.isRunning = false;
        this.render();
        this.updateStatus(converged, solveTime);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    pause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    stop() {
        this.isRunning = false;
        this.isPaused = false;
    }

    updateStatus(converged = false, solveTime = null) {
        document.getElementById('iterationCount').textContent =
            `Iterations: ${this.iterations}`;
        document.getElementById('residual').textContent =
            `Residual: ${this.residual.toExponential(4)}`;
        document.getElementById('currentResidual').textContent =
            this.residual.toExponential(4);
        document.getElementById('convergenceStatus').textContent =
            converged ? `Status: Converged (${solveTime}s)` :
            this.isRunning ? 'Status: Running...' :
            this.isPaused ? 'Status: Paused' : 'Status: Ready';

        // Calculate convergence rate
        if (this.iterations > 10) {
            const rate = (Math.log10(this.residual) / this.iterations).toFixed(3);
            document.getElementById('convergenceRate').textContent =
                `${rate} dec/iter`;
        }
    }

    // Rendering
    render() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const imageData = this.ctx.createImageData(width, height);
        const data = imageData.data;

        // Find min/max for normalization
        let minVal = Infinity, maxVal = -Infinity;
        for (let i = 0; i < this.phi.length; i++) {
            if (this.boundary[i]) {
                minVal = Math.min(minVal, this.phi[i]);
                maxVal = Math.max(maxVal, this.phi[i]);
            }
        }

        // If no boundary values set, use -1 to 1
        if (minVal === Infinity) {
            minVal = -1;
            maxVal = 1;
        }

        // Render pixel by pixel
        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                const col = Math.floor(px / this.cellSize);
                const row = Math.floor(py / this.cellSize);
                const idx = row * this.gridSize + col;
                const pixelIdx = (py * width + px) * 4;

                const val = this.phi[idx];
                const normalized = (val - minVal) / (maxVal - minVal + 1e-10);

                // Color mapping: blue (low) to red (high)
                let r, g, b;
                if (this.showHeatmap) {
                    if (normalized < 0.5) {
                        // Blue to green
                        const t = normalized * 2;
                        r = 0;
                        g = Math.floor(255 * t);
                        b = Math.floor(255 * (1 - t));
                    } else {
                        // Green to red
                        const t = (normalized - 0.5) * 2;
                        r = Math.floor(255 * t);
                        g = Math.floor(255 * (1 - t));
                        b = 0;
                    }
                } else {
                    r = g = b = 128;
                }

                // Darken boundary cells
                if (this.boundary[idx]) {
                    r = Math.floor(r * 0.7);
                    g = Math.floor(g * 0.7);
                    b = Math.floor(b * 0.7);
                }

                // Grid overlay
                if (this.showGrid) {
                    const onGrid = (px % Math.floor(this.cellSize)) < 1 ||
                                  (py % Math.floor(this.cellSize)) < 1;
                    if (onGrid) {
                        r = Math.floor(r * 0.5);
                        g = Math.floor(g * 0.5);
                        b = Math.floor(b * 0.5);
                    }
                }

                data[pixelIdx] = r;
                data[pixelIdx + 1] = g;
                data[pixelIdx + 2] = b;
                data[pixelIdx + 3] = 255;
            }
        }

        this.ctx.putImageData(imageData, 0, 0);

        // Draw overlays
        if (this.showEquipotential) {
            this.drawEquipotentialLines(minVal, maxVal);
        }

        if (this.showFieldLines) {
            this.drawFieldLines();
        }

        // Draw source/sink markers
        this.drawSourceMarkers();
    }

    drawEquipotentialLines(minVal, maxVal) {
        const numLines = 10;
        const step = (maxVal - minVal) / numLines;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 1;

        for (let level = minVal + step; level < maxVal; level += step) {
            this.drawContour(level);
        }
    }

    drawContour(level) {
        const marchingSquares = [
            [], [[0, 1]], [[1, 0]], [[1, 0]], [[1, 1]], [[0, 1]], [[1, 0], [1, 1]],
            [[2, 0]], [[0, 1], [2, 0]], [[0, 1]], [[1, 0], [0, 1]], [[1, 0]],
            [[1, 1], [0, 1]], [[1, 1]], [[2, 0], [1, 1]], [[3, 0]]
        ];

        const n = this.gridSize;

        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - 1; j++) {
                const idx = i * n + j;
                const corners = [
                    this.phi[idx] > level,
                    this.phi[idx + 1] > level,
                    this.phi[idx + n + 1] > level,
                    this.phi[idx + n] > level
                ];

                const code = corners[0] + 2 * corners[1] + 4 * corners[2] + 8 * corners[3];
                const edges = marchingSquares[code];

                for (const edge of edges) {
                    this.drawContourEdge(i, j, edge, level);
                }
            }
        }
    }

    drawContourEdge(i, j, edge, level) {
        const n = this.gridSize;
        const x1 = this.cellSize * j;
        const y1 = this.cellSize * i;
        const x2 = this.cellSize * (j + 1);
        const y2 = this.cellSize * (i + 1);

        let p1, p2;

        if (edge === 0) {
            p1 = this.interpolate(x1, y1, x2, y1, this.phi[i * n + j], this.phi[i * n + j + 1], level);
            p2 = this.interpolate(x1, y1, x1, y2, this.phi[i * n + j], this.phi[(i + 1) * n + j], level);
        } else if (edge === 1) {
            p1 = this.interpolate(x1, y1, x2, y1, this.phi[i * n + j], this.phi[i * n + j + 1], level);
            p2 = this.interpolate(x2, y1, x2, y2, this.phi[i * n + j + 1], this.phi[(i + 1) * n + j + 1], level);
        } else if (edge === 2) {
            p1 = this.interpolate(x2, y1, x2, y2, this.phi[i * n + j + 1], this.phi[(i + 1) * n + j + 1], level);
            p2 = this.interpolate(x1, y2, x2, y2, this.phi[(i + 1) * n + j], this.phi[(i + 1) * n + j + 1], level);
        } else {
            p1 = this.interpolate(x1, y1, x1, y2, this.phi[i * n + j], this.phi[(i + 1) * n + j], level);
            p2 = this.interpolate(x1, y2, x2, y2, this.phi[(i + 1) * n + j], this.phi[(i + 1) * n + j + 1], level);
        }

        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
    }

    interpolate(x1, y1, x2, y2, v1, v2, level) {
        const t = (level - v1) / (v2 - v1 + 1e-10);
        return {
            x: x1 + t * (x2 - x1),
            y: y1 + t * (y2 - y1)
        };
    }

    drawFieldLines() {
        const n = this.gridSize;
        const arrowLength = this.cellSize * 2;
        const numArrows = 20;

        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)';
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
        this.ctx.lineWidth = 1;

        for (let i = 0; i < numArrows; i++) {
            for (let j = 0; j < numArrows; j++) {
                const x = (j + 0.5) * (this.canvas.width / numArrows);
                const y = (i + 0.5) * (this.canvas.height / numArrows);

                const col = Math.floor(x / this.cellSize);
                const row = Math.floor(y / this.cellSize);

                if (col <= 0 || col >= n - 1 || row <= 0 || row >= n - 1) continue;

                // Calculate gradient (negative for field direction)
                const idx = row * n + col;
                const dx = -(this.phi[idx + 1] - this.phi[idx - 1]) / 2;
                const dy = -(this.phi[idx + n] - this.phi[idx - n]) / 2;

                const magnitude = Math.sqrt(dx * dx + dy * dy);
                if (magnitude < 0.01) continue;

                const nx = dx / magnitude;
                const ny = dy / magnitude;

                // Draw arrow
                this.drawArrow(x, y, x + nx * arrowLength, y + ny * arrowLength);
            }
        }
    }

    drawArrow(x1, y1, x2, y2) {
        const headLength = 5;
        const angle = Math.atan2(y2 - y1, x2 - x1);

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();

        // Arrowhead
        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6),
                       y2 - headLength * Math.sin(angle - Math.PI / 6));
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6),
                       y2 - headLength * Math.sin(angle + Math.PI / 6));
        this.ctx.stroke();
    }

    drawSourceMarkers() {
        const radius = this.cellSize * 0.6;

        for (const source of this.sources) {
            const x = (source.col + 0.5) * this.cellSize;
            const y = (source.row + 0.5) * this.cellSize;

            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);

            if (source.value > 0) {
                this.ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            } else {
                this.ctx.fillStyle = 'rgba(100, 100, 255, 0.9)';
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            }

            this.ctx.fill();
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Draw + or - symbol
            this.ctx.fillStyle = 'white';
            this.ctx.font = `${radius}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(source.value > 0 ? '+' : '−', x, y);
        }
    }

    // Presets
    loadPreset(preset) {
        this.initializeGrid();
        const n = this.gridSize;

        switch (preset) {
            case 'parallel':
                // Parallel plates: left = +1, right = -1
                for (let i = 0; i < n; i++) {
                    this.phi[i * n] = 1;
                    this.phi[i * n + n - 1] = -1;
                    this.boundary[i * n] = 1;
                    this.boundary[i * n + n - 1] = 1;
                }
                break;

            case 'point':
                // Point charge at center
                const center = Math.floor(n / 2);
                this.addSource(center, center, 1);
                // Ground the edges
                for (let i = 0; i < n; i++) {
                    for (let j of [0, n - 1]) {
                        this.phi[i * n + j] = 0;
                        this.boundary[i * n + j] = 1;
                    }
                    for (let j of [0, n - 1]) {
                        this.phi[j * n + i] = 0;
                        this.boundary[j * n + i] = 1;
                    }
                }
                break;

            case 'dipole':
                // Dipole: two opposite charges
                const offset = Math.floor(n / 4);
                const cx = Math.floor(n / 2);
                this.addSource(cx - offset, cx, 1);
                this.addSource(cx + offset, cx, -1);
                break;

            case 'capacitor':
                // Parallel plate capacitor
                const plateStart = Math.floor(n * 0.3);
                const plateEnd = Math.floor(n * 0.7);
                const plateSep = Math.floor(n * 0.1);

                for (let i = plateStart; i < plateEnd; i++) {
                    this.phi[i * n + plateSep] = 1;
                    this.phi[i * n + (n - plateSep)] = -1;
                    this.boundary[i * n + plateSep] = 1;
                    this.boundary[i * n + (n - plateSep)] = 1;
                }
                break;

            case 'ground':
                // Grounding problem: three sides grounded, one at V=1
                for (let i = 0; i < n; i++) {
                    // Top at V=1
                    this.phi[i] = 1;
                    this.boundary[i] = 1;
                    // Other sides grounded
                    this.phi[i * n] = 0;
                    this.phi[i * n + n - 1] = 0;
                    this.phi[(n - 1) * n + i] = 0;
                    this.boundary[i * n] = 1;
                    this.boundary[i * n + n - 1] = 1;
                    this.boundary[(n - 1) * n + i] = 1;
                }
                break;

            case 'corner':
                // Corner problem: potential near a corner
                for (let i = 0; i < n; i++) {
                    for (let j = 0; j < n; j++) {
                        if (i === 0 || j === 0) {
                            // L-shaped boundary
                            if (i < n / 2 || j < n / 2) {
                                this.phi[i * n + j] = 1;
                                this.boundary[i * n + j] = 1;
                            }
                        }
                    }
                }
                break;
        }

        this.render();
    }

    setGridSize(size) {
        this.gridSize = size;
        this.initializeGrid();
    }

    setMaxIterations(maxIter) {
        this.maxIterations = maxIter;
    }

    setTargetResidual(target) {
        this.targetResidual = target;
    }

    setSolverMethod(method) {
        this.solverMethod = method;
    }

    setOmega(omega) {
        this.omega = omega;
    }

    setMode(mode) {
        this.mode = mode;
    }

    setBoundaryValue(value) {
        this.boundaryValue = value;
    }

    setAnimSpeed(speed) {
        this.animSpeed = speed;
    }

    setShowHeatmap(show) {
        this.showHeatmap = show;
        this.render();
    }

    setShowEquipotential(show) {
        this.showEquipotential = show;
        this.render();
    }

    setShowFieldLines(show) {
        this.showFieldLines = show;
        this.render();
    }

    setShowGrid(show) {
        this.showGrid = show;
        this.render();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('laplaceCanvas');
    const solver = new LaplaceSolver(canvas);

    // Control event listeners
    document.getElementById('startBtn').addEventListener('click', () => solver.solve());
    document.getElementById('stepBtn').addEventListener('click', () => {
        solver.solveOneIteration();
        solver.updateStatus();
        solver.render();
    });
    document.getElementById('pauseBtn').addEventListener('click', () => solver.pause());
    document.getElementById('resetBtn').addEventListener('click', () => solver.initializeGrid());

    // Grid size
    document.getElementById('gridSize').addEventListener('input', (e) => {
        document.getElementById('gridSizeValue').textContent = e.target.value;
    });
    document.getElementById('gridSize').addEventListener('change', (e) => {
        solver.setGridSize(parseInt(e.target.value));
    });

    // Max iterations
    document.getElementById('maxIterations').addEventListener('input', (e) => {
        document.getElementById('maxIterationsValue').textContent = e.target.value;
    });
    document.getElementById('maxIterations').addEventListener('change', (e) => {
        solver.setMaxIterations(parseInt(e.target.value));
    });

    // Target residual
    document.getElementById('targetResidualSlider').addEventListener('input', (e) => {
        const exp = parseInt(e.target.value);
        document.getElementById('targetResidualValue').textContent = `1e${exp}`;
        document.getElementById('targetResidual').textContent = `1e${exp}`;
        solver.setTargetResidual(Math.pow(10, exp));
    });

    // SOR parameter
    document.getElementById('omega').addEventListener('input', (e) => {
        document.getElementById('omegaValue').textContent = parseFloat(e.target.value).toFixed(2);
    });
    document.getElementById('omega').addEventListener('change', (e) => {
        solver.setOmega(parseFloat(e.target.value));
    });

    // Solver method
    document.getElementById('solverMethod').addEventListener('change', (e) => {
        solver.setSolverMethod(e.target.value);
        document.getElementById('sorGroup').style.display =
            e.target.value === 'sor' ? 'block' : 'none';
    });

    // Boundary value
    document.getElementById('boundaryValue').addEventListener('input', (e) => {
        document.getElementById('boundaryValueDisplay').textContent = parseFloat(e.target.value).toFixed(1);
    });
    document.getElementById('boundaryValue').addEventListener('change', (e) => {
        solver.setBoundaryValue(parseFloat(e.target.value));
    });

    // Animation speed
    document.getElementById('animSpeed').addEventListener('input', (e) => {
        document.getElementById('animSpeedValue').textContent = e.target.value;
    });
    document.getElementById('animSpeed').addEventListener('change', (e) => {
        solver.setAnimSpeed(parseInt(e.target.value));
    });

    // Visualization toggles
    document.getElementById('showHeatmap').addEventListener('change', (e) => {
        solver.setShowHeatmap(e.target.checked);
    });
    document.getElementById('showEquipotential').addEventListener('change', (e) => {
        solver.setShowEquipotential(e.target.checked);
    });
    document.getElementById('showFieldLines').addEventListener('change', (e) => {
        solver.setShowFieldLines(e.target.checked);
    });
    document.getElementById('showGrid').addEventListener('change', (e) => {
        solver.setShowGrid(e.target.checked);
    });

    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            solver.setMode(btn.dataset.mode);
        });
    });

    // Presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            solver.loadPreset(btn.dataset.preset);
        });
    });
});

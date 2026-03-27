// Cellular Automata Simulator - Constraint Theory Research Project
// Demonstrates emergence from simple local constraints

class CellularAutomata {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Grid settings
        this.gridSize = 100;
        this.cellSize = 6;
        this.wrapEdges = true;
        this.showGrid = false;

        // Simulation state
        this.grid = null;
        this.ageGrid = null;
        this.heatmapGrid = null;
        this.generation = 0;
        this.running = false;
        this.speed = 30;
        this.lastUpdate = 0;

        // Rules
        this.currentRule = 'B3/S23';
        this.born = [3];
        this.survive = [2, 3];
        this.isBriansBrain = false;

        // Visualization
        this.colorMode = 'age';
        this.zoom = 1;
        this.pan = { x: 0, y: 0 };

        // Drawing
        this.currentTool = 'draw';
        this.isDrawing = false;
        this.selectedPattern = null;

        // Statistics
        this.populationHistory = [];
        this.maxHistoryLength = 100;

        // Initialize
        this.initGrid();
        this.setupEventListeners();
        this.render();
    }

    // Initialize grid data structures
    initGrid() {
        this.grid = new Array(this.gridSize).fill(null)
            .map(() => new Array(this.gridSize).fill(0));
        this.ageGrid = new Array(this.gridSize).fill(null)
            .map(() => new Array(this.gridSize).fill(0));
        this.heatmapGrid = new Array(this.gridSize).fill(null)
            .map(() => new Array(this.gridSize).fill(0));
        this.generation = 0;
        this.populationHistory = [];
        this.updateCanvasSize();
    }

    // Resize canvas based on grid and zoom
    updateCanvasSize() {
        const displaySize = this.gridSize * this.cellSize * this.zoom;
        this.canvas.width = displaySize;
        this.canvas.height = displaySize;
        this.canvas.style.width = displaySize + 'px';
        this.canvas.style.height = displaySize + 'px';
    }

    // Get cell state with boundary handling
    getCell(x, y) {
        if (this.wrapEdges) {
            x = (x + this.gridSize) % this.gridSize;
            y = (y + this.gridSize) % this.gridSize;
        } else {
            if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) {
                return 0;
            }
        }
        return this.grid[y][x];
    }

    // Set cell state
    setCell(x, y, state) {
        if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
            this.grid[y][x] = state;
            if (state > 0) {
                this.ageGrid[y][x] = 1;
            }
        }
    }

    // Count neighbors for standard 2-state rules
    countNeighbors(x, y) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                if (this.getCell(x + dx, y + dy) > 0) {
                    count++;
                }
            }
        }
        return count;
    }

    // Count neighbors for Brian's Brain (2-state neighbors)
    countBriansBrainNeighbors(x, y) {
        let on = 0;
        let dying = 0;

        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const state = this.getCell(x + dx, y + dy);
                if (state === 1) on++;
                if (state === 2) dying++;
            }
        }
        return { on, dying };
    }

    // Apply rules and compute next generation
    step() {
        const newGrid = new Array(this.gridSize).fill(null)
            .map(() => new Array(this.gridSize).fill(0));
        const newHeatmap = new Array(this.gridSize).fill(null)
            .map(() => new Array(this.gridSize).fill(0));

        let births = 0;
        let deaths = 0;

        if (this.isBriansBrain) {
            // Brian's Brain rules
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    const state = this.grid[y][x];
                    const { on } = this.countBriansBrainNeighbors(x, y);

                    if (state === 0) { // Dead
                        if (on === 2) {
                            newGrid[y][x] = 1; // Born
                            births++;
                        }
                    } else if (state === 1) { // On
                        newGrid[y][x] = 2; // Dying
                    } else { // Dying
                        newGrid[y][x] = 0; // Dead
                        deaths++;
                    }

                    // Update heatmap
                    if (newGrid[y][x] > 0 || state > 0) {
                        newHeatmap[y][x] = Math.min(this.heatmapGrid[y][x] + 1, 10);
                    }
                }
            }
        } else {
            // Standard B/S rules
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    const state = this.grid[y][x];
                    const neighbors = this.countNeighbors(x, y);

                    if (state === 0) {
                        // Birth
                        if (this.born.includes(neighbors)) {
                            newGrid[y][x] = 1;
                            this.ageGrid[y][x] = 1;
                            births++;
                        }
                    } else {
                        // Survival
                        if (this.survive.includes(neighbors)) {
                            newGrid[y][x] = 1;
                            this.ageGrid[y][x]++;
                        } else {
                            deaths++;
                        }
                    }

                    // Update heatmap
                    if (newGrid[y][x] > 0 || state > 0) {
                        newHeatmap[y][x] = Math.min(this.heatmapGrid[y][x] + 1, 10);
                    }
                }
            }
        }

        this.grid = newGrid;
        this.heatmapGrid = newHeatmap;
        this.generation++;

        // Update statistics
        this.updateStats(births, deaths);
    }

    // Update statistics
    updateStats(births, deaths) {
        const population = this.countPopulation();
        const totalCells = this.gridSize * this.gridSize;
        const density = (population / totalCells * 100).toFixed(1);
        const birthRate = population > 0 ? (births / population * 100).toFixed(1) : 0;
        const deathRate = population > 0 ? (deaths / population * 100).toFixed(1) : 0;

        document.getElementById('generation').textContent = this.generation;
        document.getElementById('population').textContent = population;
        document.getElementById('birthRate').textContent = birthRate + '%';
        document.getElementById('deathRate').textContent = deathRate + '%';
        document.getElementById('density').textContent = density + '%';

        // Update history
        this.populationHistory.push(population);
        if (this.populationHistory.length > this.maxHistoryLength) {
            this.populationHistory.shift();
        }

        this.drawPopulationGraph();
    }

    // Count live cells
    countPopulation() {
        let count = 0;
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                if (this.grid[y][x] > 0) count++;
            }
        }
        return count;
    }

    // Draw population history graph
    drawPopulationGraph() {
        const canvas = document.getElementById('populationGraph');
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        if (this.populationHistory.length < 2) return;

        const maxPop = Math.max(...this.populationHistory, 1);
        const minPop = Math.min(...this.populationHistory, 0);
        const range = maxPop - minPop || 1;

        ctx.beginPath();
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;

        this.populationHistory.forEach((pop, i) => {
            const x = (i / (this.maxHistoryLength - 1)) * width;
            const y = height - ((pop - minPop) / range) * height * 0.9 - height * 0.05;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();
    }

    // Render the grid
    render() {
        const ctx = this.ctx;
        const cellSize = this.cellSize * this.zoom;

        // Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw cells using ImageData for performance
        const imageData = ctx.createImageData(this.canvas.width, this.canvas.height);
        const data = imageData.data;

        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const state = this.grid[y][x];
                if (state === 0) continue;

                const startX = Math.floor(x * cellSize);
                const startY = Math.floor(y * cellSize);
                const endX = Math.floor((x + 1) * cellSize);
                const endY = Math.floor((y + 1) * cellSize);

                let color = this.getCellColor(x, y, state);

                for (let py = startY; py < endY; py++) {
                    for (let px = startX; px < endX; px++) {
                        const idx = (py * this.canvas.width + px) * 4;
                        data[idx] = color.r;
                        data[idx + 1] = color.g;
                        data[idx + 2] = color.b;
                        data[idx + 3] = 255;
                    }
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);

        // Draw grid lines if enabled
        if (this.showGrid && this.zoom >= 0.5) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;

            for (let i = 0; i <= this.gridSize; i++) {
                ctx.beginPath();
                ctx.moveTo(i * cellSize, 0);
                ctx.lineTo(i * cellSize, this.canvas.height);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, i * cellSize);
                ctx.lineTo(this.canvas.width, i * cellSize);
                ctx.stroke();
            }
        }
    }

    // Get cell color based on visualization mode
    getCellColor(x, y, state) {
        if (this.colorMode === 'binary') {
            return { r: 255, g: 255, b: 255 };
        }

        if (this.colorMode === 'age') {
            const age = this.ageGrid[y][x];
            if (this.isBriansBrain) {
                if (state === 1) return { r: 100, g: 255, b: 100 }; // On - green
                if (state === 2) return { r: 255, g: 100, b: 100 }; // Dying - red
            } else {
                // Age gradient: blue (new) → red (old) → white (ancient)
                const maxAge = 100;
                const normalizedAge = Math.min(age / maxAge, 1);

                if (normalizedAge < 0.5) {
                    // Blue to red
                    const t = normalizedAge * 2;
                    return {
                        r: Math.floor(t * 255),
                        g: 0,
                        b: Math.floor((1 - t) * 255)
                    };
                } else {
                    // Red to white
                    const t = (normalizedAge - 0.5) * 2;
                    return {
                        r: 255,
                        g: Math.floor(t * 255),
                        b: Math.floor(t * 255)
                    };
                }
            }
        }

        if (this.colorMode === 'heatmap') {
            const heat = this.heatmapGrid[y][x];
            const intensity = Math.min(heat / 10, 1);
            return {
                r: Math.floor(intensity * 255),
                g: Math.floor(intensity * 200),
                b: Math.floor(intensity * 100)
            };
        }

        return { r: 255, g: 255, b: 255 };
    }

    // Parse rule string (e.g., "B3/S23")
    parseRule(ruleString) {
        const [bornPart, survivePart] = ruleString.split('/');
        this.born = bornPart.replace('B', '').split('').map(Number);
        this.survive = survivePart.replace('S', '').split('').map(Number);
        this.isBriansBrain = false;
    }

    // Set rule preset
    setRule(ruleName) {
        this.currentRule = ruleName;

        switch (ruleName) {
            case 'B3/S23':
                this.parseRule('B3/S23');
                break;
            case 'B36/S23':
                this.parseRule('B36/S23');
                break;
            case 'B3678/S34678':
                this.parseRule('B3678/S34678');
                break;
            case 'B2/S':
                this.parseRule('B2/S');
                break;
            case 'BriansBrain':
                this.isBriansBrain = true;
                break;
            case 'B1/S12':
                this.parseRule('B1/S12');
                break;
            case 'B34/S34':
                this.parseRule('B34/S34');
                break;
        }

        this.updateRuleDescription();
    }

    // Update rule description in UI
    updateRuleDescription() {
        const descriptions = {
            'B3/S23': '<strong>Conway\'s Game of Life (B3/S23):</strong> A cell is born with exactly 3 neighbors and survives with 2 or 3 neighbors. This simple rule creates gliders, guns, oscillators, and universal computation.',
            'B36/S23': '<strong>HighLife (B36/S23):</strong> Like Life, but cells are also born with 6 neighbors. Features a replicator pattern that copies itself.',
            'B3678/S34678': '<strong>Day & Night (B3678/S34678):</strong> A symmetric rule where live and dead cells behave identically. Patterns behave the same in inverted space.',
            'B2/S': '<strong>Seeds (B2/S):</strong> Cells are born with 2 neighbors but never survive. Creates explosive, chaotic growth from minimal seeds.',
            'BriansBrain': '<strong>Brian\'s Brain:</strong> A 3-state automaton (ON, DYING, OFF). ON cells with exactly 2 ON neighbors stay ON, otherwise they go DYING, then OFF. Creates complex moving patterns.',
            'B1/S12': '<strong>Gnarl (B1/S12):</strong> Creates complex, chaotic patterns that never stabilize. Demonstrates deterministic chaos.',
            'B34/S34': '<strong>34 Life (B34/S34):</strong> Cells are born or survive with 3 or 4 neighbors. Creates complex still lifes and oscillators.'
        };

        document.getElementById('ruleDescription').innerHTML =
            descriptions[this.currentRule] || 'Custom rule';
    }

    // Pattern definitions
    getPatterns() {
        return {
            glider: [
                [0, 1, 0],
                [0, 0, 1],
                [1, 1, 1]
            ],
            lwss: [
                [0, 1, 1, 1, 1],
                [1, 0, 0, 0, 1],
                [0, 0, 0, 0, 1],
                [1, 0, 0, 1, 0]
            ],
            mwss: [
                [0, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 1],
                [0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 1, 0],
                [0, 1, 0, 0, 0, 0]
            ],
            hwss: [
                [0, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [0, 0, 0, 0, 0, 0, 1],
                [1, 0, 0, 0, 0, 1, 0],
                [0, 1, 0, 0, 1, 0, 0]
            ],
            pulsar: [
                [0,0,1,1,1,0,0,0,1,1,1,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0],
                [1,0,0,0,0,1,0,1,0,0,0,0,1],
                [1,0,0,0,0,1,0,1,0,0,0,0,1],
                [1,0,0,0,0,1,0,1,0,0,0,0,1],
                [0,0,1,1,1,0,0,0,1,1,1,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,1,1,1,0,0,0,1,1,1,0,0],
                [1,0,0,0,0,1,0,1,0,0,0,0,1],
                [1,0,0,0,0,1,0,1,0,0,0,0,1],
                [1,0,0,0,0,1,0,1,0,0,0,0,1],
                [0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,1,1,1,0,0,0,1,1,1,0,0]
            ],
            gosperGun: [
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
                [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
                [1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                [1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            ],
            rpentomino: [
                [0,1,1],
                [1,1,0],
                [0,1,0]
            ],
            acorn: [
                [0,1,0,0,0,0,0],
                [0,0,0,1,0,0,0],
                [1,1,0,0,1,1,1]
            ],
            diehard: [
                [0,0,0,0,0,0,1,0],
                [1,1,0,0,0,0,0,0],
                [0,1,0,0,0,1,1,0]
            ],
            infinite: [
                [0,1,0,0,0,0,0,0,1,0],
                [0,0,0,0,1,0,0,0,0,0],
                [1,0,0,0,0,1,0,0,0,1],
                [1,0,0,0,1,1,1,0,0,0],
                [1,0,0,0,0,0,0,0,0,0],
                [0,0,0,0,0,0,0,0,0,0],
                [0,0,0,1,1,0,0,0,1,1],
                [0,1,1,0,0,0,1,0,0,0],
                [1,0,0,0,0,0,0,0,0,0],
                [1,0,0,0,0,1,1,0,0,0]
            ]
        };
    }

    // Place pattern on grid
    placePattern(patternName, centerX, centerY) {
        const patterns = this.getPatterns();
        const pattern = patterns[patternName];
        if (!pattern) return;

        const rows = pattern.length;
        const cols = pattern[0].length;
        const startX = Math.floor(centerX - cols / 2);
        const startY = Math.floor(centerY - rows / 2);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (pattern[y][x] === 1) {
                    this.setCell(startX + x, startY + y, 1);
                }
            }
        }

        this.render();
    }

    // Fill grid randomly
    randomize(density = 0.3) {
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                this.grid[y][x] = Math.random() < density ? 1 : 0;
                this.ageGrid[y][x] = this.grid[y][x] ? 1 : 0;
            }
        }
        this.generation = 0;
        this.populationHistory = [];
        this.updateStats(0, 0);
        this.render();
    }

    // Clear grid
    clear() {
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                this.grid[y][x] = 0;
                this.ageGrid[y][x] = 0;
                this.heatmapGrid[y][x] = 0;
            }
        }
        this.generation = 0;
        this.populationHistory = [];
        this.running = false;
        this.updateStats(0, 0);
        this.render();
    }

    // Start/stop simulation
    toggle() {
        this.running = !this.running;
        if (this.running) {
            this.lastUpdate = performance.now();
            this.animate();
        }
        return this.running;
    }

    // Animation loop
    animate() {
        if (!this.running) return;

        const now = performance.now();
        const elapsed = now - this.lastUpdate;
        const interval = 1000 / this.speed;

        if (elapsed >= interval) {
            this.step();
            this.render();
            this.lastUpdate = now - (elapsed % interval);
        }

        requestAnimationFrame(() => this.animate());
    }

    // Handle mouse draw
    handleDraw(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / (this.cellSize * this.zoom));
        const y = Math.floor((event.clientY - rect.top) / (this.cellSize * this.zoom));

        if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
            if (this.selectedPattern) {
                this.placePattern(this.selectedPattern, x, y);
            } else {
                const state = this.currentTool === 'draw' ? 1 : 0;
                this.setCell(x, y, state);
                this.render();
            }
        }
    }

    // Update coordinates display
    updateCoords(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / (this.cellSize * this.zoom));
        const y = Math.floor((event.clientY - rect.top) / (this.cellSize * this.zoom));

        if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
            document.getElementById('coords').textContent = `X: ${x}, Y: ${y}`;
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Canvas interaction
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDrawing = true;
            this.handleDraw(e);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            this.updateCoords(e);
            if (this.isDrawing && !this.selectedPattern) {
                this.handleDraw(e);
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDrawing = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDrawing = false;
        });

        // Controls
        document.getElementById('startBtn').addEventListener('click', () => {
            const running = this.toggle();
            document.getElementById('startBtn').textContent = running ? '⏸ Pause' : '▶ Start';
        });

        document.getElementById('stepBtn').addEventListener('click', () => {
            this.running = false;
            document.getElementById('startBtn').textContent = '▶ Start';
            this.step();
            this.render();
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clear();
        });

        document.getElementById('randomBtn').addEventListener('click', () => {
            this.randomize();
        });

        // Rule selection
        document.getElementById('ruleSelect').addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                document.getElementById('customRuleInputs').classList.remove('hidden');
            } else {
                document.getElementById('customRuleInputs').classList.add('hidden');
                this.setRule(e.target.value);
            }
        });

        document.getElementById('applyCustomRule').addEventListener('click', () => {
            const born = document.getElementById('bornRule').value;
            const survive = document.getElementById('surviveRule').value;
            this.parseRule(`B${born}/S${survive}`);
            this.currentRule = `B${born}/S${survive}`;
            this.updateRuleDescription();
        });

        // Grid settings
        document.getElementById('gridSize').addEventListener('input', (e) => {
            const size = parseInt(e.target.value);
            document.getElementById('gridSizeValue').textContent = `${size}x${size}`;
            this.gridSize = size;
            this.initGrid();
        });

        document.getElementById('wrapEdges').addEventListener('change', (e) => {
            this.wrapEdges = e.target.checked;
        });

        document.getElementById('showGrid').addEventListener('change', (e) => {
            this.showGrid = e.target.checked;
            this.render();
        });

        document.getElementById('speed').addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            document.getElementById('speedValue').textContent = this.speed;
        });

        document.getElementById('colorMode').addEventListener('change', (e) => {
            this.colorMode = e.target.value;
            this.render();
        });

        // Drawing tools
        document.getElementById('drawTool').addEventListener('click', () => {
            this.currentTool = 'draw';
            this.selectedPattern = null;
            document.getElementById('patternSelect').value = '';
            document.getElementById('drawTool').classList.add('active');
            document.getElementById('eraseTool').classList.remove('active');
        });

        document.getElementById('eraseTool').addEventListener('click', () => {
            this.currentTool = 'erase';
            this.selectedPattern = null;
            document.getElementById('patternSelect').value = '';
            document.getElementById('eraseTool').classList.add('active');
            document.getElementById('drawTool').classList.remove('active');
        });

        // Pattern selection
        document.getElementById('patternSelect').addEventListener('change', (e) => {
            this.selectedPattern = e.target.value || null;
            document.getElementById('drawTool').classList.remove('active');
            document.getElementById('eraseTool').classList.remove('active');
        });

        // Zoom controls
        document.getElementById('zoomIn').addEventListener('click', () => {
            this.zoom = Math.min(this.zoom * 1.2, 3);
            this.updateCanvasSize();
            this.render();
        });

        document.getElementById('zoomOut').addEventListener('click', () => {
            this.zoom = Math.max(this.zoom / 1.2, 0.3);
            this.updateCanvasSize();
            this.render();
        });

        document.getElementById('resetZoom').addEventListener('click', () => {
            this.zoom = 1;
            this.updateCanvasSize();
            this.render();
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('automataCanvas');
    const automata = new CellularAutomata(canvas);

    // Start with a random pattern
    automata.randomize(0.2);
});

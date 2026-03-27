// ============================================
// LANGTON'S ANT & TURING MACHINE SIMULATOR
// Constraint Theory Research Demonstration
// ============================================

class LangtonAntSimulator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Simulation state
        this.grid = new Map(); // sparse grid using Map for efficiency
        this.antX = 0;
        this.antY = 0;
        this.direction = 0; // 0=up, 1=right, 2=down, 3=left
        this.steps = 0;
        this.cellsVisited = new Set();
        this.isRunning = false;
        this.animationId = null;

        // Multi-state support
        this.currentState = 0;
        this.ruleString = 'RL'; // Default Langton's ant

        // Rendering
        this.cellSize = 2; // pixels per cell
        this.offsetX = 0;
        this.offsetY = 0;
        this.speed = 100; // steps per frame
        this.zoomLevel = 1;

        // Bounds for rendering
        this.minX = 0;
        this.maxX = 0;
        this.minY = 0;
        this.maxY = 0;

        // Colors
        this.colors = {
            white: [255, 255, 255],
            black: [0, 0, 0],
            ant: [255, 0, 0],
            visited: [100, 100, 100]
        };

        // Direction vectors
        this.directions = [
            { dx: 0, dy: -1 },  // up
            { dx: 1, dy: 0 },   // right
            { dx: 0, dy: 1 },   // down
            { dx: -1, dy: 0 }   // left
        ];

        // Direction names
        this.directionNames = ['Up', 'Right', 'Down', 'Left'];

        this.initCanvas();
        this.setupEventListeners();
    }

    initCanvas() {
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.render();
    }

    setupEventListeners() {
        // Mouse events for panning
        let isDragging = false;
        let lastX, lastY;

        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dx = e.clientX - lastX;
                const dy = e.clientY - lastY;
                this.offsetX += dx;
                this.offsetY += dy;
                lastX = e.clientX;
                lastY = e.clientY;
                this.render();
            }

            // Update coordinates display
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const gridX = Math.floor((x - this.centerX - this.offsetX) / this.cellSize);
            const gridY = Math.floor((y - this.centerY - this.offsetY) / this.cellSize);
            document.getElementById('coordinates').textContent = `Position: (${gridX}, ${gridY})`;
        });

        this.canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            isDragging = false;
        });

        // Zoom with mouse wheel
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom(delta);
        });
    }

    zoom(factor) {
        this.zoomLevel *= factor;
        this.cellSize = Math.max(1, Math.min(20, this.cellSize * factor));
        this.render();
    }

    setZoomLevel(level) {
        this.zoomLevel = level;
        this.cellSize = Math.max(1, Math.min(20, level * 2));
        this.render();
    }

    resetZoom() {
        this.cellSize = 2;
        this.offsetX = 0;
        this.offsetY = 0;
        this.zoomLevel = 1;
        this.render();
    }

    reset() {
        this.grid.clear();
        this.antX = 0;
        this.antY = 0;
        this.direction = 0;
        this.steps = 0;
        this.cellsVisited.clear();
        this.currentState = 0;
        this.minX = 0;
        this.maxX = 0;
        this.minY = 0;
        this.maxY = 0;
        this.stop();
        this.render();
        this.updateStats();
    }

    setRuleString(rule) {
        this.ruleString = rule.toUpperCase();
        this.reset();
    }

    getKey(x, y) {
        return `${x},${y}`;
    }

    isBlack(x, y) {
        return this.grid.has(this.getKey(x, y));
    }

    flipCell(x, y) {
        const key = this.getKey(x, y);
        if (this.grid.has(key)) {
            this.grid.delete(key);
        } else {
            this.grid.set(key, true);
            this.cellsVisited.add(key);
        }
    }

    step() {
        const currentStateChar = this.ruleString[this.currentState % this.ruleString.length];
        const isOnBlack = this.isBlack(this.antX, this.antY);

        // Determine turn direction based on state and cell color
        let turnDirection;
        if (currentStateChar === 'L') {
            turnDirection = isOnBlack ? 1 : -1; // Left on black, right on white (original Langton)
        } else if (currentStateChar === 'R') {
            turnDirection = isOnBlack ? -1 : 1; // Right on black, left on white
        } else {
            turnDirection = 0; // No turn
        }

        // Turn
        this.direction = (this.direction + turnDirection + 4) % 4;

        // Flip cell
        this.flipCell(this.antX, this.antY);

        // Move forward
        this.antX += this.directions[this.direction].dx;
        this.antY += this.directions[this.direction].dy;

        // Update bounds
        this.minX = Math.min(this.minX, this.antX);
        this.maxX = Math.max(this.maxX, this.antX);
        this.minY = Math.min(this.minY, this.antY);
        this.maxY = Math.max(this.maxY, this.antY);

        // Advance to next state
        this.currentState = (this.currentState + 1) % this.ruleString.length;

        this.steps++;
    }

    run() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.animate();
        }
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    toggle() {
        if (this.isRunning) {
            this.stop();
        } else {
            this.run();
        }
        return this.isRunning;
    }

    animate() {
        if (!this.isRunning) return;

        // Execute multiple steps per frame for speed
        for (let i = 0; i < this.speed; i++) {
            this.step();
        }

        this.render();
        this.updateStats();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        ctx.fillStyle = 'rgb(255, 255, 255)';
        ctx.fillRect(0, 0, width, height);

        // Draw grid cells
        ctx.fillStyle = 'rgb(0, 0, 0)';

        for (const [key] of this.grid) {
            const [x, y] = key.split(',').map(Number);

            const screenX = this.centerX + this.offsetX + x * this.cellSize;
            const screenY = this.centerY + this.offsetY + y * this.cellSize;

            // Only draw if visible
            if (screenX + this.cellSize >= 0 && screenX < width &&
                screenY + this.cellSize >= 0 && screenY < height) {
                ctx.fillRect(screenX, screenY, this.cellSize, this.cellSize);
            }
        }

        // Draw ant
        const antScreenX = this.centerX + this.offsetX + this.antX * this.cellSize;
        const antScreenY = this.centerY + this.offsetY + this.antY * this.cellSize;

        ctx.fillStyle = 'rgb(255, 0, 0)';
        ctx.fillRect(
            antScreenX - this.cellSize,
            antScreenY - this.cellSize,
            this.cellSize * 3,
            this.cellSize * 3
        );

        // Draw direction indicator
        ctx.fillStyle = 'rgb(255, 255, 0)';
        const dir = this.directions[this.direction];
        ctx.fillRect(
            antScreenX + dir.dx * this.cellSize * 2,
            antScreenY + dir.dy * this.cellSize * 2,
            this.cellSize,
            this.cellSize
        );
    }

    updateStats() {
        document.getElementById('stat-steps').textContent = this.steps.toLocaleString();
        document.getElementById('stat-visited').textContent = this.cellsVisited.size.toLocaleString();
        document.getElementById('stat-direction').textContent = this.directionNames[this.direction];
        document.getElementById('stat-state').textContent = this.currentState;
    }

    setSpeed(speed) {
        this.speed = speed;
    }
}

// ============================================
// TURING MACHINE SIMULATOR
// ============================================

class TuringMachine {
    constructor() {
        this.tape = [];
        this.headPosition = 0;
        this.currentState = 'q0';
        this.transitions = new Map();
        this.alphabet = ['0', '1'];
        this.halted = false;
        this.steps = 0;

        // Direction mapping
        this.directions = {
            'L': -1,
            'R': 1,
            'S': 0
        };
    }

    reset(tape, transitions, alphabet) {
        this.tape = [...tape];
        this.headPosition = Math.floor(tape.length / 2);
        this.currentState = 'q0';
        this.transitions = this.parseTransitions(transitions);
        this.alphabet = alphabet;
        this.halted = false;
        this.steps = 0;
    }

    parseTransitions(transitionsStr) {
        const transitions = new Map();
        const lines = transitionsStr.trim().split('\n');

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('//')) continue;

            // Parse format: "q0,0 -> q1,1,R"
            const match = trimmed.match(/^(\w+),([^\s]+)\s*->\s*(\w+),([^\s]+),([LRS])$/);
            if (match) {
                const [, currentState, readSymbol, nextState, writeSymbol, direction] = match;
                const key = `${currentState},${readSymbol}`;
                transitions.set(key, {
                    nextState,
                    writeSymbol,
                    direction
                });
            }
        }

        return transitions;
    }

    step() {
        if (this.halted) return false;

        // Ensure tape has enough cells
        this.expandTape();

        const currentSymbol = this.tape[this.headPosition];
        const key = `${this.currentState},${currentSymbol}`;

        const transition = this.transitions.get(key);

        if (!transition || transition.nextState === 'halt') {
            this.halted = true;
            return false;
        }

        // Write symbol
        this.tape[this.headPosition] = transition.writeSymbol;

        // Move head
        this.headPosition += this.directions[transition.direction];

        // Update state
        this.currentState = transition.nextState;

        this.steps++;
        return true;
    }

    expandTape() {
        // Expand tape if head is at edge
        if (this.headPosition < 0) {
            this.tape.unshift(...new Array(Math.abs(this.headPosition) + 10).fill(this.alphabet[0]));
            this.headPosition += Math.abs(this.headPosition) + 10;
        } else if (this.headPosition >= this.tape.length) {
            this.tape.push(...new Array(this.headPosition - this.tape.length + 10).fill(this.alphabet[0]));
        }
    }

    getTapeSegment(windowSize = 20) {
        const start = Math.max(0, this.headPosition - windowSize);
        const end = Math.min(this.tape.length, this.headPosition + windowSize + 1);
        return {
            segment: this.tape.slice(start, end),
            headOffset: this.headPosition - start,
            hasLeft: start > 0,
            hasRight: end < this.tape.length
        };
    }

    getStats() {
        return {
            steps: this.steps,
            headPosition: this.headPosition,
            tapeLength: this.tape.length,
            currentState: this.currentState,
            halted: this.halted
        };
    }
}

// ============================================
// UI CONTROLLER
// ============================================

class SimulatorController {
    constructor() {
        this.canvas = document.getElementById('simulation-canvas');
        this.antSimulator = new LangtonAntSimulator(this.canvas);
        this.turingMachine = new TuringMachine();
        this.currentMode = 'langton';

        this.setupUI();
    }

    setupUI() {
        // Mode switching
        document.getElementById('btn-langton').addEventListener('click', () => this.switchMode('langton'));
        document.getElementById('btn-multistate').addEventListener('click', () => this.switchMode('multistate'));
        document.getElementById('btn-turing').addEventListener('click', () => this.switchMode('turing'));

        // Langton's Ant controls
        document.getElementById('btn-step').addEventListener('click', () => {
            this.antSimulator.step();
            this.antSimulator.render();
            this.antSimulator.updateStats();
        });

        document.getElementById('btn-run').addEventListener('click', () => {
            const isRunning = this.antSimulator.toggle();
            this.updateRunButton('btn-run', isRunning);
        });

        document.getElementById('btn-reset').addEventListener('click', () => {
            this.antSimulator.reset();
            this.updateRunButton('btn-run', false);
        });

        // Speed slider
        document.getElementById('speed-slider').addEventListener('input', (e) => {
            const speed = parseInt(e.target.value);
            document.getElementById('speed-value').textContent = speed;
            this.antSimulator.setSpeed(speed);
        });

        // Multi-state controls
        document.getElementById('rule-input').addEventListener('change', (e) => {
            const rule = e.target.value.trim();
            if (rule) {
                this.antSimulator.setRuleString(rule);
            }
        });

        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const rule = btn.dataset.rule;
                document.getElementById('rule-input').value = rule;
                this.antSimulator.setRuleString(rule);
            });
        });

        // Multi-state control buttons
        document.getElementById('btn-step-multi').addEventListener('click', () => {
            this.antSimulator.step();
            this.antSimulator.render();
            this.antSimulator.updateStats();
        });

        document.getElementById('btn-run-multi').addEventListener('click', () => {
            const isRunning = this.antSimulator.toggle();
            this.updateRunButton('btn-run-multi', isRunning);
        });

        document.getElementById('btn-reset-multi').addEventListener('click', () => {
            this.antSimulator.reset();
            this.updateRunButton('btn-run-multi', false);
        });

        document.getElementById('speed-slider-multi').addEventListener('input', (e) => {
            const speed = parseInt(e.target.value);
            document.getElementById('speed-value-multi').textContent = speed;
            this.antSimulator.setSpeed(speed);
        });

        // Turing Machine controls
        document.getElementById('btn-step-turing').addEventListener('click', () => {
            this.turingMachine.step();
            this.updateTuringDisplay();
        });

        document.getElementById('btn-run-turing').addEventListener('click', () => {
            this.runTuringMachine();
        });

        document.getElementById('btn-reset-turing').addEventListener('click', () => {
            this.resetTuringMachine();
            this.updateRunButton('btn-run-turing', false);
        });

        // Zoom controls
        document.getElementById('btn-zoom-in').addEventListener('click', () => {
            this.antSimulator.zoom(1.2);
        });

        document.getElementById('btn-zoom-out').addEventListener('click', () => {
            this.antSimulator.zoom(0.8);
        });

        document.getElementById('btn-zoom-reset').addEventListener('click', () => {
            this.antSimulator.resetZoom();
        });

        // Initialize Turing machine display
        this.resetTuringMachine();
    }

    switchMode(mode) {
        this.currentMode = mode;

        // Update button states
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`btn-${mode}`).classList.add('active');

        // Show/hide control panels
        document.querySelectorAll('.mode-controls').forEach(panel => panel.classList.remove('active'));

        // Show/hide tape display
        const tapeDisplay = document.getElementById('tape-display');
        const turingStats = document.getElementById('turing-specific-stats');

        switch (mode) {
            case 'langton':
                document.getElementById('langton-controls').classList.add('active');
                tapeDisplay.style.display = 'none';
                turingStats.style.display = 'none';
                this.antSimulator.setRuleString('RL');
                break;
            case 'multistate':
                document.getElementById('multistate-controls').classList.add('active');
                tapeDisplay.style.display = 'none';
                turingStats.style.display = 'none';
                break;
            case 'turing':
                document.getElementById('turing-controls').classList.add('active');
                tapeDisplay.style.display = 'block';
                turingStats.style.display = 'block';
                this.resetTuringMachine();
                break;
        }

        this.antSimulator.reset();
        this.updateRunButton('btn-run', false);
        this.updateRunButton('btn-run-multi', false);
        this.updateRunButton('btn-run-turing', false);
    }

    updateRunButton(buttonId, isRunning) {
        const btn = document.getElementById(buttonId);
        if (isRunning) {
            btn.textContent = 'Pause';
            btn.classList.add('warning');
        } else {
            btn.textContent = 'Run';
            btn.classList.remove('warning');
        }
    }

    resetTuringMachine() {
        const tapeInput = document.getElementById('tape-input').value;
        const transitionsInput = document.getElementById('transitions-input').value;
        const alphabetInput = document.getElementById('alphabet-input').value;

        const tape = tapeInput.split(',').map(s => s.trim());
        const alphabet = alphabetInput.split(',').map(s => s.trim());

        this.turingMachine.reset(tape, transitionsInput, alphabet);
        this.updateTuringDisplay();
    }

    runTuringMachine() {
        const runButton = document.getElementById('btn-run-turing');
        const isRunning = !runButton.classList.contains('warning');

        if (isRunning) {
            runButton.textContent = 'Pause';
            runButton.classList.add('warning');
            this.runTuringLoop();
        } else {
            runButton.textContent = 'Run';
            runButton.classList.remove('warning');
        }
    }

    runTuringLoop() {
        const runButton = document.getElementById('btn-run-turing');
        if (!runButton.classList.contains('warning')) return;

        if (this.turingMachine.halted) {
            runButton.textContent = 'Halted';
            runButton.classList.remove('warning');
            return;
        }

        // Run multiple steps for speed
        for (let i = 0; i < 10; i++) {
            if (this.turingMachine.halted) break;
            this.turingMachine.step();
        }

        this.updateTuringDisplay();

        if (!this.turingMachine.halted) {
            requestAnimationFrame(() => this.runTuringLoop());
        }
    }

    updateTuringDisplay() {
        const stats = this.turingMachine.getStats();

        // Update stats
        document.getElementById('stat-steps').textContent = stats.steps;
        document.getElementById('stat-visited').textContent = '-';
        document.getElementById('stat-direction').textContent = '-';
        document.getElementById('stat-state').textContent = stats.currentState;
        document.getElementById('stat-head-pos').textContent = stats.headPosition;
        document.getElementById('stat-tape-length').textContent = stats.tapeLength;

        // Update tape display
        const tapeContent = document.getElementById('tape-content');
        const tapeData = this.turingMachine.getTapeSegment(30);

        let html = '';

        if (tapeData.hasLeft) {
            html += '<span class="tape-indicator">... </span>';
        }

        tapeData.segment.forEach((symbol, index) => {
            const isHead = index === tapeData.headOffset;
            const className = isHead ? 'tape-cell tape-head' : 'tape-cell';
            html += `<span class="${className}">${symbol}</span>`;
        });

        if (tapeData.hasRight) {
            html += '<span class="tape-indicator"> ...</span>';
        }

        tapeContent.innerHTML = html;
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const controller = new SimulatorController();

    // Set initial focus
    document.getElementById('btn-langton').focus();
});

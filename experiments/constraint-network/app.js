// Constraint Propagation Network Simulator
// Demonstrates how constraints propagate through a network of variables

// ==================== DATA STRUCTURES ====================

class Variable {
    constructor(id, name, domain, x = 0, y = 0) {
        this.id = id;
        this.name = name;
        this.domain = [...domain]; // Array of possible values
        this.initialDomain = [...domain];
        this.assignedValue = null;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 30;
        this.isAnimating = false;
        this.justReduced = false;
        this.inConflict = false;
    }

    assign(value) {
        if (this.domain.includes(value)) {
            this.assignedValue = value;
            this.domain = [value];
            return true;
        }
        return false;
    }

    unassign() {
        this.assignedValue = null;
        this.domain = [...this.initialDomain];
        this.inConflict = false;
    }

    reduceDomain(newDomain) {
        const oldSize = this.domain.length;
        this.domain = newDomain;
        return this.domain.length < oldSize;
    }

    isAssigned() {
        return this.assignedValue !== null;
    }

    isEmpty() {
        return this.domain.length === 0;
    }

    clone() {
        const v = new Variable(this.id, this.name, this.initialDomain, this.x, this.y);
        v.domain = [...this.domain];
        v.assignedValue = this.assignedValue;
        return v;
    }
}

class Constraint {
    constructor(id, var1, var2, type, description = '') {
        this.id = id;
        this.var1 = var1; // Variable ID
        this.var2 = var2; // Variable ID
        this.type = type; // 'neq', 'eq', 'lt', 'gt', 'all_diff', etc.
        this.description = description;
        this.isSatisfied = false;
        this.isFiring = false;
        this.firingProgress = 0;
    }

    check(val1, val2) {
        switch (this.type) {
            case 'neq': return val1 !== val2;
            case 'eq': return val1 === val2;
            case 'lt': return val1 < val2;
            case 'gt': return val1 > val2;
            case 'lte': return val1 <= val2;
            case 'gte': return val1 >= val2;
            case 'mod_neq': return Math.abs(val1 - val2) > 1;
            default: return true;
        }
    }

    getSymbol() {
        switch (this.type) {
            case 'neq': return '≠';
            case 'eq': return '=';
            case 'lt': return '<';
            case 'gt': return '>';
            case 'lte': return '≤';
            case 'gte': return '≥';
            case 'mod_neq': return '≠±1';
            default: return '?';
        }
    }

    clone() {
        return new Constraint(this.id, this.var1, this.var2, this.type, this.description);
    }
}

// ==================== CSP PROBLEM DEFINITIONS ====================

const CSP_PROBLEMS = {
    'map-coloring': {
        name: 'Map Coloring (Australia)',
        domain: ['red', 'green', 'blue'],
        variables: [
            { id: 'WA', name: 'WA', x: 0.1, y: 0.5 },
            { id: 'NT', name: 'NT', x: 0.3, y: 0.4 },
            { id: 'SA', name: 'SA', x: 0.3, y: 0.7 },
            { id: 'Q', name: 'Q', x: 0.5, y: 0.3 },
            { id: 'NSW', name: 'NSW', x: 0.6, y: 0.6 },
            { id: 'V', name: 'V', x: 0.5, y: 0.85 },
            { id: 'T', name: 'T', x: 0.85, y: 0.7 }
        ],
        constraints: [
            ['WA', 'NT'], ['WA', 'SA'], ['NT', 'SA'], ['NT', 'Q'],
            ['SA', 'Q'], ['SA', 'NSW'], ['SA', 'V'], ['Q', 'NSW'],
            ['NSW', 'V']
        ],
        constraintType: 'neq'
    },

    'sudoku': {
        name: 'Sudoku (4×4)',
        domain: [1, 2, 3, 4],
        variables: [],
        constraints: [],
        constraintType: 'neq',
        generate: function() {
            // Generate 4x4 grid
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 4; col++) {
                    this.variables.push({
                        id: `R${row}C${col}`,
                        name: `R${row}C${col}`,
                        x: 0.15 + col * 0.2,
                        y: 0.15 + row * 0.2
                    });
                }
            }
            // Row constraints
            for (let row = 0; row < 4; row++) {
                for (let c1 = 0; c1 < 4; c1++) {
                    for (let c2 = c1 + 1; c2 < 4; c2++) {
                        this.constraints.push([`R${row}C${c1}`, `R${row}C${c2}`]);
                    }
                }
            }
            // Column constraints
            for (let col = 0; col < 4; col++) {
                for (let r1 = 0; r1 < 4; r1++) {
                    for (let r2 = r1 + 1; r2 < 4; r2++) {
                        this.constraints.push([`R${r1}C${col}`, `R${r2}C${col}`]);
                    }
                }
            }
            // Box constraints (2x2)
            for (let boxRow = 0; boxRow < 2; boxRow++) {
                for (let boxCol = 0; boxCol < 2; boxCol++) {
                    const cells = [];
                    for (let r = 0; r < 2; r++) {
                        for (let c = 0; c < 2; c++) {
                            cells.push(`R${boxRow * 2 + r}C${boxCol * 2 + c}`);
                        }
                    }
                    for (let i = 0; i < cells.length; i++) {
                        for (let j = i + 1; j < cells.length; j++) {
                            this.constraints.push([cells[i], cells[j]]);
                        }
                    }
                }
            }
        }
    },

    'nqueens': {
        name: 'N-Queens (4×4)',
        domain: [1, 2, 3, 4],
        variables: [],
        constraints: [],
        constraintType: 'mod_neq',
        generate: function() {
            // Each variable represents a row, domain is column position
            for (let row = 0; row < 4; row++) {
                this.variables.push({
                    id: `Q${row}`,
                    name: `Q${row}`,
                    x: 0.15 + row * 0.2,
                    y: 0.5
                });
            }
            // All queens must be on different columns and diagonals
            for (let r1 = 0; r1 < 4; r1++) {
                for (let r2 = r1 + 1; r2 < 4; r2++) {
                    this.constraints.push([`Q${r1}`, `Q${r2}`]);
                }
            }
        }
    },

    'schedule': {
        name: 'Meeting Scheduling',
        domain: ['9AM', '10AM', '11AM', '2PM'],
        variables: [
            { id: 'Alice', name: 'Alice', x: 0.2, y: 0.3 },
            { id: 'Bob', name: 'Bob', x: 0.5, y: 0.2 },
            { id: 'Charlie', name: 'Charlie', x: 0.8, y: 0.3 },
            { id: 'David', name: 'David', x: 0.3, y: 0.6 },
            { id: 'Eve', name: 'Eve', x: 0.7, y: 0.7 }
        ],
        constraints: [
            ['Alice', 'Bob'],
            ['Bob', 'Charlie'],
            ['Charlie', 'David'],
            ['David', 'Eve'],
            ['Alice', 'Eve']
        ],
        constraintType: 'neq'
    },

    'custom': {
        name: 'Custom Network',
        domain: [1, 2, 3],
        variables: [
            { id: 'A', name: 'A', x: 0.2, y: 0.3 },
            { id: 'B', name: 'B', x: 0.5, y: 0.2 },
            { id: 'C', name: 'C', x: 0.8, y: 0.3 },
            { id: 'D', name: 'D', x: 0.35, y: 0.6 },
            { id: 'E', name: 'E', x: 0.65, y: 0.7 }
        ],
        constraints: [
            ['A', 'B'], ['B', 'C'], ['A', 'D'],
            ['B', 'D'], ['C', 'E'], ['D', 'E']
        ],
        constraintType: 'neq'
    }
};

// ==================== CSP SOLVER ====================

class CSPSolver {
    constructor(variables, constraints) {
        this.variables = variables;
        this.constraints = constraints;
        this.stats = {
            reductions: 0,
            backtracks: 0,
            steps: 0
        };
        this.steps = [];
        this.currentStep = 0;
        this.isRunning = false;
        this.animationQueue = [];
    }

    // Get neighbors of a variable
    getNeighbors(varId) {
        const neighbors = new Set();
        for (const c of this.constraints) {
            if (c.var1 === varId) neighbors.add(c.var2);
            if (c.var2 === varId) neighbors.add(c.var1);
        }
        return Array.from(neighbors);
    }

    // Get constraints between two variables
    getConstraint(var1, var2) {
        return this.constraints.find(c =>
            (c.var1 === var1 && c.var2 === var2) ||
            (c.var1 === var2 && c.var2 === var1)
        );
    }

    // Forward Checking: propagate after assignment
    forwardChecking(varId) {
        const reductions = [];
        const variable = this.variables.find(v => v.id === varId);
        if (!variable || !variable.isAssigned()) return reductions;

        const neighbors = this.getNeighbors(varId);

        for (const neighborId of neighbors) {
            const neighbor = this.variables.find(v => v.id === neighborId);
            if (!neighbor.isAssigned()) {
                const oldDomain = [...neighbor.domain];
                neighbor.domain = neighbor.domain.filter(val =>
                    this.getConstraint(varId, neighborId).check(variable.assignedValue, val)
                );

                if (neighbor.domain.length < oldDomain.length) {
                    this.stats.reductions++;
                    reductions.push({
                        variable: neighbor,
                        oldDomain,
                        newDomain: [...neighbor.domain],
                        constraint: this.getConstraint(varId, neighborId)
                    });

                    if (neighbor.isEmpty()) {
                        neighbor.inConflict = true;
                        return reductions; // Domain wipeout
                    }
                }
            }
        }

        return reductions;
    }

    // AC-3: Arc Consistency Algorithm
    ac3() {
        const reductions = [];
        const queue = [];

        // Initialize queue with all arcs
        for (const c of this.constraints) {
            queue.push([c.var1, c.var2]);
            queue.push([c.var2, c.var1]);
        }

        while (queue.length > 0) {
            const [xi, xj] = queue.shift();
            const revised = this.revise(xi, xj);

            if (revised.reduced) {
                this.stats.reductions++;
                reductions.push(revised);

                const variable = this.variables.find(v => v.id === xi);
                if (variable.isEmpty()) {
                    variable.inConflict = true;
                    return reductions;
                }

                // Add neighbors back to queue
                const neighbors = this.getNeighbors(xi).filter(n => n !== xj);
                for (const xk of neighbors) {
                    queue.push([xk, xi]);
                }
            }
        }

        return reductions;
    }

    revise(xi, xj) {
        const variableI = this.variables.find(v => v.id === xi);
        const variableJ = this.variables.find(v => v.id === xj);
        const constraint = this.getConstraint(xi, xj);
        const oldDomain = [...variableI.domain];
        let revised = false;

        variableI.domain = variableI.domain.filter(val => {
            if (variableJ.isAssigned()) {
                return constraint.check(val, variableJ.assignedValue);
            } else {
                // Check if there's any value in j's domain that satisfies the constraint
                return variableJ.domain.some(valJ => constraint.check(val, valJ));
            }
        });

        if (variableI.domain.length < oldDomain.length) {
            revised = true;
        }

        return {
            reduced: revised,
            variable: variableI,
            oldDomain,
            newDomain: [...variableI.domain],
            constraint,
            from: xj
        };
    }

    // Backtracking with propagation
    backtrack(assignment = {}) {
        // Check if assignment is complete
        if (Object.keys(assignment).length === this.variables.length) {
            return { success: true, assignment };
        }

        // Select unassigned variable
        const unassigned = this.variables.filter(v => !v.isAssigned());
        const variable = unassigned[0]; // Simple: select first

        // Try each value in domain
        for (const value of variable.domain) {
            // Save state
            const savedState = this.saveState();

            // Assign value
            variable.assign(value);
            assignment[variable.id] = value;
            this.stats.steps++;

            // Check consistency and propagate
            const reductions = this.forwardChecking(variable.id);
            const hasConflict = this.variables.some(v => v.inConflict || v.isEmpty());

            if (!hasConflict) {
                // Recursively continue
                const result = this.backtrack(assignment);
                if (result.success) {
                    return result;
                }
            }

            // Backtrack: restore state
            this.restoreState(savedState);
            delete assignment[variable.id];
            this.stats.backtracks++;
        }

        return { success: false, assignment: null };
    }

    saveState() {
        return {
            variables: this.variables.map(v => ({
                id: v.id,
                domain: [...v.domain],
                assignedValue: v.assignedValue,
                inConflict: v.inConflict
            })),
            stats: { ...this.stats }
        };
    }

    restoreState(state) {
        for (const savedVar of state.variables) {
            const variable = this.variables.find(v => v.id === savedVar.id);
            variable.domain = [...savedVar.domain];
            variable.assignedValue = savedVar.assignedValue;
            variable.inConflict = savedVar.inConflict;
        }
        this.stats = { ...state.stats };
    }

    reset() {
        this.stats = { reductions: 0, backtracks: 0, steps: 0 };
        for (const variable of this.variables) {
            variable.unassign();
        }
        for (const constraint of this.constraints) {
            constraint.isSatisfied = false;
            constraint.isFiring = false;
        }
    }
}

// ==================== VISUALIZATION ====================

class NetworkVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.variables = [];
        this.constraints = [];
        this.colorMap = {};
        this.setupCanvas();
        this.bindEvents();
    }

    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;
    }

    bindEvents() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('resize', () => this.setupCanvas());
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        for (const variable of this.variables) {
            const vx = variable.x * this.width;
            const vy = variable.y * this.height;
            const dist = Math.sqrt((x - vx) ** 2 + (y - vy) ** 2);

            if (dist <= variable.radius) {
                if (!variable.isAssigned() && variable.domain.length > 0) {
                    // Cycle through domain values
                    const currentIndex = variable.domain.indexOf(variable.assignedValue);
                    const nextIndex = (currentIndex + 1) % variable.domain.length;
                    variable.assign(variable.domain[nextIndex]);

                    // Trigger propagation
                    window.solver.forwardChecking(variable.id);
                    this.updateStats();
                }
                break;
            }
        }
    }

    handleRightClick(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        for (const variable of this.variables) {
            const vx = variable.x * this.width;
            const vy = variable.y * this.height;
            const dist = Math.sqrt((x - vx) ** 2 + (y - vy) ** 2);

            if (dist <= variable.radius) {
                if (variable.isAssigned()) {
                    variable.unassign();
                    this.updateStats();
                }
                break;
            }
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const tooltip = document.getElementById('tooltip');

        let found = false;
        for (const variable of this.variables) {
            const vx = variable.x * this.width;
            const vy = variable.y * this.height;
            const dist = Math.sqrt((x - vx) ** 2 + (y - vy) ** 2);

            if (dist <= variable.radius) {
                tooltip.innerHTML = `
                    <h4>${variable.name}</h4>
                    <p><strong>Domain:</strong> ${variable.domain.join(', ')}</p>
                    <p><strong>Assigned:</strong> ${variable.assignedValue || 'None'}</p>
                    ${variable.isEmpty() ? '<p style="color: #ef4444;"><strong>Domain Wipeout!</strong></p>' : ''}
                `;
                tooltip.style.left = (e.clientX + 15) + 'px';
                tooltip.style.top = (e.clientY + 15) + 'px';
                tooltip.classList.add('visible');
                found = true;
                break;
            }
        }

        if (!found) {
            tooltip.classList.remove('visible');
        }
    }

    loadProblem(problemKey) {
        const problem = CSP_PROBLEMS[problemKey];

        if (problem.generate) {
            problem.generate();
        }

        this.variables = problem.variables.map((v, i) => {
            const variable = new Variable(
                v.id,
                v.name,
                problem.domain,
                v.x * this.width,
                v.y * this.height
            );
            return variable;
        });

        this.constraints = problem.constraints.map((c, i) => {
            return new Constraint(
                `c${i}`,
                c[0],
                c[1],
                problem.constraintType,
                `${c[0]} ${problem.constraintType} ${c[1]}`
            );
        });

        this.setupColorMap(problem.domain);

        window.solver = new CSPSolver(this.variables, this.constraints);
        this.updateStats();
        this.updateLegend();
        this.draw();
    }

    setupColorMap(domain) {
        const colors = [
            '#ef4444', '#3b82f6', '#10b981', '#f59e0b',
            '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
        ];

        this.colorMap = {};
        domain.forEach((value, i) => {
            this.colorMap[value] = colors[i % colors.length];
        });
    }

    updateStats() {
        document.getElementById('varCount').textContent = this.variables.length;
        document.getElementById('constraintCount').textContent = this.constraints.length;
        document.getElementById('reductionCount').textContent = window.solver.stats.reductions;
        document.getElementById('backtrackCount').textContent = window.solver.stats.backtracks;
        document.getElementById('stepCount').textContent = window.solver.stats.steps;

        const hasConflict = this.variables.some(v => v.inConflict || v.isEmpty());
        const allAssigned = this.variables.every(v => v.isAssigned());

        let status = 'Ready';
        let statusClass = 'status-ready';

        if (hasConflict) {
            status = 'Conflict!';
            statusClass = 'status-conflict';
        } else if (allAssigned) {
            status = 'Solved!';
            statusClass = 'status-solution';
        } else if (this.variables.some(v => v.isAssigned())) {
            status = 'Propagating...';
            statusClass = 'status-running';
        }

        const statusEl = document.getElementById('statusValue');
        statusEl.textContent = status;
        statusEl.className = 'stat-value ' + statusClass;
    }

    updateLegend() {
        const legend = document.getElementById('domainLegend');
        legend.innerHTML = '';

        Object.entries(this.colorMap).forEach(([value, color]) => {
            const item = document.createElement('div');
            item.className = 'domain-item';
            item.innerHTML = `
                <div class="domain-dot" style="background: ${color}"></div>
                <span>${value}</span>
            `;
            legend.appendChild(item);
        });
    }

    updateExplanation(text) {
        document.getElementById('explanationText').textContent = text;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw constraints first (behind variables)
        this.drawConstraints();

        // Draw variables
        this.drawVariables();

        requestAnimationFrame(() => this.draw());
    }

    drawConstraints() {
        for (const constraint of this.constraints) {
            const var1 = this.variables.find(v => v.id === constraint.var1);
            const var2 = this.variables.find(v => v.id === constraint.var2);

            if (!var1 || !var2) continue;

            const x1 = var1.x * this.width;
            const y1 = var1.y * this.height;
            const x2 = var2.x * this.width;
            const y2 = var2.y * this.height;

            // Check if constraint is satisfied
            const isSatisfied = var1.isAssigned() && var2.isAssigned() &&
                constraint.check(var1.assignedValue, var2.assignedValue);

            // Draw edge
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);

            if (constraint.isFiring) {
                // Animate firing
                this.ctx.strokeStyle = '#f59e0b';
                this.ctx.lineWidth = 4;
                constraint.firingProgress += 0.05;
                if (constraint.firingProgress >= 1) {
                    constraint.isFiring = false;
                    constraint.firingProgress = 0;
                }
            } else if (isSatisfied) {
                this.ctx.strokeStyle = '#10b981';
                this.ctx.lineWidth = 2;
            } else {
                this.ctx.strokeStyle = '#374151';
                this.ctx.lineWidth = 2;
            }

            this.ctx.stroke();

            // Draw constraint label
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            this.ctx.fillStyle = '#1f2937';
            this.ctx.beginPath();
            this.ctx.arc(midX, midY, 12, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillStyle = isSatisfied ? '#10b981' : '#9ca3af';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(constraint.getSymbol(), midX, midY);

            // Animate pulse if firing
            if (constraint.isFiring) {
                const pulseRadius = 20 * Math.sin(constraint.firingProgress * Math.PI);
                this.ctx.beginPath();
                this.ctx.arc(midX, midY, 12 + pulseRadius, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(245, 158, 11, ${1 - constraint.firingProgress})`;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        }
    }

    drawVariables() {
        for (const variable of this.variables) {
            const x = variable.x * this.width;
            const y = variable.y * this.height;

            // Draw shadow
            this.ctx.beginPath();
            this.ctx.arc(x + 2, y + 2, variable.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fill();

            // Draw variable circle
            this.ctx.beginPath();
            this.ctx.arc(x, y, variable.radius, 0, Math.PI * 2);

            if (variable.inConflict || variable.isEmpty()) {
                this.ctx.fillStyle = '#7f1d1d';
                this.ctx.strokeStyle = '#ef4444';
            } else if (variable.isAssigned()) {
                this.ctx.fillStyle = this.colorMap[variable.assignedValue] || '#1f2937';
                this.ctx.strokeStyle = this.colorMap[variable.assignedValue] || '#374151';
            } else {
                this.ctx.fillStyle = '#1f2937';
                this.ctx.strokeStyle = '#374151';
            }

            this.ctx.fill();
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            // Draw variable name
            this.ctx.fillStyle = '#f3f4f6';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(variable.name, x, y);

            // Draw assigned value
            if (variable.isAssigned()) {
                this.ctx.font = '12px Arial';
                this.ctx.fillText(`=${variable.assignedValue}`, x, y + 15);
            }

            // Draw domain dots below variable
            this.drawDomainDots(variable, x, y);
        }
    }

    drawDomainDots(variable, x, y) {
        if (variable.isAssigned()) return;

        const dotRadius = 5;
        const dotSpacing = 12;
        const totalWidth = (variable.domain.length - 1) * dotSpacing;
        const startX = x - totalWidth / 2;
        const dotY = y + variable.radius + 20;

        variable.domain.forEach((value, i) => {
            const dotX = startX + i * dotSpacing;

            this.ctx.beginPath();
            this.ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = this.colorMap[value] || '#9ca3af';
            this.ctx.fill();

            this.ctx.strokeStyle = '#374151';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        });

        // Show domain size if too many values
        if (variable.domain.length > 8) {
            this.ctx.fillStyle = '#9ca3af';
            this.ctx.font = '11px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`(${variable.domain.length})`, x, dotY + 15);
        }
    }
}

// ==================== CONTROLLER ====================

class SimulatorController {
    constructor() {
        this.visualizer = null;
        this.isRunning = false;
        this.speed = 500;
        this.setupControls();
    }

    init() {
        const canvas = document.getElementById('networkCanvas');
        this.visualizer = new NetworkVisualizer(canvas);
        this.visualizer.loadProblem('map-coloring');
        this.visualizer.updateExplanation(
            'Map Coloring Problem: Color each region so that no adjacent regions have the same color. ' +
            'Click a region to assign it a color and watch the constraint propagate!'
        );
    }

    setupControls() {
        document.getElementById('problemSelect').addEventListener('change', (e) => {
            this.stop();
            this.visualizer.loadProblem(e.target.value);

            const explanations = {
                'map-coloring': 'Map Coloring Problem: Color each region so that no adjacent regions have the same color.',
                'sudoku': 'Sudoku: Fill the grid so that each row, column, and 2×2 box contains digits 1-4 exactly once.',
                'nqueens': 'N-Queens: Place 4 queens on a 4×4 board so that no two queens attack each other (same row, column, or diagonal).',
                'schedule': 'Meeting Scheduling: Schedule meetings so that conflicting meetings don\'t overlap.',
                'custom': 'Custom Network: A simple constraint network for experimentation.'
            };

            this.visualizer.updateExplanation(explanations[e.target.value] || '');
        });

        document.getElementById('stepBtn').addEventListener('click', () => this.step());
        document.getElementById('runBtn').addEventListener('click', () => this.toggleRun());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());

        document.getElementById('speedSlider').addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            document.getElementById('speedValue').textContent = this.speed + 'ms';
        });

        document.getElementById('algorithmSelect').addEventListener('change', (e) => {
            this.stop();
            this.reset();
        });
    }

    async step() {
        if (this.isRunning) return;

        const algorithm = document.getElementById('algorithmSelect').value;
        const solver = window.solver;

        // Find first unassigned variable
        const unassigned = solver.variables.filter(v => !v.isAssigned());
        if (unassigned.length === 0) {
            this.visualizer.updateExplanation('All variables are assigned! Problem ' +
                (solver.variables.some(v => v.inConflict) ? 'has conflicts.' : 'is solved!'));
            return;
        }

        const variable = unassigned[0];
        const value = variable.domain[0];

        if (value === undefined) {
            this.visualizer.updateExplanation(`Variable ${variable.name} has an empty domain - need to backtrack!`);
            return;
        }

        // Animate assignment
        this.visualizer.updateExplanation(`Assigning ${variable.name} = ${value}...`);
        variable.assign(value);
        solver.stats.steps++;

        // Animate constraint propagation
        const neighbors = solver.getNeighbors(variable.id);
        for (const neighborId of neighbors) {
            const constraint = solver.getConstraint(variable.id, neighborId);
            constraint.isFiring = true;
            constraint.firingProgress = 0;
        }

        await this.delay(this.speed / 2);

        // Apply propagation
        const reductions = solver.forwardChecking(variable.id);

        if (reductions.length > 0) {
            for (const reduction of reductions) {
                reduction.variable.justReduced = true;
                setTimeout(() => {
                    reduction.variable.justReduced = false;
                }, this.speed);
            }

            this.visualizer.updateExplanation(
                `Constraint propagated! ${reductions.length} domain(s) reduced. ` +
                reductions.map(r => `${r.variable.name}: [${r.oldDomain.join(',')}] → [${r.newDomain.join(',')}]`).join('; ')
            );
        }

        this.visualizer.updateStats();
    }

    async toggleRun() {
        const btn = document.getElementById('runBtn');

        if (this.isRunning) {
            this.stop();
        } else {
            this.isRunning = true;
            btn.textContent = '⏸ Pause';
            btn.classList.remove('btn-success');
            btn.classList.add('btn-primary');

            await this.run();
        }
    }

    async run() {
        while (this.isRunning) {
            const solver = window.solver;
            const unassigned = solver.variables.filter(v => !v.isAssigned());

            if (unassigned.length === 0) {
                this.stop();
                const hasConflict = solver.variables.some(v => v.inConflict);
                this.visualizer.updateExplanation(
                    hasConflict ? 'Failed: Solution has conflicts!' : 'Success! All constraints satisfied!'
                );
                return;
            }

            await this.step();
            await this.delay(this.speed);
        }
    }

    stop() {
        this.isRunning = false;
        const btn = document.getElementById('runBtn');
        btn.textContent = '► Run';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-success');
    }

    reset() {
        this.stop();
        window.solver.reset();
        this.visualizer.updateStats();
        this.visualizer.updateExplanation('Problem reset. Click a variable to assign a value, or press Run to auto-solve.');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', () => {
    window.controller = new SimulatorController();
    window.controller.init();
});

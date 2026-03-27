// Tree of Thoughts Simulator - Constraint Theory
// Visualizes deterministic reasoning paths through geometric constraints

class TreeNode {
    constructor(id, state, parent = null, depth = 0, constraint = null) {
        this.id = id;
        this.state = state;
        this.parent = parent;
        this.children = [];
        this.depth = depth;
        this.constraint = constraint; // What constraint led to this node
        this.status = 'unexplored'; // unexplored, exploring, explored, pruned, optimal
        this.heuristic = 0;
        this.cost = 0;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
    }
}

class TreeOfThoughtsSimulator {
    constructor() {
        this.canvas = document.getElementById('tree-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nodes = new Map();
        this.root = null;
        this.currentNodeId = 0;
        this.strategy = 'bfs';
        this.problemType = 'maze';
        this.speed = 50;
        this.isRunning = false;
        this.isPaused = false;
        this.showOptions = {
            explored: true,
            pruned: true,
            optimal: true,
            constraints: true
        };

        // Camera
        this.camera = { x: 0, y: 0, zoom: 1 };
        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };

        // Statistics
        this.nodesExplored = 0;
        this.branchesPruned = 0;
        this.solutionPath = [];
        this.optimalPath = [];

        // Animation
        this.animationFrame = null;
        this.explorationQueue = [];
        this.particles = [];

        this.setupCanvas();
        this.setupEventListeners();
        this.initializeProblem();
        this.render();
    }

    setupCanvas() {
        const resize = () => {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
            this.render();
        };
        window.addEventListener('resize', resize);
        resize();
    }

    setupEventListeners() {
        // Strategy buttons
        document.querySelectorAll('.strategy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.strategy-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.strategy = e.target.dataset.strategy;
            });
        });

        // Problem type
        document.getElementById('problem-type').addEventListener('change', (e) => {
            this.problemType = e.target.value;
            this.reset();
        });

        // Speed control
        document.getElementById('speed').addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
        });

        // Show/hide checkboxes
        document.querySelectorAll('[data-show]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.showOptions[e.target.dataset.show] = e.target.checked;
                this.render();
            });
        });

        // Action buttons
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());

        // Canvas interactions
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        this.canvas.addEventListener('click', (e) => this.onClick(e));
    }

    initializeProblem() {
        this.nodes.clear();
        this.currentNodeId = 0;
        this.nodesExplored = 0;
        this.branchesPruned = 0;
        this.solutionPath = [];
        this.optimalPath = [];
        this.particles = [];

        const initialState = this.getInitialState();
        this.root = new TreeNode(this.currentNodeId++, initialState, null, 0);
        this.root.x = 0;
        this.root.y = 0;
        this.nodes.set(this.root.id, this.root);

        this.updateLayout();
        this.updateStats();
        this.render();
    }

    getInitialState() {
        switch(this.problemType) {
            case 'maze':
                return { tiles: [1, 2, 3, 4, 0, 5, 6, 7, 8], empty: 4 }; // 8-puzzle
            case 'pathfinding':
                return { x: 0, y: 0, goal: { x: 4, y: 4 }, grid: 5 };
            case 'math':
                return { expression: '2 + 3 * 4', step: 0 };
            case 'csp':
                return { variables: { A: null, B: null, C: null }, domain: [1, 2, 3] };
            default:
                return {};
        }
    }

    isGoalState(state) {
        switch(this.problemType) {
            case 'maze':
                return state.tiles.join('') === '123456780';
            case 'pathfinding':
                return state.x === state.goal.x && state.y === state.goal.y;
            case 'math':
                return state.step >= 3;
            case 'csp':
                return Object.values(state.variables).every(v => v !== null);
            default:
                return false;
        }
    }

    generateSuccessors(node) {
        const successors = [];
        const state = node.state;

        switch(this.problemType) {
            case 'maze':
                successors.push(...this.generatePuzzleMoves(node));
                break;
            case 'pathfinding':
                successors.push(...this.generatePathMoves(node));
                break;
            case 'math':
                successors.push(...this.generateMathSteps(node));
                break;
            case 'csp':
                successors.push(...this.generateCSPAssignments(node));
                break;
        }

        return successors;
    }

    generatePuzzleMoves(node) {
        const moves = [];
        const state = node.state;
        const empty = state.empty;
        const size = 3;

        const validMoves = [];
        if (empty >= size) validMoves.push('up');
        if (empty < size * (size - 1)) validMoves.push('down');
        if (empty % size > 0) validMoves.push('left');
        if (empty % size < size - 1) validMoves.push('right');

        for (const move of validMoves) {
            const newTiles = [...state.tiles];
            let newEmpty = empty;

            switch(move) {
                case 'up': newEmpty = empty - size; break;
                case 'down': newEmpty = empty + size; break;
                case 'left': newEmpty = empty - 1; break;
                case 'right': newEmpty = empty + 1; break;
            }

            [newTiles[empty], newTiles[newEmpty]] = [newTiles[newEmpty], newTiles[empty]];

            const constraint = `Tile ${newTiles[empty]} moves ${move}`;
            const newState = { tiles: newTiles, empty: newEmpty };
            const newNode = new TreeNode(
                this.currentNodeId++,
                newState,
                node,
                node.depth + 1,
                constraint
            );

            // Calculate heuristic (Manhattan distance)
            newNode.heuristic = this.calculatePuzzleHeuristic(newState);
            newNode.cost = node.cost + 1;

            moves.push(newNode);
        }

        return moves;
    }

    calculatePuzzleHeuristic(state) {
        let distance = 0;
        for (let i = 0; i < state.tiles.length; i++) {
            const tile = state.tiles[i];
            if (tile !== 0) {
                const goalPos = tile - 1;
                const currentX = i % 3;
                const currentY = Math.floor(i / 3);
                const goalX = goalPos % 3;
                const goalY = Math.floor(goalPos / 3);
                distance += Math.abs(currentX - goalX) + Math.abs(currentY - goalY);
            }
        }
        return distance;
    }

    generatePathMoves(node) {
        const moves = [];
        const state = node.state;
        const directions = [
            { dx: 0, dy: -1, name: 'up' },
            { dx: 0, dy: 1, name: 'down' },
            { dx: -1, dy: 0, name: 'left' },
            { dx: 1, dy: 0, name: 'right' }
        ];

        for (const dir of directions) {
            const newX = state.x + dir.dx;
            const newY = state.y + dir.dy;

            if (newX >= 0 && newX < state.grid && newY >= 0 && newY < state.grid) {
                const constraint = `Move ${dir.name} to (${newX}, ${newY})`;
                const newState = {
                    x: newX,
                    y: newY,
                    goal: state.goal,
                    grid: state.grid
                };
                const newNode = new TreeNode(
                    this.currentNodeId++,
                    newState,
                    node,
                    node.depth + 1,
                    constraint
                );

                // Manhattan distance to goal
                newNode.heuristic = Math.abs(newX - state.goal.x) + Math.abs(newY - state.goal.y);
                newNode.cost = node.cost + 1;

                moves.push(newNode);
            }
        }

        return moves;
    }

    generateMathSteps(node) {
        const steps = [];
        const state = node.state;

        if (state.step === 0) {
            // Apply operator precedence
            const constraint = 'Apply operator precedence: 3 * 4 = 12';
            const newState = { expression: '2 + 12', step: 1 };
            const newNode = new TreeNode(this.currentNodeId++, newState, node, node.depth + 1, constraint);
            newNode.heuristic = 3 - newState.step;
            steps.push(newNode);
        } else if (state.step === 1) {
            // Add remaining numbers
            const constraint = 'Add: 2 + 12 = 14';
            const newState = { expression: '14', step: 2 };
            const newNode = new TreeNode(this.currentNodeId++, newState, node, node.depth + 1, constraint);
            newNode.heuristic = 3 - newState.step;
            steps.push(newNode);
        } else if (state.step === 2) {
            // Final verification
            const constraint = 'Verify: 14 is the result';
            const newState = { expression: '14', step: 3 };
            const newNode = new TreeNode(this.currentNodeId++, newState, node, node.depth + 1, constraint);
            newNode.heuristic = 0;
            steps.push(newNode);
        }

        return steps;
    }

    generateCSPAssignments(node) {
        const assignments = [];
        const state = node.state;

        // Find first unassigned variable
        const unassignedVars = Object.keys(state.variables).filter(v => state.variables[v] === null);

        if (unassignedVars.length === 0) return [];

        const varName = unassignedVars[0];

        for (const value of state.domain) {
            // Check constraint: all variables must be different
            let valid = true;
            for (const [otherVar, otherValue] of Object.entries(state.variables)) {
                if (otherVar !== varName && otherValue === value) {
                    valid = false;
                    break;
                }
            }

            if (valid) {
                const constraint = `Assign ${varName} = ${value} (all-different constraint)`;
                const newVariables = { ...state.variables, [varName]: value };
                const newState = { variables: newVariables, domain: state.domain };
                const newNode = new TreeNode(
                    this.currentNodeId++,
                    newState,
                    node,
                    node.depth + 1,
                    constraint
                );

                newNode.heuristic = unassignedVars.length - 1;
                newNode.cost = node.cost + 1;

                assignments.push(newNode);
            } else {
                // This branch gets pruned
                const constraint = `Assign ${varName} = ${value} (VIOLATES all-different)`;
                const newVariables = { ...state.variables, [varName]: value };
                const newState = { variables: newVariables, domain: state.domain };
                const newNode = new TreeNode(
                    this.currentNodeId++,
                    newState,
                    node,
                    node.depth + 1,
                    constraint
                );
                newNode.status = 'pruned';
                this.branchesPruned++;
                assignments.push(newNode);
            }
        }

        return assignments;
    }

    async start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;
        document.getElementById('start-btn').disabled = true;
        document.getElementById('pause-btn').disabled = false;

        await this.runSearch();

        this.isRunning = false;
        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pause-btn').textContent = this.isPaused ? 'Resume' : 'Pause';
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        document.getElementById('start-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
        document.getElementById('pause-btn').textContent = 'Pause';

        this.initializeProblem();
    }

    async runSearch() {
        this.explorationQueue = [this.root];
        this.updateState('Exploring...');

        while (this.explorationQueue.length > 0 && this.isRunning) {
            while (this.isPaused) {
                await this.delay(100);
            }

            const node = this.getNextNode();
            if (!node) continue;

            node.status = 'exploring';
            this.updateLayout();
            this.render();
            await this.delay(this.getDelay());

            if (this.isGoalState(node.state)) {
                node.status = 'optimal';
                this.findOptimalPath(node);
                this.updateState('Goal Found!');
                document.getElementById('solution-depth').textContent = node.depth;
                this.animateSolution();
                return;
            }

            const successors = this.generateSuccessors(node);

            for (const successor of successors) {
                if (successor.status !== 'pruned') {
                    // Check for cycles
                    if (!this.checkCycle(successor)) {
                        this.nodes.set(successor.id, successor);
                        node.children.push(successor);
                        this.explorationQueue.push(successor);
                    } else {
                        successor.status = 'pruned';
                        this.branchesPruned++;
                        this.nodes.set(successor.id, successor);
                        node.children.push(successor);
                    }
                } else {
                    this.nodes.set(successor.id, successor);
                    node.children.push(successor);
                }
            }

            node.status = 'explored';
            this.nodesExplored++;
            this.updateStats();
            this.updateLayout();
            this.render();

            await this.delay(this.getDelay());
        }

        this.updateState('No Solution Found');
    }

    getNextNode() {
        switch(this.strategy) {
            case 'bfs':
                return this.explorationQueue.shift();
            case 'dfs':
                return this.explorationQueue.pop();
            case 'best-first':
                this.explorationQueue.sort((a, b) => a.heuristic - b.heuristic);
                return this.explorationQueue.shift();
            case 'astar':
                this.explorationQueue.sort((a, b) => (a.heuristic + a.cost) - (b.heuristic + b.cost));
                return this.explorationQueue.shift();
            default:
                return this.explorationQueue.shift();
        }
    }

    checkCycle(node) {
        let current = node.parent;
        while (current) {
            if (JSON.stringify(current.state) === JSON.stringify(node.state)) {
                return true;
            }
            current = current.parent;
        }
        return false;
    }

    findOptimalPath(goalNode) {
        this.optimalPath = [];
        let current = goalNode;
        while (current) {
            this.optimalPath.unshift(current);
            current = current.parent;
        }
    }

    animateSolution() {
        // Create particles along the optimal path
        for (let i = 0; i < this.optimalPath.length; i++) {
            const node = this.optimalPath[i];
            setTimeout(() => {
                this.particles.push({
                    x: node.x,
                    y: node.y,
                    targetX: i < this.optimalPath.length - 1 ? this.optimalPath[i + 1].x : node.x,
                    targetY: i < this.optimalPath.length - 1 ? this.optimalPath[i + 1].y : node.y,
                    progress: 0,
                    life: 1
                });
            }, i * 200);
        }

        this.animateParticles();
    }

    animateParticles() {
        if (this.particles.length === 0) return;

        const updateParticles = () => {
            this.particles = this.particles.filter(p => {
                p.progress += 0.02;
                p.life -= 0.005;
                return p.life > 0;
            });

            this.render();

            if (this.particles.length > 0) {
                requestAnimationFrame(updateParticles);
            }
        };

        updateParticles();
    }

    updateLayout() {
        // Reingold-Tilford tree layout
        const levels = new Map();

        // Group nodes by depth
        for (const node of this.nodes.values()) {
            if (!levels.has(node.depth)) {
                levels.set(node.depth, []);
            }
            levels.get(node.depth).push(node);
        }

        // Calculate positions
        const levelHeight = 120;
        const nodeSpacing = 80;

        for (const [depth, nodesAtDepth] of levels) {
            const totalWidth = (nodesAtDepth.length - 1) * nodeSpacing;
            const startX = -totalWidth / 2;

            nodesAtDepth.forEach((node, index) => {
                node.targetX = startX + index * nodeSpacing;
                node.targetY = depth * levelHeight;

                // Animate to new position
                if (node.x === 0 && node.y === 0) {
                    node.x = node.targetX;
                    node.y = node.targetY;
                }
            });
        }

        // Center camera on root
        this.camera.x = this.canvas.width / 2;
        this.camera.y = 50;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(this.camera.x, this.camera.y);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);

        // Draw grid
        this.drawGrid();

        // Draw edges
        this.drawEdges();

        // Draw nodes
        this.drawNodes();

        // Draw particles
        this.drawParticles();

        this.ctx.restore();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;

        const gridSize = 50;
        const offsetX = (-this.camera.x / this.camera.zoom) % gridSize;
        const offsetY = (-this.camera.y / this.camera.zoom) % gridSize;

        for (let x = offsetX - gridSize; x < this.canvas.width / this.camera.zoom + gridSize; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, -this.camera.y / this.camera.zoom);
            this.ctx.lineTo(x, (this.canvas.height - this.camera.y) / this.camera.zoom);
            this.ctx.stroke();
        }

        for (let y = offsetY - gridSize; y < this.canvas.height / this.camera.zoom + gridSize; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(-this.camera.x / this.camera.zoom, y);
            this.ctx.lineTo((this.canvas.width - this.camera.x) / this.camera.zoom, y);
            this.ctx.stroke();
        }
    }

    drawEdges() {
        for (const node of this.nodes.values()) {
            if (node.parent) {
                const start = node.parent;
                const end = node;

                // Determine edge style based on node status
                const isOptimal = this.optimalPath.includes(node) && this.optimalPath.includes(start);
                const isPruned = node.status === 'pruned';

                this.ctx.beginPath();
                this.ctx.moveTo(start.x, start.y);
                this.ctx.lineTo(end.x, end.y);

                if (isOptimal && this.showOptions.optimal) {
                    this.ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
                    this.ctx.lineWidth = 3;
                    this.ctx.shadowColor = '#22c55e';
                    this.ctx.shadowBlur = 15;
                } else if (isPruned && this.showOptions.pruned) {
                    this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
                    this.ctx.lineWidth = 1;
                    this.ctx.shadowBlur = 0;
                } else if (this.showOptions.explored) {
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                    this.ctx.lineWidth = 1;
                    this.ctx.shadowBlur = 0;
                } else {
                    continue;
                }

                this.ctx.stroke();
                this.ctx.shadowBlur = 0;

                // Draw constraint label
                if (this.showOptions.constraints && node.constraint && this.camera.zoom > 0.5) {
                    const midX = (start.x + end.x) / 2;
                    const midY = (start.y + end.y) / 2;

                    this.ctx.fillStyle = 'rgba(139, 92, 246, 0.9)';
                    this.ctx.font = '10px monospace';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';

                    // Draw background
                    const textWidth = this.ctx.measureText(node.constraint).width;
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    this.ctx.fillRect(midX - textWidth / 2 - 4, midY - 8, textWidth + 8, 16);

                    this.ctx.fillStyle = isPruned ? 'rgba(239, 68, 68, 0.8)' : 'rgba(139, 92, 246, 0.9)';
                    this.ctx.fillText(node.constraint, midX, midY);
                }
            }
        }
    }

    drawNodes() {
        for (const node of this.nodes.values()) {
            const shouldDraw =
                (node.status === 'explored' && this.showOptions.explored) ||
                (node.status === 'pruned' && this.showOptions.pruned) ||
                (node.status === 'optimal' && this.showOptions.optimal) ||
                (node.status === 'exploring') ||
                (node.status === 'unexplored');

            if (!shouldDraw) continue;

            // Animate position
            node.x += (node.targetX - node.x) * 0.1;
            node.y += (node.targetY - node.y) * 0.1;

            const radius = 15;

            // Glow effect
            this.ctx.shadowBlur = 20;

            switch (node.status) {
                case 'unexplored':
                    this.ctx.fillStyle = 'rgba(113, 113, 122, 0.3)';
                    this.ctx.strokeStyle = '#71717a';
                    this.ctx.shadowColor = '#71717a';
                    break;
                case 'exploring':
                    this.ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
                    this.ctx.strokeStyle = '#facc15';
                    this.ctx.shadowColor = '#facc15';
                    this.ctx.shadowBlur = 30;
                    break;
                case 'explored':
                    this.ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
                    this.ctx.strokeStyle = '#3b82f6';
                    this.ctx.shadowColor = '#3b82f6';
                    break;
                case 'pruned':
                    this.ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
                    this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
                    this.ctx.shadowColor = '#ef4444';
                    this.ctx.shadowBlur = 10;
                    break;
                case 'optimal':
                    this.ctx.fillStyle = 'rgba(34, 197, 94, 0.5)';
                    this.ctx.strokeStyle = '#22c55e';
                    this.ctx.shadowColor = '#22c55e';
                    this.ctx.shadowBlur = 25;
                    break;
            }

            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;

            // Draw node ID or state info
            if (this.camera.zoom > 0.7) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';

                if (this.problemType === 'maze') {
                    this.ctx.fillText(node.state.empty.toString(), node.x, node.y);
                } else if (this.problemType === 'pathfinding') {
                    this.ctx.fillText(`${node.state.x},${node.state.y}`, node.x, node.y);
                } else {
                    this.ctx.fillText(node.id.toString(), node.x, node.y);
                }
            }

            // Pulse animation for exploring nodes
            if (node.status === 'exploring') {
                const pulseRadius = radius + Math.sin(Date.now() / 100) * 5;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
                this.ctx.strokeStyle = 'rgba(250, 204, 21, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        }
    }

    drawParticles() {
        for (const particle of this.particles) {
            const x = particle.x + (particle.targetX - particle.x) * particle.progress;
            const y = particle.y + (particle.targetY - particle.y) * particle.progress;

            this.ctx.beginPath();
            this.ctx.arc(x, y, 5, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(34, 197, 94, ${particle.life})`;
            this.ctx.fill();

            this.ctx.shadowColor = '#22c55e';
            this.ctx.shadowBlur = 10;
        }
    }

    onMouseDown(e) {
        this.isDragging = true;
        this.lastMouse = { x: e.clientX, y: e.clientY };
    }

    onMouseMove(e) {
        if (this.isDragging) {
            const dx = e.clientX - this.lastMouse.x;
            const dy = e.clientY - this.lastMouse.y;
            this.camera.x += dx;
            this.camera.y += dy;
            this.lastMouse = { x: e.clientX, y: e.clientY };
            this.render();
        }
    }

    onMouseUp() {
        this.isDragging = false;
    }

    onWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.2, Math.min(3, this.camera.zoom * zoomFactor));

        // Zoom towards mouse position
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        this.camera.x = mouseX - (mouseX - this.camera.x) * (newZoom / this.camera.zoom);
        this.camera.y = mouseY - (mouseY - this.camera.y) * (newZoom / this.camera.zoom);
        this.camera.zoom = newZoom;

        this.render();
    }

    onClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = (e.clientX - rect.left - this.camera.x) / this.camera.zoom;
        const clickY = (e.clientY - rect.top - this.camera.y) / this.camera.zoom;

        for (const node of this.nodes.values()) {
            const dist = Math.sqrt((clickX - node.x) ** 2 + (clickY - node.y) ** 2);
            if (dist < 15) {
                this.showNodeInfo(node);
                break;
            }
        }
    }

    showNodeInfo(node) {
        const infoPanel = document.getElementById('node-info');
        let html = `<p class="info-text"><strong>Node ID:</strong> ${node.id}</p>`;
        html += `<p class="info-text"><strong>Depth:</strong> ${node.depth}</p>`;
        html += `<p class="info-text"><strong>Status:</strong> ${node.status}</p>`;
        html += `<p class="info-text"><strong>State:</strong> ${JSON.stringify(node.state)}</p>`;

        if (node.constraint) {
            html += `<div class="constraint-info">`;
            html += `<p class="info-text"><strong>Constraint:</strong> ${node.constraint}</p>`;
            html += `</div>`;
        }

        if (node.heuristic > 0) {
            html += `<p class="constraint-label">Heuristic: ${node.heuristic}</p>`;
        }

        infoPanel.innerHTML = html;
    }

    updateState(state) {
        document.getElementById('current-state').textContent = state;
    }

    updateStats() {
        document.getElementById('nodes-explored').textContent = this.nodesExplored;
        document.getElementById('branches-pruned').textContent = this.branchesPruned;
    }

    getDelay() {
        return Math.max(10, 500 - this.speed * 4);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the simulator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TreeOfThoughtsSimulator();
});

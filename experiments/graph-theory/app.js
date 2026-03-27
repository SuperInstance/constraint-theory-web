// Graph Theory Explorer - Main Application

class Graph {
    constructor(directed = false) {
        this.vertices = new Map(); // id -> {id, x, y, label}
        this.edges = []; // {from, to, weight}
        this.directed = directed;
        this.weighted = false;
        this.nextId = 0;
    }

    addVertex(x, y) {
        const id = this.nextId++;
        this.vertices.set(id, { id, x, y, label: id.toString() });
        return id;
    }

    removeVertex(id) {
        this.vertices.delete(id);
        this.edges = this.edges.filter(e => e.from !== id && e.to !== id);
    }

    addEdge(from, to, weight = 1) {
        if (from === to) return; // No self-loops
        // Check if edge already exists
        const exists = this.edges.some(e =>
            e.from === from && e.to === to
        );
        if (exists) return;

        this.edges.push({ from, to, weight });
        if (!this.directed) {
            this.edges.push({ from: to, to: from, weight });
        }
    }

    removeEdge(from, to) {
        this.edges = this.edges.filter(e =>
            !((e.from === from && e.to === to) ||
              (!this.directed && e.from === to && e.to === from))
        );
    }

    getNeighbors(id) {
        const neighbors = new Set();
        this.edges.forEach(e => {
            if (e.from === id) neighbors.add(e.to);
        });
        return Array.from(neighbors);
    }

    getEdge(from, to) {
        return this.edges.find(e => e.from === from && e.to === to);
    }

    getAdjacencyList() {
        const adj = new Map();
        this.vertices.forEach((_, id) => adj.set(id, []));
        this.edges.forEach(e => {
            if (adj.has(e.from)) {
                adj.get(e.from).push({ to: e.to, weight: e.weight });
            }
        });
        return adj;
    }

    getVertexCount() {
        return this.vertices.size;
    }

    getEdgeCount() {
        if (this.directed) {
            return this.edges.length;
        }
        return this.edges.length / 2;
    }

    getDensity() {
        const v = this.getVertexCount();
        const e = this.getEdgeCount();
        if (v < 2) return 0;
        const maxEdges = this.directed ? v * (v - 1) : v * (v - 1) / 2;
        return (e / maxEdges).toFixed(3);
    }

    getConnectedComponents() {
        const visited = new Set();
        let components = 0;

        const dfs = (id) => {
            visited.add(id);
            this.getNeighbors(id).forEach(n => {
                if (!visited.has(n)) dfs(n);
            });
        };

        this.vertices.forEach((_, id) => {
            if (!visited.has(id)) {
                components++;
                dfs(id);
            }
        });

        return components;
    }

    clear() {
        this.vertices.clear();
        this.edges = [];
        this.nextId = 0;
    }

    clone() {
        const newGraph = new Graph(this.directed);
        newGraph.weighted = this.weighted;
        newGraph.nextId = this.nextId;

        this.vertices.forEach((v, id) => {
            newGraph.vertices.set(id, { ...v });
        });

        newGraph.edges = this.edges.map(e => ({ ...e }));

        return newGraph;
    }
}

class GraphVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.graph = new Graph();
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;

        this.nodeRadius = 25;
        this.selectedNode = null;
        this.hoveredNode = null;
        this.draggingNode = null;
        this.edgeStartNode = null;

        this.nodeStates = new Map(); // id -> state
        this.edgeStates = new Map(); // edge -> state

        // Animation
        this.animationSteps = [];
        this.currentStep = 0;
        this.isAnimating = false;

        this.setupCanvas();
        this.setupEventListeners();
    }

    setupCanvas() {
        const resize = () => {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            this.draw();
        };

        window.addEventListener('resize', resize);
        resize();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - this.panX) / this.zoom,
            y: (e.clientY - rect.top - this.panY) / this.zoom
        };
    }

    getNodeAtPos(pos) {
        for (const [id, vertex] of this.graph.vertices) {
            const dx = vertex.x - pos.x;
            const dy = vertex.y - pos.y;
            if (Math.sqrt(dx * dx + dy * dy) < this.nodeRadius) {
                return id;
            }
        }
        return null;
    }

    getEdgeAtPos(pos) {
        const threshold = 5;
        for (const edge of this.graph.edges) {
            const from = this.graph.vertices.get(edge.from);
            const to = this.graph.vertices.get(edge.to);
            if (!from || !to) continue;

            const dist = this.pointToLineDistance(pos, from, to);
            if (dist < threshold) {
                return edge;
            }
        }
        return null;
    }

    pointToLineDistance(point, lineStart, lineEnd) {
        const A = point.x - lineStart.x;
        const B = point.y - lineStart.y;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.y - lineStart.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.y;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.y;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.y + param * D;
        }

        const dx = point.x - xx;
        const dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    handleMouseDown(e) {
        if (e.button !== 0) return;

        const pos = this.getMousePos(e);
        const node = this.getNodeAtPos(pos);

        if (e.shiftKey && node !== null) {
            // Start creating edge
            this.edgeStartNode = node;
        } else if (node !== null) {
            // Select and start dragging node
            this.selectedNode = node;
            this.draggingNode = node;
        } else {
            // Add new node
            const id = this.graph.addVertex(pos.x, pos.y);
            this.updateStats();
            this.draw();
        }
    }

    handleMouseMove(e) {
        const pos = this.getMousePos(e);

        if (this.draggingNode !== null) {
            const vertex = this.graph.vertices.get(this.draggingNode);
            if (vertex) {
                vertex.x = pos.x;
                vertex.y = pos.y;
                this.draw();
            }
        } else {
            const node = this.getNodeAtPos(pos);
            if (node !== this.hoveredNode) {
                this.hoveredNode = node;
                this.canvas.style.cursor = node !== null ? 'pointer' : 'crosshair';
                this.draw();
            }
        }
    }

    handleMouseUp(e) {
        const pos = this.getMousePos(e);

        if (this.edgeStartNode !== null) {
            const targetNode = this.getNodeAtPos(pos);
            if (targetNode !== null && targetNode !== this.edgeStartNode) {
                const weightInput = document.getElementById('edgeWeight');
                const weight = this.graph.weighted ? parseInt(weightInput.value) : 1;
                this.graph.addEdge(this.edgeStartNode, targetNode, weight);
                this.updateStats();
                this.draw();
            }
            this.edgeStartNode = null;
        }

        this.draggingNode = null;
    }

    handleContextMenu(e) {
        e.preventDefault();
        const pos = this.getMousePos(e);

        const node = this.getNodeAtPos(pos);
        if (node !== null) {
            this.graph.removeVertex(node);
            this.nodeStates.delete(node);
            this.updateStats();
            this.draw();
            return;
        }

        const edge = this.getEdgeAtPos(pos);
        if (edge) {
            this.graph.removeEdge(edge.from, edge.to);
            this.updateStats();
            this.draw();
        }
    }

    handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom *= delta;
        this.zoom = Math.max(0.1, Math.min(5, this.zoom));
        this.draw();
    }

    getNodeColor(nodeId) {
        const state = this.nodeStates.get(nodeId);
        switch (state) {
            case 'source': return '#8b5cf6';
            case 'target': return '#ec4899';
            case 'visiting': return '#f59e0b';
            case 'visited': return '#10b981';
            case 'path': return '#ef4444';
            default: return '#3b82f6';
        }
    }

    getEdgeColor(edge) {
        const key = `${edge.from}-${edge.to}`;
        const state = this.edgeStates.get(key);
        switch (state) {
            case 'highlight': return '#f59e0b';
            case 'path': return '#ef4444';
            case 'mst': return '#10b981';
            default: return '#6b7280';
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);

        // Draw edges
        this.graph.edges.forEach(edge => {
            const from = this.graph.vertices.get(edge.from);
            const to = this.graph.vertices.get(edge.to);
            if (!from || !to) return;

            this.ctx.beginPath();
            this.ctx.strokeStyle = this.getEdgeColor(edge);
            this.ctx.lineWidth = 2;

            if (this.graph.directed) {
                // Draw arrow
                const angle = Math.atan2(to.y - from.y, to.x - from.x);
                const endX = to.x - this.nodeRadius * Math.cos(angle);
                const endY = to.y - this.nodeRadius * Math.sin(angle);
                const startX = from.x + this.nodeRadius * Math.cos(angle);
                const startY = from.y + this.nodeRadius * Math.sin(angle);

                this.ctx.moveTo(startX, startY);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();

                // Arrow head
                const headLen = 10;
                this.ctx.beginPath();
                this.ctx.moveTo(endX, endY);
                this.ctx.lineTo(
                    endX - headLen * Math.cos(angle - Math.PI / 6),
                    endY - headLen * Math.sin(angle - Math.PI / 6)
                );
                this.ctx.lineTo(
                    endX - headLen * Math.cos(angle + Math.PI / 6),
                    endY - headLen * Math.sin(angle + Math.PI / 6)
                );
                this.ctx.closePath();
                this.ctx.fillStyle = this.getEdgeColor(edge);
                this.ctx.fill();
            } else {
                this.ctx.moveTo(from.x, from.y);
                this.ctx.lineTo(to.x, to.y);
                this.ctx.stroke();
            }

            // Draw weight if weighted
            if (this.graph.weighted) {
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2;
                this.ctx.fillStyle = '#f9fafb';
                this.ctx.font = 'bold 12px sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';

                // Background for weight
                const weightText = edge.weight.toString();
                const metrics = this.ctx.measureText(weightText);
                this.ctx.fillStyle = '#1f2937';
                this.ctx.fillRect(
                    midX - metrics.width / 2 - 3,
                    midY - 8,
                    metrics.width + 6,
                    16
                );

                this.ctx.fillStyle = '#f9fafb';
                this.ctx.fillText(weightText, midX, midY);
            }
        });

        // Draw edge being created
        if (this.edgeStartNode !== null) {
            const from = this.graph.vertices.get(this.edgeStartNode);
            if (from) {
                this.ctx.beginPath();
                this.ctx.strokeStyle = '#f59e0b';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.moveTo(from.x, from.y);
                // Would need mouse position here
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
        }

        // Draw nodes
        this.graph.vertices.forEach((vertex) => {
            this.ctx.beginPath();
            this.ctx.arc(vertex.x, vertex.y, this.nodeRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = this.getNodeColor(vertex.id);
            this.ctx.fill();

            // Highlight if selected or hovered
            if (vertex.id === this.selectedNode || vertex.id === this.hoveredNode) {
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            }

            // Draw label
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 14px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(vertex.label, vertex.x, vertex.y);
        });

        this.ctx.restore();
    }

    resetStates() {
        this.nodeStates.clear();
        this.edgeStates.clear();
        this.animationSteps = [];
        this.currentStep = 0;
        this.isAnimating = false;
        this.draw();
    }

    applyStep(step) {
        step.nodeStates?.forEach((state, id) => {
            this.nodeStates.set(id, state);
        });
        step.edgeStates?.forEach((state, key) => {
            this.edgeStates.set(key, state);
        });
        this.draw();
    }

    updateStats() {
        document.getElementById('vertexCount').textContent = this.graph.getVertexCount();
        document.getElementById('edgeCount').textContent = this.graph.getEdgeCount();
        document.getElementById('componentCount').textContent = this.graph.getConnectedComponents();
        document.getElementById('density').textContent = this.graph.getDensity();
    }

    // Force-directed layout
    applyForceLayout(iterations = 100) {
        const width = this.canvas.width / this.zoom;
        const height = this.canvas.height / this.zoom;
        const area = width * height;
        const k = Math.sqrt(area / (this.graph.getVertexCount() || 1));

        const positions = new Map();
        this.graph.vertices.forEach((v, id) => {
            positions.set(id, { x: v.x, y: v.y });
        });

        for (let iter = 0; iter < iterations; iter++) {
            const forces = new Map();

            // Initialize forces
            this.graph.vertices.forEach((_, id) => {
                forces.set(id, { x: 0, y: 0 });
            });

            // Repulsive forces
            this.graph.vertices.forEach((v1, id1) => {
                this.graph.vertices.forEach((v2, id2) => {
                    if (id1 >= id2) return;

                    const dx = positions.get(id1).x - positions.get(id2).x;
                    const dy = positions.get(id1).y - positions.get(id2).y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

                    const force = (k * k) / dist;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;

                    forces.get(id1).x += fx;
                    forces.get(id1).y += fy;
                    forces.get(id2).x -= fx;
                    forces.get(id2).y -= fy;
                });
            });

            // Attractive forces
            this.graph.edges.forEach(edge => {
                const id1 = edge.from;
                const id2 = edge.to;

                const p1 = positions.get(id1);
                const p2 = positions.get(id2);

                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;

                const force = (dist * dist) / k;
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;

                forces.get(id1).x -= fx;
                forces.get(id1).y -= fy;
                forces.get(id2).x += fx;
                forces.get(id2).y += fy;
            });

            // Apply forces with temperature cooling
            const temperature = 0.1 * (1 - iter / iterations);

            this.graph.vertices.forEach((_, id) => {
                const force = forces.get(id);
                const pos = positions.get(id);

                // Limit displacement
                const dist = Math.sqrt(force.x * force.x + force.y * force.y);
                const limitedDist = Math.min(dist, temperature);

                pos.x += (force.x / dist) * limitedDist || 0;
                pos.y += (force.y / dist) * limitedDist || 0;

                // Keep in bounds
                pos.x = Math.max(50, Math.min(width - 50, pos.x));
                pos.y = Math.max(50, Math.min(height - 50, pos.y));
            });
        }

        // Apply final positions
        positions.forEach((pos, id) => {
            const vertex = this.graph.vertices.get(id);
            if (vertex) {
                vertex.x = pos.x;
                vertex.y = pos.y;
            }
        });

        this.draw();
    }
}

// Graph Algorithms
class GraphAlgorithms {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.output = document.getElementById('algorithmOutput');
    }

    clearOutput() {
        this.output.innerHTML = '';
    }

    addOutput(text, type = '') {
        const line = document.createElement('div');
        line.className = `output-line ${type}`;
        line.innerHTML = text;
        this.output.appendChild(line);
        this.output.scrollTop = this.output.scrollHeight;
    }

    reset() {
        this.visualizer.resetStates();
        this.clearOutput();
    }

    // BFS
    bfs(startId) {
        this.reset();
        const graph = this.visualizer.graph;
        const adj = graph.getAdjacencyList();
        const visited = new Set();
        const queue = [startId];
        const steps = [];
        let stepNum = 0;

        this.addOutput('Starting BFS from node ' + startId);

        while (queue.length > 0) {
            const current = queue.shift();

            if (visited.has(current)) continue;
            visited.add(current);

            stepNum++;
            const nodeStates = new Map();
            nodeStates.set(current, 'visiting');

            this.addOutput(`Step ${stepNum}: Visit node ${current}`, 'highlight');

            const neighbors = adj.get(current) || [];
            neighbors.forEach(({ to }) => {
                if (!visited.has(to) && !queue.includes(to)) {
                    queue.push(to);
                    nodeStates.set(to, 'visited');
                    this.addOutput(`  → Add neighbor ${to} to queue`);
                }
            });

            steps.push({
                nodeStates,
                output: `Visiting node ${current}`
            });
        }

        this.visualizer.animationSteps = steps;
        return steps;
    }

    // DFS
    dfs(startId) {
        this.reset();
        const graph = this.visualizer.graph;
        const adj = graph.getAdjacencyList();
        const visited = new Set();
        const steps = [];
        let stepNum = 0;

        this.addOutput('Starting DFS from node ' + startId);

        const dfsHelper = (current) => {
            if (visited.has(current)) return;
            visited.add(current);

            stepNum++;
            const nodeStates = new Map();
            nodeStates.set(current, 'visiting');

            this.addOutput(`Step ${stepNum}: Visit node ${current}`, 'highlight');

            const neighbors = adj.get(current) || [];
            neighbors.forEach(({ to }) => {
                if (!visited.has(to)) {
                    this.addOutput(`  → Explore neighbor ${to}`);
                    dfsHelper(to);
                    nodeStates.set(to, 'visited');
                }
            });

            steps.push({
                nodeStates,
                output: `Visiting node ${current}`
            });
        };

        dfsHelper(startId);
        this.visualizer.animationSteps = steps;
        return steps;
    }

    // Dijkstra's Algorithm
    dijkstra(startId, endId) {
        this.reset();
        const graph = this.visualizer.graph;
        const adj = graph.getAdjacencyList();
        const distances = new Map();
        const previous = new Map();
        const unvisited = new Set();
        const steps = [];
        let stepNum = 0;

        this.addOutput(`Dijkstra: Finding shortest path from ${startId} to ${endId}`);

        // Initialize
        graph.vertices.forEach((_, id) => {
            distances.set(id, Infinity);
            unvisited.add(id);
        });
        distances.set(startId, 0);

        while (unvisited.size > 0) {
            // Find unvisited node with minimum distance
            let current = null;
            let minDist = Infinity;
            unvisited.forEach(id => {
                if (distances.get(id) < minDist) {
                    minDist = distances.get(id);
                    current = id;
                }
            });

            if (current === null || distances.get(current) === Infinity) break;
            if (current === endId) break;

            unvisited.delete(current);
            stepNum++;

            const nodeStates = new Map();
            nodeStates.set(current, 'visiting');

            this.addOutput(`Step ${stepNum}: Process node ${current} (distance: ${minDist})`, 'highlight');

            const neighbors = adj.get(current) || [];
            neighbors.forEach(({ to, weight }) => {
                if (!unvisited.has(to)) return;

                const alt = distances.get(current) + weight;
                if (alt < distances.get(to)) {
                    distances.set(to, alt);
                    previous.set(to, current);
                    nodeStates.set(to, 'visited');
                    this.addOutput(`  → Update ${to}: ${alt} via ${current}`);
                }
            });

            steps.push({
                nodeStates,
                output: `Process ${current}, dist: ${minDist}`
            });
        }

        // Reconstruct path
        const path = [];
        let current = endId;
        while (current !== undefined) {
            path.unshift(current);
            current = previous.get(current);
        }

        if (path[0] === startId) {
            this.addOutput(`Shortest path: ${path.join(' → ')} (distance: ${distances.get(endId)})`, 'success');

            // Highlight path
            const pathStates = new Map();
            path.forEach(id => pathStates.set(id, 'path'));
            steps.push({ nodeStates: pathStates, output: 'Path highlighted' });
        } else {
            this.addOutput('No path found!', 'error');
        }

        this.visualizer.animationSteps = steps;
        return steps;
    }

    // A* Search
    astar(startId, endId) {
        this.reset();
        const graph = this.visualizer.graph;
        const adj = graph.getAdjacencyList();

        // Heuristic: Euclidean distance
        const heuristic = (id) => {
            const start = graph.vertices.get(id);
            const end = graph.vertices.get(endId);
            if (!start || !end) return 0;
            return Math.sqrt(Math.pow(start.x - end.x, 2) + Math.pow(start.y - end.y, 2));
        };

        const gScore = new Map();
        const fScore = new Map();
        const previous = new Map();
        const openSet = new Set([startId]);
        const closedSet = new Set();
        const steps = [];
        let stepNum = 0;

        this.addOutput(`A*: Finding path from ${startId} to ${endId}`);

        graph.vertices.forEach((_, id) => {
            gScore.set(id, Infinity);
            fScore.set(id, Infinity);
        });
        gScore.set(startId, 0);
        fScore.set(startId, heuristic(startId));

        while (openSet.size > 0) {
            // Find node in openSet with lowest fScore
            let current = null;
            let minF = Infinity;
            openSet.forEach(id => {
                if (fScore.get(id) < minF) {
                    minF = fScore.get(id);
                    current = id;
                }
            });

            if (current === endId) {
                // Reconstruct path
                const path = [];
                let node = endId;
                while (node !== undefined) {
                    path.unshift(node);
                    node = previous.get(node);
                }

                this.addOutput(`Path found: ${path.join(' → ')} (cost: ${gScore.get(endId).toFixed(0)})`, 'success');

                const pathStates = new Map();
                path.forEach(id => pathStates.set(id, 'path'));
                steps.push({ nodeStates: pathStates, output: 'Path highlighted' });

                this.visualizer.animationSteps = steps;
                return steps;
            }

            openSet.delete(current);
            closedSet.add(current);

            stepNum++;
            const nodeStates = new Map();
            nodeStates.set(current, 'visiting');

            this.addOutput(`Step ${stepNum}: Explore ${current} (f: ${minF.toFixed(0)})`, 'highlight');

            const neighbors = adj.get(current) || [];
            neighbors.forEach(({ to, weight }) => {
                if (closedSet.has(to)) return;

                const tentativeG = gScore.get(current) + weight;

                if (!openSet.has(to)) {
                    openSet.add(to);
                } else if (tentativeG >= gScore.get(to)) {
                    return;
                }

                previous.set(to, current);
                gScore.set(to, tentativeG);
                fScore.set(to, tentativeG + heuristic(to));

                nodeStates.set(to, 'visited');
                this.addOutput(`  → ${to}: g=${tentativeG.toFixed(0)}, f=${fScore.get(to).toFixed(0)}`);
            });

            steps.push({
                nodeStates,
                output: `Explore ${current}`
            });
        }

        this.addOutput('No path found!', 'error');
        this.visualizer.animationSteps = steps;
        return steps;
    }

    // Kruskal's MST
    kruskal() {
        this.reset();
        const graph = this.visualizer.graph;
        const steps = [];
        let stepNum = 0;
        let totalWeight = 0;

        this.addOutput('Kruskal\'s MST Algorithm');

        // Sort edges by weight
        const sortedEdges = [...graph.edges].filter((e, i, arr) => {
            // Only keep one direction for undirected
            if (graph.directed) return true;
            const idx = arr.findIndex(oe => oe.from === e.to && oe.to === e.from);
            return idx === -1 || i < idx;
        }).sort((a, b) => a.weight - b.weight);

        // Union-Find
        const parent = new Map();
        const rank = new Map();

        graph.vertices.forEach((_, id) => {
            parent.set(id, id);
            rank.set(id, 0);
        });

        const find = (x) => {
            if (parent.get(x) !== x) {
                parent.set(x, find(parent.get(x)));
            }
            return parent.get(x);
        };

        const union = (x, y) => {
            const px = find(x);
            const py = find(y);
            if (px === py) return false;

            if (rank.get(px) < rank.get(py)) {
                parent.set(px, py);
            } else if (rank.get(px) > rank.get(py)) {
                parent.set(py, px);
            } else {
                parent.set(py, px);
                rank.set(px, rank.get(px) + 1);
            }
            return true;
        };

        const edgeStates = new Map();
        const mstEdges = [];

        sortedEdges.forEach(edge => {
            stepNum++;
            this.addOutput(`Step ${stepNum}: Consider edge ${edge.from}→${edge.to} (weight: ${edge.weight})`, 'highlight');

            const key = `${edge.from}-${edge.to}`;
            if (union(edge.from, edge.to)) {
                totalWeight += edge.weight;
                mstEdges.push(edge);
                edgeStates.set(key, 'mst');
                edgeStates.set(`${edge.to}-${edge.from}`, 'mst');
                this.addOutput(`  ✓ Add edge to MST`, 'success');
            } else {
                this.addOutput(`  ✗ Skip (would create cycle)`);
            }

            steps.push({
                edgeStates: new Map(edgeStates),
                output: `Consider ${edge.from}→${edge.to}`
            });
        });

        this.addOutput(`MST complete! Total weight: ${totalWeight}`, 'success');
        document.getElementById('mstWeight').style.display = 'flex';
        document.getElementById('mstWeightValue').textContent = totalWeight;

        this.visualizer.animationSteps = steps;
        return steps;
    }

    // Prim's MST
    prim(startId) {
        this.reset();
        const graph = this.visualizer.graph;
        const adj = graph.getAdjacencyList();
        const steps = [];
        let stepNum = 0;
        let totalWeight = 0;

        this.addOutput(`Prim's MST Algorithm starting from node ${startId}`);

        const inMST = new Set([startId]);
        const edgeStates = new Map();
        const mstEdges = [];

        while (inMST.size < graph.getVertexCount()) {
            stepNum++;
            let minEdge = null;
            let minWeight = Infinity;

            // Find minimum edge crossing the cut
            inMST.forEach(id => {
                const neighbors = adj.get(id) || [];
                neighbors.forEach(({ to, weight }) => {
                    if (!inMST.has(to) && weight < minWeight) {
                        minWeight = weight;
                        minEdge = { from: id, to, weight };
                    }
                });
            });

            if (!minEdge) break;

            const key = `${minEdge.from}-${minEdge.to}`;
            edgeStates.set(key, 'mst');
            edgeStates.set(`${minEdge.to}-${minEdge.from}`, 'mst');

            inMST.add(minEdge.to);
            mstEdges.push(minEdge);
            totalWeight += minEdge.weight;

            this.addOutput(`Step ${stepNum}: Add edge ${minEdge.from}→${minEdge.to} (weight: ${minEdge.weight})`, 'success');

            steps.push({
                nodeStates: new Map(Array.from(inMST).map(id => [id, 'visited'])),
                edgeStates: new Map(edgeStates),
                output: `Add ${minEdge.from}→${minEdge.to}`
            });
        }

        this.addOutput(`MST complete! Total weight: ${totalWeight}`, 'success');
        document.getElementById('mstWeight').style.display = 'flex';
        document.getElementById('mstWeightValue').textContent = totalWeight;

        this.visualizer.animationSteps = steps;
        return steps;
    }

    // Topological Sort
    topologicalSort() {
        this.reset();
        const graph = this.visualizer.graph;
        const adj = graph.getAdjacencyList();
        const steps = [];
        let stepNum = 0;

        this.addOutput('Topological Sort (Kahn\'s Algorithm)');

        // Calculate in-degrees
        const inDegree = new Map();
        graph.vertices.forEach((_, id) => inDegree.set(id, 0));
        graph.edges.forEach(edge => {
            inDegree.set(edge.to, inDegree.get(edge.to) + 1);
        });

        // Find nodes with in-degree 0
        const queue = [];
        inDegree.forEach((deg, id) => {
            if (deg === 0) queue.push(id);
        });

        const result = [];
        const nodeStates = new Map();

        while (queue.length > 0) {
            const current = queue.shift();
            result.push(current);
            nodeStates.set(current, 'visited');

            stepNum++;
            this.addOutput(`Step ${stepNum}: Process node ${current}`, 'highlight');

            const neighbors = adj.get(current) || [];
            neighbors.forEach(({ to }) => {
                const newDeg = inDegree.get(to) - 1;
                inDegree.set(to, newDeg);

                if (newDeg === 0) {
                    queue.push(to);
                    nodeStates.set(to, 'visiting');
                    this.addOutput(`  → ${to} now has in-degree 0`);
                }
            });

            steps.push({
                nodeStates: new Map(nodeStates),
                output: `Process ${current}`
            });
        }

        if (result.length !== graph.getVertexCount()) {
            this.addOutput('Cycle detected! Graph is not a DAG.', 'error');
        } else {
            this.addOutput(`Topological order: ${result.join(' → ')}`, 'success');
        }

        this.visualizer.animationSteps = steps;
        return steps;
    }

    // Euler Path
    eulerPath() {
        this.reset();
        const graph = this.visualizer.graph;
        const steps = [];
        let stepNum = 0;

        this.addOutput('Euler Path (Hierholzer\'s Algorithm)');

        // Count degrees
        const inDegree = new Map();
        const outDegree = new Map();
        graph.vertices.forEach((_, id) => {
            inDegree.set(id, 0);
            outDegree.set(id, 0);
        });

        graph.edges.forEach(edge => {
            outDegree.set(edge.from, outDegree.get(edge.from) + 1);
            inDegree.set(edge.to, inDegree.get(edge.to) + 1);
        });

        // Find start node
        let startNode = null;
        let oddCount = 0;

        graph.vertices.forEach((_, id) => {
            const diff = outDegree.get(id) - inDegree.get(id);
            if (Math.abs(diff) > 1) {
                this.addOutput(`Node ${id} has degree imbalance: ${diff}`, 'error');
                this.visualizer.animationSteps = steps;
                return steps;
            }
            if (diff === 1) {
                oddCount++;
                startNode = id;
            }
        });

        if (oddCount > 2) {
            this.addOutput('No Euler path exists (too many odd degree nodes)', 'error');
            this.visualizer.animationSteps = steps;
            return steps;
        }

        if (startNode === null) {
            startNode = graph.vertices.keys().next().value;
        }

        // Hierholzer's algorithm
        const adj = new Map();
        graph.vertices.forEach((_, id) => adj.set(id, []));
        graph.edges.forEach(edge => {
            adj.get(edge.from).push(edge.to);
        });

        const path = [];
        const stack = [startNode];
        const edgeStates = new Map();
        let edgeNum = 0;

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = adj.get(current);

            if (neighbors.length > 0) {
                const next = neighbors.pop();
                stack.push(next);

                edgeNum++;
                const key = `${current}-${next}`;
                edgeStates.set(key, 'highlight');

                this.addOutput(`Step ${edgeNum}: Traverse ${current} → ${next}`, 'highlight');

                steps.push({
                    edgeStates: new Map(edgeStates),
                    output: `Traverse ${current} → ${next}`
                });
            } else {
                path.push(stack.pop());
            }
        }

        path.reverse();
        this.addOutput(`Euler path: ${path.join(' → ')}`, 'success');

        this.visualizer.animationSteps = steps;
        return steps;
    }

    // Graph Coloring
    graphColoring() {
        this.reset();
        const graph = this.visualizer.graph;
        const adj = graph.getAdjacencyList();
        const steps = [];
        let stepNum = 0;

        this.addOutput('Graph Coloring (Greedy Algorithm)');

        const colors = [
            '#ef4444', '#3b82f6', '#10b981', '#f59e0b',
            '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
        ];

        const nodeColors = new Map();
        const nodeStates = new Map();

        // Sort nodes by degree (descending)
        const nodesByDegree = Array.from(graph.vertices.keys())
            .map(id => ({
                id,
                degree: (adj.get(id) || []).length
            }))
            .sort((a, b) => b.degree - a.degree);

        nodesByDegree.forEach(({ id }) => {
            // Find used colors
            const usedColors = new Set();
            const neighbors = adj.get(id) || [];
            neighbors.forEach(({ to }) => {
                if (nodeColors.has(to)) {
                    usedColors.add(nodeColors.get(to));
                }
            });

            // Assign first available color
            let colorIndex = 0;
            while (usedColors.has(colorIndex)) {
                colorIndex++;
            }

            nodeColors.set(id, colorIndex);
            nodeStates.set(id, `color-${colorIndex}`);

            stepNum++;
            this.addOutput(`Step ${stepNum}: Color node ${id} with color ${colorIndex}`, 'highlight');

            steps.push({
                nodeStates: new Map(nodeStates),
                output: `Color ${id} = ${colorIndex}`
            });
        });

        const colorCount = Math.max(...nodeColors.values()) + 1;
        this.addOutput(`Coloring complete! Used ${colorCount} colors`, 'success');

        this.visualizer.animationSteps = steps;
        return steps;
    }
}

// Preset Graphs
class GraphPresets {
    constructor(visualizer) {
        this.visualizer = visualizer;
    }

    tree() {
        this.visualizer.graph.clear();
        const canvas = this.visualizer.canvas;
        const cx = canvas.width / 2 / this.visualizer.zoom;
        const cy = canvas.height / 2 / this.visualizer.zoom;

        const root = this.visualizer.graph.addVertex(cx, 80);
        const level2 = [
            this.visualizer.graph.addVertex(cx - 150, 180),
            this.visualizer.graph.addVertex(cx, 180),
            this.visualizer.graph.addVertex(cx + 150, 180)
        ];
        const level3 = [
            this.visualizer.graph.addVertex(cx - 200, 280),
            this.visualizer.graph.addVertex(cx - 100, 280),
            this.visualizer.graph.addVertex(cx - 50, 280),
            this.visualizer.graph.addVertex(cx + 50, 280),
            this.visualizer.graph.addVertex(cx + 100, 280),
            this.visualizer.graph.addVertex(cx + 200, 280)
        ];

        this.visualizer.graph.addEdge(root, level2[0]);
        this.visualizer.graph.addEdge(root, level2[1]);
        this.visualizer.graph.addEdge(root, level2[2]);
        this.visualizer.graph.addEdge(level2[0], level3[0]);
        this.visualizer.graph.addEdge(level2[0], level3[1]);
        this.visualizer.graph.addEdge(level2[1], level3[2]);
        this.visualizer.graph.addEdge(level2[1], level3[3]);
        this.visualizer.graph.addEdge(level2[2], level3[4]);
        this.visualizer.graph.addEdge(level2[2], level3[5]);

        this.visualizer.updateStats();
        this.visualizer.draw();
    }

    cycle() {
        this.visualizer.graph.clear();
        const canvas = this.visualizer.canvas;
        const cx = canvas.width / 2 / this.visualizer.zoom;
        const cy = canvas.height / 2 / this.visualizer.zoom;
        const radius = 150;
        const nodes = 6;

        const nodeIds = [];
        for (let i = 0; i < nodes; i++) {
            const angle = (2 * Math.PI * i) / nodes - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            nodeIds.push(this.visualizer.graph.addVertex(x, y));
        }

        for (let i = 0; i < nodes; i++) {
            this.visualizer.graph.addEdge(nodeIds[i], nodeIds[(i + 1) % nodes]);
        }

        this.visualizer.updateStats();
        this.visualizer.draw();
    }

    complete() {
        this.visualizer.graph.clear();
        const canvas = this.visualizer.canvas;
        const cx = canvas.width / 2 / this.visualizer.zoom;
        const cy = canvas.height / 2 / this.visualizer.zoom;
        const radius = 150;
        const nodes = 5;

        const nodeIds = [];
        for (let i = 0; i < nodes; i++) {
            const angle = (2 * Math.PI * i) / nodes - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            nodeIds.push(this.visualizer.graph.addVertex(x, y));
        }

        for (let i = 0; i < nodes; i++) {
            for (let j = i + 1; j < nodes; j++) {
                this.visualizer.graph.addEdge(nodeIds[i], nodeIds[j]);
            }
        }

        this.visualizer.updateStats();
        this.visualizer.draw();
    }

    grid() {
        this.visualizer.graph.clear();
        const canvas = this.visualizer.canvas;
        const rows = 3;
        const cols = 4;
        const spacing = 100;
        const startX = (canvas.width / this.visualizer.zoom - cols * spacing) / 2;
        const startY = (canvas.height / this.visualizer.zoom - rows * spacing) / 2;

        const nodeIds = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = startX + c * spacing;
                const y = startY + r * spacing;
                nodeIds.push(this.visualizer.graph.addVertex(x, y));
            }
        }

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const idx = r * cols + c;
                if (c < cols - 1) {
                    this.visualizer.graph.addEdge(nodeIds[idx], nodeIds[idx + 1]);
                }
                if (r < rows - 1) {
                    this.visualizer.graph.addEdge(nodeIds[idx], nodeIds[idx + cols]);
                }
            }
        }

        this.visualizer.updateStats();
        this.visualizer.draw();
    }

    random() {
        this.visualizer.graph.clear();
        const canvas = this.visualizer.canvas;
        const nodes = 8;
        const edgeProbability = 0.4;

        const nodeIds = [];
        for (let i = 0; i < nodes; i++) {
            const x = 100 + Math.random() * (canvas.width / this.visualizer.zoom - 200);
            const y = 100 + Math.random() * (canvas.height / this.visualizer.zoom - 200);
            nodeIds.push(this.visualizer.graph.addVertex(x, y));
        }

        for (let i = 0; i < nodes; i++) {
            for (let j = i + 1; j < nodes; j++) {
                if (Math.random() < edgeProbability) {
                    const weight = Math.floor(Math.random() * 10) + 1;
                    this.visualizer.graph.addEdge(nodeIds[i], nodeIds[j], weight);
                }
            }
        }

        this.visualizer.updateStats();
        this.visualizer.draw();
    }

    bipartite() {
        this.visualizer.graph.clear();
        const canvas = this.visualizer.canvas;
        const cx = canvas.width / 2 / this.visualizer.zoom;
        const cy = canvas.height / 2 / this.visualizer.zoom;

        const leftNodes = [];
        const rightNodes = [];

        for (let i = 0; i < 4; i++) {
            const y = cy - 150 + i * 100;
            leftNodes.push(this.visualizer.graph.addVertex(cx - 150, y));
            rightNodes.push(this.visualizer.graph.addVertex(cx + 150, y));
        }

        // Add random edges between partitions
        for (let i = 0; i < leftNodes.length; i++) {
            for (let j = 0; j < rightNodes.length; j++) {
                if (Math.random() < 0.5) {
                    this.visualizer.graph.addEdge(leftNodes[i], rightNodes[j]);
                }
            }
        }

        this.visualizer.updateStats();
        this.visualizer.draw();
    }
}

// Algorithm Information
const algorithmInfo = {
    bfs: {
        name: 'Breadth-First Search',
        description: 'Explores all neighbors at current depth before moving to nodes at next depth level. Uses a queue.',
        complexity: 'Time: O(V + E), Space: O(V)',
        useCase: 'Shortest path in unweighted graphs, level-order traversal'
    },
    dfs: {
        name: 'Depth-First Search',
        description: 'Explores as far as possible along each branch before backtracking. Uses a stack (recursion).',
        complexity: 'Time: O(V + E), Space: O(V)',
        useCase: 'Path finding, topological sort, detecting cycles'
    },
    dijkstra: {
        name: 'Dijkstra\'s Shortest Path',
        description: 'Finds shortest paths from source to all nodes in weighted graph. Uses priority queue.',
        complexity: 'Time: O((V + E) log V), Space: O(V)',
        useCase: 'Routing, network optimization, GPS navigation'
    },
    astar: {
        name: 'A* Search',
        description: 'Optimal search using heuristic to guide exploration. f(n) = g(n) + h(n).',
        complexity: 'Time: O(E), Space: O(V)',
        useCase: 'Pathfinding in games, maps, robotics'
    },
    kruskal: {
        name: 'Kruskal\'s MST',
        description: 'Builds MST by adding edges in order of weight, skipping those that create cycles.',
        complexity: 'Time: O(E log E), Space: O(V)',
        useCase: 'Network design, clustering approximation'
    },
    prim: {
        name: 'Prim\'s MST',
        description: 'Builds MST from starting vertex, always adding minimum-weight edge to growing tree.',
        complexity: 'Time: O(E log V), Space: O(V)',
        useCase: 'Network design, minimum cost connections'
    },
    topological: {
        name: 'Topological Sort',
        description: 'Orders vertices so every edge goes from earlier to later in ordering. For DAGs only.',
        complexity: 'Time: O(V + E), Space: O(V)',
        useCase: 'Task scheduling, build systems, dependency resolution'
    },
    euler: {
        name: 'Euler Path',
        description: 'Finds path using every edge exactly once. Exists if 0 or 2 vertices have odd degree.',
        complexity: 'Time: O(E), Space: O(E)',
        useCase: 'Route planning, circuit design, Chinese Postman'
    },
    coloring: {
        name: 'Graph Coloring',
        description: 'Assigns colors to vertices so no adjacent vertices share a color. NP-hard problem.',
        complexity: 'Time: O(V²) for greedy, Space: O(V)',
        useCase: 'Register allocation, scheduling, map coloring'
    }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('graphCanvas');
    const visualizer = new GraphVisualizer(canvas);
    const algorithms = new GraphAlgorithms(visualizer);
    const presets = new GraphPresets(visualizer);

    // Algorithm selection
    const algorithmSelect = document.getElementById('algorithmSelect');
    const algorithmInfoDiv = document.getElementById('algorithmInfo');
    const sourceNodeSelect = document.getElementById('sourceNodeSelect');
    const targetNodeSelect = document.getElementById('targetNodeSelect');

    algorithmSelect.addEventListener('change', () => {
        const algo = algorithmSelect.value;
        if (algo && algorithmInfo[algo]) {
            const info = algorithmInfo[algo];
            algorithmInfoDiv.innerHTML = `
                <h4>${info.name}</h4>
                <p>${info.description}</p>
                <p><strong>Complexity:</strong> ${info.complexity}</p>
                <p><strong>Use Case:</strong> ${info.useCase}</p>
            `;

            // Show/hide source/target selection
            const needsSource = ['bfs', 'dfs', 'dijkstra', 'astar', 'prim'].includes(algo);
            const needsTarget = ['dijkstra', 'astar'].includes(algo);

            sourceNodeSelect.style.display = needsSource ? 'block' : 'none';
            targetNodeSelect.style.display = needsTarget ? 'block' : 'none';
        } else {
            algorithmInfoDiv.innerHTML = '<p>Select an algorithm to see information</p>';
            sourceNodeSelect.style.display = 'none';
            targetNodeSelect.style.display = 'none';
        }

        // Reset states
        visualizer.resetStates();
    });

    // Run button
    document.getElementById('runBtn').addEventListener('click', () => {
        const algo = algorithmSelect.value;
        if (!algo) return;

        visualizer.resetStates();
        visualizer.isAnimating = true;
        document.getElementById('stepBtn').disabled = false;

        const sourceId = parseInt(document.getElementById('sourceNode').value);
        const targetId = parseInt(document.getElementById('targetNode').value);

        switch (algo) {
            case 'bfs':
                algorithms.bfs(sourceId);
                break;
            case 'dfs':
                algorithms.dfs(sourceId);
                break;
            case 'dijkstra':
                algorithms.dijkstra(sourceId, targetId);
                break;
            case 'astar':
                algorithms.astar(sourceId, targetId);
                break;
            case 'kruskal':
                algorithms.kruskal();
                break;
            case 'prim':
                algorithms.prim(sourceId);
                break;
            case 'topological':
                algorithms.topologicalSort();
                break;
            case 'euler':
                algorithms.eulerPath();
                break;
            case 'coloring':
                algorithms.graphColoring();
                break;
        }
    });

    // Step button
    document.getElementById('stepBtn').addEventListener('click', () => {
        if (!visualizer.isAnimating) return;

        if (visualizer.currentStep < visualizer.animationSteps.length) {
            const step = visualizer.animationSteps[visualizer.currentStep];
            visualizer.applyStep(step);
            visualizer.currentStep++;
        } else {
            document.getElementById('stepBtn').disabled = true;
            visualizer.isAnimating = false;
        }
    });

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', () => {
        visualizer.resetStates();
        document.getElementById('stepBtn').disabled = true;
        document.getElementById('mstWeight').style.display = 'none';
    });

    // Directed/Undirected toggle
    document.getElementById('directedToggle').addEventListener('change', (e) => {
        visualizer.graph.directed = e.target.checked;
        visualizer.graph.clear();
        visualizer.updateStats();
        visualizer.draw();
    });

    // Weighted toggle
    document.getElementById('weightedToggle').addEventListener('change', (e) => {
        visualizer.graph.weighted = e.target.checked;
        document.getElementById('weightInputGroup').style.display = e.target.checked ? 'block' : 'none';
    });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            if (presets[preset]) {
                visualizer.resetStates();
                presets[preset]();
            }
        });
    });

    // Clear button
    document.getElementById('clearBtn').addEventListener('click', () => {
        visualizer.graph.clear();
        visualizer.resetStates();
        visualizer.updateStats();
        visualizer.draw();
    });

    // Add node button
    document.getElementById('addNodeBtn').addEventListener('click', () => {
        const canvas = document.getElementById('graphCanvas');
        const x = canvas.width / 2 / visualizer.zoom;
        const y = canvas.height / 2 / visualizer.zoom;
        visualizer.graph.addVertex(x, y);
        visualizer.updateStats();
        visualizer.draw();
    });

    // Random graph button
    document.getElementById('randomGraphBtn').addEventListener('click', () => {
        presets.random();
    });

    // Canvas controls
    document.getElementById('zoomInBtn').addEventListener('click', () => {
        visualizer.zoom *= 1.2;
        visualizer.draw();
    });

    document.getElementById('zoomOutBtn').addEventListener('click', () => {
        visualizer.zoom /= 1.2;
        visualizer.draw();
    });

    document.getElementById('fitBtn').addEventListener('click', () => {
        visualizer.zoom = 1;
        visualizer.panX = 0;
        visualizer.panY = 0;
        visualizer.draw();
    });

    document.getElementById('layoutBtn').addEventListener('click', () => {
        visualizer.applyForceLayout(100);
    });

    // Load default graph
    presets.grid();
});

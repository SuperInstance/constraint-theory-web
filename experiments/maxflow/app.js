// Max-Flow Min-Cut Simulator
// Implements Edmonds-Karp algorithm (BFS-based Ford-Fulkerson)

class FlowNetwork {
    constructor() {
        this.nodes = new Map();
        this.edges = [];
        this.source = null;
        this.sink = null;
        this.adjacency = new Map();
        this.flow = new Map();
        this.particles = [];
        this.augmentingPath = [];
        this.minCut = [];
        this.maxFlow = 0;
        this.iterations = 0;
        this.pathsFound = 0;
        this.isRunning = false;
        this.animationSpeed = 5;
        this.nodeIdCounter = 0;
        this.edgeIdCounter = 0;
    }

    addNode(x, y, id = null) {
        const nodeId = id || `node_${this.nodeIdCounter++}`;
        const node = {
            id: nodeId,
            x: x,
            y: y,
            isSource: false,
            isSink: false
        };
        this.nodes.set(nodeId, node);
        this.adjacency.set(nodeId, []);
        return node;
    }

    removeNode(nodeId) {
        if (this.nodes.has(nodeId)) {
            this.nodes.delete(nodeId);
            this.edges = this.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
            this.adjacency.delete(nodeId);

            // Clean up adjacency lists
            for (let [id, adj] of this.adjacency) {
                this.adjacency.set(id, adj.filter(n => n !== nodeId));
            }
        }
    }

    addEdge(from, to, capacity) {
        const edgeId = `edge_${this.edgeIdCounter++}`;
        const edge = {
            id: edgeId,
            from: from,
            to: to,
            capacity: capacity,
            flow: 0
        };
        this.edges.push(edge);

        if (!this.adjacency.has(from)) {
            this.adjacency.set(from, []);
        }
        if (!this.adjacency.has(to)) {
            this.adjacency.set(to, []);
        }

        this.adjacency.get(from).push(to);

        // Initialize flow tracking
        this.flow.set(`${from}-${to}`, 0);

        return edge;
    }

    removeEdge(edgeId) {
        const edgeIndex = this.edges.findIndex(e => e.id === edgeId);
        if (edgeIndex !== -1) {
            const edge = this.edges[edgeIndex];
            this.edges.splice(edgeIndex, 1);

            // Remove from adjacency
            const adjList = this.adjacency.get(edge.from);
            if (adjList) {
                const index = adjList.indexOf(edge.to);
                if (index !== -1) {
                    adjList.splice(index, 1);
                }
            }

            this.flow.delete(`${edge.from}-${edge.to}`);
        }
    }

    setSource(nodeId) {
        if (this.nodes.has(nodeId)) {
            if (this.source) {
                this.nodes.get(this.source).isSource = false;
            }
            this.source = nodeId;
            this.nodes.get(nodeId).isSource = true;

            // Can't be both source and sink
            if (this.sink === nodeId) {
                this.sink = null;
                this.nodes.get(nodeId).isSink = false;
            }
        }
    }

    setSink(nodeId) {
        if (this.nodes.has(nodeId)) {
            if (this.sink) {
                this.nodes.get(this.sink).isSink = false;
            }
            this.sink = nodeId;
            this.nodes.get(nodeId).isSink = true;

            // Can't be both source and sink
            if (this.source === nodeId) {
                this.source = null;
                this.nodes.get(nodeId).isSource = false;
            }
        }
    }

    getEdge(from, to) {
        return this.edges.find(e => e.from === from && e.to === to);
    }

    getCapacity(from, to) {
        const edge = this.getEdge(from, to);
        return edge ? edge.capacity : 0;
    }

    getFlow(from, to) {
        return this.flow.get(`${from}-${to}`) || 0;
    }

    getResidualCapacity(from, to) {
        return this.getCapacity(from, to) - this.getFlow(from, to);
    }

    // Edmonds-Karp: BFS to find augmenting path
    findAugmentingPath() {
        if (!this.source || !this.sink) {
            return null;
        }

        const visited = new Set();
        const parent = new Map();
        const queue = [this.source];
        visited.add(this.source);

        while (queue.length > 0) {
            const current = queue.shift();

            if (current === this.sink) {
                // Reconstruct path
                const path = [];
                let node = this.sink;
                while (node !== this.source) {
                    path.unshift(node);
                    node = parent.get(node);
                }
                path.unshift(this.source);
                return path;
            }

            // Check all neighbors (including residual edges)
            const neighbors = this.getNeighbors(current);
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    const residualCapacity = this.getResidualCapacity(current, neighbor);
                    const reverseFlow = this.getFlow(neighbor, current);

                    // Can traverse if there's residual capacity or reverse flow
                    if (residualCapacity > 0 || reverseFlow > 0) {
                        visited.add(neighbor);
                        parent.set(neighbor, current);
                        queue.push(neighbor);
                    }
                }
            }
        }

        return null; // No augmenting path found
    }

    getNeighbors(nodeId) {
        const neighbors = new Set();

        // Forward edges
        if (this.adjacency.has(nodeId)) {
            for (const neighbor of this.adjacency.get(nodeId)) {
                neighbors.add(neighbor);
            }
        }

        // Reverse edges (for residual graph)
        for (const edge of this.edges) {
            if (edge.to === nodeId) {
                neighbors.add(edge.from);
            }
        }

        return Array.from(neighbors);
    }

    // Find bottleneck capacity along a path
    getBottleneck(path) {
        let bottleneck = Infinity;

        for (let i = 0; i < path.length - 1; i++) {
            const from = path[i];
            const to = path[i + 1];
            const residualCapacity = this.getResidualCapacity(from, to);
            const reverseFlow = this.getFlow(to, from);

            // Can send flow forward if residual capacity exists
            if (residualCapacity > 0) {
                bottleneck = Math.min(bottleneck, residualCapacity);
            }
            // Can cancel flow if reverse flow exists
            else if (reverseFlow > 0) {
                bottleneck = Math.min(bottleneck, reverseFlow);
            }
        }

        return bottleneck;
    }

    // Augment flow along a path
    augmentFlow(path, amount) {
        for (let i = 0; i < path.length - 1; i++) {
            const from = path[i];
            const to = path[i + 1];

            const forwardEdge = this.getEdge(from, to);
            const reverseEdge = this.getEdge(to, from);

            if (forwardEdge) {
                // Increase forward flow
                const currentFlow = this.getFlow(from, to);
                this.flow.set(`${from}-${to}`, currentFlow + amount);
                forwardEdge.flow = currentFlow + amount;
            } else if (reverseEdge) {
                // Decrease reverse flow (cancel flow)
                const currentFlow = this.getFlow(to, from);
                this.flow.set(`${to}-${from}`, currentFlow - amount);
                reverseEdge.flow = currentFlow - amount;
            } else {
                // Creating new flow (edge might not exist in original graph)
                this.flow.set(`${from}-${to}`, amount);
            }
        }
    }

    // Find min cut using residual graph
    findMinCut() {
        if (!this.source || !this.sink) {
            return [];
        }

        // Find nodes reachable from source in residual graph
        const reachable = new Set();
        const queue = [this.source];
        reachable.add(this.source);

        while (queue.length > 0) {
            const current = queue.shift();

            for (const neighbor of this.getNeighbors(current)) {
                if (!reachable.has(neighbor)) {
                    const residualCapacity = this.getResidualCapacity(current, neighbor);
                    if (residualCapacity > 0) {
                        reachable.add(neighbor);
                        queue.push(neighbor);
                    }
                }
            }
        }

        // Min cut edges go from reachable to non-reachable
        const minCutEdges = [];
        for (const edge of this.edges) {
            if (reachable.has(edge.from) && !reachable.has(edge.to)) {
                minCutEdges.push(edge);
            }
        }

        return minCutEdges;
    }

    // Calculate max flow (sum of flows out of source)
    calculateMaxFlow() {
        if (!this.source) {
            return 0;
        }

        let totalFlow = 0;
        for (const edge of this.edges) {
            if (edge.from === this.source) {
                totalFlow += edge.flow;
            }
        }

        this.maxFlow = totalFlow;
        return totalFlow;
    }

    // Execute one iteration of the algorithm
    step() {
        if (!this.source || !this.sink) {
            return false;
        }

        this.augmentingPath = this.findAugmentingPath();

        if (this.augmentingPath) {
            const bottleneck = this.getBottleneck(this.augmentingPath);
            this.augmentFlow(this.augmentingPath, bottleneck);
            this.pathsFound++;
            this.iterations++;
            this.calculateMaxFlow();
            this.minCut = this.findMinCut();

            // Spawn particles for visualization
            this.spawnParticles(this.augmentingPath, bottleneck);

            return true; // Continue
        } else {
            // No more augmenting paths - algorithm complete
            this.minCut = this.findMinCut();
            return false; // Done
        }
    }

    // Reset flows but keep network structure
    reset() {
        this.flow.clear();
        this.maxFlow = 0;
        this.iterations = 0;
        this.pathsFound = 0;
        this.augmentingPath = [];
        this.minCut = [];
        this.particles = [];

        for (const edge of this.edges) {
            edge.flow = 0;
        }
    }

    // Clear entire network
    clear() {
        this.nodes.clear();
        this.edges = [];
        this.adjacency.clear();
        this.flow.clear();
        this.source = null;
        this.sink = null;
        this.particles = [];
        this.augmentingPath = [];
        this.minCut = [];
        this.maxFlow = 0;
        this.iterations = 0;
        this.pathsFound = 0;
        this.nodeIdCounter = 0;
        this.edgeIdCounter = 0;
    }

    // Particle system for flow visualization
    spawnParticles(path, amount) {
        for (let i = 0; i < path.length - 1; i++) {
            const from = path[i];
            const to = path[i + 1];

            const fromNode = this.nodes.get(from);
            const toNode = this.nodes.get(to);

            if (fromNode && toNode) {
                // Number of particles proportional to flow amount
                const particleCount = Math.min(Math.ceil(amount / 2), 5);

                for (let j = 0; j < particleCount; j++) {
                    setTimeout(() => {
                        this.particles.push({
                            from: from,
                            to: to,
                            x: fromNode.x,
                            y: fromNode.y,
                            targetX: toNode.x,
                            targetY: toNode.y,
                            progress: 0,
                            speed: 0.02 * this.animationSpeed
                        });
                    }, j * 100);
                }
            }
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.progress += particle.speed;

            if (particle.progress >= 1) {
                this.particles.splice(i, 1);
            } else {
                // Linear interpolation
                particle.x = particle.x + (particle.targetX - particle.x) * particle.speed;
                particle.y = particle.y + (particle.targetY - particle.y) * particle.speed;
            }
        }
    }
}

// Canvas renderer
class FlowRenderer {
    constructor(canvas, network) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.network = network;
        this.nodeRadius = 25;
        this.selectedNode = null;
        this.draggingNode = null;
        this.creatingEdge = null;
        this.mousePos = { x: 0, y: 0 };

        // Display options
        this.showCapacities = true;
        this.showFlow = true;
        this.showResidual = false;
        this.showMinCut = false;
        this.showParticles = true;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => this.onContextMenu(e));
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = Math.max(600, window.innerHeight - 300);
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    getNodeAtPos(pos) {
        for (const [id, node] of this.network.nodes) {
            const dx = node.x - pos.x;
            const dy = node.y - pos.y;
            if (dx * dx + dy * dy < this.nodeRadius * this.nodeRadius) {
                return node;
            }
        }
        return null;
    }

    getEdgeAtPos(pos) {
        for (const edge of this.network.edges) {
            const fromNode = this.network.nodes.get(edge.from);
            const toNode = this.network.nodes.get(edge.to);

            if (fromNode && toNode) {
                const dist = this.pointToLineDistance(pos, fromNode, toNode);
                if (dist < 10) {
                    return edge;
                }
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

        if (lenSq !== 0) {
            param = dot / lenSq;
        }

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

    onMouseDown(e) {
        if (e.button === 2) return; // Right click handled separately

        const pos = this.getMousePos(e);
        const node = this.getNodeAtPos(pos);

        if (node) {
            // Click on node - start dragging or creating edge
            if (e.shiftKey) {
                // Shift+click to create edge
                this.creatingEdge = { from: node.id };
            } else {
                // Regular click - select node
                this.selectedNode = node;
                this.draggingNode = node;
            }
        } else {
            // Click on empty space - add node
            const newNode = this.network.addNode(pos.x, pos.y);
            this.selectedNode = newNode;
        }
    }

    onMouseMove(e) {
        this.mousePos = this.getMousePos(e);

        if (this.draggingNode) {
            this.draggingNode.x = this.mousePos.x;
            this.draggingNode.y = this.mousePos.y;
        }
    }

    onMouseUp(e) {
        if (this.creatingEdge) {
            const pos = this.getMousePos(e);
            const node = this.getNodeAtPos(pos);

            if (node && node.id !== this.creatingEdge.from) {
                // Create edge
                const capacity = Math.floor(Math.random() * 10) + 1;
                this.network.addEdge(this.creatingEdge.from, node.id, capacity);
            }

            this.creatingEdge = null;
        }

        this.draggingNode = null;
    }

    onContextMenu(e) {
        e.preventDefault();
        const pos = this.getMousePos(e);

        // Check for node
        const node = this.getNodeAtPos(pos);
        if (node) {
            // Right-click on node - cycle through source/sink/normal
            if (node.isSource) {
                this.network.setSource(null); // Remove source
                this.network.setSink(node.id); // Make it sink
            } else if (node.isSink) {
                this.network.setSink(null); // Remove sink
                // Just normal node now
            } else {
                this.network.setSource(node.id); // Make it source
            }
            return;
        }

        // Check for edge
        const edge = this.getEdgeAtPos(pos);
        if (edge) {
            this.network.removeEdge(edge.id);
            return;
        }
    }

    render() {
        const ctx = this.ctx;

        // Clear canvas
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.drawGrid();

        // Update particles
        this.network.updateParticles();

        // Draw edges
        this.drawEdges();

        // Draw residual edges
        if (this.showResidual) {
            this.drawResidualEdges();
        }

        // Draw min-cut
        if (this.showMinCut && this.network.minCut.length > 0) {
            this.drawMinCut();
        }

        // Draw augmenting path
        if (this.network.augmentingPath.length > 0) {
            this.drawAugmentingPath();
        }

        // Draw nodes
        this.drawNodes();

        // Draw particles
        if (this.showParticles) {
            this.drawParticles();
        }

        // Draw edge being created
        if (this.creatingEdge) {
            const fromNode = this.network.nodes.get(this.creatingEdge.from);
            if (fromNode) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(fromNode.x, fromNode.y);
                ctx.lineTo(this.mousePos.x, this.mousePos.y);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }

    drawGrid() {
        const ctx = this.ctx;
        const gridSize = 50;

        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 1;

        for (let x = 0; x < this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
    }

    drawEdges() {
        const ctx = this.ctx;

        for (const edge of this.network.edges) {
            const fromNode = this.network.nodes.get(edge.from);
            const toNode = this.network.nodes.get(edge.to);

            if (!fromNode || !toNode) continue;

            const isSaturated = edge.flow >= edge.capacity;
            const flowRatio = edge.capacity > 0 ? edge.flow / edge.capacity : 0;

            // Edge width based on capacity
            const lineWidth = Math.max(2, Math.min(8, edge.capacity));

            // Edge color based on saturation
            if (isSaturated) {
                ctx.strokeStyle = '#ff4444';
                ctx.shadowColor = '#ff4444';
                ctx.shadowBlur = 10;
            } else {
                const green = Math.floor(255 * (1 - flowRatio));
                const blue = Math.floor(255 * flowRatio);
                ctx.strokeStyle = `rgb(100, ${green}, ${blue})`;
                ctx.shadowColor = ctx.strokeStyle;
                ctx.shadowBlur = 5;
            }

            ctx.lineWidth = lineWidth;
            ctx.beginPath();
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(toNode.x, toNode.y);
            ctx.stroke();

            ctx.shadowBlur = 0;

            // Draw arrow head
            this.drawArrowHead(fromNode, toNode, ctx.strokeStyle);

            // Draw capacity and flow labels
            if (this.showCapacities || this.showFlow) {
                const midX = (fromNode.x + toNode.x) / 2;
                const midY = (fromNode.y + toNode.y) / 2;

                ctx.fillStyle = '#ffffff';
                ctx.font = '12px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                let label = '';
                if (this.showCapacities) label += `${edge.capacity}`;
                if (this.showFlow && edge.flow > 0) {
                    label += this.showCapacities ? `/` : '';
                    label += `${edge.flow}`;
                }

                if (label) {
                    // Draw background for label
                    const textWidth = ctx.measureText(label).width;
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fillRect(midX - textWidth/2 - 4, midY - 10, textWidth + 8, 20);

                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(label, midX, midY);
                }
            }
        }
    }

    drawArrowHead(from, to, color) {
        const ctx = this.ctx;
        const headLength = 12;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const angle = Math.atan2(dy, dx);

        // Adjust for node radius
        const endX = to.x - this.nodeRadius * Math.cos(angle);
        const endY = to.y - this.nodeRadius * Math.sin(angle);

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - headLength * Math.cos(angle - Math.PI / 6),
            endY - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            endX - headLength * Math.cos(angle + Math.PI / 6),
            endY - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
    }

    drawResidualEdges() {
        const ctx = this.ctx;

        for (const edge of this.network.edges) {
            const fromNode = this.network.nodes.get(edge.from);
            const toNode = this.network.nodes.get(edge.to);

            if (!fromNode || !toNode) continue;

            const residualCapacity = edge.capacity - edge.flow;

            if (residualCapacity > 0) {
                // Draw residual capacity as dashed line
                ctx.strokeStyle = '#44aa44';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(fromNode.x, fromNode.y);
                ctx.lineTo(toNode.x, toNode.y);
                ctx.stroke();
                ctx.setLineDash([]);
            }

            // Draw reverse flow if exists
            const reverseFlow = this.network.getFlow(edge.to, edge.from);
            if (reverseFlow > 0) {
                ctx.strokeStyle = '#aa4444';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(toNode.x, toNode.y);
                ctx.lineTo(fromNode.x, fromNode.y);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }

    drawMinCut() {
        const ctx = this.ctx;
        const time = Date.now() / 1000;

        for (const edge of this.network.minCut) {
            const fromNode = this.network.nodes.get(edge.from);
            const toNode = this.network.nodes.get(edge.to);

            if (!fromNode || !toNode) continue;

            // Pulsing red effect
            const pulse = (Math.sin(time * 3) + 1) / 2;
            ctx.strokeStyle = `rgba(255, 68, 68, ${0.5 + pulse * 0.5})`;
            ctx.lineWidth = 8;
            ctx.shadowColor = '#ff4444';
            ctx.shadowBlur = 20;

            ctx.beginPath();
            ctx.moveTo(fromNode.x, fromNode.y);
            ctx.lineTo(toNode.x, toNode.y);
            ctx.stroke();

            ctx.shadowBlur = 0;
        }
    }

    drawAugmentingPath() {
        const ctx = this.ctx;
        const path = this.network.augmentingPath;

        if (path.length < 2) return;

        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15;

        ctx.beginPath();
        const firstNode = this.network.nodes.get(path[0]);
        if (firstNode) {
            ctx.moveTo(firstNode.x, firstNode.y);

            for (let i = 1; i < path.length; i++) {
                const node = this.network.nodes.get(path[i]);
                if (node) {
                    ctx.lineTo(node.x, node.y);
                }
            }
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawNodes() {
        const ctx = this.ctx;

        for (const [id, node] of this.network.nodes) {
            // Node color based on type
            let fillColor, glowColor;

            if (node.isSource) {
                fillColor = '#00ff00';
                glowColor = '#00ff00';
            } else if (node.isSink) {
                fillColor = '#ff4444';
                glowColor = '#ff4444';
            } else {
                fillColor = '#4488ff';
                glowColor = '#4488ff';
            }

            // Glow effect
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 15;

            // Draw node
            ctx.fillStyle = fillColor;
            ctx.beginPath();
            ctx.arc(node.x, node.y, this.nodeRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;

            // Draw border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw label
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            let label = node.isSource ? 'S' : (node.isSink ? 'T' : id.split('_')[1]);
            ctx.fillText(label, node.x, node.y);
        }
    }

    drawParticles() {
        const ctx = this.ctx;

        for (const particle of this.network.particles) {
            ctx.fillStyle = '#ffff00';
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 10;

            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 0;
    }
}

// Preset networks
class NetworkPresets {
    static createSimple(network) {
        network.clear();

        const s = network.addNode(100, 300, 'S');
        s.isSource = true;
        network.source = 'S';

        const a = network.addNode(300, 150);
        const b = network.addNode(300, 300);
        const c = network.addNode(300, 450);

        const d = network.addNode(500, 150);
        const e = network.addNode(500, 300);
        const f = network.addNode(500, 450);

        const t = network.addNode(700, 300, 'T');
        t.isSink = true;
        network.sink = 'T';

        // Add edges with capacities
        network.addEdge('S', 'a', 10);
        network.addEdge('S', 'b', 8);
        network.addEdge('S', 'c', 6);

        network.addEdge('a', 'd', 8);
        network.addEdge('a', 'e', 4);
        network.addEdge('b', 'd', 3);
        network.addEdge('b', 'e', 6);
        network.addEdge('b', 'f', 4);
        network.addEdge('c', 'e', 3);
        network.addEdge('c', 'f', 8);

        network.addEdge('d', 'T', 8);
        network.addEdge('e', 'T', 10);
        network.addEdge('f', 'T', 6);
    }

    static createGrid(network) {
        network.clear();

        const gridSize = 4;
        const spacing = 120;
        const offsetX = 100;
        const offsetY = 100;

        const nodes = [];

        // Create grid nodes
        for (let row = 0; row < gridSize; row++) {
            nodes[row] = [];
            for (let col = 0; col < gridSize; col++) {
                const x = offsetX + col * spacing;
                const y = offsetY + row * spacing;
                const node = network.addNode(x, y);
                nodes[row][col] = node.id;
            }
        }

        // Set source and sink
        const sourceNode = network.nodes.get(nodes[0][0]);
        sourceNode.isSource = true;
        network.source = nodes[0][0];

        const sinkNode = network.nodes.get(nodes[gridSize-1][gridSize-1]);
        sinkNode.isSink = true;
        network.sink = nodes[gridSize-1][gridSize-1];

        // Add edges (right and down)
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const from = nodes[row][col];

                // Right edge
                if (col < gridSize - 1) {
                    const to = nodes[row][col + 1];
                    const capacity = Math.floor(Math.random() * 8) + 3;
                    network.addEdge(from, to, capacity);
                }

                // Down edge
                if (row < gridSize - 1) {
                    const to = nodes[row + 1][col];
                    const capacity = Math.floor(Math.random() * 8) + 3;
                    network.addEdge(from, to, capacity);
                }

                // Some diagonal edges
                if (row < gridSize - 1 && col < gridSize - 1 && Math.random() > 0.5) {
                    const to = nodes[row + 1][col + 1];
                    const capacity = Math.floor(Math.random() * 5) + 2;
                    network.addEdge(from, to, capacity);
                }
            }
        }
    }

    static createBinaryTree(network) {
        network.clear();

        const levels = 4;
        const nodeWidth = 120;
        const levelHeight = 100;
        const startY = 80;

        const nodes = [];

        // Create tree nodes
        for (let level = 0; level < levels; level++) {
            nodes[level] = [];
            const nodesInLevel = Math.pow(2, level);
            const levelWidth = (nodesInLevel - 1) * nodeWidth;
            const startX = (800 - levelWidth) / 2;

            for (let i = 0; i < nodesInLevel; i++) {
                const x = startX + i * nodeWidth;
                const y = startY + level * levelHeight;
                const node = network.addNode(x, y);
                nodes[level][i] = node.id;
            }
        }

        // Set source (root) and sink (leaf nodes)
        const root = network.nodes.get(nodes[0][0]);
        root.isSource = true;
        network.source = nodes[0][0];

        // Mark all leaf nodes as sinks
        for (let i = 0; i < nodes[levels-1].length; i++) {
            const leaf = network.nodes.get(nodes[levels-1][i]);
            leaf.isSink = true;
        }
        network.sink = nodes[levels-1][0]; // Use first leaf as main sink

        // Add edges from parent to children
        for (let level = 0; level < levels - 1; level++) {
            for (let i = 0; i < nodes[level].length; i++) {
                const from = nodes[level][i];
                const leftChild = nodes[level + 1][i * 2];
                const rightChild = nodes[level + 1][i * 2 + 1];

                const capacity = Math.floor(Math.random() * 8) + 4;
                network.addEdge(from, leftChild, capacity);

                const capacity2 = Math.floor(Math.random() * 8) + 4;
                network.addEdge(from, rightChild, capacity2);
            }
        }

        // Connect all leaf nodes to main sink with high capacity
        const mainSink = nodes[levels-1][0];
        for (let i = 1; i < nodes[levels-1].length; i++) {
            network.addEdge(nodes[levels-1][i], mainSink, 100);
        }
    }

    static createRandom(network) {
        network.clear();

        const nodeCount = 12;
        const edgeCount = 20;
        const width = 700;
        const height = 500;
        const padding = 80;

        // Create random nodes
        for (let i = 0; i < nodeCount; i++) {
            const x = padding + Math.random() * (width - 2 * padding);
            const y = padding + Math.random() * (height - 2 * padding);
            network.addNode(x, y);
        }

        // Set source and sink
        const nodeArray = Array.from(network.nodes.values());
        const sourceNode = nodeArray[0];
        sourceNode.isSource = true;
        network.source = sourceNode.id;

        const sinkNode = nodeArray[nodeArray.length - 1];
        sinkNode.isSink = true;
        network.sink = sinkNode.id;

        // Create random edges
        const nodeIds = Array.from(network.nodes.keys());
        for (let i = 0; i < edgeCount; i++) {
            const from = nodeIds[Math.floor(Math.random() * nodeIds.length)];
            const to = nodeIds[Math.floor(Math.random() * nodeIds.length)];

            if (from !== to && !network.getEdge(from, to)) {
                const capacity = Math.floor(Math.random() * 10) + 1;
                network.addEdge(from, to, capacity);
            }
        }

        // Ensure source has outgoing edges
        let sourceHasEdges = false;
        for (const edge of network.edges) {
            if (edge.from === network.source) {
                sourceHasEdges = true;
                break;
            }
        }

        if (!sourceHasEdges) {
            const randomTarget = nodeIds[Math.floor(Math.random() * (nodeIds.length - 1)) + 1];
            network.addEdge(network.source, randomTarget, 10);
        }

        // Ensure sink has incoming edges
        let sinkHasEdges = false;
        for (const edge of network.edges) {
            if (edge.to === network.sink) {
                sinkHasEdges = true;
                break;
            }
        }

        if (!sinkHasEdges) {
            const randomSource = nodeIds[Math.floor(Math.random() * (nodeIds.length - 1))];
            network.addEdge(randomSource, network.sink, 10);
        }
    }
}

// Main application
class FlowApp {
    constructor() {
        this.canvas = document.getElementById('flowCanvas');
        this.network = new FlowNetwork();
        this.renderer = new FlowRenderer(this.canvas, this.network);
        this.autoRunInterval = null;

        this.setupEventListeners();
        this.loadPreset('simple');
        this.animate();
    }

    setupEventListeners() {
        // Preset buttons
        document.getElementById('simplePreset').addEventListener('click', () => {
            this.stopAutoRun();
            this.loadPreset('simple');
        });

        document.getElementById('gridPreset').addEventListener('click', () => {
            this.stopAutoRun();
            this.loadPreset('grid');
        });

        document.getElementById('treePreset').addEventListener('click', () => {
            this.stopAutoRun();
            this.loadPreset('tree');
        });

        document.getElementById('randomPreset').addEventListener('click', () => {
            this.stopAutoRun();
            this.loadPreset('random');
        });

        // Algorithm controls
        document.getElementById('stepForward').addEventListener('click', () => {
            this.step();
        });

        document.getElementById('runAuto').addEventListener('click', () => {
            this.startAutoRun();
        });

        document.getElementById('pause').addEventListener('click', () => {
            this.stopAutoRun();
        });

        document.getElementById('reset').addEventListener('click', () => {
            this.stopAutoRun();
            this.network.reset();
            this.updateStats();
        });

        // Speed slider
        document.getElementById('speedSlider').addEventListener('input', (e) => {
            const speed = parseInt(e.target.value);
            this.network.animationSpeed = speed;
            document.getElementById('speedValue').textContent = speed + 'x';
        });

        // Display options
        document.getElementById('showCapacities').addEventListener('change', (e) => {
            this.renderer.showCapacities = e.target.checked;
        });

        document.getElementById('showFlow').addEventListener('change', (e) => {
            this.renderer.showFlow = e.target.checked;
        });

        document.getElementById('showResidual').addEventListener('change', (e) => {
            this.renderer.showResidual = e.target.checked;
        });

        document.getElementById('showMinCut').addEventListener('change', (e) => {
            this.renderer.showMinCut = e.target.checked;
        });

        document.getElementById('showParticles').addEventListener('change', (e) => {
            this.renderer.showParticles = e.target.checked;
        });
    }

    loadPreset(presetName) {
        switch (presetName) {
            case 'simple':
                NetworkPresets.createSimple(this.network);
                break;
            case 'grid':
                NetworkPresets.createGrid(this.network);
                break;
            case 'tree':
                NetworkPresets.createBinaryTree(this.network);
                break;
            case 'random':
                NetworkPresets.createRandom(this.network);
                break;
        }

        this.updateStats();
    }

    step() {
        const continued = this.network.step();
        this.updateStats();

        if (!continued) {
            this.stopAutoRun();
            this.showComplete();
        }
    }

    startAutoRun() {
        if (this.autoRunInterval) return;

        const speed = this.network.animationSpeed;
        const interval = Math.max(50, 500 - speed * 40);

        this.autoRunInterval = setInterval(() => {
            this.step();
        }, interval);
    }

    stopAutoRun() {
        if (this.autoRunInterval) {
            clearInterval(this.autoRunInterval);
            this.autoRunInterval = null;
        }
    }

    updateStats() {
        document.getElementById('maxFlowValue').textContent = this.network.maxFlow;

        // Calculate min cut capacity
        const minCutCapacity = this.network.minCut.reduce(
            (sum, edge) => sum + edge.capacity, 0
        );
        document.getElementById('minCutValue').textContent = minCutCapacity;

        document.getElementById('pathsFound').textContent = this.network.pathsFound;
        document.getElementById('iterations').textContent = this.network.iterations;

        // Update current path display
        const pathDisplay = document.getElementById('currentPath');
        if (this.network.augmentingPath.length > 0) {
            const pathStr = this.network.augmentingPath.join(' → ');
            const bottleneck = this.network.getBottleneck(this.network.augmentingPath);
            pathDisplay.innerHTML = `<strong>Path:</strong> ${pathStr}<br><strong>Bottleneck:</strong> ${bottleneck}`;
        } else {
            pathDisplay.textContent = this.network.maxFlow > 0
                ? 'Algorithm complete - no more augmenting paths'
                : 'No augmenting path found';
        }
    }

    showComplete() {
        const pathDisplay = document.getElementById('currentPath');
        pathDisplay.innerHTML = `<strong style="color: #00ff00;">Algorithm Complete!</strong><br>Max Flow: ${this.network.maxFlow}`;
    }

    animate() {
        this.renderer.render();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.flowApp = new FlowApp();
});

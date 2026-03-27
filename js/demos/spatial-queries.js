/**
 * KD-Tree Spatial Queries Demo
 * Demonstrates O(log n) spatial queries using KD-tree indexing
 */

class KDNode {
  constructor(point, left = null, right = null) {
    this.point = point;
    this.left = left;
    this.right = right;
  }
}

class KDTree {
  constructor(points) {
    this.root = this.buildTree(points, 0);
  }

  buildTree(points, depth) {
    if (points.length === 0) return null;

    const axis = depth % 2;
    points.sort((a, b) => axis === 0 ? a.x - b.x : a.y - b.y);

    const mid = Math.floor(points.length / 2);
    const node = new KDNode(
      points[mid],
      this.buildTree(points.slice(0, mid), depth + 1),
      this.buildTree(points.slice(mid + 1), depth + 1)
    );

    return node;
  }

  query(point, radius, node = this.root, depth = 0) {
    if (!node) return [];

    const axis = depth % 2;
    const dist = Math.sqrt(
      Math.pow(node.point.x - point.x, 2) +
      Math.pow(node.point.y - point.y, 2)
    );

    let neighbors = [];
    if (dist <= radius) {
      neighbors.push(node.point);
    }

    const axisDiff = point[axis === 0 ? 'x' : 'y'] - node.point[axis === 0 ? 'x' : 'y'];

    if (axisDiff <= 0) {
      neighbors = neighbors.concat(this.query(point, radius, node.left, depth + 1));
      if (axisDiff + radius >= 0) {
        neighbors = neighbors.concat(this.query(point, radius, node.right, depth + 1));
      }
    } else {
      neighbors = neighbors.concat(this.query(point, radius, node.right, depth + 1));
      if (axisDiff - radius <= 0) {
        neighbors = neighbors.concat(this.query(point, radius, node.left, depth + 1));
      }
    }

    return neighbors;
  }

  getDepth(node = this.root) {
    if (!node) return 0;
    return 1 + Math.max(this.getDepth(node.left), this.getDepth(node.right));
  }

  getLeafCount(node = this.root) {
    if (!node) return 0;
    if (!node.left && !node.right) return 1;
    return this.getLeafCount(node.left) + this.getLeafCount(node.right);
  }
}

class SpatialQueriesDemo {
  constructor() {
    this.canvas = document.getElementById('spatial-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.kdCanvas = document.getElementById('kdtree-canvas');
    this.kdCtx = this.kdCanvas.getContext('2d');

    this.perfCanvas = document.getElementById('performance-chart');
    this.perfCtx = this.perfCanvas.getContext('2d');

    this.agents = [];
    this.queryRadius = 100;
    this.queryPoint = null;
    this.neighbors = [];
    this.kdTree = null;

    this.queryHistory = [];

    this.init();
  }

  init() {
    this.setupControls();
    this.generateAgents(50);
    this.animate();
  }

  setupControls() {
    const agentSlider = document.getElementById('agent-slider');
    const radiusSlider = document.getElementById('radius-slider');
    const runQueryBtn = document.getElementById('run-query-btn');
    const addAgentsBtn = document.getElementById('add-agents-btn');
    const resetBtn = document.getElementById('reset-btn');

    agentSlider.addEventListener('input', (e) => {
      const count = parseInt(e.target.value);
      document.getElementById('agent-count').textContent = count;
      this.generateAgents(count);
    });

    radiusSlider.addEventListener('input', (e) => {
      this.queryRadius = parseInt(e.target.value);
      document.getElementById('query-radius').textContent = this.queryRadius;
      this.draw();
    });

    runQueryBtn.addEventListener('click', () => {
      this.runRandomQuery();
    });

    addAgentsBtn.addEventListener('click', () => {
      const currentCount = this.agents.length;
      this.generateAgents(Math.min(currentCount + 10, 200));
      agentSlider.value = this.agents.length;
      document.getElementById('agent-count').textContent = this.agents.length;
    });

    resetBtn.addEventListener('click', () => {
      this.generateAgents(50);
      agentSlider.value = 50;
      document.getElementById('agent-count').textContent = 50;
    });

    // Canvas click for query
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (this.canvas.height / rect.height);
      this.runQuery(x, y);
    });
  }

  generateAgents(count) {
    this.agents = [];
    for (let i = 0; i < count; i++) {
      this.agents.push({
        id: i,
        x: 50 + Math.random() * 500,
        y: 50 + Math.random() * 500,
        color: 'oklch(0.72 0.19 145)'
      });
    }

    this.kdTree = new KDTree(this.agents);
    this.queryPoint = null;
    this.neighbors = [];
    this.updateTreeStats();
    this.draw();
  }

  runQuery(x, y) {
    const startTime = performance.now();

    this.queryPoint = { x, y };
    this.neighbors = this.kdTree.query(this.queryPoint, this.queryRadius);

    const endTime = performance.now();
    const queryTime = (endTime - startTime).toFixed(3);

    // Simulate linear search time
    const linearStartTime = performance.now();
    let linearCount = 0;
    for (const agent of this.agents) {
      const dist = Math.sqrt(Math.pow(agent.x - x, 2) + Math.pow(agent.y - y, 2));
      if (dist <= this.queryRadius) linearCount++;
    }
    const linearEndTime = performance.now();
    const linearTime = (linearEndTime - linearStartTime).toFixed(3);

    // Update metrics
    document.getElementById('agents-searched').textContent = this.agents.length;
    document.getElementById('neighbors-found').textContent = this.neighbors.length;
    document.getElementById('query-time').textContent = queryTime + 'ms';
    document.getElementById('nodes-visited').textContent = Math.ceil(Math.log2(this.agents.length));

    document.getElementById('linear-time').textContent = linearTime + 'ms';
    document.getElementById('kdtree-time').textContent = queryTime + 'ms';

    const speedup = (parseFloat(linearTime) / parseFloat(queryTime)).toFixed(1);
    document.getElementById('speedup').textContent = speedup + 'x';

    const efficiency = Math.round((1 - parseFloat(queryTime) / parseFloat(linearTime)) * 100);
    document.getElementById('efficiency').textContent = efficiency + '%';

    // Add to history
    this.queryHistory.push({
      agentCount: this.agents.length,
      kdTreeTime: parseFloat(queryTime),
      linearTime: parseFloat(linearTime)
    });

    if (this.queryHistory.length > 20) {
      this.queryHistory.shift();
    }

    this.draw();
    this.drawPerformanceChart();
  }

  runRandomQuery() {
    const randomAgent = this.agents[Math.floor(Math.random() * this.agents.length)];
    this.runQuery(randomAgent.x, randomAgent.y);
  }

  updateTreeStats() {
    const depth = this.kdTree.getDepth();
    const leaves = this.kdTree.getLeafCount();
    const balance = this.agents.length > 0 ? (leaves / this.agents.length).toFixed(2) : '0.00';

    document.getElementById('tree-depth').textContent = depth;
    document.getElementById('leaf-nodes').textContent = leaves;
    document.getElementById('balance-factor').textContent = balance;
  }

  draw() {
    this.drawSpatialCanvas();
    this.drawKDTreeCanvas();
  }

  drawSpatialCanvas() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Background grid
    this.drawGrid(ctx, this.canvas.width, this.canvas.height);

    // Draw query radius
    if (this.queryPoint) {
      ctx.beginPath();
      ctx.arc(this.queryPoint.x, this.queryPoint.y, this.queryRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'oklch(0.72 0.19 145 / 0.1)';
      ctx.fill();
      ctx.strokeStyle = 'oklch(0.72 0.19 145 / 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Query point
      ctx.beginPath();
      ctx.arc(this.queryPoint.x, this.queryPoint.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'oklch(0.72 0.19 145)';
      ctx.fill();
      ctx.strokeStyle = 'oklch(0.98 0.005 145)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw agents
    for (const agent of this.agents) {
      const isNeighbor = this.neighbors.some(n => n.id === agent.id);
      const color = isNeighbor ? 'oklch(0.80 0.15 160)' : agent.color;
      const size = isNeighbor ? 10 : 6;

      this.drawAgent(ctx, agent.x, agent.y, color, size);

      // Draw connections to neighbors
      if (isNeighbor && this.queryPoint) {
        ctx.beginPath();
        ctx.moveTo(this.queryPoint.x, this.queryPoint.y);
        ctx.lineTo(agent.x, agent.y);
        ctx.strokeStyle = 'oklch(0.72 0.19 145 / 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  drawKDTreeCanvas() {
    const ctx = this.kdCtx;
    ctx.clearRect(0, 0, this.kdCanvas.width, this.kdCanvas.height);

    // Background
    ctx.fillStyle = 'oklch(0.06 0.01 145)';
    ctx.fillRect(0, 0, this.kdCanvas.width, this.kdCanvas.height);

    if (!this.kdTree || !this.kdTree.root) return;

    // Draw tree structure
    this.drawKDTreeLevel(ctx, this.kdTree.root, 0, this.kdCanvas.width / 2, 40, 80);
  }

  drawKDTreeLevel(ctx, node, x, y, level, spacing) {
    if (!node) return;

    // Draw node
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'oklch(0.72 0.19 145)';
    ctx.fill();
    ctx.strokeStyle = 'oklch(0.98 0.005 145)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw connections to children
    if (node.left) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - spacing, y + 40);
      ctx.strokeStyle = 'oklch(0.25 0.02 145)';
      ctx.lineWidth = 1;
      ctx.stroke();

      this.drawKDTreeLevel(ctx, node.left, x - spacing, y + 40, level + 1, spacing / 2);
    }

    if (node.right) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + spacing, y + 40);
      ctx.strokeStyle = 'oklch(0.25 0.02 145)';
      ctx.lineWidth = 1;
      ctx.stroke();

      this.drawKDTreeLevel(ctx, node.right, x + spacing, y + 40, level + 1, spacing / 2);
    }
  }

  drawPerformanceChart() {
    const ctx = this.perfCtx;
    const width = this.perfCanvas.width;
    const height = this.perfCanvas.height;

    ctx.clearRect(0, 0, width, height);

    if (this.queryHistory.length < 2) return;

    const maxTime = Math.max(...this.queryHistory.map(q => Math.max(q.kdTreeTime, q.linearTime)));
    const xScale = (width - 100) / (this.queryHistory.length - 1);
    const yScale = (height - 60) / maxTime;

    // Draw grid
    ctx.strokeStyle = 'oklch(0.25 0.02 145 / 0.3)';
    ctx.lineWidth = 1;

    for (let i = 0; i < 4; i++) {
      const y = 30 + (i * (height - 60) / 3);
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(width - 50, y);
      ctx.stroke();
    }

    // Draw KD-tree line (teal)
    ctx.strokeStyle = 'oklch(0.72 0.19 145)';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < this.queryHistory.length; i++) {
      const x = 50 + i * xScale;
      const y = height - 30 - this.queryHistory[i].kdTreeTime * yScale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();

    // Draw linear search line (red)
    ctx.strokeStyle = 'oklch(0.55 0.22 27)';
    ctx.beginPath();

    for (let i = 0; i < this.queryHistory.length; i++) {
      const x = 50 + i * xScale;
      const y = height - 30 - this.queryHistory[i].linearTime * yScale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();

    // Labels
    ctx.fillStyle = 'oklch(0.65 0.02 145)';
    ctx.font = '12px Geist';
    ctx.textAlign = 'center';
    ctx.fillText('Query History', width / 2, 15);
  }

  drawGrid(ctx, width, height) {
    ctx.strokeStyle = 'oklch(0.25 0.02 145 / 0.2)';
    ctx.lineWidth = 1;

    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  drawAgent(ctx, x, y, color, size) {
    // Glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
    gradient.addColorStop(0, color.replace(')', ' / 0.5)'));
    gradient.addColorStop(1, color.replace(')', ' / 0)'));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 2, 0, Math.PI * 2);
    ctx.fill();

    // Agent
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  animate() {
    // Animation loop if needed
    requestAnimationFrame(() => this.animate());
  }
}

// Initialize demo when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SpatialQueriesDemo();
});

/**
 * FPS vs RTS Agent Coordination Demo
 * Demonstrates the difference between traditional RTS coordination
 * and FPS-style perspective-based coordination
 */

class FPSvsRTSDemo {
  constructor() {
    // RTS Demo
    this.rtsAgents = [];
    this.rtsCanvas = document.getElementById('rts-canvas');
    this.rtsCtx = this.rtsCanvas.getContext('2d');

    // FPS Demo
    this.fpsAgents = [];
    this.fpsCanvas = document.getElementById('fps-canvas');
    this.fpsCtx = this.fpsCanvas.getContext('2d');
    this.fpsQueryRadius = 100;

    // Comparison Chart
    this.comparisonCanvas = document.getElementById('comparison-chart');
    this.comparisonCtx = this.comparisonCanvas.getContext('2d');

    this.init();
  }

  init() {
    this.setupRTSDemo();
    this.setupFPSDemo();
    this.setupComparisonChart();
    this.animate();
  }

  // ==================== RTS DEMO ====================

  setupRTSDemo() {
    const slider = document.getElementById('rts-agent-slider');
    const communicateBtn = document.getElementById('rts-communicate-btn');
    const resetBtn = document.getElementById('rts-reset-btn');

    // Initialize agents
    this.generateRTSAgents(parseInt(slider.value));

    // Slider
    slider.addEventListener('input', (e) => {
      const count = parseInt(e.target.value);
      document.getElementById('rts-agent-count').textContent = count;
      this.generateRTSAgents(count);
      this.drawRTSDemo();
    });

    // Communicate button
    communicateBtn.addEventListener('click', () => {
      this.simulateRTSCommunication();
    });

    // Reset button
    resetBtn.addEventListener('click', () => {
      this.generateRTSAgents(parseInt(slider.value));
      this.drawRTSDemo();
      this.updateRTSMetrics(0, 0, 0);
    });
  }

  generateRTSAgents(count) {
    this.rtsAgents = [];
    for (let i = 0; i < count; i++) {
      this.rtsAgents.push({
        x: 50 + Math.random() * 400,
        y: 50 + Math.random() * 400,
        color: `oklch(${0.5 + Math.random() * 0.3} 0.2 ${Math.random() * 360})`,
        connections: []
      });
    }
  }

  simulateRTSCommunication() {
    const startTime = performance.now();
    let totalMessages = 0;
    let totalUpdates = 0;

    // In RTS, every agent must communicate with every other agent
    for (let i = 0; i < this.rtsAgents.length; i++) {
      for (let j = i + 1; j < this.rtsAgents.length; j++) {
        totalMessages += 2; // Bidirectional
        this.rtsAgents[i].connections.push(j);
        this.rtsAgents[j].connections.push(i);
      }
    }

    // State updates: O(n²) complexity
    totalUpdates = this.rtsAgents.length * (this.rtsAgents.length - 1);

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    this.updateRTSMetrics(totalMessages, duration, totalUpdates);
    this.drawRTSDemo();
  }

  drawRTSDemo() {
    const ctx = this.rtsCtx;
    ctx.clearRect(0, 0, this.rtsCanvas.width, this.rtsCanvas.height);

    // Draw background grid
    this.drawGrid(ctx, this.rtsCanvas.width, this.rtsCanvas.height);

    // Draw connections
    ctx.strokeStyle = 'oklch(0.55 0.22 27 / 0.3)';
    ctx.lineWidth = 1;

    for (let i = 0; i < this.rtsAgents.length; i++) {
      const agent = this.rtsAgents[i];
      for (const connectionIndex of agent.connections) {
        const connectedAgent = this.rtsAgents[connectionIndex];
        ctx.beginPath();
        ctx.moveTo(agent.x, agent.y);
        ctx.lineTo(connectedAgent.x, connectedAgent.y);
        ctx.stroke();
      }
    }

    // Draw agents
    for (const agent of this.rtsAgents) {
      this.drawAgent(ctx, agent.x, agent.y, agent.color, 8);
    }

    // Draw central controller
    this.drawCentralController(ctx);
  }

  drawCentralController(ctx) {
    const centerX = this.rtsCanvas.width / 2;
    const centerY = this.rtsCanvas.height / 2;

    // Glow effect
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 60);
    gradient.addColorStop(0, 'oklch(0.55 0.22 27 / 0.3)');
    gradient.addColorStop(1, 'oklch(0.55 0.22 27 / 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.rtsCanvas.width, this.rtsCanvas.height);

    // Controller icon
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'oklch(0.55 0.22 27)';
    ctx.fill();
    ctx.strokeStyle = 'oklch(0.98 0.005 145)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Icon
    ctx.fillStyle = 'oklch(0.98 0.005 145)';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👁', centerX, centerY);
  }

  updateRTSMetrics(messages, time, updates) {
    document.getElementById('rts-messages').textContent = messages.toLocaleString();
    document.getElementById('rts-time').textContent = time + 'ms';
    document.getElementById('rts-updates').textContent = updates.toLocaleString();
  }

  // ==================== FPS DEMO ====================

  setupFPSDemo() {
    const agentSlider = document.getElementById('fps-agent-slider');
    const radiusSlider = document.getElementById('fps-radius-slider');
    const queryBtn = document.getElementById('fps-query-btn');
    const resetBtn = document.getElementById('fps-reset-btn');

    // Initialize agents
    this.generateFPSAgents(parseInt(agentSlider.value));

    // Agent slider
    agentSlider.addEventListener('input', (e) => {
      const count = parseInt(e.target.value);
      document.getElementById('fps-agent-count').textContent = count;
      this.generateFPSAgents(count);
      this.drawFPSDemo();
    });

    // Radius slider
    radiusSlider.addEventListener('input', (e) => {
      this.fpsQueryRadius = parseInt(e.target.value);
      document.getElementById('fps-radius').textContent = this.fpsQueryRadius;
      this.drawFPSDemo();
    });

    // Query button
    queryBtn.addEventListener('click', () => {
      this.runSpatialQuery();
    });

    // Reset button
    resetBtn.addEventListener('click', () => {
      this.generateFPSAgents(parseInt(agentSlider.value));
      this.drawFPSDemo();
      this.updateFPSMetrics(0, 0, 0);
    });

    // Canvas click for query
    this.fpsCanvas.addEventListener('click', (e) => {
      const rect = this.fpsCanvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.fpsCanvas.width / rect.width);
      const y = (e.clientY - rect.top) * (this.fpsCanvas.height / rect.height);
      this.queryAtPoint(x, y);
    });
  }

  generateFPSAgents(count) {
    this.fpsAgents = [];
    for (let i = 0; i < count; i++) {
      this.fpsAgents.push({
        x: 50 + Math.random() * 400,
        y: 50 + Math.random() * 400,
        color: 'oklch(0.72 0.19 145)',
        visible: false
      });
    }
  }

  queryAtPoint(queryX, queryY) {
    const startTime = performance.now();
    let neighborsFound = 0;
    let totalMessages = 0;

    // FPS: Only query nearby agents
    for (const agent of this.fpsAgents) {
      const distance = Math.sqrt(
        Math.pow(agent.x - queryX, 2) + Math.pow(agent.y - queryY, 2)
      );

      agent.visible = distance <= this.fpsQueryRadius;
      if (agent.visible) {
        neighborsFound++;
        totalMessages++; // One message per neighbor
      }
    }

    const endTime = performance.now();
    const duration = (endTime - startTime).toFixed(2);

    this.updateFPSMetrics(totalMessages, duration, neighborsFound);
    this.drawFPSDemo(queryX, queryY);
  }

  runSpatialQuery() {
    // Query from a random agent
    const randomAgent = this.fpsAgents[Math.floor(Math.random() * this.fpsAgents.length)];
    this.queryAtPoint(randomAgent.x, randomAgent.y);
  }

  drawFPSDemo(queryX = null, queryY = null) {
    const ctx = this.fpsCtx;
    ctx.clearRect(0, 0, this.fpsCanvas.width, this.fpsCanvas.height);

    // Draw background grid
    this.drawGrid(ctx, this.fpsCanvas.width, this.fpsCanvas.height);

    // Draw query radius if active
    if (queryX !== null && queryY !== null) {
      ctx.beginPath();
      ctx.arc(queryX, queryY, this.fpsQueryRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'oklch(0.72 0.19 145 / 0.1)';
      ctx.fill();
      ctx.strokeStyle = 'oklch(0.72 0.19 145 / 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Query point
      ctx.beginPath();
      ctx.arc(queryX, queryY, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'oklch(0.72 0.19 145)';
      ctx.fill();
    }

    // Draw agents
    for (const agent of this.fpsAgents) {
      const color = agent.visible ? 'oklch(0.80 0.15 160)' : agent.color;
      const size = agent.visible ? 10 : 8;
      this.drawAgent(ctx, agent.x, agent.y, color, size);

      // Draw connections to visible agents
      if (agent.visible && queryX !== null && queryY !== null) {
        ctx.beginPath();
        ctx.moveTo(queryX, queryY);
        ctx.lineTo(agent.x, agent.y);
        ctx.strokeStyle = 'oklch(0.72 0.19 145 / 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  updateFPSMetrics(messages, time, updates) {
    document.getElementById('fps-messages').textContent = messages;
    document.getElementById('fps-time').textContent = time + 'ms';
    document.getElementById('fps-updates').textContent = updates;
  }

  // ==================== COMPARISON CHART ====================

  setupComparisonChart() {
    this.drawComparisonChart();
  }

  drawComparisonChart() {
    const ctx = this.comparisonCtx;
    const width = this.comparisonCanvas.width;
    const height = this.comparisonCanvas.height;

    ctx.clearRect(0, 0, width, height);

    // Data points
    const dataPoints = [10, 20, 30, 40, 50];
    const rtsData = dataPoints.map(n => n * (n - 1)); // O(n²)
    const fpsData = dataPoints.map(n => Math.log2(n) * 5); // O(log n)

    // Scales
    const maxValue = Math.max(...rtsData, ...fpsData);
    const xScale = (width - 100) / (dataPoints.length - 1);
    const yScale = (height - 60) / maxValue;

    // Draw grid
    ctx.strokeStyle = 'oklch(0.25 0.02 145 / 0.3)';
    ctx.lineWidth = 1;

    for (let i = 0; i < 5; i++) {
      const y = 30 + (i * (height - 60) / 4);
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(width - 50, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = 'oklch(0.25 0.02 145)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 30);
    ctx.lineTo(50, height - 30);
    ctx.lineTo(width - 50, height - 30);
    ctx.stroke();

    // Draw RTS line (red)
    ctx.strokeStyle = 'oklch(0.55 0.22 27)';
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let i = 0; i < rtsData.length; i++) {
      const x = 50 + i * xScale;
      const y = height - 30 - rtsData[i] * yScale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();

    // Draw FPS line (teal)
    ctx.strokeStyle = 'oklch(0.72 0.19 145)';
    ctx.beginPath();

    for (let i = 0; i < fpsData.length; i++) {
      const x = 50 + i * xScale;
      const y = height - 30 - fpsData[i] * yScale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();

    // Draw data points
    for (let i = 0; i < dataPoints.length; i++) {
      const x = 50 + i * xScale;

      // RTS points
      const rtsY = height - 30 - rtsData[i] * yScale;
      ctx.beginPath();
      ctx.arc(x, rtsY, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'oklch(0.55 0.22 27)';
      ctx.fill();

      // FPS points
      const fpsY = height - 30 - fpsData[i] * yScale;
      ctx.beginPath();
      ctx.arc(x, fpsY, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'oklch(0.72 0.19 145)';
      ctx.fill();

      // X-axis labels
      ctx.fillStyle = 'oklch(0.65 0.02 145)';
      ctx.font = '12px Geist Mono';
      ctx.textAlign = 'center';
      ctx.fillText(dataPoints[i].toString(), x, height - 10);
    }

    // Y-axis label
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Operations', 0, 0);
    ctx.restore();

    // X-axis label
    ctx.textAlign = 'center';
    ctx.fillText('Number of Agents', width / 2, height - 5);
  }

  // ==================== UTILITY METHODS ====================

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
    // Glow effect
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
  new FPSvsRTSDemo();
});

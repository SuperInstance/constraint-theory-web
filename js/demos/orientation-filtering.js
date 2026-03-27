/**
 * Agent Perspective & Orientation Filtering Demo
 * Demonstrates how agents see the world based on position and orientation
 */

class Agent {
  constructor(x, y, orientation, color) {
    this.x = x;
    this.y = y;
    this.orientation = orientation; // In radians
    this.fieldOfView = Math.PI / 2; // 90 degrees
    this.viewDistance = 150;
    this.color = color;
  }

  canSee(target) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.viewDistance) return false;

    const angleToTarget = Math.atan2(dy, dx);
    let angleDiff = Math.abs(angleToTarget - this.orientation);

    // Normalize angle difference
    while (angleDiff > Math.PI) {
      angleDiff = 2 * Math.PI - angleDiff;
    }

    return angleDiff <= this.fieldOfView / 2;
  }
}

class OrientationFilteringDemo {
  constructor() {
    this.canvas = document.getElementById('perspective-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.agentViewCanvas = document.getElementById('agent-view-canvas');
    this.agentViewCtx = this.agentViewCanvas.getContext('2d');

    this.multiAgentCanvas = document.getElementById('multi-agent-canvas');
    this.multiAgentCtx = this.multiAgentCanvas.getContext('2d');

    // Main agent
    this.playerAgent = new Agent(400, 300, 0, 'oklch(0.72 0.19 145)');

    // Other agents
    this.agents = [];
    this.generateAgents(30);

    // Multi-agent scenario
    this.scenarioAgents = [
      new Agent(200, 200, Math.PI / 4, 'oklch(0.65 0.18 230)'),
      new Agent(500, 200, -Math.PI / 4, 'oklch(0.72 0.19 145)'),
      new Agent(350, 350, Math.PI, 'oklch(0.68 0.18 280)')
    ];

    this.showAgentView = true;

    this.init();
  }

  init() {
    this.setupControls();
    this.animate();
  }

  setupControls() {
    const posXSlider = document.getElementById('pos-x-slider');
    const posYSlider = document.getElementById('pos-y-slider');
    const orientationSlider = document.getElementById('orientation-slider');
    const fovSlider = document.getElementById('fov-slider');
    const distanceSlider = document.getElementById('distance-slider');
    const randomizeBtn = document.getElementById('randomize-btn');
    const toggleViewBtn = document.getElementById('toggle-view-btn');
    const resetBtn = document.getElementById('reset-btn');

    posXSlider.addEventListener('input', (e) => {
      this.playerAgent.x = parseInt(e.target.value);
      document.getElementById('pos-x').textContent = this.playerAgent.x;
    });

    posYSlider.addEventListener('input', (e) => {
      this.playerAgent.y = parseInt(e.target.value);
      document.getElementById('pos-y').textContent = this.playerAgent.y;
    });

    orientationSlider.addEventListener('input', (e) => {
      this.playerAgent.orientation = (parseInt(e.target.value) * Math.PI) / 180;
      document.getElementById('orientation').textContent = e.target.value;
    });

    fovSlider.addEventListener('input', (e) => {
      this.playerAgent.fieldOfView = (parseInt(e.target.value) * Math.PI) / 180;
      document.getElementById('fov').textContent = e.target.value;
    });

    distanceSlider.addEventListener('input', (e) => {
      this.playerAgent.viewDistance = parseInt(e.target.value);
      document.getElementById('view-distance').textContent = e.target.value;
    });

    randomizeBtn.addEventListener('click', () => {
      this.playerAgent.x = 100 + Math.random() * 500;
      this.playerAgent.y = 100 + Math.random() * 400;
      this.playerAgent.orientation = Math.random() * Math.PI * 2;

      posXSlider.value = this.playerAgent.x;
      posYSlider.value = this.playerAgent.y;
      orientationSlider.value = Math.round((this.playerAgent.orientation * 180) / Math.PI);

      document.getElementById('pos-x').textContent = Math.round(this.playerAgent.x);
      document.getElementById('pos-y').textContent = Math.round(this.playerAgent.y);
      document.getElementById('orientation').textContent = Math.round(
        (this.playerAgent.orientation * 180) / Math.PI
      );
    });

    toggleViewBtn.addEventListener('click', () => {
      this.showAgentView = !this.showAgentView;
    });

    resetBtn.addEventListener('click', () => {
      this.playerAgent = new Agent(400, 300, 0, 'oklch(0.72 0.19 145)');
      posXSlider.value = 400;
      posYSlider.value = 300;
      orientationSlider.value = 0;

      document.getElementById('pos-x').textContent = 400;
      document.getElementById('pos-y').textContent = 300;
      document.getElementById('orientation').textContent = 0;
    });
  }

  generateAgents(count) {
    this.agents = [];
    for (let i = 0; i < count; i++) {
      const x = 50 + Math.random() * 600;
      const y = 50 + Math.random() * 500;
      const orientation = Math.random() * Math.PI * 2;
      const color = `oklch(${0.6 + Math.random() * 0.2} 0.2 ${Math.random() * 360})`;

      this.agents.push(new Agent(x, y, orientation, color));
    }
  }

  animate() {
    this.update();
    this.draw();
    this.drawAgentView();
    this.drawMultiAgentScenario();
    requestAnimationFrame(() => this.animate());
  }

  update() {
    // Update visible agents count
    const visibleAgents = this.agents.filter(agent => this.playerAgent.canSee(agent));
    const reduction = Math.round(
      ((this.agents.length - visibleAgents.length) / this.agents.length) * 100
    );

    document.getElementById('visible-agents').textContent = visibleAgents.length;
    document.getElementById('total-agents').textContent = this.agents.length;
    document.getElementById('info-reduction').textContent = reduction + '%';
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background grid
    this.drawGrid(ctx, this.canvas.width, this.canvas.height);

    // Draw field of view
    this.drawFieldOfView(ctx);

    // Draw all agents
    for (const agent of this.agents) {
      const isVisible = this.playerAgent.canSee(agent);
      const color = isVisible ? agent.color : 'oklch(0.3 0.01 145)';
      const size = isVisible ? 8 : 5;

      this.drawAgent(ctx, agent.x, agent.y, color, size, agent.orientation);

      // Draw orientation indicator for visible agents
      if (isVisible) {
        this.drawOrientationIndicator(ctx, agent.x, agent.y, agent.orientation, color);
      }
    }

    // Draw player agent
    this.drawPlayerAgent(ctx);
  }

  drawFieldOfView(ctx) {
    const { x, y, orientation, fieldOfView, viewDistance } = this.playerAgent;

    // Draw view distance circle
    ctx.beginPath();
    ctx.arc(x, y, viewDistance, 0, Math.PI * 2);
    ctx.strokeStyle = 'oklch(0.72 0.19 145 / 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw field of view cone
    const startAngle = orientation - fieldOfView / 2;
    const endAngle = orientation + fieldOfView / 2;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, viewDistance, startAngle, endAngle);
    ctx.closePath();

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, viewDistance);
    gradient.addColorStop(0, 'oklch(0.72 0.19 145 / 0.3)');
    gradient.addColorStop(1, 'oklch(0.72 0.19 145 / 0.05)');

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = 'oklch(0.72 0.19 145 / 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  drawPlayerAgent(ctx) {
    const { x, y, orientation, color } = this.playerAgent;

    // Glow effect
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
    gradient.addColorStop(0, color.replace(')', ' / 0.5)'));
    gradient.addColorStop(1, color.replace(')', ' / 0)'));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    // Agent body
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'oklch(0.98 0.005 145)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Orientation indicator
    this.drawOrientationIndicator(ctx, x, y, orientation, 'oklch(0.98 0.005 145)');

    // Label
    ctx.fillStyle = 'oklch(0.98 0.005 145)';
    ctx.font = 'bold 12px Geist';
    ctx.textAlign = 'center';
    ctx.fillText('YOU', x, y - 20);
  }

  drawAgent(ctx, x, y, color, size, orientation) {
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

  drawOrientationIndicator(ctx, x, y, orientation, color) {
    const length = 20;
    const endX = x + Math.cos(orientation) * length;
    const endY = y + Math.sin(orientation) * length;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Arrow head
    const arrowSize = 5;
    const angle1 = orientation + Math.PI * 0.85;
    const angle2 = orientation - Math.PI * 0.85;

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX + Math.cos(angle1) * arrowSize,
      endY + Math.sin(angle1) * arrowSize
    );
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX + Math.cos(angle2) * arrowSize,
      endY + Math.sin(angle2) * arrowSize
    );
    ctx.stroke();
  }

  drawAgentView() {
    const ctx = this.agentViewCtx;
    const width = this.agentViewCanvas.width;
    const height = this.agentViewCanvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = 'oklch(0.06 0.01 145)';
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = 'oklch(0.98 0.005 145)';
    ctx.font = '12px Geist';
    ctx.textAlign = 'center';
    ctx.fillText("Agent's First-Person View", width / 2, 15);

    if (!this.showAgentView) {
      ctx.fillStyle = 'oklch(0.65 0.02 145)';
      ctx.font = '14px Geist';
      ctx.fillText('(Hidden)', width / 2, height / 2);
      return;
    }

    // Get visible agents
    const visibleAgents = this.agents.filter(agent => this.playerAgent.canSee(agent));

    // Draw visible agents in first-person view
    const centerX = width / 2;
    const centerY = height / 2;

    for (const agent of visibleAgents) {
      const dx = agent.x - this.playerAgent.x;
      const dy = agent.y - this.playerAgent.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) - this.playerAgent.orientation;

      // Project to screen
      const screenX = centerX + Math.sin(angle) * (distance * 0.5);
      const screenY = centerY - Math.cos(angle) * (distance * 0.3);
      const size = Math.max(3, 20 - distance * 0.1);

      // Draw agent
      ctx.beginPath();
      ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
      ctx.fillStyle = agent.color;
      ctx.fill();

      // Distance indicator
      ctx.fillStyle = 'oklch(0.65 0.02 145)';
      ctx.font = '10px Geist Mono';
      ctx.textAlign = 'center';
      ctx.fillText(Math.round(distance) + 'm', screenX, screenY + size + 10);
    }

    // Crosshair
    ctx.strokeStyle = 'oklch(0.72 0.19 145 / 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - 10, centerY);
    ctx.lineTo(centerX + 10, centerY);
    ctx.moveTo(centerX, centerY - 10);
    ctx.lineTo(centerX, centerY + 10);
    ctx.stroke();
  }

  drawMultiAgentScenario() {
    const ctx = this.multiAgentCtx;
    const width = this.multiAgentCanvas.width;
    const height = this.multiAgentCanvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = 'oklch(0.06 0.01 145)';
    ctx.fillRect(0, 0, width, height);

    // Draw all agents
    for (const agent of this.scenarioAgents) {
      // Draw field of view
      this.drawScenarioFieldOfView(ctx, agent);

      // Draw agent
      this.drawScenarioAgent(ctx, agent);
    }

    // Update perspective info
    this.updatePerspectiveInfo();
  }

  drawScenarioFieldOfView(ctx, agent) {
    const { x, y, orientation, fieldOfView, viewDistance } = agent;

    const startAngle = orientation - fieldOfView / 2;
    const endAngle = orientation + fieldOfView / 2;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, viewDistance, startAngle, endAngle);
    ctx.closePath();

    ctx.fillStyle = agent.color.replace(')', ' / 0.1)');
    ctx.fill();
    ctx.strokeStyle = agent.color.replace(')', ' / 0.3)');
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawScenarioAgent(ctx, agent) {
    const { x, y, orientation, color } = agent;

    // Agent body
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'oklch(0.98 0.005 145)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Orientation indicator
    const length = 15;
    const endX = x + Math.cos(orientation) * length;
    const endY = y + Math.sin(orientation) * length;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = 'oklch(0.98 0.005 145)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  updatePerspectiveInfo() {
    const agent1 = this.scenarioAgents[0];
    const agent2 = this.scenarioAgents[1];
    const agent3 = this.scenarioAgents[2];

    // What each agent sees
    const agent1Sees = this.scenarioAgents.filter((a, i) => i !== 0 && agent1.canSee(a));
    const agent2Sees = this.scenarioAgents.filter((a, i) => i !== 1 && agent2.canSee(a));
    const agent3Sees = this.scenarioAgents.filter((a, i) => i !== 2 && agent3.canSee(a));

    document.getElementById('agent1-sees').textContent =
      agent1Sees.length > 0 ? `Agent ${agent1Sees.map(a => this.scenarioAgents.indexOf(a) + 1).join(', ')}` : 'None';

    document.getElementById('agent2-sees').textContent =
      agent2Sees.length > 0 ? `Agent ${agent2Sees.map(a => this.scenarioAgents.indexOf(a) + 1).join(', ')}` : 'None';

    document.getElementById('agent3-sees').textContent =
      agent3Sees.length > 0 ? `Agent ${agent3Sees.map(a => this.scenarioAgents.indexOf(a) + 1).join(', ')}` : 'None';
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
}

// Initialize demo when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OrientationFilteringDemo();
});

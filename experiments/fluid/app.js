/**
 * SPH (Smoothed Particle Hydrodynamics) Fluid Simulator
 * Constraint Theory Research Project
 *
 * This simulator demonstrates fluid dynamics using particle-based simulation
 * with constraint-based density/pressure calculations.
 */

// ========== CONFIGURATION ==========
const CONFIG = {
    // Simulation parameters
    particleCount: 300,
    smoothingRadius: 16,  // h: kernel support radius
    restDensity: 1000,     // ρ₀: target density
    pressureStiffness: 2000, // k: pressure constant
    viscosity: 2500,       // μ: viscosity coefficient
    gravity: 980,          // g: gravitational acceleration
    timeStep: 0.008,       // dt: integration timestep

    // Particle properties
    particleMass: 0.025,   // m: mass of each particle
    particleRadius: 3,     // rendering radius

    // Boundary
    damping: 0.5,          // velocity damping at boundaries
    boundaryMargin: 20,

    // Visualization
    visualizationMode: 'velocity', // velocity, pressure, density
    showVectors: false,
    showField: false,

    // Mouse interaction
    mouseMode: 'push',     // push, add, obstacle
    mouseRadius: 50,
    mouseForce: 5000,

    // Boundaries
    wallsEnabled: true,
    floorEnabled: true,
    obstaclesEnabled: true
};

// ========== SPH KERNEL FUNCTIONS ==========

/**
 * Poly6 Kernel - Used for density estimation
 * W(r, h) = (315 / (64 * π * h^9)) * (h^2 - r^2)^3
 */
function poly6Kernel(r2, h) {
    if (r2 >= h * h) return 0;
    const h2 = h * h;
    const coeff = 315 / (64 * Math.PI * Math.pow(h, 9));
    return coeff * Math.pow(h2 - r2, 3);
}

/**
 * Gradient of Poly6 Kernel - Used for pressure force calculation
 * ∇W(r, h) = -(45 / (π * h^6)) * (h - r)^2 * (r / |r|)
 */
function poly6Gradient(r, h) {
    if (r >= h) return { x: 0, y: 0 };
    const coeff = -45 / (Math.PI * Math.pow(h, 6));
    const factor = Math.pow(h - r, 2) / r;
    return { coeff, factor };
}

/**
 * Spiky Kernel Gradient - Used for pressure force (more stable)
 * ∇W(r, h) = -(45 / (π * h^6)) * (h - r)^2 * (r / |r|)
 */
function spikyGradient(r, h) {
    if (r >= h || r === 0) return { x: 0, y: 0 };
    const coeff = -45 / (Math.PI * Math.pow(h, 6));
    const factor = Math.pow(h - r, 2);
    return { coeff, factor };
}

/**
 * Viscosity Kernel Laplacian - Used for viscosity force
 * ∇²W(r, h) = (45 / (π * h^6)) * (h - r)
 */
function viscosityLaplacian(r, h) {
    if (r >= h) return 0;
    return (45 / (Math.PI * Math.pow(h, 6))) * (h - r);
}

// ========== PARTICLE CLASS ==========

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.fx = 0;
        this.fy = 0;
        this.density = 0;
        this.pressure = 0;
        this.neighbors = [];
    }

    resetForces() {
        this.fx = 0;
        this.fy = 0;
    }

    applyForce(fx, fy) {
        this.fx += fx;
        this.fy += fy;
    }

    integrate(dt) {
        // Velocity Verlet integration
        const ax = this.fx / CONFIG.particleMass;
        const ay = this.fy / CONFIG.particleMass;

        this.vx += ax * dt;
        this.vy += ay * dt;

        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }
}

// ========== SPH SIMULATOR CLASS ==========

class SPHSimulator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.obstacles = [];
        this.spatialHash = {};
        this.cellSize = CONFIG.smoothingRadius;
        this.isPaused = false;
        this.lastFrameTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.fpsUpdateTime = 0;

        this.mouse = { x: 0, y: 0, isPressed: false, button: 0 };

        this.setupCanvas();
        this.setupEventListeners();
        this.initParticles();
        this.addDefaultObstacles();
        this.animate();
    }

    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.isPressed = true;
            this.mouse.button = e.button;
            this.handleMouseInteraction(e);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            if (this.mouse.isPressed) {
                this.handleMouseInteraction(e);
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.mouse.isPressed = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.mouse.isPressed = false;
        });

        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    handleMouseInteraction(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (CONFIG.mouseMode === 'push' || (e.shiftKey && e.button === 0)) {
            this.pushFluid(mouseX, mouseY);
        } else if (CONFIG.mouseMode === 'add' || e.button === 2) {
            this.addFluid(mouseX, mouseY);
        } else if (CONFIG.mouseMode === 'obstacle') {
            if (e.type === 'mousedown') {
                this.addObstacle(mouseX, mouseY);
            }
        }
    }

    pushFluid(mouseX, mouseY) {
        const radius = CONFIG.mouseRadius;
        const force = CONFIG.mouseForce;

        for (const particle of this.particles) {
            const dx = particle.x - mouseX;
            const dy = particle.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < radius && dist > 0) {
                const forceMagnitude = force * (1 - dist / radius);
                particle.applyForce(
                    (dx / dist) * forceMagnitude,
                    (dy / dist) * forceMagnitude
                );
            }
        }
    }

    addFluid(mouseX, mouseY) {
        const spacing = CONFIG.smoothingRadius * 0.5;
        const particlesToAdd = 5;

        for (let i = 0; i < particlesToAdd; i++) {
            const offsetX = (Math.random() - 0.5) * spacing * 2;
            const offsetY = (Math.random() - 0.5) * spacing * 2;

            const x = mouseX + offsetX;
            const y = mouseY + offsetY;

            if (x > CONFIG.boundaryMargin && x < this.canvas.width - CONFIG.boundaryMargin &&
                y > CONFIG.boundaryMargin && y < this.canvas.height - CONFIG.boundaryMargin) {
                const particle = new Particle(x, y);
                this.particles.push(particle);
            }
        }

        this.updateParticleCount();
    }

    addObstacle(x, y) {
        const radius = 30;
        this.obstacles.push({ x, y, radius });
    }

    addDefaultObstacles() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Add a central obstacle
        this.obstacles.push({ x: centerX, y: centerY + 100, radius: 40 });
    }

    clearObstacles() {
        this.obstacles = [];
    }

    // ========== SPATIAL HASHING ==========

    updateSpatialHash() {
        this.spatialHash = {};
        this.cellSize = CONFIG.smoothingRadius;

        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            const cellX = Math.floor(particle.x / this.cellSize);
            const cellY = Math.floor(particle.y / this.cellSize);
            const key = `${cellX},${cellY}`;

            if (!this.spatialHash[key]) {
                this.spatialHash[key] = [];
            }
            this.spatialHash[key].push(i);
        }
    }

    getNeighbors(particle) {
        const neighbors = [];
        const cellX = Math.floor(particle.x / this.cellSize);
        const cellY = Math.floor(particle.y / this.cellSize);

        // Check 3x3 grid of cells
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = `${cellX + dx},${cellY + dy}`;
                const cell = this.spatialHash[key];

                if (cell) {
                    for (const idx of cell) {
                        const neighbor = this.particles[idx];
                        if (neighbor !== particle) {
                            const distSq = (particle.x - neighbor.x) ** 2 +
                                         (particle.y - neighbor.y) ** 2;
                            if (distSq < CONFIG.smoothingRadius ** 2) {
                                neighbors.push(neighbor);
                            }
                        }
                    }
                }
            }
        }

        return neighbors;
    }

    // ========== DENSITY COMPUTATION ==========

    computeDensityPressure() {
        const h = CONFIG.smoothingRadius;
        const h2 = h * h;

        for (const particle of this.particles) {
            let density = 0;

            // Self-contribution
            density += CONFIG.particleMass * poly6Kernel(0, h);

            // Neighbor contributions
            for (const neighbor of particle.neighbors) {
                const dx = neighbor.x - particle.x;
                const dy = neighbor.y - particle.y;
                const r2 = dx * dx + dy * dy;
                density += CONFIG.particleMass * poly6Kernel(r2, h);
            }

            particle.density = density;

            // Compute pressure using Tait's equation of state
            // p = k * (ρ - ρ₀)
            particle.pressure = CONFIG.pressureStiffness * (density - CONFIG.restDensity);
        }
    }

    // ========== FORCE COMPUTATION ==========

    computeForces() {
        const h = CONFIG.smoothingRadius;

        for (const particle of this.particles) {
            particle.resetForces();

            // Gravity
            particle.applyForce(0, CONFIG.particleMass * CONFIG.gravity);

            // Pressure and viscosity forces
            for (const neighbor of particle.neighbors) {
                const dx = neighbor.x - particle.x;
                const dy = neighbor.y - particle.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > 0 && dist < h) {
                    // Pressure force (symmetric)
                    // F_pressure = -m * (pi/ρi² + pj/ρj²) * ∇W
                    const pressureCoeff = -CONFIG.particleMass *
                        (particle.pressure / (particle.density * particle.density) +
                         neighbor.pressure / (neighbor.density * neighbor.density));

                    const spiky = spikyGradient(dist, h);
                    const pressureForceX = pressureCoeff * spiky.coeff * spiky.factor * (dx / dist);
                    const pressureForceY = pressureCoeff * spiky.coeff * spiky.factor * (dy / dist);

                    particle.applyForce(pressureForceX, pressureForceY);

                    // Viscosity force
                    // F_viscosity = μ * m * (vj - vi) / ρj * ∇²W
                    const viscLaplacian = viscosityLaplacian(dist, h);
                    const viscCoeff = CONFIG.viscosity * CONFIG.particleMass /
                        neighbor.density * viscLaplacian;

                    const viscForceX = viscCoeff * (neighbor.vx - particle.vx);
                    const viscForceY = viscCoeff * (neighbor.vy - particle.vy);

                    particle.applyForce(viscForceX, viscForceY);
                }
            }
        }
    }

    // ========== INTEGRATION ==========

    integrate() {
        for (const particle of this.particles) {
            particle.integrate(CONFIG.timeStep);
        }

        this.enforceBoundaries();
    }

    enforceBoundaries() {
        const margin = CONFIG.boundaryMargin;
        const damping = CONFIG.damping;

        for (const particle of this.particles) {
            // Floor
            if (CONFIG.floorEnabled) {
                if (particle.y > this.canvas.height - margin) {
                    particle.y = this.canvas.height - margin;
                    particle.vy *= -damping;
                }
            }

            // Walls
            if (CONFIG.wallsEnabled) {
                if (particle.x < margin) {
                    particle.x = margin;
                    particle.vx *= -damping;
                }
                if (particle.x > this.canvas.width - margin) {
                    particle.x = this.canvas.width - margin;
                    particle.vx *= -damping;
                }
                if (particle.y < margin) {
                    particle.y = margin;
                    particle.vy *= -damping;
                }
            }

            // Obstacles
            if (CONFIG.obstaclesEnabled) {
                for (const obstacle of this.obstacles) {
                    const dx = particle.x - obstacle.x;
                    const dy = particle.y - obstacle.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < obstacle.radius + CONFIG.particleRadius) {
                        const overlap = obstacle.radius + CONFIG.particleRadius - dist;
                        const nx = dx / dist;
                        const ny = dy / dist;

                        particle.x += nx * overlap;
                        particle.y += ny * overlap;

                        // Reflect velocity
                        const dotProduct = particle.vx * nx + particle.vy * ny;
                        particle.vx -= 2 * dotProduct * nx * damping;
                        particle.vy -= 2 * dotProduct * ny * damping;
                    }
                }
            }
        }
    }

    // ========== SIMULATION STEP ==========

    step() {
        // Update spatial hash
        this.updateSpatialHash();

        // Find neighbors
        for (const particle of this.particles) {
            particle.neighbors = this.getNeighbors(particle);
        }

        // Compute density and pressure
        this.computeDensityPressure();

        // Compute forces
        this.computeForces();

        // Integrate
        this.integrate();
    }

    // ========== INITIALIZATION ==========

    initParticles() {
        this.particles = [];
        const spacing = CONFIG.smoothingRadius * 0.7;

        for (let i = 0; i < CONFIG.particleCount; i++) {
            const row = Math.floor(i / Math.sqrt(CONFIG.particleCount));
            const col = i % Math.sqrt(CONFIG.particleCount);

            const x = 100 + col * spacing;
            const y = 100 + row * spacing;

            this.particles.push(new Particle(x, y));
        }

        this.updateParticleCount();
    }

    // ========== PRESETS ==========

    loadPreset(preset) {
        this.particles = [];
        const spacing = CONFIG.smoothingRadius * 0.7;

        switch (preset) {
            case 'damBreak':
                this.loadDamBreak(spacing);
                break;
            case 'dropSplash':
                this.loadDropSplash(spacing);
                break;
            case 'doubleDam':
                this.loadDoubleDam(spacing);
                break;
            case 'viscous':
                this.loadViscous(spacing);
                break;
            case 'gas':
                this.loadGas(spacing);
                break;
            case 'fountain':
                this.loadFountain(spacing);
                break;
        }

        this.updateParticleCount();
    }

    loadDamBreak(spacing) {
        const cols = 15;
        const rows = 15;
        const startX = 100;
        const startY = 100;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const x = startX + j * spacing;
                const y = startY + i * spacing;
                this.particles.push(new Particle(x, y));
            }
        }
    }

    loadDropSplash(spacing) {
        const centerX = this.canvas.width / 2;
        const centerY = 200;
        const radius = 80;

        for (let i = 0; i < 200; i++) {
            const angle = (i / 200) * Math.PI * 2;
            const r = Math.sqrt(i / 200) * radius;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            this.particles.push(new Particle(x, y));
        }
    }

    loadDoubleDam(spacing) {
        const cols = 10;
        const rows = 15;

        // Left dam
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const x = 100 + j * spacing;
                const y = 100 + i * spacing;
                this.particles.push(new Particle(x, y));
            }
        }

        // Right dam
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const x = this.canvas.width - 100 - (cols - j) * spacing;
                const y = 100 + i * spacing;
                this.particles.push(new Particle(x, y));
            }
        }
    }

    loadViscous(spacing) {
        CONFIG.viscosity = 8000;
        CONFIG.pressureStiffness = 1500;
        this.loadDamBreak(spacing);
    }

    loadGas(spacing) {
        CONFIG.viscosity = 100;
        CONFIG.pressureStiffness = 5000;
        CONFIG.gravity = 200;

        const cols = 20;
        const rows = 15;
        const startX = 150;
        const startY = 150;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const x = startX + j * spacing;
                const y = startY + i * spacing;
                const particle = new Particle(x, y);
                particle.vx = (Math.random() - 0.5) * 100;
                particle.vy = (Math.random() - 0.5) * 100;
                this.particles.push(particle);
            }
        }
    }

    loadFountain(spacing) {
        const centerX = this.canvas.width / 2;
        const bottomY = this.canvas.height - 100;

        for (let i = 0; i < 150; i++) {
            const x = centerX + (Math.random() - 0.5) * 50;
            const y = bottomY + (Math.random() - 0.5) * 50;
            const particle = new Particle(x, y);
            particle.vy = -300 - Math.random() * 200;
            particle.vx = (Math.random() - 0.5) * 100;
            this.particles.push(particle);
        }
    }

    // ========== RENDERING ==========

    getColor(particle) {
        let value, minVal, maxVal;

        switch (CONFIG.visualizationMode) {
            case 'velocity':
                value = Math.sqrt(particle.vx ** 2 + particle.vy ** 2);
                minVal = 0;
                maxVal = 300;
                break;
            case 'pressure':
                value = particle.pressure;
                minVal = -CONFIG.pressureStiffness;
                maxVal = CONFIG.pressureStiffness;
                break;
            case 'density':
                value = particle.density;
                minVal = CONFIG.restDensity * 0.5;
                maxVal = CONFIG.restDensity * 1.5;
                break;
        }

        // Normalize value to 0-1
        const t = Math.max(0, Math.min(1, (value - minVal) / (maxVal - minVal)));

        // Color gradient: blue -> cyan -> green -> yellow -> red
        if (t < 0.25) {
            return `rgb(${0}, ${Math.floor(255 * t / 0.25)}, ${255})`;
        } else if (t < 0.5) {
            return `rgb(${0}, ${255}, ${Math.floor(255 * (1 - (t - 0.25) / 0.25))})`;
        } else if (t < 0.75) {
            return `rgb(${Math.floor(255 * (t - 0.5) / 0.25)}, ${255}, ${0})`;
        } else {
            return `rgb(${255}, ${Math.floor(255 * (1 - (t - 0.75) / 0.25))}, ${0})`;
        }
    }

    drawField() {
        if (!CONFIG.showField) return;

        const cellSize = 20;
        const cols = Math.ceil(this.canvas.width / cellSize);
        const rows = Math.ceil(this.canvas.height / cellSize);

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = i * cellSize + cellSize / 2;
                const y = j * cellSize + cellSize / 2;

                let totalValue = 0;
                let count = 0;

                for (const particle of this.particles) {
                    const dx = particle.x - x;
                    const dy = particle.y - y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < CONFIG.smoothingRadius * 2) {
                        let value;
                        switch (CONFIG.visualizationMode) {
                            case 'velocity':
                                value = Math.sqrt(particle.vx ** 2 + particle.vy ** 2);
                                break;
                            case 'pressure':
                                value = particle.pressure;
                                break;
                            case 'density':
                                value = particle.density;
                                break;
                        }
                        totalValue += value;
                        count++;
                    }
                }

                if (count > 0) {
                    const avgValue = totalValue / count;
                    const alpha = Math.min(0.3, count / 10);

                    let minVal, maxVal;
                    switch (CONFIG.visualizationMode) {
                        case 'velocity':
                            minVal = 0; maxVal = 300;
                            break;
                        case 'pressure':
                            minVal = -CONFIG.pressureStiffness; maxVal = CONFIG.pressureStiffness;
                            break;
                        case 'density':
                            minVal = CONFIG.restDensity * 0.5; maxVal = CONFIG.restDensity * 1.5;
                            break;
                    }

                    const t = Math.max(0, Math.min(1, (avgValue - minVal) / (maxVal - minVal)));
                    const r = Math.floor(255 * t);
                    const b = Math.floor(255 * (1 - t));

                    this.ctx.fillStyle = `rgba(${r}, 0, ${b}, ${alpha})`;
                    this.ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
                }
            }
        }
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0e1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw field background
        this.drawField();

        // Draw obstacles
        if (CONFIG.obstaclesEnabled) {
            for (const obstacle of this.obstacles) {
                const gradient = this.ctx.createRadialGradient(
                    obstacle.x, obstacle.y, 0,
                    obstacle.x, obstacle.y, obstacle.radius
                );
                gradient.addColorStop(0, 'rgba(249, 115, 22, 0.8)');
                gradient.addColorStop(1, 'rgba(249, 115, 22, 0.2)');

                this.ctx.beginPath();
                this.ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = gradient;
                this.ctx.fill();

                this.ctx.strokeStyle = 'rgba(249, 115, 22, 0.8)';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        }

        // Draw particles
        for (const particle of this.particles) {
            const color = this.getColor(particle);

            // Particle glow
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, CONFIG.particleRadius * 2
            );
            gradient.addColorStop(0, color);
            gradient.addColorStop(0.5, color.replace('rgb', 'rgba').replace(')', ', 0.5)'));
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, CONFIG.particleRadius * 2, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // Particle core
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, CONFIG.particleRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.fill();

            // Velocity vectors
            if (CONFIG.showVectors) {
                const speed = Math.sqrt(particle.vx ** 2 + particle.vy ** 2);
                if (speed > 10) {
                    const scale = 0.1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(
                        particle.x + particle.vx * scale,
                        particle.y + particle.vy * scale
                    );
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        }

        // Draw mouse interaction indicator
        if (this.mouse.x > 0 && this.mouse.y > 0) {
            this.ctx.beginPath();
            this.ctx.arc(this.mouse.x, this.mouse.y, CONFIG.mouseRadius, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            this.ctx.beginPath();
            this.ctx.arc(this.mouse.x, this.mouse.y, 5, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
            this.ctx.fill();
        }
    }

    // ========== ANIMATION LOOP ==========

    animate(currentTime = 0) {
        // FPS calculation
        this.frameCount++;
        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
            this.updateStats();
        }

        // Step simulation
        if (!this.isPaused) {
            this.step();
        }

        // Render
        this.render();

        // Continue animation
        requestAnimationFrame((time) => this.animate(time));
    }

    // ========== STATS UPDATES ==========

    updateParticleCount() {
        CONFIG.particleCount = this.particles.length;
        document.getElementById('particleCount').textContent = this.particles.length;
        document.getElementById('particleCountValue').textContent = this.particles.length;
    }

    updateStats() {
        document.getElementById('fps').textContent = this.fps;
        document.getElementById('particleCount').textContent = this.particles.length;

        if (this.particles.length > 0) {
            const avgDensity = this.particles.reduce((sum, p) => sum + p.density, 0) / this.particles.length;
            const maxVelocity = Math.max(...this.particles.map(p =>
                Math.sqrt(p.vx ** 2 + p.vy ** 2)
            ));

            document.getElementById('avgDensity').textContent = avgDensity.toFixed(1);
            document.getElementById('maxVelocity').textContent = maxVelocity.toFixed(1);
        }
    }

    // ========== CONTROLS ==========

    togglePause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    reset() {
        this.initParticles();
        this.clearObstacles();
        this.addDefaultObstacles();
    }

    setParameter(param, value) {
        CONFIG[param] = value;
    }
}

// ========== INITIALIZATION ==========

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('fluidCanvas');
    const simulator = new SPHSimulator(canvas);

    // Parameter controls
    const paramControls = [
        { id: 'particleCount', param: 'particleCount', display: 'particleCountValue', reset: true },
        { id: 'smoothingRadius', param: 'smoothingRadius', display: 'smoothingRadiusValue' },
        { id: 'restDensity', param: 'restDensity', display: 'restDensityValue' },
        { id: 'pressureStiffness', param: 'pressureStiffness', display: 'pressureStiffnessValue' },
        { id: 'viscosity', param: 'viscosity', display: 'viscosityValue' },
        { id: 'gravity', param: 'gravity', display: 'gravityValue' },
        { id: 'timeStep', param: 'timeStep', display: 'timeStepValue' },
        { id: 'mouseRadius', param: 'mouseRadius', display: 'mouseRadiusValue' },
        { id: 'mouseForce', param: 'mouseForce', display: 'mouseForceValue' }
    ];

    paramControls.forEach(control => {
        const input = document.getElementById(control.id);
        const display = document.getElementById(control.display);

        input.addEventListener('input', () => {
            const value = parseFloat(input.value);
            display.textContent = value;
            simulator.setParameter(control.param, value);

            if (control.reset) {
                simulator.initParticles();
            }
        });
    });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            simulator.loadPreset(preset);

            // Reset parameters based on preset
            if (preset === 'viscous') {
                document.getElementById('viscosity').value = 8000;
                document.getElementById('viscosityValue').textContent = '8000';
                document.getElementById('pressureStiffness').value = 1500;
                document.getElementById('pressureStiffnessValue').textContent = '1500';
            } else if (preset === 'gas') {
                document.getElementById('viscosity').value = 100;
                document.getElementById('viscosityValue').textContent = '100';
                document.getElementById('pressureStiffness').value = 5000;
                document.getElementById('pressureStiffnessValue').textContent = '5000';
                document.getElementById('gravity').value = 200;
                document.getElementById('gravityValue').textContent = '200';
            } else {
                // Reset to defaults
                document.getElementById('viscosity').value = 2500;
                document.getElementById('viscosityValue').textContent = '2500';
                document.getElementById('pressureStiffness').value = 2000;
                document.getElementById('pressureStiffnessValue').textContent = '2000';
                document.getElementById('gravity').value = 980;
                document.getElementById('gravityValue').textContent = '980';
            }
        });
    });

    // Boundary checkboxes
    document.getElementById('wallsEnabled').addEventListener('change', (e) => {
        CONFIG.wallsEnabled = e.target.checked;
    });

    document.getElementById('floorEnabled').addEventListener('change', (e) => {
        CONFIG.floorEnabled = e.target.checked;
    });

    document.getElementById('obstaclesEnabled').addEventListener('change', (e) => {
        CONFIG.obstaclesEnabled = e.target.checked;
    });

    document.getElementById('clearObstacles').addEventListener('click', () => {
        simulator.clearObstacles();
    });

    // Visualization mode
    document.querySelectorAll('input[name="vizMode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            CONFIG.visualizationMode = e.target.value;
        });
    });

    document.getElementById('showVectors').addEventListener('change', (e) => {
        CONFIG.showVectors = e.target.checked;
    });

    document.getElementById('showField').addEventListener('change', (e) => {
        CONFIG.showField = e.target.checked;
    });

    // Mouse interaction mode
    document.querySelectorAll('input[name="mouseMode"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            CONFIG.mouseMode = e.target.value;

            // Update interaction hint
            const hint = document.getElementById('interactionHint');
            switch (e.target.value) {
                case 'push':
                    hint.textContent = 'Left click: Push fluid | Right click: Add fluid | Shift+Click: Place obstacle';
                    break;
                case 'add':
                    hint.textContent = 'Left click: Add fluid | Right click: Push fluid | Shift+Click: Place obstacle';
                    break;
                case 'obstacle':
                    hint.textContent = 'Left click: Place obstacle | Right click: Add fluid | Shift+Click: Push fluid';
                    break;
            }
        });
    });

    // Action buttons
    document.getElementById('resetBtn').addEventListener('click', () => {
        simulator.reset();
    });

    const pauseBtn = document.getElementById('pauseBtn');
    pauseBtn.addEventListener('click', () => {
        const isPaused = simulator.togglePause();
        pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
    });

    document.getElementById('stepBtn').addEventListener('click', () => {
        if (simulator.isPaused) {
            simulator.step();
        }
    });
});

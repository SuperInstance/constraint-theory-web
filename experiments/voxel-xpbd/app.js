// Voxel XPBD Physics Simulator
// Demonstrates Extended Position-Based Dynamics with constraint-based physics

class Particle {
    constructor(x, y, pinned = false) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        this.vx = 0;
        this.vy = 0;
        this.pinned = pinned;
        this.mass = 1.0;
        this.invMass = pinned ? 0 : 1.0 / this.mass;
        this.radius = 5;
        this.stress = 0;
        this.trail = [];
        this.maxTrailLength = 20;
    }

    updateTrail() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }
}

class DistanceConstraint {
    constructor(p1, p2, stiffness = 0.5) {
        this.p1 = p1;
        this.p2 = p2;
        this.restLength = Math.sqrt(
            Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
        );
        this.stiffness = stiffness;
        this.stress = 0;
        this.type = 'distance';
    }

    solve(alpha = 0.5) {
        if (this.p1.pinned && this.p2.pinned) return;

        const dx = this.p2.x - this.p1.x;
        const dy = this.p2.y - this.p1.y;
        const currentLength = Math.sqrt(dx * dx + dy * dy);

        if (currentLength < 0.0001) return;

        const correction = (currentLength - this.restLength) / currentLength;
        this.stress = Math.abs(correction);

        const totalInvMass = this.p1.invMass + this.p2.invMass;
        if (totalInvMass < 0.0001) return;

        const lambda = -correction * this.stiffness / totalInvMass;

        const offsetX = dx * lambda * this.p1.invMass;
        const offsetY = dy * lambda * this.p1.invMass;

        this.p1.x -= offsetX;
        this.p1.y -= offsetY;
        this.p2.x += offsetX;
        this.p2.y += offsetY;
    }
}

class VolumeConstraint {
    constructor(particles, stiffness = 0.3) {
        this.particles = particles;
        this.stiffness = stiffness;
        this.restVolume = this.calculateVolume();
        this.stress = 0;
        this.type = 'volume';
    }

    calculateVolume() {
        // Calculate area of polygon (2D volume)
        let area = 0;
        const n = this.particles.length;
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += this.particles[i].x * this.particles[j].y;
            area -= this.particles[j].x * this.particles[i].y;
        }
        return Math.abs(area) / 2;
    }

    getCentroid() {
        let cx = 0, cy = 0;
        const n = this.particles.length;
        for (let p of this.particles) {
            cx += p.x;
            cy += p.y;
        }
        return { x: cx / n, y: cy / n };
    }

    solve(alpha = 0.5) {
        const currentVolume = this.calculateVolume();
        const volumeRatio = this.restVolume / (currentVolume || 1);
        this.stress = Math.abs(volumeRatio - 1);

        const centroid = this.getCentroid();
        const totalInvMass = this.particles.reduce((sum, p) => sum + p.invMass, 0);
        if (totalInvMass < 0.0001) return;

        const lambda = (volumeRatio - 1) * this.stiffness / totalInvMass;

        for (let p of this.particles) {
            if (p.pinned) continue;
            const dx = p.x - centroid.x;
            const dy = p.y - centroid.y;
            p.x += dx * lambda * p.invMass;
            p.y += dy * lambda * p.invMass;
        }
    }
}

class CollisionConstraint {
    constructor(particle, floorY, stiffness = 0.8) {
        this.particle = particle;
        this.floorY = floorY;
        this.stiffness = stiffness;
        this.type = 'collision';
    }

    solve() {
        if (this.particle.y > this.floorY - this.particle.radius) {
            const penetration = this.particle.y - (this.floorY - this.particle.radius);
            this.particle.y = this.floorY - this.particle.radius;

            // Friction
            this.particle.vx *= 0.95;
            this.particle.prevY = this.particle.y;
        }
    }
}

class XPBDSimulator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.constraints = [];

        // Physics parameters
        this.gravity = 9.8;
        this.stiffness = 0.5;
        this.iterations = 10;
        this.damping = 0.99;
        this.voxelSize = 30;

        // Simulation state
        this.running = false;
        this.dt = 1 / 60;
        this.floorY = canvas.height - 50;

        // Visualization
        this.showConstraints = true;
        this.showStress = false;
        this.showTrails = false;
        this.showGrid = true;

        // Mouse interaction
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        this.mouseRadius = 50;
        this.selectedParticle = null;

        // Stats
        this.fps = 60;
        this.frameCount = 0;
        this.lastFpsUpdate = performance.now();

        this.setupCanvas();
        this.setupEventListeners();
        this.loadPreset('cube');
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.floorY = rect.height - 50;
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.onMouseUp());

        window.addEventListener('resize', () => this.setupCanvas());
    }

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        this.mouseDown = true;

        // Find nearest particle
        let nearest = null;
        let minDist = this.mouseRadius;

        for (let p of this.particles) {
            const dist = Math.sqrt(
                Math.pow(p.x - this.mouseX, 2) + Math.pow(p.y - this.mouseY, 2)
            );
            if (dist < minDist) {
                minDist = dist;
                nearest = p;
            }
        }

        this.selectedParticle = nearest;
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
    }

    onMouseUp() {
        this.mouseDown = false;
        this.selectedParticle = null;
    }

    clear() {
        this.particles = [];
        this.constraints = [];
    }

    createParticle(x, y, pinned = false) {
        const p = new Particle(x, y, pinned);
        this.particles.push(p);
        return p;
    }

    addDistanceConstraint(p1, p2, stiffness) {
        const c = new DistanceConstraint(p1, p2, stiffness);
        this.constraints.push(c);
        return c;
    }

    addVolumeConstraint(particles, stiffness) {
        const c = new VolumeConstraint(particles, stiffness);
        this.constraints.push(c);
        return c;
    }

    loadPreset(presetName) {
        this.clear();
        this.running = false;

        const centerX = this.canvas.width / window.devicePixelRatio / 2;
        const startY = 100;

        switch (presetName) {
            case 'cube':
                this.createSoftBodyCube(centerX - 60, startY, 4, 4);
                break;
            case 'rope':
                this.createRope(centerX, startY, 15);
                break;
            case 'cloth':
                this.createCloth(centerX - 100, startY, 8, 8);
                break;
            case 'stack':
                this.createStack(centerX, startY);
                break;
            case 'bridge':
                this.createBridge(centerX - 150, startY);
                break;
            case 'jelly':
                this.createJellyCube(centerX - 50, startY);
                break;
        }

        this.updateStats();
        this.render();
    }

    createSoftBodyCube(startX, startY, width, height) {
        const particles = [];
        const size = this.voxelSize;

        // Create grid of particles
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const px = startX + x * size;
                const py = startY + y * size;
                const pinned = y === 0 && (x === 0 || x === width - 1);
                particles.push(this.createParticle(px, py, pinned));
            }
        }

        // Structural constraints
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;

                // Horizontal
                if (x < width - 1) {
                    this.addDistanceConstraint(particles[idx], particles[idx + 1], this.stiffness);
                }

                // Vertical
                if (y < height - 1) {
                    this.addDistanceConstraint(particles[idx], particles[idx + width], this.stiffness);
                }

                // Diagonal (shear)
                if (x < width - 1 && y < height - 1) {
                    this.addDistanceConstraint(particles[idx], particles[idx + width + 1], this.stiffness * 0.7);
                    this.addDistanceConstraint(particles[idx + 1], particles[idx + width], this.stiffness * 0.7);
                }

                // Bending
                if (x < width - 2) {
                    this.addDistanceConstraint(particles[idx], particles[idx + 2], this.stiffness * 0.3);
                }
                if (y < height - 2) {
                    this.addDistanceConstraint(particles[idx], particles[idx + width * 2], this.stiffness * 0.3);
                }
            }
        }

        // Volume constraints for each cell
        for (let y = 0; y < height - 1; y++) {
            for (let x = 0; x < width - 1; x++) {
                const idx = y * width + x;
                const cellParticles = [
                    particles[idx],
                    particles[idx + 1],
                    particles[idx + width + 1],
                    particles[idx + width]
                ];
                this.addVolumeConstraint(cellParticles, this.stiffness * 0.5);
            }
        }
    }

    createRope(startX, startY, length) {
        const particles = [];
        const size = this.voxelSize;

        for (let i = 0; i < length; i++) {
            const px = startX;
            const py = startY + i * size;
            const pinned = i === 0;
            particles.push(this.createParticle(px, py, pinned));
        }

        for (let i = 0; i < length - 1; i++) {
            this.addDistanceConstraint(particles[i], particles[i + 1], this.stiffness);
        }
    }

    createCloth(startX, startY, width, height) {
        const particles = [];
        const size = this.voxelSize;

        // Create grid
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const px = startX + x * size;
                const py = startY + y * size;
                const pinned = y === 0 && x % 3 === 0;
                particles.push(this.createParticle(px, py, pinned));
            }
        }

        // Constraints
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;

                // Structural
                if (x < width - 1) {
                    this.addDistanceConstraint(particles[idx], particles[idx + 1], this.stiffness);
                }
                if (y < height - 1) {
                    this.addDistanceConstraint(particles[idx], particles[idx + width], this.stiffness);
                }

                // Shear
                if (x < width - 1 && y < height - 1) {
                    this.addDistanceConstraint(particles[idx], particles[idx + width + 1], this.stiffness * 0.5);
                    this.addDistanceConstraint(particles[idx + 1], particles[idx + width], this.stiffness * 0.5);
                }

                // Bending
                if (x < width - 2) {
                    this.addDistanceConstraint(particles[idx], particles[idx + 2], this.stiffness * 0.2);
                }
                if (y < height - 2) {
                    this.addDistanceConstraint(particles[idx], particles[idx + width * 2], this.stiffness * 0.2);
                }
            }
        }
    }

    createStack(centerX, startY) {
        // Create multiple soft bodies
        this.createSoftBodyCube(centerX - 80, startY, 3, 3);

        setTimeout(() => {
            this.createSoftBodyCube(centerX + 20, startY, 3, 3);
        }, 100);

        setTimeout(() => {
            this.createSoftBodyCube(centerX - 30, startY - 80, 3, 3);
        }, 200);
    }

    createBridge(startX, startY) {
        const width = 8;
        const height = 3;
        const size = this.voxelSize;

        const particles = [];

        // Create bridge deck
        for (let x = 0; x < width; x++) {
            const px = startX + x * size;
            const py = startY;
            const pinned = x === 0 || x === width - 1;
            particles.push(this.createParticle(px, py, pinned));

            // Add vertical supports
            if (x % 2 === 0 && x > 0 && x < width - 1) {
                particles.push(this.createParticle(px, py + size * 2, false));
                this.addDistanceConstraint(particles[x], particles[particles.length - 1], this.stiffness);
            }
        }

        // Connect deck particles
        for (let i = 0; i < particles.length - 1; i++) {
            this.addDistanceConstraint(particles[i], particles[i + 1], this.stiffness);
        }

        // Add cross bracing
        for (let i = 0; i < width - 2; i += 2) {
            this.addDistanceConstraint(particles[i], particles[i + 2], this.stiffness * 0.5);
        }
    }

    createJellyCube(startX, startY) {
        const size = this.voxelSize * 1.5;
        const particles = [];

        // Create cube vertices
        const vertices = [
            [0, 0], [1, 0], [2, 0],
            [0, 1], [1, 1], [2, 1],
            [0, 2], [1, 2], [2, 2]
        ];

        for (let [x, y] of vertices) {
            const px = startX + x * size;
            const py = startY + y * size;
            particles.push(this.createParticle(px, py, false));
        }

        // Connect all adjacent particles
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= size * 1.5) {
                    this.addDistanceConstraint(particles[i], particles[j], this.stiffness * 0.3);
                }
            }
        }

        // Add volume constraint
        this.addVolumeConstraint(particles, this.stiffness * 0.8);
    }

    update() {
        // Apply gravity and predict positions
        for (let p of this.particles) {
            if (p.pinned) continue;

            // Velocity Verlet integration
            p.vy += this.gravity * this.dt * 10;
            p.vx *= this.damping;
            p.vy *= this.damping;

            p.prevX = p.x;
            p.prevY = p.y;
            p.x += p.vx * this.dt * 60;
            p.y += p.vy * this.dt * 60;

            p.updateTrail();
        }

        // Solve constraints iteratively
        for (let i = 0; i < this.iterations; i++) {
            for (let c of this.constraints) {
                if (c.type === 'distance') {
                    c.solve(this.stiffness);
                } else if (c.type === 'volume') {
                    c.solve(this.stiffness);
                }
            }

            // Floor collision
            for (let p of this.particles) {
                if (p.pinned) continue;
                if (p.y > this.floorY - p.radius) {
                    p.y = this.floorY - p.radius;
                    p.vy *= -0.3;
                    p.vx *= 0.95;
                }
            }
        }

        // Update velocities from positions
        for (let p of this.particles) {
            if (p.pinned) continue;
            p.vx = (p.x - p.prevX) / this.dt / 60;
            p.vy = (p.y - p.prevY) / this.dt / 60;
        }

        // Mouse interaction
        if (this.mouseDown && this.selectedParticle) {
            const dx = this.mouseX - this.selectedParticle.x;
            const dy = this.mouseY - this.selectedParticle.y;
            this.selectedParticle.x += dx * 0.3;
            this.selectedParticle.y += dy * 0.3;
            this.selectedParticle.vx = 0;
            this.selectedParticle.vy = 0;
        }

        // Update particle stress for visualization
        for (let p of this.particles) {
            p.stress = 0;
        }
        for (let c of this.constraints) {
            if (c.type === 'distance') {
                c.p1.stress = Math.max(c.p1.stress, c.stress);
                c.p2.stress = Math.max(c.p2.stress, c.stress);
            }
        }
    }

    render() {
        const ctx = this.ctx;
        const width = this.canvas.width / window.devicePixelRatio;
        const height = this.canvas.height / window.devicePixelRatio;

        // Clear canvas
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        if (this.showGrid) {
            this.drawGrid(width, height);
        }

        // Draw trails
        if (this.showTrails) {
            this.drawTrails();
        }

        // Draw constraints
        if (this.showConstraints) {
            this.drawConstraints();
        }

        // Draw particles
        this.drawParticles();

        // Draw floor
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, this.floorY, width, height - this.floorY);
        ctx.strokeStyle = '#4466ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, this.floorY);
        ctx.lineTo(width, this.floorY);
        ctx.stroke();
    }

    drawGrid(width, height) {
        const ctx = this.ctx;
        const gridSize = 50;

        ctx.strokeStyle = '#1a1a2e';
        ctx.lineWidth = 1;

        for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        for (let y = 0; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
    }

    drawTrails() {
        const ctx = this.ctx;

        for (let p of this.particles) {
            if (p.trail.length < 2) continue;

            ctx.beginPath();
            ctx.moveTo(p.trail[0].x, p.trail[0].y);

            for (let i = 1; i < p.trail.length; i++) {
                ctx.lineTo(p.trail[i].x, p.trail[i].y);
            }

            const alpha = 0.2;
            ctx.strokeStyle = `rgba(68, 102, 255, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    drawConstraints() {
        const ctx = this.ctx;

        for (let c of this.constraints) {
            if (c.type === 'distance') {
                const stress = Math.min(c.stress * 5, 1);
                const r = Math.floor(68 + stress * 187);
                const g = Math.floor(102 - stress * 102);
                const b = Math.floor(255 - stress * 187);

                ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.lineWidth = 1 + stress * 2;
                ctx.beginPath();
                ctx.moveTo(c.p1.x, c.p1.y);
                ctx.lineTo(c.p2.x, c.p2.y);
                ctx.stroke();
            }
        }
    }

    drawParticles() {
        const ctx = this.ctx;

        for (let p of this.particles) {
            let color;

            if (this.showStress) {
                const stress = Math.min(p.stress * 3, 1);
                const r = Math.floor(68 + stress * 187);
                const g = Math.floor(102 - stress * 102);
                const b = Math.floor(255 - stress * 187);
                color = `rgb(${r}, ${g}, ${b})`;
            } else {
                color = p.pinned ? '#ff6b6b' : '#4466ff';
            }

            // Draw particle
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();

            // Draw glow
            const gradient = ctx.createRadialGradient(
                p.x, p.y, 0,
                p.x, p.y, p.radius * 2
            );
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Highlight selected particle
        if (this.selectedParticle) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(
                this.selectedParticle.x,
                this.selectedParticle.y,
                this.selectedParticle.radius + 5,
                0,
                Math.PI * 2
            );
            ctx.stroke();
        }
    }

    updateStats() {
        document.getElementById('particleCount').textContent = this.particles.length;
        document.getElementById('constraintCount').textContent = this.constraints.length;
        document.getElementById('iterations').textContent = this.iterations;
    }

    updateFPS() {
        this.frameCount++;
        const now = performance.now();

        if (now - this.lastFpsUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsUpdate = now;
            document.getElementById('fps').textContent = this.fps;
        }
    }

    loop() {
        if (this.running) {
            this.update();
        }

        this.render();
        this.updateFPS();
        requestAnimationFrame(() => this.loop());
    }

    start() {
        this.running = true;
    }

    stop() {
        this.running = false;
    }

    step() {
        this.update();
        this.render();
    }
}

// Initialize simulator
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('simulationCanvas');
    const sim = new XPBDSimulator(canvas);

    // Control bindings
    document.getElementById('playPauseBtn').addEventListener('click', function() {
        if (sim.running) {
            sim.stop();
            this.textContent = '▶ Play';
        } else {
            sim.start();
            this.textContent = '⏸ Pause';
        }
    });

    document.getElementById('stepBtn').addEventListener('click', () => {
        sim.step();
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
        const currentPreset = document.querySelector('.btn-preset.active')?.dataset.preset || 'cube';
        sim.loadPreset(currentPreset);
    });

    // Physics parameters
    document.getElementById('gravity').addEventListener('input', function() {
        sim.gravity = parseFloat(this.value);
        document.getElementById('gravityValue').textContent = this.value;
    });

    document.getElementById('stiffness').addEventListener('input', function() {
        sim.stiffness = parseFloat(this.value);
        document.getElementById('stiffnessValue').textContent = this.value;
        // Update existing constraints
        for (let c of sim.constraints) {
            if (c.type === 'distance') {
                c.stiffness = sim.stiffness;
            } else if (c.type === 'volume') {
                c.stiffness = sim.stiffness * 0.5;
            }
        }
    });

    document.getElementById('iterations').addEventListener('input', function() {
        sim.iterations = parseInt(this.value);
        document.getElementById('iterationsValue').textContent = this.value;
        sim.updateStats();
    });

    document.getElementById('damping').addEventListener('input', function() {
        sim.damping = parseFloat(this.value);
        document.getElementById('dampingValue').textContent = this.value;
    });

    document.getElementById('voxelSize').addEventListener('input', function() {
        sim.voxelSize = parseInt(this.value);
        document.getElementById('voxelSizeValue').textContent = this.value;
    });

    document.getElementById('mouseRadius').addEventListener('input', function() {
        sim.mouseRadius = parseInt(this.value);
        document.getElementById('mouseRadiusValue').textContent = this.value;
    });

    // Visualization toggles
    document.getElementById('showConstraints').addEventListener('change', function() {
        sim.showConstraints = this.checked;
    });

    document.getElementById('showStress').addEventListener('change', function() {
        sim.showStress = this.checked;
    });

    document.getElementById('showTrails').addEventListener('change', function() {
        sim.showTrails = this.checked;
    });

    document.getElementById('showGrid').addEventListener('change', function() {
        sim.showGrid = this.checked;
    });

    // Presets
    document.querySelectorAll('.btn-preset').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            sim.loadPreset(this.dataset.preset);
        });
    });

    // Start simulation loop
    sim.loop();
});

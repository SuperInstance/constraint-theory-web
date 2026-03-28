/**
 * N-Body Gravity Simulator
 * Demonstrates how gravitational constraints between all pairs of bodies
 * create emergent orbital dynamics through the constraint F = G*m1*m2/r²
 */

class NBodySimulator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.bodies = [];
        this.trails = [];
        this.running = true;
        this.G = 1.0;
        this.dt = 0.5;
        this.softening = 5;
        this.trailLength = 100;
        this.showTrails = true;
        this.showVelocity = false;
        this.showField = false;
        this.mergeCollisions = true;
        this.newBodyMass = 100;

        // Interaction state
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragEnd = { x: 0, y: 0 };

        this.resize();
        this.setupEventListeners();
        this.loadPreset('solar');
        this.animate();
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());

        // Mouse/touch events for adding bodies
        this.canvas.addEventListener('mousedown', (e) => this.onDragStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.onDragMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onDragEnd(e));
        this.canvas.addEventListener('mouseleave', () => this.isDragging = false);

        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onDragStart(touch);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onDragMove(touch);
        });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.onDragEnd(e);
        });
    }

    onDragStart(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.dragStart = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        this.dragEnd = { ...this.dragStart };
        this.isDragging = true;
    }

    onDragMove(e) {
        if (!this.isDragging) return;
        const rect = this.canvas.getBoundingClientRect();
        this.dragEnd = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    onDragEnd(e) {
        if (!this.isDragging) return;
        this.isDragging = false;

        const velocity = {
            x: (this.dragStart.x - this.dragEnd.x) * 0.05,
            y: (this.dragStart.y - this.dragEnd.y) * 0.05
        };

        this.addBody(
            this.dragStart.x - this.centerX,
            this.dragStart.y - this.centerY,
            velocity.x,
            velocity.y,
            this.newBodyMass
        );
    }

    addBody(x, y, vx, vy, mass) {
        const body = {
            x, y, vx, vy, mass,
            radius: Math.sqrt(mass) * 0.8,
            color: this.generateColor(mass)
        };
        this.bodies.push(body);
        this.trails.push([]);
    }

    generateColor(mass) {
        // Color based on mass - small = blue, medium = yellow, large = red
        const hue = Math.max(0, 240 - (mass / 500) * 240);
        return `hsl(${hue}, 80%, 60%)`;
    }

    computeForces() {
        const forces = this.bodies.map(() => ({ fx: 0, fy: 0 }));

        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = i + 1; j < this.bodies.length; j++) {
                const dx = this.bodies[j].x - this.bodies[i].x;
                const dy = this.bodies[j].y - this.bodies[i].y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);

                // Softened gravitational force: F = G*m1*m2/(r² + ε²)
                const force = (this.G * this.bodies[i].mass * this.bodies[j].mass) /
                             (distSq + this.softening * this.softening);

                const fx = force * dx / dist;
                const fy = force * dy / dist;

                forces[i].fx += fx;
                forces[i].fy += fy;
                forces[j].fx -= fx;
                forces[j].fy -= fy;
            }
        }

        return forces;
    }

    integrate() {
        // Velocity Verlet integration
        const forces = this.computeForces();

        // Update positions and half-step velocities
        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            const ax = forces[i].fx / body.mass;
            const ay = forces[i].fy / body.mass;

            body.x += body.vx * this.dt + 0.5 * ax * this.dt * this.dt;
            body.y += body.vy * this.dt + 0.5 * ay * this.dt * this.dt;

            // Store acceleration for second half-step
            body.ax = ax;
            body.ay = ay;
        }

        // Compute new forces
        const newForces = this.computeForces();

        // Complete velocity updates
        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            const newAx = newForces[i].fx / body.mass;
            const newAy = newForces[i].fy / body.mass;

            body.vx += 0.5 * (body.ax + newAx) * this.dt;
            body.vy += 0.5 * (body.ay + newAy) * this.dt;
        }

        // Handle collisions
        if (this.mergeCollisions) {
            this.handleCollisions();
        }

        // Update trails
        this.updateTrails();
    }

    handleCollisions() {
        const mergeDistance = 5;
        const toRemove = new Set();

        for (let i = 0; i < this.bodies.length; i++) {
            if (toRemove.has(i)) continue;

            for (let j = i + 1; j < this.bodies.length; j++) {
                if (toRemove.has(j)) continue;

                const dx = this.bodies[j].x - this.bodies[i].x;
                const dy = this.bodies[j].y - this.bodies[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < mergeDistance) {
                    // Merge bodies
                    const totalMass = this.bodies[i].mass + this.bodies[j].mass;
                    this.bodies[i].vx = (this.bodies[i].vx * this.bodies[i].mass +
                                        this.bodies[j].vx * this.bodies[j].mass) / totalMass;
                    this.bodies[i].vy = (this.bodies[i].vy * this.bodies[i].mass +
                                        this.bodies[j].vy * this.bodies[j].mass) / totalMass;
                    this.bodies[i].x = (this.bodies[i].x * this.bodies[i].mass +
                                       this.bodies[j].x * this.bodies[j].mass) / totalMass;
                    this.bodies[i].y = (this.bodies[i].y * this.bodies[i].mass +
                                       this.bodies[j].y * this.bodies[j].mass) / totalMass;
                    this.bodies[i].mass = totalMass;
                    this.bodies[i].radius = Math.sqrt(totalMass) * 0.8;
                    this.bodies[i].color = this.generateColor(totalMass);

                    toRemove.add(j);
                }
            }
        }

        // Remove merged bodies
        const indices = Array.from(toRemove).sort((a, b) => b - a);
        for (const idx of indices) {
            this.bodies.splice(idx, 1);
            this.trails.splice(idx, 1);
        }
    }

    updateTrails() {
        for (let i = 0; i < this.bodies.length; i++) {
            this.trails[i].push({ x: this.bodies[i].x, y: this.bodies[i].y });
            if (this.trails[i].length > this.trailLength) {
                this.trails[i].shift();
            }
        }
    }

    computeEnergy() {
        let kinetic = 0;
        let potential = 0;

        for (let i = 0; i < this.bodies.length; i++) {
            // Kinetic energy: 0.5 * m * v²
            const vSq = this.bodies[i].vx * this.bodies[i].vx +
                       this.bodies[i].vy * this.bodies[i].vy;
            kinetic += 0.5 * this.bodies[i].mass * vSq;

            // Potential energy: -G*m1*m2/r
            for (let j = i + 1; j < this.bodies.length; j++) {
                const dx = this.bodies[j].x - this.bodies[i].x;
                const dy = this.bodies[j].y - this.bodies[i].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                potential -= (this.G * this.bodies[i].mass * this.bodies[j].mass) /
                            (dist + this.softening);
            }
        }

        return kinetic + potential;
    }

    computeMomentum() {
        let px = 0, py = 0;
        for (const body of this.bodies) {
            px += body.mass * body.vx;
            py += body.mass * body.vy;
        }
        return Math.sqrt(px * px + py * py);
    }

    computeCenterOfMass() {
        if (this.bodies.length === 0) return { x: 0, y: 0 };

        let mx = 0, my = 0, totalMass = 0;
        for (const body of this.bodies) {
            mx += body.mass * body.x;
            my += body.mass * body.y;
            totalMass += body.mass;
        }
        return { x: mx / totalMass, y: my / totalMass };
    }

    draw() {
        // Clear canvas with fade effect
        this.ctx.fillStyle = 'rgba(10, 10, 20, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw gravitational field
        if (this.showField) {
            this.drawGravitationalField();
        }

        // Draw trails
        if (this.showTrails) {
            this.drawTrails();
        }

        // Draw bodies
        for (const body of this.bodies) {
            this.drawBody(body);
        }

        // Draw velocity vectors
        if (this.showVelocity) {
            this.drawVelocityVectors();
        }

        // Draw drag line
        if (this.isDragging) {
            this.drawDragLine();
        }

        // Draw center of mass
        const com = this.computeCenterOfMass();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(com.x + this.centerX, com.y + this.centerY, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawBody(body) {
        const x = body.x + this.centerX;
        const y = body.y + this.centerY;

        // Glow effect
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, body.radius * 2);
        gradient.addColorStop(0, body.color);
        gradient.addColorStop(0.5, body.color.replace('60%', '40%'));
        gradient.addColorStop(1, 'transparent');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, body.radius * 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Core
        this.ctx.fillStyle = body.color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, body.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawTrails() {
        for (let i = 0; i < this.trails.length; i++) {
            if (this.trails[i].length < 2) continue;

            const body = this.bodies[i];
            this.ctx.strokeStyle = body.color;
            this.ctx.lineWidth = 1;

            for (let j = 1; j < this.trails[i].length; j++) {
                const alpha = j / this.trails[i].length;
                this.ctx.globalAlpha = alpha * 0.5;

                this.ctx.beginPath();
                this.ctx.moveTo(
                    this.trails[i][j - 1].x + this.centerX,
                    this.trails[i][j - 1].y + this.centerY
                );
                this.ctx.lineTo(
                    this.trails[i][j].x + this.centerX,
                    this.trails[i][j].y + this.centerY
                );
                this.ctx.stroke();
            }
            this.ctx.globalAlpha = 1;
        }
    }

    drawVelocityVectors() {
        this.ctx.strokeStyle = 'rgba(100, 200, 255, 0.7)';
        this.ctx.lineWidth = 1;

        for (const body of this.bodies) {
            const x = body.x + this.centerX;
            const y = body.y + this.centerY;

            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + body.vx * 10, y + body.vy * 10);
            this.ctx.stroke();

            // Arrowhead
            const angle = Math.atan2(body.vy, body.vx);
            this.ctx.beginPath();
            this.ctx.moveTo(x + body.vx * 10, y + body.vy * 10);
            this.ctx.lineTo(
                x + body.vx * 10 - 8 * Math.cos(angle - Math.PI / 6),
                y + body.vy * 10 - 8 * Math.sin(angle - Math.PI / 6)
            );
            this.ctx.moveTo(x + body.vx * 10, y + body.vy * 10);
            this.ctx.lineTo(
                x + body.vx * 10 - 8 * Math.cos(angle + Math.PI / 6),
                y + body.vy * 10 - 8 * Math.sin(angle + Math.PI / 6)
            );
            this.ctx.stroke();
        }
    }

    drawGravitationalField() {
        const step = 30;
        const arrowScale = 200;

        this.ctx.strokeStyle = 'rgba(100, 100, 150, 0.2)';
        this.ctx.lineWidth = 1;

        for (let px = step; px < this.canvas.width; px += step) {
            for (let py = step; py < this.canvas.height; py += step) {
                const x = px - this.centerX;
                const y = py - this.centerY;

                let gx = 0, gy = 0;
                for (const body of this.bodies) {
                    const dx = body.x - x;
                    const dy = body.y - y;
                    const distSq = dx * dx + dy * dy + this.softening * this.softening;
                    const dist = Math.sqrt(distSq);

                    const g = this.G * body.mass / distSq;
                    gx += g * dx / dist;
                    gy += g * dy / dist;
                }

                const gMag = Math.sqrt(gx * gx + gy * gy);
                if (gMag > 0.01) {
                    const angle = Math.atan2(gy, gx);
                    const length = Math.min(gMag * arrowScale, step * 0.8);

                    this.ctx.beginPath();
                    this.ctx.moveTo(px, py);
                    this.ctx.lineTo(
                        px + Math.cos(angle) * length,
                        py + Math.sin(angle) * length
                    );
                    this.ctx.stroke();
                }
            }
        }
    }

    drawDragLine() {
        this.ctx.strokeStyle = 'rgba(255, 255, 100, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        this.ctx.beginPath();
        this.ctx.moveTo(this.dragStart.x, this.dragStart.y);
        this.ctx.lineTo(this.dragEnd.x, this.dragEnd.y);
        this.ctx.stroke();

        this.ctx.setLineDash([]);

        // Preview body
        this.ctx.fillStyle = 'rgba(255, 255, 100, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(this.dragStart.x, this.dragStart.y, Math.sqrt(this.newBodyMass) * 0.8, 0, Math.PI * 2);
        this.ctx.fill();
    }

    updateStats() {
        document.getElementById('bodyCount').textContent = this.bodies.length;
        document.getElementById('totalEnergy').textContent = this.computeEnergy().toFixed(2);
        document.getElementById('totalMomentum').textContent = this.computeMomentum().toFixed(2);

        const com = this.computeCenterOfMass();
        document.getElementById('centerOfMass').textContent =
            `(${com.x.toFixed(1)}, ${com.y.toFixed(1)})`;
    }

    animate() {
        if (this.running) {
            this.integrate();
        }

        this.draw();
        this.updateStats();

        requestAnimationFrame(() => this.animate());
    }

    // Preset configurations
    loadPreset(name) {
        this.bodies = [];
        this.trails = [];

        switch (name) {
            case 'solar':
                this.loadSolarSystem();
                break;
            case 'binary':
                this.loadBinaryStar();
                break;
            case 'figure8':
                this.loadFigure8();
                break;
            case 'cluster':
                this.loadRandomCluster();
                break;
            case 'galaxy':
                this.loadGalaxyCollision();
                break;
        }
    }

    loadSolarSystem() {
        // Simplified solar system
        this.addBody(0, 0, 0, 0, 1000); // Sun
        this.addBody(100, 0, 0, 3.2, 50); // Planet 1
        this.addBody(150, 0, 0, 2.6, 80); // Planet 2
        this.addBody(200, 0, 0, 2.2, 60); // Planet 3
        this.addBody(280, 0, 0, 1.8, 150); // Planet 4
        this.addBody(380, 0, 0, 1.5, 120); // Planet 5
    }

    loadBinaryStar() {
        // Two equal mass stars orbiting common center
        this.addBody(-80, 0, 0, 2.5, 300);
        this.addBody(80, 0, 0, -2.5, 300);
    }

    loadFigure8() {
        // Famous figure-8 three-body solution
        const v = 0.93240737;
        const scale = 150;
        const vScale = 2;

        this.addBody(-0.97 * scale, 0.243 * scale, v * vScale, -v * vScale * 0.932, 100);
        this.addBody(0.97 * scale, -0.243 * scale, v * vScale, -v * vScale * 0.932, 100);
        this.addBody(0, 0, -2 * v * vScale, 2 * v * vScale * 0.932, 100);
    }

    loadRandomCluster() {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 50 + Math.random() * 200;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            const v = Math.sqrt(this.G * 500 / dist) * 0.8;
            const vx = -Math.sin(angle) * v;
            const vy = Math.cos(angle) * v;
            this.addBody(x, y, vx, vy, 20 + Math.random() * 80);
        }
        // Central mass
        this.addBody(0, 0, 0, 0, 500);
    }

    loadGalaxyCollision() {
        // Galaxy 1
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 100;
            const x = -150 + Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            const v = Math.sqrt(this.G * 200 / dist);
            const vx = 1 + -Math.sin(angle) * v;
            const vy = Math.cos(angle) * v;
            this.addBody(x, y, vx, vy, 10 + Math.random() * 30);
        }
        this.addBody(-150, 0, 1, 0, 200); // Galaxy 1 center

        // Galaxy 2
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 100;
            const x = 150 + Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            const v = Math.sqrt(this.G * 200 / dist);
            const vx = -1 + -Math.sin(angle) * v;
            const vy = Math.cos(angle) * v;
            this.addBody(x, y, vx, vy, 10 + Math.random() * 30);
        }
        this.addBody(150, 0, -1, 0, 200); // Galaxy 2 center
    }
}

// Initialize simulator
const canvas = document.getElementById('simCanvas');
const sim = new NBodySimulator(canvas);

// Control bindings
document.getElementById('gravitySlider').addEventListener('input', (e) => {
    sim.G = parseFloat(e.target.value);
    document.getElementById('gravityValue').textContent = sim.G.toFixed(1);
});

document.getElementById('timestepSlider').addEventListener('input', (e) => {
    sim.dt = parseFloat(e.target.value);
    document.getElementById('timestepValue').textContent = sim.dt.toFixed(1);
});

document.getElementById('softeningSlider').addEventListener('input', (e) => {
    sim.softening = parseFloat(e.target.value);
    document.getElementById('softeningValue').textContent = sim.softening;
});

document.getElementById('trailSlider').addEventListener('input', (e) => {
    sim.trailLength = parseInt(e.target.value);
    document.getElementById('trailValue').textContent = sim.trailLength;
});

document.getElementById('showTrails').addEventListener('change', (e) => {
    sim.showTrails = e.target.checked;
});

document.getElementById('showVelocity').addEventListener('change', (e) => {
    sim.showVelocity = e.target.checked;
});

document.getElementById('showField').addEventListener('change', (e) => {
    sim.showField = e.target.checked;
});

document.getElementById('mergeCollisions').addEventListener('change', (e) => {
    sim.mergeCollisions = e.target.checked;
});

document.getElementById('massSlider').addEventListener('input', (e) => {
    sim.newBodyMass = parseInt(e.target.value);
    document.getElementById('massValue').textContent = sim.newBodyMass;
});

document.getElementById('playPauseBtn').addEventListener('click', (e) => {
    sim.running = !sim.running;
    e.target.textContent = sim.running ? 'Pause' : 'Play';
});

document.getElementById('resetBtn').addEventListener('click', () => {
    sim.loadPreset('solar');
});

document.getElementById('clearBtn').addEventListener('click', () => {
    sim.bodies = [];
    sim.trails = [];
});

// Preset buttons
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        sim.loadPreset(btn.dataset.preset);
    });
});

/**
 * Spring-Mass Constraint System
 * Demonstrates Hooke's Law: F = -k * (x - x0)
 * Part of Constraint Theory - https://constraint-theory.superinstance.ai
 */

class Particle {
    constructor(x, y, mass = 1.0, pinned = false) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;
        this.mass = mass;
        this.pinned = pinned;
        this.trail = [];
        this.maxTrailLength = 50;
        this.radius = 8;
    }

    applyForce(fx, fy) {
        if (this.pinned) return;
        this.ax += fx / this.mass;
        this.ay += fy / this.mass;
    }

    update(dt, damping) {
        if (this.pinned) return;

        // Verlet-like integration
        this.vx += this.ax * dt;
        this.vy += this.ay * dt;
        this.vx *= damping;
        this.vy *= damping;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Store trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // Reset acceleration
        this.ax = 0;
        this.ay = 0;
    }
}

class Spring {
    constructor(p1, p2, stiffness, restLength = null, damping = 0.1) {
        this.p1 = p1;
        this.p2 = p2;
        this.stiffness = stiffness;
        this.damping = damping;
        this.restLength = restLength || this.getCurrentLength();
        this.currentForce = 0;
    }

    getCurrentLength() {
        const dx = this.p2.x - this.p1.x;
        const dy = this.p2.y - this.p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    solve() {
        const dx = this.p2.x - this.p1.x;
        const dy = this.p2.y - this.p1.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) return;

        // Hooke's Law: F = -k * (x - x0)
        const displacement = length - this.restLength;
        const force = this.stiffness * displacement;

        // Damping force
        const dvx = this.p2.vx - this.p1.vx;
        const dvy = this.p2.vy - this.p1.vy;
        const dampingForce = this.damping * (dvx * dx + dvy * dy) / length;

        const totalForce = force + dampingForce;
        this.currentForce = Math.abs(force);

        // Direction
        const nx = dx / length;
        const ny = dy / length;

        // Apply forces
        const fx = totalForce * nx;
        const fy = totalForce * ny;

        this.p1.applyForce(fx, fy);
        this.p2.applyForce(-fx, -fy);
    }

    getPotentialEnergy() {
        const displacement = this.getCurrentLength() - this.restLength;
        return 0.5 * this.stiffness * displacement * displacement;
    }
}

class SpringMassSimulator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.springs = [];

        // Physics parameters
        this.stiffness = 50;
        this.damping = 0.98;
        this.gravity = 200;
        this.restLengthFactor = 1.0;
        this.springDamping = 5;

        // Visualization
        this.showForces = true;
        this.showSprings = true;
        this.showTrails = false;
        this.showEnergy = false;

        // Interaction
        this.selectedParticle = null;
        this.isPaused = false;
        this.mouseX = 0;
        this.mouseY = 0;

        // Performance
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fps = 60;
        this.energyHistory = [];

        this.setupCanvas();
        this.setupEventListeners();
        this.loadPreset('chain');
        this.animate();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = 600;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.setupCanvas());

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.onMouseUp());

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onMouseDown(touch);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.onMouseMove(touch);
        });
        this.canvas.addEventListener('touchend', () => this.onMouseUp());

        // Controls
        document.getElementById('stiffness').addEventListener('input', (e) => {
            this.stiffness = parseFloat(e.target.value);
            document.getElementById('stiffnessValue').textContent = this.stiffness;
            this.updateSpringStiffness();
        });

        document.getElementById('damping').addEventListener('input', (e) => {
            this.damping = parseFloat(e.target.value);
            document.getElementById('dampingValue').textContent = this.damping.toFixed(2);
        });

        document.getElementById('gravity').addEventListener('input', (e) => {
            this.gravity = parseFloat(e.target.value);
            document.getElementById('gravityValue').textContent = this.gravity;
        });

        document.getElementById('restLength').addEventListener('input', (e) => {
            this.restLengthFactor = parseFloat(e.target.value);
            document.getElementById('restLengthValue').textContent = this.restLengthFactor.toFixed(1);
            this.updateRestLengths();
        });

        document.getElementById('showForces').addEventListener('change', (e) => {
            this.showForces = e.target.checked;
        });

        document.getElementById('showSprings').addEventListener('change', (e) => {
            this.showSprings = e.target.checked;
        });

        document.getElementById('showTrails').addEventListener('change', (e) => {
            this.showTrails = e.target.checked;
        });

        document.getElementById('showEnergy').addEventListener('change', (e) => {
            this.showEnergy = e.target.checked;
        });

        document.getElementById('pauseBtn').addEventListener('click', (e) => {
            this.isPaused = !this.isPaused;
            e.target.textContent = this.isPaused ? 'Resume' : 'Pause';
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.loadPreset(this.currentPreset);
        });

        // Presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentPreset = btn.dataset.preset;
                this.loadPreset(btn.dataset.preset);
            });
        });
    }

    updateSpringStiffness() {
        for (const spring of this.springs) {
            spring.stiffness = this.stiffness;
        }
    }

    updateRestLengths() {
        for (const spring of this.springs) {
            spring.restLength = spring.originalRestLength * this.restLengthFactor;
        }
    }

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Find nearest particle
        let nearest = null;
        let minDist = 20;

        for (const particle of this.particles) {
            const dx = particle.x - x;
            const dy = particle.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                nearest = particle;
            }
        }

        if (nearest) {
            this.selectedParticle = nearest;
        } else {
            // Add new particle
            this.addParticle(x, y);
        }
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;

        if (this.selectedParticle) {
            this.selectedParticle.x = this.mouseX;
            this.selectedParticle.y = this.mouseY;
            this.selectedParticle.vx = 0;
            this.selectedParticle.vy = 0;
        }
    }

    onMouseUp() {
        this.selectedParticle = null;
    }

    addParticle(x, y) {
        const particle = new Particle(x, y);
        this.particles.push(particle);

        // Connect to nearby particles
        for (const other of this.particles) {
            if (other === particle) continue;
            const dx = other.x - x;
            const dy = other.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
                const spring = new Spring(particle, other, this.stiffness, dist * this.restLengthFactor, this.springDamping);
                spring.originalRestLength = dist;
                this.springs.push(spring);
            }
        }

        this.updateStats();
    }

    addSpring(p1, p2, restLength = null) {
        const dist = restLength || Math.sqrt(
            Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
        );
        const spring = new Spring(p1, p2, this.stiffness, dist * this.restLengthFactor, this.springDamping);
        spring.originalRestLength = dist;
        this.springs.push(spring);
        return spring;
    }

    loadPreset(preset) {
        this.particles = [];
        this.springs = [];
        this.energyHistory = [];

        const centerX = this.canvas.width / 2;
        const centerY = 150;

        switch (preset) {
            case 'chain':
                this.createChain(centerX, centerY, 10, 40);
                break;
            case 'bridge':
                this.createBridge(centerX, centerY);
                break;
            case 'trampoline':
                this.createTrampoline(centerX, this.canvas.height - 100);
                break;
            case 'spider':
                this.createSpiderWeb(centerX, this.canvas.height / 2);
                break;
            case 'pendulum':
                this.createPendulum(centerX, centerY);
                break;
        }

        this.updateStats();
    }

    createChain(startX, startY, count, spacing) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            const particle = new Particle(startX, startY + i * spacing, 1.0, i === 0);
            particles.push(particle);
            this.particles.push(particle);
        }

        for (let i = 0; i < count - 1; i++) {
            this.addSpring(particles[i], particles[i + 1], spacing);
        }
    }

    createBridge(centerX, startY) {
        const width = 10;
        const spacing = 50;
        const startX = centerX - (width * spacing) / 2;

        // Create deck
        const deck = [];
        for (let i = 0; i < width; i++) {
            const x = startX + i * spacing;
            const particle = new Particle(x, startY, 1.0, i === 0 || i === width - 1);
            deck.push(particle);
            this.particles.push(particle);
        }

        // Connect deck
        for (let i = 0; i < width - 1; i++) {
            this.addSpring(deck[i], deck[i + 1], spacing);
        }

        // Add supports
        for (let i = 1; i < width - 1; i++) {
            if (i % 2 === 0) {
                const support = new Particle(startX + i * spacing, startY + 80, 0.5);
                this.particles.push(support);
                this.addSpring(deck[i], support, 80);
                this.addSpring(deck[i - 1], support, 90);
                this.addSpring(deck[i + 1], support, 90);
            }
        }
    }

    createTrampoline(centerX, startY) {
        const width = 12;
        const spacing = 30;
        const startX = centerX - (width * spacing) / 2;

        // Create frame
        const frame = [];
        for (let i = 0; i < width; i++) {
            const particle = new Particle(startX + i * spacing, startY, 1.0, i === 0 || i === width - 1);
            frame.push(particle);
            this.particles.push(particle);
        }

        // Create bounce surface
        const bounce = [];
        for (let i = 0; i < width; i++) {
            const particle = new Particle(startX + i * spacing, startY - 60, 0.5);
            bounce.push(particle);
            this.particles.push(particle);
        }

        // Connect frame
        for (let i = 0; i < width - 1; i++) {
            this.addSpring(frame[i], frame[i + 1], spacing);
            this.addSpring(bounce[i], bounce[i + 1], spacing);
        }

        // Connect frame to bounce
        for (let i = 0; i < width; i++) {
            this.addSpring(frame[i], bounce[i], 60);
        }

        // Cross bracing
        for (let i = 0; i < width - 1; i++) {
            this.addSpring(frame[i], bounce[i + 1], 70);
            this.addSpring(frame[i + 1], bounce[i], 70);
        }
    }

    createSpiderWeb(centerX, centerY) {
        const rings = 4;
        const spokes = 12;
        const ringSpacing = 60;

        // Create rings
        const allParticles = [];
        for (let r = 0; r < rings; r++) {
            const ringParticles = [];
            const radius = (r + 1) * ringSpacing;
            for (let s = 0; s < spokes; s++) {
                const angle = (s / spokes) * Math.PI * 2;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                const particle = new Particle(x, y, r === 0 ? 2.0 : 1.0);
                ringParticles.push(particle);
                this.particles.push(particle);
            }
            allParticles.push(ringParticles);
        }

        // Connect rings (spiral)
        for (let r = 0; r < rings; r++) {
            for (let s = 0; s < spokes; s++) {
                const next = (s + 1) % spokes;
                this.addSpring(allParticles[r][s], allParticles[r][next], ringSpacing * 0.52);
            }
        }

        // Connect spokes
        for (let r = 0; r < rings - 1; r++) {
            for (let s = 0; s < spokes; s++) {
                this.addSpring(allParticles[r][s], allParticles[r + 1][s], ringSpacing);
            }
        }

        // Pin some particles
        for (let s = 0; s < spokes; s += 3) {
            allParticles[rings - 1][s].pinned = true;
        }
    }

    createPendulum(centerX, startY) {
        // Multiple pendulums with different lengths
        const pendulums = [
            { length: 150, count: 1 },
            { length: 100, count: 2 },
            { length: 80, count: 3 },
        ];

        let offsetX = -150;
        for (const config of pendulums) {
            const anchor = new Particle(centerX + offsetX, startY, 1.0, true);
            this.particles.push(anchor);

            let prev = anchor;
            const segmentLength = config.length / config.count;

            for (let i = 0; i < config.count; i++) {
                const bob = new Particle(prev.x, prev.y + segmentLength, 1.5);
                this.particles.push(bob);
                this.addSpring(prev, bob, segmentLength);
                prev = bob;
            }

            offsetX += 150;
        }
    }

    update(dt) {
        // Apply gravity
        for (const particle of this.particles) {
            particle.applyForce(0, this.gravity * particle.mass);
        }

        // Solve springs
        for (const spring of this.springs) {
            spring.solve();
        }

        // Update particles
        for (const particle of this.particles) {
            particle.update(dt, this.damping);
        }
    }

    computeEnergy() {
        let kinetic = 0;
        let potential = 0;

        // Kinetic energy: 0.5 * m * v^2
        for (const particle of this.particles) {
            kinetic += 0.5 * particle.mass * (particle.vx * particle.vx + particle.vy * particle.vy);
            potential += particle.mass * this.gravity * (this.canvas.height - particle.y);
        }

        // Spring potential energy
        for (const spring of this.springs) {
            potential += spring.getPotentialEnergy();
        }

        return { kinetic, potential, total: kinetic + potential };
    }

    render() {
        const ctx = this.ctx;

        // Clear
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }

        // Draw trails
        if (this.showTrails) {
            for (const particle of this.particles) {
                if (particle.trail.length < 2) continue;
                ctx.beginPath();
                ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
                for (let i = 1; i < particle.trail.length; i++) {
                    ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
                }
                ctx.strokeStyle = 'rgba(0, 217, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        // Draw springs
        if (this.showSprings) {
            for (const spring of this.springs) {
                // Color based on tension
                const tension = spring.currentForce / 100;
                const r = Math.min(255, Math.floor(100 + tension * 155));
                const g = Math.max(0, Math.floor(200 - tension * 200));
                const b = Math.max(0, Math.floor(255 - tension * 200));

                ctx.beginPath();
                ctx.moveTo(spring.p1.x, spring.p1.y);
                ctx.lineTo(spring.p2.x, spring.p2.y);
                ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.lineWidth = 2 + tension * 2;
                ctx.stroke();

                // Draw spring coils
                if (false) { // Optional: detailed spring visualization
                    const dx = spring.p2.x - spring.p1.x;
                    const dy = spring.p2.y - spring.p1.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const nx = -dy / length;
                    const ny = dx / length;

                    ctx.beginPath();
                    ctx.moveTo(spring.p1.x, spring.p1.y);
                    const coils = 10;
                    for (let i = 1; i <= coils; i++) {
                        const t = i / coils;
                        const x = spring.p1.x + dx * t;
                        const y = spring.p1.y + dy * t;
                        const offset = (i % 2 === 0 ? 1 : -1) * 5;
                        ctx.lineTo(x + nx * offset, y + ny * offset);
                    }
                    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }

        // Draw particles
        for (const particle of this.particles) {
            // Glow
            const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.radius * 2
            );
            gradient.addColorStop(0, particle.pinned ? '#f59e0b' : '#00d9ff');
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius * 2, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fillStyle = particle.pinned ? '#f59e0b' : '#00d9ff';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Draw force vectors
        if (this.showForces) {
            for (const spring of this.springs) {
                const force = spring.currentForce;
                if (force < 1) continue;

                const dx = spring.p2.x - spring.p1.x;
                const dy = spring.p2.y - spring.p1.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const nx = dx / length;
                const ny = dy / length;

                // Force magnitude arrow
                const forceScale = 0.5;
                const midX = (spring.p1.x + spring.p2.x) / 2;
                const midY = (spring.p1.y + spring.p2.y) / 2;

                ctx.beginPath();
                ctx.moveTo(midX, midY);
                ctx.lineTo(midX + nx * force * forceScale, midY + ny * force * forceScale);
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.7)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // Draw energy graph
        if (this.showEnergy && this.energyHistory.length > 1) {
            const graphX = 20;
            const graphY = 20;
            const graphWidth = 200;
            const graphHeight = 100;

            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(graphX, graphY, graphWidth, graphHeight);
            ctx.strokeStyle = '#333';
            ctx.strokeRect(graphX, graphY, graphWidth, graphHeight);

            // Draw energy lines
            const maxEnergy = Math.max(...this.energyHistory.map(e => e.total)) || 1;

            ctx.beginPath();
            for (let i = 0; i < this.energyHistory.length; i++) {
                const x = graphX + (i / this.energyHistory.length) * graphWidth;
                const y = graphY + graphHeight - (this.energyHistory[i].total / maxEnergy) * graphHeight;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = '#00ffaa';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    updateStats() {
        document.getElementById('particleCount').textContent = this.particles.length;
        document.getElementById('springCount').textContent = this.springs.length;

        const energy = this.computeEnergy();
        document.getElementById('totalEnergy').textContent = energy.total.toFixed(0);
    }

    animate() {
        // FPS calculation
        const currentTime = performance.now();
        this.frameCount++;
        if (currentTime - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
            document.getElementById('fps').textContent = this.fps;
        }

        if (!this.isPaused) {
            this.update(1 / 60);
        }

        this.render();

        // Update energy history
        if (this.showEnergy) {
            this.energyHistory.push(this.computeEnergy());
            if (this.energyHistory.length > 200) {
                this.energyHistory.shift();
            }
        }

        this.updateStats();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('springCanvas');
    new SpringMassSimulator(canvas);
});

// Soft Body Simulation - Demonstrating Constraint Theory
// This simulation shows how geometric constraints create realistic soft body deformation

class Particle {
    constructor(x, y, mass = 1.0, pinned = false) {
        this.x = x;
        this.y = y;
        this.oldX = x;
        this.oldY = y;
        this.mass = mass;
        this.pinned = pinned;
        this.forceX = 0;
        this.forceY = 0;
        this.trail = [];
        this.maxTrailLength = 20;
    }

    applyForce(fx, fy) {
        if (this.pinned) return;
        this.forceX += fx;
        this.forceY += fy;
    }

    update(dt) {
        if (this.pinned) return;

        // Verlet integration
        const vx = (this.x - this.oldX) * damping;
        const vy = (this.y - this.oldY) * damping;

        this.oldX = this.x;
        this.oldY = this.y;

        const ax = this.forceX / this.mass;
        const ay = this.forceY / this.mass;

        this.x += vx + ax * dt * dt;
        this.y += vy + ay * dt * dt;

        this.forceX = 0;
        this.forceY = 0;

        // Store trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }

    constrain(width, height) {
        if (this.pinned) return;

        const margin = 10;
        const bounce = 0.5;

        if (this.x < margin) {
            this.x = margin;
            this.oldX = this.x + (this.x - this.oldX) * bounce;
        } else if (this.x > width - margin) {
            this.x = width - margin;
            this.oldX = this.x + (this.x - this.oldX) * bounce;
        }

        if (this.y < margin) {
            this.y = margin;
            this.oldY = this.y + (this.y - this.oldY) * bounce;
        } else if (this.y > height - margin) {
            this.y = height - margin;
            this.oldY = this.y + (this.y - this.oldY) * bounce;
        }
    }
}

class Constraint {
    constructor(p1, p2, stiffness = 1.0, type = 'structural') {
        this.p1 = p1;
        this.p2 = p2;
        this.stiffness = stiffness;
        this.type = type;
        this.restLength = Math.sqrt(
            Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
        );
        this.stress = 0;
    }

    solve() {
        const dx = this.p2.x - this.p1.x;
        const dy = this.p2.y - this.p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return;

        const difference = (this.restLength - distance) / distance;
        this.stress = Math.abs(difference);

        const stiffness = this.stiffness * globalStiffness;
        const offsetX = dx * difference * 0.5 * stiffness;
        const offsetY = dy * difference * 0.5 * stiffness;

        if (!this.p1.pinned) {
            this.p1.x -= offsetX;
            this.p1.y -= offsetY;
        }

        if (!this.p2.pinned) {
            this.p2.x += offsetX;
            this.p2.y += offsetY;
        }
    }

    getStress() {
        const currentLength = Math.sqrt(
            Math.pow(this.p2.x - this.p1.x, 2) + Math.pow(this.p2.y - this.p1.y, 2)
        );
        return (currentLength - this.restLength) / this.restLength;
    }
}

class PressureConstraint {
    constructor(particles, targetPressure = 1.0) {
        this.particles = particles;
        this.targetPressure = targetPressure;
        this.restArea = this.calculateArea();
    }

    calculateArea() {
        let area = 0;
        const n = this.particles.length;
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += this.particles[i].x * this.particles[j].y;
            area -= this.particles[j].x * this.particles[i].y;
        }
        return Math.abs(area) / 2;
    }

    solve() {
        if (this.particles.length < 3) return;

        const currentArea = this.calculateArea();
        const areaDiff = this.restArea - currentArea;

        if (areaDiff === 0) return;

        const pressure = areaDiff * this.targetPressure * globalPressure * 0.001;
        const centerX = this.particles.reduce((sum, p) => sum + p.x, 0) / this.particles.length;
        const centerY = this.particles.reduce((sum, p) => sum + p.y, 0) / this.particles.length;

        for (const particle of this.particles) {
            if (particle.pinned) continue;

            const dx = particle.x - centerX;
            const dy = particle.y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                particle.x += (dx / dist) * pressure;
                particle.y += (dy / dist) * pressure;
            }
        }
    }
}

class SoftBody {
    constructor() {
        this.particles = [];
        this.constraints = [];
        this.pressureConstraint = null;
        this.triangles = [];
    }

    addParticle(x, y, mass = 1.0, pinned = false) {
        const particle = new Particle(x, y, mass, pinned);
        this.particles.push(particle);
        return particle;
    }

    addConstraint(p1, p2, stiffness = 1.0, type = 'structural') {
        const constraint = new Constraint(p1, p2, stiffness, type);
        this.constraints.push(constraint);
        return constraint;
    }

    addPressureConstraint(particles, targetPressure = 1.0) {
        this.pressureConstraint = new PressureConstraint(particles, targetPressure);
    }

    generateTriangles() {
        this.triangles = [];
        const n = this.particles.length;

        if (n < 3) return;

        // Simple triangulation for convex shapes
        for (let i = 1; i < n - 1; i++) {
            this.triangles.push([0, i, i + 1]);
        }
    }

    update(dt) {
        // Apply gravity
        for (const particle of this.particles) {
            particle.applyForce(0, gravity * particle.mass);
        }

        // Update particles
        for (const particle of this.particles) {
            particle.update(dt);
        }

        // Solve constraints iteratively
        for (let i = 0; i < iterations; i++) {
            for (const constraint of this.constraints) {
                constraint.solve();
            }

            if (this.pressureConstraint && globalPressure > 0) {
                this.pressureConstraint.solve();
            }
        }

        // Constrain to boundaries
        for (const particle of this.particles) {
            particle.constrain(canvas.width, canvas.height);
        }
    }

    getMaxStress() {
        let maxStress = 0;
        for (const constraint of this.constraints) {
            const stress = constraint.getStress();
            if (Math.abs(stress) > maxStress) {
                maxStress = Math.abs(stress);
            }
        }
        return maxStress;
    }
}

// Preset generators
function createJellyCube(centerX, centerY) {
    const body = new SoftBody();
    const gridSize = 8;
    const spacing = 30;
    const startX = centerX - (gridSize * spacing) / 2;
    const startY = centerY - (gridSize * spacing) / 2;

    // Create grid of particles
    const grid = [];
    for (let y = 0; y < gridSize; y++) {
        grid[y] = [];
        for (let x = 0; x < gridSize; x++) {
            const pinned = y === 0 && (x === 0 || x === gridSize - 1);
            const particle = body.addParticle(
                startX + x * spacing,
                startY + y * spacing,
                1.0,
                pinned
            );
            grid[y][x] = particle;
        }
    }

    // Structural constraints (adjacent)
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (x < gridSize - 1) {
                body.addConstraint(grid[y][x], grid[y][x + 1], 1.0, 'structural');
            }
            if (y < gridSize - 1) {
                body.addConstraint(grid[y][x], grid[y + 1][x], 1.0, 'structural');
            }
        }
    }

    // Shear constraints (diagonal)
    for (let y = 0; y < gridSize - 1; y++) {
        for (let x = 0; x < gridSize - 1; x++) {
            body.addConstraint(grid[y][x], grid[y + 1][x + 1], 0.7, 'shear');
            body.addConstraint(grid[y][x + 1], grid[y + 1][x], 0.7, 'shear');
        }
    }

    // Bend constraints (skip-one)
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (x < gridSize - 2) {
                body.addConstraint(grid[y][x], grid[y][x + 2], 0.3, 'bend');
            }
            if (y < gridSize - 2) {
                body.addConstraint(grid[y][x], grid[y + 2][x], 0.3, 'bend');
            }
        }
    }

    body.generateTriangles();
    return body;
}

function createBalloon(centerX, centerY) {
    const body = new SoftBody();
    const numPoints = 30;
    const radius = 100;

    // Create circular boundary
    const boundaryParticles = [];
    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const particle = body.addParticle(x, y, 1.0, false);
        boundaryParticles.push(particle);
    }

    // Connect boundary points
    for (let i = 0; i < numPoints; i++) {
        const next = (i + 1) % numPoints;
        body.addConstraint(boundaryParticles[i], boundaryParticles[next], 1.0, 'structural');

        // Cross bracing
        const opposite = (i + Math.floor(numPoints / 2)) % numPoints;
        body.addConstraint(boundaryParticles[i], boundaryParticles[opposite], 0.3, 'shear');
    }

    // Add internal cross bracing
    for (let i = 0; i < numPoints; i++) {
        const skip = (i + 5) % numPoints;
        body.addConstraint(boundaryParticles[i], boundaryParticles[skip], 0.5, 'shear');
    }

    // Add pressure constraint
    body.addPressureConstraint(boundaryParticles, 1.5);

    return body;
}

function createCloth(centerX, centerY) {
    const body = new SoftBody();
    const width = 15;
    const height = 15;
    const spacing = 20;
    const startX = centerX - (width * spacing) / 2;
    const startY = centerY - (height * spacing) / 4;

    // Create grid
    const grid = [];
    for (let y = 0; y < height; y++) {
        grid[y] = [];
        for (let x = 0; x < width; x++) {
            const pinned = y === 0 && x % 3 === 0;
            const particle = body.addParticle(
                startX + x * spacing,
                startY + y * spacing,
                0.5,
                pinned
            );
            grid[y][x] = particle;
        }
    }

    // Structural constraints
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (x < width - 1) {
                body.addConstraint(grid[y][x], grid[y][x + 1], 1.0, 'structural');
            }
            if (y < height - 1) {
                body.addConstraint(grid[y][x], grid[y + 1][x], 1.0, 'structural');
            }
        }
    }

    // Shear constraints
    for (let y = 0; y < height - 1; y++) {
        for (let x = 0; x < width - 1; x++) {
            body.addConstraint(grid[y][x], grid[y + 1][x + 1], 0.5, 'shear');
            body.addConstraint(grid[y][x + 1], grid[y + 1][x], 0.5, 'shear');
        }
    }

    body.generateTriangles();
    return body;
}

function createSoftSphere(centerX, centerY) {
    const body = new SoftBody();
    const numPoints = 20;
    const radius = 80;

    // Create boundary
    const boundaryParticles = [];
    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        const particle = body.addParticle(x, y, 1.0, false);
        boundaryParticles.push(particle);
    }

    // Connect boundary
    for (let i = 0; i < numPoints; i++) {
        const next = (i + 1) % numPoints;
        body.addConstraint(boundaryParticles[i], boundaryParticles[next], 1.0, 'structural');

        // Create web structure
        for (let j = i + 2; j < numPoints; j++) {
            if (j !== (i + numPoints - 1) % numPoints) {
                body.addConstraint(boundaryParticles[i], boundaryParticles[j], 0.2, 'shear');
            }
        }
    }

    // Add pressure
    body.addPressureConstraint(boundaryParticles, 1.2);

    return body;
}

function createChainLinks(centerX, centerY) {
    const body = new SoftBody();
    const numLinks = 12;
    const linkRadius = 25;
    const spacing = 60;

    const linkCenters = [];
    for (let i = 0; i < numLinks; i++) {
        linkCenters.push({ x: centerX + i * spacing - (numLinks * spacing) / 2, y: centerY });
    }

    // Create particles for each link
    for (let l = 0; l < numLinks; l++) {
        const cx = linkCenters[l].x;
        const cy = linkCenters[l].y;
        const pointsPerLink = 8;
        const linkParticles = [];

        for (let i = 0; i < pointsPerLink; i++) {
            const angle = (i / pointsPerLink) * Math.PI * 2;
            const x = cx + Math.cos(angle) * linkRadius;
            const y = cy + Math.sin(angle) * linkRadius;
            const pinned = l === 0 && i === 0;
            const particle = body.addParticle(x, y, 1.0, pinned);
            linkParticles.push(particle);
        }

        // Connect link particles
        for (let i = 0; i < pointsPerLink; i++) {
            const next = (i + 1) % pointsPerLink;
            body.addConstraint(linkParticles[i], linkParticles[next], 1.0, 'structural');

            // Cross bracing within link
            const opposite = (i + Math.floor(pointsPerLink / 2)) % pointsPerLink;
            body.addConstraint(linkParticles[i], linkParticles[opposite], 0.5, 'shear');
        }
    }

    return body;
}

function createStressBall(centerX, centerY) {
    const body = new SoftBody();
    const gridSize = 6;
    const spacing = 35;
    const startX = centerX - (gridSize * spacing) / 2;
    const startY = centerY - (gridSize * spacing) / 2;

    // Create grid
    const grid = [];
    for (let y = 0; y < gridSize; y++) {
        grid[y] = [];
        for (let x = 0; x < gridSize; x++) {
            // Pin center particle
            const isCenter = x === Math.floor(gridSize / 2) && y === Math.floor(gridSize / 2);
            const particle = body.addParticle(
                startX + x * spacing,
                startY + y * spacing,
                1.0,
                isCenter
            );
            grid[y][x] = particle;
        }
    }

    // Create dense web of constraints
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            // Connect to all nearby particles
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    if (dx === 0 && dy === 0) continue;

                    const ny = y + dy;
                    const nx = x + dx;

                    if (ny >= 0 && ny < gridSize && nx >= 0 && nx < gridSize) {
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const stiffness = 1.0 / (dist * dist);
                        body.addConstraint(grid[y][x], grid[ny][nx], stiffness * 0.5, 'structural');
                    }
                }
            }
        }
    }

    return body;
}

// Global simulation state
const canvas = document.getElementById('simulation');
const ctx = canvas.getContext('2d');

let currentBody = null;
let isPaused = false;
let selectedParticle = null;
let mouseX = 0;
let mouseY = 0;

// Simulation parameters
let gravity = 980;
let globalStiffness = 0.5;
let damping = 0.95;
let globalPressure = 0;
let iterations = 5;
let forceStrength = 500;

// Visualization settings
let showMesh = true;
let showConstraints = false;
let stressColoring = true;
let pressureViz = false;
let showTrails = false;

// FPS tracking
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

// Initialize canvas size
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

// Get stress color
function getStressColor(stress) {
    const maxStress = 0.5;
    const normalizedStress = Math.min(Math.abs(stress) / maxStress, 1);

    if (stress < 0) {
        // Compression: blue to cyan
        const r = Math.floor(0 * (1 - normalizedStress));
        const g = Math.floor(255 * normalizedStress);
        const b = Math.floor(200 + 55 * normalizedStress);
        return `rgb(${r}, ${g}, ${b})`;
    } else {
        // Tension: green to red
        const r = Math.floor(255 * normalizedStress);
        const g = Math.floor(255 * (1 - normalizedStress));
        const b = 0;
        return `rgb(${r}, ${g}, ${b})`;
    }
}

// Draw grid background
function drawBackground() {
    ctx.strokeStyle = '#1a1f3a';
    ctx.lineWidth = 1;

    const gridSize = 50;
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Draw soft body
function drawSoftBody(body) {
    if (!body) return;

    // Draw trails
    if (showTrails) {
        ctx.globalAlpha = 0.3;
        for (const particle of body.particles) {
            if (particle.trail.length < 2) continue;

            ctx.beginPath();
            ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
            for (let i = 1; i < particle.trail.length; i++) {
                ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
            }
            ctx.strokeStyle = '#667eea';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
    }

    // Draw mesh (triangles)
    if (showMesh && body.triangles.length > 0) {
        for (const triangle of body.triangles) {
            const [i1, i2, i3] = triangle;
            const p1 = body.particles[i1];
            const p2 = body.particles[i2];
            const p3 = body.particles[i3];

            // Calculate average stress
            let avgStress = 0;
            let count = 0;
            for (const constraint of body.constraints) {
                if ((constraint.p1 === p1 || constraint.p1 === p2 || constraint.p1 === p3) &&
                    (constraint.p2 === p1 || constraint.p2 === p2 || constraint.p2 === p3)) {
                    avgStress += constraint.getStress();
                    count++;
                }
            }
            if (count > 0) avgStress /= count;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.closePath();

            if (stressColoring) {
                const color = getStressColor(avgStress);
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.6;
            } else {
                ctx.fillStyle = '#667eea';
                ctx.globalAlpha = 0.4;
            }

            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }

    // Draw constraints
    if (showConstraints) {
        for (const constraint of body.constraints) {
            ctx.beginPath();
            ctx.moveTo(constraint.p1.x, constraint.p1.y);
            ctx.lineTo(constraint.p2.x, constraint.p2.y);

            if (stressColoring) {
                const stress = constraint.getStress();
                ctx.strokeStyle = getStressColor(stress);
            } else {
                ctx.strokeStyle = '#58a6ff';
            }

            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.5;
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
    }

    // Draw pressure visualization
    if (pressureViz && body.pressureConstraint && globalPressure > 0) {
        const particles = body.pressureConstraint.particles;
        if (particles.length > 2) {
            ctx.beginPath();
            ctx.moveTo(particles[0].x, particles[0].y);
            for (let i = 1; i < particles.length; i++) {
                ctx.lineTo(particles[i].x, particles[i].y);
            }
            ctx.closePath();

            const pressureAlpha = Math.min(globalPressure / 100, 0.5);
            ctx.fillStyle = `rgba(102, 126, 234, ${pressureAlpha})`;
            ctx.fill();
        }
    }

    // Draw particles
    for (const particle of body.particles) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.pinned ? 6 : 3, 0, Math.PI * 2);

        if (particle.pinned) {
            ctx.fillStyle = '#f59e0b';
        } else {
            ctx.fillStyle = '#58a6ff';
        }

        ctx.fill();

        // Glow effect for high stress
        if (stressColoring) {
            let particleStress = 0;
            let count = 0;
            for (const constraint of body.constraints) {
                if (constraint.p1 === particle || constraint.p2 === particle) {
                    particleStress += Math.abs(constraint.getStress());
                    count++;
                }
            }
            if (count > 0) particleStress /= count;

            if (particleStress > 0.3) {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, 8, 0, Math.PI * 2);
                const glowIntensity = Math.min((particleStress - 0.3) / 0.7, 1);
                ctx.fillStyle = `rgba(255, 100, 100, ${glowIntensity * 0.5})`;
                ctx.fill();
            }
        }
    }
}

// Main animation loop
function animate() {
    const currentTime = performance.now();
    frameCount++;

    if (currentTime - lastTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
    }

    // Clear canvas
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background
    drawBackground();

    // Update simulation
    if (!isPaused && currentBody) {
        const dt = 1 / 60;
        currentBody.update(dt);
    }

    // Draw body
    if (currentBody) {
        drawSoftBody(currentBody);
    }

    // Update stats
    if (currentBody) {
        document.getElementById('fps').textContent = fps;
        document.getElementById('vertices').textContent = currentBody.particles.length;
        document.getElementById('constraints').textContent = currentBody.constraints.length;
        document.getElementById('maxStress').textContent = currentBody.getMaxStress().toFixed(2);
    }

    requestAnimationFrame(animate);
}

// Mouse interaction
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    // Find nearest particle
    let minDist = 30;
    for (const particle of currentBody?.particles || []) {
        const dx = particle.x - mouseX;
        const dy = particle.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
            minDist = dist;
            selectedParticle = particle;
        }
    }

    // If no particle selected, apply force to nearby particles
    if (!selectedParticle && currentBody) {
        for (const particle of currentBody.particles) {
            const dx = particle.x - mouseX;
            const dy = particle.y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                const force = forceStrength / (dist + 1);
                particle.applyForce((dx / dist) * force, (dy / dist) * force);
            }
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    if (selectedParticle) {
        selectedParticle.x = mouseX;
        selectedParticle.y = mouseY;
    }
});

canvas.addEventListener('mouseup', () => {
    selectedParticle = null;
});

canvas.addEventListener('mouseleave', () => {
    selectedParticle = null;
});

// Control event listeners
document.getElementById('gravity').addEventListener('input', (e) => {
    gravity = parseFloat(e.target.value);
    e.target.nextElementSibling.textContent = gravity;
});

document.getElementById('stiffness').addEventListener('input', (e) => {
    globalStiffness = parseFloat(e.target.value) / 100;
    e.target.nextElementSibling.textContent = e.target.value + '%';
});

document.getElementById('damping').addEventListener('input', (e) => {
    damping = 1 - parseFloat(e.target.value) / 100;
    e.target.nextElementSibling.textContent = e.target.value + '%';
});

document.getElementById('pressure').addEventListener('input', (e) => {
    globalPressure = parseFloat(e.target.value);
    e.target.nextElementSibling.textContent = e.target.value + '%';
});

document.getElementById('iterations').addEventListener('input', (e) => {
    iterations = parseInt(e.target.value);
    e.target.nextElementSibling.textContent = iterations;
});

document.getElementById('forceStrength').addEventListener('input', (e) => {
    forceStrength = parseFloat(e.target.value);
    e.target.nextElementSibling.textContent = forceStrength;
});

document.getElementById('showMesh').addEventListener('change', (e) => {
    showMesh = e.target.checked;
});

document.getElementById('showConstraints').addEventListener('change', (e) => {
    showConstraints = e.target.checked;
});

document.getElementById('stressColoring').addEventListener('change', (e) => {
    stressColoring = e.target.checked;
});

document.getElementById('pressureViz').addEventListener('change', (e) => {
    pressureViz = e.target.checked;
});

document.getElementById('showTrails').addEventListener('change', (e) => {
    showTrails = e.target.checked;
});

document.getElementById('resetBtn').addEventListener('click', () => {
    loadPreset(currentPreset);
});

document.getElementById('pauseBtn').addEventListener('click', (e) => {
    isPaused = !isPaused;
    e.target.textContent = isPaused ? 'Resume' : 'Pause';
});

document.getElementById('explodeBtn').addEventListener('click', () => {
    if (currentBody) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        for (const particle of currentBody.particles) {
            const dx = particle.x - centerX;
            const dy = particle.y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy) + 1;
            const force = 5000;
            particle.applyForce((dx / dist) * force, (dy / dist) * force);
        }
    }
});

// Preset buttons
const presetButtons = document.querySelectorAll('.preset-btn');
let currentPreset = 'jelly';

presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPreset = btn.dataset.preset;
        loadPreset(currentPreset);
    });
});

function loadPreset(preset) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    switch (preset) {
        case 'jelly':
            currentBody = createJellyCube(centerX, centerY);
            break;
        case 'balloon':
            currentBody = createBalloon(centerX, centerY);
            break;
        case 'cloth':
            currentBody = createCloth(centerX, centerY);
            break;
        case 'sphere':
            currentBody = createSoftSphere(centerX, centerY);
            break;
        case 'chain':
            currentBody = createChainLinks(centerX, centerY);
            break;
        case 'stressball':
            currentBody = createStressBall(centerX, centerY);
            break;
    }

    // Reset pressure control
    if (preset !== 'balloon' && preset !== 'sphere') {
        document.getElementById('pressure').value = 0;
        globalPressure = 0;
        document.getElementById('pressure').nextElementSibling.textContent = '0%';
    }
}

// Initialize
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
loadPreset('jelly');
animate();

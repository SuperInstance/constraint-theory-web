/**
 * Emergent Swarm Intelligence - Boids Simulator
 *
 * Demonstrates complex global behavior emerging from simple local constraints.
 * Each boid operates under the FPS paradigm - only perceiving its local neighborhood.
 */

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    mult(n) {
        this.x *= n;
        this.y *= n;
        return this;
    }

    div(n) {
        if (n !== 0) {
            this.x /= n;
            this.y /= n;
        }
        return this;
    }

    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const m = this.mag();
        if (m > 0) {
            this.div(m);
        }
        return this;
    }

    limit(max) {
        if (this.mag() > max) {
            this.normalize();
            this.mult(max);
        }
        return this;
    }

    static dist(v1, v2) {
        const dx = v1.x - v2.x;
        const dy = v1.y - v2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static sub(v1, v2) {
        return new Vector(v1.x - v2.x, v1.y - v2.y);
    }

    copy() {
        return new Vector(this.x, this.y);
    }
}

class Boid {
    constructor(x, y, group = 0) {
        this.position = new Vector(x, y);
        const angle = Math.random() * Math.PI * 2;
        this.velocity = new Vector(Math.cos(angle), Math.sin(angle));
        this.acceleration = new Vector(0, 0);
        this.group = group;
        this.trail = [];
        this.maxTrailLength = 20;
    }

    // Main flocking behavior - combines all three forces
    flock(boids, params) {
        const perception = params.perceptionRadius;

        // Find nearby boids using spatial hash
        const nearby = this.spatialHash.query(this.position, perception);

        let separation = new Vector(0, 0);
        let alignment = new Vector(0, 0);
        let cohesion = new Vector(0, 0);
        let total = 0;

        for (let other of nearby) {
            if (other === this) continue;

            const d = Vector.dist(this.position, other.position);

            if (d < perception && d > 0) {
                // Separation: steer away from nearby boids
                const diff = Vector.sub(this.position, other.position);
                diff.div(d * d); // Weight by distance squared
                separation.add(diff);

                // Alignment: steer towards average heading
                alignment.add(other.velocity);

                // Cohesion: steer towards average position
                cohesion.add(other.position);

                total++;
            }
        }

        if (total > 0) {
            // Average separation
            separation.div(total);
            separation.normalize();
            separation.mult(params.maxSpeed);
            separation.sub(this.velocity);
            separation.limit(params.maxForce);

            // Average alignment
            alignment.div(total);
            alignment.normalize();
            alignment.mult(params.maxSpeed);
            alignment.sub(this.velocity);
            alignment.limit(params.maxForce);

            // Average cohesion
            cohesion.div(total);
            cohesion.sub(this.position);
            cohesion.normalize();
            cohesion.mult(params.maxSpeed);
            cohesion.sub(this.velocity);
            cohesion.limit(params.maxForce);
        }

        // Apply weights
        separation.mult(params.separation);
        alignment.mult(params.alignment);
        cohesion.mult(params.cohesion);

        this.acceleration.add(separation);
        this.acceleration.add(alignment);
        this.acceleration.add(cohesion);
    }

    // Avoid obstacles
    avoidObstacles(obstacles, params) {
        for (let obstacle of obstacles) {
            const d = Vector.dist(this.position, obstacle.position);
            if (d < obstacle.radius + params.perceptionRadius) {
                const diff = Vector.sub(this.position, obstacle.position);
                diff.normalize();
                diff.mult(params.maxSpeed);
                diff.sub(this.velocity);
                diff.limit(params.maxForce * 2);
                this.acceleration.add(diff);
            }
        }
    }

    // Flee from predator (mouse)
    fleeFrom(predatorPos, params) {
        const d = Vector.dist(this.position, predatorPos);
        if (d < params.perceptionRadius * 1.5) {
            const diff = Vector.sub(this.position, predatorPos);
            diff.normalize();
            diff.mult(params.maxSpeed * 1.5);
            diff.sub(this.velocity);
            diff.limit(params.maxForce * 3);
            this.acceleration.add(diff);
        }
    }

    // Apply optional wind force
    applyWind(windVector) {
        this.acceleration.add(windVector);
    }

    update(params) {
        // Update trail
        if (params.showTrails) {
            this.trail.push(this.position.copy());
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        }

        this.velocity.add(this.acceleration);
        this.velocity.limit(params.maxSpeed);
        this.position.add(this.velocity);
        this.acceleration.mult(0); // Reset acceleration

        // Wrap around edges - use canvas dimensions from global reference
        const canvasWidth = window.boidCanvasWidth || 800;
        const canvasHeight = window.boidCanvasHeight || 600;
        if (this.position.x > canvasWidth) this.position.x = 0;
        if (this.position.x < 0) this.position.x = canvasWidth;
        if (this.position.y > canvasHeight) this.position.y = 0;
        if (this.position.y < 0) this.position.y = canvasHeight;
    }

    draw(ctx, params, colorCache) {
        const speed = this.velocity.mag();
        const angle = Math.atan2(this.velocity.y, this.velocity.x);

        // Get color based on mode
        let color;
        if (params.colorMode === 'velocity') {
            // Color by velocity (blue=slow, red=fast)
            const t = Math.min(speed / params.maxSpeed, 1);
            color = `hsl(${240 - t * 240}, 80%, 60%)`;
        } else if (params.colorMode === 'group') {
            // Color by group
            const hue = (this.group * 137.5) % 360; // Golden angle for distribution
            color = `hsl(${hue}, 80%, 60%)`;
        } else if (params.colorMode === 'depth') {
            // Color by Y position (depth effect)
            const t = this.position.y / canvas.height;
            color = `hsl(${200 + t * 60}, 80%, ${40 + t * 30}%)`;
        } else {
            color = '#00ffaa';
        }

        // Draw trail
        if (params.showTrails && this.trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3;
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Draw boid as triangle
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-5, 5);
        ctx.lineTo(-5, -5);
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();

        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fill();

        ctx.restore();

        // Draw perception radius if enabled
        if (params.showPerception) {
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, params.perceptionRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
}

// Spatial hashing for O(n) neighbor lookup
class SpatialHash {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    clear() {
        this.grid.clear();
    }

    getKey(x, y) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        return `${cx},${cy}`;
    }

    insert(boid) {
        const key = this.getKey(boid.position.x, boid.position.y);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(boid);
    }

    query(position, radius) {
        const results = [];
        const minX = Math.floor((position.x - radius) / this.cellSize);
        const maxX = Math.floor((position.x + radius) / this.cellSize);
        const minY = Math.floor((position.y - radius) / this.cellSize);
        const maxY = Math.floor((position.y + radius) / this.cellSize);

        for (let x = minX; x <= maxX; x++) {
            for (let y = minY; y <= maxY; y++) {
                const key = `${x},${y}`;
                const cell = this.grid.get(key);
                if (cell) {
                    results.push(...cell);
                }
            }
        }
        return results;
    }
}

// Main simulation
class BoidSimulation {
    constructor() {
        this.canvas = document.getElementById('boidCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.boids = [];
        this.obstacles = [];
        this.spatialHash = new SpatialHash(50);
        this.mousePos = new Vector(0, 0);
        this.params = {
            boidCount: 200,
            separation: 1.5,
            alignment: 1.0,
            cohesion: 1.0,
            perceptionRadius: 50,
            maxSpeed: 4,
            maxForce: 0.1,
            colorMode: 'velocity',
            predatorMode: false,
            obstacleMode: false,
            showPerception: false,
            showTrails: true,
            windForce: false
        };
        this.windVector = new Vector(0.02, 0);
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;

        this.setupCanvas();
        this.setupControls();
        this.initBoids();
        this.animate();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = 600;
        
        // Store dimensions globally for Boid class edge wrapping
        window.boidCanvasWidth = this.canvas.width;
        window.boidCanvasHeight = this.canvas.height;

        window.addEventListener('resize', () => {
            this.canvas.width = container.clientWidth;
            window.boidCanvasWidth = this.canvas.width;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('click', (e) => {
            if (this.params.obstacleMode) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.obstacles.push({
                    position: new Vector(x, y),
                    radius: 30
                });
            }
        });
    }

    setupControls() {
        // Boid count
        const countSlider = document.getElementById('boidCount');
        const countValue = document.getElementById('countValue');
        countSlider.addEventListener('input', (e) => {
            this.params.boidCount = parseInt(e.target.value);
            countValue.textContent = this.params.boidCount;
            this.adjustBoidCount();
        });

        // Flocking forces
        const separationSlider = document.getElementById('separation');
        const separationValue = document.getElementById('separationValue');
        separationSlider.addEventListener('input', (e) => {
            this.params.separation = parseFloat(e.target.value);
            separationValue.textContent = this.params.separation.toFixed(1);
        });

        const alignmentSlider = document.getElementById('alignment');
        const alignmentValue = document.getElementById('alignmentValue');
        alignmentSlider.addEventListener('input', (e) => {
            this.params.alignment = parseFloat(e.target.value);
            alignmentValue.textContent = this.params.alignment.toFixed(1);
        });

        const cohesionSlider = document.getElementById('cohesion');
        const cohesionValue = document.getElementById('cohesionValue');
        cohesionSlider.addEventListener('input', (e) => {
            this.params.cohesion = parseFloat(e.target.value);
            cohesionValue.textContent = this.params.cohesion.toFixed(1);
        });

        // Perception & physics
        const radiusSlider = document.getElementById('perceptionRadius');
        const radiusValue = document.getElementById('radiusValue');
        radiusSlider.addEventListener('input', (e) => {
            this.params.perceptionRadius = parseInt(e.target.value);
            radiusValue.textContent = this.params.perceptionRadius;
        });

        const speedSlider = document.getElementById('maxSpeed');
        const speedValue = document.getElementById('speedValue');
        speedSlider.addEventListener('input', (e) => {
            this.params.maxSpeed = parseFloat(e.target.value);
            speedValue.textContent = this.params.maxSpeed;
        });

        const forceSlider = document.getElementById('maxForce');
        const forceValue = document.getElementById('forceValue');
        forceSlider.addEventListener('input', (e) => {
            this.params.maxForce = parseFloat(e.target.value);
            forceValue.textContent = this.params.maxForce;
        });

        // Interactive modes
        document.getElementById('predatorMode').addEventListener('change', (e) => {
            this.params.predatorMode = e.target.checked;
        });

        document.getElementById('obstacleMode').addEventListener('change', (e) => {
            this.params.obstacleMode = e.target.checked;
        });

        document.getElementById('showPerception').addEventListener('change', (e) => {
            this.params.showPerception = e.target.checked;
        });

        document.getElementById('showTrails').addEventListener('change', (e) => {
            this.params.showTrails = e.target.checked;
        });

        document.getElementById('windForce').addEventListener('change', (e) => {
            this.params.windForce = e.target.checked;
        });

        // Color mode
        document.getElementById('colorMode').addEventListener('change', (e) => {
            this.params.colorMode = e.target.value;
        });

        // Buttons
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.initBoids();
        });

        document.getElementById('clearObstacles').addEventListener('click', () => {
            this.obstacles = [];
        });
    }

    initBoids() {
        this.boids = [];
        for (let i = 0; i < this.params.boidCount; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const group = Math.floor(Math.random() * 3); // 3 groups for color mode
            this.boids.push(new Boid(x, y, group));
        }
    }

    adjustBoidCount() {
        while (this.boids.length < this.params.boidCount) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const group = Math.floor(Math.random() * 3);
            this.boids.push(new Boid(x, y, group));
        }
        while (this.boids.length > this.params.boidCount) {
            this.boids.pop();
        }
    }

    update() {
        // Rebuild spatial hash
        this.spatialHash.clear();
        for (let boid of this.boids) {
            boid.spatialHash = this.spatialHash;
            this.spatialHash.insert(boid);
        }

        // Update each boid
        for (let boid of this.boids) {
            boid.flock(this.boids, this.params);
            boid.avoidObstacles(this.obstacles, this.params);

            if (this.params.predatorMode) {
                boid.fleeFrom(this.mousePos, this.params);
            }

            if (this.params.windForce) {
                boid.applyWind(this.windVector);
            }

            boid.update(this.params);
        }
    }

    draw() {
        // Clear with fade effect for trails
        this.ctx.fillStyle = 'rgba(10, 10, 20, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw obstacles
        for (let obstacle of this.obstacles) {
            this.ctx.beginPath();
            this.ctx.arc(obstacle.position.x, obstacle.position.y, obstacle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
            this.ctx.fill();
            this.ctx.strokeStyle = '#ff6666';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Glow
            this.ctx.shadowColor = '#ff6666';
            this.ctx.shadowBlur = 20;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        }

        // Draw predator if active
        if (this.params.predatorMode) {
            this.ctx.beginPath();
            this.ctx.arc(this.mousePos.x, this.mousePos.y, 15, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.fill();

            // Pulsing effect
            const pulse = Math.sin(Date.now() / 200) * 5 + 20;
            this.ctx.beginPath();
            this.ctx.arc(this.mousePos.x, this.mousePos.y, pulse, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        // Draw boids
        const colorCache = {};
        for (let boid of this.boids) {
            boid.draw(this.ctx, this.params, colorCache);
        }
    }

    updateStats() {
        // Calculate FPS
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;
        }

        // Calculate average speed
        let totalSpeed = 0;
        for (let boid of this.boids) {
            totalSpeed += boid.velocity.mag();
        }
        const avgSpeed = totalSpeed / this.boids.length;

        // Count flocks (simplified - groups of nearby boids)
        const visited = new Set();
        let flockCount = 0;
        for (let boid of this.boids) {
            if (visited.has(boid)) continue;

            const nearby = this.spatialHash.query(boid.position, this.params.perceptionRadius);
            if (nearby.length > 1) {
                flockCount++;
                for (let other of nearby) {
                    visited.add(other);
                }
            }
        }

        // Update display
        document.getElementById('fps').textContent = this.fps;
        document.getElementById('boidCountDisplay').textContent = this.boids.length;
        document.getElementById('avgSpeed').textContent = avgSpeed.toFixed(2);
        document.getElementById('flockCount').textContent = flockCount;
    }

    animate() {
        this.update();
        this.draw();
        this.updateStats();
        requestAnimationFrame(() => this.animate());
    }
}

// Start simulation when page loads
window.addEventListener('load', () => {
    new BoidSimulation();
});

/**
 * Gravity Well Simulator
 * Visualizes gravitational potential fields and constraint-based physics
 */

class Body {
    constructor(x, y, vx, vy, mass) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.mass = mass;
        this.radius = Math.sqrt(mass) * 0.5;
        this.trail = [];
        this.color = this.generateColor();
    }
    
    generateColor() {
        const hue = Math.random() * 360;
        return `hsl(${hue}, 70%, 60%)`;
    }
    
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }
    
    addTrailPoint(maxLength) {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > maxLength) {
            this.trail.shift();
        }
    }
    
    kineticEnergy() {
        return 0.5 * this.mass * (this.vx * this.vx + this.vy * this.vy);
    }
}

class GravityWellSimulator {
    constructor() {
        this.canvas = document.getElementById('gravityCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Simulation state
        this.bodies = [];
        this.attractors = []; // Fixed gravity wells
        this.running = false;
        this.time = 0;
        
        // Physics parameters
        this.gravity = 9.8;
        this.timeScale = 1.0;
        this.trailLength = 100;
        
        // Visualization options
        this.showField = true;
        this.showTrails = true;
        this.showVectors = false;
        this.showConstraints = false;
        
        // Interaction state
        this.isDragging = false;
        this.dragStart = null;
        this.newMass = 100;
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        
        // Field visualization
        this.fieldImage = null;
        this.fieldNeedsUpdate = true;
        
        this.setupCanvas();
        this.setupControls();
        this.loadPreset('well');
        this.animate();
    }
    
    setupCanvas() {
        const container = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = container.clientWidth * dpr;
        this.canvas.height = 600 * dpr;
        this.canvas.style.width = container.clientWidth + 'px';
        this.canvas.style.height = '600px';
        this.ctx.scale(dpr, dpr);
        this.width = container.clientWidth;
        this.height = 600;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));
        
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.fieldNeedsUpdate = true;
        });
    }
    
    setupControls() {
        // Play/Pause
        document.getElementById('playPauseBtn').addEventListener('click', () => {
            this.running = !this.running;
            document.getElementById('playPauseBtn').textContent = this.running ? '⏸ Pause' : '▶ Play';
        });
        
        // Reset
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.loadPreset(this.currentPreset);
        });
        
        // Clear
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.bodies = [];
            this.attractors = [];
            this.time = 0;
            this.fieldNeedsUpdate = true;
        });
        
        // Sliders
        document.getElementById('gravity').addEventListener('input', (e) => {
            this.gravity = parseFloat(e.target.value);
            document.getElementById('gravityValue').textContent = this.gravity.toFixed(1);
            this.fieldNeedsUpdate = true;
        });
        
        document.getElementById('timeScale').addEventListener('input', (e) => {
            this.timeScale = parseFloat(e.target.value);
            document.getElementById('timeScaleValue').textContent = this.timeScale.toFixed(1);
        });
        
        document.getElementById('trailLength').addEventListener('input', (e) => {
            this.trailLength = parseInt(e.target.value);
            document.getElementById('trailLengthValue').textContent = this.trailLength;
        });
        
        document.getElementById('mass').addEventListener('input', (e) => {
            this.newMass = parseInt(e.target.value);
            document.getElementById('massValue').textContent = this.newMass;
        });
        
        // Checkboxes
        document.getElementById('showField').addEventListener('change', (e) => {
            this.showField = e.target.checked;
        });
        
        document.getElementById('showTrails').addEventListener('change', (e) => {
            this.showTrails = e.target.checked;
        });
        
        document.getElementById('showVectors').addEventListener('change', (e) => {
            this.showVectors = e.target.checked;
        });
        
        document.getElementById('showConstraints').addEventListener('change', (e) => {
            this.showConstraints = e.target.checked;
        });
        
        // Presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.loadPreset(btn.dataset.preset);
            });
        });
    }
    
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.centerX) / this.zoom + this.centerX - this.panX;
        const y = (e.clientY - rect.top - this.centerY) / this.zoom + this.centerY - this.panY;
        
        this.isDragging = true;
        this.dragStart = { x, y, clientX: e.clientX, clientY: e.clientY };
    }
    
    onMouseMove(e) {
        if (!this.isDragging) return;
        // Visual feedback handled in draw
    }
    
    onMouseUp(e) {
        if (!this.isDragging || !this.dragStart) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.centerX) / this.zoom + this.centerX - this.panX;
        const y = (e.clientY - rect.top - this.centerY) / this.zoom + this.centerY - this.panY;
        
        // Calculate velocity from drag
        const vx = (this.dragStart.x - x) * 0.5;
        const vy = (this.dragStart.y - y) * 0.5;
        
        this.bodies.push(new Body(this.dragStart.x, this.dragStart.y, vx, vy, this.newMass));
        this.fieldNeedsUpdate = true;
        
        this.isDragging = false;
        this.dragStart = null;
    }
    
    onWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom = Math.max(0.5, Math.min(3, this.zoom * zoomFactor));
        this.fieldNeedsUpdate = true;
    }
    
    loadPreset(preset) {
        this.currentPreset = preset;
        this.bodies = [];
        this.attractors = [];
        this.time = 0;
        this.fieldNeedsUpdate = true;
        
        switch (preset) {
            case 'well':
                // Central attractor
                this.attractors.push({
                    x: this.centerX,
                    y: this.centerY,
                    mass: 1000,
                    radius: 20,
                    color: '#00d9ff'
                });
                // Orbiting bodies
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const dist = 100 + i * 20;
                    const speed = Math.sqrt(this.gravity * 1000 / dist) * 0.8;
                    this.bodies.push(new Body(
                        this.centerX + Math.cos(angle) * dist,
                        this.centerY + Math.sin(angle) * dist,
                        -Math.sin(angle) * speed,
                        Math.cos(angle) * speed,
                        50
                    ));
                }
                break;
                
            case 'binary':
                // Two attractors
                this.attractors.push(
                    { x: this.centerX - 80, y: this.centerY, mass: 800, radius: 15, color: '#ff6b6b' },
                    { x: this.centerX + 80, y: this.centerY, mass: 800, radius: 15, color: '#00ff88' }
                );
                // Test particles
                for (let i = 0; i < 20; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 150 + Math.random() * 100;
                    this.bodies.push(new Body(
                        this.centerX + Math.cos(angle) * dist,
                        this.centerY + Math.sin(angle) * dist,
                        (Math.random() - 0.5) * 2,
                        (Math.random() - 0.5) * 2,
                        20
                    ));
                }
                break;
                
            case 'orbit':
                // Central mass
                this.attractors.push({
                    x: this.centerX,
                    y: this.centerY,
                    mass: 2000,
                    radius: 25,
                    color: '#00d9ff'
                });
                // Planets at different orbits
                const orbits = [80, 140, 200, 280];
                orbits.forEach((dist, i) => {
                    const speed = Math.sqrt(this.gravity * 2000 / dist);
                    const angle = Math.random() * Math.PI * 2;
                    this.bodies.push(new Body(
                        this.centerX + Math.cos(angle) * dist,
                        this.centerY + Math.sin(angle) * dist,
                        -Math.sin(angle) * speed,
                        Math.cos(angle) * speed,
                        30 + i * 10
                    ));
                });
                break;
                
            case 'grid':
                // Central attractor
                this.attractors.push({
                    x: this.centerX,
                    y: this.centerY - 50,
                    mass: 1500,
                    radius: 20,
                    color: '#00d9ff'
                });
                // Grid of bodies
                for (let i = 0; i < 5; i++) {
                    for (let j = 0; j < 5; j++) {
                        this.bodies.push(new Body(
                            this.centerX - 100 + i * 50,
                            50 + j * 30,
                            0, 0,
                            30
                        ));
                    }
                }
                break;
        }
    }
    
    update(dt) {
        const scaledDt = dt * this.timeScale;
        
        // Apply gravitational forces from attractors
        for (const body of this.bodies) {
            for (const attractor of this.attractors) {
                const dx = attractor.x - body.x;
                const dy = attractor.y - body.y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);
                
                if (dist < attractor.radius) continue; // Inside attractor
                
                // Gravitational force: F = G * m1 * m2 / r²
                const force = this.gravity * attractor.mass / distSq;
                const ax = (dx / dist) * force;
                const ay = (dy / dist) * force;
                
                body.vx += ax * scaledDt;
                body.vy += ay * scaledDt;
            }
            
            // Body-body interactions (simplified)
            for (const other of this.bodies) {
                if (other === body) continue;
                
                const dx = other.x - body.x;
                const dy = other.y - body.y;
                const distSq = dx * dx + dy * dy + 100; // Softening
                const dist = Math.sqrt(distSq);
                
                const force = this.gravity * other.mass / distSq * 0.01;
                body.vx += (dx / dist) * force * scaledDt;
                body.vy += (dy / dist) * force * scaledDt;
            }
        }
        
        // Update positions
        for (const body of this.bodies) {
            body.update(scaledDt);
            body.addTrailPoint(this.trailLength);
        }
        
        // Remove escaped bodies
        this.bodies = this.bodies.filter(b => 
            b.x > -500 && b.x < this.width + 500 &&
            b.y > -500 && b.y < this.height + 500
        );
        
        this.time += scaledDt;
    }
    
    drawPotentialField() {
        if (!this.showField || this.attractors.length === 0) return;
        
        const ctx = this.ctx;
        const resolution = 4;
        
        for (let px = 0; px < this.width; px += resolution) {
            for (let py = 0; py < this.height; py += resolution) {
                let potential = 0;
                
                for (const attractor of this.attractors) {
                    const dx = px - attractor.x;
                    const dy = py - attractor.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) + 1;
                    potential -= this.gravity * attractor.mass / dist;
                }
                
                // Map potential to color
                const normalized = Math.min(1, Math.abs(potential) / 500);
                const hue = 240 - normalized * 240; // Blue to red
                ctx.fillStyle = `hsla(${hue}, 50%, 20%, ${normalized * 0.3})`;
                ctx.fillRect(px, py, resolution, resolution);
            }
        }
    }
    
    draw() {
        const ctx = this.ctx;
        
        // Clear
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // Apply zoom and pan
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.centerX + this.panX, -this.centerY + this.panY);
        
        // Draw potential field
        this.drawPotentialField();
        
        // Draw constraint lines
        if (this.showConstraints) {
            for (const body of this.bodies) {
                for (const attractor of this.attractors) {
                    ctx.beginPath();
                    ctx.moveTo(body.x, body.y);
                    ctx.lineTo(attractor.x, attractor.y);
                    ctx.strokeStyle = 'rgba(255, 100, 100, 0.2)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
        
        // Draw trails
        if (this.showTrails) {
            for (const body of this.bodies) {
                if (body.trail.length < 2) continue;
                
                ctx.beginPath();
                ctx.moveTo(body.trail[0].x, body.trail[0].y);
                for (let i = 1; i < body.trail.length; i++) {
                    ctx.lineTo(body.trail[i].x, body.trail[i].y);
                }
                ctx.strokeStyle = body.color.replace(')', ', 0.3)').replace('hsl', 'hsla');
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
        
        // Draw attractors
        for (const attractor of this.attractors) {
            // Glow
            const gradient = ctx.createRadialGradient(
                attractor.x, attractor.y, 0,
                attractor.x, attractor.y, attractor.radius * 3
            );
            gradient.addColorStop(0, attractor.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(attractor.x, attractor.y, attractor.radius * 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Core
            ctx.beginPath();
            ctx.arc(attractor.x, attractor.y, attractor.radius, 0, Math.PI * 2);
            ctx.fillStyle = attractor.color;
            ctx.fill();
        }
        
        // Draw bodies
        for (const body of this.bodies) {
            // Glow
            const gradient = ctx.createRadialGradient(
                body.x, body.y, 0,
                body.x, body.y, body.radius * 2
            );
            gradient.addColorStop(0, body.color);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(body.x, body.y, body.radius * 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Core
            ctx.beginPath();
            ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
            ctx.fillStyle = body.color;
            ctx.fill();
            
            // Velocity vector
            if (this.showVectors) {
                const speed = Math.sqrt(body.vx * body.vx + body.vy * body.vy);
                if (speed > 0.1) {
                    ctx.beginPath();
                    ctx.moveTo(body.x, body.y);
                    ctx.lineTo(body.x + body.vx * 5, body.y + body.vy * 5);
                    ctx.strokeStyle = 'rgba(255, 255, 100, 0.7)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        }
        
        // Draw drag preview
        if (this.isDragging && this.dragStart) {
            const rect = this.canvas.getBoundingClientRect();
            const currentX = (event?.clientX || this.dragStart.clientX) - rect.left;
            const currentY = (event?.clientY || this.dragStart.clientY) - rect.top;
            
            ctx.beginPath();
            ctx.moveTo(this.dragStart.x, this.dragStart.y);
            ctx.lineTo(
                this.dragStart.x - (currentX - this.dragStart.clientX),
                this.dragStart.y - (currentY - this.dragStart.clientY)
            );
            ctx.strokeStyle = 'rgba(255, 255, 100, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            ctx.beginPath();
            ctx.arc(this.dragStart.x, this.dragStart.y, Math.sqrt(this.newMass) * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 100, 0.3)';
            ctx.fill();
        }
        
        ctx.restore();
        
        // Update stats
        document.getElementById('bodyCount').textContent = this.bodies.length;
        document.getElementById('timeValue').textContent = this.time.toFixed(1);
        
        const totalEnergy = this.bodies.reduce((sum, b) => sum + b.kineticEnergy(), 0);
        document.getElementById('energyValue').textContent = totalEnergy.toFixed(0);
    }
    
    animate() {
        if (this.running) {
            this.update(1 / 60);
        }
        
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new GravityWellSimulator();
});

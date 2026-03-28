/**
 * Particle Life Simulation
 * Emergent behavior from simple attraction/repulsion rules
 * Part of Constraint Theory - https://constraint-theory.superinstance.ai
 */

const NUM_TYPES = 6;
const COLORS = [
    '#ff6b6b',  // Red
    '#4ecdc4',  // Teal
    '#ffe66d',  // Yellow
    '#95e1d3',  // Mint
    '#f38181',  // Coral
    '#aa96da',  // Lavender
];

class Particle {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.type = type;
        this.radius = 3;
    }
}

class ParticleLifeSimulator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.matrix = this.getDefaultMatrix();
        
        // Physics parameters
        this.force = 1.0;
        this.radius = 80;
        this.friction = 0.05;
        this.particleCount = 300;
        
        // Visualization
        this.showTrails = false;
        this.showRadius = false;
        this.trailCanvas = null;
        this.trailCtx = null;
        
        // Interaction
        this.isPaused = false;
        this.isDragging = false;
        this.selectedCell = null;
        
        // Performance
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fps = 60;
        this.spatialHash = new Map();
        
        this.setupCanvas();
        this.setupMatrixUI();
        this.setupEventListeners();
        this.initParticles();
        this.animate();
    }
    
    setupCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = 600;
        
        // Create trail canvas
        this.trailCanvas = document.createElement('canvas');
        this.trailCanvas.width = this.canvas.width;
        this.trailCanvas.height = this.canvas.height;
        this.trailCtx = this.trailCanvas.getContext('2d');
    }
    
    getDefaultMatrix() {
        // Default: slight attraction with some repulsion
        const matrix = [];
        for (let i = 0; i < NUM_TYPES; i++) {
            matrix[i] = [];
            for (let j = 0; j < NUM_TYPES; j++) {
                // Attraction between same types
                if (i === j) {
                    matrix[i][j] = 0.5;
                } else {
                    // Random but balanced
                    matrix[i][j] = (Math.random() - 0.5) * 0.5;
                }
            }
        }
        return matrix;
    }
    
    getMatrixPresets() {
        return {
            default: () => this.getDefaultMatrix(),
            predator: () => {
                const m = Array(NUM_TYPES).fill(0).map(() => Array(NUM_TYPES).fill(0));
                m[0][1] = 1;   // Red chases Teal
                m[1][0] = -1;  // Teal flees Red
                m[1][2] = 0.5; // Teal attracted to Yellow
                m[2][1] = 0.3; // Yellow attracted to Teal
                m[3][4] = 0.8; // Mint attracted to Coral
                m[4][5] = 0.6; // Coral attracted to Lavender
                m[5][3] = 0.7; // Lavender attracted to Mint
                return m;
            },
            clusters: () => {
                const m = Array(NUM_TYPES).fill(0).map(() => Array(NUM_TYPES).fill(0));
                for (let i = 0; i < NUM_TYPES; i++) {
                    m[i][i] = 1; // Strong self-attraction
                    for (let j = 0; j < NUM_TYPES; j++) {
                        if (i !== j) m[i][j] = -0.3;
                    }
                }
                return m;
            },
            chains: () => {
                const m = Array(NUM_TYPES).fill(0).map(() => Array(NUM_TYPES).fill(0));
                for (let i = 0; i < NUM_TYPES; i++) {
                    m[i][(i + 1) % NUM_TYPES] = 0.8; // Attract to next
                    m[i][(i - 1 + NUM_TYPES) % NUM_TYPES] = 0.5; // Attract to previous
                }
                return m;
            },
            symmetry: () => {
                const m = Array(NUM_TYPES).fill(0).map(() => Array(NUM_TYPES).fill(0));
                for (let i = 0; i < NUM_TYPES; i++) {
                    for (let j = 0; j < NUM_TYPES; j++) {
                        const val = (Math.random() - 0.5) * 1.5;
                        m[i][j] = val;
                        m[j][i] = val; // Symmetric
                    }
                }
                return m;
            }
        };
    }
    
    setupMatrixUI() {
        const grid = document.getElementById('matrixGrid');
        grid.style.gridTemplateColumns = `repeat(${NUM_TYPES + 1}, 1fr)`;
        grid.innerHTML = '';
        
        // Header row
        const empty = document.createElement('div');
        empty.className = 'matrix-cell';
        empty.style.background = 'transparent';
        grid.appendChild(empty);
        
        for (let j = 0; j < NUM_TYPES; j++) {
            const header = document.createElement('div');
            header.className = 'matrix-cell';
            header.style.background = COLORS[j];
            grid.appendChild(header);
        }
        
        // Data rows
        for (let i = 0; i < NUM_TYPES; i++) {
            const rowHeader = document.createElement('div');
            rowHeader.className = 'matrix-cell';
            rowHeader.style.background = COLORS[i];
            grid.appendChild(rowHeader);
            
            for (let j = 0; j < NUM_TYPES; j++) {
                const cell = document.createElement('div');
                cell.className = 'matrix-cell';
                cell.dataset.i = i;
                cell.dataset.j = j;
                cell.addEventListener('click', () => this.cycleMatrixValue(i, j));
                cell.addEventListener('mousedown', (e) => {
                    this.isDragging = true;
                    this.selectedCell = { i, j };
                });
                cell.addEventListener('mouseenter', () => {
                    if (this.isDragging && this.selectedCell) {
                        // Allow painting
                    }
                });
                grid.appendChild(cell);
            }
        }
        
        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.selectedCell = null;
        });
        
        this.updateMatrixUI();
    }
    
    cycleMatrixValue(i, j) {
        // Cycle through: -1 -> -0.5 -> 0 -> 0.5 -> 1 -> -1
        const values = [-1, -0.5, 0, 0.5, 1];
        const current = this.matrix[i][j];
        const idx = values.findIndex(v => Math.abs(v - current) < 0.1);
        this.matrix[i][j] = values[(idx + 1) % values.length];
        this.updateMatrixUI();
    }
    
    updateMatrixUI() {
        const cells = document.querySelectorAll('.matrix-cell[data-i]');
        cells.forEach(cell => {
            const i = parseInt(cell.dataset.i);
            const j = parseInt(cell.dataset.j);
            const val = this.matrix[i][j];
            
            if (val > 0) {
                cell.style.background = `rgba(0, 255, 136, ${Math.abs(val)})`;
                cell.style.color = '#000';
            } else if (val < 0) {
                cell.style.background = `rgba(255, 107, 107, ${Math.abs(val)})`;
                cell.style.color = '#000';
            } else {
                cell.style.background = '#222';
                cell.style.color = '#888';
            }
            cell.textContent = val !== 0 ? val.toFixed(1) : '·';
        });
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.setupCanvas();
        });
        
        // Controls
        document.getElementById('force').addEventListener('input', (e) => {
            this.force = parseFloat(e.target.value);
            document.getElementById('forceValue').textContent = this.force.toFixed(1);
        });
        
        document.getElementById('radius').addEventListener('input', (e) => {
            this.radius = parseInt(e.target.value);
            document.getElementById('radiusValue').textContent = this.radius;
        });
        
        document.getElementById('friction').addEventListener('input', (e) => {
            this.friction = parseFloat(e.target.value);
            document.getElementById('frictionValue').textContent = this.friction.toFixed(2);
        });
        
        document.getElementById('particleCount').addEventListener('input', (e) => {
            this.particleCount = parseInt(e.target.value);
            document.getElementById('countValue').textContent = this.particleCount;
            this.initParticles();
        });
        
        document.getElementById('showTrails').addEventListener('change', (e) => {
            this.showTrails = e.target.checked;
            if (!this.showTrails) {
                this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
            }
        });
        
        document.getElementById('showRadius').addEventListener('change', (e) => {
            this.showRadius = e.target.checked;
        });
        
        document.getElementById('randomizeMatrix').addEventListener('click', () => {
            this.matrix = this.getDefaultMatrix();
            this.updateMatrixUI();
        });
        
        document.getElementById('pauseBtn').addEventListener('click', (e) => {
            this.isPaused = !this.isPaused;
            e.target.textContent = this.isPaused ? 'Resume' : 'Pause';
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.initParticles();
            this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
        });
        
        // Presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const preset = btn.dataset.preset;
                const presets = this.getMatrixPresets();
                if (presets[preset]) {
                    this.matrix = presets[preset]();
                    this.updateMatrixUI();
                    this.initParticles();
                }
            });
        });
    }
    
    initParticles() {
        this.particles = [];
        const perType = Math.floor(this.particleCount / NUM_TYPES);
        
        for (let type = 0; type < NUM_TYPES; type++) {
            for (let i = 0; i < perType; i++) {
                const x = Math.random() * this.canvas.width;
                const y = Math.random() * this.canvas.height;
                this.particles.push(new Particle(x, y, type));
            }
        }
    }
    
    buildSpatialHash() {
        this.spatialHash.clear();
        const cellSize = this.radius;
        
        for (const particle of this.particles) {
            const cx = Math.floor(particle.x / cellSize);
            const cy = Math.floor(particle.y / cellSize);
            const key = `${cx},${cy}`;
            
            if (!this.spatialHash.has(key)) {
                this.spatialHash.set(key, []);
            }
            this.spatialHash.get(key).push(particle);
        }
    }
    
    getNeighbors(particle) {
        const neighbors = [];
        const cellSize = this.radius;
        const cx = Math.floor(particle.x / cellSize);
        const cy = Math.floor(particle.y / cellSize);
        
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = `${cx + dx},${cy + dy}`;
                const cell = this.spatialHash.get(key);
                if (cell) {
                    neighbors.push(...cell);
                }
            }
        }
        
        return neighbors;
    }
    
    update() {
        this.buildSpatialHash();
        
        for (const particle of this.particles) {
            let fx = 0;
            let fy = 0;
            
            const neighbors = this.getNeighbors(particle);
            
            for (const other of neighbors) {
                if (particle === other) continue;
                
                const dx = other.x - particle.x;
                const dy = other.y - particle.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < this.radius && dist > 0) {
                    // Get interaction strength from matrix
                    const interaction = this.matrix[particle.type][other.type];
                    
                    // Calculate force with distance falloff
                    let forceMag = 0;
                    
                    if (dist < this.radius * 0.3) {
                        // Repulsion zone (too close)
                        forceMag = dist / (this.radius * 0.3) - 1;
                    } else {
                        // Interaction zone
                        forceMag = interaction * (1 - Math.abs(2 * dist / this.radius - 1 - 0.3) / 0.7);
                    }
                    
                    fx += (dx / dist) * forceMag * this.force;
                    fy += (dy / dist) * forceMag * this.force;
                }
            }
            
            // Apply forces
            particle.vx += fx * 0.1;
            particle.vy += fy * 0.1;
            
            // Apply friction
            particle.vx *= (1 - this.friction);
            particle.vy *= (1 - this.friction);
            
            // Limit velocity
            const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            if (speed > 4) {
                particle.vx = (particle.vx / speed) * 4;
                particle.vy = (particle.vy / speed) * 4;
            }
        }
        
        // Update positions
        for (const particle of this.particles) {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around
            if (particle.x < 0) particle.x += this.canvas.width;
            if (particle.x > this.canvas.width) particle.x -= this.canvas.width;
            if (particle.y < 0) particle.y += this.canvas.height;
            if (particle.y > this.canvas.height) particle.y -= this.canvas.height;
        }
    }
    
    render() {
        const ctx = this.ctx;
        
        // Draw trails
        if (this.showTrails) {
            // Fade existing trails
            this.trailCtx.fillStyle = 'rgba(10, 14, 20, 0.05)';
            this.trailCtx.fillRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
            
            // Draw new trail points
            for (const particle of this.particles) {
                this.trailCtx.fillStyle = COLORS[particle.type];
                this.trailCtx.beginPath();
                this.trailCtx.arc(particle.x, particle.y, 1, 0, Math.PI * 2);
                this.trailCtx.fill();
            }
            
            ctx.drawImage(this.trailCanvas, 0, 0);
        } else {
            // Clear canvas
            ctx.fillStyle = '#0a0e14';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Draw particles
        for (const particle of this.particles) {
            const color = COLORS[particle.type];
            
            // Glow
            const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.radius * 3
            );
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius * 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Core
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw interaction radius (for first particle type)
        if (this.showRadius && this.particles.length > 0) {
            const p = this.particles[0];
            ctx.beginPath();
            ctx.arc(p.x, p.y, this.radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Inner repulsion radius
            ctx.beginPath();
            ctx.arc(p.x, p.y, this.radius * 0.3, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,100,100,0.3)';
            ctx.stroke();
        }
    }
    
    updateStats() {
        // Calculate average speed
        let totalSpeed = 0;
        for (const particle of this.particles) {
            totalSpeed += Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        }
        const avgSpeed = totalSpeed / this.particles.length;
        
        document.getElementById('particleDisplay').textContent = this.particles.length;
        document.getElementById('avgSpeed').textContent = avgSpeed.toFixed(2);
    }
    
    animate() {
        // FPS
        const currentTime = performance.now();
        this.frameCount++;
        if (currentTime - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
            document.getElementById('fps').textContent = this.fps;
        }
        
        if (!this.isPaused) {
            this.update();
        }
        
        this.render();
        this.updateStats();
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('lifeCanvas');
    new ParticleLifeSimulator(canvas);
});

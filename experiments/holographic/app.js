// Holographic Projection Simulator
// Demonstrates how 3D information can be projected into 2D with depth cues preserved

class HolographicSimulator {
    constructor() {
        this.scene3D = document.getElementById('scene3D');
        this.hologram2D = document.getElementById('hologram2D');
        this.ctx3D = this.scene3D.getContext('2d');
        this.ctx2D = this.hologram2D.getContext('2d');

        this.particles = [];
        this.particleCount = 1500;
        this.animationId = null;
        this.isAnimating = true;
        this.time = 0;

        // Camera and projection settings
        this.viewingAngle = 0;
        this.projectionType = 'perspective';
        this.depthEncoding = 'color';
        this.animationSpeed = 0.5;
        this.sceneType = 'knot';

        // Visual effects
        this.showScanlines = true;
        this.showInterference = true;
        this.showGrid = false;
        this.pulseGlow = true;

        // Performance tracking
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fps = 60;

        this.initializeControls();
        this.generateScene();
        this.startAnimation();
    }

    initializeControls() {
        // Scene selection
        document.getElementById('sceneSelect').addEventListener('change', (e) => {
            this.sceneType = e.target.value;
            this.generateScene();
        });

        // Projection type
        document.getElementById('projectionType').addEventListener('change', (e) => {
            this.projectionType = e.target.value;
        });

        // Depth encoding
        document.getElementById('depthEncoding').addEventListener('change', (e) => {
            this.depthEncoding = e.target.value;
        });

        // Viewing angle
        document.getElementById('viewingAngle').addEventListener('input', (e) => {
            this.viewingAngle = parseFloat(e.target.value) * Math.PI / 180;
            document.getElementById('angleValue').textContent = e.target.value + '°';
        });

        // Animation speed
        document.getElementById('animationSpeed').addEventListener('input', (e) => {
            this.animationSpeed = e.target.value / 100;
        });

        // Particle count
        document.getElementById('particleCount').addEventListener('input', (e) => {
            this.particleCount = parseInt(e.target.value);
            document.getElementById('particleStat').textContent = this.particleCount;
            this.generateScene();
        });

        // Visual effects checkboxes
        document.getElementById('showScanlines').addEventListener('change', (e) => {
            this.showScanlines = e.target.checked;
        });

        document.getElementById('showInterference').addEventListener('change', (e) => {
            this.showInterference = e.target.checked;
        });

        document.getElementById('showGrid').addEventListener('change', (e) => {
            this.showGrid = e.target.checked;
        });

        document.getElementById('pulseGlow').addEventListener('change', (e) => {
            this.pulseGlow = e.target.checked;
        });

        // Buttons
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.viewingAngle = 0;
            document.getElementById('viewingAngle').value = 0;
            document.getElementById('angleValue').textContent = '0°';
            this.time = 0;
        });

        document.getElementById('animateBtn').addEventListener('click', (e) => {
            this.isAnimating = !this.isAnimating;
            e.target.textContent = this.isAnimating ? 'Animate' : 'Paused';
            e.target.classList.toggle('active', this.isAnimating);
            if (this.isAnimating) {
                this.startAnimation();
            } else {
                cancelAnimationFrame(this.animationId);
            }
        });

        // Mouse parallax effect
        this.hologram2D.addEventListener('mousemove', (e) => {
            const rect = this.hologram2D.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
            const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
            this.mouseParallax = { x: mouseX * 0.3, y: mouseY * 0.3 };
        });
    }

    generateScene() {
        this.particles = [];
        const scale = 100;
        const centerX = 0, centerY = 0, centerZ = 0;

        switch (this.sceneType) {
            case 'cube':
                this.generateCube(scale);
                break;
            case 'sphere':
                this.generateSphere(scale, this.particleCount);
                break;
            case 'torus':
                this.generateTorus(scale, this.particleCount);
                break;
            case 'knot':
                this.generateTrefoilKnot(scale, this.particleCount);
                break;
            case 'helix':
                this.generateDoubleHelix(scale, this.particleCount);
                break;
            case 'text':
                this.generate3DText(scale);
                break;
            case 'custom':
                this.generateCustomWave(scale, this.particleCount);
                break;
        }

        // Calculate depth range
        const depths = this.particles.map(p => p.z);
        this.minDepth = Math.min(...depths);
        this.maxDepth = Math.max(...depths);
        document.getElementById('depthStat').textContent =
            `${Math.round(this.minDepth)} to ${Math.round(this.maxDepth)}`;
    }

    generateCube(scale) {
        const step = scale / 5;
        for (let x = -scale; x <= scale; x += step) {
            for (let y = -scale; y <= scale; y += step) {
                for (let z = -scale; z <= scale; z += step) {
                    // Only generate surface particles
                    if (Math.abs(x) === scale || Math.abs(y) === scale || Math.abs(z) === scale) {
                        this.particles.push({ x, y, z, originalX: x, originalY: y, originalZ: z });
                    }
                }
            }
        }
    }

    generateSphere(scale, count) {
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const r = scale;

            this.particles.push({
                x: r * Math.sin(phi) * Math.cos(theta),
                y: r * Math.sin(phi) * Math.sin(theta),
                z: r * Math.cos(phi),
                originalX: 0,
                originalY: 0,
                originalZ: 0
            });
        }
    }

    generateTorus(scale, count) {
        const R = scale * 0.8; // Major radius
        const r = scale * 0.3; // Minor radius

        for (let i = 0; i < count; i++) {
            const u = Math.random() * Math.PI * 2;
            const v = Math.random() * Math.PI * 2;

            this.particles.push({
                x: (R + r * Math.cos(v)) * Math.cos(u),
                y: (R + r * Math.cos(v)) * Math.sin(u),
                z: r * Math.sin(v),
                originalX: 0,
                originalY: 0,
                originalZ: 0
            });
        }
    }

    generateTrefoilKnot(scale, count) {
        for (let i = 0; i < count; i++) {
            const t = (i / count) * Math.PI * 2 * 3; // Three loops

            // Trefoil knot parametric equations
            const x = scale * Math.sin(t) + 2 * Math.sin(2 * t) / 3;
            const y = scale * Math.cos(t) - 2 * Math.cos(2 * t) / 3;
            const z = -scale * Math.sin(3 * t) / 3;

            // Add some thickness
            const offset = scale * 0.1;
            const ox = (Math.random() - 0.5) * offset;
            const oy = (Math.random() - 0.5) * offset;
            const oz = (Math.random() - 0.5) * offset;

            this.particles.push({
                x: x + ox,
                y: y + oy,
                z: z + oz,
                originalX: x,
                originalY: y,
                originalZ: z
            });
        }
    }

    generateDoubleHelix(scale, count) {
        const helixCount = Math.floor(count / 2);

        for (let i = 0; i < helixCount; i++) {
            const t = (i / helixCount) * Math.PI * 6;
            const radius = scale * 0.3;

            // First strand
            this.particles.push({
                x: radius * Math.cos(t),
                y: (i / helixCount) * scale * 2 - scale,
                z: radius * Math.sin(t),
                originalX: 0,
                originalY: 0,
                originalZ: 0
            });

            // Second strand (offset by PI)
            this.particles.push({
                x: radius * Math.cos(t + Math.PI),
                y: (i / helixCount) * scale * 2 - scale,
                z: radius * Math.sin(t + Math.PI),
                originalX: 0,
                originalY: 0,
                originalZ: 0
            });
        }
    }

    generate3DText(scale) {
        // Generate particles forming "3D" text
        const textScale = scale / 100;

        // Simple 3D text representation using particles
        const letterPatterns = {
            '3': [
                [1,1,1], [1,0,0], [1,1,1], [1,0,0], [1,1,1]
            ],
            'D': [
                [1,1,0], [1,0,1], [1,0,1], [1,0,1], [1,1,0]
            ]
        };

        const letters = ['3', 'D'];
        let xOffset = -scale * 1.5;

        letters.forEach(letter => {
            const pattern = letterPatterns[letter];
            pattern.forEach((row, rowIndex) => {
                row.forEach((cell, colIndex) => {
                    if (cell) {
                        for (let z = -scale/2; z <= scale/2; z += scale/10) {
                            this.particles.push({
                                x: xOffset + colIndex * scale * 0.4,
                                y: (rowIndex - 2) * scale * 0.4,
                                z: z,
                                originalX: 0,
                                originalY: 0,
                                originalZ: 0
                            });
                        }
                    }
                });
            });
            xOffset += scale * 1.5;
        });
    }

    generateCustomWave(scale, count) {
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * scale * 2;
            const y = (Math.random() - 0.5) * scale * 2;

            // Create wave pattern
            const z = scale * 0.3 * Math.sin(x / scale * 3) * Math.cos(y / scale * 3);

            this.particles.push({
                x, y, z,
                originalX: x,
                originalY: y,
                originalZ: z
            });
        }
    }

    project3DTo2D(particle, canvas, isHologram = false) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const scale = 2;

        // Apply rotation
        let x = particle.x;
        let y = particle.y;
        let z = particle.z;

        // Rotate around Y axis (viewing angle)
        const cosY = Math.cos(this.viewingAngle);
        const sinY = Math.sin(this.viewingAngle);
        const tempX = x * cosY - z * sinY;
        const tempZ = x * sinY + z * cosY;
        x = tempX;
        z = tempZ;

        // Add animation rotation
        if (this.isAnimating) {
            const cosA = Math.cos(this.time * 0.5);
            const sinA = Math.sin(this.time * 0.5);
            const tempX2 = x * cosA - y * sinA;
            const tempY2 = x * sinA + y * cosA;
            x = tempX2;
            y = tempY2;
        }

        // Apply mouse parallax for hologram
        if (isHologram && this.mouseParallax) {
            x += this.mouseParallax.x * 50;
            y += this.mouseParallax.y * 50;
        }

        // Project to 2D
        let projectedX, projectedY, depth;

        if (this.projectionType === 'orthographic' || !isHologram) {
            // Orthographic projection
            projectedX = centerX + x * scale;
            projectedY = centerY + y * scale;
            depth = z;
        } else {
            // Perspective projection
            const fov = 500;
            const distance = 400;
            const factor = fov / (distance + z);
            projectedX = centerX + x * factor;
            projectedY = centerY + y * factor;
            depth = z;
        }

        return { x: projectedX, y: projectedY, depth, originalZ: particle.z };
    }

    getDepthColor(depth, minDepth, maxDepth) {
        const normalizedDepth = (depth - minDepth) / (maxDepth - minDepth);

        switch (this.depthEncoding) {
            case 'color':
                // Warm (near) to cool (far)
                if (normalizedDepth < 0.5) {
                    // Red to yellow
                    const t = normalizedDepth * 2;
                    return `rgb(255, ${Math.round(255 * t)}, ${Math.round(100 * t)})`;
                } else {
                    // Yellow to blue
                    const t = (normalizedDepth - 0.5) * 2;
                    return `rgb(${Math.round(255 * (1 - t))}, ${Math.round(255 * (1 - t * 0.5))}, ${Math.round(100 + 155 * t)})`;
                }

            case 'brightness':
                const brightness = Math.round(255 * (1 - normalizedDepth * 0.7));
                return `rgb(${brightness}, ${brightness}, ${Math.round(brightness * 1.2)})`;

            case 'size':
                return '#00ffff'; // Color doesn't change, size does

            case 'opacity':
                return `rgba(0, 255, 255, ${1 - normalizedDepth * 0.8})`;

            default:
                return '#00ffff';
        }
    }

    drawInterferencePattern(ctx, canvas) {
        if (!this.showInterference) return;

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const x = (i / 4) % canvas.width;
            const y = Math.floor((i / 4) / canvas.width);

            // Create interference pattern
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);

            const interference = Math.sin(distance * 0.1 - this.time * 2) * 0.5 + 0.5;

            // Add subtle interference
            data[i] = Math.min(255, data[i] + interference * 20);     // R
            data[i + 1] = Math.min(255, data[i + 1] + interference * 30); // G
            data[i + 2] = Math.min(255, data[i + 2] + interference * 40); // B
        }

        ctx.putImageData(imageData, 0, 0);
    }

    drawGrid(ctx, canvas) {
        if (!this.showGrid) return;

        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
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

    render3DScene() {
        const ctx = this.ctx3D;
        const canvas = this.scene3D;

        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid if enabled
        this.drawGrid(ctx, canvas);

        // Sort particles by depth for proper occlusion
        const projectedParticles = this.particles.map(p => this.project3DTo2D(p, canvas, false));
        projectedParticles.sort((a, b) => a.depth - b.depth);

        // Draw particles
        projectedParticles.forEach(p => {
            const depth = p.depth;
            const normalizedDepth = (depth - this.minDepth) / (this.maxDepth - this.minDepth);
            const size = Math.max(1, 4 * (1 - normalizedDepth * 0.5));

            const color = this.getDepthColor(depth, this.minDepth, this.maxDepth);

            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            // Add glow effect
            if (this.pulseGlow) {
                const glowSize = size * 2;
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
                gradient.addColorStop(0, color.replace('rgb', 'rgba').replace(')', ', 0.3)'));
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    renderHologram() {
        const ctx = this.ctx2D;
        const canvas = this.hologram2D;

        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw interference pattern background
        this.drawInterferencePattern(ctx, canvas);

        // Draw grid if enabled
        this.drawGrid(ctx, canvas);

        // Project and sort particles
        const projectedParticles = this.particles.map(p => this.project3DTo2D(p, canvas, true));
        projectedParticles.sort((a, b) => a.depth - b.depth);

        // Draw particles with holographic effects
        projectedParticles.forEach((p, index) => {
            const depth = p.depth;
            const normalizedDepth = (depth - this.minDepth) / (this.maxDepth - this.minDepth);

            let size, color;

            switch (this.depthEncoding) {
                case 'size':
                    size = Math.max(1, 6 * (1 - normalizedDepth));
                    color = this.getDepthColor(depth, this.minDepth, this.maxDepth);
                    break;
                default:
                    size = Math.max(1, 3);
                    color = this.getDepthColor(depth, this.minDepth, this.maxDepth);
            }

            // Add pulsing effect
            if (this.pulseGlow) {
                const pulse = Math.sin(this.time * 3 + index * 0.01) * 0.3 + 0.7;
                size *= pulse;
            }

            // Draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            // Add holographic glow
            const glowSize = size * 3;
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);

            if (color.startsWith('rgba')) {
                gradient.addColorStop(0, color);
                gradient.addColorStop(0.5, color.replace(/[\d.]+\)$/g, '0.1)'));
                gradient.addColorStop(1, 'transparent');
            } else {
                gradient.addColorStop(0, color.replace('rgb', 'rgba').replace(')', ', 0.6)'));
                gradient.addColorStop(0.5, color.replace('rgb', 'rgba').replace(')', ', 0.2)'));
                gradient.addColorStop(1, 'transparent');
            }

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
            ctx.fill();
        });

        // Add scanline effect
        if (this.showScanlines) {
            ctx.fillStyle = 'rgba(0, 255, 255, 0.02)';
            const scanlineY = (this.time * 50) % canvas.height;
            ctx.fillRect(0, scanlineY, canvas.width, 3);
        }

        // Add hologram border effect
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    }

    updateStats() {
        this.frameCount++;
        const currentTime = performance.now();

        if (currentTime - this.lastFrameTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFrameTime = currentTime;
            document.getElementById('fpsStat').textContent = this.fps + ' FPS';
        }
    }

    animate() {
        if (this.isAnimating) {
            this.time += 0.016 * this.animationSpeed;
        }

        this.render3DScene();
        this.renderHologram();
        this.updateStats();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    startAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.animate();
    }
}

// Initialize the simulator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new HolographicSimulator();
});

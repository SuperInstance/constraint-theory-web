// Strange Attractors Simulator
// Demonstrates deterministic chaos in Constraint Theory research

class AttractorSimulator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();

        // Simulation state
        this.position = { x: 0.1, y: 0, z: 0 };
        this.trail = [];
        this.iterations = 0;
        this.isRunning = true;
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };

        // Settings
        this.dt = 0.005;
        this.iterationsPerFrame = 100;
        this.trailLength = 1000;
        this.colorMode = 'velocity';
        this.lineWidth = 1.5;
        this.glowIntensity = 0.3;

        // 3D projection
        this.rotation = { x: 0, y: 0 };
        this.zoom = 1.0;
        this.autoRotate = true;
        this.autoRotateSpeed = 0.2;

        // Current attractor
        this.attractorType = 'lorenz';
        this.parameters = this.getDefaultParameters('lorenz');

        // Lyapunov estimation
        this.lyapunovSum = 0;
        this.lyapunovCount = 0;
        this.lyapunovEstimate = 0;

        // Performance monitoring
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fps = 60;

        this.setupEventListeners();
        this.reset();
        this.animate();
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.scale = Math.min(this.canvas.width, this.canvas.height) / 100;
    }

    getDefaultParameters(type) {
        const defaults = {
            lorenz: { sigma: 10, rho: 28, beta: 8/3 },
            rossler: { a: 0.2, b: 0.2, c: 5.7 },
            chen: { a: 40, b: 3, c: 28 },
            thomas: { b: 0.208186 },
            aizawa: { a: 0.95, b: 0.7, c: 0.6, d: 3.5, e: 0.25, f: 0.1 },
            halvorsen: { a: 1.89 },
            custom: { a: 10, b: 28, c: 8/3 }
        };
        return { ...defaults[type] };
    }

    getAttractorInfo(type) {
        const info = {
            lorenz: {
                name: 'Lorenz Attractor',
                discoverer: 'Edward Lorenz (1963)',
                description: 'Discovered while studying atmospheric convection. Classic example of deterministic chaos.',
                equations: 'dx/dt = σ(y - x)<br>dy/dt = x(ρ - z) - y<br>dz/dt = xy - βz'
            },
            rossler: {
                name: 'Rössler Attractor',
                discoverer: 'Otto Rössler (1976)',
                description: 'Designed to be simpler than Lorenz while exhibiting chaotic behavior.',
                equations: 'dx/dt = -(y + z)<br>dy/dt = x + ay<br>dz/dt = b + z(x - c)'
            },
            chen: {
                name: 'Chen Attractor',
                discoverer: 'Guanrong Chen (1999)',
                description: 'Double-scroll attractor with anti-symmetric structure.',
                equations: 'dx/dt = a(y - x)<br>dy/dt = (c - a)x - xz + cy<br>dz/dt = xy - bz'
            },
            thomas: {
                name: 'Thomas Attractor',
                discoverer: 'René Thomas (1999)',
                description: 'Cyclically symmetric attractor with beautiful 3D structure.',
                equations: 'dx/dt = sin(y) - bx<br>dy/dt = sin(z) - by<br>dz/dt = sin(x) - bz'
            },
            aizawa: {
                name: 'Aizawa Attractor',
                discoverer: 'Yoji Aizawa',
                description: 'Complex attractor with intricate 3D trajectories.',
                equations: 'dx/dt = (z-b)x - dy<br>dy/dt = dx + (z-b)y<br>dz/dt = c + az - z³/3 - (x² + y²)(1 + ez) + fzx³'
            },
            halvorsen: {
                name: 'Halvorsen Attractor',
                discoverer: 'Halvorsen',
                description: 'Symmetric attractor with three-fold rotational symmetry.',
                equations: 'dx/dt = -ax - 4y - 4z - y²<br>dy/dt = -ay - 4z - 4x - z²<br>dz/dt = -az - 4x - 4y - x²'
            },
            custom: {
                name: 'Custom Equations',
                discoverer: 'User Defined',
                description: 'Define your own differential equations.',
                equations: 'Customizable parameters a, b, c'
            }
        };
        return info[type];
    }

    // Attractor differential equations
    computeDerivatives(x, y, z) {
        const p = this.parameters;
        let dx, dy, dz;

        switch (this.attractorType) {
            case 'lorenz':
                dx = p.sigma * (y - x);
                dy = x * (p.rho - z) - y;
                dz = x * y - p.beta * z;
                break;

            case 'rossler':
                dx = -(y + z);
                dy = x + p.a * y;
                dz = p.b + z * (x - p.c);
                break;

            case 'chen':
                dx = p.a * (y - x);
                dy = (p.c - p.a) * x - x * z + p.c * y;
                dz = x * y - p.b * z;
                break;

            case 'thomas':
                dx = Math.sin(y) - p.b * x;
                dy = Math.sin(z) - p.b * y;
                dz = Math.sin(x) - p.b * z;
                break;

            case 'aizawa':
                dx = (z - p.b) * x - p.d * y;
                dy = p.d * x + (z - p.b) * y;
                dz = p.c + p.a * z - Math.pow(z, 3) / 3 -
                     (x * x + y * y) * (1 + p.e * z) + p.f * z * Math.pow(x, 3);
                break;

            case 'halvorsen':
                dx = -p.a * x - 4 * y - 4 * z - y * y;
                dy = -p.a * y - 4 * z - 4 * x - z * z;
                dz = -p.a * z - 4 * x - 4 * y - x * x;
                break;

            case 'custom':
                dx = p.a * (y - x);
                dy = x * (p.b - z) - y;
                dz = x * y - p.c * z;
                break;

            default:
                dx = dy = dz = 0;
        }

        return { dx, dy, dz };
    }

    // Runge-Kutta 4th order integration
    rk4Step(x, y, z, dt) {
        const k1 = this.computeDerivatives(x, y, z);

        const k2 = this.computeDerivatives(
            x + k1.dx * dt / 2,
            y + k1.dy * dt / 2,
            z + k1.dz * dt / 2
        );

        const k3 = this.computeDerivatives(
            x + k2.dx * dt / 2,
            y + k2.dy * dt / 2,
            z + k2.dz * dt / 2
        );

        const k4 = this.computeDerivatives(
            x + k3.dx * dt,
            y + k3.dy * dt,
            z + k3.dz * dt
        );

        return {
            x: x + (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx) * dt / 6,
            y: y + (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy) * dt / 6,
            z: z + (k1.dz + 2 * k2.dz + 2 * k3.dz + k4.dz) * dt / 6
        };
    }

    // 3D to 2D projection with rotation
    project3D(x, y, z) {
        // Apply rotation
        const cosX = Math.cos(this.rotation.x * Math.PI / 180);
        const sinX = Math.sin(this.rotation.x * Math.PI / 180);
        const cosY = Math.cos(this.rotation.y * Math.PI / 180);
        const sinY = Math.sin(this.rotation.y * Math.PI / 180);

        // Rotate around Y axis
        let x1 = x * cosY - z * sinY;
        let z1 = x * sinY + z * cosY;

        // Rotate around X axis
        let y1 = y * cosX - z1 * sinX;
        let z2 = y * sinX + z1 * cosX;

        // Apply zoom and scale
        const scale = this.scale * this.zoom * 15;

        return {
            x: this.centerX + x1 * scale,
            y: this.centerY - y1 * scale
        };
    }

    // Get color based on mode
    getColor(velocity, position, time) {
        let hue, saturation = 80, lightness = 60;

        switch (this.colorMode) {
            case 'velocity':
                // Map velocity to color (blue=slow, white=fast)
                const speed = Math.min(velocity / 50, 1);
                hue = 240 - speed * 240; // Blue to red
                saturation = 70 + speed * 30;
                lightness = 50 + speed * 20;
                break;

            case 'position':
                // Map position to color
                hue = (Math.abs(position.x) + Math.abs(position.y) + Math.abs(position.z)) * 10 % 360;
                break;

            case 'time':
                // Map time to rainbow
                hue = (time * 0.5) % 360;
                break;

            case 'rainbow':
                // Cycle through colors
                hue = (this.iterations * 0.1) % 360;
                break;
        }

        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    // Update simulation
    update() {
        if (!this.isRunning) return;

        for (let i = 0; i < this.iterationsPerFrame; i++) {
            const prevPos = { ...this.position };

            // Integrate using RK4
            this.position = this.rk4Step(
                this.position.x,
                this.position.y,
                this.position.z,
                this.dt
            );

            // Calculate velocity for color
            const velocity = Math.sqrt(
                Math.pow(this.position.x - prevPos.x, 2) +
                Math.pow(this.position.y - prevPos.y, 2) +
                Math.pow(this.position.z - prevPos.z, 2)
            ) / this.dt;

            // Estimate Lyapunov exponent (divergence rate)
            if (this.iterations > 100) {
                const divergence = Math.abs(velocity - 1);
                this.lyapunovSum += Math.log(1 + divergence);
                this.lyapunovCount++;
                this.lyapunovEstimate = this.lyapunovSum / this.lyapunovCount;
            }

            // Add to trail
            this.trail.push({
                x: this.position.x,
                y: this.position.y,
                z: this.position.z,
                velocity: velocity,
                color: this.getColor(velocity, this.position, this.iterations)
            });

            // Limit trail length
            if (this.trail.length > this.trailLength) {
                this.trail.shift();
            }

            this.iterations++;
        }

        // Auto-rotate
        if (this.autoRotate && !this.isDragging) {
            this.rotation.y += this.autoRotateSpeed;
        }
    }

    // Render
    render() {
        // Clear canvas with fade effect
        this.ctx.fillStyle = `rgba(10, 14, 39, ${1 - this.glowIntensity * 0.5})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw trail
        if (this.trail.length > 1) {
            for (let i = 1; i < this.trail.length; i++) {
                const prev = this.trail[i - 1];
                const curr = this.trail[i];

                const prev2D = this.project3D(prev.x, prev.y, prev.z);
                const curr2D = this.project3D(curr.x, curr.y, curr.z);

                // Fade based on position in trail
                const alpha = (i / this.trail.length);

                this.ctx.beginPath();
                this.ctx.strokeStyle = curr.color;
                this.ctx.lineWidth = this.lineWidth * alpha;
                this.ctx.globalAlpha = alpha;
                this.ctx.moveTo(prev2D.x, prev2D.y);
                this.ctx.lineTo(curr2D.x, curr2D.y);
                this.ctx.stroke();

                // Add glow effect
                if (this.glowIntensity > 0) {
                    this.ctx.shadowColor = curr.color;
                    this.ctx.shadowBlur = this.glowIntensity * 10 * alpha;
                    this.ctx.stroke();
                    this.ctx.shadowBlur = 0;
                }
            }

            this.ctx.globalAlpha = 1;
        }

        // Draw current position indicator
        const current2D = this.project3D(
            this.position.x,
            this.position.y,
            this.position.z
        );

        this.ctx.beginPath();
        this.ctx.fillStyle = '#fff';
        this.ctx.shadowColor = '#fff';
        this.ctx.shadowBlur = 15;
        this.ctx.arc(current2D.x, current2D.y, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    // Animation loop
    animate() {
        // Calculate FPS
        const currentTime = performance.now();
        this.frameCount++;
        if (currentTime - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
        }

        this.update();
        this.render();
        this.updateUI();

        requestAnimationFrame(() => this.animate());
    }

    // Update UI elements
    updateUI() {
        document.getElementById('iterationCount').textContent =
            this.iterations.toLocaleString();
        document.getElementById('pointCount').textContent =
            this.trail.length.toLocaleString();
        document.getElementById('fpsCount').textContent = this.fps;
        document.getElementById('lyapunovEst').textContent =
            this.lyapunovEstimate.toFixed(3);
        document.getElementById('posX').textContent =
            this.position.x.toFixed(3);
        document.getElementById('posY').textContent =
            this.position.y.toFixed(3);
        document.getElementById('posZ').textContent =
            this.position.z.toFixed(3);
    }

    // Reset simulation
    reset() {
        this.position = { x: 0.1, y: 0, z: 0 };
        this.trail = [];
        this.iterations = 0;
        this.lyapunovSum = 0;
        this.lyapunovCount = 0;
        this.lyapunovEstimate = 0;
        this.rotation = { x: 0, y: 0 };
    }

    // Clear trail
    clearTrail() {
        this.trail = [];
    }

    // Set attractor type
    setAttractorType(type) {
        this.attractorType = type;
        this.parameters = this.getDefaultParameters(type);
        this.reset();
        this.updateParameterControls();
        this.updateInfoPanel();
    }

    // Update parameter controls UI
    updateParameterControls() {
        const container = document.getElementById('parameterControls');
        container.innerHTML = '';

        const paramRanges = {
            lorenz: {
                sigma: { min: 5, max: 20, step: 0.1 },
                rho: { min: 10, max: 50, step: 0.5 },
                beta: { min: 1, max: 5, step: 0.1 }
            },
            rossler: {
                a: { min: 0.1, max: 0.5, step: 0.01 },
                b: { min: 0.1, max: 0.5, step: 0.01 },
                c: { min: 2, max: 10, step: 0.1 }
            },
            chen: {
                a: { min: 30, max: 50, step: 1 },
                b: { min: 2, max: 5, step: 0.1 },
                c: { min: 20, max: 40, step: 1 }
            },
            thomas: {
                b: { min: 0.1, max: 0.3, step: 0.001 }
            },
            aizawa: {
                a: { min: 0.5, max: 1.5, step: 0.01 },
                b: { min: 0.5, max: 1.0, step: 0.01 },
                c: { min: 0.1, max: 1.0, step: 0.01 },
                d: { min: 2.0, max: 5.0, step: 0.1 },
                e: { min: 0.1, max: 0.5, step: 0.01 },
                f: { min: 0.0, max: 0.5, step: 0.01 }
            },
            halvorsen: {
                a: { min: 1.0, max: 3.0, step: 0.01 }
            },
            custom: {
                a: { min: 1, max: 50, step: 1 },
                b: { min: 1, max: 50, step: 1 },
                c: { min: 1, max: 20, step: 0.1 }
            }
        };

        const ranges = paramRanges[this.attractorType] || {};

        Object.entries(this.parameters).forEach(([key, value]) => {
            const range = ranges[key] || { min: value * 0.5, max: value * 1.5, step: 0.01 };

            const div = document.createElement('div');
            div.className = 'parameter-control';
            div.innerHTML = `
                <span class="parameter-label">${key}:</span>
                <input type="number" class="parameter-input"
                       value="${value}" step="${range.step}"
                       data-param="${key}">
                <input type="range" class="parameter-slider"
                       min="${range.min}" max="${range.max}" step="${range.step}"
                       value="${value}" data-param="${key}">
            `;
            container.appendChild(div);
        });

        // Add event listeners
        container.querySelectorAll('.parameter-input, .parameter-slider').forEach(input => {
            input.addEventListener('input', (e) => {
                const param = e.target.dataset.param;
                const value = parseFloat(e.target.value);
                this.parameters[param] = value;

                // Sync the other input
                const sibling = e.target.classList.contains('parameter-input')
                    ? container.querySelector(`.parameter-slider[data-param="${param}"]`)
                    : container.querySelector(`.parameter-input[data-param="${param}"]`);
                sibling.value = value;
            });
        });
    }

    // Update info panel
    updateInfoPanel() {
        const info = this.getAttractorInfo(this.attractorType);
        const panel = document.getElementById('attractorInfo');
        panel.innerHTML = `
            <p><strong>${info.name}</strong></p>
            <p>${info.description}</p>
            <p class="equations">${info.equations}</p>
        `;
    }

    // Randomize parameters
    randomizeParameters() {
        const paramRanges = {
            lorenz: {
                sigma: [5, 20], rho: [15, 45], beta: [1, 4]
            },
            rossler: {
                a: [0.1, 0.3], b: [0.1, 0.3], c: [4, 8]
            },
            chen: {
                a: [35, 45], b: [2, 4], c: [25, 35]
            },
            thomas: {
                b: [0.15, 0.25]
            },
            aizawa: {
                a: [0.8, 1.2], b: [0.6, 0.8], c: [0.4, 0.8],
                d: [3.0, 4.0], e: [0.2, 0.3], f: [0.05, 0.15]
            },
            halvorsen: {
                a: [1.5, 2.2]
            },
            custom: {
                a: [5, 30], b: [10, 40], c: [1, 5]
            }
        };

        const ranges = paramRanges[this.attractorType] || {};

        Object.entries(this.parameters).forEach(([key, _]) => {
            if (ranges[key]) {
                const [min, max] = ranges[key];
                this.parameters[key] = min + Math.random() * (max - min);
            }
        });

        this.updateParameterControls();
        this.reset();
    }

    // Setup event listeners
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.resize());

        // Mouse drag for rotation
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMousePos = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.lastMousePos.x;
                const dy = e.clientY - this.lastMousePos.y;

                this.rotation.y += dx * 0.5;
                this.rotation.x += dy * 0.5;

                this.lastMousePos = { x: e.clientX, y: e.clientY };
            }
        });

        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.isDragging = true;
                this.lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        });

        this.canvas.addEventListener('touchend', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (this.isDragging && e.touches.length === 1) {
                const dx = e.touches[0].clientX - this.lastMousePos.x;
                const dy = e.touches[0].clientY - this.lastMousePos.y;

                this.rotation.y += dx * 0.5;
                this.rotation.x += dy * 0.5;

                this.lastMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        });

        // Control panel listeners
        document.getElementById('attractorType').addEventListener('change', (e) => {
            this.setAttractorType(e.target.value);
        });

        document.getElementById('dtSlider').addEventListener('input', (e) => {
            this.dt = parseFloat(e.target.value);
            document.getElementById('dtValue').textContent = this.dt.toFixed(3);
        });

        document.getElementById('iterSlider').addEventListener('input', (e) => {
            this.iterationsPerFrame = parseInt(e.target.value);
            document.getElementById('iterValue').textContent = this.iterationsPerFrame;
        });

        document.getElementById('trailSlider').addEventListener('input', (e) => {
            this.trailLength = parseInt(e.target.value);
            document.getElementById('trailValue').textContent = this.trailLength;
        });

        document.getElementById('colorMode').addEventListener('change', (e) => {
            this.colorMode = e.target.value;
        });

        document.getElementById('lineWidthSlider').addEventListener('input', (e) => {
            this.lineWidth = parseFloat(e.target.value);
            document.getElementById('lineWidthValue').textContent = this.lineWidth.toFixed(1);
        });

        document.getElementById('glowSlider').addEventListener('input', (e) => {
            this.glowIntensity = parseFloat(e.target.value);
            document.getElementById('glowValue').textContent = this.glowIntensity.toFixed(2);
        });

        document.getElementById('rotXSlider').addEventListener('input', (e) => {
            this.rotation.x = parseFloat(e.target.value);
            document.getElementById('rotXValue').textContent = this.rotation.x + '°';
        });

        document.getElementById('rotYSlider').addEventListener('input', (e) => {
            this.rotation.y = parseFloat(e.target.value);
            document.getElementById('rotYValue').textContent = this.rotation.y + '°';
        });

        document.getElementById('zoomSlider').addEventListener('input', (e) => {
            this.zoom = parseFloat(e.target.value);
            document.getElementById('zoomValue').textContent = this.zoom.toFixed(1);
        });

        document.getElementById('autoRotate').addEventListener('change', (e) => {
            this.autoRotate = e.target.checked;
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.reset();
        });

        document.getElementById('pauseBtn').addEventListener('click', (e) => {
            this.isRunning = !this.isRunning;
            e.target.textContent = this.isRunning ? 'Pause' : 'Resume';
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearTrail();
        });

        document.getElementById('randomizeParams').addEventListener('click', () => {
            this.randomizeParameters();
        });

        document.getElementById('screenshotBtn').addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = `attractor-${this.attractorType}-${Date.now()}.png`;
            link.href = this.canvas.toDataURL();
            link.click();
        });
    }
}

// Initialize simulator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('attractorCanvas');
    const simulator = new AttractorSimulator(canvas);
});

// Lissajous Curves Simulator - Constraint Theory Research
// Demonstrates geometric constraints in harmonic motion

class LissajousSimulator {
    constructor() {
        this.canvas = document.getElementById('lissajousCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Simulation parameters
        this.params = {
            freqA: 3,
            freqB: 2,
            freqC: 1,
            phase1: Math.PI / 2,
            phase2: 0,
            ampA: 200,
            ampB: 200,
            ampC: 200,
            speed: 1.0,
            trailLength: 500,
            damping: true,
            showGrid: false,
            mode3D: false,
            colorMode: 'solid'
        };

        // Animation state
        this.time = 0;
        this.isRunning = true;
        this.trail = [];
        this.overlayCurves = [];
        this.pointCount = 0;

        // 3D projection parameters
        this.rotation = { x: 0.3, y: 0.5 };

        this.init();
    }

    init() {
        this.resizeCanvas();
        this.setupEventListeners();
        this.updateUI();
        this.animate();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const size = Math.min(container.clientWidth, container.clientHeight);
        this.canvas.width = size;
        this.canvas.height = size;
        this.centerX = size / 2;
        this.centerY = size / 2;
    }

    setupEventListeners() {
        // Frequency controls
        document.getElementById('freqA').addEventListener('input', (e) => {
            this.params.freqA = parseInt(e.target.value);
            document.getElementById('freqAValue').textContent = this.params.freqA;
            this.updateEquation();
        });

        document.getElementById('freqB').addEventListener('input', (e) => {
            this.params.freqB = parseInt(e.target.value);
            document.getElementById('freqBValue').textContent = this.params.freqB;
            this.updateEquation();
        });

        document.getElementById('freqC').addEventListener('input', (e) => {
            this.params.freqC = parseInt(e.target.value);
            document.getElementById('freqCValue').textContent = this.params.freqC;
        });

        // Phase controls
        document.getElementById('phase1').addEventListener('input', (e) => {
            this.params.phase1 = parseInt(e.target.value) * Math.PI / 180;
            document.getElementById('phase1Value').textContent = e.target.value + '°';
            this.updateEquation();
        });

        document.getElementById('phase2').addEventListener('input', (e) => {
            this.params.phase2 = parseInt(e.target.value) * Math.PI / 180;
            document.getElementById('phase2Value').textContent = e.target.value + '°';
        });

        // Amplitude controls
        document.getElementById('ampA').addEventListener('input', (e) => {
            this.params.ampA = parseInt(e.target.value);
            document.getElementById('ampAValue').textContent = this.params.ampA;
        });

        document.getElementById('ampB').addEventListener('input', (e) => {
            this.params.ampB = parseInt(e.target.value);
            document.getElementById('ampBValue').textContent = this.params.ampB;
        });

        // Animation controls
        document.getElementById('speed').addEventListener('input', (e) => {
            this.params.speed = parseFloat(e.target.value);
            document.getElementById('speedValue').textContent = this.params.speed.toFixed(1) + 'x';
        });

        document.getElementById('trailLength').addEventListener('input', (e) => {
            this.params.trailLength = parseInt(e.target.value);
            document.getElementById('trailLengthValue').textContent = this.params.trailLength;
        });

        document.getElementById('damping').addEventListener('change', (e) => {
            this.params.damping = e.target.checked;
        });

        document.getElementById('showGrid').addEventListener('change', (e) => {
            this.params.showGrid = e.target.checked;
        });

        document.getElementById('mode3D').addEventListener('change', (e) => {
            this.params.mode3D = e.target.checked;
            if (this.params.mode3D) {
                this.setup3DControls();
            }
            this.clearTrail();
        });

        // Color mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.params.colorMode = e.target.dataset.mode;
            });
        });

        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const a = parseInt(e.target.dataset.a);
                const b = parseInt(e.target.dataset.b);
                const phase = parseInt(e.target.dataset.phase);

                this.params.freqA = a;
                this.params.freqB = b;
                this.params.phase1 = phase * Math.PI / 180;

                document.getElementById('freqA').value = a;
                document.getElementById('freqB').value = b;
                document.getElementById('phase1').value = phase;

                document.getElementById('freqAValue').textContent = a;
                document.getElementById('freqBValue').textContent = b;
                document.getElementById('phase1Value').textContent = phase + '°';

                this.clearTrail();
                this.updateEquation();
            });
        });

        // Action buttons
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.isRunning = !this.isRunning;
            document.getElementById('pauseBtn').textContent = this.isRunning ? 'Pause' : 'Resume';
        });

        document.getElementById('clearBtn').addEventListener('click', () => this.clearTrail());

        document.getElementById('resetBtn').addEventListener('click', () => this.reset());

        // Overlay mode
        document.getElementById('overlayMode').addEventListener('change', (e) => {
            const addBtn = document.getElementById('addCurveBtn');
            const clearBtn = document.getElementById('clearOverlayBtn');
            addBtn.disabled = !e.target.checked;
            clearBtn.disabled = !e.target.checked || this.overlayCurves.length === 0;
        });

        document.getElementById('addCurveBtn').addEventListener('click', () => this.addOverlayCurve());

        document.getElementById('clearOverlayBtn').addEventListener('click', () => {
            this.overlayCurves = [];
            this.updateCurveList();
            document.getElementById('clearOverlayBtn').disabled = true;
        });

        // Mouse interaction for 3D rotation
        let isDragging = false;
        let lastMouse = { x: 0, y: 0 };

        this.canvas.addEventListener('mousedown', (e) => {
            if (this.params.mode3D) {
                isDragging = true;
                lastMouse = { x: e.clientX, y: e.clientY };
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (isDragging && this.params.mode3D) {
                const deltaX = e.clientX - lastMouse.x;
                const deltaY = e.clientY - lastMouse.y;

                this.rotation.y += deltaX * 0.01;
                this.rotation.x += deltaY * 0.01;

                lastMouse = { x: e.clientX, y: e.clientY };
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            isDragging = false;
        });

        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    setup3DControls() {
        // Enable mouse interaction for 3D rotation
        this.canvas.style.cursor = 'grab';
    }

    updateUI() {
        this.updateEquation();
        this.updateInfo();
    }

    updateEquation() {
        document.getElementById('eqA').textContent = this.params.freqA;
        document.getElementById('eqB').textContent = this.params.freqB;

        const phaseDeg = Math.round(this.params.phase1 * 180 / Math.PI);
        const phaseText = phaseDeg === 90 ? 'π/2' :
                         phaseDeg === 180 ? 'π' :
                         phaseDeg === 270 ? '3π/2' :
                         `${phaseDeg}°`;
        document.getElementById('eqPhase1').textContent = phaseText;

        document.getElementById('ratio').textContent = `${this.params.freqA}:${this.params.freqB}`;

        // Calculate period
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(this.params.freqA, this.params.freqB);
        const period = divisor > 0 ? `2π·${divisor}` : '2π';
        document.getElementById('period').textContent = period;
    }

    updateInfo() {
        document.getElementById('pointCount').textContent = this.pointCount;
    }

    // Calculate position at time t
    calculatePosition(t) {
        if (this.params.mode3D) {
            // 3D Lissajous
            const x = this.params.ampA * Math.sin(this.params.freqA * t + this.params.phase1);
            const y = this.params.ampB * Math.sin(this.params.freqB * t);
            const z = this.params.ampC * Math.sin(this.params.freqC * t + this.params.phase2);

            // Apply 3D rotation
            const rotated = this.rotate3D(x, y, z);

            // Project to 2D
            const scale = 0.8;
            return {
                x: this.centerX + rotated.x * scale,
                y: this.centerY + rotated.y * scale,
                z: rotated.z,
                original: { x, y, z }
            };
        } else {
            // 2D Lissajous
            return {
                x: this.centerX + this.params.ampA * Math.sin(this.params.freqA * t + this.params.phase1),
                y: this.centerY + this.params.ampB * Math.sin(this.params.freqB * t),
                z: 0,
                original: null
            };
        }
    }

    rotate3D(x, y, z) {
        // Rotate around X axis
        let y1 = y * Math.cos(this.rotation.x) - z * Math.sin(this.rotation.x);
        let z1 = y * Math.sin(this.rotation.x) + z * Math.cos(this.rotation.x);

        // Rotate around Y axis
        let x2 = x * Math.cos(this.rotation.y) + z1 * Math.sin(this.rotation.y);
        let z2 = -x * Math.sin(this.rotation.y) + z1 * Math.cos(this.rotation.y);

        return { x: x2, y: y1, z: z2 };
    }

    getTrailColor(index, total, velocity) {
        const alpha = this.params.damping ? (index / total) : 1;

        switch (this.params.colorMode) {
            case 'rainbow':
                const hue = (index / total) * 360;
                return `hsla(${hue}, 100%, 50%, ${alpha})`;

            case 'velocity':
                const vel = Math.abs(velocity);
                const velHue = 240 - (vel * 120); // Blue to red
                return `hsla(${velHue}, 100%, 50%, ${alpha})`;

            case 'solid':
            default:
                return `rgba(0, 255, 200, ${alpha})`;
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0e1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid if enabled
        if (this.params.showGrid) {
            this.drawGrid();
        }

        // Draw overlay curves
        this.overlayCurves.forEach(curve => {
            this.drawCurve(curve.points, curve.color, 0.5);
        });

        // Draw main trail
        if (this.trail.length > 1) {
            this.drawTrail();
        }

        // Draw current point
        if (this.trail.length > 0) {
            const currentPoint = this.trail[this.trail.length - 1];
            this.drawPoint(currentPoint);
        }

        // Draw velocity indicator
        if (this.trail.length > 1) {
            this.drawVelocityIndicator();
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.1)';
        this.ctx.lineWidth = 1;

        const gridSize = 50;

        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Draw axes
        this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();
        this.ctx.moveTo(this.centerX, 0);
        this.ctx.lineTo(this.centerX, this.canvas.height);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(0, this.centerY);
        this.ctx.lineTo(this.canvas.width, this.centerY);
        this.ctx.stroke();
    }

    drawTrail() {
        // Calculate velocity for color mode
        const velocities = [];
        for (let i = 1; i < this.trail.length; i++) {
            const dx = this.trail[i].x - this.trail[i - 1].x;
            const dy = this.trail[i].y - this.trail[i - 1].y;
            const velocity = Math.sqrt(dx * dx + dy * dy) / this.params.speed;
            velocities.push(velocity);
        }

        // Draw trail segments
        for (let i = 1; i < this.trail.length; i++) {
            const prevPoint = this.trail[i - 1];
            const currPoint = this.trail[i];

            this.ctx.beginPath();
            this.ctx.moveTo(prevPoint.x, prevPoint.y);
            this.ctx.lineTo(currPoint.x, currPoint.y);

            const velocity = velocities[i - 1] || 0;
            this.ctx.strokeStyle = this.getTrailColor(i, this.trail.length, velocity);
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    drawCurve(points, color, alpha = 1) {
        if (points.length < 2) return;

        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);

        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }

        this.ctx.strokeStyle = color.replace('1)', `${alpha})`);
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawPoint(point) {
        // Glow effect
        const gradient = this.ctx.createRadialGradient(
            point.x, point.y, 0,
            point.x, point.y, 15
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(0, 255, 200, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 255, 200, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 15, 0, Math.PI * 2);
        this.ctx.fill();

        // Solid center
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawVelocityIndicator() {
        if (this.trail.length < 2) return;

        const current = this.trail[this.trail.length - 1];
        const previous = this.trail[this.trail.length - 2];

        const vx = current.x - previous.x;
        const vy = current.y - previous.y;

        const velocity = Math.sqrt(vx * vx + vy * vy);

        // Draw velocity vector
        const scale = 10;
        this.ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(current.x, current.y);
        this.ctx.lineTo(current.x + vx * scale, current.y + vy * scale);
        this.ctx.stroke();
    }

    update() {
        if (!this.isRunning) return;

        // Increment time
        this.time += 0.02 * this.params.speed;

        // Calculate new position
        const pos = this.calculatePosition(this.time);

        // Add to trail
        this.trail.push(pos);
        this.pointCount++;

        // Limit trail length
        if (this.trail.length > this.params.trailLength) {
            this.trail.shift();
        }

        // Update coordinate display
        const xVal = pos.original ? pos.original.x.toFixed(2) :
                    ((pos.x - this.centerX) / this.params.ampA).toFixed(2);
        const yVal = pos.original ? pos.original.y.toFixed(2) :
                    ((pos.y - this.centerY) / this.params.ampB).toFixed(2);

        document.getElementById('coordX').textContent = `X: ${xVal}`;
        document.getElementById('coordY').textContent = `Y: ${yVal}`;

        // Update point count
        this.updateInfo();
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    clearTrail() {
        this.trail = [];
        this.pointCount = 0;
        this.time = 0;
    }

    reset() {
        this.clearTrail();
        this.overlayCurves = [];
        this.params = {
            freqA: 3,
            freqB: 2,
            freqC: 1,
            phase1: Math.PI / 2,
            phase2: 0,
            ampA: 200,
            ampB: 200,
            ampC: 200,
            speed: 1.0,
            trailLength: 500,
            damping: true,
            showGrid: false,
            mode3D: false,
            colorMode: 'solid'
        };

        // Reset UI controls
        document.getElementById('freqA').value = 3;
        document.getElementById('freqB').value = 2;
        document.getElementById('freqC').value = 1;
        document.getElementById('phase1').value = 90;
        document.getElementById('phase2').value = 0;
        document.getElementById('ampA').value = 200;
        document.getElementById('ampB').value = 200;
        document.getElementById('speed').value = 1;
        document.getElementById('trailLength').value = 500;
        document.getElementById('damping').checked = true;
        document.getElementById('showGrid').checked = false;
        document.getElementById('mode3D').checked = false;

        // Reset value displays
        document.getElementById('freqAValue').textContent = '3';
        document.getElementById('freqBValue').textContent = '2';
        document.getElementById('freqCValue').textContent = '1';
        document.getElementById('phase1Value').textContent = '90°';
        document.getElementById('phase2Value').textContent = '0°';
        document.getElementById('ampAValue').textContent = '200';
        document.getElementById('ampBValue').textContent = '200';
        document.getElementById('speedValue').textContent = '1.0x';
        document.getElementById('trailLengthValue').textContent = '500';

        // Reset color mode
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.mode-btn[data-mode="solid"]').classList.add('active');

        this.updateUI();
        this.updateCurveList();
    }

    addOverlayCurve() {
        if (this.trail.length < 2) return;

        const color = `hsla(${Math.random() * 360}, 100%, 50%, 1)`;
        const points = [...this.trail];

        this.overlayCurves.push({ points, color });
        this.updateCurveList();

        document.getElementById('clearOverlayBtn').disabled = false;
    }

    updateCurveList() {
        const list = document.getElementById('curveList');

        if (this.overlayCurves.length === 0) {
            list.innerHTML = '<p class="empty-message">No curves added</p>';
            return;
        }

        list.innerHTML = this.overlayCurves.map((curve, index) => `
            <div class="curve-item" style="border-left: 3px solid ${curve.color}">
                <span>Curve ${index + 1}</span>
                <button class="remove-btn" data-index="${index}">×</button>
            </div>
        `).join('');

        // Add remove button listeners
        list.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.overlayCurves.splice(index, 1);
                this.updateCurveList();
                document.getElementById('clearOverlayBtn').disabled = this.overlayCurves.length === 0;
            });
        });
    }
}

// Initialize simulator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LissajousSimulator();
});

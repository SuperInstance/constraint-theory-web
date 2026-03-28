// Hidden Dimensions Encoding Experiment
// Demonstrates k = ceil(log2(1/epsilon)) formula

class HiddenDimensionsDemo {
    constructor() {
        // Canvas setup
        this.visibleCanvas = document.getElementById('visibleCanvas');
        this.liftedCanvas = document.getElementById('liftedCanvas');
        this.visibleCtx = this.visibleCanvas.getContext('2d');
        this.liftedCtx = this.liftedCanvas.getContext('2d');

        // State
        this.points = [];
        this.snappedPoints = [];
        this.isAnimating = true;
        this.animationTime = 0;
        this.snapping = false;
        this.snapProgress = 0;

        // Parameters
        this.epsilon = 0.001;
        this.pointCount = 50;
        this.animationMode = 'both';
        this.showLattice = true;
        this.showPrecisionRing = false;
        this.showHiddenAxes = true;

        // Pythagorean triples for snapping
        this.pythagoreanLattice = this.generatePythagoreanLattice(200);

        // Hidden dimension visualization
        this.hiddenDimCount = this.computeHiddenDims(this.epsilon);

        // Performance
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.fps = 60;

        // Initialize
        this.setupCanvas();
        this.setupControls();
        this.generatePoints();
        this.startAnimation();
    }

    setupCanvas() {
        // Handle DPI scaling
        const dpr = window.devicePixelRatio || 1;
        
        [this.visibleCanvas, this.liftedCanvas].forEach(canvas => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
        });

        // Set display size
        this.canvasWidth = 500;
        this.canvasHeight = 400;
    }

    setupControls() {
        // Epsilon slider
        const epsilonSlider = document.getElementById('epsilonSlider');
        epsilonSlider.addEventListener('input', (e) => {
            const exp = parseFloat(e.target.value);
            this.epsilon = Math.pow(10, exp);
            document.getElementById('epsilonValue').textContent = 
                `10^${exp} = ${this.epsilon.toExponential(2)}`;
            this.hiddenDimCount = this.computeHiddenDims(this.epsilon);
            document.getElementById('hiddenDims').textContent = this.hiddenDimCount;
        });

        // Point count
        const pointCountSlider = document.getElementById('pointCount');
        pointCountSlider.addEventListener('input', (e) => {
            this.pointCount = parseInt(e.target.value);
            document.getElementById('pointCountValue').textContent = this.pointCount;
            this.generatePoints();
        });

        // Animation mode
        document.getElementById('animationMode').addEventListener('change', (e) => {
            this.animationMode = e.target.value;
        });

        // Checkboxes
        document.getElementById('showLattice').addEventListener('change', (e) => {
            this.showLattice = e.target.checked;
        });

        document.getElementById('showPrecisionRing').addEventListener('change', (e) => {
            this.showPrecisionRing = e.target.checked;
        });

        document.getElementById('showHiddenAxes').addEventListener('change', (e) => {
            this.showHiddenAxes = e.target.checked;
        });

        // Buttons
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.generatePoints();
            this.snapping = false;
            this.snapProgress = 0;
        });

        document.getElementById('snapBtn').addEventListener('click', () => {
            this.snapAllPoints();
        });

        document.getElementById('animateBtn').addEventListener('click', (e) => {
            this.isAnimating = !this.isAnimating;
            e.target.textContent = this.isAnimating ? 'Pause' : 'Animate';
            e.target.classList.toggle('active', this.isAnimating);
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                e.preventDefault();
                this.isAnimating = !this.isAnimating;
            }
            if (e.key === 'r') {
                this.generatePoints();
            }
            if (e.key === 's') {
                this.snapAllPoints();
            }
        });

        // Mouse interaction
        this.visibleCanvas.addEventListener('click', (e) => {
            const rect = this.visibleCanvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width * this.canvasWidth;
            const y = (e.clientY - rect.top) / rect.height * this.canvasHeight;
            this.addPoint(x, y);
        });
    }

    computeHiddenDims(epsilon) {
        // k = ceil(log2(1/epsilon))
        return Math.ceil(Math.log2(1 / epsilon));
    }

    generatePythagoreanLattice(maxHyp) {
        const lattice = [];
        for (let m = 2; m < Math.sqrt(maxHyp); m++) {
            for (let n = 1; n < m; n++) {
                if ((m - n) % 2 === 1 && this.gcd(m, n) === 1) {
                    const a = m * m - n * n;
                    const b = 2 * m * n;
                    const c = m * m + n * n;
                    if (c <= maxHyp) {
                        // Store unit circle points
                        lattice.push({ x: a / c, y: b / c, a, b, c });
                        lattice.push({ x: b / c, y: a / c, a: b, b: a, c });
                    }
                }
            }
        }
        return lattice;
    }

    gcd(a, b) {
        return b === 0 ? a : this.gcd(b, a % b);
    }

    generatePoints() {
        this.points = [];
        this.snappedPoints = [];
        
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const radius = Math.min(this.canvasWidth, this.canvasHeight) * 0.35;

        for (let i = 0; i < this.pointCount; i++) {
            // Generate points near the unit circle with noise
            const angle = Math.random() * Math.PI * 2;
            const r = radius * (0.8 + Math.random() * 0.4);
            
            // Add some noise
            const noise = (Math.random() - 0.5) * 0.15 * radius;
            
            const x = centerX + r * Math.cos(angle) + noise;
            const y = centerY + r * Math.sin(angle) + noise;
            
            // Store normalized position and hidden dimensions
            const normX = (x - centerX) / radius;
            const normY = (y - centerY) / radius;
            
            this.points.push({
                x, y,
                normX, normY,
                hidden: this.generateHiddenDims(),
                snapped: false,
                snapTarget: null
            });
        }

        this.updateStats();
    }

    generateHiddenDims() {
        // Generate hidden dimension values
        const hidden = [];
        for (let i = 0; i < this.hiddenDimCount; i++) {
            hidden.push(Math.random() * 2 - 1);
        }
        return hidden;
    }

    addPoint(x, y) {
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const radius = Math.min(this.canvasWidth, this.canvasHeight) * 0.35;

        this.points.push({
            x, y,
            normX: (x - centerX) / radius,
            normY: (y - centerY) / radius,
            hidden: this.generateHiddenDims(),
            snapped: false,
            snapTarget: null
        });

        this.pointCount = this.points.length;
        document.getElementById('pointCount').value = this.pointCount;
        document.getElementById('pointCountValue').textContent = this.pointCount;
        this.updateStats();
    }

    snapAllPoints() {
        this.snapping = true;
        this.snapProgress = 0;
        
        // Compute snap targets
        this.points.forEach(point => {
            if (!point.snapped) {
                point.snapTarget = this.findNearestLatticePoint(point);
            }
        });
    }

    findNearestLatticePoint(point) {
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const radius = Math.min(this.canvasWidth, this.canvasHeight) * 0.35;

        let nearest = null;
        let minDist = Infinity;

        for (const lattice of this.pythagoreanLattice) {
            const lx = centerX + lattice.x * radius;
            const ly = centerY + lattice.y * radius;
            const dist = Math.hypot(point.x - lx, point.y - ly);
            
            if (dist < minDist) {
                minDist = dist;
                nearest = { x: lx, y: ly, lattice };
            }
        }

        return nearest;
    }

    updateStats() {
        const snappedCount = this.points.filter(p => p.snapped).length;
        document.getElementById('snappedCount').textContent = 
            `${snappedCount} / ${this.points.length}`;

        // Calculate average errors
        if (this.points.length > 0) {
            let totalErrorBefore = 0;
            let totalErrorAfter = 0;
            let countAfter = 0;

            this.points.forEach(p => {
                const dist = Math.sqrt(p.normX * p.normX + p.normY * p.normY);
                totalErrorBefore += Math.abs(dist - 1);

                if (p.snapped && p.snapTarget) {
                    const snappedNorm = Math.sqrt(
                        p.snapTarget.lattice.x ** 2 + 
                        p.snapTarget.lattice.y ** 2
                    );
                    totalErrorAfter += Math.abs(snappedNorm - 1);
                    countAfter++;
                }
            });

            document.getElementById('avgErrorBefore').textContent = 
                (totalErrorBefore / this.points.length).toExponential(2);
            
            if (countAfter > 0) {
                document.getElementById('avgErrorAfter').textContent = 
                    (totalErrorAfter / countAfter).toExponential(2);
            }
        }
    }

    renderVisibleSpace() {
        const ctx = this.visibleCtx;
        const canvas = this.visibleCanvas;

        // Clear
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const radius = Math.min(this.canvasWidth, this.canvasHeight) * 0.35;

        // Draw constraint lattice
        if (this.showLattice) {
            ctx.strokeStyle = 'rgba(0, 217, 255, 0.15)';
            ctx.lineWidth = 1;
            
            this.pythagoreanLattice.forEach(lattice => {
                const x = centerX + lattice.x * radius;
                const y = centerY + lattice.y * radius;
                
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.stroke();
            });
        }

        // Draw unit circle constraint
        ctx.strokeStyle = 'rgba(123, 44, 191, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(this.canvasWidth, centerY);
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, this.canvasHeight);
        ctx.stroke();

        // Draw points
        this.points.forEach((point, index) => {
            const x = point.x;
            const y = point.y;

            // Animation offset for lifting effect
            let offsetY = 0;
            if (this.animationMode !== 'snap' && this.isAnimating) {
                offsetY = Math.sin(this.animationTime * 2 + index * 0.1) * 3;
            }

            // Precision ring
            if (this.showPrecisionRing && !point.snapped) {
                ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(x, y + offsetY, radius * this.epsilon * 10, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Point color based on state
            if (point.snapped) {
                ctx.fillStyle = '#00ff88';
            } else if (point.snapTarget && this.snapping) {
                // Interpolate during snapping
                const t = this.snapProgress;
                const interpX = point.x + (point.snapTarget.x - point.x) * t;
                const interpY = point.y + (point.snapTarget.y - point.y) * t;
                
                ctx.fillStyle = `rgba(0, 217, 255, ${0.5 + t * 0.5})`;
                
                // Draw line to target
                ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(point.x, point.y);
                ctx.lineTo(point.snapTarget.x, point.snapTarget.y);
                ctx.stroke();
            } else {
                ctx.fillStyle = '#ff6b6b';
            }

            // Draw point
            ctx.beginPath();
            ctx.arc(x, y + offsetY, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Label
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Floating-point errors accumulate', centerX, this.canvasHeight - 20);
    }

    renderLiftedSpace() {
        const ctx = this.liftedCtx;
        const canvas = this.liftedCanvas;

        // Clear
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const radius = Math.min(this.canvasWidth, this.canvasHeight) * 0.35;

        // Draw hidden dimension axes
        if (this.showHiddenAxes) {
            // Draw multiple hidden dimension axes
            for (let i = 0; i < Math.min(this.hiddenDimCount, 10); i++) {
                const angle = (i / 10) * Math.PI + Math.PI / 4;
                const len = radius * 0.3;
                
                ctx.strokeStyle = `rgba(${100 + i * 15}, ${50 + i * 10}, ${200 - i * 10}, 0.3)`;
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(
                    centerX + Math.cos(angle) * len,
                    centerY + Math.sin(angle) * len
                );
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // Draw unit circle constraint
        ctx.strokeStyle = 'rgba(123, 44, 191, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw exact lattice
        if (this.showLattice) {
            ctx.fillStyle = 'rgba(0, 255, 136, 0.8)';
            
            this.pythagoreanLattice.slice(0, 100).forEach(lattice => {
                const x = centerX + lattice.x * radius;
                const y = centerY + lattice.y * radius;
                
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // Draw points in lifted space
        this.points.forEach((point, index) => {
            let x = point.x;
            let y = point.y;
            
            // Add hidden dimension visualization
            let hiddenOffset = 0;
            if (this.animationMode !== 'snap' && this.isAnimating && point.hidden) {
                // Project hidden dimensions to visible offset
                for (let i = 0; i < point.hidden.length; i++) {
                    hiddenOffset += point.hidden[i] * Math.sin(this.animationTime + i);
                }
                hiddenOffset *= 5;
            }

            // Lifting animation
            let liftOffset = 0;
            if (this.animationMode !== 'snap' && this.isAnimating) {
                liftOffset = Math.sin(this.animationTime * 2 + index * 0.1) * 5;
            }

            // Snapping animation
            if (this.snapping && point.snapTarget) {
                const t = Math.min(1, this.snapProgress * 1.5);
                x = point.x + (point.snapTarget.x - point.x) * t;
                y = point.y + (point.snapTarget.y - point.y) * t;
            }

            // Point color
            if (point.snapped) {
                ctx.fillStyle = '#00ff88';
                
                // Glow effect for snapped points
                const gradient = ctx.createRadialGradient(x, y + liftOffset, 0, x, y + liftOffset, 15);
                gradient.addColorStop(0, 'rgba(0, 255, 136, 0.4)');
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y + liftOffset, 15, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#00ff88';
            } else {
                ctx.fillStyle = `rgba(0, 217, 255, 0.8)`;
            }

            // Draw point
            ctx.beginPath();
            ctx.arc(x, y + liftOffset + hiddenOffset * 0.5, 5, 0, Math.PI * 2);
            ctx.fill();
        });

        // Hidden dimensions indicator
        ctx.fillStyle = '#00d9ff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`k = ${this.hiddenDimCount} hidden dims`, 10, 25);
        ctx.fillText(`ε = ${this.epsilon.toExponential(2)}`, 10, 45);

        // Label
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Exact after snapping in lifted space', centerX, this.canvasHeight - 20);
    }

    update(dt) {
        if (this.isAnimating) {
            this.animationTime += dt * 0.001;
        }

        if (this.snapping) {
            this.snapProgress += dt * 0.002;
            
            if (this.snapProgress >= 1) {
                this.snapProgress = 1;
                this.snapping = false;
                
                // Mark all points as snapped
                this.points.forEach(p => {
                    if (p.snapTarget) {
                        p.snapped = true;
                        p.x = p.snapTarget.x;
                        p.y = p.snapTarget.y;
                    }
                });
                
                this.updateStats();
            }
        }

        // Update FPS
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFrameTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFrameTime = now;
        }
    }

    render() {
        this.renderVisibleSpace();
        this.renderLiftedSpace();
    }

    loop(timestamp) {
        const dt = timestamp - this.lastFrameTime;
        
        this.update(Math.min(dt, 32)); // Cap at ~30fps minimum
        this.render();
        
        this.lastFrameTime = timestamp;
        requestAnimationFrame((t) => this.loop(t));
    }

    startAnimation() {
        this.lastFrameTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new HiddenDimensionsDemo();
});

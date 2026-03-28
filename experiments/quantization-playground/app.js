// Quantization Playground Experiment
// Demonstrates PythagoreanQuantizer with TERNARY, POLAR, TURBO, HYBRID modes

class QuantizationPlayground {
    constructor() {
        // Canvas setup
        this.originalCanvas = document.getElementById('originalCanvas');
        this.quantizedCanvas = document.getElementById('quantizedCanvas');
        this.originalCtx = this.originalCanvas.getContext('2d');
        this.quantizedCtx = this.quantizedCanvas.getContext('2d');

        // State
        this.originalVectors = [];
        this.quantizedVectors = [];
        this.isAnimating = false;
        this.animationProgress = 0;

        // Parameters
        this.vectorCount = 50;
        this.bits = 4;
        this.dimension = 128;
        this.mode = 'polar';
        this.preserveNorm = true;
        this.showDistortion = false;
        this.animateQuantize = true;

        // Pythagorean lattice for 2D visualization
        this.pythagoreanLattice = this.generatePythagoreanLattice(200);

        // Performance
        this.lastFrameTime = performance.now();
        this.fps = 60;

        // Initialize
        this.setupCanvas();
        this.setupControls();
        this.generateVectors();
        this.startAnimation();
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        
        [this.originalCanvas, this.quantizedCanvas].forEach(canvas => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
        });

        this.canvasWidth = 400;
        this.canvasHeight = 400;
    }

    setupControls() {
        // Vector count
        const vectorCountSlider = document.getElementById('vectorCount');
        vectorCountSlider.addEventListener('input', (e) => {
            this.vectorCount = parseInt(e.target.value);
            document.getElementById('vectorCountValue').textContent = this.vectorCount;
            this.generateVectors();
        });

        // Bits slider
        const bitsSlider = document.getElementById('bitsSlider');
        bitsSlider.addEventListener('input', (e) => {
            this.bits = parseInt(e.target.value);
            document.getElementById('bitsValue').textContent = `${this.bits} bits`;
            document.getElementById('bitsTarget').textContent = this.bits;
            if (this.quantizedVectors.length > 0) {
                this.quantizeVectors();
            }
        });

        // Dimension select
        document.getElementById('dimensionSelect').addEventListener('change', (e) => {
            this.dimension = parseInt(e.target.value);
            this.generateVectors();
        });

        // Mode select
        document.getElementById('quantMode').addEventListener('change', (e) => {
            this.mode = e.target.value;
            this.updateModeCards();
            if (this.quantizedVectors.length > 0) {
                this.quantizeVectors();
            }
        });

        // Checkboxes
        document.getElementById('preserveNorm').addEventListener('change', (e) => {
            this.preserveNorm = e.target.checked;
            if (this.quantizedVectors.length > 0) {
                this.quantizeVectors();
            }
        });

        document.getElementById('showDistortion').addEventListener('change', (e) => {
            this.showDistortion = e.target.checked;
        });

        document.getElementById('animateQuantize').addEventListener('change', (e) => {
            this.animateQuantize = e.target.checked;
        });

        // Buttons
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.generateVectors();
            this.quantizedVectors = [];
            this.updateMetrics(null);
        });

        document.getElementById('quantizeBtn').addEventListener('click', () => {
            this.quantizeVectors();
        });

        document.getElementById('compareBtn').addEventListener('click', () => {
            this.compareAllModes();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportResults();
        });

        // Mode cards click
        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => {
                const mode = card.dataset.mode;
                document.getElementById('quantMode').value = mode;
                this.mode = mode;
                this.updateModeCards();
                if (this.quantizedVectors.length > 0) {
                    this.quantizeVectors();
                }
            });
        });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'q') this.quantizeVectors();
            if (e.key === 'r') this.generateVectors();
            if (e.key === 'c') this.compareAllModes();
        });

        // Canvas click to add vectors
        this.originalCanvas.addEventListener('click', (e) => {
            const rect = this.originalCanvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width * this.canvasWidth;
            const y = (e.clientY - rect.top) / rect.height * this.canvasHeight;
            this.addVector(x, y);
        });

        this.updateModeCards();
    }

    updateModeCards() {
        document.querySelectorAll('.mode-card').forEach(card => {
            card.classList.toggle('active', card.dataset.mode === this.mode);
        });
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

    generateVectors() {
        this.originalVectors = [];
        this.quantizedVectors = [];

        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const radius = Math.min(this.canvasWidth, this.canvasHeight) * 0.35;

        for (let i = 0; i < this.vectorCount; i++) {
            // Generate unit vectors (for embedding simulation)
            const angle = Math.random() * Math.PI * 2;
            const norm = this.preserveNorm ? 1 : (0.5 + Math.random() * 0.5);
            
            // Add small noise to simulate floating-point errors
            const noise = (Math.random() - 0.5) * 0.05;
            
            const x = Math.cos(angle + noise) * norm;
            const y = Math.sin(angle + noise) * norm;

            // Store both 2D projection and full dimension data
            this.originalVectors.push({
                x: centerX + x * radius,
                y: centerY + y * radius,
                normX: x,
                normY: y,
                // For higher dimensions, generate random components
                dims: this.generateHighDimComponents(x, y),
                angle: angle
            });
        }
    }

    generateHighDimComponents(x, y) {
        if (this.dimension <= 2) return [x, y];
        
        const dims = [x, y];
        for (let i = 2; i < this.dimension; i++) {
            dims.push((Math.random() - 0.5) * 2);
        }
        
        // Normalize to unit length
        const norm = Math.sqrt(dims.reduce((sum, d) => sum + d * d, 0));
        return dims.map(d => d / norm);
    }

    addVector(canvasX, canvasY) {
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const radius = Math.min(this.canvasWidth, this.canvasHeight) * 0.35;

        const normX = (canvasX - centerX) / radius;
        const normY = (canvasY - centerY) / radius;

        this.originalVectors.push({
            x: canvasX,
            y: canvasY,
            normX,
            normY,
            dims: this.generateHighDimComponents(normX, normY),
            angle: Math.atan2(normY, normX)
        });

        this.vectorCount = this.originalVectors.length;
        document.getElementById('vectorCount').value = Math.min(this.vectorCount, 200);
        document.getElementById('vectorCountValue').textContent = this.vectorCount;
    }

    quantizeVectors() {
        if (this.animateQuantize) {
            this.isAnimating = true;
            this.animationProgress = 0;
            this.quantizedVectors = this.originalVectors.map(v => ({...v, quantized: null}));
            requestAnimationFrame(() => this.animateQuantization());
        } else {
            this.quantizedVectors = this.originalVectors.map(v => this.quantizeVector(v));
            this.updateMetrics(this.computeMetrics());
        }
    }

    animateQuantization() {
        if (!this.isAnimating) return;

        this.animationProgress += 0.02;

        const vectorsToQuantize = Math.floor(this.animationProgress * this.originalVectors.length);
        
        for (let i = 0; i < vectorsToQuantize; i++) {
            if (!this.quantizedVectors[i].quantized) {
                this.quantizedVectors[i] = this.quantizeVector(this.originalVectors[i]);
            }
        }

        if (vectorsToQuantize < this.originalVectors.length) {
            // Interpolate for animation
            this.quantizedVectors.forEach((v, i) => {
                if (!v.quantized && i < vectorsToQuantize + 1) {
                    const t = Math.min(1, (this.animationProgress * this.originalVectors.length - i));
                    const quantized = this.quantizeVector(this.originalVectors[i]);
                    v.animX = this.originalVectors[i].x + (quantized.quantized.x - this.originalVectors[i].x) * t;
                    v.animY = this.originalVectors[i].y + (quantized.quantized.y - this.originalVectors[i].y) * t;
                }
            });
        }

        if (this.animationProgress >= 1) {
            this.isAnimating = false;
            this.quantizedVectors = this.originalVectors.map(v => this.quantizeVector(v));
            this.updateMetrics(this.computeMetrics());
        } else {
            requestAnimationFrame(() => this.animateQuantization());
        }
    }

    quantizeVector(vector) {
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const radius = Math.min(this.canvasWidth, this.canvasHeight) * 0.35;

        let quantX, quantY;
        let quantizedNormX, quantizedNormY;

        switch (this.mode) {
            case 'ternary':
                // BitNet style: {-1, 0, 1} quantization
                quantizedNormX = Math.sign(vector.normX) * (Math.abs(vector.normX) > 0.33 ? 1 : 0);
                quantizedNormY = Math.sign(vector.normY) * (Math.abs(vector.normY) > 0.33 ? 1 : 0);
                break;

            case 'polar':
                // PolarQuant: Snap to nearest Pythagorean point, preserve norm
                const nearest = this.findNearestPythagorean(vector.normX, vector.normY);
                quantizedNormX = nearest.x;
                quantizedNormY = nearest.y;
                break;

            case 'turbo':
                // TurboQuant: Near-optimal MSE with lattice quantization
                const levels = Math.pow(2, this.bits);
                quantizedNormX = Math.round(vector.normX * levels) / levels;
                quantizedNormY = Math.round(vector.normY * levels) / levels;
                // Then snap to Pythagorean
                const turboNearest = this.findNearestPythagorean(quantizedNormX, quantizedNormY);
                quantizedNormX = turboNearest.x;
                quantizedNormY = turboNearest.y;
                break;

            case 'hybrid':
            default:
                // Auto-select based on characteristics
                const norm = Math.sqrt(vector.normX * vector.normX + vector.normY * vector.normY);
                if (Math.abs(norm - 1) < 0.1) {
                    // Unit norm → Polar
                    const hybridNearest = this.findNearestPythagorean(vector.normX, vector.normY);
                    quantizedNormX = hybridNearest.x;
                    quantizedNormY = hybridNearest.y;
                } else {
                    // General → Turbo
                    const hLevels = Math.pow(2, this.bits);
                    quantizedNormX = Math.round(vector.normX * hLevels) / hLevels;
                    quantizedNormY = Math.round(vector.normY * hLevels) / hLevels;
                }
                break;
        }

        quantX = centerX + quantizedNormX * radius;
        quantY = centerY + quantizedNormY * radius;

        return {
            ...vector,
            quantized: {
                x: quantX,
                y: quantY,
                normX: quantizedNormX,
                normY: quantizedNormY
            }
        };
    }

    findNearestPythagorean(x, y) {
        let nearest = this.pythagoreanLattice[0];
        let minDist = Infinity;

        for (const lattice of this.pythagoreanLattice) {
            const dist = Math.hypot(x - lattice.x, y - lattice.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = lattice;
            }
        }

        return nearest;
    }

    computeMetrics() {
        if (this.quantizedVectors.length === 0 || !this.quantizedVectors[0].quantized) {
            return null;
        }

        let totalMSE = 0;
        let totalNormError = 0;
        let totalInnerProductError = 0;

        for (let i = 0; i < this.quantizedVectors.length; i++) {
            const orig = this.originalVectors[i];
            const quant = this.quantizedVectors[i].quantized;

            // MSE
            totalMSE += Math.pow(orig.normX - quant.normX, 2) + Math.pow(orig.normY - quant.normY, 2);

            // Norm preservation
            const origNorm = Math.sqrt(orig.normX * orig.normX + orig.normY * orig.normY);
            const quantNorm = Math.sqrt(quant.normX * quant.normX + quant.normY * quant.normY);
            totalNormError += Math.abs(quantNorm - origNorm);

            // Inner product preservation (compare with first vector)
            if (i > 0) {
                const orig0 = this.originalVectors[0];
                const quant0 = this.quantizedVectors[0].quantized;
                const origIP = orig0.normX * orig.normX + orig0.normY * orig.normY;
                const quantIP = quant0.normX * quant.normX + quant0.normY * quant.normY;
                totalInnerProductError += Math.abs(origIP - quantIP);
            }
        }

        const mse = totalMSE / this.quantizedVectors.length;
        const normError = totalNormError / this.quantizedVectors.length;
        const innerProductError = totalInnerProductError / (this.quantizedVectors.length - 1);
        const compressionRatio = 32 / this.bits;

        return {
            mse,
            normError,
            innerProductError,
            compressionRatio,
            theoreticalMSE: this.computeTheoreticalMSE()
        };
    }

    computeTheoreticalMSE() {
        // Theoretical minimum MSE for b-bit quantization
        // D*(b,d) ≈ 2^(-2b) for uniform distribution
        return Math.pow(2, -2 * this.bits);
    }

    updateMetrics(metrics) {
        const mseEl = document.getElementById('mseValue');
        const normEl = document.getElementById('normValue');
        const ipEl = document.getElementById('innerProductValue');
        const compEl = document.getElementById('compressionValue');
        const theoryEl = document.getElementById('mseTheory');

        if (!metrics) {
            mseEl.textContent = '-';
            normEl.textContent = '-';
            ipEl.textContent = '-';
            compEl.textContent = '-';
            theoryEl.textContent = '-';
            return;
        }

        mseEl.textContent = metrics.mse.toExponential(2);
        mseEl.className = `metric-value ${metrics.mse < metrics.theoreticalMSE * 1.2 ? 'good' : 'neutral'}`;

        normEl.textContent = metrics.normError.toExponential(2);
        normEl.className = `metric-value ${metrics.normError < 1e-10 ? 'good' : metrics.normError < 0.01 ? 'neutral' : 'bad'}`;

        ipEl.textContent = metrics.innerProductError.toExponential(2);
        ipEl.className = `metric-value ${metrics.innerProductError < 0.01 ? 'good' : 'neutral'}`;

        compEl.textContent = `${metrics.compressionRatio.toFixed(1)}x`;
        theoryEl.textContent = metrics.theoreticalMSE.toExponential(2);
    }

    compareAllModes() {
        const modes = ['ternary', 'polar', 'turbo', 'hybrid'];
        const results = [];

        for (const mode of modes) {
            this.mode = mode;
            const quantized = this.originalVectors.map(v => this.quantizeVector(v));
            
            // Compute metrics
            let totalMSE = 0;
            let totalNormError = 0;
            let totalInnerProductError = 0;

            for (let i = 0; i < quantized.length; i++) {
                const orig = this.originalVectors[i];
                const quant = quantized[i].quantized;

                totalMSE += Math.pow(orig.normX - quant.normX, 2) + Math.pow(orig.normY - quant.normY, 2);

                const origNorm = Math.sqrt(orig.normX * orig.normX + orig.normY * orig.normY);
                const quantNorm = Math.sqrt(quant.normX * quant.normX + quant.normY * quant.normY);
                totalNormError += Math.abs(quantNorm - origNorm);

                if (i > 0) {
                    const orig0 = this.originalVectors[0];
                    const quant0 = quantized[0].quantized;
                    const origIP = orig0.normX * orig.normX + orig0.normY * orig.normY;
                    const quantIP = quant0.normX * quant.normX + quant0.normY * quant.normY;
                    totalInnerProductError += Math.abs(origIP - quantIP);
                }
            }

            results.push({
                mode,
                mse: totalMSE / quantized.length,
                normError: totalNormError / quantized.length,
                innerProduct: totalInnerProductError / (quantized.length - 1),
                bestFor: this.getBestFor(mode)
            });
        }

        this.updateComparisonTable(results);
        
        // Restore original mode
        this.mode = document.getElementById('quantMode').value;
    }

    getBestFor(mode) {
        const bestFor = {
            ternary: 'LLM weights',
            polar: 'Embeddings',
            turbo: 'General',
            hybrid: 'Mixed'
        };
        return bestFor[mode] || 'General';
    }

    updateComparisonTable(results) {
        const tbody = document.getElementById('comparisonBody');
        tbody.innerHTML = results.map(r => `
            <tr>
                <td><strong>${r.mode.toUpperCase()}</strong></td>
                <td class="${r.mse < 0.01 ? 'good' : 'neutral'}">${r.mse.toExponential(2)}</td>
                <td class="${r.normError < 1e-10 ? 'good' : r.normError < 0.01 ? 'neutral' : 'bad'}">${r.normError.toExponential(2)}</td>
                <td class="${r.innerProduct < 0.01 ? 'good' : 'neutral'}">${r.innerProduct.toExponential(2)}</td>
                <td>${r.bestFor}</td>
            </tr>
        `).join('');
    }

    exportResults() {
        const data = {
            timestamp: new Date().toISOString(),
            mode: this.mode,
            bits: this.bits,
            dimension: this.dimension,
            vectorCount: this.vectorCount,
            metrics: this.computeMetrics(),
            vectors: this.quantizedVectors.map((v, i) => ({
                original: { x: this.originalVectors[i].normX, y: this.originalVectors[i].normY },
                quantized: v.quantized ? { x: v.quantized.normX, y: v.quantized.normY } : null
            }))
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quantization-results-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    renderOriginalSpace() {
        const ctx = this.originalCtx;
        
        // Clear
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const radius = Math.min(this.canvasWidth, this.canvasHeight) * 0.35;

        // Draw unit circle
        ctx.strokeStyle = 'rgba(123, 44, 191, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(this.canvasWidth, centerY);
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, this.canvasHeight);
        ctx.stroke();

        // Draw lattice (dim)
        ctx.fillStyle = 'rgba(0, 217, 255, 0.1)';
        for (const lattice of this.pythagoreanLattice.slice(0, 50)) {
            ctx.beginPath();
            ctx.arc(centerX + lattice.x * radius, centerY + lattice.y * radius, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw vectors
        this.originalVectors.forEach((vector, index) => {
            // Draw vector line from center
            ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(vector.x, vector.y);
            ctx.stroke();

            // Draw point
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.arc(vector.x, vector.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // Label
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Original: ${this.originalVectors.length} vectors`, centerX, this.canvasHeight - 15);
    }

    renderQuantizedSpace() {
        const ctx = this.quantizedCtx;
        
        // Clear
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const radius = Math.min(this.canvasWidth, this.canvasHeight) * 0.35;

        // Draw unit circle
        ctx.strokeStyle = 'rgba(123, 44, 191, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(this.canvasWidth, centerY);
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, this.canvasHeight);
        ctx.stroke();

        // Draw lattice (bright)
        ctx.fillStyle = 'rgba(0, 255, 136, 0.5)';
        for (const lattice of this.pythagoreanLattice.slice(0, 50)) {
            ctx.beginPath();
            ctx.arc(centerX + lattice.x * radius, centerY + lattice.y * radius, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw quantized vectors
        this.quantizedVectors.forEach((vector, index) => {
            if (vector.quantized || (this.isAnimating && vector.animX !== undefined)) {
                const qx = this.isAnimating && vector.animX !== undefined ? vector.animX : vector.quantized?.x;
                const qy = this.isAnimating && vector.animY !== undefined ? vector.animY : vector.quantized?.y;

                if (qx === undefined) return;

                // Draw distortion line if enabled
                if (this.showDistortion) {
                    ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(this.originalVectors[index].x, this.originalVectors[index].y);
                    ctx.lineTo(qx, qy);
                    ctx.stroke();
                }

                // Draw vector line from center
                ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(qx, qy);
                ctx.stroke();

                // Draw point with glow
                const gradient = ctx.createRadialGradient(qx, qy, 0, qx, qy, 10);
                gradient.addColorStop(0, 'rgba(0, 255, 136, 0.3)');
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(qx, qy, 10, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#00ff88';
                ctx.beginPath();
                ctx.arc(qx, qy, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Mode label
        ctx.fillStyle = '#00d9ff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Mode: ${this.mode.toUpperCase()}`, 10, 25);
        ctx.fillText(`Bits: ${this.bits}`, 10, 45);

        // Count
        const quantizedCount = this.quantizedVectors.filter(v => v.quantized).length;
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Quantized: ${quantizedCount} / ${this.quantizedVectors.length}`, centerX, this.canvasHeight - 15);
    }

    update(dt) {
        // Animation updates handled in animateQuantization
    }

    render() {
        this.renderOriginalSpace();
        this.renderQuantizedSpace();
    }

    loop(timestamp) {
        const dt = timestamp - this.lastFrameTime;
        
        this.update(Math.min(dt, 32));
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
    new QuantizationPlayground();
});

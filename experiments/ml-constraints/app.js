// ML Constraint Layers Experiment
// Demonstrates neural networks with constraint enforcement

class MLConstraintsDemo {
    constructor() {
        // Canvas setup
        this.networkCanvas = document.getElementById('networkCanvas');
        this.weightCanvas = document.getElementById('weightCanvas');
        this.gradientCanvas = document.getElementById('gradientCanvas');
        this.constraintCanvas = document.getElementById('constraintCanvas');
        
        this.networkCtx = this.networkCanvas.getContext('2d');
        this.weightCtx = this.weightCanvas.getContext('2d');
        this.gradientCtx = this.gradientCanvas.getContext('2d');
        this.constraintCtx = this.constraintCanvas.getContext('2d');

        // State
        this.layers = [];
        this.weights = [];
        this.gradients = [];
        this.constraintErrors = [];
        this.isTraining = false;
        this.trainingStep = 0;
        this.totalSnaps = 0;
        this.totalDriftPrevented = 0;

        // Parameters
        this.networkDepth = 4;
        this.hiddenWidth = 64;
        this.constraintType = 'unit_norm';
        this.epsilon = 1e-6;
        this.snapGradients = true;
        this.showHiddenDims = true;
        this.animateTraining = true;

        // Pythagorean lattice for snapping
        this.pythagoreanLattice = this.generatePythagoreanLattice(200);

        // Animation
        this.animationTime = 0;
        this.lastFrameTime = performance.now();

        // Initialize
        this.setupCanvas();
        this.setupControls();
        this.initializeNetwork();
        this.startAnimation();
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        
        [this.networkCanvas, this.weightCanvas, this.gradientCanvas, this.constraintCanvas].forEach(canvas => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
        });

        this.networkWidth = 800;
        this.networkHeight = 500;
        this.panelWidth = 350;
        this.panelHeight = 250;
    }

    setupControls() {
        // Network depth
        const depthSlider = document.getElementById('networkDepth');
        depthSlider.addEventListener('input', (e) => {
            this.networkDepth = parseInt(e.target.value);
            document.getElementById('depthValue').textContent = `${this.networkDepth} layers`;
            this.initializeNetwork();
        });

        // Hidden width
        const widthSlider = document.getElementById('hiddenWidth');
        widthSlider.addEventListener('input', (e) => {
            this.hiddenWidth = parseInt(e.target.value);
            document.getElementById('widthValue').textContent = `${this.hiddenWidth} units`;
            this.initializeNetwork();
        });

        // Constraint type
        document.getElementById('constraintType').addEventListener('change', (e) => {
            this.constraintType = e.target.value;
            this.initializeNetwork();
        });

        // Precision
        const precisionSlider = document.getElementById('precisionSlider');
        precisionSlider.addEventListener('input', (e) => {
            const exp = parseFloat(e.target.value);
            this.epsilon = Math.pow(10, exp);
            document.getElementById('precisionValue').textContent = `10^${exp}`;
            document.getElementById('hiddenMetric').textContent = this.computeHiddenDims();
        });

        // Checkboxes
        document.getElementById('snapGradients').addEventListener('change', (e) => {
            this.snapGradients = e.target.checked;
        });

        document.getElementById('showHiddenDims').addEventListener('change', (e) => {
            this.showHiddenDims = e.target.checked;
        });

        document.getElementById('animateTraining').addEventListener('change', (e) => {
            this.animateTraining = e.target.checked;
        });

        // Buttons
        document.getElementById('trainBtn').addEventListener('click', () => {
            this.isTraining = !this.isTraining;
            document.getElementById('trainBtn').textContent = this.isTraining ? 'Stop Training' : 'Start Training';
            document.getElementById('trainBtn').classList.toggle('active', this.isTraining);
        });

        document.getElementById('stepBtn').addEventListener('click', () => {
            this.trainingStep();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.initializeNetwork();
        });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                e.preventDefault();
                this.isTraining = !this.isTraining;
                document.getElementById('trainBtn').textContent = this.isTraining ? 'Stop Training' : 'Start Training';
            }
            if (e.key === 's') this.trainingStep();
            if (e.key === 'r') this.initializeNetwork();
        });

        // Initial hidden dims
        document.getElementById('hiddenMetric').textContent = this.computeHiddenDims();
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
                    }
                }
            }
        }
        return lattice;
    }

    gcd(a, b) {
        return b === 0 ? a : this.gcd(b, a % b);
    }

    computeHiddenDims() {
        return Math.ceil(Math.log2(1 / this.epsilon));
    }

    initializeNetwork() {
        this.trainingStep = 0;
        this.totalSnaps = 0;
        this.totalDriftPrevented = 0;
        this.constraintErrors = [];

        // Create layer structure
        this.layers = [];
        for (let i = 0; i < this.networkDepth; i++) {
            const isConstraintLayer = i % 2 === 1; // Every other layer has constraints
            this.layers.push({
                index: i,
                hasConstraint: isConstraintLayer,
                constraintType: isConstraintLayer ? this.constraintType : null,
                hiddenDims: isConstraintLayer ? this.computeHiddenDims() : 0
            });
        }

        // Initialize weights for each layer
        this.weights = [];
        for (let i = 0; i < this.networkDepth - 1; i++) {
            const layerWeights = [];
            for (let j = 0; j < this.hiddenWidth; j++) {
                // Random weights centered around 0
                layerWeights.push((Math.random() - 0.5) * 2);
            }
            this.weights.push(layerWeights);
        }

        // Initialize gradient history
        this.gradients = this.weights.map(w => w.map(() => 0));

        this.updateMetrics();
    }

    trainingStep() {
        this.trainingStep++;

        // Simulate gradient computation
        for (let i = 0; i < this.weights.length; i++) {
            for (let j = 0; j < this.weights[i].length; j++) {
                // Simulated gradient (random walk with drift)
                const drift = (Math.random() - 0.5) * 0.1;
                this.gradients[i][j] = drift;

                // Apply gradient
                this.weights[i][j] += drift;

                // Track drift that would accumulate
                this.totalDriftPrevented += Math.abs(drift);
            }
        }

        // Snap to constraints if enabled
        if (this.snapGradients && this.layers[this.trainingStep % this.layers.length]?.hasConstraint) {
            this.snapToConstraints();
        }

        // Compute constraint error
        this.computeConstraintError();

        this.updateMetrics();
    }

    snapToConstraints() {
        let snaps = 0;

        for (let i = 0; i < this.weights.length; i++) {
            if (this.layers[i]?.hasConstraint) {
                for (let j = 0; j < this.weights[i].length; j++) {
                    const original = this.weights[i][j];
                    
                    // Snap to nearest Pythagorean ratio
                    const snapped = this.snapToPythagorean(original);
                    
                    if (snapped !== original) {
                        snaps++;
                        this.weights[i][j] = snapped;
                    }
                }
            }
        }

        this.totalSnaps += snaps;
    }

    snapToPythagorean(value) {
        // Find nearest Pythagorean ratio
        let best = value;
        let minDist = Infinity;

        for (const lattice of this.pythagoreanLattice) {
            // Check both x and y ratios
            for (const ratio of [lattice.x, lattice.y, -lattice.x, -lattice.y]) {
                const dist = Math.abs(value - ratio);
                if (dist < minDist) {
                    minDist = dist;
                    best = ratio;
                }
            }
        }

        // Also check simple rational approximations
        for (let d = 1; d <= 20; d++) {
            const n = Math.round(value * d);
            const ratio = n / d;
            const dist = Math.abs(value - ratio);
            if (dist < minDist) {
                minDist = dist;
                best = ratio;
            }
        }

        return best;
    }

    computeConstraintError() {
        let totalError = 0;
        let count = 0;

        for (let i = 0; i < this.weights.length; i++) {
            if (this.layers[i]?.hasConstraint) {
                for (let j = 0; j < this.weights[i].length; j++) {
                    const w = this.weights[i][j];
                    
                    switch (this.constraintType) {
                        case 'unit_norm':
                            // Error from |w| = 1
                            totalError += Math.abs(Math.abs(w) - 1);
                            break;
                        case 'bounded':
                            // Error from w in [-1, 1]
                            if (w > 1) totalError += w - 1;
                            if (w < -1) totalError += -1 - w;
                            break;
                        case 'sparse':
                            // Count non-zero
                            if (Math.abs(w) > 0.1) totalError += 1;
                            break;
                        case 'positive':
                            // Error from w > 0
                            if (w < 0) totalError += -w;
                            break;
                    }
                    count++;
                }
            }
        }

        const avgError = count > 0 ? totalError / count : 0;
        this.constraintErrors.push(avgError);

        // Keep last 100 errors
        if (this.constraintErrors.length > 100) {
            this.constraintErrors.shift();
        }
    }

    updateMetrics() {
        document.getElementById('stepMetric').textContent = this.trainingStep;
        
        const lastError = this.constraintErrors[this.constraintErrors.length - 1];
        const errorEl = document.getElementById('constraintMetric');
        if (lastError !== undefined) {
            errorEl.textContent = lastError.toExponential(2);
            errorEl.className = `metric-value ${lastError < this.epsilon ? 'good' : lastError < 0.01 ? 'neutral' : 'bad'}`;
        }
        
        document.getElementById('snapsMetric').textContent = this.totalSnaps;
        document.getElementById('driftMetric').textContent = this.totalDriftPrevented.toFixed(2);
        
        const precisionEl = document.getElementById('precisionMetric');
        if (lastError !== undefined) {
            precisionEl.textContent = lastError < this.epsilon ? this.epsilon.toExponential(0) : `>${this.epsilon.toExponential(0)}`;
            precisionEl.className = `metric-value ${lastError < this.epsilon ? 'good' : 'bad'}`;
        }
    }

    renderNetwork() {
        const ctx = this.networkCtx;
        
        // Clear
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.networkWidth, this.networkHeight);

        const layerSpacing = this.networkWidth / (this.networkDepth + 1);
        const verticalSpacing = Math.min(40, (this.networkHeight - 100) / Math.min(10, this.hiddenWidth));
        const visibleNeurons = Math.min(10, this.hiddenWidth);

        // Draw connections first
        for (let l = 0; l < this.networkDepth - 1; l++) {
            const x1 = layerSpacing * (l + 1);
            const x2 = layerSpacing * (l + 2);
            
            for (let i = 0; i < visibleNeurons; i++) {
                const y1 = 50 + i * verticalSpacing;
                
                for (let j = 0; j < visibleNeurons; j++) {
                    const y2 = 50 + j * verticalSpacing;
                    
                    // Get weight for coloring
                    const weightIndex = i * this.hiddenWidth + j;
                    const weight = this.weights[l]?.[weightIndex % this.weights[l].length] || 0;
                    
                    // Color by weight sign and magnitude
                    const alpha = Math.min(0.3, Math.abs(weight) * 0.3);
                    if (weight > 0) {
                        ctx.strokeStyle = `rgba(0, 255, 136, ${alpha})`;
                    } else {
                        ctx.strokeStyle = `rgba(255, 107, 107, ${alpha})`;
                    }
                    ctx.lineWidth = 0.5;
                    
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
            }
        }

        // Draw neurons
        for (let l = 0; l < this.networkDepth; l++) {
            const x = layerSpacing * (l + 1);
            const layer = this.layers[l];
            
            // Draw layer background
            if (layer?.hasConstraint) {
                const gradient = ctx.createRadialGradient(x, this.networkHeight / 2, 0, x, this.networkHeight / 2, layerSpacing / 2);
                gradient.addColorStop(0, 'rgba(0, 255, 136, 0.1)');
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.fillRect(x - layerSpacing / 2, 0, layerSpacing, this.networkHeight);
            }

            for (let i = 0; i < visibleNeurons; i++) {
                const y = 50 + i * verticalSpacing;
                
                // Neuron circle
                const isConstraint = layer?.hasConstraint;
                
                // Glow for constraint layers
                if (isConstraint) {
                    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
                    gradient.addColorStop(0, 'rgba(0, 255, 136, 0.3)');
                    gradient.addColorStop(1, 'transparent');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(x, y, 15, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Main circle
                ctx.fillStyle = isConstraint ? '#00ff88' : '#ff6b6b';
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, Math.PI * 2);
                ctx.fill();
                
                // Hidden dimension indicator
                if (this.showHiddenDims && isConstraint && i < 3) {
                    ctx.strokeStyle = 'rgba(123, 44, 191, 0.5)';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([2, 2]);
                    ctx.beginPath();
                    ctx.arc(x, y, 10 + i * 2, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }

            // Layer label
            ctx.fillStyle = isConstraint ? '#00ff88' : '#ff6b6b';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`Layer ${l + 1}`, x, this.networkHeight - 30);
            
            if (layer?.hasConstraint) {
                ctx.fillStyle = '#7b2cbf';
                ctx.font = '10px sans-serif';
                ctx.fillText(`k=${layer.hiddenDims}`, x, this.networkHeight - 15);
            }
        }

        // Title
        ctx.fillStyle = '#00d9ff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Constraint: ${this.constraintType.toUpperCase()}`, 10, 25);
        ctx.fillText(`Step: ${this.trainingStep}`, 10, 45);
    }

    renderWeightDistribution() {
        const ctx = this.weightCtx;
        const width = this.panelWidth;
        const height = this.panelHeight;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        // Collect all weights
        const allWeights = this.weights.flat();
        if (allWeights.length === 0) return;

        // Histogram
        const bins = 20;
        const minW = -2, maxW = 2;
        const binWidth = (maxW - minW) / bins;
        const histogram = new Array(bins).fill(0);

        for (const w of allWeights) {
            const bin = Math.floor((w - minW) / binWidth);
            if (bin >= 0 && bin < bins) {
                histogram[bin]++;
            }
        }

        const maxCount = Math.max(...histogram);
        const barHeight = (height - 60) / maxCount;
        const barWidth = (width - 40) / bins;

        // Draw bars
        for (let i = 0; i < bins; i++) {
            const x = 20 + i * barWidth;
            const h = histogram[i] * barHeight;
            const y = height - 30 - h;

            // Color by position (center vs edges)
            const centerDist = Math.abs(i - bins / 2) / (bins / 2);
            if (centerDist < 0.2) {
                ctx.fillStyle = 'rgba(0, 255, 136, 0.7)';
            } else {
                ctx.fillStyle = 'rgba(0, 217, 255, 0.5)';
            }

            ctx.fillRect(x, y, barWidth - 2, h);
        }

        // Draw constraint line (unit norm = ±1)
        ctx.strokeStyle = '#7b2cbf';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        // -1 line
        const x1 = 20 + ((-1 - minW) / binWidth) * barWidth;
        ctx.beginPath();
        ctx.moveTo(x1, 20);
        ctx.lineTo(x1, height - 30);
        ctx.stroke();
        
        // +1 line
        const x2 = 20 + ((1 - minW) / binWidth) * barWidth;
        ctx.beginPath();
        ctx.moveTo(x2, 20);
        ctx.lineTo(x2, height - 30);
        ctx.stroke();
        
        ctx.setLineDash([]);

        // Labels
        ctx.fillStyle = '#666';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('-2', 20, height - 10);
        ctx.fillText('0', width / 2, height - 10);
        ctx.fillText('2', width - 20, height - 10);

        // Constraint label
        ctx.fillStyle = '#7b2cbf';
        ctx.fillText('constraint ±1', width / 2, 15);
    }

    renderGradientFlow() {
        const ctx = this.gradientCtx;
        const width = this.panelWidth;
        const height = this.panelHeight;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        if (this.gradients.length === 0) return;

        // Draw gradient magnitudes per layer
        const layerWidth = (width - 40) / this.gradients.length;
        const maxGrad = Math.max(...this.gradients.flat().map(Math.abs), 0.1);

        for (let l = 0; l < this.gradients.length; l++) {
            const x = 20 + l * layerWidth;
            const grads = this.gradients[l];
            
            // Draw gradient bars
            for (let i = 0; i < Math.min(grads.length, 50); i++) {
                const y = 30 + (i / 50) * (height - 60);
                const gradMag = Math.abs(grads[i]) / maxGrad;
                
                // Bar length
                const barLen = gradMag * (layerWidth - 10);
                
                ctx.fillStyle = grads[i] > 0 ? 'rgba(0, 255, 136, 0.7)' : 'rgba(255, 107, 107, 0.7)';
                ctx.fillRect(x + 5, y, barLen, 3);
            }

            // Layer label
            ctx.fillStyle = this.layers[l]?.hasConstraint ? '#00ff88' : '#ff6b6b';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`L${l + 1}`, x + layerWidth / 2, height - 10);
        }

        // Title
        ctx.fillStyle = '#00d9ff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Gradient Magnitude', 10, 20);
    }

    renderConstraintSatisfaction() {
        const ctx = this.constraintCtx;
        const width = this.panelWidth;
        const height = this.panelHeight;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        if (this.constraintErrors.length < 2) return;

        // Draw error over time
        const padding = 30;
        const plotWidth = width - padding * 2;
        const plotHeight = height - padding * 2;

        // Draw threshold line (epsilon)
        const thresholdY = padding + plotHeight * (1 - Math.log10(this.epsilon) / -10);
        ctx.strokeStyle = 'rgba(123, 44, 191, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(padding, thresholdY);
        ctx.lineTo(width - padding, thresholdY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#7b2cbf';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`ε = ${this.epsilon.toExponential(0)}`, width - padding - 60, thresholdY - 5);

        // Draw error line
        ctx.strokeStyle = '#00d9ff';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const maxError = Math.max(...this.constraintErrors, 0.01);

        for (let i = 0; i < this.constraintErrors.length; i++) {
            const x = padding + (i / (this.constraintErrors.length - 1)) * plotWidth;
            const y = padding + plotHeight * (1 - this.constraintErrors[i] / maxError);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();

        // Draw points
        for (let i = 0; i < this.constraintErrors.length; i++) {
            const x = padding + (i / (this.constraintErrors.length - 1)) * plotWidth;
            const y = padding + plotHeight * (1 - this.constraintErrors[i] / maxError);
            
            ctx.fillStyle = this.constraintErrors[i] < this.epsilon ? '#00ff88' : '#ff6b6b';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Axes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#666';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Training Step', width / 2, height - 5);
        
        ctx.save();
        ctx.translate(10, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Constraint Error', 0, 0);
        ctx.restore();
    }

    update(dt) {
        if (this.isTraining && this.animateTraining) {
            // One training step every 100ms
            if (Math.floor(this.animationTime / 100) !== Math.floor((this.animationTime + dt) / 100)) {
                this.trainingStep();
            }
        }

        this.animationTime += dt;
    }

    render() {
        this.renderNetwork();
        this.renderWeightDistribution();
        this.renderGradientFlow();
        this.renderConstraintSatisfaction();
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
    new MLConstraintsDemo();
});

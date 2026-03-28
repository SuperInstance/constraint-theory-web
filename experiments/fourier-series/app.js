// Fourier Series Builder - Constraint Theory Simulator
// Demonstrates geometric constraints of harmonic decomposition

class FourierSimulator {
    constructor() {
        this.waveformCanvas = document.getElementById('waveformCanvas');
        this.spectrumCanvas = document.getElementById('spectrumCanvas');
        this.waveformCtx = this.waveformCanvas.getContext('2d');
        this.spectrumCtx = this.spectrumCanvas.getContext('2d');

        this.harmonics = 10;
        this.activeHarmonics = new Array(51).fill(true); // Track which harmonics are active
        this.waveformType = 'square';
        this.animationSpeed = 0.5;
        this.time = 0;
        this.isAnimating = true;
        this.buildAnimation = false;
        this.buildHarmonic = 0;

        this.customWaveform = null; // Store custom drawn waveform
        this.customCoefficients = null; // DFT of custom waveform

        this.showOriginal = true;
        this.showApproximation = true;
        this.showHarmonics = false;
        this.showEpicycles = false;

        this.isDrawing = false;
        this.drawPoints = [];

        this.setupCanvas();
        this.setupEventListeners();
        this.animate();
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;

        // Waveform canvas
        this.waveformCanvas.width = 900 * dpr;
        this.waveformCanvas.height = 300 * dpr;
        this.waveformCanvas.style.width = '900px';
        this.waveformCanvas.style.height = '300px';
        this.waveformCtx.scale(dpr, dpr);

        // Spectrum canvas
        this.spectrumCanvas.width = 900 * dpr;
        this.spectrumCanvas.height = 200 * dpr;
        this.spectrumCanvas.style.width = '900px';
        this.spectrumCanvas.style.height = '200px';
        this.spectrumCtx.scale(dpr, dpr);
    }

    setupEventListeners() {
        document.getElementById('waveformSelect').addEventListener('change', (e) => {
            this.waveformType = e.target.value;
            if (this.waveformType !== 'custom') {
                this.customWaveform = null;
                this.customCoefficients = null;
            }
            this.resetActiveHarmonics();
        });

        document.getElementById('harmonicSlider').addEventListener('input', (e) => {
            this.harmonics = parseInt(e.target.value);
            document.getElementById('harmonicCount').textContent = this.harmonics;
            this.resetActiveHarmonics();
        });

        document.getElementById('speedSlider').addEventListener('input', (e) => {
            this.animationSpeed = e.target.value / 100;
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetActiveHarmonics();
            this.time = 0;
            this.buildAnimation = false;
            this.buildHarmonic = 0;
        });

        document.getElementById('animateBtn').addEventListener('click', () => {
            this.buildAnimation = true;
            this.buildHarmonic = 0;
            this.resetActiveHarmonics();
            // Deactivate all harmonics initially
            this.activeHarmonics.fill(false);
        });

        document.getElementById('showOriginal').addEventListener('change', (e) => {
            this.showOriginal = e.target.checked;
        });

        document.getElementById('showApproximation').addEventListener('change', (e) => {
            this.showApproximation = e.target.checked;
        });

        document.getElementById('showHarmonics').addEventListener('change', (e) => {
            this.showHarmonics = e.target.checked;
        });

        document.getElementById('showEpicycles').addEventListener('change', (e) => {
            this.showEpicycles = e.target.checked;
        });

        // Spectrum canvas click handler
        this.spectrumCanvas.addEventListener('click', (e) => {
            const rect = this.spectrumCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const harmonic = Math.floor(x / (900 / this.harmonics));
            if (harmonic >= 0 && harmonic < this.harmonics) {
                this.activeHarmonics[harmonic] = !this.activeHarmonics[harmonic];
            }
        });

        // Custom waveform drawing
        this.waveformCanvas.addEventListener('mousedown', (e) => {
            if (this.waveformType === 'custom') {
                this.isDrawing = true;
                this.drawPoints = [];
                const rect = this.waveformCanvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.drawPoints.push({ x, y });
            }
        });

        this.waveformCanvas.addEventListener('mousemove', (e) => {
            if (this.isDrawing && this.waveformType === 'custom') {
                const rect = this.waveformCanvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.drawPoints.push({ x, y });
            }
        });

        this.waveformCanvas.addEventListener('mouseup', () => {
            if (this.isDrawing && this.waveformType === 'custom') {
                this.isDrawing = false;
                this.processCustomWaveform();
            }
        });

        this.waveformCanvas.addEventListener('mouseleave', () => {
            if (this.isDrawing && this.waveformType === 'custom') {
                this.isDrawing = false;
                this.processCustomWaveform();
            }
        });
    }

    resetActiveHarmonics() {
        this.activeHarmonics = new Array(51).fill(true);
        for (let i = this.harmonics + 1; i < 51; i++) {
            this.activeHarmonics[i] = false;
        }
    }

    // Fourier series coefficients for standard waveforms
    getCoefficient(n) {
        switch (this.waveformType) {
            case 'square':
                // Square wave: odd harmonics only, amplitude = 4/(π*n)
                return n % 2 === 1 ? 4 / (Math.PI * n) : 0;

            case 'sawtooth':
                // Sawtooth: all harmonics, amplitude = 2/(π*n) * (-1)^(n+1)
                return (2 / (Math.PI * n)) * Math.pow(-1, n + 1);

            case 'triangle':
                // Triangle: odd harmonics only, amplitude = 8/(π²*n²) * (-1)^((n-1)/2)
                if (n % 2 === 0) return 0;
                return (8 / (Math.PI * Math.PI * n * n)) * Math.pow(-1, (n - 1) / 2);

            case 'pulse':
                // Pulse wave (25% duty cycle)
                const duty = 0.25;
                return (2 * Math.sin(n * Math.PI * duty)) / (Math.PI * n);

            case 'custom':
                if (this.customCoefficients && n <= this.customCoefficients.length) {
                    return this.customCoefficients[n - 1];
                }
                return 0;

            default:
                return 0;
        }
    }

    // Get original waveform value at position x (0 to 2π)
    getOriginalWaveform(x) {
        x = x % (2 * Math.PI);
        switch (this.waveformType) {
            case 'square':
                return x < Math.PI ? 1 : -1;

            case 'sawtooth':
                return (x / Math.PI) - 1;

            case 'triangle':
                return x < Math.PI ? (2 * x / Math.PI) - 1 : 3 - (2 * x / Math.PI);

            case 'pulse':
                return x < Math.PI * 0.25 ? 1 : -0.333;

            case 'custom':
                if (this.customWaveform) {
                    const idx = Math.floor((x / (2 * Math.PI)) * this.customWaveform.length);
                    return this.customWaveform[Math.min(idx, this.customWaveform.length - 1)];
                }
                return 0;

            default:
                return 0;
        }
    }

    // Compute Fourier series approximation
    getFourierApproximation(x, maxHarmonic = null) {
        const maxN = maxHarmonic || this.harmonics;
        let sum = 0;

        for (let n = 1; n <= maxN; n++) {
            if (this.activeHarmonics[n - 1]) {
                const coeff = this.getCoefficient(n);
                sum += coeff * Math.sin(n * x);
            }
        }

        return sum;
    }

    // Process custom waveform using DFT
    processCustomWaveform() {
        if (this.drawPoints.length < 2) return;

        // Convert draw points to waveform samples
        const samples = 256;
        this.customWaveform = new Array(samples).fill(0);

        // Sort points by x and interpolate
        this.drawPoints.sort((a, b) => a.x - b.x);

        for (let i = 0; i < samples; i++) {
            const x = (i / samples) * 900;
            // Find surrounding points and interpolate
            let y = 0;
            for (let j = 0; j < this.drawPoints.length - 1; j++) {
                if (this.drawPoints[j].x <= x && this.drawPoints[j + 1].x >= x) {
                    const t = (x - this.drawPoints[j].x) / (this.drawPoints[j + 1].x - this.drawPoints[j].x);
                    y = this.drawPoints[j].y + t * (this.drawPoints[j + 1].y - this.drawPoints[j].y);
                    break;
                }
            }
            // Convert y to [-1, 1] range
            this.customWaveform[i] = 1 - (2 * y / 300);
        }

        // Compute DFT to get Fourier coefficients
        this.customCoefficients = new Array(this.harmonics).fill(0);
        for (let n = 1; n <= this.harmonics; n++) {
            let sum = 0;
            for (let i = 0; i < samples; i++) {
                const x = (i / samples) * 2 * Math.PI;
                sum += this.customWaveform[i] * Math.sin(n * x);
            }
            this.customCoefficients[n - 1] = (2 * sum) / samples;
        }
    }

    // Calculate RMS error
    calculateRMSError() {
        const samples = 1000;
        let sumSquaredError = 0;

        for (let i = 0; i < samples; i++) {
            const x = (i / samples) * 2 * Math.PI;
            const original = this.getOriginalWaveform(x);
            const approx = this.getFourierApproximation(x);
            const error = original - approx;
            sumSquaredError += error * error;
        }

        return Math.sqrt(sumSquaredError / samples);
    }

    // Calculate Gibbs overshoot
    calculateGibbsOvershoot() {
        if (this.waveformType !== 'square' && this.waveformType !== 'pulse') return 0;

        // Sample near discontinuity
        const samples = 100;
        let maxOvershoot = 0;

        for (let i = 0; i < samples; i++) {
            const x = Math.PI - (i / samples) * 0.1; // Just before discontinuity
            const approx = this.getFourierApproximation(x);
            const expected = this.getOriginalWaveform(x);
            const overshoot = Math.abs(approx) - 1;
            maxOvershoot = Math.max(maxOvershoot, overshoot);
        }

        return maxOvershoot;
    }

    // Get convergence rate
    getConvergenceRate() {
        switch (this.waveformType) {
            case 'square':
            case 'pulse':
                return 'O(1/n)';
            case 'sawtooth':
                return 'O(1/n)';
            case 'triangle':
                return 'O(1/n²)';
            case 'custom':
                return 'Unknown';
            default:
                return 'Unknown';
        }
    }

    drawWaveform() {
        const ctx = this.waveformCtx;
        const width = 900;
        const height = 300;
        const centerY = height / 2;
        const amplitude = 100;

        ctx.clearRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const x = (i / 10) * width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();

        // Draw custom waveform while drawing
        if (this.isDrawing && this.drawPoints.length > 1) {
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.drawPoints[0].x, this.drawPoints[0].y);
            for (let i = 1; i < this.drawPoints.length; i++) {
                ctx.lineTo(this.drawPoints[i].x, this.drawPoints[i].y);
            }
            ctx.stroke();
            return;
        }

        // Draw original waveform
        if (this.showOriginal && this.waveformType !== 'custom') {
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let px = 0; px < width; px++) {
                const x = (px / width) * 2 * Math.PI;
                const y = centerY - this.getOriginalWaveform(x) * amplitude;
                if (px === 0) {
                    ctx.moveTo(px, y);
                } else {
                    ctx.lineTo(px, y);
                }
            }
            ctx.stroke();
        }

        // Draw individual harmonics
        if (this.showHarmonics) {
            const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b9d'];
            for (let n = 1; n <= this.harmonics; n++) {
                if (this.activeHarmonics[n - 1]) {
                    const coeff = this.getCoefficient(n);
                    if (Math.abs(coeff) > 0.01) {
                        ctx.strokeStyle = colors[n % colors.length];
                        ctx.lineWidth = 1;
                        ctx.globalAlpha = 0.3;
                        ctx.beginPath();
                        for (let px = 0; px < width; px++) {
                            const x = (px / width) * 2 * Math.PI;
                            const y = centerY - coeff * Math.sin(n * x) * amplitude;
                            if (px === 0) {
                                ctx.moveTo(px, y);
                            } else {
                                ctx.lineTo(px, y);
                            }
                        }
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                }
            }
        }

        // Draw Fourier approximation
        if (this.showApproximation) {
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 3;
            ctx.beginPath();

            const maxHarmonic = this.buildAnimation ? this.buildHarmonic : this.harmonics;

            for (let px = 0; px < width; px++) {
                const x = (px / width) * 2 * Math.PI;
                let sum = 0;

                for (let n = 1; n <= maxHarmonic; n++) {
                    if (this.activeHarmonics[n - 1]) {
                        const coeff = this.getCoefficient(n);
                        sum += coeff * Math.sin(n * x);
                    }
                }

                const y = centerY - sum * amplitude;
                if (px === 0) {
                    ctx.moveTo(px, y);
                } else {
                    ctx.lineTo(px, y);
                }
            }
            ctx.stroke();

            // Draw epicycles at current time
            if (this.showEpicycles) {
                this.drawEpicycles(ctx, width * 0.1, centerY, amplitude);
            }
        }

        // Draw time indicator
        const timeX = ((this.time % (2 * Math.PI)) / (2 * Math.PI)) * width;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(timeX, 0);
        ctx.lineTo(timeX, height);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawEpicycles(ctx, centerX, centerY, amplitude) {
        const maxHarmonic = this.buildAnimation ? this.buildHarmonic : this.harmonics;
        let x = centerX;
        let y = centerY;

        for (let n = 1; n <= maxHarmonic; n++) {
            if (this.activeHarmonics[n - 1]) {
                const coeff = this.getCoefficient(n);
                const radius = Math.abs(coeff) * amplitude;
                const phase = n * this.time;
                const prevX = x;
                const prevY = y;

                x += radius * Math.cos(phase);
                y += radius * Math.sin(phase);

                // Draw circle
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(prevX, prevY, radius, 0, 2 * Math.PI);
                ctx.stroke();

                // Draw radius line
                ctx.strokeStyle = 'rgba(255, 200, 100, 0.8)';
                ctx.beginPath();
                ctx.moveTo(prevX, prevY);
                ctx.lineTo(x, y);
                ctx.stroke();

                // Draw point
                ctx.fillStyle = '#ff6b6b';
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    }

    drawSpectrum() {
        const ctx = this.spectrumCtx;
        const width = 900;
        const height = 200;

        ctx.clearRect(0, 0, width, height);

        const barWidth = (width / this.harmonics) - 2;

        for (let n = 1; n <= this.harmonics; n++) {
            const coeff = this.getCoefficient(n);
            const barHeight = Math.abs(coeff) * 80;
            const x = (n - 1) * (width / this.harmonics);
            const y = height - barHeight;

            // Create gradient
            const gradient = ctx.createLinearGradient(x, height, x, y);
            if (this.activeHarmonics[n - 1]) {
                gradient.addColorStop(0, '#4a90a4');
                gradient.addColorStop(1, '#00ff88');
            } else {
                gradient.addColorStop(0, '#3a3a3a');
                gradient.addColorStop(1, '#5a5a5a');
            }

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);

            // Draw harmonic number
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(n.toString(), x + barWidth / 2, height - 5);

            // Draw coefficient value
            ctx.fillStyle = '#aaaaaa';
            ctx.font = '8px monospace';
            ctx.fillText(coeff.toFixed(3), x + barWidth / 2, y - 5);
        }
    }

    updateStats() {
        const activeCount = this.activeHarmonics.filter(h => h).length;
        document.getElementById('activeHarmonics').textContent = activeCount;

        const rmsError = this.calculateRMSError();
        document.getElementById('rmsError').textContent = rmsError.toFixed(4);

        document.getElementById('convergenceRate').textContent = this.getConvergenceRate();

        const gibbs = this.calculateGibbsOvershoot();
        document.getElementById('gibbsOvershoot').textContent = (gibbs * 100).toFixed(1) + '%';
    }

    animate() {
        if (this.isAnimating) {
            this.time += 0.02 * this.animationSpeed;

            // Handle build animation
            if (this.buildAnimation) {
                if (this.buildHarmonic < this.harmonics) {
                    this.buildHarmonic += 0.05;
                    if (Math.floor(this.buildHarmonic) > this.buildHarmonic - 0.05) {
                        // Just crossed integer boundary - activate this harmonic
                        const harmonicNum = Math.floor(this.buildHarmonic);
                        if (harmonicNum <= this.harmonics) {
                            this.activeHarmonics[harmonicNum - 1] = true;
                        }
                    }
                } else {
                    this.buildAnimation = false;
                    this.buildHarmonic = this.harmonics;
                }
            }

            this.drawWaveform();
            this.drawSpectrum();
            this.updateStats();
        }

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize on load
window.addEventListener('load', () => {
    new FourierSimulator();
});

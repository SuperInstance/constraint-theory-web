// Wave Interference Simulator
// Demonstrates geometric constraint superposition in wave physics

class WaveInterferenceSimulator {
    constructor() {
        this.canvas = document.getElementById('waveCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Simulation parameters
        this.waveSpeed = 50; // pixels per second
        this.baseFrequency = 0.5; // Hz
        this.baseAmplitude = 1.0;
        this.basePhase = 0;

        // Animation state
        this.time = 0;
        this.isPlaying = true;
        this.speedMultiplier = 1.0;
        this.lastFrameTime = 0;

        // Wave sources
        this.sources = [];
        this.selectedSource = null;
        this.dragMode = false;

        // Barriers (line segments)
        this.barriers = [];
        this.barrierMode = false;
        this.drawingBarrier = false;
        this.barrierStart = null;

        // Visualization
        this.vizMode = 'amplitude';
        this.colorScheme = 'blue-black-red';
        this.resolution = 2; // Pixel skip for performance

        // Canvas size
        this.width = 600;
        this.height = 600;

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.addDefaultSources();
        this.updateUI();
        this.animate();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        this.width = Math.min(600, container.clientWidth - 20);
        this.height = 600;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
    }

    setupEventListeners() {
        // Animation controls
        document.getElementById('playPause').addEventListener('click', () => this.togglePlay());
        document.getElementById('reset').addEventListener('click', () => this.resetTime());
        document.getElementById('speed').addEventListener('input', (e) => {
            this.speedMultiplier = parseFloat(e.target.value);
            document.getElementById('speedValue').textContent = this.speedMultiplier.toFixed(1) + 'x';
        });

        // Visualization controls
        document.getElementById('vizMode').addEventListener('change', (e) => {
            this.vizMode = e.target.value;
        });

        document.getElementById('colorScheme').addEventListener('change', (e) => {
            this.colorScheme = e.target.value;
        });

        document.getElementById('resolution').addEventListener('change', (e) => {
            this.resolution = parseInt(e.target.value);
        });

        // Source controls
        document.getElementById('addSource').addEventListener('click', () => this.addSource());
        document.getElementById('clearSources').addEventListener('click', () => this.clearSources());
        document.getElementById('dragMode').addEventListener('change', (e) => {
            this.dragMode = e.target.checked;
        });

        // Barrier controls
        document.getElementById('barrierMode').addEventListener('change', (e) => {
            this.barrierMode = e.target.checked;
        });
        document.getElementById('clearBarriers').addEventListener('click', () => this.clearBarriers());

        // Presets
        document.querySelectorAll('.btn-preset').forEach(btn => {
            btn.addEventListener('click', () => this.loadPreset(btn.dataset.preset));
        });

        // Canvas interaction
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));

        // Window resize
        window.addEventListener('resize', () => this.setupCanvas());
    }

    addDefaultSources() {
        // Two sources with slight phase difference
        this.sources = [
            {
                x: this.width * 0.35,
                y: this.height * 0.5,
                frequency: this.baseFrequency,
                amplitude: this.baseAmplitude,
                phase: 0,
                color: this.getRandomColor()
            },
            {
                x: this.width * 0.65,
                y: this.height * 0.5,
                frequency: this.baseFrequency,
                amplitude: this.baseAmplitude,
                phase: 0,
                color: this.getRandomColor()
            }
        ];
    }

    addSource() {
        if (this.sources.length >= 10) {
            alert('Maximum 10 sources allowed');
            return;
        }

        // Find empty spot
        let x, y;
        let attempts = 0;
        do {
            x = 50 + Math.random() * (this.width - 100);
            y = 50 + Math.random() * (this.height - 100);
            attempts++;
        } while (this.isNearExistingSource(x, y) && attempts < 50);

        this.sources.push({
            x: x,
            y: y,
            frequency: this.baseFrequency,
            amplitude: this.baseAmplitude,
            phase: this.basePhase,
            color: this.getRandomColor()
        });

        this.updateSourceControls();
        this.updateStats();
    }

    clearSources() {
        this.sources = [];
        this.updateSourceControls();
        this.updateStats();
    }

    clearBarriers() {
        this.barriers = [];
    }

    isNearExistingSource(x, y, minDist = 50) {
        return this.sources.some(s => {
            const dx = s.x - x;
            const dy = s.y - y;
            return Math.sqrt(dx * dx + dy * dy) < minDist;
        });
    }

    getRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.barrierMode) {
            this.drawingBarrier = true;
            this.barrierStart = { x, y };
        } else if (this.dragMode) {
            // Check if clicking on a source
            this.selectedSource = this.findNearestSource(x, y, 20);
        } else {
            // Add new source on click (if less than 10)
            if (this.sources.length < 10) {
                this.sources.push({
                    x: x,
                    y: y,
                    frequency: this.baseFrequency,
                    amplitude: this.baseAmplitude,
                    phase: this.basePhase,
                    color: this.getRandomColor()
                });
                this.updateSourceControls();
                this.updateStats();
            }
        }
    }

    handleMouseMove(e) {
        if (!this.drawingBarrier && !this.selectedSource) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.drawingBarrier) {
            // Visual feedback during drawing
            this.render();
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(this.barrierStart.x, this.barrierStart.y);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        } else if (this.selectedSource) {
            this.selectedSource.x = Math.max(10, Math.min(this.width - 10, x));
            this.selectedSource.y = Math.max(10, Math.min(this.height - 10, y));
        }
    }

    handleMouseUp(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.drawingBarrier) {
            this.barriers.push({
                x1: this.barrierStart.x,
                y1: this.barrierStart.y,
                x2: x,
                y2: y
            });
            this.drawingBarrier = false;
            this.barrierStart = null;
        }

        this.selectedSource = null;
    }

    findNearestSource(x, y, maxDist) {
        let nearest = null;
        let minDist = maxDist;

        this.sources.forEach((s, i) => {
            const dx = s.x - x;
            const dy = s.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                nearest = s;
            }
        });

        return nearest;
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        document.getElementById('playPause').textContent = this.isPlaying ? 'Pause' : 'Play';
    }

    resetTime() {
        this.time = 0;
    }

    updateSourceControls() {
        const container = document.getElementById('sourceControls');
        container.innerHTML = '';

        this.sources.forEach((source, i) => {
            const div = document.createElement('div');
            div.className = 'source-control';
            div.innerHTML = `
                <div class="source-header">
                    <span class="source-indicator" style="background-color: ${source.color}"></span>
                    <span class="source-title">Source ${i + 1}</span>
                    <button class="btn-remove" data-index="${i}">×</button>
                </div>
                <div class="source-slider">
                    <label>Freq:</label>
                    <input type="range" class="source-freq" data-index="${i}"
                           min="0.1" max="2" step="0.1" value="${source.frequency}">
                    <span class="source-value">${source.frequency.toFixed(1)}</span>
                </div>
                <div class="source-slider">
                    <label>Amp:</label>
                    <input type="range" class="source-amp" data-index="${i}"
                           min="0.1" max="2" step="0.1" value="${source.amplitude}">
                    <span class="source-value">${source.amplitude.toFixed(1)}</span>
                </div>
                <div class="source-slider">
                    <label>Phase:</label>
                    <input type="range" class="source-phase" data-index="${i}"
                           min="0" max="2 * Math.PI" step="0.1" value="${source.phase}">
                    <span class="source-value">${source.phase.toFixed(1)}</span>
                </div>
            `;
            container.appendChild(div);
        });

        // Add event listeners
        container.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.sources.splice(index, 1);
                this.updateSourceControls();
                this.updateStats();
            });
        });

        container.querySelectorAll('.source-freq').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.sources[index].frequency = parseFloat(e.target.value);
                e.target.nextElementSibling.textContent = e.target.value;
                this.updateStats();
            });
        });

        container.querySelectorAll('.source-amp').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.sources[index].amplitude = parseFloat(e.target.value);
                e.target.nextElementSibling.textContent = e.target.value;
            });
        });

        container.querySelectorAll('.source-phase').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.sources[index].phase = parseFloat(e.target.value);
                e.target.nextElementSibling.textContent = e.target.value;
            });
        });
    }

    updateStats() {
        document.getElementById('sourceCount').textContent = this.sources.length;

        if (this.sources.length > 0) {
            const avgFreq = this.sources.reduce((sum, s) => sum + s.frequency, 0) / this.sources.length;
            const wavelength = this.waveSpeed / avgFreq;
            document.getElementById('wavelength').textContent = wavelength.toFixed(1) + ' px';
            document.getElementById('frequencyDisplay').textContent = avgFreq.toFixed(2) + ' Hz';
        } else {
            document.getElementById('wavelength').textContent = '—';
            document.getElementById('frequencyDisplay').textContent = '—';
        }
    }

    loadPreset(preset) {
        this.clearSources();
        this.clearBarriers();

        switch (preset) {
            case 'two-sources':
                this.sources = [
                    { x: this.width * 0.35, y: this.height * 0.5, frequency: 0.5, amplitude: 1.0, phase: 0, color: this.getRandomColor() },
                    { x: this.width * 0.65, y: this.height * 0.5, frequency: 0.5, amplitude: 1.0, phase: 0, color: this.getRandomColor() }
                ];
                break;

            case 'double-slit':
                this.barriers = [
                    { x1: this.width * 0.3, y1: 0, x2: this.width * 0.3, y2: this.height * 0.42 },
                    { x1: this.width * 0.3, y1: this.height * 0.58, x2: this.width * 0.3, y2: this.height }
                ];
                this.sources = [
                    { x: this.width * 0.2, y: this.height * 0.5, frequency: 0.8, amplitude: 1.0, phase: 0, color: this.getRandomColor() }
                ];
                break;

            case 'single-slit':
                this.barriers = [
                    { x1: this.width * 0.3, y1: 0, x2: this.width * 0.3, y2: this.height * 0.35 },
                    { x1: this.width * 0.3, y1: this.height * 0.65, x2: this.width * 0.3, y2: this.height }
                ];
                this.sources = [
                    { x: this.width * 0.15, y: this.height * 0.5, frequency: 0.6, amplitude: 1.0, phase: 0, color: this.getRandomColor() }
                ];
                break;

            case 'diffraction':
                this.barriers = [];
                const slitX = this.width * 0.25;
                const slitSpacing = 40;
                const slitWidth = 20;
                for (let i = 0; i < 5; i++) {
                    const y = this.height * 0.5 + (i - 2) * slitSpacing;
                    this.barriers.push(
                        { x1: slitX, y1: y - slitWidth/2, x2: slitX, y2: y + slitWidth/2 }
                    );
                }
                this.sources = [
                    { x: this.width * 0.1, y: this.height * 0.5, frequency: 1.0, amplitude: 1.0, phase: 0, color: this.getRandomColor() }
                ];
                break;

            case 'circular':
                const centerX = this.width * 0.5;
                const centerY = this.height * 0.5;
                const radius = Math.min(this.width, this.height) * 0.25;
                const numSources = 6;
                for (let i = 0; i < numSources; i++) {
                    const angle = (2 * Math.PI * i) / numSources;
                    this.sources.push({
                        x: centerX + radius * Math.cos(angle),
                        y: centerY + radius * Math.sin(angle),
                        frequency: 0.5,
                        amplitude: 1.0,
                        phase: 0,
                        color: this.getRandomColor()
                    });
                }
                break;

            case 'interference':
                this.sources = [
                    { x: this.width * 0.3, y: this.height * 0.4, frequency: 0.6, amplitude: 1.0, phase: 0, color: this.getRandomColor() },
                    { x: this.width * 0.3, y: this.height * 0.6, frequency: 0.6, amplitude: 1.0, phase: 0, color: this.getRandomColor() },
                    { x: this.width * 0.7, y: this.height * 0.4, frequency: 0.6, amplitude: 1.0, phase: Math.PI, color: this.getRandomColor() },
                    { x: this.width * 0.7, y: this.height * 0.6, frequency: 0.6, amplitude: 1.0, phase: Math.PI, color: this.getRandomColor() }
                ];
                break;
        }

        this.updateSourceControls();
        this.updateStats();
    }

    computeWaveAmplitude(x, y, t) {
        let totalAmplitude = 0;

        for (const source of this.sources) {
            const dx = x - source.x;
            const dy = y - source.y;
            const r = Math.sqrt(dx * dx + dy * dy);

            if (r < 1) continue; // Avoid singularity at source

            // Wave equation: ψ = A * sin(kr - ωt + φ) / sqrt(r)
            const k = (2 * Math.PI * source.frequency) / this.waveSpeed; // Wave number
            const omega = 2 * Math.PI * source.frequency; // Angular frequency
            const amplitude = source.amplitude * Math.sin(k * r - omega * t + source.phase) / Math.sqrt(r);

            totalAmplitude += amplitude;
        }

        return totalAmplitude;
    }

    getColor(value, maxAmplitude) {
        // Normalize value to [-1, 1]
        const normalized = Math.max(-1, Math.min(1, value / maxAmplitude));

        switch (this.colorScheme) {
            case 'grayscale':
                const gray = Math.floor(128 + normalized * 127);
                return [gray, gray, gray];

            case 'rainbow':
                // Map to HSV then RGB
                const hue = (normalized + 1) * 0.5 * 360;
                return this.hsvToRgb(hue, 1, 1);

            case 'blue-black-red':
            default:
                if (normalized < 0) {
                    // Negative: blue to black
                    const intensity = Math.floor(-normalized * 255);
                    return [0, 0, intensity];
                } else {
                    // Positive: black to red
                    const intensity = Math.floor(normalized * 255);
                    return [intensity, 0, 0];
                }
        }
    }

    hsvToRgb(h, s, v) {
        const c = v * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = v - c;

        let r, g, b;
        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }

        return [Math.floor((r + m) * 255), Math.floor((g + m) * 255), Math.floor((b + m) * 255)];
    }

    render() {
        const imageData = this.ctx.createImageData(this.width, this.height);
        const data = imageData.data;

        // Estimate maximum amplitude for normalization
        const maxAmplitude = this.sources.length * 0.5;

        for (let y = 0; y < this.height; y += this.resolution) {
            for (let x = 0; x < this.width; x += this.resolution) {
                const amplitude = this.computeWaveAmplitude(x, y, this.time);

                let value;
                switch (this.vizMode) {
                    case 'intensity':
                        value = amplitude * amplitude;
                        break;
                    case 'real':
                        value = amplitude;
                        break;
                    case 'amplitude':
                    default:
                        value = amplitude;
                        break;
                }

                const [r, g, b] = this.getColor(value, maxAmplitude);

                // Fill in the resolution block
                for (let dy = 0; dy < this.resolution && y + dy < this.height; dy++) {
                    for (let dx = 0; dx < this.resolution && x + dx < this.width; dx++) {
                        const index = ((y + dy) * this.width + (x + dx)) * 4;
                        data[index] = r;
                        data[index + 1] = g;
                        data[index + 2] = b;
                        data[index + 3] = 255;
                    }
                }
            }
        }

        this.ctx.putImageData(imageData, 0, 0);

        // Draw barriers
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 3;
        for (const barrier of this.barriers) {
            this.ctx.beginPath();
            this.ctx.moveTo(barrier.x1, barrier.y1);
            this.ctx.lineTo(barrier.x2, barrier.y2);
            this.ctx.stroke();
        }

        // Draw sources
        for (const source of this.sources) {
            this.ctx.beginPath();
            this.ctx.arc(source.x, source.y, 8, 0, 2 * Math.PI);
            this.ctx.fillStyle = source.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    animate(currentTime = 0) {
        if (this.isPlaying) {
            const deltaTime = (currentTime - this.lastFrameTime) / 1000;
            if (deltaTime < 0.1) { // Cap delta time to prevent jumps
                this.time += deltaTime * this.speedMultiplier;
            }
        }
        this.lastFrameTime = currentTime;

        this.render();
        requestAnimationFrame((t) => this.animate(t));
    }

    updateUI() {
        this.updateSourceControls();
        this.updateStats();
    }
}

// Initialize simulator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.simulator = new WaveInterferenceSimulator();
});

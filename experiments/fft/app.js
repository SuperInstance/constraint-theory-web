// FFT Signal Processing Simulator - Constraint Theory
// Demonstrating frequency domain analysis as geometric constraints

class FFTSimulator {
    constructor() {
        this.canvasElements = {
            time: document.getElementById('timeCanvas'),
            frequency: document.getElementById('frequencyCanvas'),
            harmonics: document.getElementById('harmonicsCanvas'),
            phase: document.getElementById('phaseCanvas'),
            spectrogram: document.getElementById('spectrogramCanvas'),
            reconstructed: document.getElementById('reconstructedCanvas')
        };

        this.contexts = {};
        Object.keys(this.canvasElements).forEach(key => {
            this.contexts[key] = this.canvasElements[key].getContext('2d');
        });

        // Signal parameters
        this.params = {
            signalType: 'sine',
            baseFrequency: 5,
            amplitude: 1.0,
            phase: 0,
            sampleRate: 1000,
            windowFunction: 'none',
            numHarmonics: 5,
            harmonics: [],
            filterType: 'none',
            cutoffFreq: 20,
            bandwidth: 10,
            showHarmonics: true,
            showEnvelope: false,
            animateDecomposition: false,
            showPhase: true,
            showSpectrogram: false,
            fftSize: 1024,
            fftScale: 'linear'
        };

        // Signal data
        this.timeData = [];
        this.frequencyData = { magnitude: [], phase: [] };
        this.filteredData = [];
        this.spectrogramData = [];
        this.decompositionStep = 0;
        this.isDrawing = false;
        this.customSignal = null;

        // Harmonic colors
        this.harmonicColors = [
            '#00ff88', '#00d4ff', '#4a9eff', '#b44aff',
            '#ff4a6a', '#ff9a4a', '#ffcc4a', '#88ff4a',
            '#4aff88', '#4affcc', '#4a88ff', '#884aff'
        ];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeHarmonics();
        this.generateSignal();
        this.startAnimation();
    }

    setupEventListeners() {
        // Signal type
        document.getElementById('signalType').addEventListener('change', (e) => {
            this.params.signalType = e.target.value;
            this.customSignal = null;
            this.generateSignal();
        });

        // Base parameters
        document.getElementById('baseFrequency').addEventListener('input', (e) => {
            this.params.baseFrequency = parseFloat(e.target.value);
            document.getElementById('freqValue').textContent = this.params.baseFrequency;
            this.generateSignal();
        });

        document.getElementById('amplitude').addEventListener('input', (e) => {
            this.params.amplitude = parseFloat(e.target.value);
            document.getElementById('ampValue').textContent = this.params.amplitude.toFixed(1);
            this.generateSignal();
        });

        document.getElementById('phase').addEventListener('input', (e) => {
            this.params.phase = parseFloat(e.target.value);
            document.getElementById('phaseValue').textContent = this.params.phase;
            this.generateSignal();
        });

        document.getElementById('sampleRate').addEventListener('input', (e) => {
            this.params.sampleRate = parseInt(e.target.value);
            document.getElementById('sampleRateValue').textContent = this.params.sampleRate;
            this.generateSignal();
        });

        // Window function
        document.getElementById('windowFunction').addEventListener('change', (e) => {
            this.params.windowFunction = e.target.value;
            this.generateSignal();
        });

        // Harmonics
        document.getElementById('numHarmonics').addEventListener('input', (e) => {
            this.params.numHarmonics = parseInt(e.target.value);
            document.getElementById('harmValue').textContent = this.params.numHarmonics;
            this.initializeHarmonics();
            this.generateSignal();
        });

        // Display options
        document.getElementById('showHarmonics').addEventListener('change', (e) => {
            this.params.showHarmonics = e.target.checked;
        });

        document.getElementById('showEnvelope').addEventListener('change', (e) => {
            this.params.showEnvelope = e.target.checked;
        });

        document.getElementById('animateDecomposition').addEventListener('change', (e) => {
            this.params.animateDecomposition = e.target.checked;
            this.decompositionStep = 0;
        });

        // Filter controls
        document.getElementById('filterType').addEventListener('change', (e) => {
            this.params.filterType = e.target.value;
            const bandwidthControl = document.getElementById('bandwidthControl');
            bandwidthControl.style.display = e.target.value === 'bandpass' ? 'block' : 'none';
            this.generateSignal();
        });

        document.getElementById('cutoffFreq').addEventListener('input', (e) => {
            this.params.cutoffFreq = parseInt(e.target.value);
            document.getElementById('cutoffValue').textContent = this.params.cutoffFreq;
            this.generateSignal();
        });

        document.getElementById('bandwidth').addEventListener('input', (e) => {
            this.params.bandwidth = parseInt(e.target.value);
            document.getElementById('bandwidthValue').textContent = this.params.bandwidth;
            this.generateSignal();
        });

        // Phase and spectrogram
        document.getElementById('showPhase').addEventListener('change', (e) => {
            this.params.showPhase = e.target.checked;
            document.getElementById('phaseContainer').style.display = e.target.checked ? 'block' : 'none';
        });

        document.getElementById('showSpectrogram').addEventListener('change', (e) => {
            this.params.showSpectrogram = e.target.checked;
            document.getElementById('spectrogramContainer').style.display = e.target.checked ? 'block' : 'none';
            if (e.target.checked) {
                this.spectrogramData = [];
            }
        });

        // FFT settings
        document.getElementById('fftSize').addEventListener('change', (e) => {
            this.params.fftSize = parseInt(e.target.value);
            document.getElementById('fftSizeValue').textContent = this.params.fftSize;
            this.generateSignal();
        });

        document.getElementById('fftScale').addEventListener('change', (e) => {
            this.params.fftScale = e.target.value;
            this.drawFrequencyDomain();
        });

        // Custom drawing on time canvas
        const timeCanvas = this.canvasElements.time;
        timeCanvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        timeCanvas.addEventListener('mousemove', (e) => this.draw(e));
        timeCanvas.addEventListener('mouseup', () => this.stopDrawing());
        timeCanvas.addEventListener('mouseleave', () => this.stopDrawing());

        // Filter cutoff dragging on frequency canvas
        const freqCanvas = this.canvasElements.frequency;
        freqCanvas.addEventListener('mousedown', (e) => this.startFilterDrag(e));
        freqCanvas.addEventListener('mousemove', (e) => this.dragFilter(e));
        freqCanvas.addEventListener('mouseup', () => this.stopFilterDrag());
        freqCanvas.addEventListener('mouseleave', () => this.stopFilterDrag());
    }

    initializeHarmonics() {
        this.params.harmonics = [];
        for (let i = 1; i <= this.params.numHarmonics; i++) {
            this.params.harmonics.push({
                harmonic: i,
                amplitude: 1 / i,
                phase: 0,
                enabled: i <= 3
            });
        }
        this.createHarmonicControls();
    }

    createHarmonicControls() {
        const container = document.getElementById('harmonicControls');
        container.innerHTML = '';

        this.params.harmonics.forEach((harm, index) => {
            const div = document.createElement('div');
            div.className = 'harmonic-control';
            div.innerHTML = `
                <h4>Harmonic ${harm.harmonic}</h4>
                <label>
                    <input type="checkbox" ${harm.enabled ? 'checked' : ''} data-index="${index}">
                    Enabled
                </label>
                <label>Amplitude: ${harm.amplitude.toFixed(3)}</label>
                <input type="range" min="0" max="1" step="0.01" value="${harm.amplitude}" data-index="${index}" data-type="amplitude">
                <label>Phase: ${harm.phase}°</label>
                <input type="range" min="0" max="360" step="5" value="${harm.phase}" data-index="${index}" data-type="phase">
            `;
            container.appendChild(div);
        });

        // Add event listeners
        container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.params.harmonics[index].enabled = e.target.checked;
                this.generateSignal();
            });
        });

        container.querySelectorAll('input[type="range"]').forEach(range => {
            range.addEventListener('input', (e) => {
                const index = parseInt(e.target.dataset.index);
                const type = e.target.dataset.type;
                this.params.harmonics[index][type] = parseFloat(e.target.value);
                this.generateSignal();
            });
        });
    }

    generateSignal() {
        const numSamples = this.params.fftSize;
        this.timeData = new Array(numSamples).fill(0);

        const duration = numSamples / this.params.sampleRate;
        const timePoints = [];
        for (let i = 0; i < numSamples; i++) {
            timePoints.push(i * duration / numSamples);
        }

        // Generate signal based on type
        switch (this.params.signalType) {
            case 'sine':
                this.generateSineWave(timePoints);
                break;
            case 'square':
                this.generateSquareWave(timePoints);
                break;
            case 'sawtooth':
                this.generateSawtoothWave(timePoints);
                break;
            case 'triangle':
                this.generateTriangleWave(timePoints);
                break;
            case 'composite':
                this.generateCompositeSignal(timePoints);
                break;
            case 'custom':
                if (this.customSignal) {
                    this.timeData = [...this.customSignal];
                } else {
                    this.generateSineWave(timePoints);
                }
                break;
            case 'noise':
                this.generateNoise(timePoints);
                break;
        }

        // Apply window function
        this.applyWindowFunction();

        // Apply filter
        this.applyFilter();

        // Compute FFT
        this.computeFFT();

        // Update spectrogram
        if (this.params.showSpectrogram) {
            this.updateSpectrogram();
        }

        // Update statistics
        this.updateStatistics();

        // Redraw all canvases
        this.drawAll();
    }

    generateSineWave(timePoints) {
        const omega = 2 * Math.PI * this.params.baseFrequency;
        const phaseRad = this.params.phase * Math.PI / 180;

        for (let i = 0; i < timePoints.length; i++) {
            this.timeData[i] = this.params.amplitude * Math.sin(omega * timePoints[i] + phaseRad);
        }
    }

    generateSquareWave(timePoints) {
        const omega = 2 * Math.PI * this.params.baseFrequency;
        const phaseRad = this.params.phase * Math.PI / 180;

        for (let i = 0; i < timePoints.length; i++) {
            let value = 0;
            for (let h = 0; h < this.params.numHarmonics; h++) {
                const harmonic = 2 * h + 1;
                const amplitude = this.params.amplitude / harmonic;
                value += amplitude * Math.sin(harmonic * omega * timePoints[i] + phaseRad);
            }
            this.timeData[i] = value;
        }
    }

    generateSawtoothWave(timePoints) {
        const omega = 2 * Math.PI * this.params.baseFrequency;
        const phaseRad = this.params.phase * Math.PI / 180;

        for (let i = 0; i < timePoints.length; i++) {
            let value = 0;
            for (let h = 1; h <= this.params.numHarmonics; h++) {
                const amplitude = this.params.amplitude / h;
                const sign = h % 2 === 0 ? -1 : 1;
                value += sign * amplitude * Math.sin(h * omega * timePoints[i] + phaseRad);
            }
            this.timeData[i] = value;
        }
    }

    generateTriangleWave(timePoints) {
        const omega = 2 * Math.PI * this.params.baseFrequency;
        const phaseRad = this.params.phase * Math.PI / 180;

        for (let i = 0; i < timePoints.length; i++) {
            let value = 0;
            for (let h = 0; h < this.params.numHarmonics; h++) {
                const harmonic = 2 * h + 1;
                const sign = h % 2 === 0 ? 1 : -1;
                const amplitude = this.params.amplitude / (harmonic * harmonic);
                value += sign * amplitude * Math.sin(harmonic * omega * timePoints[i] + phaseRad);
            }
            this.timeData[i] = value;
        }
    }

    generateCompositeSignal(timePoints) {
        const baseOmega = 2 * Math.PI * this.params.baseFrequency;
        const phaseRad = this.params.phase * Math.PI / 180;

        for (let i = 0; i < timePoints.length; i++) {
            let value = 0;
            this.params.harmonics.forEach(harm => {
                if (harm.enabled) {
                    const harmPhase = harm.phase * Math.PI / 180;
                    value += harm.amplitude * Math.sin(harm.harmonic * baseOmega * timePoints[i] + harmPhase + phaseRad);
                }
            });
            this.timeData[i] = this.params.amplitude * value;
        }
    }

    generateNoise(timePoints) {
        for (let i = 0; i < timePoints.length; i++) {
            this.timeData[i] = this.params.amplitude * (2 * Math.random() - 1);
        }
    }

    applyWindowFunction() {
        const N = this.timeData.length;
        let window = new Array(N).fill(1);

        switch (this.params.windowFunction) {
            case 'hanning':
                for (let i = 0; i < N; i++) {
                    window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
                }
                break;
            case 'hamming':
                for (let i = 0; i < N; i++) {
                    window[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (N - 1));
                }
                break;
            case 'blackman':
                for (let i = 0; i < N; i++) {
                    const a0 = 0.42;
                    const a1 = 0.5;
                    const a2 = 0.08;
                    window[i] = a0 - a1 * Math.cos(2 * Math.PI * i / (N - 1)) + a2 * Math.cos(4 * Math.PI * i / (N - 1));
                }
                break;
        }

        for (let i = 0; i < N; i++) {
            this.timeData[i] *= window[i];
        }
    }

    applyFilter() {
        this.filteredData = [...this.timeData];

        if (this.params.filterType === 'none') {
            return;
        }

        // Simple frequency domain filter
        const fftResult = this.fft(this.timeData);
        const cutoff = this.params.cutoffFreq;
        const binWidth = this.params.sampleRate / this.params.fftSize;

        for (let i = 0; i < fftResult.real.length; i++) {
            const freq = i * binWidth;
            let shouldFilter = false;

            switch (this.params.filterType) {
                case 'lowpass':
                    shouldFilter = freq > cutoff;
                    break;
                case 'highpass':
                    shouldFilter = freq < cutoff;
                    break;
                case 'bandpass':
                    shouldFilter = freq < cutoff - this.params.bandwidth / 2 ||
                                   freq > cutoff + this.params.bandwidth / 2;
                    break;
            }

            if (shouldFilter) {
                fftResult.real[i] = 0;
                fftResult.imag[i] = 0;
            }
        }

        // Mirror for negative frequencies
        for (let i = fftResult.real.length - 1; i >= Math.ceil(fftResult.real.length / 2); i--) {
            fftResult.real[i] = fftResult.real[fftResult.real.length - i];
            fftResult.imag[i] = -fftResult.imag[fftResult.real.length - i];
        }

        this.filteredData = this.ifft(fftResult);
    }

    computeFFT() {
        const fftResult = this.fft(this.timeData);
        const N = fftResult.real.length;

        this.frequencyData.magnitude = new Array(N / 2).fill(0);
        this.frequencyData.phase = new Array(N / 2).fill(0);

        for (let i = 0; i < N / 2; i++) {
            const real = fftResult.real[i];
            const imag = fftResult.imag[i];
            this.frequencyData.magnitude[i] = Math.sqrt(real * real + imag * imag) / N;
            this.frequencyData.phase[i] = Math.atan2(imag, real) * 180 / Math.PI;
        }
    }

    // Cooley-Tukey FFT algorithm
    fft(signal) {
        const N = signal.length;
        if (N <= 1) {
            return { real: [...signal], imag: new Array(N).fill(0) };
        }

        // Ensure N is power of 2
        const paddedLength = Math.pow(2, Math.ceil(Math.log2(N)));
        const paddedSignal = [...signal];
        while (paddedSignal.length < paddedLength) {
            paddedSignal.push(0);
        }

        return this.fftRecursive(paddedSignal);
    }

    fftRecursive(signal) {
        const N = signal.length;
        if (N <= 1) {
            return { real: [...signal], imag: new Array(N).fill(0) };
        }

        const half = N / 2;
        const even = new Array(half);
        const odd = new Array(half);

        for (let i = 0; i < half; i++) {
            even[i] = signal[2 * i];
            odd[i] = signal[2 * i + 1];
        }

        const fftEven = this.fftRecursive(even);
        const fftOdd = this.fftRecursive(odd);

        const real = new Array(N);
        const imag = new Array(N);

        for (let k = 0; k < half; k++) {
            const angle = -2 * Math.PI * k / N;
            const cosAngle = Math.cos(angle);
            const sinAngle = Math.sin(angle);

            const oddReal = fftOdd.real[k] * cosAngle - fftOdd.imag[k] * sinAngle;
            const oddImag = fftOdd.real[k] * sinAngle + fftOdd.imag[k] * cosAngle;

            real[k] = fftEven.real[k] + oddReal;
            imag[k] = fftEven.imag[k] + oddImag;

            real[k + half] = fftEven.real[k] - oddReal;
            imag[k + half] = fftEven.imag[k] - oddImag;
        }

        return { real, imag };
    }

    ifft(fftResult) {
        const N = fftResult.real.length;
        const signal = new Array(N);

        // Conjugate the frequency domain
        const conjReal = [...fftResult.real];
        const conjImag = fftResult.imag.map(x => -x);

        // FFT of conjugated frequency domain
        const timeDomain = this.fftRecursive(conjReal);

        // Conjugate and scale
        for (let i = 0; i < N; i++) {
            signal[i] = timeDomain.real[i] / N;
        }

        return signal.slice(0, this.params.fftSize);
    }

    updateSpectrogram() {
        if (this.spectrogramData.length > 100) {
            this.spectrogramData.shift();
        }
        this.spectrogramData.push([...this.frequencyData.magnitude]);
    }

    updateStatistics() {
        // RMS value
        const sumSquares = this.timeData.reduce((sum, val) => sum + val * val, 0);
        const rms = Math.sqrt(sumSquares / this.timeData.length);
        document.getElementById('rmsValue').textContent = rms.toFixed(3);

        // Peak amplitude
        const peak = Math.max(...this.timeData.map(Math.abs));
        document.getElementById('peakValue').textContent = peak.toFixed(3);

        // Dominant frequency
        const maxMagIndex = this.frequencyData.magnitude.indexOf(Math.max(...this.frequencyData.magnitude));
        const binWidth = this.params.sampleRate / this.params.fftSize;
        const dominantFreq = maxMagIndex * binWidth;
        document.getElementById('dominantFreq').textContent = dominantFreq.toFixed(1) + ' Hz';

        // Bandwidth (containing 95% of energy)
        const totalEnergy = this.frequencyData.magnitude.reduce((sum, val) => sum + val * val, 0);
        let cumulativeEnergy = 0;
        let bandwidthEnd = 0;
        for (let i = 0; i < this.frequencyData.magnitude.length; i++) {
            cumulativeEnergy += this.frequencyData.magnitude[i] * this.frequencyData.magnitude[i];
            if (cumulativeEnergy >= 0.95 * totalEnergy) {
                bandwidthEnd = i;
                break;
            }
        }
        const bandwidth = bandwidthEnd * binWidth;
        document.getElementById('bandwidthValue').textContent = bandwidth.toFixed(1) + ' Hz';

        // THD (Total Harmonic Distortion) for sine waves
        if (this.params.signalType === 'sine') {
            const fundamental = this.frequencyData.magnitude[maxMagIndex];
            let harmonicSum = 0;
            for (let i = maxMagIndex + 1; i < this.frequencyData.magnitude.length; i++) {
                harmonicSum += this.frequencyData.magnitude[i] * this.frequencyData.magnitude[i];
            }
            const thd = fundamental > 0 ? 100 * Math.sqrt(harmonicSum) / fundamental : 0;
            document.getElementById('thdValue').textContent = thd.toFixed(2) + '%';
        } else {
            document.getElementById('thdValue').textContent = 'N/A';
        }

        // SNR (Signal-to-Noise Ratio)
        const signalPower = this.frequencyData.magnitude.slice(0, 20).reduce((sum, val) => sum + val * val, 0);
        const noisePower = this.frequencyData.magnitude.slice(20).reduce((sum, val) => sum + val * val, 0);
        const snr = noisePower > 0 ? 10 * Math.log10(signalPower / noisePower) : Infinity;
        document.getElementById('snrValue').textContent = isFinite(snr) ? snr.toFixed(1) + ' dB' : '∞ dB';
    }

    drawAll() {
        this.drawTimeDomain();
        this.drawFrequencyDomain();
        this.drawHarmonics();
        if (this.params.showPhase) {
            this.drawPhaseSpectrum();
        }
        if (this.params.showSpectrogram) {
            this.drawSpectrogram();
        }
        this.drawReconstructed();
    }

    drawTimeDomain() {
        const ctx = this.contexts.time;
        const canvas = this.canvasElements.time;
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = '#1a1f3a';
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        this.drawGrid(ctx, width, height);

        // Draw signal
        ctx.beginPath();
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 10;

        const displayData = this.params.filterType !== 'none' ? this.filteredData : this.timeData;
        const maxVal = Math.max(...displayData.map(Math.abs), 0.1);

        for (let i = 0; i < displayData.length; i++) {
            const x = (i / displayData.length) * width;
            const y = height / 2 - (displayData[i] / maxVal) * (height / 2 - 20);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw envelope if enabled
        if (this.params.showEnvelope) {
            this.drawEnvelope(ctx, width, height, displayData, maxVal);
        }

        // Draw labels
        ctx.fillStyle = '#a0a6b0';
        ctx.font = '12px monospace';
        ctx.fillText('Time →', width - 60, height - 10);
        ctx.fillText('Amplitude', 10, 20);
    }

    drawGrid(ctx, width, height) {
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.1)';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= width; x += width / 10) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= height; y += height / 6) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Center line
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
    }

    drawEnvelope(ctx, width, height, data, maxVal) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 156, 74, 0.6)';
        ctx.lineWidth = 2;

        // Upper envelope
        for (let i = 0; i < data.length; i++) {
            const x = (i / data.length) * width;
            const y = height / 2 - (Math.abs(data[i]) / maxVal) * (height / 2 - 20);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
    }

    drawFrequencyDomain() {
        const ctx = this.contexts.frequency;
        const canvas = this.canvasElements.frequency;
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = '#1a1f3a';
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        this.drawGrid(ctx, width, height);

        const magnitude = this.frequencyData.magnitude;
        const maxMag = Math.max(...magnitude, 0.001);
        const binWidth = this.params.sampleRate / this.params.fftSize;

        // Draw frequency bars
        const barWidth = width / magnitude.length;

        for (let i = 0; i < magnitude.length; i++) {
            const freq = i * binWidth;
            let barHeight;

            if (this.params.fftScale === 'logarithmic') {
                const logMag = Math.log10(magnitude[i] * 1000 + 1) / Math.log10(maxMag * 1000 + 1);
                barHeight = logMag * (height / 2 - 20);
            } else {
                barHeight = (magnitude[i] / maxMag) * (height / 2 - 20);
            }

            // Color gradient from green (low freq) to red (high freq)
            const hue = 120 - (i / magnitude.length) * 120;
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
            ctx.shadowBlur = 5;

            const x = i * barWidth;
            const y = height - barHeight - 30;

            ctx.fillRect(x, y, barWidth - 1, barHeight);

            // Frequency labels for major peaks
            if (magnitude[i] > maxMag * 0.1 && i % Math.floor(magnitude.length / 10) === 0) {
                ctx.fillStyle = '#e0e6ed';
                ctx.font = '10px monospace';
                ctx.shadowBlur = 0;
                ctx.fillText(freq.toFixed(0) + 'Hz', x, height - 10);
            }
        }

        ctx.shadowBlur = 0;

        // Draw filter cutoff if active
        if (this.params.filterType !== 'none') {
            const cutoffX = (this.params.cutoffFreq / (this.params.sampleRate / 2)) * width;

            ctx.strokeStyle = '#ff4a6a';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ff4a6a';
            ctx.shadowBlur = 10;
            ctx.setLineDash([5, 5]);

            ctx.beginPath();
            ctx.moveTo(cutoffX, 0);
            ctx.lineTo(cutoffX, height);
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.shadowBlur = 0;

            // Draw bandpass range if applicable
            if (this.params.filterType === 'bandpass') {
                const lowerX = ((this.params.cutoffFreq - this.params.bandwidth / 2) / (this.params.sampleRate / 2)) * width;
                const upperX = ((this.params.cutoffFreq + this.params.bandwidth / 2) / (this.params.sampleRate / 2)) * width;

                ctx.fillStyle = 'rgba(255, 74, 106, 0.1)';
                ctx.fillRect(lowerX, 0, upperX - lowerX, height);
            }
        }

        // Draw labels
        ctx.fillStyle = '#a0a6b0';
        ctx.font = '12px monospace';
        ctx.fillText('Frequency →', width - 80, height - 10);
        ctx.fillText('Magnitude', 10, 20);
    }

    drawHarmonics() {
        const ctx = this.contexts.harmonics;
        const canvas = this.canvasElements.harmonics;
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = '#1a1f3a';
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        this.drawGrid(ctx, width, height);

        const duration = this.params.fftSize / this.params.sampleRate;
        const timePoints = [];
        for (let i = 0; i < this.params.fftSize; i++) {
            timePoints.push(i * duration / this.params.fftSize);
        }

        const baseOmega = 2 * Math.PI * this.params.baseFrequency;
        const phaseRad = this.params.phase * Math.PI / 180;

        // Draw individual harmonics
        if (this.params.showHarmonics) {
            this.params.harmonics.forEach((harm, index) => {
                if (!harm.enabled) return;

                ctx.beginPath();
                ctx.strokeStyle = this.harmonicColors[index % this.harmonicColors.length];
                ctx.lineWidth = 1.5;
                ctx.globalAlpha = 0.6;

                const harmPhase = harm.phase * Math.PI / 180;
                const amplitude = this.params.amplitude * harm.amplitude * 0.8;

                for (let i = 0; i < timePoints.length; i++) {
                    const x = (i / timePoints.length) * width;
                    const y = height / 2 - amplitude * Math.sin(harm.harmonic * baseOmega * timePoints[i] + harmPhase + phaseRad) * (height / 2 - 20);

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }

                ctx.stroke();
                ctx.globalAlpha = 1.0;
            });
        }

        // Draw animated decomposition
        if (this.params.animateDecomposition) {
            this.drawAnimatedDecomposition(ctx, width, height, timePoints, baseOmega, phaseRad);
        }

        // Draw legend
        this.drawHarmonicsLegend(ctx, width, height);
    }

    drawAnimatedDecomposition(ctx, width, height, timePoints, baseOmega, phaseRad) {
        const step = this.decompositionStep % (this.params.harmonics.length + 1);
        let cumulativeSignal = new Array(timePoints.length).fill(0);

        for (let h = 0; h < step; h++) {
            const harm = this.params.harmonics[h];
            if (!harm.enabled) continue;

            const harmPhase = harm.phase * Math.PI / 180;
            const amplitude = this.params.amplitude * harm.amplitude;

            for (let i = 0; i < timePoints.length; i++) {
                cumulativeSignal[i] += amplitude * Math.sin(harm.harmonic * baseOmega * timePoints[i] + harmPhase + phaseRad);
            }
        }

        // Draw cumulative signal
        ctx.beginPath();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;

        const maxVal = Math.max(...cumulativeSignal.map(Math.abs), 0.1);

        for (let i = 0; i < cumulativeSignal.length; i++) {
            const x = (i / cumulativeSignal.length) * width;
            const y = height / 2 - (cumulativeSignal[i] / maxVal) * (height / 2 - 20);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw step indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px monospace';
        ctx.fillText(`Building: ${step}/${this.params.harmonics.length + 1} harmonics`, 10, 30);
    }

    drawHarmonicsLegend(ctx, width, height) {
        const legendX = 10;
        const legendY = height - 30;
        const itemWidth = 100;

        this.params.harmonics.forEach((harm, index) => {
            if (!harm.enabled || index >= 6) return;

            const x = legendX + index * itemWidth;

            ctx.fillStyle = this.harmonicColors[index % this.harmonicColors.length];
            ctx.fillRect(x, legendY, 10, 10);

            ctx.fillStyle = '#a0a6b0';
            ctx.font = '10px monospace';
            ctx.fillText(`H${harm.harmonic}`, x + 15, legendY + 8);
        });
    }

    drawPhaseSpectrum() {
        const ctx = this.contexts.phase;
        const canvas = this.canvasElements.phase;
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = '#1a1f3a';
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        this.drawGrid(ctx, width, height);

        const phase = this.frequencyData.phase;
        const barWidth = width / phase.length;

        // Draw phase bars
        for (let i = 0; i < phase.length; i++) {
            const normalizedPhase = (phase[i] + 180) / 360; // Normalize to 0-1
            const barHeight = normalizedPhase * (height - 40);

            const hue = normalizedPhase * 360;
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
            ctx.shadowBlur = 5;

            const x = i * barWidth;
            const y = height - barHeight - 20;

            ctx.fillRect(x, y, barWidth - 1, barHeight);
        }

        ctx.shadowBlur = 0;

        // Draw labels
        ctx.fillStyle = '#a0a6b0';
        ctx.font = '12px monospace';
        ctx.fillText('Frequency →', width - 80, height - 5);
        ctx.fillText('Phase (°)', 10, 15);
        ctx.fillText('-180°', 10, height - 5);
        ctx.fillText('+180°', width / 2 - 20, height - 5);
    }

    drawSpectrogram() {
        const ctx = this.contexts.spectrogram;
        const canvas = this.canvasElements.spectrogram;
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = '#1a1f3a';
        ctx.fillRect(0, 0, width, height);

        if (this.spectrogramData.length === 0) return;

        const numFreqBins = this.spectrogramData[0].length;
        const timeStep = width / 100; // Show last 100 time slices
        const freqStep = height / numFreqBins;

        // Draw spectrogram
        for (let t = 0; t < this.spectrogramData.length; t++) {
            const magnitude = this.spectrogramData[t];
            const maxMag = Math.max(...magnitude, 0.001);

            for (let f = 0; f < magnitude.length; f++) {
                const normalizedMag = magnitude[f] / maxMag;
                const hue = 240 - normalizedMag * 240; // Blue to red

                ctx.fillStyle = `hsl(${hue}, 100%, ${50 + normalizedMag * 30}%)`;

                const x = t * timeStep;
                const y = height - (f + 1) * freqStep;

                ctx.fillRect(x, y, timeStep + 1, freqStep + 1);
            }
        }

        // Draw labels
        ctx.fillStyle = '#a0a6b0';
        ctx.font = '12px monospace';
        ctx.fillText('Time →', width - 60, height - 5);
        ctx.fillText('Frequency ↑', 10, 15);
    }

    drawReconstructed() {
        const ctx = this.contexts.reconstructed;
        const canvas = this.canvasElements.reconstructed;
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = '#1a1f3a';
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        this.drawGrid(ctx, width, height);

        // Reconstruct signal from FFT
        const reconstructed = this.ifft({
            real: [...this.frequencyData.magnitude.map((m, i) => {
                const phase = this.frequencyData.phase[i] * Math.PI / 180;
                return m * Math.cos(phase);
            })],
            imag: [...this.frequencyData.magnitude.map((m, i) => {
                const phase = this.frequencyData.phase[i] * Math.PI / 180;
                return m * Math.sin(phase);
            })]
        });

        // Draw original signal
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
        ctx.lineWidth = 2;

        const maxVal = Math.max(...this.timeData.map(Math.abs), 0.1);

        for (let i = 0; i < this.timeData.length; i++) {
            const x = (i / this.timeData.length) * width;
            const y = height / 2 - (this.timeData[i] / maxVal) * (height / 2 - 20);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();

        // Draw reconstructed signal
        ctx.beginPath();
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 10;

        for (let i = 0; i < reconstructed.length; i++) {
            const x = (i / reconstructed.length) * width;
            const y = height / 2 - (reconstructed[i] / maxVal) * (height / 2 - 20);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw legend
        ctx.fillStyle = 'rgba(0, 255, 136, 0.8)';
        ctx.font = '12px monospace';
        ctx.fillText('Original', 10, 20);

        ctx.fillStyle = '#00d4ff';
        ctx.fillText('Reconstructed (IFFT)', 10, 40);

        // Calculate and draw error
        let error = 0;
        for (let i = 0; i < Math.min(this.timeData.length, reconstructed.length); i++) {
            error += Math.abs(this.timeData[i] - reconstructed[i]);
        }
        error /= Math.min(this.timeData.length, reconstructed.length);

        ctx.fillStyle = '#a0a6b0';
        ctx.fillText(`Reconstruction Error: ${error.toFixed(6)}`, 10, 60);
    }

    // Custom drawing functions
    startDrawing(e) {
        if (this.params.signalType !== 'custom') return;

        this.isDrawing = true;
        this.customSignal = new Array(this.params.fftSize).fill(0);
        const rect = this.canvasElements.time.getBoundingClientRect();
        const scaleX = this.canvasElements.time.width / rect.width;

        const x = (e.clientX - rect.left) * scaleX;
        const y = e.clientY - rect.top;

        const index = Math.floor((x / this.canvasElements.time.width) * this.params.fftSize);
        const value = -(y - this.canvasElements.time.height / 2) / (this.canvasElements.time.height / 2);

        if (index >= 0 && index < this.params.fftSize) {
            this.customSignal[index] = Math.max(-1, Math.min(1, value));
        }
    }

    draw(e) {
        if (!this.isDrawing || this.params.signalType !== 'custom') return;

        const rect = this.canvasElements.time.getBoundingClientRect();
        const scaleX = this.canvasElements.time.width / rect.width;

        const x = (e.clientX - rect.left) * scaleX;
        const y = e.clientY - rect.top;

        const index = Math.floor((x / this.canvasElements.time.width) * this.params.fftSize);
        const value = -(y - this.canvasElements.time.height / 2) / (this.canvasElements.time.height / 2);

        if (index >= 0 && index < this.params.fftSize) {
            this.customSignal[index] = Math.max(-1, Math.min(1, value));
            this.generateSignal();
        }
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            // Smooth the custom signal
            if (this.customSignal) {
                for (let i = 1; i < this.customSignal.length - 1; i++) {
                    if (this.customSignal[i] === 0) {
                        this.customSignal[i] = (this.customSignal[i - 1] + this.customSignal[i + 1]) / 2;
                    }
                }
                this.generateSignal();
            }
        }
    }

    // Filter dragging functions
    startFilterDrag(e) {
        if (this.params.filterType === 'none') return;

        const rect = this.canvasElements.frequency.getBoundingClientRect();
        const scaleX = this.canvasElements.frequency.width / rect.width;
        const x = (e.clientX - rect.left) * scaleX;

        this.isDraggingFilter = true;
        this.updateFilterFromPosition(x);
    }

    dragFilter(e) {
        if (!this.isDraggingFilter) return;

        const rect = this.canvasElements.frequency.getBoundingClientRect();
        const scaleX = this.canvasElements.frequency.width / rect.width;
        const x = (e.clientX - rect.left) * scaleX;

        this.updateFilterFromPosition(x);
    }

    stopFilterDrag() {
        this.isDraggingFilter = false;
    }

    updateFilterFromPosition(x) {
        const freq = (x / this.canvasElements.frequency.width) * (this.params.sampleRate / 2);
        this.params.cutoffFreq = Math.max(1, Math.min(100, Math.round(freq)));

        document.getElementById('cutoffFreq').value = this.params.cutoffFreq;
        document.getElementById('cutoffValue').textContent = this.params.cutoffFreq;

        this.generateSignal();
    }

    startAnimation() {
        const animate = () => {
            if (this.params.animateDecomposition) {
                this.decompositionStep += 0.02;
                this.drawHarmonics();
            }

            requestAnimationFrame(animate);
        };

        animate();

        // Update spectrogram periodically
        setInterval(() => {
            if (this.params.showSpectrogram) {
                this.generateSignal();
            }
        }, 100);
    }
}

// Initialize the simulator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.fftSimulator = new FFTSimulator();
});

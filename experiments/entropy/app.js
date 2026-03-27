// Information Entropy Simulator
// Visualizes Shannon entropy, signal vs noise, and constraint-based uncertainty reduction

class EntropySimulator {
    constructor() {
        // Canvas elements
        this.signalCanvas = document.getElementById('signalCanvas');
        this.entropyCanvas = document.getElementById('entropyCanvas');
        this.entropyGraphCanvas = document.getElementById('entropyGraphCanvas');

        this.signalCtx = this.signalCanvas.getContext('2d');
        this.entropyCtx = this.entropyCanvas.getContext('2d');
        this.entropyGraphCtx = this.entropyGraphCanvas.getContext('2d');

        // Simulation state
        this.isRunning = false;
        this.animationId = null;
        this.currentStep = 0;
        this.entropyHistory = [];
        this.maxHistoryLength = 200;

        // Current data
        this.signalData = [];
        this.constrainedData = [];
        this.probabilityDistribution = {};

        // Initialize
        this.initializeControls();
        this.generateSignal();
        this.updateDisplay();

        // Start animation loop
        this.startAnimation();
    }

    initializeControls() {
        // Signal type selector
        document.getElementById('signalType').addEventListener('change', () => {
            this.generateSignal();
            this.updateDisplay();
        });

        // Noise level slider
        document.getElementById('noiseLevel').addEventListener('input', (e) => {
            document.getElementById('noiseValue').textContent = e.target.value;
            this.generateSignal();
            this.updateDisplay();
        });

        // Constraint strength slider
        document.getElementById('constraintStrength').addEventListener('input', (e) => {
            document.getElementById('constraintValue').textContent = e.target.value;
            this.generateSignal();
            this.updateDisplay();
        });

        // Sample size slider
        document.getElementById('sampleSize').addEventListener('input', (e) => {
            document.getElementById('sampleValue').textContent = e.target.value;
            this.generateSignal();
            this.updateDisplay();
        });

        // Animation speed slider
        document.getElementById('animationSpeed').addEventListener('input', (e) => {
            document.getElementById('speedValue').textContent = e.target.value;
        });

        // Buttons
        document.getElementById('startBtn').addEventListener('click', () => this.startSimulation());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopSimulation());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetSimulation());
        document.getElementById('stepBtn').addEventListener('click', () => this.singleStep());

        // Toggles
        document.getElementById('showDistribution').addEventListener('change', () => this.updateDisplay());
        document.getElementById('showBitLevel').addEventListener('change', (e) => {
            document.getElementById('bitView').style.display = e.target.checked ? 'block' : 'none';
            if (e.target.checked) this.updateBitView();
        });
        document.getElementById('showCompression').addEventListener('change', (e) => {
            document.getElementById('compressionView').style.display = e.target.checked ? 'block' : 'none';
            if (e.target.checked) this.updateCompressionView();
        });
        document.getElementById('showConstraints').addEventListener('change', () => this.updateDisplay());
    }

    generateSignal() {
        const signalType = document.getElementById('signalType').value;
        const sampleSize = parseInt(document.getElementById('sampleSize').value);

        this.signalData = [];
        this.constrainedData = [];

        for (let i = 0; i < sampleSize; i++) {
            let value;

            switch (signalType) {
                case 'uniform':
                    value = Math.floor(Math.random() * 256);
                    break;
                case 'binary':
                    value = Math.random() > 0.5 ? 1 : 0;
                    break;
                case 'gaussian':
                    const u1 = Math.random();
                    const u2 = Math.random();
                    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                    value = Math.floor(128 + z * 40);
                    value = Math.max(0, Math.min(255, value));
                    break;
                case 'text':
                    // Approximate English letter frequency
                    const englishFreq = "EEEEEEEEEEEETTTTTTTTTAAAAAAAOOOOOOOIIIIIIIINNNNNNNSSSSSSSRRRRRRHHHHHHLLLLLDCCCCCUUUMMWWPPFYGBVKXJQZ";
                    value = englishFreq.charCodeAt(Math.floor(Math.random() * englishFreq.length));
                    break;
                case 'custom':
                    // Create a pattern with some structure
                    value = (i % 64) * 4;
                    break;
                default:
                    value = Math.floor(Math.random() * 256);
            }

            this.signalData.push(value);
        }

        this.applyNoiseAndConstraints();
        this.calculateDistribution();
    }

    applyNoiseAndConstraints() {
        const noiseLevel = parseInt(document.getElementById('noiseLevel').value) / 100;
        const constraintStrength = parseInt(document.getElementById('constraintStrength').value) / 100;

        this.constrainedData = this.signalData.map(value => {
            // Add noise
            let noisyValue = value;
            if (noiseLevel > 0) {
                const noise = (Math.random() - 0.5) * 2 * noiseLevel * 50;
                noisyValue = Math.max(0, Math.min(255, Math.floor(noisyValue + noise)));
            }

            // Apply constraints (Pythagorean snapping to discrete values)
            let constrainedValue = noisyValue;
            if (constraintStrength > 0) {
                // Snap to nearest power of 2, then snap within that range
                const snapStrength = Math.floor(constraintStrength * 4);
                const snapInterval = Math.pow(2, 4 - snapStrength);

                if (snapInterval > 1) {
                    constrainedValue = Math.round(constrainedValue / snapInterval) * snapInterval;
                    constrainedValue = Math.max(0, Math.min(255, constrainedValue));
                }
            }

            return constrainedValue;
        });
    }

    calculateDistribution() {
        this.probabilityDistribution = {};

        // Count occurrences
        this.constrainedData.forEach(value => {
            this.probabilityDistribution[value] = (this.probabilityDistribution[value] || 0) + 1;
        });

        // Convert to probabilities
        const total = this.constrainedData.length;
        for (let key in this.probabilityDistribution) {
            this.probabilityDistribution[key] /= total;
        }
    }

    calculateEntropy(data) {
        // Calculate probability distribution
        const counts = {};
        data.forEach(value => {
            counts[value] = (counts[value] || 0) + 1;
        });

        const total = data.length;
        let entropy = 0;

        for (let key in counts) {
            const p = counts[key] / total;
            if (p > 0) {
                entropy -= p * Math.log2(p);
            }
        }

        return entropy;
    }

    calculateRawEntropy() {
        return this.calculateEntropy(this.signalData);
    }

    calculateConstrainedEntropy() {
        return this.calculateEntropy(this.constrainedData);
    }

    updateDisplay() {
        this.drawSignalView();
        this.drawEntropyDistribution();
        this.drawEntropyGraph();
        this.updateStats();
        this.updateGauge();

        if (document.getElementById('showBitLevel').checked) {
            this.updateBitView();
        }

        if (document.getElementById('showCompression').checked) {
            this.updateCompressionView();
        }
    }

    drawSignalView() {
        const ctx = this.signalCtx;
        const canvas = this.signalCanvas;
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = '#0a0e1a';
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 1;

        for (let x = 0; x < width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        for (let y = 0; y < height; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw raw signal (faded)
        const showConstraints = document.getElementById('showConstraints').checked;

        if (showConstraints) {
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();

            const barWidth = width / this.signalData.length;

            this.signalData.forEach((value, i) => {
                const x = i * barWidth;
                const y = height - (value / 255) * height;

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();
        }

        // Draw constrained signal
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#10b981');
        gradient.addColorStop(0.5, '#3b82f6');
        gradient.addColorStop(1, '#8b5cf6');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const barWidth = width / this.constrainedData.length;

        this.constrainedData.forEach((value, i) => {
            const x = i * barWidth;
            const y = height - (value / 255) * height;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw glow effect
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Add labels
        ctx.fillStyle = '#f9fafb';
        ctx.font = '12px Arial';
        ctx.fillText('Value: 0-255', 10, 20);
        ctx.fillText('Samples: ' + this.constrainedData.length, 10, 35);
    }

    drawEntropyDistribution() {
        const ctx = this.entropyCtx;
        const canvas = this.entropyCanvas;
        const width = canvas.width;
        const height = canvas.height;
        const showDistribution = document.getElementById('showDistribution').checked;

        // Clear canvas
        ctx.fillStyle = '#0a0e1a';
        ctx.fillRect(0, 0, width, height);

        if (!showDistribution) {
            ctx.fillStyle = '#9ca3af';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Distribution view disabled', width / 2, height / 2);
            return;
        }

        // Sort distribution by value
        const sortedValues = Object.keys(this.probabilityDistribution)
            .map(Number)
            .sort((a, b) => a - b);

        if (sortedValues.length === 0) return;

        const barWidth = width / sortedValues.length;
        const maxProb = Math.max(...Object.values(this.probabilityDistribution));

        // Draw bars
        sortedValues.forEach((value, i) => {
            const prob = this.probabilityDistribution[value];
            const barHeight = (prob / maxProb) * (height - 60);
            const x = i * barWidth;
            const y = height - barHeight - 30;

            // Calculate information content
            const infoContent = -Math.log2(prob);
            const normalizedInfo = Math.min(1, infoContent / 8);

            // Color based on information content
            const hue = 240 - normalizedInfo * 240; // Blue to red
            const saturation = 70 + normalizedInfo * 30;
            const lightness = 50 + normalizedInfo * 10;

            ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            ctx.fillRect(x + 1, y, barWidth - 2, barHeight);

            // Add glow effect for high information content
            if (normalizedInfo > 0.7) {
                ctx.shadowColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                ctx.shadowBlur = 10;
                ctx.fillRect(x + 1, y, barWidth - 2, barHeight);
                ctx.shadowBlur = 0;
            }
        });

        // Draw axes
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height - 30);
        ctx.lineTo(width, height - 30);
        ctx.stroke();

        // Add labels
        ctx.fillStyle = '#f9fafb';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Unique Values: ' + sortedValues.length, 10, 20);
        ctx.fillText('Max Probability: ' + (maxProb * 100).toFixed(1) + '%', 10, 35);

        // Draw information content legend
        const legendY = 55;
        ctx.font = '10px Arial';
        ctx.fillText('Color = Information Content (log₂ 1/p)', 10, legendY);
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(200, legendY - 8, 15, 10);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(220, legendY - 8, 15, 10);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(240, legendY - 8, 15, 10);
        ctx.fillStyle = '#f9fafb';
        ctx.fillText('Low', 260, legendY);
        ctx.fillText('High', 300, legendY);
    }

    drawEntropyGraph() {
        const ctx = this.entropyGraphCtx;
        const canvas = this.entropyGraphCanvas;
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = '#0a0e1a';
        ctx.fillRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 1;

        for (let x = 0; x < width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        for (let y = 0; y < height; y += 25) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        if (this.entropyHistory.length < 2) {
            ctx.fillStyle = '#9ca3af';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Start simulation to see entropy over time', width / 2, height / 2);
            return;
        }

        // Find min and max entropy for scaling
        const minEntropy = Math.min(...this.entropyHistory.map(e => e.raw));
        const maxEntropy = Math.max(...this.entropyHistory.map(e => e.raw));
        const entropyRange = maxEntropy - minEntropy || 1;

        // Draw raw entropy line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();

        this.entropyHistory.forEach((entry, i) => {
            const x = (i / (this.maxHistoryLength - 1)) * width;
            const y = height - ((entry.raw - minEntropy) / entropyRange) * (height - 40) - 20;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw constrained entropy line
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();

        this.entropyHistory.forEach((entry, i) => {
            const x = (i / (this.maxHistoryLength - 1)) * width;
            const y = height - ((entry.constrained - minEntropy) / entropyRange) * (height - 40) - 20;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw legend
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(10, 10, 20, 10);
        ctx.fillStyle = '#f9fafb';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Raw Entropy', 35, 18);

        ctx.fillStyle = '#10b981';
        ctx.fillRect(120, 10, 20, 10);
        ctx.fillStyle = '#f9fafb';
        ctx.fillText('Constrained Entropy', 145, 18);
    }

    updateStats() {
        const rawEntropy = this.calculateRawEntropy();
        const constrainedEntropy = this.calculateConstrainedEntropy();
        const reduction = rawEntropy - constrainedEntropy;
        const gain = rawEntropy > 0 ? (reduction / rawEntropy) * 100 : 0;

        document.getElementById('rawEntropy').textContent = rawEntropy.toFixed(2);
        document.getElementById('constrainedEntropy').textContent = constrainedEntropy.toFixed(2);
        document.getElementById('entropyReduction').textContent = reduction.toFixed(2);
        document.getElementById('informationGain').textContent = gain.toFixed(1);

        // Update formula display
        const formulaDisplay = document.querySelector('.formula');
        formulaDisplay.innerHTML = `H(X) = -Σ p(x) log₂ p(x) = ${constrainedEntropy.toFixed(2)} bits/symbol`;
    }

    updateGauge() {
        const constrainedEntropy = this.calculateConstrainedEntropy();
        const percentage = Math.min(100, (constrainedEntropy / 8) * 100);

        document.getElementById('entropyGauge').style.width = percentage + '%';
    }

    updateBitView() {
        const container = document.getElementById('bitContainer');
        container.innerHTML = '';

        // Sample first 500 bits for display
        const sampleSize = Math.min(500, this.constrainedData.length);

        for (let i = 0; i < sampleSize; i++) {
            const value = this.constrainedData[i];
            const prob = this.probabilityDistribution[value] || 0;
            const infoContent = prob > 0 ? -Math.log2(prob) : 0;
            const normalizedInfo = Math.min(1, infoContent / 8);

            const bitBox = document.createElement('div');
            bitBox.className = 'bit-box';

            if (normalizedInfo > 0.7) {
                bitBox.classList.add('high');
            } else if (normalizedInfo > 0.4) {
                bitBox.classList.add('medium');
            } else {
                bitBox.classList.add('low');
            }

            bitBox.title = `Value: ${value}, Info: ${infoContent.toFixed(2)} bits`;
            container.appendChild(bitBox);
        }
    }

    updateCompressionView() {
        // Calculate Huffman-style compression
        const counts = {};
        this.constrainedData.forEach(value => {
            counts[value] = (counts[value] || 0) + 1;
        });

        // Sort by frequency
        const sortedSymbols = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Top 10 symbols

        // Calculate sizes
        const originalSize = this.constrainedData.length * 8; // Assume 8 bits per symbol
        let compressedSize = 0;

        sortedSymbols.forEach(([symbol, count]) => {
            const codeLength = Math.ceil(Math.log2(Object.keys(counts).length));
            compressedSize += count * codeLength;
        });

        // Add overhead for remaining symbols
        const remainingCount = this.constrainedData.length -
            sortedSymbols.reduce((sum, [, count]) => sum + count, 0);
        compressedSize += remainingCount * 8;

        const compressionRatio = originalSize / compressedSize;

        document.getElementById('originalSize').textContent = originalSize;
        document.getElementById('compressedSize').textContent = compressedSize;
        document.getElementById('compressionRatio').textContent = compressionRatio.toFixed(2);

        // Display symbol codes
        const treeContainer = document.getElementById('treeContainer');
        treeContainer.innerHTML = '<h4 style="color: #3b82f6; margin-bottom: 10px;">Symbol Frequency Table</h4>';

        sortedSymbols.forEach(([symbol, count]) => {
            const probability = count / this.constrainedData.length;
            const infoContent = -Math.log2(probability);
            const node = document.createElement('div');
            node.className = 'tree-node';
            node.innerHTML = `
                Symbol: ${parseInt(symbol).toString(2).padStart(8, '0')} (value: ${symbol}) |
                Frequency: ${count} |
                Probability: ${(probability * 100).toFixed(1)}% |
                Information: ${infoContent.toFixed(2)} bits
            `;
            treeContainer.appendChild(node);
        });
    }

    startSimulation() {
        if (this.isRunning) return;

        this.isRunning = true;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('stopBtn').disabled = false;

        this.simulationLoop();
    }

    stopSimulation() {
        this.isRunning = false;
        document.getElementById('startBtn').disabled = false;
        document.getElementById('stopBtn').disabled = true;

        if (this.animationId) {
            clearTimeout(this.animationId);
            this.animationId = null;
        }
    }

    resetSimulation() {
        this.stopSimulation();
        this.entropyHistory = [];
        this.currentStep = 0;
        this.generateSignal();
        this.updateDisplay();
    }

    singleStep() {
        this.generateSignal();

        const rawEntropy = this.calculateRawEntropy();
        const constrainedEntropy = this.calculateConstrainedEntropy();

        this.entropyHistory.push({
            raw: rawEntropy,
            constrained: constrainedEntropy
        });

        if (this.entropyHistory.length > this.maxHistoryLength) {
            this.entropyHistory.shift();
        }

        this.currentStep++;
        this.updateDisplay();
    }

    simulationLoop() {
        if (!this.isRunning) return;

        this.singleStep();

        const speed = parseInt(document.getElementById('animationSpeed').value);
        this.animationId = setTimeout(() => this.simulationLoop(), speed);
    }

    startAnimation() {
        // Initial animation to show the simulator is ready
        let frame = 0;
        const animate = () => {
            frame++;
            if (frame < 100) {
                this.drawSignalView();
                requestAnimationFrame(animate);
            }
        };
        animate();
    }
}

// Initialize simulator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.entropySimulator = new EntropySimulator();
});

// Holographic Encoding Accuracy Experiment
// Demonstrates: accuracy(k,n) = k/n + O(1/log n)

class HolographicEncodingDemo {
    constructor() {
        // Canvas setup
        this.mainCanvas = document.getElementById('mainCanvas');
        this.mainCtx = this.mainCanvas.getContext('2d');
        this.accuracyChart = document.getElementById('accuracyChart');
        this.accuracyCtx = this.accuracyChart.getContext('2d');

        // State
        this.originalPoints = [];
        this.shards = [];
        this.reconstructedPoints = [];
        this.phase = 'original'; // 'original', 'shattered', 'reconstructing', 'reconstructed'
        this.reconstructionProgress = 0;
        this.isAnimating = true;
        this.time = 0;

        // Parameters
        this.hiddenDims = 5;
        this.visibleDims = 10;
        this.shardCount = 4;
        this.pattern = 'grid';
        this.showAccuracyOverlay = true;
        this.animateReconstruction = true;

        // Canvas dimensions
        this.canvasWidth = 600;
        this.canvasHeight = 450;

        // Initialize
        this.setupCanvas();
        this.setupControls();
        this.generateOriginalPattern();
        this.createShardCanvases();
        this.startAnimation();
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        
        [this.mainCanvas, this.accuracyChart].forEach(canvas => {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);
        });
    }

    setupControls() {
        // Hidden dimensions
        document.getElementById('hiddenDimsSlider').addEventListener('input', (e) => {
            this.hiddenDims = parseInt(e.target.value);
            document.getElementById('hiddenDimsValue').textContent = this.hiddenDims;
            this.updateAccuracyDisplay();
            this.updateShards();
        });

        // Visible dimensions
        document.getElementById('visibleDimsSlider').addEventListener('input', (e) => {
            this.visibleDims = parseInt(e.target.value);
            document.getElementById('visibleDimsValue').textContent = this.visibleDims;
            this.updateAccuracyDisplay();
            this.updateShards();
        });

        // Shard count
        document.getElementById('shardCountSlider').addEventListener('input', (e) => {
            this.shardCount = parseInt(e.target.value);
            document.getElementById('shardCountValue').textContent = this.shardCount;
            this.createShardCanvases();
            this.updateShards();
        });

        // Pattern
        document.getElementById('patternSelect').addEventListener('change', (e) => {
            this.pattern = e.target.value;
            this.generateOriginalPattern();
            this.updateShards();
        });

        // Checkboxes
        document.getElementById('showAccuracyOverlay').addEventListener('change', (e) => {
            this.showAccuracyOverlay = e.target.checked;
        });

        document.getElementById('animateReconstruction').addEventListener('change', (e) => {
            this.animateReconstruction = e.target.checked;
        });

        // Buttons
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.phase = 'original';
            this.reconstructionProgress = 0;
            this.generateOriginalPattern();
            this.updateShards();
        });

        document.getElementById('shatterBtn').addEventListener('click', () => {
            this.shatter();
        });

        document.getElementById('reconstructBtn').addEventListener('click', () => {
            this.reconstruct();
        });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                e.preventDefault();
                this.isAnimating = !this.isAnimating;
            }
            if (e.key === 's') this.shatter();
            if (e.key === 'r') this.reconstruct();
        });
    }

    generateOriginalPattern() {
        this.originalPoints = [];
        this.reconstructedPoints = [];
        
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        const size = Math.min(this.canvasWidth, this.canvasHeight) * 0.35;

        switch (this.pattern) {
            case 'grid':
                this.generateGrid(centerX, centerY, size);
                break;
            case 'spiral':
                this.generateSpiral(centerX, centerY, size);
                break;
            case 'circle':
                this.generateCircle(centerX, centerY, size);
                break;
            case 'star':
                this.generateStar(centerX, centerY, size);
                break;
            case 'pythagorean':
                this.generatePythagorean(centerX, centerY, size);
                break;
        }

        this.updateAccuracyDisplay();
    }

    generateGrid(cx, cy, size) {
        const step = size / 8;
        for (let x = -size; x <= size; x += step) {
            for (let y = -size; y <= size; y += step) {
                this.originalPoints.push({
                    x: cx + x,
                    y: cy + y,
                    hidden: this.generateHiddenCoords()
                });
            }
        }
    }

    generateSpiral(cx, cy, size) {
        const turns = 4;
        const points = 200;
        for (let i = 0; i < points; i++) {
            const t = i / points;
            const angle = t * turns * Math.PI * 2;
            const r = t * size;
            this.originalPoints.push({
                x: cx + Math.cos(angle) * r,
                y: cy + Math.sin(angle) * r,
                hidden: this.generateHiddenCoords()
            });
        }
    }

    generateCircle(cx, cy, size) {
        // Concentric circles
        for (let r = size * 0.2; r <= size; r += size * 0.2) {
            const points = Math.floor(r * 0.15);
            for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2;
                this.originalPoints.push({
                    x: cx + Math.cos(angle) * r,
                    y: cy + Math.sin(angle) * r,
                    hidden: this.generateHiddenCoords()
                });
            }
        }
    }

    generateStar(cx, cy, size) {
        const points = 5;
        const innerR = size * 0.4;
        const outerR = size;
        
        for (let i = 0; i < points * 2; i++) {
            const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
            const r = i % 2 === 0 ? outerR : innerR;
            
            // Draw line to next point
            const nextAngle = ((i + 1) / (points * 2)) * Math.PI * 2 - Math.PI / 2;
            const nextR = (i + 1) % 2 === 0 ? outerR : innerR;
            
            for (let t = 0; t < 1; t += 0.02) {
                const x = cx + (Math.cos(angle) * r) * (1 - t) + (Math.cos(nextAngle) * nextR) * t;
                const y = cy + (Math.sin(angle) * r) * (1 - t) + (Math.sin(nextAngle) * nextR) * t;
                this.originalPoints.push({
                    x, y,
                    hidden: this.generateHiddenCoords()
                });
            }
        }
    }

    generatePythagorean(cx, cy, size) {
        // Generate Pythagorean triple visualization
        for (let m = 2; m < 15; m++) {
            for (let n = 1; n < m; n++) {
                if ((m - n) % 2 === 1 && this.gcd(m, n) === 1) {
                    const a = m * m - n * n;
                    const b = 2 * m * n;
                    const c = m * m + n * n;
                    
                    const scale = size / 30;
                    this.originalPoints.push({
                        x: cx + a * scale,
                        y: cy - b * scale,
                        hidden: this.generateHiddenCoords()
                    });
                    this.originalPoints.push({
                        x: cx + b * scale,
                        y: cy - a * scale,
                        hidden: this.generateHiddenCoords()
                    });
                }
            }
        }
    }

    gcd(a, b) {
        return b === 0 ? a : this.gcd(b, a % b);
    }

    generateHiddenCoords() {
        const coords = [];
        for (let i = 0; i < this.hiddenDims; i++) {
            coords.push(Math.random() * 2 - 1);
        }
        return coords;
    }

    createShardCanvases() {
        const container = document.getElementById('shardsContainer');
        container.innerHTML = '';
        this.shards = [];

        for (let i = 0; i < this.shardCount; i++) {
            const shardDiv = document.createElement('div');
            shardDiv.className = 'shard';
            
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            
            const label = document.createElement('div');
            label.className = 'shard-label';
            label.textContent = `Shard ${i + 1}`;
            
            const accuracy = document.createElement('div');
            accuracy.className = 'shard-accuracy';
            accuracy.id = `shard-accuracy-${i}`;
            
            shardDiv.appendChild(canvas);
            shardDiv.appendChild(label);
            shardDiv.appendChild(accuracy);
            container.appendChild(shardDiv);
            
            this.shards.push({
                canvas,
                ctx: canvas.getContext('2d'),
                points: []
            });
        }
    }

    updateShards() {
        // Each shard gets a projection with reduced accuracy
        const accuracy = this.hiddenDims / this.visibleDims;
        
        this.shards.forEach((shard, i) => {
            // Project original points to this shard
            shard.points = this.originalPoints.map(p => {
                // Add noise based on accuracy
                const noiseScale = (1 - accuracy) * 20;
                const angle = (i / this.shardCount) * Math.PI * 2;
                
                return {
                    x: p.x + Math.cos(angle + p.hidden[0]) * noiseScale + (Math.random() - 0.5) * noiseScale,
                    y: p.y + Math.sin(angle + p.hidden[0]) * noiseScale + (Math.random() - 0.5) * noiseScale,
                    original: p
                };
            });
            
            // Update accuracy display
            const shardAccuracy = (accuracy * 100).toFixed(1);
            document.getElementById(`shard-accuracy-${i}`).textContent = `${shardAccuracy}%`;
            
            this.renderShard(shard, i);
        });
    }

    renderShard(shard, index) {
        const ctx = shard.ctx;
        const canvas = shard.canvas;
        const w = canvas.width;
        const h = canvas.height;
        
        // Clear
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        
        // Scale points to fit shard
        const scaleX = w / this.canvasWidth;
        const scaleY = h / this.canvasHeight;
        
        // Draw points
        const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3'];
        ctx.fillStyle = colors[index % colors.length];
        
        shard.points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x * scaleX, p.y * scaleY, 1.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    updateAccuracyDisplay() {
        const accuracy = this.hiddenDims / this.visibleDims;
        const errorTerm = 1 / Math.log(this.visibleDims + 1);
        
        document.getElementById('theoreticalAccuracy').textContent = 
            (accuracy * 100).toFixed(1) + '%';
        document.getElementById('knRatio').textContent = 
            `${this.hiddenDims}/${this.visibleDims}`;
        document.getElementById('errorTerm').textContent = 
            '~' + (errorTerm * 100).toFixed(1) + '%';
        document.getElementById('lognTerm').textContent = 
            `O(1/log ${this.visibleDims})`;
    }

    shatter() {
        this.phase = 'shattered';
        this.updateShards();
    }

    reconstruct() {
        this.phase = 'reconstructing';
        this.reconstructionProgress = 0;
    }

    calculateReconstructionAccuracy() {
        if (this.reconstructedPoints.length === 0) return 0;
        
        let totalError = 0;
        let count = 0;
        
        this.reconstructedPoints.forEach((rp, i) => {
            if (i < this.originalPoints.length) {
                const op = this.originalPoints[i];
                const error = Math.hypot(rp.x - op.x, rp.y - op.y);
                totalError += error;
                count++;
            }
        });
        
        if (count === 0) return 0;
        
        const avgError = totalError / count;
        const maxError = Math.max(this.canvasWidth, this.canvasHeight);
        
        return Math.max(0, 1 - avgError / (maxError * 0.1));
    }

    renderMainCanvas() {
        const ctx = this.mainCtx;
        const w = this.canvasWidth;
        const h = this.canvasHeight;
        
        // Clear
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        
        const cx = w / 2;
        const cy = h / 2;
        
        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        const gridSize = 30;
        for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Draw based on phase
        switch (this.phase) {
            case 'original':
                this.renderOriginal(ctx);
                break;
            case 'shattered':
                this.renderShattered(ctx);
                break;
            case 'reconstructing':
                this.renderReconstructing(ctx);
                break;
            case 'reconstructed':
                this.renderReconstructed(ctx);
                break;
        }

        // Draw accuracy overlay
        if (this.showAccuracyOverlay) {
            this.drawAccuracyOverlay(ctx);
        }

        // Phase label
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Phase: ${this.phase}`, cx, h - 15);
    }

    renderOriginal(ctx) {
        // Draw original points
        ctx.fillStyle = '#ff6b6b';
        this.originalPoints.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Hidden dimension visualization
        if (this.hiddenDims > 0) {
            ctx.strokeStyle = 'rgba(254, 202, 87, 0.3)';
            ctx.lineWidth = 1;
            
            this.originalPoints.forEach(p => {
                if (p.hidden && p.hidden.length > 0) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x + p.hidden[0] * 10, p.y + p.hidden[1 % p.hidden.length] * 10);
                    ctx.stroke();
                }
            });
        }
    }

    renderShattered(ctx) {
        // Show shards flying apart
        const separation = 50;
        
        this.shards.forEach((shard, i) => {
            const angle = (i / this.shardCount) * Math.PI * 2 + this.time;
            const offsetX = Math.cos(angle) * separation;
            const offsetY = Math.sin(angle) * separation;
            
            ctx.fillStyle = `hsla(${i * 360 / this.shardCount}, 70%, 60%, 0.5)`;
            
            shard.points.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x + offsetX, p.y + offsetY, 2, 0, Math.PI * 2);
                ctx.fill();
            });
        });
    }

    renderReconstructing(ctx) {
        // Animate reconstruction
        const t = this.reconstructionProgress;
        
        // Draw shards fading
        ctx.globalAlpha = 1 - t;
        this.renderShattered(ctx);
        ctx.globalAlpha = 1;
        
        // Draw reconstructed points emerging
        this.reconstructedPoints.forEach((p, i) => {
            const op = this.originalPoints[i];
            if (op) {
                const x = op.x + (p.x - op.x) * t;
                const y = op.y + (p.y - op.y) * t;
                
                ctx.fillStyle = `rgba(0, 255, 136, ${t})`;
                ctx.beginPath();
                ctx.arc(x, y, 3 * t, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    renderReconstructed(ctx) {
        // Draw reconstructed points
        ctx.fillStyle = '#00ff88';
        this.reconstructedPoints.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw error vectors
        ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
        ctx.lineWidth = 1;
        
        this.reconstructedPoints.forEach((rp, i) => {
            if (i < this.originalPoints.length) {
                const op = this.originalPoints[i];
                ctx.beginPath();
                ctx.moveTo(op.x, op.y);
                ctx.lineTo(rp.x, rp.y);
                ctx.stroke();
            }
        });
    }

    drawAccuracyOverlay(ctx) {
        const accuracy = this.hiddenDims / this.visibleDims;
        const errorTerm = 1 / Math.log(this.visibleDims + 1);
        const totalAccuracy = accuracy + errorTerm;
        
        // Draw accuracy bar
        const barWidth = 150;
        const barHeight = 10;
        const barX = 20;
        const barY = 20;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 25);
        
        // Accuracy bar
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth * totalAccuracy, barY);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(0.5, '#feca57');
        gradient.addColorStop(1, '#00ff88');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, barWidth * Math.min(totalAccuracy, 1), barHeight);
        
        // Label
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`Accuracy: ${(totalAccuracy * 100).toFixed(1)}%`, barX, barY + barHeight + 12);
    }

    renderAccuracyChart() {
        const ctx = this.accuracyCtx;
        const w = 500;
        const h = 150;
        
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        
        // Draw axes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(50, 20);
        ctx.lineTo(50, h - 20);
        ctx.lineTo(w - 20, h - 20);
        ctx.stroke();
        
        // Draw accuracy curve
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let n = 2; n <= 20; n++) {
            const x = 50 + (n - 2) * ((w - 70) / 18);
            const accuracy = this.hiddenDims / n + 1 / Math.log(n + 1);
            const y = h - 20 - accuracy * (h - 40);
            
            if (n === 2) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // Current point
        const currentX = 50 + (this.visibleDims - 2) * ((w - 70) / 18);
        const currentAccuracy = this.hiddenDims / this.visibleDims + 1 / Math.log(this.visibleDims + 1);
        const currentY = h - 20 - currentAccuracy * (h - 40);
        
        ctx.fillStyle = '#feca57';
        ctx.beginPath();
        ctx.arc(currentX, currentY, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Labels
        ctx.fillStyle = '#888';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('n (visible dimensions)', w / 2, h - 5);
        
        ctx.save();
        ctx.translate(15, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Accuracy', 0, 0);
        ctx.restore();
    }

    update(dt) {
        if (this.isAnimating) {
            this.time += dt * 0.001;
        }

        if (this.phase === 'reconstructing') {
            const speed = this.animateReconstruction ? 0.002 : 0.01;
            this.reconstructionProgress += dt * speed;
            
            // Generate reconstructed points by combining shards
            if (this.reconstructedPoints.length === 0) {
                this.reconstructedPoints = this.originalPoints.map((op, i) => {
                    // Average all shard projections
                    let sumX = 0, sumY = 0;
                    this.shards.forEach(shard => {
                        if (shard.points[i]) {
                            sumX += shard.points[i].x;
                            sumY += shard.points[i].y;
                        }
                    });
                    return {
                        x: sumX / this.shards.length,
                        y: sumY / this.shards.length
                    };
                });
            }
            
            if (this.reconstructionProgress >= 1) {
                this.reconstructionProgress = 1;
                this.phase = 'reconstructed';
                
                // Update measured accuracy
                const measured = this.calculateReconstructionAccuracy();
                document.getElementById('measuredAccuracy').textContent = 
                    (measured * 100).toFixed(1) + '%';
            }
        }
    }

    render() {
        this.renderMainCanvas();
        this.renderAccuracyChart();
    }

    loop(timestamp) {
        const dt = Math.min(timestamp - this.lastFrameTime, 32);
        this.lastFrameTime = timestamp;
        
        this.update(dt);
        this.render();
        
        requestAnimationFrame((t) => this.loop(t));
    }

    startAnimation() {
        this.lastFrameTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new HolographicEncodingDemo();
});

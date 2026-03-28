/**
 * Dodecet Encoding Simulator
 * Visualizes the 12 discrete orientations used in Constraint Theory
 */

// The 12 dodecet vectors from Pythagorean triples
const DODECET_VECTORS = [
    { x: 1, y: 0, angle: 0, triple: [1, 0, 1] },
    { x: 1, y: 1, angle: 45, triple: [1, 1, Math.sqrt(2)] },
    { x: 0, y: 1, angle: 90, triple: [0, 1, 1] },
    { x: -1, y: 1, angle: 135, triple: [1, 1, Math.sqrt(2)] },
    { x: -1, y: 0, angle: 180, triple: [1, 0, 1] },
    { x: -1, y: -1, angle: 225, triple: [1, 1, Math.sqrt(2)] },
    { x: 0, y: -1, angle: 270, triple: [0, 1, 1] },
    { x: 1, y: -1, angle: 315, triple: [1, 1, Math.sqrt(2)] },
    // Knight moves (extended dodecet)
    { x: 2, y: 1, angle: 26.57, triple: [2, 1, Math.sqrt(5)] },
    { x: 1, y: 2, angle: 63.43, triple: [1, 2, Math.sqrt(5)] },
    { x: -1, y: 2, angle: 116.57, triple: [1, 2, Math.sqrt(5)] },
    { x: -2, y: 1, angle: 153.43, triple: [2, 1, Math.sqrt(5)] },
];

class DodecetSimulator {
    constructor() {
        this.canvas = document.getElementById('dodecetCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // State
        this.mouseAngle = 0;
        this.selectedVector = null;
        this.mode = 'nearest';
        this.showAxes = true;
        this.showLabels = true;
        this.showError = false;
        this.animate = false;
        this.animationAngle = 0;
        
        // Setup
        this.setupCanvas();
        this.setupControls();
        this.renderVectorList();
        this.animateLoop();
    }
    
    setupCanvas() {
        const container = this.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = container.clientWidth * dpr;
        this.canvas.height = 600 * dpr;
        this.canvas.style.width = container.clientWidth + 'px';
        this.canvas.style.height = '600px';
        this.ctx.scale(dpr, dpr);
        this.centerX = container.clientWidth / 2;
        this.centerY = 300;
        this.radius = Math.min(this.centerX, this.centerY) - 50;
        
        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left - this.centerX;
            const y = rect.top + this.centerY - e.clientY;
            this.mouseAngle = Math.atan2(y, x);
            this.selectedVector = this.findNearestVector(this.mouseAngle);
            this.updateInfo();
        });
        
        window.addEventListener('resize', () => this.setupCanvas());
    }
    
    setupControls() {
        // Mode buttons
        document.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-mode]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.mode = btn.dataset.mode;
            });
        });
        
        // Checkboxes
        document.getElementById('showAxes').addEventListener('change', (e) => {
            this.showAxes = e.target.checked;
        });
        document.getElementById('showLabels').addEventListener('change', (e) => {
            this.showLabels = e.target.checked;
        });
        document.getElementById('showError').addEventListener('change', (e) => {
            this.showError = e.target.checked;
        });
        document.getElementById('animate').addEventListener('change', (e) => {
            this.animate = e.target.checked;
        });
    }
    
    renderVectorList() {
        const list = document.getElementById('vectorList');
        list.innerHTML = DODECET_VECTORS.map((v, i) => `
            <div class="vector-item" data-index="${i}">
                <div class="coords">(${v.x}, ${v.y})</div>
                <div class="angle">${v.angle.toFixed(1)}°</div>
            </div>
        `).join('');
        
        list.querySelectorAll('.vector-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.selectedVector = DODECET_VECTORS[index];
                this.mouseAngle = this.selectedVector.angle * Math.PI / 180;
                this.updateInfo();
                list.querySelectorAll('.vector-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }
    
    findNearestVector(angle) {
        let nearest = DODECET_VECTORS[0];
        let minDiff = Infinity;
        
        for (const vector of DODECET_VECTORS) {
            let diff = Math.abs(angle - vector.angle * Math.PI / 180);
            // Normalize to [-PI, PI]
            while (diff > Math.PI) diff -= 2 * Math.PI;
            while (diff < -Math.PI) diff += 2 * Math.PI;
            diff = Math.abs(diff);
            
            if (diff < minDiff) {
                minDiff = diff;
                nearest = vector;
            }
        }
        
        return nearest;
    }
    
    updateInfo() {
        const encoding = document.getElementById('encodingValue');
        const angle = document.getElementById('angleValue');
        const error = document.getElementById('errorValue');
        
        if (this.selectedVector) {
            encoding.textContent = `(${this.selectedVector.x}, ${this.selectedVector.y})`;
            angle.textContent = `${(this.mouseAngle * 180 / Math.PI).toFixed(1)}°`;
            
            // Calculate error
            const vectorAngle = this.selectedVector.angle * Math.PI / 180;
            let errorDeg = Math.abs(this.mouseAngle - vectorAngle);
            while (errorDeg > Math.PI) errorDeg -= 2 * Math.PI;
            while (errorDeg < -Math.PI) errorDeg += 2 * Math.PI;
            errorDeg = Math.abs(errorDeg * 180 / Math.PI);
            error.textContent = `${errorDeg.toFixed(1)}°`;
        }
    }
    
    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        
        // Clear
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = -10; i <= 10; i++) {
            const x = this.centerX + i * 30;
            const y = this.centerY + i * 30;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Draw axes
        if (this.showAxes) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, this.centerY);
            ctx.lineTo(width, this.centerY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.centerX, 0);
            ctx.lineTo(this.centerX, height);
            ctx.stroke();
            
            // Origin
            ctx.fillStyle = '#00ff88';
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw error regions (wedges)
        if (this.showError) {
            DODECET_VECTORS.forEach((vector, i) => {
                const angle = vector.angle * Math.PI / 180;
                const nextVector = DODECET_VECTORS[(i + 1) % DODECET_VECTORS.length];
                const nextAngle = nextVector.angle * Math.PI / 180;
                
                // Draw wedge
                ctx.beginPath();
                ctx.moveTo(this.centerX, this.centerY);
                ctx.arc(this.centerX, this.centerY, this.radius, -angle, -nextAngle, true);
                ctx.closePath();
                ctx.fillStyle = `hsla(${i * 30}, 50%, 50%, 0.1)`;
                ctx.fill();
            });
        }
        
        // Draw dodecet vectors
        DODECET_VECTORS.forEach((vector, i) => {
            const angle = vector.angle * Math.PI / 180;
            const x = this.centerX + Math.cos(angle) * this.radius;
            const y = this.centerY - Math.sin(angle) * this.radius;
            
            // Draw line
            ctx.beginPath();
            ctx.moveTo(this.centerX, this.centerY);
            ctx.lineTo(x, y);
            
            const isNearest = this.selectedVector === vector;
            ctx.strokeStyle = isNearest ? '#00ff88' : 'rgba(0, 217, 255, 0.5)';
            ctx.lineWidth = isNearest ? 3 : 1;
            ctx.stroke();
            
            // Draw endpoint
            ctx.beginPath();
            ctx.arc(x, y, isNearest ? 8 : 5, 0, Math.PI * 2);
            ctx.fillStyle = isNearest ? '#00ff88' : '#00d9ff';
            ctx.fill();
            
            // Draw label
            if (this.showLabels) {
                const labelX = this.centerX + Math.cos(angle) * (this.radius + 25);
                const labelY = this.centerY - Math.sin(angle) * (this.radius + 25);
                ctx.fillStyle = isNearest ? '#00ff88' : '#888';
                ctx.font = isNearest ? 'bold 12px monospace' : '11px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`(${vector.x},${vector.y})`, labelX, labelY);
            }
        });
        
        // Draw current mouse direction
        if (this.mouseAngle !== undefined) {
            const x = this.centerX + Math.cos(this.mouseAngle) * this.radius;
            const y = this.centerY - Math.sin(this.mouseAngle) * this.radius;
            
            ctx.beginPath();
            ctx.moveTo(this.centerX, this.centerY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw snap line
            if (this.selectedVector && this.mode === 'nearest') {
                const vectorAngle = this.selectedVector.angle * Math.PI / 180;
                const snapX = this.centerX + Math.cos(vectorAngle) * this.radius;
                const snapY = this.centerY - Math.sin(vectorAngle) * this.radius;
                
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(snapX, snapY);
                ctx.strokeStyle = 'rgba(0, 255, 136, 0.5)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }
        
        // Draw encoding info box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(10, 10, 180, 80);
        ctx.strokeStyle = 'rgba(0, 217, 255, 0.3)';
        ctx.strokeRect(10, 10, 180, 80);
        
        ctx.fillStyle = '#888';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Encoding:', 20, 35);
        ctx.fillText('Angle:', 20, 55);
        ctx.fillText('Error:', 20, 75);
        
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 12px monospace';
        if (this.selectedVector) {
            ctx.fillText(`(${this.selectedVector.x}, ${this.selectedVector.y})`, 85, 35);
            ctx.fillText(`${(this.mouseAngle * 180 / Math.PI).toFixed(1)}°`, 85, 55);
            const errorDeg = this.calculateError();
            ctx.fillText(`${errorDeg.toFixed(1)}°`, 85, 75);
        }
    }
    
    calculateError() {
        if (!this.selectedVector) return 0;
        const vectorAngle = this.selectedVector.angle * Math.PI / 180;
        let error = this.mouseAngle - vectorAngle;
        while (error > Math.PI) error -= 2 * Math.PI;
        while (error < -Math.PI) error += 2 * Math.PI;
        return Math.abs(error * 180 / Math.PI);
    }
    
    animateLoop() {
        if (this.animate) {
            this.animationAngle += 0.01;
            this.mouseAngle = this.animationAngle;
            this.selectedVector = this.findNearestVector(this.mouseAngle);
            this.updateInfo();
        }
        
        this.draw();
        requestAnimationFrame(() => this.animateLoop());
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new DodecetSimulator();
});

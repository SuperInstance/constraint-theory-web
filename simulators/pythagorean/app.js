/**
 * Pythagorean Snapping Simulator
 * 
 * Features:
 * - Origin at lower-left (standard mathematical quadrant I view)
 * - Zoom with mouse wheel and buttons
 * - Pan by dragging
 * - Displays many Pythagorean triples
 */

class PythagoreanSimulator {
    constructor() {
        this.canvas = document.getElementById('snapCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // View state
        this.scale = 20; // Pixels per unit
        this.minScale = 2;
        this.maxScale = 100;
        this.offsetX = 50; // Padding from left
        this.offsetY = 50; // Padding from bottom (origin at lower-left)
        
        // Interaction state
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragOffset = { x: this.offsetX, y: this.offsetY };
        
        // Points placed by user
        this.points = [];
        this.threshold = 2.0;
        this.maxTripleSize = 100;
        
        // Display options
        this.showGrid = true;
        this.showRatios = true;
        this.showAngles = true;
        this.showLabels = true;
        
        // Pre-computed Pythagorean triples
        this.pythagoreanTriples = this.generateTriples(100);
        
        // View bounds
        this.viewMinX = 0;
        this.viewMaxX = 0;
        this.viewMinY = 0;
        this.viewMaxY = 0;
        
        this.init();
    }
    
    generateTriples(maxC) {
        const triples = [];
        // Generate primitive Pythagorean triples using Euclid's formula
        for (let m = 2; m * m <= maxC; m++) {
            for (let n = 1; n < m; n++) {
                if ((m + n) % 2 === 1 && this.gcd(m, n) === 1) {
                    const a = m * m - n * n;
                    const b = 2 * m * n;
                    const c = m * m + n * n;
                    
                    if (c <= maxC) {
                        // Add both orderings (a, b) and (b, a)
                        triples.push({ a: Math.min(a, b), b: Math.max(a, b), c, primitive: true });
                        
                        // Add multiples (non-primitive)
                        for (let k = 2; k * c <= maxC; k++) {
                            triples.push({ 
                                a: Math.min(a * k, b * k), 
                                b: Math.max(a * k, b * k), 
                                c: c * k, 
                                primitive: false 
                            });
                        }
                    }
                }
            }
        }
        
        // Sort by c value
        triples.sort((x, y) => x.c - y.c);
        return triples;
    }
    
    gcd(a, b) {
        return b === 0 ? a : this.gcd(b, a % b);
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.updateTriplesList();
        this.render();
    }
    
    setupCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = 600;
        
        // Set initial offset to show origin at lower-left with some padding
        this.offsetX = 50;
        this.offsetY = this.canvas.height - 50;
        this.dragOffset = { x: this.offsetX, y: this.offsetY };
        
        window.addEventListener('resize', () => {
            this.canvas.width = container.clientWidth;
            this.render();
        });
    }
    
    setupEventListeners() {
        // Mouse wheel zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom(zoomFactor, e);
        });
        
        // Pan with drag
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                this.isDragging = true;
                this.dragStart = { x: e.clientX, y: e.clientY };
                this.dragOffset = { x: this.offsetX, y: this.offsetY };
                this.canvas.style.cursor = 'grabbing';
            }
        });
        
        window.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.dragStart.x;
                const dy = e.clientY - this.dragStart.y;
                this.offsetX = this.dragOffset.x + dx;
                this.offsetY = this.dragOffset.y + dy;
                this.render();
            }
        });
        
        window.addEventListener('mouseup', (e) => {
            if (this.isDragging && e.button === 0) {
                this.isDragging = false;
                this.canvas.style.cursor = 'crosshair';
                
                // If it was a click (not a drag), add a point
                const dx = Math.abs(e.clientX - this.dragStart.x);
                const dy = Math.abs(e.clientY - this.dragStart.y);
                if (dx < 5 && dy < 5 && e.target === this.canvas) {
                    this.handleCanvasClick(e);
                }
            }
        });
        
        // Zoom buttons
        document.getElementById('zoomIn').addEventListener('click', () => this.zoom(1.3));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoom(0.7));
        document.getElementById('resetView').addEventListener('click', () => this.resetView());
        
        // Sliders
        document.getElementById('threshold').addEventListener('input', (e) => {
            this.threshold = parseFloat(e.target.value);
            document.getElementById('thresholdValue').textContent = this.threshold.toFixed(1);
            this.recalculateSnaps();
            this.render();
        });
        
        document.getElementById('maxTriple').addEventListener('input', (e) => {
            this.maxTripleSize = parseInt(e.target.value);
            document.getElementById('maxTripleValue').textContent = this.maxTripleSize;
            this.pythagoreanTriples = this.generateTriples(this.maxTripleSize);
            this.updateTriplesList();
            this.render();
        });
        
        // Checkboxes
        document.getElementById('showGrid').addEventListener('change', (e) => {
            this.showGrid = e.target.checked;
            this.render();
        });
        document.getElementById('showRatios').addEventListener('change', (e) => {
            this.showRatios = e.target.checked;
            this.render();
        });
        document.getElementById('showAngles').addEventListener('change', (e) => {
            this.showAngles = e.target.checked;
            this.render();
        });
        document.getElementById('showLabels').addEventListener('change', (e) => {
            this.showLabels = e.target.checked;
            this.render();
        });
        
        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.points = [];
            this.updateStats();
            this.render();
            document.getElementById('snapHistory').innerHTML = '<p class="text-gray-500 text-sm">Click on canvas to snap points</p>';
        });
    }
    
    zoom(factor, e) {
        const oldScale = this.scale;
        this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * factor));
        
        if (e) {
            // Zoom toward mouse position
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            this.offsetX = mouseX - (mouseX - this.offsetX) * (this.scale / oldScale);
            this.offsetY = mouseY - (mouseY - this.offsetY) * (this.scale / oldScale);
        }
        
        document.getElementById('zoomLevel').textContent = (this.scale / 20).toFixed(1) + 'x';
        document.getElementById('scaleDisplay').textContent = `1 unit = ${this.scale.toFixed(0)}px`;
        this.render();
    }
    
    resetView() {
        this.scale = 20;
        this.offsetX = 50;
        this.offsetY = this.canvas.height - 50;
        document.getElementById('zoomLevel').textContent = '1.0x';
        document.getElementById('scaleDisplay').textContent = '1 unit = 20px';
        this.render();
    }
    
    screenToWorld(screenX, screenY) {
        // Convert screen coordinates to world coordinates (origin at lower-left)
        return {
            x: (screenX - this.offsetX) / this.scale,
            y: (this.offsetY - screenY) / this.scale  // Note: Y is inverted
        };
    }
    
    worldToScreen(worldX, worldY) {
        // Convert world coordinates to screen coordinates
        return {
            x: worldX * this.scale + this.offsetX,
            y: this.offsetY - worldY * this.scale  // Note: Y is inverted
        };
    }
    
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        
        const world = this.screenToWorld(screenX, screenY);
        
        // Snap to Pythagorean triple
        const snapped = this.snapToPythagorean(world.x, world.y);
        
        this.points.push({
            x: world.x,
            y: world.y,
            snapped: snapped.snapped,
            snappedTo: snapped.snappedTo,
            distance: snapped.distance
        });
        
        this.updateSnapHistory(snapped);
        this.updateStats();
        this.render();
    }
    
    snapToPythagorean(x, y) {
        let snapped = null;
        let minDistance = Infinity;
        
        for (const triple of this.pythagoreanTriples) {
            // Check both (a, b) and (b, a) orderings
            const orders = [
                { x: triple.a, y: triple.b, triple },
                { x: triple.b, y: triple.a, triple }
            ];
            
            for (const order of orders) {
                const distance = Math.sqrt(
                    Math.pow(x - order.x, 2) + Math.pow(y - order.y, 2)
                );
                
                if (distance < this.threshold && distance < minDistance) {
                    minDistance = distance;
                    snapped = { x: order.x, y: order.y, triple: order.triple };
                }
            }
        }
        
        return {
            original: { x, y },
            snapped: snapped !== null,
            snappedTo: snapped,
            distance: minDistance === Infinity ? 0 : minDistance
        };
    }
    
    recalculateSnaps() {
        this.points = this.points.map(point => {
            const snapped = this.snapToPythagorean(point.x, point.y);
            return {
                x: point.x,
                y: point.y,
                snapped: snapped.snapped,
                snappedTo: snapped.snappedTo,
                distance: snapped.distance
            };
        });
        this.updateStats();
    }
    
    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, width, height);
        
        // Calculate visible world bounds
        const topLeft = this.screenToWorld(0, 0);
        const bottomRight = this.screenToWorld(width, height);
        this.viewMinX = Math.min(topLeft.x, bottomRight.x);
        this.viewMaxX = Math.max(topLeft.x, bottomRight.x);
        this.viewMinY = Math.min(topLeft.y, bottomRight.y);
        this.viewMaxY = Math.max(topLeft.y, bottomRight.y);
        
        // Draw grid
        if (this.showGrid) {
            this.drawGrid();
        }
        
        // Draw axes
        this.drawAxes();
        
        // Draw Pythagorean triples
        if (this.showRatios) {
            this.drawPythagoreanTriples();
        }
        
        // Draw user points
        this.drawPoints();
        
        // Update visible count
        this.updateVisibleCount();
    }
    
    drawGrid() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Determine grid spacing based on scale
        let gridStep = 1;
        if (this.scale < 5) gridStep = 10;
        else if (this.scale < 10) gridStep = 5;
        else if (this.scale < 20) gridStep = 2;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = 1;
        
        // Vertical lines
        const startX = Math.floor(this.viewMinX / gridStep) * gridStep;
        for (let x = startX; x <= this.viewMaxX; x += gridStep) {
            const screen = this.worldToScreen(x, 0);
            ctx.beginPath();
            ctx.moveTo(screen.x, 0);
            ctx.lineTo(screen.x, height);
            ctx.stroke();
        }
        
        // Horizontal lines
        const startY = Math.floor(this.viewMinY / gridStep) * gridStep;
        for (let y = startY; y <= this.viewMaxY; y += gridStep) {
            const screen = this.worldToScreen(0, y);
            ctx.beginPath();
            ctx.moveTo(0, screen.y);
            ctx.lineTo(width, screen.y);
            ctx.stroke();
        }
    }
    
    drawAxes() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Origin screen position
        const origin = this.worldToScreen(0, 0);
        
        // X-axis
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, origin.y);
        ctx.lineTo(width, origin.y);
        ctx.stroke();
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(origin.x, 0);
        ctx.lineTo(origin.x, height);
        ctx.stroke();
        
        // Origin marker
        ctx.fillStyle = '#00ffaa';
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Axis labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '12px sans-serif';
        ctx.fillText('0', origin.x - 15, origin.y + 15);
        
        // Tick marks on axes
        let tickStep = 1;
        if (this.scale < 5) tickStep = 10;
        else if (this.scale < 10) tickStep = 5;
        else if (this.scale < 15) tickStep = 2;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '10px monospace';
        
        // X-axis ticks
        for (let x = tickStep; x <= this.viewMaxX; x += tickStep) {
            const screen = this.worldToScreen(x, 0);
            if (screen.x > 30 && screen.x < width - 10) {
                ctx.fillText(x.toString(), screen.x - 5, origin.y + 15);
            }
        }
        
        // Y-axis ticks
        for (let y = tickStep; y <= this.viewMaxY; y += tickStep) {
            const screen = this.worldToScreen(0, y);
            if (screen.y > 10 && screen.y < height - 30) {
                ctx.fillText(y.toString(), origin.x - 20, screen.y + 4);
            }
        }
    }
    
    drawPythagoreanTriples() {
        const ctx = this.ctx;
        
        let visibleCount = 0;
        
        for (const triple of this.pythagoreanTriples) {
            // Skip if outside view
            if (triple.a > this.viewMaxX && triple.b > this.viewMaxX) continue;
            if (triple.a < this.viewMinX && triple.b < this.viewMinX) continue;
            if (triple.a > this.viewMaxY && triple.b > this.viewMaxY) continue;
            if (triple.a < this.viewMinY && triple.b < this.viewMinY) continue;
            
            visibleCount++;
            
            // Draw both orderings: (a, b) and (b, a)
            const positions = [
                { x: triple.a, y: triple.b },
                { x: triple.b, y: triple.a }
            ];
            
            for (const pos of positions) {
                if (pos.x < this.viewMinX - 1 || pos.x > this.viewMaxX + 1) continue;
                if (pos.y < this.viewMinY - 1 || pos.y > this.viewMaxY + 1) continue;
                
                const screen = this.worldToScreen(pos.x, pos.y);
                
                // Draw ratio point
                const radius = triple.primitive ? 6 : 4;
                const alpha = triple.primitive ? 0.8 : 0.4;
                
                ctx.beginPath();
                ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = triple.primitive 
                    ? `rgba(0, 255, 170, ${alpha})` 
                    : `rgba(0, 170, 255, ${alpha})`;
                ctx.fill();
                
                // Draw triangle from origin if enabled
                if (this.showAngles && this.scale > 8) {
                    const origin = this.worldToScreen(0, 0);
                    const xEnd = this.worldToScreen(pos.x, 0);
                    
                    ctx.beginPath();
                    ctx.moveTo(origin.x, origin.y);
                    ctx.lineTo(xEnd.x, origin.y);
                    ctx.lineTo(screen.x, screen.y);
                    ctx.closePath();
                    ctx.strokeStyle = `rgba(0, 255, 170, 0.15)`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
                
                // Draw label if zoomed in enough
                if (this.showLabels && this.scale > 15) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                    ctx.font = '10px monospace';
                    ctx.fillText(`(${triple.a},${triple.b})`, screen.x + 8, screen.y - 8);
                }
            }
        }
        
        this.visibleTripleCount = visibleCount;
    }
    
    drawPoints() {
        const ctx = this.ctx;
        
        for (const point of this.points) {
            const screen = this.worldToScreen(point.x, point.y);
            
            // Draw line to snapped point if snapped
            if (point.snapped && point.snappedTo) {
                const snappedScreen = this.worldToScreen(point.snappedTo.x, point.snappedTo.y);
                
                // Draw snap line
                ctx.beginPath();
                ctx.moveTo(screen.x, screen.y);
                ctx.lineTo(snappedScreen.x, snappedScreen.y);
                ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Draw snapped point (larger, green)
                ctx.beginPath();
                ctx.arc(snappedScreen.x, snappedScreen.y, 10, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 255, 170, 0.8)';
                ctx.fill();
                ctx.strokeStyle = '#00ffaa';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            // Draw original point
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = point.snapped ? 'rgba(59, 130, 246, 0.8)' : 'rgba(239, 68, 68, 0.8)';
            ctx.fill();
            ctx.strokeStyle = point.snapped ? '#3b82f6' : '#ef4444';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
    
    updateVisibleCount() {
        document.getElementById('visibleTriples').textContent = this.visibleTripleCount || 0;
    }
    
    updateTriplesList() {
        const list = document.getElementById('triplesList');
        const displayTriples = this.pythagoreanTriples.slice(0, 20);
        
        list.innerHTML = displayTriples.map(t => `
            <div class="triple-item">
                <span>${t.a}² + ${t.b}² = ${t.c}²</span>
                <span style="color: ${t.primitive ? '#00ffaa' : '#00aaff'}">(${t.a}, ${t.b})</span>
            </div>
        `).join('') + (this.pythagoreanTriples.length > 20 
            ? `<div class="text-center text-gray-500 text-xs mt-2">+${this.pythagoreanTriples.length - 20} more...</div>` 
            : '');
    }
    
    updateSnapHistory(snapped) {
        const history = document.getElementById('snapHistory');
        
        // Remove placeholder if present
        const placeholder = history.querySelector('.text-gray-500');
        if (placeholder) placeholder.remove();
        
        const entry = document.createElement('div');
        entry.className = `snap-entry ${snapped.snapped ? 'snap-success' : 'snap-fail'}`;
        entry.innerHTML = `
            <div>(${snapped.original.x.toFixed(2)}, ${snapped.original.y.toFixed(2)})</div>
            ${snapped.snapped 
                ? `<div style="color: #00ffaa;">→ (${snapped.snappedTo.x}, ${snapped.snappedTo.y})</div>
                   <div style="color: #888; font-size: 0.7rem;">distance: ${snapped.distance.toFixed(3)}</div>`
                : '<div style="color: #ff6666;">no snap within threshold</div>'
            }
        `;
        
        history.insertBefore(entry, history.firstChild);
        
        // Keep only last 20 entries
        while (history.children.length > 20) {
            history.removeChild(history.lastChild);
        }
    }
    
    updateStats() {
        const total = this.points.length;
        const snapped = this.points.filter(p => p.snapped).length;
        const snapRate = total > 0 ? (snapped / total * 100).toFixed(1) : 0;
        const avgDistance = snapped > 0
            ? (this.points.reduce((sum, p) => sum + (p.distance || 0), 0) / snapped).toFixed(2)
            : '0.00';
        
        document.getElementById('totalPoints').textContent = total;
        document.getElementById('snappedPoints').textContent = snapped;
        document.getElementById('snapRate').textContent = `${snapRate}%`;
        document.getElementById('avgDistance').textContent = avgDistance;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PythagoreanSimulator();
});

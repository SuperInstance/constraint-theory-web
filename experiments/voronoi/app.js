// Voronoi Diagram Simulator
// Implements pixel-based Voronoi diagram generation with multiple distance metrics

class VoronoiSimulator {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // State
        this.seeds = [];
        this.distanceMetric = 'euclidean';
        this.colorMode = 'random';
        this.showVoronoi = true;
        this.showDelaunay = false;
        this.showSeeds = true;
        this.showCellAreas = false;
        this.isAnimating = false;

        // Colors for seeds
        this.seedColors = [];

        // Cell statistics
        this.cellStats = {
            areas: [],
            totalArea: 0,
            avgArea: 0,
            largestArea: 0,
            smallestArea: Infinity
        };

        // Initialize with some random points
        this.initializeWithRandomPoints(20);
    }

    // Distance metrics
    euclideanDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    manhattanDistance(x1, y1, x2, y2) {
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    }

    chebyshevDistance(x1, y1, x2, y2) {
        return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    }

    getDistance(x1, y1, x2, y2) {
        switch (this.distanceMetric) {
            case 'manhattan':
                return this.manhattanDistance(x1, y1, x2, y2);
            case 'chebyshev':
                return this.chebyshevDistance(x1, y1, x2, y2);
            default:
                return this.euclideanDistance(x1, y1, x2, y2);
        }
    }

    // Generate random color
    randomColor() {
        const hue = Math.random() * 360;
        const saturation = 60 + Math.random() * 30;
        const lightness = 40 + Math.random() * 20;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    // Get color for a seed based on color mode
    getSeedColor(index, area, centroidDist) {
        const baseColor = this.seedColors[index];

        switch (this.colorMode) {
            case 'area':
                // Color by area relative to average
                const areaRatio = area / this.cellStats.avgArea;
                const hue = Math.max(0, 240 - (areaRatio - 0.5) * 240);
                return `hsl(${hue}, 70%, 50%)`;

            case 'distance':
                // Color by distance from canvas center
                const distRatio = centroidDist / (Math.sqrt(this.width * this.width + this.height * this.height) / 2);
                const distHue = distRatio * 60;
                return `hsl(${distHue}, 80%, 50%)`;

            case 'gradient':
                // Create gradient effect
                const x = this.seeds[index].x / this.width;
                const y = this.seeds[index].y / this.height;
                const r = Math.floor(x * 255);
                const g = Math.floor(y * 255);
                const b = Math.floor((1 - x) * 255);
                return `rgb(${r}, ${g}, ${b})`;

            default:
                return baseColor;
        }
    }

    // Add a seed
    addSeed(x, y) {
        this.seeds.push({ x, y });
        this.seedColors.push(this.randomColor());
        this.render();
        this.updateStats();
    }

    // Add multiple random seeds
    addRandomSeeds(count) {
        for (let i = 0; i < count; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            this.seeds.push({ x, y });
            this.seedColors.push(this.randomColor());
        }
        this.render();
        this.updateStats();
    }

    // Clear all seeds
    clearSeeds() {
        this.seeds = [];
        this.seedColors = [];
        this.render();
        this.updateStats();
    }

    // Reset with random seeds
    resetRandom(count = 30) {
        this.clearSeeds();
        this.addRandomSeeds(count);
    }

    // Initialize with random points
    initializeWithRandomPoints(count) {
        this.clearSeeds();
        this.addRandomSeeds(count);
    }

    // Find nearest seed for a pixel
    findNearestSeed(x, y) {
        let nearestIndex = 0;
        let nearestDistance = Infinity;

        for (let i = 0; i < this.seeds.length; i++) {
            const distance = this.getDistance(x, y, this.seeds[i].x, this.seeds[i].y);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = i;
            }
        }

        return nearestIndex;
    }

    // Render the Voronoi diagram
    render() {
        if (this.seeds.length === 0) {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, 0, this.width, this.height);
            return;
        }

        const startTime = performance.now();

        // Create image data for pixel manipulation
        const imageData = this.ctx.createImageData(this.width, this.height);
        const data = imageData.data;

        // Reset cell statistics
        this.cellStats.areas = new Array(this.seeds.length).fill(0);

        // Process each pixel
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const nearestSeed = this.findNearestSeed(x, y);
                this.cellStats.areas[nearestSeed]++;

                // Get color for this seed
                const color = this.getSeedColor(nearestSeed, 0, 0);

                // Parse color and set pixel
                const rgb = this.parseColor(color);
                const index = (y * this.width + x) * 4;
                data[index] = rgb.r;
                data[index + 1] = rgb.g;
                data[index + 2] = rgb.b;
                data[index + 3] = 255;
            }
        }

        // Put image data
        this.ctx.putImageData(imageData, 0, 0);

        // Update color mode based on areas if needed
        if (this.colorMode === 'area' || this.colorMode === 'distance') {
            this.updateColorBasedRendering();
        }

        // Draw Voronoi edges
        if (this.showVoronoi) {
            this.drawVoronoiEdges();
        }

        // Draw Delaunay triangulation
        if (this.showDelaunay) {
            this.drawDelaunayEdges();
        }

        // Draw seeds
        if (this.showSeeds) {
            this.drawSeeds();
        }

        // Draw cell areas
        if (this.showCellAreas) {
            this.drawCellAreas();
        }

        const endTime = performance.now();
        document.getElementById('statRenderTime').textContent = `${(endTime - startTime).toFixed(1)}ms`;
    }

    // Parse color string to RGB
    parseColor(color) {
        const tempDiv = document.createElement('div');
        tempDiv.style.color = color;
        document.body.appendChild(tempDiv);
        const computedColor = window.getComputedStyle(tempDiv).color;
        document.body.removeChild(tempDiv);

        const match = computedColor.match(/\d+/g);
        return {
            r: parseInt(match[0]),
            g: parseInt(match[1]),
            b: parseInt(match[2])
        };
    }

    // Update rendering based on cell areas
    updateColorBasedRendering() {
        // Calculate statistics
        this.calculateStats();

        // Re-render with proper colors
        const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const nearestSeed = this.findNearestSeed(x, y);
                const area = this.cellStats.areas[nearestSeed];
                const centroidDist = this.getDistance(
                    x, y,
                    this.seeds[nearestSeed].x,
                    this.seeds[nearestSeed].y
                );

                const color = this.getSeedColor(nearestSeed, area, centroidDist);
                const rgb = this.parseColor(color);

                const index = (y * this.width + x) * 4;
                data[index] = rgb.r;
                data[index + 1] = rgb.g;
                data[index + 2] = rgb.b;
                data[index + 3] = 255;
            }
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    // Draw Voronoi edges using boundary detection
    drawVoronoiEdges() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 1;

        for (let y = 0; y < this.height - 1; y++) {
            for (let x = 0; x < this.width - 1; x++) {
                const current = this.findNearestSeed(x, y);
                const right = this.findNearestSeed(x + 1, y);
                const bottom = this.findNearestSeed(x, y + 1);

                if (current !== right) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, y);
                    this.ctx.lineTo(x + 1, y);
                    this.ctx.stroke();
                }

                if (current !== bottom) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, y);
                    this.ctx.lineTo(x, y + 1);
                    this.ctx.stroke();
                }
            }
        }
    }

    // Draw Delaunay triangulation (dual of Voronoi)
    drawDelaunayEdges() {
        this.ctx.strokeStyle = 'rgba(255, 200, 0, 0.5)';
        this.ctx.lineWidth = 1.5;

        for (let i = 0; i < this.seeds.length; i++) {
            for (let j = i + 1; j < this.seeds.length; j++) {
                if (this.areDelaunayNeighbors(i, j)) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.seeds[i].x, this.seeds[i].y);
                    this.ctx.lineTo(this.seeds[j].x, this.seeds[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }

    // Check if two seeds are Delaunay neighbors
    areDelaunayNeighbors(i, j) {
        // Check if there's a point on the perpendicular bisector
        const midX = (this.seeds[i].x + this.seeds[j].x) / 2;
        const midY = (this.seeds[i].y + this.seeds[j].y) / 2;

        // Sample points along the perpendicular bisector
        const dx = this.seeds[j].y - this.seeds[i].y;
        const dy = this.seeds[i].x - this.seeds[j].x;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len === 0) return false;

        const normalizedDx = dx / len;
        const normalizedDy = dy / len;

        // Check multiple points along the bisector
        for (let t = -50; t <= 50; t += 10) {
            const checkX = midX + normalizedDx * t;
            const checkY = midY + normalizedDy * t;

            if (checkX >= 0 && checkX < this.width && checkY >= 0 && checkY < this.height) {
                const nearest = this.findNearestSeed(checkX, checkY);
                if (nearest !== i && nearest !== j) {
                    return true; // Found a third cell touching the boundary
                }
            }
        }

        return false;
    }

    // Draw seeds
    drawSeeds() {
        for (let i = 0; i < this.seeds.length; i++) {
            // Outer circle
            this.ctx.beginPath();
            this.ctx.arc(this.seeds[i].x, this.seeds[i].y, 6, 0, Math.PI * 2);
            this.ctx.fillStyle = '#fff';
            this.ctx.fill();
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Inner circle with seed color
            this.ctx.beginPath();
            this.ctx.arc(this.seeds[i].x, this.seeds[i].y, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = this.seedColors[i];
            this.ctx.fill();
        }
    }

    // Draw cell areas
    drawCellAreas() {
        this.ctx.font = '12px monospace';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        for (let i = 0; i < this.seeds.length; i++) {
            const area = this.cellStats.areas[i];
            const areaK = (area / 1000).toFixed(1);

            // Offset text from seed
            this.ctx.fillText(
                `${areaK}k`,
                this.seeds[i].x,
                this.seeds[i].y - 15
            );
        }
    }

    // Calculate cell statistics
    calculateStats() {
        if (this.seeds.length === 0) {
            this.cellStats = {
                areas: [],
                totalArea: 0,
                avgArea: 0,
                largestArea: 0,
                smallestArea: Infinity
            };
            return;
        }

        this.cellStats.totalArea = this.cellStats.areas.reduce((a, b) => a + b, 0);
        this.cellStats.avgArea = this.cellStats.totalArea / this.seeds.length;
        this.cellStats.largestArea = Math.max(...this.cellStats.areas);
        this.cellStats.smallestArea = Math.min(...this.cellStats.areas);
    }

    // Update statistics display
    updateStats() {
        this.calculateStats();

        document.getElementById('statCells').textContent = this.seeds.length;
        document.getElementById('statTotalArea').textContent = this.cellStats.totalArea.toLocaleString();
        document.getElementById('statAvgArea').textContent = this.cellStats.avgArea.toFixed(0);
        document.getElementById('statLargest').textContent = this.cellStats.largestArea.toLocaleString();
        document.getElementById('statSmallest').textContent =
            this.cellStats.smallestArea === Infinity ? 0 : this.cellStats.smallestArea.toLocaleString();
    }

    // Lloyd's relaxation - move seeds to centroids of their cells
    lloydRelaxation(iterations = 1) {
        for (let iter = 0; iter < iterations; iter++) {
            // Calculate centroids
            const centroids = [];
            const counts = [];

            for (let i = 0; i < this.seeds.length; i++) {
                centroids.push({ x: 0, y: 0 });
                counts.push(0);
            }

            // Sum up positions for each cell
            for (let y = 0; y < this.height; y += 2) { // Sample every 2nd pixel for speed
                for (let x = 0; x < this.width; x += 2) {
                    const nearestSeed = this.findNearestSeed(x, y);
                    centroids[nearestSeed].x += x;
                    centroids[nearestSeed].y += y;
                    counts[nearestSeed]++;
                }
            }

            // Move seeds to centroids
            for (let i = 0; i < this.seeds.length; i++) {
                if (counts[i] > 0) {
                    this.seeds[i].x = centroids[i].x / counts[i];
                    this.seeds[i].y = centroids[i].y / counts[i];
                }
            }
        }

        this.render();
        this.updateStats();
    }

    // Animate adding points
    async animateAdd(count = 20) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        const delay = 100; // ms between additions

        for (let i = 0; i < count; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            this.addSeed(x, y);
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        this.isAnimating = false;
    }

    // Set distance metric
    setDistanceMetric(metric) {
        this.distanceMetric = metric;
        this.render();
    }

    // Set color mode
    setColorMode(mode) {
        this.colorMode = mode;
        this.render();
    }

    // Toggle display options
    toggleVoronoi(show) {
        this.showVoronoi = show;
        this.render();
    }

    toggleDelaunay(show) {
        this.showDelaunay = show;
        this.render();
    }

    toggleSeeds(show) {
        this.showSeeds = show;
        this.render();
    }

    toggleCellAreas(show) {
        this.showCellAreas = show;
        this.render();
    }

    // Handle canvas click
    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        this.addSeed(x, y);
    }
}

// Initialize simulator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const simulator = new VoronoiSimulator('voronoiCanvas');

    // Point controls
    document.getElementById('add10').addEventListener('click', () => {
        simulator.addRandomSeeds(10);
    });

    document.getElementById('add50').addEventListener('click', () => {
        simulator.addRandomSeeds(50);
    });

    document.getElementById('add100').addEventListener('click', () => {
        simulator.addRandomSeeds(100);
    });

    document.getElementById('clearPoints').addEventListener('click', () => {
        simulator.clearSeeds();
    });

    document.getElementById('randomReset').addEventListener('click', () => {
        simulator.resetRandom(30);
    });

    // Display options
    document.getElementById('showVoronoi').addEventListener('change', (e) => {
        simulator.toggleVoronoi(e.target.checked);
    });

    document.getElementById('showDelaunay').addEventListener('change', (e) => {
        simulator.toggleDelaunay(e.target.checked);
    });

    document.getElementById('showSeeds').addEventListener('change', (e) => {
        simulator.toggleSeeds(e.target.checked);
    });

    document.getElementById('showCellAreas').addEventListener('change', (e) => {
        simulator.toggleCellAreas(e.target.checked);
    });

    // Distance metric
    document.querySelectorAll('input[name="distance"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            simulator.setDistanceMetric(e.target.value);
        });
    });

    // Color mode
    document.getElementById('colorMode').addEventListener('change', (e) => {
        simulator.setColorMode(e.target.value);
    });

    // Animation controls
    document.getElementById('animateAdd').addEventListener('click', () => {
        simulator.animateAdd(20);
    });

    document.getElementById('lloydRelax').addEventListener('click', () => {
        const iterations = parseInt(document.getElementById('relaxIterations').value);
        simulator.lloydRelaxation(iterations);
    });

    document.getElementById('relaxIterations').addEventListener('input', (e) => {
        document.getElementById('iterValue').textContent = e.target.value;
    });

    // Canvas click handler
    document.getElementById('voronoiCanvas').addEventListener('click', (e) => {
        simulator.handleClick(e);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'c') {
            simulator.clearSeeds();
        } else if (e.key === 'r') {
            simulator.resetRandom(30);
        } else if (e.key === 'l') {
            simulator.lloydRelaxation(1);
        }
    });
});

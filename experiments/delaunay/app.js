// Delaunay Triangulation Simulator
// Implements Bowyer-Watson algorithm with constraint optimization visualization

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

class Edge {
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
    }

    equals(other) {
        return (this.p1 === other.p1 && this.p2 === other.p2) ||
               (this.p1 === other.p2 && this.p2 === other.p1);
    }

    length() {
        return this.p1.distanceTo(this.p2);
    }
}

class Triangle {
    constructor(p1, p2, p3) {
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
        this.circumcenter = this.calculateCircumcenter();
        this.circumradius = this.calculateCircumradius();
        this.minAngle = this.calculateMinAngle();
        this.area = this.calculateArea();
    }

    calculateCircumcenter() {
        const ax = this.p1.x, ay = this.p1.y;
        const bx = this.p2.x, by = this.p2.y;
        const cx = this.p3.x, cy = this.p3.y;

        const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
        if (Math.abs(D) < 1e-10) return null; // Collinear points

        const ux = ((ax * ax + ay * ay) * (by - cy) +
                    (bx * bx + by * by) * (cy - ay) +
                    (cx * cx + cy * cy) * (ay - by)) / D;

        const uy = ((ax * ax + ay * ay) * (cx - bx) +
                    (bx * bx + by * by) * (ax - cx) +
                    (cx * cx + cy * cy) * (bx - ax)) / D;

        return new Point(ux, uy);
    }

    calculateCircumradius() {
        if (!this.circumcenter) return Infinity;
        return this.circumcenter.distanceTo(this.p1);
    }

    inCircumcircle(point) {
        if (!this.circumcenter) return false;
        const dist = this.circumcenter.distanceTo(point);
        return dist < this.circumradius - 1e-10;
    }

    hasVertex(point) {
        return this.p1 === point || this.p2 === point || this.p3 === point;
    }

    calculateMinAngle() {
        const angles = this.getAngles();
        return Math.min(...angles);
    }

    calculateArea() {
        const ax = this.p1.x, ay = this.p1.y;
        const bx = this.p2.x, by = this.p2.y;
        const cx = this.p3.x, cy = this.p3.y;

        return Math.abs((ax * (by - cy) + bx * (cy - ay) + cx * (ay - by)) / 2);
    }

    getAngles() {
        const a = this.p2.distanceTo(this.p3);
        const b = this.p1.distanceTo(this.p3);
        const c = this.p1.distanceTo(this.p2);

        // Law of cosines
        const angleA = Math.acos((b * b + c * c - a * a) / (2 * b * c));
        const angleB = Math.acos((a * a + c * c - b * b) / (2 * a * c));
        const angleC = Math.acos((a * a + b * b - c * c) / (2 * a * b));

        return [angleA, angleB, angleC].map(a => a * 180 / Math.PI);
    }

    getEdges() {
        return [
            new Edge(this.p1, this.p2),
            new Edge(this.p2, this.p3),
            new Edge(this.p3, this.p1)
        ];
    }

    getCentroid() {
        return new Point(
            (this.p1.x + this.p2.x + this.p3.x) / 3,
            (this.p1.y + this.p2.y + this.p3.y) / 3
        );
    }
}

class DelaunayTriangulation {
    constructor() {
        this.points = [];
        this.triangles = [];
        this.convexHull = [];
        this.animationSpeed = 50;
        this.isAnimating = false;
    }

    // Add a point and update triangulation
    addPoint(point) {
        this.points.push(point);
        this.triangulate();
        this.updateConvexHull();
    }

    // Main triangulation using Bowyer-Watson algorithm
    triangulate() {
        if (this.points.length < 3) {
            this.triangles = [];
            return;
        }

        // Create super-triangle that encompasses all points
        const bounds = this.getBounds();
        const superTriangle = this.createSuperTriangle(bounds);

        this.triangles = [superTriangle];

        // Incrementally add points
        for (const point of this.points) {
            this.addPointToTriangulation(point);
        }

        // Remove triangles connected to super-triangle vertices
        this.removeSuperTriangle(superTriangle);
    }

    addPointToTriangulation(point) {
        const badTriangles = [];

        // Find triangles whose circumcircle contains the point
        for (const triangle of this.triangles) {
            if (triangle.inCircumcircle(point)) {
                badTriangles.push(triangle);
            }
        }

        // Find boundary of polygonal hole
        const polygon = this.findBoundary(badTriangles);

        // Remove bad triangles
        this.triangles = this.triangles.filter(t => !badTriangles.includes(t));

        // Re-triangulate the hole
        for (let i = 0; i < polygon.length; i++) {
            const edge = polygon[i];
            this.triangles.push(new Triangle(edge.p1, edge.p2, point));
        }
    }

    findBoundary(badTriangles) {
        const polygon = [];
        const edges = [];

        // Collect all edges from bad triangles
        for (const triangle of badTriangles) {
            edges.push(...triangle.getEdges());
        }

        // Find edges that appear only once (boundary edges)
        for (const edge of edges) {
            let count = 0;
            for (const other of edges) {
                if (edge.equals(other)) count++;
            }
            if (count === 1) {
                polygon.push(edge);
            }
        }

        return polygon;
    }

    removeSuperTriangle(superTriangle) {
        this.triangles = this.triangles.filter(t => {
            return !t.hasVertex(superTriangle.p1) &&
                   !t.hasVertex(superTriangle.p2) &&
                   !t.hasVertex(superTriangle.p3);
        });
    }

    createSuperTriangle(bounds) {
        const dx = bounds.maxX - bounds.minX;
        const dy = bounds.maxY - bounds.minY;
        const deltaMax = Math.max(dx, dy) * 2;

        const p1 = new Point(
            bounds.minX - deltaMax,
            bounds.minY - deltaMax
        );
        const p2 = new Point(
            bounds.minX - deltaMax,
            bounds.maxY + deltaMax
        );
        const p3 = new Point(
            bounds.maxX + deltaMax * 3,
            bounds.minY + deltaMax / 2
        );

        return new Triangle(p1, p2, p3);
    }

    getBounds() {
        if (this.points.length === 0) {
            return { minX: 0, maxX: 800, minY: 0, maxY: 600 };
        }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (const point of this.points) {
            minX = Math.min(minX, point.x);
            maxX = Math.max(maxX, point.x);
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }

        return { minX, maxX, minY, maxY };
    }

    // Convex hull using Graham scan
    updateConvexHull() {
        if (this.points.length < 3) {
            this.convexHull = [...this.points];
            return;
        }

        // Sort points by x-coordinate
        const sorted = [...this.points].sort((a, b) => a.x - b.x || a.y - b.y);

        // Build lower hull
        const lower = [];
        for (const point of sorted) {
            while (lower.length >= 2 &&
                   this.cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
                lower.pop();
            }
            lower.push(point);
        }

        // Build upper hull
        const upper = [];
        for (let i = sorted.length - 1; i >= 0; i--) {
            const point = sorted[i];
            while (upper.length >= 2 &&
                   this.cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
                upper.pop();
            }
            upper.push(point);
        }

        // Combine hulls
        upper.pop();
        lower.pop();
        this.convexHull = lower.concat(upper);
    }

    cross(o, a, b) {
        return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    }

    // Statistics
    getStatistics() {
        const vertexCount = this.points.length;
        const triangleCount = this.triangles.length;

        // Get unique edges
        const edgeSet = new Set();
        for (const triangle of this.triangles) {
            const edges = triangle.getEdges();
            for (const edge of edges) {
                const key = `${Math.min(edge.p1.x, edge.p2.x)},${Math.min(edge.p1.y, edge.p2.y)}-${Math.max(edge.p1.x, edge.p2.x)},${Math.max(edge.p1.y, edge.p2.y)}`;
                edgeSet.add(key);
            }
        }
        const edgeCount = edgeSet.size;

        let minAngle = Infinity, maxAngle = -Infinity, totalAngle = 0;
        let angleCount = 0;

        for (const triangle of this.triangles) {
            const angles = triangle.getAngles();
            for (const angle of angles) {
                minAngle = Math.min(minAngle, angle);
                maxAngle = Math.max(maxAngle, angle);
                totalAngle += angle;
                angleCount++;
            }
        }

        const avgAngle = angleCount > 0 ? totalAngle / angleCount : 0;

        return {
            vertexCount,
            triangleCount,
            edgeCount,
            minAngle: minAngle === Infinity ? 0 : minAngle,
            maxAngle: maxAngle === -Infinity ? 0 : maxAngle,
            avgAngle
        };
    }

    getTriangleWithMinAngle() {
        if (this.triangles.length === 0) return null;

        let minTriangle = this.triangles[0];
        let minAngle = minTriangle.minAngle;

        for (const triangle of this.triangles) {
            if (triangle.minAngle < minAngle) {
                minAngle = triangle.minAngle;
                minTriangle = triangle;
            }
        }

        return minTriangle;
    }

    getTriangleWithMaxArea() {
        if (this.triangles.length === 0) return null;

        let maxTriangle = this.triangles[0];
        let maxArea = maxTriangle.area;

        for (const triangle of this.triangles) {
            if (triangle.area > maxArea) {
                maxArea = triangle.area;
                maxTriangle = triangle;
            }
        }

        return maxTriangle;
    }

    clear() {
        this.points = [];
        this.triangles = [];
        this.convexHull = [];
    }
}

class Visualizer {
    constructor(canvas, triangulation) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.triangulation = triangulation;

        // Settings
        this.showTriangles = true;
        this.showCircumcircles = false;
        this.showEdges = true;
        this.showVertices = true;
        this.showConvexHull = false;
        this.highlightMinAngle = false;
        this.highlightMaxArea = false;
        this.colorByQuality = true;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth - 40;
        this.canvas.height = 600;
        this.render();
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw triangles
        if (this.showTriangles) {
            this.drawTriangles();
        }

        // Draw circumcircles
        if (this.showCircumcircles) {
            this.drawCircumcircles();
        }

        // Draw convex hull
        if (this.showConvexHull) {
            this.drawConvexHull();
        }

        // Draw edges
        if (this.showEdges) {
            this.drawEdges();
        }

        // Draw vertices
        if (this.showVertices) {
            this.drawVertices();
        }

        // Draw highlights
        if (this.highlightMinAngle) {
            this.drawHighlightedTriangle(this.triangulation.getTriangleWithMinAngle(), '#ff6b6b');
        }

        if (this.highlightMaxArea) {
            this.drawHighlightedTriangle(this.triangulation.getTriangleWithMaxArea(), '#ffd93d');
        }
    }

    drawTriangles() {
        const ctx = this.ctx;

        for (const triangle of this.triangulation.triangles) {
            let color;

            if (this.colorByQuality) {
                // Color by minimum angle quality
                const minAngle = triangle.minAngle;
                const quality = minAngle / 60; // 60 degrees is ideal
                color = this.getQualityColor(quality);
            } else {
                color = 'rgba(0, 217, 255, 0.1)';
            }

            ctx.fillStyle = color;
            ctx.strokeStyle = color.replace('0.1', '0.3');
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(triangle.p1.x, triangle.p1.y);
            ctx.lineTo(triangle.p2.x, triangle.p2.y);
            ctx.lineTo(triangle.p3.x, triangle.p3.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }

    getQualityColor(quality) {
        // Quality goes from 0 (bad) to 1+ (good)
        const normalized = Math.min(quality, 1);

        // Red (bad) to Green (good)
        const r = Math.floor(255 * (1 - normalized));
        const g = Math.floor(255 * normalized);
        const b = 50;

        return `rgba(${r}, ${g}, ${b}, 0.2)`;
    }

    drawCircumcircles() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        for (const triangle of this.triangulation.triangles) {
            if (triangle.circumcenter && triangle.circumradius < Infinity) {
                ctx.beginPath();
                ctx.arc(
                    triangle.circumcenter.x,
                    triangle.circumcenter.y,
                    triangle.circumradius,
                    0,
                    Math.PI * 2
                );
                ctx.stroke();
            }
        }

        ctx.setLineDash([]);
    }

    drawEdges() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(0, 217, 255, 0.6)';
        ctx.lineWidth = 2;

        for (const triangle of this.triangulation.triangles) {
            const edges = triangle.getEdges();
            for (const edge of edges) {
                ctx.beginPath();
                ctx.moveTo(edge.p1.x, edge.p1.y);
                ctx.lineTo(edge.p2.x, edge.p2.y);
                ctx.stroke();
            }
        }
    }

    drawVertices() {
        const ctx = this.ctx;

        for (const point of this.triangulation.points) {
            // Glow effect
            const gradient = ctx.createRadialGradient(
                point.x, point.y, 0,
                point.x, point.y, 15
            );
            gradient.addColorStop(0, 'rgba(0, 217, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(0, 217, 255, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 217, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 15, 0, Math.PI * 2);
            ctx.fill();

            // Vertex
            ctx.fillStyle = '#00d9ff';
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawConvexHull() {
        const ctx = this.ctx;
        if (this.triangulation.convexHull.length < 3) return;

        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ff6b6b';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(this.triangulation.convexHull[0].x, this.triangulation.convexHull[0].y);

        for (let i = 1; i < this.triangulation.convexHull.length; i++) {
            ctx.lineTo(this.triangulation.convexHull[i].x, this.triangulation.convexHull[i].y);
        }

        ctx.closePath();
        ctx.stroke();

        ctx.shadowBlur = 0;
    }

    drawHighlightedTriangle(triangle, color) {
        if (!triangle) return;

        const ctx = this.ctx;
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.moveTo(triangle.p1.x, triangle.p1.y);
        ctx.lineTo(triangle.p2.x, triangle.p2.y);
        ctx.lineTo(triangle.p3.x, triangle.p3.y);
        ctx.closePath();
        ctx.stroke();

        ctx.shadowBlur = 0;
    }
}

class App {
    constructor() {
        this.canvas = document.getElementById('triangulationCanvas');
        this.triangulation = new DelaunayTriangulation();
        this.visualizer = new Visualizer(this.canvas, this.triangulation);

        this.setupEventListeners();
        this.updateStats();
    }

    setupEventListeners() {
        // Canvas click
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.triangulation.addPoint(new Point(x, y));
            this.visualizer.render();
            this.updateStats();
        });

        // Add random point
        document.getElementById('addRandomBtn').addEventListener('click', () => {
            this.addRandomPoint();
        });

        // Add multiple random points
        document.getElementById('addMultipleBtn').addEventListener('click', () => {
            for (let i = 0; i < 10; i++) {
                this.addRandomPoint();
            }
        });

        // Clear all
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.triangulation.clear();
            this.visualizer.render();
            this.updateStats();
        });

        // Animate construction
        document.getElementById('animateBtn').addEventListener('click', () => {
            this.animateConstruction();
        });

        // Speed slider
        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        speedSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            speedValue.textContent = value;
            this.triangulation.animationSpeed = parseInt(value);
        });

        // Visibility toggles
        document.getElementById('showTriangles').addEventListener('change', (e) => {
            this.visualizer.showTriangles = e.target.checked;
            this.visualizer.render();
        });

        document.getElementById('showCircumcircles').addEventListener('change', (e) => {
            this.visualizer.showCircumcircles = e.target.checked;
            this.visualizer.render();
        });

        document.getElementById('showEdges').addEventListener('change', (e) => {
            this.visualizer.showEdges = e.target.checked;
            this.visualizer.render();
        });

        document.getElementById('showVertices').addEventListener('change', (e) => {
            this.visualizer.showVertices = e.target.checked;
            this.visualizer.render();
        });

        document.getElementById('showConvexHull').addEventListener('change', (e) => {
            this.visualizer.showConvexHull = e.target.checked;
            this.visualizer.render();
        });

        // Highlight toggles
        document.getElementById('highlightMinAngle').addEventListener('change', (e) => {
            this.visualizer.highlightMinAngle = e.target.checked;
            this.visualizer.render();
        });

        document.getElementById('highlightMaxArea').addEventListener('change', (e) => {
            this.visualizer.highlightMaxArea = e.target.checked;
            this.visualizer.render();
        });

        document.getElementById('colorByQuality').addEventListener('change', (e) => {
            this.visualizer.colorByQuality = e.target.checked;
            this.visualizer.render();
        });
    }

    addRandomPoint() {
        const x = Math.random() * (this.canvas.width - 40) + 20;
        const y = Math.random() * (this.canvas.height - 40) + 20;
        this.triangulation.addPoint(new Point(x, y));
        this.visualizer.render();
        this.updateStats();
    }

    async animateConstruction() {
        if (this.triangulation.isAnimating) return;

        const points = [...this.triangulation.points];
        this.triangulation.clear();
        this.visualizer.render();

        this.triangulation.isAnimating = true;
        const delay = Math.max(10, 200 - this.triangulation.animationSpeed * 2);

        for (const point of points) {
            this.triangulation.addPoint(point);
            this.visualizer.render();
            this.updateStats();
            await this.sleep(delay);
        }

        this.triangulation.isAnimating = false;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    updateStats() {
        const stats = this.triangulation.getStatistics();

        document.getElementById('vertexCount').textContent = stats.vertexCount;
        document.getElementById('triangleCount').textContent = stats.triangleCount;
        document.getElementById('edgeCount').textContent = stats.edgeCount;
        document.getElementById('minAngle').textContent =
            stats.minAngle > 0 ? stats.minAngle.toFixed(1) + '°' : '-';
        document.getElementById('avgAngle').textContent =
            stats.avgAngle > 0 ? stats.avgAngle.toFixed(1) + '°' : '-';
        document.getElementById('maxAngle').textContent =
            stats.maxAngle > 0 ? stats.maxAngle.toFixed(1) + '°' : '-';
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});

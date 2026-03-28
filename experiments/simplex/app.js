// 5D Simplex Projection Simulator
// Part of Constraint Theory Research Project

class SimplexSimulator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // State
        this.dimension = 5;
        this.targetDimension = 5;
        this.morphProgress = 0;
        this.vertices = [];
        this.edges = [];
        this.faces = [];
        this.rotationAngles = {};

        // Display settings
        this.showVertices = true;
        this.showEdges = true;
        this.showFaces = true;
        this.showLabels = false;
        this.showRotationPlanes = false;
        this.projectionMode = 'perspective';
        this.autoRotate = false;
        this.morphDimension = false;

        // Camera
        this.cameraDistance = 4;
        this.fieldOfView = 60;

        // Animation
        this.lastTime = 0;
        this.animationId = null;

        // Initialize
        this.initializeRotationAngles();
        this.generateSimplex();
        this.setupRotationControls();
        this.start();
    }

    // Initialize rotation angles for all possible planes
    initializeRotationAngles() {
        for (let i = 0; i < 8; i++) {
            for (let j = i + 1; j < 8; j++) {
                this.rotationAngles[`${i}-${j}`] = 0;
            }
        }
    }

    // Generate N-simplex vertices
    generateSimplex() {
        const n = this.dimension;
        const vertices = [];

        // Generate vertices using standard simplex construction
        // First vertex at origin
        const v0 = new Array(n).fill(0);
        vertices.push(v0);

        // Subsequent vertices along axes
        for (let i = 1; i <= n; i++) {
            const v = new Array(n).fill(0);
            v[i - 1] = 1;
            vertices.push(v);
        }

        // Center the simplex and normalize
        const centroid = this.calculateCentroid(vertices);
        for (let v of vertices) {
            for (let i = 0; i < n; i++) {
                v[i] -= centroid[i];
            }
        }

        // Normalize edge length
        const scale = this.calculateScale(vertices);
        for (let v of vertices) {
            for (let i = 0; i < n; i++) {
                v[i] *= scale;
            }
        }

        this.vertices = vertices;
        this.generateEdges();
        this.generateFaces();
        this.updateInfo();
    }

    // Calculate centroid of vertices
    calculateCentroid(vertices) {
        const n = vertices[0].length;
        const centroid = new Array(n).fill(0);

        for (let v of vertices) {
            for (let i = 0; i < n; i++) {
                centroid[i] += v[i];
            }
        }

        for (let i = 0; i < n; i++) {
            centroid[i] /= vertices.length;
        }

        return centroid;
    }

    // Calculate scale to normalize edge length
    calculateScale(vertices) {
        let totalLength = 0;
        let count = 0;

        for (let i = 0; i < vertices.length; i++) {
            for (let j = i + 1; j < vertices.length; j++) {
                totalLength += this.distance(vertices[i], vertices[j]);
                count++;
            }
        }

        const avgLength = totalLength / count;
        return 1.5 / avgLength; // Target edge length of 1.5
    }

    // Calculate Euclidean distance
    distance(v1, v2) {
        let sum = 0;
        const dim = Math.min(v1.length, v2.length);
        for (let i = 0; i < dim; i++) {
            sum += Math.pow(v1[i] - v2[i], 2);
        }
        return Math.sqrt(sum);
    }

    // Generate all edges (connections between vertices)
    generateEdges() {
        this.edges = [];
        for (let i = 0; i < this.vertices.length; i++) {
            for (let j = i + 1; j < this.vertices.length; j++) {
                this.edges.push([i, j]);
            }
        }
    }

    // Generate all triangular faces
    generateFaces() {
        this.faces = [];
        const n = this.vertices.length;

        // Generate all combinations of 3 vertices
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                for (let k = j + 1; k < n; k++) {
                    this.faces.push([i, j, k]);
                }
            }
        }
    }

    // Setup rotation control sliders
    setupRotationControls() {
        const container = document.getElementById('rotationControls');
        container.innerHTML = '';

        for (let i = 0; i < this.dimension; i++) {
            for (let j = i + 1; j < this.dimension; j++) {
                const planeDiv = document.createElement('div');
                planeDiv.className = 'rotation-plane';
                planeDiv.innerHTML = `
                    <label>Plane ${this.getDimensionName(i)}-${this.getDimensionName(j)}:</label>
                    <input type="range"
                           class="rotation-slider"
                           data-plane="${i}-${j}"
                           min="0"
                           max="360"
                           step="1"
                           value="0">
                    <span class="angle-value">0°</span>
                `;
                container.appendChild(planeDiv);
            }
        }

        // Add event listeners
        container.querySelectorAll('.rotation-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const plane = e.target.dataset.plane;
                const angle = parseFloat(e.target.value);
                this.rotationAngles[plane] = angle * Math.PI / 180;
                e.target.nextElementSibling.textContent = `${angle}°`;
            });
        });
    }

    // Get dimension name
    getDimensionName(index) {
        const names = ['X', 'Y', 'Z', 'W', 'V', 'U', 'T', 'S'];
        return names[index] || `D${index}`;
    }

    // Apply rotation in N-dimensional space
    rotatePoint(point, angles) {
        const result = [...point];

        for (const [plane, angle] of Object.entries(angles)) {
            if (angle === 0) continue;

            const [i, j] = plane.split('-').map(Number);
            if (i >= result.length || j >= result.length) continue;

            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            const xi = result[i];
            const xj = result[j];

            result[i] = xi * cos - xj * sin;
            result[j] = xi * sin + xj * cos;
        }

        return result;
    }

    // Project N-dimensional point to 2D
    projectPoint(point) {
        let x, y, z;

        if (this.projectionMode === 'perspective') {
            // Perspective projection
            const fov = this.fieldOfView * Math.PI / 180;
            const scale = 1 / Math.tan(fov / 2);

            // Handle different dimensions
            if (point.length >= 3) {
                const distance = this.cameraDistance;
                const zDepth = distance - point[2];

                if (point.length >= 4) {
                    // Use 4th dimension for additional perspective effect
                    const wFactor = 1 + point[3] * 0.3;
                    x = (point[0] * scale) / zDepth * wFactor;
                    y = (point[1] * scale) / zDepth * wFactor;
                    z = point[2];
                } else {
                    x = (point[0] * scale) / zDepth;
                    y = (point[1] * scale) / zDepth;
                    z = point[2];
                }
            } else if (point.length === 2) {
                x = point[0];
                y = point[1];
                z = 0;
            } else {
                x = point[0] || 0;
                y = 0;
                z = 0;
            }
        } else {
            // Orthographic projection
            x = point[0] || 0;
            y = point[1] || 0;
            z = point[2] || 0;
        }

        // Convert to canvas coordinates
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const canvasScale = Math.min(this.canvas.width, this.canvas.height) * 0.35;

        return {
            x: centerX + x * canvasScale,
            y: centerY - y * canvasScale,
            z: z
        };
    }

    // Get color based on dimension
    getDimensionColor(vertexIndex) {
        const colors = [
            '#FF6B6B', // Red
            '#4ECDC4', // Teal
            '#45B7D1', // Blue
            '#96CEB4', // Green
            '#FFEAA7', // Yellow
            '#DDA0DD', // Plum
            '#98D8C8', // Mint
            '#F7DC6F'  // Light Yellow
        ];
        return colors[vertexIndex % colors.length];
    }

    // Get face color with transparency
    getFaceColor(faceIndex, total) {
        const hue = (faceIndex / total) * 360;
        return `hsla(${hue}, 70%, 60%, 0.3)`;
    }

    // Draw everything
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0e27';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Transform and project vertices
        const projectedVertices = this.vertices.map(v => {
            const rotated = this.rotatePoint(v, this.rotationAngles);
            return this.projectPoint(rotated);
        });

        // Sort faces by average depth for proper rendering
        const sortedFaces = [...this.faces].map((face, index) => {
            const avgDepth = face.reduce((sum, vi) => sum + projectedVertices[vi].z, 0) / face.length;
            return { face, index, depth: avgDepth };
        }).sort((a, b) => b.depth - a.depth);

        // Draw faces
        if (this.showFaces) {
            sortedFaces.forEach(({ face, index }) => {
                this.drawFace(face, projectedVertices, index);
            });
        }

        // Draw edges
        if (this.showEdges) {
            this.edges.forEach(edge => {
                this.drawEdge(edge, projectedVertices);
            });
        }

        // Draw vertices
        if (this.showVertices) {
            projectedVertices.forEach((pv, i) => {
                this.drawVertex(pv, i);
            });
        }

        // Draw labels
        if (this.showLabels) {
            projectedVertices.forEach((pv, i) => {
                this.drawLabel(pv, i);
            });
        }

        // Draw rotation planes
        if (this.showRotationPlanes) {
            this.drawRotationPlanes();
        }
    }

    // Draw a face
    drawFace(face, projectedVertices, index) {
        this.ctx.beginPath();
        this.ctx.moveTo(projectedVertices[face[0]].x, projectedVertices[face[0]].y);

        for (let i = 1; i < face.length; i++) {
            this.ctx.lineTo(projectedVertices[face[i]].x, projectedVertices[face[i]].y);
        }

        this.ctx.closePath();
        this.ctx.fillStyle = this.getFaceColor(index, this.faces.length);
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    // Draw an edge
    drawEdge(edge, projectedVertices) {
        const v1 = projectedVertices[edge[0]];
        const v2 = projectedVertices[edge[1]];

        // Create gradient for edge
        const gradient = this.ctx.createLinearGradient(v1.x, v1.y, v2.x, v2.y);
        gradient.addColorStop(0, this.getDimensionColor(edge[0]));
        gradient.addColorStop(1, this.getDimensionColor(edge[1]));

        this.ctx.beginPath();
        this.ctx.moveTo(v1.x, v1.y);
        this.ctx.lineTo(v2.x, v2.y);
        this.ctx.strokeStyle = gradient;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    // Draw a vertex
    drawVertex(projectedVertex, index) {
        const x = projectedVertex.x;
        const y = projectedVertex.y;
        const z = projectedVertex.z;

        // Size based on depth
        const size = 6 + z * 2;

        // Glow effect
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size * 2);
        gradient.addColorStop(0, this.getDimensionColor(index));
        gradient.addColorStop(1, 'transparent');

        this.ctx.beginPath();
        this.ctx.arc(x, y, size * 2, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Vertex point
        this.ctx.beginPath();
        this.ctx.arc(x, y, size, 0, Math.PI * 2);
        this.ctx.fillStyle = this.getDimensionColor(index);
        this.ctx.fill();
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    // Draw vertex label
    drawLabel(projectedVertex, index) {
        const x = projectedVertex.x + 15;
        const y = projectedVertex.y - 15;

        this.ctx.font = '14px monospace';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(`V${index}`, x, y);
    }

    // Draw rotation plane indicators
    drawRotationPlanes() {
        const startX = 20;
        let startY = 20;

        this.ctx.font = '12px monospace';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

        for (const [plane, angle] of Object.entries(this.rotationAngles)) {
            if (angle !== 0) {
                const [i, j] = plane.split('-').map(Number);
                if (i < this.dimension && j < this.dimension) {
                    const degrees = Math.round(angle * 180 / Math.PI);
                    this.ctx.fillText(
                        `${this.getDimensionName(i)}-${this.getDimensionName(j)}: ${degrees}°`,
                        startX,
                        startY
                    );
                    startY += 16;
                }
            }
        }
    }

    // Update info panel
    updateInfo() {
        const n = this.dimension;

        document.getElementById('dimensionLabel').textContent = `${n}-Simplex`;
        document.getElementById('vertexCount').textContent =
            `${n + 1} vertices, ${this.edges.length} edges, ${this.faces.length} faces`;

        document.getElementById('propDimension').textContent = n;
        document.getElementById('propVertices').textContent = n + 1;
        document.getElementById('propEdges').textContent = this.edges.length;
        document.getElementById('propFaces').textContent = this.faces.length;
        document.getElementById('propPlanes').textContent = (n * (n - 1)) / 2;
        document.getElementById('propFacets').textContent = n + 1;

        // Update volume formula
        this.updateVolumeFormula();
    }

    // Update volume formula display
    updateVolumeFormula() {
        const n = this.dimension;
        const formulaDiv = document.getElementById('volumeFormula');

        const formulas = {
            2: 'V = (√3 / 4) × a² ≈ 0.433 × a²',
            3: 'V = (√2 / 12) × a³ ≈ 0.118 × a³',
            4: 'V = (√5 / 96) × a⁴ ≈ 0.023 × a⁴',
            5: 'V = (√5 / 96√3) × a⁵ ≈ 0.0147 × a⁵',
            6: 'V = (√3 / 11520) × a⁶ ≈ 0.0017 × a⁶',
            7: 'V = (√7 / 46080) × a⁷ ≈ 0.00016 × a⁷',
            8: 'V = (1 / 10321920) × a⁸ ≈ 0.00000097 × a⁸'
        };

        formulaDiv.textContent = formulas[n] || `V = C(n) × a^${n}`;
    }

    // Set dimension
    setDimension(dim) {
        this.targetDimension = dim;
        if (!this.morphDimension) {
            this.dimension = dim;
            this.generateSimplex();
            this.setupRotationControls();
        }
    }

    // Morph between dimensions
    morphStep(deltaTime) {
        if (!this.morphDimension || this.dimension === this.targetDimension) return;

        this.morphProgress += deltaTime * 0.001;

        if (this.morphProgress >= 1) {
            this.dimension = this.targetDimension;
            this.morphProgress = 0;
            this.generateSimplex();
            this.setupRotationControls();
        }
    }

    // Auto-rotate
    autoRotateStep(deltaTime) {
        if (!this.autoRotate) return;

        const speed = deltaTime * 0.001;

        for (let i = 0; i < this.dimension; i++) {
            for (let j = i + 1; j < this.dimension; j++) {
                const plane = `${i}-${j}`;
                if (this.rotationAngles[plane] !== undefined) {
                    this.rotationAngles[plane] += speed * 0.5;

                    // Update slider if exists
                    const slider = document.querySelector(`[data-plane="${plane}"]`);
                    if (slider) {
                        const degrees = Math.round((this.rotationAngles[plane] % (2 * Math.PI)) * 180 / Math.PI);
                        slider.value = degrees;
                        slider.nextElementSibling.textContent = `${degrees}°`;
                    }
                }
            }
        }
    }

    // Main animation loop
    animate(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.morphStep(deltaTime);
        this.autoRotateStep(deltaTime);
        this.draw();

        this.animationId = requestAnimationFrame((t) => this.animate(t));
    }

    // Start the simulation
    start() {
        if (!this.animationId) {
            this.lastTime = performance.now();
            this.animate(this.lastTime);
        }
    }

    // Stop the simulation
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    // Reset all settings
    reset() {
        this.dimension = 5;
        this.targetDimension = 5;
        this.morphProgress = 0;
        this.initializeRotationAngles();
        this.generateSimplex();
        this.setupRotationControls();
        this.showVertices = true;
        this.showEdges = true;
        this.showFaces = true;
        this.showLabels = false;
        this.showRotationPlanes = false;
        this.projectionMode = 'perspective';
        this.autoRotate = false;
        this.morphDimension = false;
        this.cameraDistance = 4;
        this.fieldOfView = 60;

        // Reset UI controls
        document.getElementById('showVertices').checked = true;
        document.getElementById('showEdges').checked = true;
        document.getElementById('showFaces').checked = true;
        document.getElementById('showLabels').checked = false;
        document.getElementById('showRotationPlanes').checked = false;
        document.getElementById('autoRotate').checked = false;
        document.getElementById('morphDimension').checked = false;
        document.getElementById('cameraDistance').value = 4;
        document.getElementById('fieldOfView').value = 60;
        document.querySelectorAll('.dim-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-dim="5"]').classList.add('active');
    }
}

// Initialize simulator when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('simplexCanvas');
    const simulator = new SimplexSimulator(canvas);

    // Dimension buttons
    document.querySelectorAll('.dim-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.dim-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const dim = parseInt(e.target.dataset.dim);
            simulator.setDimension(dim);
        });
    });

    // Display checkboxes
    document.getElementById('showVertices').addEventListener('change', (e) => {
        simulator.showVertices = e.target.checked;
    });

    document.getElementById('showEdges').addEventListener('change', (e) => {
        simulator.showEdges = e.target.checked;
    });

    document.getElementById('showFaces').addEventListener('change', (e) => {
        simulator.showFaces = e.target.checked;
    });

    document.getElementById('showLabels').addEventListener('change', (e) => {
        simulator.showLabels = e.target.checked;
    });

    document.getElementById('showRotationPlanes').addEventListener('change', (e) => {
        simulator.showRotationPlanes = e.target.checked;
    });

    // Projection mode
    document.querySelectorAll('input[name="projection"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            simulator.projectionMode = e.target.value;
        });
    });

    // Animation controls
    document.getElementById('autoRotate').addEventListener('change', (e) => {
        simulator.autoRotate = e.target.checked;
    });

    document.getElementById('morphDimension').addEventListener('change', (e) => {
        simulator.morphDimension = e.target.checked;
    });

    // Camera controls
    document.getElementById('cameraDistance').addEventListener('input', (e) => {
        simulator.cameraDistance = parseFloat(e.target.value);
    });

    document.getElementById('fieldOfView').addEventListener('input', (e) => {
        simulator.fieldOfView = parseFloat(e.target.value);
    });

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', () => {
        simulator.reset();
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    });

    // Initial resize
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
});

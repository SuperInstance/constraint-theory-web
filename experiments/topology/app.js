// Topology Explorer - Interactive Surface Visualization
// Constraint Theory Research Project

class TopologyExplorer {
    constructor() {
        this.canvas = document.getElementById('topologyCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Camera and view parameters
        this.rotationX = 0.3;
        this.rotationY = 0.5;
        this.zoom = 1.0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.isAnimating = true;

        // Surface parameters
        this.currentSurface = 'torus';
        this.renderMode = 'wireframe';
        this.coloringMode = 'curvature';
        this.resolution = 30;
        this.stretchFactor = 1.0;
        this.twistFactor = 0.0;

        // Surface data
        this.vertices = [];
        this.faces = [];
        this.edges = [];

        // Surface properties
        this.surfaceProperties = {
            torus: {
                name: 'Torus',
                euler: 0,
                genus: 1,
                orientable: true,
                boundary: 0,
                description: 'χ = 0, Genus = 1\nOrientable, No boundary\nCan be deformed into a coffee mug'
            },
            mobius: {
                name: 'Möbius Strip',
                euler: 0,
                genus: 0,
                orientable: false,
                boundary: 1,
                description: 'χ = 0, Genus = 0\nNon-orientable, 1 boundary\nOne-sided surface with half-twist'
            },
            klein: {
                name: 'Klein Bottle',
                euler: 0,
                genus: 1,
                orientable: false,
                boundary: 0,
                description: 'χ = 0, Genus = 1\nNon-orientable, No boundary\nCannot be embedded in 3D without self-intersection'
            },
            sphere: {
                name: 'Sphere',
                euler: 2,
                genus: 0,
                orientable: true,
                boundary: 0,
                description: 'χ = 2, Genus = 0\nOrientable, No boundary\nSimplest closed surface'
            },
            projective: {
                name: 'Projective Plane',
                euler: 1,
                genus: 0,
                orientable: false,
                boundary: 0,
                description: 'χ = 1, Genus = 0\nNon-orientable, No boundary\nCannot be embedded in 3D'
            },
            genus2: {
                name: 'Genus-2 Surface',
                euler: -2,
                genus: 2,
                orientable: true,
                boundary: 0,
                description: 'χ = -2, Genus = 2\nOrientable, No boundary\nTwo-holed torus'
            }
        };

        this.init();
    }

    init() {
        this.resizeCanvas();
        this.generateSurface();
        this.setupEventListeners();
        this.animate();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.render();
        });

        // Mouse interactions
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.onMouseUp());
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e));

        // Touch support
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.onMouseUp());

        // Controls
        document.getElementById('surfaceSelect').addEventListener('change', (e) => {
            this.currentSurface = e.target.value;
            this.generateSurface();
        });

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.renderMode = e.target.dataset.mode;
            });
        });

        document.getElementById('coloringSelect').addEventListener('change', (e) => {
            this.coloringMode = e.target.value;
        });

        document.getElementById('stretchSlider').addEventListener('input', (e) => {
            this.stretchFactor = parseFloat(e.target.value);
            document.getElementById('stretchValue').textContent = this.stretchFactor.toFixed(1);
            this.generateSurface();
        });

        document.getElementById('twistSlider').addEventListener('input', (e) => {
            this.twistFactor = parseFloat(e.target.value);
            document.getElementById('twistValue').textContent = this.twistFactor.toFixed(1);
            this.generateSurface();
        });

        document.getElementById('resolutionSlider').addEventListener('input', (e) => {
            this.resolution = parseInt(e.target.value);
            document.getElementById('resolutionValue').textContent = this.resolution;
            this.generateSurface();
        });

        document.getElementById('cutBtn').addEventListener('click', () => this.cutSurface());
        document.getElementById('unpasteBtn').addEventListener('click', () => this.unpasteSurface());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetSurface());

        document.getElementById('animateBtn').addEventListener('click', (e) => {
            this.isAnimating = !this.isAnimating;
            e.target.textContent = this.isAnimating ? '⏸️ Pause' : '▶️ Auto-Rotate';
            e.target.classList.toggle('active', this.isAnimating);
        });
    }

    // Surface generation methods
    generateSurface() {
        this.vertices = [];
        this.faces = [];
        this.edges = [];

        switch(this.currentSurface) {
            case 'torus':
                this.generateTorus();
                break;
            case 'mobius':
                this.generateMobiusStrip();
                break;
            case 'klein':
                this.generateKleinBottle();
                break;
            case 'sphere':
                this.generateSphere();
                break;
            case 'projective':
                this.generateProjectivePlane();
                break;
            case 'genus2':
                this.generateGenus2();
                break;
        }

        this.updateProperties();
    }

    generateTorus() {
        const R = 2 * this.stretchFactor; // Major radius
        const r = 0.8; // Minor radius
        const uSteps = this.resolution;
        const vSteps = this.resolution;

        for (let i = 0; i <= uSteps; i++) {
            for (let j = 0; j <= vSteps; j++) {
                const u = (i / uSteps) * 2 * Math.PI;
                const v = (j / vSteps) * 2 * Math.PI;

                // Apply twist
                const twist = this.twistFactor * v;

                const x = (R + r * Math.cos(v)) * Math.cos(u + twist);
                const y = (R + r * Math.cos(v)) * Math.sin(u + twist);
                const z = r * Math.sin(v);

                this.vertices.push({ x, y, z, u, v });
            }
        }

        this.generateGridFaces(uSteps, vSteps);
    }

    generateMobiusStrip() {
        const width = 1.5 * this.stretchFactor;
        const radius = 2;
        const uSteps = this.resolution;
        const vSteps = Math.floor(this.resolution / 2);

        for (let i = 0; i <= uSteps; i++) {
            for (let j = 0; j <= vSteps; j++) {
                const u = (i / uSteps) * 2 * Math.PI;
                const v = (j / vSteps) * 2 - 1; // -1 to 1

                const twist = this.twistFactor * u * 0.5;
                const angle = u + twist;

                const x = (radius + v * width * Math.cos(angle / 2)) * Math.cos(angle);
                const y = (radius + v * width * Math.cos(angle / 2)) * Math.sin(angle);
                const z = v * width * Math.sin(angle / 2);

                this.vertices.push({ x, y, z, u, v });
            }
        }

        this.generateGridFaces(uSteps, vSteps);
    }

    generateKleinBottle() {
        const scale = 1.5 * this.stretchFactor;
        const uSteps = this.resolution;
        const vSteps = this.resolution;

        for (let i = 0; i <= uSteps; i++) {
            for (let j = 0; j <= vSteps; j++) {
                const u = (i / uSteps) * 2 * Math.PI;
                const v = (j / vSteps) * 2 * Math.PI;

                const twist = this.twistFactor * 0.5;

                const cosU = Math.cos(u);
                const sinU = Math.sin(u);
                const cosV = Math.cos(v);
                const sinV = Math.sin(v);

                const r = 4 * (1 - cosU / 2);
                const x = scale * (6 * cosU * (1 + sinU) + r * cosU * cosV);
                const y = scale * (16 * sinU + r * cosU * sinV * Math.cos(twist));
                const z = scale * (r * sinU * sinV);

                this.vertices.push({ x, y, z, u, v });
            }
        }

        this.generateGridFaces(uSteps, vSteps);
    }

    generateSphere() {
        const radius = 2 * this.stretchFactor;
        const uSteps = this.resolution;
        const vSteps = this.resolution;

        for (let i = 0; i <= uSteps; i++) {
            for (let j = 0; j <= vSteps; j++) {
                const u = (i / uSteps) * Math.PI; // 0 to π
                const v = (j / vSteps) * 2 * Math.PI; // 0 to 2π

                const twist = this.twistFactor * u;

                const x = radius * Math.sin(u) * Math.cos(v + twist);
                const y = radius * Math.sin(u) * Math.sin(v + twist);
                const z = radius * Math.cos(u);

                this.vertices.push({ x, y, z, u, v });
            }
        }

        this.generateGridFaces(uSteps, vSteps);
    }

    generateProjectivePlane() {
        const scale = 1.5 * this.stretchFactor;
        const uSteps = this.resolution;
        const vSteps = this.resolution;

        for (let i = 0; i <= uSteps; i++) {
            for (let j = 0; j <= vSteps; j++) {
                const u = (i / uSteps) * Math.PI;
                const v = (j / vSteps) * Math.PI;

                const twist = this.twistFactor * 0.5;

                // Boy's surface approximation (immersion of projective plane)
                const cosU = Math.cos(u);
                const sinU = Math.sin(u);
                const cosV = Math.cos(v);
                const sinV = Math.sin(v);

                const x = scale * (2/3) * (cosU * Math.cos(2*v) + Math.sqrt(2) * sinU * cos(v)) * Math.cos(u);
                const y = scale * (2/3) * (cosU * Math.sin(2*v) - Math.sqrt(2) * sinU * sin(v) + twist);
                const z = scale * Math.sqrt(2) * cosU * cosU;

                this.vertices.push({ x, y, z, u, v });
            }
        }

        this.generateGridFaces(uSteps, vSteps);
    }

    generateGenus2() {
        const scale = 1.5 * this.stretchFactor;
        const uSteps = this.resolution;
        const vSteps = this.resolution;

        for (let i = 0; i <= uSteps; i++) {
            for (let j = 0; j <= vSteps; j++) {
                const u = (i / uSteps) * 2 * Math.PI;
                const v = (j / vSteps) * 2 * Math.PI;

                const twist = this.twistFactor * 0.3;

                // Genus-2 surface (two-holed torus approximation)
                const r = 2 + Math.cos(u) * Math.cos(twist);
                const x = scale * r * Math.cos(u);
                const y = scale * r * Math.sin(u);
                const z = scale * Math.sin(v) * (1.5 + Math.cos(u) * 0.5);

                this.vertices.push({ x, y, z, u, v });
            }
        }

        this.generateGridFaces(uSteps, vSteps);
    }

    generateGridFaces(uSteps, vSteps) {
        for (let i = 0; i < uSteps; i++) {
            for (let j = 0; j < vSteps; j++) {
                const idx = i * (vSteps + 1) + j;
                const idx2 = (i + 1) * (vSteps + 1) + j;
                const idx3 = (i + 1) * (vSteps + 1) + (j + 1);
                const idx4 = i * (vSteps + 1) + (j + 1);

                this.faces.push([idx, idx2, idx3]);
                this.faces.push([idx, idx3, idx4]);

                this.edges.push([idx, idx2]);
                this.edges.push([idx2, idx3]);
                this.edges.push([idx3, idx4]);
                this.edges.push([idx4, idx]);
            }
        }
    }

    // 3D projection and rendering
    project(point) {
        const { x, y, z } = point;

        // Apply rotations
        let px = x, py = y, pz = z;

        // Rotate around X axis
        let tempY = py * Math.cos(this.rotationX) - pz * Math.sin(this.rotationX);
        let tempZ = py * Math.sin(this.rotationX) + pz * Math.cos(this.rotationX);
        py = tempY;
        pz = tempZ;

        // Rotate around Y axis
        let tempX = px * Math.cos(this.rotationY) + pz * Math.sin(this.rotationY);
        tempZ = -px * Math.sin(this.rotationY) + pz * Math.cos(this.rotationY);
        px = tempX;
        pz = tempZ;

        // Perspective projection
        const fov = 500;
        const distance = 8;
        const scale = fov / (distance - pz) * this.zoom;

        return {
            x: px * scale + this.canvas.width / 2,
            y: py * scale + this.canvas.height / 2,
            z: pz,
            scale: scale
        };
    }

    getGaussianCurvature(vertex) {
        // Approximate Gaussian curvature based on surface type and position
        const { x, y, z } = vertex;
        const r = Math.sqrt(x * x + y * y + z * z);

        switch(this.currentSurface) {
            case 'torus':
                // Positive on outer rim, negative on inner
                return Math.cos(vertex.v);
            case 'sphere':
                // Constant positive
                return 1.0;
            case 'mobius':
                // Varies across strip
                return Math.sin(vertex.u) * 0.5;
            case 'klein':
            case 'projective':
                // Complex curvature pattern
                return Math.sin(vertex.u) * Math.cos(vertex.v);
            case 'genus2':
                // Multiple saddle points
                return Math.sin(2 * vertex.u) * Math.cos(vertex.v);
            default:
                return 0;
        }
    }

    getColor(vertex) {
        switch(this.coloringMode) {
            case 'curvature':
                const K = this.getGaussianCurvature(vertex);
                // Color by curvature: red (positive) to blue (negative)
                const hue = 240 - (K + 1) * 120; // Map -1..1 to 0..240
                return `hsl(${hue}, 80%, 50%)`;
            case 'solid':
                return '#667eea';
            case 'orientation':
                // Color by orientation (shows non-orientability)
                const orientation = Math.sin(vertex.u * 2 + vertex.v * 2);
                return orientation > 0 ? '#667eea' : '#764ba2';
            default:
                return '#667eea';
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Project all vertices
        const projectedVertices = this.vertices.map(v => this.project(v));

        // Sort faces by average Z depth (painter's algorithm)
        const sortedFaces = this.faces.map((face, idx) => {
            const avgZ = face.reduce((sum, vi) => sum + projectedVertices[vi].z, 0) / face.length;
            return { face, avgZ, idx };
        }).sort((a, b) => b.avgZ - a.avgZ);

        // Render faces first (if in solid or both mode)
        if (this.renderMode === 'solid' || this.renderMode === 'both') {
            sortedFaces.forEach(({ face }) => {
                this.ctx.beginPath();
                const firstVertex = projectedVertices[face[0]];
                this.ctx.moveTo(firstVertex.x, firstVertex.y);

                for (let i = 1; i < face.length; i++) {
                    const vertex = projectedVertices[face[i]];
                    this.ctx.lineTo(vertex.x, vertex.y);
                }
                this.ctx.closePath();

                // Fill with color based on coloring mode
                const centroidVertex = this.vertices[face[0]];
                this.ctx.fillStyle = this.getColor(centroidVertex);
                this.ctx.globalAlpha = 0.6;
                this.ctx.fill();
                this.ctx.globalAlpha = 1.0;
            });
        }

        // Render edges (if in wireframe or both mode)
        if (this.renderMode === 'wireframe' || this.renderMode === 'both') {
            this.ctx.strokeStyle = this.renderMode === 'both' ? 'rgba(255,255,255,0.3)' : '#667eea';
            this.ctx.lineWidth = this.renderMode === 'both' ? 0.5 : 1;

            this.edges.forEach(([i1, i2]) => {
                const v1 = projectedVertices[i1];
                const v2 = projectedVertices[i2];

                this.ctx.beginPath();
                this.ctx.moveTo(v1.x, v1.y);
                this.ctx.lineTo(v2.x, v2.y);
                this.ctx.stroke();
            });
        }

        // Draw vertices (optional, for debugging)
        // projectedVertices.forEach(v => {
        //     this.ctx.beginPath();
        //     this.ctx.arc(v.x, v.y, 2, 0, Math.PI * 2);
        //     this.ctx.fillStyle = '#fff';
        //     this.ctx.fill();
        // });
    }

    updateProperties() {
        const props = this.surfaceProperties[this.currentSurface];

        // Update display with animation
        this.updatePropertyWithAnimation('eulerCharacteristic', props.euler.toString());
        this.updatePropertyWithAnimation('genus', props.genus.toString());
        this.updatePropertyWithAnimation('orientability', props.orientable ? 'Yes' : 'No');
        this.updatePropertyWithAnimation('boundary', props.boundary.toString());

        // Update surface info
        const infoBox = document.getElementById('surfaceInfo');
        infoBox.innerHTML = `
            <p><strong>${props.name}</strong></p>
            <p>χ = ${props.euler}, Genus = ${props.genus}</p>
            <p>${props.orientable ? 'Orientable' : 'Non-orientable'}, ${props.boundary === 0 ? 'No boundary' : props.boundary + ' boundary'}</p>
            <p style="white-space: pre-line">${props.description}</p>
        `;
    }

    updatePropertyWithAnimation(elementId, value) {
        const element = document.getElementById(elementId);
        element.classList.add('updating');
        element.textContent = value;
        setTimeout(() => element.classList.remove('updating'), 500);
    }

    // Topological operations
    cutSurface() {
        // Simulate cutting the surface along a curve
        alert(`Cutting ${this.surfaceProperties[this.currentSurface].name}...\n\nThis demonstrates that cutting can change the topological properties.\n\nFor example:\n- Cutting a torus can create a cylinder\n- Cutting a Möbius strip creates a single longer strip\n- The boundary count increases`);
    }

    unpasteSurface() {
        // Analyze what happens when you "unpaste" the surface
        const props = this.surfaceProperties[this.currentSurface];
        alert(`Unpasting ${props.name}...\n\nEuler Characteristic: χ = ${props.euler}\nFormula: χ = V - E + F\n\nThis invariant remains constant under continuous deformation.\n\nGenus: ${props.genus} "holes"\nOrientable: ${props.orientable ? 'Yes (has two sides)' : 'No (has only one side)'}\nBoundary components: ${props.boundary}`);
    }

    resetSurface() {
        this.rotationX = 0.3;
        this.rotationY = 0.5;
        this.zoom = 1.0;
        this.stretchFactor = 1.0;
        this.twistFactor = 0.0;

        document.getElementById('stretchSlider').value = 1;
        document.getElementById('stretchValue').textContent = '1.0';
        document.getElementById('twistSlider').value = 0;
        document.getElementById('twistValue').textContent = '0.0';

        this.generateSurface();
    }

    // Event handlers
    onMouseDown(e) {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.isAnimating = false;
    }

    onMouseMove(e) {
        if (!this.isDragging) return;

        const deltaX = e.clientX - this.lastMouseX;
        const deltaY = e.clientY - this.lastMouseY;

        this.rotationY += deltaX * 0.01;
        this.rotationX += deltaY * 0.01;

        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }

    onMouseUp() {
        this.isDragging = false;
    }

    onWheel(e) {
        e.preventDefault();
        this.zoom *= e.deltaY > 0 ? 0.95 : 1.05;
        this.zoom = Math.max(0.5, Math.min(3, this.zoom));
    }

    onTouchStart(e) {
        if (e.touches.length === 1) {
            this.isDragging = true;
            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;
            this.isAnimating = false;
        }
    }

    onTouchMove(e) {
        if (!this.isDragging || e.touches.length !== 1) return;
        e.preventDefault();

        const deltaX = e.touches[0].clientX - this.lastMouseX;
        const deltaY = e.touches[0].clientY - this.lastMouseY;

        this.rotationY += deltaX * 0.01;
        this.rotationX += deltaY * 0.01;

        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
    }

    animate() {
        if (this.isAnimating && !this.isDragging) {
            this.rotationY += 0.005;
        }

        this.render();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TopologyExplorer();
});

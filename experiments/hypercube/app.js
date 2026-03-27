/**
 * 4D Hypercube Simulator
 * Constraint Theory Research Project
 *
 * Visualizes 4D polytopes projected into 3D space with interactive rotation controls.
 * Demonstrates how geometric constraints in higher dimensions create new properties.
 */

class HypercubeSimulator {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // 4D rotation angles (in radians)
        this.rotations = {
            xy: 0,
            xz: 0,
            xw: 0,
            yz: 0,
            yw: 0,
            zw: 0
        };

        // Animation state
        this.autoRotate = false;
        this.autoRotate4D = false;
        this.rotationSpeed = 0.02;

        // Current 4D object
        this.currentObject = 'tesseract';
        this.vertices4D = [];
        this.edges = [];
        this.faces = [];
        this.cells = [];

        // 3D objects for rendering
        this.vertexMeshes = [];
        this.edgeLines = [];
        this.faceMeshes = [];
        this.cellMeshes = [];
        this.axesHelpers = [];

        // Visualization options
        this.options = {
            showVertices: true,
            showEdges: true,
            showFaces: false,
            showCells: false,
            showAxes: false,
            depthColoring: true,
            projectionMode: 'perspective',
            wRange: 2.0
        };

        // Colors for depth visualization
        this.colors = {
            near: new THREE.Color(0x0088ff),  // Blue for near (negative W)
            far: new THREE.Color(0xff4400),   // Red for far (positive W)
            vertex: 0xffffff,
            edge: 0x888888
        };

        this.init();
        this.setupEventListeners();
        this.loadObject('tesseract');
        this.animate();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a1a);

        // Camera setup
        const canvas = document.getElementById('hypercube-canvas');
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        this.camera.position.set(4, 3, 5);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Orbit controls
        this.controls = new THREE.OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupEventListeners() {
        // Object selector
        document.getElementById('object-selector').addEventListener('change', (e) => {
            this.loadObject(e.target.value);
        });

        // Projection mode
        document.getElementById('projection-mode').addEventListener('change', (e) => {
            this.options.projectionMode = e.target.value;
            this.updateVisualization();
        });

        // Rotation sliders
        const rotationPlanes = ['xy', 'xz', 'xw', 'yz', 'yw', 'zw'];
        rotationPlanes.forEach(plane => {
            const slider = document.getElementById(`rotation-${plane}`);
            slider.addEventListener('input', (e) => {
                this.rotations[plane] = (e.target.value * Math.PI) / 180;
                document.getElementById(`value-${plane}`).textContent = `${e.target.value}°`;
                this.updateVisualization();
            });
        });

        // Auto-rotate checkbox
        document.getElementById('auto-rotate').addEventListener('change', (e) => {
            this.autoRotate = e.target.checked;
        });

        // Auto-rotate 4D checkbox
        document.getElementById('auto-rotate-4d').addEventListener('change', (e) => {
            this.autoRotate4D = e.target.checked;
        });

        // Rotation speed
        document.getElementById('rotation-speed').addEventListener('input', (e) => {
            this.rotationSpeed = e.target.value / 1000;
            document.getElementById('value-speed').textContent = `${e.target.value}%`;
        });

        // Visual options
        document.getElementById('show-vertices').addEventListener('change', (e) => {
            this.options.showVertices = e.target.checked;
            this.updateVisualization();
        });

        document.getElementById('show-edges').addEventListener('change', (e) => {
            this.options.showEdges = e.target.checked;
            this.updateVisualization();
        });

        document.getElementById('show-faces').addEventListener('change', (e) => {
            this.options.showFaces = e.target.checked;
            this.updateVisualization();
        });

        document.getElementById('show-cells').addEventListener('change', (e) => {
            this.options.showCells = e.target.checked;
            this.updateVisualization();
        });

        document.getElementById('show-axes').addEventListener('change', (e) => {
            this.options.showAxes = e.target.checked;
            this.updateVisualization();
        });

        document.getElementById('depth-coloring').addEventListener('change', (e) => {
            this.options.depthColoring = e.target.checked;
            this.updateVisualization();
        });

        // W range
        document.getElementById('w-range').addEventListener('input', (e) => {
            this.options.wRange = e.target.value / 100;
            document.getElementById('value-w-range').textContent = `±${(this.options.wRange).toFixed(1)}`;
            this.updateVisualization();
        });

        // Reset button
        document.getElementById('reset-rotations').addEventListener('click', () => {
            this.resetRotations();
        });
    }

    loadObject(objectType) {
        this.currentObject = objectType;

        // Clear existing objects
        this.clearVisualization();

        // Load object data
        switch (objectType) {
            case 'tesseract':
                this.loadTesseract();
                break;
            case 'pentachoron':
                this.loadPentachoron();
                break;
            case 'twentyfourcell':
                this.load24Cell();
                break;
            case 'hundredtwentycell':
                this.load120Cell();
                break;
            case 'sixhundredcell':
                this.load600Cell();
                break;
        }

        // Update info panel
        this.updateInfoPanel();

        // Create visualization
        this.createVisualization();
    }

    loadTesseract() {
        // Tesseract vertices: (±1, ±1, ±1, ±1)
        this.vertices4D = [];
        for (let i = 0; i < 16; i++) {
            const x = (i & 1) ? 1 : -1;
            const y = (i & 2) ? 1 : -1;
            const z = (i & 4) ? 1 : -1;
            const w = (i & 8) ? 1 : -1;
            this.vertices4D.push([x, y, z, w]);
        }

        // Tesseract edges: connect vertices that differ in exactly one coordinate
        this.edges = [];
        for (let i = 0; i < 16; i++) {
            for (let j = i + 1; j < 16; j++) {
                const diffs = this.countDiffs(i, j);
                if (diffs === 1) {
                    this.edges.push([i, j]);
                }
            }
        }

        // Tesseract faces: squares (4 vertices)
        this.faces = this.generateTesseractFaces();

        // Tesseract cells: 8 cubes
        this.cells = this.generateTesseractCells();
    }

    countDiffs(i, j) {
        const v1 = this.vertices4D[i];
        const v2 = this.vertices4D[j];
        let diffs = 0;
        for (let k = 0; k < 4; k++) {
            if (v1[k] !== v2[k]) diffs++;
        }
        return diffs;
    }

    generateTesseractFaces() {
        const faces = [];
        // Generate faces for each of the 6 square faces per cube, 8 cubes total
        // Each face is defined by 4 vertices that lie on a plane
        const facePatterns = [
            // Fixed w = -1
            [[0, 1, 3, 2], [0, 1, 5, 4], [0, 2, 6, 4], [1, 3, 7, 5], [2, 3, 7, 6], [4, 5, 7, 6]],
            // Fixed w = 1
            [[8, 9, 11, 10], [8, 9, 13, 12], [8, 10, 14, 12], [9, 11, 15, 13], [10, 11, 15, 14], [12, 13, 15, 14]]
        ];

        facePatterns.forEach(cubeFaces => {
            cubeFaces.forEach(face => {
                faces.push(face);
            });
        });

        return faces;
    }

    generateTesseractCells() {
        // 8 cubes: 2 for each dimension
        const cells = [];

        // w = -1 cube
        cells.push([0, 1, 2, 3, 4, 5, 6, 7]);
        // w = 1 cube
        cells.push([8, 9, 10, 11, 12, 13, 14, 15]);

        return cells;
    }

    loadPentachoron() {
        // Pentachoron (4D simplex) vertices
        // Using golden ratio for proper spacing
        const phi = (1 + Math.sqrt(5)) / 2;
        const scale = 2;

        this.vertices4D = [
            [1, 1, 1, 1],
            [1, -1, -1, 1],
            [-1, 1, -1, 1],
            [-1, -1, 1, 1],
            [0, 0, 0, -1 - Math.sqrt(5)]
        ].map(v => v.map(c => c * scale / 2));

        // Pentachoron edges: all pairs of vertices
        this.edges = [];
        for (let i = 0; i < 5; i++) {
            for (let j = i + 1; j < 5; j++) {
                this.edges.push([i, j]);
            }
        }

        // Pentachoron faces: triangles
        this.faces = [
            [0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3],
            [0, 1, 4], [0, 2, 4], [0, 3, 4], [1, 2, 4],
            [1, 3, 4], [2, 3, 4]
        ];

        // Pentachoron cells: 5 tetrahedra
        this.cells = [
            [0, 1, 2, 3],
            [0, 1, 2, 4],
            [0, 1, 3, 4],
            [0, 2, 3, 4],
            [1, 2, 3, 4]
        ];
    }

    load24Cell() {
        // 24-cell vertices: permutations of (±1, ±1, 0, 0)
        this.vertices4D = [];

        // Generate all permutations of (±1, ±1, 0, 0)
        const signs = [-1, 1];
        const positions = [
            [1, 1, 0, 0],
            [1, 0, 1, 0],
            [1, 0, 0, 1],
            [0, 1, 1, 0],
            [0, 1, 0, 1],
            [0, 0, 1, 1]
        ];

        positions.forEach(pos => {
            signs.forEach(s1 => {
                signs.forEach(s2 => {
                    this.vertices4D.push([
                        pos[0] * s1,
                        pos[1] * s2,
                        pos[2],
                        pos[3]
                    ]);
                });
            });
        });

        // Remove duplicates
        this.vertices4D = this.removeDuplicates(this.vertices4D);

        // Generate edges (connect vertices at distance sqrt(2))
        this.edges = [];
        for (let i = 0; i < this.vertices4D.length; i++) {
            for (let j = i + 1; j < this.vertices4D.length; j++) {
                if (this.distance4D(i, j) < 2.1) { // sqrt(2) ≈ 1.414
                    this.edges.push([i, j]);
                }
            }
        }

        // Simplified faces (triangles)
        this.faces = [];
        for (let i = 0; i < this.edges.length; i++) {
            for (let j = i + 1; j < this.edges.length; j++) {
                const [a, b] = this.edges[i];
                const [c, d] = this.edges[j];
                const unique = [...new Set([a, b, c, d])];
                if (unique.length === 3) {
                    this.faces.push(unique);
                }
            }
        }

        // Remove duplicate faces
        this.faces = this.removeDuplicateFaces(this.faces);

        // Simplified cells
        this.cells = [];
    }

    load120Cell() {
        // Simplified 120-cell - subset of vertices
        // Full 120-cell has 600 vertices, using subset for performance
        this.vertices4D = [];

        // Use some vertices from 600-cell (scaled)
        const scale = 0.8;
        const goldenRatio = (1 + Math.sqrt(5)) / 2;

        // Generate vertices using golden ratio
        for (let i = 0; i < 60; i++) {
            const angle1 = (i * Math.PI * 2) / 60;
            const angle2 = (i * Math.PI) / 30;

            this.vertices4D.push([
                Math.cos(angle1) * scale,
                Math.sin(angle1) * scale,
                Math.cos(angle2) * scale,
                Math.sin(angle2) * scale
            ]);
        }

        // Generate edges
        this.edges = [];
        for (let i = 0; i < this.vertices4D.length; i++) {
            for (let j = i + 1; j < this.vertices4D.length; j++) {
                if (this.distance4D(i, j) < 1.5) {
                    this.edges.push([i, j]);
                }
            }
        }

        this.faces = [];
        this.cells = [];
    }

    load600Cell() {
        // Simplified 600-cell - subset of vertices
        // Full 600-cell has 120 vertices
        this.vertices4D = [];

        const scale = 1.2;

        // Generate vertices
        for (let i = 0; i < 40; i++) {
            const angle1 = (i * Math.PI * 2) / 40;
            const angle2 = (i * Math.PI) / 20;

            this.vertices4D.push([
                Math.cos(angle1) * scale,
                Math.sin(angle1) * scale,
                Math.cos(angle2) * scale * 0.5,
                Math.sin(angle2) * scale * 0.5
            ]);
        }

        // Generate edges
        this.edges = [];
        for (let i = 0; i < this.vertices4D.length; i++) {
            for (let j = i + 1; j < this.vertices4D.length; j++) {
                if (this.distance4D(i, j) < 2.0) {
                    this.edges.push([i, j]);
                }
            }
        }

        this.faces = [];
        this.cells = [];
    }

    removeDuplicates(arr) {
        const seen = new Set();
        return arr.filter(v => {
            const key = v.join(',');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    removeDuplicateFaces(faces) {
        const normalized = faces.map(f => f.sort().join(','));
        const seen = new Set();
        return faces.filter((_, i) => {
            if (seen.has(normalized[i])) return false;
            seen.add(normalized[i]);
            return true;
        });
    }

    distance4D(i, j) {
        const v1 = this.vertices4D[i];
        const v2 = this.vertices4D[j];
        let sum = 0;
        for (let k = 0; k < 4; k++) {
            sum += (v1[k] - v2[k]) ** 2;
        }
        return Math.sqrt(sum);
    }

    apply4DRotation(vertex) {
        let [x, y, z, w] = vertex;

        // Apply rotations in all 6 planes
        // XY plane
        [x, y] = this.rotate2D(x, y, this.rotations.xy);
        // XZ plane
        [x, z] = this.rotate2D(x, z, this.rotations.xz);
        // XW plane
        [x, w] = this.rotate2D(x, w, this.rotations.xw);
        // YZ plane
        [y, z] = this.rotate2D(y, z, this.rotations.yz);
        // YW plane
        [y, w] = this.rotate2D(y, w, this.rotations.yw);
        // ZW plane
        [z, w] = this.rotate2D(z, w, this.rotations.zw);

        return [x, y, z, w];
    }

    rotate2D(a, b, angle) {
        return [
            a * Math.cos(angle) - b * Math.sin(angle),
            a * Math.sin(angle) + b * Math.cos(angle)
        ];
    }

    project4Dto3D(vertex4D) {
        const [x, y, z, w] = vertex4D;
        const distance = 3; // Distance from 4D camera
        const wRange = this.options.wRange;

        let x3D, y3D, z3D;

        switch (this.options.projectionMode) {
            case 'perspective':
                // Perspective projection
                const wFactor = distance / (distance - w);
                x3D = x * wFactor;
                y3D = y * wFactor;
                z3D = z * wFactor;
                break;

            case 'orthographic':
                // Orthographic projection (just drop W)
                x3D = x;
                y3D = y;
                z3D = z;
                break;

            case 'stereographic':
                // Stereographic projection
                const denom = distance - w;
                x3D = (x * distance) / denom;
                y3D = (y * distance) / denom;
                z3D = (z * distance) / denom;
                break;

            default:
                x3D = x;
                y3D = y;
                z3D = z;
        }

        return { x: x3D, y: y3D, z: z3D, w: w };
    }

    getColorForDepth(w) {
        if (!this.options.depthColoring) {
            return this.colors.edge;
        }

        // Normalize W to [0, 1]
        const normalized = (w + this.options.wRange) / (2 * this.options.wRange);
        const clamped = Math.max(0, Math.min(1, normalized));

        return this.colors.near.clone().lerp(this.colors.far, clamped);
    }

    createVisualization() {
        this.clearVisualization();

        // Transform and project vertices
        const projectedVertices = this.vertices4D.map(v => {
            const rotated = this.apply4DRotation(v);
            return this.project4Dto3D(rotated);
        });

        // Create vertices
        if (this.options.showVertices) {
            this.createVertices(projectedVertices);
        }

        // Create edges
        if (this.options.showEdges) {
            this.createEdges(projectedVertices);
        }

        // Create faces
        if (this.options.showFaces && this.faces.length > 0) {
            this.createFaces(projectedVertices);
        }

        // Create cells
        if (this.options.showCells && this.cells.length > 0) {
            this.createCells(projectedVertices);
        }

        // Create axes
        if (this.options.showAxes) {
            this.createAxes();
        }
    }

    createVertices(projectedVertices) {
        const geometry = new THREE.SphereGeometry(0.05, 16, 16);

        projectedVertices.forEach((v, i) => {
            const color = this.getColorForDepth(v.w);
            const material = new THREE.MeshBasicMaterial({
                color: this.options.depthColoring ? color : this.colors.vertex
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(v.x, v.y, v.z);

            this.scene.add(mesh);
            this.vertexMeshes.push(mesh);
        });
    }

    createEdges(projectedVertices) {
        this.edges.forEach(edge => {
            const [i, j] = edge;
            const v1 = projectedVertices[i];
            const v2 = projectedVertices[j];

            const avgW = (v1.w + v2.w) / 2;
            const color = this.getColorForDepth(avgW);

            const material = new THREE.LineBasicMaterial({
                color: this.options.depthColoring ? color : this.colors.edge,
                linewidth: 2
            });

            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(v1.x, v1.y, v1.z),
                new THREE.Vector3(v2.x, v2.y, v2.z)
            ]);

            const line = new THREE.Line(geometry, material);
            this.scene.add(line);
            this.edgeLines.push(line);
        });
    }

    createFaces(projectedVertices) {
        this.faces.forEach(face => {
            if (face.length < 3) return;

            const points = face.map(i => {
                const v = projectedVertices[i];
                return new THREE.Vector3(v.x, v.y, v.z);
            });

            // Calculate normal for face
            const normal = new THREE.Vector3();
            const v0 = points[0];
            const v1 = points[1];
            const v2 = points[2];

            const edge1 = new THREE.Vector3().subVectors(v1, v0);
            const edge2 = new THREE.Vector3().subVectors(v2, v0);
            normal.crossVectors(edge1, edge2).normalize();

            // Calculate average W for transparency
            const avgW = face.reduce((sum, i) => sum + projectedVertices[i].w, 0) / face.length;
            const normalizedW = (avgW + this.options.wRange) / (2 * this.options.wRange);
            const opacity = 0.1 + normalizedW * 0.3;

            const geometry = new THREE.BufferGeometry().setFromPoints(points);

            // Create face indices
            const indices = [];
            for (let i = 1; i < points.length - 1; i++) {
                indices.push(0, i, i + 1);
            }

            geometry.setIndex(indices);
            geometry.computeVertexNormals();

            const color = this.getColorForDepth(avgW);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: opacity,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geometry, material);
            this.scene.add(mesh);
            this.faceMeshes.push(mesh);
        });
    }

    createCells(projectedVertices) {
        // Simplified cell visualization
        this.cells.forEach(cell => {
            const points = cell.map(i => {
                const v = projectedVertices[i];
                return new THREE.Vector3(v.x, v.y, v.z);
            });

            // Create convex hull
            const avgW = cell.reduce((sum, i) => sum + projectedVertices[i].w, 0) / cell.length;
            const color = this.getColorForDepth(avgW);

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.PointsMaterial({
                color: color,
                size: 0.02,
                transparent: true,
                opacity: 0.5
            });

            const pointsMesh = new THREE.Points(geometry, material);
            this.scene.add(pointsMesh);
            this.cellMeshes.push(pointsMesh);
        });
    }

    createAxes() {
        const axisLength = 2;
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00]; // X, Y, Z, W
        const labels = ['X', 'Y', 'Z', 'W'];

        for (let i = 0; i < 4; i++) {
            const direction = new THREE.Vector4();
            direction.setComponent(i, 1);

            // Project 4D axis to 3D
            const start4D = [0, 0, 0, 0];
            const end4D = [0, 0, 0, 0];
            end4D[i] = axisLength;

            const start3D = this.project4Dto3D(start4D);
            const end3D = this.project4Dto3D(end4D);

            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(start3D.x, start3D.y, start3D.z),
                new THREE.Vector3(end3D.x, end3D.y, end3D.z)
            ]);

            const material = new THREE.LineBasicMaterial({
                color: colors[i],
                linewidth: 2
            });

            const line = new THREE.Line(geometry, material);
            this.scene.add(line);
            this.axesHelpers.push(line);
        }
    }

    clearVisualization() {
        // Remove all visualization objects
        this.vertexMeshes.forEach(mesh => this.scene.remove(mesh));
        this.edgeLines.forEach(line => this.scene.remove(line));
        this.faceMeshes.forEach(mesh => this.scene.remove(mesh));
        this.cellMeshes.forEach(mesh => this.scene.remove(mesh));
        this.axesHelpers.forEach(helper => this.scene.remove(helper));

        this.vertexMeshes = [];
        this.edgeLines = [];
        this.faceMeshes = [];
        this.cellMeshes = [];
        this.axesHelpers = [];
    }

    updateVisualization() {
        this.createVisualization();
    }

    updateInfoPanel() {
        document.getElementById('vertex-count').textContent = this.vertices4D.length;
        document.getElementById('edge-count').textContent = this.edges.length;
        document.getElementById('face-count').textContent = this.faces.length;
        document.getElementById('cell-count').textContent = this.cells.length;

        // Calculate Euler characteristic: V - E + F - C
        const euler = this.vertices4D.length - this.edges.length +
                      this.faces.length - this.cells.length;
        document.getElementById('euler-characteristic').textContent = euler;
    }

    resetRotations() {
        this.rotations = {
            xy: 0,
            xz: 0,
            xw: 0,
            yz: 0,
            yw: 0,
            zw: 0
        };

        // Reset sliders
        const rotationPlanes = ['xy', 'xz', 'xw', 'yz', 'yw', 'zw'];
        rotationPlanes.forEach(plane => {
            document.getElementById(`rotation-${plane}`).value = 0;
            document.getElementById(`value-${plane}`).textContent = '0°';
        });

        this.updateVisualization();
    }

    onWindowResize() {
        const canvas = document.getElementById('hypercube-canvas');
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Auto-rotate
        if (this.autoRotate) {
            this.controls.autoRotate = true;
            this.controls.autoRotateSpeed = this.rotationSpeed * 100;
        } else {
            this.controls.autoRotate = false;
        }

        // Auto-rotate 4D
        if (this.autoRotate4D) {
            const planes = ['xy', 'xz', 'xw', 'yz', 'yw', 'zw'];
            planes.forEach(plane => {
                this.rotations[plane] += this.rotationSpeed;

                // Update slider
                const degrees = Math.round((this.rotations[plane] * 180) / Math.PI) % 360;
                document.getElementById(`rotation-${plane}`).value = degrees;
                document.getElementById(`value-${plane}`).textContent = `${degrees}°`;
            });

            this.updateVisualization();
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the simulator when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new HypercubeSimulator();
});

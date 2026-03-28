// Discrete Holonomy Simulator
// Constraint Theory Research Project

class HolonomySimulator {
    constructor() {
        this.canvas = document.getElementById('holonomyCanvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
        this.controls = null;

        // Simulation state
        this.currentSolid = 'tetrahedron';
        this.currentPath = 'triangular';
        this.animationSpeed = 1.0;
        this.vectorSize = 1.0;
        this.isAnimating = true;
        this.autoRotate = false;
        this.transportProgress = 0;

        // Three.js objects
        this.solidMesh = null;
        this.pathLine = null;
        this.transportVector = null;
        this.holonomyArc = null;
        this.particleSystem = null;
        this.gridHelper = null;

        // Holonomy data
        this.holonomyAngle = 0;
        this.pathVertices = [];

        // Platonic solid data
        this.solidData = {
            tetrahedron: {
                name: 'Tetrahedron',
                symmetry: 'T<sub>d</sub>',
                faces: 4,
                edges: 6,
                vertices: 4,
                curvature: 'Positive',
                holonomy: 120 // degrees
            },
            cube: {
                name: 'Cube',
                symmetry: 'O<sub>h</sub>',
                faces: 6,
                edges: 12,
                vertices: 8,
                curvature: 'Flat (zero)',
                holonomy: 90 // degrees
            },
            octahedron: {
                name: 'Octahedron',
                symmetry: 'O<sub>h</sub>',
                faces: 8,
                edges: 12,
                vertices: 6,
                curvature: 'Positive',
                holonomy: 120 // degrees
            },
            dodecahedron: {
                name: 'Dodecahedron',
                symmetry: 'I<sub>h</sub>',
                faces: 12,
                edges: 30,
                vertices: 20,
                curvature: 'Positive',
                holonomy: 72 // degrees
            },
            icosahedron: {
                name: 'Icosahedron',
                symmetry: 'I<sub>h</sub>',
                faces: 20,
                edges: 30,
                vertices: 12,
                curvature: 'Positive',
                holonomy: 60 // degrees
            }
        };

        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x0a0a0f, 1);

        // Setup camera
        this.camera.position.set(4, 3, 5);
        this.camera.lookAt(0, 0, 0);

        // Setup controls
        this.controls = new THREE.OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Setup scene
        this.setupScene();

        // Create initial solid
        this.createSolid(this.currentSolid);

        // Setup event listeners
        this.setupEventListeners();

        // Start animation loop
        this.animate();
    }

    setupScene() {
        // Background grid
        this.gridHelper = new THREE.GridHelper(10, 20, 0x2a2a3a, 0x1a1a25);
        this.gridHelper.position.y = -2;
        this.scene.add(this.gridHelper);

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);

        // Point lights
        const pointLight1 = new THREE.PointLight(0x4466ff, 1, 100);
        pointLight1.position.set(5, 5, 5);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x44aaff, 0.5, 100);
        pointLight2.position.set(-5, -5, -5);
        this.scene.add(pointLight2);
    }

    createSolid(type) {
        // Remove existing solid
        if (this.solidMesh) {
            this.scene.remove(this.solidMesh);
        }

        let geometry;
        const material = new THREE.MeshBasicMaterial({
            color: 0x4466ff,
            wireframe: true,
            transparent: true,
            opacity: 0.8
        });

        switch(type) {
            case 'tetrahedron':
                geometry = new THREE.TetrahedronGeometry(1.5);
                break;
            case 'cube':
                geometry = new THREE.BoxGeometry(2, 2, 2);
                break;
            case 'octahedron':
                geometry = new THREE.OctahedronGeometry(1.5);
                break;
            case 'dodecahedron':
                geometry = new THREE.DodecahedronGeometry(1.5);
                break;
            case 'icosahedron':
                geometry = new THREE.IcosahedronGeometry(1.5);
                break;
            default:
                geometry = new THREE.TetrahedronGeometry(1.5);
        }

        this.solidMesh = new THREE.Mesh(geometry, material);

        // Add glowing edges
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x4466ff,
            linewidth: 2,
            transparent: true,
            opacity: 0.9
        });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        this.solidMesh.add(wireframe);

        this.scene.add(this.solidMesh);
        this.currentSolid = type;

        // Update symmetry information
        this.updateSymmetryInfo();

        // Create transport path
        this.createTransportPath();
    }

    createTransportPath() {
        // Remove existing path
        if (this.pathLine) {
            this.scene.remove(this.pathLine);
        }

        // Generate path vertices based on solid and path type
        this.pathVertices = this.generatePathVertices();

        // Create path line
        const pathGeometry = new THREE.BufferGeometry().setFromPoints(this.pathVertices);
        const pathMaterial = new THREE.LineBasicMaterial({
            color: 0x44aaff,
            linewidth: 3,
            transparent: true,
            opacity: 0.8
        });
        this.pathLine = new THREE.Line(pathGeometry, pathMaterial);
        this.scene.add(this.pathLine);

        // Create transport vector
        this.createTransportVector();

        // Create holonomy visualization
        this.createHolonomyArc();

        // Create particle system
        if (document.getElementById('showParticles').checked) {
            this.createParticleSystem();
        }
    }

    generatePathVertices() {
        const vertices = [];
        const size = 1.5;

        switch(this.currentPath) {
            case 'triangular':
                // Triangular loop
                vertices.push(new THREE.Vector3(size, 0, 0));
                vertices.push(new THREE.Vector3(-size/2, size*0.866, 0));
                vertices.push(new THREE.Vector3(-size/2, -size*0.866, 0));
                vertices.push(new THREE.Vector3(size, 0, 0)); // Close loop
                this.holonomyAngle = this.solidData[this.currentSolid].holonomy;
                break;

            case 'square':
                // Square loop
                vertices.push(new THREE.Vector3(size, size, 0));
                vertices.push(new THREE.Vector3(-size, size, 0));
                vertices.push(new THREE.Vector3(-size, -size, 0));
                vertices.push(new THREE.Vector3(size, -size, 0));
                vertices.push(new THREE.Vector3(size, size, 0)); // Close loop
                this.holonomyAngle = 90;
                break;

            case 'pentagonal':
                // Pentagonal loop
                for (let i = 0; i <= 5; i++) {
                    const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                    vertices.push(new THREE.Vector3(
                        size * Math.cos(angle),
                        size * Math.sin(angle),
                        0
                    ));
                }
                this.holonomyAngle = 72;
                break;

            case 'face':
                // Face boundary (adapted to solid)
                return this.generateFacePath();
        }

        return vertices;
    }

    generateFacePath() {
        const vertices = [];
        const size = 1.5;

        switch(this.currentSolid) {
            case 'tetrahedron':
                // Triangular face
                vertices.push(new THREE.Vector3(size, 0, 0));
                vertices.push(new THREE.Vector3(-size/2, size*0.866, 0));
                vertices.push(new THREE.Vector3(-size/2, -size*0.866, 0));
                vertices.push(new THREE.Vector3(size, 0, 0));
                break;

            case 'cube':
                // Square face
                vertices.push(new THREE.Vector3(size, size, size));
                vertices.push(new THREE.Vector3(-size, size, size));
                vertices.push(new THREE.Vector3(-size, -size, size));
                vertices.push(new THREE.Vector3(size, -size, size));
                vertices.push(new THREE.Vector3(size, size, size));
                break;

            case 'octahedron':
                // Triangular face
                vertices.push(new THREE.Vector3(size, 0, 0));
                vertices.push(new THREE.Vector3(0, size, 0));
                vertices.push(new THREE.Vector3(0, 0, size));
                vertices.push(new THREE.Vector3(size, 0, 0));
                break;

            case 'dodecahedron':
                // Pentagonal face approximation
                for (let i = 0; i <= 5; i++) {
                    const angle = (i * 2 * Math.PI) / 5;
                    vertices.push(new THREE.Vector3(
                        size * Math.cos(angle),
                        size * Math.sin(angle),
                        size
                    ));
                }
                break;

            case 'icosahedron':
                // Triangular face
                vertices.push(new THREE.Vector3(size, 0, size*0.5));
                vertices.push(new THREE.Vector3(0, size, size*0.5));
                vertices.push(new THREE.Vector3(0, 0, size*1.5));
                vertices.push(new THREE.Vector3(size, 0, size*0.5));
                break;
        }

        this.holonomyAngle = this.solidData[this.currentSolid].holonomy;
        return vertices;
    }

    createTransportVector() {
        // Remove existing vector
        if (this.transportVector) {
            this.scene.remove(this.transportVector);
        }

        // Create arrow helper
        const startPoint = this.pathVertices[0];
        const direction = new THREE.Vector3(1, 0, 0);
        const length = 0.5 * this.vectorSize;
        const color = 0x44ff88;

        this.transportVector = new THREE.ArrowHelper(
            direction,
            startPoint,
            length,
            color,
            0.15 * this.vectorSize,
            0.1 * this.vectorSize
        );

        this.scene.add(this.transportVector);
    }

    createHolonomyArc() {
        // Remove existing arc
        if (this.holonomyArc) {
            this.scene.remove(this.holonomyArc);
        }

        // Create arc to show holonomy gap
        const curve = new THREE.EllipseCurve(
            0, 0,            // ax, aY
            0.3 * this.vectorSize, 0.3 * this.vectorSize, // xRadius, yRadius
            0, Math.PI * this.holonomyAngle / 180,  // aStartAngle, aEndAngle
            false,            // aClockwise
            0                 // aRotation
        );

        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        // Rotate to match starting point
        geometry.rotateZ(Math.PI / 2);

        const material = new THREE.LineBasicMaterial({
            color: 0xff4466,
            linewidth: 3,
            transparent: true,
            opacity: 0.8
        });

        this.holonomyArc = new THREE.Line(geometry, material);
        this.holonomyArc.position.copy(this.pathVertices[0]);
        this.scene.add(this.holonomyArc);
    }

    createParticleSystem() {
        // Remove existing particles
        if (this.particleSystem) {
            this.scene.remove(this.particleSystem);
        }

        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            const t = Math.random();
            const pathIndex = Math.floor(t * (this.pathVertices.length - 1));
            const nextIndex = (pathIndex + 1) % this.pathVertices.length;

            const start = this.pathVertices[pathIndex];
            const end = this.pathVertices[nextIndex];
            const localT = (t * (this.pathVertices.length - 1)) % 1;

            positions[i] = start.x + (end.x - start.x) * localT;
            positions[i + 1] = start.y + (end.y - start.y) * localT;
            positions[i + 2] = start.z + (end.z - start.z) * localT;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x4466ff,
            size: 0.05,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        this.particleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);
    }

    updateTransportVector() {
        if (!this.isAnimating || !this.transportVector || this.pathVertices.length < 2) return;

        // Update transport progress
        this.transportProgress += 0.005 * this.animationSpeed;
        if (this.transportProgress >= 1) {
            this.transportProgress = 0;
        }

        // Calculate current position along path
        const totalSegments = this.pathVertices.length - 1;
        const currentSegment = Math.floor(this.transportProgress * totalSegments);
        const segmentProgress = (this.transportProgress * totalSegments) % 1;

        const startIndex = currentSegment % totalSegments;
        const endIndex = (startIndex + 1) % totalSegments;

        const startPos = this.pathVertices[startIndex];
        const endPos = this.pathVertices[endIndex];

        // Interpolate position
        const currentPos = new THREE.Vector3().lerpVectors(startPos, endPos, segmentProgress);

        // Calculate tangent direction (parallel transport)
        const tangent = new THREE.Vector3().subVectors(endPos, startPos).normalize();

        // Update vector position
        this.transportVector.position.copy(currentPos);

        // Update vector direction (parallel transport along path)
        const baseDirection = new THREE.Vector3(1, 0, 0);
        const rotationAxis = new THREE.Vector3(0, 0, 1);

        // Rotate direction based on path curvature
        const angle = this.transportProgress * Math.PI * 2 * (this.holonomyAngle / 360);
        baseDirection.applyAxisAngle(rotationAxis, angle);

        this.transportVector.setDirection(baseDirection);

        // Update holonomy display
        this.updateHolonomyDisplay();
    }

    updateHolonomyDisplay() {
        const angleDisplay = document.getElementById('holonomyAngle');
        const statusDisplay = document.getElementById('holonomyStatus');

        angleDisplay.textContent = this.holonomyAngle.toFixed(2);

        if (this.holonomyAngle < 0.1) {
            statusDisplay.textContent = 'Closed Loop (Zero Holonomy)';
            statusDisplay.style.color = '#44ff88';
        } else {
            statusDisplay.textContent = `Holonomy Gap: ${this.holonomyAngle.toFixed(1)}°`;
            statusDisplay.style.color = '#ff4466';
        }
    }

    updateSymmetryInfo() {
        const data = this.solidData[this.currentSolid];
        document.getElementById('solidName').textContent = data.name;
        document.getElementById('symmetryGroup').innerHTML = data.symmetry;
        document.getElementById('faceCount').textContent = data.faces;
        document.getElementById('edgeCount').textContent = data.edges;
        document.getElementById('vertexCount').textContent = data.vertices;
        document.getElementById('curvature').textContent = data.curvature;
    }

    setupEventListeners() {
        // Solid type selector
        document.getElementById('solidType').addEventListener('change', (e) => {
            this.createSolid(e.target.value);
        });

        // Path type selector
        document.getElementById('pathType').addEventListener('change', (e) => {
            this.currentPath = e.target.value;
            this.createTransportPath();
        });

        // Checkboxes
        document.getElementById('showPath').addEventListener('change', (e) => {
            if (this.pathLine) this.pathLine.visible = e.target.checked;
        });

        document.getElementById('showVectors').addEventListener('change', (e) => {
            if (this.transportVector) this.transportVector.visible = e.target.checked;
            if (this.holonomyArc) this.holonomyArc.visible = e.target.checked;
        });

        document.getElementById('showHolonomy').addEventListener('change', (e) => {
            if (this.holonomyArc) this.holonomyArc.visible = e.target.checked;
        });

        document.getElementById('animate').addEventListener('change', (e) => {
            this.isAnimating = e.target.checked;
        });

        document.getElementById('showParticles').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.createParticleSystem();
            } else if (this.particleSystem) {
                this.scene.remove(this.particleSystem);
                this.particleSystem = null;
            }
        });

        // Sliders
        document.getElementById('speedSlider').addEventListener('input', (e) => {
            this.animationSpeed = parseFloat(e.target.value);
            document.getElementById('speedValue').textContent = this.animationSpeed.toFixed(1) + 'x';
        });

        document.getElementById('vectorSizeSlider').addEventListener('input', (e) => {
            this.vectorSize = parseFloat(e.target.value);
            document.getElementById('vectorSizeValue').textContent = this.vectorSize.toFixed(1);
            this.createTransportVector();
            this.createHolonomyArc();
        });

        // Buttons
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.transportProgress = 0;
            this.animationSpeed = 1.0;
            this.vectorSize = 1.0;
            document.getElementById('speedSlider').value = 1;
            document.getElementById('vectorSizeSlider').value = 1;
            document.getElementById('speedValue').textContent = '1.0x';
            document.getElementById('vectorSizeValue').textContent = '1.0';
            this.createTransportVector();
            this.createHolonomyArc();
        });

        document.getElementById('autoRotateBtn').addEventListener('click', (e) => {
            this.autoRotate = !this.autoRotate;
            e.target.textContent = `Auto-Rotate: ${this.autoRotate ? 'ON' : 'OFF'}`;
            e.target.style.background = this.autoRotate ? 'var(--accent)' : 'var(--bg-tertiary)';
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
        });
    }

    animate() {
        this._animationId = requestAnimationFrame(() => this.animate());

        // Update controls
        this.controls.update();

        // Auto-rotate
        if (this.autoRotate && this.solidMesh) {
            this.solidMesh.rotation.y += 0.005;
            if (this.pathLine) this.pathLine.rotation.y += 0.005;
        }

        // Update transport vector animation
        this.updateTransportVector();

        // Animate particles
        if (this.particleSystem && this.isAnimating) {
            const positions = this.particleSystem.geometry.attributes.position.array;
            const particleCount = positions.length / 3;

            for (let i = 0; i < particleCount; i++) {
                const idx = i * 3;
                const t = (i / particleCount + this.transportProgress) % 1;
                const pathIndex = Math.floor(t * (this.pathVertices.length - 1));
                const nextIndex = (pathIndex + 1) % this.pathVertices.length;

                const start = this.pathVertices[pathIndex];
                const end = this.pathVertices[nextIndex];
                const localT = (t * (this.pathVertices.length - 1)) % 1;

                positions[idx] = start.x + (end.x - start.x) * localT;
                positions[idx + 1] = start.y + (end.y - start.y) * localT;
                positions[idx + 2] = start.z + (end.z - start.z) * localT;
            }

            this.particleSystem.geometry.attributes.position.needsUpdate = true;
        }

        // Render
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Clean up resources to prevent memory leaks
     * Call this when removing the simulator from the DOM
     */
    destroy() {
        // Cancel animation frame
        if (this._animationId) {
            cancelAnimationFrame(this._animationId);
            this._animationId = null;
        }
        
        // Dispose Three.js objects
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        if (this.controls) {
            this.controls.dispose();
        }
        
        // Dispose geometries and materials
        if (this.solidMesh) {
            this.solidMesh.geometry?.dispose();
            this.solidMesh.material?.dispose();
        }
        
        if (this.pathLine) {
            this.pathLine.geometry?.dispose();
            this.pathLine.material?.dispose();
        }
        
        if (this.particleSystem) {
            this.particleSystem.geometry?.dispose();
            this.particleSystem.material?.dispose();
        }
        
        // Clear scene
        this.scene.clear();
        
        // Clear references
        this.pathVertices = [];
        this.transportVector = null;
        this.holonomyArc = null;
    }
}

// Initialize simulator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const simulator = new HolonomySimulator();
    console.log('Discrete Holonomy Simulator initialized');
    console.log('Explore parallel transport on Platonic solids!');
});

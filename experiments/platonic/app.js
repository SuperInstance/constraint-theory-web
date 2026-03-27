// Platonic Solid Explorer - Constraint Theory Research Project
// Interactive visualization of the 5 regular convex polyhedra

class PlatonicSolidExplorer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentSolid = null;
        this.currentSolidName = 'tetrahedron';
        this.displayMode = 'solid';
        this.autoRotate = true;
        this.rotationSpeed = 0.003;
        this.explodeAmount = 0;
        this.showSymmetry = false;
        this.showDual = false;
        this.unfoldAmount = 0;
        this.symmetryAxes = [];
        this.dualSolid = null;
        this.faceMeshes = [];
        this.starfield = null;

        // Golden ratio
        this.phi = (1 + Math.sqrt(5)) / 2;

        this.init();
        this.createStarfield();
        this.loadSolid('tetrahedron');
        this.setupEventListeners();
        this.animate();
    }

    init() {
        const canvas = document.getElementById('canvas');
        const container = canvas.parentElement;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0f);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.z = 5;

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        // Controls
        this.controls = new THREE.OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 15;

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        const pointLight = new THREE.PointLight(0xD4AF37, 0.5);
        pointLight.position.set(-5, -5, 5);
        this.scene.add(pointLight);

        // Handle resize
        window.addEventListener('resize', () => this.onResize());
    }

    createStarfield() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];

        for (let i = 0; i < 2000; i++) {
            const x = (Math.random() - 0.5) * 100;
            const y = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;
            vertices.push(x, y, z);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.8
        });

        this.starfield = new THREE.Points(geometry, material);
        this.scene.add(this.starfield);
    }

    // Platonic Solid Data
    getSolidData(name) {
        const solids = {
            tetrahedron: {
                name: 'Tetrahedron',
                schläfli: '{3,3}',
                vertices: 4,
                edges: 6,
                faces: 4,
                faceType: 'Triangle',
                facesPerVertex: 3,
                dihedral: 70.53,
                euler: 2,
                symmetry: 'Tetrahedral Group (T₄)',
                symmetryOrder: 12,
                symmetryAxes: ['4 three-fold axes', '3 two-fold axes'],
                dual: 'Tetrahedron',
                dualDesc: 'Self-dual: vertices ↔ faces',
                volume: 'V = a³/(6√2)',
                area: 'A = √3 a²',
                hasGoldenRatio: false,
                geometry: this.createTetrahedron()
            },
            cube: {
                name: 'Cube (Hexahedron)',
                schläfli: '{4,3}',
                vertices: 8,
                edges: 12,
                faces: 6,
                faceType: 'Square',
                facesPerVertex: 3,
                dihedral: 90,
                euler: 2,
                symmetry: 'Octahedral Group (O₄)',
                symmetryOrder: 24,
                symmetryAxes: ['3 four-fold axes', '4 three-fold axes', '6 two-fold axes'],
                dual: 'Octahedron',
                dualDesc: 'Vertices ↔ Faces centers',
                volume: 'V = a³',
                area: 'A = 6a²',
                hasGoldenRatio: false,
                geometry: this.createCube()
            },
            octahedron: {
                name: 'Octahedron',
                schläfli: '{3,4}',
                vertices: 6,
                edges: 12,
                faces: 8,
                faceType: 'Triangle',
                facesPerVertex: 4,
                dihedral: 109.47,
                euler: 2,
                symmetry: 'Octahedral Group (O₄)',
                symmetryOrder: 24,
                symmetryAxes: ['3 four-fold axes', '4 three-fold axes', '6 two-fold axes'],
                dual: 'Cube',
                dualDesc: 'Faces ↔ Cube vertices',
                volume: 'V = √2 a³/3',
                area: 'A = 2√3 a²',
                hasGoldenRatio: false,
                geometry: this.createOctahedron()
            },
            dodecahedron: {
                name: 'Dodecahedron',
                schläfli: '{5,3}',
                vertices: 20,
                edges: 30,
                faces: 12,
                faceType: 'Pentagon',
                facesPerVertex: 3,
                dihedral: 116.57,
                euler: 2,
                symmetry: 'Icosahedral Group (I₄)',
                symmetryOrder: 60,
                symmetryAxes: ['6 five-fold axes', '10 three-fold axes', '15 two-fold axes'],
                dual: 'Icosahedron',
                dualDesc: 'Vertices ↔ Icosahedron faces',
                volume: 'V = 15+7√5 a³/4',
                area: 'A = 3√25+10√5 a²',
                hasGoldenRatio: true,
                goldenDesc: 'Vertex coordinates use φ³',
                geometry: this.createDodecahedron()
            },
            icosahedron: {
                name: 'Icosahedron',
                schläfli: '{3,5}',
                vertices: 12,
                edges: 30,
                faces: 20,
                faceType: 'Triangle',
                facesPerVertex: 5,
                dihedral: 138.19,
                euler: 2,
                symmetry: 'Icosahedral Group (I₄)',
                symmetryOrder: 60,
                symmetryAxes: ['6 five-fold axes', '10 three-fold axes', '15 two-fold axes'],
                dual: 'Dodecahedron',
                dualDesc: 'Faces ↔ Dodecahedron vertices',
                volume: 'V = 5(3+√5)a³/12',
                area: 'A = 5√3 a²',
                hasGoldenRatio: true,
                goldenDesc: 'All vertices use φ',
                geometry: this.createIcosahedron()
            }
        };

        return solids[name];
    }

    // Geometry creation methods
    createTetrahedron() {
        const geometry = new THREE.TetrahedronGeometry(1.5);
        return { geometry, type: 'tetrahedron' };
    }

    createCube() {
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        return { geometry, type: 'cube' };
    }

    createOctahedron() {
        const geometry = new THREE.OctahedronGeometry(1.5);
        return { geometry, type: 'octahedron' };
    }

    createDodecahedron() {
        const geometry = new THREE.DodecahedronGeometry(1.5);
        return { geometry, type: 'dodecahedron' };
    }

    createIcosahedron() {
        const geometry = new THREE.IcosahedronGeometry(1.5);
        return { geometry, type: 'icosahedron' };
    }

    loadSolid(name) {
        // Clear existing solid
        if (this.currentSolid) {
            this.scene.remove(this.currentSolid);
        }
        if (this.dualSolid) {
            this.scene.remove(this.dualSolid);
            this.dualSolid = null;
        }
        this.clearSymmetryAxes();

        const solidData = this.getSolidData(name);
        this.currentSolidName = name;

        // Create mesh based on display mode
        this.currentSolid = this.createSolidMesh(solidData);
        this.scene.add(this.currentSolid);

        // Update UI
        this.updatePropertiesPanel(solidData);

        // Reset states
        this.explodeAmount = 0;
        this.unfoldAmount = 0;
    }

    createSolidMesh(solidData) {
        const group = new THREE.Group();
        const { geometry, type } = solidData.geometry;

        // Get face data for individual face meshes
        const posAttribute = geometry.getAttribute('position');
        const indexAttribute = geometry.getIndex();

        if (this.displayMode === 'solid') {
            // Solid mode with translucent faces and glowing edges
            const material = new THREE.MeshPhongMaterial({
                color: this.getSolidColor(type),
                transparent: true,
                opacity: 0.7,
                shininess: 100,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geometry, material);
            group.add(mesh);

            // Add glowing edges
            const edges = new THREE.EdgesGeometry(geometry);
            const edgeMaterial = new THREE.LineBasicMaterial({
                color: 0xD4AF37,
                linewidth: 2
            });
            const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
            group.add(edgeLines);

        } else if (this.displayMode === 'wireframe') {
            // Wireframe mode
            const wireframe = new THREE.WireframeGeometry(geometry);
            const material = new THREE.LineBasicMaterial({
                color: 0xD4AF37,
                linewidth: 2
            });
            const lines = new THREE.LineSegments(wireframe, material);
            group.add(lines);

        } else if (this.displayMode === 'vertices') {
            // Vertices mode - show only vertices
            const vertices = [];
            const pos = geometry.getAttribute('position');
            for (let i = 0; i < pos.count; i++) {
                vertices.push(
                    new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i))
                );
            }

            const vertexGeometry = new THREE.BufferGeometry().setFromPoints(vertices);
            const vertexMaterial = new THREE.PointsMaterial({
                color: 0xD4AF37,
                size: 0.15,
                sizeAttenuation: true
            });
            const vertexPoints = new THREE.Points(vertexGeometry, vertexMaterial);
            group.add(vertexPoints);

        } else if (this.displayMode === 'faces') {
            // Faces mode - color each face differently
            const material = new THREE.MeshPhongMaterial({
                vertexColors: true,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });

            // Add face coloring
            const count = geometry.getAttribute('position').count;
            const colors = [];
            const faceColors = [
                new THREE.Color(0xD4AF37),
                new THREE.Color(0x4CAF50),
                new THREE.Color(0x2196F3),
                new THREE.Color(0xFF5722),
                new THREE.Color(0x9C27B0)
            ];

            for (let i = 0; i < count; i += 3) {
                const color = faceColors[Math.floor(i / 3) % faceColors.length];
                colors.push(color.r, color.g, color.b);
                colors.push(color.r, color.g, color.b);
                colors.push(color.r, color.g, color.b);
            }

            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

            const mesh = new THREE.Mesh(geometry, material);
            group.add(mesh);

            // Add edges
            const edges = new THREE.EdgesGeometry(geometry);
            const edgeMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff,
                linewidth: 1
            });
            const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
            group.add(edgeLines);
        }

        return group;
    }

    getSolidColor(type) {
        const colors = {
            tetrahedron: 0x4CAF50,
            cube: 0x2196F3,
            octahedron: 0xFF5722,
            dodecahedron: 0x9C27B0,
            icosahedron: 0xE91E63
        };
        return colors[type] || 0xD4AF37;
    }

    updatePropertiesPanel(data) {
        document.getElementById('solidName').textContent = data.name;
        document.getElementById('solidFormula').textContent = data.schläfli;
        document.getElementById('vertices').textContent = data.vertices;
        document.getElementById('edges').textContent = data.edges;
        document.getElementById('faces').textContent = data.faces;
        document.getElementById('euler').textContent = data.euler;
        document.getElementById('faceType').textContent = data.faceType;
        document.getElementById('facesPerVertex').textContent = data.facesPerVertex;
        document.getElementById('dihedral').textContent = data.dihedral + '°';
        document.getElementById('schläfli').textContent = data.schläfli;
        document.getElementById('symmetryGroup').textContent = data.symmetry;
        document.getElementById('symmetryOrder').textContent = 'Order: ' + data.symmetryOrder;
        document.getElementById('dualSolid').textContent = data.dual;
        document.getElementById('dualDesc').textContent = data.dualDesc;
        document.getElementById('volumeFormula').textContent = data.volume;
        document.getElementById('areaFormula').textContent = data.area;

        // Update symmetry axes
        const axesContainer = document.getElementById('symmetryAxes');
        axesContainer.innerHTML = data.symmetryAxes.map(axis =>
            `<span class="axis-item">${axis}</span>`
        ).join('');

        // Show/hide golden ratio section
        const goldenSection = document.getElementById('goldenSection');
        if (data.hasGoldenRatio) {
            goldenSection.style.display = 'block';
            document.getElementById('goldenDesc').textContent = data.goldenDesc;
        } else {
            goldenSection.style.display = 'none';
        }
    }

    clearSymmetryAxes() {
        this.symmetryAxes.forEach(axis => this.scene.remove(axis));
        this.symmetryAxes = [];
    }

    showSymmetryAxesForSolid(solidName) {
        this.clearSymmetryAxes();

        const axes = [];
        const axisLength = 3;

        switch(solidName) {
            case 'tetrahedron':
                // 3 two-fold axes (through midpoints of opposite edges)
                axes.push(
                    { direction: new THREE.Vector3(1, 0, 0), color: 0x4CAF50 },
                    { direction: new THREE.Vector3(0, 1, 0), color: 0x2196F3 },
                    { direction: new THREE.Vector3(0, 0, 1), color: 0xFF5722 }
                );
                break;

            case 'cube':
            case 'octahedron':
                // 3 four-fold axes (through opposite faces/vertices)
                for (let i = 0; i < 3; i++) {
                    const dir = new THREE.Vector3();
                    dir.setComponent(i, 1);
                    axes.push({ direction: dir, color: 0xFF5722 });
                }
                // 4 three-fold axes (through opposite vertices)
                const threeFoldDirs = [
                    new THREE.Vector3(1, 1, 1).normalize(),
                    new THREE.Vector3(1, 1, -1).normalize(),
                    new THREE.Vector3(1, -1, 1).normalize(),
                    new THREE.Vector3(1, -1, -1).normalize()
                ];
                threeFoldDirs.forEach(dir => {
                    axes.push({ direction: dir, color: 0x4CAF50 });
                });
                break;

            case 'dodecahedron':
            case 'icosahedron':
                // Simplified - show main axes
                const mainAxes = [
                    new THREE.Vector3(0, 1, 0),
                    new THREE.Vector3(1, 0, 0),
                    new THREE.Vector3(0, 0, 1)
                ];
                mainAxes.forEach(dir => {
                    axes.push({ direction: dir, color: 0xD4AF37 });
                });
                break;
        }

        axes.forEach(axis => {
            const points = [
                axis.direction.clone().multiplyScalar(-axisLength),
                axis.direction.clone().multiplyScalar(axisLength)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: axis.color,
                linewidth: 2,
                transparent: true,
                opacity: 0.7
            });
            const line = new THREE.Line(geometry, material);
            this.scene.add(line);
            this.symmetryAxes.push(line);
        });
    }

    showDualSolid() {
        if (!this.showDual) {
            if (this.dualSolid) {
                this.scene.remove(this.dualSolid);
                this.dualSolid = null;
            }
            return;
        }

        const dualMap = {
            tetrahedron: 'tetrahedron',
            cube: 'octahedron',
            octahedron: 'cube',
            dodecahedron: 'icosahedron',
            icosahedron: 'dodecahedron'
        };

        const dualName = dualMap[this.currentSolidName];
        const dualData = this.getSolidData(dualName);

        if (this.dualSolid) {
            this.scene.remove(this.dualSolid);
        }

        this.dualSolid = this.createSolidMesh(dualData);
        this.dualSolid.scale.set(0.6, 0.6, 0.6);
        this.dualSolid.position.set(2.5, 0, 0);
        this.scene.add(this.dualSolid);
    }

    setupEventListeners() {
        // Solid selector
        document.querySelectorAll('.solid-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.solid-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.loadSolid(btn.dataset.solid);
            });
        });

        // Display mode
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.displayMode = btn.dataset.mode;
                this.loadSolid(this.currentSolidName);
            });
        });

        // Auto-rotate
        document.getElementById('autoRotate').addEventListener('change', (e) => {
            this.autoRotate = e.target.checked;
        });

        // Explode view
        document.getElementById('explode').addEventListener('change', (e) => {
            this.explodeAmount = e.target.checked ? 1 : 0;
        });

        // Symmetry axes
        document.getElementById('showSymmetry').addEventListener('change', (e) => {
            this.showSymmetry = e.target.checked;
            if (this.showSymmetry) {
                this.showSymmetryAxesForSolid(this.currentSolidName);
            } else {
                this.clearSymmetryAxes();
            }
        });

        // Dual solid
        document.getElementById('showDual').addEventListener('change', (e) => {
            this.showDual = e.target.checked;
            this.showDualSolid();
        });

        // Unfold
        document.getElementById('unfold').addEventListener('change', (e) => {
            this.unfoldAmount = e.target.checked ? 1 : 0;
        });

        // Rotation speed
        document.getElementById('rotationSpeed').addEventListener('input', (e) => {
            this.rotationSpeed = e.target.value / 10000;
        });
    }

    onResize() {
        const canvas = document.getElementById('canvas');
        const container = canvas.parentElement;

        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Auto-rotate
        if (this.autoRotate && this.currentSolid) {
            this.currentSolid.rotation.y += this.rotationSpeed;
            this.currentSolid.rotation.x += this.rotationSpeed * 0.5;
        }

        // Animate dual solid
        if (this.dualSolid && this.showDual) {
            this.dualSolid.rotation.y += this.rotationSpeed * 1.5;
        }

        // Explode animation
        if (this.explodeAmount > 0 && this.currentSolid) {
            this.currentSolid.scale.set(
                1 + this.explodeAmount * 0.3,
                1 + this.explodeAmount * 0.3,
                1 + this.explodeAmount * 0.3
            );
        } else if (this.currentSolid) {
            this.currentSolid.scale.set(1, 1, 1);
        }

        // Animate starfield
        if (this.starfield) {
            this.starfield.rotation.y += 0.0001;
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the explorer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.platonicExplorer = new PlatonicSolidExplorer();
});

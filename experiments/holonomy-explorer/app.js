// Holonomy Explorer Experiment
// Demonstrates cycle construction and holonomy computation for constraint consistency

class HolonomyExplorer {
    constructor() {
        // Canvas setup
        this.rotationCanvas = document.getElementById('rotationCanvas');
        this.rotationCtx = this.rotationCanvas.getContext('2d');

        // State
        this.cycleNodes = [];
        this.currentHolonomy = this.identityMatrix();
        this.viewAngle = { x: 0.3, y: 0.5 };
        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };

        // Parameters
        this.rotationType = 'z';
        this.angle = 90;
        this.tolerance = 1e-3;
        this.showAxes = true;
        this.showPath = true;
        this.animateRotation = false;

        // Animation
        this.animationTime = 0;
        this.lastFrameTime = performance.now();

        // 3D rotation visualization state
        this.cubeVertices = this.generateCubeVertices();
        this.spherePoints = this.generateSpherePoints(100);

        // Initialize
        this.setupCanvas();
        this.setupControls();
        this.setupPresets();
        this.startAnimation();
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.rotationCanvas.getBoundingClientRect();
        this.rotationCanvas.width = rect.width * dpr;
        this.rotationCanvas.height = rect.height * dpr;
        this.rotationCtx.scale(dpr, dpr);

        this.canvasWidth = 500;
        this.canvasHeight = 450;
    }

    setupControls() {
        // Rotation type
        document.getElementById('rotationType').addEventListener('change', (e) => {
            this.rotationType = e.target.value;
        });

        // Angle slider
        const angleSlider = document.getElementById('angleSlider');
        angleSlider.addEventListener('input', (e) => {
            this.angle = parseInt(e.target.value);
            document.getElementById('angleValue').textContent = `${this.angle}°`;
        });

        // Tolerance
        const toleranceSlider = document.getElementById('toleranceSlider');
        toleranceSlider.addEventListener('input', (e) => {
            const exp = parseFloat(e.target.value);
            this.tolerance = Math.pow(10, exp);
            document.getElementById('toleranceValue').textContent = `10^${exp}`;
        });

        // Checkboxes
        document.getElementById('showAxes').addEventListener('change', (e) => {
            this.showAxes = e.target.checked;
        });

        document.getElementById('showPath').addEventListener('change', (e) => {
            this.showPath = e.target.checked;
        });

        document.getElementById('animateRotation').addEventListener('change', (e) => {
            this.animateRotation = e.target.checked;
        });

        // Buttons
        document.getElementById('addNodeBtn').addEventListener('click', () => {
            this.addRotationNode();
        });

        document.getElementById('closeCycleBtn').addEventListener('click', () => {
            this.closeCycle();
        });

        document.getElementById('clearCycleBtn').addEventListener('click', () => {
            this.clearCycle();
        });

        // View controls
        document.getElementById('rotateLeft').addEventListener('click', () => {
            this.viewAngle.y -= 0.2;
        });

        document.getElementById('rotateRight').addEventListener('click', () => {
            this.viewAngle.y += 0.2;
        });

        document.getElementById('rotateUp').addEventListener('click', () => {
            this.viewAngle.x -= 0.2;
        });

        document.getElementById('rotateDown').addEventListener('click', () => {
            this.viewAngle.x += 0.2;
        });

        document.getElementById('resetView').addEventListener('click', () => {
            this.viewAngle = { x: 0.3, y: 0.5 };
        });

        // Canvas interactions
        this.rotationCanvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouse = { x: e.clientX, y: e.clientY };
        });

        this.rotationCanvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.lastMouse.x;
                const dy = e.clientY - this.lastMouse.y;
                this.viewAngle.y += dx * 0.01;
                this.viewAngle.x += dy * 0.01;
                this.lastMouse = { x: e.clientX, y: e.clientY };
            }
        });

        this.rotationCanvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.rotationCanvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'a') this.addRotationNode();
            if (e.key === 'c') this.closeCycle();
            if (e.key === 'r') this.clearCycle();
        });
    }

    setupPresets() {
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                this.loadPreset(preset);
            });
        });
    }

    generateCubeVertices() {
        return [
            [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
            [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
        ];
    }

    generateSpherePoints(count) {
        const points = [];
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            points.push([
                Math.sin(phi) * Math.cos(theta),
                Math.sin(phi) * Math.sin(theta),
                Math.cos(phi)
            ]);
        }
        return points;
    }

    identityMatrix() {
        return [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1]
        ];
    }

    rotationMatrixX(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return [
            [1, 0, 0],
            [0, c, -s],
            [0, s, c]
        ];
    }

    rotationMatrixY(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return [
            [c, 0, s],
            [0, 1, 0],
            [-s, 0, c]
        ];
    }

    rotationMatrixZ(angle) {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        return [
            [c, -s, 0],
            [s, c, 0],
            [0, 0, 1]
        ];
    }

    rotationMatrix(axis, angle) {
        switch (axis) {
            case 'x': return this.rotationMatrixX(angle);
            case 'y': return this.rotationMatrixY(angle);
            case 'z': return this.rotationMatrixZ(angle);
            default:
                // Arbitrary axis using Rodrigues' formula
                const ux = axis.x || axis[0];
                const uy = axis.y || axis[1];
                const uz = axis.z || axis[2];
                const norm = Math.sqrt(ux * ux + uy * uy + uz * uz);
                const x = ux / norm, y = uy / norm, z = uz / norm;
                const c = Math.cos(angle), s = Math.sin(angle);
                return [
                    [c + x * x * (1 - c), x * y * (1 - c) - z * s, x * z * (1 - c) + y * s],
                    [y * x * (1 - c) + z * s, c + y * y * (1 - c), y * z * (1 - c) - x * s],
                    [z * x * (1 - c) - y * s, z * y * (1 - c) + x * s, c + z * z * (1 - c)]
                ];
        }
    }

    multiplyMatrices(a, b) {
        const result = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                for (let k = 0; k < 3; k++) {
                    result[i][j] += a[i][k] * b[k][j];
                }
            }
        }
        return result;
    }

    matrixNorm(m) {
        let sum = 0;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const target = i === j ? 1 : 0;
                sum += Math.pow(m[i][j] - target, 2);
            }
        }
        return Math.sqrt(sum);
    }

    isIdentity(m, tolerance) {
        return this.matrixNorm(m) < tolerance;
    }

    projectPoint(point, scale = 100) {
        // Apply view rotation
        let [x, y, z] = point;
        
        // Rotate around Y axis
        const cy = Math.cos(this.viewAngle.y);
        const sy = Math.sin(this.viewAngle.y);
        const x1 = x * cy + z * sy;
        const z1 = -x * sy + z * cy;
        
        // Rotate around X axis
        const cx = Math.cos(this.viewAngle.x);
        const sx = Math.sin(this.viewAngle.x);
        const y1 = y * cx - z1 * sx;
        const z2 = y * sx + z1 * cx;
        
        // Project to 2D
        const perspective = 4 / (4 + z2);
        return {
            x: this.canvasWidth / 2 + x1 * scale * perspective,
            y: this.canvasHeight / 2 - y1 * scale * perspective,
            z: z2
        };
    }

    addRotationNode(axis = null, angle = null) {
        const nodeAxis = axis || this.rotationType;
        const nodeAngle = angle !== null ? angle : this.angle * Math.PI / 180;

        this.cycleNodes.push({
            axis: nodeAxis,
            angle: nodeAngle,
            angleDeg: (nodeAngle * 180 / Math.PI).toFixed(0)
        });

        this.updateCycleList();
        this.recomputeHolonomy();
    }

    closeCycle() {
        if (this.cycleNodes.length < 2) return;
        
        // Compute holonomy
        this.recomputeHolonomy();
        this.updateHolonomyDisplay();
    }

    clearCycle() {
        this.cycleNodes = [];
        this.currentHolonomy = this.identityMatrix();
        this.updateCycleList();
        this.updateHolonomyDisplay();
        this.updateMetrics();
    }

    loadPreset(preset) {
        this.clearCycle();

        switch (preset) {
            case 'consistent':
                // 90° X → 90° Y → -90° X → -90° Y = Identity
                this.addRotationNode('x', Math.PI / 2);
                this.addRotationNode('y', Math.PI / 2);
                this.addRotationNode('x', -Math.PI / 2);
                this.addRotationNode('y', -Math.PI / 2);
                break;

            case 'inconsistent':
                // 90° X → 90° Y → 90° Z ≠ Identity
                this.addRotationNode('x', Math.PI / 2);
                this.addRotationNode('y', Math.PI / 2);
                this.addRotationNode('z', Math.PI / 2);
                break;

            case 'spherical':
                // Spherical triangle with excess angle
                this.addRotationNode('x', Math.PI / 4);
                this.addRotationNode('y', Math.PI / 4);
                this.addRotationNode('z', Math.PI / 4);
                this.addRotationNode('x', -Math.PI / 4);
                this.addRotationNode('y', -Math.PI / 4);
                this.addRotationNode('z', -Math.PI / 4);
                break;

            case 'parallel':
                // Parallel transport around triangle
                this.addRotationNode('x', Math.PI / 6);
                this.addRotationNode('y', Math.PI / 6);
                this.addRotationNode({ x: 1, y: 1, z: 0 }, Math.PI / 6);
                this.addRotationNode('x', -Math.PI / 6);
                this.addRotationNode('y', -Math.PI / 6);
                this.addRotationNode({ x: 1, y: 1, z: 0 }, -Math.PI / 6);
                break;
        }

        this.closeCycle();
    }

    recomputeHolonomy() {
        this.currentHolonomy = this.identityMatrix();

        for (const node of this.cycleNodes) {
            const rotMatrix = this.rotationMatrix(node.axis, node.angle);
            this.currentHolonomy = this.multiplyMatrices(rotMatrix, this.currentHolonomy);
        }

        this.updateMetrics();
    }

    updateCycleList() {
        const listEl = document.getElementById('cycleList');
        
        if (this.cycleNodes.length === 0) {
            listEl.innerHTML = '<p class="empty-state">Click "Add Node" to add rotations</p>';
            return;
        }

        const axisNames = { x: 'X-axis', y: 'Y-axis', z: 'Z-axis' };

        listEl.innerHTML = this.cycleNodes.map((node, i) => {
            const axisName = typeof node.axis === 'string' ? axisNames[node.axis] : 'Arbitrary';
            return `
                <div class="cycle-node">
                    <span class="axis">${axisName}</span>
                    <span class="angle">${node.angleDeg}°</span>
                    <span class="remove" onclick="explorer.removeNode(${i})">×</span>
                </div>
                ${i < this.cycleNodes.length - 1 ? '<div class="cycle-arrow">↓</div>' : ''}
            `;
        }).join('');
    }

    removeNode(index) {
        this.cycleNodes.splice(index, 1);
        this.updateCycleList();
        this.recomputeHolonomy();
        this.updateHolonomyDisplay();
    }

    updateHolonomyDisplay() {
        const resultEl = document.getElementById('holonomyResult');
        const valueEl = resultEl.querySelector('.value');
        const matrixEl = document.getElementById('holonomyMatrix');

        const isConsistent = this.isIdentity(this.currentHolonomy, this.tolerance);
        const norm = this.matrixNorm(this.currentHolonomy);

        valueEl.textContent = isConsistent ? 'Identity (Consistent)' : 'Non-Identity (Inconsistent)';
        valueEl.className = `value ${isConsistent ? 'consistent' : 'inconsistent'}`;

        // Update matrix display
        matrixEl.innerHTML = this.currentHolonomy.map(row => `
            <div class="matrix-row">
                ${row.map(v => `<span>${v.toFixed(3)}</span>`).join('')}
            </div>
        `).join('');
    }

    updateMetrics() {
        document.getElementById('cycleLength').textContent = this.cycleNodes.length;
        
        const norm = this.matrixNorm(this.currentHolonomy);
        const normEl = document.getElementById('holonomyNorm');
        normEl.textContent = norm.toExponential(2);
        normEl.className = `metric-value ${norm < this.tolerance ? 'good' : 'bad'}`;

        const isConsistent = this.isIdentity(this.currentHolonomy, this.tolerance);
        const consistencyEl = document.getElementById('consistency');
        consistencyEl.textContent = isConsistent ? '✓ Consistent' : '✗ Inconsistent';
        consistencyEl.className = `metric-value ${isConsistent ? 'good' : 'bad'}`;

        // Information content: I = -log|Hol(γ)|
        const infoContent = norm > 0 ? -Math.log(norm) : Infinity;
        const infoEl = document.getElementById('infoContent');
        infoEl.textContent = infoContent === Infinity ? '∞' : infoContent.toFixed(2);
    }

    render3DSpace() {
        const ctx = this.rotationCtx;
        
        // Clear
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Draw sphere background
        ctx.fillStyle = 'rgba(0, 217, 255, 0.02)';
        for (const point of this.spherePoints) {
            const p = this.projectPoint(point, 120);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw coordinate axes
        if (this.showAxes) {
            const axes = [
                { start: [0, 0, 0], end: [1.5, 0, 0], color: '#ff6b6b', label: 'X' },
                { start: [0, 0, 0], end: [0, 1.5, 0], color: '#00ff88', label: 'Y' },
                { start: [0, 0, 0], end: [0, 0, 1.5], color: '#00d9ff', label: 'Z' }
            ];

            for (const axis of axes) {
                const p1 = this.projectPoint(axis.start);
                const p2 = this.projectPoint(axis.end, 100);

                ctx.strokeStyle = axis.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();

                // Label
                ctx.fillStyle = axis.color;
                ctx.font = 'bold 14px sans-serif';
                ctx.fillText(axis.label, p2.x + 5, p2.y);
            }
        }

        // Draw current rotation axis indicator
        const axisVectors = {
            x: [1, 0, 0],
            y: [0, 1, 0],
            z: [0, 0, 1]
        };
        const currentAxis = axisVectors[this.rotationType];
        if (currentAxis) {
            const p1 = this.projectPoint([0, 0, 0]);
            const p2 = this.projectPoint(currentAxis, 80);

            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Rotation arc
            const arcRadius = 40;
            ctx.strokeStyle = 'rgba(255, 170, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const startAngle = -this.angle * Math.PI / 180;
            ctx.arc(p1.x, p1.y, arcRadius, startAngle, 0, this.angle > 0);
            ctx.stroke();
        }

        // Draw cycle path
        if (this.showPath && this.cycleNodes.length > 0) {
            let accumulatedRotation = this.identityMatrix();
            let currentPoint = [1, 0, 0]; // Start on X-axis

            ctx.strokeStyle = 'rgba(123, 44, 191, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();

            const startPoint = this.projectPoint(currentPoint, 100);
            ctx.moveTo(startPoint.x, startPoint.y);

            for (const node of this.cycleNodes) {
                const rotMatrix = this.rotationMatrix(node.axis, node.angle);
                
                // Animate if enabled
                let angle = node.angle;
                if (this.animateRotation) {
                    angle = node.angle * (0.5 + 0.5 * Math.sin(this.animationTime * 2));
                }

                // Apply rotation step by step for visualization
                const steps = 10;
                for (let i = 1; i <= steps; i++) {
                    const t = i / steps;
                    const partialRot = this.rotationMatrix(node.axis, angle * t);
                    const newPoint = this.applyMatrix(partialRot, currentPoint);
                    const p = this.projectPoint(newPoint, 100);
                    ctx.lineTo(p.x, p.y);
                }

                accumulatedRotation = this.multiplyMatrices(rotMatrix, accumulatedRotation);
                currentPoint = this.applyMatrix(rotMatrix, currentPoint);
            }

            ctx.stroke();

            // Draw return path (holonomy gap)
            const finalPoint = this.applyMatrix(this.currentHolonomy, [1, 0, 0]);
            const finalProjected = this.projectPoint(finalPoint, 100);

            if (!this.isIdentity(this.currentHolonomy, this.tolerance)) {
                ctx.strokeStyle = 'rgba(255, 107, 107, 0.8)';
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(startPoint.x, startPoint.y);
                ctx.lineTo(finalProjected.x, finalProjected.y);
                ctx.stroke();
                ctx.setLineDash([]);

                // Gap indicator
                ctx.fillStyle = '#ff6b6b';
                ctx.beginPath();
                ctx.arc(startPoint.x, startPoint.y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('!', startPoint.x, startPoint.y + 4);
            } else {
                // Consistent indicator
                ctx.fillStyle = '#00ff88';
                ctx.beginPath();
                ctx.arc(startPoint.x, startPoint.y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('✓', startPoint.x, startPoint.y + 4);
            }
        }

        // Draw cube for orientation reference
        const edges = [
            [0, 1], [1, 2], [2, 3], [3, 0],
            [4, 5], [5, 6], [6, 7], [7, 4],
            [0, 4], [1, 5], [2, 6], [3, 7]
        ];

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (const [i, j] of edges) {
            const p1 = this.projectPoint(this.cubeVertices[i], 60);
            const p2 = this.projectPoint(this.cubeVertices[j], 60);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }

        // Label
        ctx.fillStyle = '#666';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Drag to rotate view | Click nodes to add rotations', this.canvasWidth / 2, this.canvasHeight - 15);
    }

    applyMatrix(matrix, point) {
        return [
            matrix[0][0] * point[0] + matrix[0][1] * point[1] + matrix[0][2] * point[2],
            matrix[1][0] * point[0] + matrix[1][1] * point[1] + matrix[1][2] * point[2],
            matrix[2][0] * point[0] + matrix[2][1] * point[1] + matrix[2][2] * point[2]
        ];
    }

    update(dt) {
        this.animationTime += dt * 0.001;
    }

    render() {
        this.render3DSpace();
    }

    loop(timestamp) {
        const dt = timestamp - this.lastFrameTime;
        
        this.update(Math.min(dt, 32));
        this.render();
        
        this.lastFrameTime = timestamp;
        requestAnimationFrame((t) => this.loop(t));
    }

    startAnimation() {
        this.lastFrameTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }
}

// Global reference for removeNode
let explorer;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    explorer = new HolonomyExplorer();
});

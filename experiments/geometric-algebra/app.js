// ============================================================================
// GEOMETRIC ALGEBRA VISUALIZER
// Part of the Constraint Theory Research Project
// ============================================================================

// ============================================================================
// MULTIVECTOR CLASS - Core Geometric Algebra Implementation
// ============================================================================

class Multivector {
    constructor(scalar = 0, e1 = 0, e2 = 0, e12 = 0) {
        this.scalar = scalar;  // Grade 0
        this.e1 = e1;          // Grade 1 (vector component 1)
        this.e2 = e2;          // Grade 1 (vector component 2)
        this.e12 = e12;        // Grade 2 (bivector component)
    }

    // Create from vector components
    static fromVector(x, y) {
        return new Multivector(0, x, y, 0);
    }

    // Create from angle (rotor)
    static fromRotor(angle) {
        const cosHalf = Math.cos(angle / 2);
        const sinHalf = Math.sin(angle / 2);
        return new Multivector(cosHalf, 0, 0, -sinHalf);
    }

    // Geometric product: ab = a·b + a∧b
    geometric(other) {
        const scalar = this.scalar * other.scalar
            + this.e1 * other.e1
            + this.e2 * other.e2
            - this.e12 * other.e12;

        const e1 = this.scalar * other.e1
            + this.e1 * other.scalar
            - this.e2 * other.e12
            + this.e12 * other.e2;

        const e2 = this.scalar * other.e2
            + this.e1 * other.e12
            + this.e2 * other.scalar
            - this.e12 * other.e1;

        const e12 = this.scalar * other.e12
            + this.e1 * other.e2
            - this.e2 * other.e1
            + this.e12 * other.scalar;

        return new Multivector(scalar, e1, e2, e12);
    }

    // Inner product (grade lowering)
    inner(other) {
        const scalar = this.e1 * other.e1 + this.e2 * other.e2;
        const e1 = -this.e12 * other.e2;
        const e2 = this.e12 * other.e1;
        return new Multivector(scalar, e1, e2, 0);
    }

    // Outer/wedge product (grade raising)
    wedge(other) {
        const scalar = 0;
        const e1 = 0;
        const e2 = 0;
        const e12 = this.e1 * other.e2 - this.e2 * other.e1;
        return new Multivector(scalar, e1, e2, e12);
    }

    // Addition
    add(other) {
        return new Multivector(
            this.scalar + other.scalar,
            this.e1 + other.e1,
            this.e2 + other.e2,
            this.e12 + other.e12
        );
    }

    // Subtraction
    sub(other) {
        return new Multivector(
            this.scalar - other.scalar,
            this.e1 - other.e1,
            this.e2 - other.e2,
            this.e12 - other.e12
        );
    }

    // Scalar multiplication
    scale(scalar) {
        return new Multivector(
            this.scalar * scalar,
            this.e1 * scalar,
            this.e2 * scalar,
            this.e12 * scalar
        );
    }

    // Reverse (grades 2 and higher change sign)
    reverse() {
        return new Multivector(this.scalar, this.e1, this.e2, -this.e12);
    }

    // Conjugate (reverse)
    conjugate() {
        return this.reverse();
    }

    // Magnitude squared
    magnitudeSquared() {
        return this.scalar * this.scalar
            + this.e1 * this.e1
            + this.e2 * this.e2
            + this.e12 * this.e12;
    }

    // Magnitude
    magnitude() {
        return Math.sqrt(this.magnitudeSquared());
    }

    // Normalize
    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return new Multivector();
        return this.scale(1 / mag);
    }

    // Check if is scalar
    isScalar() {
        return this.e1 === 0 && this.e2 === 0 && this.e12 === 0;
    }

    // Check if is vector
    isVector() {
        return this.scalar === 0 && this.e12 === 0;
    }

    // Check if is bivector
    isBivector() {
        return this.scalar === 0 && this.e1 === 0 && this.e2 === 0;
    }

    // Check if is rotor (scalar + bivector)
    isRotor() {
        return this.e1 === 0 && this.e2 === 0;
    }

    // Get vector components
    getVector() {
        return { x: this.e1, y: this.e2 };
    }

    // Get bivector magnitude (signed area)
    getBivectorMagnitude() {
        return this.e12;
    }

    // Grade decomposition
    getGrades() {
        return {
            grade0: this.scalar,
            grade1: { e1: this.e1, e2: this.e2 },
            grade2: this.e12
        };
    }

    // String representation
    toString(precision = 3) {
        const parts = [];
        const p = precision;

        if (Math.abs(this.scalar) > 1e-10) {
            parts.push(`${this.scalar.toFixed(p)}`);
        }
        if (Math.abs(this.e1) > 1e-10) {
            parts.push(`${this.e1.toFixed(p)}e₁`);
        }
        if (Math.abs(this.e2) > 1e-10) {
            parts.push(`${this.e2.toFixed(p)}e₂`);
        }
        if (Math.abs(this.e12) > 1e-10) {
            parts.push(`${this.e12.toFixed(p)}e₁₂`);
        }

        if (parts.length === 0) return "0";
        return parts.join(" + ").replace("\\+ -", "- ");
    }
}

// ============================================================================
// GEOMETRIC ALGEBRA OPERATIONS
// ============================================================================

class GAOperations {
    // Vector addition
    static addition(a, b) {
        return a.add(b);
    }

    // Vector subtraction
    static subtraction(a, b) {
        return a.sub(b);
    }

    // Inner product (dot product)
    static inner(a, b) {
        return new Multivector(a.e1 * b.e1 + a.e2 * b.e2, 0, 0, 0);
    }

    // Outer product (wedge product) - creates bivector
    static outer(a, b) {
        return a.wedge(b);
    }

    // Geometric product (combines inner and outer)
    static geometric(a, b) {
        return a.geometric(b);
    }

    // Rotor rotation: R*v*~R
    static rotation(v, angle) {
        const R = Multivector.fromRotor(angle);
        const Rtilde = R.reverse();
        return R.geometric(v).geometric(Rtilde);
    }

    // Reflection in a line through origin
    static reflection(v, mirrorLine) {
        // Reflection: n*v*n where n is unit normal
        const n = mirrorLine.normalize();
        return n.geometric(v).geometric(n);
    }

    // Projection of a onto b
    static projection(a, b) {
        // (a·b) / b² * b
        const inner = a.e1 * b.e1 + a.e2 * b.e2;
        const bSquared = b.e1 * b.e1 + b.e2 * b.e2;
        if (bSquared === 0) return Multivector.fromVector(0, 0);
        return Multivector.fromVector(
            (inner / bSquared) * b.e1,
            (inner / bSquared) * b.e2
        );
    }

    // Rejection (orthogonal component)
    static rejection(a, b) {
        const proj = GAOperations.projection(a, b);
        return a.sub(proj);
    }
}

// ============================================================================
// VISUALIZATION ENGINE
// ============================================================================

class GAVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Coordinate system
        this.scale = 60; // pixels per unit
        this.originX = this.width / 2;
        this.originY = this.height / 2;

        // Vectors
        this.vectorA = Multivector.fromVector(2, 1);
        this.vectorB = Multivector.fromVector(1, 2);
        this.vectorC = Multivector.fromVector(0, 0);

        // Current operation
        this.currentOperation = 'addition';
        this.result = null;

        // Animation
        this.animating = false;
        this.animationProgress = 0;
        this.animationSpeed = 1;

        // Display options
        this.showGrid = true;
        this.showLabels = true;
        this.showComponents = true;
        this.showAngles = true;

        // Interaction
        this.dragging = null;
        this.dragOffset = { x: 0, y: 0 };

        this.setupEventListeners();
        this.updateResult();
        this.render();
    }

    // Coordinate conversions
    toCanvas(x, y) {
        return {
            x: this.originX + x * this.scale,
            y: this.originY - y * this.scale
        };
    }

    fromCanvas(canvasX, canvasY) {
        return {
            x: (canvasX - this.originX) / this.scale,
            y: (this.originY - canvasY) / this.scale
        };
    }

    // Setup event listeners
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.onMouseUp());
    }

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicking on vector endpoint
        const vectors = [
            { name: 'A', vector: this.vectorA },
            { name: 'B', vector: this.vectorB },
            { name: 'C', vector: this.vectorC }
        ];

        for (const v of vectors) {
            const vec = v.vector.getVector();
            const endpoint = this.toCanvas(vec.x, vec.y);
            const dist = Math.sqrt((x - endpoint.x) ** 2 + (y - endpoint.y) ** 2);

            if (dist < 15) {
                this.dragging = v.name;
                this.dragOffset = {
                    x: endpoint.x - x,
                    y: endpoint.y - y
                };
                break;
            }
        }
    }

    onMouseMove(e) {
        if (!this.dragging) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left + this.dragOffset.x;
        const y = e.clientY - rect.top + this.dragOffset.y;

        const coords = this.fromCanvas(x, y);

        if (this.dragging === 'A') {
            this.vectorA = Multivector.fromVector(
                Math.round(coords.x * 2) / 2,
                Math.round(coords.y * 2) / 2
            );
            this.updateVectorInputs('A');
        } else if (this.dragging === 'B') {
            this.vectorB = Multivector.fromVector(
                Math.round(coords.x * 2) / 2,
                Math.round(coords.y * 2) / 2
            );
            this.updateVectorInputs('B');
        } else if (this.dragging === 'C') {
            this.vectorC = Multivector.fromVector(
                Math.round(coords.x * 2) / 2,
                Math.round(coords.y * 2) / 2
            );
            this.updateVectorInputs('C');
        }

        this.updateResult();
        this.render();
    }

    onMouseUp() {
        this.dragging = null;
    }

    updateVectorInputs(name) {
        const vector = name === 'A' ? this.vectorA :
                      name === 'B' ? this.vectorB : this.vectorC;
        const vec = vector.getVector();

        document.getElementById(`vector${name}-x`).value = vec.x;
        document.getElementById(`vector${name}-y`).value = vec.y;
    }

    // Update result based on current operation
    updateResult() {
        switch (this.currentOperation) {
            case 'addition':
                this.result = GAOperations.addition(this.vectorA, this.vectorB);
                break;
            case 'subtraction':
                this.result = GAOperations.subtraction(this.vectorA, this.vectorB);
                break;
            case 'inner':
                this.result = GAOperations.inner(this.vectorA, this.vectorB);
                break;
            case 'outer':
                this.result = GAOperations.outer(this.vectorA, this.vectorB);
                break;
            case 'geometric':
                this.result = GAOperations.geometric(this.vectorA, this.vectorB);
                break;
            case 'rotor':
                // Use vectorC's angle for rotation
                const angle = Math.atan2(this.vectorC.e2, this.vectorC.e1);
                this.result = GAOperations.rotation(this.vectorA, angle);
                break;
            case 'reflection':
                this.result = GAOperations.reflection(this.vectorA, this.vectorB);
                break;
            case 'projection':
                this.result = GAOperations.projection(this.vectorA, this.vectorB);
                break;
        }

        this.updateGradeDisplay();
    }

    // Update the multivector decomposition display
    updateGradeDisplay() {
        const container = document.getElementById('gradeComponents');
        const grades = this.result.getGrades();

        let html = '';

        // Grade 0 (Scalar)
        if (Math.abs(grades.grade0) > 1e-10) {
            html += `<div class="grade-component scalar-grade">
                <strong>Grade 0 (Scalar):</strong> ${grades.grade0.toFixed(4)}
            </div>`;
        }

        // Grade 1 (Vector)
        if (Math.abs(grades.grade1.e1) > 1e-10 || Math.abs(grades.grade1.e2) > 1e-10) {
            html += `<div class="grade-component vector-grade">
                <strong>Grade 1 (Vector):</strong> ${grades.grade1.e1.toFixed(4)}e₁ + ${grades.grade1.e2.toFixed(4)}e₂
            </div>`;
        }

        // Grade 2 (Bivector)
        if (Math.abs(grades.grade2) > 1e-10) {
            html += `<div class="grade-component bivector-grade">
                <strong>Grade 2 (Bivector):</strong> ${grades.grade2.toFixed(4)}e₁₂
                <br><small>(Area: ${Math.abs(grades.grade2).toFixed(4)})</small>
            </div>`;
        }

        if (html === '') {
            html = '<div class="grade-component">Result: 0</div>';
        }

        container.innerHTML = html;
    }

    // Render the scene
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw background
        this.ctx.fillStyle = '#0a0e1a';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw grid
        if (this.showGrid) {
            this.drawGrid();
        }

        // Draw operation-specific elements
        this.drawOperation();

        // Draw vectors
        this.drawVector(this.vectorA, '#3b82f6', 'A');
        this.drawVector(this.vectorB, '#06b6d4', 'B');

        if (this.currentOperation === 'rotor' || this.currentOperation === 'reflection') {
            this.drawVector(this.vectorC, '#8b5cf6', 'C');
        }

        // Draw result
        if (this.result) {
            this.drawResult();
        }

        // Draw labels
        if (this.showLabels) {
            this.drawLabels();
        }

        // Draw angles
        if (this.showAngles) {
            this.drawAngles();
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = '#1f2937';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = this.originX % this.scale; x < this.width; x += this.scale) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = this.originY % this.scale; y < this.height; y += this.scale) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }

        // Axes
        this.ctx.strokeStyle = '#374151';
        this.ctx.lineWidth = 2;

        // X-axis
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.originY);
        this.ctx.lineTo(this.width, this.originY);
        this.ctx.stroke();

        // Y-axis
        this.ctx.beginPath();
        this.ctx.moveTo(this.originX, 0);
        this.ctx.lineTo(this.originX, this.height);
        this.ctx.stroke();

        // Axis labels
        this.ctx.fillStyle = '#6b7280';
        this.ctx.font = '14px sans-serif';
        this.ctx.fillText('x₁', this.width - 25, this.originY - 10);
        this.ctx.fillText('x₂', this.originX + 10, 20);
    }

    drawVector(vector, color, label) {
        const vec = vector.getVector();
        const start = this.toCanvas(0, 0);
        const end = this.toCanvas(vec.x, vec.y);

        // Draw arrow
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = 3;

        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(start.y - end.y, start.x - end.x);
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6;

        this.ctx.beginPath();
        this.ctx.moveTo(end.x, end.y);
        this.ctx.lineTo(
            end.x + arrowLength * Math.cos(angle - arrowAngle),
            end.y + arrowLength * Math.sin(angle - arrowAngle)
        );
        this.ctx.lineTo(
            end.x + arrowLength * Math.cos(angle + arrowAngle),
            end.y + arrowLength * Math.sin(angle + arrowAngle)
        );
        this.ctx.closePath();
        this.ctx.fill();

        // Label
        if (this.showLabels) {
            this.ctx.font = 'bold 16px sans-serif';
            this.ctx.fillStyle = color;
            this.ctx.fillText(
                label,
                end.x + 10,
                end.y - 10
            );

            // Components
            if (this.showComponents) {
                this.ctx.font = '12px monospace';
                this.ctx.fillStyle = color;
                this.ctx.fillText(
                    `(${vec.x.toFixed(1)}, ${vec.y.toFixed(1)})`,
                    end.x + 10,
                    end.y + 5
                );
            }
        }

        // Draw endpoint circle
        this.ctx.beginPath();
        this.ctx.arc(end.x, end.y, 6, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    drawResult() {
        const color = '#f59e0b';

        if (this.result.isScalar()) {
            // Display scalar result
            this.ctx.fillStyle = color;
            this.ctx.font = 'bold 24px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `Result: ${this.result.scalar.toFixed(4)}`,
                this.width / 2,
                50
            );
            this.ctx.textAlign = 'left';
        } else if (this.result.isBivector()) {
            // Draw bivector as oriented parallelogram
            this.drawBivector(this.vectorA, this.vectorB, color);
        } else if (this.result.isVector()) {
            // Draw vector result
            this.drawVector(this.result, color, 'R');
        } else {
            // Mixed grade - show vector component
            if (Math.abs(this.result.e1) > 1e-10 || Math.abs(this.result.e2) > 1e-10) {
                this.drawVector(
                    Multivector.fromVector(this.result.e1, this.result.e2),
                    color,
                    'R'
                );
            }

            // Show bivector component if significant
            if (Math.abs(this.result.e12) > 1e-10) {
                this.drawBivector(this.vectorA, this.vectorB, '#8b5cf6', 0.3);
            }
        }
    }

    drawBivector(a, b, color, alpha = 0.4) {
        const vecA = a.getVector();
        const vecB = b.getVector();

        const origin = this.toCanvas(0, 0);
        const endA = this.toCanvas(vecA.x, vecA.y);
        const endB = this.toCanvas(vecB.x, vecB.y);
        const corner = this.toCanvas(vecA.x + vecB.x, vecA.y + vecB.y);

        // Draw parallelogram
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = alpha;

        this.ctx.beginPath();
        this.ctx.moveTo(origin.x, origin.y);
        this.ctx.lineTo(endA.x, endA.y);
        this.ctx.lineTo(corner.x, corner.y);
        this.ctx.lineTo(endB.x, endB.y);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.globalAlpha = 1;

        // Draw border
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Area label
        const area = Math.abs(vecA.x * vecB.y - vecA.y * vecB.x);
        this.ctx.fillStyle = color;
        this.ctx.font = '14px sans-serif';
        this.ctx.fillText(
            `Area: ${area.toFixed(2)}`,
            corner.x / 2 + origin.x / 2,
            corner.y / 2 + origin.y / 2
        );
    }

    drawOperation() {
        switch (this.currentOperation) {
            case 'addition':
                this.drawAddition();
                break;
            case 'subtraction':
                this.drawSubtraction();
                break;
            case 'inner':
                this.drawInnerProduct();
                break;
            case 'outer':
                this.drawOuterProduct();
                break;
            case 'geometric':
                this.drawGeometricProduct();
                break;
            case 'rotor':
                this.drawRotor();
                break;
            case 'reflection':
                this.drawReflection();
                break;
            case 'projection':
                this.drawProjection();
                break;
        }
    }

    drawAddition() {
        const vecA = this.vectorA.getVector();
        const vecB = this.vectorB.getVector();

        const origin = this.toCanvas(0, 0);
        const endA = this.toCanvas(vecA.x, vecA.y);
        const corner = this.toCanvas(vecA.x, vecA.y);
        const endBfromA = this.toCanvas(vecA.x + vecB.x, vecA.y + vecB.y);

        // Draw parallelogram
        this.ctx.strokeStyle = '#9ca3af';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);

        this.ctx.beginPath();
        this.ctx.moveTo(endA.x, endA.y);
        this.ctx.lineTo(endBfromA.x, endBfromA.y);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(origin.x, origin.y);
        this.ctx.lineTo(endBfromA.x, endBfromA.y);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
    }

    drawSubtraction() {
        const vecA = this.vectorA.getVector();
        const vecB = this.vectorB.getVector();

        const endA = this.toCanvas(vecA.x, vecA.y);
        const endB = this.toCanvas(vecB.x, vecB.y);
        const endDiff = this.toCanvas(vecA.x - vecB.x, vecA.y - vecB.y);

        // Draw B from A
        this.ctx.strokeStyle = '#9ca3af';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);

        this.ctx.beginPath();
        this.ctx.moveTo(endA.x, endA.y);
        this.ctx.lineTo(endDiff.x, endDiff.y);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
    }

    drawInnerProduct() {
        const angle = this.getAngle(this.vectorA, this.vectorB);
        const magA = this.vectorA.magnitude();
        const magB = this.vectorB.magnitude();
        const result = magA * magB * Math.cos(angle);

        // Draw projection visualization
        const vecA = this.vectorA.getVector();
        const vecB = this.vectorB.getVector();

        const unitB = {
            x: vecB.x / magB,
            y: vecB.y / magB
        };

        const projLength = result / magB;
        const proj = this.toCanvas(unitB.x * projLength, unitB.y * projLength);

        // Draw projection line
        this.ctx.strokeStyle = '#f59e0b';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        this.ctx.beginPath();
        this.ctx.moveTo(this.toCanvas(vecA.x, vecA.y).x, this.toCanvas(vecA.x, vecA.y).y);
        this.ctx.lineTo(proj.x, proj.y);
        this.ctx.stroke();

        this.ctx.setLineDash([]);

        // Display result
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.font = '14px sans-serif';
        this.ctx.fillText(
            `A·B = ${result.toFixed(3)}`,
            20,
            this.height - 60
        );
    }

    drawOuterProduct() {
        // Bivector is drawn in drawResult
        const area = this.vectorA.getBivectorMagnitude();

        this.ctx.fillStyle = '#8b5cf6';
        this.ctx.font = '14px sans-serif';
        this.ctx.fillText(
            `A∧B = ${area.toFixed(3)}e₁₂`,
            20,
            this.height - 60
        );
    }

    drawGeometricProduct() {
        // Show both inner and outer products
        this.drawInnerProduct();
        this.drawOuterProduct();

        // Show combined result
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.fillText(
            `AB = ${this.result.toString()}`,
            20,
            this.height - 30
        );
    }

    drawRotor() {
        const angle = Math.atan2(this.vectorC.e2, this.vectorC.e1);
        const degrees = angle * 180 / Math.PI;

        // Draw rotation arc
        const radius = 50;
        this.ctx.strokeStyle = '#8b5cf6';
        this.ctx.lineWidth = 2;

        this.ctx.beginPath();
        this.ctx.arc(this.originX, this.originY, radius, 0, -angle, true);
        this.ctx.stroke();

        // Arrow on arc
        const arrowAngle = -angle / 2;
        const arrowX = this.originX + radius * Math.cos(arrowAngle);
        const arrowY = this.originY + radius * Math.sin(arrowAngle);

        this.ctx.fillStyle = '#8b5cf6';
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.fillText(
            `${degrees.toFixed(1)}°`,
            arrowX + 10,
            arrowY
        );

        // Display rotor formula
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.font = '14px sans-serif';
        this.ctx.fillText(
            `R = exp(-${(angle/2).toFixed(3)}e₁₂/2)`,
            20,
            this.height - 60
        );
    }

    drawReflection() {
        const vecB = this.vectorB.getVector();
        const endB = this.toCanvas(vecB.x, vecB.y);

        // Draw mirror line (extended)
        this.ctx.strokeStyle = '#8b5cf6';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);

        const extension = 10;
        this.ctx.beginPath();
        this.ctx.moveTo(
            this.originX - vecB.x * this.scale * extension,
            this.originY + vecB.y * this.scale * extension
        );
        this.ctx.lineTo(
            this.originX + vecB.x * this.scale * extension,
            this.originY - vecB.y * this.scale * extension
        );
        this.ctx.stroke();

        this.ctx.setLineDash([]);

        // Label mirror line
        this.ctx.fillStyle = '#8b5cf6';
        this.ctx.font = '14px sans-serif';
        this.ctx.fillText('Mirror', endB.x + 10, endB.y);
    }

    drawProjection() {
        // Projection line already drawn in drawInnerProduct
        const vecA = this.vectorA.getVector();
        const vecB = this.vectorB.getVector();

        const proj = GAOperations.projection(this.vectorA, this.vectorB);
        const projVec = proj.getVector();

        // Draw perpendicular from A to projection
        const endA = this.toCanvas(vecA.x, vecA.y);
        const endProj = this.toCanvas(projVec.x, projVec.y);

        this.ctx.strokeStyle = '#f59e0b';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        this.ctx.beginPath();
        this.ctx.moveTo(endA.x, endA.y);
        this.ctx.lineTo(endProj.x, endProj.y);
        this.ctx.stroke();

        this.ctx.setLineDash([]);

        // Draw right angle marker
        const size = 10;
        const angle = Math.atan2(vecB.y, vecB.x);
        const perpAngle = angle + Math.PI / 2;

        this.ctx.strokeStyle = '#f59e0b';
        this.ctx.lineWidth = 1;

        this.ctx.beginPath();
        this.ctx.moveTo(endProj.x, endProj.y);
        this.ctx.lineTo(
            endProj.x + size * Math.cos(angle),
            endProj.y - size * Math.sin(angle)
        );
        this.ctx.moveTo(endProj.x, endProj.y);
        this.ctx.lineTo(
            endProj.x + size * Math.cos(perpAngle),
            endProj.y - size * Math.sin(perpAngle)
        );
        this.ctx.stroke();
    }

    drawLabels() {
        // Draw origin label
        this.ctx.fillStyle = '#6b7280';
        this.ctx.font = '12px sans-serif';
        this.ctx.fillText('O', this.originX - 15, this.originY + 15);
    }

    drawAngles() {
        const angle = this.getAngle(this.vectorA, this.vectorB);
        const degrees = angle * 180 / Math.PI;

        if (degrees > 1 && degrees < 179) {
            const radius = 30;
            const vecA = this.vectorA.getVector();
            const startAngle = -Math.atan2(vecA.y, vecA.x);

            this.ctx.strokeStyle = '#9ca3af';
            this.ctx.lineWidth = 1;

            this.ctx.beginPath();
            this.ctx.arc(this.originX, this.originY, radius, startAngle, startAngle - angle, true);
            this.ctx.stroke();

            // Angle label
            const labelAngle = startAngle - angle / 2;
            const labelX = this.originX + (radius + 20) * Math.cos(labelAngle);
            const labelY = this.originY + (radius + 20) * Math.sin(labelAngle);

            this.ctx.fillStyle = '#9ca3af';
            this.ctx.font = '12px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `${degrees.toFixed(1)}°`,
                labelX,
                labelY
            );
            this.ctx.textAlign = 'left';
        }
    }

    getAngle(a, b) {
        const vecA = a.getVector();
        const vecB = b.getVector();
        const dot = vecA.x * vecB.x + vecA.y * vecB.y;
        const magA = Math.sqrt(vecA.x * vecA.x + vecA.y * vecA.y);
        const magB = Math.sqrt(vecB.x * vecB.x + vecB.y * vecB.y);
        return Math.acos(Math.max(-1, Math.min(1, dot / (magA * magB))));
    }

    // Set operation
    setOperation(operation) {
        this.currentOperation = operation;
        this.updateResult();

        // Show/hide vector C controls
        const vectorCGroup = document.getElementById('vectorC-group');
        if (operation === 'rotor' || operation === 'reflection') {
            vectorCGroup.style.display = 'flex';
        } else {
            vectorCGroup.style.display = 'none';
        }

        this.render();
    }

    // Set vectors
    setVectorA(x, y) {
        this.vectorA = Multivector.fromVector(x, y);
        this.updateResult();
        this.render();
    }

    setVectorB(x, y) {
        this.vectorB = Multivector.fromVector(x, y);
        this.updateResult();
        this.render();
    }

    setVectorC(x, y) {
        this.vectorC = Multivector.fromVector(x, y);
        this.updateResult();
        this.render();
    }

    // Presets
    applyPreset(preset) {
        switch (preset) {
            case 'rotation90':
                this.vectorA = Multivector.fromVector(2, 0);
                this.vectorB = Multivector.fromVector(0, 2);
                this.setOperation('rotor');
                this.vectorC = Multivector.fromVector(
                    Math.cos(Math.PI / 4),
                    Math.sin(Math.PI / 4)
                );
                break;
            case 'rotation45':
                this.vectorA = Multivector.fromVector(2, 0);
                this.vectorB = Multivector.fromVector(
                    2 * Math.cos(Math.PI / 4),
                    2 * Math.sin(Math.PI / 4)
                );
                this.setOperation('rotor');
                this.vectorC = Multivector.fromVector(
                    Math.cos(Math.PI / 8),
                    Math.sin(Math.PI / 8)
                );
                break;
            case 'perpendicular':
                this.vectorA = Multivector.fromVector(2, 0);
                this.vectorB = Multivector.fromVector(0, 2);
                this.setOperation('outer');
                break;
            case 'parallel':
                this.vectorA = Multivector.fromVector(2, 1);
                this.vectorB = Multivector.fromVector(1, 0.5);
                this.setOperation('inner');
                break;
            case 'reflection':
                this.vectorA = Multivector.fromVector(2, 1);
                this.vectorB = Multivector.fromVector(1, 0);
                this.setOperation('reflection');
                this.vectorC = Multivector.fromVector(1, 1);
                break;
            case 'bivector':
                this.vectorA = Multivector.fromVector(2, 0);
                this.vectorB = Multivector.fromVector(0, 2);
                this.setOperation('outer');
                break;
        }

        // Update input fields
        this.updateVectorInputs('A');
        this.updateVectorInputs('B');
        this.updateVectorInputs('C');
    }

    // Animation
    async animateOperation() {
        if (this.animating) return;

        this.animating = true;
        this.animationProgress = 0;

        const startVector = this.vectorA;
        const endVector = this.result.isVector() ? this.result : this.vectorA;

        const animate = () => {
            this.animationProgress += 0.02 * this.animationSpeed;

            if (this.animationProgress >= 1) {
                this.animationProgress = 1;
                this.animating = false;
            }

            // Interpolate based on operation
            switch (this.currentOperation) {
                case 'rotor':
                    const angle = Math.atan2(this.vectorC.e2, this.vectorC.e1);
                    const currentAngle = angle * this.animationProgress;
                    const interpolated = GAOperations.rotation(this.vectorA, currentAngle);
                    this.vectorA = interpolated;
                    break;
            }

            this.updateResult();
            this.render();

            if (this.animating) {
                requestAnimationFrame(animate);
            } else {
                // Reset to original
                this.vectorA = startVector;
                this.updateResult();
                this.render();
            }
        };

        animate();
    }

    // Toggle display options
    toggleGrid(show) {
        this.showGrid = show;
        this.render();
    }

    toggleLabels(show) {
        this.showLabels = show;
        this.render();
    }

    toggleComponents(show) {
        this.showComponents = show;
        this.render();
    }

    toggleAngles(show) {
        this.showAngles = show;
        this.render();
    }

    setAnimationSpeed(speed) {
        this.animationSpeed = speed;
    }
}

// ============================================================================
// UI CONTROLLER
// ============================================================================

class UIController {
    constructor(visualizer) {
        this.visualizer = visualizer;
        this.setupOperationButtons();
        this.setupPresetButtons();
        this.setupVectorInputs();
        this.setupAnimationControls();
        this.setupDisplayOptions();
        this.setupOperationInfo();
    }

    setupOperationButtons() {
        const buttons = document.querySelectorAll('.op-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const operation = btn.dataset.op;
                this.visualizer.setOperation(operation);
                this.updateOperationInfo(operation);
            });
        });
    }

    setupPresetButtons() {
        const buttons = document.querySelectorAll('.preset-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                this.visualizer.applyPreset(preset);
            });
        });
    }

    setupVectorInputs() {
        // Vector A
        document.getElementById('vectorA-x').addEventListener('change', (e) => {
            const y = parseFloat(document.getElementById('vectorA-y').value);
            this.visualizer.setVectorA(parseFloat(e.target.value), y);
        });

        document.getElementById('vectorA-y').addEventListener('change', (e) => {
            const x = parseFloat(document.getElementById('vectorA-x').value);
            this.visualizer.setVectorA(x, parseFloat(e.target.value));
        });

        // Vector B
        document.getElementById('vectorB-x').addEventListener('change', (e) => {
            const y = parseFloat(document.getElementById('vectorB-y').value);
            this.visualizer.setVectorB(parseFloat(e.target.value), y);
        });

        document.getElementById('vectorB-y').addEventListener('change', (e) => {
            const x = parseFloat(document.getElementById('vectorB-x').value);
            this.visualizer.setVectorB(x, parseFloat(e.target.value));
        });

        // Vector C
        document.getElementById('vectorC-x').addEventListener('change', (e) => {
            const y = parseFloat(document.getElementById('vectorC-y').value);
            this.visualizer.setVectorC(parseFloat(e.target.value), y);
        });

        document.getElementById('vectorC-y').addEventListener('change', (e) => {
            const x = parseFloat(document.getElementById('vectorC-x').value);
            this.visualizer.setVectorC(x, parseFloat(e.target.value));
        });
    }

    setupAnimationControls() {
        const animateBtn = document.getElementById('animateBtn');
        animateBtn.addEventListener('click', () => {
            this.visualizer.animateOperation();
        });

        const speedSlider = document.getElementById('speedSlider');
        const speedValue = document.getElementById('speedValue');
        speedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            this.visualizer.setAnimationSpeed(speed);
            speedValue.textContent = speed.toFixed(1) + 'x';
        });
    }

    setupDisplayOptions() {
        document.getElementById('showGrid').addEventListener('change', (e) => {
            this.visualizer.toggleGrid(e.target.checked);
        });

        document.getElementById('showLabels').addEventListener('change', (e) => {
            this.visualizer.toggleLabels(e.target.checked);
        });

        document.getElementById('showComponents').addEventListener('change', (e) => {
            this.visualizer.toggleComponents(e.target.checked);
        });

        document.getElementById('showAngles').addEventListener('change', (e) => {
            this.visualizer.toggleAngles(e.target.checked);
        });
    }

    updateOperationInfo(operation) {
        const info = {
            addition: {
                title: 'Vector Addition',
                description: 'Combines two vectors using the parallelogram rule. The result is the diagonal of the parallelogram formed by the two vectors.',
                formula: 'C = A + B',
                detail: '<strong>Grade:</strong> 1 (vector)<br><strong>Commutative:</strong> Yes<br><strong>Associative:</strong> Yes'
            },
            subtraction: {
                title: 'Vector Subtraction',
                description: 'Finds the difference between two vectors. Geometrically, this is the vector from the tip of B to the tip of A when both start at the origin.',
                formula: 'C = A - B',
                detail: '<strong>Grade:</strong> 1 (vector)<br><strong>Commutative:</strong> No<br><strong>Associative:</strong> Yes'
            },
            inner: {
                title: 'Inner Product (Dot Product)',
                description: 'Measures the similarity between two vectors. Returns a scalar equal to the product of their magnitudes and the cosine of the angle between them.',
                formula: 'A·B = |A||B|cos(θ)',
                detail: '<strong>Grade:</strong> 0 (scalar)<br><strong>Commutative:</strong> Yes<br><strong>Geometric meaning:</strong> Projection length'
            },
            outer: {
                title: 'Outer Product (Wedge Product)',
                description: 'Creates a bivector representing the oriented area spanned by two vectors. The magnitude is the area of the parallelogram formed by the vectors.',
                formula: 'A∧B = |A||B|sin(θ)e₁₂',
                detail: '<strong>Grade:</strong> 2 (bivector)<br><strong>Commutative:</strong> No (anticommutative)<br><strong>Geometric meaning:</strong> Oriented area'
            },
            geometric: {
                title: 'Geometric Product',
                description: 'The fundamental product of geometric algebra, combining the inner and outer products. Contains both scalar (dot product) and bivector (wedge product) components.',
                formula: 'AB = A·B + A∧B',
                detail: '<strong>Grades:</strong> 0 + 2 (scalar + bivector)<br><strong>Commutative:</strong> No<br><strong>Invertible:</strong> Yes (for nonzero vectors)'
            },
            rotor: {
                title: 'Rotor Rotation',
                description: 'Rotates a vector using the "sandwich product" R*v*~R where R is a rotor (exponential of a bivector) and ~R is its reverse. Generalizes quaternions.',
                formula: "v' = RvR~ = exp(-Bθ/2) v exp(Bθ/2)",
                detail: '<strong>Grade:</strong> 1 (vector)<br><strong>Properties:</strong> Double-sided rotation<br><strong>Advantage:</strong> No gimbal lock'
            },
            reflection: {
                title: 'Reflection',
                description: 'Reflects a vector across a line through the origin using the formula n*v*n where n is the unit normal to the mirror line.',
                formula: "v' = nvn",
                detail: '<strong>Grade:</strong> 1 (vector)<br><strong>Properties:</strong> Two reflections = rotation<br><strong>Foundation:</strong> All isometries'
            },
            projection: {
                title: 'Projection',
                description: 'Projects one vector onto another, finding the component of A in the direction of B. The rejection (orthogonal component) can be found by subtraction.',
                formula: 'proj_B(A) = (A·B/B²)B',
                detail: '<strong>Grade:</strong> 1 (vector)<br><strong>Related:</strong> Rejection = A - proj_B(A)<br><strong>Properties:</strong> Linear operator'
            }
        };

        const opInfo = info[operation];
        const container = document.getElementById('operationInfo');

        container.innerHTML = `
            <div class="operation-title">${opInfo.title}</div>
            <div class="operation-description">${opInfo.description}</div>
            <div class="operation-formula">${opInfo.formula}</div>
            <div class="mathematical-detail">${opInfo.detail}</div>
        `;
    }

    setupOperationInfo() {
        this.updateOperationInfo('addition');
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gaCanvas');
    const visualizer = new GAVisualizer(canvas);
    const controller = new UIController(visualizer);

    console.log('Geometric Algebra Visualizer initialized');
    console.log('Part of the Constraint Theory Research Project');
});

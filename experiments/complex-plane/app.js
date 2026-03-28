// Complex Plane Explorer - Constraint Theory
// Geometric visualization of complex number operations

class Complex {
    constructor(real, imag = 0) {
        this.real = real;
        this.imag = imag;
    }

    // Complex arithmetic operations
    add(other) {
        return new Complex(this.real + other.real, this.imag + other.imag);
    }

    subtract(other) {
        return new Complex(this.real - other.real, this.imag - other.imag);
    }

    multiply(other) {
        return new Complex(
            this.real * other.real - this.imag * other.imag,
            this.real * other.imag + this.imag * other.real
        );
    }

    divide(other) {
        const denominator = other.real * other.real + other.imag * other.imag;
        if (denominator === 0) {
            throw new Error('Division by zero');
        }
        return new Complex(
            (this.real * other.real + this.imag * other.imag) / denominator,
            (this.imag * other.real - this.real * other.imag) / denominator
        );
    }

    power(n) {
        const r = Math.sqrt(this.real * this.real + this.imag * this.imag);
        const theta = Math.atan2(this.imag, this.real);

        const newR = Math.pow(r, n);
        const newTheta = n * theta;

        return new Complex(
            newR * Math.cos(newTheta),
            newR * Math.sin(newTheta)
        );
    }

    root(n) {
        const r = Math.sqrt(this.real * this.real + this.imag * this.imag);
        const theta = Math.atan2(this.imag, this.real);

        const newR = Math.pow(r, 1 / n);
        const newTheta = theta / n;

        return new Complex(
            newR * Math.cos(newTheta),
            newR * Math.sin(newTheta)
        );
    }

    exp() {
        const ea = Math.exp(this.real);
        return new Complex(
            ea * Math.cos(this.imag),
            ea * Math.sin(this.imag)
        );
    }

    log() {
        const r = Math.sqrt(this.real * this.real + this.imag * this.imag);
        const theta = Math.atan2(this.imag, this.real);
        return new Complex(Math.log(r), theta);
    }

    sin() {
        return new Complex(
            Math.sin(this.real) * Math.cosh(this.imag),
            Math.cos(this.real) * Math.sinh(this.imag)
        );
    }

    cos() {
        return new Complex(
            Math.cos(this.real) * Math.cosh(this.imag),
            -Math.sin(this.real) * Math.sinh(this.imag)
        );
    }

    // Get modulus (magnitude)
    get modulus() {
        return Math.sqrt(this.real * this.real + this.imag * this.imag);
    }

    // Get argument (angle)
    get argument() {
        return Math.atan2(this.imag, this.real);
    }

    // Get argument in degrees
    get argumentDegrees() {
        return this.argument * (180 / Math.PI);
    }

    // Convert to string
    toString() {
        const sign = this.imag >= 0 ? '+' : '-';
        return `${this.real.toFixed(2)} ${sign} ${Math.abs(this.imag).toFixed(2)}i`;
    }
}

class ComplexPlane {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Scale and offset
        this.scale = 80; // pixels per unit
        this.offsetX = this.width / 2;
        this.offsetY = this.height / 2;

        // Complex numbers
        this.z1 = new Complex(1, 0);
        this.z2 = new Complex(0, 1);
        this.result = new Complex(1, 1);

        // Display options
        this.showGrid = true;
        this.showUnitCircle = true;
        this.showAxes = true;
        this.showLabels = true;

        // Current operation
        this.operation = 'add';

        // Domain coloring
        this.domainColoring = 'none';
        this.domainColoringCache = null;

        // Animation
        this.animationProgress = 0;
        this.isAnimating = false;

        // Power n
        this.powerN = 2;

        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const real = (x - this.offsetX) / this.scale;
        const imag = -(y - this.offsetY) / this.scale;

        // Alternate between setting z1 and z2 based on click position
        const distToZ1 = this.distance(real, imag, this.z1.real, this.z1.imag);
        const distToZ2 = this.distance(real, imag, this.z2.real, this.z2.imag);

        if (distToZ1 < distToZ2) {
            this.z1 = new Complex(real, imag);
        } else {
            this.z2 = new Complex(real, imag);
        }

        this.updateResult();
        this.updateInputs();
        this.render();
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const real = (x - this.offsetX) / this.scale;
        const imag = -(y - this.offsetY) / this.scale;

        document.getElementById('realPart').textContent = real.toFixed(2);
        document.getElementById('imagPart').textContent = imag.toFixed(2);
    }

    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    toCanvasX(real) {
        return this.offsetX + real * this.scale;
    }

    toCanvasY(imag) {
        return this.offsetY - imag * this.scale;
    }

    updateResult() {
        switch (this.operation) {
            case 'add':
                this.result = this.z1.add(this.z2);
                break;
            case 'subtract':
                this.result = this.z1.subtract(this.z2);
                break;
            case 'multiply':
                this.result = this.z1.multiply(this.z2);
                break;
            case 'divide':
                try {
                    this.result = this.z1.divide(this.z2);
                } catch (e) {
                    this.result = new Complex(0, 0);
                }
                break;
            case 'power':
                this.result = this.z1.power(this.powerN);
                break;
            case 'root':
                this.result = this.z1.root(this.powerN);
                break;
            case 'exp':
                this.result = this.z1.exp();
                break;
            case 'log':
                this.result = this.z1.log();
                break;
            case 'sin':
                this.result = this.z1.sin();
                break;
            case 'cos':
                this.result = this.z1.cos();
                break;
        }

        this.updateResultDisplay();
        this.updateInterpretation();
    }

    updateResultDisplay() {
        document.getElementById('resultValue').textContent = this.result.toString();
        document.getElementById('resultModulus').textContent = this.result.modulus.toFixed(2);
        document.getElementById('resultArgument').textContent =
            this.result.argumentDegrees.toFixed(2) + '°';
    }

    updateInputs() {
        document.getElementById('z1Real').value = this.z1.real.toFixed(1);
        document.getElementById('z1Imag').value = this.z1.imag.toFixed(1);
        document.getElementById('z2Real').value = this.z2.real.toFixed(1);
        document.getElementById('z2Imag').value = this.z2.imag.toFixed(1);
    }

    updateInterpretation() {
        const interpretations = {
            add: `Addition: Geometrically adds the vectors. The parallelogram law shows that z₁ + z₂ is the diagonal of the parallelogram formed by z₁ and z₂ as sides.`,
            subtract: `Subtraction: z₁ - z₂ = z₁ + (-z₂). Geometrically, this is the vector from the tip of z₂ to the tip of z₁.`,
            multiply: `Multiplication: Multiplies moduli and adds arguments. |z₁ × z₂| = |z₁| × |z₂| and arg(z₁ × z₂) = arg(z₁) + arg(z₂). This rotates and scales.`,
            divide: `Division: Divides moduli and subtracts arguments. |z₁ ÷ z₂| = |z₁| ÷ |z₂| and arg(z₁ ÷ z₂) = arg(z₁) - arg(z₂).`,
            power: `Power: z₁^n raises the modulus to the nth power and multiplies the argument by n. |z₁^n| = |z₁|^n and arg(z₁^n) = n × arg(z₁).`,
            root: `Root: ⁿ√z₁ takes the nth root of the modulus and divides the argument by n. |ⁿ√z₁| = ⁿ√|z₁| and arg(ⁿ√z₁) = arg(z₁) / n.`,
            exp: `Exponential: e^z = e^(a+bi) = e^a(cos(b) + i·sin(b)). Maps horizontal lines to circles and vertical lines to rays.`,
            log: `Logarithm: ln(z) = ln|z| + i·arg(z). The principal branch has imaginary part in (-π, π].`,
            sin: `Sine: sin(z) = sin(a+bi) = sin(a)cosh(b) + i·cos(a)sinh(b). Periodic with period 2π.`,
            cos: `Cosine: cos(z) = cos(a+bi) = cos(a)cosh(b) - i·sin(a)sinh(b). Periodic with period 2π.`
        };

        document.getElementById('interpretation').innerHTML =
            `<p>${interpretations[this.operation]}</p>`;
    }

    // Domain coloring functions
    applyDomainColoring(z) {
        let result;

        switch (this.domainColoring) {
            case 'z2':
                result = z.power(2);
                break;
            case 'z3':
                result = z.power(3);
                break;
            case 'inverse':
                if (z.modulus < 0.001) return null;
                result = new Complex(1, 0).divide(z);
                break;
            case 'exp':
                result = z.exp();
                break;
            case 'sin':
                result = z.sin();
                break;
            case 'cos':
                result = z.cos();
                break;
            case 'mandelbrot':
                return this.mandelbrotColor(z);
            case 'julia':
                return this.juliaColor(z);
            default:
                return null;
        }

        return this.hslToRgb(
            (result.argumentDegrees + 180) / 360 * 360,
            0.8,
            Math.min(1, Math.log(result.modulus + 1) / 5)
        );
    }

    mandelbrotColor(z, maxIter = 50) {
        let c = z;
        let zIter = new Complex(0, 0);
        let iter = 0;

        while (zIter.modulus < 2 && iter < maxIter) {
            zIter = zIter.multiply(zIter).add(c);
            iter++;
        }

        if (iter === maxIter) return [0, 0, 0]; // Black for points in the set

        const hue = iter / maxIter * 360;
        return this.hslToRgb(hue, 0.8, 0.5);
    }

    juliaColor(z, c = new Complex(-0.7, 0.27015), maxIter = 50) {
        let zIter = z;
        let iter = 0;

        while (zIter.modulus < 2 && iter < maxIter) {
            zIter = zIter.multiply(zIter).add(c);
            iter++;
        }

        if (iter === maxIter) return [0, 0, 0];

        const hue = iter / maxIter * 360;
        return this.hslToRgb(hue, 0.8, 0.5);
    }

    hslToRgb(h, s, l) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h / 360 + 1/3);
            g = hue2rgb(p, q, h / 360);
            b = hue2rgb(p, q, h / 360 - 1/3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    renderDomainColoring() {
        if (this.domainColoring === 'none') return;

        const imageData = this.ctx.createImageData(this.width, this.height);
        const data = imageData.data;

        for (let py = 0; py < this.height; py++) {
            for (let px = 0; px < this.width; px++) {
                const real = (px - this.offsetX) / this.scale;
                const imag = -(py - this.offsetY) / this.scale;
                const z = new Complex(real, imag);

                const color = this.applyDomainColoring(z);
                const index = (py * this.width + px) * 4;

                if (color) {
                    data[index] = color[0];     // R
                    data[index + 1] = color[1]; // G
                    data[index + 2] = color[2]; // B
                    data[index + 3] = 255;      // A
                } else {
                    data[index] = 15;
                    data[index + 1] = 15;
                    data[index + 2] = 30;
                    data[index + 3] = 255;
                }
            }
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0f0f1e';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Render domain coloring if enabled
        if (this.domainColoring !== 'none') {
            this.renderDomainColoring();
        }

        // Draw grid
        if (this.showGrid) {
            this.drawGrid();
        }

        // Draw axes
        if (this.showAxes) {
            this.drawAxes();
        }

        // Draw unit circle
        if (this.showUnitCircle) {
            this.drawUnitCircle();
        }

        // Draw complex numbers
        this.drawComplexNumber(this.z1, '#ff6b6b', 'z₁');
        this.drawComplexNumber(this.z2, '#4ecdc4', 'z₂');
        this.drawComplexNumber(this.result, '#ffe66d', 'result');

        // Draw parallelogram for addition
        if (this.operation === 'add' || this.operation === 'subtract') {
            this.drawParallelogram();
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let i = -10; i <= 10; i++) {
            const x = this.toCanvasX(i);
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let i = -10; i <= 10; i++) {
            const y = this.toCanvasY(i);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    drawAxes() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;

        // Real axis
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.offsetY);
        this.ctx.lineTo(this.width, this.offsetY);
        this.ctx.stroke();

        // Imaginary axis
        this.ctx.beginPath();
        this.ctx.moveTo(this.offsetX, 0);
        this.ctx.lineTo(this.offsetX, this.height);
        this.ctx.stroke();

        // Labels
        if (this.showLabels) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.font = '12px Arial';
            this.ctx.fillText('Re', this.width - 30, this.offsetY - 10);
            this.ctx.fillText('Im', this.offsetX + 10, 20);
        }
    }

    drawUnitCircle() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        this.ctx.beginPath();
        this.ctx.arc(this.offsetX, this.offsetY, this.scale, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
    }

    drawComplexNumber(z, color, label) {
        const x = this.toCanvasX(z.real);
        const y = this.toCanvasY(z.imag);

        // Draw vector from origin
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.offsetX, this.offsetY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        // Draw point
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 8, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw label
        if (this.showLabels) {
            this.ctx.fillStyle = color;
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillText(label, x + 10, y - 10);
            this.ctx.font = '11px Courier New';
            this.ctx.fillText(z.toString(), x + 10, y + 5);
        }
    }

    drawParallelogram() {
        const z1x = this.toCanvasX(this.z1.real);
        const z1y = this.toCanvasY(this.z1.imag);
        const z2x = this.toCanvasX(this.z2.real);
        const z2y = this.toCanvasY(this.z2.imag);
        const resultX = this.toCanvasX(this.result.real);
        const resultY = this.toCanvasY(this.result.imag);

        this.ctx.strokeStyle = 'rgba(255, 230, 109, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        this.ctx.beginPath();
        this.ctx.moveTo(z1x, z1y);
        this.ctx.lineTo(resultX, resultY);
        this.ctx.lineTo(z2x, z2y);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
    }

    animate() {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.animationProgress = 0;

        const animateStep = () => {
            this.animationProgress += 0.02;

            if (this.animationProgress >= 1) {
                this.animationProgress = 1;
                this.isAnimating = false;
            }

            this.render();

            if (this.isAnimating) {
                requestAnimationFrame(animateStep);
            }
        };

        animateStep();
    }

    reset() {
        this.z1 = new Complex(1, 0);
        this.z2 = new Complex(0, 1);
        this.scale = 80;
        this.offsetX = this.width / 2;
        this.offsetY = this.height / 2;

        this.updateResult();
        this.updateInputs();
        this.render();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('complexPlane');
    const plane = new ComplexPlane(canvas);

    // Operation selector
    document.getElementById('operation').addEventListener('change', (e) => {
        plane.operation = e.target.value;
        plane.updateResult();
        plane.render();
    });

    // Domain coloring selector
    document.getElementById('domainColoring').addEventListener('change', (e) => {
        plane.domainColoring = e.target.value;
        plane.render();
    });

    // Display options
    document.getElementById('showGrid').addEventListener('change', (e) => {
        plane.showGrid = e.target.checked;
        plane.render();
    });

    document.getElementById('showUnitCircle').addEventListener('change', (e) => {
        plane.showUnitCircle = e.target.checked;
        plane.render();
    });

    document.getElementById('showAxes').addEventListener('change', (e) => {
        plane.showAxes = e.target.checked;
        plane.render();
    });

    document.getElementById('showLabels').addEventListener('change', (e) => {
        plane.showLabels = e.target.checked;
        plane.render();
    });

    // Number inputs
    const updateFromInputs = () => {
        const z1Real = parseFloat(document.getElementById('z1Real').value) || 0;
        const z1Imag = parseFloat(document.getElementById('z1Imag').value) || 0;
        const z2Real = parseFloat(document.getElementById('z2Real').value) || 0;
        const z2Imag = parseFloat(document.getElementById('z2Imag').value) || 0;

        plane.z1 = new Complex(z1Real, z1Imag);
        plane.z2 = new Complex(z2Real, z2Imag);

        plane.updateResult();
        plane.render();
    };

    ['z1Real', 'z1Imag', 'z2Real', 'z2Imag'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateFromInputs);
    });

    // Power N slider
    document.getElementById('powerN').addEventListener('input', (e) => {
        plane.powerN = parseInt(e.target.value);
        document.getElementById('powerNValue').textContent = e.target.value;
        plane.updateResult();
        plane.render();
    });

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', () => {
        plane.reset();
    });

    // Animate button
    document.getElementById('animateBtn').addEventListener('click', () => {
        plane.animate();
    });

    // Initial update
    plane.updateResult();
    plane.updateInterpretation();
});

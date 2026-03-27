// Fractal Dimension Calculator - Constraint Theory Research
// Demonstrates how geometric constraints create complexity through self-similarity

class FractalDimensionCalculator {
    constructor() {
        this.canvas = document.getElementById('fractalCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridCanvas = document.getElementById('gridCanvas');
        this.gridCtx = this.gridCanvas.getContext('2d');
        this.logLogCanvas = document.getElementById('logLogCanvas');
        this.logLogCtx = this.logLogCanvas.getContext('2d');

        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.imageData = null;

        // Fractal parameters
        this.fractalType = 'sierpinski';
        this.iterations = 5;
        this.zoom = 1.0;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.juliaC = { real: -0.7, imag: 0.27015 };
        this.lsystem = {
            axiom: 'F',
            rules: { 'F': 'F+F-F-F+F' },
            angle: 90
        };

        // Visualization parameters
        this.colorScheme = 'classic';
        this.showGlow = true;
        this.showGrid = false;
        this.animationId = null;

        // Box-counting parameters
        this.minBoxSize = 2;
        this.maxBoxSize = 64;
        this.boxScales = 8;
        this.boxCountingData = [];

        // Theoretical dimensions for validation
        this.theoreticalDimensions = {
            sierpinski: Math.log(3) / Math.log(2),  // ≈ 1.585
            koch: Math.log(4) / Math.log(3),         // ≈ 1.262
            mandelbrot: 2,                           // Border has dimension 2
            julia: 2,                                // Most have dimension 2
            barnsley: Math.log(4) / Math.log(2.5),  // ≈ 1.5 (approximate)
            dragon: Math.log(2) / Math.log(Math.sqrt(2)),  // ≈ 2
            lsystem: null                            // Depends on rules
        };

        this.theoreticalDescriptions = {
            sierpinski: 'log(3)/log(2) ≈ 1.585 - Sierpinski triangle',
            koch: 'log(4)/log(3) ≈ 1.262 - Koch snowflake',
            mandelbrot: '2.0 - Border of Mandelbrot set',
            julia: '≈ 2.0 - Most Julia sets',
            barnsley: '≈ 1.5 - Barnsley fern (approximate)',
            dragon: '2.0 - Dragon curve fills plane',
            lsystem: 'Depends on L-system rules'
        };

        this.initializeControls();
        this.generateFractal();
    }

    initializeControls() {
        // Fractal type selector
        document.getElementById('fractalType').addEventListener('change', (e) => {
            this.fractalType = e.target.value;
            this.updateControlVisibility();
            this.generateFractal();
        });

        // Iterations slider
        document.getElementById('iterations').addEventListener('input', (e) => {
            this.iterations = parseInt(e.target.value);
            document.getElementById('iterationsValue').textContent = this.iterations;
        });

        // Zoom slider
        document.getElementById('zoom').addEventListener('input', (e) => {
            this.zoom = parseFloat(e.target.value);
            document.getElementById('zoomValue').textContent = this.zoom.toFixed(1);
        });

        // Julia parameters
        document.getElementById('juliaReal').addEventListener('change', (e) => {
            this.juliaC.real = parseFloat(e.target.value);
        });
        document.getElementById('juliaImag').addEventListener('change', (e) => {
            this.juliaC.imag = parseFloat(e.target.value);
        });

        // L-system parameters
        document.getElementById('axiom').addEventListener('change', (e) => {
            this.lsystem.axiom = e.target.value;
        });
        document.getElementById('rules').addEventListener('change', (e) => {
            const rule = e.target.value.split('=');
            if (rule.length === 2) {
                this.lsystem.rules[rule[0].trim()] = rule[1].trim();
            }
        });
        document.getElementById('angle').addEventListener('change', (e) => {
            this.lsystem.angle = parseFloat(e.target.value);
        });

        // Box-counting controls
        document.getElementById('minBoxSize').addEventListener('input', (e) => {
            this.minBoxSize = parseInt(e.target.value);
            document.getElementById('minBoxSizeValue').textContent = this.minBoxSize;
        });

        document.getElementById('maxBoxSize').addEventListener('input', (e) => {
            this.maxBoxSize = parseInt(e.target.value);
            document.getElementById('maxBoxSizeValue').textContent = this.maxBoxSize;
        });

        document.getElementById('boxScales').addEventListener('input', (e) => {
            this.boxScales = parseInt(e.target.value);
            document.getElementById('boxScalesValue').textContent = this.boxScales;
        });

        // Buttons
        document.getElementById('generate').addEventListener('click', () => {
            this.generateFractal();
        });

        document.getElementById('reset').addEventListener('click', () => {
            this.resetView();
        });

        document.getElementById('calculateDimension').addEventListener('click', () => {
            this.calculateFractalDimension();
        });

        document.getElementById('toggleGrid').addEventListener('click', () => {
            this.showGrid = !this.showGrid;
            this.drawGridOverlay();
        });

        document.getElementById('animateGrowth').addEventListener('click', () => {
            this.animateGrowth();
        });

        // Visualization controls
        document.getElementById('colorScheme').addEventListener('change', (e) => {
            this.colorScheme = e.target.value;
            this.generateFractal();
        });

        document.getElementById('showGlow').addEventListener('change', (e) => {
            this.showGlow = e.target.checked;
            this.generateFractal();
        });

        // Canvas click for zoom (Mandelbrot/Julia)
        this.canvas.addEventListener('click', (e) => {
            if (this.fractalType === 'mandelbrot' || this.fractalType === 'julia') {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Convert to complex plane coordinates
                const aspectRatio = this.width / this.height;
                const scale = 4.0 / this.zoom;

                const real = (x / this.width - 0.5) * scale * aspectRatio;
                const imag = (y / this.height - 0.5) * scale;

                // Set new center and zoom in
                this.centerX = real;
                this.centerY = imag;
                this.zoom *= 2;

                document.getElementById('zoom').value = Math.min(this.zoom, 10);
                document.getElementById('zoomValue').textContent = this.zoom.toFixed(1);

                this.generateFractal();
            }
        });
    }

    updateControlVisibility() {
        // Show/hide Julia parameters
        document.getElementById('juliaParams').style.display =
            this.fractalType === 'julia' ? 'block' : 'none';

        // Show/hide L-system parameters
        document.getElementById('lsystemParams').style.display =
            this.fractalType === 'lsystem' ? 'block' : 'none';

        // Update theoretical dimension display
        const theoretical = this.theoreticalDimensions[this.fractalType];
        document.getElementById('theoreticalDim').textContent =
            theoretical !== null ? theoretical.toFixed(4) : 'Unknown';
        document.getElementById('theoreticalDesc').textContent =
            this.theoreticalDescriptions[this.fractalType];
    }

    resetView() {
        this.zoom = 1.0;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        document.getElementById('zoom').value = 1;
        document.getElementById('zoomValue').textContent = '1.0';
        this.generateFractal();
    }

    generateFractal() {
        const startTime = performance.now();

        // Clear canvas
        this.ctx.fillStyle = '#0a0e1a';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Apply glow effect
        if (this.showGlow) {
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = this.getGlowColor();
        } else {
            this.ctx.shadowBlur = 0;
        }

        // Generate fractal based on type
        switch (this.fractalType) {
            case 'sierpinski':
                this.generateSierpinski();
                break;
            case 'koch':
                this.generateKoch();
                break;
            case 'mandelbrot':
                this.generateMandelbrot();
                break;
            case 'julia':
                this.generateJulia();
                break;
            case 'barnsley':
                this.generateBarnsley();
                break;
            case 'dragon':
                this.generateDragon();
                break;
            case 'lsystem':
                this.generateLSystem();
                break;
        }

        // Store image data for box-counting
        this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);

        const endTime = performance.now();
        document.getElementById('renderTime').textContent =
            `${(endTime - startTime).toFixed(2)} ms`;

        // Update constraint insight
        this.updateConstraintInsight();
    }

    getColor(intensity, maxIterations = 100) {
        const normalizedIntensity = intensity / maxIterations;

        switch (this.colorScheme) {
            case 'fire':
                return this.getFireColor(normalizedIntensity);
            case 'ocean':
                return this.getOceanColor(normalizedIntensity);
            case 'monochrome':
                return this.getMonochromeColor(normalizedIntensity);
            case 'rainbow':
                return this.getRainbowColor(normalizedIntensity);
            case 'classic':
            default:
                return this.getClassicColor(normalizedIntensity);
        }
    }

    getClassicColor(t) {
        // Classic fractal coloring
        const r = Math.floor(9 * (1 - t) * t * t * t * 255);
        const g = Math.floor(15 * (1 - t) * (1 - t) * t * t * 255);
        const b = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255);
        return `rgb(${r}, ${g}, ${b})`;
    }

    getFireColor(t) {
        // Fire gradient: black -> red -> orange -> yellow -> white
        const r = Math.floor(Math.min(255, t * 3 * 255));
        const g = Math.floor(Math.min(255, Math.max(0, (t - 0.33) * 3 * 255)));
        const b = Math.floor(Math.min(255, Math.max(0, (t - 0.67) * 3 * 255)));
        return `rgb(${r}, ${g}, ${b})`;
    }

    getOceanColor(t) {
        // Ocean gradient: deep blue -> cyan -> white
        const r = Math.floor(Math.min(255, Math.max(0, (t - 0.5) * 2 * 255)));
        const g = Math.floor(Math.min(255, t * 2 * 255));
        const b = Math.floor(Math.min(255, 100 + t * 155));
        return `rgb(${r}, ${g}, ${b})`;
    }

    getMonochromeColor(t) {
        const value = Math.floor(t * 255);
        return `rgb(${value}, ${value}, ${value})`;
    }

    getRainbowColor(t) {
        // Rainbow using HSL
        const hue = t * 360;
        return `hsl(${hue}, 100%, 50%)`;
    }

    getGlowColor() {
        switch (this.colorScheme) {
            case 'fire': return '#ff4400';
            case 'ocean': return '#00aaff';
            case 'monochrome': return '#ffffff';
            case 'rainbow': return '#ff00ff';
            default: return '#00ff88';
        }
    }

    // FRACTAL GENERATORS

    generateSierpinski() {
        const size = Math.min(this.width, this.height) * 0.9 * this.zoom;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const height = size * Math.sqrt(3) / 2;

        const triangle = [
            { x: centerX, y: centerY - height * 2 / 3 },
            { x: centerX - size / 2, y: centerY + height / 3 },
            { x: centerX + size / 2, y: centerY + height / 3 }
        ];

        this.drawSierpinskiRecursive(triangle, this.iterations);
    }

    drawSierpinskiRecursive(triangle, depth) {
        if (depth === 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(triangle[0].x, triangle[0].y);
            this.ctx.lineTo(triangle[1].x, triangle[1].y);
            this.ctx.lineTo(triangle[2].x, triangle[2].y);
            this.ctx.closePath();

            const intensity = 1 - (this.iterations / 15);
            this.ctx.fillStyle = this.getColor(intensity);
            this.ctx.fill();
            return;
        }

        // Calculate midpoints
        const mid1 = {
            x: (triangle[0].x + triangle[1].x) / 2,
            y: (triangle[0].y + triangle[1].y) / 2
        };
        const mid2 = {
            x: (triangle[1].x + triangle[2].x) / 2,
            y: (triangle[1].y + triangle[2].y) / 2
        };
        const mid3 = {
            x: (triangle[2].x + triangle[0].x) / 2,
            y: (triangle[2].y + triangle[0].y) / 2
        };

        // Recursively draw three smaller triangles
        this.drawSierpinskiRecursive([triangle[0], mid1, mid3], depth - 1);
        this.drawSierpinskiRecursive([mid1, triangle[1], mid2], depth - 1);
        this.drawSierpinskiRecursive([mid3, mid2, triangle[2]], depth - 1);
    }

    generateKoch() {
        const size = Math.min(this.width, this.height) * 0.7 * this.zoom;
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // Start with a triangle
        const height = size * Math.sqrt(3) / 2;
        const p1 = { x: centerX, y: centerY - height * 2 / 3 };
        const p2 = { x: centerX - size / 2, y: centerY + height / 3 };
        const p3 = { x: centerX + size / 2, y: centerY + height / 3 };

        this.ctx.strokeStyle = this.getColor(0.8);
        this.ctx.lineWidth = 2;

        this.drawKochLine(p1, p2, this.iterations);
        this.drawKochLine(p2, p3, this.iterations);
        this.drawKochLine(p3, p1, this.iterations);
        this.ctx.stroke();
    }

    drawKochLine(p1, p2, depth) {
        if (depth === 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
            return;
        }

        // Calculate the four points for Koch curve
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;

        const pa = {
            x: p1.x + dx / 3,
            y: p1.y + dy / 3
        };

        const pc = {
            x: p1.x + 2 * dx / 3,
            y: p1.y + 2 * dy / 3
        };

        // Calculate the peak point (rotated 60 degrees)
        const cos60 = 0.5;
        const sin60 = Math.sqrt(3) / 2;

        const pb = {
            x: pa.x + (pc.x - pa.x) * cos60 - (pc.y - pa.y) * sin60,
            y: pa.y + (pc.x - pa.x) * sin60 + (pc.y - pa.y) * cos60
        };

        // Recursively draw four segments
        this.drawKochLine(p1, pa, depth - 1);
        this.drawKochLine(pa, pb, depth - 1);
        this.drawKochLine(pb, pc, depth - 1);
        this.drawKochLine(pc, p2, depth - 1);
    }

    generateMandelbrot() {
        const maxIterations = 100 + this.iterations * 10;
        const imageData = this.ctx.createImageData(this.width, this.height);
        const data = imageData.data;

        const aspectRatio = this.width / this.height;
        const scale = 4.0 / this.zoom;

        for (let px = 0; px < this.width; px++) {
            for (let py = 0; py < this.height; py++) {
                const x0 = (px / this.width - 0.5) * scale * aspectRatio - 0.5;
                const y0 = (py / this.height - 0.5) * scale;

                let x = 0, y = 0;
                let iteration = 0;

                while (x * x + y * y <= 4 && iteration < maxIterations) {
                    const xtemp = x * x - y * y + x0;
                    y = 2 * x * y + y0;
                    x = xtemp;
                    iteration++;
                }

                const idx = (py * this.width + px) * 4;
                if (iteration === maxIterations) {
                    // Inside the set - black
                    data[idx] = 0;
                    data[idx + 1] = 0;
                    data[idx + 2] = 0;
                    data[idx + 3] = 255;
                } else {
                    // Outside - color based on escape time
                    const color = this.getColor(iteration / maxIterations, 1);
                    const rgb = this.parseColor(color);
                    data[idx] = rgb.r;
                    data[idx + 1] = rgb.g;
                    data[idx + 2] = rgb.b;
                    data[idx + 3] = 255;
                }
            }
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    generateJulia() {
        const maxIterations = 100 + this.iterations * 10;
        const imageData = this.ctx.createImageData(this.width, this.height);
        const data = imageData.data;

        const aspectRatio = this.width / this.height;
        const scale = 4.0 / this.zoom;

        for (let px = 0; px < this.width; px++) {
            for (let py = 0; py < this.height; py++) {
                let x = (px / this.width - 0.5) * scale * aspectRatio;
                let y = (py / this.height - 0.5) * scale;

                let iteration = 0;

                while (x * x + y * y <= 4 && iteration < maxIterations) {
                    const xtemp = x * x - y * y + this.juliaC.real;
                    y = 2 * x * y + this.juliaC.imag;
                    x = xtemp;
                    iteration++;
                }

                const idx = (py * this.width + px) * 4;
                if (iteration === maxIterations) {
                    data[idx] = 0;
                    data[idx + 1] = 0;
                    data[idx + 2] = 0;
                    data[idx + 3] = 255;
                } else {
                    const color = this.getColor(iteration / maxIterations, 1);
                    const rgb = this.parseColor(color);
                    data[idx] = rgb.r;
                    data[idx + 1] = rgb.g;
                    data[idx + 2] = rgb.b;
                    data[idx + 3] = 255;
                }
            }
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    generateBarnsley() {
        const points = 100000 * this.iterations;
        const imageData = this.ctx.createImageData(this.width, this.height);
        const data = imageData.data;

        // Initialize
        let x = 0, y = 0;

        // Generate points using IFS
        for (let i = 0; i < points; i++) {
            const r = Math.random();
            let nextX, nextY;

            if (r < 0.01) {
                // Stem
                nextX = 0;
                nextY = 0.16 * y;
            } else if (r < 0.86) {
                // Smaller leaflets
                nextX = 0.85 * x + 0.04 * y;
                nextY = -0.04 * x + 0.85 * y + 1.6;
            } else if (r < 0.93) {
                // Left largest leaflet
                nextX = 0.2 * x - 0.26 * y;
                nextY = 0.23 * x + 0.22 * y + 1.6;
            } else {
                // Right largest leaflet
                nextX = -0.15 * x + 0.28 * y;
                nextY = 0.26 * x + 0.24 * y + 0.44;
            }

            x = nextX;
            y = nextY;

            // Map to canvas coordinates
            const px = Math.floor(this.width / 2 + x * this.width * 0.1 * this.zoom);
            const py = Math.floor(this.height - y * this.height * 0.1 * this.zoom);

            if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
                const idx = (py * this.width + px) * 4;
                const intensity = Math.min(255, data[idx] + 2);

                const color = this.getColor(intensity / 255, 1);
                const rgb = this.parseColor(color);

                data[idx] = Math.min(255, data[idx] + rgb.r * 0.1);
                data[idx + 1] = Math.min(255, data[idx + 1] + rgb.g * 0.1);
                data[idx + 2] = Math.min(255, data[idx + 2] + rgb.b * 0.1);
                data[idx + 3] = 255;
            }
        }

        this.ctx.putImageData(imageData, 0, 0);
    }

    generateDragon() {
        const maxIterations = Math.min(15, this.iterations + 5);
        let sequence = 'R';

        // Generate the sequence
        for (let i = 0; i < maxIterations; i++) {
            let newSequence = 'R';
            for (let j = sequence.length - 1; j >= 0; j--) {
                if (sequence[j] === 'R') {
                    newSequence += 'L';
                } else {
                    newSequence += 'R';
                }
            }
            sequence = newSequence;
        }

        // Draw the curve
        const size = Math.min(this.width, this.height) * 0.8 * this.zoom;
        let x = this.width / 2 - size / 4;
        let y = this.height / 2 + size / 4;
        let direction = 0; // 0: right, 1: up, 2: left, 3: down

        const stepSize = size / Math.pow(2, maxIterations / 2);

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.strokeStyle = this.getColor(0.8);
        this.ctx.lineWidth = 1;

        for (let i = 0; i < sequence.length; i++) {
            // Move forward
            switch (direction) {
                case 0: x += stepSize; break;
                case 1: y -= stepSize; break;
                case 2: x -= stepSize; break;
                case 3: y += stepSize; break;
            }
            this.ctx.lineTo(x, y);

            // Turn
            if (sequence[i] === 'R') {
                direction = (direction + 1) % 4;
            } else {
                direction = (direction + 3) % 4;
            }
        }

        this.ctx.stroke();
    }

    generateLSystem() {
        // Generate L-system string
        let currentString = this.lsystem.axiom;

        for (let i = 0; i < this.iterations; i++) {
            let nextString = '';
            for (const char of currentString) {
                if (this.lsystem.rules[char]) {
                    nextString += this.lsystem.rules[char];
                } else {
                    nextString += char;
                }
            }
            currentString = nextString;
        }

        // Draw L-system
        const size = Math.min(this.width, this.height) * 0.8 * this.zoom;
        let x = this.width / 2;
        let y = this.height * 0.9;
        let angle = -90; // Start pointing up
        const angleRad = this.lsystem.angle * Math.PI / 180;
        const stepSize = size / Math.pow(2, this.iterations);

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.strokeStyle = this.getColor(0.8);
        this.ctx.lineWidth = 2;

        const stack = [];

        for (const char of currentString) {
            switch (char) {
                case 'F':
                case 'G':
                    // Draw forward
                    const newX = x + stepSize * Math.cos(angle * Math.PI / 180);
                    const newY = y + stepSize * Math.sin(angle * Math.PI / 180);
                    this.ctx.lineTo(newX, newY);
                    x = newX;
                    y = newY;
                    break;
                case '+':
                    // Turn right
                    angle += this.lsystem.angle;
                    break;
                case '-':
                    // Turn left
                    angle -= this.lsystem.angle;
                    break;
                case '[':
                    // Push state
                    stack.push({ x, y, angle });
                    break;
                case ']':
                    // Pop state
                    if (stack.length > 0) {
                        const state = stack.pop();
                        x = state.x;
                        y = state.y;
                        angle = state.angle;
                        this.ctx.moveTo(x, y);
                    }
                    break;
            }
        }

        this.ctx.stroke();
    }

    parseColor(color) {
        // Parse color string to RGB
        if (color.startsWith('rgb')) {
            const match = color.match(/\d+/g);
            return { r: parseInt(match[0]), g: parseInt(match[1]), b: parseInt(match[2]) };
        } else if (color.startsWith('hsl')) {
            const match = color.match(/\d+/g);
            const h = parseInt(match[0]) / 360;
            const s = parseInt(match[1]) / 100;
            const l = parseInt(match[2]) / 100;

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
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }

            return {
                r: Math.round(r * 255),
                g: Math.round(g * 255),
                b: Math.round(b * 255)
            };
        }

        return { r: 0, g: 255, b: 136 };
    }

    // BOX-COUNTING DIMENSION CALCULATION

    calculateFractalDimension() {
        this.boxCountingData = [];
        let totalBoxes = 0;

        const scaleStep = (this.maxBoxSize - this.minBoxSize) / (this.boxScales - 1);

        for (let i = 0; i < this.boxScales; i++) {
            const boxSize = Math.round(this.minBoxSize + i * scaleStep);
            const count = this.countBoxes(boxSize);
            totalBoxes += count;

            this.boxCountingData.push({
                boxSize: boxSize,
                epsilon: boxSize / Math.min(this.width, this.height),
                count: count,
                logEpsilon: Math.log(1 / (boxSize / Math.min(this.width, this.height))),
                logCount: Math.log(count)
            });
        }

        // Calculate linear regression
        const regression = this.linearRegression(
            this.boxCountingData.map(d => d.logEpsilon),
            this.boxCountingData.map(d => d.logCount)
        );

        // Update display
        document.getElementById('calculatedDim').textContent = regression.slope.toFixed(4);
        document.getElementById('boxesAnalyzed').textContent = totalBoxes.toLocaleString();
        document.getElementById('rSquared').textContent = regression.rSquared.toFixed(4);

        // Calculate error if theoretical dimension is known
        const theoretical = this.theoreticalDimensions[this.fractalType];
        if (theoretical !== null) {
            const error = Math.abs(regression.slope - theoretical);
            document.getElementById('dimensionError').textContent = error.toFixed(4);
        } else {
            document.getElementById('dimensionError').textContent = 'N/A';
        }

        // Draw log-log plot
        this.drawLogLogPlot(regression);

        // Show grid overlay at the smallest scale
        this.showGrid = true;
        this.drawGridOverlay();
    }

    countBoxes(boxSize) {
        const cols = Math.ceil(this.width / boxSize);
        const rows = Math.ceil(this.height / boxSize);
        let count = 0;

        // Get image data
        const data = this.imageData.data;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let hasPixel = false;

                // Check if any pixel in this box is part of the fractal
                for (let y = row * boxSize; y < (row + 1) * boxSize && y < this.height; y++) {
                    for (let x = col * boxSize; x < (col + 1) * boxSize && x < this.width; x++) {
                        const idx = (y * this.width + x) * 4;
                        // Check if pixel is not black (has some color)
                        if (data[idx] > 10 || data[idx + 1] > 10 || data[idx + 2] > 10) {
                            hasPixel = true;
                            break;
                        }
                    }
                    if (hasPixel) break;
                }

                if (hasPixel) count++;
            }
        }

        return count;
    }

    linearRegression(xValues, yValues) {
        const n = xValues.length;
        const sumX = xValues.reduce((a, b) => a + b, 0);
        const sumY = yValues.reduce((a, b) => a + b, 0);
        const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
        const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
        const sumYY = yValues.reduce((sum, y) => sum + y * y, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Calculate R²
        const ssTot = sumYY - (sumY * sumY) / n;
        const ssRes = yValues.reduce((sum, y, i) => {
            const predicted = slope * xValues[i] + intercept;
            return sum + (y - predicted) ** 2;
        }, 0);
        const rSquared = 1 - ssRes / ssTot;

        return { slope, intercept, rSquared };
    }

    drawLogLogPlot(regression) {
        const ctx = this.logLogCtx;
        const width = this.logLogCanvas.width;
        const height = this.logLogCanvas.height;

        // Clear canvas
        ctx.fillStyle = '#0a0e1a';
        ctx.fillRect(0, 0, width, height);

        // Set margins
        const margin = { top: 20, right: 20, bottom: 50, left: 60 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;

        // Find data ranges
        const xMin = Math.min(...this.boxCountingData.map(d => d.logEpsilon));
        const xMax = Math.max(...this.boxCountingData.map(d => d.logEpsilon));
        const yMin = Math.min(...this.boxCountingData.map(d => d.logCount));
        const yMax = Math.max(...this.boxCountingData.map(d => d.logCount));

        const xRange = xMax - xMin || 1;
        const yRange = yMax - yMin || 1;

        // Helper function to convert data coordinates to plot coordinates
        const toPlotX = (x) => margin.left + ((x - xMin) / xRange) * plotWidth;
        const toPlotY = (y) => margin.top + plotHeight - ((y - yMin) / yRange) * plotHeight;

        // Draw grid
        ctx.strokeStyle = '#1a1f2e';
        ctx.lineWidth = 1;

        for (let i = 0; i <= 5; i++) {
            const x = margin.left + (plotWidth / 5) * i;
            ctx.beginPath();
            ctx.moveTo(x, margin.top);
            ctx.lineTo(x, margin.top + plotHeight);
            ctx.stroke();

            const y = margin.top + (plotHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(margin.left, y);
            ctx.lineTo(margin.left + plotWidth, y);
            ctx.stroke();
        }

        // Draw axes
        ctx.strokeStyle = '#3a4a5a';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(margin.left, margin.top);
        ctx.lineTo(margin.left, margin.top + plotHeight);
        ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight);
        ctx.stroke();

        // Draw axis labels
        ctx.fillStyle = '#8b9bb4';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';

        // X-axis labels
        for (let i = 0; i <= 5; i++) {
            const x = margin.left + (plotWidth / 5) * i;
            const value = xMin + (xRange / 5) * i;
            ctx.fillText(value.toFixed(2), x, margin.top + plotHeight + 20);
        }

        // Y-axis labels
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const y = margin.top + (plotHeight / 5) * i;
            const value = yMax - (yRange / 5) * i;
            ctx.fillText(value.toFixed(2), margin.left - 10, y + 4);
        }

        // Axis titles
        ctx.textAlign = 'center';
        ctx.font = '14px monospace';
        ctx.fillText('log(1/ε)', margin.left + plotWidth / 2, height - 10);

        ctx.save();
        ctx.translate(15, margin.top + plotHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('log(N)', 0, 0);
        ctx.restore();

        // Draw data points
        ctx.fillStyle = '#00ff88';
        for (const point of this.boxCountingData) {
            const x = toPlotX(point.logEpsilon);
            const y = toPlotY(point.logCount);

            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw best fit line
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const startX = xMin;
        const startY = regression.slope * startX + regression.intercept;
        const endX = xMax;
        const endY = regression.slope * endX + regression.intercept;

        ctx.moveTo(toPlotX(startX), toPlotY(startY));
        ctx.lineTo(toPlotX(endX), toPlotY(endY));
        ctx.stroke();

        // Draw equation
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        const equation = `D = ${regression.slope.toFixed(4)}`;
        ctx.fillText(equation, margin.left + 10, margin.top + 20);
    }

    drawGridOverlay() {
        const ctx = this.gridCtx;
        ctx.clearRect(0, 0, this.width, this.height);

        if (!this.showGrid) return;

        // Draw grid at the smallest box size
        const boxSize = this.minBoxSize;
        const cols = Math.ceil(this.width / boxSize);
        const rows = Math.ceil(this.height / boxSize);

        ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.lineWidth = 1;

        // Draw grid lines
        for (let i = 0; i <= cols; i++) {
            ctx.beginPath();
            ctx.moveTo(i * boxSize, 0);
            ctx.lineTo(i * boxSize, this.height);
            ctx.stroke();
        }

        for (let i = 0; i <= rows; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * boxSize);
            ctx.lineTo(this.width, i * boxSize);
            ctx.stroke();
        }

        // Highlight occupied boxes
        const data = this.imageData.data;
        ctx.fillStyle = 'rgba(255, 100, 100, 0.2)';

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let hasPixel = false;

                for (let y = row * boxSize; y < (row + 1) * boxSize && y < this.height; y++) {
                    for (let x = col * boxSize; x < (col + 1) * boxSize && x < this.width; x++) {
                        const idx = (y * this.width + x) * 4;
                        if (data[idx] > 10 || data[idx + 1] > 10 || data[idx + 2] > 10) {
                            hasPixel = true;
                            break;
                        }
                    }
                    if (hasPixel) break;
                }

                if (hasPixel) {
                    ctx.fillRect(col * boxSize, row * boxSize, boxSize, boxSize);
                }
            }
        }
    }

    animateGrowth() {
        let currentIteration = 1;
        const maxIteration = this.iterations;

        const animate = () => {
            if (currentIteration > maxIteration) {
                return;
            }

            this.iterations = currentIteration;
            this.generateFractal();

            currentIteration++;
            this.animationId = requestAnimationFrame(animate);
        };

        // Cancel any existing animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        animate();
    }

    updateConstraintInsight() {
        const insights = {
            sierpinski: `The Sierpinski triangle emerges from recursively removing triangular sub-regions.
                        Each iteration applies the same geometric constraint: "remove the middle triangle".
                        The resulting dimension D ≈ 1.585 reflects how this constraint fills space more than
                        a 1D line but less than a 2D area. This demonstrates how simple constraints create
                        scale-invariant complexity.`,

            koch: `The Koch snowflake is generated by repeatedly replacing line segments with four smaller
                  segments forming a "bump". The constraint "add a triangular bump" creates a curve with
                  infinite length but finite area. The dimension D ≈ 1.262 shows how this constraint system
                  creates complexity at every scale, balancing between smooth curves and space-filling shapes.`,

            mandelbrot: `The Mandelbrot set emerges from the constraint "z_{n+1} = z_n^2 + c" applied iteratively.
                        Points that don't escape to infinity form the set. The border has dimension 2.0,
                        meaning it's so complex it's essentially area-filling. This shows how a simple
                        algebraic constraint can create maximal geometric complexity.`,

            julia: `Julia sets use the same iteration constraint as the Mandelbrot set but fix c and vary
                    the starting point z_0. Different c values create different constraint systems with
                    different dimensions. This demonstrates how parameterizing geometric constraints
                    creates a family of related but distinct structures.`,

            barnsley: `The Barnsley fern uses an Iterated Function System (IFS) - four affine transformations
                      applied randomly. The constraint "apply one of these transformations" creates a
                      natural-looking fern pattern. The dimension D ≈ 1.5 reflects how this random constraint
                      system balances between sparse and dense filling of space.`,

            dragon: `The dragon curve folds a line segment repeatedly using alternating left and right folds.
                     The constraint "fold in alternating directions" creates a curve that eventually fills
                     the plane (D = 2.0). This shows how simple directional constraints can create
                     space-filling complexity through self-avoiding random walks.`,

            lsystem: `L-systems use string rewriting rules as constraints. Starting from an axiom,
                      each character is replaced according to rules, then interpreted as drawing commands.
                      Different rule sets create different dimensions. This demonstrates how symbolic
                      constraints can generate geometric complexity through simple substitution rules.`
        };

        document.getElementById('constraintInsight').textContent = insights[this.fractalType];
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new FractalDimensionCalculator();
});

// Mandelbrot Set Deep Zoom Simulator
// Demonstrates infinite complexity from simple geometric constraint: z → z² + c

class MandelbrotRenderer {
    constructor(canvasId, minimapCanvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.getElementById(minimapCanvasId);
        this.minimapCtx = this.minimapCanvas.getContext('2d');

        // View state
        this.centerX = -0.5;
        this.centerY = 0;
        this.zoom = 1;
        this.viewHistory = [];

        // Rendering parameters
        this.maxIterations = 500;
        this.escapeRadius = 2;
        this.colorScheme = 'classic';
        this.juliaMode = false;
        this.juliaC = { real: -0.7, imag: 0.27015 };

        // Animation state
        this.isAnimating = false;
        this.animationSpeed = 5;
        this.animationTarget = null;

        // Performance
        this.worker = null;
        this.renderStartTime = 0;

        // Famous locations (bookmarks)
        this.bookmarks = {
            seahorse: { x: -0.743643887037158704752191506114774, y: 0.131825904205311970493132056385139, zoom: 100000000 },
            elephant: { x: 0.275, y: 0.006, zoom: 1000 },
            mini: { x: -1.75, y: 0, zoom: 100 },
            spiral: { x: -0.761574, y: -0.0847596, zoom: 100000 },
            lightning: { x: -0.170337, y: -1.06506, zoom: 1000000 }
        };

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupWorker();
        this.setupEventListeners();
        this.updateDisplay();
        this.render();
    }

    setupCanvas() {
        // Main canvas
        const container = this.canvas.parentElement;
        this.canvas.width = Math.min(800, container.clientWidth - 20);
        this.canvas.height = Math.min(600, window.innerHeight - 300);

        // Minimap
        this.minimapCanvas.width = 200;
        this.minimapCanvas.height = 150;

        document.getElementById('resolution').textContent =
            `${this.canvas.width}x${this.canvas.height}`;
    }

    setupWorker() {
        // Create Web Worker for computation
        const workerCode = `
            self.onmessage = function(e) {
                const {
                    width, height,
                    centerX, centerY, zoom,
                    maxIterations, escapeRadius,
                    juliaMode, juliaC,
                    startRow, endRow
                } = e.data;

                const aspectRatio = width / height;
                const scale = 4 / zoom;
                const xMin = centerX - (scale * aspectRatio) / 2;
                const yMin = centerY - scale / 2;

                const iterations = new Uint16Array(width * (endRow - startRow));

                let idx = 0;
                for (let py = startRow; py < endRow; py++) {
                    const y0 = yMin + (py / height) * scale;

                    for (let px = 0; px < width; px++) {
                        const x0 = xMin + (px / width) * scale * aspectRatio;

                        let x, y, x2, y2;
                        let iteration;

                        if (juliaMode) {
                            // Julia set: z_0 = pixel, c = constant
                            x = x0;
                            y = y0;
                            x2 = x * x;
                            y2 = y * y;
                            iteration = 0;

                            while (x2 + y2 <= escapeRadius * escapeRadius && iteration < maxIterations) {
                                y = 2 * x * y + juliaC.imag;
                                x = x2 - y2 + juliaC.real;
                                x2 = x * x;
                                y2 = y * y;
                                iteration++;
                            }
                        } else {
                            // Mandelbrot set: z_0 = 0, c = pixel
                            x = 0;
                            y = 0;
                            x2 = 0;
                            y2 = 0;
                            iteration = 0;

                            while (x2 + y2 <= escapeRadius * escapeRadius && iteration < maxIterations) {
                                y = 2 * x * y + y0;
                                x = x2 - y2 + x0;
                                x2 = x * x;
                                y2 = y * y;
                                iteration++;
                            }
                        }

                        iterations[idx++] = iteration;
                    }
                }

                self.postMessage({
                    iterations: iterations.buffer,
                    startRow,
                    endRow
                }, [iterations.buffer]);
            };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));

        this.worker.onmessage = (e) => {
            const { iterations, startRow, endRow } = e.data;
            this.drawIterations(new Uint16Array(iterations), startRow, endRow);
        };
    }

    setupEventListeners() {
        // Canvas interactions
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(e);
        });
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));

        // Drag to pan
        let isDragging = false;
        let dragStart = { x: 0, y: 0 };

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                isDragging = true;
                dragStart = { x: e.clientX, y: e.clientY };
                this.canvas.style.cursor = 'grabbing';
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dx = e.clientX - dragStart.x;
                const dy = e.clientY - dragStart.y;

                const scale = 4 / this.zoom;
                const aspectRatio = this.canvas.width / this.canvas.height;

                this.centerX -= (dx / this.canvas.width) * scale * aspectRatio;
                this.centerY -= (dy / this.canvas.height) * scale;

                dragStart = { x: e.clientX, y: e.clientY };
                this.render();
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.canvas.style.cursor = 'crosshair';
                this.saveToHistory();
            }
        });

        this.canvas.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
                this.canvas.style.cursor = 'crosshair';
            }
        });

        // Controls
        document.getElementById('iterations').addEventListener('input', (e) => {
            this.maxIterations = parseInt(e.target.value);
            document.getElementById('iterations-value').textContent = this.maxIterations;
            this.render();
        });

        document.getElementById('escape-radius').addEventListener('input', (e) => {
            this.escapeRadius = parseFloat(e.target.value);
            document.getElementById('escape-radius-value').textContent = this.escapeRadius;
            this.render();
        });

        document.getElementById('color-scheme').addEventListener('change', (e) => {
            this.colorScheme = e.target.value;
            this.render();
        });

        document.getElementById('julia-mode').addEventListener('change', (e) => {
            this.juliaMode = e.target.checked;
            this.render();
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            this.centerX = -0.5;
            this.centerY = 0;
            this.zoom = 1;
            this.viewHistory = [];
            this.render();
        });

        document.getElementById('back-btn').addEventListener('click', () => {
            if (this.viewHistory.length > 0) {
                const prev = this.viewHistory.pop();
                this.centerX = prev.centerX;
                this.centerY = prev.centerY;
                this.zoom = prev.zoom;
                this.render();
            }
        });

        document.getElementById('animation-speed').addEventListener('input', (e) => {
            this.animationSpeed = parseInt(e.target.value);
        });

        document.getElementById('animate-btn').addEventListener('click', () => {
            this.toggleAnimation();
        });

        // Bookmarks
        document.querySelectorAll('.bookmark-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const location = e.target.dataset.location;
                this.goToBookmark(location);
            });
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.render();
        });
    }

    handleClick(e) {
        if (e.button !== 0) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const aspectRatio = this.canvas.width / this.canvas.height;
        const scale = 4 / this.zoom;

        const clickX = this.centerX + (x / this.canvas.width - 0.5) * scale * aspectRatio;
        const clickY = this.centerY + (y / this.canvas.height - 0.5) * scale;

        if (this.juliaMode) {
            // Set Julia set constant
            this.juliaC = { real: clickX, imag: clickY };
            this.render();
        } else {
            // Zoom in
            this.saveToHistory();
            this.centerX = clickX;
            this.centerY = clickY;
            this.zoom *= 2;
            this.render();
        }
    }

    handleRightClick(e) {
        if (this.juliaMode) return;

        this.saveToHistory();
        this.zoom /= 2;
        if (this.zoom < 1) this.zoom = 1;
        this.render();
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const aspectRatio = this.canvas.width / this.canvas.height;
        const scale = 4 / this.zoom;

        const realX = this.centerX + (x / this.canvas.width - 0.5) * scale * aspectRatio;
        const realY = this.centerY + (y / this.canvas.height - 0.5) * scale;

        document.getElementById('real-coord').textContent = realX.toFixed(12);
        document.getElementById('imag-coord').textContent = realY.toFixed(12);
    }

    saveToHistory() {
        this.viewHistory.push({
            centerX: this.centerX,
            centerY: this.centerY,
            zoom: this.zoom
        });

        // Limit history size
        if (this.viewHistory.length > 50) {
            this.viewHistory.shift();
        }
    }

    goToBookmark(location) {
        const bookmark = this.bookmarks[location];
        if (bookmark) {
            this.saveToHistory();
            this.centerX = bookmark.x;
            this.centerY = bookmark.y;
            this.zoom = bookmark.zoom;
            this.render();
        }
    }

    toggleAnimation() {
        this.isAnimating = !this.isAnimating;
        const btn = document.getElementById('animate-btn');

        if (this.isAnimating) {
            btn.textContent = 'Stop Animation';
            this.animationTarget = {
                x: -0.7436438870371587,
                y: 0.13182590420531197,
                zoom: 100000000
            };
            this.animate();
        } else {
            btn.textContent = 'Start Animation';
            this.animationTarget = null;
        }
    }

    animate() {
        if (!this.isAnimating) return;

        const dx = this.animationTarget.x - this.centerX;
        const dy = this.animationTarget.y - this.centerY;
        const dz = this.animationTarget.zoom / this.zoom;

        const speed = 0.01 * this.animationSpeed;

        this.centerX += dx * speed;
        this.centerY += dy * speed;
        this.zoom *= Math.pow(dz, speed);

        this.render();

        requestAnimationFrame(() => this.animate());
    }

    render() {
        this.renderStartTime = performance.now();

        // Update display
        document.getElementById('zoom-level').textContent =
            this.zoom >= 1000000
                ? `${(this.zoom / 1000000).toFixed(1)}Mx`
                : this.zoom >= 1000
                    ? `${(this.zoom / 1000).toFixed(1)}Kx`
                    : `${this.zoom.toFixed(1)}x`;

        // Render progressively (low-res first)
        this.renderProgressive(4);
    }

    renderProgressive(passes = 4) {
        const rowsPerPass = Math.ceil(this.canvas.height / passes);

        for (let pass = 0; pass < passes; pass++) {
            const startRow = pass * rowsPerPass;
            const endRow = Math.min(startRow + rowsPerPass, this.canvas.height);

            this.worker.postMessage({
                width: this.canvas.width,
                height: this.canvas.height,
                centerX: this.centerX,
                centerY: this.centerY,
                zoom: this.zoom,
                maxIterations: this.maxIterations,
                escapeRadius: this.escapeRadius,
                juliaMode: this.juliaMode,
                juliaC: this.juliaC,
                startRow,
                endRow
            });
        }

        // Render minimap
        this.renderMinimap();
    }

    drawIterations(iterations, startRow, endRow) {
        const imageData = this.ctx.createImageData(
            this.canvas.width,
            endRow - startRow
        );
        const data = imageData.data;

        const aspectRatio = this.canvas.width / this.canvas.height;
        const scale = 4 / this.zoom;
        const xMin = this.centerX - (scale * aspectRatio) / 2;
        const yMin = this.centerY - scale / 2;

        let idx = 0;
        for (let py = startRow; py < endRow; py++) {
            for (let px = 0; px < this.canvas.width; px++) {
                const iteration = iterations[idx++];
                const color = this.getColor(iteration, px, py);

                const pixelIdx = ((py - startRow) * this.canvas.width + px) * 4;
                data[pixelIdx] = color.r;
                data[pixelIdx + 1] = color.g;
                data[pixelIdx + 2] = color.b;
                data[pixelIdx + 3] = 255;
            }
        }

        this.ctx.putImageData(imageData, 0, startRow);

        // Update render time on final pass
        if (endRow === this.canvas.height) {
            const renderTime = performance.now() - this.renderStartTime;
            document.getElementById('render-time').textContent =
                `${renderTime.toFixed(1)}ms`;
        }
    }

    getColor(iteration, x, y) {
        if (iteration === this.maxIterations) {
            return { r: 0, g: 0, b: 0 };
        }

        // Smooth coloring
        const aspectRatio = this.canvas.width / this.canvas.height;
        const scale = 4 / this.zoom;
        const x0 = this.centerX + (x / this.canvas.width - 0.5) * scale * aspectRatio;
        const y0 = this.centerY + (y / this.canvas.height - 0.5) * scale;

        let zx, zy, cx, cy;

        if (this.juliaMode) {
            zx = x0;
            zy = y0;
            cx = this.juliaC.real;
            cy = this.juliaC.imag;
        } else {
            zx = 0;
            zy = 0;
            cx = x0;
            cy = y0;
        }

        // Calculate final z for smooth coloring
        for (let i = 0; i < iteration; i++) {
            const xtemp = zx * zx - zy * zy + cx;
            zy = 2 * zx * zy + cy;
            zx = xtemp;
        }

        const logZn = Math.log(zx * zx + zy * zy) / 2;
        const nu = Math.log(logZn / Math.log(2)) / Math.log(2);
        const smoothIter = iteration + 1 - nu;

        // Map to color
        return this.mapSmoothToColor(smoothIter);
    }

    mapSmoothToColor(smoothIter) {
        const t = (smoothIter % 50) / 50;

        switch (this.colorScheme) {
            case 'fire':
                return this.firePalette(t);
            case 'ocean':
                return this.oceanPalette(t);
            case 'electric':
                return this.electricPalette(t);
            case 'grayscale':
                return this.grayscalePalette(t);
            case 'classic':
            default:
                return this.classicPalette(t);
        }
    }

    classicPalette(t) {
        const r = Math.floor(255 * (0.5 + 0.5 * Math.sin(3.14159 * t)));
        const g = Math.floor(255 * (0.5 + 0.5 * Math.sin(3.14159 * t + 2.094)));
        const b = Math.floor(255 * (0.5 + 0.5 * Math.sin(3.14159 * t + 4.188)));
        return { r, g, b };
    }

    firePalette(t) {
        const r = Math.floor(255 * Math.min(1, t * 3));
        const g = Math.floor(255 * Math.max(0, Math.min(1, t * 3 - 1)));
        const b = Math.floor(255 * Math.max(0, t * 3 - 2));
        return { r, g, b };
    }

    oceanPalette(t) {
        const r = Math.floor(255 * t * 0.3);
        const g = Math.floor(255 * (0.5 + 0.5 * t));
        const b = Math.floor(255 * (0.8 + 0.2 * t));
        return { r, g, b };
    }

    electricPalette(t) {
        const r = Math.floor(255 * (0.5 + 0.5 * Math.cos(3.14159 * t)));
        const g = Math.floor(255 * (0.5 + 0.5 * Math.cos(3.14159 * t + 2.094)));
        const b = Math.floor(255 * (0.5 + 0.5 * Math.cos(3.14159 * t + 4.188)));
        return { r, g, b };
    }

    grayscalePalette(t) {
        const v = Math.floor(255 * t);
        return { r: v, g: v, b: v };
    }

    renderMinimap() {
        const width = this.minimapCanvas.width;
        const height = this.minimapCanvas.height;
        const imageData = this.minimapCtx.createImageData(width, height);
        const data = imageData.data;

        const aspectRatio = width / height;
        const xMin = -2.5;
        const yMin = -1.5;
        const scale = 4;

        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                const x0 = xMin + (px / width) * scale * aspectRatio;
                const y0 = yMin + (py / height) * scale;

                const iteration = this.computeMandelbrot(x0, y0);
                const color = this.getMinimapColor(iteration);

                const idx = (py * width + px) * 4;
                data[idx] = color.r;
                data[idx + 1] = color.g;
                data[idx + 2] = color.b;
                data[idx + 3] = 255;
            }
        }

        this.minimapCtx.putImageData(imageData, 0, 0);
        this.updateViewRectangle();
    }

    computeMandelbrot(x0, y0) {
        let x = 0, y = 0;
        let x2 = 0, y2 = 0;
        let iteration = 0;

        while (x2 + y2 <= 4 && iteration < 100) {
            y = 2 * x * y + y0;
            x = x2 - y2 + x0;
            x2 = x * x;
            y2 = y * y;
            iteration++;
        }

        return iteration;
    }

    getMinimapColor(iteration) {
        if (iteration === 100) {
            return { r: 0, g: 0, b: 0 };
        }
        const t = iteration / 100;
        return {
            r: Math.floor(255 * t),
            g: Math.floor(255 * t * 0.5),
            b: Math.floor(255 * (1 - t))
        };
    }

    updateViewRectangle() {
        const width = this.minimapCanvas.width;
        const height = this.minimapCanvas.height;

        const aspectRatio = this.canvas.width / this.canvas.height;
        const scale = 4 / this.zoom;

        const viewWidth = (scale * aspectRatio) / 4 * width;
        const viewHeight = scale / 4 * height;

        const viewX = ((this.centerX + 2.5) / 4 * width) - viewWidth / 2;
        const viewY = ((this.centerY + 1.5) / 4 * height) - viewHeight / 2;

        const rect = document.getElementById('view-rectangle');
        rect.style.left = `${viewX}px`;
        rect.style.top = `${viewY}px`;
        rect.style.width = `${viewWidth}px`;
        rect.style.height = `${viewHeight}px`;
    }

    updateDisplay() {
        document.getElementById('iterations-value').textContent = this.maxIterations;
        document.getElementById('escape-radius-value').textContent = this.escapeRadius;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const renderer = new MandelbrotRenderer('mandelbrot-canvas', 'minimap-canvas');
});

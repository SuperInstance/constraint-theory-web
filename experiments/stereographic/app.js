// Stereographic Projection Simulator
// Demonstrates conformal mapping from sphere to plane

class StereographicProjection {
    constructor() {
        this.sphereCanvas = document.getElementById('sphereCanvas');
        this.planeCanvas = document.getElementById('planeCanvas');
        this.sphereCtx = this.sphereCanvas.getContext('2d');
        this.planeCtx = this.planeCanvas.getContext('2d');

        // Parameters
        this.projectionHeight = 1.0;
        this.sphereRadius = 1.0;
        this.gridDensity = 8;
        this.rotationSpeed = 0.005;
        this.rotationAxis = 'y';

        // Display options
        this.showLatitudes = true;
        this.showLongitudes = true;
        this.showGreatCircles = false;
        this.showProjectionLine = true;
        this.showGrid = false;

        // State
        this.rotation = { x: 0.3, y: 0, z: 0 };
        this.selectedPoint = null;
        this.isAnimating = false;
        this.animationProgress = 0;
        this.animationPath = [];

        // Colors
        this.colors = {
            sphere: '#2196F3',
            plane: '#4CAF50',
            projectionLine: '#FF9800',
            latitude: '#1976D2',
            longitude: '#1565C0',
            greatCircle: '#E91E63',
            selectedPoint: '#FF5722',
            grid: '#37474F',
            background: '#1a1a2e'
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateAnimationPath();
        this.animate();
    }

    setupEventListeners() {
        // Control listeners
        document.getElementById('projectionHeight').addEventListener('input', (e) => {
            this.projectionHeight = parseFloat(e.target.value);
            document.getElementById('heightValue').textContent = this.projectionHeight.toFixed(1);
        });

        document.getElementById('sphereRadius').addEventListener('input', (e) => {
            this.sphereRadius = parseFloat(e.target.value);
            document.getElementById('radiusValue').textContent = this.sphereRadius.toFixed(1);
        });

        document.getElementById('gridDensity').addEventListener('input', (e) => {
            this.gridDensity = parseInt(e.target.value);
            document.getElementById('densityValue').textContent = this.gridDensity;
        });

        document.getElementById('rotationSpeed').addEventListener('input', (e) => {
            this.rotationSpeed = parseFloat(e.target.value);
            document.getElementById('rotationValue').textContent = this.rotationSpeed.toFixed(3);
        });

        document.getElementById('rotationAxis').addEventListener('change', (e) => {
            this.rotationAxis = e.target.value;
        });

        // Checkbox listeners
        document.getElementById('showLatitudes').addEventListener('change', (e) => {
            this.showLatitudes = e.target.checked;
        });

        document.getElementById('showLongitudes').addEventListener('change', (e) => {
            this.showLongitudes = e.target.checked;
        });

        document.getElementById('showGreatCircles').addEventListener('change', (e) => {
            this.showGreatCircles = e.target.checked;
        });

        document.getElementById('showProjectionLine').addEventListener('change', (e) => {
            this.showProjectionLine = e.target.checked;
        });

        document.getElementById('showGrid').addEventListener('change', (e) => {
            this.showGrid = e.target.checked;
        });

        // Button listeners
        document.getElementById('animatePath').addEventListener('click', () => {
            this.startAnimation();
        });

        document.getElementById('resetView').addEventListener('click', () => {
            this.resetView();
        });

        document.getElementById('clearPoint').addEventListener('click', () => {
            this.selectedPoint = null;
            this.updatePointInfo();
        });

        // Canvas interaction
        this.sphereCanvas.addEventListener('click', (e) => this.handleSphereClick(e));
        this.planeCanvas.addEventListener('click', (e) => this.handlePlaneClick(e));

        // Mouse drag for rotation
        let isDragging = false;
        let lastMouse = { x: 0, y: 0 };

        this.sphereCanvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastMouse = { x: e.clientX, y: e.clientY };
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dx = e.clientX - lastMouse.x;
                const dy = e.clientY - lastMouse.y;
                this.rotation.y += dx * 0.01;
                this.rotation.x += dy * 0.01;
                lastMouse = { x: e.clientX, y: e.clientY };
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    generateAnimationPath() {
        // Generate a path along a great circle
        this.animationPath = [];
        const steps = 100;
        for (let i = 0; i < steps; i++) {
            const t = (i / steps) * 2 * Math.PI;
            // Figure-8 curve on sphere
            const x = Math.sin(t) * Math.cos(t);
            const y = Math.sin(t) * Math.sin(t);
            const z = Math.cos(t);
            this.animationPath.push({ x, y, z });
        }
    }

    startAnimation() {
        this.isAnimating = true;
        this.animationProgress = 0;
    }

    resetView() {
        this.rotation = { x: 0.3, y: 0, z: 0 };
        this.selectedPoint = null;
        this.updatePointInfo();
    }

    // Stereographic projection: sphere -> plane
    projectToPlane(x, y, z) {
        const denom = this.projectionHeight - z;
        if (Math.abs(denom) < 0.0001) return null; // Point at infinity
        return {
            x: (x * this.sphereRadius) / denom,
            y: (y * this.sphereRadius) / denom
        };
    }

    // Inverse projection: plane -> sphere
    projectToSphere(X, Y) {
        const denom = X * X + Y * Y + this.sphereRadius * this.sphereRadius;
        if (denom === 0) return null;
        return {
            x: (2 * X * this.sphereRadius) / denom,
            y: (2 * Y * this.sphereRadius) / denom,
            z: (X * X + Y * Y - this.sphereRadius * this.sphereRadius) / denom
        };
    }

    // 3D rotation
    rotatePoint(x, y, z) {
        // Rotate around X
        let y1 = y * Math.cos(this.rotation.x) - z * Math.sin(this.rotation.x);
        let z1 = y * Math.sin(this.rotation.x) + z * Math.cos(this.rotation.x);

        // Rotate around Y
        let x2 = x * Math.cos(this.rotation.y) + z1 * Math.sin(this.rotation.y);
        let z2 = -x * Math.sin(this.rotation.y) + z1 * Math.cos(this.rotation.y);

        // Rotate around Z
        let x3 = x2 * Math.cos(this.rotation.z) - y1 * Math.sin(this.rotation.z);
        let y3 = x2 * Math.sin(this.rotation.z) + y1 * Math.cos(this.rotation.z);

        return { x: x3, y: y3, z: z2 };
    }

    // 3D to 2D projection for canvas
    project3DTo2D(x, y, z, canvas, isSphere = true) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const scale = isSphere ? 150 : 50;

        const rotated = this.rotatePoint(x, y, z);

        return {
            x: centerX + rotated.x * scale,
            y: centerY - rotated.z * scale,
            z: rotated.y // Keep for depth sorting
        };
    }

    handleSphereClick(e) {
        const rect = this.sphereCanvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Find closest point on sphere
        let closestPoint = null;
        let minDist = Infinity;

        const steps = 50;
        for (let i = 0; i <= steps; i++) {
            for (let j = 0; j <= steps; j++) {
                const theta = (i / steps) * Math.PI;
                const phi = (j / steps) * 2 * Math.PI;

                const x = Math.sin(theta) * Math.cos(phi);
                const y = Math.cos(theta);
                const z = Math.sin(theta) * Math.sin(phi);

                const projected = this.project3DTo2D(x, y, z, this.sphereCanvas, true);
                const dist = Math.hypot(projected.x - clickX, projected.y - clickY);

                if (dist < minDist) {
                    minDist = dist;
                    closestPoint = { x, y, z };
                }
            }
        }

        if (closestPoint && minDist < 50) {
            this.selectedPoint = {
                sphere: closestPoint,
                plane: this.projectToPlane(closestPoint.x, closestPoint.y, closestPoint.z)
            };
            this.updatePointInfo();
        }
    }

    handlePlaneClick(e) {
        const rect = this.planeCanvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const centerX = this.planeCanvas.width / 2;
        const centerY = this.planeCanvas.height / 2;

        const X = (clickX - centerX) / 50;
        const Y = -(clickY - centerY) / 50;

        const spherePoint = this.projectToSphere(X, Y);
        if (spherePoint) {
            this.selectedPoint = {
                sphere: spherePoint,
                plane: { x: X, y: Y }
            };
            this.updatePointInfo();
        }
    }

    updatePointInfo() {
        const infoDiv = document.getElementById('currentPoint');
        if (this.selectedPoint) {
            const s = this.selectedPoint.sphere;
            const p = this.selectedPoint.plane;

            infoDiv.innerHTML = `
                <p><strong>Sphere:</strong> (${s.x.toFixed(3)}, ${s.y.toFixed(3)}, ${s.z.toFixed(3)})</p>
                <p><strong>Plane:</strong> (${p.x.toFixed(3)}, ${p.y.toFixed(3)})</p>
                <p><strong>Distance from origin:</strong> ${Math.hypot(s.x, s.y, s.z).toFixed(3)}</p>
            `;
        } else {
            infoDiv.innerHTML = '<p>Click on either canvas to see projection</p>';
        }
    }

    drawSphere() {
        const ctx = this.sphereCtx;
        const canvas = this.sphereCanvas;

        // Clear
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Draw sphere outline
        ctx.beginPath();
        ctx.arc(centerX, centerY, 150 * this.sphereRadius, 0, Math.PI * 2);
        ctx.strokeStyle = this.colors.sphere;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw latitude lines
        if (this.showLatitudes) {
            for (let i = 1; i < this.gridDensity; i++) {
                const theta = (i / this.gridDensity) * Math.PI;
                this.drawCircleOnSphere(theta, 'latitude');
            }
        }

        // Draw longitude lines
        if (this.showLongitudes) {
            for (let i = 0; i < this.gridDensity; i++) {
                const phi = (i / this.gridDensity) * 2 * Math.PI;
                this.drawCircleOnSphere(phi, 'longitude');
            }
        }

        // Draw great circles
        if (this.showGreatCircles) {
            this.drawGreatCircle(Math.PI / 4, 0);
            this.drawGreatCircle(0, Math.PI / 4);
        }

        // Draw projection point
        const projPoint = this.project3DTo2D(0, this.projectionHeight, 0, canvas, true);
        ctx.beginPath();
        ctx.arc(projPoint.x, projPoint.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = this.colors.projectionLine;
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.fillText('N', projPoint.x + 10, projPoint.y);

        // Draw selected point and projection line
        if (this.selectedPoint && this.showProjectionLine) {
            this.drawSelectedPointOnSphere();
        }

        // Draw animated point
        if (this.isAnimating) {
            const idx = Math.floor(this.animationProgress * (this.animationPath.length - 1));
            const point = this.animationPath[idx];
            this.drawPointOnSphere(point, this.colors.selectedPoint, 10);
        }
    }

    drawCircleOnSphere(fixedAngle, type) {
        const ctx = this.sphereCtx;
        const steps = 50;

        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
            let x, y, z;

            if (type === 'latitude') {
                const phi = (i / steps) * 2 * Math.PI;
                x = Math.sin(fixedAngle) * Math.cos(phi);
                y = Math.cos(fixedAngle);
                z = Math.sin(fixedAngle) * Math.sin(phi);
            } else {
                const theta = (i / steps) * Math.PI;
                x = Math.sin(theta) * Math.cos(fixedAngle);
                y = Math.cos(theta);
                z = Math.sin(theta) * Math.sin(fixedAngle);
            }

            const projected = this.project3DTo2D(x, y, z, this.sphereCanvas, true);
            if (i === 0) {
                ctx.moveTo(projected.x, projected.y);
            } else {
                ctx.lineTo(projected.x, projected.y);
            }
        }

        ctx.strokeStyle = type === 'latitude' ? this.colors.latitude : this.colors.longitude;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    drawGreatCircle(tiltX, tiltY) {
        const ctx = this.sphereCtx;
        const steps = 50;

        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
            const phi = (i / steps) * 2 * Math.PI;
            const x = Math.cos(phi);
            const y = Math.sin(phi) * Math.cos(tiltX);
            const z = Math.sin(phi) * Math.sin(tiltY);

            const rotated = this.rotatePoint(x, y, z);
            const projected = this.project3DTo2D(x, y, z, this.sphereCanvas, true);

            if (i === 0) {
                ctx.moveTo(projected.x, projected.y);
            } else {
                ctx.lineTo(projected.x, projected.y);
            }
        }

        ctx.strokeStyle = this.colors.greatCircle;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawPointOnSphere(point, color, size = 6) {
        const ctx = this.sphereCtx;
        const projected = this.project3DTo2D(point.x, point.y, point.z, this.sphereCanvas, true);

        ctx.beginPath();
        ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawSelectedPointOnSphere() {
        if (!this.selectedPoint) return;

        const ctx = this.sphereCtx;
        const s = this.selectedPoint.sphere;

        // Draw point on sphere
        this.drawPointOnSphere(s, this.colors.selectedPoint, 8);

        // Draw projection line
        const projPoint = this.project3DTo2D(0, this.projectionHeight, 0, this.sphereCanvas, true);
        const spherePoint = this.project3DTo2D(s.x, s.y, s.z, this.sphereCanvas, true);

        ctx.beginPath();
        ctx.moveTo(projPoint.x, projPoint.y);
        ctx.lineTo(spherePoint.x, spherePoint.y);
        ctx.strokeStyle = this.colors.projectionLine;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawPlane() {
        const ctx = this.planeCtx;
        const canvas = this.planeCanvas;

        // Clear
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Draw grid
        if (this.showGrid) {
            ctx.strokeStyle = this.colors.grid;
            ctx.lineWidth = 1;

            for (let i = -10; i <= 10; i++) {
                ctx.beginPath();
                ctx.moveTo(centerX + i * 20, 0);
                ctx.lineTo(centerX + i * 20, canvas.height);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, centerY + i * 20);
                ctx.lineTo(canvas.width, centerY + i * 20);
                ctx.stroke();
            }
        }

        // Draw axes
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(canvas.width, centerY);
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, canvas.height);
        ctx.stroke();

        // Draw projected latitude lines
        if (this.showLatitudes) {
            for (let i = 1; i < this.gridDensity; i++) {
                const theta = (i / this.gridDensity) * Math.PI;
                this.drawProjectedCircle(theta, 'latitude');
            }
        }

        // Draw projected longitude lines
        if (this.showLongitudes) {
            for (let i = 0; i < this.gridDensity; i++) {
                const phi = (i / this.gridDensity) * 2 * Math.PI;
                this.drawProjectedCircle(phi, 'longitude');
            }
        }

        // Draw projected great circles
        if (this.showGreatCircles) {
            this.drawProjectedGreatCircle(Math.PI / 4, 0);
            this.drawProjectedGreatCircle(0, Math.PI / 4);
        }

        // Draw selected point
        if (this.selectedPoint) {
            this.drawSelectedPointOnPlane();
        }

        // Draw animated point
        if (this.isAnimating) {
            const idx = Math.floor(this.animationProgress * (this.animationPath.length - 1));
            const point = this.animationPath[idx];
            const projected = this.projectToPlane(point.x, point.y, point.z);
            if (projected) {
                this.drawPointOnPlane(projected, this.colors.selectedPoint, 10);
            }
        }
    }

    drawProjectedCircle(fixedAngle, type) {
        const ctx = this.planeCtx;
        const steps = 50;

        ctx.beginPath();
        let firstPoint = null;

        for (let i = 0; i <= steps; i++) {
            let x, y, z;

            if (type === 'latitude') {
                const phi = (i / steps) * 2 * Math.PI;
                x = Math.sin(fixedAngle) * Math.cos(phi);
                y = Math.cos(fixedAngle);
                z = Math.sin(fixedAngle) * Math.sin(phi);
            } else {
                const theta = (i / steps) * Math.PI;
                x = Math.sin(theta) * Math.cos(fixedAngle);
                y = Math.cos(theta);
                z = Math.sin(theta) * Math.sin(fixedAngle);
            }

            const projected = this.projectToPlane(x, y, z);
            if (projected) {
                const canvasX = this.planeCanvas.width / 2 + projected.x * 50;
                const canvasY = this.planeCanvas.height / 2 - projected.y * 50;

                if (i === 0 || !firstPoint) {
                    ctx.moveTo(canvasX, canvasY);
                    firstPoint = { x: canvasX, y: canvasY };
                } else {
                    ctx.lineTo(canvasX, canvasY);
                }
            }
        }

        if (firstPoint) {
            ctx.closePath();
            ctx.strokeStyle = type === 'latitude' ? this.colors.latitude : this.colors.longitude;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    drawProjectedGreatCircle(tiltX, tiltY) {
        const ctx = this.planeCtx;
        const steps = 100;

        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
            const phi = (i / steps) * 2 * Math.PI;
            const x = Math.cos(phi);
            const y = Math.sin(phi) * Math.cos(tiltX);
            const z = Math.sin(phi) * Math.sin(tiltY);

            const projected = this.projectToPlane(x, y, z);
            if (projected) {
                const canvasX = this.planeCanvas.width / 2 + projected.x * 50;
                const canvasY = this.planeCanvas.height / 2 - projected.y * 50;

                if (i === 0) {
                    ctx.moveTo(canvasX, canvasY);
                } else {
                    ctx.lineTo(canvasX, canvasY);
                }
            }
        }

        ctx.strokeStyle = this.colors.greatCircle;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawPointOnPlane(point, color, size = 6) {
        const ctx = this.planeCtx;
        const canvasX = this.planeCanvas.width / 2 + point.x * 50;
        const canvasY = this.planeCanvas.height / 2 - point.y * 50;

        // Only draw if within canvas bounds
        if (canvasX < 0 || canvasX > this.planeCanvas.width ||
            canvasY < 0 || canvasY > this.planeCanvas.height) {
            return;
        }

        ctx.beginPath();
        ctx.arc(canvasX, canvasY, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawSelectedPointOnPlane() {
        if (!this.selectedPoint || !this.selectedPoint.plane) return;

        const p = this.selectedPoint.plane;
        this.drawPointOnPlane(p, this.colors.selectedPoint, 8);
    }

    animate() {
        // Update rotation
        if (this.rotationSpeed > 0) {
            this.rotation[this.rotationAxis] += this.rotationSpeed;
        }

        // Update animation
        if (this.isAnimating) {
            this.animationProgress += 0.01;
            if (this.animationProgress >= 1) {
                this.isAnimating = false;
                this.animationProgress = 0;
            }
        }

        // Draw both canvases
        this.drawSphere();
        this.drawPlane();

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize the simulator
document.addEventListener('DOMContentLoaded', () => {
    new StereographicProjection();
});

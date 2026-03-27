// Kepler Orbits Simulator - Constraint Theory
// Demonstrates gravitational constraints in orbital mechanics

class KeplerOrbitSimulator {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Physics constants (normalized units)
        this.G = 1; // Gravitational constant
        this.AU = 150; // Astronomical unit in pixels

        // Orbital parameters
        this.semiMajorAxis = 1.0; // AU
        this.eccentricity = 0.5;
        this.centralMass = 1.0; // Solar masses
        this.trueAnomaly = 0; // radians
        this.initialAnomaly = 0; // radians

        // Animation state
        this.isPlaying = false;
        this.animationSpeed = 1.0;
        this.time = 0;
        this.lastTime = 0;

        // Display options
        this.showOrbitPath = true;
        this.showVelocity = true;
        this.showAcceleration = true;
        this.showSweepArea = false;
        this.showCompare = false;
        this.showGrid = false;
        this.kepler2ndLaw = false;

        // Comparison orbit
        this.compareOrbit = {
            semiMajorAxis: 1.5,
            eccentricity: 0.3,
            trueAnomaly: Math.PI
        };

        // Kepler's 2nd law demonstration
        this.sweepAreas = [];
        this.sweepTimer = 0;
        this.sweepInterval = Math.PI / 6; // Every 30 degrees

        // Stars background
        this.stars = this.generateStars(200);

        // Resize canvas
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Initialize
        this.setupControls();
        this.updateOrbitType();
        this.animate();
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.scale = Math.min(this.canvas.width, this.canvas.height) / (4 * this.AU);
    }

    generateStars(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * 2000 - 1000,
                y: Math.random() * 2000 - 1000,
                size: Math.random() * 2 + 0.5,
                brightness: Math.random() * 0.5 + 0.5
            });
        }
        return stars;
    }

    setupControls() {
        // Orbit type
        document.getElementById('orbitType').addEventListener('change', (e) => {
            this.updateOrbitType();
        });

        // Sliders
        document.getElementById('semiMajorAxis').addEventListener('input', (e) => {
            this.semiMajorAxis = parseFloat(e.target.value);
            document.getElementById('axisValue').textContent = this.semiMajorAxis.toFixed(1);
            this.updateStatistics();
        });

        document.getElementById('eccentricity').addEventListener('input', (e) => {
            this.eccentricity = parseFloat(e.target.value);
            document.getElementById('eccentricityValue').textContent = this.eccentricity.toFixed(2);
            this.updateOrbitType();
            this.updateStatistics();
        });

        document.getElementById('centralMass').addEventListener('input', (e) => {
            this.centralMass = parseFloat(e.target.value);
            document.getElementById('massValue').textContent = this.centralMass.toFixed(1);
            this.updateStatistics();
        });

        document.getElementById('trueAnomaly').addEventListener('input', (e) => {
            this.trueAnomaly = parseFloat(e.target.value) * Math.PI / 180;
            this.initialAnomaly = this.trueAnomaly;
            document.getElementById('anomalyValue').textContent = e.target.value;
            this.updateStatistics();
        });

        // Display options
        document.getElementById('showOrbitPath').addEventListener('change', (e) => {
            this.showOrbitPath = e.target.checked;
        });

        document.getElementById('showVelocity').addEventListener('change', (e) => {
            this.showVelocity = e.target.checked;
        });

        document.getElementById('showAcceleration').addEventListener('change', (e) => {
            this.showAcceleration = e.target.checked;
        });

        document.getElementById('showSweepArea').addEventListener('change', (e) => {
            this.showSweepArea = e.target.checked;
            if (!this.showSweepArea) {
                this.sweepAreas = [];
            }
        });

        document.getElementById('showCompare').addEventListener('change', (e) => {
            this.showCompare = e.target.checked;
        });

        document.getElementById('showGrid').addEventListener('change', (e) => {
            this.showGrid = e.target.checked;
        });

        // Animation controls
        document.getElementById('playPause').addEventListener('click', () => {
            this.isPlaying = !this.isPlaying;
            document.getElementById('playPause').textContent = this.isPlaying ? 'Pause' : 'Play';
            if (this.isPlaying) {
                this.lastTime = performance.now();
            }
        });

        document.getElementById('reset').addEventListener('click', () => {
            this.trueAnomaly = this.initialAnomaly;
            this.time = 0;
            this.sweepAreas = [];
            this.updateStatistics();
        });

        document.getElementById('animationSpeed').addEventListener('input', (e) => {
            this.animationSpeed = parseFloat(e.target.value);
            document.getElementById('speedValue').textContent = this.animationSpeed.toFixed(1);
        });

        document.getElementById('kepler2ndLaw').addEventListener('change', (e) => {
            this.kepler2ndLaw = e.target.checked;
            if (this.kepler2ndLaw) {
                this.showSweepArea = true;
                document.getElementById('showSweepArea').checked = true;
            }
        });

        this.updateStatistics();
    }

    updateOrbitType() {
        const type = document.getElementById('orbitType').value;
        const eccSlider = document.getElementById('eccentricity');

        switch(type) {
            case 'circular':
                this.eccentricity = 0;
                eccSlider.value = 0;
                break;
            case 'elliptical':
                if (this.eccentricity >= 1) {
                    this.eccentricity = 0.5;
                    eccSlider.value = 0.5;
                }
                break;
            case 'parabolic':
                this.eccentricity = 1.0;
                eccSlider.value = 1.0;
                break;
            case 'hyperbolic':
                if (this.eccentricity <= 1) {
                    this.eccentricity = 1.2;
                    eccSlider.value = 1.2;
                }
                break;
        }

        document.getElementById('eccentricityValue').textContent = this.eccentricity.toFixed(2);
        this.updateStatistics();
    }

    // Calculate position from true anomaly using orbit equation
    calculatePosition(a, e, trueAnomaly) {
        // Semi-latus rectum
        const p = a * (1 - e * e);

        // Distance from focus
        const r = p / (1 + e * Math.cos(trueAnomaly));

        // Position in orbital plane
        const x = r * Math.cos(trueAnomaly);
        const y = r * Math.sin(trueAnomaly);

        return { x, y, r };
    }

    // Calculate velocity magnitude using vis-viva equation
    calculateVelocity(a, e, r) {
        const mu = this.G * this.centralMass;
        return Math.sqrt(mu * (2/r - 1/a));
    }

    // Calculate velocity vector components
    calculateVelocityVector(a, e, trueAnomaly) {
        const mu = this.G * this.centralMass;
        const p = a * (1 - e * e);
        const r = p / (1 + e * Math.cos(trueAnomaly));

        // Velocity components in orbital plane
        const h = Math.sqrt(mu * p); // Specific angular momentum
        const vx = -(mu/h) * Math.sin(trueAnomaly);
        const vy = (mu/h) * (e + Math.cos(trueAnomaly));

        return { vx, vy, v: Math.sqrt(vx*vx + vy*vy) };
    }

    // Calculate acceleration (always points toward focus)
    calculateAcceleration(r) {
        const mu = this.G * this.centralMass;
        const a = mu / (r * r);
        return a;
    }

    // Calculate orbital period (for elliptical orbits)
    calculatePeriod(a) {
        const mu = this.G * this.centralMass;
        return 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / mu);
    }

    // Update simulation
    update(deltaTime) {
        if (!this.isPlaying) return;

        // Calculate current position and velocity
        const pos = this.calculatePosition(this.semiMajorAxis, this.eccentricity, this.trueAnomaly);
        const vel = this.calculateVelocityVector(this.semiMajorAxis, this.eccentricity, this.trueAnomaly);

        // Angular velocity (Kepler's 2nd law: r²·dθ/dt = h)
        const mu = this.G * this.centralMass;
        const p = this.semiMajorAxis * (1 - this.eccentricity * this.eccentricity);
        const h = Math.sqrt(mu * p);
        const angularVelocity = h / (pos.r * pos.r);

        // Update true anomaly
        this.trueAnomaly += angularVelocity * deltaTime * this.animationSpeed;

        // Keep anomaly in reasonable range
        if (this.trueAnomaly > 2 * Math.PI) {
            this.trueAnomaly -= 2 * Math.PI;
        }

        // Kepler's 2nd law demonstration - record sweep areas
        if (this.showSweepArea && this.kepler2ndLaw) {
            this.sweepTimer += angularVelocity * deltaTime * this.animationSpeed;

            if (this.sweepTimer >= this.sweepInterval) {
                this.sweepTimer = 0;

                // Record current area
                const prevPos = this.calculatePosition(
                    this.semiMajorAxis,
                    this.eccentricity,
                    this.trueAnomaly - this.sweepInterval
                );

                this.sweepAreas.push({
                    startAnomaly: this.trueAnomaly - this.sweepInterval,
                    endAnomaly: this.trueAnomaly,
                    timestamp: Date.now()
                });

                // Keep only last 6 areas
                if (this.sweepAreas.length > 6) {
                    this.sweepAreas.shift();
                }
            }
        }

        // Update comparison orbit
        if (this.showCompare) {
            const compareMu = this.G * this.centralMass;
            const compareP = this.compareOrbit.semiMajorAxis * (1 - this.compareOrbit.eccentricity ** 2);
            const compareH = Math.sqrt(compareMu * compareP);
            const comparePos = this.calculatePosition(
                this.compareOrbit.semiMajorAxis,
                this.compareOrbit.eccentricity,
                this.compareOrbit.trueAnomaly
            );
            const compareAngularVelocity = compareH / (comparePos.r * comparePos.r);
            this.compareOrbit.trueAnomaly += compareAngularVelocity * deltaTime * this.animationSpeed;

            if (this.compareOrbit.trueAnomaly > 2 * Math.PI) {
                this.compareOrbit.trueAnomaly -= 2 * Math.PI;
            }
        }

        this.time += deltaTime;
        this.updateStatistics();
    }

    // Update statistics display
    updateStatistics() {
        const pos = this.calculatePosition(this.semiMajorAxis, this.eccentricity, this.trueAnomaly);
        const vel = this.calculateVelocityVector(this.semiMajorAxis, this.eccentricity, this.trueAnomaly);
        const mu = this.G * this.centralMass;

        // Periapsis and apoapsis
        const periapsis = this.semiMajorAxis * (1 - this.eccentricity);
        const apoapsis = this.semiMajorAxis * (1 + this.eccentricity);

        // Velocities at apsides
        const periapsisVel = Math.sqrt(mu * (2/periapsis - 1/this.semiMajorAxis));
        const apoapsisVel = this.eccentricity < 1 ?
            Math.sqrt(mu * (2/apoapsis - 1/this.semiMajorAxis)) : NaN;

        // Total energy (per unit mass)
        const totalEnergy = -mu / (2 * this.semiMajorAxis);

        // Angular momentum (per unit mass)
        const p = this.semiMajorAxis * (1 - this.eccentricity * this.eccentricity);
        const angularMomentum = Math.sqrt(mu * p);

        // Escape velocity at current position
        const escapeVel = Math.sqrt(2 * mu / pos.r);

        // Orbital period (for elliptical orbits)
        const period = this.eccentricity < 1 ? this.calculatePeriod(this.semiMajorAxis) : Infinity;

        // Update display
        document.getElementById('orbitalPeriod').textContent =
            this.eccentricity < 1 ? period.toFixed(3) + ' yr' : 'N/A';

        document.getElementById('periapsis').textContent = periapsis.toFixed(3) + ' AU';
        document.getElementById('apoapsis').textContent =
            this.eccentricity < 1 ? apoapsis.toFixed(3) + ' AU' : '∞';

        document.getElementById('periapsisVelocity').textContent = periapsisVel.toFixed(3) + ' AU/yr';
        document.getElementById('apoapsisVelocity').textContent =
            this.eccentricity < 1 ? apoapsisVel.toFixed(3) + ' AU/yr' : 'N/A';

        document.getElementById('currentVelocity').textContent = vel.v.toFixed(3) + ' AU/yr';
        document.getElementById('totalEnergy').textContent = totalEnergy.toFixed(3) + ' AU²/yr²';
        document.getElementById('angularMomentum').textContent = angularMomentum.toFixed(3) + ' AU²/yr';
        document.getElementById('escapeVelocity').textContent = escapeVel.toFixed(3) + ' AU/yr';
    }

    // Draw the simulation
    draw() {
        const ctx = this.ctx;

        // Clear canvas
        ctx.fillStyle = '#0a0e1a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw stars
        this.drawStars();

        // Draw grid
        if (this.showGrid) {
            this.drawGrid();
        }

        // Transform to center coordinates
        ctx.save();
        ctx.translate(this.centerX, this.centerY);
        ctx.scale(this.scale, this.scale);

        // Draw comparison orbit
        if (this.showCompare) {
            this.drawOrbit(
                this.compareOrbit.semiMajorAxis,
                this.compareOrbit.eccentricity,
                this.compareOrbit.trueAnomaly,
                '#4a9eff',
                false
            );
        }

        // Draw primary orbit
        this.drawOrbit(
            this.semiMajorAxis,
            this.eccentricity,
            this.trueAnomaly,
            '#00ff88',
            true
        );

        ctx.restore();
    }

    drawStars() {
        const ctx = this.ctx;
        ctx.save();

        for (const star of this.stars) {
            const x = (star.x + this.centerX * this.scale) / this.scale;
            const y = (star.y + this.centerY * this.scale) / this.scale;

            if (x >= 0 && x <= this.canvas.width && y >= 0 && y <= this.canvas.height) {
                ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
                ctx.beginPath();
                ctx.arc(x, y, star.size, 0, 2 * Math.PI);
                ctx.fill();
            }
        }

        ctx.restore();
    }

    drawGrid() {
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.1)';
        ctx.lineWidth = 1;

        const gridSize = this.AU * this.scale;

        for (let x = this.centerX % gridSize; x < this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }

        for (let y = this.centerY % gridSize; y < this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawOrbit(a, e, trueAnomaly, color, isPrimary) {
        const ctx = this.ctx;

        // Convert to pixels
        const A = a * this.AU;

        // Calculate focus offset (c = a*e)
        const focusOffset = A * e;

        // Draw orbit path
        if (this.showOrbitPath && e < 1) {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = isPrimary ? 2 : 1;
            ctx.globalAlpha = isPrimary ? 0.8 : 0.5;

            // Draw ellipse
            ctx.ellipse(-focusOffset, 0, A, A * Math.sqrt(1 - e*e), 0, 0, 2 * Math.PI);
            ctx.stroke();

            ctx.globalAlpha = 1;
        } else if (this.showOrbitPath && e >= 1) {
            // Draw parabolic or hyperbolic path
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = isPrimary ? 2 : 1;
            ctx.globalAlpha = 0.8;

            const p = A * (1 - e*e);

            for (let theta = -Math.PI + 0.1; theta < Math.PI - 0.1; theta += 0.05) {
                const r = p / (1 + e * Math.cos(theta));
                const x = r * Math.cos(theta);
                const y = r * Math.sin(theta);

                if (theta === -Math.PI + 0.1) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }

                // Stop if path goes off screen
                if (Math.abs(x) > this.canvas.width / this.scale * 1.5 ||
                    Math.abs(y) > this.canvas.height / this.scale * 1.5) {
                    break;
                }
            }

            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Draw central body (at focus)
        ctx.beginPath();
        ctx.fillStyle = '#ffdd44';
        ctx.shadowColor = '#ffdd44';
        ctx.shadowBlur = 20;
        ctx.arc(0, 0, isPrimary ? 15 : 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Calculate satellite position
        const pos = this.calculatePosition(a, e, trueAnomaly);
        const satX = pos.x * this.AU;
        const satY = pos.y * this.AU;

        // Draw Kepler's 2nd law sweep areas
        if (this.showSweepArea && isPrimary && this.sweepAreas.length > 0) {
            this.drawSweepAreas();
        }

        // Draw satellite
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.arc(satX, satY, isPrimary ? 8 : 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw velocity vector
        if (this.showVelocity) {
            const vel = this.calculateVelocityVector(a, e, trueAnomaly);
            const velScale = 30; // Scale factor for visualization

            ctx.beginPath();
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2;
            ctx.moveTo(satX, satY);
            ctx.lineTo(
                satX + vel.vx * velScale,
                satY + vel.vy * velScale
            );
            ctx.stroke();

            // Arrow head
            this.drawArrowHead(
                satX, satY,
                satX + vel.vx * velScale,
                satY + vel.vy * velScale,
                '#00ff88'
            );
        }

        // Draw acceleration vector
        if (this.showAcceleration) {
            const acc = this.calculateAcceleration(pos.r);
            const accScale = 500; // Scale factor for visualization

            // Acceleration always points toward focus
            const angle = Math.atan2(-satY, -satX);
            const accX = Math.cos(angle) * acc * accScale;
            const accY = Math.sin(angle) * acc * accScale;

            ctx.beginPath();
            ctx.strokeStyle = '#ff6666';
            ctx.lineWidth = 2;
            ctx.moveTo(satX, satY);
            ctx.lineTo(satX + accX, satY + accY);
            ctx.stroke();

            // Arrow head
            this.drawArrowHead(
                satX, satY,
                satX + accX,
                satY + accY,
                '#ff6666'
            );
        }
    }

    drawSweepAreas() {
        const ctx = this.ctx;

        for (let i = 0; i < this.sweepAreas.length; i++) {
            const area = this.sweepAreas[i];
            const age = Date.now() - area.timestamp;
            const maxAge = 5000; // 5 seconds
            const alpha = Math.max(0, 1 - age / maxAge);

            if (alpha <= 0) continue;

            const startAngle = area.startAnomaly;
            const endAngle = area.endAnomaly;

            // Calculate positions at start and end of sweep
            const startPos = this.calculatePosition(this.semiMajorAxis, this.eccentricity, startAngle);
            const endPos = this.calculatePosition(this.semiMajorAxis, this.eccentricity, endAngle);

            const startX = startPos.x * this.AU;
            const startY = startPos.y * this.AU;
            const endX = endPos.x * this.AU;
            const endY = endPos.y * this.AU;

            // Draw swept area
            ctx.beginPath();
            ctx.moveTo(0, 0); // Focus
            ctx.lineTo(startX, startY);
            ctx.arc(0, 0, Math.sqrt(startX*startX + startY*startY),
                    Math.atan2(startY, startX),
                    Math.atan2(endY, endX),
                    endAngle < startAngle); // Handle wraparound
            ctx.lineTo(0, 0);
            ctx.closePath();

            // Use alternating colors for adjacent areas
            const hue = (i * 60) % 360;
            ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${alpha * 0.3})`;
            ctx.fill();
            ctx.strokeStyle = `hsla(${hue}, 70%, 50%, ${alpha * 0.6})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    drawArrowHead(x1, y1, x2, y2, color) {
        const ctx = this.ctx;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLength = 10;

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.moveTo(x2, y2);
        ctx.lineTo(
            x2 - headLength * Math.cos(angle - Math.PI / 6),
            y2 - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            x2 - headLength * Math.cos(angle + Math.PI / 6),
            y2 - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
    }

    animate(currentTime = 0) {
        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((time) => this.animate(time));
    }
}

// Initialize simulator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const simulator = new KeplerOrbitSimulator('orbitCanvas');
});

// Diffraction Grating Simulator
// Constraint Theory Research Project

class DiffractionSimulator {
    constructor() {
        // Canvas elements
        this.gratingCanvas = document.getElementById('gratingCanvas');
        this.patternCanvas = document.getElementById('patternCanvas');
        this.gratingCtx = this.gratingCanvas.getContext('2d');
        this.patternCtx = this.patternCanvas.getContext('2d');

        // Simulation parameters
        this.params = {
            slitCount: 5,
            slitSpacing: 5.0,  // micrometers
            slitWidth: 1.0,     // micrometers
            wavelength: 500,    // nanometers
            screenDistance: 1.0 // meters
        };

        // Display options
        this.display = {
            showEnvelope: true,
            showIndividual: false,
            showCombined: true,
            showIntensity: false
        };

        // Animation state
        this.animation = {
            active: false,
            speed: 1.0,
            wavelengthDirection: 1,
            currentWavelength: 500
        };

        // Initialize
        this.initControls();
        this.initPresets();
        this.initDisplayOptions();
        this.initAnimation();
        this.draw();
    }

    // Initialize parameter controls
    initControls() {
        // Slit count
        const slitCountSlider = document.getElementById('slitCount');
        const slitCountValue = document.getElementById('slitCountValue');
        slitCountSlider.addEventListener('input', (e) => {
            this.params.slitCount = parseInt(e.target.value);
            slitCountValue.textContent = this.params.slitCount;
            this.draw();
        });

        // Slit spacing
        const slitSpacingSlider = document.getElementById('slitSpacing');
        const slitSpacingValue = document.getElementById('slitSpacingValue');
        slitSpacingSlider.addEventListener('input', (e) => {
            this.params.slitSpacing = parseFloat(e.target.value);
            slitSpacingValue.textContent = this.params.slitSpacing.toFixed(1);
            this.draw();
        });

        // Slit width
        const slitWidthSlider = document.getElementById('slitWidth');
        const slitWidthValue = document.getElementById('slitWidthValue');
        slitWidthSlider.addEventListener('input', (e) => {
            this.params.slitWidth = parseFloat(e.target.value);
            slitWidthValue.textContent = this.params.slitWidth.toFixed(1);
            this.draw();
        });

        // Wavelength
        const wavelengthSlider = document.getElementById('wavelength');
        const wavelengthValue = document.getElementById('wavelengthValue');
        const colorPreview = document.getElementById('colorPreview');
        wavelengthSlider.addEventListener('input', (e) => {
            this.params.wavelength = parseInt(e.target.value);
            wavelengthValue.textContent = this.params.wavelength;
            colorPreview.style.background = this.wavelengthToColor(this.params.wavelength);
            this.draw();
        });

        // Screen distance
        const screenDistanceSlider = document.getElementById('screenDistance');
        const screenDistanceValue = document.getElementById('screenDistanceValue');
        screenDistanceSlider.addEventListener('input', (e) => {
            this.params.screenDistance = parseFloat(e.target.value);
            screenDistanceValue.textContent = this.params.screenDistance.toFixed(1);
            this.draw();
        });

        // Set initial color
        colorPreview.style.background = this.wavelengthToColor(this.params.wavelength);
    }

    // Initialize preset buttons
    initPresets() {
        const presetButtons = document.querySelectorAll('.preset-btn');
        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                this.applyPreset(preset);

                // Update active state
                presetButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    // Apply preset configuration
    applyPreset(preset) {
        switch(preset) {
            case 'single':
                this.params.slitCount = 1;
                this.params.slitSpacing = 10.0;
                this.params.slitWidth = 2.0;
                break;
            case 'double':
                this.params.slitCount = 2;
                this.params.slitSpacing = 5.0;
                this.params.slitWidth = 1.0;
                break;
            case 'grating':
                this.params.slitCount = 10;
                this.params.slitSpacing = 3.0;
                this.params.slitWidth = 0.5;
                break;
            case 'circular':
                this.params.slitCount = 1;
                this.params.slitSpacing = 5.0;
                this.params.slitWidth = 2.0;
                break;
            case 'custom':
                this.params.slitCount = 20;
                this.params.slitSpacing = 2.5;
                this.params.slitWidth = 0.3;
                break;
        }

        // Update UI
        document.getElementById('slitCount').value = this.params.slitCount;
        document.getElementById('slitCountValue').textContent = this.params.slitCount;
        document.getElementById('slitSpacing').value = this.params.slitSpacing;
        document.getElementById('slitSpacingValue').textContent = this.params.slitSpacing.toFixed(1);
        document.getElementById('slitWidth').value = this.params.slitWidth;
        document.getElementById('slitWidthValue').textContent = this.params.slitWidth.toFixed(1);

        this.draw();
    }

    // Initialize display options
    initDisplayOptions() {
        document.getElementById('showEnvelope').addEventListener('change', (e) => {
            this.display.showEnvelope = e.target.checked;
            this.draw();
        });

        document.getElementById('showIndividual').addEventListener('change', (e) => {
            this.display.showIndividual = e.target.checked;
            this.draw();
        });

        document.getElementById('showCombined').addEventListener('change', (e) => {
            this.display.showCombined = e.target.checked;
            this.draw();
        });

        document.getElementById('showIntensity').addEventListener('change', (e) => {
            this.display.showIntensity = e.target.checked;
            this.draw();
        });
    }

    // Initialize animation controls
    initAnimation() {
        const animateBtn = document.getElementById('animateBtn');
        const resetBtn = document.getElementById('resetBtn');
        const speedControl = document.getElementById('speedControl');
        const animationSpeed = document.getElementById('animationSpeed');

        animateBtn.addEventListener('click', () => {
            this.animation.active = !this.animation.active;
            animateBtn.classList.toggle('active', this.animation.active);
            animateBtn.textContent = this.animation.active ? 'Stop Animation' : 'Animate Wavelength';

            if (this.animation.active) {
                this.animate();
            }
        });

        resetBtn.addEventListener('click', () => {
            this.animation.active = false;
            animateBtn.classList.remove('active');
            animateBtn.textContent = 'Animate Wavelength';
            this.params.wavelength = 500;
            document.getElementById('wavelength').value = 500;
            document.getElementById('wavelengthValue').textContent = 500;
            document.getElementById('colorPreview').style.background = this.wavelengthToColor(500);
            this.draw();
        });

        speedControl.addEventListener('input', (e) => {
            this.animation.speed = parseFloat(e.target.value);
            animationSpeed.textContent = this.animation.speed.toFixed(1);
        });
    }

    // Animation loop
    animate() {
        if (!this.animation.active) return;

        // Update wavelength
        this.params.wavelength += this.animation.wavelengthDirection * this.animation.speed;

        // Reverse direction at bounds
        if (this.params.wavelength >= 750) {
            this.animation.wavelengthDirection = -1;
        } else if (this.params.wavelength <= 380) {
            this.animation.wavelengthDirection = 1;
        }

        // Update UI
        document.getElementById('wavelength').value = Math.round(this.params.wavelength);
        document.getElementById('wavelengthValue').textContent = Math.round(this.params.wavelength);
        document.getElementById('colorPreview').style.background = this.wavelengthToColor(this.params.wavelength);

        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    // Convert wavelength to RGB color
    wavelengthToColor(wavelength) {
        let r, g, b;

        if (wavelength >= 380 && wavelength < 440) {
            r = -(wavelength - 440) / (440 - 380);
            g = 0;
            b = 1;
        } else if (wavelength >= 440 && wavelength < 490) {
            r = 0;
            g = (wavelength - 440) / (490 - 440);
            b = 1;
        } else if (wavelength >= 490 && wavelength < 510) {
            r = 0;
            g = 1;
            b = -(wavelength - 510) / (510 - 490);
        } else if (wavelength >= 510 && wavelength < 580) {
            r = (wavelength - 510) / (580 - 510);
            g = 1;
            b = 0;
        } else if (wavelength >= 580 && wavelength < 645) {
            r = 1;
            g = -(wavelength - 645) / (645 - 580);
            b = 0;
        } else if (wavelength >= 645 && wavelength <= 750) {
            r = 1;
            g = 0;
            b = 0;
        } else {
            r = 0;
            g = 0;
            b = 0;
        }

        // Intensity correction
        let alpha;
        if (wavelength >= 380 && wavelength < 420) {
            alpha = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
        } else if (wavelength >= 420 && wavelength < 701) {
            alpha = 1;
        } else if (wavelength >= 701 && wavelength <= 750) {
            alpha = 0.3 + 0.7 * (750 - wavelength) / (750 - 700);
        } else {
            alpha = 0;
        }

        r = Math.round(r * 255 * alpha);
        g = Math.round(g * 255 * alpha);
        b = Math.round(b * 255 * alpha);

        return `rgb(${r}, ${g}, ${b})`;
    }

    // Calculate single slit diffraction intensity (envelope)
    singleSlitIntensity(theta) {
        const lambda = this.params.wavelength * 1e-9;  // Convert nm to m
        const a = this.params.slitWidth * 1e-6;        // Convert μm to m

        if (a === 0) return 1;

        const beta = (Math.PI * a * Math.sin(theta)) / lambda;

        if (Math.abs(beta) < 1e-10) return 1;

        const sinc = Math.sin(beta) / beta;
        return sinc * sinc;
    }

    // Calculate multi-slit interference intensity
    multiSlitIntensity(theta) {
        const lambda = this.params.wavelength * 1e-9;  // Convert nm to m
        const d = this.params.slitSpacing * 1e-6;      // Convert μm to m
        const N = this.params.slitCount;

        if (N === 1) return 1;

        const alpha = (Math.PI * d * Math.sin(theta)) / lambda;

        if (Math.abs(alpha) < 1e-10) return N * N;

        const numerator = Math.sin(N * alpha);
        const denominator = Math.sin(alpha);

        if (Math.abs(denominator) < 1e-10) return N * N;

        return (numerator / denominator) ** 2;
    }

    // Calculate circular aperture intensity (Airy pattern)
    circularApertureIntensity(theta) {
        const lambda = this.params.wavelength * 1e-9;
        const a = this.params.slitWidth * 1e-6;

        const x = (Math.PI * a * Math.sin(theta)) / lambda;

        if (Math.abs(x) < 1e-10) return 1;

        // Bessel function J1 approximation
        const j1 = this.besselJ1(x);
        const airy = 2 * j1 / x;

        return airy * airy;
    }

    // Bessel function J1 approximation
    besselJ1(x) {
        if (Math.abs(x) < 1e-10) return 0;

        // Small argument approximation
        if (Math.abs(x) < 1) {
            return x / 2 * (1 - x * x / 8 + x * x * x * x / 192);
        }

        // Large argument approximation
        const cos = Math.cos(x - 3 * Math.PI / 4);
        const factor = Math.sqrt(2 / (Math.PI * Math.abs(x)));

        return factor * cos;
    }

    // Calculate total intensity
    totalIntensity(theta) {
        const single = this.singleSlitIntensity(theta);
        const multi = this.multiSlitIntensity(theta);

        // Normalize
        const maxIntensity = this.params.slitCount * this.params.slitCount;

        return (single * multi) / maxIntensity;
    }

    // Draw grating view
    drawGrating() {
        const ctx = this.gratingCtx;
        const width = this.gratingCanvas.width;
        const height = this.gratingCanvas.height;

        // Clear canvas
        ctx.fillStyle = '#1a2332';
        ctx.fillRect(0, 0, width, height);

        // Calculate grating dimensions
        const margin = 50;
        const gratingWidth = width - 2 * margin;
        const gratingY = height / 2;
        const slitHeight = 80;

        // Calculate slit positions
        const totalGratingWidth = this.params.slitSpacing * (this.params.slitCount - 1);
        const scale = gratingWidth / (totalGratingWidth + 4 * this.params.slitWidth);

        // Draw grating structure
        ctx.fillStyle = '#2d3748';
        ctx.fillRect(margin, gratingY - slitHeight / 2, gratingWidth, slitHeight);

        // Draw slits
        const color = this.wavelengthToColor(this.params.wavelength);
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        const startX = margin + (gratingWidth - totalGratingWidth * scale) / 2;

        for (let i = 0; i < this.params.slitCount; i++) {
            const x = startX + i * this.params.slitSpacing * scale;
            const slitW = Math.max(this.params.slitWidth * scale, 2);

            // Draw slit opening
            ctx.fillRect(x - slitW / 2, gratingY - slitHeight / 2, slitW, slitHeight);

            // Draw slit label
            if (this.params.slitCount <= 10) {
                ctx.fillStyle = '#9aa0a6';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${i + 1}`, x, gratingY + slitHeight / 2 + 15);
                ctx.fillStyle = color;
            }
        }

        // Draw scale
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margin, height - 20);
        ctx.lineTo(width - margin, height - 20);
        ctx.stroke();

        // Draw scale markers
        for (let i = 0; i <= 10; i++) {
            const x = margin + (gratingWidth * i) / 10;
            ctx.beginPath();
            ctx.moveTo(x, height - 25);
            ctx.lineTo(x, height - 15);
            ctx.stroke();

            const label = ((totalGratingWidth * i) / 10).toFixed(1);
            ctx.fillStyle = '#9aa0a6';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(label, x, height - 30);
        }

        // Draw scale label
        ctx.fillStyle = '#4fc3f7';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Position (μm)', width / 2, height - 5);
    }

    // Draw diffraction pattern
    drawPattern() {
        const ctx = this.patternCtx;
        const width = this.patternCanvas.width;
        const height = this.patternCanvas.height;

        // Clear canvas
        ctx.fillStyle = '#1a2332';
        ctx.fillRect(0, 0, width, height);

        // Calculate angle range
        const maxAngle = Math.PI / 2;  // 90 degrees
        const angleScale = width / (2 * maxAngle);
        const centerY = height - 50;
        const maxIntensityHeight = height - 80;

        // Draw axes
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);  // X-axis
        ctx.stroke();

        // Draw angle labels
        ctx.fillStyle = '#9aa0a6';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        for (let angle = -60; angle <= 60; angle += 15) {
            const radians = (angle * Math.PI) / 180;
            const x = width / 2 + radians * angleScale;
            ctx.fillText(`${angle}°`, x, centerY + 15);
        }

        // Draw intensity labels
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const y = centerY - (maxIntensityHeight * i) / 5;
            ctx.fillText(`${i / 5}`, 35, y + 4);
        }

        // Draw axis labels
        ctx.fillStyle = '#4fc3f7';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Diffraction Angle (θ)', width / 2, height - 10);

        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Normalized Intensity', 0, 0);
        ctx.restore();

        // Draw patterns
        const color = this.wavelengthToColor(this.params.wavelength);

        // Draw envelope
        if (this.display.showEnvelope) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();

            for (let x = 0; x < width; x++) {
                const angle = (x - width / 2) / angleScale;
                if (Math.abs(angle) > maxAngle) continue;

                const intensity = this.singleSlitIntensity(angle);
                const y = centerY - intensity * maxIntensityHeight;

                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Draw individual slit pattern
        if (this.display.showIndividual && this.params.slitCount > 1) {
            ctx.strokeStyle = 'rgba(255, 200, 100, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();

            for (let x = 0; x < width; x++) {
                const angle = (x - width / 2) / angleScale;
                if (Math.abs(angle) > maxAngle) continue;

                const intensity = this.multiSlitIntensity(angle);
                const normalized = intensity / (this.params.slitCount * this.params.slitCount);
                const y = centerY - normalized * maxIntensityHeight;

                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.stroke();
        }

        // Draw combined pattern
        if (this.display.showCombined) {
            // Create gradient
            const gradient = ctx.createLinearGradient(0, centerY - maxIntensityHeight, 0, centerY);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            // Fill pattern
            ctx.fillStyle = color.replace('rgb', 'rgba').replace(')', ', 0.3)');
            ctx.beginPath();
            ctx.moveTo(0, centerY);

            for (let x = 0; x < width; x++) {
                const angle = (x - width / 2) / angleScale;
                if (Math.abs(angle) > maxAngle) continue;

                const intensity = this.totalIntensity(angle);
                const y = centerY - intensity * maxIntensityHeight;
                ctx.lineTo(x, y);
            }

            ctx.lineTo(width, centerY);
            ctx.closePath();
            ctx.fill();

            // Draw pattern line
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();

            for (let x = 0; x < width; x++) {
                const angle = (x - width / 2) / angleScale;
                if (Math.abs(angle) > maxAngle) continue;

                const intensity = this.totalIntensity(angle);
                const y = centerY - intensity * maxIntensityHeight;

                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.stroke();
        }

        // Draw intensity values
        if (this.display.showIntensity) {
            ctx.fillStyle = '#9aa0a6';
            ctx.font = '9px Arial';
            ctx.textAlign = 'left';

            // Find maxima
            const peaks = this.findPeaks();
            peaks.forEach(peak => {
                const x = width / 2 + peak.angle * angleScale;
                const intensity = this.totalIntensity(peak.angle);
                const y = centerY - intensity * maxIntensityHeight;

                if (x > 0 && x < width) {
                    ctx.fillText(`m=${peak.order}`, x + 5, y - 5);
                    ctx.fillText(`${intensity.toFixed(2)}`, x + 5, y + 10);
                }
            });
        }

        // Draw order markers
        ctx.fillStyle = '#4fc3f7';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';

        const orders = this.calculateDiffractionOrders();
        orders.forEach(order => {
            const x = width / 2 + order.angle * angleScale;
            if (x > 0 && x < width) {
                ctx.fillText(`m=${order.m}`, x, centerY + 30);
            }
        });

        // Update measurements
        this.updateMeasurements();
    }

    // Find intensity peaks
    findPeaks() {
        const peaks = [];
        const maxAngle = Math.PI / 2;
        const step = 0.001;

        for (let angle = -maxAngle; angle <= maxAngle; angle += step) {
            const intensity = this.totalIntensity(angle);
            const leftIntensity = this.totalIntensity(angle - step);
            const rightIntensity = this.totalIntensity(angle + step);

            if (intensity > leftIntensity && intensity > rightIntensity && intensity > 0.01) {
                // Calculate order
                const m = Math.round(this.params.slitSpacing * Math.sin(angle) / (this.params.wavelength * 1e-3));
                peaks.push({ angle, intensity, order: m });
            }
        }

        return peaks.slice(0, 20);  // Limit to 20 peaks
    }

    // Calculate diffraction orders
    calculateDiffractionOrders() {
        const orders = [];
        const lambda = this.params.wavelength * 1e-9;
        const d = this.params.slitSpacing * 1e-6;

        for (let m = -5; m <= 5; m++) {
            const sinTheta = m * lambda / d;
            if (Math.abs(sinTheta) <= 1) {
                const angle = Math.asin(sinTheta);
                orders.push({ m, angle });
            }
        }

        return orders;
    }

    // Update measurements display
    updateMeasurements() {
        const lambda = this.params.wavelength * 1e-9;
        const d = this.params.slitSpacing * 1e-6;
        const N = this.params.slitCount;

        // First order angle
        const sinTheta1 = lambda / d;
        const theta1 = Math.abs(sinTheta1) <= 1 ? Math.asin(sinTheta1) : null;
        document.getElementById('firstOrderAngle').textContent =
            theta1 ? `${(theta1 * 180 / Math.PI).toFixed(2)}°` : 'N/A';

        // Angular separation
        const deltaTheta = theta1 ? (2 * theta1 * 180 / Math.PI).toFixed(2) : 'N/A';
        document.getElementById('angularSeparation').textContent = deltaTheta !== 'N/A' ? `${deltaTheta}°` : 'N/A';

        // Resolving power
        const resolvingPower = N;
        document.getElementById('resolvingPower').textContent = `${resolvingPower}`;

        // Dispersion
        const dispersion = theta1 ? (1 / (d * Math.cos(theta1))) : null;
        document.getElementById('dispersion').textContent =
            dispersion ? `${(dispersion * 1e-6).toFixed(2)} rad/nm` : 'N/A';
    }

    // Main draw function
    draw() {
        this.drawGrating();
        this.drawPattern();
    }
}

// Initialize simulator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DiffractionSimulator();
});

/**
 * Dodecet 12-Bit Encoding Demo
 * Demonstrates the 12-bit geometric encoding system
 */

class DodecetEncodingDemo {
  constructor() {
    this.canvas = document.getElementById('dodecet-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.points = [];
    this.rotation = 0;
    this.rotationSpeed = 1;
    this.showAxes = true;
    this.pointCount = 100;

    this.init();
  }

  init() {
    this.setupEncoder();
    this.setupDecoder();
    this.setupVisualization();
    this.generatePoints();
    this.animate();
  }

  // ==================== ENCODER ====================

  setupEncoder() {
    const encodeBtn = document.getElementById('encode-btn');
    const coordX = document.getElementById('coord-x');
    const coordY = document.getElementById('coord-y');
    const coordZ = document.getElementById('coord-z');

    encodeBtn.addEventListener('click', () => {
      const x = parseInt(coordX.value);
      const y = parseInt(coordY.value);
      const z = parseInt(coordZ.value);

      // Validate
      if (x < 0 || x > 15 || y < 0 || y > 15 || z < 0 || z > 15) {
        alert('Coordinates must be between 0 and 15');
        return;
      }

      this.encodeCoordinates(x, y, z);
    });
  }

  encodeCoordinates(x, y, z) {
    // Encode: 4 bits per coordinate
    const dodecet = (x << 8) | (y << 4) | z;

    // Binary representation
    const binary = ((x << 8) | (y << 4) | z).toString(2).padStart(12, '0');
    const formattedBinary = binary.match(/.{4}/g).join(' ');

    // Hexadecimal
    const hex = '0x' + dodecet.toString(16).toUpperCase().padStart(3, '0');

    // Update display
    document.getElementById('binary-result').textContent = formattedBinary;
    document.getElementById('hex-result').textContent = hex;
    document.getElementById('decimal-result').textContent = dodecet;
    document.getElementById('memory-result').textContent = '2 bytes';
  }

  // ==================== DECODER ====================

  setupDecoder() {
    const decodeBtn = document.getElementById('decode-btn');
    const hexInput = document.getElementById('hex-input');
    const decimalInput = document.getElementById('decimal-input');

    decodeBtn.addEventListener('click', () => {
      if (hexInput.value) {
        this.decodeHex(hexInput.value);
      } else if (decimalInput.value) {
        this.decodeDecimal(parseInt(decimalInput.value));
      }
    });
  }

  decodeHex(hex) {
    // Remove 0x prefix if present
    const cleanHex = hex.replace('0x', '');
    const dodecet = parseInt(cleanHex, 16);

    if (isNaN(dodecet) || dodecet < 0 || dodecet > 4095) {
      alert('Invalid hex value. Must be between 0x000 and 0xFFF');
      return;
    }

    this.decodeDodecet(dodecet);
  }

  decodeDecimal(decimal) {
    if (isNaN(decimal) || decimal < 0 || decimal > 4095) {
      alert('Invalid decimal value. Must be between 0 and 4095');
      return;
    }

    this.decodeDodecet(decimal);
  }

  decodeDodecet(dodecet) {
    // Decode: extract 4-bit coordinates
    const x = (dodecet >> 8) & 0xF;
    const y = (dodecet >> 4) & 0xF;
    const z = dodecet & 0xF;

    // Update display
    document.getElementById('decoded-x').textContent = x;
    document.getElementById('decoded-y').textContent = y;
    document.getElementById('decoded-z').textContent = z;
    document.getElementById('decoded-position').textContent = `(${x}, ${y}, ${z})`;
  }

  // ==================== 3D VISUALIZATION ====================

  setupVisualization() {
    const rotationSlider = document.getElementById('rotation-slider');
    const pointsSlider = document.getElementById('points-slider');
    const regenerateBtn = document.getElementById('regenerate-btn');
    const toggleAxesBtn = document.getElementById('toggle-axes-btn');

    rotationSlider.addEventListener('input', (e) => {
      this.rotationSpeed = parseFloat(e.target.value);
      document.getElementById('rotation-speed').textContent = this.rotationSpeed;
    });

    pointsSlider.addEventListener('input', (e) => {
      this.pointCount = parseInt(e.target.value);
      document.getElementById('point-count').textContent = this.pointCount;
      this.generatePoints();
    });

    regenerateBtn.addEventListener('click', () => {
      this.generatePoints();
    });

    toggleAxesBtn.addEventListener('click', () => {
      this.showAxes = !this.showAxes;
    });

    // Canvas interaction
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;

    this.canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - lastMouseX;
      const deltaY = e.clientY - lastMouseY;

      this.rotation += deltaX * 0.01;

      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    });

    this.canvas.addEventListener('mouseup', () => {
      isDragging = false;
    });

    this.canvas.addEventListener('mouseleave', () => {
      isDragging = false;
    });
  }

  generatePoints() {
    this.points = [];
    for (let i = 0; i < this.pointCount; i++) {
      this.points.push({
        x: Math.floor(Math.random() * 16),
        y: Math.floor(Math.random() * 16),
        z: Math.floor(Math.random() * 16),
        color: `oklch(${0.6 + Math.random() * 0.2} 0.2 ${Math.random() * 360})`
      });
    }
  }

  animate() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.animate());
  }

  update() {
    this.rotation += 0.005 * this.rotationSpeed;
  }

  draw() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = 'oklch(0.06 0.01 145)';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 15;

    // Draw axes
    if (this.showAxes) {
      this.drawAxes(ctx, centerX, centerY, scale);
    }

    // Draw bounding box
    this.drawBoundingBox(ctx, centerX, centerY, scale);

    // Draw points
    for (const point of this.points) {
      const projected = this.project3D(point.x, point.y, point.z, centerX, centerY, scale);
      this.drawPoint(ctx, projected.x, projected.y, point.color, point.z);
    }

    // Draw title
    ctx.fillStyle = 'oklch(0.98 0.005 145)';
    ctx.font = '14px Geist';
    ctx.textAlign = 'center';
    ctx.fillText(`3D Dodecet Space (0-15, 0-15, 0-15) - ${this.pointCount} points`, width / 2, 20);
  }

  project3D(x, y, z, centerX, centerY, scale) {
    // Center the coordinates
    const cx = x - 7.5;
    const cy = y - 7.5;
    const cz = z - 7.5;

    // Rotation around Y axis
    const cosR = Math.cos(this.rotation);
    const sinR = Math.sin(this.rotation);

    const rx = cx * cosR - cz * sinR;
    const rz = cx * sinR + cz * cosR;

    // Simple perspective projection
    const perspective = 3;
    const factor = perspective / (perspective + rx * 0.1);

    return {
      x: centerX + rx * scale * factor,
      y: centerY - cy * scale * factor,
      z: rz // Store Z for depth sorting
    };
  }

  drawPoint(ctx, x, y, color, depth) {
    const size = 3 + (depth + 7.5) * 0.3;

    // Glow effect
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, color.replace(')', ' / 0)'));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 2, 0, Math.PI * 2);
    ctx.fill();

    // Point
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  drawAxes(ctx, centerX, centerY, scale) {
    const axisLength = 8 * scale;

    // X axis (red)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + axisLength, centerY);
    ctx.strokeStyle = 'oklch(0.55 0.22 27)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'oklch(0.55 0.22 27)';
    ctx.font = '12px Geist';
    ctx.textAlign = 'left';
    ctx.fillText('X', centerX + axisLength + 5, centerY);

    // Y axis (green)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, centerY - axisLength);
    ctx.strokeStyle = 'oklch(0.72 0.19 145)';
    ctx.stroke();

    ctx.fillStyle = 'oklch(0.72 0.19 145)';
    ctx.textAlign = 'center';
    ctx.fillText('Y', centerX, centerY - axisLength - 5);

    // Z axis (blue)
    const zEnd = this.project3D(7.5, 7.5, 15, centerX, centerY, scale);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(zEnd.x, zEnd.y);
    ctx.strokeStyle = 'oklch(0.65 0.18 230)';
    ctx.stroke();

    ctx.fillStyle = 'oklch(0.65 0.18 230)';
    ctx.textAlign = 'left';
    ctx.fillText('Z', zEnd.x + 5, zEnd.y);
  }

  drawBoundingBox(ctx, centerX, centerY, scale) {
    const corners = [
      [0, 0, 0], [15, 0, 0], [15, 15, 0], [0, 15, 0],
      [0, 0, 15], [15, 0, 15], [15, 15, 15], [0, 15, 15]
    ];

    const projected = corners.map(([x, y, z]) =>
      this.project3D(x, y, z, centerX, centerY, scale)
    );

    // Draw edges
    ctx.strokeStyle = 'oklch(0.25 0.02 145 / 0.5)';
    ctx.lineWidth = 1;

    // Bottom face
    ctx.beginPath();
    ctx.moveTo(projected[0].x, projected[0].y);
    for (let i = 1; i < 4; i++) {
      ctx.lineTo(projected[i].x, projected[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Top face
    ctx.beginPath();
    ctx.moveTo(projected[4].x, projected[4].y);
    for (let i = 5; i < 8; i++) {
      ctx.lineTo(projected[i].x, projected[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Vertical edges
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(projected[i].x, projected[i].y);
      ctx.lineTo(projected[i + 4].x, projected[i + 4].y);
      ctx.stroke();
    }
  }
}

// Initialize demo when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new DodecetEncodingDemo();
});

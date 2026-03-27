// Quaternion class for geometric constraint transformations
class Quaternion {
    constructor(w, x, y, z) {
        this.w = w;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    // Create quaternion from axis-angle rotation
    static fromAxisAngle(axis, angleDeg) {
        const angleRad = (angleDeg * Math.PI) / 180;
        const halfAngle = angleRad / 2;
        const sinHalf = Math.sin(halfAngle);

        return new Quaternion(
            Math.cos(halfAngle),
            axis.x * sinHalf,
            axis.y * sinHalf,
            axis.z * sinHalf
        );
    }

    // Create quaternion from Euler angles (XYZ order)
    static fromEuler(xDeg, yDeg, zDeg) {
        const x = (xDeg * Math.PI) / 180;
        const y = (yDeg * Math.PI) / 180;
        const z = (zDeg * Math.PI) / 180;

        const cx = Math.cos(x / 2);
        const cy = Math.cos(y / 2);
        const cz = Math.cos(z / 2);
        const sx = Math.sin(x / 2);
        const sy = Math.sin(y / 2);
        const sz = Math.sin(z / 2);

        const w = cx * cy * cz + sx * sy * sz;
        const qx = sx * cy * cz - cx * sy * sz;
        const qy = cx * sy * cz + sx * cy * sz;
        const qz = cx * cy * sz - sx * sy * cz;

        return new Quaternion(w, qx, qy, qz);
    }

    // Multiply two quaternions
    multiply(other) {
        return new Quaternion(
            this.w * other.w - this.x * other.x - this.y * other.y - this.z * other.z,
            this.w * other.x + this.x * other.w + this.y * other.z - this.z * other.y,
            this.w * other.y - this.x * other.z + this.y * other.w + this.z * other.x,
            this.w * other.z + this.x * other.y - this.y * other.x + this.z * other.w
        );
    }

    // Conjugate (inverse rotation for unit quaternions)
    conjugate() {
        return new Quaternion(this.w, -this.x, -this.y, -this.z);
    }

    // Inverse quaternion
    inverse() {
        const magSq = this.magnitudeSquared();
        if (magSq === 0) return new Quaternion(0, 0, 0, 0);
        return new Quaternion(
            this.w / magSq,
            -this.x / magSq,
            -this.y / magSq,
            -this.z / magSq
        );
    }

    // Normalize to unit quaternion
    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return new Quaternion(1, 0, 0, 0);
        return new Quaternion(
            this.w / mag,
            this.x / mag,
            this.y / mag,
            this.z / mag
        );
    }

    // Magnitude
    magnitude() {
        return Math.sqrt(this.magnitudeSquared());
    }

    // Magnitude squared
    magnitudeSquared() {
        return this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z;
    }

    // Convert to 3x3 rotation matrix
    toMatrix() {
        const w2 = this.w * this.w;
        const x2 = this.x * this.x;
        const y2 = this.y * this.y;
        const z2 = this.z * this.z;

        return [
            [
                w2 + x2 - y2 - z2,
                2 * (this.x * this.y - this.w * this.z),
                2 * (this.x * this.z + this.w * this.y)
            ],
            [
                2 * (this.x * this.y + this.w * this.z),
                w2 - x2 + y2 - z2,
                2 * (this.y * this.z - this.w * this.x)
            ],
            [
                2 * (this.x * this.z - this.w * this.y),
                2 * (this.y * this.z + this.w * this.x),
                w2 - x2 - y2 + z2
            ]
        ];
    }

    // Clone
    clone() {
        return new Quaternion(this.w, this.x, this.y, this.z);
    }

    // String representation
    toString() {
        const sign = (val) => val >= 0 ? '+' : '';
        return `${this.w.toFixed(3)} ${sign(this.x.toFixed(3))}i ${sign(this.y.toFixed(3))}j ${sign(this.z.toFixed(3))}k`;
    }
}

// SLERP (Spherical Linear Interpolation)
function slerp(q1, q2, t) {
    // Calculate cosine of angle between quaternions
    let dot = q1.w * q2.w + q1.x * q2.x + q1.y * q2.y + q1.z * q2.z;

    // If dot is negative, use -q2 to take shorter path
    if (dot < 0) {
        q2 = new Quaternion(-q2.w, -q2.x, -q2.y, -q2.z);
        dot = -dot;
    }

    // If quaternions are too close, use linear interpolation
    if (dot > 0.9995) {
        return new Quaternion(
            q1.w + t * (q2.w - q1.w),
            q1.x + t * (q2.x - q1.x),
            q1.y + t * (q2.y - q1.y),
            q1.z + t * (q2.z - q1.z)
        ).normalize();
    }

    // Calculate SLERP
    const theta = Math.acos(dot);
    const sinTheta = Math.sin(theta);
    const w1 = Math.sin((1 - t) * theta) / sinTheta;
    const w2 = Math.sin(t * theta) / sinTheta;

    return new Quaternion(
        w1 * q1.w + w2 * q2.w,
        w1 * q1.x + w2 * q2.x,
        w1 * q1.y + w2 * q2.y,
        w1 * q1.z + w2 * q2.z
    );
}

// Three.js scene setup
let scene, camera, renderer, object;
let axesHelper;
let currentQuaternion = new Quaternion(1, 0, 0, 0);
let rotationAxis = { x: 1, y: 0, z: 0 };
let isAnimating = false;
let animationId = null;
let rotationPath = [];
let pathLine = null;
let autoRecordPath = false;

// Initialize Three.js scene
function initScene() {
    const container = document.getElementById('canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e1a);

    // Camera
    camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(4, 3, 4);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Create a colored box with different colored faces
    const geometry = new THREE.BoxGeometry(1.5, 1, 0.5);
    const materials = [
        new THREE.MeshPhongMaterial({ color: 0xff6b6b }), // Right - Red
        new THREE.MeshPhongMaterial({ color: 0x4ecdc4 }), // Left - Cyan
        new THREE.MeshPhongMaterial({ color: 0x45b7d1 }), // Top - Blue
        new THREE.MeshPhongMaterial({ color: 0xf9ca24 }), // Bottom - Yellow
        new THREE.MeshPhongMaterial({ color: 0x6c5ce7 }), // Front - Purple
        new THREE.MeshPhongMaterial({ color: 0xa29bfe })  // Back - Light Purple
    ];

    object = new THREE.Mesh(geometry, materials);
    scene.add(object);

    // Add edges for better visualization
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    object.add(wireframe);

    // Axes helper
    axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);

    // Grid helper
    const gridHelper = new THREE.GridHelper(4, 10, 0x444444, 0x222222);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-5, -5, -5);
    scene.add(directionalLight2);

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    animate();
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Apply quaternion rotation to the 3D object
function applyQuaternion(q) {
    const matrix = q.toMatrix();
    object.rotation.setFromRotationMatrix(
        new THREE.Matrix3().set(
            matrix[0][0], matrix[0][1], matrix[0][2],
            matrix[1][0], matrix[1][1], matrix[1][2],
            matrix[2][0], matrix[2][1], matrix[2][2]
        )
    );
    currentQuaternion = q.clone();
    updateDisplay();
}

// Update the display with current quaternion values
function updateDisplay() {
    document.getElementById('quaternion-w').textContent = currentQuaternion.w.toFixed(3);
    document.getElementById('quaternion-x').textContent = currentQuaternion.x.toFixed(3);
    document.getElementById('quaternion-y').textContent = currentQuaternion.y.toFixed(3);
    document.getElementById('quaternion-z').textContent = currentQuaternion.z.toFixed(3);
    document.getElementById('magnitude').textContent = currentQuaternion.magnitude().toFixed(3);

    // Update rotation matrix display
    const matrix = currentQuaternion.toMatrix();
    let matrixHTML = '<div class="matrix-row">';
    for (let i = 0; i < 3; i++) {
        matrixHTML += `<div class="matrix-cell">${matrix[i][0].toFixed(3)}</div>`;
        matrixHTML += `<div class="matrix-cell">${matrix[i][1].toFixed(3)}</div>`;
        matrixHTML += `<div class="matrix-cell">${matrix[i][2].toFixed(3)}</div>`;
        if (i < 2) matrixHTML += '</div><div class="matrix-row">';
    }
    matrixHTML += '</div>';
    document.getElementById('rotation-matrix').innerHTML = matrixHTML;

    // Check for gimbal lock in Euler mode
    if (document.getElementById('rotation-mode').value === 'euler') {
        checkGimbalLock();
    }

    // Auto-record path if enabled
    if (autoRecordPath) {
        recordPathPoint();
    }
}

// Check for gimbal lock condition
function checkGimbalLock() {
    const y = parseFloat(document.getElementById('euler-y').value);
    const eulerStatus = document.getElementById('euler-status');

    // Gimbal lock occurs when pitch (Y rotation) is ±90 degrees
    if (Math.abs(y - 90) < 1 || Math.abs(y - 270) < 1) {
        eulerStatus.textContent = 'GIMBAL LOCK';
        eulerStatus.className = 'status gimbal-lock';
    } else {
        eulerStatus.textContent = 'Normal';
        eulerStatus.className = 'status normal';
    }
}

// Record current rotation as a path point
function recordPathPoint() {
    const pos = {
        x: currentQuaternion.x,
        y: currentQuaternion.y,
        z: currentQuaternion.z,
        w: currentQuaternion.w
    };
    rotationPath.push(pos);
    updatePathVisualization();
    document.getElementById('path-count').textContent = rotationPath.length;
}

// Update path visualization
function updatePathVisualization() {
    if (rotationPath.length < 2) return;

    // Remove old path line
    if (pathLine) {
        scene.remove(pathLine);
        pathLine.geometry.dispose();
        pathLine.material.dispose();
    }

    // Create new path line
    const points = [];
    for (let i = 0; i < rotationPath.length; i++) {
        const q = rotationPath[i];
        // Convert quaternion to position on unit sphere
        const pos = new THREE.Vector3(q.x, q.y, q.z);
        if (pos.length() > 0) {
            pos.normalize().multiplyScalar(2);
        }
        points.push(pos);
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
        color: 0x00ff88,
        linewidth: 2
    });
    pathLine = new THREE.Line(geometry, material);
    scene.add(pathLine);
}

// Clear rotation path
function clearPath() {
    rotationPath = [];
    if (pathLine) {
        scene.remove(pathLine);
        pathLine.geometry.dispose();
        pathLine.material.dispose();
        pathLine = null;
    }
    document.getElementById('path-count').textContent = '0';
}

// Event handlers
document.addEventListener('DOMContentLoaded', () => {
    initScene();

    // Rotation mode selector
    document.getElementById('rotation-mode').addEventListener('change', (e) => {
        const mode = e.target.value;
        document.querySelectorAll('.quaternion-mode').forEach(el => {
            el.style.display = mode === 'quaternion' ? 'block' : 'none';
        });
        document.querySelectorAll('.euler-mode').forEach(el => {
            el.style.display = mode === 'euler' ? 'block' : 'none';
        });

        if (mode === 'euler') {
            // Update to current Euler angles
            updateFromEuler();
        }
    });

    // Axis selection
    document.querySelectorAll('.axis-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.axis-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const axis = e.target.dataset.axis;
            if (axis === 'custom') {
                document.querySelector('.custom-axis-group').style.display = 'block';
            } else {
                document.querySelector('.custom-axis-group').style.display = 'none';
                rotationAxis = {
                    x: axis === 'x' ? 1 : 0,
                    y: axis === 'y' ? 1 : 0,
                    z: axis === 'z' ? 1 : 0
                };
            }
        });
    });

    // Custom axis inputs
    ['axis-x', 'axis-y', 'axis-z'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateCustomAxis);
    });

    function updateCustomAxis() {
        rotationAxis = {
            x: parseFloat(document.getElementById('axis-x').value) || 0,
            y: parseFloat(document.getElementById('axis-y').value) || 0,
            z: parseFloat(document.getElementById('axis-z').value) || 0
        };
    }

    // Normalize axis button
    document.getElementById('normalize-axis').addEventListener('click', () => {
        const mag = Math.sqrt(
            rotationAxis.x ** 2 +
            rotationAxis.y ** 2 +
            rotationAxis.z ** 2
        );
        if (mag > 0) {
            rotationAxis = {
                x: rotationAxis.x / mag,
                y: rotationAxis.y / mag,
                z: rotationAxis.z / mag
            };
            document.getElementById('axis-x').value = rotationAxis.x.toFixed(3);
            document.getElementById('axis-y').value = rotationAxis.y.toFixed(3);
            document.getElementById('axis-z').value = rotationAxis.z.toFixed(3);
        }
    });

    // Rotation angle slider
    document.getElementById('rotation-angle').addEventListener('input', (e) => {
        document.getElementById('angle-value').textContent = e.target.value;
        const angle = parseFloat(e.target.value);
        const q = Quaternion.fromAxisAngle(rotationAxis, angle);
        applyQuaternion(q);
    });

    // Angle preset buttons
    document.querySelectorAll('.angle-preset').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const angle = parseInt(e.target.dataset.angle);
            document.getElementById('rotation-angle').value = angle;
            document.getElementById('angle-value').textContent = angle;
            const q = Quaternion.fromAxisAngle(rotationAxis, angle);
            applyQuaternion(q);
        });
    });

    // Euler angle sliders
    ['euler-x', 'euler-y', 'euler-z'].forEach(id => {
        document.getElementById(id).addEventListener('input', (e) => {
            document.getElementById(`${id}-val`).textContent = `${e.target.value}°`;
            updateFromEuler();
        });
    });

    function updateFromEuler() {
        const x = parseFloat(document.getElementById('euler-x').value);
        const y = parseFloat(document.getElementById('euler-y').value);
        const z = parseFloat(document.getElementById('euler-z').value);
        const q = Quaternion.fromEuler(x, y, z);
        applyQuaternion(q);
    }

    // Animation button
    document.getElementById('animate-btn').addEventListener('click', () => {
        if (isAnimating) {
            stopAnimation();
        } else {
            startAnimation();
        }
    });

    function startAnimation() {
        isAnimating = true;
        document.getElementById('animate-btn').textContent = 'Stop Animation';

        let angle = parseFloat(document.getElementById('rotation-angle').value);
        const increment = 1; // degrees per frame

        function animateStep() {
            if (!isAnimating) return;

            angle = (angle + increment) % 360;
            document.getElementById('rotation-angle').value = angle;
            document.getElementById('angle-value').textContent = Math.round(angle);

            const q = Quaternion.fromAxisAngle(rotationAxis, angle);
            applyQuaternion(q);

            animationId = requestAnimationFrame(animateStep);
        }

        animateStep();
    }

    function stopAnimation() {
        isAnimating = false;
        document.getElementById('animate-btn').textContent = 'Animate Rotation';
        if (animationId) {
            cancelAnimationFrame(animationId);
        }
    }

    // Reset button
    document.getElementById('reset-btn').addEventListener('click', () => {
        stopAnimation();
        document.getElementById('rotation-angle').value = 0;
        document.getElementById('angle-value').textContent = '0';
        document.getElementById('euler-x').value = 0;
        document.getElementById('euler-y').value = 0;
        document.getElementById('euler-z').value = 0;
        document.getElementById('euler-x-val').textContent = '0°';
        document.getElementById('euler-y-val').textContent = '0°';
        document.getElementById('euler-z-val').textContent = '0°';

        rotationAxis = { x: 1, y: 0, z: 0 };
        document.querySelectorAll('.axis-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-axis="x"]').classList.add('active');
        document.querySelector('.custom-axis-group').style.display = 'none';

        applyQuaternion(new Quaternion(1, 0, 0, 0));
        clearPath();
    });

    // Quaternion multiplication
    document.getElementById('multiply-btn').addEventListener('click', () => {
        const q1 = new Quaternion(
            parseFloat(document.getElementById('q1-w').value),
            parseFloat(document.getElementById('q1-x').value),
            parseFloat(document.getElementById('q1-y').value),
            parseFloat(document.getElementById('q1-z').value)
        );

        const q2 = new Quaternion(
            parseFloat(document.getElementById('q2-w').value),
            parseFloat(document.getElementById('q2-x').value),
            parseFloat(document.getElementById('q2-y').value),
            parseFloat(document.getElementById('q2-z').value)
        );

        const result = q1.multiply(q2);

        document.getElementById('multiply-result').innerHTML = `
            <span class="q-label">result =</span>
            <span class="q-val">${result.w.toFixed(3)}</span>
            <span class="q-val">${result.x.toFixed(3)}</span>
            <span class="q-val">${result.y.toFixed(3)}</span>
            <span class="q-val">${result.z.toFixed(3)}</span>
        `;
    });

    // Single quaternion operations
    document.getElementById('conjugate-btn').addEventListener('click', () => {
        const result = currentQuaternion.conjugate();
        showOperationResult('Conjugate', result);
    });

    document.getElementById('inverse-btn').addEventListener('click', () => {
        const result = currentQuaternion.inverse();
        showOperationResult('Inverse', result);
    });

    document.getElementById('normalize-btn').addEventListener('click', () => {
        const result = currentQuaternion.normalize();
        showOperationResult('Normalize', result);
    });

    function showOperationResult(operation, result) {
        document.getElementById('op-result').innerHTML = `
            <strong>${operation}:</strong><br>
            ${result.w.toFixed(4)} + ${result.x.toFixed(4)}i + ${result.y.toFixed(4)}j + ${result.z.toFixed(4)}k<br>
            |q| = ${result.magnitude().toFixed(4)}
        `;
    }

    // Preset rotations
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const preset = e.target.dataset.preset;
            let q;

            switch (preset) {
                case '90x':
                    q = Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90);
                    break;
                case '90y':
                    q = Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90);
                    break;
                case '90z':
                    q = Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 90);
                    break;
                case '180x':
                    q = Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 180);
                    break;
                case '180y':
                    q = Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180);
                    break;
                case '180z':
                    q = Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 180);
                    break;
                case 'gimbal':
                    // Demonstrate gimbal lock
                    document.getElementById('rotation-mode').value = 'euler';
                    document.getElementById('rotation-mode').dispatchEvent(new Event('change'));
                    document.getElementById('euler-x').value = 90;
                    document.getElementById('euler-y').value = 90;
                    document.getElementById('euler-z').value = 0;
                    document.getElementById('euler-x-val').textContent = '90°';
                    document.getElementById('euler-y-val').textContent = '90°';
                    document.getElementById('euler-z-val').textContent = '0°';
                    updateFromEuler();
                    return;
                case 'slerp':
                    // Start SLERP demo
                    document.getElementById('slerp-slider').value = 0;
                    document.getElementById('slerp-value').textContent = '0';
                    animateSLERP();
                    return;
            }

            applyQuaternion(q);
        });
    });

    // Compare button
    document.getElementById('compare-btn').addEventListener('click', () => {
        // Create a comparison visualization
        alert('Comparison:\n\nEuler angles can suffer from gimbal lock when pitch approaches ±90°.\nQuaternions avoid this by using 4D representation.\n\nTry the "Gimbal Lock Demo" preset to see the difference!');
    });

    // SLERP controls
    document.getElementById('slerp-slider').addEventListener('input', (e) => {
        const t = parseFloat(e.target.value) / 100;
        document.getElementById('slerp-value').textContent = Math.round(t * 100);

        const q1 = new Quaternion(1, 0, 0, 0); // Identity
        const q2 = Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90); // 90° around X

        const result = slerp(q1, q2, t);
        applyQuaternion(result);
    });

    document.getElementById('animate-slerp-btn').addEventListener('click', () => {
        animateSLERP();
    });

    function animateSLERP() {
        const slider = document.getElementById('slerp-slider');
        let t = 0;
        const duration = 2000; // 2 seconds
        const startTime = Date.now();

        function animate() {
            const elapsed = Date.now() - startTime;
            t = Math.min(elapsed / duration, 1);

            slider.value = t * 100;
            document.getElementById('slerp-value').textContent = Math.round(t * 100);

            const q1 = new Quaternion(1, 0, 0, 0);
            const q2 = Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90);
            const result = slerp(q1, q2, t);
            applyQuaternion(result);

            if (t < 1) {
                requestAnimationFrame(animate);
            }
        }

        animate();
    }

    // Path controls
    document.getElementById('show-path-btn').addEventListener('click', () => {
        recordPathPoint();
    });

    document.getElementById('clear-path-btn').addEventListener('click', () => {
        clearPath();
    });

    document.getElementById('auto-record').addEventListener('change', (e) => {
        autoRecordPath = e.target.checked;
    });
});

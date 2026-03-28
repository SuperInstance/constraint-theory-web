// ==================== NEURAL NETWORK TOPOLOGY SIMULATOR ====================
// Demonstrates Traditional NN vs Constraint Theory Geometric Networks

// ==================== CONFIGURATION ====================
const CONFIG = {
    traditional: {
        nodeColor: '#3b82f6',
        activationColor: '#60a5fa',
        weightColor: '#1e40af',
        glowColor: 'rgba(59, 130, 246, 0.5)',
        nodeShape: 'circle'
    },
    constraint: {
        nodeColor: '#10b981',
        satisfiedColor: '#34d399',
        violatedColor: '#ef4444',
        constraintColor: '#059669',
        glowColor: 'rgba(16, 185, 129, 0.5)',
        nodeShape: 'hexagon'
    },
    animation: {
        signalSpeed: 2,
        particleSize: 4,
        snapDuration: 300
    }
};

// ==================== NETWORK ARCHITECTURES ====================
const ARCHITECTURES = {
    simple: {
        layers: [2, 3, 1],
        name: 'Simple 3-Layer'
    },
    deep: {
        layers: [2, 4, 4, 4, 4, 1],
        name: 'Deep 6-Layer'
    },
    conv: {
        layers: [2, 3, 3, 1],
        localConnections: true,
        name: 'Convolutional-like'
    },
    recurrent: {
        layers: [2, 3, 1],
        recurrent: true,
        name: 'Recurrent-like'
    }
};

// ==================== TRAINING PROBLEMS ====================
const PROBLEMS = {
    xor: [
        { input: [0, 0], output: 0 },
        { input: [0, 1], output: 1 },
        { input: [1, 0], output: 1 },
        { input: [1, 1], output: 0 }
    ],
    and: [
        { input: [0, 0], output: 0 },
        { input: [0, 1], output: 0 },
        { input: [1, 0], output: 0 },
        { input: [1, 1], output: 1 }
    ],
    or: [
        { input: [0, 0], output: 0 },
        { input: [0, 1], output: 1 },
        { input: [1, 0], output: 1 },
        { input: [1, 1], output: 1 }
    ],
    circle: [
        { input: [0, 0], output: 0 },
        { input: [1, 0], output: 1 },
        { input: [0, 1], output: 1 },
        { input: [1, 1], output: 0 }
    ]
};

// ==================== TRADITIONAL NEURAL NETWORK ====================
class TraditionalNeuralNetwork {
    constructor(layers) {
        this.layers = layers;
        this.weights = [];
        this.biases = [];
        this.activations = [];
        this.gradients = [];
        this.initializeWeights();
    }

    initializeWeights() {
        this.weights = [];
        this.biases = [];

        for (let i = 0; i < this.layers.length - 1; i++) {
            const inputSize = this.layers[i];
            const outputSize = this.layers[i + 1];

            // Xavier initialization
            const scale = Math.sqrt(2.0 / (inputSize + outputSize));
            const weightMatrix = [];

            for (let j = 0; j < outputSize; j++) {
                const row = [];
                for (let k = 0; k < inputSize; k++) {
                    row.push((Math.random() - 0.5) * 2 * scale);
                }
                weightMatrix.push(row);
            }
            this.weights.push(weightMatrix);

            const biasVector = [];
            for (let j = 0; j < outputSize; j++) {
                biasVector.push((Math.random() - 0.5) * 0.1);
            }
            this.biases.push(biasVector);
        }
    }

    sigmoid(x) {
        return 1.0 / (1.0 + Math.exp(-Math.max(-10, Math.min(10, x))));
    }

    sigmoidDerivative(x) {
        const s = this.sigmoid(x);
        return s * (1 - s);
    }

    relu(x) {
        return Math.max(0, x);
    }

    forward(input) {
        this.activations = [input];
        let current = input;

        for (let i = 0; i < this.weights.length; i++) {
            const newLayer = [];

            for (let j = 0; j < this.weights[i].length; j++) {
                let sum = this.biases[i][j];

                for (let k = 0; k < current.length; k++) {
                    sum += current[k] * this.weights[i][j][k];
                }

                // Use sigmoid for hidden layers, sigmoid for output
                newLayer.push(this.sigmoid(sum));
            }

            current = newLayer;
            this.activations.push(current);
        }

        return current;
    }

    backward(target, learningRate = 0.1) {
        const output = this.activations[this.activations.length - 1];

        // Output layer error
        let errors = [];
        for (let i = 0; i < output.length; i++) {
            errors.push(target[i] - output[i]);
        }

        // Backpropagate
        this.gradients = [];

        for (let layer = this.weights.length - 1; layer >= 0; layer--) {
            const layerGradients = [];
            const newErrors = new Array(this.layers[layer]).fill(0);

            for (let i = 0; i < this.weights[layer].length; i++) {
                const activation = this.activations[layer + 1][i];
                const delta = errors[i] * this.sigmoidDerivative(activation);

                const neuronGradients = [];
                for (let j = 0; j < this.weights[layer][i].length; j++) {
                    neuronGradients.push(delta * this.activations[layer][j]);
                    newErrors[j] += delta * this.weights[layer][i][j];
                }
                layerGradients.push(neuronGradients);
            }

            this.gradients.unshift(layerGradients);
            errors = newErrors;
        }

        // Update weights
        for (let layer = 0; layer < this.weights.length; layer++) {
            for (let i = 0; i < this.weights[layer].length; i++) {
                this.biases[layer][i] += learningRate * errors[i];

                for (let j = 0; j < this.weights[layer][i].length; j++) {
                    this.weights[layer][i][j] += learningRate * this.gradients[layer][i][j];
                }
            }
        }
    }

    getParameterCount() {
        let count = 0;
        for (let i = 0; i < this.weights.length; i++) {
            count += this.weights[i].length * this.weights[i][0].length;
            count += this.biases[i].length;
        }
        return count;
    }

    getActivationSum() {
        if (this.activations.length === 0) return 0;
        return this.activations.flat().reduce((a, b) => a + Math.abs(b), 0);
    }

    getGradientFlow() {
        if (this.gradients.length === 0) return 0;
        return this.gradients.flat().flat().reduce((a, b) => a + Math.abs(b), 0);
    }

    reset() {
        this.initializeWeights();
        this.activations = [];
        this.gradients = [];
    }
}

// ==================== CONSTRAINT THEORY NETWORK ====================
class ConstraintNetwork {
    constructor(layers) {
        this.layers = layers;
        this.constraints = [];
        this.positions = [];
        this.satisfactions = [];
        this.violations = [];
        this.initializeConstraints();
    }

    initializeConstraints() {
        this.constraints = [];
        this.violations = [];

        for (let i = 0; i < this.layers.length - 1; i++) {
            const layerConstraints = [];

            for (let j = 0; j < this.layers[i + 1]; j++) {
                const nodeConstraints = [];

                for (let k = 0; k < this.layers[i]; k++) {
                    // Geometric constraint: distance and angle
                    nodeConstraints.push({
                        distance: 0.5 + Math.random() * 0.5,  // Target distance
                        angle: (Math.random() - 0.5) * Math.PI,  // Target angle
                        strength: 0.5 + Math.random() * 0.5,  // Constraint strength
                        satisfaction: 1.0  // Initial satisfaction
                    });
                }

                layerConstraints.push(nodeConstraints);
            }

            this.constraints.push(layerConstraints);
        }

        this.updateViolations();
    }

    pythagoreanSnap(value, constraint) {
        // Pythagorean snapping: snap to geometric constraints
        const target = constraint.distance;
        const diff = value - target;

        // Snap using Pythagorean theorem
        const snapped = value - diff * constraint.strength;

        return {
            value: Math.max(0, Math.min(1, snapped)),
            satisfaction: 1.0 - Math.abs(diff) / target,
            snapped: Math.abs(diff) > 0.1
        };
    }

    forward(input) {
        this.positions = [input];
        this.satisfactions = [];
        let current = input;

        for (let i = 0; i < this.constraints.length; i++) {
            const newLayer = [];
            const layerSatisfactions = [];

            for (let j = 0; j < this.constraints[i].length; j++) {
                let weightedSum = 0;
                let totalSatisfaction = 0;
                let snapCount = 0;

                for (let k = 0; k < current.length; k++) {
                    const constraint = this.constraints[i][j][k];
                    const result = this.pythagoreanSnap(current[k], constraint);

                    weightedSum += result.value * constraint.distance;
                    totalSatisfaction += result.satisfaction;
                    if (result.snapped) snapCount++;

                    // Update constraint satisfaction
                    constraint.satisfaction = result.satisfaction;
                }

                // Normalize by number of inputs
                const output = weightedSum / current.length;
                const avgSatisfaction = totalSatisfaction / current.length;

                newLayer.push(output);
                layerSatisfactions.push({
                    satisfaction: avgSatisfaction,
                    snaps: snapCount
                });
            }

            current = newLayer;
            this.positions.push(current);
            this.satisfactions.push(layerSatisfactions);
        }

        this.updateViolations();
        return current;
    }

    updateViolations() {
        this.violations = [];

        for (let i = 0; i < this.constraints.length; i++) {
            let layerViolations = 0;

            for (let j = 0; j < this.constraints[i].length; j++) {
                for (let k = 0; k < this.constraints[i][j].length; k++) {
                    if (this.constraints[i][j][k].satisfaction < 0.7) {
                        layerViolations++;
                    }
                }
            }

            this.violations.push(layerViolations);
        }
    }

    backward(target, learningRate = 0.1) {
        // Constraint-based learning: adjust constraints to reduce violation
        const output = this.positions[this.positions.length - 1];

        for (let i = 0; i < output.length; i++) {
            const error = target[i] - output[i];
            const layerIdx = this.constraints.length - 1;

            // Adjust constraints based on error
            for (let j = 0; j < this.constraints[layerIdx][i].length; j++) {
                const constraint = this.constraints[layerIdx][i][j];
                const adjustment = error * learningRate * constraint.strength;
                constraint.distance = Math.max(0.1, Math.min(1.5, constraint.distance + adjustment));
                constraint.strength = Math.max(0.1, Math.min(1.0, constraint.strength + adjustment * 0.1));
            }
        }

        // Propagate constraint adjustments backward
        for (let layer = this.constraints.length - 2; layer >= 0; layer--) {
            for (let i = 0; i < this.constraints[layer].length; i++) {
                for (let j = 0; j < this.constraints[layer][i].length; j++) {
                    const constraint = this.constraints[layer][i][j];
                    const avgAdjustment = learningRate * 0.5 * (Math.random() - 0.5);
                    constraint.distance = Math.max(0.1, Math.min(1.5, constraint.distance + avgAdjustment));
                }
            }
        }
    }

    getConstraintCount() {
        let count = 0;
        for (const layer of this.constraints) {
            for (const node of layer) {
                count += node.length;
            }
        }
        return count;
    }

    getAverageSatisfaction() {
        if (this.satisfactions.length === 0) return 0;

        let total = 0;
        let count = 0;

        for (const layer of this.satisfactions) {
            for (const node of layer) {
                total += node.satisfaction;
                count++;
            }
        }

        return count > 0 ? total / count : 0;
    }

    getTotalViolations() {
        return this.violations.reduce((a, b) => a + b, 0);
    }

    reset() {
        this.initializeConstraints();
        this.positions = [];
        this.satisfactions = [];
    }
}

// ==================== VISUALIZATION ====================
class NetworkVisualizer {
    constructor(canvasId, type) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.type = type;
        this.signals = [];
        this.animationFrame = null;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.width = rect.width;
        this.height = rect.height;
    }

    clear() {
        this.ctx.fillStyle = 'rgba(15, 15, 35, 1)';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    drawNode(x, y, value, isInput = false) {
        const config = this.type === 'traditional' ? CONFIG.traditional : CONFIG.constraint;
        const size = isInput ? 15 : 12;
        const intensity = Math.abs(value);

        this.ctx.beginPath();

        if (this.type === 'traditional') {
            // Circle for traditional NN
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, `${config.activationColor}${Math.floor(intensity * 255).toString(16).padStart(2, '0')}`);
            gradient.addColorStop(1, `${config.nodeColor}40`);

            this.ctx.fillStyle = gradient;
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();

            // Glow effect
            this.ctx.shadowColor = config.glowColor;
            this.ctx.shadowBlur = 10 * intensity;
            this.ctx.strokeStyle = config.activationColor;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
        } else {
            // Hexagon for constraint network
            this.ctx.fillStyle = value > 0.5 ? config.satisfiedColor : config.nodeColor;
            this.drawHexagon(x, y, size);
            this.ctx.fill();

            // Satisfaction indicator
            if (value > 0.5) {
                this.ctx.strokeStyle = config.satisfiedColor;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        }
    }

    drawHexagon(x, y, size) {
        const sides = 6;
        this.ctx.beginPath();
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides) - Math.PI / 6;
            const px = x + size * Math.cos(angle);
            const py = y + size * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
    }

    drawConnection(x1, y1, x2, y2, weight, satisfaction = 1) {
        const config = this.type === 'traditional' ? CONFIG.traditional : CONFIG.constraint;

        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);

        if (this.type === 'traditional') {
            // Line thickness based on weight
            const thickness = Math.abs(weight) * 3 + 0.5;
            const alpha = Math.min(1, Math.abs(weight) + 0.3);

            this.ctx.strokeStyle = weight > 0
                ? `rgba(96, 165, 250, ${alpha})`
                : `rgba(239, 68, 68, ${alpha})`;
            this.ctx.lineWidth = thickness;
        } else {
            // Color based on constraint satisfaction
            const color = satisfaction > 0.7 ? config.satisfiedColor : config.violatedColor;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = satisfaction;
        }

        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }

    drawSignal(x1, y1, x2, y2, progress, color) {
        const x = x1 + (x2 - x1) * progress;
        const y = y1 + (y2 - y1) * progress;

        this.ctx.beginPath();
        this.ctx.arc(x, y, CONFIG.animation.particleSize, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();

        // Glow
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }

    animateSignals(connections, color) {
        // Remove old signals
        this.signals = this.signals.filter(s => s.progress < 1);

        // Add new signals
        connections.forEach(conn => {
            if (Math.random() < 0.3) {
                this.signals.push({
                    x1: conn.x1,
                    y1: conn.y1,
                    x2: conn.x2,
                    y2: conn.y2,
                    progress: 0,
                    speed: 0.02 + Math.random() * 0.02
                });
            }
        });

        // Update and draw signals
        this.signals.forEach(signal => {
            signal.progress += signal.speed;
            this.drawSignal(signal.x1, signal.y1, signal.x2, signal.y2, signal.progress, color);
        });
    }

    drawNetwork(network, activations, options = {}) {
        this.clear();

        const layers = network.layers;
        const layerSpacing = this.width / (layers.length + 1);
        const nodePositions = [];

        // Calculate node positions
        for (let i = 0; i < layers.length; i++) {
            const layerPositions = [];
            const nodeSpacing = this.height / (layers[i] + 1);

            for (let j = 0; j < layers[i]; j++) {
                layerPositions.push({
                    x: layerSpacing * (i + 1),
                    y: nodeSpacing * (j + 1)
                });
            }

            nodePositions.push(layerPositions);
        }

        // Draw connections
        const connections = [];

        if (options.showWeights !== false) {
            for (let i = 0; i < layers.length - 1; i++) {
                for (let j = 0; j < layers[i + 1]; j++) {
                    for (let k = 0; k < layers[i]; k++) {
                        const from = nodePositions[i][k];
                        const to = nodePositions[i + 1][j];

                        let weight, satisfaction;

                        if (this.type === 'traditional') {
                            weight = network.weights[i][j][k];
                            satisfaction = 1;
                        } else {
                            weight = network.constraints[i][j][k].distance;
                            satisfaction = network.constraints[i][j][k].satisfaction;
                        }

                        this.drawConnection(from.x, from.y, to.x, to.y, weight, satisfaction);
                        connections.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y });
                    }
                }
            }
        }

        // Animate signals if enabled
        if (options.animatePass && options.showActivations !== false) {
            const signalColor = this.type === 'traditional' ? '#60a5fa' : '#34d399';
            this.animateSignals(connections, signalColor);
        }

        // Draw nodes
        if (options.showActivations !== false) {
            for (let i = 0; i < layers.length; i++) {
                for (let j = 0; j < layers[i]; j++) {
                    const pos = nodePositions[i][j];
                    const value = activations && activations[i] ? activations[i][j] : 0.5;
                    this.drawNode(pos.x, pos.y, value, i === 0);
                }
            }
        }

        // Draw gradient flow if enabled
        if (options.showGradients && this.type === 'traditional' && network.gradients.length > 0) {
            this.drawGradientFlow(network, nodePositions);
        }
    }

    drawGradientFlow(network, nodePositions) {
        // Visualize gradient magnitude with color intensity
        for (let i = 0; i < network.gradients.length; i++) {
            for (let j = 0; j < network.gradients[i].length; j++) {
                for (let k = 0; k < network.gradients[i][j].length; k++) {
                    const from = nodePositions[i][k];
                    const to = nodePositions[i + 1][j];
                    const gradient = Math.abs(network.gradients[i][j][k]);

                    if (gradient > 0.01) {
                        const alpha = Math.min(1, gradient * 10);
                        this.ctx.beginPath();
                        this.ctx.moveTo(from.x, from.y);
                        this.ctx.lineTo(to.x, to.y);
                        this.ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`;
                        this.ctx.lineWidth = 3;
                        this.ctx.stroke();
                    }
                }
            }
        }
    }
}

// ==================== LOSS GRAPH ====================
class LossGraph {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.traditionalLoss = [];
        this.constraintLoss = [];
        this.maxPoints = 100;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.width = rect.width;
        this.height = rect.height;
    }

    addLoss(traditionalLoss, constraintLoss) {
        this.traditionalLoss.push(traditionalLoss);
        this.constraintLoss.push(constraintLoss);

        if (this.traditionalLoss.length > this.maxPoints) {
            this.traditionalLoss.shift();
            this.constraintLoss.shift();
        }
    }

    clear() {
        this.traditionalLoss = [];
        this.constraintLoss = [];
    }

    draw() {
        this.ctx.fillStyle = 'rgba(15, 15, 35, 1)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw grid
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        for (let i = 0; i <= 4; i++) {
            const y = (this.height / 4) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }

        // Draw loss lines
        if (this.traditionalLoss.length > 1) {
            this.drawLine(this.traditionalLoss, '#3b82f6', 'Traditional NN');
            this.drawLine(this.constraintLoss, '#10b981', 'Constraint NN');
        }

        // Draw labels
        this.ctx.fillStyle = '#9ca3af';
        this.ctx.font = '12px monospace';
        this.ctx.fillText('0.0', 5, this.height - 5);
        this.ctx.fillText('1.0', 5, 15);
        this.ctx.fillText('Training Steps →', this.width - 100, this.height - 5);
    }

    drawLine(data, color, label) {
        const maxLoss = Math.max(...data, 0.1);
        const stepX = this.width / (this.maxPoints - 1);

        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;

        data.forEach((loss, i) => {
            const x = i * stepX;
            const y = this.height - (loss / maxLoss) * (this.height - 20) - 10;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });

        this.ctx.stroke();
    }
}

// ==================== MAIN APPLICATION ====================
class NeuralNetworkSimulator {
    constructor() {
        this.currentArchitecture = 'simple';
        this.currentProblem = 'xor';
        this.epoch = 0;
        this.isAutoTraining = false;
        this.autoTrainInterval = null;

        this.initializeNetworks();
        this.initializeVisualizers();
        this.initializeLossGraph();
        this.setupEventListeners();
        this.update();
    }

    initializeNetworks() {
        const arch = ARCHITECTURES[this.currentArchitecture];
        this.traditionalNN = new TraditionalNeuralNetwork(arch.layers);
        this.constraintNN = new ConstraintNetwork(arch.layers);
    }

    initializeVisualizers() {
        this.traditionalViz = new NetworkVisualizer('traditionalCanvas', 'traditional');
        this.constraintViz = new NetworkVisualizer('constraintCanvas', 'constraint');
    }

    initializeLossGraph() {
        this.lossGraph = new LossGraph('lossCanvas');
    }

    setupEventListeners() {
        // Architecture selector
        document.getElementById('architectureSelect').addEventListener('change', (e) => {
            this.currentArchitecture = e.target.value;
            this.initializeNetworks();
            this.resetTraining();
        });

        // Problem selector
        document.getElementById('problemSelect').addEventListener('change', (e) => {
            this.currentProblem = e.target.value;
            this.resetTraining();
        });

        // Input sliders
        document.getElementById('input1').addEventListener('input', (e) => {
            document.getElementById('input1Value').textContent = parseFloat(e.target.value).toFixed(1);
            this.update();
        });

        document.getElementById('input2').addEventListener('input', (e) => {
            document.getElementById('input2Value').textContent = parseFloat(e.target.value).toFixed(1);
            this.update();
        });

        // Random input button
        document.getElementById('randomInput').addEventListener('click', () => {
            const input1 = Math.random() > 0.5 ? 1 : 0;
            const input2 = Math.random() > 0.5 ? 1 : 0;
            document.getElementById('input1').value = input1;
            document.getElementById('input2').value = input2;
            document.getElementById('input1Value').textContent = input1.toFixed(1);
            document.getElementById('input2Value').textContent = input2.toFixed(1);
            this.update();
        });

        // Visualization checkboxes
        ['showWeights', 'showActivations', 'showGradients', 'animatePass'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.update());
        });

        // Training buttons
        document.getElementById('trainStep').addEventListener('click', () => this.trainStep());
        document.getElementById('trainEpoch').addEventListener('click', () => this.trainEpoch());
        document.getElementById('autoTrain').addEventListener('click', () => this.toggleAutoTrain());
        document.getElementById('resetNetwork').addEventListener('click', () => this.resetTraining());
    }

    getInput() {
        const input1 = parseFloat(document.getElementById('input1').value);
        const input2 = parseFloat(document.getElementById('input2').value);
        return [input1, input2];
    }

    getVisualizationOptions() {
        return {
            showWeights: document.getElementById('showWeights').checked,
            showActivations: document.getElementById('showActivations').checked,
            showGradients: document.getElementById('showGradients').checked,
            animatePass: document.getElementById('animatePass').checked
        };
    }

    update() {
        const input = this.getInput();
        const options = this.getVisualizationOptions();

        // Forward pass
        const traditionalOutput = this.traditionalNN.forward(input);
        const constraintOutput = this.constraintNN.forward(input);

        // Update visualizations
        this.traditionalViz.drawNetwork(this.traditionalNN, this.traditionalNN.activations, options);
        this.constraintViz.drawNetwork(this.constraintNN, this.constraintNN.positions, options);

        // Update stats
        this.updateStats();

        // Update loss graph
        this.lossGraph.draw();

        // Continue animation
        if (options.animatePass) {
            requestAnimationFrame(() => this.update());
        }
    }

    updateStats() {
        // Traditional NN stats
        document.getElementById('traditionalParams').textContent = this.traditionalNN.getParameterCount();
        document.getElementById('traditionalActivation').textContent = this.traditionalNN.getActivationSum().toFixed(2);
        document.getElementById('traditionalGradient').textContent = this.traditionalNN.getGradientFlow().toFixed(3);

        // Constraint NN stats
        document.getElementById('constraintParams').textContent = this.constraintNN.getConstraintCount();
        document.getElementById('constraintSatisfaction').textContent = (this.constraintNN.getAverageSatisfaction() * 100).toFixed(1) + '%';
        document.getElementById('constraintViolations').textContent = this.constraintNN.getTotalViolations();
    }

    trainStep() {
        const problem = PROBLEMS[this.currentProblem];
        let traditionalLoss = 0;
        let constraintLoss = 0;

        // Train on all examples
        problem.forEach(example => {
            // Traditional NN
            const tradOutput = this.traditionalNN.forward(example.input);
            const tradError = example.output[0] - tradOutput[0];
            traditionalLoss += tradError * tradError;
            this.traditionalNN.backward(example.output, 0.3);

            // Constraint NN
            const constrOutput = this.constraintNN.forward(example.input);
            const constrError = example.output[0] - constrOutput[0];
            constraintLoss += constrError * constrError;
            this.constraintNN.backward(example.output, 0.3);
        });

        // Average loss
        traditionalLoss /= problem.length;
        constraintLoss /= problem.length;

        // Update loss graph
        this.lossGraph.addLoss(traditionalLoss, constraintLoss);

        // Update visualization
        this.update();
    }

    trainEpoch() {
        for (let i = 0; i < 4; i++) {
            this.trainStep();
        }
        this.epoch++;
        document.getElementById('epochCount').textContent = `Epoch: ${this.epoch}`;

        // Update progress
        const progress = Math.min(100, this.epoch * 5);
        document.getElementById('trainingProgress').style.width = `${progress}%`;
    }

    toggleAutoTrain() {
        const button = document.getElementById('autoTrain');

        if (this.isAutoTraining) {
            this.isAutoTraining = false;
            clearInterval(this.autoTrainInterval);
            button.textContent = 'Auto Train';
            button.classList.remove('active');
        } else {
            this.isAutoTraining = true;
            this.autoTrainInterval = setInterval(() => {
                this.trainEpoch();
                if (this.epoch >= 20) {
                    this.toggleAutoTrain();
                }
            }, 500);
            button.textContent = 'Stop Training';
            button.classList.add('active');
        }
    }

    resetTraining() {
        this.traditionalNN.reset();
        this.constraintNN.reset();
        this.epoch = 0;
        this.lossGraph.clear();
        document.getElementById('epochCount').textContent = 'Epoch: 0';
        document.getElementById('trainingProgress').style.width = '0%';

        if (this.isAutoTraining) {
            this.toggleAutoTrain();
        }

        this.update();
    }
}

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', () => {
    new NeuralNetworkSimulator();
});

// Theory of Constraints Simulator
// Demonstrates how bottlenecks determine system throughput

class TOCSimulator {
    constructor() {
        // Canvas setup
        this.pipelineCanvas = document.getElementById('pipelineCanvas');
        this.pipelineCtx = this.pipelineCanvas.getContext('2d');
        this.throughputCanvas = document.getElementById('throughputGraph');
        this.throughputCtx = this.throughputCanvas.getContext('2d');

        // Simulation state
        this.isRunning = false;
        this.simulationSpeed = 1;
        this.inputRate = 10; // items per minute
        this.time = 0;
        this.completedItems = 0;
        this.throughputHistory = [];
        this.currentStep = 0;

        // Pipeline configuration
        this.numStations = 6;
        this.stations = [];
        this.items = [];
        this.itemCounter = 0;

        // Colors
        this.colors = {
            flowing: '#00d4aa',
            queuing: '#ffb84d',
            blocked: '#ff6b6b',
            bottleneck: '#ff4757',
            station: '#1a2235',
            stationBorder: '#4a9eff',
            item: '#6b73ff',
            conveyor: '#2a3350'
        };

        // Initialize
        this.initializeStations();
        this.setupEventListeners();
        this.createCapacityControls();
        this.updateDashboard();
        this.drawPipeline();
        this.drawThroughputGraph();
    }

    initializeStations() {
        this.stations = [];
        const baseCapacity = 10;

        for (let i = 0; i < this.numStations; i++) {
            this.stations.push({
                id: i,
                x: 150 + i * 170,
                y: 200,
                width: 120,
                height: 80,
                capacity: baseCapacity,
                queue: [],
                processing: null,
                processed: 0,
                utilization: 0
            });
        }
    }

    setupEventListeners() {
        // Start/Stop button
        document.getElementById('startStopBtn').addEventListener('click', () => {
            this.toggleSimulation();
        });

        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetSimulation();
        });

        // Input rate slider
        document.getElementById('inputRate').addEventListener('input', (e) => {
            this.inputRate = parseInt(e.target.value);
            document.getElementById('inputRateValue').textContent = this.inputRate;
        });

        // Speed control slider
        document.getElementById('speedControl').addEventListener('input', (e) => {
            this.simulationSpeed = parseFloat(e.target.value);
            document.getElementById('speedValue').textContent = this.simulationSpeed.toFixed(1);
        });

        // Preset scenarios
        document.querySelectorAll('.btn-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyPreset(e.target.dataset.preset);
            });
        });

        // 5 Focusing Steps
        document.querySelectorAll('.btn-step').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const step = parseInt(e.currentTarget.dataset.step);
                this.applyFocusingStep(step);
            });
        });
    }

    createCapacityControls() {
        const container = document.getElementById('capacityControls');
        container.innerHTML = '';

        this.stations.forEach((station, index) => {
            const control = document.createElement('div');
            control.className = 'capacity-control';
            control.innerHTML = `
                <label>Station ${index + 1}:</label>
                <input type="range" class="capacity-slider" data-station="${index}"
                       min="1" max="20" value="${station.capacity}">
                <span class="capacity-value" id="capacity-${index}">${station.capacity}</span>
            `;
            container.appendChild(control);
        });

        // Add event listeners to sliders
        document.querySelectorAll('.capacity-slider').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const stationIndex = parseInt(e.target.dataset.station);
                const newCapacity = parseInt(e.target.value);
                this.stations[stationIndex].capacity = newCapacity;
                document.getElementById(`capacity-${stationIndex}`).textContent = newCapacity;
                this.drawPipeline();
            });
        });
    }

    updateCapacitySliders() {
        this.stations.forEach((station, index) => {
            const slider = document.querySelector(`.capacity-slider[data-station="${index}"]`);
            const valueDisplay = document.getElementById(`capacity-${index}`);
            if (slider && valueDisplay) {
                slider.value = station.capacity;
                valueDisplay.textContent = station.capacity;
            }
        });
    }

    toggleSimulation() {
        this.isRunning = !this.isRunning;
        const btn = document.getElementById('startStopBtn');

        if (this.isRunning) {
            btn.textContent = 'Stop Simulation';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
            this.lastTime = performance.now();
            this.gameLoop();
        } else {
            btn.textContent = 'Start Simulation';
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary');
        }
    }

    resetSimulation() {
        this.isRunning = false;
        this.time = 0;
        this.completedItems = 0;
        this.throughputHistory = [];
        this.items = [];
        this.itemCounter = 0;
        this.currentStep = 0;

        // Reset stations
        this.stations.forEach(station => {
            station.queue = [];
            station.processing = null;
            station.processed = 0;
            station.utilization = 0;
        });

        // Update UI
        document.getElementById('startStopBtn').textContent = 'Start Simulation';
        document.getElementById('startStopBtn').classList.remove('btn-secondary');
        document.getElementById('startStopBtn').classList.add('btn-primary');
        document.getElementById('stepDescription').textContent = '';

        // Clear active step buttons
        document.querySelectorAll('.btn-step').forEach(btn => {
            btn.classList.remove('active');
        });

        this.updateDashboard();
        this.drawPipeline();
        this.drawThroughputGraph();
    }

    gameLoop(currentTime = performance.now()) {
        if (!this.isRunning) return;

        const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = currentTime;

        this.update(deltaTime * this.simulationSpeed);
        this.drawPipeline();
        this.updateDashboard();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        this.time += deltaTime;

        // Spawn new items based on input rate
        const spawnInterval = 60 / this.inputRate; // seconds between spawns
        if (this.time >= this.itemCounter * spawnInterval) {
            this.spawnItem();
        }

        // Process items at each station
        this.stations.forEach((station, index) => {
            // Check if current processing is complete
            if (station.processing) {
                const processingTime = 60 / station.capacity; // minutes per item converted to seconds
                station.processing.progress += deltaTime;

                if (station.processing.progress >= processingTime) {
                    // Move to next station or complete
                    if (index < this.stations.length - 1) {
                        const nextStation = this.stations[index + 1];
                        nextStation.queue.push(station.processing);
                    } else {
                        this.completedItems++;
                    }
                    station.processed++;
                    station.processing = null;
                }
            }

            // Start processing next item if available
            if (!station.processing && station.queue.length > 0) {
                station.processing = station.queue.shift();
                station.processing.progress = 0;
            }

            // Update utilization
            station.utilization = station.processing ?
                Math.min(100, (station.processing.progress / (60 / station.capacity)) * 100) : 0;
        });

        // Record throughput every second
        if (Math.floor(this.time) > this.throughputHistory.length) {
            this.throughputHistory.push(this.completedItems);
            if (this.throughputHistory.length > 60) {
                this.throughputHistory.shift();
            }
        }
    }

    spawnItem() {
        const item = {
            id: this.itemCounter++,
            x: 50,
            y: 200,
            color: `hsl(${Math.random() * 60 + 220}, 70%, 60%)`
        };
        this.stations[0].queue.push(item);
    }

    drawPipeline() {
        const ctx = this.pipelineCtx;
        const canvas = this.pipelineCanvas;

        // Clear canvas
        ctx.fillStyle = '#0a0e1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw conveyor belt
        this.drawConveyorBelt(ctx);

        // Find bottleneck
        const bottleneck = this.findBottleneck();

        // Draw stations
        this.stations.forEach((station, index) => {
            this.drawStation(ctx, station, index, bottleneck);
        });

        // Draw items in queues
        this.stations.forEach((station, index) => {
            this.drawQueue(ctx, station, index);
        });

        // Draw items being processed
        this.stations.forEach((station, index) => {
            if (station.processing) {
                this.drawProcessingItem(ctx, station, index);
            }
        });

        // Draw input items
        this.drawInputItems(ctx);
    }

    drawConveyorBelt(ctx) {
        ctx.strokeStyle = this.colors.conveyor;
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 5]);

        ctx.beginPath();
        ctx.moveTo(50, 200);
        ctx.lineTo(1150, 200);
        ctx.stroke();

        ctx.setLineDash([]);
    }

    drawStation(ctx, station, index, bottleneck) {
        const isBottleneck = bottleneck === index;

        // Station box
        ctx.fillStyle = isBottleneck ? 'rgba(255, 71, 87, 0.2)' : this.colors.station;
        ctx.strokeStyle = isBottleneck ? this.colors.bottleneck : this.colors.stationBorder;
        ctx.lineWidth = isBottleneck ? 3 : 2;

        // Pulse effect for bottleneck
        if (isBottleneck && this.isRunning) {
            const pulse = Math.sin(this.time * 5) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(255, 71, 87, ${pulse * 0.3})`;
        }

        ctx.fillRect(station.x, station.y - station.height / 2, station.width, station.height);
        ctx.strokeRect(station.x, station.y - station.height / 2, station.width, station.height);

        // Station label
        ctx.fillStyle = '#e4e9f2';
        ctx.font = 'bold 14px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(`Station ${index + 1}`, station.x + station.width / 2, station.y - station.height / 2 - 10);

        // Capacity label
        ctx.fillStyle = this.colors.stationBorder;
        ctx.font = '12px Segoe UI';
        ctx.fillText(`${station.capacity} items/min`, station.x + station.width / 2, station.y + station.height / 2 + 20);

        // Utilization bar
        const barWidth = station.width - 20;
        const barHeight = 6;
        const barX = station.x + 10;
        const barY = station.y + station.height / 2 + 5;

        ctx.fillStyle = '#2a3350';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const utilizationWidth = (station.utilization / 100) * barWidth;
        const utilizationColor = station.utilization > 80 ? this.colors.blocked :
                                  station.utilization > 50 ? this.colors.queuing :
                                  this.colors.flowing;
        ctx.fillStyle = utilizationColor;
        ctx.fillRect(barX, barY, utilizationWidth, barHeight);
    }

    drawQueue(ctx, station, index) {
        const queueLength = station.queue.length;
        if (queueLength === 0) return;

        const itemSize = 15;
        const spacing = 18;
        const startX = station.x - spacing * queueLength - 10;
        const y = station.y;

        station.queue.forEach((item, i) => {
            const x = startX + i * spacing;

            ctx.fillStyle = item.color;
            ctx.fillRect(x - itemSize / 2, y - itemSize / 2, itemSize, itemSize);

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(x - itemSize / 2, y - itemSize / 2, itemSize, itemSize);
        });

        // Queue count
        if (queueLength > 0) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Segoe UI';
            ctx.textAlign = 'right';
            ctx.fillText(queueLength, startX - 20, y + 4);
        }
    }

    drawProcessingItem(ctx, station, index) {
        const itemSize = 20;
        const x = station.x + station.width / 2;
        const y = station.y;

        // Progress ring
        const progress = station.processing ? station.processing.progress / (60 / station.capacity) : 0;

        ctx.beginPath();
        ctx.arc(x, y, itemSize / 2 + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#2a3350';
        ctx.lineWidth = 3;
        ctx.stroke();

        if (progress > 0) {
            ctx.beginPath();
            ctx.arc(x, y, itemSize / 2 + 5, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
            ctx.strokeStyle = this.colors.flowing;
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // Item
        ctx.fillStyle = station.processing.color;
        ctx.fillRect(x - itemSize / 2, y - itemSize / 2, itemSize, itemSize);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - itemSize / 2, y - itemSize / 2, itemSize, itemSize);
    }

    drawInputItems(ctx) {
        // Draw items waiting to enter the system
        const waitingItems = Math.floor(this.inputRate * 0.5);
        if (waitingItems <= 0) return;

        const itemSize = 15;
        const spacing = 18;
        const startX = 30;
        const y = 200;

        for (let i = 0; i < waitingItems; i++) {
            const x = startX - i * spacing;

            ctx.fillStyle = `hsl(${Math.random() * 60 + 220}, 70%, 60%)`;
            ctx.fillRect(x - itemSize / 2, y - itemSize / 2, itemSize, itemSize);

            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(x - itemSize / 2, y - itemSize / 2, itemSize, itemSize);
        }
    }

    findBottleneck() {
        let maxQueue = 0;
        let bottleneckIndex = -1;

        this.stations.forEach((station, index) => {
            const totalItems = station.queue.length + (station.processing ? 1 : 0);
            if (totalItems > maxQueue) {
                maxQueue = totalItems;
                bottleneckIndex = index;
            }
        });

        return bottleneckIndex;
    }

    updateDashboard() {
        // Update throughput value
        const throughput = this.throughputHistory.length > 1 ?
            Math.round((this.throughputHistory[this.throughputHistory.length - 1] -
                       (this.throughputHistory[this.throughputHistory.length - 2] || 0)) * 60) : 0;
        document.getElementById('throughputValue').textContent = throughput;

        // Update bottleneck indicator
        const bottleneck = this.findBottleneck();
        if (bottleneck >= 0) {
            document.getElementById('bottleneckStation').textContent = bottleneck + 1;
            document.getElementById('bottleneckCapacity').textContent =
                `${this.stations[bottleneck].capacity} items/min`;
            document.getElementById('bottleneckQueue').textContent =
                this.stations[bottleneck].queue.length + (this.stations[bottleneck].processing ? 1 : 0);
        } else {
            document.getElementById('bottleneckStation').textContent = '-';
            document.getElementById('bottleneckCapacity').textContent = '-';
            document.getElementById('bottleneckQueue').textContent = '-';
        }

        // Update system throughput
        document.getElementById('systemThroughput').textContent = throughput;

        // Update WIP summary
        const wipSummary = document.getElementById('wipSummary');
        wipSummary.innerHTML = '';
        let totalWIP = 0;

        this.stations.forEach((station, index) => {
            const wip = station.queue.length + (station.processing ? 1 : 0);
            totalWIP += wip;

            const wipItem = document.createElement('div');
            wipItem.className = 'wip-item';
            wipItem.innerHTML = `S${index + 1}: ${wip}`;
            wipSummary.appendChild(wipItem);
        });

        document.getElementById('totalWIP').textContent = totalWIP;

        // Draw throughput graph
        this.drawThroughputGraph();
    }

    drawThroughputGraph() {
        const ctx = this.throughputCtx;
        const canvas = this.throughputCanvas;

        // Clear canvas
        ctx.fillStyle = '#0a0e1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        ctx.strokeStyle = '#1a2235';
        ctx.lineWidth = 1;

        for (let i = 0; i <= 4; i++) {
            const y = (canvas.height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }

        if (this.throughputHistory.length < 2) return;

        // Calculate throughput data
        const data = [];
        for (let i = 1; i < this.throughputHistory.length; i++) {
            const throughput = (this.throughputHistory[i] - this.throughputHistory[i - 1]) * 60;
            data.push(throughput);
        }

        if (data.length === 0) return;

        const maxThroughput = Math.max(...data, 10);
        const stepX = canvas.width / Math.max(data.length - 1, 1);

        // Draw throughput line
        ctx.beginPath();
        ctx.strokeStyle = this.colors.flowing;
        ctx.lineWidth = 2;

        data.forEach((value, index) => {
            const x = index * stepX;
            const y = canvas.height - (value / maxThroughput) * canvas.height * 0.9;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw gradient fill
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(0, 212, 170, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 212, 170, 0)');

        ctx.lineTo(data.length * stepX, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    applyPreset(preset) {
        this.resetSimulation();

        const presets = {
            'balanced': [10, 10, 10, 10, 10, 10],
            'one-bottleneck': [12, 12, 5, 12, 12, 12],
            'two-bottlenecks': [12, 6, 12, 6, 12, 12],
            'cascading': [12, 10, 8, 6, 4, 12]
        };

        if (presets[preset]) {
            presets[preset].forEach((capacity, index) => {
                this.stations[index].capacity = capacity;
            });
            this.updateCapacitySliders();
            this.drawPipeline();
        }
    }

    applyFocusingStep(step) {
        this.currentStep = step;
        const bottleneck = this.findBottleneck();

        // Clear all active buttons
        document.querySelectorAll('.btn-step').forEach(btn => {
            btn.classList.remove('active');
        });

        // Set current button as active
        document.querySelector(`.btn-step[data-step="${step}"]`).classList.add('active');

        const descriptions = {
            1: `<strong>IDENTIFY:</strong> The constraint (bottleneck) is Station ${bottleneck + 1}. It has the longest queue with ${this.stations[bottleneck].queue.length} items waiting. This station determines the throughput of the entire system.`,
            2: `<strong>EXPLOIT:</strong> Make sure Station ${bottleneck + 1} never runs idle. The bottleneck should always be working. If it's not processing, the entire system loses throughput. Input rate automatically adjusted to feed the bottleneck.`,
            3: `<strong>SUBORDINATE:</strong> All other stations align their pace with the bottleneck. Non-bottleneck stations slow down to match Station ${bottleneck + 1}'s capacity of ${this.stations[bottleneck].capacity} items/min. This prevents WIP buildup.`,
            4: `<strong>ELEVATE:</strong> Increase the bottleneck's capacity. Station ${bottleneck + 1}'s capacity is increased from ${this.stations[bottleneck].capacity} to ${Math.min(20, this.stations[bottleneck].capacity + 5)} items/min. If this doesn't help, it's not the true constraint.`,
            5: `<strong>REPEAT:</strong> With the old constraint elevated, a new bottleneck emerges. Go back to Step 1. The cycle continues - constraints move, never disappear.`
        };

        document.getElementById('stepDescription').innerHTML = descriptions[step];

        // Apply step actions
        switch (step) {
            case 2: // Exploit - ensure bottleneck never starves
                if (bottleneck >= 0) {
                    this.inputRate = Math.max(this.inputRate, this.stations[bottleneck].capacity);
                    document.getElementById('inputRate').value = this.inputRate;
                    document.getElementById('inputRateValue').textContent = this.inputRate;
                }
                break;

            case 3: // Subordinate - match bottleneck capacity
                if (bottleneck >= 0) {
                    const bottleneckCapacity = this.stations[bottleneck].capacity;
                    this.stations.forEach((station, index) => {
                        if (index !== bottleneck) {
                            station.capacity = Math.min(station.capacity, bottleneckCapacity);
                        }
                    });
                    this.updateCapacitySliders();
                }
                break;

            case 4: // Elevate - increase bottleneck capacity
                if (bottleneck >= 0) {
                    this.stations[bottleneck].capacity = Math.min(20, this.stations[bottleneck].capacity + 5);
                    this.updateCapacitySliders();
                }
                break;

            case 5: // Repeat - find new bottleneck
                setTimeout(() => {
                    this.applyFocusingStep(1);
                }, 3000);
                break;
        }

        this.drawPipeline();
    }
}

// Initialize simulator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tocSimulator = new TOCSimulator();
});

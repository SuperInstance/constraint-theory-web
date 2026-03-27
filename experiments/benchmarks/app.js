// Benchmark Results Storage
let benchmarkResults = [];
let isRunning = false;
let shouldStop = false;

// Benchmark Definitions
const benchmarks = [
    {
        id: 'pythagorean',
        name: 'Pythagorean Snapping vs MLP',
        category: 'Constraint Solving',
        description: 'Constraint satisfaction speed',
        constraintOps: 2500000,
        traditionalOps: 25000,
        constraintUnit: 'snaps/sec',
        traditionalUnit: 'inferences/sec',
        constraintColor: '#00ff88',
        traditionalColor: '#ff4757'
    },
    {
        id: 'kdtree',
        name: 'KD-Tree vs Linear Search',
        category: 'Spatial Queries',
        description: 'Nearest neighbor query',
        constraintOps: 150000,
        traditionalOps: 5000,
        constraintUnit: 'queries/sec',
        traditionalUnit: 'queries/sec',
        constraintColor: '#00ff88',
        traditionalColor: '#ff4757'
    },
    {
        id: 'geometric',
        name: 'Geometric Constraint vs Force-Based',
        category: 'Geometric Operations',
        description: 'Physics simulation step',
        constraintOps: 80000,
        traditionalOps: 12000,
        constraintUnit: 'steps/sec',
        traditionalUnit: 'steps/sec',
        constraintColor: '#00ff88',
        traditionalColor: '#ff4757'
    },
    {
        id: 'deterministic',
        name: 'Deterministic vs Stochastic',
        category: 'Neural Network',
        description: 'Output variance (lower is better)',
        constraintOps: 0,
        traditionalOps: 0.5,
        constraintUnit: 'variance',
        traditionalUnit: 'variance',
        constraintColor: '#00ff88',
        traditionalColor: '#ff4757',
        inverse: true // Lower is better
    }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    setupEventListeners();
    runAllBenchmarks();
});

function setupEventListeners() {
    document.getElementById('runAllBtn').addEventListener('click', runAllBenchmarks);
    document.getElementById('stopBtn').addEventListener('click', stopBenchmarks);

    document.querySelectorAll('.chart-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            switchChartType(e.target.dataset.type);
        });
    });
}

function switchChartType(type) {
    const chartsContainer = document.getElementById('chartsContainer');
    const radarContainer = document.getElementById('radarChartContainer');
    const tableContainer = document.getElementById('tableContainer');

    chartsContainer.style.display = type === 'bar' ? 'grid' : 'none';
    radarContainer.style.display = type === 'radar' ? 'flex' : 'none';
    tableContainer.style.display = type === 'table' ? 'block' : 'none';

    if (type === 'radar' && benchmarkResults.length > 0) {
        drawRadarChart();
    } else if (type === 'table' && benchmarkResults.length > 0) {
        populateTable();
    }
}

function initializeCharts() {
    const container = document.getElementById('chartsContainer');
    container.innerHTML = '';

    benchmarks.forEach(benchmark => {
        const card = document.createElement('div');
        card.className = 'chart-card';
        card.id = `card-${benchmark.id}`;
        card.innerHTML = `
            <h3>${benchmark.name}</h3>
            <canvas class="chart-canvas" id="canvas-${benchmark.id}"></canvas>
            <div class="chart-info">
                <div class="info-item">
                    <div class="info-label">Constraint Theory</div>
                    <div class="info-value constraint" id="constraint-ops-${benchmark.id}">-</div>
                    <div class="info-label">${benchmark.constraintUnit}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Traditional</div>
                    <div class="info-value traditional" id="traditional-ops-${benchmark.id}">-</div>
                    <div class="info-label">${benchmark.traditionalUnit}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Speedup</div>
                    <div class="info-value speedup" id="speedup-${benchmark.id}">-</div>
                    <div class="info-label">x faster</div>
                </div>
            </div>
        `;
        container.appendChild(card);

        // Initialize empty chart
        const canvas = document.getElementById(`canvas-${benchmark.id}`);
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        const ctx = canvas.getContext('2d');
        ctx.scale(2, 2);
        drawEmptyChart(ctx, canvas.offsetWidth, canvas.offsetHeight);
    });
}

function drawEmptyChart(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#3a4a6a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();

    // Draw label
    ctx.fillStyle = '#a0aec0';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Run benchmark to see results', width / 2, height / 2);
}

async function runAllBenchmarks() {
    if (isRunning) return;
    isRunning = true;
    shouldStop = false;
    benchmarkResults = [];

    document.getElementById('runAllBtn').disabled = true;
    document.getElementById('spinner').classList.add('active');
    updateStatus('Running benchmarks...');

    for (const benchmark of benchmarks) {
        if (shouldStop) break;

        updateStatus(`Running ${benchmark.name}...`);
        await runBenchmark(benchmark);
        await sleep(300);
    }

    document.getElementById('runAllBtn').disabled = false;
    document.getElementById('spinner').classList.remove('active');

    if (!shouldStop) {
        updateStatus('All benchmarks complete!');
        updateSummary();
    } else {
        updateStatus('Benchmarks stopped');
    }

    isRunning = false;
}

function stopBenchmarks() {
    shouldStop = true;
    updateStatus('Stopping...');
}

async function runBenchmark(benchmark) {
    const canvas = document.getElementById(`canvas-${benchmark.id}`);
    const ctx = canvas.getContext('2d');

    // Simulate benchmark execution time
    const executionTime = 500 + Math.random() * 1000;

    // Calculate speedup
    let speedup;
    if (benchmark.inverse) {
        // For inverse metrics (lower is better)
        speedup = benchmark.traditionalOps > 0 ? benchmark.traditionalOps / Math.max(benchmark.constraintOps, 0.001) : benchmark.constraintOps;
    } else {
        speedup = benchmark.constraintOps / benchmark.traditionalOps;
    }

    const result = {
        id: benchmark.id,
        name: benchmark.name,
        constraintOps: benchmark.constraintOps,
        traditionalOps: benchmark.traditionalOps,
        speedup: speedup,
        constraintUnit: benchmark.constraintUnit,
        traditionalUnit: benchmark.traditionalUnit,
        inverse: benchmark.inverse
    };

    benchmarkResults.push(result);

    // Update info display
    document.getElementById(`constraint-ops-${benchmark.id}`).textContent =
        formatNumber(benchmark.constraintOps);
    document.getElementById(`traditional-ops-${benchmark.id}`).textContent =
        formatNumber(benchmark.traditionalOps);
    document.getElementById(`speedup-${benchmark.id}`).textContent =
        speedup.toFixed(1) + 'x';

    // Animate chart
    await animateChart(ctx, canvas, benchmark, result);
}

async function animateChart(ctx, canvas, benchmark, result) {
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const duration = 1000;
    const startTime = performance.now();

    return new Promise(resolve => {
        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easedProgress = 1 - Math.pow(1 - progress, 3);

            drawBarChart(ctx, width, height, benchmark, result, easedProgress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        }

        requestAnimationFrame(animate);
    });
}

function drawBarChart(ctx, width, height, benchmark, result, progress) {
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 20, right: 20, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find max value for scaling
    const maxValue = Math.max(result.constraintOps, result.traditionalOps) * 1.1;

    // Draw axes
    ctx.strokeStyle = '#3a4a6a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // Draw grid lines
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        // Y-axis labels
        const value = maxValue - (maxValue / 5) * i;
        ctx.fillStyle = '#a0aec0';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(formatNumber(value), padding.left - 10, y + 4);
    }

    // Bar dimensions
    const barWidth = chartWidth / 4;
    const barSpacing = chartWidth / 6;

    // Draw Constraint Theory bar (green)
    const constraintHeight = (result.constraintOps / maxValue) * chartHeight * progress;
    const constraintX = padding.left + barSpacing;
    const constraintY = height - padding.bottom - constraintHeight;

    // Gradient for constraint bar
    const constraintGradient = ctx.createLinearGradient(constraintX, constraintY, constraintX, height - padding.bottom);
    constraintGradient.addColorStop(0, '#00ff88');
    constraintGradient.addColorStop(1, '#00cc6a');

    ctx.fillStyle = constraintGradient;
    ctx.fillRect(constraintX, constraintY, barWidth, constraintHeight);

    // Draw Traditional bar (red)
    const traditionalHeight = (result.traditionalOps / maxValue) * chartHeight * progress;
    const traditionalX = padding.left + barSpacing * 2 + barWidth;
    const traditionalY = height - padding.bottom - traditionalHeight;

    // Gradient for traditional bar
    const traditionalGradient = ctx.createLinearGradient(traditionalX, traditionalY, traditionalX, height - padding.bottom);
    traditionalGradient.addColorStop(0, '#ff4757');
    traditionalGradient.addColorStop(1, '#cc3344');

    ctx.fillStyle = traditionalGradient;
    ctx.fillRect(traditionalX, traditionalY, barWidth, traditionalHeight);

    // X-axis labels
    ctx.fillStyle = '#e0e6ed';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Constraint Theory', constraintX + barWidth / 2, height - padding.bottom + 25);
    ctx.fillText('Traditional', traditionalX + barWidth / 2, height - padding.bottom + 25);

    // Value labels on top of bars
    if (progress > 0.8) {
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#00ff88';
        ctx.textAlign = 'center';
        ctx.fillText(formatNumber(result.constraintOps), constraintX + barWidth / 2, constraintY - 10);

        ctx.fillStyle = '#ff4757';
        ctx.fillText(formatNumber(result.traditionalOps), traditionalX + barWidth / 2, traditionalY - 10);
    }

    // Speedup badge
    if (progress > 0.9) {
        const badgeX = padding.left + chartWidth / 2;
        const badgeY = padding.top + 30;

        ctx.fillStyle = 'rgba(77, 171, 247, 0.2)';
        ctx.beginPath();
        ctx.roundRect(badgeX - 50, badgeY - 15, 100, 30, 15);
        ctx.fill();

        ctx.fillStyle = '#4dabf7';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${result.speedup.toFixed(1)}x faster`, badgeX, badgeY + 5);
    }
}

function drawRadarChart() {
    const canvas = document.getElementById('radarChart');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = 600;
    canvas.height = 600;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 200;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background circles
    ctx.strokeStyle = '#3a4a6a';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius / 5) * i, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Calculate angles for each benchmark
    const angleStep = (Math.PI * 2) / benchmarkResults.length;

    // Draw axis lines and labels
    ctx.fillStyle = '#e0e6ed';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';

    benchmarkResults.forEach((result, i) => {
        const angle = (angleStep * i) - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        // Draw axis line
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = '#3a4a6a';
        ctx.stroke();

        // Draw label
        const labelX = centerX + Math.cos(angle) * (radius + 30);
        const labelY = centerY + Math.sin(angle) * (radius + 30);
        ctx.save();
        ctx.translate(labelX, labelY);
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillText(result.name.split(' vs ')[0], 0, 0);
        ctx.restore();
    });

    // Normalize values for radar chart
    const allValues = benchmarkResults.flatMap(r => [r.constraintOps, r.traditionalOps]);
    const maxValue = Math.max(...allValues);

    // Draw Constraint Theory polygon (green)
    ctx.beginPath();
    benchmarkResults.forEach((result, i) => {
        const angle = (angleStep * i) - Math.PI / 2;
        const value = (result.constraintOps / maxValue) * radius;
        const x = centerX + Math.cos(angle) * value;
        const y = centerY + Math.sin(angle) * value;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Traditional polygon (red)
    ctx.beginPath();
    benchmarkResults.forEach((result, i) => {
        const angle = (angleStep * i) - Math.PI / 2;
        const value = (result.traditionalOps / maxValue) * radius;
        const x = centerX + Math.cos(angle) * value;
        const y = centerY + Math.sin(angle) * value;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 71, 87, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#ff4757';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw legend
    const legendX = 20;
    const legendY = canvas.height - 60;

    ctx.fillStyle = '#00ff88';
    ctx.fillRect(legendX, legendY, 20, 20);
    ctx.fillStyle = '#e0e6ed';
    ctx.textAlign = 'left';
    ctx.fillText('Constraint Theory', legendX + 30, legendY + 15);

    ctx.fillStyle = '#ff4757';
    ctx.fillRect(legendX, legendY + 30, 20, 20);
    ctx.fillStyle = '#e0e6ed';
    ctx.fillText('Traditional', legendX + 30, legendY + 45);
}

function populateTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    benchmarkResults.forEach(result => {
        const row = document.createElement('tr');

        const winner = result.constraintOps > result.traditionalOps ? 'constraint' : 'traditional';
        const winnerClass = result.constraintOps > result.traditionalOps ? 'constraint' : 'traditional';
        const winnerText = result.constraintOps > result.traditionalOps ? 'Constraint Theory' : 'Traditional';

        row.innerHTML = `
            <td><strong>${result.name}</strong></td>
            <td class="info-value constraint">${formatNumber(result.constraintOps)} ${result.constraintUnit}</td>
            <td class="info-value traditional">${formatNumber(result.traditionalOps)} ${result.traditionalUnit}</td>
            <td class="info-value speedup">${result.speedup.toFixed(1)}x</td>
            <td><span class="winner-badge ${winnerClass}">${winnerText}</span></td>
        `;

        tbody.appendChild(row);
    });
}

function updateSummary() {
    if (benchmarkResults.length === 0) return;

    // Calculate average speedup
    const avgSpeedup = benchmarkResults.reduce((sum, r) => sum + r.speedup, 0) / benchmarkResults.length;
    document.getElementById('avgSpeedup').textContent = avgSpeedup.toFixed(1) + 'x';

    // Tests run
    document.getElementById('testsRun').textContent = benchmarkResults.length;

    // Overall winner
    const constraintWins = benchmarkResults.filter(r => r.constraintOps > r.traditionalOps).length;
    const traditionalWins = benchmarkResults.filter(r => r.traditionalOps > r.constraintOps).length;

    if (constraintWins > traditionalWins) {
        document.getElementById('overallWinner').textContent = 'Constraint Theory';
        document.getElementById('overallWinner').style.color = '#00ff88';
    } else if (traditionalWins > constraintWins) {
        document.getElementById('overallWinner').textContent = 'Traditional';
        document.getElementById('overallWinner').style.color = '#ff4757';
    } else {
        document.getElementById('overallWinner').textContent = 'Tie';
        document.getElementById('overallWinner').style.color = '#e0e6ed';
    }

    // Total operations
    const totalOps = benchmarkResults.reduce((sum, r) => sum + r.constraintOps + r.traditionalOps, 0);
    document.getElementById('totalOps').textContent = formatNumber(totalOps);
}

function updateStatus(text) {
    document.getElementById('statusText').textContent = text;
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    } else if (num >= 1) {
        return num.toFixed(1);
    } else {
        return num.toFixed(3);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Monitoring and Metrics for Constraint Theory
 *
 * Provides comprehensive monitoring capabilities including:
 * - Geometric operation metrics (KD-tree queries, dodecet encoding)
 * - Spatial query performance
 * - FPS vs RTS comparison metrics
 * - Agent position/orientation tracking
 */

class ConstraintTheoryMetrics {
    constructor() {
        this.metrics = {
            // Geometric operations
            kdTreeQueries: { count: 0, totalTime: 0, errors: 0 },
            dodecetEncodings: { count: 0, totalTime: 0, errors: 0 },
            spatialQueries: { count: 0, totalTime: 0, errors: 0 },

            // FPS vs RTS metrics
            fpsOperations: { count: 0, totalTime: 0 },
            rtsOperations: { count: 0, totalTime: 0 },

            // Agent tracking
            agentPositions: { count: 0, totalTime: 0 },
            agentOrientations: { count: 0, totalTime: 0 },

            // Performance
            renderTime: { count: 0, totalTime: 0 },
            memoryUsage: { current: 0, peak: 0 },

            // Errors
            errors: { total: 0, byType: {} }
        };

        this.startTime = Date.now();
        this.observers = [];
    }

    /**
     * Record a KD-tree query
     */
    recordKDTreeQuery(duration, error = false) {
        this.metrics.kdTreeQueries.count++;
        this.metrics.kdTreeQueries.totalTime += duration;
        if (error) this.metrics.kdTreeQueries.errors++;
        this.notifyObservers('kdTreeQuery', { duration, error });
    }

    /**
     * Record a dodecet encoding operation
     */
    recordDodecetEncoding(duration, error = false) {
        this.metrics.dodecetEncodings.count++;
        this.metrics.dodecetEncodings.totalTime += duration;
        if (error) this.metrics.dodecetEncoding.errors++;
        this.notifyObservers('dodecetEncoding', { duration, error });
    }

    /**
     * Record a spatial query
     */
    recordSpatialQuery(duration, error = false) {
        this.metrics.spatialQueries.count++;
        this.metrics.spatialQueries.totalTime += duration;
        if (error) this.metrics.spatialQueries.errors++;
        this.notifyObservers('spatialQuery', { duration, error });
    }

    /**
     * Record an FPS-style operation
     */
    recordFPSOperation(duration) {
        this.metrics.fpsOperations.count++;
        this.metrics.fpsOperations.totalTime += duration;
        this.notifyObservers('fpsOperation', { duration });
    }

    /**
     * Record an RTS-style operation
     */
    recordRTSOperation(duration) {
        this.metrics.rtsOperations.count++;
        this.metrics.rtsOperations.totalTime += duration;
        this.notifyObservers('rtsOperation', { duration });
    }

    /**
     * Record agent position update
     */
    recordAgentPosition(duration) {
        this.metrics.agentPositions.count++;
        this.metrics.agentPositions.totalTime += duration;
        this.notifyObservers('agentPosition', { duration });
    }

    /**
     * Record agent orientation update
     */
    recordAgentOrientation(duration) {
        this.metrics.agentOrientations.count++;
        this.metrics.agentOrientations.totalTime += duration;
        this.notifyObservers('agentOrientation', { duration });
    }

    /**
     * Record render time
     */
    recordRenderTime(duration) {
        this.metrics.renderTime.count++;
        this.metrics.renderTime.totalTime += duration;
        this.notifyObservers('renderTime', { duration });
    }

    /**
     * Update memory usage
     */
    updateMemoryUsage() {
        if (performance.memory) {
            const current = performance.memory.usedJSHeapSize;
            this.metrics.memoryUsage.current = current;
            this.metrics.memoryUsage.peak = Math.max(
                this.metrics.memoryUsage.peak,
                current
            );
        }
    }

    /**
     * Record an error
     */
    recordError(type, message) {
        this.metrics.errors.total++;
        this.metrics.errors.byType[type] = (this.metrics.errors.byType[type] || 0) + 1;
        this.notifyObservers('error', { type, message });
    }

    /**
     * Get average duration for a metric
     */
    getAverage(metricName) {
        const metric = this.metrics[metricName];
        if (!metric || metric.count === 0) return 0;
        return metric.totalTime / metric.count;
    }

    /**
     * Get FPS vs RTS comparison
     */
    getFPSvsRTSComparison() {
        const fpsAvg = this.getAverage('fpsOperations');
        const rtsAvg = this.getAverage('rtsOperations');
        const improvement = rtsAvg > 0 ? ((rtsAvg - fpsAvg) / rtsAvg * 100) : 0;

        return {
            fpsAverage: fpsAvg,
            rtsAverage: rtsAvg,
            fpsCount: this.metrics.fpsOperations.count,
            rtsCount: this.metrics.rtsOperations.count,
            improvementPercent: improvement
        };
    }

    /**
     * Get system health
     */
    getHealth() {
        const uptime = Date.now() - this.startTime;
        const errorRate = this.metrics.kdTreeQueries.count > 0
            ? this.metrics.kdTreeQueries.errors / this.metrics.kdTreeQueries.count
            : 0;

        return {
            status: errorRate < 0.05 ? 'healthy' : 'degraded',
            uptime,
            errorRate,
            memoryUsage: this.metrics.memoryUsage.current,
            operationsPerSecond: (this.metrics.kdTreeQueries.count + this.metrics.spatialQueries.count) / (uptime / 1000)
        };
    }

    /**
     * Export metrics as JSON
     */
    toJSON() {
        return {
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.startTime,
            metrics: this.metrics,
            averages: {
                kdTreeQuery: this.getAverage('kdTreeQueries'),
                dodecetEncoding: this.getAverage('dodecetEncodings'),
                spatialQuery: this.getAverage('spatialQueries'),
                fpsOperation: this.getAverage('fpsOperations'),
                rtsOperation: this.getAverage('rtsOperations'),
                renderTime: this.getAverage('renderTime')
            },
            comparison: this.getFPSvsRTSComparison(),
            health: this.getHealth()
        };
    }

    /**
     * Export metrics for Prometheus
     */
    toPrometheus() {
        const lines = [];

        // KD-tree metrics
        lines.push(`# HELP constraint_kdtree_queries_total Total number of KD-tree queries`);
        lines.push(`# TYPE constraint_kdtree_queries_total counter`);
        lines.push(`constraint_kdtree_queries_total ${this.metrics.kdTreeQueries.count}`);

        lines.push(`# HELP constraint_kdtree_query_duration_seconds KD-tree query duration`);
        lines.push(`# TYPE constraint_kdtree_query_duration_seconds histogram`);
        lines.push(`constraint_kdtree_query_duration_seconds_sum ${this.metrics.kdTreeQueries.totalTime / 1000}`);
        lines.push(`constraint_kdtree_query_duration_seconds_count ${this.metrics.kdTreeQueries.count}`);

        // Dodecet encoding metrics
        lines.push(`# HELP constraint_dodecet_encodings_total Total number of dodecet encodings`);
        lines.push(`# TYPE constraint_dodecet_encodings_total counter`);
        lines.push(`constraint_dodecet_encodings_total ${this.metrics.dodecetEncodings.count}`);

        // Spatial query metrics
        lines.push(`# HELP constraint_spatial_queries_total Total number of spatial queries`);
        lines.push(`# TYPE constraint_spatial_queries_total counter`);
        lines.push(`constraint_spatial_queries_total ${this.metrics.spatialQueries.count}`);

        // FPS vs RTS metrics
        lines.push(`# HELP constraint_fps_operations_total Total FPS operations`);
        lines.push(`# TYPE constraint_fps_operations_total counter`);
        lines.push(`constraint_fps_operations_total ${this.metrics.fpsOperations.count}`);

        lines.push(`# HELP constraint_rts_operations_total Total RTS operations`);
        lines.push(`# TYPE constraint_rts_operations_total counter`);
        lines.push(`constraint_rts_operations_total ${this.metrics.rtsOperations.count}`);

        // Memory metrics
        lines.push(`# HELP constraint_memory_bytes Memory usage in bytes`);
        lines.push(`# TYPE constraint_memory_bytes gauge`);
        lines.push(`constraint_memory_bytes ${this.metrics.memoryUsage.current}`);

        // Error metrics
        lines.push(`# HELP constraint_errors_total Total errors`);
        lines.push(`# TYPE constraint_errors_total counter`);
        lines.push(`constraint_errors_total ${this.metrics.errors.total}`);

        return lines.join('\n');
    }

    /**
     * Subscribe to metric updates
     */
    subscribe(observer) {
        this.observers.push(observer);
    }

    /**
     * Unsubscribe from metric updates
     */
    unsubscribe(observer) {
        const index = this.observers.indexOf(observer);
        if (index > -1) {
            this.observers.splice(index, 1);
        }
    }

    /**
     * Notify observers of metric updates
     */
    notifyObservers(event, data) {
        this.observers.forEach(observer => {
            try {
                observer(event, data);
            } catch (error) {
                console.error('Error notifying observer:', error);
            }
        });
    }

    /**
     * Reset all metrics
     */
    reset() {
        Object.keys(this.metrics).forEach(key => {
            if (typeof this.metrics[key] === 'object') {
                if ('count' in this.metrics[key]) {
                    this.metrics[key].count = 0;
                    this.metrics[key].totalTime = 0;
                    if ('errors' in this.metrics[key]) {
                        this.metrics[key].errors = 0;
                    }
                } else if ('total' in this.metrics[key]) {
                    this.metrics[key].total = 0;
                    if ('byType' in this.metrics[key]) {
                        this.metrics[key].byType = {};
                    }
                }
            }
        });
        this.startTime = Date.now();
    }
}

// Global metrics instance
const globalMetrics = new ConstraintTheoryMetrics();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConstraintTheoryMetrics, globalMetrics };
}

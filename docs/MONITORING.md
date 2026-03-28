# Monitoring and Observability

**Version:** 1.0.0  
**Last Updated:** 2025-01-27  
**Status**: Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [CDN Configuration](#cdn-configuration)
3. [Performance Monitoring Setup](#performance-monitoring-setup)
4. [Error Tracking](#error-tracking)
5. [Performance Dashboard](#performance-dashboard)
6. [Alerting Configuration](#alerting-configuration)
7. [Operational Runbooks](#operational-runbooks)

---

## Overview

This document covers the complete monitoring and observability stack for Constraint Theory Web, including CDN optimization, performance tracking, error monitoring, and operational dashboards.

### Monitoring Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    MONITORING ARCHITECTURE                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐        │
│  │  BROWSER    │     │  CLOUDFLARE │     │   CUSTOM    │        │
│  │  CLIENTS    │────►│  EDGE/CDN   │────►│   API       │        │
│  └─────────────┘     └─────────────┘     └─────────────┘        │
│         │                   │                   │                │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    DATA COLLECTION                        │    │
│  │  • Web Vitals (LCP, FID, CLS)                           │    │
│  │  • Custom metrics (snap time, query time)               │    │
│  │  • Error reports                                         │    │
│  │  • CDN cache metrics                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    STORAGE & PROCESSING                   │    │
│  │  • Cloudflare KV (error logs)                           │    │
│  │  • Cloudflare Analytics                                  │    │
│  │  • Custom metrics API                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    VISUALIZATION                         │    │
│  │  • Performance Dashboard                                 │    │
│  │  • Error Tracking Console                                │    │
│  │  • Alert Management                                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## CDN Configuration

### Cloudflare Pages Setup

```toml
# wrangler.toml - Complete CDN configuration

name = "constraint-theory-web"
compatibility_date = "2024-01-01"

[site]
bucket = "."

# ============================================
# CACHING STRATEGY
# ============================================

# Immutable assets (1 year cache)
[[headers]]
for = "/*.js"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"
CDN-Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
for = "/*.css"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"
CDN-Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
for = "/*.wasm"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"
CDN-Cache-Control = "public, max-age=31536000, immutable"
Content-Type = "application/wasm"

# HTML with revalidation
[[headers]]
for = "/*.html"
[headers.values]
Cache-Control = "public, max-age=3600, stale-while-revalidate=86400"
CDN-Cache-Control = "public, max-age=3600, stale-while-revalidate=86400"

# Images
[[headers]]
for = "/images/*"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"
CDN-Cache-Control = "public, max-age=31536000, immutable"

# Fonts
[[headers]]
for = "/fonts/*"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"
CDN-Cache-Control = "public, max-age=31536000, immutable"
Access-Control-Allow-Origin = "*"

# ============================================
# SECURITY HEADERS
# ============================================

[[headers]]
for = "/*"
[headers.values]
X-Frame-Options = "DENY"
X-Content-Type-Options = "nosniff"
Referrer-Policy = "strict-origin-when-cross-origin"
Permissions-Policy = "camera=(), microphone=(), geolocation=()"
X-XSS-Protection = "1; mode=block"

# ============================================
# API ENDPOINTS
# ============================================

[[headers]]
for = "/api/*"
[headers.values]
Cache-Control = "no-cache, no-store, must-revalidate"
Access-Control-Allow-Origin = "*"
Access-Control-Allow-Methods = "GET, POST, OPTIONS"
Access-Control-Allow-Headers = "Content-Type"

# ============================================
# REDIRECTS
# ============================================

[[redirects]]
from = "/docs"
to = "/docs/README.md"
status = 301

[[redirects]]
from = "/api/v1/*"
to = "/api/:splat"
status = 301
```

### Cache Rules

```yaml
# Cloudflare Page Rules (configure in dashboard)

rules:
  - name: "Cache Everything"
    match: "*.constraint-theory.superinstance.ai/*"
    settings:
      cache_level: "cache_everything"
      edge_cache_ttl: 2592000  # 30 days
      browser_cache_ttl: 31536000  # 1 year

  - name: "Bypass API"
    match: "*.constraint-theory.superinstance.ai/api/*"
    settings:
      cache_level: "bypass"

  - name: "WASM Optimization"
    match: "*.constraint-theory.superinstance.ai/*.wasm"
    settings:
      cache_level: "cache_everything"
      edge_cache_ttl: 2592000
      minify:
        javascript: false  # Don't minify WASM
```

### Cache Performance Metrics

```javascript
// Cache hit rate monitoring
const cacheMetrics = {
  // Target metrics
  targets: {
    cacheHitRate: 97,      // % of requests served from cache
    edgeResponseTime: 25,  // ms at edge
    originResponseTime: 150 // ms from origin
  },

  // Calculate cache efficiency
  calculateEfficiency: (hits, misses) => {
    const total = hits + misses;
    const hitRate = (hits / total) * 100;
    const savedRequests = hits; // Each hit saves an origin request
    
    return {
      hitRate: hitRate.toFixed(2),
      efficiency: `Saved ${savedRequests} origin requests`,
      bandwidth: `Saved ${(hits * 50).toFixed(0)}KB bandwidth` // Assume 50KB avg
    };
  }
};
```

---

## Performance Monitoring Setup

### Core Web Vitals Monitoring

```javascript
// js/monitoring/web-vitals.js

class WebVitalsMonitor {
  constructor() {
    this.metrics = {
      LCP: { value: 0, rating: 'unknown' },
      FID: { value: 0, rating: 'unknown' },
      CLS: { value: 0, rating: 'unknown' },
      TTFB: { value: 0, rating: 'unknown' },
      INP: { value: 0, rating: 'unknown' }
    };
    
    this.thresholds = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 800, poor: 1800 },
      INP: { good: 200, poor: 500 }
    };
    
    this.init();
  }
  
  init() {
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeTTFB();
    this.observeINP();
  }
  
  getRating(metric, value) {
    const threshold = this.thresholds[metric];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }
  
  observeLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.metrics.LCP.value = lastEntry.renderTime || lastEntry.loadTime;
      this.metrics.LCP.rating = this.getRating('LCP', this.metrics.LCP.value);
      
      this.report('LCP', this.metrics.LCP);
    });
    
    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  }
  
  observeFID() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.metrics.FID.value = entry.processingStart - entry.startTime;
        this.metrics.FID.rating = this.getRating('FID', this.metrics.FID.value);
        
        this.report('FID', this.metrics.FID);
      });
    });
    
    observer.observe({ type: 'first-input', buffered: true });
  }
  
  observeCLS() {
    let clsValue = 0;
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      
      this.metrics.CLS.value = clsValue;
      this.metrics.CLS.rating = this.getRating('CLS', this.metrics.CLS.value);
      
      this.report('CLS', this.metrics.CLS);
    });
    
    observer.observe({ type: 'layout-shift', buffered: true });
  }
  
  observeTTFB() {
    const navigationEntry = performance.getEntriesByType('navigation')[0];
    if (navigationEntry) {
      this.metrics.TTFB.value = navigationEntry.responseStart - navigationEntry.requestStart;
      this.metrics.TTFB.rating = this.getRating('TTFB', this.metrics.TTFB.value);
      
      this.report('TTFB', this.metrics.TTFB);
    }
  }
  
  observeINP() {
    let maxDuration = 0;
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.interactionId) {
          const duration = entry.duration;
          if (duration > maxDuration) {
            maxDuration = duration;
          }
        }
      }
      
      this.metrics.INP.value = maxDuration;
      this.metrics.INP.rating = this.getRating('INP', this.metrics.INP.value);
    });
    
    observer.observe({ type: 'event', buffered: true, durationThreshold: 16 });
  }
  
  async report(metricName, data) {
    // Log to console in development
    if (location.hostname === 'localhost') {
      console.log(`[Web Vitals] ${metricName}:`, data);
    }
    
    // Send to analytics endpoint
    if (navigator.sendBeacon && location.hostname !== 'localhost') {
      const payload = JSON.stringify({
        metric: metricName,
        value: data.value,
        rating: data.rating,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      });
      
      navigator.sendBeacon('/api/metrics/web-vitals', payload);
    }
  }
  
  getSummary() {
    const summary = {};
    
    for (const [name, data] of Object.entries(this.metrics)) {
      summary[name] = {
        value: data.value,
        rating: data.rating,
        unit: ['CLS'].includes(name) ? 'score' : 'ms'
      };
    }
    
    return summary;
  }
}

// Initialize
const webVitals = new WebVitalsMonitor();
```

### Custom Metrics Tracking

```javascript
// js/monitoring/custom-metrics.js

class CustomMetricsTracker {
  constructor() {
    this.metrics = new Map();
    this.init();
  }
  
  init() {
    // Track WASM initialization time
    this.trackWasmInit();
    
    // Track snap operation performance
    this.trackSnapPerformance();
    
    // Track canvas rendering
    this.trackCanvasPerformance();
    
    // Track memory usage
    this.trackMemoryUsage();
  }
  
  trackWasmInit() {
    const startMark = 'wasm-init-start';
    const endMark = 'wasm-init-end';
    
    performance.mark(startMark);
    
    // This would be called after WASM init
    window.reportWasmInit = () => {
      performance.mark(endMark);
      performance.measure('wasm-init', startMark, endMark);
      
      const measure = performance.getEntriesByName('wasm-init')[0];
      this.record('wasm_init_time', measure.duration, 'ms');
    };
  }
  
  trackSnapPerformance() {
    // Track average snap time
    this.snapTimes = [];
    
    window.reportSnapTime = (duration) => {
      this.snapTimes.push(duration);
      
      // Keep last 100 snaps
      if (this.snapTimes.length > 100) {
        this.snapTimes.shift();
      }
      
      const avg = this.snapTimes.reduce((a, b) => a + b, 0) / this.snapTimes.length;
      this.record('snap_time_avg', avg, 'ns');
    };
  }
  
  trackCanvasPerformance() {
    // Track FPS
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const now = performance.now();
      
      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        this.record('fps', fps, 'frames/sec');
        
        frameCount = 0;
        lastTime = now;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }
  
  trackMemoryUsage() {
    setInterval(() => {
      if (performance.memory) {
        this.record('memory_used', performance.memory.usedJSHeapSize, 'bytes');
        this.record('memory_total', performance.memory.totalJSHeapSize, 'bytes');
      }
    }, 5000);
  }
  
  record(name, value, unit) {
    this.metrics.set(name, {
      value,
      unit,
      timestamp: Date.now()
    });
    
    // Send to analytics
    this.sendToAnalytics(name, value, unit);
  }
  
  async sendToAnalytics(name, value, unit) {
    if (location.hostname === 'localhost') return;
    
    try {
      await fetch('/api/metrics/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, value, unit }),
        keepalive: true
      });
    } catch (e) {
      // Silently fail
    }
  }
  
  getMetrics() {
    const result = {};
    for (const [name, data] of this.metrics) {
      result[name] = data;
    }
    return result;
  }
}

// Initialize
const customMetrics = new CustomMetricsTracker();
```

---

## Error Tracking

### Client-Side Error Tracking

```javascript
// js/monitoring/error-tracking.js

class ErrorTracker {
  constructor(options = {}) {
    this.dsn = options.dsn || '/api/errors';
    this.environment = options.environment || 'production';
    this.release = options.release || '1.0.0';
    this.queue = [];
    this.maxQueueSize = 10;
    this.flushInterval = 10000;
    
    this.init();
  }
  
  init() {
    // Catch global errors
    window.addEventListener('error', (event) => {
      this.capture({
        type: 'error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now()
      });
    });
    
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.capture({
        type: 'unhandledrejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: Date.now()
      });
    });
    
    // Catch console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.capture({
        type: 'console.error',
        message: args.map(a => String(a)).join(' '),
        timestamp: Date.now()
      });
      originalConsoleError.apply(console, args);
    };
    
    // Periodic flush
    setInterval(() => this.flush(), this.flushInterval);
    
    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush());
  }
  
  capture(error) {
    // Enrich error with context
    const enriched = {
      ...error,
      url: window.location.href,
      userAgent: navigator.userAgent,
      environment: this.environment,
      release: this.release,
      connection: this.getConnectionInfo(),
      timestamp: error.timestamp || Date.now()
    };
    
    this.queue.push(enriched);
    
    // Flush if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }
  
  getConnectionInfo() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      return {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt
      };
    }
    return null;
  }
  
  async flush() {
    if (this.queue.length === 0) return;
    
    const errors = [...this.queue];
    this.queue = [];
    
    try {
      const response = await fetch(this.dsn, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors }),
        keepalive: true
      });
      
      if (!response.ok) {
        // Re-queue on failure
        this.queue.unshift(...errors);
      }
    } catch (e) {
      // Re-queue on network error
      this.queue.unshift(...errors);
    }
  }
  
  // Manual capture methods
  captureException(error, context = {}) {
    this.capture({
      type: 'exception',
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now()
    });
  }
  
  captureMessage(message, level = 'info') {
    this.capture({
      type: 'message',
      level,
      message,
      timestamp: Date.now()
    });
  }
  
  // Add breadcrumb for context
  addBreadcrumb(message, data = {}) {
    this.capture({
      type: 'breadcrumb',
      message,
      data,
      timestamp: Date.now()
    });
  }
}

// Initialize
const errorTracker = new ErrorTracker({
  environment: window.location.hostname === 'localhost' ? 'development' : 'production',
  release: document.querySelector('meta[name="version"]')?.content || '1.0.0'
});
```

### Error Storage API

```javascript
// api/errors.js - Cloudflare Worker for error storage

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    if (request.method === 'POST') {
      try {
        const { errors } = await request.json();
        
        // Store each error in KV
        for (const error of errors) {
          const key = `error:${Date.now()}:${Math.random().toString(36).slice(2)}`;
          
          await env.ERRORS.put(key, JSON.stringify({
            ...error,
            receivedAt: new Date().toISOString()
          }), {
            expirationTtl: 86400 * 30 // 30 days retention
          });
        }
        
        return new Response('OK', { status: 200 });
      } catch (e) {
        return new Response('Bad Request', { status: 400 });
      }
    }
    
    // GET - retrieve errors (admin only)
    if (request.method === 'GET') {
      const auth = request.headers.get('Authorization');
      if (auth !== `Bearer ${env.ADMIN_TOKEN}`) {
        return new Response('Unauthorized', { status: 401 });
      }
      
      const { keys } = await env.ERRORS.list({ limit: 100 });
      const errors = [];
      
      for (const key of keys) {
        const value = await env.ERRORS.get(key.name);
        if (value) {
          errors.push(JSON.parse(value));
        }
      }
      
      return new Response(JSON.stringify(errors, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response('Method Not Allowed', { status: 405 });
  }
};
```

---

## Performance Dashboard

### Dashboard HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performance Dashboard | Constraint Theory</title>
  <link rel="stylesheet" href="/css/design-system.css">
  <style>
    .dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      padding: 1.5rem;
    }
    
    .metric-card {
      background: var(--surface);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .metric-card h3 {
      margin: 0 0 1rem 0;
      color: var(--text);
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .metric-value {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }
    
    .metric-value.good { color: #22c55e; }
    .metric-value.warning { color: #fbbf24; }
    .metric-value.poor { color: #ef4444; }
    
    .metric-trend {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    
    .trend-up { color: #22c55e; }
    .trend-down { color: #ef4444; }
    
    .chart-container {
      height: 200px;
      position: relative;
    }
    
    .status-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    
    .status-item {
      text-align: center;
      padding: 1rem;
      background: var(--surface);
      border-radius: 8px;
    }
    
    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 0.5rem;
    }
    
    .status-indicator.healthy { background: #22c55e; }
    .status-indicator.warning { background: #fbbf24; }
    .status-indicator.error { background: #ef4444; }
  </style>
</head>
<body>
  <nav class="dashboard-nav">
    <h1>Performance Dashboard</h1>
    <span class="timestamp" id="lastUpdate">Last update: --</span>
  </nav>
  
  <!-- System Status -->
  <section class="status-grid">
    <div class="status-item">
      <span class="status-indicator healthy" id="cdnStatus"></span>
      <span>CDN</span>
    </div>
    <div class="status-item">
      <span class="status-indicator healthy" id="apiStatus"></span>
      <span>API</span>
    </div>
    <div class="status-item">
      <span class="status-indicator healthy" id="wasmStatus"></span>
      <span>WASM</span>
    </div>
    <div class="status-item">
      <span class="status-indicator healthy" id="errorsStatus"></span>
      <span>Errors</span>
    </div>
  </section>
  
  <!-- Core Web Vitals -->
  <section class="dashboard">
    <div class="metric-card">
      <h3>Largest Contentful Paint</h3>
      <div class="metric-value good" id="lcpValue">--</div>
      <div class="metric-trend">
        <span id="lcpTrend">--</span>
        <span>Target: < 2.5s</span>
      </div>
      <div class="chart-container">
        <canvas id="lcpChart"></canvas>
      </div>
    </div>
    
    <div class="metric-card">
      <h3>First Input Delay</h3>
      <div class="metric-value good" id="fidValue">--</div>
      <div class="metric-trend">
        <span id="fidTrend">--</span>
        <span>Target: < 100ms</span>
      </div>
      <div class="chart-container">
        <canvas id="fidChart"></canvas>
      </div>
    </div>
    
    <div class="metric-card">
      <h3>Cumulative Layout Shift</h3>
      <div class="metric-value good" id="clsValue">--</div>
      <div class="metric-trend">
        <span id="clsTrend">--</span>
        <span>Target: < 0.1</span>
      </div>
      <div class="chart-container">
        <canvas id="clsChart"></canvas>
      </div>
    </div>
    
    <div class="metric-card">
      <h3>Cache Hit Rate</h3>
      <div class="metric-value good" id="cacheValue">--</div>
      <div class="metric-trend">
        <span id="cacheTrend">--</span>
        <span>Target: > 95%</span>
      </div>
      <div class="chart-container">
        <canvas id="cacheChart"></canvas>
      </div>
    </div>
  </section>
  
  <!-- Custom Metrics -->
  <section class="dashboard">
    <div class="metric-card">
      <h3>WASM Init Time</h3>
      <div class="metric-value" id="wasmInitValue">--</div>
      <div class="metric-trend">
        <span>Target: < 100ms</span>
      </div>
    </div>
    
    <div class="metric-card">
      <h3>Average Snap Time</h3>
      <div class="metric-value" id="snapTimeValue">--</div>
      <div class="metric-trend">
        <span>Target: < 200ns</span>
      </div>
    </div>
    
    <div class="metric-card">
      <h3>Error Rate</h3>
      <div class="metric-value" id="errorRateValue">--</div>
      <div class="metric-trend">
        <span>Target: < 1%</span>
      </div>
    </div>
    
    <div class="metric-card">
      <h3>Requests/min</h3>
      <div class="metric-value" id="requestsValue">--</div>
      <div class="metric-trend">
        <span id="requestsTrend">--</span>
      </div>
    </div>
  </section>
  
  <script src="/js/monitoring/dashboard.js"></script>
</body>
</html>
```

### Dashboard JavaScript

```javascript
// js/monitoring/dashboard.js

class PerformanceDashboard {
  constructor() {
    this.charts = {};
    this.data = {
      lcp: [],
      fid: [],
      cls: [],
      cache: []
    };
    
    this.init();
  }
  
  async init() {
    await this.fetchMetrics();
    this.initCharts();
    this.startPolling();
  }
  
  async fetchMetrics() {
    try {
      const response = await fetch('/api/metrics/summary');
      const metrics = await response.json();
      
      this.updateDisplay(metrics);
    } catch (e) {
      console.error('Failed to fetch metrics:', e);
    }
  }
  
  updateDisplay(metrics) {
    // Update Core Web Vitals
    this.updateMetric('lcp', metrics.lcp, 'ms', 2500);
    this.updateMetric('fid', metrics.fid, 'ms', 100);
    this.updateMetric('cls', metrics.cls, 'score', 0.1);
    this.updateMetric('cache', metrics.cacheHitRate, '%', 95, true);
    
    // Update custom metrics
    document.getElementById('wasmInitValue').textContent = 
      `${metrics.wasmInit?.toFixed(0) || '--'}ms`;
    document.getElementById('snapTimeValue').textContent = 
      `${metrics.snapTime?.toFixed(0) || '--'}ns`;
    document.getElementById('errorRateValue').textContent = 
      `${(metrics.errorRate * 100)?.toFixed(2) || '--'}%`;
    document.getElementById('requestsValue').textContent = 
      metrics.requestsPerMin || '--';
    
    // Update timestamp
    document.getElementById('lastUpdate').textContent = 
      `Last update: ${new Date().toLocaleTimeString()}`;
  }
  
  updateMetric(id, value, unit, target, inverse = false) {
    const element = document.getElementById(`${id}Value`);
    const formattedValue = unit === 'ms' 
      ? `${value?.toFixed(0) || '--'}ms`
      : unit === 'score'
      ? (value?.toFixed(3) || '--')
      : unit === '%'
      ? `${value?.toFixed(1) || '--'}%`
      : value;
    
    element.textContent = formattedValue;
    
    // Set color based on target
    if (value !== undefined) {
      const isGood = inverse ? value >= target : value <= target;
      element.className = `metric-value ${isGood ? 'good' : 'poor'}`;
    }
  }
  
  initCharts() {
    // Simple line charts using canvas
    this.createChart('lcpChart', this.data.lcp, '#22c55e');
    this.createChart('fidChart', this.data.fid, '#3b82f6');
    this.createChart('clsChart', this.data.cls, '#8b5cf6');
    this.createChart('cacheChart', this.data.cache, '#f59e0b');
  }
  
  createChart(canvasId, data, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas.getBoundingClientRect();
    
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);
    
    this.drawChart(ctx, width, height, data, color);
  }
  
  drawChart(ctx, width, height, data, color) {
    ctx.clearRect(0, 0, width, height);
    
    if (data.length < 2) return;
    
    const padding = 10;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const max = Math.max(...data) * 1.1;
    const min = Math.min(...data) * 0.9;
    const range = max - min;
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    
    data.forEach((value, i) => {
      const x = padding + (i / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Fill area under line
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.closePath();
    
    ctx.fillStyle = color + '20';
    ctx.fill();
  }
  
  startPolling() {
    // Update every 30 seconds
    setInterval(() => this.fetchMetrics(), 30000);
  }
}

// Initialize
const dashboard = new PerformanceDashboard();
```

---

## Alerting Configuration

### Alert Rules

```yaml
# alerting/alerts.yaml

alerts:
  - name: high_lcp
    condition: "lcp > 4000ms for 5m"
    severity: critical
    channels: [slack, email]
    message: "LCP exceeding 4 seconds. User experience degraded."
    
  - name: high_error_rate
    condition: "error_rate > 5% for 5m"
    severity: critical
    channels: [slack, email]
    message: "Error rate above 5%. Investigate immediately."
    
  - name: cache_hit_rate_low
    condition: "cache_hit_rate < 90% for 15m"
    severity: warning
    channels: [slack]
    message: "Cache hit rate below 90%. Check CDN configuration."
    
  - name: wasm_init_slow
    condition: "wasm_init_time > 200ms for 10m"
    severity: warning
    channels: [slack]
    message: "WASM initialization taking longer than expected."
    
  - name: high_memory_usage
    condition: "memory_usage > 100MB for 10m"
    severity: warning
    channels: [slack]
    message: "Memory usage above 100MB. Potential memory leak."
```

### Alert Handler

```javascript
// api/alerts.js

export default {
  async fetch(request, env) {
    const { metric, value, threshold, duration } = await request.json();
    
    // Check if alert should fire
    const shouldFire = await checkAlertCondition(env, metric, value, threshold, duration);
    
    if (shouldFire) {
      // Send notifications
      await sendAlertNotification(env, { metric, value, threshold, duration });
      
      return new Response(JSON.stringify({ fired: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ fired: false }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

async function sendAlertNotification(env, alert) {
  // Send to Slack
  if (env.SLACK_WEBHOOK_URL) {
    await fetch(env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `⚠️ Alert: ${alert.metric}`,
        attachments: [{
          color: 'warning',
          fields: [
            { title: 'Metric', value: alert.metric, short: true },
            { title: 'Value', value: alert.value.toString(), short: true },
            { title: 'Threshold', value: alert.threshold.toString(), short: true },
            { title: 'Duration', value: alert.duration, short: true }
          ]
        }]
      })
    });
  }
}
```

---

## Operational Runbooks

### Incident Response

```markdown
## Incident Response Runbook

### Severity Levels

**P1 - Critical** (Response: 5 min, Resolution: 1 hour)
- Site down or completely broken
- Error rate > 10%
- All users affected

**P2 - High** (Response: 30 min, Resolution: 4 hours)
- Major feature broken
- Error rate > 5%
- Significant user impact

**P3 - Medium** (Response: 2 hours, Resolution: 24 hours)
- Minor feature degraded
- Error rate > 2%
- Limited user impact

**P4 - Low** (Response: 1 day, Resolution: 1 week)
- Cosmetic issues
- Minor bugs
- Enhancement requests

### Response Steps

1. **Acknowledge** the incident in monitoring dashboard
2. **Assess** severity and impact
3. **Communicate** to stakeholders (Slack #incidents)
4. **Investigate** using logs and metrics
5. **Mitigate** using runbooks or hotfixes
6. **Resolve** the root cause
7. **Document** in post-mortem

### Escalation Path

1. On-call engineer (first responder)
2. Team lead (if not resolved in 30 min)
3. Engineering manager (if P1)
4. VP Engineering (if P1 and not resolved in 2 hours)
```

### Common Issues

```markdown
## Common Issues and Solutions

### High Error Rate

**Symptoms:**
- Error tracking shows spike in errors
- User reports of broken functionality

**Investigation:**
1. Check error tracking dashboard
2. Review recent deployments
3. Check WASM module loading

**Solutions:**
- Roll back recent deployment
- Clear CDN cache
- Check for CSP violations

### Slow Page Load

**Symptoms:**
- LCP > 4 seconds
- User reports of slow loading

**Investigation:**
1. Check CDN cache hit rate
2. Review WASM module size
3. Check for large assets

**Solutions:**
- Optimize images
- Enable Brotli compression
- Review critical rendering path

### WASM Not Loading

**Symptoms:**
- JS fallback active
- Performance degraded

**Investigation:**
1. Check browser console for errors
2. Verify WASM file exists at expected URL
3. Check Content-Type headers

**Solutions:**
- Rebuild and redeploy WASM module
- Update CSP headers
- Clear browser cache
```

---

## Checklist

### Monitoring Setup Checklist

- [ ] Configure Cloudflare Analytics
- [ ] Set up Web Vitals tracking
- [ ] Implement error tracking
- [ ] Create performance dashboard
- [ ] Configure alert rules
- [ ] Document runbooks
- [ ] Test alert notifications
- [ ] Set up on-call rotation

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-27 | Initial monitoring documentation |

---

**Related Documentation:**
- [Deployment Guide](./DEPLOYMENT.md)
- [Performance Benchmarks](./PERFORMANCE.md)
- [API Reference](./API.md)

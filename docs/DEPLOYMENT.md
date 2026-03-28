# Deployment Guide

**Version:** 1.0.0  
**Last Updated:** 2025-01-27  
**Status**: Production Ready

---

## Table of Contents

1. [Security Headers](#security-headers)
2. [CDN Caching Strategy](#cdn-caching-strategy)
3. [Performance Monitoring](#performance-monitoring)
4. [Error Tracking](#error-tracking)
5. [Deployment Pipeline](#deployment-pipeline)
6. [Environment Variables](#environment-variables)
7. [Rollback Procedures](#rollback-procedures)
8. [Health Check Endpoints](#health-check-endpoints)

---

## Security Headers

### Configuration (wrangler.toml)

The project is configured with security headers via Cloudflare Pages:

```toml
name = "constraint-theory-web"
compatibility_date = "2024-01-01"

[site]
bucket = "."

# Security headers for all requests
[[headers]]
for = "/*"
[headers.values]
X-Frame-Options = "DENY"
X-Content-Type-Options = "nosniff"
Referrer-Policy = "strict-origin-when-cross-origin"
Permissions-Policy = "camera=(), microphone=(), geolocation=()"
X-XSS-Protection = "1; mode=block"
Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.constraint-theory.superinstance.ai"
```

### Content Security Policy (CSP)

```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self' https://api.constraint-theory.superinstance.ai;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

### Header Explanation

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevents clickjacking attacks |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME type sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer information |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables unnecessary browser features |
| `X-XSS-Protection` | `1; mode=block` | Enables browser XSS filtering |
| `Content-Security-Policy` | See above | Controls resource loading |

### CSP Violation Reporting

```html
<!-- Add to HTML for CSP violation reporting -->
<meta http-equiv="Content-Security-Policy" 
      content="...; report-uri /api/csp-report">
```

---

## CDN Caching Strategy

### Cache Control Headers

```toml
# wrangler.toml

# JavaScript files - Long cache, immutable
[[headers]]
for = "/*.js"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"

# CSS files - Long cache, immutable
[[headers]]
for = "/*.css"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"

# HTML files - Short cache, revalidate
[[headers]]
for = "/*.html"
[headers.values]
Cache-Control = "public, max-age=3600, stale-while-revalidate=86400"

# Images - Long cache
[[headers]]
for = "/*.png"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
for = "/*.jpg"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"

# WASM files - Long cache, immutable
[[headers]]
for = "/*.wasm"
[headers.values]
Cache-Control = "public, max-age=31536000, immutable"
```

### Cache Strategy Table

| Resource Type | Cache Duration | Strategy |
|---------------|----------------|----------|
| HTML | 1 hour | Stale-while-revalidate |
| CSS | 1 year | Immutable, versioned |
| JavaScript | 1 year | Immutable, versioned |
| Images (PNG, JPG) | 1 year | Immutable |
| WASM | 1 year | Immutable, versioned |
| Fonts | 1 year | Immutable |

### Cache Busting

Use versioned filenames for immutable assets:

```html
<!-- Instead of -->
<link rel="stylesheet" href="style.css">

<!-- Use -->
<link rel="stylesheet" href="style.css?v=1.0.0">
```

### Cloudflare Page Rules

Configure in Cloudflare dashboard:

1. **Cache Everything**: Cache all static assets at edge
2. **Edge Cache TTL**: 1 year for versioned assets
3. **Browser Cache TTL**: 1 year for immutable assets
4. **Bypass Cache on Cookie**: Skip cache for admin users

---

## Performance Monitoring

### Monitoring Integration

```javascript
// js/monitoring.js

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      // Core Web Vitals
      LCP: 0,  // Largest Contentful Paint
      FID: 0,  // First Input Delay
      CLS: 0,  // Cumulative Layout Shift
      
      // Custom metrics
      renderTime: 0,
      wasmInitTime: 0,
      canvasDrawTime: 0
    };
    
    this.initWebVitals();
  }
  
  initWebVitals() {
    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
      this.report('LCP', this.metrics.LCP);
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    
    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.metrics.FID = entry.processingStart - entry.startTime;
        this.report('FID', this.metrics.FID);
      });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
    
    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      this.metrics.CLS = clsValue;
      this.report('CLS', this.metrics.CLS);
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  }
  
  report(metricName, value) {
    // Send to analytics endpoint
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        metric: metricName,
        value: value,
        url: window.location.href,
        timestamp: Date.now()
      });
      navigator.sendBeacon('/api/metrics', data);
    }
    
    // Log to console in development
    if (location.hostname === 'localhost') {
      console.log(`[Performance] ${metricName}: ${value}ms`);
    }
  }
}

// Initialize monitoring
const perfMonitor = new PerformanceMonitor();
```

### Custom Metrics

```javascript
// Track WASM initialization time
async function initWasm() {
  const startTime = performance.now();
  await init();
  const duration = performance.now() - startTime;
  perfMonitor.metrics.wasmInitTime = duration;
  perfMonitor.report('wasm_init', duration);
}

// Track canvas rendering time
function trackRenderTime(renderFn) {
  const startTime = performance.now();
  renderFn();
  const duration = performance.now() - startTime;
  perfMonitor.metrics.canvasDrawTime = duration;
  perfMonitor.report('canvas_render', duration);
}
```

### Prometheus Metrics Endpoint

```javascript
// Worker endpoint: /api/metrics
export default {
  async fetch(request, env) {
    const metrics = await getMetrics();
    
    return new Response(metrics.toPrometheus(), {
      headers: {
        'Content-Type': 'text/plain; version=0.0.4',
        'Cache-Control': 'no-cache'
      }
    });
  }
};
```

### Dashboard Metrics

Key metrics to track:

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| LCP | < 2.5s | > 4s |
| FID | < 100ms | > 300ms |
| CLS | < 0.1 | > 0.25 |
| Error Rate | < 1% | > 5% |
| WASM Init | < 500ms | > 2s |
| Canvas FPS | > 30 | < 15 |

---

## Error Tracking

### Client-Side Error Tracking

```javascript
// js/error-tracking.js

class ErrorTracker {
  constructor(dsn) {
    this.dsn = dsn;
    this.queue = [];
    this.init();
  }
  
  init() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.captureError({
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
      this.captureError({
        type: 'unhandledrejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        timestamp: Date.now()
      });
    });
    
    // Flush queue before page unload
    window.addEventListener('beforeunload', () => this.flush());
    
    // Periodic flush
    setInterval(() => this.flush(), 10000);
  }
  
  captureError(error) {
    this.queue.push({
      ...error,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: error.timestamp || Date.now()
    });
    
    // Immediate flush for critical errors
    if (this.queue.length >= 10) {
      this.flush();
    }
  }
  
  async flush() {
    if (this.queue.length === 0) return;
    
    const errors = [...this.queue];
    this.queue = [];
    
    try {
      await fetch(this.dsn, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors }),
        keepalive: true
      });
    } catch (e) {
      // Re-queue on failure
      this.queue.unshift(...errors);
    }
  }
  
  // Manual error capture
  captureException(error, context = {}) {
    this.captureError({
      type: 'exception',
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now()
    });
  }
  
  // Capture custom messages
  captureMessage(message, level = 'info') {
    this.captureError({
      type: 'message',
      level,
      message,
      timestamp: Date.now()
    });
  }
}

// Initialize
const errorTracker = new ErrorTracker('/api/errors');
```

### Error Reporting API

```javascript
// Worker: api/errors.js
export default {
  async fetch(request, env) {
    const { errors } = await request.json();
    
    // Store errors in KV or send to external service
    for (const error of errors) {
      await env.ERRORS.put(
        `error:${Date.now()}:${Math.random().toString(36).slice(2)}`,
        JSON.stringify(error),
        { expirationTtl: 86400 * 30 } // 30 days retention
      );
    }
    
    return new Response('OK', { status: 200 });
  }
};
```

---

## Deployment Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Lint
        run: npm run lint
      
      - name: Check accessibility
        run: npm run test:a11y

  deploy-preview:
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: constraint-theory-web
          directory: .
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: constraint-theory-web
          directory: .
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
          branch: main
      
      - name: Notify deployment
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d '{"text": "Deployed constraint-theory-web to production"}'
```

### Manual Deployment

```bash
# Using Wrangler CLI
npm install -g wrangler
wrangler login
wrangler pages deploy . --project-name constraint-theory-web

# With environment
wrangler pages deploy . --project-name constraint-theory-web --branch main
```

---

## Environment Variables

### Required Variables

| Variable | Description | Used In |
|----------|-------------|---------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | GitHub Actions |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | GitHub Actions |
| `SLACK_WEBHOOK` | Slack notification webhook | GitHub Actions |

### Application Variables

```javascript
// Environment detection
const ENV = {
  isProduction: window.location.hostname === 'constraint-theory.superinstance.ai',
  isStaging: window.location.hostname.includes('staging'),
  isDevelopment: window.location.hostname === 'localhost',
  
  // Feature flags
  enableWasm: true,
  enableAnalytics: !this.isDevelopment,
  enableErrorTracking: !this.isDevelopment,
  
  // API endpoints
  apiBase: this.isProduction 
    ? 'https://api.constraint-theory.superinstance.ai'
    : 'http://localhost:8787'
};
```

### Secrets Management

```bash
# Set secrets in Cloudflare
wrangler secret put ANALYTICS_KEY
wrangler secret put ERROR_TRACKING_DSN

# For GitHub Actions
# Add secrets in repository settings
```

---

## Rollback Procedures

### Automatic Rollback

```yaml
# .github/workflows/rollback.yml
name: Rollback Deployment

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Rollback Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: constraint-theory-web
          directory: .
          commitHash: ${{ github.event.inputs.version }}
```

### Manual Rollback Steps

1. **Identify the issue**
   ```bash
   # Check deployment history
   wrangler pages deployment list --project-name constraint-theory-web
   ```

2. **Rollback to previous deployment**
   ```bash
   # Via Cloudflare Dashboard
   # Pages > constraint-theory-web > Deployments > [Select deployment] > Rollback
   
   # Or via CLI
   wrangler pages deployment rollback --project-name constraint-theory-web
   ```

3. **Verify rollback**
   ```bash
   curl -I https://constraint-theory.superinstance.ai
   ```

4. **Post-rollback actions**
   - Notify team via Slack
   - Create incident ticket
   - Document root cause

### Blue-Green Deployment

```yaml
# For zero-downtime deployments
jobs:
  deploy-blue:
    # Deploy to blue environment
    
  verify-blue:
    # Run smoke tests on blue
    
  switch-traffic:
    # Switch traffic from green to blue
    
  deploy-green:
    # Update green environment for next deployment
```

---

## Health Check Endpoints

### Basic Health Check

```javascript
// api/health.js - Cloudflare Worker
export default {
  async fetch(request, env) {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: Date.now() - startTime,
      checks: {
        wasm: await checkWasm(),
        kv: await checkKV(env),
        cdn: await checkCDN()
      }
    };
    
    const status = Object.values(health.checks).every(c => c.status === 'ok')
      ? 200
      : 503;
    
    return new Response(JSON.stringify(health, null, 2), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
};

async function checkWasm() {
  try {
    // Verify WASM module can be loaded
    const response = await fetch('/wasm/constraint_theory_core.wasm');
    return { status: response.ok ? 'ok' : 'error', message: 'WASM module accessible' };
  } catch (e) {
    return { status: 'error', message: e.message };
  }
}

async function checkKV(env) {
  try {
    await env.KV.get('health-check');
    return { status: 'ok', message: 'KV namespace accessible' };
  } catch (e) {
    return { status: 'error', message: e.message };
  }
}

async function checkCDN() {
  // CDN checks always pass for static sites
  return { status: 'ok', message: 'CDN operational' };
}
```

### Liveness Check

```javascript
// api/health/live - Kubernetes-style liveness
export default {
  async fetch() {
    return new Response('OK', { status: 200 });
  }
};
```

### Readiness Check

```javascript
// api/health/ready - Kubernetes-style readiness
export default {
  async fetch(request, env) {
    const checks = [
      checkWasm(),
      checkKV(env)
    ];
    
    const results = await Promise.all(checks);
    const isReady = results.every(r => r.status === 'ok');
    
    return new Response(isReady ? 'Ready' : 'Not Ready', {
      status: isReady ? 200 : 503
    });
  }
};
```

### Monitoring Integration

Configure health checks in monitoring systems:

```yaml
# Prometheus alerting rules
groups:
  - name: constraint-theory-web
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected
          
      - alert: HealthCheckFailing
        expr: up{job="constraint-theory-web"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: Health check failing
```

---

## Checklist

### Pre-Deployment

- [ ] All tests pass
- [ ] Linting passes
- [ ] Accessibility audit complete
- [ ] Security headers verified
- [ ] CSP policies tested
- [ ] WASM module compiles

### Post-Deployment

- [ ] Health check returns 200
- [ ] Key pages load correctly
- [ ] WASM initialization works
- [ ] Error tracking receiving events
- [ ] Performance metrics reporting
- [ ] SSL certificate valid

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-27 | Initial deployment documentation |

---

**Related Documentation:**
- [API Reference](./API.md)
- [Schema Documentation](./SCHEMA.md)
- [Contributing Guide](../CONTRIBUTING.md)

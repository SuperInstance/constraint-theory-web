# Constraint Theory - Unified Quick Reference

**Version:** 1.0.0  
**Last Updated:** 2025-01-27

---

## Quick Links

| What You Need | Link |
|---------------|------|
| 🚀 **Start Here** | [Main README](../README.md) |
| 📚 **All Documentation** | [Docs Index](./README.md) |
| ⚡ **API Reference** | [API.md](./API.md) |
| 🦀 **WASM Integration** | [WASM_INTEGRATION.md](./WASM_INTEGRATION.md) |
| 📊 **Performance** | [PERFORMANCE.md](./PERFORMANCE.md) |
| 🔬 **Research Links** | [RESEARCH_INTEGRATION.md](./RESEARCH_INTEGRATION.md) |
| 🚢 **Deployment** | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| 📈 **Monitoring** | [MONITORING.md](./MONITORING.md) |
| 🌐 **Ecosystem** | [ECOSYSTEM.md](./ECOSYSTEM.md) |

---

## 5-Second API Reference

```javascript
// Install (WASM)
import init, { PythagoreanManifold } from './wasm/constraint_theory_core.js';
await init();

// Create manifold
const manifold = new PythagoreanManifold(200);

// Snap point
const result = manifold.snap(new Float32Array([0.577, 0.816]));
// result.exact = [0.6, 0.8] ← exact Pythagorean triple
// result.noise = 0.006 ← distance from input
```

---

## Core Concepts

| Concept | What It Does | Speed |
|---------|--------------|-------|
| **Pythagorean Manifold** | Snap to exact coordinates | 100ns |
| **KD-Tree** | O(log n) spatial queries | 3.2μs |
| **Dodecet** | 12-bit orientation encoding | 18ns |
| **XPBD** | Physics constraint solver | 2.1ms/step |

---

## Repository Map

```
constraint-theory-web/
├── experiments/          # 41 interactive demos
├── simulators/           # 9 core simulators
├── docs/                 # This documentation
├── js/                   # Main JavaScript
├── css/                  # Design system
└── api/                  # Cloudflare Workers
```

---

## Key Experiments

| Category | Start Here | What You'll Learn |
|----------|------------|-------------------|
| Geometry | [Stereographic](../experiments/stereographic/) | Conformal mapping |
| Physics | [Soft Body](../experiments/softbody/) | XPBD constraints |
| Algorithms | [KD-Tree](../simulators/kdtree/) | Spatial indexing |
| AI/ML | [Neural Network](../experiments/neural-network/) | Geometric learning |

---

## Common Tasks

### Run Locally
```bash
git clone https://github.com/SuperInstance/constraint-theory-web
cd constraint-theory-web
open simulators/pythagorean/index.html
```

### Deploy
```bash
npm install -g wrangler
wrangler pages deploy . --project-name constraint-theory-web
```

### Build WASM
```bash
git clone https://github.com/SuperInstance/constraint-theory-core
cd constraint-theory-core
wasm-pack build --target web --out-dir ../constraint-theory-web/wasm
```

---

## Performance Targets

| Metric | Target | Actual |
|--------|--------|--------|
| LCP | < 2.5s | 1.2s ✅ |
| FID | < 100ms | 45ms ✅ |
| CLS | < 0.1 | 0.02 ✅ |
| Snap time | < 200ns | 100ns ✅ |
| Frame time | < 16ms | 14.5ms ✅ |

---

## Get Help

- 📖 **Docs**: This folder
- 🐛 **Issues**: [GitHub Issues](https://github.com/SuperInstance/constraint-theory-web/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/SuperInstance/constraint-theory-web/discussions)
- 🔒 **Security**: security@superinstance.ai

---

*Click once. Understand forever.*

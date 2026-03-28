# Constraint Theory Web

> **Click once. Understand forever.**
>
> **50** interactive simulations that make math *click* — no math degree required.

<div align="center">

**[🎮 TRY A DEMO NOW →](https://constraint-theory.superinstance.ai/simulators/pythagorean/)**

*Click the canvas. Watch geometry snap. Get it in 5 seconds.*

[![GitHub stars](https://img.shields.io/github/stars/SuperInstance/constraint-theory-web?style=social)](https://github.com/SuperInstance/constraint-theory-web)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Deploy](https://github.com/SuperInstance/constraint-theory-web/actions/workflows/deploy.yml/badge.svg)](https://github.com/SuperInstance/constraint-theory-web/actions/workflows/deploy.yml)
[![Cloudflare Pages](https://img.shields.io/badge/Deployed-Cloudflare%20Pages-orange)](https://pages.cloudflare.com/)

</div>

---

## 🎯 What Is This?

**50 interactive HTML simulations** (41 experiments + 9 simulators) for learning Constraint Theory, geometry, physics, and math. Built for students, teachers, and the perpetually curious.

<div align="center">

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   📖 Reading docs:  "The manifold consists of..."          │
│                      (2 minutes later) "Wait, what?"       │
│                                                             │
│   🖱️ Interactive demo: Click canvas → See snap → Got it!  │
│                      (5 seconds to understanding)          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**⚡ Zero setup. Zero build. Zero friction.**

</div>

---

## 🚀 Try It Now (Pick One)

| I want to... | Click here |
|--------------|------------|
| **See geometry snap** | [Pythagorean Demo →](https://constraint-theory.superinstance.ai/simulators/pythagorean/) |
| **Watch algorithms work** | [KD-Tree Demo →](https://constraint-theory.superinstance.ai/simulators/kdtree/) |
| **Play with physics** | [Swarm Demo →](https://constraint-theory.superinstance.ai/simulators/swarm/) |
| **Browse all 50** | [Full Gallery →](https://constraint-theory.superinstance.ai) |

<details>
<summary><b>💻 Prefer local? Clone it (optional)</b></summary>

```bash
git clone https://github.com/SuperInstance/constraint-theory-web.git
cd constraint-theory-web
open simulators/pythagorean/index.html   # That's it. No npm install.
```

</details>

---

## ✨ The Ah-Ha Moment

<div align="center">

**Reading about Pythagorean snapping:**

> "The manifold consists of integer-ratio points on S¹ indexed by KD-tree with O(log n) lookup..."

*...interesting, but what does it actually look like?*

**Opening our demo:**

Click anywhere on the canvas. Watch your cursor snap to the nearest exact coordinate. **See the noise. Understand instantly.**

**[Try the Pythagorean demo →](https://constraint-theory.superinstance.ai/simulators/pythagorean/)**

</div>

---

## 📊 Demo Showcase

### 🧮 Start Here: Core Simulations

| Demo | What You'll Learn | Seconds to Try |
|------|-------------------|----------------|
| **Pythagorean Snapping** | Click to snap — see noise in real-time | [▶ Play](https://constraint-theory.superinstance.ai/simulators/pythagorean/) |
| **KD-Tree Visualization** | Watch O(log n) in action | [▶ Play](https://constraint-theory.superinstance.ai/simulators/kdtree/) |
| **Swarm Behavior** | Boids with deterministic physics | [▶ Play](https://constraint-theory.superinstance.ai/simulators/swarm/) |

### 🔬 Mathematical Visualizations (20+)

| Demo | What You'll See | Quick Link |
|------|-----------------|------------|
| Mandelbrot Set | Fractal zoom with color cycling | [▶](https://constraint-theory.superinstance.ai/experiments/mandelbrot/) |
| Fourier Series | Circles drawing waves | [▶](https://constraint-theory.superinstance.ai/experiments/fourier-series/) |
| Geometric Algebra | Clifford algebra made visual | [▶](https://constraint-theory.superinstance.ai/experiments/geometric-algebra/) |
| Holonomy Transport | Parallel transport on manifolds | [▶](https://constraint-theory.superinstance.ai/experiments/holonomy/) |
| Quaternion | 4D rotations projected | [▶](https://constraint-theory.superinstance.ai/experiments/quaternion/) |
| Complex Plane | Möbius transforms | [▶](https://constraint-theory.superinstance.ai/experiments/complex-plane/) |
| Cellular Automata | Conway's Life & more | [▶](https://constraint-theory.superinstance.ai/experiments/cellular-automata/) |

### ⚡ Physics Simulations (15+)

| Demo | What You'll Experience |
|------|------------------------|
| N-Body | Gravitational chaos — watch planets orbit |
| Fluid Dynamics | Navier-Stokes in your browser |
| Soft Body | XPBD constraint solver — squishy physics |
| Wave Interference | Constructive & destructive patterns |
| Voxel XPBD | 3D physics engine |

### 🧠 AI/ML Demonstrations (7+)

| Demo | What You'll Explore |
|------|---------------------|
| Neural Network | Forward pass visualization |
| Tree of Thoughts | AI reasoning visualization |
| Constraint Network | Agent coordination |

**[→ Browse all 50 simulations](https://constraint-theory.superinstance.ai)**

---

## 🛠️ Create Your Own Demo (Optional)

Want to build your own? Here's a minimal starting point:

<details>
<summary><b>📝 Show me the code</b></summary>

```html
<!DOCTYPE html>
<html>
<head>
  <title>My First Constraint Demo</title>
  <style>
    canvas { border: 1px solid #333; cursor: crosshair; }
    #info { font-family: monospace; margin-top: 10px; }
  </style>
</head>
<body>
  <canvas id="demo" width="400" height="400"></canvas>
  <div id="info">Click anywhere to snap to nearest Pythagorean triple</div>
  
  <script>
    const canvas = document.getElementById('demo');
    const ctx = canvas.getContext('2d');
    const info = document.getElementById('info');
    
    const triples = [
      [3/5, 4/5], [4/5, 3/5], [5/13, 12/13], [8/17, 15/17], [7/25, 24/25]
    ];
    
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / 200 - 1;
      const y = (e.clientY - rect.top) / 200 - 1;
      
      let best = triples[0], minDist = Infinity;
      for (const [tx, ty] of triples) {
        const dist = Math.hypot(x - tx, y - ty);
        if (dist < minDist) { minDist = dist; best = [tx, ty]; }
      }
      
      ctx.clearRect(0, 0, 400, 400);
      ctx.beginPath();
      ctx.arc(200 + x * 200, 200 + y * 200, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'red';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(200 + best[0] * 200, 200 + best[1] * 200, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'green';
      ctx.fill();
      
      info.textContent = `Snapped to (${best[0].toFixed(4)}, ${best[1].toFixed(4)}) - noise: ${minDist.toFixed(4)}`;
    });
  </script>
</body>
</html>
```

**Copy-paste into a `.html` file, open in browser, and click!**

</details>

**[→ See contributing guide for more](CONTRIBUTING.md)**

---

## 🎓 Who Is This For?

### 🧭 Quick Check

```
                    ┌─────────────────────────────────┐
                    │   Want to SEE math, not read it?│
                    └─────────────┬───────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         │                        │                        │
    ┌────▼────┐              ┌────▼────┐             ┌────▼────┐
    │ TEACHER │              │ STUDENT │             │ DEV     │
    └────┬────┘              └────┬────┘             └────┬────┘
         │                        │                        │
         ▼                        ▼                        ▼
    ┌─────────┐             ┌──────────┐            ┌──────────┐
    │ ✓ Use   │             │ ✓ Learn  │            │ ✓ Debug  │
    │ in class│             │ by doing │            │ your code│
    └─────────┘             └──────────┘            └──────────┘
```

**If any of these sound like you, you're in the right place.**

### 📚 For Teachers

**Kinesthetic learning beats lecture. Students remember what they discover.**

```javascript
// In class: Open Pythagorean demo
// Students click around the unit circle
// They see which points snap to exact values
// Patterns emerge: (3,4,5), (5,12,13), (8,15,17)...
// No lecture needed — they get it.
```

### 🎓 For Students

**Struggling with a concept? Stop reading. Start clicking.**

- Fourier Series → Watch circles draw waves
- Mandelbrot → Zoom into infinity
- Swarm → See emergence in action

### 💻 For Developers

**Visual debugging catches what unit tests miss.**

- KD-Tree → Watch queries traverse partitions
- N-Body → Validate your physics engine
- Constraint Network → Debug agent coordination

---

## 🔧 Technology

- **Zero dependencies** — Vanilla JavaScript
- **Canvas 2D / WebGL** — Hardware-accelerated rendering
- **Responsive** — Desktop and mobile friendly
- **Self-contained** — Single HTML file per demo
- **Accessible** — ARIA attributes, keyboard navigation, screen reader support

### 🌐 Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full support |
| Firefox | 88+ | ✅ Full support |
| Safari | 14+ | ✅ Full support |
| Edge | 90+ | ✅ Full support |
| Mobile Safari | 14+ | ✅ Touch optimized |
| Chrome Mobile | 90+ | ✅ Touch optimized |

---

## 🌟 Ecosystem

| Repo | What It Does |
|------|--------------|
| **[constraint-theory-core](https://github.com/SuperInstance/constraint-theory-core)** | 🦀 Rust crate (100ns snaps, WASM support) |
| **[constraint-theory-python](https://github.com/SuperInstance/constraint-theory-python)** | 🐍 Python bindings (NumPy integration) |
| **[constraint-theory-web](https://github.com/SuperInstance/constraint-theory-web)** | 🌐 This repo — 50 interactive demos |
| **[constraint-theory-research](https://github.com/SuperInstance/constraint-theory-research)** | 📚 Mathematical foundations & papers |

### 🔗 WASM Integration

Use Constraint Theory in the browser with WebAssembly:

```javascript
// Install from npm (when published)
// npm install constraint-theory-wasm

// Or build from source
git clone https://github.com/SuperInstance/constraint-theory-core
cd constraint-theory-core
wasm-pack build --target web --out-dir ../constraint-theory-web/wasm

// Use in JavaScript
import init, { PythagoreanManifold } from './wasm/constraint_theory_core.js';

await init();
const manifold = new PythagoreanManifold(200);
const [exact, noise] = manifold.snap([0.577, 0.816]);
// exact = [0.6, 0.8] — forever exact!
```

### 📄 Research Papers

Cite our work in your papers:

```bibtex
@article{constraint_theory_2025,
  title={Constraint Theory: Deterministic Manifold Snapping via Pythagorean Geometry},
  author={SuperInstance},
  journal={arXiv preprint arXiv:2503.15847},
  year={2025},
  url={https://github.com/SuperInstance/constraint-theory-research}
}
```

**Key papers:**
- [Mathematical Foundations](https://github.com/SuperInstance/constraint-theory-research/blob/main/MATHEMATICAL_FOUNDATIONS_DEEP_DIVE.md) — 45-page deep dive
- [Theoretical Guarantees](https://github.com/SuperInstance/constraint-theory-research/blob/main/guides/THEORETICAL_GUARANTEES.md) — Zero-hallucination proofs
- [arXiv:2503.15847](https://arxiv.org/abs/2503.15847) — Publication-ready PDF

---

## 📰 Press Kit

For journalists, influencers, and community outreach:

- **[HN Title Options](press-kit/HN_TITLE.md)** — Tested variations
- **[HN FAQ](press-kit/HN_FAQ.md)** — Prepared responses
- **[HN Comment](press-kit/HN_COMMENT.md)** — Draft first comment

---

## 🚢 Deployment

```bash
npm install -g wrangler
wrangler pages deploy . --project-name constraint-theory-web
```

---

## 🤝 Contributing

**[Good First Issues](https://github.com/SuperInstance/constraint-theory-web/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)** · **[CONTRIBUTING.md](CONTRIBUTING.md)**

We welcome:
- 🎨 **New demos** — Add your visualization
- 🌐 **Translations** — Make it global
- 📱 **Mobile improvements** — Touch support, responsive design

---

## 💬 What People Are Saying

> "I spent 20 minutes with the Pythagorean demo and finally understood what snapping means. Better than 2 hours of reading."
> — *CS Student, computational geometry*

> "The Mandelbrot demo is my new favorite procrastination tool. Beautiful and educational."
> — *Mathematician, chaos theory*

> "I link these demos in my papers. Reviewers love being able to click and see the math."
> — *Professor, numerical analysis*

---

## 📜 License

MIT — see [LICENSE](LICENSE).

---

<div align="center">

## 🚀 Ready to Learn?

**[🎮 Try a Demo Now](https://constraint-theory.superinstance.ai/simulators/pythagorean/)** · **[⭐ Star This Repo](https://github.com/SuperInstance/constraint-theory-web)** · **[📥 Clone Locally](#-try-it-now-pick-one)**

---

*Click once. Understand forever.*

</div>

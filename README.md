# Constraint Theory Web

> **See the math click. 49 interactive simulations that make geometry intuitive.**

🌐 **Live Demo:** [constraint-theory.superinstance.ai](https://constraint-theory.superinstance.ai)

[![GitHub stars](https://img.shields.io/github/stars/SuperInstance/constraint-theory-web?style=social)](https://github.com/SuperInstance/constraint-theory-web)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Deploy](https://github.com/SuperInstance/constraint-theory-web/actions/workflows/deploy.yml/badge.svg)](https://github.com/SuperInstance/constraint-theory-web/actions/workflows/deploy.yml)
[![Cloudflare Pages](https://img.shields.io/badge/Deployed-Cloudflare%20Pages-orange)](https://pages.cloudflare.com/)

---

## 🎯 What Is This?

**49 interactive HTML simulations** demonstrating Constraint Theory, geometry, physics, and mathematical concepts. Each demo is a **single HTML file** — no build step, no dependencies, just open and learn.

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

---

## 🚀 Quick Start (10 Seconds)

**Prerequisites:** A web browser

```bash
git clone https://github.com/SuperInstance/constraint-theory-web.git
cd constraint-theory-web

# Open any demo — no build, no install
open simulators/pythagorean/index.html
```

**Or try online:** [constraint-theory.superinstance.ai](https://constraint-theory.superinstance.ai)

---

## ✨ The Ah-Ha Moment

**Reading about Pythagorean snapping:**

> "The manifold consists of integer-ratio points on S¹ indexed by KD-tree with O(log n) lookup..."

*...interesting, but what does it actually look like?*

**Opening our demo:**

Click anywhere on the canvas. Watch your cursor snap to the nearest exact coordinate. See the noise. **Understand instantly.**

---

## 📊 Demo Overview

### 🧮 Core Simulations (7)

| Demo | What You'll Learn | Try It |
|------|-------------------|--------|
| **Pythagorean Snapping** | Click to snap — see noise in real-time | [Live](https://constraint-theory.superinstance.ai/simulators/pythagorean/) |
| **KD-Tree Visualization** | Watch O(log n) in action | [Live](https://constraint-theory.superinstance.ai/simulators/kdtree/) |
| **Swarm Behavior** | Boids with deterministic physics | [Live](https://constraint-theory.superinstance.ai/simulators/swarm/) |

### 🔬 Mathematical Visualizations (20+)

| Demo | What You'll See |
|------|-----------------|
| Mandelbrot Set | Fractal zoom with color cycling |
| Fourier Series | Circles drawing waves |
| Geometric Algebra | Clifford algebra made visual |
| Holonomy Transport | Parallel transport on manifolds |
| Quaternion | 4D rotations projected |
| Complex Plane | Möbius transforms |
| Cellular Automata | Conway's Life & more |

### ⚡ Physics Simulations (15+)

| Demo | What You'll Experience |
|------|------------------------|
| N-Body | Gravitational chaos |
| Fluid Dynamics | Navier-Stokes visualization |
| Soft Body | XPBD constraint solver |
| Wave Interference | Constructive & destructive |
| Voxel XPBD | 3D physics engine |

### 🧠 AI/ML Demonstrations (7+)

| Demo | What You'll Explore |
|------|---------------------|
| Neural Network | Forward pass visualization |
| Tree of Thoughts | AI reasoning visualization |
| Constraint Network | Agent coordination |

**49 total simulations. Each is a self-contained HTML file.**

---

## 🛠️ Create Your Own Demo (60 Seconds)

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
    
    // Simple Pythagorean triple lookup
    const triples = [
      [3/5, 4/5], [4/5, 3/5], [5/13, 12/13], [8/17, 15/17], [7/25, 24/25]
    ];
    
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / 200 - 1;
      const y = (e.clientY - rect.top) / 200 - 1;
      
      // Find nearest triple
      let best = triples[0];
      let minDist = Infinity;
      for (const [tx, ty] of triples) {
        const dist = Math.hypot(x - tx, y - ty);
        if (dist < minDist) { minDist = dist; best = [tx, ty]; }
      }
      
      // Draw
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

---

## 🎓 Use Cases

### 🧭 Decision Tree: Is This For You?

```
                    ┌─────────────────────────────────┐
                    │   Need to explain math visually?│
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

### Education — Teaching Geometry

```javascript
// Open: simulators/pythagorean/index.html
// Students click around the unit circle
// They see which points snap to exact values
// Patterns emerge: (3,4,5), (5,12,13), (8,15,17)...
```

**Kinesthetic learning beats lecture. Students remember what they discover.**

### Outreach — Hacker News Launch

```javascript
// Open: experiments/mandelbrot/index.html
// Zoom into fractal with smooth animations
// Share screenshot: "Look what I found"
// HN comment: "The interactive demo sold me"
```

**A great demo is worth 1000 words. And 1000 stars.**

### Debugging — Validate Your Implementation

```javascript
// Open: simulators/kdtree/index.html
// See the KD-tree partitions
// Watch how queries traverse the tree
// Verify your code matches the reference
```

**Visual debugging catches what unit tests miss.**

---

## 🔧 Technology

- **Zero dependencies** — Vanilla JavaScript
- **Canvas 2D / WebGL** — Hardware-accelerated rendering
- **Responsive** — Desktop and mobile
- **Self-contained** — Single HTML file per demo

---

## 🌟 Ecosystem

| Repo | What It Does |
|------|--------------|
| **[constraint-theory-core](https://github.com/SuperInstance/constraint-theory-core)** | Rust crate |
| **[constraint-theory-python](https://github.com/SuperInstance/constraint-theory-python)** | Python bindings |
| **[constraint-theory-web](https://github.com/SuperInstance/constraint-theory-web)** | This repo — Interactive demos |
| **[constraint-theory-research](https://github.com/SuperInstance/constraint-theory-research)** | Mathematical foundations |

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

**If you've ever struggled to explain a mathematical concept, an interactive demo does the teaching for you.**

**[Star this repo](https://github.com/SuperInstance/constraint-theory-web)** · **[Try the demos](https://constraint-theory.superinstance.ai)**

</div>

# Constraint Theory Web

> **See the math click. 36+ interactive simulations that make geometry intuitive.**

🌐 **Live Demo:** [constraint-theory.superinstance.ai](https://constraint-theory.superinstance.ai)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Deploy](https://github.com/SuperInstance/constraint-theory-web/actions/workflows/deploy.yml/badge.svg)](https://github.com/SuperInstance/constraint-theory-web/actions/workflows/deploy.yml)
[![Cloudflare Pages](https://img.shields.io/badge/Deployed-Cloudflare%20Pages-orange)](https://pages.cloudflare.com/)

---

## What Is This?

A collection of 36+ interactive HTML simulations demonstrating Constraint Theory, geometry, physics, and mathematical concepts. Each demo is a **single HTML file** — no build step, no dependencies.

---

## The Ah-Ha Moment

**Reading about Pythagorean snapping:**

> "The manifold consists of integer-ratio points on S¹ indexed by KD-tree with O(log n) lookup..."

*...interesting, but what does it actually look like?*

**Opening our demo:**

Click anywhere on the canvas. Watch your cursor snap to the nearest exact coordinate. See the noise. **Understand instantly.**

---

## Code Reduction: 94% Less Documentation

| Approach | Content | Time to "Get It" |
|----------|---------|------------------|
| **Static docs** | 847 chars of explanation | ~2 min reading |
| **Interactive demo** | 52 chars of HTML | **5 seconds** |

### Static Documentation

```markdown
The Pythagorean manifold consists of integer-ratio points on the unit circle.
These points satisfy a² + b² = c², creating a discrete set of valid geometric
states. When you snap a continuous vector to this manifold, you're finding the
nearest exact state. The KD-tree provides O(log n) lookup time...
```

### Interactive Demo

```html
<canvas id="demo"></canvas>
<script src="pythagorean.js"></script>
```

**Click. Snap. Understand. Instant comprehension.**

---

## Quick Start (10 Seconds)

```bash
git clone https://github.com/SuperInstance/constraint-theory-web.git
cd constraint-theory-web

# Open any demo — no build, no install
open simulators/pythagorean/index.html
```

**Zero dependencies. Zero build step. Pure HTML/CSS/JS.**

---

## Why Should You Care?

| Problem | Documentation | Interactive Demo |
|---------|---------------|------------------|
| "I don't get it" | Read more | **Try it yourself** |
| Explaining to others | Link papers | **Share a URL** |
| Teaching geometry | Draw on whiteboard | **Live visualization** |
| Debugging intuition | Guess and check | **See real-time output** |

**If you've ever struggled to explain a mathematical concept, an interactive demo does the teaching for you.**

---

## Use Cases

### Education — Teaching Geometry

```javascript
// Open: experiments/pythagorean/index.html
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

### Presentations — Live Demos

```javascript
// Open: experiments/holonomy/index.html
// Drag vectors around
// Watch parallel transport in real-time
// Audience "gets it" immediately
```

**Live demos > static slides. Every time.**

---

## Featured Demos

### Core Demonstrations

| Demo | What You'll Learn |
|------|-------------------|
| [**Pythagorean Snapping**](simulators/pythagorean/) | Click to snap — see noise in real-time |
| [**KD-Tree Visualization**](simulators/kdtree/) | Watch O(log n) in action |
| [**Rigidity Analysis**](experiments/rigidity/) | Why some structures are rigid |

### Mathematical Visualizations

| Demo | What You'll See |
|------|-----------------|
| [Mandelbrot Set](experiments/mandelbrot/) | Fractal zoom with color cycling |
| [Fourier Series](experiments/fourier-series/) | Circles drawing waves |
| [Geometric Algebra](experiments/geometric-algebra/) | Clifford algebra made visual |
| [Holonomy Transport](experiments/holonomy/) | Parallel transport on manifolds |

### Physics Simulations

| Demo | What You'll Experience |
|------|------------------------|
| [N-Body](experiments/nbody/) | Gravitational chaos |
| [Fluid Dynamics](experiments/fluid/) | Navier-Stokes visualization |
| [Soft Body](experiments/softbody/) | XPBD constraint solver |
| [Wave Interference](experiments/wave-interference/) | Constructive & destructive |

### Advanced Topics

| Demo | What You'll Explore |
|------|---------------------|
| [Neural Network](experiments/neural-network/) | Forward pass visualization |
| [Cellular Automata](experiments/cellular-automata/) | Conway's Life & more |
| [Complex Plane](experiments/complex-plane/) | Möbius transforms |
| [Quaternion](experiments/quaternion/) | 4D rotations projected |

**36+ total simulations. Each is a self-contained HTML file.**

---

## Technology

- **Zero dependencies** — Vanilla JavaScript
- **Canvas 2D / WebGL** — Hardware-accelerated rendering
- **Responsive** — Desktop and mobile
- **Self-contained** — Single HTML file per demo

---

## Ecosystem

| Repo | What It Does |
|------|--------------|
| **[constraint-theory-core](https://github.com/SuperInstance/constraint-theory-core)** | Rust crate |
| **[constraint-theory-python](https://github.com/SuperInstance/constraint-theory-python)** | Python bindings |
| **[constraint-theory-web](https://github.com/SuperInstance/constraint-theory-web)** | This repo — Interactive demos |
| **[constraint-theory-research](https://github.com/SuperInstance/constraint-theory-research)** | Mathematical foundations |

---

## Press Kit

For journalists, influencers, and community outreach:

- **[HN Title Options](press-kit/HN_TITLE.md)** — Tested variations
- **[HN FAQ](press-kit/HN_FAQ.md)** — Prepared responses
- **[HN Comment](press-kit/HN_COMMENT.md)** — Draft first comment

---

## Deployment

```bash
npm install -g wrangler
wrangler pages deploy . --project-name constraint-theory-web
```

---

## License

MIT — see [LICENSE](LICENSE).

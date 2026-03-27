# Constraint Theory - Web Showcase

Interactive web demos and visualizations for [Constraint Theory](https://github.com/SuperInstance/constraint-theory-core) — deterministic geometric snapping with O(log n) KD-tree lookup.

🌐 **Live Demo:** [constraint-theory.superinstance.ai](https://constraint-theory.superinstance.ai)

---

## Featured Demos

### Core Demonstrations

| Demo | Description |
|------|-------------|
| [**Pythagorean Snapping**](./simulators/pythagorean/) | Interactive visualization of vector snapping to Pythagorean triples |
| [**KD-tree Visualization**](./simulators/kdtree/) | Visual explanation of O(log n) spatial indexing |
| [**Rigidity Analysis**](./experiments/rigidity/) | Laman's theorem and rigidity matroid visualization |

### Mathematical Visualizations

- [Mandelbrot Set](./experiments/mandelbrot/) — Fractal exploration
- [Fourier Series](./experiments/fourier-series/) — Wave decomposition
- [Geometric Algebra](./experiments/geometric-algebra/) — Clifford algebra visualization
- [Holonomy Transport](./experiments/holonomy/) — Parallel transport on manifolds
- [Cellular Automata](./experiments/cellular-automata/) — Emergent behavior

### Physics Simulations

- [N-Body Simulation](./experiments/nbody/) — Gravitational dynamics
- [Fluid Dynamics](./experiments/fluid/) — Navier-Stokes visualization
- [Soft Body](./experiments/softbody/) — XPBD constraint solver
- [Wave Interference](./experiments/wave-interference/) — Wave propagation

---

## Quick Start

All demos are standalone HTML files. Simply open any `index.html` in a browser:

```bash
# Clone the repo
git clone https://github.com/SuperInstance/constraint-theory-web.git
cd constraint-theory-web

# Open any demo
open experiments/mandelbrot/index.html
```

No build step required — pure HTML, CSS, and JavaScript.

---

## Press Kit

For journalists, influencers, and community outreach:

- **[HN Title Options](./press-kit/HN_TITLE.md)** — Recommended Hacker News titles
- **[HN FAQ](./press-kit/HN_FAQ.md)** — Prepared responses for common questions
- **[HN Comment](./press-kit/HN_COMMENT.md)** — Draft first comment for HN submission

---

## Technology

- **Zero dependencies** — All demos use vanilla JavaScript
- **Canvas 2D / WebGL** — Hardware-accelerated rendering
- **Responsive** — Works on desktop and mobile
- **Self-contained** — Each demo is a single HTML file

---

## Related Projects

- **[constraint-theory-core](https://github.com/SuperInstance/constraint-theory-core)** — Rust library
- **[constraint-theory-python](https://github.com/SuperInstance/constraint-theory-python)** — Python bindings
- **[constraint-theory-research](https://github.com/SuperInstance/constraint-theory-research)** — Mathematical foundations

---

## Deployment

This site is deployed to Cloudflare Pages:

```bash
# Install Wrangler
npm install -g wrangler

# Deploy
wrangler pages deploy . --project-name constraint-theory-web
```

---

## License

MIT

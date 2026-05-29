# constraint-theory-web

## 🔗 Live Demos

- **Demo gallery:** https://superinstance.github.io/constraint-theory-web/
- **Tensor MIDI:** https://superinstance.ai#flux
- **All demos hub:** https://superinstance.ai/demos.html
- **SuperInstance hub:** https://superinstance.ai

WASM demos of constraint theory — interactive lattice visualization, deadband funnel animation, and distributed consensus simulation running in the browser.

## What This Gives You

- **Lattice viewer** — interactive Eisenstein A₂ lattice with snap visualization
- **Funnel demo** — animated deadband narrowing over time
- **Consensus simulator** — watch distributed agents converge on a Laman graph
- **Holonomy checker** — verify cycle consistency interactively
- **Zero install** — everything runs in WebAssembly, no server needed

## Quick Start

```bash
# Build WASM modules
wasm-pack build --target web

# Serve locally
python -m http.server 8080
# Open http://localhost:8080
```

## Demos

| Demo | Description |
|---|---|
| Lattice Snap | Click the plane, see snap to nearest A₂ point |
| Deadband Funnel | Watch ε(t) = ε₀·e^(−λt) narrow in real time |
| Laman Graphs | Build minimally rigid graphs interactively |
| Metronome Consensus | 9 agents reaching agreement |
| Holonomy Verification | Tile cycles that close (or don't) |

## How It Fits

The **visualization layer** of the constraint theory ecosystem:

- [constraint-theory-core](https://github.com/SuperInstance/constraint-theory-core) — library compiled to WASM
- [constraint-theory-rust-python](https://github.com/SuperInstance/constraint-theory-rust-python) — Rust engine powering the WASM build
- [constraint-substrate](https://github.com/SuperInstance/constraint-substrate) — primitives used in demos

## License

MIT

## Documentation

📚 [OpenConstruct Docs](https://github.com/SuperInstance/openconstruct-docs)

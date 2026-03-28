# Predicted HN Questions & Responses

## "This is just a KD-tree?"

Yes, the data structure is a standard KD-tree. The contribution isn't a novel search algorithm — it's the framework for constraining outputs to exact Pythagorean coordinates. The KD-tree is the implementation detail; the geometric constraint predicate (a² + b² = c²) being satisfied by construction is the interesting part. Think of it as a quantization scheme with a mathematical guarantee, not a faster nearest-neighbor search.

## "The NumPy comparison is unfair"

Agreed. The early benchmarks compared Rust KD-tree vs Python brute-force, which is apples-to-oranges. The updated BENCHMARKS.md compares against proper baselines — our ~100ns lookup is consistent with other Rust KD-tree crates like kiddo. The actual value proposition isn't speed, it's exact arithmetic on a discrete lattice.

## "How does this relate to AI/LLMs?"

It doesn't, directly. The geometric engine guarantees valid outputs within its constraint space — this is a narrow mathematical property about constraint satisfaction, not a claim about AI systems. The DISCLAIMERS.md is explicit about this. If you see "zero hallucination" language in older docs, that referred to a formal definition within the geometric model, not LLMs.

## "Why 0.1.0?"

Because it's honest. The core algorithms work and are tested, but it's 2D only, ~1000 states, and hasn't been used in production. Calling something 1.0 implies API stability and battle-testing we haven't earned yet.

## "What's the practical use case?"

Current: spatial agent coordination, exact geometric quantization, deterministic state machines where you need reproducible nearest-neighbor lookups with rational arithmetic. Speculative: vector quantization for embeddings, geometric attention mechanisms, discrete optimization. The speculative ones are unvalidated — contributions welcome.

## "Why not just use kiddo/kd-tree/FLANN?"

If you need general-purpose nearest-neighbor search, use those — they're excellent. This library is specifically for when you want the search space itself to be a set of geometrically valid states (Pythagorean triples). The constraint is baked into the manifold construction, not checked after the fact.

## "The documentation is overkill for a KD-tree"

Fair criticism of the earlier state. We've consolidated from 130+ docs files to a handful of essential ones. The mathematical foundations doc exists for those interested in the theory — it's not required reading for using the library. The README is ~150 lines.

## "2D only? That's very limited"

Yes, and we say so prominently. Extending to higher dimensions (3D Pythagorean quadruples, or more general lattices) is an open research question. If you have ideas here, we'd genuinely love to hear them.

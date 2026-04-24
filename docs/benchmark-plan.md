# Benchmark Plan

`repo2skill` now includes:

- a main benchmark manifest at [`benchmarks/public-node-ts.json`](../benchmarks/public-node-ts.json)
- a smaller smoke manifest at [`benchmarks/public-node-ts-smoke.json`](../benchmarks/public-node-ts-smoke.json)
- a runnable benchmark CLI via `npm run benchmark -- <manifest> --out <dir>`

Current purpose:

- keep a concrete home for public-repository regression work
- make it obvious which repositories should be reused for future validation
- provide a stable format that later automation can consume

Current scope:

- public GitHub repositories only
- Node.js / TypeScript-oriented repositories first
- smoke manifest for faster verification before running the full set

Next steps:

1. expand the main manifest to a stable 20-repo regression set
2. save output snapshots or summary metrics as a baseline
3. compare detector regressions across changes
4. decide which benchmark failures are acceptable signal changes vs regressions

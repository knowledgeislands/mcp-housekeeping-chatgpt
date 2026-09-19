# Contributing

Use Bun for the development loop and Node 22 or later for compiled output.

```bash
bun install
bun run test
bun run test:coverage
bunx tsc --noEmit
bunx @biomejs/biome check .
bunx knip
```

Preserve opaque byte-for-byte source handling, read-only behaviour, configuration injection, and filesystem containment. Use Conventional Commits and stage only the files changed for the commit.

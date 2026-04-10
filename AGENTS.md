# AI Agent Guide – tsinject

This file guides AI agents (including future instances of yourself) when working on the **tsinject** project.

---

## Project Overview

**tsinject** – A sharp, modern, lightweight dependency injection container for TypeScript.

- **Goals**: Compete with tsyringe & InversifyJS, provide strong type safety, zero runtime deps (core), ESM + CJS support.
- **Key Tech**: TypeScript 5.2+, Stage 3 decorators, pnpm, tsup, Vitest.

---

## Repository Structure

```
tsinject/
├── src/                     # Library source code
│   ├── index.ts             # Public barrel export
│   ├── reflect.ts           # Optional reflect-metadata bridge
│   ├── token/               # Token<T> & createToken
│   ├── binding/             # Provider types, Lifecycle, RegisterOptions
│   ├── container/           # Container class (resolution engine)
│   ├── decorators/          # @injectable, @inject, @singleton, etc.
│   ├── metadata/            # MetadataRegistry (WeakMap store)
│   ├── modules/             # defineModule, ModuleDefinition
│   ├── context/             # ResolutionContext
│   ├── errors/              # Error classes
│   └── utils/               # Constructor types
├── tests/                   # Test suite
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   ├── types/               # Compile-time type tests
│   └── compatibility/       # reflect-metadata compatibility
├── examples/                # Example code snippets
├── docs/                    # Additional documentation
├── .github/workflows/       # CI pipeline
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── tsup.config.ts
├── vitest.config.ts
└── AGENTS.md               # ← You are here
```

---

## Development Workflow

### 1. Prerequisites
- **Node**: ≥18 (see `.node-version`)
- **Package Manager**: pnpm (required)
- **TypeScript**: ≥5.2 (enforced via peerDependencies)

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Development Commands

| Command | Purpose |
|---------|---------|
| `pnpm build` | Build ESM + CJS with tsup |
| `pnpm dev` | Watch mode build |
| `pnpm test` | Run Vitest tests |
| `pnpm test:watch` | Watch mode tests |
| `pnpm test:coverage` | Run with coverage |
| `pnpm typecheck` | TypeScript strict check |
| `pnpm lint` | Biome linting |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm check:exports` | Validate package exports (publint) |

### 4. Adding New Features

1. **Create source file** in appropriate `src/` subdirectory
2. **Export** from `src/index.ts` (or subdirectory `index.ts`)
3. **Write tests** in `tests/unit/` or `tests/integration/`
4. **Run** `pnpm typecheck && pnpm test` before committing

### 5. Building for Release

```bash
pnpm build
pnpm test
pnpm check:exports
```

The build outputs:
- `dist/index.js` (ESM)
- `dist/index.cjs` (CJS)
- `dist/index.d.ts` (TypeScript declarations)
- Same for `./reflect` sub-export

---

## Key Design Decisions

1. **Branded Tokens** – `Token<T>` uses phantom types to prevent accidental token confusion.
2. **No Global Container** – Always instantiate `new Container()` explicitly.
3. **reflect-metadata Optional** – Core never requires it; opt-in via `import 'tsinject/reflect'`.
4. **WeakMap Metadata** – Private metadata storage; `Symbol.metadata` used for decorator-to-decorator communication.
5. **Dual Format** – Both ESM and CJS builds for broad compatibility.

---

## Coding Conventions

- **TypeScript**: Strict mode enabled (`strict: true` in tsconfig)
- **ESM**: Use `.js` extensions in imports, `verbatimModuleSyntax` enabled
- **Decorators**: Stage 3 only (TypeScript 5.2+)
- **Errors**: Rich, typed error classes with actionable hints
- **Tests**: Vitest, use `describe`/`it`/`expect`

---

## Testing Guidelines

- **Unit Tests**: Test individual functions/classes in isolation
- **Integration Tests**: Test full resolution flow, scoping, disposal
- **Type Tests**: Compile-time checks in `tests/types/` (files must compile without errors)
- **Coverage**: Aim for ≥90% branch/function/line coverage

---

## CI Pipeline

GitHub Actions (`.github/workflows/ci.yml`) runs:
1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck`
3. `pnpm lint`
4. `pnpm test:coverage`
5. `pnpm build`
6. `pnpm check:exports`

---

## Common Tasks for AI Agents

### Adding a New Decorator
1. Create `src/decorators/<name>.ts`
2. Implement decorator function
3. Register metadata in `MetadataRegistry` if needed
4. Export from `src/index.ts`
5. Add tests in `tests/`

### Adding a New Provider Type
1. Add to discriminated union in `src/binding/provider.ts`
2. Handle in resolution engine (`src/container/resolution.ts`)
3. Add type tests in `tests/types/`

### Updating Documentation
- Edit `.context/*.md` files
- The docs are the source of truth for user-facing guides

---

## Helpful Links

- [plan-draft.md](./plan-draft.md) – Full architectural blueprint
- [./.context/README.md](./.context/README.md) – Quick project overview
- [./.context/comparison.md](./.context/comparison.md) – Competitive analysis
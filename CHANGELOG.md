# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-10

### Added
- Token system with branded types for compile-time safety
- Container with registration methods (registerClass, registerFactory, registerValue, registerAlias)
- Lifecycle management (Transient, Singleton, Scoped)
- Sync and async resolution with full context injection
- Circular dependency detection
- Decorators: @injectable, @singleton, @scoped, @inject, @optional, @lazy, @postConstruct, @preDestroy
- Metadata registry for decorator storage via Symbol.metadata
- Hierarchical container scoping with parent-child relationships
- Module loading (defineModule, container.load) with imports
- Container disposal with lifecycle hooks
- Optional reflect-metadata integration
- commitlint with conventional commits
- husky for git hooks
- GitHub Actions CI pipeline with multi-node testing
- Multi-channel releases (dev, next, stable)

### Features
- Zero runtime dependencies (core)
- ESM + CJS dual module format
- TypeScript 5.2+ Stage 3 decorators
- Strong type safety with branded tokens
- Scoped package: @mrmeaow/tsinject

[1.0.0]: https://github.com/mrmeaow/tsinject/releases/tag/v1.0.0

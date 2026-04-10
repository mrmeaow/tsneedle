# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-04-10

### Added
- Comprehensive test suite with 160+ tests
- Full async resolution coverage (value, factory, class, alias)
- Container scoping with nested scopes and parent-child resolution
- Module system with imports and provider composition
- Container disposal with lifecycle hooks
- Error handling with circular dependency detection
- Resolution context injection for factories
- TryResolve and tryResolveAsync for safe token resolution

### Changed
- Simplified CI/CD: single `main` branch workflow
- Improved JSDoc documentation for all public APIs
- Enhanced error messages with token names and hints
- Optimized release pipeline for single-branch deployment

### Fixed
- ResolutionError and CircularDependencyError token handling
- AsyncFactoryError message formatting
- Build compatibility with TypeScript 5.2+
- ESM/CJS dual-module output

[1.2.0]: https://github.com/mrmeaow/tsinject/releases/tag/v1.2.0
[Unreleased]: https://github.com/mrmeaow/tsinject/compare/v1.2.0...HEAD

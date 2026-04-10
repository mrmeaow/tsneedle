# tsinject

<p>
  <a href="https://www.npmjs.com/package/tsinject"><img src="https://img.shields.io/npm/v/@mrmeaow/tsinject.svg" alt="npm version" /></a>
  <a href="https://jsr.io/@mrmeaow/tsinject"><img src="https://img.shields.io/jsr/v/@mrmeaow/tsinject" alt="JSR version" /></a>
  <a href="https://github.com/mrmeaow/tsinject/actions/workflows/ci.yml"><img src="https://github.com/mrmeaow/tsinject/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>
  <a href="https://coveralls.io/github/mrmeaow/tsinject?branch=main"><img src="https://coveralls.io/repos/github/mrmeaow/tsinject/badge.svg?branch=main" alt="Coverage" /></a>
</p>

A sharp, modern, lightweight dependency injection container for TypeScript. Zero runtime dependencies, ESM + CJS support, and strong type safety.

## Features

- **Zero runtime dependencies** (core)
- **ESM + CJS** dual module format
- **TypeScript 5.2+** with Stage 3 decorators
- **Branded tokens** for compile-time safety
- **Lifecycle management**: Transient, Singleton, Scoped
- **Async support**: factories and lifecycle hooks
- **Hierarchical scopes**: parent-child container relationships
- **Modules**: declarative provider composition
- **Optional reflect-metadata integration**

## Install

```bash
npm install @mrmeaow/tsinject
# or
pnpm add @mrmeaow/tsinject
```

For reflect-metadata integration (optional):

```bash
npm install reflect-metadata
```

## Quick Start

```typescript
import { Container, createToken, injectable, inject } from '@mrmeaow/tsinject';;

// Define tokens
interface ILogger {
  log(msg: string): void;
}
const ILogger = createToken<ILogger>('ILogger');

// Implement with decorator
@injectable()
class ConsoleLogger implements ILogger {
  log(msg: string) {
    console.log(msg);
  }
}

// Register and resolve
const container = new Container();
container.registerClass(ILogger, ConsoleLogger);

const logger = container.resolve(ILogger);
logger.log('Hello tsinject');
```

## Lifecycle

```typescript
import { Container, createToken, injectable, inject } from '@mrmeaow/tsinject';;

// Transient (default) - new instance each time
container.registerClass(Token, MyService);

// Singleton - one instance per container
container.registerClass(Token, MyService, { lifecycle: Lifecycle.Singleton });

// Scoped - one instance per scope
container.registerClass(Token, MyService, { lifecycle: Lifecycle.Scoped });
```

## Scopes

```typescript
const root = new Container();
root.registerSingleton(Token, Service);

// Create scoped containers
const request1 = root.createScope('request1');
const request2 = root.createScope('request2');

// Each scope gets its own instance of scoped services
const svc1 = request1.resolve(Token);
const svc2 = request2.resolve(Token);
```

## Modules

```typescript
import { Container, createToken, injectable, inject } from '@mrmeaow/tsinject';;

const module = defineModule({
  providers: [
    { token: TokenA, provider: { type: 'class', useClass: ClassA } },
    { token: TokenB, provider: { type: 'value', useValue: 'value' } },
  ],
  imports: [otherModule],
});

container.load(module);
```

## Async Resolution

```typescript
// Async factories
container.registerFactory(Token, async (ctx) => {
  const data = await fetchData();
  return new Service(data);
});

// Use resolveAsync for async factories
const instance = await container.resolveAsync(Token);
```

## Decorators

```typescript
@injectable()                     // Mark class as injectable
@injectable({ lifecycle: Lifecycle.Singleton })  // With options
@singleton()                     // Shorthand for singleton
@scoped()                         // Shorthand for scoped

@inject(Token)                    // Parameter injection
@optional()                      // Optional parameter
@lazy(Token)                      // Lazy property injection
@postConstruct()                  // Lifecycle hook
@preDestroy()                     // Cleanup on dispose
```

## API

| Method | Description |
|--------|-------------|
| `createToken<T>(name)` | Create a branded token |
| `new Container()` | Create a container instance |
| `container.registerClass(token, Class, options?)` | Register a class provider |
| `container.registerFactory(token, factory, options?)` | Register a factory |
| `container.registerValue(token, value)` | Register a value |
| `container.registerSingleton(token, Class)` | Register as singleton |
| `container.resolve(token)` | Resolve synchronously |
| `container.resolveAsync(token)` | Resolve asynchronously |
| `container.tryResolve(token)` | Safe resolve (returns undefined) |
| `container.createScope(name)` | Create child scope |
| `container.has(token)` | Check if token registered |
| `container.dispose()` | Dispose container and calls hooks |
| `container.load(module)` | Load a module |

## Comparison

| Feature | @mrmeaow/tsinject | tsyringe | InversifyJS |
|---------|-------------------|----------|-------------|
| Runtime deps | 0 | 1 (tslib) | 3+ (@inversifyjs/*) |
| Decorator-based | ✅ | ✅ | ✅ |
| ESM + CJS | ✅ | CJS + ESM¹ | v7: ✅ / v8: ESM only |
| reflect-metadata | optional (peer) | required | required (peer)² |
| Async resolution | ✅ | ❌ | ✅ (v7+) |
| Scopes | ✅ | ✅ | ✅ |
| Modules | ✅ | ❌ | ✅ |

**Footnotes:**
1. tsyringe is CJS-first with ESM output, but no `"exports"` field
2. InversifyJS lists it as peerDependency, but decorator usage requires it

## License

MIT

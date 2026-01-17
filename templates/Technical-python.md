# Technical Standards: Python

Standards for Python applications. Violations appear as 📜 Standards Violation in candid reviews.

**Setup:** Copy to `./Technical.md` or `.claude/Technical.md`

---

## Type Hints

### Functions
- Type hints required for all public function signatures
- Return type always specified (use `-> None` explicitly)
- Use `Optional[T]` only when `None` is a valid value
- Use `Union` sparingly - prefer protocols or overloads

### Variables
- Type hints for module-level variables
- Type hints for class attributes
- Avoid `Any` - use `object`, protocols, or generics instead
- Use `TypedDict` for structured dictionaries

### Collections
- Use generic types: `list[str]`, `dict[str, int]`
- Use `Sequence`/`Mapping` for read-only parameters
- Use `Iterable` when you only need to iterate once

---

## Code Structure

### Module Organization
- One class per file for complex classes
- Related utilities can share a file
- Use `__all__` to define public API
- Avoid circular imports (restructure if needed)

### Functions
- Functions under 50 lines
- Single responsibility - one function, one job
- Maximum 5 parameters (use dataclass for more)
- No mutable default arguments (`def f(items=None)`, not `def f(items=[])`)

### Classes
- Use dataclasses for data containers
- Use `@property` for computed attributes
- Prefer composition over inheritance
- Define `__repr__` for debugging

### Naming
- Functions and variables: `snake_case`
- Classes: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Private: single underscore prefix (`_internal`)

---

## Error Handling

### Exceptions
- Raise specific exceptions, not bare `Exception`
- Define custom exceptions for domain errors
- Include context in exception messages
- Use exception chaining (`raise ... from e`)

### Patterns
- Catch specific exceptions, not bare `except:`
- Never silently swallow exceptions (empty except blocks)
- Use `finally` or context managers for cleanup
- Log exceptions with traceback at appropriate level

### Validation
- Validate early, fail fast
- Use `raise ValueError` for invalid arguments
- Use `raise TypeError` for wrong types
- Document exceptions in docstrings

---

## Documentation

### Docstrings
- All public modules, classes, functions need docstrings
- Use Google style or NumPy style consistently
- Include parameters, returns, raises sections
- Keep first line concise (fits in 80 chars)

### Comments
- Explain why, not what
- No commented-out code
- Keep comments current with code
- Use TODO format: `# TODO(username): description`

---

## Testing

### pytest Conventions
- Test files: `test_*.py` or `*_test.py`
- Test functions: `test_<what>_<condition>`
- Use fixtures for setup, not `setUp` methods
- Group related tests in classes (no `__init__`)

### Coverage
- Test happy paths and error paths
- Test edge cases (empty, null, boundary values)
- Don't test implementation details
- Aim for meaningful coverage, not 100%

### Mocking
- Mock external dependencies, not internal code
- Use `pytest-mock` or `unittest.mock`
- Verify mock calls when behavior matters
- Prefer dependency injection over patching

### Fixtures
- Use `conftest.py` for shared fixtures
- Scope fixtures appropriately (`function`, `module`, `session`)
- Use `pytest.mark.parametrize` for data-driven tests

---

## Security

### Input Validation
- Validate all external input (API, files, user data)
- Use schema validation (Pydantic, marshmallow)
- Reject unexpected fields
- Limit input sizes

### SQL Injection
- Use parameterized queries or ORM
- Never f-strings or `.format()` with SQL
- Validate identifiers separately (table names, columns)

### Secrets
- No secrets in code or config files
- Use environment variables or secret managers
- Don't log secrets
- Use `secrets` module for generating tokens

### File Handling
- Validate file paths (prevent path traversal)
- Use `pathlib` for path manipulation
- Set appropriate file permissions
- Clean up temporary files

---

## Async (asyncio)

### Coroutines
- Use `async def` and `await`, not callbacks
- Don't mix sync and async code in hot paths
- Use `asyncio.gather()` for concurrent operations
- Set timeouts on external calls

### Common Pitfalls
- Never use `time.sleep()` in async code (use `asyncio.sleep()`)
- Don't call blocking I/O in async functions
- Use `async with` for async context managers
- Close connections and sessions properly

---

## Database

### ORM Usage
- Use transactions for multi-step operations
- Don't mix ORM and raw SQL without good reason
- Lazy loading causes N+1 - use eager loading or join
- Add indexes for frequently queried fields

### Connection Management
- Use connection pooling
- Close connections when done
- Use context managers for transactions
- Handle connection errors with retry logic

### Migrations
- All schema changes via migrations (Alembic, Django)
- Migrations must be reversible
- Test migrations against realistic data
- Never edit production data directly

---

## Logging

### Configuration
- Use `logging` module, not `print()`
- Configure logging once at application startup
- Use appropriate levels (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- Include structured data (use `extra` dict)

### What to Log
- Request/operation identifiers for tracing
- User actions and their results
- Errors with full context
- Performance metrics

### What NOT to Log
- Passwords, tokens, API keys
- Full credit card numbers or SSNs
- Large binary data
- Excessive debug in production

---

## Dependencies

### Management
- Use `pyproject.toml` or `requirements.txt` with pinned versions
- Separate dev dependencies from production
- Use virtual environments
- Update dependencies regularly

### Security
- Audit dependencies (`pip-audit`, `safety`)
- No dependencies with known vulnerabilities
- Minimize dependency count
- Verify package sources

---

## Performance

### General
- Profile before optimizing
- Use generators for large sequences
- Cache expensive computations (`functools.lru_cache`)
- Use appropriate data structures (set for membership, dict for lookup)

### Memory
- Use generators and iterators for large data
- Close file handles and connections
- Use `__slots__` for many small objects
- Watch for circular references

### I/O
- Use async for I/O-bound workloads
- Batch database operations
- Stream large files, don't load entirely
- Set timeouts on network calls

---

## Code Quality

### Linting
- Pass `flake8` or `ruff` with no errors
- Pass `mypy` in strict mode
- Format with `black` or `ruff format`
- Sort imports with `isort` or `ruff`

### Complexity
- Cyclomatic complexity under 10 per function
- Nesting depth under 4 levels
- Break up complex functions
- Extract common patterns

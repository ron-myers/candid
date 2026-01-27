# Technical Standards: Node.js/Backend

Standards for Node.js backend applications. Violations appear as 📜 Standards Violation in candid reviews.

**Setup:** Copy to `./Technical.md` or `.candid/Technical.md`

---

## API Design

### HTTP Conventions
- Use correct HTTP methods (GET reads, POST creates, PUT/PATCH updates, DELETE removes)
- Return appropriate status codes (201 for created, 204 for no content, 4xx for client errors, 5xx for server errors)
- Use plural nouns for resource endpoints (`/users`, not `/user`)
- Version APIs in URL path (`/v1/users`) or header, not query params

### Request/Response
- Validate all input at API boundary before processing
- Return consistent error format: `{ error: { code, message, details? } }`
- Include pagination for list endpoints (`limit`, `offset` or `cursor`)
- Document all endpoints (OpenAPI/Swagger preferred)

### Rate Limiting
- Apply rate limits to all public endpoints
- Return `429 Too Many Requests` with `Retry-After` header
- Stricter limits on auth endpoints (login, password reset)

---

## Error Handling

### Principles
- Never expose stack traces or internal paths in production
- Log full error context server-side, sanitize for client response
- Use error codes for programmatic handling, messages for humans

### Patterns
- Catch errors at route handler level, not buried in business logic
- Use custom error classes for domain errors (`NotFoundError`, `ValidationError`)
- Unhandled rejections and exceptions must crash gracefully (log + exit)

### Async Errors
- Always `await` promises or handle rejections
- Use `try/catch` in async functions, not `.catch()` chains
- Never swallow errors silently (empty catch blocks)

---

## Database

### Queries
- Use parameterized queries or ORM - never string concatenation
- Add database indexes for frequently queried fields
- Limit results (no unbounded `SELECT *`)
- Use transactions for multi-step operations

### Connections
- Use connection pooling, never create connections per request
- Set appropriate pool size based on expected load
- Handle connection errors with retry logic
- Close pools gracefully on shutdown

### Migrations
- All schema changes via version-controlled migrations
- Migrations must be reversible (up/down)
- Never edit production data directly
- Test migrations against production-like data volume

---

## Security

### Authentication
- Hash passwords with bcrypt (cost factor ≥ 12) or Argon2
- Use secure session management (httpOnly, secure, sameSite cookies)
- Implement account lockout after failed attempts
- Token expiration: short-lived access (15m), longer refresh (7d)

### Authorization
- Check permissions at every protected endpoint
- Use allowlists, not blocklists for access control
- Verify resource ownership before operations
- Log authorization failures

### Input Validation
- Validate type, format, length, and range
- Reject unexpected fields (no mass assignment)
- Sanitize output, not just input (defense in depth)
- File uploads: validate type, size, scan for malware

### Secrets
- No secrets in code, config files, or environment defaults
- Use secret managers (Vault, AWS Secrets Manager, etc.)
- Rotate secrets on schedule and after incidents
- Minimum permission principle for service accounts

---

## Logging & Observability

### What to Log
- Request ID for correlation across services
- User ID (when authenticated)
- Action taken and result
- Performance metrics (response time, DB query time)

### What NOT to Log
- Passwords, tokens, or API keys
- PII beyond what's needed for debugging
- Full request/response bodies in production

### Structured Logging
- Use JSON format for machine parsing
- Include timestamp, level, service name, request ID
- Use appropriate levels (error, warn, info, debug)
- Send logs to centralized system, not just stdout

### Health Checks
- Expose `/health` endpoint for orchestrators
- Check critical dependencies (database, cache)
- Return appropriate status, not just 200 OK always

---

## Configuration

### Environment Variables
- Load configuration at startup, not per-request
- Fail fast on missing required config
- Validate config values on startup
- Use different configs for dev/staging/prod

### Defaults
- Sensible defaults for optional config
- Never default security settings to permissive
- Document all environment variables

---

## Testing

### Unit Tests
- Test business logic in isolation
- Mock external dependencies (database, APIs)
- Test error paths, not just happy paths
- Name tests descriptively: `should [expected] when [condition]`

### Integration Tests
- Test actual database interactions
- Use test containers or isolated test databases
- Clean up test data after runs
- Test authentication and authorization flows

### API Tests
- Test HTTP layer (status codes, headers, body format)
- Test validation error responses
- Test rate limiting and error handling
- Use realistic test data

---

## Performance

### Response Times
- Target p95 response time under 200ms for simple queries
- Background jobs for anything over 1 second
- Return 202 Accepted for async operations

### Caching
- Cache expensive computations and external API calls
- Set appropriate TTLs based on data freshness needs
- Invalidate cache on writes
- Handle cache failures gracefully (fallback to source)

### Resource Management
- Stream large responses, don't buffer entirely
- Set request body size limits
- Timeout external service calls (default: 30s max)
- Clean up resources in finally blocks

---

## Async Operations

### Background Jobs
- Use job queues for async work (Bull, Agenda, etc.)
- Implement idempotency for job handlers
- Set appropriate retry policies with backoff
- Monitor job queue depth and processing time

### Concurrency
- Avoid race conditions with optimistic locking or transactions
- Use mutex/semaphore for shared resource access
- Limit concurrent external API calls
- Handle partial failures in batch operations

---

## TypeScript (if applicable)

### Types
- Enable strict mode in tsconfig
- No `any` - use `unknown` and narrow, or define proper types
- Define interfaces for API request/response schemas
- Use enums or unions for finite value sets

### Null Handling
- Explicit null checks before property access
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Avoid non-null assertions (`!`) except in tests

---

## Dependencies

### Management
- Pin exact versions in production (`"express": "4.18.2"`, not `"^4.18.2"`)
- Audit dependencies regularly (`npm audit`)
- Update dependencies on a schedule, not just when broken
- Minimize dependency count where possible

### Security
- No dependencies with known vulnerabilities in production
- Verify package sources (typosquatting prevention)
- Use lockfiles and verify integrity hashes

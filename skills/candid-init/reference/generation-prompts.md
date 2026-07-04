# Generation Agent Prompts (candid-init Step 9, thorough mode)

Prompt templates for the five parallel generation sub-agents. Launch all 5 via the Task tool, pasting the relevant analysis results into each prompt where indicated.

#### Generation Agent 1: Architecture Section (~100 lines)

**Prompt:**
```
Generate the Architecture section of a Technical.md file.

Use these analysis results:
[Paste layer structure, import graph, violations from analysis agents]

Write ~100 lines covering:

## Architecture

### Project Structure Overview
- Full directory tree with annotations explaining each directory's purpose
- Which directories are entry points, which are internal

### Layer Architecture
- Detailed layer diagram with all detected layers
- What each layer is responsible for
- Dependencies between layers (what can import what)

### Dependency Rules (15-20 specific rules)
For each layer/directory, specify:
- What it CAN import (with path examples)
- What it CANNOT import (with reasoning)
- Example: "`src/controllers/` can import from `src/services/` and `src/middleware/`, NOT from `src/repositories/` or `src/models/` directly"

### Module Boundaries
- Feature/domain boundaries if detected
- Cross-module communication rules
- Shared code location and usage rules

### Current Violations
- List each detected violation with file:line
- Recommended fix for each

### Reference Implementation
- Point to 1-2 files that exemplify correct architecture
```

#### Generation Agent 2: Naming & Code Style Section (~80 lines)

**Prompt:**
```
Generate the Naming Conventions and Code Style section of a Technical.md file.

Use these analysis results:
[Paste naming patterns from analysis agents]

Write ~80 lines covering:

## Naming Conventions

### File Naming (10-15 rules)
For each file type, specify:
- Pattern with regex or glob
- Examples from this codebase
- Counter-examples (what NOT to do)

### Class & Component Naming (10-15 rules)
- Suffixes by type (Service, Controller, Repository, etc.)
- Prefixes if used
- Examples from actual files

### Function & Method Naming (10-15 rules)
- Verb prefixes by purpose (get, set, fetch, handle, on, is, has, etc.)
- Async function naming
- Event handler naming

### Variable Naming (10-15 rules)
- Boolean prefixes
- Constants style
- Collection naming (plural vs singular)
- Destructuring conventions

### Import Organization
- Import ordering rules
- Path alias usage
- Barrel export rules

### Code Examples
Include 2-3 annotated code snippets showing correct naming in context
```

#### Generation Agent 3: Error Handling & Logging Section (~80 lines)

**Prompt:**
```
Generate the Error Handling and Logging section of a Technical.md file.

Use these analysis results:
[Paste error handling patterns from analysis agents]

Write ~80 lines covering:

## Error Handling

### Error Class Hierarchy
- Full hierarchy diagram if exists
- When to use each error type
- How to create new error types

### Error Handling Patterns (15-20 rules)
- Where to catch errors (boundary vs distributed)
- How to wrap errors
- How to add context
- What to log vs what to return

### API Error Responses
- Standard error response format with JSON schema
- HTTP status code mapping
- Error code conventions
- Example responses for common scenarios

### Error Logging
- What context to include
- Log levels by error type
- Sensitive data redaction rules

## Logging

### Log Levels
- When to use each level
- Examples for each

### Structured Logging Format
- Required fields
- Optional fields by context
- Example log entries

### What NOT to Log
- Sensitive data list
- PII handling
```

#### Generation Agent 4: Testing Section (~80 lines)

**Prompt:**
```
Generate the Testing section of a Technical.md file.

Use these analysis results:
[Paste testing patterns from analysis agents]

Write ~80 lines covering:

## Testing

### Test Organization
- File location rules (colocated vs separate)
- Directory structure for different test types
- Naming conventions

### Test Naming (10-15 rules)
- Describe block naming
- Test case naming patterns
- Example test names from codebase

### Unit Tests
- What to unit test
- What NOT to unit test
- Mocking rules
- Assertion patterns

### Integration Tests
- When required
- Setup/teardown patterns
- Database handling
- API testing patterns

### E2E Tests (if applicable)
- Critical paths that require E2E
- Test data management
- Environment setup

### Test Data
- Factory patterns
- Fixture usage
- Test data cleanup

### Coverage Requirements
- Minimum coverage by directory/type
- What's exempt from coverage

### Example Test Structure
Include 1-2 annotated test file examples showing correct patterns
```

#### Generation Agent 5: Security & Framework Section (~100 lines)

**Prompt:**
```
Generate the Security and Framework-Specific sections of a Technical.md file.

Use these analysis results:
[Paste security patterns and framework analysis from analysis agents]

Write ~100 lines covering:

## Security (30-40 rules)

### Input Validation
- Where validation must occur
- Validation library usage
- Schema definition rules
- Example validation code

### Authentication
- Auth middleware usage
- Protected route patterns
- Session/token handling
- Auth bypass (what's public)

### Authorization
- Permission checking patterns
- Role-based access rules
- Resource ownership verification

### Data Protection
- Sensitive data handling
- Encryption requirements
- PII rules

### API Security
- Rate limiting
- CORS configuration
- Request size limits

### Secrets Management
- Environment variable naming
- Secret rotation
- What never goes in code

## [Framework: React/Node/Python]

### [Framework-specific patterns - 30-40 rules]
[Detailed rules based on detected framework]

For React:
- Component patterns
- Hook rules
- State management
- Performance optimization
- Accessibility requirements

For Node:
- API design patterns
- Middleware patterns
- Database access patterns
- Async patterns

For Python:
- Type hints
- Class patterns
- Async patterns
- Documentation requirements
```

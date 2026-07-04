# Analysis Agent Prompts (candid-init Step 6, thorough mode)

Exact prompts for the five parallel Explore sub-agents. Each returns proposed rules with file:line evidence.

#### Agent 1: Architecture & Imports Agent

**Prompt:**
```
Analyze the architecture and import patterns in this codebase.

READ all files in these directories (or equivalent):
- src/controllers/, src/routes/, app/api/
- src/services/, src/usecases/
- src/repositories/, src/data/
- src/models/, src/entities/

For each file, examine:
1. What does this file import?
2. What layer is it in?
3. Are there violations (controller importing repo directly)?

Return:
- Layer structure diagram (what directories = what layers)
- Dependency rules (what can import what)
- Violations found (specific file:line examples)
- 3-5 proposed architecture rules with file path examples
```

#### Agent 2: Naming & Style Agent

**Prompt:**
```
Analyze naming conventions and code style across the codebase.

READ 20-30 representative files across:
- Components/UI files
- Services/business logic
- Utilities/helpers
- Tests

For each file, extract:
1. Class/function/variable naming patterns
2. File naming patterns
3. Event handler naming (handle* vs on*)
4. Boolean naming (is*, has*, should*)

Return:
- Detected naming conventions with consistency %
- Specific file examples for each pattern
- 5-8 proposed naming rules with examples from actual files
```

#### Agent 3: Error Handling & Security Agent

**Prompt:**
```
Analyze error handling and security patterns.

READ all files that:
- Define custom error classes
- Have try/catch blocks
- Handle API responses
- Deal with authentication/authorization
- Process user input

For each file, examine:
1. Error class hierarchy
2. Error response format
3. Where errors are caught (boundary vs distributed)
4. Input validation patterns
5. Auth patterns

Return:
- Error handling approach summary
- Security patterns found (or gaps)
- Specific file:line examples
- 5-8 proposed error/security rules with evidence
```

#### Agent 4: Testing Patterns Agent

**Prompt:**
```
Analyze testing patterns across the codebase.

READ all test files (*.test.*, *.spec.*, *_test.*).

For each test file, examine:
1. Test organization (describe/it patterns)
2. Setup patterns (beforeEach, fixtures, factories)
3. Mocking approach
4. Assertion patterns
5. What's tested vs what's not

Return:
- Test organization pattern
- Naming conventions
- Coverage gaps (directories without tests)
- 3-5 proposed testing rules with examples
```

#### Agent 5: Framework-Specific Agent (React/Node/Python)

**For React:**
```
Analyze React patterns across all components.

READ all .tsx files and custom hooks.

Examine:
1. Component structure patterns
2. Hook usage patterns
3. State management approach
4. Props patterns
5. Performance patterns (memo, useCallback, useMemo)

Return:
- Component architecture patterns
- State management approach
- 5-8 proposed React rules with component examples
```

**For Node.js:**
```
Analyze API and backend patterns.

READ all route handlers, middleware, and API files.

Examine:
1. Route organization
2. Middleware patterns
3. Validation approach
4. Response format
5. Database access patterns

Return:
- API design patterns
- Middleware usage
- 5-8 proposed API rules with endpoint examples
```

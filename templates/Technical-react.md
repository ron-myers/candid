# Technical Standards: React/Frontend

Standards for React applications. Violations appear as 📜 Standards Violation in candid reviews.

**Setup:** Copy to `./Technical.md` or `.candid/Technical.md`

---

## Component Architecture

### Structure
- One component per file (max 200 lines)
- Colocate styles, tests, and types with component
- Use barrel exports (`index.ts`) for public APIs only

### Naming
- Components: PascalCase (`UserProfile.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth`)
- Event handlers: `handle` + Event (`handleClick`, `handleSubmit`)
- Boolean props: `is/has/should` prefix (`isLoading`, `hasError`)

### Props
- Destructure props in function signature
- Default props via destructuring, not `defaultProps`
- Spread props only on DOM elements, never on components

---

## Hooks

### Rules
- Only call hooks at top level (no conditionals/loops)
- Only call hooks from React functions
- Custom hooks must start with `use`

### Dependencies
- Include all values from component scope in dependency arrays
- Use `useCallback` for functions passed to children
- Use `useMemo` for expensive computations only

### State
- Keep state as close to where it's used as possible
- Derive state when possible instead of storing it
- Use reducers for complex state logic (3+ related values)

---

## Performance

### Rendering
- Avoid creating objects/arrays in JSX (`style={{}}` in render)
- Memoize expensive child components with `React.memo`
- Use `key` prop correctly (stable IDs, not array indices)

### Data Fetching
- Cancel in-flight requests on unmount
- Handle loading, error, and empty states
- Deduplicate requests (SWR, React Query, or custom)

### Bundle Size
- Lazy load routes with `React.lazy`
- Code-split large dependencies
- No barrel imports from large libraries (`import { x } from 'lodash'`)

---

## State Management

### Local vs Global
- Use local state by default
- Lift state only when siblings need it
- Use context for truly global state (theme, auth, locale)

### Context
- Split contexts by domain (don't put everything in one)
- Memoize context values to prevent unnecessary renders
- Provide default values in createContext

---

## Forms

### Validation
- Validate on submit, not on every keystroke
- Show errors after field blur or submit attempt
- Use controlled inputs for complex forms, uncontrolled for simple ones

### Accessibility
- Associate labels with inputs (`htmlFor`/`id`)
- Use `aria-describedby` for error messages
- Mark required fields with `aria-required`

---

## Error Handling

### Boundaries
- Wrap route-level components in error boundaries
- Provide meaningful fallback UI, not blank screens
- Log errors to monitoring service

### Async Errors
- Handle rejected promises in useEffect
- Show user-friendly error messages
- Provide retry mechanisms for transient failures

---

## Testing

### What to Test
- User interactions, not implementation details
- Business logic in hooks and utilities
- Accessibility (use testing-library queries)

### What to Skip
- Snapshot tests (brittle, low value)
- Testing third-party library behavior
- Internal component state

### Queries
- Prefer `getByRole`, `getByLabelText` over `getByTestId`
- Use `findBy` for async elements, `queryBy` for absence checks
- Never use `container.querySelector`

---

## TypeScript

### Types
- Props interfaces named `ComponentNameProps`
- Use `FC<Props>` sparingly (prefer explicit return types)
- No `any` - use `unknown` and narrow

### Events
- Use correct event types (`React.MouseEvent<HTMLButtonElement>`)
- Generic event handlers: `(e: React.SyntheticEvent) => void`

### Refs
- Type refs properly: `useRef<HTMLInputElement>(null)`
- Check null before accessing `.current`

---

## Accessibility

### Semantic HTML
- Use `<button>` for actions, `<a>` for navigation
- Use heading hierarchy (`h1` → `h2` → `h3`)
- Use landmarks (`<main>`, `<nav>`, `<aside>`)

### Keyboard
- All interactive elements must be focusable
- Visible focus indicators (never `outline: none` without replacement)
- Logical tab order (avoid positive `tabIndex`)

### Screen Readers
- Images need `alt` text (empty for decorative)
- Icons need accessible names
- Dynamic content needs `aria-live` regions

---

## Security

### XSS Prevention
- Never use `dangerouslySetInnerHTML` with user input
- Sanitize any HTML from external sources
- Escape user content in URLs

### Data
- No sensitive data in localStorage (use httpOnly cookies)
- No secrets in client-side code
- Validate all external data before use

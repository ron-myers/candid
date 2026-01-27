# Technical Standards: Next.js + Vercel + Supabase + Clerk + Loop.so

Standards for Next.js applications deployed to Vercel with Supabase, Clerk auth, and Loop.so email. Violations appear as 📜 Standards Violation in candid reviews.

**Setup:** Copy to `./Technical.md` or `.candid/Technical.md`

---

## Next.js Architecture

### App Router
- Use App Router (`app/`) for all new routes
- Server Components by default; add `'use client'` only when needed
- Colocate route files: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- Use `route.ts` for API endpoints, not `pages/api/`

### Server vs Client Components
- Data fetching in Server Components only
- Interactive UI (onClick, useState, useEffect) requires `'use client'`
- Never import server-only code in Client Components
- Pass data as props from Server to Client, not the other way

### File Structure
```
app/
├── (auth)/           # Route groups for layouts
├── (dashboard)/
├── api/              # API routes
├── _components/      # Route-specific components (underscore = not a route)
components/           # Shared components
lib/                  # Utilities, clients, helpers
```

---

## Supabase

### Security (Non-Negotiable)
- RLS (Row Level Security) enabled on ALL tables
- Never bypass RLS with service role key in client code
- Service role key only in server-side code (API routes, Server Actions)
- All policies must be tested before deployment

### Database Access
- Use Supabase client from `@supabase/ssr` for Next.js
- Create client per-request in Server Components (no singleton)
- Use `createServerClient` for Server Components/Actions
- Use `createBrowserClient` for Client Components

### Queries
- Always handle errors: `const { data, error } = await supabase.from(...)`
- Check `error` before using `data`
- Use `.single()` when expecting one row
- Paginate lists: `.range(from, to)` with reasonable limits (max 100)

### Real-time
- Unsubscribe from channels on component unmount
- Use channel-specific names, not global
- Handle reconnection gracefully

---

## Clerk Authentication

### Middleware
- Protect routes via `clerkMiddleware()` in `middleware.ts`
- Define public routes explicitly in matcher
- Never expose protected routes without middleware check

### Server-Side Auth
- Use `auth()` in Server Components and Server Actions
- Use `currentUser()` only when you need full user object
- Check `userId` before any authenticated operation

### Client-Side Auth
- Use `useAuth()` for auth state
- Use `useUser()` only when you need user details
- Wrap authenticated pages in `<SignedIn>` or redirect

### User Data Sync
- Sync Clerk user to Supabase via webhook, not on every request
- Store `clerk_user_id` in Supabase users table
- Use Clerk metadata for app-specific user settings

### Webhook Security
- Verify webhook signatures with `svix`
- Handle `user.created`, `user.updated`, `user.deleted` events
- Idempotent handlers (safe to replay)

---

## Loop.so Email

### Sending Emails
- Use Loop.so API only from server-side (API routes, Server Actions)
- Never expose Loop.so API key to client
- Handle rate limits gracefully (429 responses)

### Templates
- Use Loop.so template IDs, not inline HTML
- Pass dynamic data via template variables
- Test all templates in development before production

### Error Handling
- Log email send failures with context (user, template, error)
- Implement retry logic for transient failures
- Alert on persistent failures (3+ retries)

### Transactional Emails
- Send immediately for auth events (welcome, password reset)
- Queue non-urgent emails (digests, notifications)
- Include unsubscribe link in marketing emails

---

## Environment Variables

### Naming
- `NEXT_PUBLIC_*` for client-accessible vars only
- No secrets in `NEXT_PUBLIC_*` variables
- Use descriptive names: `SUPABASE_SERVICE_ROLE_KEY` not `SUPABASE_KEY`

### Required Variables
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Loop.so
LOOPS_API_KEY=
```

### Validation
- Validate env vars at build time (use `zod` or similar)
- Fail fast if required vars missing
- Never log or expose secret values

---

## API Routes & Server Actions

### Server Actions
- Prefer Server Actions over API routes for form submissions
- Always validate input with `zod` or similar
- Return typed responses: `{ success: boolean, data?, error? }`

### API Routes
- Use for webhooks, external integrations, and complex operations
- Validate request body and query params
- Return appropriate status codes (200, 400, 401, 404, 500)

### Error Handling
- Catch all errors, return user-friendly messages
- Log detailed errors server-side
- Never expose stack traces to client

---

## Performance (Vercel)

### Caching
- Use `revalidate` for ISR on data that changes occasionally
- Use `cache: 'no-store'` for real-time data
- Leverage Vercel Edge Cache for static assets

### Images
- Use `next/image` for all images
- Specify `width` and `height` or use `fill`
- Use appropriate `sizes` prop for responsive images

### Bundle Size
- Dynamic import for heavy components: `dynamic(() => import(...))`
- Avoid importing entire libraries: `import { specific } from 'lib'`
- Analyze bundle with `@next/bundle-analyzer`

---

## Security

### Authentication Checks
- Verify auth in every Server Action and API route
- Never trust client-side auth state for sensitive operations
- Check permissions (not just authentication) for protected resources

### Input Validation
- Validate ALL user input server-side
- Sanitize before database operations
- Use parameterized queries (Supabase handles this)

### CORS & Headers
- Configure CORS in `next.config.js` if needed
- Set security headers via `middleware.ts` or Vercel config
- Use `Content-Security-Policy` for XSS protection

---

## Error Handling

### User-Facing Errors
- Show helpful error messages, not technical details
- Provide recovery actions when possible
- Use `error.tsx` boundary for route-level errors

### Logging
- Use structured logging (JSON format)
- Include request ID, user ID, action context
- Integrate with Vercel Logs or external service

---

## Testing

### Required Coverage
- Server Actions: input validation and happy path
- API Routes: auth checks and error handling
- RLS Policies: test with different user contexts

### Database Tests
- Use separate Supabase project for testing
- Reset database state between tests
- Never run tests against production

---

## Git & Deployment

### Branches
- `main` deploys to production (Vercel)
- Feature branches get preview deployments
- No direct commits to `main`

### Environment
- Production secrets only in Vercel dashboard
- Use `.env.local` for local development (gitignored)
- Verify preview deployments before merging

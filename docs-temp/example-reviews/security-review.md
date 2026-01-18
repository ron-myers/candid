# Example Review: Security Issues

This shows what a candid review looks like when it finds security vulnerabilities.

---

## Scenario

A developer added a user search endpoint:

```typescript
// src/api/users.ts
export async function searchUsers(req: Request, res: Response) {
  const query = req.query.q;
  const users = await db.query(`SELECT * FROM users WHERE name LIKE '%${query}%'`);
  res.json(users);
}
```

---

## Candid Review Output

### Summary

Added user search endpoint in `src/api/users.ts`. **Critical security issues found.** The implementation has SQL injection vulnerability and exposes sensitive data. Do not deploy until resolved.

---

### 🔥 Critical: SQL Injection in User Search

**File:** src/api/users.ts:3
**Problem:** User input directly interpolated into SQL query without sanitization.
**Impact:** Attackers can execute arbitrary SQL. Input like `'; DROP TABLE users; --` would delete your database.
**Fix:**
```typescript
const users = await db.query(
  'SELECT id, name, email FROM users WHERE name LIKE $1',
  [`%${query}%`]
);
```

---

### 🔥 Critical: Sensitive Data Exposure

**File:** src/api/users.ts:3
**Problem:** `SELECT *` returns all columns including password hashes, tokens, and internal IDs.
**Impact:** Data breach. Passwords and tokens exposed to anyone who calls this endpoint.
**Fix:**
```typescript
const users = await db.query(
  'SELECT id, name, email FROM users WHERE name LIKE $1',
  [`%${query}%`]
);
```

---

### ⚠️ Major: No Input Validation

**File:** src/api/users.ts:2
**Problem:** Query parameter used without validation. No length limit, no type check.
**Impact:** Denial of service via extremely long queries. Potential for other injection attacks.
**Fix:**
```typescript
const query = req.query.q;
if (typeof query !== 'string' || query.length > 100) {
  return res.status(400).json({ error: 'Invalid search query' });
}
```

---

### ⚠️ Major: No Authentication Check

**File:** src/api/users.ts:1
**Problem:** Endpoint accessible without authentication.
**Impact:** Anyone can enumerate users. Privacy violation and potential attack vector.
**Fix:**
```typescript
export async function searchUsers(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  // ... rest of handler
}
```

---

### 🤔 Edge Case: Empty Query

**File:** src/api/users.ts:2
**Problem:** No handling for empty or whitespace-only query.
**Impact:** Returns all users, which may not be intended behavior and could be a performance issue.
**Fix:**
```typescript
if (!query || query.trim().length === 0) {
  return res.status(400).json({ error: 'Search query required' });
}
```

---

### ✅ What's Good

- Async/await used correctly
- Response format is JSON (standard)

---

## Fix Selection

When candid presents this review, you'll see:

```
How would you like to handle the fixes?

1. Apply all fixes
2. Apply Critical + Major only
3. Review each fix individually
4. None (track as todos)
```

For security issues, **Apply Critical + Major only** is often the right choice - these need to be fixed before any deployment.

---

## After Fixes

The secure implementation:

```typescript
// src/api/users.ts
export async function searchUsers(req: Request, res: Response) {
  // Authentication
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Input validation
  const query = req.query.q;
  if (typeof query !== 'string' || query.length > 100) {
    return res.status(400).json({ error: 'Invalid search query' });
  }
  if (query.trim().length === 0) {
    return res.status(400).json({ error: 'Search query required' });
  }

  // Parameterized query with explicit columns
  const users = await db.query(
    'SELECT id, name, email FROM users WHERE name LIKE $1',
    [`%${query}%`]
  );

  res.json(users);
}
```

This addresses all critical and major issues from the review.

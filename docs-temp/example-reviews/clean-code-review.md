# Example Review: Clean Code Issues

This shows what a candid review looks like when it finds maintainability problems.

---

## Scenario

A developer added a function to process user data:

```typescript
// src/utils/process.ts
export function process(d: any, t: string, f: boolean) {
  let r = [];
  if (t === 'user') {
    for (let i = 0; i < d.length; i++) {
      if (d[i].status === 'active') {
        if (d[i].age >= 18) {
          if (f) {
            r.push({
              n: d[i].firstName + ' ' + d[i].lastName,
              e: d[i].email,
              a: d[i].age,
              s: d[i].status
            });
          } else {
            r.push({
              name: d[i].firstName + ' ' + d[i].lastName,
              email: d[i].email
            });
          }
        }
      }
    }
  } else if (t === 'admin') {
    for (let i = 0; i < d.length; i++) {
      if (d[i].role === 'admin' || d[i].role === 'superadmin') {
        r.push({
          name: d[i].firstName + ' ' + d[i].lastName,
          email: d[i].email,
          role: d[i].role
        });
      }
    }
  }
  return r;
}
```

---

## Candid Review Output

### Summary

Added `process` function in `src/utils/process.ts`. **Significant maintainability concerns.** The code works but will be a maintenance nightmare. Deep nesting, unclear naming, and no type safety.

---

### 📋 Code Smell: Meaningless Function and Parameter Names

**File:** src/utils/process.ts:1
**Problem:** `process`, `d`, `t`, `f`, `r` tell you nothing about what this code does.
**Impact:** Every future reader (including you in 2 weeks) will have to reverse-engineer the intent.
**Fix:**
```typescript
export function formatUsers(
  users: User[],
  userType: 'user' | 'admin',
  includeFullDetails: boolean
): FormattedUser[]
```

---

### 📋 Code Smell: Deep Nesting (4 levels)

**File:** src/utils/process.ts:5-17
**Problem:** Nested if statements create a "pyramid of doom." Hard to trace logic flow.
**Impact:** Bug-prone. Easy to miss a closing brace or put code in the wrong block.
**Fix:**
```typescript
// Early returns and filter instead of nested ifs
function formatActiveUsers(users: User[], includeFullDetails: boolean) {
  const activeAdults = users.filter(u => u.status === 'active' && u.age >= 18);

  return activeAdults.map(user =>
    includeFullDetails
      ? formatFullUser(user)
      : formatBasicUser(user)
  );
}
```

---

### 📋 Code Smell: `any` Type

**File:** src/utils/process.ts:1
**Problem:** `d: any` disables all type checking. TypeScript can't help you.
**Impact:** Typos like `d[i].emial` won't be caught. Refactoring becomes dangerous.
**Fix:**
```typescript
interface User {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  status: 'active' | 'inactive';
  role?: 'user' | 'admin' | 'superadmin';
}

export function formatUsers(users: User[], ...): FormattedUser[]
```

---

### 📋 Code Smell: Magic Strings

**File:** src/utils/process.ts:3, 5, 6, 21
**Problem:** Strings like `'user'`, `'active'`, `18`, `'admin'` scattered throughout.
**Impact:** Typo `'actve'` would silently fail. Changing the age requirement means finding all `18`s.
**Fix:**
```typescript
const MINIMUM_AGE = 18;
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
} as const;

const ADMIN_ROLES = ['admin', 'superadmin'] as const;
```

---

### 📋 Code Smell: Abbreviated Property Names

**File:** src/utils/process.ts:9-12
**Problem:** Output uses `n`, `e`, `a`, `s` instead of meaningful names.
**Impact:** Consumers of this data have to guess what `n` means. Autocomplete won't help.
**Fix:**
```typescript
{
  name: `${user.firstName} ${user.lastName}`,
  email: user.email,
  age: user.age,
  status: user.status
}
```

---

### 💭 Architectural: Function Does Multiple Things

**File:** src/utils/process.ts:1-27
**Problem:** One function handles both user and admin processing. Violates Single Responsibility.
**Impact:** Changes to admin logic risk breaking user logic. Testing is harder.
**Fix:**
```typescript
// Separate functions for separate concerns
export function formatActiveUsers(users: User[], includeFullDetails: boolean) { ... }
export function formatAdmins(users: User[]) { ... }
```

---

### 🤔 Edge Case: Empty Input

**File:** src/utils/process.ts:1
**Problem:** No validation of input. What if `d` is null or not an array?
**Impact:** Runtime crash on `d.length` if input is invalid.
**Fix:**
```typescript
export function formatUsers(users: User[] = [], ...): FormattedUser[] {
  if (!Array.isArray(users)) {
    return [];
  }
  // ...
}
```

---

### ✅ What's Good

- Logic is correct (it does produce the right output)
- Uses const for result array (r)

---

## After Fixes

The clean implementation:

```typescript
// src/utils/user-formatter.ts

interface User {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  status: 'active' | 'inactive';
  role?: 'user' | 'admin' | 'superadmin';
}

interface FormattedUser {
  name: string;
  email: string;
  age?: number;
  status?: string;
  role?: string;
}

const MINIMUM_AGE = 18;
const ADMIN_ROLES = ['admin', 'superadmin'] as const;

function formatName(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}

export function formatActiveUsers(
  users: User[],
  includeFullDetails: boolean
): FormattedUser[] {
  if (!Array.isArray(users)) {
    return [];
  }

  return users
    .filter(user => user.status === 'active' && user.age >= MINIMUM_AGE)
    .map(user => ({
      name: formatName(user),
      email: user.email,
      ...(includeFullDetails && {
        age: user.age,
        status: user.status
      })
    }));
}

export function formatAdmins(users: User[]): FormattedUser[] {
  if (!Array.isArray(users)) {
    return [];
  }

  return users
    .filter(user => user.role && ADMIN_ROLES.includes(user.role as any))
    .map(user => ({
      name: formatName(user),
      email: user.email,
      role: user.role
    }));
}
```

Clear names, flat structure, type safety, and single responsibility.

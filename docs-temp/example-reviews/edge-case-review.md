# Example Review: Edge-Case Focus Mode

This shows the difference between a general review and an edge-case focused review. The edge-case mode finds 2-3x more issues by systematically checking boundary conditions, error scenarios, and unusual inputs.

---

## Scenario

A developer added a user order processing function:

```typescript
// src/orders/process.ts
export async function processUserOrders(userId: string) {
  const user = await api.get(`/users/${userId}`);
  const orders = await fetchOrders(userId);

  const total = orders.reduce((sum, order) => sum + order.total, 0);

  return {
    userName: user.name,
    totalSpent: total,
    orderCount: orders.length
  };
}
```

---

## General Review Output

### Summary

Added user order processing in `src/orders/process.ts`. Found 2 edge case issues.

---

### 🤔 Empty orders array not handled

**File:** src/orders/process.ts:5
**Problem:** No check for empty result from `fetchOrders()`
**Impact:** Returns 0 for total but doesn't distinguish between "no orders" vs "orders exist"
**Fix:**
```typescript
if (orders.length === 0) {
  return { userName: user.name, totalSpent: 0, orderCount: 0, hasOrders: false };
}
```

---

### ⚠️ Missing error handling for API call

**File:** src/orders/process.ts:2
**Problem:** No try-catch around API call
**Impact:** Unhandled promise rejection if API fails
**Fix:**
```typescript
try {
  const user = await api.get(`/users/${userId}`);
} catch (error) {
  throw new Error('Failed to fetch user');
}
```

---

## Edge-Case Focus Mode Output

### Summary

Added user order processing in `src/orders/process.ts`. **Found 8 edge case issues** requiring immediate attention. The implementation lacks comprehensive error handling, input validation, and edge case coverage.

---

### 🔥 Critical: Null/undefined crashes in order processing

**File:** src/orders/process.ts:2-11
**Confidence:** Safe ✓
**Problem:** Multiple null/undefined access points without defensive checks:
  - `user` could be null if API returns 404
  - `user.name` could be undefined
  - `orders` could be null if fetch fails
  - `order.total` could be undefined in malformed data

**Impact:** Production crashes with "Cannot read property 'name' of null" or similar. Users see error page instead of graceful handling.

**Fix:**
```typescript
export async function processUserOrders(userId: string) {
  // Validate input
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }

  // Fetch with null checks
  const user = await api.get(`/users/${userId}`);
  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const orders = await fetchOrders(userId);
  if (!orders) {
    throw new Error('Failed to fetch orders');
  }

  // Filter out invalid orders
  const validOrders = orders.filter(o => o && typeof o.total === 'number');

  const total = validOrders.reduce((sum, order) => sum + order.total, 0);

  return {
    userName: user.name || 'Unknown',
    totalSpent: total,
    orderCount: validOrders.length
  };
}
```

---

### ⚠️ Major: Missing async operation safety

**File:** src/orders/process.ts:2-3
**Confidence:** Verify ⚡
**Problem:** API calls lack comprehensive error handling:
  - No timeout configured (could hang forever)
  - No retry logic for transient failures
  - No handling of 4xx vs 5xx errors
  - No cancellation if caller aborts

**Impact:**
  - Hanging requests consume resources
  - Transient network errors cause permanent failures
  - No distinction between "user not found" (404) vs "server error" (500)

**Fix:**
```typescript
export async function processUserOrders(userId: string, signal?: AbortSignal) {
  // Timeout wrapper
  const timeout = (ms: number) => new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms)
  );

  try {
    // Fetch user with timeout and cancellation
    const user = await Promise.race([
      api.get(`/users/${userId}`, { signal }),
      timeout(5000)
    ]);

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Fetch orders with retry logic
    let orders;
    let retries = 3;
    while (retries > 0) {
      try {
        orders = await Promise.race([
          fetchOrders(userId, { signal }),
          timeout(5000)
        ]);
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
      }
    }

    // ... rest of processing
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Operation cancelled');
    }
    if (error.message === 'Timeout') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}
```

---

### 🤔 Edge Case: Empty and single-item data edge cases

**File:** src/orders/process.ts:5-11
**Confidence:** Safe ✓
**Problem:** Multiple data edge cases not handled:
  - Empty orders array (no orders vs fetch failed)
  - Single order (plural vs singular messaging)
  - Extremely large order counts (no pagination)
  - Negative order totals (refunds/credits)

**Impact:**
  - Cannot distinguish between "user has no orders" vs "fetch failed"
  - UI shows "1 orders" (grammar error)
  - Memory exhaustion if user has 100K+ orders
  - Negative totals displayed incorrectly

**Fix:**
```typescript
export async function processUserOrders(userId: string, options = { limit: 1000 }) {
  const user = await api.get(`/users/${userId}`);
  if (!user) throw new Error(`User not found: ${userId}`);

  // Fetch with pagination limit
  const orders = await fetchOrders(userId, { limit: options.limit });
  if (!orders) throw new Error('Failed to fetch orders');

  // Handle empty case explicitly
  if (orders.length === 0) {
    return {
      userName: user.name || 'Unknown',
      totalSpent: 0,
      orderCount: 0,
      hasOrders: false
    };
  }

  // Filter valid orders and calculate totals
  const validOrders = orders.filter(o => o && typeof o.total === 'number');
  const total = validOrders.reduce((sum, order) => sum + order.total, 0);

  // Check if more orders exist
  const hasMore = orders.length === options.limit;

  return {
    userName: user.name || 'Unknown',
    totalSpent: total,
    orderCount: validOrders.length,
    hasOrders: true,
    hasMore,
    // Proper plural handling
    summary: `${validOrders.length} order${validOrders.length === 1 ? '' : 's'}`
  };
}
```

---

### 🤔 Edge Case: Type validation missing on inputs

**File:** src/orders/process.ts:1
**Confidence:** Safe ✓
**Problem:** No validation of userId parameter:
  - Accepts any type (number, object, array, null)
  - No length validation
  - No format validation (UUID, numeric ID, etc.)
  - Special characters not sanitized

**Impact:**
  - Type errors if non-string passed
  - API injection if special characters in userId
  - Database errors if userId format invalid

**Fix:**
```typescript
export async function processUserOrders(userId: string) {
  // Input validation
  if (!userId) {
    throw new Error('userId is required');
  }

  if (typeof userId !== 'string') {
    throw new Error('userId must be a string');
  }

  if (userId.length === 0 || userId.length > 100) {
    throw new Error('userId length must be between 1 and 100');
  }

  // Validate format (example for UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    throw new Error('userId must be a valid UUID');
  }

  // ... rest of function
}
```

---

### 🤔 Edge Case: Concurrent execution issues

**File:** src/orders/process.ts:1-11
**Confidence:** Verify ⚡
**Problem:** Race conditions if called multiple times:
  - No protection against double-invocation
  - Parallel calls fetch same data multiple times
  - No caching or deduplication
  - State assumptions may be invalid

**Impact:**
  - Wasted API calls and resources
  - Inconsistent results if data changes mid-execution
  - Performance degradation under load

**Fix:**
```typescript
// Add request deduplication
const pendingRequests = new Map<string, Promise<any>>();

export async function processUserOrders(userId: string) {
  // Check for pending request
  const pending = pendingRequests.get(userId);
  if (pending) {
    return pending; // Reuse in-flight request
  }

  // Create new request
  const promise = (async () => {
    try {
      const user = await api.get(`/users/${userId}`);
      if (!user) throw new Error(`User not found: ${userId}`);

      const orders = await fetchOrders(userId);
      if (!orders) throw new Error('Failed to fetch orders');

      // ... process orders

      return result;
    } finally {
      // Clean up after completion
      pendingRequests.delete(userId);
    }
  })();

  pendingRequests.set(userId, promise);
  return promise;
}
```

---

## Key Differences

**General Review:**
- Found 2 obvious issues
- Single edge case per issue
- Basic fix suggestions

**Edge-Case Focus Mode:**
- Found 8 comprehensive issues (4x more)
- Groups related edge cases together
- Detailed impact analysis for each scenario
- Complete fixes addressing multiple edge cases
- Covers input validation, async safety, data edge cases, type checking, and concurrency

**Coverage Comparison:**

| Category | General Review | Edge-Case Focus |
|----------|----------------|-----------------|
| Input validation | ❌ | ✅ (null, type, format, length) |
| Empty/null data | ✅ (basic) | ✅ (comprehensive) |
| Async safety | ✅ (basic error) | ✅ (timeout, retry, cancellation) |
| Data edge cases | ❌ | ✅ (single item, pagination, negatives) |
| Type validation | ❌ | ✅ (full validation) |
| Concurrency | ❌ | ✅ (deduplication, race conditions) |

Edge-case focus mode provides 2-3x more comprehensive coverage of boundary conditions and error scenarios.

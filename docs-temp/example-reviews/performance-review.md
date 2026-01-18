# Example Review: Performance Issues

This shows what a candid review looks like when it finds performance problems.

---

## Scenario

A developer added a dashboard endpoint that loads user orders:

```typescript
// src/api/dashboard.ts
export async function getDashboard(req: Request, res: Response) {
  const users = await User.findAll();

  const dashboardData = [];
  for (const user of users) {
    const orders = await Order.findAll({ where: { userId: user.id } });
    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
    dashboardData.push({
      user: user.name,
      orderCount: orders.length,
      totalSpent
    });
  }

  res.json(dashboardData);
}
```

---

## Candid Review Output

### Summary

Added dashboard endpoint in `src/api/dashboard.ts`. **Serious performance issues.** Classic N+1 query pattern will cause timeouts at scale. Blocking operations on main thread.

---

### ⚠️ Major: N+1 Query Problem

**File:** src/api/dashboard.ts:5
**Problem:** For each of N users, executes a separate query for orders. 1000 users = 1001 database queries.
**Impact:** Response time scales linearly with user count. Will timeout in production with real data.
**Fix:**
```typescript
// Single query with join or include
const users = await User.findAll({
  include: [{
    model: Order,
    attributes: ['total']
  }]
});

const dashboardData = users.map(user => ({
  user: user.name,
  orderCount: user.orders.length,
  totalSpent: user.orders.reduce((sum, o) => sum + o.total, 0)
}));
```

---

### ⚠️ Major: No Pagination

**File:** src/api/dashboard.ts:2
**Problem:** `findAll()` with no limit loads entire users table into memory.
**Impact:** Memory exhaustion and slow response times as data grows. 100k users = OOM crash.
**Fix:**
```typescript
const page = parseInt(req.query.page) || 1;
const limit = 50;
const offset = (page - 1) * limit;

const { count, rows: users } = await User.findAndCountAll({
  include: [{ model: Order, attributes: ['total'] }],
  limit,
  offset
});

res.json({
  data: dashboardData,
  pagination: {
    page,
    totalPages: Math.ceil(count / limit),
    total: count
  }
});
```

---

### 📋 Code Smell: Blocking Reduce in Loop

**File:** src/api/dashboard.ts:6
**Problem:** Synchronous reduce inside async loop. Less efficient than aggregating in the database.
**Impact:** CPU work that could be done in the database. Larger memory footprint.
**Fix:**
```typescript
// Do aggregation in the database
const users = await User.findAll({
  attributes: [
    'id',
    'name',
    [sequelize.fn('COUNT', sequelize.col('orders.id')), 'orderCount'],
    [sequelize.fn('SUM', sequelize.col('orders.total')), 'totalSpent']
  ],
  include: [{
    model: Order,
    attributes: []
  }],
  group: ['User.id'],
  limit: 50
});
```

---

### 🤔 Edge Case: No Users

**File:** src/api/dashboard.ts:2-4
**Problem:** No check for empty result. Returns empty array but no indication of "no data" vs "something went wrong."
**Impact:** Client can't distinguish between "no users exist" and "query failed silently."
**Fix:**
```typescript
if (users.length === 0) {
  return res.json({
    data: [],
    message: 'No users found'
  });
}
```

---

### 💭 Architectural: Business Logic in Controller

**File:** src/api/dashboard.ts:5-10
**Problem:** Data aggregation logic mixed with HTTP handling.
**Impact:** Hard to test, hard to reuse, violates separation of concerns.
**Fix:**
```typescript
// src/services/dashboard.service.ts
export async function getDashboardData(page: number, limit: number) {
  // ... aggregation logic
}

// src/api/dashboard.ts
export async function getDashboard(req: Request, res: Response) {
  const page = parseInt(req.query.page) || 1;
  const data = await DashboardService.getDashboardData(page, 50);
  res.json(data);
}
```

---

### ✅ What's Good

- Async/await used correctly
- Clear variable names
- Data transformation is straightforward

---

## Performance Impact

| Metric | Before | After |
|--------|--------|-------|
| Queries per request | N + 1 | 1-2 |
| Memory usage | O(users) | O(page size) |
| Response time (1k users) | ~5000ms | ~50ms |
| Response time (100k users) | Timeout | ~100ms |

---

## After Fixes

The performant implementation:

```typescript
// src/services/dashboard.service.ts
export async function getDashboardData(page: number, limit: number) {
  const offset = (page - 1) * limit;

  const { count, rows: users } = await User.findAndCountAll({
    attributes: [
      'id',
      'name',
      [sequelize.fn('COUNT', sequelize.col('orders.id')), 'orderCount'],
      [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('orders.total')), 0), 'totalSpent']
    ],
    include: [{
      model: Order,
      attributes: []
    }],
    group: ['User.id'],
    limit,
    offset,
    subQuery: false
  });

  return {
    data: users.map(u => ({
      user: u.name,
      orderCount: u.get('orderCount'),
      totalSpent: u.get('totalSpent')
    })),
    pagination: {
      page,
      totalPages: Math.ceil(count / limit),
      total: count
    }
  };
}

// src/api/dashboard.ts
export async function getDashboard(req: Request, res: Response) {
  const page = parseInt(req.query.page as string) || 1;
  const data = await DashboardService.getDashboardData(page, 50);
  res.json(data);
}
```

Single query, paginated, with database-level aggregation.

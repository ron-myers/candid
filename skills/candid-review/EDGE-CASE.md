# Edge-Case Focus Mode Checklist

When `--focus edge-case` is active, systematically check every code path for boundary conditions, error scenarios, and unusual inputs. Go beyond surface-level checks to exhaustively analyze edge cases.

**Input Validation Matrix**
For every input (function arguments, API parameters, user input, config values):
- [ ] Null/undefined handling - Does code check for null/undefined before use?
- [ ] Empty collection handling - How does code handle [], {}, "", empty Map/Set?
- [ ] Type validation - Is type checked (string vs number, array vs object)?
- [ ] Boundary values - Tested with 0, -1, Infinity, NaN, MIN/MAX values?
- [ ] Length limits - Are string/array length limits enforced?
- [ ] Special characters - Handles unicode, emoji, control characters, zero-width spaces?
- [ ] Whitespace variations - Tested with leading, trailing, or whitespace-only input?
- [ ] Extra/missing properties - Handles unexpected object properties or missing required fields?

**Async Operation Safety**
For every async operation (promises, async/await, callbacks):
- [ ] Timeout configured - Is there a timeout to prevent hanging forever?
- [ ] Cancellation on cleanup - Are operations cancelled on unmount/navigation?
- [ ] Error handling - All failure modes caught (network, validation, business logic)?
- [ ] Race condition analysis - What if multiple async operations complete out of order?
- [ ] Double-invocation protection - What if user triggers operation twice quickly?
- [ ] State validity after await - Is component/data still valid after async completes?

**Data Structure Edge Cases**
For every data query, transformation, or collection operation:
- [ ] Empty result set - How does code handle zero results from query/filter?
- [ ] Single item edge case - Does plural handling work correctly for 1 item?
- [ ] Large dataset pagination - Is pagination implemented for potentially large results?
- [ ] Sorting with null/equal values - How are null values or equal items sorted?
- [ ] Filtering edge cases - Handles no matches, all matches, partial matches?
- [ ] Duplicate handling - Are duplicates detected/prevented when required?

**Network Resilience**
For every network call (API, fetch, external service):
- [ ] Timeout specified - Is request timeout configured (not infinite)?
- [ ] Retry logic - Are retries implemented with exponential backoff?
- [ ] 4xx/5xx error handling - Different handling for client vs server errors?
- [ ] Network offline handling - Graceful degradation when offline?
- [ ] Partial failure scenarios - What if some requests succeed, others fail?
- [ ] Loading/error states - Does UI show appropriate feedback during/after request?

**State Lifecycle**
For every stateful component or module:
- [ ] Cleanup on unmount - Are event listeners, timers, subscriptions cleaned up?
- [ ] Concurrent update handling - What if state updates happen simultaneously?
- [ ] State updates after navigation - Are updates prevented after user navigates away?
- [ ] Re-initialization safety - Can component be safely re-initialized?
- [ ] Memory leak potential - Are there circular references or retained closures?

**Date/Time Edge Cases**
For every date/time operation:
- [ ] Timezone handling - Is timezone properly considered?
- [ ] DST transitions - Tested with daylight saving time changes?
- [ ] Leap year/second - Handles February 29th, leap seconds?
- [ ] Invalid date handling - What happens with invalid date strings?
- [ ] Locale-specific formatting - Works correctly across different locales?

**Browser/Environment**
For every browser API or environment-dependent code:
- [ ] API availability check - Is feature detection done before using browser APIs?
- [ ] Mobile vs desktop differences - Tested on both touch and mouse interactions?
- [ ] Keyboard accessibility - Can all interactions be done via keyboard?
- [ ] LocalStorage/Cookie unavailability - Graceful fallback if storage disabled?
- [ ] Screen size variations - Responsive to different viewport sizes?
- [ ] JavaScript disabled scenarios - Progressive enhancement where critical?

**Security Edge Cases**
For every security-sensitive operation:
- [ ] CSRF token handling - Token refresh on expiration?
- [ ] Session timeout - Graceful handling of expired sessions?
- [ ] Permission changes mid-operation - What if permissions revoked during action?
- [ ] Authentication token refresh - Automatic refresh before expiration?
- [ ] XSS via unusual vectors - Sanitization covers edge cases (data URIs, SVG, etc.)?

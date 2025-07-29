---
applyTo: "**"
---
Testing Instructions

## UI Playwright Testing (Vitest)
** Not implemented yet **

## API Testing (Vitest)

1. **Plan Individual API Tests**  
   List each endpoint and its expected behaviors (status codes, response shapes) as discrete test cases.

2. **Write One API Test at a Time**  
   Implement a single `test('…', () => { … })` per run, targeting one endpoint or assertion.

3. **Run & Verify**  
   Execute:
   ```
   # From the directory: apps/api
   pnpm test
   ```
   to validate the new API test passes.

4. **Fix Before Moving On**  
   Address any failures immediately; don’t write subsequent tests until the current one is green.

5. **Maintain Test Independence**  
   Use mock servers or isolated fixtures so tests don’t interfere with each other.

6. **Refactor Shared Setup**  
   After multiple tests pass, consolidate HTTP setup/teardown (e.g., `beforeEach`, `afterEach`) into reusable fixtures.


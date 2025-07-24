---
applyTo: "**"
---
Testing Instructions

## UI Playwright Testing

1. **Plan Individual UI Tests**  
   Outline each user interaction or feature (e.g., “homepage loads”, “login form validation”) as a separate test case.

2. **Invoke the Playwright MCP Server**  
   Use the `playwright` MCP server to generate or update test skeletons for the outlined cases.

3. **Write One UI Test at a Time**  
   Develop exactly one Playwright `test(...)` block per iteration, focusing on a single assertion or flow.

4. **Run & Verify**  
   After creating the test, execute:
   ```
   # From the root of repo
   pnpm test:ui
   ```
   to confirm it passes.

5. **View Results**  
   Check the generated `test-results.json` or `playwright-report/` for details on test execution.

5. **Fix Before Moving On**  
   If the test fails, iterate until it passes. Only once green, proceed to the next test.

6. **Ensure Independence**  
   Keep each test isolated—no shared state or side-effects—to maximize reliability.

7. **Refactor After Validation**  
   When multiple tests are passing, extract common selectors or helpers into utility modules to DRY up the code.

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


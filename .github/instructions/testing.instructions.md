---
applyTo: "**"
description: Comprehensive testing strategy and implementation guidelines for API, web, and package testing across the monorepo.
---

# Testing Documentation

This document outlines the testing strategy, tools, and best practices for ensuring code quality across all workspaces in the monorepo.

> **IMPORTANT:** If you detect any new patterns, best practices, or inconsistencies between this document and the actual implementation in the codebase, please update these instructions to reflect the current best practices.

## Testing Architecture

### Testing Stack
- **Test Runner**: Vitest (for all packages)
- **API Testing**: Vitest with database mocking
- **Web Testing**: Vitest + React Testing Library + jsdom
- **Coverage**: @vitest/coverage-v8
- **Mocking**: Native Vitest mocking capabilities

### Test Organization
```
apps/api/src/
├── routes/
│   └── jobs/
│       ├── jobs.handlers.ts
│       ├── jobs.test.ts          # API endpoint tests
│       └── ...
└── tests/                        # Shared test utilities

apps/web/src/
├── routes/
│   └── ~dashboard/
│       └── ~jobs/
│           └── components/
│               ├── form.tsx
│               ├── form.test.tsx  # Component tests
│               └── ...
└── test/                         # Web test utilities
```

## API Testing (Vitest)

### API Testing Guidelines

1. **Plan Individual API Tests**  
   List each endpoint and its expected behaviors (status codes, response shapes) as discrete test cases.

2. **Write One API Test at a Time**  
   Implement a single `test('…', () => { … })` per run, targeting one endpoint or assertion.

3. **Run & Verify**  
   Execute from the API directory:
   ```bash
   cd apps/api
   pnpm test
   ```

4. **Fix Before Moving On**  
   Address any failures immediately; don't write subsequent tests until the current one is green.

5. **Maintain Test Independence**  
   Use mock servers or isolated fixtures so tests don't interfere with each other.

6. **Refactor Shared Setup**  
   After multiple tests pass, consolidate HTTP setup/teardown (e.g., `beforeEach`, `afterEach`) into reusable fixtures.

### Test Structure
API tests focus on handler functions and route behavior:

```typescript
// jobs.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { testClient } from '@/api/tests/test-client';
import * as handlers from './jobs.handlers';

describe('Jobs API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /jobs', () => {
    it('should return user-scoped jobs', async () => {
      // Test implementation
    });

    it('should handle pagination correctly', async () => {
      // Test implementation
    });

    it('should filter by search query', async () => {
      // Test implementation
    });
  });

  describe('POST /jobs', () => {
    it('should create a new job', async () => {
      // Test implementation
    });

    it('should validate required fields', async () => {
      // Test implementation
    });

    it('should associate job with authenticated user', async () => {
      // Test implementation
    });
  });
});
```

### API Testing Patterns

#### 1. Handler Unit Tests
Test handlers in isolation with mocked dependencies:

```typescript
import { vi, describe, it, expect } from 'vitest';
import { list } from './jobs.handlers';

// Mock database
vi.mock('@/api/db', () => ({
  default: {
    query: {
      jobs: {
        findMany: vi.fn(),
      },
    },
  },
}));

describe('list handler', () => {
  it('should return paginated jobs for authenticated user', async () => {
    const mockContext = {
      get: vi.fn().mockReturnValue({
        user: { id: 'test-user-id' }
      }),
      req: {
        valid: vi.fn().mockReturnValue({
          page: 1,
          pageSize: 10,
          sortBy: 'createdAt',
          sortDirection: 'desc'
        }),
      },
      json: vi.fn(),
    };

    await list(mockContext as any);
    
    expect(mockContext.json).toHaveBeenCalledWith({
      items: expect.any(Array),
      hasNext: expect.any(Boolean),
    });
  });
});
```

#### 2. Integration Tests
Test complete request/response cycles:

```typescript
import { testApp } from '@/api/tests/test-app';

describe('Jobs API Integration', () => {
  it('should handle complete job creation flow', async () => {
    const response = await testApp.request('/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'test-key',
        'X-API-Secret': 'test-secret',
      },
      body: JSON.stringify({
        definitionNL: 'Test job description',
      }),
    });

    expect(response.status).toBe(201);
    const job = await response.json();
    expect(job).toMatchObject({
      id: expect.any(String),
      definitionNL: 'Test job description',
      userId: 'test-user-id',
    });
  });
});
```

#### 3. Authentication Tests
Test authentication middleware:

```typescript
describe('Authentication', () => {
  it('should reject requests without authentication', async () => {
    const response = await testApp.request('/jobs');
    expect(response.status).toBe(401);
  });

  it('should accept valid API key authentication', async () => {
    const response = await testApp.request('/jobs', {
      headers: {
        'X-API-Key': 'valid-key',
        'X-API-Secret': 'valid-secret',
      },
    });
    expect(response.status).toBe(200);
  });

  it('should check API key scopes', async () => {
    const response = await testApp.request('/admin/users', {
      headers: {
        'X-API-Key': 'user-key', // No admin scope
        'X-API-Secret': 'user-secret',
      },
    });
    expect(response.status).toBe(403);
  });
});
```

## Web Testing (Vitest + React Testing Library)

### Component Testing Setup
```typescript
// form.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JobForm from './form';

// Mock complex components
vi.mock('@/web/components/date-picker', () => ({
  DatePicker: ({ onChange, placeholder }: any) => (
    <div data-testid="date-picker-mock">
      <input
        type="text"
        data-testid="date-picker-input"
        aria-label="Expiration Date"
        placeholder={placeholder || "Select date"}
        onClick={() => onChange(new Date("2025-01-01T00:00:00.000Z"))}
      />
    </div>
  ),
}));

describe('JobForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // Test cases...
});
```

### Web Testing Patterns

#### 1. Form Component Tests
Test form rendering, validation, and submission:

```typescript
describe('JobForm', () => {
  describe('rendering', () => {
    it('renders form fields correctly', () => {
      render(<JobForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} mode="create" />);

      expect(screen.getByLabelText(/Job Description/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Job/i })).toBeInTheDocument();
    });

    it('renders with default values when provided', () => {
      const defaultValues = {
        definitionNL: 'Test job description',
      };

      render(
        <JobForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          mode="update"
          defaultValues={defaultValues}
        />
      );

      expect(screen.getByDisplayValue('Test job description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Update Job/i })).toBeDisabled(); // Form not dirty
    });
  });

  describe('form submission', () => {
    it('calls onSubmit with form data', async () => {
      const user = userEvent.setup();
      
      render(<JobForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} mode="create" />);
      
      await user.type(screen.getByLabelText(/Job Description/i), 'New job description');
      await user.click(screen.getByRole('button', { name: /Create Job/i }));
      
      expect(mockOnSubmit).toHaveBeenCalledWith({
        definitionNL: 'New job description',
      });
    });

    it('shows validation errors for invalid input', async () => {
      const user = userEvent.setup();
      
      render(<JobForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} mode="create" />);
      
      // Submit without filling required field
      await user.click(screen.getByRole('button', { name: /Create Job/i }));
      
      expect(await screen.findByText(/Description is required/i)).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('loading states', () => {
    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Create controlled promise for submission
      let resolveSubmission: (value: unknown) => void;
      const submissionPromise = new Promise((resolve) => {
        resolveSubmission = resolve;
      });

      const controlledMockSubmit = vi.fn().mockImplementation(() => submissionPromise);
      
      render(<JobForm onSubmit={controlledMockSubmit} onCancel={mockOnCancel} mode="create" />);
      
      await user.type(screen.getByLabelText(/Job Description/i), 'Test job');
      await user.click(screen.getByRole('button', { name: /Create Job/i }));
      
      // Button should show loading state
      expect(screen.getByRole('button', { name: /Saving/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Saving/i })).toBeDisabled();
      
      // Resolve submission
      resolveSubmission!({});
      
      // Wait for button to return to normal state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Create Job/i })).toBeInTheDocument();
      });
    });
  });
});
```

### Web Testing Best Practices

1. **User-Centric Testing**: Test from the user's perspective, focusing on what users see and interact with
2. **Behavior over Implementation**: Test component behavior, not implementation details
3. **Comprehensive Coverage**: Test all key aspects of component functionality
4. **Accessible Testing**: Use role-based queries and proper ARIA attributes
5. **Mock External Dependencies**: Mock complex components and API calls

## Testing Infrastructure

### Test Utilities

#### API Test Utilities
```typescript
// apps/api/src/tests/test-client.ts
import app from '../app';

export const testClient = {
  request: (path: string, init?: RequestInit) => {
    return app.request(new Request(`http://localhost${path}`, init));
  },
};

// Test database setup
export const setupTestDb = async () => {
  // Setup isolated test database
};

export const cleanupTestDb = async () => {
  // Cleanup test data
};
```

#### Web Test Utilities
```typescript
// apps/web/src/test/test-utils.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

## Test Configuration

### Vitest Configuration

#### API Configuration (`apps/api/vitest.config.ts`)
```typescript
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'dist/**',
        'src/db/migrations/**',
        'src/tests/**',
      ],
    },
  },
});
```

#### Web Configuration (`apps/web/vitest.config.ts`)
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'dist/**',
        'src/test/**',
        '**/*.test.tsx',
      ],
    },
  },
});
```

## Coverage Requirements

### Coverage Targets
- **API**: 80%+ line coverage on handlers and business logic
- **Web**: 70%+ coverage on components and utility functions
- **Critical Paths**: 90%+ coverage on authentication and data validation

### Coverage Exclusions
- Migration files
- Test utilities
- Configuration files
- Generated code

## Testing Best Practices

1. **Test Organization**: Group related tests with `describe` blocks
2. **Test Isolation**: Each test should be independent and not rely on others
3. **Clear Test Names**: Use descriptive test names that explain the behavior
4. **AAA Pattern**: Arrange, Act, Assert structure for clarity
5. **Mock External Dependencies**: Mock database, API calls, and complex components
6. **Edge Case Testing**: Test error conditions and boundary cases
7. **Performance Testing**: Consider test execution time and avoid slow tests
8. **Maintenance**: Keep tests up to date with code changes
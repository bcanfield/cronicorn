---
applyTo: '**/form.test.tsx'
description: Provides guidelines and best practices for unit testing form components in our project. Follow these patterns to ensure consistent, robust testing of forms.
---

> **IMPORTANT:** If you detect any new patterns, best practices, or inconsistencies between this document and the actual testing implementation in the codebase, please update these instructions to reflect the current best practices. Keep this documentation aligned with the actual test patterns used in the project.

## Testing Approach

We use Vitest and React Testing Library for unit testing form components. Our approach focuses on:

- **User-centric testing**: Test from the user's perspective, focusing on what users see and interact with
- **Behavior over implementation**: Test component behavior, not implementation details
- **Comprehensive coverage**: Test all key aspects of form functionality

## Test Coverage Requirements

All form components should have tests for these aspects:

- **Rendering**: Verify all fields, labels, and buttons render correctly
- **Initial Values**: Verify default values display correctly when provided
- **Validation**: Test form validation rules and error messages
- **Form Submission**: Verify correct data is passed to handlers
- **Loading States**: Test loading state displays during submission
- **User Interactions**: Test buttons and interactive elements
- **Conditional Rendering**: Test elements that appear/disappear based on props or state

## Testing Form Components

### Test Structure

Organize tests using nested `describe` blocks for better readability:

```tsx
describe("component name", () => {
  // Setup code, mocks, test data

  describe("rendering", () => {
    // Tests for component rendering
  });

  describe("form submission", () => {
    // Tests for form submission behavior
  });

  describe("user interactions", () => {
    // Tests for user interaction behaviors
  });
});
```

### Example Test Cases

#### Rendering Tests

```tsx
it("renders form fields correctly", () => {
  render(<FormComponent onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

  expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();

  // For complex components that may not have proper label associations,
  // test for text content instead
  expect(screen.getByText(/Expiration Date/i)).toBeInTheDocument();
  expect(screen.getByTestId("date-picker-mock")).toBeInTheDocument();

  expect(screen.getByRole("button", { name: /Create/i })).toBeInTheDocument();
});

it("renders with default values when provided", () => {
  render(<FormComponent onSubmit={mockOnSubmit} onCancel={mockOnCancel} defaultValues={sampleData} />);

  expect(screen.getByLabelText(/Name/i)).toHaveValue("Test Name");
  expect(screen.getByLabelText(/Description/i)).toHaveValue("Test Description");
  
  // Button should be disabled initially because form is not dirty
  expect(screen.getByRole("button", { name: /Create/i })).toBeDisabled();
});
```

#### Validation Tests

```tsx
it("shows validation errors when form is invalid", async () => {
  render(<FormComponent onSubmit={mockOnSubmit} />);
  
  await user.type(screen.getByLabelText(/Username/i), "ab"); // Too short
  await user.click(screen.getByRole("button", { name: /Submit/i }));
  
  expect(await screen.findByText(/must be at least/i)).toBeInTheDocument();
  expect(mockOnSubmit).not.toHaveBeenCalled();
});
```

#### Submission Tests

```tsx
it("calls onSubmit with form data", async () => {
  render(<FormComponent onSubmit={mockOnSubmit} />);
  
  await user.type(screen.getByLabelText(/Username/i), "testuser");
  await user.click(screen.getByRole("button", { name: /Submit/i }));
  
  expect(mockOnSubmit).toHaveBeenCalledWith({ username: "testuser" });
});
```

#### Loading State Tests

```tsx
it("shows loading state during submission", async () => {
  // Create a promise that we can resolve manually to control when submission completes
  let resolveSubmission: (value: unknown) => void;
  const submissionPromise = new Promise((resolve) => {
    resolveSubmission = resolve;
  });

  const controlledMockSubmit = vi.fn().mockImplementation(() => submissionPromise);
  
  render(<FormComponent onSubmit={controlledMockSubmit} onCancel={mockOnCancel} />);
  
  // Fill out the form - we need to ensure the form is dirty to enable the submit button
  await user.type(screen.getByLabelText(/Name/i), "Test Entity");
  await user.click(screen.getByRole("button", { name: /Create/i }));
  
  // Button should show loading state
  expect(screen.getByRole("button", { name: /Saving/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Saving/i })).toBeDisabled();
  
  // Resolve the submission
  resolveSubmission!({});
  
  // Wait for the button to return to normal state
  await waitFor(() => {
    expect(screen.getByRole("button", { name: /Create/i })).toBeInTheDocument();
  });
});
```

## Mocking Dependencies

### Mocking Form Components

For complex form components like date pickers that are difficult to test:

```tsx
// Mock the DatePicker component
vi.mock("@/web/components/date-picker", () => ({
  DatePicker: ({ onChange, placeholder }: { onChange: (date: Date | undefined) => void; placeholder?: string }) => (
    <div data-testid="date-picker-mock">
      <input
        type="text"
        data-testid="date-picker-input"
        id="date"
        aria-label="Expiration Date" // Add aria-label to associate with label
        placeholder={placeholder || "Select date"}
        onChange={() => {}} // Not used in our test, but needed for the input
        onClick={() => onChange(new Date("2025-01-01T00:00:00.000Z"))}
      />
      <button
        type="button"
        data-testid="date-picker"
        onClick={() => onChange(new Date("2025-01-01T00:00:00.000Z"))}
      >
        Select Date
      </button>
    </div>
  ),
}));
```

## Best Practices

1. **Use `userEvent` over `fireEvent`**: `userEvent` provides a more realistic simulation of user interactions.

2. **Test loading states**: Always test the loading state during form submission.

3. **Reset mocks between tests**: Use `beforeEach(() => { vi.resetAllMocks(); })` to ensure clean mocks.

4. **Test validation errors**: Ensure validation rules work and error messages display correctly.

5. **Test all form modes**: If your form has different modes (create/update), test both.

6. **Test conditional UI elements**: Test that components appear/disappear based on props or state.

7. **Use appropriate assertions**:
   - Use `toBeInTheDocument()` to check if an element exists
   - Use `toHaveValue()` to check input values
   - Use `not.toBeInTheDocument()` to verify an element doesn't exist

8. **Wait for async operations**: Use `waitFor()` or `findBy*` queries for async state changes.

9. **Test error handling**: Test how the form handles submission errors.

10. **Test accessibility**: Ensure forms are accessible by using role-based queries when possible.

11. **Mock complex components carefully**: When mocking complex UI components like DatePicker:
    - Include proper aria attributes (aria-label) to ensure accessibility
    - Add data-testid attributes for reliable testing
    - Implement minimum required functionality to simulate the real component's behavior

12. **Use text content as fallback**: For components that might not have proper label associations, use text content queries as a fallback:
    ```tsx
    // Instead of this, which might fail if label association isn't perfect:
    expect(screen.getByLabelText(/Expiration Date/i)).toBeInTheDocument();
    
    // Use this more resilient approach:
    expect(screen.getByText(/Expiration Date/i)).toBeInTheDocument();
    expect(screen.getByTestId("date-picker-mock")).toBeInTheDocument();
    ```

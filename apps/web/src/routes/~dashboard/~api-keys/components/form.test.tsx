import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ApiKeyForm from "@/web/routes/~dashboard/~api-keys/components/form";

// Mock the DatePicker component since it's challenging to test date pickers
vi.mock("@/web/components/date-picker", () => ({
  DatePicker: ({ onChange, placeholder }: { onChange: (date: Date | undefined) => void; placeholder?: string }) => (
    <div data-testid="date-picker-mock">
      <input
        type="text"
        data-testid="date-picker-input"
        id="date"
        aria-label="Expiration Date" // Add this to associate with the label
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

describe("api key form", () => {
  const user = userEvent.setup();
  const mockOnSubmit = vi.fn().mockResolvedValue({});
  const mockOnCancel = vi.fn();

  // Sample API key data for testing
  const sampleApiKey = {
    name: "Existing API Key",
    description: "An existing API key",
    expiresAt: "2025-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("rendering", () => {
    it("renders form fields correctly", () => {
      render(<ApiKeyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();

      // Check for the expiration date field using text content instead of label association
      expect(screen.getByText(/Expiration Date/i)).toBeInTheDocument();
      expect(screen.getByTestId("date-picker-mock")).toBeInTheDocument();
      expect(screen.getByTestId("date-picker")).toBeInTheDocument();

      expect(screen.getByRole("button", { name: /Create API Key/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    });

    it("renders with default values when provided", () => {
      render(<ApiKeyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} defaultValues={sampleApiKey} />);

      expect(screen.getByLabelText(/Name/i)).toHaveValue("Existing API Key");
      expect(screen.getByLabelText(/Description/i)).toHaveValue("An existing API key");
      // Button should be disabled initially because form is not dirty
      expect(screen.getByRole("button", { name: /Create API Key/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Create API Key/i })).toBeDisabled();
    });
  });

  describe("form submission", () => {
    it("calls onSubmit with form data", async () => {
      render(<ApiKeyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Fill out the form
      await user.type(screen.getByLabelText(/Name/i), "Test API Key");
      await user.type(screen.getByLabelText(/Description/i), "This is a test API key");

      // Set the expiration date using our mocked DatePicker
      await user.click(screen.getByTestId("date-picker"));

      // Submit the form
      await user.click(screen.getByRole("button", { name: /Create API Key/i }));

      // Check that onSubmit was called with the expected data
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: "Test API Key",
          description: "This is a test API key",
          expiresAt: "2025-01-01T00:00:00.000Z",
        });
      });
    });

    it("shows loading state during submission", async () => {
      // Create a promise that we can resolve manually to control when submission completes
      let resolveSubmission: (value: unknown) => void;
      const submissionPromise = new Promise((resolve) => {
        resolveSubmission = resolve;
      });

      const controlledMockSubmit = vi.fn().mockImplementation(() => submissionPromise);

      render(<ApiKeyForm onSubmit={controlledMockSubmit} onCancel={mockOnCancel} />);

      // Fill out the form - we need to ensure the form is dirty to enable the submit button
      await user.type(screen.getByLabelText(/Name/i), "Test API Key");
      await user.click(screen.getByTestId("date-picker")); // Set the date
      await user.click(screen.getByRole("button", { name: /Create API Key/i }));

      // Button should show loading state
      expect(screen.getByRole("button", { name: /Saving/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Saving/i })).toBeDisabled();

      // Resolve the submission
      resolveSubmission!({});

      // Wait for the button to return to normal state
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Create API Key/i })).toBeInTheDocument();
      });
    });

    it("submits updated data", async () => {
      render(<ApiKeyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} defaultValues={sampleApiKey} />);

      // Clear and update a field
      const nameInput = screen.getByLabelText(/Name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Updated API Key Name");

      // Button should become enabled once the form is dirty
      expect(screen.getByRole("button", { name: /Create API Key/i })).not.toBeDisabled();

      // Submit the form
      await user.click(screen.getByRole("button", { name: /Create API Key/i }));

      // Check that onSubmit was called with updated data
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: "Updated API Key Name",
        description: "An existing API key",
        expiresAt: "2025-01-01T00:00:00.000Z",
      });
    });
  });

  describe("user interactions", () => {
    it("calls onCancel when cancel button is clicked", async () => {
      render(<ApiKeyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await user.click(screen.getByRole("button", { name: /Cancel/i }));

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it("disables submit button when form is pristine", () => {
      render(<ApiKeyForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} defaultValues={sampleApiKey} />);

      expect(screen.getByRole("button", { name: /Create API Key/i })).toBeDisabled();
    });
  });
});

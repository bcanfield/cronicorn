import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ApiKeyForm from "@/web/routes/~dashboard/~api-keys/components/form";

// Mock necessary dependencies
// vi.mock("@workspace/ui/components/date-picker", () => ({
//   Calendar: ({ onSelect }) => (
//     <button
//       data-testid="date-picker"
//       onClick={() => setDate(new Date("2025-01-01"))}
//     >
//       Select Date
//     </button>
//   ),
// }));

describe("apiKeyForm", () => {
  it("renders the form with empty values", () => {
    const onSubmit = vi.fn();

    render(<ApiKeyForm onSubmit={onSubmit} />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByText(/select date/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter a scope/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create api key/i })).toBeInTheDocument();
  });

  it("submits the form with valid data", async () => {
    const onSubmit = vi.fn().mockResolvedValue({});

    render(<ApiKeyForm onSubmit={onSubmit} />);

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Test API Key" },
    });

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "This is a test API key" },
    });

    // Set expiration date
    fireEvent.click(screen.getByTestId("date-picker"));

    // Add a scope
    fireEvent.change(screen.getByPlaceholderText(/enter a scope/i), {
      target: { value: "read:data" },
    });

    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /create api key/i }));

    // Wait for the form submission to complete
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Test API Key",
        description: "This is a test API key",
        expiresAt: expect.any(Date),
        scopes: ["read:data"],
      });
    });
  });

  it("renders with default values when provided", () => {
    const onSubmit = vi.fn();
    const defaultValues = {
      id: "1",
      name: "Existing API Key",
      description: "An existing API key",
      expiresAt: "2025-01-01T00:00:00Z",
      scopes: ["read:data", "write:data"],
      key: "api-key",
      secret: "secret",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      userId: "user-1",
      lastUsedAt: null,
      revoked: false,
    };

    render(<ApiKeyForm onSubmit={onSubmit} defaultValues={defaultValues} />);

    expect(screen.getByLabelText(/name/i)).toHaveValue("Existing API Key");
    expect(screen.getByLabelText(/description/i)).toHaveValue("An existing API key");
    expect(screen.getByText("read:data")).toBeInTheDocument();
    expect(screen.getByText("write:data")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update api key/i })).toBeInTheDocument();
  });
});

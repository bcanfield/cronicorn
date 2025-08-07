import type { selectEndpointsSchema } from "@tasks-app/api/schema";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EndpointForm from "@/web/routes/~dashboard/~jobs/~$jobId/~endpoints/components/form";
import { renderWithQueryClient } from "@/web/test/test-utils";

describe("endpoint form", () => {
  const user = userEvent.setup();
  const mockOnSubmit = vi.fn().mockResolvedValue({});
  const mockOnCancel = vi.fn();
  const mockOnDelete = vi.fn();
  const mockJobId = "job-123";

  const sampleEndpoint: selectEndpointsSchema = {
    id: "endpoint-123",
    name: "Test Endpoint",
    url: "https://api.example.com/webhook",
    method: "POST",
    bearerToken: "test-token",
    requestSchema: { test: "value" },
    jobId: mockJobId,
    timeoutMs: 5000,
    fireAndForget: false,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("rendering", () => {
    it("renders all form fields in create mode", () => {
      renderWithQueryClient(
        <EndpointForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          jobId={mockJobId}
          mode="create"
        />,
      );

      // Check all form fields are present
      expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/URL/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/HTTP Method/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Bearer Token/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Request Schema/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Timeout/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Fire and Forget/i)).toBeInTheDocument();

      // Check buttons
      expect(screen.getByRole("button", { name: /Create Endpoint/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Delete Endpoint/i })).not.toBeInTheDocument();
    });

    it("renders with default values in update mode", () => {
      renderWithQueryClient(
        <EndpointForm
          defaultValues={sampleEndpoint}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onDelete={mockOnDelete}
          jobId={mockJobId}
          mode="update"
        />,
      );

      // Check form values match the default values
      expect(screen.getByLabelText(/Name/i)).toHaveValue(sampleEndpoint.name);
      expect(screen.getByLabelText(/URL/i)).toHaveValue(sampleEndpoint.url);
      expect(screen.getByLabelText(/Bearer Token/i)).toHaveValue(sampleEndpoint.bearerToken);
      expect(screen.getByLabelText(/Request Schema/i)).toHaveValue(JSON.stringify(sampleEndpoint.requestSchema, null, 2));
      expect(screen.getByLabelText(/Timeout/i)).toHaveValue(sampleEndpoint.timeoutMs);

      // Check update mode buttons
      expect(screen.getByRole("button", { name: /Update Endpoint/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Delete Endpoint/i })).toBeInTheDocument();
    });

    it("shows delete button only in update mode", () => {
      renderWithQueryClient(
        <EndpointForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onDelete={mockOnDelete}
          jobId={mockJobId}
          mode="create"
        />,
      );

      // Delete button should not be present in create mode
      expect(screen.queryByRole("button", { name: /Delete Endpoint/i })).not.toBeInTheDocument();
    });
  });

  describe("form submission", () => {
    it("validates required fields and shows error messages", async () => {
      renderWithQueryClient(
        <EndpointForm
          mode="create"
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          jobId={mockJobId}
        />,
      );

      // Try to submit without filling required fields
      await user.click(screen.getByRole("button", { name: /Create Endpoint/i }));

      // Check for validation errors
      expect(await screen.findByText(/Required/i)).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("calls onSubmit with form data in create mode", async () => {
      renderWithQueryClient(
        <EndpointForm
          mode="create"
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          jobId={mockJobId}
        />,
      );

      // Fill in the required fields
      await user.type(screen.getByLabelText(/Name/i), "New Endpoint");
      await user.type(screen.getByLabelText(/URL/i), "https://api.example.com/test");

      // Submit the form
      await user.click(screen.getByRole("button", { name: /Create Endpoint/i }));

      // Check if onSubmit was called with the right data
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: "New Endpoint",
        url: "https://api.example.com/test",
        jobId: mockJobId,
        method: undefined,
        bearerToken: undefined,
        requestSchema: undefined,
        timeoutMs: undefined,
        fireAndForget: undefined,
      });
    });

    it("calls onSubmit with form data in update mode", async () => {
      renderWithQueryClient(
        <EndpointForm
          mode="update"
          defaultValues={sampleEndpoint}
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          jobId={mockJobId}
        />,
      );

      // Edit some fields
      const nameInput = screen.getByLabelText(/Name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Endpoint");

      // Submit the form
      await user.click(screen.getByRole("button", { name: /Update Endpoint/i }));

      // Check if onSubmit was called with the updated data
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: "Updated Endpoint",
        jobId: mockJobId,
      }));
    });

    it("shows loading state during submission", async () => {
      // Create a promise that we can resolve manually to control when submission completes
      let resolveSubmission: (value: unknown) => void;
      const submissionPromise = new Promise((resolve) => {
        resolveSubmission = resolve;
      });

      const controlledMockSubmit = vi.fn().mockImplementation(() => submissionPromise);

      renderWithQueryClient(
        <EndpointForm
          mode="create"
          onCancel={mockOnCancel}
          onSubmit={controlledMockSubmit}
          jobId={mockJobId}
        />,
      );

      // Fill required fields to make form valid
      await user.type(screen.getByLabelText(/Name/i), "Test Endpoint");
      await user.type(screen.getByLabelText(/URL/i), "https://api.example.com/test");

      // Submit form
      await user.click(screen.getByRole("button", { name: /Create Endpoint/i }));

      // Button should show loading state
      expect(screen.getByRole("button", { name: /Saving/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Saving/i })).toBeDisabled();

      // Resolve the submission
      resolveSubmission!({});

      // Wait for the button to return to normal state
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Create Endpoint/i })).toBeInTheDocument();
      });
    });
  });

  describe("user interactions", () => {
    it("calls onCancel when cancel button is clicked", async () => {
      renderWithQueryClient(
        <EndpointForm
          mode="create"
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          jobId={mockJobId}
        />,
      );

      await user.click(screen.getByRole("button", { name: /Cancel/i }));

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it("calls onDelete when delete button is clicked", async () => {
      renderWithQueryClient(
        <EndpointForm
          mode="update"
          defaultValues={sampleEndpoint}
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
          jobId={mockJobId}
        />,
      );

      await user.click(screen.getByRole("button", { name: /Delete Endpoint/i }));

      expect(mockOnDelete).toHaveBeenCalled();
    });

    it("disables submit button when form is pristine in update mode", () => {
      renderWithQueryClient(
        <EndpointForm
          defaultValues={sampleEndpoint}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onDelete={mockOnDelete}
          jobId={mockJobId}
          mode="update"
        />,
      );

      // Submit button should be disabled when form hasn't been modified
      expect(screen.getByRole("button", { name: /Update Endpoint/i })).toBeDisabled();
    });

    it("enables submit button when form becomes dirty", async () => {
      renderWithQueryClient(
        <EndpointForm
          defaultValues={sampleEndpoint}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          onDelete={mockOnDelete}
          jobId={mockJobId}
          mode="update"
        />,
      );

      // Button starts disabled
      expect(screen.getByRole("button", { name: /Update Endpoint/i })).toBeDisabled();

      // Edit a field to make the form dirty
      const nameInput = screen.getByLabelText(/Name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Changed Name");

      // Button should now be enabled
      expect(screen.getByRole("button", { name: /Update Endpoint/i })).not.toBeDisabled();
    });

    it("handles changing HTTP method via select", async () => {
      renderWithQueryClient(
        <EndpointForm
          mode="create"
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          jobId={mockJobId}
        />,
      );

      // Open the select dropdown
      await user.click(screen.getByRole("combobox"));

      // Select the POST method
      await user.click(screen.getByRole("option", { name: /POST/i }));

      // Fill other required fields
      await user.type(screen.getByLabelText(/Name/i), "Test Endpoint");
      await user.type(screen.getByLabelText(/URL/i), "https://api.example.com/test");

      // Submit form
      await user.click(screen.getByRole("button", { name: /Create Endpoint/i }));

      // Check if the method was set to POST
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        method: "POST",
      }));
    });

    it("handles checkbox for Fire and Forget", async () => {
      renderWithQueryClient(
        <EndpointForm
          mode="create"
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          jobId={mockJobId}
        />,
      );

      // Fill required fields
      await user.type(screen.getByLabelText(/Name/i), "Test Endpoint");
      await user.type(screen.getByLabelText(/URL/i), "https://api.example.com/test");

      // Check the Fire and Forget checkbox
      await user.click(screen.getByRole("checkbox"));

      // Submit form
      await user.click(screen.getByRole("button", { name: /Create Endpoint/i }));

      // Check if fireAndForget was set to true
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        fireAndForget: true,
      }));
    });
  });
});

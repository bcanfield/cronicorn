import type { selectJobsSchema } from "@tasks-app/api/schema";

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import JobForm from "@/web/routes/~dashboard/~jobs/components/form";
import { renderWithQueryClient } from "@/web/test/test-utils";

describe("job form", () => {
  const user = userEvent.setup();
  const mockOnCancel = vi.fn();
  const mockOnSubmit = vi.fn().mockResolvedValue({});
  const mockOnDelete = vi.fn();

  // Sample job data for testing with required props
  // We only use definitionNL in our form, but the type expects all properties
  const sampleJob: selectJobsSchema = {
    definitionNL: "Test job description",
    // Add required properties to satisfy the type
    status: "ACTIVE",
    id: "test-id",
    nextRunAt: null,
    locked: false,
    userId: null,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    reasoningTokens: 0,
    cachedInputTokens: 0,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("rendering", () => {
    it("renders form fields correctly in create mode", () => {
      renderWithQueryClient(
        <JobForm
          mode="create"
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
        />,
      );

      expect(screen.getByLabelText(/Prompt/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter job prompt/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Create Job/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Delete Job/i })).not.toBeInTheDocument();
    });

    it("renders update mode with initial data correctly", () => {
      renderWithQueryClient(
        <JobForm
          mode="update"
          defaultValues={sampleJob}
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
        />,
      );

      const textareaElement = screen.getByLabelText(/Prompt/i);
      expect(textareaElement).toHaveValue(sampleJob.definitionNL);
      expect(screen.getByRole("button", { name: /Update Job/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Delete Job/i })).toBeInTheDocument();
    });

    it("does not show delete button when onDelete is not provided", () => {
      renderWithQueryClient(
        <JobForm
          mode="update"
          defaultValues={sampleJob}
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          // onDelete not provided
        />,
      );

      expect(screen.queryByRole("button", { name: /Delete Job/i })).not.toBeInTheDocument();
    });
  });

  describe("form submission", () => {
    it("validates minimum length and shows error messages", async () => {
      renderWithQueryClient(
        <JobForm
          mode="create"
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
        />,
      );

      // Type text shorter than the minimum length (5 characters)
      await user.type(screen.getByLabelText(/Prompt/i), "test");
      // Now the form is dirty but still invalid
      await user.click(screen.getByRole("button", { name: /Create Job/i }));

      // Check for validation error - looking for a message about minimum length
      expect(await screen.findByText(/must contain at least 5 character/i)).toBeInTheDocument();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("calls onSubmit with form data in create mode", async () => {
      renderWithQueryClient(
        <JobForm
          mode="create"
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
        />,
      );

      await user.type(screen.getByLabelText(/Prompt/i), "New test job");
      await user.click(screen.getByRole("button", { name: /Create Job/i }));

      expect(mockOnSubmit).toHaveBeenCalledWith({ definitionNL: "New test job" });
    });

    it("calls onSubmit with form data in update mode", async () => {
      renderWithQueryClient(
        <JobForm
          mode="update"
          defaultValues={sampleJob}
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
        />,
      );

      const textarea = screen.getByLabelText(/Prompt/i);
      await user.clear(textarea);
      await user.type(textarea, "Updated job description");
      await user.click(screen.getByRole("button", { name: /Update Job/i }));

      expect(mockOnSubmit).toHaveBeenCalledWith({
        definitionNL: "Updated job description",
        status: "ACTIVE",
        nextRunAt: null,
        locked: false,
        userId: null,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        reasoningTokens: 0,
        cachedInputTokens: 0,
      });
    });

    it("shows loading state during form submission", async () => {
      // Create a promise that we can resolve manually to control when the submission completes
      let resolveSubmission: (value: unknown) => void;
      const submissionPromise = new Promise((resolve) => {
        resolveSubmission = resolve;
      });

      const controlledMockSubmit = vi.fn().mockImplementation(() => submissionPromise);

      renderWithQueryClient(
        <JobForm
          mode="create"
          onCancel={mockOnCancel}
          onSubmit={controlledMockSubmit}
        />,
      );

      await user.type(screen.getByLabelText(/Prompt/i), "Test job");
      await user.click(screen.getByRole("button", { name: /Create Job/i }));

      // Button should show loading state
      expect(screen.getByRole("button", { name: /Saving/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Saving/i })).toBeDisabled();

      // Resolve the submission
      resolveSubmission!({});

      // Wait for the button to return to normal state
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Create Job/i })).toBeInTheDocument();
      });
    });
  });

  describe("user interactions", () => {
    it("calls onCancel when cancel button is clicked", async () => {
      renderWithQueryClient(
        <JobForm
          mode="create"
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
        />,
      );

      await user.click(screen.getByRole("button", { name: /Cancel/i }));

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it("calls onDelete when delete button is clicked", async () => {
      renderWithQueryClient(
        <JobForm
          mode="update"
          defaultValues={sampleJob}
          onCancel={mockOnCancel}
          onSubmit={mockOnSubmit}
          onDelete={mockOnDelete}
        />,
      );

      await user.click(screen.getByRole("button", { name: /Delete Job/i }));

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });
  });
});

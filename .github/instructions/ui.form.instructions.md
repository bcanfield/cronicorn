---
applyTo: '**/form.tsx'
description: Outlines the architecture and patterns for creating consistent, maintainable, and testable form components in our project. Follow these guidelines to ensure that new forms adhere to our established separation of concerns pattern.
---

> **IMPORTANT:** If you detect any new patterns, best practices, or inconsistencies between this document and the actual implementation in the codebase, please update these instructions to reflect the current best practices. Keep this documentation aligned with the actual code patterns used in the project.

## Core Architecture Principles

Our form architecture follows these core principles:

1. **Separation of Concerns**: Forms handle UI, validation, and local state. Parent components handle data fetching, mutations, and routing.
2. **Prop-Based Communication**: Data and handlers are passed via props, not through global state.
3. **Schema-Driven Validation**: Forms use Zod schemas for validation, ensuring type safety.
4. **Consistent UI Patterns**: Forms use our shared UI components and maintain consistent layout.
5. **Testability**: Forms are designed to be easily unit tested in isolation.

## Form Component Structure

Every form component should follow this structure:

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { someEntitySchema } from "@tasks-app/api/schema";
import { useForm } from "react-hook-form";

import { Button, Form, FormField /* ... other UI components */ } from "@workspace/ui/components";

type FormProps = {
  defaultValues?: SomeType;
  onSubmit: (data: SomeType) => Promise<void>;
  isLoading?: boolean;
  // Other props as needed (onCancel, onDelete, etc.)
};

export default function EntityForm({ defaultValues, onSubmit, isLoading /* ... */ }: FormProps) {
  const form = useForm({
    resolver: zodResolver(someEntitySchema),
    defaultValues,
  });
  
  // Local handlers
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* Form fields */}
        
        {/* Form actions */}
      </form>
    </Form>
  );
}
```

## Props Pattern

Every form component should accept these core props:

| Prop | Type | Description |
|------|------|-------------|
| `defaultValues` | `SchemaType` | Optional initial values for form fields |
| `onSubmit` | `(data: SchemaType) => Promise<void>` | Handler called when form is valid and submitted |
| `isLoading` | `boolean` | Optional flag to disable inputs during submission |

Additional props based on form purpose:

| Prop | Type | Description |
|------|------|-------------|
| `mode` | `"create" \| "update"` | Determines form behavior and button text |
| `onCancel` | `() => void` | Handler for cancel button |
| `onDelete` | `() => void` | Optional handler for delete button |

## Form State Management

Forms should use React Hook Form with Zod for validation:

```tsx
const form = useForm<SchemaType>({
  resolver: zodResolver(schemaType),
  defaultValues,
});
```

For form loading state, the recommended pattern is to manage it internally:

```tsx
// Internally managed loading state (preferred pattern)
const [isLoading, setIsLoading] = useState(false);

const handleFormSubmit = async (data) => {
  setIsLoading(true);
  try {
    form.reset(data); // Reset form to prevent additional submissions
    await onSubmit(data);
  } finally {
    setIsLoading(false);
  }
};
```

This approach gives the form component control over its UI state during submission and prevents issues with multiple submissions. The form's reset is called with the submitted data to mark the form as pristine after submission.

## Parent-Child Relationship

The parent component is responsible for:

1. **Data fetching** - Using React Query or other data fetching libraries
2. **Mutation handling** - Creating, updating, or deleting data
3. **Navigation** - Redirecting after successful submission
4. **Error handling** - Global error handling for API calls

The form component is responsible for:

1. **UI rendering** - Displaying form fields and buttons
2. **Validation** - Field-level validation and error messages
3. **Local state** - Managing form state during user interaction
4. **Submission preparation** - Preparing data for the parent's submit handler

## Form Submission Pattern

Always follow this pattern for form submission:

```tsx
// In the form component
const [isLoading, setIsLoading] = useState(false);

const handleFormSubmit = async (values: SchemaType) => {
  setIsLoading(true);
  try {
    form.reset(values); // Reset with submitted values to mark as pristine
    await onSubmit(values);
  } catch (error) {
    // Only handle form-specific errors here
    // Let parent component handle global errors
  } finally {
    setIsLoading(false);
  }
};

// In the parent component
async function handleParentSubmit(data: SchemaType) {
  try {
    await mutateAsync(data);
    // Handle success (notifications, navigation)
  } catch (error) {
    // Handle API errors
  }
}

return <EntityForm onSubmit={handleParentSubmit} />;
```

This pattern ensures:
1. The form controls its own loading state
2. The form is marked as pristine after submission (preventing multiple submissions)
3. The loading state is always properly reset, even if an error occurs

## Validation

All forms should use Zod schemas for validation:

1. **Import schema** from the API package to ensure type consistency
2. **Use zodResolver** to integrate with React Hook Form
3. **Display validation messages** using FormMessage component

```tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { entitySchema } from "@tasks-app/api/schema";

const form = useForm<EntityType>({
  resolver: zodResolver(entitySchema),
  defaultValues,
});
```

## Loading & Error States

Forms should handle loading and error states gracefully:

```tsx
// Disable all inputs and buttons during submission
<Input {...field} disabled={isLoading} />
<Button type="submit" disabled={isLoading || !form.formState.isDirty}>
  {isLoading ? "Saving..." : "Submit"}
</Button>

// Show appropriate button text based on context
{isLoading 
  ? "Saving..." 
  : mode === "update" 
    ? "Update Entity" 
    : "Create Entity"}
```

## Complete Example

Below is a complete example of a form component following our patterns:

```tsx
import type { SomeEntitySchema } from "@tasks-app/api/schema";

import { zodResolver } from "@hookform/resolvers/zod";
import { insertEntitySchema } from "@tasks-app/api/schema";
import { Save, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@workspace/ui/components/button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel,
  FormDescription, 
  FormMessage 
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Separator } from "@workspace/ui/components/separator";

type EntityFormProps = {
  defaultValues?: SomeEntitySchema;
  onSubmit: (data: SomeEntitySchema) => Promise<void>;
  onCancel: () => void;
  mode: "create" | "update";
  onDelete?: () => void;
};

export default function EntityForm({ 
  defaultValues, 
  onSubmit, 
  onCancel,
  mode,
  onDelete
}: EntityFormProps) {
  const form = useForm<SomeEntitySchema>({
    resolver: zodResolver(insertEntitySchema),
    defaultValues,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (data: SomeEntitySchema) => {
    setIsLoading(true);
    try {
      form.reset(data);
      await onSubmit(data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter name" {...field} disabled={isLoading} />
              </FormControl>
              <FormDescription>A descriptive name for your entity</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Additional form fields */}
        
        <Separator />
        
        <div className="flex items-center justify-between space-x-2">
          {onDelete && (
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={isLoading}
            >
              <X className="size-4" />
              Delete Entity
            </Button>
          )}
          <div className="flex items-center gap-2 flex-auto justify-end">
            <Button variant="outline" disabled={isLoading} onClick={onCancel}>
              <X className="size-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !form.formState.isDirty}>
              <Save className="size-4" />
              {isLoading ? "Saving..." : mode === "update" ? "Update Entity" : "Create Entity"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
```

## Using Forms in Parent Components

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import EntityForm from "./components/form";
import { createEntity } from "@/web/lib/queries/entity.queries";

export default function CreateEntityPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const { mutateAsync, isPending } = useMutation({
    mutationFn: createEntity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
      toast.success("Entity created successfully");
      router.push("/entities");
    },
    onError: () => {
      toast.error("Failed to create entity");
    }
  });
  
  return (
    <div>
      <h1>Create Entity</h1>
      <EntityForm 
        onSubmit={mutateAsync} 
        isLoading={isPending} 
        mode="create"
        onCancel={() => router.push("/entities")}
      />
    </div>
  );
}
```

By following these patterns, you'll create forms that are consistent, maintainable, and easily testable throughout the application.

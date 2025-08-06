---
applyTo: "apps/web/**"
description: Outlines the web application file structure, patterns, and best practices for creating consistent, maintainable components and routes.
---

# Web Application Architecture

This document outlines the architecture, file structure, and patterns for our React-based web application. Follow these guidelines to ensure consistency across the codebase.

> **IMPORTANT:** If you detect any new patterns, best practices, or inconsistencies between this document and the actual implementation in the codebase, please update these instructions to reflect the current best practices.

## Directory Structure

Our web application follows a feature-based organization using TanStack Router:

```
apps/web/
├── src/
│   ├── components/            # Shared components used across features
│   ├── features/              # Feature-specific, cross-cutting functionality
│   ├── lib/                   # Shared utilities, hooks, and services
│   │   ├── queries/           # API interaction functions and React Query hooks
│   │   └── state/             # Global state management
│   └── routes/                # Route-based components (TanStack Router)
│       └── ~dashboard/        # Dashboard routes
│           ├── ~<entity>/     # Entity routes (e.g., jobs, api-keys)
│           │   ├── ~index.tsx            # List view
│           │   ├── ~create.tsx           # Create view
│           │   ├── ~$<entityId>.tsx      # Detail/edit view
│           │   └── components/           # Entity-specific components
│           │       ├── form.tsx          # Form component
│           │       ├── form.test.tsx     # Form tests
│           │       ├── list.tsx          # List component
│           │       └── <entity>.tsx      # Entity component
```

## Route Components

### Entity List Route (~index.tsx)

Responsibilities:
- Fetching and displaying list of entities
- Pagination and sorting
- Navigation to create/edit
- Optional bulk actions

```tsx
export const Route = createFileRoute("/dashboard/<entity>/")({
  component: RouteComponent,
  validateSearch: listEntitySchema,
  pendingComponent: RoutePending,
  loaderDeps: ({ search }) => listEntitySchema.parse(search),
  loader: ({ deps }) => queryClient.ensureQueryData(entityQueryOptions(deps)),
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: { items, hasNext } } = useSuspenseQuery(entityQueryOptions(params));

  // Handle operations (e.g., delete)
  const handleDelete = async (id: string) => {
    // Implementation
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <PageHeader title="Entities" description="Manage your entities" />
        <Link to="/dashboard/entity/create" className={buttonVariants()}>
          <PlusCircle className="size-4" />
          Create Entity
        </Link>
      </div>
      <SortingContainer
        hasNext={hasNext}
        onChange={setParams}
        params={params}
        sortKeys={ENTITY_SORT_KEYS}
      >
        <EntityList entities={items} onDelete={handleDelete} />
      </SortingContainer>
    </>
  );
}
```

### Entity Create Route (~create.tsx)

Responsibilities:
- Rendering form for entity creation
- Handling form submission
- Navigation after successful creation

```tsx
export const Route = createFileRoute("/dashboard/<entity>/create")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { mutateAsync } = useMutation({
    mutationFn: createEntity,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.LIST_ENTITIES() });
      navigate({ to: "/dashboard/entity/$entityId", params: { entityId: data.id } });
    },
  });

  const handleCancel = () => navigate({ to: "/dashboard/entity" });

  return (
    <>
      <PageHeader title="Create Entity" description="Configure a new entity" />
      <EntityForm 
        onSubmit={mutateAsync} 
        onCancel={handleCancel} 
        mode="create" 
      />
    </>
  );
}
```

### Entity Detail/Edit Route (~$entityId.tsx)

Responsibilities:
- Fetching specific entity data
- Rendering form for editing
- Handling updates and deletion
- Navigation after operations

```tsx
export const Route = createFileRoute("/dashboard/<entity>/$entityId")({
  loader: ({ params }) => queryClient.ensureQueryData(createEntityQueryOptions(params.entityId)),
  component: RouteComponent,
  pendingComponent: RoutePending,
});

function RouteComponent() {
  const { entityId } = Route.useParams();
  const { data } = useSuspenseQuery(createEntityQueryOptions(entityId));
  const navigate = useNavigate();
  
  // Update and delete mutations
  const updateMutation = useMutation({
    mutationFn: updateEntity,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: [queryKeys.LIST_ENTITIES(), queryKeys.LIST_ENTITY(data.id)] 
      });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: () => deleteEntity(entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.LIST_ENTITIES() });
      navigate({ to: "/dashboard/entity" });
    },
  });

  const handleCancel = () => navigate({ to: "/dashboard/entity" });
  const handleSubmit = async (data: insertEntitySchema) => {
    await updateMutation.mutateAsync({ id: entityId, entity: data });
  };
  const handleDelete = async () => {
    // Confirmation dialog and deletion logic
  };

  return (
    <>
      <PageHeader title="Update Entity" description="Modify the entity configuration" />
      <EntityForm 
        onSubmit={handleSubmit} 
        defaultValues={data} 
        onCancel={handleCancel} 
        mode="update" 
        onDelete={handleDelete} 
      />
    </>
  );
}
```

## Components

### Form Components

Form components should follow the patterns outlined in `ui.form.instructions.md`. Key responsibilities include:

- Form rendering with React Hook Form
- Field validation with Zod schemas
- Internal loading state management
- Standardized layout and button text

### Standard Updateable Entity Form

For entities that support both creation and updates:

```tsx
type EntityFormProps = {
  defaultValues?: EntitySchema;
  onSubmit: (data: EntitySchema) => Promise<void>;
  onCancel: () => void;
  mode: "create" | "update";
  onDelete?: () => void;
};

### Create-Only Entity Form

For entities that can only be created (like API keys):

```tsx
type ApiKeyFormProps = {
  defaultValues?: ApiKeySchema;
  onSubmit: (data: ApiKeySchema) => Promise<void>;
  onCancel: () => void;
};

export default function EntityForm({ 
  defaultValues, 
  onSubmit, 
  onCancel, 
  mode, 
  onDelete 
}: EntityFormProps) {
  const form = useForm<EntitySchema>({
    resolver: zodResolver(entitySchema),
    defaultValues,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (data: EntitySchema) => {
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
        {/* Form fields */}
        <Separator />
        <div className="flex items-center justify-between space-x-2">
          {onDelete && (
            <Button variant="destructive" onClick={onDelete} disabled={isLoading}>
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

### List Components

List components should:
- Accept an array of entities
- Map over entities to render individual components
- Pass action callbacks to child components

```tsx
export default function EntityList({ 
  entities, 
  onDelete 
}: { 
  entities: EntitySchema[]; 
  onDelete: (id: string) => void 
}) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {entities.map(entity => (
        <Entity entity={entity} key={entity.id} onDelete={onDelete} />
      ))}
    </div>
  );
}
```

### Entity Components

Entity components should:
- Render a single entity
- Include actions relevant to the entity
- Use consistent card or list item styling

```tsx
export default function Entity({ 
  entity, 
  onDelete 
}: { 
  entity: EntitySchema; 
  onDelete: (id: string) => void 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{entity.name}</CardTitle>
        <CardDescription>{entity.description}</CardDescription>
      </CardHeader>
      <CardContent>{/* Entity details */}</CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" asChild>
          <Link to={`/dashboard/entity/${entity.id}`}>Edit</Link>
        </Button>
        <Button variant="destructive" onClick={() => onDelete(entity.id)}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
```

## API Queries & Mutations

API interactions should be defined in `src/lib/queries` following this pattern:

```tsx
// In src/lib/queries/entity.queries.ts
export const queryKeys = {
  LIST_ENTITIES: () => ["list-entities"] as const,
  LIST_ENTITY: (id: string) => ({ queryKey: [`list-entity-${id}`] }),
};

export function entitiesQueryOptions(params: listEntitySchema) {
  const key = [...queryKeys.LIST_ENTITIES(), params] as const;
  return queryOptions({
    queryKey: key,
    queryFn: async ({ queryKey: [, q] }) => {
      const resp = await apiClient.api.entities.$get({ query: q });
      return resp.json();
    },
  });
}

export const createEntityQueryOptions = (id: string) =>
  queryOptions({
    ...queryKeys.LIST_ENTITY(id),
    queryFn: async () => {
      const response = await apiClient.api.entities[":id"].$get({ param: { id } });
      const json = await response.json();
      if ("message" in json) {
        throw new Error(json.message);
      }
      return json;
    },
  });

export const createEntity = async (entity: insertEntitySchema) => {
  const response = await apiClient.api.entities.$post({ json: entity });
  const json = await response.json();
  if ("success" in json && !json.success) {
    throw new Error(formatApiError(json));
  }
  return json;
};

export const updateEntity = async ({ id, entity }: { id: string; entity: patchEntitySchema }) => {
  const response = await apiClient.api.entities[":id"].$patch({ param: { id }, json: entity });
  if (response.status !== 200) {
    const json = await response.json();
    throw new Error(formatApiError(json));
  }
  const json = await response.json();
  return json;
};

export const deleteEntity = async (id: string) => {
  const response = await apiClient.api.entities[":id"].$delete({ param: { id } });
  if (response.status !== 204) {
    const json = await response.json();
    throw new Error(formatApiError(json));
  }
};
```

## Creating a New Entity

### Standard Entity with CRUD Operations

To add a new entity type that supports create, read, update, and delete operations:

1. **Create directory structure**:
   ```
   mkdir -p src/routes/~dashboard/~entity-name/components
   ```

2. **Create API query file**:
   ```
   touch src/lib/queries/entity-name.queries.ts
   ```
   
3. **Create required components**:
   ```
   touch src/routes/~dashboard/~entity-name/components/form.tsx
   touch src/routes/~dashboard/~entity-name/components/list.tsx
   touch src/routes/~dashboard/~entity-name/components/entity-name.tsx
   ```

4. **Create route files**:
   ```
   touch src/routes/~dashboard/~entity-name/~index.tsx
   touch src/routes/~dashboard/~entity-name/~create.tsx
   touch src/routes/~dashboard/~entity-name/~$entityId.tsx
   ```

### Create-Only Entity (like API keys)

For entities that only support creation and deletion (not updates):

1. **Create directory structure**:
   ```
   mkdir -p src/routes/~dashboard/~entity-name/components
   ```

2. **Create API query file**:
   ```
   touch src/lib/queries/entity-name.queries.ts
   ```
   
3. **Create required components**:
   ```
   touch src/routes/~dashboard/~entity-name/components/form.tsx  # Create-only form
   touch src/routes/~dashboard/~entity-name/components/list.tsx
   touch src/routes/~dashboard/~entity-name/components/entity-name.tsx  # Should include delete capability
   ```

4. **Create route files**:
   ```
   touch src/routes/~dashboard/~entity-name/~index.tsx  # List with delete capability
   touch src/routes/~dashboard/~entity-name/~create.tsx  # Create-only form
   ```
   Note: No detail/edit route needed for create-only entities

5. **Add test files**:
   ```
   touch src/routes/~dashboard/~entity-name/components/form.test.tsx
   ```

Follow the patterns described in this document and other instruction files to ensure consistent implementation.

## Best Practices

1. **Type Safety**:
   - Always use TypeScript types from the API schema
   - Create proper prop types for components

2. **Consistent Naming**:
   - Use consistent names for props across components
   - Follow naming patterns in API query files

3. **Error Handling**:
   - Handle API errors consistently
   - Provide user feedback through toasts or alerts

4. **Loading States**:
   - Use suspense boundaries for data loading
   - Manage form submission loading states internally

5. **Testing**:
   - Write tests for form components
   - Mock API calls and complex UI components

6. **Accessibility**:
   - Ensure forms have proper labels and descriptions
   - Use semantic HTML and ARIA attributes

7. **Styling**:
   - Use Tailwind utility classes consistently
   - Reference theme variables from UI package

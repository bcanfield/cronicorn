---
applyTo: "apps/api/src/db/**"
description: Comprehensive documentation for database schema, migrations, seeding, and data management patterns.
---

# Database Documentation

This document outlines the database architecture, schema organization, migration management, and data patterns for our application.

> **IMPORTANT:** If you detect any new patterns, best practices, or inconsistencies between this document and the actual implementation in the codebase, please update these instructions to reflect the current best practices.

## Database Architecture

### Technology Stack
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (production) / Turso SQLite (alternative)
- **Migration Tool**: Drizzle Kit
- **Query Builder**: Drizzle Query API
- **Schema Validation**: Drizzle-Zod integration

### Configuration
Database configuration is managed in `drizzle.config.ts`:

```typescript
export default defineConfig({
  schema: env.NODE_ENV === "production" ? "./src/db/schema.js" : "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql", 
  casing: "snake_case",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
```

## Schema Organization

### Directory Structure
```
src/db/
├── index.ts                 # Database connection and exports
├── schema.ts                # Main schema exports
├── schema/                  # Individual schema definitions
│   ├── common.ts           # Shared utilities and types
│   ├── auth.ts             # Authentication and user management
│   ├── jobs.ts             # Job scheduling and management
│   ├── api-keys.ts         # API key management
│   ├── messages.ts         # Message handling
│   ├── endpoints.ts        # Endpoint configuration
│   ├── context-entries.ts  # Context management
│   └── tasks.ts            # Task definitions
├── migrations/             # Drizzle migration files
│   ├── 0000_*.sql         # SQL migration files
│   ├── *.ts               # TypeScript migration files
│   └── meta/              # Migration metadata
├── seed/                   # Database seeding
│   ├── seed.ts            # Main seeding script
│   └── seed-data/         # Seed data files
├── reset.ts               # Database reset utility
└── run-seed.ts            # Seed execution script
```

### Schema Patterns

#### Table Definitions
All tables follow consistent patterns:

```typescript
// Standard table with UUID primary key
export const jobs = pgTable("Job", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  definitionNL: text("definitionNL").notNull(),
  nextRunAt: timestamp("nextRunAt", { mode: "string" }),
  status: jobStatusEnum("status").default("PAUSED").notNull(),
  locked: boolean("locked").default(false).notNull(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { mode: "string" }).defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "string" }).defaultNow(),
});
```

#### Enums
Use PostgreSQL enums for controlled vocabularies:

```typescript
export const jobStatusEnum = pgEnum("JobStatus", [
  "ACTIVE",
  "PAUSED", 
  "ARCHIVED",
]);
```

#### Relationships
- **Foreign Keys**: Use `references()` with cascade delete where appropriate
- **User Scoping**: Most entities reference `users.id` for multi-tenancy
- **Timestamps**: Include `createdAt` and `updatedAt` on most tables

#### Zod Schema Generation
Generate validation schemas for all tables:

```typescript
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Generated schemas for validation
export const insertJobsSchema = createInsertSchema(jobs);
export const selectJobsSchema = createSelectSchema(jobs);
export const patchJobsSchema = insertJobsSchema.partial();

// Custom validations and refinements
export const listJobsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(["createdAt", "updatedAt", "definitionNL"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  searchQuery: z.string().optional(),
});
```

## Core Entities

### Authentication (auth.ts)
- **Users**: Core user management with Auth.js integration
- **Accounts**: OAuth provider accounts
- **Sessions**: User sessions
- **Verification Tokens**: Email verification and password reset

### Jobs (jobs.ts)
- **Jobs**: Scheduled job definitions
- **Job Status**: ACTIVE, PAUSED, ARCHIVED
- **User Association**: Each job belongs to a user
- **Execution Tracking**: Next run time, lock status, token usage

### API Keys (api-keys.ts)
- **API Keys**: Programmatic access tokens
- **Salted Secrets**: Secure storage with salt
- **User Scoped**: Each key belongs to a user
- **Usage Tracking**: Creation and last used timestamps

### Messages (messages.ts)
- **Messages**: Communication records
- **Job Association**: Messages linked to jobs
- **Content Storage**: Message content and metadata

### Endpoints (endpoints.ts)
- **Endpoints**: External service configurations
- **Job Integration**: Endpoints used by jobs
- **Configuration**: URL, headers, authentication details

### Context Entries (context-entries.ts)
- **Context**: System context and configuration
- **Key-Value Storage**: Flexible configuration storage

### Tasks (tasks.ts)
- **Tasks**: Individual task definitions
- **Status Tracking**: Task execution status
- **Job Relationship**: Tasks belong to jobs

## Migration Management

### Creating Migrations
1. **Modify Schema**: Update schema files in `src/db/schema/`
2. **Generate Migration**: Run `pnpm db:generate`
3. **Review Migration**: Check generated SQL in `src/db/migrations/`
4. **Apply Migration**: Run `pnpm db:migrate` or `pnpm db:push`

### Migration Types
- **SQL Migrations**: Auto-generated `.sql` files for schema changes
- **TypeScript Migrations**: Custom `.ts` files for data transformations
- **Metadata**: Migration tracking in `meta/` directory

### Available Commands
```bash
# Generate new migration from schema changes
pnpm db:generate

# Apply pending migrations
pnpm db:migrate  

# Push schema directly (development only)
pnpm db:push

# Open Drizzle Studio for database exploration
pnpm db:studio

# Reset database (development only)
pnpm db:reset

# Seed database with sample data
pnpm db:seed
```

## Database Seeding

### Seed Structure
Database seeding is organized for both development and testing:

```typescript
// src/db/seed/seed.ts
export async function seed(db: Database) {
  console.log("🌱 Seeding database...");
  
  // Clear existing data
  await clearDatabase(db);
  
  // Seed in dependency order
  await seedUsers(db);
  await seedJobs(db);
  await seedApiKeys(db);
  // ... other entities
  
  console.log("✅ Database seeded successfully");
}
```

### Seed Data Organization
- **seed-data/**: Static seed data files
- **seed.ts**: Main seeding logic
- **run-seed.ts**: CLI execution script

### Development vs Production
- **Development**: Full sample dataset for testing
- **Production**: Minimal required data only
- **Testing**: Isolated test fixtures

## Query Patterns

### Standard Queries
Common query patterns used throughout the application:

#### User-Scoped Queries
Most queries are scoped to the authenticated user:

```typescript
const items = await db.query.jobs.findMany({
  where: (fields, { eq }) => eq(fields.userId, userId),
  orderBy: (fields, { desc }) => desc(fields.createdAt),
});
```

#### Pagination
Implement consistent pagination across all list endpoints:

```typescript
const offset = (page - 1) * pageSize;
const limit = pageSize + 1; // Fetch one extra to check hasNext

const items = await db.query.jobs.findMany({
  where: userScopeCondition,
  orderBy: sortOrderClause,
  offset,
  limit,
});

const hasNext = items.length > pageSize;
if (hasNext) items.pop(); // Remove extra item

return { items, hasNext };
```

#### Search and Filtering
Use `ilike` for case-insensitive text search:

```typescript
const items = await db.query.jobs.findMany({
  where: (fields, { eq, ilike, and }) => {
    const baseCond = eq(fields.userId, userId);
    if (searchQuery) {
      return and(baseCond, ilike(fields.definitionNL, `%${searchQuery}%`));
    }
    return baseCond;
  },
});
```

#### Relations
Use Drizzle's relational queries for joins:

```typescript
const jobsWithMessages = await db.query.jobs.findMany({
  with: {
    messages: true,
    user: true,
  },
  where: eq(jobs.userId, userId),
});
```

## Data Integrity

### Constraints
- **Primary Keys**: UUID-based primary keys on all tables
- **Foreign Keys**: Proper referential integrity with cascade deletes
- **Not Null**: Required fields marked as `notNull()`
- **Defaults**: Sensible defaults for optional fields

### User Data Isolation
- **Multi-tenancy**: All user data scoped by `userId`
- **Cascade Deletes**: User deletion removes all associated data
- **Query Scoping**: All queries filtered by authenticated user

### Validation
- **Schema Level**: Database constraints enforce data integrity
- **Application Level**: Zod schemas validate input data
- **Type Safety**: TypeScript ensures compile-time correctness

## Performance Considerations

### Indexing
- **Primary Keys**: Automatic indexing on UUID primary keys
- **Foreign Keys**: Indexed for join performance
- **Search Fields**: Consider indexes on frequently searched columns

### Query Optimization
- **Limit Results**: Always use pagination for list queries
- **Select Specific Fields**: Avoid `SELECT *` where possible
- **Efficient Joins**: Use Drizzle's relational queries appropriately

### Connection Management
- **Connection Pooling**: Configured at database connection level
- **Resource Cleanup**: Proper connection lifecycle management

## Backup and Recovery

### Development
- **Reset Script**: `pnpm db:reset` for clean development state
- **Seed Script**: `pnpm db:seed` for sample data restoration

### Production
- **Migration Strategy**: Always test migrations on staging first
- **Rollback Plan**: Keep backups before major schema changes
- **Data Validation**: Verify data integrity after migrations

## Monitoring and Maintenance

### Schema Evolution
- **Version Control**: All schema changes tracked in migrations
- **Documentation**: Update this document with schema changes
- **Breaking Changes**: Coordinate with frontend team for breaking changes

### Performance Monitoring
- **Query Performance**: Monitor slow queries in production
- **Index Usage**: Verify indexes are being used effectively
- **Connection Health**: Monitor database connection pool status

## Best Practices

1. **Schema Design**:
   - Use descriptive table and column names
   - Include created/updated timestamps
   - Implement proper foreign key relationships

2. **Migrations**:
   - Review generated migrations before applying
   - Test migrations on development data first
   - Never edit existing migration files

3. **Queries**:
   - Always scope queries to authenticated users
   - Implement pagination for list operations
   - Use type-safe query builders

4. **Data Integrity**:
   - Validate data at application and database levels
   - Use transactions for multi-table operations
   - Implement proper error handling

5. **Performance**:
   - Index frequently queried columns
   - Limit result sets appropriately
   - Monitor query performance in production
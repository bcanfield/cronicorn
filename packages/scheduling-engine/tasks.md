# Scheduling Engine Database Schema Tasks

## Schema Implementation Tasks

1. **Fix Type Compatibility Issues in JobContext**
   - Update `JobContext` type in the scheduling engine to match the DB schema types
   - Ensure proper handling of null vs undefined values
   - Fix the timestamp vs createdAt/updatedAt mismatch between the types

2. **Update DatabaseService Methods**
   - Fix insert operations to match schema requirements (e.g., add missing required fields)
   - Update message.timestamp vs message.createdAt discrepancies
   - Fix the reduce function in getEngineMetrics to handle nullable values correctly

3. **Generate DB Migration Script**
   - Create proper Drizzle migration script with:
     - Add `lockExpiresAt` to the jobs table
     - Create new JobExecution table
     - Create new EndpointResult table
     - Create new JobError table

4. **Update Existing Tests**
   - Update database-service.test.ts to match the new strongly-typed client
   - Update mocks to provide correctly typed values

5. **Add Schema Validation**
   - Create validation function to verify DB schema matches expected types
   - Add startup check to ensure schema compatibility

## Documentation Tasks

1. **Update API Documentation**
   - Document new schema tables and their relationships
   - Document lockExpiresAt field usage and behavior

2. **Update Engine Documentation**
   - Document type compatibility requirements between API and engine
   - Provide examples of database usage with proper types

## Future Work Considerations

1. **Direct Schema Import**
   - Research feasibility of directly importing schema definitions from API
   - Consider generating TypeScript types from Zod schemas

2. **Schema Synchronization**
   - Create automated tests to verify schema compatibility between packages
   - Consider schema versioning strategy

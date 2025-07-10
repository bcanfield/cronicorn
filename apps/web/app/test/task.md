Generate a clean, organized Next.js project (using app directory) with the following constraints:

1. **Client Components Only**  
   - Every UI component must be a client component.

2. **Reusable REST API with Hono & Zod**  
   - Define a minimal set of REST routes (e.g. /​jobs, /​jobs/{id}/messages) that support pagination, filtering, and reusable query parameters.  
   - Validate all inputs/output schemas with Zod.  
   - Organize routes under a single `api/` module so they can be consumed by both UI and external clients.

3. **Data Fetching with React Query**  
   - Call the Hono/Zod endpoints via React Query.

4. **DRY, Modular Structure**  
   - Group shared types, validation schemas, and utility functions into `lib/` or `utils/`.  
   - Keep per-feature code (components, hooks, tests) in feature folders (e.g. `features/jobs/`).  
   - Avoid duplicating route handlers, hooks, or schemas across files.

5. **Future-proofing**  
   - Design API and hook parameters so they’ll work for other pages (e.g. job details, message streams) without adding new endpoints.  
   - Emphasize extensibility: adding filters, sorts, or sub-resources shouldn’t require new routes or duplicate code.

---
applyTo: "**"
description: Comprehensive development workflow documentation covering setup, build processes, testing, and deployment patterns.
---

# Development Workflow Documentation

This document outlines the complete development workflow for the cronicorn project, from initial setup to deployment.

> **IMPORTANT:** If you detect any new patterns, best practices, or inconsistencies between this document and the actual implementation in the codebase, please update these instructions to reflect the current best practices.

## Prerequisites

### Required Tools
- **Node.js**: Version 18+ (recommended: latest LTS)
- **pnpm**: Version 10.7.0 (specified in package.json)
- **PostgreSQL**: For local database development
- **Git**: Version control

### Installation
```bash
# Install Node.js (use nvm for version management)
nvm install --lts
nvm use --lts

# Install pnpm globally
npm install -g pnpm@10.7.0

# Verify installations
node --version
pnpm --version
```

## Project Setup

### 1. Repository Clone
```bash
git clone https://github.com/bcanfield/cronicorn.git
cd cronicorn
```

### 2. Dependencies Installation
```bash
# Install all workspace dependencies
pnpm install

# This installs dependencies for:
# - Root workspace
# - apps/api
# - apps/web  
# - packages/ui
# - packages/api-client
# - packages/eslint-config
```

### 3. Environment Configuration

#### API Environment (`apps/api/.env`)
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/cronicorn_dev

# Authentication (GitHub OAuth)
AUTH_SECRET=your_long_random_string_here
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret

# Development
NODE_ENV=development
```

#### Web Environment (`apps/web/.env`)
```bash
# API URL
VITE_API_URL=http://localhost:9999

# Development
NODE_ENV=development
```

### 4. Database Setup
```bash
# Navigate to API directory
cd apps/api

# Push schema to database (creates tables)
pnpm db:push

# Seed with sample data
pnpm db:seed

# Optional: Open database studio
pnpm db:studio
```

### 5. GitHub OAuth Setup
1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Create new OAuth App:
   - Application name: `Cronicorn Development`
   - Homepage URL: `http://localhost:3333`
   - Authorization callback URL: `http://localhost:3333/api/auth/callback/github`
3. Copy Client ID and Client Secret to `.env` files

## Development Commands

### Root Workspace Commands
```bash
# Start all development servers
pnpm dev

# Build all packages and apps
pnpm build

# Run all tests
pnpm test

# Type checking across workspace
pnpm typecheck

# Linting across workspace
pnpm lint
pnpm lint:fix

# Clean all node_modules and build artifacts
pnpm clean

# Database commands (run from anywhere)
pnpm db:push     # Push schema changes
pnpm db:generate # Generate migrations
pnpm db:seed     # Seed database
pnpm db:studio   # Open database GUI

# Kill development servers
pnpm kill
```

### API-Specific Commands
```bash
cd apps/api

# Development server with hot reload
pnpm dev

# Build TypeScript to dist/
pnpm build

# Run tests with coverage
pnpm test

# Database operations
pnpm db:generate  # Generate migration files
pnpm db:migrate   # Apply pending migrations
pnpm db:push      # Push schema directly (dev only)
pnpm db:reset     # Reset database (dev only)
pnpm db:seed      # Seed with sample data
pnpm db:studio    # Open Drizzle Studio
```

### Web-Specific Commands
```bash
cd apps/web

# Development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run tests
pnpm test

# Test UI components specifically
pnpm test:ui
```

## Development Workflow

### 1. Starting Development

**Terminal 1: API Server**
```bash
cd apps/api
pnpm dev
# Server starts on http://localhost:9999
# API docs available at http://localhost:9999/doc
```

**Terminal 2: Web Server**
```bash
cd apps/web  
pnpm dev
# Web app starts on http://localhost:3333
```

**Terminal 3: Optional Database Studio**
```bash
cd apps/api
pnpm db:studio
# Database GUI on http://localhost:4983
```

### 2. Making Changes

#### Database Changes
1. **Modify Schema**: Edit files in `apps/api/src/db/schema/`
2. **Generate Migration**: `pnpm db:generate`
3. **Review Migration**: Check generated SQL in `migrations/`
4. **Apply Changes**: `pnpm db:push` (dev) or `pnpm db:migrate` (prod)

#### API Changes
1. **Update Schema**: Modify database schema if needed
2. **Update Routes**: Edit route definitions in `routes/*/`
3. **Update Handlers**: Implement business logic in handlers
4. **Test Changes**: Run `pnpm test` in API directory
5. **Type Check**: Run `pnpm typecheck` from root

#### Web Changes
1. **Update Queries**: Modify query files in `lib/queries/`
2. **Update Components**: Edit React components and routes
3. **Update Types**: Types automatically flow from API changes
4. **Test Changes**: Run `pnpm test` in web directory

### 3. Quality Assurance

#### Before Committing
```bash
# From root directory
pnpm typecheck  # Verify no type errors
pnpm lint       # Check code style
pnpm test       # Run all tests
pnpm build      # Ensure everything builds
```

#### Code Style
- ESLint enforces consistent code style
- Prettier formatting via ESLint
- TypeScript strict mode enabled
- Auto-fix available: `pnpm lint:fix`

## Testing Strategy

### API Testing
```bash
cd apps/api
pnpm test

# Test structure:
# - Unit tests for handlers
# - Integration tests for routes
# - Database operation tests
# - Authentication tests
```

### Web Testing
```bash
cd apps/web
pnpm test

# Test structure:
# - Component unit tests
# - Form validation tests
# - Query/mutation tests
# - User interaction tests
```

### Test Organization
- **Unit Tests**: `*.test.ts` files alongside source
- **Test Utilities**: Shared helpers in `src/tests/`
- **Fixtures**: Test data and mocks
- **Coverage**: Comprehensive coverage reporting

## Build Process

### Development Builds
- **API**: TypeScript watch mode with hot reload
- **Web**: Vite dev server with HMR
- **Packages**: Built as dependencies change

### Production Builds
```bash
# Build all packages in dependency order
pnpm build

# Build sequence:
# 1. packages/eslint-config
# 2. packages/ui
# 3. apps/api (generates types)
# 4. packages/api-client (uses API types)
# 5. apps/web (uses all packages)
```

### Build Artifacts
- **API**: `apps/api/dist/` - Compiled JavaScript with type definitions
- **Web**: `apps/web/dist/` - Static assets for deployment
- **Packages**: `packages/*/dist/` - Compiled libraries

## Database Development

### Schema Development
1. **Design Schema**: Plan entity relationships and constraints
2. **Define Tables**: Create schema files in `schema/` directory
3. **Generate Schemas**: Use Drizzle-Zod for validation schemas
4. **Create Migration**: Run `pnpm db:generate`
5. **Test Migration**: Apply to development database
6. **Seed Data**: Update seed files if needed

### Migration Workflow
```bash
# 1. Modify schema files
# 2. Generate migration
pnpm db:generate

# 3. Review generated SQL
cat apps/api/src/db/migrations/XXXX_migration_name.sql

# 4. Apply to development
pnpm db:push

# 5. Test with application
# 6. Commit schema and migration files
```

### Data Seeding
- **Development**: Rich sample data for testing
- **Testing**: Isolated fixtures per test
- **Production**: Minimal required data only

## Package Development

### UI Package Development
```bash
cd packages/ui

# Development workflow:
# 1. Add/modify components in src/components/
# 2. Export from appropriate index files
# 3. Test in web app
# 4. Update documentation
```

### API Client Development
- **Automatic**: Types generated from API routes
- **Manual Changes**: Only for error handling or utilities
- **Testing**: Verify type safety with API changes

## Deployment

### Environment-Specific Builds
```bash
# Development
NODE_ENV=development pnpm build

# Staging  
NODE_ENV=staging pnpm build

# Production
NODE_ENV=production pnpm build
```

### Database Deployment
```bash
# Apply migrations to production
pnpm db:migrate

# Verify schema matches
pnpm db:push --dry-run
```

### Asset Deployment
- **API**: Deploy dist/ directory to server
- **Web**: Deploy dist/ to static hosting (Vercel, Netlify, etc.)
- **Environment Variables**: Configure for production environment

## Troubleshooting

### Common Development Issues

#### Port Conflicts
```bash
# Kill existing processes
pnpm kill

# Or manually kill specific ports
npx kill-port 3333 9999
```

#### Type Errors
```bash
# Rebuild packages in order
pnpm clean
pnpm install
pnpm build
```

#### Database Issues
```bash
# Reset database completely
pnpm db:reset
pnpm db:seed

# Check connection
pnpm db:studio
```

#### Module Resolution
```bash
# Clear package manager cache
pnpm store prune

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Performance Optimization

#### Development Performance
- Use `pnpm` for faster installs
- Enable TypeScript incremental builds
- Use Vite for fast web development
- Database connection pooling

#### Build Performance
- Turbo caching for builds
- Parallel builds where possible
- Incremental TypeScript compilation
- Optimized dependency resolution

## IDE Configuration

### VS Code Settings
```json
{
  "typescript.preferences.useAliasesForRenames": false,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### Recommended Extensions
- ESLint
- Prettier
- TypeScript Importer
- Tailwind CSS IntelliSense
- Auto Rename Tag
- GitLens

## Monitoring and Debugging

### Development Monitoring
- **API Logs**: Pino logger with pretty printing
- **Web DevTools**: React Query Devtools, Router Devtools
- **Database**: Drizzle Studio for query inspection
- **Network**: Browser devtools for API calls

### Debugging Techniques
- **Breakpoints**: Use debugger in IDE
- **Console Logging**: Strategic logging in development
- **Error Boundaries**: React error boundaries for UI
- **API Errors**: Structured error responses

## Best Practices

### 1. Code Organization
- Feature-based organization
- Consistent file naming
- Clear separation of concerns
- Proper TypeScript types

### 2. Git Workflow
- Meaningful commit messages
- Feature branches for development
- Code review before merging
- Clean commit history

### 3. Testing Practices
- Test-driven development where appropriate
- Good test coverage
- Fast feedback loops
- Isolated test environments

### 4. Performance Considerations
- Database query optimization
- Frontend bundle optimization
- Proper caching strategies
- Monitoring production performance

### 5. Security Practices
- Environment variable security
- Authentication best practices
- Input validation
- Secure database practices
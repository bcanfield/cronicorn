# API Authentication

This API supports two authentication methods:

1. Auth.js (formerly NextAuth) for browser-based authentication
2. API Key authentication for programmatic access

## API Key Authentication

The API supports authentication using API keys for programmatic access to the API. This is useful for integrations, scripts, or automated processes.

### Headers

When making requests to the API, include the following headers:

```
X-API-Key: your_api_key
X-API-Secret: your_api_secret
```

### Managing API Keys

API keys can be created and managed through the web interface at `/dashboard/api-keys`.

### API Key Scopes

API keys can be created with specific scopes that limit what operations they can perform. Common scopes include:

- `read:jobs` - Read job data
- `write:jobs` - Create/update job data
- `read:tasks` - Read task data
- `write:tasks` - Create/update task data

### API Key Best Practices

1. **Rotate Keys Regularly**: Create new API keys and delete old ones periodically.
2. **Use Scoped Keys**: Only grant the permissions needed for each integration.
3. **Secure Storage**: Store API keys and secrets securely; never expose them in client-side code.
4. **Monitor Usage**: Regularly review the "Last Used At" timestamp to identify unused keys.

## Request Flow

1. The system first checks for valid API key authentication headers.
2. If API key authentication succeeds, the request proceeds.
3. If no API key is provided, or authentication fails, the system falls back to Auth.js session-based authentication.
4. If both authentication methods fail, a 401 Unauthorized response is returned.

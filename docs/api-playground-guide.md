# API Playground Guide: Using Your API Keys

This guide will help you use the API keys you've generated to make successful requests in our API playground.

## Prerequisites

- You should have already generated an API key from the dashboard at `/dashboard/api-keys`
- You should have both the **API Key** and **API Secret** values handy

## Setting Up Authentication

### Step 1: Access the API Playground

Navigate to our API playground interface, where you can test all available endpoints.

### Step 2: Add Authentication Headers

For each request, you'll need to add two custom headers:

1. **X-API-Key**: Your API key value
2. **X-API-Secret**: Your API secret value

#### Adding Headers in the Playground

In the API playground interface:

1. Locate the "Headers" section (usually near the top of the request panel)
2. Add the following headers:

```
X-API-Key: your_api_key_here
X-API-Secret: your_api_secret_here
```

Replace `your_api_key_here` and `your_api_secret_here` with your actual key and secret values.

![Header Configuration Example](../docs/images/api-headers-example.png)

### Step 3: Test Your Authentication

1. Select a simple GET endpoint (like `/api/endpoints` or `/api/tasks`)
2. Make sure your headers are configured correctly
3. Click "Send" or "Execute"
4. You should receive a successful response with status code 200

If you see an "Unauthorized" error (status 401), double-check that:
- Both headers are spelled correctly (including capitalization)
- The values for your key and secret are correct
- Your API key hasn't been revoked or expired

## Working with Scoped API Keys

If you created an API key with specific scopes (permissions), keep these points in mind:

- You can only access endpoints that match the scopes of your API key
- For example, a key with only `read:tasks` scope cannot create or update tasks
- Check the "Scopes" column in your API Keys dashboard to verify the permissions

## Using API Keys in Code

When integrating with your own applications, you'll add the same headers to your HTTP requests:

### JavaScript/Fetch Example

```javascript
const response = await fetch('https://your-api-url.com/api/tasks', {
  method: 'GET',
  headers: {
    'X-API-Key': 'your_api_key_here',
    'X-API-Secret': 'your_api_secret_here',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```

### cURL Example

```bash
curl -X GET \
  'https://your-api-url.com/api/tasks' \
  -H 'X-API-Key: your_api_key_here' \
  -H 'X-API-Secret: your_api_secret_here'
```

### Python Example

```python
import requests

headers = {
    'X-API-Key': 'your_api_key_here',
    'X-API-Secret': 'your_api_secret_here'
}

response = requests.get('https://your-api-url.com/api/tasks', headers=headers)
data = response.json()
print(data)
```

## Best Practices for API Key Usage

1. **Never share your API secret** - it should be treated like a password
2. **Rotate keys regularly** - create new keys and delete old ones periodically
3. **Use scoped keys** - create keys with only the permissions needed
4. **Monitor usage** - check the "Last Used" timestamp to detect unauthorized use
5. **Store securely** - never commit API keys to code repositories or expose them in client-side code

## Troubleshooting

| Error | Possible Cause | Solution |
|-------|---------------|----------|
| 401 Unauthorized | Invalid or missing API key/secret | Verify key and secret values |
| 401 Unauthorized | Revoked API key | Generate a new API key |
| 401 Unauthorized | Expired API key | Generate a new API key |
| 403 Forbidden | Missing required scope | Use a key with appropriate permissions |
| 429 Too Many Requests | Rate limit exceeded | Reduce request frequency |

## Getting Help

If you continue to experience issues with API authentication:

1. Verify your API key status in the dashboard
2. Check that your key has the necessary scopes for the endpoint
3. Contact support with details about the error messages you're receiving

---

For more comprehensive documentation on our API, please refer to the complete [API Reference](./api-reference.md).

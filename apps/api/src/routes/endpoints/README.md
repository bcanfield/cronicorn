# Endpoints API

The Endpoints API allows for the management and execution of external HTTP endpoints within the Cronicorn system.

## Overview

Endpoints represent HTTP endpoints that can be executed as part of a job's workflow. Each endpoint belongs to a specific job and can be configured with a URL, HTTP method, headers, and authentication details.

## Features

### CRUD Operations

- **List Endpoints**: Paginated list of endpoints with sorting and filtering capabilities.
- **Create Endpoint**: Create a new endpoint configuration for a job.
- **Get Endpoint**: Retrieve details for a specific endpoint.
- **Update Endpoint**: Modify an existing endpoint's configuration.
- **Delete Endpoint**: Remove an endpoint from the system.

### Run Endpoint

The run endpoint functionality (`POST /endpoints/:id/run`) allows for the execution of an HTTP request using the endpoint's configuration:

1. The system validates that the endpoint exists and belongs to the authenticated user.
2. It makes an HTTP request to the endpoint's URL using its configured method and bearer token.
3. It tracks request timing and handles timeouts.
4. The execution result is returned with detailed metadata.
5. **The execution result is stored as a system message in the messages table for the associated job.**

## System Message Storage

When an endpoint is executed, the system automatically stores the execution result as a system message in the database:

- **Message Role**: `system`
- **Source**: `endpointResponse`
- **Content**: A formatted markdown string containing:
  - Endpoint name, URL, and method
  - Execution status (success/failure)
  - Response status code and timing
  - Request body (if applicable)
  - Response data
  - Response headers
  - Error message (if applicable)

This allows for a historical record of endpoint executions that can be accessed through the messages API and used by AI agents interacting with the job.

## Example Message Content

````markdown
## Endpoint Execution: Example Endpoint

**Timestamp:** 2023-07-25T15:30:45.123Z
**Status:** ✅ Success
**URL:** https://api.example.com/data
**Method:** GET
**Response Time:** 235ms
**Status Code:** 200

### Response Data

```json
{
  "id": "123",
  "name": "Example Data",
  "value": 42
}
```
````

### Response Headers

```json
{
  "content-type": "application/json",
  "x-request-id": "abc123"
}
```

```

## Implementation Details

The endpoint execution and message storage functionality is implemented in:

- `endpoints.handlers.ts`: Contains the run handler that executes the endpoint and triggers message storage
- `endpoints.utils.ts`: Contains utility functions for formatting messages and inserting them into the database
  - `formatEndpointResponseMessage`: Formats the endpoint response data into a structured message
  - `insertSystemMessage`: Inserts a system message into the database
```

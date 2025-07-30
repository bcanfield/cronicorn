---
applyTo: "**"
---
Defines a generic problem-solving workflow that directs the AI agent to use specialized MCP servers for structured reasoning, up-to-date documentation, and efficient context storage

## Workflow Overview
1. **Sequential Thinking**
   - Invoke the `sequential-thinking` MCP server to break down complex problems into a numbered sequence of “thoughts,”.
   - After each thought, review and optionally revise based on new insights before proceeding.

2. **Context7 Documentation**
   - When a library integration or configuration is required, call the `context7` MCP server with the library name and code snippet.
   - Incorporate returned usage examples and links to ensure documentation is current.

3. **Redis Context Storage**
   - Use the `redis` MCP server to `SET` and `GET` intermediate planning states or conversation history.
   - Example usage:
     ```
     SET testPlan:step1 {"step":1,"status":"done"}
     GET testPlan:step1
     ```

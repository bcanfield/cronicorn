---
applyTo: "**/scheduling-engine/**"
---

# Scheduling Engine Task Tracker Instructions

This instruction file guides Copilot on automatically tracking and updating progress on the scheduling engine implementation tasks.

## Task Management Rules

1. **Always check task status**: When modifying files in the scheduling engine package, cross-reference with the task list in `docs/scheduling-engine-tasks.md` to identify which tasks are being addressed.

2. **Update task list**: When a task is completed:
   - Change the checkbox from `- [ ]` to `- [x]` for the corresponding task
   - Update the implementation details document with a summary of what was implemented

3. **Track implementation details**: When implementing features from the task list:
   - Add detailed notes to `docs/scheduling-engine-implementation.md`
   - Include technical decisions, patterns, and important implementation details
   - Document any challenges faced and solutions applied

4. **Context preservation**: Always maintain detailed implementation notes to preserve context across Copilot sessions.

## Implementation Guideline

When implementing a task from the scheduling engine task list:

1. **Identify the task**: Determine which specific task is being addressed based on the code changes.

2. **Implementation details**: Capture important technical details including:
   - Design patterns used
   - Algorithm details
   - Dependencies and integration points
   - Error handling strategy
   - Performance considerations

3. **Task completion**: Mark tasks as complete only when:
   - Implementation is complete
   - Code passes all type checks and linting
   - Basic functionality is verified

4. **Cross-referencing**: When a task spans multiple files or components, make sure to update the implementation details with cross-references.

## Task Status Verification

Before marking a task as complete, verify:

1. All required functionality is implemented
2. Type safety is ensured (passes TypeScript checks)
3. Code follows project conventions and passes linting
4. The implementation matches the architectural plan
5. Documentation is updated accordingly

## Session Transition Support

To ensure seamless transitions between Copilot sessions:

1. At the end of each major implementation milestone, update the implementation details document
2. Include enough context for a new Copilot session to understand:
   - Current state of implementation
   - Next steps and pending work
   - Any known issues or challenges
   - Architecture and design decisions

This approach ensures continuous progress tracking and maintains implementation context across multiple sessions.

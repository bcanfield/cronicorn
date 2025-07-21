import type { selectTasksSchema } from "@tasks-app/api/schema";

import { Link } from "@tanstack/react-router";

export default function Task({ task }: { task: selectTasksSchema }) {
  return (
    <article>
      <h3
        style={{ textDecoration: task.done ? "line-through" : undefined }}
      >
        {task.name}
      </h3>
      <div className="buttons">
        <Link to="/task/$id" params={{ id: task.id.toString() }} role="button" className="outline">
          View
        </Link>
      </div>
    </article>
  );
}

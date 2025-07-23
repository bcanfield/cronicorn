import type { selectJobsSchema } from "@tasks-app/api/schema";

import { Link } from "@tanstack/react-router";

import dateFormatter from "@/web/lib/date-formatter";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card";

export default function Job({ job }: { job: selectJobsSchema }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{job.definitionNL}</CardTitle>
        <CardDescription>
          Status:
          {job.status}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Next Run:
          {job.nextRunAt ? dateFormatter.format(new Date(job.nextRunAt)) : "N/A"}
        </p>
        <p>
          Updated:
          {dateFormatter.format(new Date(job.updatedAt))}
        </p>
        <p>
          Created:
          {dateFormatter.format(new Date(job.createdAt))}
        </p>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button asChild variant="outline">
          <Link to="/dashboard/jobs/$jobId" params={{ jobId: job.id }}>View</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

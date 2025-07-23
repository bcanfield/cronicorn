import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";

export default function RouteError({ error }: { error: Error }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
}

import type { selectEndpointsSchema } from "@tasks-app/api/schema";

import { zodResolver } from "@hookform/resolvers/zod";
import { insertEndpointsSchema } from "@tasks-app/api/schema";
import { Save, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Separator } from "@workspace/ui/components/separator";
import { Textarea } from "@workspace/ui/components/textarea";

type EndpointFormProps = {
  defaultValues?: selectEndpointsSchema;
  onSubmit: (data: insertEndpointsSchema) => Promise<void>;
  mode?: "create" | "update";
  onCancel: () => void;
  jobId: string; // JobId is required as endpoints are always under a job
  onDelete?: () => void;
};

export default function EndpointForm({
  defaultValues,
  onSubmit,
  mode = "create",
  onCancel,
  jobId,
  onDelete,
}: EndpointFormProps) {
  const form = useForm<insertEndpointsSchema>({
    resolver: zodResolver(insertEndpointsSchema),
    defaultValues: {
      ...defaultValues,
      jobId: defaultValues?.jobId || jobId,
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = async (data: insertEndpointsSchema) => {
    setIsLoading(true);
    try {
      // Always ensure jobId is included
      const dataWithJobId = {
        ...data,
        jobId,
      };
      form.reset(dataWithJobId);
      await onSubmit(dataWithJobId);
    }
    finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter endpoint name" {...field} disabled={isLoading} />
              </FormControl>
              <FormDescription>A descriptive name for this endpoint.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input placeholder="https://api.example.com/webhook" {...field} disabled={isLoading} />
              </FormControl>
              <FormDescription>The URL to send requests to.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>HTTP Method</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || "GET"} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select HTTP method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>HTTP method for the request.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bearerToken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bearer Token (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter token" {...field} value={field.value || ""} disabled={isLoading} />
              </FormControl>
              <FormDescription>Bearer token for authentication, if required.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requestSchema"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Request Schema (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='{"example": "value"}'
                  {...field}
                  disabled={isLoading}
                  value={field.value ? JSON.stringify(field.value, null, 2) : ""}
                  onChange={(e) => {
                    try {
                      const json = e.target.value ? JSON.parse(e.target.value) : null;
                      field.onChange(json);
                    }
                    catch {
                      // Allow invalid JSON during editing
                      field.onChange(e.target.value);
                    }
                  }}
                />
              </FormControl>
              <FormDescription>JSON schema for request validation.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="timeoutMs"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timeout (ms)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="5000"
                  {...field}
                  disabled={isLoading}
                  value={field.value || 5000}
                  onChange={e => field.onChange(Number.parseInt(e.target.value, 10) || 5000)}
                />
              </FormControl>
              <FormDescription>Request timeout in milliseconds.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fireAndForget"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Fire and Forget</FormLabel>
                <FormDescription>
                  If enabled, the system won't wait for a response from this endpoint.
                </FormDescription>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hidden field for jobId */}
        <input type="hidden" {...form.register("jobId")} value={jobId} />

        <Separator />
        <div className="flex items-center justify-between space-x-2">
          {onDelete && mode === "update" && (
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={isLoading}
              type="button"
            >
              <X className="size-4" />
              Delete Endpoint
            </Button>
          )}
          <div className={`flex items-center gap-2 ${!onDelete || mode !== "update" ? "w-full" : "flex-auto"} justify-end`}>
            <Button variant="outline" disabled={isLoading} onClick={onCancel} type="button">
              <X className="size-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !form.formState.isDirty}>
              <Save className="size-4" />
              {isLoading ? "Saving..." : mode === "update" ? "Update Endpoint" : "Create Endpoint"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

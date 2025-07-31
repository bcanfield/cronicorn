import { zodResolver } from "@hookform/resolvers/zod";
import { insertApiKeysSchema } from "@tasks-app/api/schema";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@workspace/ui/components/button";
import { Calendar } from "@workspace/ui/components/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";

type ApiKeyFormProps = {
  defaultValues?: insertApiKeysSchema;
  onSubmit: (data: insertApiKeysSchema) => Promise<void>;
  isLoading?: boolean;
};

export default function ApiKeyForm({ defaultValues, onSubmit, isLoading }: ApiKeyFormProps) {
  const [scopeInput, setScopeInput] = useState("");

  const form = useForm<insertApiKeysSchema>({
    resolver: zodResolver(insertApiKeysSchema),
    defaultValues,

  });

  async function handleSubmit(values: insertApiKeysSchema) {
    await onSubmit(values);
  }

  function addScope() {
    if (!scopeInput.trim())
      return;

    const currentScopes = form.getValues("scopes") || [];
    if (!currentScopes.includes(scopeInput.trim())) {
      form.setValue("scopes", [...currentScopes, scopeInput.trim()]);
    }
    setScopeInput("");
  }

  function removeScope(scope: string) {
    const currentScopes = form.getValues("scopes") || [];
    form.setValue(
      "scopes",
      currentScopes.filter(s => s !== scope),
    );
  }

  return (

    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Name your API key" {...field} />
              </FormControl>
              <FormDescription>A descriptive name for your API key</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what this API key is used for"
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expiresAt"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Expiration Date</FormLabel>

              <Calendar
                mode="single"
                selected={field.value ? new Date(field.value) : undefined}
                onSelect={date => date && field.onChange(date.toISOString())}
                className="rounded-lg border shadow-sm"
              />
              <FormDescription>
                Optional. When this API key should expire.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scopes"
          render={() => (
            <FormItem>
              <FormLabel>Scopes</FormLabel>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Enter a scope"
                  value={scopeInput}
                  onChange={e => setScopeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addScope();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addScope}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {form.watch("scopes")?.map(scope => (
                  <div
                    key={scope}
                    className="flex items-center rounded-md bg-secondary px-2 py-1 text-sm"
                  >
                    {scope}
                    <button
                      type="button"
                      className="ml-1 rounded-full text-muted-foreground hover:text-foreground"
                      onClick={() => removeScope(scope)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <FormDescription>
                Optional. Define permissions for this API key.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : defaultValues ? "Update API Key" : "Create API Key"}
        </Button>
      </form>
    </Form>

  );
}

import type { selectEndpointsSchema } from "@tasks-app/api/schema";

import { useMutation } from "@tanstack/react-query";
import { Code, Loader2, Play, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Textarea } from "@workspace/ui/components/textarea";
import { toast } from "@workspace/ui/lib/utils";

import { runEndpoint } from "../../../../../../lib/queries/endpoints.queries";

type RunEndpointDialogProps = {
  endpoint: selectEndpointsSchema;
  onClose: () => void;
  open: boolean;
};

export function RunEndpointDialog({ endpoint, onClose, open }: RunEndpointDialogProps) {
  const [requestBody, setRequestBody] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"request" | "response">("request");
  const [responseData, setResponseData] = useState<any>(null);

  // Mutation for running the endpoint
  const { mutate, isPending } = useMutation({
    mutationFn: ({ id, body }: { id: string; body?: any }) => {
      let parsedBody;

      if (body && body.trim() !== "") {
        try {
          parsedBody = JSON.parse(body);
        }
        catch {
          throw new Error("Invalid JSON");
        }
      }

      return runEndpoint({ id, requestBody: parsedBody });
    },
    onSuccess: (data) => {
      setResponseData(data);
      setActiveTab("response");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to run endpoint");
    },
  });

  const handleRun = () => {
    mutate({ id: endpoint.id, body: requestBody });
  };

  const formatJSON = (data: any): string => {
    try {
      return JSON.stringify(data, null, 2);
    }
    catch {
      return String(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Run Endpoint:
            {endpoint.name}
          </DialogTitle>
          <DialogDescription>
            {endpoint.method}
            {" "}
            {endpoint.url}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={value => setActiveTab(value as "request" | "response")} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="request">Request</TabsTrigger>
            <TabsTrigger value="response" disabled={!responseData}>Response</TabsTrigger>
          </TabsList>

          <TabsContent value="request" className="space-y-4 mt-4">
            {["POST", "PUT", "PATCH"].includes(endpoint.method) && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Request Body (JSON)</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRequestBody(endpoint.requestSchema || "")}
                    disabled={!endpoint.requestSchema}
                  >
                    <Code className="w-4 h-4 mr-1" />
                    Use Schema
                  </Button>
                </div>
                <Textarea
                  placeholder="Enter JSON request body"
                  value={requestBody}
                  onChange={e => setRequestBody(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            )}
            {!["POST", "PUT", "PATCH"].includes(endpoint.method) && (
              <div className="text-sm text-muted-foreground">
                No request body needed for
                {" "}
                {endpoint.method}
                {" "}
                requests.
              </div>
            )}
          </TabsContent>

          <TabsContent value="response" className="space-y-4 mt-4">
            {responseData && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">Status: </span>
                    <span className={`text-sm ${responseData.success ? "text-green-500" : "text-red-500"}`}>
                      {responseData.statusCode || (responseData.success ? 200 : 500)}
                      {responseData.success ? " (Success)" : " (Failed)"}
                    </span>
                  </div>
                  {responseData.responseTime !== undefined && (
                    <div className="text-sm text-muted-foreground">
                      Response time:
                      {" "}
                      {responseData.responseTime}
                      ms
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Response Data</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-xs">
                    {formatJSON(responseData.data)}
                  </pre>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
          <Button onClick={handleRun} disabled={isPending}>
            {isPending
              ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )
              : (
                  <Play className="w-4 h-4 mr-2" />
                )}
            Run Endpoint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

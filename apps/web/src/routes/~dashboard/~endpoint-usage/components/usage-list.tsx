import type { selectEndpointUsageSchema } from "@tasks-app/api/schema";

import { Check, X } from "lucide-react";

import dateFormatter, { formatDate } from "@/web/lib/date-formatter";
import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

// Define the extended usage record type based on the API response
type EndpointUsageRecord = selectEndpointUsageSchema & {
  endpoint: {
    name: string;
    url: string;
    method: string;
  };
};

export default function EndpointUsageList({
  usageRecords,

}: { usageRecords: EndpointUsageRecord[] }) {
  // Helper function to format bytes
  const formatBytes = (bytes: number) => {
    if (bytes < 1024)
      return `${bytes} B`;
    if (bytes < 1024 * 1024)
      return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>

            <TableHead>Timestamp</TableHead>

            <TableHead>Endpoint</TableHead>
            <TableHead>Status</TableHead>

            <TableHead>Duration</TableHead>
            <TableHead>Request Size</TableHead>
            <TableHead>Response Size</TableHead>

            <TableHead>Result</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usageRecords.length === 0
            ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No usage records found
                  </TableCell>
                </TableRow>
              )
            : (
                usageRecords.map(record => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      <div>{formatDate(record.timestamp, "MMM d, yyyy 'at' h:mm a")}</div>
                      <div className="text-xs text-muted-foreground">
                        {dateFormatter.format(new Date(record.timestamp))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{record.endpoint.name}</span>
                        <div className="flex items-center space-x-1">
                          <Badge variant="outline">{record.endpoint.method}</Badge>
                          <span className="text-xs text-muted-foreground truncate max-w-40">{record.endpoint.url}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={(record.statusCode ?? 0) >= 400 ? "destructive" : "secondary"}
                      >
                        {record.statusCode ?? "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.executionTimeMs ?? 0}
                      {" "}
                      ms
                    </TableCell>
                    <TableCell>{formatBytes(record.requestSizeBytes ?? 0)}</TableCell>
                    <TableCell>{formatBytes(record.responseSizeBytes ?? 0)}</TableCell>
                    <TableCell>
                      {record.success === 1
                        ? (
                            <div className="flex items-center">
                              <Check className="mr-1 h-4 w-4 text-green-500" />
                              <span>Success</span>
                            </div>
                          )
                        : (
                            <div className="flex items-center">
                              <X className="mr-1 h-4 w-4 text-red-500" />
                              <span className="text-red-500">Failed</span>
                            </div>
                          )}
                      {record.errorMessage && (
                        <div className="text-xs text-red-500 max-w-48 truncate" title={record.errorMessage}>
                          {record.errorMessage}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
        </TableBody>
      </Table>
    </div>
  );
}

import type { selectMessagesSchema } from "@tasks-app/api/schema";

import Message from "@/web/routes/~dashboard/~jobs/~$jobId/~messages/components/message";

export default function MessageList({ messages }: { messages: selectMessagesSchema[] }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {messages.length === 0
        ? (
            <p className="text-muted-foreground text-center py-8">No messages found</p>
          )
        : (
            messages.map(message => (
              <Message message={message} key={message.id} />
            ))
          )}
    </div>
  );
}

import type { AIMessage } from "@/services/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatTypingIndicator } from "./ChatTypingIndicator";

export interface ChatMessageListProps {
  messages: AIMessage[];
  isLoading: boolean;
  streamingContent: string;
  streamStatus: string;
}

export function ChatMessageList({
  messages,
  isLoading,
  streamingContent,
  streamStatus,
}: ChatMessageListProps) {
  return (
    <div className="min-h-0 flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="space-y-5 px-4 py-4">
          {messages.map((message) => (
            <div key={`${message.id}-${message.createdAt}`}>
              <ChatMessageItem
                message={message}
                variant={message.role === "user" ? "user" : "assistant"}
              />
            </div>
          ))}

          {isLoading && (
            <ChatTypingIndicator
              streamingContent={streamingContent}
              streamStatus={streamStatus}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

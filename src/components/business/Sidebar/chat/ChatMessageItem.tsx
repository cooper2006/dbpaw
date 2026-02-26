import type { AIMessage } from "@/services/api";
import { AIMarkdownMessage } from "../AIMarkdownMessage";

export interface ChatMessageItemProps {
  message: AIMessage;
  variant: "user" | "assistant";
}

export function ChatMessageItem({ message, variant }: ChatMessageItemProps) {
  if (variant === "user") {
    return (
      <div className="ml-auto max-w-[86%] rounded-xl border border-border/80 bg-muted/40 px-3 py-2">
        <div className="whitespace-pre-wrap text-sm leading-6 text-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <AIMarkdownMessage
      content={message.content}
      className="max-w-[92%] rounded-md border border-border/50 bg-background/80 px-1"
    />
  );
}

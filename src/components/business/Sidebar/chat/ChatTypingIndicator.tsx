import { AIMarkdownMessage } from "../AIMarkdownMessage";

export interface ChatTypingIndicatorProps {
  streamingContent: string;
  streamStatus: string;
}

export function ChatTypingIndicator({
  streamingContent,
  streamStatus,
}: ChatTypingIndicatorProps) {
  return (
    <div className="max-w-[92%]">
      <AIMarkdownMessage content={streamingContent || streamStatus || "Thinking..."} />
    </div>
  );
}

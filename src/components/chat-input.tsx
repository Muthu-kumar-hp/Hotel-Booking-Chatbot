'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic, Loader2 } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSend: () => void;
  isLoading: boolean;
}

export function ChatInput({ input, setInput, handleSend, isLoading }: ChatInputProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="border-t bg-muted/50 p-4">
      <div className="relative mx-auto max-w-4xl">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="rounded-full py-6 pr-24"
          disabled={isLoading}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
            <Button
                size="icon"
                variant="ghost"
                className="rounded-full"
                disabled={true}
                title="Voice input coming soon"
            >
                <Mic className="h-5 w-5" />
            </Button>
            <Button
                size="icon"
                className="rounded-full"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
            >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
        </div>
      </div>
    </div>
  );
}

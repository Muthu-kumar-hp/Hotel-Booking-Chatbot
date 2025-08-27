'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic, Loader2, MicOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSend: () => void;
  isLoading: boolean;
}

export function ChatInput({ input, setInput, handleSend, isLoading }: ChatInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);
  const recognitionRef = useRef<any>(null);


  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechRecognitionSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');
        setInput(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };
    }
  }, [setInput]);

  const handleMicClick = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsRecording(!isRecording);
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading && input.trim()) {
      event.preventDefault();
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
          placeholder={isRecording ? "Listening..." : "Type your message..."}
          className="rounded-full py-6 pr-24"
          disabled={isLoading}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
            <Button
                size="icon"
                variant="ghost"
                className="rounded-full"
                onClick={handleMicClick}
                disabled={!isSpeechRecognitionSupported || isLoading}
                title={isSpeechRecognitionSupported ? (isRecording ? "Stop recording" : "Start recording") : "Voice input not supported"}
            >
                {isRecording ? <MicOff className="h-5 w-5 text-destructive" /> : <Mic className="h-5 w-5" />}
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

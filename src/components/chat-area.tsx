'use client';

import { useState } from 'react';
import type { Message } from '@/lib/types';
import { handleUserMessage } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { ChatHeader } from './chat-header';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';

const initialMessage: Message = {
  id: 'initial',
  role: 'assistant',
  content: `👋 Hello! I'm your hotel search assistant. I can help you find hotels in Salem, Chennai, and Ooty.
  \n\nWhat city are you interested in? Or, would you like a **suggestion**?`,
};

export function ChatArea() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSend = async (messageText: string) => {
    if (isLoading || !messageText.trim()) return;

    const newUserMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const res = await handleUserMessage(messages, newUserMessage);
      const newBotMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        ...res,
      };
      setMessages((prev) => [...prev, newBotMessage]);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: 'Could not get a response. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (text: string) => {
    handleSend(text);
  };

  const resetChat = () => {
    setMessages([initialMessage]);
  };

  return (
    <div className="chat-container">
      <ChatHeader resetChat={resetChat} messages={messages} />
      <ChatMessages
        messages={messages}
        isLoading={isLoading}
        onQuickReply={handleQuickReply}
      />
      <ChatInput
        input={input}
        setInput={setInput}
        handleSend={() => handleSend(input)}
        isLoading={isLoading}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import type { Message } from '@/lib/types';
import { handleUserMessage, confirmBooking } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { ChatHeader } from './chat-header';
import { ChatMessages } from './chat-messages';
import { ChatInput } from './chat-input';

const initialMessage: Message = {
  id: 'initial',
  role: 'assistant',
  content: `👋 Hello! I'm your hotel booking assistant. I can help you find and book hotels in Salem, Chennai, and Ooty.
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

  const handleBooking = async (bookingData: any) => {
    setIsLoading(true);
    try {
        const result = await confirmBooking(bookingData);
        if (result.success) {
            toast({
                title: 'Booking Confirmed!',
                description: `Your booking ID is ${result.bookingId}. A receipt has been downloaded.`,
            });
            const confirmationMessage: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: `**Booking Confirmed!**\n\n- **Hotel:** ${bookingData.hotelName}\n- **Check-in:** ${bookingData.checkinDate}\n- **Check-out:** ${bookingData.checkoutDate}\n- **Guest:** ${bookingData.customerName}\n\nYour booking ID is: **${result.bookingId}**.`,
            };
            setMessages((prev) => [...prev, confirmationMessage]);
            downloadReceipt(bookingData, result.bookingId!);
        } else {
            throw new Error(result.error || 'Failed to confirm booking.');
        }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Booking Failed',
            description: error.message || 'Could not confirm booking. Please try again.',
        });
    } finally {
        setIsLoading(false);
    }
  };

  const downloadReceipt = (bookingDetails: any, bookingId: string) => {
    const textContent = `
        Booking Confirmation Receipt
        ---
        Hotel: ${bookingDetails.hotelName}
        Check-in: ${bookingDetails.checkinDate}
        Check-out: ${bookingDetails.checkoutDate}
        
        Customer Details:
        Name: ${bookingDetails.customerName}
        Email: ${bookingDetails.customerEmail}
        Phone: ${bookingDetails.customerPhone}
        
        Booking ID: ${bookingId}
        Date Confirmed: ${new Date().toLocaleDateString()}
        
        Thank you for booking with us!
    `;
    const blob = new Blob([textContent], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Booking_Receipt_${bookingId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

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
        onBookHotel={handleBooking}
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

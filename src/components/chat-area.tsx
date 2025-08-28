
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
  content: `👋 Hello! I'm your hotel booking assistant. Tell me what you're looking for, or choose an option below.`,
  quickReplies: ['Give me a suggestion', 'Salem', 'Chennai', 'Ooty', 'Loyalty Program'],
};

export function ChatArea() {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSend = async (messageText: string, isBooking?: boolean, bookingDetails?: any) => {
    if (isLoading || !messageText.trim()) return;

    const newUserMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      isBookingForm: isBooking,
      bookingDetails: bookingDetails
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const res = await handleUserMessage(messages, newUserMessage);
      const newBotMessage: Message & { updateBookingMessageId?: string; newBookingDetails?: any } = {
        id: crypto.randomUUID(),
        role: 'assistant',
        ...res,
      };

      if (newBotMessage.updateBookingMessageId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === newBotMessage.updateBookingMessageId
              ? { ...m, bookingDetails: newBotMessage.newBookingDetails }
              : m
          )
        );
      }
      
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
      setInput('');
    }
  };

  const handleQuickReply = (text: string, isBooking?: boolean, bookingDetails?: any) => {
    handleSend(text, isBooking, bookingDetails);
  };

  const resetChat = () => {
    setMessages([initialMessage]);
  };

  const handleCancelBooking = () => {
    const lastBooking = [...messages]
      .reverse()
      .find((m) => m.bookingDetails?.bookingId && m.bookingDetails?.bookingStatus === 'active');

    if (lastBooking && lastBooking.bookingDetails?.bookingId) {
      handleSend(
        `Cancel booking ${lastBooking.bookingDetails.bookingId}`
      );
    } else {
      toast({
        title: 'No active booking found',
        description: 'There are no active bookings in the current session to cancel.',
      });
    }
  };

  const handleDownloadBooking = () => {
    const lastBooking = [...messages]
      .reverse()
      .find((m) => m.bookingDetails?.bookingId);

    if (lastBooking && lastBooking.bookingDetails) {
      const { bookingId, hotel, guests, checkIn, checkOut, name, email } =
        lastBooking.bookingDetails;
      const hotelName = 'hotel' in hotel ? hotel.hotel.name : hotel.name;
      const hotelAddress = 'hotel' in hotel ? hotel.hotel.address : hotel.address;

      const receiptContent = `
Booking Receipt
----------------

Booking ID: ${bookingId}
Hotel: ${hotelName}
Address: ${hotelAddress}

Guest Name: ${name}
Guest Email: ${email}

Check-in: ${new Date(checkIn).toLocaleDateString()}
Check-out: ${new Date(checkOut).toLocaleDateString()}
Number of Guests: ${guests}

Thank you for booking with MK Hotel Chatbot!
      `.trim();

      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `MK_Hotel_Booking_${bookingId}.txt`;
      document.body.appendChild(a);
a.click();
      document.body.removeChild(a);
    } else {
      toast({
        title: 'No booking to download',
        description: 'Please make a booking first.',
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="chat-container">
        <ChatHeader
          resetChat={resetChat}
          messages={messages}
          onCancelBooking={handleCancelBooking}
          onDownloadBooking={handleDownloadBooking}
        />
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
    </div>
  );
}

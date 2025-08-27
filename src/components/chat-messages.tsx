'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { HotelCard } from './hotel-card';
import { BookingForm } from './booking-form';
import { Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  onQuickReply: (text: string) => void;
  onBookHotel: (bookingData: any) => void;
}

export function ChatMessages({
  messages,
  isLoading,
  onQuickReply,
  onBookHotel,
}: ChatMessagesProps) {
  const scrollableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollableContainerRef.current) {
      scrollableContainerRef.current.scrollTop = scrollableContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div
      ref={scrollableContainerRef}
      className="chat-box flex-1 overflow-y-auto p-4 md:p-6"
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        {messages.map((m, i) => (
          <div
            key={m.id}
            className={cn(
              'flex items-start gap-3',
              m.role === 'user' && 'flex-row-reverse'
            )}
          >
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback>
                {m.role === 'user' ? 'U' : 'AI'}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                'max-w-[85%] space-y-2 rounded-lg p-3',
                m.role === 'user'
                  ? 'rounded-br-none bg-primary text-primary-foreground'
                  : 'rounded-bl-none bg-muted'
              )}
            >
              <ReactMarkdown
                className="prose prose-sm dark:prose-invert"
                components={{
                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                }}
              >
                {m.content}
              </ReactMarkdown>

              {m.hotelData && (
                <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {m.hotelData.map((data, index) => {
                    const hotel = 'hotel' in data ? data.hotel : data;
                    const reason = 'reason' in data ? data.reason : undefined;
                    return (
                      <HotelCard
                        key={`${hotel.id}-${index}`}
                        hotel={hotel}
                        reason={reason}
                        onQuickReply={onQuickReply}
                      />
                    );
                  })}
                </div>
              )}

              {m.isBookingForm && m.hotelData && (
                 <BookingForm hotel={m.hotelData[0]} onBookHotel={onBookHotel} />
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <div className="rounded-bl-none rounded-lg bg-muted p-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

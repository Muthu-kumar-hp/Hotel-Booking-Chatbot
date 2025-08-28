
'use client';

import { RotateCw, Download, Moon, Sun, XCircle, FileDown } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Message } from '@/lib/types';
import { useMemo } from 'react';

export function ChatHeader({
  resetChat,
  messages,
  onCancelBooking,
  onDownloadBooking,
}: {
  resetChat: () => void;
  messages: Message[];
  onCancelBooking: () => void;
  onDownloadBooking: () => void;
}) {
  const { setTheme } = useTheme();

  const hasActiveBooking = useMemo(
    () => messages.some((m) => m.bookingDetails?.bookingStatus === 'active'),
    [messages]
  );
  
  const hasAnyBooking = useMemo(
    () => messages.some((m) => m.bookingDetails?.bookingId),
    [messages]
  );


  const downloadChat = () => {
    const chatText = messages
      .map(
        (msg) =>
          `${msg.role === 'user' ? 'You' : 'Bot'}: ${msg.content
            ?.replace(/<br>/g, '\n')
            .replace(/<strong>/g, '')
            .replace(/<\/strong>/g, '')}`
      )
      .join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'MK_Hotel_Chat_History.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b bg-primary/10 px-4 md:px-6">
      <div className="flex-1 text-primary">
        <h1 className="text-lg font-bold tracking-tighter sm:text-xl">🏨 MK Hotel Chatbot</h1>
        <p className="text-xs text-primary/80 sm:text-sm">
          Your guide to finding the perfect stay
        </p>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          onClick={downloadChat}
          title="Download Chat"
        >
          <Download className="h-5 w-5" />
          <span className="sr-only">Download Chat</span>
        </Button>
        {hasAnyBooking && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDownloadBooking}
            title="Download Booking Receipt"
          >
            <FileDown className="h-5 w-5" />
            <span className="sr-only">Download Booking Receipt</span>
          </Button>
        )}
        {hasActiveBooking && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancelBooking}
            title="Cancel Booking"
            className="text-destructive hover:text-destructive"
          >
            <XCircle className="h-5 w-5" />
            <span className="sr-only">Cancel Booking</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={resetChat}
          title="Reset Chat"
        >
          <RotateCw className="h-5 w-5" />
          <span className="sr-only">Reset Chat</span>
        </Button>
      </div>
    </header>
  );
}

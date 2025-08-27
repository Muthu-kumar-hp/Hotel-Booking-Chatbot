'use client';

import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { LogOut, RotateCw, Download, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Message } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function ChatHeader({ resetChat, messages }: { resetChat: () => void; messages: Message[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const { setTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      router.push('/login');
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Logout Failed', description: 'Could not log you out. Please try again.' });
    }
  };

  const downloadChat = () => {
     const chatText = messages.map(msg => `${msg.role === 'user' ? 'You' : 'Bot'}: ${msg.content.replace(/<br>/g, '\n').replace(/<strong>/g, '').replace(/<\/strong>/g, '')}`).join('\n\n');
      const blob = new Blob([chatText], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'RoamWell_Chat_History.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b bg-primary/10 px-4 md:px-6">
      <div className="text-primary">
        <h1 className="text-xl font-bold tracking-tighter">🏨 RoamWell AI</h1>
        <p className="text-sm text-primary/80">Your guide to finding the perfect stay</p>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" onClick={downloadChat} title="Download Chat">
          <Download className="h-5 w-5" />
          <span className="sr-only">Download Chat</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={resetChat} title="Reset Chat">
          <RotateCw className="h-5 w-5" />
          <span className="sr-only">Reset Chat</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Logout</span>
        </Button>
      </div>
    </header>
  );
}

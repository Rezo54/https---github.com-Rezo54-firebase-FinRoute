
'use client';

import { useState, useRef, ChangeEvent, useTransition } from 'react';
import { FinRouteLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, ChevronsUpDown, LogOut, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useCurrency } from '@/hooks/use-currency';
import { logout } from '@/app/actions';

export function Header() {
  const [avatarSrc, setAvatarSrc] = useState("https://placehold.co/100x100.png");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currency, setCurrency } = useCurrency();
  const [isPending, startTransition] = useTransition();


  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarSrc(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex items-center">
          <FinRouteLogo className="h-6 w-6 mr-2 text-primary" />
          <h1 className="font-headline text-2xl font-bold text-foreground">FinRoute</h1>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[80px]">
                {currency}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setCurrency('USD')}>USD</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setCurrency('EUR')}>EUR</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setCurrency('JPY')}>JPY</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setCurrency('GBP')}>GBP</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setCurrency('NGN')}>NGN</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setCurrency('ZAR')}>ZAR</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setCurrency('KES')}>KES</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setCurrency('CNY')}>CNY</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setCurrency('INR')}>INR</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setCurrency('SGD')}>SGD</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
               <Avatar className="cursor-pointer">
                <AvatarImage src={avatarSrc} alt="User" />
                <AvatarFallback>
                  <User />
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleAvatarClick}>
                <Upload className="mr-2 h-4 w-4" />
                <span>Upload Photo</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} disabled={isPending}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            className="hidden" 
            accept="image/*"
          />

        </div>
      </div>
    </header>
  );
}

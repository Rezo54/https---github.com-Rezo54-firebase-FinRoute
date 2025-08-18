import { FinRouteLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex items-center">
          <FinRouteLogo className="h-6 w-6 mr-2 text-primary" />
          <h1 className="font-headline text-2xl font-bold text-foreground">FinRoute</h1>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Avatar>
            <AvatarImage src="https://placehold.co/100x100.png" alt="User" />
            <AvatarFallback>
              <User />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

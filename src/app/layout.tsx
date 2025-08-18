import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'FinRoute',
  description: 'Your personalized route to financial freedom.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>
        <Suspense>
          {children}
        </Suspense>
        <Toaster />
      </body>
    </html>
  );
}

    
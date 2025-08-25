
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const tabs = [
    { name: 'Home', href: '/dashboard' },
    { name: 'Goals', href: '/dashboard/goals' },
];

export function DashboardTabs() {
    const pathname = usePathname();

    return (
        <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => (
                    <Link
                        key={tab.name}
                        href={tab.href}
                        className={cn(
                            'whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium',
                            pathname === tab.href
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:border-gray-300 hover:text-foreground'
                        )}
                    >
                        {tab.name}
                    </Link>
                ))}
            </nav>
        </div>
    );
}

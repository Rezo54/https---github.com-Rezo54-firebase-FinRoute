'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

type Props = {
  /** name of the hidden input the server action will read (expects ISO-ish "YYYY-MM-DDTHH:mm") */
  name: string;
  /** optional ISO default value */
  defaultValue?: string | null;
};

export default function RunAtPicker({ name, defaultValue }: Props) {
  const defaultDate = defaultValue ? new Date(defaultValue) : undefined;

  const [date, setDate] = React.useState<Date | undefined>(defaultDate);
  const [time, setTime] = React.useState<string>(
    defaultDate ? format(defaultDate, 'HH:mm') : '09:00'
  );

  // Combine to "YYYY-MM-DDTHH:mm" (server turns this into ISO with your action)
  const hiddenValue = React.useMemo(() => {
    if (!date) return '';
    const yyyyMmDd = format(date, 'yyyy-MM-dd');
    return `${yyyyMmDd}T${time}`;
  }, [date, time]);

  const buttonLabel = date ? `${format(date, 'PPP')} ${time}` : 'Pick a date';

  return (
    <div className="flex flex-col gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {buttonLabel}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => setDate(d)}
            initialFocus
          />
          <div className="border-t p-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-8 w-[130px]"
            />
          </div>
        </PopoverContent>
      </Popover>

      {/* Server action reads this */}
      <input type="hidden" name={name} value={hiddenValue} />
    </div>
  );
}

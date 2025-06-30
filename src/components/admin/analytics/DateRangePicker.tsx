import React, { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Button } from '../../ui/button';
import { Calendar } from '../../ui/calendar';
import { cn } from '../../../lib/utils';

interface DateRangePickerProps {
  from: Date;
  to: Date;
  onUpdate: (range: { from: Date; to: Date }) => void;
  className?: string;
}

export function DateRangePicker({ from, to, onUpdate, className }: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from,
    to,
  });

  // Predefined date ranges
  const handlePredefinedRange = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    
    setDate({ from, to });
    onUpdate({ from, to });
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b">
            <div className="flex gap-2 justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePredefinedRange(7)}
              >
                Last 7 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePredefinedRange(30)}
              >
                Last 30 days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePredefinedRange(90)}
              >
                Last 90 days
              </Button>
            </div>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(newDate) => {
              setDate(newDate);
              if (newDate?.from && newDate?.to) {
                onUpdate({ from: newDate.from, to: newDate.to });
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
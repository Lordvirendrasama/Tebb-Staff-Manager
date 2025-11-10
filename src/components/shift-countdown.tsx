'use client';

import { useState, useEffect } from 'react';
import { addHours, differenceInMilliseconds } from 'date-fns';
import { Timer } from 'lucide-react';

interface ShiftCountdownProps {
  clockInTime: Date | string;
  standardWorkHours: number;
}

export function ShiftCountdown({ clockInTime, standardWorkHours }: ShiftCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (!clockInTime || !standardWorkHours) return;

    const clockInDate = new Date(clockInTime);
    const shiftEndTime = addHours(clockInDate, standardWorkHours);

    const interval = setInterval(() => {
      const now = new Date();
      const difference = differenceInMilliseconds(shiftEndTime, now);

      if (difference <= 0) {
        setTimeRemaining('Shift Complete');
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      setTimeRemaining(formattedTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [clockInTime, standardWorkHours]);

  if (!timeRemaining) {
    return null;
  }
  
  const isComplete = timeRemaining === 'Shift Complete';

  return (
    <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-2 pt-2">
      <Timer className="h-4 w-4" />
      <span>
        {isComplete ? 'Shift Complete' : `${timeRemaining} remaining`}
      </span>
    </div>
  );
}

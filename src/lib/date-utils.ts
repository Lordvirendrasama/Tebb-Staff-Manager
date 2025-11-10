import { formatInTimeZone } from 'date-fns-tz';

const TIME_ZONE = 'Asia/Kolkata';

export const formatIST = (date: Date | string | number, formatString: string): string => {
    return formatInTimeZone(date, TIME_ZONE, formatString);
};

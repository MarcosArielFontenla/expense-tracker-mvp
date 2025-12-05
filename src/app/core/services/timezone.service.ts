import { Injectable } from '@angular/core';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface TimezoneInfo {
    value: string; // IANA timezone identifier
    label: string; // Display name with offset
    region: string; // Geographic region
}

@Injectable({
    providedIn: 'root'
})
export class TimezoneService {
    private readonly supportedTimezones: TimezoneInfo[] = [
        { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)', region: 'América' },
        { value: 'America/New_York', label: 'New York (GMT-5/-4)', region: 'América' },
        { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8/-7)', region: 'América' },
        { value: 'America/Chicago', label: 'Chicago (GMT-6/-5)', region: 'América' },
        { value: 'America/Denver', label: 'Denver (GMT-7/-6)', region: 'América' },
        { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6/-5)', region: 'América' },
        { value: 'America/Santiago', label: 'Santiago (GMT-4/-3)', region: 'América' },
        { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)', region: 'América' },
        { value: 'America/Lima', label: 'Lima (GMT-5)', region: 'América' },
        { value: 'America/Bogota', label: 'Bogotá (GMT-5)', region: 'América' },
        { value: 'Europe/London', label: 'London (GMT+0/+1)', region: 'Europa' },
        { value: 'Europe/Paris', label: 'Paris (GMT+1/+2)', region: 'Europa' },
        { value: 'Europe/Madrid', label: 'Madrid (GMT+1/+2)', region: 'Europa' },
        { value: 'Europe/Berlin', label: 'Berlin (GMT+1/+2)', region: 'Europa' },
        { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)', region: 'Asia' },
        { value: 'Asia/Shanghai', label: 'Shanghai (GMT+8)', region: 'Asia' },
        { value: 'Asia/Dubai', label: 'Dubai (GMT+4)', region: 'Asia' },
        { value: 'Australia/Sydney', label: 'Sydney (GMT+10/+11)', region: 'Oceanía' },
        { value: 'UTC', label: 'UTC (GMT+0)', region: 'Universal' }
    ];

    constructor() { }

    /**
     * Get all supported timezones
     */
    getSupportedTimezones(): TimezoneInfo[] {
        return this.supportedTimezones;
    }

    /**
     * Get timezone info by value
     */
    getTimezoneInfo(value: string): TimezoneInfo | undefined {
        return this.supportedTimezones.find(tz => tz.value === value);
    }

    /**
     * Format a date in a specific timezone
     * @param date Date to format
     * @param timezone IANA timezone identifier
     * @param formatStr Format string (date-fns format)
     */
    formatInTimezone(date: Date | string, timezone: string, formatStr: string): string {
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            return formatInTimeZone(dateObj, timezone, formatStr, { locale: es });
        } catch (error) {
            console.error('Error formatting date in timezone:', error);
            return format(new Date(date), formatStr, { locale: es });
        }
    }

    /**
     * Convert UTC date to user's timezone
     * @param utcDate UTC date from backend
     * @param timezone User's timezone
     */
    toUserTimezone(utcDate: Date | string, timezone: string): Date {
        try {
            const dateObj = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
            return toZonedTime(dateObj, timezone);
        } catch (error) {
            console.error('Error converting to user timezone:', error);
            return new Date(utcDate);
        }
    }

    /**
     * Convert user's local date to UTC for backend
     * @param localDate Local date in user's timezone
     * @param timezone User's timezone
     */
    toUTC(localDate: Date | string, timezone: string): Date {
        try {
            const dateObj = typeof localDate === 'string' ? new Date(localDate) : localDate;
            return fromZonedTime(dateObj, timezone);
        } catch (error) {
            console.error('Error converting to UTC:', error);
            return new Date(localDate);
        }
    }

    /**
     * Get current time in a specific timezone
     * @param timezone IANA timezone identifier
     */
    getCurrentTimeInTimezone(timezone: string): string {
        return this.formatInTimezone(new Date(), timezone, 'PPpp');
    }

    /**
     * Format date for HTML date input (yyyy-MM-dd)
     * @param date Date to format
     * @param timezone User's timezone
     */
    formatForDateInput(date: Date | string, timezone: string): string {
        return this.formatInTimezone(date, timezone, 'yyyy-MM-dd');
    }
}

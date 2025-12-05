import { Pipe, PipeTransform } from '@angular/core';
import { TimezoneService } from '../services/timezone.service';
import { AuthService } from '../services/auth.service';

@Pipe({
    name: 'tzDate',
    standalone: true
})
export class TimezoneDatePipe implements PipeTransform {
    constructor(
        private timezoneService: TimezoneService,
        private authService: AuthService) { }

    transform(value: Date | string | null | undefined, formatStr: string = 'mediumDate'): string {
        if (!value) {
            return '';
        }

        // Get user's timezone from auth service
        const user = this.authService.getUser();
        const timezone = user?.timezone || 'America/Argentina/Buenos_Aires';

        // Convert common Angular DatePipe formats to date-fns formats
        const formatMapping: { [key: string]: string } = {
            'short': 'dd/MM/yy HH:mm',
            'medium': 'dd/MM/yyyy HH:mm:ss',
            'long': "dd 'de' MMMM 'de' yyyy HH:mm:ss",
            'full': "EEEE, dd 'de' MMMM 'de' yyyy HH:mm:ss",
            'shortDate': 'dd/MM/yy',
            'mediumDate': 'dd/MM/yyyy',
            'longDate': "dd 'de' MMMM 'de' yyyy",
            'fullDate': "EEEE, dd 'de' MMMM 'de' yyyy",
            'shortTime': 'HH:mm',
            'mediumTime': 'HH:mm:ss',
            'longTime': 'HH:mm:ss z',
            'fullTime': 'HH:mm:ss zzzz'
        };

        const dateFnsFormat = formatMapping[formatStr] || formatStr;

        return this.timezoneService.formatInTimezone(value, timezone, dateFnsFormat);
    }
}

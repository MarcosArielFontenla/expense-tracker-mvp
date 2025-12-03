import { Injectable } from '@angular/core';

export interface CurrencyInfo {
    code: string;
    name: string;
    symbol: string;
    locale: string;
}

@Injectable({
    providedIn: 'root'
})
export class CurrencyService {
    private readonly supportedCurrencies: CurrencyInfo[] = [
        { code: 'USD', name: 'Dólar Estadounidense', symbol: '$', locale: 'en-US' },
        { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE' },
        { code: 'GBP', name: 'Libra Esterlina', symbol: '£', locale: 'en-GB' },
        { code: 'ARS', name: 'Peso Argentino', symbol: '$', locale: 'es-AR' },
        { code: 'MXN', name: 'Peso Mexicano', symbol: '$', locale: 'es-MX' },
        { code: 'CLP', name: 'Peso Chileno', symbol: '$', locale: 'es-CL' },
        { code: 'BRL', name: 'Real Brasileño', symbol: 'R$', locale: 'pt-BR' },
        { code: 'COP', name: 'Peso Colombiano', symbol: '$', locale: 'es-CO' },
        { code: 'PEN', name: 'Sol Peruano', symbol: 'S/', locale: 'es-PE' },
        { code: 'UYU', name: 'Peso Uruguayo', symbol: '$', locale: 'es-UY' }
    ];

    constructor() { }

    /**
     * Get all supported currencies
     */
    getSupportedCurrencies(): CurrencyInfo[] {
        return this.supportedCurrencies;
    }

    /**
     * Get information for a specific currency
     */
    getCurrencyInfo(code: string): CurrencyInfo | undefined {
        return this.supportedCurrencies.find(c => c.code === code);
    }

    /**
     * Get currency symbol for a given code
     */
    getCurrencySymbol(code: string): string {
        const currency = this.getCurrencyInfo(code);
        return currency ? currency.symbol : '$';
    }

    /**
     * Check if a currency code is supported
     */
    isCurrencySupported(code: string): boolean {
        return this.supportedCurrencies.some(c => c.code === code);
    }
}

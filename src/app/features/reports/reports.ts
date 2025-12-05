import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsService, DetailedMonthlyReport, CustomRangeReport } from './services/reports.service';
import { CategoriesService } from '../categories/services/categories.service';
import { Category } from '../../core/models/category.model';
import { Transaction } from '../../core/models/transaction.model';
import { AuthService } from '../../core/services/auth.service';

type ReportType = 'monthly' | 'custom' | 'category';

@Component({
  selector: 'app-reports',
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
  standalone: true
})
export class Reports implements OnInit {
  // Report Type
  reportType: ReportType = 'monthly';

  // Filters
  selectedMonth: number;
  selectedYear: number;
  startDate: string = '';
  endDate: string = '';
  selectedCategory: string = '';
  selectedType: string = 'all';

  // Data
  transactions: Transaction[] = [];
  categories: Category[] = [];
  totalIncome = 0;
  totalExpenses = 0;
  balance = 0;

  // UI State
  isLoading = false;
  userCurrency: string = 'USD';

  months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  years: number[] = [];

  constructor(
    private reportsService: ReportsService,
    private categoriesService: CategoriesService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object) {
    const today = new Date();
    this.selectedMonth = today.getMonth() + 1;
    this.selectedYear = today.getFullYear();

    // Generate last 5 years
    for (let i = 0; i < 5; i++) {
      this.years.push(this.selectedYear - i);
    }

    // Set default date range (current month)
    this.startDate = new Date(this.selectedYear, this.selectedMonth - 1, 1).toISOString().split('T')[0];
    this.endDate = new Date(this.selectedYear, this.selectedMonth, 0).toISOString().split('T')[0];
  }

  public ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Get user currency
      this.authService.currentUser$.subscribe((user: any) => {
        if (user) {
          this.userCurrency = user.currency || 'USD';
        }
      });

      this.loadCategories();
      this.loadReport();
    }
  }

  public loadCategories(): void {
    this.categoriesService.getCategories().subscribe(cats => {
      this.categories = cats;
    });
  }

  public loadReport(): void {
    this.isLoading = true;

    switch (this.reportType) {
      case 'monthly':
        this.loadMonthlyReport();
        break;
      case 'custom':
        this.loadCustomRangeReport();
        break;
      case 'category':
        this.loadCategoryReport();
        break;
    }
  }

  public loadMonthlyReport(): void {
    this.reportsService.getDetailedMonthlyReport(this.selectedMonth, this.selectedYear)
      .subscribe({
        next: (data: DetailedMonthlyReport) => {
          this.transactions = data.transactions;
          this.totalIncome = data.summary.totalIncome;
          this.totalExpenses = data.summary.totalExpenses;
          this.balance = data.summary.balance;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading monthly report:', err);
          this.isLoading = false;
        }
      });
  }

  public loadCustomRangeReport(): void {
    const type = this.selectedType === 'all' ? undefined : this.selectedType;
    const categoryId = this.selectedCategory || undefined;

    this.reportsService.getCustomRangeReport(this.startDate, this.endDate, categoryId, type)
      .subscribe({
        next: (data: CustomRangeReport) => {
          this.transactions = data.transactions;
          this.totalIncome = data.summary.totalIncome;
          this.totalExpenses = data.summary.totalExpenses;
          this.balance = data.summary.balance;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading custom range report:', err);
          this.isLoading = false;
        }
      });
  }

  public loadCategoryReport(): void {
    if (!this.selectedCategory) {
      this.isLoading = false;
      return;
    }

    this.reportsService.getCategoryDetailedReport(
      this.selectedCategory,
      this.startDate || undefined,
      this.endDate || undefined
    ).subscribe({
      next: (data) => {
        this.transactions = data.transactions;
        this.calculateSummaryFromTransactions();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading category report:', err);
        this.isLoading = false;
      }
    });
  }

  public calculateSummaryFromTransactions(): void {
    this.totalIncome = 0;
    this.totalExpenses = 0;

    this.transactions.forEach(t => {
      if (t.type === 'income') {
        this.totalIncome += Number(t.amount);
      } else {
        this.totalExpenses += Number(t.amount);
      }
    });

    this.balance = this.totalIncome - this.totalExpenses;
  }

  public onReportTypeChange(): void {
    // Reset filters
    this.transactions = [];
    this.loadReport();
  }

  public onFilterChange(): void {
    this.loadReport();
  }

  public getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Sin categoría';
  }

  public getCategoryColor(categoryId: string): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.color : '#999';
  }

  public getTransactionTypeClass(type: string): string {
    return type === 'income' ? 'text-green-600' : 'text-red-600';
  }

  public getTransactionTypeLabel(type: string): string {
    return type === 'income' ? 'Ingreso' : 'Gasto';
  }

  // Export Functions
  public exportToCSV(): void {
    if (this.transactions.length === 0) {
      alert('No hay transacciones para exportar');
      return;
    }

    // Create CSV content
    const headers = ['Fecha', 'Categoría', 'Descripción', 'Tipo', 'Monto'];
    const csvContent = [
      headers.join(','),
      ...this.transactions.map(t => {
        const date = new Date(t.date).toLocaleDateString('es-ES');
        const category = this.getCategoryName(t.categoryId);
        const description = (t.note || '-').replace(/"/g, '""');
        const type = this.getTransactionTypeLabel(t.type);
        const amount = t.amount;

        return `"${date}","${category}","${description}","${type}","${amount}"`;
      })
    ].join('\n');

    // Add summary
    const summary = [
      '',
      'Resumen',
      `Total Ingresos,${this.totalIncome}`,
      `Total Gastos,${this.totalExpenses}`,
      `Balance,${this.balance}`
    ].join('\n');

    const fullContent = csvContent + '\n' + summary;

    // Add UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + fullContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_${this.getReportFileName()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public async exportToExcel(): Promise<void> {
    if (this.transactions.length === 0) {
      alert('No hay transacciones para exportar');
      return;
    }

    try {
      // Dynamically import xlsx
      const XLSX = await import('xlsx');

      // Create transactions data
      const transactionsData = this.transactions.map(t => ({
        'Fecha': new Date(t.date).toLocaleDateString('es-ES'),
        'Categoría': this.getCategoryName(t.categoryId),
        'Descripción': t.note || '-',
        'Tipo': this.getTransactionTypeLabel(t.type),
        'Monto': t.type === 'income' ? t.amount : -t.amount
      }));

      // Create transactions worksheet
      const wsTransactions = XLSX.utils.json_to_sheet(transactionsData);

      // Set column widths
      wsTransactions['!cols'] = [
        { wch: 12 },  // Fecha
        { wch: 20 },  // Categoría
        { wch: 35 },  // Descripción
        { wch: 10 },  // Tipo
        { wch: 15 }   // Monto
      ];

      // Create summary data
      const summaryData = [
        { 'Concepto': 'Total Ingresos', 'Valor': this.totalIncome },
        { 'Concepto': 'Total Gastos', 'Valor': this.totalExpenses },
        { 'Concepto': 'Balance', 'Valor': this.balance },
        { 'Concepto': '', 'Valor': '' },
        { 'Concepto': 'Período', 'Valor': this.getReportTypeLabel() },
        { 'Concepto': 'Total Transacciones', 'Valor': this.transactions.length }
      ];

      // Create summary worksheet
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      wsSummary['!cols'] = [
        { wch: 20 },
        { wch: 15 }
      ];

      // Create workbook and add sheets
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transacciones');
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');

      // Download file
      XLSX.writeFile(wb, `reporte_${this.getReportFileName()}.xlsx`);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Error al generar el archivo Excel');
    }
  }

  public async exportToPDF(): Promise<void> {
    if (this.transactions.length === 0) {
      alert('No hay transacciones para exportar');
      return;
    }

    try {
      // Dynamically import jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.text('Reporte Financiero', 14, 20);

      // Add report type and date
      doc.setFontSize(11);
      doc.text(`Tipo: ${this.getReportTypeLabel()}`, 14, 30);
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 14, 36);

      // Add summary
      doc.setFontSize(14);
      doc.text('Resumen', 14, 46);
      doc.setFontSize(10);
      doc.text(`Total Ingresos: $${this.totalIncome.toFixed(2)}`, 14, 54);
      doc.text(`Total Gastos: $${this.totalExpenses.toFixed(2)}`, 14, 60);
      doc.text(`Balance: $${this.balance.toFixed(2)}`, 14, 66);

      // Add transactions table
      doc.setFontSize(14);
      doc.text('Transacciones', 14, 76);

      let yPos = 84;
      doc.setFontSize(9);

      // Table headers
      doc.setFont('helvetica', 'bold');
      doc.text('Fecha', 14, yPos);
      doc.text('Categoría', 44, yPos);
      doc.text('Tipo', 94, yPos);
      doc.text('Monto', 124, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');

      // Table rows (limit to first 30 transactions to fit in one page)
      const limitedTransactions = this.transactions.slice(0, 30);

      for (const t of limitedTransactions) {
        if (yPos > 280)
          break; // Page limit

        const date = new Date(t.date).toLocaleDateString('es-ES');
        const category = this.getCategoryName(t.categoryId).substring(0, 20);
        const type = this.getTransactionTypeLabel(t.type);
        const amount = `$${t.amount}`;

        doc.text(date, 14, yPos);
        doc.text(category, 44, yPos);
        doc.text(type, 94, yPos);
        doc.text(amount, 124, yPos);
        yPos += 6;
      }

      if (this.transactions.length > 30) {
        doc.text(`... y ${this.transactions.length - 30} transacciones más`, 14, yPos + 6);
      }

      // Save PDF
      doc.save(`reporte_${this.getReportFileName()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF');
    }
  }

  public printReport(): void {
    window.print();
  }

  public getReportFileName(): string {
    const date = new Date().toDateString().split('T')[0];

    switch (this.reportType) {
      case 'monthly':
        return `mensual_${this.selectedMonth}_${this.selectedYear}`;
      case 'custom':
        return `personalizado_${date}`;
      case 'category':
        const catName = this.getCategoryName(this.selectedCategory).toLowerCase().replace(/\s+/g, '_');
        return `categoria_${catName}_${date}`;
      default:
        return `reporte_${date}`;
    }
  }

  public getReportTypeLabel(): string {
    switch (this.reportType) {
      case 'monthly':
        const month = this.months.find(m => m.value === this.selectedMonth);
        return `Mensual - ${month?.label} ${this.selectedYear}`;
      case 'custom':
        return `Rango Personalizado - ${this.startDate} a ${this.endDate}`;
      case 'category':
        return `Por Categoría - ${this.getCategoryName(this.selectedCategory)}`;
      default:
        return 'Reporte';
    }
  }
}
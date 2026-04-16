import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
    selector: 'app-month-year-picker',
    imports: [CommonModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MonthYearPickerComponent),
            multi: true
        }
    ],
    templateUrl: './month-year-picker.component.html',
    styleUrl: './month-year-picker.component.scss'
})
export class MonthYearPickerComponent implements ControlValueAccessor {
  @Input() label = 'Mes';
  @Input() placeholder = 'MM/YYYY';
  @Input() hint = '';
  @Input() separator = '/';
  @Input() panelClass = 'app-month-year-picker-panel';
  @Input() required = false;

  value: Date | null = null;
  disabled = false;

  private onChange: (value: Date | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: Date | null): void {
    this.value = value instanceof Date && !Number.isNaN(value.getTime()) ? new Date(value) : null;
  }

  registerOnChange(fn: (value: Date | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  get displayValue(): string {
    if (!this.value || Number.isNaN(this.value.getTime())) return '';
    const mm = String(this.value.getMonth() + 1).padStart(2, '0');
    const yyyy = this.value.getFullYear();
    return `${mm}${this.separator}${yyyy}`;
  }

  chosenYearHandler(normalizedYear: Date): void {
    const current = this.value ?? new Date();
    const updated = new Date(current);
    updated.setFullYear(normalizedYear.getFullYear(), updated.getMonth(), 1);
    this.value = updated;
  }

  chosenMonthHandler(normalizedMonth: Date, datepicker: MatDatepicker<Date>): void {
    const current = this.value ?? new Date();
    const updated = new Date(current);
    updated.setFullYear(normalizedMonth.getFullYear(), normalizedMonth.getMonth(), 1);
    this.value = updated;
    this.onChange(updated);
    this.onTouched();
    datepicker.close();
  }

  markTouched(): void {
    this.onTouched();
  }
}

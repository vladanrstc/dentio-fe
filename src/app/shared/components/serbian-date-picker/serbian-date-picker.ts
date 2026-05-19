import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  forwardRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';

import { fromIsoDate, fromIsoDateTime, toIsoDate, toIsoDateTime } from '../../../core/utils/formatters';

@Component({
  selector: 'app-serbian-date-picker',
  templateUrl: './serbian-date-picker.html',
  styleUrl: './serbian-date-picker.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SerbianDatePicker),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => SerbianDatePicker),
      multi: true,
    },
  ],
})
export class SerbianDatePicker implements ControlValueAccessor, Validator {
  readonly label = input('');
  readonly placeholder = input('dd.MM.yyyy.');
  readonly errorText = input('Unesite datum u formatu dd.MM.yyyy.');
  readonly mode = input<'date' | 'datetime'>('date');

  protected readonly displayValue = signal('');
  protected readonly isoValue = signal('');
  protected readonly disabled = signal(false);
  protected readonly invalidFormat = signal(false);

  private readonly nativeDateInput = viewChild<ElementRef<HTMLInputElement>>('nativeDateInput');
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  writeValue(value: string | null | undefined): void {
    const isoDate = this.normalizeValue(value);

    this.isoValue.set(isoDate);
    this.displayValue.set(this.formatValue(isoDate));
    this.invalidFormat.set(false);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  validate(_control: AbstractControl): ValidationErrors | null {
    return this.invalidFormat() ? { serbianDate: true } : null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  protected handleTextInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const trimmedValue = value.trim();

    this.displayValue.set(value);

    if (!trimmedValue) {
      this.setValidValue('');
      return;
    }

    const isoDate = this.normalizeValue(trimmedValue);

    if (!isoDate) {
      this.invalidFormat.set(true);
      this.onValidatorChange();
      return;
    }

    this.setValidValue(isoDate);
    this.displayValue.set(this.formatValue(isoDate));
  }

  protected handleNativeDateChange(event: Event): void {
    const nativeValue = (event.target as HTMLInputElement).value;
    const value = this.mode() === 'datetime' ? nativeValue.replace('T', ' ') : nativeValue;

    this.setValidValue(value);
    this.displayValue.set(this.formatValue(value));
    this.onTouched();
  }

  protected markTouched(): void {
    this.onTouched();
  }

  protected openPicker(): void {
    const inputElement = this.nativeDateInput()?.nativeElement;

    if (!inputElement) {
      return;
    }

    const pickerInput = inputElement as HTMLInputElement & { showPicker?: () => void };

    if (typeof pickerInput.showPicker === 'function') {
      pickerInput.showPicker();
      return;
    }

    pickerInput.focus();
    pickerInput.click();
  }

  private setValidValue(value: string): void {
    this.isoValue.set(value);
    this.invalidFormat.set(false);
    this.onChange(value);
    this.onValidatorChange();
  }

  protected nativeInputType(): string {
    return this.mode() === 'datetime' ? 'datetime-local' : 'date';
  }

  protected nativeInputValue(): string {
    return this.mode() === 'datetime' ? this.isoValue().replace(' ', 'T') : this.isoValue();
  }

  private normalizeValue(value: string | null | undefined): string {
    return this.mode() === 'datetime' ? toIsoDateTime(value) : toIsoDate(value);
  }

  private formatValue(value: string): string {
    if (!value) {
      return '';
    }

    return this.mode() === 'datetime' ? fromIsoDateTime(value) : fromIsoDate(value);
  }
}

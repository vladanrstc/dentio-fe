import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { SerbianDatePicker } from './serbian-date-picker';

@Component({
  imports: [ReactiveFormsModule, SerbianDatePicker],
  template: `
    <form [formGroup]="form">
      <app-serbian-date-picker label="Datum" formControlName="date" />
    </form>
  `,
})
class SerbianDatePickerHost {
  readonly form = new FormGroup({
    date: new FormControl('2026-05-13'),
  });
}

@Component({
  imports: [ReactiveFormsModule, SerbianDatePicker],
  template: `
    <form [formGroup]="form">
      <app-serbian-date-picker mode="datetime" formControlName="dateTime" />
    </form>
  `,
})
class SerbianDateTimePickerHost {
  readonly form = new FormGroup({
    dateTime: new FormControl('2026-05-13 09:45'),
  });
}

describe('SerbianDatePicker', () => {
  let fixture: ComponentFixture<SerbianDatePickerHost>;
  let host: SerbianDatePickerHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SerbianDatePickerHost],
    }).compileComponents();

    fixture = TestBed.createComponent(SerbianDatePickerHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('prikazuje ISO vrednost kao srpski datum', () => {
    const input = textInput();

    expect(input.value).toBe('13.05.2026.');
    expect(host.form.controls.date.value).toBe('2026-05-13');
  });

  it('ručni ispravan unos čuva ISO vrednost u formi', () => {
    const input = textInput();

    input.value = '14.05.2026.';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.form.controls.date.value).toBe('2026-05-14');
    expect(input.value).toBe('14.05.2026.');
  });

  it('ručni neispravan unos označava formu kao neispravnu', () => {
    const input = textInput();

    input.value = 'nije datum';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.form.invalid).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Unesite datum u formatu dd.MM.yyyy.');
  });

  it('izbor iz native kalendara čuva ISO vrednost i prikazuje srpski datum', () => {
    const nativeDateInput = fixture.debugElement.query(By.css('input[type="date"]')).nativeElement as HTMLInputElement;

    nativeDateInput.value = '2026-06-01';
    nativeDateInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(host.form.controls.date.value).toBe('2026-06-01');
    expect(textInput().value).toBe('01.06.2026.');
  });

  it('podržava izbor datuma i vremena kroz isti picker', () => {
    const dateTimeFixture = TestBed.createComponent(SerbianDateTimePickerHost);
    dateTimeFixture.detectChanges();
    const dateTimeHost = dateTimeFixture.componentInstance;
    const input = dateTimeFixture.debugElement.query(By.css('input[type="text"]')).nativeElement as HTMLInputElement;
    const nativeDateTimeInput = dateTimeFixture.debugElement.query(By.css('input[type="datetime-local"]'))
      .nativeElement as HTMLInputElement;

    expect(input.value).toBe('13.05.2026. 09:45');

    nativeDateTimeInput.value = '2026-06-01T10:30';
    nativeDateTimeInput.dispatchEvent(new Event('change'));
    dateTimeFixture.detectChanges();

    expect(dateTimeHost.form.controls.dateTime.value).toBe('2026-06-01 10:30');
    expect(input.value).toBe('01.06.2026. 10:30');
  });

  function textInput(): HTMLInputElement {
    return fixture.debugElement.query(By.css('input[type="text"]')).nativeElement as HTMLInputElement;
  }
});

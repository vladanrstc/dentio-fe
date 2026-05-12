import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import {
  ReportFormat,
  ReportFrequency,
  ReportSettingsItem,
  ReportSubscription,
  ReportSubscriptionPayload,
} from '../../core/models/api.models';
import { ReportsApi } from '../../core/services/reports-api.service';
import { unwrapCollection } from '../../core/utils/http-helpers';
import {
  REPORT_FORMAT_OPTIONS,
  REPORT_FREQUENCY_OPTIONS,
  ReportSettingsMode,
  reportOptionDescription,
  reportOptionLabel,
  reportOptionsForMode,
} from '../../core/utils/report-options';

@Component({
  selector: 'app-report-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './report-settings.html',
  styleUrl: './report-settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportSettings {
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly reportsApi = inject(ReportsApi);
  private readonly mode = (this.route.snapshot.data['reportMode'] as ReportSettingsMode | undefined) ?? 'company';

  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly savingReport = signal<string | null>(null);
  protected readonly frequencyOptions = REPORT_FREQUENCY_OPTIONS;
  protected readonly formatOptions = REPORT_FORMAT_OPTIONS;
  protected readonly reports = computed(() => reportOptionsForMode(this.mode));
  protected readonly isAdmin = this.mode === 'admin';
  protected readonly title = this.isAdmin ? 'Podešavanja platformskih izveštaja' : 'Podešavanja izveštaja';
  protected readonly subtitle = this.isAdmin
    ? 'Izaberite koliko često platform administrator dobija pregled kompanija.'
    : 'Izaberite koliko često ordinacija dobija preglede pacijenata, termina i finansija.';
  protected readonly form = this.formBuilder.group({
    reports: this.formBuilder.array(
      this.reports().map((report) =>
        this.formBuilder.nonNullable.group({
          report: [report.key],
          frequency: ['off' as ReportFrequency],
          format: ['csv' as ReportFormat],
        }),
      ),
    ),
  });

  constructor() {
    this.loadSubscriptions();
  }

  protected get settingsControls(): FormArray {
    return this.form.controls.reports;
  }

  protected reportLabel(reportKey: string): string {
    return reportOptionLabel(reportKey);
  }

  protected reportDescription(reportKey: string): string {
    return reportOptionDescription(reportKey);
  }

  protected saveSetting(index: number): void {
    const value = this.settingsControls.at(index).getRawValue() as ReportSettingsItem;
    const payload: ReportSubscriptionPayload = {
      frequency: value.frequency,
      format: value.format,
    };

    this.error.set('');
    this.success.set('');
    this.savingReport.set(value.report);

    const request = this.isAdmin
      ? this.reportsApi.saveAdminReportSubscription(value.report, payload)
      : this.reportsApi.saveCompanyReportSubscription(value.report, payload);

    request.subscribe({
      next: () => {
        this.success.set(`${this.reportLabel(value.report)} podešavanja su sačuvana.`);
        this.savingReport.set(null);
      },
      error: () => {
        this.error.set('Podešavanja nisu sačuvana. Pokušajte ponovo.');
        this.savingReport.set(null);
      },
    });
  }

  private loadSubscriptions(): void {
    this.loading.set(true);
    this.error.set('');

    const request = this.isAdmin
      ? this.reportsApi.getAdminReportSubscriptions()
      : this.reportsApi.getCompanyReportSubscriptions();

    request.subscribe({
      next: (response) => {
        this.applySubscriptions(unwrapCollection(response));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Podešavanja izveštaja trenutno nisu dostupna.');
        this.loading.set(false);
      },
    });
  }

  private applySubscriptions(subscriptions: ReportSubscription[]): void {
    for (const subscription of subscriptions) {
      const reportKey = subscription.report ?? subscription.report_key;
      const control = this.settingsControls.controls.find((item) => item.value.report === reportKey);

      if (!control) {
        continue;
      }

      control.patchValue({
        frequency: subscription.frequency,
        format: subscription.format,
      });
    }
  }
}

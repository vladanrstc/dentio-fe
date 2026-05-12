import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { Api, CollectionResponse, CompanyTeamMember } from '../../core/services/api';
import { roleLabel } from '../../core/utils/role-label';

@Component({
  selector: 'app-team',
  templateUrl: './team.html',
  styleUrl: './team.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Team {
  private readonly api = inject(Api);

  protected readonly members = signal<CompanyTeamMember[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly roleLabel = roleLabel;

  constructor() {
    this.api.getCompanyTeam().subscribe({
      next: (response) => {
        this.members.set(this.unwrapCollection(response));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Tim trenutno nije dostupan.');
        this.loading.set(false);
      },
    });
  }

  protected memberName(member: CompanyTeamMember): string {
    return member.full_name || member.name || `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim() || '-';
  }

  protected formatDate(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: value.includes('T') ? '2-digit' : undefined,
      minute: value.includes('T') ? '2-digit' : undefined,
    }).format(new Date(value));
  }

  protected canDeleteMember(member: CompanyTeamMember): boolean {
    return member.role === 'dentist' || member.role === 'nurse';
  }

  protected deleteTeamMember(member: CompanyTeamMember): void {
    const confirmed = confirm(`Da li ste sigurni da želite da obrišete člana tima ${this.memberName(member)}?`);

    if (!confirmed) {
      return;
    }

    this.success.set('');
    this.error.set('');

    this.api.deleteTeamMember(member.id).subscribe({
      next: () => {
        this.success.set('Član tima je obrisan.');
        this.members.update((members) => members.filter((item) => item.id !== member.id));
      },
      error: () => {
        this.error.set('Brisanje člana tima nije uspelo.');
      },
    });
  }

  private unwrapCollection<T>(response: CollectionResponse<T>): T[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    return response.data.data;
  }
}

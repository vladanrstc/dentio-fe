import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { CompanyTeamMember } from '../../core/models/api.models';
import { TeamApi } from '../../core/services/team-api.service';
import { formatDate } from '../../core/utils/formatters';
import { unwrapCollection } from '../../core/utils/http-helpers';
import { roleLabel } from '../../core/utils/role-label';

@Component({
  selector: 'app-team',
  templateUrl: './team.html',
  styleUrl: './team.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Team {
  private readonly teamApi = inject(TeamApi);

  protected readonly members = signal<CompanyTeamMember[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly roleLabel = roleLabel;
  protected readonly formatDate = formatDate;

  constructor() {
    this.teamApi.getCompanyTeam().subscribe({
      next: (response) => {
        this.members.set(unwrapCollection(response));
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

    this.teamApi.deleteTeamMember(member.id).subscribe({
      next: () => {
        this.success.set('Član tima je obrisan.');
        this.members.update((members) => members.filter((item) => item.id !== member.id));
      },
      error: () => {
        this.error.set('Brisanje člana tima nije uspelo.');
      },
    });
  }
}

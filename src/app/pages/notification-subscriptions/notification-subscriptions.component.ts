import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { NotificationSubscription, NotificationType, Profile, ProfileRole } from '../../core/models/data.models';
import { nonNull } from '../../shared/rxjs-operators/non-null';
import { NOTES_ROLES } from '../../../app.routes';

interface NotificationColumn {
  type: NotificationType;
  titleKey: string;
  descriptionKey: string;
}

@Component({
  selector: 'app-notification-subscriptions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    DialogModule,
    CheckboxModule,
    ToastModule,
    TranslateModule,
  ],
  providers: [MessageService],
  template: `
    <div class="card">
      <p-table
        [value]="profiles"
        [stripedRows]="true"
        [tableStyle]="{'min-width': '50rem'}">
        <ng-template pTemplate="header">
          <tr>
            <th>{{ 'CONTENT-MANAGEMENT.PROFILES.TABLE-COLUMNS.NAME' | translate }}</th>
            @for(col of columns; track col.type){
              <th class="bool-cell" style="width: 7rem">
                {{ col.titleKey | translate }}
              </th>
            }
            <th class="action-cell" style="width: 5rem">
              {{ 'CONTENT-MANAGEMENT.NOTIFICATION-SUBSCRIPTIONS.ACTIONS' | translate }}
            </th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-profile>
          <tr>
            <td>{{ profile.first_name }} {{ profile.last_name }}</td>
            @for(col of columns; track col.type){
              <td class="bool-cell">
                @if(isEligible(profile.id, col.type)){
                  <i [class]="isSubscribed(profile.id, col.type) ? 'pi pi-check bool-true' : 'pi pi-times bool-false'"></i>
                } @else {
                  <i class="pi pi-times bool-locked"></i>
                }
              </td>
            }
            <td class="action-cell">
              <p-button
                icon="pi pi-pencil"
                [text]="true"
                severity="secondary"
                size="small"
                (click)="openEdit(profile)">
              </p-button>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog
      [(visible)]="editDialogVisible"
      [style]="{width: '520px'}"
      [header]="dialogHeader"
      [modal]="true"
      [contentStyle]="{overflow: 'visible'}"
      appendTo="body">
      @if(editingProfile){
        <div class="edit-list">
          @for(col of editableColumnsForProfile(editingProfile); track col.type){
            <div class="edit-row">
              <div class="edit-info">
                <label [for]="'notif-' + col.type">{{ col.titleKey | translate }}</label>
                <p class="edit-desc">{{ col.descriptionKey | translate }}</p>
              </div>
              <p-checkbox
                [inputId]="'notif-' + col.type"
                binary="true"
                [(ngModel)]="editState[col.type]">
              </p-checkbox>
            </div>
          }
        </div>
      }
      <ng-template pTemplate="footer">
        <p-button
          [label]="'BUTTONS.CANCEL' | translate"
          icon="pi pi-times"
          styleClass="p-button-text"
          (click)="closeEdit()">
        </p-button>
        <p-button
          [label]="'BUTTONS.SAVE' | translate"
          icon="pi pi-check"
          [disabled]="isSaving || !isDirty()"
          (click)="save()">
        </p-button>
      </ng-template>
    </p-dialog>

    <p-toast></p-toast>
  `,
  styles: `
    .card {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
      background: var(--surface-card);
      border-radius: 10px;
    }

    .bool-cell {
      text-align: center;

      .bool-true {
        color: #22c55e;
        font-size: 0.95rem;
      }

      .bool-false {
        color: #ef4444;
        font-size: 0.95rem;
      }

      .bool-locked {
        color: var(--text-color-secondary);
        opacity: 0.45;
        font-size: 0.95rem;
      }
    }

    .action-cell {
      text-align: center;
      white-space: nowrap;
    }

    .edit-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .edit-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--surface-border);

      &:last-child {
        border-bottom: none;
      }
    }

    .edit-info {
      flex: 1;
      min-width: 0;
    }

    .edit-info label {
      margin: 0;
      font-weight: 500;
    }

    .edit-desc {
      margin: 0.25rem 0 0 0;
      color: var(--text-color-secondary);
      font-size: 0.85rem;
    }
  `,
})
export class NotificationSubscriptionsComponent implements OnInit, OnDestroy {
  private readonly schema = 'porton';
  private destroy$ = new Subject<void>();

  profiles: Profile[] = [];
  isSaving = false;

  columns: NotificationColumn[] = [
    {
      type: 'repair_task_completed',
      titleKey: 'CONTENT-MANAGEMENT.NOTIFICATION-SUBSCRIPTIONS.REPAIR-TASK-COMPLETED.TITLE',
      descriptionKey: 'CONTENT-MANAGEMENT.NOTIFICATION-SUBSCRIPTIONS.REPAIR-TASK-COMPLETED.DESCRIPTION',
    },
    {
      type: 'note_mention',
      titleKey: 'CONTENT-MANAGEMENT.NOTIFICATION-SUBSCRIPTIONS.NOTE-MENTION.TITLE',
      descriptionKey: 'CONTENT-MANAGEMENT.NOTIFICATION-SUBSCRIPTIONS.NOTE-MENTION.DESCRIPTION',
    },
    {
      type: 'house_departed',
      titleKey: 'CONTENT-MANAGEMENT.NOTIFICATION-SUBSCRIPTIONS.HOUSE-DEPARTED.TITLE',
      descriptionKey: 'CONTENT-MANAGEMENT.NOTIFICATION-SUBSCRIPTIONS.HOUSE-DEPARTED.DESCRIPTION',
    },
    {
      type: 'unscheduled_task',
      titleKey: 'CONTENT-MANAGEMENT.NOTIFICATION-SUBSCRIPTIONS.UNSCHEDULED-TASK.TITLE',
      descriptionKey: 'CONTENT-MANAGEMENT.NOTIFICATION-SUBSCRIPTIONS.UNSCHEDULED-TASK.DESCRIPTION',
    },
  ];

  private subscriptionsByProfile = new Map<string, Set<NotificationType>>();
  private roleNameByProfileId = new Map<string, string>();

  private readonly roleGatedTypes: Partial<Record<NotificationType, readonly string[]>> = {
    note_mention: NOTES_ROLES,
  };

  editDialogVisible = false;
  editingProfile: Profile | null = null;
  editState: Record<string, boolean> = {};
  private initialEditState: Record<string, boolean> = {};

  constructor(
    private dataService: DataService,
    private supabaseService: SupabaseService,
    private messageService: MessageService,
    private translateService: TranslateService,
  ) {}

  ngOnInit() {
    combineLatest([
      this.dataService.profiles$.pipe(nonNull()),
      this.dataService.profileRoles$.pipe(nonNull()),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([profiles, roles]) => {
        const roleById = new Map<number, string>(roles.map((r: ProfileRole) => [r.id, r.name]));
        this.roleNameByProfileId.clear();
        for (const p of profiles) {
          if (p.role_id != null) {
            const name = roleById.get(p.role_id);
            if (name) this.roleNameByProfileId.set(p.id, name);
          }
        }
        this.profiles = profiles
          .filter(p => !p.is_deleted && !p.is_test_user)
          .sort((a, b) => (a.first_name ?? '').localeCompare(b.first_name ?? ''));
      });

    this.loadSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadSubscriptions() {
    const rows = await this.supabaseService.getData('notification_subscriptions', this.schema) as NotificationSubscription[] | null;
    if (!rows) return;

    this.subscriptionsByProfile.clear();
    for (const row of rows) {
      if (!this.subscriptionsByProfile.has(row.profile_id)) {
        this.subscriptionsByProfile.set(row.profile_id, new Set());
      }
      this.subscriptionsByProfile.get(row.profile_id)!.add(row.notification_type);
    }
  }

  isSubscribed(profileId: string, type: NotificationType): boolean {
    return this.subscriptionsByProfile.get(profileId)?.has(type) ?? false;
  }

  isEligible(profileId: string, type: NotificationType): boolean {
    const allowedRoles = this.roleGatedTypes[type];
    if (!allowedRoles) return true;
    const roleName = this.roleNameByProfileId.get(profileId);
    return !!roleName && allowedRoles.includes(roleName);
  }

  editableColumnsForProfile(profile: Profile): NotificationColumn[] {
    return this.columns.filter(col => this.isEligible(profile.id, col.type));
  }

  get dialogHeader(): string {
    const base = this.translateService.instant('CONTENT-MANAGEMENT.NOTIFICATION-SUBSCRIPTIONS.EDIT-TITLE');
    if (!this.editingProfile) return base;
    const name = `${this.editingProfile.first_name ?? ''} ${this.editingProfile.last_name ?? ''}`.trim();
    return name ? `${base} — ${name}` : base;
  }

  openEdit(profile: Profile) {
    this.editingProfile = profile;
    this.editState = {};
    this.initialEditState = {};
    for (const col of this.columns) {
      const value = this.isSubscribed(profile.id, col.type);
      this.editState[col.type] = value;
      this.initialEditState[col.type] = value;
    }
    this.editDialogVisible = true;
  }

  closeEdit() {
    this.editDialogVisible = false;
    this.editingProfile = null;
    this.editState = {};
    this.initialEditState = {};
  }

  isDirty(): boolean {
    for (const col of this.columns) {
      if (this.editState[col.type] !== this.initialEditState[col.type]) return true;
    }
    return false;
  }

  async save() {
    if (!this.editingProfile) return;
    const profileId = this.editingProfile.id;
    this.isSaving = true;
    try {
      for (const col of this.columns) {
        const current = this.editState[col.type];
        const initial = this.initialEditState[col.type];
        if (current === initial) continue;

        if (current) {
          await this.supabaseService.insertData(
            'notification_subscriptions',
            { profile_id: profileId, notification_type: col.type },
            this.schema,
          );
        } else {
          await this.supabaseService.deleteData(
            'notification_subscriptions',
            `profile_id = '${profileId}' AND notification_type = '${col.type}'`,
            this.schema,
          );
        }

        const set = this.subscriptionsByProfile.get(profileId) ?? new Set<NotificationType>();
        if (current) set.add(col.type); else set.delete(col.type);
        this.subscriptionsByProfile.set(profileId, set);
      }

      this.messageService.add({
        severity: 'success',
        summary: this.translateService.instant('CONTENT-MANAGEMENT.NOTIFICATION-SUBSCRIPTIONS.MESSAGES.SUCCESS'),
        detail: this.translateService.instant('CONTENT-MANAGEMENT.NOTIFICATION-SUBSCRIPTIONS.MESSAGES.SAVE-SUCCESS'),
      });
      this.closeEdit();
    } catch (error) {
      console.error('Error saving notification subscriptions:', error);
      this.messageService.add({
        severity: 'error',
        summary: this.translateService.instant('CONTENT-MANAGEMENT.NOTIFICATION-SUBSCRIPTIONS.MESSAGES.ERROR'),
        detail: this.translateService.instant('CONTENT-MANAGEMENT.NOTIFICATION-SUBSCRIPTIONS.MESSAGES.SAVE-ERROR'),
      });
    } finally {
      this.isSaving = false;
    }
  }
}

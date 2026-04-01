import { TaskService } from '../../core/services/task.service';
import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { House, Task, TaskType } from '../../core/models/data.models';
import { TaskCardComponent } from '../daily-sheet/task-card.component';
import { DatePipe } from '@angular/common';
import { MultiSelect } from 'primeng/multiselect';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { combineLatest, Subject, takeUntil } from 'rxjs';
import { DataService } from '../../core/services/data.service';
import { nonNull } from '../../shared/rxjs-operators/non-null';

@Component({
  selector: 'app-task-archive',
  imports: [
    TaskCardComponent,
    DatePipe,
    MultiSelect,
    TranslateModule,
    FormsModule,
    InputTextModule,
  ],
  template: `
    <div class="archive-container">    
      <div class="title">
        <h1>{{ 'TASK-ARCHIVE.TITLE' | translate }}</h1>
      </div>    
      <div class="fields">
        <div class="field">
          <label for="location" class="font-bold block mb-2">{{ 'TASK-ARCHIVE.FIELDS.TASK-TYPES.TITLE' | translate }}</label>
          <p-multiselect 
            [options]="taskService.getAllTaskTypes()" 
            [(ngModel)]="selectedTaskTypes"
            optionLabel="task_type_name" 
            [placeholder]="'TASK-ARCHIVE.FIELDS.TASK-TYPES.SELECT-TYPE' | translate"
            [style]="{ width: '100%' }" 
            (onChange)="onMetricsSelect()"
            display="chip"
          >
            <ng-template let-group pTemplate="group">
              <div class="font-semibold text-primary">
                {{ group.name }} 
              </div>
            </ng-template>
            <ng-template let-item pTemplate="item">
              <span>{{ item.name }}</span>
            </ng-template>
          </p-multiselect>
        </div>

        <div class="field">
          <label for="location" class="font-bold block mb-2">{{ 'TASK-ARCHIVE.FIELDS.HOUSE-NUMBERS.TITLE' | translate }}</label>
          <input 
            type="text"
            pattern="[0-9]*"
            inputmode="numeric"
            pInputText 
            [style]="{ width: '100%' }" 
            [placeholder]="'TASK-ARCHIVE.FIELDS.HOUSE-NUMBERS.SEARCH-HOUSE-NUMBER' | translate" 
            [(ngModel)]="searchTerm"
            (input)="filterTasks()"
            [min]="0"
          >
        </div>
      </div>
      
      <div class="completed-tasks-container" #scrollContainer (scroll)="onScroll()">
        @for(task of displayedTasks; track task.task_id; let i = $index){
          @if(i == 0 || !areDatesEqual(displayedTasks[i].created_at, displayedTasks[i-1].created_at)){
            <div class="date-separator">
              <div class="left-half-line"></div>
                <span>{{ task.created_at | date: 'dd MMM YYYY' }}</span>
              <div class="right-half-line"></div>
            </div>
          }

          <app-task-card
            [task]="task"
          >
          </app-task-card>
        }
        @if (displayedTasks.length < filteredTasks.length) {
          <div class="load-more-indicator">
            <span>{{ 'TASK-ARCHIVE.LOADING-MORE' | translate }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .archive-container {
      height: 90vh;
      background-color: var(--surface-card);
      border-radius: 10px;
      box-sizing: border-box;
      padding: 20px;
      display: flex;
      flex-direction: column;

      .fields {
        display: flex;
        flex-direction: row;
        width: 100%;
        gap: 20px;

        .field {
          width: 100%;
          padding-bottom: 20px;
        }
      }

      .completed-tasks-container {
        display: flex;
        flex-direction: row;
        gap: 5px;
        flex-wrap: wrap;
        overflow-y: auto;
        flex: 1;

        .date-separator {
          width: 100%;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          padding-bottom: 10px;

          .left-half-line {
            height: 1px;
            background-color: var(--surface-ground);
            width: 100%;
          }

          span {
            width: 210px;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            padding: 0px 10px 0 10px;
            color: var(--text-color-secondary);
          }

          .right-half-line {
            height: 1px;
            background-color: var(--surface-ground);
            width: 100%;
          }
        }

        .load-more-indicator {
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 1rem;
          color: var(--text-color-secondary);
        }
      }
    }
  `
})
export class TaskArchiveComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  tasks: Task[] = [];
  completedTasks: Task[] = [];
  filteredTasks: Task[] = [];
  displayedTasks: Task[] = [];

  selectedTaskTypes: TaskType[] = [];
  searchTerm: string = '';

  houses: House[] = [];

  private readonly INITIAL_LOAD = 100;
  private readonly LOAD_MORE_COUNT = 50;
  private readonly SCROLL_THRESHOLD = 200; // pixels from bottom

  private destroy$ = new Subject<void>();

  constructor(
    private dataService: DataService,
    public taskService: TaskService,
  ) {}

  ngOnInit() {
    this.subscribeToDataStreams();
  }

  ngAfterViewChecked(): void {
    this.loadMoreIfNeeded();
  }

  private loadMoreIfNeeded(): void {
    const container = this.scrollContainer?.nativeElement;
    if (!container) return;

    const isScrollable = container.scrollHeight > container.clientHeight;
    const hasMoreTasks = this.displayedTasks.length < this.filteredTasks.length;

    if (!isScrollable && hasMoreTasks) {
      this.loadMore();
    }
  }

  private subscribeToDataStreams() {
    combineLatest([
      this.dataService.tasks$.pipe(nonNull()),
      this.dataService.houses$.pipe(nonNull()),
    ])
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ([tasks, houses]) => {
        this.tasks = tasks;
        this.houses = houses;

        this.completedTasks = this.getCompletedTasks(tasks);
        this.filteredTasks = [...this.completedTasks];
        this.filterTasks();
      },
      error: (error) => {
        console.error('Error loading tasks or houses:', error);
      }
    });
  }

  private getCompletedTasks(tasks: any[]): any[] {
    return tasks
      .filter(task => this.taskService.isTaskCompleted(task) || this.taskService.isTaskConfirmed(task))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  areDatesEqual(date1: string, date2: string){
    return date1.split('T')[0] == date2.split('T')[0];
  }

  onMetricsSelect() {
    this.filterTasks();
  }

  filterTasks() {
    let result = this.completedTasks;

    if (this.selectedTaskTypes?.length) {
      result = result.filter(task =>
        this.selectedTaskTypes.some(stt => stt.task_type_id == task.task_type_id)
      );
    }

    if (this.searchTerm?.toString().trim() !== '') {
      const term = this.searchTerm.toString().toLowerCase();
      result = result.filter(task => {
        const house = this.houses.find(h => h.house_id == task.house_id);
        return house?.house_number?.toString().toLowerCase().includes(term);
      });
    }

    this.filteredTasks = result;
    this.displayedTasks = this.filteredTasks.slice(0, this.INITIAL_LOAD);
  }

  onScroll(): void {
    const container = this.scrollContainer?.nativeElement;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < this.SCROLL_THRESHOLD) {
      this.loadMore();
    }
  }

  private loadMore(): void {
    if (this.displayedTasks.length >= this.filteredTasks.length) return;

    const currentLength = this.displayedTasks.length;
    const nextBatch = this.filteredTasks.slice(
      currentLength,
      currentLength + this.LOAD_MORE_COUNT
    );

    this.displayedTasks = [...this.displayedTasks, ...nextBatch];
  }
}

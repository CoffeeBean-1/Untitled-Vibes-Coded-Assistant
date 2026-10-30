import { urgency, type Task } from '../../domain/model';
import { localDate } from '../../shared/clock';

export const taskViews = ['Today', 'Upcoming', 'Overdue', 'Inbox', 'Waiting', 'All tasks', 'Completed', 'Archive', 'Trash'] as const;
export type TaskView = typeof taskViews[number];
export function selectTasks(tasks: Task[], view: TaskView, search: string, priority: string, status: string, now: Date): Task[] {
  const query = search.trim().toLocaleLowerCase();
  return tasks.filter((task) => {
    if (view === 'Trash') { if (task.lifecycle !== 'trashed') return false; }
    else if (view === 'Archive') { if (task.lifecycle !== 'archived') return false; }
    else if (task.lifecycle !== 'active') return false;
    if (view === 'Completed' ? task.status !== 'done' : !['Trash', 'Archive', 'All tasks'].includes(view) && task.status === 'done') return false;
    const dueToday = task.due.kind !== 'none' && (task.due.kind === 'date' ? task.due.date : localDate(new Date(task.due.instantUtc), task.due.timeZone)) === localDate(now, task.due.timeZone);
    if (view === 'Today' && !dueToday && urgency(task, now) !== 'Overdue') return false;
    if (view === 'Upcoming' && !['Upcoming', 'Due soon'].includes(urgency(task, now))) return false;
    if (view === 'Overdue' && urgency(task, now) !== 'Overdue') return false;
    if (view === 'Inbox' && task.project) return false;
    if (view === 'Waiting' && task.status !== 'waiting') return false;
    if (priority && task.priority !== priority) return false;
    if (status && task.status !== status) return false;
    return !query || [task.title, task.description, task.project, ...task.tags].some((value) => value.toLocaleLowerCase().includes(query));
  });
}

import { filter } from 'rxjs/operators';

export function nonNull<T>() {
  return filter((value: T | null): value is T => value !== null);
}
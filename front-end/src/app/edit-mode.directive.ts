import {
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  output
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { Todo } from './todo.service';

@Directive({
  selector: '[appEditMode]',
  standalone: true
})
export class EditModeDirective {
  readonly todo = input.required<Todo>({ alias: 'appEditMode' });
  readonly editModeChange = output<boolean>();

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const doubleClick$ = fromEvent<MouseEvent>(
      this.elementRef.nativeElement,
      'dblclick'
    ).pipe(
      filter(event => {
        const target = event.target;
        return target instanceof Element && !target.closest('button, input');
      }),
      tap(() => {
        this.editModeChange.emit(true);
      })
    );

    doubleClick$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}

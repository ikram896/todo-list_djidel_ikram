import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';

export type TodoStatus = 'in-progress' | 'done';

export interface Todo {
  id: number;
  title: string;
  status: TodoStatus;
}

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/todos';
  readonly todos = signal<Todo[]>([]);
  readonly error = signal<string | null>(null);

  constructor() {
    this.applyRequest(this.http.get<Todo[]>(this.apiUrl));
  }

  add(title: string): void {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return;
    }

    this.applyRequest(this.http.post<Todo[]>(this.apiUrl, { title: trimmedTitle }));
  }

  remove(id: number): void {
    this.applyRequest(this.http.delete<Todo[]>(`${this.apiUrl}/${id}`));
  }

  clearCompleted(): void {
    this.applyRequest(this.http.delete<Todo[]>(`${this.apiUrl}/completed`));
  }

  updateTitle(id: number, title: string): void {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      this.remove(id);
      return;
    }

    this.applyRequest(this.http.patch<Todo[]>(`${this.apiUrl}/${id}`, { title: trimmedTitle }));
  }

  toggleStatus(id: number): void {
    const todo = this.todos().find(item => item.id === id);
    if (!todo) {
      return;
    }

    const status: TodoStatus = todo.status === 'done' ? 'in-progress' : 'done';
    this.applyRequest(this.http.patch<Todo[]>(`${this.apiUrl}/${id}`, { status }));
  }

  private applyRequest(request: Observable<Todo[]>): void {
    request.subscribe({
      next: todos => {
        this.todos.set(todos);
        this.error.set(null);
      },
      error: (error: unknown) => {
        const message = error instanceof HttpErrorResponse
          ? error.error?.message ?? error.message
          : 'An unexpected error occurred.';
        this.error.set(`Unable to save tasks: ${message}`);
      }
    });
  }
}

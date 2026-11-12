
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TodoListComponent } from './todo-list.component';

describe('TodoListComponent', () => {
  let component: TodoListComponent;
  let fixture: ComponentFixture<TodoListComponent>;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TodoListComponent, RouterTestingModule],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    fixture = TestBed.createComponent(TodoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    httpTestingController = TestBed.inject(HttpTestingController);
    httpTestingController.expectOne('http://localhost:3000/api/todos').flush([]);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('cancels editing on blur without saving the changed title', () => {
    const todo = { id: 1, title: 'Original task', status: 'in-progress' as const };
    component.todoService.todos.set([todo]);
    component.startEdit(todo);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.edit-input') as HTMLInputElement;
    input.value = 'Changed task';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(component.todoService.todos()).toEqual([todo]);
    expect(component.editingId).toBeNull();
    expect(fixture.nativeElement.querySelector('.edit-input')).toBeNull();
  });

  it('cancels editing on Escape without saving the changed title', () => {
    const todo = { id: 1, title: 'Original task', status: 'in-progress' as const };
    component.todoService.todos.set([todo]);
    component.startEdit(todo);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.edit-input') as HTMLInputElement;
    input.value = 'Changed task';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();

    expect(component.todoService.todos()).toEqual([todo]);
    expect(component.editingId).toBeNull();
    expect(fixture.nativeElement.querySelector('.edit-input')).toBeNull();
  });
});

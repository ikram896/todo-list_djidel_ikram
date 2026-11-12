import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TodoService } from './todo.service';

describe('TodoService', () => {
  let service: TodoService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TodoService);
    httpTestingController = TestBed.inject(HttpTestingController);
    httpTestingController.expectOne('http://localhost:3000/api/todos').flush([]);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('sends new tasks to the backend and updates the task list', () => {
    service.add('Buy milk');

    const request = httpTestingController.expectOne('http://localhost:3000/api/todos');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ title: 'Buy milk' });
    request.flush([{ id: 1, title: 'Buy milk', status: 'in-progress' }]);

    expect(service.todos()).toEqual([{ id: 1, title: 'Buy milk', status: 'in-progress' }]);
  });
});

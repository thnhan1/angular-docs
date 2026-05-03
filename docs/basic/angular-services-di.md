# Angular Services & Dependency Injection

Services tổ chức logic và state có thể tái sử dụng ngoài component.

**Tương đương AEM**: giống Sling Service/OSGi component — singleton, inject vào nơi cần dùng.

---

## Tạo service cơ bản

```typescript
// user.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'  // singleton toàn app
})
export class UserService {
  private users = [
    { id: 1, name: 'Nam' },
    { id: 2, name: 'Lan' }
  ];

  getUsers() {
    return this.users;
  }

  getUserById(id: number) {
    return this.users.find(u => u.id === id);
  }

  addUser(name: string) {
    const id = this.users.length + 1;
    this.users.push({ id, name });
  }
}
```

**Lưu ý**: `providedIn: 'root'` — service tự động available toàn app; không cần khai báo trong `providers`.

---

## Inject service vào component

```typescript
import { Component } from '@angular/core';
import { UserService } from './user.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  template: `
    <ul>
      @for (user of users; track user.id) {
        <li>{{ user.name }}</li>
      }
    </ul>
  `
})
export class UserListComponent {
  users = this.userService.getUsers();

  constructor(private userService: UserService) {}
}
```

**Hoặc dùng `inject()` (Angular 14+)**:

```typescript
import { Component, inject } from '@angular/core';
import { UserService } from './user.service';

export class UserListComponent {
  private userService = inject(UserService);
  users = this.userService.getUsers();
}
```

**Khuyến nghị**: dùng `inject()` — ngắn gọn hơn, dễ test, không cần constructor.

---

## Service scope

### `providedIn: 'root'` — singleton toàn app

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private isLoggedIn = false;
  
  login() { this.isLoggedIn = true; }
  logout() { this.isLoggedIn = false; }
  checkAuth() { return this.isLoggedIn; }
}
```

Mọi component inject `AuthService` đều dùng chung **một instance**.

---

### Component-level provider — mỗi component một instance

```typescript
@Component({
  selector: 'app-cart',
  standalone: true,
  providers: [CartService],  // instance riêng cho component này
  template: `...`
})
export class CartComponent {
  constructor(private cart: CartService) {}
}
```

**Khi nào dùng**: state chỉ cần tồn tại trong lifecycle của component đó; ví dụ: form state, local cache.

---

## Service inject service khác

```typescript
@Injectable({ providedIn: 'root' })
export class LoggerService {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private logger = inject(LoggerService);

  getUsers() {
    this.logger.log('Fetching users...');
    return [...];
  }
}
```

---

## HTTP service — gọi API

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface User {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private http = inject(HttpClient);
  private apiUrl = 'https://api.example.com/users';

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }
}
```

**Setup**: cần `provideHttpClient()` trong `main.ts`:

```typescript
import { provideHttpClient } from '@angular/common/http';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient()
  ]
});
```

**Component dùng**:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { UserApiService } from './user-api.service';

export class UserListComponent implements OnInit {
  private userApi = inject(UserApiService);
  users: User[] = [];

  ngOnInit() {
    this.userApi.getUsers().subscribe(data => {
      this.users = data;
    });
  }
}
```

---

## State management với Signal

```typescript
import { Injectable, signal, computed } from '@angular/core';

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

@Injectable({ providedIn: 'root' })
export class TodoService {
  private todos = signal<Todo[]>([]);

  // Computed
  completedCount = computed(() => 
    this.todos().filter(t => t.done).length
  );

  // Actions
  addTodo(text: string) {
    const id = Date.now();
    this.todos.update(list => [...list, { id, text, done: false }]);
  }

  toggleTodo(id: number) {
    this.todos.update(list =>
      list.map(t => t.id === id ? { ...t, done: !t.done } : t)
    );
  }

  // Expose read-only signal
  getTodos() {
    return this.todos.asReadonly();
  }
}
```

**Component**:

```typescript
export class TodoListComponent {
  private todoService = inject(TodoService);
  
  todos = this.todoService.getTodos();
  completedCount = this.todoService.completedCount;

  add(text: string) {
    this.todoService.addTodo(text);
  }
}
```

**Lợi ích**: reactive, type-safe, không cần subscribe/unsubscribe.

---

## InjectionToken — inject giá trị không phải class

```typescript
import { InjectionToken } from '@angular/core';

export const API_URL = new InjectionToken<string>('API URL');
```

**Provide**:

```typescript
// main.ts
bootstrapApplication(AppComponent, {
  providers: [
    { provide: API_URL, useValue: 'https://api.example.com' }
  ]
});
```

**Inject**:

```typescript
export class UserService {
  private apiUrl = inject(API_URL);

  getUsers() {
    return this.http.get(`${this.apiUrl}/users`);
  }
}
```

**Khi nào dùng**: config values, feature flags, environment-specific settings.

---

## Provider types

### `useClass` — thay thế implementation

```typescript
abstract class Logger {
  abstract log(message: string): void;
}

class ConsoleLogger implements Logger {
  log(message: string) {
    console.log(message);
  }
}

class FileLogger implements Logger {
  log(message: string) {
    // ghi vào file
  }
}

// Provide
providers: [
  { provide: Logger, useClass: ConsoleLogger }
]

// Inject
constructor(private logger: Logger) {}  // nhận ConsoleLogger instance
```

---

### `useFactory` — tạo instance động

```typescript
function loggerFactory(env: string) {
  return env === 'production' ? new FileLogger() : new ConsoleLogger();
}

providers: [
  { 
    provide: Logger, 
    useFactory: () => loggerFactory('development')
  }
]
```

---

### `useExisting` — alias

```typescript
providers: [
  UserService,
  { provide: 'UserServiceAlias', useExisting: UserService }
]
```

---

## Lifecycle & cleanup

Service `providedIn: 'root'` tồn tại suốt app lifetime; không có `ngOnDestroy`.

**Component-level service** có `ngOnDestroy`:

```typescript
@Injectable()
export class TempService implements OnDestroy {
  private subscription = new Subscription();

  ngOnDestroy() {
    this.subscription.unsubscribe();
    console.log('Service destroyed');
  }
}
```

---

## Gotchas

- **Circular dependency**: Service A inject Service B, Service B inject Service A → lỗi. Giải pháp: tách logic chung ra Service C, hoặc dùng `forwardRef()` (tránh nếu có thể).

- **`inject()` chỉ dùng trong injection context**: constructor, field initializer, `runInInjectionContext()`. Không dùng trong method thường.

```typescript
// ❌ Lỗi
export class MyComponent {
  doSomething() {
    const service = inject(MyService);  // Lỗi: không trong injection context
  }
}

// ✅ Đúng
export class MyComponent {
  private service = inject(MyService);  // OK: field initializer
  
  doSomething() {
    this.service.getData();
  }
}
```

- **`providedIn: 'root'` vs `providers: []`**:
  - `providedIn: 'root'` — tree-shakable; nếu không dùng thì không bundle
  - `providers: [MyService]` — luôn bundle, dù không dùng

- **HTTP Observable không tự complete**: phải subscribe; nếu component unmount trước khi response về, Angular tự unsubscribe. Nhưng nếu cần cancel request, dùng `takeUntilDestroyed()`:

```typescript
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export class MyComponent {
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.http.get('/api/data')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => { ... });
  }
}
```

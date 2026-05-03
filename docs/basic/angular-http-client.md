# HttpClient

`HttpClient` cho phép app fetch và gửi data qua HTTP.

**Tương đương AEM**: giống Sling `ResourceResolver` gọi external API hoặc `HttpClient` trong Java.

---

## Setup

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient()
  ]
});
```

---

## GET request

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-list',
  template: `
    @for (user of users; track user.id) {
      <div>{{ user.name }} - {{ user.email }}</div>
    }
  `
})
export class UserListComponent implements OnInit {
  private http = inject(HttpClient);
  users: User[] = [];

  ngOnInit() {
    this.http.get<User[]>('https://api.example.com/users')
      .subscribe(data => {
        this.users = data;
      });
  }
}
```

**Lưu ý**: `get<User[]>()` — type parameter giúp TypeScript biết response type.

---

## POST request

```typescript
createUser(name: string, email: string) {
  const newUser = { name, email };
  
  this.http.post<User>('https://api.example.com/users', newUser)
    .subscribe(createdUser => {
      console.log('Created:', createdUser);
      this.users.push(createdUser);
    });
}
```

---

## PUT / PATCH / DELETE

```typescript
// PUT — replace toàn bộ resource
updateUser(id: number, user: User) {
  return this.http.put<User>(`https://api.example.com/users/${id}`, user);
}

// PATCH — update một phần
patchUser(id: number, changes: Partial<User>) {
  return this.http.patch<User>(`https://api.example.com/users/${id}`, changes);
}

// DELETE
deleteUser(id: number) {
  return this.http.delete(`https://api.example.com/users/${id}`);
}
```

---

## Headers & options

```typescript
import { HttpHeaders } from '@angular/common/http';

const headers = new HttpHeaders({
  'Content-Type': 'application/json',
  'Authorization': 'Bearer token123'
});

this.http.get<User[]>('https://api.example.com/users', { headers })
  .subscribe(data => { ... });
```

**Query params**:

```typescript
import { HttpParams } from '@angular/common/http';

const params = new HttpParams()
  .set('page', '1')
  .set('limit', '10');

this.http.get<User[]>('https://api.example.com/users', { params })
  .subscribe(data => { ... });

// URL: https://api.example.com/users?page=1&limit=10
```

**Hoặc dùng object**:

```typescript
this.http.get<User[]>('https://api.example.com/users', {
  params: { page: '1', limit: '10' }
});
```

---

## Error handling

```typescript
import { catchError, of } from 'rxjs';

this.http.get<User[]>('https://api.example.com/users')
  .pipe(
    catchError(error => {
      console.error('Error:', error);
      return of([]);  // fallback empty array
    })
  )
  .subscribe(data => {
    this.users = data;
  });
```

**Chi tiết error**:

```typescript
import { HttpErrorResponse } from '@angular/common/http';

catchError((error: HttpErrorResponse) => {
  if (error.status === 404) {
    console.error('Not found');
  } else if (error.status === 500) {
    console.error('Server error');
  } else {
    console.error('Unknown error:', error.message);
  }
  return of([]);
})
```

---

## Response type

### JSON (mặc định)

```typescript
this.http.get<User>('/api/user/1');  // response tự động parse JSON
```

### Text

```typescript
this.http.get('/api/data', { responseType: 'text' })
  .subscribe(text => {
    console.log(text);  // string
  });
```

### Blob (file download)

```typescript
this.http.get('/api/file.pdf', { responseType: 'blob' })
  .subscribe(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'file.pdf';
    a.click();
  });
```

### Full response (với headers, status)

```typescript
import { HttpResponse } from '@angular/common/http';

this.http.get<User>('/api/user/1', { observe: 'response' })
  .subscribe((response: HttpResponse<User>) => {
    console.log('Status:', response.status);
    console.log('Headers:', response.headers.get('Content-Type'));
    console.log('Body:', response.body);
  });
```

---

## Interceptors

Interceptor cho phép modify request/response globally.

```typescript
// auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('auth_token');
  
  if (token) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(cloned);
  }
  
  return next(req);
};
```

**Register**:

```typescript
// main.ts
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ]
});
```

**Use case**: thêm auth token, logging, retry logic, error handling chung.

---

## Retry & timeout

```typescript
import { retry, timeout } from 'rxjs/operators';

this.http.get<User[]>('/api/users')
  .pipe(
    timeout(5000),        // timeout sau 5s
    retry(3),             // retry tối đa 3 lần
    catchError(error => {
      console.error('Failed after retries');
      return of([]);
    })
  )
  .subscribe(data => { ... });
```

---

## Kết hợp với Signal

### `toSignal` — convert Observable → Signal

```typescript
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  template: `
    @if (users(); as userList) {
      @for (user of userList; track user.id) {
        <div>{{ user.name }}</div>
      }
    } @else {
      <p>Loading...</p>
    }
  `
})
export class UserListComponent {
  private http = inject(HttpClient);
  
  users = toSignal(
    this.http.get<User[]>('https://api.example.com/users'),
    { initialValue: [] }
  );
}
```

**Lợi ích**: không cần subscribe/unsubscribe; template tự động reactive.

---

### Service với Signal state

```typescript
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  
  users = signal<User[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  loadUsers() {
    this.loading.set(true);
    this.error.set(null);
    
    this.http.get<User[]>('https://api.example.com/users')
      .subscribe({
        next: (data) => {
          this.users.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message);
          this.loading.set(false);
        }
      });
  }
}
```

**Component**:

```typescript
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  
  users = this.userService.users;
  loading = this.userService.loading;
  error = this.userService.error;

  ngOnInit() {
    this.userService.loadUsers();
  }
}
```

---

## CORS & credentials

```typescript
this.http.get<User[]>('https://api.example.com/users', {
  withCredentials: true  // gửi cookies cross-origin
});
```

**Lưu ý**: server phải config CORS header `Access-Control-Allow-Credentials: true`.

---

## Upload file

```typescript
uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', file.name);

  return this.http.post('/api/upload', formData, {
    reportProgress: true,
    observe: 'events'
  });
}
```

**Component**:

```typescript
import { HttpEventType } from '@angular/common/http';

onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) {
    const file = input.files[0];
    
    this.uploadService.uploadFile(file).subscribe(event => {
      if (event.type === HttpEventType.UploadProgress) {
        const progress = Math.round(100 * event.loaded / event.total!);
        console.log(`Upload ${progress}%`);
      } else if (event.type === HttpEventType.Response) {
        console.log('Upload complete:', event.body);
      }
    });
  }
}
```

---

## Gotchas

- **Observable cold by default**: request chỉ chạy khi `.subscribe()`; nếu không subscribe thì không gửi request.

```typescript
// ❌ Không chạy
this.http.get('/api/users');

// ✅ Chạy
this.http.get('/api/users').subscribe();
```

- **Mỗi subscribe = mỗi request**: nếu subscribe nhiều lần, sẽ gửi nhiều request. Dùng `shareReplay()` để cache:

```typescript
import { shareReplay } from 'rxjs/operators';

users$ = this.http.get<User[]>('/api/users').pipe(
  shareReplay(1)  // cache kết quả, share cho nhiều subscriber
);

// Cả 2 subscribe đều dùng chung 1 request
this.users$.subscribe(data => { ... });
this.users$.subscribe(data => { ... });
```

- **Unsubscribe tự động**: Angular tự unsubscribe HTTP Observable khi component destroy; nhưng nếu dùng operator như `switchMap`, `mergeMap`, nên dùng `takeUntilDestroyed()`:

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

- **Type safety**: luôn dùng generic `get<T>()` thay vì `get()` để tránh `any`.

- **Interceptor order**: interceptor chạy theo thứ tự khai báo trong `withInterceptors([...])`.

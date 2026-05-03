---
outline: deep
---

# Angular Router — Điều hướng trong SPA

Tài liệu này hướng dẫn cách sử dụng **Angular Router** để điều hướng giữa các màn hình trong ứng dụng Single Page Application (SPA). Bao gồm cấu hình cơ bản, route params, guards, lazy loading và tích hợp với Signals.

> **Kiến thức liên quan:** [Components](/docs/basic/angular-component) · [Services & DI](/docs/basic/angular-services-di) · [Lifecycle Hooks](/docs/basic/angular-lifecycle-hooks)

---

## 1. Cấu hình cơ bản

### 1.1. Khởi tạo Router trong standalone app

```typescript
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
  ],
});
```

```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: '**', redirectTo: '' },  // 404 — fallback về trang chủ
];
```

> **Lưu ý:** Không dùng `RouterModule.forRoot()` trong standalone app. Luôn dùng `provideRouter()` trong `bootstrapApplication`.

### 1.2. Khai báo `RouterOutlet` và `RouterLink` trong component

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav>
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
        Trang chủ
      </a>
      <a routerLink="/about" routerLinkActive="active">Giới thiệu</a>
    </nav>

    <router-outlet />
  `,
})
export class AppComponent {}
```

- `<router-outlet />` — nơi Angular render component tương ứng với URL hiện tại.
- `routerLinkActive` — tự động thêm class CSS khi link đang active.
- `[routerLinkActiveOptions]="{ exact: true }"` — chỉ active khi URL khớp chính xác (dùng cho trang chủ `/`).

---

## 2. Route parameters

### 2.1. Path parameter (`:id`)

```typescript
// app.routes.ts
{ path: 'user/:id', component: UserDetailComponent }
```

```typescript
// user-detail.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user-detail',
  template: `
    <h1>Chi tiết User #{{ userId() }}</h1>
  `,
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);

  userId = signal<string | null>(null);

  ngOnInit(): void {
    // ✅ snapshot — đọc một lần khi init, đủ nếu component unmount khi đổi route
    this.userId.set(this.route.snapshot.paramMap.get('id'));
  }
}
```

**Điều hướng tới route có param:**
```html
<a [routerLink]="['/user', 123]">User #123</a>
```

### 2.2. Query parameters

```typescript
// URL: /search?q=angular&page=2

import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-search',
  template: `<p>Tìm kiếm: {{ query }}</p>`,
})
export class SearchComponent implements OnInit {
  private route = inject(ActivatedRoute);

  query = '';
  page = 1;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.query = params.get('q') ?? '';
      this.page = Number(params.get('page') ?? 1);
    });
  }
}
```

**Điều hướng kèm query params:**
```html
<a [routerLink]="['/search']" [queryParams]="{ q: 'angular', page: 2 }">
  Tìm kiếm Angular
</a>
```

---

## 3. Programmatic navigation (điều hướng bằng code)

```typescript
import { Component, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({ /* ... */ })
export class MyComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // ✅ Điều hướng tuyệt đối
  goToUser(id: number): void {
    this.router.navigate(['/user', id]);
  }

  // ✅ Kèm query params
  search(keyword: string): void {
    this.router.navigate(['/search'], {
      queryParams: { q: keyword, page: 1 },
    });
  }

  // ✅ Điều hướng tương đối (relative)
  goBack(): void {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  // ✅ Giữ lại query params hiện tại khi điều hướng
  goToDetails(id: number): void {
    this.router.navigate(['/item', id], {
      queryParamsHandling: 'preserve',
    });
  }
}
```

---

## 4. Child routes (Route lồng nhau)

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: DashboardOverviewComponent },
      { path: 'stats', component: StatsComponent },
      { path: 'settings', component: SettingsComponent },
    ],
  },
];
```

```typescript
// dashboard.component.ts
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <aside>
      <a routerLink="overview" routerLinkActive="active">Tổng quan</a>
      <a routerLink="stats" routerLinkActive="active">Thống kê</a>
      <a routerLink="settings" routerLinkActive="active">Cài đặt</a>
    </aside>

    <main>
      <router-outlet />  <!-- child routes render tại đây -->
    </main>
  `,
})
export class DashboardComponent {}
```

**URL kết quả:** `/dashboard/overview`, `/dashboard/stats`, `/dashboard/settings`

> **Lưu ý:** `routerLink="overview"` (không có `/`) — là đường dẫn tương đối so với route cha. `routerLink="/overview"` sẽ đi ra root.

---

## 5. Route guards

Guards cho phép kiểm soát xem người dùng có được phép truy cập một route hay không.

### 5.1. `canActivate` — Bảo vệ route

```typescript
// auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;  // ✅ Cho phép truy cập
  }

  // ❌ Chưa đăng nhập — chuyển hướng sang trang login
  return router.parseUrl('/login');
};
```

```typescript
// app.routes.ts
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [authGuard],
}
```

### 5.2. `canDeactivate` — Xác nhận trước khi rời trang

```typescript
// unsaved-changes.guard.ts
import { FormComponent } from './form.component';

export const unsavedChangesGuard = (component: FormComponent) => {
  if (component.hasUnsavedChanges()) {
    // Hiển thị dialog xác nhận trước khi rời
    return confirm('Bạn có thay đổi chưa lưu. Rời trang?');
  }
  return true;
};
```

```typescript
{
  path: 'edit/:id',
  component: FormComponent,
  canDeactivate: [unsavedChangesGuard],
}
```

### 5.3. `canMatch` — Chọn route theo điều kiện (Angular 15+)

```typescript
// Hiển thị trang admin khác nhau tuỳ theo role
export const adminGuard = () => inject(AuthService).isAdmin();

export const routes: Routes = [
  { path: 'dashboard', component: AdminDashboardComponent, canMatch: [adminGuard] },
  { path: 'dashboard', component: UserDashboardComponent },  // fallback cho non-admin
];
```

---

## 6. Lazy loading

Lazy loading giúp tách code thành các bundle nhỏ hơn — chỉ tải khi user điều hướng tới route đó, cải thiện thời gian load ban đầu.

### 6.1. Lazy load một component

```typescript
export const routes: Routes = [
  {
    path: 'admin',
    // ✅ Chỉ tải AdminComponent khi user vào /admin
    loadComponent: () => import('./admin/admin.component')
      .then(m => m.AdminComponent),
  },
];
```

### 6.2. Lazy load một nhóm routes (feature routes)

```typescript
// products/products.routes.ts
export const PRODUCTS_ROUTES: Routes = [
  { path: '', component: ProductListComponent },
  { path: ':id', component: ProductDetailComponent },
];
```

```typescript
// app.routes.ts
{
  path: 'products',
  loadChildren: () => import('./products/products.routes')
    .then(m => m.PRODUCTS_ROUTES),
}
```

### 6.3. Preloading strategy

```typescript
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules)),
    //                     ↑ Tải trước tất cả lazy modules khi browser rảnh
  ],
});
```

> **Khi nào dùng Preloading:** Dùng `PreloadAllModules` khi ứng dụng không quá lớn và bạn muốn điều hướng nhanh hơn. Với app lớn, implement `PreloadingStrategy` tuỳ chỉnh để chỉ tải những route ưu tiên.

---

## 7. Route resolvers — Load data trước khi activate

Resolver đảm bảo dữ liệu đã sẵn sàng trước khi component được render, tránh trạng thái loading giữa chừng.

```typescript
// user.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { UserService } from './user.service';
import { User } from './user.model';

export const userResolver: ResolveFn<User> = (route) => {
  const userService = inject(UserService);
  const id = route.paramMap.get('id')!;
  return userService.getUserById(id);  // trả về Observable hoặc Promise
};
```

```typescript
// app.routes.ts
{
  path: 'user/:id',
  component: UserDetailComponent,
  resolve: { user: userResolver },
}
```

```typescript
// user-detail.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from './user.model';

@Component({ /* ... */ })
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);

  user?: User;

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      this.user = data['user'];  // ✅ data đã được resolve sẵn
    });
  }
}
```

---

## 8. Tích hợp với Signals

### 8.1. Dùng `toSignal()` để chuyển Observable → Signal

```typescript
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-user-detail',
  template: `<h1>User #{{ userId() }}</h1>`,
})
export class UserDetailComponent {
  private route = inject(ActivatedRoute);

  // ✅ Chuyển paramMap Observable thành Signal — không cần subscribe/unsubscribe
  userId = toSignal(
    this.route.paramMap.pipe(
      map(params => params.get('id'))
    )
  );
}
```

### 8.2. Route params với input binding (Angular 16+)

Angular 16+ cho phép nhận route params, query params và resolved data trực tiếp qua `input()`:

```typescript
// Bật tính năng này trong router config
import { withComponentInputBinding } from '@angular/router';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
  ],
});
```

```typescript
// user-detail.component.ts
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-user-detail',
  template: `<h1>User #{{ id() }}</h1>`,
})
export class UserDetailComponent {
  // ✅ Angular tự inject route param 'id' vào đây — rất gọn!
  id = input<string>();

  // Tương tự cho query params và resolved data
  // q = input<string>();       // query param ?q=...
  // user = input<User>();      // resolved data từ resolver
}
```

> **Khuyến nghị:** Đây là cách hiện đại và gọn nhất để đọc route params. Ưu tiên dùng `withComponentInputBinding` + `input()` thay cho `inject(ActivatedRoute)` khi không cần reactive stream phức tạp.

---

## 9. Route data tĩnh

Dùng `data` để đính kèm metadata tĩnh vào route — thường dùng cho breadcrumbs, page title, permissions.

```typescript
{
  path: 'settings',
  component: SettingsComponent,
  data: {
    title: 'Cài đặt',
    breadcrumb: 'Settings',
    requiredRole: 'admin',
  },
}
```

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({ /* ... */ })
export class SettingsComponent implements OnInit {
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      document.title = data['title'];  // set page title
    });
  }
}
```

---

## 10. Tóm tắt

| Tính năng | API |
|---|---|
| Cấu hình router | `provideRouter(routes)` trong `bootstrapApplication` |
| Điều hướng trong template | `routerLink`, `routerLinkActive` |
| Điều hướng bằng code | `inject(Router).navigate([...])` |
| Đọc route params | `inject(ActivatedRoute).snapshot.paramMap` hoặc `input()` với `withComponentInputBinding` |
| Lazy load component | `loadComponent: () => import(...)` |
| Lazy load nhóm routes | `loadChildren: () => import(...)` |
| Bảo vệ route | `canActivate`, `canDeactivate`, `canMatch` |
| Load data trước khi render | `resolve: { key: resolverFn }` |
| Observable → Signal | `toSignal(route.paramMap.pipe(...))` |

---

## 11. Gotchas & Lỗi phổ biến

### `routerLink` vs `href`

```html
<!-- ❌ Sai — full page reload, mất SPA experience -->
<a href="/about">About</a>

<!-- ✅ Đúng — SPA navigation, không reload page -->
<a routerLink="/about">About</a>
```

### `snapshot` vs `subscribe` cho route params

```typescript
// ✅ Dùng snapshot khi component unmount khi đổi route (đa số trường hợp)
this.userId = this.route.snapshot.paramMap.get('id');

// ✅ Dùng subscribe khi cùng component instance nhận nhiều giá trị param khác nhau
// (ví dụ: /user/1 → /user/2 mà component KHÔNG unmount)
this.route.paramMap.subscribe(params => {
  this.userId = params.get('id');
});

// ✅ Cách hiện đại nhất: toSignal + withComponentInputBinding
userId = toSignal(this.route.paramMap.pipe(map(p => p.get('id'))));
```

### Quên import `RouterLink` / `RouterOutlet`

```typescript
// ❌ Sai — dùng routerLink mà không import
@Component({
  template: `<a routerLink="/home">Home</a>`,
  //              ↑ sẽ không hoạt động, không báo lỗi rõ ràng
})

// ✅ Đúng — phải import đầy đủ
@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `<a routerLink="/home">Home</a>`,
})
```

### Wildcard `**` phải đặt cuối cùng

```typescript
// ❌ Sai — wildcard đặt trước sẽ match tất cả, các route sau không bao giờ được dùng
export const routes: Routes = [
  { path: '**', redirectTo: '' },
  { path: 'about', component: AboutComponent },  // ← không bao giờ đến đây
];

// ✅ Đúng
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: '**', redirectTo: '' },  // ← luôn đặt cuối
];
```

### Memory leak khi subscribe router events

```typescript
// ❌ Sai — subscription không được dọn dẹp
ngOnInit(): void {
  this.router.events.subscribe(event => { /* ... */ });
}

// ✅ Đúng — dùng takeUntilDestroyed
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

export class MyComponent {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  constructor() {
    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => { /* ... */ });
  }
}
```

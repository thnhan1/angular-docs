# Conditional Rendering

## `@if` — hiển thị có điều kiện

Từ Angular 17+, dùng `@if` thay `*ngIf`:

```typescript
@Component({
  selector: 'app-user-card',
  standalone: true,
  template: `
    @if (user.isLoggedIn) {
      <div class="welcome">Xin chào {{ user.name }}</div>
    }
  `
})
export class UserCardComponent {
  user = { isLoggedIn: true, name: 'Nam' };
}
```

**Tương đương HTL**: `<div data-sly-test="${user.loggedIn}">...</div>`

---

## `@else` — nhánh thay thế

```typescript
template: `
  @if (items.length > 0) {
    <ul>...</ul>
  } @else {
    <p>Không có dữ liệu</p>
  }
`
```

---

## `@else if` — nhiều điều kiện

```typescript
template: `
  @if (status === 'loading') {
    <app-spinner />
  } @else if (status === 'error') {
    <app-error [message]="errorMsg" />
  } @else {
    <app-content [data]="data" />
  }
`
```

---

## `@switch` — nhiều case

```typescript
@Component({
  template: `
    @switch (role) {
      @case ('admin') {
        <app-admin-panel />
      }
      @case ('editor') {
        <app-editor-panel />
      }
      @default {
        <app-viewer-panel />
      }
    }
  `
})
export class DashboardComponent {
  role = 'editor';
}
```

**Lưu ý**: không có fallthrough như JS `switch`; mỗi `@case` độc lập.

---

## Truthy / Falsy

`@if` đánh giá theo JS truthy:

| Giá trị | Kết quả |
|---------|---------|
| `0`, `''`, `null`, `undefined`, `false` | falsy → không render |
| `[]`, `{}`, `'0'`, `1` | truthy → render |

```typescript
@if (items.length) { ... }  // OK nếu items có phần tử
@if (message) { ... }        // OK nếu message khác rỗng
```

---

## Kết hợp với Signal

```typescript
import { signal } from '@angular/core';

@Component({
  template: `
    @if (isVisible()) {
      <div>Nội dung động</div>
    }
    <button (click)="toggle()">Toggle</button>
  `
})
export class ToggleComponent {
  isVisible = signal(false);
  
  toggle() {
    this.isVisible.update(v => !v);
  }
}
```

Angular tự động re-render khi signal thay đổi.

---

## So sánh `*ngIf` (cũ)

| Cú pháp cũ | Cú pháp mới |
|------------|-------------|
| `*ngIf="condition"` | `@if (condition) { }` |
| `*ngIf="condition; else elseBlock"` | `@if (condition) { } @else { }` |
| `*ngIf="condition; then thenBlock"` | Không cần — viết trực tiếp trong `@if` |

**Không cần** import `CommonModule` hay `NgIf` khi dùng `@if`.

---

## Gotchas

- **Không có `@elseif`** — phải viết `@else if` (có khoảng trắng).
- **`@switch` bắt buộc có `@case` hoặc `@default`** — không được để trống.
- **Biểu thức phức tạp**: tách ra method/computed signal thay vì nhồi logic vào template.

```typescript
// ❌ Tránh
@if (user && user.roles && user.roles.includes('admin') && !user.suspended) { }

// ✅ Tốt hơn
get canAccessAdmin() {
  return this.user?.roles?.includes('admin') && !this.user.suspended;
}

template: `@if (canAccessAdmin) { }`
```

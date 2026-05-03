# Angular Component từ phiên bản 17 trở về sau – Hướng dẫn đầy đủ

Tài liệu này hướng dẫn cách xây dựng Angular Component theo chuẩn hiện đại, áp dụng từ Angular 17 trở lên. Tập trung vào các tính năng mới, cách viết thay thế cho các decorator cũ, và best practices chính thức từ nhóm Angular.

---

## 1. Standalone Components – Mặc định từ Angular 19, nhưng bắt đầu từ 17

Từ Angular v17, standalone components không còn là "developer preview" mà đã **ổn định hoàn toàn**. Bạn nên ưu tiên dùng standalone thay vì khai báo component trong `NgModule`.

```typescript
// ✅ Cách viết hiện đại (Angular 17+)
import { Component, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-hello',
  // standalone: true,  // Từ Angular 19, standalone là true mặc định, không cần khai báo
  template: `<h1>Xin chào, {{ name() }}</h1>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelloComponent {
  name = input.required<string>();
}
```

> **Lưu ý:** Nếu bạn đang dùng Angular 17, hãy thêm `standalone: true` vào decorator. Từ Angular 19 trở đi, bạn có thể lược bỏ dòng này.

---

## 2. Sử dụng Signals thay cho Decorator cũ

Angular 17+ hỗ trợ đầy đủ **Signals** – một cơ chế reactivity mới, mạnh mẽ và dễ đoán hơn so với `Zone.js` truyền thống.

### 2.1. `input()` thay cho `@Input`

```typescript
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-user-card',
  template: `
    <div class="card">
      <h2>{{ name() }}</h2>
      <p>{{ email() }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCardComponent {
  // ✅ Signal input – read-only, luôn có giá trị mới nhất
  name = input.required<string>();
  email = input<string>(''); // có giá trị mặc định

  // ❌ Không còn: @Input() name: string;
}
```

### 2.2. `output()` thay cho `@Output`

```typescript
import { Component, output } from '@angular/core';

@Component({
  selector: 'app-like-button',
  template: `
    <button (click)="liked.emit()">
      👍 Thích
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LikeButtonComponent {
  // ✅ Signal output
  liked = output<void>();
  // ❌ Không còn: @Output() liked = new EventEmitter<void>();
}
```

### 2.3. `model()` cho two-way binding

```typescript
import { Component, model } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <p>Giá trị: {{ value() }}</p>
    <button (click)="value.set(value() + 1)">Tăng</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterComponent {
  // ✅ model() vừa nhận vừa phát ra thay đổi
  value = model(0);
}
```

Sử dụng trong parent:
```html
<app-counter [(value)]="count" />
```

### 2.4. `viewChild()` thay cho `@ViewChild`

```typescript
import { Component, ElementRef, viewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-focus-input',
  template: `<input #myInput type="text" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FocusInputComponent implements AfterViewInit {
  // ✅ Signal viewChild
  private myInput = viewChild.required<ElementRef<HTMLInputElement>>('myInput');

  ngAfterViewInit() {
    this.myInput().nativeElement.focus();
  }
}
```

### 2.5. `signal()` và `computed()` cho state nội bộ

```typescript
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-todo',
  template: `
    <input [value]="newTodo()" (input)="updateTodo($event)" />
    <button (click)="add()">Thêm</button>
    <ul>
      @for (item of todos(); track $index) {
        <li>{{ item }}</li>
      }
    </ul>
    <p>Tổng: {{ total() }}</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoComponent {
  newTodo = signal('');
  todos = signal<string[]>([]);
  total = computed(() => this.todos().length);

  updateTodo(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.newTodo.set(value);
  }

  add() {
    if (this.newTodo().trim()) {
      this.todos.update(list => [...list, this.newTodo()]);
      this.newTodo.set('');
    }
  }
}
```

> **Lưu ý:** Không dùng `mutate()` trên signals. Luôn dùng `set()` hoặc `update()` để đảm bảo tính bất biến.

---

## 3. Control Flow mới – Bỏ `*ngIf`, `*ngFor`, `*ngSwitch`

Từ Angular 17, bạn có thể (và nên) dùng syntax `@if`, `@else`, `@for`, `@switch` thay vì các structural directive cũ.

```html
<!-- ✅ Hiện đại -->
@if (user(); as user) {
  <p>Xin chào {{ user.name }}</p>
} @else {
  <p>Vui lòng đăng nhập</p>
}

@for (item of items(); track item.id) {
  <app-item [data]="item" />
} @empty {
  <p>Không có mục nào.</p>
}

@switch (status()) {
  @case ('active') {
    <span class="badge-success">Đang hoạt động</span>
  }
  @case ('inactive') {
    <span class="badge-warning">Ngưng hoạt động</span>
  }
  @default {
    <span class="badge-secondary">Không rõ</span>
  }
}
```

- **`@let`** (Angular v18+): Khai báo biến cục bộ trong template.

```html
@let fullName = firstName() + ' ' + lastName();
<p>{{ fullName }}</p>
```

---

## 4. Deferrable Views – Lazy loading trong template

Từ Angular 17, `@defer` cho phép trì hoãn tải một phần template cho đến khi một điều kiện được kích hoạt, giúp tối ưu bundle size ban đầu.

```html
@defer (on viewport) {
  <app-heavy-chart />
} @placeholder {
  <p>Biểu đồ sẽ hiển thị khi cuộn tới...</p>
} @loading {
  <p>Đang tải biểu đồ...</p>
} @error {
  <p>Lỗi khi tải biểu đồ.</p>
}
```

Các trigger phổ biến: `on idle`, `on viewport`, `on interaction`, `on hover`, `when condition`.

---

## 5. Host Binding – Quản lý thuộc tính của chính thẻ component

Thay vì dùng `@HostBinding` và `@HostListener` (đã deprecated), bạn khai báo trong metadata `host`:

```typescript
@Component({
  selector: 'app-button',
  template: `<ng-content />`,
  host: {
    '[class.disabled]': 'disabled()',
    '[attr.aria-disabled]': 'disabled()',
    '(click)': 'handleClick()',
    'role': 'button',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent {
  disabled = input(false);

  handleClick() {
    if (!this.disabled()) {
      // xử lý click
    }
  }
}
```

---

## 6. Dependency Injection – Dùng hàm `inject()`

```typescript
import { Component, inject } from '@angular/core';
import { UserService } from './user.service';

@Component({
  selector: 'app-profile',
  template: `...`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private userService = inject(UserService);
  user = this.userService.currentUser;

  // ❌ Không còn:
  // constructor(private userService: UserService) {}
}
```

---

## 7. Cấu trúc thư mục và conventions

Một component hiện đại nên tổ chức như sau:

```
📁 user-card/
   ├── user-card.component.ts
   ├── user-card.component.html   (nếu template ngoài)
   ├── user-card.component.scss   (style riêng, encapsulation)
   └── user-card.spec.ts
```

- Ưu tiên **inline template** nếu template < 20 dòng.
- Sử dụng `changeDetection: ChangeDetectionStrategy.OnPush` **luôn luôn**.
- Tránh dùng `any`, dùng `unknown` nếu chưa rõ kiểu.

---

## 8. Tóm tắt – Angular 17+ Component Checklist

| Mục | Cách cũ (nên tránh) | Cách mới (khuyên dùng) |
|-----|-------------------|------------------------|
| Khai báo component | `@Component` + `NgModule` | `@Component` standalone |
| Input property | `@Input()` decorator | `input()` signal |
| Output property | `@Output()` + `EventEmitter` | `output()` |
| Two-way binding | Không có sẵn | `model()` |
| View child | `@ViewChild()` decorator | `viewChild()` |
| Reactive state | Biến thường + `markForCheck` | `signal()` + `computed()` |
| Control flow | `*ngIf`, `*ngFor` | `@if`, `@for` |
| Lazy loading phần template | Không có | `@defer` |
| Dependency injection | Constructor | `inject()` |
| Host binding | `@HostBinding`, `@HostListener` | `host` property |

---

Hy vọng tài liệu này giúp bạn nắm vững cách xây dựng Angular component theo chuẩn hiện đại. Nếu cần đi sâu vào phần nào (ví dụ: signal nâng cao, unit test với signals, AEM integration...), hãy cho mình biết nhé!
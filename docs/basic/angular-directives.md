# ANGULAR DIRECTIVES — TÀI LIỆU HỌC TẬP

## 1. KHÁI NIỆM

Directive là một lớp được trang trí bằng `@Directive()`. Directive cho phép gắn hành vi tùy chỉnh vào các phần tử trong DOM.

Angular có 3 loại directive:
- **Component** — directive có template.
- **Attribute Directive** — thay đổi giao diện/hành vi của phần tử, component hoặc directive khác.
- **Structural Directive** — thay đổi cấu trúc DOM bằng cách thêm/xóa phần tử.

---

## 2. COMPONENT DIRECTIVE

Component là directive phổ biến nhất. Mỗi component đều là một directive có template.

```typescript
@Component({
  selector: 'app-hello',
  template: `<p>Xin chào!</p>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelloComponent {}
```

Sử dụng trong template:
```html
<app-hello></app-hello>
```

---

## 3. ATTRIBUTE DIRECTIVE

### 3.1 Tạo Attribute Directive

Sử dụng CLI:
```bash
ng generate directive highlight
```

```typescript
// highlight.directive.ts
import { Directive, ElementRef, inject, input } from '@angular/core';

@Directive({
  selector: '[appHighlight]',
})
export class HighlightDirective {
  private el = inject(ElementRef);

  backgroundColor = input<string>('yellow');

  constructor() {
    this.el.nativeElement.style.backgroundColor = this.backgroundColor();
  }
}
```

Sử dụng:
```html
<p appHighlight backgroundColor="lightblue">Đoạn văn được highlight.</p>
```

### 3.2 Host Listener với `host` metadata (Angular 20+)

Không dùng `@HostListener` decorator. Sử dụng thuộc tính `host` trong `@Directive`.

```typescript
@Directive({
  selector: '[appHover]',
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
  },
})
export class HoverDirective {
  onMouseEnter() {
    console.log('Chuột vào');
  }
  onMouseLeave() {
    console.log('Chuột ra');
  }
}
```

### 3.3 Host Binding với `host` metadata

Không dùng `@HostBinding`. Khai báo trong `host`.

```typescript
@Directive({
  selector: '[appActive]',
  host: {
    '[class.active]': 'isActive()',
    '[attr.aria-disabled]': 'isDisabled()',
  },
})
export class ActiveDirective {
  isActive = input(false);
  isDisabled = input(false);
}
```

---

## 4. STRUCTURAL DIRECTIVE

Structural directive thay đổi cấu trúc DOM bằng cách thêm hoặc xóa phần tử. Chúng sử dụng dấu `*` phía trước tên directive.

### 4.1 Các Structural Directive tích hợp

| Directive  | Mô tả                              | Cách dùng mới (Angular 17+)            |
|------------|------------------------------------|----------------------------------------|
| `@if`      | Hiển thị có điều kiện             | `@if (condition) { ... }`             |
| `@for`     | Lặp qua danh sách                 | `@for (item of list; track item.id) {...}` |
| `@switch`  | Hiển thị theo trường hợp          | `@switch (value) { @case ('a') {...} }` |

**Không dùng** `*ngIf`, `*ngFor`, `*ngSwitch` — đây là cú pháp cũ đã bị loại bỏ.

### 4.2 Cú pháp Control Flow mới

```html
@if (user(); as user) {
  <p>Xin chào {{ user.name }}</p>
} @else if (loading()) {
  <p>Đang tải...</p>
} @else {
  <p>Chưa đăng nhập</p>
}

@for (item of items(); track item.id; let idx = $index) {
  <p>{{ idx }} - {{ item.name }}</p>
} @empty {
  <p>Danh sách trống</p>
}

@switch (status()) {
  @case ('active') {
    <span class="badge-active">Active</span>
  }
  @case ('inactive') {
    <span class="badge-inactive">Inactive</span>
  }
  @default {
    <span class="badge-unknown">Unknown</span>
  }
}
```

### 4.3 `@let` — Khai báo biến cục bộ trong template

```html
@let fullName = user().firstName + ' ' + user().lastName;
<p>{{ fullName }}</p>
```

---

## 5. CUSTOM STRUCTURAL DIRECTIVE

Tạo structural directive tùy chỉnh bằng cách inject `TemplateRef` và `ViewContainerRef`.

```typescript
// ifNot.directive.ts
import { Directive, TemplateRef, ViewContainerRef, input, effect } from '@angular/core';

@Directive({
  selector: '[appIfNot]',
})
export class IfNotDirective {
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);

  appIfNot = input<boolean>(false);

  constructor() {
    effect(() => {
      this.viewContainer.clear();
      if (!this.appIfNot()) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
```

Sử dụng:
```html
<div *appIfNot="isLoading()">
  Nội dung hiển thị khi KHÔNG loading.
</div>
```

**Lưu ý**: Custom structural directive vẫn dùng cú pháp `*` vì chúng thao tác trực tiếp với `TemplateRef`.

---

## 6. DIRECTIVE COMPOSITION API (Angular 15+)

Cho phép kết hợp nhiều directive vào một directive duy nhất thông qua `hostDirectives`.

```typescript
// Các directive cơ sở
@Directive({
  selector: '[appFocusable]',
  host: { '(focus)': 'onFocus()' },
})
export class FocusableDirective {
  onFocus() { /* ... */ }
}

@Directive({
  selector: '[appClickable]',
  host: { '(click)': 'onClick()' },
})
export class ClickableDirective {
  onClick() { /* ... */ }
}

// Directive kết hợp
@Directive({
  selector: '[appInteractive]',
  hostDirectives: [
    FocusableDirective,
    { directive: ClickableDirective, inputs: ['appClickable: myClick'] },
  ],
})
export class InteractiveDirective {}
```

Sử dụng:
```html
<button appInteractive>Nút tương tác</button>
```

---

## 7. STANDALONE DIRECTIVE

Angular 20+ mặc định là standalone. Không cần khai báo `standalone: true`.

```typescript
@Directive({
  selector: '[appTooltip]',
})
export class TooltipDirective {}
```

Khi sử dụng trong component standalone, import directive trực tiếp:

```typescript
@Component({
  selector: 'app-demo',
  template: `<div appTooltip></div>`,
  imports: [TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoComponent {}
```

---

## 8. TRUYỀN DỮ LIỆU VÀO DIRECTIVE

### 8.1 Sử dụng `input()` signal

```typescript
@Directive({ selector: '[appBorder]' })
export class BorderDirective {
  color = input<string>('black');
  width = input<number>(1);

  private el = inject(ElementRef);

  constructor() {
    effect(() => {
      this.el.nativeElement.style.border = 
        `${this.width()}px solid ${this.color()}`;
    });
  }
}
```

Sử dụng:
```html
<div appBorder color="red" [width]="3">Có viền đỏ</div>
```

### 8.2 Alias cho input

```typescript
color = input<string>('black', { alias: 'appBorderColor' });
```

```html
<div appBorder appBorderColor="blue">Viền xanh</div>
```

---

## 9. EXPORTAS — TRUY XUẤT DIRECTIVE TRONG TEMPLATE

```typescript
@Directive({
  selector: '[appTooltip]',
  exportAs: 'tooltip',
})
export class TooltipDirective {
  message = input<string>('');
  show() { /* ... */ }
  hide() { /* ... */ }
}
```

Sử dụng:
```html
<div appTooltip message="Hello" #myTooltip="tooltip">
  <button (click)="myTooltip.show()">Hiện tooltip</button>
</div>
```

---

## 10. VÒNG ĐỜI CỦA DIRECTIVE

Các lifecycle hook cho directive (giống component):

| Hook                 | Mô tả                                      |
|----------------------|--------------------------------------------|
| `ngOnInit()`         | Khởi tạo, sau khi các input được bind      |
| `ngOnChanges()`      | Khi input thay đổi (dùng cho non-signal)   |
| `ngDoCheck()`        | Mỗi chu kỳ change detection                |
| `ngOnDestroy()`      | Trước khi directive bị hủy                 |

**Lưu ý**: Với signal-based input, dùng `effect()` thay cho `ngOnChanges()`.

```typescript
constructor() {
  effect(() => {
    // Chạy mỗi khi input signal thay đổi
    const currentColor = this.color();
    this.applyColor(currentColor);
  });
}
```

---

## 11. BEST PRACTICES

1. **Luôn dùng `changeDetection: ChangeDetectionStrategy.OnPush`** trong component directive.
2. **Dùng `input()` signal** thay vì `@Input` decorator.
3. **Dùng `host` metadata** thay vì `@HostListener`, `@HostBinding`.
4. **Dùng control flow mới** (`@if`, `@for`, `@switch`) thay vì `*ngIf`, `*ngFor`.
5. **Giữ directive tập trung vào một nhiệm vụ**. Nếu directive phức tạp, tách thành các directive nhỏ hơn rồi dùng Composition API.
6. **Không thao tác DOM trực tiếp qua nativeElement nếu có thể**. Ưu tiên dùng Renderer2.
7. **Sử dụng `inject()`** thay vì constructor injection.
8. **Đặt prefix** cho selector để tránh xung đột (ví dụ: `app`, `ui`, `lib`).

---

## 12. VÍ DỤ TỔNG HỢP — DIRECTIVE QUẢN LÝ PERMISSION

```typescript
// permission.directive.ts
import { Directive, TemplateRef, ViewContainerRef, input, effect } from '@angular/core';
import { AuthService } from './auth.service';

@Directive({
  selector: '[appHasPermission]',
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(AuthService);

  appHasPermission = input.required<string>();

  constructor() {
    effect(() => {
      const permission = this.appHasPermission();
      if (this.authService.hasPermission(permission)) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      } else {
        this.viewContainer.clear();
      }
    });
  }
}
```

Sử dụng:
```html
<button *appHasPermission="'delete-user'">Xóa người dùng</button>
```

---

## 13. KIỂM TRA KIẾN THỨC

1. Phân biệt attribute directive và structural directive.
2. Tại sao không dùng `@HostListener` và `@HostBinding` trong Angular 20+?
3. `hostDirectives` dùng để làm gì?
4. Sự khác biệt giữa `effect()` và `ngOnChanges()` khi làm việc với signal input.
5. Khi nào dùng `exportAs`?
6. Tại sao phải dùng `track` trong `@for`?

---

Tài liệu kết thúc.
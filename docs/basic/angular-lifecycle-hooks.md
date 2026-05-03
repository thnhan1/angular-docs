---
outline: deep
---

# Angular Lifecycle Hooks — Vòng Đời Component & Directive

Tài liệu này trình bày toàn diện về **Lifecycle Hooks** trong Angular — chuỗi các giai đoạn mà một component/directive trải qua từ khi khởi tạo, render, cập nhật cho đến khi bị hủy.

> **Kiến thức liên quan:** [Components](/docs/basic/angular-component) · [Data Binding](/docs/basic/angular-data-binding-for-aem) · [Events](/docs/basic/angular-events)

---

## 1) KHÁI NIỆM LIFECYCLE HOOKS

Mỗi component/directive trong Angular có một **vòng đời** (lifecycle) được quản lý bởi Angular. Tại mỗi thời điểm quan trọng, Angular sẽ gọi các **hook method** (nếu bạn định nghĩa chúng) để bạn có thể can thiệp và thực thi logic phù hợp.

```text
KHỞI TẠO                    THAY ĐỔI                     HỦY
────────                    ────────                     ────
constructor()  ──►  ngOnChanges()  ──►  ...  ──►  ngOnDestroy()
   │                    │
   └─► ngOnInit()       └─► ngDoCheck()
                             ngAfterContentInit()
                             ngAfterContentChecked()
                             ngAfterViewInit()
                             ngAfterViewChecked()
```

---

## 2) DANH SÁCH CÁC HOOKS

| Hook | Interface | Mô tả | Tần suất gọi |
|---|---|---|---|
| `constructor()` | *(không phải hook)* | Khởi tạo class, chưa có template/data | 1 lần |
| `ngOnChanges()` | `OnChanges` | Phản ứng khi `@Input()` thay đổi | Mỗi lần input thay đổi |
| `ngOnInit()` | `OnInit` | Khởi tạo component sau khi có data | 1 lần |
| `ngDoCheck()` | `DoCheck` | Custom change detection | Mỗi chu kỳ CD |
| `ngAfterContentInit()` | `AfterContentInit` | Sau khi content projection được insert | 1 lần |
| `ngAfterContentChecked()` | `AfterContentChecked` | Sau mỗi lần kiểm tra projected content | Mỗi chu kỳ CD |
| `ngAfterViewInit()` | `AfterViewInit` | Sau khi view và children được khởi tạo | 1 lần |
| `ngAfterViewChecked()` | `AfterViewChecked` | Sau mỗi lần kiểm tra view/children | Mỗi chu kỳ CD |
| `ngOnDestroy()` | `OnDestroy` | Trước khi component bị hủy | 1 lần |

---

## 3) THỨ TỰ THỰC THI

### 3.1) Khi component được tạo lần đầu

```
constructor()
ngOnChanges()        ← nếu có @Input
ngOnInit()
ngDoCheck()
ngAfterContentInit()
ngAfterContentChecked()
ngAfterViewInit()
ngAfterViewChecked()
```

### 3.2) Khi input thay đổi

```
ngOnChanges()
ngDoCheck()
ngAfterContentChecked()
ngAfterViewChecked()
```

---

## 4) CHI TIẾT TỪNG HOOK

### 4.1) `constructor()`

**Không phải lifecycle hook** — đây là method của TypeScript class, được gọi khi Angular khởi tạo instance bằng `new`.

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-demo',
  template: `<p>{{ title }}</p>`,
})
export class DemoComponent {
  title = 'Hello';

  constructor() {
    // ⚠️ Chưa có @Input, chưa có template
    // ✅ Chỉ nên inject service
    console.log('constructor — component được tạo');
  }
}
```

> **Best practice:** Chỉ dùng `constructor()` để **dependency injection**. Không gọi API, không truy cập DOM, không đọc `@Input()` ở đây.

---

### 4.2) `ngOnChanges()`

Được gọi **trước `ngOnInit()`** và **mỗi khi một data-bound input property thay đổi**. Nhận tham số `SimpleChanges` chứa giá trị cũ và mới.

```typescript
import { Component, input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-profile',
  template: `
    <h2>{{ name() }}</h2>
    <p>Age: {{ age() }}</p>
  `,
})
export class ProfileComponent implements OnChanges {
  name = input.required<string>();
  age = input<number>(0);

  ngOnChanges(changes: SimpleChanges): void {
    // ✅ Phản ứng với thay đổi của input
    for (const propName in changes) {
      const ch = changes[propName];
      console.log(
        `${propName}: ${ch.previousValue} → ${ch.currentValue} (first: ${ch.firstChange})`
      );
    }
  }
}
```

| Thuộc tính của `SimpleChange` | Ý nghĩa |
|---|---|
| `previousValue` | Giá trị trước khi thay đổi |
| `currentValue` | Giá trị hiện tại |
| `firstChange` | `true` nếu đây là lần đầu (trước `ngOnInit`) |

> **Lưu ý với Signals:** Nếu bạn dùng `input()` signal, Angular vẫn gọi `ngOnChanges()` khi input signal thay đổi. Bạn cũng có thể dùng `effect()` như một cách thay thế hiện đại.

---

### 4.3) `ngOnInit()`

Được gọi **một lần duy nhất** sau khi Angular hiển thị các data-bound properties lần đầu và sau `ngOnChanges()` đầu tiên.

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { UserService } from './user.service';

@Component({
  selector: 'app-user-list',
  template: `
    <ul>
      @for (user of users; track user.id) {
        <li>{{ user.name }}</li>
      }
    </ul>
  `,
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  users: User[] = [];

  ngOnInit(): void {
    // ✅ Đây là nơi lý tưởng để fetch data
    this.userService.getAll().subscribe(data => {
      this.users = data;
    });
  }
}
```

> **Best practice:** Gọi API, khởi tạo dữ liệu, setup subscription trong `ngOnInit()` — không làm trong `constructor()`.

---

### 4.4) `ngDoCheck()`

Được gọi **sau mỗi chu kỳ change detection**. Cho phép bạn tự viết logic phát hiện thay đổi mà Angular không tự phát hiện được.

```typescript
import { Component, DoCheck, input } from '@angular/core';

@Component({
  selector: 'app-deep-check',
  template: `<p>{{ data() | json }}</p>`,
})
export class DeepCheckComponent implements DoCheck {
  data = input<Record<string, unknown>>({});
  private previousJson = '';

  ngDoCheck(): void {
    const currentJson = JSON.stringify(this.data());

    if (currentJson !== this.previousJson) {
      console.log('Phát hiện thay đổi sâu trong object');
      this.previousJson = currentJson;
    }
  }
}
```

> ⚠️ **Cảnh báo:** `ngDoCheck()` chạy rất thường xuyên — mỗi lần Angular chạy change detection. Chỉ dùng khi thực sự cần, và tránh thực hiện các tác vụ nặng bên trong.

---

### 4.5) `ngAfterContentInit()`

Được gọi **một lần** sau khi Angular chiếu (project) nội dung bên ngoài vào component thông qua `<ng-content>`.

```typescript
import { Component, AfterContentInit, ContentChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-card',
  template: `
    <div class="card">
      <div class="card-header">
        <ng-content select="[header]"></ng-content>
      </div>
      <div class="card-body">
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class CardComponent implements AfterContentInit {
  @ContentChild('headerTitle') headerEl!: ElementRef;

  ngAfterContentInit(): void {
    // ✅ Lúc này projected content đã sẵn sàng
    console.log('Projected content:', this.headerEl?.nativeElement.textContent);
  }
}
```

```html
<!-- Sử dụng -->
<app-card>
  <h3 header>Tiêu đề từ bên ngoài</h3>
  <p>Nội dung thẻ card</p>
</app-card>
```

---

### 4.6) `ngAfterContentChecked()`

Giống `ngAfterContentInit()` nhưng được gọi **sau mỗi lần** Angular kiểm tra projected content.

```typescript
import { Component, AfterContentChecked } from '@angular/core';

@Component({ /* ... */ })
export class MyComponent implements AfterContentChecked {
  ngAfterContentChecked(): void {
    // Được gọi rất thường xuyên — cẩn thận với performance
  }
}
```

---

### 4.7) `ngAfterViewInit()`

Được gọi **một lần** sau khi Angular khởi tạo xong view của component và các view con.

```typescript
import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-chart',
  template: `<canvas #chartCanvas></canvas>`,
})
export class ChartComponent implements AfterViewInit {
  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit(): void {
    // ✅ Lúc này DOM đã sẵn sàng — có thể thao tác trực tiếp
    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(10, 10, 100, 50);
    }
  }
}
```

> **Best practice:** Đây là nơi lý tưởng để khởi tạo thư viện bên thứ 3 (chart, map, datepicker…) cần truy cập DOM.

---

### 4.8) `ngAfterViewChecked()`

Giống `ngAfterViewInit()` nhưng được gọi **sau mỗi lần** Angular kiểm tra view và children.

```typescript
import { Component, AfterViewChecked } from '@angular/core';

@Component({ /* ... */ })
export class MyComponent implements AfterViewChecked {
  ngAfterViewChecked(): void {
    // ⚠️ Chạy rất thường xuyên — tránh thay đổi state ở đây
    // (sẽ gây "ExpressionChangedAfterItHasBeenCheckedError")
  }
}
```

> ⚠️ **Quan trọng:** Không thay đổi data-bound properties trong `ngAfterViewChecked()` hoặc `ngAfterContentChecked()` vì sẽ gây ra lỗi `ExpressionChangedAfterItHasBeenCheckedError`.

---

### 4.9) `ngOnDestroy()`

Được gọi **ngay trước khi** Angular hủy component/directive. Dùng để dọn dẹp tài nguyên.

```typescript
import { Component, OnDestroy, inject } from '@angular/core';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-live-clock',
  template: `<p>{{ now | date:'medium' }}</p>`,
})
export class LiveClockComponent implements OnDestroy {
  now = new Date();
  private sub!: Subscription;

  ngOnInit(): void {
    this.sub = interval(1000).subscribe(() => {
      this.now = new Date();
    });
  }

  ngOnDestroy(): void {
    // ✅ Hủy subscription để tránh memory leak
    this.sub?.unsubscribe();
    console.log('Component đã bị hủy, đã dọn dẹp tài nguyên');
  }
}
```

> **Best practice:** Luôn luôn unsubscribe các Observable, detach event listener, clear interval/timeout trong `ngOnDestroy()`.

---

### 4.10) `afterRender` & `afterNextRender` (Angular 17+)

Từ Angular 17, bạn có hai hook mới chạy **sau mỗi lần render** toàn bộ ứng dụng — không chỉ riêng component.

```typescript
import { Component, afterRender, afterNextRender } from '@angular/core';

@Component({
  selector: 'app-render-hooks',
  template: `<p>Render hooks demo</p>`,
})
export class RenderHooksComponent {
  constructor() {
    // Chạy 1 lần sau lần render tiếp theo
    afterNextRender(() => {
      console.log('DOM đã sẵn sàng sau lần render đầu tiên');
    });

    // Chạy sau mỗi lần render
    afterRender(() => {
      console.log('Ứng dụng vừa render xong');
    });
  }
}
```

| Hook | Tần suất | Dùng khi |
|---|---|---|
| `afterNextRender()` | 1 lần | Khởi tạo thư viện DOM, focus phần tử |
| `afterRender()` | Mỗi lần render | Đo performance, logging |

---

## 5) COMPONENT VS DIRECTIVE

| Hook | Component | Directive |
|---|---|---|
| `ngOnChanges()` | ✅ | ✅ |
| `ngOnInit()` | ✅ | ✅ |
| `ngDoCheck()` | ✅ | ✅ |
| `ngAfterContentInit()` | ✅ | ❌ |
| `ngAfterContentChecked()` | ✅ | ❌ |
| `ngAfterViewInit()` | ✅ | ❌ |
| `ngAfterViewChecked()` | ✅ | ❌ |
| `ngOnDestroy()` | ✅ | ✅ |

> Directive không có view và content riêng nên không có các hook `AfterView*` và `AfterContent*`.

---

## 6) LỖI PHỔ BIẾN & GIẢI PHÁP

### 6.1) `ExpressionChangedAfterItHasBeenCheckedError`

```typescript
// ❌ SAI — thay đổi giá trị sau khi view đã được kiểm tra
ngAfterViewInit(): void {
  this.message = 'Updated'; // Lỗi!
}

// ✅ ĐÚNG — dùng setTimeout hoặc ChangeDetectorRef
constructor(private cdr: ChangeDetectorRef) {}

ngAfterViewInit(): void {
  this.message = 'Updated';
  this.cdr.detectChanges(); // Báo Angular kiểm tra lại
}
```

### 6.2) Quên unsubscribe trong `ngOnDestroy()`

```typescript
// ❌ SAI — memory leak
ngOnInit(): void {
  this.router.events.subscribe(/* ... */);
}

// ✅ ĐÚNG — luôn dọn dẹp
private destroy$ = new Subject<void>();

ngOnInit(): void {
  this.router.events
    .pipe(takeUntil(this.destroy$))
    .subscribe(/* ... */);
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### 6.3) Gọi API trong constructor

```typescript
// ❌ SAI
constructor(private api: ApiService) {
  this.api.getData().subscribe(); // Quá sớm!
}

// ✅ ĐÚNG
ngOnInit(): void {
  this.api.getData().subscribe();
}
```

---

## 7) TÓM TẮT BEST PRACTICES

| Hook | Nên làm | Không nên làm |
|---|---|---|
| `constructor()` | Inject services | Gọi API, truy cập input/DOM |
| `ngOnChanges()` | Phản ứng với input thay đổi | Thực hiện tác vụ nặng |
| `ngOnInit()` | Fetch data, setup logic | Truy cập DOM |
| `ngDoCheck()` | Custom change detection | Thay đổi state (gây loop) |
| `ngAfterViewInit()` | Thao tác DOM, init thư viện | Thay đổi state mà không `detectChanges()` |
| `ngOnDestroy()` | Unsubscribe, dọn dẹp | — |

---

## 8) VÍ DỤ TỔNG HỢP

```typescript
import {
  Component, input, OnInit, OnChanges, OnDestroy,
  DoCheck, AfterContentInit, AfterContentChecked,
  AfterViewInit, AfterViewChecked, SimpleChanges,
  inject, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-lifecycle-demo',
  template: `
    <div class="demo">
      <h2>{{ title() }}</h2>
      <p>Counter: {{ counter }}</p>
      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LifecycleDemoComponent
  implements OnInit, OnChanges, OnDestroy, DoCheck,
             AfterContentInit, AfterContentChecked,
             AfterViewInit, AfterViewChecked
{
  title = input.required<string>();
  counter = 0;

  private cdr = inject(ChangeDetectorRef);
  private subscription?: Subscription;

  private log(hook: string): void {
    console.log(`[${hook}] counter=${this.counter}`);
  }

  constructor() {
    this.log('constructor');
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.log('ngOnChanges');
  }

  ngOnInit(): void {
    this.log('ngOnInit');
    // Fetch dữ liệu, setup logic...
  }

  ngDoCheck(): void {
    this.log('ngDoCheck');
  }

  ngAfterContentInit(): void {
    this.log('ngAfterContentInit');
  }

  ngAfterContentChecked(): void {
    this.log('ngAfterContentChecked');
  }

  ngAfterViewInit(): void {
    this.log('ngAfterViewInit');
  }

  ngAfterViewChecked(): void {
    this.log('ngAfterViewChecked');
  }

  ngOnDestroy(): void {
    this.log('ngOnDestroy');
    this.subscription?.unsubscribe();
  }
}
```

**Console output khi component được tạo lần đầu:**

```
[constructor] counter=0
[ngOnChanges] counter=0
[ngOnInit] counter=0
[ngDoCheck] counter=0
[ngAfterContentInit] counter=0
[ngAfterContentChecked] counter=0
[ngAfterViewInit] counter=0
[ngAfterViewChecked] counter=0
```

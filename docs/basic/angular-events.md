---
outline: deep
---

# Angular Events — Phản Ứng Với Hành Động Người Dùng

Tài liệu này trình bày toàn diện về **Event Binding** trong Angular — cách template lắng nghe và phản hồi các hành động từ người dùng (click, nhập liệu, bàn phím, focus…) cũng như cách component giao tiếp qua custom event.

> **Kiến thức liên quan:** [Templates (AEM)](/docs/basic/angular-templates-for-aem) · [Data Binding](/docs/basic/angular-data-binding-for-aem) · [Components](/docs/basic/angular-component)

---

## 1) KHÁI NIỆM EVENT BINDING

Event Binding là cơ chế để **template lắng nghe sự kiện** từ DOM (hoặc từ component con) và **gọi một phương thức** trong class component để xử lý.

```text
TEMPLATE                          COMPONENT CLASS
─────────                         ────────────────
(click)="onSave()"  ───────────►  onSave() { ... }
(input)="onType($event)" ──────►  onType(ev: Event) { ... }
```

### Tổng quan hướng dữ liệu

| Hướng                     | Ý nghĩa                                    | Cú pháp                        |
|---------------------------|--------------------------------------------|--------------------------------|
| **DOM → Component**       | Bắt sự kiện từ người dùng                  | `(event)="handler()"`         |
| **Child → Parent**        | Nhận tín hiệu từ component con             | `(customEvent)="handler($event)"` |
| **Two‑way**               | Đồng bộ hai chiều tự động                  | `[(banana)]="prop"`            |

---

## 2) CÚ PHÁP CƠ BẢN

### 2.1) Event binding với DOM event

```html
<button type="button" (click)="onSave()">Lưu</button>
<a (mouseenter)="onHoverStart()" (mouseleave)="onHoverEnd()">Link</a>
<input (input)="onSearchInput($event)" />
```

- Dấu ngoặc đơn `( )` bao tên sự kiện.
- Bên phải dấu `=` là **template statement** — một hoặc nhiều câu lệnh TypeScript đơn giản.

### 2.2) Gọi method với tham số

```html
<button type="button" (click)="deleteItem(item.id)">Xóa</button>
<li (click)="selectRow(row, $event)">{{ row.label }}</li>
```

### 2.3) Statement ngắn gán biến

```html
<button type="button" (click)="showDetails = !showDetails">Toggle</button>
<input (input)="searchTerm = $any($event.target).value" />
```

> **Best practice:** Với logic có > 1 dòng, luôn gọi một method trong class để dễ test và bảo trì.

---

## 3) ĐỐI TƯỢNG `$event`

`$event` là object mà trình duyệt (hoặc component con) truyền cho sự kiện. Angular phơi bày nó dưới dạng biến cục bộ trong template statement.

### 3.1) DOM Event

```html
<input (input)="onInput($event)" />
<button (click)="onClick($event)">Click</button>
```

```typescript
// Component class
onInput(ev: Event) {
  const input = ev.target as HTMLInputElement;
  this.query.set(input.value);
}

onClick(ev: MouseEvent) {
  console.log('Tọa độ:', ev.clientX, ev.clientY);
  ev.preventDefault();   // nếu cần
}
```

### 3.2) Custom Event từ component con

Khi component con emit bằng `output()`, `$event` chính là **payload** được emit.

```html
<aem-filter (changed)="applyFilter($event)" />
```

```typescript
// Parent class
applyFilter(criteria: FilterCriteria) {
  this.activeFilter.set(criteria);
}
```

---

## 4) CÁC LOẠI EVENT DOM THƯỜNG DÙNG

### 4.1) Mouse Events

| Event         | Kích hoạt khi…                     |
|---------------|------------------------------------|
| `click`       | Nhấn và thả chuột                  |
| `dblclick`    | Nhấn đúp                           |
| `mousedown`   | Nhấn nút chuột xuống               |
| `mouseup`     | Thả nút chuột                      |
| `mouseenter`  | Con trỏ vào phần tử                |
| `mouseleave`  | Con trỏ rời khỏi phần tử           |
| `mousemove`   | Con trỏ di chuyển trên phần tử     |

Ví dụ:

```html
<div
  class="card"
  (mouseenter)="highlight.set(true)"
  (mouseleave)="highlight.set(false)"
  (click)="openDetail(card.id)"
>
  {{ card.title }}
</div>
```

### 4.2) Keyboard Events

| Event      | Kích hoạt khi…                  |
|------------|---------------------------------|
| `keydown`  | Nhấn một phím xuống             |
| `keyup`    | Thả một phím ra                 |
| `keypress` | Đã lỗi thời — không dùng       |

**Ví dụ thực tế:** Đóng modal khi nhấn Escape.

```html
<div class="modal-overlay" (keydown)="onModalKeydown($event)" tabindex="0">
  <div class="modal-content">...</div>
</div>
```

```typescript
onModalKeydown(ev: KeyboardEvent) {
  if (ev.key === 'Escape') {
    this.close();
  }
  if (ev.key === 'Enter') {
    this.confirm();
  }
}
```

**Lọc phím ngay trong template:**

```html
<input (keydown.enter)="onSearch()" (keydown.escape)="clearSearch()" />
```

> Angular hỗ trợ **pseudo‑event** `keydown.enter`, `keydown.escape`, `keydown.space`, `keydown.arrowUp`, v.v. — code gọn hơn, không cần check `ev.key`.

### 4.3) Input & Change Events

| Event    | Kích hoạt khi…                                |
|----------|-----------------------------------------------|
| `input`  | Giá trị của `<input>`, `<textarea>`, `<select>` thay đổi (từng ký tự) |
| `change` | Người dùng "commit" thay đổi (blur khỏi field) |

```html
<!-- Phản hồi tức thì mỗi lần gõ -->
<input [value]="term()" (input)="term.set($any($event.target).value)" />

<!-- Phản hồi khi blur -->
<input [value]="term()" (change)="onTermChange($any($event.target).value)" />
```

### 4.4) Focus & Blur

```html
<input
  (focus)="onFocus()"
  (blur)="onBlur()"
/>
```

```typescript
isFocused = signal(false);
onFocus() { this.isFocused.set(true); }
onBlur()  { this.isFocused.set(false); }
```

### 4.5) Form Submit

```html
<form (ngSubmit)="onSubmit()">
  <input name="title" [(ngModel)]="title" />
  <button type="submit">Gửi</button>
</form>
```

```typescript
import { FormsModule } from '@angular/forms';

onSubmit() {
  // Gọi API lưu dữ liệu
  console.log('Form submitted:', this.title());
}
```

> `(ngSubmit)` ngăn reload trang mặc định. Nếu dùng `<button>` ngoài form, dùng `type="button"` để tránh submit ngoài ý muốn.

---

## 5) CUSTOM EVENT — GIAO TIẾP CON → CHA

Trong Angular 20+, dùng **`output()`** (signal‑based) thay vì `@Output()` decorator.

### 5.1) Tạo custom event với `output()`

```typescript
// paginator.component.ts
import { Component, output } from '@angular/core';

@Component({
  selector: 'app-paginator',
  template: `
    <button type="button" (click)="goTo(current() - 1)">← Trước</button>
    <span>Trang {{ current() }} / {{ total() }}</span>
    <button type="button" (click)="goTo(current() + 1)">Sau →</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginatorComponent {
  readonly current = model(1);
  readonly total = input.required<number>();
  readonly pageChange = output<number>();

  protected goTo(page: number) {
    if (page >= 1 && page <= this.total()) {
      this.current.set(page);
      this.pageChange.emit(page);
    }
  }
}
```

### 5.2) Lắng nghe custom event ở parent

```html
<!-- parent template -->
<app-paginator
  [total]="totalPages()"
  (pageChange)="loadPage($event)"
/>
```

```typescript
// parent.component.ts
loadPage(page: number) {
  this.currentPage.set(page);
  this.fetchData(page);
}
```

### 5.3) `output()` có alias

```typescript
readonly erased = output<void>({ alias: 'onErase' });
```

Parent vẫn dùng tên alias:

```html
<app-search (onErase)="clear()" />
```

### 5.4) So sánh `output()` và `@Output()`

| Đặc điểm                   | `output()` (Angular 17.3+) | `@Output()` (cũ)      |
|----------------------------|---------------------------|------------------------|
| Cú pháp                    | Hàm signal‑based         | Decorator              |
| `.emit()`                  | Có                        | Có                     |
| Observable từ output       | subscribe vào `output().subscribe()` | Dùng `EventEmitter` |
| Khuyến nghị                | ✅                        | Tránh dùng             |

---

## 6) TWO‑WAY BINDING VỚI `model()`

`model()` kết hợp một input và một output **cùng tên** để tạo liên kết hai chiều.

### 6.1) Tạo component với `model()`

```typescript
// toggle.component.ts
import { Component, model, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-toggle',
  template: `
    <button
      type="button"
      [class.on]="checked()"
      (click)="checked.set(!checked())"
    >
      {{ checked() ? 'BẬT' : 'TẮT' }}
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleComponent {
  readonly checked = model(false);
}
```

### 6.2) Sử dụng two‑way binding

```html
<app-toggle [(checked)]="darkMode" />
<p>Dark mode: {{ darkMode() }}</p>
```

```typescript
darkMode = signal(false);
```

Cú pháp `[(checked)]` là **“banana in a box”** — viết tắt của:

```html
<app-toggle [checked]="darkMode()" (checkedChange)="darkMode.set($event)" />
```

### 6.3) Khi nào dùng `model()` vs `input()` + `output()`

| Tình huống                          | Pattern phù hợp            |
|-------------------------------------|----------------------------|
| State thuộc về cha, con chỉ mượn    | `model()` two‑way          |
| Con báo sự kiện **không** thay đổi input | `input()` + `output()` |
| Form control đơn giản               | `model()` two‑way          |
| Component con chỉ hiển thị          | `input()` một chiều        |

---

## 7) PSEUDO‑EVENT (LỌC SỰ KIỆN THEO KEY/MODIFIER)

Angular cung cấp cú pháp lọc sự kiện ngắn gọn:

### 7.1) Keyboard pseudo‑event

```html
<input (keydown.enter)="search()" />
<input (keydown.escape)="cancel()" />
<textarea (keydown.control.enter)="submit()"></textarea>
<button (keydown.shift.s)="saveSilent()">Save</button>
```

### 7.2) Các pseudo‑event được hỗ trợ

| Pseudo‑event             | Ý nghĩa                            |
|--------------------------|------------------------------------|
| `keydown.enter`          | Phím Enter                         |
| `keydown.escape`         | Phím Escape                        |
| `keydown.space`          | Phím Space                         |
| `keydown.tab`            | Phím Tab                           |
| `keydown.arrowUp`        | Phím mũi tên lên                   |
| `keydown.arrowDown`      | Phím mũi tên xuống                 |
| `keydown.arrowLeft`      | Phím mũi tên trái                  |
| `keydown.arrowRight`     | Phím mũi tên phải                  |
| `keydown.control.X`      | Ctrl + phím X                      |
| `keydown.shift.X`        | Shift + phím X                     |
| `keydown.alt.X`          | Alt + phím X                       |
| `keydown.meta.X`         | Meta (Cmd/Win) + phím X            |

---

## 8) TEMPLATE REFERENCE VARIABLE + EVENT

Template reference variable (`#tên`) cho phép truy cập trực tiếp phần tử DOM hoặc directive instance trong template statement.

```html
<input #queryInput (input)="onQuery(queryInput.value)" />
<button type="button" (click)="queryInput.value = ''; queryInput.focus()">
  Xóa
</button>
```

**Trường hợp AEM thực tế:** Lấy giá trị input nhanh mà không cần signal trung gian.

```html
<input #slugInput [value]="pageSlug()" />
<button type="button" (click)="updateSlug(slugInput.value)">Cập nhật</button>
```

> **Lưu ý:** Khi logic phức tạp, đưa về class component thay vì thao tác DOM trực tiếp.

---

## 9) HOST LISTENER — LẮNG NGHE SỰ KIỆN TRÊN CHÍNH COMPONENT/DIRECTIVE

Trong Angular 20+, **không dùng `@HostListener` decorator**. Thay vào đó, khai báo trong metadata `host`.

```typescript
import { Directive, inject, ElementRef } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class ClickOutsideDirective {
  private el = inject(ElementRef);

  onDocumentClick(ev: MouseEvent) {
    if (!this.el.nativeElement.contains(ev.target)) {
      console.log('Người dùng click bên ngoài!');
    }
  }
}
```

Với component:

```typescript
@Component({
  selector: 'app-dropdown',
  template: `...`,
  host: {
    '(keydown.escape)': 'close()',
    '(window:resize)': 'onWindowResize()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownComponent {
  close() { this.open.set(false); }
  onWindowResize() { /* tính lại vị trí */ }
}
```

---

## 10) BEST PRACTICES

### 10.1) Luôn dùng `(event)="method()"` thay vì logic dài

```html
<!-- ❌ Tránh -->
<button (click)="items.push(newItem); newItem = ''; showForm = false; saveToServer()">
  OK
</button>

<!-- ✅ Tốt -->
<button type="button" (click)="onConfirmNewItem()">OK</button>
```

```typescript
onConfirmNewItem() {
  this.items.update(arr => [...arr, this.newItem()]);
  this.newItem.set('');
  this.showForm.set(false);
  this.saveToServer();
}
```

### 10.2) Tránh truy cập DOM trực tiếp trong template statement

```html
<!-- ❌ Tránh -->
<button (click)="$any($event.target).disabled = true">...</button>

<!-- ✅ Tốt -->
<button type="button" [disabled]="submitting()" (click)="submit()">...</button>
```

### 10.3) Luôn dùng `output()` thay `@Output()` decorator

```typescript
// ✅ Angular 20+
readonly selected = output<string>();

// ❌ Không dùng
// @Output() selected = new EventEmitter<string>();
```

### 10.4) Sử dụng pseudo‑event để code sạch hơn

```html
<!-- ✅ Gọn, dễ đọc -->
<input (keydown.enter)="search()" (keydown.escape)="clear()" />

<!-- ❌ Dài dòng không cần thiết -->
<input (keydown)="onKeydown($event)" />
```
```typescript
// ❌ Cồng kềnh
onKeydown(ev: KeyboardEvent) {
  if (ev.key === 'Enter') this.search();
  if (ev.key === 'Escape') this.clear();
}
```

### 10.5) Đảm bảo accessibility với keyboard events

Khi thêm `(click)` vào phần tử không tương tác tự nhiên (như `<div>`, `<li>`), **phải** bổ sung keyboard handler tương ứng.

```html
<!-- ✅ Đầy đủ -->
<div
  class="card"
  role="button"
  tabindex="0"
  (click)="selectCard(card.id)"
  (keydown.enter)="selectCard(card.id)"
  (keydown.space)="selectCard(card.id); $event.preventDefault()"
>
  {{ card.title }}
</div>
```

> **WCAG 2.2 yêu cầu:** mọi chức năng có thể thao tác bằng chuột phải thao tác được bằng bàn phím.

### 10.6) Gọi `preventDefault()` có chủ đích

```html
<form (ngSubmit)="handleSubmit()">
  <button type="submit">Gửi</button>
</form>
```

- `(ngSubmit)` tự gọi `preventDefault()` → không reload trang.
- Với `<a href="#">`, dùng `(click)="handler($event)"` và gọi `$event.preventDefault()` nếu không muốn điều hướng.
- Tốt hơn: dùng `<button type="button">` thay `<a>` khi không có href thật.

---

## 11) VÍ DỤ TỔNG HỢP — SEARCH BAR CHO AEM

Một component search bar kết hợp nhiều loại event trong ngữ cảnh AEM.

```typescript
// search-bar.component.ts
import {
  Component,
  output,
  model,
  signal,
  ChangeDetectionStrategy,
  FormsModule,
} from '@angular/core';

@Component({
  selector: 'aem-search-bar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="search-bar" [class.expanded]="expanded()">
      <input
        #inputEl
        type="text"
        [attr.aria-label]="placeholder()"
        [placeholder]="placeholder()"
        [(ngModel)]="term"
        (focus)="expanded.set(true)"
        (keydown.escape)="clear()"
        (keydown.arrowDown)="highlightNext()"
        (keydown.arrowUp)="highlightPrev()"
        (keydown.enter)="selectHighlighted()"
      />
      @if (term()) {
        <button
          type="button"
          class="clear-btn"
          aria-label="Xóa tìm kiếm"
          (click)="clear()"
        >
          ✕
        </button>
      }
      <button type="button" class="submit-btn" (click)="search.emit(term())">
        🔍
      </button>
    </div>

    @if (suggestions().length) {
      <ul class="suggestions" role="listbox">
        @for (item of suggestions(); track item.value) {
          <li
            role="option"
            [class.highlighted]="highlightedIndex() === $index"
            (click)="selectSuggestion(item)"
            (mouseenter)="highlightedIndex.set($index)"
          >
            {{ item.label }}
          </li>
        }
      </ul>
    }
  `,
  styles: [`
    .search-bar { display: flex; gap: 4px; }
    .expanded { /* viền focus */ }
    .highlighted { background: var(--accent-bg); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent {
  /** Placeholder từ AEM dialog */
  readonly placeholder = input('Tìm kiếm...');

  /** Danh sách gợi ý từ service */
  readonly suggestions = input<Array<{ label: string; value: string }>>([]);

  /** Emit khi người dùng submit search */
  readonly search = output<string>();

  /** Two‑way term để parent có thể đọc/ghi từ bên ngoài */
  readonly term = model('');

  readonly expanded = signal(false);
  readonly highlightedIndex = signal(-1);

  protected clear(): void {
    this.term.set('');
    this.expanded.set(false);
  }

  protected highlightNext(): void {
    const len = this.suggestions().length;
    this.highlightedIndex.update(i => (i + 1) % len);
  }

  protected highlightPrev(): void {
    const len = this.suggestions().length;
    this.highlightedIndex.update(i => (i - 1 + len) % len);
  }

  protected selectHighlighted(): void {
    const idx = this.highlightedIndex();
    const sug = this.suggestions()[idx];
    if (sug) {
      this.selectSuggestion(sug);
    } else {
      this.search.emit(this.term());
    }
  }

  protected selectSuggestion(item: { label: string; value: string }): void {
    this.term.set(item.value);
    this.search.emit(item.value);
    this.expanded.set(false);
  }
}
```

### Sử dụng trong AEM container:

```html
<aem-search-bar
  placeholder="Nhập tiêu đề bài viết..."
  [suggestions]="searchSuggestions()"
  [(term)]="searchTerm"
  (search)="executeSearch($event)"
/>
```

```typescript
executeSearch(query: string) {
  this.router.navigate([], {
    queryParams: { q: query, page: 1 },
  });
}
```

---

## 12) KIỂM TRA KIẾN THỨC

1. Phân biệt `(event)="handler()"` và `[prop]="value"` — mỗi cái truyền dữ liệu theo hướng nào?
2. `$event` trong `(click)="handle($event)"` khác gì với `$event` trong `(customEvent)="handle($event)"` khi custom event được emit từ component con?
3. Tại sao nên dùng `(keydown.enter)` thay vì kiểm tra `ev.key === 'Enter'` trong handler?
4. Khi nào dùng `model()` two‑way binding thay vì `input()` + `output()` riêng lẻ?
5. Một `<div>` có `(click)` cần thêm những gì để đảm bảo accessibility?
6. `output()` khác `EventEmitter` (từ `@Output`) ở điểm nào về mặt khai báo và API?
7. Tại sao không nên viết logic phức tạp trực tiếp trong template statement?
8. `(ngSubmit)` mang lại lợi ích gì so với `(submit)` trên `<form>`?

---

## 13) CHEAT SHEET

```text
Sự kiện DOM             → (click)="fn()"
Keyboard đơn giản       → (keydown.enter)="fn()"
Keyboard có modifier    → (keydown.control.s)="fn()"
Custom event từ con     → (pageChange)="load($event)"
Two‑way binding         → [(modelProp)]="parentSignal"
Host listener           → host: { '(window:resize)': 'fn()' }
Template ref + event    → #el (input)="fn(el.value)"
Ngăn hành vi mặc định    → $event.preventDefault() trong method
```

---

Tài liệu kết thúc.
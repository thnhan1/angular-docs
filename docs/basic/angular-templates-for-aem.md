---
outline: deep
---

# Angular Templates (v17+) cho AEM Developer

Mục tiêu của phần này là giúp bạn đọc/viết template Angular theo kiểu “model-driven UI” giống AEM: dữ liệu (model) quyết định render gì, render như thế nào, và event từ UI đi ngược lại để cập nhật state/service.

> Bạn nên đọc kèm “Components” để hiểu `imports`/standalone, nhưng phần dưới tập trung **template syntax**.

---

## 1) Interpolation <code v-pre>{{ ... }}</code>

Interpolation dùng để render **giá trị text** vào DOM.

```html
<h1>{{ title }}</h1>
<p>Hello {{ user.name }}</p>
```

Lưu ý thực dụng:
- **Không dùng interpolation cho “thuộc tính”** (attribute/property) khi cần binding chuẩn; hãy dùng `[prop]="expr"` hoặc `[attr.name]="expr"`.
- Expression trong <code v-pre>{{ }}</code> là TypeScript expression “an toàn”: không tạo statement (không `if`, không `new`, không `;`).

---

## 2) Template reference variable `#var`

Bạn có thể tham chiếu một element/instance directive trong template bằng `#name`.

```html
<input #q (input)="onQuery(q.value)" />
<button (click)="q.value = ''">Clear</button>
```

Trong thực tế AEM dev hay dùng để:
- Lấy value nhanh từ input.
- Truy cập API của component/directive con (ví dụ: `#panel`).

---

## 3) Null-safe navigation `?.` (safe navigation)

Khi dữ liệu từ AEM model/service có thể `null/undefined`, dùng `?.` để tránh lỗi runtime.

```html
<h2>{{ model?.title }}</h2>
<p>{{ model?.author?.name }}</p>
```

Gợi ý:
- Nếu bạn thường xuyên phải `?.`, hãy cân nhắc **đặt “initial model”** (default object) ở component/service, hoặc dùng `@if (model as m)` để “narrow” kiểu.

---

## 4) Property / Attribute binding

### 4.1) Property binding `[prop]="expr"`

Áp dụng cho DOM property hoặc input của component/directive.

```html
<img [src]="imageUrl" [alt]="altText" />
<aem-hero [title]="model.title" />
```

### 4.2) Attribute binding `[attr.name]="expr"`

Dùng khi bạn cần set **HTML attribute** (không phải DOM property) hoặc attribute “không tồn tại như property”.

```html
<td [attr.colspan]="colSpan"></td>
<a [attr.aria-label]="label"></a>
```

Rule of thumb:
- **90% dùng property binding**.
- Dùng attribute binding cho `aria-*`, `colspan/rowspan`, `data-*`, hoặc khi bạn biết chắc thứ cần set là attribute.

---

## 5) Class & Style binding

```html
<div [class.is-active]="active" [class.has-error]="error"></div>

<div [style.width.px]="widthPx" [style.display]="hidden ? 'none' : ''"></div>
```

Gợi ý cho AEM:
- Khi AEM authoring điều khiển “variant/theme”, class binding thường là cách gọn nhất để map config → CSS class.

---

## 6) Statements, events và `$event`

### 6.1) Event binding `(event)="statement"`

```html
<button (click)="save()">Save</button>
<input (input)="onInput($event)" />
```

`$event` là object event DOM (hoặc event custom từ component con).

```html
<input (input)="query = ($any($event.target)).value" />
```

Best practice:
- Tránh nhét logic dài vào template. Hãy gọi method `onXxx(...)` trong class.

### 6.2) Custom event từ component con

```html
<aem-filter (changed)="onFilterChanged($event)" />
```

Trong đó `$event` là payload bạn emit từ child component.

---

## 7) Alias (gán biến trong template)

Angular v17+ control flow cho phép alias để tránh gọi expression lặp lại và “narrow” kiểu.

```html
@if (model(); as m) {
  <h1>{{ m.title }}</h1>
  <p>{{ m.description }}</p>
} @else {
  <p>Loading...</p>
}
```

Khi nào nên dùng:
- Khi dữ liệu có thể null, alias giúp bạn dùng `m.xxx` mà không cần `?.` everywhere.
- Khi bạn muốn “đặt tên” một computed/pipe result để đọc dễ hơn.

---

## 8) Pipes `|`

Pipes dùng để transform data trong template.

Ví dụ built-in thường gặp:

```html
<p>{{ price | currency:'USD' }}</p>
<p>{{ createdAt | date:'medium' }}</p>
<pre>{{ model | json }}</pre>
```

Lưu ý:
- Pipes tốt cho format/transform “nhẹ”.
- Nếu transform nặng (filter/sort lớn), cân nhắc làm ở `computed()`/service để dễ kiểm soát performance và test.

---

## 9) Structural directives / Control flow (render theo điều kiện & lặp)

### 9.1) `@if / @else`

```html
@if (isAuthorMode) {
  <p>Authoring preview</p>
} @else {
  <p>Publish view</p>
}
```

### 9.2) `@for` và `track`

```html
@for (item of items; track item.id) {
  <div class="card">{{ item.title }}</div>
} @empty {
  <p>No items</p>
}
```

Trong ngữ cảnh AEM (danh sách components/cards), **luôn track** để tránh re-render không cần thiết khi list thay đổi.

### 9.3) `@switch / @case`

Rất hợp cho page “blocks” theo `type` từ AEM model.

```html
@switch (block.type) {
  @case ('hero') { <aem-hero [title]="block.title" /> }
  @case ('cta') { <a [href]="block.href">{{ block.text }}</a> }
  @default { <p>Unsupported block</p> }
}
```

### 9.4) Legacy `*ngIf/*ngFor` (đọc để hiểu code cũ)

Bạn vẫn sẽ gặp trong dự án:

```html
<div *ngIf="model as m; else loading">
  {{ m.title }}
</div>
<ng-template #loading>Loading...</ng-template>

<li *ngFor="let item of items; trackBy: trackById">{{ item.title }}</li>
```

---

## 10) `ngTemplateOutlet` (render template động)

### 10.1) Use-case “slot” đơn giản (giống chèn nội dung theo layout)

```html
<ng-container *ngTemplateOutlet="bodyTpl"></ng-container>

<ng-template #bodyTpl>
  <p>Body content</p>
</ng-template>
```

### 10.2) Truyền context vào template

```html
<ng-container
  *ngTemplateOutlet="itemTpl; context: { $implicit: item, index: i }"
></ng-container>

<ng-template #itemTpl let-x let-i="index">
  <div>{{ i }} - {{ x.title }}</div>
</ng-template>
```

Rule of thumb:
- Dùng `ngTemplateOutlet` để tái sử dụng snippet UI.
- Nếu template động bắt đầu phình to, hãy chuyển sang **component theo type** để maintain dễ hơn.

---

## 11) TrackBy / tracking (vì sao quan trọng)

Trong list, Angular cần biết “item nào là item nào” để update DOM hiệu quả.

### 11.1) Với `@for`: dùng `track item.id`

```html
@for (c of cards; track c.id) {
  <aem-card [model]="c" />
}
```

### 11.2) Với `*ngFor`: `trackBy`

```html
<li *ngFor="let c of cards; trackBy: trackById">{{ c.title }}</li>
```

```ts
trackById = (_: number, c: { id: string }) => c.id;
```

Trong AEM, data list thường đến từ model JSON; `id` ổn định giúp:
- Giảm “flicker” UI khi refresh model.
- Tránh mất focus/scroll khi list update.

---

## 12) Checklist nhanh khi viết template (AEM mindset)

- **Model có thể null**: dùng `@if (model as m)` hoặc `?.`.
- **List render**: luôn `track`/`trackBy`.
- **Bindings rõ ràng**: text → <code v-pre>{{ }}</code>, property → `[x]`, attribute → `[attr.x]`.
- **Logic trong class**: template chỉ điều phối hiển thị & gọi handler.


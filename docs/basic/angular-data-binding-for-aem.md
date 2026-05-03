---
outline: deep
---

# Angular Data Binding (v17+) — Tài liệu chi tiết

Tài liệu này mô tả **cơ chế gắn dữ liệu giữa class component và template** trong Angular ở mức độ dùng được trong dự án thật (docs cho developer). Kiến thức bổ trợ: [Templates](/docs/basic/angular-templates-for-aem), [Components](/docs/basic/angular-component).

**Tham khảo chính thức:** [Angular Templates](https://angular.dev/guide/templates/overview) và các mục *Property binding*, *Event binding*, *Two-way binding* trong cùng bộ Angular docs.

---

## 1) Tổng quan: luồng dữ liệu

Angular template binding gồm hai hướng chính:

| Hướng | Ý nghĩa | Syntax tiêu biểu |
|------|---------|-------------------|
| **Component → view** | Giá trị từ class (model/state) được phản chiếu lên DOM | Interpolation <code v-pre>{{ expr }}</code>, `[property]="expr"`, `[attr.*]`, `[class.*]`, `[style.*]` |
| **View → component** | Sự kiện từ DOM hoặc child component được xử lý trong class | `(event)="stmt"`, hai chiều `[(prop)]="…"` |

Nguyên tắc thực tế:

- **Một chiều từ dữ liệu ra UI** giúp dễ đoán: state thay đổi → template cập nhật (change detection hoặc **Signals** không cần push thủ công trong nhiều trường hợp).
- **Hai chiều** (`[(ngModel)]` hoặc pattern “banana”) phù hợp điều khiển form/control; đừng lạm dụng cho toàn app.

---

## 2) “Template expression” vs “template statement”

### 2.1) Template expression (một chiều: interpolation, property/class/style bindings)

Được Angular đánh giá trong **context** của component (truy cập `public`/protected members, không cần `this` trong template).

**Đặc điểm:**

- Chỉ là **expression** (có giá trị), **không** phải câu lệnh đầy đủ.
- Không dùng: `=` gán biến, `++`, `--`, `;` nối statement, pipe `|` (pipes là ngoại lệ chỉ được phép trong interpolation và binding value), v.v. tuân theo [Angular expression grammar](https://angular.dev/guide/templates/expressions).

```html
<!-- Hợp lệ -->
<p>{{ items.length }}</p>
<p>{{ price * quantity }}</p>
<img [src]="baseUrl + '/' + fileName" />

<!-- Không là “full statement”: gán trực tiếp chỉ được trong một số chỗ đặc biệt như handler -->
<!-- Tránh trong expression thuần -->
```

### 2.2) Template statement (sự kiện hai chiều / handler)

Đứng sau `(event)="..."`; Angular chạy nó như một **chuỗi statements** được phép trong template (gọi hàm, gán vào prop component, `$event`-driven logic).

```html
<button type="button" (click)="save()">Save</button>
<button type="button" (click)="count = count + 1">+</button>
```

**Best practice:** giữ handler **ngắn**, đẩy logic sang method trong class để dễ test và debug.

---

## 3) Interpolation (<code v-pre>{{ }}</code>)

Đồng bộ **chuỗi hiển thị** vào text node của template.

### 3.1) Cách dùng

```html
<h1>{{ pageTitle }}</h1>
<p>{{ user()?.firstName }} {{ user()?.lastName }}</p>
```

Với **`input()` / signal** trong component hiện đại:

```html
<h1>{{ title() }}</h1>
```

### 3.2) Giới hạn thực tế

- **Luôn được stringify** một cách an toàn (không nhú HTML raw chỉ nhờ interpolation).
- Không binding **property** của element chỉ qua interpolation: so sánh sai với `[src]="…"`.

::: tip Chuẩn lựa chọn
Interpolation = **text trong markup**. Thuộc tính động = **`[prop]`** hoặc **`[attr.name]`**.
:::

---

## 4) Property binding: `[property]="expression"`

Đặt **DOM property** hoặc **@Input của directive/component**.

### 4.1) DOM property vs attribute tĩnh

```html
<!-- Attribute tĩnh (string literal) -->
<img src="./logo.png" alt="Logo" />

<!-- Property động: khi đường dẫn đổi theo runtime -->
<img [src]="assetUrl()" [alt]="altText()" />
```

Sự khác quan trọng: ví dụ `disabled` của `<button>` — trình duyệt đọc **property** boolean; chỉ nhét `[attr.disabled]="false"` không tương đương `disabled="{{false}}"`. Ưu tiên:

```html
<button type="button" [disabled]="isBusy()">Submit</button>
```

### 4.2) Binding vào `@Input()` / `input()` của component con

```html
<aem-teaser [headline]="block.title" [href]="block.link.href" />
```

Class con (ví dụ signal input):

```ts
@Component({ /* … */ })
export class TeaserComponent {
  headline = input.required<string>();
  href = input<string>();
}
```

### 4.3) “Target” không tồn tại là lỗi compile

Angular kiểm tra nhiều property input tại compile-time; typo trên `@Input()` sẽ fail sớm (tốt cho CI).

---

## 5) Attribute binding: `[attr.name]="expression"`

HTML **attribute** (chuỗi trên markup) không phải lúc nào cũng có property đồng tên một-một đúng nghĩa.

### 5.1) Khi bắt buộc dùng `[attr.]`

```html
<td [attr.colspan]="mergedColumns"></td>
<button type="button" [attr.aria-expanded]="expanded()"></button>
<section [attr.data-analytics-section]="analyticsId"></section>
```

### 5.2) Thuộc tính chứa dấu gạch (`aria-*`, `data-*`)

Tên được viết trong template **đúng với DOM** (`aria-label`, không camelCase sai chuẩn).

### 5.3) Binding `null` / `undefined` / empty

Thường Angular **xoá attribute** khỏi element khi giá trị là `null` / `undefined` (hữu ích cho cờ có/không). Kiểm tra hành vi cụ thể với Accessibility khi làm authoring AEM.

---

## 6) Class binding

### 6.1) Toggle một class cụ thể: `[class.ten-class]="boolean"`

```html
<div class="card" [class.card--featured]="featured()" [class.is-loading]="pending()"></div>
```

### 6.2) Class binding vào `"class"` (toàn bộ)

```html
<div [class]="hostClassNames()"></div>
```

Chú ý overwrite: có thể cần kết hợp literal + binding.

### 6.3) `NgClass` (directive)

Khi cần nhiều class theo map/array; import `NgClass`:

```html
<div [ngClass]="{ active: tab === 'draft', muted: collapsed }"></div>
```

Standalone:

```ts
@Component({
  standalone: true,
  imports: [NgClass],
  // …
})
export class TabsComponent {}
```

---

## 7) Style binding

### 7.1) Theo thuộc tính

```html
<p [style.color]="accentColor()">{{ text }}</p>
```

### 7.2) Đơn vị rút gọn: `.px`, `.em`, …

```html
<div class="banner" [style.height.px]="bannerHeight()" [style.maxWidth.%]="widthPercent"></div>
```

### 7.3) `NgStyle` (directive)

Thuận tiện khi object style động từ authoring / theme:

```html
<section [ngStyle]="containerVars()"></section>
```

```ts
@Component({
  standalone: true,
  imports: [NgStyle],
})
export class ThemeSectionComponent {}
```

---

## 8) Event binding: `(targetEvent)="statement"`

DOM events hoặc `@Output()` từ child.

### 8.1) DOM event và `$event`

```html
<input (input)="onSearch($event)" />
<button type="button" (click)="onSubmit($event)">Go</button>
```

```ts
onSearch(ev: Event) {
  const value = (ev.target as HTMLInputElement).value;
  this.search.set(value);
}

onSubmit(ev: MouseEvent) {
  ev.preventDefault();
  // ...
}
```

### 8.2) Custom `@Output()` / `output()`

Child:

```ts
@Component({ selector: 'aem-pagination', standalone: true, template: `...` })
export class PaginationComponent {
  readonly pageChange = output<number>();
  emitNext() {
    this.pageChange.emit(this.currentPage() + 1);
  }
  currentPage = signal(1);
}
```

Parent:

```html
<aem-pagination (pageChange)="loadPage($event)" />
```

### 8.3) Truyền thêm tham số (thiết kế có chủ đích)

```html
<button type="button" (click)="selectBlock(block.id, $event)">Pick</button>
```

Tránh làm khó refactor: chỉ `$event` + id khi không thể refactor query từ data.

---

## 9) Two-way binding (chuối trong hộp: `[(...)]`)

Hai chiều = `@Input`-like **và** event “change” cùng tên theo convention: `[(size)]` gắn với **`size`** + **`sizeChange`**.

### 9.1) `[(ngModel)]` — Forms (import `FormsModule`)

```html
<input name="slug" [(ngModel)]="pageSlug" />
```

```ts
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [FormsModule],
})
export class PageMetaComponent {
  pageSlug = '';
}
```

**Lưu ý AEM/dev:**

- Cần `name` trong form không nested duplicate (hoặc `[ngModelOptions]` trong form phức tạp).
- Production form lớn thường chuyển sang **Reactive Forms** (`FormControl`, `formControlName`) — không nằm trong file này nhưng cùng gia đình “binding dữ liệu”.

### 9.2) Custom hai chiều trên component

Child:

```ts
import { Component, model } from '@angular/core';

@Component({
  selector: 'aem-page-size-picker',
  standalone: true,
  template: `
    <button type="button" (click)="pick('S')">S</button>
    <button type="button" (click)="pick('M')">M</button>
    <button type="button" (click)="pick('L')">L</button>
  `,
})
export class PageSizePickerComponent {
  readonly size = model.required<'S' | 'M' | 'L'>();
  protected pick(next: 'S' | 'M' | 'L') {
    this.size.set(next);
  }
}
```

Parent (trường thường gặp: biến thường; có thể dùng `model()` ở parent nếu cần two-way có API signal):

```ts
export class ParentComponent {
  size: 'S' | 'M' | 'L' = 'M';
}
```

```html
<aem-page-size-picker [(size)]="size" />
```

`model()` (Angular 17.1+) là cách được khuyến nghị thay `@Input/@Output` thủ công cho một số kiểu “state sync” có tên có sẵn.

---

## 10) Chuỗi hỗn hợp: vừa tĩnh vừa động

```html
<a [href]="`/content/${ locale }/${ slug }`">Open</a>
<img [src]="CDN + hero.path" [alt]="hero.altText ?? ''" />
```

Phân biệt:

```html
<div class="rte" [innerHTML]="trustedOrSanitizedHtml()"></div>
```

`innerHTML` binding phải nguồn đáng tin hoặc qua sanitization của Angular/XSS policies — không copy raw AEM rich text blindly.

---

## 11) Hai chiều vs một chiều: khi chọn pattern nào

| Tình huống | Pattern gợi ý |
|------------|----------------|
| Content từ Sling/model hiển thị chỉ đọc | `[prop]`, interpolation |
| Nút/tab đổi state cục bộ | `[class.active]` + `(click)="active.set(tab)"` |
| Input form đơn | `[(ngModel)]` hoặc `FormControl` |
| Toggle “controlled” bởi parent | `@Input()` + `@Output()/output()` hoặc `model()` hai chiều |
| AEM authoring meta (title, cq:…) sync form | Reactive form + một lần map model JSON → controls |

---

## 12) Lỗi thường gặp (debug nhanh)

1. **`ExpressionChangedAfterItHasBeenCheckedError`**: trong dev mode, một binding vừa render xong bị mutate lại trong cùng một CD cycle — di chuyển cập nhật sang timer queue, Observable async, hoặc `scheduleMicrotask`; với Signals, tránh mutate signal đồng bộ không cần thiết ngay trong hook sai chỗ.

2. **Quên import `FormsModule` / directive** (`NgClass`, `NgStyle`): lỗi template unknown property hoặc “not a known element” — với standalone, thêm vào `imports: []`.

3. **`[attr.disabled]` với `"false"`** vẫn disable vì attribute tồn tại → dùng `[disabled]` trên nút hoặc bỏ hẳn attribute.

4. **Child không emit đúng tên hai chiều**: `[(value)]` cần `valueChange`; nhầm tên output → không sync.

---

## 13) Cheat sheet nhớ nhanh

```text
Chiều dữ liệu → DOM   : interpolation, [prop], [attr.*], [class.*], [style.*]
Chiều DOM → component : (event)
Hai chiều             : [(ngModel)], [(model)], hoặc [x] + (xChange)
Attribute không có property đúng tên → [attr.xxx]
Chuỗi tĩnh            : attr="literal" (không cần [])
```

---

## 14) Liên quan và đọc thêm

- [Angular Templates overview](https://angular.dev/guide/templates/overview)
- Bài trong cùng bộ docs site: **Templates — interpolation, bindings, directives** ([Templates guide](https://angular.dev/guide/templates))
- Nội bộ: [Templates (AEM)](/docs/basic/angular-templates-for-aem), [Components (AEM)](/docs/basic/angular-component)

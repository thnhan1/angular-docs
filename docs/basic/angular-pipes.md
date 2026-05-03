# Angular Pipes

Pipe chuyển đổi giá trị trong template mà không thay đổi dữ liệu gốc.

**Tương đương AEM**: giống HTL expression options (`format`, `escape`, `i18n`) — format giá trị hiển thị mà không động đến model.

---

## Built-in pipes

### `date` — định dạng ngày tháng

```typescript
@Component({
  template: `
    <p>{{ today }}</p>          <!-- Mon Jan 15 2024 ... -->
    <p>{{ today | date }}</p>  <!-- Jan 15, 2024 -->
    <p>{{ today | date:'dd/MM/yyyy' }}</p> <!-- 15/01/2024 -->
    <p>{{ today | date:'shortTime' }}</p>  <!-- 2:30 PM -->
  `
})
export class ExampleComponent {
  today = new Date();
}
```

**Common formats**: `'medium'`, `'short'`, `'longDate'`, `'dd/MM/yyyy'`, `'HH:mm'`, `'mediumDate'`.

**Locale**: cần `provideLocale` hoặc import locale data nếu dùng ngôn ngữ không phải en-US.

---

### `currency` — tiền tệ

```typescript
template: `
  <p>{{ price | currency }}</p>           <!-- $1,234.56 -->
  <p>{{ price | currency:'VND' }}</p>      <!-- ₫1,235 -->
  <p>{{ price | currency:'EUR':'symbol':'1.2-2' }}</p> <!-- €1,234.56 -->
`

price = 1234.56;
```

**Args**: `'currencyCode'`, `'symbol/code/symbol-narrow'`, `'minIntegerDigits.minFractionDigits-maxFractionDigits'`.

---

### `number` / `percent` / `decimal`

```typescript
template: `
  <p>{{ pi | number }}</p>           <!-- 3.142 -->
  <p>{{ pi | number:'1.1-3' }}</p>  <!-- 3.142 -->
  <p>{{ pi | number:'1.0-0' }}</p>  <!-- 3 -->
  <p>{{ ratio | percent }}</p>       <!-- 25% -->
  <p>{{ ratio | percent:'1.1-2' }}</p> <!-- 25.00% -->
`

pi = 3.14159;
ratio = 0.25;
```

**Format**: `'minIntegerDigits.minFraction-maxFraction'`.

---

### `uppercase` / `lowercase` / `titlecase`

```typescript
template: `
  <p>{{ title | uppercase }}</p>    <!-- ANGULAR FORMS -->
  <p>{{ title | lowercase }}</p>    <!-- angular forms -->
  <p>{{ title | titlecase }}</p>    <!-- Angular Forms -->
`

title = 'angular forms';
```

---

### `slice` — cắt chuỗi/mảng

```typescript
template: `
  <p>{{ text | slice:0:5 }}</p>     <!-- hello -->
  <p>{{ items | slice:1:3 }}</p>    <!-- [1, 2] -->
`

text = 'hello world';
items = [0, 1, 2, 3, 4];
```

**Args**: `slice:start:end` (end optional).

---

### `json` — debug

```typescript
template: `
  <pre>{{ user | json }}</pre>
`

user = { name: 'Nam', role: 'admin' };
// Output: { "name": "Nam", "role": "admin" }
```

**Chỉ dùng cho debug** — không nên render lên UI production.

---

### `async` — unwrap Observable/Promise

```typescript
import { HttpClient } from '@angular/common/http';

template: `
  @if (users$ | async; as users) {
    @for (user of users; track user.id) {
      <p>{{ user.name }}</p>
    }
  } @else {
    <p>Loading...</p>
  }
`

users$ = this.http.get<User[]>('/api/users');
```

**Lưu ý**:
- Pipe tự động `subscribe` khi template active, `unsubscribe` khi component destroy.
- Dùng `as` để assign giá trị vào template variable; tránh gọi `async` nhiều lần trên cùng Observable.

---

### `keyvalue` — iterate Object/Map

```typescript
template: `
  @for (item of config | keyvalue; track item.key) {
    <p>{{ item.key }}: {{ item.value }}</p>
  }
`

config = { apiUrl: 'http://...', timeout: 5000 };
```

---

### `i18nPlural` / `i18nSelect`

```typescript
template: `
  <p>{{ count | i18nPlural:countMapping }}</p>
  <!-- 0: "không có sản phẩm", 1: "1 sản phẩm", other: "10 sản phẩm" -->

  <p>{{ gender | i18nSelect:genderMapping }}</p>
  <!-- male: "Anh", female: "Chị", other: "Bạn" -->
`

count = 10;
countMapping = {
  '=0': 'không có sản phẩm',
  '=1': '1 sản phẩm',
  'other': '# sản phẩm'
};

gender = 'male';
genderMapping = {
  'male': 'Anh',
  'female': 'Chị',
  'other': 'Bạn'
};
```

**Lưu ý**: dùng `i18nPlural` cho số, `i18nSelect` cho string enum.

---

## Chaining pipes

```typescript
template: `
  <p>{{ date | date:'dd/MM/yyyy' | uppercase }}</p> <!-- 15/01/2024 -->
  <p>{{ price | number:'1.0-0' | currency:'USD':'symbol':'1.0-0' }}</p>
`
```

**Thứ tự**: chạy từ trái sang phải; output của pipe trước làm input cho pipe sau.

---

## Custom pipe

### `ng generate pipe`

```bash
ng g pipe pipes/trim
```

```typescript
// trim.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'trim',
  standalone: true
})
export class TrimPipe implements PipeTransform {
  transform(value: string | null, length: number = 100): string {
    if (!value) return '';
    if (value.length <= length) return value;
    return value.substring(0, length) + '...';
  }
}
```

**Dùng**:

```typescript
@Component({
  standalone: true,
  imports: [TrimPipe],
  template: `
    <p>{{ longText | trim:50 }}</p>
  `
})
export class PostComponent {
  longText = 'Lorem ipsum dolor sit amet...';
}
```

---

## Pipe với Signal

### Không dùng `async` với Signal

```typescript
// ❌ Không cần
users = toSignal(this.http.get('/api/users'));  // đã là Signal
template: `{{ users() | json }}`  // OK, users() là giá trị thường

// ✅ Đúng
users = signal<User[]>([]);
template: `{{ users() | json }}`
```

### Pipe custom hỗ trợ Signal

```typescript
import { Pipe, PipeTransform, signal, computed } from '@angular/core';

@Pipe({
  name: 'double',
  standalone: true
})
export class DoublePipe implements PipeTransform {
  transform(value: number): number {
    return value * 2;
  }
}

// Component
count = signal(5);
template: `<p>{{ count() | double }}</p>`  <!-- 10 -->
```

---

## Pipe pure vs impure

### Pure pipe (mặc định)

```typescript
@Pipe({ name: 'sort', pure: true })
export class SortPipe implements PipeTransform {
  transform(value: string[]): string[] {
    return [...value].sort();
  }
}
```

- Chỉ chạy khi **input reference thay đổi**.
- Performance tốt — Angular cache kết quả.

### Impure pipe

```typescript
@Pipe({ name: 'randomSort', pure: false })
export class RandomSortPipe implements PipeTransform {
  transform(value: string[]): string[] {
    return [...value].sort(() => Math.random() - 0.5);
  }
}
```

- Chạy **mỗi change detection cycle**.
- Dùng khi input là mutable object/array mà bạn muốn detect change bên trong; nhưng **tránh** vì performance kém.

---

## Performance — memoization pattern

```typescript
@Pipe({ name: 'heavyCalc', pure: true })
export class HeavyCalcPipe implements PipeTransform {
  private cache = new Map<number, number>();

  transform(value: number): number {
    if (this.cache.has(value)) {
      return this.cache.get(value)!;
    }

    const result = this.calculate(value);
    this.cache.set(value, result);
    return result;
  }

  private calculate(n: number): number {
    // logic nặng
    return n * n;
  }
}
```

**Lưu ý**: pure pipe + cache = memoization; tránh tính toán lại khi input không đổi.

---

## Gotchas

- **`async` không dùng với Signal**: Signal đã là reactive primitive, không cần unwrap.

- **`json` pipe dùng `JSON.stringify`**: sẽ gọi `toJSON()` nếu object có method đó; circular reference sẽ lỗi.

- **Pipe không thay đổi input**: luôn return giá trị mới; không mutate input object/array.

```typescript
// ❌ Tránh
@Pipe({ name: 'sort' })
export class BadSortPipe implements PipeTransform {
  transform(value: string[]) {
    return value.sort();  // mutate original!
  }
}

// ✅ Đúng
@Pipe({ name: 'sort' })
export class GoodSortPipe implements PipeTransform {
  transform(value: string[]) {
    return [...value].sort();  // shallow clone
  }
}
```

- **`date` pipe yêu cầu locale data**: nếu app không phải en-US, import locale:

```typescript
import { registerLocaleData } from '@angular/common';
import localeVi from '@angular/common/locales/vi';

registerLocaleData(localeVi);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: LOCALE_ID, useValue: 'vi-VN' }
  ]
});
```

- **Impure pipe chạy mỗi CD cycle**: dùng cẩn thận; nếu logic nặng sẽ chậm UI.

- **Pipe vs Method trong component**:
  - **Pipe**: tái sử dụng, có thể cache (pure), declarative
  - **Method**: dễ test hơn nếu logic phức tạp; nhưng chạy mỗi CD cycle

  ```typescript
  // Trong component (không cache)
  getFormattedPrice() {
    return this.formatPrice(this.price);
  }
  
  // Pipe (cache nếu pure)
  {{ price | currency:'VND' }}
  ```

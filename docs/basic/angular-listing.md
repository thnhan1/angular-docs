---
outline: deep
---

# Angular Listing — Kỹ thuật hiển thị danh sách từ cơ bản đến nâng cao

Hiển thị danh sách (listing) là một trong những tác vụ phổ biến nhất trong ứng dụng Angular, đặc biệt với các dự án AEM khi render danh sách component, trang, hoặc dữ liệu từ Sling Model. Bài viết này tổng hợp các kỹ thuật từ cơ bản đến nâng cao, học hỏi từ những bài blog Angular chất lượng của cộng đồng Trung Quốc (như "Angular修仙之路", "汪志成", "雪狼", "Trotyl"...), tập trung vào hiệu suất và khả năng bảo trì.

> **Kiến thức liên quan:** [Templates (AEM)](/docs/basic/angular-templates-for-aem) · [Directives](/docs/basic/angular-directives) · [Data Binding](/docs/basic/angular-data-binding-for-aem) · [Events](/docs/basic/angular-events)

---

## 1) CƠ BẢN VỀ HIỂN THỊ DANH SÁCH

### 1.1) `@for` — Control Flow mới (Angular 17+)

Trong Angular hiện đại, dùng `@for` để lặp qua một mảng dữ liệu. Đây là cú pháp control flow mới, thay thế `*ngFor`.

```html
@for (item of items(); track item.id; let idx = $index, let isFirst = $first, let isLast = $last) {
  <div class="card" [class.first]="isFirst" [class.last]="isLast">
    <span class="index">{{ idx + 1 }}</span>
    <h3>{{ item.title }}</h3>
  </div>
} @empty {
  <p class="empty-state">Không có dữ liệu</p>
}
```

Các biến cục bộ có sẵn trong `@for`:

| Biến          | Ý nghĩa                                      |
|---------------|----------------------------------------------|
| `$index`      | Chỉ số của phần tử (bắt đầu từ 0)            |
| `$first`      | `true` nếu là phần tử đầu tiên               |
| `$last`       | `true` nếu là phần tử cuối cùng              |
| `$even`       | `true` nếu chỉ số chẵn                       |
| `$odd`        | `true` nếu chỉ số lẻ                         |
| `$count`      | Tổng số phần tử trong danh sách              |

### 1.2) `track` — Bắt buộc phải có

Mỗi `@for` đều yêu cầu một biểu thức `track` để Angular xác định từng phần tử. Đây là **nguyên tắc bắt buộc**, không chỉ là best practice.

```html
<!-- Track bằng ID duy nhất từ dữ liệu -->
@for (user of users(); track user.id) { ... }

<!-- Track bằng chính phần tử (chỉ khi phần tử bất biến) -->
@for (num of numbers(); track $index) { ... }
```

**Tại sao track quan trọng?**

- Angular dựa vào giá trị track để quyết định DOM node nào cần cập nhật, thêm mới, hay xóa.
- Nếu không có track hợp lý, danh sách sẽ bị render lại toàn bộ, gây flicker, mất focus, giảm hiệu suất.
- Trong ngữ cảnh AEM, dữ liệu thường có `path` hoặc `jcr:uuid` ổn định — đó là track lý tưởng.

### 1.3) `*ngFor` — Cú pháp cũ (đọc hiểu code legacy)

Bạn vẫn sẽ gặp trong các dự án chưa migrate:

```html
<div *ngFor="let item of items; trackBy: trackById; let i = index">
  {{ item.title }}
</div>
```

```typescript
trackById = (_: number, item: { id: string }) => item.id;
```

**Không sử dụng** trong code mới. Migrate lên `@for` càng sớm càng tốt.

---

## 2) TỐI ƯU HIỆU SUẤT RENDER DANH SÁCH

Đây là chủ đề được các blogger Trung Quốc đặc biệt quan tâm, thường trích dẫn từ các bài nói của **Miško Hevery** (cha đẻ Angular) và **Kara Erickson**.

### 2.1) `ChangeDetectionStrategy.OnPush`

Luôn sử dụng `OnPush` cho component hiển thị danh sách.

```typescript
@Component({
  selector: 'app-user-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`,
})
export class UserListComponent {
  users = input.required<User[]>();
}
```

Với `OnPush`, Angular chỉ kiểm tra component khi:
- Một `@Input` reference thay đổi (đối với non-signal input).
- Một signal được đọc trong template thay đổi.
- Một event bắt nguồn từ component đó (click, etc.).

### 2.2) Sử dụng `signal` cho dữ liệu danh sách

```typescript
// ❌ Cách cũ: mutate mảng dễ gây lỗi, phải gán lại reference
this.items.push(newItem); // Không trigger change detection với OnPush
this.items = [...this.items, newItem]; // Cách ép buộc

// ✅ Cách mới: dùng signal
items = signal<Item[]>([]);
addItem(item: Item) {
  this.items.update(arr => [...arr, item]); // Bất biến, trigger reactivity
}
```

Signal tự động thông báo cho template khi giá trị thay đổi, loại bỏ nỗi lo "immutable reference" thủ công.

### 2.3) Tránh gọi hàm trong template

Một lỗi phổ biến mà các blog Trung Quốc thường nhấn mạnh:

```html
<!-- ❌ Mỗi chu kỳ CD, hàm getDisplayName() được gọi lại cho TẤT CẢ phần tử -->
@for (user of users(); track user.id) {
  <span>{{ getDisplayName(user) }}</span>
}

<!-- ✅ Dùng pipe hoặc computed trước -->
@for (user of displayUsers(); track user.id) {
  <span>{{ user.displayName }}</span>
}
```

```typescript
displayUsers = computed(() =>
  this.users().map(u => ({
    ...u,
    displayName: `${u.firstName} ${u.lastName}`,
  }))
);
```

---

## 3) LỌC VÀ SẮP XẾP DANH SÁCH

### 3.1) Lọc bằng `computed()`

```typescript
searchTerm = signal('');
allItems = signal<Item[]>([]);

filteredItems = computed(() => {
  const term = this.searchTerm().toLowerCase();
  return this.allItems().filter(item =>
    item.title.toLowerCase().includes(term)
  );
});
```

Template:

```html
<input [(ngModel)]="searchTerm" placeholder="Tìm kiếm..." />
@for (item of filteredItems(); track item.id) { ... }
```

> **Lưu ý:** `[(ngModel)]` cần import `FormsModule`.

### 3.2) Sắp xếp bằng `computed()`

```typescript
sortKey = signal<'title' | 'date' | 'author'>('date');
sortAsc = signal(true);

sortedAndFiltered = computed(() => {
  const list = this.filteredItems();
  const key = this.sortKey();
  const asc = this.sortAsc();

  return [...list].sort((a, b) => {
    const valA = a[key];
    const valB = b[key];
    const cmp = valA > valB ? 1 : valA < valB ? -1 : 0;
    return asc ? cmp : -cmp;
  });
});
```

Template:

```html
<button (click)="sortKey.set('title'); sortAsc.update(v => !v)">
  Tiêu đề {{ sortKey() === 'title' ? (sortAsc() ? '↑' : '↓') : '' }}
</button>
```

### 3.3) Pipe `filter` và `orderBy` — KHÔNG dùng

Angular **đã loại bỏ** `filter` và `orderBy` pipe từ rất sớm vì lý do hiệu suất. Các blog Trung Quốc cũng đồng thuận: **không tự viết pipe lọc/sắp xếp**, vì nó chạy mỗi chu kỳ CD, gây chậm. Luôn dùng `computed()` + signal.

---

## 4) PHÂN TRANG (PAGINATION)

### 4.1) Phân trang phía client

```typescript
currentPage = signal(1);
pageSize = signal(10);

totalPages = computed(() => Math.ceil(this.filteredItems().length / this.pageSize()));

pagedItems = computed(() => {
  const start = (this.currentPage() - 1) * this.pageSize();
  return this.filteredItems().slice(start, start + this.pageSize());
});

goToPage(page: number) {
  if (page >= 1 && page <= this.totalPages()) {
    this.currentPage.set(page);
  }
}
```

Template:

```html
@for (item of pagedItems(); track item.id) { ... }

<nav class="pagination">
  <button [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">← Trước</button>
  @for (p of [].constructor(totalPages()); track $index) {
    <button
      [class.active]="currentPage() === $index + 1"
      (click)="goToPage($index + 1)"
    >{{ $index + 1 }}</button>
  }
  <button [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">Sau →</button>
</nav>
```

### 4.2) Phân trang phía server (AEM thường dùng)

Trong AEM, dữ liệu danh sách thường lấy từ API phân trang sẵn. Khi đó, component chỉ cần emit sự kiện chuyển trang lên parent/service:

```typescript
// paginator.component.ts
currentPage = model(1);
totalPages = input.required<number>();
pageChange = output<number>();

goTo(page: number) {
  this.currentPage.set(page);
  this.pageChange.emit(page);
}
```

```html
<aem-paginator [(currentPage)]="page" [totalPages]="total()" (pageChange)="fetchPage($event)" />
```

---

## 5) VÔ HẠN CUỘN (INFINITE SCROLL / LOAD MORE)

### 5.1) Tự xây dựng với Intersection Observer

```typescript
// infinite-scroll.directive.ts
import { Directive, output, ElementRef, inject, effect } from '@angular/core';

@Directive({
  selector: '[appInfiniteScroll]',
  host: {
    '(window:scroll)': 'onWindowScroll()',
  },
})
export class InfiniteScrollDirective {
  private el = inject(ElementRef);
  readonly loadMore = output<void>();
  private isNearBottom = signal(false);

  // Bỏ qua host listener, dùng scroll trên chính element hoặc window
  onWindowScroll() {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    if (rect.bottom - 200 <= windowHeight) {
      this.loadMore.emit();
    }
  }
}
```

Sử dụng:

```html
<div appInfiniteScroll (loadMore)="loadNextPage()">
  @for (item of items(); track item.id) {
    <div class="card">{{ item.title }}</div>
  }
  @if (loading()) {
    <p>Đang tải thêm...</p>
  }
</div>
```

### 5.2) Dùng Angular CDK Virtual Scroll (danh sách cực lớn)

Khi danh sách có **hàng ngàn phần tử**, render toàn bộ DOM sẽ gây lag. CDK Virtual Scroll chỉ render các phần tử trong viewport.

```bash
ng add @angular/cdk
```

```typescript
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  standalone: true,
  imports: [ScrollingModule],
  template: `
    <cdk-virtual-scroll-viewport itemSize="60" class="viewport" style="height: 400px;">
      <div *cdkVirtualFor="let item of items(); trackBy: trackById" class="item">
        {{ item.title }}
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VirtualListComponent {
  items = signal<Item[]>(generateLargeDataset(10000));

  trackById = (index: number, item: Item) => item.id;
}
```

> **Lưu ý:** `cdkVirtualFor` là structural directive, vẫn dùng cú pháp `*`. Hiện tại chưa có phiên bản `@for` cho virtual scroll (Angular team đang phát triển).

---

## 6) COMPONENT HÓA DANH SÁCH — PATTERN TÁI SỬ DỤNG

Các blogger Trung Quốc như "雪狼" thường nhấn mạnh việc tách danh sách thành các component độc lập, có thể tái sử dụng.

### 6.1) Container / Presentational Pattern

```typescript
// user-list-container.component.ts (Container)
@Component({
  selector: 'app-user-list-container',
  standalone: true,
  imports: [UserListComponent],
  template: `
    <app-user-list
      [users]="users()"
      [loading]="loading()"
      (selectUser)="onSelect($event)"
      (loadMore)="fetchNextPage()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListContainerComponent {
  private userService = inject(UserService);
  users = signal<User[]>([]);
  loading = signal(false);

  constructor() {
    this.fetchUsers();
  }

  private fetchUsers() {
    this.loading.set(true);
    this.userService.getUsers().subscribe(data => {
      this.users.set(data);
      this.loading.set(false);
    });
  }

  onSelect(user: User) {
    // Điều hướng hoặc mở modal
  }
}
```

```typescript
// user-list.component.ts (Presentational)
@Component({
  selector: 'app-user-list',
  standalone: true,
  template: `
    @if (loading()) {
      <p class="skeleton">Loading skeleton...</p>
    } @else {
      @for (user of users(); track user.id) {
        <div class="user-row" (click)="selectUser.emit(user)" (keydown.enter)="selectUser.emit(user)" tabindex="0" role="button">
          {{ user.name }}
        </div>
      } @empty {
        <p>Không có người dùng nào</p>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent {
  users = input.required<User[]>();
  loading = input(false);
  selectUser = output<User>();
}
```

### 6.2) List Component đa năng với `ngTemplateOutlet`

Một pattern nâng cao từ blog "Trotyl": component danh sách tổng quát nhận template cho mỗi item.

```typescript
// reusable-list.component.ts
@Component({
  selector: 'app-reusable-list',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    @for (item of items(); track trackBy(item); let idx = $index, let isOdd = $odd) {
      <div class="list-item" [class.odd]="isOdd">
        <ng-container
          *ngTemplateOutlet="itemTemplate() || defaultTpl; context: { $implicit: item, index: idx }"
        />
      </div>
    }
    <ng-template #defaultTpl let-item>
      <span>{{ item }}</span>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReusableListComponent<T> {
  items = input.required<T[]>();
  itemTemplate = input<TemplateRef<{ $implicit: T; index: number }> | null>(null);
  trackBy = input<(item: T) => unknown>(item => (item as any).id ?? item);
}
```

Sử dụng:

```html
<app-reusable-list
  [items]="users()"
  [trackBy]="userIdTrack"
  [itemTemplate]="userRowTpl"
/>

<ng-template #userRowTpl let-user let-i="index">
  <strong>{{ i + 1 }}.</strong>
  <span>{{ user.name }}</span> —
  <em>{{ user.email }}</em>
</ng-template>
```

---

## 7) DANH SÁCH VỚI AEM — MAPPING COMPONENT THEO LOẠI

Trong AEM SPA Editor, một container có thể chứa nhiều loại component khác nhau (hero, teaser, text, image...). Cần render danh sách component động theo `resourceType`.

```typescript
// aem-container.component.ts
import { MapTo } from '@adobe/aem-spa-page-model-manager';

@Component({
  selector: 'app-aem-container',
  standalone: true,
  imports: [NgComponentOutlet],
  template: `
    @for (item of items(); track item.path) {
      <ng-container
        *ngComponentOutlet="getComponent(item.resourceType); inputs: { model: item }"
      />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AemContainerComponent {
  items = input<AemComponentModel[]>([]);

  // Registry ánh xạ resourceType → Component class
  private componentRegistry: Record<string, Type<any>> = {
    'myapp/components/hero': HeroComponent,
    'myapp/components/teaser': TeaserComponent,
    'myapp/components/text': TextComponent,
  };

  getComponent(resourceType: string): Type<any> | null {
    return this.componentRegistry[resourceType] ?? null;
  }
}
```

> **Lưu ý AEM:** Khi component không được ánh xạ, hiển thị placeholder trong chế độ Edit để author biết.

---

## 8) TỐI ƯU NÂNG CAO — CHANGE DETECTION TRONG DANH SÁCH

### 8.1) Sử dụng `track` hợp lý giảm số lần DOM update

```html
<!-- ❌ Track bằng index → mỗi khi mảng thay đổi, toàn bộ DOM bị rebuild -->
@for (item of items(); track $index) { ... }

<!-- ✅ Track bằng ID ổn định → chỉ những item thực sự thay đổi mới bị cập nhật -->
@for (item of items(); track item.path) { ... }
```

### 8.2) Dùng `computed()` để lọc/sắp xếp — không filter trong template

```html
<!-- ❌ Gọi method lọc ~ mỗi CD cycle lọc lại toàn bộ -->
@for (item of filterActive(items()); track item.id) { ... }

<!-- ✅ Dùng computed signal — chỉ tính lại khi items() thay đổi -->
@for (item of activeItems(); track item.id) { ... }
```

### 8.3) Tránh truyền mảng mới mỗi lần render

```typescript
// ❌ Mỗi lần parent render, items() trả về mảng mới → OnPush trigger không cần thiết
template: `<app-list [items]="users()" />`

// ✅ Dùng signal trong parent, chỉ update khi thực sự thay đổi
users = signal<User[]>([]);
// Khi fetch xong:
this.users.set(newUsers); // Chỉ trigger một lần
```

---

## 9) CÁC THƯ VIỆN HỖ TRỢ DANH SÁCH (THAM KHẢO)

Các blog Trung Quốc thường giới thiệu những thư viện này khi cần tính năng nâng cao:

| Thư viện                 | Tính năng                                   | Khuyến nghị                          |
|--------------------------|---------------------------------------------|--------------------------------------|
| `@angular/cdk`           | Virtual scroll, drag-drop, overlay          | Dùng chính thống từ Angular team     |
| `ngx-pagination`         | Phân trang UI                               | Có thể thay bằng tự code             |
| `ngx-infinite-scroll`    | Cuộn vô hạn                                 | Có thể thay bằng IntersectionObserver|
| `@tanstack/angular-query`| Fetch, cache, pagination, infinite query    | Mạnh mẽ, đáng dùng với API           |
| `ag-grid-angular`        | Bảng dữ liệu nâng cao (sort, filter, group) | Khi cần bảng phức tạp                |

> **Nguyên tắc:** Ưu tiên giải pháp có sẵn trong Angular/Cdk trước khi tìm đến thư viện bên ngoài.

---

## 10) BEST PRACTICES TỔNG KẾT

1. **Luôn dùng `@for` với `track`** — không dùng `*ngFor` trong code mới.
2. **Luôn dùng `OnPush`** cho component danh sách.
3. **Dùng `signal()` và `computed()`** cho dữ liệu và biến đổi danh sách.
4. **Không gọi hàm trong template** — tính toán trước bằng `computed()`.
5. **Không viết pipe lọc/sắp xếp** — dùng `computed()`.
6. **Phân trang / infinite scroll** — xử lý ở service hoặc container, component hiển thị chỉ nhận dữ liệu đã sẵn sàng.
7. **Virtual scroll** khi danh sách > 500 phần tử.
8. **Tách container (logic) và presentational (hiển thị)** để dễ test và tái sử dụng.
9. **Đảm bảo accessibility** — mỗi item tương tác phải có `tabindex`, `role`, và keyboard handler.
10. **Trong AEM**, ánh xạ động component theo `resourceType`, xử lý trường hợp không tìm thấy mapping.

---

## 11) KIỂM TRA KIẾN THỨC

1. Tại sao `track` là bắt buộc trong `@for`? Hậu quả khi dùng `track $index` với danh sách có thể thay đổi thứ tự?
2. So sánh hiệu suất giữa `computed()` và pipe khi lọc danh sách 1000 phần tử.
3. Khi nào nên dùng Virtual Scroll thay vì phân trang?
4. Tại sao nên tách container và presentational component cho danh sách?
5. Làm thế nào để render danh sách component động từ AEM model?
6. `*cdkVirtualFor` khác gì `@for` — tại sao chưa dùng `@for` được cho virtual scroll?
7. Làm thế nào để tránh re-render toàn bộ danh sách khi thêm một item mới vào đầu mảng?

---

## 12) CHEAT SHEET

```text
Lặp danh sách          → @for (item of items; track item.id) { ... }
Biến cục bộ            → let idx = $index, let first = $first
Danh sách trống         → @empty { <p>Trống</p> }
Track ID               → track item.id (KHÔNG dùng $index)
Lọc/sắp xếp            → Dùng computed(), không dùng pipe
Phân trang client      → computed() slice + signal currentPage
Phân trang server      → input() totalPages + output() pageChange
Virtual scroll         → @angular/cdk/scrolling + *cdkVirtualFor
Container pattern      → Container (logic) → Presentational (hiển thị)
AEM dynamic list       → NgComponentOutlet + resourceType registry
```

---

Tài liệu kết thúc.
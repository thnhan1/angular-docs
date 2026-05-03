# Angular Forms

## Hai cách tiếp cận

| | Template-driven | Reactive |
|---|---|---|
| **Import** | `FormsModule` | `ReactiveFormsModule` |
| **Logic** | Trong template (`ngModel`) | Trong component class (`FormControl`, `FormGroup`) |
| **Validation** | Directives (`required`, `minlength`) | Validators trong code |
| **Phù hợp** | Form đơn giản, ít logic | Form phức tạp, dynamic, testable |

**Khuyến nghị**: dùng **Reactive Forms** cho hầu hết trường hợp; dễ test, type-safe, tách biệt logic.

---

## Reactive Forms — cơ bản

### Setup

```typescript
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <input formControlName="email" placeholder="Email" />
      <input formControlName="password" type="password" />
      <button type="submit" [disabled]="loginForm.invalid">Đăng nhập</button>
    </form>
  `
})
export class LoginComponent {
  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  onSubmit() {
    if (this.loginForm.valid) {
      console.log(this.loginForm.value);
    }
  }
}
```

**Tương đương AEM**: giống Sling Model có validation annotation; nhưng ở đây validation chạy client-side realtime.

---

## FormControl — quản lý một field

```typescript
email = new FormControl('', [Validators.required, Validators.email]);

// Đọc giá trị
console.log(this.email.value);

// Set giá trị
this.email.setValue('user@example.com');

// Trạng thái
this.email.valid      // true/false
this.email.invalid
this.email.touched    // user đã focus rồi blur
this.email.dirty      // user đã sửa giá trị
this.email.errors     // { required: true } hoặc null
```

---

## FormGroup — nhóm nhiều controls

```typescript
profileForm = new FormGroup({
  firstName: new FormControl(''),
  lastName: new FormControl(''),
  address: new FormGroup({
    street: new FormControl(''),
    city: new FormControl('')
  })
});

// Đọc toàn bộ
console.log(this.profileForm.value);
// { firstName: '...', lastName: '...', address: { street: '...', city: '...' } }

// Set một phần (patchValue) hoặc toàn bộ (setValue)
this.profileForm.patchValue({ firstName: 'Nam' });
```

Template:

```html
<form [formGroup]="profileForm">
  <input formControlName="firstName" />
  <input formControlName="lastName" />
  
  <div formGroupName="address">
    <input formControlName="street" />
    <input formControlName="city" />
  </div>
</form>
```

---

## Validators — validation rules

### Built-in validators

```typescript
import { Validators } from '@angular/forms';

new FormControl('', [
  Validators.required,
  Validators.minLength(3),
  Validators.maxLength(20),
  Validators.email,
  Validators.pattern(/^[a-zA-Z]+$/)
]);
```

### Custom validator

```typescript
function forbiddenNameValidator(forbiddenName: string) {
  return (control: FormControl) => {
    const forbidden = control.value === forbiddenName;
    return forbidden ? { forbiddenName: { value: control.value } } : null;
  };
}

username = new FormControl('', [forbiddenNameValidator('admin')]);
```

---

## Hiển thị lỗi validation

```typescript
template: `
  <form [formGroup]="form">
    <input formControlName="email" />
    
    @if (form.controls.email.invalid && form.controls.email.touched) {
      <div class="error">
        @if (form.controls.email.errors?.['required']) {
          <span>Email bắt buộc</span>
        }
        @if (form.controls.email.errors?.['email']) {
          <span>Email không hợp lệ</span>
        }
      </div>
    }
  </form>
`
```

**Lưu ý**: `errors` trả về object hoặc `null`; dùng `?.['key']` để tránh lỗi.

---

## FormArray — danh sách động

```typescript
import { FormArray } from '@angular/forms';

@Component({
  template: `
    <form [formGroup]="form">
      <div formArrayName="phones">
        @for (phone of phones.controls; track $index) {
          <input [formControlName]="$index" />
        }
      </div>
      <button type="button" (click)="addPhone()">Thêm SĐT</button>
    </form>
  `
})
export class ContactComponent {
  form = new FormGroup({
    phones: new FormArray([
      new FormControl('')
    ])
  });

  get phones() {
    return this.form.controls.phones;
  }

  addPhone() {
    this.phones.push(new FormControl(''));
  }
}
```

---

## Template-driven Forms (ngModel)

```typescript
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <form #f="ngForm" (ngSubmit)="onSubmit(f)">
      <input name="email" [(ngModel)]="email" required email />
      <input name="password" [(ngModel)]="password" required minlength="6" />
      <button [disabled]="f.invalid">Đăng nhập</button>
    </form>
  `
})
export class SimpleLoginComponent {
  email = '';
  password = '';

  onSubmit(form: any) {
    console.log(form.value);
  }
}
```

**Hạn chế**: validation logic nằm trong template; khó test, khó tái sử dụng.

---

## Kết hợp với Signal (Angular 17+)

```typescript
import { signal } from '@angular/core';

@Component({
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input formControlName="username" />
      <p>Preview: {{ username() }}</p>
    </form>
  `
})
export class FormWithSignalComponent {
  form = new FormGroup({
    username: new FormControl('')
  });

  username = signal('');

  ngOnInit() {
    this.form.controls.username.valueChanges.subscribe(value => {
      this.username.set(value || '');
    });
  }

  onSubmit() {
    console.log(this.username());
  }
}
```

**Lưu ý**: `valueChanges` là Observable; subscribe để sync sang Signal nếu cần reactive UI.

---

## Gotchas

- **`formControlName` vs `[formControl]`**: 
  - `formControlName="email"` — dùng khi có `formGroup` cha
  - `[formControl]="emailControl"` — bind trực tiếp một `FormControl` instance
  
- **`setValue` vs `patchValue`**:
  - `setValue` — phải cung cấp **tất cả** fields, nếu thiếu sẽ lỗi
  - `patchValue` — chỉ cần một phần fields

- **Async validators**: validator trả về `Observable<ValidationErrors | null>`; dùng cho check trùng username qua API.

```typescript
function uniqueUsernameValidator(userService: UserService) {
  return (control: FormControl) => {
    return userService.checkUsername(control.value).pipe(
      map(exists => exists ? { usernameTaken: true } : null)
    );
  };
}
```

- **Không dùng `[(ngModel)]` trong Reactive Forms** — conflict giữa hai cách quản lý state; chọn một trong hai.

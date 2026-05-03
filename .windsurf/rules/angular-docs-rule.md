---
description: Ghi chép học Angular (v17+) cho AEM developer — súc tích, không dẫn dắt thừa
globs: content/**/*.md
alwaysApply: true
trigger: always_on
---

# Angular cho AEM — ghi chép cá nhân

## Phạm vi

- **Angular 17+** là mặc định: standalone, `import` trong `@Component`, control flow `@if` / `@for` / `@switch`, Signals khi liên quan; không dạy kiểu NgModule-first cũ trừ khi cần so sánh một dòng.
- **Độc giả**: dev AEM — có thể map sang mental model HTL/Sling (component = resource/model, binding, list/repeat, điều kiện hiển thị) khi giúp hiểu nhanh; không viết lại kiến thức AEM cơ bản trừ khi cần một câu nối.

## Giọng điệu & cấu trúc (take note)

- **Không** viết mở bài dài, lời chào, “trong bài này ta sẽ…”, tóm tắt chương, CTA, hay đoạn marketing.
- **Vào thẳng**: tiêu đề → khái niệm tối thiểu → ví dụ code → lưu ý thực dụng / gotcha.
- Ưu tiên **bullet ngắn**, bảng so sánh, block code; tránh đoạn văn giải thích lặp ý.
- Tiếng Việt cho phần giải thích; **API/symbol** giữ đúng tên tiếng Anh của Angular.

## Nội dung nên có

- Cú pháp & hành vi đúng theo phiên bản đang nói; ghi rõ khi API đổi từ bản cũ.
- Liên hệ AEM chỉ khi **rút ngắn thời gian hiểu** (một dòng hoặc một bullet).

## Tránh

- Tutorial từng bước “cài đặt từ đầu” trừ khi file đó chuyên về setup.
- Lặp lại docs chính thức word-by-word; thay bằng chỗ cần nhớ + ví dụ tối giản.

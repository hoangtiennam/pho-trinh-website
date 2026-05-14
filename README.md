# Pho Bo Moc website

Website ban Pho Bo chay duoc tren web va mobile theo huong PWA.

## Chuc nang

- Trang chu responsive cho desktop va dien thoai.
- Menu chuyen Pho Bo co hinh anh, gia, mo ta.
- Chon size va topping.
- Gio hang, tang giam so luong, tinh tong tien.
- Form thong tin giao hang.
- Luu don hang mau vao `localStorage`.
- Nut goi dien va nhan Zalo.
- Manifest va service worker de co the cai nhu mobile app/PWA.

## Cach chay

Mo truc tiep file:

```text
C:\Users\hoang\Documents\Codex\2026-05-08\t-i-mu-n-t-o\index.html
```

Hoac chay server local bang PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\server.ps1 -Port 5173
```

Sau do mo:

```text
http://localhost:5173/
```

## Dua len hosting

Upload cac file `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `sw.js` va thu muc `assets` len Netlify, Vercel, GitHub Pages hoac hosting tinh bat ky.

# Nayab SMS — XAMPP Database Folder

Saari school database yahan **SQL file** ki shakal mein rakhi jati hai taake XAMPP / phpMyAdmin se import ho sake.

## 1) XAMPP install karein

1. Download: https://www.apachefriends.org/download.html  
2. Install (default: `C:\xampp`)  
3. **XAMPP Control Panel** → **MySQL** → **Start**

Optional: project root se `INSTALL-XAMPP.bat` chalayein (Windows winget se install try karta hai).

## 2) Database import (phpMyAdmin)

1. Browser: http://localhost/phpmyadmin  
2. Tab **Import**  
3. File choose: `xamp-database/nayab_sms.sql`  
4. **Go** — database `nayab_sms` ban jayegi

## 3) Backend settings

File: `backend/.env`

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=nayab_sms
```

(XAMPP default: root, no password, port **3306**)

## 4) SQL file update karna (export)

Jab bhi latest data export karna ho:

```bat
cd backend
npm run export-xampp-db
```

Yeh `nayab_sms.sql` ko dubara likhega.

## 5) Website start

Double-click: **`RUN-WEBSITE.bat`** (XAMPP MySQL pehle **Start** honi chahiye)

- Website: http://127.0.0.1:5173  
- Admin: http://127.0.0.1:5173/login  

**Admin:** admin@nayabgrammar.edu.pk / Admin@123  
**Teacher:** teacher@nayabgrammar.edu.pk / Teacher@123  

## Folder contents

| File | Purpose |
|------|---------|
| `nayab_sms.sql` | Full database dump (import into XAMPP) |
| `README.md` | This guide |

> Purani portable MySQL (port 3307) ab optional hai — XAMPP use karein to sab `xamp-database` folder se manage ho jata hai.

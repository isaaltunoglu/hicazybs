# Kurumsal YBS — Çoklu Şirket & Alt Takım Yönetim Bilişim Sistemi (Open Source)

**Kurumsal YBS**, birden fazla bağımsız şirketin (**A, B, C şirketleri — Multi-Tenant**) kendi kurumsal kimliğiyle kullanabileceği; her şirketin ister **tek çatı altında**, ister **birden fazla alt takım ve çalışma alanı (Sub-Team / Workspace)** açarak yönetebileceği açık kaynaklı bir **Yönetim Bilişim Sistemidir (MIS / YBS)**.

React + TypeScript + Chakra UI üzerinde geliştirilmiş olup, gerçek zamanlı kimlik doğrulama ve veri izolasyonu için **Firebase Authentication** ve **Cloud Firestore** kullanır.

---

## Temel Özellikler

- **Çoklu Şirket (Multi-Tenant) Mimarisi**:
  - Sistem üzerinde birbirinden izole birden fazla şirket (`A Şirketi`, `B Şirketi`, `C Şirketi`) oluşturulabilir.
  - Her şirketin görevleri, envanteri, kategorileri, duyuruları, bağlantıları, departmanları, rolleri ve mesai kayıtları kendi şirket alanında tutulur.
- **Şirket Altında Çoklu Alt Takım / Çalışma Alanı (Sub-Teams & Workspaces)**:
  - Bir şirket ister tek bir merkez olarak çalışabilir, isterse kendi altında birden fazla alt takım/çalışma alanı (*Ar-Ge Takımı*, *Merkez Ofis*, *Üretim Hattı* vb.) açabilir.
  - Sol menüdeki **Aktif Çalışma Alanı / Alt Takım** seçicisi ile `Tüm Şirket (Genel)` görünümü ve alt takımlar arasında anında geçiş yapılabilir.
- **Linksiz Girişte İki Seçenekli Karşılama (`/auth/onboarding`)**:
  - Sisteme davet bağlantısı olmadan doğrudan giriş yapan veya kayıt olan kullanıcıların karşısına **2 seçenek** çıkar:
    1. **Şirkete Katıl (Key ile)**: Şirket yöneticisinin ürettiği kişiye özel `INV-XXXX-XXXX` anahtarını girerek mevcut bir şirkete katılma.
    2. **Yeni Şirket Aç**: Kendi şirketini ve ilk çalışma alanını oluşturarak doğrudan o şirketin `Süper Yönetici`si olma.
- **Kişiye Özel Davet Anahtarı (Key) ve Özel Kayıt Bağlantısı (`/auth/invite?key=...`)**:
  - Yöneticiler **Çalışan & Davetler** ekranından çalışan e-postasını, rolünü, departmanını ve alt takımını seçerek kişiye özel **`INV-XXXX-XXXX`** davet anahtarı ve `/auth/invite?key=INV-XXXX-XXXX` bağlantısı üretir.
  - Tek tıkla davet e-postası gönderilebilir; çalışan bağlantıya tıkladığında doğrudan davet edildiği şirketin adı, alt takımı ve rolüyle hazırlanmış özel kayıt panelinden şirkete katılır.
- **Dinamik Rol ve Yetki Yönetimi**:
  - Her şirket kendi özel ünvan/rollerini ve 3 kademeli yetki seviyesini (`Süper Yönetici`, `Yönetici / Birim Yetkilisi`, `Standart Kullanıcı`) dinamik olarak tanımlayabilir.
- **Operasyonel Modüller**:
  - **Görev ve Süreç Takibi**: Çalışan ve alt takım bazlı görev atama, durum ve süreç geçmişi.
  - **Envanter ve Kategori Yönetimi**: Konum, kategori ve çalışma alanı bazlı stok/envanter takibi.
  - **Mesai / Çalışma Alanı Takibi**: QR kod ve GPS konum doğrulamalı giriş-çıkış, aktif katılımcı izleme, haftalık çalışma grafiği ve liderlik tablosu.
  - **Duyurular ve Kurumsal Bağlantılar**: Şirket veya alt takım bazlı duyuru panosu ve doküman/bağlantı havuzu.

---

## Kurulum ve Çalıştırma

### 1. Gereksinimler
- Node.js (18+ LTS önerilir)
- npm
- Firebase Projesi (Authentication + Cloud Firestore etkinleştirilmiş)

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Ortam Değişkenlerini (`.env`) Ayarlayın
`.env.example` dosyasını `.env` olarak kopyalayın ve kendi Firebase proje bilgilerinizi girin:
```bash
cp .env.example .env
```

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=1234567890
REACT_APP_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```

### 4. Geliştirme Sunucusunu Başlatın
```bash
npm start
```

### 5. Firebase'e Yükleme (Deploy)
```bash
npm run build
firebase deploy
```

---

## Proje Dizin Yapısı

- `src/services/companyService.ts`: Çoklu şirket (`companies`) ve alt takım/çalışma alanı (`subTeams`) servisleri
- `src/services/inviteService.ts`: Kişiye özel davet anahtarı (`INV-XXXX-XXXX`) ve özel davet bağlantısı (`/auth/invite?key=...`) servisleri
- `src/services/tenantScope.ts`: Şirket ve alt takım veri izolasyonu katmanı
- `src/views/auth/onboarding`: Linksiz giriş yapan kullanıcılar için **Şirkete Katıl (Key ile)** / **Şirket Aç** ekranı
- `src/views/auth/invite`: Davet bağlantısıyla gelen çalışanlar için şirkete özel kayıt paneli
- `src/views/admin`: Yönetim paneli modülleri (`dashboard`, `missions`, `inventory`, `categories`, `announcements`, `workshop`, `links`, `userApprovals`, `departments`, `settings`, `profile`)
- `firestore.rules`: Çoklu şirket, alt takım ve davet anahtarı doğrulamalı Firestore güvenlik kuralları

---

## Lisans

Bu proje açık kaynaklıdır ve [MIT Lisansı](LICENSE) altında sunulmaktadır.
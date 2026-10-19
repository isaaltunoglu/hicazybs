import { Timestamp } from 'firebase/firestore';
import { Company, SubTeam } from './companyService';
import { Invitation } from './inviteService';
import { UserProfile } from './userService';
import { Department } from './departmentService';
import { Category, InventoryItem } from '../types/inventory';
import { Mission } from '../types/mission';
import { Announcement } from './announcementService';
import { TeamLink } from './linkService';
import { WorkshopSession } from './workshopService';

export const DEMO_STORAGE_KEY = 'ybs_demo_mode';

export const isDemoModeActive = (): boolean => {
  try {
    return localStorage.getItem(DEMO_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setDemoModeActive = (active: boolean) => {
  try {
    if (active) {
      localStorage.setItem(DEMO_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(DEMO_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
};

export const DEMO_COMPANY: Company = {
  id: 'demo-company-nova',
  name: 'Nova Teknoloji A.Ş.',
  subtitle: 'Çoklu Takım & Kurumsal Yönetim Bilişim Sistemi',
  logoUrl: '',
  workspaceLabel: 'Çalışma Alanı',
  supportEmail: 'ik@novateknoloji.com',
  footerText: 'Nova Teknoloji A.Ş. — Kurumsal YBS',
  ownerUid: 'demo-user-1',
};

export const DEMO_SUB_TEAMS: SubTeam[] = [
  {
    id: 'subteam-arge',
    companyId: 'demo-company-nova',
    name: 'Ar-Ge & Yazılım Takımı',
    description: 'Yazılım geliştirme, yapay zeka ve ürün mühendisliği çalışma alanı',
    qrSecret: 'AREA_NOVA_ARGE_2026',
    lat: 41.0082,
    lng: 28.9784,
    radius: 200,
    maxSessionHours: 8,
  },
  {
    id: 'subteam-merkez',
    companyId: 'demo-company-nova',
    name: 'Merkez Ofis & Operasyon',
    description: 'İnsan kaynakları, finans, satın alma ve kurumsal iletişim birimi',
    qrSecret: 'AREA_NOVA_MERKEZ_2026',
    lat: 41.0122,
    lng: 28.9760,
    radius: 250,
    maxSessionHours: 9,
  },
  {
    id: 'subteam-uretim',
    companyId: 'demo-company-nova',
    name: 'Üretim & Donanım Saha Ekibi',
    description: 'Prototip üretim, test istasyonları ve donanım montaj alanı',
    qrSecret: 'AREA_NOVA_URETIM_2026',
    lat: 40.9910,
    lng: 29.0230,
    radius: 300,
    maxSessionHours: 8,
  },
];

export const DEMO_USERS: (UserProfile & { isSuperAdmin?: boolean; isManager?: boolean; companyName?: string })[] = [
  {
    uid: 'demo-user-1',
    name: 'Ahmet',
    surname: 'Yılmaz',
    email: 'ahmet.yilmaz@novateknoloji.com',
    department: 'Yönetim & Strateji',
    role: 'Süper Yönetici',
    isSuperAdmin: true,
    isManager: true,
    companyId: 'demo-company-nova',
    companyName: 'Nova Teknoloji A.Ş.',
    subTeamId: '',
    subTeamName: 'Tüm Şirket (Genel)',
  },
  {
    uid: 'demo-user-2',
    name: 'Elif',
    surname: 'Kaya',
    email: 'elif.kaya@novateknoloji.com',
    department: 'Ar-Ge ve Mühendislik',
    role: 'Birim Sorumlusu',
    isSuperAdmin: false,
    isManager: true,
    companyId: 'demo-company-nova',
    companyName: 'Nova Teknoloji A.Ş.',
    subTeamId: 'subteam-arge',
    subTeamName: 'Ar-Ge & Yazılım Takımı',
  },
  {
    uid: 'demo-user-3',
    name: 'Mert',
    surname: 'Demir',
    email: 'mert.demir@novateknoloji.com',
    department: 'Operasyon ve Üretim',
    role: 'Yönetici',
    isSuperAdmin: false,
    isManager: true,
    companyId: 'demo-company-nova',
    companyName: 'Nova Teknoloji A.Ş.',
    subTeamId: 'subteam-merkez',
    subTeamName: 'Merkez Ofis & Operasyon',
  },
  {
    uid: 'demo-user-4',
    name: 'Zeynep',
    surname: 'Arslan',
    email: 'zeynep.arslan@novateknoloji.com',
    department: 'Ar-Ge ve Mühendislik',
    role: 'Uzman / Mühendis',
    isSuperAdmin: false,
    isManager: false,
    companyId: 'demo-company-nova',
    companyName: 'Nova Teknoloji A.Ş.',
    subTeamId: 'subteam-arge',
    subTeamName: 'Ar-Ge & Yazılım Takımı',
  },
  {
    uid: 'demo-user-5',
    name: 'Burak',
    surname: 'Şahin',
    email: 'burak.sahin@novateknoloji.com',
    department: 'Operasyon ve Üretim',
    role: 'Birim Sorumlusu',
    isSuperAdmin: false,
    isManager: true,
    companyId: 'demo-company-nova',
    companyName: 'Nova Teknoloji A.Ş.',
    subTeamId: 'subteam-uretim',
    subTeamName: 'Üretim & Donanım Saha Ekibi',
  },
];

export const DEMO_INVITATIONS: Invitation[] = [
  {
    key: 'INV-NOVA-2026',
    companyId: 'demo-company-nova',
    companyName: 'Nova Teknoloji A.Ş.',
    subTeamId: 'subteam-arge',
    subTeamName: 'Ar-Ge & Yazılım Takımı',
    email: 'canan.ozkan@novateknoloji.com',
    invitedName: 'Canan',
    invitedSurname: 'Özkan',
    role: 'Uzman / Mühendis',
    department: 'Ar-Ge ve Mühendislik',
    isSuperAdmin: false,
    isManager: false,
    status: 'pending',
    createdBy: 'Ahmet Yılmaz',
    createdByUid: 'demo-user-1',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 12 * 3600 * 1000)),
  },
  {
    key: 'INV-MRKZ-8492',
    companyId: 'demo-company-nova',
    companyName: 'Nova Teknoloji A.Ş.',
    subTeamId: 'subteam-merkez',
    subTeamName: 'Merkez Ofis & Operasyon',
    email: 'kerem.aksoy@novateknoloji.com',
    invitedName: 'Kerem',
    invitedSurname: 'Aksoy',
    role: 'Birim Sorumlusu',
    department: 'Yönetim & Strateji',
    isSuperAdmin: false,
    isManager: true,
    status: 'pending',
    createdBy: 'Ahmet Yılmaz',
    createdByUid: 'demo-user-1',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 24 * 3600 * 1000)),
  },
  {
    key: 'INV-URTM-1045',
    companyId: 'demo-company-nova',
    companyName: 'Nova Teknoloji A.Ş.',
    subTeamId: 'subteam-uretim',
    subTeamName: 'Üretim & Donanım Saha Ekibi',
    email: 'zeynep.arslan@novateknoloji.com',
    invitedName: 'Zeynep',
    invitedSurname: 'Arslan',
    role: 'Uzman / Mühendis',
    department: 'Ar-Ge ve Mühendislik',
    isSuperAdmin: false,
    isManager: false,
    status: 'accepted',
    createdBy: 'Ahmet Yılmaz',
    createdByUid: 'demo-user-1',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 72 * 3600 * 1000)),
    acceptedByUid: 'demo-user-4',
  },
];

export const DEMO_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'Yönetim & Strateji' },
  { id: 'dept-2', name: 'Ar-Ge ve Mühendislik' },
  { id: 'dept-3', name: 'Operasyon ve Üretim' },
  { id: 'dept-4', name: 'İnsan Kaynakları & İdari İşler' },
];

export const DEMO_CATEGORIES: (Category & { companyId?: string; subTeamId?: string })[] = [
  { id: 'cat-1', name: 'Bilgisayar & Sunucu Donanımı', color: '#422AFB', companyId: 'demo-company-nova', subTeamId: 'subteam-arge' },
  { id: 'cat-2', name: 'Sensör & Elektronik Modüller', color: '#01B574', companyId: 'demo-company-nova', subTeamId: 'subteam-arge' },
  { id: 'cat-3', name: 'Ofis & Toplantı Ekipmanları', color: '#FFB547', companyId: 'demo-company-nova', subTeamId: 'subteam-merkez' },
  { id: 'cat-4', name: 'Test & Ölçüm Cihazları', color: '#39B8FF', companyId: 'demo-company-nova', subTeamId: 'subteam-uretim' },
];

export const DEMO_INVENTORY: (InventoryItem & { companyId?: string; subTeamId?: string })[] = [
  {
    id: 'inv-1',
    name: 'Dell Precision İş İstasyonu (AI/Simülasyon)',
    category: 'cat-1',
    amount: 12,
    location: 'Ar-Ge Lab - Kat 2',
    createdAt: new Date(Date.now() - 10 * 86400000),
    updatedAt: new Date(Date.now() - 2 * 86400000),
    companyId: 'demo-company-nova',
    subTeamId: 'subteam-arge',
  },
  {
    id: 'inv-2',
    name: 'NVIDIA Jetson Orin Developer Kit',
    category: 'cat-2',
    amount: 18,
    location: 'Gömülü Sistemler Dolabı A2',
    createdAt: new Date(Date.now() - 8 * 86400000),
    updatedAt: new Date(Date.now() - 1 * 86400000),
    companyId: 'demo-company-nova',
    subTeamId: 'subteam-arge',
  },
  {
    id: 'inv-3',
    name: '4K Konferans Kamera & Mikrofon Seti',
    category: 'cat-3',
    amount: 6,
    location: 'Merkez Ofis Toplantı Odaları',
    createdAt: new Date(Date.now() - 14 * 86400000),
    updatedAt: new Date(Date.now() - 3 * 86400000),
    companyId: 'demo-company-nova',
    subTeamId: 'subteam-merkez',
  },
  {
    id: 'inv-4',
    name: 'Rigol Dijital Osiloskop 4 Kanal',
    category: 'cat-4',
    amount: 5,
    location: 'Üretim Test İstasyonu B1',
    createdAt: new Date(Date.now() - 20 * 86400000),
    updatedAt: new Date(Date.now() - 1 * 86400000),
    companyId: 'demo-company-nova',
    subTeamId: 'subteam-uretim',
  },
  {
    id: 'inv-5',
    name: 'Endüstriyel LiDAR Mesafe Sensörü',
    category: 'cat-2',
    amount: 14,
    location: 'Ar-Ge Sensör Deposu',
    createdAt: new Date(Date.now() - 5 * 86400000),
    updatedAt: new Date(),
    companyId: 'demo-company-nova',
    subTeamId: 'subteam-arge',
  },
];

export const DEMO_MISSIONS: (Mission & { companyId?: string; subTeamId?: string })[] = [
  {
    id: 'mis-1',
    team: 'Ar-Ge ve Mühendislik',
    description: 'Çoklu Şirket (Multi-Tenant) API & alt takım veri izolasyonu performans testlerinin tamamlanması',
    importance: 'Critical',
    deadline: new Date(Date.now() + 5 * 86400000),
    assessmentPersons: ['Elif Kaya', 'Zeynep Arslan'],
    status: 'Working',
    processUpdates: [
      {
        user: 'Elif Kaya',
        message: 'Şirket ve alt takım veri indeksleri doğrulandı, yük testleri %85 tamamlandı.',
        timestamp: new Date(Date.now() - 6 * 3600000),
      },
    ],
    createdAt: new Date(Date.now() - 4 * 86400000),
    updatedAt: new Date(Date.now() - 6 * 3600000),
    companyId: 'demo-company-nova',
    subTeamId: 'subteam-arge',
  },
  {
    id: 'mis-2',
    team: 'Operasyon ve Üretim',
    description: 'Q4 Donanım Envanter Sayımı ve Üretim Atölyesi Kalibrasyon Raporu Hazırlığı',
    importance: 'High',
    deadline: new Date(Date.now() + 8 * 86400000),
    assessmentPersons: ['Burak Şahin'],
    status: 'Not Started',
    processUpdates: [],
    createdAt: new Date(Date.now() - 2 * 86400000),
    updatedAt: new Date(Date.now() - 2 * 86400000),
    companyId: 'demo-company-nova',
    subTeamId: 'subteam-uretim',
  },
  {
    id: 'mis-3',
    team: 'Yönetim & Strateji',
    description: 'Yeni katılan mühendisler için kişiye özel davet anahtarlarının (Key) oluşturulması ve oryantasyon',
    importance: 'Medium',
    deadline: new Date(Date.now() - 1 * 86400000),
    assessmentPersons: ['Mert Demir', 'Ahmet Yılmaz'],
    status: 'Completed',
    processUpdates: [
      {
        user: 'Mert Demir',
        message: 'Tüm davet anahtarları oluşturuldu ve özel kayıt bağlantıları e-posta ile iletildi.',
        timestamp: new Date(Date.now() - 24 * 3600000),
      },
    ],
    createdAt: new Date(Date.now() - 7 * 86400000),
    updatedAt: new Date(Date.now() - 24 * 3600000),
    companyId: 'demo-company-nova',
    subTeamId: 'subteam-merkez',
  },
];

export const DEMO_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    companyId: 'demo-company-nova',
    title: 'Yeni Alt Takım Çalışma Alanları ve QR Mesai Sistemi Devrede',
    imageUrl: '',
    content: 'Ar-Ge Laboratuvarı, Merkez Ofis ve Üretim Atölyesi için ayrı çalışma alanı görünümleri ve konum doğrulamalı QR giriş-çıkış noktaları aktif edilmiştir.',
    createdBy: 'Ahmet Yılmaz',
    createdByUid: 'demo-user-1',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 4 * 3600000)),
  },
  {
    id: 'ann-2',
    companyId: 'demo-company-nova',
    subTeamId: 'subteam-arge',
    title: 'Haftalık Sprint & Ürün Değerlendirme Toplantısı',
    imageUrl: '',
    content: 'Cuma günü saat 14:00\'te tüm alt takım liderleriyle Q4 ürün yol haritası ve sprint değerlendirme toplantısı gerçekleştirilecektir.',
    createdBy: 'Elif Kaya',
    createdByUid: 'demo-user-2',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 26 * 3600000)),
  },
];

export const DEMO_LINKS: TeamLink[] = [
  {
    id: 'lnk-1',
    companyId: 'demo-company-nova',
    subTeamId: 'subteam-arge',
    title: 'Kurumsal Mimari & API Dokümantasyonu',
    url: 'https://docs.example.com/architecture',
    description: 'Çoklu şirket veri modeli, güvenlik kuralları ve servis katmanı rehberi',
    category: 'Dokümantasyon',
    createdBy: 'Elif Kaya',
    createdByUid: 'demo-user-2',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 48 * 3600000)),
  },
  {
    id: 'lnk-2',
    companyId: 'demo-company-nova',
    title: 'Kurumsal Tasarım Sistemi & UI Kütüphanesi',
    url: 'https://figma.com/@novateknoloji',
    description: 'Kurumsal arayüz standartları ve bileşen şablonları',
    category: 'Tasarım',
    createdBy: 'Ahmet Yılmaz',
    createdByUid: 'demo-user-1',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 72 * 3600000)),
  },
  {
    id: 'lnk-3',
    companyId: 'demo-company-nova',
    subTeamId: 'subteam-merkez',
    title: 'İnsan Kaynakları & Çalışma Alanı El Kitabı',
    url: 'https://handbook.example.com',
    description: 'Yeni katılan çalışanlar için şirket kültürü ve mesai kuralları',
    category: 'Diğer',
    createdBy: 'Mert Demir',
    createdByUid: 'demo-user-3',
    createdAt: Timestamp.fromDate(new Date(Date.now() - 96 * 3600000)),
  },
];

const todayStr = new Date().toISOString().slice(0, 10);
const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const twoDaysAgoStr = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
const threeDaysAgoStr = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);

export const DEMO_SESSIONS: WorkshopSession[] = [
  {
    id: 'ses-1',
    companyId: 'demo-company-nova',
    subTeamId: 'subteam-arge',
    uid: 'demo-user-2',
    userName: 'Elif Kaya',
    checkIn: Timestamp.fromDate(new Date(Date.now() - 145 * 60000)),
    checkOut: null,
    duration: null,
    status: 'active',
    date: todayStr,
  },
  {
    id: 'ses-2',
    companyId: 'demo-company-nova',
    subTeamId: 'subteam-arge',
    uid: 'demo-user-4',
    userName: 'Zeynep Arslan',
    checkIn: Timestamp.fromDate(new Date(Date.now() - 210 * 60000)),
    checkOut: null,
    duration: null,
    status: 'active',
    date: todayStr,
  },
  {
    id: 'ses-3',
    companyId: 'demo-company-nova',
    subTeamId: 'subteam-arge',
    uid: 'demo-user-2',
    userName: 'Elif Kaya',
    checkIn: Timestamp.fromDate(new Date(Date.now() - 86400000 - 450 * 60000)),
    checkOut: Timestamp.fromDate(new Date(Date.now() - 86400000)),
    duration: 450,
    status: 'completed',
    date: yesterdayStr,
  },
  {
    id: 'ses-4',
    companyId: 'demo-company-nova',
    subTeamId: 'subteam-uretim',
    uid: 'demo-user-5',
    userName: 'Burak Şahin',
    checkIn: Timestamp.fromDate(new Date(Date.now() - 2 * 86400000 - 390 * 60000)),
    checkOut: Timestamp.fromDate(new Date(Date.now() - 2 * 86400000)),
    duration: 390,
    status: 'completed',
    date: twoDaysAgoStr,
  },
  {
    id: 'ses-5',
    companyId: 'demo-company-nova',
    subTeamId: 'subteam-merkez',
    uid: 'demo-user-3',
    userName: 'Mert Demir',
    checkIn: Timestamp.fromDate(new Date(Date.now() - 3 * 86400000 - 330 * 60000)),
    checkOut: Timestamp.fromDate(new Date(Date.now() - 3 * 86400000)),
    duration: 330,
    status: 'completed',
    date: threeDaysAgoStr,
  },
];

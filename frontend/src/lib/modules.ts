/**
 * Modül kayıt defteri.
 *
 * Tek kaynak: header navigasyonu, ana sayfadaki modül galerisi ve ileride
 * modül sayfası şablonu aynı listeyi okur. Rotalar `App.tsx` ile birebir
 * eşleşmelidir.
 *
 * `phase` alanı modülleri veri boru hattındaki yerlerine göre gruplar.
 * Ana sayfa anlatısı bu sıra üzerine kuruludur: veri girer (toplama),
 * çözümlenir, karara dönüşür; işletme katmanı hepsini ayakta tutar.
 */

export type ModulePhase = 'toplama' | 'cozumleme' | 'karar' | 'isletme'

export interface ModuleEntry {
  /** Kaynak Ar-Ge dokümanındaki modül kodu (M01..M15) */
  code: string
  name: string
  /** Modülün ne yaptığı — pazarlama cümlesi değil, işlevin kendisi */
  summary: string
  to: string
  phase: ModulePhase
}

export const PHASE_LABELS: Record<ModulePhase, string> = {
  toplama: 'Toplama',
  cozumleme: 'Çözümleme',
  karar: 'Karar',
  isletme: 'İşletme',
}

export const MODULES: ModuleEntry[] = [
  {
    code: 'M01',
    name: 'Veri Girişi',
    summary: 'Dosya yükleme, şema çıkarımı ve temizleme profilleriyle ön işleme.',
    to: '/m01-veri-girisi',
    phase: 'toplama',
  },
  {
    code: 'M02',
    name: 'Veri Depolama',
    summary: 'PostgreSQL üzerinde katmanlı depolama, meta veri kataloğu ve indeksleme.',
    to: '/m02-veri-depolama',
    phase: 'toplama',
  },
  {
    code: 'M09',
    name: 'API ve Entegrasyon',
    summary: 'API anahtarı, hız sınırlama, OpenAPI şeması ve webhook yayını.',
    to: '/m09-api',
    phase: 'toplama',
  },
  {
    code: 'M15',
    name: 'ERP Entegrasyonu',
    summary: 'ERP uçlarından veri çekip analitik katmanla birleştirme.',
    to: '/m15-erp',
    phase: 'toplama',
  },
  {
    code: 'M03',
    name: 'Gelişmiş Analitik',
    summary: 'Keşifsel analiz, korelasyon, kümeleme ve sınıflandırma.',
    to: '/m03-analitik',
    phase: 'cozumleme',
  },
  {
    code: 'M04',
    name: 'Tahmin ve Öngörü',
    summary: 'Zaman serisi tahminlemesi ve regresyon tabanlı öngörü.',
    to: '/m04-tahmin',
    phase: 'cozumleme',
  },
  {
    code: 'M14',
    name: 'Model Eğitimi',
    summary: 'MLflow ile deney takibi, yeniden eğitme ve sürüm karşılaştırması.',
    to: '/m14-model-egitimi',
    phase: 'cozumleme',
  },
  {
    code: 'M05',
    name: 'Karar Destek',
    summary: 'Kural motoru, eşik yönetimi ve gerekçeli öneri üretimi.',
    to: '/m05-karar-destek',
    phase: 'karar',
  },
  {
    code: 'M06',
    name: 'Raporlama',
    summary: 'Dashboard oluşturucu ve PDF / Excel rapor dışa aktarımı.',
    to: '/m06-raporlama',
    phase: 'karar',
  },
  {
    code: 'M07',
    name: 'Gerçek Zamanlı',
    summary: 'Akış tüketicisinden WebSocket köprüsüyle canlı grafiklere.',
    to: '/m07-gercek-zamanli',
    phase: 'karar',
  },
  {
    code: 'M08',
    name: 'Güvenlik',
    summary: 'Alan şifreleme, maskeleme ve erişim denetim kaydı.',
    to: '/m08-guvenlik',
    phase: 'isletme',
  },
  {
    code: 'M10',
    name: 'Kullanıcı Yönetimi',
    summary: 'JWT kimlik doğrulama ve rol tabanlı yetkilendirme.',
    to: '/m10-kullanicilar',
    phase: 'isletme',
  },
  {
    code: 'M11',
    name: 'Bakım',
    summary: 'Sürüm bilgisi, bakım modu, değişiklik günlüğü ve migration durumu.',
    to: '/m11-bakim',
    phase: 'isletme',
  },
  {
    code: 'M12',
    name: 'Yedekleme',
    summary: 'Zamanlanmış yedek alma ve geri yükleme arayüzü.',
    to: '/m12-yedekleme',
    phase: 'isletme',
  },
  {
    code: 'M13',
    name: 'Performans',
    summary: 'Prometheus metrikleri, uygulama içi izleme panosu ve uyarılar.',
    to: '/m13-performans',
    phase: 'isletme',
  },
]

/** Header'daki ana navigasyon — 15 modülün tamamı değil, dört durak. */
export const PRIMARY_NAV = [
  { label: 'Platform', href: '/#platform' },
  { label: 'Modüller', href: '/#moduller' },
  { label: 'Mimari', href: '/#mimari' },
] as const

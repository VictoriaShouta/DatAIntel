import { Link, Outlet } from 'react-router-dom'

// Geçici, tasarımsız kabuk. Header/nav, Claude Design tasarımı hazır olduktan
// sonra animasyonlu bileşenle değiştirilecek — burada sadece routing'in
// çalıştığını göstermek için düz bağlantı listesi var.
const MODULE_LINKS = [
  { to: '/m01-veri-girisi', label: 'M01 Veri Girişi' },
  { to: '/m02-veri-depolama', label: 'M02 Veri Depolama' },
  { to: '/m03-analitik', label: 'M03 Analitik' },
  { to: '/m04-tahmin', label: 'M04 Tahmin' },
  { to: '/m05-karar-destek', label: 'M05 Karar Destek' },
  { to: '/m06-raporlama', label: 'M06 Raporlama' },
  { to: '/m07-gercek-zamanli', label: 'M07 Gerçek Zamanlı' },
  { to: '/m08-guvenlik', label: 'M08 Güvenlik' },
  { to: '/m09-api', label: 'M09 API' },
  { to: '/m10-kullanicilar', label: 'M10 Kullanıcılar' },
  { to: '/m11-bakim', label: 'M11 Bakım' },
  { to: '/m12-yedekleme', label: 'M12 Yedekleme' },
  { to: '/m13-performans', label: 'M13 Performans' },
  { to: '/m14-model-egitimi', label: 'M14 Model Eğitimi' },
  { to: '/m15-erp', label: 'M15 ERP' },
]

export function Layout() {
  return (
    <div>
      <header>
        <Link to="/">DatAIntel</Link>
        <nav>
          <ul>
            {MODULE_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { IngestPage } from './pages/modules/IngestPage'
import { StoragePage } from './pages/modules/StoragePage'
import { AnalyticsPage } from './pages/modules/AnalyticsPage'
import { ForecastPage } from './pages/modules/ForecastPage'
import { DecisionSupportPage } from './pages/modules/DecisionSupportPage'
import { ReportingPage } from './pages/modules/ReportingPage'
import { RealtimePage } from './pages/modules/RealtimePage'
import { SecurityPage } from './pages/modules/SecurityPage'
import { ApiIntegrationPage } from './pages/modules/ApiIntegrationPage'
import { UserManagementPage } from './pages/modules/UserManagementPage'
import { MaintenancePage } from './pages/modules/MaintenancePage'
import { BackupPage } from './pages/modules/BackupPage'
import { PerformancePage } from './pages/modules/PerformancePage'
import { ModelTrainingPage } from './pages/modules/ModelTrainingPage'
import { ErpIntegrationPage } from './pages/modules/ErpIntegrationPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/m01-veri-girisi" element={<IngestPage />} />
        <Route path="/m02-veri-depolama" element={<StoragePage />} />
        <Route path="/m03-analitik" element={<AnalyticsPage />} />
        <Route path="/m04-tahmin" element={<ForecastPage />} />
        <Route path="/m05-karar-destek" element={<DecisionSupportPage />} />
        <Route path="/m06-raporlama" element={<ReportingPage />} />
        <Route path="/m07-gercek-zamanli" element={<RealtimePage />} />
        <Route path="/m08-guvenlik" element={<SecurityPage />} />
        <Route path="/m09-api" element={<ApiIntegrationPage />} />
        <Route path="/m10-kullanicilar" element={<UserManagementPage />} />
        <Route path="/m11-bakim" element={<MaintenancePage />} />
        <Route path="/m12-yedekleme" element={<BackupPage />} />
        <Route path="/m13-performans" element={<PerformancePage />} />
        <Route path="/m14-model-egitimi" element={<ModelTrainingPage />} />
        <Route path="/m15-erp" element={<ErpIntegrationPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App

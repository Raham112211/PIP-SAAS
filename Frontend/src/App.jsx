import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { GuestRoute } from './components/auth/GuestRoute';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { FirstLoginResetPage } from './pages/FirstLoginResetPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { OrganizationPage } from './pages/OrganizationPage';
import { BranchesPage } from './pages/BranchesPage';
import { ScrapingPage } from './pages/ScrapingPage';
import { BillsPage } from './pages/BillsPage';
import { RolesPage } from './pages/RolesPage';
import { StaffPage } from './pages/StaffPage';
import { LicencePage } from './pages/LicencePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <Routes>
      {/* Guest-only routes */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* First login reset */}
      <Route path="/first-login-reset" element={<ProtectedRoute><FirstLoginResetPage /></ProtectedRoute>} />

      {/* Protected app routes */}
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/organization" element={<OrganizationPage />} />
        <Route path="/branches" element={<BranchesPage />} />
        <Route path="/scraping" element={<ScrapingPage />} />
        <Route path="/bills" element={<BillsPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/licence" element={<LicencePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

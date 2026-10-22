import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider } from './components/ui';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Public pages
import HomePage from './pages/HomePage';
import BusSearchPage from './pages/BusSearchPage';
import BusDetailPage from './pages/BusDetailPage';
import TrainSearchPage from './pages/TrainSearchPage';
import TrainDetailPage from './pages/TrainDetailPage';
import HelpPage from './pages/HelpPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Protected pages
import CheckoutPage from './pages/CheckoutPage';
import DashboardPage from './pages/DashboardPage';
import MyBookingsPage from './pages/MyBookingsPage';
import BookingDetailPage from './pages/BookingDetailPage';

// Admin pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverviewPage from './pages/admin/OverviewPage';
import AdminBusesPage from './pages/admin/BusesPage';
import AdminTrainsPage from './pages/admin/TrainsPage';
import AdminBookingsPage from './pages/admin/BookingsPage';
import AdminUsersPage from './pages/admin/UsersPage';
import AdminReportsPage from './pages/admin/ReportsPage';
import AdminSettingsPage from './pages/admin/SettingsPage';
import AdminAuditLogsPage from './pages/admin/AuditLogsPage';
import AdminAlgorithmLabPage from './pages/admin/AlgorithmLabPage';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
          JalanYuk — Halaman Tidak Ditemukan
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Maaf, halaman yang Anda cari tidak ditemukan.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Kembali ke Beranda
        </a>
      </div>
    </div>
  );
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <ScrollToTop />
            <Routes>
              {/* Public routes with layout */}
              <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
              <Route path="/bus" element={<Navigate to="/bus/search" replace />} />
              <Route path="/bus/search" element={<PublicLayout><BusSearchPage /></PublicLayout>} />
              <Route path="/bus/:id" element={<PublicLayout><BusDetailPage /></PublicLayout>} />
              <Route path="/kereta" element={<Navigate to="/kereta/search" replace />} />
              <Route path="/kereta/search" element={<PublicLayout><TrainSearchPage /></PublicLayout>} />
              <Route path="/kereta/:id" element={<PublicLayout><TrainDetailPage /></PublicLayout>} />
              <Route path="/bantuan" element={<PublicLayout><HelpPage /></PublicLayout>} />
              <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
              <Route path="/register" element={<PublicLayout><RegisterPage /></PublicLayout>} />

              {/* Protected customer routes with layout */}
              <Route path="/checkout" element={<PublicLayout><ProtectedRoute><CheckoutPage /></ProtectedRoute></PublicLayout>} />
              <Route path="/dashboard" element={<PublicLayout><ProtectedRoute><DashboardPage /></ProtectedRoute></PublicLayout>} />
              <Route path="/my-bookings" element={<PublicLayout><ProtectedRoute><MyBookingsPage /></ProtectedRoute></PublicLayout>} />
              <Route path="/my-bookings/:id" element={<PublicLayout><ProtectedRoute><BookingDetailPage /></ProtectedRoute></PublicLayout>} />

              {/* Admin routes (role ADMIN only, enforced in UI and backend) */}
              <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<AdminOverviewPage />} />
                <Route path="buses" element={<AdminBusesPage />} />
                <Route path="trains" element={<AdminTrainsPage />} />
                <Route path="bookings" element={<AdminBookingsPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
                <Route path="audit-logs" element={<AdminAuditLogsPage />} />
                <Route path="algorithm-lab" element={<AdminAlgorithmLabPage />} />
              </Route>

              {/* 404 page */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

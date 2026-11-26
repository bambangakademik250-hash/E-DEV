import type { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import UjianPage from './pages/Ujian';
import MonitorPage from './pages/Monitor';
import KelasPage from './pages/Kelas';
import ChatPage from './pages/Chat';
import LaporanPage from './pages/Laporan';
import PengaturanPage from './pages/Pengaturan';
import StudentExamPage from './pages/StudentExam';
import { useAppState, useSession } from './lib/store';
import { modulesForRole } from './lib/modules';

/** Cegah peran membuka modul yang tidak diizinkan (mis. peserta ke Analitik). */
function AllowModule({ id, children }: { id: string; children: ReactNode }) {
  const app = useAppState();
  const user = useSession();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  const allowed = modulesForRole(user.role, app.workspace.settings.roleVisibility).some((module) => module.id === id);
  if (!allowed) {
    const fallback = user.role === 'peserta' ? '/ujian-peserta' : '/laporan';
    return <Navigate to={fallback} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route
          path="/"
          element={
            <AllowModule id="analytics">
              <DashboardPage />
            </AllowModule>
          }
        />
        <Route
          path="/ujian-peserta"
          element={
            <AllowModule id="student_exam">
              <StudentExamPage />
            </AllowModule>
          }
        />
        <Route
          path="/ujian"
          element={
            <AllowModule id="exams">
              <UjianPage />
            </AllowModule>
          }
        />
        <Route
          path="/monitor"
          element={
            <AllowModule id="monitoring">
              <MonitorPage />
            </AllowModule>
          }
        />
        <Route
          path="/kelas"
          element={
            <AllowModule id="classes">
              <KelasPage />
            </AllowModule>
          }
        />
        <Route
          path="/obrolan"
          element={
            <AllowModule id="chat">
              <ChatPage />
            </AllowModule>
          }
        />
        <Route
          path="/laporan"
          element={
            <AllowModule id="reports">
              <LaporanPage />
            </AllowModule>
          }
        />
        <Route
          path="/pengaturan"
          element={
            <AllowModule id="settings">
              <PengaturanPage />
            </AllowModule>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PesertaPage from './pages/Peserta';
import UjianPage from './pages/Ujian';
import MonitorPage from './pages/Monitor';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/peserta" element={<PesertaPage />} />
        <Route path="/ujian" element={<UjianPage />} />
        <Route path="/monitor" element={<MonitorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

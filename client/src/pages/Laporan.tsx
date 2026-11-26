import { useMemo, useState } from 'react';
import { useAppState, useSession } from '../lib/store';
import { Badge, EmptyState, Modal, Panel } from '../components/ui';
import Icon from '../components/Icon';
import { formatDate, formatDateTime, gradeOf, gradeTone } from '../lib/format';
import type { Attempt } from '../types';

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function certificateCode(attempt: Attempt) {
  return `SCBT-${attempt.id.slice(-4).toUpperCase()}-${attempt.examId.slice(-3).toUpperCase()}`;
}

export default function LaporanPage() {
  const { workspace } = useAppState();
  const user = useSession();
  const [selected, setSelected] = useState<Attempt | null>(null);
  const [filter, setFilter] = useState('semua');

  const rows = useMemo(() => {
    const scoped =
      user?.role === 'peserta'
        ? workspace.attempts.filter((attempt) => attempt.studentId === user.id)
        : workspace.attempts;
    return scoped
      .filter((attempt) => attempt.status === 'selesai')
      .filter((attempt) => filter === 'semua' || attempt.examId === filter)
      .sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''));
  }, [workspace.attempts, filter, user]);

  const examOf = (id: string) => workspace.exams.find((exam) => exam.id === id);

  const exportCsv = () => {
    const header = ['Nama Peserta', 'Ujian', 'Kelas', 'Nilai', 'Grade', 'KKM', 'Kode Sertifikat', 'Tanggal'];
    const lines = rows.map((attempt) => {
      const exam = examOf(attempt.examId);
      return [
        attempt.studentName,
        exam?.title ?? '',
        workspace.classes.find((kelas) => kelas.id === attempt.classId)?.name ?? '',
        attempt.score ?? '',
        gradeOf(attempt.score ?? null),
        exam?.kkm ?? '',
        certificateCode(attempt),
        attempt.submittedAt ?? '',
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',');
    });
    downloadFile(`Rekap-Nilai-${new Date().toISOString().slice(0, 10)}.csv`, [header.join(','), ...lines].join('\n'), 'text/csv');
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Laporan &amp; Sertifikat</h1>
          <p className="page-sub">Rekapitulasi nilai, berita acara, ekspor CSV, dan sertifikat QR</p>
        </div>
        <div className="head-actions">
          <select className="input select-compact" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter ujian">
            <option value="semua">Semua ujian</option>
            {workspace.exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title}
              </option>
            ))}
          </select>
          <button type="button" className="btn ghost" onClick={exportCsv}>
            <Icon name="download" size={15} /> Ekspor CSV
          </button>
        </div>
      </div>

      <Panel title="Rekapitulasi Nilai Ujian" subtitle={`${rows.length} hasil ujian terkumpul`}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama Peserta</th>
                <th>Ujian</th>
                <th>Kelas</th>
                <th className="num">Nilai</th>
                <th>Grade</th>
                <th>KKM</th>
                <th>Tanggal</th>
                <th className="actions-col">Sertifikat</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((attempt) => {
                const exam = examOf(attempt.examId);
                const passed = (attempt.score ?? 0) >= (exam?.kkm ?? 75);
                return (
                  <tr key={attempt.id}>
                    <td className="strong">{attempt.studentName}</td>
                    <td>{exam?.title ?? '—'}</td>
                    <td>{workspace.classes.find((kelas) => kelas.id === attempt.classId)?.name ?? '—'}</td>
                    <td className="num">{attempt.score ?? '—'}</td>
                    <td>
                      <Badge tone={gradeTone(attempt.score ?? null)}>{gradeOf(attempt.score ?? null)}</Badge>
                    </td>
                    <td>
                      <Badge tone={passed ? 'green' : 'red'}>{passed ? 'Lulus' : 'Belum'}</Badge>
                    </td>
                    <td className="small">{formatDate(attempt.submittedAt)}</td>
                    <td>
                      <button type="button" className="btn ghost small" onClick={() => setSelected(attempt)}>
                        <Icon name="qr" size={14} /> Lihat
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState title="Belum ada hasil" hint="Sertifikat tersedia setelah peserta mengumpulkan ujian." />}
        </div>
      </Panel>

      {selected && (
        <Modal
          title="Sertifikat Kelulusan Ujian"
          onClose={() => setSelected(null)}
          width={620}
          footer={
            <>
              <button type="button" className="btn ghost" onClick={() => setSelected(null)}>
                Tutup
              </button>
              <button type="button" className="btn primary" onClick={() => window.print()}>
                <Icon name="printer" size={15} /> Cetak / PDF
              </button>
            </>
          }
        >
          <div className="cert">
            <div className="cert-head">
              <span className="cert-logo">
                <Icon name="award" size={26} />
              </span>
              <div>
                <div className="cert-title">SERTIFIKAT KELULUSAN UJIAN</div>
                <div className="cert-sub">{workspace.settings.institutionName}</div>
              </div>
            </div>
            <p className="cert-line">Telah menyelesaikan asesmen</p>
            <h3 className="cert-exam">{examOf(selected.examId)?.title ?? '—'}</h3>
            <p className="cert-line">dengan perolehan nilai akhir:</p>
            <div className="cert-score">
              <strong>{selected.score ?? '—'}</strong>
              <Badge tone={gradeTone(selected.score ?? null)}>{gradeOf(selected.score ?? null)}</Badge>
            </div>
            <div className="cert-grid">
              <div>
                <span>Nama Peserta</span>
                <strong>{selected.studentName}</strong>
              </div>
              <div>
                <span>Kelas</span>
                <strong>{workspace.classes.find((kelas) => kelas.id === selected.classId)?.name ?? '—'}</strong>
              </div>
              <div>
                <span>Tanggal Ujian</span>
                <strong>{formatDateTime(selected.submittedAt)}</strong>
              </div>
              <div>
                <span>Kode Sertifikat</span>
                <strong className="mono">{certificateCode(selected)}</strong>
              </div>
            </div>
            <div className="cert-foot">
              <span className="cert-qr" aria-hidden="true">
                <Icon name="qr" size={54} />
              </span>
              <span className="muted small">
                Pindai kode untuk memverifikasi validitas hasil ujian. Sertifikat diterbitkan otomatis oleh sistem
                SCBT.
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

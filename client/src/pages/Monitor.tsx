import { useMemo } from 'react';
import { useAppState } from '../lib/store';
import { formatTime, gradeOf, gradeTone } from '../lib/format';
import { Avatar, Badge, EmptyState, ProgressBar, StatCard } from '../components/ui';

const STATUS_LABEL = {
  online: 'Mengerjakan',
  selesai: 'Selesai',
  offline: 'Offline',
} as const;

const STATUS_TONE = {
  online: 'green',
  selesai: 'blue',
  offline: 'gray',
} as const;

export default function MonitorPage() {
  const { peserta, ujian, serverOnline, pending, lastSync } = useAppState();

  const stats = useMemo(() => {
    const online = peserta.filter((row) => row.status === 'online').length;
    const selesai = peserta.filter((row) => row.status === 'selesai').length;
    const peringatan = peserta.reduce((total, row) => total + row.peringatan, 0);
    return {
      online,
      selesai,
      peringatan,
      progress: peserta.length ? Math.round((selesai / peserta.length) * 100) : 0,
    };
  }, [peserta]);

  const aktif = ujian.filter((row) => row.status === 'aktif');

  const rows = useMemo(
    () =>
      [...peserta].sort((a, b) => {
        const order = { online: 0, offline: 1, selesai: 2 };
        return order[a.status] - order[b.status] || a.nama.localeCompare(b.nama);
      }),
    [peserta],
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Monitor Ujian</h1>
          <p className="page-sub">
            {aktif.length > 0
              ? `${aktif.map((row) => row.nama).join(', ')} sedang berlangsung`
              : 'Tidak ada ujian yang sedang berlangsung'}
          </p>
        </div>
        <Badge tone={serverOnline ? 'green' : 'amber'}>
          {serverOnline ? 'Realtime dari server' : 'Data lokal · menunggu sinkron'}
        </Badge>
      </div>

      <div className="grid-stats">
        <StatCard label="Peserta Online" value={stats.online} sub="Sedang mengerjakan" tone="green" />
        <StatCard label="Peringatan" value={stats.peringatan} sub="Pindah tab / fullscreen" tone="amber" />
        <StatCard label="Peserta Selesai" value={stats.selesai} sub={`${stats.progress}% dari total`} tone="blue" />
        <StatCard
          label="Sinkronisasi"
          value={pending > 0 ? `${pending} antrean` : serverOnline ? 'Aman' : 'Offline'}
          sub={lastSync ? `Terakhir ${formatTime(new Date(lastSync).toISOString())}` : 'Belum pernah sinkron'}
          tone={pending > 0 ? 'amber' : serverOnline ? 'green' : 'red'}
        />
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Status Peserta</h2>
          <Badge tone="green">Live</Badge>
        </div>
        {rows.length === 0 ? (
          <EmptyState title="Belum ada peserta" hint="Tambahkan peserta di menu Peserta." />
        ) : (
          <div className="table-wrap flat">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>NIM</th>
                  <th>Mata Kuliah</th>
                  <th>Progress</th>
                  <th className="num">Nilai</th>
                  <th>Peringatan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const answered = (row.benar ?? 0) + (row.salah ?? 0);
                  const totalSoal = ujian.find((item) => item.nama === row.mataKuliah)?.soal ?? 0;
                  const progress =
                    row.status === 'selesai'
                      ? 100
                      : totalSoal > 0
                        ? Math.min(99, Math.round((answered / totalSoal) * 100))
                        : 0;
                  return (
                    <tr key={row.id}>
                      <td>
                        <div className="cell-person">
                          <Avatar name={row.nama} size={26} />
                          <span className="strong">{row.nama}</span>
                        </div>
                      </td>
                      <td className="mono">{row.nim}</td>
                      <td>{row.mataKuliah}</td>
                      <td>
                        <div className="progress-cell">
                          <ProgressBar value={progress} tone={progress >= 80 ? 'green' : progress > 0 ? 'blue' : 'gray'} />
                          <span className="muted small">{progress}%</span>
                        </div>
                      </td>
                      <td className="num">
                        {row.nilai === null ? (
                          '—'
                        ) : (
                          <span className={`nilai t-${gradeTone(row.nilai)}`}>
                            {row.nilai} <span className="muted small">{gradeOf(row.nilai)}</span>
                          </span>
                        )}
                      </td>
                      <td>
                        {row.peringatan > 0 ? (
                          <Badge tone="amber">{row.peringatan}×</Badge>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

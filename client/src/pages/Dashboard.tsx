import { useMemo } from 'react';
import { useAppState } from '../lib/store';
import { gradeOf, gradeTone } from '../lib/format';
import { Badge, EmptyState, ProgressBar, StatCard } from '../components/ui';

export default function Dashboard() {
  const { peserta, ujian, ready, serverOnline } = useAppState();

  const stats = useMemo(() => {
    const nilai = peserta.map((row) => row.nilai).filter((value): value is number => value !== null);
    const selesai = peserta.filter((row) => row.status === 'selesai').length;
    return {
      total: peserta.length,
      aktif: ujian.filter((row) => row.status === 'aktif').length,
      selesai,
      rata: nilai.length ? Math.round(nilai.reduce((a, b) => a + b, 0) / nilai.length) : 0,
    };
  }, [peserta, ujian]);

  const kelasProgress = useMemo(() => {
    const groups = new Map<string, { total: number; selesai: number }>();
    peserta.forEach((row) => {
      const key = row.kelas || 'Tanpa kelas';
      const group = groups.get(key) ?? { total: 0, selesai: 0 };
      group.total += 1;
      if (row.status === 'selesai') group.selesai += 1;
      groups.set(key, group);
    });
    return [...groups.entries()]
      .map(([kelas, group]) => ({
        kelas,
        ...group,
        percent: Math.round((group.selesai / group.total) * 100),
      }))
      .sort((a, b) => a.kelas.localeCompare(b.kelas));
  }, [peserta]);

  const gradeDist = useMemo(() => {
    const order = ['A', 'B+', 'B', 'C+', 'C', 'D'];
    const counts = new Map<string, number>(order.map((grade) => [grade, 0]));
    peserta.forEach((row) => {
      if (row.nilai === null) return;
      const grade = gradeOf(row.nilai);
      counts.set(grade, (counts.get(grade) ?? 0) + 1);
    });
    const max = Math.max(1, ...counts.values());
    return order.map((grade) => ({ grade, count: counts.get(grade) ?? 0, percent: Math.round(((counts.get(grade) ?? 0) / max) * 100) }));
  }, [peserta]);

  const rekap = useMemo(
    () =>
      peserta
        .filter((row) => row.nilai !== null)
        .sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''))
        .slice(0, 8),
    [peserta],
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Ringkasan ujian, peserta, dan hasil terbaru</p>
        </div>
        <Badge tone={serverOnline ? 'green' : 'amber'}>
          {serverOnline ? 'Sinkron dengan server' : 'Data lokal (offline)'}
        </Badge>
      </div>

      <div className="grid-stats">
        <StatCard label="Total Peserta" value={stats.total} sub="Terdaftar di semua kelas" tone="blue" />
        <StatCard label="Ujian Aktif" value={stats.aktif} sub={`dari ${ujian.length} mata kuliah`} tone="green" />
        <StatCard label="Peserta Selesai" value={stats.selesai} sub="Sudah submit ujian" tone="violet" />
        <StatCard label="Rata-rata Nilai" value={stats.rata} sub="Dari peserta yang selesai" tone="amber" />
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2>Progress Submit per Kelas</h2>
            <Badge tone="green">Live</Badge>
          </div>
          {kelasProgress.length === 0 ? (
            <EmptyState title="Belum ada peserta" hint="Tambahkan peserta untuk melihat progress." />
          ) : (
            <div className="stack">
              {kelasProgress.map((row) => (
                <div key={row.kelas}>
                  <div className="row-between small">
                    <span className="strong">{row.kelas}</span>
                    <span className="muted">
                      {row.selesai}/{row.total} selesai
                    </span>
                  </div>
                  <ProgressBar value={row.percent} tone={row.percent >= 80 ? 'green' : row.percent >= 50 ? 'blue' : 'amber'} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Distribusi Grade</h2>
          </div>
          <div className="stack">
            {gradeDist.map((row) => (
              <div key={row.grade} className="grade-row">
                <span className="grade-label">{row.grade}</span>
                <ProgressBar value={row.percent} tone={row.grade.startsWith('A') ? 'green' : row.grade.startsWith('B') ? 'blue' : row.grade.startsWith('C') ? 'amber' : 'red'} />
                <span className="grade-count">{row.count}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2>Mata Kuliah &amp; Ujian</h2>
            <Badge tone="violet">UTS &amp; UAS</Badge>
          </div>
          {ujian.length === 0 ? (
            <EmptyState title="Belum ada ujian" hint="Buka menu Ujian untuk menambah mata kuliah." />
          ) : (
            <div className="stack-sm">
              {ujian.slice(0, 5).map((row) => (
                <div key={row.id} className="list-row">
                  <span className="list-icon">{row.ikon}</span>
                  <div className="list-main">
                    <span className="strong">{row.nama}</span>
                    <span className="muted small">
                      {row.kode} · {row.tipe} · {row.soal} soal
                    </span>
                  </div>
                  <Badge tone={row.status === 'aktif' ? 'green' : 'gray'}>
                    {row.status === 'aktif' ? 'Aktif' : 'Belum'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Rekap Nilai Terbaru</h2>
          </div>
          {rekap.length === 0 ? (
            <EmptyState title="Belum ada nilai" hint="Nilai muncul setelah peserta menyelesaikan ujian." />
          ) : (
            <div className="stack-sm">
              {rekap.map((row) => (
                <div key={row.id} className="list-row">
                  <div className="list-main">
                    <span className="strong">{row.nama}</span>
                    <span className="muted small">
                      {row.mataKuliah} · {row.nim}
                    </span>
                  </div>
                  <span className={`nilai t-${gradeTone(row.nilai)}`}>{row.nilai}</span>
                  <Badge tone={gradeTone(row.nilai)}>{gradeOf(row.nilai)}</Badge>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {!ready && <p className="muted small">Memuat data…</p>}
    </div>
  );
}

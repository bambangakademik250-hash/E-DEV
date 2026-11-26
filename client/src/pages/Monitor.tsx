import { useMemo, useState } from 'react';
import { resetAttempt, setAttemptStatus, useAppState } from '../lib/store';
import { Badge, EmptyState, Panel, ProgressBar, StatCard } from '../components/ui';
import Icon from '../components/Icon';
import { formatTime, isAnswered, progressOf } from '../lib/format';

export default function MonitorPage() {
  const { workspace } = useAppState();
  const [filter, setFilter] = useState<'semua' | 'berlangsung' | 'dijeda' | 'selesai'>('semua');

  const rows = useMemo(
    () =>
      workspace.attempts
        .map((attempt) => {
          const exam = workspace.exams.find((row) => row.id === attempt.examId);
          const total = exam?.questionIds.length ?? 0;
          const answered = Object.values(attempt.answers).filter((value) => isAnswered(value)).length;
          return {
            attempt,
            exam,
            total,
            answered,
            percent: progressOf(answered, Math.max(total, 1)),
            className: workspace.classes.find((kelas) => kelas.id === attempt.classId)?.name ?? '—',
          };
        })
        .filter((row) => filter === 'semua' || row.attempt.status === filter)
        .sort((a, b) => b.attempt.startedAt.localeCompare(a.attempt.startedAt)),
    [workspace, filter],
  );

  const live = workspace.attempts.filter((attempt) => attempt.status === 'berlangsung').length;
  const paused = workspace.attempts.filter((attempt) => attempt.status === 'dijeda').length;
  const violations = workspace.attempts.reduce((sum, attempt) => sum + attempt.violations, 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Monitor Proktor</h1>
          <p className="page-sub">Pantau peserta secara langsung, jeda ujian, dan reset login peserta</p>
        </div>
        <span className="chip chip-green">
          <span className="dot dot-green" /> {live} peserta aktif
        </span>
      </div>

      <div className="stat-grid">
        <StatCard label="Sedang Ujian" value={live} sub="Peserta aktif di sesi berjalan" tone="green" icon={<Icon name="play" size={16} />} />
        <StatCard label="Dijeda" value={paused} sub="Menunggu dilanjutkan proktor" tone="amber" icon={<Icon name="pause" size={16} />} />
        <StatCard label="Total Attempt" value={workspace.attempts.length} sub="Seluruh riwayat pengerjaan" icon={<Icon name="users" size={16} />} />
        <StatCard label="Pelanggaran" value={violations} sub="Pindah tab / keluar fullscreen" tone="red" icon={<Icon name="shield" size={16} />} />
      </div>

      <div className="toolbar">
        <div className="seg">
          {(['semua', 'berlangsung', 'dijeda', 'selesai'] as const).map((item) => (
            <button key={item} type="button" className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>
              {item === 'semua' ? 'Semua' : item === 'berlangsung' ? 'Mengerjakan' : item === 'dijeda' ? 'Dijeda' : 'Selesai'}
            </button>
          ))}
        </div>
        <span className="muted small">{rows.length} baris</span>
      </div>

      <Panel>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Peserta</th>
                <th>Ujian</th>
                <th>Progress</th>
                <th>Mulai</th>
                <th className="num">Pelanggaran</th>
                <th>Status</th>
                <th className="actions-col">Aksi Proktor</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.attempt.id}>
                  <td>
                    <div className="strong">{row.attempt.studentName}</div>
                    <div className="muted small">{row.className}</div>
                  </td>
                  <td>
                    <div>{row.exam?.title ?? '—'}</div>
                    <div className="muted small">
                      {row.exam ? `${row.exam.durationMinutes} menit · token ${row.exam.entryToken}` : '—'}
                    </div>
                  </td>
                  <td className="cell-progress">
                    <div className="muted small">
                      {row.answered}/{row.total} soal
                    </div>
                    <ProgressBar value={row.percent} tone={row.percent >= 70 ? 'green' : 'blue'} />
                  </td>
                  <td className="small">{formatTime(row.attempt.startedAt)}</td>
                  <td className="num">
                    <Badge tone={row.attempt.violations > 0 ? 'red' : 'gray'}>{row.attempt.violations}x</Badge>
                  </td>
                  <td>
                    <Badge
                      tone={
                        row.attempt.status === 'berlangsung' ? 'green' : row.attempt.status === 'dijeda' ? 'amber' : 'blue'
                      }
                    >
                      {row.attempt.status === 'berlangsung'
                        ? 'Mengerjakan'
                        : row.attempt.status === 'dijeda'
                          ? 'Dijeda'
                          : 'Selesai'}
                    </Badge>
                  </td>
                  <td>
                    <div className="row-actions">
                      {row.attempt.status !== 'selesai' && (
                        <button
                          type="button"
                          className="icon-btn"
                          title={row.attempt.status === 'dijeda' ? 'Lanjutkan ujian' : 'Jeda ujian'}
                          aria-label={`${row.attempt.status === 'dijeda' ? 'Lanjutkan' : 'Jeda'} ${row.attempt.studentName}`}
                          onClick={() =>
                            setAttemptStatus(
                              row.attempt.id,
                              row.attempt.status === 'dijeda' ? 'berlangsung' : 'dijeda',
                            )
                          }
                        >
                          <Icon name={row.attempt.status === 'dijeda' ? 'play' : 'pause'} size={15} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="icon-btn danger"
                        title="Reset login peserta"
                        aria-label={`Reset login ${row.attempt.studentName}`}
                        onClick={() => resetAttempt(row.attempt.id)}
                      >
                        <Icon name="refresh" size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <EmptyState title="Tidak ada peserta" hint="Belum ada attempt pada filter ini." />}
        </div>
      </Panel>
    </div>
  );
}

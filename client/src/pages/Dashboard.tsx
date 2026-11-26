import { useMemo } from 'react';
import { useAppState, useSession } from '../lib/store';
import { Badge, EmptyState, Panel, ProgressBar, StatCard } from '../components/ui';
import { EXAM_MODE_LABEL, formatDate, formatDateTime, gradeOf, gradeTone, progressOf } from '../lib/format';
import Icon from '../components/Icon';
import type { Tone } from '../types';

const GRADE_ORDER = ['A', 'B+', 'B', 'C+', 'C', 'D'];

export default function DashboardPage() {
  const { workspace } = useAppState();
  const user = useSession();

  const stats = useMemo(() => {
    const students = workspace.users.filter((row) => row.role === 'peserta');
    const activeExams = workspace.exams.filter((exam) => exam.status === 'berlangsung');
    const finished = workspace.attempts.filter((attempt) => attempt.status === 'selesai');
    const scores = finished.map((attempt) => attempt.score ?? 0);
    const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
    const passed = finished.filter((attempt) => {
      const exam = workspace.exams.find((row) => row.id === attempt.examId);
      return (attempt.score ?? 0) >= (exam?.kkm ?? 75);
    }).length;
    return {
      students: students.length,
      activeExams: activeExams.length,
      totalExams: workspace.exams.length,
      finished: finished.length,
      average,
      passedRate: finished.length ? Math.round((passed / finished.length) * 100) : 0,
      finishedAttempts: finished,
    };
  }, [workspace]);

  const gradeBuckets = useMemo(() => {
    const counts: Record<string, number> = { A: 0, 'B+': 0, B: 0, 'C+': 0, C: 0, D: 0 };
    stats.finishedAttempts.forEach((attempt) => {
      const grade = gradeOf(attempt.score ?? null);
      if (grade in counts) counts[grade] += 1;
    });
    const max = Math.max(1, ...Object.values(counts));
    return GRADE_ORDER.map((grade) => ({ grade, count: counts[grade], width: (counts[grade] / max) * 100 }));
  }, [stats.finishedAttempts]);

  const classProgress = useMemo(
    () =>
      workspace.classes.map((kelas) => {
        const students = workspace.users.filter((row) => row.role === 'peserta' && row.classId === kelas.id);
        const attempts = workspace.attempts.filter(
          (attempt) => attempt.classId === kelas.id && attempt.status === 'selesai',
        );
        return {
          ...kelas,
          students: students.length,
          done: attempts.length,
          percent: progressOf(attempts.length, Math.max(students.length, 1)),
        };
      }),
    [workspace],
  );

  const subjectRows = useMemo(() => {
    const map = new Map<string, { total: number; sum: number; count: number }>();
    workspace.attempts
      .filter((attempt) => attempt.status === 'selesai')
      .forEach((attempt) => {
        const exam = workspace.exams.find((row) => row.id === attempt.examId);
        if (!exam) return;
        const entry = map.get(exam.subject) ?? { total: 0, sum: 0, count: 0 };
        entry.total += 1;
        entry.sum += attempt.score ?? 0;
        entry.count += 1;
        map.set(exam.subject, entry);
      });
    return [...map.entries()]
      .map(([subject, value]) => ({
        subject,
        count: value.count,
        average: value.count ? Math.round(value.sum / value.count) : 0,
      }))
      .sort((a, b) => b.average - a.average);
  }, [workspace]);

  const recent = useMemo(
    () =>
      [...stats.finishedAttempts]
        .sort((a, b) => (b.submittedAt ?? '').localeCompare(a.submittedAt ?? ''))
        .slice(0, 6),
    [stats.finishedAttempts],
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Analitik &amp; Evaluasi</h1>
          <p className="page-sub">
            Statistik skor, ketercapaian KKM, dan pemetaan hasil ujian seluruh kelas
          </p>
        </div>
        <span className="chip chip-blue">
          <Icon name="clock" size={13} /> {formatDate(new Date().toISOString())}
        </span>
      </div>

      <div className="stat-grid">
        <StatCard
          label="Total Peserta"
          value={stats.students}
          sub="Terdaftar di semua kelas"
          icon={<Icon name="users" size={16} />}
        />
        <StatCard
          label="Ujian Berlangsung"
          value={stats.activeExams}
          sub={`dari ${stats.totalExams} sesi ujian`}
          tone="violet"
          icon={<Icon name="book" size={16} />}
        />
        <StatCard
          label="Ujian Selesai"
          value={stats.finished}
          sub="Peserta sudah submit"
          tone="green"
          icon={<Icon name="check" size={16} />}
        />
        <StatCard
          label="Rata-rata Nilai"
          value={stats.average}
          sub={`KKM tercapai ${stats.passedRate}%`}
          tone="amber"
          icon={<Icon name="award" size={16} />}
        />
      </div>

      <div className="grid-2">
        <Panel title="Progress Submit per Kelas" subtitle="Peserta yang sudah menyelesaikan ujian">
          <div className="progress-list">
            {classProgress.map((kelas) => (
              <div className="progress-row" key={kelas.id}>
                <div className="progress-head">
                  <span className="strong">{kelas.name}</span>
                  <span className="muted small">
                    {kelas.done}/{kelas.students} selesai
                  </span>
                </div>
                <ProgressBar value={kelas.percent} tone={kelas.percent >= 70 ? 'green' : 'blue'} />
              </div>
            ))}
            {classProgress.length === 0 && <EmptyState title="Belum ada kelas" hint="Tambahkan kelas di menu Kelas & Absensi." />}
          </div>
        </Panel>

        <Panel title="Distribusi Grade" subtitle="Berdasarkan seluruh nilai yang sudah masuk">
          <div className="grade-list">
            {gradeBuckets.map((bucket) => (
              <div className="grade-row" key={bucket.grade}>
                <span className="grade-key">{bucket.grade}</span>
                <div className="grade-bar">
                  <span className={`bar-fill t-${gradeTone(bucket.grade === 'A' ? 90 : bucket.grade === 'B+' ? 78 : bucket.grade === 'B' ? 68 : bucket.grade === 'C+' ? 58 : bucket.grade === 'C' ? 48 : 30)}`} style={{ width: `${bucket.width}%` }} />
                </div>
                <span className="grade-count">{bucket.count}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid-2">
        <Panel title="Sesi Ujian" subtitle="Daftar ujian beserta token masuk">
          <div className="list">
            {workspace.exams.map((exam) => (
              <div className="list-row" key={exam.id}>
                <div>
                  <div className="strong">{exam.title}</div>
                  <div className="muted small">
                    {exam.subject} · {EXAM_MODE_LABEL[exam.mode]} · {exam.questionIds.length} soal · token{' '}
                    <span className="mono">{exam.entryToken}</span>
                  </div>
                </div>
                <Badge tone={exam.status === 'berlangsung' ? 'green' : exam.status === 'terjadwal' ? 'blue' : 'gray'}>
                  {exam.status === 'berlangsung' ? 'Aktif' : exam.status === 'terjadwal' ? 'Terjadwal' : exam.status === 'draft' ? 'Draft' : 'Selesai'}
                </Badge>
              </div>
            ))}
            {workspace.exams.length === 0 && <EmptyState title="Belum ada ujian" hint="Buat sesi ujian di menu Ujian & Bank Soal." />}
          </div>
        </Panel>

        <Panel title="Rekap Nilai Terbaru" subtitle="Hasil ujian yang baru dikumpulkan peserta">
          <div className="list">
            {recent.map((attempt) => (
              <div className="list-row" key={attempt.id}>
                <div>
                  <div className="strong">{attempt.studentName}</div>
                  <div className="muted small">{formatDateTime(attempt.submittedAt)}</div>
                </div>
                <div className="score-cell">
                  <span className="score-num">{attempt.score ?? '—'}</span>
                  <Badge tone={gradeTone(attempt.score ?? null)}>{gradeOf(attempt.score ?? null)}</Badge>
                </div>
              </div>
            ))}
            {recent.length === 0 && <EmptyState title="Belum ada nilai" hint="Nilai muncul setelah peserta mengumpulkan ujian." />}
          </div>
        </Panel>
      </div>

      <Panel title="Performa per Mata Pelajaran" subtitle="Rata-rata nilai berdasarkan mapel ujian">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mata Pelajaran</th>
                <th className="num">Jumlah Selesai</th>
                <th className="num">Rata-rata</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {subjectRows.map((row) => (
                <tr key={row.subject}>
                  <td className="strong">{row.subject}</td>
                  <td className="num">{row.count}</td>
                  <td className="num">{row.average}</td>
                  <td>
                    <Badge tone={(row.average >= 75 ? 'green' : row.average >= 60 ? 'amber' : 'red') as Tone}>
                      {row.average >= 75 ? 'Baik' : row.average >= 60 ? 'Cukup' : 'Perlu pendampingan'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {subjectRows.length === 0 && <EmptyState title="Belum ada data nilai" />}
        </div>
      </Panel>

      {user && (
        <p className="page-foot muted small">
          Masuk sebagai {user.name} · peran {user.role} · data tersimpan offline di perangkat ini
        </p>
      )}
    </div>
  );
}

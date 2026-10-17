
import { useMemo, useState, type FormEvent } from 'react'
import '../App.css'

type OutputItem = {
  id: number
  jenis: string
  judul: string
  status: string
  jumlahRealisasi: number
  progres: number
  dataDukung: string
}

type Activity = {
  id: number
  ketuaTim: string
  unitKerja: string
  satuanKerja: string
  judulAktivitas: string
  targetOutput: string
  jumlah: number
  statusPelaksanaan: string
  progresAktivitas: number
  uraianKemajuan: string
  kendala: string
  mitigasi: string
  dataDukungProgres: string
  outputs: OutputItem[]
}

const outputTypes = [
  'Purwarupa', 'Publikasi', 'Paten', 'Hak Cipta',
  'Model', 'Rekomendasi Naskah Kebijakan',
  'Kekayaan Intelektual', 'Lainnya',
]

const statuses = [
  'Perencanaan', 'Dalam proses', 'Menunggu verifikasi',
  'Selesai', 'Terkendala',
]

const initialActivities: Activity[] = [
  {
    id: 1,
    ketuaTim: 'Periset 1 (Contoh Pengisian)',
    unitKerja: 'Pusat Riset Antariksa',
    satuanKerja: 'Organisasi Riset Penerbangan dan Antariksa',
    judulAktivitas: 'Judul aktivitas yang dilaksanakan oleh periset',
    targetOutput: 'Purwarupa',
    jumlah: 1,
    statusPelaksanaan: 'Dalam proses',
    progresAktivitas: 50,
    uraianKemajuan: 'Purwarupa telah diselesaikan. Paten sedang diajukan dan hak cipta menunggu konfirmasi penerimaan.',
    kendala: '-',
    mitigasi: '-',
    dataDukungProgres: 'Foto kegiatan penelitian; bukti pengajuan HKI dan paten',
    outputs: [
      {
        id: 101,
        jenis: 'Purwarupa',
        judul: 'Judul purwarupa yang sedang dikerjakan',
        status: 'Selesai',
        jumlahRealisasi: 1,
        progres: 100,
        dataDukung: 'Link Drive / foto purwarupa',
      },
      {
        id: 102,
        jenis: 'Paten',
        judul: 'Judul paten yang diajukan',
        status: 'Dalam proses',
        jumlahRealisasi: 2,
        progres: 100,
        dataDukung: 'Foto bukti pengajuan paten',
      },
      {
        id: 103,
        jenis: 'Hak Cipta',
        judul: 'Judul hak cipta yang diajukan',
        status: 'Dalam proses',
        jumlahRealisasi: 1,
        progres: 50,
        dataDukung: 'Sertifikat atau bukti pengajuan HKI',
      },
    ],
  },
]

function createActivity(): Activity {
  return {
    id: Date.now(),
    ketuaTim: '',
    unitKerja: '',
    satuanKerja: '',
    judulAktivitas: '',
    targetOutput: 'Purwarupa',
    jumlah: 1,
    statusPelaksanaan: 'Perencanaan',
    progresAktivitas: 0,
    uraianKemajuan: '',
    kendala: '',
    mitigasi: '',
    dataDukungProgres: '',
    outputs: [],
  }
}

function createOutput(): OutputItem {
  return {
    id: Date.now() + Math.floor(Math.random() * 10000),
    jenis: 'Purwarupa',
    judul: '',
    status: 'Perencanaan',
    jumlahRealisasi: 0,
    progres: 0,
    dataDukung: '',
  }
}

function Field({
  label,
  value,
  onChange,
  multiline = false,
  type = 'text',
  min,
  max,
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
  multiline?: boolean
  type?: string
  min?: number
  max?: number
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : (
        <input
          type={type}
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  )
}

export default function MonevEditor() {
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [selectedId, setSelectedId] = useState<number>(1)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState<Activity | null>(null)
  const [message, setMessage] = useState('')

  const filteredActivities = useMemo(() => {
    const query = search.toLowerCase().trim()
    return activities.filter((a) =>
      [a.ketuaTim, a.unitKerja, a.judulAktivitas, a.targetOutput]
        .some((value) => value.toLowerCase().includes(query)),
    )
  }, [activities, search])

  const selectedActivity = activities.find((a) => a.id === selectedId)
    ?? activities[0]

  const totalOutputs = activities.reduce(
    (total, a) => total + a.outputs.length, 0,
  )

  const completedOutputs = activities.reduce(
    (total, a) => total + a.outputs.filter((o) => o.status === 'Selesai').length,
    0,
  )

  const averageProgress = activities.length
    ? Math.round(
        activities.reduce((total, a) => total + a.progresAktivitas, 0)
        / activities.length,
      )
    : 0

  function updateDraft<K extends keyof Activity>(key: K, value: Activity[K]) {
    setDraft((current) => current ? { ...current, [key]: value } : current)
  }

  function updateOutput(
    outputId: number,
    key: keyof OutputItem,
    value: string | number,
  ) {
    setDraft((current) => current ? {
      ...current,
      outputs: current.outputs.map((o) =>
        o.id === outputId ? { ...o, [key]: value } : o,
      ),
    } : current)
  }

  function openEditor(activity: Activity) {
    setSelectedId(activity.id)
    setDraft({
      ...activity,
      outputs: activity.outputs.map((o) => ({ ...o })),
    })
    setShowForm(true)
    setMessage('')
  }

  function addActivity() {
    setDraft(createActivity())
    setShowForm(true)
    setMessage('')
  }

  function saveActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft) return

    const exists = activities.some((a) => a.id === draft.id)

    setActivities((current) =>
      exists
        ? current.map((a) => a.id === draft.id ? draft : a)
        : [...current, draft],
    )
    setSelectedId(draft.id)
    setShowForm(false)
    setDraft(null)
    setMessage('Perubahan berhasil disimpan pada sesi ini.')
  }

  function deleteActivity(id: number) {
    if (!window.confirm('Hapus aktivitas ini beserta seluruh target outputnya?')) {
      return
    }

    const remaining = activities.filter((a) => a.id !== id)
    setActivities(remaining)
    setSelectedId(remaining[0]?.id ?? -1)
    setShowForm(false)
    setDraft(null)
    setMessage('Aktivitas berhasil dihapus dari tampilan.')
  }

  function addOutput() {
    setDraft((current) => current
      ? { ...current, outputs: [...current.outputs, createOutput()] }
      : current)
  }

  function deleteOutput(outputId: number) {
    setDraft((current) => current
      ? {
          ...current,
          outputs: current.outputs.filter((o) => o.id !== outputId),
        }
      : current)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">R</div>
          <div>
            <strong>ResearchTrack</strong>
            <span>Monitoring Aktivitas dan Output</span>
          </div>
        </div>
        <span className="topbar-tag">Dashboard Penelitian</span>
      </header>

      <section className="page-heading">
        <div>
          <p className="eyebrow">MANAJEMEN RISET</p>
          <h1>Aktivitas dan Capaian Output</h1>
          <p className="subtitle">
            Kelola aktivitas, progres pelaksanaan, dan target output penelitian.
          </p>
        </div>
        <button className="button primary" type="button" onClick={addActivity}>
          + Tambah Aktivitas
        </button>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Total Aktivitas</span>
          <strong>{activities.length}</strong>
          <span className="stat-caption">Aktivitas terdaftar</span>
        </article>
        <article className="stat-card">
          <span className="stat-label">Rata-rata Progres</span>
          <strong>{averageProgress}%</strong>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${averageProgress}%` }} />
          </div>
        </article>
        <article className="stat-card">
          <span className="stat-label">Total Target Output</span>
          <strong>{totalOutputs}</strong>
          <span className="stat-caption">Seluruh aktivitas</span>
        </article>
        <article className="stat-card">
          <span className="stat-label">Output Selesai</span>
          <strong>{completedOutputs}</strong>
          <span className="stat-caption">Status selesai</span>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Daftar Aktivitas</h2>
            <p>Pilih aktivitas untuk melihat rincian atau mengedit data.</p>
          </div>
          <label className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari aktivitas, ketua tim..."
            />
          </label>
        </div>

        <div className="table-wrap">
          <table className="activity-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Nama Ketua Tim</th>
                <th>Unit Kerja</th>
                <th>Satuan Kerja</th>
                <th>Judul Aktivitas</th>
                <th>Target Output</th>
                <th>Jumlah</th>
                <th>Status Pelaksanaan</th>
                <th>Progres Aktivitas</th>
                <th>Jumlah Target Output</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.map((a, index) => (
                <tr
                  key={a.id}
                  className={a.id === selectedId ? 'selected-row' : ''}
                  onClick={() => setSelectedId(a.id)}
                >
                  <td>{index + 1}</td>
                  <td className="cell-strong">{a.ketuaTim || '-'}</td>
                  <td>{a.unitKerja || '-'}</td>
                  <td>{a.satuanKerja || '-'}</td>
                  <td className="title-cell">{a.judulAktivitas || '-'}</td>
                  <td><span className="type-tag">{a.targetOutput}</span></td>
                  <td>{a.jumlah}</td>
                  <td><span className="status-tag">{a.statusPelaksanaan}</span></td>
                  <td>
                    <div className="table-progress">
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${a.progresAktivitas}%` }} />
                      </div>
                      <span>{a.progresAktivitas}%</span>
                    </div>
                  </td>
                  <td>{a.outputs.length}</td>
                  <td>
                    <button
                      className="button small"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditor(a)
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredActivities.length === 0 && (
                <tr>
                  <td colSpan={11} className="empty-state">
                    Tidak ada aktivitas yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Menampilkan {filteredActivities.length} dari {activities.length} aktivitas</span>
          <span>Geser tabel ke samping untuk melihat semua kolom.</span>
        </div>
      </section>

      {selectedActivity && (
        <section className="panel detail-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">RINCIAN AKTIVITAS</p>
              <h2>{selectedActivity.judulAktivitas || 'Aktivitas tanpa judul'}</h2>
              <p>
                {selectedActivity.ketuaTim || 'Ketua tim belum diisi'} ·{' '}
                {selectedActivity.unitKerja || 'Unit kerja belum diisi'}
              </p>
            </div>
            <button
              className="button primary"
              type="button"
              onClick={() => openEditor(selectedActivity)}
            >
              Edit Aktivitas
            </button>
          </div>

          <div className="detail-grid">
            <div>
              <span className="detail-label">Uraian Kemajuan</span>
              <p>{selectedActivity.uraianKemajuan || '-'}</p>
            </div>
            <div>
              <span className="detail-label">Kendala</span>
              <p>{selectedActivity.kendala || '-'}</p>
            </div>
            <div>
              <span className="detail-label">Mitigasi / Tindak Lanjut</span>
              <p>{selectedActivity.mitigasi || '-'}</p>
            </div>
            <div>
              <span className="detail-label">Data Dukung Progres</span>
              <p>{selectedActivity.dataDukungProgres || '-'}</p>
            </div>
          </div>

          <div className="output-heading">
            <div>
              <h3>Target dan Capaian Output</h3>
              <p>{selectedActivity.outputs.length} target output tercatat</p>
            </div>
            <button
              className="button"
              type="button"
              onClick={() => openEditor(selectedActivity)}
            >
              Kelola Output
            </button>
          </div>

          <div className="table-wrap">
            <table className="output-table">
              <thead>
                <tr>
                  <th>Jenis Output</th>
                  <th>Judul Output</th>
                  <th>Status</th>
                  <th>Jumlah Realisasi</th>
                  <th>Progres Capaian</th>
                  <th>Data Dukung Capaian</th>
                </tr>
              </thead>
              <tbody>
                {selectedActivity.outputs.map((o) => (
                  <tr key={o.id}>
                    <td>{o.jenis}</td>
                    <td className="cell-strong">{o.judul || '-'}</td>
                    <td><span className="status-tag">{o.status}</span></td>
                    <td>{o.jumlahRealisasi}</td>
                    <td>
                      <div className="table-progress">
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${o.progres}%` }} />
                        </div>
                        <span>{o.progres}%</span>
                      </div>
                    </td>
                    <td>{o.dataDukung || '-'}</td>
                  </tr>
                ))}
                {selectedActivity.outputs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-state">
                      Belum ada target output. Klik Kelola Output untuk menambahkannya.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {message && <p className="feedback" role="status">{message}</p>}

      {showForm && draft && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false)
              setDraft(null)
            }
          }}
        >
          <section
            className="editor-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-title"
          >
            <div className="editor-header">
              <div>
                <p className="eyebrow">FORMULIR DATA</p>
                <h2 id="editor-title">
                  {activities.some((a) => a.id === draft.id)
                    ? 'Edit Aktivitas'
                    : 'Tambah Aktivitas'}
                </h2>
                <p>Ubah informasi aktivitas dan target output.</p>
              </div>
              <button
                className="close-button"
                type="button"
                aria-label="Tutup formulir"
                onClick={() => {
                  setShowForm(false)
                  setDraft(null)
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveActivity}>
              <div className="form-section">
                <h3>Informasi Aktivitas</h3>
                <div className="form-grid">
                  <Field label="Nama Ketua Tim" value={draft.ketuaTim}
                    onChange={(v) => updateDraft('ketuaTim', v)} />
                  <Field label="Unit Kerja (Pusat Riset/Direktorat)" value={draft.unitKerja}
                    onChange={(v) => updateDraft('unitKerja', v)} />
                  <Field label="Satuan Kerja (Organisasi Riset/Deputi)" value={draft.satuanKerja}
                    onChange={(v) => updateDraft('satuanKerja', v)} />
                  <Field label="Judul Aktivitas" value={draft.judulAktivitas}
                    onChange={(v) => updateDraft('judulAktivitas', v)} />

                  <label className="field">
                    <span>Target Output Utama</span>
                    <select value={draft.targetOutput}
                      onChange={(e) => updateDraft('targetOutput', e.target.value)}>
                      {outputTypes.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </label>

                  <Field label="Jumlah Target" type="number" min={0}
                    value={draft.jumlah}
                    onChange={(v) => updateDraft('jumlah', Math.max(0, Number(v) || 0))} />

                  <label className="field">
                    <span>Status Pelaksanaan</span>
                    <select value={draft.statusPelaksanaan}
                      onChange={(e) => updateDraft('statusPelaksanaan', e.target.value)}>
                      {statuses.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </label>

                  <Field label="Progres Aktivitas (%)" type="number" min={0} max={100}
                    value={draft.progresAktivitas}
                    onChange={(v) => updateDraft('progresAktivitas',
                      Math.min(100, Math.max(0, Number(v) || 0)))} />

                  <Field label="Uraian Kemajuan Aktivitas" value={draft.uraianKemajuan}
                    multiline onChange={(v) => updateDraft('uraianKemajuan', v)} />
                  <Field label="Kendala yang Ditemui" value={draft.kendala}
                    multiline onChange={(v) => updateDraft('kendala', v)} />
                  <Field label="Mitigasi / Rencana Tindak Lanjut" value={draft.mitigasi}
                    multiline onChange={(v) => updateDraft('mitigasi', v)} />
                  <Field label="Data Dukung Progres Aktivitas" value={draft.dataDukungProgres}
                    multiline onChange={(v) => updateDraft('dataDukungProgres', v)} />
                </div>
              </div>

              <div className="form-section">
                <div className="output-heading editor-output-heading">
                  <div>
                    <h3>Target Output</h3>
                    <p>Tambahkan satu atau beberapa output aktivitas.</p>
                  </div>
                  <button className="button primary" type="button" onClick={addOutput}>
                    + Tambah Output
                  </button>
                </div>

                {draft.outputs.map((o, index) => (
                  <article className="output-editor" key={o.id}>
                    <div className="output-editor-title">
                      <strong>Output {index + 1}</strong>
                      <button className="text-button danger" type="button"
                        onClick={() => deleteOutput(o.id)}>
                        Hapus
                      </button>
                    </div>

                    <div className="form-grid">
                      <label className="field">
                        <span>Jenis Output</span>
                        <select value={o.jenis}
                          onChange={(e) => updateOutput(o.id, 'jenis', e.target.value)}>
                          {outputTypes.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </label>

                      <Field label="Judul Output" value={o.judul}
                        onChange={(v) => updateOutput(o.id, 'judul', v)} />

                      <label className="field">
                        <span>Status Output</span>
                        <select value={o.status}
                          onChange={(e) => updateOutput(o.id, 'status', e.target.value)}>
                          {statuses.map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </label>

                      <Field label="Jumlah Realisasi" type="number" min={0}
                        value={o.jumlahRealisasi}
                        onChange={(v) => updateOutput(o.id, 'jumlahRealisasi',
                          Math.max(0, Number(v) || 0))} />

                      <Field label="Progres Capaian (%)" type="number" min={0} max={100}
                        value={o.progres}
                        onChange={(v) => updateOutput(o.id, 'progres',
                          Math.min(100, Math.max(0, Number(v) || 0)))} />

                      <Field label="Data Dukung Capaian Output" value={o.dataDukung}
                        onChange={(v) => updateOutput(o.id, 'dataDukung', v)} />
                    </div>
                  </article>
                ))}

                {draft.outputs.length === 0 && (
                  <p className="empty-editor">
                    Belum ada target output. Klik Tambah Output untuk memulai.
                  </p>
                )}
              </div>

              <div className="editor-footer">
                {activities.some((a) => a.id === draft.id) && (
                  <button className="button danger-outline" type="button"
                    onClick={() => deleteActivity(draft.id)}>
                    Hapus Aktivitas
                  </button>
                )}
                <div className="footer-spacer" />
                <button className="button" type="button"
                  onClick={() => {
                    setShowForm(false)
                    setDraft(null)
                  }}>
                  Batal
                </button>
                <button className="button primary" type="submit">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

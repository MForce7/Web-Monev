import { WRAP } from './shared'

export default function HeaderBar({ isEditing, onEdit }: { isEditing: boolean; onEdit: () => void }) {
  return (
    <div
      className={`px-6 py-3 font-semibold text-lg flex items-center justify-between gap-3 text-white ${
        isEditing ? 'bg-amber-600' : 'bg-gov-700'
      }`}
    >
      <span className={`min-w-0 ${WRAP}`}>
        <i className={`fa-solid ${isEditing ? 'fa-pen-to-square' : 'fa-folder-open'} mr-2`} />
        {isEditing ? 'Edit Detail Aktivitas' : 'Detail Aktivitas & Progres Kegiatan'}
      </span>

      <div className="flex items-center gap-2 shrink-0 no-print">
        {isEditing ? (
          <span className="text-xs bg-amber-700 px-3 py-1 rounded-full text-amber-100">Mode Edit</span>
        ) : (
          <button
            type="button"
            onClick={onEdit}
            className="px-3 py-1 bg-gov-800 hover:bg-gov-900 border border-gov-500 rounded text-xs text-white transition flex items-center gap-1.5"
          >
            <i className="fa-solid fa-pen-to-square" /> Edit Detail
          </button>
        )}
      </div>
    </div>
  )
}
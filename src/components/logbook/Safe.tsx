import { Component, type ReactNode } from 'react'
import { FLAGS } from '../../lib/flags'

class Boundary extends Component<{ name: string; row?: boolean; children: ReactNode }, { err: boolean }> {
  state = { err: false }
  static getDerivedStateFromError() { return { err: true } }
  componentDidCatch(e: Error) { console.error(`[${this.props.name}]`, e) }

  render() {
    if (!this.state.err) return this.props.children
    const msg = `⚠ Komponen ${this.props.name} error (lihat console)`
    const cls = 'p-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded'
    return this.props.row ? <tr><td colSpan={2} className={cls}>{msg}</td></tr> : <div className={cls}>{msg}</div>
  }
}

/** Mati bila flag false; bila error, hanya bagian ini yang diganti kotak merah. `row` untuk komponen berisi <tr>. */
export default function Safe({ name, row, children }: { name: keyof typeof FLAGS; row?: boolean; children: ReactNode }) {
  return FLAGS[name] ? <Boundary name={name} row={row}>{children}</Boundary> : null
}
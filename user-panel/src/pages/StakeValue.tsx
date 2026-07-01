import { useState } from 'react'
import { toast } from 'react-toastify'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useAuth } from '../store/auth'
import { saveStakes } from '../services/reportsApi'

// Stake-value editor (Angular ButtonValueComponent): edit the quick-stake buttons
// (user.stakes), POST 'stakes', and update the user in the store. Validation
// messages preserved from the original.
export default function StakeValue() {
  useDocumentTitle('Stake Value')
  const user = useAuth((s) => s.user)
  const setUser = useAuth((s) => s.setUser)
  const initial = Array.isArray(user?.stakes) ? user.stakes.map(String) : []
  const [stakes, setStakes] = useState<string[]>(initial)
  const [saving, setSaving] = useState(false)

  const setAt = (i: number, v: string) => setStakes((s) => s.map((x, idx) => (idx === i ? v : x)))
  const add = () => setStakes((s) => [...s, ''])
  const remove = (i: number) => setStakes((s) => s.filter((_, idx) => idx !== i))

  const save = async () => {
    const list = stakes.filter((s) => s !== '')
    if (list.length > 10) return toast.error('Maximum stack button Five!')
    if (new Set(list).size !== list.length) return toast.error('Already exist..!! Please try another..')
    if (list.some((s) => !/^\d+$/.test(s))) return toast.error('Please be sure to use a valid number format')
    if (list.some((s) => parseInt(s, 10) < 1)) return toast.error('Stake must be greater than zero.')
    setSaving(true)
    try {
      await saveStakes(list)
      if (user) setUser({ ...user, stakes: list.map(Number) })
      setStakes(list)
    } catch {
      /* error toast handled by the interceptor */
    } finally {
      setSaving(false)
    }
  }

  return (
    <div id="wrapper">
      <div className="container dashboard_content py-3">
        <div className="col-lg-5 col-md-7 m-auto">
          <h5 className="mb-3">Edit Stake Buttons</h5>
          {stakes.map((s, i) => (
            <div className="input-group mb-2" key={i}>
              <input type="number" className="form-control" value={s} onChange={(e) => setAt(i, e.target.value)} />
              <button type="button" className="btn btn-outline-danger" onClick={() => remove(i)}>
                Remove
              </button>
            </div>
          ))}
          <div className="d-flex gap-2 mt-2">
            <button type="button" className="btn btn-outline-secondary" onClick={add}>
              Add
            </button>
            <button type="button" className="btn btn-success ms-auto" onClick={() => void save()} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import './App.css'
import api, { setAuthToken } from './api'
import { deriveKey, encryptJson, decryptJson } from './crypto'
import Generator from './components/Generator'
import CopyButton from './components/CopyButton'

function App() {
  const [token, setToken] = useState(null)
  const [kdfSalt, setKdfSalt] = useState(null)
  const [masterKey, setMasterKey] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [entries, setEntries] = useState([])
  const [query, setQuery] = useState('')
  const [newEntry, setNewEntry] = useState({ title: '', username: '', password: '', url: '', notes: '', tags: [], folder: '' })
  const [dark, setDark] = useState(() => {
    const v = localStorage.getItem('dark');
    return v === '1';
  })
  // 2FA removed per user request
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState({ derive: false, load: false })
  const filtered = useMemo(() => entries.filter(e => [e.title,e.username,e.url,e.notes,(e.tags||[]).join(' '), e.folder||''].join(' ').toLowerCase().includes(query.toLowerCase())), [entries, query])

  useEffect(() => {
    setAuthToken(token)
  }, [token])

  useEffect(() => {
    document.body.classList.toggle('dark', dark)
    localStorage.setItem('dark', dark ? '1' : '0')
  }, [dark])

  async function doSignup() {
    try {
      const r = await api.post('/api/auth/signup', { email, password })
      setToken(r.data.token); setKdfSalt(r.data.kdfSalt)
    } catch (e) {
      alert(e?.response?.data?.error || 'Signup failed')
    }
  }
  async function doLogin() {
    try {
      const r = await api.post('/api/auth/login', { email, password })
      setToken(r.data.token); setKdfSalt(r.data.kdfSalt)
    } catch (e) {
      alert(e?.response?.data?.error || 'Login failed')
    }
  }
  async function derive() {
    if (!kdfSalt) { alert('You must be logged in first.'); return }
    if (!password) { alert('Enter your account password to derive the key.'); return }
    try {
      setBusy((b)=>({ ...b, derive: true }))
      const k = await deriveKey(password, kdfSalt)
      setMasterKey(k)
      setStatus('Key derived. You can now Load Vault.')
    } catch (e) {
      alert('Failed to derive key')
    } finally {
      setBusy((b)=>({ ...b, derive: false }))
    }
  }
  async function loadVault() {
    if (!masterKey) { alert('Derive the key first.'); return }
    try {
      setBusy((b)=>({ ...b, load: true }))
      const r = await api.get('/api/vault')
      const dec = await Promise.all(r.data.map(async (row) => {
        const data = await decryptJson(masterKey, { ciphertext: row.ciphertext, iv: row.iv, tag: row.tag })
        return { id: row.id, ...data }
      }))
      setEntries(dec)
      setStatus(`Loaded ${dec.length} item(s).`)
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to load/decrypt vault')
    } finally {
      setBusy((b)=>({ ...b, load: false }))
    }
  }
  async function saveEntry() {
    if (!masterKey) return
    const payload = await encryptJson(masterKey, newEntry)
    const r = await api.post('/api/vault', payload)
    setEntries([{ id: r.data.id, ...newEntry }, ...entries])
    setNewEntry({ title: '', username: '', password: '', url: '', notes: '', tags: [], folder: '' })
  }
  async function updateEntry(e) {
    if (!masterKey || !e.id) return
    const payload = await encryptJson(masterKey, e)
    await api.put(`/api/vault/${e.id}`, payload)
    setEntries(entries.map(x => x.id === e.id ? e : x))
  }
  async function deleteEntry(id) {
    if (!id) return
    await api.delete(`/api/vault/${id}`)
    setEntries(entries.filter(x => x.id !== id))
  }

  // 2FA removed

  async function exportEncrypted() {
    const r = await api.get('/api/vault')
    const blob = new Blob([JSON.stringify(r.data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vault_encrypted.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
  async function importEncrypted(ev) {
    const file = ev.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const items = JSON.parse(text)
    for (const item of items) {
      await api.post('/api/vault', { ciphertext: item.ciphertext, iv: item.iv, tag: item.tag, tags: item.tags||[], folder: item.folder||'' })
    }
    await loadVault()
    ev.target.value = ''
  }

  function logout() {
    setToken(null); setKdfSalt(null); setMasterKey(null); setEntries([]); setStatus('');
  }

  return (
    <div className={token ? "container space-y-6" : "page"}>
      {!token && (
        <div className="auth-card">
          <div className="stack">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="logo-title">Password Vault</div>
              <button className="btn secondary" onClick={()=>setDark(!dark)}>{dark ? 'Light' : 'Dark'}</button>
            </div>
            <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
            <input type="password" className="input" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
            <button className="btn primary" onClick={doLogin}>Log in</button>
            <button className="btn secondary" onClick={doSignup}>Sign up</button>
          </div>
        </div>
      )}

      {token && (
        <div className="space-y-3 p-3 border rounded card" style={{ maxWidth: 860, margin: '0 auto' }}>
          <div className="flex items-center justify-between">
            <div className="logo-title">Password Vault</div>
            <div className="flex gap-2">
              <button className="btn secondary" onClick={()=>setDark(!dark)}>{dark ? 'Light' : 'Dark'}</button>
              <button className="btn danger" onClick={logout}>Logout</button>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <button className="btn primary" onClick={derive} disabled={busy.derive}>{busy.derive ? 'Deriving…' : 'Derive Key'}</button>
            <button className="btn success" onClick={loadVault} disabled={busy.load}>{busy.load ? 'Loading…' : 'Load Vault'}</button>
            <button className="btn secondary" onClick={exportEncrypted}>Export</button>
            <label className="btn secondary" style={{ cursor: 'pointer' }}>
              Import
              <input type="file" accept="application/json" className="hidden" onChange={importEncrypted} />
            </label>
          </div>
          <div className="grid gap-2">
            <input className="input" placeholder="Search" value={query} onChange={e=>setQuery(e.target.value)} />
          </div>
          {status && <div className="muted">{status}</div>}
          {/* 2FA controls removed */}
        </div>
      )}

      {token && (
        <div className="p-3 border rounded space-y-3 card" style={{ maxWidth: 860, margin: '0 auto' }}>
          <h2 className="font-semibold">New Entry</h2>
          <Generator onGenerate={(pwd)=>setNewEntry({ ...newEntry, password: pwd })} />
          <div className="grid gap-2">
            <input className="input" placeholder="Title" value={newEntry.title} onChange={e=>setNewEntry({...newEntry, title: e.target.value})} />
            <input className="input" placeholder="Username" value={newEntry.username} onChange={e=>setNewEntry({...newEntry, username: e.target.value})} />
            <div className="flex gap-2">
              <input className="input" placeholder="Password" value={newEntry.password} onChange={e=>setNewEntry({...newEntry, password: e.target.value})} />
              <CopyButton text={newEntry.password} />
            </div>
            <input className="input" placeholder="URL" value={newEntry.url} onChange={e=>setNewEntry({...newEntry, url: e.target.value})} />
            <textarea className="input" placeholder="Notes" value={newEntry.notes} onChange={e=>setNewEntry({...newEntry, notes: e.target.value})} />
            <input className="input" placeholder="Folder" value={newEntry.folder} onChange={e=>setNewEntry({...newEntry, folder: e.target.value})} />
            <input className="input" placeholder="tags (comma separated)" value={(newEntry.tags||[]).join(', ')} onChange={e=>setNewEntry({...newEntry, tags: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})} />
            <button className="btn primary" onClick={saveEntry}>Save</button>
          </div>
        </div>
      )}

      {token && (
        <div className="space-y-2" style={{ maxWidth: 860, margin: '0 auto' }}>
          {filtered.map(e => (
            <div key={e.id} className="p-3 border rounded">
              <div className="font-medium">{e.title}</div>
              <div className="text-sm muted">{e.username} · {e.url} {e.folder && '· ' + e.folder} {(e.tags||[]).length ? '· ' + (e.tags||[]).join(' , ') : ''}</div>
              <div className="flex gap-2 items-center mt-1">
                <input className="input" value={e.password} onChange={(ev)=>setEntries(entries.map(x=>x.id===e.id?{...x, password: ev.target.value}:x))} />
                <CopyButton text={e.password} />
                <button className="btn warn" onClick={()=>updateEntry(e)}>Update</button>
                <button className="btn danger" onClick={()=>deleteEntry(e.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App



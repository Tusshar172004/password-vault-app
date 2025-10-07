import { useMemo, useState } from 'react';

const LOOK_ALIKES = new Set(['l','1','I','O','0','o']);

function buildCharset(opts) {
  let chars = '';
  if (opts.lower) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (opts.upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (opts.numbers) chars += '0123456789';
  if (opts.symbols) chars += '!@#$%^&*()-_=+[]{};:,.<>/?';
  if (opts.excludeLookalikes) chars = Array.from(chars).filter(c => !LOOK_ALIKES.has(c)).join('');
  return chars;
}

export default function Generator({ onGenerate }) {
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState({ upper: true, lower: true, numbers: true, symbols: true, excludeLookalikes: true });
  const charset = useMemo(() => buildCharset(opts), [opts]);
  const [preview, setPreview] = useState('');

  function generate() {
    const chars = charset || 'abcdefghijklmnopqrstuvwxyz';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    let out = '';
    for (let i = 0; i < length; i++) out += chars[array[i] % chars.length];
    setPreview(out);
    onGenerate(out);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input type="range" min={8} max={64} value={length} onChange={(e) => setLength(parseInt(e.target.value))} />
        <span>{length}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {['upper','lower','numbers','symbols','excludeLookalikes'].map((k) => (
          <label key={k} className="flex items-center gap-2">
            <input type="checkbox" checked={opts[k]} onChange={(e) => setOpts({ ...opts, [k]: e.target.checked })} />
            <span>{k}</span>
          </label>
        ))}
      </div>
      <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={generate}>Generate</button>
      {preview && <div className="mono break-all p-2 preview">{preview}</div>}
    </div>
  );
}



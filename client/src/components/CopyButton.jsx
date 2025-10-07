import { useEffect, useState } from 'react';

export default function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(async () => {
      setCopied(false);
      try { await navigator.clipboard.writeText(''); } catch {}
    }, 15000);
  }

  useEffect(() => () => setCopied(false), []);

  return (
    <button className={`px-2 py-1 rounded ${copied ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`} onClick={copy}>
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}



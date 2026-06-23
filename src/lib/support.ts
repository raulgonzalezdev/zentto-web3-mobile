import { Preferences } from '@capacitor/preferences';

// Chat de soporte AI provisto por Zentto Notify (mismo backend que el ERP).
const BASE = (import.meta as any).env?.VITE_SUPPORT_URL ?? 'https://notify.zentto.net';
const APP_CONTEXT = 'zentto-web3';

export interface SupportMsg {
  role: 'user' | 'assistant';
  text: string;
  sources?: { title: string; url: string }[];
  ts: number;
}

async function visitorId(): Promise<string> {
  const { value } = await Preferences.get({ key: 'zt_visitor' });
  if (value) return value;
  const id = `m-${Math.random().toString(36).slice(2)}-${Date.now()}`;
  await Preferences.set({ key: 'zt_visitor', value: id });
  return id;
}

async function getConv(): Promise<string | undefined> {
  return (await Preferences.get({ key: 'zt_support_conv' })).value || undefined;
}

export async function loadHistory(): Promise<SupportMsg[]> {
  const { value } = await Preferences.get({ key: 'zt_support_hist' });
  try {
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

export async function saveHistory(msgs: SupportMsg[]): Promise<void> {
  await Preferences.set({ key: 'zt_support_hist', value: JSON.stringify(msgs.slice(-50)) });
}

async function reqBody(message: string) {
  return JSON.stringify({
    sessionId: await visitorId(),
    conversationId: await getConv(),
    message,
    locale: 'es',
    visitorType: 'mobile-app',
    appContext: APP_CONTEXT,
    pageUrl: location.href,
    section: location.hash,
  });
}

// Respuesta no-streaming: fallback robusto si el WebView no entrega el stream.
async function fallbackSupport(
  message: string,
  onToken: (chunk: string) => void,
): Promise<{ sources?: { title: string; url: string }[] }> {
  const res = await fetch(`${BASE}/api/support/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: await reqBody(message),
  });
  const d = await res.json().catch(() => ({} as any));
  if (d.conversationId) await Preferences.set({ key: 'zt_support_conv', value: d.conversationId });
  if (d.answer) onToken(d.answer);
  return { sources: Array.isArray(d.sources) ? d.sources : undefined };
}

export async function streamSupport(
  message: string,
  onToken: (chunk: string) => void,
): Promise<{ sources?: { title: string; url: string }[] }> {
  let gotToken = false;
  let sources: { title: string; url: string }[] | undefined;
  try {
    const res = await fetch(`${BASE}/api/support/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: await reqBody(message),
    });
    if (res.ok && res.body) {
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() || '';
        for (const p of parts) {
          const ev = /event: (.+)/.exec(p)?.[1];
          const data = /data: (.+)/.exec(p)?.[1];
          if (!data) continue;
          try {
            const j = JSON.parse(data);
            if (ev === 'token' && j.text) {
              onToken(j.text);
              gotToken = true;
            } else if (ev === 'meta' && j.conversationId) {
              await Preferences.set({ key: 'zt_support_conv', value: j.conversationId });
            } else if (ev === 'done') {
              if (j.conversationId) await Preferences.set({ key: 'zt_support_conv', value: j.conversationId });
              sources = Array.isArray(j.sources) ? j.sources : undefined;
            }
          } catch {
            /* línea parcial */
          }
        }
      }
    }
  } catch {
    /* el stream falló → fallback */
  }
  if (!gotToken) return fallbackSupport(message, onToken);
  return { sources };
}

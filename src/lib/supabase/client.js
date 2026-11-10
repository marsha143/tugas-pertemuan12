import { createBrowserClient } from '@supabase/ssr';

let supabaseClient;

async function fetchWithTimeout(input, init = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(new Error('Permintaan ke server terlalu lama.')), 15000);
  if (init.signal) {
    if (init.signal.aborted) controller.abort(init.signal.reason);
    else init.signal.addEventListener('abort', () => controller.abort(init.signal.reason), { once: true });
  }
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function createClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      { global: { fetch: fetchWithTimeout } },
    );
  }
  return supabaseClient;
}

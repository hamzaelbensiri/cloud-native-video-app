export function getHttpErrorMessage(err: any): string {
  // Axios network error or CORS/preflight failure -> no response object
  if (err?.code === 'ERR_NETWORK' || (!err?.response && err?.message)) {
    //  CORS blocked request or gateway dropped large payload
    return `Network/CORS error: ${err.message}. Check CORS and request size limits.`;
  }

  const data = err?.response?.data;
  if (!data) return err?.message || 'Network error';

  // FastAPI detail
  if (typeof data.detail === 'string') return data.detail;

  // Validation errors array
  if (Array.isArray(data.detail)) {
    const first = data.detail[0];
    if (first?.msg) return first.msg;
    try { return JSON.stringify(data.detail); } catch {}
  }

  if (typeof data === 'string') return data;
  try { return JSON.stringify(data); } catch { return 'Request failed'; }
}

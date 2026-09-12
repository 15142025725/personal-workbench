export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (res.status === 204) return undefined as T
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(data.error || 'Request failed')
  }
  return res.json()
}

export const apiGet = <T>(url: string) => api<T>(url)
export const apiPost = <T>(url: string, body?: any) =>
  api<T>(url, { method: 'POST', body: JSON.stringify(body) })
export const apiPut = <T>(url: string, body?: any) =>
  api<T>(url, { method: 'PUT', body: JSON.stringify(body) })
export const apiPatch = <T>(url: string, body?: any) =>
  api<T>(url, { method: 'PATCH', body: JSON.stringify(body) })
export const apiDelete = <T>(url: string) => api<T>(url, { method: 'DELETE' })

/**
 * HTTP 客户端（微信云托管版）。
 * 走 HTTPS 直连（wx.request / fetch），apiBaseUrl 为云托管公网域名。
 * 信封解包：code!=='0' 抛错。
 */

export interface ApiClientError extends Error {
  code: string
  status?: number
  details?: unknown
  requestId?: string
  serverTime?: number
}

export interface HttpClientConfig {
  apiBaseUrl?: string
  timeoutMs?: number
  requestHeaders?: Record<string, string>
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'


export class HttpClient {
  private baseUrl: string
  private timeoutMs: number
  private headers: Record<string, string>

  constructor(config: HttpClientConfig = {}) {
    this.baseUrl = String(config.apiBaseUrl || '').replace(/\/+$/, '')
    this.timeoutMs = config.timeoutMs || 10000
    this.headers = config.requestHeaders || {}
  }

  async request<T = unknown>(path: string, options: { method?: HttpMethod; body?: unknown } = {}): Promise<T> {
    const method = options.method || 'GET'
    const raw = await this.transport(path, method, options.body)
    return this.unwrap<T>(raw)
  }

  get<T>(path: string, query: Record<string, unknown> = {}): Promise<T> {
    const suffix = this.buildQuery(query)
    return this.request<T>(`${path}${suffix}`, { method: 'GET' })
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body })
  }

  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body })
  }

  private buildQuery(query: Record<string, unknown>): string {
    const parts: string[] = []
    Object.entries(query || {}).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return
      const text = typeof v === 'object' ? JSON.stringify(v) : String(v)
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(text)}`)
    })
    return parts.length ? `?${parts.join('&')}` : ''
  }

  private unwrap<T>(raw: any): T {
    const body = raw?.body && typeof raw.body === 'object' ? raw.body : null
    const ok = raw.status >= 200 && raw.status < 300
    if (!ok) {
      const err = new Error(body?.message || `HTTP ${raw.status}`) as ApiClientError
      err.code = body?.code || `HTTP_${raw.status}`
      err.status = raw.status
      throw err
    }
    if (body && 'code' in body) {
      if (String(body.code) !== '0') {
        const err = new Error(body.message || '服务返回失败') as ApiClientError
        err.code = body.code
        throw err
      }
      return body.data as T
    }
    return (body || raw.body) as T
  }

  private async transport(path: string, method: HttpMethod, body?: unknown): Promise<any> {
    if (typeof fetch === 'function') return this.transportFetch(path, method, body)
    return this.transportWx(path, method, body)
  }

  private async transportFetch(path: string, method: HttpMethod, body: unknown): Promise<any> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method, signal: controller.signal,
        headers: { 'Content-Type': 'application/json', ...this.headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      const payload = await res.json().catch(() => null)
      const headers: Record<string, string> = {}
      res.headers.forEach((v: string, k: string) => { headers[k.toLowerCase()] = v })
      return { status: res.status, headers, body: payload }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        const err = new Error('请求超时') as ApiClientError
        err.code = 'REQUEST_TIMEOUT'
        throw err
      }
      const err = new Error('网络请求失败') as ApiClientError
      err.code = 'NETWORK_ERROR'
      throw err
    } finally {
      clearTimeout(timer)
    }
  }

  private transportWx(path: string, method: HttpMethod, body: unknown): Promise<any> {
    return new Promise((resolve, reject) => {
      let settled = false
      const timer = setTimeout(() => {
        if (settled) return
        settled = true
        const err = new Error('请求超时') as ApiClientError
        err.code = 'REQUEST_TIMEOUT'
        reject(err)
      }, this.timeoutMs)
      wx.request({
        url: `${this.baseUrl}${path}`,
        method: method as never,
        header: { 'Content-Type': 'application/json', ...this.headers },
        data: body as never,
        success: (res) => {
          if (settled) return
          settled = true
          clearTimeout(timer)
          const headers: Record<string, string> = {}
          Object.entries(res.header || {}).forEach(([k, v]) => { headers[k.toLowerCase()] = String(v) })
          resolve({ status: res.statusCode, headers, body: res.data })
        },
        fail: () => {
          if (settled) return
          settled = true
          clearTimeout(timer)
          const err = new Error('网络请求失败') as ApiClientError
          err.code = 'NETWORK_ERROR'
          reject(err)
        },
      })
    })
  }
}

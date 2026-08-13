/**
 * 匿名安装身份（X-Install-Identity）生成与持久化。
 *
 * 契约口径：me 域端点（/profile、/profile/preferences、/favorites/*）通过
 * X-Install-Identity 请求头识别安装身份（≤64 字符）。要求：
 * - 同一安装跨启动稳定（storage 已有则复用，绝不重复生成）
 * - 不引入新依赖：优先 wx.getRandomValues（真随机 UUIDv4），不可用时退化为时间戳+随机
 */

export const IDENTITY_STORAGE_KEY = 'awakeaglow:v6:install-identity'

/** 开发占位值（config/app-config.ts 初始值），被稳定身份覆盖 */
export const IDENTITY_PLACEHOLDER = 'anonymous-v6-dev'

function canUseStorage(): boolean {
  return typeof wx !== 'undefined' && typeof wx.getStorageSync === 'function' && typeof wx.setStorageSync === 'function'
}

/** 字节序列化为 UUIDv4 文本（第 7 字节置版本 4，第 9 字节置变体 10xx） */
export function bytesToUuidV4(bytes: Uint8Array): string {
  const b = bytes.slice()
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

/** wx.getRandomValues 不可用时的兜底：时间戳低位 + Math.random 填充（格式同 UUIDv4） */
export function fallbackUuid(): string {
  const bytes = new Uint8Array(16)
  let now = Date.now()
  // 前 6 字节放时间戳（毫秒，小端），保证不同时刻生成的身份显著区分
  for (let i = 0; i < 6; i++) {
    bytes[i] = now % 256
    now = Math.floor(now / 256)
  }
  for (let i = 6; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256)
  }
  return bytesToUuidV4(bytes)
}

/** 读取已持久化的稳定身份；不存在或非法返回 null */
export function readStoredIdentity(): string | null {
  if (!canUseStorage()) return null
  try {
    const value = wx.getStorageSync(IDENTITY_STORAGE_KEY)
    if (typeof value === 'string' && value.length >= 16 && value.length <= 64) return value
    return null
  } catch {
    return null
  }
}

/** 持久化稳定身份（写入失败不抛出，下次启动会重新生成） */
export function storeIdentity(identity: string): void {
  if (!canUseStorage()) return
  try {
    wx.setStorageSync(IDENTITY_STORAGE_KEY, identity)
  } catch {
    // 隐私模式/容量不足：本次会话仍生效，仅跨启动稳定性降级
  }
}

/**
 * 初始化安装身份并返回生效值：
 * 1. storage 已有 → 直接复用（跨启动稳定）
 * 2. wx.getRandomValues 可用 → 异步生成真随机 UUIDv4，落盘后回调生效
 * 3. 兜底 → 时间戳+随机同步生成，落盘后立即生效
 *
 * apply(identity) 由调用方注入请求头（覆盖开发占位值）。
 * 返回值：同步可得的身份（走异步分支时先返回兜底占位，真值经 apply 回调生效）。
 */
export function initInstallIdentity(apply: (identity: string) => void): string {
  const stored = readStoredIdentity()
  if (stored) {
    apply(stored)
    return stored
  }
  // 先以兜底值生效，避免首个请求无身份；真随机值生成后覆盖
  const fallback = fallbackUuid()
  apply(fallback)
  if (typeof wx !== 'undefined' && typeof wx.getRandomValues === 'function') {
    try {
      wx.getRandomValues({
        length: 16,
        success: (res: { randomValues: ArrayBuffer }) => {
          const bytes = new Uint8Array(res.randomValues)
          if (bytes.length < 16) return
          const identity = bytesToUuidV4(bytes)
          storeIdentity(identity)
          apply(identity)
        },
        fail: () => {
          storeIdentity(fallback)
        },
      })
      return fallback
    } catch {
      // API 异常走兜底落盘
    }
  }
  storeIdentity(fallback)
  return fallback
}

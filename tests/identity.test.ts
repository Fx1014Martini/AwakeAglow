/**
 * lib/identity.ts 单测：匿名安装身份生成与持久化。
 * 覆盖 bytesToUuidV4 格式、fallbackUuid、storage 读写、initInstallIdentity 复用/生成路径。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  bytesToUuidV4,
  fallbackUuid,
  readStoredIdentity,
  storeIdentity,
  initInstallIdentity,
} from '../lib/identity'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('identity / bytesToUuidV4', () => {
  it('生成合法 UUIDv4 格式', () => {
    const uuid = bytesToUuidV4(new Uint8Array(16))
    expect(uuid).toMatch(UUID_RE)
  })
  it('版本位固定为 4', () => {
    const uuid = bytesToUuidV4(new Uint8Array(16).fill(0))
    expect(uuid[14]).toBe('4')
  })
  it('变体位为 8/9/a/b', () => {
    const uuid = bytesToUuidV4(new Uint8Array(16).fill(0xff))
    expect(uuid[19]).toMatch(/[89ab]/)
  })
})

describe('identity / fallbackUuid', () => {
  it('生成合法 UUIDv4 格式', () => {
    expect(fallbackUuid()).toMatch(UUID_RE)
  })
  it('不同时刻生成不同值（概率性）', () => {
    const a = fallbackUuid()
    const b = fallbackUuid()
    expect(a).not.toBe(b)
  })
})

describe('identity / readStoredIdentity', () => {
  beforeEach(() => {
    ;(globalThis as any).wx = { getStorageSync: vi.fn(() => ''), setStorageSync: vi.fn() }
  })
  it('storage 有合法值时返回', () => {
    ;(globalThis as any).wx.getStorageSync = vi.fn(() => 'existing-id-1234567890ab')
    expect(readStoredIdentity()).toBe('existing-id-1234567890ab')
  })
  it('storage 为空返回 null', () => {
    ;(globalThis as any).wx.getStorageSync = vi.fn(() => '')
    expect(readStoredIdentity()).toBeNull()
  })
  it('值过短（<16）返回 null', () => {
    ;(globalThis as any).wx.getStorageSync = vi.fn(() => 'short')
    expect(readStoredIdentity()).toBeNull()
  })
  it('wx 不可用返回 null', () => {
    ;(globalThis as any).wx = undefined
    expect(readStoredIdentity()).toBeNull()
  })
})

describe('identity / storeIdentity', () => {
  beforeEach(() => {
    ;(globalThis as any).wx = { getStorageSync: vi.fn(() => ''), setStorageSync: vi.fn() }
  })
  it('调用 setStorageSync 持久化', () => {
    storeIdentity('stable-id-1234567890ab')
    expect((globalThis as any).wx.setStorageSync).toHaveBeenCalledWith(
      'awakeaglow:v6:install-identity',
      'stable-id-1234567890ab',
    )
  })
  it('wx 不可用时不抛错', () => {
    ;(globalThis as any).wx = undefined
    expect(() => storeIdentity('x'.repeat(20))).not.toThrow()
  })
})

describe('identity / initInstallIdentity', () => {
  beforeEach(() => {
    ;(globalThis as any).wx = {}
  })
  it('storage 已有值时复用并 apply', () => {
    ;(globalThis as any).wx.getStorageSync = vi.fn(() => 'stored-identity-123456')
    ;(globalThis as any).wx.setStorageSync = vi.fn()
    const apply = vi.fn()
    const result = initInstallIdentity(apply)
    expect(result).toBe('stored-identity-123456')
    expect(apply).toHaveBeenCalledWith('stored-identity-123456')
  })
  it('storage 无值时生成兜底值并 apply', () => {
    ;(globalThis as any).wx.getStorageSync = vi.fn(() => '')
    ;(globalThis as any).wx.setStorageSync = vi.fn()
    const apply = vi.fn()
    const result = initInstallIdentity(apply)
    expect(result).toMatch(UUID_RE)
    expect(apply).toHaveBeenCalledWith(result)
  })
  it('wx.getRandomValues 可用时异步生成真随机值', () => {
    ;(globalThis as any).wx.getStorageSync = vi.fn(() => '')
    ;(globalThis as any).wx.setStorageSync = vi.fn()
    ;(globalThis as any).wx.getRandomValues = vi.fn((opts: { length: number; success: (res: { randomValues: ArrayBuffer }) => void }) => {
      opts.success({ randomValues: new ArrayBuffer(opts.length) })
    })
    const apply = vi.fn()
    const result = initInstallIdentity(apply)
    expect(result).toMatch(UUID_RE) // 先返回兜底值
    // 异步分支成功后会 apply 真随机值
    expect(apply).toHaveBeenCalledWith(expect.stringMatching(UUID_RE))
  })
})

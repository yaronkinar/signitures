import { describe, expect, it } from 'vitest'
import {
  tenantPresetsPath,
  upsertPresetEntry,
  removePresetEntry,
  MAX_TENANT_PRESETS,
  type TenantPresetsFile,
  type TenantPresetEntry
} from './tenantPresetBlobShared'

const makeEntry = (id: string, name: string): TenantPresetEntry => ({
  id,
  name,
  values: { accentColor: '#ff0000' },
  createdAt: 1000
})

const emptyFile = (): TenantPresetsFile => ({
  version: 1,
  defaultPresetId: null,
  entries: []
})

describe('tenantPresetsPath', () => {
  it('builds the correct blob path', () => {
    expect(tenantPresetsPath('domain:example.com')).toBe(
      'presets/tenants/domain:example.com/presets.json'
    )
  })
})

describe('upsertPresetEntry', () => {
  it('adds a new entry', () => {
    const file = emptyFile()
    const entry = makeEntry('id-1', 'My Preset')
    const result = upsertPresetEntry(file, entry)
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].id).toBe('id-1')
  })

  it('overwrites an existing entry by id', () => {
    const entry = makeEntry('id-1', 'Old Name')
    const file: TenantPresetsFile = { version: 1, defaultPresetId: null, entries: [entry] }
    const updated = { ...entry, name: 'New Name' }
    const result = upsertPresetEntry(file, updated)
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].name).toBe('New Name')
  })

  it('throws TOO_MANY when at the limit', () => {
    const entries = Array.from({ length: MAX_TENANT_PRESETS }, (_, i) =>
      makeEntry(`id-${i}`, `Preset ${i}`)
    )
    const file: TenantPresetsFile = { version: 1, defaultPresetId: null, entries }
    expect(() => upsertPresetEntry(file, makeEntry('new-id', 'Extra'))).toThrow('TOO_MANY')
  })

  it('does NOT throw when overwriting an existing entry at the limit', () => {
    const entries = Array.from({ length: MAX_TENANT_PRESETS }, (_, i) =>
      makeEntry(`id-${i}`, `Preset ${i}`)
    )
    const file: TenantPresetsFile = { version: 1, defaultPresetId: null, entries }
    const updated = { ...entries[0], name: 'Renamed' }
    expect(() => upsertPresetEntry(file, updated)).not.toThrow()
  })
})

describe('removePresetEntry', () => {
  it('removes the matching entry', () => {
    const entry = makeEntry('id-1', 'My Preset')
    const file: TenantPresetsFile = { version: 1, defaultPresetId: 'id-1', entries: [entry] }
    const result = removePresetEntry(file, 'id-1')
    expect(result.entries).toHaveLength(0)
    expect(result.defaultPresetId).toBeNull()
  })

  it('clears defaultPresetId when the default entry is removed', () => {
    const e1 = makeEntry('id-1', 'A')
    const e2 = makeEntry('id-2', 'B')
    const file: TenantPresetsFile = { version: 1, defaultPresetId: 'id-1', entries: [e1, e2] }
    const result = removePresetEntry(file, 'id-1')
    expect(result.defaultPresetId).toBeNull()
    expect(result.entries).toHaveLength(1)
  })

  it('keeps defaultPresetId when a non-default entry is removed', () => {
    const e1 = makeEntry('id-1', 'A')
    const e2 = makeEntry('id-2', 'B')
    const file: TenantPresetsFile = { version: 1, defaultPresetId: 'id-1', entries: [e1, e2] }
    const result = removePresetEntry(file, 'id-2')
    expect(result.defaultPresetId).toBe('id-1')
  })
})

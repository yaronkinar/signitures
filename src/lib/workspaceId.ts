const WORKSPACE_ID_KEY = 'signitures-workspace-id'

const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

export const getWorkspaceId = (): string => {
  try {
    const existing = localStorage.getItem(WORKSPACE_ID_KEY)?.trim()
    if (existing && isUuid(existing)) {
      return existing
    }

    const created = crypto.randomUUID()
    localStorage.setItem(WORKSPACE_ID_KEY, created)
    return created
  } catch {
    return crypto.randomUUID()
  }
}

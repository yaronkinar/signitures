export const sanitizeFileName = (value: string, fallback = 'signature'): string => {
  const cleaned = value
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return cleaned || fallback
}

export const uniqueFileName = (base: string, used: Set<string>): string => {
  let name = base
  let index = 2
  while (used.has(name.toLowerCase())) {
    name = `${base}-${index}`
    index += 1
  }
  used.add(name.toLowerCase())
  return name
}

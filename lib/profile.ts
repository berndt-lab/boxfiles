function decodeTag(tag: string) {
  try {
    return decodeURIComponent(tag).trim()
  } catch {
    return tag.trim()
  }
}

export function displayTag(tag: string) {
  return decodeTag(tag).slice(0, 40)
}

/** Built-in vendor suggestions (alphabetical). Users get their own saved list in profiles.ingredient_vendors */
export const DEFAULT_INGREDIENT_VENDORS = [
  'Costco',
  'Hobby Lobby',
  'Michaels',
  "Sam's Club",
  'Walmart',
  'Webstaurant',
]

export function getPresetVendorsFromProfile(profile) {
  const v = profile?.ingredient_vendors
  if (v == null) return [...DEFAULT_INGREDIENT_VENDORS]
  if (Array.isArray(v)) {
    return v.map((s) => String(s).trim()).filter(Boolean)
  }
  return [...DEFAULT_INGREDIENT_VENDORS]
}

export function sortVendorNames(names) {
  return [...names].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  )
}

/** Case-insensitive unique, trim, then sort */
export function dedupeVendorList(names) {
  const seen = new Set()
  const out = []
  for (const raw of names) {
    const t = String(raw).trim()
    if (!t) continue
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
  }
  return sortVendorNames(out)
}

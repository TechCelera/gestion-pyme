/**
 * Sanitizes a search string for use in PostgreSQL ILIKE queries.
 * Escapes special wildcard characters (% and _) and trims whitespace.
 *
 * @param input - The raw search string from user input
 * @returns Sanitized string safe for ILIKE, or empty string if input is empty
 */
export function sanitizeSearch(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  const trimmed = input.trim()

  if (trimmed === '') {
    return ''
  }

  // Escape PostgreSQL ILIKE wildcard characters
  // % matches any sequence of characters, _ matches any single character
  return trimmed
    .replace(/\\/g, '\\\\')  // Escape backslash first
    .replace(/%/g, '\\%')     // Escape percent
    .replace(/_/g, '\\_')     // Escape underscore
}
/** Catalog titles keep their stored punctuation. The UI prints a comma. */
export function displayTitle(name: string): string {
  return name.replace(/\s*[\u2014\u2013]\s*/g, ", ");
}

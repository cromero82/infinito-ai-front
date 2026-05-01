/** Fragmento de texto libre (p. ej. búsqueda) seguro para líneas de actividad. */
export function sanitizeActividadTexto(text: string, max = 100): string {
  const t = text.replace(/\r|\n/g, ' ').replace(/\s+/g, ' ').trim();
  if (t.length <= max) {
    return t;
  }
  return `${t.slice(0, max)}…`;
}

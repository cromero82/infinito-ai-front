export interface LogPlainExportRow {
  fechaHora: string;
  nivel: string;
  mensaje: string;
  otrosCampos: string;
}

export function buildLogsPlainTextDocument(
  title: string,
  rows: LogPlainExportRow[]
): string {
  const gen = new Date().toLocaleString('es-CO', {
    dateStyle: 'full',
    timeStyle: 'medium'
  });
  const lines: string[] = [
    `# ${title}`,
    `# Generado: ${gen}`,
    `# Registros: ${rows.length}`,
    ''
  ];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    lines.push(`--- registro ${i + 1} ---`);
    lines.push(`Fecha/hora: ${r.fechaHora}`);
    lines.push(`Nivel: ${r.nivel}`);
    lines.push('Mensaje:');
    lines.push(r.mensaje);
    lines.push('Otros campos:');
    lines.push(r.otrosCampos);
    lines.push('');
  }
  return lines.join('\n');
}

function safeFilePart(base: string): string {
  return base.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'logs';
}

export function downloadPlainLogFile(content: string, filenameBase: string): void {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
  const name = `${safeFilePart(filenameBase)}-${stamp}.log`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

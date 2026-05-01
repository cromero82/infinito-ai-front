/**
 * Exporta filas de logs a .xlsx en el navegador (ExcelJS, import dinámico).
 * Columnas en formato texto (@) para reducir riesgo de interpretación como fórmula al abrir en Excel.
 */

export interface LogSpreadsheetRow {
  fechaHora: string;
  nivel: string;
  mensaje: string;
  otrosCampos: string;
}

function safeFilenamePart(base: string): string {
  return base.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'logs';
}

function timestampForFile(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
}

export async function downloadLogsAsXlsx(
  rows: LogSpreadsheetRow[],
  options: { filenameBase: string; sheetName: string }
): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(options.sheetName.slice(0, 31), {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  ws.columns = [
    { header: 'Fecha / hora', key: 'fechaHora', width: 22 },
    { header: 'Nivel', key: 'nivel', width: 12 },
    { header: 'Mensaje', key: 'mensaje', width: 72 },
    { header: 'Otros campos', key: 'otrosCampos', width: 48 }
  ];

  const header = ws.getRow(1);
  header.font = { bold: true };

  for (let c = 1; c <= 4; c++) {
    ws.getColumn(c).numFmt = '@';
  }

  for (const r of rows) {
    ws.addRow({
      fechaHora: r.fechaHora,
      nivel: r.nivel,
      mensaje: r.mensaje,
      otrosCampos: r.otrosCampos
    });
  }

  const lastRow = ws.rowCount;
  for (let ri = 2; ri <= lastRow; ri++) {
    ws.getRow(ri).alignment = { vertical: 'top', wrapText: true };
  }

  ws.getColumn(3).width = 72;
  ws.getColumn(4).width = 56;

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const name = `${safeFilenamePart(options.filenameBase)}-${timestampForFile()}.xlsx`;
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

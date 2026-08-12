import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const APP_NAME = "SIMPAN - SMKS Tamansiswa Medan";
const PRIMARY_COLOR = "0F7B53";
const ZEBRA_COLOR = "F0FDF4";
const SUMMARY_COLOR = "E6F5EF";

function thinBorder() {
  const side = { style: "thin", color: { argb: "FFCCCCCC" } };
  return { top: side, left: side, bottom: side, right: side };
}

export async function exportToExcel({
  filename,
  moduleName,
  columns,
  rows,
  userName = "",
  summary = [],
}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = APP_NAME;
  wb.created = new Date();

  const ws = wb.addWorksheet(moduleName || "Data", {
    views: [{ state: "frozen", ySplit: 6 }],
  });

  const colCount = columns.length;
  const border = thinBorder();

  // Row 1: App name (merged, primary color)
  ws.mergeCells(1, 1, 1, colCount);
  const r1 = ws.getRow(1);
  r1.height = 28;
  const c1 = r1.getCell(1);
  c1.value = APP_NAME;
  c1.font = { size: 14, bold: true, color: { argb: "FFFFFFFF" }, name: "Calibri" };
  c1.alignment = { vertical: "middle", horizontal: "center" };
  c1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + PRIMARY_COLOR } };
  for (let c = 1; c <= colCount; c++) r1.getCell(c).border = border;

  // Row 2: Module name (merged)
  ws.mergeCells(2, 1, 2, colCount);
  const r2 = ws.getRow(2);
  r2.height = 22;
  r2.getCell(1).value = `Modul: ${moduleName}`;
  r2.getCell(1).font = { size: 12, bold: true, name: "Calibri" };
  r2.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  for (let c = 1; c <= colCount; c++) r2.getCell(c).border = border;

  // Row 3: Export date
  ws.mergeCells(3, 1, 3, colCount);
  const now = new Date();
  const r3 = ws.getRow(3);
  const dateStr = now.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  r3.getCell(1).value = `Tanggal Export: ${dateStr} ${timeStr}`;
  r3.getCell(1).font = { size: 10, name: "Calibri" };
  r3.getCell(1).alignment = { horizontal: "center" };
  for (let c = 1; c <= colCount; c++) r3.getCell(c).border = border;

  // Row 4: User
  ws.mergeCells(4, 1, 4, colCount);
  const r4 = ws.getRow(4);
  r4.getCell(1).value = `Diekspor oleh: ${userName || "-"}`;
  r4.getCell(1).font = { size: 10, name: "Calibri" };
  r4.getCell(1).alignment = { horizontal: "center" };
  for (let c = 1; c <= colCount; c++) r4.getCell(c).border = border;

  // Row 5: blank separator
  const r5 = ws.getRow(5);
  r5.height = 6;
  for (let c = 1; c <= colCount; c++) r5.getCell(c).border = border;

  // Row 6: Header
  const headerRow = ws.getRow(6);
  columns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    cell.font = { size: 11, bold: true, color: { argb: "FFFFFFFF" }, name: "Calibri" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + PRIMARY_COLOR } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = border;
  });
  headerRow.height = 24;

  // Data rows
  const dataStart = 7;
  rows.forEach((row, idx) => {
    const r = ws.getRow(dataStart + idx);
    columns.forEach((col, i) => {
      const cell = r.getCell(i + 1);
      let val = row[col.key];
      if (col.type === "number" && val !== null && val !== undefined && val !== "") {
        val = Number(val);
      }
      if (val === null || val === undefined) val = "";
      cell.value = val;
      cell.font = { size: 11, name: "Calibri" };
      cell.border = border;
      if (col.type === "number") {
        cell.alignment = { horizontal: "right", vertical: "middle" };
        if (col.numFmt) cell.numFmt = col.numFmt;
      } else {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }
      if (idx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + ZEBRA_COLOR } };
      }
    });
  });

  // Auto width
  columns.forEach((col, i) => {
    let maxLen = col.header.length;
    rows.forEach((row) => {
      const v = row[col.key];
      let len = 0;
      if (v !== null && v !== undefined && v !== "") {
        len = String(v).length;
      }
      if (len > maxLen) maxLen = len;
    });
    ws.getColumn(i + 1).width = Math.min(Math.max(maxLen + 3, 10), 50);
  });

  // Summary section
  if (summary.length > 0) {
    const blankRow = ws.getRow(dataStart + rows.length);
    blankRow.height = 8;

    const sumStartRow = dataStart + rows.length + 1;
    summary.forEach((item, i) => {
      const r = ws.getRow(sumStartRow + i);
      const labelEndCol = Math.max(2, Math.floor(colCount / 2));
      const labelCell = r.getCell(1);
      labelCell.value = item.label;
      if (colCount > 2) ws.mergeCells(sumStartRow + i, 1, sumStartRow + i, labelEndCol);
      labelCell.font = { bold: true, size: 11, name: "Calibri" };
      labelCell.alignment = { horizontal: "left", vertical: "middle" };
      labelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + SUMMARY_COLOR } };
      labelCell.border = border;

      const valCell = r.getCell(labelEndCol + 1);
      valCell.value = item.value;
      if (colCount > labelEndCol + 1) ws.mergeCells(sumStartRow + i, labelEndCol + 1, sumStartRow + i, colCount);
      valCell.font = { bold: true, size: 11, name: "Calibri" };
      valCell.alignment = { horizontal: "right", vertical: "middle" };
      valCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + SUMMARY_COLOR } };
      valCell.border = border;
      if (item.numFmt) valCell.numFmt = item.numFmt;
    });
  }

  // Auto filter on header row
  ws.autoFilter = {
    from: { row: 6, column: 1 },
    to: { row: 6, column: colCount },
  };

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename
  );
}
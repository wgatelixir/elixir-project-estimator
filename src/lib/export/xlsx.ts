// Minimal .xlsx (Office Open XML) writer: plain sheets with a bold, frozen,
// filterable header row, numbers stored as real numbers and euro columns
// formatted as currency. Deliberately no formulas, merged cells or totals rows
// in data sheets, so other software can import the sheets as flat tables.

import { strToU8, zipSync } from "fflate";

export type CellValue = string | number | null;

export interface SheetColumn {
  header: string;
  width: number;
  format?: "currency" | "percent";
}

export interface Sheet {
  name: string;
  columns: SheetColumn[];
  rows: CellValue[][];
}

// Style ids in styles.xml below: 0 default, 1 header, 2 currency, 3 percent.
const STYLE = { header: 1, currency: 2, percent: 3 } as const;

const escapeXml = (s: string) =>
  s
    // Characters XML 1.0 can't carry at all (would make Excel "repair" the file).
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function columnLetter(index: number): string {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function cellXml(ref: string, value: CellValue, style: number): string {
  const s = style ? ` s="${style}"` : "";
  if (value === null || value === "") return style ? `<c r="${ref}"${s}/>` : "";
  if (typeof value === "number") return Number.isFinite(value) ? `<c r="${ref}"${s}><v>${value}</v></c>` : "";
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

function sheetXml(sheet: Sheet): string {
  const lastCol = columnLetter(sheet.columns.length - 1);
  const lastRow = sheet.rows.length + 1;
  const cols = sheet.columns.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.width}" customWidth="1"/>`).join("");
  const header = `<row r="1">${sheet.columns.map((c, i) => cellXml(`${columnLetter(i)}1`, c.header, STYLE.header)).join("")}</row>`;
  const body = sheet.rows
    .map((row, r) => {
      const cells = row
        .map((value, i) => {
          const format = sheet.columns[i]?.format;
          return cellXml(`${columnLetter(i)}${r + 2}`, value, format ? STYLE[format] : 0);
        })
        .join("");
      return `<row r="${r + 2}">${cells}</row>`;
    })
    .join("");
  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    `<cols>${cols}</cols>` +
    `<sheetData>${header}${body}</sheetData>` +
    `<autoFilter ref="A1:${lastCol}${lastRow}"/>` +
    `</worksheet>`
  );
}

const STYLES_XML =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
  `<numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;€&quot;\\ #,##0.00"/></numFmts>` +
  `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
  `<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>` +
  `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
  `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
  `<cellXfs count="4">` +
  `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
  `<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>` +
  `<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
  `<xf numFmtId="9" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
  `</cellXfs>` +
  `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
  `</styleSheet>`;

/** Builds the workbook as .xlsx bytes. Sheet names must be unique and at most 31 characters. */
export function buildXlsx(sheets: Sheet[]): Uint8Array {
  const sheetEntries = sheets.map((sheet, i) => ({ sheet, id: i + 1 }));
  const files: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
        sheetEntries
          .map(
            ({ id }) =>
              `<Override PartName="/xl/worksheets/sheet${id}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
          )
          .join("") +
        `</Types>`
    ),
    "_rels/.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
        `</Relationships>`
    ),
    "xl/workbook.xml": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheets>${sheetEntries.map(({ sheet, id }) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${id}" r:id="rId${id}"/>`).join("")}</sheets>` +
        `<definedNames>${sheetEntries
          .map(
            ({ sheet, id }) =>
              `<definedName name="_xlnm._FilterDatabase" localSheetId="${id - 1}" hidden="1">'${escapeXml(sheet.name)}'!$A$1:$${columnLetter(sheet.columns.length - 1)}$${sheet.rows.length + 1}</definedName>`
          )
          .join("")}</definedNames>` +
        `</workbook>`
    ),
    "xl/_rels/workbook.xml.rels": strToU8(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        sheetEntries
          .map(
            ({ id }) =>
              `<Relationship Id="rId${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${id}.xml"/>`
          )
          .join("") +
        `<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        `</Relationships>`
    ),
    "xl/styles.xml": strToU8(STYLES_XML),
  };
  for (const { sheet, id } of sheetEntries) files[`xl/worksheets/sheet${id}.xml`] = strToU8(sheetXml(sheet));
  return zipSync(files, { level: 6 });
}

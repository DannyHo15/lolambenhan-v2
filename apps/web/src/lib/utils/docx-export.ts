import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  LineRuleType,
  HeadingLevel,
  Packer,
} from "docx";
import { saveAs } from "file-saver";
import { formatDateTime, escapeHtml } from "./calculations";

// Constants for A4 formatting
const MARGIN_2CM = 1134; // ~2cm in twips
const LINE_15 = 360; // 1.5 line spacing
const FONT_SIZE_14 = 28; // 14pt in half-points
const FONT_SIZE_20 = 40; // 20pt in half-points

const baseRun = {
  font: "Times New Roman",
  size: FONT_SIZE_14,
};

const basePara = {
  spacing: { line: LINE_15, lineRule: LineRuleType.AUTO },
};

export interface FormData {
  hoten: string;
  gioitinh: string;
  namsinh: string;
  tuoi: string;
  dantoc: string;
  nghenghiep: string;
  diachi: string;
  ngaygio: string;
  lydo: string;
  benhsu: string;
  tiensu: string;
  mach: string;
  nhietdo: string;
  ha_tren: string;
  ha_duoi: string;
  nhiptho: string;
  chieucao: string;
  cannang: string;
  bmi: string;
  phanloai: string;
  tongtrang: string;
  timmach: string;
  hopho: string;
  tieuhoa: string;
  than: string;
  thankinh: string;
  cokhop: string;
  coquankhac: string;
  tomtat: string;
  chandoanso: string;
  chandoanpd: string;
  cls_thuongquy: string;
  cls_chuandoan: string;
  ketqua: string;
  chandoanxacdinh: string;
  huongdieutri: string;
  dieutri: string;
  tienluong: string;
  bienluan: string;
}

/**
 * Create a simple paragraph with text
 */
function para(text: string, opts = {}) {
  return new Paragraph({
    ...basePara,
    ...opts,
    children: [new TextRun({ text: text || "", ...baseRun })],
  });
}

/**
 * Create a heading paragraph with bold text
 */
function paraHeading(prefixBold: string, titleBold: string, opts = {}) {
  return new Paragraph({
    ...basePara,
    ...opts,
    children: [
      new TextRun({ text: prefixBold || "", bold: true, ...baseRun }),
      new TextRun({ text: titleBold || "", bold: true, ...baseRun }),
    ],
  });
}

/**
 * Create a paragraph with bold label and regular value
 */
function paraLabelValue(labelBold: string, valueText: string, opts = {}) {
  return new Paragraph({
    ...basePara,
    ...opts,
    children: [
      new TextRun({ text: labelBold || "", bold: true, ...baseRun }),
      new TextRun({ text: valueText || "", ...baseRun }),
    ],
  });
}

/**
 * Create paragraphs for multiline text (split by newlines)
 */
function textToParagraphs(text: string): Paragraph[] {
  if (!text) return [];
  return String(text).split(/\r?\n/).map((line) => para(line));
}

/**
 * Create paragraphs for label + multiline value
 */
function paraLabelValueMultiline(labelBold: string, valueText: string, opts = {}) {
  const lines = String(valueText || "").split(/\r?\n/);
  const first = lines.shift() ?? "";

  const out = [
    new Paragraph({
      ...basePara,
      ...opts,
      children: [
        new TextRun({ text: labelBold || "", bold: true, ...baseRun }),
        new TextRun({ text: first, ...baseRun }),
      ],
    }),
  ];

  for (const line of lines) out.push(para(line));
  return out;
}

/**
 * Generate and download DOCX file for Nội khoa medical record
 */
export async function generateNoiKhoaDocx(data: FormData, fileName: string = "benhan.docx") {
  const dateNow = new Date().toLocaleString("vi-VN");

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Times New Roman", size: FONT_SIZE_14 },
          paragraph: { spacing: { line: LINE_15, lineRule: LineRuleType.AUTO } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: MARGIN_2CM,
              right: MARGIN_2CM,
              bottom: MARGIN_2CM,
              left: MARGIN_2CM,
            },
            size: { orientation: "portrait" as const },
          },
        },
        children: [
          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200, line: LINE_15, lineRule: LineRuleType.AUTO },
            children: [
              new TextRun({
                text: "BỆNH ÁN NỘI KHOA",
                bold: true,
                font: "Times New Roman",
                size: FONT_SIZE_20,
              }),
            ],
          }),

          // Date
          new Paragraph({
            ...basePara,
            spacing: { ...basePara.spacing, after: 200 },
            children: [
              new TextRun({
                text: `Xuất: ${dateNow}`,
                italics: true,
                bold: false,
                ...baseRun,
              }),
            ],
          }),

          // A. PHẦN HÀNH CHÁNH
          paraHeading("A. ", "PHẦN HÀNH CHÁNH", {
            spacing: { ...basePara.spacing, before: 100, after: 100 },
          }),
          paraLabelValue("1. Họ và tên: ", data.hoten),
          paraLabelValue("2. Giới tính: ", data.gioitinh),
          new Paragraph({
            ...basePara,
            children: [
              new TextRun({ text: "3. Năm sinh: ", bold: true, ...baseRun }),
              new TextRun({ text: `${data.namsinh} `, bold: false, ...baseRun }),
              new TextRun({ text: `(${data.tuoi} tuổi)`, bold: false, ...baseRun }),
            ],
          }),
          paraLabelValue("4. Dân tộc: ", data.dantoc),
          paraLabelValue("5. Nghề nghiệp: ", data.nghenghiep),
          paraLabelValue("6. Địa chỉ: ", data.diachi),
          paraLabelValue("7. Ngày giờ vào viện: ", formatDateTime(data.ngaygio), {
            spacing: { ...basePara.spacing, after: 120 },
          }),

          // B. PHẦN BỆNH ÁN
          paraHeading("B. ", "PHẦN BỆNH ÁN", {
            spacing: { ...basePara.spacing, before: 180, after: 100 },
          }),

          // I. Hỏi bệnh
          paraHeading("I. ", "Hỏi bệnh", {
            spacing: { ...basePara.spacing, before: 120, after: 60 },
          }),
          ...paraLabelValueMultiline("1. Lý do vào viện: ", data.lydo),
          paraHeading("2. ", "Bệnh sử:", { spacing: { ...basePara.spacing, before: 60, after: 0 } }),
          ...textToParagraphs(data.benhsu),
          paraHeading("3. ", "Tiền sử:", { spacing: { ...basePara.spacing, before: 60, after: 0 } }),
          ...textToParagraphs(data.tiensu),

          // II. Khám bệnh
          paraHeading("II. ", "Khám bệnh", {
            spacing: { ...basePara.spacing, before: 160, after: 60 },
          }),
          paraHeading("1. ", "Toàn trạng:", { spacing: { ...basePara.spacing, after: 0 } }),
          para(
            `- Sinh hiệu: Mạch ${data.mach} lần/phút, nhiệt độ: ${data.nhietdo}°C, HA ${data.ha_tren}/${data.ha_duoi} mmHg, nhịp thở: ${data.nhiptho} lần/phút`
          ),
          para(
            `- Chiều cao: ${data.chieucao} cm, cân nặng: ${data.cannang} kg, BMI = ${data.bmi} kg/m² => Phân loại ${data.phanloai} theo WHO Asia`
          ),
          ...textToParagraphs(data.tongtrang),

          paraHeading("2. ", "Khám cơ quan:", {
            spacing: { ...basePara.spacing, before: 120, after: 20 },
          }),
          paraHeading("a) ", "Tuần hoàn:", { spacing: { ...basePara.spacing, after: 0 } }),
          ...textToParagraphs(data.timmach),

          paraHeading("b) ", "Hô hấp:", { spacing: { ...basePara.spacing, before: 40, after: 0 } }),
          ...textToParagraphs(data.hopho),

          paraHeading("c) ", "Tiêu hoá:", { spacing: { ...basePara.spacing, before: 40, after: 0 } }),
          ...textToParagraphs(data.tieuhoa),

          paraHeading("d) ", "Thận - tiết niệu:", { spacing: { ...basePara.spacing, before: 40, after: 0 } }),
          ...textToParagraphs(data.than),

          paraHeading("e) ", "Thần kinh:", { spacing: { ...basePara.spacing, before: 40, after: 0 } }),
          ...textToParagraphs(data.thankinh),

          paraHeading("f) ", "Cơ - Xương - Khớp:", { spacing: { ...basePara.spacing, before: 40, after: 0 } }),
          ...textToParagraphs(data.cokhop),

          paraLabelValue("g) Các cơ quan khác: ", data.coquankhac, {
            spacing: { ...basePara.spacing, before: 40, after: 0 },
          }),

          // III. Kết luận
          paraHeading("III. ", "Kết luận", {
            spacing: { ...basePara.spacing, before: 160, after: 60 },
          }),
          paraHeading("1. ", "Tóm tắt bệnh án:", { spacing: { ...basePara.spacing, after: 0 } }),
          ...textToParagraphs(data.tomtat),

          ...paraLabelValueMultiline("2. Chẩn đoán sơ bộ: ", data.chandoanso, {
            spacing: { ...basePara.spacing, before: 60 },
          }),

          paraHeading("3. ", "Chẩn đoán phân biệt:", { spacing: { ...basePara.spacing, before: 60, after: 0 } }),
          ...textToParagraphs(data.chandoanpd),

          paraHeading("4. ", "Đề nghị cận lâm sàng và kết quả:", {
            spacing: { ...basePara.spacing, before: 60 },
          }),
          paraHeading("a) ", "Đề nghị cận lâm sàng:", { spacing: { ...basePara.spacing, before: 20 } }),
          para(`- Thường quy: ${data.cls_thuongquy}`),
          para(`- Chẩn đoán: ${data.cls_chuandoan}`),

          paraHeading("b) ", "Kết quả:", { spacing: { ...basePara.spacing, before: 40, after: 0 } }),
          ...textToParagraphs(data.ketqua),

          paraHeading("5. ", "Chẩn đoán xác định:", { spacing: { ...basePara.spacing, before: 60, after: 0 } }),
          ...textToParagraphs(data.chandoanxacdinh),

          paraHeading("6. ", "Điều trị:", { spacing: { ...basePara.spacing, before: 60 } }),
          paraHeading("a) ", "Hướng điều trị:", { spacing: { ...basePara.spacing, after: 0 } }),
          ...textToParagraphs(data.huongdieutri),

          paraHeading("b) ", "Điều trị cụ thể:", { spacing: { ...basePara.spacing, before: 40, after: 0 } }),
          ...textToParagraphs(data.dieutri),

          paraHeading("7. ", "Tiên lượng:", { spacing: { ...basePara.spacing, before: 60, after: 0 } }),
          ...textToParagraphs(data.tienluong),

          // C. PHẦN BIỆN LUẬN
          paraHeading("C. ", "PHẦN BIỆN LUẬN", {
            spacing: { ...basePara.spacing, before: 180, after: 60 },
          }),
          ...textToParagraphs(data.bienluan),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, fileName);
}

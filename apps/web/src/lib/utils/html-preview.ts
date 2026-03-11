import { formatDateTime, escapeHtml, nl2br } from "./calculations";
import type { FormData } from "./docx-export";

/**
 * Build HTML document for preview iframe
 */
export function buildHTMLPreview(data: FormData, title: string = "BỆNH ÁN NỘI KHOA"): string {
  const dateNow = new Date().toLocaleString("vi-VN");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title} - ${escapeHtml(data.hoten)}</title>
  <style>
    @page { size: A4; margin: 2cm; }

    body {
      font-family: "Times New Roman", serif;
      font-size: 14pt;
      line-height: 1.5;
      padding: 2cm;
      margin: 0;
      box-sizing: border-box;
      background: white;
      color: black;
      min-height: 297mm;
    }

    p { margin: 0; }
    b { font-weight: 700; }
    .center { text-align: center; }

    @media (max-width: 768px) {
      body { padding: 1cm; }
    }

    @media (max-width: 480px) {
      body { padding: 0.8cm; }
    }
  </style>
</head>
<body>
  <h1 class="center" style="margin:0 0 8px 0;font-size:20pt;"><b>${title}</b></h1>
  <p><em>Ngày làm bệnh án: ${escapeHtml(dateNow)}</em></p>

  <p style="margin-top:12px;"><b>A. PHẦN HÀNH CHÁNH</b></p>
  <p><b>1. Họ và tên:</b> ${escapeHtml(data.hoten)}</p>
  <p><b>2. Giới tính:</b> ${escapeHtml(data.gioitinh)}</p>
  <p><b>3. Năm sinh:</b> ${escapeHtml(data.namsinh)} <span>(${escapeHtml(data.tuoi)} tuổi)</span></p>
  <p><b>4. Dân tộc:</b> ${escapeHtml(data.dantoc)}</p>
  <p><b>5. Nghề nghiệp:</b> ${escapeHtml(data.nghenghiep)}</p>
  <p><b>6. Địa chỉ:</b> ${escapeHtml(data.diachi)}</p>
  <p><b>7. Ngày giờ vào viện:</b> ${formatDateTime(data.ngaygio)}</p>

  <p style="margin-top:12px;"><b>B. PHẦN BỆNH ÁN</b></p>

  <p style="margin-top:6px;"><b>I. Hỏi bệnh</b></p>
  <p><b>1. Lý do vào viện:</b> ${nl2br(data.lydo)}</p>
  <p><b>2. Bệnh sử:</b><br/>${nl2br(data.benhsu)}</p>
  <p><b>3. Tiền sử:</b><br/>${nl2br(data.tiensu)}</p>

  <p style="margin-top:10px;"><b>II. Khám bệnh</b></p>
  <p><b>1. Toàn trạng:</b><br/>
    - Sinh hiệu: Mạch ${escapeHtml(data.mach)} lần/phút, nhiệt độ: ${escapeHtml(data.nhietdo)} °C,
      Huyết áp ${escapeHtml(data.ha_tren)}/${escapeHtml(data.ha_duoi)} mmHg, nhịp thở: ${escapeHtml(data.nhiptho)} lần/phút<br/>
    - Chiều cao: ${escapeHtml(data.chieucao)} cm, cân nặng: ${escapeHtml(data.cannang)} kg,
      BMI = ${escapeHtml(data.bmi)} kg/m² => Phân loại ${escapeHtml(data.phanloai)} theo WHO Asia<br/>
    ${nl2br(data.tongtrang)}
  </p>

  <p style="margin-top:6px;"><b>2. Khám cơ quan:</b></p>
  <p><b>a) Tuần hoàn:</b><br/>${nl2br(data.timmach)}</p>
  <p><b>b) Hô hấp:</b><br/>${nl2br(data.hopho)}</p>
  <p><b>c) Tiêu hoá:</b><br/>${nl2br(data.tieuhoa)}</p>
  <p><b>d) Thận - tiết niệu:</b><br/>${nl2br(data.than)}</p>
  <p><b>e) Thần kinh:</b><br/>${nl2br(data.thankinh)}</p>
  <p><b>f) Cơ - Xương - Khớp:</b><br/>${nl2br(data.cokhop)}</p>
  <p><b>g) Các cơ quan khác:</b> ${nl2br(data.coquankhac)}</p>

  <p style="margin-top:10px;"><b>III. Kết luận</b></p>
  <p><b>1. Tóm tắt bệnh án:</b><br/>${nl2br(data.tomtat)}</p>
  <p><b>2. Chẩn đoán sơ bộ:</b> ${nl2br(data.chandoanso)}</p>
  <p><b>3. Chẩn đoán phân biệt:</b><br/>${nl2br(data.chandoanpd)}</p>

  <p><b>4. Đề nghị cận lâm sàng và kết quả:</b></p>
  <p><b>a) Đề nghị cận lâm sàng:</b></p>
  <p>- Thường quy: ${nl2br(data.cls_thuongquy)}</p>
  <p>- Chẩn đoán: ${nl2br(data.cls_chuandoan)}</p>
  <p><b>b) Kết quả:</b><br/>${nl2br(data.ketqua)}</p>

  <p><b>5. Chẩn đoán xác định:</b><br/>${nl2br(data.chandoanxacdinh)}</p>

  <p><b>6. Điều trị:</b></p>
  <p><b>a) Hướng điều trị:</b><br/>${nl2br(data.huongdieutri)}</p>
  <p><b>b) Điều trị cụ thể:</b><br/>${nl2br(data.dieutri)}</p>

  <p><b>7. Tiên lượng:</b><br/>${nl2br(data.tienluong)}</p>

  <p style="margin-top:12px;"><b>C. PHẦN BIỆN LUẬN</b></p>
  <p>${nl2br(data.bienluan)}</p>
</body>
</html>`;
}

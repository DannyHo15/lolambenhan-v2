"use client";

import { useState } from "react";
import { useMedicalForm } from "@/lib/hooks/useMedicalForm";
import { generateNoiKhoaDocx } from "@/lib/utils/docx-export";
import { buildHTMLPreview } from "@/lib/utils/html-preview";
import { MedicalTopbar } from "@/components/benhan/medical-topbar";
import { PreviewModal } from "@/components/benhan/preview-modal";
import { AiChatPanel } from "@/components/chat/ai-chat-panel";
import {
  FormSection,
  FormRow,
  FormInput,
  FormTextarea,
  FormSelect,
  VitalSignsInput,
  BMICalculator,
} from "@/components/benhan/form-inputs";

const TIM_MACH_OPTIONS = [
  { value: "", label: "-- Chọn --" },
  {
    value: "T1 T2 đều rõ, không âm thổi",
    label: "T1 T2 đều rõ, không âm thổi",
  },
  {
    value:
      "- Lòng ngực cân đối, không sẹo mổ cũ, mỏm tim ở liên sườn V đường trung đòn (T) diện đập 2x2cm, tĩnh mạch cổ không nổi 45o\n- Không phát hiện ổ đập bất thường, rung miu (-), Harzer (-)\n- T1 T2 đều rõ, nảy cùng nhịp mạch, tần số  lần/phút, không âm thổi",
    label: "- Lòng ngực cân đối, không sẹo mổ cũ...",
  },
];

const HO_HAP_OPTIONS = [
  { value: "", label: "-- Chọn --" },
  {
    value: "Rì rào phế nang êm dịu 2 phế trường, không ran",
    label: "Rì rào phế nang êm dịu 2 phế trường, không ran",
  },
  {
    value:
      "- Ngực di động theo nhịp thở, các khoảng gian sườn không dãn, không co kéo cơ hô hấp phụ\n- Rung thanh đều 2 bên, gõ trong\n- Rì rào phế nang êm dịu 2 phế trường, không ran",
    label: "- Ngực di động theo nhịp thở...",
  },
];

const TIEU_HOA_OPTIONS = [
  { value: "", label: "-- Chọn --" },
  {
    value: "Bụng mềm, gan lách không sờ chạm, không diểm đau khu trú",
    label: "Bụng mềm, gan lách không sờ chạm, không diểm đau khu trú",
  },
  {
    value:
      "- Bụng cân đối, không chướng, không sẹo mổ cũ, không tuần hoàn bàng hệ\n- Nhu động #4 lần/phút. Gõ trong khắp bụng, đục vùng gan lách\n- Bụng mềm, gan lách không sờ chạm, không điểm đau khu trú\n- [Các nghiệm pháp cần làm]\n- Thăm hậu môn - trực tràng: Cơ thắt tốt, niêm mạc trơn láng, túi cùng không đau, rút găng không nhầy máu ",
    label: "- Bụng cân đối, không chướng...",
  },
];

const THAN_OPTIONS = [
  { value: "", label: "-- Chọn --" },
  { value: "Cầu bàng quang (-), chạm thận (-)", label: "Cầu bàng quang (-), chạm thận (-)" },
  {
    value:
      "- Hố thắt lưng không sưng nề\n- Cầu bàng quang (-), chạm thận (-), rung thận (-), điểm niệu quản (-)",
    label: "- Hố thắt lưng không sưng nề...",
  },
];

const THAN_KINH_OPTIONS = [
  { value: "", label: "-- Chọn --" },
  {
    value: "Cổ mềm, không dấu thần kinh khu trú",
    label: "Cổ mềm, không dấu thần kinh khu trú",
  },
  {
    value:
      "- Chức năng thần kinh cao cấp: GCS 15/15\n- Tư thế dáng bộ: Dáng đi thẳng\n- 12 đôi dây thần kinh sọ:\n- Hệ vận động: Sức cơ 5/5, trương lực trung bình, không rung giật\n- Hệ cảm giác: Nông, sâu\n- Phản xạ: Phản xạ gân xương 2+, phản xạ da bụng (+), Babinski (-), hoffman (-)\n- Dấu màng não: Cổ mềm, Kernig (-)\n- Hệ thần kinh thực vật: Không rối loạn cơ vòng",
    label: "- Chức năng thần kinh cao cấp...",
  },
];

const CO_KHOP_OPTIONS = [
  { value: "", label: "-- Chọn --" },
  { value: "Không giới hạn vận động", label: "Không giới hạn vận động" },
  {
    value:
      "- Cột sống không gù vẹo, các khớp không biến dạng\n- Các khớp không viêm, ấn không đau, dấu chuông bấm (-), lasegue (-), bonnet (-)\n- Chiều dài chi 2 bên không lệch, Schober 15/10cm",
    label: "- Cột sống không gù vẹo...",
  },
];

export default function NoiKhoaPage() {
  const { formData, calculated, updateField, resetForm, getExportData, lastSaved, clearSaved, tomtatCombined, setTomtatUser } = useMedicalForm({ persistenceKey: "noi-khoa" });
  const [showPreview, setShowPreview] = useState(false);

  const handleExport = async () => {
    const data = getExportData();
    clearSaved(); // Clear saved data after export
    await generateNoiKhoaDocx(data, `${data.hoten || "benhan"}.docx`);
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleReset = () => {
    if (confirm("Xoá hết dữ liệu trong form?")) {
      resetForm();
    }
  };

  const handleVitalSignChange = (field: string, value: string) => {
    updateField(field as keyof typeof formData, value);
  };

  const handleBMIChange = (field: string, value: string) => {
    updateField(field as keyof typeof formData, value);
  };

  const handleSelectToTextarea = (selectValue: string, textareaField: keyof typeof formData) => {
    updateField(textareaField, selectValue);
  };

  const previewHtml = buildHTMLPreview(getExportData(), "BỆNH ÁN NỘI KHOA");

  const handleTomtatChange = (value: string) => {
    const gioitinh = formData.gioitinh?.toLowerCase() || "";
    const tuoi = calculated.tuoi || "-";
    const lydo = formData.lydo?.toLowerCase() || "";
    const autoPart = `Bệnh nhân ${gioitinh} ${tuoi} tuổi vào viện vì ${lydo}. Qua hỏi bệnh, khám bệnh ghi nhận:\n`;

    if (value.startsWith(autoPart)) {
      setTomtatUser(value.slice(autoPart.length));
    } else {
      setTomtatUser(value);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pt-0 pb-8 px-4">
      <MedicalTopbar
        onExport={handleExport}
        onPreview={handlePreview}
        onReset={handleReset}
      />

      <main className="max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-[32px] font-semibold text-foreground mb-2" style={{ letterSpacing: "-0.5px" }}>
            Form BỆNH ÁN NỘI KHOA
          </h1>
          <p className="text-[15px] text-muted-foreground">
            Nhập thông tin rồi nhấn <strong>XUẤT FILE WORD</strong> để lưu bệnh án hoàn chỉnh về máy.
          </p>
          {/* Auto-save indicator */}
          {lastSaved && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center justify-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Đã lưu tự động {lastSaved.toLocaleTimeString("vi-VN")}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={(e) => e.preventDefault()} className="form-container-glass">
          {/* A. PHẦN HÀNH CHÁNH */}
          <FormSection title="A. PHẦN HÀNH CHÁNH">
            <FormRow>
              <FormInput
                id="hoten"
                label="1. Họ và tên"
                value={formData.hoten || ""}
                onChange={(v) => updateField("hoten", v)}
                placeholder="Nguyễn Văn A"
              />
              <FormSelect
                id="gioitinh"
                label="2. Giới tính"
                value={formData.gioitinh || ""}
                onChange={(v) => updateField("gioitinh", v)}
                options={[
                  { value: "", label: "-- Chọn --" },
                  { value: "Nam", label: "Nam" },
                  { value: "Nữ", label: "Nữ" },
                ]}
              />
              <div>
                <FormInput
                  id="namsinh"
                  label="3. Năm sinh"
                  type="number"
                  value={formData.namsinh || ""}
                  onChange={(v) => updateField("namsinh", v)}
                  placeholder="1980"
                  className="mb-1"
                />
                <p className="text-xs text-muted-foreground">Tuổi: {calculated.tuoi}</p>
              </div>
            </FormRow>

            <FormInput
              id="dantoc"
              label="4. Dân tộc"
              value={formData.dantoc || ""}
              onChange={(v) => updateField("dantoc", v)}
            />

            <FormInput
              id="nghenghiep"
              label="5. Nghề nghiệp"
              value={formData.nghenghiep || ""}
              onChange={(v) => updateField("nghenghiep", v)}
            />

            <FormInput
              id="diachi"
              label="6. Địa chỉ"
              value={formData.diachi || ""}
              onChange={(v) => updateField("diachi", v)}
            />

            <FormInput
              id="ngaygio"
              label="7. Ngày giờ vào viện"
              type="datetime-local"
              value={formData.ngaygio || ""}
              onChange={(v) => updateField("ngaygio", v)}
            />
          </FormSection>

          {/* B. PHẦN BỆNH ÁN */}
          <FormSection title="B. PHẦN BỆNH ÁN">
            {/* I. Hỏi bệnh */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-foreground">I. Hỏi bệnh</h3>

              <FormTextarea
                id="lydo"
                label="1. Lý do vào viện"
                value={formData.lydo || ""}
                onChange={(v) => updateField("lydo", v)}
                rows={3}
              />

              <FormTextarea
                id="benhsu"
                label="2. Bệnh sử"
                value={formData.benhsu || ""}
                onChange={(v) => updateField("benhsu", v)}
                rows={4}
              />

              <FormTextarea
                id="tiensu"
                label="3. Tiền sử"
                value={formData.tiensu || ""}
                onChange={(v) => updateField("tiensu", v)}
                rows={6}
              />
            </div>

            {/* II. KHÁM BỆNH */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-foreground">II. KHÁM BỆNH</h3>

              <div>
                <label className="label-form">1. Toàn trạng</label>
                <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                  <VitalSignsInput
                    mach={formData.mach || ""}
                    nhietdo={formData.nhietdo || ""}
                    ha_tren={formData.ha_tren || ""}
                    ha_duoi={formData.ha_duoi || ""}
                    nhiptho={formData.nhiptho || ""}
                    onChange={handleVitalSignChange}
                  />
                  <div className="pt-2 border-t border-border">
                    <BMICalculator
                      chieucao={formData.chieucao || ""}
                      cannang={formData.cannang || ""}
                      bmi={calculated.bmi}
                      phanloai={calculated.phanloai}
                      onChange={handleBMIChange}
                    />
                  </div>
                  <FormTextarea
                    id="tongtrang"
                    label=""
                    value={formData.tongtrang || ""}
                    onChange={(v) => updateField("tongtrang", v)}
                    rows={4}
                  />
                </div>
              </div>

              <div>
                <label className="label-form">2. Các cơ quan</label>
                <FormRow>
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-medium">a) Tuần hoàn:</label>
                    <FormSelect
                      id="timmachSelect"
                      label=""
                      value=""
                      onChange={(v) => handleSelectToTextarea(v, "timmach")}
                      options={TIM_MACH_OPTIONS}
                    />
                    <FormTextarea
                      id="timmach"
                      label=""
                      value={formData.timmach || ""}
                      onChange={(v) => updateField("timmach", v)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-medium">b) Hô hấp:</label>
                    <FormSelect
                      id="hohapSelect"
                      label=""
                      value=""
                      onChange={(v) => handleSelectToTextarea(v, "hopho")}
                      options={HO_HAP_OPTIONS}
                    />
                    <FormTextarea
                      id="hopho"
                      label=""
                      value={formData.hopho || ""}
                      onChange={(v) => updateField("hopho", v)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-medium">c) Tiêu hoá:</label>
                    <FormSelect
                      id="TieuhoaSelect"
                      label=""
                      value=""
                      onChange={(v) => handleSelectToTextarea(v, "tieuhoa")}
                      options={TIEU_HOA_OPTIONS}
                    />
                    <FormTextarea
                      id="tieuhoa"
                      label=""
                      value={formData.tieuhoa || ""}
                      onChange={(v) => updateField("tieuhoa", v)}
                      rows={3}
                    />
                  </div>
                </FormRow>

                <FormRow className="mt-4">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-medium">d) Thận - tiết niệu:</label>
                    <FormSelect
                      id="thanSelect"
                      label=""
                      value=""
                      onChange={(v) => handleSelectToTextarea(v, "than")}
                      options={THAN_OPTIONS}
                    />
                    <FormTextarea
                      id="than"
                      label=""
                      value={formData.than || ""}
                      onChange={(v) => updateField("than", v)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-medium">e) Thần kinh:</label>
                    <FormSelect
                      id="thankinhSelect"
                      label=""
                      value=""
                      onChange={(v) => handleSelectToTextarea(v, "thankinh")}
                      options={THAN_KINH_OPTIONS}
                    />
                    <FormTextarea
                      id="thankinh"
                      label=""
                      value={formData.thankinh || ""}
                      onChange={(v) => updateField("thankinh", v)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground font-medium">f) Cơ - Xương - Khớp:</label>
                    <FormSelect
                      id="cokhopSelect"
                      label=""
                      value=""
                      onChange={(v) => handleSelectToTextarea(v, "cokhop")}
                      options={CO_KHOP_OPTIONS}
                    />
                    <FormTextarea
                      id="cokhop"
                      label=""
                      value={formData.cokhop || ""}
                      onChange={(v) => updateField("cokhop", v)}
                      rows={3}
                    />
                  </div>
                </FormRow>

                <div className="mt-4">
                  <FormTextarea
                    id="coquankhac"
                    label="g) Các cơ quan khác:"
                    value={formData.coquankhac || ""}
                    onChange={(v) => updateField("coquankhac", v)}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* III. KẾT LUẬN */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">III. KẾT LUẬN</h3>

              <FormTextarea
                id="tomtat"
                label="1. Tóm tắt bệnh án"
                value={tomtatCombined}
                onChange={(v) => handleTomtatChange(v)}
                rows={4}
              />

              <FormTextarea
                id="chandoanso"
                label="2. Chẩn đoán sơ bộ"
                value={formData.chandoanso || ""}
                onChange={(v) => updateField("chandoanso", v)}
                rows={2}
              />

              <FormTextarea
                id="chandoanpd"
                label="3. Chẩn đoán phân biệt"
                value={formData.chandoanpd || ""}
                onChange={(v) => updateField("chandoanpd", v)}
                rows={3}
              />

              <div>
                <label className="label-form">4. Đề nghị cận lâm sàng và kết quả</label>
                <div className="mt-2 space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">a) Đề nghị cận lâm sàng</label>
                    <FormTextarea
                      id="cls_thuongquy"
                      label="- Thường quy"
                      value={formData.cls_thuongquy || ""}
                      onChange={(v) => updateField("cls_thuongquy", v)}
                      rows={2}
                      className="mt-1"
                    />
                    <FormTextarea
                      id="cls_chuandoan"
                      label="- Chẩn đoán"
                      value={formData.cls_chuandoan || ""}
                      onChange={(v) => updateField("cls_chuandoan", v)}
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">b) Kết quả</label>
                    <FormTextarea
                      id="ketqua"
                      label=""
                      value={formData.ketqua || ""}
                      onChange={(v) => updateField("ketqua", v)}
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <FormTextarea
                id="chandoanxacdinh"
                label="5. Chẩn đoán xác định"
                value={formData.chandoanxacdinh || ""}
                onChange={(v) => updateField("chandoanxacdinh", v)}
                rows={2}
              />

              <div>
                <label className="label-form">6. Điều trị</label>
                <div className="mt-2 space-y-2">
                  <FormTextarea
                    id="huongdieutri"
                    label="a) Hướng điều trị"
                    value={formData.huongdieutri || ""}
                    onChange={(v) => updateField("huongdieutri", v)}
                    rows={2}
                  />
                  <FormTextarea
                    id="dieutri"
                    label="b) Điều trị cụ thể"
                    value={formData.dieutri || ""}
                    onChange={(v) => updateField("dieutri", v)}
                    rows={4}
                  />
                </div>
              </div>

              <FormTextarea
                id="tienluong"
                label="7. Tiên lượng"
                value={formData.tienluong || ""}
                onChange={(v) => updateField("tienluong", v)}
                rows={2}
              />
            </div>
          </FormSection>

          {/* C. PHẦN BIỆN LUẬN */}
          <FormSection title="C. PHẦN BIỆN LUẬN">
            <FormTextarea
              id="bienluan"
              label=""
              value={formData.bienluan || ""}
              onChange={(v) => updateField("bienluan", v)}
              rows={6}
            />
          </FormSection>
        </form>
      </main>

      <PreviewModal isOpen={showPreview} onClose={() => setShowPreview(false)} htmlContent={previewHtml} />

      <AiChatPanel formContext={{ tomtat: tomtatCombined, chandoanso: formData.chandoanso || "" }} />
    </div>
  );
}

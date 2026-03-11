"use client";

import { useState } from "react";
import { useMedicalForm } from "@/lib/hooks/useMedicalForm";
import { generateNoiKhoaDocx } from "@/lib/utils/docx-export";
import { buildHTMLPreview } from "@/lib/utils/html-preview";
import { MedicalTopbar } from "@/components/benhan/medical-topbar";
import { PreviewModal } from "@/components/benhan/preview-modal";
import { AiChatPanel } from "@/components/chat/ai-chat-panel";
import { FormSection, FormRow, FormInput, FormTextarea, FormSelect, VitalSignsInput, BMICalculator } from "@/components/benhan/form-inputs";

const TIM_MACH_OPTIONS = [{ value: "", label: "-- Chọn --" }, { value: "T1 T2 đều rõ, không âm thổi", label: "T1 T2 đều rõ, không âm thổi" }];
const HO_HAP_OPTIONS = [{ value: "", label: "-- Chọn --" }, { value: "Rì rào phế nang êm dịu 2 phế trường, không ran", label: "Rì rào phế nang êm dịu 2 phế trường, không ran" }];
const TIEU_HOA_OPTIONS = [{ value: "", label: "-- Chọn --" }, { value: "Bụng mềm, gan lách không sờ chạm, không diểm đau khu trú", label: "Bụng mềm, gan lách không sờ chạm, không diểm đau khu trú" }];
const THAN_OPTIONS = [{ value: "", label: "-- Chọn --" }, { value: "Cầu bàng quang (-), chạm thận (-)", label: "Cầu bàng quang (-), chạm thận (-)" }];
const THAN_KINH_OPTIONS = [{ value: "", label: "-- Chọn --" }, { value: "Cổ mềm, không dấu thần kinh khu trú", label: "Cổ mềm, không dấu thần kinh khu trú" }];
const CO_KHOP_OPTIONS = [{ value: "", label: "-- Chọn --" }, { value: "Không giới hạn vận động", label: "Không giới hạn vận động" }];

export default function PhuKhoaPage() {
  const { formData, calculated, updateField, resetForm, getExportData, lastSaved, clearSaved, tomtatCombined, setTomtatUser } = useMedicalForm({ persistenceKey: "phu-khoa" });
  const [showPreview, setShowPreview] = useState(false);

  const handleExport = async () => {
    const data = getExportData();
    clearSaved();
    await generateNoiKhoaDocx(data, `${data.hoten || "benhan-phukhoa"}.docx`);
  };
  const handlePreview = () => setShowPreview(true);
  const handleReset = () => { if (confirm("Xoá hết dữ liệu trong form?")) resetForm(); };
  const handleVitalSignChange = (field: string, value: string) => { updateField(field as keyof typeof formData, value); };
  const handleBMIChange = (field: string, value: string) => { updateField(field as keyof typeof formData, value); };
  const handleSelectToTextarea = (selectValue: string, textareaField: keyof typeof formData) => { updateField(textareaField, selectValue); };
  const previewHtml = buildHTMLPreview(getExportData(), "BỆNH ÁN PHỤ KHOA");

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
      <MedicalTopbar onExport={handleExport} onPreview={handlePreview} onReset={handleReset} />
      <main className="max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-[32px] font-semibold text-foreground mb-2" style={{ letterSpacing: "-0.5px" }}>
            Form BỆNH ÁN PHỤ KHOA
          </h1>
          <p className="text-[15px] text-muted-foreground">
            Nhập thông tin rồi nhấn <strong>XUẤT FILE WORD</strong> để lưu bệnh án hoàn chỉnh về máy.
          </p>
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
          <FormSection title="A. PHẦN HÀNH CHÁNH">
            <FormRow>
              <FormInput id="hoten" label="1. Họ và tên" value={formData.hoten || ""} onChange={(v) => updateField("hoten", v)} placeholder="Nguyễn Văn A" />
              <FormSelect id="gioitinh" label="2. Giới tính" value={formData.gioitinh || ""} onChange={(v) => updateField("gioitinh", v)} options={[{ value: "", label: "-- Chọn --" }, { value: "Nam", label: "Nam" }, { value: "Nữ", label: "Nữ" }]} />
              <div>
                <FormInput id="namsinh" label="3. Năm sinh" type="number" value={formData.namsinh || ""} onChange={(v) => updateField("namsinh", v)} placeholder="1980" className="mb-1" />
                <p className="text-xs text-muted-foreground">Tuổi: {calculated.tuoi}</p>
              </div>
            </FormRow>
            <FormInput id="dantoc" label="4. Dân tộc" value={formData.dantoc || ""} onChange={(v) => updateField("dantoc", v)} />
            <FormInput id="nghenghiep" label="5. Nghề nghiệp" value={formData.nghenghiep || ""} onChange={(v) => updateField("nghenghiep", v)} />
            <FormInput id="diachi" label="6. Địa chỉ" value={formData.diachi || ""} onChange={(v) => updateField("diachi", v)} />
            <FormInput id="ngaygio" label="7. Ngày giờ vào viện" type="datetime-local" value={formData.ngaygio || ""} onChange={(v) => updateField("ngaygio", v)} />
          </FormSection>
          <FormSection title="B. PHẦN BỆNH ÁN">
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-foreground">I. Hỏi bệnh</h3>
              <FormTextarea id="lydo" label="1. Lý do vào viện" value={formData.lydo || ""} onChange={(v) => updateField("lydo", v)} rows={3} />
              <FormTextarea id="benhsu" label="2. Bệnh sử" value={formData.benhsu || ""} onChange={(v) => updateField("benhsu", v)} rows={4} />
              <FormTextarea id="tiensu" label="3. Tiền sử" value={formData.tiensu || ""} onChange={(v) => updateField("tiensu", v)} rows={6} />
            </div>
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-foreground">II. KHÁM BỆNH</h3>
              <div>
                <label className="label-form">1. Toàn trạng</label>
                <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-3">
                  <VitalSignsInput mach={formData.mach || ""} nhietdo={formData.nhietdo || ""} ha_tren={formData.ha_tren || ""} ha_duoi={formData.ha_duoi || ""} nhiptho={formData.nhiptho || ""} onChange={handleVitalSignChange} />
                  <div className="pt-2 border-t border-border">
                    <BMICalculator chieucao={formData.chieucao || ""} cannang={formData.cannang || ""} bmi={calculated.bmi} phanloai={calculated.phanloai} onChange={handleBMIChange} />
                  </div>
                  <FormTextarea id="tongtrang" label="" value={formData.tongtrang || ""} onChange={(v) => updateField("tongtrang", v)} rows={4} />
                </div>
              </div>
              <div>
                <label className="label-form">2. Các cơ quan</label>
                <FormRow>
                  {["timmach", "hopho", "tieuhoa"].map((field, i) => (
                    <div key={field} className="space-y-2">
                      <label className="text-xs text-muted-foreground font-medium">{["a) Tuần hoàn:", "b) Hô hấp", "c) Tiêu hoá:"][i]}</label>
                      <FormSelect id={`${field}Select`} label="" value="" onChange={(v) => handleSelectToTextarea(v, field as any)} options={i === 0 ? TIM_MACH_OPTIONS : i === 1 ? HO_HAP_OPTIONS : TIEU_HOA_OPTIONS} />
                      <FormTextarea id={field} label="" value={formData[field as keyof typeof formData] || ""} onChange={(v) => updateField(field as keyof typeof formData, v)} rows={3} />
                    </div>
                  ))}
                </FormRow>
                <FormRow className="mt-4">
                  {["than", "thankinh", "cokhop"].map((field, i) => (
                    <div key={field} className="space-y-2">
                      <label className="text-xs text-muted-foreground font-medium">{["d) Thận - tiết niệu:", "e) Thần kinh:", "f) Cơ - Xương - Khớp:"][i]}</label>
                      <FormSelect id={`${field}Select`} label="" value="" onChange={(v) => handleSelectToTextarea(v, field as any)} options={i === 0 ? THAN_OPTIONS : i === 1 ? THAN_KINH_OPTIONS : CO_KHOP_OPTIONS} />
                      <FormTextarea id={field} label="" value={formData[field as keyof typeof formData] || ""} onChange={(v) => updateField(field as keyof typeof formData, v)} rows={3} />
                    </div>
                  ))}
                </FormRow>
                <div className="mt-4">
                  <FormTextarea id="coquankhac" label="g) Các cơ quan khác:" value={formData.coquankhac || ""} onChange={(v) => updateField("coquankhac", v)} rows={2} />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">III. KẾT LUẬN</h3>
              <FormTextarea id="tomtat" label="1. Tóm tắt bệnh án" value={tomtatCombined} onChange={(v) => handleTomtatChange(v)} rows={4} />
              <FormTextarea id="chandoanso" label="2. Chẩn đoán sơ bộ" value={formData.chandoanso || ""} onChange={(v) => updateField("chandoanso", v)} rows={2} />
              <FormTextarea id="chandoanpd" label="3. Chẩn đoán phân biệt" value={formData.chandoanpd || ""} onChange={(v) => updateField("chandoanpd", v)} rows={3} />
              <div>
                <label className="label-form">4. Đề nghị cận lâm sàng và kết quả</label>
                <div className="mt-2 space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">a) Đề nghị cận lâm sàng</label>
                    <FormTextarea id="cls_thuongquy" label="- Thường quy" value={formData.cls_thuongquy || ""} onChange={(v) => updateField("cls_thuongquy", v)} rows={2} className="mt-1" />
                    <FormTextarea id="cls_chuandoan" label="- Chẩn đoán" value={formData.cls_chuandoan || ""} onChange={(v) => updateField("cls_chuandoan", v)} rows={2} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">b) Kết quả</label>
                    <FormTextarea id="ketqua" label="" value={formData.ketqua || ""} onChange={(v) => updateField("ketqua", v)} rows={4} className="mt-1" />
                  </div>
                </div>
              </div>
              <FormTextarea id="chandoanxacdinh" label="5. Chẩn đoán xác định" value={formData.chandoanxacdinh || ""} onChange={(v) => updateField("chandoanxacdinh", v)} rows={2} />
              <div>
                <label className="label-form">6. Điều trị</label>
                <div className="mt-2 space-y-2">
                  <FormTextarea id="huongdieutri" label="a) Hướng điều trị" value={formData.huongdieutri || ""} onChange={(v) => updateField("huongdieutri", v)} rows={2} />
                  <FormTextarea id="dieutri" label="b) Điều trị cụ thể" value={formData.dieutri || ""} onChange={(v) => updateField("dieutri", v)} rows={4} />
                </div>
              </div>
              <FormTextarea id="tienluong" label="7. Tiên lượng" value={formData.tienluong || ""} onChange={(v) => updateField("tienluong", v)} rows={2} />
            </div>
          </FormSection>
          <FormSection title="C. PHẦN BIỆN LUẬN"><FormTextarea id="bienluan" label="" value={formData.bienluan || ""} onChange={(v) => updateField("bienluan", v)} rows={6} /></FormSection>
        </form>
      </main>
      <PreviewModal isOpen={showPreview} onClose={() => setShowPreview(false)} htmlContent={previewHtml} />
      <AiChatPanel formContext={{ tomtat: tomtatCombined, chandoanso: formData.chandoanso || "" }} />
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  FileText,
  Stethoscope,
  X,
  Sparkles,
  Send,
  AlertCircle,
  CheckCircle2,
  User,
  Phone,
  ShieldCheck,
  Activity,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

export interface ExportClinicalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSkinPhotoUrl?: string;
  defaultRednessIndex?: number;
  defaultSpotsCount?: number;
  onSuccess?: (caseCode: string) => void;
}

export function ExportClinicalRecordModal({
  isOpen,
  onClose,
  defaultSkinPhotoUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80",
  defaultRednessIndex = 52,
  defaultSpotsCount = 8,
  onSuccess,
}: ExportClinicalRecordModalProps) {
  const [patientName, setPatientName] = useState("Trần Thị Ngọc Hà");
  const [patientEmail, setPatientEmail] = useState("hattn.23itb@vku.udn.vn");
  const [patientAge, setPatientAge] = useState(21);
  const [patientGender, setPatientGender] = useState<"Nữ" | "Nam">("Nữ");
  const [phone, setPhone] = useState("0905 888 999");
  const [skinType, setSkinType] = useState("Hỗn hợp thiên dầu");
  const [symptoms, setSymptoms] = useState(
    "Mụn bọc viêm đỏ má & cằm; da châm chích rát nhẹ sau khi tiếp xúc bụi nắng, tiết dầu nhờn vùng chữ T.",
  );
  const [allergies, setAllergies] = useState(
    "Dị ứng hương liệu nhân tạo & cồn khô nồng độ cao. Từng kích ứng corticoid nhẹ.",
  );
  const [selectedDoctor, setSelectedDoctor] = useState("BS. CKI Nguyễn Mai Hoa");

  const [loading, setLoading] = useState(false);
  const [submittedCase, setSubmittedCase] = useState<{
    caseCode: string;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientName.trim()) {
      toast.error("Vui lòng nhập họ và tên bệnh nhân.");
      return;
    }
    if (!symptoms.trim()) {
      toast.error("Vui lòng mô tả triệu chứng da hiện tại.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/patient/clinical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: patientName.trim(),
          patientEmail: patientEmail.trim(),
          patientAge,
          patientGender,
          phone: phone.trim(),
          skinType,
          symptoms: symptoms.trim(),
          allergies: allergies.trim(),
          skinPhotoUrl: defaultSkinPhotoUrl,
          rednessIndex: defaultRednessIndex,
          spotsCount: defaultSpotsCount,
          affectedZones: ["Má trái", "Má phải", "Cằm"],
          doctorId: selectedDoctor,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Gửi bệnh án thất bại.");
      }

      setSubmittedCase({
        caseCode: json.caseCode,
        message: json.message,
      });
      toast.success(`Đã xuất và gửi hồ sơ bệnh án ${json.caseCode} tới Bác sĩ thành công!`);
      if (onSuccess) onSuccess(json.caseCode);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra khi gửi bệnh án.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl p-6 sm:p-8 text-foreground">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-2 transition cursor-pointer"
        >
          <X className="size-5" />
        </button>

        {submittedCase ? (
          <div className="py-8 text-center space-y-5">
            <div className="size-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="size-9" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">
                Đã Lưu Trữ Lên Supabase Cloud Thành Công
              </span>
              <h2 className="font-display text-2xl font-bold">
                Bệnh Án Y Khoa: {submittedCase.caseCode}
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Hồ sơ bệnh án và phân tích chỉ số viêm đỏ AI của bạn đã được chuyển trực tiếp tới{" "}
                <strong className="text-foreground">{selectedDoctor}</strong>. Bác sĩ sẽ phản hồi và kê phác đồ Routine cho bạn.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-2/60 border border-border max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bệnh nhân:</span>
                <span className="font-semibold text-foreground">{patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mã bệnh án:</span>
                <span className="font-mono font-bold text-primary">{submittedCase.caseCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bác sĩ tiếp nhận:</span>
                <span className="font-semibold text-foreground">{selectedDoctor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trạng thái:</span>
                <span className="font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                  Chờ Bác Sĩ Kê Đơn Phác Đồ
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition cursor-pointer"
              >
                Hoàn tất & Đóng
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="space-y-1.5 pr-8">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <Stethoscope className="size-4" />
                <span>Xuất Bệnh Án Soi Da AI Gửi Bác Sĩ Chuyên Khoa</span>
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight">
                Hồ Sơ Lâm Sàng & Phân Tích Da Y Khoa
              </h2>
              <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
                Thông số viêm đỏ AI và ảnh soi da sẽ được mã hóa và gửi tới Bác sĩ chuyên khoa tiếp nhận để phân tích triệu chứng và chỉ định phác đồ điều trị.
              </p>
            </div>

            {/* AI Scan Inspection Card */}
            <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row gap-4 items-center">
              <img
                src={defaultSkinPhotoUrl}
                alt="Ảnh soi da bệnh nhân"
                className="size-20 sm:size-24 rounded-xl object-cover border border-border shadow-xs shrink-0"
              />
              <div className="flex-1 w-full space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Activity className="size-3.5 text-primary" />
                    <span>Chỉ Số AI Redness Index:</span>
                  </span>
                  <span className="font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                    {defaultRednessIndex}% (Độ viêm {defaultRednessIndex > 50 ? "Trung bình - Nặng" : "Nhẹ"})
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                  <div className="bg-card/80 p-2 rounded-lg border border-border/60">
                    <span className="text-muted-foreground">Mụn viêm bọc: </span>
                    <strong className="text-destructive font-mono">{defaultSpotsCount} nốt</strong>
                  </div>
                  <div className="bg-card/80 p-2 rounded-lg border border-border/60">
                    <span className="text-muted-foreground">Vùng da ảnh hưởng: </span>
                    <strong className="text-foreground">Má trái, Má phải, Cằm</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground/90">Họ và tên bệnh nhân *</label>
                <input
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface-2 text-foreground outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground/90">Số điện thoại liên hệ *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface-2 text-foreground outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground/90">Tuổi & Giới tính</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(Number(e.target.value))}
                    className="w-20 px-3 py-2 rounded-xl border border-border bg-surface-2 text-foreground outline-none focus:border-primary"
                  />
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value as "Nữ" | "Nam")}
                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-surface-2 text-foreground outline-none focus:border-primary"
                  >
                    <option value="Nữ">Nữ</option>
                    <option value="Nam">Nam</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground/90">Loại da chỉ định</label>
                <input
                  type="text"
                  value={skinType}
                  onChange={(e) => setSkinType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface-2 text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Doctor Selection */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-foreground/90 flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-primary" />
                <span>Bác sĩ Chuyên khoa tiếp nhận bệnh án *</span>
              </label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-2 text-foreground outline-none focus:border-primary font-medium"
              >
                <option value="BS. CKI Nguyễn Mai Hoa">
                  BS. CKI Nguyễn Mai Hoa — BV Da Liễu Trung Ương (CCHN: 014289/BYT-CCHN)
                </option>
                <option value="BS. Trần Thị Ngọc Hà">
                  BS. Trần Thị Ngọc Hà — Cố vấn Y khoa SkinSense (CCHN: 034189/BYT-CCHN)
                </option>
              </select>
            </div>

            {/* Clinical Symptoms */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-foreground/90">
                Mô tả triệu chứng lâm sàng & cảm giác hiện tại *
              </label>
              <textarea
                rows={3}
                required
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Ví dụ: Da đỏ ửng sau khi ra nắng, xuất hiện mụn bọc vùng cằm và 2 má..."
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-2 text-foreground outline-none focus:border-primary resize-none leading-relaxed"
              />
            </div>

            {/* Allergies History */}
            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-foreground/90">
                Tiền sử dị ứng mỹ phẩm / thuốc bôi (nếu có)
              </label>
              <textarea
                rows={2}
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="Ví dụ: Dị ứng cồn khô, từng kích ứng với BHA nồng độ cao..."
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface-2 text-foreground outline-none focus:border-primary resize-none leading-relaxed"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-border text-xs font-semibold hover:bg-surface-2 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Đang gửi bệnh án lên Supabase...</span>
                ) : (
                  <>
                    <Send className="size-3.5" />
                    <span>Xuất & Gửi Bệnh Án Tới Bác Sĩ</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

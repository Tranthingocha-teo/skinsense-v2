"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Sparkles, Sun, Moon, Info, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  type RoleRoutine,
  type RoutineStep,
  DEFAULT_ROLE_ROUTINES,
} from "@/lib/role-routines";

export function AllocatedRoutineView() {
  const [routine, setRoutine] = useState<RoleRoutine>(DEFAULT_ROLE_ROUTINES.customer);
  const [isUpdatingStep, setIsUpdatingStep] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/routines?role=customer")
      .then((res) => res.json())
      .then((json) => {
        if (json.ok && json.routine) {
          setRoutine(json.routine);
        }
      })
      .catch((err) => console.error("Failed to load customer routine:", err));
  }, []);

  const steps = routine.steps || [];
  const total = steps.length;
  const completed = steps.filter((s) => s.isCompleted).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  async function handleToggleStep(step: RoutineStep) {
    setIsUpdatingStep(step.id);
    const newStatus = !step.isCompleted;

    // Optimistic UI update
    setRoutine((prev) => ({
      ...prev,
      steps: prev.steps.map((s) =>
        s.id === step.id ? { ...s, isCompleted: newStatus } : s
      ),
    }));

    try {
      const res = await fetch("/api/admin/routines", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "customer",
          stepId: step.id,
          isCompleted: newStatus,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(data.message, {
          description: `Đã hoàn thành ${data.completedCount}/${data.totalCount} bước (${data.percent}%)`,
        });
        if (data.routine) {
          setRoutine(data.routine);
        }
      } else {
        toast.error("Không thể cập nhật: " + (data.error || "Lỗi hệ thống"));
      }
    } catch {
      toast.error("Lỗi kết nối khi lưu trạng thái bước");
    } finally {
      setIsUpdatingStep(null);
    }
  }

  return (
    <section className="relative w-full max-w-[704px] mx-auto px-[18px] md:px-0 py-6 space-y-5">
      {/* Meta Header */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-700/10 text-emerald-950 dark:text-emerald-200 border border-emerald-800/30">
            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Phác Đồ Y Khoa Phân Bổ Bởi Admin & Bác Sĩ</span>
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface-2 text-foreground border border-border">
            {routine.treatmentDuration}
          </span>
        </div>

        <div>
          <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
            {routine.title}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
            {routine.description}
          </p>
        </div>

        <div className="pt-2 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Người thụ hưởng: <strong className="text-foreground">{routine.targetUser}</strong></span>
          <span>Phân bổ bởi: <strong className="text-foreground">{routine.allocatedBy}</strong></span>
        </div>
      </div>

      {/* Progress Card ("Có tích sau khi làm") */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-display text-sm font-bold text-foreground">
              Tiến Độ Skincare Hôm Nay
            </h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {completed}/{total} bước ({percent}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-surface-2 rounded-full h-3 overflow-hidden border border-border">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-sky-500 transition-all duration-500 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Step by Step Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
            <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>Sản Phẩm & Hướng Dẫn Sử Dụng Chi Tiết ({total} Bước)</span>
          </h3>
          <span className="text-xs text-muted-foreground">Tích sau khi hoàn thành</span>
        </div>

        <div className="space-y-3.5">
          {steps.map((step) => {
            const isDone = Boolean(step.isCompleted);
            const isStepBusy = isUpdatingStep === step.id;

            return (
              <div
                key={step.id}
                className={`rounded-2xl border transition-all p-4 sm:p-5 ${
                  isDone
                    ? "bg-card border-emerald-600/40 ring-1 ring-emerald-500/10 shadow-xs"
                    : "bg-card border-border hover:border-foreground/20"
                }`}
              >
                {/* Step Top Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-border gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="size-6 rounded-full bg-primary/10 text-primary font-bold text-xs grid place-items-center shrink-0">
                      {step.stepNumber}
                    </span>
                    <span className="font-display font-bold text-sm sm:text-base text-foreground">
                      {step.label}
                    </span>
                    {step.stepTime === "morning" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        <Sun className="size-3" />
                        <span>Sáng</span>
                      </span>
                    )}
                    {step.stepTime === "evening" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Moon className="size-3" />
                        <span>Tối</span>
                      </span>
                    )}
                    {step.stepTime === "both" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        <Sun className="size-3" />
                        <Moon className="size-3" />
                        <span>Sáng & Tối</span>
                      </span>
                    )}
                  </div>

                  {/* Tick Action Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleStep(step)}
                    disabled={isStepBusy}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 ${
                      isDone
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20"
                        : "bg-surface-2 text-foreground border border-border hover:border-emerald-600/50"
                    } ${isStepBusy ? "opacity-50 cursor-wait" : ""}`}
                  >
                    <CheckCircle2 className={`size-4 ${isDone ? "text-white" : "text-muted-foreground"}`} />
                    <span>{isStepBusy ? "Đang lưu..." : isDone ? "Đã làm ✓" : "Tích sau khi làm"}</span>
                  </button>
                </div>

                {/* Step Body */}
                <div className="flex flex-col sm:flex-row items-start gap-4 pt-3.5">
                  <img
                    src={step.imageUrl}
                    alt={step.productName}
                    className="size-20 sm:size-24 object-cover rounded-xl border border-border shadow-xs shrink-0 self-center sm:self-start"
                  />
                  <div className="flex-1 space-y-2.5 w-full">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                          {step.brand}
                        </span>
                        <span className="text-muted-foreground text-[10px]">·</span>
                        <span className="text-[10px] text-muted-foreground">
                          {step.category}
                        </span>
                      </div>
                      <h4 className="font-display text-sm font-bold text-foreground mt-0.5">
                        {step.productName}
                      </h4>
                    </div>

                    <div className="text-xs bg-surface-2/60 p-2 rounded-lg border border-border flex items-start gap-2">
                      <Sparkles className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-foreground">Hoạt chất: </strong>
                        <span className="text-muted-foreground">{step.activeIngredients}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg border border-border bg-card/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                          Liều lượng
                        </span>
                        <span className="text-foreground font-medium">{step.dosage}</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-border bg-card/60">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary block flex items-center gap-1">
                          <Info className="size-3" />
                          <span>Cách sử dụng</span>
                        </span>
                        <span className="text-foreground">{step.usageGuide}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";

export function ShareCompare({
  beforeUrl,
  afterUrl,
  beforeDate,
  afterDate,
  rednessValue,
}: {
  beforeUrl: string;
  afterUrl: string;
  beforeDate: string;
  afterDate: string;
  rednessValue?: number;
}) {
  const t = useTranslations("Trends");
  const format = useFormatter();
  const phone = useIsMobile();
  const [open, setOpen] = useState(false);
  const [showDates, setShowDates] = useState(true);
  const [showRedness, setShowRedness] = useState(false);
  const [blurEyes, setBlurEyes] = useState(true);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawCard = async (): Promise<HTMLCanvasElement> => {
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d context");

    // Background
    ctx.fillStyle = "#121417";
    ctx.fillRect(0, 0, 1080, 1080);

    // Load before & after images
    const loadImg = (url: string) =>
      new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img); // graceful fallback
        img.src = url;
      });

    const [imgA, imgB] = await Promise.all([loadImg(beforeUrl), loadImg(afterUrl)]);

    // Draw images side-by-side
    const imgW = 490;
    const imgH = 750;
    const topY = 160;

    // Draw before
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(35, topY, imgW, imgH, 20);
    ctx.clip();
    if (imgA.width > 0) {
      ctx.drawImage(imgA, 35, topY, imgW, imgH);
    } else {
      ctx.fillStyle = "#20242a";
      ctx.fillRect(35, topY, imgW, imgH);
    }
    if (blurEyes) {
      ctx.fillStyle = "rgba(18, 20, 23, 0.88)";
      ctx.fillRect(35, topY + imgH * 0.28, imgW, imgH * 0.16);
    }
    ctx.restore();

    // Draw after
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(555, topY, imgW, imgH, 20);
    ctx.clip();
    if (imgB.width > 0) {
      ctx.drawImage(imgB, 555, topY, imgW, imgH);
    } else {
      ctx.fillStyle = "#20242a";
      ctx.fillRect(555, topY, imgW, imgH);
    }
    if (blurEyes) {
      ctx.fillStyle = "rgba(18, 20, 23, 0.88)";
      ctx.fillRect(555, topY + imgH * 0.28, imgW, imgH * 0.16);
    }
    ctx.restore();

    // Wordmark & Branding header
    ctx.fillStyle = "#F5F5F7";
    ctx.font = "bold 38px sans-serif";
    ctx.fillText("SkinSense", 40, 90);

    ctx.fillStyle = "#A1A1A6";
    ctx.font = "20px sans-serif";
    ctx.fillText("Progress Comparison", 40, 125);

    // Dates overlay
    if (showDates) {
      ctx.fillStyle = "rgba(18, 20, 23, 0.85)";
      ctx.roundRect(55, topY + 20, 180, 48, 12);
      ctx.fill();
      ctx.roundRect(575, topY + 20, 180, 48, 12);
      ctx.fill();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "600 22px sans-serif";
      const dtA = format.dateTime(new Date(beforeDate), { day: "numeric", month: "short", year: "numeric" });
      const dtB = format.dateTime(new Date(afterDate), { day: "numeric", month: "short", year: "numeric" });
      ctx.fillText(dtA, 70, topY + 52);
      ctx.fillText(dtB, 590, topY + 52);
    }

    // Footer
    ctx.fillStyle = "#A1A1A6";
    ctx.font = "22px sans-serif";
    ctx.fillText("Personal Skin Diary · Private & On-Device", 40, 990);

    if (showRedness && rednessValue !== undefined) {
      ctx.fillStyle = "#34C759";
      ctx.font = "600 24px sans-serif";
      ctx.fillText(`Redness Index: ${(rednessValue * 100).toFixed(0)}%`, 40, 1030);
    }

    return canvas;
  };

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const canvas = await drawCard();
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `skinsense-compare-${Date.now()}.png`;
      a.click();
    } finally {
      setGenerating(false);
      setOpen(false);
    }
  };

  const trigger = (
    <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-lg border-foreground/15 text-xs font-medium">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
      </svg>
      <span>{t("share") || "Chia sẻ"}</span>
    </Button>
  );

  const controls = (
    <div className="flex flex-col gap-3 py-2">
      <div className="flex items-center justify-between">
        <span className="text-sm">Ẩn mắt (bảo vệ quyền riêng tư)</span>
        <Switch checked={blurEyes} onCheckedChange={setBlurEyes} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">Hiển thị ngày chụp</span>
        <Switch checked={showDates} onCheckedChange={setShowDates} />
      </div>
      {rednessValue !== undefined && (
        <div className="flex items-center justify-between">
          <span className="text-sm">Hiển thị chỉ số mẩn đỏ</span>
          <Switch checked={showRedness} onCheckedChange={setShowRedness} />
        </div>
      )}
    </div>
  );

  if (phone) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="gap-4 rounded-t-xl border-foreground/14 bg-card px-5 pt-3 pb-7">
          <DrawerTitle className="font-display text-xl font-medium">Chia sẻ ảnh trước / sau</DrawerTitle>
          <DrawerDescription className="text-xs text-muted-foreground">Tạo ảnh so sánh kèm ngày và chữ ký SkinSense để chia sẻ hoặc lưu máy.</DrawerDescription>
          {controls}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleDownload} disabled={generating} className="h-11 flex-1 rounded-lg">
              {generating ? "Đang tạo ảnh…" : "Tải ảnh về máy"}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex flex-col gap-4 rounded-2xl bg-surface-2 p-6 sm:max-w-[420px]">
        <DialogTitle className="font-display text-xl font-medium">Chia sẻ ảnh trước / sau</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">Tạo ảnh so sánh kèm ngày và chữ ký SkinSense để chia sẻ hoặc lưu máy.</DialogDescription>
        {controls}
        <div className="flex justify-end gap-2 pt-2">
          <DialogClose asChild>
            <Button variant="outline" className="h-10 rounded-lg">
              {t("cancel")}
            </Button>
          </DialogClose>
          <Button onClick={handleDownload} disabled={generating} className="h-10 rounded-lg px-5">
            {generating ? "Đang tạo ảnh…" : "Tải ảnh về máy"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

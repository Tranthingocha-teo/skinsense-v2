"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { measurePipeline, type PipelineMetrics } from "@/lib/capture-engine.web";
import { PORTRAIT } from "@/lib/demo";

// The real capture pipeline on the demo's sample photo, measured in the visitor's browser.
export function DemoMetrics() {
  const t = useTranslations("DemoMetrics");
  const [metrics, setMetrics] = useState<PipelineMetrics | "error">();

  useEffect(() => {
    const img = new Image();
    img.onload = () => measurePipeline(img).then((m) => setMetrics(m ?? "error"), () => setMetrics("error"));
    img.onerror = () => setMetrics("error");
    img.src = PORTRAIT;
  }, []);

  return (
    <section className="mx-5 mb-8 rounded-2xl border border-border bg-card p-4">
      <h2 className="font-display text-[17px] font-semibold">{t("title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("caption")}</p>
      {metrics === undefined ? (
        <p role="status" className="mt-3 text-sm text-muted-foreground">{t("measuring")}</p>
      ) : metrics === "error" ? (
        <p role="alert" className="mt-3 text-sm text-destructive">{t("error")}</p>
      ) : (
        <table className="mt-3 w-full text-[14.5px]">
          <tbody>
            {Object.entries(metrics).map(([key, value]) => (
              <tr key={key} className="border-b border-border last:border-0">
                <th scope="row" className="py-2 text-left font-normal text-muted-foreground">
                  {t(key as keyof PipelineMetrics)}
                </th>
                <td className="py-2 text-right tabular-nums">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

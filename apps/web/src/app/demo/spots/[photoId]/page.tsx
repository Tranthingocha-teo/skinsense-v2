import { DemoMetrics } from "@/components/demo-metrics";
import { DemoMarkSpots } from "../../demo-bindings";

export default async function DemoSpotsPage({ params }: PageProps<"/demo/spots/[photoId]">) {
  const { photoId } = await params;
  return (
    <main className="flex flex-1 flex-col">
      <DemoMarkSpots photoId={photoId} />
      <DemoMetrics />
    </main>
  );
}

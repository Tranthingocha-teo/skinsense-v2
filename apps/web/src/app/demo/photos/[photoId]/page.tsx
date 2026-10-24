import { DemoPhotoDetail } from "../../demo-bindings";

export default async function DemoPhotoPage({ params }: PageProps<"/demo/photos/[photoId]">) {
  const { photoId } = await params;
  return <DemoPhotoDetail photoId={photoId} />;
}

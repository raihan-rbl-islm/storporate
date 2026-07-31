import { LoadingPanel } from "@/components/ui/loading-panel";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <LoadingPanel label="Loading page" rows={4} />
    </main>
  );
}

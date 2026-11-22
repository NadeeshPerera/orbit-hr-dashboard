import Link from "next/link";
import { BrandMark } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <BrandMark className="mx-auto size-12" />
        <p className="mt-6 text-sm font-semibold text-primary">404</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">This page drifted out of orbit</h1>
        <p className="mt-2 text-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </main>
  );
}

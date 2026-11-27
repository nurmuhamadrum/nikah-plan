"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackButton({ className }: { className?: string }) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="default"
      onClick={handleBack}
      className={className}
    >
      <ArrowLeft className="h-4 w-4" />
      Sebelumnya
    </Button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ExternalLink, FileText, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ReceiptPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptPath: string | null;
  title: string;
}

export function ReceiptPreviewDialog({
  open,
  onOpenChange,
  receiptPath,
  title,
}: ReceiptPreviewDialogProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadUrl() {
      if (!open || !receiptPath) return;
      setLoading(true);
      setErrorMsg(null);
      setSignedUrl(null);
      try {
        // Jika sudah berbentuk http(s) URL penuh, langsung pakai
        if (receiptPath.startsWith("http")) {
          setSignedUrl(receiptPath);
          return;
        }
        const supabase = createClient();
        const { data, error } = await supabase.storage
          .from("receipts")
          .createSignedUrl(receiptPath, 300);

        if (!active) return;
        if (error || !data?.signedUrl) {
          setErrorMsg(error?.message || "Gagal memuat pratinjau bukti bayar.");
        } else {
          setSignedUrl(data.signedUrl);
        }
      } catch {
        if (active) {
          setErrorMsg("Gagal menghubungi Supabase Storage.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUrl();
    return () => {
      active = false;
    };
  }, [open, receiptPath]);

  const isPdf = receiptPath?.toLowerCase().endsWith(".pdf");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Bukti Pembayaran</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>

        <div className="min-h-[220px] flex items-center justify-center rounded-2xl bg-cream-50 border border-sage/10 p-3">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-xs text-sage-600">
              <Loader2 className="h-6 w-6 animate-spin text-sage" />
              <span>Memuat bukti bayar terenkripsi...</span>
            </div>
          ) : errorMsg ? (
            <div className="flex flex-col items-center gap-2 text-center p-4 text-xs text-terracotta-700">
              <AlertCircle className="h-6 w-6 text-terracotta" />
              <span>{errorMsg}</span>
            </div>
          ) : signedUrl ? (
            isPdf ? (
              <div className="text-center space-y-3 py-6">
                <FileText className="h-12 w-12 text-sage mx-auto" />
                <p className="text-sm font-medium text-sage-800">
                  Lampiran berbentuk dokumen PDF
                </p>
                <Button asChild variant="sage" size="sm">
                  <a href={signedUrl} target="_blank" rel="noreferrer">
                    Buka PDF di Tab Baru
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={signedUrl}
                alt={`Bukti bayar ${title}`}
                className="max-h-[65vh] w-auto rounded-xl object-contain"
              />
            )
          ) : null}
        </div>

        {signedUrl && !isPdf && (
          <div className="flex justify-end">
            <Button asChild variant="outline" size="sm">
              <a href={signedUrl} target="_blank" rel="noreferrer">
                Buka Ukuran Penuh
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

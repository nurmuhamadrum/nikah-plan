"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, Eye, MailOpen, Smartphone, UserRound } from "lucide-react";
import type { InvitationRsvp, WeddingInvitation } from "@/types/database";
import { INVITATION_THEMES } from "@/lib/invitation-themes";
import { InvitationRenderer } from "@/components/invitations/invitation-renderer";

interface LivePreviewPanelProps {
  invitation: WeddingInvitation;
  rsvps: InvitationRsvp[];
  savedSlug?: string | null;
  /** Tinggi layar viewport mockup ponsel */
  viewportHeightClass?: string;
}

export function LivePreviewPanel({
  invitation,
  rsvps,
  savedSlug,
  viewportHeightClass = "aspect-[9/19.5]",
}: LivePreviewPanelProps) {
  const [opened, setOpened] = useState(false);
  const [sampleGuest, setSampleGuest] = useState("Budi Santoso & Keluarga");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const themeMeta =
    INVITATION_THEMES[invitation.theme] ?? INVITATION_THEMES.BOTANICAL_SAGE;

  // Reset scroll ke atas setiap kali berganti mode Sampul <-> Isi
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [opened, invitation.theme]);

  return (
    <div className="space-y-3">
      {/* Toolbar Pratinjau */}
      <div className="rounded-2xl glass-strong border border-sage/12 p-3 shadow-card space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-sage/10 text-sage shrink-0">
              <Smartphone className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-sage-900 leading-tight truncate">
                Pratinjau Live
              </p>
              <p className="text-[10.5px] text-sage-600 truncate">
                {themeMeta.name} &bull; {themeMeta.styleLabel}
              </p>
            </div>
          </div>

          {savedSlug && (
            <Link
              href={`/u/${savedSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-sage/20 bg-white px-2.5 py-1 text-[11px] font-semibold text-sage-800 hover:bg-sage-50 transition-colors shrink-0"
            >
              <ExternalLink className="h-3 w-3" />
              Tab Baru
            </Link>
          )}
        </div>

        {/* Toggle Sampul <-> Isi Undangan */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-cream-100 p-1 border border-sage/10">
          <button
            type="button"
            onClick={() => setOpened(false)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-bold transition-all ${
              !opened
                ? "bg-white text-sage-900 shadow-sm"
                : "text-sage-600 hover:text-sage-900"
            }`}
          >
            <MailOpen className="h-3.5 w-3.5" />
            Sampul Depan
          </button>
          <button
            type="button"
            onClick={() => setOpened(true)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-bold transition-all ${
              opened
                ? "bg-white text-sage-900 shadow-sm"
                : "text-sage-600 hover:text-sage-900"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            Isi Undangan
          </button>
        </div>

        {/* Input Simulasi Nama Tamu (?to=...) */}
        <div className="flex items-center gap-2 rounded-xl border border-sage/15 bg-white px-2.5 py-1.5">
          <UserRound className="h-3.5 w-3.5 text-sage-500 shrink-0" />
          <input
            type="text"
            value={sampleGuest}
            onChange={(e) => setSampleGuest(e.target.value)}
            placeholder="Simulasi nama tamu (?to=...)"
            aria-label="Simulasi nama tamu"
            className="w-full bg-transparent text-[11.5px] text-sage-900 placeholder:text-sage-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Smartphone Mockup Frame (bezel hitam solid & proporsi layar modern) */}
      <div className="mx-auto w-full max-w-[368px] lg:max-w-[356px] rounded-[2.75rem] border-[8px] border-[#111111] bg-[#111111] shadow-lift ring-1 ring-black/20 overflow-hidden">
        {/* Top Status Bar & Dynamic Island */}
        <div className="relative flex items-center justify-between bg-[#111111] px-5 pt-2 pb-1.5 text-[10px] font-semibold text-white/85 select-none">
          <span>09:41</span>
          <span className="h-4 w-24 rounded-full bg-black ring-1 ring-white/15" />
          <span className="tracking-tight">5G</span>
        </div>

        {/* Scrollable Embedded Invitation Screen */}
        <div className="relative overflow-hidden rounded-b-[2.25rem] bg-white">
          <div
            ref={scrollContainerRef}
            className={`relative w-full ${viewportHeightClass} ${
              opened ? "overflow-y-auto" : "overflow-hidden"
            }`}
          >
            <InvitationRenderer
              invitation={invitation}
              initialRsvps={rsvps}
              guestNameParam={sampleGuest}
              mode="embedded"
              controlledOpened={opened}
              onToggleOpened={setOpened}
            />
          </div>

          {/* Bottom Home Indicator Bar */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-1.5 z-30 flex justify-center"
          >
            <span className="h-1 w-28 rounded-full bg-black/25 backdrop-blur-sm" />
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-sage-600">
        Perubahan langsung tampil di pratinjau. Klik{" "}
        <strong className="text-sage-800">Simpan</strong> untuk menerapkan ke
        tautan publik.
      </p>
    </div>
  );
}

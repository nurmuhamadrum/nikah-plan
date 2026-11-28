"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";
import type { WorkspaceActivity } from "@/types/database";
import { formatRelativeTimeID } from "@/lib/activity-logger";
import { Card, CardContent } from "@/components/ui/card";

interface ActivityLogCardProps {
  activities: WorkspaceActivity[];
}

export function ActivityLogCard({ activities }: ActivityLogCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (activities.length === 0) {
    return (
      <Card className="rounded-3xl border border-black/[0.06] bg-white shadow-card">
        <CardContent className="p-5 flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#F4F5F7] text-[#4F6BF6]">
            <Activity className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-sm font-bold text-[#141618]">
              Riwayat Perubahan Pasangan
            </p>
            <p className="text-xs text-[#5F6978]">
              Setiap perubahan vendor, pelunasan termin, atau setoran tabungan
              dari Anda &amp; pasangan akan otomatis tercatat real-time di sini.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const visibleItems = expanded ? activities.slice(0, 15) : activities.slice(0, 5);

  return (
    <Card className="rounded-3xl border border-black/[0.06] bg-white shadow-card">
      <CardContent className="p-5 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F6BF6]">
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-display text-sm font-bold text-[#141618]">
                Riwayat Perubahan Pasangan
              </h2>
              <p className="text-[11px] text-[#5F6978]">
                Sinkronisasi real-time antar perangkat
              </p>
            </div>
          </div>

          {activities.length > 5 && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-full bg-[#F4F5F7] px-2.5 py-1 text-[11px] font-semibold text-[#141618] hover:bg-[#E5E9F0] transition-colors"
            >
              {expanded ? (
                <>
                  Ringkas <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  Lihat Semua ({activities.length}){" "}
                  <ChevronDown className="h-3 w-3" />
                </>
              )}
            </button>
          )}
        </div>

        <div className="space-y-2">
          {visibleItems.map((act) => {
            const initials = act.actor_name
              .split(" ")
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join("");

            const rowContent = (
              <div className="flex items-start gap-2.5 rounded-2xl border border-black/[0.05] bg-[#FAFAFB] px-3 py-2.5 hover:border-black/15 transition-colors">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-midnight-btn text-[10px] font-bold text-white mt-0.5">
                  {initials || "NP"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[#141618] leading-snug">
                    <strong className="font-bold">{act.actor_name}</strong>{" "}
                    {act.summary}
                  </p>
                  <p className="text-[10.5px] text-[#5F6978] mt-0.5">
                    {formatRelativeTimeID(act.created_at)}
                  </p>
                </div>
              </div>
            );

            return act.entity_path ? (
              <Link key={act.id} href={act.entity_path} className="block">
                {rowContent}
              </Link>
            ) : (
              <div key={act.id}>{rowContent}</div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

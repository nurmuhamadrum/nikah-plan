"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  HeartHandshake,
  LogOut,
  MessageCircle,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import type { Profile, Workspace } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SettingsClientProps {
  profile: Profile;
  workspace: Workspace;
  members: { full_name: string; email: string; role: string }[];
  inviteUrl: string;
}

export function SettingsClient({
  profile,
  workspace,
  members,
  inviteUrl,
}: SettingsClientProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const waText = `Hai sayang! Yuk kelola bareng budget pernikahan kita (${workspace.couple_title}) di NikahPlan. Gabung gratis via tautan ini ya: ${inviteUrl}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-sage-900">
          Profil &amp; Workspace
        </h1>
        <p className="text-xs sm:text-sm text-sage-600 mt-1">
          Kelola akun pasangan, tautan undangan, dan preferensi rencana Anda.
        </p>
      </div>

      {/* Info Akun & Paket */}
      <Card className="rounded-3xl border-sage/12 bg-white shadow-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="font-display text-xl">
              {workspace.couple_title}
            </CardTitle>
            <Badge variant="softTerracotta">
              {workspace.plan === "COMPLETE_PASS"
                ? "Complete Couple Pass"
                : "Wedding Only Pass"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-sage-700 space-y-1">
            <p>
              Masuk sebagai:{" "}
              <strong className="text-sage-900">{profile.full_name}</strong>
            </p>
            <p className="text-xs text-sage-600">{profile.email}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/onboarding?edit=1">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Ubah Target Budget &amp; Honeymoon
              </Link>
            </Button>
            <form action="/auth/signout" method="post">
              <Button variant="ghost" size="sm" type="submit" className="text-terracotta-700">
                <LogOut className="h-3.5 w-3.5" />
                Keluar Akun
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Anggota & Undang Pasangan */}
      <Card className="rounded-3xl border-sage/12 bg-white shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base inline-flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-sage" />
            Anggota Workspace ({members.length} / 2)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.email}
                className="flex items-center justify-between rounded-xl bg-cream-50 border border-sage/10 px-3.5 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sage-900 truncate">
                    {m.full_name}
                  </p>
                  <p className="text-xs text-sage-600 truncate">{m.email}</p>
                </div>
                <Badge variant={m.role === "OWNER" ? "default" : "softSage"}>
                  {m.role}
                </Badge>
              </div>
            ))}
          </div>

          {members.length < 2 && (
            <div className="rounded-2xl border border-sage/15 bg-cream-50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-bold text-sage-900">
                  <HeartHandshake className="h-4 w-4 text-terracotta" />
                  Undang Pasangan (Tanpa Bayar Ulang)
                </span>
                <span className="font-mono text-xs font-bold bg-white border border-sage/15 px-2 py-0.5 rounded-lg">
                  {workspace.invite_code}
                </span>
              </div>
              <div className="rounded-xl bg-white border border-sage/10 px-3 py-2 font-mono text-xs text-sage-700 truncate">
                {inviteUrl}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-sage" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Salin Tautan
                    </>
                  )}
                </Button>
                <Button asChild variant="sage" size="sm">
                  <a href={waUrl} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-3.5 w-3.5" />
                    Share WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

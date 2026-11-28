"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  Gift,
  Globe,
  Heart,
  HelpCircle,
  ImagePlus,
  Loader2,
  Lock,
  Mail,
  Music2,
  Palette,
  Pause,
  Play,
  Plus,
  Save,
  Search,
  Send,
  Sparkles,
  Trash2,
  Users,
  Wand2,
  X,
} from "lucide-react";
import type {
  GiftAccountItem,
  InvitationMusicPreset,
  InvitationRsvp,
  InvitationTheme,
  LoveStoryItem,
  WeddingInvitation,
  Workspace,
} from "@/types/database";
import {
  AmbientMusicPlayer,
  INVITATION_MUSIC_PRESETS,
  getMusicPresetMeta,
  inspectDirectAudioUrl,
} from "@/lib/ambient-music";
import { createClient } from "@/lib/supabase/client";
import {
  compressImage,
  formatFileSize,
  IMAGE_COMPRESSION_PRESETS,
} from "@/lib/image-compression";
import {
  DEFAULT_CLOSING_MESSAGE,
  DEFAULT_OPENING_QUOTE,
  DEFAULT_QUOTE_SOURCE,
  INVITATION_THEMES,
  INVITATION_THEME_LIST,
  slugifyInvitation,
  splitCoupleNames,
} from "@/lib/invitation-themes";
import { LivePreviewPanel } from "@/components/invitations/live-preview-panel";
import { GuestShareManager } from "@/components/invitations/guest-share-manager";
import { exportRsvpToExcel } from "@/lib/export-reports";
import { useToast } from "@/components/providers/toast-provider";
import { useConfirm } from "@/components/providers/confirm-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";

type BuilderTab = "tema" | "acara" | "amplop" | "rsvp";

const BUILDER_TABS: { id: BuilderTab; label: string; icon: typeof Palette }[] =
  [
    { id: "tema", label: "Tema & Mempelai", icon: Palette },
    { id: "acara", label: "Acara & Kisah", icon: Calendar },
    { id: "amplop", label: "Amplop & Galeri", icon: Gift },
    { id: "rsvp", label: "Kirim & RSVP", icon: Send },
  ];

interface UndanganClientProps {
  workspace: Workspace;
  initialInvitation: WeddingInvitation | null;
  initialRsvps: InvitationRsvp[];
  appUrl: string;
  migrationMissing?: boolean;
}

export function UndanganClient({
  workspace,
  initialInvitation,
  initialRsvps,
  appUrl,
  migrationMissing = false,
}: UndanganClientProps) {
  const [defaultGroom, defaultBride] = useMemo(
    () => splitCoupleNames(workspace.couple_title),
    [workspace.couple_title]
  );

  const [activeTab, setActiveTab] = useState<BuilderTab>("tema");
  const [savedInvitation, setSavedInvitation] =
    useState<WeddingInvitation | null>(initialInvitation);

  // Form states
  const [slug, setSlug] = useState<string>(
    initialInvitation?.slug || slugifyInvitation(workspace.couple_title)
  );
  const [isPublished, setIsPublished] = useState<boolean>(
    initialInvitation?.is_published ?? false
  );
  const [theme, setTheme] = useState<InvitationTheme>(
    initialInvitation?.theme ?? "BOTANICAL_SAGE"
  );

  const [groomName, setGroomName] = useState(
    initialInvitation?.groom_name || defaultGroom
  );
  const [groomFullName, setGroomFullName] = useState(
    initialInvitation?.groom_full_name || ""
  );
  const [groomParents, setGroomParents] = useState(
    initialInvitation?.groom_parents || ""
  );
  const [groomInstagram, setGroomInstagram] = useState(
    initialInvitation?.groom_instagram || ""
  );

  const [brideName, setBrideName] = useState(
    initialInvitation?.bride_name || defaultBride
  );
  const [brideFullName, setBrideFullName] = useState(
    initialInvitation?.bride_full_name || ""
  );
  const [brideParents, setBrideParents] = useState(
    initialInvitation?.bride_parents || ""
  );
  const [brideInstagram, setBrideInstagram] = useState(
    initialInvitation?.bride_instagram || ""
  );

  const [openingQuote, setOpeningQuote] = useState(
    initialInvitation?.opening_quote ?? DEFAULT_OPENING_QUOTE
  );
  const [quoteSource, setQuoteSource] = useState(
    initialInvitation?.quote_source ?? DEFAULT_QUOTE_SOURCE
  );
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(
    initialInvitation?.cover_photo_url || ""
  );

  const [akadDate, setAkadDate] = useState(
    initialInvitation?.akad_date || workspace.wedding_date || ""
  );
  const [akadTime, setAkadTime] = useState(
    initialInvitation?.akad_time || "08:00 - 10:00 WIB"
  );
  const [akadVenue, setAkadVenue] = useState(
    initialInvitation?.akad_venue || ""
  );
  const [akadAddress, setAkadAddress] = useState(
    initialInvitation?.akad_address || ""
  );
  const [akadMapsUrl, setAkadMapsUrl] = useState(
    initialInvitation?.akad_maps_url || ""
  );

  const [resepsiDate, setResepsiDate] = useState(
    initialInvitation?.resepsi_date || workspace.wedding_date || ""
  );
  const [resepsiTime, setResepsiTime] = useState(
    initialInvitation?.resepsi_time || "11:00 - 14:00 WIB"
  );
  const [resepsiVenue, setResepsiVenue] = useState(
    initialInvitation?.resepsi_venue || ""
  );
  const [resepsiAddress, setResepsiAddress] = useState(
    initialInvitation?.resepsi_address || ""
  );
  const [resepsiMapsUrl, setResepsiMapsUrl] = useState(
    initialInvitation?.resepsi_maps_url || ""
  );

  const [loveStories, setLoveStories] = useState<LoveStoryItem[]>(
    Array.isArray(initialInvitation?.love_stories)
      ? initialInvitation.love_stories
      : []
  );
  const [giftAccounts, setGiftAccounts] = useState<GiftAccountItem[]>(
    Array.isArray(initialInvitation?.gift_accounts)
      ? initialInvitation.gift_accounts
      : []
  );
  const [giftAddress, setGiftAddress] = useState(
    initialInvitation?.gift_address || ""
  );
  const [galleryUrls, setGalleryUrls] = useState<string[]>(
    Array.isArray(initialInvitation?.gallery_urls)
      ? initialInvitation.gallery_urls
      : []
  );
  const [showRsvp, setShowRsvp] = useState(
    initialInvitation?.show_rsvp ?? true
  );
  const [showGift, setShowGift] = useState(
    initialInvitation?.show_gift ?? true
  );
  const [closingMessage, setClosingMessage] = useState(
    initialInvitation?.closing_message ?? DEFAULT_CLOSING_MESSAGE
  );
  const [musicPreset, setMusicPreset] = useState<InvitationMusicPreset>(
    initialInvitation?.music_preset ?? "ROMANTIC_PIANO"
  );
  const [musicUrl, setMusicUrl] = useState(initialInvitation?.music_url || "");
  const [openThemeAccordion, setOpenThemeAccordion] = useState(false);
  const [openMusicAccordion, setOpenMusicAccordion] = useState(false);
  const [showAudioUrlGuide, setShowAudioUrlGuide] = useState(false);
  const activeThemeMeta =
    INVITATION_THEMES[theme] ?? INVITATION_THEMES.BOTANICAL_SAGE;
  const activeMusicMeta = getMusicPresetMeta(musicPreset);
  const audioUrlInspection = useMemo(
    () => inspectDirectAudioUrl(musicUrl),
    [musicUrl]
  );
  const previewPlayerRef = useRef<AmbientMusicPlayer | null>(null);
  const [previewPlayingPreset, setPreviewPlayingPreset] =
    useState<InvitationMusicPreset | null>(null);

  useEffect(() => {
    return () => {
      previewPlayerRef.current?.destroy();
      previewPlayerRef.current = null;
    };
  }, []);

  const handleTogglePreviewMusic = async (preset: InvitationMusicPreset) => {
    if (preset === "OFF") {
      previewPlayerRef.current?.stop();
      setPreviewPlayingPreset(null);
      return;
    }
    if (!previewPlayerRef.current) {
      previewPlayerRef.current = new AmbientMusicPlayer();
    }
    if (previewPlayingPreset === preset) {
      previewPlayerRef.current.stop();
      setPreviewPlayingPreset(null);
      return;
    }
    const ok = await previewPlayerRef.current.start(
      preset,
      preset === "CUSTOM" ? musicUrl : null
    );
    setPreviewPlayingPreset(ok ? preset : null);
  };

  // UI & upload states
  const [saving, setSaving] = useState(false);
  const [coverUploadStatus, setCoverUploadStatus] = useState<string | null>(
    null
  );
  const [galleryUploadStatus, setGalleryUploadStatus] = useState<string | null>(
    null
  );
  const uploadingCover = coverUploadStatus !== null;
  const uploadingGallery = galleryUploadStatus !== null;
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const globalToast = useToast();
  const confirm = useConfirm();

  // RSVP list & pagination
  const [rsvps, setRsvps] = useState<InvitationRsvp[]>(initialRsvps);
  const [deletingRsvpId, setDeletingRsvpId] = useState<string | null>(null);
  const [rsvpSearch, setRsvpSearch] = useState("");
  const [rsvpFilter, setRsvpFilter] = useState<
    "ALL" | "HADIR" | "RAGU" | "TIDAK_HADIR"
  >("ALL");
  const [rsvpPage, setRsvpPage] = useState(1);
  const RSVP_PAGE_SIZE = 10;

  const filteredRsvps = useMemo(() => {
    const q = rsvpSearch.trim().toLowerCase();
    return rsvps.filter((item) => {
      if (rsvpFilter !== "ALL" && item.attendance !== rsvpFilter) return false;
      if (
        q &&
        !item.guest_name.toLowerCase().includes(q) &&
        !(item.message || "").toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [rsvps, rsvpSearch, rsvpFilter]);

  useEffect(() => {
    setRsvpPage(1);
  }, [rsvpSearch, rsvpFilter]);

  const rsvpTotalPages = Math.max(
    1,
    Math.ceil(filteredRsvps.length / RSVP_PAGE_SIZE)
  );
  const safeRsvpPage = Math.min(rsvpPage, rsvpTotalPages);
  const paginatedRsvps = useMemo(() => {
    const start = (safeRsvpPage - 1) * RSVP_PAGE_SIZE;
    return filteredRsvps.slice(start, start + RSVP_PAGE_SIZE);
  }, [filteredRsvps, safeRsvpPage]);

  const normalizedSlug = slugifyInvitation(slug);
  const publicUrl = `${appUrl}/u/${savedInvitation?.slug || normalizedSlug}`;

  const draftInvitation = useMemo<WeddingInvitation>(
    () => ({
      id: savedInvitation?.id || "draft-preview",
      workspace_id: workspace.id,
      slug: normalizedSlug,
      is_published: isPublished,
      theme,
      groom_name: groomName.trim() || "Mempelai Pria",
      groom_full_name: groomFullName.trim(),
      groom_parents: groomParents.trim(),
      groom_instagram: groomInstagram.trim() || null,
      bride_name: brideName.trim() || "Mempelai Wanita",
      bride_full_name: brideFullName.trim(),
      bride_parents: brideParents.trim(),
      bride_instagram: brideInstagram.trim() || null,
      opening_quote: openingQuote.trim(),
      quote_source: quoteSource.trim(),
      cover_photo_url: coverPhotoUrl || null,
      akad_date: akadDate || null,
      akad_time: akadTime.trim(),
      akad_venue: akadVenue.trim(),
      akad_address: akadAddress.trim(),
      akad_maps_url: akadMapsUrl.trim() || null,
      resepsi_date: resepsiDate || null,
      resepsi_time: resepsiTime.trim(),
      resepsi_venue: resepsiVenue.trim(),
      resepsi_address: resepsiAddress.trim(),
      resepsi_maps_url: resepsiMapsUrl.trim() || null,
      love_stories: loveStories.filter((s) => s.title.trim().length > 0),
      gift_accounts: giftAccounts.filter(
        (g) => g.bank.trim().length > 0 && g.accountNumber.trim().length > 0
      ),
      gift_address: giftAddress.trim() || null,
      gallery_urls: galleryUrls,
      show_rsvp: showRsvp,
      show_gift: showGift,
      closing_message: closingMessage.trim(),
      music_preset: musicPreset,
      music_url: musicUrl.trim() || null,
      created_at: savedInvitation?.created_at || "",
      updated_at: savedInvitation?.updated_at || "",
    }),
    [
      savedInvitation,
      workspace.id,
      normalizedSlug,
      isPublished,
      theme,
      groomName,
      groomFullName,
      groomParents,
      groomInstagram,
      brideName,
      brideFullName,
      brideParents,
      brideInstagram,
      openingQuote,
      quoteSource,
      coverPhotoUrl,
      akadDate,
      akadTime,
      akadVenue,
      akadAddress,
      akadMapsUrl,
      resepsiDate,
      resepsiTime,
      resepsiVenue,
      resepsiAddress,
      resepsiMapsUrl,
      loveStories,
      giftAccounts,
      giftAddress,
      galleryUrls,
      showRsvp,
      showGift,
      closingMessage,
      musicPreset,
      musicUrl,
    ]
  );

  const rsvpStats = useMemo(() => {
    const hadir = rsvps.filter((r) => r.attendance === "HADIR");
    const ragu = rsvps.filter((r) => r.attendance === "RAGU");
    const tidak = rsvps.filter((r) => r.attendance === "TIDAK_HADIR");
    const totalPax = hadir.reduce((s, r) => s + (r.guest_count || 1), 0);
    return {
      hadirCount: hadir.length,
      totalPax,
      raguCount: ragu.length,
      tidakCount: tidak.length,
    };
  }, [rsvps]);

  // =========================================================================
  // GUARD: HANYA UNTUK PAKET COMPLETE_PASS
  // =========================================================================
  if (workspace.plan !== "COMPLETE_PASS") {
    return (
      <div className="space-y-5 pb-8">
        <Card className="relative overflow-hidden rounded-3xl border-0 bg-midnight-luxury text-white shadow-lift">
          <CardContent className="relative z-10 p-6 sm:p-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-amberwarm border border-white/20">
              <Lock className="h-7 w-7" />
            </div>
            <Badge
              variant="outline"
              className="border-white/25 bg-white/10 text-cream-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-amberwarm" />
              Eksklusif Complete Couple Pass
            </Badge>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-cream-50">
              Buat Undangan Online Sendiri Tanpa Biaya Tambahan
            </h1>
            <p className="text-xs sm:text-sm text-cream-200/90 max-w-lg mx-auto leading-relaxed">
              Paket aktif Anda adalah <strong>Wedding Only Pass</strong>.
              Upgrade ke <strong>Complete Couple Pass</strong> untuk membuka
              Pembuat Undangan Digital (hemat Rp 500rb–1,5 Jt biaya cetak!),
              lengkap dengan 8 tema beragam layout &amp; ornamen, tautan
              personalisasi WhatsApp, Amplop Digital, RSVP tamu, serta Honeymoon
              Planner.
            </p>
            <div className="pt-2">
              <Button asChild size="lg">
                <Link href="/checkout?upgrade=1">
                  Upgrade ke Complete Couple Pass
                  <Sparkles className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview 8 Tema yang akan didapat */}
        <Card className="glass-strong rounded-3xl shadow-card">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="text-center space-y-1">
              <p className="font-script text-3xl text-terracotta leading-none">
                8 Tema Beragam Layout
              </p>
              <h2 className="font-display text-lg font-semibold text-sage-900">
                Siap Dipublikasikan di Tautan Kalian Sendiri
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INVITATION_THEME_LIST.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-sage/12 bg-white/90 p-4 flex items-center gap-3"
                >
                  <div className="flex -space-x-1.5 shrink-0">
                    {t.swatches.map((hex) => (
                      <span
                        key={hex}
                        className="h-7 w-7 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-bold text-sage-900">{t.name}</p>
                      <span className="rounded-full bg-cream-100 border border-sage/15 px-2 py-0.5 text-[10px] font-semibold text-sage-700">
                        {t.styleLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-sage-600 line-clamp-1 mt-0.5">
                      {t.tagline}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // =========================================================================
  // HANDLERS (COMPLETE_PASS)
  // =========================================================================
  const handleSave = async (overridePublish?: boolean) => {
    const nextPublish =
      typeof overridePublish === "boolean" ? overridePublish : isPublished;

    const ok = await confirm({
      title: nextPublish
        ? "Simpan & Publikasikan Undangan?"
        : "Simpan Draft Undangan?",
      description: nextPublish
        ? `Undangan "${groomName || "Mempelai Pria"} & ${brideName || "Mempelai Wanita"}" akan live dan dapat diakses publik di /u/${normalizedSlug}.`
        : `Perubahan undangan akan disimpan sebagai draft di /u/${normalizedSlug} (belum tampil ke publik).`,
      confirmLabel: nextPublish ? "Ya, Publikasikan" : "Ya, Simpan Draft",
    });
    if (!ok) return;

    setSaving(true);
    setToast(null);

    try {
      const res = await fetch("/api/invitations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: normalizedSlug,
          is_published: nextPublish,
          theme,
          groom_name: groomName,
          groom_full_name: groomFullName,
          groom_parents: groomParents,
          groom_instagram: groomInstagram || null,
          bride_name: brideName,
          bride_full_name: brideFullName,
          bride_parents: brideParents,
          bride_instagram: brideInstagram || null,
          opening_quote: openingQuote,
          quote_source: quoteSource,
          cover_photo_url: coverPhotoUrl || null,
          akad_date: akadDate || null,
          akad_time: akadTime,
          akad_venue: akadVenue,
          akad_address: akadAddress,
          akad_maps_url: akadMapsUrl || null,
          resepsi_date: resepsiDate || null,
          resepsi_time: resepsiTime,
          resepsi_venue: resepsiVenue,
          resepsi_address: resepsiAddress,
          resepsi_maps_url: resepsiMapsUrl || null,
          love_stories: loveStories.filter((s) => s.title.trim()),
          gift_accounts: giftAccounts.filter(
            (g) => g.bank.trim() && g.accountNumber.trim()
          ),
          gift_address: giftAddress || null,
          gallery_urls: galleryUrls.filter(Boolean),
          show_rsvp: showRsvp,
          show_gift: showGift,
          closing_message: closingMessage,
          music_preset: musicPreset,
          music_url: musicUrl.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Gagal menyimpan undangan.";
        setToast({ type: "error", text: msg });
        globalToast.error("Gagal menyimpan undangan", msg);
      } else {
        setSavedInvitation(data.invitation as WeddingInvitation);
        setIsPublished(nextPublish);
        setSlug(data.invitation.slug);
        const msg = nextPublish
          ? `Undangan berhasil disimpan & dipublikasikan di /u/${data.invitation.slug}!`
          : "Draft undangan berhasil disimpan.";
        setToast({ type: "success", text: msg });
        globalToast.success(
          nextPublish ? "Undangan dipublikasikan!" : "Draft undangan disimpan",
          `/u/${data.invitation.slug}`
        );
      }
    } catch {
      setToast({
        type: "error",
        text: "Kendala jaringan. Pastikan perangkat online untuk menyimpan undangan.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async (
    files: File | File[],
    kind: "cover" | "gallery"
  ) => {
    const fileList = Array.isArray(files) ? files : [files];
    if (fileList.length === 0) return;

    const remainingSlots =
      kind === "cover" ? 1 : Math.max(0, 6 - galleryUrls.length);
    if (remainingSlots <= 0) {
      setToast({
        type: "error",
        text: "Galeri sudah mencapai batas maksimal 6 foto.",
      });
      return;
    }

    const targets = fileList.slice(0, remainingSlots);
    const invalid = targets.find((f) => !f.type.startsWith("image/"));
    if (invalid) {
      setToast({
        type: "error",
        text: "Format foto harus berupa JPG, PNG, atau WebP.",
      });
      return;
    }

    setToast(null);
    const supabase = createClient();
    const preset =
      kind === "cover"
        ? IMAGE_COMPRESSION_PRESETS.INVITATION_COVER
        : IMAGE_COMPRESSION_PRESETS.INVITATION_GALLERY;

    let totalOriginal = 0;
    let totalCompressed = 0;
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < targets.length; i++) {
        const file = targets[i];
        const stepLabel =
          targets.length > 1 ? ` (${i + 1}/${targets.length})` : "";

        if (kind === "cover") {
          setCoverUploadStatus(`Mengompresi${stepLabel}...`);
        } else {
          setGalleryUploadStatus(`Mengompresi${stepLabel}...`);
        }

        const compressed = await compressImage(file, preset);
        totalOriginal += compressed.originalSize;
        totalCompressed += compressed.compressedSize;

        if (kind === "cover") {
          setCoverUploadStatus(`Mengunggah${stepLabel}...`);
        } else {
          setGalleryUploadStatus(`Mengunggah${stepLabel}...`);
        }

        const storagePath = `${workspace.id}/${kind}-${Date.now()}-${i}.${compressed.ext}`;
        const { error: upErr } = await supabase.storage
          .from("invitations")
          .upload(storagePath, compressed.blob, {
            contentType: compressed.contentType,
            upsert: true,
          });

        if (upErr) {
          throw new Error(
            upErr.message.includes("not found")
              ? "Bucket storage `invitations` belum ada. Jalankan Migration 004 di Supabase SQL Editor."
              : upErr.message
          );
        }

        const { data: pub } = supabase.storage
          .from("invitations")
          .getPublicUrl(storagePath);

        uploadedUrls.push(pub.publicUrl);
      }

      const savedPct =
        totalOriginal > 0
          ? Math.max(
              0,
              Math.round(((totalOriginal - totalCompressed) / totalOriginal) * 100)
            )
          : 0;
      const compressionSummary =
        savedPct > 0
          ? ` (${formatFileSize(totalOriginal)} → ${formatFileSize(totalCompressed)} · hemat ${savedPct}%)`
          : ` (${formatFileSize(totalCompressed)})`;

      if (kind === "cover" && uploadedUrls[0]) {
        setCoverPhotoUrl(uploadedUrls[0]);
        const msg = `Foto cover berhasil diunggah${compressionSummary}! Klik Simpan untuk menerapkan.`;
        setToast({ type: "success", text: msg });
        globalToast.success("Foto cover diunggah", msg);
      } else if (uploadedUrls.length > 0) {
        setGalleryUrls((prev) => [...prev, ...uploadedUrls].slice(0, 6));
        const msg = `${uploadedUrls.length} foto galeri ditambahkan${compressionSummary}! Klik Simpan untuk menerapkan.`;
        setToast({ type: "success", text: msg });
        globalToast.success("Foto galeri diunggah", msg);
      }
    } catch (err) {
      if (kind === "gallery" && uploadedUrls.length > 0) {
        setGalleryUrls((prev) => [...prev, ...uploadedUrls].slice(0, 6));
      }
      const msg = err instanceof Error ? err.message : "Gagal mengunggah foto.";
      setToast({ type: "error", text: msg });
      globalToast.error("Gagal mengunggah foto", msg);
    } finally {
      if (kind === "cover") setCoverUploadStatus(null);
      else setGalleryUploadStatus(null);
    }
  };

  const handleDeleteRsvp = async (id: string) => {
    const target = rsvps.find((r) => r.id === id);
    const ok = await confirm({
      title: "Hapus Ucapan RSVP?",
      description: target
        ? `Hapus konfirmasi & ucapan dari "${target.guest_name}"?`
        : "Hapus ucapan tamu ini dari daftar RSVP?",
      confirmLabel: "Ya, Hapus Ucapan",
      variant: "destructive",
    });
    if (!ok) return;

    setDeletingRsvpId(id);
    try {
      const res = await fetch(`/api/invitations/rsvp/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRsvps((prev) => prev.filter((r) => r.id !== id));
        globalToast.success(
          "Ucapan RSVP dihapus",
          target ? `Ucapan dari "${target.guest_name}" telah dihapus.` : undefined
        );
      } else {
        globalToast.error("Gagal menghapus ucapan RSVP");
      }
    } catch {
      globalToast.error("Gagal menghapus ucapan RSVP", "Kendala jaringan.");
    } finally {
      setDeletingRsvpId(null);
    }
  };

  const handleCopyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedSlug(true);
      globalToast.success("Tautan undangan disalin", publicUrl);
      setTimeout(() => setCopiedSlug(false), 2000);
    } catch {
      globalToast.error("Gagal menyalin tautan");
    }
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header Banner */}
      <Card className="relative overflow-hidden rounded-3xl border-0 bg-midnight-luxury text-white shadow-lift">
        <CardContent className="relative z-10 p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge
              variant="outline"
              className="border-white/25 bg-white/10 text-cream-50 text-[11px]"
            >
              <Mail className="h-3 w-3 text-amberwarm" />
              Undangan Digital &bull; Complete Pass
            </Badge>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${
                isPublished
                  ? "bg-emerald-500/20 text-emerald-100 border border-emerald-300/35"
                  : "bg-white/15 text-cream-100 border border-white/20"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isPublished ? "bg-emerald-400 animate-pulse" : "bg-amberwarm"
                }`}
              />
              {isPublished ? "Live Publik" : "Draft"}
            </span>
          </div>

          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-cream-50">
              Pembuat Undangan Online
            </h1>
            <p className="text-xs sm:text-sm text-cream-200/90 mt-1">
              Desain undangan digital Anda sendiri, kirim tautan personal ke
              WhatsApp tamu, dan pantau RSVP secara real-time.
            </p>
          </div>

          {/* URL Bar + Quick Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-2 rounded-2xl bg-white/10 border border-white/15 p-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 min-w-0 flex-1 px-1.5">
              <Globe className="h-4 w-4 text-amberwarm shrink-0" />
              <span className="text-xs font-mono text-cream-100 truncate">
                {publicUrl}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowMobilePreview(true)}
                className="lg:hidden h-8 px-3 text-xs border-amberwarm/45 bg-amberwarm/20 text-cream-50 hover:bg-amberwarm/30"
              >
                <Eye className="h-3.5 w-3.5" />
                Pratinjau Live
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCopyPublicUrl}
                className="h-8 px-3 text-xs border-white/25 bg-white/10 text-cream-50 hover:bg-white/20"
              >
                {copiedSlug ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Salin
                  </>
                )}
              </Button>
              {savedInvitation && (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs border-white/25 bg-white/10 text-cream-50 hover:bg-white/20"
                >
                  <Link
                    href={`/u/${savedInvitation.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Buka Link
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {migrationMissing && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 leading-relaxed">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-700" />
          <div>
            <strong>Migrasi Database 004 Diperlukan:</strong> Tabel{" "}
            <code className="font-mono">wedding_invitations</code> belum dibuat
            di Supabase. Jalankan berkas{" "}
            <code className="font-mono">
              supabase/migrations/20261127000004_digital_invitations.sql
            </code>{" "}
            di Supabase SQL Editor terlebih dahulu agar penyimpanan &amp; RSVP
            aktif.
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`rounded-2xl border px-4 py-3 text-xs font-medium ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Split Studio Layout: Editor (Kiri) + Live Phone Preview (Kanan di Desktop) */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_370px] xl:grid-cols-[minmax(0,1fr)_395px] lg:gap-6 lg:items-start">
        <div className="space-y-5 min-w-0">
          {/* 4 Sub-Tab Navigation */}
          <div
            role="tablist"
            aria-label="Editor Undangan"
            className="grid grid-cols-2 xl:grid-cols-4 gap-1 rounded-2xl xl:rounded-full glass p-1 shadow-sm"
          >
        {BUILDER_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center justify-center gap-1.5 rounded-xl xl:rounded-full py-2.5 px-2 text-xs font-semibold transition-colors ${
                active ? "text-cream-50" : "text-sage-700 hover:text-sage-900"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="undangan-tab-pill"
                  className="absolute inset-0 rounded-xl xl:rounded-full bg-gradient-to-r from-sage-600 to-sage shadow-sm"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <Icon className="relative h-3.5 w-3.5" />
              <span className="relative truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================================================================= */}
      {/* TAB 1: TEMA & PROFIL MEMPELAI                                     */}
      {/* ================================================================= */}
      {activeTab === "tema" && (
        <div className="space-y-5">
          {/* Custom URL Slug */}
          <Card className="glass-strong rounded-3xl shadow-card">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="inv-slug">Alamat Tautan Undangan (Slug)</Label>
                <div className="flex items-center gap-2">
                  <span className="rounded-xl border border-sage/15 bg-cream-100 px-3 py-2.5 text-xs font-mono text-sage-600 shrink-0">
                    /u/
                  </span>
                  <Input
                    id="inv-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="andi-dan-rina"
                    className="font-mono text-sm"
                  />
                </div>
                <p className="text-[11px] text-sage-500">
                  Hasil tautan: <span className="font-mono">/u/{normalizedSlug}</span>
                </p>
              </div>

              {/* Pemilih 8 Tema Beragam Layout (Accordion, Default Tertutup) */}
              <div className="pt-1">
                <div className="rounded-2xl border border-sage/15 bg-white/85 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenThemeAccordion((v) => !v)}
                    aria-expanded={openThemeAccordion}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-cream-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex -space-x-1.5 shrink-0">
                        {activeThemeMeta.swatches.map((hex) => (
                          <span
                            key={hex}
                            className="h-5 w-5 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-sage-900 leading-tight">
                          Pilih Tema Undangan (8 Desain)
                        </p>
                        <p className="text-[11px] text-sage-600 truncate mt-0.5">
                          Aktif:{" "}
                          <strong className="text-sage-800">
                            {activeThemeMeta.name}
                          </strong>{" "}
                          &bull; {activeThemeMeta.styleLabel}
                        </p>
                      </div>
                    </div>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream-100 text-sage-700">
                      {openThemeAccordion ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {openThemeAccordion && (
                      <motion.div
                        key="theme-accordion-body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-sage/10 p-3.5 space-y-2.5 bg-cream-50/40">
                          <p className="text-[11px] text-sage-500">
                            Klik salah satu tema di bawah untuk melihat pratinjau
                            langsung:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {INVITATION_THEME_LIST.map((item) => {
                              const selected = theme === item.id;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => setTheme(item.id)}
                                  className={`rounded-2xl border-2 p-3.5 text-left transition-all flex items-start gap-3 ${
                                    selected
                                      ? "border-sage bg-white shadow-soft ring-2 ring-sage/10"
                                      : "border-sage/12 bg-white/80 hover:border-sage/35"
                                  }`}
                                >
                                  <div className="flex -space-x-1.5 shrink-0 pt-0.5">
                                    {item.swatches.map((hex) => (
                                      <span
                                        key={hex}
                                        className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
                                        style={{ backgroundColor: hex }}
                                      />
                                    ))}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1.5">
                                      <p className="text-sm font-bold text-sage-900 truncate">
                                        {item.name}
                                      </p>
                                      {selected && (
                                        <CheckCircle2 className="h-4 w-4 text-sage shrink-0" />
                                      )}
                                    </div>
                                    <span className="mt-1 inline-block rounded-full bg-cream-100 border border-sage/15 px-2 py-0.5 text-[10px] font-semibold text-sage-700">
                                      {item.styleLabel}
                                    </span>
                                    <p className="text-[11px] text-sage-600 line-clamp-2 mt-1 leading-snug">
                                      {item.tagline}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pemilih Musik Ambient Pernikahan (Accordion, Default Tertutup) */}
          <Card className="glass-strong rounded-3xl shadow-card overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between gap-2 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => setOpenMusicAccordion((v) => !v)}
                  aria-expanded={openMusicAccordion}
                  className="flex flex-1 items-center justify-between gap-3 text-left min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-terracotta/10 text-terracotta">
                      <Music2 className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-display text-base sm:text-lg font-semibold text-sage-900 leading-tight">
                        Musik Ambient Undangan
                      </h2>
                      <p className="text-[11.5px] text-sage-600 truncate mt-0.5">
                        Aktif:{" "}
                        <strong className="text-sage-800">
                          {activeMusicMeta.name}
                        </strong>
                      </p>
                    </div>
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cream-100 text-sage-700">
                    {openMusicAccordion ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </span>
                </button>

                {previewPlayingPreset && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs shrink-0"
                    onClick={() => {
                      previewPlayerRef.current?.stop();
                      setPreviewPlayingPreset(null);
                    }}
                  >
                    <Pause className="h-3.5 w-3.5" />
                    Stop
                  </Button>
                )}
              </div>

              <AnimatePresence initial={false}>
                {openMusicAccordion && (
                  <motion.div
                    key="music-accordion-body"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-sage/10 px-5 py-4 sm:px-6 space-y-4">
                      <p className="text-xs text-sage-600">
                        Otomatis berputar lembut saat tamu menekan tombol{" "}
                        <strong>Buka Undangan</strong>. Klik ikon putar untuk
                        mendengar pratinjau.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {INVITATION_MUSIC_PRESETS.map((item) => {
                          const selected = musicPreset === item.id;
                          const isPreviewing = previewPlayingPreset === item.id;
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                setMusicPreset(item.id);
                                if (item.id === "OFF") {
                                  previewPlayerRef.current?.stop();
                                  setPreviewPlayingPreset(null);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setMusicPreset(item.id);
                                }
                              }}
                              className={`cursor-pointer rounded-2xl border-2 p-3.5 transition-all flex items-start justify-between gap-2.5 ${
                                selected
                                  ? "border-sage bg-white shadow-soft ring-2 ring-sage/10"
                                  : "border-sage/12 bg-white/80 hover:border-sage/35"
                              }`}
                            >
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs sm:text-sm font-bold text-sage-900 truncate">
                                    {item.name}
                                  </p>
                                  {selected && (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-sage shrink-0" />
                                  )}
                                </div>
                                <p className="text-[11px] text-sage-600 leading-snug">
                                  {item.subtitle}
                                </p>
                                <span className="inline-block pt-0.5 text-[10px] font-semibold text-terracotta">
                                  {item.mood}
                                </span>
                              </div>

                              {item.id !== "OFF" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMusicPreset(item.id);
                                    handleTogglePreviewMusic(item.id);
                                  }}
                                  aria-label={
                                    isPreviewing
                                      ? `Hentikan preview ${item.name}`
                                      : `Dengar preview ${item.name}`
                                  }
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all ${
                                    isPreviewing
                                      ? "border-terracotta bg-terracotta text-cream-50 shadow-sm"
                                      : "border-sage/20 bg-cream-50 text-sage-800 hover:bg-sage hover:text-cream-50"
                                  }`}
                                >
                                  {isPreviewing ? (
                                    <Pause className="h-3.5 w-3.5" />
                                  ) : (
                                    <Play className="h-3.5 w-3.5 translate-x-[0.5px]" />
                                  )}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {musicPreset === "CUSTOM" && (
                        <div className="space-y-3 rounded-2xl border border-sage/15 bg-cream-50/75 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Label htmlFor="inv-music-url" className="text-xs font-bold">
                              Tautan Langsung File Audio (.mp3 / .m4a / .ogg)
                            </Label>
                            <button
                              type="button"
                              onClick={() => setShowAudioUrlGuide((v) => !v)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-terracotta hover:underline"
                            >
                              <HelpCircle className="h-3.5 w-3.5" />
                              Cara Membuat Tautan Audio
                              {showAudioUrlGuide ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                              id="inv-music-url"
                              type="url"
                              value={musicUrl}
                              onChange={(e) => setMusicUrl(e.target.value)}
                              placeholder="https://files.catbox.moe/lagu-anda.mp3"
                              className="text-xs bg-white flex-1"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant={
                                previewPlayingPreset === "CUSTOM" ? "default" : "outline"
                              }
                              disabled={
                                !musicUrl.trim() ||
                                audioUrlInspection.status === "unsupported"
                              }
                              onClick={() => handleTogglePreviewMusic("CUSTOM")}
                              className="shrink-0 h-10 px-3.5 text-xs bg-white"
                            >
                              {previewPlayingPreset === "CUSTOM" ? (
                                <>
                                  <Pause className="h-3.5 w-3.5" />
                                  Stop Uji
                                </>
                              ) : (
                                <>
                                  <Play className="h-3.5 w-3.5" />
                                  Uji Putar
                                </>
                              )}
                            </Button>
                          </div>

                          {/* Deteksi Otomatis Link Dropbox / Google Drive */}
                          {audioUrlInspection.status === "convertible" &&
                            audioUrlInspection.convertedUrl && (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-amberwarm/45 bg-amberwarm-light/55 px-3 py-2.5 text-[11.5px] text-sage-900">
                                <span className="leading-snug">
                                  <strong>{audioUrlInspection.provider}:</strong>{" "}
                                  {audioUrlInspection.message}
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="sage"
                                  className="h-7 text-[11px] shrink-0 self-start sm:self-auto"
                                  onClick={() => {
                                    if (audioUrlInspection.convertedUrl) {
                                      setMusicUrl(audioUrlInspection.convertedUrl);
                                      globalToast.success(
                                        "Tautan dikonversi!",
                                        "Klik 'Uji Putar' untuk memastikan audio berbunyi."
                                      );
                                    }
                                  }}
                                >
                                  <Wand2 className="h-3 w-3" />
                                  Ubah ke Tautan Langsung
                                </Button>
                              </div>
                            )}

                          {/* Peringatan Link YouTube / Spotify */}
                          {audioUrlInspection.status === "unsupported" && (
                            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[11.5px] text-red-800">
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                              <span className="leading-snug">
                                {audioUrlInspection.message}
                              </span>
                            </div>
                          )}

                          {/* Panduan Interaktif Cara Membuat Tautan Langsung Audio */}
                          {showAudioUrlGuide && (
                            <div className="rounded-2xl border border-sage/15 bg-white p-3.5 space-y-3 text-xs text-sage-800">
                              <p className="font-bold text-sage-900">
                                Panduan Membuat Tautan Langsung File Audio (Gratis):
                              </p>

                              <ol className="space-y-2.5 text-[11.5px] leading-relaxed">
                                <li className="rounded-xl bg-cream-50/80 border border-sage/10 p-2.5">
                                  <strong className="text-sage-900">
                                    1. Catbox.moe (Paling Cepat &amp; Tanpa Login)
                                  </strong>
                                  <p className="text-sage-700 mt-0.5">
                                    Buka{" "}
                                    <span className="font-mono font-semibold text-sage-900">
                                      catbox.moe
                                    </span>
                                    , unggah file <span className="font-mono">.mp3</span>{" "}
                                    Anda, lalu salin tautan yang muncul (contoh:{" "}
                                    <span className="font-mono text-[10.5px]">
                                      https://files.catbox.moe/abc123.mp3
                                    </span>
                                    ) dan tempel ke kolom di atas.
                                  </p>
                                </li>

                                <li className="rounded-xl bg-cream-50/80 border border-sage/10 p-2.5">
                                  <strong className="text-sage-900">
                                    2. Dropbox (Stabil di Semua HP)
                                  </strong>
                                  <p className="text-sage-700 mt-0.5">
                                    Unggah file <span className="font-mono">.mp3</span>{" "}
                                    ke Dropbox → klik <strong>Share / Bagikan</strong> →{" "}
                                    <strong>Copy link</strong> → tempel ke kolom di atas
                                    (atau ubah akhiran{" "}
                                    <span className="font-mono">?dl=0</span> menjadi{" "}
                                    <span className="font-mono">?raw=1</span>). Aplikasi
                                    ini akan mendeteksi dan menawarkan tombol konversi
                                    1-klik secara otomatis.
                                  </p>
                                </li>

                                <li className="rounded-xl bg-cream-50/80 border border-sage/10 p-2.5">
                                  <strong className="text-sage-900">
                                    3. Google Drive
                                  </strong>
                                  <p className="text-sage-700 mt-0.5">
                                    Unggah <span className="font-mono">.mp3</span> → klik
                                    kanan <strong>Bagikan</strong> → ubah akses menjadi{" "}
                                    <strong>Siapa saja yang memiliki tautan</strong> →
                                    salin link lalu tempel di kolom atas untuk dikonversi
                                    otomatis.{" "}
                                    <em className="text-sage-600">
                                      (Catatan: sebagian browser iOS/Safari kadang
                                      membatasi streaming Google Drive; Dropbox/Catbox
                                      lebih disarankan.)
                                    </em>
                                  </p>
                                </li>
                              </ol>

                              <p className="text-[11px] text-sage-600 border-t border-sage/10 pt-2">
                                <strong>Tips:</strong> Link YouTube/Spotify tidak bisa
                                dipakai langsung. Gunakan file{" "}
                                <span className="font-mono">.mp3</span> berukuran ringan
                                (disarankan &le; 5 MB) agar langsung berputar cepat saat
                                tamu menekan <strong>Buka Undangan</strong>.
                              </p>
                            </div>
                          )}

                          <p className="text-[11px] text-sage-500">
                            Jika tautan kustom gagal dimuat di perangkat tamu, sistem
                            otomatis memutar <em>Romantic Piano &amp; Pad</em> sebagai
                            cadangan.
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Profil Mempelai Pria & Wanita */}
          <Card className="glass-strong rounded-3xl shadow-card">
            <CardContent className="p-5 sm:p-6 space-y-5">
              <h2 className="font-display text-lg font-semibold text-sage-900">
                Profil Kedua Mempelai
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Pria */}
                <div className="space-y-3 rounded-2xl border border-sage/12 bg-white/90 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-sage-700">
                    Mempelai Pria
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nama Panggilan *</Label>
                    <Input
                      value={groomName}
                      onChange={(e) => setGroomName(e.target.value)}
                      placeholder="Andi"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nama Lengkap &amp; Gelar</Label>
                    <Input
                      value={groomFullName}
                      onChange={(e) => setGroomFullName(e.target.value)}
                      placeholder="Andi Pratama, S.T."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Putra dari</Label>
                    <Input
                      value={groomParents}
                      onChange={(e) => setGroomParents(e.target.value)}
                      placeholder="Bpk. Hendra & Ibu Siti"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Instagram (Opsional)</Label>
                    <Input
                      value={groomInstagram}
                      onChange={(e) => setGroomInstagram(e.target.value)}
                      placeholder="@andipratama"
                    />
                  </div>
                </div>

                {/* Wanita */}
                <div className="space-y-3 rounded-2xl border border-terracotta/15 bg-white/90 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-terracotta-700">
                    Mempelai Wanita
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nama Panggilan *</Label>
                    <Input
                      value={brideName}
                      onChange={(e) => setBrideName(e.target.value)}
                      placeholder="Rina"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nama Lengkap &amp; Gelar</Label>
                    <Input
                      value={brideFullName}
                      onChange={(e) => setBrideFullName(e.target.value)}
                      placeholder="Rina Wulandari, S.E."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Putri dari</Label>
                    <Input
                      value={brideParents}
                      onChange={(e) => setBrideParents(e.target.value)}
                      placeholder="Bpk. Agus & Ibu Dewi"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Instagram (Opsional)</Label>
                    <Input
                      value={brideInstagram}
                      onChange={(e) => setBrideInstagram(e.target.value)}
                      placeholder="@rinawulandari"
                    />
                  </div>
                </div>
              </div>

              {/* Cover Photo & Opening Quote */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs">Foto Cover Undangan (Opsional)</Label>
                  <div className="flex flex-wrap items-center gap-3">
                    {coverPhotoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverPhotoUrl}
                        alt="Cover undangan"
                        className="h-16 w-24 rounded-xl object-cover border border-sage/20"
                      />
                    )}
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-sage/20 bg-white px-4 py-2 text-xs font-semibold text-sage-800 hover:bg-sage-50 transition-colors">
                      {uploadingCover ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ImagePlus className="h-3.5 w-3.5 text-terracotta" />
                      )}
                      {coverUploadStatus ?? "Unggah Foto Cover"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingCover}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          if (f) handleUploadImage(f, "cover");
                        }}
                      />
                    </label>
                    {coverPhotoUrl && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setCoverPhotoUrl("")}
                        className="text-xs text-red-600"
                      >
                        Hapus Cover
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Ayat / Kutipan Pembuka</Label>
                  <textarea
                    rows={3}
                    value={openingQuote}
                    onChange={(e) => setOpeningQuote(e.target.value)}
                    className="w-full rounded-xl border border-sage/20 bg-white px-3.5 py-2.5 text-sm text-sage-900 focus:outline-none focus:ring-2 focus:ring-sage/35"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Sumber Kutipan</Label>
                  <Input
                    value={quoteSource}
                    onChange={(e) => setQuoteSource(e.target.value)}
                    placeholder="QS. Ar-Rum: 21"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: ACARA (AKAD & RESEPSI) + KISAH CINTA                       */}
      {/* ================================================================= */}
      {activeTab === "acara" && (
        <div className="space-y-5">
          {/* Akad & Resepsi */}
          <Card className="glass-strong rounded-3xl shadow-card">
            <CardContent className="p-5 sm:p-6 space-y-5">
              <h2 className="font-display text-lg font-semibold text-sage-900">
                Jadwal &amp; Lokasi Acara
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Akad */}
                <div className="space-y-3 rounded-2xl border border-sage/12 bg-white/90 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-sage-700">
                    Akad Nikah / Pemberkatan
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tanggal</Label>
                    <DatePicker
                      value={akadDate}
                      onChange={setAkadDate}
                      placeholder="Pilih tanggal akad..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Waktu</Label>
                    <Input
                      value={akadTime}
                      onChange={(e) => setAkadTime(e.target.value)}
                      placeholder="08:00 - 10:00 WIB"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nama Tempat / Masjid</Label>
                    <Input
                      value={akadVenue}
                      onChange={(e) => setAkadVenue(e.target.value)}
                      placeholder="Masjid Agung Al-Azhar"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Alamat Lengkap</Label>
                    <Input
                      value={akadAddress}
                      onChange={(e) => setAkadAddress(e.target.value)}
                      placeholder="Jl. Sisingamangaraja, Jakarta Selatan"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Link Google Maps</Label>
                    <Input
                      value={akadMapsUrl}
                      onChange={(e) => setAkadMapsUrl(e.target.value)}
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                </div>

                {/* Resepsi */}
                <div className="space-y-3 rounded-2xl border border-terracotta/15 bg-white/90 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-terracotta-700">
                    Resepsi Pernikahan
                  </p>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tanggal</Label>
                    <DatePicker
                      value={resepsiDate}
                      onChange={setResepsiDate}
                      placeholder="Pilih tanggal resepsi..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Waktu</Label>
                    <Input
                      value={resepsiTime}
                      onChange={(e) => setResepsiTime(e.target.value)}
                      placeholder="11:00 - 14:00 WIB"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nama Gedung / Ballroom</Label>
                    <Input
                      value={resepsiVenue}
                      onChange={(e) => setResepsiVenue(e.target.value)}
                      placeholder="Balai Kartini Jakarta"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Alamat Lengkap</Label>
                    <Input
                      value={resepsiAddress}
                      onChange={(e) => setResepsiAddress(e.target.value)}
                      placeholder="Jl. Gatot Subroto Kav. 37"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Link Google Maps</Label>
                    <Input
                      value={resepsiMapsUrl}
                      onChange={(e) => setResepsiMapsUrl(e.target.value)}
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kisah Cinta (Love Story) */}
          <Card className="glass-strong rounded-3xl shadow-card">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-semibold text-sage-900">
                    Timeline Kisah Cinta (Opsional)
                  </h2>
                  <p className="text-xs text-sage-600">
                    Bagikan momen berkesan dari pertama bertemu hingga lamaran.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={loveStories.length >= 6}
                  onClick={() =>
                    setLoveStories((prev) => [
                      ...prev,
                      { year: "2024", title: "", description: "" },
                    ])
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Momen
                </Button>
              </div>

              {loveStories.length === 0 ? (
                <EmptyState
                  icon={Heart}
                  compact
                  tone="terracotta"
                  title="Belum ada cerita kisah cinta"
                  description="Tambahkan 2–4 momen spesial (Pertama Bertemu, Mulai Serius, Lamaran) agar undangan terasa lebih hangat."
                />
              ) : (
                <div className="space-y-3">
                  {loveStories.map((story, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-sage/12 bg-white/95 p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-sage-700">
                          Momen #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setLoveStories((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="text-xs text-red-600 hover:underline inline-flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus
                        </button>
                      </div>
                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-2.5">
                        <Input
                          value={story.year}
                          onChange={(e) =>
                            setLoveStories((prev) =>
                              prev.map((s, i) =>
                                i === idx ? { ...s, year: e.target.value } : s
                              )
                            )
                          }
                          placeholder="Tahun (mis. 2022)"
                        />
                        <Input
                          className="sm:col-span-2"
                          value={story.title}
                          onChange={(e) =>
                            setLoveStories((prev) =>
                              prev.map((s, i) =>
                                i === idx ? { ...s, title: e.target.value } : s
                              )
                            )
                          }
                          placeholder="Judul momen (mis. Pertama Bertemu)"
                        />
                      </div>
                      <Input
                        value={story.description}
                        onChange={(e) =>
                          setLoveStories((prev) =>
                            prev.map((s, i) =>
                              i === idx
                                ? { ...s, description: e.target.value }
                                : s
                            )
                          )
                        }
                        placeholder="Cerita singkat momen ini..."
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1.5 pt-2">
                <Label className="text-xs">Pesan Penutup Undangan</Label>
                <textarea
                  rows={2}
                  value={closingMessage}
                  onChange={(e) => setClosingMessage(e.target.value)}
                  className="w-full rounded-xl border border-sage/20 bg-white px-3.5 py-2.5 text-sm text-sage-900 focus:outline-none focus:ring-2 focus:ring-sage/35"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: AMPLOP DIGITAL & GALERI FOTO                               */}
      {/* ================================================================= */}
      {activeTab === "amplop" && (
        <div className="space-y-5">
          {/* Amplop Digital */}
          <Card className="glass-strong rounded-3xl shadow-card">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-semibold text-sage-900">
                    Amplop Digital &amp; Kado
                  </h2>
                  <p className="text-xs text-sage-600">
                    Tamu bisa menyalin nomor rekening Anda dalam 1 klik.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-sage-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showGift}
                      onChange={(e) => setShowGift(e.target.checked)}
                      className="rounded border-sage/30 text-sage"
                    />
                    Tampilkan
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={giftAccounts.length >= 4}
                    onClick={() =>
                      setGiftAccounts((prev) => [
                        ...prev,
                        { bank: "BCA", accountNumber: "", accountHolder: "" },
                      ])
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Rekening
                  </Button>
                </div>
              </div>

              {giftAccounts.length === 0 ? (
                <EmptyState
                  icon={Gift}
                  compact
                  tone="amber"
                  title="Belum ada rekening amplop digital"
                  description="Tambahkan nomor rekening BCA/Mandiri/GoPay/OVO agar tamu yang berhalangan hadir tetap bisa berbagi tanda kasih."
                />
              ) : (
                <div className="space-y-3">
                  {giftAccounts.map((acc, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-sage/12 bg-white/95 p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sage-700">
                          Rekening #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setGiftAccounts((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          className="text-xs text-red-600 hover:underline inline-flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus
                        </button>
                      </div>
                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-2.5">
                        <Input
                          value={acc.bank}
                          onChange={(e) =>
                            setGiftAccounts((prev) =>
                              prev.map((a, i) =>
                                i === idx ? { ...a, bank: e.target.value } : a
                              )
                            )
                          }
                          placeholder="Bank / E-Wallet (BCA)"
                        />
                        <Input
                          value={acc.accountNumber}
                          onChange={(e) =>
                            setGiftAccounts((prev) =>
                              prev.map((a, i) =>
                                i === idx
                                  ? { ...a, accountNumber: e.target.value }
                                  : a
                              )
                            )
                          }
                          placeholder="Nomor Rekening"
                        />
                        <Input
                          value={acc.accountHolder}
                          onChange={(e) =>
                            setGiftAccounts((prev) =>
                              prev.map((a, i) =>
                                i === idx
                                  ? { ...a, accountHolder: e.target.value }
                                  : a
                              )
                            )
                          }
                          placeholder="Atas Nama"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <Label className="text-xs">
                  Alamat Pengiriman Kado Fisik (Opsional)
                </Label>
                <Input
                  value={giftAddress}
                  onChange={(e) => setGiftAddress(e.target.value)}
                  placeholder="Jl. Kemang Raya No. 12, Jakarta Selatan"
                />
              </div>
            </CardContent>
          </Card>

          {/* Galeri Foto Prewedding */}
          <Card className="glass-strong rounded-3xl shadow-card">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-semibold text-sage-900">
                    Galeri Foto ({galleryUrls.length} / 6)
                  </h2>
                  <p className="text-xs text-sage-600">
                    Foto otomatis dikompresi ke WebP agar cepat dibuka tamu.
                  </p>
                </div>
                {galleryUrls.length < 6 && (
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-sage/20 bg-white px-4 py-2 text-xs font-semibold text-sage-800 hover:bg-sage-50 transition-colors">
                    {uploadingGallery ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ImagePlus className="h-3.5 w-3.5 text-terracotta" />
                    )}
                    {galleryUploadStatus ?? "Tambah Foto"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      disabled={uploadingGallery}
                      onChange={(e) => {
                        const list = e.target.files
                          ? Array.from(e.target.files)
                          : [];
                        e.target.value = "";
                        if (list.length > 0) handleUploadImage(list, "gallery");
                      }}
                    />
                  </label>
                )}
              </div>

              {galleryUrls.length === 0 ? (
                <EmptyState
                  icon={ImagePlus}
                  compact
                  title="Belum ada foto galeri"
                  description="Unggah hingga 6 foto prewedding terbaik kalian untuk ditampilkan pada halaman undangan."
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {galleryUrls.map((url, idx) => (
                    <div
                      key={`${url}-${idx}`}
                      className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-sage/15 bg-cream-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Galeri ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setGalleryUrls((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        aria-label="Hapus foto"
                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-90 hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: GENERATOR KIRIM WA TAMU & REKAP RSVP                       */}
      {/* ================================================================= */}
      {activeTab === "rsvp" && (
        <div className="space-y-5">
          {/* Generator Personalisasi Tamu WhatsApp */}
          <GuestShareManager
            workspaceId={workspace.id}
            publicUrl={publicUrl}
            coupleLabel={`${groomName} & ${brideName}`}
          />

          {/* Rekap RSVP & Buku Tamu */}
          <Card className="glass-strong rounded-3xl shadow-card">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-lg font-semibold text-sage-900">
                    Rekap RSVP &amp; Ucapan Doa
                  </h2>
                  <p className="text-xs text-sage-600">
                    Target estimasi tamu workspace:{" "}
                    <strong>{workspace.guest_estimate} pax</strong>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={rsvps.length === 0}
                    onClick={() => {
                      exportRsvpToExcel(workspace.couple_title, rsvps);
                      globalToast.success(
                        "Rekap RSVP diunduh",
                        `${rsvps.length} data tamu berhasil diekspor ke Excel.`
                      );
                    }}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Export Excel
                  </Button>
                  <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-sage-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRsvp}
                      onChange={(e) => setShowRsvp(e.target.checked)}
                      className="rounded border-sage/30 text-sage"
                    />
                    Buka Form RSVP
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/75 p-3">
                  <p className="text-[10.5px] font-medium text-emerald-700">
                    Konfirmasi Hadir
                  </p>
                  <p className="font-display text-xl font-semibold tabular-nums text-emerald-900">
                    {rsvpStats.hadirCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-sage/15 bg-sage-50/80 p-3">
                  <p className="text-[10.5px] font-medium text-sage-700">
                    Total Tamu (Pax)
                  </p>
                  <p className="font-display text-xl font-semibold tabular-nums text-sage-900">
                    {rsvpStats.totalPax} pax
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3">
                  <p className="text-[10.5px] font-medium text-amber-800">
                    Masih Ragu
                  </p>
                  <p className="font-display text-xl font-semibold tabular-nums text-amber-950">
                    {rsvpStats.raguCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-sage/12 bg-white p-3">
                  <p className="text-[10.5px] font-medium text-sage-600">
                    Tidak Hadir
                  </p>
                  <p className="font-display text-xl font-semibold tabular-nums text-sage-900">
                    {rsvpStats.tidakCount}
                  </p>
                </div>
              </div>

              {rsvps.length === 0 ? (
                <EmptyState
                  icon={Users}
                  compact
                  title="Belum ada konfirmasi RSVP"
                  description="Publikasikan undangan lalu bagikan tautan ke tamu. Ucapan doa dan konfirmasi kehadiran akan otomatis tampil di sini."
                />
              ) : (
                <div className="space-y-3">
                  {rsvps.length > 5 && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sage-500" />
                        <Input
                          value={rsvpSearch}
                          onChange={(e) => setRsvpSearch(e.target.value)}
                          placeholder="Cari nama tamu atau ucapan doa..."
                          className="h-9 pl-8 text-xs"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(
                          [
                            { id: "ALL", label: "Semua" },
                            { id: "HADIR", label: "Hadir" },
                            { id: "RAGU", label: "Ragu" },
                            { id: "TIDAK_HADIR", label: "Tidak Hadir" },
                          ] as const
                        ).map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setRsvpFilter(f.id)}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                              rsvpFilter === f.id
                                ? "bg-midnight-btn text-white"
                                : "bg-[#F4F5F7] text-[#5F6978] hover:text-[#141618]"
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredRsvps.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-black/10 py-6 text-center text-xs text-[#5F6978]">
                      Tidak ada ucapan RSVP yang cocok dengan filter pencarian.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {paginatedRsvps.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between gap-3 rounded-2xl border border-sage/12 bg-white/95 p-3.5"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs font-bold text-sage-900">
                                {item.guest_name}
                              </p>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  item.attendance === "HADIR"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : item.attendance === "RAGU"
                                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                                      : "bg-cream-200 text-sage-700"
                                }`}
                              >
                                {item.attendance === "HADIR"
                                  ? `Hadir (${item.guest_count} org)`
                                  : item.attendance === "RAGU"
                                    ? "Masih Ragu"
                                    : "Tidak Hadir"}
                              </span>
                            </div>
                            {item.message && (
                              <p className="text-xs text-sage-700 leading-relaxed">
                                &ldquo;{item.message}&rdquo;
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            disabled={deletingRsvpId === item.id}
                            onClick={() => handleDeleteRsvp(item.id)}
                            aria-label="Hapus ucapan"
                            className="text-sage-400 hover:text-red-600 p-1 transition-colors shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredRsvps.length > RSVP_PAGE_SIZE && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-black/[0.06]">
                      <span className="text-[11px] text-[#5F6978]">
                        Menampilkan{" "}
                        <strong className="text-[#141618]">
                          {(safeRsvpPage - 1) * RSVP_PAGE_SIZE + 1}–
                          {Math.min(
                            safeRsvpPage * RSVP_PAGE_SIZE,
                            filteredRsvps.length
                          )}
                        </strong>{" "}
                        dari{" "}
                        <strong className="text-[#141618]">
                          {filteredRsvps.length}
                        </strong>{" "}
                        ucapan
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 text-[11px]"
                          disabled={safeRsvpPage <= 1}
                          onClick={() =>
                            setRsvpPage((p) => Math.max(1, p - 1))
                          }
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          Sebelumnya
                        </Button>
                        <span className="px-2 text-[11px] font-semibold text-[#141618] tabular-nums">
                          Hal. {safeRsvpPage} / {rsvpTotalPages}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 text-[11px]"
                          disabled={safeRsvpPage >= rsvpTotalPages}
                          onClick={() =>
                            setRsvpPage((p) => Math.min(rsvpTotalPages, p + 1))
                          }
                        >
                          Berikutnya
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

          {/* Sticky Bottom Save / Publish Bar */}
          <div className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-4 z-20 rounded-2xl glass-strong border-sage/15 p-3 shadow-lift flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-sage-900 cursor-pointer px-1">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-sage/30 text-sage"
              />
              Publikasikan ke umum
            </label>

            <div className="grid grid-cols-2 xl:flex xl:flex-wrap items-center gap-2 w-full xl:w-auto">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowMobilePreview(true)}
                className="lg:hidden"
              >
                <Eye className="h-3.5 w-3.5" />
                Pratinjau
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="lg:col-span-2 xl:col-span-1"
                disabled={saving}
                onClick={() => handleSave(false)}
              >
                Simpan Draft
              </Button>
              <Button
                type="button"
                size="sm"
                className="col-span-2 xl:col-span-1"
                disabled={saving}
                onClick={() => handleSave(true)}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Simpan &amp; Publikasikan
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Kolom Kanan Desktop: Sticky Live Interactive Phone Preview */}
        <aside className="hidden lg:block lg:sticky lg:top-6">
          <LivePreviewPanel
            invitation={draftInvitation}
            rsvps={rsvps}
            savedSlug={savedInvitation?.slug}
          />
        </aside>
      </div>

      {/* Modal Pratinjau Live untuk Mobile & Tablet (< lg) via Portal agar full-screen edge-to-edge */}
      <DialogPrimitive.Root
        open={showMobilePreview}
        onOpenChange={setShowMobilePreview}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[70] lg:hidden bg-black/75 backdrop-blur-sm duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <div className="pointer-events-none fixed inset-0 z-[75] lg:hidden flex items-center justify-center px-2.5 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-4">
            <DialogPrimitive.Content
              aria-describedby={undefined}
              className="pointer-events-auto relative w-full max-w-md max-h-full overflow-y-auto no-scrollbar rounded-3xl bg-cream-50 p-3 sm:p-4 shadow-2xl outline-none duration-200 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-2 data-[state=closed]:slide-out-to-bottom-1"
            >
              <div className="flex items-center justify-between pb-2.5">
                <DialogPrimitive.Title className="font-display text-base font-semibold text-sage-900">
                  Pratinjau Undangan Live
                </DialogPrimitive.Title>
                <DialogPrimitive.Close
                  aria-label="Tutup pratinjau"
                  className="rounded-full border border-sage/15 bg-white p-1.5 text-sage-700 hover:bg-sage-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                </DialogPrimitive.Close>
              </div>
              <LivePreviewPanel
                invitation={draftInvitation}
                rsvps={rsvps}
                savedSlug={savedInvitation?.slug}
                viewportHeightClass="h-[72dvh] sm:aspect-[9/19.5] sm:h-auto sm:max-h-[76dvh]"
              />
            </DialogPrimitive.Content>
          </div>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}

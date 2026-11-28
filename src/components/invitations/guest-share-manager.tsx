"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardList,
  Contact,
  Copy,
  Download,
  FileSpreadsheet,
  Link2,
  MessageCircle,
  MessageSquareText,
  Phone,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import {
  WA_MESSAGE_TEMPLATES,
  normalizeWhatsAppPhone,
  renderGuestWhatsAppMessage,
  type WhatsAppTemplateId,
} from "@/lib/invitation-themes";
import { useToast } from "@/components/providers/toast-provider";
import { useConfirm } from "@/components/providers/confirm-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InputMode = "single" | "excel" | "paste";
type StatusFilter = "ALL" | "UNSENT" | "SENT";
type GuestGroup = "Keluarga" | "Teman" | "Kantor" | "VIP" | "Umum";

const GUEST_GROUPS: GuestGroup[] = ["Keluarga", "Teman", "Kantor", "VIP", "Umum"];
const QUICK_PREFIXES = ["Bpk.", "Ibu", "Dr."];
const QUICK_SUFFIXES = ["& Keluarga", "& Partner", "& Istri", "& Suami"];

interface PersonalGuest {
  id: string;
  name: string;
  phone: string;
  group: GuestGroup;
  sent: boolean;
  sentAt?: string;
}

interface StoredGuestState {
  guests: PersonalGuest[];
  templateId: WhatsAppTemplateId;
  customTemplate: string;
}

interface GuestShareManagerProps {
  workspaceId: string;
  publicUrl: string;
  coupleLabel: string;
}

interface ContactPickerItem {
  name?: string[];
  tel?: string[];
}

interface ContactsManagerLike {
  select: (
    properties: string[],
    options?: { multiple?: boolean }
  ) => Promise<ContactPickerItem[]>;
}

function createGuestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeGroup(raw: string | undefined | null): GuestGroup {
  if (!raw) return "Umum";
  const lower = raw.trim().toLowerCase();
  if (lower.includes("keluarga") || lower.includes("family")) return "Keluarga";
  if (lower.includes("teman") || lower.includes("sahabat") || lower.includes("friend"))
    return "Teman";
  if (lower.includes("kantor") || lower.includes("kerja") || lower.includes("kolega"))
    return "Kantor";
  if (lower.includes("vip")) return "VIP";
  return "Umum";
}

function formatDisplayPhone(raw: string): string {
  const normalized = normalizeWhatsAppPhone(raw);
  if (!normalized) return raw;
  return `+${normalized}`;
}

export function GuestShareManager({
  workspaceId,
  publicUrl,
  coupleLabel,
}: GuestShareManagerProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const storageKey = `nikahplan:guest-share:v1:${workspaceId}`;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hydrated, setHydrated] = useState(false);
  const [guests, setGuests] = useState<PersonalGuest[]>([]);
  const [templateId, setTemplateId] = useState<WhatsAppTemplateId>("FORMAL");
  const [customTemplate, setCustomTemplate] = useState<string>(
    WA_MESSAGE_TEMPLATES[0].body
  );

  // Input mode & form states
  const [inputMode, setInputMode] = useState<InputMode>("single");
  const [singleName, setSingleName] = useState("");
  const [selectedPrefix, setSelectedPrefix] = useState<string | null>(null);
  const [selectedSuffix, setSelectedSuffix] = useState<string | null>(null);
  const [singlePhone, setSinglePhone] = useState("");
  const [singleGroup, setSingleGroup] = useState<GuestGroup>("Teman");
  const [pasteText, setPasteText] = useState("");
  const [pasteGroup, setPasteGroup] = useState<GuestGroup>("Umum");
  const [importingExcel, setImportingExcel] = useState(false);
  const [supportsContactPicker, setSupportsContactPicker] = useState(false);

  // Template & list controls
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [groupFilter, setGroupFilter] = useState<GuestGroup | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<5 | 10 | 25 | 50>(5);
  const [copiedAction, setCopiedAction] = useState<{
    id: string;
    kind: "link" | "msg";
  } | null>(null);

  // Hydrate from localStorage safely on client
  useEffect(() => {
    try {
      const nav = navigator as Navigator & { contacts?: ContactsManagerLike };
      setSupportsContactPicker(
        Boolean(nav.contacts && typeof nav.contacts.select === "function")
      );

      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredGuestState>;
        if (Array.isArray(parsed.guests)) {
          setGuests(parsed.guests);
        }
        if (
          parsed.templateId &&
          WA_MESSAGE_TEMPLATES.some((t) => t.id === parsed.templateId)
        ) {
          setTemplateId(parsed.templateId);
        }
        if (typeof parsed.customTemplate === "string" && parsed.customTemplate.trim()) {
          setCustomTemplate(parsed.customTemplate);
        }
      }
    } catch {
      // Ignore malformed localStorage
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  // Persist to localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      const payload: StoredGuestState = {
        guests,
        templateId,
        customTemplate,
      };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [hydrated, guests, templateId, customTemplate, storageKey]);

  const activeTemplatePreset =
    WA_MESSAGE_TEMPLATES.find((t) => t.id === templateId) ||
    WA_MESSAGE_TEMPLATES[0];

  const mergeIncomingGuests = (
    incoming: Array<{ name: string; phone?: string; group?: GuestGroup }>
  ): { added: number; skipped: number } => {
    const existingKeys = new Set(
      guests.map((g) => g.name.trim().toLowerCase())
    );
    const toAdd: PersonalGuest[] = [];
    let skipped = 0;

    for (const row of incoming) {
      const cleanName = row.name.trim().replace(/\s+/g, " ");
      if (!cleanName) continue;
      const key = cleanName.toLowerCase();
      if (existingKeys.has(key)) {
        skipped++;
        continue;
      }
      existingKeys.add(key);
      toAdd.push({
        id: createGuestId(),
        name: cleanName,
        phone: (row.phone || "").trim(),
        group: row.group || "Umum",
        sent: false,
      });
    }

    if (toAdd.length > 0) {
      setGuests((prev) => [...toAdd, ...prev]);
    }
    return { added: toAdd.length, skipped };
  };

  const composedSingleName = useMemo(() => {
    const core = singleName.trim();
    if (!core) return "";
    const hasPrefixAlready =
      selectedPrefix &&
      core.toLowerCase().startsWith(selectedPrefix.toLowerCase());
    const hasSuffixAlready =
      selectedSuffix &&
      core.toLowerCase().endsWith(selectedSuffix.toLowerCase());

    return [
      selectedPrefix && !hasPrefixAlready ? selectedPrefix : "",
      core,
      selectedSuffix && !hasSuffixAlready ? selectedSuffix : "",
    ]
      .filter(Boolean)
      .join(" ");
  }, [singleName, selectedPrefix, selectedSuffix]);

  // 1. Add Single Guest
  const handleAddSingle = (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanName = composedSingleName.trim();
    if (!cleanName) return;

    const { added, skipped } = mergeIncomingGuests([
      {
        name: cleanName,
        phone: singlePhone.trim(),
        group: singleGroup,
      },
    ]);

    if (added > 0) {
      setSingleName("");
      setSinglePhone("");
      setSelectedPrefix(null);
      setSelectedSuffix(null);
      toast.success("Tamu ditambahkan", `${cleanName} siap dikirim undangan.`);
    } else if (skipped > 0) {
      toast.warning(
        "Nama sudah ada di daftar",
        `"${cleanName}" sudah tercatat sebelumnya.`
      );
    }
  };

  const togglePrefixChip = (prefix: string) => {
    setSelectedPrefix((prev) => (prev === prefix ? null : prefix));
  };

  const toggleSuffixChip = (suffix: string) => {
    setSelectedSuffix((prev) => (prev === suffix ? null : suffix));
  };

  // Contact Picker API (Mobile Chrome/Android)
  const handlePickFromContacts = async () => {
    try {
      const nav = navigator as Navigator & { contacts?: ContactsManagerLike };
      if (!nav.contacts) return;
      const selected = await nav.contacts.select(["name", "tel"], {
        multiple: true,
      });
      if (!selected || selected.length === 0) return;

      const mapped = selected
        .map((c) => ({
          name: c.name?.[0] || "",
          phone: c.tel?.[0] || "",
          group: singleGroup,
        }))
        .filter((c) => c.name.trim().length > 0);

      const { added, skipped } = mergeIncomingGuests(mapped);
      if (added > 0) {
        toast.success(
          `${added} kontak ditambahkan`,
          skipped > 0 ? `${skipped} nama duplikat dilewati.` : undefined
        );
      } else {
        toast.info("Tidak ada kontak baru yang ditambahkan.");
      }
    } catch {
      // User cancelled picker
    }
  };

  // 2. Import Excel / CSV
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ["Nama Tamu", "No WhatsApp", "Grup"],
      ["Bapak Budi Santoso & Keluarga", "081234567890", "Keluarga"],
      ["Rina Wijaya & Partner", "081987654321", "Teman"],
      ["Ibu Dewi Lestari", "085612345678", "Kantor"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 32 }, { wch: 18 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Tamu");
    XLSX.writeFile(wb, "NikahPlan-Template-Daftar-Tamu.xlsx");
    toast.success(
      "Template Excel diunduh",
      "Isi daftar tamu Anda lalu unggah kembali di sini."
    );
  };

  const handleImportExcelFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingExcel(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(
        firstSheet,
        { header: 1, defval: "" }
      );

      if (rows.length === 0) {
        toast.warning("File kosong", "Tidak ada data ditemukan di file tersebut.");
        return;
      }

      // Deteksi header otomatis
      const firstRowStrings = rows[0].map((cell) =>
        String(cell ?? "")
          .trim()
          .toLowerCase()
      );
      const hasHeader = firstRowStrings.some(
        (h) =>
          h.includes("nama") ||
          h.includes("name") ||
          h.includes("tamu") ||
          h.includes("whatsapp") ||
          h.includes("hp")
      );

      let nameIdx = 0;
      let phoneIdx = 1;
      let groupIdx = 2;

      if (hasHeader) {
        const foundName = firstRowStrings.findIndex(
          (h) => h.includes("nama") || h.includes("name") || h.includes("tamu")
        );
        const foundPhone = firstRowStrings.findIndex(
          (h) =>
            h.includes("wa") ||
            h.includes("whatsapp") ||
            h.includes("hp") ||
            h.includes("phone") ||
            h.includes("tel") ||
            h.includes("nomor")
        );
        const foundGroup = firstRowStrings.findIndex(
          (h) =>
            h.includes("grup") ||
            h.includes("group") ||
            h.includes("kategori") ||
            h.includes("relasi")
        );
        if (foundName >= 0) nameIdx = foundName;
        if (foundPhone >= 0) phoneIdx = foundPhone;
        if (foundGroup >= 0) groupIdx = foundGroup;
      }

      const dataRows = hasHeader ? rows.slice(1) : rows;
      const incoming = dataRows
        .map((row) => ({
          name: String(row[nameIdx] ?? "").trim(),
          phone:
            phoneIdx >= 0 && row[phoneIdx] !== undefined
              ? String(row[phoneIdx]).trim()
              : "",
          group: normalizeGroup(
            groupIdx >= 0 && row[groupIdx] !== undefined
              ? String(row[groupIdx])
              : undefined
          ),
        }))
        .filter((r) => r.name.length > 0);

      if (incoming.length === 0) {
        toast.warning(
          "Tidak ada nama tamu terbaca",
          "Pastikan kolom pertama berisi nama tamu."
        );
        return;
      }

      const { added, skipped } = mergeIncomingGuests(incoming);
      toast.success(
        `${added} tamu berhasil diimpor`,
        skipped > 0
          ? `${skipped} nama yang sudah ada dilewati otomatis.`
          : "Daftar tamu siap dikirim via WhatsApp."
      );
    } catch (err) {
      toast.error(
        "Gagal membaca file",
        err instanceof Error
          ? err.message
          : "Pastikan file berformat .xlsx, .xls, atau .csv yang valid."
      );
    } finally {
      setImportingExcel(false);
      e.target.value = "";
    }
  };

  // 3. Quick Paste Massal (mendukung format "Nama", "Nama, 0812...", atau copy-paste tab dari Sheets)
  const handleAddPastedList = () => {
    const lines = pasteText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const incoming = lines.map((line) => {
      // Pisahkan dengan Tab (dari Google Sheets/Excel) atau koma/titik koma
      const parts = line.includes("\t")
        ? line.split("\t").map((p) => p.trim())
        : line.split(/[;,]/).map((p) => p.trim());

      const name = parts[0] || "";
      const second = parts[1] || "";
      const third = parts[2] || "";

      // Jika kolom ke-2 berbentuk nomor HP, masukkan ke phone; jika bukan, cek apakah grup
      const phoneCandidate = normalizeWhatsAppPhone(second) ? second : "";
      const groupCandidate = phoneCandidate
        ? normalizeGroup(third || pasteGroup)
        : second
          ? normalizeGroup(second)
          : pasteGroup;

      return {
        name,
        phone: phoneCandidate,
        group: groupCandidate,
      };
    });

    const { added, skipped } = mergeIncomingGuests(incoming);
    if (added > 0) {
      setPasteText("");
      toast.success(
        `${added} tamu ditambahkan`,
        skipped > 0 ? `${skipped} nama duplikat dilewati.` : undefined
      );
    } else {
      toast.warning(
        "Tidak ada tamu baru",
        "Semua nama yang ditempel sudah ada di daftar Anda."
      );
    }
  };

  // Actions on individual guests
  const toggleSent = (id: string) => {
    setGuests((prev) =>
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              sent: !g.sent,
              sentAt: !g.sent ? new Date().toISOString() : undefined,
            }
          : g
      )
    );
  };

  const markAsSent = (id: string) => {
    setGuests((prev) =>
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              sent: true,
              sentAt: g.sentAt || new Date().toISOString(),
            }
          : g
      )
    );
  };

  const removeGuest = (id: string) => {
    setGuests((prev) => prev.filter((g) => g.id !== id));
  };

  const handleClearAllGuests = async () => {
    if (guests.length === 0) return;
    const ok = await confirm({
      title: "Bersihkan seluruh daftar tamu?",
      description: `Semua ${guests.length} nama tamu dan status pengirimannya pada perangkat ini akan dihapus. Data RSVP tamu yang sudah masuk tidak terpengaruh.`,
      confirmLabel: "Ya, Bersihkan",
      variant: "destructive",
    });
    if (!ok) return;
    setGuests([]);
    toast.info("Daftar tamu personalisasi dibersihkan.");
  };

  const handleExportGuestList = () => {
    if (guests.length === 0) return;
    const wb = XLSX.utils.book_new();
    const rows = [
      ["Nama Tamu", "No WhatsApp", "Grup", "Status Kirim", "Tautan Undangan"],
      ...guests.map((g) => [
        g.name,
        g.phone || "-",
        g.group,
        g.sent ? "Terkirim" : "Belum Dikirim",
        `${publicUrl}?to=${encodeURIComponent(g.name)}`,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [
      { wch: 30 },
      { wch: 18 },
      { wch: 14 },
      { wch: 16 },
      { wch: 48 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Daftar Tamu");
    XLSX.writeFile(wb, "NikahPlan-Daftar-Tamu-Undangan.xlsx");
    toast.success("Daftar tamu diekspor ke Excel.");
  };

  const copyText = async (
    id: string,
    kind: "link" | "msg",
    value: string,
    label: string
  ) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedAction({ id, kind });
      toast.success(label);
      setTimeout(() => {
        setCopiedAction((curr) =>
          curr?.id === id && curr?.kind === kind ? null : curr
        );
      }, 1800);
    } catch {
      toast.error("Gagal menyalin ke clipboard.");
    }
  };

  // Stats & filtering
  const sentCount = useMemo(
    () => guests.filter((g) => g.sent).length,
    [guests]
  );
  const progressPct =
    guests.length > 0 ? Math.round((sentCount / guests.length) * 100) : 0;

  const availableGroups = useMemo(() => {
    const present = new Set(guests.map((g) => g.group));
    return GUEST_GROUPS.filter((g) => present.has(g));
  }, [guests]);

  const filteredGuests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return guests.filter((g) => {
      if (statusFilter === "SENT" && !g.sent) return false;
      if (statusFilter === "UNSENT" && g.sent) return false;
      if (groupFilter !== "ALL" && g.group !== groupFilter) return false;
      if (
        q &&
        !g.name.toLowerCase().includes(q) &&
        !g.phone.toLowerCase().includes(q) &&
        !g.group.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [guests, searchQuery, statusFilter, groupFilter]);

  // Reset ke halaman 1 saat filter/pencarian/ukuran halaman berubah
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, groupFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredGuests.length / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedGuests = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredGuests.slice(start, start + pageSize);
  }, [filteredGuests, safePage, pageSize]);

  const showingStart =
    filteredGuests.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const showingEnd = Math.min(safePage * pageSize, filteredGuests.length);

  const previewGuestName = guests[0]?.name || singleName.trim() || "Bpk. Budi Santoso & Keluarga";
  const previewMessage = useMemo(
    () =>
      renderGuestWhatsAppMessage(customTemplate, {
        guestName: previewGuestName,
        coupleLabel,
        invitationUrl: `${publicUrl}?to=${encodeURIComponent(previewGuestName)}`,
      }),
    [customTemplate, previewGuestName, coupleLabel, publicUrl]
  );

  const validSinglePhone = normalizeWhatsAppPhone(singlePhone);

  return (
    <Card className="rounded-3xl border border-black/[0.06] bg-white shadow-card">
      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Header + Progress Summary */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <Badge variant="softTerracotta" className="mb-1.5">
              Personalisasi Tamu
            </Badge>
            <h2 className="font-display text-lg font-bold text-[#141618]">
              Kirim Undangan Personal via WhatsApp
            </h2>
            <p className="text-xs text-[#5F6978] mt-0.5 leading-relaxed">
              Tambahkan tamu satu per satu, impor dari Excel/CSV, atau tempel
              daftar sekaligus. Setiap tamu otomatis mendapat tautan unik{" "}
              <code className="font-mono text-[#141618]">?to=...</code> &amp;
              pesan siap kirim.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowTemplateEditor((prev) => !prev)}
            className="shrink-0 self-start"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Atur Pesan WA
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                showTemplateEditor ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>

        {/* Collapsible Template Pesan WhatsApp */}
        <AnimatePresence initial={false}>
          {showTemplateEditor && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-black/[0.08] bg-[#F4F5F7] p-4 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#141618]">
                    <MessageSquareText className="h-4 w-4 text-[#4F6BF6]" />
                    Gaya Pesan WhatsApp
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomTemplate(activeTemplatePreset.body)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5F6978] hover:text-[#141618]"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset ke Bawaan
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {WA_MESSAGE_TEMPLATES.map((preset) => {
                    const active = templateId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setTemplateId(preset.id);
                          setCustomTemplate(preset.body);
                        }}
                        className={`rounded-xl border px-3 py-2 text-left transition-all ${
                          active
                            ? "border-[#141618] bg-midnight-btn text-white shadow-sm"
                            : "border-black/[0.08] bg-white text-[#141618] hover:border-black/20"
                        }`}
                      >
                        <p className="text-xs font-bold">{preset.label}</p>
                        <p
                          className={`text-[10.5px] mt-0.5 ${
                            active ? "text-white/75" : "text-[#5F6978]"
                          }`}
                        >
                          {preset.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
                  <div className="space-y-1.5">
                    <div className="flex min-h-5 items-center justify-between gap-2">
                      <Label className="text-[11.5px] font-semibold text-[#141618] whitespace-nowrap">
                        Edit Teks Pesan
                      </Label>
                      <span className="text-[10.5px] text-[#5F6978] font-mono truncate">
                        {"{nama}"} · {"{mempelai}"} · {"{link}"}
                      </span>
                    </div>
                    <textarea
                      rows={6}
                      value={customTemplate}
                      onChange={(e) => setCustomTemplate(e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white p-3 text-xs leading-relaxed text-[#141618] focus:outline-none focus:ring-2 focus:ring-[#4F6BF6]/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex min-h-5 items-center justify-between gap-2">
                      <Label className="text-[11.5px] font-semibold text-[#141618] truncate">
                        Pratinjau Pesan (Contoh: {previewGuestName})
                      </Label>
                    </div>
                    <div className="h-[154px] overflow-y-auto rounded-xl border border-emerald-200/80 bg-[#E7F8EE] p-3 text-[11.5px] leading-relaxed text-[#141618] whitespace-pre-wrap">
                      {previewMessage}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3 Mode Input Tamu (Segmented Pill Switcher) */}
        <div className="rounded-2xl border border-black/[0.06] bg-[#F4F5F7]/80 p-3.5 sm:p-4 space-y-4">
          <div className="grid grid-cols-3 gap-1 rounded-full bg-white p-1 border border-black/[0.06]">
            {(
              [
                { id: "single", label: "Tambah Satuan", shortLabel: "Satuan", icon: UserPlus },
                { id: "excel", label: "Import Excel", shortLabel: "Excel", icon: FileSpreadsheet },
                { id: "paste", label: "Tempel Massal", shortLabel: "Massal", icon: ClipboardList },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = inputMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setInputMode(tab.id)}
                  className={`flex items-center justify-center gap-1 sm:gap-1.5 rounded-full py-2 px-1.5 sm:px-2 text-[11px] sm:text-xs font-semibold transition-all ${
                    active
                      ? "bg-midnight-btn text-white shadow-sm"
                      : "text-[#5F6978] hover:text-[#141618]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="sm:hidden truncate">{tab.shortLabel}</span>
                  <span className="hidden sm:inline truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* MODE 1: TAMBAH SATUAN TERSTRUKTUR */}
          {inputMode === "single" && (
            <form onSubmit={handleAddSingle} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                <div className="sm:col-span-6 space-y-1.5">
                  <div className="flex h-5 items-center justify-between gap-2">
                    <Label
                      htmlFor="single-guest-name"
                      className="text-xs font-semibold text-[#141618] whitespace-nowrap"
                    >
                      Nama Tamu Undangan
                    </Label>
                  </div>
                  <Input
                    id="single-guest-name"
                    value={singleName}
                    onChange={(e) => setSingleName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="bg-white"
                  />
                </div>

                <div className="sm:col-span-6 space-y-1.5">
                  <div className="flex h-5 items-center justify-between gap-2">
                    <Label
                      htmlFor="single-guest-phone"
                      className="text-xs font-semibold text-[#141618] whitespace-nowrap"
                    >
                      No. WhatsApp{" "}
                      <span className="font-normal text-[#5F6978]">
                        (Opsional)
                      </span>
                    </Label>
                    {validSinglePhone && (
                      <span className="text-[10.5px] font-semibold text-emerald-700 whitespace-nowrap">
                        Direct WA ✓
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5F6978]" />
                    <Input
                      id="single-guest-phone"
                      type="tel"
                      value={singlePhone}
                      onChange={(e) => setSinglePhone(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="pl-8 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Sapaan / Akhiran Chips (Awalan & Akhiran dapat dipilih bersamaan) */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-[#5F6978] mr-0.5">
                    Sapaan cepat:
                  </span>
                  {QUICK_PREFIXES.map((p) => {
                    const active = selectedPrefix === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        aria-pressed={active}
                        onClick={() => togglePrefixChip(p)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                          active
                            ? "border-[#141618] bg-midnight-btn text-white shadow-sm"
                            : "border-black/10 bg-white text-[#141618] hover:border-[#4F6BF6] hover:text-[#4F6BF6]"
                        }`}
                      >
                        {active ? (
                          <Check className="h-3 w-3 shrink-0" />
                        ) : (
                          <span>+</span>
                        )}
                        <span>{p}</span>
                      </button>
                    );
                  })}
                  <span className="text-black/15 mx-0.5">|</span>
                  {QUICK_SUFFIXES.map((s) => {
                    const active = selectedSuffix === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleSuffixChip(s)}
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                          active
                            ? "border-[#141618] bg-midnight-btn text-white shadow-sm"
                            : "border-black/10 bg-white text-[#141618] hover:border-[#4F6BF6] hover:text-[#4F6BF6]"
                        }`}
                      >
                        {active ? (
                          <Check className="h-3 w-3 shrink-0" />
                        ) : (
                          <span>+</span>
                        )}
                        <span>{s}</span>
                      </button>
                    );
                  })}
                </div>

                {(selectedPrefix || selectedSuffix) && (
                  <p className="text-[11px] text-[#5F6978]">
                    Hasil nama:{" "}
                    <span className="font-semibold text-[#141618]">
                      {composedSingleName ||
                        [selectedPrefix, "[Nama Tamu]", selectedSuffix]
                          .filter(Boolean)
                          .join(" ")}
                    </span>
                  </p>
                )}
              </div>

              {/* Grup Tamu + Tombol Submit */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-[#5F6978] mr-0.5">
                    Grup:
                  </span>
                  {GUEST_GROUPS.map((grp) => (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setSingleGroup(grp)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        singleGroup === grp
                          ? "bg-[#4F6BF6] text-white"
                          : "bg-white border border-black/10 text-[#5F6978] hover:text-[#141618]"
                      }`}
                    >
                      {grp}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {supportsContactPicker && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handlePickFromContacts}
                    >
                      <Contact className="h-3.5 w-3.5" />
                      Kontak HP
                    </Button>
                  )}
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!singleName.trim()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah ke Daftar
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* MODE 2: IMPORT EXCEL / CSV */}
          {inputMode === "excel" && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-[#4F6BF6]/30 bg-white p-5 text-center space-y-2 hover:border-[#4F6BF6] hover:bg-[#EEF2FF]/40 transition-colors"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F6BF6]">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-[#141618]">
                    {importingExcel
                      ? "Membaca daftar tamu..."
                      : "Pilih file Excel (.xlsx / .xls) atau CSV"}
                  </p>
                  <p className="text-[11px] text-[#5F6978] mt-0.5">
                    Kolom yang dikenali otomatis: <strong>Nama Tamu</strong>,{" "}
                    <strong>No WhatsApp</strong> (opsional), dan{" "}
                    <strong>Grup</strong> (opsional).
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImportExcelFile}
                  className="hidden"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[11px] text-[#5F6978]">
                  Belum punya format filenya? Unduh template siap isi:
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh Template Excel
                </Button>
              </div>
            </div>
          )}

          {/* MODE 3: TEMPEL MASSAL (PASTE FROM SHEETS / NOTES) */}
          {inputMode === "paste" && (
            <div className="space-y-3">
              <p className="text-[11.5px] text-[#5F6978] leading-relaxed">
                Cocok bila Anda ingin langsung <em>copy-paste</em> dari Google
                Sheets, Excel, atau catatan HP. Format yang didukung:{" "}
                <code className="font-mono text-[#141618]">Nama Tamu</code> atau{" "}
                <code className="font-mono text-[#141618]">
                  Nama Tamu, 08123456789, Keluarga
                </code>{" "}
                (1 tamu per baris).
              </p>
              <textarea
                rows={4}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={
                  "Bpk. Budi Santoso & Keluarga, 081234567890, Keluarga\nRina Wijaya & Partner, 081987654321, Teman\nAndika Pratama"
                }
                className="w-full rounded-2xl border border-black/10 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#141618] focus:outline-none focus:ring-2 focus:ring-[#4F6BF6]/30"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-medium text-[#5F6978]">
                    Grup bawaan:
                  </span>
                  {GUEST_GROUPS.map((grp) => (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setPasteGroup(grp)}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                        pasteGroup === grp
                          ? "bg-[#4F6BF6] text-white"
                          : "bg-white border border-black/10 text-[#5F6978]"
                      }`}
                    >
                      {grp}
                    </button>
                  ))}
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={!pasteText.trim()}
                  onClick={handleAddPastedList}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambahkan ke Daftar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar + Toolbar Daftar Tamu */}
        {guests.length > 0 ? (
          <div className="space-y-3.5">
            <div className="rounded-2xl border border-black/[0.06] bg-[#FAFAFB] p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#141618]">
                  <Users className="h-4 w-4 text-[#4F6BF6]" />
                  <span>
                    Progres Pengiriman: {sentCount} dari {guests.length} tamu (
                    {progressPct}%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-[11px]"
                    onClick={handleExportGuestList}
                  >
                    <Download className="h-3 w-3" />
                    Export
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2.5 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleClearAllGuests}
                  >
                    <Trash2 className="h-3 w-3" />
                    Bersihkan
                  </Button>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#4F6BF6] to-emerald-500 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5F6978]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama tamu, nomor WA, atau grup..."
                  className="h-9 pl-8 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: "ALL", label: `Semua (${guests.length})` },
                    {
                      id: "UNSENT",
                      label: `Belum (${guests.length - sentCount})`,
                    },
                    { id: "SENT", label: `Terkirim (${sentCount})` },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      statusFilter === f.id
                        ? "bg-midnight-btn text-white"
                        : "bg-[#F4F5F7] text-[#5F6978] hover:text-[#141618]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Group Filter Pills (jika > 1 grup) */}
            {availableGroups.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setGroupFilter("ALL")}
                  className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold transition-colors ${
                    groupFilter === "ALL"
                      ? "bg-[#EEF2FF] text-[#4F6BF6] border border-[#4F6BF6]/30"
                      : "bg-white border border-black/10 text-[#5F6978]"
                  }`}
                >
                  Semua Grup
                </button>
                {availableGroups.map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setGroupFilter(grp)}
                    className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold transition-colors ${
                      groupFilter === grp
                        ? "bg-[#EEF2FF] text-[#4F6BF6] border border-[#4F6BF6]/30"
                        : "bg-white border border-black/10 text-[#5F6978]"
                    }`}
                  >
                    {grp}
                  </button>
                ))}
              </div>
            )}

            {/* List Kartu Tamu (Pagination — tanpa nested scroll sempit) */}
            <div className="space-y-2">
              {filteredGuests.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-black/10 py-6 text-center text-xs text-[#5F6978]">
                  Tidak ada tamu yang cocok dengan filter pencarian.
                </p>
              ) : (
                paginatedGuests.map((guest) => {
                  const guestUrl = `${publicUrl}?to=${encodeURIComponent(guest.name)}`;
                  const waMsg = renderGuestWhatsAppMessage(customTemplate, {
                    guestName: guest.name,
                    coupleLabel,
                    invitationUrl: guestUrl,
                  });
                  const normalizedPhone = normalizeWhatsAppPhone(guest.phone);
                  const waHref = normalizedPhone
                    ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(waMsg)}`
                    : `https://wa.me/?text=${encodeURIComponent(waMsg)}`;
                  const copiedLink =
                    copiedAction?.id === guest.id &&
                    copiedAction.kind === "link";
                  const copiedMsg =
                    copiedAction?.id === guest.id &&
                    copiedAction.kind === "msg";

                  return (
                    <div
                      key={guest.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border px-3.5 py-3 transition-colors ${
                        guest.sent
                          ? "border-emerald-200/80 bg-emerald-50/40"
                          : "border-black/[0.07] bg-white hover:border-black/15"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleSent(guest.id)}
                          aria-label={
                            guest.sent
                              ? "Tandai belum dikirim"
                              : "Tandai sudah dikirim"
                          }
                          title={
                            guest.sent
                              ? "Sudah dikirim (klik untuk batal)"
                              : "Tandai sudah dikirim"
                          }
                          className="mt-0.5 shrink-0 text-[#5F6978] hover:text-emerald-600 transition-colors"
                        >
                          {guest.sent ? (
                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                          ) : (
                            <Circle className="h-4.5 w-4.5" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p
                              className={`text-xs sm:text-[13px] font-bold truncate ${
                                guest.sent
                                  ? "text-[#5F6978] line-through"
                                  : "text-[#141618]"
                              }`}
                            >
                              {guest.name}
                            </p>
                            <span className="rounded-full bg-[#F4F5F7] border border-black/[0.06] px-2 py-0.5 text-[10px] font-semibold text-[#5F6978]">
                              {guest.group}
                            </span>
                            {normalizedPhone && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                <Phone className="h-2.5 w-2.5" />
                                {formatDisplayPhone(guest.phone)}
                              </span>
                            )}
                          </div>
                          <p className="text-[10.5px] font-mono text-[#5F6978] truncate">
                            {guestUrl}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 pl-0 sm:pl-0 w-full sm:w-auto pt-1 sm:pt-0">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="flex-1 sm:flex-none h-8 px-2.5 text-[11px]"
                          onClick={() =>
                            copyText(
                              guest.id,
                              "link",
                              guestUrl,
                              `Tautan untuk ${guest.name} disalin.`
                            )
                          }
                          title="Salin tautan unik tamu"
                        >
                          {copiedLink ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Link2 className="h-3.5 w-3.5" />
                          )}
                          Link
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="flex-1 sm:flex-none h-8 px-2.5 text-[11px]"
                          onClick={() =>
                            copyText(
                              guest.id,
                              "msg",
                              waMsg,
                              `Pesan WA untuk ${guest.name} disalin.`
                            )
                          }
                          title="Salin teks pesan WhatsApp lengkap"
                        >
                          {copiedMsg ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          Pesan
                        </Button>

                        <Button
                          asChild
                          size="sm"
                          className="flex-1 sm:flex-none h-8 px-3 text-[11px]"
                        >
                          <a
                            href={waHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => markAsSent(guest.id)}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Kirim WA
                          </a>
                        </Button>

                        <button
                          type="button"
                          onClick={() => removeGuest(guest.id)}
                          aria-label={`Hapus ${guest.name}`}
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/[0.06] bg-white text-[#94A3B8] hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Kontrol Pagination Daftar Tamu */}
            {filteredGuests.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-black/[0.06]">
                <div className="flex items-center gap-2 text-[11px] text-[#5F6978]">
                  <span>
                    Menampilkan{" "}
                    <strong className="text-[#141618]">
                      {showingStart}–{showingEnd}
                    </strong>{" "}
                    dari{" "}
                    <strong className="text-[#141618]">
                      {filteredGuests.length}
                    </strong>{" "}
                    tamu
                  </span>
                  <span className="text-black/15">&middot;</span>
                  <div className="inline-flex items-center gap-1">
                    {([5, 10, 25, 50] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setPageSize(sz)}
                        className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold transition-colors ${
                          pageSize === sz
                            ? "bg-midnight-btn text-white"
                            : "bg-[#F4F5F7] text-[#5F6978] hover:text-[#141618]"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-[11px]"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Sebelumnya
                  </Button>
                  <span className="px-2 text-[11px] font-semibold text-[#141618] tabular-nums">
                    Hal. {safePage} / {totalPages}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-[11px]"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Berikutnya
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-black/10 bg-[#FAFAFB] px-5 py-7 text-center space-y-2">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EEF2FF] text-[#4F6BF6]">
              <UserPlus className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-[#141618]">
              Belum ada daftar tamu personalisasi
            </p>
            <p className="text-xs text-[#5F6978] max-w-md mx-auto leading-relaxed">
              Mulai tambahkan nama tamu lewat form di atas, atau impor daftar
              tamu dari file Excel/CSV. Daftar tamu &amp; status terkirim akan
              tersimpan otomatis di perangkat ini.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

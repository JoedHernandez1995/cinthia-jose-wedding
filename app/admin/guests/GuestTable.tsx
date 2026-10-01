"use client";

import { Fragment, useEffect, useMemo, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import type { Guest, GuestCompanion } from "@/types/guest";
import { useAdminToast } from "@/components/admin/Toast";
import { useAdminConfirm } from "@/components/admin/ConfirmDialog";
import { formatDateTime as formatDate } from "@/lib/formatDate";
import { wedding } from "@/config/site";
import {
  bulkDeclineUnviewedGuestsAction,
  bulkMarkInviteSentAction,
  bulkSetInvitedByAction,
  deleteCompanionAction,
  deleteGuestAction,
  markInviteSentAction,
  regenerateTokenAction,
  renameCompanionAction,
  sendClosureNoticeEmailAction,
  sendReminderEmailAction,
  toggleCompanionCheckedInAction,
  toggleGuestCheckedInAction,
} from "./actions";
import { BulkSendQueue } from "./BulkSendQueue";
import { BulkReminderQueue } from "./BulkReminderQueue";
import { BulkClosureNoticeQueue } from "./BulkClosureNoticeQueue";
import { RowActionsMenu, type RowActionItem } from "./RowActionsMenu";
import styles from "./GuestTable.module.css";

type PendingAction =
  | "whatsapp"
  | "regenerate"
  | "delete"
  | "resend"
  | "checkin"
  | "rename"
  | "reminderEmail"
  | "closureNoticeEmail";

export interface CompanionRowView extends GuestCompanion {
  resendLink: string;
}

export interface GuestRowView extends Omit<Guest, "companions"> {
  inviteLink: string;
  resendLink: string;
  reminderLink: string;
  companions: CompanionRowView[];
}

type QueueState = { kind: "invite" | "reminder"; guests: GuestRowView[]; excludedCount: number } | null;

type SideTab = "all" | "novio" | "novia" | "padres_novio" | "padres_novia";

// "Todos" (was "Ambos") — no longer just two sides, so "both" stopped being accurate once the
// parent categories were added.
const sideTabs: { key: SideTab; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "novio", label: "Novio" },
  { key: "novia", label: "Novia" },
  { key: "padres_novio", label: "Padres Novio" },
  { key: "padres_novia", label: "Padres Novia" },
];

interface GuestGroup {
  key: string;
  label: string;
  rows: GuestRowView[];
  personTotal: number;
}

// Headcount for a single invitation: confirmed rows have an exact count; a "no" always means the
// whole invited party declined (the "some companions still attend" case is represented as status
// "yes" with primaryAttending: false instead — never "no"), so partySizeAllowed is exact there too.
// Pending rows haven't said how many will actually come, so partySizeAllowed is an upper bound.
function personCount(g: GuestRowView): number {
  if (g.rsvpStatus === "yes") return g.rsvpAttendingCount ?? 0;
  return g.partySizeAllowed;
}

function personTotal(rows: GuestRowView[]): number {
  return rows.reduce((sum, g) => sum + personCount(g), 0);
}

export function GuestTable({ guests }: { guests: GuestRowView[] }) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const confirm = useAdminConfirm();
  const [search, setSearch] = useState("");
  const [sideTab, setSideTab] = useState<SideTab>("all");
  const [pending, setPending] = useState<{ id: string; action: PendingAction } | null>(null);
  const [editingCompanionId, setEditingCompanionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<QueueState>(null);
  const [emailReminderQueue, setEmailReminderQueue] = useState<{ guests: GuestRowView[]; excludedCount: number } | null>(
    null,
  );
  const [closureNoticeQueue, setClosureNoticeQueue] = useState<{ guests: GuestRowView[]; excludedCount: number } | null>(
    null,
  );
  const [bulkMarkPending, setBulkMarkPending] = useState(false);
  const [bulkSideValue, setBulkSideValue] = useState("");
  const [bulkSidePending, setBulkSidePending] = useState(false);
  const [bulkDeclinePending, setBulkDeclinePending] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [expandedCompanions, setExpandedCompanions] = useState<Set<string>>(new Set());

  // Recomputed every render (not hoisted to module scope) so a dashboard left open across the
  // deadline picks up the change without a reload.
  const pastRsvpDeadline = Date.now() > new Date(wedding.rsvpDeadlineIso).getTime();

  async function handleSendWhatsApp(guest: GuestRowView) {
    // Open synchronously (before any await) so popup blockers don't swallow it.
    window.open(guest.inviteLink, "_blank", "noopener");
    setPending({ id: guest.id, action: "whatsapp" });
    try {
      const formData = new FormData();
      formData.set("id", guest.id);
      await markInviteSentAction(formData);
      router.refresh();
      showToast(`Invitación marcada como enviada a ${guest.name}.`);
    } catch {
      showToast("No se pudo marcar la invitación como enviada.", "error");
    } finally {
      setPending(null);
    }
  }

  function handleResendConfirmation(guest: GuestRowView) {
    window.open(guest.resendLink, "_blank", "noopener");
  }

  function handleResendCompanion(companion: CompanionRowView) {
    window.open(companion.resendLink, "_blank", "noopener");
  }

  async function handleToggleGuestCheckedIn(guest: GuestRowView) {
    setPending({ id: guest.id, action: "checkin" });
    try {
      const formData = new FormData();
      formData.set("id", guest.id);
      formData.set("checkedIn", String(!guest.checkedIn));
      await toggleGuestCheckedInAction(formData);
      router.refresh();
      showToast(guest.checkedIn ? `Check-in de ${guest.name} deshecho.` : `${guest.name} marcado como llegado.`);
    } catch {
      showToast("No se pudo actualizar el check-in.", "error");
    } finally {
      setPending(null);
    }
  }

  async function handleToggleCompanionCheckedIn(companion: CompanionRowView) {
    setPending({ id: companion.id, action: "checkin" });
    try {
      const formData = new FormData();
      formData.set("companionId", companion.id);
      formData.set("checkedIn", String(!companion.checkedIn));
      await toggleCompanionCheckedInAction(formData);
      router.refresh();
      showToast(companion.checkedIn ? `Check-in de ${companion.name} deshecho.` : `${companion.name} marcado como llegado.`);
    } catch {
      showToast("No se pudo actualizar el check-in.", "error");
    } finally {
      setPending(null);
    }
  }

  function startRenameCompanion(companion: CompanionRowView) {
    setEditingCompanionId(companion.id);
    setEditingName(companion.name);
  }

  function cancelRenameCompanion() {
    setEditingCompanionId(null);
    setEditingName("");
  }

  async function handleSaveRenameCompanion(companion: CompanionRowView) {
    if (!editingName.trim()) return;
    setPending({ id: companion.id, action: "rename" });
    try {
      const formData = new FormData();
      formData.set("companionId", companion.id);
      formData.set("name", editingName);
      const result = await renameCompanionAction(formData);
      if (!result.ok) {
        showToast(result.message, "error");
        return;
      }
      router.refresh();
      cancelRenameCompanion();
      showToast("Nombre actualizado.");
    } catch {
      showToast("No se pudo actualizar el nombre.", "error");
    } finally {
      setPending(null);
    }
  }

  async function handleDeleteCompanion(companion: CompanionRowView, guestName: string) {
    const confirmed = await confirm(`¿Eliminar a ${companion.name} como acompañante de ${guestName}? Esta acción no se puede deshacer.`);
    if (!confirmed) return;
    setPending({ id: companion.id, action: "delete" });
    try {
      const formData = new FormData();
      formData.set("companionId", companion.id);
      await deleteCompanionAction(formData);
      router.refresh();
      showToast(`${companion.name} fue eliminado.`);
    } catch {
      showToast("No se pudo eliminar al acompañante.", "error");
    } finally {
      setPending(null);
    }
  }

  async function handleRegenerateLink(guest: GuestRowView) {
    const confirmed = await confirm(`¿Regenerar el link de ${guest.name}? Su enlace actual dejará de funcionar de inmediato.`);
    if (!confirmed) return;
    setPending({ id: guest.id, action: "regenerate" });
    try {
      const formData = new FormData();
      formData.set("id", guest.id);
      await regenerateTokenAction(formData);
      router.refresh();
      showToast(`Link de ${guest.name} regenerado.`);
    } catch {
      showToast("No se pudo regenerar el link.", "error");
    } finally {
      setPending(null);
    }
  }

  async function handleDelete(guest: GuestRowView) {
    const confirmed = await confirm(
      `¿Eliminar a ${guest.name}? Esto borra permanentemente su RSVP e historial de vistas. Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;
    setPending({ id: guest.id, action: "delete" });
    try {
      const formData = new FormData();
      formData.set("id", guest.id);
      await deleteGuestAction(formData);
      router.refresh();
      showToast(`${guest.name} fue eliminado.`);
    } catch {
      showToast("No se pudo eliminar al invitado.", "error");
    } finally {
      setPending(null);
    }
  }

  // Everything except "Editar" (kept inline in the row) lives behind the row's "⋯" menu — see
  // RowActionsMenu. Order roughly follows how often each action gets used.
  // "Enviar WhatsApp", "Enviar recordatorio por correo" (when eligible), and "Eliminar" are pinned
  // as always-visible buttons in the row instead — this menu only holds the less-frequent rest.
  function buildRowActions(guest: GuestRowView): RowActionItem[] {
    const isPending = pending?.id === guest.id;
    const items: RowActionItem[] = [];
    if (guest.rsvpStatus === "pending") {
      items.push({ key: "reminder", label: "Enviar recordatorio", onClick: () => handleSendReminder(guest) });
    }
    if (guest.rsvpStatus === "yes") {
      items.push({
        key: "resendConfirmation",
        label: "Reenviar comprobante",
        onClick: () => handleResendConfirmation(guest),
      });
      items.push({
        key: "checkin",
        label:
          isPending && pending?.action === "checkin"
            ? "Guardando…"
            : guest.checkedIn
              ? "Deshacer check-in"
              : "Marcar llegada",
        disabled: isPending,
        onClick: () => handleToggleGuestCheckedIn(guest),
      });
    }
    items.push({
      key: "regenerate",
      label: isPending && pending?.action === "regenerate" ? "Regenerando…" : "Regenerar link",
      disabled: isPending,
      onClick: () => handleRegenerateLink(guest),
    });
    return items;
  }

  function matchesSearch(g: GuestRowView, q: string): boolean {
    if (!q) return true;
    const matchesCompanion = g.companionNames.some((name) => name.toLowerCase().includes(q));
    return g.name.toLowerCase().includes(q) || g.whatsappNumber.includes(q) || matchesCompanion;
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guests.filter((g) => {
      if (!matchesSearch(g, q)) return false;
      // "Todos" (all) also includes guests with no side assigned yet — they only ever show up here,
      // never under any of the 4 specific-side tabs, since none is an exact match for them.
      if (sideTab !== "all" && g.invitedBy !== sideTab) return false;
      return true;
    });
  }, [guests, search, sideTab]);

  // When the active side tab hides a real match, say so — otherwise a search for a guest on a
  // different side silently reads as "this guest doesn't exist."
  const matchesOutsideTab = useMemo(() => {
    if (sideTab === "all" || !search.trim()) return [];
    const q = search.trim().toLowerCase();
    return guests.filter((g) => matchesSearch(g, q) && g.invitedBy !== sideTab);
  }, [guests, search, sideTab]);

  // Same 4 buckets in every tab, in a fixed priority order: the "done" bucket first, then the
  // warmest lead (already opened the invitation but hasn't answered), then the coldest lead, then
  // guests who already declined.
  const groups: GuestGroup[] = useMemo(() => {
    const confirmed: GuestRowView[] = [];
    const pendingViewed: GuestRowView[] = [];
    const pendingNotViewed: GuestRowView[] = [];
    const declined: GuestRowView[] = [];
    for (const g of filtered) {
      if (g.rsvpStatus === "yes") confirmed.push(g);
      else if (g.rsvpStatus === "no") declined.push(g);
      else if (g.viewCount > 0) pendingViewed.push(g);
      else pendingNotViewed.push(g);
    }
    return [
      { key: "confirmed", label: "Confirmados", rows: confirmed, personTotal: personTotal(confirmed) },
      {
        key: "pendingViewed",
        label: "Pendientes · vieron la invitación",
        rows: pendingViewed,
        personTotal: personTotal(pendingViewed),
      },
      {
        key: "pendingNotViewed",
        label: "Pendientes · no han visto",
        rows: pendingNotViewed,
        personTotal: personTotal(pendingNotViewed),
      },
      { key: "declined", label: "No asistirán", rows: declined, personTotal: personTotal(declined) },
    ];
  }, [filtered]);

  // Switching a filter can hide a previously-selected guest — drop it from the selection so it
  // isn't silently bulk-acted on while out of view.
  useEffect(() => {
    setSelectedIds((prev) => {
      const filteredIds = new Set(filtered.map((g) => g.id));
      const next = new Set([...prev].filter((id) => filteredIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filtered]);

  const selectedGuests = useMemo(() => filtered.filter((g) => selectedIds.has(g.id)), [filtered, selectedIds]);
  const allFilteredSelected = filtered.length > 0 && selectedGuests.length === filtered.length;

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllFiltered() {
    setSelectedIds(allFilteredSelected ? new Set() : new Set(filtered.map((g) => g.id)));
  }

  function toggleGroupCollapsed(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleCompanionsExpanded(guestId: string) {
    setExpandedCompanions((prev) => {
      const next = new Set(prev);
      if (next.has(guestId)) next.delete(guestId);
      else next.add(guestId);
      return next;
    });
  }

  // Clicking anywhere on a guest row toggles its companions, except when the click originated from
  // an interactive element inside the row (checkbox, name link, row-actions menu) — those already
  // have their own behavior and shouldn't also trigger the accordion.
  function handleRowClick(event: MouseEvent<HTMLTableRowElement>, guest: GuestRowView) {
    if (guest.companions.length === 0) return;
    if ((event.target as HTMLElement).closest("a, button, input")) return;
    toggleCompanionsExpanded(guest.id);
  }

  function handleSendReminder(guest: GuestRowView) {
    window.open(guest.reminderLink, "_blank", "noopener");
  }

  // Only guests who opened the invitation but haven't responded — and have an email on file —
  // are candidates for the reminder *email* (distinct from the WhatsApp reminder above, which
  // only requires `rsvpStatus === "pending"`). Once the deadline passes, nudging them to RSVP no
  // longer makes sense — `isClosureNoticeEligible` below takes over from that point.
  function isReminderEmailEligible(guest: GuestRowView): boolean {
    return guest.rsvpStatus === "pending" && guest.viewCount > 0 && Boolean(guest.email) && !pastRsvpDeadline;
  }

  // Mirrors `isClosureNoticeEligible` in lib/closureNotice.ts — duplicated here (not imported)
  // because that module pulls in `server-only`, the same reasoning `isReminderEmailEligible` above
  // already follows for its own eligibility check.
  function isClosureNoticeEligible(guest: GuestRowView): boolean {
    return guest.rsvpStatus === "pending" && guest.viewCount > 0 && Boolean(guest.email) && pastRsvpDeadline;
  }

  // The "Pendientes · no han visto" bucket — guests who never opened the invitation at all, so the
  // closure-notice email above doesn't even apply to them (it requires `viewCount > 0`). Once the
  // closure round has gone out, these are assumed to not be coming and get declared "no" en masse.
  function isUnviewedPendingEligible(guest: GuestRowView): boolean {
    return guest.rsvpStatus === "pending" && guest.viewCount === 0;
  }

  async function handleSendReminderEmail(guest: GuestRowView) {
    setPending({ id: guest.id, action: "reminderEmail" });
    try {
      const formData = new FormData();
      formData.set("id", guest.id);
      const result = await sendReminderEmailAction(formData);
      showToast(result.message, result.ok ? undefined : "error");
      if (result.ok) router.refresh();
    } catch {
      showToast("No se pudo enviar el recordatorio por correo.", "error");
    } finally {
      setPending(null);
    }
  }

  async function handleSendClosureNoticeEmail(guest: GuestRowView) {
    setPending({ id: guest.id, action: "closureNoticeEmail" });
    try {
      const formData = new FormData();
      formData.set("id", guest.id);
      const result = await sendClosureNoticeEmailAction(formData);
      showToast(result.message, result.ok ? undefined : "error");
      if (result.ok) router.refresh();
    } catch {
      showToast("No se pudo enviar el aviso de cierre.", "error");
    } finally {
      setPending(null);
    }
  }

  function openInviteQueue() {
    setQueue({ kind: "invite", guests: selectedGuests, excludedCount: 0 });
  }

  function openReminderQueue() {
    const eligible = selectedGuests.filter((g) => g.rsvpStatus === "pending");
    setQueue({ kind: "reminder", guests: eligible, excludedCount: selectedGuests.length - eligible.length });
  }

  function openEmailReminderQueue() {
    const eligible = selectedGuests.filter(isReminderEmailEligible);
    setEmailReminderQueue({ guests: eligible, excludedCount: selectedGuests.length - eligible.length });
  }

  function openClosureNoticeQueue() {
    const eligible = selectedGuests.filter(isClosureNoticeEligible);
    setClosureNoticeQueue({ guests: eligible, excludedCount: selectedGuests.length - eligible.length });
  }

  async function handleBulkMarkSent() {
    const confirmed = await confirm(
      `¿Marcar la invitación de ${selectedGuests.length} invitado(s) como enviada? Esto no abre WhatsApp, solo actualiza el registro.`,
    );
    if (!confirmed) return;
    setBulkMarkPending(true);
    try {
      const formData = new FormData();
      formData.set("ids", selectedGuests.map((g) => g.id).join(","));
      await bulkMarkInviteSentAction(formData);
      router.refresh();
      showToast(`Invitación marcada como enviada para ${selectedGuests.length} invitado(s).`);
      setSelectedIds(new Set());
    } catch {
      showToast("No se pudo actualizar la invitación en lote.", "error");
    } finally {
      setBulkMarkPending(false);
    }
  }

  async function handleBulkSetInvitedBy() {
    const targetLabel = sideTabs.find((t) => t.key === bulkSideValue)?.label ?? "Sin definir";
    const confirmed = await confirm(`¿Asignar "${targetLabel}" como lado de ${selectedGuests.length} invitado(s)?`);
    if (!confirmed) return;
    setBulkSidePending(true);
    try {
      const formData = new FormData();
      formData.set("ids", selectedGuests.map((g) => g.id).join(","));
      formData.set("invitedBy", bulkSideValue);
      await bulkSetInvitedByAction(formData);
      router.refresh();
      showToast(`Lado actualizado para ${selectedGuests.length} invitado(s).`);
      setSelectedIds(new Set());
    } catch {
      showToast("No se pudo actualizar el lado en lote.", "error");
    } finally {
      setBulkSidePending(false);
    }
  }

  async function handleBulkDeclineUnviewed() {
    const eligible = selectedGuests.filter(isUnviewedPendingEligible);
    if (eligible.length === 0) return;
    const confirmed = await confirm(
      `¿Marcar a ${eligible.length} invitado(s) que nunca vieron la invitación como "no asistirá"? Esta acción no se puede deshacer fácilmente.`,
    );
    if (!confirmed) return;
    setBulkDeclinePending(true);
    try {
      const formData = new FormData();
      formData.set("ids", eligible.map((g) => g.id).join(","));
      const result = await bulkDeclineUnviewedGuestsAction(formData);
      router.refresh();
      showToast(result.message, result.ok ? undefined : "error");
      setSelectedIds(new Set());
    } catch {
      showToast("No se pudo actualizar el estado en lote.", "error");
    } finally {
      setBulkDeclinePending(false);
    }
  }

  return (
    <div>
      <div className={styles.tabs}>
        {sideTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.tab} ${sideTab === tab.key ? styles.tabActive : ""}`}
            onClick={() => setSideTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.controls}>
        <input
          className={styles.search}
          placeholder="Buscar por nombre, acompañante o número..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className={styles.count}>
          {filtered.length} de {guests.length}
        </span>
        <button type="button" className={styles.actionLink} onClick={() => setCollapsedGroups(new Set())}>
          Expandir todo
        </button>
        <button
          type="button"
          className={styles.actionLink}
          onClick={() => setCollapsedGroups(new Set(groups.map((g) => g.key)))}
        >
          Colapsar todo
        </button>
      </div>

      {selectedGuests.length > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkCount}>{selectedGuests.length} seleccionado(s)</span>

          <div className={styles.bulkCluster}>
            <button type="button" className={styles.actionButton} onClick={openInviteQueue}>
              Enviar invitación ({selectedGuests.length})
            </button>
            <button type="button" className={styles.actionButton} onClick={openReminderQueue}>
              Enviar recordatorio ({selectedGuests.filter((g) => g.rsvpStatus === "pending").length})
            </button>
            <button type="button" className={styles.actionButton} onClick={openEmailReminderQueue}>
              Enviar recordatorio por correo ({selectedGuests.filter(isReminderEmailEligible).length})
            </button>
            {pastRsvpDeadline && (
              <button type="button" className={styles.actionButton} onClick={openClosureNoticeQueue}>
                Enviar aviso de cierre ({selectedGuests.filter(isClosureNoticeEligible).length})
              </button>
            )}
          </div>

          <div className={styles.bulkCluster}>
            <button type="button" className={styles.actionButton} disabled={bulkMarkPending} onClick={handleBulkMarkSent}>
              {bulkMarkPending ? "Guardando…" : `Marcar invitación como enviada (${selectedGuests.length})`}
            </button>
            <div className={styles.bulkSideGroup}>
              <select
                className={styles.select}
                value={bulkSideValue}
                onChange={(e) => setBulkSideValue(e.target.value)}
                disabled={bulkSidePending}
                aria-label="Asignar lado en lote"
              >
                <option value="">Sin definir</option>
                {sideTabs
                  .filter((tab) => tab.key !== "all")
                  .map((tab) => (
                    <option key={tab.key} value={tab.key}>
                      {tab.label}
                    </option>
                  ))}
              </select>
              <button type="button" className={styles.actionButton} disabled={bulkSidePending} onClick={handleBulkSetInvitedBy}>
                {bulkSidePending ? "Guardando…" : `Asignar lado (${selectedGuests.length})`}
              </button>
            </div>
            <button
              type="button"
              className={styles.actionButtonDanger}
              disabled={bulkDeclinePending}
              onClick={handleBulkDeclineUnviewed}
            >
              {bulkDeclinePending
                ? "Guardando…"
                : `Marcar como "no asistirá" (${selectedGuests.filter(isUnviewedPendingEligible).length})`}
            </button>
          </div>

          <div className={styles.bulkCluster}>
            <button type="button" className={styles.actionLink} onClick={() => setSelectedIds(new Set())}>
              Cancelar selección
            </button>
          </div>
        </div>
      )}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAllFiltered}
                  aria-label="Seleccionar todos los filtrados"
                />
              </th>
              <th>Nombre</th>
              <th>Lado</th>
              <th>Procedencia</th>
              <th>Check-in</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.empty}>
                  No hay invitados que coincidan.
                  {matchesOutsideTab.length > 0 && (
                    <div className={styles.emptyHint}>
                      {matchesOutsideTab.length} invitado{matchesOutsideTab.length === 1 ? "" : "s"} coincide
                      {matchesOutsideTab.length === 1 ? "" : "n"} en otras pestañas — probá &quot;Todos&quot;.
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              groups.map((group) => {
                const collapsed = collapsedGroups.has(group.key);
                return (
                <Fragment key={group.key}>
                  <tr className={styles.groupHeaderRow}>
                    <td colSpan={6}>
                      <button
                        type="button"
                        className={styles.groupHeaderButton}
                        onClick={() => toggleGroupCollapsed(group.key)}
                        aria-expanded={!collapsed}
                      >
                        <span className={`${styles.groupChevron} ${collapsed ? styles.groupChevronCollapsed : ""}`}>▾</span>
                        {group.label} ({group.rows.length} invitación{group.rows.length === 1 ? "" : "es"} ·{" "}
                        {group.personTotal} persona{group.personTotal === 1 ? "" : "s"}
                        {group.key !== "confirmed" && group.key !== "declined" ? " máx." : ""})
                      </button>
                    </td>
                  </tr>
                  {collapsed ? null : group.rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={styles.groupEmpty}>
                        Sin invitados en este grupo.
                      </td>
                    </tr>
                  ) : (
                    group.rows.map((guest) => {
                      const hasCompanions = guest.companions.length > 0;
                      const companionsExpanded = hasCompanions && expandedCompanions.has(guest.id);
                      return (
                      <Fragment key={guest.id}>
                        <tr
                          className={hasCompanions ? styles.rowExpandable : undefined}
                          onClick={(event) => handleRowClick(event, guest)}
                        >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(guest.id)}
                      onChange={() => toggleSelected(guest.id)}
                      aria-label={`Seleccionar a ${guest.name}`}
                    />
                  </td>
                  <td>
                    <a href={`/admin/guests/${guest.id}`} className={styles.nameLink}>
                      {guest.name}
                    </a>
                    {hasCompanions && (
                      <span className={styles.companionToggleHint}>
                        <span className={`${styles.groupChevron} ${companionsExpanded ? "" : styles.groupChevronCollapsed}`}>
                          ▾
                        </span>
                        {guest.companions.length} acompañante{guest.companions.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </td>
                  <td>
                    {guest.invitedBy === "novio" && <span className={styles.badgeSide}>Novio</span>}
                    {guest.invitedBy === "novia" && <span className={styles.badgeSide}>Novia</span>}
                    {guest.invitedBy === "padres_novio" && <span className={styles.badgeSide}>Padres Novio</span>}
                    {guest.invitedBy === "padres_novia" && <span className={styles.badgeSide}>Padres Novia</span>}
                    {!guest.invitedBy && <span className={styles.badgePending}>Sin definir</span>}
                  </td>
                  <td>
                    {guest.guestLocation === "extranjero" && <span className={styles.badgeLocation}>Extranjero</span>}
                    {guest.guestLocation === "local" && <span className={styles.badgeLocation}>Local</span>}
                    {!guest.guestLocation && <span className={styles.badgePending}>Sin definir</span>}
                  </td>
                  <td>
                    {guest.rsvpStatus === "yes" ? (
                      (() => {
                        const checkedInCount = (guest.checkedIn ? 1 : 0) + guest.companions.filter((c) => c.checkedIn).length;
                        return (
                          <span className={checkedInCount > 0 ? styles.badgeYes : styles.badgePending}>
                            {checkedInCount}/{guest.rsvpAttendingCount ?? 0}
                          </span>
                        );
                      })()
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={styles.actions}>
                    <a href={`/admin/guests/${guest.id}`} className={styles.actionButton}>
                      Editar
                    </a>
                    <button
                      type="button"
                      className={styles.actionLink}
                      disabled={pending?.id === guest.id}
                      onClick={() => handleSendWhatsApp(guest)}
                    >
                      {pending?.id === guest.id && pending.action === "whatsapp" ? "Enviando…" : "Enviar WhatsApp"}
                    </button>
                    {isReminderEmailEligible(guest) && (
                      <button
                        type="button"
                        className={styles.actionLink}
                        disabled={pending?.id === guest.id}
                        onClick={() => handleSendReminderEmail(guest)}
                      >
                        {pending?.id === guest.id && pending.action === "reminderEmail"
                          ? "Enviando…"
                          : "Enviar recordatorio por correo"}
                      </button>
                    )}
                    {isClosureNoticeEligible(guest) && (
                      <button
                        type="button"
                        className={styles.actionLink}
                        disabled={pending?.id === guest.id}
                        onClick={() => handleSendClosureNoticeEmail(guest)}
                      >
                        {pending?.id === guest.id && pending.action === "closureNoticeEmail"
                          ? "Enviando…"
                          : "Enviar aviso de cierre"}
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.actionButtonDanger}
                      disabled={pending?.id === guest.id}
                      onClick={() => handleDelete(guest)}
                    >
                      {pending?.id === guest.id && pending.action === "delete" ? "Eliminando…" : "Eliminar"}
                    </button>
                    <RowActionsMenu items={buildRowActions(guest)} />
                  </td>
                </tr>

                {companionsExpanded && (
                  <tr className={styles.companionSubRow}>
                    <td colSpan={6}>
                      <table className={styles.subTable}>
                        <thead>
                          <tr>
                            <th>Acompañante de {guest.name}</th>
                            <th>Check-in</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {guest.companions.map((companion) => (
                            <tr key={companion.id}>
                              <td>
                                {editingCompanionId === companion.id ? (
                                  <div className={styles.renameRow}>
                                    <input
                                      className={styles.renameInput}
                                      value={editingName}
                                      onChange={(e) => setEditingName(e.target.value)}
                                      disabled={pending?.id === companion.id}
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      className={styles.actionButton}
                                      disabled={pending?.id === companion.id || !editingName.trim()}
                                      onClick={() => handleSaveRenameCompanion(companion)}
                                    >
                                      {pending?.id === companion.id && pending.action === "rename" ? "Guardando…" : "Guardar"}
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.actionLink}
                                      disabled={pending?.id === companion.id}
                                      onClick={cancelRenameCompanion}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : (
                                  companion.name
                                )}
                              </td>
                              <td>
                                {companion.checkedIn ? (
                                  <span className={styles.badgeYes}>Sí · {formatDate(companion.checkedInAt)}</span>
                                ) : (
                                  <span className={styles.badgePending}>No ha llegado</span>
                                )}
                              </td>
                              <td className={styles.actions}>
                                <button
                                  type="button"
                                  className={styles.actionLink}
                                  disabled={pending?.id === companion.id}
                                  onClick={() => handleResendCompanion(companion)}
                                >
                                  Reenviar comprobante
                                </button>
                                <button
                                  type="button"
                                  className={styles.actionButton}
                                  disabled={pending?.id === companion.id}
                                  onClick={() => handleToggleCompanionCheckedIn(companion)}
                                >
                                  {pending?.id === companion.id && pending.action === "checkin"
                                    ? "Guardando…"
                                    : companion.checkedIn
                                      ? "Deshacer check-in"
                                      : "Marcar llegada"}
                                </button>
                                {editingCompanionId !== companion.id && (
                                  <button
                                    type="button"
                                    className={styles.actionButton}
                                    disabled={pending?.id === companion.id}
                                    onClick={() => startRenameCompanion(companion)}
                                  >
                                    Renombrar
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className={styles.actionButtonDanger}
                                  disabled={pending?.id === companion.id}
                                  onClick={() => handleDeleteCompanion(companion, guest.name)}
                                >
                                  {pending?.id === companion.id && pending.action === "delete" ? "Eliminando…" : "Eliminar"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
                      );
                    })
                  )}
                </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {queue && (
        <BulkSendQueue
          kind={queue.kind}
          guests={queue.guests}
          excludedCount={queue.excludedCount}
          onClose={() => setQueue(null)}
        />
      )}

      {emailReminderQueue && (
        <BulkReminderQueue
          guests={emailReminderQueue.guests}
          excludedCount={emailReminderQueue.excludedCount}
          onClose={() => setEmailReminderQueue(null)}
        />
      )}

      {closureNoticeQueue && (
        <BulkClosureNoticeQueue
          guests={closureNoticeQueue.guests}
          excludedCount={closureNoticeQueue.excludedCount}
          onClose={() => setClosureNoticeQueue(null)}
        />
      )}
    </div>
  );
}

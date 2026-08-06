"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Guest, GuestCompanion } from "@/types/guest";
import { useAdminToast } from "@/components/admin/Toast";
import { useAdminConfirm } from "@/components/admin/ConfirmDialog";
import { formatDateTime as formatDate } from "@/lib/formatDate";
import {
  bulkMarkInviteSentAction,
  deleteCompanionAction,
  deleteGuestAction,
  markInviteSentAction,
  regenerateTokenAction,
  renameCompanionAction,
  toggleCompanionCheckedInAction,
  toggleGuestCheckedInAction,
} from "./actions";
import { BulkSendQueue } from "./BulkSendQueue";
import styles from "./GuestTable.module.css";

type PendingAction = "whatsapp" | "regenerate" | "delete" | "resend" | "checkin" | "rename";

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

type StatusFilter = "all" | "pending" | "yes" | "no" | "not_sent";
type SideFilter = "all" | "novio" | "novia" | "sin_definir";

export function GuestTable({ guests }: { guests: GuestRowView[] }) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const confirm = useAdminConfirm();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sideFilter, setSideFilter] = useState<SideFilter>("all");
  const [pending, setPending] = useState<{ id: string; action: PendingAction } | null>(null);
  const [editingCompanionId, setEditingCompanionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<QueueState>(null);
  const [bulkMarkPending, setBulkMarkPending] = useState(false);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guests.filter((g) => {
      const matchesCompanion = g.companionNames.some((name) => name.toLowerCase().includes(q));
      if (q && !g.name.toLowerCase().includes(q) && !g.whatsappNumber.includes(q) && !matchesCompanion) return false;
      if (statusFilter === "not_sent") {
        if (g.inviteSent) return false;
      } else if (statusFilter !== "all" && g.rsvpStatus !== statusFilter) {
        return false;
      }
      const side = g.invitedBy ?? "sin_definir";
      if (sideFilter !== "all" && side !== sideFilter) return false;
      return true;
    });
  }, [guests, search, statusFilter, sideFilter]);

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

  function handleSendReminder(guest: GuestRowView) {
    window.open(guest.reminderLink, "_blank", "noopener");
  }

  function openInviteQueue() {
    setQueue({ kind: "invite", guests: selectedGuests, excludedCount: 0 });
  }

  function openReminderQueue() {
    const eligible = selectedGuests.filter((g) => g.rsvpStatus === "pending");
    setQueue({ kind: "reminder", guests: eligible, excludedCount: selectedGuests.length - eligible.length });
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

  return (
    <div>
      <div className={styles.controls}>
        <input
          className={styles.search}
          placeholder="Buscar por nombre, acompañante o número..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.select}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
        >
          <option value="all">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="yes">Confirmados</option>
          <option value="no">No asistirán</option>
          <option value="not_sent">Invitación no enviada</option>
        </select>
        <select className={styles.select} value={sideFilter} onChange={(e) => setSideFilter(e.target.value as SideFilter)}>
          <option value="all">Ambos lados</option>
          <option value="novio">Lado del novio</option>
          <option value="novia">Lado de la novia</option>
          <option value="sin_definir">Sin definir</option>
        </select>
        <span className={styles.count}>
          {filtered.length} de {guests.length}
        </span>
      </div>

      {selectedGuests.length > 0 && (
        <div className={styles.bulkBar}>
          <span className={styles.bulkCount}>{selectedGuests.length} seleccionado(s)</span>
          <button type="button" className={styles.actionButton} onClick={openInviteQueue}>
            Enviar invitación ({selectedGuests.length})
          </button>
          <button type="button" className={styles.actionButton} onClick={openReminderQueue}>
            Enviar recordatorio ({selectedGuests.filter((g) => g.rsvpStatus === "pending").length})
          </button>
          <button type="button" className={styles.actionButton} disabled={bulkMarkPending} onClick={handleBulkMarkSent}>
            {bulkMarkPending ? "Guardando…" : `Marcar invitación como enviada (${selectedGuests.length})`}
          </button>
          <button type="button" className={styles.actionLink} onClick={() => setSelectedIds(new Set())}>
            Cancelar selección
          </button>
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
              <th>WhatsApp</th>
              <th>Personas</th>
              <th>Invitación</th>
              <th>Vistas</th>
              <th>RSVP</th>
              <th>Check-in</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((guest) => (
              <Fragment key={guest.id}>
                <tr>
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
                  </td>
                  <td>
                    {guest.invitedBy === "novio" && <span className={styles.badgeSent}>Novio</span>}
                    {guest.invitedBy === "novia" && <span className={styles.badgeYes}>Novia</span>}
                    {!guest.invitedBy && <span className={styles.badgePending}>Sin definir</span>}
                  </td>
                  <td>
                    {guest.guestLocation === "extranjero" && <span className={styles.badgeSent}>Extranjero</span>}
                    {guest.guestLocation === "local" && <span className={styles.badgeYes}>Local</span>}
                    {!guest.guestLocation && <span className={styles.badgePending}>Sin definir</span>}
                  </td>
                  <td className={styles.mono}>{guest.whatsappNumber}</td>
                  <td>{guest.partySizeAllowed}</td>
                  <td>
                    {guest.inviteSent ? (
                      <span className={styles.badgeSent}>Enviada {formatDate(guest.inviteSentAt)}</span>
                    ) : (
                      <span className={styles.badgePending}>No enviada</span>
                    )}
                  </td>
                  <td>
                    {guest.viewCount > 0 ? (
                      <span title={`Última vez: ${formatDate(guest.lastViewedAt)}`}>
                        {guest.viewCount}× · {formatDate(guest.firstViewedAt)}
                      </span>
                    ) : (
                      <span className={styles.badgePending}>Sin ver</span>
                    )}
                  </td>
                  <td>
                    {guest.rsvpStatus === "yes" && <span className={styles.badgeYes}>Sí · {guest.rsvpAttendingCount}</span>}
                    {guest.rsvpStatus === "no" && <span className={styles.badgeNo}>No</span>}
                    {guest.rsvpStatus === "pending" && <span className={styles.badgePending}>Pendiente</span>}
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
                    {guest.rsvpStatus === "pending" && (
                      <button type="button" className={styles.actionLink} onClick={() => handleSendReminder(guest)}>
                        Enviar recordatorio
                      </button>
                    )}
                    {guest.rsvpStatus === "yes" && (
                      <>
                        <button
                          type="button"
                          className={styles.actionLink}
                          disabled={pending?.id === guest.id}
                          onClick={() => handleResendConfirmation(guest)}
                        >
                          Reenviar comprobante
                        </button>
                        <button
                          type="button"
                          className={styles.actionButton}
                          disabled={pending?.id === guest.id}
                          onClick={() => handleToggleGuestCheckedIn(guest)}
                        >
                          {pending?.id === guest.id && pending.action === "checkin"
                            ? "Guardando…"
                            : guest.checkedIn
                              ? "Deshacer check-in"
                              : "Marcar llegada"}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className={styles.actionButton}
                      disabled={pending?.id === guest.id}
                      onClick={() => handleRegenerateLink(guest)}
                    >
                      {pending?.id === guest.id && pending.action === "regenerate" ? "Regenerando…" : "Regenerar link"}
                    </button>
                    <button
                      type="button"
                      className={styles.actionButtonDanger}
                      disabled={pending?.id === guest.id}
                      onClick={() => handleDelete(guest)}
                    >
                      {pending?.id === guest.id && pending.action === "delete" ? "Eliminando…" : "Eliminar"}
                    </button>
                  </td>
                </tr>

                {guest.companions.length > 0 && (
                  <tr className={styles.companionSubRow}>
                    <td colSpan={11}>
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
                                  <span className={styles.badgePending}>Pendiente</span>
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
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className={styles.empty}>
                  No hay invitados que coincidan.
                </td>
              </tr>
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
    </div>
  );
}

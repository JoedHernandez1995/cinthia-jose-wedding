"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Guest } from "@/types/guest";
import { useAdminToast } from "@/components/admin/Toast";
import { useAdminConfirm } from "@/components/admin/ConfirmDialog";
import { deleteGuestAction, markInviteSentAction, regenerateTokenAction } from "./actions";
import styles from "./GuestTable.module.css";

type PendingAction = "whatsapp" | "regenerate" | "delete";

export interface GuestRowView extends Guest {
  inviteLink: string;
}

type StatusFilter = "all" | "pending" | "yes" | "no" | "not_sent";
type SideFilter = "all" | "novio" | "novia" | "sin_definir";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-HN", { dateStyle: "medium", timeStyle: "short" });
}

export function GuestTable({ guests }: { guests: GuestRowView[] }) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const confirm = useAdminConfirm();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sideFilter, setSideFilter] = useState<SideFilter>("all");
  const [pending, setPending] = useState<{ id: string; action: PendingAction } | null>(null);

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
      if (q && !g.name.toLowerCase().includes(q) && !g.whatsappNumber.includes(q)) return false;
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

  return (
    <div>
      <div className={styles.controls}>
        <input
          className={styles.search}
          placeholder="Buscar por nombre o número..."
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

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Lado</th>
              <th>WhatsApp</th>
              <th>Personas</th>
              <th>Invitación</th>
              <th>Vistas</th>
              <th>RSVP</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((guest) => (
              <tr key={guest.id}>
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
                  {guest.rsvpStatus === "yes" && (
                    <>
                      <span className={styles.badgeYes}>Sí · {guest.rsvpAttendingCount}</span>
                      {guest.companionNames.length > 0 && (
                        <ul className={styles.companionList}>
                          {guest.companionNames.map((name, i) => (
                            <li key={i}>{name}</li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                  {guest.rsvpStatus === "no" && <span className={styles.badgeNo}>No</span>}
                  {guest.rsvpStatus === "pending" && <span className={styles.badgePending}>Pendiente</span>}
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
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  No hay invitados que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

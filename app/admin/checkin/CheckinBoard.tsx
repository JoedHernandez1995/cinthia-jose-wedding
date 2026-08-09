"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Guest, GuestCompanion } from "@/types/guest";
import { useAdminToast } from "@/components/admin/Toast";
import { toggleCompanionCheckedInAction, toggleGuestCheckedInAction } from "@/app/admin/guests/actions";
import styles from "./CheckinBoard.module.css";

/**
 * Grouping is purely visual — every person (guest or companion) keeps their own independent
 * check-in toggle regardless of family. A companion can show "Llegó ✓" while their primary guest's
 * cluster still sits in "Por llegar." Column placement uses the primary's own `checkedIn` when
 * they're expected to attend; for a guest who declined while their companions still attend
 * (`primaryAttending === false`, no primary row at all), placement instead follows whether every
 * companion has arrived, since there's no primary status to anchor on.
 */
function clusterArrived(guest: Guest): boolean {
  if (guest.primaryAttending === false) {
    return guest.companions.length > 0 && guest.companions.every((c) => c.checkedIn);
  }
  return guest.checkedIn;
}

export function CheckinBoard({ guests }: { guests: Guest[] }) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [search, setSearch] = useState("");
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const expected = useMemo(() => guests.reduce((sum, g) => sum + (g.rsvpAttendingCount ?? 0), 0), [guests]);
  const arrived = useMemo(
    () =>
      guests.reduce((sum, g) => {
        const guestArrived = g.primaryAttending !== false && g.checkedIn ? 1 : 0;
        const companionsArrived = g.companions.filter((c) => c.checkedIn).length;
        return sum + guestArrived + companionsArrived;
      }, 0),
    [guests],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter(
      (g) => g.name.toLowerCase().includes(q) || g.companions.some((c) => c.name.toLowerCase().includes(q)),
    );
  }, [guests, search]);

  const notArrived = useMemo(
    () => filtered.filter((g) => !clusterArrived(g)).sort((a, b) => a.name.localeCompare(b.name, "es")),
    [filtered],
  );
  const arrivedClusters = useMemo(
    () => filtered.filter((g) => clusterArrived(g)).sort((a, b) => a.name.localeCompare(b.name, "es")),
    [filtered],
  );

  async function handleToggleGuest(guest: Guest) {
    setPendingKey(guest.id);
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
      setPendingKey(null);
    }
  }

  async function handleToggleCompanion(companion: GuestCompanion) {
    setPendingKey(companion.id);
    try {
      const formData = new FormData();
      formData.set("companionId", companion.id);
      formData.set("checkedIn", String(!companion.checkedIn));
      await toggleCompanionCheckedInAction(formData);
      router.refresh();
      showToast(
        companion.checkedIn ? `Check-in de ${companion.name} deshecho.` : `${companion.name} marcado como llegado.`,
      );
    } catch {
      showToast("No se pudo actualizar el check-in.", "error");
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.stat}>
        <span className={styles.statNumber}>
          {arrived} / {expected}
        </span>
        <span className={styles.statLabel}>personas han llegado</span>
      </div>

      <input
        className={styles.search}
        placeholder="Buscar por nombre..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className={styles.columns}>
        <CheckinColumn
          title={`Por llegar (${notArrived.length})`}
          guests={notArrived}
          pendingKey={pendingKey}
          onToggleGuest={handleToggleGuest}
          onToggleCompanion={handleToggleCompanion}
        />
        <CheckinColumn
          title={`Llegaron (${arrivedClusters.length})`}
          guests={arrivedClusters}
          pendingKey={pendingKey}
          onToggleGuest={handleToggleGuest}
          onToggleCompanion={handleToggleCompanion}
        />
      </div>
    </div>
  );
}

interface CheckinColumnProps {
  title: string;
  guests: Guest[];
  pendingKey: string | null;
  onToggleGuest: (guest: Guest) => void;
  onToggleCompanion: (companion: GuestCompanion) => void;
}

function CheckinColumn({ title, guests, pendingKey, onToggleGuest, onToggleCompanion }: CheckinColumnProps) {
  return (
    <div className={styles.column}>
      <h2 className={styles.columnTitle}>{title}</h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <tbody>
            {guests.map((guest) => (
              <tr key={guest.id} className={styles.row}>
                <td>
                  {guest.primaryAttending !== false && (
                    <div className={styles.rowMain}>
                      <span className={styles.rowName}>{guest.name}</span>
                      <button
                        type="button"
                        className={styles.toggleButton}
                        disabled={pendingKey === guest.id}
                        onClick={() => onToggleGuest(guest)}
                      >
                        {pendingKey === guest.id ? "Guardando…" : guest.checkedIn ? "Deshacer" : "Marcar llegada"}
                      </button>
                    </div>
                  )}
                  {guest.companions.length > 0 && (
                    <ul className={styles.companionList}>
                      {guest.companions.map((companion) => (
                        <li key={companion.id} className={styles.companionRow}>
                          <span className={styles.rowName}>
                            {companion.name}
                            {guest.primaryAttending === false && (
                              <span className={styles.rowMeta}> · acompañante de {guest.name}</span>
                            )}
                          </span>
                          <button
                            type="button"
                            className={styles.toggleButton}
                            disabled={pendingKey === companion.id}
                            onClick={() => onToggleCompanion(companion)}
                          >
                            {pendingKey === companion.id ? "Guardando…" : companion.checkedIn ? "Deshacer" : "Marcar llegada"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
            {guests.length === 0 && (
              <tr>
                <td className={styles.empty}>Sin invitados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

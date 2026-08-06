"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Guest } from "@/types/guest";
import { useAdminToast } from "@/components/admin/Toast";
import { toggleCompanionCheckedInAction, toggleGuestCheckedInAction } from "@/app/admin/guests/actions";
import styles from "./CheckinBoard.module.css";

interface PersonRow {
  key: string;
  guestId: string;
  companionId: string | null;
  name: string;
  guestName: string;
  isCompanion: boolean;
  checkedIn: boolean;
}

function flatten(guests: Guest[]): PersonRow[] {
  const rows: PersonRow[] = [];
  for (const guest of guests) {
    rows.push({
      key: guest.id,
      guestId: guest.id,
      companionId: null,
      name: guest.name,
      guestName: guest.name,
      isCompanion: false,
      checkedIn: guest.checkedIn,
    });
    for (const companion of guest.companions) {
      rows.push({
        key: companion.id,
        guestId: guest.id,
        companionId: companion.id,
        name: companion.name,
        guestName: guest.name,
        isCompanion: true,
        checkedIn: companion.checkedIn,
      });
    }
  }
  return rows;
}

export function CheckinBoard({ guests }: { guests: Guest[] }) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [search, setSearch] = useState("");
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const allRows = useMemo(() => flatten(guests), [guests]);
  const expected = useMemo(() => guests.reduce((sum, g) => sum + (g.rsvpAttendingCount ?? 0), 0), [guests]);
  const arrived = useMemo(() => allRows.filter((r) => r.checkedIn).length, [allRows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((r) => r.name.toLowerCase().includes(q));
  }, [allRows, search]);

  const notArrived = useMemo(
    () => filtered.filter((r) => !r.checkedIn).sort((a, b) => a.name.localeCompare(b.name, "es")),
    [filtered],
  );
  const arrivedRows = useMemo(
    () => filtered.filter((r) => r.checkedIn).sort((a, b) => a.name.localeCompare(b.name, "es")),
    [filtered],
  );

  async function handleToggle(row: PersonRow) {
    setPendingKey(row.key);
    try {
      const formData = new FormData();
      if (row.companionId) {
        formData.set("companionId", row.companionId);
        formData.set("checkedIn", String(!row.checkedIn));
        await toggleCompanionCheckedInAction(formData);
      } else {
        formData.set("id", row.guestId);
        formData.set("checkedIn", String(!row.checkedIn));
        await toggleGuestCheckedInAction(formData);
      }
      router.refresh();
      showToast(row.checkedIn ? `Check-in de ${row.name} deshecho.` : `${row.name} marcado como llegado.`);
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
          rows={notArrived}
          pendingKey={pendingKey}
          onToggle={handleToggle}
        />
        <CheckinColumn
          title={`Llegaron (${arrivedRows.length})`}
          rows={arrivedRows}
          pendingKey={pendingKey}
          onToggle={handleToggle}
        />
      </div>
    </div>
  );
}

interface CheckinColumnProps {
  title: string;
  rows: PersonRow[];
  pendingKey: string | null;
  onToggle: (row: PersonRow) => void;
}

function CheckinColumn({ title, rows, pendingKey, onToggle }: CheckinColumnProps) {
  return (
    <div className={styles.column}>
      <h2 className={styles.columnTitle}>{title}</h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className={styles.row}>
                <td>
                  <div className={styles.rowMain}>
                    <span className={styles.rowName}>
                      {row.name}
                      {row.isCompanion && <span className={styles.rowMeta}> · acompañante de {row.guestName}</span>}
                    </span>
                    <button
                      type="button"
                      className={styles.toggleButton}
                      disabled={pendingKey === row.key}
                      onClick={() => onToggle(row)}
                    >
                      {pendingKey === row.key ? "Guardando…" : row.checkedIn ? "Deshacer" : "Marcar llegada"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
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

import { buildGuestInviteLink, listGuests } from "@/lib/guests";
import { UploadCsvForm } from "./UploadCsvForm";
import { AddGuestForm } from "./AddGuestForm";
import { GuestTable, type GuestRowView } from "./GuestTable";
import styles from "./page.module.css";

export default async function AdminGuestsPage() {
  const guests = await listGuests();
  const rows: GuestRowView[] = guests.map((g) => ({ ...g, inviteLink: buildGuestInviteLink(g) }));

  return (
    <div>
      <div className={styles.headingRow}>
        <h1 className={styles.heading}>Invitados</h1>
        <a href="/admin/guests/export" className={styles.exportLink}>
          Exportar CSV
        </a>
      </div>

      <div className={styles.formsRow}>
        <UploadCsvForm />
        <AddGuestForm />
      </div>

      <GuestTable guests={rows} />
    </div>
  );
}

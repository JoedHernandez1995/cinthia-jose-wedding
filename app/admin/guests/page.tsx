import { buildGuestInviteLink, listGuests } from "@/lib/guests";
import type { CsvUploadResult } from "@/types/guest";
import { addSingleGuest, uploadGuestsCsv } from "./actions";
import { GuestTable, type GuestRowView } from "./GuestTable";
import styles from "./page.module.css";

function parseUploadResult(raw: string | undefined): CsvUploadResult | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CsvUploadResult;
  } catch {
    return null;
  }
}

export default async function AdminGuestsPage({
  searchParams,
}: {
  searchParams: { uploadResult?: string; addError?: string };
}) {
  const guests = await listGuests();
  const rows: GuestRowView[] = guests.map((g) => ({ ...g, inviteLink: buildGuestInviteLink(g) }));
  const uploadResult = parseUploadResult(searchParams.uploadResult);

  return (
    <div>
      <div className={styles.headingRow}>
        <h1 className={styles.heading}>Invitados</h1>
        <a href="/admin/guests/export" className={styles.exportLink}>
          Exportar CSV
        </a>
      </div>

      {searchParams.addError && <div className={styles.errorBanner}>{searchParams.addError}</div>}

      {uploadResult && (
        <div className={styles.uploadBanner}>
          <p>
            {uploadResult.inserted} nuevos · {uploadResult.updated} actualizados
            {uploadResult.skipped.length > 0 && ` · ${uploadResult.skipped.length} con errores`}
          </p>
          {uploadResult.skipped.length > 0 && (
            <ul className={styles.uploadErrors}>
              {uploadResult.skipped.map((e, i) => (
                <li key={i}>
                  Fila {e.row}: {e.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className={styles.formsRow}>
        <form action={uploadGuestsCsv} className={styles.card}>
          <h2 className={styles.cardHeading}>Importar CSV</h2>
          <p className={styles.cardHint}>
            Columnas: name, display_name (opcional), whatsapp_number, party_size_allowed (total de personas, incluyendo al
            invitado), invited_by (opcional: novio/novia)
          </p>
          <input type="file" name="file" accept=".csv" required className={styles.fileInput} />
          <button type="submit" className={styles.primaryButton}>
            Subir
          </button>
        </form>

        <form action={addSingleGuest} className={styles.card}>
          <h2 className={styles.cardHeading}>Agregar invitado</h2>
          <label htmlFor="name" style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#333" }}>
            Nombre Completo
          </label>
          <input type="text" name="name" placeholder="Nombre" required className={styles.textInput} />
          <label htmlFor="displayName" style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#333" }}>
            Nombre para mostrar (opcional, ej. &quot;Familia Martínez&quot;)
          </label>
          <input type="text" name="displayName" placeholder="Se usa el nombre de arriba si se deja vacío" className={styles.textInput} />
          <label htmlFor="whatsappNumber" style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#333" }}>
            WhatsApp (ej. 50499999999)
          </label>
          <input
            type="text"
            name="whatsappNumber"
            placeholder="WhatsApp (ej. 50499999999)"
            required
            className={styles.textInput}
          />
          <label htmlFor="partySizeAllowed" style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#333" }}>
            Total de personas permitidas (incluyendo al invitado)
          </label>
          <input
            type="number"
            name="partySizeAllowed"
            placeholder="Ej. 2 para el invitado + 1 acompañante"
            min={1}
            defaultValue={1}
            className={styles.textInput}
          />
          <label htmlFor="invitedBy" style={{ display: "block", marginBottom: 4, fontSize: 12, color: "#333" }}>
            Lado
          </label>
          <select name="invitedBy" defaultValue="novio" className={styles.textInput}>
            <option value="novio">Invitado del novio</option>
            <option value="novia">Invitado de la novia</option>
          </select>
          <button type="submit" className={styles.primaryButton}>
            Agregar
          </button>
        </form>
      </div>

      <GuestTable guests={rows} />
    </div>
  );
}

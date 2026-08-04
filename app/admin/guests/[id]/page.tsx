import { notFound } from "next/navigation";
import { buildGuestInviteLink, getGuestById, listGuestViews } from "@/lib/guests";
import { editGuestAction, overrideRsvpAction } from "@/app/admin/guests/actions";
import styles from "./page.module.css";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-HN", { dateStyle: "medium", timeStyle: "short" });
}

export const dynamic = "force-dynamic";

export default async function AdminGuestDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { editError?: string };
}) {
  const guest = await getGuestById(params.id);
  if (!guest) notFound();

  const views = await listGuestViews(guest.id);
  const inviteLink = buildGuestInviteLink(guest);

  return (
    <div>
      <a href="/admin/guests" className={styles.back}>
        ← Invitados
      </a>
      <h1 className={styles.heading}>{guest.name}</h1>

      {searchParams.editError && <div className={styles.errorBanner}>{searchParams.editError}</div>}

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h2 className={styles.panelHeading}>Editar información del invitado</h2>
          <p className={styles.muted}>Corrige el nombre, número o total de personas permitidas para {guest.name}.</p>
          <form action={editGuestAction} className={styles.overrideForm}>
            <input type="hidden" name="id" value={guest.id} />
            <label className={styles.label}>
              Nombre
              <input type="text" name="name" defaultValue={guest.name} required className={styles.input} />
            </label>
            <label className={styles.label}>
              Nombre para mostrar (ej. &quot;Familia Martínez&quot;) — vacío usa el nombre de arriba
              <input type="text" name="displayName" defaultValue={guest.displayName ?? ""} className={styles.input} />
            </label>
            <label className={styles.label}>
              WhatsApp
              <input
                type="text"
                name="whatsappNumber"
                defaultValue={guest.whatsappNumber}
                required
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              Total de personas permitidas (incluyendo al invitado)
              <input
                type="number"
                name="partySizeAllowed"
                defaultValue={guest.partySizeAllowed}
                min={1}
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              Lado
              <select name="invitedBy" defaultValue={guest.invitedBy ?? ""} className={styles.select}>
                <option value="">Sin definir</option>
                <option value="novio">Invitado del novio</option>
                <option value="novia">Invitado de la novia</option>
              </select>
            </label>
            <button type="submit" className={styles.submitButton}>
              Guardar cambios
            </button>
          </form>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelHeading}>Detalles</h2>
          <dl className={styles.dl}>
            <dt>Nombre para mostrar</dt>
            <dd>{guest.displayName ?? `(usa "${guest.name}")`}</dd>
            <dt>WhatsApp</dt>
            <dd>{guest.whatsappNumber}</dd>
            <dt>Correo</dt>
            <dd>{guest.email ?? "—"}</dd>
            <dt>Comprobante enviado</dt>
            <dd>
              {guest.confirmationSentAt
                ? `Sí · ${formatDate(guest.confirmationSentAt)}`
                : guest.confirmationSendError
                  ? `Falló: ${guest.confirmationSendError}`
                  : "No"}
            </dd>
            <dt>Lado</dt>
            <dd>
              {guest.invitedBy === "novio" && "Invitado del novio"}
              {guest.invitedBy === "novia" && "Invitado de la novia"}
              {!guest.invitedBy && "Sin definir"}
            </dd>
            <dt>Total de personas permitidas</dt>
            <dd>{guest.partySizeAllowed}</dd>
            <dt>Invitación</dt>
            <dd>{guest.inviteSent ? `Enviada · ${formatDate(guest.inviteSentAt)}` : "No enviada"}</dd>
            <dt>Enlace personal</dt>
            <dd className={styles.mono}>
              <a href={inviteLink} target="_blank" rel="noreferrer">
                {inviteLink}
              </a>
            </dd>
            <dt>Estado RSVP</dt>
            <dd>
              {guest.rsvpStatus === "pending" && "Pendiente"}
              {guest.rsvpStatus === "yes" && `Confirmado · ${guest.rsvpAttendingCount} asistente(s)`}
              {guest.rsvpStatus === "no" && "No asistirá"}
            </dd>
            <dt>Acompañantes confirmados</dt>
            <dd>{guest.companionNames.length > 0 ? guest.companionNames.join(", ") : "—"}</dd>
            <dt>Última respuesta</dt>
            <dd>{formatDate(guest.rsvpRespondedAt)}</dd>
            <dt>Comprobante PDF</dt>
            <dd>
              <a href={`/admin/guests/${guest.id}/pdf`} target="_blank" rel="noreferrer">
                Ver / descargar
              </a>
            </dd>
          </dl>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelHeading}>Historial de vistas ({guest.viewCount})</h2>
          {views.length === 0 ? (
            <p className={styles.muted}>Aún no ha abierto su invitación.</p>
          ) : (
            <ul className={styles.viewList}>
              {views.map((v) => (
                <li key={v.id}>{formatDate(v.viewedAt)}</li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelHeading}>Corrección manual</h2>
          <p className={styles.muted}>Ajusta la respuesta si el invitado te avisó por otro medio.</p>
          <form action={overrideRsvpAction} className={styles.overrideForm}>
            <input type="hidden" name="id" value={guest.id} />
            <label className={styles.label}>
              Estado
              <select name="status" defaultValue={guest.rsvpStatus === "pending" ? "yes" : guest.rsvpStatus} className={styles.select}>
                <option value="yes">Confirmado</option>
                <option value="no">No asistirá</option>
              </select>
            </label>
            <label className={styles.label}>
              Correo (para reenviar el comprobante)
              <input type="email" name="email" defaultValue={guest.email ?? ""} className={styles.input} placeholder="correo@ejemplo.com" />
            </label>
            <label className={styles.label}>
              Acompañantes (nombres separados por coma, máx {guest.partySizeAllowed - 1})
              <input
                type="text"
                name="companionNames"
                defaultValue={guest.companionNames.join(", ")}
                className={styles.input}
                placeholder="Ana, Luis"
              />
            </label>
            <button type="submit" className={styles.submitButton}>
              Guardar
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

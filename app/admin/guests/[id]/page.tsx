import { notFound } from "next/navigation";
import { buildGuestConfirmationResendLink, buildGuestInviteLink, getGuestActivity, getGuestById } from "@/lib/guests";
import { formatDateTime as formatDate } from "@/lib/formatDate";
import { EditGuestForm } from "./EditGuestForm";
import { OverrideRsvpForm } from "./OverrideRsvpForm";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function AdminGuestDetailPage({ params }: { params: { id: string } }) {
  const guest = await getGuestById(params.id);
  if (!guest) notFound();

  const activity = await getGuestActivity(guest);
  const inviteLink = buildGuestInviteLink(guest);

  return (
    <div>
      <a href="/admin/guests" className={styles.back}>
        ← Invitados
      </a>
      <h1 className={styles.heading}>{guest.name}</h1>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <h2 className={styles.panelHeading}>Editar información del invitado</h2>
          <p className={styles.muted}>Corrige el nombre, número o total de personas permitidas para {guest.name}.</p>
          <EditGuestForm guest={guest} />
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
            <dt>Check-in</dt>
            <dd>{guest.checkedIn ? `Sí · ${formatDate(guest.checkedInAt)}` : "No ha llegado"}</dd>
            <dt>Acompañantes confirmados</dt>
            <dd>
              {guest.companions.length > 0 ? (
                <ul className={styles.companionList}>
                  {guest.companions.map((companion) => (
                    <li key={companion.id} className={styles.companionRow}>
                      <span>
                        <span className={styles.companionName}>{companion.name}</span>
                        <br />
                        <span className={styles.companionOf}>Acompañante de {guest.name}</span>
                      </span>
                      <span>
                        <span className={styles.companionCode} title="Código de check-in">
                          {companion.checkinCode}
                        </span>
                        <br />
                        <span className={styles.companionOf}>
                          {companion.checkedIn ? `Check-in · ${formatDate(companion.checkedInAt)}` : "No ha llegado"}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                "—"
              )}
            </dd>
            <dt>Última respuesta</dt>
            <dd>{formatDate(guest.rsvpRespondedAt)}</dd>
            <dt>Comprobante PDF</dt>
            <dd>
              <a href={`/admin/guests/${guest.id}/pdf`} target="_blank" rel="noreferrer">
                Ver / descargar
              </a>
              {guest.rsvpStatus === "yes" && (
                <>
                  {" · "}
                  <a href={buildGuestConfirmationResendLink(guest)} target="_blank" rel="noreferrer">
                    Reenviar por WhatsApp
                  </a>
                </>
              )}
            </dd>
          </dl>
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelHeading}>Actividad</h2>
          {activity.length === 0 ? (
            <p className={styles.muted}>Aún no hay actividad registrada.</p>
          ) : (
            <ul className={styles.viewList}>
              {activity.map((entry, i) => (
                <li key={i}>
                  {entry.label} el {formatDate(entry.occurredAt)}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.panel}>
          <h2 className={styles.panelHeading}>Corrección manual</h2>
          <p className={styles.muted}>Ajusta la respuesta si el invitado te avisó por otro medio.</p>
          <OverrideRsvpForm guest={guest} />
        </section>
      </div>
    </div>
  );
}

import "server-only";
import { Resend } from "resend";
import { requireEnv } from "@/lib/env";
import { coupleNames, wedding } from "@/config/site";
import { brandColors } from "@/lib/brandTheme";

function getResendClient(): Resend {
  return new Resend(requireEnv("RESEND_API_KEY"));
}

export interface SendRsvpConfirmationEmailInput {
  to: string;
  guestName: string;
  status: "yes" | "no";
  /** Personal token — builds the `/i/[token]#rsvp` link so the guest can edit their response. */
  token: string;
  /** Only set when `status` is "yes" — a "no" RSVP has no check-in QR codes to send. */
  pdfBuffer?: Buffer;
}

/**
 * Email clients fetch images over the network and can't read local files, so the logo needs a real
 * public URL — unlike the PDF, which reads `public/assets/monogram.png` straight off disk.
 */
function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

const summaryFields: Array<{ label: string; value: string }> = [
  { label: "Fecha", value: wedding.dateLabel },
  { label: "Hora", value: wedding.timeLabel },
  { label: "Lugar", value: wedding.venueName },
  { label: "Dirección", value: wedding.venueAddress },
  { label: "Vestimenta", value: wedding.dressCode },
];

/**
 * Hand-written, email-client-safe HTML (inline styles only, simple centered layout) — no templating
 * library is installed and this is the only email in the app, so pulling one in isn't warranted.
 * Custom web fonts aren't reliably supported across email clients (Outlook desktop in particular),
 * so this intentionally falls back to system font stacks rather than the site's Poppins/Slight —
 * that's an inherent email-client limitation, not something worth fighting here.
 */
function buildConfirmationEmailHtml(guestName: string, status: "yes" | "no", editLink: string): string {
  const siteUrl = getSiteUrl();
  const summaryRows = summaryFields
    .map(
      (field, index) => `
        <tr>
          <td style="padding: 8px 0; ${index < summaryFields.length - 1 ? `border-bottom: 1px solid ${brandColors.border};` : ""} font: 500 11px/1.4 -apple-system, Helvetica, Arial, sans-serif; text-transform: uppercase; letter-spacing: 0.05em; color: ${brandColors.taupe};">
            ${field.label}
          </td>
          <td style="padding: 8px 0; ${index < summaryFields.length - 1 ? `border-bottom: 1px solid ${brandColors.border};` : ""} font: 500 13px/1.4 -apple-system, Helvetica, Arial, sans-serif; color: ${brandColors.ink}; text-align: right;">
            ${field.value}
          </td>
        </tr>`,
    )
    .join("");

  const introText =
    status === "yes"
      ? `¡Qué alegría saber que vas a acompañarnos! Gracias por confirmar. Nos hace mucha ilusión compartir este día con vos.`
      : `Entendemos que esta vez no vas a poder acompañarnos. Gracias por avisarnos. Nos hubiera encantado tenerte con nosotros.`;

  const editText =
    status === "yes"
      ? `¿Cambiaste de planes? No pasa nada. Podés actualizar tu respuesta antes del ${wedding.rsvpDeadlineLabel} desde el siguiente enlace.`
      : `¿Cambiaste de planes? Nos encantaría que pudieras acompañarnos. Podés actualizar tu respuesta antes del ${wedding.rsvpDeadlineLabel} desde el siguiente enlace.`;

  const summarySection =
    status === "yes"
      ? `
        <div style="padding: 0 32px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${brandColors.bgAlt}; border: 1px solid ${brandColors.border}; border-radius: 6px; padding: 4px 18px;">
            ${summaryRows}
          </table>
        </div>

        <div style="padding: 0 32px 28px; text-align: center;">
          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: ${brandColors.mutedLight};">
            Adjunto encontrarás tu comprobante en PDF con el resumen del evento y tu código QR de
            acceso — preséntalo (impreso o desde tu celular) al llegar. ¡Nos vemos pronto!
          </p>
        </div>`
      : "";

  return `
    <div style="background: ${brandColors.bg}; padding: 32px 16px; font-family: -apple-system, Helvetica, Arial, sans-serif;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid ${brandColors.border};">
        <div style="padding: 36px 32px 28px; text-align: center;">
          <img src="${siteUrl}/assets/monogram.png" alt="${coupleNames.full}" width="48" style="margin-bottom: 16px;" />
          <h1 style="margin: 0 0 10px; font: 400 26px/1.3 Georgia, 'Times New Roman', serif; color: ${brandColors.ink};">
            ${coupleNames.full}
          </h1>
          <div style="width: 48px; height: 2px; background: ${brandColors.gold}; margin: 0 auto 18px;"></div>
          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: ${brandColors.muted};">
            ${introText}
          </p>
        </div>

        ${summarySection}

        <div style="padding: 0 32px 32px; text-align: center;">
          <p style="margin: 0 0 18px; font-size: 13px; line-height: 1.6; color: ${brandColors.mutedLight};">
            ${editText}
          </p>
          <a href="${editLink}" style="display: inline-block; background: ${brandColors.gold}; color: #ffffff; font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-decoration: none; padding: 12px 24px; border-radius: 4px;">
            Editar mi respuesta
          </a>
        </div>

        <div style="padding: 16px 32px; background: ${brandColors.bgAlt}; border-top: 1px solid ${brandColors.border}; text-align: center;">
          <p style="margin: 0; font-size: 11px; letter-spacing: 0.05em; color: ${brandColors.taupeLight};">
            ${coupleNames.full} · ${wedding.dateLabel}
          </p>
        </div>
      </div>
    </div>`;
}

export async function sendRsvpConfirmationEmail({ to, guestName, status, token, pdfBuffer }: SendRsvpConfirmationEmailInput): Promise<void> {
  const resend = getResendClient();
  const fromEmail = requireEnv("RESEND_FROM_EMAIL");
  const editLink = `${getSiteUrl()}/i/${token}#rsvp`;

  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject:
      status === "yes"
        ? `Confirmación de asistencia — Boda ${coupleNames.full}`
        : `Recibimos tu respuesta — Boda ${coupleNames.full}`,
    html: buildConfirmationEmailHtml(guestName, status, editLink),
    attachments: pdfBuffer
      ? [
          {
            filename: "Confirmacion-Boda.pdf",
            content: pdfBuffer,
          },
        ]
      : undefined,
  });

  if (error) {
    throw new Error(error.message);
  }
}

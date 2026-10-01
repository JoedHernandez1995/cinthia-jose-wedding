import "server-only";
import { Resend } from "resend";
import { requireEnv } from "@/lib/env";
import { coupleNames, faqContact, plannerWhatsAppNumber, wedding, whatsappMessages } from "@/config/site";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { brandColors } from "@/lib/brandTheme";

function getResendClient(): Resend {
  return new Resend(requireEnv("RESEND_API_KEY"));
}

export interface SendRsvpConfirmationEmailInput {
  to: string;
  guestName: string;
  status: "yes" | "no";
  /** Only meaningful when `status` is "yes". False means the named guest declined but named companions still attend. */
  primaryAttending: boolean | null;
  companionNames: string[];
  /** Personal token — builds the `/i/[token]#rsvp` link so the guest can edit their response. */
  token: string;
  /** Only set when `status` is "yes" — a "no" RSVP has no check-in QR codes to send. */
  pdfBuffer?: Buffer;
}

/** "attending" = the named guest is coming (with or without companions); "declined" = nobody in the party is coming; "companionsOnly" = the named guest declined but named companions still attend. */
type ConfirmationVariant = "attending" | "declined" | "companionsOnly";

function variantOf(status: "yes" | "no", primaryAttending: boolean | null): ConfirmationVariant {
  if (status === "no") return "declined";
  return primaryAttending === false ? "companionsOnly" : "attending";
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
function buildConfirmationEmailHtml(
  guestName: string,
  variant: ConfirmationVariant,
  editLink: string,
  companionNames: string[],
): string {
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
    variant === "attending"
      ? `¡Qué alegría saber que vas a acompañarnos! Gracias por confirmar. Nos hace mucha ilusión compartir este día con vos.`
      : variant === "companionsOnly"
        ? `Entendemos que no vas a poder acompañarnos, pero nos alegra saber que sí vendrán: ${companionNames.join(", ")}. Gracias por avisarnos.`
        : `Entendemos que esta vez no vas a poder acompañarnos. Gracias por avisarnos. Nos hubiera encantado tenerte con nosotros.`;

  const editText =
    variant === "declined"
      ? `¿Cambiaste de planes? Nos encantaría que pudieras acompañarnos. Podés actualizar tu respuesta antes del ${wedding.rsvpDeadlineLabel} desde el siguiente enlace.`
      : `¿Cambiaste de planes? No pasa nada. Podés actualizar tu respuesta antes del ${wedding.rsvpDeadlineLabel} desde el siguiente enlace.`;

  const summarySection =
    variant === "declined"
      ? ""
      : `
        <div style="padding: 0 32px 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${brandColors.bgAlt}; border: 1px solid ${brandColors.border}; border-radius: 6px; padding: 4px 18px;">
            ${summaryRows}
          </table>
        </div>

        <div style="padding: 0 32px 28px; text-align: center;">
          <p style="margin: 0; font-size: 13px; line-height: 1.6; color: ${brandColors.mutedLight};">
            ${
              variant === "companionsOnly"
                ? "Adjunto encontrarás el comprobante en PDF con el resumen del evento y los códigos QR de acceso de tus acompañantes."
                : "Adjunto encontrarás tu comprobante en PDF con el resumen del evento y tu código QR de acceso."
            }
            Al llegar, ${variant === "companionsOnly" ? "deben presentarlo" : "presentalo"} desde el celular o impreso para poder ingresar.
            ¡Nos vemos pronto!
          </p>
        </div>`;

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

export async function sendRsvpConfirmationEmail({
  to,
  guestName,
  status,
  primaryAttending,
  companionNames,
  token,
  pdfBuffer,
}: SendRsvpConfirmationEmailInput): Promise<void> {
  const resend = getResendClient();
  const fromEmail = requireEnv("RESEND_FROM_EMAIL");
  const editLink = `${getSiteUrl()}/i/${token}#rsvp`;
  const variant = variantOf(status, primaryAttending);

  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject:
      variant === "declined"
        ? `Recibimos tu respuesta — Boda ${coupleNames.full}`
        : variant === "companionsOnly"
          ? `Confirmación de asistencia de tus acompañantes — Boda ${coupleNames.full}`
          : `Confirmación de asistencia — Boda ${coupleNames.full}`,
    html: buildConfirmationEmailHtml(guestName, variant, editLink, companionNames),
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

export interface SendRsvpReminderEmailInput {
  to: string;
  guestName: string;
  /** Personal token — builds the `/i/[token]#rsvp` link so the guest can respond directly. */
  token: string;
}

/**
 * Same hand-written inline-styled HTML approach as `buildConfirmationEmailHtml` — a shorter card
 * with a single CTA, no summary table or PDF attachment, since this only nudges an unanswered
 * guest toward the RSVP form rather than confirming an outcome.
 */
function buildReminderEmailHtml(guestName: string, rsvpLink: string): string {
  const siteUrl = getSiteUrl();

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
            ¡Hola${guestName ? `, ${guestName}` : ""}! Todavía no hemos recibido tu confirmación de asistencia para nuestra boda.
            Nos encantaría contar con tu respuesta antes del ${wedding.rsvpDeadlineLabel}.
          </p>
        </div>

        <div style="padding: 0 32px 32px; text-align: center;">
          <a href="${rsvpLink}" style="display: inline-block; background: ${brandColors.gold}; color: #ffffff; font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-decoration: none; padding: 12px 24px; border-radius: 4px;">
            Confirmar asistencia
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

export async function sendRsvpReminderEmail({ to, guestName, token }: SendRsvpReminderEmailInput): Promise<void> {
  const resend = getResendClient();
  const fromEmail = requireEnv("RESEND_FROM_EMAIL");
  const rsvpLink = `${getSiteUrl()}/i/${token}#rsvp`;

  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject: `Todavía esperamos tu confirmación — Boda ${coupleNames.full}`,
    html: buildReminderEmailHtml(guestName, rsvpLink),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export interface SendRsvpClosureEmailInput {
  to: string;
  guestName: string;
}

/**
 * Same hand-written inline-styled HTML approach as the other two templates — a one-time, manually
 * triggered email (never part of the automated reminder cadence) for a guest who viewed the
 * invitation but never responded before `wedding.rsvpDeadlineIso`. Tells them the window closed,
 * but leaves the door open: they can still try to attend by reaching the planner directly, with
 * the caveat that a plate/seat isn't guaranteed past the deadline. The WhatsApp CTA is a `wa.me`
 * deep link, same channel used everywhere else a guest reaches the planner (see "How WhatsApp is
 * actually used" in CLAUDE.md) — not a mailto, since the planner's contact point in this app has
 * always been WhatsApp, never email.
 */
function buildClosureEmailHtml(guestName: string, plannerLink: string): string {
  const siteUrl = getSiteUrl();

  return `
    <div style="background: ${brandColors.bg}; padding: 32px 16px; font-family: -apple-system, Helvetica, Arial, sans-serif;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid ${brandColors.border};">
        <div style="padding: 36px 32px 28px; text-align: center;">
          <img src="${siteUrl}/assets/monogram.png" alt="${coupleNames.full}" width="48" style="margin-bottom: 16px;" />
          <h1 style="margin: 0 0 10px; font: 400 26px/1.3 Georgia, 'Times New Roman', serif; color: ${brandColors.ink};">
            ${coupleNames.full}
          </h1>
          <div style="width: 48px; height: 2px; background: ${brandColors.gold}; margin: 0 auto 18px;"></div>
          <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.6; color: ${brandColors.muted};">
            ${guestName ? `${guestName}, l` : "L"}a fecha para confirmar tu asistencia ya pasó, y nos hubiera encantado
            contar con vos en este día tan especial.
          </p>
          <p style="margin: 0 0 14px; font-size: 15px; line-height: 1.6; color: ${brandColors.muted};">
            Si todavía querés acompañarnos, podés escribirle a <b>${faqContact.name}</b>, nuestra wedding planner, y
            con gusto revisará si todavía hay disponibilidad para incluirte.
          </p>
          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: ${brandColors.muted};">
            Como la fecha límite ya pasó, en este momento no podemos garantizar tu lugar, pero haremos lo posible
            por ayudarte.
          </p>
        </div>

        <div style="padding: 0 32px 32px; text-align: center;">
          <a href="${plannerLink}" target="_blank" rel="noopener" style="display: inline-block; background: ${brandColors.gold}; color: #ffffff; font-size: 12px; font-weight: 600; letter-spacing: 0.05em; text-decoration: none; padding: 12px 24px; border-radius: 4px;">
            Escribirle a ${faqContact.name}
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

export async function sendRsvpClosureEmail({ to, guestName }: SendRsvpClosureEmailInput): Promise<void> {
  const resend = getResendClient();
  const fromEmail = requireEnv("RESEND_FROM_EMAIL");
  const plannerLink = buildWhatsAppLink(plannerWhatsAppNumber, whatsappMessages.rsvpWindowClosedInquiry(guestName));

  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject: `La confirmación ya cerró — Boda ${coupleNames.full}`,
    html: buildClosureEmailHtml(guestName, plannerLink),
  });

  if (error) {
    throw new Error(error.message);
  }
}

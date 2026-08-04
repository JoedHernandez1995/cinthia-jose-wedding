import "server-only";
import { Resend } from "resend";
import { requireEnv } from "@/lib/env";
import { coupleNames } from "@/config/site";

function getResendClient(): Resend {
  return new Resend(requireEnv("RESEND_API_KEY"));
}

export interface SendRsvpConfirmationEmailInput {
  to: string;
  guestName: string;
  pdfBuffer: Buffer;
}

export async function sendRsvpConfirmationEmail({ to, guestName, pdfBuffer }: SendRsvpConfirmationEmailInput): Promise<void> {
  const resend = getResendClient();
  const fromEmail = requireEnv("RESEND_FROM_EMAIL");

  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject: `Confirmación de asistencia — Boda ${coupleNames.full}`,
    html: `<p>¡Hola ${guestName}!</p><p>Gracias por confirmar tu asistencia a la boda de ${coupleNames.full}. Adjunto encontrarás un comprobante con el resumen del evento y tu código QR de acceso.</p><p>¡Nos vemos pronto!</p>`,
    attachments: [
      {
        filename: "Confirmacion-Boda.pdf",
        content: pdfBuffer,
      },
    ],
  });

  if (error) {
    throw new Error(error.message);
  }
}

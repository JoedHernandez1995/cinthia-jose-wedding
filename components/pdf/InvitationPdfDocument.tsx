import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { brandColors, brandFonts } from "@/lib/brandTheme";

export interface PdfPerson {
  name: string;
  checkinCode: string;
  qrDataUri: string;
}

export interface InvitationPdfDocumentProps {
  /** Filesystem path to the monogram image, resolved by the caller (`lib/pdf.tsx`). */
  monogramSrc: string;
  coupleNames: string;
  dateLabel: string;
  timeLabel: string;
  venueName: string;
  venueAddress: string;
  dressCode: string;
  /** Index 0 is always the primary guest; the rest are their named companions. */
  people: PdfPerson[];
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: brandFonts.label,
    fontWeight: 400,
    color: brandColors.ink,
  },
  header: { alignItems: "center", marginBottom: 18 },
  monogram: { width: 76, height: 95, marginBottom: 8 },
  coupleNames: {
    fontFamily: brandFonts.display,
    fontWeight: 400,
    fontSize: 26,
    color: brandColors.ink,
    marginBottom: 8,
  },
  goldRule: { width: 48, height: 1.5, backgroundColor: brandColors.gold, marginBottom: 8 },
  subheading: {
    fontSize: 9,
    fontWeight: 500,
    color: brandColors.taupe,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  summaryBox: {
    backgroundColor: brandColors.bgAlt,
    borderWidth: 1,
    borderColor: brandColors.border,
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: brandColors.border,
  },
  summaryRowLast: { borderBottomWidth: 0 },
  summaryLabel: {
    fontSize: 9,
    fontWeight: 500,
    color: brandColors.taupe,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryValue: { fontSize: 11, fontWeight: 500, color: brandColors.ink },
  peopleHeading: {
    fontSize: 10,
    fontWeight: 600,
    color: brandColors.gold,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  person: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: brandColors.border,
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  personQr: { width: 52, height: 52, marginRight: 14 },
  personName: { fontSize: 12, fontWeight: 500, color: brandColors.ink, marginBottom: 3 },
  personCode: { fontSize: 8, fontWeight: 400, color: brandColors.taupeLight, letterSpacing: 0.5 },
  footer: {
    marginTop: 14,
    fontSize: 9,
    fontWeight: 400,
    color: brandColors.mutedLight,
    textAlign: "center",
  },
});

const summaryFields: Array<{ label: string; key: "dateLabel" | "timeLabel" | "venueName" | "venueAddress" | "dressCode" }> = [
  { label: "Fecha", key: "dateLabel" },
  { label: "Hora", key: "timeLabel" },
  { label: "Lugar", key: "venueName" },
  { label: "Dirección", key: "venueAddress" },
  { label: "Vestimenta", key: "dressCode" },
];

/** Pure presentational PDF: event summary + one QR-coded entry per person (guest + each named companion). */
export function InvitationPdfDocument(props: InvitationPdfDocumentProps) {
  const { monogramSrc, coupleNames, people } = props;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={monogramSrc} style={styles.monogram} />
          <Text style={styles.coupleNames}>{coupleNames}</Text>
          <View style={styles.goldRule} />
          <Text style={styles.subheading}>Comprobante de confirmación de asistencia</Text>
        </View>

        <View style={styles.summaryBox}>
          {summaryFields.map((field, index) => (
            <View
              key={field.key}
              style={index === summaryFields.length - 1 ? { ...styles.summaryRow, ...styles.summaryRowLast } : styles.summaryRow}
            >
              <Text style={styles.summaryLabel}>{field.label}</Text>
              <Text style={styles.summaryValue}>{props[field.key]}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.peopleHeading}>Asistentes confirmados ({people.length})</Text>
        {people.map((person) => (
          <View key={person.checkinCode} style={styles.person}>
            <Image src={person.qrDataUri} style={styles.personQr} />
            <View>
              <Text style={styles.personName}>{person.name}</Text>
              <Text style={styles.personCode}>Código: {person.checkinCode}</Text>
            </View>
          </View>
        ))}

        <Text style={styles.footer}>
          Presenta este código QR (impreso o desde tu celular) al llegar al evento. ¡Te esperamos!
        </Text>
      </Page>
    </Document>
  );
}

import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

export interface PdfPerson {
  name: string;
  checkinCode: string;
  qrDataUri: string;
}

export interface InvitationPdfDocumentProps {
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
  page: { padding: 40, fontFamily: "Helvetica", color: "#2b2926" },
  heading: { fontSize: 20, marginBottom: 4 },
  subheading: { fontSize: 11, color: "#6b6459", marginBottom: 20 },
  summaryBox: {
    borderWidth: 1,
    borderColor: "#e6e0d3",
    borderRadius: 4,
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  summaryLabel: { fontSize: 9, color: "#8a7a63", textTransform: "uppercase", letterSpacing: 1 },
  summaryValue: { fontSize: 11 },
  peopleHeading: { fontSize: 13, marginBottom: 12 },
  person: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0ece2",
    paddingVertical: 12,
  },
  personQr: { width: 64, height: 64, marginRight: 16 },
  personName: { fontSize: 12, marginBottom: 2 },
  personCode: { fontSize: 8, color: "#8a8477" },
  footer: { marginTop: 24, fontSize: 9, color: "#8a8477" },
});

/** Pure presentational PDF: event summary + one QR-coded entry per person (guest + each named companion). */
export function InvitationPdfDocument({
  coupleNames,
  dateLabel,
  timeLabel,
  venueName,
  venueAddress,
  dressCode,
  people,
}: InvitationPdfDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading}>{coupleNames}</Text>
        <Text style={styles.subheading}>Comprobante de confirmación de asistencia</Text>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Fecha</Text>
            <Text style={styles.summaryValue}>{dateLabel}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Hora</Text>
            <Text style={styles.summaryValue}>{timeLabel}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Lugar</Text>
            <Text style={styles.summaryValue}>{venueName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Dirección</Text>
            <Text style={styles.summaryValue}>{venueAddress}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Vestimenta</Text>
            <Text style={styles.summaryValue}>{dressCode}</Text>
          </View>
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

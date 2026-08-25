import { Document, Page, StyleSheet, Text, View, Image } from "@react-pdf/renderer";
import { NdaFormData, PartyInfo } from "@/lib/nda/types";
import {
  buildCoverPageFields,
  formatDisplayDate,
  mndaTermText,
  termOfConfidentialityText,
} from "@/lib/nda/format";
import { STANDARD_TERMS, STANDARD_TERMS_ATTRIBUTION, STANDARD_TERMS_TITLE } from "@/lib/nda/standardTerms";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, lineHeight: 1.5, color: "#1e293b" },
  title: { fontSize: 16, fontWeight: 700, textAlign: "center", marginBottom: 18 },
  fieldRow: { marginBottom: 8 },
  fieldLabel: { fontWeight: 700 },
  fieldHint: { fontSize: 8, color: "#94a3b8", marginBottom: 2 },
  row: { flexDirection: "row", gap: 16 },
  col: { flex: 1 },
  signatureSection: { flexDirection: "row", gap: 24, marginTop: 20, marginBottom: 20, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 16 },
  signatureCol: { flex: 1 },
  signatureImg: { height: 40, marginBottom: 4, objectFit: "contain" },
  signatureLine: { height: 40, borderBottomWidth: 1, borderBottomColor: "#cbd5e1", marginBottom: 4 },
  partyLabel: { fontWeight: 700, marginBottom: 2 },
  termsTitle: { fontSize: 13, fontWeight: 700, marginTop: 12, marginBottom: 8, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 16 },
  termItem: { marginBottom: 8 },
  termHeading: { fontWeight: 700 },
  attribution: { fontSize: 8, color: "#94a3b8", marginTop: 8 },
});

interface NdaPdfDocumentProps {
  data: NdaFormData;
}

export default function NdaPdfDocument({ data }: NdaPdfDocumentProps) {
  const fields = buildCoverPageFields(data);

  return (
    <Document title="Mutual Non-Disclosure Agreement">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Mutual Non-Disclosure Agreement</Text>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldHint}>How Confidential Information may be used</Text>
          <Text>
            <Text style={styles.fieldLabel}>Purpose: </Text>
            {fields.purpose}
          </Text>
        </View>

        <View style={styles.fieldRow}>
          <Text>
            <Text style={styles.fieldLabel}>Effective Date: </Text>
            {formatDisplayDate(data.effectiveDate)}
          </Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldHint}>The length of this MNDA</Text>
          <Text>
            <Text style={styles.fieldLabel}>MNDA Term: </Text>
            {mndaTermText(data)}
          </Text>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldHint}>How long Confidential Information is protected</Text>
          <Text>
            <Text style={styles.fieldLabel}>Term of Confidentiality: </Text>
            {termOfConfidentialityText(data)}
          </Text>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text>
              <Text style={styles.fieldLabel}>Governing Law: </Text>
              {fields.governingLaw}
            </Text>
          </View>
          <View style={styles.col}>
            <Text>
              <Text style={styles.fieldLabel}>Jurisdiction: </Text>
              {fields.jurisdiction}
            </Text>
          </View>
        </View>

        {data.modifications.trim() && (
          <View style={styles.fieldRow}>
            <Text>
              <Text style={styles.fieldLabel}>MNDA Modifications: </Text>
              {data.modifications}
            </Text>
          </View>
        )}

        <View style={styles.signatureSection}>
          <PartySignature label="Party 1" party={data.partyOne} />
          <PartySignature label="Party 2" party={data.partyTwo} />
        </View>

        <Text style={styles.termsTitle}>{STANDARD_TERMS_TITLE}</Text>
        {STANDARD_TERMS.map((section, index) => (
          <View key={section.heading} style={styles.termItem}>
            <Text>
              <Text style={styles.termHeading}>
                {index + 1}. {section.heading}.{" "}
              </Text>
              {section.body}
            </Text>
          </View>
        ))}
        <Text style={styles.attribution}>{STANDARD_TERMS_ATTRIBUTION}</Text>
      </Page>
    </Document>
  );
}

function PartySignature({ label, party }: { label: string; party: PartyInfo }) {
  return (
    <View style={styles.signatureCol}>
      <Text style={styles.partyLabel}>{label}</Text>
      {party.signatureDataUrl ? (
        // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image has no alt prop
        <Image src={party.signatureDataUrl} style={styles.signatureImg} />
      ) : (
        <View style={styles.signatureLine} />
      )}
      <Text>{party.printName || "—"}</Text>
      <Text>
        {party.title || "—"} · {party.company || "—"}
      </Text>
      <Text>{party.noticeAddress || "—"}</Text>
      <Text>{party.date ? formatDisplayDate(party.date) : "—"}</Text>
    </View>
  );
}

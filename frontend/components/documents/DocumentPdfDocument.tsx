import { Document, Page, StyleSheet, Text, View, Image } from "@react-pdf/renderer";
import { formatDisplayDate } from "@/lib/documents/format";
import { computeSectionNumbers, InlineRun, RenderedDocument } from "@/lib/documents/render";
import { DocumentFieldValues } from "@/lib/documents/types";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, lineHeight: 1.5, color: "#1e293b" },
  title: { fontSize: 16, fontWeight: 700, textAlign: "center", marginBottom: 18 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  summaryItem: { width: "48%", marginBottom: 6 },
  fieldLabel: { fontWeight: 700 },
  signatureSection: {
    flexDirection: "row",
    gap: 24,
    marginTop: 20,
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 16,
  },
  signatureCol: { flex: 1 },
  signatureImg: { height: 40, marginBottom: 4, objectFit: "contain" },
  signatureLine: { height: 40, borderBottomWidth: 1, borderBottomColor: "#cbd5e1", marginBottom: 4 },
  partyLabel: { fontWeight: 700, marginBottom: 2 },
  appendixTitle: { fontSize: 13, fontWeight: 700, marginTop: 12, marginBottom: 8, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 16 },
  appendixItem: { marginBottom: 8, padding: 6, backgroundColor: "#f8fafc" },
  bodyTitle: { fontSize: 13, fontWeight: 700, marginTop: 12, marginBottom: 8, borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 16 },
  heading: { fontWeight: 700, marginTop: 8, marginBottom: 4 },
  item: { marginBottom: 6 },
});

interface DocumentPdfDocumentProps {
  document: RenderedDocument;
}

export default function DocumentPdfDocument({ document }: DocumentPdfDocumentProps) {
  const sectionNumbers = computeSectionNumbers(document.body);

  return (
    <Document title={document.title}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{document.title}</Text>

        {document.summaryRows.length > 0 && (
          <View style={styles.summaryGrid}>
            {document.summaryRows.map((row) => (
              <Text key={row.label} style={styles.summaryItem}>
                <Text style={styles.fieldLabel}>{row.label}: </Text>
                {row.value}
              </Text>
            ))}
          </View>
        )}

        {document.signatures.length > 0 && (
          <View style={styles.signatureSection}>
            {document.signatures.map((sig) => (
              <PartySignature key={sig.label} label={sig.label} party={sig.party} />
            ))}
          </View>
        )}

        {document.appendices.map((appendix) => (
          <View key={appendix.title}>
            <Text style={styles.appendixTitle}>{appendix.title}</Text>
            {appendix.items.length === 0 ? (
              <Text>None yet</Text>
            ) : (
              appendix.items.map((item, index) => (
                <View key={index} style={styles.appendixItem}>
                  {item.map((field) => (
                    <Text key={field.label}>
                      <Text style={styles.fieldLabel}>{field.label}: </Text>
                      {field.value || "—"}
                    </Text>
                  ))}
                </View>
              ))
            )}
          </View>
        ))}

        <Text style={styles.bodyTitle}>Standard Terms</Text>
        {document.body.map((node, index) => {
          if (node.type === "heading") {
            return (
              <Text key={index} style={styles.heading}>
                {sectionNumbers[index]}. {renderPdfRuns(node.runs)}
              </Text>
            );
          }
          return (
            <Text key={index} style={styles.item}>
              <Text style={styles.fieldLabel}>{node.marker} </Text>
              {renderPdfRuns(node.runs)}
            </Text>
          );
        })}
      </Page>
    </Document>
  );
}

function renderPdfRuns(runs: InlineRun[]) {
  return runs.map((run, index) => {
    if (run.type === "bold") {
      return (
        <Text key={index} style={{ fontWeight: 700 }}>
          {run.text}
        </Text>
      );
    }
    return <Text key={index}>{run.text}</Text>;
  });
}

function PartySignature({ label, party }: { label: string; party: DocumentFieldValues | null }) {
  const printName = (party?.printName as string) || "";
  const title = (party?.title as string) || "";
  const company = (party?.company as string) || "";
  const noticeAddress = (party?.noticeAddress as string) || "";
  const date = (party?.date as string) || "";
  const signatureDataUrl = (party?.signatureDataUrl as string | null) || null;

  return (
    <View style={styles.signatureCol}>
      <Text style={styles.partyLabel}>{label}</Text>
      {signatureDataUrl ? (
        // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer's Image has no alt prop
        <Image src={signatureDataUrl} style={styles.signatureImg} />
      ) : (
        <View style={styles.signatureLine} />
      )}
      <Text>{printName || "—"}</Text>
      <Text>
        {title || "—"} · {company || "—"}
      </Text>
      <Text>{noticeAddress || "—"}</Text>
      <Text>{date ? formatDisplayDate(date) : "—"}</Text>
    </View>
  );
}

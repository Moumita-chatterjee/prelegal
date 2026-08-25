export type DurationTerm = "fixed" | "open";

export interface PartyInfo {
  printName: string;
  title: string;
  company: string;
  noticeAddress: string;
  date: string;
  signatureDataUrl: string | null;
}

export interface NdaFormData {
  purpose: string;
  effectiveDate: string;
  mndaTerm: DurationTerm;
  mndaTermYears: number;
  termOfConfidentiality: DurationTerm;
  termOfConfidentialityYears: number;
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  partyOne: PartyInfo;
  partyTwo: PartyInfo;
}

export const emptyParty = (): PartyInfo => ({
  printName: "",
  title: "",
  company: "",
  noticeAddress: "",
  date: "",
  signatureDataUrl: null,
});

export const defaultNdaFormData = (): NdaFormData => ({
  purpose: "Evaluating whether to enter into a business relationship with the other party.",
  effectiveDate: new Date().toISOString().slice(0, 10),
  mndaTerm: "fixed",
  mndaTermYears: 1,
  termOfConfidentiality: "fixed",
  termOfConfidentialityYears: 1,
  governingLaw: "",
  jurisdiction: "",
  modifications: "",
  partyOne: emptyParty(),
  partyTwo: emptyParty(),
});

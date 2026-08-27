from __future__ import annotations

from app.documents.fields import DocumentType, EnumChoice, FieldDef, party_field

_CHAT_INTRO = (
    "Hi! I'll help you put together your {name}. Let's start with the basics — "
    "what would you like to cover, and who are the parties involved?"
)


def _mnda_term_phrase(values: dict) -> str | None:
    choice = values.get("mndaTerm")
    years = values.get("mndaTermYears")
    if choice == "open":
        return "the date this MNDA is terminated in accordance with its terms"
    if choice == "fixed" and years:
        return f"{years} year(s) from the Effective Date"
    return None


def _confidentiality_term_phrase(values: dict) -> str | None:
    choice = values.get("termOfConfidentiality")
    years = values.get("termOfConfidentialityYears")
    if choice == "open":
        return "in perpetuity"
    if choice == "fixed" and years:
        return f"{years} year(s) from the Effective Date"
    return None


MUTUAL_NDA = DocumentType(
    slug="mutual_nda",
    catalog_names=[
        "Mutual Non-Disclosure Agreement (Standard Terms)",
        "Mutual Non-Disclosure Agreement (Cover Page)",
    ],
    template_filename="Mutual-NDA.md",
    description=(
        "Common Paper's standard mutual NDA that lets two parties disclose confidential information to "
        "each other, e.g. while evaluating a potential business relationship."
    ),
    chat_intro=(
        "Hi! I'll help you put together your Mutual NDA. Let's start with the basics — "
        "what's the purpose of this agreement, and who are the two parties involved?"
    ),
    fields=[
        FieldDef(
            key="purpose",
            label="Purpose",
            kind="long_text",
            hint="How Confidential Information may be used",
            link_names=["Purpose"],
            summarize=True,
        ),
        FieldDef(
            key="effectiveDate",
            label="Effective Date",
            kind="date",
            link_names=["Effective Date"],
            summarize=True,
        ),
        FieldDef(
            key="mndaTerm",
            label="MNDA Term",
            kind="enum",
            hint="The length of this MNDA",
            choices=[
                EnumChoice("fixed", "Expires N year(s) from the Effective Date"),
                EnumChoice("open", "Continues until terminated"),
            ],
            link_names=["MNDA Term"],
            resolve=_mnda_term_phrase,
            summarize=True,
        ),
        FieldDef(
            key="mndaTermYears",
            label="MNDA Term (years)",
            kind="integer",
            required=False,
            hint="Only if MNDA Term is 'fixed'",
        ),
        FieldDef(
            key="termOfConfidentiality",
            label="Term of Confidentiality",
            kind="enum",
            hint="How long Confidential Information stays protected",
            choices=[
                EnumChoice("fixed", "N year(s) from the Effective Date"),
                EnumChoice("open", "In perpetuity"),
            ],
            link_names=["Term of Confidentiality"],
            resolve=_confidentiality_term_phrase,
            summarize=True,
        ),
        FieldDef(
            key="termOfConfidentialityYears",
            label="Term of Confidentiality (years)",
            kind="integer",
            required=False,
            hint="Only if Term of Confidentiality is 'fixed'",
        ),
        FieldDef(
            key="governingLaw",
            label="Governing Law",
            kind="text",
            hint="A US state",
            link_names=["Governing Law"],
            summarize=True,
        ),
        FieldDef(
            key="jurisdiction",
            label="Jurisdiction",
            kind="text",
            hint="City/county and state, e.g. 'New Castle, DE'",
            link_names=["Jurisdiction"],
            summarize=True,
        ),
        FieldDef(
            key="modifications",
            label="MNDA Modifications",
            kind="long_text",
            required=False,
            hint="Any changes to the standard terms",
            summarize=True,
        ),
        party_field("partyOne", "Party 1"),
        party_field("partyTwo", "Party 2"),
    ],
)

PILOT_AGREEMENT = DocumentType(
    slug="pilot_agreement",
    catalog_names=["Pilot Agreement"],
    template_filename="Pilot-Agreement.md",
    description=(
        "A short-term trial or evaluation agreement that lets a prospective customer test a product or "
        "service before committing to a longer-term deal such as a CSA or Software License Agreement."
    ),
    chat_intro=_CHAT_INTRO.format(name="Pilot Agreement"),
    fields=[
        FieldDef(key="effectiveDate", label="Effective Date", kind="date", link_names=["Effective Date"], summarize=True),
        FieldDef(
            key="pilotPeriod",
            label="Pilot Period",
            kind="text",
            hint="How long the pilot lasts, e.g. '90 days'",
            link_names=["Pilot Period"],
            summarize=True,
        ),
        FieldDef(
            key="generalCapAmount",
            label="General Cap Amount",
            kind="text",
            hint="Liability cap, e.g. a dollar amount or 'Fees paid in the prior 12 months'",
            link_names=["General Cap Amount"],
            summarize=True,
        ),
        FieldDef(key="governingLaw", label="Governing Law", kind="text", link_names=["Governing Law"], summarize=True),
        FieldDef(
            key="chosenCourts",
            label="Chosen Courts",
            kind="text",
            hint="Courts for disputes, e.g. 'the state and federal courts located in Delaware'",
            link_names=["Chosen Courts"],
            summarize=True,
        ),
        party_field("provider", "Provider"),
        party_field("customer", "Customer"),
    ],
)

CSA = DocumentType(
    slug="csa",
    catalog_names=["Cloud Service Agreement (CSA)"],
    template_filename="CSA.md",
    description=(
        "The standard agreement for selling and buying cloud software and SaaS products, covering access "
        "and use, payment, term and termination, warranties, liability, indemnification, and confidentiality."
    ),
    chat_intro=_CHAT_INTRO.format(name="Cloud Service Agreement"),
    fields=[
        FieldDef(key="subscriptionPeriod", label="Subscription Period", kind="text", link_names=["Subscription Period"], summarize=True),
        FieldDef(key="technicalSupport", label="Technical Support", kind="text", required=False, link_names=["Technical Support"]),
        FieldDef(key="useLimitations", label="Use Limitations", kind="long_text", required=False, link_names=["Use Limitations"]),
        FieldDef(key="paymentProcess", label="Payment Process", kind="text", link_names=["Payment Process"], summarize=True),
        FieldDef(key="orderDate", label="Order Date", kind="date", link_names=["Order Date"]),
        FieldDef(
            key="nonRenewalNoticeDate",
            label="Non-Renewal Notice Date",
            kind="text",
            required=False,
            hint="How far before renewal notice of non-renewal is due, e.g. '30 days'",
            link_names=["Non-Renewal Notice Date"],
        ),
        FieldDef(key="effectiveDate", label="Effective Date", kind="date", link_names=["Effective Date"], summarize=True),
        FieldDef(key="additionalWarranties", label="Additional Warranties", kind="long_text", required=False, link_names=["Additional Warranties"]),
        FieldDef(key="generalCapAmount", label="General Cap Amount", kind="text", link_names=["General Cap Amount"], summarize=True),
        FieldDef(key="increasedClaims", label="Increased Claims", kind="long_text", required=False, link_names=["Increased Claims"]),
        FieldDef(key="increasedCapAmount", label="Increased Cap Amount", kind="text", required=False, link_names=["Increased Cap Amount"]),
        FieldDef(key="unlimitedClaims", label="Unlimited Claims", kind="long_text", required=False, link_names=["Unlimited Claims"]),
        FieldDef(key="providerCoveredClaims", label="Provider Covered Claims", kind="long_text", required=False, link_names=["Provider Covered Claims", "Provider Covered Claim"]),
        FieldDef(key="customerCoveredClaims", label="Customer Covered Claims", kind="long_text", required=False, link_names=["Customer Covered Claims", "Customer Covered Claim"]),
        FieldDef(key="governingLaw", label="Governing Law", kind="text", link_names=["Governing Law"], summarize=True),
        FieldDef(key="chosenCourts", label="Chosen Courts", kind="text", link_names=["Chosen Courts"], summarize=True),
        party_field("provider", "Provider"),
        party_field("customer", "Customer"),
    ],
)

SLA = DocumentType(
    slug="sla",
    catalog_names=["Service Level Agreement (SLA)"],
    template_filename="sla.md",
    description=(
        "Designed to be used alongside a Cloud Service Agreement, defining uptime and response time "
        "targets and the service credit remedies if those targets are missed."
    ),
    chat_intro=_CHAT_INTRO.format(name="Service Level Agreement"),
    prompt_notes="This SLA is meant to accompany a Cloud Service Agreement; collect its own fields fresh regardless.",
    fields=[
        FieldDef(key="targetUptime", label="Target Uptime", kind="text", required=False, hint="e.g. '99.9%'", link_names=["Target Uptime"], summarize=True),
        FieldDef(key="targetResponseTime", label="Target Response Time", kind="text", required=False, link_names=["Target Response Time"], summarize=True),
        FieldDef(key="supportChannel", label="Support Channel", kind="text", required=False, hint="e.g. an email address or support portal", link_names=["Support Channel"]),
        FieldDef(key="uptimeCredit", label="Uptime Credit", kind="text", required=False, hint="Service credit for missing Target Uptime", link_names=["Uptime Credit"]),
        FieldDef(key="responseTimeCredit", label="Response Time Credit", kind="text", required=False, link_names=["Response Time Credit"]),
        FieldDef(key="scheduledDowntime", label="Scheduled Downtime", kind="text", required=False, link_names=["Scheduled Downtime"]),
        FieldDef(key="subscriptionPeriod", label="Subscription Period", kind="text", link_names=["Subscription Period"], summarize=True),
        party_field("provider", "Provider"),
        party_field("customer", "Customer"),
    ],
)

SOFTWARE_LICENSE = DocumentType(
    slug="software_license",
    catalog_names=["Software License Agreement"],
    template_filename="Software-License-Agreement.md",
    description=(
        "The standard agreement for licensing on-premises or client-side software, covering license "
        "grant, restrictions, updates, warranties, liability, and confidentiality."
    ),
    chat_intro=_CHAT_INTRO.format(name="Software License Agreement"),
    fields=[
        FieldDef(key="subscriptionPeriod", label="Subscription Period", kind="text", link_names=["Subscription Period"], summarize=True),
        FieldDef(key="permittedUses", label="Permitted Uses", kind="long_text", link_names=["Permitted Uses"], summarize=True),
        FieldDef(key="licenseLimits", label="License Limits", kind="long_text", required=False, link_names=["License Limits"]),
        FieldDef(key="paymentProcess", label="Payment Process", kind="text", link_names=["Payment Process"], summarize=True),
        FieldDef(key="orderDate", label="Order Date", kind="date", link_names=["Order Date"]),
        FieldDef(key="nonRenewalNoticeDate", label="Non-Renewal Notice Date", kind="text", required=False, link_names=["Non-Renewal Notice Date"]),
        FieldDef(key="warrantyPeriod", label="Warranty Period", kind="text", required=False, link_names=["Warranty Period"]),
        FieldDef(key="deletionProcedure", label="Deletion Procedure", kind="text", required=False, link_names=["Deletion Procedure"]),
        FieldDef(key="effectiveDate", label="Effective Date", kind="date", link_names=["Effective Date"], summarize=True),
        FieldDef(key="additionalWarranties", label="Additional Warranties", kind="long_text", required=False, link_names=["Additional Warranties"]),
        FieldDef(key="generalCapAmount", label="General Cap Amount", kind="text", link_names=["General Cap Amount"], summarize=True),
        FieldDef(key="increasedClaims", label="Increased Claims", kind="long_text", required=False, link_names=["Increased Claims"]),
        FieldDef(key="increasedCapAmount", label="Increased Cap Amount", kind="text", required=False, link_names=["Increased Cap Amount"]),
        FieldDef(key="unlimitedClaims", label="Unlimited Claims", kind="long_text", required=False, link_names=["Unlimited Claims"]),
        FieldDef(key="providerCoveredClaims", label="Provider Covered Claims", kind="long_text", required=False, link_names=["Provider Covered Claims", "Provider Covered Claim"]),
        FieldDef(key="customerCoveredClaims", label="Customer Covered Claims", kind="long_text", required=False, link_names=["Customer Covered Claims", "Customer Covered Claim"]),
        FieldDef(key="governingLaw", label="Governing Law", kind="text", link_names=["Governing Law"], summarize=True),
        FieldDef(key="chosenCourts", label="Chosen Courts", kind="text", link_names=["Chosen Courts"], summarize=True),
        party_field("provider", "Provider"),
        party_field("customer", "Customer"),
    ],
)

PARTNERSHIP_AGREEMENT = DocumentType(
    slug="partnership_agreement",
    catalog_names=["Partnership Agreement"],
    template_filename="Partnership-Agreement.md",
    description=(
        "The standard agreement for business partnerships involving mutual obligations, trademark "
        "licensing, and revenue or fee arrangements between a company and a partner."
    ),
    chat_intro=_CHAT_INTRO.format(name="Partnership Agreement"),
    prompt_notes=(
        "trademarkGrantor determines which party (if either) is 'Licensor' granting brand/trademark "
        "rights to the other ('Licensee') under the Trademark License section — ask which party, if any, "
        "is granting the other rights to use its brand elements."
    ),
    fields=[
        FieldDef(key="obligations", label="Obligations", kind="long_text", hint="What each party will do under this partnership", link_names=["Obligations"], summarize=True),
        FieldDef(key="paymentProcess", label="Payment Process", kind="text", required=False, link_names=["Payment Process"]),
        FieldDef(key="paymentSchedule", label="Payment Schedule", kind="text", required=False, link_names=["Payment Schedule"]),
        FieldDef(key="territory", label="Territory", kind="text", required=False, hint="Geographic scope of any trademark license", link_names=["Territory"]),
        FieldDef(key="endDate", label="End Date", kind="date", link_names=["End Date"], summarize=True),
        FieldDef(key="effectiveDate", label="Effective Date", kind="date", link_names=["Effective Date"], summarize=True),
        FieldDef(key="additionalWarranties", label="Additional Warranties", kind="long_text", required=False, link_names=["Additional Warranties"]),
        FieldDef(key="generalCapAmount", label="General Cap Amount", kind="text", link_names=["General Cap Amount"], summarize=True),
        FieldDef(key="increasedClaims", label="Increased Claims", kind="long_text", required=False, link_names=["Increased Claims"]),
        FieldDef(key="increasedCapAmount", label="Increased Cap Amount", kind="text", required=False, link_names=["Increased Cap Amount"]),
        FieldDef(key="unlimitedClaims", label="Unlimited Claims", kind="long_text", required=False, link_names=["Unlimited Claims"]),
        FieldDef(key="companyCoveredClaims", label="Company Covered Claims", kind="long_text", required=False, link_names=["Company Covered Claim", "Company Covered Claims"]),
        FieldDef(key="partnerCoveredClaims", label="Partner Covered Claims", kind="long_text", required=False, link_names=["Partner Covered Claims", "Partner Covered Claim"]),
        FieldDef(key="governingLaw", label="Governing Law", kind="text", link_names=["Governing Law"], summarize=True),
        FieldDef(key="chosenCourts", label="Chosen Courts", kind="text", link_names=["Chosen Courts"], summarize=True),
        FieldDef(
            key="trademarkGrantor",
            label="Trademark Grantor (Licensor)",
            kind="enum",
            required=False,
            hint="Which party, if either, grants the other trademark/brand rights",
            choices=[
                EnumChoice("company", "Company is Licensor"),
                EnumChoice("partner", "Partner is Licensor"),
                EnumChoice("neither", "Neither party grants trademark rights"),
            ],
            summarize=True,
        ),
        party_field("company", "Company"),
        party_field("partner", "Partner"),
    ],
)

PSA = DocumentType(
    slug="psa",
    catalog_names=["Professional Services Agreement (PSA)"],
    template_filename="psa.md",
    description=(
        "The standard agreement for procuring professional services, covering statements of work, "
        "deliverables and intellectual property, payment, warranties, liability, and confidentiality."
    ),
    chat_intro=_CHAT_INTRO.format(name="Professional Services Agreement"),
    prompt_notes=(
        "Statements of Work (SOWs) are per-project. Ask how many SOWs there are (there may be "
        "just one, several, or none yet), and gather each one's fields separately. Give each SOW "
        "a short sowId label (e.g. 'SOW 1') and always resend every previously-known SOW in the "
        "sows list, not just the one that changed this turn."
    ),
    fields=[
        FieldDef(key="effectiveDate", label="Effective Date", kind="date", link_names=["Effective Date"], summarize=True),
        FieldDef(key="customerPolicies", label="Customer Policies", kind="long_text", required=False, link_names=["Customer Policies"]),
        FieldDef(key="securityPolicy", label="Security Policy", kind="text", required=False, link_names=["Security Policy"]),
        FieldDef(key="additionalWarranties", label="Additional Warranties", kind="long_text", required=False, link_names=["Additional Warranties"]),
        FieldDef(key="generalCapAmount", label="General Cap Amount", kind="text", link_names=["General Cap Amount"], summarize=True),
        FieldDef(key="increasedClaims", label="Increased Claims", kind="long_text", required=False, link_names=["Increased Claims"]),
        FieldDef(key="increasedCapAmount", label="Increased Cap Amount", kind="text", required=False, link_names=["Increased Cap Amount"]),
        FieldDef(key="unlimitedClaims", label="Unlimited Claims", kind="long_text", required=False, link_names=["Unlimited Claims"]),
        FieldDef(key="insuranceMinimums", label="Insurance Minimums", kind="text", required=False, link_names=["Insurance Minimums"]),
        FieldDef(key="providerCoveredClaims", label="Provider Covered Claims", kind="long_text", required=False, link_names=["Provider Covered Claims", "Provider Covered Claim"]),
        FieldDef(key="customerCoveredClaims", label="Customer Covered Claims", kind="long_text", required=False, link_names=["Customer Covered Claims", "Customer Covered Claim"]),
        FieldDef(key="governingLaw", label="Governing Law", kind="text", link_names=["Governing Law"], summarize=True),
        FieldDef(key="chosenCourts", label="Chosen Courts", kind="text", link_names=["Chosen Courts"], summarize=True),
        FieldDef(
            key="sows",
            label="Statements of Work",
            kind="group",
            repeat=True,
            appendix_title="Statements of Work",
            fields=[
                FieldDef(key="sowId", label="SOW label", kind="text", hint="A short stable label, e.g. 'SOW 1'"),
                FieldDef(key="title", label="Title", kind="text", required=False),
                FieldDef(key="deliverables", label="Deliverables", kind="long_text", required=False),
                FieldDef(key="fees", label="Fees", kind="text"),
                FieldDef(key="paymentPeriod", label="Payment Period", kind="text", hint="e.g. '30 days'"),
                FieldDef(key="sowTerm", label="SOW Term", kind="text"),
                FieldDef(key="rejectionPeriod", label="Rejection Period", kind="text", required=False),
                FieldDef(key="resubmissionPeriod", label="Resubmission Period", kind="text", required=False),
                FieldDef(key="timeOfAssignment", label="Time of Assignment", kind="text", required=False, hint="When IP in Deliverables assigns to Customer"),
                FieldDef(key="customerObligations", label="Customer Obligations", kind="long_text", required=False),
            ],
        ),
        party_field("provider", "Provider"),
        party_field("customer", "Customer"),
    ],
)

DPA = DocumentType(
    slug="dpa",
    catalog_names=["Data Processing Agreement (DPA)"],
    template_filename="DPA.md",
    description=(
        "The standard DPA governing the processing of personal data between a controller/processor and "
        "their vendor, including subprocessors, international data transfers, security incidents, and "
        "audit rights."
    ),
    chat_intro=_CHAT_INTRO.format(name="Data Processing Agreement"),
    prompt_notes=(
        "Briefly explain Controller vs. Processor before asking customerProcessingRole: Customer is "
        "'Controller' if it decides how its own data is used; 'Processor' if it processes data on behalf "
        "of its own upstream Controller."
    ),
    fields=[
        FieldDef(
            key="customerProcessingRole",
            label="Customer's Data Protection Role",
            kind="enum",
            hint="Whether Customer is a Controller or a Processor of the personal data",
            choices=[EnumChoice("controller", "Controller"), EnumChoice("processor", "Processor")],
            summarize=True,
        ),
        FieldDef(key="categoriesOfPersonalData", label="Categories of Personal Data", kind="long_text", link_names=["Categories of Personal Data"], summarize=True),
        FieldDef(key="categoriesOfDataSubjects", label="Categories of Data Subjects", kind="long_text", link_names=["Categories of Data Subjects"], summarize=True),
        FieldDef(key="specialCategoryData", label="Special Category Data", kind="long_text", required=False, link_names=["Special Category Data"]),
        FieldDef(key="specialCategoryDataSafeguards", label="Special Category Data Restrictions or Safeguards", kind="long_text", required=False, link_names=["Special Category Data Restrictions or Safeguards"]),
        FieldDef(key="frequencyOfTransfer", label="Frequency of Transfer", kind="text", required=False, link_names=["Frequency of Transfer"]),
        FieldDef(key="natureAndPurposeOfProcessing", label="Nature and Purpose of Processing", kind="long_text", link_names=["Nature and Purpose of Processing"], summarize=True),
        FieldDef(key="durationOfProcessing", label="Duration of Processing", kind="text", link_names=["Duration of Processing"], summarize=True),
        FieldDef(
            key="governingMemberState",
            label="Governing Member State",
            kind="text",
            required=False,
            hint="EU member state governing the EEA Standard Contractual Clauses, if they apply",
            link_names=["Governing Member State"],
        ),
        FieldDef(key="providerSecurityContact", label="Provider Security Contact", kind="text", required=False, link_names=["Provider Security Contact"]),
        FieldDef(
            key="approvedSubprocessors",
            label="Approved Subprocessors",
            kind="group",
            required=False,
            repeat=True,
            appendix_title="Approved Subprocessors",
            fields=[
                FieldDef(key="name", label="Name", kind="text"),
                FieldDef(key="country", label="Country", kind="text"),
                FieldDef(key="processingTasks", label="Anticipated Processing Tasks", kind="text"),
            ],
        ),
        party_field("provider", "Provider"),
        party_field("customer", "Customer"),
    ],
)

BAA = DocumentType(
    slug="baa",
    catalog_names=["Business Associate Agreement (BAA)"],
    template_filename="BAA.md",
    description=(
        "The standard HIPAA business associate agreement, defining how a service provider may use and "
        "safeguard protected health information (PHI) on behalf of a covered entity."
    ),
    chat_intro=_CHAT_INTRO.format(name="Business Associate Agreement"),
    fields=[
        FieldDef(key="limitations", label="Limitations", kind="long_text", required=False, hint="Any limits on Provider's permitted use/disclosure of PHI", link_names=["Limitations"]),
        FieldDef(key="breachNotificationPeriod", label="Breach Notification Period", kind="text", hint="e.g. '5 business days'", link_names=["Breach Notification Period"], summarize=True),
        FieldDef(key="baaEffectiveDate", label="BAA Effective Date", kind="date", link_names=["BAA Effective Date"], summarize=True),
        party_field("provider", "Provider"),
        party_field("company", "Company"),
    ],
)

AI_ADDENDUM = DocumentType(
    slug="ai_addendum",
    catalog_names=["AI Addendum"],
    template_filename="AI-Addendum.md",
    description=(
        "The standard addendum for products with AI or machine learning features, covering permitted use "
        "of AI services, input/output ownership, model training restrictions, and AI-specific disclaimers."
    ),
    chat_intro=_CHAT_INTRO.format(name="AI Addendum"),
    fields=[
        FieldDef(key="trainingData", label="Training Data", kind="long_text", required=False, hint="Data Provider may use to train models, if any", link_names=["Training Data"], summarize=True),
        FieldDef(key="trainingPurposes", label="Training Purposes", kind="long_text", required=False, link_names=["Training Purposes"]),
        FieldDef(key="trainingRestrictions", label="Training Restrictions", kind="long_text", required=False, link_names=["Training Restrictions"]),
        FieldDef(key="improvementRestrictions", label="Improvement Restrictions", kind="long_text", required=False, link_names=["Improvement Restrictions"]),
        party_field("customer", "Customer"),
        party_field("provider", "Provider"),
    ],
)

DESIGN_PARTNER_AGREEMENT = DocumentType(
    slug="design_partner_agreement",
    catalog_names=["Design Partner Agreement"],
    template_filename="design-partner-agreement.md",
    description=(
        "The standard agreement for giving early adopters access to a product in exchange for feedback, "
        "defining the design partner program, feedback ownership, and confidentiality."
    ),
    chat_intro=_CHAT_INTRO.format(name="Design Partner Agreement"),
    fields=[
        FieldDef(key="program", label="Program", kind="long_text", hint="Description of the design partner program", link_names=["Program"], summarize=True),
        FieldDef(key="term", label="Term", kind="text", hint="Length of the design partner period, e.g. '6 months'", link_names=["Term"], summarize=True),
        FieldDef(key="fees", label="Fees", kind="text", required=False, link_names=["Fees"]),
        FieldDef(key="effectiveDate", label="Effective Date", kind="date", link_names=["Effective Date"], summarize=True),
        FieldDef(key="governingLaw", label="Governing Law", kind="text", link_names=["Governing Law"], summarize=True),
        FieldDef(key="chosenCourts", label="Chosen Courts", kind="text", link_names=["Chosen Courts"], summarize=True),
        party_field("provider", "Provider"),
        party_field("partner", "Partner"),
    ],
)

ALL_DOCUMENT_TYPES: list[DocumentType] = [
    MUTUAL_NDA,
    PILOT_AGREEMENT,
    CSA,
    SLA,
    PSA,
    SOFTWARE_LICENSE,
    PARTNERSHIP_AGREEMENT,
    DPA,
    BAA,
    AI_ADDENDUM,
    DESIGN_PARTNER_AGREEMENT,
]

REGISTRY: dict[str, DocumentType] = {doctype.slug: doctype for doctype in ALL_DOCUMENT_TYPES}

CATALOG_NAME_TO_SLUG: dict[str, str] = {
    name: doctype.slug for doctype in ALL_DOCUMENT_TYPES for name in doctype.catalog_names
}

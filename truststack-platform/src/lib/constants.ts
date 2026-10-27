import type { VendorType, VendorRiskTier, RopaSubjectType, BreachNature } from '@/types/dpdp'

// The 7 DPDP Rights (Sections 11–17)
export const DPDP_RIGHTS = [
  { id: 'access',       section: '11',    name: 'Right to Access Information' },
  { id: 'correction',  section: '12(a)', name: 'Right to Correction' },
  { id: 'completeness',section: '12(b)', name: 'Right to Completeness' },
  { id: 'erasure',     section: '12(c)', name: 'Right to Erasure' },
  { id: 'restrict',    section: '13',    name: 'Right to Restrict Processing' },
  { id: 'grievance',   section: '14',    name: 'Right to Grievance Redressal' },
  { id: 'nominate',    section: '15',    name: 'Right to Nominate' },
] as const

// DPDP lawful processing bases (Section 6 + 7)
export const DPDP_BASES = [
  { id: 'consent_s6',    label: 'Consent (Section 6)' },
  { id: 's7_state',      label: 'State/Instrumentality of State (Section 7(a))' },
  { id: 's7_legal',      label: 'Legal Obligation (Section 7(b))' },
  { id: 's7_medical',    label: 'Medical Emergency (Section 7(c))' },
  { id: 's7_epidemic',   label: 'Epidemic/Disaster (Section 7(d))' },
  { id: 's7_employment', label: 'Employment (Section 7(e))' },
  { id: 's7_court',      label: 'Court/Tribunal Order (Section 7(f))' },
] as const

// Maturity levels mapped to score bands
export const MATURITY_LEVELS = {
  1: { label: 'Initial',    color: '#DC2626', bgColor: '#FEF2F2', range: [0, 20]  as [number, number] },
  2: { label: 'Developing', color: '#D97706', bgColor: '#FFFBEB', range: [21, 40] as [number, number] },
  3: { label: 'Defined',    color: '#2563EB', bgColor: '#EFF6FF', range: [41, 60] as [number, number] },
  4: { label: 'Managed',    color: '#059669', bgColor: '#ECFDF5', range: [61, 80] as [number, number] },
  5: { label: 'Optimized',  color: '#7C3AED', bgColor: '#F5F3FF', range: [81, 100] as [number, number] },
} as const

export const RISK_TIERS = {
  critical: { label: 'Critical Risk', color: '#DC2626', bgColor: '#FEF2F2' },
  high:     { label: 'High Risk',     color: '#D97706', bgColor: '#FFFBEB' },
  medium:   { label: 'Medium Risk',   color: '#2563EB', bgColor: '#EFF6FF' },
  low:      { label: 'Low Risk',      color: '#059669', bgColor: '#ECFDF5' },
  managed:  { label: 'Managed',       color: '#7C3AED', bgColor: '#F5F3FF' },
} as const

// Industry sectors
export const INDUSTRY_SECTORS = [
  { value: 'fintech',    label: 'Fintech / Payments' },
  { value: 'healthtech', label: 'Healthtech / Telemedicine' },
  { value: 'edtech',     label: 'EdTech / Online Learning' },
  { value: 'ecommerce',  label: 'E-commerce / Retail' },
  { value: 'bfsi',       label: 'BFSI (Banking / Insurance)' },
  { value: 'it',         label: 'IT / SaaS / Software' },
  { value: 'hrtech',     label: 'HRTech / Recruitment' },
  { value: 'logistics',  label: 'Logistics / Supply Chain' },
  { value: 'media',      label: 'Media / Entertainment' },
  { value: 'other',      label: 'Other' },
] as const

// Employee count ranges for organization setup
export const EMPLOYEE_COUNT_RANGES = [
  { value: '1-50',    label: '1–50 employees' },
  { value: '51-200',  label: '51–200 employees' },
  { value: '201-500', label: '201–500 employees' },
  { value: '501-2000',label: '501–2,000 employees' },
  { value: '2000+',   label: '2,000+ employees' },
] as const

// Revenue ranges
export const REVENUE_RANGES = [
  { value: '<10Cr',      label: 'Less than ₹10 Cr' },
  { value: '10-50Cr',    label: '₹10 Cr – ₹50 Cr' },
  { value: '50-200Cr',   label: '₹50 Cr – ₹200 Cr' },
  { value: '200-500Cr',  label: '₹200 Cr – ₹500 Cr' },
  { value: '500Cr+',     label: 'More than ₹500 Cr' },
] as const

// Data records processed ranges (assessment Q4)
export const DATA_RECORDS_RANGES = [
  { value: '<1000',      label: 'Less than 1,000 records' },
  { value: '1K-10K',     label: '1,000 – 10,000 records' },
  { value: '10K-100K',   label: '10,000 – 1 Lakh records' },
  { value: '100K-1M',    label: '1 Lakh – 10 Lakh records' },
  { value: '1M+',        label: 'More than 10 Lakh records' },
] as const

// Employees with data access ranges (assessment Q5)
export const DATA_ACCESS_EMPLOYEE_RANGES = [
  { value: '1-5',   label: '1–5 employees' },
  { value: '6-20',  label: '6–20 employees' },
  { value: '21-100',label: '21–100 employees' },
  { value: '100+',  label: 'More than 100 employees' },
] as const

// 22 official Indian languages
export const SUPPORTED_LANGUAGES = [
  { code: 'en',  name: 'English',    nativeName: 'English' },
  { code: 'hi',  name: 'Hindi',      nativeName: 'हिन्दी' },
  { code: 'ta',  name: 'Tamil',      nativeName: 'தமிழ்' },
  { code: 'te',  name: 'Telugu',     nativeName: 'తెలుగు' },
  { code: 'mr',  name: 'Marathi',    nativeName: 'मराठी' },
  { code: 'bn',  name: 'Bengali',    nativeName: 'বাংলা' },
  { code: 'gu',  name: 'Gujarati',   nativeName: 'ગુજરાતી' },
  { code: 'kn',  name: 'Kannada',    nativeName: 'ಕನ್ನಡ' },
  { code: 'ml',  name: 'Malayalam',  nativeName: 'മലയാളം' },
  { code: 'pa',  name: 'Punjabi',    nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'or',  name: 'Odia',       nativeName: 'ଓଡ଼ିଆ' },
  { code: 'as',  name: 'Assamese',   nativeName: 'অসমীয়া' },
  { code: 'ur',  name: 'Urdu',       nativeName: 'اردو' },
  { code: 'sa',  name: 'Sanskrit',   nativeName: 'संस्कृतम्' },
  { code: 'ks',  name: 'Kashmiri',   nativeName: 'كٲشُر' },
  { code: 'sd',  name: 'Sindhi',     nativeName: 'سنڌي' },
  { code: 'ne',  name: 'Nepali',     nativeName: 'नेपाली' },
  { code: 'ko',  name: 'Konkani',    nativeName: 'कोंकणी' },
  { code: 'mai', name: 'Maithili',   nativeName: 'मैथिली' },
  { code: 'doi', name: 'Dogri',      nativeName: 'डोगरी' },
  { code: 'sat', name: 'Santali',    nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ' },
  { code: 'mni', name: 'Manipuri',   nativeName: 'মৈতৈলোন্' },
] as const

// Industry-specific section labels (Section 9 in assessments)
export const INDUSTRY_SECTION_LABELS: Record<string, string> = {
  industry_fintech:    'Fintech & BFSI Obligations',
  industry_healthtech: 'Healthtech Obligations',
  industry_edtech:     'EdTech Obligations',
}

// Assessment section names for display
export const ASSESSMENT_SECTION_LABELS: Record<string, string> = {
  org_profile:         'Organization Profile',
  data_fiduciary:      'Data Fiduciary Assessment',
  consent:             'Consent Practices',
  notice:              'Privacy Notice',
  rights:              'User Rights',
  security:            'Data Security',
  breach:              'Breach Preparedness',
  vendor:              'Vendor Management',
  industry_fintech:    'Fintech & BFSI Obligations',
  industry_healthtech: 'Healthtech Obligations',
  industry_edtech:     'EdTech Obligations',
}

export const ASSESSMENT_SECTION_ORDER = [
  'org_profile',
  'data_fiduciary',
  'consent',
  'notice',
  'rights',
  'security',
  'breach',
  'vendor',
] as const

// M4: Grievance complaint types mapped to DPDP sections
export const COMPLAINT_TYPES = [
  { value: 'consent',     label: 'Consent Issue',            dpdp_section: 'Section 6' },
  { value: 'access',      label: 'Data Access Request',      dpdp_section: 'Section 11' },
  { value: 'correction',  label: 'Data Correction',          dpdp_section: 'Section 12(a)' },
  { value: 'erasure',     label: 'Data Erasure / Deletion',  dpdp_section: 'Section 12(c)' },
  { value: 'breach',      label: 'Data Breach Concern',      dpdp_section: 'Section 8(6)' },
  { value: 'other',       label: 'Other DPDP Concern',       dpdp_section: 'General' },
] as const

// Grievance form languages (English + 3 major Indian languages at launch)
export const GRIEVANCE_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
] as const

// ============================================================================
// M5: DSR (Data Subject Rights) Management
// ============================================================================

// The 6 actionable DPDP rights that create a dsr_requests row. Grievance
// redressal (Section 14) is intentionally excluded — it is handled by M4 and the
// public portal links out to the grievance form for it. `value` matches both the
// dsr_requests.right_type values and the DsrRightType union.
export const DSR_RIGHT_TYPES = [
  {
    value: 'access',
    label: 'Right to Access',
    dpdp_section: 'Section 11',
    description: 'Get a summary of the personal data processed about you and the parties it has been shared with.',
    detail_label: 'What information would you like to access?',
    detail_placeholder: 'e.g. All personal data you hold about me, and the third parties it has been shared with.',
    needs_data_categories: true,
  },
  {
    value: 'correction',
    label: 'Right to Correction',
    dpdp_section: 'Section 12(a)',
    description: 'Ask us to correct personal data about you that is inaccurate or misleading.',
    detail_label: 'What is incorrect, and what should it say?',
    detail_placeholder: 'e.g. My registered phone number is wrong. It should be +91 ...',
    needs_data_categories: true,
  },
  {
    value: 'completeness',
    label: 'Right to Completeness',
    dpdp_section: 'Section 12(b)',
    description: 'Ask us to complete personal data about you that is incomplete.',
    detail_label: 'What information is incomplete?',
    detail_placeholder: 'e.g. My address on file is missing the PIN code and city.',
    needs_data_categories: true,
  },
  {
    value: 'erasure',
    label: 'Right to Erasure',
    dpdp_section: 'Section 12(c)',
    description: 'Ask us to erase your personal data where it is no longer needed for the purpose it was collected.',
    detail_label: 'What data would you like erased, and why?',
    detail_placeholder: 'e.g. Please delete my account and all associated personal data; I no longer use the service.',
    needs_data_categories: true,
  },
  {
    value: 'restrict',
    label: 'Right to Restrict Processing',
    dpdp_section: 'Section 13',
    description: 'Ask us to limit how your personal data is processed.',
    detail_label: 'What processing would you like restricted?',
    detail_placeholder: 'e.g. Stop using my data for marketing and analytics, but keep my account active.',
    needs_data_categories: true,
  },
  {
    value: 'nominate',
    label: 'Right to Nominate',
    dpdp_section: 'Section 15',
    description: 'Nominate someone to exercise your rights on your behalf in the event of death or incapacity.',
    detail_label: 'Why are you making this nomination? (optional)',
    detail_placeholder: 'e.g. I would like my spouse to be able to manage my data if I am unable to.',
    needs_data_categories: false,
  },
] as const

// DPDP status workflow labels for DSR requests (badge + filters).
export const DSR_STATUS_LABELS: Record<string, string> = {
  received:         'Received',
  identity_pending: 'Awaiting Verification',
  processing:       'Processing',
  fulfilled:        'Fulfilled',
  denied:           'Denied',
  overdue:          'Overdue',
}

// M2: Default consent purposes for new orgs
export const DEFAULT_PURPOSES: {
  purpose_key: string
  name_en: string
  name_hi: string | null
  name_ta: string | null
  name_te: string | null
  description_en: string
  required: boolean
  dpdp_basis: string
}[] = [
  { purpose_key: 'essential',  name_en: 'Essential Cookies',  name_hi: null, name_ta: null, name_te: null, description_en: 'Required for the website to function. Cannot be disabled.',                                                    required: true,  dpdp_basis: 's7_legal'    },
  { purpose_key: 'analytics',  name_en: 'Analytics',          name_hi: null, name_ta: null, name_te: null, description_en: 'Help us understand how visitors interact with our website.',                                                    required: false, dpdp_basis: 'consent_s6'  },
  { purpose_key: 'marketing',  name_en: 'Marketing',          name_hi: null, name_ta: null, name_te: null, description_en: 'Used to deliver personalized advertisements and measure their effectiveness.',                                  required: false, dpdp_basis: 'consent_s6'  },
  { purpose_key: 'functional', name_en: 'Functional',         name_hi: null, name_ta: null, name_te: null, description_en: 'Enable enhanced functionality such as live chat, video, and saved preferences.',                               required: false, dpdp_basis: 'consent_s6'  },
]

// M2: Multilingual consent widget translations (EN, HI, TA, TE)
export const CONSENT_TRANSLATIONS: Record<string, {
  banner_title: string
  banner_desc: string
  accept_all: string
  reject_all: string
  manage: string
  save: string
  required_label: string
  withdraw_notice: string
}> = {
  en: {
    banner_title: 'We value your privacy',
    banner_desc: 'We use cookies and process your personal data in accordance with the Digital Personal Data Protection Act 2023.',
    accept_all: 'Accept All',
    reject_all: 'Reject All',
    manage: 'Manage Preferences',
    save: 'Save My Choices',
    required_label: 'Required',
    withdraw_notice: 'You can withdraw consent at any time.',
  },
  hi: {
    banner_title: 'हम आपकी गोपनीयता को महत्व देते हैं',
    banner_desc: 'हम डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम 2023 के अनुसार कुकीज़ और आपका व्यक्तिगत डेटा उपयोग करते हैं।',
    accept_all: 'सभी स्वीकार करें',
    reject_all: 'सभी अस्वीकार करें',
    manage: 'प्राथमिकताएं प्रबंधित करें',
    save: 'मेरी पसंद सहेजें',
    required_label: 'आवश्यक',
    withdraw_notice: 'आप किसी भी समय सहमति वापस ले सकते हैं।',
  },
  ta: {
    banner_title: 'உங்கள் தனியுரிமையை மதிக்கிறோம்',
    banner_desc: 'டிஜிட்டல் தனிப்பட்ட தரவு பாதுகாப்பு சட்டம் 2023 இன்படி குக்கீகள் மற்றும் தரவை பயன்படுத்துகிறோம்.',
    accept_all: 'அனைத்தையும் ஏற்றுக்கொள்',
    reject_all: 'அனைத்தையும் நிராகரி',
    manage: 'விருப்பங்களை நிர்வகி',
    save: 'என் தேர்வுகளை சேமி',
    required_label: 'தேவையான',
    withdraw_notice: 'நீங்கள் எந்த நேரத்திலும் ஒப்புதலை திரும்பப் பெறலாம்.',
  },
  te: {
    banner_title: 'మీ గోప్యతను గౌరవిస్తాము',
    banner_desc: 'డిజిటల్ వ్యక్తిగత డేటా రక్షణ చట్టం 2023 ప్రకారం కుకీలు మరియు డేటాను ఉపయోగిస్తాము.',
    accept_all: 'అన్నీ అంగీకరించు',
    reject_all: 'అన్నీ తిరస్కరించు',
    manage: 'ప్రాధాన్యతలు నిర్వహించు',
    save: 'నా ఎంపికలు సేవ్ చేయి',
    required_label: 'అవసరం',
    withdraw_notice: 'మీరు ఎప్పుడైనా సమ్మతిని ఉపసంహరించవచ్చు.',
  },
  mr: {
    banner_title: 'आम्ही तुमच्या गोपनीयतेचा आदर करतो',
    banner_desc: 'आम्ही डिजिटल वैयक्तिक डेटा संरक्षण कायदा 2023 नुसार कुकीज आणि तुमचा वैयक्तिक डेटा वापरतो.',
    accept_all: 'सर्व स्वीकारा',
    reject_all: 'सर्व नाकारा',
    manage: 'प्राधान्ये व्यवस्थापित करा',
    save: 'माझ्या निवडी जतन करा',
    required_label: 'आवश्यक',
    withdraw_notice: 'तुम्ही कधीही संमती मागे घेऊ शकता.',
  },
  gu: {
    banner_title: 'અમે તમારી ગોપનીયતાનું સન્માન કરીએ છીએ',
    banner_desc: 'અમે ડિજિટલ વ્યક્તિગત ડેટા સંરક્ષણ અધિનિયમ 2023 અનુસાર કૂકીઝ અને તમારો વ્યક્તિગત ડેટા વાપરીએ છીએ.',
    accept_all: 'બધું સ્વીકારો',
    reject_all: 'બધું નકારો',
    manage: 'પસંદગીઓ સંચાલિત કરો',
    save: 'મારી પસંદગીઓ સાચવો',
    required_label: 'આવશ્યક',
    withdraw_notice: 'તમે કોઈપણ સમયે સંમતિ પાછી ખેંચી શકો છો.',
  },
  bn: {
    banner_title: 'আমরা আপনার গোপনীয়তাকে মূল্য দিই',
    banner_desc: 'আমরা ডিজিটাল ব্যক্তিগত তথ্য সুরক্ষা আইন 2023 অনুযায়ী কুকি এবং আপনার ব্যক্তিগত তথ্য ব্যবহার করি।',
    accept_all: 'সব গ্রহণ করুন',
    reject_all: 'সব প্রত্যাখ্যান করুন',
    manage: 'পছন্দ পরিচালনা করুন',
    save: 'আমার পছন্দ সংরক্ষণ করুন',
    required_label: 'আবশ্যক',
    withdraw_notice: 'আপনি যেকোনো সময় সম্মতি প্রত্যাহার করতে পারেন।',
  },
  kn: {
    banner_title: 'ನಿಮ್ಮ ಗೌಪ್ಯತೆಯನ್ನು ನಾವು ಗೌರವಿಸುತ್ತೇವೆ',
    banner_desc: 'ಡಿಜಿಟಲ್ ವೈಯಕ್ತಿಕ ದತ್ತಾಂಶ ಸಂರಕ್ಷಣಾ ಕಾಯ್ದೆ 2023 ರ ಪ್ರಕಾರ ನಾವು ಕುಕೀಗಳು ಮತ್ತು ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ದತ್ತಾಂಶವನ್ನು ಬಳಸುತ್ತೇವೆ.',
    accept_all: 'ಎಲ್ಲವನ್ನೂ ಸ್ವೀಕರಿಸಿ',
    reject_all: 'ಎಲ್ಲವನ್ನೂ ತಿರಸ್ಕರಿಸಿ',
    manage: 'ಆದ್ಯತೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ',
    save: 'ನನ್ನ ಆಯ್ಕೆಗಳನ್ನು ಉಳಿಸಿ',
    required_label: 'ಅಗತ್ಯವಿದೆ',
    withdraw_notice: 'ನೀವು ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಸಮ್ಮತಿಯನ್ನು ಹಿಂಪಡೆಯಬಹುದು.',
  },
  ml: {
    banner_title: 'ഞങ്ങൾ നിങ്ങളുടെ സ്വകാര്യതയെ വിലമതിക്കുന്നു',
    banner_desc: 'ഡിജിറ്റൽ വ്യക്തിഗത ഡാറ്റ സംരക്ഷണ നിയമം 2023 അനുസരിച്ച് ഞങ്ങൾ കുക്കികളും നിങ്ങളുടെ വ്യക്തിഗത ഡാറ്റയും ഉപയോഗിക്കുന്നു.',
    accept_all: 'എല്ലാം സ്വീകരിക്കുക',
    reject_all: 'എല്ലാം നിരസിക്കുക',
    manage: 'മുൻഗണനകൾ നിയന്ത്രിക്കുക',
    save: 'എന്റെ തിരഞ്ഞെടുപ്പുകൾ സംരക്ഷിക്കുക',
    required_label: 'ആവശ്യമാണ്',
    withdraw_notice: 'നിങ്ങൾക്ക് എപ്പോൾ വേണമെങ്കിലും സമ്മതം പിൻവലിക്കാം.',
  },
  pa: {
    banner_title: 'ਅਸੀਂ ਤੁਹਾਡੀ ਨਿੱਜਤਾ ਦੀ ਕਦਰ ਕਰਦੇ ਹਾਂ',
    banner_desc: 'ਅਸੀਂ ਡਿਜੀਟਲ ਨਿੱਜੀ ਡਾਟਾ ਸੁਰੱਖਿਆ ਐਕਟ 2023 ਅਨੁਸਾਰ ਕੁਕੀਜ਼ ਅਤੇ ਤੁਹਾਡਾ ਨਿੱਜੀ ਡਾਟਾ ਵਰਤਦੇ ਹਾਂ।',
    accept_all: 'ਸਭ ਸਵੀਕਾਰ ਕਰੋ',
    reject_all: 'ਸਭ ਰੱਦ ਕਰੋ',
    manage: 'ਤਰਜੀਹਾਂ ਪ੍ਰਬੰਧਿਤ ਕਰੋ',
    save: 'ਮੇਰੀਆਂ ਚੋਣਾਂ ਸੰਭਾਲੋ',
    required_label: 'ਲੋੜੀਂਦਾ',
    withdraw_notice: 'ਤੁਸੀਂ ਕਿਸੇ ਵੀ ਸਮੇਂ ਸਹਿਮਤੀ ਵਾਪਸ ਲੈ ਸਕਦੇ ਹੋ।',
  },
  or: {
    banner_title: 'ଆମେ ଆପଣଙ୍କ ଗୋପନୀୟତାକୁ ମୂଲ୍ୟ ଦେଉ',
    banner_desc: 'ଆମେ ଡିଜିଟାଲ୍ ବ୍ୟକ୍ତିଗତ ତଥ୍ୟ ସୁରକ୍ଷା ଆଇନ 2023 ଅନୁଯାୟୀ କୁକିଜ୍ ଏବଂ ଆପଣଙ୍କ ବ୍ୟକ୍ତିଗତ ତଥ୍ୟ ବ୍ୟବହାର କରୁ।',
    accept_all: 'ସବୁ ଗ୍ରହଣ କରନ୍ତୁ',
    reject_all: 'ସବୁ ପ୍ରତ୍ୟାଖ୍ୟାନ କରନ୍ତୁ',
    manage: 'ପସନ୍ଦ ପରିଚାଳନା କରନ୍ତୁ',
    save: 'ମୋର ପସନ୍ଦ ସଞ୍ଚୟ କରନ୍ତୁ',
    required_label: 'ଆବଶ୍ୟକ',
    withdraw_notice: 'ଆପଣ ଯେକୌଣସି ସମୟରେ ସମ୍ମତି ପ୍ରତ୍ୟାହାର କରିପାରିବେ।',
  },
  as: {
    banner_title: 'আমি আপোনাৰ গোপনীয়তাক মূল্য দিওঁ',
    banner_desc: 'আমি ডিজিটেল ব্যক্তিগত তথ্য সুৰক্ষা আইন 2023 অনুসৰি কুকি আৰু আপোনাৰ ব্যক্তিগত তথ্য ব্যৱহাৰ কৰোঁ।',
    accept_all: 'সকলো গ্ৰহণ কৰক',
    reject_all: 'সকলো প্ৰত্যাখ্যান কৰক',
    manage: 'পছন্দ পৰিচালনা কৰক',
    save: 'মোৰ পছন্দ সংৰক্ষণ কৰক',
    required_label: 'আৱশ্যক',
    withdraw_notice: 'আপুনি যিকোনো সময়তে সন্মতি প্ৰত্যাহাৰ কৰিব পাৰে।',
  },
  ur: {
    banner_title: 'ہم آپ کی رازداری کا احترام کرتے ہیں',
    banner_desc: 'ہم ڈیجیٹل ذاتی ڈیٹا تحفظ ایکٹ 2023 کے مطابق کوکیز اور آپ کا ذاتی ڈیٹا استعمال کرتے ہیں۔',
    accept_all: 'سب قبول کریں',
    reject_all: 'سب مسترد کریں',
    manage: 'ترجیحات کا نظم کریں',
    save: 'میری پسند محفوظ کریں',
    required_label: 'ضروری',
    withdraw_notice: 'آپ کسی بھی وقت رضامندی واپس لے سکتے ہیں۔',
  },
  sa: {
    banner_title: 'वयं भवतः गोपनीयतां सम्मानयामः',
    banner_desc: 'वयं डिजिटल्-व्यक्तिगत-दत्तांश-संरक्षण-अधिनियम 2023 इत्यस्य अनुसारं कुकीज् भवतः व्यक्तिगतदत्तांशं च उपयुञ्ज्महे।',
    accept_all: 'सर्वं स्वीकुरुत',
    reject_all: 'सर्वं निराकुरुत',
    manage: 'अभिरुचयः प्रबन्धयत',
    save: 'मम चयनानि रक्षत',
    required_label: 'आवश्यकम्',
    withdraw_notice: 'भवान् कस्मिन् अपि समये सम्मतिं प्रत्याहर्तुं शक्नोति।',
  },
  ne: {
    banner_title: 'हामी तपाईंको गोपनीयतालाई महत्त्व दिन्छौं',
    banner_desc: 'हामी डिजिटल व्यक्तिगत डेटा संरक्षण ऐन 2023 अनुसार कुकिज र तपाईंको व्यक्तिगत डेटा प्रयोग गर्छौं।',
    accept_all: 'सबै स्वीकार गर्नुहोस्',
    reject_all: 'सबै अस्वीकार गर्नुहोस्',
    manage: 'प्राथमिकताहरू व्यवस्थापन गर्नुहोस्',
    save: 'मेरा छनोटहरू सुरक्षित गर्नुहोस्',
    required_label: 'आवश्यक',
    withdraw_notice: 'तपाईं जुनसुकै समयमा सहमति फिर्ता लिन सक्नुहुन्छ।',
  },
  ko: {
    banner_title: 'आमी तुमच्या गुपीतपणाक मान दितांव',
    banner_desc: 'आमी डिजिटल वैयक्तिक डेटा संरक्षण कायदो 2023 प्रमाणें कुकीज आनी तुमचो वैयक्तिक डेटा वापरतांव.',
    accept_all: 'सगळें स्वीकारात',
    reject_all: 'सगळें न्हयकारात',
    manage: 'प्राधान्यां व्यवस्थापित करात',
    save: 'म्हजी निवड जतनाय करात',
    required_label: 'गरजेचें',
    withdraw_notice: 'तुमी खंयच्याय वेळार संमती परतून घेवंक शकतात.',
  },
  mai: {
    banner_title: 'हम अहाँक गोपनीयताक सम्मान करैत छी',
    banner_desc: 'हम डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम 2023 क अनुसार कुकीज आ अहाँक व्यक्तिगत डेटा प्रयोग करैत छी।',
    accept_all: 'सभ स्वीकार करू',
    reject_all: 'सभ अस्वीकार करू',
    manage: 'प्राथमिकता प्रबंधित करू',
    save: 'हमर पसंद सहेजू',
    required_label: 'आवश्यक',
    withdraw_notice: 'अहाँ कोनो समय सहमति वापस लऽ सकैत छी।',
  },
  doi: {
    banner_title: 'अस तुंदी निजता दा सम्मान करने आं',
    banner_desc: 'अस डिजिटल निजी डेटा सुरक्षा कानून 2023 दे मताबक कुकीज ते तुंदा निजी डेटा वरतने आं।',
    accept_all: 'सब्भ स्वीकार करो',
    reject_all: 'सब्भ रद्द करो',
    manage: 'तरजीहां दा प्रबंधन करो',
    save: 'मेरियां चोनां सैंभलो',
    required_label: 'लोड़चदा',
    withdraw_notice: 'तुस कुसै बी समें सहमति वापस लै सकदे ओ।',
  },
  sd: {
    banner_title: 'اسان توهان جي رازداري جو احترام ڪريون ٿا',
    banner_desc: 'اسان ڊجيٽل ذاتي ڊيٽا تحفظ ايڪٽ 2023 مطابق ڪوڪيز ۽ توهان جو ذاتي ڊيٽا استعمال ڪريون ٿا.',
    accept_all: 'سڀ قبول ڪريو',
    reject_all: 'سڀ رد ڪريو',
    manage: 'ترجيحون منظم ڪريو',
    save: 'منهنجون چونڊون محفوظ ڪريو',
    required_label: 'ضروري',
    withdraw_notice: 'توهان ڪنهن به وقت رضامندي واپس وٺي سگهو ٿا.',
  },
}

// Dashboard sidebar module config
export const SIDEBAR_MODULES = [
  { key: 'overview',        label: 'Overview',                href: '/dashboard/overview',        icon: 'LayoutDashboard', available: true },
  { key: 'reports',         label: 'Board Reports',           href: '/dashboard/reports',          icon: 'FileBarChart',    available: true },
  { key: 'assessment',      label: 'DPDP Compass™',          href: '/dashboard/assessment',       icon: 'Compass',         available: true },
  { key: 'consent',         label: 'Consent Management',     href: '/dashboard/consent',          icon: 'CheckSquare',     available: true },
  { key: 'privacy-notice',  label: 'Privacy Notice Builder', href: '/dashboard/privacy-notice',   icon: 'FileText',        available: true },
  { key: 'grievance',       label: 'Grievance Officer',      href: '/dashboard/grievance',        icon: 'MessageCircle',   available: true },
  { key: 'dsr',             label: 'DSR Management',         href: '/dashboard/dsr',              icon: 'Users',           available: true },
  { key: 'ropa',            label: 'ROPA Builder',           href: '/dashboard/ropa',             icon: 'Database',        available: true },
  { key: 'vendors',         label: 'Vendor DPA Manager',     href: '/dashboard/vendors',          icon: 'Building2',       available: true },
  { key: 'breach',          label: 'Breach Response',        href: '/dashboard/breach',           icon: 'AlertTriangle',   available: true },
  { key: 'settings',        label: 'Settings',               href: '/dashboard/settings',         icon: 'Settings',        available: false },
] as const

// ============================================================================
// M3: Privacy Notice Builder
// ============================================================================

// Standard Indian data categories, grouped for the DataCategorySelector.
// `sensitive` flags categories that warrant stricter handling language in the notice.
export const DATA_CATEGORY_GROUPS = ['Identity', 'Contact', 'Financial', 'Sensitive', 'Technical', 'Other'] as const

export const DATA_CATEGORIES: {
  key: string
  label: string
  group: (typeof DATA_CATEGORY_GROUPS)[number]
  sensitive: boolean
}[] = [
  { key: 'name_contact',        label: 'Name and contact details',                       group: 'Identity',  sensitive: false },
  { key: 'dob',                 label: 'Date of birth',                                  group: 'Identity',  sensitive: false },
  { key: 'government_id',       label: 'Government ID (Aadhaar, PAN, Voter ID, Passport)', group: 'Identity', sensitive: true  },
  { key: 'email',               label: 'Email address',                                  group: 'Contact',   sensitive: false },
  { key: 'phone',               label: 'Phone number',                                   group: 'Contact',   sensitive: false },
  { key: 'address',             label: 'Physical address',                               group: 'Contact',   sensitive: false },
  { key: 'financial_data',      label: 'Financial data (bank account, UPI, card)',       group: 'Financial', sensitive: true  },
  { key: 'transaction_history', label: 'Transaction / purchase history',                 group: 'Financial', sensitive: false },
  { key: 'health_data',         label: 'Health and medical data',                        group: 'Sensitive', sensitive: true  },
  { key: 'biometric_data',      label: 'Biometric data',                                 group: 'Sensitive', sensitive: true  },
  { key: 'children_data',       label: "Children's personal data",                       group: 'Sensitive', sensitive: true  },
  { key: 'location_data',       label: 'Location data (real-time or historical)',        group: 'Technical', sensitive: false },
  { key: 'device_usage',        label: 'Device and usage data (IP, browser, cookies)',   group: 'Technical', sensitive: false },
  { key: 'professional_info',   label: 'Professional information',                       group: 'Other',     sensitive: false },
  { key: 'social_media',        label: 'Social media profiles',                          group: 'Other',     sensitive: false },
  { key: 'other',               label: 'Other (specify)',                                group: 'Other',     sensitive: false },
]

// Step 4 — categories of third parties data may be shared with.
export const THIRD_PARTY_CATEGORIES: { key: string; label: string }[] = [
  { key: 'cloud_hosting',     label: 'Cloud / hosting providers' },
  { key: 'payment_processors', label: 'Payment processors' },
  { key: 'analytics',         label: 'Analytics providers' },
  { key: 'marketing',         label: 'Marketing / advertising tools' },
  { key: 'customer_support',  label: 'Customer support tools' },
  { key: 'hr_payroll',        label: 'HR / payroll providers' },
  { key: 'other_vendors',     label: 'Other vendors' },
]

// Notice languages available at MVP launch (English is always generated).
// `column` maps to the privacy_notice_versions content column.
export const NOTICE_LANGUAGES: { code: string; name: string; nativeName: string; column: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English', column: 'content_en' },
  { code: 'hi', name: 'Hindi',   nativeName: 'हिन्दी',   column: 'content_hi' },
  { code: 'ta', name: 'Tamil',   nativeName: 'தமிழ்',    column: 'content_ta' },
  { code: 'te', name: 'Telugu',  nativeName: 'తెలుగు',   column: 'content_te' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी',    column: 'content_mr' },
]

// Step 3 — industry-specific processing-purpose suggestions.
// `basis` values reference DPDP_BASES ids. `bfsi` reuses `fintech` (handled by
// getIndustryPurposes normalization).
export interface IndustryPurposeSuggestion {
  data_category: string
  purpose: string
  basis: string
}

export const DEFAULT_PURPOSE_SUGGESTIONS: IndustryPurposeSuggestion[] = [
  { data_category: 'name_contact', purpose: 'Account creation, service delivery, and customer support', basis: 'consent_s6' },
  { data_category: 'email',        purpose: 'Service communications and transactional notifications',    basis: 'consent_s6' },
  { data_category: 'device_usage', purpose: 'Securing the platform and improving the user experience',   basis: 'consent_s6' },
]

export const INDUSTRY_PURPOSES: Record<string, IndustryPurposeSuggestion[]> = {
  fintech: [
    { data_category: 'government_id',  purpose: 'KYC verification as required by RBI', basis: 's7_legal' },
    { data_category: 'financial_data', purpose: 'Processing payments and transactions', basis: 'consent_s6' },
    { data_category: 'name_contact',   purpose: 'Account creation and customer support', basis: 'consent_s6' },
  ],
  healthtech: [
    { data_category: 'health_data',  purpose: 'Providing diagnosis, treatment, and telemedicine services', basis: 'consent_s6' },
    { data_category: 'government_id', purpose: 'Patient identity verification and insurance claims',         basis: 's7_legal' },
    { data_category: 'name_contact', purpose: 'Appointment scheduling and care coordination',                basis: 'consent_s6' },
  ],
  edtech: [
    { data_category: 'name_contact',  purpose: 'Student enrollment and course access',              basis: 'consent_s6' },
    { data_category: 'children_data', purpose: 'Providing educational services to minors',           basis: 'consent_s6' }, // parental consent required
    { data_category: 'device_usage',  purpose: 'Improving learning experience via analytics',        basis: 'consent_s6' },
  ],
  ecommerce: [
    { data_category: 'name_contact',        purpose: 'Order fulfillment and delivery',              basis: 'consent_s6' },
    { data_category: 'financial_data',      purpose: 'Payment processing',                          basis: 'consent_s6' },
    { data_category: 'location_data',       purpose: 'Delivery address verification',               basis: 'consent_s6' },
    { data_category: 'transaction_history', purpose: 'Personalized product recommendations',        basis: 'consent_s6' },
  ],
  hrtech: [
    { data_category: 'name_contact',      purpose: 'Candidate sourcing, onboarding, and HR records', basis: 'consent_s6' },
    { data_category: 'government_id',      purpose: 'Background verification and statutory compliance', basis: 's7_employment' },
    { data_category: 'professional_info',  purpose: 'Assessing suitability for roles',               basis: 'consent_s6' },
  ],
  logistics: [
    { data_category: 'name_contact',  purpose: 'Coordinating pickups and deliveries',      basis: 'consent_s6' },
    { data_category: 'location_data', purpose: 'Real-time shipment tracking and routing',   basis: 'consent_s6' },
    { data_category: 'address',       purpose: 'Last-mile delivery',                        basis: 'consent_s6' },
  ],
  media: [
    { data_category: 'name_contact',  purpose: 'Subscription management and account access', basis: 'consent_s6' },
    { data_category: 'device_usage',  purpose: 'Content personalization and recommendations', basis: 'consent_s6' },
    { data_category: 'financial_data', purpose: 'Processing subscription payments',           basis: 'consent_s6' },
  ],
}

// Returns industry-specific purpose suggestions, normalizing bfsi -> fintech and
// falling back to a sensible default for unmapped industries.
export function getIndustryPurposes(industry: string | null | undefined): IndustryPurposeSuggestion[] {
  if (!industry) return DEFAULT_PURPOSE_SUGGESTIONS
  const key = industry === 'bfsi' ? 'fintech' : industry
  return INDUSTRY_PURPOSES[key] ?? DEFAULT_PURPOSE_SUGGESTIONS
}

// ============================================================================
// M7: Vendor DPA Manager
// ============================================================================

// Vendor categories — matches vendors.vendor_type and the VendorType union.
export const VENDOR_TYPES: { value: VendorType; label: string }[] = [
  { value: 'cloud',          label: 'Cloud / Hosting' },
  { value: 'payments',       label: 'Payments' },
  { value: 'analytics',      label: 'Analytics' },
  { value: 'marketing',      label: 'Marketing / Ads' },
  { value: 'crm',            label: 'CRM / Customer Support' },
  { value: 'hr',             label: 'HR / Payroll' },
  { value: 'communications', label: 'Communications (SMS / Email / Voice)' },
  { value: 'other',          label: 'Other' },
]

// DPA signing workflow labels (badge + filters).
export const VENDOR_DPA_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  sent:    'Sent for Signature',
  signed:  'Signed',
  expired: 'Expired',
}

// Vendor risk tier display config (low → critical). Higher tier = higher risk.
export const VENDOR_RISK_TIERS = {
  low:      { label: 'Low Risk',      color: '#059669', bgColor: '#ECFDF5' },
  medium:   { label: 'Medium Risk',   color: '#2563EB', bgColor: '#EFF6FF' },
  high:     { label: 'High Risk',     color: '#D97706', bgColor: '#FFFBEB' },
  critical: { label: 'Critical Risk', color: '#DC2626', bgColor: '#FEF2F2' },
} as const

// Number of days before dpa_expires_at at which a signed DPA is flagged
// "expiring soon" on the dashboard (the acceptance criterion). Read-time only —
// see src/lib/vendors/status.ts; nothing flips dpa_status automatically.
export const DPA_EXPIRY_WARNING_DAYS = 30

// Pre-assessed common Indian SaaS vendors, seeded as a LIBRARY constant. We do
// NOT bulk-insert these into every org — each org adds only the vendors it uses
// via the "Add from library" action, which inserts a vendors row for that org.
//
// NOTE: the original M7 spec listed 10 vendors but described "20 common Indian
// SaaS vendors". We seed the 10 given verbatim and add 10 more well-known
// India-resident SaaS providers to reach 20. The added 10 (clearly marked) are
// reasonable launch defaults whose certifications/residency should be
// re-validated against each vendor's current posture before customer use.
export interface IndiaVendorPreassessment {
  name: string
  type: VendorType
  india_data_residency: boolean
  risk_tier: VendorRiskTier
  notes: string
}

export const INDIA_VENDOR_PREASSESSMENTS: IndiaVendorPreassessment[] = [
  // ── The 10 from the original spec ──
  { name: 'Zoho CRM',             type: 'crm',            india_data_residency: true, risk_tier: 'low',    notes: 'ISO 27001 certified, India DCs available' },
  { name: 'Freshdesk',            type: 'crm',            india_data_residency: true, risk_tier: 'low',    notes: 'SOC 2 Type II, India region' },
  { name: 'Razorpay',             type: 'payments',       india_data_residency: true, risk_tier: 'medium', notes: 'PCI-DSS, RBI-regulated, India only' },
  { name: 'Paytm',                type: 'payments',       india_data_residency: true, risk_tier: 'medium', notes: 'RBI-regulated, no published ISO cert' },
  { name: 'CleverTap',            type: 'analytics',      india_data_residency: true, risk_tier: 'medium', notes: 'India DC available' },
  { name: 'Exotel',               type: 'communications', india_data_residency: true, risk_tier: 'low',    notes: 'India-only platform' },
  { name: 'AWS ap-south-1',       type: 'cloud',          india_data_residency: true, risk_tier: 'low',    notes: 'ISO 27001, SOC 2, Mumbai region' },
  { name: 'Google Cloud (Mumbai)', type: 'cloud',         india_data_residency: true, risk_tier: 'low',    notes: 'ISO 27001, Mumbai PoP' },
  { name: 'Azure (Pune/Chennai)', type: 'cloud',          india_data_residency: true, risk_tier: 'low',    notes: 'ISO 27001, India regions' },
  { name: 'Tally Solutions',      type: 'hr',             india_data_residency: true, risk_tier: 'low',    notes: 'India-based, financial data handling' },

  // ── Added to reach 20 (validate certifications/residency before customer use) ──
  { name: 'Juspay',               type: 'payments',       india_data_residency: true, risk_tier: 'medium', notes: 'PCI-DSS, RBI-aligned payments orchestration, India' },
  { name: 'PhonePe',              type: 'payments',       india_data_residency: true, risk_tier: 'medium', notes: 'RBI-regulated UPI/payments, India only' },
  { name: 'MoEngage',             type: 'analytics',      india_data_residency: true, risk_tier: 'medium', notes: 'ISO 27001 / SOC 2, India DC option' },
  { name: 'WebEngage',            type: 'marketing',      india_data_residency: true, risk_tier: 'medium', notes: 'Marketing automation, India region available' },
  { name: 'Netcore Cloud',        type: 'marketing',      india_data_residency: true, risk_tier: 'medium', notes: 'Email/marketing, India-based' },
  { name: 'Gupshup',              type: 'communications', india_data_residency: true, risk_tier: 'low',    notes: 'Conversational/WhatsApp messaging, India-based' },
  { name: 'Kaleyra',              type: 'communications', india_data_residency: true, risk_tier: 'low',    notes: 'CPaaS (SMS/voice), India-origin' },
  { name: 'Darwinbox',            type: 'hr',             india_data_residency: true, risk_tier: 'low',    notes: 'ISO 27001 HRMS, India DCs' },
  { name: 'Keka HR',              type: 'hr',             india_data_residency: true, risk_tier: 'low',    notes: 'India-based HR/payroll SaaS' },
  { name: 'Digio',                type: 'other',          india_data_residency: true, risk_tier: 'medium', notes: 'eSign / Aadhaar KYC, RBI/UIDAI-aligned, India' },
]

// ============================================================================
// M6: ROPA Builder — Record of Processing Activities
// ============================================================================

// Categories of data principals an activity processes (ropa_entries.data_subject_types).
export const ROPA_SUBJECT_TYPES: { value: RopaSubjectType; label: string }[] = [
  { value: 'customers',        label: 'Customers' },
  { value: 'employees',        label: 'Employees' },
  { value: 'children',         label: 'Children (under 18)' },
  { value: 'vendors',          label: 'Vendors / Partners' },
  { value: 'website_visitors', label: 'Website Visitors' },
]

// ROPA status labels (badge + filters).
export const ROPA_STATUS_LABELS: Record<string, string> = {
  draft:    'Draft',
  active:   'Active',
  archived: 'Archived',
}

// A pre-filled processing activity in an industry template. Mirrors the
// ropa_entries shape (minus org/status/audit columns). `data_categories` are
// DATA_CATEGORIES keys; `data_subject_types` are RopaSubjectType values;
// `legal_basis` is a DPDP_BASES id. Co-located here (not in types) like the M7
// questionnaire structural types.
export interface RopaTemplateActivity {
  activity_name: string
  activity_description: string
  data_categories: string[]
  data_subject_types: RopaSubjectType[]
  processing_purposes: string[]
  legal_basis: string
  retention_period: string
  recipients?: string[]
  security_measures?: string[]
}

// Industry-specific starter ROPA activities, seeded as a LIBRARY constant. We do
// NOT bulk-insert these into every org — each org adds only the activities it
// uses via the "Add from template" picker. Keyed by industry; `bfsi` normalises
// to `fintech` and unmapped industries fall back to a sensible default (mirrors
// INDUSTRY_PURPOSES / getIndustryPurposes).
export const ROPA_INDUSTRY_TEMPLATES: Record<string, RopaTemplateActivity[]> = {
  fintech: [
    {
      activity_name: 'KYC & Customer Onboarding',
      activity_description: 'Collecting and verifying customer identity documents to satisfy RBI KYC obligations before account activation.',
      data_categories: ['name_contact', 'government_id', 'dob', 'address'],
      data_subject_types: ['customers'],
      processing_purposes: ['KYC verification as required by RBI', 'Customer onboarding and account activation'],
      legal_basis: 's7_legal',
      retention_period: '8 years after account closure (RBI / PMLA record-keeping)',
      recipients: ['KYC/AML verification agencies', 'Regulatory authorities'],
      security_measures: ['Encryption at rest and in transit', 'Role-based access control', 'Audit logging'],
    },
    {
      activity_name: 'Payment & Transaction Processing',
      activity_description: 'Processing customer payments, settlements and refunds across the platform.',
      data_categories: ['name_contact', 'financial_data', 'transaction_history'],
      data_subject_types: ['customers'],
      processing_purposes: ['Processing payments and transactions', 'Settlement and refunds'],
      legal_basis: 'consent_s6',
      retention_period: '8 years (financial record-keeping)',
      recipients: ['Payment gateways', 'Acquiring banks'],
      security_measures: ['PCI-DSS controls', 'Tokenisation', 'Encryption'],
    },
    {
      activity_name: 'Fraud Detection & Risk Monitoring',
      activity_description: 'Analysing transaction and device signals to detect and prevent fraudulent activity.',
      data_categories: ['transaction_history', 'device_usage', 'location_data'],
      data_subject_types: ['customers'],
      processing_purposes: ['Fraud detection and prevention', 'Transaction risk scoring'],
      legal_basis: 's7_legal',
      retention_period: '5 years from transaction date',
      security_measures: ['Access control', 'Anomaly detection', 'Audit logging'],
    },
  ],
  healthtech: [
    {
      activity_name: 'Patient Care & Telemedicine',
      activity_description: 'Recording health information to provide diagnosis, treatment and remote consultations.',
      data_categories: ['name_contact', 'health_data', 'dob'],
      data_subject_types: ['customers'],
      processing_purposes: ['Providing diagnosis, treatment and telemedicine services'],
      legal_basis: 'consent_s6',
      retention_period: 'As mandated by medical record-retention rules (typically 3–10 years)',
      recipients: ['Consulting physicians', 'Diagnostic labs'],
      security_measures: ['Encryption at rest and in transit', 'Strict role-based access', 'Audit logging'],
    },
    {
      activity_name: 'Insurance Claims & Reimbursement',
      activity_description: 'Verifying patient identity and processing insurance claims and reimbursements.',
      data_categories: ['name_contact', 'government_id', 'health_data', 'financial_data'],
      data_subject_types: ['customers'],
      processing_purposes: ['Patient identity verification and insurance claims'],
      legal_basis: 's7_legal',
      retention_period: '7 years from claim settlement',
      recipients: ['Insurance providers', 'TPAs'],
      security_measures: ['Encryption', 'Access control'],
    },
    {
      activity_name: 'Appointment Scheduling & Care Coordination',
      activity_description: 'Managing appointments, reminders and care coordination across providers.',
      data_categories: ['name_contact', 'phone', 'email'],
      data_subject_types: ['customers'],
      processing_purposes: ['Appointment scheduling and care coordination'],
      legal_basis: 'consent_s6',
      retention_period: 'Duration of care relationship + 1 year',
      security_measures: ['Access control', 'Audit logging'],
    },
  ],
  edtech: [
    {
      activity_name: 'Student Enrollment & Course Access',
      activity_description: 'Registering learners and provisioning access to courses and learning content.',
      data_categories: ['name_contact', 'email', 'dob'],
      data_subject_types: ['customers', 'children'],
      processing_purposes: ['Student enrollment and course access'],
      legal_basis: 'consent_s6',
      retention_period: 'Duration of enrollment + 2 years',
      security_measures: ['Access control', 'Encryption'],
    },
    {
      activity_name: 'Verifiable Parental Consent (Minors)',
      activity_description: 'Obtaining and recording verifiable parental consent before processing a child’s data (DPDP Section 9).',
      data_categories: ['children_data', 'name_contact', 'email'],
      data_subject_types: ['children'],
      processing_purposes: ['Providing educational services to minors with verifiable parental consent'],
      legal_basis: 'consent_s6',
      retention_period: 'Until consent is withdrawn or account closure',
      security_measures: ['Parental consent records', 'Restricted access', 'Audit logging'],
    },
    {
      activity_name: 'Learning Analytics',
      activity_description: 'Analysing usage and performance data to improve learning outcomes and content.',
      data_categories: ['device_usage', 'transaction_history'],
      data_subject_types: ['customers', 'children'],
      processing_purposes: ['Improving learning experience via analytics'],
      legal_basis: 'consent_s6',
      retention_period: '3 years (aggregated thereafter)',
      security_measures: ['Pseudonymisation', 'Access control'],
    },
  ],
  ecommerce: [
    {
      activity_name: 'Order Fulfilment & Delivery',
      activity_description: 'Processing orders and coordinating delivery to customers.',
      data_categories: ['name_contact', 'address', 'phone'],
      data_subject_types: ['customers'],
      processing_purposes: ['Order fulfilment and delivery'],
      legal_basis: 'consent_s6',
      retention_period: '5 years (tax and consumer-protection records)',
      recipients: ['Logistics / courier partners'],
      security_measures: ['Access control', 'Encryption'],
    },
    {
      activity_name: 'Payment Processing',
      activity_description: 'Collecting and processing payments for purchases.',
      data_categories: ['name_contact', 'financial_data', 'transaction_history'],
      data_subject_types: ['customers'],
      processing_purposes: ['Payment processing'],
      legal_basis: 'consent_s6',
      retention_period: '8 years (financial records)',
      recipients: ['Payment gateways'],
      security_measures: ['PCI-DSS controls', 'Tokenisation'],
    },
    {
      activity_name: 'Marketing & Personalisation',
      activity_description: 'Using purchase and browsing history to personalise recommendations and send marketing.',
      data_categories: ['name_contact', 'email', 'transaction_history', 'device_usage'],
      data_subject_types: ['customers', 'website_visitors'],
      processing_purposes: ['Personalised product recommendations', 'Marketing communications'],
      legal_basis: 'consent_s6',
      retention_period: 'Until consent is withdrawn',
      security_measures: ['Consent management', 'Access control'],
    },
  ],
  hrtech: [
    {
      activity_name: 'Recruitment & Candidate Management',
      activity_description: 'Sourcing, screening and managing candidate applications.',
      data_categories: ['name_contact', 'professional_info', 'email', 'phone'],
      data_subject_types: ['employees'],
      processing_purposes: ['Candidate sourcing, onboarding and HR records'],
      legal_basis: 'consent_s6',
      retention_period: '1 year for unsuccessful candidates; duration of employment otherwise',
      security_measures: ['Access control', 'Encryption'],
    },
    {
      activity_name: 'Background Verification',
      activity_description: 'Verifying candidate credentials and conducting statutory background checks.',
      data_categories: ['name_contact', 'government_id', 'professional_info'],
      data_subject_types: ['employees'],
      processing_purposes: ['Background verification and statutory compliance'],
      legal_basis: 's7_employment',
      retention_period: 'Duration of employment + 3 years',
      recipients: ['Background-verification agencies'],
      security_measures: ['Restricted access', 'Audit logging'],
    },
    {
      activity_name: 'Payroll & Benefits Administration',
      activity_description: 'Processing salary, statutory deductions and employee benefits.',
      data_categories: ['name_contact', 'government_id', 'financial_data'],
      data_subject_types: ['employees'],
      processing_purposes: ['Salary processing and statutory compliance (PF, ESI, TDS)'],
      legal_basis: 's7_employment',
      retention_period: '8 years (statutory payroll records)',
      recipients: ['Payroll processors', 'Statutory authorities'],
      security_measures: ['Encryption', 'Role-based access'],
    },
  ],
}

// Default starter activities for industries without a dedicated template.
export const DEFAULT_ROPA_TEMPLATE: RopaTemplateActivity[] = [
  {
    activity_name: 'Customer Account Management',
    activity_description: 'Creating and maintaining customer accounts and delivering core services.',
    data_categories: ['name_contact', 'email', 'phone'],
    data_subject_types: ['customers'],
    processing_purposes: ['Account creation, service delivery and customer support'],
    legal_basis: 'consent_s6',
    retention_period: 'Duration of the relationship + 3 years',
    security_measures: ['Access control', 'Encryption'],
  },
  {
    activity_name: 'Employee HR Records',
    activity_description: 'Maintaining employee records for payroll, benefits and statutory compliance.',
    data_categories: ['name_contact', 'government_id', 'financial_data'],
    data_subject_types: ['employees'],
    processing_purposes: ['HR administration and statutory compliance'],
    legal_basis: 's7_employment',
    retention_period: '8 years after exit (statutory records)',
    security_measures: ['Role-based access', 'Encryption'],
  },
  {
    activity_name: 'Website Analytics',
    activity_description: 'Collecting usage data to secure the platform and improve the user experience.',
    data_categories: ['device_usage', 'location_data'],
    data_subject_types: ['website_visitors'],
    processing_purposes: ['Securing the platform and improving the user experience'],
    legal_basis: 'consent_s6',
    retention_period: '14 months (aggregated thereafter)',
    security_measures: ['Pseudonymisation', 'Access control'],
  },
]

// Returns starter ROPA activities for an industry, normalising bfsi -> fintech
// and falling back to DEFAULT_ROPA_TEMPLATE for unmapped industries.
export function getRopaTemplates(industry: string | null | undefined): RopaTemplateActivity[] {
  if (!industry) return DEFAULT_ROPA_TEMPLATE
  const key = industry === 'bfsi' ? 'fintech' : industry
  return ROPA_INDUSTRY_TEMPLATES[key] ?? DEFAULT_ROPA_TEMPLATE
}

// ============================================================================
// M8: Breach Response — 72-hour DPBI notification workflow
// ============================================================================

// Nature of the breach (breach_incidents.nature). Matches the BreachNature union.
export const BREACH_NATURE_TYPES: { value: BreachNature; label: string }[] = [
  { value: 'unauthorized_access',   label: 'Unauthorized Access' },
  { value: 'accidental_disclosure', label: 'Accidental Disclosure' },
  { value: 'ransomware',            label: 'Ransomware / Malware' },
  { value: 'data_loss',             label: 'Data Loss' },
  { value: 'insider_threat',        label: 'Insider Threat' },
  { value: 'other',                 label: 'Other' },
]

// Breach lifecycle status labels (badge + filters). The DPBI-notified state is a
// separate boolean (dpbi_notified) — intentionally NOT a status value here.
export const BREACH_STATUS_LABELS: Record<string, string> = {
  open:      'Open',
  contained: 'Contained',
  resolved:  'Resolved',
}

// The 72-hour DPBI notification deadline (DPDP Act §8(6) + Rules 2025 Rule 7).
// The countdown is DERIVED at read time from discovered_at — see
// src/lib/breach/countdown.ts. Nothing flips status automatically (no cron for
// the countdown itself).
export const DPBI_DEADLINE_HOURS = 72

// Escalation alert thresholds, in HOURS REMAINING, at which the org's DPO/admin
// is emailed while a breach is still open and not yet DPBI-notified. The alerts
// themselves need an external scheduler hitting POST /api/breach/escalations/run
// (e.g. Vercel Cron via vercel.json, a GitHub Action, or Supabase pg_cron every
// ~15 min) — the countdown is derived but sending email is not auto-wired.
export const BREACH_ESCALATION_HOURS = [48, 24, 12, 6, 2]

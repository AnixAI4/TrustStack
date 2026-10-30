/**
 * D-011's caveat — wording that is code, not documentation. Its own module so
 * the exposure model (which carries it on every output) and the report
 * builders (which print it on every report) can both import it without
 * importing each other.
 */

/** D-011, verbatim. Every generated report and every exposure output carries it. */
export const DPDP_REPORT_CAVEAT =
  "This report is a DPDP readiness and assessment output based on information, responses and evidence " +
  "made available during the assessment. It is not a final legal opinion, statutory certification or " +
  "guarantee of compliance. Final legal interpretation, policy approval and contractual sign-off should " +
  "be reviewed by authorised legal counsel.";

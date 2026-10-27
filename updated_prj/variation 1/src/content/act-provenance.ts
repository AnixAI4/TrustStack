export const ACT_PROVENANCE = {
  gazettePublicationId: "CG-DL-E-12082023-248045",
  gazetteUrl: "https://egazette.gov.in/WriteReadData/2023/248045.pdf",
  gazetteSha256: "4deb23981d3010c8225a2ff6149e7243dc2268455b299e283afebdd7b72a7d15",
  indiaCodeActId: "AC_CEN_45_0_00003_2023-22_1763464807080",
  indiaCodeRecordUrl:
    "https://www.indiacode.nic.in/handle/123456789/22037?view_type=search&col=123456789/1362",
  verifiedOn: "16 July 2026",
} as const;

const INDIA_CODE_SECTION_IDS: Record<number, number> = {
  1: 101267,
  2: 101268,
  3: 101269,
  4: 101270,
  5: 101271,
  6: 101272,
  7: 101273,
  8: 101274,
  9: 101275,
  10: 101276,
  11: 101277,
  12: 101278,
  13: 101279,
  14: 101280,
  15: 101281,
  16: 101282,
  17: 101283,
  18: 101284,
  19: 101285,
  20: 101286,
  21: 101368,
  22: 101288,
  23: 101289,
  24: 101290,
  25: 101291,
  26: 101292,
  27: 101293,
  28: 101294,
  29: 101295,
  30: 101296,
  31: 101297,
  32: 101298,
  33: 101299,
  34: 101300,
  35: 101301,
  36: 101302,
  37: 101303,
  38: 101304,
  39: 101305,
  40: 101306,
  41: 101307,
  42: 101308,
  43: 101309,
  44: 101310,
};

export function getIndiaCodeSectionUrl(sectionNumber: number): string {
  const sectionId = INDIA_CODE_SECTION_IDS[sectionNumber];
  if (!sectionId) return ACT_PROVENANCE.indiaCodeRecordUrl;

  const params = new URLSearchParams({
    abv: "CEN",
    statehandle: "123456789/1362",
    actid: ACT_PROVENANCE.indiaCodeActId,
    sectionId: String(sectionId),
    sectionno: String(sectionNumber),
    orderno: String(sectionNumber),
    orgactid: ACT_PROVENANCE.indiaCodeActId,
  });
  return `https://www.indiacode.nic.in/show-data?${params}`;
}
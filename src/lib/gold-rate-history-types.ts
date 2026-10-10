/** First day the marketing site existed, in India time. */
export const WEBSITE_INCEPTION_YMD = "2026-06-16";

export type GoldRateQuery = {
  from?: string;
  to?: string;
  month?: string;
};

/** One calendar day of the gold rate visitors saw on the website. */
export type SeenGoldRateDay = {
  /** IST day the rate was on the site. */
  shownOn: string;
  /** IST day of the 5:30 PM close that rate came from. */
  spotSession: string;
  rate22kPerGramInr: number;
  loanPerGramInr: number;
  /** Lending-rate change versus the previous listed day. Null on the first day. */
  changeInr: number | null;
  updatedAt: string;
};

export type GoldRateHistory = {
  inception: string;
  from: string;
  to: string;
  /** First day in the full history that has a usable close. */
  firstShownOn: string | null;
  rows: SeenGoldRateDay[];
};

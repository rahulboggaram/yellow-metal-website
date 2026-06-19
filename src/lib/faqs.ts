export type FaqItem = {
  question: string;
  answer: string;
};

/** Add new FAQs here — they appear on /faq. */
export const SITE_FAQS: FaqItem[] = [
  {
    question: "Where is today's gold lending rate sourced from?",
    answer:
      "Today's gold lending rate is provided on the AGLOC or IBJA.",
  },
];

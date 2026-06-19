export type FeatureCarouselSlide =
  | {
      id: string;
      kind: "feature";
      title: string;
      description: string;
      icon: "app" | "bell" | "payment" | "release";
    }
  | {
      id: string;
      kind: "app-download";
      title: string;
      description: string;
      playStoreUrl: string;
      qrSrc: string;
      screens: { src: string; alt: string }[];
    }
  | {
      id: string;
      kind: "partners";
      title: string;
      logos: { src: string; alt: string }[];
    }
  | {
      id: string;
      kind: "app-screens";
      title: string;
      subtitle: string;
      screens: { src: string; alt: string }[];
    }
  | {
      id: string;
      kind: "stories";
      title: string;
      subtitle: string;
      disclaimer: string;
      images: { src: string; alt: string }[];
    };

export const FEATURE_CAROUSEL_SLIDES: FeatureCarouselSlide[] = [
  {
    id: "download-app",
    kind: "app-download",
    title: "Download the app",
    description:
      "Track your loan, view statements, and manage repayments from your phone — anytime, anywhere.",
    playStoreUrl:
      "https://play.google.com/store/apps/details?id=com.consumer.yellow_metal",
    qrSrc: "/images/site/app-qr.png",
    screens: [
      {
        src: "/images/site/app-passbook.png",
        alt: "Yellow Metal app passbook screen",
      },
      {
        src: "/images/site/app-loan-details.png",
        alt: "Yellow Metal app loan details screen",
      },
    ],
  },
  {
    id: "interest-reminders",
    kind: "feature",
    title: "Interest reminders",
    description:
      "Gentle nudges before your interest due date so you never miss a payment or pay a penalty.",
    icon: "bell",
  },
  {
    id: "part-payment",
    kind: "feature",
    title: "Part payment",
    description:
      "Pay down your principal in chunks whenever you have spare cash — reduce interest as you go.",
    icon: "payment",
  },
  {
    id: "part-release",
    kind: "feature",
    title: "Part release",
    description:
      "Need some ornaments back? Release a portion of pledged gold while keeping the rest as collateral.",
    icon: "release",
  },
  {
    id: "banking-partners",
    kind: "partners",
    title: "Banking in partnership with",
    logos: [
      { src: "/images/site/partner-bank-1.png", alt: "Banking partner" },
      { src: "/images/site/partner-bank-2.png", alt: "Banking partner" },
      { src: "/images/site/partner-bank-3.png", alt: "Banking partner" },
      { src: "/images/site/partner-bank-4.png", alt: "Banking partner" },
    ],
  },
  {
    id: "loan-details-app",
    kind: "app-screens",
    title: "100% loan details shown in the app",
    subtitle: "Passbook, KFS, interest tiers, and renewals — all in one place.",
    screens: [
      {
        src: "/images/site/app-passbook.png",
        alt: "Passbook view in the Yellow Metal app",
      },
      {
        src: "/images/site/app-loan-details.png",
        alt: "Loan details view in the Yellow Metal app",
      },
    ],
  },
  {
    id: "customer-stories",
    kind: "stories",
    title: "600 crores & growing",
    subtitle: "Loans for all types of business growth",
    disclaimer:
      "Above images are AI generated. All the loan scenarios are real examples; borrowing customers like to keep their identity private.",
    images: [
      { src: "/images/site/story-1.png", alt: "Gold loan customer story" },
      { src: "/images/site/story-2.png", alt: "Gold loan customer story" },
      { src: "/images/site/story-3.png", alt: "Gold loan customer story" },
      { src: "/images/site/story-4.png", alt: "Gold loan customer story" },
      { src: "/images/site/story-5.png", alt: "Gold loan customer story" },
      { src: "/images/site/story-6.png", alt: "Gold loan customer story" },
    ],
  },
];

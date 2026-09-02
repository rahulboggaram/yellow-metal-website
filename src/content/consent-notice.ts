export type ConsentNoticeLanguage = "en" | "kn";

export type ConsentNoticeItem = {
  data: string;
  purpose: string;
  enables: string;
};

export type ConsentNoticeCopy = {
  title: string;
  standalone: string;
  intro: string;
  dataHeading: string;
  purposeLabel: string;
  enablesLabel: string;
  items: readonly ConsentNoticeItem[];
  notOnSiteHeading: string;
  notOnSite: string;
  rightsHeading: string;
  rights: readonly string[];
  officerHeading: string;
  officerIntro: string;
  officerNameLabel: string;
  officerRoleLabel: string;
  officerEmailLabel: string;
  officerPhoneLabel: string;
  officerAddressLabel: string;
  boardHeading: string;
  board: string;
  withdraw: string;
  policyLink: string;
  checkboxLabel: string;
  agree: string;
  agreedStatus: string;
};

export const CONSENT_NOTICE = {
  en: {
    title: "Website data consent notice",
    standalone:
      "This notice stands on its own. It is separate from our Privacy Policy and Terms of Use.",
    intro:
      "Yellow Metal Loans Private Limited uses this website to explain gold loans. This notice tells you what we collect here, why, and how to reach our Grievance Officer.",
    dataHeading: "What we collect on this website, and why",
    purposeLabel: "Why",
    enablesLabel: "This lets us",
    items: [
      {
        data: "The page path you view (for example, Home or Contact).",
        purpose: "To see which information people actually use.",
        enables: "Improve the public website.",
      },
      {
        data: "A temporary browser session identifier, hashed before storage.",
        purpose: "To group page views from one visit, without storing your name.",
        enables: "Understand a visit as a whole, not as isolated clicks.",
      },
      {
        data: "Approximate region or country from network routing. We do not store city.",
        purpose: "To understand, at a high level, where the site is visited from.",
        enables: "Plan language and branch information.",
      },
      {
        data: "Device and browser type inferred from the user-agent string.",
        purpose: "To catch layout problems on common phones and browsers.",
        enables: "Keep the site readable on the devices people use.",
      },
      {
        data: "Coarse calculator and lending-rate interaction bands — not the exact grams or rupee amount you typed.",
        purpose: "To see whether the loan estimator is useful.",
        enables: "Improve the calculator.",
      },
    ],
    notOnSiteHeading: "What this website does not collect",
    notOnSite:
      "This site does not take loan applications. Name, KYC documents, mobile number, bank details, and gold ornament details are collected at our branches, with a separate notice at that time.",
    rightsHeading: "Your choices and rights",
    rights: [
      "Tick the box and tap I agree after you have read this notice.",
      "You can return to this page any time from the website footer.",
      "Ask what data we hold, ask us to correct it, or ask us to delete it where the law allows.",
      "Write to our Grievance Officer below. If we do not resolve it within 30 days, you may complain to the Data Protection Board of India.",
    ],
    officerHeading: "Grievance Officer",
    officerIntro:
      "For questions or complaints about personal data, contact the officer named here.",
    officerNameLabel: "Name",
    officerRoleLabel: "Designation",
    officerEmailLabel: "Email",
    officerPhoneLabel: "Phone",
    officerAddressLabel: "Office address",
    boardHeading: "Complaint to the Data Protection Board",
    board:
      "If your concern is not resolved within 30 days, you may complain to the Data Protection Board of India under the Digital Personal Data Protection Act, 2023.",
    withdraw:
      "To record agreement again, return to this page, tick the box, and tap I agree.",
    policyLink: "Full privacy policy",
    checkboxLabel: "I have read this notice",
    agree: "I agree",
    agreedStatus: "You have agreed to this notice.",
  },
  kn: {
    title: "ಜಾಲತಾಣ ದತ್ತಾಂಶ ಸಮ್ಮತಿ ಸೂಚನೆ",
    standalone:
      "ಈ ಸೂಚನೆ ಸ್ವತಂತ್ರವಾಗಿದೆ. ಇದು ನಮ್ಮ ಗೌಪ್ಯತಾ ನೀತಿ ಅಥವಾ ಬಳಕೆಯ ನಿಯಮಗಳ ಭಾಗವಲ್ಲ.",
    intro:
      "ಯೆಲ್ಲೋ ಮೆಟಲ್ ಲೋನ್ಸ್ ಪ್ರೈವೇಟ್ ಲಿಮಿಟೆಡ್ ಈ ಜಾಲತಾಣದಲ್ಲಿ ಚಿನ್ನದ ಸಾಲಗಳನ್ನು ವಿವರಿಸುತ್ತದೆ. ಈ ಸೂಚನೆ ಇಲ್ಲಿ ನಾವು ಏನು ಸಂಗ್ರಹಿಸುತ್ತೇವೆ, ಏಕೆ, ಮತ್ತು ದೂರು ನಿವಾರಣಾಧಿಕಾರಿಯನ್ನು ಹೇಗೆ ಸಂಪರ್ಕಿಸುವುದು ಎಂದು ತಿಳಿಸುತ್ತದೆ.",
    dataHeading: "ಈ ಜಾಲತಾಣದಲ್ಲಿ ನಾವು ಸಂಗ್ರಹಿಸುವುದು, ಮತ್ತು ಏಕೆ",
    purposeLabel: "ಏಕೆ",
    enablesLabel: "ಇದರಿಂದ ಸಾಧ್ಯವಾಗುವುದು",
    items: [
      {
        data: "ನೀವು ನೋಡುವ ಪುಟದ ಮಾರ್ಗ (ಉದಾಹರಣೆಗೆ, ಮುಖಪುಟ ಅಥವಾ ಸಂಪರ್ಕ).",
        purpose: "ಜನರು ಯಾವ ಮಾಹಿತಿಯನ್ನು ನಿಜವಾಗಿ ಬಳಸುತ್ತಾರೆ ಎಂದು ತಿಳಿಯಲು.",
        enables: "ಸಾರ್ವಜನಿಕ ಜಾಲತಾಣವನ್ನು ಸುಧಾರಿಸುವುದು.",
      },
      {
        data: "ತಾತ್ಕಾಲಿಕ ಬ್ರೌಸರ್ ಸೆಷನ್ ಗುರುತು, ಇಡುವ ಮೊದಲು ಹ್ಯಾಶ್ ಮಾಡಲಾಗುತ್ತದೆ.",
        purpose: "ಒಂದು ಭೇಟಿಯ ಪುಟ ವೀಕ್ಷಣೆಗಳನ್ನು ಒಟ್ಟಿಗೆ ಇಡಲು, ನಿಮ್ಮ ಹೆಸರನ್ನು ಇಡದೆ.",
        enables: "ಪ್ರತ್ಯೇಕ ಕ್ಲಿಕ್‌ಗಳಲ್ಲದೆ ಒಂದು ಭೇಟಿಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವುದು.",
      },
      {
        data: "ನೆಟ್‌ವರ್ಕ್ ಮಾರ್ಗದಿಂದ ಸರಿಸುಮಾರು ಪ್ರದೇಶ ಅಥವಾ ದೇಶ. ನಗರವನ್ನು ಇಡುವುದಿಲ್ಲ.",
        purpose: "ತಾಣವನ್ನು ಎಲ್ಲಿಂದ ನೋಡಲಾಗುತ್ತಿದೆ ಎಂಬ ಒಟ್ಟಾರೆ ಚಿತ್ರ ಪಡೆಯಲು.",
        enables: "ಭಾಷೆ ಮತ್ತು ಶಾಖೆ ಮಾಹಿತಿಯನ್ನು ಯೋಜಿಸುವುದು.",
      },
      {
        data: "ಬಳಕೆದಾರ-ಏಜೆಂಟ್ ಪಠ್ಯದಿಂದ ತಿಳಿಯುವ ಸಾಧನ ಮತ್ತು ಬ್ರೌಸರ್ ಪ್ರಕಾರ.",
        purpose: "ಸಾಮಾನ್ಯ ಫೋನ್ ಮತ್ತು ಬ್ರೌಸರ್‌ಗಳಲ್ಲಿ ವಿನ್ಯಾಸ ತೊಂದರೆಗಳನ್ನು ಹಿಡಿಯಲು.",
        enables: "ಜನರು ಬಳಸುವ ಸಾಧನಗಳಲ್ಲಿ ತಾಣ ಓದಲು ಸುಲಭವಾಗಿರುವಂತೆ ಇಡುವುದು.",
      },
      {
        data: "ಕ್ಯಾಲ್ಕುಲೇಟರ್ ಮತ್ತು ಸಾಲದ ದರದ ಸ್ಥೂಲ ಬಳಕೆಯ ವ್ಯಾಪ್ತಿ — ನೀವು ಟೈಪ್ ಮಾಡಿದ ನಿಖರ ಗ್ರಾಂ ಅಥವಾ ರೂಪಾಯಿ ಅಲ್ಲ.",
        purpose: "ಸಾಲ ಅಂದಾಜು ಸಾಧನ ಉಪಯುಕ್ತವಾಗಿದೆಯೇ ಎಂದು ನೋಡಲು.",
        enables: "ಕ್ಯಾಲ್ಕುಲೇಟರ್ ಸುಧಾರಿಸುವುದು.",
      },
    ],
    notOnSiteHeading: "ಈ ಜಾಲತಾಣ ಸಂಗ್ರಹಿಸದಿರುವುದು",
    notOnSite:
      "ಈ ತಾಣದಲ್ಲಿ ಸಾಲ ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗುವುದಿಲ್ಲ. ಹೆಸರು, ಕೆವೈಸಿ ದಾಖಲೆಗಳು, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ, ಬ್ಯಾಂಕ್ ವಿವರಗಳು ಮತ್ತು ಚಿನ್ನದ ಆಭರಣ ವಿವರಗಳನ್ನು ನಮ್ಮ ಶಾಖೆಗಳಲ್ಲಿ, ಆ ಸಮಯದ ಪ್ರತ್ಯೇಕ ಸೂಚನೆಯೊಂದಿಗೆ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತದೆ.",
    rightsHeading: "ನಿಮ್ಮ ಆಯ್ಕೆಗಳು ಮತ್ತು ಹಕ್ಕುಗಳು",
    rights: [
      "ಈ ಸೂಚನೆಯನ್ನು ಓದಿದ ನಂತರ ಚೌಕವನ್ನು ಗುರುತಿಸಿ ಮತ್ತು «ನಾನು ಒಪ್ಪುತ್ತೇನೆ» ಒತ್ತಿ.",
      "ಜಾಲತಾಣದ ಅಡಿಟಿಪ್ಪಣಿಯಿಂದ ಯಾವಾಗ ಬೇಕಾದರೂ ಈ ಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಬಹುದು.",
      "ನಾವು ಇಟ್ಟಿರುವ ದತ್ತಾಂಶ ಏನು ಎಂದು ಕೇಳಿ, ತಿದ್ದಲು ಕೇಳಿ, ಅಥವಾ ಕಾನೂನು ಅನುಮತಿಸುವಲ್ಲಿ ಅಳಿಸಲು ಕೇಳಿ.",
      "ಕೆಳಗಿನ ದೂರು ನಿವಾರಣಾಧಿಕಾರಿಗೆ ಬರೆಯಿರಿ. ೩೦ ದಿನಗಳಲ್ಲಿ ಪರಿಹಾರವಾಗದಿದ್ದರೆ, ಭಾರತದ ದತ್ತಾಂಶ ಸಂರಕ್ಷಣಾ ಮಂಡಳಿಗೆ ದೂರು ಸಲ್ಲಿಸಬಹುದು.",
    ],
    officerHeading: "ದೂರು ನಿವಾರಣಾಧಿಕಾರಿ",
    officerIntro:
      "ವೈಯಕ್ತಿಕ ದತ್ತಾಂಶದ ಬಗ್ಗೆ ಪ್ರಶ್ನೆ ಅಥವಾ ದೂರಿಗೆ, ಇಲ್ಲಿ ಹೆಸರಿಸಿದ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    officerNameLabel: "ಹೆಸರು",
    officerRoleLabel: "ಹುದ್ದೆ",
    officerEmailLabel: "ಇಮೇಲ್",
    officerPhoneLabel: "ದೂರವಾಣಿ",
    officerAddressLabel: "ಕಛೇರಿ ವಿಳಾಸ",
    boardHeading: "ದತ್ತಾಂಶ ಸಂರಕ್ಷಣಾ ಮಂಡಳಿಗೆ ದೂರು",
    board:
      "೩೦ ದಿನಗಳಲ್ಲಿ ನಿಮ್ಮ ಆಕ್ಷೇಪಣೆ ಪರಿಹಾರವಾಗದಿದ್ದರೆ, ಡಿಜಿಟಲ್ ವೈಯಕ್ತಿಕ ದತ್ತಾಂಶ ಸಂರಕ್ಷಣಾ ಅಧಿನಿಯಮ, ೨೦೨೩ ರ ಅಡಿಯಲ್ಲಿ ಭಾರತದ ದತ್ತಾಂಶ ಸಂರಕ್ಷಣಾ ಮಂಡಳಿಗೆ ದೂರು ಸಲ್ಲಿಸಬಹುದು.",
    withdraw:
      "ಮತ್ತೆ ಒಪ್ಪಿಗೆ ದಾಖಲಿಸಲು ಈ ಪುಟಕ್ಕೆ ಬನ್ನಿ, ಚೌಕವನ್ನು ಗುರುತಿಸಿ, ಮತ್ತು «ನಾನು ಒಪ್ಪುತ್ತೇನೆ» ಒತ್ತಿ.",
    policyLink: "ಪೂರ್ಣ ಗೌಪ್ಯತಾ ನೀತಿ",
    checkboxLabel: "ನಾನು ಈ ಸೂಚನೆಯನ್ನು ಓದಿದ್ದೇನೆ",
    agree: "ನಾನು ಒಪ್ಪುತ್ತೇನೆ",
    agreedStatus: "ನೀವು ಈ ಸೂಚನೆಗೆ ಒಪ್ಪಿಗೆ ನೀಡಿದ್ದೀರಿ.",
  },
} as const satisfies Record<ConsentNoticeLanguage, ConsentNoticeCopy>;

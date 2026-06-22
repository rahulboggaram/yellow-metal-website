export type AppFeatureSlide = {
  id: string;
  title: string;
  subtitle?: string;
  footer?: string;
};

export const APP_FEATURE_SLIDES: AppFeatureSlide[] = [
  {
    id: "download-app",
    title: "Download Yellow Metal App",
  },
  {
    id: "interest-reminders",
    title: "Interest Reminders",
    subtitle:
      "You will receive 3 reminders before due. We don't want you to default your interests",
  },
  {
    id: "part-payments",
    title: "Part Payments",
    footer:
      "Make part payments at any time in the day & any day in the year in your Yellow Metal app",
  },
  {
    id: "part-release",
    title: "Part Release",
    subtitle:
      "Choose any jewellery to be released at any time of your choice",
  },
];

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.consumer.yellow_metal";

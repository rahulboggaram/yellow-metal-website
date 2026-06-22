export type AppFeatureSlide = {
  id: string;
  title: string;
  imageSrc: string;
  href?: string;
};

export const APP_FEATURE_SLIDES: AppFeatureSlide[] = [
  {
    id: "download-app",
    title: "Download Yellow Metal App",
    imageSrc: "/images/features/download-app.png",
    href: "https://play.google.com/store/apps/details?id=com.consumer.yellow_metal",
  },
  {
    id: "interest-reminders",
    title: "Interest Reminders",
    imageSrc: "/images/features/interest-reminders.png",
  },
  {
    id: "part-payments",
    title: "Part Payments",
    imageSrc: "/images/features/part-payments.png",
  },
  {
    id: "part-release",
    title: "Part Release",
    imageSrc: "/images/features/part-release.png",
  },
];

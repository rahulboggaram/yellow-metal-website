import { redirect } from "next/navigation";

export default function AnalyticsAdminRedirect() {
  redirect("/admin?tab=analytics");
}

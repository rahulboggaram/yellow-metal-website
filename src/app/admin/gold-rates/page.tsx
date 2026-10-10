import { redirect } from "next/navigation";

export default function GoldRatesAdminRedirect() {
  redirect("/admin?tab=gold-rates");
}

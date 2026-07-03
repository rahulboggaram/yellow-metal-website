import { redirect } from "next/navigation";

export default function LoanPlansAdminRedirect() {
  redirect("/admin?tab=loan-plans");
}

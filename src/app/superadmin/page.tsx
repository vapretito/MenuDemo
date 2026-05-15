import { redirect } from "next/navigation";

export default function LegacySuperadminPage() {
  redirect("/backoffice/login");
}

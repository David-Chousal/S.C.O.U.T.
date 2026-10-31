import type { Metadata } from "next";
import { ReportPrint } from "@/components/reports/report-print";

export const metadata: Metadata = { title: "Buoy report" };

// No shell: this page is for paper. It still needs a session, which the readings API checks.
export default function Page() {
  return <ReportPrint />;
}

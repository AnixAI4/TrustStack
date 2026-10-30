import Link from "next/link";
import { Can } from "@/lib/client/permissions";
import { QuestionBankBrowser } from "./question-bank-browser";

export const metadata = { title: "Question bank · TrustStack DPDP Compass" };

/**
 * The whole bank is Anix's working view (D-068, D-071). A client reads the
 * questions that apply to it on its own assessment — the black box.
 */
export default function QuestionsPage() {
  return (
    <Can
      permission="question.read_bank"
      fallback={
        <p data-testid="bank-not-available" className="text-sm text-slate-700">
          Your questions are on your{" "}
          <Link href="/dashboard/assessments" className="text-indigo-700 hover:underline">
            assessments
          </Link>
          : each one holds exactly the questions that apply to your organisation.
        </p>
      }
    >
      <QuestionBankBrowser />
    </Can>
  );
}

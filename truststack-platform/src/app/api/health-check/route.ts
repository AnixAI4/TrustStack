import { NextRequest, NextResponse } from "next/server";

interface HealthCheckAnswer {
  questionId: number;
  answer: "yes" | "no" | "partial";
}

const QUESTIONS = [
  { id: 1, area: "inventory", question: "Do you know what personal data you collect?" },
  { id: 2, area: "purpose", question: "Is the purpose for each data type documented?" },
  { id: 3, area: "storage", question: "Do you know where personal data is stored?" },
  { id: 4, area: "access", question: "Do you control who accesses personal data?" },
  { id: 5, area: "vendors", question: "Have you reviewed all vendor/processor relationships?" },
  { id: 6, area: "consent", question: "Is your consent valid, traceable, and withdrawable?" },
  { id: 7, area: "withdrawal", question: "Can users withdraw consent easily?" },
  { id: 8, area: "rights", question: "Can you handle access/correction/erasure requests?" },
  { id: 9, area: "breach", question: "Do you have a 72-hour breach notification plan?" },
  { id: 10, area: "ai", question: "Are your AI tools using personal data safely under DPDP?" },
  { id: 11, area: "evidence", question: "Can you prove your DPDP readiness to a regulator?" },
];

function calculateRisk(answers: HealthCheckAnswer[]) {
  const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));

  let riskScore = 0;
  const gaps: string[] = [];

  QUESTIONS.forEach((q) => {
    const answer = answerMap.get(q.id);
    if (answer === "no") {
      riskScore += 10;
      gaps.push(q.question);
    } else if (answer === "partial") {
      riskScore += 5;
    }
  });

  const unanswered = QUESTIONS.length - answers.length;
  riskScore += unanswered * 7; // Assume risk for unanswered questions

  const risk =
    riskScore >= 70 ? "critical" :
    riskScore >= 40 ? "high" :
    riskScore >= 20 ? "medium" : "low";

  const recommendations: Record<string, string> = {
    critical: "Immediate action required. Start with DPDP Compass™ Enterprise Assessment this week.",
    high: "High exposure. Book a DPDP Compass™ Standard Assessment within 30 days.",
    medium: "Moderate gaps. Consider DPDP Compass™ Starter to prioritize your remediation.",
    low: "Good foundation. A DPDP Build™ engagement will close remaining gaps efficiently.",
  };

  return {
    score: Math.min(riskScore, 100),
    risk,
    gapsCount: gaps.length,
    topRisks: gaps.slice(0, 5),
    recommendation: recommendations[risk],
    estimatedComplianceTimeline:
      risk === "critical" ? "12-18 months" :
      risk === "high" ? "9-12 months" :
      risk === "medium" ? "6-9 months" : "3-6 months",
  };
}

export async function POST(req: NextRequest) {
  try {
    const { answers } = await req.json();

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
    }

    const result = calculateRisk(answers);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Health check API error:", error);
    return NextResponse.json({ error: "Failed to process health check" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ questions: QUESTIONS });
}

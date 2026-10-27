export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface LeadFormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  employees: string;
  message?: string;
}

export interface HealthCheckAnswer {
  questionId: number;
  answer: "yes" | "no" | "partial";
}

export interface HealthCheckResult {
  score: number;
  risk: "low" | "medium" | "high" | "critical";
  topRisks: string[];
  recommendation: string;
}

export type Industry =
  | "bfsi"
  | "healthcare"
  | "edtech"
  | "saas"
  | "ecommerce"
  | "government"
  | "other";

export interface Service {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: string;
  features: string[];
  tier: "discover" | "implement" | "operate" | "certify";
  badge?: string;
  icon: string;
}

export interface Framework7DStep {
  step: number;
  letter: string;
  title: string;
  description: string;
  activities: string[];
  color: string;
}

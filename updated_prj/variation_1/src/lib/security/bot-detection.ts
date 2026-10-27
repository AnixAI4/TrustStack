/**
 * Bot detection and honeypot utilities.
 */

interface BotDetectionResult {
  isBot: boolean;
  score: number;
  reasons: string[];
}

/**
 * Analyze request headers for bot patterns
 */
export function detectBot(request: Request): BotDetectionResult {
  const reasons: string[] = [];
  let score = 0;

  const userAgent = request.headers.get("user-agent") || "";
  const acceptLanguage = request.headers.get("accept-language");
  const acceptEncoding = request.headers.get("accept-encoding");
  const accept = request.headers.get("accept");

  // No user agent
  if (!userAgent) {
    score += 30;
    reasons.push("Missing user agent");
  }

  // Known bot user agents
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /httpie/i,
    /postman/i,
    /insomnia/i,
  ];

  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      score += 20;
      reasons.push(`Bot-like user agent: ${pattern.source}`);
      break;
    }
  }

  // Missing common browser headers
  if (!acceptLanguage) {
    score += 10;
    reasons.push("Missing accept-language header");
  }

  if (!acceptEncoding) {
    score += 10;
    reasons.push("Missing accept-encoding header");
  }

  if (!accept) {
    score += 10;
    reasons.push("Missing accept header");
  }

  // Suspicious header combinations
  if (userAgent.includes("Chrome") && !userAgent.includes("AppleWebKit")) {
    score += 15;
    reasons.push("Inconsistent Chrome user agent");
  }

  // Very short user agent (likely spoofed)
  if (userAgent.length > 0 && userAgent.length < 30) {
    score += 15;
    reasons.push("Suspiciously short user agent");
  }

  // Very long user agent (could be an attack)
  if (userAgent.length > 500) {
    score += 20;
    reasons.push("Excessively long user agent");
  }

  return {
    isBot: score >= 30,
    score,
    reasons,
  };
}

/**
 * Honeypot field names to use in forms.
 * Bots often fill these hidden fields; real users won't.
 */
export const HONEYPOT_FIELDS = [
  "website",
  "url",
  "phone_number",
  "fax",
  "address2",
  "company_name",
] as const;

/**
 * Check if honeypot fields were filled (indicates bot)
 */
export function checkHoneypot(
  formData: Record<string, unknown>
): { isBot: boolean; filledField?: string } {
  for (const field of HONEYPOT_FIELDS) {
    const value = formData[field];
    if (value && typeof value === "string" && value.trim().length > 0) {
      return { isBot: true, filledField: field };
    }
  }
  return { isBot: false };
}

/**
 * Calculate request timing score.
 * Forms submitted too quickly are likely bots.
 */
export function checkFormTiming(
  formLoadTime: number,
  submitTime: number,
  minimumSeconds: number = 3
): { isBot: boolean; elapsed: number } {
  const elapsed = (submitTime - formLoadTime) / 1000;
  
  // If form was submitted in less than minimum time, likely a bot
  if (elapsed < minimumSeconds) {
    return { isBot: true, elapsed };
  }
  
  return { isBot: false, elapsed };
}

/**
 * Behavioral analysis for mouse/keyboard events.
 * Real users have varied interaction patterns.
 */
export interface BehaviorData {
  mouseMovements: number;
  keystrokes: number;
  scrollEvents: number;
  timeOnPage: number;
}

export function analyzeBehavior(data: BehaviorData): {
  isBot: boolean;
  score: number;
} {
  let score = 0;

  // No mouse movements at all
  if (data.mouseMovements === 0) {
    score += 20;
  }

  // No keystrokes in a form
  if (data.keystrokes === 0) {
    score += 20;
  }

  // No scroll events on a long page
  if (data.scrollEvents === 0 && data.timeOnPage > 5000) {
    score += 10;
  }

  // Too fast interaction
  if (data.timeOnPage < 1000 && data.keystrokes > 20) {
    score += 30; // Typing too fast
  }

  return {
    isBot: score >= 30,
    score,
  };
}

/**
 * Generate a unique fingerprint challenge.
 * Can be used to verify the client is a real browser.
 */
export function generateChallenge(): { challenge: string; expected: string } {
  const challenge = Math.random().toString(36).substring(2, 10);
  // Expected answer is the challenge reversed + length
  const expected = challenge.split("").reverse().join("") + challenge.length;
  return { challenge, expected };
}

/**
 * Verify challenge response
 */
export function verifyChallenge(
  challenge: string,
  response: string,
  expected: string
): boolean {
  return response === expected;
}

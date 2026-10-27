/**
 * Input validation and sanitization utilities for security.
 */

// Email validation regex (RFC 5322 compliant)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// URL validation
const URL_REGEX = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

// UUID validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(select|insert|update|delete|drop|create|alter|truncate|exec|execute|union|declare)\b)/gi,
  /(['";])/g,
  /(--|\|\||\/\*|\*\/)/g,
  /(\bor\b|\band\b)\s*[\d\w]*\s*[=<>]/gi,
];

// XSS patterns
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<form/gi,
  /data:/gi,
  /vbscript:/gi,
];

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.%2f/gi,
  /\.\.%5c/gi,
  /%2e%2e/gi,
  /\.\.\\/g,
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim().toLowerCase();
  
  if (!trimmed) {
    return { valid: false, error: "Email is required" };
  }
  
  if (trimmed.length > 254) {
    return { valid: false, error: "Email is too long" };
  }
  
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: "Invalid email format" };
  }
  
  return { valid: true, sanitized: trimmed };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: "Password is required" };
  }
  
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }
  
  if (password.length > 128) {
    return { valid: false, error: "Password is too long" };
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return { valid: false, error: "Password must contain at least one number" };
  }
  
  // Check for at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one letter" };
  }
  
  return { valid: true };
}

/**
 * Validate URL
 */
export function validateUrl(url: string): ValidationResult {
  const trimmed = url.trim();
  
  if (!trimmed) {
    return { valid: false, error: "URL is required" };
  }
  
  if (trimmed.length > 2048) {
    return { valid: false, error: "URL is too long" };
  }
  
  // Check for path traversal attempts
  for (const pattern of PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: "Invalid URL" };
    }
  }
  
  if (!URL_REGEX.test(trimmed)) {
    return { valid: false, error: "Invalid URL format" };
  }
  
  return { valid: true, sanitized: trimmed };
}

/**
 * Validate UUID
 */
export function validateUuid(uuid: string): ValidationResult {
  const trimmed = uuid.trim();
  
  if (!UUID_REGEX.test(trimmed)) {
    return { valid: false, error: "Invalid ID format" };
  }
  
  return { valid: true, sanitized: trimmed.toLowerCase() };
}

/**
 * Check for SQL injection attempts
 */
export function hasSqlInjection(input: string): boolean {
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return true;
    }
  }
  return false;
}

/**
 * Check for XSS attempts
 */
export function hasXssAttempt(input: string): boolean {
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(input)) {
      return true;
    }
  }
  return false;
}

/**
 * Sanitize string input (remove dangerous characters)
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== "string") return "";
  
  return input
    .trim()
    .slice(0, maxLength)
    // Remove null bytes
    .replace(/\0/g, "")
    // Encode HTML entities
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Validate and sanitize generic text input
 */
export function validateInput(
  input: unknown,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    allowHtml?: boolean;
  } = {}
): ValidationResult {
  const {
    required = true,
    minLength = 0,
    maxLength = 10000,
    pattern,
    allowHtml = false,
  } = options;

  if (input === null || input === undefined || input === "") {
    if (required) {
      return { valid: false, error: "This field is required" };
    }
    return { valid: true, sanitized: "" };
  }

  if (typeof input !== "string") {
    return { valid: false, error: "Invalid input type" };
  }

  const trimmed = input.trim();

  if (trimmed.length < minLength) {
    return { valid: false, error: `Must be at least ${minLength} characters` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `Must be no more than ${maxLength} characters` };
  }

  // Check for injection attempts
  if (hasSqlInjection(trimmed)) {
    return { valid: false, error: "Invalid characters detected" };
  }

  if (!allowHtml && hasXssAttempt(trimmed)) {
    return { valid: false, error: "Invalid characters detected" };
  }

  if (pattern && !pattern.test(trimmed)) {
    return { valid: false, error: "Invalid format" };
  }

  const sanitized = allowHtml ? trimmed : sanitizeString(trimmed, maxLength);
  
  return { valid: true, sanitized };
}

/**
 * Validate request body structure
 */
export function validateRequestBody<T extends Record<string, unknown>>(
  body: unknown,
  requiredFields: (keyof T)[]
): { valid: boolean; error?: string; data?: T } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const data = body as Record<string, unknown>;
  
  for (const field of requiredFields) {
    if (!(field in data) || data[field as string] === undefined || data[field as string] === null) {
      return { valid: false, error: `Missing required field: ${String(field)}` };
    }
  }

  return { valid: true, data: data as T };
}

/**
 * Validate Razorpay payment signature format
 */
export function validatePaymentSignature(signature: string): ValidationResult {
  // Razorpay signatures are 64 character hex strings
  if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) {
    return { valid: false, error: "Invalid payment signature" };
  }
  return { valid: true, sanitized: signature.toLowerCase() };
}

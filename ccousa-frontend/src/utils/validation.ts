/**
 * Validation utilities
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validatePhone(phone: string): boolean {
  const regex = /^(\+237|237)?[6-9]\d{8}$/;
  return regex.test(phone.replace(/\s/g, ''));
}

export function validateRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function validateMinLength(value: string, min: number): boolean {
  return value.length >= min;
}

export function validateMaxLength(value: string, max: number): boolean {
  return value.length <= max;
}

export function validateRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateCode(code: string): boolean {
  const regex = /^[A-Z][A-Z0-9_]{2,49}$/;
  return regex.test(code);
}

export function validateColor(color: string): boolean {
  const regex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return regex.test(color);
}

export function validateTime(time: string): boolean {
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return regex.test(time);
}

export function validateDate(date: string): boolean {
  const d = new Date(date);
  return !isNaN(d.getTime());
}

export type ValidationRule = {
  validator: (value: unknown, formData?: Record<string, unknown>) => boolean;
  message: string;
};

export type ValidationSchema = Record<string, ValidationRule[]>;

export function validate(
  data: Record<string, unknown>,
  schema: ValidationSchema
): ValidationResult {
  const errors: Record<string, string> = {};

  for (const [field, rules] of Object.entries(schema)) {
    for (const rule of rules) {
      if (!rule.validator(data[field], data)) {
        errors[field] = rule.message;
        break;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// Common validation schemas
export const commonRules = {
  required: (message = 'Ce champ est requis'): ValidationRule => ({
    validator: validateRequired,
    message,
  }),
  email: (message = 'Email invalide'): ValidationRule => ({
    validator: (v) => !v || validateEmail(String(v)),
    message,
  }),
  phone: (message = 'Numéro de téléphone invalide'): ValidationRule => ({
    validator: (v) => !v || validatePhone(String(v)),
    message,
  }),
  minLength: (min: number, message?: string): ValidationRule => ({
    validator: (v) => !v || validateMinLength(String(v), min),
    message: message || `Minimum ${min} caractères`,
  }),
  maxLength: (max: number, message?: string): ValidationRule => ({
    validator: (v) => !v || validateMaxLength(String(v), max),
    message: message || `Maximum ${max} caractères`,
  }),
  code: (message = 'Code invalide (majuscules, chiffres, underscores)'): ValidationRule => ({
    validator: (v) => !v || validateCode(String(v)),
    message,
  }),
  color: (message = 'Couleur invalide (format #RRGGBB)'): ValidationRule => ({
    validator: (v) => !v || validateColor(String(v)),
    message,
  }),
  time: (message = 'Heure invalide (format HH:MM)'): ValidationRule => ({
    validator: (v) => !v || validateTime(String(v)),
    message,
  }),
};

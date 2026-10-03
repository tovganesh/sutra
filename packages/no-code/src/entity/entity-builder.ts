/**
 * Sutra No-Code Dynamic Entity Modeler
 * Allows non-technical business users or admins to design custom data entities,
 * relationships, and validations without touching SQL or restarting services.
 */

export type FieldType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'boolean'
  | 'select'
  | 'multi-select'
  | 'relation'
  | 'attachment'
  | 'formula';

export interface EntityFieldDefinition {
  name: string;             // programmatic key (e.g. 'warrantyPeriodMonths')
  label: string;            // human readable label (e.g. 'Warranty Period (Months)')
  type: FieldType;
  required?: boolean;
  defaultValue?: unknown;
  options?: string[];       // for 'select' or 'multi-select'
  relationTargetSlug?: string; // target entity slug for 'relation'
  formulaExpression?: string;  // e.g. "quantity * unit_price"
  min?: number;
  max?: number;
  pattern?: string;         // regex validation pattern
}

export interface EntitySchemaDefinition {
  name: string;             // Human readable, e.g. "Fleet Vehicle Management"
  slug: string;             // URL-safe unique slug, e.g. "fleet_vehicles"
  description?: string;
  icon?: string;            // Icon name (e.g. 'truck', 'box', 'wrench')
  fields: EntityFieldDefinition[];
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export class EntityValidator {
  /**
   * Validates a record payload against the dynamic entity definition.
   */
  public static validateRecord(
    schema: EntitySchemaDefinition,
    recordData: Record<string, unknown>
  ): { valid: boolean; issues: ValidationIssue[] } {
    const issues: ValidationIssue[] = [];

    for (const field of schema.fields) {
      const val = recordData[field.name];

      // 1. Required check
      if (field.required && (val === undefined || val === null || val === '')) {
        issues.push({
          field: field.name,
          message: `${field.label} is required.`,
        });
        continue;
      }

      if (val === undefined || val === null) {
        continue;
      }

      // 2. Type checks
      switch (field.type) {
        case 'number':
        case 'currency':
          if (typeof val !== 'number' || isNaN(val)) {
            issues.push({ field: field.name, message: `${field.label} must be a valid number.` });
          } else {
            if (field.min !== undefined && val < field.min) {
              issues.push({ field: field.name, message: `${field.label} cannot be less than ${field.min}.` });
            }
            if (field.max !== undefined && val > field.max) {
              issues.push({ field: field.name, message: `${field.label} cannot exceed ${field.max}.` });
            }
          }
          break;

        case 'boolean':
          if (typeof val !== 'boolean') {
            issues.push({ field: field.name, message: `${field.label} must be true or false.` });
          }
          break;

        case 'date':
          if (typeof val !== 'string' || isNaN(Date.parse(val))) {
            issues.push({ field: field.name, message: `${field.label} must be a valid date (YYYY-MM-DD).` });
          }
          break;

        case 'select':
          if (field.options && !field.options.includes(String(val))) {
            issues.push({
              field: field.name,
              message: `${field.label} value '${val}' is not in allowed options: ${field.options.join(', ')}.`,
            });
          }
          break;

        case 'text':
          if (field.pattern && typeof val === 'string') {
            const re = new RegExp(field.pattern);
            if (!re.test(val)) {
              issues.push({ field: field.name, message: `${field.label} does not match required format.` });
            }
          }
          break;
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Validates a schema definition for structural integrity and slug safety.
   */
  public static validateSchema(schema: EntitySchemaDefinition): { valid: boolean; issues: ValidationIssue[] } {
    const issues: ValidationIssue[] = [];

    if (!schema.name || typeof schema.name !== 'string' || schema.name.trim().length === 0) {
      issues.push({ field: 'name', message: 'Entity name is required.' });
    }

    if (!schema.slug || typeof schema.slug !== 'string' || !/^[a-z0-9_-]+$/.test(schema.slug)) {
      issues.push({ field: 'slug', message: 'Entity slug must only contain lowercase alphanumeric characters, dashes, and underscores.' });
    }

    if (!schema.fields || !Array.isArray(schema.fields) || schema.fields.length === 0) {
      issues.push({ field: 'fields', message: 'Entity must contain at least one field definition.' });
    } else {
      const seenNames = new Set<string>();
      for (const field of schema.fields) {
        if (!field.name || typeof field.name !== 'string' || !/^[a-zA-Z0-9_]+$/.test(field.name)) {
          issues.push({ field: 'fields', message: `Invalid field key '${field.name}'. Must be alphanumeric.` });
        } else if (seenNames.has(field.name)) {
          issues.push({ field: 'fields', message: `Duplicate field key '${field.name}' found in schema.` });
        } else {
          seenNames.add(field.name);
        }

        if (!field.label || typeof field.label !== 'string') {
          issues.push({ field: 'fields', message: `Field '${field.name}' requires a human-readable label.` });
        }

        if (field.type === 'select' && (!field.options || field.options.length === 0)) {
          issues.push({ field: 'fields', message: `Select field '${field.name}' must have at least one option.` });
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}


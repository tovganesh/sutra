/**
 * Indian GSTIN (Goods and Services Tax Identification Number) Validation Engine
 * Implements structure validation and Modulo 36 checksum calculation.
 */

export const INDIAN_STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
};

const CHAR_SET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export interface GSTINValidationResult {
  isValid: boolean;
  stateCode?: string;
  stateName?: string;
  pan?: string;
  entityNumber?: string;
  errorMessage?: string;
}

export class GSTINValidator {
  /**
   * Validates a 15-character Indian GSTIN with format regex and Modulo 36 checksum.
   */
  public static validate(gstin: string): GSTINValidationResult {
    if (!gstin) {
      return { isValid: false, errorMessage: 'GSTIN is empty' };
    }

    const clean = gstin.trim().toUpperCase();

    // Regex check: 2 digits + 5 alpha + 4 digits + 1 alpha + 1 alpha/digit + 'Z' + 1 alpha/digit
    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!regex.test(clean)) {
      return { isValid: false, errorMessage: 'Invalid GSTIN structure or pattern format' };
    }

    const stateCode = clean.substring(0, 2);
    const stateName = INDIAN_STATE_CODES[stateCode];
    if (!stateName) {
      return { isValid: false, errorMessage: `Unknown Indian State/UT code: ${stateCode}` };
    }

    const pan = clean.substring(2, 12);
    const entityNumber = clean.substring(12, 13);

    // Modulo 36 Checksum Validation
    const expectedChecksum = this.calculateChecksum(clean.substring(0, 14));
    const actualChecksum = clean[14];

    if (expectedChecksum !== actualChecksum) {
      return {
        isValid: false,
        errorMessage: `GSTIN checksum mismatch (expected ${expectedChecksum}, got ${actualChecksum})`,
      };
    }

    return {
      isValid: true,
      stateCode,
      stateName,
      pan,
      entityNumber,
    };
  }

  /**
   * Computes the 15th character Modulo 36 checksum.
   */
  public static calculateChecksum(input14: string): string {
    let sum = 0;
    for (let i = 0; i < 14; i++) {
      const char = input14[i];
      let val = CHAR_SET.indexOf(char);
      const factor = (i % 2 === 0) ? 1 : 2;
      let product = val * factor;
      const quotient = Math.floor(product / 36);
      const remainder = product % 36;
      sum += quotient + remainder;
    }

    const remainderTotal = sum % 36;
    const checkValue = (36 - remainderTotal) % 36;
    return CHAR_SET[checkValue];
  }
}

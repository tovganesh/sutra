import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  EntityValidator,
} from '../packages/no-code/dist/index.js';
import {
  sampleAssetEntity,
  sampleFleetEntity,
  sampleITEntity,
} from '../apps/api/dist/helpers/store.helper.js';

describe('Sutra No-Code Dynamic Entity & Schema Modeler Suite', () => {
  describe('1. Schema Validation Rules (EntityValidator.validateSchema)', () => {
    test('validates valid enterprise entity schema definitions', () => {
      const validSchema = {
        name: 'Warehouse Storage Bins',
        slug: 'warehouse_bins',
        description: 'Physical bin locations, rack capacity, and zone topology',
        icon: 'package',
        fields: [
          { name: 'binCode', label: 'Storage Bin Identifier', type: 'text', required: true },
          { name: 'maxWeightCapacityKg', label: 'Max Weight Capacity (kg)', type: 'number', required: true, min: 10 },
          { name: 'isHazardousPermitted', label: 'Hazardous Materials Permitted', type: 'boolean', required: true },
          { name: 'zoneClassification', label: 'Zone Classification', type: 'select', options: ['COLD_STORAGE', 'AMBIENT', 'HIGH_BAY'], required: true },
        ],
      };

      const result = EntityValidator.validateSchema(validSchema);
      assert.equal(result.valid, true);
      assert.equal(result.issues.length, 0);
    });

    test('rejects schema with empty entity name', () => {
      const invalid = {
        name: '   ',
        slug: 'invalid_name',
        fields: [{ name: 'f1', label: 'Field 1', type: 'text' }],
      };
      const result = EntityValidator.validateSchema(invalid);
      assert.equal(result.valid, false);
      assert.ok(result.issues.some((i) => i.field === 'name'));
    });

    test('rejects schema with invalid slug syntax (spaces, uppercase, special symbols)', () => {
      const invalidSlugs = ['Invalid Slug', 'test@schema', 'UPPERCASE_SLUG', 'bad.slug!'];
      for (const slug of invalidSlugs) {
        const schema = {
          name: 'Test Entity',
          slug,
          fields: [{ name: 'f1', label: 'Field 1', type: 'text' }],
        };
        const result = EntityValidator.validateSchema(schema);
        assert.equal(result.valid, false, `Slug '${slug}' should be rejected`);
        assert.ok(result.issues.some((i) => i.field === 'slug'));
      }
    });

    test('rejects schema with empty fields definition', () => {
      const schema = {
        name: 'Empty Schema',
        slug: 'empty_schema',
        fields: [],
      };
      const result = EntityValidator.validateSchema(schema);
      assert.equal(result.valid, false);
      assert.ok(result.issues.some((i) => i.field === 'fields'));
    });

    test('rejects schema with duplicate field keys', () => {
      const schema = {
        name: 'Duplicate Field Schema',
        slug: 'dup_fields',
        fields: [
          { name: 'serialNumber', label: 'Serial Number', type: 'text' },
          { name: 'serialNumber', label: 'Duplicate Serial Key', type: 'text' },
        ],
      };
      const result = EntityValidator.validateSchema(schema);
      assert.equal(result.valid, false);
      assert.ok(result.issues.some((i) => i.message.includes('Duplicate field key')));
    });

    test('rejects select field with no options provided', () => {
      const schema = {
        name: 'No Options Select Schema',
        slug: 'no_options',
        fields: [
          { name: 'status', label: 'Status', type: 'select', options: [] },
        ],
      };
      const result = EntityValidator.validateSchema(schema);
      assert.equal(result.valid, false);
      assert.ok(result.issues.some((i) => i.message.includes('must have at least one option')));
    });
  });

  describe('2. Record Validation Rules (EntityValidator.validateRecord)', () => {
    const testSchema = {
      name: 'Laboratory Equipment Register',
      slug: 'lab_equipment',
      fields: [
        { name: 'assetTag', label: 'Asset Tag', type: 'text', required: true, pattern: '^LAB-[0-9]{4}$' },
        { name: 'temperatureRange', label: 'Operating Temp (C)', type: 'number', required: true, min: -80, max: 200 },
        { name: 'purchaseCost', label: 'Equipment Cost', type: 'currency', required: true, min: 500 },
        { name: 'commissioningDate', label: 'Commissioning Date', type: 'date', required: true },
        { name: 'isCalibrated', label: 'Calibrated & Certified', type: 'boolean', required: true },
        { name: 'safetyGrade', label: 'Safety Grade', type: 'select', options: ['GRADE_1', 'GRADE_2', 'GRADE_3'], required: true },
      ],
    };

    test('passes valid record with all matching types and constraints', () => {
      const validRecord = {
        assetTag: 'LAB-4401',
        temperatureRange: -20,
        purchaseCost: 250000,
        commissioningDate: '2026-05-15',
        isCalibrated: true,
        safetyGrade: 'GRADE_1',
      };
      const result = EntityValidator.validateRecord(testSchema, validRecord);
      assert.equal(result.valid, true);
      assert.equal(result.issues.length, 0);
    });

    test('flags missing required fields', () => {
      const invalid = {
        assetTag: 'LAB-4401',
        // missing temperatureRange, purchaseCost, commissioningDate, isCalibrated, safetyGrade
      };
      const result = EntityValidator.validateRecord(testSchema, invalid);
      assert.equal(result.valid, false);
      assert.equal(result.issues.length, 5);
    });

    test('enforces numeric and currency min/max boundaries', () => {
      const invalid = {
        assetTag: 'LAB-4401',
        temperatureRange: -120, // less than min (-80)
        purchaseCost: 100, // less than min (500)
        commissioningDate: '2026-05-15',
        isCalibrated: true,
        safetyGrade: 'GRADE_2',
      };
      const result = EntityValidator.validateRecord(testSchema, invalid);
      assert.equal(result.valid, false);
      assert.ok(result.issues.some((i) => i.field === 'temperatureRange' && i.message.includes('cannot be less than -80')));
      assert.ok(result.issues.some((i) => i.field === 'purchaseCost' && i.message.includes('cannot be less than 500')));
    });

    test('enforces date string format', () => {
      const invalid = {
        assetTag: 'LAB-4401',
        temperatureRange: 25,
        purchaseCost: 15000,
        commissioningDate: 'not-a-valid-date',
        isCalibrated: false,
        safetyGrade: 'GRADE_3',
      };
      const result = EntityValidator.validateRecord(testSchema, invalid);
      assert.equal(result.valid, false);
      assert.ok(result.issues.some((i) => i.field === 'commissioningDate'));
    });

    test('enforces boolean type checking', () => {
      const invalid = {
        assetTag: 'LAB-4401',
        temperatureRange: 25,
        purchaseCost: 15000,
        commissioningDate: '2026-05-15',
        isCalibrated: 'yes-it-is', // string instead of boolean
        safetyGrade: 'GRADE_3',
      };
      const result = EntityValidator.validateRecord(testSchema, invalid);
      assert.equal(result.valid, false);
      assert.ok(result.issues.some((i) => i.field === 'isCalibrated'));
    });

    test('enforces select option whitelist', () => {
      const invalid = {
        assetTag: 'LAB-4401',
        temperatureRange: 25,
        purchaseCost: 15000,
        commissioningDate: '2026-05-15',
        isCalibrated: true,
        safetyGrade: 'INVALID_GRADE_9',
      };
      const result = EntityValidator.validateRecord(testSchema, invalid);
      assert.equal(result.valid, false);
      assert.ok(result.issues.some((i) => i.field === 'safetyGrade' && i.message.includes('is not in allowed options')));
    });

    test('enforces text regex pattern matching', () => {
      const invalid = {
        assetTag: 'INVALID-TAG-XYZ', // does not match ^LAB-[0-9]{4}$
        temperatureRange: 25,
        purchaseCost: 15000,
        commissioningDate: '2026-05-15',
        isCalibrated: true,
        safetyGrade: 'GRADE_1',
      };
      const result = EntityValidator.validateRecord(testSchema, invalid);
      assert.equal(result.valid, false);
      assert.ok(result.issues.some((i) => i.field === 'assetTag' && i.message.includes('does not match required format')));
    });
  });

  describe('3. Pre-Seeded Enterprise Schemas & Parity', () => {
    test('validates pre-seeded Plant & Heavy Machinery schema', () => {
      const result = EntityValidator.validateSchema(sampleAssetEntity);
      assert.equal(result.valid, true);
      assert.equal(sampleAssetEntity.slug, 'plant_machinery');
      assert.ok(sampleAssetEntity.fields.length >= 6);
    });

    test('validates pre-seeded Fleet Logistics & Commercial Vehicles schema', () => {
      const result = EntityValidator.validateSchema(sampleFleetEntity);
      assert.equal(result.valid, true);
      assert.equal(sampleFleetEntity.slug, 'fleet_vehicles');
      assert.ok(sampleFleetEntity.fields.some((f) => f.name === 'vehicleRegNumber'));
      assert.ok(sampleFleetEntity.fields.some((f) => f.name === 'odometerKm'));
    });

    test('validates pre-seeded Enterprise IT Infrastructure & Assets schema', () => {
      const result = EntityValidator.validateSchema(sampleITEntity);
      assert.equal(result.valid, true);
      assert.equal(sampleITEntity.slug, 'it_hardware_assets');
      assert.ok(sampleITEntity.fields.some((f) => f.name === 'assetCode'));
      assert.ok(sampleITEntity.fields.some((f) => f.name === 'ipAddress'));
      assert.ok(sampleITEntity.fields.some((f) => f.name === 'isProduction'));
    });
  });
});

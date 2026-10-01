import { Request, Response } from 'express';
import { HttpStatus } from '@sutra/core';
import { EntitySchemaDefinition, EntityValidator } from '@sutra/no-code';
import { inMemoryEntities, inMemoryRecords } from '../helpers/store.helper';
import { sendError } from '../helpers/response.helper';
import { tReq } from '../helpers/i18n.helper';

export class NoCodeController {
  public static getSchemas(req: Request, res: Response) {
    res.json(Array.from(inMemoryEntities.values()));
  }

  public static createSchema(req: Request, res: Response) {
    const schema: EntitySchemaDefinition = req.body;
    if (!schema.name || !schema.slug || !schema.fields) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'InvalidSchemaFormat', 'nocode.schemaFormatInvalid');
    }

    inMemoryEntities.set(schema.slug, schema);
    if (!inMemoryRecords.has(schema.slug)) {
      inMemoryRecords.set(schema.slug, []);
    }

    res.status(HttpStatus.CREATED).json({
      message: tReq(req, 'nocode.entityCreatedSuccess'),
      schema,
    });
  }

  public static getRecords(req: Request, res: Response) {
    const slug = req.params.slug as string;
    const records = inMemoryRecords.get(slug) || [];
    res.json({ entitySlug: slug, count: records.length, records });
  }

  public static async createRecord(req: Request, res: Response) {
    const slug = req.params.slug as string;
    const schema = inMemoryEntities.get(slug);

    if (!schema) {
      return res.status(HttpStatus.NOT_FOUND).json({
        error: tReq(req, 'nocode.entityNotFound', { slug }),
      });
    }

    const recordData = req.body;
    const validation = EntityValidator.validateRecord(schema, recordData);

    if (!validation.valid) {
      return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
        error: tReq(req, 'nocode.validationFailed'),
        issues: validation.issues,
      });
    }

    const newRecord = {
      id: `rec-${Date.now()}`,
      ...recordData,
      createdAt: new Date().toISOString(),
    };

    const records = inMemoryRecords.get(slug) || [];
    records.push(newRecord);
    inMemoryRecords.set(slug, records);

    res.status(HttpStatus.CREATED).json({
      message: tReq(req, 'nocode.recordSavedSuccess'),
      record: newRecord,
    });
  }
}

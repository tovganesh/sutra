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

  public static getSchema(req: Request, res: Response) {
    const slug = req.params.slug as string;
    const schema = inMemoryEntities.get(slug);
    if (!schema) {
      return res.status(HttpStatus.NOT_FOUND).json({
        error: tReq(req, 'nocode.entityNotFound', { slug }),
      });
    }
    res.json(schema);
  }

  public static createSchema(req: Request, res: Response) {
    const schema: EntitySchemaDefinition = req.body;
    const validation = EntityValidator.validateSchema(schema);
    if (!validation.valid) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        error: tReq(req, 'nocode.schemaFormatInvalid'),
        issues: validation.issues,
      });
    }

    if (inMemoryEntities.has(schema.slug)) {
      return sendError(req, res, HttpStatus.CONFLICT, 'SchemaConflict', `Entity with slug '${schema.slug}' already exists.`);
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

  public static addFieldToSchema(req: Request, res: Response) {
    const slug = req.params.slug as string;
    const schema = inMemoryEntities.get(slug);
    if (!schema) {
      return res.status(HttpStatus.NOT_FOUND).json({
        error: tReq(req, 'nocode.entityNotFound', { slug }),
      });
    }

    const newField = req.body;
    if (!newField.name || !newField.label || !newField.type) {
      return sendError(req, res, HttpStatus.BAD_REQUEST, 'InvalidFieldPayload', 'Field requires name, label, and type.');
    }

    if (schema.fields.some((f) => f.name === newField.name)) {
      return sendError(req, res, HttpStatus.CONFLICT, 'DuplicateFieldKey', `Field key '${newField.name}' already exists.`);
    }

    schema.fields.push(newField);
    inMemoryEntities.set(slug, schema);

    res.status(HttpStatus.CREATED).json({
      message: 'Field added to schema successfully.',
      schema,
      field: newField,
    });
  }

  public static deleteSchema(req: Request, res: Response) {
    const slug = req.params.slug as string;
    if (!inMemoryEntities.has(slug)) {
      return res.status(HttpStatus.NOT_FOUND).json({
        error: tReq(req, 'nocode.entityNotFound', { slug }),
      });
    }

    inMemoryEntities.delete(slug);
    inMemoryRecords.delete(slug);

    res.json({
      message: `Schema '${slug}' and all associated records deleted successfully.`,
      slug,
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
      id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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

  public static updateRecord(req: Request, res: Response) {
    const slug = req.params.slug as string;
    const recordId = req.params.id as string;
    const schema = inMemoryEntities.get(slug);

    if (!schema) {
      return res.status(HttpStatus.NOT_FOUND).json({
        error: tReq(req, 'nocode.entityNotFound', { slug }),
      });
    }

    const records = inMemoryRecords.get(slug) || [];
    const index = records.findIndex((r) => r.id === recordId);
    if (index === -1) {
      return sendError(req, res, HttpStatus.NOT_FOUND, 'RecordNotFound', `Record with ID '${recordId}' not found.`);
    }

    const updatedData = { ...records[index], ...req.body, id: recordId };
    const validation = EntityValidator.validateRecord(schema, updatedData);
    if (!validation.valid) {
      return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
        error: tReq(req, 'nocode.validationFailed'),
        issues: validation.issues,
      });
    }

    records[index] = updatedData;
    inMemoryRecords.set(slug, records);

    res.json({
      message: 'Record updated successfully.',
      record: updatedData,
    });
  }

  public static deleteRecord(req: Request, res: Response) {
    const slug = req.params.slug as string;
    const recordId = req.params.id as string;

    const records = inMemoryRecords.get(slug);
    if (!records) {
      return res.status(HttpStatus.NOT_FOUND).json({
        error: tReq(req, 'nocode.entityNotFound', { slug }),
      });
    }

    const index = records.findIndex((r) => r.id === recordId);
    if (index === -1) {
      return sendError(req, res, HttpStatus.NOT_FOUND, 'RecordNotFound', `Record with ID '${recordId}' not found.`);
    }

    records.splice(index, 1);
    inMemoryRecords.set(slug, records);

    res.json({
      message: 'Record deleted successfully.',
      recordId,
      slug,
    });
  }
}

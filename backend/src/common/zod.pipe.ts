import type { PipeTransform } from '@nestjs/common';
import type { z } from 'zod';
import { ApiError } from './api-error.js';

/** Validates and cleans a request body / query; the first problem becomes the error message. */
export class ZodPipe<T extends z.ZodType> implements PipeTransform<unknown, z.output<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.output<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const fieldErrors = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      throw ApiError.badRequest(fieldErrors[0]?.message || 'Invalid request', fieldErrors);
    }
    return result.data;
  }
}

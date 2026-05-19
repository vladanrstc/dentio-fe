import { HttpErrorResponse } from '@angular/common/http';

import { CollectionResponse, ItemResponse } from '../models/api.models';

export function extractValidationErrors(error: HttpErrorResponse): string[] {
  const response = error.error as { message?: string; errors?: Record<string, string[]> } | null;

  if (!response?.errors) {
    return response?.message ? [response.message] : [];
  }

  return Object.values(response.errors).flat();
}

export function unwrapCollection<T>(response: CollectionResponse<T>): T[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data.data;
}

export function unwrapItem<T>(response: ItemResponse<T>): T {
  if (typeof response === 'object' && response !== null && 'data' in response) {
    return response.data;
  }

  return response;
}

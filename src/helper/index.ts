import type { PrivitiveType } from '@/types';

export const DEFAULT_OPTION = { cache: true };

export function makeDisplayProxyValue<T>(depty: number, value: object) {
  if (depty === 1) {
    return (Array.isArray(value) ? ['value'] : { value: '..' }) as T;
  }

  return value;
}

export function isPrimitiveType(
  orignalValue: unknown
): orignalValue is PrivitiveType {
  const isObjectTypeValue =
    typeof orignalValue === 'object' && orignalValue !== null;

  return !isObjectTypeValue;
}

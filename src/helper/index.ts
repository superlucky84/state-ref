import type { PrivitiveType } from '@/types';

export const DEFAULT_OPTION = { cache: true };

export function makeDisplayProxyValue(depthList: string[], value: object) {
  return {
    _navi: depthList.join('.'),
    _type: Array.isArray(value) ? 'Array' : 'Object',
    _value: '..',
  };
}

export function isPrimitiveType(
  orignalValue: unknown
): orignalValue is PrivitiveType {
  const isObjectTypeValue =
    typeof orignalValue === 'object' && orignalValue !== null;

  return !isObjectTypeValue;
}

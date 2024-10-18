import type { PrivitiveType, Copyable } from '@/types';
import type { Lens } from '@/lens';
import { lens } from '@/lens';

export const DEFAULT_WATCH_OPTION = { cache: true, editable: true };
export const DEFAULT_CREATE_OPTION = { autoSync: true };

/**
 * Create information about the proxy that can be viewed in the developer console.
 */
export function makeDisplayProxyValue(depthList: string[], value: unknown) {
  return {
    _navi: depthList.join('.'),
    _type: getType(value),
    _value: '..',
  };
}

function getType(value: unknown) {
  if (value === null) {
    return 'null';
  } else if (Array.isArray(value)) {
    return 'array';
  } else if (typeof value === 'object') {
    return 'object';
  } else {
    return typeof value;
  }
}

/**
 * When createStore receives the initial value, it checks to see if it is of a primitive type.
 */
export function isPrimitiveType(
  orignalValue: unknown
): orignalValue is PrivitiveType {
  const isObjectTypeValue =
    typeof orignalValue === 'object' && orignalValue !== null;

  return !isObjectTypeValue;
}

/**
 * We provide a convenience utility to make it easy to create data when "copyOnWrite" is required.
 */
export function copyable<T extends { [key: string | symbol]: unknown }>(
  origObj: T,
  lensInit?: Lens<T, T>
): Copyable<T> {
  let lensIns = lensInit || lens();

  return new Proxy(origObj as unknown as Copyable<T>, {
    get(target: Copyable<T>, prop: keyof T) {
      if (prop === 'writeCopy') {
        return (value: T) => {
          return lensIns.set(value)(target as unknown as T); // 원본 코드는 변경되지 않음
        };
      }

      return copyable(origObj, lensIns.k(prop) as any);
    },
    set() {
      throw new Error(
        'Property modification is not supported on a copyable object. Use "writeCopy" for state updates.'
      );
    },
  });
}

/**
 * Provides a convenience utility to make deep copying easier in special cases.
 */
export function cloneDeep<T>(value: T): T {
  if (value == null) {
    return value;
  }

  if (typeof value !== 'object') {
    return value;
  }

  const isArray = Array.isArray(value);
  const Ctor = isArray ? Array : Object;

  const result = new Ctor() as T; // 새로운 객체 또는 배열 생성

  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      result[key] = cloneDeep(value[key]); // 재귀적으로 깊은 복사
    }
  }

  return result;
}

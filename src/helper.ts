export const makeDisplayProxyValue = <T>(depty: number, value: object) => {
  if (depty === 1) {
    return (
      Array.isArray(value) ? value.map(() => '..') : { value: '..' }
    ) as T;
  }

  return value;
};

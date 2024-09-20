export const computed = <T>(
  value: () => T
): {
  value: T;
  v: T;
} => {
  let result = value;

  return {
    get value() {
      return result();
    },
    get v() {
      return result();
    },
    set value(_newValue: T) {
      throw new Error(`You can't change 'computed'`);
    },
    set v(_newValue: T) {
      throw new Error(`You can't change 'computed'`);
    },
  };
};

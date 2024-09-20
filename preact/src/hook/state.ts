export const state = <T>(
  value: T,
  renew: () => boolean
): {
  value: T;
  v: T;
} => {
  let result = value;

  return {
    get value() {
      return result;
    },
    get v() {
      return result;
    },
    set value(newValue: T) {
      result = newValue;
      renew();
    },
    set v(newValue: T) {
      result = newValue;
      renew();
    },
  };
};

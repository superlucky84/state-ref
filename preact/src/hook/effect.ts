import { updateCallback, mountCallback } from 'lithent';

export const effect = (
  forward: () => (() => void) | void,
  backward: () => (() => void) | void = () => {},
  dependencies: () => any[] = () => []
) => {
  mountCallback(() => {
    forward();

    return backward;
  });

  updateCallback(() => {
    if (backward) {
      backward();
    }

    return forward;
  }, dependencies);
};

import { WDom, Props } from 'lithent';

export const cacheUpdate = (
  checkFunction: () => unknown[],
  updater: (props: Props) => WDom
) => {
  let originalDefs: unknown[] = [];
  let originalUpdater: WDom | null = null;

  return (props: Props) => {
    const newDefs = checkFunction();
    const isSame = originalDefs.every((def, index) => def === newDefs[index]);

    originalDefs = newDefs;

    if (isSame && originalUpdater) {
      return originalUpdater;
    }

    const newUpdater = updater(props);
    originalUpdater = newUpdater;

    return newUpdater;
  };
};

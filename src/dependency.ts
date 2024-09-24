type Run = null | (() => boolean | AbortSignal | void);

export const addDependency = <V>({
  run,
  storeRenderList,
  depthList,
}: {
  run: Run;
  storeRenderList: Map<Run, [V, () => V, number][]>;
  depthList: string[];
}) => {
  console.log('ss', depthList.join('-'), storeRenderList, run);
};

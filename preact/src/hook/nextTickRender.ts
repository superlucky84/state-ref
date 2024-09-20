import { render, WDom, nextTick } from 'lithent';

export const nextTickRender = (
  wDomMaker: () => WDom,
  wrapElement: HTMLElement | null,
  afterElement?: HTMLElement | null
) => {
  let destroy = () => {};

  nextTick().then(() => {
    destroy = render(wDomMaker(), wrapElement, afterElement);
  });

  return () => destroy();
};

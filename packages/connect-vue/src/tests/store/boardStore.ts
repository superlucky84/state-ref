import { createStore } from 'state-ref';
import { connectVue } from '@/index';

export type Board = { title: string; items: number[]; meta: { tag: string } };

export const getBoard = (): Board => ({
  title: 'board',
  items: [1, 2, 3],
  meta: { tag: 'a' },
});

export const boardWatch = createStore<Board>(getBoard());
export const boardRef = boardWatch();
export const useBoardRef = connectVue(boardWatch);

/** Counted by the components below so a test can read update counts out. */
export const renders = { title: 0, tag: 0, list: 0 };

export const resetRenders = () => {
  renders.title = 0;
  renders.tag = 0;
  renders.list = 0;
};

/** A store whose value passes through 0, to exercise the falsy branch. */
export const counterWatch = createStore<{ count: number }>({ count: 0 });
export const counterRef = counterWatch();
export const useCounterRef = connectVue(counterWatch);

import { createStore } from 'state-ref';
import { connectSvelte } from '@/index';

export type Board = { title: string; items: number[]; meta: { tag: string } };

export const getBoard = (): Board => ({
  title: 'board',
  items: [1, 2, 3],
  meta: { tag: 'a' },
});

export const boardWatch = createStore<Board>(getBoard());
export const boardRef = boardWatch();
export const useBoardRef = connectSvelte(boardWatch);

/** Counted by the components below so a test can read render counts out. */
export const renders = { title: 0, tag: 0, list: 0, length: 0 };

export const resetRenders = () => {
  renders.title = 0;
  renders.tag = 0;
  renders.list = 0;
  renders.length = 0;
};

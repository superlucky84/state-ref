import { render as trender, screen } from '@testing-library/preact';
import { h, render } from 'preact';
import { lenshelf } from '@/index';
import { connectShelfWithPreact } from '@/connectSnippetExamples/preact/preact-latest';

const take = lenshelf<{ name: string; age: number }>({
  name: 'brown',
  age: 13,
});

const usePofileStore = connectShelfWithPreact(take);

const p = take();

//@ts-ignore
window.p = p;

function Name() {
  const shelf = usePofileStore();

  return <div>aa = {shelf.age.value}</div>;
}

function Age() {
  const shelf = usePofileStore();

  return <div>bb = {shelf.name.value}</div>;
}

if (!import.meta.vitest) {
  render(<Age />, document.getElementById('root') as HTMLElement);
  render(<Name />, document.getElementById('root2') as HTMLElement);
}

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  trender(<Age />);
  trender(<Name />);

  describe('Hello Component', () => {
    it('renders the name passed as prop', () => {
      expect(screen.getByText('aa = 13')).toBeInTheDocument();
    });
  });
}

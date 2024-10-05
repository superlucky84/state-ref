import { render as trender, screen } from '@testing-library/preact';
import { h, render } from 'preact';
import { fromState } from '@/index';
import { connectWithPreactA } from '@/connectSnippetExamples/preact/preact-latest';

const capture = fromState<{ name: string; age: number }>({
  name: 'brown',
  age: 13,
});

const usePofileStore = connectWithPreactA(capture);

const p = capture();

//@ts-ignore
window.p = p;

function Name() {
  const stateRef = usePofileStore();

  return <div>aa = {stateRef.age.current}</div>;
}

function Age() {
  const stateRef = usePofileStore();

  return <div>bb = {stateRef.name.current}</div>;
}

if (!import.meta.vitest) {
  render(<Age />, document.getElementById('root') as HTMLElement);
  render(<Name />, document.getElementById('root2') as HTMLElement);
}

if (import.meta.vitest) {
  // const { describe, it, expect } = import.meta.vitest;

  trender(<Age />);
  trender(<Name />);

  describe('Connect Preact', () => {
    it('프리미티브 타입의 값 하나에 대해 변경이 잘 반영되어야 한다.', () => {
      expect(screen.getByText('aa = 13')).toBeInTheDocument();
    });
    /*
    it('프리미티브 널타입으로 변경될때도 잘 반영되어야한다.', () => {
      expect(screen.getByText('aa = 13')).toBeInTheDocument();
    });
    it('구조분해 할당하여 꺼내온 stateRef 값에 대해서도 잘 동작해야 한다.', () => {
      expect(screen.getByText('aa = 13')).toBeInTheDocument();
    });
    it('여러개의 컴포넌트중 current로 꺼내어 값을 구독중인 컴포넌트에 변경만 동작해야한다.', () => {
      expect(screen.getByText('aa = 13')).toBeInTheDocument();
    });
    it('언마운트된 컴포넌트에 구독함수 호출은 일어나지 않아야 한다.', () => {
      expect(screen.getByText('aa = 13')).toBeInTheDocument();
    });
    it('여러개의 컴포넌트가 하나의 값을 구독중일때 언마운트된 컴포넌트 외에 다른 컴포넌트들은 정상 동작해야 한다.', () => {
      expect(screen.getByText('aa = 13')).toBeInTheDocument();
    });
    it('서로 다른 render함수로 부터의 다른 뿌리를 가진 컴포넌트 들도 값을 공유할수 있어야 한다.', () => {
      expect(screen.getByText('aa = 13')).toBeInTheDocument();
    });
     */
  });
}

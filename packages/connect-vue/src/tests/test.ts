import { render, fireEvent, screen, cleanup } from '@testing-library/vue';
import { describe, it, expect } from 'vitest';
import { handleRef, getDefaultValue } from '@/tests/store/store';

const resetStore = () => {
  handleRef.value = getDefaultValue();
};

describe('Connect Preact', () => {
  afterEach(() => {
    cleanup();
    resetStore();
  });

  it('꺼내온 stateRef 값에 대해서 리액티브하게 잘 동작해야 한다.', () => {
    /*
    const mockFn = vi.fn();
    render(Parent, {
      props: {
        mockFn,
      },
    });
    */
  });
  it.skip('여러개의 컴포넌트중 value로 꺼내어 값을 구독중인 컴포넌트에 변경만 동작해야한다.', () => {});
  it.skip('언마운트된 컴포넌트에 구독함수 호출은 일어나지 않아야 한다.', () => {});
  it.skip('여러개의 컴포넌트가 하나의 값을 구독중일때, 모두 스토어 값을 반영하여 정상 동작해야한다.', async () => {});
  it.skip('서로 다른 render함수로 부터의 다른 뿌리를 가진 컴포넌트 들도 값을 공유할수 있어야 한다.', async () => {});
});

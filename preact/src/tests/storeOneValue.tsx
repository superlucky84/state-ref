import { h, Fragment, render, mount, ref, nextTick } from 'lithent';
import { store } from '@/hook/store';
const testChangeRef = ref<null | (() => void)>(null);

const subscribe = store<number>(0);
const subscribeArr = store<number[]>([1]);

let proxySubscribeChkValue = 0;
const abortControl = new AbortController();
const proxyFirst = subscribe(store => {
  proxySubscribeChkValue = store.value;
  console.log(store);

  return abortControl.signal;
});

console.log(proxyFirst);

const Component = mount(r => {
  const local = subscribe(r, null, { cache: false });
  const localArr = subscribeArr(r);

  const click = () => {
    local.value += 1;
    localArr.value = [...localArr.value, localArr.value.length + 1];
  };
  testChangeRef.value = click;

  return () => (
    <>
      <div>value: {local.value}</div>
      {localArr.value.map(item => (
        <span>{item}</span>
      ))}
      <button type="text" onClick={click}>
        change count
      </button>
    </>
  );
});

const testWrap =
  document.getElementById('root') || document.createElement('div');

render(<Component />, testWrap);

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;

  it('If the value is not an object, it is expanded to value and processed.', () => {
    expect(testWrap.outerHTML).toBe(
      '<div><div>value: 0</div><span>1</span><button type="text">change count</button></div>'
    );
    if (testChangeRef.value) {
      testChangeRef.value();
      testChangeRef.value();
      testChangeRef.value();
    }
  });

  it('If the value is not an object, the event operates normally and the value increases.', () => {
    nextTick().then(() => {
      expect(testWrap.outerHTML).toBe(
        '<div><div>value: 3</div><span>1</span><span>2</span><span>3</span><span>4</span><button type="text">change count</button></div>'
      );
      expect(proxySubscribeChkValue).toBe(3);
    });
  });
}

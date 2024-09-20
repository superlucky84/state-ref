import { h, Fragment, render, mount, ref, nextTick } from 'lithent';
import { store } from '@/hook/store';
const testChangeRef = ref<null | (() => void)>(null);

const subscribe = store<{ count1: number; count2: number; count3: number }>({
  count1: 1,
  count2: 1,
  count3: 1,
});

let proxySubscribeChkValue: number = 0;

const abortControl = new AbortController();
// @ts-ignore
window.abort = abortControl;

console.log(abortControl);
const proxyFirst = subscribe(
  store => {
    proxySubscribeChkValue = store.count1;

    console.log(store);

    return abortControl.signal;
  },
  store => [store.count1, store.count2]
);

console.log(proxyFirst);
// @ts-ignore
window.proxyFirst = proxyFirst;

const Component = mount(r => {
  const local = subscribe(r, store => [store.count3]);

  const click = () => {
    local.count1 += 1;
    local.count2 -= 1;
    local.count3 *= 2;
  };
  testChangeRef.value = click;

  return () => (
    <>
      <div>count1: {local.count1}</div>
      <div>count2: {local.count2}</div>
      <div>count3: {local.count3}</div>
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
  console.log('3234235');
  const { it, expect } = import.meta.vitest;
  it('A DOM should be created that reflects the initial values of your store.', () => {
    expect(testWrap.outerHTML).toBe(
      '<div><div>count1: </div><div>count2: </div><div>count3: 1</div><button type="text">change count</button></div>'
    );
    if (testChangeRef.value) {
      testChangeRef.value();
      testChangeRef.value();
      testChangeRef.value();
    }
  });
  it('You should see a DOM that reflects the changed store values.', () => {
    nextTick().then(() => {
      expect(testWrap.outerHTML).toBe(
        '<div><div>count1: </div><div>count2: </div><div>count3: 8</div><button type="text">change count</button></div>'
      );
    });
  });
  it('For subscriptions that did not request a value, the value is null.', () => {
    expect(proxyFirst.count3).toBe(null);
  });
  it('For subscriptions that did not request a value, the value is null - 2', () => {
    proxyFirst.count1 = 777;

    nextTick().then(() => {
      expect(testWrap.outerHTML).toBe(
        '<div><div>count1: </div><div>count2: </div><div>count3: 8</div><button type="text">change count</button></div>'
      );
      expect(proxySubscribeChkValue).toBe(777);
    });
  });
  it('abort test', () => {
    abortControl.abort();
    proxyFirst.count1 = 999;
    nextTick().then(() => {
      expect(proxySubscribeChkValue).toBe(777);
    });
  });
}

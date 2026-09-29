/**
 * F-SO3 regression and the write rule (docs/connectors/DESIGN.md, DC-CN-04,
 * DC-CN-06).
 *
 * The accessor used to hand out the store's internal object, so
 * `addr().city = 'x'` - or a functional setter that mutated `prev` and
 * returned it - changed the store in place with no write recorded. Neither
 * passes through the connector, so both are refused now: the accessor returns
 * a frozen copy. What does pass through - the setter with a new value, or a
 * function returning one - reaches the store synchronously, with no
 * `createEffect` in between.
 */
import { render, cleanup } from '@solidjs/testing-library';
import { createRoot } from 'solid-js';
import { create, createStore } from 'state-ref';
import type { StateRefStore, Watch } from 'state-ref';
import { connectSolid } from '@/index';

type Account = { address: { city: string; zip: string } };
const initial = (): Account => ({ address: { city: 'Seoul', zip: '1' } });

const recorded = () => {
  const writes: Array<{ before: unknown; after: unknown }> = [];
  const { watch } = create<Account>(initial(), {
    onWrite: write => writes.push({ before: write.before, after: write.after }),
  });
  return { watch, writes, reader: watch() };
};

describe('F-SO3 write path', () => {
  afterEach(() => cleanup());

  it('writes through the setter synchronously', () => {
    const { watch, writes, reader } = recorded();
    const use = connectSolid(watch);
    let city!: ReturnType<typeof use<string>>;
    render(() => {
      city = use(s => s.address.city);
      return <span>{city[0]()}</span>;
    });

    city[1]('Busan');
    expect(reader.address.city.value).toBe('Busan');
    expect(writes).toEqual([{ before: 'Seoul', after: 'Busan' }]);
  });

  it('writes a functional update that returns a new value', () => {
    const { watch, writes, reader } = recorded();
    const use = connectSolid(watch);
    let address!: ReturnType<typeof use<Account['address']>>;
    render(() => {
      address = use(s => s.address);
      return <span>{address[0]().city}</span>;
    });

    address[1](prev => ({ ...prev, zip: '9' }));
    expect(reader.address.value).toEqual({ city: 'Seoul', zip: '9' });
    expect(writes).toEqual([
      {
        before: { city: 'Seoul', zip: '1' },
        after: { city: 'Seoul', zip: '9' },
      },
    ]);
  });

  it('refuses a nested mutation and leaves the store untouched', () => {
    const { watch, writes, reader } = recorded();
    const use = connectSolid(watch);
    let address!: ReturnType<typeof use<Account['address']>>;
    render(() => {
      address = use(s => s.address);
      return <span>{address[0]().city}</span>;
    });

    expect(() => {
      address[0]().city = 'Daegu';
    }).toThrow(TypeError);
    expect(() =>
      address[1](prev => {
        prev.zip = '9';
        return prev;
      })
    ).toThrow(TypeError);
    expect(reader.address.value).toEqual({ city: 'Seoul', zip: '1' });
    expect(writes).toEqual([]);
  });

  it('shows a store write', async () => {
    const watch = createStore<Account>(initial());
    const reader = watch();
    const use = connectSolid(watch);
    const screen = render(() => {
      const [city] = use(s => s.address.city);
      return <span data-testid="city">{city()}</span>;
    });
    reader.address.city.value = 'Jeju';
    expect(screen.getByTestId('city').textContent).toBe('Jeju');
  });

  it('writes nowhere once its owner is disposed', () => {
    const watch = createStore<Account>(initial());
    const reader = watch();
    let renews = 0;
    const counting = ((renew?: any, opt?: any) => {
      if (!renew) return (watch as any)(undefined, opt);
      return (watch as any)((ref: StateRefStore<Account>, isFirst: boolean) => {
        if (!isFirst) renews += 1;
        return renew(ref, isFirst);
      }, opt);
    }) as Watch<Account>;
    const use = connectSolid(counting);

    const [, setCity] = createRoot(dispose => {
      const signal = use(s => s.address.city);
      dispose();
      return signal;
    });
    setCity('Busan');
    reader.address.city.value = 'Daejeon';
    expect(reader.address.city.value).toBe('Daejeon');
    expect(renews).toBe(0);
  });
});

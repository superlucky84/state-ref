/**
 * Phase 7 hardening (docs/connectors/IMPLEMENT.md): a second, independent
 * catch for each connector defect that only one test used to catch.
 */
import { render, cleanup } from '@solidjs/testing-library';
import { create, createStore } from 'state-ref';
import { connectSolid } from '@/index';

type Place = {
  address: { city: string; geo: { lat: number } };
  tags: string[];
};
const initial = (): Place => ({
  address: { city: 'Seoul', geo: { lat: 37 } },
  tags: ['a'],
});

const recorded = () => {
  const writes: unknown[] = [];
  const { watch } = create<Place>(initial(), {
    onWrite: write => writes.push(write),
  });
  return { watch, writes, reader: watch() };
};

describe('hardening: accessor values are frozen copies', () => {
  afterEach(() => cleanup());

  it('refuses an array method on a selected array', () => {
    const { watch, writes, reader } = recorded();
    const use = connectSolid(watch);
    let tags!: ReturnType<typeof use<string[]>>;
    render(() => {
      tags = use(s => s.tags);
      return <span>{tags[0]().join(',')}</span>;
    });

    expect(() => tags[0]().push('b')).toThrow(TypeError);
    expect(reader.tags.value).toEqual(['a']);
    expect(writes).toEqual([]);
  });

  it('refuses a deep mutation inside a functional update', () => {
    const { watch, writes, reader } = recorded();
    const use = connectSolid(watch);
    let address!: ReturnType<typeof use<Place['address']>>;
    render(() => {
      address = use(s => s.address);
      return <span>{address[0]().city}</span>;
    });

    expect(() =>
      address[1](prev => {
        prev.geo.lat = 0;
        return { ...prev };
      })
    ).toThrow(TypeError);
    expect(reader.address.geo.lat.value).toBe(37);
    expect(writes).toEqual([]);
  });
});

describe('hardening: writes after teardown', () => {
  it('a setter kept past its component writes nowhere', () => {
    const watch = createStore<Place>(initial());
    const reader = watch();
    const use = connectSolid(watch);
    let setCity!: (value: string) => void;
    const screen = render(() => {
      const [city, set] = use(s => s.address.city);
      setCity = set as (value: string) => void;
      return <span>{city()}</span>;
    });
    screen.unmount();

    setCity('Busan');
    expect(reader.address.city.value).toBe('Seoul');
  });
});

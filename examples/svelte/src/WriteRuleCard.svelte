<script lang="ts">
  import { create } from 'state-ref';
  import { connectSvelte } from '@stateref/connect-svelte';

  /**
   * The connector's write rule, on screen (DC-CN-04, DC-CN-10).
   *
   * A write that passes through the connector reaches the store. Svelte's own
   * `$address.city = value` does: the compiler turns it into `address.set(...)`,
   * and the connector hands out copies so that `set` is a real write with a
   * correct `before`.
   *
   * The card keeps its own small store so that typing here never touches the
   * shared model the five-screen comparison reads.
   */
  type Account = { address: { city: string; zip: string } };

  let writes = 0;
  const { watch } = create<Account>(
    { address: { city: '서울', zip: '04524' } },
    {
      onWrite: () => {
        writes += 1;
      },
    }
  );
  const use = connectSvelte(watch);
  const address = use(store => store.address);
  // A second, separate subscription: it moves only if the store really changed.
  const city = use(store => store.address.city);

  const typed = (event: Event) => {
    $address.city = (event.currentTarget as HTMLInputElement).value;
  };
</script>

<section class="card" data-card="write-rule">
  <h2>쓰기 규칙</h2>
  <div class="row" data-rule="input">
    <span>$address.city = 입력값</span>
    <input value={$address.city} on:input={typed} />
  </div>
  <div class="row" data-rule="twin">
    <span>따로 구독한 도시</span><b>{$city}</b>
  </div>
  <div class="row" data-rule="writes">
    <span>스토어 쓰기 횟수</span><b>{writes}</b>
  </div>
  <p class="note">
    Svelte의 <code>$address.city = 값</code>은 컴파일러가
    <code>address.set(...)</code>으로 바꾸므로 커넥터를 지나간다. 그래서 스토어에
    반영되고, 따로 구독한 쪽도 함께 바뀐다.
  </p>
</section>

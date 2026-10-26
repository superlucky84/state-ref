import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root = fileURLToPath(new URL('../../..', import.meta.url));
const temporary = mkdtempSync(join(tmpdir(), 'stateref-no-sync-'));
try {
  for (const [name, dir] of [
    ['state-ref', 'state-ref'],
    ['@stateref/devtools', 'devtools'],
  ]) {
    const target = join(temporary, 'node_modules', name);
    mkdirSync(target, { recursive: true });
    cpSync(join(root, 'packages', dir, 'dist'), join(target, 'dist'), {
      recursive: true,
    });
    cpSync(
      join(root, 'packages', dir, 'package.json'),
      join(target, 'package.json')
    );
  }
  writeFileSync(join(temporary, 'package.json'), '{"type":"module"}');
  writeFileSync(
    join(temporary, 'consumer.ts'),
    `import {createStore} from 'state-ref'; import {createDevtools} from '@stateref/devtools'; import {mountPanel} from '@stateref/devtools/panel'; import {devtools,stopDevtools} from '@stateref/devtools/auto'; const watch=devtools(createStore(0),{enabled:true}); stopDevtools(watch); const tools = createDevtools(); tools.getSnapshot(); tools.dispose(); void mountPanel;`
  );
  execFileSync(
    process.execPath,
    [
      join(root, 'node_modules/typescript/bin/tsc'),
      '--noEmit',
      '--strict',
      '--target',
      'es2020',
      '--module',
      'node16',
      '--moduleResolution',
      'node16',
      join(temporary, 'consumer.ts'),
    ],
    { stdio: 'pipe' }
  );
  const output = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import {createStore} from 'state-ref';import {createDevtools} from '@stateref/devtools';import{mountPanel}from'@stateref/devtools/panel';import{devtools,stopDevtools}from'@stateref/devtools/auto';const original=createStore(0);if(devtools(original,{enabled:true})!==original)throw Error('identity');stopDevtools();const tools=createDevtools();if(tools.getSnapshot().sources.length)throw Error('source');tools.dispose();if(typeof mountPanel!=='function')throw Error('panel');console.log('PASS')`,
    ],
    { cwd: temporary, encoding: 'utf8' }
  );
  assert.equal(output.trim(), 'PASS');
  console.log(
    'copied packages without Sync: strict Node16 types and SSR runtime PASS'
  );
} finally {
  rmSync(temporary, { recursive: true, force: true });
}

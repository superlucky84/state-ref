import { expect, test } from '@playwright/test';
import { SCENARIOS, mismatches } from 'stateref-example-shared';
import type { Scenario, ScreenReading } from 'stateref-example-shared';
import type { Page } from '@playwright/test';
import { DEMOS, urlOf } from './demos';
import { readSettled } from './read';

/**
 * Every scenario, in five real browsers' worth of connector, read from the DOM.
 *
 * Two questions per step, reported apart because they mean different things:
 * does each screen satisfy the expectation (correctness), and do the five
 * screens agree (connector fidelity). Five agreeing screens can be wrong
 * together - only the expectation catches that - and one screen differing is a
 * connector difference, because there is nowhere else for it to come from.
 *
 * The same scenarios run against the model in `examples/shared`. Passing there
 * and failing here means the connector lost something on the way to the screen.
 */
type StepReading = Readonly<{ step: number; reading: ScreenReading }>;

async function walk(
  page: Page,
  scenario: Scenario,
  problems: string[]
): Promise<StepReading[]> {
  const readings: StepReading[] = [];
  let index = 0;
  for (const step of scenario.steps) {
    index += 1;
    if ('press' in step) {
      await page.click(`button[data-operation="${step.press}"]`);
      continue;
    }
    // Retry the condition rather than reading once: a result that arrives on
    // its own lands on a later turn, and a fixed number of waits would pass by
    // luck. `readSettled` already handles each framework's batching.
    let reading = await readSettled(page);
    let failed = mismatches(reading, step.expect);
    for (let attempt = 0; attempt < 5 && failed.length > 0; attempt += 1) {
      await page.waitForTimeout(100);
      reading = await readSettled(page);
      failed = mismatches(reading, step.expect);
    }
    if (failed.length > 0) {
      problems.push(
        `step ${index} (${step.note}):\n    ${failed.join('\n    ')}`
      );
    }
    readings.push({ step: index, reading });
  }
  return readings;
}

for (const scenario of SCENARIOS) {
  test(`${scenario.id} — ${scenario.title}`, async ({ browser }) => {
    const perDemo: [string, StepReading[]][] = [];
    const problems: string[] = [];

    for (const demo of DEMOS) {
      const page = await browser.newPage();
      const noise: string[] = [];
      page.on('pageerror', error => noise.push(`pageerror: ${error}`));
      page.on('console', message => {
        if (message.type() === 'error')
          noise.push(`console: ${message.text()}`);
      });

      await page.goto(urlOf(demo));
      const demoProblems: string[] = [];
      perDemo.push([demo.name, await walk(page, scenario, demoProblems)]);
      for (const line of demoProblems) problems.push(`${demo.name} ${line}`);
      for (const line of noise) problems.push(`${demo.name} logged ${line}`);
      await page.close();
    }

    // Correctness first: a wrong expectation makes all five fail together, and
    // reporting that as "the demos disagree" would point at the wrong place.
    expect(problems, `${scenario.pins}\n  ${problems.join('\n  ')}`).toEqual(
      []
    );

    const [firstName, firstSteps] = perDemo[0];
    for (const [name, steps] of perDemo.slice(1)) {
      for (let i = 0; i < firstSteps.length; i += 1) {
        expect(
          steps[i].reading,
          `${name} differs from ${firstName} at step ${firstSteps[i].step}`
        ).toEqual(firstSteps[i].reading);
      }
    }
  });
}

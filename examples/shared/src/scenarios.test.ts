import { describe, expect, it } from 'vitest';
import { SCENARIOS, mismatches } from './scenarios';
import { createDemoModel } from './model';
import { screenOf } from './screen';

/**
 * Every scenario, read from the model.
 *
 * The browser runner presses the same list of buttons and checks the same
 * expectations against the rendered DOM (DC8-8-02). Passing here and failing
 * there means the connector lost something on the way to the screen; failing
 * in both means the expectation or the library is wrong. Keeping one
 * expectation for both is what makes that distinction available at all.
 */
describe('scenarios, read from the model', () => {
  const settled = () => new Promise(resolve => setTimeout(resolve, 0));

  for (const scenario of SCENARIOS) {
    it(`${scenario.id} — ${scenario.title}`, async () => {
      const model = createDemoModel();
      try {
        let index = 0;
        for (const step of scenario.steps) {
          index += 1;
          if ('press' in step) {
            model.run(step.press);
            // A result that arrives on its own - an operation's promise, a
            // retry - lands on a later turn. The scenario says what must
            // become true, never how long that takes.
            await settled();
            continue;
          }
          // Retry rather than read once: an expectation is a condition, and a
          // count of turns would silently pass when the timing changed.
          let problems = mismatches(screenOf(model), step.expect);
          for (let attempt = 0; attempt < 8 && problems.length > 0; attempt++) {
            await settled();
            problems = mismatches(screenOf(model), step.expect);
          }
          expect(
            problems,
            `${scenario.id} step ${index} (${step.note})\n${problems.join(
              '\n'
            )}`
          ).toEqual([]);
        }
      } finally {
        model.dispose();
      }
    });
  }
});

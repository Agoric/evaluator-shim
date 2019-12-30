import test from 'tape';
import sinon from 'sinon';
import Evaluator from '../../src/evaluator';

test('HostException in eval revokes unsafeEval', t => {
  t.plan(2);

  // Mimic repairFunctions.
  // eslint-disable-next-line no-proto
  sinon.stub(Function.__proto__, 'constructor').callsFake(() => {
    throw new TypeError();
  });

  // Prevent output
  sinon.stub(console, 'error').callsFake();

  const e = new Evaluator();

  const endowments = { __capture__: {} };
  try {
    e.evaluateScript(
      `
      function loop(){
        (0, eval)('1');
        loop();
      }

      try {      
        loop();
      } catch(e) {}

      __capture__.eval = eval;
    `,
      endowments,
    );
    // eslint-disable-next-line no-empty
  } catch (err) {}

  // eslint-disable-next-line no-eval, no-underscore-dangle
  t.notEqual(endowments.__capture__.eval, eval, 'should not be unsafe eval');
  // eslint-disable-next-line no-underscore-dangle
  t.equal(endowments.__capture__.eval, e.global.eval, "should be realm's eval");

  sinon.restore();
});

test('HostException in Function revokes unsafeEval', t => {
  t.plan(2);

  // Mimic repairFunctions.
  // eslint-disable-next-line no-proto
  sinon.stub(Function.__proto__, 'constructor').callsFake(() => {
    throw new TypeError();
  });

  // Prevent output
  sinon.stub(console, 'error').callsFake();

  const e = new Evaluator();

  const endowments = { __capture__: {} };
  try {
    e.evaluateScript(
      `
      function loop(){
        Function('1');
        loop();
      }

      try {      
        loop();
      } catch(e) {}

      __capture__.eval = eval;
    `,
      endowments,
    );
    // eslint-disable-next-line no-empty
  } catch (err) {}

  // eslint-disable-next-line no-eval, no-underscore-dangle
  t.notEqual(endowments.__capture__.eval, eval, 'should not be unsafe eval');
  // eslint-disable-next-line no-underscore-dangle
  t.equal(endowments.__capture__.eval, e.global.eval, "should be realm's eval");

  sinon.restore();
});

import test from 'tape';
import { getOptimizableConstants } from '../../src/optimizer';

test('getOptimizableConstants', t => {
  t.plan(20);

  t.deepEqual(
    getOptimizableConstants({}),
    [],
    'should return empty if no global'
  );

  t.deepEqual(
    getOptimizableConstants({ foo: true }),
    [],
    'should reject configurable & writable'
  );
  t.deepEqual(
    getOptimizableConstants(Object.create(null, { foo: { value: true } })),
    ['foo'],
    'should return non configurable & non writable'
  );
  t.deepEqual(
    getOptimizableConstants(
      Object.create(null, { foo: { value: true, configurable: true } })
    ),
    [],
    'should reject configurable'
  );
  t.deepEqual(
    getOptimizableConstants(
      Object.create(null, { foo: { value: true, writable: true } })
    ),
    [],
    'should reject writable'
  );

  t.deepEqual(
    getOptimizableConstants(Object.create(null, { foo: { get: () => true } })),
    [],
    'should reject getter'
  );
  t.deepEqual(
    getOptimizableConstants(Object.create(null, { foo: { set: () => true } })),
    [],
    'should reject setter'
  );

  t.deepEqual(
    getOptimizableConstants(Object.create(null, { eval: { value: true } })),
    [],
    'should reject eval'
  );
  t.deepEqual(
    getOptimizableConstants(Object.create(null, { const: { value: true } })),
    [],
    'should reject reserved keyword'
  );
  t.deepEqual(
    getOptimizableConstants(
      Object.create(null, {
        null: { value: true },
        true: { value: true },
        false: { value: true }
      })
    ),
    [],
    'should reject literals (reserved)'
  );
  t.deepEqual(
    getOptimizableConstants(
      Object.create(null, { this: { value: true }, arguments: { value: true } })
    ),
    [],
    'should reject this and arguments'
  );
  t.deepEqual(
    getOptimizableConstants(
      Object.create(null, { [Symbol.iterator]: { value: true } })
    ),
    [],
    'should reject symbols'
  );

  t.deepEqual(
    getOptimizableConstants(Object.create(null, { 123: { value: true } })),
    [],
    'should reject leading digit'
  );
  t.deepEqual(
    getOptimizableConstants(Object.create(null, { '-123': { value: true } })),
    [],
    'should reject leading dash'
  );

  t.deepEqual(
    getOptimizableConstants(Object.create(null, { _123: { value: true } })),
    ['_123'],
    'should return leading underscore'
  );
  t.deepEqual(
    getOptimizableConstants(Object.create(null, { $123: { value: true } })),
    ['$123'],
    'should return leading underscore'
  );
  t.deepEqual(
    getOptimizableConstants(Object.create(null, { a123: { value: true } })),
    ['a123'],
    'should return leading lowercase'
  );
  t.deepEqual(
    getOptimizableConstants(Object.create(null, { A123: { value: true } })),
    ['A123'],
    'should return leading uppercase'
  );

  t.deepEqual(
    getOptimizableConstants(
      Object.create(null, { foo: { value: true }, bar: { value: true } })
    ),
    ['foo', 'bar'],
    'should return all non configurable & non writable'
  );
  t.deepEqual(
    getOptimizableConstants(
      Object.create(null, {
        foo: { value: true },
        bar: { value: true, configurable: true }
      })
    ),
    ['foo'],
    'should return only non configurable & non writable'
  );
});

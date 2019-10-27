import {
  arrayFilter,
  arrayJoin,
  getOwnPropertyDescriptor,
  getOwnPropertyNames,
  objectHasOwnProperty,
  regexpTest
} from './commons';

// todo: think about how this interacts with endowments, check for conflicts
// between the names being optimized and the ones added by endowments

/**
 * In JavaScript you cannot use these reserved words as variables.
 * See 11.6.1 Identifier Names
 */
const keywords = new Set([
  // 11.6.2.1 Keywords
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',

  // Also reserved when parsing strict mode code
  'let',
  'static',

  // 11.6.2.2 Future Reserved Words
  'enum',

  // Also reserved when parsing strict mode code
  'implements',
  'package',
  'protected',
  'interface',
  'private',
  'public',

  // Reserved but not mentioned in specs
  'await',

  'null',
  'true',
  'false',

  'this',
  'arguments'
]);

/**
 * Simplified validation of indentifier names: may only contain alphanumeric
 * characters (or "$" or "_"), and may not start with a digit. This is safe
 * and does not reduces the compatibility of the shim. The motivation for
 * this limitation was to decrease the complexity of the implementation,
 * and to maintain a resonable level of performance.
 * Note: \w is equivalent [a-zA-Z_0-9]
 * See 11.6.1 Identifier Names
 */
const identifierPattern = new RegExp('^[a-zA-Z_$][\\w$]*$');

/**
 * getOptimizableConstants()
 *
 * Assume that the properties of `globalishObject` (need a better
 * name) are aliased to variable names, except those shadowed by `exclusions`.
 * Which property names of `globalish might we predeclare as `const`
 * variables?
 *    * The property's value would need to be stable, so the property
 *      must be non-writable non-enumerable own property.
 *    * The name must not be shadowed by exclusions.
 *    * The name must be a string rather than a symbol
 *    * The name must be a non-keyword identifier
 *    * The name must not be "eval", since we treat that specially.
 */
export function getOptimizableConstants(globalishObject, exclusions = {}) {
  const globalNames = getOwnPropertyNames(globalishObject);
  // getOwnPropertyNames does ignore Symbols so we don't need this extra check:
  // typeof name === 'string' &&
  const constants = arrayFilter(globalNames, name => {
    // Exclude properties that will be hidden behind an object positioned
    // closer in the resolution scope chain, typically the endowments.
    if (name in exclusions) {
      return false;
    }

    // Ensure we have a valid identifier. We use regexpTest rather than
    // /../.test() to guard against the case where RegExp has been poisoned.
    if (
      name === 'eval' ||
      keywords.has(name) ||
      !regexpTest(identifierPattern, name)
    ) {
      return false;
    }

    const desc = getOwnPropertyDescriptor(globalishObject, name);
    return (
      //
      // The getters will not have .writable, don't let the falsyness
      // of 'undefined' trick us: test with === false, not ! . However
      // descriptors inherit from the (potentially poisoned)
      // Object.prototype, so we might see extra properties which
      // weren't really there. Accessor properties have
      // 'get/set/enumerable/configurable', while data properties have
      // 'value/writable/enumerable/configurable'. Hence the own
      // property check for `value` below.
      desc.configurable === false &&
      desc.writable === false &&
      //
      // Checks for data properties because they're the only ones we
      // can optimize (accessors are most likely
      // non-constant). Descriptors can't can't have accessors and
      // value properties at the same time, therefore this check is
      // sufficient. Using an explicit own property check deals with
      // the case where Object.prototype has been poisoned.
      objectHasOwnProperty(desc, 'value')
    );
  });

  return constants;
}

export function buildOptimizer(constants) {
  // No need to build an oprimizer when there are no constants.
  if (constants.length === 0) return '';
  // Extract the optimizable constants from the scope proxy, which
  // will be bound to `this`.
  return `const {${arrayJoin(constants, ',')}} = this;`;
}

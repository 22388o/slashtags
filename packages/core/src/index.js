import EventEmitter from 'events';
import { errors, warnings, SlashtagsError } from './errors.js';
import { HOOKS } from './constants.js';
export { SlashtagsError, errors, warnings, HOOKS };

/** @param {SlashPlugin[]} plugins */
const filterInstallers = (plugins) => {
  const symbols = new Set();
  return plugins
    .flatMap((p) => [p, ...p.require])
    .filter((plugin) => {
      const shouldAdd = !symbols.has(plugin.id);
      symbols.add(plugin.id);
      return shouldAdd;
    })
    .map((plugin) => plugin.install);
};

/** @type {import('./interfaces').slashtags} */
// @ts-ignore
export const slashtags = async (plugins, options) => {
  const emitter = new EventEmitter();

  const slash = {
    logger: options?.logger || console,
    /**
     *
     * @param {string} type
     * @param {*} data
     * @returns
     */
    emit: async (type, data) => {
      // @ts-ignore
      let handlers = emitter._events[type];
      if (handlers === undefined) return false;

      if (typeof handlers === 'function') handlers = [handlers];

      for (const handler of handlers) {
        await handler(slash, data);
      }
      return true;
    },
  };

  const extensions = await Promise.all(
    filterInstallers(plugins).map((install) => install(options)),
  );

  /** @param {import('./interfaces').SlashPluginMethod} method */
  const wrapMethod = (method) => (/** @type {*} */ args) => method(slash, args);

  for (const extension of extensions) {
    for (const [name, method] of Object.entries(extension.methods || {})) {
      // @ts-ignore
      slash[name] = wrapMethod(method);
    }
  }

  // @ts-ignore
  return slash;
};

(async () => {
  const pluginB = {
    id: Symbol('pluginB'),
    require: [],
    /** @param {{bar: {[key:string] : number}}} options */
    install: async function (options) {
      return { methods: {} };
    },
  };

  const pluginC = {
    id: Symbol('pluginC'),
    require: [pluginB],
    /** @param {{car: number[]}} options */
    install: async function (options) {
      return { methods: {} };
    },
  };

  const pluginA = {
    id: Symbol('pluginA'),
    require: [pluginB, pluginC],
    /**
     * @param {{foo: string}} options
     */
    install: async function (options) {
      return {
        methods: {
          /** @type {import('./interfaces').SlashPluginMethod<{foo?:string}>} */
          foo: function (slash, args) {
            slash.bar();
            return 3;
          },
          /**
           * @param {import('./interfaces').SlashInstance} slash
           * @param {{bar:number}} args
           */
          bar: function (slash, args) {
            return 'bar';
          },
        },
      };
    },
  };

  const slash = await slashtags([pluginA, pluginB], {
    foo: '234',
    bar: { fast: 234 },
    car: [1, 2],
  });

  console.log(slash);
  console.log(slash.foo({ foo: '234' }));
  console.log(slash.bar({ bar: 324 }));
})();

/**
 * @typedef {import('./interfaces').SlashInstance} SlashInstance
 * @typedef {import('./interfaces').SlashPlugin} SlashPlugin
 */

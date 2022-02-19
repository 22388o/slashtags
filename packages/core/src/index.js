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
  /** @type {import('./interfaces').SlashPlugin<{bar :{[key:string]: number}}>} */
  const pluginB = {
    id: Symbol('pluginB'),
    require: [],
    install: async function (options) {
      return { methods: {} };
    },
  };

  /** @type {import('./interfaces').SlashPlugin<{dar: string}>} */
  const pluginD = {
    id: Symbol('pluginD'),
    require: [],
    install: async function (options) {
      return { methods: {} };
    },
  };

  /** @type {import('./interfaces').SlashPlugin<{car: number[]}, [pluginD]>} */
  const pluginC = {
    id: Symbol('pluginC'),
    require: [pluginD],
    install: async function (options) {
      return {
        methods: {
          /**
           * @param {{pluginCFooCFoo: string}} args
           */
          fooC: (slash, args) => {},
        },
      };
    },
  };

  /** @type {import('./interfaces').SlashPlugin<{foo: string}, [pluginC]>} */
  const pluginA = {
    id: Symbol('pluginA'),
    require: [pluginC],
    install: async function (options) {
      return {
        methods: {
          /**
           * @param {*} args
           * @returns
           */
          foo: function (slash, args) {
            slash.fooC({ pluginCFooCFoo: '324324324324' });
            return 3;
          },
          /**
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

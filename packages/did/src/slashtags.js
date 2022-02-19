import EventEmitter from 'events';

const slashtags = function () {
  const emitter = new EventEmitter();

  this.use = function (plugin, options) {
    Object.entries(plugin.events || {}).forEach(([eventType, eventHandler]) => {
      emitter.on(eventType, eventHandler);
    });

    Object.entries(plugin.methods || {}).forEach(([name, method]) => {
      // @ts-ignore
      this[name] = method;
    });

    return this;
  };

  this.emit = async function (type, ...args) {
    // @ts-ignore
    let handlers = emitter._events[type];
    if (handlers === undefined) return false;

    if (typeof handlers === 'function') handlers = [handlers];

    for (const handler of handlers) {
      // @ts-ignore
      await handler.bind(this)(...args);
    }

    return true;
  };
};

class Slashtags {
  #emitter;
  constructor() {
    this.#emitter = new EventEmitter();
  }

  emit(type, ...args) {
    // @ts-ignore
    let handlers = this.#emitter._events[type];
    if (handlers === undefined) return false;

    if (typeof handlers === 'function') handlers = [handlers];

    for (const handler of handlers) {
      // @ts-ignore
      await handler.bind(this)(...args);
    }

    return true;
  }
}

export default function () {
  return new Slashtags();
}

/** @type {import('@synonymdev/slashtags-core/src/interfaces').SlashPlugin} */
export async function did(instance, options) {
  instance.decorate('foo', { foo: 'bar' });
}

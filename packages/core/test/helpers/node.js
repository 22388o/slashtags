import { Core } from '../../src/index.js'

const nodes = []

export const creatNode = async () => {
  const node = await Core()
  nodes.push(node)
  return node
}

export const clearNodes = async () =>
  Promise.all(nodes.map((node) => node.destroy()))

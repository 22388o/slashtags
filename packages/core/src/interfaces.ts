export type Serializable =
  | string
  | number
  | boolean
  | Serializable[]
  | { [key: string]: Serializable };

export interface Emit {
  (type: string, ...args: any[]): boolean;
  (type: string, ...args: any[]): Promise<boolean>;
}

interface LogFn {
  <T extends object>(obj: T, msg?: string, ...args: any[]): void;
  (obj: unknown, msg?: string, ...args: any[]): void;
  (msg: string, ...args: any[]): void;
}

export interface Logger {
  error: LogFn;
  warn: LogFn;
  info: LogFn;
  debug: LogFn;
  trace: LogFn;
}
export interface SlashtagsOptions {
  logger?: Logger;
}

export interface SlashPluginMethod {
  (slash: SlashInstance, args: any): Promise<any> | any;
}

export interface SlashPluginMethodMap
  extends Record<string, SlashPluginMethod> {}

export interface SlashPlugin {
  id: symbol;
  require: SlashPlugin[];
  install: (options: any) => Promise<{
    events?: Record<
      string,
      (
        instance: SlashInstance,
        event: { type: string; data: any },
      ) => Promise<void>
    >;
    methods: SlashPluginMethodMap;
  }>;
}
export interface SlashInstance {
  logger: Logger;
  emit: (type: string, data: any) => Promise<boolean>;
}

type Methods<P extends SlashPlugin[]> = Awaited<
  ReturnType<{} & P[number]['install']>
>['methods'];

interface RemoveInstance<T extends SlashPluginMethod> {
  (args?: Parameters<T>[1] | undefined): ReturnType<T>;
}

type SlashInstanceWithMethods<M extends SlashPluginMethodMap> =
  UnionToIntersection<
    SlashInstance & {
      [K in keyof M]: RemoveInstance<M[K]>;
    }
  >;

type OptionsFromPlugins<P extends SlashPlugin[]> = UnionToIntersection<
  | Parameters<P[number]['install']>[0]
  | Parameters<P[number]['require'][number]['install']>[0]
>;

export interface slashtags {
  <P extends SlashPlugin[]>(
    plugins: P,
    options: SlashtagsOptions & OptionsFromPlugins<P>,
  ): SlashInstanceWithMethods<Methods<P>>;
}

// Utilities
type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (
  x: infer R,
) => any
  ? R
  : never;

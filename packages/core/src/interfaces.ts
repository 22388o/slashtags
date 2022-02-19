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

export interface SlashPluginMethod<S extends SlashInstance = SlashInstance> {
  (slash: S, args: any): Promise<any> | any;
}

export interface SlashPluginMethodMap<S extends SlashInstance = SlashInstance>
  extends Record<string, SlashPluginMethod<S>> {}

export interface SlashPluginInstall<P extends SlashPlugin[], O> {
  (options: O): Promise<{
    events?: Record<
      string,
      (
        instance: SlashInstance<P>,
        event: { type: string; data: any },
      ) => Promise<void>
    >;
    methods: SlashPluginMethodMap<SlashInstance<P>>;
  }>;
}

export interface SlashPlugin<
  O extends Record<string, any> = {},
  P extends SlashPlugin[] = [],
> {
  id: symbol;
  require: P;
  install: SlashPluginInstall<P, O>;
}
export interface SlashBase {
  logger: Logger;
  emit: (type: string, data: any) => Promise<boolean>;
}

type SlashInstanceWithMethods<M extends SlashPluginMethodMap> =
  UnionToIntersection<
    SlashBase & {
      [K in keyof M]: RemoveInstance<M[K]>;
    }
  >;

export type SlashInstance<P extends SlashPlugin[] = []> = P extends []
  ? SlashBase
  : SlashInstanceWithMethods<MethodsFromPlugins<P>>;

type MethodsFromPlugins<P extends SlashPlugin[]> = Awaited<
  ReturnType<{} & P[number]['install']>
>['methods'];

interface RemoveInstance<T extends SlashPluginMethod> {
  (args?: Parameters<T>[1] | undefined): ReturnType<T>;
}

type OptionsFromPlugins<P extends SlashPlugin[]> = UnionToIntersection<
  | Parameters<P[number]['install']>[0]
  | Parameters<P[number]['require'][number]['install']>[0]
>;

export interface slashtags {
  <P extends SlashPlugin<any, any>[]>(
    plugins: P,
    options: SlashtagsOptions & OptionsFromPlugins<P>,
  ): SlashInstance<P>;
}

// Utilities
type UnionToIntersection<T> = (T extends any ? (x: T) => any : never) extends (
  x: infer R,
) => any
  ? R
  : never;

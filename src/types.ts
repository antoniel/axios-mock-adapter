
export type TODO = any;
export type VERBS =
  | "get"
  | "post"
  | "head"
  | "delete"
  | "patch"
  | "put"
  | "options"
  | "list"
  | "link"
  | "unlink"
  | "any"
  
export type Handlers = Record<VERBS, TODO[]>;
export type History = Record<VERBS, TODO[]>;
export type VerbHandlers = {
  [K in VERBS as `on${Capitalize<K>}`]: any
};
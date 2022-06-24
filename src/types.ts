
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

export type VERBS_W_ANY = VERBS | "any";
  
export type Handlers = Record<VERBS, TODO[]>;
export type History = Record<VERBS, TODO[]>;

export type VerbHandlers = {
  [K in VERBS_W_ANY as `on${Capitalize<K>}`]: any
};
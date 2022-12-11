import { AxiosAdapter, AxiosInstance, AxiosRequestConfig } from 'axios';

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
  
export type Matcher = RegExp | string
export type Body = unknown
export type RequestHeaders = unknown
export type Code = number
export type Response = unknown
export type Headers = unknown
export type Handler = [
  Matcher,
  Body ,
  RequestHeaders ,
  Code,
  Response,
  Headers,
  true,
] | [
  Matcher,
  Body ,
  RequestHeaders ,
  Code,
  Response,
  Headers,
]
export type Handlers = Record<VERBS, Handler[]>;
export type History = Record<VERBS, TODO[]>;

export type VerbHandlers = {
  [K in VERBS_W_ANY as `on${Capitalize<K>}`]: any
};

export type CallbackResponseSpecFunc = (
  config: AxiosRequestConfig
) => any[] | Promise<any[]>;

export type ResponseSpecFunc = <T = any>(
  statusOrCallback: number | CallbackResponseSpecFunc,
  data?: T,
  headers?: any
) => MockAdapter;

export interface RequestHandler {
  reply: ResponseSpecFunc;
  replyOnce: ResponseSpecFunc;
  passThrough(): MockAdapter;
  abortRequest(): MockAdapter;
  abortRequestOnce(): MockAdapter;
  networkError(): MockAdapter;
  networkErrorOnce(): MockAdapter;
  timeout(): MockAdapter;
  timeoutOnce(): MockAdapter;
}

export interface MockAdapterOptions {
  delayResponse?: number;
  onNoMatch?: 'passThrough' | 'throwException';
}

export interface AsymmetricMatcher {
  asymmetricMatch: Function;
}

export interface RequestDataMatcher {
  [index: string]: any;
  params?: {
    [index: string]: any;
  };
}

export interface HeadersMatcher {
  [header: string]: string;
}

export type AsymmetricHeadersMatcher = AsymmetricMatcher | HeadersMatcher;

export type AsymmetricRequestDataMatcher = AsymmetricMatcher | RequestDataMatcher;

export type RequestMatcherFunc = (
  matcher?: string | RegExp,
  body?: string | AsymmetricRequestDataMatcher,
  headers?: AsymmetricHeadersMatcher
) => RequestHandler;

declare class MockAdapter {
  constructor(axiosInstance: AxiosInstance, options?: MockAdapterOptions);

  adapter(): AxiosAdapter;
  reset(): void;
  resetHandlers(): void;
  resetHistory(): void;
  restore(): void;

  history: { [method: string]: AxiosRequestConfig[] };

  onGet: RequestMatcherFunc;
  onPost: RequestMatcherFunc;
  onPut: RequestMatcherFunc;
  onHead: RequestMatcherFunc;
  onDelete: RequestMatcherFunc;
  onPatch: RequestMatcherFunc;
  onList: RequestMatcherFunc;
  onOptions: RequestMatcherFunc;
  onAny: RequestMatcherFunc;
  onLink: RequestMatcherFunc;
  onUnlink: RequestMatcherFunc;
}

export default MockAdapter;

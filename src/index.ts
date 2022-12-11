
import {
  AxiosAdapter,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { Handler, Handlers, History, Matcher, MockAdapterOptions, TODO, VERBS, VERBS_W_ANY } from "./types";

import {handleRequest} from "./handle_request"
import * as utils from "./utils";


const VERBS: VERBS[] = [
  "get",
  "post",
  "head",
  "delete",
  "patch",
  "put",
  "options",
  "list",
  "link",
  "unlink",
];

/**
 * It takes an array of strings and returns an object with the strings as keys and an empty array as
 * the value
 * @returns An object with the keys of the VERBS array and the values of an empty array.
 */
const getVerbObject = () => ({
    get: [],
    post: [],
    head: [],
    delete: [],
    patch: [],
    put: [],
    options: [],
    list: [],
    link: [],
    unlink: [],
  });


type VerbHandlers = {
  [K in VERBS as `on${Capitalize<K>}`]: any
};

export class MockAdapter {
  axiosInstance?: AxiosInstance;
  originalAdapter?: AxiosAdapter;
  delayResponse: number | null;
  onNoMatch: "throwException" | "passThrough";
  handlers: Handlers;
  history: History;
  onGet: VerbHandlers["onGet"];
  onAny: VerbHandlers["onGet"];
  onPost: VerbHandlers["onPost"];
  onHead: VerbHandlers["onHead"];
  onDelete: VerbHandlers["onDelete"];
  onPatch: VerbHandlers["onPatch"];
  onPut: VerbHandlers["onPut"];
  onOptions: VerbHandlers["onOptions"];
  onList: VerbHandlers["onList"];
  onLink: VerbHandlers["onLink"];
  onUnlink: VerbHandlers["onUnlink"];


  constructor(axiosInstance: AxiosInstance, options?: MockAdapterOptions) {
    this.assertAxiosInstance(axiosInstance);
    this.axiosInstance = axiosInstance;
    this.originalAdapter = axiosInstance.defaults.adapter;

    this.handlers = getVerbObject();
    this.history = getVerbObject();

    this.delayResponse =
      options?.delayResponse ? Math.abs(options.delayResponse) : null;

    this.onNoMatch = options?.onNoMatch || "passThrough";
    axiosInstance.defaults.adapter = this.adapter();
    this.onGet = this.on('get')
    this.onAny = this.on('any')
    this.onPost = this.on('post')
    this.onHead = this.on('head')
    this.onDelete = this.on('delete')
    this.onPatch = this.on('patch')
    this.onPut = this.on('put')
    this.onOptions = this.on('options')
    this.onList = this.on('list')
    this.onLink = this.on('link')
    this.onUnlink = this.on('unlink')
  }

  assertAxiosInstance(
    axiosInstance: AxiosInstance
  ): asserts axiosInstance is AxiosInstance {
    if (!axiosInstance) {
      throw new Error("Please provide an instance of axios to mock");
    }
  }

  adapter = () => (config: AxiosRequestConfig): Promise<AxiosResponse> => {
    var mockAdapter = this;
    return new Promise((resolve, reject) => {
      handleRequest(mockAdapter, resolve, reject, config);
    });
  };

  restore() {
    if (this.axiosInstance) {
      this.axiosInstance.defaults.adapter = this.originalAdapter;
      this.axiosInstance = undefined;
    }
  }

  reset() {
    this.handlers = getVerbObject();
    this.history = getVerbObject();
  }

  resetHandlers() {
    this.handlers = getVerbObject();
  }

  resetHistory() {
    this.history = getVerbObject();
  }

  private on = (verb: VERBS_W_ANY) => (matcher: Matcher =/.*/ , body: any, requestHeaders: any) => {
    const reply = (codeOrFunction: number | Function, response = undefined, headers = undefined) => {
      var handler: Handler = [matcher, body, requestHeaders, codeOrFunction, response, headers];
      addHandler(verb, this.handlers, handler);
      return this;
    };
    
    const replyOnce = (codeOrFunction: number | Function, response = undefined, headers = undefined) => {
      var handler: Handler = [
        matcher,
        body,
        requestHeaders,
        codeOrFunction,
        response,
        headers,
        true,
      ];
      addHandler(verb, this.handlers, handler);
      return this;
    };
    return {
      reply: reply,

      replyOnce: replyOnce,

      passThrough: ()=> {
        var handler: Handler = [matcher, body];
        addHandler(verb, this.handlers, handler);
        return this;
      },

      abortRequest:  () => {
        return reply((config: TODO) => {
          var error = utils.createAxiosError(
            "Request aborted",
            config,
            undefined,
            "ECONNABORTED"
          );
          return Promise.reject(error);
        });
      },

      abortRequestOnce:  () => {
        return replyOnce((config: TODO) => {
          var error = utils.createAxiosError(
            "Request aborted",
            config,
            undefined,
            "ECONNABORTED"
          );
          return Promise.reject(error);
        });
      },

      networkError: () => {
        return reply((config:TODO) => {
          // @ts-expect-error
          var error = utils.createAxiosError("Network Error", config);
          return Promise.reject(error);
        });
      },

      networkErrorOnce: () => {
        return replyOnce((config: TODO) => {
          // @ts-expect-error
          var error = utils.createAxiosError("Network Error", config);
          return Promise.reject(error);
        });
      },

      timeout: () => {
        return reply((config: TODO) => {
          var error = utils.createAxiosError(
            config.timeoutErrorMessage ||
              "timeout of " + config.timeout + "ms exceeded",
            config,
            undefined,
            "ECONNABORTED"
          );
          return Promise.reject(error);
        });
      },

      timeoutOnce: () => {
        return replyOnce((config: TODO) => {
          var error = utils.createAxiosError(
            config.timeoutErrorMessage ||
              "timeout of " + config.timeout + "ms exceeded",
            config,
            undefined,
            "ECONNABORTED"
          );
          return Promise.reject(error);
        });
      },
    };
  }
}

const addHandler = (method:VERBS_W_ANY , handlers:Handlers, handler:Handler) => {
  if (method === "any") {
    VERBS.forEach(function (verb) {
      handlers[verb].push(handler);
    });
  } else {
    var indexOfExistingHandler = findInHandlers(method, handlers, handler);
    if (indexOfExistingHandler > -1 && handler.length < 7) {
      handlers[method].splice(indexOfExistingHandler, 1, handler);
    } else {
      handlers[method].push(handler);
    }
  }
};

function findInHandlers(method:VERBS, handlers: Handlers, handler:Handler) {
  var index = -1;
  for (var i = 0; i < handlers[method].length; i += 1) {
    var item = handlers[method][i];
    var isReplyOnce = item.length === 7;
    var comparePaths =
      item[0] instanceof RegExp && handler[0] instanceof RegExp
        ? String(item[0]) === String(handler[0])
        : item[0] === handler[0];
    var isSame =
      comparePaths &&
      utils.isEqual(item[1], handler[1]) &&
      utils.isEqual(item[2], handler[2]);
    if (isSame && !isReplyOnce) {
      index = i;
    }
  }
  return index;
}

export default MockAdapter;
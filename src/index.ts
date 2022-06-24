
import {
  AxiosAdapter,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { Handlers, History, TODO, VERBS, VERBS_W_ANY } from "./types";

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

const getVerbObject = <T>() => {
  return VERBS.reduce<T>((acc, verb) => {
    const newObj: T = { ...acc, [verb]: [] };
    return newObj;
  }, {} as T);
};

function findInHandlers(method, handlers, handler) {
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
type VerbHandlers = {
  [K in VERBS as `on${Capitalize<K>}`]: any
};

export class MockAdapter implements VerbHandlers {
  axiosInstance?: AxiosInstance;
  originalAdapter?: AxiosAdapter;
  delayResponse: number | null;
  onNoMatch: "throwException" | "passThrough";
  handlers: Handlers;
  history: History;

  constructor(axiosInstance: AxiosInstance, options?: TODO) {
    this.assertAxiosInstance(axiosInstance);
    this.handlers = getVerbObject<Handlers>();
    this.history = getVerbObject<History>();
    this.axiosInstance = axiosInstance;
    this.originalAdapter = axiosInstance.defaults.adapter;
    this.delayResponse =
      options?.delayResponse > 0 ? options.delayResponse : null;

    this.onNoMatch = options?.onNoMatch || "passThrough";
    axiosInstance.defaults.adapter = this.adapter();
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


  private on = (verb: VERBS_W_ANY) => (matcher:RegExp | string=/.*/ , body, requestHeaders) => {
    const reply = (code, response = undefined, headers = undefined) => {
      var handler = [matcher, body, requestHeaders, code, response, headers];
      addHandler(verb, this.handlers, handler);
      return this;
    };
    
    const replyOnce = (code, response = undefined, headers = undefined) => {
      var handler = [
        matcher,
        body,
        requestHeaders,
        code,
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

      passThrough:()=> {
        var handler = [matcher, body];
        addHandler(verb, this.handlers, handler);
        return this;
      },

      abortRequest: function () {
        return reply(function (config) {
          var error = utils.createAxiosError(
            "Request aborted",
            config,
            undefined,
            "ECONNABORTED"
          );
          return Promise.reject(error);
        });
      },

      abortRequestOnce: function () {
        return replyOnce(function (config) {
          var error = utils.createAxiosError(
            "Request aborted",
            config,
            undefined,
            "ECONNABORTED"
          );
          return Promise.reject(error);
        });
      },

      networkError: function () {
        return reply(function (config) {
          var error = utils.createAxiosError("Network Error", config);
          return Promise.reject(error);
        });
      },

      networkErrorOnce: function () {
        return replyOnce(function (config) {
          var error = utils.createAxiosError("Network Error", config);
          return Promise.reject(error);
        });
      },

      timeout: function () {
        return reply(function (config) {
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

      timeoutOnce: function () {
        return replyOnce(function (config) {
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
  onGet = this.on('get')
  onAny = this.on('any')
  onPost = this.on('post')
  onHead = this.on('head')
  onDelete = this.on('delete')
  onPatch = this.on('patch')
  onPut = this.on('put')
  onOptions = this.on('options')
  onList = this.on('list')
  onLink = this.on('link')
  onUnlink = this.on('unlink')
}

const addHandler = (method, handlers:Handlers, handler) => {
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

export default MockAdapter;
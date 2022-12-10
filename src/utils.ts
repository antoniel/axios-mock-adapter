import {isBlob as _isBlob} from "./is_blob";
var toString = Object.prototype.toString;

export const isBuffer = _isBuffer;
export const isBlob = _isBlob;
export const isEqual = _isEqual;
export function find(array, predicate) {
  var length = array.length;
  for (var i = 0; i < length; i++) {
    var value = array[i];
    if (predicate(value)) return value;
  }
}
function _isEqual(a, b) {
  if (a === b) return true;

  if (a && b && typeof a == 'object' && typeof b == 'object') {
    if (a.constructor !== b.constructor) return false;

    var length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0;)
        if (!_isEqual(a[i], b[i])) return false;
      return true;
    }



    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();

    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;

    for (i = length; i-- !== 0;)
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

    for (i = length; i-- !== 0;) {
      var key = keys[i];

      if (!_isEqual(a[key], b[key])) return false;
    }

    return true;
  }

  // true if both NaN, false otherwise
  return a!==a && b!==b;
}

function _isBuffer (obj) {
  return obj != null && obj.constructor != null &&
    typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

export function isFunction(val) {
  return toString.call(val) === "[object Function]";
}

export function isObjectOrArray(val) {
  return val !== null && typeof val === "object";
}

export function isStream(val) {
  return isObjectOrArray(val) && isFunction(val.pipe);
}

export function isArrayBuffer(val) {
  return toString.call(val) === "[object ArrayBuffer]";
}

export function combineUrls(baseURL, url) {
  if (baseURL) {
    return baseURL.replace(/\/+$/, "") + "/" + url.replace(/^\/+/, "");
  }

  return url;
}

export function findHandler(
  handlers,
  method,
  url,
  body,
  parameters,
  headers,
  baseURL
) {
  return find(handlers[method.toLowerCase()], function (handler) {
    if (typeof handler[0] === "string") {
      return (
        (isUrlMatching(url, handler[0]) ||
          isUrlMatching(combineUrls(baseURL, url), handler[0])) &&
        isBodyOrParametersMatching(method, body, parameters, handler[1]) &&
        isObjectMatching(headers, handler[2])
      );
    } else if (handler[0] instanceof RegExp) {
      return (
        (handler[0].test(url) || handler[0].test(combineUrls(baseURL, url))) &&
        isBodyOrParametersMatching(method, body, parameters, handler[1]) &&
        isObjectMatching(headers, handler[2])
      );
    }
  });
}

export function isUrlMatching(url, required) {
  var noSlashUrl = url[0] === "/" ? url.substr(1) : url;
  var noSlashRequired = required[0] === "/" ? required.substr(1) : required;
  return noSlashUrl === noSlashRequired;
}

export function isBodyOrParametersMatching(method, body, parameters, required) {
  var allowedParamsMethods = ["delete", "get", "head", "options"];
  if (allowedParamsMethods.indexOf(method.toLowerCase()) >= 0) {
    var data = required ? required.data : undefined;
    var params = required ? required.params : undefined;
    return isObjectMatching(parameters, params) && isBodyMatching(body, data);
  } else {
    return isBodyMatching(body, required);
  }
}

export function isObjectMatching(actual, expected) {
  if (expected === undefined) return true;
  if (typeof expected.asymmetricMatch === "function") {
    return expected.asymmetricMatch(actual);
  }
  return isEqual(actual, expected);
}

export function isBodyMatching(body, requiredBody) {
  if (requiredBody === undefined) {
    return true;
  }
  var parsedBody;
  try {
    parsedBody = JSON.parse(body);
  } catch (e) {}

  return isObjectMatching(parsedBody ? parsedBody : body, requiredBody);
}

export function purgeIfReplyOnce(mock, handler) {
  Object.keys(mock.handlers).forEach(function (key) {
    var index = mock.handlers[key].indexOf(handler);
    if (index > -1) {
      mock.handlers[key].splice(index, 1);
    }
  });
}

export function settle(resolve, reject, response, delay) {
  if (delay > 0) {
    setTimeout(settle, delay, resolve, reject, response);
    return;
  }

  if (
    !response.config.validateStatus ||
    response.config.validateStatus(response.status)
  ) {
    resolve(response);
  } else {
    reject(
          // @ts-expect-error
      createAxiosError(
        "Request failed with status code " + response.status,
        response.config,
        response
      )
    );
  }
}

export function createAxiosError(message, config, response, code) {
  var error = new Error(message);
          // @ts-expect-error
  error.isAxiosError = true;
          // @ts-expect-error
  error.config = config;
  if (response !== undefined) {
          // @ts-expect-error
    error.response = response;
  }
  if (code !== undefined) {
          // @ts-expect-error
    error.code = code;
  }

          // @ts-expect-error
  error.toJSON = function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code,
    };
  };
  return error;
}

export function createCouldNotFindMockError(config) {
  var message =
    "Could not find mock for: \n" +
    JSON.stringify(config, ["method", "url"], 2);
  var error = new Error(message);
          // @ts-expect-error
  error.isCouldNotFindMockError = true;
          // @ts-expect-error
  error.url = config.url;
          // @ts-expect-error
  error.method = config.method;
  return error;
}

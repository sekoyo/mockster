/* global window, Response */
import Route from 'route-parser';
import isEqual from 'lodash/isEqual';
import statuses from 'statuses';

const mocks = {};
const origFetch = window.fetch;

function objectContainsObject(object, containerObject) {
  return Object.keys(object).every(key => isEqual(object[key], containerObject[key]));
}

function getMockMatch(url, options = {}) {
  const method = options.method ? options.method.toLowerCase() : 'get';

  const mockUrl = Object.keys(mocks).find(urlKey =>
    mocks[urlKey][method] && mocks[urlKey][method].route.match(url));

  if (mockUrl) {
    const mock = mocks[mockUrl][method];

    // If there are options do a shallow check, otherwise use `optionEqualityCheck`.
    if (mock.options) {
      if (typeof mock.options === 'function' && !mock.options(options)) {
        return false;
      }

      if (!objectContainsObject(mock.options, options)) {
        return false;
      }
    }

    return mock;
  }

  return false;
}

function handleResponse(rawResponse, isRejected) {
  const body = rawResponse.body || rawResponse;
  const bodyString = JSON.stringify(body);

  const status = rawResponse.status || (isRejected ? 500 : 200);
  const statusText = rawResponse.statusText || statuses[status];

  const headers = rawResponse.headers || {
    'Content-Type': 'application/json',
    'Content-Length': bodyString.length,
  };

  const response = new Response(bodyString, {
    status,
    statusText,
    headers,
  });

  return response;
}

function isJSONRequest(headers = {}) {
  return Object.keys(headers).some(headerName =>
    headerName.toLowerCase() === 'content-type' &&
    headers[headerName] === 'application/json');
}

function fetchOverride(url, options = {}) {
  try {
    let formattedOptions = options;

    // Parse body passed to response fn for convenience if it's a JSON request.
    if (options.body && isJSONRequest(options.headers)) {
      try {
        formattedOptions = {
          ...options,
          body: JSON.parse(options.body),
        }
      } catch (error) {
        console.error('Could not parse JSON body', options);
      }
    }

    const mock = getMockMatch(url, formattedOptions);

    if (!mock) {
      const method = formattedOptions.method || 'GET';
      const error = new Error(`No mock found for ${method} ${url}`);
      error.url = url;
      error.options = formattedOptions;
      throw error;
    }

    const result = mock.response(url, mock.route.match(url), formattedOptions);

    if (!result) {
      throw new Error('The fetch mock function must return a Promise or object');
    }

    if (typeof result === 'object' && result.then) {
      return result.catch(r => handleResponse(r, true)).then(handleResponse);
    }

    return Promise.resolve(handleResponse(result));
  } catch (error) {
    return Promise.reject(error);
  }
}

const createMock = method => (url, response, options) =>
  (mocks[url] || (mocks[url] = {}))[method] = {
    url,
    response,
    route: new Route(url),
    options,
  };

const mockster = {
  delete: createMock('delete'),
  get: createMock('get'),
  patch: createMock('patch'),
  post: createMock('post'),
  put: createMock('put'),
};

function fetchUnmock(url, method) {
  if (mocks[url]) {
    delete mocks[url][method];
  }
}

function fetchHook() {
  window.fetch = fetchOverride;
}

function fetchUnhook() {
  window.fetch = origFetch;
}

fetchHook();

export {
  mockster as default,
  mockster,
  fetchUnmock,
  fetchHook,
  fetchUnhook,
};

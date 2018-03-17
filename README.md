Mockster
========

[![Mockster on NPM](https://img.shields.io/npm/v/mockster.svg)](https://www.npmjs.com/package/mockster)
[![Mockster on TravisCI](https://travis-ci.org/DominicTobias/mockster.svg?branch=master)](https://travis-ci.org/DominicTobias/mockster)

A library for mocking fetch responses.

Install
-------

```
npm i --save mockster
```

```js
import mockster from 'mockster';
```

**Note:** `window.fetch` is automatically mocked when including this library. It's a good idea to only include mocks in a mock build so this usually isn't an issue. If you need them the library also exports `fetchHook` and `fetchUnhook`, as well as `fetchUnmock(url, method)`.

Tip: You can include mocks in a webpack build with no extra config. Create a `mocks/index.js` file at your root and run `npm start -- mocks`.

Usage
-----

Supported methods: `delete`, `get`, `patch`, `post`, `put`.

```js
mockster.get('/film/:title?rating=:rating', (url, params) => {
  // params.title = 'batman'
  // params.rating = '8'
  return { something: 'to return' };
});

fetch('/film/batman?rating=8');
```

You can also return error responses using `status` and `body`. You can also return a custom `headers` object if you're response isn't JSON.

```js
mockster.post('/project/create', (url, params, options) => {
  if (options.body.name === 'Farting investigation') {
    return {
      status: 409,
      body: 'That project already exists',
    };
  }

  // An object without a `body` property is considered to be the body,
  // and the status will be 200 'OK'.
  return {
    ...options.body,
    id: '3250235H6',
  };
});

fetch('/project/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Hubot',
  }),
});

```

You can also return a Promise if you want to delay the response or do async work:

```js
mockster.get('/hello', () =>
  new Promise((resolve) => {
    setTimeout(() => resolve({ hello: 'world' }), 300);
  }));
```

Parameters
----------

Parameters are avaiable in the second arguments (params). URLs support params, splats, and optional segments.

| Example         | Description          |
| --------------- | -------- |
| `:name`         |  a parameter to capture from the route up to `/`, `?`, or end of string  |
| `*splat`        |  a splat to capture from the route up to `?` or end of string |
| `()`            |  Optional group that doesn't have to be part of the query. Can contain nested optional groups, params, and splats
| anything else   | free form literals |

Some examples:

* `/some/(optional/):thing`
* `/users/:id/comments/:comment/rating/:rating`
* `/*a/foo/*b`
* `/books/*section/:title`
* `/books?author=:author&subject=:subject`

Matching based on options
-------------------------

It is also possible to match based on options as well as the URL. A deep equal will be performed on the options you wish to compare:

```js
mockster.post('project/create', (url, params, options) => {
  return 'your response';
}, {
  body: {
    name: 'Billy Bob',
  }
});
```

Not all options will pass an equality check (for example [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)), to this effect options can also be a function:

```js
mockster.post('project/create', (url, params, options) => {
  return 'your response';
}, options => options.body.name.startsWith('Billy'));
```

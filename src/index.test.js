/* globals expect, fetch, test */
import 'whatwg-fetch';
import mockster from './index';

test('hooks the default GET method without params', async () => {
  let hookCalled = false;
  mockster.get('/hello', () => {
    hookCalled = true;
    return { hello: 'world' };
  });
  await fetch('/hello');
  expect(hookCalled).toBe(true);
});

test('hooks a named method', async () => {
  let hookCalled = false;
  mockster.delete('/hello', () => {
    hookCalled = true;
    return { hello: 'world' };
  });
  await fetch('/hello', { method: 'DELETE' });
  expect(hookCalled).toBe(true);
});

test('hooks based on an options equality check', async () => {
  const body = JSON.stringify({
    name: 'Hubot',
    login: 'hubot',
  });

  const notMatchingBody = JSON.stringify({
    name: 'Jason',
    login: 'Bourne',
  });

  mockster.post('/hello', () => ({ hello: 'world' }), { body });

  let error;

  // Not matching body.
  try {
    await fetch('/hello', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      notMatchingBody,
    });
  } catch (e) {
    error = e;
  }

  expect(error).toEqual(new Error('No mock found for /hello'));

  // Matching body.
  try {
    await fetch('/hello', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });
  } catch (e) {
    error = e;
  }

  expect(error).toEqual(new Error('No mock found for /hello'));
});

test('works with params', async () => {
  mockster.patch('/users/:id/comments/:comment/rating/:rating', (url, params) => {
    expect(params.id).toEqual('123456');
    expect(params.comment).toEqual('yFS35gdsgSLT');
    expect(params.rating).toEqual('4');
    return { hello: params.place };
  });
  await fetch('/users/123456/comments/yFS35gdsgSLT/rating/4', { method: 'patch' });
});

test('works with splats', async () => {
  mockster.get('/*a/foo/*b', (url, params) => {
    expect(params.a).toEqual('so/many/things');
    expect(params.b).toEqual('and/even/after');
    return { hello: params.place };
  });
  await fetch('/so/many/things/foo/and/even/after');
});

test('works with optional segments', async () => {
  mockster.get('/some/(optional/):thing', (url, params) => {
    expect(params.thing).toEqual('apple');
    return { hello: params.place };
  });
  await fetch('/some/optional/apple');
});

test('works with query strings', async () => {
  mockster.get('/books?author=:author&subject=:subject', (url, params) => {
    expect(params.author).toEqual('DominicTobias');
    expect(params.subject).toEqual('coding');
    return { hello: params.place };
  });
  await fetch('/books?author=DominicTobias&subject=coding');
});

test('can use custom options equality checks', async () => {
  const body = JSON.stringify({
    name: 'Hubot Haxbridge',
    login: 'hubot',
  });

  mockster.post('/hello', () => ({ hello: 'world' }), (options) => {
    return options.body.name.startsWith('Hubot');
  });

  await fetch('/hello', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });
});

test('can use test JSON bodies as objects', async () => {
  const body = JSON.stringify({
    name: 'Hubot Haxbridge',
    login: 'hubot',
  });

  mockster.post('/hello', () => ({ hello: 'world' }), (options) => {
    return options.body.name.startsWith('Hubot');
  });

  await fetch('/hello', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  }, {
    body: {
      name: 'Hubot Haxbridge',
      login: 'hubot',
    },
  });
});

test('can return a promise', async () => {
  mockster.get('/hello', () =>
    new Promise((resolve) => {
      setTimeout(() => resolve({ hello: 'world' }), 10);
    }));

  await fetch('/hello')
    .then(res => res.json())
    .then(res => expect(res).toEqual({ hello: 'world' }));
});

test('can specify a status and statusText', async () => {
  mockster.get('/hello', () => ({
    body: 'You dont\'t have permission to access this resource.',
    status: 401,
    statusText: 'Unauthorized',
  }));

  const res = await fetch('/hello');

  expect(res.status).toEqual(401);
  expect(res.statusText).toEqual('Unauthorized');
  const body = await res.json();
  expect(body).toEqual('You dont\'t have permission to access this resource.');
});

test('parses JSON body for convenient use in response function', async () => {
  mockster.post('project/create', (url, params, options) => {
    expect(options.body.name).toEqual('Hubot');
    return 'Parsed';
  });

  await fetch('project/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Hubot',
    }),
  });
});

test('returns a predefined statusText message if one isn\'t provided', async () => {
  let res;

  mockster.get('/test', () => ({
    status: 404,
    body: 'Something occured',
  }));
  res = await fetch('/test');
  expect(res.statusText).toEqual('Not Found');

  mockster.get('/test', () => ({
    status: 422,
    body: 'Something occured',
  }));
  res = await fetch('/test');
  expect(res.statusText).toEqual('Unprocessable Entity');
});

import test from 'node:test';
import assert from 'node:assert/strict';

process.env.MONGO_URI ??= 'mongodb://localhost:27017/test';
process.env.JWT_ACCESS_SECRET ??= 'test_access_secret';
process.env.JWT_REFRESH_SECRET ??= 'test_refresh_secret';

const { default: app } = await import('../dist/app.js');

test('app exposes express instance', () => {
    assert.equal(typeof app.listen, 'function');
});

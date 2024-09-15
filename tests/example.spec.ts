import { test } from '@japa/runner'

test.group('Example', () => {
  test('return filtered objects', ({ assert }) => {
    assert.equal(1 + 1, 2)
  })
})

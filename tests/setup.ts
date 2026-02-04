/**
 * Test Setup
 *
 * A place to register logic that should run before the tests run.
 * e.g. you may abstract your module mocks here, if you want
 * to prevent the original module from being evaluated.
 */

try {
  const { setupTestEnvironment } = await import('@stacksjs/testing')
  setupTestEnvironment()
} catch (error) {
  // Framework testing setup not available, running tests without it
  console.warn('[Test Setup] Framework testing environment not available, running with minimal setup')
}

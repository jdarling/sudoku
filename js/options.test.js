/**
 * Tests for options.js
 *
 * NOTE: options.js uses localStorage which is a browser-only API.
 * The functions loadOptions() and saveOptions() cannot be tested in the
 * Node.js test harness. Only createDefaultOptions() and updateOption()
 * are pure and could be tested, but they are trivially simple wrappers.
 *
 * Integration testing should be done manually in the browser by:
 * 1. Opening the Options modal and changing a setting
 * 2. Refreshing the page
 * 3. Confirming the setting persisted
 */

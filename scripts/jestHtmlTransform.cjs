/**
 * Jest transform that loads an .html file as a string, so page tests run against the real
 * markup of the popup and the settings page.
 */
module.exports = {
  process(source) {
    return { code: `module.exports = ${JSON.stringify(source)};` };
  },
};

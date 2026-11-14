/**
 * Checks on the build output: which source files the page-side bundle contains (NFR2.2) and
 * whether the manifest asks for more than it needs (NFR2.5).
 */

/** The page-side collector may use only its own folder and the shared types and contracts. */
const CONTENT_ALLOWED_PREFIXES = ['src/content/', 'src/shared/types.ts', 'src/shared/contracts.ts'];

/** Returns the bundled source files that the page-side collector is not allowed to hold. */
function disallowedContentInputs(inputPaths) {
  return inputPaths
    .map((input) => input.replace(/\\/g, '/'))
    .filter((input) => !input.startsWith('node_modules/'))
    .filter((input) => !CONTENT_ALLOWED_PREFIXES.some((prefix) => input.startsWith(prefix)));
}

const EXPECTED_PERMISSIONS = ['storage', 'tabs'];

/** Returns a list of problems; empty when the manifest asks for exactly what the design allows. */
function manifestProblems(manifest) {
  const problems = [];
  if (manifest.manifest_version !== 3) problems.push('manifest_version must be 3');
  const permissions = [...(manifest.permissions ?? [])].sort();
  if (JSON.stringify(permissions) !== JSON.stringify(EXPECTED_PERMISSIONS)) {
    problems.push(`permissions must be exactly ${EXPECTED_PERMISSIONS.join(', ')}`);
  }
  if ((manifest.host_permissions ?? []).length > 0) {
    problems.push(
      'no host permission may be granted at install; the server address is requested when saved',
    );
  }
  if (
    JSON.stringify(manifest.optional_host_permissions ?? []) !== JSON.stringify(['https://*/*'])
  ) {
    problems.push('optional_host_permissions must be https only');
  }
  for (const script of manifest.content_scripts ?? []) {
    const insecure = (script.matches ?? []).filter((match) => !/^https?:\/\/\*\/\*$/.test(match));
    if (insecure.length > 0) problems.push('content scripts may match only http and https pages');
    if (script.all_frames === true) problems.push('the collector must not run in frames');
  }
  return problems;
}

module.exports = {
  disallowedContentInputs,
  manifestProblems,
  CONTENT_ALLOWED_PREFIXES,
  EXPECTED_PERMISSIONS,
};

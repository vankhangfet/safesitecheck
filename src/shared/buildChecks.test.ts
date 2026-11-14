import manifest from '../../manifest.json';

interface KeyScan {
  findKeyShapedText(text: string): Array<{ line: number; pattern: string }>;
}
interface CheckBuild {
  disallowedContentInputs(inputs: string[]): string[];
  manifestProblems(manifest: unknown): string[];
}

const keyScan = jest.requireActual<KeyScan>('../../scripts/keyScan.cjs');
const checkBuild = jest.requireActual<CheckBuild>('../../scripts/checkBuild.cjs');

// The samples are put together here, so this file itself holds no key-shaped text.
const prefixedKey = ['sk', 'a1B2c3D4e5F6g7H8i9J0k1L2'].join('-');
const bearerLine = `Authorization: ${['Bearer', 'abcDEF123456abcDEF123456'].join(' ')}`;
const longToken = `${'a1b2'.repeat(12)}`;

describe('key scan (NFR2.6)', () => {
  it('finds key-shaped text and says where, without repeating it', () => {
    const findings = keyScan.findKeyShapedText(
      ['const a = 1;', `const k = "${prefixedKey}";`, bearerLine, longToken].join('\n'),
    );
    expect(findings.map((f) => f.line)).toEqual(expect.arrayContaining([2, 3, 4]));
    expect(JSON.stringify(findings)).not.toContain(prefixedKey);
  });

  it('leaves ordinary code, the fake test key and request templates alone', () => {
    const text = [
      "const FAKE_KEY = 'fake-test-key-1';",
      'headers: { Authorization: `Bearer ${connection.key}` },',
      "const url = 'https://api.typesafe.ai/v1/systemone';",
      '// -----------------------------------------------------------------',
      'function createSettingsManagerForTheBackgroundProcess() {}',
    ].join('\n');
    expect(keyScan.findKeyShapedText(text)).toEqual([]);
  });
});

describe('page-side bundle check (NFR2.2, logical components)', () => {
  it('accepts the collector, shared types and contracts', () => {
    expect(
      checkBuild.disallowedContentInputs([
        'src/content/content.ts',
        'src/content/collector.ts',
        'src/shared/types.ts',
        'src/shared/contracts.ts',
      ]),
    ).toEqual([]);
  });

  it('refuses the settings module and anything else that could reach the key', () => {
    const refused = checkBuild.disallowedContentInputs([
      'src/content/content.ts',
      'src\\background\\settingsManager.ts',
      'src/adapters/jevAdapter.ts',
      'src/shared/browser.ts',
    ]);
    expect(refused).toEqual([
      'src/background/settingsManager.ts',
      'src/adapters/jevAdapter.ts',
      'src/shared/browser.ts',
    ]);
  });
});

describe('manifest permissions (NFR2.5)', () => {
  it('asks only for storage and tabs, with https server access requested later', () => {
    expect(checkBuild.manifestProblems(manifest)).toEqual([]);
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.permissions).toEqual(['storage', 'tabs']);
    expect(manifest.optional_host_permissions).toEqual(['https://*/*']);
    expect(manifest.content_scripts[0].matches).toEqual(['http://*/*', 'https://*/*']);
    expect(manifest.content_scripts[0].all_frames).toBe(false);
  });

  it('reports a manifest that asks for more', () => {
    const greedy = {
      manifest_version: 3,
      permissions: ['storage', 'tabs', 'history'],
      host_permissions: ['<all_urls>'],
      optional_host_permissions: ['https://*/*'],
      content_scripts: [{ matches: ['<all_urls>'], all_frames: true }],
    };
    expect(checkBuild.manifestProblems(greedy)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('permissions must be exactly'),
        expect.stringContaining('no host permission'),
        expect.stringContaining('only http and https'),
        expect.stringContaining('frames'),
      ]),
    );
  });
});

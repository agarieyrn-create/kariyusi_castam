import { beforeEach, describe, expect, it } from 'vitest';
import { generateShareUrl, loadFromUrl, validateSharePayload, SHARE_SCHEMA_VERSION } from '../../scripts/design-store.js';

describe('versioned share schema', () => {
  beforeEach(() => { globalThis.window = { location: { href: 'https://example.test/studio' } }; });
  it('preserves brief, edit, model and fabric JSON through a full round trip', () => {
    const input = { brief: { scene: '式場', quantity: 80 }, edit: { palette: '琉球レッド', density: 72 }, model: { height: 181 }, fabricJson: '{"objects":[]}' };
    const decoded = loadFromUrl(generateShareUrl(input));
    expect(decoded).toMatchObject({ schema: 'kariyushi-share', version: SHARE_SCHEMA_VERSION, ...input });
  });
  it('rejects unknown schema versions', () => { expect(validateSharePayload({ schema: 'kariyushi-share', version: 1, brief: {} })).toBeNull(); });
});

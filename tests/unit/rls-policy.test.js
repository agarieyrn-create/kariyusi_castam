import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('RLS policy contract', () => {
  it('does not permit anonymous broad reads or ALL access', () => {
    const sql = readFileSync(resolve(process.cwd(), 'db/schema.sql'), 'utf8');
    expect(sql).not.toMatch(/for select to anon using \(true\)/i);
    expect(sql).not.toMatch(/for all to anon/i);
    expect(sql).toContain('app.current_session_id()');
    expect(sql).toContain('owner or signed session');
  });
});

import { dependencies } from '../../package.json';
import licenses from './licenses.json';

describe('licenses.json', () => {
  it('lists every direct runtime dependency (workspace packages excluded)', () => {
    const listed = new Set(licenses.map((entry) => ('package' in entry ? entry.package : undefined)));
    const missing = Object.entries(dependencies)
      .filter(([, version]) => !version.startsWith('workspace:'))
      .map(([name]) => name)
      .filter((name) => !listed.has(name));
    expect(missing).toEqual([]);
  });
});

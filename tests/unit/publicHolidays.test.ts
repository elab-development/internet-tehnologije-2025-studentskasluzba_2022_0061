import { afterEach, describe, expect, it, vi } from 'vitest';

type MockFetchResponse = {
  ok: boolean;
  status: number;
  body: unknown;
};

function createFetchResponse({ ok, status, body }: MockFetchResponse): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function loadModule() {
  vi.resetModules();
  return import('@/lib/publicHolidays');
}

describe('findHolidayConflicts (unit)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.NAGER_DATE_API_BASE_URL;
    delete process.env.NAGER_DATE_COUNTRY_CODE;
  });

  it('returns empty array for empty input', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { findHolidayConflicts } = await loadModule();

    const result = await findHolidayConflicts([]);

    expect(result).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns a conflict when date is a holiday', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createFetchResponse({
        ok: true,
        status: 200,
        body: [{ date: '2026-01-01', localName: 'Nova godina', name: 'New Year' }],
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const { findHolidayConflicts } = await loadModule();

    const result = await findHolidayConflicts([
      { label: 'Pocetak perioda', date: new Date('2026-01-01T10:00:00Z') },
    ]);

    expect(result).toEqual([
      {
        label: 'Pocetak perioda',
        isoDate: '2026-01-01',
        holidayName: 'Nova godina',
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/PublicHolidays/2026/RS'),
      { cache: 'no-store' }
    );
  });

  it('returns empty array when date is not a holiday', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createFetchResponse({
        ok: true,
        status: 200,
        body: [{ date: '2026-05-01', localName: 'Praznik rada', name: 'Labor Day' }],
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const { findHolidayConflicts } = await loadModule();

    const result = await findHolidayConflicts([
      { label: 'Kraj perioda', date: new Date('2026-01-15T10:00:00Z') },
    ]);

    expect(result).toEqual([]);
  });

  it('returns empty array when holiday API fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createFetchResponse({
        ok: false,
        status: 500,
        body: { error: 'boom' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const { findHolidayConflicts } = await loadModule();

    const result = await findHolidayConflicts([
      { label: 'Provera', date: new Date('2026-06-01T10:00:00Z') },
    ]);

    expect(result).toEqual([]);
  });

  it('loads each year only once for multi-year input', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/2026/')) {
        return Promise.resolve(
          createFetchResponse({
            ok: true,
            status: 200,
            body: [{ date: '2026-01-01', localName: 'Nova godina', name: 'New Year' }],
          })
        );
      }

      return Promise.resolve(
        createFetchResponse({
          ok: true,
          status: 200,
          body: [{ date: '2027-01-01', localName: 'Nova godina', name: 'New Year' }],
        })
      );
    });
    vi.stubGlobal('fetch', fetchMock);
    const { findHolidayConflicts } = await loadModule();

    const result = await findHolidayConflicts([
      { label: 'A', date: new Date('2026-01-01T10:00:00Z') },
      { label: 'B', date: new Date('2027-01-01T10:00:00Z') },
    ]);

    expect(result).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reuses in-memory cache for repeated calls in same year', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createFetchResponse({
        ok: true,
        status: 200,
        body: [{ date: '2028-01-01', localName: 'Nova godina', name: 'New Year' }],
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    const { findHolidayConflicts } = await loadModule();

    const first = await findHolidayConflicts([
      { label: 'Prvi poziv', date: new Date('2028-01-01T10:00:00Z') },
    ]);
    const second = await findHolidayConflicts([
      { label: 'Drugi poziv', date: new Date('2028-01-01T10:00:00Z') },
    ]);

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

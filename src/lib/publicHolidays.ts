type NagerHoliday = {
  date: string;
  localName: string;
  name: string;
};

export type HolidayConflict = {
  label: string;
  isoDate: string;
  holidayName: string;
};

type CheckInput = {
  label: string;
  date: Date;
};

//mogu se overridovvati sa env promenljivama
const DEFAULT_BASE_URL = 'https://date.nager.at/api/v3';
const DEFAULT_COUNTRY_CODE = 'RS';
const BELGRADE_TZ = 'Europe/Belgrade';

// jednostavan cache dict za smanjivanje poziva
const holidayCache = new Map<string, Map<string, string>>();

function formatDateInBelgrade(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BELGRADE_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const day = parts.find(part => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Greska pri formatiranju datuma.');
  }

  return `${year}-${month}-${day}`;
}

//poziva api i kesira rezultat
async function loadHolidaysForYear(year: string): Promise<Map<string, string>> {
  const countryCode = process.env.NAGER_DATE_COUNTRY_CODE ?? DEFAULT_COUNTRY_CODE;
  const baseUrl = process.env.NAGER_DATE_API_BASE_URL ?? DEFAULT_BASE_URL;
  const cacheKey = `${countryCode}-${year}`;
  const cached = holidayCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const endpoint = `${baseUrl}/PublicHolidays/${year}/${countryCode}`;
  const response = await fetch(endpoint, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Nager.Date responded with ${response.status}.`);
  }

  const holidays = await response.json() as NagerHoliday[];
  const byDate = new Map<string, string>(
    holidays.map(holiday => [holiday.date, holiday.localName || holiday.name])
  );

  holidayCache.set(cacheKey, byDate);
  return byDate;
}


//proverava za dat input (pocetak i kraj period) da li postoje prazinici i vraca listu konflikata
export async function findHolidayConflicts(inputs: CheckInput[]): Promise<HolidayConflict[]> {
  if (inputs.length === 0) {
    return [];
  }

  const normalized = inputs.map(input => ({
    label: input.label,
    dateKey: formatDateInBelgrade(input.date),
  }));

  const years = [...new Set(normalized.map(item => item.dateKey.slice(0, 4)))];

  try {
    const holidayMaps = await Promise.all(
      years.map(async year => [year, await loadHolidaysForYear(year)] as const)
    );
    const byYear = new Map<string, Map<string, string>>(holidayMaps);

    return normalized
      .map(item => {
        const yearMap = byYear.get(item.dateKey.slice(0, 4));
        const holidayName = yearMap?.get(item.dateKey);

        if (!holidayName) {
          return null;
        }

        return {
          label: item.label,
          isoDate: item.dateKey,
          holidayName,
        };
      })
      .filter((value): value is HolidayConflict => value !== null);
  } catch {
    //za slucaj da nager date ne radi, ne zelimo da se cela funkcionalnost pokvari, pa samo vracamo prazan niz 
    return [];
  }
}

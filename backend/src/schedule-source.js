const https = require('https');

const DEFAULT_SCHEDULE_URL =
  'https://gvmh-schedule-automator.vercel.app/api/calendar?format=public-schedule';
const CACHE_DURATION = 5 * 60 * 1000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const SHIFT_ORDER = new Map([
  ['7a-7p', 0],
  ['10a-10p', 1],
  ['7p-7a', 2]
]);

let feedCache = null;
let feedCacheTime = 0;

function scheduleUrl() {
  return process.env.SCHEDULE_AUTOMATOR_URL || DEFAULT_SCHEDULE_URL;
}

function requestJson(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error('Too many schedule feed redirects'));
      return;
    }

    const request = https.get(url, {
      headers: {
        accept: 'application/json',
        'user-agent': 'gvmh-provider-dashboard/1.0'
      }
    }, (response) => {
      if (
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        response.resume();
        const nextUrl = new URL(response.headers.location, url).toString();
        requestJson(nextUrl, redirectCount + 1).then(resolve, reject);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Schedule Automator returned HTTP ${response.statusCode}`));
        return;
      }

      let body = '';
      let size = 0;
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        size += Buffer.byteLength(chunk);
        if (size > MAX_RESPONSE_BYTES) {
          response.destroy(new Error('Schedule Automator response was too large'));
          return;
        }
        body += chunk;
      });
      response.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error('Schedule Automator returned invalid JSON'));
        }
      });
      response.on('error', reject);
    });

    request.setTimeout(15000, () => {
      request.destroy(new Error('Schedule Automator request timed out'));
    });
    request.on('error', reject);
  });
}

function validateFeed(feed) {
  if (!feed || feed.schemaVersion !== 1 || !Array.isArray(feed.months)) {
    throw new Error('Schedule Automator returned an unsupported schedule format');
  }

  for (const month of feed.months) {
    if (
      !Number.isInteger(month.year) ||
      !Number.isInteger(month.month) ||
      month.month < 1 ||
      month.month > 12 ||
      !Array.isArray(month.shifts)
    ) {
      throw new Error('Schedule Automator returned an invalid published month');
    }
  }

  return feed;
}

async function fetchPublishedSchedule(options = {}) {
  const now = Date.now();
  if (
    !options.force &&
    feedCache &&
    now - feedCacheTime < CACHE_DURATION
  ) {
    return feedCache;
  }

  const feed = validateFeed(await requestJson(scheduleUrl()));
  feedCache = feed;
  feedCacheTime = now;
  return feed;
}

function listScheduleMonths(feed) {
  validateFeed(feed);
  return feed.months
    .map((month) => ({
      month: MONTH_NAMES[month.month - 1],
      year: month.year,
      label: `${MONTH_NAMES[month.month - 1]} ${month.year}`,
      publishedAt: month.publishedAt || null
    }))
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return MONTH_NAMES.indexOf(a.month) - MONTH_NAMES.indexOf(b.month);
    });
}

function findPublishedMonth(feed, monthName, year) {
  validateFeed(feed);
  const monthNumber = MONTH_NAMES.indexOf(monthName) + 1;
  const yearNumber = Number(year);
  if (!monthNumber || !Number.isInteger(yearNumber)) return null;

  return feed.months.find(
    (month) => month.month === monthNumber && month.year === yearNumber
  ) || null;
}

function buildCalendarMonth(feed, monthName, year) {
  const publishedMonth = findPublishedMonth(feed, monthName, year);
  if (!publishedMonth) return null;

  const monthIndex = publishedMonth.month - 1;
  const daysInMonth = new Date(Date.UTC(publishedMonth.year, publishedMonth.month, 0)).getUTCDate();
  const calendar = {};

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(Date.UTC(publishedMonth.year, monthIndex, day));
    calendar[day] = {
      dayOfWeek: date.toLocaleDateString('en-US', {
        weekday: 'long',
        timeZone: 'UTC'
      }).toLowerCase(),
      dayIndex: date.getUTCDay(),
      providers: [],
      shifts: []
    };
  }

  for (const shift of publishedMonth.shifts) {
    if (
      !shift ||
      typeof shift.date !== 'string' ||
      typeof shift.shift !== 'string' ||
      typeof shift.provider !== 'string' ||
      !shift.provider.trim()
    ) {
      continue;
    }

    const dateMatch = shift.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!dateMatch) continue;
    const shiftYear = Number(dateMatch[1]);
    const shiftMonth = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    if (
      shiftYear !== publishedMonth.year ||
      shiftMonth !== publishedMonth.month ||
      !calendar[day]
    ) {
      continue;
    }

    calendar[day].shifts.push({
      shift: shift.shift,
      provider: shift.provider.trim(),
      ...(shift.adjust ? { adjust: shift.adjust } : {})
    });
  }

  for (const day of Object.values(calendar)) {
    day.shifts.sort((a, b) => {
      const aOrder = SHIFT_ORDER.has(a.shift) ? SHIFT_ORDER.get(a.shift) : 99;
      const bOrder = SHIFT_ORDER.has(b.shift) ? SHIFT_ORDER.get(b.shift) : 99;
      return aOrder - bOrder || a.shift.localeCompare(b.shift);
    });
    day.providers = day.shifts.map((shift) => shift.provider);
  }

  const populatedDays = Object.values(calendar).filter(
    (day) => day.providers.length > 0
  );

  return {
    month: monthName,
    year: publishedMonth.year,
    calendar,
    source: 'gvmh-schedule-automator',
    publishedAt: publishedMonth.publishedAt || null,
    generatedAt: feed.generatedAt || null,
    verification: {
      totalDays: daysInMonth,
      daysWithProviders: populatedDays.length,
      shiftCount: populatedDays.reduce(
        (count, day) => count + day.shifts.length,
        0
      )
    }
  };
}

function resetScheduleCache() {
  feedCache = null;
  feedCacheTime = 0;
}

module.exports = {
  DEFAULT_SCHEDULE_URL,
  MONTH_NAMES,
  SHIFT_ORDER,
  buildCalendarMonth,
  fetchPublishedSchedule,
  findPublishedMonth,
  listScheduleMonths,
  resetScheduleCache,
  validateFeed
};

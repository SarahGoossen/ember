export type PlanReminderRepeat =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "every-4-hours"
  | "every-6-hours"
  | "custom-hours";

export type ReminderScheduleItem = {
  dateKey: string;
  time: string;
  reminder: boolean;
  repeat: PlanReminderRepeat;
  customRepeatHours: number | null;
  lastReminderKey: string | null;
};

export type ReminderOccurrence = {
  dueAt: number;
  reminderKey: string;
};

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCustomRepeatHours(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 8;
  }

  return Math.min(24, Math.max(1, Math.round(value)));
}

export function buildLocalDateTime(dateKey: string, time: string) {
  return new Date(`${dateKey}T${time}:00`);
}

function getWeekStartKey(date: Date) {
  const weekStart = new Date(date);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  return getLocalDateKey(weekStart);
}

function createDateAtTime(date: Date, time: string) {
  const [hoursText, minutesText] = time.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function createMonthOccurrence(
  year: number,
  monthIndex: number,
  dayOfMonth: number,
  time: string,
) {
  const candidate = new Date(year, monthIndex, dayOfMonth);

  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== monthIndex ||
    candidate.getDate() !== dayOfMonth
  ) {
    return null;
  }

  return createDateAtTime(candidate, time);
}

function createYearOccurrence(
  year: number,
  monthIndex: number,
  dayOfMonth: number,
  time: string,
) {
  return createMonthOccurrence(year, monthIndex, dayOfMonth, time);
}

export function getNextReminderOccurrence(
  item: ReminderScheduleItem,
  now: Date,
): ReminderOccurrence | null {
  if (!item.reminder) {
    return null;
  }

  const startDate = buildLocalDateTime(item.dateKey, item.time);
  const startMs = startDate.getTime();

  if (Number.isNaN(startMs)) {
    return null;
  }

  if (item.repeat === "none") {
    const reminderKey = item.dateKey;

    if (now.getTime() < startMs) {
      return { dueAt: startMs, reminderKey };
    }

    if (getLocalDateKey(now) === item.dateKey && item.lastReminderKey !== reminderKey) {
      return { dueAt: now.getTime(), reminderKey };
    }

    return null;
  }

  if (item.repeat === "daily") {
    const todayCandidate = createDateAtTime(now, item.time);

    if (!todayCandidate) {
      return null;
    }

    if (todayCandidate.getTime() < startMs) {
      return { dueAt: startMs, reminderKey: item.dateKey };
    }

    const todayKey = getLocalDateKey(todayCandidate);

    if (todayCandidate.getTime() <= now.getTime() && item.lastReminderKey !== todayKey) {
      return { dueAt: now.getTime(), reminderKey: todayKey };
    }

    if (todayCandidate.getTime() > now.getTime()) {
      return { dueAt: todayCandidate.getTime(), reminderKey: todayKey };
    }

    const tomorrowCandidate = new Date(todayCandidate);
    tomorrowCandidate.setDate(tomorrowCandidate.getDate() + 1);
    return {
      dueAt: tomorrowCandidate.getTime(),
      reminderKey: getLocalDateKey(tomorrowCandidate),
    };
  }

  if (item.repeat === "weekly") {
    const currentWeekCandidate = createDateAtTime(now, item.time);

    if (!currentWeekCandidate) {
      return null;
    }

    currentWeekCandidate.setDate(
      currentWeekCandidate.getDate() - currentWeekCandidate.getDay() + startDate.getDay(),
    );

    if (currentWeekCandidate.getTime() < startMs) {
      return { dueAt: startMs, reminderKey: getWeekStartKey(startDate) };
    }

    const currentWeekKey = getWeekStartKey(currentWeekCandidate);

    if (
      currentWeekCandidate.getTime() <= now.getTime() &&
      item.lastReminderKey !== currentWeekKey
    ) {
      return { dueAt: now.getTime(), reminderKey: currentWeekKey };
    }

    if (currentWeekCandidate.getTime() > now.getTime()) {
      return { dueAt: currentWeekCandidate.getTime(), reminderKey: currentWeekKey };
    }

    const nextWeekCandidate = new Date(currentWeekCandidate);
    nextWeekCandidate.setDate(nextWeekCandidate.getDate() + 7);
    return {
      dueAt: nextWeekCandidate.getTime(),
      reminderKey: getWeekStartKey(nextWeekCandidate),
    };
  }

  if (item.repeat === "monthly") {
    for (let offset = 0; offset < 24; offset += 1) {
      const candidate = createMonthOccurrence(
        now.getFullYear(),
        now.getMonth() + offset,
        startDate.getDate(),
        item.time,
      );

      if (!candidate || candidate.getTime() < startMs) {
        continue;
      }

      const reminderKey = `${candidate.getFullYear()}-${String(candidate.getMonth() + 1).padStart(2, "0")}`;

      if (
        offset === 0 &&
        candidate.getTime() <= now.getTime() &&
        item.lastReminderKey !== reminderKey
      ) {
        return { dueAt: now.getTime(), reminderKey };
      }

      if (candidate.getTime() > now.getTime()) {
        return { dueAt: candidate.getTime(), reminderKey };
      }
    }

    return null;
  }

  if (item.repeat === "yearly") {
    for (let offset = 0; offset < 5; offset += 1) {
      const candidate = createYearOccurrence(
        now.getFullYear() + offset,
        startDate.getMonth(),
        startDate.getDate(),
        item.time,
      );

      if (!candidate || candidate.getTime() < startMs) {
        continue;
      }

      const reminderKey = String(candidate.getFullYear());

      if (
        offset === 0 &&
        candidate.getTime() <= now.getTime() &&
        item.lastReminderKey !== reminderKey
      ) {
        return { dueAt: now.getTime(), reminderKey };
      }

      if (candidate.getTime() > now.getTime()) {
        return { dueAt: candidate.getTime(), reminderKey };
      }
    }

    return null;
  }

  const intervalHours =
    item.repeat === "every-4-hours"
      ? 4
      : item.repeat === "every-6-hours"
        ? 6
        : getCustomRepeatHours(item.customRepeatHours);
  const intervalMs = intervalHours * 60 * 60 * 1000;

  if (now.getTime() < startMs) {
    return {
      dueAt: startMs,
      reminderKey: `${item.repeat}-${intervalHours}-0`,
    };
  }

  const elapsedIntervals = Math.floor((now.getTime() - startMs) / intervalMs);
  const currentReminderKey = `${item.repeat}-${intervalHours}-${elapsedIntervals}`;

  if (item.lastReminderKey !== currentReminderKey) {
    return { dueAt: now.getTime(), reminderKey: currentReminderKey };
  }

  const nextIntervalIndex = elapsedIntervals + 1;
  return {
    dueAt: startMs + nextIntervalIndex * intervalMs,
    reminderKey: `${item.repeat}-${intervalHours}-${nextIntervalIndex}`,
  };
}

export function summarizeReminderMessage(names: string[]) {
  if (names.length === 0) {
    return "";
  }

  if (names.length === 1) {
    return `Time for: ${names[0]}`;
  }

  if (names.length === 2) {
    return `Time for: ${names[0]} and ${names[1]}`;
  }

  return `Time for: ${names[0]}, ${names[1]}, and ${names.length - 2} more`;
}

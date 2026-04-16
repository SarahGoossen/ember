"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import {
  getCustomRepeatHours,
  getNextReminderOccurrence,
  summarizeReminderMessage,
  type PlanReminderRepeat,
  type ReminderOccurrence,
} from "@/lib/push-reminders";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PushState = "checking" | "unsupported" | "off" | "on" | "setting-up";

function getInitialPushState(): PushState {
  if (typeof window === "undefined") {
    return "checking";
  }

  return "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
    ? "off"
    : "unsupported";
}

type TabId = "home" | "coach" | "journey" | "resource" | "profile";

type Activity = {
  id: number;
  name: string;
  duration: number;
  completed: boolean;
  loggedSeconds: number;
  timerStartedAt: string | null;
  lowEnergy?: boolean;
  reminder: boolean;
  reminderTime: string;
  repeat: PlanReminderRepeat;
  customRepeatHours: number | null;
  reminderStartDateKey: string;
  lastReminderKey: string | null;
  history: ActivityHistoryEntry[];
};

type ActivityHistoryEntry = {
  dateKey: string;
  completed: boolean;
  loggedSeconds: number;
  timerStartedAt: string | null;
};

type SmallGoal = {
  id: number;
  dateKey: string;
  title: string;
  completed: boolean;
  loggedSeconds: number;
  timerStartedAt: string | null;
};

type CheckIn = {
  id: number;
  dateKey: string;
  timestamp: string;
  feeling: string;
  note: string;
  date: string;
  energyLevel?: "Good" | "Okay" | "Low";
  completedActivities: Array<{
    name: string;
    duration: number;
  }>;
  completedMinutes: number;
};

type Resource = {
  id: number;
  title: string;
  url: string;
  note: string;
  tags: string[];
};

type PlanItem = {
  id: number;
  dateKey: string;
  title: string;
  time: string;
  note: string;
  completed: boolean;
  reminder: boolean;
  repeat: PlanReminderRepeat;
  customRepeatHours: number | null;
  lastReminderKey: string | null;
};

type Profile = {
  name: string;
  weight: string;
  bloodPressure: string;
  heartRate: string;
  notes: string;
};

type EmberCloudSnapshot = {
  version: 1;
  activities: Activity[];
  checkIns: CheckIn[];
  resources: Resource[];
  planItems: PlanItem[];
  profile: Profile;
  smallGoals: SmallGoal[];
  onboardingDismissed: boolean;
};

type EmberCloudRow = {
  data: Partial<EmberCloudSnapshot> | null;
  updated_at: string | null;
};

const inspireMoments = [
  {
    quote: "A bright start can begin right here.",
    note: "One good step is enough to get moving.",
  },
  {
    quote: "Today has something good in it for you.",
    note: "Go meet it with one small move.",
  },
  {
    quote: "Little wins can light up a whole day.",
    note: "Start with one and let it count.",
  },
  {
    quote: "You have more spark than you think.",
    note: "Let a little of it lead today.",
  },
  {
    quote: "Something good is waiting on the other side of starting.",
    note: "Begin where you are.",
  },
  {
    quote: "A small start still counts as starting.",
    note: "Forward is forward.",
  },
  {
    quote: "You can begin again and make it a good one.",
    note: "Fresh starts look good on you.",
  },
  {
    quote: "There is more light in this day than you think.",
    note: "Look for the bright little moments.",
  },
  {
    quote: "A good day can begin with one clear choice.",
    note: "Let the next step be enough for now.",
  },
  {
    quote: "You are building something steady and strong.",
    note: "It is taking shape with every small step.",
  },
  {
    quote: "There is room for joy in ordinary days too.",
    note: "You do not need a perfect day to feel good.",
  },
  {
    quote: "A better stretch of days can start today.",
    note: "One choice at a time.",
  },
  {
    quote: "Your pace can still take you somewhere wonderful.",
    note: "Keep going your way.",
  },
  {
    quote: "You are doing better than you give yourself credit for.",
    note: "Small effort adds up beautifully.",
  },
  {
    quote: "This day has plenty of possibility in it.",
    note: "Let one good thing happen on purpose.",
  },
  {
    quote: "A little rest and a little momentum can go together.",
    note: "Take both with you today.",
  },
  {
    quote: "There is something lovely about starting small.",
    note: "It keeps good things moving.",
  },
  {
    quote: "Today might surprise you in the best way.",
    note: "Leave a little room for that.",
  },
  {
    quote: "You are not behind. You are on your way.",
    note: "Your timeline still counts.",
  },
  {
    quote: "Your effort is making today brighter already.",
    note: "Keep going.",
  },
  {
    quote: "A little energy can go a long way.",
    note: "Use it on something that feels good.",
  },
  {
    quote: "You can feel proud of showing up.",
    note: "That counts every single time.",
  },
  {
    quote: "There is momentum in even the smallest move.",
    note: "Keep it simple and keep it going.",
  },
  {
    quote: "A bright day can begin with one good choice.",
    note: "Start there.",
  },
  {
    quote: "You are allowed to look forward.",
    note: "Good things belong here too.",
  },
  {
    quote: "The next chapter can feel fresh and full of life.",
    note: "Turn the page and see what opens up.",
  },
  {
    quote: "There is courage in getting going today.",
    note: "That spark matters.",
  },
  {
    quote: "You are closer to a good rhythm than you think.",
    note: "Keep going.",
  },
  {
    quote: "Good days are built in small pieces.",
    note: "One piece is enough to begin.",
  },
  {
    quote: "You can make today a little brighter.",
    note: "That is more than enough.",
  },
  {
    quote: "Your future self will thank you for this step.",
    note: "Even if it is a small one.",
  },
  {
    quote: "There is still plenty to smile about today.",
    note: "Look for the small bright parts.",
  },
  {
    quote: "You are allowed to feel lighter little by little.",
    note: "Good things can build one step at a time.",
  },
  {
    quote: "A good day can start in ordinary ways.",
    note: "A glass of water. A walk. A breath.",
  },
  {
    quote: "It is a great day to begin again.",
    note: "It can start from here.",
  },
  {
    quote: "Your small routines can become real support.",
    note: "They are helping more than you know.",
  },
  {
    quote: "There is something powerful in your consistency.",
    note: "Even quiet consistency shines.",
  },
  {
    quote: "You are making space for more good moments.",
    note: "That matters.",
  },
  {
    quote: "A fresh start can happen this afternoon too.",
    note: "It is never too late in the day.",
  },
  {
    quote: "There is joy in progress, even small progress.",
    note: "Let yourself notice it.",
  },
  {
    quote: "You can feel hopeful and ready to move.",
    note: "Both belong here.",
  },
  {
    quote: "Something brighter can begin with this moment.",
    note: "Start where you are.",
  },
  {
    quote: "This version of you is worth cheering for.",
    note: "Right now, as you are.",
  },
  {
    quote: "You are creating a day worth smiling about.",
    note: "Step by step.",
  },
  {
    quote: "A little hope can carry a lot.",
    note: "Let it stay with you today.",
  },
  {
    quote: "There is a lot of good still waiting for you.",
    note: "Keep making room for it.",
  },
  {
    quote: "You can still have a really good day from here.",
    note: "One next step can change the tone of it.",
  },
  {
    quote: "You are growing stronger in ways that count.",
    note: "Keep noticing that.",
  },
  {
    quote: "The next small good thing is enough for now.",
    note: "Let it lead the way.",
  },
  {
    quote: "You are still becoming, and that is beautiful.",
    note: "There is more to smile about ahead.",
  },
];

const saveMessages = [
  "You showed up today. That matters.",
  "Small steps still count.",
  "You’re doing better than you think.",
  "One day at a time.",
];

const initialActivities: Activity[] = [];

const initialCheckIns: CheckIn[] = [];

const initialResources: Resource[] = [];

const initialPlanItems: PlanItem[] = [];

const initialProfile: Profile = {
  name: "",
  weight: "",
  bloodPressure: "",
  heartRate: "",
  notes: "",
};

const initialSmallGoals: SmallGoal[] = [];

const tabs: { id: TabId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "coach", label: "Routine" },
  { id: "journey", label: "Reflect" },
  { id: "resource", label: "Resource" },
  { id: "profile", label: "Profile" },
];

const moodChoices = [
  { emoji: "😊", label: "Smiley", value: "Smiley 😊" },
  { emoji: "😔", label: "Sad", value: "Sad 😔" },
  { emoji: "😴", label: "Tired", value: "Tired 😴" },
  { emoji: "😐", label: "So-so", value: "So-so 😐" },
  { emoji: "😠", label: "Mad", value: "Mad 😠" },
  { emoji: "🤸", label: "Hyper", value: "Hyper 🤸" },
];

const storageKeys = {
  activities: "ember-activities",
  checkIns: "ember-check-ins",
  resources: "ember-resources",
  planItems: "ember-plan-items",
  profile: "ember-profile",
  smallGoals: "ember-small-goals",
  onboardingDismissed: "ember-onboarding-dismissed",
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];
const planReminderOptions: Array<{ value: PlanReminderRepeat; label: string }> = [
  { value: "none", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "every-4-hours", label: "Every 4 hours" },
  { value: "every-6-hours", label: "Every 6 hours" },
  { value: "custom-hours", label: "Custom hours" },
];

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);

  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

function getDisplayDateTime(date = new Date()) {
  return `${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} • ${date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}

function loadStoredState<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const stored = window.localStorage.getItem(key);

  if (!stored) {
    return fallback;
  }

  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

function normalizeCheckIns(entries: CheckIn[]) {
  return entries
    .filter(
      (entry) =>
        !(
          entry.dateKey === "2026-03-31" &&
          entry.feeling === "Steady, a little tired" &&
          entry.note === "Took things slowly and still made progress."
        ) &&
        !(
          entry.dateKey === "2026-03-30" &&
          entry.feeling === "Heavy, but hopeful" &&
          entry.note === "A short walk helped me feel less stuck."
        ),
    )
    .map((entry) => ({
      ...entry,
      timestamp: entry.timestamp ?? `${entry.dateKey}T12:00:00.000Z`,
      energyLevel: entry.energyLevel ?? "Okay",
      completedActivities: entry.completedActivities ?? [],
      completedMinutes:
        entry.completedMinutes ??
        (entry.completedActivities ?? []).reduce(
          (total, activity) => total + activity.duration,
          0,
        ),
    }))
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    );
}

function getRandomInspireIndex(previousIndex?: number) {
  if (inspireMoments.length <= 1) {
    return 0;
  }

  let nextIndex = Math.floor(Math.random() * inspireMoments.length);

  while (nextIndex === previousIndex) {
    nextIndex = Math.floor(Math.random() * inspireMoments.length);
  }

  return nextIndex;
}

function formatCloudError(
  error: { message?: string | null; code?: string | null } | null | undefined,
  fallback: string,
) {
  const details = error?.message?.trim();

  if (!details) {
    return fallback;
  }

  return `${fallback} ${details}`;
}

function formatReminderTime(value: string) {
  const [hoursText, minutesText] = value.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const suffix = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 || 12;
  const normalizedMinutes = String(minutes).padStart(2, "0");

  return `${normalizedHours}:${normalizedMinutes} ${suffix}`;
}

function formatPlanRepeatLabel(repeat: PlanReminderRepeat) {
  return (
    planReminderOptions.find((option) => option.value === repeat)?.label ?? "Once"
  );
}

function formatReminderSummary(
  item: Pick<PlanItem, "reminder" | "repeat" | "customRepeatHours">,
) {
  if (!item.reminder) {
    return "";
  }

  if (item.repeat === "custom-hours") {
    const hours = getCustomRepeatHours(item.customRepeatHours);
    return `Every ${hours} ${hours === 1 ? "hour" : "hours"}`;
  }

  return formatPlanRepeatLabel(item.repeat);
}

function getActivityReminderOccurrence(item: Activity, now: Date) {
  return getNextReminderOccurrence(
    {
      dateKey: item.reminderStartDateKey,
      time: item.reminderTime,
      reminder: item.reminder,
      repeat: item.repeat,
      customRepeatHours: item.customRepeatHours,
      lastReminderKey: item.lastReminderKey,
    },
    now,
  );
}

function getActivityHistoryEntry(
  activity: Activity,
  dateKey: string,
): ActivityHistoryEntry | undefined {
  return activity.history.find((entry) => entry.dateKey === dateKey);
}

function getTrackedSeconds(
  item: Pick<SmallGoal, "loggedSeconds" | "timerStartedAt">,
  nowMs: number,
) {
  const baseSeconds = item.loggedSeconds ?? 0;

  if (!item.timerStartedAt) {
    return baseSeconds;
  }

  const startedAtMs = new Date(item.timerStartedAt).getTime();

  if (Number.isNaN(startedAtMs)) {
    return baseSeconds;
  }

  return baseSeconds + Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
}

function getActivityTrackedSeconds(
  activity: Activity,
  nowMs: number,
  dateKey: string,
) {
  const entry = getActivityHistoryEntry(activity, dateKey);
  return entry ? getTrackedSeconds(entry, nowMs) : 0;
}

function getActivityRecordedMinutes(activity: Activity, nowMs: number, dateKey: string) {
  const trackedSeconds = getActivityTrackedSeconds(activity, nowMs, dateKey);

  if (trackedSeconds > 0) {
    return Math.max(1, Math.round(trackedSeconds / 60));
  }

  return getActivityHistoryEntry(activity, dateKey)?.completed ? activity.duration : 0;
}

function hasActivityProgress(activity: Activity, nowMs: number, dateKey: string) {
  const entry = getActivityHistoryEntry(activity, dateKey);

  if (!entry) {
    return false;
  }

  return entry.completed || getActivityTrackedSeconds(activity, nowMs, dateKey) > 0;
}

function updateActivityHistoryEntry(
  activity: Activity,
  dateKey: string,
  updates: Partial<ActivityHistoryEntry>,
) {
  const existingEntry = getActivityHistoryEntry(activity, dateKey);
  const nextEntry: ActivityHistoryEntry = {
    dateKey,
    completed: existingEntry?.completed ?? false,
    loggedSeconds: existingEntry?.loggedSeconds ?? 0,
    timerStartedAt: existingEntry?.timerStartedAt ?? null,
    ...updates,
  };

  const remainingEntries = activity.history.filter((entry) => entry.dateKey !== dateKey);

  return {
    ...activity,
    completed: nextEntry.completed,
    loggedSeconds: nextEntry.loggedSeconds,
    timerStartedAt: nextEntry.timerStartedAt,
    history: [...remainingEntries, nextEntry].sort((left, right) =>
      left.dateKey.localeCompare(right.dateKey),
    ),
  };
}

function calculateRoutineStreak(
  activities: Activity[],
  currentDayKey: string,
  nowMs: number,
) {
  const days = new Set<string>();

  activities.forEach((activity) => {
    activity.history.forEach((entry) => {
      if (
        entry.completed ||
        entry.loggedSeconds > 0 ||
        (entry.dateKey === currentDayKey &&
          getActivityTrackedSeconds(activity, nowMs, currentDayKey) > 0)
      ) {
        days.add(entry.dateKey);
      }
    });
  });

  if (!days.has(currentDayKey)) {
    return 0;
  }

  let streak = 0;
  let cursor = new Date(`${currentDayKey}T12:00:00`);

  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getWeekDateKeys(currentDayKey: string) {
  const currentDate = new Date(`${currentDayKey}T12:00:00`);
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());

  return Array.from({ length: currentDate.getDay() + 1 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

function formatTimerDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getDayLabel(dateKey: string, currentDayKey: string | null) {
  if (!currentDayKey) {
    return dateKey;
  }

  if (dateKey === currentDayKey) {
    return "Today";
  }

  const yesterday = new Date(`${currentDayKey}T12:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateKey === yesterday.toISOString().slice(0, 10)) {
    return "Yesterday";
  }

  return new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function getDaySummary(entries: CheckIn[], label: string) {
  const count = entries.length;
  const lowMoments = entries.filter((entry) => entry.energyLevel === "Low").length;
  const goodMoments = entries.filter((entry) => entry.energyLevel === "Good").length;

  if (label === "Today") {
    return `You showed up ${count} ${count === 1 ? "time" : "times"} today.`;
  }

  if (lowMoments > 0) {
    return "A tender day. Small steps still mattered.";
  }

  if (goodMoments === count) {
    return "A steady day, keep going gently.";
  }

  if (count > 1) {
    return "A day made of a few quiet moments.";
  }

  return "A small moment of care was kept here.";
}

function normalizePlanItems(items: PlanItem[]) {
  return items
    .filter(
      (item) =>
        !(
          item.title === "Take medication" &&
          item.dateKey === "2026-03-31" &&
          item.time === "09:00"
        ) &&
        !(
          item.title === "Short evening stretch" &&
          item.dateKey === "2026-04-01" &&
          item.time === "19:30"
        ),
    )
    .map((item) => ({
      ...item,
      dateKey: item.dateKey ?? "2026-03-31",
      reminder: item.reminder ?? true,
      repeat: item.repeat ?? "none",
      customRepeatHours: item.customRepeatHours ?? null,
      lastReminderKey:
        item.lastReminderKey ??
        (item as { lastReminderDate?: string | null }).lastReminderDate ??
        null,
    }));
}

function normalizeActivities(items: Activity[]) {
  return items
    .filter(
      (item) =>
        !(
          item.name === "Morning stretch" &&
          item.duration === 10 &&
          item.reminderTime === "08:30"
        ) &&
        !(
          item.name === "Gentle walk" &&
          item.duration === 20 &&
          item.reminderTime === "12:00"
        ) &&
        !(
          item.name === "Breathing reset" &&
          item.duration === 5 &&
          item.reminderTime === "15:00"
        ) &&
        !(
          item.name === "Evening journal" &&
          item.duration === 15 &&
          item.reminderTime === "20:00"
        ),
    )
    .map((item) => {
      const legacyDateKey = getTodayKey();
      const legacyHistory =
        item.history && item.history.length > 0
          ? item.history
          : item.completed || item.loggedSeconds > 0 || item.timerStartedAt
            ? [
                {
                  dateKey: legacyDateKey,
                  completed: item.completed ?? false,
                  loggedSeconds: item.loggedSeconds ?? 0,
                  timerStartedAt: item.timerStartedAt ?? null,
                },
              ]
            : [];

      return {
        ...item,
        loggedSeconds: item.loggedSeconds ?? 0,
        timerStartedAt: item.timerStartedAt ?? null,
        reminder: item.reminder ?? false,
        reminderTime: item.reminderTime ?? "09:00",
        repeat: item.repeat ?? "daily",
        customRepeatHours: item.customRepeatHours ?? null,
        reminderStartDateKey: item.reminderStartDateKey ?? getTodayKey(),
        lastReminderKey:
          item.lastReminderKey ??
          (item as { lastReminderDate?: string | null }).lastReminderDate ??
          null,
        history: legacyHistory
          .map((entry) => ({
            dateKey: entry.dateKey,
            completed: entry.completed ?? false,
            loggedSeconds: entry.loggedSeconds ?? 0,
            timerStartedAt: entry.timerStartedAt ?? null,
          }))
          .sort((left, right) => left.dateKey.localeCompare(right.dateKey)),
      };
    });
}

function normalizeSmallGoals(items: SmallGoal[]) {
  return items.map((item) => ({
    ...item,
    completed: item.completed ?? false,
    loggedSeconds: item.loggedSeconds ?? 0,
    timerStartedAt: item.timerStartedAt ?? null,
  }));
}

function normalizeResources(items: Resource[]) {
  return items
    .filter(
      (item) =>
        !(
          item.title === "Box breathing guide" &&
          item.url ===
            "https://www.health.harvard.edu/mind-and-mood/relaxation-techniques-breath-control-helps-quell-errant-stress-response"
        ) &&
        !(
          item.title === "Gentle desk stretches" &&
          item.url === "https://www.nhs.uk/live-well/exercise/exercises-for-flexibility/"
        ),
    )
    .map((item) => ({
      ...item,
      note: item.note ?? "",
      tags: Array.isArray(item.tags)
        ? item.tags
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
    }));
}

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function getMonthKey(dateKey: string) {
  return dateKey.slice(0, 7);
}

function shiftMonth(monthKey: string, offset: number) {
  const [yearText, monthText] = monthKey.split("-");
  const date = new Date(Number(yearText), Number(monthText) - 1 + offset, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDateKey(dateKey: string) {
  const [, monthText, dayText] = dateKey.split("-");
  const monthIndex = Number(monthText) - 1;
  const day = Number(dayText);

  if (!monthNames[monthIndex] || Number.isNaN(day)) {
    return dateKey;
  }

  return `${monthNames[monthIndex].slice(0, 3)} ${day}`;
}

function formatPlanDayLabel(dateKey: string, todayKey: string | null) {
  if (todayKey && dateKey === todayKey) {
    return "Today";
  }

  return formatDateKey(dateKey);
}

function formatMonthLabel(monthKey: string) {
  const [yearText, monthText] = monthKey.split("-");
  const monthIndex = Number(monthText) - 1;

  if (!monthNames[monthIndex]) {
    return monthKey;
  }

  return `${monthNames[monthIndex]} ${yearText}`;
}

function buildCalendarDays(monthKey: string) {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;

  if (Number.isNaN(year) || Number.isNaN(monthIndex)) {
    return [];
  }

  const firstDay = new Date(year, monthIndex, 1);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, monthIndex, 0).getDate();
  const cells: Array<{ dateKey: string; dayNumber: number; inMonth: boolean }> = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    const dayNumber = daysInPreviousMonth - firstWeekday + index + 1;
    const date = new Date(year, monthIndex - 1, dayNumber);
    cells.push({
      dateKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate(),
      ).padStart(2, "0")}`,
      dayNumber,
      inMonth: false,
    });
  }

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber += 1) {
    cells.push({
      dateKey: `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`,
      dayNumber,
      inMonth: true,
    });
  }

  while (cells.length % 7 !== 0) {
    const lastCell = cells[cells.length - 1];
    const date = new Date(`${lastCell.dateKey}T12:00:00`);
    date.setDate(date.getDate() + 1);
    cells.push({
      dateKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate(),
      ).padStart(2, "0")}`,
      dayNumber: date.getDate(),
      inMonth: false,
    });
  }

  return cells;
}

function scrollToPlanTarget(targetId: string) {
  window.setTimeout(() => {
    document.getElementById(targetId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 0);
}

function createPlanDraft(dateKey: string) {
  return {
    dateKey,
    title: "",
    time: "09:00",
    note: "",
    reminder: true,
    repeat: "none" as PlanReminderRepeat,
    customRepeatHours: 8,
  };
}

function buildSnapshot({
  activities,
  checkIns,
  resources,
  planItems,
  profile,
  smallGoals,
  onboardingDismissed,
}: {
  activities: Activity[];
  checkIns: CheckIn[];
  resources: Resource[];
  planItems: PlanItem[];
  profile: Profile;
  smallGoals: SmallGoal[];
  onboardingDismissed: boolean;
}): EmberCloudSnapshot {
  return {
    version: 1,
    activities,
    checkIns,
    resources,
    planItems,
    profile,
    smallGoals,
    onboardingDismissed,
  };
}

function applySnapshot(snapshot: Partial<EmberCloudSnapshot> | null | undefined) {
  return {
    activities: normalizeActivities(snapshot?.activities ?? initialActivities),
    checkIns: normalizeCheckIns(snapshot?.checkIns ?? initialCheckIns),
    resources: normalizeResources(snapshot?.resources ?? initialResources),
    planItems: normalizePlanItems(snapshot?.planItems ?? initialPlanItems),
    profile: snapshot?.profile ?? initialProfile,
    smallGoals: normalizeSmallGoals(snapshot?.smallGoals ?? initialSmallGoals),
    onboardingDismissed: snapshot?.onboardingDismissed ?? false,
  };
}

function hasMeaningfulSnapshotData(snapshot: EmberCloudSnapshot) {
  return Boolean(
    snapshot.activities.length ||
      snapshot.checkIns.length ||
      snapshot.resources.length ||
      snapshot.planItems.length ||
      snapshot.smallGoals.length ||
      snapshot.profile.name.trim() ||
      snapshot.profile.weight.trim() ||
      snapshot.profile.bloodPressure.trim() ||
      snapshot.profile.heartRate.trim() ||
      snapshot.profile.notes.trim(),
  );
}

export default function EmberApp() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const cloudSaveTimeoutRef = useRef<number | null>(null);
  const cloudSyncIntervalRef = useRef<number | null>(null);
  const reminderTimeoutRef = useRef<number | null>(null);
  const currentSnapshotRef = useRef<EmberCloudSnapshot>(
    buildSnapshot({
      activities: normalizeActivities(initialActivities),
      checkIns: normalizeCheckIns(initialCheckIns),
      resources: normalizeResources(initialResources),
      planItems: normalizePlanItems(initialPlanItems),
      profile: initialProfile,
      smallGoals: normalizeSmallGoals(initialSmallGoals),
      onboardingDismissed: false,
    }),
  );
  const lastCloudSnapshotRef = useRef<string>("");
  const lastCloudUpdatedAtRef = useRef<string>("");
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [activities, setActivities] = useState<Activity[]>(normalizeActivities(initialActivities));
  const [checkIns, setCheckIns] = useState<CheckIn[]>(initialCheckIns);
  const [resources, setResources] = useState<Resource[]>(normalizeResources(initialResources));
  const [planItems, setPlanItems] = useState<PlanItem[]>(initialPlanItems);
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [smallGoals, setSmallGoals] = useState<SmallGoal[]>(initialSmallGoals);
  const [feeling, setFeeling] = useState("");
  const [note, setNote] = useState("");
  const [energyLevel, setEnergyLevel] = useState<"Good" | "Okay" | "Low">("Okay");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [activityDraft, setActivityDraft] = useState({ name: "", duration: "10" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [resourceDraft, setResourceDraft] = useState({
    title: "",
    url: "",
    note: "",
    tags: "",
  });
  const [saveMessage, setSaveMessage] = useState("");
  const [expandedEntryId, setExpandedEntryId] = useState<number | null>(
    initialCheckIns[0]?.id ?? null,
  );
  const [expandedPlanItemId, setExpandedPlanItemId] = useState<number | null>(null);
  const [expandedRoutineId, setExpandedRoutineId] = useState<number | null>(null);
  const [expandedResourceId, setExpandedResourceId] = useState<number | null>(null);
  const [animatedActivityId, setAnimatedActivityId] = useState<number | null>(null);
  const [checkedActivityId, setCheckedActivityId] = useState<number | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [entryDraft, setEntryDraft] = useState({ feeling: "", note: "" });
  const [editingPlanItemId, setEditingPlanItemId] = useState<number | null>(null);
  const [planDraft, setPlanDraft] = useState(createPlanDraft("2026-03-31"));
  const [editingResourceId, setEditingResourceId] = useState<number | null>(null);
  const [smallGoalDraft, setSmallGoalDraft] = useState("");
  const [editingSmallGoalId, setEditingSmallGoalId] = useState<number | null>(null);
  const [activityReminderMessage, setActivityReminderMessage] = useState("");
  const [planReminderMessage, setPlanReminderMessage] = useState("");
  const [resourceMessage, setResourceMessage] = useState("");
  const [resourceSearch, setResourceSearch] = useState("");
  const [reflectSearch, setReflectSearch] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [cloudMessage, setCloudMessage] = useState("");
  const [cloudEmail, setCloudEmail] = useState("");
  const [cloudUserEmail, setCloudUserEmail] = useState("");
  const [cloudUserId, setCloudUserId] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<
    "idle" | "connecting" | "saving" | "saved" | "error"
  >("idle");
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCloudLoaded, setIsCloudLoaded] = useState(!isSupabaseConfigured());
  const [todayKey, setTodayKey] = useState<string | null>(null);
  const [selectedPlanDateKey, setSelectedPlanDateKey] = useState("2026-03-31");
  const [calendarMonthKey, setCalendarMonthKey] = useState("2026-03");
  const [timerNowMs, setTimerNowMs] = useState<number | null>(null);
  const [pushState, setPushState] = useState<PushState>(getInitialPushState);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(
    null,
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedActivities = normalizeActivities(
        loadStoredState(storageKeys.activities, initialActivities),
      );
      const storedCheckIns = normalizeCheckIns(
        loadStoredState(storageKeys.checkIns, initialCheckIns),
      );
      const storedResources = normalizeResources(
        loadStoredState(storageKeys.resources, initialResources),
      );
      const storedPlanItems = normalizePlanItems(
        loadStoredState(storageKeys.planItems, initialPlanItems),
      );
      const storedProfile = loadStoredState(storageKeys.profile, initialProfile);
      const storedSmallGoals = normalizeSmallGoals(
        loadStoredState(storageKeys.smallGoals, initialSmallGoals),
      );
      const storedOnboardingDismissed = loadStoredState(
        storageKeys.onboardingDismissed,
        false,
      );

      setActivities(storedActivities);
      setCheckIns(storedCheckIns);
      setResources(storedResources);
      setPlanItems(storedPlanItems);
      setProfile(storedProfile);
      setSmallGoals(storedSmallGoals);
      setOnboardingDismissed(storedOnboardingDismissed);
      setQuoteIndex(getRandomInspireIndex());
      const hydratedTodayKey = getTodayKey();
      setTodayKey(hydratedTodayKey);
      setSelectedPlanDateKey(hydratedTodayKey);
      setCalendarMonthKey(getMonthKey(hydratedTodayKey));
      setIsHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!supabase) {
      return;
    }

    let isActive = true;

    const applyRemoteRow = (row: EmberCloudRow | null | undefined) => {
      const remoteState = applySnapshot(row?.data ?? null);
      const remoteSnapshot = buildSnapshot(remoteState);
      const snapshotText = JSON.stringify(remoteSnapshot);
      const updatedAt = row?.updated_at ?? "";

      if (!hasMeaningfulSnapshotData(remoteSnapshot)) {
        return false;
      }

      if (snapshotText === lastCloudSnapshotRef.current) {
        if (updatedAt) {
          lastCloudUpdatedAtRef.current = updatedAt;
        }
        return false;
      }

      setActivities(remoteState.activities);
      setCheckIns(remoteState.checkIns);
      setResources(remoteState.resources);
      setPlanItems(remoteState.planItems);
      setProfile(remoteState.profile);
      setSmallGoals(remoteState.smallGoals);
      setOnboardingDismissed(remoteState.onboardingDismissed);
      lastCloudSnapshotRef.current = snapshotText;
      lastCloudUpdatedAtRef.current = updatedAt;
      return true;
    };

    const loadRemoteSnapshot = async (userId: string) => {
      const { data, error } = await supabase
        .from("ember_app_state")
        .select("data, updated_at")
        .eq("user_id", userId)
        .maybeSingle<EmberCloudRow>();

      if (!isActive) {
        return { error: null, data: null, applied: false };
      }

      if (error) {
        return { error, data: null, applied: false };
      }

      const applied = applyRemoteRow(data);
      return { error: null, data, applied };
    };

    const startCloudPolling = (userId: string) => {
      if (cloudSyncIntervalRef.current !== null) {
        window.clearInterval(cloudSyncIntervalRef.current);
      }

      cloudSyncIntervalRef.current = window.setInterval(() => {
        void (async () => {
          const { data } = await loadRemoteSnapshot(userId);

          if (!isActive || !data?.updated_at) {
            return;
          }

          if (
            lastCloudUpdatedAtRef.current &&
            data.updated_at <= lastCloudUpdatedAtRef.current
          ) {
            return;
          }

          if (applyRemoteRow(data)) {
            setCloudStatus("saved");
            setCloudMessage("Cloud save is on and syncing.");
          }
        })();
      }, 4000);
    };

    const syncSession = async (session: Session | null) => {
      if (!isActive) {
        return;
      }

      if (!session?.user) {
        if (cloudSyncIntervalRef.current !== null) {
          window.clearInterval(cloudSyncIntervalRef.current);
          cloudSyncIntervalRef.current = null;
        }
        setCloudUserId(null);
        setCloudUserEmail("");
        setCloudStatus("idle");
        setIsCloudLoaded(true);
        lastCloudSnapshotRef.current = "";
        lastCloudUpdatedAtRef.current = "";
        return;
      }

      setCloudUserId(session.user.id);
      setCloudUserEmail(session.user.email ?? "");
      setCloudStatus("connecting");

      const localSnapshot = currentSnapshotRef.current;

      const { error, applied } = await loadRemoteSnapshot(session.user.id);

      if (!isActive) {
        return;
      }

      if (error) {
        setCloudStatus("error");
        setCloudMessage(
          formatCloudError(error, "Cloud save could not load yet."),
        );
        setIsCloudLoaded(true);
        return;
      }

      if (applied) {
        setCloudStatus("saved");
        setCloudMessage("Cloud save is on and syncing.");
        setIsCloudLoaded(true);
        startCloudPolling(session.user.id);
        return;
      }

      if (hasMeaningfulSnapshotData(localSnapshot)) {
        const updatedAt = new Date().toISOString();
        const { error: saveError } = await supabase.from("ember_app_state").upsert(
          {
            user_id: session.user.id,
            data: localSnapshot,
            updated_at: updatedAt,
          },
          {
            onConflict: "user_id",
          },
        );

        if (!isActive) {
          return;
        }

        if (saveError) {
          setCloudStatus("error");
          setCloudMessage(
            formatCloudError(saveError, "Cloud save could not start yet."),
          );
          setIsCloudLoaded(true);
          return;
        }

        lastCloudSnapshotRef.current = JSON.stringify(localSnapshot);
        lastCloudUpdatedAtRef.current = updatedAt;
      }

      setCloudStatus("saved");
      setCloudMessage("Cloud save is on and syncing.");
      setIsCloudLoaded(true);
      startCloudPolling(session.user.id);
    };

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isActive) {
        return;
      }

      if (error) {
        setCloudStatus("error");
        setCloudMessage(
          formatCloudError(error, "Cloud save could not connect yet."),
        );
        setIsCloudLoaded(true);
        return;
      }

      void syncSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });

    return () => {
      isActive = false;
      if (cloudSyncIntervalRef.current !== null) {
        window.clearInterval(cloudSyncIntervalRef.current);
        cloudSyncIntervalRef.current = null;
      }
      subscription.unsubscribe();
    };
  }, [isHydrated, supabase]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(storageKeys.activities, JSON.stringify(activities));
  }, [activities, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(storageKeys.checkIns, JSON.stringify(checkIns));
  }, [checkIns, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(storageKeys.resources, JSON.stringify(resources));
  }, [resources, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(storageKeys.planItems, JSON.stringify(planItems));
  }, [planItems, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(storageKeys.profile, JSON.stringify(profile));
  }, [profile, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(storageKeys.smallGoals, JSON.stringify(smallGoals));
  }, [smallGoals, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(
      storageKeys.onboardingDismissed,
      JSON.stringify(onboardingDismissed),
    );
  }, [onboardingDismissed, isHydrated]);

  useEffect(() => {
    currentSnapshotRef.current = buildSnapshot({
      activities,
      checkIns,
      resources,
      planItems,
      profile,
      smallGoals,
      onboardingDismissed,
    });
  }, [activities, checkIns, resources, planItems, profile, smallGoals, onboardingDismissed]);

  useEffect(() => {
    if (!isHydrated || !supabase || !cloudUserId || !isCloudLoaded) {
      return;
    }

    if (cloudSaveTimeoutRef.current !== null) {
      window.clearTimeout(cloudSaveTimeoutRef.current);
    }

    cloudSaveTimeoutRef.current = window.setTimeout(() => {
      setCloudStatus("saving");
      const snapshot = buildSnapshot({
        activities,
        checkIns,
        resources,
        planItems,
        profile,
        smallGoals,
        onboardingDismissed,
      });
      const snapshotText = JSON.stringify(snapshot);

      if (snapshotText === lastCloudSnapshotRef.current) {
        setCloudStatus("saved");
        return;
      }

      void (async () => {
        const updatedAt = new Date().toISOString();
        const { error } = await supabase.from("ember_app_state").upsert(
          {
            user_id: cloudUserId,
            data: snapshot,
            updated_at: updatedAt,
          },
          {
            onConflict: "user_id",
          },
        );

        if (error) {
          setCloudStatus("error");
          setCloudMessage(
            formatCloudError(error, "Cloud save is having trouble right now."),
          );
          return;
        }

        lastCloudSnapshotRef.current = snapshotText;
        lastCloudUpdatedAtRef.current = updatedAt;
        setCloudStatus("saved");
      })();
    }, 900);

    return () => {
      if (cloudSaveTimeoutRef.current !== null) {
        window.clearTimeout(cloudSaveTimeoutRef.current);
        cloudSaveTimeoutRef.current = null;
      }
    };
  }, [
    activities,
    checkIns,
    resources,
    planItems,
    profile,
    smallGoals,
    onboardingDismissed,
    isHydrated,
    supabase,
    cloudUserId,
    isCloudLoaded,
  ]);

  useEffect(() => {
    if (!saveMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSaveMessage("");
    }, 2600);

    return () => window.clearTimeout(timeoutId);
  }, [saveMessage]);

  useEffect(() => {
    if (!activityReminderMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActivityReminderMessage("");
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [activityReminderMessage]);

  useEffect(() => {
    if (!planReminderMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPlanReminderMessage("");
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [planReminderMessage]);

  useEffect(() => {
    if (!resourceMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setResourceMessage("");
    }, 2400);

    return () => window.clearTimeout(timeoutId);
  }, [resourceMessage]);

  useEffect(() => {
    if (!profileMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setProfileMessage("");
    }, 2400);

    return () => window.clearTimeout(timeoutId);
  }, [profileMessage]);

  useEffect(() => {
    if (!cloudMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCloudMessage("");
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [cloudMessage]);

  useEffect(() => {
    if (animatedActivityId === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAnimatedActivityId(null);
      setCheckedActivityId(null);
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [animatedActivityId]);

  useEffect(() => {
    const activeDateKey = todayKey ?? getTodayKey();
    const hasRunningTimer =
      activities.some(
        (activity) => getActivityHistoryEntry(activity, activeDateKey)?.timerStartedAt !== null,
      ) ||
      smallGoals.some((goal) => goal.timerStartedAt !== null);

    if (!hasRunningTimer) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTimerNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [activities, smallGoals, todayKey]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if ("serviceWorker" in navigator) {
      void (async () => {
        const registrations = await navigator.serviceWorker.getRegistrations();

        if (process.env.NODE_ENV !== "production") {
          await Promise.all(registrations.map((registration) => registration.unregister()));
          return;
        }

        const hasEmberRegistration = registrations.some(
          (registration) => registration.active?.scriptURL?.includes("/sw.js"),
        );

        if (!hasEmberRegistration) {
          await navigator.serviceWorker.register("/sw.js");
        }
      })();
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const showReminderNotification = async (message: string) => {
      if ("Notification" in window && window.Notification.permission === "granted") {
        if ("serviceWorker" in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification("Ember", {
              body: message,
              tag: `ember-${message}`,
            });
            return;
          } catch {
            // Fall back to the page notification API if the service worker is not ready.
          }
        }

        void new window.Notification("Ember", {
          body: message,
        });
      }
    };

    const flushDueReminders = () => {
      const now = new Date();
      const dueActivityNames: string[] = [];
      const duePlanNames: string[] = [];

      setActivities((current) =>
        (() => {
          let changed = false;
          const nextItems = current.map((item) => {
            const occurrence = getActivityReminderOccurrence(item, now);

            if (
              occurrence &&
              occurrence.dueAt <= now.getTime() &&
              item.lastReminderKey !== occurrence.reminderKey
            ) {
              changed = true;
              dueActivityNames.push(item.name);
              return {
                ...item,
                lastReminderKey: occurrence.reminderKey,
              };
            }

            return item;
          });

          return changed ? nextItems : current;
        })(),
      );

      setPlanItems((current) =>
        (() => {
          let changed = false;
          const nextItems = current.map((item) => {
            const occurrence = getNextReminderOccurrence(item, now);

            if (
              occurrence &&
              occurrence.dueAt <= now.getTime() &&
              item.lastReminderKey !== occurrence.reminderKey
            ) {
              changed = true;
              duePlanNames.push(item.title);
              return {
                ...item,
                lastReminderKey: occurrence.reminderKey,
              };
            }

            return item;
          });

          return changed ? nextItems : current;
        })(),
      );

      const nextActivityMessage = summarizeReminderMessage(dueActivityNames);
      const nextPlanMessage = summarizeReminderMessage(duePlanNames);

      if (nextActivityMessage) {
        setActivityReminderMessage(nextActivityMessage);
        void showReminderNotification(nextActivityMessage);
      }

      if (nextPlanMessage) {
        setPlanReminderMessage(nextPlanMessage);
        void showReminderNotification(nextPlanMessage);
      }
    };

    const scheduleNextReminder = () => {
      if (reminderTimeoutRef.current !== null) {
        window.clearTimeout(reminderTimeoutRef.current);
        reminderTimeoutRef.current = null;
      }

      const now = new Date();
      const nextDueAt = [...activities.map((item) => getActivityReminderOccurrence(item, now)), ...planItems.map((item) => getNextReminderOccurrence(item, now))]
        .filter((occurrence): occurrence is ReminderOccurrence => occurrence !== null)
        .reduce<number | null>(
          (soonest, occurrence) =>
            soonest === null ? occurrence.dueAt : Math.min(soonest, occurrence.dueAt),
          null,
        );

      if (nextDueAt === null) {
        return;
      }

      const maxDelayMs = 12 * 60 * 60 * 1000;
      const delay = Math.max(0, Math.min(nextDueAt - now.getTime(), maxDelayMs));

      reminderTimeoutRef.current = window.setTimeout(() => {
        flushDueReminders();
        scheduleNextReminder();
      }, delay + 40);
    };

    const handleVisibilityRefresh = () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      flushDueReminders();
      scheduleNextReminder();
    };

    flushDueReminders();
    scheduleNextReminder();
    window.addEventListener("focus", handleVisibilityRefresh);
    document.addEventListener("visibilitychange", handleVisibilityRefresh);

    return () => {
      if (reminderTimeoutRef.current !== null) {
        window.clearTimeout(reminderTimeoutRef.current);
        reminderTimeoutRef.current = null;
      }
      window.removeEventListener("focus", handleVisibilityRefresh);
      document.removeEventListener("visibilitychange", handleVisibilityRefresh);
    };
  }, [isHydrated, activities, planItems]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (getInitialPushState() === "unsupported") {
      return;
    }

    let isActive = true;

    void (async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (!isActive) {
          return;
        }

        setPushState(subscription ? "on" : "off");
      } catch {
        if (isActive) {
          setPushState("off");
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [isHydrated, cloudUserId]);

  const currentTimerMs = timerNowMs ?? 0;
  const visibleActivities = isHydrated ? activities : normalizeActivities(initialActivities);
  const visibleCheckIns = isHydrated ? checkIns : normalizeCheckIns(initialCheckIns);
  const visibleResources = isHydrated ? resources : normalizeResources(initialResources);
  const visiblePlanItems = isHydrated ? planItems : normalizePlanItems(initialPlanItems);
  const visibleProfile = isHydrated ? profile : initialProfile;
  const visibleSmallGoals = isHydrated ? smallGoals : normalizeSmallGoals(initialSmallGoals);
  const cloudEnabled = isSupabaseConfigured();
  const activeDateKey = todayKey ?? getTodayKey();
  const completedActivities = visibleActivities.filter((activity) =>
    hasActivityProgress(activity, currentTimerMs, activeDateKey),
  );
  const todaysActivities =
    energyLevel === "Low"
      ? visibleActivities.filter((activity) => activity.lowEnergy).slice(0, 2)
      : visibleActivities;
  const todaysGoals =
    todayKey === null
      ? []
      : visibleSmallGoals.filter((goal) => goal.dateKey === todayKey);
  const minutesToday = completedActivities.reduce(
    (total, activity) => total + getActivityRecordedMinutes(activity, currentTimerMs, activeDateKey),
    0,
  );
  const weekDateKeys = getWeekDateKeys(activeDateKey);
  const weeklyCompletedCount = visibleActivities.reduce(
    (total, activity) =>
      total +
      weekDateKeys.filter((dateKey) => hasActivityProgress(activity, currentTimerMs, dateKey))
        .length,
    0,
  );
  const weeklyTargetCount = visibleActivities.length * weekDateKeys.length;
  const weeklyProgress =
    weeklyTargetCount > 0 ? Math.round((weeklyCompletedCount / weeklyTargetCount) * 100) : 0;
  const streak = calculateRoutineStreak(visibleActivities, activeDateKey, currentTimerMs);
  const journeyGroups = visibleCheckIns.reduce<
    Array<{ dateKey: string; label: string; summary: string; entries: CheckIn[] }>
  >((groups, entry) => {
    const existingGroup = groups.find((group) => group.dateKey === entry.dateKey);

    if (existingGroup) {
      existingGroup.entries.push(entry);
      existingGroup.summary = getDaySummary(existingGroup.entries, existingGroup.label);
      return groups;
    }

    const label = getDayLabel(entry.dateKey, todayKey);
    groups.push({
      dateKey: entry.dateKey,
      label,
      summary: getDaySummary([entry], label),
      entries: [entry],
    });

    return groups;
  }, []);
  const filteredJourneyGroups = journeyGroups
    .map((group) => {
      const search = reflectSearch.trim().toLowerCase();

      if (!search) {
        return group;
      }

      const entries = group.entries.filter((entry) =>
        [
          group.label,
          group.dateKey,
          entry.date,
          entry.feeling,
          entry.note,
          entry.energyLevel ?? "",
          entry.completedActivities.map((activity) => activity.name).join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(search),
      );

      if (entries.length === 0) {
        return null;
      }

      return {
        ...group,
        entries,
        summary: getDaySummary(entries, group.label),
      };
    })
    .filter(Boolean) as typeof journeyGroups;
  const selectedPlanItems = [...visiblePlanItems]
    .filter((item) => item.dateKey === selectedPlanDateKey)
    .sort((left, right) => left.time.localeCompare(right.time));
  const selectedPlanCompletedCount = selectedPlanItems.filter((item) => item.completed).length;
  const selectedPlanReminderCount = selectedPlanItems.filter((item) => item.reminder).length;
  const calendarDays = buildCalendarDays(calendarMonthKey);
  const filteredResources = visibleResources.filter((resource) => {
    const search = resourceSearch.trim().toLowerCase();

    if (!search) {
      return true;
    }

    return [resource.title, resource.url, resource.note, resource.tags.join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });
  const cloudStatusText =
    cloudStatus === "connecting"
      ? "Connecting..."
      : cloudStatus === "saving"
        ? "Saving..."
        : cloudStatus === "saved"
          ? "Synced"
          : cloudStatus === "error"
            ? "Needs attention"
            : "Ready";
  const saveCheckIn = () => {
    if (!feeling.trim() && !note.trim()) {
      return;
    }

    const now = new Date();
    const entryId = now.getTime();
    const currentDateKey = getTodayKey();
    const completedSnapshot = completedActivities.map((activity) => ({
      name: activity.name,
      duration: getActivityRecordedMinutes(activity, now.getTime(), currentDateKey),
    }));
    const entry: CheckIn = {
      id: entryId,
      dateKey: currentDateKey,
      timestamp: now.toISOString(),
      feeling: feeling.trim() || "Quiet, still finding words",
      note: note.trim(),
      date: getDisplayDateTime(now),
      energyLevel,
      completedActivities: completedSnapshot,
      completedMinutes: completedSnapshot.reduce(
        (total, activity) => total + activity.duration,
        0,
      ),
    };

    setCheckIns((current) => [entry, ...current]);
    setFeeling("");
    setNote("");
    setSaveMessage(
      saveMessages[entryId % saveMessages.length] ??
        "You showed up today. That matters.",
    );
    setExpandedEntryId(entry.id);
  };

  const toggleActivity = (id: number) => {
    const currentDateKey = getTodayKey();
    let nextCompleted = false;

    setActivities((current) =>
      current.map((activity) => {
        if (activity.id !== id) {
          return activity;
        }

        nextCompleted = !getActivityHistoryEntry(activity, currentDateKey)?.completed;
        return updateActivityHistoryEntry(activity, currentDateKey, {
          completed: nextCompleted,
        });
      }),
    );

    if (nextCompleted) {
      setAnimatedActivityId(id);
      setCheckedActivityId(id);
    } else {
      setAnimatedActivityId(null);
      setCheckedActivityId(null);
    }
  };

  const toggleActivityTimer = (id: number) => {
    const now = new Date();
    const currentDateKey = getTodayKey();
    setTimerNowMs(now.getTime());

    setActivities((current) =>
      current.map((activity) => {
        if (activity.id !== id) {
          return activity;
        }

        const currentEntry = getActivityHistoryEntry(activity, currentDateKey);

        if (currentEntry?.timerStartedAt) {
          const startedAtMs = new Date(currentEntry.timerStartedAt).getTime();
          const elapsedSeconds = Number.isNaN(startedAtMs)
            ? 0
            : Math.max(0, Math.floor((now.getTime() - startedAtMs) / 1000));

          return updateActivityHistoryEntry(activity, currentDateKey, {
            loggedSeconds: (currentEntry?.loggedSeconds ?? 0) + elapsedSeconds,
            timerStartedAt: null,
          });
        }

        return updateActivityHistoryEntry(activity, currentDateKey, {
          timerStartedAt: now.toISOString(),
        });
      }),
    );
  };

  const submitActivity = () => {
    const trimmedName = activityDraft.name.trim();
    const duration = Number(activityDraft.duration);

    if (!trimmedName || Number.isNaN(duration) || duration <= 0) {
      return;
    }

    if (editingId !== null) {
      setActivities((current) =>
        current.map((activity) =>
          activity.id === editingId
            ? { ...activity, name: trimmedName, duration }
            : activity,
        ),
      );
      setEditingId(null);
    } else {
      setActivities((current) => [
        ...current,
        {
          id: Date.now(),
          name: trimmedName,
          duration,
          completed: false,
          loggedSeconds: 0,
          timerStartedAt: null,
          reminder: false,
          reminderTime: "09:00",
          repeat: "daily",
          customRepeatHours: 8,
          reminderStartDateKey: getTodayKey(),
          lastReminderKey: null,
          history: [],
        },
      ]);
    }

    setActivityDraft({ name: "", duration: "10" });
  };

  const startEditActivity = (activity: Activity) => {
    setEditingId(activity.id);
    setExpandedRoutineId(activity.id);
    setActivityDraft({
      name: activity.name,
      duration: String(activity.duration),
    });
  };

  const updateActivityReminder = (
    id: number,
    updates: Partial<
      Pick<
        Activity,
        | "reminder"
        | "reminderTime"
        | "repeat"
        | "customRepeatHours"
        | "reminderStartDateKey"
        | "lastReminderKey"
      >
    >,
  ) => {
    setActivities((current) =>
      current.map((activity) =>
        activity.id === id ? { ...activity, ...updates } : activity,
      ),
    );
  };

  const deleteActivity = (id: number) => {
    setActivities((current) => current.filter((activity) => activity.id !== id));

    if (editingId === id) {
      setEditingId(null);
      setActivityDraft({ name: "", duration: "10" });
    }

    if (expandedRoutineId === id) {
      setExpandedRoutineId(null);
    }
  };

  const addSmallGoal = () => {
    const title = smallGoalDraft.trim();

    if (!title || !todayKey) {
      return;
    }

    if (editingSmallGoalId !== null) {
      setSmallGoals((current) =>
        current.map((goal) =>
          goal.id === editingSmallGoalId ? { ...goal, title } : goal,
        ),
      );
      setEditingSmallGoalId(null);
    } else {
      setSmallGoals((current) => [
        {
          id: Date.now(),
          dateKey: todayKey,
          title,
          completed: false,
          loggedSeconds: 0,
          timerStartedAt: null,
        },
        ...current,
      ]);
    }

    setSmallGoalDraft("");
  };

  const toggleSmallGoal = (id: number) => {
    setSmallGoals((current) =>
      current.map((goal) =>
        goal.id === id ? { ...goal, completed: !goal.completed } : goal,
      ),
    );
  };

  const toggleSmallGoalTimer = (id: number) => {
    const now = new Date();
    setTimerNowMs(now.getTime());

    setSmallGoals((current) =>
      current.map((goal) => {
        if (goal.id !== id) {
          return goal;
        }

        if (goal.timerStartedAt) {
          const startedAtMs = new Date(goal.timerStartedAt).getTime();
          const elapsedSeconds = Number.isNaN(startedAtMs)
            ? 0
            : Math.max(0, Math.floor((now.getTime() - startedAtMs) / 1000));

          return {
            ...goal,
            loggedSeconds: goal.loggedSeconds + elapsedSeconds,
            timerStartedAt: null,
          };
        }

        return {
          ...goal,
          timerStartedAt: now.toISOString(),
        };
      }),
    );
  };

  const deleteSmallGoal = (id: number) => {
    setSmallGoals((current) => current.filter((goal) => goal.id !== id));

    if (editingSmallGoalId === id) {
      setEditingSmallGoalId(null);
      setSmallGoalDraft("");
    }
  };

  const startEditSmallGoal = (goal: SmallGoal) => {
    setEditingSmallGoalId(goal.id);
    setSmallGoalDraft(goal.title);
  };

  const addResource = () => {
    const title = resourceDraft.title.trim();
    const url = normalizeUrl(resourceDraft.url);
    const note = resourceDraft.note.trim();
    const tags = parseTags(resourceDraft.tags);

    if (!title || !url) {
      return;
    }

    if (editingResourceId !== null) {
      setResources((current) =>
        current.map((resource) =>
          resource.id === editingResourceId
            ? { ...resource, title, url, note, tags }
            : resource,
        ),
      );
      setEditingResourceId(null);
    } else {
      setResources((current) => [...current, { id: Date.now(), title, url, note, tags }]);
    }

    setResourceDraft({ title: "", url: "", note: "", tags: "" });
  };

  const startEditingResource = (resource: Resource) => {
    setEditingResourceId(resource.id);
    setExpandedResourceId(resource.id);
    setResourceDraft({
      title: resource.title,
      url: resource.url,
      note: resource.note,
      tags: resource.tags.join(", "),
    });
  };

  const deleteResource = (id: number) => {
    setResources((current) => current.filter((resource) => resource.id !== id));

    if (editingResourceId === id) {
      setEditingResourceId(null);
      setResourceDraft({ title: "", url: "", note: "", tags: "" });
    }

    if (expandedResourceId === id) {
      setExpandedResourceId(null);
    }
  };

  const shareResource = async (resource: Resource) => {
    const tagsText = resource.tags.length > 0 ? `\nTags: ${resource.tags.join(", ")}` : "";
    const shareText = resource.note
      ? `${resource.title}${tagsText}\n\n${resource.note}\n\n${resource.url}`
      : `${resource.title}${tagsText}\n\n${resource.url}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: resource.title,
          text: shareText,
        });
        setResourceMessage("Link shared.");
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setResourceMessage("Link and note copied to share.");
        return;
      }
    } catch {
      setResourceMessage("Sharing did not go through.");
      return;
    }

    setResourceMessage("Sharing is not supported here.");
  };

  const enablePushNotifications = async () => {
    if (!supabase || !cloudUserId) {
      setProfileMessage("Sign in to cloud save before turning on push notifications.");
      return;
    }

    if (
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setPushState("unsupported");
      setProfileMessage("Push notifications are not supported on this device.");
      return;
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!vapidPublicKey) {
      setProfileMessage("Push notifications are not configured yet.");
      return;
    }

    setPushState("setting-up");

    const permission = await window.Notification.requestPermission();
    if (permission !== "granted") {
      setPushState("off");
      setProfileMessage("Push notifications stayed off.");
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();
    const subscription =
      existingSubscription ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      }));

    const { data, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !data.session?.user) {
      setPushState("off");
      setProfileMessage("Your session needs to reconnect before push can turn on.");
      return;
    }

    const { error } = await supabase.from("ember_push_subscriptions").upsert(
      {
        endpoint: subscription.endpoint,
        user_id: data.session.user.id,
        subscription: subscription.toJSON(),
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "endpoint",
      },
    );

    if (error) {
      setPushState("off");
      setProfileMessage(formatCloudError(error, "Push notifications could not turn on."));
      return;
    }

    setPushState("on");
    setProfileMessage("Push notifications are on for this device.");
  };

  const disablePushNotifications = async () => {
    if (
      !supabase ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setPushState("off");
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const { error } = await supabase
        .from("ember_push_subscriptions")
        .delete()
        .eq("endpoint", subscription.endpoint);

      if (error) {
        setProfileMessage(formatCloudError(error, "Push notifications could not turn off."));
        return;
      }

      await subscription.unsubscribe();
    }

    setPushState("off");
    setProfileMessage("Push notifications are off for this device.");
  };

  const sendCloudLink = async () => {
    const email = cloudEmail.trim();

    if (!supabase) {
      setCloudMessage("Connect Supabase first.");
      return;
    }

    if (!email) {
      setCloudMessage("Add your email first.");
      return;
    }

    setCloudStatus("connecting");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.href,
      },
    });

    if (error) {
      setCloudStatus("error");
      setCloudMessage(
        formatCloudError(error, "That sign-in link did not go through."),
      );
      return;
    }

    setCloudStatus("idle");
    setCloudMessage("Check your email for the sign-in link.");
    setCloudEmail("");
  };

  const signOutCloud = async () => {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      setCloudStatus("error");
      setCloudMessage(
        formatCloudError(error, "Sign out did not finish."),
      );
      return;
    }

    setCloudUserId(null);
    setCloudUserEmail("");
    setCloudStatus("idle");
    setCloudMessage("Signed out. Your local copy stays on this device.");
  };

  const exportBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      profile,
      activities,
      smallGoals,
      planItems,
      checkIns,
      resources,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ember-backup-${todayKey ?? "today"}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
    setProfileMessage("Backup exported.");
  };

  const installApp = async () => {
    if (!installPromptEvent) {
      setProfileMessage("Install is not ready on this device yet.");
      return;
    }

    await installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;
    setInstallPromptEvent(null);
    setProfileMessage(
      choice.outcome === "accepted" ? "Ember is being added." : "Install was dismissed.",
    );
  };

  const submitPlanItem = () => {
    const title = planDraft.title.trim();
    const noteText = planDraft.note.trim();

    if (!title || !planDraft.time || !planDraft.dateKey) {
      return;
    }

    if (editingPlanItemId !== null) {
      setPlanItems((current) =>
        current.map((item) =>
          item.id === editingPlanItemId
            ? {
                ...item,
                dateKey: planDraft.dateKey,
                title,
                time: planDraft.time,
                note: noteText,
                reminder: planDraft.reminder,
                repeat: planDraft.repeat,
                customRepeatHours:
                  planDraft.repeat === "custom-hours"
                    ? getCustomRepeatHours(planDraft.customRepeatHours)
                    : null,
                lastReminderKey:
                  item.dateKey !== planDraft.dateKey ||
                  item.time !== planDraft.time ||
                  item.repeat !== planDraft.repeat ||
                  item.customRepeatHours !==
                    (planDraft.repeat === "custom-hours"
                      ? getCustomRepeatHours(planDraft.customRepeatHours)
                      : null)
                    ? null
                    : item.lastReminderKey,
              }
            : item,
        ),
      );
      setEditingPlanItemId(null);
    } else {
      setPlanItems((current) => [
        ...current,
        {
          id: Date.now(),
          dateKey: planDraft.dateKey,
          title,
          time: planDraft.time,
          note: noteText,
          completed: false,
          reminder: planDraft.reminder,
          repeat: planDraft.repeat,
          customRepeatHours:
            planDraft.repeat === "custom-hours"
              ? getCustomRepeatHours(planDraft.customRepeatHours)
              : null,
          lastReminderKey: null,
        },
      ]);
    }

    setPlanDraft(createPlanDraft(selectedPlanDateKey));
  };

  const startEditingPlanItem = (item: PlanItem) => {
    setEditingPlanItemId(item.id);
    setExpandedPlanItemId(item.id);
    setSelectedPlanDateKey(item.dateKey);
    setCalendarMonthKey(getMonthKey(item.dateKey));
    setPlanDraft({
      dateKey: item.dateKey,
      title: item.title,
      time: item.time,
      note: item.note,
      reminder: item.reminder,
      repeat: item.repeat,
      customRepeatHours: item.customRepeatHours ?? 8,
    });
  };

  const deletePlanItem = (id: number) => {
    setPlanItems((current) => current.filter((item) => item.id !== id));

    if (editingPlanItemId === id) {
      setEditingPlanItemId(null);
      setPlanDraft(createPlanDraft(selectedPlanDateKey));
    }

    if (expandedPlanItemId === id) {
      setExpandedPlanItemId(null);
    }
  };

  const togglePlanItem = (id: number) => {
    setPlanItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const rotateInspiration = () => {
    setQuoteIndex((current) => getRandomInspireIndex(current));
  };

  const toggleJourneyEntry = (id: number) => {
    setExpandedEntryId((current) => (current === id ? null : id));
  };

  const startEditingEntry = (entry: CheckIn) => {
    setEditingEntryId(entry.id);
    setExpandedEntryId(entry.id);
    setEntryDraft({
      feeling: entry.feeling,
      note: entry.note,
    });
  };

  const saveEntryEdit = (id: number) => {
    const nextFeeling = entryDraft.feeling.trim();
    const nextNote = entryDraft.note.trim();

    if (!nextFeeling && !nextNote) {
      return;
    }

    setCheckIns((current) =>
      current.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              feeling: nextFeeling || "Quiet, still finding words",
              note: nextNote,
            }
          : entry,
      ),
    );
    setEditingEntryId(null);
    setEntryDraft({ feeling: "", note: "" });
  };

  const cancelEntryEdit = () => {
    setEditingEntryId(null);
    setEntryDraft({ feeling: "", note: "" });
  };

  const deleteEntry = (id: number) => {
    if (!window.confirm("Delete this entry?")) {
      return;
    }

    setCheckIns((current) => current.filter((entry) => entry.id !== id));
    if (expandedEntryId === id) {
      setExpandedEntryId(null);
    }
    if (editingEntryId === id) {
      cancelEntryEdit();
    }
  };

  const scrollToSection = (tabId: TabId) => {
    setActiveTab(tabId);

    window.setTimeout(() => {
      const target = document.getElementById(tabId);

      if (!target) {
        if (tabId === "home" || tabId === "coach") {
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }
        return;
      }

      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const scrollToElement = (elementId: string) => {
    window.setTimeout(() => {
      document.getElementById(elementId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const showOnboarding = isHydrated && !onboardingDismissed && !profile.name.trim();

  return (
    <main className="ember-app min-h-screen bg-background px-4 py-5 text-foreground">
      <div className="ember-shell mx-auto flex w-full max-w-sm flex-col rounded-[2rem] border border-border bg-[linear-gradient(180deg,rgba(19,31,52,0.98),rgba(10,17,30,0.98))] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="ember-content flex-1 space-y-5 px-4 pb-32 pt-6">
          {showOnboarding ? (
            <section className="rounded-[1.6rem] border border-[rgba(255,214,141,0.22)] bg-[linear-gradient(145deg,rgba(77,66,106,0.94),rgba(45,54,92,0.94))] px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Welcome to Ember</p>
                  <p className="mt-1 text-sm text-[#fff1de]">
                    Start with your name, one small win, and one activity.
                  </p>
                </div>
                <button
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-[#fff1de] hover:text-white"
                  onClick={() => setOnboardingDismissed(true)}
                  type="button"
                >
                  Later
                </button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  className="rounded-2xl border border-white/12 bg-white/[0.05] px-3 py-3 text-left"
                  onClick={() => scrollToSection("profile")}
                  type="button"
                >
                  <p className="text-xs uppercase tracking-[0.14em] text-[#efe4ff]">Step 1</p>
                  <p className="mt-1 text-sm font-semibold text-white">Your name</p>
                </button>
                <button
                  className="rounded-2xl border border-white/12 bg-white/[0.05] px-3 py-3 text-left"
                  onClick={() => scrollToElement("today")}
                  type="button"
                >
                  <p className="text-xs uppercase tracking-[0.14em] text-[#efe4ff]">Step 2</p>
                  <p className="mt-1 text-sm font-semibold text-white">Small win</p>
                </button>
                <button
                  className="rounded-2xl border border-white/12 bg-white/[0.05] px-3 py-3 text-left"
                  onClick={() => scrollToSection("coach")}
                  type="button"
                >
                  <p className="text-xs uppercase tracking-[0.14em] text-[#efe4ff]">Step 3</p>
                  <p className="mt-1 text-sm font-semibold text-white">One activity</p>
                </button>
              </div>
            </section>
          ) : null}
          {planReminderMessage ? (
            <section className="relative z-10 rounded-[1.5rem] border border-accent/20 bg-accent-soft px-4 py-4">
              <p className="text-sm font-semibold text-[#fff3e5]">{planReminderMessage}</p>
              <p className="mt-1 text-sm text-[#f8d8b5]">It is time.</p>
            </section>
          ) : null}

          {activityReminderMessage ? (
            <section className="relative z-10 rounded-[1.5rem] border border-accent/20 bg-accent-soft px-4 py-4">
              <p className="text-sm font-semibold text-[#fff3e5]">{activityReminderMessage}</p>
              <p className="mt-1 text-sm text-[#f8d8b5]">It is time.</p>
            </section>
          ) : null}

          <section className="rounded-[1.6rem] border border-[rgba(255,255,255,0.1)] bg-[linear-gradient(150deg,rgba(19,50,90,0.88),rgba(34,44,88,0.92))] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#dff6ff]">Welcome</p>
            <p className="mt-2 font-serif text-[1.5rem] leading-tight text-white">
              {visibleProfile.name ? `Hi, ${visibleProfile.name}` : "Hi there"}
            </p>
            <p className="mt-1.5 text-sm text-muted">
              Let&apos;s make today feel a little clearer and lighter.
            </p>
          </section>

          <section
            className="rounded-[1.6rem] border border-[rgba(183,181,255,0.28)] bg-[linear-gradient(145deg,rgba(58,83,148,0.92),rgba(72,64,130,0.92))] px-4 py-3.5"
            id="inspire"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Inspire</p>
                <p className="mt-1.5 font-serif text-lg leading-snug text-white">
                  {inspireMoments[quoteIndex]?.quote}
                </p>
                <p className="mt-1.5 text-sm text-muted">
                  {inspireMoments[quoteIndex]?.note}
                </p>
              </div>
              <button
                className="shrink-0 rounded-full border border-border px-3 py-1 text-[11px] font-semibold text-accent hover:border-accent"
                onClick={rotateInspiration}
                type="button"
              >
                Next
              </button>
            </div>
          </section>

          <section className="grid grid-cols-4 gap-2">
            <StatCard
              className="min-h-[5rem] px-2 py-2"
              icon="🔥"
              label="Streak"
              tone="rose"
              value={`${streak} days`}
            />
            <StatCard
              className="min-h-[5rem] px-2 py-2"
              icon="⏱"
              label="Today"
              tone="violet"
              value={`${minutesToday} min`}
            />
            <StatCard
              className="min-h-[5rem] px-2 py-2"
              icon="📊"
              label="Weekly"
              tone="indigo"
              value={`${weeklyProgress}%`}
            />
            <StatCard
              className="min-h-[5rem] px-2 py-2"
              icon="🗓"
              label="Calendar"
              onClick={() => scrollToElement("plan")}
              value={`${selectedPlanItems.length} item${selectedPlanItems.length === 1 ? "" : "s"}`}
            />
          </section>

          <section
            className="rounded-[1.75rem] border border-[rgba(104,234,196,0.28)] bg-[linear-gradient(150deg,rgba(18,96,96,0.92),rgba(33,63,101,0.94))] px-4 py-4 scroll-mt-6"
            id="today"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Today</h2>
                <p className="mt-1 text-sm text-[#eef8ff]">
                  {visibleProfile.name
                    ? `${visibleProfile.name}, set today’s focus and save your check-in here.`
                    : "Set today’s focus and save your check-in here."}
                </p>
              </div>
              <button
                className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-[#eef8ff] hover:text-white"
                onClick={() => scrollToSection("journey")}
                type="button"
              >
                Open Reflect
              </button>
            </div>
            <p className="mb-4 text-sm text-[#dff6ff]">
              Visit Reflect to look back on your progress.
            </p>
            <div className="mb-4 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Small win for today</p>
                  <p className="mt-1 text-xs text-muted">Set one small goal.</p>
                </div>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-muted">
                  {todaysGoals.filter((goal) => goal.completed).length}/{todaysGoals.length}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  className="min-w-0 flex-1 rounded-2xl border border-border bg-card-strong px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                  onChange={(event) => setSmallGoalDraft(event.target.value)}
                  placeholder="Add a small goal"
                  value={smallGoalDraft}
                />
                <button
                  className="rounded-2xl border border-accent/40 px-4 py-3 text-sm font-semibold text-accent hover:border-accent"
                  onClick={addSmallGoal}
                  type="button"
                >
                  {editingSmallGoalId !== null ? "Save" : "Add"}
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {todaysGoals.length > 0 ? (
                  todaysGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className="rounded-2xl border border-border bg-card-strong px-3 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm ${
                              goal.completed ? "text-muted line-through" : "text-white"
                            }`}
                          >
                            {goal.title}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {goal.timerStartedAt
                              ? "Running now"
                              : goal.loggedSeconds > 0
                                ? "Time recorded"
                                : "Not started"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-base font-semibold text-white">
                            {goal.timerStartedAt
                              ? formatTimerDuration(getTrackedSeconds(goal, currentTimerMs))
                              : goal.loggedSeconds > 0
                                ? formatTimerDuration(goal.loggedSeconds)
                                : "00:00"}
                          </p>
                          <p className="mt-1 text-[11px] text-muted">
                            {goal.timerStartedAt ? "Live timer" : "Elapsed"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-sm text-muted">
                          <input
                            checked={goal.completed}
                            className="h-5 w-5 accent-[#f2a65a]"
                            onChange={() => toggleSmallGoal(goal.id)}
                            type="checkbox"
                          />
                          Done
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-white"
                            onClick={() => startEditSmallGoal(goal)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                              goal.timerStartedAt
                                ? "border-accent/50 bg-accent-soft text-accent"
                                : "border-border text-muted hover:text-white"
                            }`}
                            onClick={() => toggleSmallGoalTimer(goal.id)}
                            type="button"
                          >
                            {goal.timerStartedAt ? "Stop" : "Start"}
                          </button>
                          <button
                            className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-white"
                            onClick={() => deleteSmallGoal(goal.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : null}
              </div>
            </div>
            {energyLevel === "Low" ? (
              <div className="rounded-2xl border border-accent/20 bg-accent-soft px-4 py-3 text-sm text-[#f8d8b5]">
                Take it easy today. Small steps are enough.
              </div>
            ) : null}
            <div className="mt-4 rounded-[1.6rem] border border-[rgba(255,138,176,0.22)] bg-[linear-gradient(155deg,rgba(126,52,95,0.35),rgba(74,54,112,0.45))] px-4 py-4">
              <h3 className="text-base font-semibold text-white">Daily check-in</h3>
              <p className="mt-1 text-sm text-[#f6efff]">
                Save how today feels, then revisit it in Reflect when you want the bigger picture.
              </p>
              <div className="mt-3 space-y-3">
              <label className="block">
                <span className="mb-2 block text-sm text-muted">Energy today</span>
                <div className="grid grid-cols-3 gap-2">
                  {(["Good", "Okay", "Low"] as const).map((option) => {
                    const isActive = energyLevel === option;

                    return (
                      <button
                        key={option}
                        className={`rounded-2xl border px-3 py-3 text-sm font-semibold ${
                          isActive
                            ? "border-accent bg-accent-soft text-[#fff3e5]"
                            : "border-border bg-card-strong text-muted"
                        }`}
                        onClick={() => setEnergyLevel(option)}
                        type="button"
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-muted">
                  How do you feel today?
                </span>
                <div className="mb-3 grid grid-cols-3 gap-2">
                  {moodChoices.map((mood) => (
                    <button
                      key={mood.label}
                      className={`rounded-2xl border px-3 py-2.5 text-sm ${
                        feeling === mood.value
                          ? "border-accent bg-accent-soft text-[#fff3e5]"
                          : "border-border bg-card-strong text-muted"
                      }`}
                      onClick={() => setFeeling(mood.value)}
                      type="button"
                    >
                      <span className="mr-1.5" aria-hidden="true">
                        {mood.emoji}
                      </span>
                      {mood.label}
                    </button>
                  ))}
                </div>
                <input
                  className="w-full rounded-2xl border border-border bg-card-strong px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                  onChange={(event) => setFeeling(event.target.value)}
                  placeholder="How do you feel today?"
                  value={feeling}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-muted">Notes</span>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-border bg-card-strong px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="A few words about what helped, what felt heavy, or what you need."
                  value={note}
                />
              </label>
              {saveMessage ? (
                <p className="animate-[fadeSoft_2600ms_ease-out] rounded-2xl border border-accent/25 bg-accent-soft px-4 py-3 text-sm text-[#f8d8b5]">
                  {saveMessage}
                </p>
              ) : null}
              <button
                className="w-full rounded-2xl bg-accent px-4 py-3 text-sm font-bold text-slate-950 shadow-[0_10px_30px_rgba(242,166,90,0.24)] hover:-translate-y-0.5 hover:bg-[#ffb66d]"
                onClick={saveCheckIn}
                type="button"
              >
                Save
              </button>
            </div>
            </div>
          </section>

          <section
            className="rounded-[1.75rem] border border-[rgba(126,238,154,0.28)] bg-[linear-gradient(150deg,rgba(26,92,61,0.92),rgba(36,70,102,0.94))] px-4 py-4"
            id="coach"
          >
            <h2 className="text-lg font-semibold text-white">Routine</h2>
            <p className="mt-1 text-sm text-[#effff6]">
              Keep your repeating activities, reminders, and tracked time here.
            </p>
            <div className="mt-4 space-y-3">
                {todaysActivities.map((activity) => {
                  const todayEntry = getActivityHistoryEntry(activity, activeDateKey);
                  const isExpanded = expandedRoutineId === activity.id;
                  const trackedSeconds = getActivityTrackedSeconds(
                    activity,
                    currentTimerMs,
                    activeDateKey,
                  );
                  const isCompletedToday = todayEntry?.completed ?? false;
                  const hasTrackedToday = trackedSeconds > 0;

                  return (
                    <div
                      key={`coach-${activity.id}`}
                      className="rounded-2xl border border-border bg-card-strong px-3 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white">{activity.name}</p>
                            <span
                              aria-hidden="true"
                              className={`text-sm text-accent ${
                                checkedActivityId === activity.id
                                  ? "animate-[softCheck_700ms_ease-out]"
                                  : isCompletedToday
                                    ? "opacity-100"
                                    : "opacity-0"
                              }`}
                            >
                              ✓
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted">
                            {activity.duration} min planned
                            {hasTrackedToday
                              ? ` • ${formatTimerDuration(trackedSeconds)} tracked today`
                              : ""}
                          </p>
                          {activity.reminder ? (
                            <p className="mt-1 text-xs text-[#dff6ff]">
                              Reminder {formatReminderTime(activity.reminderTime)} •{" "}
                              {formatReminderSummary(activity)}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                              todayEntry?.timerStartedAt
                                ? "border-accent/50 bg-accent-soft text-accent"
                                : "border-border text-muted hover:text-white"
                            }`}
                            onClick={() => toggleActivityTimer(activity.id)}
                            type="button"
                          >
                            {todayEntry?.timerStartedAt ? "Stop" : "Start"}
                          </button>
                          <button
                            className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-white"
                            onClick={() =>
                              setExpandedRoutineId((current) =>
                                current === activity.id ? null : activity.id,
                              )
                            }
                            type="button"
                          >
                            {isExpanded ? "Hide" : "Open"}
                          </button>
                        </div>
                      </div>

                      {isExpanded ? (
                        <>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <label className="flex items-center gap-2 text-sm text-muted">
                              <input
                                checked={isCompletedToday}
                                className="h-5 w-5 accent-[#f2a65a]"
                                onChange={() => toggleActivity(activity.id)}
                                type="checkbox"
                              />
                              Done today
                            </label>
                            <div className="text-right">
                              <p className="font-mono text-base font-semibold text-white">
                                {formatTimerDuration(trackedSeconds)}
                              </p>
                              <p className="text-[11px] text-muted">
                                {todayEntry?.timerStartedAt ? "Live timer" : "Tracked today"}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-accent hover:border-accent"
                              onClick={() => startEditActivity(activity)}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted hover:text-white"
                              onClick={() => deleteActivity(activity.id)}
                              type="button"
                            >
                              Delete
                            </button>
                            <button
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                activity.reminder
                                  ? "bg-accent-soft text-accent"
                                  : "border border-border text-muted"
                              }`}
                              onClick={() =>
                                updateActivityReminder(activity.id, {
                                  reminder: !activity.reminder,
                                  reminderStartDateKey:
                                    activity.reminderStartDateKey || getTodayKey(),
                                  lastReminderKey: null,
                                })
                              }
                              type="button"
                            >
                              {activity.reminder ? "Reminder on" : "Reminder off"}
                            </button>
                          </div>
                          {activity.reminder ? (
                            <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.03] p-2.5">
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  className="min-w-0 rounded-xl border border-border bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-accent"
                                  onChange={(event) =>
                                    updateActivityReminder(activity.id, {
                                      reminderTime: event.target.value,
                                      lastReminderKey: null,
                                    })
                                  }
                                  type="time"
                                  value={activity.reminderTime}
                                />
                                <select
                                  className="w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-accent"
                                  onChange={(event) =>
                                    updateActivityReminder(activity.id, {
                                      repeat: event.target.value as PlanReminderRepeat,
                                      lastReminderKey: null,
                                    })
                                  }
                                  value={activity.repeat}
                                >
                                  {planReminderOptions
                                    .filter((option) => option.value !== "none")
                                    .map((option) => (
                                      <option
                                        key={`${activity.id}-${option.value}`}
                                        className="bg-[#11192a] text-white"
                                        value={option.value}
                                      >
                                        {option.label}
                                      </option>
                                    ))}
                                </select>
                              </div>
                              {activity.repeat === "custom-hours" ? (
                                <input
                                  className="mt-2 w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-accent"
                                  max="24"
                                  min="1"
                                  onChange={(event) =>
                                    updateActivityReminder(activity.id, {
                                      customRepeatHours: Number(event.target.value) || 1,
                                      lastReminderKey: null,
                                    })
                                  }
                                  placeholder="Hours between reminders"
                                  type="number"
                                  value={activity.customRepeatHours ?? 8}
                                />
                              ) : null}
                              {(activity.repeat === "weekly" ||
                                activity.repeat === "monthly" ||
                                activity.repeat === "yearly") ? (
                                <p className="mt-2 text-[11px] text-muted">
                                  Repeats from {activity.reminderStartDateKey}.
                                </p>
                              ) : null}
                            </div>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  );
                })}
            </div>
            <div className="mt-4 space-y-3 rounded-2xl border border-border bg-card-strong p-3">
                <input
                  className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                  onChange={(event) =>
                    setActivityDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Add an activity"
                  value={activityDraft.name}
                />
                <input
                  className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                  min="1"
                  onChange={(event) =>
                    setActivityDraft((current) => ({
                      ...current,
                      duration: event.target.value,
                    }))
                  }
                  placeholder="Minutes"
                  type="number"
                  value={activityDraft.duration}
                />
                <button
                  className="w-full rounded-2xl border border-accent/50 bg-accent-soft px-4 py-3 text-sm font-semibold text-accent hover:border-accent"
                  onClick={submitActivity}
                  type="button"
                >
                  {editingId !== null ? "Update activity" : "Add activity"}
                </button>
            </div>
          </section>

          <section
            className="space-y-4 rounded-[1.75rem] border border-[rgba(90,222,255,0.3)] bg-[linear-gradient(150deg,rgba(27,105,138,0.92),rgba(41,78,126,0.94))] px-4 py-4"
            id="plan"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Calendar</h2>
                <p className="mt-1 text-sm text-muted">
                  {formatPlanDayLabel(selectedPlanDateKey, todayKey)}
                </p>
                <p className="mt-2 text-sm text-[#eef7ff]">
                  Keep your appointments, events, and reminders in one place.
                </p>
              </div>
              <button
                className="rounded-full border border-accent/40 px-4 py-2 text-sm font-semibold text-accent hover:border-accent"
                onClick={() => {
                  setEditingPlanItemId(null);
                  setPlanDraft(createPlanDraft(selectedPlanDateKey));
                  scrollToPlanTarget("plan-form");
                }}
                type="button"
              >
                Add item
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#e6f7ff]">On this day</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {selectedPlanItems.length}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3">
                <p className="text-[10px] leading-tight uppercase tracking-[0.12em] text-[#e6f7ff]">
                  Completed
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {selectedPlanCompletedCount}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3">
                <p className="text-[10px] leading-tight uppercase tracking-[0.12em] text-[#e6f7ff]">
                  Reminders
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {selectedPlanReminderCount}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card-strong p-3">
              <div className="mb-3 flex items-center justify-between">
                <button
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-white"
                  onClick={() => setCalendarMonthKey((current) => shiftMonth(current, -1))}
                  type="button"
                >
                  Prev
                </button>
                <p className="text-sm font-semibold text-white">
                  {formatMonthLabel(calendarMonthKey)}
                </p>
                <button
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-white"
                  onClick={() => setCalendarMonthKey((current) => shiftMonth(current, 1))}
                  type="button"
                >
                  Next
                </button>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center">
                {weekdayLabels.map((label, index) => (
                  <span key={`${label}-${index}`} className="text-[11px] text-muted">
                    {label}
                  </span>
                ))}
                {calendarDays.map((day) => {
                  const hasItems = visiblePlanItems.some((item) => item.dateKey === day.dateKey);
                  const isSelected = selectedPlanDateKey === day.dateKey;

                  return (
                    <button
                      key={day.dateKey}
                      className={`rounded-2xl px-0 py-2 text-sm ${
                        isSelected
                          ? "bg-accent text-slate-950"
                          : day.inMonth
                            ? "bg-[#101b2e] text-white"
                            : "bg-transparent text-muted"
                      }`}
                      onClick={() => {
                        setSelectedPlanDateKey(day.dateKey);
                        setCalendarMonthKey(getMonthKey(day.dateKey));
                        setPlanDraft((current) => ({
                          ...current,
                          dateKey: day.dateKey,
                        }));
                        scrollToPlanTarget(
                          visiblePlanItems.some((item) => item.dateKey === day.dateKey)
                            ? "plan-day-items"
                            : "plan-form",
                        );
                      }}
                      type="button"
                    >
                      <span className="block">{day.dayNumber}</span>
                      <span
                        className={`mx-auto mt-1 block h-1.5 w-1.5 rounded-full ${
                          hasItems ? "bg-current opacity-80" : "bg-transparent"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="scroll-mt-6 space-y-3" id="plan-day-items">
              <div>
                <p className="text-sm font-semibold text-white">What is on this day</p>
                <p className="mt-1 text-sm text-[#eef7ff]">Everything you have saved for this date.</p>
              </div>
              {selectedPlanItems.map((item) => {
                const isExpanded = expandedPlanItemId === item.id;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border bg-card-strong px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            checked={item.completed}
                            className="h-5 w-5 accent-[#f2a65a]"
                            onChange={() => togglePlanItem(item.id)}
                            type="checkbox"
                          />
                          <p
                            className={`text-sm font-semibold ${
                              item.completed ? "text-muted line-through" : "text-white"
                            }`}
                          >
                            {item.title}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-[#f8d8b5]">
                          {formatReminderTime(item.time)}
                          {item.reminder ? ` • ${formatReminderSummary(item)}` : ""}
                        </p>
                      </div>
                      <button
                        className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-white"
                        onClick={() =>
                          setExpandedPlanItemId((current) => (current === item.id ? null : item.id))
                        }
                        type="button"
                      >
                        {isExpanded ? "Hide" : "Open"}
                      </button>
                    </div>
                    {isExpanded ? (
                      <div className="mt-3 border-t border-border pt-3">
                        {item.note ? (
                          <p className="text-sm leading-6 text-[#dbe0e8]">{item.note}</p>
                        ) : (
                          <p className="text-sm text-muted">No note saved for this item.</p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-white"
                            onClick={() => startEditingPlanItem(item)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-white"
                            onClick={() => deletePlanItem(item.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {selectedPlanItems.length === 0 ? (
                <p className="rounded-2xl border border-border bg-card-strong px-4 py-4 text-sm text-muted">
                  Nothing here yet. Add an event, appointment, or task.
                </p>
              ) : null}
            </div>

            <div
              className="scroll-mt-6 space-y-3 rounded-2xl border border-border bg-card-strong p-3"
              id="plan-form"
            >
              <div>
                <p className="text-sm font-semibold text-white">
                  {editingPlanItemId !== null ? "Edit item" : "Add item"}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Add a title, date, time, and an optional note.
                </p>
              </div>
              <input
                className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                onChange={(event) =>
                  setPlanDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Item title"
                value={planDraft.title}
              />
              <input
                className="ember-native-picker w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-white outline-none focus:border-accent"
                onChange={(event) => {
                  const nextDateKey = event.target.value;

                  setPlanDraft((current) => ({
                    ...current,
                    dateKey: nextDateKey,
                  }));
                  setSelectedPlanDateKey(nextDateKey);
                  setCalendarMonthKey(getMonthKey(nextDateKey));
                }}
                type="date"
                value={planDraft.dateKey}
              />
              <input
                className="ember-native-picker w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-white outline-none focus:border-accent"
                onChange={(event) =>
                  setPlanDraft((current) => ({
                    ...current,
                    time: event.target.value,
                  }))
                }
                type="time"
                value={planDraft.time}
              />
              <button
                className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                  planDraft.reminder
                    ? "border-accent/50 bg-accent-soft text-accent"
                    : "border-border text-muted"
                }`}
                onClick={() =>
                  setPlanDraft((current) => ({
                    ...current,
                    reminder: !current.reminder,
                  }))
                }
                type="button"
              >
                <span aria-hidden="true">{planDraft.reminder ? "🔔" : "🔕"}</span>
                <span>{planDraft.reminder ? "Reminder on" : "Reminder off"}</span>
              </button>
              {planDraft.reminder ? (
                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-[0.14em] text-muted">
                    Reminder schedule
                  </label>
                  <select
                    className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-white outline-none focus:border-accent"
                    onChange={(event) =>
                      setPlanDraft((current) => ({
                        ...current,
                        repeat: event.target.value as PlanReminderRepeat,
                      }))
                    }
                    value={planDraft.repeat}
                    >
                      {planReminderOptions.map((option) => (
                        <option key={option.value} className="bg-[#11192a] text-white" value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  {planDraft.repeat === "custom-hours" ? (
                    <div className="space-y-2">
                      <label className="block text-sm text-muted">
                        How many hours between reminders?
                      </label>
                      <input
                        className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-white outline-none focus:border-accent"
                        max="24"
                        min="1"
                        onChange={(event) =>
                          setPlanDraft((current) => ({
                            ...current,
                            customRepeatHours: Number(event.target.value) || 1,
                          }))
                        }
                        placeholder="Enter hours"
                        type="number"
                        value={planDraft.customRepeatHours}
                      />
                      <p className="text-xs text-muted">
                        Choose a number from 1 to 24.
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <textarea
                className="min-h-24 w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                onChange={(event) =>
                  setPlanDraft((current) => ({
                    ...current,
                    note: event.target.value,
                  }))
                }
                placeholder="Optional note"
                value={planDraft.note}
              />
              <button
                className="w-full rounded-2xl border border-accent/50 bg-accent-soft px-4 py-3 text-sm font-semibold text-accent hover:border-accent"
                onClick={submitPlanItem}
                type="button"
              >
                {editingPlanItemId !== null ? "Save item" : "Add item"}
              </button>
            </div>
          </section>

          <section
            className="space-y-4 rounded-[1.75rem] border border-[rgba(195,132,255,0.3)] bg-[linear-gradient(150deg,rgba(93,54,145,0.92),rgba(54,55,104,0.94))] px-4 py-4"
            id="journey"
          >
              <h2 className="text-lg font-semibold text-white">Reflect</h2>
              <p className="text-sm text-[#f4ebff]">
                A place to connect the dots of your days.
              </p>

              <div className="rounded-2xl border border-border bg-card-strong px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-white">Your days</p>
                  <input
                    className="w-full max-w-[11rem] rounded-2xl border border-border bg-transparent px-4 py-2.5 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                    onChange={(event) => setReflectSearch(event.target.value)}
                    placeholder="Search date, feeling, or note"
                    value={reflectSearch}
                  />
                </div>
                {filteredJourneyGroups.length === 0 ? (
                  <p className="mt-3 rounded-2xl border border-border bg-[#101b2e] px-4 py-4 text-sm leading-6 text-muted">
                    {reflectSearch.trim()
                      ? "Nothing matched this search yet."
                      : "Your reflections will gather here over time."}
                  </p>
                ) : (
                  <div className="mt-3 space-y-5">
                    {filteredJourneyGroups.map((group) => (
                      <section key={group.dateKey} className="space-y-3">
                        <div className="px-1">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted">
                            {group.label}
                          </p>
                          <p className="mt-2 text-sm text-[#f2ecff]">
                            {group.summary}
                          </p>
                        </div>
                        <div className="space-y-3">
                          {group.entries.map((entry) => (
                            <div
                              key={entry.id}
                              className="rounded-2xl border border-border bg-[#101b2e] px-3 py-3"
                            >
                              <button
                                className="w-full text-left"
                                onClick={() => toggleJourneyEntry(entry.id)}
                                type="button"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-white">
                                      {entry.date}
                                    </p>
                                    <p className="mt-1 truncate text-sm text-[#dbe0e8]">
                                      {entry.feeling || "Check-in saved"}
                                    </p>
                                  </div>
                                  <span className="shrink-0 text-xs text-accent">
                                    {expandedEntryId === entry.id ? "Hide" : "Open"}
                                  </span>
                                </div>
                              </button>
                              {expandedEntryId === entry.id ? (
                                <div className="mt-3 border-t border-border pt-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm text-muted">
                                      Entry details
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <button
                                        className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-white"
                                        onClick={() => startEditingEntry(entry)}
                                        type="button"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-white"
                                        onClick={() => deleteEntry(entry.id)}
                                        type="button"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                  {editingEntryId === entry.id ? (
                                    <div className="mt-3 space-y-3">
                                      <input
                                        className="w-full rounded-2xl border border-border bg-card-strong px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                                        onChange={(event) =>
                                          setEntryDraft((current) => ({
                                            ...current,
                                            feeling: event.target.value,
                                          }))
                                        }
                                        placeholder="Feeling"
                                        value={entryDraft.feeling}
                                      />
                                      <textarea
                                        className="min-h-24 w-full rounded-2xl border border-border bg-card-strong px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                                        onChange={(event) =>
                                          setEntryDraft((current) => ({
                                            ...current,
                                            note: event.target.value,
                                          }))
                                        }
                                        placeholder="Notes"
                                        value={entryDraft.note}
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          className="flex-1 rounded-2xl border border-accent/50 bg-accent-soft px-4 py-3 text-sm font-semibold text-accent"
                                          onClick={() => saveEntryEdit(entry.id)}
                                          type="button"
                                        >
                                          Save
                                        </button>
                                        <button
                                          className="flex-1 rounded-2xl border border-border px-4 py-3 text-sm text-muted"
                                          onClick={cancelEntryEdit}
                                          type="button"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="mt-3 text-sm leading-6 text-[#dbe0e8]">
                                        {entry.note || "No notes saved for this day."}
                                      </p>
                                      <p className="mt-3 text-sm text-muted">
                                        Energy felt {entry.energyLevel?.toLowerCase()}.
                                      </p>
                                    </>
                                  )}
                                  <div className="mt-4">
                                    <p className="text-xs uppercase tracking-[0.18em] text-muted">
                                      Completed activities
                                    </p>
                                    {entry.completedActivities.length > 0 ? (
                                      <div className="mt-2 space-y-2">
                                        {entry.completedActivities.map((activity) => (
                                          <div
                                            key={`${entry.id}-${activity.name}-${activity.duration}`}
                                            className="flex items-center justify-between rounded-xl bg-[rgba(255,255,255,0.03)] px-3 py-2"
                                          >
                                            <span className="text-sm text-white">
                                              {activity.name}
                                            </span>
                                            <span className="text-xs text-muted">
                                              {activity.duration} min
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="mt-2 text-sm text-muted">
                                        This moment was mostly about checking in.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>
          </section>

          <section
            className="space-y-4 rounded-[1.75rem] border border-[rgba(121,207,255,0.28)] bg-[linear-gradient(150deg,rgba(39,78,122,0.92),rgba(35,61,104,0.94))] px-4 py-4"
            id="resource"
          >
            <div>
              <h2 className="text-lg font-semibold text-white">Resource</h2>
              <p className="mt-1 text-sm text-[#eef6ff]">
                Save articles, links, and notes here.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card-strong px-4 py-4">
              {resourceMessage ? (
                <p className="rounded-2xl border border-accent/25 bg-accent-soft px-4 py-3 text-sm text-[#f8d8b5]">
                  {resourceMessage}
                </p>
              ) : null}
              <input
                className="mt-3 w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                onChange={(event) => setResourceSearch(event.target.value)}
                placeholder="Search by title, note, or tag"
                value={resourceSearch}
              />
              <div className="mt-3 space-y-3">
                {filteredResources.map((resource) => {
                  const isExpanded = expandedResourceId === resource.id;

                  return (
                    <div
                      key={resource.id}
                      className="rounded-2xl border border-border bg-[#101b2e] px-3 py-3"
                    >
                      <button
                        className="w-full text-left"
                        onClick={() =>
                          setExpandedResourceId((current) =>
                            current === resource.id ? null : resource.id,
                          )
                        }
                        type="button"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">{resource.title}</p>
                            <p className="mt-1 truncate text-xs text-muted">{resource.url}</p>
                          </div>
                          <span className="shrink-0 text-xs text-accent">
                            {isExpanded ? "Hide" : "Open"}
                          </span>
                        </div>
                      </button>
                      {isExpanded ? (
                        <div className="mt-3 border-t border-border pt-3">
                          {resource.note ? (
                            <p className="whitespace-normal break-words text-sm leading-6 text-[#eef6ff]">
                              {resource.note}
                            </p>
                          ) : (
                            <p className="text-sm text-muted">No note saved for this resource.</p>
                          )}
                          {resource.tags.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {resource.tags.map((tag) => (
                                <span
                                  key={`${resource.id}-${tag}`}
                                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-[#d9e8ff]"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <a
                              className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-white"
                              href={resource.url}
                              rel="noreferrer"
                              target="_blank"
                            >
                              Open link
                            </a>
                            <button
                              className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-white"
                              onClick={() => {
                                void shareResource(resource);
                              }}
                              type="button"
                            >
                              Share
                            </button>
                            <button
                              className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-white"
                              onClick={() => startEditingResource(resource)}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="rounded-full border border-border px-3 py-1 text-xs text-muted hover:text-white"
                              onClick={() => deleteResource(resource.id)}
                              type="button"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 space-y-3">
                <input
                  className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                  onChange={(event) =>
                    setResourceDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Resource title"
                  value={resourceDraft.title}
                />
                <input
                  className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                  onChange={(event) =>
                    setResourceDraft((current) => ({
                      ...current,
                      url: event.target.value,
                    }))
                  }
                  placeholder="https://"
                  type="url"
                  value={resourceDraft.url}
                />
                <input
                  className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                  onChange={(event) =>
                    setResourceDraft((current) => ({
                      ...current,
                      tags: event.target.value,
                    }))
                  }
                  placeholder="Tags, separated by commas"
                  value={resourceDraft.tags}
                />
                <textarea
                  className="min-h-24 w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                  onChange={(event) =>
                    setResourceDraft((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  placeholder="Add a note"
                  value={resourceDraft.note}
                />
                <button
                  className="w-full rounded-2xl border border-accent/50 bg-accent-soft px-4 py-3 text-sm font-semibold text-accent hover:border-accent"
                  onClick={addResource}
                  type="button"
                >
                  {editingResourceId !== null ? "Save resource" : "Add resource"}
                </button>
              </div>
            </div>
          </section>

          <section
            className="space-y-4 rounded-[1.75rem] border border-[rgba(122,207,255,0.28)] bg-[linear-gradient(150deg,rgba(37,82,132,0.92),rgba(56,74,126,0.94))] px-4 py-4"
            id="profile"
          >
            <div>
              <h2 className="text-lg font-semibold text-white">Profile</h2>
              <p className="mt-1 text-sm text-[#eef6ff]">
                Your details and settings in one place.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white">Cloud save</p>
                  <p className="mt-1 text-sm text-[#eef6ff]">
                    Sign in once and keep the same data across your devices.
                  </p>
                </div>
                <span className="rounded-full border border-white/12 px-3 py-1 text-xs text-[#eef6ff]">
                  {cloudStatusText}
                </span>
              </div>
              {!cloudEnabled ? (
                <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#eef6ff]">
                  Cloud save will be ready after Supabase is connected.
                </p>
              ) : cloudUserId ? (
                <div className="mt-3 space-y-3">
                  <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#eef6ff]">
                    Signed in as <span className="text-white">{cloudUserEmail}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-[#eef6ff] hover:text-white"
                      onClick={() => {
                        void signOutCloud();
                      }}
                      type="button"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  <input
                    className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                    onChange={(event) => setCloudEmail(event.target.value)}
                    placeholder="Email for private cloud save"
                    type="email"
                    value={cloudEmail}
                  />
                  <button
                    className="w-full rounded-2xl border border-accent/40 px-4 py-3 text-sm font-semibold text-accent hover:border-accent"
                    onClick={() => {
                      void sendCloudLink();
                    }}
                    type="button"
                  >
                    Turn on sync
                  </button>
                </div>
              )}
              {cloudMessage ? (
                <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-[#eef6ff]">
                  {cloudMessage}
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4">
              <p className="text-base font-semibold text-white">
                {visibleProfile.name ? visibleProfile.name : "Profile tools"}
              </p>
              <p className="mt-2 text-sm text-[#eef6ff]">
                Push alerts, app install, and backup.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {installPromptEvent ? (
                  <button
                    className="rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-[#eef6ff] hover:text-white"
                    onClick={() => {
                      void installApp();
                    }}
                    type="button"
                  >
                    Install app
                  </button>
                ) : null}
                <button
                  className="rounded-full border border-accent/40 px-4 py-2 text-sm font-semibold text-accent hover:border-accent"
                  onClick={() => {
                    void (pushState === "on"
                      ? disablePushNotifications()
                      : enablePushNotifications());
                  }}
                  type="button"
                >
                  {pushState === "setting-up"
                    ? "Turning on push..."
                    : pushState === "on"
                      ? "Push on"
                      : pushState === "unsupported"
                        ? "Push unsupported"
                        : "Enable push"}
                </button>
                <button
                  className="rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-[#eef6ff] hover:text-white"
                  onClick={exportBackup}
                  type="button"
                >
                  Export backup
                </button>
              </div>
              {profileMessage ? (
                <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-[#eef6ff]">
                  {profileMessage}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#e7f5ff]">Weight</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {visibleProfile.weight || "Add"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#e7f5ff]">Pressure</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {visibleProfile.bloodPressure || "Add"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#e7f5ff]">Heart</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {visibleProfile.heartRate || "Add"}
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border bg-card-strong p-3">
              <div>
                <p className="text-sm font-semibold text-white">Your details</p>
                <p className="mt-1 text-sm text-muted">Add or update the information you want saved here.</p>
              </div>
              <input
                className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Your name"
                value={profile.name}
              />
              <input
                className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    weight: event.target.value,
                  }))
                }
                placeholder="Weight"
                value={profile.weight}
              />
              <input
                className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    bloodPressure: event.target.value,
                  }))
                }
                placeholder="Blood pressure"
                value={profile.bloodPressure}
              />
              <input
                className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    heartRate: event.target.value,
                  }))
                }
                placeholder="Heart rate"
                value={profile.heartRate}
              />
              <textarea
                className="min-h-24 w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder="Anything you want Ember to hold onto here"
                value={profile.notes}
              />
            </div>
          </section>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto w-full max-w-sm border-t border-border bg-[rgba(9,17,30,0.94)] px-3 pb-6 pt-3 backdrop-blur">
          <div className="flex flex-row flex-nowrap gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  className={`min-w-0 flex-1 whitespace-nowrap rounded-2xl px-1 py-2.5 text-[10px] font-semibold text-center ${
                    isActive
                      ? "bg-accent text-slate-950"
                      : "bg-card text-muted hover:text-white"
                  }`}
                  onClick={() => scrollToSection(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </main>
  );
}

function StatCard({
  className,
  icon,
  label,
  onClick,
  tone = "default",
  value,
}: {
  className?: string;
  icon: string;
  label: string;
  onClick?: () => void;
  tone?: "default" | "rose" | "violet" | "indigo";
  value: string;
}) {
  const accentClass =
    tone === "rose"
      ? "text-[#ffb3cf]"
      : tone === "violet"
        ? "text-[#c9b7ff]"
        : tone === "indigo"
          ? "text-[#a8b9ff]"
          : "text-accent";

  if (onClick) {
    return (
      <button
        className={`w-full rounded-[2.35rem] border border-white/6 bg-white/[0.03] text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:-translate-y-0.5 hover:border-white/12 hover:bg-white/[0.05] ${className ?? "px-3 py-4"}`}
        onClick={onClick}
        type="button"
      >
        <p className={`text-lg ${accentClass}`}>{icon}</p>
        <p className={`mt-3 text-xs tracking-[0.08em] ${accentClass}`}>{label}</p>
        <p className="mt-1 text-sm font-semibold text-white">{value}</p>
      </button>
    );
  }

  return (
    <article
      className={`rounded-[2.35rem] border border-white/6 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${className ?? "px-3 py-4"}`}
    >
      <p className={`text-base ${accentClass}`}>{icon}</p>
      <p className={`mt-2 text-[11px] tracking-[0.08em] ${accentClass}`}>{label}</p>
      <p className="mt-1 text-[13px] font-semibold text-white">{value}</p>
    </article>
  );
}

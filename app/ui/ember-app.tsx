"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type TabId = "home" | "coach" | "plan" | "journey" | "profile";

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
  lastReminderDate: string | null;
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
};

type PlanItem = {
  id: number;
  dateKey: string;
  title: string;
  time: string;
  note: string;
  completed: boolean;
  reminder: boolean;
  lastReminderDate: string | null;
};

type Profile = {
  name: string;
  weight: string;
  bloodPressure: string;
  heartRate: string;
  notes: string;
};

const inspireMoments = [
  {
    quote: "Small steps still move you forward.",
    note: "A little progress is still progress.",
  },
  {
    quote: "Healing can be quiet and still be real.",
    note: "Not every strong day looks loud.",
  },
  {
    quote: "Rest counts. Beginning again counts too.",
    note: "Both are part of steady care.",
  },
  {
    quote: "You do not need to rush your way back to yourself.",
    note: "Gentleness can still carry you home.",
  },
  {
    quote: "One day at a time is enough.",
    note: "Today is not asking for forever.",
  },
  {
    quote: "Softness is not weakness.",
    note: "It can be a form of strength.",
  },
  {
    quote: "You are allowed to begin quietly.",
    note: "A slow start still counts.",
  },
  {
    quote: "The smallest kindness can change a day.",
    note: "Especially when you offer it to yourself.",
  },
  {
    quote: "You have survived hard days before.",
    note: "That strength is still with you.",
  },
  {
    quote: "Breathe here. Stay with this moment.",
    note: "You only need to meet what is here now.",
  },
  {
    quote: "Even tired hearts can keep going.",
    note: "Steady does not mean fast.",
  },
  {
    quote: "Not every step has to feel certain.",
    note: "Moving gently is still moving.",
  },
  {
    quote: "There is courage in showing up softly.",
    note: "Quiet effort is still effort.",
  },
  {
    quote: "You can honor your limits and still grow.",
    note: "Care and progress belong together.",
  },
  {
    quote: "Today can be simple.",
    note: "Simple can still be meaningful.",
  },
  {
    quote: "A pause is not the same as giving up.",
    note: "Breathing room can help you continue.",
  },
  {
    quote: "Strength can look like resting on purpose.",
    note: "Recovery is active in its own way.",
  },
  {
    quote: "Your pace is still a pace.",
    note: "You do not need to match anyone else.",
  },
  {
    quote: "You are rebuilding, not behind.",
    note: "This season has its own rhythm.",
  },
  {
    quote: "Hope can be very quiet.",
    note: "It still matters when it whispers.",
  },
  {
    quote: "Your effort matters, even when unseen.",
    note: "Private wins still count.",
  },
  {
    quote: "Some days the brave thing is staying gentle.",
    note: "That is enough for today.",
  },
  {
    quote: "You are allowed to heal without hurrying.",
    note: "Time can be part of the medicine.",
  },
  {
    quote: "Keep the promise of one small step.",
    note: "The next right thing can be tiny.",
  },
  {
    quote: "There is wisdom in slowing down.",
    note: "Listening is a form of care.",
  },
  {
    quote: "You do not need a perfect day to make progress.",
    note: "Imperfect care still nourishes.",
  },
  {
    quote: "Something steady is growing in you.",
    note: "Even if you cannot feel it yet.",
  },
  {
    quote: "Gentle routines can hold heavy hearts.",
    note: "Let small anchors carry some weight.",
  },
  {
    quote: "Your body and mind are worthy of patience.",
    note: "Tenderness belongs here too.",
  },
  {
    quote: "There is no shame in starting again.",
    note: "Fresh starts can happen any hour.",
  },
  {
    quote: "You are doing meaningful work in small ways.",
    note: "Healing often happens quietly.",
  },
  {
    quote: "Some progress is only visible in hindsight.",
    note: "It can still be real today.",
  },
  {
    quote: "A calm step is still a strong step.",
    note: "You do not have to push to move forward.",
  },
  {
    quote: "Let this be a day of enough.",
    note: "Enough is a gentle achievement.",
  },
  {
    quote: "There is room for both grief and growth.",
    note: "More than one truth can live together.",
  },
  {
    quote: "Your breath can be a place to return to.",
    note: "Come back to it whenever you need.",
  },
  {
    quote: "Healing is not linear, but it is still movement.",
    note: "Curves and pauses count too.",
  },
  {
    quote: "You can be tender and resilient at once.",
    note: "Both can live in the same day.",
  },
  {
    quote: "Some days the win is simply staying present.",
    note: "Presence is its own kind of courage.",
  },
  {
    quote: "Your quiet effort is building something real.",
    note: "Keep trusting the small pieces.",
  },
  {
    quote: "You are not failing because this is hard.",
    note: "Hard things are hard for a reason.",
  },
  {
    quote: "A softer approach can still carry strength.",
    note: "Gentle does not mean fragile.",
  },
  {
    quote: "Today is a chance to begin again with kindness.",
    note: "You can restart without scolding yourself.",
  },
  {
    quote: "Even now, there is something worth honoring.",
    note: "Maybe it is simply that you stayed.",
  },
  {
    quote: "Your story is allowed to unfold slowly.",
    note: "You do not need to rush the chapter.",
  },
  {
    quote: "Keep going, but keep going gently.",
    note: "The way you move matters too.",
  },
  {
    quote: "The day does not have to be easy to be meaningful.",
    note: "Care still counts on difficult days.",
  },
  {
    quote: "You are closer than you think.",
    note: "Quiet consistency adds up.",
  },
  {
    quote: "There is strength in choosing the next small good thing.",
    note: "Let that be enough for now.",
  },
  {
    quote: "You are still becoming, even here.",
    note: "Growth can happen in recovery too.",
  },
];

const saveMessages = [
  "You showed up today. That matters.",
  "Small steps still count.",
  "You’re doing better than you think.",
  "One day at a time.",
];

const initialActivities: Activity[] = [
  {
    id: 1,
    name: "Morning stretch",
    duration: 10,
    completed: true,
    loggedSeconds: 0,
    timerStartedAt: null,
    lowEnergy: true,
    reminder: true,
    reminderTime: "08:30",
    lastReminderDate: null,
  },
  {
    id: 2,
    name: "Gentle walk",
    duration: 20,
    completed: false,
    loggedSeconds: 0,
    timerStartedAt: null,
    reminder: false,
    reminderTime: "12:00",
    lastReminderDate: null,
  },
  {
    id: 3,
    name: "Breathing reset",
    duration: 5,
    completed: true,
    loggedSeconds: 0,
    timerStartedAt: null,
    lowEnergy: true,
    reminder: true,
    reminderTime: "15:00",
    lastReminderDate: null,
  },
  {
    id: 4,
    name: "Evening journal",
    duration: 15,
    completed: false,
    loggedSeconds: 0,
    timerStartedAt: null,
    reminder: false,
    reminderTime: "20:00",
    lastReminderDate: null,
  },
];

const initialCheckIns: CheckIn[] = [
  {
    id: 1,
    dateKey: "2026-03-31",
    timestamp: "2026-03-31T20:15:00.000Z",
    feeling: "Steady, a little tired",
    note: "Took things slowly and still made progress.",
    date: "Mar 31 • 8:15 PM",
    energyLevel: "Okay",
    completedActivities: [
      { name: "Morning stretch", duration: 10 },
      { name: "Breathing reset", duration: 5 },
    ],
    completedMinutes: 15,
  },
  {
    id: 2,
    dateKey: "2026-03-30",
    timestamp: "2026-03-30T18:40:00.000Z",
    feeling: "Heavy, but hopeful",
    note: "A short walk helped me feel less stuck.",
    date: "Mar 30 • 6:40 PM",
    energyLevel: "Low",
    completedActivities: [{ name: "Gentle walk", duration: 20 }],
    completedMinutes: 20,
  },
];

const initialResources: Resource[] = [
  {
    id: 1,
    title: "Box breathing guide",
    url: "https://www.health.harvard.edu/mind-and-mood/relaxation-techniques-breath-control-helps-quell-errant-stress-response",
    note: "A calming reset when the day feels tight or heavy.",
  },
  {
    id: 2,
    title: "Gentle desk stretches",
    url: "https://www.nhs.uk/live-well/exercise/exercises-for-flexibility/",
    note: "Helpful for loosening up after sitting for a while.",
  },
];

const initialPlanItems: PlanItem[] = [
  {
    id: 1,
    dateKey: "2026-03-31",
    title: "Take medication",
    time: "09:00",
    note: "With breakfast and water.",
    completed: false,
    reminder: true,
    lastReminderDate: null,
  },
  {
    id: 2,
    dateKey: "2026-04-01",
    title: "Short evening stretch",
    time: "19:30",
    note: "",
    completed: false,
    reminder: true,
    lastReminderDate: null,
  },
];

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
  { id: "coach", label: "Coach" },
  { id: "plan", label: "Plan" },
  { id: "journey", label: "Journal" },
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

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
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

function buildPreview(note: string) {
  if (!note.trim()) {
    return "No notes saved for this day.";
  }

  return note.length > 90 ? `${note.slice(0, 90)}...` : note;
}

function calculateStreak(
  checkIns: CheckIn[],
  hasCompletedToday: boolean,
  currentDayKey: string,
) {
  if (!hasCompletedToday) {
    return 0;
  }

  const days = new Set(
    checkIns
      .filter(
        (entry) =>
          entry.completedActivities.length > 0 || (entry.completedMinutes ?? 0) > 0,
      )
      .map((entry) => entry.dateKey),
  );
  days.add(currentDayKey);
  let streak = 0;
  let cursor = new Date(`${currentDayKey}T12:00:00`);

  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
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

function getActivityTrackedSeconds(activity: Pick<Activity, "loggedSeconds" | "timerStartedAt">, nowMs: number) {
  const baseSeconds = activity.loggedSeconds ?? 0;

  if (!activity.timerStartedAt) {
    return baseSeconds;
  }

  const startedAtMs = new Date(activity.timerStartedAt).getTime();

  if (Number.isNaN(startedAtMs)) {
    return baseSeconds;
  }

  return baseSeconds + Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
}

function getActivityRecordedMinutes(activity: Activity, nowMs: number) {
  const trackedSeconds = getActivityTrackedSeconds(activity, nowMs);

  if (trackedSeconds > 0) {
    return Math.max(1, Math.round(trackedSeconds / 60));
  }

  return activity.completed ? activity.duration : 0;
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

function getCurrentTimeKey(date = new Date()) {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function normalizePlanItems(items: PlanItem[]) {
  return items.map((item) => ({
    ...item,
    dateKey: item.dateKey ?? "2026-03-31",
    reminder: item.reminder ?? true,
    lastReminderDate: item.lastReminderDate ?? null,
  }));
}

function normalizeActivities(items: Activity[]) {
  return items.map((item) => ({
    ...item,
    loggedSeconds: item.loggedSeconds ?? 0,
    timerStartedAt: item.timerStartedAt ?? null,
    reminder: item.reminder ?? false,
    reminderTime: item.reminderTime ?? "09:00",
    lastReminderDate: item.lastReminderDate ?? null,
  }));
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
  return items.map((item) => ({
    ...item,
    note: item.note ?? "",
  }));
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

export default function EmberApp() {
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
  const [resourceDraft, setResourceDraft] = useState({ title: "", url: "", note: "" });
  const [saveMessage, setSaveMessage] = useState("");
  const [expandedEntryId, setExpandedEntryId] = useState<number | null>(
    initialCheckIns[0]?.id ?? null,
  );
  const [animatedActivityId, setAnimatedActivityId] = useState<number | null>(null);
  const [checkedActivityId, setCheckedActivityId] = useState<number | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [entryDraft, setEntryDraft] = useState({ feeling: "", note: "" });
  const [editingPlanItemId, setEditingPlanItemId] = useState<number | null>(null);
  const [planDraft, setPlanDraft] = useState({
    dateKey: "2026-03-31",
    title: "",
    time: "09:00",
    note: "",
    reminder: true,
  });
  const [editingResourceId, setEditingResourceId] = useState<number | null>(null);
  const [smallGoalDraft, setSmallGoalDraft] = useState("");
  const [editingSmallGoalId, setEditingSmallGoalId] = useState<number | null>(null);
  const [activityReminderMessage, setActivityReminderMessage] = useState("");
  const [planReminderMessage, setPlanReminderMessage] = useState("");
  const [resourceMessage, setResourceMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [todayKey, setTodayKey] = useState<string | null>(null);
  const [selectedPlanDateKey, setSelectedPlanDateKey] = useState("2026-03-31");
  const [calendarMonthKey, setCalendarMonthKey] = useState("2026-03");
  const [timerNowMs, setTimerNowMs] = useState<number | null>(null);
  const [notificationPermission, setNotificationPermission] = useState("default");
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
      if ("Notification" in window) {
        setNotificationPermission(window.Notification.permission);
      }
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
    const hasRunningTimer =
      activities.some((activity) => activity.timerStartedAt !== null) ||
      smallGoals.some((goal) => goal.timerStartedAt !== null);

    if (!hasRunningTimer) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTimerNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [activities, smallGoals]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
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

    const checkReminders = () => {
      const now = new Date();
      const currentDateKey = getTodayKey();
      const currentTimeKey = getCurrentTimeKey(now);
      let nextPlanMessage = "";
      let nextActivityMessage = "";

      setActivities((current) =>
        current.map((item) => {
          if (
            item.reminder &&
            item.reminderTime === currentTimeKey &&
            item.lastReminderDate !== currentDateKey
          ) {
            nextActivityMessage = `Time for: ${item.name}`;
            return {
              ...item,
              lastReminderDate: currentDateKey,
            };
          }

          return item;
        }),
      );

      setPlanItems((current) =>
        current.map((item) => {
          if (
            item.reminder &&
            item.dateKey === currentDateKey &&
            item.time === currentTimeKey &&
            item.lastReminderDate !== currentDateKey
          ) {
            nextPlanMessage = `Time for: ${item.title}`;
            return {
              ...item,
              lastReminderDate: currentDateKey,
            };
          }

          return item;
        }),
      );

      if (nextActivityMessage) {
        setActivityReminderMessage(nextActivityMessage);
        if ("Notification" in window && window.Notification.permission === "granted") {
          void new window.Notification("Ember", {
            body: nextActivityMessage,
          });
        }
      }

      if (nextPlanMessage) {
        setPlanReminderMessage(nextPlanMessage);
        if ("Notification" in window && window.Notification.permission === "granted") {
          void new window.Notification("Ember", {
            body: nextPlanMessage,
          });
        }
      }
    };

    checkReminders();
    const intervalId = window.setInterval(checkReminders, 60000);

    return () => window.clearInterval(intervalId);
  }, [isHydrated]);

  const currentTimerMs = timerNowMs ?? 0;
  const completedActivities = activities.filter((activity) => activity.completed);
  const todaysActivities =
    energyLevel === "Low"
      ? activities.filter((activity) => activity.lowEnergy).slice(0, 2)
      : activities;
  const todaysGoals =
    todayKey === null
      ? []
      : smallGoals.filter((goal) => goal.dateKey === todayKey);
  const runningActivities = todaysActivities.filter((activity) => activity.timerStartedAt);
  const trackedActivities = todaysActivities.filter(
    (activity) => activity.timerStartedAt || activity.loggedSeconds > 0,
  );
  const hasCompletedToday = completedActivities.length > 0;
  const minutesToday = completedActivities.reduce(
    (total, activity) => total + getActivityRecordedMinutes(activity, currentTimerMs),
    0,
  );
  const todaysPlannedMinutes = todaysActivities.reduce(
    (total, activity) => total + activity.duration,
    0,
  );
  const weeklyProgress =
    activities.length > 0
      ? Math.round((completedActivities.length / activities.length) * 100)
      : 0;
  const streak =
    todayKey === null ? 0 : calculateStreak(checkIns, hasCompletedToday, todayKey);
  const journeyGroups = checkIns.reduce<
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
  const selectedPlanItems = [...planItems]
    .filter((item) => item.dateKey === selectedPlanDateKey)
    .sort((left, right) => left.time.localeCompare(right.time));
  const selectedPlanCompletedCount = selectedPlanItems.filter((item) => item.completed).length;
  const nextPlannedItem = selectedPlanItems.find((item) => !item.completed) ?? null;
  const calendarDays = buildCalendarDays(calendarMonthKey);
  const saveCheckIn = () => {
    if (!feeling.trim() && !note.trim()) {
      return;
    }

    const now = new Date();
    const completedSnapshot = completedActivities.map((activity) => ({
      name: activity.name,
      duration: getActivityRecordedMinutes(activity, now.getTime()),
    }));
    const entry: CheckIn = {
      id: Date.now(),
      dateKey: getTodayKey(),
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
      saveMessages[Math.floor(Math.random() * saveMessages.length)] ??
        "You showed up today. That matters.",
    );
    setExpandedEntryId(entry.id);
  };

  const toggleActivity = (id: number) => {
    let nextCompleted = false;

    setActivities((current) =>
      current.map((activity) => {
        if (activity.id !== id) {
          return activity;
        }

        nextCompleted = !activity.completed;
        return {
          ...activity,
          completed: nextCompleted,
        };
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
    setTimerNowMs(now.getTime());

    setActivities((current) =>
      current.map((activity) => {
        if (activity.id !== id) {
          return activity;
        }

        if (activity.timerStartedAt) {
          const startedAtMs = new Date(activity.timerStartedAt).getTime();
          const elapsedSeconds = Number.isNaN(startedAtMs)
            ? 0
            : Math.max(0, Math.floor((now.getTime() - startedAtMs) / 1000));

          return {
            ...activity,
            loggedSeconds: activity.loggedSeconds + elapsedSeconds,
            timerStartedAt: null,
          };
        }

        return {
          ...activity,
          timerStartedAt: now.toISOString(),
        };
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
          lastReminderDate: null,
        },
      ]);
    }

    setActivityDraft({ name: "", duration: "10" });
  };

  const startEditActivity = (activity: Activity) => {
    setEditingId(activity.id);
    setActivityDraft({
      name: activity.name,
      duration: String(activity.duration),
    });
  };

  const updateActivityReminder = (
    id: number,
    updates: Partial<Pick<Activity, "reminder" | "reminderTime" | "lastReminderDate">>,
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

    if (!title || !url) {
      return;
    }

    if (editingResourceId !== null) {
      setResources((current) =>
        current.map((resource) =>
          resource.id === editingResourceId
            ? { ...resource, title, url, note }
            : resource,
        ),
      );
      setEditingResourceId(null);
    } else {
      setResources((current) => [...current, { id: Date.now(), title, url, note }]);
    }

    setResourceDraft({ title: "", url: "", note: "" });
  };

  const startEditingResource = (resource: Resource) => {
    setEditingResourceId(resource.id);
    setResourceDraft({
      title: resource.title,
      url: resource.url,
      note: resource.note,
    });
  };

  const deleteResource = (id: number) => {
    setResources((current) => current.filter((resource) => resource.id !== id));

    if (editingResourceId === id) {
      setEditingResourceId(null);
      setResourceDraft({ title: "", url: "", note: "" });
    }
  };

  const shareResource = async (resource: Resource) => {
    const shareText = resource.note
      ? `${resource.title}\n\n${resource.note}\n\n${resource.url}`
      : `${resource.title}\n\n${resource.url}`;

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

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      setProfileMessage("Notifications are not supported here.");
      return;
    }

    const permission = await window.Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      setProfileMessage("Notifications are on.");
      return;
    }

    setProfileMessage("Notifications stayed off.");
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
                lastReminderDate:
                  item.dateKey !== planDraft.dateKey || item.time !== planDraft.time
                    ? null
                    : item.lastReminderDate,
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
          lastReminderDate: null,
        },
      ]);
    }

    setPlanDraft({
      dateKey: selectedPlanDateKey,
      title: "",
      time: "09:00",
      note: "",
      reminder: true,
    });
  };

  const startEditingPlanItem = (item: PlanItem) => {
    setEditingPlanItemId(item.id);
    setSelectedPlanDateKey(item.dateKey);
    setCalendarMonthKey(getMonthKey(item.dateKey));
    setPlanDraft({
      dateKey: item.dateKey,
      title: item.title,
      time: item.time,
      note: item.note,
      reminder: item.reminder,
    });
  };

  const deletePlanItem = (id: number) => {
    setPlanItems((current) => current.filter((item) => item.id !== id));

    if (editingPlanItemId === id) {
      setEditingPlanItemId(null);
      setPlanDraft({
        dateKey: selectedPlanDateKey,
        title: "",
        time: "09:00",
        note: "",
        reminder: true,
      });
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
                    A gentle start: add your name, one small win, and one activity.
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
              <p className="mt-1 text-sm text-[#f8d8b5]">
                A gentle nudge for what you planned.
              </p>
            </section>
          ) : null}

          {activityReminderMessage ? (
            <section className="relative z-10 rounded-[1.5rem] border border-accent/20 bg-accent-soft px-4 py-4">
              <p className="text-sm font-semibold text-[#fff3e5]">{activityReminderMessage}</p>
              <p className="mt-1 text-sm text-[#f8d8b5]">
                A gentle nudge for one of today&apos;s activities.
              </p>
            </section>
          ) : null}

          <header
            className="rounded-[1.75rem] border border-[rgba(116,201,255,0.26)] bg-[linear-gradient(160deg,rgba(28,70,123,0.96),rgba(38,52,102,0.96))] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            id="home"
          >
            <p className="font-serif text-[1.75rem] leading-tight text-white">
              Progress, not pressure
            </p>
            <p className="mt-1.5 text-sm text-muted">
              {profile.name ? `Welcome, ${profile.name}. Keep going. Gently.` : "Keep going. Gently."}
            </p>
          </header>

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

          <section className="grid grid-cols-3 gap-2.5">
            <StatCard
              className="min-h-[5.75rem] px-2.5 py-2.5"
              icon="🔥"
              label="Streak"
              tone="rose"
              value={`${streak} days`}
            />
            <StatCard
              className="min-h-[5.75rem] px-2.5 py-2.5"
              icon="⏱"
              label="Today"
              tone="violet"
              value={`${minutesToday} min`}
            />
            <StatCard
              className="min-h-[5.75rem] px-2.5 py-2.5"
              icon="📊"
              label="Weekly"
              tone="indigo"
              value={`${weeklyProgress}%`}
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
                  {energyLevel === "Low"
                    ? "A lighter plan is here for you today."
                    : "A gentle place to move through today, one step at a time."}
                </p>
              </div>
              <button
                className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-[#eef8ff] hover:text-white"
                onClick={() => scrollToElement("check-in")}
                type="button"
              >
                Check in
              </button>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted">For today</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {todaysActivities.length} {todaysActivities.length === 1 ? "step" : "steps"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted">At your pace</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {todaysPlannedMinutes} min planned
                </p>
              </div>
            </div>
            <div className="mb-4 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Small win for today</p>
                  <p className="mt-1 text-xs text-muted">
                    Keep one gentle goal here, even if it is a small move.
                  </p>
                </div>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-muted">
                  {todaysGoals.filter((goal) => goal.completed).length}/{todaysGoals.length}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  className="min-w-0 flex-1 rounded-2xl border border-border bg-card-strong px-4 py-3 text-sm text-white outline-none placeholder:text-muted focus:border-accent"
                  onChange={(event) => setSmallGoalDraft(event.target.value)}
                  placeholder="Write one small goal"
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
                                : "Ready when you are"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-base font-semibold text-white">
                            {goal.timerStartedAt
                              ? formatTimerDuration(getActivityTrackedSeconds(goal, currentTimerMs))
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
                          Mark complete
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
            {trackedActivities.length > 0 ? (
              <div className="mb-4 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Activity timer</p>
                    <p className="mt-1 text-xs text-muted">
                      Keep an eye on what you have already started today.
                    </p>
                  </div>
                  {runningActivities.length > 0 ? (
                    <span className="rounded-full border border-accent/25 bg-accent-soft px-2.5 py-1 text-[11px] text-accent">
                      {runningActivities.length} live
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 space-y-2">
                  {trackedActivities.map((activity) => {
                    const trackedSeconds = getActivityTrackedSeconds(activity, currentTimerMs);

                    return (
                      <div
                        key={`tracked-${activity.id}`}
                        className="rounded-2xl border border-border bg-card-strong px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white">{activity.name}</p>
                            <p className="mt-1 text-xs text-muted">
                              {activity.timerStartedAt ? "Running now" : "Clocked today"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-base font-semibold text-white">
                              {formatTimerDuration(trackedSeconds)}
                            </p>
                            <p className="mt-1 text-[11px] text-muted">
                              {activity.timerStartedAt ? "Live timer" : "Recorded"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
            {energyLevel === "Low" ? (
              <div className="rounded-2xl border border-accent/20 bg-accent-soft px-4 py-3 text-sm text-[#f8d8b5]">
                Take it easy today. Small steps are enough.
              </div>
            ) : null}
          </section>

          <section
            className="rounded-[1.75rem] border border-[rgba(255,138,176,0.28)] bg-[linear-gradient(155deg,rgba(126,52,95,0.92),rgba(74,54,112,0.94))] px-4 py-4 scroll-mt-6"
            id="check-in"
          >
            <h2 className="text-lg font-semibold text-white">Today&apos;s Check-in</h2>
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
          </section>

          <section
            className="rounded-[1.75rem] border border-[rgba(126,238,154,0.28)] bg-[linear-gradient(150deg,rgba(26,92,61,0.92),rgba(36,70,102,0.94))] px-4 py-4"
            id="coach"
          >
            <h2 className="text-lg font-semibold text-white">Coach</h2>
            <p className="mt-1 text-sm text-[#effff6]">
              Gentle suggestions you can shape around your energy.
            </p>
            <div className="mt-4 space-y-3">
                {todaysActivities.map((activity) => (
                  <div
                    key={`coach-${activity.id}`}
                    className="rounded-2xl border border-border bg-card-strong px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">{activity.name}</p>
                        <p className="text-xs text-muted">
                          {activity.duration} minutes planned
                          {activity.loggedSeconds > 0 || activity.timerStartedAt ? (
                            <> • {formatTimerDuration(getActivityTrackedSeconds(activity, currentTimerMs))} tracked</>
                          ) : null}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            activity.timerStartedAt
                              ? "border-accent/50 bg-accent-soft text-accent"
                              : "border-border text-muted hover:text-white"
                          }`}
                          onClick={() => toggleActivityTimer(activity.id)}
                          type="button"
                        >
                          {activity.timerStartedAt ? "Stop" : "Start"}
                        </button>
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
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <label className="flex items-center gap-2 text-sm text-muted">
                        <input
                          checked={activity.completed}
                          className="h-5 w-5 accent-[#f2a65a]"
                          onChange={() => toggleActivity(activity.id)}
                          type="checkbox"
                        />
                        Mark complete
                      </label>
                      <div className="text-right">
                        <p className="font-mono text-base font-semibold text-white">
                          {activity.timerStartedAt
                            ? formatTimerDuration(getActivityTrackedSeconds(activity, currentTimerMs))
                            : activity.loggedSeconds > 0
                              ? formatTimerDuration(activity.loggedSeconds)
                              : "00:00"}
                        </p>
                        <p className="text-[11px] text-muted">
                          {activity.timerStartedAt ? "Live timer" : "Elapsed"}
                        </p>
                      </div>
                      <span
                        aria-hidden="true"
                        className={`text-sm text-accent ${
                          checkedActivityId === activity.id
                            ? "animate-[softCheck_700ms_ease-out]"
                            : activity.completed
                              ? "opacity-100"
                              : "opacity-0"
                        }`}
                      >
                        ✓
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          activity.reminder
                            ? "bg-accent-soft text-accent"
                            : "border border-border text-muted"
                        }`}
                        onClick={() =>
                          updateActivityReminder(activity.id, {
                            reminder: !activity.reminder,
                            lastReminderDate: null,
                          })
                        }
                        type="button"
                      >
                        {activity.reminder ? "Reminder on" : "Reminder off"}
                      </button>
                      <input
                        className="min-w-0 flex-1 rounded-2xl border border-border bg-transparent px-4 py-2.5 text-sm text-white outline-none focus:border-accent"
                        disabled={!activity.reminder}
                        onChange={(event) =>
                          updateActivityReminder(activity.id, {
                            reminderTime: event.target.value,
                            lastReminderDate: null,
                          })
                        }
                        type="time"
                        value={activity.reminderTime}
                      />
                    </div>
                  </div>
                ))}
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
                <h2 className="text-lg font-semibold text-white">Plan</h2>
                <p className="mt-1 text-sm text-muted">
                  {formatPlanDayLabel(selectedPlanDateKey, todayKey)}
                </p>
                <p className="mt-2 text-sm text-[#eef7ff]">
                  Your space for events, appointments, and gentle reminders.
                </p>
              </div>
              <button
                className="rounded-full border border-accent/40 px-4 py-2 text-sm font-semibold text-accent hover:border-accent"
                onClick={() => {
                  setEditingPlanItemId(null);
                  setPlanDraft({
                    dateKey: selectedPlanDateKey,
                    title: "",
                    time: "09:00",
                    note: "",
                    reminder: true,
                  });
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
                  {selectedPlanItems.length} {selectedPlanItems.length === 1 ? "item" : "items"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#e6f7ff]">Completed</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {selectedPlanCompletedCount}/{selectedPlanItems.length || 0}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#e6f7ff]">Next up</p>
                <p className="mt-1 truncate text-sm font-semibold text-white">
                  {nextPlannedItem ? formatReminderTime(nextPlannedItem.time) : "Nothing waiting"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4">
              <p className="text-sm text-[#eef7ff]">
                {selectedPlanItems.length > 0
                  ? nextPlannedItem
                    ? `${nextPlannedItem.title} is the next gentle thing waiting here.`
                    : "Everything for this day has been carried already."
                  : "This day is still open. You can keep it light or add what matters."}
              </p>
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
                  const hasItems = planItems.some((item) => item.dateKey === day.dateKey);
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
                          planItems.some((item) => item.dateKey === day.dateKey)
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
                <p className="text-sm font-semibold text-white">What is held for this day</p>
                <p className="mt-1 text-sm text-[#eef7ff]">
                  Appointments, reminders, and small plans stay together here.
                </p>
              </div>
              {selectedPlanItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-card-strong px-3 py-3"
                >
                  <div className="flex items-start gap-3">
                    <input
                      checked={item.completed}
                      className="mt-1 h-5 w-5 accent-[#f2a65a]"
                      onChange={() => togglePlanItem(item.id)}
                      type="checkbox"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              item.completed ? "text-muted line-through" : "text-white"
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="mt-1 text-xs text-[#f8d8b5]">
                            {formatReminderTime(item.time)}
                            {item.reminder ? " • Reminder on" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
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
                      {item.note ? (
                        <p className="mt-2 text-sm leading-6 text-[#dbe0e8]">{item.note}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
              {selectedPlanItems.length === 0 ? (
                <p className="rounded-2xl border border-border bg-card-strong px-4 py-4 text-sm text-muted">
                  Nothing is planned here yet. Add an event, appointment, or small task.
                </p>
              ) : null}
            </div>

            <div
              className="scroll-mt-6 space-y-3 rounded-2xl border border-border bg-card-strong p-3"
              id="plan-form"
            >
              <div>
                <p className="text-sm font-semibold text-white">
                  {editingPlanItemId !== null ? "Update this plan" : "Add something for this day"}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Keep it simple. A time, a title, and anything you want to remember.
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
                className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-white outline-none focus:border-accent"
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
                className="w-full rounded-2xl border border-border bg-transparent px-4 py-3 text-sm text-white outline-none focus:border-accent"
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
              <h2 className="text-lg font-semibold text-white">Journal</h2>
              <p className="text-sm text-[#f4ebff]">A place to reflect on your day.</p>

              <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4">
                <p className="text-sm text-[#f6efff]">
                  Keep the feelings, notes, and small moments that mattered. Nothing here has to be polished to belong.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card-strong px-4 py-4">
                <p className="text-sm font-semibold text-white">Your days</p>
                {checkIns.length === 0 ? (
                  <p className="mt-3 rounded-2xl border border-border bg-[#101b2e] px-4 py-4 text-sm leading-6 text-muted">
                    Your journal starts with one small step.
                  </p>
                ) : (
                  <div className="mt-3 space-y-5">
                    {journeyGroups.map((group) => (
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
                                  <div>
                                    <p className="text-sm font-semibold text-white">
                                      {entry.date}
                                    </p>
                                    <p className="mt-1 text-sm text-[#dbe0e8]">
                                      {entry.feeling}
                                    </p>
                                  </div>
                                  <span className="text-xs text-accent">
                                    {expandedEntryId === entry.id ? "Hide" : "Open"}
                                  </span>
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                                  <p className="text-muted">{buildPreview(entry.note)}</p>
                                  <p className="shrink-0 text-[#f8d8b5]">
                                    A small step kept
                                  </p>
                                </div>
                              </button>
                              {expandedEntryId === entry.id ? (
                                <div className="mt-3 border-t border-border pt-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm text-muted">
                                      This moment mattered.
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
                                      What you carried
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

              <div className="rounded-2xl border border-border bg-card-strong px-4 py-4">
                <p className="text-sm font-semibold text-white">Researches and Links</p>
                <p className="mt-1 text-sm text-muted">
                  Keep useful things close, and share them when you need to.
                </p>
                {resourceMessage ? (
                  <p className="mt-3 rounded-2xl border border-accent/25 bg-accent-soft px-4 py-3 text-sm text-[#f8d8b5]">
                    {resourceMessage}
                  </p>
                ) : null}
                <div className="mt-3 space-y-3">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="rounded-2xl border border-border bg-[#101b2e] px-3 py-3"
                    >
                      <div className="space-y-3">
                        <a
                          className="block min-w-0 hover:text-white"
                          href={resource.url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <p className="text-sm font-semibold text-white">{resource.title}</p>
                          <p className="mt-1 truncate text-xs text-muted">{resource.url}</p>
                        </a>
                        {resource.note ? (
                          <p className="whitespace-normal break-words text-sm leading-6 text-[#eef6ff]">
                            {resource.note}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2">
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
                    </div>
                  ))}
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
                Your space for a personal welcome and a few steady health notes.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-4">
              <p className="text-base font-semibold text-white">
                {profile.name ? `Welcome, ${profile.name}` : "A place that learns your name"}
              </p>
              <p className="mt-2 text-sm text-[#eef6ff]">
                Keep the basics that help Ember feel more personal and grounded around your real life.
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
                    void requestNotifications();
                  }}
                  type="button"
                >
                  {notificationPermission === "granted"
                    ? "Notifications on"
                    : "Enable notifications"}
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
                <p className="mt-1 text-sm font-semibold text-white">{profile.weight || "Add"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#e7f5ff]">Pressure</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {profile.bloodPressure || "Add"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-[#e7f5ff]">Heart</p>
                <p className="mt-1 text-sm font-semibold text-white">{profile.heartRate || "Add"}</p>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border bg-card-strong p-3">
              <div>
                <p className="text-sm font-semibold text-white">Your details</p>
                <p className="mt-1 text-sm text-muted">
                  Gentle notes you may want close by.
                </p>
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

            <div className="rounded-2xl border border-border bg-card-strong px-4 py-4">
              <p className="text-sm font-semibold text-white">
                {profile.name ? `Hello, ${profile.name}` : "A personal place, ready when you are"}
              </p>
              <p className="mt-2 text-sm text-[#eef6ff]">
                {profile.name
                  ? "Your basics are here when you need them."
                  : "Add your name to make Ember feel more like it knows you."}
              </p>
              <div className="mt-3 space-y-2 text-sm text-[#eef6ff]">
                <p>
                  Weight: <span className="text-white">{profile.weight || "Not added yet"}</span>
                </p>
                <p>
                  Blood pressure:{" "}
                  <span className="text-white">{profile.bloodPressure || "Not added yet"}</span>
                </p>
                <p>
                  Heart rate:{" "}
                  <span className="text-white">{profile.heartRate || "Not added yet"}</span>
                </p>
              </div>
              {profile.notes ? (
                <p className="mt-3 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3 text-sm leading-6 text-[#eef6ff]">
                  {profile.notes}
                </p>
              ) : null}
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
        <div className="flex items-start justify-between gap-2">
          <p className={`text-lg ${accentClass}`}>{icon}</p>
          <span className="text-xs text-muted">Open</span>
        </div>
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

import { NextRequest } from "next/server";
import webpush from "web-push";
import type { PushSubscription } from "web-push";
import { getNextReminderOccurrence, summarizeReminderMessage } from "@/lib/push-reminders";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ActivitySnapshot = {
  id: number;
  name: string;
  reminder: boolean;
  reminderTime: string;
  repeat: Parameters<typeof getNextReminderOccurrence>[0]["repeat"];
  customRepeatHours: number | null;
  reminderStartDateKey: string;
  lastReminderKey: string | null;
};

type PlanItemSnapshot = {
  id: number;
  title: string;
  dateKey: string;
  time: string;
  reminder: boolean;
  repeat: Parameters<typeof getNextReminderOccurrence>[0]["repeat"];
  customRepeatHours: number | null;
  lastReminderKey: string | null;
};

type EmberCloudSnapshot = {
  activities?: ActivitySnapshot[];
  planItems?: PlanItemSnapshot[];
  [key: string]: unknown;
};

type EmberStateRow = {
  user_id: string;
  data: EmberCloudSnapshot | null;
};

type PushSubscriptionRow = {
  user_id: string;
  endpoint: string;
  subscription: PushSubscription;
};

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");
  return scheme === "Bearer" ? token : "";
}

function collectDueReminders(snapshot: EmberCloudSnapshot, now: Date) {
  const dueActivityNames: string[] = [];
  const duePlanNames: string[] = [];
  let changed = false;

  const nextActivities = (snapshot.activities ?? []).map((item) => {
    const occurrence = getNextReminderOccurrence(
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

  const nextPlanItems = (snapshot.planItems ?? []).map((item) => {
    const occurrence = getNextReminderOccurrence(
      {
        dateKey: item.dateKey,
        time: item.time,
        reminder: item.reminder,
        repeat: item.repeat,
        customRepeatHours: item.customRepeatHours,
        lastReminderKey: item.lastReminderKey,
      },
      now,
    );

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

  return {
    changed,
    nextSnapshot: {
      ...snapshot,
      activities: nextActivities,
      planItems: nextPlanItems,
    },
    activityMessage: summarizeReminderMessage(dueActivityNames),
    planMessage: summarizeReminderMessage(duePlanNames),
  };
}

async function handleSendDue(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const vapidSubject = process.env.VAPID_SUBJECT;
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!cronSecret || !vapidSubject || !vapidPublicKey || !vapidPrivateKey) {
    return Response.json(
      { error: "Push notification environment variables are missing." },
      { status: 500 },
    );
  }

  if (getBearerToken(request) !== cronSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const supabase = getSupabaseAdminClient();
  const now = new Date();

  const [{ data: stateRows, error: stateError }, { data: subscriptionRows, error: subError }] =
    await Promise.all([
      supabase.from("ember_app_state").select("user_id, data"),
      supabase.from("ember_push_subscriptions").select("user_id, endpoint, subscription"),
    ]);

  if (stateError || subError) {
    return Response.json(
      {
        error:
          stateError?.message ??
          subError?.message ??
          "Unable to load push notification data.",
      },
      { status: 500 },
    );
  }

  const subscriptionsByUser = new Map<string, PushSubscriptionRow[]>();

  for (const row of (subscriptionRows ?? []) as PushSubscriptionRow[]) {
    const current = subscriptionsByUser.get(row.user_id) ?? [];
    current.push(row);
    subscriptionsByUser.set(row.user_id, current);
  }

  let processedUsers = 0;
  let sentNotifications = 0;
  let cleanedSubscriptions = 0;

  for (const row of (stateRows ?? []) as EmberStateRow[]) {
    const userSubscriptions = subscriptionsByUser.get(row.user_id) ?? [];

    if (userSubscriptions.length === 0 || !row.data) {
      continue;
    }

    const { changed, nextSnapshot, activityMessage, planMessage } = collectDueReminders(
      row.data,
      now,
    );

    if (!changed) {
      continue;
    }

    const messages = [activityMessage, planMessage].filter(Boolean);

    for (const message of messages) {
      const payload = JSON.stringify({
        title: "Ember",
        body: message,
        url: "/",
      });

      for (const subscription of userSubscriptions) {
        try {
          await webpush.sendNotification(subscription.subscription, payload);
          sentNotifications += 1;
        } catch (error) {
          const statusCode =
            typeof error === "object" &&
            error !== null &&
            "statusCode" in error &&
            typeof error.statusCode === "number"
              ? error.statusCode
              : null;

          if (statusCode === 404 || statusCode === 410) {
            const { error: deleteError } = await supabase
              .from("ember_push_subscriptions")
              .delete()
              .eq("endpoint", subscription.endpoint);

            if (!deleteError) {
              cleanedSubscriptions += 1;
            }
          }
        }
      }
    }

    const { error: updateError } = await supabase
      .from("ember_app_state")
      .update({
        data: nextSnapshot,
        updated_at: now.toISOString(),
      })
      .eq("user_id", row.user_id);

    if (!updateError) {
      processedUsers += 1;
    }
  }

  return Response.json({
    ok: true,
    processedUsers,
    sentNotifications,
    cleanedSubscriptions,
    checkedAt: now.toISOString(),
  });
}

export async function GET(request: NextRequest) {
  return handleSendDue(request);
}

export async function POST(request: NextRequest) {
  return handleSendDue(request);
}

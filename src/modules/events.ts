// src/modules/events.ts
import { logger } from '@/lib/logger';
import { generateUUID } from '@/lib/uuid';

/**
 * Event types for XP-related actions
 */
export type XPEventType =
  | 'xp:gain'
  | 'xp:loss'
  | 'level:up'
  | 'achievement:unlock'
  | 'bonus:trigger';

export interface XPEventPayload {
  id: string;
  type: XPEventType;
  data: unknown;
  timestamp: number;
}

export type EventHandler<T = unknown> = (payload: T, raw: XPEventPayload) => void | Promise<void>;

interface Hook {
  fn: EventHandler;
  once: boolean;
}

interface ReplayOptions {
  filterTypes?: XPEventType[];
  fromTimestamp?: number;
  toTimestamp?: number;
}

// In-memory event log (for debug/replay/testing)
const activityLog: XPEventPayload[] = [];

// The event emitter and hook management
const listeners = new Map<XPEventType, Hook[]>();

let notificationPermission: NotificationPermission | null = null;
let soundEnabled = false;
let soundUrl = '';
let audioObj: HTMLAudioElement | null = null;

//-----------------------------------------------------
// Event Emitter for XP Activities
//-----------------------------------------------------
export function on<T = unknown>(type: XPEventType, handler: EventHandler<T>, opts: { once?: boolean } = {}) {
  if (!listeners.has(type)) listeners.set(type, []);
  listeners.get(type)!.push({ fn: handler as EventHandler, once: !!opts.once });
}

export function off<T = unknown>(type: XPEventType, handler: EventHandler<T>) {
  if (!listeners.has(type)) return;
  listeners.set(type, listeners.get(type)!.filter(hook => hook.fn !== handler));
}

export async function emit<T = unknown>(type: XPEventType, data: T): Promise<void> {
  const payload: XPEventPayload = {
    id: generateUUID(),
    type,
    data,
    timestamp: Date.now(),
  };

  // Log the event
  activityLog.push(payload);
  logger.info(`Event emitted: ${type}`, payload);

  // Trigger desktop notification or sound if needed
  if (type === 'achievement:unlock') {
    notifyAchievement(data);
  }
  if (type === 'level:up') {
    playLevelUpSound();
  }

  // Call listeners (support once option)
  const hooks = listeners.get(type) || [];
  for (let i = 0; i < hooks.length; ++i) {
    try {
      await hooks[i].fn(data, payload);
    } catch (err) {
      logger.error(`Event handler for ${type} threw`, err);
    }
  }
  // Remove one-time (once) listeners after firing
  listeners.set(type, hooks.filter(hook => !hook.once));
}

//-----------------------------------------------------
// Hook System for Plugins and Extensions
//-----------------------------------------------------
// Usage: on/emit/off above

//-----------------------------------------------------
// Optional Desktop Notifications (Achievements)
//-----------------------------------------------------
function notifyAchievement(data: any) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (notificationPermission === 'denied') return;
  if (!notificationPermission || notificationPermission === 'default') {
    Notification.requestPermission().then((perm) => {
      notificationPermission = perm;
      if (perm === 'granted') notifyAchievement(data);
    });
    return;
  }
  // Basic structure - customize as needed
  const text = typeof data === 'object' && data?.name ? `Achievement unlocked: ${data.name}` : 'Achievement unlocked!';
  new Notification(text, {
    body: data?.description || undefined,
    icon: '/icons/achievement.png',
  });
}

//-----------------------------------------------------
// Optional Sound Effects for Level-Ups
//-----------------------------------------------------
export function enableLevelUpSound(url: string) {
  soundEnabled = true;
  soundUrl = url;
  if (typeof window !== 'undefined' && url) {
    audioObj = new Audio(url);
    audioObj.preload = 'auto';
  }
}

export function disableLevelUpSound() {
  soundEnabled = false;
  audioObj = null;
}

function playLevelUpSound() {
  if (soundEnabled && audioObj) {
    audioObj.currentTime = 0;
    audioObj.play().catch((e) => logger.warn('Failed to play level-up sound', e));
  }
}

//-----------------------------------------------------
// Log Access
//-----------------------------------------------------
export function getActivityLog(): readonly XPEventPayload[] {
  return activityLog;
}

//-----------------------------------------------------
// Event Replay (for testing/debugging)
//-----------------------------------------------------
export async function replayEvents(options: ReplayOptions = {}): Promise<void> {
  const { filterTypes, fromTimestamp, toTimestamp } = options;
  let events = activityLog;
  if (filterTypes) {
    events = events.filter(e => filterTypes.includes(e.type));
  }
  if (fromTimestamp) {
    events = events.filter(e => e.timestamp >= fromTimestamp);
  }
  if (toTimestamp) {
    events = events.filter(e => e.timestamp <= toTimestamp);
  }
  for (const event of events) {
    await emit(event.type, event.data);
  }
}

//-----------------------------------------------------
// Debug Helpers
//-----------------------------------------------------
if (process.env.NODE_ENV !== 'production') {
  // @ts-ignore
  window.__xp_activity_log = activityLog;
}


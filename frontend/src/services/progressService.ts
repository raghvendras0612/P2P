/**
 * ProgressService
 *
 * Abstraction for tracking milestone checkpoints, projects in progress, and 30-day kickoff tasks.
 * Combines synchronous local cache (for zero-latency optimistic UI updates)
 * with asynchronous background synchronization to the persistent FastAPI backend database.
 */

import { api } from '../api/client';

const CHECKPOINT_PREFIX = 'cps_checkpoint_';
const PROJECT_PREFIX = 'cps_project_';
const TASK_PREFIX = 'cps_task_';

export interface ProgressState {
  completedCheckpoints: Record<string, boolean>;
  startedProjects: Record<string, boolean>;
  completedTasks: Record<string, boolean>;
}

export const progressService = {
  // --- Checkpoints ---
  isCheckpointCompleted(pathSlug: string, checkpointText: string): boolean {
    try {
      const key = `${CHECKPOINT_PREFIX}${pathSlug}_${checkpointText}`;
      return localStorage.getItem(key) === 'true';
    } catch {
      return false;
    }
  },

  toggleCheckpoint(pathSlug: string, checkpointText: string): boolean {
    try {
      const key = `${CHECKPOINT_PREFIX}${pathSlug}_${checkpointText}`;
      const current = localStorage.getItem(key) === 'true';
      const nextState = !current;
      localStorage.setItem(key, String(nextState));

      // Asynchronous background sync to persistent database
      if (pathSlug) {
        api.progress
          .toggleItem({
            career_path_slug: pathSlug,
            item_type: 'milestone_checkpoint',
            item_ref: checkpointText,
            status: nextState ? 'completed' : 'not_started',
          })
          .catch(() => {});
      }

      return nextState;
    } catch {
      return false;
    }
  },

  // --- Projects ---
  isProjectStarted(pathSlug: string, projectTitle: string): boolean {
    try {
      const key = `${PROJECT_PREFIX}${pathSlug}_${projectTitle}`;
      return localStorage.getItem(key) === 'true';
    } catch {
      return false;
    }
  },

  toggleProjectStarted(pathSlug: string, projectTitle: string): boolean {
    try {
      const key = `${PROJECT_PREFIX}${pathSlug}_${projectTitle}`;
      const current = localStorage.getItem(key) === 'true';
      const nextState = !current;
      localStorage.setItem(key, String(nextState));

      // Asynchronous background sync to persistent database
      if (pathSlug) {
        api.progress
          .updateProject({
            career_path_slug: pathSlug,
            project_title: projectTitle,
            status: nextState ? 'in_progress' : 'not_started',
          })
          .catch(() => {});
      }

      return nextState;
    } catch {
      return false;
    }
  },

  // --- First Month Tasks ---
  isTaskCompleted(pathSlug: string, weekNumber: number, taskText: string): boolean {
    try {
      const key = `${TASK_PREFIX}${pathSlug}_w${weekNumber}_${taskText}`;
      return localStorage.getItem(key) === 'true';
    } catch {
      return false;
    }
  },

  toggleTaskCompleted(pathSlug: string, weekNumber: number, taskText: string): boolean {
    try {
      const key = `${TASK_PREFIX}${pathSlug}_w${weekNumber}_${taskText}`;
      const current = localStorage.getItem(key) === 'true';
      const nextState = !current;
      localStorage.setItem(key, String(nextState));

      // Asynchronous background sync to persistent database
      if (pathSlug) {
        api.progress
          .toggleItem({
            career_path_slug: pathSlug,
            item_type: 'first_month_task',
            item_ref: `w${weekNumber}_${taskText}`,
            status: nextState ? 'completed' : 'not_started',
          })
          .catch(() => {});
      }

      return nextState;
    } catch {
      return false;
    }
  },

  // Sync loaded items from server into local cache
  syncFromBackend(pathSlug: string, completedItemsMap: Record<string, boolean>) {
    try {
      Object.entries(completedItemsMap).forEach(([itemRef, isDone]) => {
        if (
          itemRef.startsWith('w1_') ||
          itemRef.startsWith('w2_') ||
          itemRef.startsWith('w3_') ||
          itemRef.startsWith('w4_')
        ) {
          const key = `${TASK_PREFIX}${pathSlug}_${itemRef}`;
          localStorage.setItem(key, String(isDone));
        } else {
          const key = `${CHECKPOINT_PREFIX}${pathSlug}_${itemRef}`;
          localStorage.setItem(key, String(isDone));
        }
      });
    } catch (e) {
      console.warn('Error hydrating local progress cache:', e);
    }
  },
};

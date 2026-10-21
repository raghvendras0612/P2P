import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Calendar,
  Flag,
  ListTodo,
  Rocket,
} from 'lucide-react';
import { progressService } from '../../services/progressService';
import { FirstMonthPlan } from '../../types';

interface FirstMonthBoardProps {
  firstMonthPlan: FirstMonthPlan;
  pathSlug: string;
}

export const FirstMonthBoard: React.FC<FirstMonthBoardProps> = ({
  firstMonthPlan,
  pathSlug,
}) => {
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    firstMonthPlan.weeks.forEach((week) => {
      const tasks = week.daily_tasks || week.daily_or_weekly_tasks || [];
      tasks.forEach((task) => {
        const key = `w${week.week_number}_${task}`;
        initial[key] = progressService.isTaskCompleted(pathSlug, week.week_number, task);
      });
    });
    return initial;
  });

  const handleToggleTask = (weekNumber: number, task: string) => {
    const nextState = progressService.toggleTaskCompleted(pathSlug, weekNumber, task);
    const key = `w${weekNumber}_${task}`;
    setCompletedTasks((prev) => ({
      ...prev,
      [key]: nextState,
    }));
  };

  // Calculate overall completion statistics
  const { totalTasks, completedCount, percentComplete } = useMemo(() => {
    let total = 0;
    let completed = 0;
    firstMonthPlan.weeks.forEach((week) => {
      const tasks = week.daily_tasks || week.daily_or_weekly_tasks || [];
      tasks.forEach((task) => {
        total++;
        if (completedTasks[`w${week.week_number}_${task}`]) {
          completed++;
        }
      });
    });
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { totalTasks: total, completedCount: completed, percentComplete: pct };
  }, [firstMonthPlan, completedTasks]);

  return (
    <div className="space-y-6">
      {/* Header & Overall Kickoff Progress */}
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary-600" />
              30-Day First-Month Action Plan (4-Week Sprint)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Overcome tutorial paralysis with day-by-day actionable milestones and verified free platforms.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-semibold text-gray-700">
              {completedCount} of {totalTasks} Tasks Done
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200">
              {percentComplete}% Sprint Completed
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* 4-Week Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" data-testid="first-month-board">
        {firstMonthPlan.weeks.map((week) => {
          const tasks = week.daily_tasks || week.daily_or_weekly_tasks || [];
          const theme = week.theme || week.weekly_theme || `Week ${week.week_number}`;
          const resources = week.resources || week.free_learning_resources || [];
          const outcome = week.end_of_week_outcome || week.deliverable_outcome || '';

          const weekTasksDone = tasks.filter(
            (t) => completedTasks[`w${week.week_number}_${t}`]
          ).length;
          const isWeekDone = weekTasksDone === tasks.length && tasks.length > 0;

          return (
            <div
              key={week.week_number}
              className={`bg-white rounded-xl border flex flex-col justify-between p-4 shadow-2xs transition-all ${
                isWeekDone
                  ? 'border-emerald-300 ring-1 ring-emerald-100'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="space-y-4">
                {/* Week Header */}
                <div className="border-b border-gray-100 pb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-1 text-2xs font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">
                      <Calendar className="w-3 h-3" />
                      Week {week.week_number}
                    </span>
                    <span className="text-2xs font-semibold text-gray-500">
                      {weekTasksDone}/{tasks.length} Done
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 leading-snug">
                    {theme}
                  </h4>
                </div>

                {/* Daily / Weekly Tasks */}
                <div className="space-y-2">
                  <span className="text-2xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <ListTodo className="w-3 h-3 text-gray-400" />
                    Weekly Tasks:
                  </span>
                  <div className="space-y-1.5">
                    {tasks.map((task, tIdx) => {
                      const isDone = !!completedTasks[`w${week.week_number}_${task}`];
                      return (
                        <label
                          key={tIdx}
                          className={`flex items-start gap-2 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                            isDone
                              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => handleToggleTask(week.week_number, task)}
                            className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 border-gray-300"
                          />
                          <span className={`text-2xs leading-snug ${isDone ? 'line-through text-emerald-800' : ''}`}>
                            {task}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Free Learning Resources */}
                {resources.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-gray-100">
                    <span className="text-2xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-indigo-500" />
                      Curated Free Resources:
                    </span>
                    <ul className="space-y-1 text-2xs text-gray-600">
                      {resources.map((res, rIdx) => (
                        <li
                          key={rIdx}
                          className="bg-indigo-50/40 border border-indigo-100 px-2 py-1 rounded text-indigo-900 font-medium"
                        >
                          &bull; {res}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* End of Week Deliverable Outcome */}
              {outcome && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-2.5 text-2xs text-emerald-900 space-y-1">
                    <div className="flex items-center gap-1 font-bold text-emerald-800">
                      <Flag className="w-3 h-3 text-emerald-600" />
                      <span>Deliverable Outcome:</span>
                    </div>
                    <p className="text-emerald-800/90 leading-tight">
                      {outcome}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

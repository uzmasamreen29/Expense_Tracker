import React, { useMemo } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';

export default function PredictiveForecaster({ forecast, budget = 30000, currentTotal = 0 }) {
  const calculations = useMemo(() => {
    const now = new Date();
    const currentDay = Math.max(now.getDate(), 1);
    
    // Total days in the current calendar month
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(daysInMonth - currentDay, 0);
    const monthElapsedPercent = Math.min(Math.round((currentDay / daysInMonth) * 100), 100);

    // Actual spending metrics
    const spent = Number(currentTotal || forecast?.spentSoFar || 0);
    const monthlyBudget = Number(budget || 30000);
    const remainingBudget = monthlyBudget - spent;

    // Daily pace so far
    const dailyBurnRate = spent / currentDay;

    // Forecasted total at end of month based on daily pace
    const projectedTotal = forecast?.projectedTotal 
      ? Number(forecast.projectedTotal) 
      : Math.round(spent + dailyBurnRate * daysRemaining);

    // Difference between target budget and projected spend
    const differenceFromBudget = monthlyBudget - projectedTotal;
    const isUnderTarget = differenceFromBudget >= 0;

    // Safe daily limit to avoid exceeding remaining budget
    const safeDailyLimit = daysRemaining > 0 
      ? Math.max(Math.round(remainingBudget / daysRemaining), 0)
      : Math.max(remainingBudget, 0);

    return {
      currentDay,
      daysInMonth,
      daysRemaining,
      monthElapsedPercent,
      spent,
      monthlyBudget,
      remainingBudget,
      projectedTotal,
      differenceFromBudget: Math.abs(differenceFromBudget),
      isUnderTarget,
      safeDailyLimit,
    };
  }, [forecast, budget, currentTotal]);

  const {
    daysRemaining,
    monthElapsedPercent,
    projectedTotal,
    differenceFromBudget,
    isUnderTarget,
    safeDailyLimit,
  } = calculations;

  return (
    <div className="bg-linear-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-500/20 relative overflow-hidden">
      {/* Glow decorative accent */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
              Predictive Spend Engine
              <span className="text-[10px] uppercase font-extrabold bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-400/30">
                Live Model
              </span>
            </h3>
            <p className="text-xs text-indigo-200/70">Dynamic run-rate trajectory based on current pace</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Metric 1: Forecasted Month-End Spend */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
          <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">
            Projected End-of-Month
          </span>
          <div className="my-2">
            <h4 className="text-2xl font-black text-white">
              ₹{projectedTotal.toLocaleString()}
            </h4>
            <div className="flex items-center gap-1.5 mt-1">
              {isUnderTarget ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-medium text-emerald-400">
                    ₹{differenceFromBudget.toLocaleString()} under target
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="text-xs font-medium text-rose-400">
                    ₹{differenceFromBudget.toLocaleString()} over target
                  </span>
                </>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-400">Calculated from your month-to-date velocity</p>
        </div>

        {/* Metric 2: Safe Daily Limit */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
          <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">
            Safe Daily Limit
          </span>
          <div className="my-2">
            <h4 className="text-2xl font-black text-emerald-400">
              ₹{safeDailyLimit.toLocaleString()} <span className="text-sm font-normal text-slate-300">/ day</span>
            </h4>
            <p className="text-xs text-indigo-200/80 mt-1">
              Runway for remaining <span className="font-bold text-white">{daysRemaining}</span> day{daysRemaining === 1 ? '' : 's'}
            </p>
          </div>
          <p className="text-[11px] text-slate-400">Cap daily discretionary spend at this value</p>
        </div>

        {/* Metric 3: Month Elapsed Runway */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">
              Month Elapsed
            </span>
            <span className="text-xs font-bold text-indigo-300">
              {monthElapsedPercent}%
            </span>
          </div>

          <div className="my-2">
            <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${monthElapsedPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-300 mt-2 font-medium">
              <span>Day {calculations.currentDay} of {calculations.daysInMonth}</span>
              <span>{daysRemaining} days left</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">Cycles reset on the 1st of every month</p>
        </div>
      </div>
    </div>
  );
}
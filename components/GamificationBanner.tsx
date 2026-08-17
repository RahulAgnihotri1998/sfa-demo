"use client";

import { useState } from "react";
import { Trophy, Flame, Target, Award, Star, Zap, ChevronRight } from "lucide-react";

export function GamificationBanner({
  repName = "Sales Rep",
  points = 1450,
  streakDays = 6,
  monthlyRank = 2,
  badges = [
    { code: "century_club", title: "Century Club", icon: "🏆", desc: "100+ Completed Visits" },
    { code: "geo_master", title: "Geo Compliant", icon: "⚡", desc: "100% Geo-Fence Check-in" },
    { code: "cross_sell", title: "Basket Master", icon: "🎯", desc: "15+ Cross-Sell Conversions" },
  ]
}: {
  repName?: string;
  points?: number;
  streakDays?: number;
  monthlyRank?: number;
  badges?: { code: string; title: string; icon: string; desc: string }[];
}) {
  const [showBadgesModal, setShowBadgesModal] = useState(false);

  return (
    <>
      <div 
        onClick={() => setShowBadgesModal(true)}
        className="rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-3.5 text-white shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl shadow-inner">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-1.5 py-0.2 rounded">
                  Rank #{monthlyRank} Territory
                </span>
                <span className="flex items-center gap-0.5 text-[10px] font-bold bg-white/25 px-1.5 py-0.2 rounded text-yellow-100">
                  <Flame size={11} className="text-yellow-200" /> {streakDays}d Streak
                </span>
              </div>
              <h3 className="text-sm font-bold mt-0.5">{points.toLocaleString()} Gamification Points</h3>
            </div>
          </div>

          <div className="flex items-center gap-1 text-white/90 text-xs font-semibold">
            <span>Badges ({badges.length})</span>
            <ChevronRight size={15} />
          </div>
        </div>
      </div>

      {/* Badges Modal */}
      {showBadgesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl ring-1 ring-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="text-amber-500" size={22} />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Achievements & Leaderboard</h3>
                  <p className="text-[11px] text-gray-500">Earn points for compliant visits & cross-selling</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBadgesModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Scorecard */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                <p className="text-[10px] text-amber-700 font-semibold uppercase">Total Points</p>
                <p className="text-base font-extrabold text-amber-900 mt-0.5">{points}</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-2.5">
                <p className="text-[10px] text-orange-700 font-semibold uppercase">Streak</p>
                <p className="text-base font-extrabold text-orange-900 mt-0.5">🔥 {streakDays} Days</p>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5">
                <p className="text-[10px] text-indigo-700 font-semibold uppercase">Leaderboard</p>
                <p className="text-base font-extrabold text-indigo-900 mt-0.5">#{monthlyRank} in UAE</p>
              </div>
            </div>

            {/* Badges List */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Unlocked Badges</p>
              <div className="space-y-2">
                {badges.map((b) => (
                  <div key={b.code} className="p-2.5 rounded-xl border border-gray-200 bg-gray-50/50 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-xl shrink-0 shadow-xs">
                      {b.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">{b.title}</h4>
                      <p className="text-[10px] text-gray-500">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowBadgesModal(false)}
              className="w-full py-2 px-4 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

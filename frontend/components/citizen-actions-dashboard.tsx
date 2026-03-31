"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, Building2, GraduationCap, Leaf, MapPinned, Sprout, Trophy, Users } from "lucide-react";

import { HeatMapCard } from "@/components/heat-map-card";
import { StatCard } from "@/components/stat-card";
import { HeatCell, HeatDataResponse } from "@/lib/types";

type ParticipantType = "Citizen" | "College" | "Company";
type ActionKey = "trees" | "cool_roof" | "green_wall" | "urban_garden" | "water_body";

type Adoption = {
  userName: string;
  participantType: ParticipantType;
  area: number;
  goal: number;
  date: string;
};

type LoggedAction = {
  id: string;
  type: ActionKey;
  area: number;
  units: number;
  points: number;
  date: string;
};

type SavedCitizenState = {
  userName: string;
  participantType: ParticipantType;
  selectedArea: number;
  coolingGoal: number;
  adoptions: Adoption[];
  actions: LoggedAction[];
  earnedBadges: string[];
};

const STORAGE_KEY = "coolcity-citizen-gamification";

const POINTS: Record<ActionKey, number> = {
  trees: 10,
  cool_roof: 20,
  green_wall: 15,
  urban_garden: 50,
  water_body: 40
};

const ACTION_CONFIG: Array<{ key: ActionKey; label: string; defaultUnits: number; helper: string }> = [
  { key: "trees", label: "Plant Trees", defaultUnits: 10, helper: "+ Plant Trees" },
  { key: "cool_roof", label: "Install Cool Roof", defaultUnits: 1, helper: "+ Add Cool Roof" },
  { key: "green_wall", label: "Add Green Walls", defaultUnits: 1, helper: "+ Add Green Wall" },
  { key: "urban_garden", label: "Create Urban Garden", defaultUnits: 1, helper: "+ Urban Garden" },
  { key: "water_body", label: "Add Water Bodies", defaultUnits: 1, helper: "+ Water Body" }
];

const BADGE_RULES = [
  { name: "Green Starter", icon: "🌱", meets: (points: number, actions: LoggedAction[]) => points >= 50 || actions.length >= 2 },
  { name: "Tree Champion", icon: "🌳", meets: (_points: number, actions: LoggedAction[]) => actions.filter((action) => action.type === "trees").reduce((sum, action) => sum + action.units, 0) >= 100 },
  { name: "City Cooler", icon: "🏙", meets: (points: number) => points >= 220 },
  { name: "Climate Hero", icon: "🌍", meets: (points: number) => points >= 420 }
];

const SAMPLE_LEADERS = [
  { name: "Maya Sharma", participantType: "Citizen" as ParticipantType, points: 260, area: "Zone 5" },
  { name: "IISc Bengaluru", participantType: "College" as ParticipantType, points: 540, area: "Zone 2" },
  { name: "EcoTech Campus", participantType: "Company" as ParticipantType, points: 460, area: "Zone 7" },
  { name: "Green Youth Club", participantType: "Citizen" as ParticipantType, points: 210, area: "Zone 1" },
  { name: "RV College", participantType: "College" as ParticipantType, points: 380, area: "Zone 4" },
  { name: "CoolRoof Labs", participantType: "Company" as ParticipantType, points: 350, area: "Zone 3" }
];

function calculateCoolingImpact(actions: LoggedAction[]) {
  const totals = actions.reduce(
    (acc, action) => ({ ...acc, [action.type]: acc[action.type] + action.units }),
    { trees: 0, cool_roof: 0, green_wall: 0, urban_garden: 0, water_body: 0 } as Record<ActionKey, number>
  );

  const reduction =
    (totals.trees / 100) * 1.5 +
    (totals.cool_roof / 50) * 2 +
    (totals.green_wall / 20) * 0.8 +
    (totals.urban_garden / 5) * 1.1 +
    (totals.water_body / 5) * 2.5;

  return Number(reduction.toFixed(1));
}

function impactSummary(actions: LoggedAction[]) {
  return actions.reduce(
    (acc, action) => {
      acc[action.type] += action.units;
      return acc;
    },
    { trees: 0, cool_roof: 0, green_wall: 0, urban_garden: 0, water_body: 0 } as Record<ActionKey, number>
  );
}

export function CitizenActionsDashboard({ initialData }: { initialData: HeatDataResponse }) {
  const [userName, setUserName] = useState("Vidhya");
  const [participantType, setParticipantType] = useState<ParticipantType>("Citizen");
  const [selectedArea, setSelectedArea] = useState(initialData.cells[0]?.cell_id ?? 1);
  const [coolingGoal, setCoolingGoal] = useState(50);
  const [adoptions, setAdoptions] = useState<Adoption[]>([]);
  const [actions, setActions] = useState<LoggedAction[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [achievementMessage, setAchievementMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as SavedCitizenState;
      setUserName(parsed.userName);
      setParticipantType(parsed.participantType);
      setSelectedArea(parsed.selectedArea);
      setCoolingGoal(parsed.coolingGoal);
      setAdoptions(parsed.adoptions);
      setActions(parsed.actions);
      setEarnedBadges(parsed.earnedBadges);
    }
  }, []);

  useEffect(() => {
    const payload: SavedCitizenState = {
      userName,
      participantType,
      selectedArea,
      coolingGoal,
      adoptions,
      actions,
      earnedBadges
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [actions, adoptions, coolingGoal, earnedBadges, participantType, selectedArea, userName]);

  useEffect(() => {
    if (!achievementMessage) return;
    const timer = window.setTimeout(() => setAchievementMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [achievementMessage]);

  const totalPoints = useMemo(() => actions.reduce((sum, action) => sum + action.points, 0), [actions]);
  const totalImpact = useMemo(() => calculateCoolingImpact(actions), [actions]);
  const actionTotals = useMemo(() => impactSummary(actions), [actions]);
  const adoptedCellIds = useMemo(() => adoptions.map((item) => item.area), [adoptions]);

  const badges = useMemo(
    () =>
      BADGE_RULES.filter((badge) => badge.meets(totalPoints, actions)).map((badge) => `${badge.icon} ${badge.name}`),
    [actions, totalPoints]
  );

  useEffect(() => {
    const newBadge = badges.find((badge) => !earnedBadges.includes(badge));
    if (newBadge) {
      setEarnedBadges((prev) => [...prev, newBadge]);
      setAchievementMessage(`You earned ${newBadge} badge`);
    }
  }, [badges, earnedBadges]);

  function adoptArea() {
    setAdoptions((prev) => {
      const next = prev.filter((item) => item.area !== selectedArea);
      return [
        {
          userName,
          participantType,
          area: selectedArea,
          goal: coolingGoal,
          date: new Date().toISOString()
        },
        ...next
      ];
    });
  }

  function logAction(actionKey: ActionKey, units: number) {
    const action = ACTION_CONFIG.find((item) => item.key === actionKey);
    if (!action) return;

    setActions((prev) => [
      {
        id: crypto.randomUUID(),
        type: actionKey,
        area: selectedArea,
        units,
        points: units * POINTS[actionKey],
        date: new Date().toISOString()
      },
      ...prev
    ]);
  }

  const leaderboard = useMemo(() => {
    const userEntry = totalPoints > 0
      ? [{ name: userName, participantType, points: totalPoints, area: `Zone ${selectedArea}` }]
      : [];

    return [...SAMPLE_LEADERS, ...userEntry]
      .sort((a, b) => b.points - a.points)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [participantType, selectedArea, totalPoints, userName]);

  const rank = leaderboard.find((item) => item.name === userName && item.area === `Zone ${selectedArea}`)?.rank ?? leaderboard.length + 1;
  const primaryAdoption = adoptions.find((item) => item.area === selectedArea) ?? adoptions[0];
  const progress = primaryAdoption ? Math.min(100, Math.round((actionTotals.trees / Math.max(primaryAdoption.goal, 1)) * 100)) : 0;

  return (
    <div className="w-full min-w-0 space-y-6">
      {achievementMessage ? (
        <div className="alert-slide-in rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 shadow-sm">
          🎉 {achievementMessage}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass-card-strong rounded-[32px] p-6">
          <div className="inline-flex rounded-full border border-emerald-100 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Citizen Participation
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Green Citizen Gamification System</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Adopt heat-stressed zones, log cooling actions, earn climate points, and compete as a citizen, college, or company to cool the city together.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-600">Participant Name</span>
              <input value={userName} onChange={(event) => setUserName(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none dark:border-slate-700 dark:bg-slate-900" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-600">Participation Type</span>
              <select value={participantType} onChange={(event) => setParticipantType(event.target.value as ParticipantType)} className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none dark:border-slate-700 dark:bg-slate-900">
                <option value="Citizen">Citizen</option>
                <option value="College">College</option>
                <option value="Company">Company</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-600">Adopt Area</span>
              <select value={selectedArea} onChange={(event) => setSelectedArea(Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none dark:border-slate-700 dark:bg-slate-900">
                {initialData.cells.map((cell) => (
                  <option key={cell.cell_id} value={cell.cell_id}>
                    Zone {cell.cell_id}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-600">Cooling Goal</span>
              <input type="number" value={coolingGoal} onChange={(event) => setCoolingGoal(Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 outline-none dark:border-slate-700 dark:bg-slate-900" />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={adoptArea} className="climate-button bg-primary text-white hover:bg-accent">
              <MapPinned size={16} />
              Adopt This Area
            </button>
            <div className="rounded-full border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              {participantType}: {userName}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <StatCard label="Green Points" value={totalPoints.toLocaleString()} hint="Total citizen cooling points earned" accent={<Trophy size={18} />} />
          <StatCard label="Cooling Impact" value={`${totalImpact} deg C`} hint="Estimated area cooling from your actions" accent={<Leaf size={18} />} />
          <StatCard label="Actions Logged" value={actions.length.toString()} hint="Tree planting, roofs, walls and more" accent={<Sprout size={18} />} />
          <StatCard label="Citizen Rank" value={`#${rank}`} hint="Position in the current leaderboard" accent={<Award size={18} />} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-card-strong rounded-[32px] p-6">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Green Actions</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {ACTION_CONFIG.map((action) => (
              <div key={action.key} className="rounded-[28px] border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="font-semibold text-slate-950">{action.label}</div>
                <div className="mt-1 text-sm text-slate-600">Earn {POINTS[action.key]} points per unit</div>
                <button type="button" onClick={() => logAction(action.key, action.defaultUnits)} className="climate-button mt-4 w-full justify-center bg-slate-950 text-white hover:bg-slate-800">
                  {action.helper}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card-strong rounded-[32px] p-6">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Citizen Dashboard</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="text-sm text-slate-500">Your Actions Reduced Heat by</div>
              <div className="mt-2 text-3xl font-semibold text-slate-950">{totalImpact} deg C</div>
              <div className="mt-2 text-sm text-slate-600">Calculated from your cooling interventions and participation mix.</div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="text-sm text-slate-500">Cooling Progress</div>
              <div className="mt-2 text-lg font-semibold text-slate-950">Zone {primaryAdoption?.area ?? selectedArea}</div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-2 text-sm text-slate-600">Cooling Goal: {primaryAdoption?.goal ?? coolingGoal} trees · {progress}% completed</div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="text-sm text-slate-500">Trees Planted</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">{actionTotals.trees}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="text-sm text-slate-500">Areas Adopted</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">{adoptions.length}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="text-sm text-slate-500">Heat Reduction</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">{totalImpact} deg C</div>
            </div>
          </div>

          <div className="mt-5 rounded-[28px] border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="text-sm font-semibold text-slate-950">Gamification Badges</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(earnedBadges.length ? earnedBadges : BADGE_RULES.map((badge) => `${badge.icon} ${badge.name}`)).map((badge) => (
                <span key={badge} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <HeatMapCard
          cells={initialData.cells}
          title="Citizen Adopted Zones"
          description="Adopted areas are highlighted in green so communities can track cooling ownership."
          adoptedCellIds={adoptedCellIds}
        />

        <div className="glass-card-strong rounded-[32px] p-6">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Leaderboard</div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {(["Citizen", "College", "Company"] as ParticipantType[]).map((type, index) => {
              const leader = leaderboard.filter((entry) => entry.participantType === type)[0];
              const icon = type === "Citizen" ? <Users size={18} /> : type === "College" ? <GraduationCap size={18} /> : <Building2 size={18} />;
              return (
                <div key={type} className="rounded-[28px] border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="inline-flex rounded-full bg-slate-100 p-2 text-slate-700 dark:bg-slate-800 dark:text-slate-100">{icon}</div>
                  <div className="mt-3 text-sm text-slate-500">Top Green {type}</div>
                  <div className="mt-1 text-lg font-semibold text-slate-950">{leader?.name ?? "-"}</div>
                  <div className="mt-1 text-sm text-slate-600">{leader?.points ?? 0} points · {leader?.area ?? "-"}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 dark:border-slate-700">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="px-4 py-3 font-medium">Rank</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Points</th>
                  <th className="px-4 py-3 font-medium">Area</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.slice(0, 8).map((entry) => (
                  <tr key={`${entry.name}-${entry.area}`} className="border-t border-slate-100 text-slate-700 dark:border-slate-800 dark:text-slate-300">
                    <td className="px-4 py-3">#{entry.rank}</td>
                    <td className="px-4 py-3">{entry.name}</td>
                    <td className="px-4 py-3">{entry.participantType}</td>
                    <td className="px-4 py-3">{entry.points}</td>
                    <td className="px-4 py-3">{entry.area}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export const gyms = [
  { id: "gy_01", name: "Ironline Fitness", city: "Austin, TX", owner: "Marcus Hale", members: 214, status: "Verified", revenueDue: 128.4, created: "2025-08-14" },
  { id: "gy_02", name: "Peak Strength Club", city: "Denver, CO", owner: "Priya Shah", members: 342, status: "Verified", revenueDue: 205.2, created: "2025-06-02" },
  { id: "gy_03", name: "Nordic Barbell", city: "Portland, OR", owner: "Erik Larsen", members: 88, status: "Pending", revenueDue: 0, created: "2026-06-18" },
  { id: "gy_04", name: "Kinetic Athletics", city: "Miami, FL", owner: "Camila Ortiz", members: 456, status: "Verified", revenueDue: 273.6, created: "2025-01-20" },
  { id: "gy_05", name: "Titan Powerhouse", city: "Chicago, IL", owner: "Devon Brooks", members: 190, status: "Suspended", revenueDue: 0, created: "2024-11-11" },
  { id: "gy_06", name: "Zenith Gym", city: "Seattle, WA", owner: "Yuki Tanaka", members: 121, status: "Verified", revenueDue: 72.6, created: "2025-09-05" },
  { id: "gy_07", name: "Forge Fitness Co.", city: "Boston, MA", owner: "Rachel Nolan", members: 267, status: "Verified", revenueDue: 160.2, created: "2025-03-27" },
  { id: "gy_08", name: "Coast Barbell Society", city: "San Diego, CA", owner: "Jordan Kim", members: 74, status: "Pending", revenueDue: 0, created: "2026-07-01" },
];

export type MockMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  gym: string;
  gymId: string;
  plan: string;
  status: "active" | "inactive" | "suspended";
  joined: string;
  lastCheckIn: string | null;
};

/** Platform-wide members list demo (UI until API is wired). */
export const members: MockMember[] = [
  { id: "m_01", name: "Aiden Walsh", email: "aiden.w@mail.com", phone: "+91 98111 22001", gym: "Ironline Fitness", gymId: "gy_01", plan: "Quarterly", status: "active", joined: "2026-05-12", lastCheckIn: "2026-08-15" },
  { id: "m_02", name: "Bella Chen", email: "bella.chen@mail.com", phone: "+91 98111 22002", gym: "Peak Strength Club", gymId: "gy_02", plan: "Annual", status: "active", joined: "2026-04-08", lastCheckIn: "2026-08-14" },
  { id: "m_03", name: "Chris Okafor", email: "c.okafor@mail.com", phone: "+91 98111 22003", gym: "Kinetic Athletics", gymId: "gy_04", plan: "Monthly", status: "active", joined: "2026-07-19", lastCheckIn: "2026-08-15" },
  { id: "m_04", name: "Dana Petrov", email: "d.petrov@mail.com", phone: "+91 98111 22004", gym: "Forge Fitness Co.", gymId: "gy_07", plan: "Quarterly", status: "active", joined: "2026-02-14", lastCheckIn: "2026-08-12" },
  { id: "m_05", name: "Eli Rodriguez", email: "eli.r@mail.com", phone: "+91 98111 22005", gym: "Titan Powerhouse", gymId: "gy_05", plan: "Monthly", status: "inactive", joined: "2025-12-01", lastCheckIn: "2026-03-18" },
  { id: "m_06", name: "Farah Nasser", email: "farah.n@mail.com", phone: "+91 98111 22006", gym: "Zenith Gym", gymId: "gy_06", plan: "Half yearly", status: "active", joined: "2026-06-30", lastCheckIn: "2026-08-13" },
  { id: "m_07", name: "Gabe Sullivan", email: "gabe.s@mail.com", phone: "+91 98111 22007", gym: "Nordic Barbell", gymId: "gy_03", plan: "Monthly", status: "active", joined: "2026-07-22", lastCheckIn: "2026-08-11" },
  { id: "m_08", name: "Hana Ito", email: "hana.ito@mail.com", phone: "+91 98111 22008", gym: "Ironline Fitness", gymId: "gy_01", plan: "Annual", status: "active", joined: "2026-01-19", lastCheckIn: "2026-08-15" },
  { id: "m_09", name: "Ilya Volkov", email: "ilya.v@mail.com", phone: "+91 98111 22009", gym: "Peak Strength Club", gymId: "gy_02", plan: "Quarterly", status: "suspended", joined: "2025-11-04", lastCheckIn: "2026-06-02" },
  { id: "m_10", name: "Jules Marchetti", email: "jules.m@mail.com", phone: "+91 98111 22010", gym: "Coast Barbell Society", gymId: "gy_08", plan: "Monthly", status: "active", joined: "2026-07-25", lastCheckIn: "2026-08-14" },
  { id: "m_11", name: "Riya Kapoor", email: "riya.k@mail.com", phone: "+91 98111 22011", gym: "Ironline Fitness", gymId: "gy_01", plan: "Monthly", status: "active", joined: "2026-06-02", lastCheckIn: "2026-08-15" },
  { id: "m_12", name: "Dev Sharma", email: "dev.s@mail.com", phone: "+91 98111 22012", gym: "Kinetic Athletics", gymId: "gy_04", plan: "Monthly", status: "inactive", joined: "2025-11-08", lastCheckIn: "2026-05-30" },
  { id: "m_13", name: "Sara Ali", email: "sara.ali@mail.com", phone: "+91 98111 22013", gym: "Zenith Gym", gymId: "gy_06", plan: "Quarterly", status: "active", joined: "2026-03-21", lastCheckIn: "2026-08-13" },
  { id: "m_14", name: "Noah Brooks", email: "noah.b@mail.com", phone: "+91 98111 22014", gym: "Titan Powerhouse", gymId: "gy_05", plan: "Monthly", status: "suspended", joined: "2026-02-14", lastCheckIn: "2026-07-02" },
  { id: "m_15", name: "Ishita Rao", email: "ishita.r@mail.com", phone: "+91 98111 22015", gym: "Forge Fitness Co.", gymId: "gy_07", plan: "Annual", status: "active", joined: "2025-12-04", lastCheckIn: "2026-08-15" },
  { id: "m_16", name: "Vikram Nair", email: "vikram.n@mail.com", phone: "+91 98111 22016", gym: "Peak Strength Club", gymId: "gy_02", plan: "Quarterly", status: "active", joined: "2026-04-17", lastCheckIn: "2026-08-12" },
  { id: "m_17", name: "Ananya Joshi", email: "ananya.j@mail.com", phone: "+91 98111 22017", gym: "Nordic Barbell", gymId: "gy_03", plan: "Monthly", status: "active", joined: "2026-07-01", lastCheckIn: "2026-08-15" },
  { id: "m_18", name: "Rohan Mehta", email: "rohan.m@mail.com", phone: "+91 98111 22018", gym: "Coast Barbell Society", gymId: "gy_08", plan: "Half yearly", status: "active", joined: "2026-02-28", lastCheckIn: "2026-08-10" },
  { id: "m_19", name: "Priya Shah", email: "priya.s@mail.com", phone: "+91 98111 22019", gym: "Ironline Fitness", gymId: "gy_01", plan: "Quarterly", status: "inactive", joined: "2025-09-14", lastCheckIn: "2026-04-02" },
  { id: "m_20", name: "Kabir Patel", email: "kabir.p@mail.com", phone: "+91 98111 22020", gym: "Kinetic Athletics", gymId: "gy_04", plan: "Annual", status: "active", joined: "2026-01-05", lastCheckIn: "2026-08-14" },
  { id: "m_21", name: "Meera Iyer", email: "meera.i@mail.com", phone: "+91 98111 22021", gym: "Zenith Gym", gymId: "gy_06", plan: "Monthly", status: "active", joined: "2026-06-18", lastCheckIn: "2026-08-15" },
  { id: "m_22", name: "Arjun Reddy", email: "arjun.r@mail.com", phone: "+91 98111 22022", gym: "Forge Fitness Co.", gymId: "gy_07", plan: "Quarterly", status: "suspended", joined: "2025-10-22", lastCheckIn: "2026-06-11" },
  { id: "m_23", name: "Zara Khan", email: "zara.k@mail.com", phone: "+91 98111 22023", gym: "Peak Strength Club", gymId: "gy_02", plan: "Half yearly", status: "active", joined: "2026-03-09", lastCheckIn: "2026-08-13" },
  { id: "m_24", name: "Leo Fernandes", email: "leo.f@mail.com", phone: "+91 98111 22024", gym: "Nordic Barbell", gymId: "gy_03", plan: "Monthly", status: "active", joined: "2026-05-27", lastCheckIn: null },
];

export const joinRequests = [
  { id: "jr_01", member: "Chris Okafor", gym: "Kinetic Athletics", source: "Self request", requested: "2026-07-19 10:24", status: "Pending" },
  { id: "jr_02", member: "Gabe Sullivan", gym: "Nordic Barbell", source: "Owner invite", requested: "2026-07-22 08:12", status: "Pending" },
  { id: "jr_03", member: "Aiden Walsh", gym: "Ironline Fitness", source: "Self request", requested: "2026-05-12 14:03", status: "Approved" },
  { id: "jr_04", member: "Hana Ito", gym: "Ironline Fitness", source: "Owner invite", requested: "2026-01-19 09:41", status: "Approved" },
  { id: "jr_05", member: "Milo Bright", gym: "Titan Powerhouse", source: "Self request", requested: "2026-06-08 11:55", status: "Rejected" },
  { id: "jr_06", member: "Jules Marchetti", gym: "Coast Barbell Society", source: "Owner invite", requested: "2026-07-25 16:30", status: "Pending" },
];

export const exercises = [
  { id: "ex_01", name: "Barbell Back Squat", muscle: "Quads / Glutes", equipment: "Barbell", difficulty: "Intermediate", status: "Active" },
  { id: "ex_02", name: "Conventional Deadlift", muscle: "Posterior chain", equipment: "Barbell", difficulty: "Advanced", status: "Active" },
  { id: "ex_03", name: "Bench Press", muscle: "Chest / Triceps", equipment: "Barbell + bench", difficulty: "Intermediate", status: "Active" },
  { id: "ex_04", name: "Pull-Up", muscle: "Back / Biceps", equipment: "Pull-up bar", difficulty: "Intermediate", status: "Active" },
  { id: "ex_05", name: "Overhead Press", muscle: "Shoulders", equipment: "Barbell", difficulty: "Intermediate", status: "Active" },
  { id: "ex_06", name: "Romanian Deadlift", muscle: "Hamstrings / Glutes", equipment: "Barbell", difficulty: "Intermediate", status: "Active" },
  { id: "ex_07", name: "Dumbbell Row", muscle: "Back", equipment: "Dumbbell", difficulty: "Beginner", status: "Active" },
  { id: "ex_08", name: "Goblet Squat", muscle: "Quads", equipment: "Dumbbell", difficulty: "Beginner", status: "Active" },
  { id: "ex_09", name: "Incline DB Press", muscle: "Upper chest", equipment: "Dumbbell + bench", difficulty: "Beginner", status: "Inactive" },
  { id: "ex_10", name: "Hanging Leg Raise", muscle: "Core", equipment: "Pull-up bar", difficulty: "Intermediate", status: "Active" },
];

export const workouts = [
  { id: "w_01", name: "Foundations 3x/week", level: "Beginner", goal: "General strength", days: 3, status: "Published" },
  { id: "w_02", name: "Push / Pull / Legs", level: "Intermediate", goal: "Hypertrophy", days: 6, status: "Published" },
  { id: "w_03", name: "Upper / Lower Split", level: "Intermediate", goal: "Strength + size", days: 4, status: "Published" },
  { id: "w_04", name: "Home Bodyweight Reset", level: "Beginner", goal: "Habit building", days: 4, status: "Inactive" },
];

export const diets = [
  { id: "d_01", name: "Lean Cut 2200 kcal", goal: "Fat loss", kcal: 2200, protein: 180, carbs: 200, fat: 70, status: "Published" },
  { id: "d_02", name: "Maintenance 2600 kcal", goal: "Maintenance", kcal: 2600, protein: 170, carbs: 280, fat: 80, status: "Published" },
  { id: "d_03", name: "Lean Bulk 3000 kcal", goal: "Muscle gain", kcal: 3000, protein: 200, carbs: 340, fat: 90, status: "Published" },
];

export const aiPlans = [
  { id: "ai_01", member: "Bella Chen", type: "Diet", title: "High-protein vegetarian 2100", created: "2026-07-21", status: "Active" },
  { id: "ai_02", member: "Aiden Walsh", type: "Workout", title: "5-day PPL for lifters", created: "2026-07-20", status: "Active" },
  { id: "ai_03", member: "Farah Nasser", type: "Diet", title: "Ramadan-friendly cut", created: "2026-07-18", status: "Active" },
  { id: "ai_04", member: "Ilya Volkov", type: "Workout", title: "Aggressive fat-loss circuit", created: "2026-07-16", status: "Flagged" },
  { id: "ai_05", member: "Dana Petrov", type: "Diet", title: "Extreme 1200kcal drop", created: "2026-07-12", status: "Hidden" },
  { id: "ai_06", member: "Hana Ito", type: "Workout", title: "Upper/lower for busy pros", created: "2026-07-10", status: "Active" },
];

export const subscriptions = members.slice(0, 10).map((m, i) => ({
  id: `sub_${i}`,
  member: m.name,
  email: m.email,
  gym: m.gym,
  status:
    m.status === "active"
      ? "Active"
      : m.status === "suspended"
        ? "Past Due"
        : "Canceled",
  amount: 3,
  nextBilling: "2026-08-05",
  started: m.joined,
}));

export const revenueShare = gyms.filter(g => g.status !== "Suspended").map((g) => {
  const gross = Math.round(g.members * 3 * 0.72 * 100) / 100;
  return { gym: g.name, activeSubs: Math.round(g.members * 0.72), gross, share: Math.round(gross * 0.2 * 100) / 100, period: "Jul 2026" };
});

export const payouts = [
  { id: "po_01", gym: "Ironline Fitness", period: "Jun 2026", amount: 124.80, status: "Paid", paidAt: "2026-07-05" },
  { id: "po_02", gym: "Peak Strength Club", period: "Jun 2026", amount: 201.60, status: "Paid", paidAt: "2026-07-05" },
  { id: "po_03", gym: "Kinetic Athletics", period: "Jun 2026", amount: 268.80, status: "Paid", paidAt: "2026-07-05" },
  { id: "po_04", gym: "Forge Fitness Co.", period: "Jun 2026", amount: 156.60, status: "Paid", paidAt: "2026-07-05" },
  { id: "po_05", gym: "Ironline Fitness", period: "Jul 2026", amount: 128.40, status: "Pending", paidAt: "" },
  { id: "po_06", gym: "Peak Strength Club", period: "Jul 2026", amount: 205.20, status: "Pending", paidAt: "" },
  { id: "po_07", gym: "Kinetic Athletics", period: "Jul 2026", amount: 273.60, status: "Pending", paidAt: "" },
  { id: "po_08", gym: "Zenith Gym", period: "Jul 2026", amount: 72.60, status: "Pending", paidAt: "" },
  { id: "po_09", gym: "Forge Fitness Co.", period: "Jul 2026", amount: 160.20, status: "Pending", paidAt: "" },
];

export const admins = [
  { id: "a_01", email: "alex@gymmerzhub.com", role: "super_admin", status: "Active", lastLogin: "2026-07-27 09:12" },
  { id: "a_02", email: "sam.ops@gymmerzhub.com", role: "support", status: "Active", lastLogin: "2026-07-26 17:44" },
  { id: "a_03", email: "riley.content@gymmerzhub.com", role: "content", status: "Active", lastLogin: "2026-07-25 12:03" },
  { id: "a_04", email: "kai.support@gymmerzhub.com", role: "support", status: "Inactive", lastLogin: "2026-05-11 08:22" },
];

export const auditLogs = [
  { time: "2026-07-27 09:44", actor: "alex@gymmerzhub.com", action: "template.published", target: "Workout · Foundations 3x/week", meta: "v3" },
  { time: "2026-07-27 08:20", actor: "sam.ops@gymmerzhub.com", action: "gym.suspended", target: "Titan Powerhouse", meta: "reason: dispute" },
  { time: "2026-07-26 21:11", actor: "system", action: "payout.marked_paid", target: "Ironline Fitness · Jun 2026", meta: "$124.80" },
  { time: "2026-07-26 15:32", actor: "alex@gymmerzhub.com", action: "member.force_verified", target: "Aiden Walsh", meta: "support ticket #4421" },
  { time: "2026-07-25 12:03", actor: "riley.content@gymmerzhub.com", action: "diet.published", target: "Lean Bulk 3000 kcal", meta: "v2" },
  { time: "2026-07-24 10:22", actor: "sam.ops@gymmerzhub.com", action: "ai_plan.flagged", target: "Ilya Volkov · Aggressive fat-loss circuit", meta: "low kcal" },
  { time: "2026-07-23 18:00", actor: "alex@gymmerzhub.com", action: "admin.added", target: "kai.support@gymmerzhub.com", meta: "role: support" },
];

export const chartData = Array.from({ length: 30 }).map((_, i) => {
  const base = 180 + i * 12 + Math.sin(i / 2) * 25;
  return { day: `D${i + 1}`, value: Math.round(base) };
});

export const recentActivity = [
  { time: "2m ago", text: "Aiden Walsh joined Ironline Fitness", tone: "success" as const },
  { time: "14m ago", text: "Marcus Hale approved 3 pending members", tone: "info" as const },
  { time: "1h ago", text: "Payout marked paid · Ironline Fitness · $124.80", tone: "success" as const },
  { time: "3h ago", text: "Template published · Push / Pull / Legs v4", tone: "info" as const },
  { time: "5h ago", text: "AI plan flagged for review · Ilya Volkov", tone: "warn" as const },
  { time: "8h ago", text: "Gym suspended · Titan Powerhouse", tone: "danger" as const },
];

import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Input, Panel, Select, PageHeader } from "@/components/admin/ui";
import {
  createAdminDietPlan,
  DIET_PLAN_GOALS,
  DIET_PLAN_GOAL_LABELS,
  DIET_PLAN_TAGS,
  DIET_PLAN_TAG_LABELS,
  updateAdminDietPlan,
  type DietPlanDetail,
  type DietPlanGoal,
  type DietPlanTag,
  type DietStatus,
  type DietVisibility,
} from "@/lib/admin-diet-plans";
import { fetchAdminFoodItems, type AdminFoodItem } from "@/lib/admin-food-items";
import { formatApiError } from "@/lib/api";
import {
  ArrowLeft,
  Check,
  Copy,
  Flame,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DEFAULT_MEALS = [
  { name: "Breakfast", timeHint: "8:00 AM" },
  { name: "Lunch", timeHint: "1:00 PM" },
  { name: "Dinner", timeHint: "8:00 PM" },
];

type MealItem = { key: string; foodItemId: string; quantity: string };
type MealOption = { items: MealItem[] };
type Meal = {
  key: string;
  name: string;
  timeHint: string;
  items: MealItem[];
  /** Extra meal alternatives preserved on save (not edited in this builder). */
  altOptions: MealOption[];
};
type Day = { meals: Meal[] };

let keySeed = 0;
const nextKey = () => `k${++keySeed}`;

function emptyItem(): MealItem {
  return { key: nextKey(), foodItemId: "", quantity: "100" };
}

function emptyMeal(name = "", timeHint = ""): Meal {
  return { key: nextKey(), name, timeHint, items: [emptyItem()], altOptions: [] };
}

function initialDays(): Day[] {
  return DAYS.map(() => ({
    meals: DEFAULT_MEALS.map((meal) => emptyMeal(meal.name, meal.timeHint)),
  }));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function scaled(food: AdminFoodItem | undefined, quantity: number) {
  if (!food || !food.servingQty) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const factor = quantity / food.servingQty;
  return {
    calories: food.calories * factor,
    protein: food.protein * factor,
    carbs: food.carbs * factor,
    fat: food.fat * factor,
  };
}

function mapItems(items: Array<{ foodItemId: string; quantity: number }>): MealItem[] {
  if (!items.length) return [emptyItem()];
  return items.map((item) => ({
    key: nextKey(),
    foodItemId: item.foodItemId,
    quantity: String(item.quantity),
  }));
}

function daysFromPlan(plan: DietPlanDetail): Day[] {
  return DAYS.map((_, index) => {
    const day = plan.days.find((entry) => entry.dayIndex === index + 1);
    const slots = [...(day?.slots ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
    if (!slots.length) {
      return { meals: DEFAULT_MEALS.map((meal) => emptyMeal(meal.name, meal.timeHint)) };
    }
    return {
      meals: slots.map((slot) => {
        const options = [...(slot.options ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
        const defaultOpt = options.find((option) => option.isDefault) ??
          options[0] ?? { items: [] };
        const alts = options.filter((option) => option !== defaultOpt);
        return {
          key: nextKey(),
          name: slot.name,
          timeHint: slot.timeHint || "",
          items: mapItems(defaultOpt.items),
          altOptions: alts.map((option) => ({ items: mapItems(option.items) })),
        };
      }),
    };
  });
}

function payloadDays(days: Day[]) {
  return days.map((day, index) => ({
    dayIndex: index + 1,
    slots: day.meals.map((meal) => ({
      name: meal.name.trim(),
      timeHint: meal.timeHint.trim() || null,
      options: [
        {
          items: meal.items.map((item) => ({
            foodItemId: item.foodItemId,
            quantity: Number(item.quantity),
          })),
        },
        ...meal.altOptions.map((option) => ({
          items: option.items.map((item) => ({
            foodItemId: item.foodItemId,
            quantity: Number(item.quantity),
          })),
        })),
      ].slice(0, 3),
    })),
  }));
}

type DietPlanEditorProps = {
  mode: "create" | "edit";
  planId?: string;
  initialPlan?: DietPlanDetail;
};

export function DietPlanEditor({ mode, planId, initialPlan }: DietPlanEditorProps) {
  const navigate = useNavigate();
  const [foods, setFoods] = useState<AdminFoodItem[]>([]);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(initialPlan?.name ?? "");
  const [goal, setGoal] = useState<DietPlanGoal | "">(
    (initialPlan?.goal as DietPlanGoal | undefined) || "",
  );
  const [tag, setTag] = useState<DietPlanTag | "">(
    (initialPlan?.tag as DietPlanTag | undefined) || "",
  );
  const [water, setWater] = useState(String(initialPlan?.water ?? 3));
  const [notes, setNotes] = useState(initialPlan?.notes ?? "");
  const [visibility, setVisibility] = useState<DietVisibility>(initialPlan?.visibility ?? "draft");
  const [status, setStatus] = useState<DietStatus>(initialPlan?.status ?? "active");

  const [days, setDays] = useState<Day[]>(() =>
    initialPlan ? daysFromPlan(initialPlan) : initialDays(),
  );
  const [activeDay, setActiveDay] = useState(0);
  const [foodQuery, setFoodQuery] = useState("");

  useEffect(() => {
    void fetchAdminFoodItems({ status: "active", pageSize: 100 })
      .then((data) => setFoods(data.items))
      .catch((error) => toast.error(formatApiError(error, "Could not load food catalog")))
      .finally(() => setLoadingFoods(false));
  }, []);

  const foodById = useMemo(() => new Map(foods.map((food) => [food.id, food])), [foods]);
  const visibleFoods = useMemo(() => {
    const term = foodQuery.trim().toLowerCase();
    if (!term) return foods;
    return foods.filter((food) => food.name.toLowerCase().includes(term));
  }, [foodQuery, foods]);

  function updateDay(dayIndex: number, updater: (day: Day) => Day) {
    setDays((current) => current.map((day, index) => (index === dayIndex ? updater(day) : day)));
  }

  function updateMeal(dayIndex: number, mealKey: string, updater: (meal: Meal) => Meal) {
    updateDay(dayIndex, (day) => ({
      meals: day.meals.map((meal) => (meal.key === mealKey ? updater(meal) : meal)),
    }));
  }

  function addMeal(dayIndex: number) {
    updateDay(dayIndex, (day) => ({
      meals: [...day.meals, emptyMeal()],
    }));
  }

  function removeMeal(dayIndex: number, mealKey: string) {
    updateDay(dayIndex, (day) => ({
      meals: day.meals.length === 1 ? day.meals : day.meals.filter((m) => m.key !== mealKey),
    }));
  }

  function copyDayToAll(dayIndex: number) {
    setDays((current) => {
      const source = current[dayIndex];
      const clone = (): Day => ({
        meals: source.meals.map((meal) => ({
          ...meal,
          key: nextKey(),
          items: meal.items.map((item) => ({ ...item, key: nextKey() })),
          altOptions: meal.altOptions.map((option) => ({
            items: option.items.map((item) => ({ ...item, key: nextKey() })),
          })),
        })),
      });
      return current.map((day, index) => (index === dayIndex ? day : clone()));
    });
    toast.success(`${DAYS[dayIndex]} copied to every day.`);
  }

  function dayTotals(day: Day) {
    return day.meals.reduce(
      (totals, meal) => {
        for (const item of meal.items) {
          const macros = scaled(foodById.get(item.foodItemId), Number(item.quantity) || 0);
          totals.calories += macros.calories;
          totals.protein += macros.protein;
          totals.carbs += macros.carbs;
          totals.fat += macros.fat;
        }
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }

  function mealTotals(meal: Meal) {
    return meal.items.reduce(
      (totals, item) => {
        const macros = scaled(foodById.get(item.foodItemId), Number(item.quantity) || 0);
        totals.calories += macros.calories;
        totals.protein += macros.protein;
        return totals;
      },
      { calories: 0, protein: 0 },
    );
  }

  function dayComplete(day: Day) {
    return day.meals.every(
      (meal) =>
        meal.name.trim() &&
        meal.items.length > 0 &&
        meal.items.every((item) => item.foodItemId && Number(item.quantity) > 0),
    );
  }

  const weekCalories = days.reduce((total, day) => total + dayTotals(day).calories, 0);
  const avgCalories = Math.round(weekCalories / DAYS.length);
  const completedDays = days.filter(dayComplete).length;
  const current = days[activeDay];
  const currentTotals = dayTotals(current);
  const cancelTo =
    mode === "edit" && planId
      ? ({ to: "/diets/$id" as const, params: { id: planId } } as const)
      : ({ to: "/diets" as const } as const);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Give the plan a name with at least 2 characters.");
      return;
    }
    const invalidDay = days.findIndex((day) => !dayComplete(day));
    if (invalidDay !== -1) {
      setActiveDay(invalidDay);
      toast.error(`${DAYS[invalidDay]} needs a meal name, food, and quantity for every row.`);
      return;
    }

    const body = {
      name: name.trim(),
      goal: goal || null,
      tag: tag || null,
      notes: notes.trim() || null,
      water: Number(water) || 0,
      status,
      visibility,
      days: payloadDays(days),
    };

    setSaving(true);
    try {
      const plan =
        mode === "edit" && planId
          ? await updateAdminDietPlan(planId, body)
          : await createAdminDietPlan(body);
      toast.success(mode === "edit" ? "Diet plan updated." : "Diet plan created.");
      navigate({ to: "/diets/$id", params: { id: plan.id } });
    } catch (error) {
      toast.error(
        formatApiError(
          error,
          mode === "edit" ? "Could not update diet plan" : "Could not create diet plan",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  const submitLabel = mode === "edit" ? "Save changes" : "Create plan";
  const SubmitIcon = mode === "edit" ? Save : Plus;

  return (
    <form onSubmit={submit} className="space-y-6">
      <PageHeader
        breadcrumb={
          <span className="inline-flex items-center gap-1.5">
            <Link to="/diets" className="hover:text-lime">
              Diet templates
            </Link>
            {mode === "edit" && planId ? (
              <>
                <span>/</span>
                <Link to="/diets/$id" params={{ id: planId }} className="hover:text-lime">
                  {initialPlan?.name || "Plan"}
                </Link>
              </>
            ) : null}
          </span>
        }
        title={mode === "edit" ? "Edit diet plan" : "Create diet plan"}
        subtitle={
          mode === "edit"
            ? "Update plan details and the weekly meal schedule."
            : "Set the plan basics, then build each day’s meals from the food catalog."
        }
        actions={
          <div className="flex items-center gap-2">
            <Link {...cancelTo}>
              <Button type="button" variant="secondary">
                <ArrowLeft className="h-4 w-4" /> Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving || loadingFoods}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SubmitIcon className="h-4 w-4" />
              )}
              {submitLabel}
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3 lg:gap-4">
        <SummaryCard
          label="Avg. calories"
          value={avgCalories ? `${avgCalories}` : "—"}
          hint="Default options · 7 days"
          accent="text-lime"
          wrap="border-lime/25 bg-lime/15 text-lime"
        />
        <SummaryCard
          label="Days ready"
          value={`${completedDays}/7`}
          hint="Meals with food selected"
          accent={completedDays === 7 ? "text-lime" : "text-amber-300"}
          wrap={
            completedDays === 7
              ? "border-lime/25 bg-lime/15 text-lime"
              : "border-amber-500/25 bg-amber-500/10 text-amber-300"
          }
        />
        <SummaryCard
          label={`${DAYS[activeDay]} total`}
          value={`${Math.round(currentTotals.calories)}`}
          hint={`P ${round(currentTotals.protein)}g · C ${round(currentTotals.carbs)}g · F ${round(currentTotals.fat)}g`}
          accent="text-sky-300"
          wrap="border-sky-500/25 bg-sky-500/10 text-sky-300"
        />
      </div>

      <Panel title="Plan details">
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Plan name">
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              placeholder="e.g. Cutting 2100"
            />
          </Field>
          <Field label="Goal">
            <Select
              value={goal}
              onChange={(e) => setGoal(e.target.value as DietPlanGoal | "")}
              className="h-9 w-full"
            >
              <option value="">Select goal…</option>
              {DIET_PLAN_GOALS.map((value) => (
                <option key={value} value={value}>
                  {DIET_PLAN_GOAL_LABELS[value]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tag">
            <Select
              value={tag}
              onChange={(e) => setTag(e.target.value as DietPlanTag | "")}
              className="h-9 w-full"
            >
              <option value="">Select tag…</option>
              {DIET_PLAN_TAGS.map((value) => (
                <option key={value} value={value}>
                  {DIET_PLAN_TAG_LABELS[value]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Daily water (L)">
            <Input
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={water}
              onChange={(e) => setWater(e.target.value)}
              className="w-full"
            />
          </Field>
          <Field label="Visibility">
            <Select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as DietVisibility)}
              className="h-9 w-full"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as DietStatus)}
              className="h-9 w-full"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
          <Field label="Notes · optional">
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full"
              placeholder="Coaching notes for this plan"
            />
          </Field>
        </div>
      </Panel>

      <Panel className="border-border/80 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.85)]">
        <div className="space-y-4 border-b border-border px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Weekly meal builder</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Edit the default option for each meal. Existing alternatives stay attached on save.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={foodQuery}
                  onChange={(e) => setFoodQuery(e.target.value)}
                  placeholder="Filter foods…"
                  className="h-9 w-52 pl-8"
                />
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => copyDayToAll(activeDay)}
              >
                <Copy className="h-3.5 w-3.5" /> Copy {DAYS[activeDay]} to all
              </Button>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1">
            {DAYS.map((label, index) => {
              const selected = index === activeDay;
              const ready = dayComplete(days[index]);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setActiveDay(index)}
                  className={`inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors ${
                    selected
                      ? "bg-lime text-lime-foreground"
                      : "border border-border bg-panel-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {label}
                  {ready && !selected ? <Check className="h-3 w-3 text-lime" /> : null}
                </button>
              );
            })}
          </div>
        </div>

        {loadingFoods ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading food catalog…
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {current.meals.map((meal, mealIndex) => {
              const totals = mealTotals(meal);
              return (
                <div
                  key={meal.key}
                  className="overflow-hidden rounded-xl border border-border/80 bg-panel-2/30"
                >
                  <div className="flex flex-wrap items-end gap-3 border-b border-border/70 bg-panel-2/50 px-4 py-3">
                    <div className="w-full sm:w-48">
                      <FieldLabel>Meal {mealIndex + 1}</FieldLabel>
                      <Input
                        value={meal.name}
                        onChange={(e) =>
                          updateMeal(activeDay, meal.key, (m) => ({ ...m, name: e.target.value }))
                        }
                        placeholder="Breakfast"
                        className="w-full"
                      />
                    </div>
                    <div className="w-full sm:w-36">
                      <FieldLabel>Time hint</FieldLabel>
                      <Input
                        value={meal.timeHint}
                        onChange={(e) =>
                          updateMeal(activeDay, meal.key, (m) => ({
                            ...m,
                            timeHint: e.target.value,
                          }))
                        }
                        placeholder="8:00 AM"
                        className="w-full"
                      />
                    </div>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                      {meal.altOptions.length > 0 ? (
                        <Badge tone="info">{meal.altOptions.length} alt kept</Badge>
                      ) : null}
                      <Badge tone={totals.calories > 0 ? "success" : "muted"}>
                        {Math.round(totals.calories)} kcal · P {round(totals.protein)}g
                      </Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={current.meals.length === 1}
                        onClick={() => removeMeal(activeDay, meal.key)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 p-4">
                    <div className="hidden gap-3 px-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground md:grid md:grid-cols-[minmax(0,1fr)_9rem_11rem_2.25rem]">
                      <span>Food</span>
                      <span>Quantity</span>
                      <span className="text-right">Macros</span>
                      <span />
                    </div>

                    {meal.items.map((item, itemIndex) => {
                      const food = foodById.get(item.foodItemId);
                      const macros = scaled(food, Number(item.quantity) || 0);
                      return (
                        <div
                          key={item.key}
                          className="grid items-center gap-3 rounded-lg border border-border/60 bg-background/30 px-3 py-2.5 md:grid-cols-[minmax(0,1fr)_9rem_11rem_2.25rem]"
                        >
                          <Select
                            value={item.foodItemId}
                            onChange={(e) =>
                              updateMeal(activeDay, meal.key, (m) => ({
                                ...m,
                                items: m.items.map((it) =>
                                  it.key === item.key ? { ...it, foodItemId: e.target.value } : it,
                                ),
                              }))
                            }
                            className="h-9 w-full"
                            aria-label={`Food ${itemIndex + 1}`}
                          >
                            <option value="">Choose food…</option>
                            {visibleFoods.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name} · {option.calories} kcal / {option.servingQty}
                                {option.servingUnit}
                              </option>
                            ))}
                          </Select>

                          <div className="flex h-9 items-center rounded-md border border-border bg-panel-2 focus-within:ring-1 focus-within:ring-lime">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={item.quantity}
                              onChange={(e) =>
                                updateMeal(activeDay, meal.key, (m) => ({
                                  ...m,
                                  items: m.items.map((it) =>
                                    it.key === item.key ? { ...it, quantity: e.target.value } : it,
                                  ),
                                }))
                              }
                              className="h-full w-full min-w-0 rounded-l-md bg-transparent px-3 text-sm tabular-nums text-foreground focus:outline-none"
                              aria-label="Quantity"
                            />
                            <span className="h-full shrink-0 border-l border-border/70 px-2.5 text-[11px] leading-[2.25rem] text-muted-foreground">
                              {food?.servingUnit ?? "g"}
                            </span>
                          </div>

                          <div className="tabular-nums md:text-right">
                            {food ? (
                              <>
                                <div className="text-sm font-semibold text-foreground">
                                  {Math.round(macros.calories)}
                                  <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                                    kcal
                                  </span>
                                </div>
                                <div className="mt-0.5 whitespace-nowrap text-[11px] text-muted-foreground">
                                  P {round(macros.protein)} · C {round(macros.carbs)} · F{" "}
                                  {round(macros.fat)}
                                </div>
                              </>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Pick a food</span>
                            )}
                          </div>

                          <button
                            type="button"
                            aria-label="Remove food"
                            disabled={meal.items.length === 1}
                            onClick={() =>
                              updateMeal(activeDay, meal.key, (m) => ({
                                ...m,
                                items: m.items.filter((it) => it.key !== item.key),
                              }))
                            }
                            className="grid h-9 w-9 cursor-pointer place-items-center rounded-md border border-border bg-panel-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}

                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        updateMeal(activeDay, meal.key, (m) => ({
                          ...m,
                          items: [...m.items, emptyItem()],
                        }))
                      }
                    >
                      <Plus className="h-3.5 w-3.5" /> Add food
                    </Button>
                  </div>
                </div>
              );
            })}

            <Button type="button" variant="secondary" onClick={() => addMeal(activeDay)}>
              <UtensilsCrossed className="h-4 w-4" /> Add meal to {DAYS[activeDay]}
            </Button>
          </div>
        )}
      </Panel>

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Flame className="h-4 w-4 text-lime" />
            <span className="tabular-nums">
              {avgCalories || 0} kcal average · {completedDays}/7 days ready
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link {...cancelTo}>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving || loadingFoods}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SubmitIcon className="h-4 w-4" />
              )}
              {submitLabel}
            </Button>
          </div>
        </div>
      </Panel>
    </form>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  accent,
  wrap,
}: {
  label: string;
  value: string;
  hint: string;
  accent: string;
  wrap: string;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-panel p-4 ring-1 ring-white/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </div>
          <div className={`mt-2 text-2xl font-semibold tabular-nums ${accent}`}>{value}</div>
          <div className="mt-1 truncate text-[11px] text-muted-foreground">{hint}</div>
        </div>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${wrap}`}>
          <Flame className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="min-w-0 w-full">{children}</div>
    </label>
  );
}

export type CreditCourseExample = {
  activityId: string;
  name: string;
  credits: number;
  nextSessionStart: string | null;
  imageUrl: string;
};

export type PracticeCreditRate = {
  id: string;
  type: "autonomie" | "autonomie_encadree";
  name: string;
  creditsPerHour: number;
};

export function practiceHoursLabel(credits: number, creditsPerHour: number) {
  if (creditsPerHour <= 0 || credits <= 0) return null;
  const hours = Math.floor((credits / creditsPerHour) * 2) / 2;
  if (hours < 0.5) return null;
  const formatted = Number.isInteger(hours)
    ? String(hours)
    : hours.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  return `${formatted} h`;
}

export function examplesForCredits(
  examples: CreditCourseExample[],
  credits: number,
  limit = 3,
) {
  return examples
    .filter((example) => example.credits <= credits)
    .sort((left, right) => {
      const creditDiff = right.credits - left.credits;
      if (creditDiff !== 0) return creditDiff;
      if (left.nextSessionStart && right.nextSessionStart) {
        return left.nextSessionStart.localeCompare(right.nextSessionStart);
      }
      if (left.nextSessionStart) return -1;
      if (right.nextSessionStart) return 1;
      return left.name.localeCompare(right.name, "fr");
    })
    .slice(0, limit);
}

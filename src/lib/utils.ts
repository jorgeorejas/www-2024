import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date) {
  return Intl.DateTimeFormat("es-ES", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** What a role or a degree that hasn't ended shows instead of an end date */
export const PRESENT_LABEL = "actualidad";

/** Short month and year in Spanish, e.g. "oct 2026" (UTC, Notion dates are date-only) */
export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("es-ES", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function readingTime(html: string = "") {
  const textOnly = html.replace(/<[^>]+>/g, "");
  const wordCount = textOnly.split(/\s+/).length;
  const readingTimeMinutes = (wordCount / 200 + 1).toFixed();
  return `${readingTimeMinutes} min de lectura`;
}

export function dateRange(startDate: Date, endDate?: Date | string): string {
  const startMonth = startDate.toLocaleString("es-ES", { month: "short", timeZone: "UTC" });
  const startYear = startDate.getFullYear().toString();
  let endMonth;
  let endYear;

  if (endDate) {
    if (typeof endDate === "string") {
      endMonth = "";
      endYear = endDate === "Present" ? PRESENT_LABEL : endDate;
    } else {
      endMonth = endDate.toLocaleString("es-ES", { month: "short", timeZone: "UTC" });
      endYear = endDate.getFullYear().toString();
    }
  }

  return `${startMonth} ${startYear} ー ${endMonth} ${endYear}`;
}

export function getWorkDateRange(
  roles: Array<{
    dateStart: Date;
    dateEnd?: Date | string;
  }>,
): { startDate: Date; endDate: Date | string } {
  if (roles.length === 0) {
    throw new Error("Roles array cannot be empty");
  }

  // Sort roles by dateStart to get the earliest start date
  const sortedRoles = [...roles].sort(
    (a, b) => a.dateStart.valueOf() - b.dateStart.valueOf(),
  );
  const startDate = sortedRoles[0].dateStart;

  // Find the latest end date or "Present" if any role is current
  let endDate: Date | string = "Present";
  let hasPresentRole = false;

  for (const role of roles) {
    if (role.dateEnd === "Present") {
      hasPresentRole = true;
      break;
    } else if (role.dateEnd && typeof role.dateEnd !== "string") {
      if (typeof endDate === "string" || role.dateEnd > endDate) {
        endDate = role.dateEnd;
      }
    }
  }

  // If no role is "Present", use the latest end date
  if (!hasPresentRole && typeof endDate !== "string") {
    return { startDate, endDate };
  }

  return { startDate, endDate: hasPresentRole ? "Present" : endDate };
}

export function processWorkEntry(workEntry: {
  id: string;
  data: {
    company: string;
    website?: string;
    roles: Array<{
      title: string;
      dateStart: Date;
      dateEnd?: Date | string;
      description?: string;
    }>;
  };
  body?: string;
}) {
  const { startDate, endDate } = getWorkDateRange(workEntry.data.roles);

  return {
    slug: workEntry.id,
    name: workEntry.data.company,
    website: workEntry.data.website,
    description: (workEntry.body ?? "").trim(),
    startDate,
    endDate,
    positions: workEntry.data.roles
      .sort((a, b) => b.dateStart.valueOf() - a.dateStart.valueOf())
      .map((role) => ({
        title: role.title,
        startDate: role.dateStart,
        endDate: role.dateEnd || "Present",
        description: role.description || "",
      })),
  };
}

export function formatWorkDate(date: Date | string): string {
  if (typeof date === "string") {
    return date === "Present" ? PRESENT_LABEL : date;
  }
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function processEducationEntry(educationEntry: {
  id: string;
  data: {
    institution: string;
    degree: string;
    field?: string;
    grade?: string;
    dateStart: Date;
    dateEnd: Date | string;
    expectedEnd?: Date;
  };
  body?: string;
}) {
  return {
    slug: educationEntry.id,
    institution: educationEntry.data.institution,
    degree: educationEntry.data.degree,
    field: educationEntry.data.field,
    grade: educationEntry.data.grade,
    description: (educationEntry.body ?? "").trim(),
    startDate: educationEntry.data.dateStart,
    endDate: educationEntry.data.dateEnd,
    expectedEnd: educationEntry.data.expectedEnd,
  };
}

export function formatEducationDate(date: Date | string): string {
  if (typeof date === "string") {
    return date === "Present" ? PRESENT_LABEL : date;
  }
  return formatMonthYear(date);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** True when `date` is at most `days` days old (the Margin "NEW" marker) */
export function isNew(date: Date | undefined, days = 60): boolean {
  if (!date || Number.isNaN(date.valueOf())) return false;
  return Date.now() - date.valueOf() <= days * DAY_MS;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** yy.mm.dd, e.g. 26.10.21 (UTC, Notion dates are date-only) */
export function formatDot(date: Date): string {
  return `${String(date.getUTCFullYear()).slice(2)}.${pad2(date.getUTCMonth() + 1)}.${pad2(date.getUTCDate())}`;
}

/** Four-digit year, e.g. 2026 (UTC) */
export function formatYear(date: Date): string {
  return String(date.getUTCFullYear());
}

/**
 * Length of a period in years and months, e.g. "10 meses", "2 años y 3 meses".
 * `end` defaults to now ("Present" counts as now).
 */
export function formatDuration(start: Date, end?: Date | string): string {
  const until = end instanceof Date ? end : new Date();
  const months = Math.max(1, Math.round((until.valueOf() - start.valueOf()) / (DAY_MS * 30.44)));
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [
    years ? `${years} ${years === 1 ? "año" : "años"}` : "",
    rest ? `${rest} ${rest === 1 ? "mes" : "meses"}` : "",
  ]
    .filter(Boolean)
    .join(" y ");
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date) {
  return Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

export function readingTime(html: string) {
  const textOnly = html.replace(/<[^>]+>/g, "");
  const wordCount = textOnly.split(/\s+/).length;
  const readingTimeMinutes = (wordCount / 200 + 1).toFixed();
  return `${readingTimeMinutes} min read`;
}

export function dateRange(startDate: Date, endDate?: Date | string): string {
  const startMonth = startDate.toLocaleString("default", { month: "short" });
  const startYear = startDate.getFullYear().toString();
  let endMonth;
  let endYear;

  if (endDate) {
    if (typeof endDate === "string") {
      endMonth = "";
      endYear = endDate;
    } else {
      endMonth = endDate.toLocaleString("default", { month: "short" });
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
  slug: string;
  data: {
    company: string;
    roles: Array<{
      title: string;
      dateStart: Date;
      dateEnd?: Date | string;
      description?: string;
    }>;
  };
  body: string;
}) {
  const { startDate, endDate } = getWorkDateRange(workEntry.data.roles);

  return {
    slug: workEntry.slug,
    name: workEntry.data.company,
    description: workEntry.body.trim(),
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
    return date;
  }
  return date.toLocaleDateString("en-EN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function processEducationEntry(educationEntry: {
  slug: string;
  data: {
    institution: string;
    degree: string;
    field?: string;
    grade?: string;
    dateStart: Date;
    dateEnd: Date | string;
    expectedEnd?: Date;
  };
  body: string;
}) {
  return {
    slug: educationEntry.slug,
    institution: educationEntry.data.institution,
    degree: educationEntry.data.degree,
    field: educationEntry.data.field,
    grade: educationEntry.data.grade,
    description: educationEntry.body.trim(),
    startDate: educationEntry.data.dateStart,
    endDate: educationEntry.data.dateEnd,
    expectedEnd: educationEntry.data.expectedEnd,
  };
}

export function formatEducationDate(date: Date | string): string {
  if (typeof date === "string") {
    return date;
  }
  return date.toLocaleDateString("en-EN", { month: "short", year: "numeric" });
}

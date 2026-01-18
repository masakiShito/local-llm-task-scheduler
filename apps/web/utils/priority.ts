export type PriorityLabel = "高" | "中" | "低";

// Priority mapping:
// - Numeric priorities from backend are mapped as 5-4 => 高, 3 => 中, 2-1 => 低.
// - If the value is already a label string, it is normalized to 高/中/低.
export const mapPriorityToLabel = (
  priority?: number | string
): PriorityLabel => {
  if (typeof priority === "number") {
    if (priority >= 4) return "高";
    if (priority === 3) return "中";
    return "低";
  }

  if (typeof priority === "string") {
    if (priority.includes("高") || priority.toLowerCase().includes("high")) {
      return "高";
    }
    if (priority.includes("低") || priority.toLowerCase().includes("low")) {
      return "低";
    }
  }

  return "中";
};

export const mapPriorityToClass = (label: PriorityLabel): string => {
  switch (label) {
    case "高":
      return "priority-high";
    case "中":
      return "priority-medium";
    case "低":
    default:
      return "priority-low";
  }
};

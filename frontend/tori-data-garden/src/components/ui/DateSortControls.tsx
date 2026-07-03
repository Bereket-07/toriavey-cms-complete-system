import React from "react";

export type PresetRangeKey =
  | "today"
  | "last_week"
  | "last_month"
  | "last_3_months"
  | "last_6_months"
  | "last_9_months"
  | "last_year"
  | "custom";

export function SortButton({
  onSort,
  value,
  onChange,
}: {
  onSort?: (preset: PresetRangeKey) => void;
  value?: PresetRangeKey;
  onChange?: (preset: PresetRangeKey) => void;
}) {
  const options = [
    { label: "Today's Analytics", value: "today" },
    { label: "Last Week", value: "last_week" },
    { label: "Last Month", value: "last_month" },
    { label: "Last 3 Months", value: "last_3_months" },
    { label: "Last 6 Months", value: "last_6_months" },
    { label: "Last 9 Months", value: "last_9_months" },
    { label: "Last Year", value: "last_year" },
    { label: "Custom", value: "custom" },
  ];
  const [selected, setSelected] = React.useState<PresetRangeKey>(value || "today");

  React.useEffect(() => {
    if (value && value !== selected) {
      setSelected(value);
    }
  }, [value, selected]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = e.target.value as PresetRangeKey;
    setSelected(preset);
    onChange?.(preset);
    onSort?.(preset);
  };

  return (
    <select
      value={selected}
      onChange={handleChange}
      className="px-4 py-2 bg-[#7C9A6D] text-white rounded-md shadow hover:bg-[#678055] transition font-medium"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export type DateRangeValue = { start: string; end: string };

export function DateRangePicker({
  value,
  onChange,
}: {
  value?: DateRangeValue;
  onChange?: (range: DateRangeValue) => void;
}) {
  const [start, setStart] = React.useState(value?.start ?? "");
  const [end, setEnd] = React.useState(value?.end ?? "");

  React.useEffect(() => {
    if (value?.start !== undefined) {
      setStart(value.start);
    }
    if (value?.end !== undefined) {
      setEnd(value.end);
    }
  }, [value?.start, value?.end]);

  const emitChange = React.useCallback(
    (next: DateRangeValue) => {
      onChange?.(next);
    },
    [onChange],
  );

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={start}
        onChange={(event) => {
          const next = { start: event.target.value, end };
          setStart(next.start);
          emitChange(next);
        }}
        className="px-2 py-1 border rounded-md focus:ring-[#7C9A6D] focus:border-[#7C9A6D]"
        aria-label="Start date"
      />
      <span className="mx-1 text-muted-foreground">to</span>
      <input
        type="date"
        value={end}
        onChange={(event) => {
          const next = { start, end: event.target.value };
          setEnd(next.end);
          emitChange(next);
        }}
        className="px-2 py-1 border rounded-md focus:ring-[#7C9A6D] focus:border-[#7C9A6D]"
        aria-label="End date"
      />
    </div>
  );
}

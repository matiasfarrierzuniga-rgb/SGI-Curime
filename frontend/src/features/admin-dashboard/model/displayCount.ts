export function displayCount(value: number | string | null) {
  return value === null
    ? "—"
    : typeof value === "number"
      ? value.toLocaleString("es-CR")
      : value;
}

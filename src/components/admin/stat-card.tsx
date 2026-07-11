export function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="ym-admin-stat">
      <p className="ym-admin-stat-label">{label}</p>
      <p className="ym-admin-stat-value">
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </p>
    </div>
  );
}

import { AdminInfoTip } from "@/components/admin/admin-info-tip";

export function StatCard({
  label,
  value,
  info,
}: {
  label: string;
  value: number | string;
  info?: string;
}) {
  return (
    <div className="ym-admin-stat">
      <div className="ym-admin-stat-label-row">
        <p className="ym-admin-stat-label">{label}</p>
        {info ? <AdminInfoTip text={info} /> : null}
      </div>
      <p className="ym-admin-stat-value">
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </p>
    </div>
  );
}

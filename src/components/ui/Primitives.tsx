import { AlertCircle, Heart, Scissors, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { serviceLabels } from "../../config/wedding";
import type { AppointmentStatus, ServiceType } from "../../types/database";

export function ServiceIcon({
  type,
  size = 18,
}: {
  type: ServiceType;
  size?: number;
}) {
  return type === "makeup" ? (
    <Sparkles size={size} aria-hidden="true" />
  ) : (
    <Scissors size={size} aria-hidden="true" />
  );
}
export function ServiceLabel({ type }: { type: ServiceType }) {
  return (
    <span className={`service-label ${type}`}>
      <ServiceIcon type={type} size={14} />
      {serviceLabels[type]}
    </span>
  );
}
export function ServiceApprovalNote({ status }: { status: AppointmentStatus }) {
  return status === "pending_confirmation" ? (
    <p className="service-approval-note">ההצטרפות לשירות ממתינה לאישור</p>
  ) : null;
}
export function Notice({
  children,
  kind = "error",
}: {
  children: ReactNode;
  kind?: "error" | "warning" | "success";
}) {
  return (
    <div
      className={`notice ${kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      <AlertCircle size={18} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
export function Wordmark({ small = false }: { small?: boolean }) {
  return (
    <div className={`wordmark ${small ? "small" : ""}`}>
      <span lang="en" dir="ltr">
        Shaked <span className="ampersand">&</span> Eyal
      </span>
      {!small && (
        <span className="wordmark-caption">
          <i /> מתארגנות לחתונה <i />
        </span>
      )}
    </div>
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Heart size={24} strokeWidth={1.3} aria-hidden="true" />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
    </div>
  );
}

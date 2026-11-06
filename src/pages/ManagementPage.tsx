import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Search } from "lucide-react";
import type { Appointment, Participant, Vendor } from "../types/database";
import { statusLabels } from "../config/wedding";
import { AppointmentCard } from "../components/schedule/AppointmentCard";
import { BufferControl } from "../components/booking/BufferControl";
import { EmptyState } from "../components/ui/Primitives";
import { scheduleIssues, sortAppointments } from "../utils/scheduling";
import { hasTimes } from "../utils/time";

interface Props {
  appointments: Appointment[];
  participants: Participant[];
  vendors: Vendor[];
  buffer: number;
  onBuffer: (n: number) => void;
  onEdit: (a: Appointment) => void;
}
export function ManagementPage({
  appointments,
  participants,
  vendors,
  buffer,
  onBuffer,
  onEdit,
}: Props) {
  const [vendor, setVendor] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const issues = useMemo(
    () => scheduleIssues(appointments, buffer),
    [appointments, buffer],
  );
  const metrics = [
    { label: "מתארגנות", count: participants.length },
    { label: "נותנות שירות", count: vendors.length },
    { label: "עם שעה", count: appointments.filter(hasTimes).length },
    {
      label: "ללא שעה",
      count: appointments.filter((a) => !hasTimes(a)).length,
    },
    {
      label: "ממתינים לאישור",
      count: appointments.filter((a) => a.status === "pending_confirmation")
        .length,
    },
    {
      label: "בתכנון",
      count: appointments.filter((a) => a.status === "proposed").length,
    },
    {
      label: "מאושרים",
      count: appointments.filter((a) => a.status === "confirmed").length,
    },
  ];
  const filtered = sortAppointments(
    appointments.filter(
      (a) =>
        (vendor === "all" || a.vendor_id === vendor) &&
        (status === "all" ||
          (status === "missing" ? !hasTimes(a) : a.status === status)) &&
        a.participant.name.includes(search.trim()),
    ),
  );
  return (
    <>
      <div className="page-intro">
        <span className="date-caption">התמונה המלאה, בשביל השקט</span>
        <h1>ניהול ההתארגנות</h1>
        <p>היי איל, מכאן אפשר לתאם את כל הפרטים.</p>
      </div>
      <div className="metrics-grid">
        {metrics.map((metric) => (
          <div key={metric.label} className="metric">
            <strong>{metric.count}</strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </div>
      <section className="management-issues">
        <h2>
          {issues.length ? (
            <AlertTriangle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          {issues.length
            ? `${issues.length} שיבוצים דורשים תשומת לב`
            : "אין התנגשויות בתכנון הנוכחי"}
        </h2>
        {issues.map(({ appointment, messages }) => (
          <button
            key={appointment.id}
            className="issue-row"
            onClick={() => onEdit(appointment)}
          >
            <strong>
              {appointment.participant.name} · {appointment.vendor.name}
            </strong>
            <span>{messages.join(" ")}</span>
          </button>
        ))}
      </section>
      <details className="planning-details">
        <summary>הנחות תכנון · המרווח של שקד</summary>
        <BufferControl buffer={buffer} onChange={onBuffer} />
      </details>
      <section>
        <div className="section-title">
          <h2>כל השיבוצים</h2>
          <span>{filtered.length} שיבוצים</span>
        </div>
        <div className="management-filters">
          <label className="search-field">
            <Search size={17} />
            <input
              aria-label="חיפוש מתארגנת"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש מתארגנת…"
            />
          </label>
          <label>
            נותנת שירות
            <select value={vendor} onChange={(e) => setVendor(e.target.value)}>
              <option value="all">כל נותנות השירות</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            מצב השיבוץ
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">כל השיבוצים</option>
              <option value="missing">ללא שעה</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="appointment-grid">
          {filtered.map((a) => (
            <AppointmentCard
              key={a.id}
              appointment={a}
              onEdit={onEdit}
              showVendor
            />
          ))}
        </div>
        {!filtered.length && (
          <EmptyState title="לא נמצאו שיבוצים לתצוגה">
            נסי לשנות את הסינון.
          </EmptyState>
        )}
      </section>
      <p className="identity-note">
        תצוגת הניהול פתוחה לבחירה, ללא אימות זהות או הרשאות תפקיד.
      </p>
    </>
  );
}

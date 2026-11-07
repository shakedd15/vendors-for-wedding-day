import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Search } from "lucide-react";
import type { Appointment, Participant, Vendor } from "../types/database";
import { AppointmentCard } from "../components/schedule/AppointmentCard";
import { EmptyState } from "../components/ui/Primitives";
import { scheduleIssues, sortAppointments } from "../utils/scheduling";
import { hasTimes } from "../utils/time";

interface Props {
  appointments: Appointment[];
  participants: Participant[];
  vendors: Vendor[];
  buffer: number;
  onEdit: (a: Appointment) => void;
}
export function ManagementPage({
  appointments,
  participants,
  vendors,
  buffer,
  onEdit,
}: Props) {
  const [participant, setParticipant] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
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
  ];
  const filtered = sortAppointments(
    appointments.filter(
      (a) =>
        (participant === "all" || a.participant_id === participant) &&
        (timeFilter === "all" ||
          (timeFilter === "missing" ? !hasTimes(a) : hasTimes(a))) &&
        a.participant.name.includes(search.trim()),
    ),
  );
  return (
    <>
      <div className="page-intro">
        <span className="date-caption">התמונה המלאה, בשביל השקט</span>
        <h1>ניהול ההתארגנות</h1>
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
            מתארגנת
            <select
              value={participant}
              onChange={(e) => setParticipant(e.target.value)}
            >
              <option value="all">כל המתארגנות</option>
              {[...participants]
                .sort((a, b) => a.name.localeCompare(b.name, "he"))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            הצגת שיבוצים
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
              <option value="all">כל השיבוצים</option>
              <option value="missing">ללא שעה</option>
              <option value="scheduled">עם שעה</option>
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
    </>
  );
}

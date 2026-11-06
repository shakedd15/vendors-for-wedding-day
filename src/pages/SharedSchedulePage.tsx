import { useState } from "react";
import { Camera, Clock3, Users } from "lucide-react";
import type { Appointment, Participant, Vendor } from "../types/database";
import { photography, serviceLabels } from "../config/wedding";
import { BrideDeadline, Photography } from "../components/schedule/Photography";
import {
  EmptyState,
  ServiceIcon,
  StatusBadge,
} from "../components/ui/Primitives";
import { displayTime, hasTimes, toMinutes } from "../utils/time";
import { sortAppointments } from "../utils/scheduling";

interface Props {
  appointments: Appointment[];
  participants: Participant[];
  vendors: Vendor[];
  selectedVendor?: string;
  onEdit: (a: Appointment) => void;
  manager: boolean;
}
export function SharedSchedulePage({
  appointments,
  participants,
  vendors,
  selectedVendor,
  onEdit,
  manager,
}: Props) {
  const [view, setView] = useState<"participants" | "time">("participants");
  const [filter, setFilter] = useState("all");
  const filtered = appointments.filter(
    (a) => filter === "all" || a.vendor_id === filter,
  );
  const canEdit = (a: Appointment) => manager || a.vendor_id === selectedVendor;
  const timeline = [
    ...sortAppointments(filtered.filter(hasTimes)).map((a) => ({
      key: a.id,
      time: a.start_time!,
      appointment: a,
      event: null,
      boundary: null,
    })),
    ...photography.map((event) => ({
      key: `photo-${event.id}`,
      time: event.start,
      appointment: null,
      event,
      boundary: null,
    })),
    {
      key: "day-start",
      time: "09:00",
      appointment: null,
      event: null,
      boundary: "מתחילות להתארגן",
    },
    {
      key: "day-end",
      time: "18:00",
      appointment: null,
      event: null,
      boundary: "סיום ההתארגנות",
    },
  ].sort(
    (a, b) =>
      toMinutes(a.time)! - toMinutes(b.time)! || a.key.localeCompare(b.key),
  );
  return (
    <>
      <div className="page-intro">
        <span className="date-caption">כל אחת והזמן שלה</span>
        <h1>מתארגנות ביחד</h1>
        <p>כל השיבוצים והרגעים החשובים, במקום אחד.</p>
      </div>
      <BrideDeadline />
      <div className="segmented" aria-label="תצוגת הלו״ז">
        <button
          aria-pressed={view === "participants"}
          className={view === "participants" ? "active" : ""}
          onClick={() => setView("participants")}
        >
          <Users size={17} />
          לפי מתארגנת
        </button>
        <button
          aria-pressed={view === "time"}
          className={view === "time" ? "active" : ""}
          onClick={() => setView("time")}
        >
          <Clock3 size={17} />
          לפי שעות
        </button>
      </div>
      <label className="filter-label" htmlFor="shared-vendor">
        נותנות שירות
        <select
          id="shared-vendor"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">כולן יחד</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </label>
      {view === "participants" ? (
        <div className="participant-list">
          {[...participants]
            .sort(
              (a, b) =>
                Number(b.name === "שקד") - Number(a.name === "שקד") ||
                (toMinutes(a.arrival_time) ?? 0) -
                  (toMinutes(b.arrival_time) ?? 0) ||
                a.name.localeCompare(b.name, "he"),
            )
            .filter(
              (p) =>
                filter === "all" ||
                filtered.some((a) => a.participant_id === p.id),
            )
            .map((p) => (
              <article className="participant-card" key={p.id}>
                <div className="participant-heading">
                  <h2>
                    {p.name}
                    {p.name === "שקד" && (
                      <span className="bride-tag">הכלה</span>
                    )}
                  </h2>
                  <span>
                    {p.arrival_time ? (
                      <>
                        הגעה <bdi>{displayTime(p.arrival_time)}</bdi>
                      </>
                    ) : (
                      "כאן מהבוקר"
                    )}
                  </span>
                </div>
                {p.ready_by && (
                  <p className="participant-ready">
                    מוכנה עד <bdi>{displayTime(p.ready_by)}</bdi>
                  </p>
                )}
                <div className="participant-services">
                  {(["makeup", "hair"] as const).map((type) => {
                    const a = appointments.find(
                      (a) =>
                        a.participant_id === p.id && a.service_type === type,
                    );
                    return (
                      <div
                        className={`participant-service ${type} ${a?.vendor_id === selectedVendor ? "selected-service" : ""}`}
                        key={type}
                      >
                        <div className="service-row">
                          <ServiceIcon type={type} size={16} />
                          <strong>{serviceLabels[type]}</strong>
                        </div>
                        {a ? (
                          <>
                            <p>{a.vendor.name}</p>
                            <span className="service-time">
                              {hasTimes(a) ? (
                                <bdi>
                                  {displayTime(a.start_time)}–
                                  {displayTime(a.end_time)}
                                </bdi>
                              ) : (
                                "טרם שובצה שעה"
                              )}
                            </span>
                            <StatusBadge status={a.status} />
                            {canEdit(a) && (
                              <button
                                className="text-button"
                                onClick={() => onEdit(a)}
                                aria-label={`עריכת ${serviceLabels[type]} עבור ${p.name}`}
                              >
                                {hasTimes(a) ? "עריכת שעה" : "קביעת שעה"}
                              </button>
                            )}
                          </>
                        ) : (
                          <p className="not-required">לא נדרש</p>
                        )}
                      </div>
                    );
                  })}
                </div>
                {p.name === "שלומית" && (
                  <p className="special-note">מסתפרת לפני ההגעה · איפור בלבד</p>
                )}
                {p.name === "עדי" &&
                  appointments.some(
                    (a) =>
                      a.participant_id === p.id &&
                      a.status === "pending_confirmation",
                  ) && (
                    <p className="special-note">
                      הצטרפות לשיער אצל חן — עדיין ממתינה לאישור
                    </p>
                  )}
              </article>
            ))}
        </div>
      ) : (
        <section className="agenda">
          {timeline.map((item) => {
            if (item.boundary)
              return (
                <div className="agenda-boundary" key={item.key}>
                  <span>{item.time}</span>
                  <span>{item.boundary}</span>
                </div>
              );
            const a = item.appointment;
            return (
              <div
                key={item.key}
                className={`agenda-item ${item.event ? "photo" : a?.service_type} ${a?.vendor_id === selectedVendor ? "my-agenda" : ""}`}
              >
                <div className="agenda-clock">
                  <bdi>{displayTime(item.time)}</bdi>
                  <span className="agenda-dot" />
                </div>
                <div className="agenda-block">
                  {a ? (
                    <>
                      <div className="agenda-title">
                        <h3>{a.participant.name}</h3>
                        <StatusBadge status={a.status} />
                      </div>
                      <p>
                        <ServiceIcon type={a.service_type} size={14} />
                        {serviceLabels[a.service_type]} · {a.vendor.name}
                      </p>
                      <p>
                        עד <bdi>{displayTime(a.end_time)}</bdi>
                        {a.vendor_id === selectedVendor && (
                          <span className="my-label">השיבוץ שלי</span>
                        )}
                      </p>
                      {canEdit(a) && (
                        <button
                          className="text-button"
                          onClick={() => onEdit(a)}
                          aria-label={`עריכת שעה עבור ${a.participant.name}`}
                        >
                          עריכת שעה
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <h3>
                        <Camera size={16} />
                        {item.event!.title}
                      </h3>
                      <p>
                        {item.event!.end ? (
                          <>
                            עד <bdi>{item.event!.end}</bdi> ·{" "}
                          </>
                        ) : (
                          ""
                        )}
                        אירוע קבוע
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.some((a) => !hasTimes(a)) && (
            <div className="agenda-unscheduled">
              <h3>עוד מחכות לשעה</h3>
              {sortAppointments(filtered.filter((a) => !hasTimes(a))).map(
                (a) => (
                  <div key={a.id}>
                    <span>
                      {a.participant.name} · {serviceLabels[a.service_type]}
                    </span>
                    <StatusBadge status={a.status} />
                    {canEdit(a) && (
                      <button className="text-button" onClick={() => onEdit(a)}>
                        קביעת שעה
                      </button>
                    )}
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      )}
      {!participants.length && <EmptyState title="רשימת המתארגנות ריקה" />}
      {view === "participants" && <Photography />}
    </>
  );
}

import { lazy, Suspense, useState } from "react";
import { Camera, Clock3, Table2, Users } from "lucide-react";
import type { Appointment, Participant, Vendor } from "../types/database";
import {
  serviceLabels,
  wedding,
  type PhotographyEvent,
} from "../config/wedding";
import { Photography } from "../components/schedule/Photography";
import {
  EmptyState,
  ServiceIcon,
  ServiceApprovalNote,
  Notice,
} from "../components/ui/Primitives";
import { displayTime, hasTimes, toMinutes } from "../utils/time";
import { sortAppointments } from "../utils/scheduling";

const WeddingEventSheet = lazy(() =>
  import("../components/schedule/WeddingEventSheet").then((module) => ({
    default: module.WeddingEventSheet,
  })),
);
const ScheduleTable = lazy(() =>
  import("../components/schedule/ScheduleTable").then((module) => ({
    default: module.ScheduleTable,
  })),
);

interface Props {
  appointments: Appointment[];
  participants: Participant[];
  vendors: Vendor[];
  selectedVendor?: string;
  onEdit: (a: Appointment) => void;
  manager: boolean;
  events: PhotographyEvent[];
  eventsAvailable: boolean;
  eventsError: string | null;
  onEventSaved: (event: PhotographyEvent) => void;
}
export function SharedSchedulePage({
  appointments,
  participants,
  vendors,
  selectedVendor,
  onEdit,
  manager,
  events,
  eventsAvailable,
  eventsError,
  onEventSaved,
}: Props) {
  const [view, setView] = useState<"participants" | "time" | "table">(
    "participants",
  );
  const [filter, setFilter] = useState("all");
  const [editingEvent, setEditingEvent] = useState<
    PhotographyEvent | null | undefined
  >(undefined);
  const editEvent = (event: PhotographyEvent | null) => {
    if (manager && eventsAvailable) setEditingEvent(event);
  };
  const filtered = appointments.filter(
    (a) => filter === "all" || a.participant_id === filter,
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
    ...events.map((event) => ({
      key: `photo-${event.id}`,
      time: event.start,
      appointment: null,
      event,
      boundary: null,
    })),
    {
      key: "day-start",
      time: wedding.start,
      appointment: null,
      event: null,
      boundary: "מתחילות להתארגן",
    },
    {
      key: "day-end",
      time: wedding.end,
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
        {manager && (
          <button
            aria-pressed={view === "table"}
            className={view === "table" ? "active" : ""}
            onClick={() => setView("table")}
          >
            <Table2 size={17} aria-hidden="true" />
            טבלה
          </button>
        )}
      </div>
      <label className="filter-label" htmlFor="shared-participant">
        מתארגנת
        <select
          id="shared-participant"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
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
            .filter((p) => filter === "all" || p.id === filter)
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
                            <ServiceApprovalNote status={a.status} />
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
              </article>
            ))}
        </div>
      ) : view === "table" && manager ? (
        <Suspense fallback={<p role="status">טוענות את הטבלה…</p>}>
          <ScheduleTable
            vendors={vendors}
            appointments={filtered}
            onEdit={onEdit}
          />
        </Suspense>
      ) : (
        <section className="agenda">
          {manager && (
            <button
              className="text-button"
              disabled={!eventsAvailable}
              onClick={() => editEvent(null)}
            >
              הוספת אירוע
            </button>
          )}
          {eventsError && <Notice>{eventsError}</Notice>}
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
                      <ServiceApprovalNote status={a.status} />
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
                            עד <bdi>{displayTime(item.event!.end)}</bdi> ·{" "}
                          </>
                        ) : (
                          ""
                        )}
                        אירוע בלו״ז
                      </p>
                      {manager && eventsAvailable && (
                        <button
                          className="text-button"
                          onClick={() => editEvent(item.event!)}
                          aria-label={`עריכת אירוע ${item.event!.title}`}
                        >
                          עריכה
                        </button>
                      )}
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
                    <ServiceApprovalNote status={a.status} />
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
      {(view === "participants" || view === "table") && (
        <Photography
          events={events}
          manager={manager}
          available={eventsAvailable}
          error={eventsError}
          onEdit={editEvent}
          onAdd={() => editEvent(null)}
        />
      )}
      {editingEvent !== undefined && (
        <Suspense fallback={<p role="status">פותחות את האירוע…</p>}>
          <WeddingEventSheet
            key={editingEvent?.id ?? "new-event"}
            event={editingEvent}
            onClose={() => setEditingEvent(undefined)}
            onSaved={(event) => {
              onEventSaved(event);
              setEditingEvent(undefined);
            }}
          />
        </Suspense>
      )}
    </>
  );
}

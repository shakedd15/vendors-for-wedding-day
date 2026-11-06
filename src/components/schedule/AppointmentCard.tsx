import { ArrowLeft, Clock3, MapPin } from "lucide-react";
import type { Appointment } from "../../types/database";
import { displayTime, hasTimes } from "../../utils/time";
import { ServiceLabel, StatusBadge } from "../ui/Primitives";

export function AppointmentCard({
  appointment: a,
  onEdit,
  showVendor = false,
}: {
  appointment: Appointment;
  onEdit?: (a: Appointment) => void;
  showVendor?: boolean;
}) {
  const timed = hasTimes(a);
  return (
    <article className={`appointment-card ${a.service_type}`}>
      <div className="card-top">
        <ServiceLabel type={a.service_type} />
        <StatusBadge status={a.status} />
      </div>
      <div className="appointment-person">
        <h3>
          {a.participant.name}
          {a.participant.name === "שקד" && (
            <span className="bride-tag">הכלה</span>
          )}
        </h3>
        {showVendor && <p>{a.vendor.name}</p>}
      </div>
      <div className="card-detail">
        <MapPin size={14} aria-hidden="true" />
        <span>
          {a.participant.arrival_time ? (
            <>
              הגעה: <bdi>{displayTime(a.participant.arrival_time)}</bdi>
            </>
          ) : (
            "כאן מהבוקר"
          )}
        </span>
        {a.participant.ready_by && (
          <span className="deadline-detail">
            מוכנה עד <bdi>{displayTime(a.participant.ready_by)}</bdi>
          </span>
        )}
      </div>
      <div className={`appointment-time ${timed ? "" : "not-set"}`}>
        <Clock3 size={18} aria-hidden="true" />
        {timed ? (
          <bdi>
            {displayTime(a.start_time)}–{displayTime(a.end_time)}
          </bdi>
        ) : (
          <span>
            {a.start_time || a.end_time
              ? "שעות לא מלאות · נדרש עדכון"
              : "טרם שובצה שעה"}
          </span>
        )}
      </div>
      {onEdit && (
        <button
          className={`card-action ${timed ? "quiet" : ""}`}
          onClick={() => onEdit(a)}
          aria-label={`${timed ? "עריכת שעה" : "קביעת שעה"} עבור ${a.participant.name}`}
        >
          <span>{timed ? "עריכת שעה" : "קביעת שעה"}</span>
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
      )}
    </article>
  );
}

import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, ArrowRight, RotateCw, Smartphone } from "lucide-react";
import type { Appointment, Vendor } from "../../types/database";
import {
  appointmentsInHour,
  scheduleTableHours,
} from "../../utils/scheduleTable";
import { displayTime, fromMinutes, hasTimes } from "../../utils/time";
import { sortAppointments } from "../../utils/scheduling";
import { EmptyState, ServiceApprovalNote } from "../ui/Primitives";

export function ScheduleTable({
  vendors,
  appointments,
  onEdit,
}: {
  vendors: Vendor[];
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
}) {
  const [wideOpen, setWideOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const columns = [...vendors].sort(
    (a, b) =>
      Number(a.service_type === "hair") - Number(b.service_type === "hair") ||
      a.name.localeCompare(b.name, "he"),
  );
  useEffect(() => {
    if (!wideOpen || !columns.length) return;
    const element = dialog.current;
    element?.showModal();
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = before;
    };
  }, [wideOpen, columns.length]);
  const rows = scheduleTableHours(appointments);
  const unscheduled = sortAppointments(
    appointments.filter((a) => !hasTimes(a)),
  );
  function editAppointment(appointment: Appointment) {
    setWideOpen(false);
    onEdit(appointment);
  }
  function contents(items: Appointment[]) {
    if (!items.length)
      return (
        <span className="empty-slot" aria-label="אין שיבוץ">
          —
        </span>
      );
    return items.map((a) => (
      <div className="table-booking" key={a.id}>
        <button
          className="table-booking-button"
          onClick={() => editAppointment(a)}
          aria-label={`עריכת שיבוץ של ${a.participant.name} אצל ${a.vendor.name}`}
        >
          <strong>{a.participant.name}</strong>
          {hasTimes(a) ? (
            <bdi dir="ltr">
              {displayTime(a.start_time)}–{displayTime(a.end_time)}
            </bdi>
          ) : a.start_time || a.end_time ? (
            <span>נדרש עדכון שעות</span>
          ) : null}
        </button>
        <ServiceApprovalNote status={a.status} />
      </div>
    ));
  }
  function tableGrid() {
    return (
      <div
        className="schedule-table-scroll"
        role="region"
        aria-label="טבלת הלו״ז"
        tabIndex={0}
      >
        <table className="schedule-table" aria-label="לו״ז לפי שעות וספקיות">
          <thead>
            <tr>
              <th scope="col" className="table-time-column">
                שעה
              </th>
              {columns.map((vendor) => {
                const service =
                  vendor.service_type === "hair" ? "שיער" : "איפור";
                return (
                  <th
                    scope="col"
                    key={vendor.id}
                    className={vendor.service_type}
                    aria-label={`${vendor.name} (${service})`}
                  >
                    <span>{vendor.name}</span>
                    <span className="table-service-type">({service})</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.start}>
                <th scope="row" className="table-time-column">
                  <bdi dir="ltr">
                    {fromMinutes(row.start)}–{fromMinutes(row.end)}
                  </bdi>
                </th>
                {columns.map((vendor) => (
                  <td key={vendor.id}>
                    {contents(appointmentsInHour(appointments, vendor.id, row))}
                  </td>
                ))}
              </tr>
            ))}
            {unscheduled.length > 0 && (
              <tr className="table-unscheduled-row">
                <th scope="row" className="table-time-column">
                  ללא שעה
                </th>
                {columns.map((vendor) => (
                  <td key={vendor.id}>
                    {contents(
                      unscheduled.filter((a) => a.vendor_id === vendor.id),
                    )}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
  if (!columns.length) return <EmptyState title="לא נמצאו ספקיות לתצוגה" />;
  return (
    <section className="schedule-table-view">
      <div className="table-view-tools">
        <p className="table-scroll-hint">
          <ArrowLeftRight size={15} aria-hidden="true" />
          גללי לצדדים לצפייה בכל הספקיות
        </p>
        <button
          type="button"
          className="button secondary landscape-button"
          onClick={() => setWideOpen(true)}
        >
          <RotateCw size={17} aria-hidden="true" />
          צפייה לרוחב
        </button>
      </div>
      {tableGrid()}
      {wideOpen && (
        <dialog
          ref={dialog}
          className="wide-table-dialog"
          aria-labelledby="wide-table-title"
          onCancel={(event) => {
            event.preventDefault();
            setWideOpen(false);
          }}
        >
          <div className="wide-table-toolbar">
            <h2 id="wide-table-title">תצוגת טבלה לרוחב</h2>
            <button
              type="button"
              className="back-button"
              onClick={() => setWideOpen(false)}
            >
              <ArrowRight size={20} aria-hidden="true" />
              חזרה
            </button>
          </div>
          <div className="wide-table-rotate">
            <Smartphone size={44} aria-hidden="true" />
            <h3>סובבי את הטלפון לרוחב</h3>
            <p>כל הספקיות יוצגו יחד על המסך.</p>
            <p className="field-help">
              אם המסך לא מסתובב, כבי את נעילת הסיבוב בטלפון.
            </p>
          </div>
          <div className="wide-table-content">{tableGrid()}</div>
        </dialog>
      )}
    </section>
  );
}

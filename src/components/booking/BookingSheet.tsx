import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3, LoaderCircle, MapPin, Trash2, X } from "lucide-react";
import type { Appointment, AppointmentStatus } from "../../types/database";
import type { BookingDraft } from "../../types/scheduling";
import { serviceLabels, statusLabels } from "../../config/wedding";
import { availableSlots, validateBooking } from "../../utils/scheduling";
import { displayTime, fromMinutes, toMinutes } from "../../utils/time";
import { updateAppointmentTimes } from "../../services/appointmentService";
import { Notice, ServiceLabel } from "../ui/Primitives";
import { BufferControl } from "./BufferControl";

interface Props {
  appointment: Appointment;
  all: Appointment[];
  manager: boolean;
  buffer: number;
  onBuffer: (n: number) => void;
  onClose: () => void;
  onSaved: (appointment: Appointment) => void;
}
export function BookingSheet({
  appointment: a,
  all,
  manager,
  buffer,
  onBuffer,
  onClose,
  onSaved,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const initialStart = toMinutes(a.start_time),
    initialEnd = toMinutes(a.end_time);
  const [duration, setDuration] = useState(
    initialStart !== null && initialEnd !== null && initialEnd > initialStart
      ? String(initialEnd - initialStart)
      : "",
  );
  const [start, setStart] = useState(a.start_time?.slice(0, 5) || "");
  const [status, setStatus] = useState<AppointmentStatus>(
    a.status === "unscheduled" ? "proposed" : a.status,
  );
  const [approved, setApproved] = useState(false);
  const [outside, setOutside] = useState(
    Boolean(
      initialStart !== null && (initialStart < 540 || (initialEnd ?? 0) > 1080),
    ),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const slots = useMemo(
    () => availableSlots(a, all, Number(duration), buffer),
    [a, all, duration, buffer],
  );
  const visibleSlots = slots.filter(
    (time) =>
      outside ||
      (toMinutes(time)! >= 540 && toMinutes(time)! + Number(duration) <= 1080),
  );
  const startMinutes = toMinutes(start);
  const endMinutes =
    startMinutes === null || !duration ? null : startMinutes + Number(duration);
  const end =
    endMinutes !== null && endMinutes < 1440 ? fromMinutes(endMinutes) : null;
  const effectiveStatus =
    a.status === "pending_confirmation" && !approved
      ? "pending_confirmation"
      : status;
  const draft: BookingDraft = {
    start_time: start || null,
    end_time: end,
    status: effectiveStatus,
  };
  const validation = validateBooking(
    a,
    draft,
    all,
    buffer,
    manager && approved,
  );
  const timeValid =
    !!duration &&
    visibleSlots.includes(start) &&
    validation.errors.length === 0;
  const approvalOnly =
    manager && approved && !start && !duration && status === "unscheduled";
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = before;
    };
  }, []);
  async function save(clear = false) {
    if (saving) return;
    setSaving(true);
    setError(null);
    const payload: BookingDraft = clear
      ? {
          start_time: null,
          end_time: null,
          status:
            a.status === "pending_confirmation"
              ? "pending_confirmation"
              : "unscheduled",
        }
      : draft;
    try {
      const updated = await updateAppointmentTimes(
        a,
        payload,
        buffer,
        !clear && manager && approved,
      );
      onSaved(updated);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "לא הצלחנו לשמור את השיבוץ. נסי שוב.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="booking-dialog"
      aria-labelledby="booking-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!saving) onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="sheet-content">
        <div className="sheet-handle" />
        <div className="sheet-heading">
          <div>
            <ServiceLabel type={a.service_type} />
            <h2 id="booking-title">
              {a.participant.name}, זמן ל{serviceLabels[a.service_type]}
            </h2>
            <p>עם {a.vendor.name}</p>
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="סגירת חלון השיבוץ"
            onClick={onClose}
            disabled={saving}
          >
            <X size={21} />
          </button>
        </div>
        <div className="booking-meta">
          <span>
            <MapPin size={15} />
            {a.participant.arrival_time ? (
              <>
                הגעה <bdi>{displayTime(a.participant.arrival_time)}</bdi>
              </>
            ) : (
              "כאן מהבוקר"
            )}
          </span>
          {a.participant.ready_by && (
            <span>
              מוכנה עד <bdi>{displayTime(a.participant.ready_by)}</bdi>
            </span>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (timeValid || approvalOnly) void save();
          }}
        >
          <fieldset disabled={saving}>
            {a.status === "pending_confirmation" && (
              <div className="pending-panel">
                <strong>השירות עדיין ממתין לאישור</strong>
                <p>אפשר לתכנן שעה; השיבוץ יישאר ממתין לאישור.</p>
                {manager && (
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={approved}
                      onChange={(e) => {
                        setApproved(e.target.checked);
                        setStatus(
                          e.target.checked
                            ? a.start_time
                              ? "proposed"
                              : "unscheduled"
                            : "pending_confirmation",
                        );
                      }}
                    />
                    אני מאשר/ת את הצטרפותה לשירות
                  </label>
                )}
              </div>
            )}
            <div className="booking-fields">
              <label htmlFor="booking-duration">
                משך הטיפול <span className="required-note">לבחירתך</span>
                <input
                  id="booking-duration"
                  type="number"
                  inputMode="numeric"
                  min="15"
                  max="1425"
                  step="15"
                  placeholder="כמה דקות?"
                  value={duration}
                  onChange={(e) => {
                    setDuration(e.target.value);
                    setError(null);
                  }}
                />
              </label>
              <label htmlFor="booking-start">
                שעת התחלה
                <select
                  id="booking-start"
                  value={visibleSlots.includes(start) ? start : ""}
                  onChange={(e) => {
                    setStart(e.target.value);
                    setError(null);
                  }}
                  disabled={!duration || !visibleSlots.length}
                >
                  <option value="">
                    {duration ? "בחרי שעה פנויה" : "בחרי קודם משך"}
                  </option>
                  {visibleSlots.map((time) => (
                    <option value={time} key={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="field-help">
              משך ושעות בקפיצות של 15 דקות. מוצגות שעות פנויות בלבד.
            </p>
            <label className="checkbox-label outside-toggle">
              <input
                type="checkbox"
                checked={outside}
                onChange={(e) => setOutside(e.target.checked)}
              />
              הצגת שעות גם מחוץ ל־09:00–18:00
            </label>
            {!!duration && !visibleSlots.length && (
              <Notice kind="warning">
                לא נמצא זמן פנוי למשך שנבחר. נסי משך אחר או בדקי את הלו״ז
                המשותף.
              </Notice>
            )}
            {!!start && !!duration && !visibleSlots.includes(start) && (
              <Notice kind="warning">
                השעה שנבחרה אינה פנויה לפי התכנון הנוכחי. בחרי שעה אחרת.
              </Notice>
            )}
            <div className="calculated-end">
              <Clock3 size={19} aria-hidden="true" />
              <span>שעת סיום</span>
              <strong dir="ltr">{end || "—"}</strong>
            </div>
            <label className="status-select" htmlFor="booking-status">
              סטטוס השיבוץ
              <select
                id="booking-status"
                value={effectiveStatus}
                disabled={a.status === "pending_confirmation" && !approved}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
              >
                {(
                  [
                    "proposed",
                    "confirmed",
                    "pending_confirmation",
                    ...(approved && !start ? ["unscheduled" as const] : []),
                  ] as AppointmentStatus[]
                ).map((s) => (
                  <option key={s} value={s}>
                    {statusLabels[s]}
                  </option>
                ))}
              </select>
            </label>
            <p className="field-help">
              ״בתכנון״ שומר את השעה פנויה עבורך, עד לאישור סופי.
            </p>
            {a.participant.name === "שקד" && (
              <BufferControl buffer={buffer} onChange={onBuffer} />
            )}
            {!!start &&
              !!duration &&
              validation.errors.map((message) => (
                <Notice key={message}>{message}</Notice>
              ))}
            {validation.warnings.map((message) => (
              <Notice key={message} kind="warning">
                {message}
              </Notice>
            ))}
            {error && <Notice>{error}</Notice>}
            <button
              type="submit"
              className="button primary full-width"
              disabled={saving || (!timeValid && !approvalOnly)}
            >
              {saving ? (
                <>
                  <LoaderCircle size={18} className="spin" />
                  שומרות…
                </>
              ) : approvalOnly ? (
                "אישור השירות"
              ) : (
                "שמירת השיבוץ"
              )}
            </button>
            {(a.start_time || a.end_time) &&
              (confirmClear ? (
                <div className="clear-confirm">
                  <p>להסיר את השעה? השירות יישאר ברשימה.</p>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => void save(true)}
                  >
                    כן, הסרת שעה
                  </button>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => setConfirmClear(false)}
                  >
                    ביטול
                  </button>
                </div>
              ) : (
                <button
                  className="clear-button"
                  type="button"
                  onClick={() => setConfirmClear(true)}
                >
                  <Trash2 size={15} />
                  הסרת השעה שנקבעה
                </button>
              ))}
          </fieldset>
        </form>
      </div>
    </dialog>
  );
}

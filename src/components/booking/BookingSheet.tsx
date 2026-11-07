import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3, LoaderCircle, MapPin, Trash2, X } from "lucide-react";
import type { Appointment } from "../../types/database";
import type { BookingDraft } from "../../types/scheduling";
import { serviceLabels, wedding } from "../../config/wedding";
import {
  availableSlots,
  buildBookingDraft,
  validateBooking,
} from "../../utils/scheduling";
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
  const [approved, setApproved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const visibleSlots = useMemo(
    () => availableSlots(a, all, Number(duration), buffer),
    [a, all, duration, buffer],
  );
  const startMinutes = toMinutes(start);
  const endMinutes =
    startMinutes === null || !duration ? null : startMinutes + Number(duration);
  const end =
    endMinutes !== null && endMinutes < 1440 ? fromMinutes(endMinutes) : null;
  const draft = buildBookingDraft(a, start || null, end, manager && approved);
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
  const approvalOnly = manager && approved && !start && !duration;
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
      ? buildBookingDraft(a, null, null)
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
                <strong>ההצטרפות לשירות עדיין ממתינה לאישור</strong>
                <p>אפשר לקבוע שעה גם לפני אישור ההצטרפות.</p>
                {manager && (
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={approved}
                      onChange={(e) => setApproved(e.target.checked)}
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
                  min={wedding.slotMinutes}
                  max={24 * 60 - wedding.slotMinutes}
                  step={wedding.slotMinutes}
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
              משך ושעות בקפיצות של {wedding.slotMinutes} דקות. מוצגות שעות
              פנויות בלבד.
            </p>
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

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, X } from "lucide-react";
import { wedding, type PhotographyEvent } from "../../config/wedding";
import { saveWeddingEvent } from "../../services/weddingEventService";
import { validateWeddingEvent } from "../../utils/weddingEvents";
import { Notice } from "../ui/Primitives";

export function WeddingEventSheet({
  event,
  onClose,
  onSaved,
}: {
  event: PhotographyEvent | null;
  onClose: () => void;
  onSaved: (event: PhotographyEvent) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState(event?.title ?? "");
  const [start, setStart] = useState(event?.start.slice(0, 5) ?? "");
  const [end, setEnd] = useState(event?.end?.slice(0, 5) ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draft = { title, start_time: start, end_time: end || null };
  const errors = validateWeddingEvent(draft);
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
  async function save() {
    if (saving || errors.length) return;
    setSaving(true);
    setError(null);
    try {
      onSaved(await saveWeddingEvent(event, draft));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "לא הצלחנו לשמור את האירוע.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="booking-dialog"
      aria-labelledby="event-sheet-title"
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
          <h2 id="event-sheet-title">
            {event ? "עריכת אירוע" : "הוספת אירוע"}
          </h2>
          <button
            type="button"
            className="icon-button"
            aria-label="סגירת חלון האירוע"
            onClick={onClose}
            disabled={saving}
          >
            <X size={21} />
          </button>
        </div>
        <form
          className="event-form"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <fieldset disabled={saving}>
            <label htmlFor="event-title">
              שם האירוע
              <input
                id="event-title"
                value={title}
                required
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label htmlFor="event-start">
              שעת התחלה של האירוע
              <input
                id="event-start"
                type="time"
                step={wedding.slotMinutes * 60}
                value={start}
                required
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label htmlFor="event-end">
              שעת סיום של האירוע
              <input
                id="event-end"
                type="time"
                aria-describedby="event-end-help"
                step={wedding.slotMinutes * 60}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
            <p id="event-end-help" className="field-help">
              לא חובה
            </p>
            {start &&
              errors.map((message) => <Notice key={message}>{message}</Notice>)}
            {error && <Notice>{error}</Notice>}
            <button
              type="submit"
              className="button primary full-width"
              disabled={saving || errors.length > 0}
            >
              {saving ? (
                <>
                  <LoaderCircle className="spin" size={16} />
                  שומרת…
                </>
              ) : (
                "שמירת האירוע"
              )}
            </button>
            <button
              type="button"
              className="button secondary full-width"
              onClick={onClose}
            >
              חזרה
            </button>
          </fieldset>
        </form>
      </div>
    </dialog>
  );
}

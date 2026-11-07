import { Camera, Plus } from "lucide-react";
import type { PhotographyEvent } from "../../config/wedding";
import { displayTime } from "../../utils/time";
import { Notice } from "../ui/Primitives";

export function Photography({
  events,
  manager,
  available,
  error,
  onEdit,
  onAdd,
}: {
  events: PhotographyEvent[];
  manager: boolean;
  available: boolean;
  error: string | null;
  onEdit: (event: PhotographyEvent) => void;
  onAdd: () => void;
}) {
  return (
    <section className="photography">
      <div className="section-title">
        <h2>
          <Camera size={19} aria-hidden="true" />
          רגעים ששומרים
        </h2>
        {manager && (
          <button
            type="button"
            className="text-button"
            disabled={!available}
            onClick={onAdd}
          >
            <Plus size={15} aria-hidden="true" />
            הוספת אירוע
          </button>
        )}
      </div>
      <div className="photo-events">
        {events.map((event) => (
          <div className="photo-event" key={event.id}>
            <span className="photo-dot" />
            <bdi>
              {displayTime(event.start)}
              {event.end && `–${displayTime(event.end)}`}
            </bdi>
            <span>{event.title}</span>
            {manager && available && (
              <button
                className="text-button"
                onClick={() => onEdit(event)}
                aria-label={`עריכת אירוע ${event.title}`}
              >
                עריכה
              </button>
            )}
          </div>
        ))}
      </div>
      {!events.length && <p className="field-help">עוד לא נוספו אירועים.</p>}
      {manager && !available && (
        <p className="field-help">עריכת האירועים עדיין אינה זמינה.</p>
      )}
      {error && <Notice>{error}</Notice>}
    </section>
  );
}

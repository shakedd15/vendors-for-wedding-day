import { Camera, Heart, LockKeyhole } from "lucide-react";
import { photography } from "../../config/wedding";

export function BrideDeadline() {
  return (
    <aside className="bride-deadline">
      <span className="deadline-icon">
        <Heart size={20} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <div>
        <strong>הרגע של שקד</strong>
        <p>
          מוכנה ומתרגשת עד <bdi>14:15</bdi>
        </p>
      </div>
      <span className="deadline-time" dir="ltr">
        14:15
      </span>
    </aside>
  );
}
export function Photography() {
  return (
    <section className="photography">
      <div className="section-title">
        <h2>
          <Camera size={19} aria-hidden="true" />
          רגעים ששומרים
        </h2>
        <span>
          <LockKeyhole size={12} aria-hidden="true" />
          לו״ז צילומים קבוע
        </span>
      </div>
      <div className="photo-events">
        {photography.map((event) => (
          <div className="photo-event" key={event.id}>
            <span className="photo-dot" />
            <bdi>
              {event.start}
              {event.end && `–${event.end}`}
            </bdi>
            <span>{event.title}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

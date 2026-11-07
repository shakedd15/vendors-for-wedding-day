import { Camera, LockKeyhole } from "lucide-react";
import { photography } from "../../config/wedding";

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

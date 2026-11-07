import { CalendarCheck2, Heart } from "lucide-react";
import type { Appointment, Vendor } from "../types/database";
import { AppointmentCard } from "../components/schedule/AppointmentCard";
import { VendorDetails } from "../components/schedule/VendorDetails";
import { EmptyState, ServiceLabel } from "../components/ui/Primitives";
import { sortAppointments } from "../utils/scheduling";
import { hasTimes } from "../utils/time";

export function MySchedulePage({
  vendor,
  appointments,
  onEdit,
  onVendorSaved,
}: {
  vendor: Vendor;
  appointments: Appointment[];
  onEdit: (a: Appointment) => void;
  onVendorSaved: (vendor: Vendor) => void;
}) {
  const mine = sortAppointments(
    appointments.filter((a) => a.vendor_id === vendor.id),
  );
  const scheduled = mine.filter(hasTimes).length;
  return (
    <>
      <div className="page-intro">
        <span className="date-caption">יום שלישי, 10 בנובמבר 2026</span>
        <h1>
          בוקר טוב, {vendor.name.split(" ")[0]}!{" "}
          <Heart size={22} aria-hidden="true" />
        </h1>
      </div>
      <section>
        <div className="section-title">
          <h2>הלו״ז שלי</h2>
          <ServiceLabel type={vendor.service_type} />
        </div>
        <div className="progress-card">
          <span className="progress-icon">
            <CalendarCheck2 size={21} aria-hidden="true" />
          </span>
          <div>
            <strong>
              {scheduled} מתוך {mine.length} שיבוצים נקבעו
            </strong>
          </div>
          <span className="progress-count" dir="ltr">
            {scheduled}/{mine.length}
          </span>
          <div className="progress-track">
            <span
              style={{
                width: `${mine.length ? (scheduled / mine.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
        <div className="appointment-grid">
          {mine.map((a) => (
            <AppointmentCard key={a.id} appointment={a} onEdit={onEdit} />
          ))}
        </div>
        {!mine.length && (
          <EmptyState title="אין לך שיבוצים כרגע">
            שיבוצים שיוקצו לך יופיעו כאן.
          </EmptyState>
        )}
      </section>
      <VendorDetails key={vendor.id} vendor={vendor} onSaved={onVendorSaved} />
      <p className="gentle-note">
        <Heart size={13} aria-hidden="true" />
        כל שינוי קטן אצלך, עוזר לכולנו לתכנן.
      </p>
    </>
  );
}

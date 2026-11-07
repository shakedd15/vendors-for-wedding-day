import { useState } from "react";
import { ArrowLeft, CalendarDays, Heart, RefreshCw, Users } from "lucide-react";
import type { Vendor } from "../types/database";
import type { Identity } from "../types/scheduling";
import { vendorLabels } from "../config/wedding";
import { familyAccess } from "../config/access";
import { FamilyAccessDialog } from "../components/ui/FamilyAccessDialog";
import {
  EmptyState,
  Notice,
  ServiceIcon,
  Wordmark,
} from "../components/ui/Primitives";

export function WelcomePage({
  vendors,
  loading,
  error,
  configuration,
  refresh,
  onSelect,
}: {
  vendors: Vendor[];
  loading: boolean;
  error: string | null;
  configuration: string | null;
  refresh: () => void;
  onSelect: (identity: Identity) => void;
}) {
  const [familyDialogOpen, setFamilyDialogOpen] = useState(false);
  return (
    <div className="welcome-page">
      <main className="welcome-content">
        <div className="welcome-heart">
          <Heart size={23} strokeWidth={1.3} aria-hidden="true" />
        </div>
        <Wordmark />
        <div className="wedding-date">
          <CalendarDays size={14} aria-hidden="true" />
          <bdi>10.11.2026</bdi>
          <span>יום שלישי</span>
        </div>
        <div className="welcome-divider">
          <span>ביחד, עד לרגע הגדול</span>
        </div>
        <div className="welcome-greeting">
          <h1>
            היי אהובה!{" "}
            <Heart
              size={22}
              fill="currentColor"
              strokeWidth={0}
              aria-label="לב"
            />
          </h1>
          <p>בחרי את שמך כדי להתחיל</p>
        </div>
        {configuration ? (
          <Notice>{configuration}</Notice>
        ) : error ? (
          <>
            <Notice>{error}</Notice>
            <button className="button secondary full-width" onClick={refresh}>
              <RefreshCw size={16} />
              נסי שוב
            </button>
          </>
        ) : loading ? (
          <div
            className="vendor-skeletons"
            aria-label="טוענות את רשימת נותנות השירות"
            role="status"
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <div className="skeleton" key={i} />
            ))}
          </div>
        ) : (
          <>
            <div className="vendor-list">
              {vendors.map((vendor) => (
                <button
                  key={vendor.id}
                  className={`vendor-choice ${vendor.service_type}`}
                  onClick={() => onSelect({ kind: "vendor", id: vendor.id })}
                >
                  <span className={`vendor-icon ${vendor.service_type}`}>
                    <ServiceIcon type={vendor.service_type} size={22} />
                  </span>
                  <span className="vendor-copy">
                    <strong>{vendor.name}</strong>
                    <span>{vendorLabels[vendor.service_type]}</span>
                  </span>
                  <ArrowLeft
                    className="choice-arrow"
                    size={18}
                    aria-hidden="true"
                  />
                </button>
              ))}
              <button
                className="vendor-choice family"
                aria-label={familyAccess.label}
                onClick={() => setFamilyDialogOpen(true)}
              >
                <span className="vendor-icon family">
                  <Users size={22} aria-hidden="true" />
                </span>
                <span className="vendor-copy">
                  <strong>{familyAccess.label}</strong>
                  <span>לו״ז המתארגנות</span>
                </span>
                <ArrowLeft
                  className="choice-arrow"
                  size={18}
                  aria-hidden="true"
                />
              </button>
            </div>
            {!vendors.length && (
              <EmptyState title="לא נמצאו נותנות שירות">
                בדקי שפרטי החיבור שייכים לפרויקט הנכון.
              </EmptyState>
            )}
          </>
        )}
        <footer className="welcome-footer">
          <Heart size={11} aria-hidden="true" />
          <span>קצת תכנון, הרבה התרגשות</span>
        </footer>
      </main>
      {familyDialogOpen && (
        <FamilyAccessDialog
          onClose={() => setFamilyDialogOpen(false)}
          onEnter={() => {
            setFamilyDialogOpen(false);
            onSelect({ kind: "manager" });
          }}
        />
      )}
    </div>
  );
}

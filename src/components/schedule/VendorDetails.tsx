import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import type { Vendor } from "../../types/database";
import { updateVendorDetails } from "../../services/vendorService";
import { Notice } from "../ui/Primitives";

export function VendorDetails({
  vendor,
  onSaved,
}: {
  vendor: Vendor;
  onSaved: (vendor: Vendor) => void;
}) {
  const [original, setOriginal] = useState(vendor);
  const [text, setText] = useState(vendor.additional_details ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const available = vendor.additional_details !== undefined;
  const dirty = text !== (original.additional_details ?? "");
  const headingId = `vendor-details-${vendor.id}`;

  useEffect(() => {
    if (!dirty && !saving) {
      setOriginal(vendor);
      setText(vendor.additional_details ?? "");
    }
  }, [vendor, dirty, saving]);

  async function save() {
    if (!available || !dirty || saving) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await updateVendorDetails(original, text);
      setOriginal(updated);
      setText(updated.additional_details ?? "");
      onSaved(updated);
      setSaved(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "לא הצלחנו לשמור את הפירוט. נסי שוב.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="vendor-details" aria-labelledby={headingId}>
      <h2 id={headingId}>פירוט נוסף</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <textarea
          aria-labelledby={headingId}
          value={text}
          rows={4}
          placeholder="למשל: להגיע בבקשה עם שיער חפוף"
          disabled={!available || saving}
          onChange={(event) => {
            setText(event.target.value);
            setSaved(false);
            setError(null);
          }}
        />
        {!available && (
          <p className="field-help">שמירת הפירוט עדיין אינה זמינה.</p>
        )}
        {error && (
          <>
            <Notice>{error}</Notice>
            <button
              type="button"
              className="text-button"
              onClick={() => window.location.reload()}
            >
              טעינת הפירוט השמור מחדש
            </button>
          </>
        )}
        {saved && (
          <p className="details-saved" role="status">
            הפירוט נשמר
          </p>
        )}
        <button
          type="submit"
          className="button primary"
          disabled={!available || !dirty || saving}
        >
          {saving ? (
            <>
              <LoaderCircle size={16} className="spin" />
              שומרת…
            </>
          ) : (
            "שמירת הפירוט"
          )}
        </button>
      </form>
    </section>
  );
}

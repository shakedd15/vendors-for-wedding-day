import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { familyAccess } from "../../config/access";
import { Notice } from "./Primitives";

export function FamilyAccessDialog({
  onClose,
  onEnter,
}: {
  onClose: () => void;
  onEnter: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    input.current?.focus();
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = before;
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className="booking-dialog family-access-dialog"
      aria-labelledby="family-access-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="sheet-content">
        <div className="sheet-handle" />
        <div className="sheet-heading">
          <div>
            <h2 id="family-access-title">{familyAccess.label}</h2>
            <p>הזיני סיסמה כדי להיכנס</p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="סגירת חלון הסיסמה"
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>
        <form
          className="family-password-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (password.trim() === familyAccess.password) onEnter();
            else {
              setError(true);
              input.current?.select();
            }
          }}
        >
          <label htmlFor="family-password">
            סיסמה
            <input
              ref={input}
              id="family-password"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              required
              value={password}
              aria-invalid={error}
              aria-describedby={error ? "family-access-error" : undefined}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(false);
              }}
            />
          </label>
          {error && (
            <div id="family-access-error">
              <Notice>הסיסמה שגויה. נסי שוב.</Notice>
            </div>
          )}
          <button type="submit" className="button primary full-width">
            כניסה
          </button>
          <button
            type="button"
            className="button secondary full-width"
            onClick={onClose}
          >
            חזרה
          </button>
        </form>
      </div>
    </dialog>
  );
}

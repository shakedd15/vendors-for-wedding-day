import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Heart,
  RefreshCw,
  Settings2,
  Users,
  UserRound,
} from "lucide-react";
import { useWeddingData } from "./hooks/useWeddingData";
import { useWeddingEvents } from "./hooks/useWeddingEvents";
import { usePreferences } from "./hooks/usePreferences";
import { configError } from "./lib/supabase";
import { familyAccess } from "./config/access";
import { WelcomePage } from "./pages/WelcomePage";
import { MySchedulePage } from "./pages/MySchedulePage";
import { SharedSchedulePage } from "./pages/SharedSchedulePage";
import { ManagementPage } from "./pages/ManagementPage";
import { BookingSheet } from "./components/booking/BookingSheet";
import { Notice, Wordmark } from "./components/ui/Primitives";
import type { Appointment } from "./types/database";
import type { Identity, Screen } from "./types/scheduling";

export default function App() {
  const data = useWeddingData();
  const eventData = useWeddingEvents();
  const prefs = usePreferences();
  const [screen, setScreen] = useState<Screen>(
    prefs.identity?.kind === "manager" ? "shared" : "mine",
  );
  const [screenHistory, setScreenHistory] = useState<Screen[]>([]);
  const [familyUnlocked, setFamilyUnlocked] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const manager = prefs.identity?.kind === "manager" && familyUnlocked;
  const familyNeedsPassword =
    prefs.identity?.kind === "manager" && !familyUnlocked;
  const selectedId =
    prefs.identity?.kind === "vendor" ? prefs.identity.id : undefined;
  const vendor = data.vendors.find((v) => v.id === selectedId);
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 4500);
    return () => clearTimeout(timer);
  }, [success]);
  const select = (identity: Identity | null) => {
    setFamilyUnlocked(identity?.kind === "manager");
    prefs.selectIdentity(identity);
    setScreenHistory([]);
    setScreen(identity?.kind === "manager" ? "shared" : "mine");
    setEditing(null);
    setSuccess(null);
    window.scrollTo(0, 0);
  };
  const changeScreen = (next: Screen) => {
    if (next === screen) return;
    setScreenHistory((previous) => [...previous, screen]);
    setScreen(next);
    window.scrollTo(0, 0);
  };
  const goBack = () => {
    const previous = screenHistory.at(-1);
    if (!previous) {
      select(null);
      return;
    }
    setScreenHistory((history) => history.slice(0, -1));
    setScreen(previous);
    setSuccess(null);
    window.scrollTo(0, 0);
  };
  const openBooking = (appointment: Appointment) => {
    if (manager || appointment.vendor_id === selectedId) {
      setEditing(appointment);
      void data.refresh();
    }
  };
  if (
    !prefs.identity ||
    familyNeedsPassword ||
    configError ||
    (!data.loading && !data.error && !manager && !vendor)
  )
    return (
      <WelcomePage
        vendors={data.vendors}
        loading={data.loading}
        error={data.error}
        configuration={configError}
        refresh={() => {
          void data.refresh();
        }}
        onSelect={select}
      />
    );
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <Wordmark small />
          <button
            className="identity-button"
            onClick={() => select(null)}
            aria-label="החלפת משתמשת"
          >
            <UserRound size={16} />
            <span>
              {manager ? familyAccess.label : vendor?.name || "החשבון שלי"}
            </span>
          </button>
        </div>
        <div className="header-subline">
          <span>
            <Heart size={11} />
            מתארגנות לחתונה
          </span>
          <bdi>10.11.2026</bdi>
        </div>
      </header>
      <main id="main-content" className="main-content">
        <div className="schedule-actions">
          <button type="button" className="back-button" onClick={goBack}>
            <ArrowRight size={18} aria-hidden="true" />
            <span>חזרה</span>
          </button>
          <button
            onClick={() => {
              void data.refresh();
              void eventData.refresh();
            }}
            className="refresh-button"
            disabled={data.refreshing || eventData.refreshing}
            aria-label="רענון הלו״ז"
          >
            <RefreshCw size={14} className={data.refreshing ? "spin" : ""} />
            <span>רענון</span>
          </button>
        </div>
        {data.error && (
          <Notice>{data.error} מוצגים הנתונים האחרונים שהתקבלו.</Notice>
        )}
        {data.loading ? (
          <div role="status" className="loading-schedule">
            <span className="loading-heart">
              <Heart size={30} />
            </span>
            <p>מכינות את הלו״ז שלך…</p>
            <div className="skeleton" />
            <div className="skeleton" />
          </div>
        ) : (
          <>
            {screen === "mine" && vendor && (
              <MySchedulePage
                vendor={vendor}
                appointments={data.appointments}
                onEdit={openBooking}
                onVendorSaved={(updated) => {
                  data.acceptVendorUpdate(updated);
                  void data.refresh();
                }}
              />
            )}
            {screen === "shared" && (
              <SharedSchedulePage
                appointments={data.appointments}
                participants={data.participants}
                vendors={data.vendors}
                selectedVendor={selectedId}
                manager={manager}
                onEdit={openBooking}
                events={eventData.events}
                eventsAvailable={eventData.available}
                eventsError={eventData.error}
                onEventSaved={(event) => {
                  eventData.acceptEvent(event);
                  void eventData.refresh();
                  setSuccess("האירוע נשמר");
                }}
              />
            )}
            {screen === "management" && manager && (
              <ManagementPage
                {...data}
                buffer={prefs.buffer}
                onEdit={openBooking}
              />
            )}
          </>
        )}
        <footer className="app-footer">
          שקד ואיל <Heart size={10} /> כל רגע מתחבר
        </footer>
      </main>
      <nav className="bottom-nav" aria-label="ניווט ראשי">
        <div>
          {manager ? (
            <>
              <button
                className={screen === "shared" ? "active" : ""}
                aria-current={screen === "shared" ? "page" : undefined}
                onClick={() => changeScreen("shared")}
              >
                <Users size={21} />
                <span>לו״ז משותף</span>
              </button>
              <button
                className={screen === "management" ? "active" : ""}
                aria-current={screen === "management" ? "page" : undefined}
                onClick={() => changeScreen("management")}
              >
                <Settings2 size={21} />
                <span>ניהול</span>
              </button>
            </>
          ) : (
            <>
              <button
                className={screen === "mine" ? "active" : ""}
                aria-current={screen === "mine" ? "page" : undefined}
                onClick={() => changeScreen("mine")}
              >
                <CalendarDays size={21} />
                <span>הלו״ז שלי</span>
              </button>
              <button
                className={screen === "shared" ? "active" : ""}
                aria-current={screen === "shared" ? "page" : undefined}
                onClick={() => changeScreen("shared")}
              >
                <Users size={21} />
                <span>לו״ז משותף</span>
              </button>
            </>
          )}
        </div>
      </nav>
      {success && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}
      {editing && (
        <BookingSheet
          key={editing.id}
          appointment={editing}
          all={data.appointments}
          manager={manager}
          buffer={prefs.buffer}
          onBuffer={prefs.changeBuffer}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            data.acceptUpdate(updated);
            setEditing(null);
            setSuccess("השיבוץ נשמר בהצלחה");
            void data.refresh();
          }}
        />
      )}
    </div>
  );
}

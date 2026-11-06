import { displayTime, fromMinutes, toMinutes } from "../../utils/time";
export function BufferControl({
  buffer,
  onChange,
}: {
  buffer: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="buffer-control">
      <label htmlFor="bride-buffer">
        מרווח לשמלה ולטאצ׳ אפ
        <select
          id="bride-buffer"
          value={buffer}
          onChange={(e) => onChange(Number(e.target.value))}
        >
          {[0, 15, 30, 45, 60, 75, 90, 105, 120].map((value) => (
            <option key={value} value={value}>
              {value} דקות
            </option>
          ))}
        </select>
      </label>
      <p>
        הנחת תכנון ניתנת לשינוי, במכשיר הזה בלבד. סיום הטיפולים עד{" "}
        <bdi>{displayTime(fromMinutes(toMinutes("14:15")! - buffer))}</bdi>; שקד
        מוכנה עד <bdi>14:15</bdi>.
      </p>
    </div>
  );
}

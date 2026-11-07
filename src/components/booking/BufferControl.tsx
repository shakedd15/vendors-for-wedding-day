import { wedding } from "../../config/wedding";
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
          {Array.from(
            { length: 120 / wedding.slotMinutes + 1 },
            (_, index) => index * wedding.slotMinutes,
          ).map((value) => (
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

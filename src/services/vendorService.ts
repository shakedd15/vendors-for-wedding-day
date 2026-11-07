import { supabase } from "../lib/supabase";
import type { Vendor } from "../types/database";

export async function updateVendorDetails(
  original: Vendor,
  text: string,
): Promise<Vendor> {
  if (!supabase || original.additional_details === undefined) {
    throw new Error("שמירת הפירוט עדיין אינה זמינה.");
  }
  let query = supabase
    .from("vendors")
    .update({ additional_details: text === "" ? null : text })
    .eq("id", original.id);
  query =
    original.additional_details === null
      ? query.is("additional_details", null)
      : query.eq("additional_details", original.additional_details);
  const { data, error } = await query.select("*").maybeSingle();
  if (error) {
    if (error.code === "42501")
      throw new Error("אין כרגע הרשאה לשמור את הפירוט. פני למארגנת.");
    if (["42703", "PGRST204"].includes(error.code))
      throw new Error("שמירת הפירוט עדיין אינה זמינה.");
    throw new Error("לא הצלחנו לשמור את הפירוט. נסי שוב.");
  }
  if (!data)
    throw new Error(
      "הפירוט השתנה במכשיר אחר או שאין הרשאה לעדכן אותו. טעני את העמוד מחדש לפני שמירה נוספת.",
    );
  return data;
}

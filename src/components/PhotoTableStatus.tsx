import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export function PhotoTableStatus() {
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkTable() {
      if (!isSupabaseConfigured || !supabase) {
        setError("Supabase is not configured.");
        return;
      }
      const { count, error } = await supabase
        .from("photos")
        .select("*", { count: "exact", head: true });
      if (error) {
        setError(error.message);
      } else {
        setCount(count ?? 0);
      }
    }
    checkTable();
  }, []);

  if (error) return <div style={{ color: "red" }}>Error: {error}</div>;
  if (count === null) return <div>Checking table connection...</div>;
} 
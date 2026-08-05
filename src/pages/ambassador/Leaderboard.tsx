import { useEffect, useState } from "react";
import { AmbassadorLayout } from "@/components/ambassador/AmbassadorLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ref, onValue } from "firebase/database";
import { database } from "@/firebase";
import { useAmbassador } from "@/contexts/AmbassadorContext";
import { Trophy } from "lucide-react";

interface Row {
  fullName?: string;
  college?: string;
  successfulRegistrations?: number;
  referralCode?: string;
}

const Leaderboard = () => {
  const { profile } = useAmbassador();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const unsub = onValue(ref(database, "ambassadors"), (snap) => {
      const val = (snap.val() || {}) as Record<string, Row>;
      const list = Object.values(val).sort(
        (a, b) => (b.successfulRegistrations || 0) - (a.successfulRegistrations || 0)
      );
      setRows(list.slice(0, 20));
    });
    return () => unsub();
  }, []);

  return (
    <AmbassadorLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Leaderboard</h1>
          <p className="mt-1 text-muted-foreground">Top ambassadors this season.</p>
        </div>

        <Card className="divide-y divide-border">
          {rows.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">No rankings yet — be the first!</p>
          )}
          {rows.map((r, i) => {
            const me = r.referralCode && r.referralCode === profile?.referralCode;
            return (
              <div
                key={r.referralCode || i}
                className={`flex items-center gap-4 p-4 ${me ? "bg-primary/5" : ""}`}
              >
                <span className="w-8 text-center text-sm font-bold text-muted-foreground">
                  {i + 1}
                </span>
                {i === 0 ? <Trophy className="h-5 w-5 text-primary" /> : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.fullName || "Ambassador"}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.college || "—"}</p>
                </div>
                {me && <Badge variant="secondary">You</Badge>}
                <span className="text-sm font-semibold">{r.successfulRegistrations || 0}</span>
              </div>
            );
          })}
        </Card>
      </div>
    </AmbassadorLayout>
  );
};

export default Leaderboard;

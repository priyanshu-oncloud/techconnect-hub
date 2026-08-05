import { useMemo } from "react";
import { AmbassadorLayout } from "@/components/ambassador/AmbassadorLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAmbassador } from "@/contexts/AmbassadorContext";
import { Users, Trophy, Target, Gift } from "lucide-react";

const tiers = [
  { name: "Bronze", target: 10 },
  { name: "Silver", target: 25 },
  { name: "Gold", target: 50 },
  { name: "Platinum", target: 100 },
];

const Dashboard = () => {
  const { profile } = useAmbassador();
  const done = profile?.successfulRegistrations || 0;

  const next = useMemo(() => tiers.find((t) => done < t.target) || tiers[tiers.length - 1], [done]);
  const current = useMemo(
    () => [...tiers].reverse().find((t) => done >= t.target)?.name || "Starter",
    [done]
  );
  const pct = Math.min(100, Math.round((done / next.target) * 100));

  const stats = [
    { label: "Referrals", value: profile?.referrals || 0, icon: Users },
    { label: "Successful", value: done, icon: Target },
    { label: "Current Tier", value: current, icon: Trophy },
    { label: "Next Reward", value: next.name, icon: Gift },
  ];

  return (
    <AmbassadorLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            Hi {profile?.fullName?.split(" ")[0] || "Ambassador"} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">Here's how your campus run is going.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <p className="mt-2 text-2xl font-bold">{s.value}</p>
              </Card>
            );
          })}
        </div>

        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Progress to {next.name}</h2>
            <Badge variant="secondary">
              {done} / {next.target}
            </Badge>
          </div>
          <Progress value={pct} className="mt-4" />
          <p className="mt-3 text-sm text-muted-foreground">
            {Math.max(0, next.target - done)} more successful registrations to unlock {next.name}.
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold">Your Referral Code</h2>
          <p className="mt-2 text-3xl font-bold tracking-widest text-primary">
            {profile?.referralCode || "—"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Share this code with students — every verified registration counts towards your rewards.
          </p>
        </Card>
      </div>
    </AmbassadorLayout>
  );
};

export default Dashboard;

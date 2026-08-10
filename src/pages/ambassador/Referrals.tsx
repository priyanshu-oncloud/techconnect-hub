import { useEffect, useState } from "react";
import { ref as dbRef, get } from "firebase/database";
import { database } from "@/firebase";
import { AmbassadorLayout } from "@/components/ambassador/AmbassadorLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAmbassador } from "@/contexts/AmbassadorContext";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Share2, MousePointerClick, Users, Percent } from "lucide-react";

const Referrals = () => {
  const { profile } = useAmbassador();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [clicks, setClicks] = useState(0);

  const code = profile?.referralCode || "";
  const link = `${window.location.origin}/careers?ref=${code}`;
  const registrations = profile?.successfulRegistrations || 0;

  useEffect(() => {
    if (!code) return;
    get(dbRef(database, `referral_clicks/${code}/count`))
      .then((s) => setClicks(s.val() || 0))
      .catch(() => {});
  }, [code]);

  const conversion = clicks > 0 ? Math.round((registrations / clicks) * 100) : 0;

  const copy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(null), 1500);
  };

  const templates = [
    {
      key: "whatsapp",
      label: "WhatsApp / Status",
      text: `🚀 Internship opportunity alert!\n\nNestgen Solutions is hiring interns (Web, App, Data, Design).\nUse my referral code *${code}* and get ₹30 OFF the application fee.\n\nApply here 👉 ${link}`,
    },
    {
      key: "linkedin",
      label: "LinkedIn post",
      text: `I'm a Student Ambassador at Nestgen Solutions 🎓\n\nApplications are open for their remote internship program across Web Development, App Development, Data and Design.\n\nIf you're a student looking for real project experience + certification, apply using my referral code ${code} for a discount on the application fee.\n\nApply: ${link}\n\n#internship #students #hiring #nestgensolutions`,
    },
    {
      key: "instagram",
      label: "Instagram caption / story",
      text: `Internships are OPEN 📢\nRemote • Certificate • Real projects\n\nReferral code: ${code} (₹30 off)\nLink in bio 👉 ${link}\n\n#internship #studentlife #techcareers`,
    },
    {
      key: "x",
      label: "X (Twitter)",
      text: `Nestgen Solutions internships are open 🚀 Remote + certificate + real projects.\n\nUse code ${code} for ₹30 off the application fee.\n${link}`,
    },
    {
      key: "email",
      label: "Email / college group",
      text: `Hi everyone,\n\nNestgen Solutions has opened applications for its remote internship program (Web, App, Data, Design). Selected interns work on live projects and receive an offer letter and completion certificate.\n\nYou can apply using my referral code ${code} to get ₹30 off the application fee.\n\nApply here: ${link}\n\nHappy to answer any questions.\nThanks!`,
    },
  ];

  const stats = [
    { label: "Link clicks", value: clicks, icon: MousePointerClick },
    { label: "Registrations", value: registrations, icon: Users },
    { label: "Conversion", value: `${conversion}%`, icon: Percent },
  ];

  return (
    <AmbassadorLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Referral Tools</h1>
          <p className="mt-1 text-muted-foreground">
            Track your link, copy ready-made posts, grow your campus network.
          </p>
        </div>

        {/* TRACKING STATS */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="p-4 text-center">
                <Icon className="mx-auto mb-2 h-5 w-5 text-primary" />
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </Card>
            );
          })}
        </div>

        {/* CODE + LINK */}
        {[
          { key: "code", label: "Referral Code", value: code },
          { key: "link", label: "Trackable Referral Link", value: link },
        ].map((r) => (
          <Card key={r.key} className="p-5">
            <p className="mb-2 text-sm font-medium">{r.label}</p>
            <div className="flex gap-2">
              <Input readOnly value={r.value} />
              <Button variant="outline" size="icon" onClick={() => copy(r.value, r.key)}>
                {copied === r.key ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </Card>
        ))}

        <Button
          variant="hero"
          className="w-full"
          onClick={() =>
            window.open(
              `https://wa.me/?text=${encodeURIComponent(templates[0].text)}`,
              "_blank",
              "noopener"
            )
          }
        >
          <Share2 className="mr-2 h-4 w-4" /> Share on WhatsApp
        </Button>

        {/* SOCIAL TEMPLATES */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Social share templates</h2>
            <Badge variant="secondary">Ready to post</Badge>
          </div>

          {templates.map((t) => (
            <Card key={t.key} className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{t.label}</p>
                <Button size="sm" variant="outline" onClick={() => copy(t.text, t.key)}>
                  {copied === t.key ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="ml-2">Copy</span>
                </Button>
              </div>
              <Textarea readOnly value={t.text} rows={t.text.split("\n").length + 1} />
            </Card>
          ))}
        </div>
      </div>
    </AmbassadorLayout>
  );
};

export default Referrals;

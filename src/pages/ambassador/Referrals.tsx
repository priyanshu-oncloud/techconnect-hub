import { useState } from "react";
import { AmbassadorLayout } from "@/components/ambassador/AmbassadorLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAmbassador } from "@/contexts/AmbassadorContext";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Share2 } from "lucide-react";

const Referrals = () => {
  const { profile } = useAmbassador();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const code = profile?.referralCode || "";
  const link = `${window.location.origin}/careers?ref=${code}`;
  const message = `Hey! Join Nestgen Solutions internship programs using my referral code ${code}: ${link}`;

  const copy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(null), 1500);
  };

  const rows = [
    { key: "code", label: "Referral Code", value: code },
    { key: "link", label: "Referral Link", value: link },
    { key: "msg", label: "Ready-to-send Message", value: message },
  ];

  return (
    <AmbassadorLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Referral Tools</h1>
          <p className="mt-1 text-muted-foreground">Copy, share, grow your campus network.</p>
        </div>

        {rows.map((r) => (
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
            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener")
          }
        >
          <Share2 className="mr-2 h-4 w-4" /> Share on WhatsApp
        </Button>
      </div>
    </AmbassadorLayout>
  );
};

export default Referrals;

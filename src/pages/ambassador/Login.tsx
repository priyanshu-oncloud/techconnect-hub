import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAmbassador } from "@/contexts/AmbassadorContext";
import { GraduationCap } from "lucide-react";

const AmbassadorLogin = () => {
  const { login, signup, user, loading } = useAmbassador();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const [li, setLi] = useState({ email: "", password: "" });
  const [su, setSu] = useState({ fullName: "", email: "", password: "", college: "", phone: "" });

  useEffect(() => {
    if (!loading && user) navigate("/ambassador");
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await login(li.email, li.password);
    setBusy(false);
    if (res.ok) navigate("/ambassador");
    else toast({ title: "Login failed", description: res.error, variant: "destructive" });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!su.fullName || !su.email || !su.password) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setBusy(true);
    const res = await signup(su);
    setBusy(false);
    if (res.ok) navigate("/ambassador");
    else toast({ title: "Signup failed", description: res.error, variant: "destructive" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4">
      <Card className="w-full max-w-md p-6 md:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Ambassador Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your referrals, rewards and rank.
          </p>
        </div>

        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="mt-4 space-y-3">
              <Input
                type="email"
                placeholder="Email"
                value={li.email}
                onChange={(e) => setLi({ ...li, email: e.target.value })}
              />
              <Input
                type="password"
                placeholder="Password"
                value={li.password}
                onChange={(e) => setLi({ ...li, password: e.target.value })}
              />
              <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                {busy ? "Please wait..." : "Login"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="mt-4 space-y-3">
              <Input
                placeholder="Full Name"
                value={su.fullName}
                onChange={(e) => setSu({ ...su, fullName: e.target.value })}
              />
              <Input
                type="email"
                placeholder="Email"
                value={su.email}
                onChange={(e) => setSu({ ...su, email: e.target.value })}
              />
              <Input
                placeholder="College"
                value={su.college}
                onChange={(e) => setSu({ ...su, college: e.target.value })}
              />
              <Input
                placeholder="Phone"
                value={su.phone}
                onChange={(e) => setSu({ ...su, phone: e.target.value })}
              />
              <Input
                type="password"
                placeholder="Password (min 6 characters)"
                value={su.password}
                onChange={(e) => setSu({ ...su, password: e.target.value })}
              />
              <Button type="submit" variant="hero" className="w-full" disabled={busy}>
                {busy ? "Creating..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/student-ambassador" className="hover:text-primary">
            ← Back to program page
          </Link>
        </p>
      </Card>
    </main>
  );
};

export default AmbassadorLogin;

import { AppShell, Button, Pill, Timeline } from "@asur/ui";

const authFlow = [
  { title: "Phone OTP", description: "Firebase delivers the code and returns an identity token after verification.", tone: "info" as const },
  { title: "Google login", description: "Users can opt into a Google credential without losing the same session model.", tone: "success" as const },
  { title: "Backend session", description: "The frontend forwards the token to the backend so the app can create or fetch a user profile.", tone: "warning" as const }
];

export default function AuthPage() {
  return (
    <div className="stack">
      <div className="section-title">
        <div>
          <h1>Authentication</h1>
          <p>Firebase manages identity, while MongoDB stores the user profile, addresses, and roles.</p>
        </div>
        <Button href="/account">Open account</Button>
      </div>

      <AppShell title="Identity flow" subtitle="OTP and Google auth are both routed through the same backend session contract.">
        <div className="actions">
          <Pill tone="info">Firebase OTP</Pill>
          <Pill tone="success">Google sign-in</Pill>
          <Pill tone="warning">Backend verification</Pill>
        </div>
      </AppShell>

      <Timeline steps={authFlow} />
    </div>
  );
}

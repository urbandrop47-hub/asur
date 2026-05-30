import { AppShell, Pill, Timeline } from "@asur/ui";
import { AuthPanel } from "../../components/auth-panel";

const authFlow = [
  { title: "Email or Google login", description: "Users can sign in with email/password or a Google credential without changing the session model.", tone: "success" as const },
  { title: "Provider linking", description: "A signed-in user can attach Google and email/password to the same Firebase account.", tone: "info" as const },
  { title: "Backend session", description: "The frontend forwards the token to the backend so the app can create or fetch a user profile.", tone: "warning" as const },
  { title: "Admin routing", description: "Users with an admin role in Mongo go straight into the admin panel after sign-in.", tone: "info" as const }
];

export default function AuthPage() {
  return (
    <div className="stack">
      <div className="section-title">
        <div>
          <h1>Authentication</h1>
          <p>Firebase manages identity, while MongoDB stores the user profile, addresses, and roles.</p>
        </div>
      </div>

      <AppShell title="Identity flow" subtitle="Email/password and Google auth are routed through the same backend session contract, and the same Firebase user can link both providers.">
        <div className="actions">
          <Pill tone="info">Email/password</Pill>
          <Pill tone="success">Google sign-in</Pill>
          <Pill tone="info">Provider linking</Pill>
          <Pill tone="warning">Backend verification</Pill>
          <Pill tone="info">Admin redirect</Pill>
        </div>
      </AppShell>

      <AuthPanel />

      <Timeline steps={authFlow} />
    </div>
  );
}

import { DashboardShell } from "@/components/dashboard-shell";
import { ProfileSettings } from "@/components/profile-settings";

export default function ProfilePage() {
  return (
    <DashboardShell title="Profile Settings" eyebrow="Account">
      <ProfileSettings />
    </DashboardShell>
  );
}

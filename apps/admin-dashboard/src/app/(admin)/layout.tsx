import { AdminShell } from "@/components/layout/admin-shell";
import { FeatureFlagsProvider } from "@/hooks/use-feature-flags";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FeatureFlagsProvider>
      <AdminShell>{children}</AdminShell>
    </FeatureFlagsProvider>
  );
}

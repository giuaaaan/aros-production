import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DigitalInspection } from "@/components/inspection/digital-inspection";
import { WorkOrderKanban } from "@/components/workflow/work-order-kanban";
import { BarcodeScanner } from "@/components/parts/barcode-scanner";
import { Wrench, Package, ClipboardCheck, Users, Clock } from "lucide-react";

function DashboardStats() {
  const stats = [
    { label: "Ordini Oggi", value: "8", icon: Wrench },
    { label: "In Attesa", value: "3", icon: Clock },
    { label: "Ricambi", value: "1,247", icon: Package },
    { label: "Clienti", value: "156", icon: Users },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <Icon className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function GestionalePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Gestionale Officina 2026</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <DashboardStats />
        
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-4">Board Ordini</h2>
              <WorkOrderKanban />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-4">Ispezione Digitale</h2>
              <DigitalInspection />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-4">Magazzino</h2>
              <BarcodeScanner />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

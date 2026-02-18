"use client";

import { useState, useCallback } from "react";
import { Camera, Mic, CheckCircle2, AlertCircle, XCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceInput } from "@/components/ui/voice-input";

type InspectionStatus = "not_checked" | "good" | "attention" | "urgent";

interface InspectionItem {
  id: string;
  category: string;
  name: string;
  status: InspectionStatus;
  notes: string;
  photos: string[];
  videoUrl?: string;
}

const INSPECTION_TEMPLATE = [
  {
    category: "Sicurezza",
    items: [
      { id: "brake_pads", name: "Pastiglie freno anteriori" },
      { id: "brake_discs", name: "Dischi freno" },
      { id: "brake_fluid", name: "Liquido freni" },
      { id: "tires_front", name: "Pneumatici anteriori" },
      { id: "tires_rear", name: "Pneumatici posteriori" },
      { id: "lights", name: "Impianto luci" },
    ]
  },
  {
    category: "Fluidi",
    items: [
      { id: "engine_oil", name: "Olio motore" },
      { id: "coolant", name: "Liquido radiatore" },
      { id: "transmission", name: "Olio cambio" },
      { id: "power_steering", name: "Liquido servosterzo" },
      { id: "windshield_washer", name: "Liquido tergicristalli" },
    ]
  },
  {
    category: "Meccanica",
    items: [
      { id: "suspension", name: "Ammortizzatori" },
      { id: "steering", name: "Sterzo" },
      { id: "exhaust", name: "Scarico" },
      { id: "belts", name: "Cinghie" },
      { id: "battery", name: "Batteria" },
    ]
  },
  {
    category: "Filtri",
    items: [
      { id: "oil_filter", name: "Filtro olio" },
      { id: "air_filter", name: "Filtro aria" },
      { id: "cabin_filter", name: "Filtro abitacolo" },
      { id: "fuel_filter", name: "Filtro carburante" },
    ]
  }
];

export function DigitalInspection() {
  const [inspections, setInspections] = useState<Record<string, InspectionItem>>(() => {
    const initial: Record<string, InspectionItem> = {};
    INSPECTION_TEMPLATE.forEach(cat => {
      cat.items.forEach(item => {
        initial[item.id] = {
          id: item.id,
          category: cat.category,
          name: item.name,
          status: "not_checked",
          notes: "",
          photos: [],
        };
      });
    });
    return initial;
  });

  const [activeCategory, setActiveCategory] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);

  const updateStatus = useCallback((itemId: string, status: InspectionStatus) => {
    setInspections(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], status }
    }));
  }, []);

  const updateNotes = useCallback((itemId: string, notes: string) => {
    setInspections(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], notes }
    }));
  }, []);

  const addPhoto = useCallback((itemId: string, photoUrl: string) => {
    setInspections(prev => ({
      ...prev,
      [itemId]: { 
        ...prev[itemId], 
        photos: [...prev[itemId].photos, photoUrl]
      }
    }));
    setShowCamera(false);
  }, []);

  const stats = {
    notChecked: Object.values(inspections).filter(i => i.status === "not_checked").length,
    good: Object.values(inspections).filter(i => i.status === "good").length,
    attention: Object.values(inspections).filter(i => i.status === "attention").length,
    urgent: Object.values(inspections).filter(i => i.status === "urgent").length,
  };

  const StatusButton = ({ 
    status, 
    label, 
    icon: Icon, 
    color 
  }: { 
    status: InspectionStatus; 
    label: string; 
    icon: any;
    color: string;
  }) => (
    <button
      onClick={() => currentItemId && updateStatus(currentItemId, status)}
      className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
        currentItemId && inspections[currentItemId]?.status === status
          ? `border-${color}-500 bg-${color}-50`
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <Icon className={`w-6 h-6 mb-1 ${
        currentItemId && inspections[currentItemId]?.status === status
          ? `text-${color}-500`
          : "text-gray-400"
      }`} />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Stato Ispezione</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">{stats.good}</div>
              <div className="text-xs text-green-700">OK</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-yellow-600">{stats.attention}</div>
              <div className="text-xs text-yellow-700">Attenzione</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
              <div className="text-xs text-red-700">Urgente</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-600">{stats.notChecked}</div>
              <div className="text-xs text-gray-700">Da verificare</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {INSPECTION_TEMPLATE.map((cat, idx) => (
          <Button
            key={cat.category}
            variant={activeCategory === idx ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(idx)}
          >
            {cat.category}
          </Button>
        ))}
      </div>

      {/* Inspection Items */}
      <div className="space-y-4">
        {INSPECTION_TEMPLATE[activeCategory].items.map((item) => {
          const inspection = inspections[item.id];
          const isUrgent = inspection.status === "urgent";
          
          return (
            <Card 
              key={item.id}
              className={`${isUrgent ? "border-red-300 bg-red-50" : ""}`}
              onClick={() => setCurrentItemId(item.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    
                    {/* Status Selection */}
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      <StatusButton 
                        status="good" 
                        label="OK" 
                        icon={CheckCircle2} 
                        color="green"
                      />
                      <StatusButton 
                        status="attention" 
                        label="Attenzione" 
                        icon={AlertCircle} 
                        color="yellow"
                      />
                      <StatusButton 
                        status="urgent" 
                        label="Urgente" 
                        icon={XCircle} 
                        color="red"
                      />
                      <button
                        onClick={() => setShowCamera(true)}
                        className="flex flex-col items-center p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300"
                      >
                        <Camera className="w-6 h-6 mb-1 text-gray-400" />
                        <span className="text-xs font-medium">Foto</span>
                      </button>
                    </div>

                    {/* Notes with Voice */}
                    {inspection.status !== "not_checked" && (
                      <div className="mt-3">
                        <VoiceInput
                          onTranscript={(text) => updateNotes(item.id, text)}
                          placeholder="Dettagli problematica..."
                        />
                        {inspection.notes && (
                          <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {inspection.notes}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Photo Gallery */}
                    {inspection.photos.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {inspection.photos.map((photo, idx) => (
                          <img
                            key={idx}
                            src={photo}
                            alt={`Photo ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Generate Report Button */}
      <div className="fixed bottom-6 left-0 right-0 px-4">
        <Button 
          className="w-full h-14 text-lg font-semibold shadow-lg"
          disabled={stats.notChecked > 0}
        >
          Genera Rapporto Ispezione
          <ChevronRight className="ml-2 w-5 h-5" />
        </Button>
      </div>

      {/* Camera Modal would go here */}
    </div>
  );
}

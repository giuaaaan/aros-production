"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, X, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Part {
  id: string;
  sku: string;
  name: string;
  brand: string;
  location: string;
  quantity: number;
  min_stock: number;
  sale_price: number;
}

export function BarcodeScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string>("");
  const [foundPart, setFoundPart] = useState<Part | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Mock parts database
  const mockParts: Record<string, Part> = {
    "123456789012": {
      id: "1",
      sku: "FIL-OLIO-01",
      name: "Filtro Olio Bosch",
      brand: "Bosch",
      location: "Scaffale A3",
      quantity: 15,
      min_stock: 5,
      sale_price: 12.50,
    },
    "987654321098": {
      id: "2",
      sku: "PAST-FRE-01",
      name: "Pastiglie Freno Brembo",
      brand: "Brembo",
      location: "Scaffale B1",
      quantity: 3,
      min_stock: 5,
      sale_price: 45.00,
    },
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsScanning(true);
    } catch (error) {
      console.error("Camera error:", error);
      alert("Impossibile accedere alla fotocamera");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleScan = useCallback((code: string) => {
    setScannedCode(code);
    const part = mockParts[code];
    setFoundPart(part || null);
    stopCamera();
  }, [stopCamera]);

  const handleManualSearch = () => {
    const part = Object.values(mockParts).find(
      p => p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
           p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFoundPart(part || null);
  };

  const adjustQuantity = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Cerca Ricambio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="SKU, nome o codice a barre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleManualSearch()}
            />
            <Button onClick={handleManualSearch}>
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={startCamera}>
              <Camera className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Camera Modal */}
      {isScanning && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="relative h-full">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
              <h3 className="text-white font-medium">Scansiona Barcode</h3>
              <Button
                variant="ghost"
                size="icon"
                className="text-white"
                onClick={stopCamera}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Camera */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Scan Frame */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-32 border-2 border-white/50 rounded-lg relative">
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-blue-500" />
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-blue-500" />
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-blue-500" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-blue-500" />
              </div>
            </div>

            {/* Manual Entry */}
            <div className="absolute bottom-8 left-0 right-0 px-4">
              <Input
                placeholder="Digita codice manualmente..."
                className="bg-white/90"
                autoFocus
                onChange={(e) => {
                  if (e.target.value.length >= 12) {
                    handleScan(e.target.value);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Found Part */}
      {foundPart && (
        <Card className={`${foundPart.quantity <= foundPart.min_stock ? "border-red-300 bg-red-50" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <Badge variant="secondary" className="mb-2">{foundPart.sku}</Badge>
                <h3 className="font-semibold text-lg">{foundPart.name}</h3>
                <p className="text-gray-600">{foundPart.brand}</p>
                <p className="text-sm text-gray-500 mt-1">📍 {foundPart.location}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">€{foundPart.sale_price.toFixed(2)}</p>
                <p className={`text-sm font-medium ${
                  foundPart.quantity <= foundPart.min_stock ? "text-red-600" : "text-green-600"
                }`}>
                  Giacenza: {foundPart.quantity} pz
                </p>
                {foundPart.quantity <= foundPart.min_stock && (
                  <Badge variant="destructive" className="mt-1">Scorta bassa!</Badge>
                )}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustQuantity(-1)}
                disabled={quantity <= 1}
              >
                <span className="text-xl">−</span>
              </Button>
              <div className="text-center">
                <p className="text-3xl font-bold">{quantity}</p>
                <p className="text-xs text-gray-500">Quantità</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustQuantity(1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <Button className="flex-1">
                Aggiungi a Ordine
              </Button>
              <Button variant="outline" className="flex-1">
                Preleva Magazzino
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Scans */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Scansioni Recenti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.values(mockParts).slice(0, 3).map((part) => (
              <div 
                key={part.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                onClick={() => setFoundPart(part)}
              >
                <div>
                  <p className="font-medium text-sm">{part.name}</p>
                  <p className="text-xs text-gray-500">{part.sku}</p>
                </div>
                <p className="text-sm font-semibold">€{part.sale_price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

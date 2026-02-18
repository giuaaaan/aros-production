"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader, IScannerControls, BarcodeFormat } from "@zxing/browser";
import { DecodeHintType } from "@zxing/library";
import { Camera, X, Search, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

interface Part {
  id: string;
  sku: string;
  oem_code?: string;
  name: string;
  brand: string;
  location: string;
  quantity: number;
  min_stock: number;
  cost_price: number;
  sale_price: number;
  category: string;
  barcode?: string;
}

export function BarcodeScannerReal() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string>("");
  const [foundPart, setFoundPart] = useState<Part | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<Part[]>([]);
  
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  // Load recent scans on mount
  useEffect(() => {
    loadRecentScans();
  }, []);

  const loadRecentScans = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("parts")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(5);
    
    if (data) setRecentScans(data);
  };

  const startScanner = useCallback(async () => {
    setError(null);
    setIsScanning(true);

    try {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.QR_CODE,
      ]);

      scannerRef.current = new BrowserMultiFormatReader(hints);

      if (videoRef.current) {
        controlsRef.current = await scannerRef.current.decodeFromVideoDevice(
          undefined, // Use default camera (back camera on mobile)
          videoRef.current,
          (result, err) => {
            if (result) {
              const code = result.getText();
              handleBarcodeDetected(code);
            }
            if (err && !(err.name === "NotFoundException")) {
              console.error("Scan error:", err);
            }
          }
        );
      }
    } catch (err) {
      console.error("Failed to start scanner:", err);
      setError("Impossibile avviare la fotocamera. Verifica i permessi.");
      setIsScanning(false);
    }
  }, []);

  const stopScanner = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    if (scannerRef.current) {
      scannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  const handleBarcodeDetected = async (code: string) => {
    setScannedCode(code);
    stopScanner();
    await searchPart(code, "barcode");
  };

  const searchPart = async (query: string, type: "barcode" | "search" = "search") => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Non autorizzato");

      const profile = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();

      let dbQuery = supabase
        .from("parts")
        .select("*")
        .eq("org_id", profile.data?.org_id)
        .eq("is_active", true);

      if (type === "barcode") {
        dbQuery = dbQuery.or(`barcode.eq.${query},sku.eq.${query},oem_code.eq.${query}`);
      } else {
        dbQuery = dbQuery.or(`sku.ilike.%${query}%,name.ilike.%${query}%,oem_code.ilike.%${query}%`);
      }

      const { data, error: dbError } = await dbQuery.limit(10);

      if (dbError) throw dbError;

      if (data && data.length > 0) {
        if (type === "barcode") {
          setFoundPart(data[0]);
          setSearchResults([]);
        } else {
          setSearchResults(data);
          setFoundPart(null);
        }
      } else {
        if (type === "barcode") {
          setError(`Nessun ricambio trovato con codice: ${query}`);
        } else {
          setSearchResults([]);
        }
        setFoundPart(null);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Errore durante la ricerca");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = () => {
    if (searchQuery.trim()) {
      searchPart(searchQuery, "search");
    }
  };

  const adjustQuantity = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const addToWorkOrder = async () => {
    if (!foundPart) return;
    
    // TODO: Integrare con ordine di lavoro attivo
    alert(`Aggiunto ${quantity}x ${foundPart.name} all'ordine`);
    
    // Update recent scans
    setRecentScans((prev) => [foundPart, ...prev.filter((p) => p.id !== foundPart.id).slice(0, 4)]);
  };

  const deductFromStock = async () => {
    if (!foundPart) return;
    
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("parts")
        .update({ quantity: foundPart.quantity - quantity })
        .eq("id", foundPart.id);

      if (error) throw error;

      setFoundPart({ ...foundPart, quantity: foundPart.quantity - quantity });
      alert(`Prelevato ${quantity} pz dal magazzino`);
    } catch (err) {
      alert("Errore durante il prelievo");
    }
  };

  const isLowStock = (part: Part) => part.quantity <= part.min_stock;

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Cerca per SKU, nome, codice OEM o barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleManualSearch()}
              className="flex-1"
            />
            <Button onClick={handleManualSearch} disabled={loading}>
              {loading ? "..." : <Search className="w-4 h-4" />}
            </Button>
            <Button variant="outline" onClick={startScanner} className="bg-blue-50">
              <Camera className="w-4 h-4 mr-2" />
              Scanner
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Supporta: EAN-13, CODE-128, CODE-39, QR Code
          </p>
        </CardContent>
      </Card>

      {/* Scanner Modal */}
      {isScanning && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="relative h-full flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
              <div>
                <h3 className="text-white font-bold text-lg">Scanner Barcode</h3>
                <p className="text-white/70 text-sm">Inquadra il codice a barre</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={stopScanner}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Video */}
            <div className="flex-1 relative">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
              />
              
              {/* Scan overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-72 h-48 border-2 border-blue-400/50 rounded-lg relative">
                  {/* Corner markers */}
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500" />
                  
                  {/* Laser line animation */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500/70 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Manual entry */}
            <div className="absolute bottom-8 left-4 right-4">
              <Input
                placeholder="O digita codice manualmente..."
                className="bg-white/90 border-0"
                autoFocus
                onChange={(e) => {
                  if (e.target.value.length >= 8) {
                    handleBarcodeDetected(e.target.value);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Search Results List */}
      {searchResults.length > 0 && !foundPart && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-gray-700">Risultati ricerca ({searchResults.length})</h3>
          {searchResults.map((part) => (
            <Card
              key={part.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setFoundPart(part)}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <Badge variant="secondary" className="text-xs">{part.sku}</Badge>
                  <h4 className="font-medium">{part.name}</h4>
                  <p className="text-sm text-gray-500">{part.brand} • 📍 {part.location}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">€{part.sale_price.toFixed(2)}</p>
                  <p className={`text-sm ${isLowStock(part) ? "text-red-600 font-bold" : "text-green-600"}`}>
                    Giacenza: {part.quantity}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Found Part Detail */}
      {foundPart && (
        <Card className={`${isLowStock(foundPart) ? "border-red-400 bg-red-50/50" : "border-green-400"}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary">{foundPart.sku}</Badge>
                  {isLowStock(foundPart) && (
                    <Badge variant="destructive" className="animate-pulse">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Scorta bassa!
                    </Badge>
                  )}
                </div>
                <h3 className="text-xl font-bold">{foundPart.name}</h3>
                <p className="text-gray-600">{foundPart.brand}</p>
                {foundPart.oem_code && (
                  <p className="text-sm text-gray-500">OEM: {foundPart.oem_code}</p>
                )}
                <p className="text-sm mt-2">📍 {foundPart.location}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">€{foundPart.sale_price.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Costo: €{foundPart.cost_price.toFixed(2)}</p>
                <div className={`mt-2 p-2 rounded ${isLowStock(foundPart) ? "bg-red-100" : "bg-green-100"}`}>
                  <p className={`text-lg font-bold ${isLowStock(foundPart) ? "text-red-700" : "text-green-700"}`}>
                    {foundPart.quantity} pz
                  </p>
                  <p className="text-xs text-gray-600">Min: {foundPart.min_stock}</p>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustQuantity(-1)}
                disabled={quantity <= 1}
              >
                −
              </Button>
              <div className="text-center min-w-[80px]">
                <p className="text-3xl font-bold">{quantity}</p>
                <p className="text-xs text-gray-500">Quantità</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustQuantity(1)}
                disabled={quantity >= foundPart.quantity}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-6">
              <Button 
                className="flex-1" 
                onClick={addToWorkOrder}
                disabled={quantity > foundPart.quantity}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Aggiungi a Ordine
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={deductFromStock}
                disabled={quantity > foundPart.quantity}
              >
                Preleva Magazzino
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Scansioni Recenti</h3>
            <div className="space-y-2">
              {recentScans.map((part) => (
                <div
                  key={part.id}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                  onClick={() => setFoundPart(part)}
                >
                  <div>
                    <p className="font-medium text-sm">{part.name}</p>
                    <p className="text-xs text-gray-500">{part.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">€{part.sale_price.toFixed(2)}</p>
                    <p className={`text-xs ${isLowStock(part) ? "text-red-600" : "text-green-600"}`}>
                      {part.quantity} pz
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

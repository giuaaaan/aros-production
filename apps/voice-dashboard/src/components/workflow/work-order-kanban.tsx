"use client";

import { useState } from "react";
import { Clock, CheckCircle2, AlertCircle, PauseCircle, ArrowRight, User, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type WorkOrderStatus = 
  | "pending"      // In attesa
  | "in_progress"  // In lavorazione  
  | "waiting_parts" // In attesa ricambi
  | "quality_check" // Controllo qualità
  | "completed"    // Completato
  | "invoiced";    // Fatturato

interface WorkOrder {
  id: string;
  wo_number: string;
  customer: {
    name: string;
    phone: string;
  };
  vehicle: {
    make: string;
    model: string;
    plate: string;
  };
  description: string;
  status: WorkOrderStatus;
  priority: "low" | "normal" | "high" | "urgent";
  assigned_to?: string;
  estimated_hours: number;
  actual_hours: number;
  total_amount: number;
  deadline?: string;
}

const COLUMNS: { id: WorkOrderStatus; label: string; icon: any; color: string }[] = [
  { id: "pending", label: "In Attesa", icon: Clock, color: "bg-gray-100" },
  { id: "in_progress", label: "In Lavorazione", icon: Timer, color: "bg-blue-100" },
  { id: "waiting_parts", label: "Attesa Ricambi", icon: PauseCircle, color: "bg-yellow-100" },
  { id: "quality_check", label: "Controllo Q", icon: AlertCircle, color: "bg-orange-100" },
  { id: "completed", label: "Completati", icon: CheckCircle2, color: "bg-green-100" },
];

const MOCK_ORDERS: WorkOrder[] = [
  {
    id: "1",
    wo_number: "OL-2026-0001",
    customer: { name: "Mario Rossi", phone: "+39 333 1234567" },
    vehicle: { make: "Fiat", model: "Panda", plate: "AB123CD" },
    description: "Cambio olio e filtri, controllo freni",
    status: "in_progress",
    priority: "normal",
    assigned_to: "Marco",
    estimated_hours: 1.5,
    actual_hours: 0.5,
    total_amount: 150,
  },
  {
    id: "2",
    wo_number: "OL-2026-0002",
    customer: { name: "Anna Bianchi", phone: "+39 333 7654321" },
    vehicle: { make: "Volkswagen", model: "Golf", plate: "EF456GH" },
    description: "Sostituzione pastiglie freni anteriori",
    status: "waiting_parts",
    priority: "high",
    assigned_to: "Giuseppe",
    estimated_hours: 2,
    actual_hours: 0,
    total_amount: 280,
  },
  {
    id: "3",
    wo_number: "OL-2026-0003",
    customer: { name: "Luigi Verdi", phone: "+39 333 9876543" },
    vehicle: { make: "Ford", model: "Focus", plate: "IJ789KL" },
    description: "Diagnostica spia motore, test sensori",
    status: "pending",
    priority: "urgent",
    estimated_hours: 1,
    actual_hours: 0,
    total_amount: 80,
  },
];

export function WorkOrderKanban() {
  const [orders, setOrders] = useState<WorkOrder[]>(MOCK_ORDERS);
  const [draggedOrder, setDraggedOrder] = useState<string | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500 text-white";
      case "high": return "bg-orange-500 text-white";
      case "normal": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const handleDragStart = (orderId: string) => {
    setDraggedOrder(orderId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: WorkOrderStatus) => {
    e.preventDefault();
    if (!draggedOrder) return;

    setOrders(prev => prev.map(order => 
      order.id === draggedOrder 
        ? { ...order, status: newStatus }
        : order
    ));
    setDraggedOrder(null);
  };

  const getColumnOrders = (status: WorkOrderStatus) => 
    orders.filter(o => o.status === status);

  return (
    <div className="h-full overflow-x-auto">
      <div className="flex gap-4 min-w-max p-4">
        {COLUMNS.map(column => {
          const columnOrders = getColumnOrders(column.id);
          const Icon = column.icon;
          
          return (
            <div 
              key={column.id}
              className={`w-80 flex-shrink-0 ${column.color} rounded-lg p-3`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-700">{column.label}</h3>
                </div>
                <Badge variant="secondary">{columnOrders.length}</Badge>
              </div>

              {/* Orders */}
              <div className="space-y-3">
                {columnOrders.map(order => (
                  <Card
                    key={order.id}
                    draggable
                    onDragStart={() => handleDragStart(order.id)}
                    className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-3">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm">{order.wo_number}</p>
                          <p className="text-xs text-gray-500">{order.customer.name}</p>
                        </div>
                        <Badge className={`text-xs ${getPriorityColor(order.priority)}`}>
                          {order.priority}
                        </Badge>
                      </div>

                      {/* Vehicle */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <span className="font-medium">{order.vehicle.plate}</span>
                        <span>•</span>
                        <span>{order.vehicle.make} {order.vehicle.model}</span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                        {order.description}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {order.assigned_to || "Non assegnato"}
                        </div>
                        <div className="flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          {order.actual_hours}/{order.estimated_hours}h
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {order.status === "in_progress" && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(order.actual_hours / order.estimated_hours) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="flex gap-2 mt-3">
                        {column.id !== "completed" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-xs"
                          >
                            <ArrowRight className="w-3 h-3 mr-1" />
                            Avanti
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

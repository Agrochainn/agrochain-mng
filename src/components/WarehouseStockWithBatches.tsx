"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  Trash2,
  Edit,
  Package,
  CalendarIcon,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Warehouse,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  stockBatchService,
  StockBatch,
} from "@/lib/services/stock-batch-service";
import { format } from "date-fns";

interface WarehouseStock {
  warehouseId: number;
  warehouseName: string;
  warehouseLocation?: string;
  stockQuantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  stockId?: number;
}

interface WarehouseStockWithBatchesProps {
  variantId: number;
  variantName: string;
  warehouseStocks: WarehouseStock[];
}

interface BatchFormData {
  stockId: number;
  batchNumber: string;
  quantity: number;
  manufactureDate?: string;
  expiryDate?: string;
  supplierName?: string;
  supplierBatchNumber?: string;
}

export function WarehouseStockWithBatches({
  variantId,
  variantName,
  warehouseStocks,
}: WarehouseStockWithBatchesProps) {
  const { toast } = useToast();
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedWarehouses, setExpandedWarehouses] = useState<Set<number>>(
    new Set()
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<StockBatch | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(
    null
  );
  const [formData, setFormData] = useState<BatchFormData>({
    stockId: 0,
    batchNumber: "",
    quantity: 1,
    manufactureDate: "",
    expiryDate: "",
    supplierName: "",
    supplierBatchNumber: "",
  });

  const [formTimes, setFormTimes] = useState({
    manufactureTime: "",
    expiryTime: "",
  });

  // Fetch batches for this variant
  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await stockBatchService.getBatchesByVariantId(variantId);
      setBatches(response);
    } catch (error: any) {
      console.error("Error fetching variant batches:", error);
      toast({
        title: "Error",
        description: "Failed to fetch batches for this variant",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (variantId) {
      fetchBatches();
    }
  }, [variantId]);

  // Group batches by warehouse
  const batchesByWarehouse = batches.reduce((acc, batch) => {
    const warehouseId = batch.warehouseId;
    if (!acc[warehouseId]) {
      acc[warehouseId] = [];
    }
    acc[warehouseId].push(batch);
    return acc;
  }, {} as Record<number, StockBatch[]>);

  const toggleWarehouse = (warehouseId: number) => {
    const newExpanded = new Set(expandedWarehouses);
    if (newExpanded.has(warehouseId)) {
      newExpanded.delete(warehouseId);
    } else {
      newExpanded.add(warehouseId);
    }
    setExpandedWarehouses(newExpanded);
  };

  const handleCreateBatch = async (warehouseId: number) => {
    const warehouse = warehouseStocks.find(
      (w) => w.warehouseId === warehouseId
    );
    if (!warehouse) {
      toast({
        title: "Error",
        description: "Warehouse not found",
        variant: "destructive",
      });
      return;
    }

    setSelectedWarehouseId(warehouseId);
    setFormData({
      stockId: 0,
      batchNumber: "",
      quantity: 1,
      manufactureDate: "",
      expiryDate: "",
      supplierName: "",
      supplierBatchNumber: "",
    });
    setFormTimes({
      manufactureTime: "",
      expiryTime: "",
    });
    setIsCreateModalOpen(true);
  };

  const handleEditBatch = (batch: StockBatch) => {
    setSelectedBatch(batch);
    
    // Extract date and time from the batch data
    const extractDateAndTime = (dateTimeStr: string | null) => {
      if (!dateTimeStr) return { date: "", time: "" };
      
      try {
        const dateObj = new Date(dateTimeStr);
        const date = format(dateObj, "yyyy-MM-dd");
        const time = format(dateObj, "HH:mm");
        return { date, time };
      } catch (error) {
        return { date: "", time: "" };
      }
    };

    const manufactureDateTime = extractDateAndTime(batch.manufactureDate);
    const expiryDateTime = extractDateAndTime(batch.expiryDate);

    setFormData({
      stockId: Number(batch.stockId),
      batchNumber: batch.batchNumber,
      quantity: batch.quantity,
      manufactureDate: manufactureDateTime.date,
      expiryDate: expiryDateTime.date,
      supplierName: batch.supplierName || "",
      supplierBatchNumber: batch.supplierBatchNumber || "",
    });

    setFormTimes({
      manufactureTime: manufactureDateTime.time,
      expiryTime: expiryDateTime.time,
    });

    setIsEditModalOpen(true);
  };

  const handleDeleteBatch = (batch: StockBatch) => {
    setSelectedBatch(batch);
    setIsDeleteModalOpen(true);
  };

  const submitCreateBatch = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (
        !formData.batchNumber ||
        formData.quantity <= 0 ||
        !selectedWarehouseId
      ) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Use the new variant-specific endpoint
      await stockBatchService.createBatchForVariant(
        variantId,
        selectedWarehouseId,
        {
          batchNumber: String(formData.batchNumber).trim(),
          quantity: Number(formData.quantity),
          manufactureDate:
            formData.manufactureDate && formTimes.manufactureTime
              ? `${formData.manufactureDate}T${formTimes.manufactureTime}:00`
              : formData.manufactureDate
              ? `${formData.manufactureDate}T00:00:00`
              : undefined,
          expiryDate:
            formData.expiryDate && formTimes.expiryTime
              ? `${formData.expiryDate}T${formTimes.expiryTime}:00`
              : formData.expiryDate
              ? `${formData.expiryDate}T00:00:00`
              : undefined,
          supplierName: formData.supplierName || undefined,
          supplierBatchNumber: formData.supplierBatchNumber || undefined,
        }
      );

      toast({
        title: "Success",
        description: "Batch created successfully",
      });

      setFormData({
        stockId: 0,
        batchNumber: "",
        quantity: 1,
        manufactureDate: "",
        expiryDate: "",
        supplierName: "",
        supplierBatchNumber: "",
      });
      setFormTimes({
        manufactureTime: "",
        expiryTime: "",
      });
      setIsCreateModalOpen(false);
      setSelectedWarehouseId(null);
      await fetchBatches();
    } catch (error: any) {
      console.error("Error creating batch:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to create batch",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitEditBatch = async () => {
    if (!selectedBatch) return;

    try {
      setLoading(true);

      await stockBatchService.updateBatch(selectedBatch.id, {
        batchNumber: String(formData.batchNumber).trim(),
        quantity: Number(formData.quantity),
        manufactureDate:
          formData.manufactureDate && formTimes.manufactureTime
            ? `${formData.manufactureDate}T${formTimes.manufactureTime}:00`
            : formData.manufactureDate
            ? `${formData.manufactureDate}T00:00:00`
            : undefined,
        expiryDate:
          formData.expiryDate && formTimes.expiryTime
            ? `${formData.expiryDate}T${formTimes.expiryTime}:00`
            : formData.expiryDate
            ? `${formData.expiryDate}T00:00:00`
            : undefined,
        supplierName: formData.supplierName || undefined,
        supplierBatchNumber: formData.supplierBatchNumber || undefined,
      });

      toast({
        title: "Success",
        description: "Batch updated successfully",
      });

      setIsEditModalOpen(false);
      setSelectedBatch(null);
      await fetchBatches();
    } catch (error: any) {
      console.error("Error updating batch:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to update batch",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitDeleteBatch = async () => {
    if (!selectedBatch) return;

    try {
      setLoading(true);

      await stockBatchService.deleteBatch(selectedBatch.id);

      toast({
        title: "Success",
        description: "Batch deleted successfully",
      });

      setIsDeleteModalOpen(false);
      setSelectedBatch(null);
      await fetchBatches();
    } catch (error: any) {
      console.error("Error deleting batch:", error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to delete batch",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getBatchStatusBadge = (batch: StockBatch) => {
    if (batch.isRecalled) {
      return (
        <Badge variant="destructive" className="text-xs">
          <XCircle className="w-3 h-3 mr-1" />
          Recalled
        </Badge>
      );
    }
    if (batch.isExpired) {
      return (
        <Badge variant="destructive" className="text-xs">
          <XCircle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    }
    if (batch.isEmpty) {
      return (
        <Badge variant="secondary" className="text-xs">
          <Package className="w-3 h-3 mr-1" />
          Empty
        </Badge>
      );
    }
    if (batch.isExpiringSoon) {
      return (
        <Badge
          variant="outline"
          className="text-xs text-yellow-600 border-yellow-200"
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          Expiring Soon
        </Badge>
      );
    }
    if (batch.isAvailable) {
      return (
        <Badge
          variant="outline"
          className="text-xs text-green-600 border-green-200"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs">
        <Clock className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  return (
    <div className="space-y-3">
      {warehouseStocks.map((stock) => {
        const warehouseBatches = batchesByWarehouse[stock.warehouseId] || [];
        const isExpanded = expandedWarehouses.has(stock.warehouseId);
        const totalBatchQuantity = warehouseBatches.reduce(
          (sum, batch) => sum + batch.quantity,
          0
        );
        const activeBatches = warehouseBatches.filter(
          (batch) => batch.isAvailable
        );

        return (
          <div
            key={stock.warehouseId}
            className="border rounded-md overflow-hidden"
          >
            <Collapsible>
              <CollapsibleTrigger asChild>
                <div
                  className="flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => toggleWarehouse(stock.warehouseId)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Warehouse className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-medium text-sm">
                        {stock.warehouseName}
                      </div>
                      {stock.warehouseLocation && (
                        <div className="text-xs text-muted-foreground">
                          {stock.warehouseLocation}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div
                        className={`font-semibold text-sm ${
                          stock.isLowStock
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {stock.stockQuantity} units
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Threshold: {stock.lowStockThreshold}
                      </div>
                    </div>

                    {warehouseBatches.length > 0 && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-blue-600">
                          {warehouseBatches.length} batch
                          {warehouseBatches.length !== 1 ? "es" : ""}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {activeBatches.length} active
                        </div>
                      </div>
                    )}

                    <div
                      className={`w-3 h-3 rounded-full ${
                        stock.isLowStock ? "bg-yellow-500" : "bg-green-500"
                      }`}
                    />
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                {isExpanded && (
                  <div className="p-4 border-t bg-background">
                    <div className="flex items-center justify-between mb-4">
                      <h6 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        Stock Batches
                      </h6>
                      <Button
                        size="sm"
                        onClick={() => handleCreateBatch(stock.warehouseId)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Batch
                      </Button>
                    </div>

                    {warehouseBatches.length > 0 ? (
                      <div className="space-y-3">
                        {warehouseBatches.map((batch) => (
                          <div
                            key={batch.id}
                            className="flex items-center justify-between p-3 bg-muted/10 rounded-md border hover:bg-muted/20 transition-colors"
                          >
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-sm">
                                  {batch.batchNumber}
                                </span>
                                {getBatchStatusBadge(batch)}
                                <span className="text-sm font-semibold text-blue-600">
                                  {batch.quantity} units
                                </span>
                              </div>

                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditBatch(batch)}
                                className="text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteBatch(batch)}
                                className="text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-md">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No batches found</p>
                        <p className="text-xs mb-4">
                          Create your first batch to track inventory
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreateBatch(stock.warehouseId)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Batch
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        );
      })}

      {/* Create Batch Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Batch</DialogTitle>
            <DialogDescription>
              Create a new stock batch for {variantName} in{" "}
              {
                warehouseStocks.find(
                  (w) => w.warehouseId === selectedWarehouseId
                )?.warehouseName
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="batchNumber">Batch Number *</Label>
              <Input
                id="batchNumber"
                value={formData.batchNumber}
                onChange={(e) =>
                  setFormData({ ...formData, batchNumber: e.target.value })
                }
                placeholder="Enter batch number"
              />
            </div>

            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <Label htmlFor="manufactureDate">Manufacture Date</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !formData.manufactureDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.manufactureDate ? (
                        format(new Date(formData.manufactureDate), "PPP")
                      ) : (
                        <span>Pick a date (optional)</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={
                        formData.manufactureDate
                          ? new Date(formData.manufactureDate)
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          const dateStr = format(date, "yyyy-MM-dd");
                          setFormData({
                            ...formData,
                            manufactureDate: dateStr,
                          });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={formTimes.manufactureTime}
                  onChange={(e) =>
                    setFormTimes({
                      ...formTimes,
                      manufactureTime: e.target.value,
                    })
                  }
                  className="w-32"
                  placeholder="Time (optional)"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !formData.expiryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expiryDate ? (
                        format(new Date(formData.expiryDate), "PPP")
                      ) : (
                        <span>Pick a date (optional)</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={
                        formData.expiryDate
                          ? new Date(formData.expiryDate)
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          const dateStr = format(date, "yyyy-MM-dd");
                          setFormData({
                            ...formData,
                            expiryDate: dateStr,
                          });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={formTimes.expiryTime}
                  onChange={(e) =>
                    setFormTimes({
                      ...formTimes,
                      expiryTime: e.target.value,
                    })
                  }
                  className="w-32"
                  placeholder="Time (optional)"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="supplierName">Supplier Name</Label>
              <Input
                id="supplierName"
                value={formData.supplierName}
                onChange={(e) =>
                  setFormData({ ...formData, supplierName: e.target.value })
                }
                placeholder="Enter supplier name"
              />
            </div>

            <div>
              <Label htmlFor="supplierBatchNumber">Supplier Batch Number</Label>
              <Input
                id="supplierBatchNumber"
                value={formData.supplierBatchNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    supplierBatchNumber: e.target.value,
                  })
                }
                placeholder="Enter supplier batch number"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={submitCreateBatch} disabled={loading}>
              {loading ? "Creating..." : "Create Batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Batch Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
            <DialogDescription>
              Update batch information for {selectedBatch?.batchNumber} in{" "}
              {
                warehouseStocks.find(
                  (w) => w.warehouseId === selectedBatch?.stockId
                )?.warehouseName
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="editBatchNumber">Batch Number *</Label>
              <Input
                id="editBatchNumber"
                value={formData.batchNumber}
                onChange={(e) =>
                  setFormData({ ...formData, batchNumber: e.target.value })
                }
                placeholder="Enter batch number"
              />
            </div>

            <div>
              <Label htmlFor="editQuantity">Quantity *</Label>
              <Input
                id="editQuantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <Label htmlFor="editManufactureDate">Manufacture Date</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !formData.manufactureDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.manufactureDate ? (
                        format(new Date(formData.manufactureDate), "PPP")
                      ) : (
                        <span>Pick a date (optional)</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={
                        formData.manufactureDate
                          ? new Date(formData.manufactureDate)
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          const dateStr = format(date, "yyyy-MM-dd");
                          setFormData({
                            ...formData,
                            manufactureDate: dateStr,
                          });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={formTimes.manufactureTime}
                  onChange={(e) =>
                    setFormTimes({
                      ...formTimes,
                      manufactureTime: e.target.value,
                    })
                  }
                  className="w-32"
                  placeholder="Time (optional)"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="editExpiryDate">Expiry Date</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !formData.expiryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expiryDate ? (
                        format(new Date(formData.expiryDate), "PPP")
                      ) : (
                        <span>Pick a date (optional)</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={
                        formData.expiryDate
                          ? new Date(formData.expiryDate)
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          const dateStr = format(date, "yyyy-MM-dd");
                          setFormData({
                            ...formData,
                            expiryDate: dateStr,
                          });
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={formTimes.expiryTime}
                  onChange={(e) =>
                    setFormTimes({
                      ...formTimes,
                      expiryTime: e.target.value,
                    })
                  }
                  className="w-32"
                  placeholder="Time (optional)"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="editSupplierName">Supplier Name</Label>
              <Input
                id="editSupplierName"
                value={formData.supplierName}
                onChange={(e) =>
                  setFormData({ ...formData, supplierName: e.target.value })
                }
                placeholder="Enter supplier name"
              />
            </div>

            <div>
              <Label htmlFor="editSupplierBatchNumber">Supplier Batch Number</Label>
              <Input
                id="editSupplierBatchNumber"
                value={formData.supplierBatchNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    supplierBatchNumber: e.target.value,
                  })
                }
                placeholder="Enter supplier batch number"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={submitEditBatch} disabled={loading}>
              {loading ? "Updating..." : "Update Batch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Batch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete batch "
              {selectedBatch?.batchNumber}"? This action cannot be undone and
              will remove {selectedBatch?.quantity} units from inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitDeleteBatch}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete Batch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

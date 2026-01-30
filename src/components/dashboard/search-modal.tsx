"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { productService } from "@/lib/services/product-service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Home,
  Package,
  ShoppingCart,
  Users,
  Settings,
  BarChart3,
  Layers,
  Mail,
  TagIcon,
  MapPin,
  Gift,
  Warehouse,
  Truck,
  Percent,
  Plus,
  Command,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCategory?: () => void;
  onCreateBrand?: () => void;
}

interface SearchItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  action?: () => void;
  category: string;
  keywords: string[];
}

export function SearchModal({
  isOpen,
  onOpenChange,
  onCreateCategory,
  onCreateBrand,
}: SearchModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Define all searchable items
  const searchItems: SearchItem[] = [
    // Navigation Items
    {
      id: "dashboard",
      title: "Dashboard",
      description: "Main dashboard overview",
      icon: Home,
      href: "/dashboard",
      category: "Navigation",
      keywords: ["dashboard", "home", "overview", "main"],
    },
    {
      id: "products",
      title: "Products",
      description: "Manage products and inventory",
      icon: Package,
      href: "/dashboard/products",
      category: "Navigation",
      keywords: ["products", "inventory", "items", "manage"],
    },
    {
      id: "orders",
      title: "Orders",
      description: "View and manage orders",
      icon: ShoppingCart,
      href: "/dashboard/orders",
      category: "Navigation",
      keywords: ["orders", "purchases", "transactions"],
    },
    {
      id: "invitations",
      title: "Invitations",
      description: "Manage admin invitations",
      icon: Mail,
      href: "/dashboard/invitations",
      category: "Navigation",
      keywords: ["invitations", "invite", "admin", "users"],
    },
    {
      id: "categories",
      title: "Categories",
      description: "Manage product categories",
      icon: TagIcon,
      href: "/dashboard/categories",
      category: "Navigation",
      keywords: ["categories", "tags", "classification"],
    },
    {
      id: "discounts",
      title: "Discounts",
      description: "Manage discounts and promotions",
      icon: Percent,
      href: "/dashboard/discounts",
      category: "Navigation",
      keywords: ["discounts", "promotions", "sales", "offers"],
    },
    {
      id: "warehouses",
      title: "Warehouses",
      description: "Manage warehouse locations",
      icon: Warehouse,
      href: "/dashboard/warehouses",
      category: "Navigation",
      keywords: ["warehouses", "storage", "locations"],
    },
    {
      id: "shipping-costs",
      title: "Shipping Costs",
      description: "Manage shipping rates",
      icon: Truck,
      href: "/dashboard/shipping-costs",
      category: "Navigation",
      keywords: ["shipping", "delivery", "costs", "rates"],
    },
    {
      id: "reward-system",
      title: "Reward System",
      description: "Manage customer rewards",
      icon: Gift,
      href: "/dashboard/reward-system",
      category: "Navigation",
      keywords: ["rewards", "points", "loyalty", "gifts"],
    },
    {
      id: "analytics",
      title: "Analytics",
      description: "View analytics and reports",
      icon: BarChart3,
      href: "/dashboard/analytics",
      category: "Navigation",
      keywords: ["analytics", "reports", "statistics", "data"],
    },
    {
      id: "settings",
      title: "Settings",
      description: "System and user settings",
      icon: Settings,
      href: "/dashboard/settings",
      category: "Navigation",
      keywords: ["settings", "configuration", "preferences"],
    },

    // Quick Actions
    {
      id: "create-product",
      title: "Create Product",
      description: "Add a new product to inventory",
      icon: Plus,
      action: async () => {
        try {
          const response = await productService.createEmptyProduct(
            "New Product"
          );
          router.push(`/dashboard/products/${response.productId}/update`);
        } catch (error) {
          console.error("Error creating product:", error);
        }
      },
      category: "Quick Actions",
      keywords: ["create", "add", "new", "product"],
    },
    {
      id: "create-category",
      title: "Create Category",
      description: "Add a new product category",
      icon: Plus,
      action: () => {
        onCreateCategory?.();
      },
      category: "Quick Actions",
      keywords: ["create", "add", "new", "category"],
    },
    {
      id: "create-brand",
      title: "Create Brand",
      description: "Add a new brand",
      icon: Plus,
      action: () => {
        onCreateBrand?.();
      },
      category: "Quick Actions",
      keywords: ["create", "add", "new", "brand"],
    },
  ];

  // Filter items based on search query
  const filteredItems = searchItems.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.keywords.some((keyword) => keyword.includes(query))
    );
  });

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = filteredItems.length;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selectedItem = filteredItems[selectedIndex];
      if (selectedItem) {
        handleItemClick(selectedItem);
      }
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  const handleItemClick = (item: SearchItem) => {
    if (item.href) {
      router.push(item.href);
      onOpenChange(false);
    } else if (item.action) {
      item.action();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Quick Search
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search pages, actions, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-10"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
              <Command className="h-3 w-3" />
              <span>K</span>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {Object.keys(groupedItems).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No results found</p>
                <p className="text-sm">Try searching for pages or actions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">
                      {category}
                    </h3>
                    <div className="space-y-1">
                      {items.map((item, index) => {
                        const globalIndex = filteredItems.findIndex(
                          (filteredItem) => filteredItem.id === item.id
                        );
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <Button
                            key={item.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start h-auto p-3",
                              isSelected && "bg-accent"
                            )}
                            onClick={() => handleItemClick(item)}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <item.icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 text-left">
                                <div className="font-medium">{item.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {item.description}
                                </div>
                              </div>
                              {item.category === "Quick Actions" && (
                                <Badge variant="secondary" className="text-xs">
                                  Action
                                </Badge>
                              )}
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Use ↑↓ to navigate, Enter to select</span>
              <span>ESC to close</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export interface TurnoverCategory {
  id: string;
  name: string;
  turnoverRate: number;
  unitsSold: number;
  performance: "EXCELLENT" | "GOOD" | "AVERAGE" | "POOR";
}

export interface ABCProduct {
  id: string;
  name: string;
  value: number;
  percentage: number;
}

export interface InventoryTurnoverData {
  period: {
    start_date: string;
    end_date: string;
  };
  overall: {
    turnover_rate: number;
    turnover_rate_change: number; // percentage
    days_of_inventory: number;
    days_of_inventory_change: number; // percentage
  };
  by_category: TurnoverCategory[];
  abc_class_a: ABCProduct[];
}

export const mockInventoryABCData: InventoryTurnoverData = {
  period: {
    start_date: "2026-02-01",
    end_date: "2026-02-28",
  },
  overall: {
    turnover_rate: 5.4,
    turnover_rate_change: 12.5,
    days_of_inventory: 67,
    days_of_inventory_change: -4.2,
  },
  by_category: [
    {
      id: "cat_1",
      name: "Electrónica",
      turnoverRate: 8.2,
      unitsSold: 1240,
      performance: "EXCELLENT",
    },
    {
      id: "cat_2",
      name: "Hogar y Jardín",
      turnoverRate: 5.1,
      unitsSold: 890,
      performance: "GOOD",
    },
    {
      id: "cat_3",
      name: "Indumentaria",
      turnoverRate: 4.3,
      unitsSold: 2100,
      performance: "GOOD",
    },
    {
      id: "cat_4",
      name: "Alimentos",
      turnoverRate: 1.8,
      unitsSold: 450,
      performance: "POOR",
    },
    {
      id: "cat_5",
      name: "Herramientas",
      turnoverRate: 2.4,
      unitsSold: 310,
      performance: "POOR",
    },
  ],
  abc_class_a: [
    {
      id: "prod_1",
      name: 'Smartphone X1 Pro',
      value: 450000000,
      percentage: 45,
    },
    {
      id: "prod_2",
      name: 'Laptop Ultra Slim 15"',
      value: 280000000,
      percentage: 25,
    },
    {
      id: "prod_3",
      name: 'Monitor 4K Industrial',
      value: 115000000,
      percentage: 10,
    },
  ]
};

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Award, 
  AlertTriangle, 
  Filter, 
  Columns, 
  ArrowUpDown, 
  Share2, 
  Download, 
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

// Mock Data
const PRODUCTS_DATA = [
  {
    id: 'SKU-10294',
    name: 'Wireless Headphones X2',
    category: 'Electronics',
    price: 299.00,
    unitsSold: 1240,
    revenue: 370760,
    status: 'In Stock',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80'
  },
  {
    id: 'SKU-45001',
    name: 'Ergo Chair Pro',
    category: 'Furniture',
    price: 450.00,
    unitsSold: 850,
    revenue: 382500,
    status: 'Low Stock',
    trend: 'stable',
    image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=100&q=80'
  },
  {
    id: 'SKU-88321',
    name: 'Mechanical Keychron',
    category: 'Accessories',
    price: 149.00,
    unitsSold: 2100,
    revenue: 312900,
    status: 'In Stock',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b91add1?w=100&q=80'
  },
  {
    id: 'SKU-77221',
    name: 'Smart Hub Mini',
    category: 'Electronics',
    price: 49.00,
    unitsSold: 5400,
    revenue: 264600,
    status: 'Out of Stock',
    trend: 'down',
    image: 'https://images.unsplash.com/photo-1558089687-f282ffcbc0d5?w=100&q=80'
  },
  {
    id: 'SKU-30022',
    name: 'UltraView 4K Monitor',
    category: 'Electronics',
    price: 599.00,
    unitsSold: 320,
    revenue: 191680,
    status: 'In Stock',
    trend: 'up',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=100&q=80'
  }
];

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0, // Design shows no cents for revenue in table
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPrice = (value) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
};

const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
};

const getBadgeVariant = (category) => {
  switch (category) {
    case 'Electronics': return 'subtle-info';
    case 'Furniture': return 'subtle-warning';
    case 'Accessories': return 'secondary';
    default: return 'subtle-info';
  }
};

// Simple Sparkline SVG Component
const Sparkline = ({ type }) => {
  let path = "";
  let color = "#137fec"; // Primary

  if (type === 'up') {
    path = "M0 15 L10 12 L20 18 L30 8 L40 10 L50 5 L60 2";
    color = "#137fec";
  } else if (type === 'down') {
    path = "M0 5 L10 8 L20 6 L30 10 L40 12 L50 15 L60 18";
    color = "#ef4444"; // Error
  } else {
    path = "M0 10 L10 10 L20 10 L30 10 L40 10 L50 10 L60 10";
    color = "#6b7280"; // Gray
    return (
        <svg fill="none" height="20" stroke={color} strokeWidth="2" viewBox="0 0 60 20" width="60">
             <path d={path} strokeDasharray="2 2"></path>
        </svg>
    )
  }

  return (
    <svg fill="none" height="20" stroke={color} strokeWidth="2" viewBox="0 0 60 20" width="60">
      <path d={path} strokeLinecap="round" strokeLinejoin="round"></path>
    </svg>
  );
};

const TopProductsOverview = () => {
  return (
    <div className="top-products">
      {/* Page Header */}
      <header className="top-products__header">
        <div className="top-products__header-title-group">
          <h1 className="top-products__header-title">Top Products Performance</h1>
          <p className="top-products__header-subtitle">Last 30 Days | Overview of top performing SKUs</p>
        </div>
        <div>
          <Button variant="outline" className="font-bold">
            Customize View
          </Button>
        </div>
      </header>

      {/* KPI Stats Grid */}
      <div className="top-products__stats-grid">
        {/* Total Revenue */}
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__title">Total Revenue</span>
            <div className="kpi-card__icon kpi-card__icon--success">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="kpi-card__content">
            <span className="kpi-card__value">$1.2M</span>
            <span className="kpi-card__trend kpi-card__trend--positive">+12% vs prev</span>
          </div>
          <div className="kpi-card__progress">
            <div className="kpi-card__progress-bar" style={{ width: '75%' }}></div>
          </div>
        </div>

        {/* Top Performer */}
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__title">Top Performer</span>
            <div className="kpi-card__icon kpi-card__icon--primary">
              <Award size={20} />
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-2">
             <span className="kpi-card__value text-3xl truncate">Headphones X2</span>
             <span className="kpi-card__footer">Electronics • 1,240 Units Sold</span>
          </div>
        </div>

        {/* Inventory Alerts */}
        <div className="kpi-card">
          <div className="kpi-card__header">
            <span className="kpi-card__title">Inventory Alerts</span>
            <div className="kpi-card__icon kpi-card__icon--warning">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="kpi-card__content">
            <span className="kpi-card__value">3 Products</span>
            <span className="kpi-card__trend kpi-card__trend--warning">Low Stock</span>
          </div>
          <span className="kpi-card__footer">Requires immediate reordering</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="top-products__table-container">
        {/* Toolbar */}
        <div className="top-products__toolbar">
          <div className="top-products__toolbar-group">
            <Button variant="ghost" className="gap-2">
                <Filter size={20} />
                Filter
            </Button>
            <Button variant="ghost" className="gap-2">
                <Columns size={20} />
                Columns
            </Button>
            <Button variant="ghost" className="gap-2">
                <ArrowUpDown size={20} />
                Sort
            </Button>
          </div>
          <div className="top-products__toolbar-group">
            <Button variant="ghost" size="icon">
                <Share2 size={20} />
            </Button>
            <Button variant="primary" className="gap-2 font-bold">
                <Download size={18} />
                Export to Excel
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold tracking-wider">Product Name</TableHead>
              <TableHead className="uppercase text-xs font-semibold tracking-wider">Category</TableHead>
              <TableHead className="uppercase text-xs font-semibold tracking-wider text-right">Price</TableHead>
              <TableHead className="uppercase text-xs font-semibold tracking-wider text-right">Units Sold</TableHead>
              <TableHead className="uppercase text-xs font-semibold tracking-wider text-right">Revenue</TableHead>
              <TableHead className="uppercase text-xs font-semibold tracking-wider">Status</TableHead>
              <TableHead className="uppercase text-xs font-semibold tracking-wider text-center">Trend (7d)</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PRODUCTS_DATA.map((product) => (
              <TableRow key={product.id} className="group cursor-pointer">
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <div className="product-cell">
                    <div 
                        className="product-cell__image" 
                        style={{ backgroundImage: `url(${product.image})` }}
                    ></div>
                    <div className="product-cell__info">
                      <span className="product-cell__name">{product.name}</span>
                      <span className="product-cell__sku">{product.id}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(product.category)} className="font-medium">
                    {product.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                    {formatPrice(product.price)}
                </TableCell>
                <TableCell className="text-right font-mono font-medium">
                    {formatNumber(product.unitsSold)}
                </TableCell>
                <TableCell className="text-right font-mono font-bold">
                    {formatCurrency(product.revenue)}
                </TableCell>
                <TableCell>
                  <div className="status-indicator">
                    <div className={`status-indicator__dot status-indicator__dot--${product.status === 'In Stock' ? 'success' : product.status === 'Low Stock' ? 'warning' : 'error'}`}></div>
                    <span className={`status-indicator__text status-indicator__text--${product.status === 'In Stock' ? 'success' : product.status === 'Low Stock' ? 'warning' : 'error'}`}>
                        {product.status}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                   <div className="sparkline">
                     <Sparkline type={product.trend} />
                   </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={20} className="text-secondary" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="top-products__pagination">
            <div className="text-sm text-secondary">
                Showing 1 to 5 of 58 results
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                    Previous
                </Button>
                <Button variant="outline" size="sm">
                    Next
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TopProductsOverview;

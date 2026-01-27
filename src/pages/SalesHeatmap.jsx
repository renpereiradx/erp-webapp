import React, { useState } from 'react'
import { 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Receipt, 
  Store, 
  AlertTriangle,
  TrendingDown,
  Flag,
  UserPlus,
  Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Mock Data
const kpiData = [
  {
    title: 'Total Revenue',
    value: '$124,500',
    trend: '+12.5% vs last week',
    trendDirection: 'up',
    icon: DollarSign,
    color: 'primary'
  },
  {
    title: 'Busiest Hour',
    value: 'Fri 6 PM',
    subtext: 'Peak volume: 428 txns',
    icon: Clock,
    color: 'orange'
  },
  {
    title: 'Avg Transaction',
    value: '$45.20',
    trend: '+2.5%',
    trendDirection: 'up',
    icon: Receipt,
    color: 'purple'
  },
  {
    title: 'Active Stores',
    value: '14/15',
    trend: '1 Offline (NY-04)',
    trendDirection: 'down',
    icon: Store,
    color: 'blue'
  }
]

const activityFeed = [
  {
    id: 1,
    text: 'Unexpected sales dip detected in New York branch.',
    time: '25 mins ago',
    icon: TrendingDown,
    color: 'red'
  },
  {
    id: 2,
    text: 'Target reached for Q3: Sales exceeded $1.2M.',
    time: '2 hours ago',
    icon: Flag,
    color: 'emerald'
  },
  {
    id: 3,
    text: 'New Store Manager assigned to Tokyo Downtown.',
    time: '5 hours ago',
    icon: UserPlus,
    color: 'blue'
  },
  {
    id: 4,
    text: 'Inventory Restock initiated for Electronics category.',
    time: 'Yesterday',
    icon: Package,
    color: 'purple'
  }
]

const hours = [
  '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM'
]

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Generate pseudo-random intensity for the heatmap
const getIntensity = (day, hourIndex) => {
  // Friday (4) and Saturday (5) are busier
  // Evenings (17-19 / index 9-11) are busier
  let base = Math.random() * 0.3
  if (day === 4 || day === 5) base += 0.3
  if (hourIndex >= 9 && hourIndex <= 11) base += 0.4
  
  if (base > 0.9) return '$$$' // High
  if (base > 0.6) return '$$'  // Medium
  return ''                    // Low
}

const getOpacity = (intensity) => {
  if (intensity === '$$$') return 0.9
  if (intensity === '$$') return 0.6
  return 0.1 + Math.random() * 0.2
}

const SalesHeatmap = () => {
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')

  return (
    <div className="sales-heatmap">
      {/* Header */}
      <div className="sales-heatmap__header">
        <div className="sales-heatmap__title-group">
          <h1>Sales by Hour Heatmap</h1>
          <p>Visualizing peak trading times and sales intensity across all branches.</p>
        </div>
        <div className="sales-heatmap__actions">
          <span>Last updated: Just now</span>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="sales-heatmap__kpi-grid">
        {kpiData.map((kpi, index) => (
          <div key={index} className="kpi-card">
            <div className="kpi-card__header">
              <p>{kpi.title}</p>
              <div className={`kpi-card__icon kpi-card__icon--${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="kpi-card__value">{kpi.value}</div>
            {(kpi.trend || kpi.subtext) && (
              <div className={`kpi-card__trend kpi-card__trend--${kpi.trendDirection || 'neutral'}`}>
                {kpi.trendDirection === 'up' && <TrendingUp className="h-4 w-4" />}
                {kpi.trendDirection === 'down' && <AlertTriangle className="h-4 w-4" />}
                <span>{kpi.trend || kpi.subtext}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main Layout */}
      <div className="sales-heatmap__main-layout">
        
        {/* Heatmap Section */}
        <div className="sales-heatmap__heatmap-section">
          
          {/* Controls */}
          <div className="sales-heatmap__controls">
            <div className="sales-heatmap__date-nav">
              <button><ChevronLeft className="h-5 w-5" /></button>
              <span>Oct 23 - Oct 29, 2023</span>
              <button><ChevronRight className="h-5 w-5" /></button>
            </div>

            <div className="sales-heatmap__filters">
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="ny">New York</SelectItem>
                  <SelectItem value="ldn">London</SelectItem>
                  <SelectItem value="tky">Tokyo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="elec">Electronics</SelectItem>
                  <SelectItem value="home">Home Goods</SelectItem>
                  <SelectItem value="cloth">Clothing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Visualization */}
          <div className="heatmap-grid">
            <div className="heatmap-grid__legend">
              <span>Low Intensity</span>
              <div className="heatmap-grid__gradient-bar"></div>
              <span>High Intensity</span>
            </div>

            <div className="heatmap-grid__container">
              {/* Header Row */}
              <div className="h-8"></div> {/* Empty corner */}
              {hours.map(hour => (
                <div key={hour} className="heatmap-grid__header-cell">{hour}</div>
              ))}

              {/* Data Rows */}
              {days.map((day, dIndex) => (
                <React.Fragment key={day}>
                  <div className="heatmap-grid__row-label">{day}</div>
                  {hours.map((_, hIndex) => {
                    const intensity = getIntensity(dIndex, hIndex)
                    const opacity = getOpacity(intensity)
                    // We use inline style for opacity to simulate data-driven intensity
                    return (
                      <div 
                        key={`${day}-${hIndex}`} 
                        className="heatmap-grid__cell"
                        style={{ 
                          backgroundColor: `rgba(19, 127, 236, ${opacity})`, // Using primary color RGB approx
                        }}
                      >
                        {intensity === '$$$' || intensity === '$$' ? intensity : ''}
                      </div>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

        </div>

        {/* Sidebar Section */}
        <div className="sales-heatmap__sidebar">
          
          {/* Activity Feed */}
          <div className="activity-feed">
            <div className="activity-feed__header">
              <h3>Recent Activity</h3>
              <button>View All</button>
            </div>
            <div className="activity-feed__list">
              {activityFeed.map(item => (
                <div key={item.id} className="activity-feed__item">
                  <div className={`activity-feed__icon activity-feed__icon--${item.color}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="activity-feed__content">
                    <p>{item.text}</p>
                    <span>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map Widget */}
          <div className="map-widget">
            <div className="map-widget__header">
              <h3>Active Regions</h3>
            </div>
            <div className="map-widget__content">
              {/* Placeholder for map */}
              <img 
                src="https://placehold.co/300x200/e2e8f0/64748b?text=Map+Visualization" 
                alt="World Map" 
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
              />
              <Button 
                variant="secondary" 
                size="sm" 
                className="absolute shadow-lg"
              >
                View Full Map
              </Button>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

export default SalesHeatmap

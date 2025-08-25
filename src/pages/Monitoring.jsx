/**
 * Monitoring Page
 * Wave 7: Observability & Monitoring
 * 
 * Dedicated page for system monitoring and observability
 */

import React from 'react';
import { ObservabilityDashboard } from '@/components/Observability';
import { Helmet } from 'react-helmet-async';

const MonitoringPage = () => {
  return (
    <>
      <Helmet>
        <title>System Monitoring - Sales ERP</title>
        <meta name="description" content="Real-time system monitoring, performance tracking, and observability dashboard" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <ObservabilityDashboard />
      </div>
    </>
  );
};

export default MonitoringPage;

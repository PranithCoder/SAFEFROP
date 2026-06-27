import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Operations from './components/Operations';
import CRM from './components/CRM';
import B2BContracts from './components/B2BContracts';
import Marketing from './components/Marketing';
import Inventory from './components/Inventory';
import StaffManagement from './components/StaffManagement';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'operations':
        return <Operations />;
      case 'crm':
        return <CRM />;
      case 'staff':
        return <StaffManagement />;
      case 'b2b':
        return <B2BContracts />;
      case 'marketing':
        return <Marketing />;
      case 'inventory':
        return <Inventory />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;

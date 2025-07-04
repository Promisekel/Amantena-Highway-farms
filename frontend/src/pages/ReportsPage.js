import React, { useState, useEffect } from 'react';
import { salesAPI as salesApi } from '../utils/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { 
  ChartBarIcon, 
  DocumentChartBarIcon, 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const ReportsPage = () => {
  const [reports, setReports] = useState({
    salesSummary: null,
    topProducts: [],
    monthlySales: [],
    loading: true
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    try {
      setReports(prev => ({ ...prev, loading: true }));
      
      // Fetch sales data for the date range
      const salesResponse = await salesApi.getSales();
      const allSales = salesResponse.data || [];
      
      // Filter sales by date range
      const filteredSales = allSales.filter(sale => {
        const saleDate = new Date(sale.createdAt).toISOString().split('T')[0];
        return saleDate >= dateRange.startDate && saleDate <= dateRange.endDate;
      });

      // Calculate sales summary
      const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const totalTransactions = filteredSales.length;
      const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Calculate top products
      const productSales = {};
      filteredSales.forEach(sale => {
        sale.saleItems?.forEach(item => {
          const productName = item.product?.name || 'Unknown Product';
          if (!productSales[productName]) {
            productSales[productName] = { quantity: 0, revenue: 0 };
          }
          productSales[productName].quantity += item.quantity;
          productSales[productName].revenue += item.quantity * item.unitPrice;
        });
      });

      const topProducts = Object.entries(productSales)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Calculate monthly sales for the year
      const currentYear = new Date().getFullYear();
      const monthlySales = Array.from({ length: 12 }, (_, month) => {
        const monthSales = allSales.filter(sale => {
          const saleDate = new Date(sale.createdAt);
          return saleDate.getFullYear() === currentYear && saleDate.getMonth() === month;
        });
        return {
          month: new Date(currentYear, month, 1).toLocaleDateString('en-US', { month: 'short' }),
          revenue: monthSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
          transactions: monthSales.length
        };
      });

      setReports({
        salesSummary: {
          totalRevenue,
          totalTransactions,
          averageOrderValue
        },
        topProducts,
        monthlySales,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports(prev => ({ ...prev, loading: false }));
    }
  };

  if (reports.loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex space-x-4">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      {/* Sales Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${reports.salesSummary?.totalRevenue?.toFixed(2) || '0.00'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {reports.salesSummary?.totalTransactions || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Average Order Value</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${reports.salesSummary?.averageOrderValue?.toFixed(2) || '0.00'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-green-600" />
              Top Products
            </h3>
          </div>
          <div className="p-6">
            {reports.topProducts.length > 0 ? (
              <div className="space-y-4">
                {reports.topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-800 text-xs font-medium rounded-full flex items-center justify-center mr-3">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.quantity} units sold</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      ${product.revenue.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No sales data available for the selected period</p>
            )}
          </div>
        </div>

        {/* Monthly Sales Chart */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-blue-600" />
              Monthly Sales ({new Date().getFullYear()})
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {reports.monthlySales.map((month) => (
                <div key={month.month} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{month.month}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-gray-500">{month.transactions} sales</span>
                    <span className="text-sm font-medium text-gray-900">
                      ${month.revenue.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Export Reports</h3>
        </div>
        <div className="p-6">
          <div className="flex space-x-4">
            <button
              onClick={() => {
                // In a real app, this would generate and download a CSV
                alert('CSV export would be implemented here');
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Export to CSV
            </button>
            <button
              onClick={() => {
                // In a real app, this would generate and download a PDF
                alert('PDF export would be implemented here');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Export to PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;

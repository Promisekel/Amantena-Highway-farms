import React from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { salesAPI, productsAPI, usersAPI } from '../utils/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { 
  CurrencyDollarIcon, 
  CubeIcon, 
  UsersIcon, 
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ShoppingCartIcon 
} from '@heroicons/react/24/outline';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { format, subDays } from 'date-fns';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();

  // Fetch dashboard data
  const { data: salesReport, isLoading: salesLoading } = useQuery(
    'salesReport',
    () => salesAPI.getSalesReport({
      startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    })
  );

  const { data: salesTrends, isLoading: trendsLoading } = useQuery(
    'salesTrends',
    () => salesAPI.getSalesTrends({
      startDate: format(subDays(new Date(), 14), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    })
  );

  const { data: lowStockProducts, isLoading: lowStockLoading } = useQuery(
    'lowStockProducts',
    () => productsAPI.getLowStockProducts()
  );

  const { data: userStats, isLoading: userStatsLoading } = useQuery(
    'userStats',
    () => usersAPI.getUserStats(),
    { enabled: isAdmin() }
  );

  if (salesLoading || trendsLoading || lowStockLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Revenue (30 days)',
      value: `$${salesReport?.data?.overview?.totalRevenue?.toFixed(2) || '0.00'}`,
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Units Sold (30 days)',
      value: salesReport?.data?.overview?.totalUnitsSold || '0',
      icon: ShoppingCartIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Total Sales (30 days)',
      value: salesReport?.data?.overview?.totalSales || '0',
      icon: ArrowTrendingUpIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Low Stock Alerts',
      value: lowStockProducts?.data?.count || '0',
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  if (isAdmin() && userStats?.data) {
    stats.push({
      name: 'Active Users',
      value: userStats.data.stats.active,
      icon: UsersIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening at Amantena Highway Farms today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trends Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Sales Trends (14 days)</h3>
          </div>
          <div className="card-body">
            {trendsLoading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesTrends?.data?.trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                    formatter={(value, name) => [
                      name === 'revenue' ? `$${value.toFixed(2)}` : value,
                      name === 'revenue' ? 'Revenue' : 'Units Sold'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Top Products (30 days)</h3>
          </div>
          <div className="card-body">
            {salesReport?.data?.topProducts?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesReport.data.topProducts.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="product.name" 
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Bar 
                    dataKey="totalRevenue" 
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No sales data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts?.data?.products?.length > 0 && (
        <div className="card">
          <div className="card-header flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Low Stock Alerts</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockProducts.data.products.map((product) => (
                <div 
                  key={product.id} 
                  className="border border-red-200 bg-red-50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{product.name}</h4>
                      <p className="text-sm text-gray-600">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">
                        {product.quantity}
                      </p>
                      <p className="text-xs text-gray-500">units left</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="bg-red-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full"
                        style={{ 
                          width: `${Math.min((product.quantity / product.threshold) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Staff Performance (Admin only) */}
      {isAdmin() && salesReport?.data?.staffPerformance?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Staff Performance (30 days)</h3>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Units Sold
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {salesReport.data.staffPerformance.map((staff) => (
                    <tr key={staff.user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {staff.user.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {staff.salesCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${staff.totalRevenue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {staff.unitsSold}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

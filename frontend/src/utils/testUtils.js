// Test utilities for the Amantena Highway Farms app
import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';

// Mock user data for testing
export const mockUsers = {
  admin: {
    id: 1,
    name: 'Admin User',
    email: 'admin@amantena.com',
    role: 'ADMIN',
    isActive: true
  },
  manager: {
    id: 2,
    name: 'Manager User',
    email: 'manager@amantena.com',
    role: 'MANAGER',
    isActive: true
  },
  user: {
    id: 3,
    name: 'Regular User',
    email: 'user@amantena.com',
    role: 'USER',
    isActive: true
  }
};

// Mock product data
export const mockProducts = [
  {
    id: 1,
    name: 'Tomatoes',
    description: 'Fresh organic tomatoes',
    category: 'VEGETABLES',
    price: 2.50,
    stockQuantity: 100,
    lowStockThreshold: 20,
    isActive: true
  },
  {
    id: 2,
    name: 'Carrots',
    description: 'Fresh organic carrots',
    category: 'VEGETABLES',
    price: 1.80,
    stockQuantity: 75,
    lowStockThreshold: 15,
    isActive: true
  }
];

// Mock sales data
export const mockSales = [
  {
    id: 1,
    totalAmount: 25.50,
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    createdAt: new Date().toISOString(),
    saleItems: [
      {
        id: 1,
        quantity: 5,
        unitPrice: 2.50,
        product: mockProducts[0]
      },
      {
        id: 2,
        quantity: 8,
        unitPrice: 1.80,
        product: mockProducts[1]
      }
    ]
  }
];

// Custom render function with providers
export const renderWithProviders = (ui, options = {}) => {
  const { user = mockUsers.user, ...renderOptions } = options;

  // Mock the AuthContext
  const MockAuthProvider = ({ children }) => {
    const authValue = {
      user,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      hasPermission: (permission) => {
        if (permission === 'admin') return user.role === 'ADMIN';
        return true; // staff permission
      }
    };

    return (
      <AuthProvider value={authValue}>
        {children}
      </AuthProvider>
    );
  };

  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <MockAuthProvider>
        {children}
      </MockAuthProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock API responses
export const mockApiResponses = {
  products: {
    getProducts: () => Promise.resolve({ data: mockProducts }),
    createProduct: (product) => Promise.resolve({ data: { id: Date.now(), ...product } }),
    updateProduct: (id, updates) => Promise.resolve({ data: { id, ...updates } }),
    deleteProduct: (id) => Promise.resolve({ success: true })
  },
  
  sales: {
    getSales: () => Promise.resolve({ data: mockSales }),
    createSale: (sale) => Promise.resolve({ data: { id: Date.now(), ...sale } })
  },
  
  users: {
    getUsers: () => Promise.resolve({ data: Object.values(mockUsers) }),
    updateUser: (id, updates) => Promise.resolve({ data: { id, ...updates } }),
    deleteUser: (id) => Promise.resolve({ success: true })
  }
};

// Helper functions for testing
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 100));
};

export const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

// Setup for tests
export const setupTests = () => {
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
  });

  // Mock fetch
  global.fetch = jest.fn();

  // Mock console methods to reduce noise in tests
  console.error = jest.fn();
  console.warn = jest.fn();
};

export default {
  renderWithProviders,
  mockUsers,
  mockProducts,
  mockSales,
  mockApiResponses,
  waitForLoadingToFinish,
  setupTests
};

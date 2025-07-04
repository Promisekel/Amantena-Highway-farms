import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        withCredentials: true,
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
        
        // Join user-specific room
        newSocket.emit('join-room', `user-${user.id}`);
        
        // Join role-specific room
        newSocket.emit('join-room', `role-${user.role.toLowerCase()}`);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      // Real-time event handlers
      newSocket.on('sale-created', (sale) => {
        toast.success(`New sale recorded: ${sale.product.name}`);
      });

      newSocket.on('product-updated', (product) => {
        // Could trigger data refetch in components
        console.log('Product updated:', product);
      });

      newSocket.on('low-stock-alert', (alert) => {
        toast.error(alert.message, {
          duration: 8000,
          icon: '⚠️',
        });
      });

      newSocket.on('event-created', (event) => {
        toast.success(`New event: ${event.title}`);
      });

      newSocket.on('event-updated', (event) => {
        toast.success(`Event updated: ${event.title}`);
      });

      newSocket.on('event-deleted', (data) => {
        toast.success('Event deleted');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setIsConnected(false);
      };
    } else {
      // Clean up socket when user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [user]);

  const emit = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const value = {
    socket,
    isConnected,
    emit,
    on,
    off,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

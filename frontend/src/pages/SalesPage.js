import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { salesAPI, productsAPI } from '../utils/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { 
  PlusIcon, 
  CurrencyDollarIcon,
  ShoppingCartIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { format } from 'date-fns';

const SalesPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearch, setProductSearch] = useState('');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();

  // Fetch sales
  const { data: salesData, isLoading: salesLoading } = useQuery(
    ['sales', page],
    () => salesAPI.getSales({ page, limit: 10 }),
    { keepPreviousData: true }
  );

  // Fetch products for sale
  const { data: productsData, isLoading: productsLoading } = useQuery(
    ['products-for-sale', productSearch],
    () => productsAPI.getProducts({ 
      search: productSearch, 
      limit: 50 
    }),
    { enabled: isModalOpen }
  );

  // Create sale mutation
  const saleMutation = useMutation(
    (data) => salesAPI.createSale(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sales');
        queryClient.invalidateQueries('products');
        toast.success('Sale recorded successfully!');
        closeModal();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to record sale');
      }
    }
  );

  const openModal = () => {
    reset();
    setSelectedProduct(null);
    setProductSearch('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
    setSelectedProduct(null);
  };

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setValue('productId', product.id);
    setValue('unitPrice', product.price);
  };

  const onSubmit = (data) => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    const quantitySold = parseInt(data.quantitySold);
    if (quantitySold > selectedProduct.quantity) {
      toast.error(`Only ${selectedProduct.quantity} units available`);
      return;
    }

    saleMutation.mutate({
      productId: selectedProduct.id,
      quantitySold,
      notes: data.notes
    });
  };

  const quantitySold = watch('quantitySold');
  const totalAmount = selectedProduct && quantitySold 
    ? (selectedProduct.price * parseInt(quantitySold || 0)).toFixed(2)
    : '0.00';

  if (salesLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Loading sales..." />
      </div>
    );
  }

  const sales = salesData?.data?.sales || [];
  const pagination = salesData?.data?.pagination || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
          <p className="text-gray-600">Record sales and track transactions</p>
        </div>
        <button
          onClick={openModal}
          className="btn-primary"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Record Sale
        </button>
      </div>

      {/* Sales List */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Recent Sales</h3>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sold By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {sale.product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {sale.product.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <ShoppingCartIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {sale.quantitySold}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">
                          {sale.unitPrice}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">
                        ${sale.totalAmount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(sale.soldAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {sales.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sales yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by recording your first sale
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={!pagination.hasPrev}
            className="btn-outline disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-2 text-sm text-gray-700">
            Page {pagination.current} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!pagination.hasNext}
            className="btn-outline disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Record Sale Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
                  <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
                    Record New Sale
                  </Dialog.Title>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Product Selection */}
                    <div>
                      <label className="form-label">Select Product</label>
                      <div className="space-y-2">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search products..."
                            className="form-input pl-10"
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                          />
                          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                        </div>

                        {!selectedProduct && (
                          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                            {productsLoading ? (
                              <div className="p-4 text-center">
                                <LoadingSpinner size="sm" />
                              </div>
                            ) : (
                              <div className="divide-y divide-gray-200">
                                {productsData?.data?.products
                                  ?.filter(p => p.quantity > 0)
                                  ?.map((product) => (
                                    <button
                                      key={product.id}
                                      type="button"
                                      onClick={() => selectProduct(product)}
                                      className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                                    >
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <div className="font-medium text-gray-900">
                                            {product.name}
                                          </div>
                                          <div className="text-sm text-gray-500">
                                            {product.category} • Stock: {product.quantity}
                                          </div>
                                        </div>
                                        <div className="text-sm font-semibold text-green-600">
                                          ${product.price}
                                        </div>
                                      </div>
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}

                        {selectedProduct && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {selectedProduct.name}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {selectedProduct.category} • Stock: {selectedProduct.quantity}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-green-600">
                                  ${selectedProduct.price}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedProduct(null)}
                                  className="text-xs text-red-600 hover:text-red-800"
                                >
                                  Change
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quantity */}
                    {selectedProduct && (
                      <>
                        <div>
                          <label className="form-label">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            max={selectedProduct.quantity}
                            className="form-input"
                            placeholder="Enter quantity"
                            {...register('quantitySold', {
                              required: 'Quantity is required',
                              min: { value: 1, message: 'Quantity must be at least 1' },
                              max: { 
                                value: selectedProduct.quantity, 
                                message: `Only ${selectedProduct.quantity} units available` 
                              }
                            })}
                          />
                          {errors.quantitySold && (
                            <p className="form-error">{errors.quantitySold.message}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Available: {selectedProduct.quantity} units
                          </p>
                        </div>

                        {/* Total Amount Display */}
                        <div className="p-3 bg-gray-50 rounded-md">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Amount:</span>
                            <span className="text-lg font-bold text-green-600">
                              ${totalAmount}
                            </span>
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="form-label">Notes (optional)</label>
                          <textarea
                            rows={3}
                            className="form-input"
                            placeholder="Any additional notes about this sale..."
                            {...register('notes')}
                          />
                        </div>
                      </>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="btn-outline"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!selectedProduct || saleMutation.isLoading}
                        className="btn-primary"
                      >
                        {saleMutation.isLoading ? (
                          <LoadingSpinner size="sm" color="white" />
                        ) : (
                          'Record Sale'
                        )}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default SalesPage;

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { productsAPI, uploadAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ExclamationTriangleIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const InventoryPage = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();

  // Fetch products
  const { data: productsData, isLoading } = useQuery(
    ['products', page, search, category, showLowStock],
    () => productsAPI.getProducts({
      page,
      limit: 12,
      search,
      category,
      lowStock: showLowStock
    }),
    { keepPreviousData: true }
  );

  // Fetch categories
  const { data: categoriesData } = useQuery('categories', () => productsAPI.getCategories());

  // Create/Update product mutation
  const productMutation = useMutation(
    (data) => editingProduct 
      ? productsAPI.updateProduct(editingProduct.id, data)
      : productsAPI.createProduct(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        queryClient.invalidateQueries('categories');
        toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
        closeModal();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Operation failed');
      }
    }
  );

  // Delete product mutation
  const deleteMutation = useMutation(
    (id) => productsAPI.deleteProduct(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        toast.success('Product deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Delete failed');
      }
    }
  );

  const openModal = (product = null) => {
    setEditingProduct(product);
    if (product) {
      reset({
        name: product.name,
        category: product.category,
        description: product.description,
        price: product.price,
        quantity: product.quantity,
        threshold: product.threshold,
        sku: product.sku,
        imageUrl: product.imageUrl
      });
    } else {
      reset();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    reset();
  };

  const onSubmit = (data) => {
    productMutation.mutate({
      ...data,
      price: parseFloat(data.price),
      quantity: parseInt(data.quantity),
      threshold: parseInt(data.threshold || 10)
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const response = await uploadAPI.uploadImage(file, 'products');
      setValue('imageUrl', response.data.image.url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Image upload failed');
    } finally {
      setImageUploading(false);
    }
  };

  const handleDelete = (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Loading inventory..." />
      </div>
    );
  }

  const products = productsData?.data?.products || [];
  const pagination = productsData?.data?.pagination || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Manage your farm products and stock levels</p>
        </div>
        {isAdmin() && (
          <button
            onClick={() => openModal()}
            className="btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Product
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="form-input pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
            <div>
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categoriesData?.data?.categories?.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Filter</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="lowStock"
                  checked={showLowStock}
                  onChange={(e) => setShowLowStock(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="lowStock" className="ml-2 text-sm text-gray-700">
                  Low stock only
                </label>
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearch('');
                  setCategory('');
                  setShowLowStock(false);
                  setPage(1);
                }}
                className="btn-outline"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="card hover:shadow-md transition-shadow">
            <div className="relative">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                  <PhotoIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
              
              {/* Stock status indicator */}
              <div className="absolute top-2 right-2">
                {product.quantity <= product.threshold ? (
                  <span className="badge-danger">
                    <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                    Low Stock
                  </span>
                ) : (
                  <span className="badge-success">In Stock</span>
                )}
              </div>
            </div>

            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                {isAdmin() && (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => openModal(product)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{product.category}</p>
              {product.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Price:</span>
                  <span className="font-semibold text-green-600">${product.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Stock:</span>
                  <span className={`font-semibold ${product.quantity <= product.threshold ? 'text-red-600' : 'text-gray-900'}`}>
                    {product.quantity} units
                  </span>
                </div>
                {product.sku && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">SKU:</span>
                    <span className="text-sm text-gray-900">{product.sku}</span>
                  </div>
                )}
              </div>

              {/* Stock level bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Stock Level</span>
                  <span>{product.quantity}/{product.threshold + 20}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      product.quantity <= product.threshold ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min((product.quantity / (product.threshold + 20)) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {products.length === 0 && (
        <div className="text-center py-12">
          <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {search || category || showLowStock
              ? 'Try adjusting your filters'
              : 'Get started by adding your first product'
            }
          </p>
        </div>
      )}

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

      {/* Product Modal */}
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
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </Dialog.Title>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label className="form-label">Product Name</label>
                      <input
                        type="text"
                        className="form-input"
                        {...register('name', { required: 'Product name is required' })}
                      />
                      {errors.name && <p className="form-error">{errors.name.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Category</label>
                      <input
                        type="text"
                        className="form-input"
                        {...register('category', { required: 'Category is required' })}
                      />
                      {errors.category && <p className="form-error">{errors.category.message}</p>}
                    </div>

                    <div>
                      <label className="form-label">Description</label>
                      <textarea
                        rows={3}
                        className="form-input"
                        {...register('description')}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input"
                          {...register('price', { required: 'Price is required' })}
                        />
                        {errors.price && <p className="form-error">{errors.price.message}</p>}
                      </div>

                      <div>
                        <label className="form-label">Quantity</label>
                        <input
                          type="number"
                          className="form-input"
                          {...register('quantity', { required: 'Quantity is required' })}
                        />
                        {errors.quantity && <p className="form-error">{errors.quantity.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">SKU</label>
                        <input
                          type="text"
                          className="form-input"
                          {...register('sku')}
                        />
                      </div>

                      <div>
                        <label className="form-label">Low Stock Threshold</label>
                        <input
                          type="number"
                          className="form-input"
                          {...register('threshold')}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Product Image</label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="btn-outline cursor-pointer"
                        >
                          {imageUploading ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <PhotoIcon className="h-4 w-4 mr-2" />
                              Upload Image
                            </>
                          )}
                        </label>
                        {watch('imageUrl') && (
                          <img
                            src={watch('imageUrl')}
                            alt="Preview"
                            className="h-12 w-12 object-cover rounded"
                          />
                        )}
                      </div>
                    </div>

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
                        disabled={productMutation.isLoading}
                        className="btn-primary"
                      >
                        {productMutation.isLoading ? (
                          <LoadingSpinner size="sm" color="white" />
                        ) : (
                          editingProduct ? 'Update Product' : 'Add Product'
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

export default InventoryPage;

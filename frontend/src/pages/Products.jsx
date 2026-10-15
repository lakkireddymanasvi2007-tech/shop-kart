import { useState, useEffect, useCallback } from 'react';
import { getAllProducts, getWishlist } from '../services/api';
import ProductCard from '../components/ProductCard';
import SearchBar from '../components/SearchBar';

const categories = [
  'All Categories',
  'Electronics',
  'Fashion',
  'Books',
  'Home',
];

function Products({ isLoggedIn, onWishlistChange }) {
  const [products, setProducts] = useState([]);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [sort, setSort] = useState('');

  // Fetch wishlist IDs if logged in
  useEffect(() => {
    let isMounted = true;
    if (isLoggedIn) {
      getWishlist()
        .then((res) => {
          if (isMounted && res.data?.wishlist) {
            const ids = res.data.wishlist.map((item) =>
              typeof item === 'object' ? item._id : item
            );
            setWishlistIds(ids);
          }
        })
        .catch(() => {
          // Ignore error
        });
    } else {
      setWishlistIds([]);
    }
    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]);

  const fetchProducts = useCallback(
    async (searchTerm, selectedCategory, sortOrder) => {
      try {
        setLoading(true);
        setError('');

        const params = {};
        if (searchTerm && searchTerm.trim()) {
          params.search = searchTerm.trim();
        }
        if (selectedCategory && selectedCategory !== 'All Categories') {
          params.category = selectedCategory;
        }
        if (sortOrder) {
          params.sort = sortOrder;
        }

        const response = await getAllProducts(params);

        // Handle backend response format: { success: true, count: N, products: [...] }
        if (response.data && Array.isArray(response.data.products)) {
          setProducts(response.data.products);
        } else if (Array.isArray(response.data)) {
          setProducts(response.data);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(
          err.response?.data?.message ||
            'Something went wrong while loading products.'
        );
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Debounced search to avoid excessive API calls on keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(search, category, sort);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, category, sort, fetchProducts]);

  // Handle wishlist toggle from any card
  const handleWishlistToggled = (productId, isSaved) => {
    if (isSaved) {
      setWishlistIds((prev) => [...prev, productId]);
    } else {
      setWishlistIds((prev) => prev.filter((id) => id !== productId));
    }
    if (onWishlistChange) {
      onWishlistChange();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Count Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Product Catalog
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Discover and explore products from ShopKart
          </p>
        </div>

        {!loading && !error && (
          <div className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold w-fit">
            {products.length} {products.length === 1 ? 'Product' : 'Products'}{' '}
            available
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <SearchBar
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
          categories={categories}
          sort={sort}
          setSort={setSort}
        />
      </div>

      {/* 1. Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium text-base">
            Loading products...
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Fetching catalog from server
          </p>
        </div>
      )}

      {/* 2. Error State */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-xl mx-auto text-center my-12">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-red-800 mb-2">
            Something went wrong while loading products.
          </h3>
          <p className="text-sm text-red-600 mb-5">{error}</p>
          <button
            onClick={() => fetchProducts(search, category, sort)}
            className="inline-flex items-center px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300 p-8 my-6">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">
            No products found.
          </h3>
          <p className="text-gray-500 text-sm max-w-sm mb-5">
            We couldn't find any products matching your current search or category
            filter.
          </p>
          {(search || category !== 'All Categories' || sort) && (
            <button
              onClick={() => {
                setSearch('');
                setCategory('All Categories');
                setSort('');
              }}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* 4. Products Grid */}
      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              isInitiallyWishlisted={wishlistIds.includes(product._id)}
              onWishlistToggled={handleWishlistToggled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;

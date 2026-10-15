function CheckoutForm({ formData, setFormData, errors, setErrors }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for field on change
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
          📍
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Shipping Details</h2>
          <p className="text-xs text-gray-500">Where should we deliver your order?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="e.g. Aarav Sharma"
            className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
              errors.fullName
                ? 'border-red-400 bg-red-50/50 focus:border-red-500'
                : 'border-gray-200 focus:border-indigo-500 focus:bg-white'
            }`}
          />
          {errors.fullName && (
            <p className="text-xs text-red-600 font-medium mt-1">{errors.fullName}</p>
          )}
        </div>

        {/* Phone */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="e.g. 9876543210"
            className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
              errors.phone
                ? 'border-red-400 bg-red-50/50 focus:border-red-500'
                : 'border-gray-200 focus:border-indigo-500 focus:bg-white'
            }`}
          />
          {errors.phone && (
            <p className="text-xs text-red-600 font-medium mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Address Line 1 */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Address Line <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="addressLine1"
            value={formData.addressLine1}
            onChange={handleChange}
            placeholder="e.g. Flat 402, Sunshine Apartments, MG Road"
            className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
              errors.addressLine1
                ? 'border-red-400 bg-red-50/50 focus:border-red-500'
                : 'border-gray-200 focus:border-indigo-500 focus:bg-white'
            }`}
          />
          {errors.addressLine1 && (
            <p className="text-xs text-red-600 font-medium mt-1">{errors.addressLine1}</p>
          )}
        </div>

        {/* City */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="e.g. Bengaluru"
            className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
              errors.city
                ? 'border-red-400 bg-red-50/50 focus:border-red-500'
                : 'border-gray-200 focus:border-indigo-500 focus:bg-white'
            }`}
          />
          {errors.city && (
            <p className="text-xs text-red-600 font-medium mt-1">{errors.city}</p>
          )}
        </div>

        {/* State */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            State <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="e.g. Karnataka"
            className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
              errors.state
                ? 'border-red-400 bg-red-50/50 focus:border-red-500'
                : 'border-gray-200 focus:border-indigo-500 focus:bg-white'
            }`}
          />
          {errors.state && (
            <p className="text-xs text-red-600 font-medium mt-1">{errors.state}</p>
          )}
        </div>

        {/* Pincode */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
            Pincode (6 digits) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="pincode"
            maxLength={6}
            value={formData.pincode}
            onChange={handleChange}
            placeholder="e.g. 560001"
            className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-colors ${
              errors.pincode
                ? 'border-red-400 bg-red-50/50 focus:border-red-500'
                : 'border-gray-200 focus:border-indigo-500 focus:bg-white'
            }`}
          />
          {errors.pincode && (
            <p className="text-xs text-red-600 font-medium mt-1">{errors.pincode}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CheckoutForm;

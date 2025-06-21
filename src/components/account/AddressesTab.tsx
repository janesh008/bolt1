import React from 'react';
import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { PlusCircle, Edit, Trash2, Check, X, MapPin, Home } from 'lucide-react';
import toast from 'react-hot-toast';

interface Address {
  id: string;
  user_id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  country?: string;
  landmark?: string;
  recipient_name: string;
  recipient_phone: string;
  address_type: 'shipping' | 'billing' | 'both';
  is_default: boolean;
  created_at: string;
}

interface AddressesTabProps {
  initialAddresses?: Address[];
}

const AddressesTab: React.FC<AddressesTabProps> = ({ initialAddresses = [] }) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    recipient_name: '',
    recipient_phone: '',
    address_line1: '',
    address_line2: '',
    landmark: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'India',
    address_type: 'shipping' as 'shipping' | 'billing' | 'both',
    is_default: false
  });
  
  // Fetch addresses
  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);
  
  const fetchAddresses = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const resetForm = () => {
    setFormData({
      recipient_name: '',
      recipient_phone: '',
      address_line1: '',
      address_line2: '',
      landmark: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'India',
      address_type: 'shipping',
      is_default: false
    });
    setEditingAddress(null);
  };
  
  const handleAddNewClick = () => {
    resetForm();
    setShowAddForm(true);
  };
  
  const handleEditClick = (address: Address) => {
    setFormData({
      recipient_name: address.recipient_name || '',
      recipient_phone: address.recipient_phone || '',
      address_line1: address.address_line1 || '',
      address_line2: address.address_line2 || '',
      landmark: address.landmark || '',
      city: address.city || '',
      state: address.state || '',
      zip_code: address.zip_code || '',
      country: address.country || 'India',
      address_type: address.address_type || 'shipping',
      is_default: address.is_default || false
    });
    setEditingAddress(address);
    setShowAddForm(true);
  };
  
  const handleCancelForm = () => {
    setShowAddForm(false);
    resetForm();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to save addresses');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      const requiredFields = ['recipient_name', 'recipient_phone', 'address_line1', 'city', 'state', 'zip_code'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from('addresses')
          .update({
            recipient_name: formData.recipient_name,
            recipient_phone: formData.recipient_phone,
            address_line1: formData.address_line1,
            address_line2: formData.address_line2,
            landmark: formData.landmark,
            city: formData.city,
            state: formData.state,
            zip_code: formData.zip_code,
            country: formData.country,
            address_type: formData.address_type,
            is_default: formData.is_default
          })
          .eq('id', editingAddress.id)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        toast.success('Address updated successfully');
      } else {
        // Create new address
        const { error } = await supabase
          .from('addresses')
          .insert({
            user_id: user.id,
            recipient_name: formData.recipient_name,
            recipient_phone: formData.recipient_phone,
            address_line1: formData.address_line1,
            address_line2: formData.address_line2,
            landmark: formData.landmark,
            city: formData.city,
            state: formData.state,
            zip_code: formData.zip_code,
            country: formData.country,
            address_type: formData.address_type,
            is_default: formData.is_default
          });
        
        if (error) throw error;
        
        toast.success('Address added successfully');
      }
      
      // Refresh addresses
      await fetchAddresses();
      
      // Reset form and close
      setShowAddForm(false);
      resetForm();
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      // Update local state
      setAddresses(addresses.filter(addr => addr.id !== addressId));
      toast.success('Address deleted successfully');
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    }
  };
  
  const handleSetDefault = async (addressId: string, addressType: 'shipping' | 'billing' | 'both') => {
    try {
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      // Update local state
      setAddresses(addresses.map(addr => ({
        ...addr,
        is_default: addr.id === addressId ? true : 
          (addr.address_type === addressType ? false : addr.is_default)
      })));
      
      toast.success('Default address updated');
    } catch (error) {
      console.error('Error setting default address:', error);
      toast.error('Failed to update default address');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-soft p-6">
      <h2 className="text-xl font-medium text-charcoal-800 mb-6">Saved Addresses</h2>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-cream-200 border-t-gold-400 rounded-full animate-spin"></div>
        </div>
      ) : addresses.length === 0 && !showAddForm ? (
        <div className="text-center py-8">
          <MapPin className="w-16 h-16 text-charcoal-300 mx-auto mb-4" />
          <p className="text-charcoal-500 mb-6">No addresses found.</p>
          <Button onClick={handleAddNewClick}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Address
          </Button>
        </div>
      ) : (
        <div>
          {!showAddForm && (
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-charcoal-700">
                Your Addresses ({addresses.length})
              </h3>
              <Button onClick={handleAddNewClick} size="sm">
                <PlusCircle className="h-4 w-4 mr-2" />
                Add New Address
              </Button>
            </div>
          )}
          
          {showAddForm ? (
            <div className="bg-cream-50 rounded-lg p-6 border border-cream-200 mb-6">
              <h3 className="text-lg font-medium text-charcoal-700 mb-4">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="recipient_name"
                      value={formData.recipient_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-cream-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="recipient_phone"
                      value={formData.recipient_phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-cream-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-400"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    name="address_line1"
                    value={formData.address_line1}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-cream-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="House/Flat/Block No., Apartment/Building Name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    name="address_line2"
                    value={formData.address_line2}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-cream-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="Street, Area, Colony"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1">
                    Landmark
                  </label>
                  <input
                    type="text"
                    name="landmark"
                    value={formData.landmark}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-cream-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-400"
                    placeholder="Nearby landmark (optional)"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-cream-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-cream-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-charcoal-700 mb-1">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      name="zip_code"
                      value={formData.zip_code}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-cream-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-400"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1">
                    Country
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-cream-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-400"
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-1">
                    Address Type
                  </label>
                  <select
                    name="address_type"
                    value={formData.address_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-cream-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-400"
                  >
                    <option value="shipping">Shipping</option>
                    <option value="billing">Billing</option>
                    <option value="both">Both (Shipping & Billing)</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_default"
                    name="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                    className="h-4 w-4 text-gold-400 focus:ring-gold-400 border-cream-300 rounded"
                  />
                  <label htmlFor="is_default" className="ml-2 block text-sm text-charcoal-700">
                    Set as default {formData.address_type} address
                  </label>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelForm}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                  >
                    {editingAddress ? 'Update Address' : 'Save Address'}
                  </Button>
                </div>
              </form>
            </div>
          ) : null}
          
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`border ${address.is_default ? 'border-gold-300 bg-gold-50' : 'border-cream-200'} rounded-lg p-4 transition-all`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-charcoal-800">
                        {address.recipient_name}
                      </p>
                      <span className="text-xs px-2 py-0.5 bg-cream-100 text-charcoal-600 rounded-full capitalize">
                        {address.address_type}
                      </span>
                      {address.is_default && (
                        <span className="text-xs px-2 py-0.5 bg-gold-100 text-gold-600 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    
                    <p className="text-charcoal-600 mt-1">
                      {address.recipient_phone}
                    </p>
                    
                    <p className="text-charcoal-600 mt-2">
                      {address.address_line1}
                      {address.address_line2 && <>, {address.address_line2}</>}
                      {address.landmark && <>, {address.landmark}</>}
                    </p>
                    
                    <p className="text-charcoal-600">
                      {address.city}, {address.state}, {address.zip_code}
                    </p>
                    
                    <p className="text-charcoal-600">
                      {address.country || 'India'}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleEditClick(address)}
                      className="p-2 text-charcoal-500 hover:text-gold-500 transition-colors"
                      title="Edit address"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteAddress(address.id)}
                      className="p-2 text-charcoal-500 hover:text-red-500 transition-colors"
                      title="Delete address"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    
                    {!address.is_default && (
                      <button
                        onClick={() => handleSetDefault(address.id, address.address_type)}
                        className="p-2 text-charcoal-500 hover:text-gold-500 transition-colors"
                        title="Set as default"
                      >
                        <Home className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressesTab;
import React from 'react';
import Button from '../ui/Button';

interface Address {
  id: string;
  address: string;
  type: string;
  is_default: boolean;
}

interface AddressesTabProps {
  addresses: Address[];
}

const AddressesTab: React.FC<AddressesTabProps> = ({ addresses }) => {
  return (
    <div className="bg-white rounded-lg shadow-soft p-6">
      <h2 className="text-xl font-medium text-charcoal-800 mb-6">Saved Addresses</h2>
      
      {addresses.length === 0 ? (
        <p className="text-charcoal-500">No addresses found.</p>
      ) : (
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="border border-cream-200 rounded-lg p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-charcoal-800 capitalize">
                    {address.type}
                  </p>
                  <p className="text-charcoal-600 mt-1">
                    {address.address}
                  </p>
                </div>
                {address.is_default && (
                  <span className="text-sm text-gold-400 font-medium">
                    Default
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <Button className="mt-6">
        Add New Address
      </Button>
    </div>
  );
};

export default AddressesTab;
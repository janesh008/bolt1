import React from 'react';
import { X, User, Calendar, Edit, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Badge } from '../../ui/badge';

interface ProductInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    product_id?: string;
    product_name?: string;
    name?: string;
    created_at: string;
    updated_at?: string;
    created_by?: string;
    updated_by?: string;
  } | null;
}

const ProductInfoModal: React.FC<ProductInfoModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  if (!product) return null;

  const getProductName = () => {
    return product.product_name || product.name || 'Unnamed Product';
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Mock admin data - in real implementation, this would come from the database
  const getAdminInfo = (type: 'created' | 'updated') => {
    // This would typically be fetched from the database based on created_by/updated_by fields
    return {
      name: 'Super Admin',
      role: 'Super Admin', // or 'Moderator Admin'
      email: 'admin@axels.com'
    };
  };

  const createdBy = getAdminInfo('created');
  const updatedBy = getAdminInfo('updated');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Product Information
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Product Details */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">{getProductName()}</h3>
            <p className="text-sm text-gray-500">ID: {product.product_id || product.id}</p>
          </div>

          {/* Created Information */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Created</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Created by:</span>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{createdBy.name}</div>
                  <Badge variant="secondary" className="text-xs">
                    {createdBy.role}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Created date:</span>
                <span className="text-sm text-gray-900">{formatDateTime(product.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Updated Information */}
          {product.updated_at && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Edit className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Last Updated</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Updated by:</span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{updatedBy.name}</div>
                    <Badge variant="secondary" className="text-xs">
                      {updatedBy.role}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Updated date:</span>
                  <span className="text-sm text-gray-900">{formatDateTime(product.updated_at)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Admin Contact Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-800">Admin Contact</span>
            </div>
            <p className="text-sm text-gray-600">{createdBy.email}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductInfoModal;
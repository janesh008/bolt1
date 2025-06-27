import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Calendar, Filter, Download } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import Button from '../ui/Button';
import { format } from 'date-fns';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: {
    dateRange: { startDate: Date; endDate: Date } | null;
    statuses: string[];
    paymentStatuses: string[];
  }) => void;
  type: 'orders' | 'refunds';
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  type
}) => {
  const [startDate, setStartDate] = useState<string>(
    format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState<string[]>([]);
  const [selectedRefundStatuses, setSelectedRefundStatuses] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    
    const options = {
      dateRange: {
        startDate: new Date(startDate),
        endDate: new Date(`${endDate}T23:59:59`)
      },
      statuses: selectedStatuses,
      paymentStatuses: selectedPaymentStatuses,
      refundStatuses: selectedRefundStatuses
    };
    
    onExport(options);
    setIsExporting(false);
    onClose();
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  const togglePaymentStatus = (status: string) => {
    setSelectedPaymentStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  const toggleRefundStatus = (status: string) => {
    setSelectedRefundStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-gray-700" />
            Export {type === 'orders' ? 'Orders' : 'Refunds'} to Excel
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Date Range */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              Date Range
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="text-xs text-gray-500">
                  Start Date
                </Label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-xs text-gray-500">
                  End Date
                </Label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
            </div>
          </div>
          
          {/* Filters */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Filter className="h-4 w-4 mr-2 text-gray-500" />
              Filters
            </h3>
            
            {type === 'orders' && (
              <>
                {/* Order Status */}
                <div className="mb-4">
                  <Label className="text-xs text-gray-500 mb-2 block">
                    Order Status
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={selectedStatuses.includes(status)}
                          onCheckedChange={() => toggleStatus(status)}
                        />
                        <Label htmlFor={`status-${status}`} className="text-sm capitalize">
                          {status}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Payment Status */}
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">
                    Payment Status
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['pending', 'completed', 'failed', 'refunded'].map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`payment-${status}`}
                          checked={selectedPaymentStatuses.includes(status)}
                          onCheckedChange={() => togglePaymentStatus(status)}
                        />
                        <Label htmlFor={`payment-${status}`} className="text-sm capitalize">
                          {status}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {type === 'refunds' && (
              <div>
                <Label className="text-xs text-gray-500 mb-2 block">
                  Refund Status
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {['pending', 'processing', 'completed', 'rejected'].map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`refund-${status}`}
                        checked={selectedRefundStatuses.includes(status)}
                        onCheckedChange={() => toggleRefundStatus(status)}
                      />
                      <Label htmlFor={`refund-${status}`} className="text-sm capitalize">
                        {status}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <Button
              onClick={handleExport}
              isLoading={isExporting}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
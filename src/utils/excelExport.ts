import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

// Define types for export options
export interface ExportOptions {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  statuses?: string[];
  paymentStatuses?: string[];
  refundStatuses?: string[];
}

// Function to export orders to Excel
export const exportOrdersToExcel = async (orders: any[], options?: ExportOptions) => {
  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Orders');

  // Define columns
  worksheet.columns = [
    { header: 'Order ID', key: 'orderNumber', width: 15 },
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Customer Name', key: 'customerName', width: 25 },
    { header: 'Customer Email', key: 'customerEmail', width: 30 },
    { header: 'Total Amount', key: 'totalAmount', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Payment Status', key: 'paymentStatus', width: 15 },
    { header: 'Payment Method', key: 'paymentMethod', width: 15 },
    { header: 'Items', key: 'items', width: 40 },
    { header: 'Shipping Address', key: 'shippingAddress', width: 40 },
  ];

  // Apply filters if provided
  let filteredOrders = [...orders];
  
  if (options?.dateRange) {
    filteredOrders = filteredOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= options.dateRange!.startDate && orderDate <= options.dateRange!.endDate;
    });
  }
  
  if (options?.statuses && options.statuses.length > 0) {
    filteredOrders = filteredOrders.filter(order => options.statuses!.includes(order.status));
  }
  
  if (options?.paymentStatuses && options.paymentStatuses.length > 0) {
    filteredOrders = filteredOrders.filter(order => options.paymentStatuses!.includes(order.payment_status));
  }

  // Add rows
  filteredOrders.forEach(order => {
    // Format items
    const itemsText = order.order_items?.map((item: any) => 
      `${item.products?.product_name || 'Unknown Product'} (${item.quantity}x ₹${item.unit_price})`
    ).join(', ') || '';

    // Format shipping address
    const shippingAddress = order.shipping_addresses?.[0];
    const addressText = shippingAddress ? 
      `${shippingAddress.name}, ${shippingAddress.address_line1}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.pincode}` : 
      'No shipping address';

    // Format customer info
    const customerName = order.users?.full_name || 'Unknown';
    const customerEmail = order.users?.email || 'No email';

    worksheet.addRow({
      orderNumber: order.order_number,
      date: format(new Date(order.created_at), 'yyyy-MM-dd HH:mm:ss'),
      customerName,
      customerEmail,
      totalAmount: order.total_amount,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      items: itemsText,
      shippingAddress: addressText,
    });
  });

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD4AF37' } // Gold color
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Apply number format to amount column
  worksheet.getColumn('totalAmount').numFmt = '₹#,##0.00';

  // Auto-filter
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 10 }
  };

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `AXELS_Orders_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Function to export refunds to Excel
export const exportRefundsToExcel = async (refunds: any[], options?: ExportOptions) => {
  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Refunds');

  // Define columns
  worksheet.columns = [
    { header: 'Refund ID', key: 'refundId', width: 15 },
    { header: 'Order Number', key: 'orderNumber', width: 15 },
    { header: 'Date Requested', key: 'dateRequested', width: 20 },
    { header: 'Customer Name', key: 'customerName', width: 25 },
    { header: 'Customer Email', key: 'customerEmail', width: 30 },
    { header: 'Amount', key: 'amount', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Payment Method', key: 'paymentMethod', width: 15 },
    { header: 'Reason', key: 'reason', width: 40 },
    { header: 'Processed By', key: 'processedBy', width: 20 },
    { header: 'Completed Date', key: 'completedDate', width: 20 },
  ];

  // Apply filters if provided
  let filteredRefunds = [...refunds];
  
  if (options?.dateRange) {
    filteredRefunds = filteredRefunds.filter(refund => {
      const refundDate = new Date(refund.created_at);
      return refundDate >= options.dateRange!.startDate && refundDate <= options.dateRange!.endDate;
    });
  }
  
  if (options?.refundStatuses && options.refundStatuses.length > 0) {
    filteredRefunds = filteredRefunds.filter(refund => options.refundStatuses!.includes(refund.status));
  }

  // Add rows
  filteredRefunds.forEach(refund => {
    worksheet.addRow({
      refundId: refund.id.slice(0, 8),
      orderNumber: refund.order_number || refund.orders?.order_number || 'Unknown',
      dateRequested: format(new Date(refund.created_at), 'yyyy-MM-dd HH:mm:ss'),
      customerName: refund.full_name || 'Unknown',
      customerEmail: refund.email || 'No email',
      amount: refund.amount,
      status: refund.status,
      paymentMethod: refund.payment_method,
      reason: refund.reason || 'No reason provided',
      processedBy: refund.processed_by_name || 'Not processed yet',
      completedDate: refund.completed_at ? format(new Date(refund.completed_at), 'yyyy-MM-dd HH:mm:ss') : 'Not completed',
    });
  });

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD4AF37' } // Gold color
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Apply number format to amount column
  worksheet.getColumn('amount').numFmt = '₹#,##0.00';

  // Auto-filter
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 11 }
  };

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `AXELS_Refunds_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Function to export users to Excel
export const exportUsersToExcel = async (users: any[]) => {
  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Users');

  // Define columns
  worksheet.columns = [
    { header: 'User ID', key: 'userId', width: 15 },
    { header: 'Full Name', key: 'fullName', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Role', key: 'role', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Created Date', key: 'createdDate', width: 20 },
    { header: 'Last Login', key: 'lastLogin', width: 20 },
  ];

  // Add rows
  users.forEach(user => {
    worksheet.addRow({
      userId: user.id.slice(0, 8),
      fullName: user.full_name || 'Unknown',
      email: user.email || 'No email',
      phone: user.phone || 'No phone',
      role: user.role,
      status: user.status,
      createdDate: format(new Date(user.created_at), 'yyyy-MM-dd HH:mm:ss'),
      lastLogin: user.last_login ? format(new Date(user.last_login), 'yyyy-MM-dd HH:mm:ss') : 'Never',
    });
  });

  // Style the header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD4AF37' } // Gold color
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Auto-filter
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 8 }
  };

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `AXELS_Users_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};
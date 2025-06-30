import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { formatCurrency } from '../lib/utils';

// Define types for analytics data
interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  conversionRate: number;
}

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

interface CategoryData {
  category: string;
  revenue: number;
  orders: number;
  averagePrice: number;
}

interface RegionalData {
  region: string;
  revenue: number;
  orders: number;
  customers: number;
}

interface TopProductData {
  id: string;
  name: string;
  revenue: number;
  quantity: number;
  category: string;
  inStock: number;
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  salesTrend: SalesData[];
  categoryPerformance: CategoryData[];
  regionalSales: RegionalData[];
  topProducts: TopProductData[];
  stockLevels: { low: number; medium: number; high: number; outOfStock: number };
}

interface ExportOptions {
  dateRange: { from: Date; to: Date };
  category?: string;
  region?: string;
}

// Function to export analytics data to CSV
export const exportAnalyticsToCSV = async (data: AnalyticsData, options: ExportOptions): Promise<void> => {
  // Format date range for filename
  const fromDate = format(options.dateRange.from, 'yyyy-MM-dd');
  const toDate = format(options.dateRange.to, 'yyyy-MM-dd');
  
  // Create CSV content
  let csvContent = 'data:text/csv;charset=utf-8,';
  
  // Add report header
  csvContent += `AXELS Jewelry Analytics Report\r\n`;
  csvContent += `Date Range: ${format(options.dateRange.from, 'MMM d, yyyy')} to ${format(options.dateRange.to, 'MMM d, yyyy')}\r\n`;
  if (options.category && options.category !== 'all') {
    csvContent += `Category: ${options.category}\r\n`;
  }
  if (options.region && options.region !== 'all') {
    csvContent += `Region: ${options.region}\r\n`;
  }
  csvContent += `Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}\r\n\r\n`;
  
  // Add summary section
  csvContent += `SUMMARY\r\n`;
  csvContent += `Total Revenue,${formatCurrency(data.summary.totalRevenue)}\r\n`;
  csvContent += `Total Orders,${data.summary.totalOrders}\r\n`;
  csvContent += `Total Customers,${data.summary.totalCustomers}\r\n`;
  csvContent += `Average Order Value,${formatCurrency(data.summary.averageOrderValue)}\r\n`;
  csvContent += `Conversion Rate,${data.summary.conversionRate.toFixed(2)}%\r\n\r\n`;
  
  // Add sales trend section
  csvContent += `SALES TREND\r\n`;
  csvContent += `Date,Revenue,Orders\r\n`;
  data.salesTrend.forEach(item => {
    csvContent += `${item.date},${formatCurrency(item.revenue)},${item.orders}\r\n`;
  });
  csvContent += `\r\n`;
  
  // Add category performance section
  csvContent += `CATEGORY PERFORMANCE\r\n`;
  csvContent += `Category,Revenue,Orders,Average Price\r\n`;
  data.categoryPerformance.forEach(item => {
    csvContent += `${item.category},${formatCurrency(item.revenue)},${item.orders},${formatCurrency(item.averagePrice)}\r\n`;
  });
  csvContent += `\r\n`;
  
  // Add regional sales section
  csvContent += `REGIONAL SALES\r\n`;
  csvContent += `Region,Revenue,Orders,Customers\r\n`;
  data.regionalSales.forEach(item => {
    csvContent += `${item.region},${formatCurrency(item.revenue)},${item.orders},${item.customers}\r\n`;
  });
  csvContent += `\r\n`;
  
  // Add top products section
  csvContent += `TOP PRODUCTS\r\n`;
  csvContent += `ID,Name,Category,Revenue,Quantity,In Stock\r\n`;
  data.topProducts.forEach(item => {
    csvContent += `${item.id},${item.name},${item.category},${formatCurrency(item.revenue)},${item.quantity},${item.inStock}\r\n`;
  });
  csvContent += `\r\n`;
  
  // Add stock levels section
  csvContent += `STOCK LEVELS\r\n`;
  csvContent += `Level,Count\r\n`;
  csvContent += `Low Stock,${data.stockLevels.low}\r\n`;
  csvContent += `Medium Stock,${data.stockLevels.medium}\r\n`;
  csvContent += `High Stock,${data.stockLevels.high}\r\n`;
  csvContent += `Out of Stock,${data.stockLevels.outOfStock}\r\n`;
  
  // Create filename
  const filename = `AXELS_Analytics_${fromDate}_to_${toDate}.csv`;
  
  // Create a download link and trigger the download
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Function to export analytics data to PDF
export const exportAnalyticsToPDF = async (data: AnalyticsData, options: ExportOptions): Promise<void> => {
  try {
    // Since we can't use libraries like jsPDF directly in this environment,
    // we'll create a simple HTML-based PDF export that the browser can print
    
    // Create a new window for the PDF content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please check your popup blocker settings.');
    }
    
    // Format date range for display
    const fromDate = format(options.dateRange.from, 'MMM d, yyyy');
    const toDate = format(options.dateRange.to, 'MMM d, yyyy');
    
    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>AXELS Jewelry Analytics Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          h1, h2 {
            color: #C6A050;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #C6A050;
            padding-bottom: 10px;
          }
          .section {
            margin-bottom: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .summary-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            background-color: #f9f9f9;
          }
          .summary-card h3 {
            margin-top: 0;
            color: #555;
          }
          .summary-card p {
            font-size: 24px;
            font-weight: bold;
            color: #C6A050;
            margin: 5px 0;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #777;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>AXELS Jewelry Analytics Report</h1>
          <p>Date Range: ${fromDate} to ${toDate}</p>
          ${options.category && options.category !== 'all' ? `<p>Category: ${options.category}</p>` : ''}
          ${options.region && options.region !== 'all' ? `<p>Region: ${options.region}</p>` : ''}
          <p>Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}</p>
        </div>
        
        <div class="section">
          <h2>Summary</h2>
          <div class="summary-grid">
            <div class="summary-card">
              <h3>Total Revenue</h3>
              <p>${formatCurrency(data.summary.totalRevenue)}</p>
            </div>
            <div class="summary-card">
              <h3>Total Orders</h3>
              <p>${data.summary.totalOrders}</p>
            </div>
            <div class="summary-card">
              <h3>Total Customers</h3>
              <p>${data.summary.totalCustomers}</p>
            </div>
            <div class="summary-card">
              <h3>Average Order Value</h3>
              <p>${formatCurrency(data.summary.averageOrderValue)}</p>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2>Sales Trend</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Revenue</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              ${data.salesTrend.map(item => `
                <tr>
                  <td>${item.date}</td>
                  <td>${formatCurrency(item.revenue)}</td>
                  <td>${item.orders}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Category Performance</h2>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Revenue</th>
                <th>Orders</th>
                <th>Average Price</th>
              </tr>
            </thead>
            <tbody>
              ${data.categoryPerformance.map(item => `
                <tr>
                  <td>${item.category}</td>
                  <td>${formatCurrency(item.revenue)}</td>
                  <td>${item.orders}</td>
                  <td>${formatCurrency(item.averagePrice)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Regional Sales</h2>
          <table>
            <thead>
              <tr>
                <th>Region</th>
                <th>Revenue</th>
                <th>Orders</th>
                <th>Customers</th>
              </tr>
            </thead>
            <tbody>
              ${data.regionalSales.map(item => `
                <tr>
                  <td>${item.region}</td>
                  <td>${formatCurrency(item.revenue)}</td>
                  <td>${item.orders}</td>
                  <td>${item.customers}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Top Products</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Revenue</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${data.topProducts.map(item => `
                <tr>
                  <td>${item.id}</td>
                  <td>${item.name}</td>
                  <td>${item.category}</td>
                  <td>${formatCurrency(item.revenue)}</td>
                  <td>${item.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>AXELS Jewelry Analytics Report - Confidential</p>
          <p>© ${new Date().getFullYear()} AXELS Jewelry. All rights reserved.</p>
        </div>
        
        <script>
          // Auto-print when loaded
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;
    
    // Write the HTML content to the new window
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
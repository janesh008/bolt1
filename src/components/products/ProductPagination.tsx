import Button from '../ui/Button';

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
}

const ProductPagination: React.FC<ProductPaginationProps> = ({
  currentPage,
  totalPages,
  setCurrentPage
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <Button
        variant="outline"
        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        const page = i + 1;
        return (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </Button>
        );
      })}
      
      <Button
        variant="outline"
        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  );
};

export default ProductPagination;
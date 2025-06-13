import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description }) => {
  return (
    <div className="mb-8">
      <h1 className="font-serif text-3xl md:text-4xl text-charcoal-800 mb-2">{title}</h1>
      {description && <p className="text-charcoal-500">{description}</p>}
      <div className="w-20 h-1 bg-gold-400 mt-4"></div>
    </div>
  );
};

export default PageHeader;
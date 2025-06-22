import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import AIAssistant from '../ai-assistant/AIAssistant';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-16">
        {children}
      </main>
      <AIAssistant />
      <Footer />
    </div>
  );
};

export default Layout;
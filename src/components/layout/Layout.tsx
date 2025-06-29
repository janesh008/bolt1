import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import MultilingualAssistant from '../multilingual-assistant/MultilingualAssistant';
import MultilingualAssistant from '../multilingual-assistant/MultilingualAssistant';

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
      <Footer />
      <MultilingualAssistant />
      <MultilingualAssistant />
    </div>
  );
};

export default Layout;
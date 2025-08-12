import './styles/globals.css';
import { Inter } from 'next/font/google';
import Providers from './components/Providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Crypto Advisor',
  description: 'Make informed cryptocurrency investment decisions',
};

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Portfolio', href: '/portfolio' },
  { name: 'Watchlist', href: '/watchlist' },
  { name: 'Analysis', href: '/analysis' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen">
            <nav className="shadow">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex">
                    <div className="flex-shrink-0 flex items-center">
                      <span className="text-xl font-bold text-indigo-600 dark:text-accent-cyan">CryptoAdvisor</span>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                      {navigation.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-200 dark:hover:text-white dark:hover:border-accent-cyan inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                        >
                          {item.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </nav>
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}

import { ReactNode } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  CpuChipIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  HomeIcon,
  ServerIcon,
  CloudIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Logs', href: '/admin/logs', icon: DocumentTextIcon },
  { name: 'Cache', href: '/admin/cache', icon: ServerIcon },
  { name: 'Workflows', href: '/admin/workflows', icon: ChartBarIcon },
];

export default function AdminLayout({ children, title = 'Panel de Administración', description = 'Sistema Mexa - Scraping Inteligente' }: AdminLayoutProps) {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{title} - Mexa</title>
        <meta name="description" content={description} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-black/20 backdrop-blur-xl border-r border-white/10">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center px-6 py-6 border-b border-white/10">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg">
                <CpuChipIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-white">Mexa</h1>
                <p className="text-xs text-purple-200">Admin Panel</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-400/30'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10">
              <div className="flex items-center text-xs text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Sistema Activo
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="pl-64">
          {/* Header */}
          <header className="bg-black/20 backdrop-blur-md border-b border-white/10">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">{title}</h1>
                  <p className="text-purple-200">{description}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right text-sm">
                    <div className="text-white font-medium">Sistema Mexa</div>
                    <div className="text-purple-200">v1.0.0</div>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <EyeIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

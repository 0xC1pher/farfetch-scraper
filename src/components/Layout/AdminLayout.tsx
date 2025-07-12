import { ReactNode } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Cpu,
  BarChart2,
  FileText,
  Settings,
  Home,
  Database,
  Cloud,
  Eye,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Logs', href: '/admin/logs', icon: FileText },
  { name: 'Cache', href: '/admin/cache', icon: Database },
  { name: 'Workflows', href: '/admin/workflows', icon: BarChart2 },
];

export default function AdminLayout({ children, title = 'Panel de Administración', description = 'Sistema Mexa - Scraping Inteligente' }: AdminLayoutProps) {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>{title} - Mexa</title>
        <meta name="description" content={description} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl border-r border-gray-200/50 shadow-2xl">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center px-8 py-8 border-b border-gray-100">
              <div className="relative">
                <div className="p-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl shadow-lg">
                  <Cpu className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Mexa</h1>
                <p className="text-sm text-gray-500 font-medium">Sistema de Administración</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-6 py-8 space-y-4">
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Navegación Principal</h3>
              </div>

              {navigation.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-5 py-4 text-sm font-medium rounded-2xl transition-all duration-300 transform ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/25 scale-105'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-blue-700 hover:shadow-lg hover:scale-105'
                    }`}
                  >
                    <div className={`p-2 rounded-xl mr-4 transition-all duration-300 ${
                      isActive
                        ? 'bg-white/20'
                        : 'bg-blue-100 group-hover:bg-blue-200'
                    }`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="font-semibold">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="px-6 py-6 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-xs text-gray-500 font-medium">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse shadow-lg shadow-green-500/50"></div>
                  <span className="font-semibold">Sistema Operativo</span>
                </div>
                <div className="text-xs text-gray-400">
                  v2.1.0
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="pl-72">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-2xl border-b border-gray-200/50 shadow-lg">
            <div className="px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">{title}</h1>
                  <p className="text-gray-600 mt-1 font-medium">{description}</p>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-3 text-sm text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-2 rounded-2xl border border-emerald-200 shadow-sm">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                    <span className="font-semibold">Sistema Online</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                      <Eye className="h-5 w-5 text-white" />
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                      <Settings className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

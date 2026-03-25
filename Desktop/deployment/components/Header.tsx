import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AutoFix
            </span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/failures"
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Failures
            </Link>
            <Link
              href="/api/auth/signout"
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Sign Out
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

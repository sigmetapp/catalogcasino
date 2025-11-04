import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
        404
      </h1>
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-3 sm:mb-4">
        Page Not Found
      </h2>
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6 sm:mb-8">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
      >
        Go Back Home
      </Link>
    </div>
  );
}

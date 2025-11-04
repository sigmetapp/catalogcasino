export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-blue-600 to-purple-600 text-white mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-sm sm:text-base">
            © {currentYear} Casino Directory. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto bg-slate-950/80 border-t border-white/10">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-slate-400">
          &copy; {new Date().getFullYear()} PDF Atelier. Crafted with secure client-side processing.
        </p>
      </div>
    </footer>
  );
}

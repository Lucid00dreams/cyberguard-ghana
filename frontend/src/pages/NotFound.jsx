import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <h1 className="text-4xl font-semibold mb-2">404</h1>
      <p className="text-mist mb-6">This page doesn't exist.</p>
      <Link to="/" className="text-guard font-semibold">Back to home</Link>
    </div>
  );
}

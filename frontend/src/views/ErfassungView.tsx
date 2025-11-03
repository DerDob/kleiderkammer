import React, { useState } from 'react';
import { Clothing } from '../types';
import * as api from '../api';

export default function ErfassungView() {
  const [formData, setFormData] = useState({
    clothing: '',
    size: '',
    count: 1
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      await api.addClothing(formData);
      setSuccess(true);
      setFormData({ clothing: '', size: '', count: 1 });
    } catch (err) {
      setError('Fehler beim Speichern der Kleidung');
      console.error(err);
    }
  };

  return (
    <div className="py-10">
      <header>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">Kleidung erfassen</h1>
      </header>
      
      <div className="mt-10 max-w-md">
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4 mb-4">
            <div className="text-sm text-green-700">Kleidung wurde erfolgreich gespeichert</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="clothing" className="block text-sm font-medium leading-6 text-gray-900">
              Bezeichnung
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="clothing"
                id="clothing"
                value={formData.clothing}
                onChange={e => setFormData(d => ({ ...d, clothing: e.target.value }))}
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <label htmlFor="size" className="block text-sm font-medium leading-6 text-gray-900">
              Größe
            </label>
            <div className="mt-2">
              <input
                type="text"
                name="size"
                id="size"
                value={formData.size}
                onChange={e => setFormData(d => ({ ...d, size: e.target.value }))}
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <label htmlFor="count" className="block text-sm font-medium leading-6 text-gray-900">
              Anzahl
            </label>
            <div className="mt-2">
              <input
                type="number"
                name="count"
                id="count"
                min="1"
                value={formData.count}
                onChange={e => setFormData(d => ({ ...d, count: parseInt(e.target.value, 10) }))}
                required
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
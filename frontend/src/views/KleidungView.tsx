import React, { useEffect, useState } from 'react';
import { Clothing } from '../types';
import * as api from '../api';

export default function KleidungView() {
  const [clothing, setClothing] = useState<Clothing[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClothing();
  }, []);

  const loadClothing = async () => {
    try {
      const items = await api.getClothing();
      setClothing(items);
    } catch (err) {
      setError('Fehler beim Laden der Kleidung');
      console.error(err);
    }
  };

  return (
    <div className="py-10">
      <header>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">Kleidungsbestand</h1>
      </header>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mt-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Bezeichnung
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Größe
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Verfügbar
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Ausgeliehen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {clothing.map((item) => (
                    <tr key={`${item.clothing}-${item.size}`}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {item.clothing}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.size}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.count}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{item.lent || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
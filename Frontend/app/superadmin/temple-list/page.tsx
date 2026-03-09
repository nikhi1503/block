"use client";

import React, { useState, useEffect } from "react";
import AuthWrapper from "@/app/components/AuthWrapper";

export default function TempleList() {
  const [temples, setTemples] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Number of temples per page
  const [total, setTotal] = useState(0); // Total number of temples

  useEffect(() => {
    const fetchActiveTempleAdmins = async () => {
      try {
        // Use hardcoded temples for now
        const hardcodedTemples = [
          {
            _id: "1",
            name: "Shiva Mandir",
            email: "shiva@temple.com",
            phone: "+91-1234567890",
            templeName: "Shiva Mandir",
            location: "Delhi, Delhi",
            isActive: true,
          },
          {
            _id: "2",
            name: "Vishnu Temple",
            email: "vishnu@temple.com",
            phone: "+91-1234567891",
            templeName: "Vishnu Temple",
            location: "Mumbai, Maharashtra",
            isActive: true,
          },
          {
            _id: "3",
            name: "Krishna Mandir",
            email: "krishna@temple.com",
            phone: "+91-1234567892",
            templeName: "Krishna Mandir",
            location: "Bangalore, Karnataka",
            isActive: true,
          },
        ];

        setTemples(hardcodedTemples);
        setTotal(hardcodedTemples.length);
      } catch (error) {
        console.error("Error loading temples:", error);
        setTemples([]);
        setTotal(0);
      }
    };

    fetchActiveTempleAdmins();
  }, [page, limit]); // Refetch data when page or limit changes

  // Calculate total pages
  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

  return (
    <AuthWrapper role="superAdmin">
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800">
          All Active Temples
        </h2>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Temple Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Temple Location</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {temples.length > 0 ? (
                  temples.map((temple, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">{temple.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{temple.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{temple.phone}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{temple.templeName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{temple.templeLocation}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          {temple.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-600">
                      No active temples found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${page === 1 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className={`px-4 py-2 text-sm font-medium rounded-lg ${page === totalPages ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
          >
            Next
          </button>
        </div>
      </div>
    </AuthWrapper>
  );
}
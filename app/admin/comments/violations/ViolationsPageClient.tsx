'use client';

import { Ban, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import Image from 'next/image';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
}

interface Violation {
  id: string;
  userId: string;
  commentId: string | null;
  violationType: string;
  violationCount: number;
  totalPenaltyScore: number;
  lastViolationDate: string;
  createdAt: string;
  updatedAt: string;
  user: User;
}

interface ViolationsPageClientProps {
  violations: Violation[];
}

export default function ViolationsPageClient({
  violations = [],
}: ViolationsPageClientProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">کاربران خاطی</h1>
          <p className="text-gray-500 mt-1">
            لیست کاربرانی که کامنت نامناسب گذاشته‌اند
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {violations.length === 0 ? (
          <div className="text-center py-12">
            <Ban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">کاربر خاطی‌ای یافت نشد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    کاربر
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    تعداد تخلف
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    مجموع امتیاز منفی
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    آخرین تخلف
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    تاریخ عضویت
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {violations.map((violation) => (
                  <tr key={violation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {violation.user.image ? (
                          <div className="relative w-10 h-10 rounded-full overflow-hidden">
                            <Image
                              src={violation.user.image}
                              alt={violation.user.name || 'User'}
                              fill
                              className="object-cover"
                              unoptimized={true}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-medium">
                              {(violation.user.name || violation.user.email)[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {violation.user.name || 'بدون نام'}
                          </p>
                          <p className="text-sm text-gray-500">{violation.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <span className="font-bold text-red-600">{violation.violationCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-bold">
                          ⚠️ {violation.totalPenaltyScore || 0}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDistanceToNow(new Date(violation.lastViolationDate), {
                        addSuffix: true,
                        locale: faIR,
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDistanceToNow(new Date(violation.user.createdAt), {
                        addSuffix: true,
                        locale: faIR,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


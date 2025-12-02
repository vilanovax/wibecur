'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Trash2, Edit, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface Comment {
  id: string;
  content: string;
  isFiltered: boolean;
  isApproved: boolean;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  users: {
    id: string;
    name: string | null;
    email: string;
  };
  items: {
    id: string;
    title: string;
  };
}

interface Report {
  id: string;
  commentId: string;
  userId: string;
  reason: string | null;
  resolved: boolean;
  createdAt: string;
  users: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface ReportGroup {
  comment: Comment;
  reports: Report[];
  reportCount: number;
}

interface ReportsPageClientProps {
  reports: ReportGroup[];
  currentResolved: string | undefined;
}

export default function ReportsPageClient({
  reports = [],
  currentResolved,
}: ReportsPageClientProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');

  const handleApprove = async (commentId: string) => {
    try {
      const res = await fetch(`/api/admin/comments/${commentId}/approve`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to approve');

      router.refresh();
    } catch (error) {
      console.error('Error approving comment:', error);
      alert('خطا در تایید کامنت');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('آیا از حذف این کامنت اطمینان دارید؟')) return;

    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      router.refresh();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('خطا در حذف کامنت');
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editedContent.trim()) {
      alert('لطفاً متن کامنت را وارد کنید');
      return;
    }

    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editedContent }),
      });

      if (!res.ok) throw new Error('Failed to update');

      setEditingId(null);
      setEditedContent('');
      router.refresh();
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('خطا در ویرایش کامنت');
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditedContent(comment.content);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">ریپورت‌های کامنت‌ها</h1>
        <div className="flex gap-2">
          <a
            href="/admin/comments/reports?resolved=false"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentResolved === 'false'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            حل نشده
          </a>
          <a
            href="/admin/comments/reports?resolved=true"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentResolved === 'true'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            حل شده
          </a>
          <a
            href="/admin/comments/reports"
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !currentResolved
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            همه
          </a>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <Flag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">ریپورتی یافت نشد</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((reportGroup) => (
            <div
              key={reportGroup.comment.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                {/* Comment Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                        🚩 {reportGroup.reportCount} ریپورت
                      </span>
                      <span className="text-sm text-gray-500">
                        در آیتم: {reportGroup.comment.items.title}
                      </span>
                    </div>
                    {editingId === reportGroup.comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(reportGroup.comment.id)}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                          >
                            ذخیره
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditedContent('');
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            انصراف
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p
                        className={`text-gray-900 ${
                          reportGroup.comment.isFiltered ? 'text-gray-500 italic' : ''
                        }`}
                      >
                        {reportGroup.comment.content}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>توسط: {reportGroup.comment.users.name || reportGroup.comment.users.email}</span>
                      <span>❤️ {reportGroup.comment.likeCount}</span>
                      <span>
                        {formatDistanceToNow(new Date(reportGroup.comment.createdAt), {
                          addSuffix: true,
                          locale: faIR,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mr-4">
                    {!reportGroup.comment.isApproved && (
                      <button
                        onClick={() => handleApprove(reportGroup.comment.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="تایید و پاک کردن ریپورت‌ها"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(reportGroup.comment)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="ویرایش"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(reportGroup.comment.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Reports List */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    دلایل ریپورت:
                  </h3>
                  <div className="space-y-2">
                    {reportGroup.reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="text-sm text-gray-900">
                            {report.reason || 'بدون دلیل'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            توسط: {report.users.name || report.users.email} •{' '}
                            {formatDistanceToNow(new Date(report.createdAt), {
                              addSuffix: true,
                              locale: faIR,
                            })}
                          </p>
                        </div>
                        {report.resolved && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            حل شده
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


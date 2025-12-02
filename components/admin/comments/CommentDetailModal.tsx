'use client';

import { useState } from 'react';
import { X, Edit2, Save, XCircle } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface Comment {
  id: string;
  content: string;
  isFiltered: boolean;
  isApproved: boolean;
  likeCount: number;
  createdAt: string;
  users: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  items: {
    id: string;
    title: string;
  };
  _count: {
    comment_reports: number;
  };
}

interface CommentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  comment: Comment | null;
  badWords?: string[];
  onEdit: (commentId: string, newContent: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onApprove: (commentId: string) => Promise<void>;
  onPenaltySubmit: (commentId: string, score: number, action: string) => Promise<void>;
  isLoading?: boolean;
}

export default function CommentDetailModal({
  isOpen,
  onClose,
  comment,
  badWords = [],
  onEdit,
  onDelete,
  onApprove,
  onPenaltySubmit,
  isLoading = false,
}: CommentDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [penaltyScore, setPenaltyScore] = useState(0);

  if (!isOpen || !comment) return null;

  // Initialize edited content when editing starts
  const handleStartEdit = () => {
    setEditedContent(comment.content);
    setIsEditing(true);
  };

  // Helper function to highlight bad words with bold and red color
  const highlightBadWords = (text: string): React.ReactNode => {
    if (!badWords || badWords.length === 0 || !comment.isFiltered) {
      return <span>{text}</span>;
    }
    
    let result: React.ReactNode[] = [];
    let lastIndex = 0;
    let processedText = text;
    
    // Find all bad words and their positions
    const badWordMatches: Array<{ word: string; index: number; length: number }> = [];
    badWords.forEach((badWord) => {
      const escapedWord = badWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedWord, 'gi');
      let match;
      while ((match = regex.exec(processedText)) !== null) {
        badWordMatches.push({
          word: match[0],
          index: match.index,
          length: match[0].length,
        });
      }
    });
    
    // Sort by index
    badWordMatches.sort((a, b) => a.index - b.index);
    
    // Remove overlapping matches (keep the first one)
    const nonOverlappingMatches: Array<{ word: string; index: number; length: number }> = [];
    badWordMatches.forEach((match) => {
      const overlaps = nonOverlappingMatches.some(
        (existing) =>
          (match.index >= existing.index &&
            match.index < existing.index + existing.length) ||
          (existing.index >= match.index &&
            existing.index < match.index + match.length)
      );
      if (!overlaps) {
        nonOverlappingMatches.push(match);
      }
    });
    
    // Build the result with highlighted bad words
    nonOverlappingMatches.forEach((match) => {
      // Add text before the match
      if (match.index > lastIndex) {
        result.push(
          <span key={`text-${lastIndex}`}>
            {processedText.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      // Add the highlighted bad word
      result.push(
        <span key={`bad-${match.index}`} className="font-bold text-red-600">
          {match.word}
        </span>
      );
      
      lastIndex = match.index + match.length;
    });
    
    // Add remaining text
    if (lastIndex < processedText.length) {
      result.push(
        <span key={`text-${lastIndex}`}>
          {processedText.substring(lastIndex)}
        </span>
      );
    }
    
    return <>{result}</>;
  };

  const handleSaveEdit = async () => {
    if (!editedContent.trim()) {
      alert('لطفاً متن کامنت را وارد کنید');
      return;
    }

    setIsSaving(true);
    try {
      await onEdit(comment.id, editedContent);
      setIsEditing(false);
      // Always show penalty modal after editing
      setShowPenaltyModal(true);
    } catch (error: any) {
      alert(error.message || 'خطا در ویرایش کامنت');
      setIsSaving(false);
    }
  };

  const handlePenaltySubmit = async () => {
    try {
      await onPenaltySubmit(comment.id, penaltyScore, 'edit');
      setShowPenaltyModal(false);
      setPenaltyScore(0);
      onClose();
    } catch (error: any) {
      alert(error.message || 'خطا در ثبت امتیاز');
    }
  };

  const handleDelete = async () => {
    if (!confirm('آیا از حذف این کامنت اطمینان دارید؟')) return;
    
    // If filtered or reported, show penalty modal first
    if (comment.isFiltered || comment._count.comment_reports > 0) {
      setShowPenaltyModal(true);
    } else {
      await onDelete(comment.id);
      onClose();
    }
  };

  const handleApprove = async () => {
    // If filtered or reported, show penalty modal first
    if (comment.isFiltered || comment._count.comment_reports > 0) {
      setShowPenaltyModal(true);
    } else {
      await onApprove(comment.id);
      onClose();
    }
  };

  // Penalty Modal Content
  if (showPenaltyModal) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
          onClick={() => {
            setShowPenaltyModal(false);
            setPenaltyScore(0);
          }} 
        />
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">امتیاز منفی برای کاربر</h2>
            <button
              onClick={() => {
                setShowPenaltyModal(false);
                setPenaltyScore(0);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            لطفاً میزان امتیاز منفی (۰ تا ۵) را برای کاربری که این کامنت را ارسال کرده است، انتخاب کنید.
          </p>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              امتیاز منفی (۰ تا ۵):
            </label>
            <div className="flex gap-3 justify-center">
              {[0, 1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setPenaltyScore(score)}
                  className={`w-12 h-12 rounded-full font-bold text-lg transition-all ${
                    penaltyScore === score
                      ? 'bg-red-600 text-white scale-110 shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  disabled={isLoading}
                >
                  {score}
                </button>
              ))}
            </div>
            <div className="mt-3 text-center text-xs text-gray-500">
              {penaltyScore === 0 && 'بدون امتیاز منفی'}
              {penaltyScore === 1 && 'امتیاز منفی کم: اخطار خفیف'}
              {penaltyScore === 2 && 'امتیاز منفی متوسط: اخطار جدی'}
              {penaltyScore === 3 && 'امتیاز منفی بالا: محدودیت موقت'}
              {penaltyScore === 4 && 'امتیاز منفی بسیار بالا: محدودیت طولانی'}
              {penaltyScore === 5 && 'امتیاز منفی حداکثری: مسدودسازی کاربر'}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowPenaltyModal(false);
                setPenaltyScore(0);
              }}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              انصراف
            </button>
            <button
              onClick={handlePenaltySubmit}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'در حال ثبت...' : 'ثبت امتیاز'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">جزئیات کامنت</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-4">
            {comment.users.image ? (
              <div className="relative w-16 h-16 rounded-full overflow-hidden">
                <Image
                  src={comment.users.image}
                  alt={comment.users.name || 'User'}
                  fill
                  className="object-cover"
                  unoptimized={true}
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-xl">
                  {(comment.users.name || comment.users.email)[0].toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-bold text-gray-900">
                {comment.users.name || 'بدون نام'}
              </p>
              <p className="text-sm text-gray-500">{comment.users.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: faIR,
                })}
              </p>
            </div>
          </div>

          {/* Item Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">آیتم:</p>
            <p className="font-medium text-gray-900">{comment.items.title}</p>
          </div>

          {/* Comment Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              متن کامنت:
            </label>
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isSaving}
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {highlightBadWords(comment.content)}
                </p>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">لایک:</span>
              <span className="font-medium text-gray-900">❤️ {comment.likeCount}</span>
            </div>
            {comment._count.comment_reports > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">ریپورت:</span>
                <span className="font-medium text-red-600">
                  🚩 {comment._count.comment_reports}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editedContent.trim()}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                >
                  <Save className="w-5 h-5" />
                  {isSaving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedContent('');
                  }}
                  disabled={isSaving}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleStartEdit}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Edit2 className="w-5 h-5" />
                  ویرایش کامنت
                </button>
                {!comment.isApproved && (
                  <button
                    onClick={handleApprove}
                    disabled={isLoading}
                    className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                  >
                    تایید
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
                >
                  حذف
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


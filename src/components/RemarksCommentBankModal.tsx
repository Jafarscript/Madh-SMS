/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import { Search, MessageSquareQuote, Check, X, Filter } from "lucide-react";
import { REPORT_CARD_COMMENTS, COMMENT_CATEGORIES, ReportCardComment } from "../constants/reportCardComments";

interface RemarksCommentBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentGender?: string;
  studentName?: string;
  currentCommentId?: string;
  onSelectComment: (comment: ReportCardComment) => void;
}

export const RemarksCommentBankModal: React.FC<RemarksCommentBankModalProps> = ({
  isOpen,
  onClose,
  studentGender = "N",
  studentName,
  currentCommentId,
  onSelectComment,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredComments = useMemo(() => {
    return REPORT_CARD_COMMENTS.filter((c) => {
      // Gender filter
      const matchesGender =
        c.gender === "N" ||
        studentGender === "N" ||
        !studentGender ||
        c.gender === studentGender;

      if (!matchesGender) return false;

      // Category filter
      if (selectedCategory !== "all" && c.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesEn = c.en.toLowerCase().includes(q);
        const matchesAr = c.ar.includes(q);
        return matchesEn || matchesAr;
      }

      return true;
    });
  }, [studentGender, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between" style={{ backgroundColor: "#F4F1EA" }}>
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquareQuote className="w-5 h-5 text-emerald-800" />
              Teacher Remarks & Comment Bank
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              {studentName ? `Selecting remark for ${studentName}` : "Choose standard English & Arabic remarks"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/70 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search English or Arabic phrases (e.g. 'outstanding', 'مجتهد', 'effort')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-2xs"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0 mr-1" />
            {COMMENT_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    active
                      ? "bg-emerald-800 text-white shadow-2xs"
                      : "bg-white text-gray-600 hover:bg-gray-200/70 border border-gray-200"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comment list */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
          {filteredComments.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              No remarks found matching your filter criteria.
            </div>
          ) : (
            filteredComments.map((comment) => {
              const isSelected = currentCommentId === comment.id;
              return (
                <div
                  key={comment.id}
                  onClick={() => {
                    onSelectComment(comment);
                    onClose();
                  }}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500"
                      : "border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/20 bg-white"
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <p className="text-sm font-medium text-gray-900 leading-snug">
                      {comment.en}
                    </p>
                    <p className="text-sm font-arabic text-emerald-900 leading-relaxed dir-rtl text-right">
                      {comment.ar}
                    </p>
                  </div>
                  {isSelected ? (
                    <span className="p-1 rounded-full bg-emerald-600 text-white shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-bold text-gray-400 px-2 py-0.5 rounded bg-gray-100 shrink-0">
                      {comment.gender === "M" ? "Male" : comment.gender === "F" ? "Female" : "Any"}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>{filteredComments.length} remark templates available</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemarksCommentBankModal;

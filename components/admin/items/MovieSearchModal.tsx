'use client';

import { useState } from 'react';
import { X, Star, Calendar, Film, CheckCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface MovieResult {
  id: string;
  source: 'tmdb' | 'omdb';
  title: string;
  originalTitle?: string;
  year: number | null;
  genre: string | null;
  rating: string | number | null;
  plot: string | null;
  posterUrl: string | null;
  backdropUrl?: string | null;
  imdbID?: string;
}

interface MovieSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchResults: MovieResult[];
  onSelectMovie: (movie: MovieResult) => void;
  isLoading?: boolean;
}

export default function MovieSearchModal({
  isOpen,
  onClose,
  searchResults,
  onSelectMovie,
  isLoading = false,
}: MovieSearchModalProps) {
  const [selectedMovie, setSelectedMovie] = useState<MovieResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen) return null;

  const handleSelectMovie = (movie: MovieResult) => {
    setSelectedMovie(movie);
    setShowPreview(true);
  };

  const handleConfirm = () => {
    if (selectedMovie) {
      onSelectMovie(selectedMovie);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedMovie(null);
    setShowPreview(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {showPreview ? 'تأیید انتخاب فیلم' : 'انتخاب فیلم'}
          </h2>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-gray-600">در حال جستجو...</p>
            </div>
          ) : showPreview && selectedMovie ? (
            // Preview Mode
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8">
                <div className="flex gap-8">
                  {/* Poster */}
                  <div className="flex-shrink-0">
                    {selectedMovie.posterUrl ? (
                      <Image
                        src={selectedMovie.posterUrl}
                        alt={selectedMovie.title}
                        width={300}
                        height={450}
                        className="rounded-lg shadow-lg"
                      />
                    ) : (
                      <div className="w-[300px] h-[450px] bg-gray-300 rounded-lg flex items-center justify-center">
                        <Film className="w-24 h-24 text-gray-500" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">
                      {selectedMovie.title}
                    </h3>
                    {selectedMovie.originalTitle &&
                      selectedMovie.originalTitle !== selectedMovie.title && (
                        <p className="text-lg text-gray-600 mb-4">
                          {selectedMovie.originalTitle}
                        </p>
                      )}

                    <div className="flex flex-wrap gap-4 mb-6">
                      {selectedMovie.year && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Calendar className="w-5 h-5" />
                          <span className="font-medium">{selectedMovie.year}</span>
                        </div>
                      )}
                      {selectedMovie.genre && (
                        <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                          {selectedMovie.genre}
                        </div>
                      )}
                      {selectedMovie.rating && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{selectedMovie.rating}</span>
                        </div>
                      )}
                    </div>

                    {selectedMovie.plot && (
                      <div className="bg-white rounded-lg p-4 mb-6">
                        <h4 className="font-semibold text-gray-900 mb-2">خلاصه داستان:</h4>
                        <p className="text-gray-700 leading-relaxed">
                          {selectedMovie.plot}
                        </p>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-900">
                            آیا این فیلم درست است؟
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            با تأیید، اطلاعات این فیلم در فرم شما پر خواهد شد.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Search Results Grid
            <div>
              <p className="text-gray-600 mb-4">
                {searchResults.length} فیلم یافت شد. فیلم مورد نظر خود را انتخاب کنید:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((movie) => (
                  <button
                    key={movie.id}
                    onClick={() => handleSelectMovie(movie)}
                    className="group text-right bg-white border border-gray-200 rounded-xl p-4 hover:border-primary hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex gap-4">
                      {/* Poster Thumbnail */}
                      <div className="flex-shrink-0">
                        {movie.posterUrl ? (
                          <Image
                            src={movie.posterUrl}
                            alt={movie.title}
                            width={80}
                            height={120}
                            className="rounded-lg shadow"
                          />
                        ) : (
                          <div className="w-20 h-[120px] bg-gray-200 rounded-lg flex items-center justify-center">
                            <Film className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary transition-colors line-clamp-2">
                          {movie.title}
                        </h3>
                        {movie.originalTitle && movie.originalTitle !== movie.title && (
                          <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                            {movie.originalTitle}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 mt-2">
                          {movie.year && (
                            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                              {movie.year}
                            </span>
                          )}
                          {movie.rating && (
                            <span className="text-xs px-2 py-1 bg-yellow-50 rounded-full text-yellow-700 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-500" />
                              {movie.rating}
                            </span>
                          )}
                        </div>

                        {movie.genre && (
                          <p className="text-xs text-gray-500 mt-2">{movie.genre}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            {showPreview ? (
              <>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  انتخاب فیلم دیگر
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  بله، این فیلم درست است
                </button>
              </>
            ) : (
              <button
                onClick={handleClose}
                className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                انصراف
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

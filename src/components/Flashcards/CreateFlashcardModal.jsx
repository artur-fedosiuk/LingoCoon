/**
 * FILE: src/components/Flashcards/CreateFlashcardModal.jsx
 * LAST MODIFIED: 2026-01-06
 * DESCRIPTION: Modal component for creating/editing flashcards - Modern Minimalist Design
 */

import { useEffect } from 'react';
import FlashcardForm from '../FlashcardForm';

function CreateFlashcardModal({
    isOpen,
    onClose,
    onSubmit,
    onTranslate,
    initialData = null,
    isEditing = false
}) {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleFormSubmit = async (data) => {
        await onSubmit(data);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
        >
            {/* Modal Container */}
            <div
                className="relative w-[90%] max-w-md bg-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors z-10"
                    aria-label="Close modal"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Modal Content */}
                <div className="p-6 max-h-[85vh] overflow-y-auto">
                    <FlashcardForm
                        initialData={initialData}
                        onSubmit={handleFormSubmit}
                        onCancel={onClose}
                        onTranslate={onTranslate}
                        isEditing={isEditing}
                    />
                </div>
            </div>
        </div>
    );
}

export default CreateFlashcardModal;

// src/components/ai/AiDeckGenerator.tsx
// AI-powered deck creation wizard.
//
// Flow: prompt → generating → review (edit/delete/add cards) → save → /decks/:id
//
// Phase state machine:
//   'prompt'     — user types their request
//   'generating' — Server Action running, spinner shown
//   'review'     — AI returned a deck; user can edit before saving
//   'saving'     — createDeckWithCards running
//   'error'      — something failed; user can retry

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ArrowLeft,
} from 'lucide-react';
import { generateDeckWithAI } from '@/lib/actions/ai-actions';
import { createDeckWithCards } from '@/lib/actions/deck-actions';
import type { GeneratedCard, GeneratedDeck } from '@/types/ai-deck';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const MAX_PROMPT_LENGTH = 1000;

/**
 * Supported language options for the deck metadata selectors in the review phase.
 * Add more ISO 639-1 codes here as the app expands.
 */
const LANGUAGES = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'it', label: '🇮🇹 Italiano' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'uk', label: '🇺🇦 Українська' }
] as const;

/** ISO 639-1 → display name map. Used for building dynamic suggestions. */
const LANG_NAMES: Record<string, string> = {
  en: 'English', it: 'Italian', fr: 'French', uk: 'Ukrainian',
};

/**
 * buildSuggestions — generates context-aware prompt chips.
 *
 * Why a function instead of a constant?
 * The user's target/native languages are only known at runtime (from their profile).
 * A constant would always show generic prompts unrelated to what the user is learning.
 * A function produces suggestions that are immediately actionable for this specific user.
 */
function buildSuggestions(targetLanguage: string | null, nativeLanguage: string | null): string[] {
  const target = LANG_NAMES[targetLanguage ?? ''] ?? 'a new language';
  const native = LANG_NAMES[nativeLanguage ?? ''] ?? 'your language';
  return [
    `20 ${target} words about food and cooking, with ${native} translations and example sentences`,
    `Essential ${target} verbs for beginners, with ${native} meanings`,
    `Common ${target} phrases for everyday conversation, with ${native} translations`,
    `${target} numbers, days of the week, and months — absolute beginner`,
    `15 ${target} adjectives to describe people and places, with examples`,
  ];
}

// ─── LOCAL TYPES ──────────────────────────────────────────────────────────────

/** The phase the wizard is currently in. */
type Phase = 'prompt' | 'generating' | 'review' | 'saving' | 'error';

/** Draft values while the user is editing an existing card inline. */
interface EditDraft {
  front: string;
  back: string;
  example_sentence: string;
}

/** Draft values for the "add new card" form. */
interface NewCardDraft {
  front: string;
  back: string;
  example_sentence: string;
}

const EMPTY_CARD_DRAFT: NewCardDraft = { front: '', back: '', example_sentence: '' };

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface AiDeckGeneratorProps {
  /** User's native language from their profile — used as a hint, not enforced. */
  nativeLanguage: string | null;
  /** Language the user is learning — used as a hint, not enforced. */
  targetLanguage: string | null;
}

export default function AiDeckGenerator({
  nativeLanguage,
  targetLanguage,
}: AiDeckGeneratorProps) {
  const router = useRouter();

  // ── Core wizard state ──────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('prompt');
  const [deck, setDeck] = useState<GeneratedDeck | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Prompt phase ───────────────────────────────────────────────────────────
  const [prompt, setPrompt] = useState('');

  // ── Review phase: inline card editing ─────────────────────────────────────
  // editingId: the localId of the card currently being edited, or null.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>({
    front: '',
    back: '',
    example_sentence: '',
  });

  // ── Review phase: add card form ────────────────────────────────────────────
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardDraft, setNewCardDraft] = useState<NewCardDraft>(EMPTY_CARD_DRAFT);

  // ── Handlers: prompt ──────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!prompt.trim() || phase === 'generating') return;

    setPhase('generating');
    setErrorMsg(null);

    const result = await generateDeckWithAI(prompt.trim());

    if (result.error || !result.deck) {
      setErrorMsg(result.error ?? 'Unknown error occurred.');
      setPhase('error');
      return;
    }

    setDeck(result.deck);
    setPhase('review');
  };

  // ── Handlers: deck metadata ────────────────────────────────────────────────

  const handleTitleChange = (title: string) => {
    if (!deck) return;
    setDeck({ ...deck, title });
  };

  const handleLanguageChange = (
    key: 'language_from' | 'language_to',
    value: string,
  ) => {
    if (!deck) return;
    setDeck({ ...deck, [key]: value });
  };

  // ── Handlers: card editing (inline) ───────────────────────────────────────

  /**
   * Open the inline editor for a specific card.
   * Pre-fills the draft with the card's current values.
   */
  const startEditing = (card: GeneratedCard) => {
    // Cancel any active "add card" form when starting to edit an existing card.
    setIsAddingCard(false);
    setEditingId(card.localId);
    setEditDraft({
      front: card.front,
      back: card.back,
      example_sentence: card.example_sentence ?? '',
    });
  };

  const cancelEditing = () => setEditingId(null);

  /**
   * Persist the draft into the deck state.
   * If the user clears a field, we fall back to the original value (no data loss).
   * empty example_sentence → null (consistent with DB schema).
   */
  const saveEditing = (localId: string) => {
    if (!deck) return;
    setDeck({
      ...deck,
      cards: deck.cards.map((c) =>
        c.localId === localId
          ? {
              ...c,
              front: editDraft.front.trim() || c.front,
              back: editDraft.back.trim() || c.back,
              example_sentence: editDraft.example_sentence.trim() || null,
            }
          : c,
      ),
    });
    setEditingId(null);
  };

  const deleteCard = (localId: string) => {
    if (!deck) return;
    // Close the editor if we're deleting the card currently being edited.
    if (editingId === localId) setEditingId(null);
    setDeck({ ...deck, cards: deck.cards.filter((c) => c.localId !== localId) });
  };

  // ── Handlers: add card ─────────────────────────────────────────────────────

  const handleAddCard = () => {
    if (!deck || !newCardDraft.front.trim() || !newCardDraft.back.trim()) return;

    const newCard: GeneratedCard = {
      // crypto.randomUUID() is available as a global Web API in Node.js 18+ and modern browsers.
      localId: crypto.randomUUID(),
      front: newCardDraft.front.trim(),
      back: newCardDraft.back.trim(),
      example_sentence: newCardDraft.example_sentence.trim() || null,
    };

    setDeck({ ...deck, cards: [...deck.cards, newCard] });
    setNewCardDraft(EMPTY_CARD_DRAFT);
    setIsAddingCard(false);
  };

  // ── Handlers: save ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!deck || deck.cards.length === 0 || phase === 'saving') return;

    setPhase('saving');

    const result = await createDeckWithCards(
      deck.title,
      deck.language_from,
      deck.language_to,
      deck.cards.map((c) => ({
        front: c.front,
        back: c.back,
        example_sentence: c.example_sentence,
      })),
    );

    if (result.error || !result.deck) {
      setErrorMsg(result.error ?? 'Failed to save deck.');
      setPhase('error');
      return;
    }

    // Navigate to the new deck's page. router.push triggers a full RSC re-render.
    router.push(`/decks/${result.deck.id}`);
  };

  // ── Render: generating ─────────────────────────────────────────────────────

  if (phase === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-white animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-gray-800 font-semibold">Generating your deck…</p>
          <p className="text-gray-400 text-sm mt-1 max-w-xs">
            Selecting vocabulary, writing translations, and adding example sentences.
          </p>
        </div>
        <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
      </div>
    );
  }

  // ── Render: error ──────────────────────────────────────────────────────────

  if (phase === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="text-center">
          <p className="text-red-500 font-medium text-sm">{errorMsg}</p>
          <p className="text-gray-400 text-xs mt-1">Check the console for technical details.</p>
        </div>
        <button
          onClick={() => setPhase(deck ? 'review' : 'prompt')}
          className="text-sm text-gray-600 underline underline-offset-4 hover:text-gray-900 transition-colors"
        >
          ← Go back
        </button>
      </div>
    );
  }

  // ── Render: review + saving ────────────────────────────────────────────────

  if ((phase === 'review' || phase === 'saving') && deck) {
    const isSaving = phase === 'saving';

    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPhase('prompt')}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-30"
            aria-label="Back to prompt"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">Review your deck</h1>
            <p className="text-xs text-gray-400">Edit, add, or delete cards before saving.</p>
          </div>
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
            {deck.cards.length} cards
          </span>
        </div>

        {/* ── Deck metadata ───────────────────────────────────────────────── */}
        <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Deck title
            </label>
            <input
              type="text"
              value={deck.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              disabled={isSaving}
              className="w-full text-sm font-medium border border-gray-200 rounded-lg px-3 py-2
                         focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200
                         disabled:opacity-50 bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Front language
              </label>
              <select
                value={deck.language_from}
                onChange={(e) => handleLanguageChange('language_from', e.target.value)}
                disabled={isSaving}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white
                           focus:outline-none focus:border-violet-400 disabled:opacity-50"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Back language
              </label>
              <select
                value={deck.language_to}
                onChange={(e) => handleLanguageChange('language_to', e.target.value)}
                disabled={isSaving}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white
                           focus:outline-none focus:border-violet-400 disabled:opacity-50"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Cards list ──────────────────────────────────────────────────── */}
        <div className="space-y-2">
          {deck.cards.map((card, index) => (
            <CardRow
              key={card.localId}
              card={card}
              index={index}
              isEditing={editingId === card.localId}
              editDraft={editDraft}
              disabled={isSaving}
              onStartEdit={() => startEditing(card)}
              onDraftChange={setEditDraft}
              onSaveEdit={() => saveEditing(card.localId)}
              onCancelEdit={cancelEditing}
              onDelete={() => deleteCard(card.localId)}
            />
          ))}
        </div>

        {/* ── Add card ────────────────────────────────────────────────────── */}
        {isAddingCard ? (
          <AddCardForm
            draft={newCardDraft}
            onDraftChange={setNewCardDraft}
            onSave={handleAddCard}
            onCancel={() => {
              setIsAddingCard(false);
              setNewCardDraft(EMPTY_CARD_DRAFT);
            }}
          />
        ) : (
          <button
            onClick={() => {
              setIsAddingCard(true);
              setEditingId(null); // close any open editor
            }}
            disabled={isSaving}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm
                       text-gray-400 hover:border-violet-300 hover:text-violet-500 transition-all
                       flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            Add card
          </button>
        )}

        {/* ── Save button ─────────────────────────────────────────────────── */}
        <button
          onClick={handleSave}
          disabled={isSaving || deck.cards.length === 0}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold
                     py-3.5 rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all
                     disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save deck ({deck.cards.length} cards)
            </>
          )}
        </button>
      </div>
    );
  }

  // ── Render: prompt (default) ───────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600
                          flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Generate deck with AI</h1>
        </div>
        <p className="text-sm text-gray-500 ml-11">
          Describe what you want to learn. The AI will generate flashcards for you to review.
        </p>
      </div>

      {/* ── Prompt input ───────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          What do you want to learn?
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
          onKeyDown={(e) => {
            // Cmd/Ctrl+Enter to generate (power-user shortcut)
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleGenerate();
            }
          }}
          placeholder="e.g. Give me 20 Italian words about food and cooking, with English translations"
          rows={4}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                     placeholder-gray-400 focus:outline-none focus:border-violet-400
                     focus:ring-1 focus:ring-violet-200 resize-none bg-white"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">⌘+Enter to generate</p>
          <p className="text-xs text-gray-400">
            {prompt.length}/{MAX_PROMPT_LENGTH}
          </p>
        </div>
      </div>

      {/* ── Generate button ─────────────────────────────────────────────────── */}
      <button
        onClick={handleGenerate}
        disabled={!prompt.trim()}
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold
                   py-3.5 rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all
                   disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
      >
        <Sparkles className="w-4 h-4" />
        Generate deck
      </button>

      {/* ── Suggestion chips ────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Examples</p>
        <div className="flex flex-wrap gap-2">
          {buildSuggestions(targetLanguage, nativeLanguage).map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setPrompt(suggestion)}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600
                         hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50/50
                         transition-all leading-relaxed"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CARD ROW ─────────────────────────────────────────────────────────────────
// Private component — only used inside AiDeckGenerator.

interface CardRowProps {
  card: GeneratedCard;
  index: number;
  isEditing: boolean;
  editDraft: EditDraft;
  disabled: boolean;
  onStartEdit: () => void;
  onDraftChange: (draft: EditDraft) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}

function CardRow({
  card,
  index,
  isEditing,
  editDraft,
  disabled,
  onStartEdit,
  onDraftChange,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: CardRowProps) {
  // ── Editing mode ────────────────────────────────────────────────────────

  if (isEditing) {
    return (
      <div className="border border-violet-300 rounded-xl p-4 space-y-2.5 bg-violet-50/30">
        <div className="grid grid-cols-2 gap-2">
          <input
            autoFocus
            type="text"
            value={editDraft.front}
            onChange={(e) => onDraftChange({ ...editDraft, front: e.target.value })}
            placeholder="Front"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none
                       focus:border-violet-400 bg-white"
          />
          <input
            type="text"
            value={editDraft.back}
            onChange={(e) => onDraftChange({ ...editDraft, back: e.target.value })}
            placeholder="Back"
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none
                       focus:border-violet-400 bg-white"
          />
        </div>
        <input
          type="text"
          value={editDraft.example_sentence}
          onChange={(e) =>
            onDraftChange({ ...editDraft, example_sentence: e.target.value })
          }
          placeholder="Example sentence (optional)"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none
                     focus:border-violet-400 bg-white text-gray-500"
        />
        <div className="flex gap-3 justify-end pt-1">
          <button
            onClick={onCancelEdit}
            className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1
                       px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="w-3 h-3" />
            Cancel
          </button>
          <button
            onClick={onSaveEdit}
            className="text-xs text-violet-600 font-semibold hover:text-violet-800 flex items-center
                       gap-1 px-2 py-1 rounded-md hover:bg-violet-100 transition-colors"
          >
            <Check className="w-3 h-3" />
            Save
          </button>
        </div>
      </div>
    );
  }

  // ── Display mode ────────────────────────────────────────────────────────

  return (
    <div
      className="flex items-start gap-3 border border-gray-100 rounded-xl p-4 bg-white
                 hover:border-gray-200 group transition-colors"
    >
      {/* Card number */}
      <span className="text-xs text-gray-300 mt-0.5 w-5 text-right flex-shrink-0 select-none">
        {index + 1}
      </span>

      {/* Card content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-900">{card.front}</span>
          <span className="text-gray-300 text-xs select-none">→</span>
          <span className="text-sm text-gray-600">{card.back}</span>
        </div>
        {card.example_sentence && (
          <p className="text-xs text-gray-400 mt-0.5 italic line-clamp-1">
            {card.example_sentence}
          </p>
        )}
      </div>

      {/* Action buttons — visible on hover */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={onStartEdit}
          disabled={disabled}
          aria-label={`Edit card ${index + 1}`}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700
                     transition-colors disabled:opacity-30"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          disabled={disabled}
          aria-label={`Delete card ${index + 1}`}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500
                     transition-colors disabled:opacity-30"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── ADD CARD FORM ────────────────────────────────────────────────────────────
// Private component — only used inside AiDeckGenerator.

interface AddCardFormProps {
  draft: NewCardDraft;
  onDraftChange: (d: NewCardDraft) => void;
  onSave: () => void;
  onCancel: () => void;
}

function AddCardForm({ draft, onDraftChange, onSave, onCancel }: AddCardFormProps) {
  const canSave = draft.front.trim().length > 0 && draft.back.trim().length > 0;

  return (
    <div className="border-2 border-violet-200 rounded-xl p-4 space-y-2.5 bg-violet-50/20">
      <p className="text-xs font-semibold text-violet-600">New card</p>
      <div className="grid grid-cols-2 gap-2">
        <input
          autoFocus
          type="text"
          value={draft.front}
          onChange={(e) => onDraftChange({ ...draft, front: e.target.value })}
          placeholder="Front"
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none
                     focus:border-violet-400 bg-white"
        />
        <input
          type="text"
          value={draft.back}
          onChange={(e) => onDraftChange({ ...draft, back: e.target.value })}
          placeholder="Back"
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none
                     focus:border-violet-400 bg-white"
        />
      </div>
      <input
        type="text"
        value={draft.example_sentence}
        onChange={(e) => onDraftChange({ ...draft, example_sentence: e.target.value })}
        placeholder="Example sentence (optional)"
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none
                   focus:border-violet-400 bg-white text-gray-500"
      />
      <div className="flex gap-3 justify-end pt-1">
        <button
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1
                     px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!canSave}
          className="text-xs text-violet-600 font-semibold hover:text-violet-800 flex items-center
                     gap-1 px-2 py-1 rounded-md hover:bg-violet-100 transition-colors disabled:opacity-40"
        >
          <Check className="w-3 h-3" />
          Add
        </button>
      </div>
    </div>
  );
}

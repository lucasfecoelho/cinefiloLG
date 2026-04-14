'use client';

import { useEffect, useState } from 'react';
import { Modal }  from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Profile } from '@/types';

// ─── Filter state (exported — shared by Para Assistir + Assistidos) ────────────

export type SortOrder = 'recent' | 'az' | 'za';

export interface FilterState {
  sort:         SortOrder;
  genre:        string | null;  // genre name
  suggestedBy:  string | null;  // Profile.id
  // Assistidos extras:
  month:        string | null;  // "YYYY-MM"
  myScore:      number | null;  // 1-5  (null = no filter)
  partnerScore: number | null;  // 1-5
}

export const DEFAULT_FILTER: FilterState = {
  sort:         'recent',
  genre:        null,
  suggestedBy:  null,
  month:        null,
  myScore:      null,
  partnerScore: null,
};

export function isFilterActive(f: FilterState): boolean {
  return (
    f.sort         !== DEFAULT_FILTER.sort ||
    f.genre        !== null ||
    f.suggestedBy  !== null ||
    f.month        !== null ||
    f.myScore      !== null ||
    f.partnerScore !== null
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FilterModalProps {
  visible:           boolean;
  onClose:           () => void;
  value:             FilterState;
  onChange:          (f: FilterState) => void;
  availableGenres:   string[];
  profiles:          Profile[];
  // Assistidos extras (omit to hide the section)
  availableMonths?:  string[];  // ["YYYY-MM", ...]
  myScoreLabel?:     string;    // e.g. "Minha avaliação"
  partnerScoreLabel?: string;   // e.g. "Avaliação do(a) Fulano"
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatMonth(ym: string): string {
  const [year, month] = ym.split('-');
  const name = MONTHS_PT[parseInt(month, 10) - 1] ?? month;
  return `${name} ${year}`;
}

const SCORES = [1, 2, 3, 4, 5] as const;
const SCORE_LABEL: Record<number, string> = {
  1: '1 estrela', 2: '2 estrelas', 3: '3 estrelas',
  4: '4 estrelas', 5: '5 estrelas',
};

// ─── FilterChip ───────────────────────────────────────────────────────────────

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={[
        'px-3 py-1.5 rounded-lg text-xs font-medium',
        'border transition-colors duration-150',
        active
          ? 'bg-(--color-primary) border-(--color-primary) text-white'
          : 'bg-transparent border-[#2A2A2A] text-[#9CA3AF] hover:border-[#3A3A3A]',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold text-[#6B7280] dark:text-[#6B7280] uppercase tracking-widest">
      {children}
    </span>
  );
}

// ─── FilterModal ──────────────────────────────────────────────────────────────

export function FilterModal({
  visible,
  onClose,
  value,
  onChange,
  availableGenres,
  profiles,
  availableMonths,
  myScoreLabel,
  partnerScoreLabel,
}: FilterModalProps) {
  // Local draft — only committed on "Aplicar"
  const [draft, setDraft] = useState<FilterState>(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const set = <K extends keyof FilterState>(key: K, val: FilterState[K]) =>
    setDraft((prev) => ({ ...prev, [key]: val }));

  const toggle = <K extends keyof FilterState>(key: K, val: FilterState[K]) =>
    setDraft((prev) => ({ ...prev, [key]: prev[key] === val ? null : val }));

  const handleApply = () => {
    onChange(draft);
    onClose();
  };

  const handleClear = () => {
    onChange(DEFAULT_FILTER);
    onClose();
  };

  const showMonthSection    = !!availableMonths?.length;
  const showMyScore         = !!myScoreLabel;
  const showPartnerScore    = !!partnerScoreLabel;
  const showSuggestedBy     = profiles.length > 0;

  return (
    <Modal visible={visible} onClose={onClose} title="Filtros">
      <div className="flex flex-col gap-5 px-5 pb-6 pt-2">

        {/* ── Sort ──────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Ordenar</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { val: 'recent', label: 'Recentes' },
                { val: 'az',     label: 'A–Z'      },
                { val: 'za',     label: 'Z–A'      },
              ] as { val: SortOrder; label: string }[]
            ).map(({ val, label }) => (
              <FilterChip
                key={val}
                label={label}
                active={draft.sort === val}
                onPress={() => set('sort', val)}
              />
            ))}
          </div>
        </div>

        {/* ── Genre ─────────────────────────────────────────────────────────── */}
        {availableGenres.length > 0 && (
          <div className="flex flex-col gap-2">
            <SectionLabel>Gênero</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {availableGenres.map((g) => (
                <FilterChip
                  key={g}
                  label={g}
                  active={draft.genre === g}
                  onPress={() => toggle('genre', g)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Suggested by ──────────────────────────────────────────────────── */}
        {showSuggestedBy && (
          <div className="flex flex-col gap-2">
            <SectionLabel>Sugerido por</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {profiles.map((p) => (
                <FilterChip
                  key={p.id}
                  label={p.display_name}
                  active={draft.suggestedBy === p.id}
                  onPress={() => toggle('suggestedBy', p.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Month / Year (Assistidos) ─────────────────────────────────────── */}
        {showMonthSection && (
          <div className="flex flex-col gap-2">
            <SectionLabel>Mês</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {availableMonths!.map((m) => (
                <FilterChip
                  key={m}
                  label={formatMonth(m)}
                  active={draft.month === m}
                  onPress={() => toggle('month', m)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── My score (Assistidos) ─────────────────────────────────────────── */}
        {showMyScore && (
          <div className="flex flex-col gap-2">
            <SectionLabel>{myScoreLabel}</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {SCORES.map((s) => (
                <FilterChip
                  key={s}
                  label={SCORE_LABEL[s]}
                  active={draft.myScore === s}
                  onPress={() => toggle('myScore', s)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Partner score (Assistidos) ────────────────────────────────────── */}
        {showPartnerScore && (
          <div className="flex flex-col gap-2">
            <SectionLabel>{partnerScoreLabel}</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {SCORES.map((s) => (
                <FilterChip
                  key={s}
                  label={SCORE_LABEL[s]}
                  active={draft.partnerScore === s}
                  onPress={() => toggle('partnerScore', s)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Footer buttons ────────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-1">
          <Button variant="ghost"   size="md" onClick={handleClear}  className="flex-1">
            Limpar filtros
          </Button>
          <Button variant="primary" size="md" onClick={handleApply}  className="flex-1">
            Aplicar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

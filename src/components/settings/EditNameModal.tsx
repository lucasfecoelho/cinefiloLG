'use client';

import { useEffect, useState } from 'react';

import { Modal }  from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input }  from '@/components/ui/Input';
import { useAuth } from '@/providers/AuthProvider';

// ─── EditNameModal ────────────────────────────────────────────────────────────

export interface EditNameModalProps {
  visible:  boolean;
  onClose:  () => void;
}

const MAX = 20;

export function EditNameModal({ visible, onClose }: EditNameModalProps) {
  const { profile, updateProfile } = useAuth();

  const [name,    setName]    = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | undefined>();

  // Pre-fill when opened
  useEffect(() => {
    if (visible) {
      setName(profile?.display_name ?? '');
      setError(undefined);
    }
  }, [visible, profile?.display_name]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Nome não pode ficar vazio.'); return; }
    setSaving(true);
    const { error: err } = await updateProfile({ display_name: trimmed });
    setSaving(false);
    if (err) { setError('Não foi possível salvar. Tente novamente.'); return; }
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Editar nome">
      <div className="flex flex-col gap-4 px-5 pt-4 pb-6">
        <div className="flex flex-col gap-1.5">
          <Input
            variant="text"
            value={name}
            onChange={(e) => {
              setError(undefined);
              setName(e.target.value.slice(0, MAX));
            }}
            placeholder="Seu nome"
            maxLength={MAX}
            autoFocus
            autoComplete="off"
            error={error}
          />
          <p className="text-xs text-[#6B7280] text-right">
            {name.length}/{MAX}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={saving}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            loading={saving}
            className="flex-1"
          >
            Salvar
          </Button>
        </div>
      </div>
    </Modal>
  );
}

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Rank, RankTrackType, RankLevelType } from '../types';
import { RANK_TRACK_MAP, RANK_LEVEL_MAP } from '../types';

interface RankFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  editRank?: Rank | null;
  onClose: () => void;
  onSubmit: (data: { code: string; name: string; track: RankTrackType; level: RankLevelType }) => Promise<void>;
}

export const RankFormModal = ({
  open,
  mode,
  editRank,
  onClose,
  onSubmit,
}: RankFormModalProps) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [track, setTrack] = useState<RankTrackType>('admin');
  const [level, setLevel] = useState<RankLevelType>('middle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && editRank) {
        setCode(editRank.code);
        setName(editRank.name);
        setTrack(editRank.track);
        setLevel(editRank.level);
      } else {
        setCode('');
        setName('');
        setTrack('admin');
        setLevel('middle');
      }
      setError('');
    }
  }, [open, mode, editRank]);

  const handleSubmit = async () => {
    if (!code.trim() || !name.trim()) {
      setError(!code.trim() ? '职级代码不能为空' : '职务名称不能为空');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        track,
        level,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'create' ? '新增职级' : '编辑职级';
  const submitText = mode === 'create' ? '创建' : '保存';

  return (
    <Modal open={open} title={title} onClose={onClose} size="md">
      <div className="space-y-4">
        <Input
          label="职级代码"
          placeholder="如 M12, P8, O1"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError('');
          }}
          error={error}
          autoFocus
        />
        <div className="text-xs text-[var(--color-text-secondary)] mb-2">
          提示：M开头=职能部门，P开头=技术部门，O开头=工厂
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
            职务名称
          </label>
          <textarea
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="请输入职务名称"
            rows={2}
            maxLength={200}
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)]"
          />
          <div className="text-xs text-[var(--color-text-disabled)] text-right mt-1">
            {name.length}/200
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
            职务划分
          </label>
          <div className="flex gap-2">
            {(Object.keys(RANK_TRACK_MAP) as RankTrackType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTrack(t)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  track === t
                    ? 'bg-[var(--color-brand)] text-white'
                    : 'bg-[var(--color-surface-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
                }`}
              >
                {RANK_TRACK_MAP[t]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
            职层
          </label>
          <div className="flex gap-2">
            {(Object.keys(RANK_LEVEL_MAP) as RankLevelType[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  level === l
                    ? 'bg-[var(--color-brand)] text-white'
                    : 'bg-[var(--color-surface-bg)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]'
                }`}
              >
                {RANK_LEVEL_MAP[l]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {submitText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

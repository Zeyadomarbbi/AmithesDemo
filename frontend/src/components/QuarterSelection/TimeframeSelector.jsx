import { useState } from 'react';
import { useTimeframeContext } from '../../pages/App/hooks/Core/TimeframeContext';
import QuarterSelector from './QuarterSelector';
import AddNewTimeframeModal from './AddNewTimeframeModal/AddNewTimeframeModal';
import Prompt from '../../pages/App/components/Toast/Prompt';
import Toast from '../../pages/App/components/Toast/Toast';

function TimeframeSelector({ selected, onChange, isSingle = true, maxSelections = null }) {
    const { quarters, isLoading, saveTimeframe, deleteTimeframe } = useTimeframeContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const handleSave = async (data) => {
        const payload = editItem ? { ...data, id: editItem.id } : data;
        const result = await saveTimeframe(payload);
        if (!editItem) onChange(result.id);
        setIsModalOpen(false);
        setEditItem(null);
    };

    return (
        <>
            <QuarterSelector
                options={quarters}
                selected={selected}
                onChange={onChange}
                onAdd={() => setIsModalOpen(true)}
                onEdit={(item) => { setEditItem(item); setIsModalOpen(true); }}
                onDelete={(item) => setDeleteTarget(item.id)}
                isLoading={isLoading}
                isSingle={isSingle}
                maxSelections={maxSelections}
            />
            <AddNewTimeframeModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditItem(null); }}
                onSave={handleSave}
                onDelete={(id) => setDeleteTarget(id)}
                editData={editItem}
                existingDates={quarters.map(q => q.date)}
            />
            {deleteTarget && (
                <Prompt
                    type="error"
                    title="Delete Timeframe"
                    message="This action cannot be undone."
                    confirmLabel="Delete"
                    cancelLabel="Cancel"
                    onCancel={() => setDeleteTarget(null)}
                    onConfirm={() => {
                        deleteTimeframe(deleteTarget);
                        setDeleteTarget(null);
                        setIsModalOpen(false);
                        setEditItem(null);
                    }}
                />
            )}
        </>
    );
}

export default TimeframeSelector;
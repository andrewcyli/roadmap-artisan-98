import { useState } from 'react';
import { useLabels } from '@/context/LabelsContext';
import { LabelType, Label } from '@/types/plan';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label as UILabel } from '@/components/ui/label';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLAN_COLORS } from '@/types/plan';

interface LabelSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LabelSettingsDialog = ({ isOpen, onClose }: LabelSettingsDialogProps) => {
  const { labelTypes, labels, addLabelType, updateLabelType, deleteLabelType, addLabel, updateLabel, deleteLabel, getLabelsByType } = useLabels();
  const [activeTab, setActiveTab] = useState(labelTypes[0]?.id || '');
  const [newTypeName, setNewTypeName] = useState('');

  const handleAddLabelType = () => {
    if (!newTypeName.trim()) return;
    const newType: LabelType = {
      id: crypto.randomUUID(),
      name: newTypeName.trim(),
      pluralName: newTypeName.trim() + 's',
      color: PLAN_COLORS[labelTypes.length % PLAN_COLORS.length].value,
    };
    addLabelType(newType);
    setNewTypeName('');
    setActiveTab(newType.id);
  };

  const handleAddLabel = (typeId: string) => {
    const existingLabels = getLabelsByType(typeId);
    const newLabel: Label = {
      id: crypto.randomUUID(),
      typeId,
      name: 'New Label',
      color: PLAN_COLORS[existingLabels.length % PLAN_COLORS.length].value,
      order: existingLabels.length,
    };
    addLabel(newLabel);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Labels</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="New label type name..."
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddLabelType()}
          />
          <Button onClick={handleAddLabelType} disabled={!newTypeName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Type
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full justify-start">
            {labelTypes.map((type) => (
              <TabsTrigger key={type.id} value={type.id}>
                {type.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {labelTypes.map((type) => (
            <TabsContent key={type.id} value={type.id} className="flex-1 overflow-y-auto mt-4">
              <div className="space-y-3">
                {getLabelsByType(type.id).map((label) => (
                  <div key={label.id} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-card">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <div 
                      className="h-6 w-6 rounded-full shrink-0 cursor-pointer border-2 border-transparent hover:border-foreground/50"
                      style={{ backgroundColor: label.color }}
                    />
                    <Input
                      value={label.name}
                      onChange={(e) => updateLabel({ ...label, name: e.target.value })}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteLabel(label.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={() => handleAddLabel(type.id)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {type.name}
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

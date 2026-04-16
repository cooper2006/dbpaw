import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateDatabaseDialogProps {
  isOpen: boolean;
  connectionName?: string;
  databaseName: string;
  isLoading: boolean;
  onClose: () => void;
  onDatabaseNameChange: (name: string) => void;
  onCreate: () => void;
}

export function CreateDatabaseDialog({
  isOpen,
  connectionName,
  databaseName,
  isLoading,
  onClose,
  onDatabaseNameChange,
  onCreate,
}: CreateDatabaseDialogProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Database</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="connection">Connection</Label>
              <Input id="connection" value={connectionName || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="database">Database Name</Label>
              <Input
                id="database"
                value={databaseName}
                onChange={(e) => onDatabaseNameChange(e.target.value)}
                placeholder="Enter database name"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!databaseName.trim() || isLoading}>
              {isLoading ? 'Creating...' : 'Create Database'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

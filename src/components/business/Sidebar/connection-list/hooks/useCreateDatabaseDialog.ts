import { useState, useCallback } from "react";
import type { CreateDatabaseForm } from "../types";

interface UseCreateDatabaseDialogReturn {
  isCreateDbDialogOpen: boolean;
  createDbConnectionId: string | null;
  createDbForm: CreateDatabaseForm;
  showCreateDbAdvanced: boolean;
  createDbValidationMsg: string | null;
  openCreateDbDialog: (connectionId: string) => void;
  closeCreateDbDialog: () => void;
  setCreateDbConnectionId: React.Dispatch<React.SetStateAction<string | null>>;
  setCreateDbForm: React.Dispatch<React.SetStateAction<CreateDatabaseForm>>;
  setShowCreateDbAdvanced: React.Dispatch<React.SetStateAction<boolean>>;
  setCreateDbValidationMsg: React.Dispatch<React.SetStateAction<string | null>>;
}

const defaultCreateDatabaseForm: CreateDatabaseForm = {
  name: "",
  ifNotExists: true,
  charset: "",
  collation: "",
  encoding: "",
  lcCollate: "",
  lcCtype: "",
};

export function useCreateDatabaseDialog(): UseCreateDatabaseDialogReturn {
  const [isCreateDbDialogOpen, setIsCreateDbDialogOpen] = useState(false);
  const [createDbConnectionId, setCreateDbConnectionId] = useState<string | null>(null);
  const [createDbForm, setCreateDbForm] = useState<CreateDatabaseForm>(defaultCreateDatabaseForm);
  const [showCreateDbAdvanced, setShowCreateDbAdvanced] = useState(false);
  const [createDbValidationMsg, setCreateDbValidationMsg] = useState<string | null>(null);

  const openCreateDbDialog = useCallback((connectionId: string) => {
    setCreateDbConnectionId(connectionId);
    setCreateDbForm(defaultCreateDatabaseForm);
    setShowCreateDbAdvanced(false);
    setCreateDbValidationMsg(null);
    setIsCreateDbDialogOpen(true);
  }, []);

  const closeCreateDbDialog = useCallback(() => {
    setIsCreateDbDialogOpen(false);
    setCreateDbValidationMsg(null);
  }, []);

  return {
    isCreateDbDialogOpen,
    createDbConnectionId,
    createDbForm,
    showCreateDbAdvanced,
    createDbValidationMsg,
    openCreateDbDialog,
    closeCreateDbDialog,
    setCreateDbConnectionId,
    setCreateDbForm,
    setShowCreateDbAdvanced,
    setCreateDbValidationMsg,
  };
}

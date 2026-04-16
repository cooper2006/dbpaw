import { useCallback, useState } from "react";
import type { ConnectionForm, Driver } from "@/services/api";
import { toast } from "sonner";
import { isTauri } from "@/services/api";
import { open } from "@tauri-apps/plugin-dialog";
import { useTranslation } from "react-i18next";

interface UseFilePickerReturn {
  pickFile: (params: {
    title: string;
    filters?: { name: string; extensions: string[] }[];
  }) => Promise<string | null>;
}

export function useFilePicker(): UseFilePickerReturn {
  const { t } = useTranslation();

  const pickFile = useCallback(
    async (params: {
      title: string;
      filters?: { name: string; extensions: string[] }[];
    }) => {
      if (!isTauri()) {
        toast.info(t("connection.toast.fileBrowserDesktopOnly"));
        return null;
      }
      try {
        const selected = await open({
          title: params.title,
          multiple: false,
          filters: params.filters,
        });
        if (selected && typeof selected === "string") {
          return selected;
        }
        return null;
      } catch (e) {
        toast.error(t("connection.toast.openFileDialogFailed"), {
          description: e instanceof Error ? e.message : String(e),
        });
        return null;
      }
    },
    [t],
  );

  return { pickFile };
}

interface ConnectionDialogState {
  isDialogOpen: boolean;
  dialogMode: "create" | "edit";
  editingConnectionId: string | null;
}

export function useConnectionDialog() {
  const [state, setState] = useState<ConnectionDialogState>({
    isDialogOpen: false,
    dialogMode: "create",
    editingConnectionId: null,
  });

  const openCreateDialog = useCallback(() => {
    setState({
      isDialogOpen: true,
      dialogMode: "create",
      editingConnectionId: null,
    });
  }, []);

  const openEditDialog = useCallback((connectionId: string) => {
    setState({
      isDialogOpen: true,
      dialogMode: "edit",
      editingConnectionId: connectionId,
    });
  }, []);

  const closeDialog = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isDialogOpen: false,
    }));
  }, []);

  return {
    ...state,
    openCreateDialog,
    openEditDialog,
    closeDialog,
  };
}

interface ConnectionFormState {
  form: ConnectionForm;
  setForm: React.Dispatch<React.SetStateAction<ConnectionForm>>;
  resetForm: () => void;
}

const defaultForm: ConnectionForm = {
  driver: "postgres",
  name: "",
  host: "",
  port: 5432,
  database: "",
  schema: "",
  username: "",
  password: "",
  ssl: false,
  sslMode: "require",
  sslCaCert: "",
  sshEnabled: false,
  sshPort: undefined,
  sshUsername: "",
};

export function useConnectionForm(initialDriver?: Driver): ConnectionFormState {
  const [form, setForm] = useState<ConnectionForm>({
    ...defaultForm,
    driver: initialDriver || "postgres",
  });

  const resetForm = useCallback(() => {
    setForm({
      ...defaultForm,
      driver: initialDriver || "postgres",
    });
  }, [initialDriver]);

  return { form, setForm, resetForm };
}

import { useState, useCallback, useMemo } from "react";
import type { ConnectionForm, Driver } from "@/services/api";

interface UseConnectionFormProps {
  initialForm?: ConnectionForm;
  isEditMode?: boolean;
}

interface UseConnectionFormReturn {
  form: ConnectionForm;
  setForm: React.Dispatch<React.SetStateAction<ConnectionForm>>;
  validationMsg: string | null;
  setValidationMsg: React.Dispatch<React.SetStateAction<string | null>>;
  testMsg: { ok: boolean; text: string; latency?: number } | null;
  setTestMsg: React.Dispatch<React.SetStateAction<{ ok: boolean; text: string; latency?: number } | null>>;
  isTesting: boolean;
  setIsTesting: React.Dispatch<React.SetStateAction<boolean>>;
  isConnecting: boolean;
  setIsConnecting: React.Dispatch<React.SetStateAction<boolean>>;
  isSavingEdit: boolean;
  setIsSavingEdit: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Helpers
  isPasswordRequiredOnCreate: boolean;
  normalizedForm: ConnectionForm;
  validationIssues: string[];
  requiredOk: boolean;
  
  // Actions
  resetForm: (driver?: Driver) => void;
  updateFormField: <K extends keyof ConnectionForm>(key: K, value: ConnectionForm[K]) => void;
  handleDriverChange: (driver: Driver) => void;
  handleFileBasedDriverChange: (driver: Driver, filePath: string) => void;
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

export function useConnectionForm({
  initialForm,
  isEditMode = false,
}: UseConnectionFormProps = {}): UseConnectionFormReturn {
  const [form, setForm] = useState<ConnectionForm>(initialForm || defaultForm);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string; latency?: number } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const isPasswordRequiredOnCreate = useMemo(
    () => !isEditMode && form.driver !== "sqlite" && form.driver !== "duckdb",
    [isEditMode, form.driver],
  );

  const normalizedForm = useMemo(() => {
    const copy = { ...form };
    if (copy.driver === "sqlite" || copy.driver === "duckdb") {
      copy.host = "";
      copy.port = 0;
      copy.username = "";
      copy.password = "";
      copy.ssl = false;
      copy.sshEnabled = false;
    } else if (!copy.host) {
      copy.host = "localhost";
    }
    if (!copy.port && copy.driver !== "sqlite" && copy.driver !== "duckdb") {
      if (copy.driver === "postgres") copy.port = 5432;
      else if (copy.driver === "mysql") copy.port = 3306;
      else if (copy.driver === "mariadb") copy.port = 3306;
      else if (copy.driver === "mssql") copy.port = 1433;
      else if (copy.driver === "clickhouse") copy.port = 8123;
    }
    return copy;
  }, [form]);

  const validationIssues = useMemo(() => {
    const issues: string[] = [];
    if (!form.name) issues.push("Name is required");
    
    if (form.driver === "sqlite" || form.driver === "duckdb") {
      if (!form.filePath) issues.push("File path is required");
    } else {
      if (!form.host) issues.push("Host is required");
      if (!form.port) issues.push("Port is required");
      if (!form.username) issues.push("Username is required");
      if (!form.password && isPasswordRequiredOnCreate) {
        issues.push("Password is required");
      }
    }
    
    return issues;
  }, [form, isPasswordRequiredOnCreate]);

  const requiredOk = useMemo(() => validationIssues.length === 0, [validationIssues]);

  const resetForm = useCallback((driver?: Driver) => {
    setForm(driver ? { ...defaultForm, driver } : defaultForm);
    setValidationMsg(null);
    setTestMsg(null);
  }, []);

  const updateFormField = useCallback(<K extends keyof ConnectionForm>(key: K, value: ConnectionForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleDriverChange = useCallback((driver: Driver) => {
    setForm((prev) => {
      const base = { ...prev, driver };
      
      if (driver === "sqlite" || driver === "duckdb") {
        return {
          ...base,
          host: "",
          port: 0,
          database: "",
          username: "",
          password: "",
          ssl: false,
          sslMode: undefined,
          sslCaCert: "",
          sshEnabled: false,
          sshHost: "",
          sshPort: undefined,
          sshUsername: "",
          sshPassword: "",
          sshKeyPath: "",
        };
      }
      
      let defaultPort = 5432;
      if (driver === "mysql" || driver === "mariadb") defaultPort = 3306;
      else if (driver === "mssql") defaultPort = 1433;
      else if (driver === "clickhouse") defaultPort = 8123;
      
      return {
        ...base,
        port: prev.port || defaultPort,
      };
    });
    setValidationMsg(null);
  }, []);

  const handleFileBasedDriverChange = useCallback((driver: Driver, filePath: string) => {
    setForm({
      driver,
      name: filePath.split(/[\\/]/).pop() || driver,
      filePath,
      host: "",
      port: 0,
      database: "",
      username: "",
      password: "",
      ssl: false,
      sslMode: undefined,
      sslCaCert: "",
      sshEnabled: false,
      sshHost: "",
      sshPort: undefined,
      sshUsername: "",
      sshPassword: "",
      sshKeyPath: "",
    });
    setValidationMsg(null);
  }, []);

  return {
    form,
    setForm,
    validationMsg,
    setValidationMsg,
    testMsg,
    setTestMsg,
    isTesting,
    setIsTesting,
    isConnecting,
    setIsConnecting,
    isSavingEdit,
    setIsSavingEdit,
    isPasswordRequiredOnCreate,
    normalizedForm,
    validationIssues,
    requiredOk,
    resetForm,
    updateFormField,
    handleDriverChange,
    handleFileBasedDriverChange,
  };
}

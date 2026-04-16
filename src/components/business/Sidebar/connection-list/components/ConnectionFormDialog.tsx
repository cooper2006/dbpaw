import { useMemo, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Key, FolderOpen, Upload } from "lucide-react";
import { api, isTauri } from "@/services/api";
import type { ConnectionForm, Driver } from "@/services/api";
import {
  DRIVER_REGISTRY,
  getDefaultPort,
  isFileBasedDriver,
  supportsSSLCA,
  isMysqlFamilyDriver,
} from "@/lib/driver-registry";
import { normalizeConnectionFormInput } from "@/lib/connection-form/rules";
import { validateConnectionFormInput } from "@/lib/connection-form/validate";
import { useTranslation } from "react-i18next";

interface ConnectionFormDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  form: ConnectionForm;
  setForm: React.Dispatch<React.SetStateAction<ConnectionForm>>;
  isTesting: boolean;
  isConnecting: boolean;
  isSavingEdit: boolean;
  testMsg: { ok: boolean; text: string; latency?: number } | null;
  validationMsg: string | null;
  dialogMode: "create" | "edit";
  editingConnectionId: string | null;
  onClose: () => void;
  onTest: () => void;
  onSave: (e: FormEvent) => void;
  onFileSelect: (filePath: string) => void;
  t: (key: string) => string;
}

export function ConnectionFormDialog({
  isOpen,
  mode,
  form,
  setForm,
  isTesting,
  isConnecting,
  isSavingEdit,
  testMsg,
  validationMsg,
  dialogMode,
  editingConnectionId,
  onClose,
  onTest,
  onSave,
  onFileSelect,
  t,
}: ConnectionFormDialogProps) {
  const isFileBased = isFileBasedDriver(form.driver);
  const supportsSslCa = supportsSSLCA(form.driver);
  const normalizedForm = useMemo(
    () => normalizeConnectionFormInput(form),
    [form],
  );
  const validationIssues = useMemo(
    () =>
      validateConnectionFormInput(
        normalizedForm,
        dialogMode === "edit" ? "edit" : "create",
      ),
    [normalizedForm, dialogMode],
  );
  const requiredOk = useMemo(() => {
    return validationIssues.length === 0;
  }, [validationIssues]);
  const isPasswordRequiredOnCreate = useMemo(
    () => !isMysqlFamilyDriver(form.driver),
    [form.driver],
  );

  const handleFileSelect = async () => {
    if (!isTauri()) return;
    try {
      const filePath = await api.dialog.open({
        title: t("connection.dialog.selectFile"),
        multiple: false,
        filters: [
          {
            name: "Database Files",
            extensions: ["sqlite", "db", "duckdb"],
          },
        ],
      });
      if (filePath) {
        onFileSelect(filePath as string);
      }
    } catch (e) {
      console.error("Failed to select file", e);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? t("connection.dialog.createTitle")
              : t("connection.dialog.editTitle")}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("connection.dialog.createDescription")
              : t("connection.dialog.editDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSave} className="space-y-4">
          {/* Driver Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="driver">{t("connection.form.driver")}</Label>
              <Select
                value={form.driver}
                onValueChange={(value: Driver) => {
                  setForm((prev) => ({
                    ...prev,
                    driver: value,
                    port: getDefaultPort(value),
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("connection.form.selectDriver")} />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DRIVER_REGISTRY).map(([key, driver]) => (
                    <SelectItem key={key} value={key}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{t("connection.form.name")}</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder={t("connection.form.namePlaceholder")}
              />
            </div>
          </div>

          {/* Host/Path Selection */}
          {!isFileBased ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="host">{t("connection.form.host")}</Label>
                <Input
                  id="host"
                  value={form.host}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, host: e.target.value }))
                  }
                  placeholder={t("connection.form.hostPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">{t("connection.form.port")}</Label>
                <Input
                  id="port"
                  type="number"
                  value={form.port}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      port: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder={String(getDefaultPort(form.driver))}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t("connection.form.filePath")}</Label>
              <div className="flex gap-2">
                <Input
                  value={form.filePath || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, filePath: e.target.value }))
                  }
                  placeholder={t("connection.form.filePathPlaceholder")}
                  readOnly
                />
                <Button type="button" variant="outline" onClick={handleFileSelect}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {t("common.browse")}
                </Button>
              </div>
            </div>
          )}

          {/* Database & Schema */}
          {!isFileBased && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="database">{t("connection.form.database")}</Label>
                <Input
                  id="database"
                  value={form.database}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, database: e.target.value }))
                  }
                  placeholder={t("connection.form.databasePlaceholder")}
                />
              </div>
              {form.driver === "postgres" && (
                <div className="space-y-2">
                  <Label htmlFor="schema">{t("connection.form.schema")}</Label>
                  <Input
                    id="schema"
                    value={form.schema}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, schema: e.target.value }))
                    }
                    placeholder="public"
                  />
                </div>
              )}
            </div>
          )}

          {/* Credentials */}
          {!isFileBased && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t("connection.form.username")}</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, username: e.target.value }))
                  }
                  placeholder={t("connection.form.usernamePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("connection.form.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder={
                    mode === "edit"
                      ? t("connection.form.passwordPlaceholderEdit")
                      : t("connection.form.passwordPlaceholder")
                  }
                  required={mode === "create" && isPasswordRequiredOnCreate}
                />
              </div>
            </div>
          )}

          {/* SSL Options */}
          {!isFileBased && form.driver !== "sqlite" && form.driver !== "duckdb" && (
            <div className="space-y-4 border rounded-md p-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ssl"
                  checked={form.ssl}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, ssl: checked as boolean }))
                  }
                />
                <Label htmlFor="ssl">{t("connection.form.useSSL")}</Label>
              </div>

              {form.ssl && supportsSslCa && (
                <>
                  <div className="space-y-2">
                    <Label>{t("connection.form.sslMode")}</Label>
                    <RadioGroup
                      value={form.sslMode}
                      onValueChange={(value: any) =>
                        setForm((prev) => ({ ...prev, sslMode: value }))
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="require" id="require" />
                        <Label htmlFor="require">require</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="verify_ca" id="verify_ca" />
                        <Label htmlFor="verify_ca">verify-ca</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {form.sslMode === "verify_ca" && (
                    <div className="space-y-2">
                      <Label htmlFor="sslCaCert">
                        {t("connection.form.sslCaCert")}
                      </Label>
                      <Textarea
                        id="sslCaCert"
                        value={form.sslCaCert}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            sslCaCert: e.target.value,
                          }))
                        }
                        placeholder={t("connection.form.sslCaCertPlaceholder")}
                        rows={3}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* SSH Options */}
          {!isFileBased && (
            <div className="space-y-4 border rounded-md p-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sshEnabled"
                  checked={form.sshEnabled}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, sshEnabled: checked as boolean }))
                  }
                />
                <Label htmlFor="sshEnabled">{t("connection.form.useSSH")}</Label>
              </div>

              {form.sshEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sshHost">{t("connection.form.sshHost")}</Label>
                    <Input
                      id="sshHost"
                      value={form.sshHost || ""}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, sshHost: e.target.value }))
                      }
                      placeholder="localhost"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sshPort">{t("connection.form.sshPort")}</Label>
                    <Input
                      id="sshPort"
                      type="number"
                      value={form.sshPort || 22}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          sshPort: parseInt(e.target.value) || 22,
                        }))
                      }
                      placeholder="22"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sshUsername">
                      {t("connection.form.sshUsername")}
                    </Label>
                    <Input
                      id="sshUsername"
                      value={form.sshUsername || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          sshUsername: e.target.value,
                        }))
                      }
                      placeholder="root"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sshPassword">
                      {t("connection.form.sshPassword")}
                    </Label>
                    <Input
                      id="sshPassword"
                      type="password"
                      value={form.sshPassword || ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          sshPassword: e.target.value,
                        }))
                      }
                      placeholder={t("connection.form.sshPasswordPlaceholder")}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validation Messages */}
          {validationMsg && (
            <Alert variant="destructive">
              <AlertTitle>{t("common.error")}</AlertTitle>
              <AlertDescription>{validationMsg}</AlertDescription>
            </Alert>
          )}

          {testMsg && (
            <Alert variant={testMsg.ok ? "default" : "destructive"}>
              <AlertTitle>
                {testMsg.ok ? t("connection.test.success") : t("connection.test.failed")}
              </AlertTitle>
              <AlertDescription>
                {testMsg.text}
                {testMsg.latency !== undefined && (
                  <span className="ml-2 text-sm">
                    ({testMsg.latency}ms)
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            {!isFileBased && mode === "create" && (
              <Button
                type="button"
                variant="outline"
                onClick={onTest}
                disabled={isTesting || !requiredOk}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("connection.testing")}
                  </>
                ) : (
                  <>{t("connection.testConnection")}</>
                )}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                !requiredOk ||
                isConnecting ||
                isSavingEdit ||
                (mode === "create" && isTesting)
              }
            >
              {(isConnecting || isSavingEdit) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mode === "create"
                ? t("connection.connect")
                : t("common.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

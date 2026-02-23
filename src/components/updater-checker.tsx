import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getSetting } from "../services/store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { toast } from "sonner";

export function UpdaterChecker() {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [updateInfo, setUpdateInfo] = useState<{ version: string; body?: string } | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const autoUpdate = await getSetting<boolean>("autoUpdate", true);
        if (autoUpdate) {
          const update = await check();
          if (update?.available) {
            setUpdateInfo({
              version: update.version,
              body: update.body,
            });
            setUpdateAvailable(true);
          }
        }
      } catch (error) {
        console.error("Failed to check for updates:", error);
      }
    }
    init();
  }, []);

  const handleUpdate = async () => {
    try {
      setDownloading(true);
      const update = await check();
      if (update?.available) {
        toast.info("Downloading update...");
        await update.downloadAndInstall();
        toast.success("Update installed, restarting...");
        await relaunch();
      }
    } catch (error) {
      console.error("Failed to install update:", error);
      toast.error("Failed to install update");
      setDownloading(false);
      setUpdateAvailable(false);
    }
  };

  return (
    <AlertDialog open={updateAvailable} onOpenChange={setUpdateAvailable}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>New Version Available</AlertDialogTitle>
          <AlertDialogDescription>
            A new version ({updateInfo?.version}) is available.
            {updateInfo?.body && (
              <div className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted p-2 text-xs">
                {updateInfo.body}
              </div>
            )}
            <br />
            Do you want to update now? The app will restart after installation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={downloading}>Later</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault(); 
              handleUpdate();
            }} 
            disabled={downloading}
          >
            {downloading ? "Updating..." : "Update Now"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

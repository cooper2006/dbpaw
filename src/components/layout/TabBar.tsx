import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { X, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Tab {
  id: string;
  title: string;
  type: string;
  isDirty?: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onActivate: (tabId: string) => void;
  onClose: (tabId: string) => void;
  onCloseAll?: () => void;
  onCloseOthers?: (tabId: string) => void;
  onCloseRight?: (tabId: string) => void;
  onCloseLeft?: (tabId: string) => void;
}

export function TabBar({
  tabs,
  activeTabId,
  onActivate,
  onClose,
  onCloseAll,
  onCloseOthers,
  onCloseRight,
  onCloseLeft,
}: TabBarProps) {
  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center border-b bg-muted/30">
      <Tabs value={activeTabId || ''} onValueChange={onActivate} className="flex-1">
        <TabsList className="h-9 bg-transparent p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="
                data-[state=active]:bg-background
                data-[state=active]:shadow-sm
                h-8 px-3 py-1.5 text-xs font-medium
                rounded-t-md rounded-b-none
                border-b-2 border-transparent
                data-[state=active]:border-primary
                group relative
              "
            >
              <span className="truncate max-w-[150px]">
                {tab.title}
                {tab.isDirty && <span className="ml-1 text-muted-foreground">●</span>}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(tab.id);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tabs.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onCloseAll}>
              Close All
            </DropdownMenuItem>
            {activeTabId && (
              <>
                <DropdownMenuItem onClick={() => onCloseOthers(activeTabId)}>
                  Close Others
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCloseRight(activeTabId)}>
                  Close Tabs to Right
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCloseLeft(activeTabId)}>
                  Close Tabs to Left
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

import React from 'react';
import { useTabManagement } from '@/hooks/useTabManagement';
import { useWindowControl } from '@/hooks/useWindowControl';
import { SplitPane } from './SplitPane';
import { WindowTitle } from './WindowTitle';
import { TabBar } from './TabBar';
import { EditorPanel } from './EditorPanel';
import { Sidebar } from '@/components/business/Sidebar';

interface MainWindowProps {
  showSidebar?: boolean;
  showWindowTitle?: boolean;
  defaultSidebarWidth?: number;
  defaultEditorSplit?: number;
}

export const MainWindow: React.FC<MainWindowProps> = React.memo(({
  showSidebar = true,
  showWindowTitle = true,
  defaultSidebarWidth = 20,
  defaultEditorSplit = 50
}) => {
  const { tabs, activeTabId } = useTabManagement();
  const { isMaximized, isFullScreen } = useWindowControl();

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${isFullScreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* 窗口标题栏 */}
      {showWindowTitle && <WindowTitle showConnectionInfo />}
      
      {/* Tab 栏 */}
      <TabBar />
      
      {/* 主内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {showSidebar && (
          <SplitPane
            orientation="horizontal"
            initialSize={defaultSidebarWidth}
            minSize={150}
            maxSize={400}
          >
            <Sidebar />
            
            {/* 右侧编辑器区域 */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {tabs.length > 1 ? (
                <SplitPane
                  orientation="vertical"
                  initialSize={defaultEditorSplit}
                  minSize={200}
                >
                  <EditorPanel tabId={activeTabId} />
                  <EditorPanel tabId={tabs.find(t => t.id !== activeTabId)?.id} />
                </SplitPane>
              ) : (
                <EditorPanel tabId={activeTabId} />
              )}
            </div>
          </SplitPane>
        )}
        
        {!showSidebar && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {tabs.length > 1 ? (
              <SplitPane
                orientation="vertical"
                initialSize={defaultEditorSplit}
                minSize={200}
              >
                <EditorPanel tabId={activeTabId} />
                <EditorPanel tabId={tabs.find(t => t.id !== activeTabId)?.id} />
              </SplitPane>
            ) : (
              <EditorPanel tabId={activeTabId} />
            )}
          </div>
        )}
      </div>
    </div>
  );
});

MainWindow.displayName = 'MainWindow';

export default MainWindow;

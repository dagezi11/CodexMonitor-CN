import type { ReactNode } from "react";
import FolderKanban from "lucide-react/dist/esm/icons/folder-kanban";
import GitBranch from "lucide-react/dist/esm/icons/git-branch";
import MessagesSquare from "lucide-react/dist/esm/icons/messages-square";
import TerminalSquare from "lucide-react/dist/esm/icons/terminal-square";
import { useAppTranslation } from "../../i18n/i18n";

type TabKey = "projects" | "codex" | "git" | "log";

type TabBarProps = {
  activeTab: TabKey;
  onSelect: (tab: TabKey) => void;
};

export function TabBar({ activeTab, onSelect }: TabBarProps) {
  const { t } = useAppTranslation("shell");
  const tabs: { id: TabKey; label: string; icon: ReactNode }[] = [
    { id: "projects", label: t("tabs.projects"), icon: <FolderKanban className="tabbar-icon" /> },
    { id: "codex", label: t("tabs.codex"), icon: <MessagesSquare className="tabbar-icon" /> },
    { id: "git", label: t("tabs.git"), icon: <GitBranch className="tabbar-icon" /> },
    { id: "log", label: t("tabs.log"), icon: <TerminalSquare className="tabbar-icon" /> },
  ];

  return (
    <nav className="tabbar" aria-label={t("nav.primary")}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tabbar-item ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => onSelect(tab.id)}
          aria-current={activeTab === tab.id ? "page" : undefined}
        >
          {tab.icon}
          <span className="tabbar-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

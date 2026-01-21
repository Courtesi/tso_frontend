/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from 'react';

interface SidebarContextType {
	isCollapsed: boolean;
	expandSidebar: () => void;
	collapseSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
	const context = useContext(SidebarContext);
	if (context === undefined) {
		throw new Error('useSidebar must be used within a SidebarProvider');
	}
	return context;
}

interface SidebarProviderProps {
	children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
	const [isCollapsed, setIsCollapsed] = useState(true);

	const expandSidebar = () => setIsCollapsed(false);
	const collapseSidebar = () => setIsCollapsed(true);

	return (
		<SidebarContext.Provider value={{ isCollapsed, expandSidebar, collapseSidebar }}>
			{children}
		</SidebarContext.Provider>
	);
}
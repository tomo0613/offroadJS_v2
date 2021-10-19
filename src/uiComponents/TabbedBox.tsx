import { useState } from 'react';

import { noop } from '../utils';

interface TabbedBoxProps {
    defaultTabIndex?: number;
    children: ReturnType<typeof TabPanel>[];
    id?: string;
    onSelect?: VoidFnc;
}

interface TabProps {
    index: number;
    label: string;
    onClick: VoidFnc;
    classNames?: string;
}

interface TabPanelProps {
    tabLabel: string;
}

export const TabPanel: React.FC<TabPanelProps> = function ({ children }) {
    return (
        <div className="tabbedBox__tabPanel">
            {children}
        </div>
    );
};

function Tab({ index, label, classNames, onClick }: TabProps) {
    return (
        <span className={`tabbedBox__tab ${classNames}`} data-index={index} onClick={onClick}>
            {label}
        </span>
    );
}

export function TabbedBox({ children: tabPanels, defaultTabIndex = 0, onSelect = noop, ...props }: TabbedBoxProps) {
    const [selectedTabIndex, setSelectedTabIndex] = useState(defaultTabIndex);

    return (
        <div className="tabbedBox" {...props}>
            <div className="tabbedBox__tabBar">
                {tabPanels.map((tabPanel, index) => {
                    const { tabLabel } = tabPanel.props as TabPanelProps;
                    const cls = selectedTabIndex === index ? 'selected' : '';

                    return (
                        <Tab index={index} label={tabLabel} key={tabLabel} onClick={onTabClick} classNames={cls}/>
                    );
                })}
            </div>
            {tabPanels[selectedTabIndex]}
        </div>
    );

    function onTabClick({ currentTarget }: React.MouseEvent<HTMLInputElement>) {
        const targetElement = currentTarget as HTMLSpanElement;
        const index = Number(targetElement.dataset.index);
        setSelectedTabIndex(index);
        onSelect(index);
    }
}

import { useCallback, useEffect, useRef } from 'react';

import { noop } from '../utils';

interface ListProps {
    contentList: string[];
    label?: string;
    selected?: string;
    onClick?: (content: string) => void;
    onDoubleClick?: (content: string) => void;
}

const scrollIntoViewOptions = {
    behavior: 'smooth' as const,
    block: 'nearest' as const,
};

export function List({ label, contentList, selected, onClick = noop, onDoubleClick = onClick }: ListProps) {
    const selectionRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        selectionRef?.current?.scrollIntoView(scrollIntoViewOptions);
    }, [selectionRef, selected]);

    const onListItemClick = useCallback((target: HTMLElement, handler) => {
        if (target.tagName === 'LI') {
            handler((target as HTMLLIElement).dataset.content);
        }
    }, [contentList]);

    const handleClick = useCallback(({ target }: React.MouseEvent<HTMLUListElement>) => {
        onListItemClick(target as HTMLElement, onClick);
    }, [onListItemClick, onClick]);

    const handleDoubleClick = useCallback(({ target }: React.MouseEvent<HTMLUListElement>) => {
        onListItemClick(target as HTMLElement, onDoubleClick);
    }, [onListItemClick, onDoubleClick]);

    return (
        <div className="listContainer">
            {label && (
                <span>{label}</span>
            )}
            <ul
                className="list"
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                tabIndex={0}
            >
                {contentList.map((content) => (
                    <ListItem
                        key={content}
                        content={content}
                        selected={content === selected}
                        selectionRef={selectionRef}
                    />
                ))}
            </ul>
        </div>
    );
}

interface ListItemProps {
    content: string;
    selected?: boolean;
    selectionRef?: React.MutableRefObject<HTMLLIElement>;
}

function ListItem({ content, selected = false, selectionRef }: ListItemProps) {
    const classNames = selected ? 'selected' : '';
    const refAttribute = selected ? { ref: selectionRef } : {};

    return (
        <li
            className={classNames}
            data-content={content}
            {...refAttribute}
        >
            {content}
        </li>
    );
}

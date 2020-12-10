import React, { useEffect, useRef } from 'react';

import { NOP } from '../utils';

interface ListPorps {
    contentList: string[];
    label?: string;
    selected?: string;
    onSelect?: (content: string) => void;
}

const scrollIntoViewOptions = {
    behavior: 'smooth' as const,
    block: 'nearest' as const,
};

export function List({ label, contentList, selected, onSelect = NOP }: ListPorps) {
    const selectionRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        selectionRef?.current?.scrollIntoView(scrollIntoViewOptions);
    }, [selectionRef, selected]);

    return (
        <div className="listContainer">
            {label && (
                <span>{label}</span>
            )}
            <ul
                className="list"
                onClick={({ target }: React.MouseEvent<HTMLUListElement>) => {
                    if ((target as HTMLElement).tagName === 'LI') {
                        onSelect((target as HTMLLIElement).dataset.content);
                    }
                }}
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

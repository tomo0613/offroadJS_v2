import { EventListener } from '../../common/EventListener';

export enum ListEvent {
    select = 'select',
    setItems = 'setItems',
}

export class List {
    containerElement = document.createElement('nav');
    labelElement = document.createElement('span');
    listElement = document.createElement('ul');
    selectedItem: HTMLLIElement;
    private searchString: string;
    listeners = new EventListener<ListEvent>();

    constructor(label: string, contentList: string[]) {
        this.labelElement.innerText = label;

        this.containerElement.classList.add('listContainer');
        this.listElement.classList.add('list');

        this.containerElement.appendChild(this.labelElement);
        this.containerElement.appendChild(this.listElement);

        this.listElement.addEventListener('click', this.onClick);
        this.setItems(contentList);
    }

    appendTo(element: HTMLElement) {
        element.appendChild(this.containerElement);

        return this;
    }

    remove() {
        this.removeItems();
        this.listElement.removeEventListener('click', this.onClick);
        this.containerElement.remove();
    }

    onClick = (e: MouseEvent) => {
        const item = e.target as HTMLElement;

        if (item.tagName === 'LI') {
            this.setSelectedItem(item as HTMLLIElement);
            this.listeners.dispatch(ListEvent.select, item.dataset.content);
        }
    }

    setItems(contentList: string[]) {
        const itemsToAdd: HTMLLIElement[] = [];
        const itemsToRemove = Array.from(this.listElement.children);

        contentList.forEach((content) => {
            this.searchString = content;
            const itemToKeepIndex = itemsToRemove.findIndex(this.itemByContent);

            if (itemToKeepIndex > -1) {
                itemsToRemove.splice(itemToKeepIndex, 1);
            } else {
                itemsToAdd.push(this.createItem(content));
            }
        });

        itemsToRemove.forEach(this.removeItem);
        itemsToAdd.forEach(this.addItem);

        this.listeners.dispatch(ListEvent.setItems);
    }

    selectItemByContent = (content: string) => {
        this.searchString = content;
        const itemToSelect = Array.from(this.listElement.children).find(this.itemByContent);

        if (itemToSelect) {
            this.setSelectedItem(itemToSelect as HTMLLIElement);
        }
    }

    private itemByContent = (item: HTMLLIElement) => item.dataset.content === this.searchString;

    private setSelectedItem = (item: HTMLLIElement) => {
        if (this.selectedItem) {
            this.selectedItem.classList.remove('selected');
        }
        this.selectedItem = item;
        this.selectedItem.classList.add('selected');
    }

    private createItem = (content: string) => {
        const listItem = document.createElement('li');
        listItem.textContent = content;
        listItem.dataset.content = content;

        return listItem;
    }

    private addItem = (item: HTMLLIElement) => {
        this.listElement.appendChild(item);
    }

    private removeItem = (item: HTMLLIElement) => {
        this.listElement.removeChild(item);
    }

    removeItems() {
        while (this.listElement.firstChild) {
            this.listElement.removeChild(this.listElement.lastChild);
        }
    }
}

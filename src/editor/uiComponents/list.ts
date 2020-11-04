export class List {
    containerElement = document.createElement('nav');
    labelElement = document.createElement('span');
    listElement = document.createElement('ul');
    private selectListener: (e: MouseEvent) => void;

    constructor(label: string, onSelect: (e: MouseEvent) => void) {
        this.labelElement.innerText = label;

        this.containerElement.classList.add('listContainer');
        this.listElement.classList.add('list');

        this.containerElement.appendChild(this.labelElement);
        this.containerElement.appendChild(this.listElement);

        this.selectListener = onSelect;
    }

    appendTo(element: HTMLElement) {
        element.appendChild(this.containerElement);

        return this;
    }

    remove() {
        this.removeItems();
        this.containerElement.remove();
    }

    setItems(items: string[]) {
        this.removeItems();
        items.forEach(this.appendItem);
    }

    appendItem = (item: string) => {
        const listItem = document.createElement('li');
        listItem.textContent = item;
        listItem.dataset.id = item;
        listItem.addEventListener('click', this.selectListener);

        this.listElement.appendChild(listItem);
    }

    removeItems() {
        while (this.listElement.firstChild) {
            this.listElement.removeChild(this.listElement.lastChild);
        }
    }
}

export class Label {
    labelElement = document.createElement('div');

    constructor(textContent: string) {
        this.labelElement.classList.add('label');
        this.labelElement.textContent = textContent;
    }

    appendTo(element: HTMLElement) {
        element.appendChild(this.labelElement);

        return this;
    }

    remove() {
        this.labelElement.remove();
    }
}

interface ObjectPoolHandlerMethods<O> {
    itemProvider: (index: number) => O;
    itemActivator: (item: O) => void;
    itemDeactivator: (item: O) => void;
    itemActiveCheck: (item: O) => boolean;
}

export default class ObjectPool<O extends Record<string, any>> {
    items: O[];
    activeCount = 0;
    private itemProvider: ObjectPoolHandlerMethods<O>['itemProvider'];
    private itemActivator: ObjectPoolHandlerMethods<O>['itemActivator'];
    private itemDeactivator: ObjectPoolHandlerMethods<O>['itemDeactivator'];
    private itemActiveCheck: ObjectPoolHandlerMethods<O>['itemActiveCheck'];

    constructor(itemCount: number, handlerMethods: ObjectPoolHandlerMethods<O>) {
        this.itemProvider = handlerMethods.itemProvider;
        this.itemActivator = handlerMethods.itemActivator;
        this.itemDeactivator = handlerMethods.itemDeactivator;
        this.itemActiveCheck = handlerMethods.itemActiveCheck;

        this.items = Array.from({ length: itemCount }).map(this.itemProvider);
    }

    /**
     * get the first inactive item | or create a new if all active
     */
    obtain = () => {
        if (this.activeCount >= this.items.length) {
            this.items.push(this.itemProvider(this.items.length));
        }
        const item = this.items[this.activeCount++];
        this.itemActivator(item);

        return item;
    }

    /**
     * replace the current item with the last active, if it is not last
     */
    release = (item: O) => {
        if (!this.itemActiveCheck(item)) {
            throw new Error(`ObjectPool->release($item) Not active $item: ${JSON.stringify(item)}`);
        }
        this.activeCount--;
        this.itemDeactivator(item);

        if (!this.activeCount) {
            return;
        }

        const index = this.items.indexOf(item);
        const lastActive = this.items[this.activeCount];

        if (index < 0) {
            throw new Error(`ObjectPool->release($item) Not valid $item: ${JSON.stringify(item)}`);
        }
        if (item === lastActive) {
            return;
        }

        this.items[this.activeCount] = this.items[index];
        this.items[index] = lastActive;
    }

    releaseAll = () => {
        this.forActive(this.release);
    }

    forActive = (callback: (item: O) => void) => {
        for (let i = this.activeCount - 1; i >= 0; i--) {
            callback.call(this, this.items[i]);
        }
        /** test performance
         *
         *  let i = this.activeCount;
         *  while (i--) {
         *      callback.call(this, this.items[i]);
         *  }
         *
         */
    }
}

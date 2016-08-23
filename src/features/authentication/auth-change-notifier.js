import * as LogManager from 'aurelia-logging';

export class AuthChangeNotifier {
    constructor (bindingSignaler, eventAggregator) {
        this._bindingSignaler = bindingSignaler;
        this._eventAggregator = eventAggregator;
        this._authenticated = undefined;
    }

    notify (authenticated) {
        if (this._authenticated !== undefined && this._authenticated !== authenticated) {
            this._bindingSignaler.signal('authentication-change');
            this._eventAggregator.publish('authentication-change', this.authenticated);

            LogManager.getLogger('authentication').info(`Authorization changed to: ${this.authenticated}`);
        }

        this._authenticated = authenticated;
    }
}
/**
 * The InputAccessoryView is an invisible, sizeless view that is glued on top
 * of the keyboard. Its only purpose is so we can observe position changes and call
 * a function in the delegate. There is no other way to detect that the keyboard is moving
 * while the user is dragging it.
 *
 * This was heavily inspired on the Signal app approach (see
 * https://github.com/signalapp/Signal-iOS/blob/master/Signal/src/views/InputAccessoryViewPlaceholder.swift)
 */

type KeyboardPositionDelegate = { keyboardPositionChanged: (position: Number) => void };

@NativeClass()
export class InputAccessoryView extends UIView {
    private delegate: KeyboardPositionDelegate;

    deinit() {
        if (this.superview) {
            this.superview.removeObserverForKeyPath(this, 'center');
        }
    }

    willMoveToSuperview(newSuperview?: UIView) {
        // This event triggers when the InputAccessoryView is being attached or detached.
        // This is where we add/remove the observers.

        // we observe the 'center' of the superview.
        super.willMoveToSuperview(newSuperview);

        if (this.superview) {
            console.log("Removing observer willMoveToSuperview");
            this.superview.removeObserverForKeyPath(this, 'center');
        }

        if (newSuperview) {
            newSuperview.addObserverForKeyPathOptionsContext(
                this,
                'center',
                NSKeyValueObservingOptions.New,
                null
            );
            newSuperview.addObserverForKeyPathOptionsContext(
                this,
                'center',
                NSKeyValueObservingOptions.Initial,
                null
            );
        }
    }

    observeValueForKeyPathOfObjectChangeContext(
        path: string,
        obj: Object,
        change: NSDictionary<any, any>,
        context: any
    ): void {
        const visibleKeyboardHeight = this.getVisibleKeyboardHeight();
        this.delegate.keyboardPositionChanged(visibleKeyboardHeight);
    }

    getVisibleKeyboardHeight(): Number {
        // Returns the visible height of the keyboard.
        if (!this.superview) {
            return 0;
        }

        let keyboardFrame = this.superview.frame;

        let appFrame = this.superview.window.frame;
        // Measure how much of the keyboard is currently offscreen.
        let offScreenHeight =
            keyboardFrame.origin.y +
            keyboardFrame.size.height -
            (appFrame.origin.y + appFrame.size.height);

        // The onscreen region represents the overlap.
        return Math.max(0, keyboardFrame.size.height - offScreenHeight);
    }
}


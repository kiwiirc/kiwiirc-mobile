import { TextField } from '@nativescript/core';
const UndismissableUITextFieldDelegate = NSObject.extend({
    textFieldShouldEndEditing(textField) {
        return true;
    },
    textFieldShouldBeginEditing(textField) {
        return this._originalDelegate.textFieldShouldBeginEditing(textField);
    },
    textFieldDidBeginEditing(textField) {
        this._originalDelegate.textFieldDidBeginEditing(textField);
    },
    textFieldDidEndEditing(textField) {
        this._originalDelegate.textFieldDidEndEditing(textField);
    },
    textFieldShouldClear(textField) {
        return this._originalDelegate.textFieldShouldClear(textField);
    },
    textFieldShouldReturn(textField) {
        var _a, _b;
        const owner = (_b = (_a = this._originalDelegate) === null || _a === void 0 ? void 0 : _a._owner) === null || _b === void 0 ? void 0 : _b.get();
        if (owner) {
            owner.notify({ eventName: TextField.returnPressEvent, object: owner });
        }
        return true;
    },
    textFieldShouldChangeCharactersInRangeReplacementString: function (textField, range, replacementString) {
        return this._originalDelegate.textFieldShouldChangeCharactersInRangeReplacementString(textField, range, replacementString);
    },
}, {
    protocols: [UITextFieldDelegate],
});
UndismissableUITextFieldDelegate['initWithOriginalDelegate'] = function (originalDelegate) {
    if (originalDelegate instanceof UndismissableUITextFieldDelegate) {
        return originalDelegate;
    }
    const delegate = UndismissableUITextFieldDelegate.new();
    delegate._originalDelegate = originalDelegate;
    return delegate;
};
export { UndismissableUITextFieldDelegate };
//# sourceMappingURL=UndismissableUITextFieldDelegate.js.map
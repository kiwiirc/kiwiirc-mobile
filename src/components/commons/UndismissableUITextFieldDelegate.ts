import { TextField } from '@nativescript/core';

const UndismissableUITextFieldDelegate = (NSObject as any).extend(
    {
        textFieldShouldEndEditing(textField: UITextField): boolean {
            return true;
        },
        textFieldShouldBeginEditing(textField: UITextField): boolean {
            return this._originalDelegate.textFieldShouldBeginEditing(
                textField
            );
        },

        textFieldDidBeginEditing(textField: UITextField) {
            this._originalDelegate.textFieldDidBeginEditing(textField);
        },

        textFieldDidEndEditing(textField: UITextField) {
            this._originalDelegate.textFieldDidEndEditing(textField);
        },

        textFieldShouldClear(textField: UITextField): boolean {
            return this._originalDelegate.textFieldShouldClear(textField);
        },

        textFieldShouldReturn(textField: UITextField): boolean {
            const owner = this._originalDelegate?._owner?.get();
            if (owner) {
                owner.notify({ eventName: TextField.returnPressEvent, object: owner });
            }
            return true;
        },

        textFieldShouldChangeCharactersInRangeReplacementString: function (
            textField: UITextField,
            range: NSRange,
            replacementString: string
        ): boolean {
            return this._originalDelegate.textFieldShouldChangeCharactersInRangeReplacementString(
                textField,
                range,
                replacementString
            );
        },
    },
    {
        protocols: [UITextFieldDelegate],
    }
);

UndismissableUITextFieldDelegate['initWithOriginalDelegate'] = function (
    originalDelegate: UITextFieldDelegate
): UITextFieldDelegate {
    if (originalDelegate instanceof UndismissableUITextFieldDelegate) {
        return originalDelegate;
    }

    const delegate = UndismissableUITextFieldDelegate.new();
    delegate._originalDelegate = originalDelegate;
    return delegate;
};

export { UndismissableUITextFieldDelegate };

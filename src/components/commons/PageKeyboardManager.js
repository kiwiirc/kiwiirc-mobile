import _ from 'lodash';
import { Application, isIOS, Frame } from '@nativescript/core';

/* global
    UIScrollViewKeyboardDismissMode
    UIKeyboardWillChangeFrameNotification
    UIKeyboardFrameEndUserInfoKey
    UIEdgeInsetsMake
    UIKeyboardWillHideNotification
    UIEdgeInsetsZero
    CGRectMake
    CGPointMake
    */

// set of scrollViews currently loaded
let scrollViews = new Set();

let keyboardDismissing = false;

if (isIOS) {
    setupIosKeyboardListeners();
}

function setupIosKeyboardListeners() {
    Application.ios.addNotificationObserver(
        UIKeyboardWillChangeFrameNotification,
        (notification) => {
            const safeAreaInsetBottom = _.get(
                Frame.topmost(),
                'nativeView.safeAreaInsets.bottom',
                0
            );

            const newKeyboardHeight =
                notification.userInfo.valueForKey(UIKeyboardFrameEndUserInfoKey)
                    .CGRectValue.size.height
                - safeAreaInsetBottom;

            scrollViews.forEach((scrollView) => {
                // if scrollView is not visible (i.e. in another page);
                if (!scrollView.ios.window) {
                    return;
                }

                const inverted = scrollView.scaleY === -1;

                if (!keyboardDismissing) {
                    let contentInsets = UIEdgeInsetsMake(
                        inverted ? newKeyboardHeight : 0.0,
                        0.0,
                        inverted ? 0.0 : newKeyboardHeight,
                        0.0
                    );
                    scrollView.ios.contentInset = contentInsets;
                    scrollView.ios.scrollIndicatorInsets = contentInsets;
                }

                if (inverted && scrollView.ios.contentOffset.y < 20) {
                    scrollView.ios.setContentOffsetAnimated(
                        CGPointMake(0, -newKeyboardHeight),
                        true
                    );
                }
            });
        }
    );

    Application.ios.addNotificationObserver(
        UIKeyboardWillHideNotification,
        (notification) => {
            keyboardDismissing = true;
            setTimeout(() => (keyboardDismissing = false), 200);
            let contentInsets = UIEdgeInsetsZero;
            scrollViews.forEach((scrollView) => {
                scrollView.ios.contentInset = contentInsets;
                scrollView.ios.scrollIndicatorInsets = contentInsets;
            });
        }
    );
}

export function addScrollDismiss(scrollView) {
    if (!isIOS) {
        return;
    }

    scrollViews.add(scrollView);

    scrollView.ios.keyboardDismissMode =
        UIScrollViewKeyboardDismissMode.Interactive;

    scrollView.once('unloaded', () => {
        scrollViews.delete(scrollView);
    });
}

export function scrollToMe(textView) {
    if (!isIOS) {
        return;
    }

    let myScrollView = null;
    let myParent = textView.parent;

    while (myParent) {
        if (myParent.typeName === 'ScrollView') {
            myScrollView = myParent;
            break;
        }
        myParent = myParent.parent;
    }

    if (!myScrollView) {
        return;
    }

    setTimeout(() => {
        const relativePosition = textView.ios.convertPointToView(
            textView.ios.frame.origin,
            myScrollView.ios
        );

        myScrollView.ios.scrollRectToVisibleAnimated(CGRectMake(
            relativePosition.x,
            relativePosition.y,
            textView.ios.frame.size.width,
            textView.ios.frame.size.height
                + 40
        ), true);
    }, 50);
}

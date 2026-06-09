import {useIsFocused} from '@react-navigation/native';
import {useCallback, useEffect, useRef, useState} from 'react';
import type {RefObject} from 'react';
import type {NativeScrollEvent, NativeSyntheticEvent, ViewToken} from 'react-native';
import {readNewestAction} from '@userActions/Report';
import CONST from '@src/CONST';

type Args = {
    /** The report ID */
    reportID: string;

    /** Whether the FlatList is inverted, we need it to determine if the current unread message is visible. */
    isInverted: boolean;

    /** The current offset of scrolling from either top or bottom of chat list */
    currentVerticalScrollingOffsetRef: RefObject<number>;

    /** Ref for whether read action was skipped */
    readActionSkippedRef: RefObject<boolean>;

    /** The index of the unread report action */
    unreadMarkerReportActionIndex: number;

    /** Whether the report has newer actions to load */
    hasNewerActions: boolean;

    /** Callback to call on every scroll event */
    onTrackScrolling: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;

    /** Whether the report actions have been loaded at least once */
    hasOnceLoadedReportActions: boolean;

    /** The index of the action badge target report action in the sorted visible actions list (-1 if none) */
    actionBadgeTargetIndex?: number;
};

export default function useReportUnreadMessageScrollTracking({
    reportID,
    currentVerticalScrollingOffsetRef,
    hasNewerActions,
    readActionSkippedRef,
    onTrackScrolling,
    unreadMarkerReportActionIndex,
    isInverted,
    hasOnceLoadedReportActions,
    actionBadgeTargetIndex = -1,
}: Args) {
    const [isFloatingMessageCounterVisible, setIsFloatingMessageCounterVisible] = useState(false);
    const [isActionBadgeAboveViewport, setIsActionBadgeAboveViewport] = useState(false);
    const isFocused = useIsFocused();
    const ref = useRef<{
        previousViewableItems: ViewToken[];
        reportID: string;
        unreadMarkerReportActionIndex: number;
        isFocused: boolean;
        hasOnceLoadedReportActions: boolean;
        actionBadgeTargetIndex: number;
        hasNewerActions: boolean;
    }>({
        reportID,
        unreadMarkerReportActionIndex,
        previousViewableItems: [],
        isFocused: true,
        hasOnceLoadedReportActions,
        actionBadgeTargetIndex,
        hasNewerActions,
    });
    // We want to save the updated value on ref to use it in onViewableItemsChanged
    // because FlatList requires the callback to be stable and we cannot add a dependency on the useCallback.
    useEffect(() => {
        ref.current.reportID = reportID;
        ref.current.previousViewableItems = [];
    }, [reportID]);

    useEffect(() => {
        ref.current.isFocused = isFocused;
    }, [isFocused]);

    useEffect(() => {
        ref.current.hasOnceLoadedReportActions = hasOnceLoadedReportActions;
    }, [hasOnceLoadedReportActions]);

    useEffect(() => {
        ref.current.hasNewerActions = hasNewerActions;
    }, [hasNewerActions]);

    /**
     * On every scroll event we want to:
     * Show/hide the latest message pill when user is scrolling back/forth in the history of messages.
     * Call any other callback that the component might need
     */
    const trackVerticalScrolling = (event: NativeSyntheticEvent<NativeScrollEvent> | undefined) => {
        if (event) {
            onTrackScrolling(event);
        }
        const hasUnreadMarkerReportAction = unreadMarkerReportActionIndex !== -1;

        // display floating button if we're scrolled more than the offset
        if (
            currentVerticalScrollingOffsetRef.current > CONST.REPORT.ACTIONS.LATEST_MESSAGES_PILL_SCROLL_OFFSET_THRESHOLD &&
            !isFloatingMessageCounterVisible &&
            !hasUnreadMarkerReportAction
        ) {
            setIsFloatingMessageCounterVisible(true);
        }

        // hide floating button if we're scrolled closer than the offset
        if (
            currentVerticalScrollingOffsetRef.current < CONST.REPORT.ACTIONS.LATEST_MESSAGES_PILL_SCROLL_OFFSET_THRESHOLD &&
            isFloatingMessageCounterVisible &&
            !hasUnreadMarkerReportAction &&
            !hasNewerActions
        ) {
            setIsFloatingMessageCounterVisible(false);
        }
    };

    const onViewableItemsChanged = useCallback(({viewableItems}: {viewableItems: ViewToken[]; changed: ViewToken[]}) => {
        if (!ref.current.isFocused) {
            return;
        }

        ref.current.previousViewableItems = viewableItems;
        const viewableIndexes = viewableItems.map((viewableItem) => viewableItem.index).filter((value) => typeof value === 'number');

        if (viewableIndexes.length === 0) {
            return;
        }

        const maxIndex = Math.max(...viewableIndexes);
        const minIndex = Math.min(...viewableIndexes);
        const unreadActionIndex = ref.current.unreadMarkerReportActionIndex;
        const hasUnreadMarkerReportAction = unreadActionIndex !== -1;
        const unreadActionVisible = isInverted ? unreadActionIndex >= minIndex : unreadActionIndex <= maxIndex;

        // In the inverted list (primary chat view) the newest action sits at index 0.
        // Seeing the unread marker is not sufficient to hide the pill — newer messages can still be below the fold.
        // Only hide when the user has scrolled all the way to the newest action (minIndex === 0) and there are
        // no more pages to load. For non-inverted lists the existing marker-visibility gate is adequate.
        const newestActionVisible = isInverted ? minIndex === 0 : unreadActionVisible;
        const allActionsReached = newestActionVisible && !ref.current.hasNewerActions;

        // display floating button if the unread report action is out of view
        if (!unreadActionVisible && hasUnreadMarkerReportAction) {
            setIsFloatingMessageCounterVisible(true);
        }
        // hide floating button only when all unread messages are in view
        if (allActionsReached && hasUnreadMarkerReportAction) {
            setIsFloatingMessageCounterVisible(false);
        }

        // if we're scrolled closer than the offset and read action has been skipped then mark message as read
        if (unreadActionVisible && readActionSkippedRef.current) {
            // eslint-disable-next-line no-param-reassign
            readActionSkippedRef.current = false;
            readNewestAction(ref.current.reportID, ref.current.hasOnceLoadedReportActions);
        }

        // Track whether the action badge target is above the viewport (i.e., not visible and at a higher index in the inverted list)
        const badgeTargetIndex = ref.current.actionBadgeTargetIndex;
        if (badgeTargetIndex !== -1) {
            // In an inverted list, higher indexes are "above" (older messages). The target is above the viewport
            // when its index is greater than the max visible index.
            const isAbove = isInverted ? badgeTargetIndex > maxIndex : badgeTargetIndex < minIndex;
            setIsActionBadgeAboveViewport(isAbove);
        } else {
            setIsActionBadgeAboveViewport(false);
        }

        // FlatList requires a stable onViewableItemsChanged callback for optimal performance.
        // Therefore, we use a ref to store values instead of adding them as dependencies.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // When unreadMarkerReportActionIndex changes we will manually call onViewableItemsChanged with previousViewableItems to recalculate
    // the state of floating button because onViewableItemsChanged on  FlatList will only be called when viewable items change.
    useEffect(() => {
        ref.current.unreadMarkerReportActionIndex = unreadMarkerReportActionIndex;

        if (ref.current.previousViewableItems.length) {
            onViewableItemsChanged({viewableItems: ref.current.previousViewableItems, changed: []});
        }
    }, [onViewableItemsChanged, unreadMarkerReportActionIndex]);

    // When actionBadgeTargetIndex changes, recalculate visibility
    useEffect(() => {
        ref.current.actionBadgeTargetIndex = actionBadgeTargetIndex;
        onViewableItemsChanged({viewableItems: ref.current.previousViewableItems, changed: []});
    }, [onViewableItemsChanged, actionBadgeTargetIndex]);

    return {
        isFloatingMessageCounterVisible,
        setIsFloatingMessageCounterVisible,
        isActionBadgeAboveViewport,
        trackVerticalScrolling,
        onViewableItemsChanged,
    };
}

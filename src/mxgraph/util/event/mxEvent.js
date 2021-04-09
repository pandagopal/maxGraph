/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 */
import mxMouseEvent from './mxMouseEvent';
import mxClient from '../../mxClient';

// Checks if passive event listeners are supported
// see https://github.com/Modernizr/Modernizr/issues/1894
let supportsPassive = false;

try {
  document.addEventListener(
    'test',
    () => {},
    Object.defineProperty &&
      Object.defineProperty({}, 'passive', {
        get: () => {
          supportsPassive = true;
        },
      })
  );
} catch (e) {
  // ignore
}

/**
 * @class mxEvent
 *
 * Cross-browser DOM event support. For internal event handling,
 * {@link mxEventSource} and the graph event dispatch loop in {@link mxGraph} are used.
 *
 * ### Memory Leaks:
 *
 * Use this class for adding and removing listeners to/from DOM nodes. The
 * {@link removeAllListeners} function is provided to remove all listeners that
 * have been added using {@link addListener}. The function should be invoked when
 * the last reference is removed in the JavaScript code, typically when the
 * referenced DOM node is removed from the DOM.
 */
class mxEvent {
  /**
   * Binds the function to the specified event on the given element. Use
   * {@link mxUtils.bind} in order to bind the "this" keyword inside the function
   * to a given execution scope.
   */
  // static addListener(element: Node | Window, eventName: string, funct: Function): void;
  static addListener(element, eventName, funct) {
    element.addEventListener(
      eventName,
      funct,
      supportsPassive ? { passive: false } : false
    );
    if (element.mxListenerList == null) {
      element.mxListenerList = [];
    }
    const entry = { name: eventName, f: funct };
    element.mxListenerList.push(entry);
  }

  /**
   * Removes the specified listener from the given element.
   */
  // static removeListener(element: Node | Window, eventName: string, funct: Function): void;
  static removeListener(element, eventName, funct) {
    element.removeEventListener(eventName, funct, false);

    if (element.mxListenerList != null) {
      const listenerCount = element.mxListenerList.length;

      for (let i = 0; i < listenerCount; i += 1) {
        const entry = element.mxListenerList[i];

        if (entry.f === funct) {
          element.mxListenerList.splice(i, 1);
          break;
        }
      }
      if (element.mxListenerList.length === 0) {
        element.mxListenerList = null;
      }
    }
  }

  /**
   * Removes all listeners from the given element.
   */
  // static removeAllListeners(element: Node | Window): void;
  static removeAllListeners(element) {
    const list = element.mxListenerList;

    if (list != null) {
      while (list.length > 0) {
        const entry = list[0];
        mxEvent.removeListener(element, entry.name, entry.f);
      }
    }
  }

  /**
   * Function: addGestureListeners
   *
   * Adds the given listeners for touch, mouse and/or pointer events. If
   * <mxClient.IS_POINTER> is true then pointer events will be registered,
   * else the respective mouse events will be registered. If <mxClient.IS_POINTER>
   * is false and <mxClient.IS_TOUCH> is true then the respective touch events
   * will be registered as well as the mouse events.
   */
  static addGestureListeners(node, startListener, moveListener, endListener) {
    if (startListener != null) {
      mxEvent.addListener(
        node,
        mxClient.IS_POINTER ? 'pointerdown' : 'mousedown',
        startListener
      );
    }

    if (moveListener != null) {
      mxEvent.addListener(
        node,
        mxClient.IS_POINTER ? 'pointermove' : 'mousemove',
        moveListener
      );
    }

    if (endListener != null) {
      mxEvent.addListener(
        node,
        mxClient.IS_POINTER ? 'pointerup' : 'mouseup',
        endListener
      );
    }

    if (!mxClient.IS_POINTER && mxClient.IS_TOUCH) {
      if (startListener != null) {
        mxEvent.addListener(node, 'touchstart', startListener);
      }

      if (moveListener != null) {
        mxEvent.addListener(node, 'touchmove', moveListener);
      }

      if (endListener != null) {
        mxEvent.addListener(node, 'touchend', endListener);
      }
    }
  }

  /**
   * Function: removeGestureListeners
   *
   * Removes the given listeners from mousedown, mousemove, mouseup and the
   * respective touch events if <mxClient.IS_TOUCH> is true.
   */
  static removeGestureListeners(
    node,
    startListener,
    moveListener,
    endListener
  ) {
    if (startListener != null) {
      mxEvent.removeListener(
        node,
        mxClient.IS_POINTER ? 'pointerdown' : 'mousedown',
        startListener
      );
    }

    if (moveListener != null) {
      mxEvent.removeListener(
        node,
        mxClient.IS_POINTER ? 'pointermove' : 'mousemove',
        moveListener
      );
    }

    if (endListener != null) {
      mxEvent.removeListener(
        node,
        mxClient.IS_POINTER ? 'pointerup' : 'mouseup',
        endListener
      );
    }

    if (!mxClient.IS_POINTER && mxClient.IS_TOUCH) {
      if (startListener != null) {
        mxEvent.removeListener(node, 'touchstart', startListener);
      }

      if (moveListener != null) {
        mxEvent.removeListener(node, 'touchmove', moveListener);
      }

      if (endListener != null) {
        mxEvent.removeListener(node, 'touchend', endListener);
      }
    }
  }

  /**
   * Function: redirectMouseEvents
   *
   * Redirects the mouse events from the given DOM node to the graph dispatch
   * loop using the event and given state as event arguments. State can
   * either be an instance of <mxCellState> or a function that returns an
   * <mxCellState>. The down, move, up and dblClick arguments are optional
   * functions that take the trigger event as arguments and replace the
   * default behaviour.
   */
  static redirectMouseEvents(node, graph, state, down, move, up, dblClick) {
    const getState = evt => {
      return typeof state === 'function' ? state(evt) : state;
    };

    mxEvent.addGestureListeners(
      node,
      evt => {
        if (down != null) {
          down(evt);
        } else if (!mxEvent.isConsumed(evt)) {
          graph.fireMouseEvent(
            mxEvent.MOUSE_DOWN,
            new mxMouseEvent(evt, getState(evt))
          );
        }
      },
      evt => {
        if (move != null) {
          move(evt);
        } else if (!mxEvent.isConsumed(evt)) {
          graph.fireMouseEvent(
            mxEvent.MOUSE_MOVE,
            new mxMouseEvent(evt, getState(evt))
          );
        }
      },
      evt => {
        if (up != null) {
          up(evt);
        } else if (!mxEvent.isConsumed(evt)) {
          graph.fireMouseEvent(
            mxEvent.MOUSE_UP,
            new mxMouseEvent(evt, getState(evt))
          );
        }
      }
    );

    mxEvent.addListener(node, 'dblclick', evt => {
      if (dblClick != null) {
        dblClick(evt);
      } else if (!mxEvent.isConsumed(evt)) {
        const tmp = getState(evt);
        graph.dblClick(evt, tmp != null ? tmp.cell : null);
      }
    });
  }

  /**
   * Removes the known listeners from the given DOM node and its descendants.
   *
   * @param element DOM node to remove the listeners from.
   */
  // static release(element: Node | Window): void;
  static release(element) {
    try {
      if (element != null) {
        mxEvent.removeAllListeners(element);

        const children = element.childNodes;
        if (children != null) {
          const childCount = children.length;
          for (let i = 0; i < childCount; i += 1) {
            mxEvent.release(children[i]);
          }
        }
      }
    } catch (e) {
      // ignores errors as this is typically called in cleanup code
    }
  }

  /**
   * Installs the given function as a handler for mouse wheel events. The
   * function has two arguments: the mouse event and a boolean that specifies
   * if the wheel was moved up or down.
   *
   * This has been tested with IE 6 and 7, Firefox (all versions), Opera and
   * Safari. It does currently not work on Safari for Mac.
   *
   * ### Example
   *
   * @example
   * ```javascript
   * mxEvent.addMouseWheelListener(function (evt, up)
   * {
   *   mxLog.show();
   *   mxLog.debug('mouseWheel: up='+up);
   * });
   * ```
   *
   * @param funct Handler function that takes the event argument and a boolean up
   * argument for the mousewheel direction.
   * @param target Target for installing the listener in Google Chrome. See
   * https://www.chromestatus.com/features/6662647093133312.
   */
  // static addMouseWheelListener(funct: (event: Event, up: boolean) => void, target?: Node | Window): void;
  static addMouseWheelListener(funct, target) {
    if (funct != null) {
      const wheelHandler = evt => {
        // IE does not give an event object but the
        // global event object is the mousewheel event
        // at this point in time.
        if (evt == null) {
          evt = window.event;
        }

        // To prevent window zoom on trackpad pinch
        if (evt.ctrlKey) {
          evt.preventDefault();
        }

        // Handles the event using the given function
        if (Math.abs(evt.deltaX) > 0.5 || Math.abs(evt.deltaY) > 0.5) {
          funct(evt, evt.deltaY == 0 ? -evt.deltaX > 0 : -evt.deltaY > 0);
        }
      };

      target = target != null ? target : window;

      if (mxClient.IS_SF && !mxClient.IS_TOUCH) {
        let scale = 1;

        mxEvent.addListener(target, 'gesturestart', evt => {
          mxEvent.consume(evt);
          scale = 1;
        });

        mxEvent.addListener(target, 'gesturechange', evt => {
          mxEvent.consume(evt);
          const diff = scale - evt.scale;

          if (Math.abs(diff) > 0.2) {
            funct(evt, diff < 0, true);
            scale = evt.scale;
          }
        });

        mxEvent.addListener(target, 'gestureend', evt => {
          mxEvent.consume(evt);
        });
      } else {
        let evtCache = [];
        let dx0 = 0;
        let dy0 = 0;

        // Adds basic listeners for graph event dispatching
        mxEvent.addGestureListeners(
          target,
          evt => {
            if (!mxEvent.isMouseEvent(evt) && evt.pointerId != null) {
              evtCache.push(evt);
            }
          },
          evt => {
            if (!mxEvent.isMouseEvent(evt) && evtCache.length == 2) {
              // Find this event in the cache and update its record with this event
              for (let i = 0; i < evtCache.length; i += 1) {
                if (evt.pointerId == evtCache[i].pointerId) {
                  evtCache[i] = evt;
                  break;
                }
              }

              // Calculate the distance between the two pointers
              const dx = Math.abs(evtCache[0].clientX - evtCache[1].clientX);
              const dy = Math.abs(evtCache[0].clientY - evtCache[1].clientY);
              const tx = Math.abs(dx - dx0);
              const ty = Math.abs(dy - dy0);

              if (
                tx > mxEvent.PINCH_THRESHOLD ||
                ty > mxEvent.PINCH_THRESHOLD
              ) {
                const cx =
                  evtCache[0].clientX +
                  (evtCache[1].clientX - evtCache[0].clientX) / 2;
                const cy =
                  evtCache[0].clientY +
                  (evtCache[1].clientY - evtCache[0].clientY) / 2;

                funct(evtCache[0], tx > ty ? dx > dx0 : dy > dy0, true, cx, cy);

                // Cache the distance for the next move event
                dx0 = dx;
                dy0 = dy;
              }
            }
          },
          evt => {
            evtCache = [];
            dx0 = 0;
            dy0 = 0;
          }
        );
      }

      mxEvent.addListener(target, 'wheel', wheelHandler);
    }
  }

  /**
   * Disables the context menu for the given element.
   */
  // static disableContextMenu(element: Node): void;
  static disableContextMenu(element) {
    mxEvent.addListener(element, 'contextmenu', evt => {
      if (evt.preventDefault) {
        evt.preventDefault();
      }
      return false;
    });
  }

  /**
   * Function: getSource
   *
   * Returns the event's target or srcElement depending on the browser.
   */
  static getSource(evt) {
    return evt.srcElement != null ? evt.srcElement : evt.target;
  }

  /**
   * Returns true if the event has been consumed using {@link consume}.
   */
  // static isConsumed(evt: mxEventObject | mxMouseEvent | Event): boolean;
  static isConsumed(evt) {
    return evt.isConsumed != null && evt.isConsumed;
  }

  /**
   * Returns true if the event was generated using a touch device (not a pen or mouse).
   */
  // static isTouchEvent(evt: Event): boolean;
  static isTouchEvent(evt) {
    return evt.pointerType != null
      ? evt.pointerType == 'touch' ||
          evt.pointerType === evt.MSPOINTER_TYPE_TOUCH
      : evt.mozInputSource != null
      ? evt.mozInputSource == 5
      : evt.type.indexOf('touch') == 0;
  }

  /**
   * Returns true if the event was generated using a pen (not a touch device or mouse).
   */
  // static isPenEvent(evt: Event): boolean;
  static isPenEvent(evt) {
    return evt.pointerType != null
      ? evt.pointerType == 'pen' || evt.pointerType === evt.MSPOINTER_TYPE_PEN
      : evt.mozInputSource != null
      ? evt.mozInputSource == 2
      : evt.type.indexOf('pen') == 0;
  }

  /**
   * Returns true if the event was generated using a touch device (not a pen or mouse).
   */
  // static isMultiTouchEvent(evt: Event): boolean;
  static isMultiTouchEvent(evt) {
    return (
      evt.type != null &&
      evt.type.indexOf('touch') == 0 &&
      evt.touches != null &&
      evt.touches.length > 1
    );
  }

  /**
   * Returns true if the event was generated using a mouse (not a pen or touch device).
   */
  // static isMouseEvent(evt: Event): boolean;
  static isMouseEvent(evt) {
    return evt.pointerType != null
      ? evt.pointerType == 'mouse' ||
          evt.pointerType === evt.MSPOINTER_TYPE_MOUSE
      : evt.mozInputSource != null
      ? evt.mozInputSource == 1
      : evt.type.indexOf('mouse') == 0;
  }

  /**
   * Returns true if the left mouse button is pressed for the given event.
   * To check if a button is pressed during a mouseMove you should use the
   * {@link mxGraph.isMouseDown} property. Note that this returns true in Firefox
   * for control+left-click on the Mac.
   */
  // static isLeftMouseButton(evt: MouseEvent): boolean;
  static isLeftMouseButton(evt) {
    // Special case for mousemove and mousedown we check the buttons
    // if it exists because which is 0 even if no button is pressed
    if (
      'buttons' in evt &&
      (evt.type == 'mousedown' || evt.type == 'mousemove')
    ) {
      return evt.buttons == 1;
    }
    if ('which' in evt) {
      return evt.which === 1;
    }
    return evt.button === 1;
  }

  /**
   * Returns true if the middle mouse button is pressed for the given event.
   * To check if a button is pressed during a mouseMove you should use the
   * {@link mxGraph.isMouseDown} property.
   */
  // static isMiddleMouseButton(evt: MouseEvent): boolean;
  static isMiddleMouseButton(evt) {
    if ('which' in evt) {
      return evt.which === 2;
    }
    return evt.button === 4;
  }

  /**
   * Returns true if the right mouse button was pressed. Note that this
   * button might not be available on some systems. For handling a popup
   * trigger {@link isPopupTrigger} should be used.
   */
  // static isRightMouseButton(evt: MouseEvent): boolean;
  static isRightMouseButton(evt) {
    if ('which' in evt) {
      return evt.which === 3;
    }
    return evt.button === 2;
  }

  /**
   * Returns true if the event is a popup trigger. This implementation
   * returns true if the right button or the left button and control was
   * pressed on a Mac.
   */
  // static isPopupTrigger(evt: Event): boolean;
  static isPopupTrigger(evt) {
    return (
      mxEvent.isRightMouseButton(evt) ||
      (mxClient.IS_MAC &&
        mxEvent.isControlDown(evt) &&
        !mxEvent.isShiftDown(evt) &&
        !mxEvent.isMetaDown(evt) &&
        !mxEvent.isAltDown(evt))
    );
  }

  /**
   * Returns true if the shift key is pressed for the given event.
   */
  // static isShiftDown(evt: MouseEvent): boolean;
  static isShiftDown(evt) {
    return evt != null ? evt.shiftKey : false;
  }

  /**
   * Returns true if the alt key is pressed for the given event.
   */
  // static isAltDown(evt: MouseEvent): boolean;
  static isAltDown(evt) {
    return evt != null ? evt.altKey : false;
  }

  /**
   * Returns true if the control key is pressed for the given event.
   */
  // static isControlDown(evt: MouseEvent): boolean;
  static isControlDown(evt) {
    return evt != null ? evt.ctrlKey : false;
  }

  /**
   * Returns true if the meta key is pressed for the given event.
   */
  // static isMetaDown(evt: MouseEvent): boolean;
  static isMetaDown(evt) {
    return evt != null ? evt.metaKey : false;
  }

  /**
   * Returns the touch or mouse event that contains the mouse coordinates.
   */
  // static getMainEvent(e: MouseEvent): MouseEvent;
  static getMainEvent(e) {
    if (
      (e.type == 'touchstart' || e.type == 'touchmove') &&
      e.touches != null &&
      e.touches[0] != null
    ) {
      e = e.touches[0];
    } else if (
      e.type == 'touchend' &&
      e.changedTouches != null &&
      e.changedTouches[0] != null
    ) {
      e = e.changedTouches[0];
    }
    return e;
  }

  /**
   * Returns true if the meta key is pressed for the given event.
   */
  // static getClientX(e: TouchEvent | MouseEvent): number;
  static getClientX(e) {
    return mxEvent.getMainEvent(e).clientX;
  }

  /**
   * Returns true if the meta key is pressed for the given event.
   */
  // static getClientY(e: TouchEvent | MouseEvent): number;
  static getClientY(e) {
    return mxEvent.getMainEvent(e).clientY;
  }

  /**
   * Consumes the given event.
   *
   * @param evt Native event to be consumed.
   * @param {boolean} [preventDefault=true] Optional boolean to prevent the default for the event.
   * Default is true.
   * @param {boolean} [stopPropagation=true] Option boolean to stop event propagation. Default is
   * true.
   */
  // static consume(evt: Event, preventDefault?: boolean, stopPropagation?: boolean): void;
  static consume(evt, preventDefault, stopPropagation) {
    preventDefault = preventDefault != null ? preventDefault : true;
    stopPropagation = stopPropagation != null ? stopPropagation : true;

    if (preventDefault) {
      if (evt.preventDefault) {
        if (stopPropagation) {
          evt.stopPropagation();
        }

        evt.preventDefault();
      } else if (stopPropagation) {
        evt.cancelBubble = true;
      }
    }

    // Opera
    evt.isConsumed = true;

    // Other browsers
    if (!evt.preventDefault) {
      evt.returnValue = false;
    }
  }

  //
  // Special handles in mouse events
  //

  /**
   * Index for the label handle in an mxMouseEvent. This should be a negative
   * value that does not interfere with any possible handle indices.
   * @default -1
   */
  // static LABEL_HANDLE: -1;
  static LABEL_HANDLE = -1;

  /**
   * Index for the rotation handle in an mxMouseEvent. This should be a
   * negative value that does not interfere with any possible handle indices.
   * @default -2
   */
  // static ROTATION_HANDLE: -2;
  static ROTATION_HANDLE = -2;

  /**
   * Start index for the custom handles in an mxMouseEvent. This should be a
   * negative value and is the start index which is decremented for each
   * custom handle.
   * @default -100
   */
  // static CUSTOM_HANDLE: -100;
  static CUSTOM_HANDLE = -100;

  /**
   * Start index for the virtual handles in an mxMouseEvent. This should be a
   * negative value and is the start index which is decremented for each
   * virtual handle.
   * This assumes that there are no more
   * than VIRTUAL_HANDLE - CUSTOM_HANDLE custom handles.
   *
   * @default -100000
   */
  // static VIRTUAL_HANDLE: -100000;
  static VIRTUAL_HANDLE = -100000;

  //
  // Event names
  //

  /**
   * Specifies the event name for mouseDown.
   */
  // static MOUSE_DOWN: 'mouseDown';
  static MOUSE_DOWN = 'mouseDown';

  /**
   * Specifies the event name for mouseMove.
   */
  // static MOUSE_MOVE: 'mouseMove';
  static MOUSE_MOVE = 'mouseMove';

  /**
   * Specifies the event name for mouseUp.
   */
  // static MOUSE_UP: 'mouseUp';
  static MOUSE_UP = 'mouseUp';

  /**
   * Specifies the event name for activate.
   */
  // static ACTIVATE: 'activate';
  static ACTIVATE = 'activate';

  /**
   * Specifies the event name for resizeStart.
   */
  // static RESIZE_START: 'resizeStart';
  static RESIZE_START = 'resizeStart';

  /**
   * Specifies the event name for resize.
   */
  // static RESIZE: 'resize';
  static RESIZE = 'resize';

  /**
   * Specifies the event name for resizeEnd.
   */
  // static RESIZE_END: 'resizeEnd';
  static RESIZE_END = 'resizeEnd';

  /**
   * Specifies the event name for moveStart.
   */
  // static MOVE_START: 'moveStart';
  static MOVE_START = 'moveStart';

  /**
   * Specifies the event name for move.
   */
  // static MOVE: 'move';
  static MOVE = 'move';

  /**
   * Specifies the event name for moveEnd.
   */
  // static MOVE_END: 'moveEnd';
  static MOVE_END = 'moveEnd';

  /**
   * Specifies the event name for panStart.
   */
  // static PAN_START: 'panStart';
  static PAN_START = 'panStart';

  /**
   * Specifies the event name for pan.
   */
  // static PAN: 'pan';
  static PAN = 'pan';

  /**
   * Specifies the event name for panEnd.
   */
  // static PAN_END: 'panEnd';
  static PAN_END = 'panEnd';

  /**
   * Specifies the event name for minimize.
   */
  // static MINIMIZE: 'minimize';
  static MINIMIZE = 'minimize';

  /**
   * Specifies the event name for normalize.
   */
  // static NORMALIZE: 'normalize';
  static NORMALIZE = 'normalize';

  /**
   * Specifies the event name for maximize.
   */
  // static MAXIMIZE: 'maximize';
  static MAXIMIZE = 'maximize';

  /**
   * Specifies the event name for hide.
   */
  // static HIDE: 'hide';
  static HIDE = 'hide';

  /**
   * Specifies the event name for show.
   */
  // static SHOW: 'show';
  static SHOW = 'show';

  /**
   * Specifies the event name for close.
   */
  // static CLOSE: 'close';
  static CLOSE = 'close';

  /**
   * Specifies the event name for destroy.
   */
  // static DESTROY: 'destroy';
  static DESTROY = 'destroy';

  /**
   * Specifies the event name for refresh.
   */
  // static REFRESH: 'refresh';
  static REFRESH = 'refresh';

  /**
   * Specifies the event name for size.
   */
  // static SIZE: 'size';
  static SIZE = 'size';

  /**
   * Specifies the event name for select.
   */
  // static SELECT: 'select';
  static SELECT = 'select';

  /**
   * Specifies the event name for fired.
   */
  // static FIRED: 'fired';
  static FIRED = 'fired';

  /**
   * Specifies the event name for fireMouseEvent.
   */
  // static FIRE_MOUSE_EVENT: 'fireMouseEvent';
  static FIRE_MOUSE_EVENT = 'fireMouseEvent';

  /**
   * Specifies the event name for gesture.
   */
  // static GESTURE: 'gesture';
  static GESTURE = 'gesture';

  /**
   * Specifies the event name for tapAndHold.
   */
  // static TAP_AND_HOLD: 'tapAndHold';
  static TAP_AND_HOLD = 'tapAndHold';

  /**
   * Specifies the event name for get.
   */
  // static GET: 'get';
  static GET = 'get';

  /**
   * Specifies the event name for receive.
   */
  // static RECEIVE: 'receive';
  static RECEIVE = 'receive';

  /**
   * Specifies the event name for connect.
   */
  // static CONNECT: 'connect';
  static CONNECT = 'connect';

  /**
   * Specifies the event name for disconnect.
   */
  // static DISCONNECT: 'disconnect';
  static DISCONNECT = 'disconnect';

  /**
   * Specifies the event name for suspend.
   */
  // static SUSPEND: 'suspend';
  static SUSPEND = 'suspend';

  /**
   * Specifies the event name for suspend.
   */
  // static RESUME: 'resume';
  static RESUME = 'resume';

  /**
   * Specifies the event name for mark.
   */
  // static MARK: 'mark';
  static MARK = 'mark';

  /**
   * Specifies the event name for root.
   */
  // static ROOT: 'root';
  static ROOT = 'root';

  /**
   * Specifies the event name for post.
   */
  // static POST: 'post';
  static POST = 'post';

  /**
   * Specifies the event name for open.
   */
  // static OPEN: 'open';
  static OPEN = 'open';

  /**
   * Specifies the event name for open.
   */
  // static SAVE: 'save';
  static SAVE = 'save';

  /**
   * Specifies the event name for beforeAddVertex.
   */
  // static BEFORE_ADD_VERTEX: 'beforeAddVertex';
  static BEFORE_ADD_VERTEX = 'beforeAddVertex';

  /**
   * Specifies the event name for addVertex.
   */
  // static ADD_VERTEX: 'addVertex';
  static ADD_VERTEX = 'addVertex';

  /**
   * Specifies the event name for afterAddVertex.
   */
  // static AFTER_ADD_VERTEX: 'afterAddVertex';
  static AFTER_ADD_VERTEX = 'afterAddVertex';

  /**
   * Specifies the event name for done.
   */
  // static DONE: 'done';
  static DONE = 'done';

  /**
   * Specifies the event name for execute.
   */
  // static EXECUTE: 'execute';
  static EXECUTE = 'execute';

  /**
   * Specifies the event name for executed.
   */
  // static EXECUTED: 'executed';
  static EXECUTED = 'executed';

  /**
   * Specifies the event name for beginUpdate.
   */
  // static BEGIN_UPDATE: 'beginUpdate';
  static BEGIN_UPDATE = 'beginUpdate';

  /**
   * Specifies the event name for startEdit.
   */
  // static START_EDIT: 'startEdit';
  static START_EDIT = 'startEdit';

  /**
   * Specifies the event name for endUpdate.
   */
  // static END_UPDATE: 'endUpdate';
  static END_UPDATE = 'endUpdate';

  /**
   * Specifies the event name for endEdit.
   */
  // static END_EDIT: 'endEdit';
  static END_EDIT = 'endEdit';

  /**
   * Specifies the event name for beforeUndo.
   */
  // static BEFORE_UNDO: 'beforeUndo';
  static BEFORE_UNDO = 'beforeUndo';

  /**
   * Specifies the event name for undo.
   */
  // static UNDO: 'undo';
  static UNDO = 'undo';

  /**
   * Specifies the event name for redo.
   */
  // static REDO: 'redo';
  static REDO = 'redo';

  /**
   * Specifies the event name for change.
   */
  // static CHANGE: 'change';
  static CHANGE = 'change';

  /**
   * Specifies the event name for notify.
   */
  // static NOTIFY: 'notify';
  static NOTIFY = 'notify';

  /**
   * Specifies the event name for layoutCells.
   */
  // static LAYOUT_CELLS: 'layoutCells';
  static LAYOUT_CELLS = 'layoutCells';

  /**
   * Specifies the event name for click.
   */
  // static CLICK: 'click';
  static CLICK = 'click';

  /**
   * Specifies the event name for scale.
   */
  // static SCALE: 'scale';
  static SCALE = 'scale';

  /**
   * Specifies the event name for translate.
   */
  // static TRANSLATE: 'translate';
  static TRANSLATE = 'translate';

  /**
   * Specifies the event name for scaleAndTranslate.
   */
  // static SCALE_AND_TRANSLATE: 'scaleAndTranslate';
  static SCALE_AND_TRANSLATE = 'scaleAndTranslate';

  /**
   * Specifies the event name for up.
   */
  // static UP: 'up';
  static UP = 'up';

  /**
   * Specifies the event name for down.
   */
  // static DOWN: 'down';
  static DOWN = 'down';

  /**
   * Specifies the event name for add.
   */
  // static ADD: 'add';
  static ADD = 'add';

  /**
   * Specifies the event name for remove.
   */
  // static REMOVE: 'remove';
  static REMOVE = 'remove';

  /**
   * Specifies the event name for clear.
   */
  // static CLEAR: 'clear';
  static CLEAR = 'clear';

  /**
   * Specifies the event name for addCells.
   */
  // static ADD_CELLS: 'addCells';
  static ADD_CELLS = 'addCells';

  /**
   * Specifies the event name for cellsAdded.
   */
  // static CELLS_ADDED: 'cellsAdded';
  static CELLS_ADDED = 'cellsAdded';

  /**
   * Specifies the event name for moveCells.
   */
  // static MOVE_CELLS: 'moveCells';
  static MOVE_CELLS = 'moveCells';

  /**
   * Specifies the event name for cellsMoved.
   */
  // static CELLS_MOVED: 'cellsMoved';
  static CELLS_MOVED = 'cellsMoved';

  /**
   * Specifies the event name for resizeCells.
   */
  // static RESIZE_CELLS: 'resizeCells';
  static RESIZE_CELLS = 'resizeCells';

  /**
   * Specifies the event name for cellsResized.
   */
  // static CELLS_RESIZED: 'cellsResized';
  static CELLS_RESIZED = 'cellsResized';

  /**
   * Specifies the event name for toggleCells.
   */
  // static TOGGLE_CELLS: 'toggleCells';
  static TOGGLE_CELLS = 'toggleCells';

  /**
   * Specifies the event name for cellsToggled.
   */
  // static CELLS_TOGGLED: 'cellsToggled';
  static CELLS_TOGGLED = 'cellsToggled';

  /**
   * Specifies the event name for orderCells.
   */
  // static ORDER_CELLS: 'orderCells';
  static ORDER_CELLS = 'orderCells';

  /**
   * Specifies the event name for cellsOrdered.
   */
  // static CELLS_ORDERED: 'cellsOrdered';
  static CELLS_ORDERED = 'cellsOrdered';

  /**
   * Specifies the event name for removeCells.
   */
  // static REMOVE_CELLS: 'removeCells';
  static REMOVE_CELLS = 'removeCells';

  /**
   * Specifies the event name for cellsRemoved.
   */
  // static CELLS_REMOVED: 'cellsRemoved';
  static CELLS_REMOVED = 'cellsRemoved';

  /**
   * Specifies the event name for groupCells.
   */
  // static GROUP_CELLS: 'groupCells';
  static GROUP_CELLS = 'groupCells';

  /**
   * Specifies the event name for ungroupCells.
   */
  // static UNGROUP_CELLS: 'ungroupCells';
  static UNGROUP_CELLS = 'ungroupCells';

  /**
   * Specifies the event name for removeCellsFromParent.
   */
  // static REMOVE_CELLS_FROM_PARENT: 'removeCellsFromParent';
  static REMOVE_CELLS_FROM_PARENT = 'removeCellsFromParent';

  /**
   * Specifies the event name for foldCells.
   */
  // static FOLD_CELLS: 'foldCells';
  static FOLD_CELLS = 'foldCells';

  /**
   * Specifies the event name for cellsFolded.
   */
  // static CELLS_FOLDED: 'cellsFolded';
  static CELLS_FOLDED = 'cellsFolded';

  /**
   * Specifies the event name for alignCells.
   */
  // static ALIGN_CELLS: 'alignCells';
  static ALIGN_CELLS = 'alignCells';

  /**
   * Specifies the event name for labelChanged.
   */
  // static LABEL_CHANGED: 'labelChanged';
  static LABEL_CHANGED = 'labelChanged';

  /**
   * Specifies the event name for connectCell.
   */
  // static CONNECT_CELL: 'connectCell';
  static CONNECT_CELL = 'connectCell';

  /**
   * Specifies the event name for cellConnected.
   */
  // static CELL_CONNECTED: 'cellConnected';
  static CELL_CONNECTED = 'cellConnected';

  /**
   * Specifies the event name for splitEdge.
   */
  // static SPLIT_EDGE: 'splitEdge';
  static SPLIT_EDGE = 'splitEdge';

  /**
   * Specifies the event name for flipEdge.
   */
  // static FLIP_EDGE: 'flipEdge';
  static FLIP_EDGE = 'flipEdge';

  /**
   * Specifies the event name for startEditing.
   */
  // static START_EDITING: 'startEditing';
  static START_EDITING = 'startEditing';

  /**
   * Specifies the event name for editingStarted.
   */
  // static EDITING_STARTED: 'editingStarted';
  static EDITING_STARTED = 'editingStarted';

  /**
   * Specifies the event name for editingStopped.
   */
  // static EDITING_STOPPED: 'editingStopped';
  static EDITING_STOPPED = 'editingStopped';

  /**
   * Specifies the event name for addOverlay.
   */
  // static ADD_OVERLAY: 'addOverlay';
  static ADD_OVERLAY = 'addOverlay';

  /**
   * Specifies the event name for removeOverlay.
   */
  // static REMOVE_OVERLAY: 'removeOverlay';
  static REMOVE_OVERLAY = 'removeOverlay';

  /**
   * Specifies the event name for updateCellSize.
   */
  // static UPDATE_CELL_SIZE: 'updateCellSize';
  static UPDATE_CELL_SIZE = 'updateCellSize';

  /**
   * Specifies the event name for escape.
   */
  // static ESCAPE: 'escape';
  static ESCAPE = 'escape';

  /**
   * Specifies the event name for doubleClick.
   */
  // static DOUBLE_CLICK: 'doubleClick';
  static DOUBLE_CLICK = 'doubleClick';

  /**
   * Specifies the event name for start.
   */
  // static START: 'start';
  static START = 'start';

  /**
   * Specifies the event name for reset.
   */
  // static RESET: 'reset';
  static RESET = 'reset';

  /**
   * Variable: PINCH_THRESHOLD
   *
   * Threshold for pinch gestures to fire a mouse wheel event.
   * Default value is 10.
   */
  static PINCH_THRESHOLD = 10;
}

export default mxEvent;

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * 为指定目标元素添加事件监听器，并使用在冒泡阶段处理事件.
 * 
 * @param {EventTarget} target  目标元素，可以是任何实现了EventTarget接口的对象，如HTMLElement.
 * @param {string} eventType  事件类型，如'click'、'mouseover'等.
 * @param {Function} listener  当事件触发时所执行的函数. 这个函数应该接受一个事件对象作为参数.
 * @returns {Function} 返回监听器函数本身，以便于进行链式调用或用于其他需要返回监听器函数的场景.
 */
export function addEventBubbleListener(
  target: EventTarget,
  eventType: string,
  listener: Function,
): Function {
  target.addEventListener(eventType, listener, false);
  return listener;
}

/**
 * 为指定目标元素添加事件监听器，并使用在捕获阶段处理事件.
 * 
 * @param {EventTarget} target  目标元素，可以是任何实现了EventTarget接口的对象，如HTMLElement.
 * @param {string} eventType  事件类型
 * @param {Function} listener  当事件触发时所执行的函数. 这个函数应该接受一个事件对象作为参数.
 * @returns {Function} 返回监听器函数本身，以便于进行链式调用或用于其他需要返回监听器函数的场景.
 */
export function addEventCaptureListener(
  target: EventTarget,
  eventType: string,
  listener: Function,
): Function {
  target.addEventListener(eventType, listener, true);
  return listener;
}

/**
 * 为指定目标元素添加事件监听器，并使用在捕获阶段处理事件.
 * 
 * @param {EventTarget} target  目标元素，可以是任何实现了EventTarget接口的对象，如HTMLElement.
 * @param {string} eventType  事件类型
 * @param {Function} listener  当事件触发时所执行的函数. 这个函数应该接受一个事件对象作为参数.
 * @param {boolean} passive 设置为 true 时，表示 listener 永远不会调用 preventDefault()
 * @returns {Function} 返回监听器函数本身，以便于进行链式调用或用于其他需要返回监听器函数的场景.
 */
export function addEventCaptureListenerWithPassiveFlag(
  target: EventTarget,
  eventType: string,
  listener: Function,
  passive: boolean,
): Function {
  target.addEventListener(eventType, listener, {
    capture: true,
    passive,
  });
  return listener;
}

export function addEventBubbleListenerWithPassiveFlag(
  target: EventTarget,
  eventType: string,
  listener: Function,
  passive: boolean,
): Function {
  target.addEventListener(eventType, listener, {
    passive,
  });
  return listener;
}

export function removeEventListener(
  target: EventTarget,
  eventType: string,
  listener: Function,
  capture: boolean,
): void {
  target.removeEventListener(eventType, listener, capture);
}

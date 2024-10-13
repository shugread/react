/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList} from 'shared/ReactTypes';
import type {
  FiberRoot,
  SuspenseHydrationCallbacks,
  TransitionTracingCallbacks,
} from './ReactInternalTypes';
import type {RootTag} from './ReactRootTags';
import type {Cache} from './ReactFiberCacheComponent.old';
import type {
  PendingSuspenseBoundaries,
  Transition,
} from './ReactFiberTracingMarkerComponent.old';

import {noTimeout, supportsHydration} from './ReactFiberHostConfig';
import {createHostRootFiber} from './ReactFiber.old';
import {
  NoLane,
  NoLanes,
  NoTimestamp,
  TotalLanes,
  createLaneMap,
} from './ReactFiberLane.old';
import {
  enableSuspenseCallback,
  enableCache,
  enableProfilerCommitHooks,
  enableProfilerTimer,
  enableUpdaterTracking,
  enableTransitionTracing,
} from 'shared/ReactFeatureFlags';
import {initializeUpdateQueue} from './ReactFiberClassUpdateQueue.old';
import {LegacyRoot, ConcurrentRoot} from './ReactRootTags';
import {createCache, retainCache} from './ReactFiberCacheComponent.old';

export type RootState = {
  element: any,
  isDehydrated: boolean,
  cache: Cache,
  pendingSuspenseBoundaries: PendingSuspenseBoundaries | null,
  transitions: Set<Transition> | null,
};
/**
 * 创建一个 Fiber 根节点
 * 
 * 创建一个 Fiber 根节点
 * 
 * @param {Document} containerInfo 容器信息，通常是一个 DOM 元素
 * @param {number} tag 标识根节点的类型，例如 ConcurrentRoot 或 LegacyRoot
 * @param {boolean} hydrate 是否进行服务器端渲染的 Hydration
 * @param {string} identifierPrefix 用于调试目的的前缀
 * @param {Function} onRecoverableError 当发生可恢复错误时的回调函数
 */
function FiberRootNode(
  containerInfo,
  tag,
  hydrate,
  identifierPrefix,
  onRecoverableError,
) {
  // 根节点的类型标识
  this.tag = tag;
  // 容器信息，通常是一个 DOM 元素
  this.containerInfo = containerInfo;
  // 待处理的子节点列表
  this.pendingChildren = null;
  // 当前的 Fiber 树
  this.current = null;
  // Ping 缓存，用于性能优化
  this.pingCache = null;
  // 完成的工作单元
  this.finishedWork = null;
  // 超时处理标识
  this.timeoutHandle = noTimeout;
  // 上下文信息
  this.context = null;
  // 待处理的上下文变更
  this.pendingContext = null;
  // 回调节点
  this.callbackNode = null;
  // 回调的优先级
  this.callbackPriority = NoLane;
  // 事件时间映射
  this.eventTimes = createLaneMap(NoLanes);
  // 过期时间映射
  this.expirationTimes = createLaneMap(NoTimestamp);

  // 待处理的 Lanes
  this.pendingLanes = NoLanes;
  // 挂起的 Lanes
  this.suspendedLanes = NoLanes;
  // 已 Ping 的 Lanes
  this.pingedLanes = NoLanes;
  // 已过期的 Lanes
  this.expiredLanes = NoLanes;
  // 可变读取的 Lanes
  this.mutableReadLanes = NoLanes;
  // 已完成的 Lanes
  this.finishedLanes = NoLanes;

  // 纠缠的 Lanes
  this.entangledLanes = NoLanes;
  // 纠缠关系映射
  this.entanglements = createLaneMap(NoLanes);

  // 标识前缀
  this.identifierPrefix = identifierPrefix;
  // 可恢复错误的回调函数
  this.onRecoverableError = onRecoverableError;

  // 如果启用了 Cache 功能
  if (enableCache) {
    // 缓存池
    this.pooledCache = null;
    // 缓存池对应的 Lanes
    this.pooledCacheLanes = NoLanes;
  }

  // 如果支持 Hydration 功能
  if (supportsHydration) {
    // 可变的源 Hydration 数据
    this.mutableSourceEagerHydrationData = null;
  }

  // 如果启用了 Suspense Callback 功能
  if (enableSuspenseCallback) {
    // Hydration 回调函数列表
    this.hydrationCallbacks = null;
  }

  // 如果启用了 Transition Tracing 功能
  if (enableTransitionTracing) {
    // Transition 回调函数列表
    this.transitionCallbacks = null;
    // Transition Lanes 映射表
    const transitionLanesMap = (this.transitionLanes = []);
    for (let i = 0; i < TotalLanes; i++) {
      transitionLanesMap.push(null);
    }
  }

  // 如果启用了 Profiler Timer 和 Commit Hooks 功能
  if (enableProfilerTimer && enableProfilerCommitHooks) {
    // Effect 持续时间
    this.effectDuration = 0;
    // Passive Effect 持续时间
    this.passiveEffectDuration = 0;
  }

  // 如果启用了 Updater Tracking 功能
  if (enableUpdaterTracking) {
    // Memoized 的 Updaters 集合
    this.memoizedUpdaters = new Set();
    // 待处理的 Updaters Lane 映射表
    const pendingUpdatersLaneMap = (this.pendingUpdatersLaneMap = []);
    for (let i = 0; i < TotalLanes; i++) {
      pendingUpdatersLaneMap.push(new Set());
    }
  }

  // 在开发模式下
  if (__DEV__) {
    // 根据根节点的类型和是否 Hydration 设置调试信息
    switch (tag) {
      case ConcurrentRoot:
        this._debugRootType = hydrate ? 'hydrateRoot()' : 'createRoot()';
        break;
      case LegacyRoot:
        this._debugRootType = hydrate ? 'hydrate()' : 'render()';
        break;
    }
  }
}
/**
 * 创建一个 Fiber 根节点。
 *
 * @param {Document} containerInfo 容器的信息，如 DOM 元素。
 * @param {RootTag} tag 根节点的标签，表示根节点的类型。
 * @param {boolean} hydrate 是否进行服务器端渲染的hydrate操作。
 * @param {ReactNodeList} initialChildren 初始的子元素。
 * @param {hydrationCallbacks} hydrationCallbacks 悬挂回调函数，用于处理hydrate过程中的一些操作。
 * @param {boolean} isStrictMode 是否为严格模式，在严格模式下会增加一些额外的检查。
 * @param {null | boolean} concurrentUpdatesByDefaultOverride 默认是否并行更新的覆盖值。
 * @param {string} identifierPrefix 用于标识的前缀，通常用于测试中。
 * @param {null | ((error: mixed) => void)} onRecoverableError 可恢复错误的回调函数。
 * @param {null | TransitionTracingCallbacks} transitionCallbacks 过渡追踪回调函数。
 * @returns {FiberRoot} 返回一个 FiberRoot 对象，代表 React 树的根节点。
 *
 * 此函数负责初始化一个 Fiber 树的根节点，包括设置根节点的属性、初始化 Fiber 节点的状态，
 * 以及根据配置进行一些可选功能的初始化。这个过程中会创建一个 FiberRootNode 实例，并将其
 * 与一个初始的 Fiber 节点关联起来，形成一个完整的根节点结构。
 */
export function createFiberRoot(
  containerInfo: any,
  tag: RootTag,
  hydrate: boolean,
  initialChildren: ReactNodeList,
  hydrationCallbacks: null | SuspenseHydrationCallbacks,
  isStrictMode: boolean,
  concurrentUpdatesByDefaultOverride: null | boolean,
  // TODO: We have several of these arguments that are conceptually part of the
  // host config, but because they are passed in at runtime, we have to thread
  // them through the root constructor. Perhaps we should put them all into a
  // single type, like a DynamicHostConfig that is defined by the renderer.
  identifierPrefix: string,
  onRecoverableError: null | ((error: mixed) => void),
  transitionCallbacks: null | TransitionTracingCallbacks,
): FiberRoot {
  const root: FiberRoot = (new FiberRootNode(
    containerInfo,
    tag,
    hydrate,
    identifierPrefix,
    onRecoverableError,
  ): any);
  // 如果启用了Suspense回调，则初始化hydrationCallbacks。
  if (enableSuspenseCallback) {
    root.hydrationCallbacks = hydrationCallbacks;
  }
  // 如果启用了过渡追踪，则初始化transitionCallbacks。
  if (enableTransitionTracing) {
    root.transitionCallbacks = transitionCallbacks;
  }

  // Cyclic construction. This cheats the type system right now because
  // stateNode is any.
  // 循环构建 Fiber 根节点和 Fiber 节点之间的关系。
  const uninitializedFiber = createHostRootFiber(
    tag,
    isStrictMode,
    concurrentUpdatesByDefaultOverride,
  );
  root.current = uninitializedFiber;
  uninitializedFiber.stateNode = root;

  if (enableCache) {
    const initialCache = createCache();
    retainCache(initialCache);

    // The pooledCache is a fresh cache instance that is used temporarily
    // for newly mounted boundaries during a render. In general, the
    // pooledCache is always cleared from the root at the end of a render:
    // it is either released when render commits, or moved to an Offscreen
    // component if rendering suspends. Because the lifetime of the pooled
    // cache is distinct from the main memoizedState.cache, it must be
    // retained separately.
    root.pooledCache = initialCache;
    retainCache(initialCache);
    const initialState: RootState = {
      element: initialChildren,
      isDehydrated: hydrate,
      cache: initialCache,
      transitions: null,
      pendingSuspenseBoundaries: null,
    };
    uninitializedFiber.memoizedState = initialState;
  } else {
    const initialState: RootState = {
      element: initialChildren,
      isDehydrated: hydrate,
      cache: (null: any), // not enabled yet
      transitions: null,
      pendingSuspenseBoundaries: null,
    };
    uninitializedFiber.memoizedState = initialState;
  }

  initializeUpdateQueue(uninitializedFiber);

  return root;
}

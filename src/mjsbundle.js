var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
class LensImpl {
  constructor(_get, _set) {
    this._get = _get;
    this._set = _set;
  }
  k(key) {
    return this.compose(
      lens(
        (t) => t[key],
        (v) => (t) => {
          const copied = copy(t);
          copied[key] = v;
          return copied;
        }
      )
    );
  }
  compose(other) {
    return lens(
      (t) => other._get(this._get(t)),
      (v) => (t) => this._set(other._set(v)(this._get(t)))(t)
    );
  }
  get() {
    if (arguments.length) {
      const f = arguments[0];
      return (t) => f(this._get(t));
    } else {
      return this._get;
    }
  }
  set(modifier) {
    if (typeof modifier === "function") {
      return (t) => this._set(modifier(this._get(t)))(t);
    } else {
      return this._set(modifier);
    }
  }
}
function copy(x) {
  if (Array.isArray(x)) {
    return x.slice();
  } else if (x && typeof x === "object") {
    return Object.keys(x).reduce((res, k) => {
      res[k] = x[k];
      return res;
    }, {});
  } else {
    return x;
  }
}
function proxify(impl) {
  return new Proxy(impl, {
    get(target, prop) {
      if (typeof target[prop] !== "undefined") {
        return target[prop];
      }
      return target.k(prop);
    }
  });
}
function lens() {
  if (arguments.length) {
    return proxify(new LensImpl(arguments[0], arguments[1]));
  } else {
    return lens(
      (t) => t,
      (v) => (_) => v
    );
  }
}
const DEFAULT_OPTION = { cache: true };
function makeDisplayProxyValue(depthList, value) {
  return {
    _navi: depthList.join("."),
    _type: Array.isArray(value) ? "Array" : "Object",
    _value: ".."
  };
}
function isPrimitiveType(orignalValue) {
  const isObjectTypeValue = typeof orignalValue === "object" && orignalValue !== null;
  return !isObjectTypeValue;
}
function copyable(origObj, lensInit) {
  let lensIns = lensInit || lens();
  return new Proxy(origObj, {
    get(target, prop) {
      if (prop === "writeCopy") {
        return (value) => {
          return lensIns.set(value)(target);
        };
      }
      return copyable(origObj, lensIns.k(prop));
    },
    set() {
      throw new Error(
        'Property modification is not supported on a copyable object. Use "writeCopy" for state updates.'
      );
    }
  });
}
function cloneDeep(value) {
  if (value == null) {
    return value;
  }
  if (typeof value !== "object") {
    return value;
  }
  const isArray = Array.isArray(value);
  const Ctor = isArray ? Array : Object;
  const result = new Ctor();
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      result[key] = cloneDeep(value[key]);
    }
  }
  return result;
}
class ShelfRoot {
  constructor(propertyValue, rootValue, runCollector, runner2) {
    __publicField(this, "_value");
    __publicField(this, "rootValue");
    __publicField(this, "runCollector");
    __publicField(this, "runner");
    this._value = propertyValue;
    this.rootValue = rootValue;
    this.runCollector = runCollector;
    this.runner = runner2;
  }
  get value() {
    this.runCollector();
    return this._value;
  }
  set value(newValue) {
    if (this._value !== newValue) {
      this._value = newValue;
      this.rootValue.root = newValue;
      this.runner();
    }
  }
  setValue(newValue) {
    this._value = newValue;
  }
}
function collector(value, getNextValue, newDepthList, run, storeRenderList, primitiveSetter) {
  const runInfo = {
    value,
    getNextValue,
    key: newDepthList.join("."),
    primitiveSetter
  };
  if (run) {
    if (storeRenderList.has(run)) {
      const subList = storeRenderList.get(run);
      if (!subList.has(runInfo.key)) {
        subList.set(runInfo.key, runInfo);
      }
    } else {
      const subList = /* @__PURE__ */ new Map();
      if (!subList.has(runInfo.key)) {
        subList.set(runInfo.key, runInfo);
        storeRenderList.set(run, subList);
      }
    }
  }
}
function runner(storeRenderList) {
  const runableRenewList = /* @__PURE__ */ new Set();
  storeRenderList.forEach((defs, run) => {
    defs.forEach((item, key) => {
      const { value, getNextValue, primitiveSetter } = item;
      try {
        const nextValue = getNextValue();
        if (value !== nextValue) {
          runableRenewList.add(run);
          item.value = nextValue;
          if (primitiveSetter) {
            primitiveSetter(nextValue);
          }
        }
      } catch {
        defs.delete(key);
      }
    });
  });
  runableRenewList.forEach((run) => {
    if (run && run() === false) {
      storeRenderList.delete(run);
    }
  });
  runableRenewList.clear();
}
function firstRunner(run, storeRenderList, cacheMap, renew) {
  const renewResult = run(true);
  if (renewResult instanceof AbortSignal) {
    renewResult.addEventListener("abort", () => {
      cacheMap.delete(renew);
      storeRenderList.delete(run);
    });
  }
}
function makePrimitive({
  renew,
  orignalValue,
  rootValue,
  storeRenderList,
  cacheMap
}) {
  const ref = { current: null };
  const run = (isFirst) => renew(ref.current, isFirst ?? false);
  ref.current = new ShelfRoot(
    orignalValue,
    rootValue,
    () => {
      collector(
        orignalValue,
        () => rootValue.root,
        ["root"],
        run,
        storeRenderList,
        (newValue) => {
          ref.current.setValue(newValue);
        }
      );
    },
    () => {
      runner(storeRenderList);
    }
  );
  firstRunner(run, storeRenderList, cacheMap, renew);
  cacheMap.set(renew, ref.current);
  return ref.current;
}
class ShelfTail {
  constructor(propertyValue, depthList, lensValue = lens(), rootValue, runCollector, runner2) {
    __publicField(this, "_value");
    __publicField(this, "depth");
    __publicField(this, "lensValue");
    __publicField(this, "rootValue");
    __publicField(this, "runCollector");
    __publicField(this, "runner");
    this._value = propertyValue;
    this.depth = depthList;
    this.lensValue = lensValue;
    this.rootValue = rootValue;
    this.runCollector = runCollector;
    this.runner = runner2;
  }
  get value() {
    this.runCollector();
    return this._value;
  }
  set value(newValue) {
    const prop = this.depth.at(-1);
    if (newValue !== this.lensValue.get()(this.rootValue)) {
      const newTree = this.lensValue.k(prop).set(newValue)(this.rootValue);
      this._value = newValue;
      this.rootValue.root = newTree.root;
      this.runner();
    }
  }
  setValue(newValue) {
    this._value = newValue;
  }
}
function makeProxy(value, storeRenderList, run, rootValue = value, lensValue = lens(), depth = 0, depthList = []) {
  const result = new Proxy(
    makeDisplayProxyValue(depthList, value),
    {
      /**
       * 1. 프록시에서 value로 접근할때
       *   1-1. collector 가 구독 콜백을 수집하도록 하고
       *   1-2. 랜즈에서 값을 빼서 리턴해준다
       * 2. 프록시에서 하위 객체타입으로 접근할때
       *   2-1. 하위객체애 대한 프록시를 만든다
       * 3. 프록시에서 하위 프리미티브 타입으로 접근할때
       *   3-1. value로 값에 접근하고, value로 값을 수정할수 있는 객체로 감싸서 리턴한다.
       */
      get(_, prop) {
        const newDepthList = [...depthList, prop.toString()];
        if (prop === "value") {
          const value2 = lensValue.get()(rootValue);
          collector(
            value2,
            () => lensValue.get()(rootValue),
            [...depthList],
            run,
            storeRenderList
          );
          return value2;
        }
        const lens2 = lensValue.k(prop);
        const propertyValue = lens2.get()(rootValue);
        if (typeof propertyValue === "object" && propertyValue !== null) {
          return makeProxy(
            propertyValue,
            storeRenderList,
            run,
            rootValue,
            lens2,
            depth + 1,
            newDepthList
          );
        }
        const shelfTail = new ShelfTail(
          propertyValue,
          newDepthList,
          lensValue,
          rootValue,
          () => {
            collector(
              propertyValue,
              () => lens2.get()(rootValue),
              newDepthList,
              run,
              storeRenderList,
              (newValue) => {
                shelfTail.setValue(newValue);
              }
            );
          },
          () => {
            runner(storeRenderList);
          }
        );
        return shelfTail;
      },
      /**
       * value에 값을 할당할때는 copyOnWrite를 해준다.
       * value 가 아닌데 값을 할당할 경우 에러를 던진다.
       * ex) shelf.a.b = 'newValue'; // Error
       * ex) shelf.a.b.value = 'newValue'; // Success
       */
      set(_, prop, value2) {
        if (prop === "value" && value2 !== lensValue.get()(rootValue)) {
          const newTree = lensValue.set(value2)(rootValue);
          rootValue.root = newTree.root;
          runner(storeRenderList);
        } else if (lensValue.k(prop).get()(rootValue) !== value2) {
          throw new Error('Can only be assigned to a "value".');
        }
        return true;
      }
    }
  );
  return result;
}
function makeObject({
  renew,
  rootValue,
  storeRenderList,
  cacheMap
}) {
  const ref = {
    current: null
  };
  const run = (isFirst) => renew(ref.current.root, isFirst ?? false);
  ref.current = makeProxy(
    rootValue,
    storeRenderList,
    run
  );
  firstRunner(run, storeRenderList, cacheMap, renew);
  cacheMap.set(renew, ref.current.root);
  return ref.current.root;
}
function lenshelf(orignalValue) {
  const storeRenderList = /* @__PURE__ */ new Map();
  const cacheMap = /* @__PURE__ */ new WeakMap();
  const rootValue = { root: orignalValue };
  return (renew = () => {
  }, userOption) => {
    const { cache } = Object.assign({}, DEFAULT_OPTION, userOption || {});
    if (cache && renew && cacheMap.has(renew)) {
      return cacheMap.get(renew);
    }
    if (isPrimitiveType(orignalValue)) {
      return makePrimitive({
        renew,
        orignalValue,
        rootValue,
        storeRenderList,
        cacheMap
      });
    }
    return makeObject({ renew, rootValue, storeRenderList, cacheMap });
  };
}
export {
  cloneDeep,
  copyable,
  lens,
  lenshelf
};
//# sourceMappingURL=lenshelf.mjs.map

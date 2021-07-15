import { Action } from './action';

/**
 * Container options.
 */
export interface UseContainerOptions {
  /**
   * If set to true, then default container will be used in the case if given container haven't returned anything.
   */
  fallback?: boolean;

  /**
   * If set to true, then default container will be used in the case if given container thrown an exception.
   */
  fallback_on_errors?: boolean;
}

export type ClassConstructor<T> = { new (...args: any[]): T };

const default_container: { get<T>(someClass: ClassConstructor<T> | Function): T } = new (class {
  private instances: { type: Function; object: any }[] = [];
  get<T>(someClass: ClassConstructor<T>): T {
    let instance = this.instances.find(instance => instance.type === someClass);
    if (!instance) {
      instance = { type: someClass, object: new someClass() };
      this.instances.push(instance);
    }
    return instance.object;
  }
})();

/**
 * Allows routing controllers to resolve objects using your IoC container
 */
export interface IocAdapter {
  /**
   * Return
   */
  get<T>(someClass: ClassConstructor<T>, action?: Action): T;
}

let user_container: { get<T>(someClass: ClassConstructor<T> | Function, action?: Action): T };
let user_container_options: UseContainerOptions;

/**
 * Sets container to be used by this library.
 */
export function useContainer(iocAdapter: IocAdapter, options: UseContainerOptions = {}) {
  user_container = iocAdapter;
  user_container_options = options;
}

/**
 * Gets the IOC container used by this library.
 * @param someClass A class constructor to resolve
 * @param action The request/response context that `someClass` is being resolved for
 */
export function getFromContainer<T>(someClass: ClassConstructor<T> | Function, action?: Action): T {
  if (user_container) {
    try {
      const instance = user_container.get(someClass, action);
      if (instance) return instance;

      if (!user_container_options || !user_container_options.fallback) return instance;
    } catch (error) {
      if (!user_container_options || !user_container_options.fallback_on_errors) throw error;
    }
  }
  return default_container.get<T>(someClass);
}

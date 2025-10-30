export class Router {
  constructor({ routes = {}, defaultRoute = '#/login', target, beforeEach, onAfterRender } = {}) {
    this.routes = routes;
    this.defaultRoute = defaultRoute;
    this.target = target;
    this.beforeEach = beforeEach;
    this.onAfterRender = onAfterRender;
    this.currentRoute = null;
  }

  setRoutes(routes) {
    this.routes = routes;
  }

  setTarget(target) {
    this.target = target;
  }

  setBeforeEach(callback) {
    this.beforeEach = callback;
  }

  setAfterRender(callback) {
    this.onAfterRender = callback;
  }

  start() {
    window.addEventListener('hashchange', () => this.handleRouteChange());
    this.handleRouteChange();
  }

  navigate(hash) {
    if (window.location.hash === hash) {
      this.handleRouteChange();
      return;
    }
    window.location.hash = hash;
  }

  refresh() {
    this.handleRouteChange();
  }

  getPathFromHash(hash) {
    if (!hash) return this.defaultRoute;
    return hash.split('?')[0];
  }

  handleRouteChange() {
    let hash = window.location.hash || this.defaultRoute;
    const path = this.getPathFromHash(hash);

    if (typeof this.beforeEach === 'function') {
      const guardResult = this.beforeEach(path);
      if (guardResult && guardResult.redirect) {
        if (guardResult.redirect !== hash) {
          this.navigate(guardResult.redirect);
        }
        return;
      }
    }

    const routeFactory = this.routes[path] || this.routes[this.defaultRoute];
    if (!routeFactory) {
      console.warn(`Route not found for ${path}`);
      return;
    }

    this.currentRoute = path;
    if (!this.target) {
      throw new Error('Router target element is not defined.');
    }

    this.target.innerHTML = '';
    const view = routeFactory();
    if (view && typeof view.render === 'function') {
      view.render(this.target);
      if (typeof view.afterRender === 'function') {
        view.afterRender();
      }
    }

    if (typeof this.onAfterRender === 'function') {
      this.onAfterRender(path);
    }
  }
}


(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function parse(str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.19.1 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (251:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[16]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[16]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(251:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (244:0) {#if componentParams}
    function create_if_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[15]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[15]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(244:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap$1(component, userData, ...conditions) {
    	// Use the new wrap method and show a deprecation warning
    	// eslint-disable-next-line no-console
    	console.warn("Method `wrap` from `svelte-spa-router` is deprecated and will be removed in a future version. Please use `svelte-spa-router/wrap` instead. See http://bit.ly/svelte-spa-router-upgrading");

    	return wrap({ component, userData, conditions });
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);
    const params = writable(undefined);

    async function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	// Note: this will include scroll state in history even when restoreScrollState is false
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    }

    async function pop() {
    	// Execute this code when the current call stack is complete
    	await tick();

    	window.history.back();
    }

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    	try {
    		const newState = { ...history.state };
    		delete newState["__svelte_spa_router_scrollX"];
    		delete newState["__svelte_spa_router_scrollY"];
    		window.history.replaceState(newState, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event("hashchange"));
    }

    function link(node, opts) {
    	opts = linkOpts(opts);

    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, opts);

    	return {
    		update(updated) {
    			updated = linkOpts(updated);
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, opts) {
    	let href = opts.href || node.getAttribute("href");

    	// Destination must start with '/' or '#/'
    	if (href && href.charAt(0) == "/") {
    		// Add # to the href attribute
    		href = "#" + href;
    	} else if (!href || href.length < 2 || href.slice(0, 2) != "#/") {
    		throw Error("Invalid value for \"href\" attribute: " + href);
    	}

    	node.setAttribute("href", href);

    	node.addEventListener("click", event => {
    		// Prevent default anchor onclick behaviour
    		event.preventDefault();

    		if (!opts.disabled) {
    			scrollstateHistoryHandler(event.currentTarget.getAttribute("href"));
    		}
    	});
    }

    // Internal function that ensures the argument of the link action is always an object
    function linkOpts(val) {
    	if (val && typeof val == "string") {
    		return { href: val };
    	} else {
    		return val || {};
    	}
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {string} href - Destination
     */
    function scrollstateHistoryHandler(href) {
    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			...history.state,
    			__svelte_spa_router_scrollX: window.scrollX,
    			__svelte_spa_router_scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument - strings must start with / or *");
    			}

    			const { pattern, keys } = parse(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == "string") {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || "/";
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || "/";
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {boolean} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	let popStateChanged = null;

    	if (restoreScrollState) {
    		popStateChanged = event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.__svelte_spa_router_scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		};

    		// This is removed in the destroy() invocation below
    		window.addEventListener("popstate", popStateChanged);

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.__svelte_spa_router_scrollX, previousScrollState.__svelte_spa_router_scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	const unsubscribeLoc = loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData,
    				params: match && typeof match == "object" && Object.keys(match).length
    				? match
    				: null
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick("conditionsFailed", detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoading", Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick("routeLoaded", Object.assign({}, detail, {
    						component,
    						name: component.name,
    						params: componentParams
    					}));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == "object" && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoaded", Object.assign({}, detail, {
    				component,
    				name: component.name,
    				params: componentParams
    			})).then(() => {
    				params.set(componentParams);
    			});

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    		params.set(undefined);
    	});

    	onDestroy(() => {
    		unsubscribeLoc();
    		popStateChanged && window.removeEventListener("popstate", popStateChanged);
    	});

    	const writable_props = ["routes", "prefix", "restoreScrollState"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		writable,
    		derived,
    		tick,
    		_wrap: wrap,
    		wrap: wrap$1,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		params,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		linkOpts,
    		scrollstateHistoryHandler,
    		console,
    		window,
    		undefined,
    		Error,
    		history,
    		Event,
    		onDestroy,
    		createEventDispatcher,
    		afterUpdate,
    		parse,
    		routes,
    		prefix,
    		restoreScrollState,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		props,
    		dispatch,
    		dispatchNextTick,
    		previousScrollState,
    		popStateChanged,
    		lastLoc,
    		componentObj,
    		unsubscribeLoc,
    		RegExp,
    		Promise,
    		decodeURIComponent,
    		Map,
    		Object
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("props" in $$props) $$invalidate(2, props = $$props.props);
    		if ("previousScrollState" in $$props) previousScrollState = $$props.previousScrollState;
    		if ("popStateChanged" in $$props) popStateChanged = $$props.popStateChanged;
    		if ("lastLoc" in $$props) lastLoc = $$props.lastLoc;
    		if ("componentObj" in $$props) componentObj = $$props.componentObj;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			 history.scrollRestoration = restoreScrollState ? "manual" : "auto";
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		previousScrollState,
    		popStateChanged,
    		lastLoc,
    		componentObj,
    		RouteItem,
    		routesList,
    		dispatch,
    		dispatchNextTick,
    		unsubscribeLoc,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get restoreScrollState() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set restoreScrollState(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // Unique ID creation requires a high quality random # generator. In the browser we therefore
    // require the crypto API and do not support built-in fallback to lower quality random number
    // generators (like Math.random()).
    var getRandomValues;
    var rnds8 = new Uint8Array(16);
    function rng() {
      // lazy load so that environments that need to polyfill have a chance to do so
      if (!getRandomValues) {
        // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
        // find the complete implementation of crypto (msCrypto) on IE11.
        getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function' && msCrypto.getRandomValues.bind(msCrypto);

        if (!getRandomValues) {
          throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
        }
      }

      return getRandomValues(rnds8);
    }

    var REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

    function validate(uuid) {
      return typeof uuid === 'string' && REGEX.test(uuid);
    }

    /**
     * Convert array of 16 byte values to UUID string format of the form:
     * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
     */

    var byteToHex = [];

    for (var i = 0; i < 256; ++i) {
      byteToHex.push((i + 0x100).toString(16).substr(1));
    }

    function stringify(arr) {
      var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      // Note: Be careful editing this code!  It's been tuned for performance
      // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
      var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
      // of the following:
      // - One or more input array values don't map to a hex octet (leading to
      // "undefined" in the uuid)
      // - Invalid input values for the RFC `version` or `variant` fields

      if (!validate(uuid)) {
        throw TypeError('Stringified UUID is invalid');
      }

      return uuid;
    }

    function v4(options, buf, offset) {
      options = options || {};
      var rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

      rnds[6] = rnds[6] & 0x0f | 0x40;
      rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

      if (buf) {
        offset = offset || 0;

        for (var i = 0; i < 16; ++i) {
          buf[offset + i] = rnds[i];
        }

        return buf;
      }

      return stringify(rnds);
    }

    //Svelte

    //Export
    const settings = writable({
        username: localStorage.username ? localStorage.username : 'Admin',
        id: localStorage.id ? localStorage.id : v4(),
        bgColor1 : localStorage.bgColor1 ? localStorage.bgColor1 : '#1F2937',
        bgColor2 : localStorage.bgColor2 ? localStorage.bgColor2 : '#111827',
        bgColor3 : localStorage.bgColor3 ? localStorage.bgColor3 : '#374151',
        bgColor4 : localStorage.bgColor4 ? localStorage.bgColor4 : '#a855f7',
        fontColor1 : localStorage.fontColor1 ? localStorage.fontColor1 : '#ffffff',
        fontColor2 : localStorage.fontColor2 ? localStorage.fontColor2 : '#f0f0f0',
        fontColor3 : localStorage.fontColor2 ? localStorage.fontColor2 : '#f0f0f0',
        fontColor4 : localStorage.fontColor2 ? localStorage.fontColor2 : '#f0f0f0',
        shellColor : localStorage.linkColor ? localStorage.shellColor : '#374151',
        linkColor : localStorage.linkColor ? localStorage.linkColor : '#374151',
        miscColor : localStorage.miscColor ? localStorage.miscColor : '#8B5CF6',
        font : localStorage.font ? localStorage.font : ''
    });

    /* src\Components\Misc\Link.svelte generated by Svelte v3.19.1 */
    const file = "src\\Components\\Misc\\Link.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let a;
    	let div0;
    	let i;
    	let i_class_value;
    	let t0;
    	let span;
    	let t1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			a = element("a");
    			div0 = element("div");
    			i = element("i");
    			t0 = space();
    			span = element("span");
    			t1 = text(/*name*/ ctx[2]);
    			attr_dev(i, "class", i_class_value = "fa " + /*icon*/ ctx[1] + " text-center w-full md:w-8");
    			add_location(i, file, 27, 12, 536);
    			attr_dev(span, "class", "hidden md:block pl-2 font-semibold");
    			add_location(span, file, 28, 12, 599);
    			attr_dev(div0, "class", "rounded p-2 flex flex-row items-center");
    			set_style(div0, "background", /*$settings*/ ctx[3].bgColor3);
    			add_location(div0, file, 23, 8, 398);
    			attr_dev(a, "href", /*link*/ ctx[0]);
    			attr_dev(a, "class", "svelte-1ldhlbv");
    			add_location(a, file, 22, 4, 373);
    			attr_dev(div1, "class", "text-lg my-8");
    			set_style(div1, "color", /*$settings*/ ctx[3].fontColor1);
    			add_location(div1, file, 18, 0, 291);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, a);
    			append_dev(a, div0);
    			append_dev(div0, i);
    			append_dev(div0, t0);
    			append_dev(div0, span);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*icon*/ 2 && i_class_value !== (i_class_value = "fa " + /*icon*/ ctx[1] + " text-center w-full md:w-8")) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (dirty & /*name*/ 4) set_data_dev(t1, /*name*/ ctx[2]);

    			if (dirty & /*$settings*/ 8) {
    				set_style(div0, "background", /*$settings*/ ctx[3].bgColor3);
    			}

    			if (dirty & /*link*/ 1) {
    				attr_dev(a, "href", /*link*/ ctx[0]);
    			}

    			if (dirty & /*$settings*/ 8) {
    				set_style(div1, "color", /*$settings*/ ctx[3].fontColor1);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $settings;
    	validate_store(settings, "settings");
    	component_subscribe($$self, settings, $$value => $$invalidate(3, $settings = $$value));
    	let { link = "#/" } = $$props;
    	let { icon = "fa-home" } = $$props;
    	let { name = "Home" } = $$props;
    	const writable_props = ["link", "icon", "name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Link> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("link" in $$props) $$invalidate(0, link = $$props.link);
    		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({ settings, link, icon, name, $settings });

    	$$self.$inject_state = $$props => {
    		if ("link" in $$props) $$invalidate(0, link = $$props.link);
    		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
    		if ("name" in $$props) $$invalidate(2, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [link, icon, name, $settings];
    }

    class Link extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { link: 0, icon: 1, name: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Link",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get link() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set link(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<Link>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Link>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\Misc\Nav.svelte generated by Svelte v3.19.1 */
    const file$1 = "src\\Components\\Misc\\Nav.svelte";

    function create_fragment$2(ctx) {
    	let div1;
    	let h2;
    	let i;
    	let t0;
    	let p;
    	let t1_value = /*$settings*/ ctx[0].username + "";
    	let t1;
    	let t2;
    	let div0;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let t8;
    	let current;

    	const link0 = new Link({
    			props: {
    				link: "#/",
    				icon: "fa-home",
    				name: "Home"
    			},
    			$$inline: true
    		});

    	const link1 = new Link({
    			props: {
    				link: "#/network",
    				icon: "fa-plug",
    				name: "Network"
    			},
    			$$inline: true
    		});

    	const link2 = new Link({
    			props: {
    				link: "#/diagnostics",
    				icon: "fa-cubes",
    				name: "Diagnostics"
    			},
    			$$inline: true
    		});

    	const link3 = new Link({
    			props: {
    				link: "#/system",
    				icon: "fa-microchip",
    				name: "System"
    			},
    			$$inline: true
    		});

    	const link4 = new Link({
    			props: {
    				link: "#/api",
    				icon: "fa-terminal",
    				name: "API"
    			},
    			$$inline: true
    		});

    	const link5 = new Link({
    			props: {
    				link: "#/settings",
    				icon: "fa-cog",
    				name: "Settings"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h2 = element("h2");
    			i = element("i");
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			div0 = element("div");
    			t3 = space();
    			create_component(link0.$$.fragment);
    			t4 = space();
    			create_component(link1.$$.fragment);
    			t5 = space();
    			create_component(link2.$$.fragment);
    			t6 = space();
    			create_component(link3.$$.fragment);
    			t7 = space();
    			create_component(link4.$$.fragment);
    			t8 = space();
    			create_component(link5.$$.fragment);
    			attr_dev(i, "class", "fa fa-database fa-2x");
    			attr_dev(i, "aria-hidden", "true");
    			add_location(i, file$1, 16, 4, 495);
    			attr_dev(p, "class", "text-center text-xl mt-2 font-semibold");
    			add_location(p, file$1, 17, 4, 556);
    			attr_dev(h2, "class", "text-center text-2xl mt-8 font-medium");
    			set_style(h2, "color", /*$settings*/ ctx[0].fontColor1);
    			add_location(h2, file$1, 10, 4, 240);
    			attr_dev(div0, "class", "mt-8");
    			add_location(div0, file$1, 21, 4, 688);
    			attr_dev(div1, "class", "w-auto px-4 sticky top-0");
    			attr_dev(div1, "id", "nav");
    			set_style(div1, "background-color", /*$settings*/ ctx[0].bgColor1);
    			add_location(div1, file$1, 5, 0, 122);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h2);
    			append_dev(h2, i);
    			append_dev(h2, t0);
    			append_dev(h2, p);
    			append_dev(p, t1);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div1, t3);
    			mount_component(link0, div1, null);
    			append_dev(div1, t4);
    			mount_component(link1, div1, null);
    			append_dev(div1, t5);
    			mount_component(link2, div1, null);
    			append_dev(div1, t6);
    			mount_component(link3, div1, null);
    			append_dev(div1, t7);
    			mount_component(link4, div1, null);
    			append_dev(div1, t8);
    			mount_component(link5, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*$settings*/ 1) && t1_value !== (t1_value = /*$settings*/ ctx[0].username + "")) set_data_dev(t1, t1_value);

    			if (!current || dirty & /*$settings*/ 1) {
    				set_style(h2, "color", /*$settings*/ ctx[0].fontColor1);
    			}

    			if (!current || dirty & /*$settings*/ 1) {
    				set_style(div1, "background-color", /*$settings*/ ctx[0].bgColor1);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(link0.$$.fragment, local);
    			transition_in(link1.$$.fragment, local);
    			transition_in(link2.$$.fragment, local);
    			transition_in(link3.$$.fragment, local);
    			transition_in(link4.$$.fragment, local);
    			transition_in(link5.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link0.$$.fragment, local);
    			transition_out(link1.$$.fragment, local);
    			transition_out(link2.$$.fragment, local);
    			transition_out(link3.$$.fragment, local);
    			transition_out(link4.$$.fragment, local);
    			transition_out(link5.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(link0);
    			destroy_component(link1);
    			destroy_component(link2);
    			destroy_component(link3);
    			destroy_component(link4);
    			destroy_component(link5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $settings;
    	validate_store(settings, "settings");
    	component_subscribe($$self, settings, $$value => $$invalidate(0, $settings = $$value));
    	$$self.$capture_state = () => ({ Link, settings, $settings });
    	return [$settings];
    }

    class Nav extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nav",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Components\Misc\TitleBar.svelte generated by Svelte v3.19.1 */
    const file$2 = "src\\Components\\Misc\\TitleBar.svelte";

    function create_fragment$3(ctx) {
    	let div1;
    	let h1;
    	let t0;
    	let span;
    	let t1;
    	let t2;
    	let div0;
    	let button0;
    	let t3;
    	let button1;
    	let t4;
    	let button2;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			t0 = text("Neuron / ");
    			span = element("span");
    			t1 = text(/*currPage*/ ctx[0]);
    			t2 = space();
    			div0 = element("div");
    			button0 = element("button");
    			t3 = space();
    			button1 = element("button");
    			t4 = space();
    			button2 = element("button");
    			set_style(span, "background-color", /*$settings*/ ctx[1].bgColor2);
    			attr_dev(span, "class", "pr-2 pb-1 rounded-md");
    			add_location(span, file$2, 19, 17, 552);
    			attr_dev(h1, "class", "mt-1 text-xl ml-4 font-semibold");
    			add_location(h1, file$2, 18, 8, 489);
    			attr_dev(button0, "class", "fa fa-window-minimize ");
    			add_location(button0, file$2, 24, 8, 802);
    			attr_dev(button1, "class", "fa fa-window-maximize mx-6");
    			add_location(button1, file$2, 25, 8, 888);
    			attr_dev(button2, "class", "fa fa-times mr-4");
    			add_location(button2, file$2, 26, 8, 978);
    			attr_dev(div0, "class", "flex flex-row justify-center items-center text-md no-drag svelte-10hzk5y");
    			add_location(div0, file$2, 23, 4, 721);
    			attr_dev(div1, "class", "flex flex-row justify-between my-2 drag w-full sticky top-0 svelte-10hzk5y");
    			set_style(div1, "color", /*$settings*/ ctx[1].fontColor2);
    			set_style(div1, "background-color", /*$settings*/ ctx[1].bgColor2);
    			add_location(div1, file$2, 12, 0, 257);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(h1, t0);
    			append_dev(h1, span);
    			append_dev(span, t1);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t3);
    			append_dev(div0, button1);
    			append_dev(div0, t4);
    			append_dev(div0, button2);

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[4], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[5], false, false, false),
    				listen_dev(button2, "click", /*click_handler_2*/ ctx[6], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*currPage*/ 1) set_data_dev(t1, /*currPage*/ ctx[0]);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span, "background-color", /*$settings*/ ctx[1].bgColor2);
    			}

    			if (dirty & /*$settings*/ 2) {
    				set_style(div1, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*$settings*/ 2) {
    				set_style(div1, "background-color", /*$settings*/ ctx[1].bgColor2);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $settings;
    	validate_store(settings, "settings");
    	component_subscribe($$self, settings, $$value => $$invalidate(1, $settings = $$value));
    	const { remote } = require("electron");
    	const window = remote.getCurrentWindow();
    	let { currPage = "Home" } = $$props;
    	const writable_props = ["currPage"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TitleBar> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => window.minimize();
    	const click_handler_1 = () => window.maximize();
    	const click_handler_2 = () => window.close();

    	$$self.$set = $$props => {
    		if ("currPage" in $$props) $$invalidate(0, currPage = $$props.currPage);
    	};

    	$$self.$capture_state = () => ({
    		settings,
    		remote,
    		window,
    		currPage,
    		require,
    		$settings
    	});

    	$$self.$inject_state = $$props => {
    		if ("currPage" in $$props) $$invalidate(0, currPage = $$props.currPage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		currPage,
    		$settings,
    		window,
    		remote,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class TitleBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { currPage: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TitleBar",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get currPage() {
    		throw new Error("<TitleBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currPage(value) {
    		throw new Error("<TitleBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Pages\_page.svelte generated by Svelte v3.19.1 */
    const file$3 = "src\\Pages\\_page.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let div2;
    	let t0;
    	let div1;
    	let t1;
    	let div0;
    	let current;
    	const nav = new Nav({ $$inline: true });

    	const titlebar = new TitleBar({
    			props: { currPage: /*_currPage*/ ctx[0] },
    			$$inline: true
    		});

    	const default_slot_template = /*$$slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div2 = element("div");
    			create_component(nav.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			create_component(titlebar.$$.fragment);
    			t1 = space();
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "px-4 mx-auto overflow-auto content-height svelte-1kd848o");
    			add_location(div0, file$3, 53, 12, 1937);
    			attr_dev(div1, "class", "w-full h-full svelte-1kd848o");
    			attr_dev(div1, "id", "main");
    			set_style(div1, "background-color", /*$settings*/ ctx[1].bgColor2);
    			add_location(div1, file$3, 47, 8, 1743);
    			attr_dev(div2, "class", "flex flex-row h-full svelte-1kd848o");
    			add_location(div2, file$3, 45, 4, 1682);
    			attr_dev(main, "class", "h-full svelte-1kd848o");
    			set_style(main, "font-family", /*$settings*/ ctx[1].font);
    			add_location(main, file$3, 41, 0, 1604);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			mount_component(nav, div2, null);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			mount_component(titlebar, div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const titlebar_changes = {};
    			if (dirty & /*_currPage*/ 1) titlebar_changes.currPage = /*_currPage*/ ctx[0];
    			titlebar.$set(titlebar_changes);

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 4) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[2], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null));
    			}

    			if (!current || dirty & /*$settings*/ 2) {
    				set_style(div1, "background-color", /*$settings*/ ctx[1].bgColor2);
    			}

    			if (!current || dirty & /*$settings*/ 2) {
    				set_style(main, "font-family", /*$settings*/ ctx[1].font);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nav.$$.fragment, local);
    			transition_in(titlebar.$$.fragment, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nav.$$.fragment, local);
    			transition_out(titlebar.$$.fragment, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(nav);
    			destroy_component(titlebar);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $settings;
    	validate_store(settings, "settings");
    	component_subscribe($$self, settings, $$value => $$invalidate(1, $settings = $$value));
    	let { _currPage = "Home" } = $$props;
    	const writable_props = ["_currPage"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Page> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("_currPage" in $$props) $$invalidate(0, _currPage = $$props._currPage);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Nav,
    		TitleBar,
    		settings,
    		_currPage,
    		$settings
    	});

    	$$self.$inject_state = $$props => {
    		if ("_currPage" in $$props) $$invalidate(0, _currPage = $$props._currPage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [_currPage, $settings, $$scope, $$slots];
    }

    class Page extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { _currPage: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Page",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get _currPage() {
    		throw new Error("<Page>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set _currPage(value) {
    		throw new Error("<Page>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\Main\Greeting.svelte generated by Svelte v3.19.1 */
    const file$4 = "src\\Components\\Main\\Greeting.svelte";

    function create_fragment$5(ctx) {
    	let div1;
    	let div0;
    	let p;
    	let t0;
    	let t1_value = /*$settings*/ ctx[0].username + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text("Hello ");
    			t1 = text(t1_value);
    			t2 = text("!");
    			attr_dev(p, "class", "text-3xl text-white font-bold");
    			add_location(p, file$4, 14, 8, 321);
    			attr_dev(div0, "class", "flex flex-row justify-center");
    			add_location(div0, file$4, 13, 8, 269);
    			set_style(div1, "background-color", /*$settings*/ ctx[0].linkColor);
    			attr_dev(div1, "class", "p-1 rounded-md w-auto");
    			add_location(div1, file$4, 12, 4, 177);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$settings*/ 1 && t1_value !== (t1_value = /*$settings*/ ctx[0].username + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*$settings*/ 1) {
    				set_style(div1, "background-color", /*$settings*/ ctx[0].linkColor);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $settings;
    	validate_store(settings, "settings");
    	component_subscribe($$self, settings, $$value => $$invalidate(0, $settings = $$value));
    	const { ipcRenderer } = require("electron");

    	$$self.$capture_state = () => ({
    		settings,
    		ipcRenderer,
    		require,
    		$settings
    	});

    	return [$settings];
    }

    class Greeting extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Greeting",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\Components\Misc\Shell.svelte generated by Svelte v3.19.1 */
    const file$5 = "src\\Components\\Misc\\Shell.svelte";

    function create_fragment$6(ctx) {
    	let div3;
    	let div1;
    	let h3;
    	let t0;
    	let t1;
    	let div0;
    	let span0;
    	let t2;
    	let span1;
    	let span1_class_value;
    	let t3;
    	let hr;
    	let t4;
    	let div2;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div1 = element("div");
    			h3 = element("h3");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			div0 = element("div");
    			span0 = element("span");
    			t2 = space();
    			span1 = element("span");
    			t3 = space();
    			hr = element("hr");
    			t4 = space();
    			div2 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(h3, "class", "text-lg font-semibold");
    			set_style(h3, "color", /*$settings*/ ctx[2].fontColor2);
    			add_location(h3, file$5, 44, 8, 1553);
    			attr_dev(span0, "class", "ml-2 fas fa-info-circle cursor-pointer");
    			attr_dev(span0, "title", /*tooltip*/ ctx[1]);
    			add_location(span0, file$5, 51, 12, 1727);

    			attr_dev(span1, "class", span1_class_value = "ml-2 fas fa-star cursor-pointer " + (checkInStorage(/*title*/ ctx[0])
    			? "text-yellow-500"
    			: ""));

    			attr_dev(span1, "title", "Add to favourites");
    			add_location(span1, file$5, 55, 12, 1861);
    			add_location(div0, file$5, 50, 8, 1708);
    			attr_dev(div1, "class", "flex flex-row justify-between items-center");
    			add_location(div1, file$5, 43, 4, 1487);
    			attr_dev(hr, "class", "my-1 h-px bg-white");
    			add_location(hr, file$5, 63, 4, 2128);
    			add_location(div2, file$5, 64, 4, 2165);
    			attr_dev(div3, "class", "rounded-md shadow-md p-2 ");
    			set_style(div3, "background-color", /*$settings*/ ctx[2].bgColor3);
    			set_style(div3, "color", /*$settings*/ ctx[2].fontColor1);
    			add_location(div3, file$5, 39, 0, 1352);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, h3);
    			append_dev(h3, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, span0);
    			append_dev(div0, t2);
    			append_dev(div0, span1);
    			append_dev(div3, t3);
    			append_dev(div3, hr);
    			append_dev(div3, t4);
    			append_dev(div3, div2);

    			if (default_slot) {
    				default_slot.m(div2, null);
    			}

    			current = true;
    			dispose = listen_dev(span1, "click", /*click_handler*/ ctx[5], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);

    			if (!current || dirty & /*$settings*/ 4) {
    				set_style(h3, "color", /*$settings*/ ctx[2].fontColor2);
    			}

    			if (!current || dirty & /*tooltip*/ 2) {
    				attr_dev(span0, "title", /*tooltip*/ ctx[1]);
    			}

    			if (!current || dirty & /*title*/ 1 && span1_class_value !== (span1_class_value = "ml-2 fas fa-star cursor-pointer " + (checkInStorage(/*title*/ ctx[0])
    			? "text-yellow-500"
    			: ""))) {
    				attr_dev(span1, "class", span1_class_value);
    			}

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 8) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    			}

    			if (!current || dirty & /*$settings*/ 4) {
    				set_style(div3, "background-color", /*$settings*/ ctx[2].bgColor3);
    			}

    			if (!current || dirty & /*$settings*/ 4) {
    				set_style(div3, "color", /*$settings*/ ctx[2].fontColor1);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function checkInStorage(component) {
    	const favorites = localStorage.favorites;

    	// Returns true if pokemon is in localStorage / team
    	if (strToArr(favorites).some(item => item === component)) return true; else // Returns false if pokemon is not present
    	return false;
    }

    // Function to add / remove component from favourites
    function toggleFavourites(e, component) {
    	const favorites = localStorage.favorites;
    	let elem = e.srcElement;
    	elem.classList += "text-yellow-300";

    	if (strToArr(favorites).some(item => item === component)) {
    		localStorage.favorites = strToArr(favorites).filter(item => item !== component).toString();
    	} else // Add component if not present in favorites
    	{
    		const newFavorites = strToArr(localStorage.favorites);
    		newFavorites.push(component);
    		localStorage.favorites = newFavorites.toString();
    	}
    }

    // Helper function
    function strToArr(str) {
    	if (!str) return [];
    	return str.split(",");
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $settings;
    	validate_store(settings, "settings");
    	component_subscribe($$self, settings, $$value => $$invalidate(2, $settings = $$value));
    	let { title = "Title" } = $$props;
    	let { tooltip = "This is a shell component" } = $$props;
    	const writable_props = ["title", "tooltip"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Shell> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	const click_handler = e => toggleFavourites(e, title);

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("tooltip" in $$props) $$invalidate(1, tooltip = $$props.tooltip);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		settings,
    		title,
    		tooltip,
    		checkInStorage,
    		toggleFavourites,
    		strToArr,
    		localStorage,
    		$settings
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("tooltip" in $$props) $$invalidate(1, tooltip = $$props.tooltip);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, tooltip, $settings, $$scope, $$slots, click_handler];
    }

    class Shell extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { title: 0, tooltip: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Shell",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get title() {
    		throw new Error("<Shell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Shell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tooltip() {
    		throw new Error("<Shell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tooltip(value) {
    		throw new Error("<Shell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\Diagnostics\Netstat\Netstat.svelte generated by Svelte v3.19.1 */
    const file$6 = "src\\Components\\Diagnostics\\Netstat\\Netstat.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (27:16) {#if netstat}
    function create_if_block$1(ctx) {
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t5;
    	let th3;
    	let t7;
    	let tbody;
    	let each_value = /*netstat*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Type";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "Local IP";
    			t3 = space();
    			th2 = element("th");
    			th2.textContent = "Foriegn IP";
    			t5 = space();
    			th3 = element("th");
    			th3.textContent = "Status";
    			t7 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(th0, "scope", "col");
    			attr_dev(th0, "class", "text-sm font-medium px-5 py-1 svelte-1fd2ujq");
    			add_location(th0, file$6, 31, 24, 859);
    			attr_dev(th1, "scope", "col");
    			attr_dev(th1, "class", "text-sm font-medium px-5 py-1 svelte-1fd2ujq");
    			add_location(th1, file$6, 34, 24, 1002);
    			attr_dev(th2, "scope", "col");
    			attr_dev(th2, "class", "text-sm font-medium px-5 py-1 svelte-1fd2ujq");
    			add_location(th2, file$6, 37, 24, 1149);
    			attr_dev(th3, "scope", "col");
    			attr_dev(th3, "class", "text-sm font-medium px-5 py-1 svelte-1fd2ujq");
    			add_location(th3, file$6, 40, 24, 1298);
    			attr_dev(tr, "class", "svelte-1fd2ujq");
    			add_location(tr, file$6, 30, 22, 829);
    			attr_dev(thead, "class", "bg-gray border-b svelte-1fd2ujq");
    			add_location(thead, file$6, 29, 20, 773);
    			attr_dev(tbody, "class", "svelte-1fd2ujq");
    			add_location(tbody, file$6, 46, 20, 1500);
    			attr_dev(table, "class", " svelte-1fd2ujq");
    			add_location(table, file$6, 27, 18, 733);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t1);
    			append_dev(tr, th1);
    			append_dev(tr, t3);
    			append_dev(tr, th2);
    			append_dev(tr, t5);
    			append_dev(tr, th3);
    			append_dev(table, t7);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*netstat*/ 1) {
    				each_value = /*netstat*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(27:16) {#if netstat}",
    		ctx
    	});

    	return block;
    }

    // (49:22) {#each netstat as ns}
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*ns*/ ctx[2].proto + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*ns*/ ctx[2].localip + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*ns*/ ctx[2].foriegnip + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*ns*/ ctx[2].state + "";
    	let t6;
    	let t7;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			attr_dev(td0, "class", "px-5 py-1 whitespace-nowrap text-sm font-medium text-center svelte-1fd2ujq");
    			add_location(td0, file$6, 51, 24, 1635);
    			attr_dev(td1, "class", " px-5 py-1 text-sm font-light whitespace-nowrap text-center svelte-1fd2ujq");
    			add_location(td1, file$6, 54, 24, 1802);
    			attr_dev(td2, "class", " px-5 py-1 text-sm font-light whitespace-nowrap text-center svelte-1fd2ujq");
    			add_location(td2, file$6, 57, 24, 1971);
    			attr_dev(td3, "class", " px-5 py-1 text-sm font-light whitespace-nowrap text-center svelte-1fd2ujq");
    			add_location(td3, file$6, 60, 24, 2142);
    			attr_dev(tr, "class", "bg-gray border-b svelte-1fd2ujq");
    			add_location(tr, file$6, 50, 22, 1580);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*netstat*/ 1 && t0_value !== (t0_value = /*ns*/ ctx[2].proto + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*netstat*/ 1 && t2_value !== (t2_value = /*ns*/ ctx[2].localip + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*netstat*/ 1 && t4_value !== (t4_value = /*ns*/ ctx[2].foriegnip + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*netstat*/ 1 && t6_value !== (t6_value = /*ns*/ ctx[2].state + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(49:22) {#each netstat as ns}",
    		ctx
    	});

    	return block;
    }

    // (20:0) <Shell title={"Netstat"} tooltip={"List all current connections"}>
    function create_default_slot(ctx) {
    	let div4;
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let if_block = /*netstat*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "py-1 inline-block min-w-full sm:px-6 lg:px-8 svelte-1fd2ujq");
    			add_location(div0, file$6, 25, 14, 624);
    			attr_dev(div1, "class", "overflow-auto sm:-mx-6 lg:-mx-8 svelte-1fd2ujq");
    			add_location(div1, file$6, 24, 12, 563);
    			attr_dev(div2, "class", "flex flex-col svelte-1fd2ujq");
    			add_location(div2, file$6, 23, 12, 522);
    			attr_dev(div3, "class", "h-64 overflow-x-hidden svelte-1fd2ujq");
    			add_location(div3, file$6, 21, 8, 468);
    			attr_dev(div4, "class", "text-gray-50 svelte-1fd2ujq");
    			add_location(div4, file$6, 20, 4, 432);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			if (if_block) if_block.m(div0, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*netstat*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(20:0) <Shell title={\\\"Netstat\\\"} tooltip={\\\"List all current connections\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "Netstat",
    				tooltip: "List all current connections",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope, netstat*/ 33) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let netstat;
    	ipcRenderer.send("get-netstat-info");

    	ipcRenderer.on("get-netstat-info", (e, netstatInfo) => {
    		$$invalidate(0, netstat = netstatInfo);
    		console.log(netstat);
    	});

    	$$self.$capture_state = () => ({
    		Shell,
    		ipcRenderer,
    		netstat,
    		require,
    		console
    	});

    	$$self.$inject_state = $$props => {
    		if ("netstat" in $$props) $$invalidate(0, netstat = $$props.netstat);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [netstat];
    }

    class Netstat extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Netstat",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\Components\Misc\Loader.svelte generated by Svelte v3.19.1 */

    const file$7 = "src\\Components\\Misc\\Loader.svelte";

    function create_fragment$8(ctx) {
    	let div5;
    	let div4;
    	let div0;
    	let div1;
    	let div2;
    	let div3;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			div1 = element("div");
    			div2 = element("div");
    			div3 = element("div");
    			attr_dev(div0, "class", "svelte-181yq40");
    			add_location(div0, file$7, 61, 28, 1084);
    			attr_dev(div1, "class", "svelte-181yq40");
    			add_location(div1, file$7, 61, 39, 1095);
    			attr_dev(div2, "class", "svelte-181yq40");
    			add_location(div2, file$7, 61, 50, 1106);
    			attr_dev(div3, "class", "svelte-181yq40");
    			add_location(div3, file$7, 61, 61, 1117);
    			attr_dev(div4, "class", "lds-ellipsis svelte-181yq40");
    			add_location(div4, file$7, 61, 2, 1058);
    			add_location(div5, file$7, 60, 0, 1049);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div4, div1);
    			append_dev(div4, div2);
    			append_dev(div4, div3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Loader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Loader",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    const fs = require('fs');

    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    let fName = new Date();
    let day = days[fName.getDay()];
    let month = months[fName.getMonth()];
    let year = fName.getFullYear();



    const fileStamp = `${day}_${month}_${year}`;

    const Markers ={
      INFO:'[INFO]:',
      WARN:'[WARN]:',
    };
    Object.freeze(Markers);

    //Reserved for Library
    const Header={
      MSG:'[MESSAGE]:',
      ERR:'[ERROR]:'
    };
    Object.freeze(Header);


    function logToText(params){

      let currMark='';
      let content;
      let timeStamp = new Date();
      let hours = timeStamp.getHours();
      let minutes = timeStamp.getMinutes();
      let seconds = timeStamp.getSeconds();

      switch(params.mark){
        case 'info':
          currMark = Markers.INFO;
          break;
        case 'warn':
          currMark = Markers.WARN;
          break;
        default:
          if(!params.quiet) console.log(`${Header.ERR}No Valid Marker Specified,Logger Quitting`);
          return;
      }


      content = `[${hours}:${minutes}:${seconds}]:${currMark} ${params.content}\n`;

      let stream = fs.createWriteStream(params.path, {flags:'a'});
      stream.write(content);
      stream.end();


      if(!params.quiet) console.log(`${Header.MSG}Logged to File`);
    }


    function logSimple(path,content){
      let wstream = fs.createWriteStream(path, {flags:'w'});
      wstream.write(content);
      wstream.end();
    }

    //logToText({path:'test.txt',content:"HELLO",mark:'info'},false);

    /* src\Components\Diagnostics\NetworkSpeed\NetworkSpeed.svelte generated by Svelte v3.19.1 */

    const file$8 = "src\\Components\\Diagnostics\\NetworkSpeed\\NetworkSpeed.svelte";

    // (59:14) {:else}
    function create_else_block_1(ctx) {
    	let button;
    	let t1;
    	let div2;
    	let div0;
    	let span0;
    	let t3;
    	let p0;
    	let t5;
    	let div1;
    	let span1;
    	let t7;
    	let p1;
    	let div2_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Start Test";
    			t1 = space();
    			div2 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "Speed";
    			t3 = space();
    			p0 = element("p");
    			p0.textContent = "N/A Mbps";
    			t5 = space();
    			div1 = element("div");
    			span1 = element("span");
    			span1.textContent = "Time";
    			t7 = space();
    			p1 = element("p");
    			p1.textContent = "N/A s";
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-semibold hover:bg-purple-600");
    			add_location(button, file$8, 59, 16, 1761);
    			add_location(span0, file$8, 63, 20, 2131);
    			attr_dev(p0, "class", "font-semibold text-xl");
    			add_location(p0, file$8, 64, 20, 2171);
    			attr_dev(div0, "class", "flex flex-col justify-start items-center");
    			add_location(div0, file$8, 62, 18, 2055);
    			add_location(span1, file$8, 69, 20, 2384);
    			attr_dev(p1, "class", "font-semibold text-xl");
    			add_location(p1, file$8, 70, 20, 2423);
    			attr_dev(div1, "class", "flex flex-col justify-start items-center");
    			add_location(div1, file$8, 68, 18, 2308);

    			attr_dev(div2, "class", div2_class_value = "grid grid-cols-2 gap-x-2 mt-2 " + (/*networkSpeed*/ ctx[0] && !/*networkSpeed*/ ctx[0].err
    			? "invisble"
    			: ""));

    			add_location(div2, file$8, 61, 16, 1937);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, span0);
    			append_dev(div0, t3);
    			append_dev(div0, p0);
    			append_dev(div2, t5);
    			append_dev(div2, div1);
    			append_dev(div1, span1);
    			append_dev(div1, t7);
    			append_dev(div1, p1);
    			dispose = listen_dev(button, "click", /*startTest*/ ctx[2], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*networkSpeed*/ 1 && div2_class_value !== (div2_class_value = "grid grid-cols-2 gap-x-2 mt-2 " + (/*networkSpeed*/ ctx[0] && !/*networkSpeed*/ ctx[0].err
    			? "invisble"
    			: ""))) {
    				attr_dev(div2, "class", div2_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(59:14) {:else}",
    		ctx
    	});

    	return block;
    }

    // (56:12) {#if started}
    function create_if_block_2(ctx) {
    	let current;
    	const loader = new Loader({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(loader.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(loader, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(loader, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(56:12) {#if started}",
    		ctx
    	});

    	return block;
    }

    // (80:8) {#if networkSpeed}
    function create_if_block$2(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (!/*networkSpeed*/ ctx[0].err) return create_if_block_1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(80:8) {#if networkSpeed}",
    		ctx
    	});

    	return block;
    }

    // (96:12) {:else}
    function create_else_block$1(ctx) {
    	let div1;
    	let div0;
    	let p;
    	let t_value = /*networkSpeed*/ ctx[0].err + "";
    	let t;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "text-white font-medium text-lg text-xl");
    			add_location(p, file$8, 99, 18, 3485);
    			attr_dev(div0, "class", "flex flex-col items-center text-gray-50 p-4");
    			add_location(div0, file$8, 98, 18, 3408);
    			attr_dev(div1, "class", "flex flex-row justify-center mt-1");
    			add_location(div1, file$8, 96, 14, 3338);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*networkSpeed*/ 1 && t_value !== (t_value = /*networkSpeed*/ ctx[0].err + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(96:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (81:10) {#if !networkSpeed.err}
    function create_if_block_1(ctx) {
    	let div2;
    	let div0;
    	let span0;
    	let t1;
    	let p0;
    	let t2_value = /*networkSpeed*/ ctx[0].downloadSpeed + "";
    	let t2;
    	let t3;
    	let t4;
    	let div1;
    	let span1;
    	let t6;
    	let p1;
    	let t7_value = /*networkSpeed*/ ctx[0].totalTime + "";
    	let t7;
    	let t8;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "Speed";
    			t1 = space();
    			p0 = element("p");
    			t2 = text(t2_value);
    			t3 = text(" Mbps");
    			t4 = space();
    			div1 = element("div");
    			span1 = element("span");
    			span1.textContent = "Time";
    			t6 = space();
    			p1 = element("p");
    			t7 = text(t7_value);
    			t8 = text(" s");
    			add_location(span0, file$8, 83, 14, 2891);
    			attr_dev(p0, "class", "font-semibold text-xl");
    			add_location(p0, file$8, 84, 14, 2925);
    			attr_dev(div0, "class", "flex flex-col justify-start items-center");
    			add_location(div0, file$8, 82, 12, 2821);
    			add_location(span1, file$8, 89, 14, 3133);
    			attr_dev(p1, "class", "font-semibold text-xl");
    			add_location(p1, file$8, 90, 14, 3166);
    			attr_dev(div1, "class", "flex flex-col justify-start items-center");
    			add_location(div1, file$8, 88, 12, 3063);
    			attr_dev(div2, "class", "grid grid-cols-2 gap-x-2 mt-2");
    			add_location(div2, file$8, 81, 10, 2763);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, span0);
    			append_dev(div0, t1);
    			append_dev(div0, p0);
    			append_dev(p0, t2);
    			append_dev(p0, t3);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, span1);
    			append_dev(div1, t6);
    			append_dev(div1, p1);
    			append_dev(p1, t7);
    			append_dev(p1, t8);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*networkSpeed*/ 1 && t2_value !== (t2_value = /*networkSpeed*/ ctx[0].downloadSpeed + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*networkSpeed*/ 1 && t7_value !== (t7_value = /*networkSpeed*/ ctx[0].totalTime + "")) set_data_dev(t7, t7_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(81:10) {#if !networkSpeed.err}",
    		ctx
    	});

    	return block;
    }

    // (53:0) <Shell title={"Network Speed"} tooltip={"List network speed"}>
    function create_default_slot$1(ctx) {
    	let div1;
    	let div0;
    	let current_block_type_index;
    	let if_block0;
    	let t;
    	let current;
    	const if_block_creators = [create_if_block_2, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*started*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = /*networkSpeed*/ ctx[0] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "flex flex-col justify-center items-center ");
    			add_location(div0, file$8, 54, 8, 1531);
    			attr_dev(div1, "class", "flex flex-col justify-center mt-1 text-gray-50");
    			add_location(div1, file$8, 53, 4, 1461);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if_blocks[current_block_type_index].m(div0, null);
    			append_dev(div1, t);
    			if (if_block1) if_block1.m(div1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(div0, null);
    			}

    			if (/*networkSpeed*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_blocks[current_block_type_index].d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(53:0) <Shell title={\\\"Network Speed\\\"} tooltip={\\\"List network speed\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "Network Speed",
    				tooltip: "List network speed",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope, networkSpeed, started*/ 35) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let networkSpeed;
    	let started = false;
    	let err = false;

    	const startTest = () => {
    		ipcRenderer.send("get-network-speed");
    		$$invalidate(1, started = true);
    	};

    	ipcRenderer.on("get-network-speed", (e, speedInfo) => {
    		$$invalidate(0, networkSpeed = speedInfo);

    		if (networkSpeed == null) {
    			err = true;
    		}

    		console.log(networkSpeed);
    		$$invalidate(1, started = false);

    		if (!networkSpeed.err) {
    			logSimple("./logs/api_logs/NetSpeedLog.txt", "" + networkSpeed.downloadSpeed);
    			logSimple("./logs/api_logs/ispLog.txt", "" + networkSpeed.client.isp);
    			logSimple("./logs/api_logs/testServerLocationLog.txt", "" + networkSpeed.server.city);

    			//logSimple('./logs/raw_logs/NetSpeedLog.txt',''+networkSpeed.downloadSpeed);
    			logToText({
    				path: `./logs/clean_logs/NETSPEED_${fileStamp}.txt`,
    				content: `Test Time:${networkSpeed.totalTime} s | Speed:${networkSpeed.downloadSpeed} mbps`,
    				mark: "info",
    				quiet: false
    			});
    		}
    	});

    	$$self.$capture_state = () => ({
    		Shell,
    		Loader,
    		ipcRenderer,
    		logToText,
    		logSimple,
    		fileStamp,
    		networkSpeed,
    		started,
    		err,
    		startTest,
    		require,
    		console
    	});

    	$$self.$inject_state = $$props => {
    		if ("networkSpeed" in $$props) $$invalidate(0, networkSpeed = $$props.networkSpeed);
    		if ("started" in $$props) $$invalidate(1, started = $$props.started);
    		if ("err" in $$props) err = $$props.err;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [networkSpeed, started, startTest];
    }

    class NetworkSpeed extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NetworkSpeed",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\Components\Diagnostics\PasswordStrength\PasswordStrength.svelte generated by Svelte v3.19.1 */
    const file$9 = "src\\Components\\Diagnostics\\PasswordStrength\\PasswordStrength.svelte";

    // (50:0) <Shell title={"Password Checker"} tooltip={"Get detailed analysis of passwords"}>
    function create_default_slot$2(ctx) {
    	let div4;
    	let div0;
    	let input;
    	let input_maxlength_value;
    	let t0;
    	let div3;
    	let div1;
    	let span0;
    	let t2;
    	let p0;
    	let t3;
    	let t4;
    	let p0_class_value;
    	let t5;
    	let div2;
    	let span1;
    	let t7;
    	let p1;
    	let t8_value = /*password*/ ctx[0].length + "";
    	let t8;
    	let t9;
    	let p1_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			div3 = element("div");
    			div1 = element("div");
    			span0 = element("span");
    			span0.textContent = "Strength";
    			t2 = space();
    			p0 = element("p");
    			t3 = text(/*strength*/ ctx[1]);
    			t4 = text(" %");
    			t5 = space();
    			div2 = element("div");
    			span1 = element("span");
    			span1.textContent = "Length";
    			t7 = space();
    			p1 = element("p");
    			t8 = text(t8_value);
    			t9 = text(" s");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Enter Password");
    			attr_dev(input, "class", "w-full rounded-md m-2 px-1 text-gray-800 font-semibold");
    			input.required = true;
    			attr_dev(input, "maxlength", input_maxlength_value = 32);
    			add_location(input, file$9, 52, 10, 2010);
    			attr_dev(div0, "class", "flex flex-row");
    			add_location(div0, file$9, 51, 8, 1971);
    			add_location(span0, file$9, 66, 14, 2500);
    			attr_dev(p0, "class", p0_class_value = "font-semibold text-xl " + /*strengthColor*/ ctx[2]);
    			add_location(p0, file$9, 67, 14, 2537);
    			attr_dev(div1, "class", "flex flex-col justify-start items-center");
    			add_location(div1, file$9, 65, 12, 2430);
    			add_location(span1, file$9, 72, 14, 2740);
    			attr_dev(p1, "class", p1_class_value = "font-semibold text-xl " + /*lengthColor*/ ctx[3]);
    			add_location(p1, file$9, 73, 14, 2775);
    			attr_dev(div2, "class", "flex flex-col justify-start items-center");
    			add_location(div2, file$9, 71, 12, 2670);
    			attr_dev(div3, "class", "grid grid-cols-2 gap-x-2 mt-2");
    			add_location(div3, file$9, 63, 8, 2331);
    			attr_dev(div4, "class", "text-gray-50");
    			add_location(div4, file$9, 50, 4, 1935);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*password*/ ctx[0]);
    			append_dev(div4, t0);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, span0);
    			append_dev(div1, t2);
    			append_dev(div1, p0);
    			append_dev(p0, t3);
    			append_dev(p0, t4);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, span1);
    			append_dev(div2, t7);
    			append_dev(div2, p1);
    			append_dev(p1, t8);
    			append_dev(p1, t9);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    				listen_dev(input, "keyup", /*checkPassword*/ ctx[4], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*password*/ 1 && input.value !== /*password*/ ctx[0]) {
    				set_input_value(input, /*password*/ ctx[0]);
    			}

    			if (dirty & /*strength*/ 2) set_data_dev(t3, /*strength*/ ctx[1]);

    			if (dirty & /*strengthColor*/ 4 && p0_class_value !== (p0_class_value = "font-semibold text-xl " + /*strengthColor*/ ctx[2])) {
    				attr_dev(p0, "class", p0_class_value);
    			}

    			if (dirty & /*password*/ 1 && t8_value !== (t8_value = /*password*/ ctx[0].length + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*lengthColor*/ 8 && p1_class_value !== (p1_class_value = "font-semibold text-xl " + /*lengthColor*/ ctx[3])) {
    				attr_dev(p1, "class", p1_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(50:0) <Shell title={\\\"Password Checker\\\"} tooltip={\\\"Get detailed analysis of passwords\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "Password Checker",
    				tooltip: "Get detailed analysis of passwords",
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope, lengthColor, password, strengthColor, strength*/ 271) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let password = "", strength = 0, length = 0;
    	let strengthColor = "text-gray-200";
    	let lengthColor = "text-gray-200";

    	const specialCharacters = [
    		"!",
    		"@",
    		"#",
    		"$",
    		"%",
    		"^",
    		"&",
    		"*",
    		"(",
    		")",
    		"{",
    		"}",
    		"[",
    		"]",
    		";",
    		":",
    		"'",
    		"\"",
    		"\\",
    		"|",
    		",",
    		".",
    		"<",
    		">",
    		"?",
    		"/"
    	];

    	const checkPassword = () => {
    		// test for length
    		if (password.length <= 4) (length = 25, $$invalidate(3, lengthColor = "text-red-600")); else if (password.length <= 6) (length = 50, $$invalidate(3, lengthColor = "text-yellow-600")); else if (password.length <= 8) (length = 75, $$invalidate(3, lengthColor = "text-yellow-300")); else (length = 100, $$invalidate(3, lengthColor = "text-green-600"));

    		// test for strength
    		$$invalidate(1, strength = 0);

    		// test for lowercase
    		if ((/[a-z]+/g).test(password)) $$invalidate(1, strength += 1);

    		// test for uppercase
    		if ((/[A-Z]+/g).test(password)) $$invalidate(1, strength += 1);

    		// test for numbers
    		if ((/[0-9]+/g).test(password)) $$invalidate(1, strength += 1);

    		// test for specialCharacters
    		if (specialCharacters.some(item => password.includes(item))) $$invalidate(1, strength += 1);

    		switch (strength) {
    			case 0:
    				$$invalidate(1, strength = 0);
    				$$invalidate(2, strengthColor = "text-red-600");
    				break;
    			case 1:
    				$$invalidate(1, strength = 25);
    				$$invalidate(2, strengthColor = "text-red-600");
    				break;
    			case 2:
    				$$invalidate(1, strength = 50);
    				$$invalidate(2, strengthColor = "text-yellow-600");
    				break;
    			case 3:
    				$$invalidate(1, strength = 75);
    				$$invalidate(2, strengthColor = "text-yellow-400");
    				break;
    			case 4:
    				$$invalidate(1, strength = 100);
    				$$invalidate(2, strengthColor = "text-green-600");
    				break;
    		}
    	};

    	function input_input_handler() {
    		password = this.value;
    		$$invalidate(0, password);
    	}

    	$$self.$capture_state = () => ({
    		Shell,
    		password,
    		strength,
    		length,
    		strengthColor,
    		lengthColor,
    		specialCharacters,
    		checkPassword
    	});

    	$$self.$inject_state = $$props => {
    		if ("password" in $$props) $$invalidate(0, password = $$props.password);
    		if ("strength" in $$props) $$invalidate(1, strength = $$props.strength);
    		if ("length" in $$props) length = $$props.length;
    		if ("strengthColor" in $$props) $$invalidate(2, strengthColor = $$props.strengthColor);
    		if ("lengthColor" in $$props) $$invalidate(3, lengthColor = $$props.lengthColor);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		password,
    		strength,
    		strengthColor,
    		lengthColor,
    		checkPassword,
    		length,
    		specialCharacters,
    		input_input_handler
    	];
    }

    class PasswordStrength extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PasswordStrength",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\Components\Diagnostics\SslChecker\SslChecker.svelte generated by Svelte v3.19.1 */
    const file$a = "src\\Components\\Diagnostics\\SslChecker\\SslChecker.svelte";

    // (41:12) {:else}
    function create_else_block_1$1(ctx) {
    	let p0;
    	let t1;
    	let span0;
    	let t3;
    	let p1;
    	let t5;
    	let span1;
    	let t7;
    	let p2;
    	let t9;
    	let span2;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "• Days Left";
    			t1 = space();
    			span0 = element("span");
    			span0.textContent = "N/A";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "• Valid From";
    			t5 = space();
    			span1 = element("span");
    			span1.textContent = "N/A";
    			t7 = space();
    			p2 = element("p");
    			p2.textContent = "• Valid To";
    			t9 = space();
    			span2 = element("span");
    			span2.textContent = "N/A";
    			attr_dev(p0, "class", "pt-2");
    			add_location(p0, file$a, 41, 14, 1774);
    			attr_dev(span0, "class", "ml-4 font-semibold text-lg");
    			add_location(span0, file$a, 42, 16, 1829);
    			attr_dev(p1, "class", "");
    			add_location(p1, file$a, 43, 14, 1896);
    			attr_dev(span1, "class", "ml-4 font-semibold text-lg");
    			add_location(span1, file$a, 44, 16, 1948);
    			attr_dev(p2, "class", "");
    			add_location(p2, file$a, 45, 14, 2015);
    			attr_dev(span2, "class", "ml-4 font-semibold text-lg");
    			add_location(span2, file$a, 46, 16, 2065);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, span1, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, span2, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(span2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(41:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (30:12) {#if ssl}
    function create_if_block$3(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (!/*ssl*/ ctx[0].err) return create_if_block_1$1;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(30:12) {#if ssl}",
    		ctx
    	});

    	return block;
    }

    // (38:16) {:else}
    function create_else_block$2(ctx) {
    	let p;
    	let span;

    	const block = {
    		c: function create() {
    			p = element("p");
    			span = element("span");
    			span.textContent = "Error: SSL certificate couldn't be found";
    			attr_dev(span, "class", "font-semibold text-lg");
    			add_location(span, file$a, 38, 23, 1627);
    			add_location(p, file$a, 38, 20, 1624);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, span);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(38:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (31:16) {#if !ssl.err}
    function create_if_block_1$1(ctx) {
    	let p0;
    	let t1;
    	let span0;
    	let t2_value = /*ssl*/ ctx[0].daysRemaining + "";
    	let t2;
    	let t3;
    	let p1;
    	let t5;
    	let span1;
    	let t6_value = /*ssl*/ ctx[0].validFrom.substring(0, 10) + "";
    	let t6;
    	let t7;
    	let p2;
    	let t9;
    	let span2;
    	let t10_value = /*ssl*/ ctx[0].validTo.substring(0, 10) + "";
    	let t10;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "• Days Left";
    			t1 = space();
    			span0 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "• Valid From";
    			t5 = space();
    			span1 = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			p2 = element("p");
    			p2.textContent = "• Valid To";
    			t9 = space();
    			span2 = element("span");
    			t10 = text(t10_value);
    			attr_dev(p0, "class", "pt-2 ");
    			add_location(p0, file$a, 31, 20, 1132);
    			attr_dev(span0, "class", "ml-4 font-semibold text-lg");
    			add_location(span0, file$a, 32, 22, 1194);
    			attr_dev(p1, "class", "");
    			add_location(p1, file$a, 33, 20, 1283);
    			attr_dev(span1, "class", "ml-4 font-semibold text-lg");
    			add_location(span1, file$a, 34, 22, 1341);
    			attr_dev(p2, "class", "");
    			add_location(p2, file$a, 35, 20, 1443);
    			attr_dev(span2, "class", "ml-4 font-semibold text-lg");
    			add_location(span2, file$a, 36, 22, 1499);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span0, anchor);
    			append_dev(span0, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, span1, anchor);
    			append_dev(span1, t6);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, span2, anchor);
    			append_dev(span2, t10);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ssl*/ 1 && t2_value !== (t2_value = /*ssl*/ ctx[0].daysRemaining + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*ssl*/ 1 && t6_value !== (t6_value = /*ssl*/ ctx[0].validFrom.substring(0, 10) + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*ssl*/ 1 && t10_value !== (t10_value = /*ssl*/ ctx[0].validTo.substring(0, 10) + "")) set_data_dev(t10, t10_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(span2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(31:16) {#if !ssl.err}",
    		ctx
    	});

    	return block;
    }

    // (21:0) <Shell title={"SSL Checker"} tooltip={"SSL Certificate checker"}>
    function create_default_slot$3(ctx) {
    	let div2;
    	let div0;
    	let input;
    	let t0;
    	let button;
    	let t2;
    	let div1;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*ssl*/ ctx[0]) return create_if_block$3;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			button.textContent = "Search";
    			t2 = space();
    			div1 = element("div");
    			if_block.c();
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Enter Domain Name");
    			attr_dev(input, "class", "w-10/12 rounded-md m-2 px-1 text-gray-800 font-semibold");
    			add_location(input, file$a, 23, 12, 546);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-semibold hover:bg-purple-600");
    			add_location(button, file$a, 24, 12, 693);
    			attr_dev(div0, "class", "flex flex-row");
    			add_location(div0, file$a, 22, 8, 505);
    			add_location(div1, file$a, 28, 8, 1050);
    			attr_dev(div2, "class", "text-gray-50");
    			add_location(div2, file$a, 21, 4, 469);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*host*/ ctx[1]);
    			append_dev(div0, t0);
    			append_dev(div0, button);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			if_block.m(div1, null);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    				listen_dev(button, "click", /*getSslInfo*/ ctx[2], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*host*/ 2 && input.value !== /*host*/ ctx[1]) {
    				set_input_value(input, /*host*/ ctx[1]);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_block.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(21:0) <Shell title={\\\"SSL Checker\\\"} tooltip={\\\"SSL Certificate checker\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "SSL Checker",
    				tooltip: "SSL Certificate checker",
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope, ssl, host*/ 35) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let ssl, host = "";

    	const getSslInfo = () => {
    		ipcRenderer.send("get-ssl-info", host);

    		ipcRenderer.on("get-ssl-info", (e, sslInfo) => {
    			$$invalidate(0, ssl = sslInfo);
    		});
    	}; // host = '';

    	function input_input_handler() {
    		host = this.value;
    		$$invalidate(1, host);
    	}

    	$$self.$capture_state = () => ({
    		Shell,
    		ipcRenderer,
    		ssl,
    		host,
    		getSslInfo,
    		require
    	});

    	$$self.$inject_state = $$props => {
    		if ("ssl" in $$props) $$invalidate(0, ssl = $$props.ssl);
    		if ("host" in $$props) $$invalidate(1, host = $$props.host);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [ssl, host, getSslInfo, ipcRenderer, input_input_handler];
    }

    class SslChecker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SslChecker",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\Components\Network\Dns\Dns.svelte generated by Svelte v3.19.1 */
    const file$b = "src\\Components\\Network\\Dns\\Dns.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (43:12) {:else}
    function create_else_block_1$2(ctx) {
    	let p0;
    	let t1;
    	let span0;
    	let t3;
    	let p1;
    	let t5;
    	let span1;
    	let t7;
    	let p2;
    	let t9;
    	let span2;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "• IP Address";
    			t1 = space();
    			span0 = element("span");
    			span0.textContent = "N/A";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "• Nameservers";
    			t5 = space();
    			span1 = element("span");
    			span1.textContent = "N/A";
    			t7 = space();
    			p2 = element("p");
    			p2.textContent = "• Mail Exchange";
    			t9 = space();
    			span2 = element("span");
    			span2.textContent = "N/A";
    			add_location(p0, file$b, 43, 12, 1671);
    			attr_dev(span0, "class", "ml-8 font-semibold text-lg");
    			add_location(span0, file$b, 44, 14, 1712);
    			add_location(p1, file$b, 45, 12, 1777);
    			attr_dev(span1, "class", "ml-8 font-semibold text-lg");
    			add_location(span1, file$b, 46, 14, 1819);
    			add_location(p2, file$b, 47, 12, 1884);
    			attr_dev(span2, "class", "ml-8 font-semibold text-lg");
    			add_location(span2, file$b, 48, 14, 1928);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, span1, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, span2, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(span2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$2.name,
    		type: "else",
    		source: "(43:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (28:12) {#if dns}
    function create_if_block$4(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (!/*dns*/ ctx[0].err) return create_if_block_1$2;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(28:12) {#if dns}",
    		ctx
    	});

    	return block;
    }

    // (40:16) {:else}
    function create_else_block$3(ctx) {
    	let p;
    	let span;

    	const block = {
    		c: function create() {
    			p = element("p");
    			span = element("span");
    			span.textContent = "Error: DNS couldn't be found";
    			attr_dev(span, "class", "font-semibold text-lg");
    			add_location(span, file$b, 40, 23, 1538);
    			add_location(p, file$b, 40, 20, 1535);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, span);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(40:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (29:16) {#if !dns.err}
    function create_if_block_1$2(ctx) {
    	let p0;
    	let t1;
    	let span;
    	let t2_value = /*dns*/ ctx[0].address + "";
    	let t2;
    	let t3;
    	let p1;
    	let t5;
    	let t6;
    	let p2;
    	let t8;
    	let each1_anchor;
    	let each_value_1 = /*dns*/ ctx[0].ns;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*dns*/ ctx[0].mx;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "• IP Address";
    			t1 = space();
    			span = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "• Nameservers";
    			t5 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t6 = space();
    			p2 = element("p");
    			p2.textContent = "• Mail Exchange";
    			t8 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each1_anchor = empty();
    			add_location(p0, file$b, 29, 20, 984);
    			attr_dev(span, "class", "ml-8 font-semibold text-lg");
    			add_location(span, file$b, 30, 22, 1033);
    			add_location(p1, file$b, 31, 20, 1116);
    			add_location(p2, file$b, 35, 20, 1312);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span, anchor);
    			append_dev(span, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t5, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(target, anchor);
    			}

    			insert_dev(target, t6, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t8, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*dns*/ 1 && t2_value !== (t2_value = /*dns*/ ctx[0].address + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*dns*/ 1) {
    				each_value_1 = /*dns*/ ctx[0].ns;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(t6.parentNode, t6);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*dns*/ 1) {
    				each_value = /*dns*/ ctx[0].mx;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each1_anchor.parentNode, each1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t8);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(29:16) {#if !dns.err}",
    		ctx
    	});

    	return block;
    }

    // (33:22) {#each dns.ns as ns }
    function create_each_block_1(ctx) {
    	let p;
    	let t_value = /*ns*/ ctx[8] + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "ml-8 font-semibold text-lg");
    			add_location(p, file$b, 33, 24, 1213);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*dns*/ 1 && t_value !== (t_value = /*ns*/ ctx[8] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(33:22) {#each dns.ns as ns }",
    		ctx
    	});

    	return block;
    }

    // (37:22) {#each dns.mx as mx }
    function create_each_block$1(ctx) {
    	let p;
    	let t_value = /*mx*/ ctx[5] + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "ml-8 font-semibold text-lg");
    			add_location(p, file$b, 37, 24, 1411);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*dns*/ 1 && t_value !== (t_value = /*mx*/ ctx[5] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(37:22) {#each dns.mx as mx }",
    		ctx
    	});

    	return block;
    }

    // (21:0) <Shell title={"DNS Lookup"} tooltip={"DNS Lookup Information"}>
    function create_default_slot$4(ctx) {
    	let div2;
    	let div0;
    	let input;
    	let t0;
    	let button;
    	let t2;
    	let div1;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*dns*/ ctx[0]) return create_if_block$4;
    		return create_else_block_1$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			button.textContent = "Search";
    			t2 = space();
    			div1 = element("div");
    			if_block.c();
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Enter Domain Name");
    			attr_dev(input, "class", "w-10/12 rounded-md m-2 px-1 text-gray-800 font-semibold");
    			add_location(input, file$b, 23, 8, 547);
    			attr_dev(button, "class", "text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-semibold hover:bg-purple-600");
    			attr_dev(button, "type", "button");
    			add_location(button, file$b, 24, 12, 687);
    			attr_dev(div0, "class", "flex flex-row");
    			add_location(div0, file$b, 22, 8, 510);
    			attr_dev(div1, "class", "mt-2 max-h-48 overflow-auto");
    			add_location(div1, file$b, 26, 8, 866);
    			attr_dev(div2, "class", "text-gray-50");
    			add_location(div2, file$b, 21, 4, 474);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*value*/ ctx[1]);
    			append_dev(div0, t0);
    			append_dev(div0, button);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			if_block.m(div1, null);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    				listen_dev(button, "click", /*getDnsInfo*/ ctx[2], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*value*/ 2 && input.value !== /*value*/ ctx[1]) {
    				set_input_value(input, /*value*/ ctx[1]);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_block.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(21:0) <Shell title={\\\"DNS Lookup\\\"} tooltip={\\\"DNS Lookup Information\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "DNS Lookup",
    				tooltip: "DNS Lookup Information",
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope, dns, value*/ 2051) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let dns, value = "";

    	const getDnsInfo = () => {
    		ipcRenderer.send("get-dns-lookup", value);

    		ipcRenderer.on("get-dns-lookup", (e, dnsInfo) => {
    			$$invalidate(0, dns = dnsInfo);
    		});
    	}; // value = '';

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(1, value);
    	}

    	$$self.$capture_state = () => ({
    		Shell,
    		ipcRenderer,
    		dns,
    		value,
    		getDnsInfo,
    		require
    	});

    	$$self.$inject_state = $$props => {
    		if ("dns" in $$props) $$invalidate(0, dns = $$props.dns);
    		if ("value" in $$props) $$invalidate(1, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [dns, value, getDnsInfo, ipcRenderer, input_input_handler];
    }

    class Dns extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dns",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\Components\Network\IPTools\IPTools.svelte generated by Svelte v3.19.1 */
    const file$c = "src\\Components\\Network\\IPTools\\IPTools.svelte";

    // (34:4) {:else}
    function create_else_block$4(ctx) {
    	let p0;
    	let t1;
    	let span0;
    	let t3;
    	let p1;
    	let t5;
    	let span1;
    	let t7;
    	let p2;
    	let t9;
    	let span2;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "• Registrar URL";
    			t1 = space();
    			span0 = element("span");
    			span0.textContent = "N/A";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "• Region";
    			t5 = space();
    			span1 = element("span");
    			span1.textContent = "N/A , N/A";
    			t7 = space();
    			p2 = element("p");
    			p2.textContent = "• Domain Expiry On";
    			t9 = space();
    			span2 = element("span");
    			span2.textContent = "N/A";
    			add_location(p0, file$c, 34, 4, 1266);
    			attr_dev(span0, "class", "ml-6 font-semibold text-lg");
    			add_location(span0, file$c, 35, 4, 1300);
    			add_location(p1, file$c, 36, 4, 1357);
    			attr_dev(span1, "class", "ml-6 font-semibold text-lg");
    			add_location(span1, file$c, 37, 4, 1384);
    			add_location(p2, file$c, 38, 4, 1447);
    			attr_dev(span2, "class", "ml-6 font-semibold text-lg");
    			add_location(span2, file$c, 39, 4, 1484);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, span1, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, span2, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(span2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(34:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (26:4) {#if geo}
    function create_if_block$5(ctx) {
    	let p0;
    	let t1;
    	let span0;
    	let t2_value = /*geo*/ ctx[0].country + "";
    	let t2;
    	let t3;
    	let p1;
    	let t5;
    	let span1;
    	let t6_value = /*geo*/ ctx[0].city + "";
    	let t6;
    	let t7;
    	let p2;
    	let t9;
    	let span2;
    	let t10_value = /*geo*/ ctx[0].isp + "";
    	let t10;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "◆ Country";
    			t1 = space();
    			span0 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "◆ Region";
    			t5 = space();
    			span1 = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			p2 = element("p");
    			p2.textContent = "◆ ISP/ORG";
    			t9 = space();
    			span2 = element("span");
    			t10 = text(t10_value);
    			add_location(p0, file$c, 26, 8, 956);
    			attr_dev(span0, "class", "ml-6 font-semibold text-lg");
    			add_location(span0, file$c, 27, 8, 987);
    			add_location(p1, file$c, 28, 8, 1058);
    			attr_dev(span1, "class", "ml-6 font-semibold text-lg");
    			add_location(span1, file$c, 29, 8, 1088);
    			add_location(p2, file$c, 30, 8, 1156);
    			attr_dev(span2, "class", "ml-6 font-semibold text-lg");
    			add_location(span2, file$c, 31, 9, 1188);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span0, anchor);
    			append_dev(span0, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, span1, anchor);
    			append_dev(span1, t6);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, span2, anchor);
    			append_dev(span2, t10);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*geo*/ 1 && t2_value !== (t2_value = /*geo*/ ctx[0].country + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*geo*/ 1 && t6_value !== (t6_value = /*geo*/ ctx[0].city + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*geo*/ 1 && t10_value !== (t10_value = /*geo*/ ctx[0].isp + "")) set_data_dev(t10, t10_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(span2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(26:4) {#if geo}",
    		ctx
    	});

    	return block;
    }

    // (19:0) <Shell title={"IP Lookup"} tooltip={"Get Details about an IP Address"}>
    function create_default_slot$5(ctx) {
    	let div2;
    	let div0;
    	let input;
    	let t0;
    	let button;
    	let t2;
    	let div1;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*geo*/ ctx[0]) return create_if_block$5;
    		return create_else_block$4;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			button.textContent = "Lookup";
    			t2 = space();
    			div1 = element("div");
    			if_block.c();
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Enter IP");
    			attr_dev(input, "class", "w-10/12 rounded-md m-2 px-1 text-gray-800 font-semibold");
    			add_location(input, file$c, 21, 4, 579);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-semibold hover:bg-purple-600");
    			add_location(button, file$c, 22, 4, 707);
    			attr_dev(div0, "class", "flex flex-row justify-start");
    			add_location(div0, file$c, 20, 4, 532);
    			attr_dev(div1, "class", "flex flex-col items-start text-gray-50");
    			add_location(div1, file$c, 24, 4, 879);
    			attr_dev(div2, "class", "flex flex-col");
    			add_location(div2, file$c, 19, 2, 499);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*ip*/ ctx[1]);
    			append_dev(div0, t0);
    			append_dev(div0, button);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			if_block.m(div1, null);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    				listen_dev(button, "click", /*startLookup*/ ctx[2], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ip*/ 2 && input.value !== /*ip*/ ctx[1]) {
    				set_input_value(input, /*ip*/ ctx[1]);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_block.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(19:0) <Shell title={\\\"IP Lookup\\\"} tooltip={\\\"Get Details about an IP Address\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "IP Lookup",
    				tooltip: "Get Details about an IP Address",
    				$$slots: { default: [create_default_slot$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope, geo, ip*/ 35) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let geo, ip;

    	//ipcRenderer.send('get-whois-info');
    	const startLookup = () => {
    		//console.log("test");
    		ipcRenderer.send("get-geo-info", ip);

    		ipcRenderer.on("get-geo-info", (e, geoInfo) => {
    			$$invalidate(0, geo = geoInfo);
    			console.log(geo);
    		});
    	};

    	function input_input_handler() {
    		ip = this.value;
    		$$invalidate(1, ip);
    	}

    	$$self.$capture_state = () => ({
    		ipcRenderer,
    		Shell,
    		geo,
    		ip,
    		startLookup,
    		require,
    		console
    	});

    	$$self.$inject_state = $$props => {
    		if ("geo" in $$props) $$invalidate(0, geo = $$props.geo);
    		if ("ip" in $$props) $$invalidate(1, ip = $$props.ip);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [geo, ip, startLookup, ipcRenderer, input_input_handler];
    }

    class IPTools extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IPTools",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\Components\Network\NetworkInterfaces\NetworkInterfaces.svelte generated by Svelte v3.19.1 */
    const file$d = "src\\Components\\Network\\NetworkInterfaces\\NetworkInterfaces.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i].iface;
    	child_ctx[4] = list[i].ip4;
    	child_ctx[5] = list[i].mac;
    	child_ctx[6] = list[i].isDHCP;
    	child_ctx[7] = list[i].isInternal;
    	child_ctx[9] = i;
    	return child_ctx;
    }

    // (50:4) {:else}
    function create_else_block_3(ctx) {
    	let div;
    	let current;
    	const loader = new Loader({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(loader.$$.fragment);
    			attr_dev(div, "class", "flex flex-row justify-center svelte-5avmh9");
    			add_location(div, file$d, 50, 6, 2061);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(loader, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(loader);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(50:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (25:4) {#if interfaces}
    function create_if_block$6(ctx) {
    	let p;
    	let t0;
    	let span;
    	let t1;
    	let t2;
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*interfaces*/ ctx[0].length > 0) return create_if_block_1$3;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("• Current Public IP: ");
    			span = element("span");
    			t1 = text(/*pIp*/ ctx[1]);
    			t2 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			attr_dev(span, "class", "font-semibold text-lg text-purple-400 svelte-5avmh9");
    			add_location(span, file$d, 25, 66, 748);
    			attr_dev(p, "class", "font-semibold text-lg svelte-5avmh9");
    			add_location(p, file$d, 25, 6, 688);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, span);
    			append_dev(span, t1);
    			insert_dev(target, t2, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pIp*/ 2) set_data_dev(t1, /*pIp*/ ctx[1]);

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t2);
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(25:4) {#if interfaces}",
    		ctx
    	});

    	return block;
    }

    // (47:8) {:else}
    function create_else_block_2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Couldn't find any interfaces.";
    			attr_dev(p, "class", "svelte-5avmh9");
    			add_location(p, file$d, 47, 12, 1989);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(47:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (27:8) {#if interfaces.length > 0}
    function create_if_block_1$3(ctx) {
    	let if_block_anchor;

    	function select_block_type_2(ctx, dirty) {
    		if (/*interfaces*/ ctx[0].length > 1) return create_if_block_2$1;
    		return create_else_block_1$3;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(27:8) {#if interfaces.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (43:12) {:else}
    function create_else_block_1$3(ctx) {
    	let p0;
    	let t0;
    	let span0;
    	let t1_value = /*interfaces*/ ctx[0].iface + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3;
    	let span1;
    	let t4_value = /*interfaces*/ ctx[0].ip4 + "";
    	let t4;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text("1. ");
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text("IP4 Address: ");
    			span1 = element("span");
    			t4 = text(t4_value);
    			attr_dev(span0, "class", "font-semibold text-lg svelte-5avmh9");
    			add_location(span0, file$d, 43, 22, 1761);
    			attr_dev(p0, "class", "svelte-5avmh9");
    			add_location(p0, file$d, 43, 16, 1755);
    			attr_dev(span1, "class", "font-semibold text-lg svelte-5avmh9");
    			add_location(span1, file$d, 44, 48, 1876);
    			attr_dev(p1, "class", "pl-8 svelte-5avmh9");
    			add_location(p1, file$d, 44, 16, 1844);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t0);
    			append_dev(p0, span0);
    			append_dev(span0, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t3);
    			append_dev(p1, span1);
    			append_dev(span1, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*interfaces*/ 1 && t1_value !== (t1_value = /*interfaces*/ ctx[0].iface + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*interfaces*/ 1 && t4_value !== (t4_value = /*interfaces*/ ctx[0].ip4 + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$3.name,
    		type: "else",
    		source: "(43:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (28:12) {#if interfaces.length > 1}
    function create_if_block_2$1(ctx) {
    	let each_1_anchor;
    	let each_value = /*interfaces*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*interfaces*/ 1) {
    				each_value = /*interfaces*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(28:12) {#if interfaces.length > 1}",
    		ctx
    	});

    	return block;
    }

    // (34:18) {:else}
    function create_else_block$5(ctx) {
    	let p;
    	let t0;
    	let span;
    	let t1_value = /*ip4*/ ctx[4] + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("IP4 Address: ");
    			span = element("span");
    			t1 = text(t1_value);
    			attr_dev(span, "class", "font-semibold text-lg svelte-5avmh9");
    			add_location(span, file$d, 34, 51, 1296);
    			attr_dev(p, "class", "pl-8 svelte-5avmh9");
    			add_location(p, file$d, 34, 20, 1265);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, span);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*interfaces*/ 1 && t1_value !== (t1_value = /*ip4*/ ctx[4] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(34:18) {:else}",
    		ctx
    	});

    	return block;
    }

    // (32:18) {#if ip4===""}
    function create_if_block_3(ctx) {
    	let p;
    	let t0;
    	let span;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("IP4 Address: ");
    			span = element("span");
    			span.textContent = "N/A";
    			attr_dev(span, "class", "font-semibold text-lg svelte-5avmh9");
    			add_location(span, file$d, 32, 51, 1166);
    			attr_dev(p, "class", "pl-8 svelte-5avmh9");
    			add_location(p, file$d, 32, 20, 1135);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, span);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(32:18) {#if ip4===\\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    // (29:16) {#each interfaces as {iface, ip4,mac,isDHCP,isInternal}
    function create_each_block$2(ctx) {
    	let br;
    	let t0;
    	let p0;
    	let t1;
    	let span0;
    	let t2_value = /*iface*/ ctx[3] + "";
    	let t2;
    	let t3;
    	let t4;
    	let p1;
    	let t5;
    	let span1;
    	let t6_value = /*mac*/ ctx[5] + "";
    	let t6;
    	let t7;
    	let p2;
    	let t8;
    	let span2;
    	let t9_value = /*isDHCP*/ ctx[6] + "";
    	let t9;
    	let t10;
    	let p3;
    	let t11;
    	let span3;
    	let t12_value = /*isInternal*/ ctx[7] + "";
    	let t12;

    	function select_block_type_3(ctx, dirty) {
    		if (/*ip4*/ ctx[4] === "") return create_if_block_3;
    		return create_else_block$5;
    	}

    	let current_block_type = select_block_type_3(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			br = element("br");
    			t0 = space();
    			p0 = element("p");
    			t1 = text("• ");
    			span0 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			if_block.c();
    			t4 = space();
    			p1 = element("p");
    			t5 = text("MAC Address: ");
    			span1 = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			p2 = element("p");
    			t8 = text("DHCP: ");
    			span2 = element("span");
    			t9 = text(t9_value);
    			t10 = space();
    			p3 = element("p");
    			t11 = text("Virtual: ");
    			span3 = element("span");
    			t12 = text(t12_value);
    			attr_dev(br, "class", "svelte-5avmh9");
    			add_location(br, file$d, 29, 16, 991);
    			attr_dev(span0, "class", "font-semibold text-lg svelte-5avmh9");
    			add_location(span0, file$d, 30, 27, 1025);
    			attr_dev(p0, "class", "svelte-5avmh9");
    			add_location(p0, file$d, 30, 16, 1014);
    			attr_dev(span1, "class", "font-semibold text-lg svelte-5avmh9");
    			add_location(span1, file$d, 36, 51, 1426);
    			attr_dev(p1, "class", "pl-8 svelte-5avmh9");
    			add_location(p1, file$d, 36, 20, 1395);
    			attr_dev(span2, "class", "font-semibold text-lg svelte-5avmh9");
    			add_location(span2, file$d, 37, 44, 1524);
    			attr_dev(p2, "class", "pl-8 svelte-5avmh9");
    			add_location(p2, file$d, 37, 20, 1500);
    			attr_dev(span3, "class", "font-semibold text-lg svelte-5avmh9");
    			add_location(span3, file$d, 38, 47, 1628);
    			attr_dev(p3, "class", "pl-8 svelte-5avmh9");
    			add_location(p3, file$d, 38, 20, 1601);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t1);
    			append_dev(p0, span0);
    			append_dev(span0, t2);
    			insert_dev(target, t3, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t5);
    			append_dev(p1, span1);
    			append_dev(span1, t6);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, t8);
    			append_dev(p2, span2);
    			append_dev(span2, t9);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, p3, anchor);
    			append_dev(p3, t11);
    			append_dev(p3, span3);
    			append_dev(span3, t12);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*interfaces*/ 1 && t2_value !== (t2_value = /*iface*/ ctx[3] + "")) set_data_dev(t2, t2_value);

    			if (current_block_type === (current_block_type = select_block_type_3(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(t4.parentNode, t4);
    				}
    			}

    			if (dirty & /*interfaces*/ 1 && t6_value !== (t6_value = /*mac*/ ctx[5] + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*interfaces*/ 1 && t9_value !== (t9_value = /*isDHCP*/ ctx[6] + "")) set_data_dev(t9, t9_value);
    			if (dirty & /*interfaces*/ 1 && t12_value !== (t12_value = /*isInternal*/ ctx[7] + "")) set_data_dev(t12, t12_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if_block.d(detaching);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(p3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(29:16) {#each interfaces as {iface, ip4,mac,isDHCP,isInternal}",
    		ctx
    	});

    	return block;
    }

    // (23:0) <Shell title={"Available Interfaces"} tooltip={"List of available network interfaces"}>
    function create_default_slot$6(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$6, create_else_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*interfaces*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "text-gray-50 max-h-48 overflow-auto svelte-5avmh9");
    			add_location(div, file$d, 23, 4, 609);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(23:0) <Shell title={\\\"Available Interfaces\\\"} tooltip={\\\"List of available network interfaces\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "Available Interfaces",
    				tooltip: "List of available network interfaces",
    				$$slots: { default: [create_default_slot$6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope, interfaces, pIp*/ 1027) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let interfaces, pIp;
    	ipcRenderer.send("get-network-interfaces");

    	ipcRenderer.on("get-network-interfaces", (e, networkInfo) => {
    		$$invalidate(0, interfaces = networkInfo);
    	});

    	ipcRenderer.send("get-p-ip");

    	ipcRenderer.on("get-p-ip", (e, ipInfo) => {
    		$$invalidate(1, pIp = ipInfo);
    	});

    	$$self.$capture_state = () => ({
    		Shell,
    		Loader,
    		ipcRenderer,
    		interfaces,
    		pIp,
    		require
    	});

    	$$self.$inject_state = $$props => {
    		if ("interfaces" in $$props) $$invalidate(0, interfaces = $$props.interfaces);
    		if ("pIp" in $$props) $$invalidate(1, pIp = $$props.pIp);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [interfaces, pIp];
    }

    class NetworkInterfaces extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NetworkInterfaces",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src\Components\Network\Ping\Ping.svelte generated by Svelte v3.19.1 */

    const file$e = "src\\Components\\Network\\Ping\\Ping.svelte";

    // (206:4) {:else}
    function create_else_block$6(ctx) {
    	let t;
    	let div;
    	let canvas;
    	let div_class_value;
    	let if_block = !/*isChartVisible*/ ctx[1] && create_if_block_2$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();
    			div = element("div");
    			canvas = element("canvas");
    			attr_dev(canvas, "id", "ping-chart");
    			add_location(canvas, file$e, 248, 8, 9014);
    			attr_dev(div, "class", div_class_value = "w-11/12 h-36 " + (/*isChartVisible*/ ctx[1] ? "block" : "hidden"));
    			add_location(div, file$e, 247, 4, 8940);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, canvas);
    		},
    		p: function update(ctx, dirty) {
    			if (!/*isChartVisible*/ ctx[1]) {
    				if (!if_block) {
    					if_block = create_if_block_2$2(ctx);
    					if_block.c();
    					if_block.m(t.parentNode, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*isChartVisible*/ 2 && div_class_value !== (div_class_value = "w-11/12 h-36 " + (/*isChartVisible*/ ctx[1] ? "block" : "hidden"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$6.name,
    		type: "else",
    		source: "(206:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (155:4) {#if ping}
    function create_if_block$7(ctx) {
    	let t;
    	let div;
    	let canvas;
    	let div_class_value;
    	let if_block = !/*isChartVisible*/ ctx[1] && create_if_block_1$4(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t = space();
    			div = element("div");
    			canvas = element("canvas");
    			attr_dev(canvas, "id", "ping-chart");
    			add_location(canvas, file$e, 201, 10, 7121);
    			attr_dev(div, "class", div_class_value = "w-11/12 h-36 " + (/*isChartVisible*/ ctx[1] ? "block" : "hidden"));
    			add_location(div, file$e, 200, 6, 7045);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, canvas);
    		},
    		p: function update(ctx, dirty) {
    			if (!/*isChartVisible*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$4(ctx);
    					if_block.c();
    					if_block.m(t.parentNode, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*isChartVisible*/ 2 && div_class_value !== (div_class_value = "w-11/12 h-36 " + (/*isChartVisible*/ ctx[1] ? "block" : "hidden"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(155:4) {#if ping}",
    		ctx
    	});

    	return block;
    }

    // (207:8) {#if !isChartVisible}
    function create_if_block_2$2(ctx) {
    	let div10;
    	let div1;
    	let p0;
    	let t1;
    	let div0;
    	let p1;
    	let t3;
    	let p2;
    	let t4;
    	let div3;
    	let p3;
    	let t6;
    	let div2;
    	let p4;
    	let t8;
    	let t9;
    	let div5;
    	let p5;
    	let t11;
    	let div4;
    	let p6;
    	let t13;
    	let t14;
    	let div7;
    	let p7;
    	let t16;
    	let div6;
    	let p8;
    	let t18;
    	let p9;
    	let t19;
    	let div9;
    	let p10;
    	let t21;
    	let div8;
    	let p11;
    	let t23;
    	let p12;

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = "Host";
    			t1 = space();
    			div0 = element("div");
    			p1 = element("p");
    			p1.textContent = "N/A";
    			t3 = text(" \r\n              ");
    			p2 = element("p");
    			t4 = space();
    			div3 = element("div");
    			p3 = element("p");
    			p3.textContent = "Sent";
    			t6 = space();
    			div2 = element("div");
    			p4 = element("p");
    			p4.textContent = "N/A";
    			t8 = text(" ");
    			t9 = space();
    			div5 = element("div");
    			p5 = element("p");
    			p5.textContent = "Time";
    			t11 = space();
    			div4 = element("div");
    			p6 = element("p");
    			p6.textContent = "N/A";
    			t13 = text(" ");
    			t14 = space();
    			div7 = element("div");
    			p7 = element("p");
    			p7.textContent = "Alive";
    			t16 = space();
    			div6 = element("div");
    			p8 = element("p");
    			p8.textContent = "N/A";
    			t18 = text(" \r\n              ");
    			p9 = element("p");
    			t19 = space();
    			div9 = element("div");
    			p10 = element("p");
    			p10.textContent = "Loss";
    			t21 = space();
    			div8 = element("div");
    			p11 = element("p");
    			p11.textContent = "N/A";
    			t23 = text(" \r\n              ");
    			p12 = element("p");
    			attr_dev(p0, "class", "text-white");
    			add_location(p0, file$e, 209, 10, 7385);
    			attr_dev(p1, "id", "infoValueCPN");
    			attr_dev(p1, "class", "font-semibold text-white text-xl");
    			add_location(p1, file$e, 211, 14, 7472);
    			attr_dev(p2, "class", "font-semibold text-white text-sm");
    			add_location(p2, file$e, 212, 14, 7562);
    			attr_dev(div0, "class", "flex flex-row");
    			add_location(div0, file$e, 210, 12, 7429);
    			attr_dev(div1, "class", "p-2 m-2 flex flex-col justify-center items-center");
    			add_location(div1, file$e, 208, 8, 7310);
    			attr_dev(p3, "class", "text-white");
    			add_location(p3, file$e, 217, 10, 7733);
    			attr_dev(p4, "id", "infoValueCPN");
    			attr_dev(p4, "class", "font-semibold text-white text-xl");
    			add_location(p4, file$e, 219, 14, 7820);
    			attr_dev(div2, "class", "flex flex-row");
    			add_location(div2, file$e, 218, 12, 7777);
    			attr_dev(div3, "class", "p-2 m-2 flex flex-col justify-center items-center");
    			add_location(div3, file$e, 216, 8, 7658);
    			attr_dev(p5, "class", "text-white");
    			add_location(p5, file$e, 224, 10, 8017);
    			attr_dev(p6, "id", "infoValueCPN");
    			attr_dev(p6, "class", "font-semibold text-white text-xl");
    			add_location(p6, file$e, 226, 14, 8104);
    			attr_dev(div4, "class", "flex flex-row");
    			add_location(div4, file$e, 225, 12, 8061);
    			attr_dev(div5, "class", "p-2 m-2 flex flex-col justify-center items-center");
    			add_location(div5, file$e, 223, 8, 7942);
    			attr_dev(p7, "class", "text-white");
    			add_location(p7, file$e, 231, 10, 8301);
    			attr_dev(p8, "id", "infoValueCPN");
    			attr_dev(p8, "class", "font-semibold text-white text-xl");
    			add_location(p8, file$e, 233, 14, 8389);
    			attr_dev(p9, "class", "font-semibold text-white text-xl");
    			add_location(p9, file$e, 234, 14, 8479);
    			attr_dev(div6, "class", "flex flex-row");
    			add_location(div6, file$e, 232, 12, 8346);
    			attr_dev(div7, "class", "p-2 m-2 flex flex-col justify-center items-center");
    			add_location(div7, file$e, 230, 8, 8226);
    			attr_dev(p10, "class", "text-white");
    			add_location(p10, file$e, 239, 10, 8650);
    			attr_dev(p11, "id", "infoValueCPN");
    			attr_dev(p11, "class", "font-semibold text-white text-xl");
    			add_location(p11, file$e, 241, 14, 8737);
    			attr_dev(p12, "class", "font-semibold text-white text-sm");
    			add_location(p12, file$e, 242, 14, 8827);
    			attr_dev(div8, "class", "flex flex-row");
    			add_location(div8, file$e, 240, 12, 8694);
    			attr_dev(div9, "class", "p-2 m-2 flex flex-col justify-center items-center");
    			add_location(div9, file$e, 238, 8, 8575);
    			attr_dev(div10, "class", "grid grid-cols-2 md:grid-cols-3");
    			add_location(div10, file$e, 207, 8, 7255);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div1);
    			append_dev(div1, p0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, p1);
    			append_dev(div0, t3);
    			append_dev(div0, p2);
    			append_dev(div10, t4);
    			append_dev(div10, div3);
    			append_dev(div3, p3);
    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			append_dev(div2, p4);
    			append_dev(div2, t8);
    			append_dev(div10, t9);
    			append_dev(div10, div5);
    			append_dev(div5, p5);
    			append_dev(div5, t11);
    			append_dev(div5, div4);
    			append_dev(div4, p6);
    			append_dev(div4, t13);
    			append_dev(div10, t14);
    			append_dev(div10, div7);
    			append_dev(div7, p7);
    			append_dev(div7, t16);
    			append_dev(div7, div6);
    			append_dev(div6, p8);
    			append_dev(div6, t18);
    			append_dev(div6, p9);
    			append_dev(div10, t19);
    			append_dev(div10, div9);
    			append_dev(div9, p10);
    			append_dev(div9, t21);
    			append_dev(div9, div8);
    			append_dev(div8, p11);
    			append_dev(div8, t23);
    			append_dev(div8, p12);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(207:8) {#if !isChartVisible}",
    		ctx
    	});

    	return block;
    }

    // (156:4) {#if !isChartVisible}
    function create_if_block_1$4(ctx) {
    	let div10;
    	let div1;
    	let p0;
    	let t1;
    	let div0;
    	let p1;
    	let t2_value = /*ping*/ ctx[0].hst + "";
    	let t2;
    	let t3;
    	let p2;
    	let t4;
    	let div3;
    	let p3;
    	let t6;
    	let div2;
    	let p4;
    	let t7;
    	let t8;
    	let t9;
    	let div5;
    	let p5;
    	let t11;
    	let div4;
    	let p6;
    	let t12_value = /*ping*/ ctx[0].time + "";
    	let t12;
    	let t13;
    	let p7;
    	let t15;
    	let div7;
    	let p8;
    	let t17;
    	let div6;
    	let p9;
    	let t18_value = /*ping*/ ctx[0].alive + "";
    	let t18;
    	let t19;
    	let p10;
    	let t20;
    	let div9;
    	let p11;
    	let t22;
    	let div8;
    	let p12;
    	let t23_value = /*ping*/ ctx[0].loss + "";
    	let t23;
    	let t24;
    	let p13;

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = "Host";
    			t1 = space();
    			div0 = element("div");
    			p1 = element("p");
    			t2 = text(t2_value);
    			t3 = text(" \r\n          ");
    			p2 = element("p");
    			t4 = space();
    			div3 = element("div");
    			p3 = element("p");
    			p3.textContent = "Sent";
    			t6 = space();
    			div2 = element("div");
    			p4 = element("p");
    			t7 = text(/*packetCount*/ ctx[2]);
    			t8 = text(" ");
    			t9 = space();
    			div5 = element("div");
    			p5 = element("p");
    			p5.textContent = "Time";
    			t11 = space();
    			div4 = element("div");
    			p6 = element("p");
    			t12 = text(t12_value);
    			t13 = text(" \r\n              ");
    			p7 = element("p");
    			p7.textContent = "ms";
    			t15 = space();
    			div7 = element("div");
    			p8 = element("p");
    			p8.textContent = "Alive";
    			t17 = space();
    			div6 = element("div");
    			p9 = element("p");
    			t18 = text(t18_value);
    			t19 = text(" \r\n              ");
    			p10 = element("p");
    			t20 = space();
    			div9 = element("div");
    			p11 = element("p");
    			p11.textContent = "Loss";
    			t22 = space();
    			div8 = element("div");
    			p12 = element("p");
    			t23 = text(t23_value);
    			t24 = text(" \r\n              ");
    			p13 = element("p");
    			attr_dev(p0, "class", "text-white");
    			add_location(p0, file$e, 160, 6, 5454);
    			attr_dev(p1, "class", "font-semibold text-white text-xl");
    			add_location(p1, file$e, 162, 10, 5533);
    			attr_dev(p2, "class", "font-semibold text-white text-sm");
    			add_location(p2, file$e, 163, 10, 5608);
    			attr_dev(div0, "class", "flex flex-row");
    			add_location(div0, file$e, 161, 8, 5494);
    			attr_dev(div1, "class", "p-2 m-2 flex flex-col justify-center items-center");
    			add_location(div1, file$e, 159, 4, 5383);
    			attr_dev(p3, "class", "text-white");
    			add_location(p3, file$e, 168, 6, 5763);
    			attr_dev(p4, "class", "font-semibold text-white text-xl");
    			add_location(p4, file$e, 170, 10, 5842);
    			attr_dev(div2, "class", "flex flex-row");
    			add_location(div2, file$e, 169, 8, 5803);
    			attr_dev(div3, "class", "p-2 m-2 flex flex-col justify-center items-center");
    			add_location(div3, file$e, 167, 4, 5692);
    			attr_dev(p5, "class", "text-white");
    			add_location(p5, file$e, 175, 10, 6023);
    			attr_dev(p6, "class", "font-semibold text-white text-xl");
    			add_location(p6, file$e, 177, 14, 6110);
    			attr_dev(p7, "class", "font-semibold text-white text-xl");
    			add_location(p7, file$e, 178, 14, 6190);
    			attr_dev(div4, "class", "flex flex-row");
    			add_location(div4, file$e, 176, 12, 6067);
    			attr_dev(div5, "class", "p-2 m-2 flex flex-col justify-center items-center");
    			add_location(div5, file$e, 174, 8, 5948);
    			attr_dev(p8, "class", "text-white");
    			add_location(p8, file$e, 183, 10, 6363);
    			attr_dev(p9, "class", "font-semibold text-white text-xl");
    			set_style(p9, "text-transform", "capitalize");
    			add_location(p9, file$e, 185, 14, 6451);
    			attr_dev(p10, "class", "font-semibold text-white text-xl");
    			add_location(p10, file$e, 186, 14, 6568);
    			attr_dev(div6, "class", "flex flex-row");
    			add_location(div6, file$e, 184, 12, 6408);
    			attr_dev(div7, "class", "p-2 m-2 flex flex-col justify-center items-center");
    			add_location(div7, file$e, 182, 8, 6288);
    			attr_dev(p11, "class", "text-white");
    			add_location(p11, file$e, 191, 10, 6739);
    			attr_dev(p12, "id", "infoValueCPN");
    			attr_dev(p12, "class", "font-semibold text-white text-xl");
    			add_location(p12, file$e, 193, 14, 6826);
    			attr_dev(p13, "class", "font-semibold text-white text-sm");
    			add_location(p13, file$e, 194, 14, 6924);
    			attr_dev(div8, "class", "flex flex-row");
    			add_location(div8, file$e, 192, 12, 6783);
    			attr_dev(div9, "class", "p-2 m-2 flex flex-col justify-center items-center");
    			add_location(div9, file$e, 190, 8, 6664);
    			attr_dev(div10, "class", "grid grid-cols-2 md:grid-cols-3");
    			add_location(div10, file$e, 156, 4, 5328);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div1);
    			append_dev(div1, p0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, p1);
    			append_dev(p1, t2);
    			append_dev(div0, t3);
    			append_dev(div0, p2);
    			append_dev(div10, t4);
    			append_dev(div10, div3);
    			append_dev(div3, p3);
    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			append_dev(div2, p4);
    			append_dev(p4, t7);
    			append_dev(div2, t8);
    			append_dev(div10, t9);
    			append_dev(div10, div5);
    			append_dev(div5, p5);
    			append_dev(div5, t11);
    			append_dev(div5, div4);
    			append_dev(div4, p6);
    			append_dev(p6, t12);
    			append_dev(div4, t13);
    			append_dev(div4, p7);
    			append_dev(div10, t15);
    			append_dev(div10, div7);
    			append_dev(div7, p8);
    			append_dev(div7, t17);
    			append_dev(div7, div6);
    			append_dev(div6, p9);
    			append_dev(p9, t18);
    			append_dev(div6, t19);
    			append_dev(div6, p10);
    			append_dev(div10, t20);
    			append_dev(div10, div9);
    			append_dev(div9, p11);
    			append_dev(div9, t22);
    			append_dev(div9, div8);
    			append_dev(div8, p12);
    			append_dev(p12, t23);
    			append_dev(div8, t24);
    			append_dev(div8, p13);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ping*/ 1 && t2_value !== (t2_value = /*ping*/ ctx[0].hst + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*packetCount*/ 4) set_data_dev(t7, /*packetCount*/ ctx[2]);
    			if (dirty & /*ping*/ 1 && t12_value !== (t12_value = /*ping*/ ctx[0].time + "")) set_data_dev(t12, t12_value);
    			if (dirty & /*ping*/ 1 && t18_value !== (t18_value = /*ping*/ ctx[0].alive + "")) set_data_dev(t18, t18_value);
    			if (dirty & /*ping*/ 1 && t23_value !== (t23_value = /*ping*/ ctx[0].loss + "")) set_data_dev(t23, t23_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(156:4) {#if !isChartVisible}",
    		ctx
    	});

    	return block;
    }

    // (145:0) <Shell title={"Ping Tool"} tooltip={"Check Ping Data w/Graphs and Stats"}>
    function create_default_slot$7(ctx) {
    	let div2;
    	let div0;
    	let input;
    	let t0;
    	let button0;
    	let t2;
    	let button1;
    	let t4;
    	let button2;
    	let t5_value = (/*isChartVisible*/ ctx[1] ? "Show Stats" : "Show Graph") + "";
    	let t5;
    	let t6;
    	let button3;
    	let t8;
    	let div1;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*ping*/ ctx[0]) return create_if_block$7;
    		return create_else_block$6;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			button0 = element("button");
    			button0.textContent = "Start";
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "Stop";
    			t4 = space();
    			button2 = element("button");
    			t5 = text(t5_value);
    			t6 = space();
    			button3 = element("button");
    			button3.textContent = "Clear Data";
    			t8 = space();
    			div1 = element("div");
    			if_block.c();
    			attr_dev(input, "id", "dname");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Enter IP/Domain");
    			input.value = "";
    			attr_dev(input, "class", "w-3/5 rounded-md m-2 px-1 text-gray-800 font-semibold");
    			add_location(input, file$e, 147, 4, 4372);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-semibold hover:bg-purple-600");
    			add_location(button0, file$e, 148, 4, 4509);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-semibold hover:bg-purple-600");
    			add_location(button1, file$e, 149, 4, 4665);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-semibold hover:bg-purple-600");
    			add_location(button2, file$e, 150, 4, 4820);
    			attr_dev(button3, "type", "button");
    			attr_dev(button3, "class", "text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-semibold hover:bg-purple-600");
    			add_location(button3, file$e, 151, 4, 5047);
    			attr_dev(div0, "class", "flex flex-row justify-center mt-1");
    			add_location(div0, file$e, 146, 4, 4319);
    			attr_dev(div1, "class", "mt-2 flex flex-col items-center text-gray-50");
    			add_location(div1, file$e, 153, 4, 5221);
    			attr_dev(div2, "class", "flex flex-col");
    			add_location(div2, file$e, 145, 2, 4286);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			append_dev(div0, t0);
    			append_dev(div0, button0);
    			append_dev(div0, t2);
    			append_dev(div0, button1);
    			append_dev(div0, t4);
    			append_dev(div0, button2);
    			append_dev(button2, t5);
    			append_dev(div0, t6);
    			append_dev(div0, button3);
    			append_dev(div2, t8);
    			append_dev(div2, div1);
    			if_block.m(div1, null);

    			dispose = [
    				listen_dev(button0, "click", /*sendData*/ ctx[4], false, false, false),
    				listen_dev(button1, "click", /*stopTool*/ ctx[3], false, false, false),
    				listen_dev(button2, "click", /*click_handler*/ ctx[13], false, false, false),
    				listen_dev(button3, "click", /*clearData*/ ctx[5], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*isChartVisible*/ 2 && t5_value !== (t5_value = (/*isChartVisible*/ ctx[1] ? "Show Stats" : "Show Graph") + "")) set_data_dev(t5, t5_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_block.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(145:0) <Shell title={\\\"Ping Tool\\\"} tooltip={\\\"Check Ping Data w/Graphs and Stats\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "Ping Tool",
    				tooltip: "Check Ping Data w/Graphs and Stats",
    				$$slots: { default: [create_default_slot$7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope, isChartVisible, ping, packetCount*/ 16391) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let $settings;
    	validate_store(settings, "settings");
    	component_subscribe($$self, settings, $$value => $$invalidate(11, $settings = $$value));
    	const { ipcRenderer } = require("electron");
    	let ping, name, pingInterval, timeList = [], pingChart, isChartVisible = true;
    	let logged = true;
    	let packetCount = 0;

    	const stopTool = () => {
    		//packetCount=0;
    		clearInterval(pingInterval);
    	};

    	const sendData = () => {
    		$$invalidate(2, packetCount = 0);
    		name = document.getElementById("dname").value;

    		pingInterval = setInterval(
    			() => {
    				logged = false;
    				ipcRenderer.send("get-ping-info", name);

    				ipcRenderer.on("get-ping-info", (e, pInfo) => {
    					$$invalidate(0, ping = pInfo);

    					if (!logged) {
    						$$invalidate(2, packetCount += 1);
    						timeList = [...timeList, ping.time];

    						//console.log(timeList);
    						//console.log(''+ping.time);
    						logToText({
    							path: `./logs/clean_logs/PING_${fileStamp}_${ping.hst}.txt`,
    							content: `Time:${ping.time} ms | Alive:${ping.alive} | Loss:${ping.loss}`,
    							mark: "info",
    							quiet: false
    						});

    						logSimple("./logs/api_logs/PingLog.txt", "" + ping.time);

    						// Create new chart each time ping data is received
    						const canvas = document.getElementById("ping-chart");

    						const ctx = canvas.getContext("2d");
    						if (pingChart) pingChart.destroy();

    						pingChart = new Chart(ctx,
    						{
    								type: "line",
    								options: {
    									maintainAspectRatio: false,
    									color: $settings.fontColor2,
    									scales: {
    										x: { ticks: { color: $settings.fontColor2 } },
    										y: { ticks: { color: $settings.fontColor2 } }
    									}
    								},
    								data: {
    									labels: timeList.map((item, index) => index),
    									datasets: [
    										{
    											label: "Ping Chart",
    											data: timeList,
    											borderColor: $settings.miscColor,
    											backgroundColor: $settings.miscColor,
    											tension: 0.1
    										}
    									]
    								}
    							});

    						logged = true;
    					}
    				});
    			},
    			1000
    		);
    	};

    	onMount(() => {
    		// setInterval(()=>{
    		const canvas = document.getElementById("ping-chart");

    		const ctx = canvas.getContext("2d");

    		// Create chart for Ping on initial mount
    		// If chart already exists, destroy it first
    		if (pingChart) pingChart.destroy();

    		pingChart = new Chart(ctx,
    		{
    				type: "line",
    				options: {
    					maintainAspectRatio: false,
    					color: $settings.fontColor2,
    					scales: {
    						x: { ticks: { color: $settings.fontColor2 } },
    						y: { ticks: { color: $settings.fontColor2 } }
    					}
    				},
    				data: {
    					labels: timeList.map((item, index) => index),
    					datasets: [
    						{
    							label: "Ping Chart",
    							data: timeList,
    							borderColor: $settings.miscColor,
    							backgroundColor: $settings.miscColor,
    							tension: 0.1
    						}
    					]
    				}
    			});
    	});

    	onDestroy(() => {
    		$$invalidate(2, packetCount = 0);
    		timeList = [];
    		console.log("Component Unmounted");
    		clearInterval(pingInterval);
    		pingChart.destroy();
    	});

    	const clearData = () => {
    		clearInterval(pingInterval);
    		$$invalidate(0, ping = null);
    		timeList = [];
    	};

    	const click_handler = () => $$invalidate(1, isChartVisible = !isChartVisible);

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		Shell,
    		settings,
    		logToText,
    		logSimple,
    		fileStamp,
    		ipcRenderer,
    		ping,
    		name,
    		pingInterval,
    		timeList,
    		pingChart,
    		isChartVisible,
    		logged,
    		packetCount,
    		stopTool,
    		sendData,
    		clearData,
    		require,
    		clearInterval,
    		document,
    		setInterval,
    		Chart,
    		$settings,
    		console
    	});

    	$$self.$inject_state = $$props => {
    		if ("ping" in $$props) $$invalidate(0, ping = $$props.ping);
    		if ("name" in $$props) name = $$props.name;
    		if ("pingInterval" in $$props) pingInterval = $$props.pingInterval;
    		if ("timeList" in $$props) timeList = $$props.timeList;
    		if ("pingChart" in $$props) pingChart = $$props.pingChart;
    		if ("isChartVisible" in $$props) $$invalidate(1, isChartVisible = $$props.isChartVisible);
    		if ("logged" in $$props) logged = $$props.logged;
    		if ("packetCount" in $$props) $$invalidate(2, packetCount = $$props.packetCount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		ping,
    		isChartVisible,
    		packetCount,
    		stopTool,
    		sendData,
    		clearData,
    		name,
    		pingInterval,
    		timeList,
    		pingChart,
    		logged,
    		$settings,
    		ipcRenderer,
    		click_handler
    	];
    }

    class Ping extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ping",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src\Components\Network\Ports\Ports.svelte generated by Svelte v3.19.1 */
    const file$f = "src\\Components\\Network\\Ports\\Ports.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (47:12) {:else}
    function create_else_block$7(ctx) {
    	let p;
    	let t1;
    	let span;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "• Open Ports";
    			t1 = space();
    			span = element("span");
    			span.textContent = "N/A";
    			add_location(p, file$f, 47, 12, 1558);
    			attr_dev(span, "class", "ml-8 font-semibold text-lg");
    			add_location(span, file$f, 48, 12, 1597);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$7.name,
    		type: "else",
    		source: "(47:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (40:29) 
    function create_if_block_1$5(ctx) {
    	let div;
    	let current;
    	const loader = new Loader({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(loader.$$.fragment);
    			attr_dev(div, "class", "flex flex-row justify-center");
    			add_location(div, file$f, 41, 14, 1347);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(loader, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(loader);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(40:29) ",
    		ctx
    	});

    	return block;
    }

    // (35:12) {#if port}
    function create_if_block$8(ctx) {
    	let p;
    	let t1;
    	let each_1_anchor;
    	let each_value = /*port*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "• Open Ports";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(p, file$f, 35, 14, 1079);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*port*/ 1) {
    				each_value = /*port*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(35:12) {#if port}",
    		ctx
    	});

    	return block;
    }

    // (37:14) {#each port as portNumber}
    function create_each_block$3(ctx) {
    	let span;
    	let t_value = /*portNumber*/ ctx[6] + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "ml-8 font-semibold text-lg block");
    			add_location(span, file$f, 37, 14, 1162);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*port*/ 1 && t_value !== (t_value = /*portNumber*/ ctx[6] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(37:14) {#each port as portNumber}",
    		ctx
    	});

    	return block;
    }

    // (28:0) <Shell title={"Port Scanning"} tooltip={"Scan Open Ports"}>
    function create_default_slot$8(ctx) {
    	let div2;
    	let div0;
    	let input;
    	let t0;
    	let button;
    	let t2;
    	let div1;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block$8, create_if_block_1$5, create_else_block$7];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*port*/ ctx[0]) return 0;
    		if (/*search*/ ctx[2]) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			button.textContent = "Scan";
    			t2 = space();
    			div1 = element("div");
    			if_block.c();
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Enter IP");
    			attr_dev(input, "class", "w-10/12 rounded-md m-2 px-1 text-gray-800 font-semibold");
    			add_location(input, file$f, 30, 8, 682);
    			attr_dev(button, "class", "text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-semibold hover:bg-purple-600");
    			attr_dev(button, "type", "button");
    			add_location(button, file$f, 31, 12, 813);
    			attr_dev(div0, "class", "flex flex-row");
    			add_location(div0, file$f, 29, 8, 645);
    			attr_dev(div1, "class", "mt-2 max-h-48 overflow-auto w-full");
    			add_location(div1, file$f, 33, 8, 991);
    			attr_dev(div2, "class", "text-gray-50");
    			add_location(div2, file$f, 28, 4, 609);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*value*/ ctx[1]);
    			append_dev(div0, t0);
    			append_dev(div0, button);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			if_blocks[current_block_type_index].m(div1, null);
    			current = true;

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    				listen_dev(button, "click", /*getPortInfo*/ ctx[3], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*value*/ 2 && input.value !== /*value*/ ctx[1]) {
    				set_input_value(input, /*value*/ ctx[1]);
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div1, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_blocks[current_block_type_index].d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$8.name,
    		type: "slot",
    		source: "(28:0) <Shell title={\\\"Port Scanning\\\"} tooltip={\\\"Scan Open Ports\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "Port Scanning",
    				tooltip: "Scan Open Ports",
    				$$slots: { default: [create_default_slot$8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope, port, search, value*/ 519) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let port, value = "";
    	let search = false;

    	const getPortInfo = () => {
    		$$invalidate(2, search = true);
    		$$invalidate(0, port = null);
    		ipcRenderer.send("get-open-ports", value);
    	}; // value = '';

    	ipcRenderer.on("get-open-ports", (e, portInfo) => {
    		$$invalidate(0, port = portInfo);
    		$$invalidate(2, search = false);
    	});

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(1, value);
    	}

    	$$self.$capture_state = () => ({
    		Shell,
    		Loader,
    		ipcRenderer,
    		port,
    		value,
    		search,
    		getPortInfo,
    		require
    	});

    	$$self.$inject_state = $$props => {
    		if ("port" in $$props) $$invalidate(0, port = $$props.port);
    		if ("value" in $$props) $$invalidate(1, value = $$props.value);
    		if ("search" in $$props) $$invalidate(2, search = $$props.search);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [port, value, search, getPortInfo, ipcRenderer, input_input_handler];
    }

    class Ports extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ports",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src\Components\Network\Whois\Whois.svelte generated by Svelte v3.19.1 */
    const file$g = "src\\Components\\Network\\Whois\\Whois.svelte";

    // (32:4) {:else}
    function create_else_block$8(ctx) {
    	let p0;
    	let t1;
    	let span0;
    	let t3;
    	let p1;
    	let t5;
    	let span1;
    	let t7;
    	let p2;
    	let t9;
    	let span2;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "• Registrar URL";
    			t1 = space();
    			span0 = element("span");
    			span0.textContent = "N/A";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "• Region";
    			t5 = space();
    			span1 = element("span");
    			span1.textContent = "N/A , N/A";
    			t7 = space();
    			p2 = element("p");
    			p2.textContent = "• Domain Expiry On";
    			t9 = space();
    			span2 = element("span");
    			span2.textContent = "N/A";
    			add_location(p0, file$g, 32, 4, 1236);
    			attr_dev(span0, "class", "ml-6 font-bold text-lg");
    			add_location(span0, file$g, 33, 4, 1270);
    			add_location(p1, file$g, 34, 4, 1323);
    			attr_dev(span1, "class", "ml-6 font-bold text-lg");
    			add_location(span1, file$g, 35, 4, 1350);
    			add_location(p2, file$g, 36, 4, 1409);
    			attr_dev(span2, "class", "ml-6 font-bold text-lg");
    			add_location(span2, file$g, 37, 4, 1446);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, span1, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, span2, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(span2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$8.name,
    		type: "else",
    		source: "(32:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (24:4) {#if whois}
    function create_if_block$9(ctx) {
    	let p0;
    	let t1;
    	let span0;
    	let t2_value = /*whois*/ ctx[0].url + "";
    	let t2;
    	let t3;
    	let p1;
    	let t5;
    	let span1;
    	let t6_value = /*whois*/ ctx[0].st + "";
    	let t6;
    	let t7;
    	let t8_value = /*whois*/ ctx[0].cn + "";
    	let t8;
    	let t9;
    	let p2;
    	let t11;
    	let span2;
    	let t12_value = /*whois*/ ctx[0].expiry + "";
    	let t12;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "◆ Registrar URL";
    			t1 = space();
    			span0 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "◆ Region";
    			t5 = space();
    			span1 = element("span");
    			t6 = text(t6_value);
    			t7 = text(",");
    			t8 = text(t8_value);
    			t9 = space();
    			p2 = element("p");
    			p2.textContent = "◆ Domain Expiry On";
    			t11 = space();
    			span2 = element("span");
    			t12 = text(t12_value);
    			add_location(p0, file$g, 24, 8, 909);
    			attr_dev(span0, "class", "ml-6 font-bold text-lg");
    			add_location(span0, file$g, 25, 8, 946);
    			add_location(p1, file$g, 26, 8, 1011);
    			attr_dev(span1, "class", "ml-6 font-bold text-lg");
    			add_location(span1, file$g, 27, 8, 1041);
    			add_location(p2, file$g, 28, 8, 1116);
    			attr_dev(span2, "class", "ml-6 font-bold text-lg");
    			add_location(span2, file$g, 29, 9, 1157);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span0, anchor);
    			append_dev(span0, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, span1, anchor);
    			append_dev(span1, t6);
    			append_dev(span1, t7);
    			append_dev(span1, t8);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, span2, anchor);
    			append_dev(span2, t12);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*whois*/ 1 && t2_value !== (t2_value = /*whois*/ ctx[0].url + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*whois*/ 1 && t6_value !== (t6_value = /*whois*/ ctx[0].st + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*whois*/ 1 && t8_value !== (t8_value = /*whois*/ ctx[0].cn + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*whois*/ 1 && t12_value !== (t12_value = /*whois*/ ctx[0].expiry + "")) set_data_dev(t12, t12_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(span2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(24:4) {#if whois}",
    		ctx
    	});

    	return block;
    }

    // (17:0) <Shell title={"Whois Lookup"} tooltip={"Check WHOIS"}>
    function create_default_slot$9(ctx) {
    	let div2;
    	let div0;
    	let input;
    	let t0;
    	let button;
    	let t2;
    	let div1;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*whois*/ ctx[0]) return create_if_block$9;
    		return create_else_block$8;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			button.textContent = "SEARCH";
    			t2 = space();
    			div1 = element("div");
    			if_block.c();
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Enter IP");
    			attr_dev(input, "class", "w-10/12 rounded-md m-2 px-1 text-gray-800 font-bold");
    			add_location(input, file$g, 19, 4, 541);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-thin hover:bg-purple-600");
    			add_location(button, file$g, 20, 4, 665);
    			attr_dev(div0, "class", "flex flex-row justify-start");
    			add_location(div0, file$g, 18, 4, 494);
    			attr_dev(div1, "class", "flex flex-col items-start text-gray-50");
    			add_location(div1, file$g, 22, 4, 830);
    			attr_dev(div2, "class", "flex flex-col");
    			add_location(div2, file$g, 17, 2, 461);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*ip*/ ctx[1]);
    			append_dev(div0, t0);
    			append_dev(div0, button);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			if_block.m(div1, null);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    				listen_dev(button, "click", /*sendData*/ ctx[2], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ip*/ 2 && input.value !== /*ip*/ ctx[1]) {
    				set_input_value(input, /*ip*/ ctx[1]);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if_block.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$9.name,
    		type: "slot",
    		source: "(17:0) <Shell title={\\\"Whois Lookup\\\"} tooltip={\\\"Check WHOIS\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "Whois Lookup",
    				tooltip: "Check WHOIS",
    				$$slots: { default: [create_default_slot$9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope, whois, ip*/ 35) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let whois, ip;

    	//ipcRenderer.send('get-whois-info');
    	const sendData = () => {
    		ipcRenderer.send("get-whois-info", ip);

    		ipcRenderer.on("get-whois-info", (e, whoisInfo) => {
    			$$invalidate(0, whois = whoisInfo);
    			console.log(whois);
    		});
    	};

    	function input_input_handler() {
    		ip = this.value;
    		$$invalidate(1, ip);
    	}

    	$$self.$capture_state = () => ({
    		ipcRenderer,
    		Shell,
    		whois,
    		ip,
    		sendData,
    		require,
    		console
    	});

    	$$self.$inject_state = $$props => {
    		if ("whois" in $$props) $$invalidate(0, whois = $$props.whois);
    		if ("ip" in $$props) $$invalidate(1, ip = $$props.ip);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [whois, ip, sendData, ipcRenderer, input_input_handler];
    }

    class Whois extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Whois",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src\Components\System\Cpu\Cpu.svelte generated by Svelte v3.19.1 */
    const file$h = "src\\Components\\System\\Cpu\\Cpu.svelte";

    // (32:4) {:else}
    function create_else_block$9(ctx) {
    	let div;
    	let current;
    	const loader = new Loader({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(loader.$$.fragment);
    			attr_dev(div, "class", "flex flex-row justify-center");
    			add_location(div, file$h, 32, 8, 1122);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(loader, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(loader);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$9.name,
    		type: "else",
    		source: "(32:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (22:4) {#if cpu}
    function create_if_block$a(ctx) {
    	let div;
    	let p0;
    	let t0;
    	let span0;
    	let t1_value = /*cpu*/ ctx[0].brand + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3;
    	let span1;
    	let t4_value = /*cpu*/ ctx[0].speed + "";
    	let t4;
    	let t5;
    	let t6;
    	let p2;
    	let t7;
    	let span2;
    	let t8_value = /*cpu*/ ctx[0].cores + "";
    	let t8;
    	let t9;
    	let p3;
    	let t10;
    	let span3;
    	let t11_value = /*cpu*/ ctx[0].socket + "";
    	let t11;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			t0 = text("• Processor:");
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text("• Speed:");
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = text(" GHz");
    			t6 = space();
    			p2 = element("p");
    			t7 = text("• Cores:");
    			span2 = element("span");
    			t8 = text(t8_value);
    			t9 = space();
    			p3 = element("p");
    			t10 = text("• Socket:");
    			span3 = element("span");
    			t11 = text(t11_value);
    			attr_dev(span0, "class", "ml-2 font-bold text-lg");
    			set_style(span0, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span0, file$h, 23, 29, 605);
    			add_location(p0, file$h, 23, 8, 584);
    			attr_dev(span1, "class", "ml-2 font-bold text-lg");
    			set_style(span1, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span1, file$h, 24, 25, 730);
    			add_location(p1, file$h, 24, 8, 713);
    			attr_dev(span2, "class", "ml-2 font-bold text-lg");
    			set_style(span2, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span2, file$h, 26, 25, 860);
    			add_location(p2, file$h, 26, 8, 843);
    			attr_dev(span3, "class", "ml-2 font-bold text-lg");
    			set_style(span3, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span3, file$h, 28, 26, 987);
    			add_location(p3, file$h, 28, 8, 969);
    			attr_dev(div, "class", "pl-2 flex flex-col items-start text-gray-50");
    			add_location(div, file$h, 22, 4, 517);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(p0, span0);
    			append_dev(span0, t1);
    			append_dev(div, t2);
    			append_dev(div, p1);
    			append_dev(p1, t3);
    			append_dev(p1, span1);
    			append_dev(span1, t4);
    			append_dev(span1, t5);
    			append_dev(div, t6);
    			append_dev(div, p2);
    			append_dev(p2, t7);
    			append_dev(p2, span2);
    			append_dev(span2, t8);
    			append_dev(div, t9);
    			append_dev(div, p3);
    			append_dev(p3, t10);
    			append_dev(p3, span3);
    			append_dev(span3, t11);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cpu*/ 1 && t1_value !== (t1_value = /*cpu*/ ctx[0].brand + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span0, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*cpu*/ 1 && t4_value !== (t4_value = /*cpu*/ ctx[0].speed + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span1, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*cpu*/ 1 && t8_value !== (t8_value = /*cpu*/ ctx[0].cores + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span2, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*cpu*/ 1 && t11_value !== (t11_value = /*cpu*/ ctx[0].socket + "")) set_data_dev(t11, t11_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span3, "color", /*$settings*/ ctx[1].fontColor2);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(22:4) {#if cpu}",
    		ctx
    	});

    	return block;
    }

    // (18:0) <Shell      title={"CPU Information"}      tooltip={"Information about the CPU"}  >
    function create_default_slot$a(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$a, create_else_block$9];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*cpu*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$a.name,
    		type: "slot",
    		source: "(18:0) <Shell      title={\\\"CPU Information\\\"}      tooltip={\\\"Information about the CPU\\\"}  >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "CPU Information",
    				tooltip: "Information about the CPU",
    				$$slots: { default: [create_default_slot$a] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope, $settings, cpu*/ 11) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let $settings;
    	validate_store(settings, "settings");
    	component_subscribe($$self, settings, $$value => $$invalidate(1, $settings = $$value));
    	const { ipcRenderer } = require("electron");
    	let cpu;
    	ipcRenderer.send("get-cpu-info");

    	ipcRenderer.on("get-cpu-info", (e, cpuInfo) => {
    		$$invalidate(0, cpu = cpuInfo);
    	});

    	$$self.$capture_state = () => ({
    		Shell,
    		Loader,
    		settings,
    		ipcRenderer,
    		cpu,
    		require,
    		$settings
    	});

    	$$self.$inject_state = $$props => {
    		if ("cpu" in $$props) $$invalidate(0, cpu = $$props.cpu);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [cpu, $settings];
    }

    class Cpu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cpu",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    /* src\Components\System\Cpu\Speed.svelte generated by Svelte v3.19.1 */
    const file$i = "src\\Components\\System\\Cpu\\Speed.svelte";

    // (26:8) {#if cpuSpeed}
    function create_if_block$b(ctx) {
    	let div4;
    	let div1;
    	let p0;
    	let t1;
    	let div0;
    	let p1;
    	let t2_value = /*cpuSpeed*/ ctx[0].min + "";
    	let t2;
    	let t3;
    	let t4;
    	let div3;
    	let p2;
    	let t6;
    	let div2;
    	let p3;
    	let t7_value = /*cpuSpeed*/ ctx[0].max + "";
    	let t7;
    	let t8;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = "Speed (Min)";
    			t1 = space();
    			div0 = element("div");
    			p1 = element("p");
    			t2 = text(t2_value);
    			t3 = text(" GHz");
    			t4 = space();
    			div3 = element("div");
    			p2 = element("p");
    			p2.textContent = "Speed (Max)";
    			t6 = space();
    			div2 = element("div");
    			p3 = element("p");
    			t7 = text(t7_value);
    			t8 = text(" GHz");
    			attr_dev(p0, "class", "text-white font-thin text-lg text-xl");
    			add_location(p0, file$i, 29, 12, 756);
    			attr_dev(p1, "class", "font-bold text-white text-2xl");
    			add_location(p1, file$i, 31, 16, 880);
    			attr_dev(div0, "class", "flex flex-row");
    			add_location(div0, file$i, 30, 14, 835);
    			attr_dev(div1, "class", "flex flex-col items-center text-gray-50 pr-8");
    			add_location(div1, file$i, 28, 12, 684);
    			attr_dev(p2, "class", "text-white font-thin text-lg text-xl");
    			add_location(p2, file$i, 36, 12, 1074);
    			attr_dev(p3, "class", "font-bold text-white text-2xl");
    			add_location(p3, file$i, 38, 16, 1198);
    			attr_dev(div2, "class", "flex flex-row");
    			add_location(div2, file$i, 37, 14, 1153);
    			attr_dev(div3, "class", "flex flex-col items-center text-gray-50 pl-8");
    			add_location(div3, file$i, 35, 12, 1002);
    			attr_dev(div4, "class", "flex flex-row justify-center mt-1");
    			add_location(div4, file$i, 26, 8, 620);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div1);
    			append_dev(div1, p0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, p1);
    			append_dev(p1, t2);
    			append_dev(p1, t3);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, p2);
    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			append_dev(div2, p3);
    			append_dev(p3, t7);
    			append_dev(p3, t8);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cpuSpeed*/ 1 && t2_value !== (t2_value = /*cpuSpeed*/ ctx[0].min + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*cpuSpeed*/ 1 && t7_value !== (t7_value = /*cpuSpeed*/ ctx[0].max + "")) set_data_dev(t7, t7_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$b.name,
    		type: "if",
    		source: "(26:8) {#if cpuSpeed}",
    		ctx
    	});

    	return block;
    }

    // (24:0) <Shell title={"CPU Speed"} tooltip={"List network speed"}>
    function create_default_slot$b(ctx) {
    	let div;
    	let if_block = /*cpuSpeed*/ ctx[0] && create_if_block$b(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "flex flex-col justify-center mt-1 text-gray-50");
    			add_location(div, file$i, 24, 4, 526);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*cpuSpeed*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$b(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$b.name,
    		type: "slot",
    		source: "(24:0) <Shell title={\\\"CPU Speed\\\"} tooltip={\\\"List network speed\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "CPU Speed",
    				tooltip: "List network speed",
    				$$slots: { default: [create_default_slot$b] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope, cpuSpeed*/ 5) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let cpuSpeed;

    	setInterval(
    		() => {
    			ipcRenderer.send("get-cpu-speed");
    		},
    		1000
    	);

    	//Fixed this
    	ipcRenderer.on("get-cpu-speed", (e, speedInfo) => {
    		$$invalidate(0, cpuSpeed = speedInfo);
    	}); //console.log(cpuSpeed)

    	$$self.$capture_state = () => ({
    		Shell,
    		Loader,
    		ipcRenderer,
    		cpuSpeed,
    		require,
    		setInterval
    	});

    	$$self.$inject_state = $$props => {
    		if ("cpuSpeed" in $$props) $$invalidate(0, cpuSpeed = $$props.cpuSpeed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [cpuSpeed];
    }

    class Speed extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Speed",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* src\Components\System\Disk\Disk.svelte generated by Svelte v3.19.1 */
    const file$j = "src\\Components\\System\\Disk\\Disk.svelte";

    // (77:8) {:else}
    function create_else_block$a(ctx) {
    	let div;
    	let current;
    	const loader = new Loader({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(loader.$$.fragment);
    			attr_dev(div, "class", "flex flex-row justify-center");
    			add_location(div, file$j, 77, 8, 2290);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(loader, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(loader);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$a.name,
    		type: "else",
    		source: "(77:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (73:8) {#if disk}
    function create_if_block$c(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Disk Space in GB";
    			attr_dev(p, "class", "text-center text-sm mt-2");
    			add_location(p, file$j, 73, 8, 2183);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$c.name,
    		type: "if",
    		source: "(73:8) {#if disk}",
    		ctx
    	});

    	return block;
    }

    // (64:0) <Shell      title={"Disk Space"}      tooltip={"Disk Space plotted on a Pie chart"}  >
    function create_default_slot$c(ctx) {
    	let div;
    	let canvas;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$c, create_else_block$a];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*disk*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			canvas = element("canvas");
    			t = space();
    			if_block.c();
    			attr_dev(canvas, "id", "disk-doughnut");
    			add_location(canvas, file$j, 71, 8, 2124);
    			attr_dev(div, "class", "w-4/5 md:w-1/2 mx-auto");
    			attr_dev(div, "id", "canvas-container");
    			add_location(div, file$j, 67, 4, 2032);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, canvas);
    			append_dev(div, t);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$c.name,
    		type: "slot",
    		source: "(64:0) <Shell      title={\\\"Disk Space\\\"}      tooltip={\\\"Disk Space plotted on a Pie chart\\\"}  >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "Disk Space",
    				tooltip: "Disk Space plotted on a Pie chart",
    				$$slots: { default: [create_default_slot$c] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope, disk*/ 9) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let disk;
    	let diskChart;

    	// Editing Here
    	onMount(() => {
    		// setInterval(()=>{
    		const canvas = document.getElementById("disk-doughnut");

    		const ctx = canvas.getContext("2d");
    		ipcRenderer.send("get-disk-usage");

    		ipcRenderer.on("get-disk-usage", (e, dInfo) => {
    			$$invalidate(0, disk = dInfo);
    			console.log(disk);
    			if (diskChart) diskChart.destroy();

    			diskChart = new Chart(ctx,
    			{
    					type: "pie",
    					options: {
    						animation: { duration: 0 },
    						color: "rgb(249, 250, 251)"
    					},
    					data: {
    						labels: ["Used Space", "Free Space"],
    						datasets: [
    							{
    								label: "Disk Usage Monitor",
    								data: [
    									disk.total / Math.pow(10, 9) - disk.free / Math.pow(10, 9),
    									disk.free / Math.pow(10, 9)
    								],
    								backgroundColor: ["rgb(167, 139, 250)", "rgb(124, 58, 237)", "rgb(91, 33, 182)"],
    								hoverOffset: 0,
    								borderColor: "#000000",
    								borderWidth: 0.5
    							}
    						]
    					}
    				});
    		});

    		// },2000);
    		// onDestroy
    		return () => {
    			diskChart.destroy();
    		};
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		Shell,
    		Loader,
    		settings,
    		ipcRenderer,
    		disk,
    		diskChart,
    		require,
    		document,
    		console,
    		Chart,
    		Math
    	});

    	$$self.$inject_state = $$props => {
    		if ("disk" in $$props) $$invalidate(0, disk = $$props.disk);
    		if ("diskChart" in $$props) diskChart = $$props.diskChart;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [disk];
    }

    class Disk extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Disk",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    /* src\Components\System\Graphics\Graphics.svelte generated by Svelte v3.19.1 */
    const file$k = "src\\Components\\System\\Graphics\\Graphics.svelte";

    // (35:4) {:else}
    function create_else_block$b(ctx) {
    	let div;
    	let current;
    	const loader = new Loader({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(loader.$$.fragment);
    			attr_dev(div, "class", "flex flex-row justify-center");
    			add_location(div, file$k, 35, 4, 1908);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(loader, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(loader);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$b.name,
    		type: "else",
    		source: "(35:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (22:4) {#if graphics}
    function create_if_block$d(ctx) {
    	let div;
    	let p0;
    	let t0;
    	let span0;
    	let t1_value = /*graphics*/ ctx[0].model + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3;
    	let span1;
    	let t4_value = /*graphics*/ ctx[0].vendor + "";
    	let t4;
    	let t5;
    	let p2;
    	let t6;
    	let span2;
    	let t7_value = /*graphics*/ ctx[0].bus + "";
    	let t7;
    	let t8;
    	let p3;
    	let t9;
    	let span3;
    	let t10_value = /*graphics*/ ctx[0].vram + "";
    	let t10;
    	let t11;
    	let t12;
    	let p4;
    	let t13;
    	let span4;
    	let t14_value = /*graphics*/ ctx[0].connection + "";
    	let t14;
    	let t15;
    	let p5;
    	let t16;
    	let span5;
    	let t17_value = /*graphics*/ ctx[0].display + "";
    	let t17;
    	let t18;
    	let p6;
    	let t19;
    	let span6;
    	let t20_value = /*graphics*/ ctx[0].refresh + "";
    	let t20;
    	let t21;
    	let t22;
    	let p7;
    	let t23;
    	let span7;
    	let t24_value = /*graphics*/ ctx[0].resx + "";
    	let t24;
    	let t25;
    	let p8;
    	let t26;
    	let span8;
    	let t27_value = /*graphics*/ ctx[0].resy + "";
    	let t27;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			t0 = text("• Model:");
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text("• Vendor:");
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			p2 = element("p");
    			t6 = text("• Bus:");
    			span2 = element("span");
    			t7 = text(t7_value);
    			t8 = space();
    			p3 = element("p");
    			t9 = text("• VRAM:");
    			span3 = element("span");
    			t10 = text(t10_value);
    			t11 = text(" Mb");
    			t12 = space();
    			p4 = element("p");
    			t13 = text("• Connection:");
    			span4 = element("span");
    			t14 = text(t14_value);
    			t15 = space();
    			p5 = element("p");
    			t16 = text("• Display Model:");
    			span5 = element("span");
    			t17 = text(t17_value);
    			t18 = space();
    			p6 = element("p");
    			t19 = text("• Refresh Rate:");
    			span6 = element("span");
    			t20 = text(t20_value);
    			t21 = text(" Hz");
    			t22 = space();
    			p7 = element("p");
    			t23 = text("• Resolution(X):");
    			span7 = element("span");
    			t24 = text(t24_value);
    			t25 = space();
    			p8 = element("p");
    			t26 = text("• Resolution(Y):");
    			span8 = element("span");
    			t27 = text(t27_value);
    			attr_dev(span0, "class", "ml-2 font-semibold text-lg");
    			set_style(span0, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span0, file$k, 23, 25, 659);
    			add_location(p0, file$k, 23, 8, 642);
    			attr_dev(span1, "class", "ml-2 font-semibold text-lg");
    			set_style(span1, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span1, file$k, 24, 26, 794);
    			add_location(p1, file$k, 24, 8, 776);
    			attr_dev(span2, "class", "ml-2 font-semibold text-lg");
    			set_style(span2, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span2, file$k, 25, 23, 926);
    			add_location(p2, file$k, 25, 8, 911);
    			attr_dev(span3, "class", "ml-2 font-semibold text-lg");
    			set_style(span3, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span3, file$k, 26, 24, 1056);
    			add_location(p3, file$k, 26, 8, 1040);
    			attr_dev(span4, "class", "ml-2 font-semibold text-lg");
    			set_style(span4, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span4, file$k, 27, 30, 1196);
    			add_location(p4, file$k, 27, 8, 1174);
    			attr_dev(span5, "class", "ml-2 font-semibold text-lg");
    			set_style(span5, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span5, file$k, 28, 33, 1342);
    			add_location(p5, file$k, 28, 8, 1317);
    			attr_dev(span6, "class", "ml-2 font-semibold text-lg");
    			set_style(span6, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span6, file$k, 29, 32, 1484);
    			add_location(p6, file$k, 29, 8, 1460);
    			attr_dev(span7, "class", "ml-2 font-semibold text-lg");
    			set_style(span7, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span7, file$k, 30, 33, 1630);
    			add_location(p7, file$k, 30, 8, 1605);
    			attr_dev(span8, "class", "ml-2 font-semibold text-lg");
    			set_style(span8, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span8, file$k, 31, 33, 1770);
    			add_location(p8, file$k, 31, 8, 1745);
    			attr_dev(div, "class", "pl-2 flex flex-col items-start text-gray-50");
    			add_location(div, file$k, 22, 4, 575);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(p0, span0);
    			append_dev(span0, t1);
    			append_dev(div, t2);
    			append_dev(div, p1);
    			append_dev(p1, t3);
    			append_dev(p1, span1);
    			append_dev(span1, t4);
    			append_dev(div, t5);
    			append_dev(div, p2);
    			append_dev(p2, t6);
    			append_dev(p2, span2);
    			append_dev(span2, t7);
    			append_dev(div, t8);
    			append_dev(div, p3);
    			append_dev(p3, t9);
    			append_dev(p3, span3);
    			append_dev(span3, t10);
    			append_dev(span3, t11);
    			append_dev(div, t12);
    			append_dev(div, p4);
    			append_dev(p4, t13);
    			append_dev(p4, span4);
    			append_dev(span4, t14);
    			append_dev(div, t15);
    			append_dev(div, p5);
    			append_dev(p5, t16);
    			append_dev(p5, span5);
    			append_dev(span5, t17);
    			append_dev(div, t18);
    			append_dev(div, p6);
    			append_dev(p6, t19);
    			append_dev(p6, span6);
    			append_dev(span6, t20);
    			append_dev(span6, t21);
    			append_dev(div, t22);
    			append_dev(div, p7);
    			append_dev(p7, t23);
    			append_dev(p7, span7);
    			append_dev(span7, t24);
    			append_dev(div, t25);
    			append_dev(div, p8);
    			append_dev(p8, t26);
    			append_dev(p8, span8);
    			append_dev(span8, t27);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*graphics*/ 1 && t1_value !== (t1_value = /*graphics*/ ctx[0].model + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span0, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*graphics*/ 1 && t4_value !== (t4_value = /*graphics*/ ctx[0].vendor + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span1, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*graphics*/ 1 && t7_value !== (t7_value = /*graphics*/ ctx[0].bus + "")) set_data_dev(t7, t7_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span2, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*graphics*/ 1 && t10_value !== (t10_value = /*graphics*/ ctx[0].vram + "")) set_data_dev(t10, t10_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span3, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*graphics*/ 1 && t14_value !== (t14_value = /*graphics*/ ctx[0].connection + "")) set_data_dev(t14, t14_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span4, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*graphics*/ 1 && t17_value !== (t17_value = /*graphics*/ ctx[0].display + "")) set_data_dev(t17, t17_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span5, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*graphics*/ 1 && t20_value !== (t20_value = /*graphics*/ ctx[0].refresh + "")) set_data_dev(t20, t20_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span6, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*graphics*/ 1 && t24_value !== (t24_value = /*graphics*/ ctx[0].resx + "")) set_data_dev(t24, t24_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span7, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*graphics*/ 1 && t27_value !== (t27_value = /*graphics*/ ctx[0].resy + "")) set_data_dev(t27, t27_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span8, "color", /*$settings*/ ctx[1].fontColor2);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$d.name,
    		type: "if",
    		source: "(22:4) {#if graphics}",
    		ctx
    	});

    	return block;
    }

    // (18:0) <Shell      title={"Graphics Card Data"}      tooltip={"Information about the Primary Graphics Driver"}  >
    function create_default_slot$d(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$d, create_else_block$b];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*graphics*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$d.name,
    		type: "slot",
    		source: "(18:0) <Shell      title={\\\"Graphics Card Data\\\"}      tooltip={\\\"Information about the Primary Graphics Driver\\\"}  >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "Graphics Card Data",
    				tooltip: "Information about the Primary Graphics Driver",
    				$$slots: { default: [create_default_slot$d] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope, $settings, graphics*/ 11) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let $settings;
    	validate_store(settings, "settings");
    	component_subscribe($$self, settings, $$value => $$invalidate(1, $settings = $$value));
    	const { ipcRenderer } = require("electron");
    	let graphics;
    	ipcRenderer.send("get-graphics-info");

    	ipcRenderer.on("get-graphics-info", (e, graphicsInfo) => {
    		$$invalidate(0, graphics = graphicsInfo);
    	});

    	$$self.$capture_state = () => ({
    		Shell,
    		Loader,
    		settings,
    		ipcRenderer,
    		graphics,
    		require,
    		$settings
    	});

    	$$self.$inject_state = $$props => {
    		if ("graphics" in $$props) $$invalidate(0, graphics = $$props.graphics);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [graphics, $settings];
    }

    class Graphics extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$k, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Graphics",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    /* src\Components\System\OS\OSinfo.svelte generated by Svelte v3.19.1 */
    const file$l = "src\\Components\\System\\OS\\OSinfo.svelte";

    // (33:4) {:else}
    function create_else_block$c(ctx) {
    	let div;
    	let current;
    	const loader = new Loader({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(loader.$$.fragment);
    			attr_dev(div, "class", "flex flex-row justify-center");
    			add_location(div, file$l, 33, 6, 1135);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(loader, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(loader);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$c.name,
    		type: "else",
    		source: "(33:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (23:4) {#if os}
    function create_if_block$e(ctx) {
    	let div;
    	let p0;
    	let t0;
    	let span0;
    	let t1_value = /*os*/ ctx[0].platform + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3;
    	let span1;
    	let t4_value = /*os*/ ctx[0].hostname + "";
    	let t4;
    	let t5;
    	let p2;
    	let t6;
    	let span2;
    	let t7_value = /*os*/ ctx[0].kernel + "";
    	let t7;
    	let t8;
    	let p3;
    	let t9;
    	let span3;
    	let t10_value = /*os*/ ctx[0].arch + "";
    	let t10;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			t0 = text("• Platform:");
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text("• Hostname:");
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			p2 = element("p");
    			t6 = text("• Kernel:");
    			span2 = element("span");
    			t7 = text(t7_value);
    			t8 = space();
    			p3 = element("p");
    			t9 = text("• Architecture:");
    			span3 = element("span");
    			t10 = text(t10_value);
    			attr_dev(span0, "class", "ml-2 font-bold text-lg");
    			set_style(span0, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span0, file$l, 24, 28, 613);
    			add_location(p0, file$l, 24, 8, 593);
    			attr_dev(span1, "class", "ml-2 font-bold text-lg");
    			set_style(span1, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span1, file$l, 25, 28, 743);
    			add_location(p1, file$l, 25, 8, 723);
    			attr_dev(span2, "class", "ml-2 font-bold text-lg");
    			set_style(span2, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span2, file$l, 27, 26, 872);
    			add_location(p2, file$l, 27, 8, 854);
    			attr_dev(span3, "class", "ml-2 font-bold text-lg");
    			set_style(span3, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span3, file$l, 29, 32, 1005);
    			add_location(p3, file$l, 29, 8, 981);
    			attr_dev(div, "class", "pl-2 flex flex-col items-start text-gray-50");
    			add_location(div, file$l, 23, 4, 526);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(p0, span0);
    			append_dev(span0, t1);
    			append_dev(div, t2);
    			append_dev(div, p1);
    			append_dev(p1, t3);
    			append_dev(p1, span1);
    			append_dev(span1, t4);
    			append_dev(div, t5);
    			append_dev(div, p2);
    			append_dev(p2, t6);
    			append_dev(p2, span2);
    			append_dev(span2, t7);
    			append_dev(div, t8);
    			append_dev(div, p3);
    			append_dev(p3, t9);
    			append_dev(p3, span3);
    			append_dev(span3, t10);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*os*/ 1 && t1_value !== (t1_value = /*os*/ ctx[0].platform + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span0, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*os*/ 1 && t4_value !== (t4_value = /*os*/ ctx[0].hostname + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span1, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*os*/ 1 && t7_value !== (t7_value = /*os*/ ctx[0].kernel + "")) set_data_dev(t7, t7_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span2, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*os*/ 1 && t10_value !== (t10_value = /*os*/ ctx[0].arch + "")) set_data_dev(t10, t10_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span3, "color", /*$settings*/ ctx[1].fontColor2);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$e.name,
    		type: "if",
    		source: "(23:4) {#if os}",
    		ctx
    	});

    	return block;
    }

    // (19:0) <Shell      title={"Operating System"}      tooltip={"Information about the operating system"}  >
    function create_default_slot$e(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$e, create_else_block$c];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*os*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$e.name,
    		type: "slot",
    		source: "(19:0) <Shell      title={\\\"Operating System\\\"}      tooltip={\\\"Information about the operating system\\\"}  >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$m(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "Operating System",
    				tooltip: "Information about the operating system",
    				$$slots: { default: [create_default_slot$e] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope, $settings, os*/ 11) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let $settings;
    	validate_store(settings, "settings");
    	component_subscribe($$self, settings, $$value => $$invalidate(1, $settings = $$value));
    	const { ipcRenderer } = require("electron");
    	let os;
    	ipcRenderer.send("get-os-info");

    	ipcRenderer.on("get-os-info", (e, osInfo) => {
    		$$invalidate(0, os = osInfo);
    	});

    	$$self.$capture_state = () => ({
    		Shell,
    		Loader,
    		settings,
    		ipcRenderer,
    		os,
    		require,
    		$settings
    	});

    	$$self.$inject_state = $$props => {
    		if ("os" in $$props) $$invalidate(0, os = $$props.os);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [os, $settings];
    }

    class OSinfo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$m, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OSinfo",
    			options,
    			id: create_fragment$m.name
    		});
    	}
    }

    /* src\Components\System\Ram\Ram.svelte generated by Svelte v3.19.1 */
    const file$m = "src\\Components\\System\\Ram\\Ram.svelte";

    // (82:8) {:else}
    function create_else_block$d(ctx) {
    	let div;
    	let current;
    	const loader = new Loader({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(loader.$$.fragment);
    			attr_dev(div, "class", "flex flex-row justify-center");
    			add_location(div, file$m, 82, 8, 2733);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(loader, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(loader);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$d.name,
    		type: "else",
    		source: "(82:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (78:8) {#if ram}
    function create_if_block$f(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Memory in GB";
    			attr_dev(p, "class", "text-center text-sm mt-2");
    			add_location(p, file$m, 78, 8, 2630);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$f.name,
    		type: "if",
    		source: "(78:8) {#if ram}",
    		ctx
    	});

    	return block;
    }

    // (69:0) <Shell      title={"Ram Monitor"}      tooltip={"RAM utilization plotted on a doughnut chart"}  >
    function create_default_slot$f(ctx) {
    	let div;
    	let canvas;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$f, create_else_block$d];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*ram*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			canvas = element("canvas");
    			t = space();
    			if_block.c();
    			attr_dev(canvas, "id", "ram-doughnut");
    			add_location(canvas, file$m, 76, 8, 2573);
    			attr_dev(div, "class", "w-4/5 md:w-1/2 mx-auto");
    			attr_dev(div, "id", "canvas-container");
    			add_location(div, file$m, 72, 4, 2481);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, canvas);
    			append_dev(div, t);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$f.name,
    		type: "slot",
    		source: "(69:0) <Shell      title={\\\"Ram Monitor\\\"}      tooltip={\\\"RAM utilization plotted on a doughnut chart\\\"}  >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$n(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "Ram Monitor",
    				tooltip: "RAM utilization plotted on a doughnut chart",
    				$$slots: { default: [create_default_slot$f] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope, ram*/ 9) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let ram;
    	let ramChart;

    	setInterval(
    		() => {
    			ipcRenderer.send("get-ram-info");
    		},
    		4000
    	);

    	// Editing Here
    	onMount(() => {
    		// setInterval(()=>{
    		ipcRenderer.send("get-ram-info");

    		const canvas = document.getElementById("ram-doughnut");
    		const ctx = canvas.getContext("2d");

    		ipcRenderer.on("get-ram-info", (e, ramInfo) => {
    			$$invalidate(0, ram = ramInfo);

    			// Create chart for RAM monitor
    			// If chart already exists, destroy it first
    			if (ramChart) ramChart.destroy();

    			ramChart = new Chart(ctx,
    			{
    					type: "doughnut",
    					options: {
    						animation: { duration: 0 },
    						cutout: "75%",
    						color: "rgb(249, 250, 251)"
    					},
    					data: {
    						labels: ["Total", "Used", "Free"],
    						datasets: [
    							{
    								label: "Ram Monitor",
    								data: [
    									Number(String(ram.total / Math.pow(2, 30)).substring(0, 3 + String(ram.total / Math.pow(2, 30)).indexOf("."))),
    									Number(String(ram.used / Math.pow(2, 30)).substring(0, 3 + String(ram.total / Math.pow(2, 30)).indexOf("."))),
    									Number(String(ram.free / Math.pow(2, 30)).substring(0, 3 + String(ram.total / Math.pow(2, 30)).indexOf(".")))
    								],
    								backgroundColor: ["rgb(91, 33, 182)", "rgb(124, 58, 237)", "rgb(167, 139, 250)"],
    								hoverOffset: 0,
    								borderColor: "#000000",
    								borderWidth: 0.5
    							}
    						]
    					}
    				});
    		});

    		// },2000);
    		// onDestroy
    		return () => {
    			ramChart.destroy();
    		};
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		Shell,
    		Loader,
    		settings,
    		ipcRenderer,
    		ram,
    		ramChart,
    		require,
    		setInterval,
    		document,
    		Chart,
    		Number,
    		String,
    		Math
    	});

    	$$self.$inject_state = $$props => {
    		if ("ram" in $$props) $$invalidate(0, ram = $$props.ram);
    		if ("ramChart" in $$props) ramChart = $$props.ramChart;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [ram];
    }

    class Ram extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$n, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ram",
    			options,
    			id: create_fragment$n.name
    		});
    	}
    }

    /* src\Components\System\Usage\Usage.svelte generated by Svelte v3.19.1 */
    const file$n = "src\\Components\\System\\Usage\\Usage.svelte";

    // (82:8) {:else}
    function create_else_block$e(ctx) {
    	let div;
    	let current;
    	const loader = new Loader({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(loader.$$.fragment);
    			attr_dev(div, "class", "flex flex-row justify-center");
    			add_location(div, file$n, 82, 8, 2364);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(loader, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(loader);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$e.name,
    		type: "else",
    		source: "(82:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (78:8) {#if use}
    function create_if_block$g(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "CPU Load in %";
    			attr_dev(p, "class", "text-center text-sm mt-2");
    			add_location(p, file$n, 78, 8, 2260);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$g.name,
    		type: "if",
    		source: "(78:8) {#if use}",
    		ctx
    	});

    	return block;
    }

    // (69:0) <Shell      title={"CPU Utilization"}      tooltip={"CPU Load plotted on a Pie chart"}  >
    function create_default_slot$g(ctx) {
    	let div;
    	let canvas;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block$g, create_else_block$e];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*use*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			canvas = element("canvas");
    			t = space();
    			if_block.c();
    			attr_dev(canvas, "id", "use-doughnut");
    			add_location(canvas, file$n, 76, 8, 2203);
    			attr_dev(div, "class", "w-4/5 md:w-1/2 mx-auto");
    			attr_dev(div, "id", "canvas-container");
    			add_location(div, file$n, 72, 4, 2111);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, canvas);
    			append_dev(div, t);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$g.name,
    		type: "slot",
    		source: "(69:0) <Shell      title={\\\"CPU Utilization\\\"}      tooltip={\\\"CPU Load plotted on a Pie chart\\\"}  >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$o(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "CPU Utilization",
    				tooltip: "CPU Load plotted on a Pie chart",
    				$$slots: { default: [create_default_slot$g] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope, use*/ 17) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let use;
    	let useChart;

    	const chartInterval = setInterval(
    		() => {
    			ipcRenderer.send("get-cpu-usage");
    		},
    		2000
    	);

    	// Editing Here
    	onMount(() => {
    		// setInterval(()=>{
    		const canvas = document.getElementById("use-doughnut");

    		const ctx = canvas.getContext("2d");
    		ipcRenderer.send("get-cpu-usage");

    		ipcRenderer.on("get-cpu-usage", (e, usageInfo) => {
    			$$invalidate(0, use = usageInfo);
    			if (useChart) useChart.destroy();

    			useChart = new Chart(ctx,
    			{
    					type: "pie",
    					options: {
    						animation: { duration: 0 },
    						color: "rgb(249, 250, 251)"
    					},
    					data: {
    						labels: ["System Load", "Load Capacity"],
    						datasets: [
    							{
    								label: "CPU Monitor",
    								data: [
    									// use.currSys ,
    									use.curr,
    									100
    								],
    								backgroundColor: ["rgb(167, 139, 250)", "rgb(124, 58, 237)", "rgb(91, 33, 182)"],
    								hoverOffset: 0,
    								borderColor: "#000000",
    								borderWidth: 0.5
    							}
    						]
    					}
    				});
    		});

    		// },2000);
    		// onDestroy
    		return () => {
    			useChart.destroy();
    			clearInterval(chartInterval);
    		};
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		Shell,
    		Loader,
    		settings,
    		ipcRenderer,
    		use,
    		useChart,
    		chartInterval,
    		require,
    		setInterval,
    		document,
    		Chart,
    		clearInterval
    	});

    	$$self.$inject_state = $$props => {
    		if ("use" in $$props) $$invalidate(0, use = $$props.use);
    		if ("useChart" in $$props) useChart = $$props.useChart;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [use];
    }

    class Usage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$o, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Usage",
    			options,
    			id: create_fragment$o.name
    		});
    	}
    }

    /* src\Components\Wifi\Info\Info.svelte generated by Svelte v3.19.1 */
    const file$o = "src\\Components\\Wifi\\Info\\Info.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (121:4) {:else}
    function create_else_block$f(ctx) {
    	let div;
    	let current;
    	const loader = new Loader({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(loader.$$.fragment);
    			attr_dev(div, "class", "flex flex-row justify-center");
    			add_location(div, file$o, 121, 4, 3597);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(loader, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(loader);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$f.name,
    		type: "else",
    		source: "(121:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (29:4) {#if info}
    function create_if_block$h(ctx) {
    	let p0;
    	let t0;
    	let div0;
    	let ul;
    	let t1;
    	let div1;
    	let p1;
    	let span0;
    	let t2;
    	let t3;
    	let span1;
    	let t4_value = /*data*/ ctx[1].ssid + "";
    	let t4;
    	let t5;
    	let p2;
    	let span2;
    	let t6;
    	let t7;
    	let span3;
    	let t8_value = /*data*/ ctx[1].bssid + "";
    	let t8;
    	let t9;
    	let p3;
    	let span4;
    	let t10;
    	let t11;
    	let span5;
    	let t13;
    	let p4;
    	let span6;
    	let t14;
    	let t15;
    	let span7;
    	let t16_value = /*data*/ ctx[1].channel + "";
    	let t16;
    	let t17;
    	let p5;
    	let span8;
    	let t18;
    	let t19;
    	let span9;
    	let t20_value = /*data*/ ctx[1].frequency + "";
    	let t20;
    	let t21;
    	let t22;
    	let p6;
    	let span10;
    	let t23;
    	let t24;
    	let span11;
    	let t25_value = /*data*/ ctx[1].security + "";
    	let t25;
    	let each_value = /*info*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = space();
    			div0 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			div1 = element("div");
    			p1 = element("p");
    			span0 = element("span");
    			t2 = text("SSID");
    			t3 = space();
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			p2 = element("p");
    			span2 = element("span");
    			t6 = text("BSSID");
    			t7 = space();
    			span3 = element("span");
    			t8 = text(t8_value);
    			t9 = space();
    			p3 = element("p");
    			span4 = element("span");
    			t10 = text("Mode");
    			t11 = space();
    			span5 = element("span");
    			span5.textContent = "N/A";
    			t13 = space();
    			p4 = element("p");
    			span6 = element("span");
    			t14 = text("Channel");
    			t15 = space();
    			span7 = element("span");
    			t16 = text(t16_value);
    			t17 = space();
    			p5 = element("p");
    			span8 = element("span");
    			t18 = text("Frequency");
    			t19 = space();
    			span9 = element("span");
    			t20 = text(t20_value);
    			t21 = text(" GHz");
    			t22 = space();
    			p6 = element("p");
    			span10 = element("span");
    			t23 = text("Security");
    			t24 = space();
    			span11 = element("span");
    			t25 = text(t25_value);
    			attr_dev(p0, "class", "text-sm");
    			set_style(p0, "color", /*$settings*/ ctx[2].fontColor2);
    			set_style(p0, "text-align", "center");
    			add_location(p0, file$o, 30, 4, 780);
    			attr_dev(ul, "class", "");
    			add_location(ul, file$o, 38, 6, 1011);
    			attr_dev(div0, "class", "flex flex-row justify-center items-center mb-2");
    			add_location(div0, file$o, 37, 4, 943);
    			attr_dev(span0, "class", " pb-1");
    			set_style(span0, "color", /*$settings*/ ctx[2].fontColor2);
    			add_location(span0, file$o, 54, 12, 1565);
    			attr_dev(span1, "class", "font-semibold text-lg");
    			add_location(span1, file$o, 60, 12, 1728);
    			attr_dev(p1, "class", "flex flex-col justify-start items-center");
    			add_location(p1, file$o, 53, 8, 1499);
    			attr_dev(span2, "class", " pb-1");
    			set_style(span2, "color", /*$settings*/ ctx[2].fontColor2);
    			add_location(span2, file$o, 65, 12, 1904);
    			attr_dev(span3, "class", "font-semibold text-lg");
    			add_location(span3, file$o, 71, 12, 2068);
    			attr_dev(p2, "class", "flex flex-col justify-start items-center");
    			add_location(p2, file$o, 64, 8, 1838);
    			attr_dev(span4, "class", " pb-1");
    			set_style(span4, "color", /*$settings*/ ctx[2].fontColor2);
    			add_location(span4, file$o, 76, 12, 2245);
    			attr_dev(span5, "class", "font-semibold text-lg");
    			add_location(span5, file$o, 82, 12, 2408);
    			attr_dev(p3, "class", "flex flex-col justify-start items-center");
    			add_location(p3, file$o, 75, 8, 2179);
    			attr_dev(span6, "class", " pb-1");
    			set_style(span6, "color", /*$settings*/ ctx[2].fontColor2);
    			add_location(span6, file$o, 87, 12, 2597);
    			attr_dev(span7, "class", "font-semibold text-lg");
    			add_location(span7, file$o, 93, 12, 2763);
    			attr_dev(p4, "class", "flex flex-col justify-start items-center");
    			add_location(p4, file$o, 86, 8, 2531);
    			attr_dev(span8, "class", " pb-1");
    			set_style(span8, "color", /*$settings*/ ctx[2].fontColor2);
    			add_location(span8, file$o, 98, 12, 2942);
    			attr_dev(span9, "class", "font-semibold text-lg");
    			add_location(span9, file$o, 104, 12, 3110);
    			attr_dev(p5, "class", "flex flex-col justify-start items-center");
    			add_location(p5, file$o, 97, 8, 2876);
    			attr_dev(span10, "class", " pb-1");
    			set_style(span10, "color", /*$settings*/ ctx[2].fontColor2);
    			add_location(span10, file$o, 109, 12, 3295);
    			attr_dev(span11, "class", "font-semibold text-lg");
    			add_location(span11, file$o, 115, 12, 3462);
    			attr_dev(p6, "class", "flex flex-col justify-start items-center");
    			add_location(p6, file$o, 108, 8, 3229);
    			attr_dev(div1, "class", "grid grid-cols-2 gap-x-2 gap-y-6");
    			add_location(div1, file$o, 52, 4, 1443);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, p1);
    			append_dev(p1, span0);
    			append_dev(span0, t2);
    			append_dev(p1, t3);
    			append_dev(p1, span1);
    			append_dev(span1, t4);
    			append_dev(div1, t5);
    			append_dev(div1, p2);
    			append_dev(p2, span2);
    			append_dev(span2, t6);
    			append_dev(p2, t7);
    			append_dev(p2, span3);
    			append_dev(span3, t8);
    			append_dev(div1, t9);
    			append_dev(div1, p3);
    			append_dev(p3, span4);
    			append_dev(span4, t10);
    			append_dev(p3, t11);
    			append_dev(p3, span5);
    			append_dev(div1, t13);
    			append_dev(div1, p4);
    			append_dev(p4, span6);
    			append_dev(span6, t14);
    			append_dev(p4, t15);
    			append_dev(p4, span7);
    			append_dev(span7, t16);
    			append_dev(div1, t17);
    			append_dev(div1, p5);
    			append_dev(p5, span8);
    			append_dev(span8, t18);
    			append_dev(p5, t19);
    			append_dev(p5, span9);
    			append_dev(span9, t20);
    			append_dev(span9, t21);
    			append_dev(div1, t22);
    			append_dev(div1, p6);
    			append_dev(p6, span10);
    			append_dev(span10, t23);
    			append_dev(p6, t24);
    			append_dev(p6, span11);
    			append_dev(span11, t25);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$settings*/ 4) {
    				set_style(p0, "color", /*$settings*/ ctx[2].fontColor2);
    			}

    			if (dirty & /*displayInfo, info*/ 9) {
    				each_value = /*info*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*$settings*/ 4) {
    				set_style(span0, "color", /*$settings*/ ctx[2].fontColor2);
    			}

    			if (dirty & /*data*/ 2 && t4_value !== (t4_value = /*data*/ ctx[1].ssid + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*$settings*/ 4) {
    				set_style(span2, "color", /*$settings*/ ctx[2].fontColor2);
    			}

    			if (dirty & /*data*/ 2 && t8_value !== (t8_value = /*data*/ ctx[1].bssid + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*$settings*/ 4) {
    				set_style(span4, "color", /*$settings*/ ctx[2].fontColor2);
    			}

    			if (dirty & /*$settings*/ 4) {
    				set_style(span6, "color", /*$settings*/ ctx[2].fontColor2);
    			}

    			if (dirty & /*data*/ 2 && t16_value !== (t16_value = /*data*/ ctx[1].channel + "")) set_data_dev(t16, t16_value);

    			if (dirty & /*$settings*/ 4) {
    				set_style(span8, "color", /*$settings*/ ctx[2].fontColor2);
    			}

    			if (dirty & /*data*/ 2 && t20_value !== (t20_value = /*data*/ ctx[1].frequency + "")) set_data_dev(t20, t20_value);

    			if (dirty & /*$settings*/ 4) {
    				set_style(span10, "color", /*$settings*/ ctx[2].fontColor2);
    			}

    			if (dirty & /*data*/ 2 && t25_value !== (t25_value = /*data*/ ctx[1].security + "")) set_data_dev(t25, t25_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div0);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$h.name,
    		type: "if",
    		source: "(29:4) {#if info}",
    		ctx
    	});

    	return block;
    }

    // (41:10) {#each info as wifi}
    function create_each_block$4(ctx) {
    	let li;
    	let t0_value = /*wifi*/ ctx[6].ssid + "";
    	let t0;
    	let t1;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[5](/*wifi*/ ctx[6], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(li, "class", "text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-semibold hover:bg-purple-600 cursor-pointer inline-block");
    			add_location(li, file$o, 41, 10, 1100);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    			dispose = listen_dev(li, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*info*/ 1 && t0_value !== (t0_value = /*wifi*/ ctx[6].ssid + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(41:10) {#each info as wifi}",
    		ctx
    	});

    	return block;
    }

    // (25:0) <Shell      title={"Wifi Connections"}      tooltip={"General wifi related information"}  >
    function create_default_slot$h(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$h, create_else_block$f];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*info*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$h.name,
    		type: "slot",
    		source: "(25:0) <Shell      title={\\\"Wifi Connections\\\"}      tooltip={\\\"General wifi related information\\\"}  >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$p(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "Wifi Connections",
    				tooltip: "General wifi related information",
    				$$slots: { default: [create_default_slot$h] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope, data, $settings, info*/ 519) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	let $settings;
    	validate_store(settings, "settings");
    	component_subscribe($$self, settings, $$value => $$invalidate(2, $settings = $$value));
    	const { ipcRenderer } = require("electron");
    	let info, data;
    	ipcRenderer.send("get-wifi-info");

    	ipcRenderer.on("get-wifi-info", (e, wifiInfo) => {
    		$$invalidate(0, info = wifiInfo);
    		$$invalidate(1, data = info[0]);
    	});

    	// Function to display information for selected wifi connection
    	const displayInfo = ssid => {
    		$$invalidate(1, data = info.filter(item => item.ssid === ssid)[0]);
    	};

    	const click_handler = wifi => displayInfo(wifi.ssid);

    	$$self.$capture_state = () => ({
    		Shell,
    		Loader,
    		settings,
    		ipcRenderer,
    		info,
    		data,
    		displayInfo,
    		require,
    		$settings
    	});

    	$$self.$inject_state = $$props => {
    		if ("info" in $$props) $$invalidate(0, info = $$props.info);
    		if ("data" in $$props) $$invalidate(1, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [info, data, $settings, displayInfo, ipcRenderer, click_handler];
    }

    class Info extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$o, create_fragment$p, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Info",
    			options,
    			id: create_fragment$p.name
    		});
    	}
    }

    /* src\Components\Wifi\Interfaces\Interfaces.svelte generated by Svelte v3.19.1 */
    const file$p = "src\\Components\\Wifi\\Interfaces\\Interfaces.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i].id;
    	child_ctx[4] = i;
    	return child_ctx;
    }

    // (26:4) {:else}
    function create_else_block_2$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Fetching Required Info...";
    			add_location(p, file$p, 26, 8, 888);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2$1.name,
    		type: "else",
    		source: "(26:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:4) {#if interfaces}
    function create_if_block$i(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*interfaces*/ ctx[0].length > 0) return create_if_block_1$6;
    		return create_else_block_1$4;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$i.name,
    		type: "if",
    		source: "(14:4) {#if interfaces}",
    		ctx
    	});

    	return block;
    }

    // (23:8) {:else}
    function create_else_block_1$4(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Couldn't find any interfaces.";
    			add_location(p, file$p, 23, 12, 814);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$4.name,
    		type: "else",
    		source: "(23:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (15:8) {#if interfaces.length > 0}
    function create_if_block_1$6(ctx) {
    	let if_block_anchor;

    	function select_block_type_2(ctx, dirty) {
    		if (/*interfaces*/ ctx[0].length > 1) return create_if_block_2$3;
    		return create_else_block$g;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$6.name,
    		type: "if",
    		source: "(15:8) {#if interfaces.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (20:12) {:else}
    function create_else_block$g(ctx) {
    	let p;
    	let t0;
    	let span;
    	let t1_value = /*interfaces*/ ctx[0].id + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("ID: ");
    			span = element("span");
    			t1 = text(t1_value);
    			attr_dev(span, "class", "font-bold text-lg");
    			add_location(span, file$p, 20, 23, 703);
    			add_location(p, file$p, 20, 16, 696);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, span);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*interfaces*/ 1 && t1_value !== (t1_value = /*interfaces*/ ctx[0].id + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$g.name,
    		type: "else",
    		source: "(20:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (16:12) {#if interfaces.length > 1}
    function create_if_block_2$3(ctx) {
    	let each_1_anchor;
    	let each_value = /*interfaces*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*interfaces*/ 1) {
    				each_value = /*interfaces*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(16:12) {#if interfaces.length > 1}",
    		ctx
    	});

    	return block;
    }

    // (17:16) {#each interfaces as {id}
    function create_each_block$5(ctx) {
    	let p;
    	let t0_value = /*_id*/ ctx[4] + 1 + "";
    	let t0;
    	let t1;
    	let span;
    	let t2_value = /*id*/ ctx[2] + "";
    	let t2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = text(". ");
    			span = element("span");
    			t2 = text(t2_value);
    			attr_dev(span, "class", "font-bold text-lg");
    			add_location(span, file$p, 17, 28, 585);
    			add_location(p, file$p, 17, 16, 573);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, span);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*interfaces*/ 1 && t2_value !== (t2_value = /*id*/ ctx[2] + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(17:16) {#each interfaces as {id}",
    		ctx
    	});

    	return block;
    }

    // (12:0) <Shell title={"Wifi Interfaces"} tooltip={"List of available wifi interfaces"}>
    function create_default_slot$i(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*interfaces*/ ctx[0]) return create_if_block$i;
    		return create_else_block_2$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "text-gray-50");
    			add_location(div, file$p, 12, 4, 380);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$i.name,
    		type: "slot",
    		source: "(12:0) <Shell title={\\\"Wifi Interfaces\\\"} tooltip={\\\"List of available wifi interfaces\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$q(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "Wifi Interfaces",
    				tooltip: "List of available wifi interfaces",
    				$$slots: { default: [create_default_slot$i] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope, interfaces*/ 33) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$p($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let interfaces;
    	ipcRenderer.send("get-wifi-interfaces");

    	ipcRenderer.on("get-wifi-interfaces", (e, wifiInfo) => {
    		$$invalidate(0, interfaces = wifiInfo);
    	});

    	$$self.$capture_state = () => ({ ipcRenderer, Shell, interfaces, require });

    	$$self.$inject_state = $$props => {
    		if ("interfaces" in $$props) $$invalidate(0, interfaces = $$props.interfaces);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [interfaces];
    }

    class Interfaces extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$p, create_fragment$q, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Interfaces",
    			options,
    			id: create_fragment$q.name
    		});
    	}
    }

    /* src\Components\Wifi\Ssid\Ssid.svelte generated by Svelte v3.19.1 */
    const file$q = "src\\Components\\Wifi\\Ssid\\Ssid.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i].ssid;
    	child_ctx[3] = i;
    	return child_ctx;
    }

    // (22:4) {:else}
    function create_else_block_1$5(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Fetching Required Info...";
    			add_location(p, file$q, 22, 8, 694);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$5.name,
    		type: "else",
    		source: "(22:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:4) {#if ssid}
    function create_if_block$j(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*ssid*/ ctx[0].length > 1) return create_if_block_1$7;
    		return create_else_block$h;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$j.name,
    		type: "if",
    		source: "(14:4) {#if ssid}",
    		ctx
    	});

    	return block;
    }

    // (19:8) {:else}
    function create_else_block$h(ctx) {
    	let p;
    	let t0;
    	let span;
    	let t1_value = /*ssid*/ ctx[0].ssid + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("SSID: ");
    			span = element("span");
    			t1 = text(t1_value);
    			attr_dev(span, "class", "font-bold text-lg");
    			add_location(span, file$q, 19, 17, 602);
    			add_location(p, file$q, 19, 8, 593);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, span);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ssid*/ 1 && t1_value !== (t1_value = /*ssid*/ ctx[0].ssid + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$h.name,
    		type: "else",
    		source: "(19:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (15:8) {#if ssid.length > 1}
    function create_if_block_1$7(ctx) {
    	let each_1_anchor;
    	let each_value = /*ssid*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ssid*/ 1) {
    				each_value = /*ssid*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$7.name,
    		type: "if",
    		source: "(15:8) {#if ssid.length > 1}",
    		ctx
    	});

    	return block;
    }

    // (16:12) {#each ssid as {ssid}
    function create_each_block$6(ctx) {
    	let p;
    	let t0_value = /*_id*/ ctx[3] + 1 + "";
    	let t0;
    	let t1;
    	let span;
    	let t2_value = /*ssid*/ ctx[0] + "";
    	let t2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = text(". ");
    			span = element("span");
    			t2 = text(t2_value);
    			attr_dev(span, "class", "font-bold text-lg");
    			add_location(span, file$q, 16, 24, 496);
    			add_location(p, file$q, 16, 12, 484);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, span);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ssid*/ 1 && t2_value !== (t2_value = /*ssid*/ ctx[0] + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(16:12) {#each ssid as {ssid}",
    		ctx
    	});

    	return block;
    }

    // (12:0) <Shell title={"Wifi Networks"} tooltip={"SSID of all available wifi networks"}>
    function create_default_slot$j(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*ssid*/ ctx[0]) return create_if_block$j;
    		return create_else_block_1$5;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "text-gray-50");
    			add_location(div, file$q, 12, 4, 356);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$j.name,
    		type: "slot",
    		source: "(12:0) <Shell title={\\\"Wifi Networks\\\"} tooltip={\\\"SSID of all available wifi networks\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$r(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "Wifi Networks",
    				tooltip: "SSID of all available wifi networks",
    				$$slots: { default: [create_default_slot$j] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(shell.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(shell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const shell_changes = {};

    			if (dirty & /*$$scope, ssid*/ 17) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$r.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$q($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let ssid;
    	ipcRenderer.send("get-wifi-info");

    	ipcRenderer.on("get-wifi-info", (e, wifiInfo) => {
    		$$invalidate(0, ssid = wifiInfo);
    	});

    	$$self.$capture_state = () => ({ ipcRenderer, Shell, ssid, require });

    	$$self.$inject_state = $$props => {
    		if ("ssid" in $$props) $$invalidate(0, ssid = $$props.ssid);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [ssid];
    }

    class Ssid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$q, create_fragment$r, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ssid",
    			options,
    			id: create_fragment$r.name
    		});
    	}
    }

    /* src\Pages\_main.svelte generated by Svelte v3.19.1 */
    const file$r = "src\\Pages\\_main.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i].name;
    	child_ctx[3] = list[i].component;
    	return child_ctx;
    }

    // (120:4) {:else}
    function create_else_block$i(ctx) {
    	let h2;
    	let t0;
    	let t1;
    	let div;
    	let current;
    	let each_value = /*components*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text("Favourite Widgets");
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h2, "class", "text-center text-2xl mt-4 px-6 font-medium");
    			set_style(h2, "color", /*$settings*/ ctx[0].fontColor1);
    			add_location(h2, file$r, 120, 4, 3757);
    			attr_dev(div, "class", "p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4");
    			add_location(div, file$r, 123, 4, 3892);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*$settings*/ 1) {
    				set_style(h2, "color", /*$settings*/ ctx[0].fontColor1);
    			}

    			if (dirty & /*components, checkInStorage*/ 2) {
    				each_value = /*components*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$7(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$i.name,
    		type: "else",
    		source: "(120:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (114:4) {#if !localStorage.favorites}
    function create_if_block$k(ctx) {
    	let div;
    	let h2;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			t = text("You do not have any favourite widgets.");
    			attr_dev(h2, "class", "text-lg font-semibold");
    			set_style(h2, "color", /*$settings*/ ctx[0].fontColor1);
    			add_location(h2, file$r, 115, 6, 3593);
    			attr_dev(div, "class", "flex flex-col justify-center items-center h-full");
    			add_location(div, file$r, 114, 4, 3523);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(h2, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$settings*/ 1) {
    				set_style(h2, "color", /*$settings*/ ctx[0].fontColor1);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$k.name,
    		type: "if",
    		source: "(114:4) {#if !localStorage.favorites}",
    		ctx
    	});

    	return block;
    }

    // (127:6) {#if checkInStorage(name)}
    function create_if_block_1$8(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[3];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (switch_value !== (switch_value = /*component*/ ctx[3])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$8.name,
    		type: "if",
    		source: "(127:6) {#if checkInStorage(name)}",
    		ctx
    	});

    	return block;
    }

    // (126:6) {#each components as {name, component}}
    function create_each_block$7(ctx) {
    	let show_if = checkInStorage$1(/*name*/ ctx[2]);
    	let if_block_anchor;
    	let current;
    	let if_block = show_if && create_if_block_1$8(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (show_if) if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(126:6) {#each components as {name, component}}",
    		ctx
    	});

    	return block;
    }

    // (111:0) <Page>
    function create_default_slot$k(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$k, create_else_block$i];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!localStorage.favorites) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type();
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$k.name,
    		type: "slot",
    		source: "(111:0) <Page>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$s(ctx) {
    	let current;

    	const page = new Page({
    			props: {
    				$$slots: { default: [create_default_slot$k] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(page.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(page, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const page_changes = {};

    			if (dirty & /*$$scope, $settings*/ 65) {
    				page_changes.$$scope = { dirty, ctx };
    			}

    			page.$set(page_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(page.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(page.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(page, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$s.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function checkInStorage$1(component) {
    	const favorites = localStorage.favorites;
    	if (strToArr$1(favorites).some(item => item === component)) return true; else return false;
    }

    // Helper function
    function strToArr$1(str) {
    	if (!str) return [];
    	return str.split(",");
    }

    function instance$r($$self, $$props, $$invalidate) {
    	let $settings;
    	validate_store(settings, "settings");
    	component_subscribe($$self, settings, $$value => $$invalidate(0, $settings = $$value));

    	const components = [
    		{ name: "Ping Tool", component: Ping },
    		{ name: "IP Lookup", component: IPTools },
    		{
    			name: "Available Interfaces",
    			component: NetworkInterfaces
    		},
    		{ name: "DNS Lookup", component: Dns },
    		{ name: "Port Scanning", component: Ports },
    		{ name: "Netstat", component: Netstat },
    		{
    			name: "SSL Checker",
    			component: SslChecker
    		},
    		{
    			name: "Wifi Information",
    			component: Info
    		},
    		{
    			name: "Password Checker",
    			component: PasswordStrength
    		},
    		{
    			name: "Network Speed",
    			component: NetworkSpeed
    		},
    		{ name: "CPU Information", component: Cpu },
    		{
    			name: "Operating System",
    			component: OSinfo
    		},
    		{ name: "Ram Monitor", component: Ram },
    		{
    			name: "Graphics Card Data",
    			component: Graphics
    		},
    		{ name: "Disk Space", component: Disk },
    		{
    			name: "CPU Utilization",
    			component: Usage
    		}
    	];

    	$$self.$capture_state = () => ({
    		Page,
    		settings,
    		Greeting,
    		Netstat,
    		NetworkSpeed,
    		PasswordStrength,
    		SslChecker,
    		Dns,
    		IpTools: IPTools,
    		NetworkInterfaces,
    		Ping,
    		Ports,
    		Whois,
    		Cpu,
    		Speed,
    		Disk,
    		Graphics,
    		OSinfo,
    		Ram,
    		Usage,
    		Info,
    		Interfaces,
    		Ssid,
    		components,
    		checkInStorage: checkInStorage$1,
    		strToArr: strToArr$1,
    		localStorage,
    		$settings
    	});

    	return [$settings, components];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$r, create_fragment$s, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$s.name
    		});
    	}
    }

    /* src\Pages\_network.svelte generated by Svelte v3.19.1 */
    const file$s = "src\\Pages\\_network.svelte";

    // (14:0) <Page _currPage="Network">
    function create_default_slot$l(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let current;
    	const ping = new Ping({ $$inline: true });
    	const iptools = new IPTools({ $$inline: true });
    	const networkinterfaces = new NetworkInterfaces({ $$inline: true });
    	const dns = new Dns({ $$inline: true });
    	const ports = new Ports({ $$inline: true });
    	const netstat = new Netstat({ $$inline: true });
    	const sslchecker = new SslChecker({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(ping.$$.fragment);
    			t0 = space();
    			create_component(iptools.$$.fragment);
    			t1 = space();
    			create_component(networkinterfaces.$$.fragment);
    			t2 = space();
    			create_component(dns.$$.fragment);
    			t3 = space();
    			create_component(ports.$$.fragment);
    			t4 = space();
    			create_component(netstat.$$.fragment);
    			t5 = space();
    			create_component(sslchecker.$$.fragment);
    			attr_dev(div0, "class", "col-span-1 md:col-span-2 xl:col-span-3");
    			add_location(div0, file$s, 15, 6, 715);
    			attr_dev(div1, "class", "p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4");
    			add_location(div1, file$s, 14, 4, 637);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(ping, div0, null);
    			append_dev(div1, t0);
    			mount_component(iptools, div1, null);
    			append_dev(div1, t1);
    			mount_component(networkinterfaces, div1, null);
    			append_dev(div1, t2);
    			mount_component(dns, div1, null);
    			append_dev(div1, t3);
    			mount_component(ports, div1, null);
    			append_dev(div1, t4);
    			mount_component(netstat, div1, null);
    			append_dev(div1, t5);
    			mount_component(sslchecker, div1, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ping.$$.fragment, local);
    			transition_in(iptools.$$.fragment, local);
    			transition_in(networkinterfaces.$$.fragment, local);
    			transition_in(dns.$$.fragment, local);
    			transition_in(ports.$$.fragment, local);
    			transition_in(netstat.$$.fragment, local);
    			transition_in(sslchecker.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ping.$$.fragment, local);
    			transition_out(iptools.$$.fragment, local);
    			transition_out(networkinterfaces.$$.fragment, local);
    			transition_out(dns.$$.fragment, local);
    			transition_out(ports.$$.fragment, local);
    			transition_out(netstat.$$.fragment, local);
    			transition_out(sslchecker.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(ping);
    			destroy_component(iptools);
    			destroy_component(networkinterfaces);
    			destroy_component(dns);
    			destroy_component(ports);
    			destroy_component(netstat);
    			destroy_component(sslchecker);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$l.name,
    		type: "slot",
    		source: "(14:0) <Page _currPage=\\\"Network\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$t(ctx) {
    	let current;

    	const page = new Page({
    			props: {
    				_currPage: "Network",
    				$$slots: { default: [create_default_slot$l] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(page.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(page, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const page_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				page_changes.$$scope = { dirty, ctx };
    			}

    			page.$set(page_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(page.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(page.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(page, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$t.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$s($$self, $$props, $$invalidate) {
    	$$self.$capture_state = () => ({
    		Page,
    		Ping,
    		IPTools,
    		NetworkInterfaces,
    		Dns,
    		Ports,
    		SslChecker,
    		Netstat
    	});

    	return [];
    }

    class Network extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$s, create_fragment$t, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Network",
    			options,
    			id: create_fragment$t.name
    		});
    	}
    }

    /* src\Pages\_diagnostics.svelte generated by Svelte v3.19.1 */
    const file$t = "src\\Pages\\_diagnostics.svelte";

    // (10:0) <Page _currPage="Diagnostics">
    function create_default_slot$m(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let current;
    	const info = new Info({ $$inline: true });
    	const passwordstrength = new PasswordStrength({ $$inline: true });
    	const networkspeed = new NetworkSpeed({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(info.$$.fragment);
    			t0 = space();
    			create_component(passwordstrength.$$.fragment);
    			t1 = space();
    			create_component(networkspeed.$$.fragment);
    			attr_dev(div, "class", "p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4");
    			add_location(div, file$t, 10, 4, 372);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(info, div, null);
    			append_dev(div, t0);
    			mount_component(passwordstrength, div, null);
    			append_dev(div, t1);
    			mount_component(networkspeed, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.$$.fragment, local);
    			transition_in(passwordstrength.$$.fragment, local);
    			transition_in(networkspeed.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(info.$$.fragment, local);
    			transition_out(passwordstrength.$$.fragment, local);
    			transition_out(networkspeed.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(info);
    			destroy_component(passwordstrength);
    			destroy_component(networkspeed);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$m.name,
    		type: "slot",
    		source: "(10:0) <Page _currPage=\\\"Diagnostics\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$u(ctx) {
    	let current;

    	const page = new Page({
    			props: {
    				_currPage: "Diagnostics",
    				$$slots: { default: [create_default_slot$m] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(page.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(page, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const page_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				page_changes.$$scope = { dirty, ctx };
    			}

    			page.$set(page_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(page.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(page.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(page, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$u.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$t($$self, $$props, $$invalidate) {
    	$$self.$capture_state = () => ({
    		Page,
    		PasswordStrength,
    		NetworkSpeed,
    		Info
    	});

    	return [];
    }

    class Diagnostics extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$t, create_fragment$u, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Diagnostics",
    			options,
    			id: create_fragment$u.name
    		});
    	}
    }

    /* src\Pages\_system.svelte generated by Svelte v3.19.1 */
    const file$u = "src\\Pages\\_system.svelte";

    // (13:0) <Page _currPage="System">
    function create_default_slot$n(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let current;
    	const cpu = new Cpu({ $$inline: true });
    	const osinfo = new OSinfo({ $$inline: true });
    	const ram = new Ram({ $$inline: true });
    	const graphics = new Graphics({ $$inline: true });
    	const disk = new Disk({ $$inline: true });
    	const usage = new Usage({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(cpu.$$.fragment);
    			t0 = space();
    			create_component(osinfo.$$.fragment);
    			t1 = space();
    			create_component(ram.$$.fragment);
    			t2 = space();
    			create_component(graphics.$$.fragment);
    			t3 = space();
    			create_component(disk.$$.fragment);
    			t4 = space();
    			create_component(usage.$$.fragment);
    			attr_dev(div, "class", "p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4");
    			add_location(div, file$u, 13, 4, 561);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(cpu, div, null);
    			append_dev(div, t0);
    			mount_component(osinfo, div, null);
    			append_dev(div, t1);
    			mount_component(ram, div, null);
    			append_dev(div, t2);
    			mount_component(graphics, div, null);
    			append_dev(div, t3);
    			mount_component(disk, div, null);
    			append_dev(div, t4);
    			mount_component(usage, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cpu.$$.fragment, local);
    			transition_in(osinfo.$$.fragment, local);
    			transition_in(ram.$$.fragment, local);
    			transition_in(graphics.$$.fragment, local);
    			transition_in(disk.$$.fragment, local);
    			transition_in(usage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cpu.$$.fragment, local);
    			transition_out(osinfo.$$.fragment, local);
    			transition_out(ram.$$.fragment, local);
    			transition_out(graphics.$$.fragment, local);
    			transition_out(disk.$$.fragment, local);
    			transition_out(usage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(cpu);
    			destroy_component(osinfo);
    			destroy_component(ram);
    			destroy_component(graphics);
    			destroy_component(disk);
    			destroy_component(usage);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$n.name,
    		type: "slot",
    		source: "(13:0) <Page _currPage=\\\"System\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$v(ctx) {
    	let current;

    	const page = new Page({
    			props: {
    				_currPage: "System",
    				$$slots: { default: [create_default_slot$n] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(page.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(page, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const page_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				page_changes.$$scope = { dirty, ctx };
    			}

    			page.$set(page_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(page.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(page.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(page, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$v.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$u($$self, $$props, $$invalidate) {
    	$$self.$capture_state = () => ({
    		Page,
    		Cpu,
    		Speed,
    		OSinfo,
    		Ram,
    		Graphics,
    		Usage,
    		Disk
    	});

    	return [];
    }

    class System extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$u, create_fragment$v, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "System",
    			options,
    			id: create_fragment$v.name
    		});
    	}
    }

    /* src\Pages\_api.svelte generated by Svelte v3.19.1 */
    const file$v = "src\\Pages\\_api.svelte";

    // (86:8) {#if isChecked}
    function create_if_block$l(ctx) {
    	let div;
    	let h3;
    	let t1;
    	let table;
    	let tr0;
    	let td0;
    	let t2;
    	let t3;
    	let td1;
    	let input0;
    	let t4;
    	let tr1;
    	let td2;
    	let t5;
    	let t6;
    	let td3;
    	let input1;
    	let t7;
    	let tr2;
    	let td4;
    	let t8;
    	let t9;
    	let td5;
    	let input2;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Data to be sent to the API";
    			t1 = space();
    			table = element("table");
    			tr0 = element("tr");
    			td0 = element("td");
    			t2 = text("Network Speed");
    			t3 = space();
    			td1 = element("td");
    			input0 = element("input");
    			t4 = space();
    			tr1 = element("tr");
    			td2 = element("td");
    			t5 = text("Your Location");
    			t6 = space();
    			td3 = element("td");
    			input1 = element("input");
    			t7 = space();
    			tr2 = element("tr");
    			td4 = element("td");
    			t8 = text("Signal Frequency");
    			t9 = space();
    			td5 = element("td");
    			input2 = element("input");
    			attr_dev(h3, "class", "text-xl mb-2");
    			add_location(h3, file$v, 87, 12, 3518);
    			attr_dev(td0, "class", "py-2 pr-16");
    			set_style(td0, "color", /*$settings*/ ctx[4].fontColor2);
    			add_location(td0, file$v, 92, 20, 3698);
    			attr_dev(input0, "type", "checkbox");
    			add_location(input0, file$v, 94, 24, 3829);
    			add_location(td1, file$v, 93, 20, 3799);
    			add_location(tr0, file$v, 91, 16, 3672);
    			attr_dev(td2, "class", "py-2 pr-16");
    			set_style(td2, "color", /*$settings*/ ctx[4].fontColor2);
    			add_location(td2, file$v, 102, 20, 4126);
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file$v, 104, 24, 4257);
    			add_location(td3, file$v, 103, 20, 4227);
    			add_location(tr1, file$v, 101, 16, 4100);
    			attr_dev(td4, "class", "py-2 pr-16");
    			set_style(td4, "color", /*$settings*/ ctx[4].fontColor2);
    			add_location(td4, file$v, 112, 20, 4556);
    			attr_dev(input2, "type", "checkbox");
    			add_location(input2, file$v, 114, 24, 4690);
    			add_location(td5, file$v, 113, 20, 4660);
    			add_location(tr2, file$v, 111, 16, 4530);
    			attr_dev(table, "class", "table-auto text-md");
    			add_location(table, file$v, 90, 12, 3620);
    			set_style(div, "color", /*$settings*/ ctx[4].fontColor2);
    			add_location(div, file$v, 86, 8, 3460);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(div, t1);
    			append_dev(div, table);
    			append_dev(table, tr0);
    			append_dev(tr0, td0);
    			append_dev(td0, t2);
    			append_dev(tr0, t3);
    			append_dev(tr0, td1);
    			append_dev(td1, input0);
    			input0.checked = /*isSpeed*/ ctx[1];
    			append_dev(table, t4);
    			append_dev(table, tr1);
    			append_dev(tr1, td2);
    			append_dev(td2, t5);
    			append_dev(tr1, t6);
    			append_dev(tr1, td3);
    			append_dev(td3, input1);
    			input1.checked = /*isLocation*/ ctx[2];
    			append_dev(table, t7);
    			append_dev(table, tr2);
    			append_dev(tr2, td4);
    			append_dev(td4, t8);
    			append_dev(tr2, t9);
    			append_dev(tr2, td5);
    			append_dev(td5, input2);
    			input2.checked = /*isFrequency*/ ctx[3];

    			dispose = [
    				listen_dev(input0, "change", /*input0_change_handler*/ ctx[8]),
    				listen_dev(input0, "click", /*click_handler*/ ctx[9], false, false, false),
    				listen_dev(input1, "change", /*input1_change_handler*/ ctx[10]),
    				listen_dev(input1, "click", /*click_handler_1*/ ctx[11], false, false, false),
    				listen_dev(input2, "change", /*input2_change_handler*/ ctx[12]),
    				listen_dev(input2, "click", /*click_handler_2*/ ctx[13], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$settings*/ 16) {
    				set_style(td0, "color", /*$settings*/ ctx[4].fontColor2);
    			}

    			if (dirty & /*isSpeed*/ 2) {
    				input0.checked = /*isSpeed*/ ctx[1];
    			}

    			if (dirty & /*$settings*/ 16) {
    				set_style(td2, "color", /*$settings*/ ctx[4].fontColor2);
    			}

    			if (dirty & /*isLocation*/ 4) {
    				input1.checked = /*isLocation*/ ctx[2];
    			}

    			if (dirty & /*$settings*/ 16) {
    				set_style(td4, "color", /*$settings*/ ctx[4].fontColor2);
    			}

    			if (dirty & /*isFrequency*/ 8) {
    				input2.checked = /*isFrequency*/ ctx[3];
    			}

    			if (dirty & /*$settings*/ 16) {
    				set_style(div, "color", /*$settings*/ ctx[4].fontColor2);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$l.name,
    		type: "if",
    		source: "(86:8) {#if isChecked}",
    		ctx
    	});

    	return block;
    }

    // (59:0) <Page _currPage="API">
    function create_default_slot$o(ctx) {
    	let div2;
    	let div0;
    	let h1;
    	let t0;
    	let t1;
    	let label;
    	let input;
    	let t2;
    	let span;
    	let t3;
    	let div1;
    	let t5;
    	let dispose;
    	let if_block = /*isChecked*/ ctx[0] && create_if_block$l(ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = text("Allow Neuron to collect system related information such as network speed, location and frequency");
    			t1 = space();
    			label = element("label");
    			input = element("input");
    			t2 = space();
    			span = element("span");
    			t3 = space();
    			div1 = element("div");
    			div1.textContent = "Note : This information is only being collected as part of a public API for developers.\r\n            This data will only be used for building third-party applications, provide better services \r\n            by Internet Service Providers etc.";
    			t5 = space();
    			if (if_block) if_block.c();
    			attr_dev(h1, "class", "text-xl mt-4");
    			set_style(h1, "color", /*$settings*/ ctx[4].fontColor2);
    			add_location(h1, file$v, 61, 12, 2413);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", "toggle-api");
    			attr_dev(input, "class", "svelte-1r7cmh2");
    			add_location(input, file$v, 71, 16, 2788);
    			attr_dev(span, "class", "slider round svelte-1r7cmh2");
    			add_location(span, file$v, 77, 16, 2994);
    			attr_dev(label, "for", "toggle-api");
    			attr_dev(label, "class", "switch ml-4 mt-6 svelte-1r7cmh2");
    			add_location(label, file$v, 67, 12, 2672);
    			attr_dev(div0, "class", "flex flex-row justify-between items-center");
    			add_location(div0, file$v, 60, 8, 2343);
    			attr_dev(div1, "class", "text-white p-2 my-8 rounded-md bg-green-500 border-4 border-green-700 ");
    			add_location(div1, file$v, 80, 8, 3071);
    			attr_dev(div2, "class", "p-6");
    			add_location(div2, file$v, 59, 4, 2316);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h1);
    			append_dev(h1, t0);
    			append_dev(div0, t1);
    			append_dev(div0, label);
    			append_dev(label, input);
    			input.checked = /*isChecked*/ ctx[0];
    			append_dev(label, t2);
    			append_dev(label, span);
    			append_dev(div2, t3);
    			append_dev(div2, div1);
    			append_dev(div2, t5);
    			if (if_block) if_block.m(div2, null);

    			dispose = [
    				listen_dev(input, "change", /*input_change_handler*/ ctx[7]),
    				listen_dev(input, "click", toggleAPI, false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$settings*/ 16) {
    				set_style(h1, "color", /*$settings*/ ctx[4].fontColor2);
    			}

    			if (dirty & /*isChecked*/ 1) {
    				input.checked = /*isChecked*/ ctx[0];
    			}

    			if (/*isChecked*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$l(ctx);
    					if_block.c();
    					if_block.m(div2, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block) if_block.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$o.name,
    		type: "slot",
    		source: "(59:0) <Page _currPage=\\\"API\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$w(ctx) {
    	let current;

    	const page = new Page({
    			props: {
    				_currPage: "API",
    				$$slots: { default: [create_default_slot$o] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(page.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(page, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const page_changes = {};

    			if (dirty & /*$$scope, $settings, isFrequency, isLocation, isSpeed, isChecked*/ 16415) {
    				page_changes.$$scope = { dirty, ctx };
    			}

    			page.$set(page_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(page.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(page.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(page, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$w.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function toggleAPI() {
    	localStorage.checked = localStorage.checked === "true" ? false : true;
    }

    // Function to toggle params checkbox
    function toggleParams(type) {
    	switch (type) {
    		case "speed":
    			localStorage.speed = localStorage.speed === "true" ? false : true;
    			break;
    		case "location":
    			localStorage.location = localStorage.location === "true" ? false : true;
    			break;
    		case "frequency":
    			localStorage.frequency = localStorage.frequency === "true" ? false : true;
    			break;
    	}
    }

    function instance$v($$self, $$props, $$invalidate) {
    	let $settings;
    	validate_store(settings, "settings");
    	component_subscribe($$self, settings, $$value => $$invalidate(4, $settings = $$value));
    	const fs = require("fs");
    	let isChecked = localStorage.checked === "true" ? true : false;
    	let isSpeed = localStorage.speed === "true" ? true : false;
    	let isLocation = localStorage.location === "true" ? true : false;
    	let isFrequency = localStorage.frequency == "true" ? true : false;

    	// Function to send data to API
    	function sendData() {
    		if (isChecked) {
    			// Read data from log files
    			const speed = fs.readFileSync("./logs/api_logs/NetSpeedLog.txt", "utf8");

    			const frequency = fs.readFileSync("./logs/api_logs/PingLog.txt", "utf8");
    			const location = fs.readFileSync("./logs/api_logs/testServerLocationLog.txt", "utf8");

    			fetch("http://127.0.0.1:3000/api/users", {
    				method: "POST",
    				headers: { "Content-Type": "application/json" },
    				body: JSON.stringify({
    					id: $settings.id,
    					speed: isSpeed && speed.trim() ? speed : null,
    					frequency: isFrequency && frequency.trim() ? frequency : null,
    					location: isLocation && location.trim() ? location : null
    				})
    			}).then(res => res.json()).then(data => console.log(data.data));
    		}
    	}

    	// Call the function every 10 seconds
    	setInterval(sendData, 10000);

    	function input_change_handler() {
    		isChecked = this.checked;
    		$$invalidate(0, isChecked);
    	}

    	function input0_change_handler() {
    		isSpeed = this.checked;
    		$$invalidate(1, isSpeed);
    	}

    	const click_handler = () => toggleParams("speed");

    	function input1_change_handler() {
    		isLocation = this.checked;
    		$$invalidate(2, isLocation);
    	}

    	const click_handler_1 = () => toggleParams("location");

    	function input2_change_handler() {
    		isFrequency = this.checked;
    		$$invalidate(3, isFrequency);
    	}

    	const click_handler_2 = () => toggleParams("frequency");

    	$$self.$capture_state = () => ({
    		onMount,
    		Page,
    		settings,
    		fs,
    		isChecked,
    		isSpeed,
    		isLocation,
    		isFrequency,
    		toggleAPI,
    		toggleParams,
    		sendData,
    		require,
    		localStorage,
    		fetch,
    		JSON,
    		$settings,
    		console,
    		setInterval
    	});

    	$$self.$inject_state = $$props => {
    		if ("isChecked" in $$props) $$invalidate(0, isChecked = $$props.isChecked);
    		if ("isSpeed" in $$props) $$invalidate(1, isSpeed = $$props.isSpeed);
    		if ("isLocation" in $$props) $$invalidate(2, isLocation = $$props.isLocation);
    		if ("isFrequency" in $$props) $$invalidate(3, isFrequency = $$props.isFrequency);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		isChecked,
    		isSpeed,
    		isLocation,
    		isFrequency,
    		$settings,
    		fs,
    		sendData,
    		input_change_handler,
    		input0_change_handler,
    		click_handler,
    		input1_change_handler,
    		click_handler_1,
    		input2_change_handler,
    		click_handler_2
    	];
    }

    class Api extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$v, create_fragment$w, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Api",
    			options,
    			id: create_fragment$w.name
    		});
    	}
    }

    /* src\Pages\_settings.svelte generated by Svelte v3.19.1 */
    const file$w = "src\\Pages\\_settings.svelte";

    // (53:2) <Shell title={"Application Settings"} tooltip={"Change Application Settings"}>
    function create_default_slot_1(ctx) {
    	let div7;
    	let div0;
    	let label0;
    	let t0;
    	let t1;
    	let input0;
    	let t2;
    	let div2;
    	let label1;
    	let t3;
    	let t4;
    	let div1;
    	let input1;
    	let t5;
    	let input2;
    	let t6;
    	let input3;
    	let t7;
    	let input4;
    	let t8;
    	let div4;
    	let label2;
    	let t9;
    	let t10;
    	let div3;
    	let input5;
    	let t11;
    	let input6;
    	let t12;
    	let div5;
    	let label3;
    	let t13;
    	let t14;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let select_value_value;
    	let t20;
    	let div6;
    	let button0;
    	let t21;
    	let t22;
    	let button1;
    	let t23;
    	let dispose;

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			t0 = text("Dashboard Username");
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			div2 = element("div");
    			label1 = element("label");
    			t3 = text("Background Colors");
    			t4 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t5 = space();
    			input2 = element("input");
    			t6 = space();
    			input3 = element("input");
    			t7 = space();
    			input4 = element("input");
    			t8 = space();
    			div4 = element("div");
    			label2 = element("label");
    			t9 = text("Font Colors");
    			t10 = space();
    			div3 = element("div");
    			input5 = element("input");
    			t11 = space();
    			input6 = element("input");
    			t12 = space();
    			div5 = element("div");
    			label3 = element("label");
    			t13 = text("Font Style");
    			t14 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Default\r\n              ";
    			option1 = element("option");
    			option1.textContent = "Roboto\r\n              ";
    			option2 = element("option");
    			option2.textContent = "Open Sans\r\n              ";
    			option3 = element("option");
    			option3.textContent = "Lato\r\n              ";
    			option4 = element("option");
    			option4.textContent = "Montserrat";
    			t20 = space();
    			div6 = element("div");
    			button0 = element("button");
    			t21 = text("Apply");
    			t22 = space();
    			button1 = element("button");
    			t23 = text("Reset");
    			attr_dev(label0, "class", "font-semibold pb-2 text-center");
    			set_style(label0, "color", /*$settings*/ ctx[8].fontColor2);
    			attr_dev(label0, "for", "username");
    			add_location(label0, file$w, 64, 10, 2939);
    			attr_dev(input0, "class", "w-full sm:w-96 rounded-md p-1 text-gray-800");
    			input0.value = /*username*/ ctx[0];
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "username");
    			add_location(input0, file$w, 71, 10, 3162);
    			attr_dev(div0, "class", "flex flex-col justify-start mb-6");
    			add_location(div0, file$w, 63, 6, 2881);
    			attr_dev(label1, "class", "font-semibold text-center pb-2");
    			set_style(label1, "color", /*$settings*/ ctx[8].fontColor2);
    			attr_dev(label1, "for", "Background Colors");
    			add_location(label1, file$w, 80, 10, 3452);
    			attr_dev(input1, "class", "mx-3 rounded-sm svelte-rgymr2");
    			input1.value = /*bgColor1*/ ctx[1];
    			attr_dev(input1, "type", "color");
    			attr_dev(input1, "id", "bgColor-1");
    			add_location(input1, file$w, 88, 14, 3707);
    			attr_dev(input2, "class", "mx-3 rounded-sm svelte-rgymr2");
    			input2.value = /*bgColor2*/ ctx[2];
    			attr_dev(input2, "type", "color");
    			attr_dev(input2, "id", "bgColor-2");
    			add_location(input2, file$w, 94, 14, 3892);
    			attr_dev(input3, "class", "mx-3 rounded-sm svelte-rgymr2");
    			input3.value = /*bgColor3*/ ctx[3];
    			attr_dev(input3, "type", "color");
    			attr_dev(input3, "id", "bgColor-3");
    			add_location(input3, file$w, 100, 14, 4077);
    			attr_dev(input4, "class", "mx-3 rounded-sm svelte-rgymr2");
    			input4.value = /*bgColor4*/ ctx[4];
    			attr_dev(input4, "type", "color");
    			attr_dev(input4, "id", "bgColor-4");
    			add_location(input4, file$w, 106, 14, 4262);
    			add_location(div1, file$w, 87, 10, 3686);
    			attr_dev(div2, "class", "flex flex-col justify-center mb-6");
    			add_location(div2, file$w, 79, 6, 3393);
    			attr_dev(label2, "class", "font-semibold text-center pb-2");
    			set_style(label2, "color", /*$settings*/ ctx[8].fontColor2);
    			attr_dev(label2, "for", "Font Colors");
    			add_location(label2, file$w, 116, 10, 4558);
    			attr_dev(input5, "class", "mx-3 rounded-sm svelte-rgymr2");
    			input5.value = /*fontColor1*/ ctx[5];
    			attr_dev(input5, "type", "color");
    			attr_dev(input5, "id", "fontColor-1");
    			add_location(input5, file$w, 124, 14, 4798);
    			attr_dev(input6, "class", "mx-3 rounded-sm svelte-rgymr2");
    			input6.value = /*fontColor2*/ ctx[6];
    			attr_dev(input6, "type", "color");
    			attr_dev(input6, "id", "fontColor-2");
    			add_location(input6, file$w, 130, 14, 4987);
    			add_location(div3, file$w, 123, 10, 4777);
    			attr_dev(div4, "class", "flex flex-col justify-center mb-6");
    			add_location(div4, file$w, 115, 6, 4499);
    			attr_dev(label3, "class", "font-semibold pb-2 text-center pb-2");
    			set_style(label3, "color", /*$settings*/ ctx[8].fontColor2);
    			attr_dev(label3, "for", "font");
    			add_location(label3, file$w, 140, 10, 5280);
    			option0.__value = "";
    			option0.value = option0.__value;
    			add_location(option0, file$w, 153, 14, 5681);
    			option1.__value = "Roboto";
    			option1.value = option1.__value;
    			add_location(option1, file$w, 156, 14, 5766);
    			option2.__value = "Open Sans";
    			option2.value = option2.__value;
    			add_location(option2, file$w, 159, 14, 5856);
    			option3.__value = "Lato";
    			option3.value = option3.__value;
    			add_location(option3, file$w, 162, 14, 5952);
    			option4.__value = "Montserrat";
    			option4.value = option4.__value;
    			add_location(option4, file$w, 165, 14, 6038);
    			attr_dev(select, "name", "font");
    			attr_dev(select, "id", "font");
    			attr_dev(select, "class", "w-max mb-4 px-2 py-1 rounded-md text-gray-800");
    			add_location(select, file$w, 147, 10, 5496);
    			attr_dev(div5, "class", "flex flex-col justify-center mb-6");
    			add_location(div5, file$w, 139, 6, 5221);
    			attr_dev(button0, "class", "text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-semibold hover:bg-purple-600");
    			set_style(button0, "color", /*$settings*/ ctx[8].fontColor1);
    			add_location(button0, file$w, 172, 10, 6254);
    			attr_dev(button1, "class", "text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-semibold hover:bg-purple-600");
    			set_style(button1, "color", /*$settings*/ ctx[8].fontColor1);
    			add_location(button1, file$w, 179, 10, 6544);
    			attr_dev(div6, "class", "flex flex-row justify-center items-center");
    			add_location(div6, file$w, 171, 6, 6187);
    			attr_dev(div7, "class", "flex flex-col items-center justify-center rounded-md p-1");
    			set_style(div7, "background-color", /*$settings*/ ctx[8].bgColor3);
    			add_location(div7, file$w, 53, 4, 2570);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div0);
    			append_dev(div0, label0);
    			append_dev(label0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, input0);
    			append_dev(div7, t2);
    			append_dev(div7, div2);
    			append_dev(div2, label1);
    			append_dev(label1, t3);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, input1);
    			append_dev(div1, t5);
    			append_dev(div1, input2);
    			append_dev(div1, t6);
    			append_dev(div1, input3);
    			append_dev(div1, t7);
    			append_dev(div1, input4);
    			append_dev(div7, t8);
    			append_dev(div7, div4);
    			append_dev(div4, label2);
    			append_dev(label2, t9);
    			append_dev(div4, t10);
    			append_dev(div4, div3);
    			append_dev(div3, input5);
    			append_dev(div3, t11);
    			append_dev(div3, input6);
    			append_dev(div7, t12);
    			append_dev(div7, div5);
    			append_dev(div5, label3);
    			append_dev(label3, t13);
    			append_dev(div5, t14);
    			append_dev(div5, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			append_dev(select, option4);
    			select_value_value = /*font*/ ctx[7];

    			for (var i = 0; i < select.options.length; i += 1) {
    				var option = select.options[i];

    				if (option.__value === select_value_value) {
    					option.selected = true;
    					break;
    				}
    			}

    			append_dev(div7, t20);
    			append_dev(div7, div6);
    			append_dev(div6, button0);
    			append_dev(button0, t21);
    			append_dev(div6, t22);
    			append_dev(div6, button1);
    			append_dev(button1, t23);

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[10], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[11], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$settings*/ 256) {
    				set_style(label0, "color", /*$settings*/ ctx[8].fontColor2);
    			}

    			if (dirty & /*username*/ 1 && input0.value !== /*username*/ ctx[0]) {
    				prop_dev(input0, "value", /*username*/ ctx[0]);
    			}

    			if (dirty & /*$settings*/ 256) {
    				set_style(label1, "color", /*$settings*/ ctx[8].fontColor2);
    			}

    			if (dirty & /*bgColor1*/ 2) {
    				prop_dev(input1, "value", /*bgColor1*/ ctx[1]);
    			}

    			if (dirty & /*bgColor2*/ 4) {
    				prop_dev(input2, "value", /*bgColor2*/ ctx[2]);
    			}

    			if (dirty & /*bgColor3*/ 8) {
    				prop_dev(input3, "value", /*bgColor3*/ ctx[3]);
    			}

    			if (dirty & /*bgColor4*/ 16) {
    				prop_dev(input4, "value", /*bgColor4*/ ctx[4]);
    			}

    			if (dirty & /*$settings*/ 256) {
    				set_style(label2, "color", /*$settings*/ ctx[8].fontColor2);
    			}

    			if (dirty & /*fontColor1*/ 32) {
    				prop_dev(input5, "value", /*fontColor1*/ ctx[5]);
    			}

    			if (dirty & /*fontColor2*/ 64) {
    				prop_dev(input6, "value", /*fontColor2*/ ctx[6]);
    			}

    			if (dirty & /*$settings*/ 256) {
    				set_style(label3, "color", /*$settings*/ ctx[8].fontColor2);
    			}

    			if (dirty & /*font*/ 128 && select_value_value !== (select_value_value = /*font*/ ctx[7])) {
    				for (var i = 0; i < select.options.length; i += 1) {
    					var option = select.options[i];

    					if (option.__value === select_value_value) {
    						option.selected = true;
    						break;
    					}
    				}
    			}

    			if (dirty & /*$settings*/ 256) {
    				set_style(button0, "color", /*$settings*/ ctx[8].fontColor1);
    			}

    			if (dirty & /*$settings*/ 256) {
    				set_style(button1, "color", /*$settings*/ ctx[8].fontColor1);
    			}

    			if (dirty & /*$settings*/ 256) {
    				set_style(div7, "background-color", /*$settings*/ ctx[8].bgColor3);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(53:2) <Shell title={\\\"Application Settings\\\"} tooltip={\\\"Change Application Settings\\\"}>",
    		ctx
    	});

    	return block;
    }

    // (51:0) <Page _currPage="Settings">
    function create_default_slot$p(ctx) {
    	let div;
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "Application Settings",
    				tooltip: "Change Application Settings",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(shell.$$.fragment);
    			attr_dev(div, "class", "p-6");
    			add_location(div, file$w, 51, 0, 2465);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(shell, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const shell_changes = {};

    			if (dirty & /*$$scope, $settings, font, fontColor2, fontColor1, bgColor4, bgColor3, bgColor2, bgColor1, username*/ 4607) {
    				shell_changes.$$scope = { dirty, ctx };
    			}

    			shell.$set(shell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(shell);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$p.name,
    		type: "slot",
    		source: "(51:0) <Page _currPage=\\\"Settings\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$x(ctx) {
    	let current;

    	const page = new Page({
    			props: {
    				_currPage: "Settings",
    				$$slots: { default: [create_default_slot$p] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(page.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(page, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const page_changes = {};

    			if (dirty & /*$$scope, $settings, font, fontColor2, fontColor1, bgColor4, bgColor3, bgColor2, bgColor1, username*/ 4607) {
    				page_changes.$$scope = { dirty, ctx };
    			}

    			page.$set(page_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(page.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(page.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(page, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$x.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$w($$self, $$props, $$invalidate) {
    	let $settings;
    	validate_store(settings, "settings");
    	component_subscribe($$self, settings, $$value => $$invalidate(8, $settings = $$value));
    	let username = $settings.username;
    	let bgColor1 = $settings.bgColor1;
    	let bgColor2 = $settings.bgColor2;
    	let bgColor3 = $settings.bgColor3;
    	let bgColor4 = $settings.bgColor4;
    	let fontColor1 = $settings.fontColor1;
    	let fontColor2 = $settings.fontColor2;
    	let font = $settings.font;

    	const applyChanges = type => {
    		// Set store values 
    		set_store_value(
    			settings,
    			$settings.username = type == "save"
    			? document.getElementById("username").value
    			: "Admin",
    			$settings
    		);

    		set_store_value(
    			settings,
    			$settings.bgColor1 = type == "save"
    			? document.getElementById("bgColor-1").value
    			: "#1F2937",
    			$settings
    		);

    		set_store_value(
    			settings,
    			$settings.bgColor2 = type == "save"
    			? document.getElementById("bgColor-2").value
    			: "#111827",
    			$settings
    		);

    		set_store_value(
    			settings,
    			$settings.bgColor3 = type == "save"
    			? document.getElementById("bgColor-3").value
    			: "#374151",
    			$settings
    		);

    		set_store_value(
    			settings,
    			$settings.bgColor4 = type == "save"
    			? document.getElementById("bgColor-4").value
    			: "#a855f7",
    			$settings
    		);

    		set_store_value(
    			settings,
    			$settings.fontColor1 = type == "save"
    			? document.getElementById("fontColor-1").value
    			: "#ffffff",
    			$settings
    		);

    		set_store_value(
    			settings,
    			$settings.fontColor2 = type == "save"
    			? document.getElementById("fontColor-2").value
    			: "#f0f0f0",
    			$settings
    		);

    		// $settings.linkColor = type == 'save' ? document.getElementById('linkColor').value: '#374151',
    		// $settings.miscColor = type == 'save' ? document.getElementById('miscColor').value: '#8B5CF6',
    		set_store_value(
    			settings,
    			$settings.font = type == "save"
    			? document.getElementById("font").value
    			: "",
    			$settings
    		);

    		// Set localStorage values
    		localStorage.username = $settings.username;

    		localStorage.bgColor1 = $settings.bgColor1;
    		localStorage.bgColor2 = $settings.bgColor2;
    		localStorage.bgColor3 = $settings.bgColor3;
    		localStorage.bgColor4 = $settings.bgColor4;
    		localStorage.fontColor1 = $settings.fontColor1;
    		localStorage.fontColor2 = $settings.fontColor2;
    		localStorage.font = $settings.font;

    		// Set state variable values
    		$$invalidate(0, username = $settings.username);

    		$$invalidate(1, bgColor1 = $settings.bgColor1);
    		$$invalidate(2, bgColor2 = $settings.bgColor2);
    		$$invalidate(3, bgColor3 = $settings.bgColor3);
    		$$invalidate(4, bgColor4 = $settings.bgColor4);
    		$$invalidate(5, fontColor1 = $settings.fontColor1);
    		$$invalidate(6, fontColor2 = $settings.fontColor2);
    		$$invalidate(7, font = $settings.font);
    	};

    	const click_handler = () => applyChanges("save");
    	const click_handler_1 = () => applyChanges("reset");

    	$$self.$capture_state = () => ({
    		Page,
    		settings,
    		Shell,
    		username,
    		bgColor1,
    		bgColor2,
    		bgColor3,
    		bgColor4,
    		fontColor1,
    		fontColor2,
    		font,
    		applyChanges,
    		$settings,
    		document,
    		localStorage
    	});

    	$$self.$inject_state = $$props => {
    		if ("username" in $$props) $$invalidate(0, username = $$props.username);
    		if ("bgColor1" in $$props) $$invalidate(1, bgColor1 = $$props.bgColor1);
    		if ("bgColor2" in $$props) $$invalidate(2, bgColor2 = $$props.bgColor2);
    		if ("bgColor3" in $$props) $$invalidate(3, bgColor3 = $$props.bgColor3);
    		if ("bgColor4" in $$props) $$invalidate(4, bgColor4 = $$props.bgColor4);
    		if ("fontColor1" in $$props) $$invalidate(5, fontColor1 = $$props.fontColor1);
    		if ("fontColor2" in $$props) $$invalidate(6, fontColor2 = $$props.fontColor2);
    		if ("font" in $$props) $$invalidate(7, font = $$props.font);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		username,
    		bgColor1,
    		bgColor2,
    		bgColor3,
    		bgColor4,
    		fontColor1,
    		fontColor2,
    		font,
    		$settings,
    		applyChanges,
    		click_handler,
    		click_handler_1
    	];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$w, create_fragment$x, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$x.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.19.1 */

    function create_fragment$y(ctx) {
    	let current;

    	const router = new Router({
    			props: {
    				routes: {
    					"/": Main,
    					"/network": Network,
    					"/diagnostics": Diagnostics,
    					"/system": System,
    					"/api": Api,
    					"/settings": Settings
    				}
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$y.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$x($$self, $$props, $$invalidate) {
    	$$self.$capture_state = () => ({
    		Router,
    		Main,
    		Network,
    		Diagnostics,
    		System,
    		Api,
    		Settings
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$x, create_fragment$y, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$y.name
    		});
    	}
    }

    //Svelte

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

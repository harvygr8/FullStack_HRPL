
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
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

    const settings = writable({
        username: localStorage.username ? localStorage.username : 'User',
        bgColor1 : localStorage.bgColor1 ? localStorage.bgColor1 : '#111827',
        bgColor2 : localStorage.bgColor2 ? localStorage.bgColor2 : '#3C0A64',
        fontColor1 : localStorage.fontColor1 ? localStorage.fontColor1 : '#ffffff',
        fontColor2 : localStorage.fontColor1 ? localStorage.fontColor2 : '#f0f0f0',
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
    			add_location(i, file, 14, 12, 342);
    			attr_dev(span, "class", "hidden md:block pl-4");
    			add_location(span, file, 15, 12, 405);
    			attr_dev(div0, "class", "flex flex-row items-center");
    			add_location(div0, file, 13, 8, 288);
    			attr_dev(a, "href", /*link*/ ctx[0]);
    			add_location(a, file, 12, 4, 263);
    			attr_dev(div1, "class", "text-lg my-8");
    			set_style(div1, "color", /*$settings*/ ctx[3].fontColor1);
    			add_location(div1, file, 8, 0, 179);
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
    	let div;
    	let h2;
    	let t0_value = /*$settings*/ ctx[0].username + "";
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let t7;
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
    				link: "#/wifi",
    				icon: "fa-wifi",
    				name: "Wi-Fi"
    			},
    			$$inline: true
    		});

    	const link4 = new Link({
    			props: {
    				link: "#/system",
    				icon: "fa-microchip",
    				name: "System"
    			},
    			$$inline: true
    		});

    	const link5 = new Link({
    			props: {
    				link: "#/api",
    				icon: "fa-terminal",
    				name: "Api"
    			},
    			$$inline: true
    		});

    	const link6 = new Link({
    			props: {
    				link: "#/settings",
    				icon: "fa-cog",
    				name: "Settings"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			create_component(link0.$$.fragment);
    			t2 = space();
    			create_component(link1.$$.fragment);
    			t3 = space();
    			create_component(link2.$$.fragment);
    			t4 = space();
    			create_component(link3.$$.fragment);
    			t5 = space();
    			create_component(link4.$$.fragment);
    			t6 = space();
    			create_component(link5.$$.fragment);
    			t7 = space();
    			create_component(link6.$$.fragment);
    			attr_dev(h2, "class", "text-center text-2xl mt-8 font-medium");
    			set_style(h2, "color", /*$settings*/ ctx[0].fontColor1);
    			add_location(h2, file$1, 9, 4, 231);
    			attr_dev(div, "class", "w-auto h-full px-2 md:px-4");
    			set_style(div, "background-color", /*$settings*/ ctx[0].bgColor2);
    			add_location(div, file$1, 5, 0, 122);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(h2, t0);
    			append_dev(div, t1);
    			mount_component(link0, div, null);
    			append_dev(div, t2);
    			mount_component(link1, div, null);
    			append_dev(div, t3);
    			mount_component(link2, div, null);
    			append_dev(div, t4);
    			mount_component(link3, div, null);
    			append_dev(div, t5);
    			mount_component(link4, div, null);
    			append_dev(div, t6);
    			mount_component(link5, div, null);
    			append_dev(div, t7);
    			mount_component(link6, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*$settings*/ 1) && t0_value !== (t0_value = /*$settings*/ ctx[0].username + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty & /*$settings*/ 1) {
    				set_style(h2, "color", /*$settings*/ ctx[0].fontColor1);
    			}

    			if (!current || dirty & /*$settings*/ 1) {
    				set_style(div, "background-color", /*$settings*/ ctx[0].bgColor2);
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
    			transition_in(link6.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(link0.$$.fragment, local);
    			transition_out(link1.$$.fragment, local);
    			transition_out(link2.$$.fragment, local);
    			transition_out(link3.$$.fragment, local);
    			transition_out(link4.$$.fragment, local);
    			transition_out(link5.$$.fragment, local);
    			transition_out(link6.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(link0);
    			destroy_component(link1);
    			destroy_component(link2);
    			destroy_component(link3);
    			destroy_component(link4);
    			destroy_component(link5);
    			destroy_component(link6);
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
    	let div3;
    	let div0;
    	let t0;
    	let div1;
    	let h1;
    	let t2;
    	let div2;
    	let button0;
    	let t3;
    	let button1;
    	let t4;
    	let button2;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Neuron";
    			t2 = space();
    			div2 = element("div");
    			button0 = element("button");
    			t3 = space();
    			button1 = element("button");
    			t4 = space();
    			button2 = element("button");
    			attr_dev(div0, "class", "drag svelte-b4odhu");
    			add_location(div0, file$2, 11, 4, 300);
    			attr_dev(h1, "class", "text-xl");
    			add_location(h1, file$2, 13, 8, 354);
    			attr_dev(div1, "class", "drag svelte-b4odhu");
    			add_location(div1, file$2, 12, 4, 326);
    			attr_dev(button0, "class", "fa fa-window-minimize ");
    			add_location(button0, file$2, 18, 8, 500);
    			attr_dev(button1, "class", "fa fa-window-maximize mx-6");
    			add_location(button1, file$2, 19, 8, 590);
    			attr_dev(button2, "class", "fa fa-times mr-4");
    			add_location(button2, file$2, 20, 8, 684);
    			attr_dev(div2, "class", "flex flex-row justify-center items-center text-md");
    			add_location(div2, file$2, 17, 4, 427);
    			attr_dev(div3, "class", "flex flex-row justify-between items-center my-2");
    			set_style(div3, "color", /*$settings*/ ctx[0].fontColor2);
    			add_location(div3, file$2, 7, 0, 181);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, h1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, button0);
    			append_dev(div2, t3);
    			append_dev(div2, button1);
    			append_dev(div2, t4);
    			append_dev(div2, button2);

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[3], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[4], false, false, false),
    				listen_dev(button2, "click", /*click_handler_2*/ ctx[5], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$settings*/ 1) {
    				set_style(div3, "color", /*$settings*/ ctx[0].fontColor2);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
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
    	component_subscribe($$self, settings, $$value => $$invalidate(0, $settings = $$value));
    	const { remote } = require("electron");
    	const window = remote.getCurrentWindow();
    	const click_handler = () => window.minimize();
    	const click_handler_1 = () => window.maximize();
    	const click_handler_2 = () => window.close();

    	$$self.$capture_state = () => ({
    		settings,
    		remote,
    		window,
    		require,
    		$settings
    	});

    	return [$settings, window, remote, click_handler, click_handler_1, click_handler_2];
    }

    class TitleBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TitleBar",
    			options,
    			id: create_fragment$3.name
    		});
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
    	const titlebar = new TitleBar({ $$inline: true });
    	const default_slot_template = /*$$slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

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
    			attr_dev(div0, "class", "page-container p-4 mx-auto svelte-xwborx");
    			add_location(div0, file$3, 17, 12, 487);
    			attr_dev(div1, "class", "w-full");
    			set_style(div1, "background-color", /*$settings*/ ctx[0].bgColor1);
    			add_location(div1, file$3, 12, 8, 341);
    			attr_dev(div2, "class", "flex flex-row h-full");
    			add_location(div2, file$3, 10, 4, 280);
    			attr_dev(main, "class", "h-screen");
    			set_style(main, "font-family", /*$settings*/ ctx[0].font);
    			add_location(main, file$3, 6, 0, 198);
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
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 2) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[1], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null));
    			}

    			if (!current || dirty & /*$settings*/ 1) {
    				set_style(div1, "background-color", /*$settings*/ ctx[0].bgColor1);
    			}

    			if (!current || dirty & /*$settings*/ 1) {
    				set_style(main, "font-family", /*$settings*/ ctx[0].font);
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
    	component_subscribe($$self, settings, $$value => $$invalidate(0, $settings = $$value));
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ Nav, TitleBar, settings, $settings });
    	return [$settings, $$scope, $$slots];
    }

    class Page extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Page",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\Pages\_main.svelte generated by Svelte v3.19.1 */
    const file$4 = "src\\Pages\\_main.svelte";

    // (5:0) <Page>
    function create_default_slot(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "grid grid-cols-2 gap-4");
    			add_location(div, file$4, 5, 4, 75);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(5:0) <Page>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let current;

    	const page = new Page({
    			props: {
    				$$slots: { default: [create_default_slot] },
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	$$self.$capture_state = () => ({ Page });
    	return [];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\Components\Misc\Shell.svelte generated by Svelte v3.19.1 */
    const file$5 = "src\\Components\\Misc\\Shell.svelte";

    function create_fragment$6(ctx) {
    	let div2;
    	let div0;
    	let h3;
    	let t0;
    	let t1;
    	let span;
    	let t2;
    	let hr;
    	let t3;
    	let div1;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			span = element("span");
    			t2 = space();
    			hr = element("hr");
    			t3 = space();
    			div1 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(h3, "class", "text-2xl font-medium");
    			set_style(h3, "color", /*$settings*/ ctx[2].fontColor2);
    			add_location(h3, file$5, 12, 8, 376);
    			attr_dev(span, "class", "ml-2 fas fa-info-circle cursor-pointer");
    			attr_dev(span, "title", /*tooltip*/ ctx[1]);
    			add_location(span, file$5, 18, 8, 532);
    			attr_dev(div0, "class", "flex flex-row justify-between items-center");
    			add_location(div0, file$5, 11, 4, 310);
    			attr_dev(hr, "class", "my-2");
    			add_location(hr, file$5, 23, 4, 661);
    			add_location(div1, file$5, 24, 4, 684);
    			attr_dev(div2, "class", "rounded-sm shadow-md p-2 ");
    			set_style(div2, "background-color", /*$settings*/ ctx[2].bgColor2);
    			set_style(div2, "color", /*$settings*/ ctx[2].fontColor1);
    			add_location(div2, file$5, 7, 0, 173);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h3);
    			append_dev(h3, t0);
    			append_dev(div0, t1);
    			append_dev(div0, span);
    			append_dev(div2, t2);
    			append_dev(div2, hr);
    			append_dev(div2, t3);
    			append_dev(div2, div1);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);

    			if (!current || dirty & /*$settings*/ 4) {
    				set_style(h3, "color", /*$settings*/ ctx[2].fontColor2);
    			}

    			if (!current || dirty & /*tooltip*/ 2) {
    				attr_dev(span, "title", /*tooltip*/ ctx[1]);
    			}

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 8) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    			}

    			if (!current || dirty & /*$settings*/ 4) {
    				set_style(div2, "background-color", /*$settings*/ ctx[2].bgColor2);
    			}

    			if (!current || dirty & /*$settings*/ 4) {
    				set_style(div2, "color", /*$settings*/ ctx[2].fontColor1);
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
    			if (detaching) detach_dev(div2);
    			if (default_slot) default_slot.d(detaching);
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

    	$$self.$set = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("tooltip" in $$props) $$invalidate(1, tooltip = $$props.tooltip);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ settings, title, tooltip, $settings });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("tooltip" in $$props) $$invalidate(1, tooltip = $$props.tooltip);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, tooltip, $settings, $$scope, $$slots];
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

    /* src\Components\Network\Ping\Ping.svelte generated by Svelte v3.19.1 */
    const file$6 = "src\\Components\\Network\\Ping\\Ping.svelte";

    // (61:4) {:else}
    function create_else_block$1(ctx) {
    	let div6;
    	let div1;
    	let p0;
    	let t1;
    	let div0;
    	let p1;
    	let t3;
    	let p2;
    	let t5;
    	let div3;
    	let p3;
    	let t7;
    	let div2;
    	let p4;
    	let t9;
    	let p5;
    	let t10;
    	let div5;
    	let p6;
    	let t12;
    	let div4;
    	let p7;
    	let t14;
    	let p8;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = "Time";
    			t1 = space();
    			div0 = element("div");
    			p1 = element("p");
    			p1.textContent = "N/A";
    			t3 = text(" \r\n              ");
    			p2 = element("p");
    			p2.textContent = "ms";
    			t5 = space();
    			div3 = element("div");
    			p3 = element("p");
    			p3.textContent = "Alive";
    			t7 = space();
    			div2 = element("div");
    			p4 = element("p");
    			p4.textContent = "N/A";
    			t9 = text(" \r\n              ");
    			p5 = element("p");
    			t10 = space();
    			div5 = element("div");
    			p6 = element("p");
    			p6.textContent = "Host Address";
    			t12 = space();
    			div4 = element("div");
    			p7 = element("p");
    			p7.textContent = "N/A";
    			t14 = text(" \r\n              ");
    			p8 = element("p");
    			attr_dev(p0, "class", "text-white font-thin text-lg text-xl");
    			add_location(p0, file$6, 64, 10, 2421);
    			attr_dev(p1, "id", "infoValueCPN");
    			attr_dev(p1, "class", "font-bold text-white text-3xl");
    			add_location(p1, file$6, 66, 14, 2534);
    			attr_dev(p2, "class", "font-bold text-white text-3xl");
    			add_location(p2, file$6, 67, 14, 2621);
    			attr_dev(div0, "class", "flex flex-row");
    			add_location(div0, file$6, 65, 12, 2491);
    			attr_dev(div1, "class", "p-4 m-2 flex flex-col justify-center items-center");
    			add_location(div1, file$6, 63, 8, 2346);
    			attr_dev(p3, "class", "text-white font-thin text-lg text-xl");
    			add_location(p3, file$6, 72, 10, 2791);
    			attr_dev(p4, "id", "infoValueCPN");
    			attr_dev(p4, "class", "font-bold text-white text-3xl");
    			add_location(p4, file$6, 74, 14, 2905);
    			attr_dev(p5, "class", "font-bold text-white text-3xl");
    			add_location(p5, file$6, 75, 14, 2992);
    			attr_dev(div2, "class", "flex flex-row");
    			add_location(div2, file$6, 73, 12, 2862);
    			attr_dev(div3, "class", "p-4 m-2 flex flex-col justify-center items-center");
    			add_location(div3, file$6, 71, 8, 2716);
    			attr_dev(p6, "class", "text-white font-thin text-lg text-xl");
    			add_location(p6, file$6, 80, 10, 3160);
    			attr_dev(p7, "id", "infoValueCPN");
    			attr_dev(p7, "class", "font-bold text-white text-3xl");
    			add_location(p7, file$6, 82, 14, 3281);
    			attr_dev(p8, "class", "font-bold text-white text-sm");
    			add_location(p8, file$6, 83, 14, 3368);
    			attr_dev(div4, "class", "flex flex-row");
    			add_location(div4, file$6, 81, 12, 3238);
    			attr_dev(div5, "class", "p-4 m-2 flex flex-col justify-center items-center");
    			add_location(div5, file$6, 79, 8, 3085);
    			attr_dev(div6, "class", "flex flex-row");
    			add_location(div6, file$6, 61, 4, 2307);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div1);
    			append_dev(div1, p0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, p1);
    			append_dev(div0, t3);
    			append_dev(div0, p2);
    			append_dev(div6, t5);
    			append_dev(div6, div3);
    			append_dev(div3, p3);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, p4);
    			append_dev(div2, t9);
    			append_dev(div2, p5);
    			append_dev(div6, t10);
    			append_dev(div6, div5);
    			append_dev(div5, p6);
    			append_dev(div5, t12);
    			append_dev(div5, div4);
    			append_dev(div4, p7);
    			append_dev(div4, t14);
    			append_dev(div4, p8);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(61:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (31:4) {#if ping}
    function create_if_block$1(ctx) {
    	let div6;
    	let div1;
    	let p0;
    	let t1;
    	let div0;
    	let p1;
    	let t2_value = /*ping*/ ctx[0].time + "";
    	let t2;
    	let t3;
    	let p2;
    	let t5;
    	let div3;
    	let p3;
    	let t7;
    	let div2;
    	let p4;
    	let t8_value = /*ping*/ ctx[0].alive + "";
    	let t8;
    	let t9;
    	let p5;
    	let t10;
    	let div5;
    	let p6;
    	let t12;
    	let div4;
    	let p7;
    	let t13_value = /*ping*/ ctx[0].hst + "";
    	let t13;
    	let t14;
    	let p8;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = "Time";
    			t1 = space();
    			div0 = element("div");
    			p1 = element("p");
    			t2 = text(t2_value);
    			t3 = text(" \r\n              ");
    			p2 = element("p");
    			p2.textContent = "ms";
    			t5 = space();
    			div3 = element("div");
    			p3 = element("p");
    			p3.textContent = "Alive";
    			t7 = space();
    			div2 = element("div");
    			p4 = element("p");
    			t8 = text(t8_value);
    			t9 = text(" \r\n              ");
    			p5 = element("p");
    			t10 = space();
    			div5 = element("div");
    			p6 = element("p");
    			p6.textContent = "Host Address";
    			t12 = space();
    			div4 = element("div");
    			p7 = element("p");
    			t13 = text(t13_value);
    			t14 = text(" \r\n              ");
    			p8 = element("p");
    			attr_dev(p0, "class", "text-white font-thin text-lg text-xl");
    			add_location(p0, file$6, 34, 10, 1181);
    			attr_dev(p1, "id", "infoValueCPN");
    			attr_dev(p1, "class", "font-bold text-white text-3xl");
    			add_location(p1, file$6, 36, 14, 1294);
    			attr_dev(p2, "class", "font-bold text-white text-3xl");
    			add_location(p2, file$6, 37, 14, 1389);
    			attr_dev(div0, "class", "flex flex-row");
    			add_location(div0, file$6, 35, 12, 1251);
    			attr_dev(div1, "class", "p-4 m-2 flex flex-col justify-center items-center");
    			add_location(div1, file$6, 33, 8, 1106);
    			attr_dev(p3, "class", "text-white font-thin text-lg text-xl");
    			add_location(p3, file$6, 42, 10, 1559);
    			attr_dev(p4, "id", "infoValueCPN");
    			attr_dev(p4, "class", "font-bold text-white text-3xl");
    			add_location(p4, file$6, 44, 14, 1673);
    			attr_dev(p5, "class", "font-bold text-white text-3xl");
    			add_location(p5, file$6, 45, 14, 1769);
    			attr_dev(div2, "class", "flex flex-row");
    			add_location(div2, file$6, 43, 12, 1630);
    			attr_dev(div3, "class", "p-4 m-2 flex flex-col justify-center items-center");
    			add_location(div3, file$6, 41, 8, 1484);
    			attr_dev(p6, "class", "text-white font-thin text-lg text-xl");
    			add_location(p6, file$6, 50, 10, 1937);
    			attr_dev(p7, "id", "infoValueCPN");
    			attr_dev(p7, "class", "font-bold text-white text-3xl");
    			add_location(p7, file$6, 52, 14, 2058);
    			attr_dev(p8, "class", "font-bold text-white text-sm");
    			add_location(p8, file$6, 53, 14, 2152);
    			attr_dev(div4, "class", "flex flex-row");
    			add_location(div4, file$6, 51, 12, 2015);
    			attr_dev(div5, "class", "p-4 m-2 flex flex-col justify-center items-center");
    			add_location(div5, file$6, 49, 8, 1862);
    			attr_dev(div6, "class", "flex flex-row");
    			add_location(div6, file$6, 31, 4, 1067);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div1);
    			append_dev(div1, p0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, p1);
    			append_dev(p1, t2);
    			append_dev(div0, t3);
    			append_dev(div0, p2);
    			append_dev(div6, t5);
    			append_dev(div6, div3);
    			append_dev(div3, p3);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, p4);
    			append_dev(p4, t8);
    			append_dev(div2, t9);
    			append_dev(div2, p5);
    			append_dev(div6, t10);
    			append_dev(div6, div5);
    			append_dev(div5, p6);
    			append_dev(div5, t12);
    			append_dev(div5, div4);
    			append_dev(div4, p7);
    			append_dev(p7, t13);
    			append_dev(div4, t14);
    			append_dev(div4, p8);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ping*/ 1 && t2_value !== (t2_value = /*ping*/ ctx[0].time + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*ping*/ 1 && t8_value !== (t8_value = /*ping*/ ctx[0].alive + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*ping*/ 1 && t13_value !== (t13_value = /*ping*/ ctx[0].hst + "")) set_data_dev(t13, t13_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(31:4) {#if ping}",
    		ctx
    	});

    	return block;
    }

    // (24:0) <Shell title={"PING TOOL"} tooltip={"Check PING Timings"}>
    function create_default_slot$1(ctx) {
    	let div2;
    	let div0;
    	let input;
    	let t0;
    	let button;
    	let t2;
    	let div1;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*ping*/ ctx[0]) return create_if_block$1;
    		return create_else_block$1;
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
    			attr_dev(input, "placeholder", "Enter IP/Domain");
    			attr_dev(input, "class", "rounded-md m-2 px-1 text-gray-800 font-bold");
    			add_location(input, file$6, 26, 4, 705);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-thin hover:bg-blue-600");
    			add_location(button, file$6, 27, 4, 830);
    			attr_dev(div0, "class", "flex flex-row justify-start mt-1");
    			add_location(div0, file$6, 25, 4, 653);
    			attr_dev(div1, "class", "flex flex-col items-start text-gray-50");
    			add_location(div1, file$6, 29, 4, 993);
    			attr_dev(div2, "class", "flex flex-col");
    			add_location(div2, file$6, 24, 2, 620);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*name*/ ctx[1]);
    			append_dev(div0, t0);
    			append_dev(div0, button);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			if_block.m(div1, null);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    				listen_dev(button, "click", /*sendData*/ ctx[2], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*name*/ 2 && input.value !== /*name*/ ctx[1]) {
    				set_input_value(input, /*name*/ ctx[1]);
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
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(24:0) <Shell title={\\\"PING TOOL\\\"} tooltip={\\\"Check PING Timings\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "PING TOOL",
    				tooltip: "Check PING Timings",
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

    			if (dirty & /*$$scope, ping, name*/ 67) {
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
    	let ping, name, pingInterval;

    	function sendData() {
    		pingInterval = setInterval(
    			() => {
    				ipcRenderer.send("get-ping-info", name);

    				ipcRenderer.on("get-ping-info", (e, pInfo) => {
    					$$invalidate(0, ping = pInfo);
    				});
    			},
    			1000
    		);
    	}

    	onDestroy(() => {
    		console.log("Component Unmounted");
    		clearInterval(pingInterval);
    	});

    	function input_input_handler() {
    		name = this.value;
    		$$invalidate(1, name);
    	}

    	$$self.$capture_state = () => ({
    		onDestroy,
    		ipcRenderer,
    		Shell,
    		ping,
    		name,
    		pingInterval,
    		sendData,
    		require,
    		setInterval,
    		console,
    		clearInterval
    	});

    	$$self.$inject_state = $$props => {
    		if ("ping" in $$props) $$invalidate(0, ping = $$props.ping);
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    		if ("pingInterval" in $$props) pingInterval = $$props.pingInterval;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [ping, name, sendData, pingInterval, ipcRenderer, input_input_handler];
    }

    class Ping extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ping",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\Components\Network\Whois\Whois.svelte generated by Svelte v3.19.1 */
    const file$7 = "src\\Components\\Network\\Whois\\Whois.svelte";

    // (31:4) {:else}
    function create_else_block$2(ctx) {
    	let p0;
    	let t1;
    	let p1;
    	let t3;
    	let p2;
    	let t5;
    	let p3;
    	let t7;
    	let p4;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "Range: N/A";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "Organization : N/A";
    			t3 = space();
    			p2 = element("p");
    			p2.textContent = "City: N/A";
    			t5 = space();
    			p3 = element("p");
    			p3.textContent = "Country: N/A";
    			t7 = space();
    			p4 = element("p");
    			p4.textContent = "Updated on: N/A";
    			add_location(p0, file$7, 31, 4, 1340);
    			add_location(p1, file$7, 32, 4, 1363);
    			add_location(p2, file$7, 33, 4, 1394);
    			add_location(p3, file$7, 34, 4, 1416);
    			add_location(p4, file$7, 35, 4, 1441);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p3, anchor);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p4, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(31:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (24:4) {#if whois}
    function create_if_block$2(ctx) {
    	let p0;
    	let t0;
    	let span0;
    	let t1_value = /*whois*/ ctx[0].range + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3;
    	let span1;
    	let t4_value = /*whois*/ ctx[0].organisation.OrgName + "";
    	let t4;
    	let t5;
    	let p2;
    	let t6;
    	let span2;
    	let t7_value = /*whois*/ ctx[0].organisation.City + "";
    	let t7;
    	let t8;
    	let p3;
    	let t9;
    	let span3;
    	let t10_value = /*whois*/ ctx[0].organisation.Country + "";
    	let t10;
    	let t11;
    	let p4;
    	let t12;
    	let span4;
    	let t13_value = /*whois*/ ctx[0].organisation.Updated + "";
    	let t13;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text("Range: ");
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text("Organization : ");
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			p2 = element("p");
    			t6 = text("City: ");
    			span2 = element("span");
    			t7 = text(t7_value);
    			t8 = space();
    			p3 = element("p");
    			t9 = text("Country: ");
    			span3 = element("span");
    			t10 = text(t10_value);
    			t11 = space();
    			p4 = element("p");
    			t12 = text("Updated on: ");
    			span4 = element("span");
    			t13 = text(t13_value);
    			attr_dev(span0, "class", "font-bold text-lg");
    			add_location(span0, file$7, 24, 18, 888);
    			add_location(p0, file$7, 24, 8, 878);
    			attr_dev(span1, "class", "font-bold text-lg");
    			add_location(span1, file$7, 25, 26, 972);
    			add_location(p1, file$7, 25, 8, 954);
    			attr_dev(span2, "class", "font-bold text-lg");
    			add_location(span2, file$7, 26, 17, 1062);
    			add_location(p2, file$7, 26, 8, 1053);
    			attr_dev(span3, "class", "font-bold text-lg");
    			add_location(span3, file$7, 27, 20, 1152);
    			add_location(p3, file$7, 27, 8, 1140);
    			attr_dev(span4, "class", "font-bold text-lg");
    			add_location(span4, file$7, 28, 23, 1248);
    			add_location(p4, file$7, 28, 8, 1233);
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
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, t6);
    			append_dev(p2, span2);
    			append_dev(span2, t7);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, p3, anchor);
    			append_dev(p3, t9);
    			append_dev(p3, span3);
    			append_dev(span3, t10);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, p4, anchor);
    			append_dev(p4, t12);
    			append_dev(p4, span4);
    			append_dev(span4, t13);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*whois*/ 1 && t1_value !== (t1_value = /*whois*/ ctx[0].range + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*whois*/ 1 && t4_value !== (t4_value = /*whois*/ ctx[0].organisation.OrgName + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*whois*/ 1 && t7_value !== (t7_value = /*whois*/ ctx[0].organisation.City + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*whois*/ 1 && t10_value !== (t10_value = /*whois*/ ctx[0].organisation.Country + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*whois*/ 1 && t13_value !== (t13_value = /*whois*/ ctx[0].organisation.Updated + "")) set_data_dev(t13, t13_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(p4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(24:4) {#if whois}",
    		ctx
    	});

    	return block;
    }

    // (17:0) <Shell title={"WHOIS LOOKUP"} tooltip={"Check WHOIS"}>
    function create_default_slot$2(ctx) {
    	let div2;
    	let div0;
    	let input;
    	let t0;
    	let button;
    	let t2;
    	let div1;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*whois*/ ctx[0]) return create_if_block$2;
    		return create_else_block$2;
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
    			attr_dev(input, "class", "rounded-md m-2 px-1 text-gray-800 font-bold");
    			add_location(input, file$7, 19, 4, 520);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-thin hover:bg-blue-600");
    			add_location(button, file$7, 20, 4, 636);
    			attr_dev(div0, "class", "flex flex-row justify-start mt-1");
    			add_location(div0, file$7, 18, 4, 468);
    			attr_dev(div1, "class", "flex flex-col items-start text-gray-50");
    			add_location(div1, file$7, 22, 4, 799);
    			attr_dev(div2, "class", "flex flex-col");
    			add_location(div2, file$7, 17, 2, 435);
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
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(17:0) <Shell title={\\\"WHOIS LOOKUP\\\"} tooltip={\\\"Check WHOIS\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "WHOIS LOOKUP",
    				tooltip: "Check WHOIS",
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let whois, ip;

    	//ipcRenderer.send('get-whois-info');
    	function sendData() {
    		ipcRenderer.send("get-whois-info", ip);

    		ipcRenderer.on("get-whois-info", (e, whoisInfo) => {
    			$$invalidate(0, whois = whoisInfo);
    		});
    	}

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
    		require
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
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Whois",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\Components\Network\NetworkInterfaces\NetworkInterfaces.svelte generated by Svelte v3.19.1 */
    const file$8 = "src\\Components\\Network\\NetworkInterfaces\\NetworkInterfaces.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i].iface;
    	child_ctx[3] = list[i].ip4;
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (28:4) {:else}
    function create_else_block_2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Fetching Required Info...";
    			add_location(p, file$8, 28, 8, 1104);
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
    		source: "(28:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:4) {#if interfaces}
    function create_if_block$3(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*interfaces*/ ctx[0].length > 0) return create_if_block_1;
    		return create_else_block_1;
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
    		source: "(14:4) {#if interfaces}",
    		ctx
    	});

    	return block;
    }

    // (25:8) {:else}
    function create_else_block_1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Couldn't find any interfaces.";
    			add_location(p, file$8, 25, 12, 1030);
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
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(25:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (15:8) {#if interfaces.length > 0}
    function create_if_block_1(ctx) {
    	let if_block_anchor;

    	function select_block_type_2(ctx, dirty) {
    		if (/*interfaces*/ ctx[0].length > 1) return create_if_block_2;
    		return create_else_block$3;
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(15:8) {#if interfaces.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (21:12) {:else}
    function create_else_block$3(ctx) {
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
    			attr_dev(span0, "class", "font-bold text-lg");
    			add_location(span0, file$8, 21, 22, 823);
    			add_location(p0, file$8, 21, 16, 817);
    			attr_dev(span1, "class", "font-bold text-lg");
    			add_location(span1, file$8, 22, 32, 918);
    			add_location(p1, file$8, 22, 16, 902);
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
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(21:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (16:12) {#if interfaces.length > 1}
    function create_if_block_2(ctx) {
    	let each_1_anchor;
    	let each_value = /*interfaces*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
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
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
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
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(16:12) {#if interfaces.length > 1}",
    		ctx
    	});

    	return block;
    }

    // (17:16) {#each interfaces as {iface, ip4}
    function create_each_block(ctx) {
    	let p0;
    	let t0_value = /*_id*/ ctx[5] + 1 + "";
    	let t0;
    	let t1;
    	let span0;
    	let t2_value = /*iface*/ ctx[2] + "";
    	let t2;
    	let t3;
    	let p1;
    	let t4;
    	let span1;
    	let t5_value = /*ip4*/ ctx[3] + "";
    	let t5;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = text(". ");
    			span0 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			p1 = element("p");
    			t4 = text("IP4 Address: ");
    			span1 = element("span");
    			t5 = text(t5_value);
    			attr_dev(span0, "class", "font-bold text-lg");
    			add_location(span0, file$8, 17, 28, 621);
    			add_location(p0, file$8, 17, 16, 609);
    			attr_dev(span1, "class", "font-bold text-lg");
    			add_location(span1, file$8, 18, 32, 705);
    			add_location(p1, file$8, 18, 16, 689);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t0);
    			append_dev(p0, t1);
    			append_dev(p0, span0);
    			append_dev(span0, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t4);
    			append_dev(p1, span1);
    			append_dev(span1, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*interfaces*/ 1 && t2_value !== (t2_value = /*iface*/ ctx[2] + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*interfaces*/ 1 && t5_value !== (t5_value = /*ip4*/ ctx[3] + "")) set_data_dev(t5, t5_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(17:16) {#each interfaces as {iface, ip4}",
    		ctx
    	});

    	return block;
    }

    // (12:0) <Shell title={"AVAILABLE NETWORK INTERFACES"} tooltip={"List of available network interfaces"}>
    function create_default_slot$3(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*interfaces*/ ctx[0]) return create_if_block$3;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "text-gray-50");
    			add_location(div, file$8, 12, 4, 408);
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
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(12:0) <Shell title={\\\"AVAILABLE NETWORK INTERFACES\\\"} tooltip={\\\"List of available network interfaces\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "AVAILABLE NETWORK INTERFACES",
    				tooltip: "List of available network interfaces",
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

    			if (dirty & /*$$scope, interfaces*/ 65) {
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

    function instance$9($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let interfaces;
    	ipcRenderer.send("get-network-interfaces");

    	ipcRenderer.on("get-network-interfaces", (e, networkInfo) => {
    		$$invalidate(0, interfaces = networkInfo);
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

    class NetworkInterfaces extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NetworkInterfaces",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\Components\Network\Dns\Dns.svelte generated by Svelte v3.19.1 */
    const file$9 = "src\\Components\\Network\\Dns\\Dns.svelte";

    // (23:12) {#if dns}
    function create_if_block$4(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (!/*dns*/ ctx[0].err) return create_if_block_1$1;
    		return create_else_block$4;
    	}

    	let current_block_type = select_block_type(ctx);
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
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
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
    		source: "(23:12) {#if dns}",
    		ctx
    	});

    	return block;
    }

    // (27:16) {:else}
    function create_else_block$4(ctx) {
    	let p;
    	let span;

    	const block = {
    		c: function create() {
    			p = element("p");
    			span = element("span");
    			span.textContent = "Error: DNS couldn't be found";
    			attr_dev(span, "class", "font-bold text-lg");
    			add_location(span, file$9, 27, 23, 969);
    			add_location(p, file$9, 27, 20, 966);
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
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(27:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (24:16) {#if !dns.err}
    function create_if_block_1$1(ctx) {
    	let p0;
    	let t0;
    	let span0;
    	let t1_value = /*dns*/ ctx[0].address + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3;
    	let span1;
    	let t4_value = /*dns*/ ctx[0].family + "";
    	let t4;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text("IP Address: ");
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text("Family: ");
    			span1 = element("span");
    			t4 = text(t4_value);
    			attr_dev(span0, "class", "font-bold text-lg");
    			add_location(span0, file$9, 24, 35, 775);
    			add_location(p0, file$9, 24, 20, 760);
    			attr_dev(span1, "class", "font-bold text-lg");
    			add_location(span1, file$9, 25, 31, 864);
    			add_location(p1, file$9, 25, 20, 853);
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
    			if (dirty & /*dns*/ 1 && t1_value !== (t1_value = /*dns*/ ctx[0].address + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*dns*/ 1 && t4_value !== (t4_value = /*dns*/ ctx[0].family + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(24:16) {#if !dns.err}",
    		ctx
    	});

    	return block;
    }

    // (16:0) <Shell title={"DNS LOOKUP"} tooltip={"DNS Lookup"}>
    function create_default_slot$4(ctx) {
    	let div2;
    	let div0;
    	let input;
    	let t0;
    	let button;
    	let t2;
    	let div1;
    	let dispose;
    	let if_block = /*dns*/ ctx[0] && create_if_block$4(ctx);

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
    			if (if_block) if_block.c();
    			attr_dev(input, "class", "text-black");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Domain Name");
    			add_location(input, file$9, 18, 12, 504);
    			attr_dev(button, "type", "button");
    			add_location(button, file$9, 19, 12, 593);
    			attr_dev(div0, "class", "flex flex-row");
    			add_location(div0, file$9, 17, 8, 463);
    			add_location(div1, file$9, 21, 8, 678);
    			attr_dev(div2, "class", "text-gray-50");
    			add_location(div2, file$9, 16, 4, 427);
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
    			if (if_block) if_block.m(div1, null);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    				listen_dev(button, "click", /*getDnsInfo*/ ctx[2], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*value*/ 2 && input.value !== /*value*/ ctx[1]) {
    				set_input_value(input, /*value*/ ctx[1]);
    			}

    			if (/*dns*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					if_block.m(div1, null);
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
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(16:0) <Shell title={\\\"DNS LOOKUP\\\"} tooltip={\\\"DNS Lookup\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "DNS LOOKUP",
    				tooltip: "DNS Lookup",
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

    			if (dirty & /*$$scope, dns, value*/ 35) {
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

    function instance$a($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let dns, value = "";

    	const getDnsInfo = () => {
    		ipcRenderer.send("get-dns-lookup", value);

    		ipcRenderer.on("get-dns-lookup", (e, dnsInfo) => {
    			$$invalidate(0, dns = dnsInfo);
    		});

    		$$invalidate(1, value = "");
    	};

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(1, value);
    	}

    	$$self.$capture_state = () => ({
    		ipcRenderer,
    		Shell,
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
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dns",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\Pages\_network.svelte generated by Svelte v3.19.1 */
    const file$a = "src\\Pages\\_network.svelte";

    // (9:0) <Page>
    function create_default_slot$5(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let current;
    	const ping = new Ping({ $$inline: true });
    	const whois = new Whois({ $$inline: true });
    	const networkinterfaces = new NetworkInterfaces({ $$inline: true });
    	const dns = new Dns({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(ping.$$.fragment);
    			t0 = space();
    			create_component(whois.$$.fragment);
    			t1 = space();
    			create_component(networkinterfaces.$$.fragment);
    			t2 = space();
    			create_component(dns.$$.fragment);
    			attr_dev(div, "class", "p-6 grid grid-cols-2 gap-4");
    			add_location(div, file$a, 9, 4, 366);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(ping, div, null);
    			append_dev(div, t0);
    			mount_component(whois, div, null);
    			append_dev(div, t1);
    			mount_component(networkinterfaces, div, null);
    			append_dev(div, t2);
    			mount_component(dns, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ping.$$.fragment, local);
    			transition_in(whois.$$.fragment, local);
    			transition_in(networkinterfaces.$$.fragment, local);
    			transition_in(dns.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ping.$$.fragment, local);
    			transition_out(whois.$$.fragment, local);
    			transition_out(networkinterfaces.$$.fragment, local);
    			transition_out(dns.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(ping);
    			destroy_component(whois);
    			destroy_component(networkinterfaces);
    			destroy_component(dns);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(9:0) <Page>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let current;

    	const page = new Page({
    			props: {
    				$$slots: { default: [create_default_slot$5] },
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
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	$$self.$capture_state = () => ({
    		Page,
    		Ping,
    		Whois,
    		NetworkInterfaces,
    		Dns
    	});

    	return [];
    }

    class Network extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Network",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\Components\Misc\Range.svelte generated by Svelte v3.19.1 */

    const file$b = "src\\Components\\Misc\\Range.svelte";

    function create_fragment$c(ctx) {
    	let div1;
    	let div0;
    	let div0_class_value;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			set_style(div0, "width", /*length*/ ctx[1] + "%");
    			attr_dev(div0, "class", div0_class_value = "h-full rounded-sm " + /*color*/ ctx[0] + " svelte-jzgo3x");
    			add_location(div0, file$b, 6, 4, 143);
    			attr_dev(div1, "class", "w-full rounded-md bg-gray-200 h-4");
    			add_location(div1, file$b, 5, 0, 90);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*length*/ 2) {
    				set_style(div0, "width", /*length*/ ctx[1] + "%");
    			}

    			if (dirty & /*color*/ 1 && div0_class_value !== (div0_class_value = "h-full rounded-sm " + /*color*/ ctx[0] + " svelte-jzgo3x")) {
    				attr_dev(div0, "class", div0_class_value);
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
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { color = "bg-gray-200" } = $$props;
    	let { length = 0 } = $$props;
    	const writable_props = ["color", "length"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Range> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    		if ("length" in $$props) $$invalidate(1, length = $$props.length);
    	};

    	$$self.$capture_state = () => ({ color, length });

    	$$self.$inject_state = $$props => {
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    		if ("length" in $$props) $$invalidate(1, length = $$props.length);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, length];
    }

    class Range extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { color: 0, length: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Range",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get color() {
    		throw new Error("<Range>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Range>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get length() {
    		throw new Error("<Range>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set length(value) {
    		throw new Error("<Range>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Components\Diagnostics\PasswordStrength\PasswordStrength.svelte generated by Svelte v3.19.1 */
    const file$c = "src\\Components\\Diagnostics\\PasswordStrength\\PasswordStrength.svelte";

    // (50:0) <Shell title={"PASSWORD STRENGTH CHECKER"} tooltip={"Get detailed analysis of passwords"}>
    function create_default_slot$6(ctx) {
    	let div13;
    	let div0;
    	let input;
    	let input_maxlength_value;
    	let t0;
    	let button;
    	let t2;
    	let div3;
    	let div1;
    	let span0;
    	let t4;
    	let t5;
    	let div2;
    	let span1;
    	let t7;
    	let t8;
    	let div12;
    	let div5;
    	let div4;
    	let t9;
    	let span2;
    	let t11;
    	let div7;
    	let div6;
    	let t12;
    	let span3;
    	let t14;
    	let div9;
    	let div8;
    	let t15;
    	let span4;
    	let t17;
    	let div11;
    	let div10;
    	let t18;
    	let span5;
    	let current;
    	let dispose;

    	const range0 = new Range({
    			props: {
    				color: /*strengthColor*/ ctx[3],
    				length: /*strength*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const range1 = new Range({
    			props: {
    				color: /*lengthColor*/ ctx[4],
    				length: /*length*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div13 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			button = element("button");
    			button.textContent = "Check";
    			t2 = space();
    			div3 = element("div");
    			div1 = element("div");
    			span0 = element("span");
    			span0.textContent = "Strength";
    			t4 = space();
    			create_component(range0.$$.fragment);
    			t5 = space();
    			div2 = element("div");
    			span1 = element("span");
    			span1.textContent = "Length";
    			t7 = space();
    			create_component(range1.$$.fragment);
    			t8 = space();
    			div12 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			t9 = space();
    			span2 = element("span");
    			span2.textContent = "Too Weak";
    			t11 = space();
    			div7 = element("div");
    			div6 = element("div");
    			t12 = space();
    			span3 = element("span");
    			span3.textContent = "Weak";
    			t14 = space();
    			div9 = element("div");
    			div8 = element("div");
    			t15 = space();
    			span4 = element("span");
    			span4.textContent = "Medium";
    			t17 = space();
    			div11 = element("div");
    			div10 = element("div");
    			t18 = space();
    			span5 = element("span");
    			span5.textContent = "Strong";
    			attr_dev(input, "class", "text-black");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "maxlength", input_maxlength_value = 32);
    			attr_dev(input, "placeholder", "Enter Password");
    			add_location(input, file$c, 52, 12, 2044);
    			attr_dev(button, "type", "submit");
    			add_location(button, file$c, 53, 12, 2164);
    			attr_dev(div0, "class", "flex flex-row");
    			add_location(div0, file$c, 51, 8, 2003);
    			add_location(span0, file$c, 59, 16, 2402);
    			attr_dev(div1, "class", "flex flex-row items-center");
    			add_location(div1, file$c, 57, 12, 2309);
    			add_location(span1, file$c, 64, 16, 2615);
    			attr_dev(div2, "class", "flex flex-row items-center");
    			add_location(div2, file$c, 62, 12, 2524);
    			add_location(div3, file$c, 55, 8, 2251);
    			attr_dev(div4, "class", "w-8 h-2 mr-2 bg-red-600");
    			add_location(div4, file$c, 70, 16, 2820);
    			add_location(span2, file$c, 71, 16, 2881);
    			attr_dev(div5, "class", "flex flex-row items-center");
    			add_location(div5, file$c, 69, 12, 2762);
    			attr_dev(div6, "class", "w-8 h-2 mr-2");
    			set_style(div6, "background-color", "orangered");
    			add_location(div6, file$c, 74, 16, 2994);
    			add_location(span3, file$c, 75, 16, 3081);
    			attr_dev(div7, "class", "flex flex-row items-center");
    			add_location(div7, file$c, 73, 12, 2936);
    			attr_dev(div8, "class", "w-8 h-2 mr-2 bg-yellow-400");
    			add_location(div8, file$c, 78, 16, 3190);
    			add_location(span4, file$c, 79, 16, 3254);
    			attr_dev(div9, "class", "flex flex-row items-center");
    			add_location(div9, file$c, 77, 12, 3132);
    			attr_dev(div10, "class", "w-8 h-2 mr-2 bg-green-600");
    			add_location(div10, file$c, 82, 16, 3365);
    			add_location(span5, file$c, 83, 16, 3428);
    			attr_dev(div11, "class", "flex flex-row items-center");
    			add_location(div11, file$c, 81, 12, 3307);
    			add_location(div12, file$c, 68, 8, 2743);
    			attr_dev(div13, "class", "text-gray-50");
    			add_location(div13, file$c, 50, 4, 1967);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div13, anchor);
    			append_dev(div13, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*password*/ ctx[0]);
    			append_dev(div0, t0);
    			append_dev(div0, button);
    			append_dev(div13, t2);
    			append_dev(div13, div3);
    			append_dev(div3, div1);
    			append_dev(div1, span0);
    			append_dev(div1, t4);
    			mount_component(range0, div1, null);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, span1);
    			append_dev(div2, t7);
    			mount_component(range1, div2, null);
    			append_dev(div13, t8);
    			append_dev(div13, div12);
    			append_dev(div12, div5);
    			append_dev(div5, div4);
    			append_dev(div5, t9);
    			append_dev(div5, span2);
    			append_dev(div12, t11);
    			append_dev(div12, div7);
    			append_dev(div7, div6);
    			append_dev(div7, t12);
    			append_dev(div7, span3);
    			append_dev(div12, t14);
    			append_dev(div12, div9);
    			append_dev(div9, div8);
    			append_dev(div9, t15);
    			append_dev(div9, span4);
    			append_dev(div12, t17);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div11, t18);
    			append_dev(div11, span5);
    			current = true;

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[7]),
    				listen_dev(button, "click", /*checkPassword*/ ctx[5], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*password*/ 1 && input.value !== /*password*/ ctx[0]) {
    				set_input_value(input, /*password*/ ctx[0]);
    			}

    			const range0_changes = {};
    			if (dirty & /*strengthColor*/ 8) range0_changes.color = /*strengthColor*/ ctx[3];
    			if (dirty & /*strength*/ 2) range0_changes.length = /*strength*/ ctx[1];
    			range0.$set(range0_changes);
    			const range1_changes = {};
    			if (dirty & /*lengthColor*/ 16) range1_changes.color = /*lengthColor*/ ctx[4];
    			if (dirty & /*length*/ 4) range1_changes.length = /*length*/ ctx[2];
    			range1.$set(range1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(range0.$$.fragment, local);
    			transition_in(range1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(range0.$$.fragment, local);
    			transition_out(range1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div13);
    			destroy_component(range0);
    			destroy_component(range1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$6.name,
    		type: "slot",
    		source: "(50:0) <Shell title={\\\"PASSWORD STRENGTH CHECKER\\\"} tooltip={\\\"Get detailed analysis of passwords\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "PASSWORD STRENGTH CHECKER",
    				tooltip: "Get detailed analysis of passwords",
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

    			if (dirty & /*$$scope, lengthColor, length, strengthColor, strength, password*/ 287) {
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

    function instance$d($$self, $$props, $$invalidate) {
    	let password = "", strength = 0, length = 0;
    	let strengthColor = "bg-gray-200";
    	let lengthColor = "bg-gray-200";

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
    		if (password.length <= 4) ($$invalidate(2, length = 25), $$invalidate(4, lengthColor = "bg-red-600")); else if (password.length <= 6) ($$invalidate(2, length = 50), $$invalidate(4, lengthColor = "bg-orange")); else if (password.length <= 8) ($$invalidate(2, length = 75), $$invalidate(4, lengthColor = "bg-yellow-400")); else ($$invalidate(2, length = 100), $$invalidate(4, lengthColor = "bg-green-600"));

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
    				$$invalidate(1, strength = 25);
    				$$invalidate(3, strengthColor = "bg-red-600");
    				break;
    			case 1:
    				$$invalidate(1, strength = 25);
    				$$invalidate(3, strengthColor = "bg-red-600");
    				break;
    			case 2:
    				$$invalidate(1, strength = 50);
    				$$invalidate(3, strengthColor = "bg-orange");
    				break;
    			case 3:
    				$$invalidate(1, strength = 75);
    				$$invalidate(3, strengthColor = "bg-yellow-400");
    				break;
    			case 4:
    				$$invalidate(1, strength = 100);
    				$$invalidate(3, strengthColor = "bg-green-600");
    				break;
    		}
    	};

    	function input_input_handler() {
    		password = this.value;
    		$$invalidate(0, password);
    	}

    	$$self.$capture_state = () => ({
    		Shell,
    		Range,
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
    		if ("length" in $$props) $$invalidate(2, length = $$props.length);
    		if ("strengthColor" in $$props) $$invalidate(3, strengthColor = $$props.strengthColor);
    		if ("lengthColor" in $$props) $$invalidate(4, lengthColor = $$props.lengthColor);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		password,
    		strength,
    		length,
    		strengthColor,
    		lengthColor,
    		checkPassword,
    		specialCharacters,
    		input_input_handler
    	];
    }

    class PasswordStrength extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PasswordStrength",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\Components\Diagnostics\SslChecker\SslChecker.svelte generated by Svelte v3.19.1 */
    const file$d = "src\\Components\\Diagnostics\\SslChecker\\SslChecker.svelte";

    // (23:12) {#if ssl}
    function create_if_block$5(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (!/*ssl*/ ctx[0].err) return create_if_block_1$2;
    		return create_else_block$5;
    	}

    	let current_block_type = select_block_type(ctx);
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
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
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
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(23:12) {#if ssl}",
    		ctx
    	});

    	return block;
    }

    // (30:16) {:else}
    function create_else_block$5(ctx) {
    	let p;
    	let span;

    	const block = {
    		c: function create() {
    			p = element("p");
    			span = element("span");
    			span.textContent = "Error: SSL certificate couldn't be found";
    			attr_dev(span, "class", "font-bold text-lg");
    			add_location(span, file$d, 30, 23, 1302);
    			add_location(p, file$d, 30, 20, 1299);
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
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(30:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (24:16) {#if !ssl.err}
    function create_if_block_1$2(ctx) {
    	let p0;
    	let t0;
    	let span0;
    	let t1_value = /*ssl*/ ctx[0].daysRemaining + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3;
    	let span1;
    	let t4_value = /*ssl*/ ctx[0].valid + "";
    	let t4;
    	let t5;
    	let p2;
    	let t6;
    	let span2;
    	let t7_value = /*ssl*/ ctx[0].validFrom.substring(0, 10) + "";
    	let t7;
    	let t8;
    	let p3;
    	let t9;
    	let span3;
    	let t10_value = /*ssl*/ ctx[0].validTo.substring(0, 10) + "";
    	let t10;
    	let t11;
    	let p4;
    	let t12;
    	let span4;
    	let t13_value = /*ssl*/ ctx[0].validFor[0] + "";
    	let t13;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text("Days Left: ");
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text("Valid: ");
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			p2 = element("p");
    			t6 = text("Valid From: ");
    			span2 = element("span");
    			t7 = text(t7_value);
    			t8 = space();
    			p3 = element("p");
    			t9 = text("Valid To: ");
    			span3 = element("span");
    			t10 = text(t10_value);
    			t11 = space();
    			p4 = element("p");
    			t12 = text("Valid For: ");
    			span4 = element("span");
    			t13 = text(t13_value);
    			attr_dev(span0, "class", "font-bold text-lg");
    			add_location(span0, file$d, 24, 34, 788);
    			add_location(p0, file$d, 24, 20, 774);
    			attr_dev(span1, "class", "font-bold text-lg");
    			add_location(span1, file$d, 25, 30, 882);
    			add_location(p1, file$d, 25, 20, 872);
    			attr_dev(span2, "class", "font-bold text-lg");
    			add_location(span2, file$d, 26, 35, 973);
    			add_location(p2, file$d, 26, 20, 958);
    			attr_dev(span3, "class", "font-bold text-lg");
    			add_location(span3, file$d, 27, 33, 1083);
    			add_location(p3, file$d, 27, 20, 1070);
    			attr_dev(span4, "class", "font-bold text-lg");
    			add_location(span4, file$d, 28, 34, 1192);
    			add_location(p4, file$d, 28, 20, 1178);
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
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, t6);
    			append_dev(p2, span2);
    			append_dev(span2, t7);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, p3, anchor);
    			append_dev(p3, t9);
    			append_dev(p3, span3);
    			append_dev(span3, t10);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, p4, anchor);
    			append_dev(p4, t12);
    			append_dev(p4, span4);
    			append_dev(span4, t13);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ssl*/ 1 && t1_value !== (t1_value = /*ssl*/ ctx[0].daysRemaining + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*ssl*/ 1 && t4_value !== (t4_value = /*ssl*/ ctx[0].valid + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*ssl*/ 1 && t7_value !== (t7_value = /*ssl*/ ctx[0].validFrom.substring(0, 10) + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*ssl*/ 1 && t10_value !== (t10_value = /*ssl*/ ctx[0].validTo.substring(0, 10) + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*ssl*/ 1 && t13_value !== (t13_value = /*ssl*/ ctx[0].validFor[0] + "")) set_data_dev(t13, t13_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(p4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(24:16) {#if !ssl.err}",
    		ctx
    	});

    	return block;
    }

    // (16:0) <Shell title={"SSL CHECKER"} tooltip={"SSL Certificate checker"}>
    function create_default_slot$7(ctx) {
    	let div2;
    	let div0;
    	let input;
    	let t0;
    	let button;
    	let t2;
    	let div1;
    	let dispose;
    	let if_block = /*ssl*/ ctx[0] && create_if_block$5(ctx);

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
    			if (if_block) if_block.c();
    			attr_dev(input, "class", "text-black");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Domain Name");
    			add_location(input, file$d, 18, 12, 511);
    			attr_dev(button, "type", "button");
    			add_location(button, file$d, 19, 12, 607);
    			attr_dev(div0, "class", "flex flex-row");
    			add_location(div0, file$d, 17, 8, 470);
    			add_location(div1, file$d, 21, 8, 692);
    			attr_dev(div2, "class", "text-gray-50");
    			add_location(div2, file$d, 16, 4, 434);
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
    			if (if_block) if_block.m(div1, null);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    				listen_dev(button, "click", /*getSslInfo*/ ctx[2], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*host*/ 2 && input.value !== /*host*/ ctx[1]) {
    				set_input_value(input, /*host*/ ctx[1]);
    			}

    			if (/*ssl*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					if_block.m(div1, null);
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
    		id: create_default_slot$7.name,
    		type: "slot",
    		source: "(16:0) <Shell title={\\\"SSL CHECKER\\\"} tooltip={\\\"SSL Certificate checker\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "SSL CHECKER",
    				tooltip: "SSL Certificate checker",
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
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let ssl, host = "";

    	const getSslInfo = () => {
    		ipcRenderer.send("get-ssl-info", host);

    		ipcRenderer.on("get-ssl-info", (e, sslInfo) => {
    			$$invalidate(0, ssl = sslInfo);
    		});

    		$$invalidate(1, host = "");
    	};

    	function input_input_handler() {
    		host = this.value;
    		$$invalidate(1, host);
    	}

    	$$self.$capture_state = () => ({
    		ipcRenderer,
    		Shell,
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
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SslChecker",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src\Components\Diagnostics\Netstat\Netstat.svelte generated by Svelte v3.19.1 */
    const file$e = "src\\Components\\Diagnostics\\Netstat\\Netstat.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (29:12) {:else}
    function create_else_block_1$1(ctx) {
    	let p;
    	let span;

    	const block = {
    		c: function create() {
    			p = element("p");
    			span = element("span");
    			span.textContent = "Error: Couldn't list connections";
    			attr_dev(span, "class", "font-bold text-lg");
    			add_location(span, file$e, 29, 19, 1235);
    			add_location(p, file$e, 29, 16, 1232);
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
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(29:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (17:12) {#if netstat}
    function create_if_block$6(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*netstat*/ ctx[0].length > 1) return create_if_block_1$3;
    		return create_else_block$6;
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
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(17:12) {#if netstat}",
    		ctx
    	});

    	return block;
    }

    // (24:16) {:else}
    function create_else_block$6(ctx) {
    	let p0;
    	let t0;
    	let span0;
    	let t1_value = /*netstat*/ ctx[0][0].interface + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3;
    	let span1;
    	let t4_value = /*netstat*/ ctx[0][0].inputBytes + "";
    	let t4;
    	let t5;
    	let p2;
    	let t6;
    	let span2;
    	let t7_value = /*netstat*/ ctx[0][0].outputBytes + "";
    	let t7;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text("Interface: ");
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text("Input Bytes: ");
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			p2 = element("p");
    			t6 = text("Output Bytes: ");
    			span2 = element("span");
    			t7 = text(t7_value);
    			attr_dev(span0, "class", "font-bold text-lg");
    			add_location(span0, file$e, 24, 34, 895);
    			add_location(p0, file$e, 24, 20, 881);
    			attr_dev(span1, "class", "font-bold text-lg");
    			add_location(span1, file$e, 25, 36, 998);
    			add_location(p1, file$e, 25, 20, 982);
    			attr_dev(span2, "class", "font-bold text-lg");
    			add_location(span2, file$e, 26, 37, 1103);
    			add_location(p2, file$e, 26, 20, 1086);
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
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, t6);
    			append_dev(p2, span2);
    			append_dev(span2, t7);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*netstat*/ 1 && t1_value !== (t1_value = /*netstat*/ ctx[0][0].interface + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*netstat*/ 1 && t4_value !== (t4_value = /*netstat*/ ctx[0][0].inputBytes + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*netstat*/ 1 && t7_value !== (t7_value = /*netstat*/ ctx[0][0].outputBytes + "")) set_data_dev(t7, t7_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$6.name,
    		type: "else",
    		source: "(24:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (18:16) {#if netstat.length > 1}
    function create_if_block_1$3(ctx) {
    	let each_1_anchor;
    	let each_value = /*netstat*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
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
    			if (dirty & /*netstat*/ 1) {
    				each_value = /*netstat*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
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
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(18:16) {#if netstat.length > 1}",
    		ctx
    	});

    	return block;
    }

    // (19:20) {#each netstat as ns}
    function create_each_block$1(ctx) {
    	let p0;
    	let t0;
    	let span0;
    	let t1_value = /*ns*/ ctx[2].interface + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3;
    	let span1;
    	let t4_value = /*ns*/ ctx[2].inputBytes + "";
    	let t4;
    	let t5;
    	let p2;
    	let t6;
    	let span2;
    	let t7_value = /*ns*/ ctx[2].outputBytes + "";
    	let t7;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text("Interface: ");
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text("Input Bytes: ");
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			p2 = element("p");
    			t6 = text("Output Bytes: ");
    			span2 = element("span");
    			t7 = text(t7_value);
    			attr_dev(span0, "class", "font-bold text-lg");
    			add_location(span0, file$e, 19, 34, 554);
    			add_location(p0, file$e, 19, 20, 540);
    			attr_dev(span1, "class", "font-bold text-lg");
    			add_location(span1, file$e, 20, 36, 649);
    			add_location(p1, file$e, 20, 20, 633);
    			attr_dev(span2, "class", "font-bold text-lg");
    			add_location(span2, file$e, 21, 37, 746);
    			add_location(p2, file$e, 21, 20, 729);
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
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, t6);
    			append_dev(p2, span2);
    			append_dev(span2, t7);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*netstat*/ 1 && t1_value !== (t1_value = /*ns*/ ctx[2].interface + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*netstat*/ 1 && t4_value !== (t4_value = /*ns*/ ctx[2].inputBytes + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*netstat*/ 1 && t7_value !== (t7_value = /*ns*/ ctx[2].outputBytes + "")) set_data_dev(t7, t7_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(19:20) {#each netstat as ns}",
    		ctx
    	});

    	return block;
    }

    // (14:0) <Shell title={"NETSTAT"} tooltip={"List all current connections"}>
    function create_default_slot$8(ctx) {
    	let div1;
    	let div0;

    	function select_block_type(ctx, dirty) {
    		if (/*netstat*/ ctx[0]) return create_if_block$6;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if_block.c();
    			add_location(div0, file$e, 15, 8, 401);
    			attr_dev(div1, "class", "text-gray-50");
    			add_location(div1, file$e, 14, 4, 365);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if_block.m(div0, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$8.name,
    		type: "slot",
    		source: "(14:0) <Shell title={\\\"NETSTAT\\\"} tooltip={\\\"List all current connections\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "NETSTAT",
    				tooltip: "List all current connections",
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
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let netstat;
    	ipcRenderer.send("get-netstat-info");

    	ipcRenderer.on("get-netstat-info", (e, netstatInfo) => {
    		$$invalidate(0, netstat = netstatInfo);
    	});

    	$$self.$capture_state = () => ({ ipcRenderer, Shell, netstat, require });

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
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Netstat",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src\Components\Diagnostics\NetworkSpeed\NetworkSpeed.svelte generated by Svelte v3.19.1 */
    const file$f = "src\\Components\\Diagnostics\\NetworkSpeed\\NetworkSpeed.svelte";

    // (20:12) {:else}
    function create_else_block$7(ctx) {
    	let p;
    	let span;

    	const block = {
    		c: function create() {
    			p = element("p");
    			span = element("span");
    			span.textContent = "Error: Couldn't get network speeds";
    			attr_dev(span, "class", "font-bold text-lg");
    			add_location(span, file$f, 20, 19, 706);
    			add_location(p, file$f, 20, 16, 703);
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
    		id: create_else_block$7.name,
    		type: "else",
    		source: "(20:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (17:12) {#if networkSpeed}
    function create_if_block$7(ctx) {
    	let p0;
    	let t0;
    	let span0;
    	let t1_value = /*networkSpeed*/ ctx[0].total.inputMb + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3;
    	let span1;
    	let t4_value = /*networkSpeed*/ ctx[0].total.OutputMb + "";
    	let t4;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text("Input Speed (Mb): ");
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text("Output Speed (Mb): ");
    			span1 = element("span");
    			t4 = text(t4_value);
    			attr_dev(span0, "class", "font-bold text-lg");
    			add_location(span0, file$f, 17, 37, 481);
    			add_location(p0, file$f, 17, 16, 460);
    			attr_dev(span1, "class", "font-bold text-lg");
    			add_location(span1, file$f, 18, 38, 592);
    			add_location(p1, file$f, 18, 16, 570);
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
    			if (dirty & /*networkSpeed*/ 1 && t1_value !== (t1_value = /*networkSpeed*/ ctx[0].total.inputMb + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*networkSpeed*/ 1 && t4_value !== (t4_value = /*networkSpeed*/ ctx[0].total.OutputMb + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(17:12) {#if networkSpeed}",
    		ctx
    	});

    	return block;
    }

    // (14:0) <Shell title={"NETWORK SPEED"} tooltip={"List network speed"}>
    function create_default_slot$9(ctx) {
    	let div1;
    	let div0;

    	function select_block_type(ctx, dirty) {
    		if (/*networkSpeed*/ ctx[0]) return create_if_block$7;
    		return create_else_block$7;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if_block.c();
    			add_location(div0, file$f, 15, 8, 405);
    			attr_dev(div1, "class", "text-gray-50");
    			add_location(div1, file$f, 14, 4, 369);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			if_block.m(div0, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$9.name,
    		type: "slot",
    		source: "(14:0) <Shell title={\\\"NETWORK SPEED\\\"} tooltip={\\\"List network speed\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "NETWORK SPEED",
    				tooltip: "List network speed",
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

    			if (dirty & /*$$scope, networkSpeed*/ 5) {
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

    function instance$g($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let networkSpeed;
    	ipcRenderer.send("get-network-speed");

    	ipcRenderer.on("get-network-speed", (e, speedInfo) => {
    		$$invalidate(0, networkSpeed = speedInfo);
    	});

    	$$self.$capture_state = () => ({
    		ipcRenderer,
    		Shell,
    		networkSpeed,
    		require
    	});

    	$$self.$inject_state = $$props => {
    		if ("networkSpeed" in $$props) $$invalidate(0, networkSpeed = $$props.networkSpeed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [networkSpeed];
    }

    class NetworkSpeed extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NetworkSpeed",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src\Pages\_diagnostics.svelte generated by Svelte v3.19.1 */
    const file$g = "src\\Pages\\_diagnostics.svelte";

    // (9:0) <Page>
    function create_default_slot$a(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let current;
    	const passwordstrength = new PasswordStrength({ $$inline: true });
    	const sslchecker = new SslChecker({ $$inline: true });
    	const netstat = new Netstat({ $$inline: true });
    	const networkspeed = new NetworkSpeed({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(passwordstrength.$$.fragment);
    			t0 = space();
    			create_component(sslchecker.$$.fragment);
    			t1 = space();
    			create_component(netstat.$$.fragment);
    			t2 = space();
    			create_component(networkspeed.$$.fragment);
    			attr_dev(div, "class", "p-6 grid grid-cols-2 gap-4");
    			add_location(div, file$g, 9, 4, 434);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(passwordstrength, div, null);
    			append_dev(div, t0);
    			mount_component(sslchecker, div, null);
    			append_dev(div, t1);
    			mount_component(netstat, div, null);
    			append_dev(div, t2);
    			mount_component(networkspeed, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(passwordstrength.$$.fragment, local);
    			transition_in(sslchecker.$$.fragment, local);
    			transition_in(netstat.$$.fragment, local);
    			transition_in(networkspeed.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(passwordstrength.$$.fragment, local);
    			transition_out(sslchecker.$$.fragment, local);
    			transition_out(netstat.$$.fragment, local);
    			transition_out(networkspeed.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(passwordstrength);
    			destroy_component(sslchecker);
    			destroy_component(netstat);
    			destroy_component(networkspeed);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$a.name,
    		type: "slot",
    		source: "(9:0) <Page>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let current;

    	const page = new Page({
    			props: {
    				$$slots: { default: [create_default_slot$a] },
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
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	$$self.$capture_state = () => ({
    		Page,
    		PasswordStrength,
    		SslChecker,
    		Netstat,
    		NetworkSpeed
    	});

    	return [];
    }

    class Diagnostics extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Diagnostics",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src\Components\Wifi\Info\Info.svelte generated by Svelte v3.19.1 */
    const file$h = "src\\Components\\Wifi\\Info\\Info.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (111:4) {:else}
    function create_else_block$8(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Fetching Required Info...";
    			add_location(p, file$h, 111, 8, 3327);
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
    		id: create_else_block$8.name,
    		type: "else",
    		source: "(111:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (23:4) {#if info}
    function create_if_block$8(ctx) {
    	let p0;
    	let t0;
    	let t1;
    	let ul;
    	let t2;
    	let div;
    	let p1;
    	let span0;
    	let t3;
    	let t4;
    	let span1;
    	let t5_value = /*data*/ ctx[1].ssid + "";
    	let t5;
    	let t6;
    	let p2;
    	let span2;
    	let t7;
    	let t8;
    	let span3;
    	let t9_value = /*data*/ ctx[1].bssid + "";
    	let t9;
    	let t10;
    	let p3;
    	let span4;
    	let t11;
    	let t12;
    	let span5;
    	let t13_value = /*data*/ ctx[1].mode + "";
    	let t13;
    	let t14;
    	let p4;
    	let span6;
    	let t15;
    	let t16;
    	let span7;
    	let t17_value = /*data*/ ctx[1].channel + "";
    	let t17;
    	let t18;
    	let p5;
    	let span8;
    	let t19;
    	let t20;
    	let span9;
    	let t21_value = /*data*/ ctx[1].frequency + "";
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
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text("Available Wifi Connections");
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			div = element("div");
    			p1 = element("p");
    			span0 = element("span");
    			t3 = text("SSID");
    			t4 = space();
    			span1 = element("span");
    			t5 = text(t5_value);
    			t6 = space();
    			p2 = element("p");
    			span2 = element("span");
    			t7 = text("BSSID");
    			t8 = space();
    			span3 = element("span");
    			t9 = text(t9_value);
    			t10 = space();
    			p3 = element("p");
    			span4 = element("span");
    			t11 = text("Mode");
    			t12 = space();
    			span5 = element("span");
    			t13 = text(t13_value);
    			t14 = space();
    			p4 = element("p");
    			span6 = element("span");
    			t15 = text("Channel");
    			t16 = space();
    			span7 = element("span");
    			t17 = text(t17_value);
    			t18 = space();
    			p5 = element("p");
    			span8 = element("span");
    			t19 = text("Frequency");
    			t20 = space();
    			span9 = element("span");
    			t21 = text(t21_value);
    			t22 = space();
    			p6 = element("p");
    			span10 = element("span");
    			t23 = text("Security");
    			t24 = space();
    			span11 = element("span");
    			t25 = text(t25_value);
    			attr_dev(p0, "class", "text-sm");
    			set_style(p0, "color", /*$settings*/ ctx[2].fontColor2);
    			add_location(p0, file$h, 24, 4, 695);
    			attr_dev(ul, "class", "mb-6");
    			add_location(ul, file$h, 30, 4, 830);
    			attr_dev(span0, "class", "text-sm pb-1");
    			set_style(span0, "color", /*$settings*/ ctx[2].fontColor2);
    			add_location(span0, file$h, 44, 12, 1272);
    			attr_dev(span1, "class", "font-medium text-lg");
    			add_location(span1, file$h, 50, 12, 1443);
    			attr_dev(p1, "class", "flex flex-col justify-start items-center");
    			add_location(p1, file$h, 43, 8, 1206);
    			attr_dev(span2, "class", "text-sm pb-1");
    			set_style(span2, "color", /*$settings*/ ctx[2].fontColor2);
    			add_location(span2, file$h, 55, 12, 1617);
    			attr_dev(span3, "class", "font-medium text-lg");
    			add_location(span3, file$h, 61, 12, 1789);
    			attr_dev(p2, "class", "flex flex-col justify-start items-center");
    			add_location(p2, file$h, 54, 8, 1551);
    			attr_dev(span4, "class", "text-sm pb-1");
    			set_style(span4, "color", /*$settings*/ ctx[2].fontColor2);
    			add_location(span4, file$h, 66, 12, 1964);
    			attr_dev(span5, "class", "font-medium text-lg");
    			add_location(span5, file$h, 72, 12, 2135);
    			attr_dev(p3, "class", "flex flex-col justify-start items-center");
    			add_location(p3, file$h, 65, 8, 1898);
    			attr_dev(span6, "class", "text-sm pb-1");
    			set_style(span6, "color", /*$settings*/ ctx[2].fontColor2);
    			add_location(span6, file$h, 77, 12, 2309);
    			attr_dev(span7, "class", "font-medium text-lg");
    			add_location(span7, file$h, 83, 12, 2483);
    			attr_dev(p4, "class", "flex flex-col justify-start items-center");
    			add_location(p4, file$h, 76, 8, 2243);
    			attr_dev(span8, "class", "text-sm pb-1");
    			set_style(span8, "color", /*$settings*/ ctx[2].fontColor2);
    			add_location(span8, file$h, 88, 12, 2660);
    			attr_dev(span9, "class", "font-medium text-lg");
    			add_location(span9, file$h, 94, 12, 2836);
    			attr_dev(p5, "class", "flex flex-col justify-start items-center");
    			add_location(p5, file$h, 87, 8, 2594);
    			attr_dev(span10, "class", "text-sm pb-1");
    			set_style(span10, "color", /*$settings*/ ctx[2].fontColor2);
    			add_location(span10, file$h, 99, 12, 3015);
    			attr_dev(span11, "class", "font-medium text-lg");
    			add_location(span11, file$h, 105, 12, 3190);
    			attr_dev(p6, "class", "flex flex-col justify-start items-center");
    			add_location(p6, file$h, 98, 8, 2949);
    			attr_dev(div, "class", "grid grid-cols-2 lg:grid-cols-3 gap-x-2 gap-y-6");
    			add_location(div, file$h, 42, 4, 1135);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			insert_dev(target, t2, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, p1);
    			append_dev(p1, span0);
    			append_dev(span0, t3);
    			append_dev(p1, t4);
    			append_dev(p1, span1);
    			append_dev(span1, t5);
    			append_dev(div, t6);
    			append_dev(div, p2);
    			append_dev(p2, span2);
    			append_dev(span2, t7);
    			append_dev(p2, t8);
    			append_dev(p2, span3);
    			append_dev(span3, t9);
    			append_dev(div, t10);
    			append_dev(div, p3);
    			append_dev(p3, span4);
    			append_dev(span4, t11);
    			append_dev(p3, t12);
    			append_dev(p3, span5);
    			append_dev(span5, t13);
    			append_dev(div, t14);
    			append_dev(div, p4);
    			append_dev(p4, span6);
    			append_dev(span6, t15);
    			append_dev(p4, t16);
    			append_dev(p4, span7);
    			append_dev(span7, t17);
    			append_dev(div, t18);
    			append_dev(div, p5);
    			append_dev(p5, span8);
    			append_dev(span8, t19);
    			append_dev(p5, t20);
    			append_dev(p5, span9);
    			append_dev(span9, t21);
    			append_dev(div, t22);
    			append_dev(div, p6);
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
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
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

    			if (dirty & /*data*/ 2 && t5_value !== (t5_value = /*data*/ ctx[1].ssid + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*$settings*/ 4) {
    				set_style(span2, "color", /*$settings*/ ctx[2].fontColor2);
    			}

    			if (dirty & /*data*/ 2 && t9_value !== (t9_value = /*data*/ ctx[1].bssid + "")) set_data_dev(t9, t9_value);

    			if (dirty & /*$settings*/ 4) {
    				set_style(span4, "color", /*$settings*/ ctx[2].fontColor2);
    			}

    			if (dirty & /*data*/ 2 && t13_value !== (t13_value = /*data*/ ctx[1].mode + "")) set_data_dev(t13, t13_value);

    			if (dirty & /*$settings*/ 4) {
    				set_style(span6, "color", /*$settings*/ ctx[2].fontColor2);
    			}

    			if (dirty & /*data*/ 2 && t17_value !== (t17_value = /*data*/ ctx[1].channel + "")) set_data_dev(t17, t17_value);

    			if (dirty & /*$settings*/ 4) {
    				set_style(span8, "color", /*$settings*/ ctx[2].fontColor2);
    			}

    			if (dirty & /*data*/ 2 && t21_value !== (t21_value = /*data*/ ctx[1].frequency + "")) set_data_dev(t21, t21_value);

    			if (dirty & /*$settings*/ 4) {
    				set_style(span10, "color", /*$settings*/ ctx[2].fontColor2);
    			}

    			if (dirty & /*data*/ 2 && t25_value !== (t25_value = /*data*/ ctx[1].security + "")) set_data_dev(t25, t25_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(23:4) {#if info}",
    		ctx
    	});

    	return block;
    }

    // (32:8) {#each info as wifi, _id}
    function create_each_block$2(ctx) {
    	let li;
    	let t0_value = `${/*_id*/ ctx[8] + 1}. ${/*wifi*/ ctx[6].ssid}` + "";
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
    			attr_dev(li, "class", "cursor-pointer");
    			add_location(li, file$h, 32, 8, 892);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    			dispose = listen_dev(li, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*info*/ 1 && t0_value !== (t0_value = `${/*_id*/ ctx[8] + 1}. ${/*wifi*/ ctx[6].ssid}` + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(32:8) {#each info as wifi, _id}",
    		ctx
    	});

    	return block;
    }

    // (19:0) <Shell       title={"Wifi Information"}       tooltip={"General wifi related information"}  >
    function create_default_slot$b(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*info*/ ctx[0]) return create_if_block$8;
    		return create_else_block$8;
    	}

    	let current_block_type = select_block_type(ctx);
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
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
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
    		id: create_default_slot$b.name,
    		type: "slot",
    		source: "(19:0) <Shell       title={\\\"Wifi Information\\\"}       tooltip={\\\"General wifi related information\\\"}  >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "Wifi Information",
    				tooltip: "General wifi related information",
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
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
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
    		ipcRenderer,
    		Shell,
    		settings,
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
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Info",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    /* src\Components\Wifi\Ssid\Ssid.svelte generated by Svelte v3.19.1 */
    const file$i = "src\\Components\\Wifi\\Ssid\\Ssid.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i].ssid;
    	child_ctx[3] = i;
    	return child_ctx;
    }

    // (22:4) {:else}
    function create_else_block_1$2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Fetching Required Info...";
    			add_location(p, file$i, 22, 8, 704);
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
    		id: create_else_block_1$2.name,
    		type: "else",
    		source: "(22:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:4) {#if ssid}
    function create_if_block$9(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*ssid*/ ctx[0].length > 1) return create_if_block_1$4;
    		return create_else_block$9;
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
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(14:4) {#if ssid}",
    		ctx
    	});

    	return block;
    }

    // (19:8) {:else}
    function create_else_block$9(ctx) {
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
    			add_location(span, file$i, 19, 17, 612);
    			add_location(p, file$i, 19, 8, 603);
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
    		id: create_else_block$9.name,
    		type: "else",
    		source: "(19:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (15:8) {#if ssid.length > 1}
    function create_if_block_1$4(ctx) {
    	let each_1_anchor;
    	let each_value = /*ssid*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
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
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(15:8) {#if ssid.length > 1}",
    		ctx
    	});

    	return block;
    }

    // (16:12) {#each ssid as {ssid}
    function create_each_block$3(ctx) {
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
    			add_location(span, file$i, 16, 24, 506);
    			add_location(p, file$i, 16, 12, 494);
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
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(16:12) {#each ssid as {ssid}",
    		ctx
    	});

    	return block;
    }

    // (12:0) <Shell title={"AVAILABLE WIFI NETWORKS"} tooltip={"SSID of all available wifi networks"}>
    function create_default_slot$c(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*ssid*/ ctx[0]) return create_if_block$9;
    		return create_else_block_1$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "text-gray-50");
    			add_location(div, file$i, 12, 4, 366);
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
    		id: create_default_slot$c.name,
    		type: "slot",
    		source: "(12:0) <Shell title={\\\"AVAILABLE WIFI NETWORKS\\\"} tooltip={\\\"SSID of all available wifi networks\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "AVAILABLE WIFI NETWORKS",
    				tooltip: "SSID of all available wifi networks",
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
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ssid",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    /* src\Components\Wifi\Interfaces\Interfaces.svelte generated by Svelte v3.19.1 */
    const file$j = "src\\Components\\Wifi\\Interfaces\\Interfaces.svelte";

    function get_each_context$4(ctx, list, i) {
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
    			add_location(p, file$j, 26, 8, 898);
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
    function create_if_block$a(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*interfaces*/ ctx[0].length > 0) return create_if_block_1$5;
    		return create_else_block_1$3;
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
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(14:4) {#if interfaces}",
    		ctx
    	});

    	return block;
    }

    // (23:8) {:else}
    function create_else_block_1$3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Couldn't find any interfaces.";
    			add_location(p, file$j, 23, 12, 824);
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
    		id: create_else_block_1$3.name,
    		type: "else",
    		source: "(23:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (15:8) {#if interfaces.length > 0}
    function create_if_block_1$5(ctx) {
    	let if_block_anchor;

    	function select_block_type_2(ctx, dirty) {
    		if (/*interfaces*/ ctx[0].length > 1) return create_if_block_2$1;
    		return create_else_block$a;
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
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(15:8) {#if interfaces.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (20:12) {:else}
    function create_else_block$a(ctx) {
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
    			add_location(span, file$j, 20, 23, 713);
    			add_location(p, file$j, 20, 16, 706);
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
    		id: create_else_block$a.name,
    		type: "else",
    		source: "(20:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (16:12) {#if interfaces.length > 1}
    function create_if_block_2$1(ctx) {
    	let each_1_anchor;
    	let each_value = /*interfaces*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
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
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
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
    		source: "(16:12) {#if interfaces.length > 1}",
    		ctx
    	});

    	return block;
    }

    // (17:16) {#each interfaces as {id}
    function create_each_block$4(ctx) {
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
    			add_location(span, file$j, 17, 28, 595);
    			add_location(p, file$j, 17, 16, 583);
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
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(17:16) {#each interfaces as {id}",
    		ctx
    	});

    	return block;
    }

    // (12:0) <Shell title={"AVAILABLE WIFI INTERFACES"} tooltip={"List of available wifi interfaces"}>
    function create_default_slot$d(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*interfaces*/ ctx[0]) return create_if_block$a;
    		return create_else_block_2$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "text-gray-50");
    			add_location(div, file$j, 12, 4, 390);
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
    		id: create_default_slot$d.name,
    		type: "slot",
    		source: "(12:0) <Shell title={\\\"AVAILABLE WIFI INTERFACES\\\"} tooltip={\\\"List of available wifi interfaces\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "AVAILABLE WIFI INTERFACES",
    				tooltip: "List of available wifi interfaces",
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
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Interfaces",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    /* src\Pages\_wifi.svelte generated by Svelte v3.19.1 */
    const file$k = "src\\Pages\\_wifi.svelte";

    // (8:0) <Page>
    function create_default_slot$e(ctx) {
    	let div;
    	let current;
    	const info = new Info({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(info.$$.fragment);
    			attr_dev(div, "class", "grid grid-cols-1 gap-4");
    			add_location(div, file$k, 8, 4, 276);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(info, div, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(info.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(info);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$e.name,
    		type: "slot",
    		source: "(8:0) <Page>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let current;

    	const page = new Page({
    			props: {
    				$$slots: { default: [create_default_slot$e] },
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
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	$$self.$capture_state = () => ({ Page, Info, Ssid, Interfaces });
    	return [];
    }

    class Wifi extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Wifi",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    /* src\Components\System\Cpu\Cpu.svelte generated by Svelte v3.19.1 */
    const file$l = "src\\Components\\System\\Cpu\\Cpu.svelte";

    // (64:4) {:else}
    function create_else_block$b(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Fetching Required Info...";
    			add_location(p, file$l, 64, 8, 1917);
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
    		id: create_else_block$b.name,
    		type: "else",
    		source: "(64:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (17:4) {#if cpu}
    function create_if_block$b(ctx) {
    	let div;
    	let p0;
    	let span0;
    	let t0;
    	let t1;
    	let span1;
    	let t2_value = /*cpu*/ ctx[0].brand + "";
    	let t2;
    	let t3;
    	let p1;
    	let span2;
    	let t4;
    	let t5;
    	let span3;
    	let t6_value = /*cpu*/ ctx[0].speed + "";
    	let t6;
    	let t7;
    	let t8;
    	let p2;
    	let span4;
    	let t9;
    	let t10;
    	let span5;
    	let t11_value = /*cpu*/ ctx[0].cores + "";
    	let t11;
    	let t12;
    	let p3;
    	let span6;
    	let t13;
    	let t14;
    	let span7;
    	let t15_value = /*cpu*/ ctx[0].socket + "";
    	let t15;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			span0 = element("span");
    			t0 = text("Processor");
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			p1 = element("p");
    			span2 = element("span");
    			t4 = text("Speed");
    			t5 = space();
    			span3 = element("span");
    			t6 = text(t6_value);
    			t7 = text(" GHz");
    			t8 = space();
    			p2 = element("p");
    			span4 = element("span");
    			t9 = text("Cores");
    			t10 = space();
    			span5 = element("span");
    			t11 = text(t11_value);
    			t12 = space();
    			p3 = element("p");
    			span6 = element("span");
    			t13 = text("Socket");
    			t14 = space();
    			span7 = element("span");
    			t15 = text(t15_value);
    			attr_dev(span0, "class", "text-sm pb-1");
    			set_style(span0, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span0, file$l, 19, 12, 564);
    			attr_dev(span1, "class", "font-medium text-lg");
    			add_location(span1, file$l, 25, 12, 740);
    			attr_dev(p0, "class", "flex flex-col justify-start items-center");
    			add_location(p0, file$l, 18, 8, 498);
    			attr_dev(span2, "class", "text-sm pb-1");
    			set_style(span2, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span2, file$l, 30, 12, 914);
    			attr_dev(span3, "class", "font-medium text-lg");
    			add_location(span3, file$l, 36, 12, 1086);
    			attr_dev(p1, "class", "flex flex-col justify-start items-center");
    			add_location(p1, file$l, 29, 8, 848);
    			attr_dev(span4, "class", "text-sm pb-1");
    			set_style(span4, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span4, file$l, 41, 12, 1264);
    			attr_dev(span5, "class", "font-medium text-lg");
    			add_location(span5, file$l, 47, 12, 1436);
    			attr_dev(p2, "class", "flex flex-col justify-start items-center");
    			add_location(p2, file$l, 40, 8, 1198);
    			attr_dev(span6, "class", "text-sm pb-1");
    			set_style(span6, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span6, file$l, 52, 12, 1610);
    			attr_dev(span7, "class", "font-medium text-lg");
    			add_location(span7, file$l, 58, 12, 1783);
    			attr_dev(p3, "class", "flex flex-col justify-start items-center");
    			add_location(p3, file$l, 51, 8, 1544);
    			attr_dev(div, "class", "grid grid-cols-2 gap-x-2 gap-y-6");
    			add_location(div, file$l, 17, 4, 442);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, span0);
    			append_dev(span0, t0);
    			append_dev(p0, t1);
    			append_dev(p0, span1);
    			append_dev(span1, t2);
    			append_dev(div, t3);
    			append_dev(div, p1);
    			append_dev(p1, span2);
    			append_dev(span2, t4);
    			append_dev(p1, t5);
    			append_dev(p1, span3);
    			append_dev(span3, t6);
    			append_dev(span3, t7);
    			append_dev(div, t8);
    			append_dev(div, p2);
    			append_dev(p2, span4);
    			append_dev(span4, t9);
    			append_dev(p2, t10);
    			append_dev(p2, span5);
    			append_dev(span5, t11);
    			append_dev(div, t12);
    			append_dev(div, p3);
    			append_dev(p3, span6);
    			append_dev(span6, t13);
    			append_dev(p3, t14);
    			append_dev(p3, span7);
    			append_dev(span7, t15);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$settings*/ 2) {
    				set_style(span0, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*cpu*/ 1 && t2_value !== (t2_value = /*cpu*/ ctx[0].brand + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span2, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*cpu*/ 1 && t6_value !== (t6_value = /*cpu*/ ctx[0].speed + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span4, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*cpu*/ 1 && t11_value !== (t11_value = /*cpu*/ ctx[0].cores + "")) set_data_dev(t11, t11_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span6, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*cpu*/ 1 && t15_value !== (t15_value = /*cpu*/ ctx[0].socket + "")) set_data_dev(t15, t15_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$b.name,
    		type: "if",
    		source: "(17:4) {#if cpu}",
    		ctx
    	});

    	return block;
    }

    // (13:0) <Shell       title={"Cpu Information"}       tooltip={"General information about the CPU"}  >
    function create_default_slot$f(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*cpu*/ ctx[0]) return create_if_block$b;
    		return create_else_block$b;
    	}

    	let current_block_type = select_block_type(ctx);
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
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
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
    		id: create_default_slot$f.name,
    		type: "slot",
    		source: "(13:0) <Shell       title={\\\"Cpu Information\\\"}       tooltip={\\\"General information about the CPU\\\"}  >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$m(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "Cpu Information",
    				tooltip: "General information about the CPU",
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

    			if (dirty & /*$$scope, cpu, $settings*/ 11) {
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

    function instance$m($$self, $$props, $$invalidate) {
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
    		ipcRenderer,
    		Shell,
    		settings,
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
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cpu",
    			options,
    			id: create_fragment$m.name
    		});
    	}
    }

    /* src\Components\System\OS\OSinfo.svelte generated by Svelte v3.19.1 */
    const file$m = "src\\Components\\System\\OS\\OSinfo.svelte";

    // (64:4) {:else}
    function create_else_block$c(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Fetching Required Info...";
    			add_location(p, file$m, 64, 8, 1915);
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
    		id: create_else_block$c.name,
    		type: "else",
    		source: "(64:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (17:4) {#if os}
    function create_if_block$c(ctx) {
    	let div;
    	let p0;
    	let span0;
    	let t0;
    	let t1;
    	let span1;
    	let t2_value = /*os*/ ctx[0].platform + "";
    	let t2;
    	let t3;
    	let p1;
    	let span2;
    	let t4;
    	let t5;
    	let span3;
    	let t6_value = /*os*/ ctx[0].hostname + "";
    	let t6;
    	let t7;
    	let p2;
    	let span4;
    	let t8;
    	let t9;
    	let span5;
    	let t10_value = /*os*/ ctx[0].kernel + "";
    	let t10;
    	let t11;
    	let p3;
    	let span6;
    	let t12;
    	let t13;
    	let span7;
    	let t14_value = /*os*/ ctx[0].fqdn + "";
    	let t14;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			span0 = element("span");
    			t0 = text("Platform");
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			p1 = element("p");
    			span2 = element("span");
    			t4 = text("Host Name");
    			t5 = space();
    			span3 = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			p2 = element("p");
    			span4 = element("span");
    			t8 = text("Kernel");
    			t9 = space();
    			span5 = element("span");
    			t10 = text(t10_value);
    			t11 = space();
    			p3 = element("p");
    			span6 = element("span");
    			t12 = text("FQDN");
    			t13 = space();
    			span7 = element("span");
    			t14 = text(t14_value);
    			attr_dev(span0, "class", "text-sm pb-1");
    			set_style(span0, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span0, file$m, 19, 12, 563);
    			attr_dev(span1, "class", "font-medium text-lg");
    			add_location(span1, file$m, 25, 12, 738);
    			attr_dev(p0, "class", "flex flex-col justify-start items-center");
    			add_location(p0, file$m, 18, 8, 497);
    			attr_dev(span2, "class", "text-sm pb-1");
    			set_style(span2, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span2, file$m, 30, 12, 914);
    			attr_dev(span3, "class", "font-medium text-lg");
    			add_location(span3, file$m, 36, 12, 1090);
    			attr_dev(p1, "class", "flex flex-col justify-start items-center");
    			add_location(p1, file$m, 29, 8, 848);
    			attr_dev(span4, "class", "text-sm pb-1");
    			set_style(span4, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span4, file$m, 41, 12, 1266);
    			attr_dev(span5, "class", "font-medium text-lg");
    			add_location(span5, file$m, 47, 12, 1439);
    			attr_dev(p2, "class", "flex flex-col justify-start items-center");
    			add_location(p2, file$m, 40, 8, 1200);
    			attr_dev(span6, "class", "text-sm pb-1");
    			set_style(span6, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span6, file$m, 52, 12, 1613);
    			attr_dev(span7, "class", "font-medium text-lg");
    			add_location(span7, file$m, 58, 12, 1784);
    			attr_dev(p3, "class", "flex flex-col justify-start items-center");
    			add_location(p3, file$m, 51, 8, 1547);
    			attr_dev(div, "class", "grid grid-cols-2 gap-x-2 gap-y-6");
    			add_location(div, file$m, 17, 4, 441);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, span0);
    			append_dev(span0, t0);
    			append_dev(p0, t1);
    			append_dev(p0, span1);
    			append_dev(span1, t2);
    			append_dev(div, t3);
    			append_dev(div, p1);
    			append_dev(p1, span2);
    			append_dev(span2, t4);
    			append_dev(p1, t5);
    			append_dev(p1, span3);
    			append_dev(span3, t6);
    			append_dev(div, t7);
    			append_dev(div, p2);
    			append_dev(p2, span4);
    			append_dev(span4, t8);
    			append_dev(p2, t9);
    			append_dev(p2, span5);
    			append_dev(span5, t10);
    			append_dev(div, t11);
    			append_dev(div, p3);
    			append_dev(p3, span6);
    			append_dev(span6, t12);
    			append_dev(p3, t13);
    			append_dev(p3, span7);
    			append_dev(span7, t14);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$settings*/ 2) {
    				set_style(span0, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*os*/ 1 && t2_value !== (t2_value = /*os*/ ctx[0].platform + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span2, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*os*/ 1 && t6_value !== (t6_value = /*os*/ ctx[0].hostname + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span4, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*os*/ 1 && t10_value !== (t10_value = /*os*/ ctx[0].kernel + "")) set_data_dev(t10, t10_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span6, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*os*/ 1 && t14_value !== (t14_value = /*os*/ ctx[0].fqdn + "")) set_data_dev(t14, t14_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$c.name,
    		type: "if",
    		source: "(17:4) {#if os}",
    		ctx
    	});

    	return block;
    }

    // (13:0) <Shell       title={"Operating System"}       tooltip={"Information regarding operating system"}  >
    function create_default_slot$g(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*os*/ ctx[0]) return create_if_block$c;
    		return create_else_block$c;
    	}

    	let current_block_type = select_block_type(ctx);
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
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
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
    		id: create_default_slot$g.name,
    		type: "slot",
    		source: "(13:0) <Shell       title={\\\"Operating System\\\"}       tooltip={\\\"Information regarding operating system\\\"}  >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$n(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "Operating System",
    				tooltip: "Information regarding operating system",
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

    			if (dirty & /*$$scope, os, $settings*/ 11) {
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

    function instance$n($$self, $$props, $$invalidate) {
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
    		ipcRenderer,
    		Shell,
    		settings,
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
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OSinfo",
    			options,
    			id: create_fragment$n.name
    		});
    	}
    }

    /* src\Components\System\Ram\Ram.svelte generated by Svelte v3.19.1 */
    const file$n = "src\\Components\\System\\Ram\\Ram.svelte";

    // (69:8) {:else}
    function create_else_block$d(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Fetching Required Info...";
    			add_location(p, file$n, 69, 8, 2444);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$d.name,
    		type: "else",
    		source: "(69:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (65:8) {#if ram}
    function create_if_block$d(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Memory in GB";
    			attr_dev(p, "class", "text-center text-sm mt-2");
    			add_location(p, file$n, 65, 8, 2341);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$d.name,
    		type: "if",
    		source: "(65:8) {#if ram}",
    		ctx
    	});

    	return block;
    }

    // (56:0) <Shell       title={"Memory Usage Chart"}       tooltip={"Plots ram utilization on a doughnut chart"}  >
    function create_default_slot$h(ctx) {
    	let div;
    	let canvas;
    	let t;

    	function select_block_type(ctx, dirty) {
    		if (/*ram*/ ctx[0]) return create_if_block$d;
    		return create_else_block$d;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			canvas = element("canvas");
    			t = space();
    			if_block.c();
    			attr_dev(canvas, "id", "ram-doughnut");
    			add_location(canvas, file$n, 63, 8, 2284);
    			attr_dev(div, "class", "w-4/5 md:w-1/2 mx-auto");
    			attr_dev(div, "id", "canvas-container");
    			add_location(div, file$n, 59, 4, 2190);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, canvas);
    			append_dev(div, t);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
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
    		id: create_default_slot$h.name,
    		type: "slot",
    		source: "(56:0) <Shell       title={\\\"Memory Usage Chart\\\"}       tooltip={\\\"Plots ram utilization on a doughnut chart\\\"}  >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$o(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "Memory Usage Chart",
    				tooltip: "Plots ram utilization on a doughnut chart",
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
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let ram;
    	let ramChart;

    	// Editing Here
    	onMount(() => {
    		const canvas = document.getElementById("ram-doughnut");
    		const ctx = canvas.getContext("2d");
    		ipcRenderer.send("get-ram-info");

    		ipcRenderer.on("get-ram-info", (e, ramInfo) => {
    			$$invalidate(0, ram = ramInfo);

    			// Create chart for RAM monitor
    			// If chart already exists, destroy it first
    			if (ramChart) ramChart.destroy();

    			ramChart = new Chart(ctx,
    			{
    					type: "doughnut",
    					options: {
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
    								borderColor: "#333",
    								borderWidth: 1
    							}
    						]
    					}
    				});
    		});

    		// onDestroy
    		return () => {
    			ramChart.destroy();
    		};
    	});

    	$$self.$capture_state = () => ({
    		ipcRenderer,
    		onMount,
    		Shell,
    		settings,
    		ram,
    		ramChart,
    		require,
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
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ram",
    			options,
    			id: create_fragment$o.name
    		});
    	}
    }

    /* src\Components\System\Graphics\Graphics.svelte generated by Svelte v3.19.1 */
    const file$o = "src\\Components\\System\\Graphics\\Graphics.svelte";

    // (86:4) {:else}
    function create_else_block$e(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Fetching Required Info...";
    			add_location(p, file$o, 86, 8, 2702);
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
    		id: create_else_block$e.name,
    		type: "else",
    		source: "(86:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (17:4) {#if graphics}
    function create_if_block$e(ctx) {
    	let div;
    	let p0;
    	let span0;
    	let t0;
    	let t1;
    	let span1;
    	let t2_value = /*graphics*/ ctx[0].model + "";
    	let t2;
    	let t3;
    	let p1;
    	let span2;
    	let t4;
    	let t5;
    	let span3;
    	let t6_value = /*graphics*/ ctx[0].vendor + "";
    	let t6;
    	let t7;
    	let p2;
    	let span4;
    	let t8;
    	let t9;
    	let span5;
    	let t10_value = /*graphics*/ ctx[0].bus + "";
    	let t10;
    	let t11;
    	let p3;
    	let span6;
    	let t12;
    	let t13;
    	let span7;
    	let t14_value = (/*graphics*/ ctx[0].vram / 1024).toPrecision(3) + "";
    	let t14;
    	let t15;
    	let p4;
    	let span8;
    	let t16;
    	let t17;
    	let span9;
    	let t18_value = /*graphics*/ ctx[0].connection + "";
    	let t18;
    	let t19;
    	let p5;
    	let span10;
    	let t20;
    	let t21;
    	let span11;
    	let t22_value = /*graphics*/ ctx[0].display + "";
    	let t22;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			span0 = element("span");
    			t0 = text("Model");
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			p1 = element("p");
    			span2 = element("span");
    			t4 = text("Vendor");
    			t5 = space();
    			span3 = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			p2 = element("p");
    			span4 = element("span");
    			t8 = text("Bus");
    			t9 = space();
    			span5 = element("span");
    			t10 = text(t10_value);
    			t11 = space();
    			p3 = element("p");
    			span6 = element("span");
    			t12 = text("VRAM");
    			t13 = space();
    			span7 = element("span");
    			t14 = text(t14_value);
    			t15 = space();
    			p4 = element("p");
    			span8 = element("span");
    			t16 = text("Connection");
    			t17 = space();
    			span9 = element("span");
    			t18 = text(t18_value);
    			t19 = space();
    			p5 = element("p");
    			span10 = element("span");
    			t20 = text("Display Model");
    			t21 = space();
    			span11 = element("span");
    			t22 = text(t22_value);
    			attr_dev(span0, "class", "text-sm pb-1");
    			set_style(span0, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span0, file$o, 19, 12, 597);
    			attr_dev(span1, "class", "font-medium text-lg");
    			add_location(span1, file$o, 25, 12, 769);
    			attr_dev(p0, "class", "flex flex-col justify-start items-center");
    			add_location(p0, file$o, 18, 8, 531);
    			attr_dev(span2, "class", "text-sm pb-1");
    			set_style(span2, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span2, file$o, 30, 12, 948);
    			attr_dev(span3, "class", "font-medium text-lg");
    			add_location(span3, file$o, 36, 12, 1121);
    			attr_dev(p1, "class", "flex flex-col justify-start items-center");
    			add_location(p1, file$o, 29, 8, 882);
    			attr_dev(span4, "class", "text-sm pb-1");
    			set_style(span4, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span4, file$o, 41, 12, 1301);
    			attr_dev(span5, "class", "font-medium text-lg");
    			add_location(span5, file$o, 47, 12, 1471);
    			attr_dev(p2, "class", "flex flex-col justify-start items-center");
    			add_location(p2, file$o, 40, 8, 1235);
    			attr_dev(span6, "class", "text-sm pb-1");
    			set_style(span6, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span6, file$o, 52, 12, 1648);
    			attr_dev(span7, "class", "font-medium text-lg");
    			add_location(span7, file$o, 58, 12, 1819);
    			attr_dev(p3, "class", "flex flex-col justify-start items-center");
    			add_location(p3, file$o, 51, 8, 1582);
    			attr_dev(span8, "class", "text-sm pb-1");
    			set_style(span8, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span8, file$o, 63, 12, 2021);
    			attr_dev(span9, "class", "font-medium text-lg");
    			add_location(span9, file$o, 69, 12, 2198);
    			attr_dev(p4, "class", "flex flex-col justify-start items-center");
    			add_location(p4, file$o, 62, 8, 1955);
    			attr_dev(span10, "class", "text-sm pb-1");
    			set_style(span10, "color", /*$settings*/ ctx[1].fontColor2);
    			add_location(span10, file$o, 74, 12, 2382);
    			attr_dev(span11, "class", "font-medium text-lg");
    			add_location(span11, file$o, 80, 12, 2562);
    			attr_dev(p5, "class", "flex flex-col justify-start items-center");
    			add_location(p5, file$o, 73, 8, 2316);
    			attr_dev(div, "class", "grid grid-cols-2 gap-x-2 gap-y-6");
    			add_location(div, file$o, 17, 4, 475);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, span0);
    			append_dev(span0, t0);
    			append_dev(p0, t1);
    			append_dev(p0, span1);
    			append_dev(span1, t2);
    			append_dev(div, t3);
    			append_dev(div, p1);
    			append_dev(p1, span2);
    			append_dev(span2, t4);
    			append_dev(p1, t5);
    			append_dev(p1, span3);
    			append_dev(span3, t6);
    			append_dev(div, t7);
    			append_dev(div, p2);
    			append_dev(p2, span4);
    			append_dev(span4, t8);
    			append_dev(p2, t9);
    			append_dev(p2, span5);
    			append_dev(span5, t10);
    			append_dev(div, t11);
    			append_dev(div, p3);
    			append_dev(p3, span6);
    			append_dev(span6, t12);
    			append_dev(p3, t13);
    			append_dev(p3, span7);
    			append_dev(span7, t14);
    			append_dev(div, t15);
    			append_dev(div, p4);
    			append_dev(p4, span8);
    			append_dev(span8, t16);
    			append_dev(p4, t17);
    			append_dev(p4, span9);
    			append_dev(span9, t18);
    			append_dev(div, t19);
    			append_dev(div, p5);
    			append_dev(p5, span10);
    			append_dev(span10, t20);
    			append_dev(p5, t21);
    			append_dev(p5, span11);
    			append_dev(span11, t22);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$settings*/ 2) {
    				set_style(span0, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*graphics*/ 1 && t2_value !== (t2_value = /*graphics*/ ctx[0].model + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span2, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*graphics*/ 1 && t6_value !== (t6_value = /*graphics*/ ctx[0].vendor + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span4, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*graphics*/ 1 && t10_value !== (t10_value = /*graphics*/ ctx[0].bus + "")) set_data_dev(t10, t10_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span6, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*graphics*/ 1 && t14_value !== (t14_value = (/*graphics*/ ctx[0].vram / 1024).toPrecision(3) + "")) set_data_dev(t14, t14_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span8, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*graphics*/ 1 && t18_value !== (t18_value = /*graphics*/ ctx[0].connection + "")) set_data_dev(t18, t18_value);

    			if (dirty & /*$settings*/ 2) {
    				set_style(span10, "color", /*$settings*/ ctx[1].fontColor2);
    			}

    			if (dirty & /*graphics*/ 1 && t22_value !== (t22_value = /*graphics*/ ctx[0].display + "")) set_data_dev(t22, t22_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$e.name,
    		type: "if",
    		source: "(17:4) {#if graphics}",
    		ctx
    	});

    	return block;
    }

    // (13:0) <Shell       title={"Graphics Card Details"}       tooltip={"Information about the GPU"}  >
    function create_default_slot$i(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*graphics*/ ctx[0]) return create_if_block$e;
    		return create_else_block$e;
    	}

    	let current_block_type = select_block_type(ctx);
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
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
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
    		id: create_default_slot$i.name,
    		type: "slot",
    		source: "(13:0) <Shell       title={\\\"Graphics Card Details\\\"}       tooltip={\\\"Information about the GPU\\\"}  >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$p(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "Graphics Card Details",
    				tooltip: "Information about the GPU",
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

    			if (dirty & /*$$scope, graphics, $settings*/ 11) {
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

    function instance$p($$self, $$props, $$invalidate) {
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
    		ipcRenderer,
    		Shell,
    		settings,
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
    		init(this, options, instance$p, create_fragment$p, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Graphics",
    			options,
    			id: create_fragment$p.name
    		});
    	}
    }

    /* src\Pages\_system.svelte generated by Svelte v3.19.1 */
    const file$p = "src\\Pages\\_system.svelte";

    // (9:0) <Page>
    function create_default_slot$j(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let current;
    	const cpu = new Cpu({ $$inline: true });
    	const osinfo = new OSinfo({ $$inline: true });
    	const ram = new Ram({ $$inline: true });
    	const graphics = new Graphics({ $$inline: true });

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
    			attr_dev(div, "class", "grid grid-cols-1 md:grid-cols-2 gap-4");
    			add_location(div, file$p, 9, 4, 339);
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
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cpu.$$.fragment, local);
    			transition_in(osinfo.$$.fragment, local);
    			transition_in(ram.$$.fragment, local);
    			transition_in(graphics.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cpu.$$.fragment, local);
    			transition_out(osinfo.$$.fragment, local);
    			transition_out(ram.$$.fragment, local);
    			transition_out(graphics.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(cpu);
    			destroy_component(osinfo);
    			destroy_component(ram);
    			destroy_component(graphics);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$j.name,
    		type: "slot",
    		source: "(9:0) <Page>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$q(ctx) {
    	let current;

    	const page = new Page({
    			props: {
    				$$slots: { default: [create_default_slot$j] },
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
    		id: create_fragment$q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$q($$self, $$props, $$invalidate) {
    	$$self.$capture_state = () => ({ Page, Cpu, OSinfo, Ram, Graphics });
    	return [];
    }

    class System extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$q, create_fragment$q, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "System",
    			options,
    			id: create_fragment$q.name
    		});
    	}
    }

    /* src\Pages\_api.svelte generated by Svelte v3.19.1 */
    const file$q = "src\\Pages\\_api.svelte";

    // (5:0) <Page>
    function create_default_slot$k(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			add_location(div, file$q, 5, 4, 75);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$k.name,
    		type: "slot",
    		source: "(5:0) <Page>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$r(ctx) {
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
    		id: create_fragment$r.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$r($$self, $$props, $$invalidate) {
    	$$self.$capture_state = () => ({ Page });
    	return [];
    }

    class Api extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$r, create_fragment$r, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Api",
    			options,
    			id: create_fragment$r.name
    		});
    	}
    }

    /* src\Pages\_settings.svelte generated by Svelte v3.19.1 */
    const file$r = "src\\Pages\\_settings.svelte";

    // (31:0) <Page>
    function create_default_slot$l(ctx) {
    	let div7;
    	let h2;
    	let t0;
    	let t1;
    	let div0;
    	let label0;
    	let t2;
    	let t3;
    	let input0;
    	let t4;
    	let div2;
    	let label1;
    	let t5;
    	let t6;
    	let div1;
    	let input1;
    	let t7;
    	let input2;
    	let t8;
    	let div4;
    	let label2;
    	let t9;
    	let t10;
    	let div3;
    	let input3;
    	let t11;
    	let input4;
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
    			h2 = element("h2");
    			t0 = text("Settings");
    			t1 = space();
    			div0 = element("div");
    			label0 = element("label");
    			t2 = text("Username");
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div2 = element("div");
    			label1 = element("label");
    			t5 = text("Background Colors");
    			t6 = space();
    			div1 = element("div");
    			input1 = element("input");
    			t7 = space();
    			input2 = element("input");
    			t8 = space();
    			div4 = element("div");
    			label2 = element("label");
    			t9 = text("Font Colors");
    			t10 = space();
    			div3 = element("div");
    			input3 = element("input");
    			t11 = space();
    			input4 = element("input");
    			t12 = space();
    			div5 = element("div");
    			label3 = element("label");
    			t13 = text("Font");
    			t14 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Default\r\n                ";
    			option1 = element("option");
    			option1.textContent = "Roboto\r\n                ";
    			option2 = element("option");
    			option2.textContent = "Open Sans\r\n                ";
    			option3 = element("option");
    			option3.textContent = "Lato\r\n                ";
    			option4 = element("option");
    			option4.textContent = "Montserrat";
    			t20 = space();
    			div6 = element("div");
    			button0 = element("button");
    			t21 = text("Apply");
    			t22 = space();
    			button1 = element("button");
    			t23 = text("Reset");
    			attr_dev(h2, "class", "text-3xl mb-8");
    			set_style(h2, "color", /*$settings*/ ctx[0].fontColor2);
    			add_location(h2, file$r, 32, 8, 1430);
    			attr_dev(label0, "class", "text-sm pb-2");
    			set_style(label0, "color", /*$settings*/ ctx[0].fontColor2);
    			attr_dev(label0, "for", "username");
    			add_location(label0, file$r, 40, 12, 1662);
    			attr_dev(input0, "class", "w-full sm:w-96 rounded-sm p-1 mb-6");
    			set_style(input0, "background-color", /*$settings*/ ctx[0].bgColor2);
    			set_style(input0, "color", /*$settings*/ ctx[0].fontColor1);
    			input0.value = /*username*/ ctx[1];
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", "username");
    			add_location(input0, file$r, 47, 12, 1874);
    			attr_dev(div0, "class", "flex flex-col justify-start");
    			add_location(div0, file$r, 39, 8, 1607);
    			attr_dev(label1, "class", "text-sm pb-2");
    			set_style(label1, "color", /*$settings*/ ctx[0].fontColor2);
    			attr_dev(label1, "for", "Background Colors");
    			add_location(label1, file$r, 57, 12, 2269);
    			attr_dev(input1, "class", "mr-2 mb-6 rounded-sm");
    			input1.value = /*bgColor1*/ ctx[2];
    			attr_dev(input1, "type", "color");
    			attr_dev(input1, "id", "bgColor-1");
    			add_location(input1, file$r, 65, 16, 2522);
    			attr_dev(input2, "class", "ml-2 mb-6 rounded-sm");
    			input2.value = /*bgColor2*/ ctx[3];
    			attr_dev(input2, "type", "color");
    			attr_dev(input2, "id", "bgColor-2");
    			add_location(input2, file$r, 71, 16, 2729);
    			add_location(div1, file$r, 64, 12, 2499);
    			attr_dev(div2, "class", "flex flex-col justify-start");
    			add_location(div2, file$r, 56, 8, 2214);
    			attr_dev(label2, "class", "text-sm pb-2");
    			set_style(label2, "color", /*$settings*/ ctx[0].fontColor2);
    			attr_dev(label2, "for", "Font Colors");
    			add_location(label2, file$r, 81, 12, 3049);
    			attr_dev(input3, "class", "mr-2 mb-6 rounded-sm");
    			input3.value = /*fontColor1*/ ctx[4];
    			attr_dev(input3, "type", "color");
    			attr_dev(input3, "id", "fontColor-1");
    			add_location(input3, file$r, 89, 16, 3290);
    			attr_dev(input4, "class", "ml-2 mb-6 rounded-sm");
    			input4.value = /*fontColor2*/ ctx[5];
    			attr_dev(input4, "type", "color");
    			attr_dev(input4, "id", "fontColor-2");
    			add_location(input4, file$r, 95, 16, 3501);
    			add_location(div3, file$r, 88, 12, 3267);
    			attr_dev(div4, "class", "flex flex-col justify-start");
    			add_location(div4, file$r, 80, 8, 2994);
    			attr_dev(label3, "class", "text-sm pb-2");
    			set_style(label3, "color", /*$settings*/ ctx[0].fontColor2);
    			attr_dev(label3, "for", "Font");
    			add_location(label3, file$r, 105, 12, 3818);
    			option0.__value = "";
    			option0.value = option0.__value;
    			add_location(option0, file$r, 118, 16, 4198);
    			option1.__value = "Roboto";
    			option1.value = option1.__value;
    			add_location(option1, file$r, 121, 16, 4289);
    			option2.__value = "Open Sans";
    			option2.value = option2.__value;
    			add_location(option2, file$r, 124, 16, 4385);
    			option3.__value = "Lato";
    			option3.value = option3.__value;
    			add_location(option3, file$r, 127, 16, 4487);
    			option4.__value = "Montserrat";
    			option4.value = option4.__value;
    			add_location(option4, file$r, 130, 16, 4579);
    			attr_dev(select, "name", "font");
    			attr_dev(select, "id", "font");
    			attr_dev(select, "class", "w-max mb-6 px-2 py-1");
    			add_location(select, file$r, 112, 12, 4022);
    			attr_dev(div5, "class", "flex flex-col justify-start");
    			add_location(div5, file$r, 104, 8, 3763);
    			attr_dev(button0, "class", "px-6 py-2 rounded-sm text-sm mr-4");
    			set_style(button0, "background-color", /*$settings*/ ctx[0].bgColor2);
    			set_style(button0, "color", /*$settings*/ ctx[0].fontColor1);
    			add_location(button0, file$r, 137, 12, 4806);
    			attr_dev(button1, "class", "px-6 py-2 rounded-sm text-sm");
    			set_style(button1, "background-color", /*$settings*/ ctx[0].bgColor2);
    			set_style(button1, "color", /*$settings*/ ctx[0].fontColor1);
    			add_location(button1, file$r, 144, 12, 5100);
    			attr_dev(div6, "class", "flex flex-row justify-end items-center");
    			add_location(div6, file$r, 136, 8, 4740);
    			add_location(div7, file$r, 31, 4, 1415);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, h2);
    			append_dev(h2, t0);
    			append_dev(div7, t1);
    			append_dev(div7, div0);
    			append_dev(div0, label0);
    			append_dev(label0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, input0);
    			append_dev(div7, t4);
    			append_dev(div7, div2);
    			append_dev(div2, label1);
    			append_dev(label1, t5);
    			append_dev(div2, t6);
    			append_dev(div2, div1);
    			append_dev(div1, input1);
    			append_dev(div1, t7);
    			append_dev(div1, input2);
    			append_dev(div7, t8);
    			append_dev(div7, div4);
    			append_dev(div4, label2);
    			append_dev(label2, t9);
    			append_dev(div4, t10);
    			append_dev(div4, div3);
    			append_dev(div3, input3);
    			append_dev(div3, t11);
    			append_dev(div3, input4);
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
    			select_value_value = /*font*/ ctx[6];

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
    				listen_dev(button0, "click", /*click_handler*/ ctx[8], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[9], false, false, false)
    			];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$settings*/ 1) {
    				set_style(h2, "color", /*$settings*/ ctx[0].fontColor2);
    			}

    			if (dirty & /*$settings*/ 1) {
    				set_style(label0, "color", /*$settings*/ ctx[0].fontColor2);
    			}

    			if (dirty & /*$settings*/ 1) {
    				set_style(input0, "background-color", /*$settings*/ ctx[0].bgColor2);
    			}

    			if (dirty & /*$settings*/ 1) {
    				set_style(input0, "color", /*$settings*/ ctx[0].fontColor1);
    			}

    			if (dirty & /*$settings*/ 1) {
    				set_style(label1, "color", /*$settings*/ ctx[0].fontColor2);
    			}

    			if (dirty & /*$settings*/ 1) {
    				set_style(label2, "color", /*$settings*/ ctx[0].fontColor2);
    			}

    			if (dirty & /*$settings*/ 1) {
    				set_style(label3, "color", /*$settings*/ ctx[0].fontColor2);
    			}

    			if (dirty & /*$settings*/ 1) {
    				set_style(button0, "background-color", /*$settings*/ ctx[0].bgColor2);
    			}

    			if (dirty & /*$settings*/ 1) {
    				set_style(button0, "color", /*$settings*/ ctx[0].fontColor1);
    			}

    			if (dirty & /*$settings*/ 1) {
    				set_style(button1, "background-color", /*$settings*/ ctx[0].bgColor2);
    			}

    			if (dirty & /*$settings*/ 1) {
    				set_style(button1, "color", /*$settings*/ ctx[0].fontColor1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$l.name,
    		type: "slot",
    		source: "(31:0) <Page>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$s(ctx) {
    	let current;

    	const page = new Page({
    			props: {
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

    			if (dirty & /*$$scope, $settings*/ 1025) {
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

    function instance$s($$self, $$props, $$invalidate) {
    	let $settings;
    	validate_store(settings, "settings");
    	component_subscribe($$self, settings, $$value => $$invalidate(0, $settings = $$value));
    	let username = $settings.username;
    	let bgColor1 = $settings.bgColor1;
    	let bgColor2 = $settings.bgColor2;
    	let fontColor1 = $settings.fontColor1;
    	let fontColor2 = $settings.fontColor2;
    	let font = $settings.font;

    	const applyChanges = type => {
    		// Set store values
    		set_store_value(
    			settings,
    			$settings.username = type == "save"
    			? document.getElementById("username").value
    			: "User",
    			$settings
    		);

    		set_store_value(
    			settings,
    			$settings.bgColor1 = type == "save"
    			? document.getElementById("bgColor-1").value
    			: "#111827",
    			$settings
    		);

    		set_store_value(
    			settings,
    			$settings.bgColor2 = type == "save"
    			? document.getElementById("bgColor-2").value
    			: "#3C0A64",
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
    		localStorage.fontColor1 = $settings.fontColor1;
    		localStorage.fontColor2 = $settings.fontColor2;
    		localStorage.font = $settings.font;
    	};

    	const click_handler = () => applyChanges("save");
    	const click_handler_1 = () => applyChanges("reset");

    	$$self.$capture_state = () => ({
    		Page,
    		settings,
    		username,
    		bgColor1,
    		bgColor2,
    		fontColor1,
    		fontColor2,
    		font,
    		applyChanges,
    		$settings,
    		document,
    		localStorage
    	});

    	$$self.$inject_state = $$props => {
    		if ("username" in $$props) $$invalidate(1, username = $$props.username);
    		if ("bgColor1" in $$props) $$invalidate(2, bgColor1 = $$props.bgColor1);
    		if ("bgColor2" in $$props) $$invalidate(3, bgColor2 = $$props.bgColor2);
    		if ("fontColor1" in $$props) $$invalidate(4, fontColor1 = $$props.fontColor1);
    		if ("fontColor2" in $$props) $$invalidate(5, fontColor2 = $$props.fontColor2);
    		if ("font" in $$props) $$invalidate(6, font = $$props.font);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		$settings,
    		username,
    		bgColor1,
    		bgColor2,
    		fontColor1,
    		fontColor2,
    		font,
    		applyChanges,
    		click_handler,
    		click_handler_1
    	];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$s, create_fragment$s, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$s.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.19.1 */

    function create_fragment$t(ctx) {
    	let current;

    	const router = new Router({
    			props: {
    				routes: {
    					"/": Main,
    					"/network": Network,
    					"/diagnostics": Diagnostics,
    					"/wifi": Wifi,
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
    		id: create_fragment$t.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$t($$self, $$props, $$invalidate) {
    	$$self.$capture_state = () => ({
    		Router,
    		Main,
    		Network,
    		Diagnostics,
    		Wifi,
    		System,
    		Api,
    		Settings
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$t, create_fragment$t, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$t.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

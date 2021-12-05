
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
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
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

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
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

    /* src\Components\Misc\NavHorizontal.svelte generated by Svelte v3.19.1 */

    const file = "src\\Components\\Misc\\NavHorizontal.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let a0;
    	let i0;
    	let t0;
    	let t1;
    	let a1;
    	let i1;
    	let t2;
    	let t3;
    	let a2;
    	let i2;
    	let t4;
    	let t5;
    	let a3;
    	let i3;
    	let t6;
    	let t7;
    	let a4;
    	let i4;
    	let t8;
    	let t9;
    	let a5;
    	let i5;
    	let t10;
    	let t11;
    	let a6;
    	let i6;
    	let t12;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			i0 = element("i");
    			t0 = text(" HOME");
    			t1 = space();
    			a1 = element("a");
    			i1 = element("i");
    			t2 = text(" NETWORK TOOLS");
    			t3 = space();
    			a2 = element("a");
    			i2 = element("i");
    			t4 = text(" COLLECTIONS / MISC");
    			t5 = space();
    			a3 = element("a");
    			i3 = element("i");
    			t6 = text(" PENTESTING");
    			t7 = space();
    			a4 = element("a");
    			i4 = element("i");
    			t8 = text(" WIFI TOOLS");
    			t9 = space();
    			a5 = element("a");
    			i5 = element("i");
    			t10 = text(" SYSTEM MONITORING");
    			t11 = space();
    			a6 = element("a");
    			i6 = element("i");
    			t12 = text(" SETTINGS");
    			attr_dev(i0, "class", "fa fa-home");
    			attr_dev(i0, "aria-hidden", "true");
    			add_location(i0, file, 7, 108, 314);
    			attr_dev(a0, "href", "#/");
    			attr_dev(a0, "class", "rounded-md p-2 font-bold hover:text-gray-300 m-3 bg-purple-600 text-sm");
    			add_location(a0, file, 7, 16, 222);
    			attr_dev(i1, "class", "fa fa-plug");
    			attr_dev(i1, "aria-hidden", "true");
    			add_location(i1, file, 9, 117, 535);
    			attr_dev(a1, "href", "#/network");
    			attr_dev(a1, "class", "rounded-md p-2 font-bold hover:text-gray-300 m-3 bg-purple-600 text-sm");
    			add_location(a1, file, 9, 18, 436);
    			attr_dev(i2, "class", "fa fa-cubes");
    			attr_dev(i2, "aria-hidden", "true");
    			add_location(i2, file, 11, 119, 766);
    			attr_dev(a2, "href", "#/diagnostics");
    			attr_dev(a2, "class", "rounded-md p-2 font-bold hover:text-gray-300 m-3 bg-purple-600 text-sm");
    			add_location(a2, file, 11, 16, 663);
    			attr_dev(i3, "class", "fa fa-terminal");
    			attr_dev(i3, "aria-hidden", "true");
    			add_location(i3, file, 13, 118, 1000);
    			attr_dev(a3, "href", "#/pentesting");
    			attr_dev(a3, "class", "rounded-md p-2 font-bold hover:text-gray-300 m-3 bg-purple-600 text-sm");
    			add_location(a3, file, 13, 16, 898);
    			attr_dev(i4, "class", "fa fa-wifi");
    			attr_dev(i4, "aria-hidden", "true");
    			add_location(i4, file, 15, 112, 1222);
    			attr_dev(a4, "href", "#/wifi");
    			attr_dev(a4, "class", "rounded-md p-2 font-bold hover:text-gray-300 m-3 bg-purple-600 text-sm");
    			add_location(a4, file, 15, 16, 1126);
    			attr_dev(i5, "class", "fa fa-microchip");
    			attr_dev(i5, "aria-hidden", "true");
    			add_location(i5, file, 17, 114, 1442);
    			attr_dev(a5, "href", "#/system");
    			attr_dev(a5, "class", "rounded-md p-2 font-bold hover:text-gray-300 m-3 bg-purple-600 text-sm");
    			add_location(a5, file, 17, 16, 1344);
    			attr_dev(i6, "class", "fa fa-cog");
    			attr_dev(i6, "aria-hidden", "true");
    			add_location(i6, file, 19, 116, 1676);
    			attr_dev(a6, "href", "#/settings");
    			attr_dev(a6, "class", "rounded-md p-2 font-bold hover:text-gray-300 m-3 bg-purple-600 text-sm");
    			add_location(a6, file, 19, 16, 1576);
    			attr_dev(div0, "class", "flex flex-row justify-center p-2");
    			add_location(div0, file, 6, 8, 158);
    			attr_dev(div1, "class", "rounded-md shadow-md mb-1 p-1 text-gray-50");
    			add_location(div1, file, 4, 0, 51);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(a0, i0);
    			append_dev(a0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, a1);
    			append_dev(a1, i1);
    			append_dev(a1, t2);
    			append_dev(div0, t3);
    			append_dev(div0, a2);
    			append_dev(a2, i2);
    			append_dev(a2, t4);
    			append_dev(div0, t5);
    			append_dev(div0, a3);
    			append_dev(a3, i3);
    			append_dev(a3, t6);
    			append_dev(div0, t7);
    			append_dev(div0, a4);
    			append_dev(a4, i4);
    			append_dev(a4, t8);
    			append_dev(div0, t9);
    			append_dev(div0, a5);
    			append_dev(a5, i5);
    			append_dev(a5, t10);
    			append_dev(div0, t11);
    			append_dev(div0, a6);
    			append_dev(a6, i6);
    			append_dev(a6, t12);
    		},
    		p: noop,
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
    	let isVisible = false;
    	$$self.$capture_state = () => ({ isVisible });

    	$$self.$inject_state = $$props => {
    		if ("isVisible" in $$props) isVisible = $$props.isVisible;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class NavHorizontal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavHorizontal",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\Components\Misc\Shell.svelte generated by Svelte v3.19.1 */

    const file$1 = "src\\Components\\Misc\\Shell.svelte";

    function create_fragment$2(ctx) {
    	let div2;
    	let div0;
    	let h2;
    	let t0;
    	let t1;
    	let span;
    	let t2;
    	let hr;
    	let t3;
    	let div1;
    	let p;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			span = element("span");
    			t2 = space();
    			hr = element("hr");
    			t3 = space();
    			div1 = element("div");

    			if (!default_slot) {
    				p = element("p");
    				p.textContent = "Component Body";
    			}

    			if (default_slot) default_slot.c();
    			attr_dev(h2, "class", "text-md text-gray-50 font-bold");
    			add_location(h2, file$1, 7, 8, 225);
    			attr_dev(span, "class", "ml-2 fas fa-info-circle text-gray-50 hover:text-gray-300 cursor-pointer");
    			attr_dev(span, "title", /*tooltip*/ ctx[1]);
    			add_location(span, file$1, 8, 8, 290);
    			attr_dev(div0, "class", "flex flex-row justify-between mb-1");
    			add_location(div0, file$1, 6, 4, 167);
    			attr_dev(hr, "class", "mt-2");
    			add_location(hr, file$1, 11, 4, 429);

    			if (!default_slot) {
    				add_location(p, file$1, 14, 12, 527);
    			}

    			attr_dev(div1, "class", "flex flex-row text-gray-50 mt-2");
    			add_location(div1, file$1, 12, 4, 452);
    			attr_dev(div2, "class", "rounded-md shadow-md bg-gray-700 p-2");
    			add_location(div2, file$1, 5, 0, 111);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, h2);
    			append_dev(h2, t0);
    			append_dev(div0, t1);
    			append_dev(div0, span);
    			append_dev(div2, t2);
    			append_dev(div2, hr);
    			append_dev(div2, t3);
    			append_dev(div2, div1);

    			if (!default_slot) {
    				append_dev(div1, p);
    			}

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);

    			if (!current || dirty & /*tooltip*/ 2) {
    				attr_dev(span, "title", /*tooltip*/ ctx[1]);
    			}

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 4) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[2], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null));
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
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
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ title, tooltip });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("tooltip" in $$props) $$invalidate(1, tooltip = $$props.tooltip);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, tooltip, $$scope, $$slots];
    }

    class Shell extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { title: 0, tooltip: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Shell",
    			options,
    			id: create_fragment$2.name
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

    /* src\Components\Misc\TitleBar.svelte generated by Svelte v3.19.1 */

    const file$2 = "src\\Components\\Misc\\TitleBar.svelte";

    function create_fragment$3(ctx) {
    	let div3;
    	let div0;
    	let p0;
    	let t0;
    	let div1;
    	let p1;
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
    			p0 = element("p");
    			t0 = space();
    			div1 = element("div");
    			p1 = element("p");
    			p1.textContent = "NEURON";
    			t2 = space();
    			div2 = element("div");
    			button0 = element("button");
    			t3 = space();
    			button1 = element("button");
    			t4 = space();
    			button2 = element("button");
    			attr_dev(p0, "class", "text-white text-2xl font-bold pt-1 pl-16 pb-1");
    			add_location(p0, file$2, 23, 4, 463);
    			attr_dev(div0, "class", "drag svelte-ncud02");
    			add_location(div0, file$2, 22, 2, 439);
    			attr_dev(p1, "class", "text-white text-2xl font-bold pt-1 pl-16 pb-1");
    			add_location(p1, file$2, 26, 4, 562);
    			attr_dev(div1, "class", "drag svelte-ncud02");
    			add_location(div1, file$2, 25, 2, 538);
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "class", "links mx-2 text-white hover:text-blue-700 fa fa-window-minimize");
    			attr_dev(button0, "aria-hidden", "true");
    			add_location(button0, file$2, 30, 4, 706);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "class", "links mx-2 text-white hover:text-blue-700 fa fa-window-maximize");
    			attr_dev(button1, "aria-hidden", "true");
    			add_location(button1, file$2, 31, 4, 860);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "class", "links mx-2 text-white hover:text-blue-700 fa fa-times");
    			attr_dev(button2, "aria-hidden", "true");
    			add_location(button2, file$2, 32, 4, 1014);
    			attr_dev(div2, "class", "p-2");
    			add_location(div2, file$2, 28, 2, 643);
    			attr_dev(div3, "class", "bg-gray-800 flex flex-row justify-between");
    			add_location(div3, file$2, 21, 0, 380);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, p0);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, p1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, button0);
    			append_dev(div2, t3);
    			append_dev(div2, button1);
    			append_dev(div2, t4);
    			append_dev(div2, button2);

    			dispose = [
    				listen_dev(button0, "click", /*minimizeWindow*/ ctx[0], false, false, false),
    				listen_dev(button1, "click", /*maximizeWindow*/ ctx[1], false, false, false),
    				listen_dev(button2, "click", /*closeWindow*/ ctx[2], false, false, false)
    			];
    		},
    		p: noop,
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
    	const { remote } = require("electron");
    	let window = remote.getCurrentWindow();

    	// Minimize the application
    	function minimizeWindow() {
    		window.minimize();
    	}

    	// Maximize the application
    	function maximizeWindow() {
    		window.maximize();
    	}

    	// Quit the application
    	function closeWindow() {
    		window.close();
    	}

    	$$self.$capture_state = () => ({
    		remote,
    		window,
    		minimizeWindow,
    		maximizeWindow,
    		closeWindow,
    		require
    	});

    	$$self.$inject_state = $$props => {
    		if ("window" in $$props) window = $$props.window;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [minimizeWindow, maximizeWindow, closeWindow];
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

    /* src\Pages\_main.svelte generated by Svelte v3.19.1 */
    const file$3 = "src\\Pages\\_main.svelte";

    function create_fragment$4(ctx) {
    	let t0;
    	let main;
    	let div2;
    	let t1;
    	let div1;
    	let div0;
    	let current;
    	const titlebar = new TitleBar({ $$inline: true });
    	const navhorizontal = new NavHorizontal({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(titlebar.$$.fragment);
    			t0 = space();
    			main = element("main");
    			div2 = element("div");
    			create_component(navhorizontal.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "grid grid-cols-2 gap-4");
    			add_location(div0, file$3, 12, 12, 534);
    			attr_dev(div1, "class", "container mx-auto p-2");
    			add_location(div1, file$3, 10, 8, 340);
    			attr_dev(div2, "class", "w-full h-screen bg-gray-900");
    			add_location(div2, file$3, 8, 4, 266);
    			attr_dev(main, "class", "flex flex-row");
    			add_location(main, file$3, 7, 0, 232);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(titlebar, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			mount_component(navhorizontal, div2, null);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(titlebar.$$.fragment, local);
    			transition_in(navhorizontal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(titlebar.$$.fragment, local);
    			transition_out(navhorizontal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(titlebar, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(navhorizontal);
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
    	$$self.$capture_state = () => ({ NavHorizontal, Shell, TitleBar });
    	return [];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\Components\Network\Ping\Ping.svelte generated by Svelte v3.19.1 */
    const file$4 = "src\\Components\\Network\\Ping\\Ping.svelte";

    // (55:4) {:else}
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
    			add_location(p0, file$4, 58, 10, 2237);
    			attr_dev(p1, "id", "infoValueCPN");
    			attr_dev(p1, "class", "font-bold text-white text-3xl");
    			add_location(p1, file$4, 60, 14, 2350);
    			attr_dev(p2, "class", "font-bold text-white text-3xl");
    			add_location(p2, file$4, 61, 14, 2437);
    			attr_dev(div0, "class", "flex flex-row");
    			add_location(div0, file$4, 59, 12, 2307);
    			attr_dev(div1, "class", "p-4 m-2 flex flex-col justify-center items-center");
    			add_location(div1, file$4, 57, 8, 2162);
    			attr_dev(p3, "class", "text-white font-thin text-lg text-xl");
    			add_location(p3, file$4, 66, 10, 2607);
    			attr_dev(p4, "id", "infoValueCPN");
    			attr_dev(p4, "class", "font-bold text-white text-3xl");
    			add_location(p4, file$4, 68, 14, 2721);
    			attr_dev(p5, "class", "font-bold text-white text-3xl");
    			add_location(p5, file$4, 69, 14, 2808);
    			attr_dev(div2, "class", "flex flex-row");
    			add_location(div2, file$4, 67, 12, 2678);
    			attr_dev(div3, "class", "p-4 m-2 flex flex-col justify-center items-center");
    			add_location(div3, file$4, 65, 8, 2532);
    			attr_dev(p6, "class", "text-white font-thin text-lg text-xl");
    			add_location(p6, file$4, 74, 10, 2976);
    			attr_dev(p7, "id", "infoValueCPN");
    			attr_dev(p7, "class", "font-bold text-white text-3xl");
    			add_location(p7, file$4, 76, 14, 3097);
    			attr_dev(p8, "class", "font-bold text-white text-sm");
    			add_location(p8, file$4, 77, 14, 3184);
    			attr_dev(div4, "class", "flex flex-row");
    			add_location(div4, file$4, 75, 12, 3054);
    			attr_dev(div5, "class", "p-4 m-2 flex flex-col justify-center items-center");
    			add_location(div5, file$4, 73, 8, 2901);
    			attr_dev(div6, "class", "flex flex-row");
    			add_location(div6, file$4, 55, 4, 2123);
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
    		source: "(55:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (25:4) {#if ping}
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
    			add_location(p0, file$4, 28, 10, 997);
    			attr_dev(p1, "id", "infoValueCPN");
    			attr_dev(p1, "class", "font-bold text-white text-3xl");
    			add_location(p1, file$4, 30, 14, 1110);
    			attr_dev(p2, "class", "font-bold text-white text-3xl");
    			add_location(p2, file$4, 31, 14, 1205);
    			attr_dev(div0, "class", "flex flex-row");
    			add_location(div0, file$4, 29, 12, 1067);
    			attr_dev(div1, "class", "p-4 m-2 flex flex-col justify-center items-center");
    			add_location(div1, file$4, 27, 8, 922);
    			attr_dev(p3, "class", "text-white font-thin text-lg text-xl");
    			add_location(p3, file$4, 36, 10, 1375);
    			attr_dev(p4, "id", "infoValueCPN");
    			attr_dev(p4, "class", "font-bold text-white text-3xl");
    			add_location(p4, file$4, 38, 14, 1489);
    			attr_dev(p5, "class", "font-bold text-white text-3xl");
    			add_location(p5, file$4, 39, 14, 1585);
    			attr_dev(div2, "class", "flex flex-row");
    			add_location(div2, file$4, 37, 12, 1446);
    			attr_dev(div3, "class", "p-4 m-2 flex flex-col justify-center items-center");
    			add_location(div3, file$4, 35, 8, 1300);
    			attr_dev(p6, "class", "text-white font-thin text-lg text-xl");
    			add_location(p6, file$4, 44, 10, 1753);
    			attr_dev(p7, "id", "infoValueCPN");
    			attr_dev(p7, "class", "font-bold text-white text-3xl");
    			add_location(p7, file$4, 46, 14, 1874);
    			attr_dev(p8, "class", "font-bold text-white text-sm");
    			add_location(p8, file$4, 47, 14, 1968);
    			attr_dev(div4, "class", "flex flex-row");
    			add_location(div4, file$4, 45, 12, 1831);
    			attr_dev(div5, "class", "p-4 m-2 flex flex-col justify-center items-center");
    			add_location(div5, file$4, 43, 8, 1678);
    			attr_dev(div6, "class", "flex flex-row");
    			add_location(div6, file$4, 25, 4, 883);
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
    		source: "(25:4) {#if ping}",
    		ctx
    	});

    	return block;
    }

    // (18:0) <Shell title={"PING TOOL"} tooltip={"Check PING Timings"}>
    function create_default_slot(ctx) {
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
    			add_location(input, file$4, 20, 4, 521);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-thin hover:bg-blue-600");
    			add_location(button, file$4, 21, 4, 646);
    			attr_dev(div0, "class", "flex flex-row justify-start mt-1");
    			add_location(div0, file$4, 19, 4, 469);
    			attr_dev(div1, "class", "flex flex-col items-start text-gray-50");
    			add_location(div1, file$4, 23, 4, 809);
    			attr_dev(div2, "class", "flex flex-col");
    			add_location(div2, file$4, 18, 2, 436);
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
    				listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
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
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(18:0) <Shell title={\\\"PING TOOL\\\"} tooltip={\\\"Check PING Timings\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "PING TOOL",
    				tooltip: "Check PING Timings",
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

    			if (dirty & /*$$scope, ping, name*/ 35) {
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let ping, name;

    	function sendData() {
    		setInterval(
    			() => {
    				ipcRenderer.send("get-ping-info", name);

    				ipcRenderer.on("get-ping-info", (e, pInfo) => {
    					$$invalidate(0, ping = pInfo);
    				});
    			},
    			1000
    		);
    	}

    	function input_input_handler() {
    		name = this.value;
    		$$invalidate(1, name);
    	}

    	$$self.$capture_state = () => ({
    		ipcRenderer,
    		Shell,
    		ping,
    		name,
    		sendData,
    		require,
    		setInterval
    	});

    	$$self.$inject_state = $$props => {
    		if ("ping" in $$props) $$invalidate(0, ping = $$props.ping);
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [ping, name, sendData, ipcRenderer, input_input_handler];
    }

    class Ping extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ping",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\Components\Network\Whois\Whois.svelte generated by Svelte v3.19.1 */
    const file$5 = "src\\Components\\Network\\Whois\\Whois.svelte";

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
    			add_location(p0, file$5, 31, 4, 1340);
    			add_location(p1, file$5, 32, 4, 1363);
    			add_location(p2, file$5, 33, 4, 1394);
    			add_location(p3, file$5, 34, 4, 1416);
    			add_location(p4, file$5, 35, 4, 1441);
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
    			add_location(span0, file$5, 24, 18, 888);
    			add_location(p0, file$5, 24, 8, 878);
    			attr_dev(span1, "class", "font-bold text-lg");
    			add_location(span1, file$5, 25, 26, 972);
    			add_location(p1, file$5, 25, 8, 954);
    			attr_dev(span2, "class", "font-bold text-lg");
    			add_location(span2, file$5, 26, 17, 1062);
    			add_location(p2, file$5, 26, 8, 1053);
    			attr_dev(span3, "class", "font-bold text-lg");
    			add_location(span3, file$5, 27, 20, 1152);
    			add_location(p3, file$5, 27, 8, 1140);
    			attr_dev(span4, "class", "font-bold text-lg");
    			add_location(span4, file$5, 28, 23, 1248);
    			add_location(p4, file$5, 28, 8, 1233);
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
    			add_location(input, file$5, 19, 4, 520);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "text-sm bg-purple-500 px-2 py-1 m-2 rounded-md mx-1 font-thin hover:bg-blue-600");
    			add_location(button, file$5, 20, 4, 636);
    			attr_dev(div0, "class", "flex flex-row justify-start mt-1");
    			add_location(div0, file$5, 18, 4, 468);
    			attr_dev(div1, "class", "flex flex-col items-start text-gray-50");
    			add_location(div1, file$5, 22, 4, 799);
    			attr_dev(div2, "class", "flex flex-col");
    			add_location(div2, file$5, 17, 2, 435);
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
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(17:0) <Shell title={\\\"WHOIS LOOKUP\\\"} tooltip={\\\"Check WHOIS\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "WHOIS LOOKUP",
    				tooltip: "Check WHOIS",
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Whois",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\Pages\_network.svelte generated by Svelte v3.19.1 */
    const file$6 = "src\\Pages\\_network.svelte";

    function create_fragment$7(ctx) {
    	let t0;
    	let main;
    	let div2;
    	let t1;
    	let div1;
    	let div0;
    	let t2;
    	let current;
    	const titlebar = new TitleBar({ $$inline: true });
    	const navhorizontal = new NavHorizontal({ $$inline: true });
    	const ping = new Ping({ $$inline: true });
    	const whois = new Whois({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(titlebar.$$.fragment);
    			t0 = space();
    			main = element("main");
    			div2 = element("div");
    			create_component(navhorizontal.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			create_component(ping.$$.fragment);
    			t2 = space();
    			create_component(whois.$$.fragment);
    			attr_dev(div0, "class", "grid grid-cols-2 gap-4");
    			add_location(div0, file$6, 15, 12, 665);
    			attr_dev(div1, "class", "container mx-auto p-2");
    			add_location(div1, file$6, 13, 8, 471);
    			attr_dev(div2, "class", "w-full h-screen bg-gray-900");
    			add_location(div2, file$6, 11, 4, 397);
    			attr_dev(main, "class", "flex flex-row");
    			add_location(main, file$6, 10, 0, 363);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(titlebar, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			mount_component(navhorizontal, div2, null);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			mount_component(ping, div0, null);
    			append_dev(div0, t2);
    			mount_component(whois, div0, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(titlebar.$$.fragment, local);
    			transition_in(navhorizontal.$$.fragment, local);
    			transition_in(ping.$$.fragment, local);
    			transition_in(whois.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(titlebar.$$.fragment, local);
    			transition_out(navhorizontal.$$.fragment, local);
    			transition_out(ping.$$.fragment, local);
    			transition_out(whois.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(titlebar, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(navhorizontal);
    			destroy_component(ping);
    			destroy_component(whois);
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
    	$$self.$capture_state = () => ({
    		NavHorizontal,
    		Shell,
    		TitleBar,
    		Ping,
    		Whois
    	});

    	return [];
    }

    class Network extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Network",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\Pages\_diagnostics.svelte generated by Svelte v3.19.1 */
    const file$7 = "src\\Pages\\_diagnostics.svelte";

    function create_fragment$8(ctx) {
    	let t0;
    	let main;
    	let div2;
    	let t1;
    	let div1;
    	let div0;
    	let current;
    	const titlebar = new TitleBar({ $$inline: true });
    	const navhorizontal = new NavHorizontal({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(titlebar.$$.fragment);
    			t0 = space();
    			main = element("main");
    			div2 = element("div");
    			create_component(navhorizontal.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "grid grid-cols-2 gap-4");
    			add_location(div0, file$7, 12, 12, 534);
    			attr_dev(div1, "class", "container mx-auto p-2");
    			add_location(div1, file$7, 10, 8, 340);
    			attr_dev(div2, "class", "w-full h-screen bg-gray-900");
    			add_location(div2, file$7, 8, 4, 266);
    			attr_dev(main, "class", "flex flex-row");
    			add_location(main, file$7, 7, 0, 232);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(titlebar, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			mount_component(navhorizontal, div2, null);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(titlebar.$$.fragment, local);
    			transition_in(navhorizontal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(titlebar.$$.fragment, local);
    			transition_out(navhorizontal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(titlebar, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(navhorizontal);
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
    	$$self.$capture_state = () => ({ NavHorizontal, Shell, TitleBar });
    	return [];
    }

    class Diagnostics extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Diagnostics",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\Pages\_pentesting.svelte generated by Svelte v3.19.1 */
    const file$8 = "src\\Pages\\_pentesting.svelte";

    function create_fragment$9(ctx) {
    	let t0;
    	let main;
    	let div2;
    	let t1;
    	let div1;
    	let div0;
    	let current;
    	const titlebar = new TitleBar({ $$inline: true });
    	const navhorizontal = new NavHorizontal({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(titlebar.$$.fragment);
    			t0 = space();
    			main = element("main");
    			div2 = element("div");
    			create_component(navhorizontal.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "grid grid-cols-2 gap-4");
    			add_location(div0, file$8, 12, 12, 534);
    			attr_dev(div1, "class", "container mx-auto p-2");
    			add_location(div1, file$8, 10, 8, 340);
    			attr_dev(div2, "class", "w-full h-screen bg-gray-900");
    			add_location(div2, file$8, 8, 4, 266);
    			attr_dev(main, "class", "flex flex-row");
    			add_location(main, file$8, 7, 0, 232);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(titlebar, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			mount_component(navhorizontal, div2, null);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(titlebar.$$.fragment, local);
    			transition_in(navhorizontal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(titlebar.$$.fragment, local);
    			transition_out(navhorizontal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(titlebar, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(navhorizontal);
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
    	$$self.$capture_state = () => ({ NavHorizontal, Shell, TitleBar });
    	return [];
    }

    class Pentesting extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pentesting",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src\Pages\_wifi.svelte generated by Svelte v3.19.1 */
    const file$9 = "src\\Pages\\_wifi.svelte";

    function create_fragment$a(ctx) {
    	let t0;
    	let main;
    	let div2;
    	let t1;
    	let div1;
    	let div0;
    	let current;
    	const titlebar = new TitleBar({ $$inline: true });
    	const navhorizontal = new NavHorizontal({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(titlebar.$$.fragment);
    			t0 = space();
    			main = element("main");
    			div2 = element("div");
    			create_component(navhorizontal.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "grid grid-cols-2 gap-4");
    			add_location(div0, file$9, 12, 12, 478);
    			attr_dev(div1, "class", "container mx-auto p-2");
    			add_location(div1, file$9, 10, 8, 284);
    			attr_dev(div2, "class", "w-full h-screen bg-gray-900");
    			add_location(div2, file$9, 8, 4, 210);
    			attr_dev(main, "class", "flex flex-row");
    			add_location(main, file$9, 7, 0, 176);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(titlebar, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			mount_component(navhorizontal, div2, null);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(titlebar.$$.fragment, local);
    			transition_in(navhorizontal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(titlebar.$$.fragment, local);
    			transition_out(navhorizontal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(titlebar, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(navhorizontal);
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
    	$$self.$capture_state = () => ({ NavHorizontal, TitleBar });
    	return [];
    }

    class Wifi extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Wifi",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\Components\System\Cpu\Cpu.svelte generated by Svelte v3.19.1 */
    const file$a = "src\\Components\\System\\Cpu\\Cpu.svelte";

    // (20:4) {:else}
    function create_else_block$3(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Fetching Required Info...";
    			add_location(p, file$a, 20, 8, 714);
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
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(20:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:4) {#if cpu}
    function create_if_block$3(ctx) {
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
    			p0 = element("p");
    			t0 = text("Processor: ");
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text("Speed: ");
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = text(" GHz");
    			t6 = space();
    			p2 = element("p");
    			t7 = text("Cores: ");
    			span2 = element("span");
    			t8 = text(t8_value);
    			t9 = space();
    			p3 = element("p");
    			t10 = text("Socket: ");
    			span3 = element("span");
    			t11 = text(t11_value);
    			attr_dev(span0, "class", "font-bold text-lg");
    			add_location(span0, file$a, 14, 22, 407);
    			add_location(p0, file$a, 14, 8, 393);
    			attr_dev(span1, "class", "font-bold text-lg");
    			add_location(span1, file$a, 15, 18, 481);
    			add_location(p1, file$a, 15, 8, 471);
    			attr_dev(span2, "class", "font-bold text-lg");
    			add_location(span2, file$a, 16, 18, 559);
    			add_location(p2, file$a, 16, 8, 549);
    			attr_dev(span3, "class", "font-bold text-lg");
    			add_location(span3, file$a, 17, 19, 634);
    			add_location(p3, file$a, 17, 8, 623);
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
    			append_dev(p1, t5);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, t7);
    			append_dev(p2, span2);
    			append_dev(span2, t8);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, p3, anchor);
    			append_dev(p3, t10);
    			append_dev(p3, span3);
    			append_dev(span3, t11);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cpu*/ 1 && t1_value !== (t1_value = /*cpu*/ ctx[0].brand + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*cpu*/ 1 && t4_value !== (t4_value = /*cpu*/ ctx[0].speed + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*cpu*/ 1 && t8_value !== (t8_value = /*cpu*/ ctx[0].cores + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*cpu*/ 1 && t11_value !== (t11_value = /*cpu*/ ctx[0].socket + "")) set_data_dev(t11, t11_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(p3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(14:4) {#if cpu}",
    		ctx
    	});

    	return block;
    }

    // (12:0) <Shell title={"CPU INFORMATION"} tooltip={"Information about the CPU"}>
    function create_default_slot$2(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*cpu*/ ctx[0]) return create_if_block$3;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "text-gray-50");
    			add_location(div, file$a, 12, 4, 342);
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
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(12:0) <Shell title={\\\"CPU INFORMATION\\\"} tooltip={\\\"Information about the CPU\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "CPU INFORMATION",
    				tooltip: "Information about the CPU",
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

    			if (dirty & /*$$scope, cpu*/ 5) {
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

    function instance$b($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let cpu;
    	ipcRenderer.send("get-cpu-info");

    	ipcRenderer.on("get-cpu-info", (e, cpuInfo) => {
    		$$invalidate(0, cpu = cpuInfo);
    	});

    	$$self.$capture_state = () => ({ ipcRenderer, Shell, cpu, require });

    	$$self.$inject_state = $$props => {
    		if ("cpu" in $$props) $$invalidate(0, cpu = $$props.cpu);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [cpu];
    }

    class Cpu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cpu",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\Components\System\OS\OSinfo.svelte generated by Svelte v3.19.1 */
    const file$b = "src\\Components\\System\\OS\\OSinfo.svelte";

    // (20:4) {:else}
    function create_else_block$4(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Fetching Required Info...";
    			add_location(p, file$b, 20, 8, 708);
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
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(20:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:4) {#if cpu}
    function create_if_block$4(ctx) {
    	let p0;
    	let t0;
    	let span0;
    	let t1_value = /*cpu*/ ctx[0].platform + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3;
    	let span1;
    	let t4_value = /*cpu*/ ctx[0].hostname + "";
    	let t4;
    	let t5;
    	let p2;
    	let t6;
    	let span2;
    	let t7_value = /*cpu*/ ctx[0].kernel + "";
    	let t7;
    	let t8;
    	let p3;
    	let t9;
    	let span3;
    	let t10_value = /*cpu*/ ctx[0].fqdn + "";
    	let t10;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text("Platform Architecture: ");
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text("Hostname: ");
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			p2 = element("p");
    			t6 = text("Kernel: ");
    			span2 = element("span");
    			t7 = text(t7_value);
    			t8 = space();
    			p3 = element("p");
    			t9 = text("FQDN: ");
    			span3 = element("span");
    			t10 = text(t10_value);
    			attr_dev(span0, "class", "font-bold text-lg");
    			add_location(span0, file$b, 14, 34, 426);
    			add_location(p0, file$b, 14, 8, 400);
    			attr_dev(span1, "class", "font-bold text-lg");
    			add_location(span1, file$b, 15, 21, 499);
    			add_location(p1, file$b, 15, 8, 486);
    			attr_dev(span2, "class", "font-bold text-lg");
    			add_location(span2, file$b, 16, 19, 570);
    			add_location(p2, file$b, 16, 8, 559);
    			attr_dev(span3, "class", "font-bold text-lg");
    			add_location(span3, file$b, 17, 17, 637);
    			add_location(p3, file$b, 17, 8, 628);
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
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cpu*/ 1 && t1_value !== (t1_value = /*cpu*/ ctx[0].platform + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*cpu*/ 1 && t4_value !== (t4_value = /*cpu*/ ctx[0].hostname + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*cpu*/ 1 && t7_value !== (t7_value = /*cpu*/ ctx[0].kernel + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*cpu*/ 1 && t10_value !== (t10_value = /*cpu*/ ctx[0].fqdn + "")) set_data_dev(t10, t10_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(p3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(14:4) {#if cpu}",
    		ctx
    	});

    	return block;
    }

    // (12:0) <Shell title={"OS / ARCH"} tooltip={"Information about CPU Temparatures"}>
    function create_default_slot$3(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*cpu*/ ctx[0]) return create_if_block$4;
    		return create_else_block$4;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "text-gray-50");
    			add_location(div, file$b, 12, 4, 349);
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
    		source: "(12:0) <Shell title={\\\"OS / ARCH\\\"} tooltip={\\\"Information about CPU Temparatures\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "OS / ARCH",
    				tooltip: "Information about CPU Temparatures",
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

    			if (dirty & /*$$scope, cpu*/ 5) {
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

    function instance$c($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");
    	let cpu;
    	ipcRenderer.send("get-cpu-temps");

    	ipcRenderer.on("get-cpu-temps", (e, cpuTemps) => {
    		$$invalidate(0, cpu = cpuTemps);
    	});

    	$$self.$capture_state = () => ({ ipcRenderer, Shell, cpu, require });

    	$$self.$inject_state = $$props => {
    		if ("cpu" in $$props) $$invalidate(0, cpu = $$props.cpu);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [cpu];
    }

    class OSinfo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "OSinfo",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src\Components\System\Ram\Ram.svelte generated by Svelte v3.19.1 */
    const file$c = "src\\Components\\System\\Ram\\Ram.svelte";

    // (70:4) {:else}
    function create_else_block$5(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Fetching Required Info...";
    			attr_dev(p, "class", "text-gray-50");
    			add_location(p, file$c, 70, 8, 3057);
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
    		id: create_else_block$5.name,
    		type: "else",
    		source: "(70:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (65:4) {#if ram}
    function create_if_block$5(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Memory in GB";
    			attr_dev(p, "class", "text-center text-gray-50 text-sm mt-2");
    			add_location(p, file$c, 65, 8, 2538);
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
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(65:4) {#if ram}",
    		ctx
    	});

    	return block;
    }

    // (62:0) <Shell title={"RAM USAGE CHART"} tooltip={"Plots Ram utilization on a doughnut chart"}>
    function create_default_slot$4(ctx) {
    	let div;
    	let canvas;
    	let t;

    	function select_block_type(ctx, dirty) {
    		if (/*ram*/ ctx[0]) return create_if_block$5;
    		return create_else_block$5;
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
    			add_location(canvas, file$c, 63, 8, 2478);
    			attr_dev(div, "class", "w-4/5 md:w-1/2 mx-auto");
    			add_location(div, file$c, 62, 4, 2432);
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
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(62:0) <Shell title={\\\"RAM USAGE CHART\\\"} tooltip={\\\"Plots Ram utilization on a doughnut chart\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "RAM USAGE CHART",
    				tooltip: "Plots Ram utilization on a doughnut chart",
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
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	const { ipcRenderer } = require("electron");

    	// Editing Here
    	let ram, ramChart;

    	onMount(() => {
    		// Get context of canvas for drawing chart
    		//document.getElementById( "ram-doughnut" ).remove();
    		const canvas = document.getElementById("ram-doughnut");

    		const ctx = canvas.getContext("2d");
    		ctx.clearRect(0, 0, canvas.width, canvas.height);
    		ipcRenderer.send("get-ram-info");

    		ipcRenderer.on("get-ram-info", (e, ramInfo) => {
    			$$invalidate(0, ram = ramInfo);

    			// Create chart for RAM monitor
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

    		return () => {
    			console.log("HERE");

    			if (ramChart != null) {
    				//document.getElementById( "ram-doughnut" ).remove();
    				console.log("exec block");

    				ramChart.destroy();
    				console.log("destroyed");
    			} else {
    				console.log("NF");
    			}
    		};
    	});

    	$$self.$capture_state = () => ({
    		ipcRenderer,
    		onMount,
    		Shell,
    		ram,
    		ramChart,
    		require,
    		document,
    		Chart,
    		Number,
    		String,
    		Math,
    		console
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
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ram",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src\Components\System\Graphics\Graphics.svelte generated by Svelte v3.19.1 */
    const file$d = "src\\Components\\System\\Graphics\\Graphics.svelte";

    // (23:4) {:else}
    function create_else_block$6(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Fetching Required Info...";
    			add_location(p, file$d, 23, 8, 934);
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
    		id: create_else_block$6.name,
    		type: "else",
    		source: "(23:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:4) {#if graphics}
    function create_if_block$6(ctx) {
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
    	let t10_value = (/*graphics*/ ctx[0].vram / 1024).toPrecision(3) + "";
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

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text("Model: ");
    			span0 = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text("Vendor: ");
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			p2 = element("p");
    			t6 = text("Bus: ");
    			span2 = element("span");
    			t7 = text(t7_value);
    			t8 = space();
    			p3 = element("p");
    			t9 = text("VRAM: ");
    			span3 = element("span");
    			t10 = text(t10_value);
    			t11 = text(" GB");
    			t12 = space();
    			p4 = element("p");
    			t13 = text("Connection Type: ");
    			span4 = element("span");
    			t14 = text(t14_value);
    			t15 = space();
    			p5 = element("p");
    			t16 = text("Display Model: ");
    			span5 = element("span");
    			t17 = text(t17_value);
    			attr_dev(span0, "class", "font-bold text-lg");
    			add_location(span0, file$d, 14, 18, 447);
    			add_location(p0, file$d, 14, 8, 437);
    			attr_dev(span1, "class", "font-bold text-lg");
    			add_location(span1, file$d, 15, 19, 520);
    			add_location(p1, file$d, 15, 8, 509);
    			attr_dev(span2, "class", "font-bold text-lg");
    			add_location(span2, file$d, 16, 16, 591);
    			add_location(p2, file$d, 16, 8, 583);
    			attr_dev(span3, "class", "font-bold text-lg");
    			add_location(span3, file$d, 17, 17, 660);
    			add_location(p3, file$d, 17, 8, 651);
    			attr_dev(span4, "class", "font-bold text-lg");
    			add_location(span4, file$d, 18, 28, 768);
    			add_location(p4, file$d, 18, 8, 748);
    			attr_dev(span5, "class", "font-bold text-lg");
    			add_location(span5, file$d, 19, 26, 853);
    			add_location(p5, file$d, 19, 8, 835);
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
    			append_dev(span3, t11);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, p4, anchor);
    			append_dev(p4, t13);
    			append_dev(p4, span4);
    			append_dev(span4, t14);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, p5, anchor);
    			append_dev(p5, t16);
    			append_dev(p5, span5);
    			append_dev(span5, t17);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*graphics*/ 1 && t1_value !== (t1_value = /*graphics*/ ctx[0].model + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*graphics*/ 1 && t4_value !== (t4_value = /*graphics*/ ctx[0].vendor + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*graphics*/ 1 && t7_value !== (t7_value = /*graphics*/ ctx[0].bus + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*graphics*/ 1 && t10_value !== (t10_value = (/*graphics*/ ctx[0].vram / 1024).toPrecision(3) + "")) set_data_dev(t10, t10_value);
    			if (dirty & /*graphics*/ 1 && t14_value !== (t14_value = /*graphics*/ ctx[0].connection + "")) set_data_dev(t14, t14_value);
    			if (dirty & /*graphics*/ 1 && t17_value !== (t17_value = /*graphics*/ ctx[0].display + "")) set_data_dev(t17, t17_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(p3);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(p4);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(p5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(14:4) {#if graphics}",
    		ctx
    	});

    	return block;
    }

    // (12:0) <Shell title={"GRAPHIC CARD INFORMATION"} tooltip={"Information about the GPU"}>
    function create_default_slot$5(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*graphics*/ ctx[0]) return create_if_block$6;
    		return create_else_block$6;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "text-gray-50");
    			add_location(div, file$d, 12, 4, 381);
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
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(12:0) <Shell title={\\\"GRAPHIC CARD INFORMATION\\\"} tooltip={\\\"Information about the GPU\\\"}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let current;

    	const shell = new Shell({
    			props: {
    				title: "GRAPHIC CARD INFORMATION",
    				tooltip: "Information about the GPU",
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

    			if (dirty & /*$$scope, graphics*/ 5) {
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
    	let graphics;
    	ipcRenderer.send("get-graphics-info");

    	ipcRenderer.on("get-graphics-info", (e, graphicsInfo) => {
    		$$invalidate(0, graphics = graphicsInfo);
    	});

    	$$self.$capture_state = () => ({ ipcRenderer, Shell, graphics, require });

    	$$self.$inject_state = $$props => {
    		if ("graphics" in $$props) $$invalidate(0, graphics = $$props.graphics);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [graphics];
    }

    class Graphics extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Graphics",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src\Pages\_system.svelte generated by Svelte v3.19.1 */
    const file$e = "src\\Pages\\_system.svelte";

    function create_fragment$f(ctx) {
    	let t0;
    	let main;
    	let div2;
    	let t1;
    	let div1;
    	let div0;
    	let t2;
    	let t3;
    	let t4;
    	let current;
    	const titlebar = new TitleBar({ $$inline: true });
    	const navhorizontal = new NavHorizontal({ $$inline: true });
    	const cpu = new Cpu({ $$inline: true });
    	const osinfo = new OSinfo({ $$inline: true });
    	const ram = new Ram({ $$inline: true });
    	const graphics = new Graphics({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(titlebar.$$.fragment);
    			t0 = space();
    			main = element("main");
    			div2 = element("div");
    			create_component(navhorizontal.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			create_component(cpu.$$.fragment);
    			t2 = space();
    			create_component(osinfo.$$.fragment);
    			t3 = space();
    			create_component(ram.$$.fragment);
    			t4 = space();
    			create_component(graphics.$$.fragment);
    			attr_dev(div0, "class", "grid grid-cols-2 gap-4");
    			add_location(div0, file$e, 15, 12, 734);
    			attr_dev(div1, "class", "container mx-auto");
    			add_location(div1, file$e, 13, 8, 544);
    			attr_dev(div2, "class", "w-screen h-screen bg-gray-900");
    			add_location(div2, file$e, 11, 4, 468);
    			attr_dev(main, "class", "flex flex-row");
    			add_location(main, file$e, 10, 0, 434);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(titlebar, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			mount_component(navhorizontal, div2, null);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			mount_component(cpu, div0, null);
    			append_dev(div0, t2);
    			mount_component(osinfo, div0, null);
    			append_dev(div0, t3);
    			mount_component(ram, div0, null);
    			append_dev(div0, t4);
    			mount_component(graphics, div0, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(titlebar.$$.fragment, local);
    			transition_in(navhorizontal.$$.fragment, local);
    			transition_in(cpu.$$.fragment, local);
    			transition_in(osinfo.$$.fragment, local);
    			transition_in(ram.$$.fragment, local);
    			transition_in(graphics.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(titlebar.$$.fragment, local);
    			transition_out(navhorizontal.$$.fragment, local);
    			transition_out(cpu.$$.fragment, local);
    			transition_out(osinfo.$$.fragment, local);
    			transition_out(ram.$$.fragment, local);
    			transition_out(graphics.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(titlebar, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(navhorizontal);
    			destroy_component(cpu);
    			destroy_component(osinfo);
    			destroy_component(ram);
    			destroy_component(graphics);
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
    	$$self.$capture_state = () => ({
    		NavHorizontal,
    		TitleBar,
    		Cpu,
    		OSinfo,
    		Ram,
    		Graphics
    	});

    	return [];
    }

    class System extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "System",
    			options,
    			id: create_fragment$f.name
    		});
    	}
    }

    /* src\Pages\_settings.svelte generated by Svelte v3.19.1 */
    const file$f = "src\\Pages\\_settings.svelte";

    function create_fragment$g(ctx) {
    	let t0;
    	let main;
    	let div2;
    	let t1;
    	let div1;
    	let div0;
    	let current;
    	const titlebar = new TitleBar({ $$inline: true });
    	const navhorizontal = new NavHorizontal({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(titlebar.$$.fragment);
    			t0 = space();
    			main = element("main");
    			div2 = element("div");
    			create_component(navhorizontal.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "grid grid-cols-2 gap-4");
    			add_location(div0, file$f, 12, 12, 534);
    			attr_dev(div1, "class", "container mx-auto p-2");
    			add_location(div1, file$f, 10, 8, 340);
    			attr_dev(div2, "class", "w-full h-screen bg-gray-900");
    			add_location(div2, file$f, 8, 4, 266);
    			attr_dev(main, "class", "flex flex-row");
    			add_location(main, file$f, 7, 0, 232);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(titlebar, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			append_dev(main, div2);
    			mount_component(navhorizontal, div2, null);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(titlebar.$$.fragment, local);
    			transition_in(navhorizontal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(titlebar.$$.fragment, local);
    			transition_out(navhorizontal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(titlebar, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(navhorizontal);
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
    	$$self.$capture_state = () => ({ NavHorizontal, Shell, TitleBar });
    	return [];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.19.1 */

    function create_fragment$h(ctx) {
    	let current;

    	const router = new Router({
    			props: {
    				routes: {
    					"/": Main,
    					"/network": Network,
    					"/diagnostics": Diagnostics,
    					"/pentesting": Pentesting,
    					"/wifi": Wifi,
    					"/system": System,
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
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	$$self.$capture_state = () => ({
    		Router,
    		Main,
    		Network,
    		Diagnostics,
    		Pentesting,
    		Wifi,
    		System,
    		Settings
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

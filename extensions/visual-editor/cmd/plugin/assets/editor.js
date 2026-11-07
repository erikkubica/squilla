//#region \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), s = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, c = (n, r, a) => (a = n == null ? {} : e(i(n)), s(r || !n || !n.__esModule ? t(a, "default", {
	value: n,
	enumerable: !0
}) : a, n)), l = /* @__PURE__ */ o(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.portal"), r = Symbol.for("react.fragment"), i = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), o = Symbol.for("react.consumer"), s = Symbol.for("react.context"), c = Symbol.for("react.forward_ref"), l = Symbol.for("react.suspense"), u = Symbol.for("react.memo"), d = Symbol.for("react.lazy"), f = Symbol.for("react.activity"), p = Symbol.iterator;
	function m(e) {
		return typeof e != "object" || !e ? null : (e = p && e[p] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var h = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	}, g = Object.assign, _ = {};
	function v(e, t, n) {
		this.props = e, this.context = t, this.refs = _, this.updater = n || h;
	}
	v.prototype.isReactComponent = {}, v.prototype.setState = function(e, t) {
		if (typeof e != "object" && typeof e != "function" && e != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, e, t, "setState");
	}, v.prototype.forceUpdate = function(e) {
		this.updater.enqueueForceUpdate(this, e, "forceUpdate");
	};
	function y() {}
	y.prototype = v.prototype;
	function b(e, t, n) {
		this.props = e, this.context = t, this.refs = _, this.updater = n || h;
	}
	var x = b.prototype = new y();
	x.constructor = b, g(x, v.prototype), x.isPureReactComponent = !0;
	var S = Array.isArray;
	function C() {}
	var w = {
		H: null,
		A: null,
		T: null,
		S: null
	}, ee = Object.prototype.hasOwnProperty;
	function te(e, n, r) {
		var i = r.ref;
		return {
			$$typeof: t,
			type: e,
			key: n,
			ref: i === void 0 ? null : i,
			props: r
		};
	}
	function ne(e, t) {
		return te(e.type, t, e.props);
	}
	function T(e) {
		return typeof e == "object" && !!e && e.$$typeof === t;
	}
	function re(e) {
		var t = {
			"=": "=0",
			":": "=2"
		};
		return "$" + e.replace(/[=:]/g, function(e) {
			return t[e];
		});
	}
	var ie = /\/+/g;
	function ae(e, t) {
		return typeof e == "object" && e && e.key != null ? re("" + e.key) : t.toString(36);
	}
	function oe(e) {
		switch (e.status) {
			case "fulfilled": return e.value;
			case "rejected": throw e.reason;
			default: switch (typeof e.status == "string" ? e.then(C, C) : (e.status = "pending", e.then(function(t) {
				e.status === "pending" && (e.status = "fulfilled", e.value = t);
			}, function(t) {
				e.status === "pending" && (e.status = "rejected", e.reason = t);
			})), e.status) {
				case "fulfilled": return e.value;
				case "rejected": throw e.reason;
			}
		}
		throw e;
	}
	function se(e, r, i, a, o) {
		var s = typeof e;
		(s === "undefined" || s === "boolean") && (e = null);
		var c = !1;
		if (e === null) c = !0;
		else switch (s) {
			case "bigint":
			case "string":
			case "number":
				c = !0;
				break;
			case "object": switch (e.$$typeof) {
				case t:
				case n:
					c = !0;
					break;
				case d: return c = e._init, se(c(e._payload), r, i, a, o);
			}
		}
		if (c) return o = o(e), c = a === "" ? "." + ae(e, 0) : a, S(o) ? (i = "", c != null && (i = c.replace(ie, "$&/") + "/"), se(o, r, i, "", function(e) {
			return e;
		})) : o != null && (T(o) && (o = ne(o, i + (o.key == null || e && e.key === o.key ? "" : ("" + o.key).replace(ie, "$&/") + "/") + c)), r.push(o)), 1;
		c = 0;
		var l = a === "" ? "." : a + ":";
		if (S(e)) for (var u = 0; u < e.length; u++) a = e[u], s = l + ae(a, u), c += se(a, r, i, s, o);
		else if (u = m(e), typeof u == "function") for (e = u.call(e), u = 0; !(a = e.next()).done;) a = a.value, s = l + ae(a, u++), c += se(a, r, i, s, o);
		else if (s === "object") {
			if (typeof e.then == "function") return se(oe(e), r, i, a, o);
			throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		}
		return c;
	}
	function ce(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return se(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function le(e) {
		if (e._status === -1) {
			var t = e._result;
			t = t(), t.then(function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 1, e._result = t);
			}, function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 2, e._result = t);
			}), e._status === -1 && (e._status = 0, e._result = t);
		}
		if (e._status === 1) return e._result.default;
		throw e._result;
	}
	var E = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	}, D = {
		map: ce,
		forEach: function(e, t, n) {
			ce(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return ce(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return ce(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!T(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	};
	e.Activity = f, e.Children = D, e.Component = v, e.Fragment = r, e.Profiler = a, e.PureComponent = b, e.StrictMode = i, e.Suspense = l, e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = w, e.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(e) {
			return w.H.useMemoCache(e);
		}
	}, e.cache = function(e) {
		return function() {
			return e.apply(null, arguments);
		};
	}, e.cacheSignal = function() {
		return null;
	}, e.cloneElement = function(e, t, n) {
		if (e == null) throw Error("The argument must be a React element, but you passed " + e + ".");
		var r = g({}, e.props), i = e.key;
		if (t != null) for (a in t.key !== void 0 && (i = "" + t.key), t) !ee.call(t, a) || a === "key" || a === "__self" || a === "__source" || a === "ref" && t.ref === void 0 || (r[a] = t[a]);
		var a = arguments.length - 2;
		if (a === 1) r.children = n;
		else if (1 < a) {
			for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
			r.children = o;
		}
		return te(e.type, i, r);
	}, e.createContext = function(e) {
		return e = {
			$$typeof: s,
			_currentValue: e,
			_currentValue2: e,
			_threadCount: 0,
			Provider: null,
			Consumer: null
		}, e.Provider = e, e.Consumer = {
			$$typeof: o,
			_context: e
		}, e;
	}, e.createElement = function(e, t, n) {
		var r, i = {}, a = null;
		if (t != null) for (r in t.key !== void 0 && (a = "" + t.key), t) ee.call(t, r) && r !== "key" && r !== "__self" && r !== "__source" && (i[r] = t[r]);
		var o = arguments.length - 2;
		if (o === 1) i.children = n;
		else if (1 < o) {
			for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
			i.children = s;
		}
		if (e && e.defaultProps) for (r in o = e.defaultProps, o) i[r] === void 0 && (i[r] = o[r]);
		return te(e, a, i);
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = T, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: le
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = function(e) {
		var t = w.T, n = {};
		w.T = n;
		try {
			var r = e(), i = w.S;
			i !== null && i(n, r), typeof r == "object" && r && typeof r.then == "function" && r.then(C, E);
		} catch (e) {
			E(e);
		} finally {
			t !== null && n.types !== null && (t.types = n.types), w.T = t;
		}
	}, e.unstable_useCacheRefresh = function() {
		return w.H.useCacheRefresh();
	}, e.use = function(e) {
		return w.H.use(e);
	}, e.useActionState = function(e, t, n) {
		return w.H.useActionState(e, t, n);
	}, e.useCallback = function(e, t) {
		return w.H.useCallback(e, t);
	}, e.useContext = function(e) {
		return w.H.useContext(e);
	}, e.useDebugValue = function() {}, e.useDeferredValue = function(e, t) {
		return w.H.useDeferredValue(e, t);
	}, e.useEffect = function(e, t) {
		return w.H.useEffect(e, t);
	}, e.useEffectEvent = function(e) {
		return w.H.useEffectEvent(e);
	}, e.useId = function() {
		return w.H.useId();
	}, e.useImperativeHandle = function(e, t, n) {
		return w.H.useImperativeHandle(e, t, n);
	}, e.useInsertionEffect = function(e, t) {
		return w.H.useInsertionEffect(e, t);
	}, e.useLayoutEffect = function(e, t) {
		return w.H.useLayoutEffect(e, t);
	}, e.useMemo = function(e, t) {
		return w.H.useMemo(e, t);
	}, e.useOptimistic = function(e, t) {
		return w.H.useOptimistic(e, t);
	}, e.useReducer = function(e, t, n) {
		return w.H.useReducer(e, t, n);
	}, e.useRef = function(e) {
		return w.H.useRef(e);
	}, e.useState = function(e) {
		return w.H.useState(e);
	}, e.useSyncExternalStore = function(e, t, n) {
		return w.H.useSyncExternalStore(e, t, n);
	}, e.useTransition = function() {
		return w.H.useTransition();
	}, e.version = "19.2.5";
})), u = /* @__PURE__ */ o(((e, t) => {
	t.exports = l();
})), d = /* @__PURE__ */ o(((e) => {
	function t(e, t) {
		var n = e.length;
		e.push(t);
		a: for (; 0 < n;) {
			var r = n - 1 >>> 1, a = e[r];
			if (0 < i(a, t)) e[r] = t, e[n] = a, n = r;
			else break a;
		}
	}
	function n(e) {
		return e.length === 0 ? null : e[0];
	}
	function r(e) {
		if (e.length === 0) return null;
		var t = e[0], n = e.pop();
		if (n !== t) {
			e[0] = n;
			a: for (var r = 0, a = e.length, o = a >>> 1; r < o;) {
				var s = 2 * (r + 1) - 1, c = e[s], l = s + 1, u = e[l];
				if (0 > i(c, n)) l < a && 0 > i(u, c) ? (e[r] = u, e[l] = n, r = l) : (e[r] = c, e[s] = n, r = s);
				else if (l < a && 0 > i(u, n)) e[r] = u, e[l] = n, r = l;
				else break a;
			}
		}
		return t;
	}
	function i(e, t) {
		var n = e.sortIndex - t.sortIndex;
		return n === 0 ? e.id - t.id : n;
	}
	if (e.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
		var a = performance;
		e.unstable_now = function() {
			return a.now();
		};
	} else {
		var o = Date, s = o.now();
		e.unstable_now = function() {
			return o.now() - s;
		};
	}
	var c = [], l = [], u = 1, d = null, f = 3, p = !1, m = !1, h = !1, g = !1, _ = typeof setTimeout == "function" ? setTimeout : null, v = typeof clearTimeout == "function" ? clearTimeout : null, y = typeof setImmediate < "u" ? setImmediate : null;
	function b(e) {
		for (var i = n(l); i !== null;) {
			if (i.callback === null) r(l);
			else if (i.startTime <= e) r(l), i.sortIndex = i.expirationTime, t(c, i);
			else break;
			i = n(l);
		}
	}
	function x(e) {
		if (h = !1, b(e), !m) if (n(c) !== null) m = !0, S || (S = !0, T());
		else {
			var t = n(l);
			t !== null && ae(x, t.startTime - e);
		}
	}
	var S = !1, C = -1, w = 5, ee = -1;
	function te() {
		return g ? !0 : !(e.unstable_now() - ee < w);
	}
	function ne() {
		if (g = !1, S) {
			var t = e.unstable_now();
			ee = t;
			var i = !0;
			try {
				a: {
					m = !1, h && (h = !1, v(C), C = -1), p = !0;
					var a = f;
					try {
						b: {
							for (b(t), d = n(c); d !== null && !(d.expirationTime > t && te());) {
								var o = d.callback;
								if (typeof o == "function") {
									d.callback = null, f = d.priorityLevel;
									var s = o(d.expirationTime <= t);
									if (t = e.unstable_now(), typeof s == "function") {
										d.callback = s, b(t), i = !0;
										break b;
									}
									d === n(c) && r(c), b(t);
								} else r(c);
								d = n(c);
							}
							if (d !== null) i = !0;
							else {
								var u = n(l);
								u !== null && ae(x, u.startTime - t), i = !1;
							}
						}
						break a;
					} finally {
						d = null, f = a, p = !1;
					}
					i = void 0;
				}
			} finally {
				i ? T() : S = !1;
			}
		}
	}
	var T;
	if (typeof y == "function") T = function() {
		y(ne);
	};
	else if (typeof MessageChannel < "u") {
		var re = new MessageChannel(), ie = re.port2;
		re.port1.onmessage = ne, T = function() {
			ie.postMessage(null);
		};
	} else T = function() {
		_(ne, 0);
	};
	function ae(t, n) {
		C = _(function() {
			t(e.unstable_now());
		}, n);
	}
	e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(e) {
		e.callback = null;
	}, e.unstable_forceFrameRate = function(e) {
		0 > e || 125 < e ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : w = 0 < e ? Math.floor(1e3 / e) : 5;
	}, e.unstable_getCurrentPriorityLevel = function() {
		return f;
	}, e.unstable_next = function(e) {
		switch (f) {
			case 1:
			case 2:
			case 3:
				var t = 3;
				break;
			default: t = f;
		}
		var n = f;
		f = t;
		try {
			return e();
		} finally {
			f = n;
		}
	}, e.unstable_requestPaint = function() {
		g = !0;
	}, e.unstable_runWithPriority = function(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 3:
			case 4:
			case 5: break;
			default: e = 3;
		}
		var n = f;
		f = e;
		try {
			return t();
		} finally {
			f = n;
		}
	}, e.unstable_scheduleCallback = function(r, i, a) {
		var o = e.unstable_now();
		switch (typeof a == "object" && a ? (a = a.delay, a = typeof a == "number" && 0 < a ? o + a : o) : a = o, r) {
			case 1:
				var s = -1;
				break;
			case 2:
				s = 250;
				break;
			case 5:
				s = 1073741823;
				break;
			case 4:
				s = 1e4;
				break;
			default: s = 5e3;
		}
		return s = a + s, r = {
			id: u++,
			callback: i,
			priorityLevel: r,
			startTime: a,
			expirationTime: s,
			sortIndex: -1
		}, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (v(C), C = -1) : h = !0, ae(x, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, S || (S = !0, T()))), r;
	}, e.unstable_shouldYield = te, e.unstable_wrapCallback = function(e) {
		var t = f;
		return function() {
			var n = f;
			f = t;
			try {
				return e.apply(this, arguments);
			} finally {
				f = n;
			}
		};
	};
})), f = /* @__PURE__ */ o(((e, t) => {
	t.exports = d();
})), p = /* @__PURE__ */ o(((e) => {
	var t = u();
	function n(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function r() {}
	var i = {
		d: {
			f: r,
			r: function() {
				throw Error(n(522));
			},
			D: r,
			C: r,
			L: r,
			m: r,
			X: r,
			S: r,
			M: r
		},
		p: 0,
		findDOMNode: null
	}, a = Symbol.for("react.portal");
	function o(e, t, n) {
		var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
		return {
			$$typeof: a,
			key: r == null ? null : "" + r,
			children: e,
			containerInfo: t,
			implementation: n
		};
	}
	var s = t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
	function c(e, t) {
		if (e === "font") return "";
		if (typeof t == "string") return t === "use-credentials" ? t : "";
	}
	e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = i, e.createPortal = function(e, t) {
		var r = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
		if (!t || t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11) throw Error(n(299));
		return o(e, t, null, r);
	}, e.flushSync = function(e) {
		var t = s.T, n = i.p;
		try {
			if (s.T = null, i.p = 2, e) return e();
		} finally {
			s.T = t, i.p = n, i.d.f();
		}
	}, e.preconnect = function(e, t) {
		typeof e == "string" && (t ? (t = t.crossOrigin, t = typeof t == "string" ? t === "use-credentials" ? t : "" : void 0) : t = null, i.d.C(e, t));
	}, e.prefetchDNS = function(e) {
		typeof e == "string" && i.d.D(e);
	}, e.preinit = function(e, t) {
		if (typeof e == "string" && t && typeof t.as == "string") {
			var n = t.as, r = c(n, t.crossOrigin), a = typeof t.integrity == "string" ? t.integrity : void 0, o = typeof t.fetchPriority == "string" ? t.fetchPriority : void 0;
			n === "style" ? i.d.S(e, typeof t.precedence == "string" ? t.precedence : void 0, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o
			}) : n === "script" && i.d.X(e, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0
			});
		}
	}, e.preinitModule = function(e, t) {
		if (typeof e == "string") if (typeof t == "object" && t) {
			if (t.as == null || t.as === "script") {
				var n = c(t.as, t.crossOrigin);
				i.d.M(e, {
					crossOrigin: n,
					integrity: typeof t.integrity == "string" ? t.integrity : void 0,
					nonce: typeof t.nonce == "string" ? t.nonce : void 0
				});
			}
		} else t ?? i.d.M(e);
	}, e.preload = function(e, t) {
		if (typeof e == "string" && typeof t == "object" && t && typeof t.as == "string") {
			var n = t.as, r = c(n, t.crossOrigin);
			i.d.L(e, n, {
				crossOrigin: r,
				integrity: typeof t.integrity == "string" ? t.integrity : void 0,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0,
				type: typeof t.type == "string" ? t.type : void 0,
				fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0,
				referrerPolicy: typeof t.referrerPolicy == "string" ? t.referrerPolicy : void 0,
				imageSrcSet: typeof t.imageSrcSet == "string" ? t.imageSrcSet : void 0,
				imageSizes: typeof t.imageSizes == "string" ? t.imageSizes : void 0,
				media: typeof t.media == "string" ? t.media : void 0
			});
		}
	}, e.preloadModule = function(e, t) {
		if (typeof e == "string") if (t) {
			var n = c(t.as, t.crossOrigin);
			i.d.m(e, {
				as: typeof t.as == "string" && t.as !== "script" ? t.as : void 0,
				crossOrigin: n,
				integrity: typeof t.integrity == "string" ? t.integrity : void 0
			});
		} else i.d.m(e);
	}, e.requestFormReset = function(e) {
		i.d.r(e);
	}, e.unstable_batchedUpdates = function(e, t) {
		return e(t);
	}, e.useFormState = function(e, t, n) {
		return s.H.useFormState(e, t, n);
	}, e.useFormStatus = function() {
		return s.H.useHostTransitionStatus();
	}, e.version = "19.2.5";
})), m = /* @__PURE__ */ o(((e, t) => {
	function n() {
		if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = p();
})), h = /* @__PURE__ */ o(((e) => {
	var t = f(), n = u(), r = m();
	function i(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function a(e) {
		return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
	}
	function o(e) {
		var t = e, n = e;
		if (e.alternate) for (; t.return;) t = t.return;
		else {
			e = t;
			do
				t = e, t.flags & 4098 && (n = t.return), e = t.return;
			while (e);
		}
		return t.tag === 3 ? n : null;
	}
	function s(e) {
		if (e.tag === 13) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function c(e) {
		if (e.tag === 31) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function l(e) {
		if (o(e) !== e) throw Error(i(188));
	}
	function d(e) {
		var t = e.alternate;
		if (!t) {
			if (t = o(e), t === null) throw Error(i(188));
			return t === e ? e : null;
		}
		for (var n = e, r = t;;) {
			var a = n.return;
			if (a === null) break;
			var s = a.alternate;
			if (s === null) {
				if (r = a.return, r !== null) {
					n = r;
					continue;
				}
				break;
			}
			if (a.child === s.child) {
				for (s = a.child; s;) {
					if (s === n) return l(a), e;
					if (s === r) return l(a), t;
					s = s.sibling;
				}
				throw Error(i(188));
			}
			if (n.return !== r.return) n = a, r = s;
			else {
				for (var c = !1, u = a.child; u;) {
					if (u === n) {
						c = !0, n = a, r = s;
						break;
					}
					if (u === r) {
						c = !0, r = a, n = s;
						break;
					}
					u = u.sibling;
				}
				if (!c) {
					for (u = s.child; u;) {
						if (u === n) {
							c = !0, n = s, r = a;
							break;
						}
						if (u === r) {
							c = !0, r = s, n = a;
							break;
						}
						u = u.sibling;
					}
					if (!c) throw Error(i(189));
				}
			}
			if (n.alternate !== r) throw Error(i(190));
		}
		if (n.tag !== 3) throw Error(i(188));
		return n.stateNode.current === n ? e : t;
	}
	function p(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e;
		for (e = e.child; e !== null;) {
			if (t = p(e), t !== null) return t;
			e = e.sibling;
		}
		return null;
	}
	var h = Object.assign, g = Symbol.for("react.element"), _ = Symbol.for("react.transitional.element"), v = Symbol.for("react.portal"), y = Symbol.for("react.fragment"), b = Symbol.for("react.strict_mode"), x = Symbol.for("react.profiler"), S = Symbol.for("react.consumer"), C = Symbol.for("react.context"), w = Symbol.for("react.forward_ref"), ee = Symbol.for("react.suspense"), te = Symbol.for("react.suspense_list"), ne = Symbol.for("react.memo"), T = Symbol.for("react.lazy"), re = Symbol.for("react.activity"), ie = Symbol.for("react.memo_cache_sentinel"), ae = Symbol.iterator;
	function oe(e) {
		return typeof e != "object" || !e ? null : (e = ae && e[ae] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var se = Symbol.for("react.client.reference");
	function ce(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.$$typeof === se ? null : e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case y: return "Fragment";
			case x: return "Profiler";
			case b: return "StrictMode";
			case ee: return "Suspense";
			case te: return "SuspenseList";
			case re: return "Activity";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case v: return "Portal";
			case C: return e.displayName || "Context";
			case S: return (e._context.displayName || "Context") + ".Consumer";
			case w:
				var t = e.render;
				return e = e.displayName, e || (e = t.displayName || t.name || "", e = e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case ne: return t = e.displayName || null, t === null ? ce(e.type) || "Memo" : t;
			case T:
				t = e._payload, e = e._init;
				try {
					return ce(e(t));
				} catch {}
		}
		return null;
	}
	var le = Array.isArray, E = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, D = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, ue = {
		pending: !1,
		data: null,
		method: null,
		action: null
	}, de = [], fe = -1;
	function O(e) {
		return { current: e };
	}
	function pe(e) {
		0 > fe || (e.current = de[fe], de[fe] = null, fe--);
	}
	function k(e, t) {
		fe++, de[fe] = e.current, e.current = t;
	}
	var me = O(null), A = O(null), j = O(null), he = O(null);
	function ge(e, t) {
		switch (k(j, t), k(A, e), k(me, null), t.nodeType) {
			case 9:
			case 11:
				e = (e = t.documentElement) && (e = e.namespaceURI) ? Kd(e) : 0;
				break;
			default: if (e = t.tagName, t = t.namespaceURI) t = Kd(t), e = qd(t, e);
			else switch (e) {
				case "svg":
					e = 1;
					break;
				case "math":
					e = 2;
					break;
				default: e = 0;
			}
		}
		pe(me), k(me, e);
	}
	function _e() {
		pe(me), pe(A), pe(j);
	}
	function ve(e) {
		e.memoizedState !== null && k(he, e);
		var t = me.current, n = qd(t, e.type);
		t !== n && (k(A, e), k(me, n));
	}
	function ye(e) {
		A.current === e && (pe(me), pe(A)), he.current === e && (pe(he), rp._currentValue = ue);
	}
	var be, xe;
	function Se(e) {
		if (be === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			be = t && t[1] || "", xe = -1 < e.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + be + e + xe;
	}
	var Ce = !1;
	function we(e, t) {
		if (!e || Ce) return "";
		Ce = !0;
		var n = Error.prepareStackTrace;
		Error.prepareStackTrace = void 0;
		try {
			var r = { DetermineComponentFrameRoot: function() {
				try {
					if (t) {
						var n = function() {
							throw Error();
						};
						if (Object.defineProperty(n.prototype, "props", { set: function() {
							throw Error();
						} }), typeof Reflect == "object" && Reflect.construct) {
							try {
								Reflect.construct(n, []);
							} catch (e) {
								var r = e;
							}
							Reflect.construct(e, [], n);
						} else {
							try {
								n.call();
							} catch (e) {
								r = e;
							}
							e.call(n.prototype);
						}
					} else {
						try {
							throw Error();
						} catch (e) {
							r = e;
						}
						(n = e()) && typeof n.catch == "function" && n.catch(function() {});
					}
				} catch (e) {
					if (e && r && typeof e.stack == "string") return [e.stack, r.stack];
				}
				return [null, null];
			} };
			r.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
			var i = Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot, "name");
			i && i.configurable && Object.defineProperty(r.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
			var a = r.DetermineComponentFrameRoot(), o = a[0], s = a[1];
			if (o && s) {
				var c = o.split("\n"), l = s.split("\n");
				for (i = r = 0; r < c.length && !c[r].includes("DetermineComponentFrameRoot");) r++;
				for (; i < l.length && !l[i].includes("DetermineComponentFrameRoot");) i++;
				if (r === c.length || i === l.length) for (r = c.length - 1, i = l.length - 1; 1 <= r && 0 <= i && c[r] !== l[i];) i--;
				for (; 1 <= r && 0 <= i; r--, i--) if (c[r] !== l[i]) {
					if (r !== 1 || i !== 1) do
						if (r--, i--, 0 > i || c[r] !== l[i]) {
							var u = "\n" + c[r].replace(" at new ", " at ");
							return e.displayName && u.includes("<anonymous>") && (u = u.replace("<anonymous>", e.displayName)), u;
						}
					while (1 <= r && 0 <= i);
					break;
				}
			}
		} finally {
			Ce = !1, Error.prepareStackTrace = n;
		}
		return (n = e ? e.displayName || e.name : "") ? Se(n) : "";
	}
	function Te(e, t) {
		switch (e.tag) {
			case 26:
			case 27:
			case 5: return Se(e.type);
			case 16: return Se("Lazy");
			case 13: return e.child !== t && t !== null ? Se("Suspense Fallback") : Se("Suspense");
			case 19: return Se("SuspenseList");
			case 0:
			case 15: return we(e.type, !1);
			case 11: return we(e.type.render, !1);
			case 1: return we(e.type, !0);
			case 31: return Se("Activity");
			default: return "";
		}
	}
	function Ee(e) {
		try {
			var t = "", n = null;
			do
				t += Te(e, n), n = e, e = e.return;
			while (e);
			return t;
		} catch (e) {
			return "\nError generating stack: " + e.message + "\n" + e.stack;
		}
	}
	var De = Object.prototype.hasOwnProperty, Oe = t.unstable_scheduleCallback, ke = t.unstable_cancelCallback, Ae = t.unstable_shouldYield, je = t.unstable_requestPaint, Me = t.unstable_now, Ne = t.unstable_getCurrentPriorityLevel, Pe = t.unstable_ImmediatePriority, Fe = t.unstable_UserBlockingPriority, Ie = t.unstable_NormalPriority, Le = t.unstable_LowPriority, Re = t.unstable_IdlePriority, ze = t.log, Be = t.unstable_setDisableYieldValue, Ve = null, He = null;
	function Ue(e) {
		if (typeof ze == "function" && Be(e), He && typeof He.setStrictMode == "function") try {
			He.setStrictMode(Ve, e);
		} catch {}
	}
	var We = Math.clz32 ? Math.clz32 : qe, Ge = Math.log, Ke = Math.LN2;
	function qe(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (Ge(e) / Ke | 0) | 0;
	}
	var Je = 256, Ye = 262144, Xe = 4194304;
	function Ze(e) {
		var t = e & 42;
		if (t !== 0) return t;
		switch (e & -e) {
			case 1: return 1;
			case 2: return 2;
			case 4: return 4;
			case 8: return 8;
			case 16: return 16;
			case 32: return 32;
			case 64: return 64;
			case 128: return 128;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072: return e & 261888;
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return e & 3932160;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return e & 62914560;
			case 67108864: return 67108864;
			case 134217728: return 134217728;
			case 268435456: return 268435456;
			case 536870912: return 536870912;
			case 1073741824: return 0;
			default: return e;
		}
	}
	function Qe(e, t, n) {
		var r = e.pendingLanes;
		if (r === 0) return 0;
		var i = 0, a = e.suspendedLanes, o = e.pingedLanes;
		e = e.warmLanes;
		var s = r & 134217727;
		return s === 0 ? (s = r & ~a, s === 0 ? o === 0 ? n || (n = r & ~e, n !== 0 && (i = Ze(n))) : i = Ze(o) : i = Ze(s)) : (r = s & ~a, r === 0 ? (o &= s, o === 0 ? n || (n = s & ~e, n !== 0 && (i = Ze(n))) : i = Ze(o)) : i = Ze(r)), i === 0 ? 0 : t !== 0 && t !== i && (t & a) === 0 && (a = i & -i, n = t & -t, a >= n || a === 32 && n & 4194048) ? t : i;
	}
	function $e(e, t) {
		return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
	}
	function et(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 4:
			case 8:
			case 64: return t + 250;
			case 16:
			case 32:
			case 128:
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return t + 5e3;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return -1;
			case 67108864:
			case 134217728:
			case 268435456:
			case 536870912:
			case 1073741824: return -1;
			default: return -1;
		}
	}
	function tt() {
		var e = Xe;
		return Xe <<= 1, !(Xe & 62914560) && (Xe = 4194304), e;
	}
	function nt(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function rt(e, t) {
		e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
	}
	function it(e, t, n, r, i, a) {
		var o = e.pendingLanes;
		e.pendingLanes = n, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= n, e.entangledLanes &= n, e.errorRecoveryDisabledLanes &= n, e.shellSuspendCounter = 0;
		var s = e.entanglements, c = e.expirationTimes, l = e.hiddenUpdates;
		for (n = o & ~n; 0 < n;) {
			var u = 31 - We(n), d = 1 << u;
			s[u] = 0, c[u] = -1;
			var f = l[u];
			if (f !== null) for (l[u] = null, u = 0; u < f.length; u++) {
				var p = f[u];
				p !== null && (p.lane &= -536870913);
			}
			n &= ~d;
		}
		r !== 0 && at(e, r, 0), a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t));
	}
	function at(e, t, n) {
		e.pendingLanes |= t, e.suspendedLanes &= ~t;
		var r = 31 - We(t);
		e.entangledLanes |= t, e.entanglements[r] = e.entanglements[r] | 1073741824 | n & 261930;
	}
	function ot(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - We(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	function st(e, t) {
		var n = t & -t;
		return n = n & 42 ? 1 : ct(n), (n & (e.suspendedLanes | t)) === 0 ? n : 0;
	}
	function ct(e) {
		switch (e) {
			case 2:
				e = 1;
				break;
			case 8:
				e = 4;
				break;
			case 32:
				e = 16;
				break;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152:
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432:
				e = 128;
				break;
			case 268435456:
				e = 134217728;
				break;
			default: e = 0;
		}
		return e;
	}
	function lt(e) {
		return e &= -e, 2 < e ? 8 < e ? e & 134217727 ? 32 : 268435456 : 8 : 2;
	}
	function ut() {
		var e = D.p;
		return e === 0 ? (e = window.event, e === void 0 ? 32 : yp(e.type)) : e;
	}
	function dt(e, t) {
		var n = D.p;
		try {
			return D.p = e, t();
		} finally {
			D.p = n;
		}
	}
	var ft = Math.random().toString(36).slice(2), pt = "__reactFiber$" + ft, mt = "__reactProps$" + ft, ht = "__reactContainer$" + ft, gt = "__reactEvents$" + ft, _t = "__reactListeners$" + ft, vt = "__reactHandles$" + ft, yt = "__reactResources$" + ft, bt = "__reactMarker$" + ft;
	function xt(e) {
		delete e[pt], delete e[mt], delete e[gt], delete e[_t], delete e[vt];
	}
	function St(e) {
		var t = e[pt];
		if (t) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[ht] || n[pt]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = gf(e); e !== null;) {
					if (n = e[pt]) return n;
					e = gf(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function Ct(e) {
		if (e = e[pt] || e[ht]) {
			var t = e.tag;
			if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
		}
		return null;
	}
	function wt(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
		throw Error(i(33));
	}
	function Tt(e) {
		var t = e[yt];
		return t || (t = e[yt] = {
			hoistableStyles: /* @__PURE__ */ new Map(),
			hoistableScripts: /* @__PURE__ */ new Map()
		}), t;
	}
	function Et(e) {
		e[bt] = !0;
	}
	var Dt = /* @__PURE__ */ new Set(), Ot = {};
	function kt(e, t) {
		At(e, t), At(e + "Capture", t);
	}
	function At(e, t) {
		for (Ot[e] = t, e = 0; e < t.length; e++) Dt.add(t[e]);
	}
	var jt = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), Mt = {}, Nt = {};
	function Pt(e) {
		return De.call(Nt, e) ? !0 : De.call(Mt, e) ? !1 : jt.test(e) ? Nt[e] = !0 : (Mt[e] = !0, !1);
	}
	function Ft(e, t, n) {
		if (Pt(t)) if (n === null) e.removeAttribute(t);
		else {
			switch (typeof n) {
				case "undefined":
				case "function":
				case "symbol":
					e.removeAttribute(t);
					return;
				case "boolean":
					var r = t.toLowerCase().slice(0, 5);
					if (r !== "data-" && r !== "aria-") {
						e.removeAttribute(t);
						return;
					}
			}
			e.setAttribute(t, "" + n);
		}
	}
	function It(e, t, n) {
		if (n === null) e.removeAttribute(t);
		else {
			switch (typeof n) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(t);
					return;
			}
			e.setAttribute(t, "" + n);
		}
	}
	function Lt(e, t, n, r) {
		if (r === null) e.removeAttribute(n);
		else {
			switch (typeof r) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(n);
					return;
			}
			e.setAttributeNS(t, n, "" + r);
		}
	}
	function Rt(e) {
		switch (typeof e) {
			case "bigint":
			case "boolean":
			case "number":
			case "string":
			case "undefined": return e;
			case "object": return e;
			default: return "";
		}
	}
	function zt(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function Bt(e, t, n) {
		var r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
		if (!e.hasOwnProperty(t) && r !== void 0 && typeof r.get == "function" && typeof r.set == "function") {
			var i = r.get, a = r.set;
			return Object.defineProperty(e, t, {
				configurable: !0,
				get: function() {
					return i.call(this);
				},
				set: function(e) {
					n = "" + e, a.call(this, e);
				}
			}), Object.defineProperty(e, t, { enumerable: r.enumerable }), {
				getValue: function() {
					return n;
				},
				setValue: function(e) {
					n = "" + e;
				},
				stopTracking: function() {
					e._valueTracker = null, delete e[t];
				}
			};
		}
	}
	function Vt(e) {
		if (!e._valueTracker) {
			var t = zt(e) ? "checked" : "value";
			e._valueTracker = Bt(e, t, "" + e[t]);
		}
	}
	function Ht(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = zt(e) ? e.checked ? "true" : "false" : e.value), e = r, e === n ? !1 : (t.setValue(e), !0);
	}
	function Ut(e) {
		if (e = e || (typeof document < "u" ? document : void 0), e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	var Wt = /[\n"\\]/g;
	function Gt(e) {
		return e.replace(Wt, function(e) {
			return "\\" + e.charCodeAt(0).toString(16) + " ";
		});
	}
	function Kt(e, t, n, r, i, a, o, s) {
		e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t == null ? o !== "submit" && o !== "reset" || e.removeAttribute("value") : o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + Rt(t)) : e.value !== "" + Rt(t) && (e.value = "" + Rt(t)), t == null ? n == null ? r != null && e.removeAttribute("value") : Jt(e, o, Rt(n)) : Jt(e, o, Rt(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" ? e.name = "" + Rt(s) : e.removeAttribute("name");
	}
	function qt(e, t, n, r, i, a, o, s) {
		if (a != null && typeof a != "function" && typeof a != "symbol" && typeof a != "boolean" && (e.type = a), t != null || n != null) {
			if (!(a !== "submit" && a !== "reset" || t != null)) {
				Vt(e);
				return;
			}
			n = n == null ? "" : "" + Rt(n), t = t == null ? n : "" + Rt(t), s || t === e.value || (e.value = t), e.defaultValue = t;
		}
		r = r ?? i, r = typeof r != "function" && typeof r != "symbol" && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o), Vt(e);
	}
	function Jt(e, t, n) {
		t === "number" && Ut(e.ownerDocument) === e || e.defaultValue === "" + n || (e.defaultValue = "" + n);
	}
	function Yt(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + Rt(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function Xt(e, t, n) {
		if (t != null && (t = "" + Rt(t), t !== e.value && (e.value = t), n == null)) {
			e.defaultValue !== t && (e.defaultValue = t);
			return;
		}
		e.defaultValue = n == null ? "" : "" + Rt(n);
	}
	function Zt(e, t, n, r) {
		if (t == null) {
			if (r != null) {
				if (n != null) throw Error(i(92));
				if (le(r)) {
					if (1 < r.length) throw Error(i(93));
					r = r[0];
				}
				n = r;
			}
			n ?? (n = ""), t = n;
		}
		n = Rt(t), e.defaultValue = n, r = e.textContent, r === n && r !== "" && r !== null && (e.value = r), Vt(e);
	}
	function Qt(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var $t = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
	function en(e, t, n) {
		var r = t.indexOf("--") === 0;
		n == null || typeof n == "boolean" || n === "" ? r ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : r ? e.setProperty(t, n) : typeof n != "number" || n === 0 || $t.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px";
	}
	function tn(e, t, n) {
		if (t != null && typeof t != "object") throw Error(i(62));
		if (e = e.style, n != null) {
			for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf("--") === 0 ? e.setProperty(r, "") : r === "float" ? e.cssFloat = "" : e[r] = "");
			for (var a in t) r = t[a], t.hasOwnProperty(a) && n[a] !== r && en(e, a, r);
		} else for (var o in t) t.hasOwnProperty(o) && en(e, o, t[o]);
	}
	function nn(e) {
		if (e.indexOf("-") === -1) return !1;
		switch (e) {
			case "annotation-xml":
			case "color-profile":
			case "font-face":
			case "font-face-src":
			case "font-face-uri":
			case "font-face-format":
			case "font-face-name":
			case "missing-glyph": return !1;
			default: return !0;
		}
	}
	var rn = new Map([
		["acceptCharset", "accept-charset"],
		["htmlFor", "for"],
		["httpEquiv", "http-equiv"],
		["crossOrigin", "crossorigin"],
		["accentHeight", "accent-height"],
		["alignmentBaseline", "alignment-baseline"],
		["arabicForm", "arabic-form"],
		["baselineShift", "baseline-shift"],
		["capHeight", "cap-height"],
		["clipPath", "clip-path"],
		["clipRule", "clip-rule"],
		["colorInterpolation", "color-interpolation"],
		["colorInterpolationFilters", "color-interpolation-filters"],
		["colorProfile", "color-profile"],
		["colorRendering", "color-rendering"],
		["dominantBaseline", "dominant-baseline"],
		["enableBackground", "enable-background"],
		["fillOpacity", "fill-opacity"],
		["fillRule", "fill-rule"],
		["floodColor", "flood-color"],
		["floodOpacity", "flood-opacity"],
		["fontFamily", "font-family"],
		["fontSize", "font-size"],
		["fontSizeAdjust", "font-size-adjust"],
		["fontStretch", "font-stretch"],
		["fontStyle", "font-style"],
		["fontVariant", "font-variant"],
		["fontWeight", "font-weight"],
		["glyphName", "glyph-name"],
		["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
		["glyphOrientationVertical", "glyph-orientation-vertical"],
		["horizAdvX", "horiz-adv-x"],
		["horizOriginX", "horiz-origin-x"],
		["imageRendering", "image-rendering"],
		["letterSpacing", "letter-spacing"],
		["lightingColor", "lighting-color"],
		["markerEnd", "marker-end"],
		["markerMid", "marker-mid"],
		["markerStart", "marker-start"],
		["overlinePosition", "overline-position"],
		["overlineThickness", "overline-thickness"],
		["paintOrder", "paint-order"],
		["panose-1", "panose-1"],
		["pointerEvents", "pointer-events"],
		["renderingIntent", "rendering-intent"],
		["shapeRendering", "shape-rendering"],
		["stopColor", "stop-color"],
		["stopOpacity", "stop-opacity"],
		["strikethroughPosition", "strikethrough-position"],
		["strikethroughThickness", "strikethrough-thickness"],
		["strokeDasharray", "stroke-dasharray"],
		["strokeDashoffset", "stroke-dashoffset"],
		["strokeLinecap", "stroke-linecap"],
		["strokeLinejoin", "stroke-linejoin"],
		["strokeMiterlimit", "stroke-miterlimit"],
		["strokeOpacity", "stroke-opacity"],
		["strokeWidth", "stroke-width"],
		["textAnchor", "text-anchor"],
		["textDecoration", "text-decoration"],
		["textRendering", "text-rendering"],
		["transformOrigin", "transform-origin"],
		["underlinePosition", "underline-position"],
		["underlineThickness", "underline-thickness"],
		["unicodeBidi", "unicode-bidi"],
		["unicodeRange", "unicode-range"],
		["unitsPerEm", "units-per-em"],
		["vAlphabetic", "v-alphabetic"],
		["vHanging", "v-hanging"],
		["vIdeographic", "v-ideographic"],
		["vMathematical", "v-mathematical"],
		["vectorEffect", "vector-effect"],
		["vertAdvY", "vert-adv-y"],
		["vertOriginX", "vert-origin-x"],
		["vertOriginY", "vert-origin-y"],
		["wordSpacing", "word-spacing"],
		["writingMode", "writing-mode"],
		["xmlnsXlink", "xmlns:xlink"],
		["xHeight", "x-height"]
	]), an = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function on(e) {
		return an.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
	}
	function sn() {}
	var M = null;
	function cn(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var ln = null, un = null;
	function dn(e) {
		var t = Ct(e);
		if (t && (e = t.stateNode)) {
			var n = e[mt] || null;
			a: switch (e = t.stateNode, t.type) {
				case "input":
					if (Kt(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === "radio" && t != null) {
						for (n = e; n.parentNode;) n = n.parentNode;
						for (n = n.querySelectorAll("input[name=\"" + Gt("" + t) + "\"][type=\"radio\"]"), t = 0; t < n.length; t++) {
							var r = n[t];
							if (r !== e && r.form === e.form) {
								var a = r[mt] || null;
								if (!a) throw Error(i(90));
								Kt(r, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name);
							}
						}
						for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && Ht(r);
					}
					break a;
				case "textarea":
					Xt(e, n.value, n.defaultValue);
					break a;
				case "select": t = n.value, t != null && Yt(e, !!n.multiple, t, !1);
			}
		}
	}
	var fn = !1;
	function pn(e, t, n) {
		if (fn) return e(t, n);
		fn = !0;
		try {
			return e(t);
		} finally {
			if (fn = !1, (ln !== null || un !== null) && (Tu(), ln && (t = ln, e = un, un = ln = null, dn(t), e))) for (t = 0; t < e.length; t++) dn(e[t]);
		}
	}
	function mn(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var r = n[mt] || null;
		if (r === null) return null;
		n = r[t];
		a: switch (t) {
			case "onClick":
			case "onClickCapture":
			case "onDoubleClick":
			case "onDoubleClickCapture":
			case "onMouseDown":
			case "onMouseDownCapture":
			case "onMouseMove":
			case "onMouseMoveCapture":
			case "onMouseUp":
			case "onMouseUpCapture":
			case "onMouseEnter":
				(r = !r.disabled) || (e = e.type, r = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !r;
				break a;
			default: e = !1;
		}
		if (e) return null;
		if (n && typeof n != "function") throw Error(i(231, t, typeof n));
		return n;
	}
	var hn = !(typeof window > "u" || window.document === void 0 || window.document.createElement === void 0), gn = !1;
	if (hn) try {
		var _n = {};
		Object.defineProperty(_n, "passive", { get: function() {
			gn = !0;
		} }), window.addEventListener("test", _n, _n), window.removeEventListener("test", _n, _n);
	} catch {
		gn = !1;
	}
	var vn = null, yn = null, bn = null;
	function xn() {
		if (bn) return bn;
		var e, t = yn, n = t.length, r, i = "value" in vn ? vn.value : vn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return bn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function Sn(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function Cn() {
		return !0;
	}
	function wn() {
		return !1;
	}
	function Tn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? Cn : wn, this.isPropagationStopped = wn, this;
		}
		return h(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = Cn);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = Cn);
			},
			persist: function() {},
			isPersistent: Cn
		}), t;
	}
	var En = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, Dn = Tn(En), On = h({}, En, {
		view: 0,
		detail: 0
	}), kn = Tn(On), An, jn, Mn, Nn = h({}, On, {
		screenX: 0,
		screenY: 0,
		clientX: 0,
		clientY: 0,
		pageX: 0,
		pageY: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		getModifierState: Wn,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== Mn && (Mn && e.type === "mousemove" ? (An = e.screenX - Mn.screenX, jn = e.screenY - Mn.screenY) : jn = An = 0, Mn = e), An);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : jn;
		}
	}), Pn = Tn(Nn), Fn = Tn(h({}, Nn, { dataTransfer: 0 })), In = Tn(h({}, On, { relatedTarget: 0 })), Ln = Tn(h({}, En, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Rn = Tn(h({}, En, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), zn = Tn(h({}, En, { data: 0 })), Bn = {
		Esc: "Escape",
		Spacebar: " ",
		Left: "ArrowLeft",
		Up: "ArrowUp",
		Right: "ArrowRight",
		Down: "ArrowDown",
		Del: "Delete",
		Win: "OS",
		Menu: "ContextMenu",
		Apps: "ContextMenu",
		Scroll: "ScrollLock",
		MozPrintableKey: "Unidentified"
	}, Vn = {
		8: "Backspace",
		9: "Tab",
		12: "Clear",
		13: "Enter",
		16: "Shift",
		17: "Control",
		18: "Alt",
		19: "Pause",
		20: "CapsLock",
		27: "Escape",
		32: " ",
		33: "PageUp",
		34: "PageDown",
		35: "End",
		36: "Home",
		37: "ArrowLeft",
		38: "ArrowUp",
		39: "ArrowRight",
		40: "ArrowDown",
		45: "Insert",
		46: "Delete",
		112: "F1",
		113: "F2",
		114: "F3",
		115: "F4",
		116: "F5",
		117: "F6",
		118: "F7",
		119: "F8",
		120: "F9",
		121: "F10",
		122: "F11",
		123: "F12",
		144: "NumLock",
		145: "ScrollLock",
		224: "Meta"
	}, Hn = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function Un(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = Hn[e]) ? !!t[e] : !1;
	}
	function Wn() {
		return Un;
	}
	var Gn = Tn(h({}, On, {
		key: function(e) {
			if (e.key) {
				var t = Bn[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = Sn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Vn[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: Wn,
		charCode: function(e) {
			return e.type === "keypress" ? Sn(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? Sn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), Kn = Tn(h({}, Nn, {
		pointerId: 0,
		width: 0,
		height: 0,
		pressure: 0,
		tangentialPressure: 0,
		tiltX: 0,
		tiltY: 0,
		twist: 0,
		pointerType: 0,
		isPrimary: 0
	})), qn = Tn(h({}, On, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: Wn
	})), Jn = Tn(h({}, En, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Yn = Tn(h({}, Nn, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), Xn = Tn(h({}, En, {
		newState: 0,
		oldState: 0
	})), Zn = [
		9,
		13,
		27,
		32
	], Qn = hn && "CompositionEvent" in window, $n = null;
	hn && "documentMode" in document && ($n = document.documentMode);
	var er = hn && "TextEvent" in window && !$n, tr = hn && (!Qn || $n && 8 < $n && 11 >= $n), nr = " ", rr = !1;
	function ir(e, t) {
		switch (e) {
			case "keyup": return Zn.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function ar(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var or = !1;
	function sr(e, t) {
		switch (e) {
			case "compositionend": return ar(t);
			case "keypress": return t.which === 32 ? (rr = !0, nr) : null;
			case "textInput": return e = t.data, e === nr && rr ? null : e;
			default: return null;
		}
	}
	function cr(e, t) {
		if (or) return e === "compositionend" || !Qn && ir(e, t) ? (e = xn(), bn = yn = vn = null, or = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return tr && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var lr = {
		color: !0,
		date: !0,
		datetime: !0,
		"datetime-local": !0,
		email: !0,
		month: !0,
		number: !0,
		password: !0,
		range: !0,
		search: !0,
		tel: !0,
		text: !0,
		time: !0,
		url: !0,
		week: !0
	};
	function ur(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!lr[e.type] : t === "textarea";
	}
	function dr(e, t, n, r) {
		ln ? un ? un.push(r) : un = [r] : ln = r, t = jd(t, "onChange"), 0 < t.length && (n = new Dn("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var fr = null, pr = null;
	function mr(e) {
		wd(e, 0);
	}
	function hr(e) {
		if (Ht(wt(e))) return e;
	}
	function gr(e, t) {
		if (e === "change") return t;
	}
	var _r = !1;
	if (hn) {
		var vr;
		if (hn) {
			var yr = "oninput" in document;
			if (!yr) {
				var br = document.createElement("div");
				br.setAttribute("oninput", "return;"), yr = typeof br.oninput == "function";
			}
			vr = yr;
		} else vr = !1;
		_r = vr && (!document.documentMode || 9 < document.documentMode);
	}
	function xr() {
		fr && (fr.detachEvent("onpropertychange", Sr), pr = fr = null);
	}
	function Sr(e) {
		if (e.propertyName === "value" && hr(pr)) {
			var t = [];
			dr(t, pr, e, cn(e)), pn(mr, t);
		}
	}
	function Cr(e, t, n) {
		e === "focusin" ? (xr(), fr = t, pr = n, fr.attachEvent("onpropertychange", Sr)) : e === "focusout" && xr();
	}
	function wr(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return hr(pr);
	}
	function Tr(e, t) {
		if (e === "click") return hr(t);
	}
	function Er(e, t) {
		if (e === "input" || e === "change") return hr(t);
	}
	function Dr(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var Or = typeof Object.is == "function" ? Object.is : Dr;
	function kr(e, t) {
		if (Or(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!De.call(t, i) || !Or(e[i], t[i])) return !1;
		}
		return !0;
	}
	function Ar(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function jr(e, t) {
		var n = Ar(e);
		e = 0;
		for (var r; n;) {
			if (n.nodeType === 3) {
				if (r = e + n.textContent.length, e <= t && r >= t) return {
					node: n,
					offset: t - e
				};
				e = r;
			}
			a: {
				for (; n;) {
					if (n.nextSibling) {
						n = n.nextSibling;
						break a;
					}
					n = n.parentNode;
				}
				n = void 0;
			}
			n = Ar(n);
		}
	}
	function Mr(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Mr(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function Nr(e) {
		e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
		for (var t = Ut(e.document); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = Ut(e.document);
		}
		return t;
	}
	function Pr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	var Fr = hn && "documentMode" in document && 11 >= document.documentMode, Ir = null, Lr = null, Rr = null, zr = !1;
	function Br(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		zr || Ir == null || Ir !== Ut(r) || (r = Ir, "selectionStart" in r && Pr(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), Rr && kr(Rr, r) || (Rr = r, r = jd(Lr, "onSelect"), 0 < r.length && (t = new Dn("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = Ir)));
	}
	function Vr(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var Hr = {
		animationend: Vr("Animation", "AnimationEnd"),
		animationiteration: Vr("Animation", "AnimationIteration"),
		animationstart: Vr("Animation", "AnimationStart"),
		transitionrun: Vr("Transition", "TransitionRun"),
		transitionstart: Vr("Transition", "TransitionStart"),
		transitioncancel: Vr("Transition", "TransitionCancel"),
		transitionend: Vr("Transition", "TransitionEnd")
	}, Ur = {}, Wr = {};
	hn && (Wr = document.createElement("div").style, "AnimationEvent" in window || (delete Hr.animationend.animation, delete Hr.animationiteration.animation, delete Hr.animationstart.animation), "TransitionEvent" in window || delete Hr.transitionend.transition);
	function Gr(e) {
		if (Ur[e]) return Ur[e];
		if (!Hr[e]) return e;
		var t = Hr[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in Wr) return Ur[e] = t[n];
		return e;
	}
	var Kr = Gr("animationend"), qr = Gr("animationiteration"), Jr = Gr("animationstart"), Yr = Gr("transitionrun"), Xr = Gr("transitionstart"), Zr = Gr("transitioncancel"), Qr = Gr("transitionend"), $r = /* @__PURE__ */ new Map(), ei = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	ei.push("scrollEnd");
	function ti(e, t) {
		$r.set(e, t), kt(t, [e]);
	}
	var ni = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof process == "object" && typeof process.emit == "function") {
			process.emit("uncaughtException", e);
			return;
		}
		console.error(e);
	}, ri = [], ii = 0, ai = 0;
	function oi() {
		for (var e = ii, t = ai = ii = 0; t < e;) {
			var n = ri[t];
			ri[t++] = null;
			var r = ri[t];
			ri[t++] = null;
			var i = ri[t];
			ri[t++] = null;
			var a = ri[t];
			if (ri[t++] = null, r !== null && i !== null) {
				var o = r.pending;
				o === null ? i.next = i : (i.next = o.next, o.next = i), r.pending = i;
			}
			a !== 0 && ui(n, i, a);
		}
	}
	function si(e, t, n, r) {
		ri[ii++] = e, ri[ii++] = t, ri[ii++] = n, ri[ii++] = r, ai |= r, e.lanes |= r, e = e.alternate, e !== null && (e.lanes |= r);
	}
	function ci(e, t, n, r) {
		return si(e, t, n, r), di(e);
	}
	function li(e, t) {
		return si(e, null, null, t), di(e);
	}
	function ui(e, t, n) {
		e.lanes |= n;
		var r = e.alternate;
		r !== null && (r.lanes |= n);
		for (var i = !1, a = e.return; a !== null;) a.childLanes |= n, r = a.alternate, r !== null && (r.childLanes |= n), a.tag === 22 && (e = a.stateNode, e === null || e._visibility & 1 || (i = !0)), e = a, a = a.return;
		return e.tag === 3 ? (a = e.stateNode, i && t !== null && (i = 31 - We(n), e = a.hiddenUpdates, r = e[i], r === null ? e[i] = [t] : r.push(t), t.lane = n | 536870912), a) : null;
	}
	function di(e) {
		if (50 < gu) throw gu = 0, _u = null, Error(i(185));
		for (var t = e.return; t !== null;) e = t, t = e.return;
		return e.tag === 3 ? e.stateNode : null;
	}
	var fi = {};
	function pi(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function mi(e, t, n, r) {
		return new pi(e, t, n, r);
	}
	function hi(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function N(e, t) {
		var n = e.alternate;
		return n === null ? (n = mi(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 65011712, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n.refCleanup = e.refCleanup, n;
	}
	function gi(e, t) {
		e.flags &= 65011714;
		var n = e.alternate;
		return n === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = n.childLanes, e.lanes = n.lanes, e.child = n.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = n.memoizedProps, e.memoizedState = n.memoizedState, e.updateQueue = n.updateQueue, e.type = n.type, t = n.dependencies, e.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}), e;
	}
	function P(e, t, n, r, a, o) {
		var s = 0;
		if (r = e, typeof e == "function") hi(e) && (s = 1);
		else if (typeof e == "string") s = Jf(e, n, me.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
		else a: switch (e) {
			case re: return e = mi(31, n, t, a), e.elementType = re, e.lanes = o, e;
			case y: return _i(n.children, a, o, t);
			case b:
				s = 8, a |= 24;
				break;
			case x: return e = mi(12, n, t, a | 2), e.elementType = x, e.lanes = o, e;
			case ee: return e = mi(13, n, t, a), e.elementType = ee, e.lanes = o, e;
			case te: return e = mi(19, n, t, a), e.elementType = te, e.lanes = o, e;
			default:
				if (typeof e == "object" && e) switch (e.$$typeof) {
					case C:
						s = 10;
						break a;
					case S:
						s = 9;
						break a;
					case w:
						s = 11;
						break a;
					case ne:
						s = 14;
						break a;
					case T:
						s = 16, r = null;
						break a;
				}
				s = 29, n = Error(i(130, e === null ? "null" : typeof e, "")), r = null;
		}
		return t = mi(s, n, t, a), t.elementType = e, t.type = r, t.lanes = o, t;
	}
	function _i(e, t, n, r) {
		return e = mi(7, e, r, t), e.lanes = n, e;
	}
	function vi(e, t, n) {
		return e = mi(6, e, null, t), e.lanes = n, e;
	}
	function yi(e) {
		var t = mi(18, null, null, 0);
		return t.stateNode = e, t;
	}
	function bi(e, t, n) {
		return t = mi(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
			containerInfo: e.containerInfo,
			pendingChildren: null,
			implementation: e.implementation
		}, t;
	}
	var xi = /* @__PURE__ */ new WeakMap();
	function Si(e, t) {
		if (typeof e == "object" && e) {
			var n = xi.get(e);
			return n === void 0 ? (t = {
				value: e,
				source: t,
				stack: Ee(t)
			}, xi.set(e, t), t) : n;
		}
		return {
			value: e,
			source: t,
			stack: Ee(t)
		};
	}
	var Ci = [], wi = 0, Ti = null, Ei = 0, Di = [], Oi = 0, ki = null, Ai = 1, ji = "";
	function Mi(e, t) {
		Ci[wi++] = Ei, Ci[wi++] = Ti, Ti = e, Ei = t;
	}
	function Ni(e, t, n) {
		Di[Oi++] = Ai, Di[Oi++] = ji, Di[Oi++] = ki, ki = e;
		var r = Ai;
		e = ji;
		var i = 32 - We(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - We(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, Ai = 1 << 32 - We(t) + i | n << i | r, ji = a + e;
		} else Ai = 1 << a | n << i | r, ji = e;
	}
	function Pi(e) {
		e.return !== null && (Mi(e, 1), Ni(e, 1, 0));
	}
	function Fi(e) {
		for (; e === Ti;) Ti = Ci[--wi], Ci[wi] = null, Ei = Ci[--wi], Ci[wi] = null;
		for (; e === ki;) ki = Di[--Oi], Di[Oi] = null, ji = Di[--Oi], Di[Oi] = null, Ai = Di[--Oi], Di[Oi] = null;
	}
	function Ii(e, t) {
		Di[Oi++] = Ai, Di[Oi++] = ji, Di[Oi++] = ki, Ai = t.id, ji = t.overflow, ki = e;
	}
	var Li = null, Ri = null, F = !1, zi = null, Bi = !1, Vi = Error(i(519));
	function Hi(e) {
		throw Ji(Si(Error(i(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), Vi;
	}
	function Ui(e) {
		var t = e.stateNode, n = e.type, r = e.memoizedProps;
		switch (t[pt] = e, t[mt] = r, n) {
			case "dialog":
				J("cancel", t), J("close", t);
				break;
			case "iframe":
			case "object":
			case "embed":
				J("load", t);
				break;
			case "video":
			case "audio":
				for (n = 0; n < Sd.length; n++) J(Sd[n], t);
				break;
			case "source":
				J("error", t);
				break;
			case "img":
			case "image":
			case "link":
				J("error", t), J("load", t);
				break;
			case "details":
				J("toggle", t);
				break;
			case "input":
				J("invalid", t), qt(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0);
				break;
			case "select":
				J("invalid", t);
				break;
			case "textarea": J("invalid", t), Zt(t, r.value, r.defaultValue, r.children);
		}
		n = r.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || !0 === r.suppressHydrationWarning || Ld(t.textContent, n) ? (r.popover != null && (J("beforetoggle", t), J("toggle", t)), r.onScroll != null && J("scroll", t), r.onScrollEnd != null && J("scrollend", t), r.onClick != null && (t.onclick = sn), t = !0) : t = !1, t || Hi(e, !0);
	}
	function Wi(e) {
		for (Li = e.return; Li;) switch (Li.tag) {
			case 5:
			case 31:
			case 13:
				Bi = !1;
				return;
			case 27:
			case 3:
				Bi = !0;
				return;
			default: Li = Li.return;
		}
	}
	function Gi(e) {
		if (e !== Li) return !1;
		if (!F) return Wi(e), F = !0, !1;
		var t = e.tag, n;
		if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type, n = !(n !== "form" && n !== "button") || Jd(e.type, e.memoizedProps)), n = !n), n && Ri && Hi(e), Wi(e), t === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			Ri = hf(e);
		} else if (t === 31) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			Ri = hf(e);
		} else t === 27 ? (t = Ri, nf(e.type) ? (e = mf, mf = null, Ri = e) : Ri = t) : Ri = Li ? pf(e.stateNode.nextSibling) : null;
		return !0;
	}
	function Ki() {
		Ri = Li = null, F = !1;
	}
	function qi() {
		var e = zi;
		return e !== null && (nu === null ? nu = e : nu.push.apply(nu, e), zi = null), e;
	}
	function Ji(e) {
		zi === null ? zi = [e] : zi.push(e);
	}
	var Yi = O(null), Xi = null, Zi = null;
	function Qi(e, t, n) {
		k(Yi, t._currentValue), t._currentValue = n;
	}
	function $i(e) {
		e._currentValue = Yi.current, pe(Yi);
	}
	function ea(e, t, n) {
		for (; e !== null;) {
			var r = e.alternate;
			if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
			e = e.return;
		}
	}
	function ta(e, t, n, r) {
		var a = e.child;
		for (a !== null && (a.return = e); a !== null;) {
			var o = a.dependencies;
			if (o !== null) {
				var s = a.child;
				o = o.firstContext;
				a: for (; o !== null;) {
					var c = o;
					o = a;
					for (var l = 0; l < t.length; l++) if (c.context === t[l]) {
						o.lanes |= n, c = o.alternate, c !== null && (c.lanes |= n), ea(o.return, n, e), r || (s = null);
						break a;
					}
					o = c.next;
				}
			} else if (a.tag === 18) {
				if (s = a.return, s === null) throw Error(i(341));
				s.lanes |= n, o = s.alternate, o !== null && (o.lanes |= n), ea(s, n, e), s = null;
			} else s = a.child;
			if (s !== null) s.return = a;
			else for (s = a; s !== null;) {
				if (s === e) {
					s = null;
					break;
				}
				if (a = s.sibling, a !== null) {
					a.return = s.return, s = a;
					break;
				}
				s = s.return;
			}
			a = s;
		}
	}
	function na(e, t, n, r) {
		e = null;
		for (var a = t, o = !1; a !== null;) {
			if (!o) {
				if (a.flags & 524288) o = !0;
				else if (a.flags & 262144) break;
			}
			if (a.tag === 10) {
				var s = a.alternate;
				if (s === null) throw Error(i(387));
				if (s = s.memoizedProps, s !== null) {
					var c = a.type;
					Or(a.pendingProps.value, s.value) || (e === null ? e = [c] : e.push(c));
				}
			} else if (a === he.current) {
				if (s = a.alternate, s === null) throw Error(i(387));
				s.memoizedState.memoizedState !== a.memoizedState.memoizedState && (e === null ? e = [rp] : e.push(rp));
			}
			a = a.return;
		}
		e !== null && ta(t, e, n, r), t.flags |= 262144;
	}
	function ra(e) {
		for (e = e.firstContext; e !== null;) {
			if (!Or(e.context._currentValue, e.memoizedValue)) return !0;
			e = e.next;
		}
		return !1;
	}
	function ia(e) {
		Xi = e, Zi = null, e = e.dependencies, e !== null && (e.firstContext = null);
	}
	function aa(e) {
		return sa(Xi, e);
	}
	function oa(e, t) {
		return Xi === null && ia(e), sa(e, t);
	}
	function sa(e, t) {
		var n = t._currentValue;
		if (t = {
			context: t,
			memoizedValue: n,
			next: null
		}, Zi === null) {
			if (e === null) throw Error(i(308));
			Zi = t, e.dependencies = {
				lanes: 0,
				firstContext: t
			}, e.flags |= 524288;
		} else Zi = Zi.next = t;
		return n;
	}
	var ca = typeof AbortController < "u" ? AbortController : function() {
		var e = [], t = this.signal = {
			aborted: !1,
			addEventListener: function(t, n) {
				e.push(n);
			}
		};
		this.abort = function() {
			t.aborted = !0, e.forEach(function(e) {
				return e();
			});
		};
	}, la = t.unstable_scheduleCallback, ua = t.unstable_NormalPriority, da = {
		$$typeof: C,
		Consumer: null,
		Provider: null,
		_currentValue: null,
		_currentValue2: null,
		_threadCount: 0
	};
	function fa() {
		return {
			controller: new ca(),
			data: /* @__PURE__ */ new Map(),
			refCount: 0
		};
	}
	function pa(e) {
		e.refCount--, e.refCount === 0 && la(ua, function() {
			e.controller.abort();
		});
	}
	var ma = null, ha = 0, ga = 0, _a = null;
	function va(e, t) {
		if (ma === null) {
			var n = ma = [];
			ha = 0, ga = gd(), _a = {
				status: "pending",
				value: void 0,
				then: function(e) {
					n.push(e);
				}
			};
		}
		return ha++, t.then(ya, ya), t;
	}
	function ya() {
		if (--ha === 0 && ma !== null) {
			_a !== null && (_a.status = "fulfilled");
			var e = ma;
			ma = null, ga = 0, _a = null;
			for (var t = 0; t < e.length; t++) (0, e[t])();
		}
	}
	function ba(e, t) {
		var n = [], r = {
			status: "pending",
			value: null,
			reason: null,
			then: function(e) {
				n.push(e);
			}
		};
		return e.then(function() {
			r.status = "fulfilled", r.value = t;
			for (var e = 0; e < n.length; e++) (0, n[e])(t);
		}, function(e) {
			for (r.status = "rejected", r.reason = e, e = 0; e < n.length; e++) (0, n[e])(void 0);
		}), r;
	}
	var xa = E.S;
	E.S = function(e, t) {
		au = Me(), typeof t == "object" && t && typeof t.then == "function" && va(e, t), xa !== null && xa(e, t);
	};
	var Sa = O(null);
	function Ca() {
		var e = Sa.current;
		return e === null ? Ul.pooledCache : e;
	}
	function wa(e, t) {
		t === null ? k(Sa, Sa.current) : k(Sa, t.pool);
	}
	function Ta() {
		var e = Ca();
		return e === null ? null : {
			parent: da._currentValue,
			pool: e
		};
	}
	var Ea = Error(i(460)), Da = Error(i(474)), Oa = Error(i(542)), ka = { then: function() {} };
	function Aa(e) {
		return e = e.status, e === "fulfilled" || e === "rejected";
	}
	function ja(e, t, n) {
		switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then(sn, sn), t = n), t.status) {
			case "fulfilled": return t.value;
			case "rejected": throw e = t.reason, Fa(e), e;
			default:
				if (typeof t.status == "string") t.then(sn, sn);
				else {
					if (e = Ul, e !== null && 100 < e.shellSuspendCounter) throw Error(i(482));
					e = t, e.status = "pending", e.then(function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "fulfilled", n.value = e;
						}
					}, function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "rejected", n.reason = e;
						}
					});
				}
				switch (t.status) {
					case "fulfilled": return t.value;
					case "rejected": throw e = t.reason, Fa(e), e;
				}
				throw Na = t, Ea;
		}
	}
	function Ma(e) {
		try {
			var t = e._init;
			return t(e._payload);
		} catch (e) {
			throw typeof e == "object" && e && typeof e.then == "function" ? (Na = e, Ea) : e;
		}
	}
	var Na = null;
	function Pa() {
		if (Na === null) throw Error(i(459));
		var e = Na;
		return Na = null, e;
	}
	function Fa(e) {
		if (e === Ea || e === Oa) throw Error(i(483));
	}
	var Ia = null, La = 0;
	function Ra(e) {
		var t = La;
		return La += 1, Ia === null && (Ia = []), ja(Ia, e, t);
	}
	function za(e, t) {
		t = t.props.ref, e.ref = t === void 0 ? null : t;
	}
	function Ba(e, t) {
		throw t.$$typeof === g ? Error(i(525)) : (e = Object.prototype.toString.call(t), Error(i(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
	}
	function Va(e) {
		function t(t, n) {
			if (e) {
				var r = t.deletions;
				r === null ? (t.deletions = [n], t.flags |= 16) : r.push(n);
			}
		}
		function n(n, r) {
			if (!e) return null;
			for (; r !== null;) t(n, r), r = r.sibling;
			return null;
		}
		function r(e) {
			for (var t = /* @__PURE__ */ new Map(); e !== null;) e.key === null ? t.set(e.index, e) : t.set(e.key, e), e = e.sibling;
			return t;
		}
		function a(e, t) {
			return e = N(e, t), e.index = 0, e.sibling = null, e;
		}
		function o(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 67108866, n) : (r = r.index, r < n ? (t.flags |= 67108866, n) : r)) : (t.flags |= 1048576, n);
		}
		function s(t) {
			return e && t.alternate === null && (t.flags |= 67108866), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = vi(n, e.mode, r), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var i = n.type;
			return i === y ? d(e, t, n.props.children, r, n.key) : t !== null && (t.elementType === i || typeof i == "object" && i && i.$$typeof === T && Ma(i) === t.type) ? (t = a(t, n.props), za(t, n), t.return = e, t) : (t = P(n.type, n.key, n.props, null, e.mode, r), za(t, n), t.return = e, t);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = bi(n, e.mode, r), t.return = e, t) : (t = a(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, i) {
			return t === null || t.tag !== 7 ? (t = _i(n, e.mode, r, i), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number" || typeof t == "bigint") return t = vi("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case _: return n = P(t.type, t.key, t.props, null, e.mode, n), za(n, t), n.return = e, n;
					case v: return t = bi(t, e.mode, n), t.return = e, t;
					case T: return t = Ma(t), f(e, t, n);
				}
				if (le(t) || oe(t)) return t = _i(t, e.mode, n, null), t.return = e, t;
				if (typeof t.then == "function") return f(e, Ra(t), n);
				if (t.$$typeof === C) return f(e, oa(e, t), n);
				Ba(e, t);
			}
			return null;
		}
		function p(e, t, n, r) {
			var i = t === null ? null : t.key;
			if (typeof n == "string" && n !== "" || typeof n == "number" || typeof n == "bigint") return i === null ? c(e, t, "" + n, r) : null;
			if (typeof n == "object" && n) {
				switch (n.$$typeof) {
					case _: return n.key === i ? l(e, t, n, r) : null;
					case v: return n.key === i ? u(e, t, n, r) : null;
					case T: return n = Ma(n), p(e, t, n, r);
				}
				if (le(n) || oe(n)) return i === null ? d(e, t, n, r, null) : null;
				if (typeof n.then == "function") return p(e, t, Ra(n), r);
				if (n.$$typeof === C) return p(e, t, oa(e, n), r);
				Ba(e, n);
			}
			return null;
		}
		function m(e, t, n, r, i) {
			if (typeof r == "string" && r !== "" || typeof r == "number" || typeof r == "bigint") return e = e.get(n) || null, c(t, e, "" + r, i);
			if (typeof r == "object" && r) {
				switch (r.$$typeof) {
					case _: return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
					case v: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
					case T: return r = Ma(r), m(e, t, n, r, i);
				}
				if (le(r) || oe(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				if (typeof r.then == "function") return m(e, t, n, Ra(r), i);
				if (r.$$typeof === C) return m(e, t, n, oa(t, r), i);
				Ba(t, r);
			}
			return null;
		}
		function h(i, a, s, c) {
			for (var l = null, u = null, d = a, h = a = 0, g = null; d !== null && h < s.length; h++) {
				d.index > h ? (g = d, d = null) : g = d.sibling;
				var _ = p(i, d, s[h], c);
				if (_ === null) {
					d === null && (d = g);
					break;
				}
				e && d && _.alternate === null && t(i, d), a = o(_, a, h), u === null ? l = _ : u.sibling = _, u = _, d = g;
			}
			if (h === s.length) return n(i, d), F && Mi(i, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (a = o(d, a, h), u === null ? l = d : u.sibling = d, u = d);
				return F && Mi(i, h), l;
			}
			for (d = r(d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && g.alternate !== null && d.delete(g.key === null ? h : g.key), a = o(g, a, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), F && Mi(i, h), l;
		}
		function g(a, s, c, l) {
			if (c == null) throw Error(i(151));
			for (var u = null, d = null, h = s, g = s = 0, _ = null, v = c.next(); h !== null && !v.done; g++, v = c.next()) {
				h.index > g ? (_ = h, h = null) : _ = h.sibling;
				var y = p(a, h, v.value, l);
				if (y === null) {
					h === null && (h = _);
					break;
				}
				e && h && y.alternate === null && t(a, h), s = o(y, s, g), d === null ? u = y : d.sibling = y, d = y, h = _;
			}
			if (v.done) return n(a, h), F && Mi(a, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(a, v.value, l), v !== null && (s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
				return F && Mi(a, g), u;
			}
			for (h = r(h); !v.done; g++, v = c.next()) v = m(h, a, g, v.value, l), v !== null && (e && v.alternate !== null && h.delete(v.key === null ? g : v.key), s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(a, e);
			}), F && Mi(a, g), u;
		}
		function b(e, r, o, c) {
			if (typeof o == "object" && o && o.type === y && o.key === null && (o = o.props.children), typeof o == "object" && o) {
				switch (o.$$typeof) {
					case _:
						a: {
							for (var l = o.key; r !== null;) {
								if (r.key === l) {
									if (l = o.type, l === y) {
										if (r.tag === 7) {
											n(e, r.sibling), c = a(r, o.props.children), c.return = e, e = c;
											break a;
										}
									} else if (r.elementType === l || typeof l == "object" && l && l.$$typeof === T && Ma(l) === r.type) {
										n(e, r.sibling), c = a(r, o.props), za(c, o), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								} else t(e, r);
								r = r.sibling;
							}
							o.type === y ? (c = _i(o.props.children, e.mode, c, o.key), c.return = e, e = c) : (c = P(o.type, o.key, o.props, null, e.mode, c), za(c, o), c.return = e, e = c);
						}
						return s(e);
					case v:
						a: {
							for (l = o.key; r !== null;) {
								if (r.key === l) if (r.tag === 4 && r.stateNode.containerInfo === o.containerInfo && r.stateNode.implementation === o.implementation) {
									n(e, r.sibling), c = a(r, o.children || []), c.return = e, e = c;
									break a;
								} else {
									n(e, r);
									break;
								}
								else t(e, r);
								r = r.sibling;
							}
							c = bi(o, e.mode, c), c.return = e, e = c;
						}
						return s(e);
					case T: return o = Ma(o), b(e, r, o, c);
				}
				if (le(o)) return h(e, r, o, c);
				if (oe(o)) {
					if (l = oe(o), typeof l != "function") throw Error(i(150));
					return o = l.call(o), g(e, r, o, c);
				}
				if (typeof o.then == "function") return b(e, r, Ra(o), c);
				if (o.$$typeof === C) return b(e, r, oa(e, o), c);
				Ba(e, o);
			}
			return typeof o == "string" && o !== "" || typeof o == "number" || typeof o == "bigint" ? (o = "" + o, r !== null && r.tag === 6 ? (n(e, r.sibling), c = a(r, o), c.return = e, e = c) : (n(e, r), c = vi(o, e.mode, c), c.return = e, e = c), s(e)) : n(e, r);
		}
		return function(e, t, n, r) {
			try {
				La = 0;
				var i = b(e, t, n, r);
				return Ia = null, i;
			} catch (t) {
				if (t === Ea || t === Oa) throw t;
				var a = mi(29, t, null, e.mode);
				return a.lanes = r, a.return = e, a;
			}
		};
	}
	var Ha = Va(!0), I = Va(!1), Ua = !1;
	function Wa(e) {
		e.updateQueue = {
			baseState: e.memoizedState,
			firstBaseUpdate: null,
			lastBaseUpdate: null,
			shared: {
				pending: null,
				lanes: 0,
				hiddenCallbacks: null
			},
			callbacks: null
		};
	}
	function Ga(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			callbacks: null
		});
	}
	function L(e) {
		return {
			lane: e,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function Ka(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, U & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = di(e), ui(e, null, n), t;
		}
		return si(e, r, t, n), di(e);
	}
	function R(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194048)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, ot(e, n);
		}
	}
	function qa(e, t) {
		var n = e.updateQueue, r = e.alternate;
		if (r !== null && (r = r.updateQueue, n === r)) {
			var i = null, a = null;
			if (n = n.firstBaseUpdate, n !== null) {
				do {
					var o = {
						lane: n.lane,
						tag: n.tag,
						payload: n.payload,
						callback: null,
						next: null
					};
					a === null ? i = a = o : a = a.next = o, n = n.next;
				} while (n !== null);
				a === null ? i = a = t : a = a.next = t;
			} else i = a = t;
			n = {
				baseState: r.baseState,
				firstBaseUpdate: i,
				lastBaseUpdate: a,
				shared: r.shared,
				callbacks: r.callbacks
			}, e.updateQueue = n;
			return;
		}
		e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
	}
	var Ja = !1;
	function Ya() {
		if (Ja) {
			var e = _a;
			if (e !== null) throw e;
		}
	}
	function Xa(e, t, n, r) {
		Ja = !1;
		var i = e.updateQueue;
		Ua = !1;
		var a = i.firstBaseUpdate, o = i.lastBaseUpdate, s = i.shared.pending;
		if (s !== null) {
			i.shared.pending = null;
			var c = s, l = c.next;
			c.next = null, o === null ? a = l : o.next = l, o = c;
			var u = e.alternate;
			u !== null && (u = u.updateQueue, s = u.lastBaseUpdate, s !== o && (s === null ? u.firstBaseUpdate = l : s.next = l, u.lastBaseUpdate = c));
		}
		if (a !== null) {
			var d = i.baseState;
			o = 0, u = l = c = null, s = a;
			do {
				var f = s.lane & -536870913, p = f !== s.lane;
				if (p ? (G & f) === f : (r & f) === f) {
					f !== 0 && f === ga && (Ja = !0), u !== null && (u = u.next = {
						lane: 0,
						tag: s.tag,
						payload: s.payload,
						callback: null,
						next: null
					});
					a: {
						var m = e, g = s;
						f = t;
						var _ = n;
						switch (g.tag) {
							case 1:
								if (m = g.payload, typeof m == "function") {
									d = m.call(_, d, f);
									break a;
								}
								d = m;
								break a;
							case 3: m.flags = m.flags & -65537 | 128;
							case 0:
								if (m = g.payload, f = typeof m == "function" ? m.call(_, d, f) : m, f == null) break a;
								d = h({}, d, f);
								break a;
							case 2: Ua = !0;
						}
					}
					f = s.callback, f !== null && (e.flags |= 64, p && (e.flags |= 8192), p = i.callbacks, p === null ? i.callbacks = [f] : p.push(f));
				} else p = {
					lane: f,
					tag: s.tag,
					payload: s.payload,
					callback: s.callback,
					next: null
				}, u === null ? (l = u = p, c = d) : u = u.next = p, o |= f;
				if (s = s.next, s === null) {
					if (s = i.shared.pending, s === null) break;
					p = s, s = p.next, p.next = null, i.lastBaseUpdate = p, i.shared.pending = null;
				}
			} while (1);
			u === null && (c = d), i.baseState = c, i.firstBaseUpdate = l, i.lastBaseUpdate = u, a === null && (i.shared.lanes = 0), Xl |= o, e.lanes = o, e.memoizedState = d;
		}
	}
	function Za(e, t) {
		if (typeof e != "function") throw Error(i(191, e));
		e.call(t);
	}
	function Qa(e, t) {
		var n = e.callbacks;
		if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) Za(n[e], t);
	}
	var $a = O(null), eo = O(0);
	function to(e, t) {
		e = Jl, k(eo, e), k($a, t), Jl = e | t.baseLanes;
	}
	function no() {
		k(eo, Jl), k($a, $a.current);
	}
	function ro() {
		Jl = eo.current, pe($a), pe(eo);
	}
	var io = O(null), ao = null;
	function oo(e) {
		var t = e.alternate;
		k(fo, fo.current & 1), k(io, e), ao === null && (t === null || $a.current !== null || t.memoizedState !== null) && (ao = e);
	}
	function so(e) {
		k(fo, fo.current), k(io, e), ao === null && (ao = e);
	}
	function co(e) {
		e.tag === 22 ? (k(fo, fo.current), k(io, e), ao === null && (ao = e)) : lo(e);
	}
	function lo() {
		k(fo, fo.current), k(io, io.current);
	}
	function uo(e) {
		pe(io), ao === e && (ao = null), pe(fo);
	}
	var fo = O(0);
	function po(e) {
		for (var t = e; t !== null;) {
			if (t.tag === 13) {
				var n = t.memoizedState;
				if (n !== null && (n = n.dehydrated, n === null || uf(n) || df(n))) return t;
			} else if (t.tag === 19 && (t.memoizedProps.revealOrder === "forwards" || t.memoizedProps.revealOrder === "backwards" || t.memoizedProps.revealOrder === "unstable_legacy-backwards" || t.memoizedProps.revealOrder === "together")) {
				if (t.flags & 128) return t;
			} else if (t.child !== null) {
				t.child.return = t, t = t.child;
				continue;
			}
			if (t === e) break;
			for (; t.sibling === null;) {
				if (t.return === null || t.return === e) return null;
				t = t.return;
			}
			t.sibling.return = t.return, t = t.sibling;
		}
		return null;
	}
	var mo = 0, z = null, ho = null, go = null, _o = !1, vo = !1, yo = !1, bo = 0, xo = 0, So = null, Co = 0;
	function wo() {
		throw Error(i(321));
	}
	function To(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!Or(e[n], t[n])) return !1;
		return !0;
	}
	function Eo(e, t, n, r, i, a) {
		return mo = a, z = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, E.H = e === null || e.memoizedState === null ? Ws : Gs, yo = !1, a = n(r, i), yo = !1, vo && (a = Oo(t, n, r, i)), Do(e), a;
	}
	function Do(e) {
		E.H = Us;
		var t = ho !== null && ho.next !== null;
		if (mo = 0, go = ho = z = null, _o = !1, xo = 0, So = null, t) throw Error(i(300));
		e === null || cc || (e = e.dependencies, e !== null && ra(e) && (cc = !0));
	}
	function Oo(e, t, n, r) {
		z = e;
		var a = 0;
		do {
			if (vo && (So = null), xo = 0, vo = !1, 25 <= a) throw Error(i(301));
			if (a += 1, go = ho = null, e.updateQueue != null) {
				var o = e.updateQueue;
				o.lastEffect = null, o.events = null, o.stores = null, o.memoCache != null && (o.memoCache.index = 0);
			}
			E.H = Ks, o = t(n, r);
		} while (vo);
		return o;
	}
	function ko() {
		var e = E.H, t = e.useState()[0];
		return t = typeof t.then == "function" ? Io(t) : t, e = e.useState()[0], (ho === null ? null : ho.memoizedState) !== e && (z.flags |= 1024), t;
	}
	function Ao() {
		var e = bo !== 0;
		return bo = 0, e;
	}
	function jo(e, t, n) {
		t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~n;
	}
	function Mo(e) {
		if (_o) {
			for (e = e.memoizedState; e !== null;) {
				var t = e.queue;
				t !== null && (t.pending = null), e = e.next;
			}
			_o = !1;
		}
		mo = 0, go = ho = z = null, vo = !1, xo = bo = 0, So = null;
	}
	function No() {
		var e = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		return go === null ? z.memoizedState = go = e : go = go.next = e, go;
	}
	function Po() {
		if (ho === null) {
			var e = z.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = ho.next;
		var t = go === null ? z.memoizedState : go.next;
		if (t !== null) go = t, ho = e;
		else {
			if (e === null) throw z.alternate === null ? Error(i(467)) : Error(i(310));
			ho = e, e = {
				memoizedState: ho.memoizedState,
				baseState: ho.baseState,
				baseQueue: ho.baseQueue,
				queue: ho.queue,
				next: null
			}, go === null ? z.memoizedState = go = e : go = go.next = e;
		}
		return go;
	}
	function Fo() {
		return {
			lastEffect: null,
			events: null,
			stores: null,
			memoCache: null
		};
	}
	function Io(e) {
		var t = xo;
		return xo += 1, So === null && (So = []), e = ja(So, e, t), t = z, (go === null ? t.memoizedState : go.next) === null && (t = t.alternate, E.H = t === null || t.memoizedState === null ? Ws : Gs), e;
	}
	function Lo(e) {
		if (typeof e == "object" && e) {
			if (typeof e.then == "function") return Io(e);
			if (e.$$typeof === C) return aa(e);
		}
		throw Error(i(438, String(e)));
	}
	function Ro(e) {
		var t = null, n = z.updateQueue;
		if (n !== null && (t = n.memoCache), t == null) {
			var r = z.alternate;
			r !== null && (r = r.updateQueue, r !== null && (r = r.memoCache, r != null && (t = {
				data: r.data.map(function(e) {
					return e.slice();
				}),
				index: 0
			})));
		}
		if (t ?? (t = {
			data: [],
			index: 0
		}), n === null && (n = Fo(), z.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0) for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = ie;
		return t.index++, n;
	}
	function zo(e, t) {
		return typeof t == "function" ? t(e) : t;
	}
	function Bo(e) {
		return Vo(Po(), ho, e);
	}
	function Vo(e, t, n) {
		var r = e.queue;
		if (r === null) throw Error(i(311));
		r.lastRenderedReducer = n;
		var a = e.baseQueue, o = r.pending;
		if (o !== null) {
			if (a !== null) {
				var s = a.next;
				a.next = o.next, o.next = s;
			}
			t.baseQueue = a = o, r.pending = null;
		}
		if (o = e.baseState, a === null) e.memoizedState = o;
		else {
			t = a.next;
			var c = s = null, l = null, u = t, d = !1;
			do {
				var f = u.lane & -536870913;
				if (f === u.lane ? (mo & f) === f : (G & f) === f) {
					var p = u.revertLane;
					if (p === 0) l !== null && (l = l.next = {
						lane: 0,
						revertLane: 0,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}), f === ga && (d = !0);
					else if ((mo & p) === p) {
						u = u.next, p === ga && (d = !0);
						continue;
					} else f = {
						lane: 0,
						revertLane: u.revertLane,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}, l === null ? (c = l = f, s = o) : l = l.next = f, z.lanes |= p, Xl |= p;
					f = u.action, yo && n(o, f), o = u.hasEagerState ? u.eagerState : n(o, f);
				} else p = {
					lane: f,
					revertLane: u.revertLane,
					gesture: u.gesture,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null
				}, l === null ? (c = l = p, s = o) : l = l.next = p, z.lanes |= f, Xl |= f;
				u = u.next;
			} while (u !== null && u !== t);
			if (l === null ? s = o : l.next = c, !Or(o, e.memoizedState) && (cc = !0, d && (n = _a, n !== null))) throw n;
			e.memoizedState = o, e.baseState = s, e.baseQueue = l, r.lastRenderedState = o;
		}
		return a === null && (r.lanes = 0), [e.memoizedState, r.dispatch];
	}
	function Ho(e) {
		var t = Po(), n = t.queue;
		if (n === null) throw Error(i(311));
		n.lastRenderedReducer = e;
		var r = n.dispatch, a = n.pending, o = t.memoizedState;
		if (a !== null) {
			n.pending = null;
			var s = a = a.next;
			do
				o = e(o, s.action), s = s.next;
			while (s !== a);
			Or(o, t.memoizedState) || (cc = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, r];
	}
	function Uo(e, t, n) {
		var r = z, a = Po(), o = F;
		if (o) {
			if (n === void 0) throw Error(i(407));
			n = n();
		} else n = t();
		var s = !Or((ho || a).memoizedState, n);
		if (s && (a.memoizedState = n, cc = !0), a = a.queue, hs(Ko.bind(null, r, a, e), [e]), a.getSnapshot !== t || s || go !== null && go.memoizedState.tag & 1) {
			if (r.flags |= 2048, us(9, { destroy: void 0 }, Go.bind(null, r, a, n, t), null), Ul === null) throw Error(i(349));
			o || mo & 127 || Wo(r, t, n);
		}
		return n;
	}
	function Wo(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = z.updateQueue, t === null ? (t = Fo(), z.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
	}
	function Go(e, t, n, r) {
		t.value = n, t.getSnapshot = r, qo(t) && Jo(e);
	}
	function Ko(e, t, n) {
		return n(function() {
			qo(t) && Jo(e);
		});
	}
	function qo(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !Or(e, n);
		} catch {
			return !0;
		}
	}
	function Jo(e) {
		var t = li(e, 2);
		t !== null && bu(t, e, 2);
	}
	function Yo(e) {
		var t = No();
		if (typeof e == "function") {
			var n = e;
			if (e = n(), yo) {
				Ue(!0);
				try {
					n();
				} finally {
					Ue(!1);
				}
			}
		}
		return t.memoizedState = t.baseState = e, t.queue = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: zo,
			lastRenderedState: e
		}, t;
	}
	function Xo(e, t, n, r) {
		return e.baseState = n, Vo(e, ho, typeof r == "function" ? r : zo);
	}
	function Zo(e, t, n, r, a) {
		if (Bs(e)) throw Error(i(485));
		if (e = t.action, e !== null) {
			var o = {
				payload: a,
				action: e,
				next: null,
				isTransition: !0,
				status: "pending",
				value: null,
				reason: null,
				listeners: [],
				then: function(e) {
					o.listeners.push(e);
				}
			};
			E.T === null ? o.isTransition = !1 : n(!0), r(o), n = t.pending, n === null ? (o.next = t.pending = o, Qo(t, o)) : (o.next = n.next, t.pending = n.next = o);
		}
	}
	function Qo(e, t) {
		var n = t.action, r = t.payload, i = e.state;
		if (t.isTransition) {
			var a = E.T, o = {};
			E.T = o;
			try {
				var s = n(i, r), c = E.S;
				c !== null && c(o, s), $o(e, t, s);
			} catch (n) {
				ts(e, t, n);
			} finally {
				a !== null && o.types !== null && (a.types = o.types), E.T = a;
			}
		} else try {
			a = n(i, r), $o(e, t, a);
		} catch (n) {
			ts(e, t, n);
		}
	}
	function $o(e, t, n) {
		typeof n == "object" && n && typeof n.then == "function" ? n.then(function(n) {
			es(e, t, n);
		}, function(n) {
			return ts(e, t, n);
		}) : es(e, t, n);
	}
	function es(e, t, n) {
		t.status = "fulfilled", t.value = n, ns(t), e.state = n, t = e.pending, t !== null && (n = t.next, n === t ? e.pending = null : (n = n.next, t.next = n, Qo(e, n)));
	}
	function ts(e, t, n) {
		var r = e.pending;
		if (e.pending = null, r !== null) {
			r = r.next;
			do
				t.status = "rejected", t.reason = n, ns(t), t = t.next;
			while (t !== r);
		}
		e.action = null;
	}
	function ns(e) {
		e = e.listeners;
		for (var t = 0; t < e.length; t++) (0, e[t])();
	}
	function rs(e, t) {
		return t;
	}
	function is(e, t) {
		if (F) {
			var n = Ul.formState;
			if (n !== null) {
				a: {
					var r = z;
					if (F) {
						if (Ri) {
							b: {
								for (var i = Ri, a = Bi; i.nodeType !== 8;) {
									if (!a) {
										i = null;
										break b;
									}
									if (i = pf(i.nextSibling), i === null) {
										i = null;
										break b;
									}
								}
								a = i.data, i = a === "F!" || a === "F" ? i : null;
							}
							if (i) {
								Ri = pf(i.nextSibling), r = i.data === "F!";
								break a;
							}
						}
						Hi(r);
					}
					r = !1;
				}
				r && (t = n[0]);
			}
		}
		return n = No(), n.memoizedState = n.baseState = t, r = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: rs,
			lastRenderedState: t
		}, n.queue = r, n = Ls.bind(null, z, r), r.dispatch = n, r = Yo(!1), a = zs.bind(null, z, !1, r.queue), r = No(), i = {
			state: t,
			dispatch: null,
			action: e,
			pending: null
		}, r.queue = i, n = Zo.bind(null, z, i, a, n), i.dispatch = n, r.memoizedState = e, [
			t,
			n,
			!1
		];
	}
	function as(e) {
		return ss(Po(), ho, e);
	}
	function ss(e, t, n) {
		if (t = Vo(e, t, rs)[0], e = Bo(zo)[0], typeof t == "object" && t && typeof t.then == "function") try {
			var r = Io(t);
		} catch (e) {
			throw e === Ea ? Oa : e;
		}
		else r = t;
		t = Po();
		var i = t.queue, a = i.dispatch;
		return n !== t.memoizedState && (z.flags |= 2048, us(9, { destroy: void 0 }, cs.bind(null, i, n), null)), [
			r,
			a,
			e
		];
	}
	function cs(e, t) {
		e.action = t;
	}
	function ls(e) {
		var t = Po(), n = ho;
		if (n !== null) return ss(t, n, e);
		Po(), t = t.memoizedState, n = Po();
		var r = n.queue.dispatch;
		return n.memoizedState = e, [
			t,
			r,
			!1
		];
	}
	function us(e, t, n, r) {
		return e = {
			tag: e,
			create: n,
			deps: r,
			inst: t,
			next: null
		}, t = z.updateQueue, t === null && (t = Fo(), z.updateQueue = t), n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
	}
	function ds() {
		return Po().memoizedState;
	}
	function fs(e, t, n, r) {
		var i = No();
		z.flags |= e, i.memoizedState = us(1 | t, { destroy: void 0 }, n, r === void 0 ? null : r);
	}
	function ps(e, t, n, r) {
		var i = Po();
		r = r === void 0 ? null : r;
		var a = i.memoizedState.inst;
		ho !== null && r !== null && To(r, ho.memoizedState.deps) ? i.memoizedState = us(t, a, n, r) : (z.flags |= e, i.memoizedState = us(1 | t, a, n, r));
	}
	function ms(e, t) {
		fs(8390656, 8, e, t);
	}
	function hs(e, t) {
		ps(2048, 8, e, t);
	}
	function gs(e) {
		z.flags |= 4;
		var t = z.updateQueue;
		if (t === null) t = Fo(), z.updateQueue = t, t.events = [e];
		else {
			var n = t.events;
			n === null ? t.events = [e] : n.push(e);
		}
	}
	function _s(e) {
		var t = Po().memoizedState;
		return gs({
			ref: t,
			nextImpl: e
		}), function() {
			if (U & 2) throw Error(i(440));
			return t.impl.apply(void 0, arguments);
		};
	}
	function vs(e, t) {
		return ps(4, 2, e, t);
	}
	function ys(e, t) {
		return ps(4, 4, e, t);
	}
	function bs(e, t) {
		if (typeof t == "function") {
			e = e();
			var n = t(e);
			return function() {
				typeof n == "function" ? n() : t(null);
			};
		}
		if (t != null) return e = e(), t.current = e, function() {
			t.current = null;
		};
	}
	function xs(e, t, n) {
		n = n == null ? null : n.concat([e]), ps(4, 4, bs.bind(null, t, e), n);
	}
	function Ss() {}
	function Cs(e, t) {
		var n = Po();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return t !== null && To(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
	}
	function ws(e, t) {
		var n = Po();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		if (t !== null && To(t, r[1])) return r[0];
		if (r = e(), yo) {
			Ue(!0);
			try {
				e();
			} finally {
				Ue(!1);
			}
		}
		return n.memoizedState = [r, t], r;
	}
	function Ts(e, t, n) {
		return n === void 0 || mo & 1073741824 && !(G & 261930) ? e.memoizedState = t : (e.memoizedState = n, e = yu(), z.lanes |= e, Xl |= e, n);
	}
	function Es(e, t, n, r) {
		return Or(n, t) ? n : $a.current === null ? !(mo & 42) || mo & 1073741824 && !(G & 261930) ? (cc = !0, e.memoizedState = n) : (e = yu(), z.lanes |= e, Xl |= e, t) : (e = Ts(e, n, r), Or(e, t) || (cc = !0), e);
	}
	function Ds(e, t, n, r, i) {
		var a = D.p;
		D.p = a !== 0 && 8 > a ? a : 8;
		var o = E.T, s = {};
		E.T = s, zs(e, !1, t, n);
		try {
			var c = i(), l = E.S;
			l !== null && l(s, c), typeof c == "object" && c && typeof c.then == "function" ? Rs(e, t, ba(c, r), vu(e)) : Rs(e, t, r, vu(e));
		} catch (n) {
			Rs(e, t, {
				then: function() {},
				status: "rejected",
				reason: n
			}, vu());
		} finally {
			D.p = a, o !== null && s.types !== null && (o.types = s.types), E.T = o;
		}
	}
	function Os() {}
	function ks(e, t, n, r) {
		if (e.tag !== 5) throw Error(i(476));
		var a = As(e).queue;
		Ds(e, a, t, ue, n === null ? Os : function() {
			return js(e), n(r);
		});
	}
	function As(e) {
		var t = e.memoizedState;
		if (t !== null) return t;
		t = {
			memoizedState: ue,
			baseState: ue,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: zo,
				lastRenderedState: ue
			},
			next: null
		};
		var n = {};
		return t.next = {
			memoizedState: n,
			baseState: n,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: zo,
				lastRenderedState: n
			},
			next: null
		}, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
	}
	function js(e) {
		var t = As(e);
		t.next === null && (t = e.alternate.memoizedState), Rs(e, t.next.queue, {}, vu());
	}
	function Ms() {
		return aa(rp);
	}
	function Ns() {
		return Po().memoizedState;
	}
	function Ps() {
		return Po().memoizedState;
	}
	function Fs(e) {
		for (var t = e.return; t !== null;) {
			switch (t.tag) {
				case 24:
				case 3:
					var n = vu();
					e = L(n);
					var r = Ka(t, e, n);
					r !== null && (bu(r, t, n), R(r, t, n)), t = { cache: fa() }, e.payload = t;
					return;
			}
			t = t.return;
		}
	}
	function Is(e, t, n) {
		var r = vu();
		n = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, Bs(e) ? Vs(t, n) : (n = ci(e, t, n, r), n !== null && (bu(n, e, r), Hs(n, t, r)));
	}
	function Ls(e, t, n) {
		Rs(e, t, n, vu());
	}
	function Rs(e, t, n, r) {
		var i = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (Bs(e)) Vs(t, i);
		else {
			var a = e.alternate;
			if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
				var o = t.lastRenderedState, s = a(o, n);
				if (i.hasEagerState = !0, i.eagerState = s, Or(s, o)) return si(e, t, i, 0), Ul === null && oi(), !1;
			} catch {}
			if (n = ci(e, t, i, r), n !== null) return bu(n, e, r), Hs(n, t, r), !0;
		}
		return !1;
	}
	function zs(e, t, n, r) {
		if (r = {
			lane: 2,
			revertLane: gd(),
			gesture: null,
			action: r,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, Bs(e)) {
			if (t) throw Error(i(479));
		} else t = ci(e, n, r, 2), t !== null && bu(t, e, 2);
	}
	function Bs(e) {
		var t = e.alternate;
		return e === z || t !== null && t === z;
	}
	function Vs(e, t) {
		vo = _o = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function Hs(e, t, n) {
		if (n & 4194048) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, ot(e, n);
		}
	}
	var Us = {
		readContext: aa,
		use: Lo,
		useCallback: wo,
		useContext: wo,
		useEffect: wo,
		useImperativeHandle: wo,
		useLayoutEffect: wo,
		useInsertionEffect: wo,
		useMemo: wo,
		useReducer: wo,
		useRef: wo,
		useState: wo,
		useDebugValue: wo,
		useDeferredValue: wo,
		useTransition: wo,
		useSyncExternalStore: wo,
		useId: wo,
		useHostTransitionStatus: wo,
		useFormState: wo,
		useActionState: wo,
		useOptimistic: wo,
		useMemoCache: wo,
		useCacheRefresh: wo
	};
	Us.useEffectEvent = wo;
	var Ws = {
		readContext: aa,
		use: Lo,
		useCallback: function(e, t) {
			return No().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: aa,
		useEffect: ms,
		useImperativeHandle: function(e, t, n) {
			n = n == null ? null : n.concat([e]), fs(4194308, 4, bs.bind(null, t, e), n);
		},
		useLayoutEffect: function(e, t) {
			return fs(4194308, 4, e, t);
		},
		useInsertionEffect: function(e, t) {
			fs(4, 2, e, t);
		},
		useMemo: function(e, t) {
			var n = No();
			t = t === void 0 ? null : t;
			var r = e();
			if (yo) {
				Ue(!0);
				try {
					e();
				} finally {
					Ue(!1);
				}
			}
			return n.memoizedState = [r, t], r;
		},
		useReducer: function(e, t, n) {
			var r = No();
			if (n !== void 0) {
				var i = n(t);
				if (yo) {
					Ue(!0);
					try {
						n(t);
					} finally {
						Ue(!1);
					}
				}
			} else i = t;
			return r.memoizedState = r.baseState = i, e = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: e,
				lastRenderedState: i
			}, r.queue = e, e = e.dispatch = Is.bind(null, z, e), [r.memoizedState, e];
		},
		useRef: function(e) {
			var t = No();
			return e = { current: e }, t.memoizedState = e;
		},
		useState: function(e) {
			e = Yo(e);
			var t = e.queue, n = Ls.bind(null, z, t);
			return t.dispatch = n, [e.memoizedState, n];
		},
		useDebugValue: Ss,
		useDeferredValue: function(e, t) {
			return Ts(No(), e, t);
		},
		useTransition: function() {
			var e = Yo(!1);
			return e = Ds.bind(null, z, e.queue, !0, !1), No().memoizedState = e, [!1, e];
		},
		useSyncExternalStore: function(e, t, n) {
			var r = z, a = No();
			if (F) {
				if (n === void 0) throw Error(i(407));
				n = n();
			} else {
				if (n = t(), Ul === null) throw Error(i(349));
				G & 127 || Wo(r, t, n);
			}
			a.memoizedState = n;
			var o = {
				value: n,
				getSnapshot: t
			};
			return a.queue = o, ms(Ko.bind(null, r, o, e), [e]), r.flags |= 2048, us(9, { destroy: void 0 }, Go.bind(null, r, o, n, t), null), n;
		},
		useId: function() {
			var e = No(), t = Ul.identifierPrefix;
			if (F) {
				var n = ji, r = Ai;
				n = (r & ~(1 << 32 - We(r) - 1)).toString(32) + n, t = "_" + t + "R_" + n, n = bo++, 0 < n && (t += "H" + n.toString(32)), t += "_";
			} else n = Co++, t = "_" + t + "r_" + n.toString(32) + "_";
			return e.memoizedState = t;
		},
		useHostTransitionStatus: Ms,
		useFormState: is,
		useActionState: is,
		useOptimistic: function(e) {
			var t = No();
			t.memoizedState = t.baseState = e;
			var n = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: null,
				lastRenderedState: null
			};
			return t.queue = n, t = zs.bind(null, z, !0, n), n.dispatch = t, [e, t];
		},
		useMemoCache: Ro,
		useCacheRefresh: function() {
			return No().memoizedState = Fs.bind(null, z);
		},
		useEffectEvent: function(e) {
			var t = No(), n = { impl: e };
			return t.memoizedState = n, function() {
				if (U & 2) throw Error(i(440));
				return n.impl.apply(void 0, arguments);
			};
		}
	}, Gs = {
		readContext: aa,
		use: Lo,
		useCallback: Cs,
		useContext: aa,
		useEffect: hs,
		useImperativeHandle: xs,
		useInsertionEffect: vs,
		useLayoutEffect: ys,
		useMemo: ws,
		useReducer: Bo,
		useRef: ds,
		useState: function() {
			return Bo(zo);
		},
		useDebugValue: Ss,
		useDeferredValue: function(e, t) {
			return Es(Po(), ho.memoizedState, e, t);
		},
		useTransition: function() {
			var e = Bo(zo)[0], t = Po().memoizedState;
			return [typeof e == "boolean" ? e : Io(e), t];
		},
		useSyncExternalStore: Uo,
		useId: Ns,
		useHostTransitionStatus: Ms,
		useFormState: as,
		useActionState: as,
		useOptimistic: function(e, t) {
			return Xo(Po(), ho, e, t);
		},
		useMemoCache: Ro,
		useCacheRefresh: Ps
	};
	Gs.useEffectEvent = _s;
	var Ks = {
		readContext: aa,
		use: Lo,
		useCallback: Cs,
		useContext: aa,
		useEffect: hs,
		useImperativeHandle: xs,
		useInsertionEffect: vs,
		useLayoutEffect: ys,
		useMemo: ws,
		useReducer: Ho,
		useRef: ds,
		useState: function() {
			return Ho(zo);
		},
		useDebugValue: Ss,
		useDeferredValue: function(e, t) {
			var n = Po();
			return ho === null ? Ts(n, e, t) : Es(n, ho.memoizedState, e, t);
		},
		useTransition: function() {
			var e = Ho(zo)[0], t = Po().memoizedState;
			return [typeof e == "boolean" ? e : Io(e), t];
		},
		useSyncExternalStore: Uo,
		useId: Ns,
		useHostTransitionStatus: Ms,
		useFormState: ls,
		useActionState: ls,
		useOptimistic: function(e, t) {
			var n = Po();
			return ho === null ? (n.baseState = e, [e, n.queue.dispatch]) : Xo(n, ho, e, t);
		},
		useMemoCache: Ro,
		useCacheRefresh: Ps
	};
	Ks.useEffectEvent = _s;
	function qs(e, t, n, r) {
		t = e.memoizedState, n = n(r, t), n = n == null ? t : h({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
	}
	var Js = {
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = vu(), i = L(r);
			i.payload = t, n != null && (i.callback = n), t = Ka(e, i, r), t !== null && (bu(t, e, r), R(t, e, r));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = vu(), i = L(r);
			i.tag = 1, i.payload = t, n != null && (i.callback = n), t = Ka(e, i, r), t !== null && (bu(t, e, r), R(t, e, r));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = vu(), r = L(n);
			r.tag = 2, t != null && (r.callback = t), t = Ka(e, r, n), t !== null && (bu(t, e, n), R(t, e, n));
		}
	};
	function Ys(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !kr(n, r) || !kr(i, a) : !0;
	}
	function Xs(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && Js.enqueueReplaceState(t, t.state, null);
	}
	function Zs(e, t) {
		var n = t;
		if ("ref" in t) for (var r in n = {}, t) r !== "ref" && (n[r] = t[r]);
		if (e = e.defaultProps) for (var i in n === t && (n = h({}, n)), e) n[i] === void 0 && (n[i] = e[i]);
		return n;
	}
	function Qs(e) {
		ni(e);
	}
	function $s(e) {
		console.error(e);
	}
	function ec(e) {
		ni(e);
	}
	function tc(e, t) {
		try {
			var n = e.onUncaughtError;
			n(t.value, { componentStack: t.stack });
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function nc(e, t, n) {
		try {
			var r = e.onCaughtError;
			r(n.value, {
				componentStack: n.stack,
				errorBoundary: t.tag === 1 ? t.stateNode : null
			});
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function rc(e, t, n) {
		return n = L(n), n.tag = 3, n.payload = { element: null }, n.callback = function() {
			tc(e, t);
		}, n;
	}
	function ic(e) {
		return e = L(e), e.tag = 3, e;
	}
	function ac(e, t, n, r) {
		var i = n.type.getDerivedStateFromError;
		if (typeof i == "function") {
			var a = r.value;
			e.payload = function() {
				return i(a);
			}, e.callback = function() {
				nc(t, n, r);
			};
		}
		var o = n.stateNode;
		o !== null && typeof o.componentDidCatch == "function" && (e.callback = function() {
			nc(t, n, r), typeof i != "function" && (cu === null ? cu = new Set([this]) : cu.add(this));
			var e = r.stack;
			this.componentDidCatch(r.value, { componentStack: e === null ? "" : e });
		});
	}
	function oc(e, t, n, r, a) {
		if (n.flags |= 32768, typeof r == "object" && r && typeof r.then == "function") {
			if (t = n.alternate, t !== null && na(t, n, a, !0), n = io.current, n !== null) {
				switch (n.tag) {
					case 31:
					case 13: return ao === null ? Mu() : n.alternate === null && Yl === 0 && (Yl = 3), n.flags &= -257, n.flags |= 65536, n.lanes = a, r === ka ? n.flags |= 16384 : (t = n.updateQueue, t === null ? n.updateQueue = new Set([r]) : t.add(r), Xu(e, r, a)), !1;
					case 22: return n.flags |= 65536, r === ka ? n.flags |= 16384 : (t = n.updateQueue, t === null ? (t = {
						transitions: null,
						markerInstances: null,
						retryQueue: new Set([r])
					}, n.updateQueue = t) : (n = t.retryQueue, n === null ? t.retryQueue = new Set([r]) : n.add(r)), Xu(e, r, a)), !1;
				}
				throw Error(i(435, n.tag));
			}
			return Xu(e, r, a), Mu(), !1;
		}
		if (F) return t = io.current, t === null ? (r !== Vi && (t = Error(i(423), { cause: r }), Ji(Si(t, n))), e = e.current.alternate, e.flags |= 65536, a &= -a, e.lanes |= a, r = Si(r, n), a = rc(e.stateNode, r, a), qa(e, a), Yl !== 4 && (Yl = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = a, r !== Vi && (e = Error(i(422), { cause: r }), Ji(Si(e, n)))), !1;
		var o = Error(i(520), { cause: r });
		if (o = Si(o, n), tu === null ? tu = [o] : tu.push(o), Yl !== 4 && (Yl = 2), t === null) return !0;
		r = Si(r, n), n = t;
		do {
			switch (n.tag) {
				case 3: return n.flags |= 65536, e = a & -a, n.lanes |= e, e = rc(n.stateNode, r, e), qa(n, e), !1;
				case 1: if (t = n.type, o = n.stateNode, !(n.flags & 128) && (typeof t.getDerivedStateFromError == "function" || o !== null && typeof o.componentDidCatch == "function" && (cu === null || !cu.has(o)))) return n.flags |= 65536, a &= -a, n.lanes |= a, a = ic(a), ac(a, e, n, r), qa(n, a), !1;
			}
			n = n.return;
		} while (n !== null);
		return !1;
	}
	var sc = Error(i(461)), cc = !1;
	function lc(e, t, n, r) {
		t.child = e === null ? I(t, null, n, r) : Ha(t, e.child, n, r);
	}
	function uc(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		if ("ref" in r) {
			var o = {};
			for (var s in r) s !== "ref" && (o[s] = r[s]);
		} else o = r;
		return ia(t), r = Eo(e, t, n, o, a, i), s = Ao(), e !== null && !cc ? (jo(e, t, i), jc(e, t, i)) : (F && s && Pi(t), t.flags |= 1, lc(e, t, r, i), t.child);
	}
	function dc(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !hi(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, fc(e, t, a, r, i)) : (e = P(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, !Mc(e, i)) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? kr : n, n(o, r) && e.ref === t.ref) return jc(e, t, i);
		}
		return t.flags |= 1, e = N(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function fc(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (kr(a, r) && e.ref === t.ref) if (cc = !1, t.pendingProps = r = a, Mc(e, i)) e.flags & 131072 && (cc = !0);
			else return t.lanes = e.lanes, jc(e, t, i);
		}
		return bc(e, t, n, r, i);
	}
	function pc(e, t, n, r) {
		var i = r.children, a = e === null ? null : e.memoizedState;
		if (e === null && t.stateNode === null && (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), r.mode === "hidden") {
			if (t.flags & 128) {
				if (a = a === null ? n : a.baseLanes | n, e !== null) {
					for (r = t.child = e.child, i = 0; r !== null;) i = i | r.lanes | r.childLanes, r = r.sibling;
					r = i & ~a;
				} else r = 0, t.child = null;
				return hc(e, t, a, n, r);
			}
			if (n & 536870912) t.memoizedState = {
				baseLanes: 0,
				cachePool: null
			}, e !== null && wa(t, a === null ? null : a.cachePool), a === null ? no() : to(t, a), co(t);
			else return r = t.lanes = 536870912, hc(e, t, a === null ? n : a.baseLanes | n, n, r);
		} else a === null ? (e !== null && wa(t, null), no(), lo(t)) : (wa(t, a.cachePool), to(t, a), lo(t), t.memoizedState = null);
		return lc(e, t, i, n), t.child;
	}
	function mc(e, t) {
		return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), t.sibling;
	}
	function hc(e, t, n, r, i) {
		var a = Ca();
		return a = a === null ? null : {
			parent: da._currentValue,
			pool: a
		}, t.memoizedState = {
			baseLanes: n,
			cachePool: a
		}, e !== null && wa(t, null), no(), co(t), e !== null && na(e, t, r, !0), t.childLanes = i, null;
	}
	function gc(e, t) {
		return t = Ec({
			mode: t.mode,
			children: t.children
		}, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
	}
	function _c(e, t, n) {
		return Ha(t, e.child, null, n), e = gc(t, t.pendingProps), e.flags |= 2, uo(t), t.memoizedState = null, e;
	}
	function vc(e, t, n) {
		var r = t.pendingProps, a = (t.flags & 128) != 0;
		if (t.flags &= -129, e === null) {
			if (F) {
				if (r.mode === "hidden") return e = gc(t, r), t.lanes = 536870912, mc(null, e);
				if (so(t), (e = Ri) ? (e = lf(e, Bi), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: ki === null ? null : {
						id: Ai,
						overflow: ji
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = yi(e), n.return = t, t.child = n, Li = t, Ri = null)) : e = null, e === null) throw Hi(t);
				return t.lanes = 536870912, null;
			}
			return gc(t, r);
		}
		var o = e.memoizedState;
		if (o !== null) {
			var s = o.dehydrated;
			if (so(t), a) if (t.flags & 256) t.flags &= -257, t = _c(e, t, n);
			else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
			else throw Error(i(558));
			else if (cc || na(e, t, n, !1), a = (n & e.childLanes) !== 0, cc || a) {
				if (r = Ul, r !== null && (s = st(r, n), s !== 0 && s !== o.retryLane)) throw o.retryLane = s, li(e, s), bu(r, e, s), sc;
				Mu(), t = _c(e, t, n);
			} else e = o.treeContext, Ri = pf(s.nextSibling), Li = t, F = !0, zi = null, Bi = !1, e !== null && Ii(t, e), t = gc(t, r), t.flags |= 4096;
			return t;
		}
		return e = N(e.child, {
			mode: r.mode,
			children: r.children
		}), e.ref = t.ref, t.child = e, e.return = t, e;
	}
	function yc(e, t) {
		var n = t.ref;
		if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
		else {
			if (typeof n != "function" && typeof n != "object") throw Error(i(284));
			(e === null || e.ref !== n) && (t.flags |= 4194816);
		}
	}
	function bc(e, t, n, r, i) {
		return ia(t), n = Eo(e, t, n, r, void 0, i), r = Ao(), e !== null && !cc ? (jo(e, t, i), jc(e, t, i)) : (F && r && Pi(t), t.flags |= 1, lc(e, t, n, i), t.child);
	}
	function xc(e, t, n, r, i, a) {
		return ia(t), t.updateQueue = null, n = Oo(t, r, n, i), Do(e), r = Ao(), e !== null && !cc ? (jo(e, t, a), jc(e, t, a)) : (F && r && Pi(t), t.flags |= 1, lc(e, t, n, a), t.child);
	}
	function B(e, t, n, r, i) {
		if (ia(t), t.stateNode === null) {
			var a = fi, o = n.contextType;
			typeof o == "object" && o && (a = aa(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = Js, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, Wa(t), o = n.contextType, a.context = typeof o == "object" && o ? aa(o) : fi, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == "function" && (qs(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (o = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), o !== a.state && Js.enqueueReplaceState(a, a.state, null), Xa(t, r, a, i), Ya(), a.state = t.memoizedState), typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !0;
		} else if (e === null) {
			a = t.stateNode;
			var s = t.memoizedProps, c = Zs(n, s);
			a.props = c;
			var l = a.context, u = n.contextType;
			o = fi, typeof u == "object" && u && (o = aa(u));
			var d = n.getDerivedStateFromProps;
			u = typeof d == "function" || typeof a.getSnapshotBeforeUpdate == "function", s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (s || l !== o) && Xs(t, a, r, o), Ua = !1;
			var f = t.memoizedState;
			a.state = f, Xa(t, r, a, i), Ya(), l = t.memoizedState, s || f !== l || Ua ? (typeof d == "function" && (qs(t, n, d, r), l = t.memoizedState), (c = Ua || Ys(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			a = t.stateNode, Ga(e, t), o = t.memoizedProps, u = Zs(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = fi, typeof l == "object" && l && (c = aa(l)), s = n.getDerivedStateFromProps, (l = typeof s == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (o !== d || f !== c) && Xs(t, a, r, c), Ua = !1, f = t.memoizedState, a.state = f, Xa(t, r, a, i), Ya();
			var p = t.memoizedState;
			o !== d || f !== p || Ua || e !== null && e.dependencies !== null && ra(e.dependencies) ? (typeof s == "function" && (qs(t, n, s, r), p = t.memoizedState), (u = Ua || Ys(t, n, u, r, f, p, c) || e !== null && e.dependencies !== null && ra(e.dependencies)) ? (l || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(r, p, c), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(r, p, c)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = p), a.props = r, a.state = p, a.context = c, r = u) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return a = r, yc(e, t), r = (t.flags & 128) != 0, a || r ? (a = t.stateNode, n = r && typeof n.getDerivedStateFromError != "function" ? null : a.render(), t.flags |= 1, e !== null && r ? (t.child = Ha(t, e.child, null, i), t.child = Ha(t, null, n, i)) : lc(e, t, n, i), t.memoizedState = a.state, e = t.child) : e = jc(e, t, i), e;
	}
	function Sc(e, t, n, r) {
		return Ki(), t.flags |= 256, lc(e, t, n, r), t.child;
	}
	var Cc = {
		dehydrated: null,
		treeContext: null,
		retryLane: 0,
		hydrationErrors: null
	};
	function wc(e) {
		return {
			baseLanes: e,
			cachePool: Ta()
		};
	}
	function V(e, t, n) {
		return e = e === null ? 0 : e.childLanes & ~n, t && (e |= $l), e;
	}
	function Tc(e, t, n) {
		var r = t.pendingProps, a = !1, o = (t.flags & 128) != 0, s;
		if ((s = o) || (s = e !== null && e.memoizedState === null ? !1 : (fo.current & 2) != 0), s && (a = !0, t.flags &= -129), s = (t.flags & 32) != 0, t.flags &= -33, e === null) {
			if (F) {
				if (a ? oo(t) : lo(t), (e = Ri) ? (e = lf(e, Bi), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: ki === null ? null : {
						id: Ai,
						overflow: ji
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = yi(e), n.return = t, t.child = n, Li = t, Ri = null)) : e = null, e === null) throw Hi(t);
				return df(e) ? t.lanes = 32 : t.lanes = 536870912, null;
			}
			var c = r.children;
			return r = r.fallback, a ? (lo(t), a = t.mode, c = Ec({
				mode: "hidden",
				children: c
			}, a), r = _i(r, a, n, null), c.return = t, r.return = t, c.sibling = r, t.child = c, r = t.child, r.memoizedState = wc(n), r.childLanes = V(e, s, n), t.memoizedState = Cc, mc(null, r)) : (oo(t), H(t, c));
		}
		var l = e.memoizedState;
		if (l !== null && (c = l.dehydrated, c !== null)) {
			if (o) t.flags & 256 ? (oo(t), t.flags &= -257, t = Dc(e, t, n)) : t.memoizedState === null ? (lo(t), c = r.fallback, a = t.mode, r = Ec({
				mode: "visible",
				children: r.children
			}, a), c = _i(c, a, n, null), c.flags |= 2, r.return = t, c.return = t, r.sibling = c, t.child = r, Ha(t, e.child, null, n), r = t.child, r.memoizedState = wc(n), r.childLanes = V(e, s, n), t.memoizedState = Cc, t = mc(null, r)) : (lo(t), t.child = e.child, t.flags |= 128, t = null);
			else if (oo(t), df(c)) {
				if (s = c.nextSibling && c.nextSibling.dataset, s) var u = s.dgst;
				s = u, r = Error(i(419)), r.stack = "", r.digest = s, Ji({
					value: r,
					source: null,
					stack: null
				}), t = Dc(e, t, n);
			} else if (cc || na(e, t, n, !1), s = (n & e.childLanes) !== 0, cc || s) {
				if (s = Ul, s !== null && (r = st(s, n), r !== 0 && r !== l.retryLane)) throw l.retryLane = r, li(e, r), bu(s, e, r), sc;
				uf(c) || Mu(), t = Dc(e, t, n);
			} else uf(c) ? (t.flags |= 192, t.child = e.child, t = null) : (e = l.treeContext, Ri = pf(c.nextSibling), Li = t, F = !0, zi = null, Bi = !1, e !== null && Ii(t, e), t = H(t, r.children), t.flags |= 4096);
			return t;
		}
		return a ? (lo(t), c = r.fallback, a = t.mode, l = e.child, u = l.sibling, r = N(l, {
			mode: "hidden",
			children: r.children
		}), r.subtreeFlags = l.subtreeFlags & 65011712, u === null ? (c = _i(c, a, n, null), c.flags |= 2) : c = N(u, c), c.return = t, r.return = t, r.sibling = c, t.child = r, mc(null, r), r = t.child, c = e.child.memoizedState, c === null ? c = wc(n) : (a = c.cachePool, a === null ? a = Ta() : (l = da._currentValue, a = a.parent === l ? a : {
			parent: l,
			pool: l
		}), c = {
			baseLanes: c.baseLanes | n,
			cachePool: a
		}), r.memoizedState = c, r.childLanes = V(e, s, n), t.memoizedState = Cc, mc(e.child, r)) : (oo(t), n = e.child, e = n.sibling, n = N(n, {
			mode: "visible",
			children: r.children
		}), n.return = t, n.sibling = null, e !== null && (s = t.deletions, s === null ? (t.deletions = [e], t.flags |= 16) : s.push(e)), t.child = n, t.memoizedState = null, n);
	}
	function H(e, t) {
		return t = Ec({
			mode: "visible",
			children: t
		}, e.mode), t.return = e, e.child = t;
	}
	function Ec(e, t) {
		return e = mi(22, e, null, t), e.lanes = 0, e;
	}
	function Dc(e, t, n) {
		return Ha(t, e.child, null, n), e = H(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function Oc(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), ea(e.return, t, n);
	}
	function kc(e, t, n, r, i, a) {
		var o = e.memoizedState;
		o === null ? e.memoizedState = {
			isBackwards: t,
			rendering: null,
			renderingStartTime: 0,
			last: r,
			tail: n,
			tailMode: i,
			treeForkCount: a
		} : (o.isBackwards = t, o.rendering = null, o.renderingStartTime = 0, o.last = r, o.tail = n, o.tailMode = i, o.treeForkCount = a);
	}
	function Ac(e, t, n) {
		var r = t.pendingProps, i = r.revealOrder, a = r.tail;
		r = r.children;
		var o = fo.current, s = (o & 2) != 0;
		if (s ? (o = o & 1 | 2, t.flags |= 128) : o &= 1, k(fo, o), lc(e, t, r, n), r = F ? Ei : 0, !s && e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
			if (e.tag === 13) e.memoizedState !== null && Oc(e, n, t);
			else if (e.tag === 19) Oc(e, n, t);
			else if (e.child !== null) {
				e.child.return = e, e = e.child;
				continue;
			}
			if (e === t) break a;
			for (; e.sibling === null;) {
				if (e.return === null || e.return === t) break a;
				e = e.return;
			}
			e.sibling.return = e.return, e = e.sibling;
		}
		switch (i) {
			case "forwards":
				for (n = t.child, i = null; n !== null;) e = n.alternate, e !== null && po(e) === null && (i = n), n = n.sibling;
				n = i, n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), kc(t, !1, i, n, a, r);
				break;
			case "backwards":
			case "unstable_legacy-backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && po(e) === null) {
						t.child = i;
						break;
					}
					e = i.sibling, i.sibling = n, n = i, i = e;
				}
				kc(t, !0, n, null, a, r);
				break;
			case "together":
				kc(t, !1, null, null, void 0, r);
				break;
			default: t.memoizedState = null;
		}
		return t.child;
	}
	function jc(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), Xl |= t.lanes, (n & t.childLanes) === 0) if (e !== null) {
			if (na(e, t, n, !1), (n & t.childLanes) === 0) return null;
		} else return null;
		if (e !== null && t.child !== e.child) throw Error(i(153));
		if (t.child !== null) {
			for (e = t.child, n = N(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = N(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function Mc(e, t) {
		return (e.lanes & t) === 0 ? (e = e.dependencies, !!(e !== null && ra(e))) : !0;
	}
	function Nc(e, t, n) {
		switch (t.tag) {
			case 3:
				ge(t, t.stateNode.containerInfo), Qi(t, da, e.memoizedState.cache), Ki();
				break;
			case 27:
			case 5:
				ve(t);
				break;
			case 4:
				ge(t, t.stateNode.containerInfo);
				break;
			case 10:
				Qi(t, t.type, t.memoizedProps.value);
				break;
			case 31:
				if (t.memoizedState !== null) return t.flags |= 128, so(t), null;
				break;
			case 13:
				var r = t.memoizedState;
				if (r !== null) return r.dehydrated === null ? (n & t.child.childLanes) === 0 ? (oo(t), e = jc(e, t, n), e === null ? null : e.sibling) : Tc(e, t, n) : (oo(t), t.flags |= 128, null);
				oo(t);
				break;
			case 19:
				var i = (e.flags & 128) != 0;
				if (r = (n & t.childLanes) !== 0, r || (na(e, t, n, !1), r = (n & t.childLanes) !== 0), i) {
					if (r) return Ac(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), k(fo, fo.current), r) break;
				return null;
			case 22: return t.lanes = 0, pc(e, t, n, t.pendingProps);
			case 24: Qi(t, da, e.memoizedState.cache);
		}
		return jc(e, t, n);
	}
	function Pc(e, t, n) {
		if (e !== null) if (e.memoizedProps !== t.pendingProps) cc = !0;
		else {
			if (!Mc(e, n) && !(t.flags & 128)) return cc = !1, Nc(e, t, n);
			cc = !!(e.flags & 131072);
		}
		else cc = !1, F && t.flags & 1048576 && Ni(t, Ei, t.index);
		switch (t.lanes = 0, t.tag) {
			case 16:
				a: {
					var r = t.pendingProps;
					if (e = Ma(t.elementType), t.type = e, typeof e == "function") hi(e) ? (r = Zs(e, r), t.tag = 1, t = B(null, t, e, r, n)) : (t.tag = 0, t = bc(null, t, e, r, n));
					else {
						if (e != null) {
							var a = e.$$typeof;
							if (a === w) {
								t.tag = 11, t = uc(null, t, e, r, n);
								break a;
							} else if (a === ne) {
								t.tag = 14, t = dc(null, t, e, r, n);
								break a;
							}
						}
						throw t = ce(e) || e, Error(i(306, t, ""));
					}
				}
				return t;
			case 0: return bc(e, t, t.type, t.pendingProps, n);
			case 1: return r = t.type, a = Zs(r, t.pendingProps), B(e, t, r, a, n);
			case 3:
				a: {
					if (ge(t, t.stateNode.containerInfo), e === null) throw Error(i(387));
					r = t.pendingProps;
					var o = t.memoizedState;
					a = o.element, Ga(e, t), Xa(t, r, null, n);
					var s = t.memoizedState;
					if (r = s.cache, Qi(t, da, r), r !== o.cache && ta(t, [da], n, !0), Ya(), r = s.element, o.isDehydrated) if (o = {
						element: r,
						isDehydrated: !1,
						cache: s.cache
					}, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
						t = Sc(e, t, r, n);
						break a;
					} else if (r !== a) {
						a = Si(Error(i(424)), t), Ji(a), t = Sc(e, t, r, n);
						break a;
					} else {
						switch (e = t.stateNode.containerInfo, e.nodeType) {
							case 9:
								e = e.body;
								break;
							default: e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
						}
						for (Ri = pf(e.firstChild), Li = t, F = !0, zi = null, Bi = !0, n = I(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 4096, n = n.sibling;
					}
					else {
						if (Ki(), r === a) {
							t = jc(e, t, n);
							break a;
						}
						lc(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 26: return yc(e, t), e === null ? (n = Pf(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : F || (n = t.type, e = t.pendingProps, r = Gd(j.current).createElement(n), r[pt] = t, r[mt] = e, zd(r, n, e), Et(r), t.stateNode = r) : t.memoizedState = Pf(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
			case 27: return ve(t), e === null && F && (r = t.stateNode = _f(t.type, t.pendingProps, j.current), Li = t, Bi = !0, a = Ri, nf(t.type) ? (mf = a, Ri = pf(r.firstChild)) : Ri = a), lc(e, t, t.pendingProps.children, n), yc(e, t), e === null && (t.flags |= 4194304), t.child;
			case 5: return e === null && F && ((a = r = Ri) && (r = sf(r, t.type, t.pendingProps, Bi), r === null ? a = !1 : (t.stateNode = r, Li = t, Ri = pf(r.firstChild), Bi = !1, a = !0)), a || Hi(t)), ve(t), a = t.type, o = t.pendingProps, s = e === null ? null : e.memoizedProps, r = o.children, Jd(a, o) ? r = null : s !== null && Jd(a, s) && (t.flags |= 32), t.memoizedState !== null && (a = Eo(e, t, ko, null, null, n), rp._currentValue = a), yc(e, t), lc(e, t, r, n), t.child;
			case 6: return e === null && F && ((e = n = Ri) && (n = cf(n, t.pendingProps, Bi), n === null ? e = !1 : (t.stateNode = n, Li = t, Ri = null, e = !0)), e || Hi(t)), null;
			case 13: return Tc(e, t, n);
			case 4: return ge(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = Ha(t, null, r, n) : lc(e, t, r, n), t.child;
			case 11: return uc(e, t, t.type, t.pendingProps, n);
			case 7: return lc(e, t, t.pendingProps, n), t.child;
			case 8: return lc(e, t, t.pendingProps.children, n), t.child;
			case 12: return lc(e, t, t.pendingProps.children, n), t.child;
			case 10: return r = t.pendingProps, Qi(t, t.type, r.value), lc(e, t, r.children, n), t.child;
			case 9: return a = t.type._context, r = t.pendingProps.children, ia(t), a = aa(a), r = r(a), t.flags |= 1, lc(e, t, r, n), t.child;
			case 14: return dc(e, t, t.type, t.pendingProps, n);
			case 15: return fc(e, t, t.type, t.pendingProps, n);
			case 19: return Ac(e, t, n);
			case 31: return vc(e, t, n);
			case 22: return pc(e, t, n, t.pendingProps);
			case 24: return ia(t), r = aa(da), e === null ? (a = Ca(), a === null && (a = Ul, o = fa(), a.pooledCache = o, o.refCount++, o !== null && (a.pooledCacheLanes |= n), a = o), t.memoizedState = {
				parent: r,
				cache: a
			}, Wa(t), Qi(t, da, a)) : ((e.lanes & n) !== 0 && (Ga(e, t), Xa(t, null, null, n), Ya()), a = e.memoizedState, o = t.memoizedState, a.parent === r ? (r = o.cache, Qi(t, da, r), r !== a.cache && ta(t, [da], n, !0)) : (a = {
				parent: r,
				cache: r
			}, t.memoizedState = a, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = a), Qi(t, da, r))), lc(e, t, t.pendingProps.children, n), t.child;
			case 29: throw t.pendingProps;
		}
		throw Error(i(156, t.tag));
	}
	function Fc(e) {
		e.flags |= 4;
	}
	function Ic(e, t, n, r, i) {
		if ((t = (e.mode & 32) != 0) && (t = !1), t) {
			if (e.flags |= 16777216, (i & 335544128) === i) if (e.stateNode.complete) e.flags |= 8192;
			else if (ku()) e.flags |= 8192;
			else throw Na = ka, Da;
		} else e.flags &= -16777217;
	}
	function Lc(e, t) {
		if (t.type !== "stylesheet" || t.state.loading & 4) e.flags &= -16777217;
		else if (e.flags |= 16777216, !Yf(t)) if (ku()) e.flags |= 8192;
		else throw Na = ka, Da;
	}
	function Rc(e, t) {
		t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag === 22 ? 536870912 : tt(), e.lanes |= t, eu |= t);
	}
	function zc(e, t) {
		if (!F) switch (e.tailMode) {
			case "hidden":
				t = e.tail;
				for (var n = null; t !== null;) t.alternate !== null && (n = t), t = t.sibling;
				n === null ? e.tail = null : n.sibling = null;
				break;
			case "collapsed":
				n = e.tail;
				for (var r = null; n !== null;) n.alternate !== null && (r = n), n = n.sibling;
				r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null;
		}
	}
	function Bc(e) {
		var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
		if (t) for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 65011712, r |= i.flags & 65011712, i.return = e, i = i.sibling;
		else for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
		return e.subtreeFlags |= r, e.childLanes = n, t;
	}
	function Vc(e, t, n) {
		var r = t.pendingProps;
		switch (Fi(t), t.tag) {
			case 16:
			case 15:
			case 0:
			case 11:
			case 7:
			case 8:
			case 12:
			case 9:
			case 14: return Bc(t), null;
			case 1: return Bc(t), null;
			case 3: return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), $i(da), _e(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (Gi(t) ? Fc(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, qi())), Bc(t), null;
			case 26:
				var a = t.type, o = t.memoizedState;
				return e === null ? (Fc(t), o === null ? (Bc(t), Ic(t, a, null, r, n)) : (Bc(t), Lc(t, o))) : o ? o === e.memoizedState ? (Bc(t), t.flags &= -16777217) : (Fc(t), Bc(t), Lc(t, o)) : (e = e.memoizedProps, e !== r && Fc(t), Bc(t), Ic(t, a, e, r, n)), null;
			case 27:
				if (ye(t), n = j.current, a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && Fc(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return Bc(t), null;
					}
					e = me.current, Gi(t) ? Ui(t, e) : (e = _f(a, r, n), t.stateNode = e, Fc(t));
				}
				return Bc(t), null;
			case 5:
				if (ye(t), a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && Fc(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return Bc(t), null;
					}
					if (o = me.current, Gi(t)) Ui(t, o);
					else {
						var s = Gd(j.current);
						switch (o) {
							case 1:
								o = s.createElementNS("http://www.w3.org/2000/svg", a);
								break;
							case 2:
								o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
								break;
							default: switch (a) {
								case "svg":
									o = s.createElementNS("http://www.w3.org/2000/svg", a);
									break;
								case "math":
									o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
									break;
								case "script":
									o = s.createElement("div"), o.innerHTML = "<script><\/script>", o = o.removeChild(o.firstChild);
									break;
								case "select":
									o = typeof r.is == "string" ? s.createElement("select", { is: r.is }) : s.createElement("select"), r.multiple ? o.multiple = !0 : r.size && (o.size = r.size);
									break;
								default: o = typeof r.is == "string" ? s.createElement(a, { is: r.is }) : s.createElement(a);
							}
						}
						o[pt] = t, o[mt] = r;
						a: for (s = t.child; s !== null;) {
							if (s.tag === 5 || s.tag === 6) o.appendChild(s.stateNode);
							else if (s.tag !== 4 && s.tag !== 27 && s.child !== null) {
								s.child.return = s, s = s.child;
								continue;
							}
							if (s === t) break a;
							for (; s.sibling === null;) {
								if (s.return === null || s.return === t) break a;
								s = s.return;
							}
							s.sibling.return = s.return, s = s.sibling;
						}
						t.stateNode = o;
						a: switch (zd(o, a, r), a) {
							case "button":
							case "input":
							case "select":
							case "textarea":
								r = !!r.autoFocus;
								break a;
							case "img":
								r = !0;
								break a;
							default: r = !1;
						}
						r && Fc(t);
					}
				}
				return Bc(t), Ic(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n), null;
			case 6:
				if (e && t.stateNode != null) e.memoizedProps !== r && Fc(t);
				else {
					if (typeof r != "string" && t.stateNode === null) throw Error(i(166));
					if (e = j.current, Gi(t)) {
						if (e = t.stateNode, n = t.memoizedProps, r = null, a = Li, a !== null) switch (a.tag) {
							case 27:
							case 5: r = a.memoizedProps;
						}
						e[pt] = t, e = !!(e.nodeValue === n || r !== null && !0 === r.suppressHydrationWarning || Ld(e.nodeValue, n)), e || Hi(t, !0);
					} else e = Gd(e).createTextNode(r), e[pt] = t, t.stateNode = e;
				}
				return Bc(t), null;
			case 31:
				if (n = t.memoizedState, e === null || e.memoizedState !== null) {
					if (r = Gi(t), n !== null) {
						if (e === null) {
							if (!r) throw Error(i(318));
							if (e = t.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(557));
							e[pt] = t;
						} else Ki(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						Bc(t), e = !1;
					} else n = qi(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), e = !0;
					if (!e) return t.flags & 256 ? (uo(t), t) : (uo(t), null);
					if (t.flags & 128) throw Error(i(558));
				}
				return Bc(t), null;
			case 13:
				if (r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (a = Gi(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!a) throw Error(i(318));
							if (a = t.memoizedState, a = a === null ? null : a.dehydrated, !a) throw Error(i(317));
							a[pt] = t;
						} else Ki(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						Bc(t), a = !1;
					} else a = qi(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), a = !0;
					if (!a) return t.flags & 256 ? (uo(t), t) : (uo(t), null);
				}
				return uo(t), t.flags & 128 ? (t.lanes = n, t) : (n = r !== null, e = e !== null && e.memoizedState !== null, n && (r = t.child, a = null, r.alternate !== null && r.alternate.memoizedState !== null && r.alternate.memoizedState.cachePool !== null && (a = r.alternate.memoizedState.cachePool.pool), o = null, r.memoizedState !== null && r.memoizedState.cachePool !== null && (o = r.memoizedState.cachePool.pool), o !== a && (r.flags |= 2048)), n !== e && n && (t.child.flags |= 8192), Rc(t, t.updateQueue), Bc(t), null);
			case 4: return _e(), e === null && Dd(t.stateNode.containerInfo), Bc(t), null;
			case 10: return $i(t.type), Bc(t), null;
			case 19:
				if (pe(fo), r = t.memoizedState, r === null) return Bc(t), null;
				if (a = (t.flags & 128) != 0, o = r.rendering, o === null) if (a) zc(r, !1);
				else {
					if (Yl !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
						if (o = po(e), o !== null) {
							for (t.flags |= 128, zc(r, !1), e = o.updateQueue, t.updateQueue = e, Rc(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) gi(n, e), n = n.sibling;
							return k(fo, fo.current & 1 | 2), F && Mi(t, r.treeForkCount), t.child;
						}
						e = e.sibling;
					}
					r.tail !== null && Me() > ou && (t.flags |= 128, a = !0, zc(r, !1), t.lanes = 4194304);
				}
				else {
					if (!a) if (e = po(o), e !== null) {
						if (t.flags |= 128, a = !0, e = e.updateQueue, t.updateQueue = e, Rc(t, e), zc(r, !0), r.tail === null && r.tailMode === "hidden" && !o.alternate && !F) return Bc(t), null;
					} else 2 * Me() - r.renderingStartTime > ou && n !== 536870912 && (t.flags |= 128, a = !0, zc(r, !1), t.lanes = 4194304);
					r.isBackwards ? (o.sibling = t.child, t.child = o) : (e = r.last, e === null ? t.child = o : e.sibling = o, r.last = o);
				}
				return r.tail === null ? (Bc(t), null) : (e = r.tail, r.rendering = e, r.tail = e.sibling, r.renderingStartTime = Me(), e.sibling = null, n = fo.current, k(fo, a ? n & 1 | 2 : n & 1), F && Mi(t, r.treeForkCount), e);
			case 22:
			case 23: return uo(t), ro(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (Bc(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : Bc(t), n = t.updateQueue, n !== null && Rc(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && pe(Sa), null;
			case 24: return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), $i(da), Bc(t), null;
			case 25: return null;
			case 30: return null;
		}
		throw Error(i(156, t.tag));
	}
	function Hc(e, t) {
		switch (Fi(t), t.tag) {
			case 1: return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return $i(da), _e(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 26:
			case 27:
			case 5: return ye(t), null;
			case 31:
				if (t.memoizedState !== null) {
					if (uo(t), t.alternate === null) throw Error(i(340));
					Ki();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 13:
				if (uo(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(i(340));
					Ki();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return pe(fo), null;
			case 4: return _e(), null;
			case 10: return $i(t.type), null;
			case 22:
			case 23: return uo(t), ro(), e !== null && pe(Sa), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 24: return $i(da), null;
			case 25: return null;
			default: return null;
		}
	}
	function Uc(e, t) {
		switch (Fi(t), t.tag) {
			case 3:
				$i(da), _e();
				break;
			case 26:
			case 27:
			case 5:
				ye(t);
				break;
			case 4:
				_e();
				break;
			case 31:
				t.memoizedState !== null && uo(t);
				break;
			case 13:
				uo(t);
				break;
			case 19:
				pe(fo);
				break;
			case 10:
				$i(t.type);
				break;
			case 22:
			case 23:
				uo(t), ro(), e !== null && pe(Sa);
				break;
			case 24: $i(da);
		}
	}
	function Wc(e, t) {
		try {
			var n = t.updateQueue, r = n === null ? null : n.lastEffect;
			if (r !== null) {
				var i = r.next;
				n = i;
				do {
					if ((n.tag & e) === e) {
						r = void 0;
						var a = n.create, o = n.inst;
						r = a(), o.destroy = r;
					}
					n = n.next;
				} while (n !== i);
			}
		} catch (e) {
			q(t, t.return, e);
		}
	}
	function Gc(e, t, n) {
		try {
			var r = t.updateQueue, i = r === null ? null : r.lastEffect;
			if (i !== null) {
				var a = i.next;
				r = a;
				do {
					if ((r.tag & e) === e) {
						var o = r.inst, s = o.destroy;
						if (s !== void 0) {
							o.destroy = void 0, i = t;
							var c = n, l = s;
							try {
								l();
							} catch (e) {
								q(i, c, e);
							}
						}
					}
					r = r.next;
				} while (r !== a);
			}
		} catch (e) {
			q(t, t.return, e);
		}
	}
	function Kc(e) {
		var t = e.updateQueue;
		if (t !== null) {
			var n = e.stateNode;
			try {
				Qa(t, n);
			} catch (t) {
				q(e, e.return, t);
			}
		}
	}
	function qc(e, t, n) {
		n.props = Zs(e.type, e.memoizedProps), n.state = e.memoizedState;
		try {
			n.componentWillUnmount();
		} catch (n) {
			q(e, t, n);
		}
	}
	function Jc(e, t) {
		try {
			var n = e.ref;
			if (n !== null) {
				switch (e.tag) {
					case 26:
					case 27:
					case 5:
						var r = e.stateNode;
						break;
					case 30:
						r = e.stateNode;
						break;
					default: r = e.stateNode;
				}
				typeof n == "function" ? e.refCleanup = n(r) : n.current = r;
			}
		} catch (n) {
			q(e, t, n);
		}
	}
	function Yc(e, t) {
		var n = e.ref, r = e.refCleanup;
		if (n !== null) if (typeof r == "function") try {
			r();
		} catch (n) {
			q(e, t, n);
		} finally {
			e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null);
		}
		else if (typeof n == "function") try {
			n(null);
		} catch (n) {
			q(e, t, n);
		}
		else n.current = null;
	}
	function Xc(e) {
		var t = e.type, n = e.memoizedProps, r = e.stateNode;
		try {
			a: switch (t) {
				case "button":
				case "input":
				case "select":
				case "textarea":
					n.autoFocus && r.focus();
					break a;
				case "img": n.src ? r.src = n.src : n.srcSet && (r.srcset = n.srcSet);
			}
		} catch (t) {
			q(e, e.return, t);
		}
	}
	function Zc(e, t, n) {
		try {
			var r = e.stateNode;
			Bd(r, e.type, n, t), r[mt] = t;
		} catch (t) {
			q(e, e.return, t);
		}
	}
	function Qc(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && nf(e.type) || e.tag === 4;
	}
	function $c(e) {
		a: for (;;) {
			for (; e.sibling === null;) {
				if (e.return === null || Qc(e.return)) return null;
				e = e.return;
			}
			for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
				if (e.tag === 27 && nf(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue a;
				e.child.return = e, e = e.child;
			}
			if (!(e.flags & 2)) return e.stateNode;
		}
	}
	function el(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(e, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, t.appendChild(e), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = sn));
		else if (r !== 4 && (r === 27 && nf(e.type) && (n = e.stateNode, t = null), e = e.child, e !== null)) for (el(e, t, n), e = e.sibling; e !== null;) el(e, t, n), e = e.sibling;
	}
	function tl(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
		else if (r !== 4 && (r === 27 && nf(e.type) && (n = e.stateNode), e = e.child, e !== null)) for (tl(e, t, n), e = e.sibling; e !== null;) tl(e, t, n), e = e.sibling;
	}
	function nl(e) {
		var t = e.stateNode, n = e.memoizedProps;
		try {
			for (var r = e.type, i = t.attributes; i.length;) t.removeAttributeNode(i[0]);
			zd(t, r, n), t[pt] = e, t[mt] = n;
		} catch (t) {
			q(e, e.return, t);
		}
	}
	var rl = !1, il = !1, al = !1, ol = typeof WeakSet == "function" ? WeakSet : Set, sl = null;
	function cl(e, t) {
		if (e = e.containerInfo, Ud = fp, e = Nr(e), Pr(e)) {
			if ("selectionStart" in e) var n = {
				start: e.selectionStart,
				end: e.selectionEnd
			};
			else a: {
				n = (n = e.ownerDocument) && n.defaultView || window;
				var r = n.getSelection && n.getSelection();
				if (r && r.rangeCount !== 0) {
					n = r.anchorNode;
					var a = r.anchorOffset, o = r.focusNode;
					r = r.focusOffset;
					try {
						n.nodeType, o.nodeType;
					} catch {
						n = null;
						break a;
					}
					var s = 0, c = -1, l = -1, u = 0, d = 0, f = e, p = null;
					b: for (;;) {
						for (var m; f !== n || a !== 0 && f.nodeType !== 3 || (c = s + a), f !== o || r !== 0 && f.nodeType !== 3 || (l = s + r), f.nodeType === 3 && (s += f.nodeValue.length), (m = f.firstChild) !== null;) p = f, f = m;
						for (;;) {
							if (f === e) break b;
							if (p === n && ++u === a && (c = s), p === o && ++d === r && (l = s), (m = f.nextSibling) !== null) break;
							f = p, p = f.parentNode;
						}
						f = m;
					}
					n = c === -1 || l === -1 ? null : {
						start: c,
						end: l
					};
				} else n = null;
			}
			n = n || {
				start: 0,
				end: 0
			};
		} else n = null;
		for (Wd = {
			focusedElem: e,
			selectionRange: n
		}, fp = !1, sl = t; sl !== null;) if (t = sl, e = t.child, t.subtreeFlags & 1028 && e !== null) e.return = t, sl = e;
		else for (; sl !== null;) {
			switch (t = sl, o = t.alternate, e = t.flags, t.tag) {
				case 0:
					if (e & 4 && (e = t.updateQueue, e = e === null ? null : e.events, e !== null)) for (n = 0; n < e.length; n++) a = e[n], a.ref.impl = a.nextImpl;
					break;
				case 11:
				case 15: break;
				case 1:
					if (e & 1024 && o !== null) {
						e = void 0, n = t, a = o.memoizedProps, o = o.memoizedState, r = n.stateNode;
						try {
							var h = Zs(n.type, a);
							e = r.getSnapshotBeforeUpdate(h, o), r.__reactInternalSnapshotBeforeUpdate = e;
						} catch (e) {
							q(n, n.return, e);
						}
					}
					break;
				case 3:
					if (e & 1024) {
						if (e = t.stateNode.containerInfo, n = e.nodeType, n === 9) of(e);
						else if (n === 1) switch (e.nodeName) {
							case "HEAD":
							case "HTML":
							case "BODY":
								of(e);
								break;
							default: e.textContent = "";
						}
					}
					break;
				case 5:
				case 26:
				case 27:
				case 6:
				case 4:
				case 17: break;
				default: if (e & 1024) throw Error(i(163));
			}
			if (e = t.sibling, e !== null) {
				e.return = t.return, sl = e;
				break;
			}
			sl = t.return;
		}
	}
	function ll(e, t, n) {
		var r = n.flags;
		switch (n.tag) {
			case 0:
			case 11:
			case 15:
				wl(e, n), r & 4 && Wc(5, n);
				break;
			case 1:
				if (wl(e, n), r & 4) if (e = n.stateNode, t === null) try {
					e.componentDidMount();
				} catch (e) {
					q(n, n.return, e);
				}
				else {
					var i = Zs(n.type, t.memoizedProps);
					t = t.memoizedState;
					try {
						e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
					} catch (e) {
						q(n, n.return, e);
					}
				}
				r & 64 && Kc(n), r & 512 && Jc(n, n.return);
				break;
			case 3:
				if (wl(e, n), r & 64 && (e = n.updateQueue, e !== null)) {
					if (t = null, n.child !== null) switch (n.child.tag) {
						case 27:
						case 5:
							t = n.child.stateNode;
							break;
						case 1: t = n.child.stateNode;
					}
					try {
						Qa(e, t);
					} catch (e) {
						q(n, n.return, e);
					}
				}
				break;
			case 27: t === null && r & 4 && nl(n);
			case 26:
			case 5:
				wl(e, n), t === null && r & 4 && Xc(n), r & 512 && Jc(n, n.return);
				break;
			case 12:
				wl(e, n);
				break;
			case 31:
				wl(e, n), r & 4 && hl(e, n);
				break;
			case 13:
				wl(e, n), r & 4 && gl(e, n), r & 64 && (e = n.memoizedState, e !== null && (e = e.dehydrated, e !== null && (n = $u.bind(null, n), ff(e, n))));
				break;
			case 22:
				if (r = n.memoizedState !== null || rl, !r) {
					t = t !== null && t.memoizedState !== null || il, i = rl;
					var a = il;
					rl = r, (il = t) && !a ? El(e, n, (n.subtreeFlags & 8772) != 0) : wl(e, n), rl = i, il = a;
				}
				break;
			case 30: break;
			default: wl(e, n);
		}
	}
	function ul(e) {
		var t = e.alternate;
		t !== null && (e.alternate = null, ul(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && xt(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	var dl = null, fl = !1;
	function pl(e, t, n) {
		for (n = n.child; n !== null;) ml(e, t, n), n = n.sibling;
	}
	function ml(e, t, n) {
		if (He && typeof He.onCommitFiberUnmount == "function") try {
			He.onCommitFiberUnmount(Ve, n);
		} catch {}
		switch (n.tag) {
			case 26:
				il || Yc(n, t), pl(e, t, n), n.memoizedState ? n.memoizedState.count-- : n.stateNode && (n = n.stateNode, n.parentNode.removeChild(n));
				break;
			case 27:
				il || Yc(n, t);
				var r = dl, i = fl;
				nf(n.type) && (dl = n.stateNode, fl = !1), pl(e, t, n), vf(n.stateNode), dl = r, fl = i;
				break;
			case 5: il || Yc(n, t);
			case 6:
				if (r = dl, i = fl, dl = null, pl(e, t, n), dl = r, fl = i, dl !== null) if (fl) try {
					(dl.nodeType === 9 ? dl.body : dl.nodeName === "HTML" ? dl.ownerDocument.body : dl).removeChild(n.stateNode);
				} catch (e) {
					q(n, t, e);
				}
				else try {
					dl.removeChild(n.stateNode);
				} catch (e) {
					q(n, t, e);
				}
				break;
			case 18:
				dl !== null && (fl ? (e = dl, rf(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, n.stateNode), Rp(e)) : rf(dl, n.stateNode));
				break;
			case 4:
				r = dl, i = fl, dl = n.stateNode.containerInfo, fl = !0, pl(e, t, n), dl = r, fl = i;
				break;
			case 0:
			case 11:
			case 14:
			case 15:
				Gc(2, n, t), il || Gc(4, n, t), pl(e, t, n);
				break;
			case 1:
				il || (Yc(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function" && qc(n, t, r)), pl(e, t, n);
				break;
			case 21:
				pl(e, t, n);
				break;
			case 22:
				il = (r = il) || n.memoizedState !== null, pl(e, t, n), il = r;
				break;
			default: pl(e, t, n);
		}
	}
	function hl(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
			e = e.dehydrated;
			try {
				Rp(e);
			} catch (e) {
				q(t, t.return, e);
			}
		}
	}
	function gl(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
			Rp(e);
		} catch (e) {
			q(t, t.return, e);
		}
	}
	function _l(e) {
		switch (e.tag) {
			case 31:
			case 13:
			case 19:
				var t = e.stateNode;
				return t === null && (t = e.stateNode = new ol()), t;
			case 22: return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new ol()), t;
			default: throw Error(i(435, e.tag));
		}
	}
	function vl(e, t) {
		var n = _l(e);
		t.forEach(function(t) {
			if (!n.has(t)) {
				n.add(t);
				var r = ed.bind(null, e, t);
				t.then(r, r);
			}
		});
	}
	function yl(e, t) {
		var n = t.deletions;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var a = n[r], o = e, s = t, c = s;
			a: for (; c !== null;) {
				switch (c.tag) {
					case 27:
						if (nf(c.type)) {
							dl = c.stateNode, fl = !1;
							break a;
						}
						break;
					case 5:
						dl = c.stateNode, fl = !1;
						break a;
					case 3:
					case 4:
						dl = c.stateNode.containerInfo, fl = !0;
						break a;
				}
				c = c.return;
			}
			if (dl === null) throw Error(i(160));
			ml(o, s, a), dl = null, fl = !1, o = a.alternate, o !== null && (o.return = null), a.return = null;
		}
		if (t.subtreeFlags & 13886) for (t = t.child; t !== null;) xl(t, e), t = t.sibling;
	}
	var bl = null;
	function xl(e, t) {
		var n = e.alternate, r = e.flags;
		switch (e.tag) {
			case 0:
			case 11:
			case 14:
			case 15:
				yl(t, e), Sl(e), r & 4 && (Gc(3, e, e.return), Wc(3, e), Gc(5, e, e.return));
				break;
			case 1:
				yl(t, e), Sl(e), r & 512 && (il || n === null || Yc(n, n.return)), r & 64 && rl && (e = e.updateQueue, e !== null && (r = e.callbacks, r !== null && (n = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = n === null ? r : n.concat(r))));
				break;
			case 26:
				var a = bl;
				if (yl(t, e), Sl(e), r & 512 && (il || n === null || Yc(n, n.return)), r & 4) {
					var o = n === null ? null : n.memoizedState;
					if (r = e.memoizedState, n === null) if (r === null) if (e.stateNode === null) {
						a: {
							r = e.type, n = e.memoizedProps, a = a.ownerDocument || a;
							b: switch (r) {
								case "title":
									o = a.getElementsByTagName("title")[0], (!o || o[bt] || o[pt] || o.namespaceURI === "http://www.w3.org/2000/svg" || o.hasAttribute("itemprop")) && (o = a.createElement(r), a.head.insertBefore(o, a.querySelector("head > title"))), zd(o, r, n), o[pt] = e, Et(o), r = o;
									break a;
								case "link":
									var s = Kf("link", "href", a).get(r + (n.href || ""));
									if (s) {
										for (var c = 0; c < s.length; c++) if (o = s[c], o.getAttribute("href") === (n.href == null || n.href === "" ? null : n.href) && o.getAttribute("rel") === (n.rel == null ? null : n.rel) && o.getAttribute("title") === (n.title == null ? null : n.title) && o.getAttribute("crossorigin") === (n.crossOrigin == null ? null : n.crossOrigin)) {
											s.splice(c, 1);
											break b;
										}
									}
									o = a.createElement(r), zd(o, r, n), a.head.appendChild(o);
									break;
								case "meta":
									if (s = Kf("meta", "content", a).get(r + (n.content || ""))) {
										for (c = 0; c < s.length; c++) if (o = s[c], o.getAttribute("content") === (n.content == null ? null : "" + n.content) && o.getAttribute("name") === (n.name == null ? null : n.name) && o.getAttribute("property") === (n.property == null ? null : n.property) && o.getAttribute("http-equiv") === (n.httpEquiv == null ? null : n.httpEquiv) && o.getAttribute("charset") === (n.charSet == null ? null : n.charSet)) {
											s.splice(c, 1);
											break b;
										}
									}
									o = a.createElement(r), zd(o, r, n), a.head.appendChild(o);
									break;
								default: throw Error(i(468, r));
							}
							o[pt] = e, Et(o), r = o;
						}
						e.stateNode = r;
					} else qf(a, e.type, e.stateNode);
					else e.stateNode = Vf(a, r, e.memoizedProps);
					else o === r ? r === null && e.stateNode !== null && Zc(e, e.memoizedProps, n.memoizedProps) : (o === null ? n.stateNode !== null && (n = n.stateNode, n.parentNode.removeChild(n)) : o.count--, r === null ? qf(a, e.type, e.stateNode) : Vf(a, r, e.memoizedProps));
				}
				break;
			case 27:
				yl(t, e), Sl(e), r & 512 && (il || n === null || Yc(n, n.return)), n !== null && r & 4 && Zc(e, e.memoizedProps, n.memoizedProps);
				break;
			case 5:
				if (yl(t, e), Sl(e), r & 512 && (il || n === null || Yc(n, n.return)), e.flags & 32) {
					a = e.stateNode;
					try {
						Qt(a, "");
					} catch (t) {
						q(e, e.return, t);
					}
				}
				r & 4 && e.stateNode != null && (a = e.memoizedProps, Zc(e, a, n === null ? a : n.memoizedProps)), r & 1024 && (al = !0);
				break;
			case 6:
				if (yl(t, e), Sl(e), r & 4) {
					if (e.stateNode === null) throw Error(i(162));
					r = e.memoizedProps, n = e.stateNode;
					try {
						n.nodeValue = r;
					} catch (t) {
						q(e, e.return, t);
					}
				}
				break;
			case 3:
				if (Gf = null, a = bl, bl = xf(t.containerInfo), yl(t, e), bl = a, Sl(e), r & 4 && n !== null && n.memoizedState.isDehydrated) try {
					Rp(t.containerInfo);
				} catch (t) {
					q(e, e.return, t);
				}
				al && (al = !1, Cl(e));
				break;
			case 4:
				r = bl, bl = xf(e.stateNode.containerInfo), yl(t, e), Sl(e), bl = r;
				break;
			case 12:
				yl(t, e), Sl(e);
				break;
			case 31:
				yl(t, e), Sl(e), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, vl(e, r)));
				break;
			case 13:
				yl(t, e), Sl(e), e.child.flags & 8192 && e.memoizedState !== null != (n !== null && n.memoizedState !== null) && (iu = Me()), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, vl(e, r)));
				break;
			case 22:
				a = e.memoizedState !== null;
				var l = n !== null && n.memoizedState !== null, u = rl, d = il;
				if (rl = u || a, il = d || l, yl(t, e), il = d, rl = u, Sl(e), r & 8192) a: for (t = e.stateNode, t._visibility = a ? t._visibility & -2 : t._visibility | 1, a && (n === null || l || rl || il || Tl(e)), n = null, t = e;;) {
					if (t.tag === 5 || t.tag === 26) {
						if (n === null) {
							l = n = t;
							try {
								if (o = l.stateNode, a) s = o.style, typeof s.setProperty == "function" ? s.setProperty("display", "none", "important") : s.display = "none";
								else {
									c = l.stateNode;
									var f = l.memoizedProps.style, p = f != null && f.hasOwnProperty("display") ? f.display : null;
									c.style.display = p == null || typeof p == "boolean" ? "" : ("" + p).trim();
								}
							} catch (e) {
								q(l, l.return, e);
							}
						}
					} else if (t.tag === 6) {
						if (n === null) {
							l = t;
							try {
								l.stateNode.nodeValue = a ? "" : l.memoizedProps;
							} catch (e) {
								q(l, l.return, e);
							}
						}
					} else if (t.tag === 18) {
						if (n === null) {
							l = t;
							try {
								var m = l.stateNode;
								a ? af(m, !0) : af(l.stateNode, !1);
							} catch (e) {
								q(l, l.return, e);
							}
						}
					} else if ((t.tag !== 22 && t.tag !== 23 || t.memoizedState === null || t === e) && t.child !== null) {
						t.child.return = t, t = t.child;
						continue;
					}
					if (t === e) break a;
					for (; t.sibling === null;) {
						if (t.return === null || t.return === e) break a;
						n === t && (n = null), t = t.return;
					}
					n === t && (n = null), t.sibling.return = t.return, t = t.sibling;
				}
				r & 4 && (r = e.updateQueue, r !== null && (n = r.retryQueue, n !== null && (r.retryQueue = null, vl(e, n))));
				break;
			case 19:
				yl(t, e), Sl(e), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, vl(e, r)));
				break;
			case 30: break;
			case 21: break;
			default: yl(t, e), Sl(e);
		}
	}
	function Sl(e) {
		var t = e.flags;
		if (t & 2) {
			try {
				for (var n, r = e.return; r !== null;) {
					if (Qc(r)) {
						n = r;
						break;
					}
					r = r.return;
				}
				if (n == null) throw Error(i(160));
				switch (n.tag) {
					case 27:
						var a = n.stateNode;
						tl(e, $c(e), a);
						break;
					case 5:
						var o = n.stateNode;
						n.flags & 32 && (Qt(o, ""), n.flags &= -33), tl(e, $c(e), o);
						break;
					case 3:
					case 4:
						var s = n.stateNode.containerInfo;
						el(e, $c(e), s);
						break;
					default: throw Error(i(161));
				}
			} catch (t) {
				q(e, e.return, t);
			}
			e.flags &= -3;
		}
		t & 4096 && (e.flags &= -4097);
	}
	function Cl(e) {
		if (e.subtreeFlags & 1024) for (e = e.child; e !== null;) {
			var t = e;
			Cl(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), e = e.sibling;
		}
	}
	function wl(e, t) {
		if (t.subtreeFlags & 8772) for (t = t.child; t !== null;) ll(e, t.alternate, t), t = t.sibling;
	}
	function Tl(e) {
		for (e = e.child; e !== null;) {
			var t = e;
			switch (t.tag) {
				case 0:
				case 11:
				case 14:
				case 15:
					Gc(4, t, t.return), Tl(t);
					break;
				case 1:
					Yc(t, t.return);
					var n = t.stateNode;
					typeof n.componentWillUnmount == "function" && qc(t, t.return, n), Tl(t);
					break;
				case 27: vf(t.stateNode);
				case 26:
				case 5:
					Yc(t, t.return), Tl(t);
					break;
				case 22:
					t.memoizedState === null && Tl(t);
					break;
				case 30:
					Tl(t);
					break;
				default: Tl(t);
			}
			e = e.sibling;
		}
	}
	function El(e, t, n) {
		for (n = n && (t.subtreeFlags & 8772) != 0, t = t.child; t !== null;) {
			var r = t.alternate, i = e, a = t, o = a.flags;
			switch (a.tag) {
				case 0:
				case 11:
				case 15:
					El(i, a, n), Wc(4, a);
					break;
				case 1:
					if (El(i, a, n), r = a, i = r.stateNode, typeof i.componentDidMount == "function") try {
						i.componentDidMount();
					} catch (e) {
						q(r, r.return, e);
					}
					if (r = a, i = r.updateQueue, i !== null) {
						var s = r.stateNode;
						try {
							var c = i.shared.hiddenCallbacks;
							if (c !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < c.length; i++) Za(c[i], s);
						} catch (e) {
							q(r, r.return, e);
						}
					}
					n && o & 64 && Kc(a), Jc(a, a.return);
					break;
				case 27: nl(a);
				case 26:
				case 5:
					El(i, a, n), n && r === null && o & 4 && Xc(a), Jc(a, a.return);
					break;
				case 12:
					El(i, a, n);
					break;
				case 31:
					El(i, a, n), n && o & 4 && hl(i, a);
					break;
				case 13:
					El(i, a, n), n && o & 4 && gl(i, a);
					break;
				case 22:
					a.memoizedState === null && El(i, a, n), Jc(a, a.return);
					break;
				case 30: break;
				default: El(i, a, n);
			}
			t = t.sibling;
		}
	}
	function Dl(e, t) {
		var n = null;
		e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== n && (e != null && e.refCount++, n != null && pa(n));
	}
	function Ol(e, t) {
		e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && pa(e));
	}
	function kl(e, t, n, r) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) Al(e, t, n, r), t = t.sibling;
	}
	function Al(e, t, n, r) {
		var i = t.flags;
		switch (t.tag) {
			case 0:
			case 11:
			case 15:
				kl(e, t, n, r), i & 2048 && Wc(9, t);
				break;
			case 1:
				kl(e, t, n, r);
				break;
			case 3:
				kl(e, t, n, r), i & 2048 && (e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && pa(e)));
				break;
			case 12:
				if (i & 2048) {
					kl(e, t, n, r), e = t.stateNode;
					try {
						var a = t.memoizedProps, o = a.id, s = a.onPostCommit;
						typeof s == "function" && s(o, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0);
					} catch (e) {
						q(t, t.return, e);
					}
				} else kl(e, t, n, r);
				break;
			case 31:
				kl(e, t, n, r);
				break;
			case 13:
				kl(e, t, n, r);
				break;
			case 23: break;
			case 22:
				a = t.stateNode, o = t.alternate, t.memoizedState === null ? a._visibility & 2 ? kl(e, t, n, r) : (a._visibility |= 2, jl(e, t, n, r, (t.subtreeFlags & 10256) != 0 || !1)) : a._visibility & 2 ? kl(e, t, n, r) : Ml(e, t), i & 2048 && Dl(o, t);
				break;
			case 24:
				kl(e, t, n, r), i & 2048 && Ol(t.alternate, t);
				break;
			default: kl(e, t, n, r);
		}
	}
	function jl(e, t, n, r, i) {
		for (i = i && ((t.subtreeFlags & 10256) != 0 || !1), t = t.child; t !== null;) {
			var a = e, o = t, s = n, c = r, l = o.flags;
			switch (o.tag) {
				case 0:
				case 11:
				case 15:
					jl(a, o, s, c, i), Wc(8, o);
					break;
				case 23: break;
				case 22:
					var u = o.stateNode;
					o.memoizedState === null ? (u._visibility |= 2, jl(a, o, s, c, i)) : u._visibility & 2 ? jl(a, o, s, c, i) : Ml(a, o), i && l & 2048 && Dl(o.alternate, o);
					break;
				case 24:
					jl(a, o, s, c, i), i && l & 2048 && Ol(o.alternate, o);
					break;
				default: jl(a, o, s, c, i);
			}
			t = t.sibling;
		}
	}
	function Ml(e, t) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) {
			var n = e, r = t, i = r.flags;
			switch (r.tag) {
				case 22:
					Ml(n, r), i & 2048 && Dl(r.alternate, r);
					break;
				case 24:
					Ml(n, r), i & 2048 && Ol(r.alternate, r);
					break;
				default: Ml(n, r);
			}
			t = t.sibling;
		}
	}
	var Nl = 8192;
	function Pl(e, t, n) {
		if (e.subtreeFlags & Nl) for (e = e.child; e !== null;) Fl(e, t, n), e = e.sibling;
	}
	function Fl(e, t, n) {
		switch (e.tag) {
			case 26:
				Pl(e, t, n), e.flags & Nl && e.memoizedState !== null && Xf(n, bl, e.memoizedState, e.memoizedProps);
				break;
			case 5:
				Pl(e, t, n);
				break;
			case 3:
			case 4:
				var r = bl;
				bl = xf(e.stateNode.containerInfo), Pl(e, t, n), bl = r;
				break;
			case 22:
				e.memoizedState === null && (r = e.alternate, r !== null && r.memoizedState !== null ? (r = Nl, Nl = 16777216, Pl(e, t, n), Nl = r) : Pl(e, t, n));
				break;
			default: Pl(e, t, n);
		}
	}
	function Il(e) {
		var t = e.alternate;
		if (t !== null && (e = t.child, e !== null)) {
			t.child = null;
			do
				t = e.sibling, e.sibling = null, e = t;
			while (e !== null);
		}
	}
	function Ll(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				sl = r, Bl(r, e);
			}
			Il(e);
		}
		if (e.subtreeFlags & 10256) for (e = e.child; e !== null;) Rl(e), e = e.sibling;
	}
	function Rl(e) {
		switch (e.tag) {
			case 0:
			case 11:
			case 15:
				Ll(e), e.flags & 2048 && Gc(9, e, e.return);
				break;
			case 3:
				Ll(e);
				break;
			case 12:
				Ll(e);
				break;
			case 22:
				var t = e.stateNode;
				e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, zl(e)) : Ll(e);
				break;
			default: Ll(e);
		}
	}
	function zl(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				sl = r, Bl(r, e);
			}
			Il(e);
		}
		for (e = e.child; e !== null;) {
			switch (t = e, t.tag) {
				case 0:
				case 11:
				case 15:
					Gc(8, t, t.return), zl(t);
					break;
				case 22:
					n = t.stateNode, n._visibility & 2 && (n._visibility &= -3, zl(t));
					break;
				default: zl(t);
			}
			e = e.sibling;
		}
	}
	function Bl(e, t) {
		for (; sl !== null;) {
			var n = sl;
			switch (n.tag) {
				case 0:
				case 11:
				case 15:
					Gc(8, n, t);
					break;
				case 23:
				case 22:
					if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
						var r = n.memoizedState.cachePool.pool;
						r != null && r.refCount++;
					}
					break;
				case 24: pa(n.memoizedState.cache);
			}
			if (r = n.child, r !== null) r.return = n, sl = r;
			else a: for (n = e; sl !== null;) {
				r = sl;
				var i = r.sibling, a = r.return;
				if (ul(r), r === n) {
					sl = null;
					break a;
				}
				if (i !== null) {
					i.return = a, sl = i;
					break a;
				}
				sl = a;
			}
		}
	}
	var Vl = {
		getCacheForType: function(e) {
			var t = aa(da), n = t.data.get(e);
			return n === void 0 && (n = e(), t.data.set(e, n)), n;
		},
		cacheSignal: function() {
			return aa(da).controller.signal;
		}
	}, Hl = typeof WeakMap == "function" ? WeakMap : Map, U = 0, Ul = null, W = null, G = 0, K = 0, Wl = null, Gl = !1, Kl = !1, ql = !1, Jl = 0, Yl = 0, Xl = 0, Zl = 0, Ql = 0, $l = 0, eu = 0, tu = null, nu = null, ru = !1, iu = 0, au = 0, ou = Infinity, su = null, cu = null, lu = 0, uu = null, du = null, fu = 0, pu = 0, mu = null, hu = null, gu = 0, _u = null;
	function vu() {
		return U & 2 && G !== 0 ? G & -G : E.T === null ? ut() : gd();
	}
	function yu() {
		if ($l === 0) if (!(G & 536870912) || F) {
			var e = Ye;
			Ye <<= 1, !(Ye & 3932160) && (Ye = 262144), $l = e;
		} else $l = 536870912;
		return e = io.current, e !== null && (e.flags |= 32), $l;
	}
	function bu(e, t, n) {
		(e === Ul && (K === 2 || K === 9) || e.cancelPendingCommit !== null) && (Du(e, 0), wu(e, G, $l, !1)), rt(e, n), (!(U & 2) || e !== Ul) && (e === Ul && (!(U & 2) && (Zl |= n), Yl === 4 && wu(e, G, $l, !1)), cd(e));
	}
	function xu(e, t, n) {
		if (U & 6) throw Error(i(327));
		var r = !n && (t & 127) == 0 && (t & e.expiredLanes) === 0 || $e(e, t), a = r ? Fu(e, t) : Nu(e, t, !0), o = r;
		do {
			if (a === 0) {
				Kl && !r && wu(e, t, 0, !1);
				break;
			} else {
				if (n = e.current.alternate, o && !Cu(n)) {
					a = Nu(e, t, !1), o = !1;
					continue;
				}
				if (a === 2) {
					if (o = t, e.errorRecoveryDisabledLanes & o) var s = 0;
					else s = e.pendingLanes & -536870913, s = s === 0 ? s & 536870912 ? 536870912 : 0 : s;
					if (s !== 0) {
						t = s;
						a: {
							var c = e;
							a = tu;
							var l = c.current.memoizedState.isDehydrated;
							if (l && (Du(c, s).flags |= 256), s = Nu(c, s, !1), s !== 2) {
								if (ql && !l) {
									c.errorRecoveryDisabledLanes |= o, Zl |= o, a = 4;
									break a;
								}
								o = nu, nu = a, o !== null && (nu === null ? nu = o : nu.push.apply(nu, o));
							}
							a = s;
						}
						if (o = !1, a !== 2) continue;
					}
				}
				if (a === 1) {
					Du(e, 0), wu(e, t, 0, !0);
					break;
				}
				a: {
					switch (r = e, o = a, o) {
						case 0:
						case 1: throw Error(i(345));
						case 4: if ((t & 4194048) !== t) break;
						case 6:
							wu(r, t, $l, !Gl);
							break a;
						case 2:
							nu = null;
							break;
						case 3:
						case 5: break;
						default: throw Error(i(329));
					}
					if ((t & 62914560) === t && (a = iu + 300 - Me(), 10 < a)) {
						if (wu(r, t, $l, !Gl), Qe(r, 0, !0) !== 0) break a;
						fu = t, r.timeoutHandle = Zd(Su.bind(null, r, n, nu, su, ru, t, $l, Zl, eu, Gl, o, "Throttled", -0, 0), a);
						break a;
					}
					Su(r, n, nu, su, ru, t, $l, Zl, eu, Gl, o, null, -0, 0);
				}
			}
			break;
		} while (1);
		cd(e);
	}
	function Su(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
		if (e.timeoutHandle = -1, d = t.subtreeFlags, d & 8192 || (d & 16785408) == 16785408) {
			d = {
				stylesheets: null,
				count: 0,
				imgCount: 0,
				imgBytes: 0,
				suspenseyImages: [],
				waitingForImages: !0,
				waitingForViewTransition: !1,
				unsuspend: sn
			}, Fl(t, a, d);
			var m = (a & 62914560) === a ? iu - Me() : (a & 4194048) === a ? au - Me() : 0;
			if (m = Qf(d, m), m !== null) {
				fu = a, e.cancelPendingCommit = m(Hu.bind(null, e, t, a, n, r, i, o, s, c, u, d, null, f, p)), wu(e, a, o, !l);
				return;
			}
		}
		Hu(e, t, a, n, r, i, o, s, c);
	}
	function Cu(e) {
		for (var t = e;;) {
			var n = t.tag;
			if ((n === 0 || n === 11 || n === 15) && t.flags & 16384 && (n = t.updateQueue, n !== null && (n = n.stores, n !== null))) for (var r = 0; r < n.length; r++) {
				var i = n[r], a = i.getSnapshot;
				i = i.value;
				try {
					if (!Or(a(), i)) return !1;
				} catch {
					return !1;
				}
			}
			if (n = t.child, t.subtreeFlags & 16384 && n !== null) n.return = t, t = n;
			else {
				if (t === e) break;
				for (; t.sibling === null;) {
					if (t.return === null || t.return === e) return !0;
					t = t.return;
				}
				t.sibling.return = t.return, t = t.sibling;
			}
		}
		return !0;
	}
	function wu(e, t, n, r) {
		t &= ~Ql, t &= ~Zl, e.suspendedLanes |= t, e.pingedLanes &= ~t, r && (e.warmLanes |= t), r = e.expirationTimes;
		for (var i = t; 0 < i;) {
			var a = 31 - We(i), o = 1 << a;
			r[a] = -1, i &= ~o;
		}
		n !== 0 && at(e, n, t);
	}
	function Tu() {
		return U & 6 ? !0 : (ld(0, !1), !1);
	}
	function Eu() {
		if (W !== null) {
			if (K === 0) var e = W.return;
			else e = W, Zi = Xi = null, Mo(e), Ia = null, La = 0, e = W;
			for (; e !== null;) Uc(e.alternate, e), e = e.return;
			W = null;
		}
	}
	function Du(e, t) {
		var n = e.timeoutHandle;
		n !== -1 && (e.timeoutHandle = -1, Qd(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), fu = 0, Eu(), Ul = e, W = n = N(e.current, null), G = t, K = 0, Wl = null, Gl = !1, Kl = $e(e, t), ql = !1, eu = $l = Ql = Zl = Xl = Yl = 0, nu = tu = null, ru = !1, t & 8 && (t |= t & 32);
		var r = e.entangledLanes;
		if (r !== 0) for (e = e.entanglements, r &= t; 0 < r;) {
			var i = 31 - We(r), a = 1 << i;
			t |= e[i], r &= ~a;
		}
		return Jl = t, oi(), n;
	}
	function Ou(e, t) {
		z = null, E.H = Us, t === Ea || t === Oa ? (t = Pa(), K = 3) : t === Da ? (t = Pa(), K = 4) : K = t === sc ? 8 : typeof t == "object" && t && typeof t.then == "function" ? 6 : 1, Wl = t, W === null && (Yl = 1, tc(e, Si(t, e.current)));
	}
	function ku() {
		var e = io.current;
		return e === null ? !0 : (G & 4194048) === G ? ao === null : (G & 62914560) === G || G & 536870912 ? e === ao : !1;
	}
	function Au() {
		var e = E.H;
		return E.H = Us, e === null ? Us : e;
	}
	function ju() {
		var e = E.A;
		return E.A = Vl, e;
	}
	function Mu() {
		Yl = 4, Gl || (G & 4194048) !== G && io.current !== null || (Kl = !0), !(Xl & 134217727) && !(Zl & 134217727) || Ul === null || wu(Ul, G, $l, !1);
	}
	function Nu(e, t, n) {
		var r = U;
		U |= 2;
		var i = Au(), a = ju();
		(Ul !== e || G !== t) && (su = null, Du(e, t)), t = !1;
		var o = Yl;
		a: do
			try {
				if (K !== 0 && W !== null) {
					var s = W, c = Wl;
					switch (K) {
						case 8:
							Eu(), o = 6;
							break a;
						case 3:
						case 2:
						case 9:
						case 6:
							io.current === null && (t = !0);
							var l = K;
							if (K = 0, Wl = null, zu(e, s, c, l), n && Kl) {
								o = 0;
								break a;
							}
							break;
						default: l = K, K = 0, Wl = null, zu(e, s, c, l);
					}
				}
				Pu(), o = Yl;
				break;
			} catch (t) {
				Ou(e, t);
			}
		while (1);
		return t && e.shellSuspendCounter++, Zi = Xi = null, U = r, E.H = i, E.A = a, W === null && (Ul = null, G = 0, oi()), o;
	}
	function Pu() {
		for (; W !== null;) Lu(W);
	}
	function Fu(e, t) {
		var n = U;
		U |= 2;
		var r = Au(), a = ju();
		Ul !== e || G !== t ? (su = null, ou = Me() + 500, Du(e, t)) : Kl = $e(e, t);
		a: do
			try {
				if (K !== 0 && W !== null) {
					t = W;
					var o = Wl;
					b: switch (K) {
						case 1:
							K = 0, Wl = null, zu(e, t, o, 1);
							break;
						case 2:
						case 9:
							if (Aa(o)) {
								K = 0, Wl = null, Ru(t);
								break;
							}
							t = function() {
								K !== 2 && K !== 9 || Ul !== e || (K = 7), cd(e);
							}, o.then(t, t);
							break a;
						case 3:
							K = 7;
							break a;
						case 4:
							K = 5;
							break a;
						case 7:
							Aa(o) ? (K = 0, Wl = null, Ru(t)) : (K = 0, Wl = null, zu(e, t, o, 7));
							break;
						case 5:
							var s = null;
							switch (W.tag) {
								case 26: s = W.memoizedState;
								case 5:
								case 27:
									var c = W;
									if (s ? Yf(s) : c.stateNode.complete) {
										K = 0, Wl = null;
										var l = c.sibling;
										if (l !== null) W = l;
										else {
											var u = c.return;
											u === null ? W = null : (W = u, Bu(u));
										}
										break b;
									}
							}
							K = 0, Wl = null, zu(e, t, o, 5);
							break;
						case 6:
							K = 0, Wl = null, zu(e, t, o, 6);
							break;
						case 8:
							Eu(), Yl = 6;
							break a;
						default: throw Error(i(462));
					}
				}
				Iu();
				break;
			} catch (t) {
				Ou(e, t);
			}
		while (1);
		return Zi = Xi = null, E.H = r, E.A = a, U = n, W === null ? (Ul = null, G = 0, oi(), Yl) : 0;
	}
	function Iu() {
		for (; W !== null && !Ae();) Lu(W);
	}
	function Lu(e) {
		var t = Pc(e.alternate, e, Jl);
		e.memoizedProps = e.pendingProps, t === null ? Bu(e) : W = t;
	}
	function Ru(e) {
		var t = e, n = t.alternate;
		switch (t.tag) {
			case 15:
			case 0:
				t = xc(n, t, t.pendingProps, t.type, void 0, G);
				break;
			case 11:
				t = xc(n, t, t.pendingProps, t.type.render, t.ref, G);
				break;
			case 5: Mo(t);
			default: Uc(n, t), t = W = gi(t, Jl), t = Pc(n, t, Jl);
		}
		e.memoizedProps = e.pendingProps, t === null ? Bu(e) : W = t;
	}
	function zu(e, t, n, r) {
		Zi = Xi = null, Mo(t), Ia = null, La = 0;
		var i = t.return;
		try {
			if (oc(e, i, t, n, G)) {
				Yl = 1, tc(e, Si(n, e.current)), W = null;
				return;
			}
		} catch (t) {
			if (i !== null) throw W = i, t;
			Yl = 1, tc(e, Si(n, e.current)), W = null;
			return;
		}
		t.flags & 32768 ? (F || r === 1 ? e = !0 : Kl || G & 536870912 ? e = !1 : (Gl = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = io.current, r !== null && r.tag === 13 && (r.flags |= 16384))), Vu(t, e)) : Bu(t);
	}
	function Bu(e) {
		var t = e;
		do {
			if (t.flags & 32768) {
				Vu(t, Gl);
				return;
			}
			e = t.return;
			var n = Vc(t.alternate, t, Jl);
			if (n !== null) {
				W = n;
				return;
			}
			if (t = t.sibling, t !== null) {
				W = t;
				return;
			}
			W = t = e;
		} while (t !== null);
		Yl === 0 && (Yl = 5);
	}
	function Vu(e, t) {
		do {
			var n = Hc(e.alternate, e);
			if (n !== null) {
				n.flags &= 32767, W = n;
				return;
			}
			if (n = e.return, n !== null && (n.flags |= 32768, n.subtreeFlags = 0, n.deletions = null), !t && (e = e.sibling, e !== null)) {
				W = e;
				return;
			}
			W = e = n;
		} while (e !== null);
		Yl = 6, W = null;
	}
	function Hu(e, t, n, r, a, o, s, c, l) {
		e.cancelPendingCommit = null;
		do
			qu();
		while (lu !== 0);
		if (U & 6) throw Error(i(327));
		if (t !== null) {
			if (t === e.current) throw Error(i(177));
			if (o = t.lanes | t.childLanes, o |= ai, it(e, n, o, s, c, l), e === Ul && (W = Ul = null, G = 0), du = t, uu = e, fu = n, pu = o, mu = a, hu = r, t.subtreeFlags & 10256 || t.flags & 10256 ? (e.callbackNode = null, e.callbackPriority = 0, td(Ie, function() {
				return Ju(), null;
			})) : (e.callbackNode = null, e.callbackPriority = 0), r = (t.flags & 13878) != 0, t.subtreeFlags & 13878 || r) {
				r = E.T, E.T = null, a = D.p, D.p = 2, s = U, U |= 4;
				try {
					cl(e, t, n);
				} finally {
					U = s, D.p = a, E.T = r;
				}
			}
			lu = 1, Uu(), Wu(), Gu();
		}
	}
	function Uu() {
		if (lu === 1) {
			lu = 0;
			var e = uu, t = du, n = (t.flags & 13878) != 0;
			if (t.subtreeFlags & 13878 || n) {
				n = E.T, E.T = null;
				var r = D.p;
				D.p = 2;
				var i = U;
				U |= 4;
				try {
					xl(t, e);
					var a = Wd, o = Nr(e.containerInfo), s = a.focusedElem, c = a.selectionRange;
					if (o !== s && s && s.ownerDocument && Mr(s.ownerDocument.documentElement, s)) {
						if (c !== null && Pr(s)) {
							var l = c.start, u = c.end;
							if (u === void 0 && (u = l), "selectionStart" in s) s.selectionStart = l, s.selectionEnd = Math.min(u, s.value.length);
							else {
								var d = s.ownerDocument || document, f = d && d.defaultView || window;
								if (f.getSelection) {
									var p = f.getSelection(), m = s.textContent.length, h = Math.min(c.start, m), g = c.end === void 0 ? h : Math.min(c.end, m);
									!p.extend && h > g && (o = g, g = h, h = o);
									var _ = jr(s, h), v = jr(s, g);
									if (_ && v && (p.rangeCount !== 1 || p.anchorNode !== _.node || p.anchorOffset !== _.offset || p.focusNode !== v.node || p.focusOffset !== v.offset)) {
										var y = d.createRange();
										y.setStart(_.node, _.offset), p.removeAllRanges(), h > g ? (p.addRange(y), p.extend(v.node, v.offset)) : (y.setEnd(v.node, v.offset), p.addRange(y));
									}
								}
							}
						}
						for (d = [], p = s; p = p.parentNode;) p.nodeType === 1 && d.push({
							element: p,
							left: p.scrollLeft,
							top: p.scrollTop
						});
						for (typeof s.focus == "function" && s.focus(), s = 0; s < d.length; s++) {
							var b = d[s];
							b.element.scrollLeft = b.left, b.element.scrollTop = b.top;
						}
					}
					fp = !!Ud, Wd = Ud = null;
				} finally {
					U = i, D.p = r, E.T = n;
				}
			}
			e.current = t, lu = 2;
		}
	}
	function Wu() {
		if (lu === 2) {
			lu = 0;
			var e = uu, t = du, n = (t.flags & 8772) != 0;
			if (t.subtreeFlags & 8772 || n) {
				n = E.T, E.T = null;
				var r = D.p;
				D.p = 2;
				var i = U;
				U |= 4;
				try {
					ll(e, t.alternate, t);
				} finally {
					U = i, D.p = r, E.T = n;
				}
			}
			lu = 3;
		}
	}
	function Gu() {
		if (lu === 4 || lu === 3) {
			lu = 0, je();
			var e = uu, t = du, n = fu, r = hu;
			t.subtreeFlags & 10256 || t.flags & 10256 ? lu = 5 : (lu = 0, du = uu = null, Ku(e, e.pendingLanes));
			var i = e.pendingLanes;
			if (i === 0 && (cu = null), lt(n), t = t.stateNode, He && typeof He.onCommitFiberRoot == "function") try {
				He.onCommitFiberRoot(Ve, t, void 0, (t.current.flags & 128) == 128);
			} catch {}
			if (r !== null) {
				t = E.T, i = D.p, D.p = 2, E.T = null;
				try {
					for (var a = e.onRecoverableError, o = 0; o < r.length; o++) {
						var s = r[o];
						a(s.value, { componentStack: s.stack });
					}
				} finally {
					E.T = t, D.p = i;
				}
			}
			fu & 3 && qu(), cd(e), i = e.pendingLanes, n & 261930 && i & 42 ? e === _u ? gu++ : (gu = 0, _u = e) : gu = 0, ld(0, !1);
		}
	}
	function Ku(e, t) {
		(e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, pa(t)));
	}
	function qu() {
		return Uu(), Wu(), Gu(), Ju();
	}
	function Ju() {
		if (lu !== 5) return !1;
		var e = uu, t = pu;
		pu = 0;
		var n = lt(fu), r = E.T, a = D.p;
		try {
			D.p = 32 > n ? 32 : n, E.T = null, n = mu, mu = null;
			var o = uu, s = fu;
			if (lu = 0, du = uu = null, fu = 0, U & 6) throw Error(i(331));
			var c = U;
			if (U |= 4, Rl(o.current), Al(o, o.current, s, n), U = c, ld(0, !1), He && typeof He.onPostCommitFiberRoot == "function") try {
				He.onPostCommitFiberRoot(Ve, o);
			} catch {}
			return !0;
		} finally {
			D.p = a, E.T = r, Ku(e, t);
		}
	}
	function Yu(e, t, n) {
		t = Si(n, t), t = rc(e.stateNode, t, 2), e = Ka(e, t, 2), e !== null && (rt(e, 2), cd(e));
	}
	function q(e, t, n) {
		if (e.tag === 3) Yu(e, e, n);
		else for (; t !== null;) {
			if (t.tag === 3) {
				Yu(t, e, n);
				break;
			} else if (t.tag === 1) {
				var r = t.stateNode;
				if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (cu === null || !cu.has(r))) {
					e = Si(n, e), n = ic(2), r = Ka(t, n, 2), r !== null && (ac(n, r, t, e), rt(r, 2), cd(r));
					break;
				}
			}
			t = t.return;
		}
	}
	function Xu(e, t, n) {
		var r = e.pingCache;
		if (r === null) {
			r = e.pingCache = new Hl();
			var i = /* @__PURE__ */ new Set();
			r.set(t, i);
		} else i = r.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), r.set(t, i));
		i.has(n) || (ql = !0, i.add(n), e = Zu.bind(null, e, t, n), t.then(e, e));
	}
	function Zu(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), e.pingedLanes |= e.suspendedLanes & n, e.warmLanes &= ~n, Ul === e && (G & n) === n && (Yl === 4 || Yl === 3 && (G & 62914560) === G && 300 > Me() - iu ? !(U & 2) && Du(e, 0) : Ql |= n, eu === G && (eu = 0)), cd(e);
	}
	function Qu(e, t) {
		t === 0 && (t = tt()), e = li(e, t), e !== null && (rt(e, t), cd(e));
	}
	function $u(e) {
		var t = e.memoizedState, n = 0;
		t !== null && (n = t.retryLane), Qu(e, n);
	}
	function ed(e, t) {
		var n = 0;
		switch (e.tag) {
			case 31:
			case 13:
				var r = e.stateNode, a = e.memoizedState;
				a !== null && (n = a.retryLane);
				break;
			case 19:
				r = e.stateNode;
				break;
			case 22:
				r = e.stateNode._retryCache;
				break;
			default: throw Error(i(314));
		}
		r !== null && r.delete(t), Qu(e, n);
	}
	function td(e, t) {
		return Oe(e, t);
	}
	var nd = null, rd = null, id = !1, ad = !1, od = !1, sd = 0;
	function cd(e) {
		e !== rd && e.next === null && (rd === null ? nd = rd = e : rd = rd.next = e), ad = !0, id || (id = !0, hd());
	}
	function ld(e, t) {
		if (!od && ad) {
			od = !0;
			do
				for (var n = !1, r = nd; r !== null;) {
					if (!t) if (e !== 0) {
						var i = r.pendingLanes;
						if (i === 0) var a = 0;
						else {
							var o = r.suspendedLanes, s = r.pingedLanes;
							a = (1 << 31 - We(42 | e) + 1) - 1, a &= i & ~(o & ~s), a = a & 201326741 ? a & 201326741 | 1 : a ? a | 2 : 0;
						}
						a !== 0 && (n = !0, md(r, a));
					} else a = G, a = Qe(r, r === Ul ? a : 0, r.cancelPendingCommit !== null || r.timeoutHandle !== -1), !(a & 3) || $e(r, a) || (n = !0, md(r, a));
					r = r.next;
				}
			while (n);
			od = !1;
		}
	}
	function ud() {
		dd();
	}
	function dd() {
		ad = id = !1;
		var e = 0;
		sd !== 0 && Xd() && (e = sd);
		for (var t = Me(), n = null, r = nd; r !== null;) {
			var i = r.next, a = fd(r, t);
			a === 0 ? (r.next = null, n === null ? nd = i : n.next = i, i === null && (rd = n)) : (n = r, (e !== 0 || a & 3) && (ad = !0)), r = i;
		}
		lu !== 0 && lu !== 5 || ld(e, !1), sd !== 0 && (sd = 0);
	}
	function fd(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes & -62914561; 0 < a;) {
			var o = 31 - We(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = et(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
		if (t = Ul, n = G, n = Qe(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (K === 2 || K === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && ke(r), e.callbackNode = null, e.callbackPriority = 0;
		if (!(n & 3) || $e(e, n)) {
			if (t = n & -n, t === e.callbackPriority) return t;
			switch (r !== null && ke(r), lt(n)) {
				case 2:
				case 8:
					n = Fe;
					break;
				case 32:
					n = Ie;
					break;
				case 268435456:
					n = Re;
					break;
				default: n = Ie;
			}
			return r = pd.bind(null, e), n = Oe(n, r), e.callbackPriority = t, e.callbackNode = n, t;
		}
		return r !== null && r !== null && ke(r), e.callbackPriority = 2, e.callbackNode = null, 2;
	}
	function pd(e, t) {
		if (lu !== 0 && lu !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
		var n = e.callbackNode;
		if (qu() && e.callbackNode !== n) return null;
		var r = G;
		return r = Qe(e, e === Ul ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (xu(e, r, t), fd(e, Me()), e.callbackNode != null && e.callbackNode === n ? pd.bind(null, e) : null);
	}
	function md(e, t) {
		if (qu()) return null;
		xu(e, t, !0);
	}
	function hd() {
		ef(function() {
			U & 6 ? Oe(Pe, ud) : dd();
		});
	}
	function gd() {
		if (sd === 0) {
			var e = ga;
			e === 0 && (e = Je, Je <<= 1, !(Je & 261888) && (Je = 256)), sd = e;
		}
		return sd;
	}
	function _d(e) {
		return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : on("" + e);
	}
	function vd(e, t) {
		var n = t.ownerDocument.createElement("input");
		return n.name = t.name, n.value = t.value, e.id && n.setAttribute("form", e.id), t.parentNode.insertBefore(n, t), e = new FormData(e), n.parentNode.removeChild(n), e;
	}
	function yd(e, t, n, r, i) {
		if (t === "submit" && n && n.stateNode === i) {
			var a = _d((i[mt] || null).action), o = r.submitter;
			o && (t = (t = o[mt] || null) ? _d(t.formAction) : o.getAttribute("formAction"), t !== null && (a = t, o = null));
			var s = new Dn("action", "action", null, r, i);
			e.push({
				event: s,
				listeners: [{
					instance: null,
					listener: function() {
						if (r.defaultPrevented) {
							if (sd !== 0) {
								var e = o ? vd(i, o) : new FormData(i);
								ks(n, {
									pending: !0,
									data: e,
									method: i.method,
									action: a
								}, null, e);
							}
						} else typeof a == "function" && (s.preventDefault(), e = o ? vd(i, o) : new FormData(i), ks(n, {
							pending: !0,
							data: e,
							method: i.method,
							action: a
						}, a, e));
					},
					currentTarget: i
				}]
			});
		}
	}
	for (var bd = 0; bd < ei.length; bd++) {
		var xd = ei[bd];
		ti(xd.toLowerCase(), "on" + (xd[0].toUpperCase() + xd.slice(1)));
	}
	ti(Kr, "onAnimationEnd"), ti(qr, "onAnimationIteration"), ti(Jr, "onAnimationStart"), ti("dblclick", "onDoubleClick"), ti("focusin", "onFocus"), ti("focusout", "onBlur"), ti(Yr, "onTransitionRun"), ti(Xr, "onTransitionStart"), ti(Zr, "onTransitionCancel"), ti(Qr, "onTransitionEnd"), At("onMouseEnter", ["mouseout", "mouseover"]), At("onMouseLeave", ["mouseout", "mouseover"]), At("onPointerEnter", ["pointerout", "pointerover"]), At("onPointerLeave", ["pointerout", "pointerover"]), kt("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), kt("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), kt("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), kt("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), kt("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), kt("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
	var Sd = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), Cd = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Sd));
	function wd(e, t) {
		t = (t & 4) != 0;
		for (var n = 0; n < e.length; n++) {
			var r = e[n], i = r.event;
			r = r.listeners;
			a: {
				var a = void 0;
				if (t) for (var o = r.length - 1; 0 <= o; o--) {
					var s = r[o], c = s.instance, l = s.currentTarget;
					if (s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						ni(e);
					}
					i.currentTarget = null, a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						ni(e);
					}
					i.currentTarget = null, a = c;
				}
			}
		}
	}
	function J(e, t) {
		var n = t[gt];
		n === void 0 && (n = t[gt] = /* @__PURE__ */ new Set());
		var r = e + "__bubble";
		n.has(r) || (Od(t, e, 2, !1), n.add(r));
	}
	function Td(e, t, n) {
		var r = 0;
		t && (r |= 4), Od(n, e, r, t);
	}
	var Ed = "_reactListening" + Math.random().toString(36).slice(2);
	function Dd(e) {
		if (!e[Ed]) {
			e[Ed] = !0, Dt.forEach(function(t) {
				t !== "selectionchange" && (Cd.has(t) || Td(t, !1, e), Td(t, !0, e));
			});
			var t = e.nodeType === 9 ? e : e.ownerDocument;
			t === null || t[Ed] || (t[Ed] = !0, Td("selectionchange", !1, t));
		}
	}
	function Od(e, t, n, r) {
		switch (yp(t)) {
			case 2:
				var i = pp;
				break;
			case 8:
				i = mp;
				break;
			default: i = hp;
		}
		n = i.bind(null, t, n, e), i = void 0, !gn || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
			capture: !0,
			passive: i
		}) : i === void 0 ? e.addEventListener(t, n, !1) : e.addEventListener(t, n, { passive: i });
	}
	function kd(e, t, n, r, i) {
		var a = r;
		if (!(t & 1) && !(t & 2) && r !== null) a: for (;;) {
			if (r === null) return;
			var s = r.tag;
			if (s === 3 || s === 4) {
				var c = r.stateNode.containerInfo;
				if (c === i) break;
				if (s === 4) for (s = r.return; s !== null;) {
					var l = s.tag;
					if ((l === 3 || l === 4) && s.stateNode.containerInfo === i) return;
					s = s.return;
				}
				for (; c !== null;) {
					if (s = St(c), s === null) return;
					if (l = s.tag, l === 5 || l === 6 || l === 26 || l === 27) {
						r = a = s;
						continue a;
					}
					c = c.parentNode;
				}
			}
			r = r.return;
		}
		pn(function() {
			var r = a, i = cn(n), s = [];
			a: {
				var c = $r.get(e);
				if (c !== void 0) {
					var l = Dn, u = e;
					switch (e) {
						case "keypress": if (Sn(n) === 0) break a;
						case "keydown":
						case "keyup":
							l = Gn;
							break;
						case "focusin":
							u = "focus", l = In;
							break;
						case "focusout":
							u = "blur", l = In;
							break;
						case "beforeblur":
						case "afterblur":
							l = In;
							break;
						case "click": if (n.button === 2) break a;
						case "auxclick":
						case "dblclick":
						case "mousedown":
						case "mousemove":
						case "mouseup":
						case "mouseout":
						case "mouseover":
						case "contextmenu":
							l = Pn;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							l = Fn;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							l = qn;
							break;
						case Kr:
						case qr:
						case Jr:
							l = Ln;
							break;
						case Qr:
							l = Jn;
							break;
						case "scroll":
						case "scrollend":
							l = kn;
							break;
						case "wheel":
							l = Yn;
							break;
						case "copy":
						case "cut":
						case "paste":
							l = Rn;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							l = Kn;
							break;
						case "toggle":
						case "beforetoggle": l = Xn;
					}
					var d = (t & 4) != 0, f = !d && (e === "scroll" || e === "scrollend"), p = d ? c === null ? null : c + "Capture" : c;
					d = [];
					for (var m = r, h; m !== null;) {
						var g = m;
						if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = mn(m, p), g != null && d.push(Ad(m, g, h))), f) break;
						m = m.return;
					}
					0 < d.length && (c = new l(c, u, null, n, i), s.push({
						event: c,
						listeners: d
					}));
				}
			}
			if (!(t & 7)) {
				a: {
					if (c = e === "mouseover" || e === "pointerover", l = e === "mouseout" || e === "pointerout", c && n !== M && (u = n.relatedTarget || n.fromElement) && (St(u) || u[ht])) break a;
					if ((l || c) && (c = i.window === i ? i : (c = i.ownerDocument) ? c.defaultView || c.parentWindow : window, l ? (u = n.relatedTarget || n.toElement, l = r, u = u ? St(u) : null, u !== null && (f = o(u), d = u.tag, u !== f || d !== 5 && d !== 27 && d !== 6) && (u = null)) : (l = null, u = r), l !== u)) {
						if (d = Pn, g = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (d = Kn, g = "onPointerLeave", p = "onPointerEnter", m = "pointer"), f = l == null ? c : wt(l), h = u == null ? c : wt(u), c = new d(g, m + "leave", l, n, i), c.target = f, c.relatedTarget = h, g = null, St(i) === r && (d = new d(p, m + "enter", u, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, l && u) b: {
							for (d = Md, p = l, m = u, h = 0, g = p; g; g = d(g)) h++;
							g = 0;
							for (var _ = m; _; _ = d(_)) g++;
							for (; 0 < h - g;) p = d(p), h--;
							for (; 0 < g - h;) m = d(m), g--;
							for (; h--;) {
								if (p === m || m !== null && p === m.alternate) {
									d = p;
									break b;
								}
								p = d(p), m = d(m);
							}
							d = null;
						}
						else d = null;
						l !== null && Nd(s, c, l, d, !1), u !== null && f !== null && Nd(s, f, u, d, !0);
					}
				}
				a: {
					if (c = r ? wt(r) : window, l = c.nodeName && c.nodeName.toLowerCase(), l === "select" || l === "input" && c.type === "file") var v = gr;
					else if (ur(c)) if (_r) v = Er;
					else {
						v = wr;
						var y = Cr;
					}
					else l = c.nodeName, !l || l.toLowerCase() !== "input" || c.type !== "checkbox" && c.type !== "radio" ? r && nn(r.elementType) && (v = gr) : v = Tr;
					if (v && (v = v(e, r))) {
						dr(s, v, n, i);
						break a;
					}
					y && y(e, c, r), e === "focusout" && r && c.type === "number" && r.memoizedProps.value != null && Jt(c, "number", c.value);
				}
				switch (y = r ? wt(r) : window, e) {
					case "focusin":
						(ur(y) || y.contentEditable === "true") && (Ir = y, Lr = r, Rr = null);
						break;
					case "focusout":
						Rr = Lr = Ir = null;
						break;
					case "mousedown":
						zr = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						zr = !1, Br(s, n, i);
						break;
					case "selectionchange": if (Fr) break;
					case "keydown":
					case "keyup": Br(s, n, i);
				}
				var b;
				if (Qn) b: {
					switch (e) {
						case "compositionstart":
							var x = "onCompositionStart";
							break b;
						case "compositionend":
							x = "onCompositionEnd";
							break b;
						case "compositionupdate":
							x = "onCompositionUpdate";
							break b;
					}
					x = void 0;
				}
				else or ? ir(e, n) && (x = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (x = "onCompositionStart");
				x && (tr && n.locale !== "ko" && (or || x !== "onCompositionStart" ? x === "onCompositionEnd" && or && (b = xn()) : (vn = i, yn = "value" in vn ? vn.value : vn.textContent, or = !0)), y = jd(r, x), 0 < y.length && (x = new zn(x, e, null, n, i), s.push({
					event: x,
					listeners: y
				}), b ? x.data = b : (b = ar(n), b !== null && (x.data = b)))), (b = er ? sr(e, n) : cr(e, n)) && (x = jd(r, "onBeforeInput"), 0 < x.length && (y = new zn("onBeforeInput", "beforeinput", null, n, i), s.push({
					event: y,
					listeners: x
				}), y.data = b)), yd(s, e, r, n, i);
			}
			wd(s, t);
		});
	}
	function Ad(e, t, n) {
		return {
			instance: e,
			listener: t,
			currentTarget: n
		};
	}
	function jd(e, t) {
		for (var n = t + "Capture", r = []; e !== null;) {
			var i = e, a = i.stateNode;
			if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = mn(e, n), i != null && r.unshift(Ad(e, i, a)), i = mn(e, t), i != null && r.push(Ad(e, i, a))), e.tag === 3) return r;
			e = e.return;
		}
		return [];
	}
	function Md(e) {
		if (e === null) return null;
		do
			e = e.return;
		while (e && e.tag !== 5 && e.tag !== 27);
		return e || null;
	}
	function Nd(e, t, n, r, i) {
		for (var a = t._reactName, o = []; n !== null && n !== r;) {
			var s = n, c = s.alternate, l = s.stateNode;
			if (s = s.tag, c !== null && c === r) break;
			s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = mn(n, a), l != null && o.unshift(Ad(n, l, c))) : i || (l = mn(n, a), l != null && o.push(Ad(n, l, c)))), n = n.return;
		}
		o.length !== 0 && e.push({
			event: t,
			listeners: o
		});
	}
	var Pd = /\r\n?/g, Fd = /\u0000|\uFFFD/g;
	function Id(e) {
		return (typeof e == "string" ? e : "" + e).replace(Pd, "\n").replace(Fd, "");
	}
	function Ld(e, t) {
		return t = Id(t), Id(e) === t;
	}
	function Y(e, t, n, r, a, o) {
		switch (n) {
			case "children":
				typeof r == "string" ? t === "body" || t === "textarea" && r === "" || Qt(e, r) : (typeof r == "number" || typeof r == "bigint") && t !== "body" && Qt(e, "" + r);
				break;
			case "className":
				It(e, "class", r);
				break;
			case "tabIndex":
				It(e, "tabindex", r);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				It(e, n, r);
				break;
			case "style":
				tn(e, r, o);
				break;
			case "data": if (t !== "object") {
				It(e, "data", r);
				break;
			}
			case "src":
			case "href":
				if (r === "" && (t !== "a" || n !== "href")) {
					e.removeAttribute(n);
					break;
				}
				if (r == null || typeof r == "function" || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = on("" + r), e.setAttribute(n, r);
				break;
			case "action":
			case "formAction":
				if (typeof r == "function") {
					e.setAttribute(n, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
					break;
				} else typeof o == "function" && (n === "formAction" ? (t !== "input" && Y(e, t, "name", a.name, a, null), Y(e, t, "formEncType", a.formEncType, a, null), Y(e, t, "formMethod", a.formMethod, a, null), Y(e, t, "formTarget", a.formTarget, a, null)) : (Y(e, t, "encType", a.encType, a, null), Y(e, t, "method", a.method, a, null), Y(e, t, "target", a.target, a, null)));
				if (r == null || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = on("" + r), e.setAttribute(n, r);
				break;
			case "onClick":
				r != null && (e.onclick = sn);
				break;
			case "onScroll":
				r != null && J("scroll", e);
				break;
			case "onScrollEnd":
				r != null && J("scrollend", e);
				break;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						e.innerHTML = n;
					}
				}
				break;
			case "multiple":
				e.multiple = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "muted":
				e.muted = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "defaultValue":
			case "defaultChecked":
			case "innerHTML":
			case "ref": break;
			case "autoFocus": break;
			case "xlinkHref":
				if (r == null || typeof r == "function" || typeof r == "boolean" || typeof r == "symbol") {
					e.removeAttribute("xlink:href");
					break;
				}
				n = on("" + r), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
				break;
			case "contentEditable":
			case "spellCheck":
			case "draggable":
			case "value":
			case "autoReverse":
			case "externalResourcesRequired":
			case "focusable":
			case "preserveAlpha":
				r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, "" + r) : e.removeAttribute(n);
				break;
			case "inert":
			case "allowFullScreen":
			case "async":
			case "autoPlay":
			case "controls":
			case "default":
			case "defer":
			case "disabled":
			case "disablePictureInPicture":
			case "disableRemotePlayback":
			case "formNoValidate":
			case "hidden":
			case "loop":
			case "noModule":
			case "noValidate":
			case "open":
			case "playsInline":
			case "readOnly":
			case "required":
			case "reversed":
			case "scoped":
			case "seamless":
			case "itemScope":
				r && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, "") : e.removeAttribute(n);
				break;
			case "capture":
			case "download":
				!0 === r ? e.setAttribute(n, "") : !1 !== r && r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "cols":
			case "rows":
			case "size":
			case "span":
				r != null && typeof r != "function" && typeof r != "symbol" && !isNaN(r) && 1 <= r ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "rowSpan":
			case "start":
				r == null || typeof r == "function" || typeof r == "symbol" || isNaN(r) ? e.removeAttribute(n) : e.setAttribute(n, r);
				break;
			case "popover":
				J("beforetoggle", e), J("toggle", e), Ft(e, "popover", r);
				break;
			case "xlinkActuate":
				Lt(e, "http://www.w3.org/1999/xlink", "xlink:actuate", r);
				break;
			case "xlinkArcrole":
				Lt(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", r);
				break;
			case "xlinkRole":
				Lt(e, "http://www.w3.org/1999/xlink", "xlink:role", r);
				break;
			case "xlinkShow":
				Lt(e, "http://www.w3.org/1999/xlink", "xlink:show", r);
				break;
			case "xlinkTitle":
				Lt(e, "http://www.w3.org/1999/xlink", "xlink:title", r);
				break;
			case "xlinkType":
				Lt(e, "http://www.w3.org/1999/xlink", "xlink:type", r);
				break;
			case "xmlBase":
				Lt(e, "http://www.w3.org/XML/1998/namespace", "xml:base", r);
				break;
			case "xmlLang":
				Lt(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", r);
				break;
			case "xmlSpace":
				Lt(e, "http://www.w3.org/XML/1998/namespace", "xml:space", r);
				break;
			case "is":
				Ft(e, "is", r);
				break;
			case "innerText":
			case "textContent": break;
			default: (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") && (n = rn.get(n) || n, Ft(e, n, r));
		}
	}
	function Rd(e, t, n, r, a, o) {
		switch (n) {
			case "style":
				tn(e, r, o);
				break;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						e.innerHTML = n;
					}
				}
				break;
			case "children":
				typeof r == "string" ? Qt(e, r) : (typeof r == "number" || typeof r == "bigint") && Qt(e, "" + r);
				break;
			case "onScroll":
				r != null && J("scroll", e);
				break;
			case "onScrollEnd":
				r != null && J("scrollend", e);
				break;
			case "onClick":
				r != null && (e.onclick = sn);
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "innerHTML":
			case "ref": break;
			case "innerText":
			case "textContent": break;
			default: if (!Ot.hasOwnProperty(n)) a: {
				if (n[0] === "o" && n[1] === "n" && (a = n.endsWith("Capture"), t = n.slice(2, a ? n.length - 7 : void 0), o = e[mt] || null, o = o == null ? null : o[n], typeof o == "function" && e.removeEventListener(t, o, a), typeof r == "function")) {
					typeof o != "function" && o !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)), e.addEventListener(t, r, a);
					break a;
				}
				n in e ? e[n] = r : !0 === r ? e.setAttribute(n, "") : Ft(e, n, r);
			}
		}
	}
	function zd(e, t, n) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "img":
				J("error", e), J("load", e);
				var r = !1, a = !1, o;
				for (o in n) if (n.hasOwnProperty(o)) {
					var s = n[o];
					if (s != null) switch (o) {
						case "src":
							r = !0;
							break;
						case "srcSet":
							a = !0;
							break;
						case "children":
						case "dangerouslySetInnerHTML": throw Error(i(137, t));
						default: Y(e, t, o, s, n, null);
					}
				}
				a && Y(e, t, "srcSet", n.srcSet, n, null), r && Y(e, t, "src", n.src, n, null);
				return;
			case "input":
				J("invalid", e);
				var c = o = s = a = null, l = null, u = null;
				for (r in n) if (n.hasOwnProperty(r)) {
					var d = n[r];
					if (d != null) switch (r) {
						case "name":
							a = d;
							break;
						case "type":
							s = d;
							break;
						case "checked":
							l = d;
							break;
						case "defaultChecked":
							u = d;
							break;
						case "value":
							o = d;
							break;
						case "defaultValue":
							c = d;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (d != null) throw Error(i(137, t));
							break;
						default: Y(e, t, r, d, n, null);
					}
				}
				qt(e, o, c, l, u, s, a, !1);
				return;
			case "select":
				for (a in J("invalid", e), r = s = o = null, n) if (n.hasOwnProperty(a) && (c = n[a], c != null)) switch (a) {
					case "value":
						o = c;
						break;
					case "defaultValue":
						s = c;
						break;
					case "multiple": r = c;
					default: Y(e, t, a, c, n, null);
				}
				t = o, n = s, e.multiple = !!r, t == null ? n != null && Yt(e, !!r, n, !0) : Yt(e, !!r, t, !1);
				return;
			case "textarea":
				for (s in J("invalid", e), o = a = r = null, n) if (n.hasOwnProperty(s) && (c = n[s], c != null)) switch (s) {
					case "value":
						r = c;
						break;
					case "defaultValue":
						a = c;
						break;
					case "children":
						o = c;
						break;
					case "dangerouslySetInnerHTML":
						if (c != null) throw Error(i(91));
						break;
					default: Y(e, t, s, c, n, null);
				}
				Zt(e, r, a, o);
				return;
			case "option":
				for (l in n) if (n.hasOwnProperty(l) && (r = n[l], r != null)) switch (l) {
					case "selected":
						e.selected = r && typeof r != "function" && typeof r != "symbol";
						break;
					default: Y(e, t, l, r, n, null);
				}
				return;
			case "dialog":
				J("beforetoggle", e), J("toggle", e), J("cancel", e), J("close", e);
				break;
			case "iframe":
			case "object":
				J("load", e);
				break;
			case "video":
			case "audio":
				for (r = 0; r < Sd.length; r++) J(Sd[r], e);
				break;
			case "image":
				J("error", e), J("load", e);
				break;
			case "details":
				J("toggle", e);
				break;
			case "embed":
			case "source":
			case "link": J("error", e), J("load", e);
			case "area":
			case "base":
			case "br":
			case "col":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "track":
			case "wbr":
			case "menuitem":
				for (u in n) if (n.hasOwnProperty(u) && (r = n[u], r != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML": throw Error(i(137, t));
					default: Y(e, t, u, r, n, null);
				}
				return;
			default: if (nn(t)) {
				for (d in n) n.hasOwnProperty(d) && (r = n[d], r !== void 0 && Rd(e, t, d, r, n, void 0));
				return;
			}
		}
		for (c in n) n.hasOwnProperty(c) && (r = n[c], r != null && Y(e, t, c, r, n, null));
	}
	function Bd(e, t, n, r) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "input":
				var a = null, o = null, s = null, c = null, l = null, u = null, d = null;
				for (m in n) {
					var f = n[m];
					if (n.hasOwnProperty(m) && f != null) switch (m) {
						case "checked": break;
						case "value": break;
						case "defaultValue": l = f;
						default: r.hasOwnProperty(m) || Y(e, t, m, null, r, f);
					}
				}
				for (var p in r) {
					var m = r[p];
					if (f = n[p], r.hasOwnProperty(p) && (m != null || f != null)) switch (p) {
						case "type":
							o = m;
							break;
						case "name":
							a = m;
							break;
						case "checked":
							u = m;
							break;
						case "defaultChecked":
							d = m;
							break;
						case "value":
							s = m;
							break;
						case "defaultValue":
							c = m;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (m != null) throw Error(i(137, t));
							break;
						default: m !== f && Y(e, t, p, m, r, f);
					}
				}
				Kt(e, s, c, l, u, d, o, a);
				return;
			case "select":
				for (o in m = s = c = p = null, n) if (l = n[o], n.hasOwnProperty(o) && l != null) switch (o) {
					case "value": break;
					case "multiple": m = l;
					default: r.hasOwnProperty(o) || Y(e, t, o, null, r, l);
				}
				for (a in r) if (o = r[a], l = n[a], r.hasOwnProperty(a) && (o != null || l != null)) switch (a) {
					case "value":
						p = o;
						break;
					case "defaultValue":
						c = o;
						break;
					case "multiple": s = o;
					default: o !== l && Y(e, t, a, o, r, l);
				}
				t = c, n = s, r = m, p == null ? !!r != !!n && (t == null ? Yt(e, !!n, n ? [] : "", !1) : Yt(e, !!n, t, !0)) : Yt(e, !!n, p, !1);
				return;
			case "textarea":
				for (c in m = p = null, n) if (a = n[c], n.hasOwnProperty(c) && a != null && !r.hasOwnProperty(c)) switch (c) {
					case "value": break;
					case "children": break;
					default: Y(e, t, c, null, r, a);
				}
				for (s in r) if (a = r[s], o = n[s], r.hasOwnProperty(s) && (a != null || o != null)) switch (s) {
					case "value":
						p = a;
						break;
					case "defaultValue":
						m = a;
						break;
					case "children": break;
					case "dangerouslySetInnerHTML":
						if (a != null) throw Error(i(91));
						break;
					default: a !== o && Y(e, t, s, a, r, o);
				}
				Xt(e, p, m);
				return;
			case "option":
				for (var h in n) if (p = n[h], n.hasOwnProperty(h) && p != null && !r.hasOwnProperty(h)) switch (h) {
					case "selected":
						e.selected = !1;
						break;
					default: Y(e, t, h, null, r, p);
				}
				for (l in r) if (p = r[l], m = n[l], r.hasOwnProperty(l) && p !== m && (p != null || m != null)) switch (l) {
					case "selected":
						e.selected = p && typeof p != "function" && typeof p != "symbol";
						break;
					default: Y(e, t, l, p, r, m);
				}
				return;
			case "img":
			case "link":
			case "area":
			case "base":
			case "br":
			case "col":
			case "embed":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "source":
			case "track":
			case "wbr":
			case "menuitem":
				for (var g in n) p = n[g], n.hasOwnProperty(g) && p != null && !r.hasOwnProperty(g) && Y(e, t, g, null, r, p);
				for (u in r) if (p = r[u], m = n[u], r.hasOwnProperty(u) && p !== m && (p != null || m != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML":
						if (p != null) throw Error(i(137, t));
						break;
					default: Y(e, t, u, p, r, m);
				}
				return;
			default: if (nn(t)) {
				for (var _ in n) p = n[_], n.hasOwnProperty(_) && p !== void 0 && !r.hasOwnProperty(_) && Rd(e, t, _, void 0, r, p);
				for (d in r) p = r[d], m = n[d], !r.hasOwnProperty(d) || p === m || p === void 0 && m === void 0 || Rd(e, t, d, p, r, m);
				return;
			}
		}
		for (var v in n) p = n[v], n.hasOwnProperty(v) && p != null && !r.hasOwnProperty(v) && Y(e, t, v, null, r, p);
		for (f in r) p = r[f], m = n[f], !r.hasOwnProperty(f) || p === m || p == null && m == null || Y(e, t, f, p, r, m);
	}
	function Vd(e) {
		switch (e) {
			case "css":
			case "script":
			case "font":
			case "img":
			case "image":
			case "input":
			case "link": return !0;
			default: return !1;
		}
	}
	function Hd() {
		if (typeof performance.getEntriesByType == "function") {
			for (var e = 0, t = 0, n = performance.getEntriesByType("resource"), r = 0; r < n.length; r++) {
				var i = n[r], a = i.transferSize, o = i.initiatorType, s = i.duration;
				if (a && s && Vd(o)) {
					for (o = 0, s = i.responseEnd, r += 1; r < n.length; r++) {
						var c = n[r], l = c.startTime;
						if (l > s) break;
						var u = c.transferSize, d = c.initiatorType;
						u && Vd(d) && (c = c.responseEnd, o += u * (c < s ? 1 : (s - l) / (c - l)));
					}
					if (--r, t += 8 * (a + o) / (i.duration / 1e3), e++, 10 < e) break;
				}
			}
			if (0 < e) return t / e / 1e6;
		}
		return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
	}
	var Ud = null, Wd = null;
	function Gd(e) {
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	function Kd(e) {
		switch (e) {
			case "http://www.w3.org/2000/svg": return 1;
			case "http://www.w3.org/1998/Math/MathML": return 2;
			default: return 0;
		}
	}
	function qd(e, t) {
		if (e === 0) switch (t) {
			case "svg": return 1;
			case "math": return 2;
			default: return 0;
		}
		return e === 1 && t === "foreignObject" ? 0 : e;
	}
	function Jd(e, t) {
		return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
	}
	var Yd = null;
	function Xd() {
		var e = window.event;
		return e && e.type === "popstate" ? e === Yd ? !1 : (Yd = e, !0) : (Yd = null, !1);
	}
	var Zd = typeof setTimeout == "function" ? setTimeout : void 0, Qd = typeof clearTimeout == "function" ? clearTimeout : void 0, $d = typeof Promise == "function" ? Promise : void 0, ef = typeof queueMicrotask == "function" ? queueMicrotask : $d === void 0 ? Zd : function(e) {
		return $d.resolve(null).then(e).catch(tf);
	};
	function tf(e) {
		setTimeout(function() {
			throw e;
		});
	}
	function nf(e) {
		return e === "head";
	}
	function rf(e, t) {
		var n = t, r = 0;
		do {
			var i = n.nextSibling;
			if (e.removeChild(n), i && i.nodeType === 8) if (n = i.data, n === "/$" || n === "/&") {
				if (r === 0) {
					e.removeChild(i), Rp(t);
					return;
				}
				r--;
			} else if (n === "$" || n === "$?" || n === "$~" || n === "$!" || n === "&") r++;
			else if (n === "html") vf(e.ownerDocument.documentElement);
			else if (n === "head") {
				n = e.ownerDocument.head, vf(n);
				for (var a = n.firstChild; a;) {
					var o = a.nextSibling, s = a.nodeName;
					a[bt] || s === "SCRIPT" || s === "STYLE" || s === "LINK" && a.rel.toLowerCase() === "stylesheet" || n.removeChild(a), a = o;
				}
			} else n === "body" && vf(e.ownerDocument.body);
			n = i;
		} while (n);
		Rp(t);
	}
	function af(e, t) {
		var n = e;
		e = 0;
		do {
			var r = n.nextSibling;
			if (n.nodeType === 1 ? t ? (n._stashedDisplay = n.style.display, n.style.display = "none") : (n.style.display = n._stashedDisplay || "", n.getAttribute("style") === "" && n.removeAttribute("style")) : n.nodeType === 3 && (t ? (n._stashedText = n.nodeValue, n.nodeValue = "") : n.nodeValue = n._stashedText || ""), r && r.nodeType === 8) if (n = r.data, n === "/$") {
				if (e === 0) break;
				e--;
			} else n !== "$" && n !== "$?" && n !== "$~" && n !== "$!" || e++;
			n = r;
		} while (n);
	}
	function of(e) {
		var t = e.firstChild;
		for (t && t.nodeType === 10 && (t = t.nextSibling); t;) {
			var n = t;
			switch (t = t.nextSibling, n.nodeName) {
				case "HTML":
				case "HEAD":
				case "BODY":
					of(n), xt(n);
					continue;
				case "SCRIPT":
				case "STYLE": continue;
				case "LINK": if (n.rel.toLowerCase() === "stylesheet") continue;
			}
			e.removeChild(n);
		}
	}
	function sf(e, t, n, r) {
		for (; e.nodeType === 1;) {
			var i = n;
			if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
				if (!r && (e.nodeName !== "INPUT" || e.type !== "hidden")) break;
			} else if (!r) if (t === "input" && e.type === "hidden") {
				var a = i.name == null ? null : "" + i.name;
				if (i.type === "hidden" && e.getAttribute("name") === a) return e;
			} else return e;
			else if (!e[bt]) switch (t) {
				case "meta":
					if (!e.hasAttribute("itemprop")) break;
					return e;
				case "link":
					if (a = e.getAttribute("rel"), a === "stylesheet" && e.hasAttribute("data-precedence") || a !== i.rel || e.getAttribute("href") !== (i.href == null || i.href === "" ? null : i.href) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin) || e.getAttribute("title") !== (i.title == null ? null : i.title)) break;
					return e;
				case "style":
					if (e.hasAttribute("data-precedence")) break;
					return e;
				case "script":
					if (a = e.getAttribute("src"), (a !== (i.src == null ? null : i.src) || e.getAttribute("type") !== (i.type == null ? null : i.type) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin)) && a && e.hasAttribute("async") && !e.hasAttribute("itemprop")) break;
					return e;
				default: return e;
			}
			if (e = pf(e.nextSibling), e === null) break;
		}
		return null;
	}
	function cf(e, t, n) {
		if (t === "") return null;
		for (; e.nodeType !== 3;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !n || (e = pf(e.nextSibling), e === null)) return null;
		return e;
	}
	function lf(e, t) {
		for (; e.nodeType !== 8;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = pf(e.nextSibling), e === null)) return null;
		return e;
	}
	function uf(e) {
		return e.data === "$?" || e.data === "$~";
	}
	function df(e) {
		return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
	}
	function ff(e, t) {
		var n = e.ownerDocument;
		if (e.data === "$~") e._reactRetry = t;
		else if (e.data !== "$?" || n.readyState !== "loading") t();
		else {
			var r = function() {
				t(), n.removeEventListener("DOMContentLoaded", r);
			};
			n.addEventListener("DOMContentLoaded", r), e._reactRetry = r;
		}
	}
	function pf(e) {
		for (; e != null; e = e.nextSibling) {
			var t = e.nodeType;
			if (t === 1 || t === 3) break;
			if (t === 8) {
				if (t = e.data, t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F") break;
				if (t === "/$" || t === "/&") return null;
			}
		}
		return e;
	}
	var mf = null;
	function hf(e) {
		e = e.nextSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "/$" || n === "/&") {
					if (t === 0) return pf(e.nextSibling);
					t--;
				} else n !== "$" && n !== "$!" && n !== "$?" && n !== "$~" && n !== "&" || t++;
			}
			e = e.nextSibling;
		}
		return null;
	}
	function gf(e) {
		e = e.previousSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "$" || n === "$!" || n === "$?" || n === "$~" || n === "&") {
					if (t === 0) return e;
					t--;
				} else n !== "/$" && n !== "/&" || t++;
			}
			e = e.previousSibling;
		}
		return null;
	}
	function _f(e, t, n) {
		switch (t = Gd(n), e) {
			case "html":
				if (e = t.documentElement, !e) throw Error(i(452));
				return e;
			case "head":
				if (e = t.head, !e) throw Error(i(453));
				return e;
			case "body":
				if (e = t.body, !e) throw Error(i(454));
				return e;
			default: throw Error(i(451));
		}
	}
	function vf(e) {
		for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
		xt(e);
	}
	var yf = /* @__PURE__ */ new Map(), bf = /* @__PURE__ */ new Set();
	function xf(e) {
		return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument;
	}
	var Sf = D.d;
	D.d = {
		f: Cf,
		r: wf,
		D: Df,
		C: Of,
		L: kf,
		m: Af,
		X: Mf,
		S: jf,
		M: Nf
	};
	function Cf() {
		var e = Sf.f(), t = Tu();
		return e || t;
	}
	function wf(e) {
		var t = Ct(e);
		t !== null && t.tag === 5 && t.type === "form" ? js(t) : Sf.r(e);
	}
	var Tf = typeof document > "u" ? null : document;
	function Ef(e, t, n) {
		var r = Tf;
		if (r && typeof t == "string" && t) {
			var i = Gt(t);
			i = "link[rel=\"" + e + "\"][href=\"" + i + "\"]", typeof n == "string" && (i += "[crossorigin=\"" + n + "\"]"), bf.has(i) || (bf.add(i), e = {
				rel: e,
				crossOrigin: n,
				href: t
			}, r.querySelector(i) === null && (t = r.createElement("link"), zd(t, "link", e), Et(t), r.head.appendChild(t)));
		}
	}
	function Df(e) {
		Sf.D(e), Ef("dns-prefetch", e, null);
	}
	function Of(e, t) {
		Sf.C(e, t), Ef("preconnect", e, t);
	}
	function kf(e, t, n) {
		Sf.L(e, t, n);
		var r = Tf;
		if (r && e && t) {
			var i = "link[rel=\"preload\"][as=\"" + Gt(t) + "\"]";
			t === "image" && n && n.imageSrcSet ? (i += "[imagesrcset=\"" + Gt(n.imageSrcSet) + "\"]", typeof n.imageSizes == "string" && (i += "[imagesizes=\"" + Gt(n.imageSizes) + "\"]")) : i += "[href=\"" + Gt(e) + "\"]";
			var a = i;
			switch (t) {
				case "style":
					a = Ff(e);
					break;
				case "script": a = zf(e);
			}
			yf.has(a) || (e = h({
				rel: "preload",
				href: t === "image" && n && n.imageSrcSet ? void 0 : e,
				as: t
			}, n), yf.set(a, e), r.querySelector(i) !== null || t === "style" && r.querySelector(If(a)) || t === "script" && r.querySelector(Bf(a)) || (t = r.createElement("link"), zd(t, "link", e), Et(t), r.head.appendChild(t)));
		}
	}
	function Af(e, t) {
		Sf.m(e, t);
		var n = Tf;
		if (n && e) {
			var r = t && typeof t.as == "string" ? t.as : "script", i = "link[rel=\"modulepreload\"][as=\"" + Gt(r) + "\"][href=\"" + Gt(e) + "\"]", a = i;
			switch (r) {
				case "audioworklet":
				case "paintworklet":
				case "serviceworker":
				case "sharedworker":
				case "worker":
				case "script": a = zf(e);
			}
			if (!yf.has(a) && (e = h({
				rel: "modulepreload",
				href: e
			}, t), yf.set(a, e), n.querySelector(i) === null)) {
				switch (r) {
					case "audioworklet":
					case "paintworklet":
					case "serviceworker":
					case "sharedworker":
					case "worker":
					case "script": if (n.querySelector(Bf(a))) return;
				}
				r = n.createElement("link"), zd(r, "link", e), Et(r), n.head.appendChild(r);
			}
		}
	}
	function jf(e, t, n) {
		Sf.S(e, t, n);
		var r = Tf;
		if (r && e) {
			var i = Tt(r).hoistableStyles, a = Ff(e);
			t = t || "default";
			var o = i.get(a);
			if (!o) {
				var s = {
					loading: 0,
					preload: null
				};
				if (o = r.querySelector(If(a))) s.loading = 5;
				else {
					e = h({
						rel: "stylesheet",
						href: e,
						"data-precedence": t
					}, n), (n = yf.get(a)) && Uf(e, n);
					var c = o = r.createElement("link");
					Et(c), zd(c, "link", e), c._p = new Promise(function(e, t) {
						c.onload = e, c.onerror = t;
					}), c.addEventListener("load", function() {
						s.loading |= 1;
					}), c.addEventListener("error", function() {
						s.loading |= 2;
					}), s.loading |= 4, Hf(o, t, r);
				}
				o = {
					type: "stylesheet",
					instance: o,
					count: 1,
					state: s
				}, i.set(a, o);
			}
		}
	}
	function Mf(e, t) {
		Sf.X(e, t);
		var n = Tf;
		if (n && e) {
			var r = Tt(n).hoistableScripts, i = zf(e), a = r.get(i);
			a || (a = n.querySelector(Bf(i)), a || (e = h({
				src: e,
				async: !0
			}, t), (t = yf.get(i)) && Wf(e, t), a = n.createElement("script"), Et(a), zd(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Nf(e, t) {
		Sf.M(e, t);
		var n = Tf;
		if (n && e) {
			var r = Tt(n).hoistableScripts, i = zf(e), a = r.get(i);
			a || (a = n.querySelector(Bf(i)), a || (e = h({
				src: e,
				async: !0,
				type: "module"
			}, t), (t = yf.get(i)) && Wf(e, t), a = n.createElement("script"), Et(a), zd(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Pf(e, t, n, r) {
		var a = (a = j.current) ? xf(a) : null;
		if (!a) throw Error(i(446));
		switch (e) {
			case "meta":
			case "title": return null;
			case "style": return typeof n.precedence == "string" && typeof n.href == "string" ? (t = Ff(n.href), n = Tt(a).hoistableStyles, r = n.get(t), r || (r = {
				type: "style",
				instance: null,
				count: 0,
				state: null
			}, n.set(t, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			case "link":
				if (n.rel === "stylesheet" && typeof n.href == "string" && typeof n.precedence == "string") {
					e = Ff(n.href);
					var o = Tt(a).hoistableStyles, s = o.get(e);
					if (s || (a = a.ownerDocument || a, s = {
						type: "stylesheet",
						instance: null,
						count: 0,
						state: {
							loading: 0,
							preload: null
						}
					}, o.set(e, s), (o = a.querySelector(If(e))) && !o._p && (s.instance = o, s.state.loading = 5), yf.has(e) || (n = {
						rel: "preload",
						as: "style",
						href: n.href,
						crossOrigin: n.crossOrigin,
						integrity: n.integrity,
						media: n.media,
						hrefLang: n.hrefLang,
						referrerPolicy: n.referrerPolicy
					}, yf.set(e, n), o || Rf(a, e, n, s.state))), t && r === null) throw Error(i(528, ""));
					return s;
				}
				if (t && r !== null) throw Error(i(529, ""));
				return null;
			case "script": return t = n.async, n = n.src, typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = zf(n), n = Tt(a).hoistableScripts, r = n.get(t), r || (r = {
				type: "script",
				instance: null,
				count: 0,
				state: null
			}, n.set(t, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			default: throw Error(i(444, e));
		}
	}
	function Ff(e) {
		return "href=\"" + Gt(e) + "\"";
	}
	function If(e) {
		return "link[rel=\"stylesheet\"][" + e + "]";
	}
	function Lf(e) {
		return h({}, e, {
			"data-precedence": e.precedence,
			precedence: null
		});
	}
	function Rf(e, t, n, r) {
		e.querySelector("link[rel=\"preload\"][as=\"style\"][" + t + "]") ? r.loading = 1 : (t = e.createElement("link"), r.preload = t, t.addEventListener("load", function() {
			return r.loading |= 1;
		}), t.addEventListener("error", function() {
			return r.loading |= 2;
		}), zd(t, "link", n), Et(t), e.head.appendChild(t));
	}
	function zf(e) {
		return "[src=\"" + Gt(e) + "\"]";
	}
	function Bf(e) {
		return "script[async]" + e;
	}
	function Vf(e, t, n) {
		if (t.count++, t.instance === null) switch (t.type) {
			case "style":
				var r = e.querySelector("style[data-href~=\"" + Gt(n.href) + "\"]");
				if (r) return t.instance = r, Et(r), r;
				var a = h({}, n, {
					"data-href": n.href,
					"data-precedence": n.precedence,
					href: null,
					precedence: null
				});
				return r = (e.ownerDocument || e).createElement("style"), Et(r), zd(r, "style", a), Hf(r, n.precedence, e), t.instance = r;
			case "stylesheet":
				a = Ff(n.href);
				var o = e.querySelector(If(a));
				if (o) return t.state.loading |= 4, t.instance = o, Et(o), o;
				r = Lf(n), (a = yf.get(a)) && Uf(r, a), o = (e.ownerDocument || e).createElement("link"), Et(o);
				var s = o;
				return s._p = new Promise(function(e, t) {
					s.onload = e, s.onerror = t;
				}), zd(o, "link", r), t.state.loading |= 4, Hf(o, n.precedence, e), t.instance = o;
			case "script": return o = zf(n.src), (a = e.querySelector(Bf(o))) ? (t.instance = a, Et(a), a) : (r = n, (a = yf.get(o)) && (r = h({}, n), Wf(r, a)), e = e.ownerDocument || e, a = e.createElement("script"), Et(a), zd(a, "link", r), e.head.appendChild(a), t.instance = a);
			case "void": return null;
			default: throw Error(i(443, t.type));
		}
		else t.type === "stylesheet" && !(t.state.loading & 4) && (r = t.instance, t.state.loading |= 4, Hf(r, n.precedence, e));
		return t.instance;
	}
	function Hf(e, t, n) {
		for (var r = n.querySelectorAll("link[rel=\"stylesheet\"][data-precedence],style[data-precedence]"), i = r.length ? r[r.length - 1] : null, a = i, o = 0; o < r.length; o++) {
			var s = r[o];
			if (s.dataset.precedence === t) a = s;
			else if (a !== i) break;
		}
		a ? a.parentNode.insertBefore(e, a.nextSibling) : (t = n.nodeType === 9 ? n.head : n, t.insertBefore(e, t.firstChild));
	}
	function Uf(e, t) {
		e.crossOrigin ?? (e.crossOrigin = t.crossOrigin), e.referrerPolicy ?? (e.referrerPolicy = t.referrerPolicy), e.title ?? (e.title = t.title);
	}
	function Wf(e, t) {
		e.crossOrigin ?? (e.crossOrigin = t.crossOrigin), e.referrerPolicy ?? (e.referrerPolicy = t.referrerPolicy), e.integrity ?? (e.integrity = t.integrity);
	}
	var Gf = null;
	function Kf(e, t, n) {
		if (Gf === null) {
			var r = /* @__PURE__ */ new Map(), i = Gf = /* @__PURE__ */ new Map();
			i.set(n, r);
		} else i = Gf, r = i.get(n), r || (r = /* @__PURE__ */ new Map(), i.set(n, r));
		if (r.has(e)) return r;
		for (r.set(e, null), n = n.getElementsByTagName(e), i = 0; i < n.length; i++) {
			var a = n[i];
			if (!(a[bt] || a[pt] || e === "link" && a.getAttribute("rel") === "stylesheet") && a.namespaceURI !== "http://www.w3.org/2000/svg") {
				var o = a.getAttribute(t) || "";
				o = e + o;
				var s = r.get(o);
				s ? s.push(a) : r.set(o, [a]);
			}
		}
		return r;
	}
	function qf(e, t, n) {
		e = e.ownerDocument || e, e.head.insertBefore(n, t === "title" ? e.querySelector("head > title") : null);
	}
	function Jf(e, t, n) {
		if (n === 1 || t.itemProp != null) return !1;
		switch (e) {
			case "meta":
			case "title": return !0;
			case "style":
				if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "") break;
				return !0;
			case "link":
				if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError) break;
				switch (t.rel) {
					case "stylesheet": return e = t.disabled, typeof t.precedence == "string" && e == null;
					default: return !0;
				}
			case "script": if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string") return !0;
		}
		return !1;
	}
	function Yf(e) {
		return !(e.type === "stylesheet" && !(e.state.loading & 3));
	}
	function Xf(e, t, n, r) {
		if (n.type === "stylesheet" && (typeof r.media != "string" || !1 !== matchMedia(r.media).matches) && !(n.state.loading & 4)) {
			if (n.instance === null) {
				var i = Ff(r.href), a = t.querySelector(If(i));
				if (a) {
					t = a._p, typeof t == "object" && t && typeof t.then == "function" && (e.count++, e = $f.bind(e), t.then(e, e)), n.state.loading |= 4, n.instance = a, Et(a);
					return;
				}
				a = t.ownerDocument || t, r = Lf(r), (i = yf.get(i)) && Uf(r, i), a = a.createElement("link"), Et(a);
				var o = a;
				o._p = new Promise(function(e, t) {
					o.onload = e, o.onerror = t;
				}), zd(a, "link", r), n.instance = a;
			}
			e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(n, t), (t = n.state.preload) && !(n.state.loading & 3) && (e.count++, n = $f.bind(e), t.addEventListener("load", n), t.addEventListener("error", n));
		}
	}
	var Zf = 0;
	function Qf(e, t) {
		return e.stylesheets && e.count === 0 && tp(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(n) {
			var r = setTimeout(function() {
				if (e.stylesheets && tp(e, e.stylesheets), e.unsuspend) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, 6e4 + t);
			0 < e.imgBytes && Zf === 0 && (Zf = 62500 * Hd());
			var i = setTimeout(function() {
				if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && tp(e, e.stylesheets), e.unsuspend)) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, (e.imgBytes > Zf ? 50 : 800) + t);
			return e.unsuspend = n, function() {
				e.unsuspend = null, clearTimeout(r), clearTimeout(i);
			};
		} : null;
	}
	function $f() {
		if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
			if (this.stylesheets) tp(this, this.stylesheets);
			else if (this.unsuspend) {
				var e = this.unsuspend;
				this.unsuspend = null, e();
			}
		}
	}
	var ep = null;
	function tp(e, t) {
		e.stylesheets = null, e.unsuspend !== null && (e.count++, ep = /* @__PURE__ */ new Map(), t.forEach(np, e), ep = null, $f.call(e));
	}
	function np(e, t) {
		if (!(t.state.loading & 4)) {
			var n = ep.get(e);
			if (n) var r = n.get(null);
			else {
				n = /* @__PURE__ */ new Map(), ep.set(e, n);
				for (var i = e.querySelectorAll("link[data-precedence],style[data-precedence]"), a = 0; a < i.length; a++) {
					var o = i[a];
					(o.nodeName === "LINK" || o.getAttribute("media") !== "not all") && (n.set(o.dataset.precedence, o), r = o);
				}
				r && n.set(null, r);
			}
			i = t.instance, o = i.getAttribute("data-precedence"), a = n.get(o) || r, a === r && n.set(null, i), n.set(o, i), this.count++, r = $f.bind(this), i.addEventListener("load", r), i.addEventListener("error", r), a ? a.parentNode.insertBefore(i, a.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(i, e.firstChild)), t.state.loading |= 4;
		}
	}
	var rp = {
		$$typeof: C,
		Provider: null,
		Consumer: null,
		_currentValue: ue,
		_currentValue2: ue,
		_threadCount: 0
	};
	function ip(e, t, n, r, i, a, o, s, c) {
		this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = nt(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = nt(0), this.hiddenUpdates = nt(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = c, this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function ap(e, t, n, r, i, a, o, s, c, l, u, d) {
		return e = new ip(e, t, n, o, c, l, u, d, s), t = 1, !0 === a && (t |= 24), a = mi(3, null, null, t), e.current = a, a.stateNode = e, t = fa(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: t
		}, Wa(a), e;
	}
	function op(e) {
		return e ? (e = fi, e) : fi;
	}
	function sp(e, t, n, r, i, a) {
		i = op(i), r.context === null ? r.context = i : r.pendingContext = i, r = L(t), r.payload = { element: n }, a = a === void 0 ? null : a, a !== null && (r.callback = a), n = Ka(e, r, t), n !== null && (bu(n, e, t), R(n, e, t));
	}
	function cp(e, t) {
		if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
			var n = e.retryLane;
			e.retryLane = n !== 0 && n < t ? n : t;
		}
	}
	function lp(e, t) {
		cp(e, t), (e = e.alternate) && cp(e, t);
	}
	function up(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = li(e, 67108864);
			t !== null && bu(t, e, 67108864), lp(e, 67108864);
		}
	}
	function dp(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = vu();
			t = ct(t);
			var n = li(e, t);
			n !== null && bu(n, e, t), lp(e, t);
		}
	}
	var fp = !0;
	function pp(e, t, n, r) {
		var i = E.T;
		E.T = null;
		var a = D.p;
		try {
			D.p = 2, hp(e, t, n, r);
		} finally {
			D.p = a, E.T = i;
		}
	}
	function mp(e, t, n, r) {
		var i = E.T;
		E.T = null;
		var a = D.p;
		try {
			D.p = 8, hp(e, t, n, r);
		} finally {
			D.p = a, E.T = i;
		}
	}
	function hp(e, t, n, r) {
		if (fp) {
			var i = gp(r);
			if (i === null) kd(e, t, r, _p, n), Op(e, r);
			else if (Ap(i, e, t, n, r)) r.stopPropagation();
			else if (Op(e, r), t & 4 && -1 < Dp.indexOf(e)) {
				for (; i !== null;) {
					var a = Ct(i);
					if (a !== null) switch (a.tag) {
						case 3:
							if (a = a.stateNode, a.current.memoizedState.isDehydrated) {
								var o = Ze(a.pendingLanes);
								if (o !== 0) {
									var s = a;
									for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
										var c = 1 << 31 - We(o);
										s.entanglements[1] |= c, o &= ~c;
									}
									cd(a), !(U & 6) && (ou = Me() + 500, ld(0, !1));
								}
							}
							break;
						case 31:
						case 13: s = li(a, 2), s !== null && bu(s, a, 2), Tu(), lp(a, 2);
					}
					if (a = gp(r), a === null && kd(e, t, r, _p, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else kd(e, t, r, null, n);
		}
	}
	function gp(e) {
		return e = cn(e), vp(e);
	}
	var _p = null;
	function vp(e) {
		if (_p = null, e = St(e), e !== null) {
			var t = o(e);
			if (t === null) e = null;
			else {
				var n = t.tag;
				if (n === 13) {
					if (e = s(t), e !== null) return e;
					e = null;
				} else if (n === 31) {
					if (e = c(t), e !== null) return e;
					e = null;
				} else if (n === 3) {
					if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
					e = null;
				} else t !== e && (e = null);
			}
		}
		return _p = e, null;
	}
	function yp(e) {
		switch (e) {
			case "beforetoggle":
			case "cancel":
			case "click":
			case "close":
			case "contextmenu":
			case "copy":
			case "cut":
			case "auxclick":
			case "dblclick":
			case "dragend":
			case "dragstart":
			case "drop":
			case "focusin":
			case "focusout":
			case "input":
			case "invalid":
			case "keydown":
			case "keypress":
			case "keyup":
			case "mousedown":
			case "mouseup":
			case "paste":
			case "pause":
			case "play":
			case "pointercancel":
			case "pointerdown":
			case "pointerup":
			case "ratechange":
			case "reset":
			case "resize":
			case "seeked":
			case "submit":
			case "toggle":
			case "touchcancel":
			case "touchend":
			case "touchstart":
			case "volumechange":
			case "change":
			case "selectionchange":
			case "textInput":
			case "compositionstart":
			case "compositionend":
			case "compositionupdate":
			case "beforeblur":
			case "afterblur":
			case "beforeinput":
			case "blur":
			case "fullscreenchange":
			case "focus":
			case "hashchange":
			case "popstate":
			case "select":
			case "selectstart": return 2;
			case "drag":
			case "dragenter":
			case "dragexit":
			case "dragleave":
			case "dragover":
			case "mousemove":
			case "mouseout":
			case "mouseover":
			case "pointermove":
			case "pointerout":
			case "pointerover":
			case "scroll":
			case "touchmove":
			case "wheel":
			case "mouseenter":
			case "mouseleave":
			case "pointerenter":
			case "pointerleave": return 8;
			case "message": switch (Ne()) {
				case Pe: return 2;
				case Fe: return 8;
				case Ie:
				case Le: return 32;
				case Re: return 268435456;
				default: return 32;
			}
			default: return 32;
		}
	}
	var bp = !1, xp = null, Sp = null, Cp = null, wp = /* @__PURE__ */ new Map(), Tp = /* @__PURE__ */ new Map(), Ep = [], Dp = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
	function Op(e, t) {
		switch (e) {
			case "focusin":
			case "focusout":
				xp = null;
				break;
			case "dragenter":
			case "dragleave":
				Sp = null;
				break;
			case "mouseover":
			case "mouseout":
				Cp = null;
				break;
			case "pointerover":
			case "pointerout":
				wp.delete(t.pointerId);
				break;
			case "gotpointercapture":
			case "lostpointercapture": Tp.delete(t.pointerId);
		}
	}
	function kp(e, t, n, r, i, a) {
		return e === null || e.nativeEvent !== a ? (e = {
			blockedOn: t,
			domEventName: n,
			eventSystemFlags: r,
			nativeEvent: a,
			targetContainers: [i]
		}, t !== null && (t = Ct(t), t !== null && up(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
	}
	function Ap(e, t, n, r, i) {
		switch (t) {
			case "focusin": return xp = kp(xp, e, t, n, r, i), !0;
			case "dragenter": return Sp = kp(Sp, e, t, n, r, i), !0;
			case "mouseover": return Cp = kp(Cp, e, t, n, r, i), !0;
			case "pointerover":
				var a = i.pointerId;
				return wp.set(a, kp(wp.get(a) || null, e, t, n, r, i)), !0;
			case "gotpointercapture": return a = i.pointerId, Tp.set(a, kp(Tp.get(a) || null, e, t, n, r, i)), !0;
		}
		return !1;
	}
	function jp(e) {
		var t = St(e.target);
		if (t !== null) {
			var n = o(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = s(n), t !== null) {
						e.blockedOn = t, dt(e.priority, function() {
							dp(n);
						});
						return;
					}
				} else if (t === 31) {
					if (t = c(n), t !== null) {
						e.blockedOn = t, dt(e.priority, function() {
							dp(n);
						});
						return;
					}
				} else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
					e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
					return;
				}
			}
		}
		e.blockedOn = null;
	}
	function Mp(e) {
		if (e.blockedOn !== null) return !1;
		for (var t = e.targetContainers; 0 < t.length;) {
			var n = gp(e.nativeEvent);
			if (n === null) {
				n = e.nativeEvent;
				var r = new n.constructor(n.type, n);
				M = r, n.target.dispatchEvent(r), M = null;
			} else return t = Ct(n), t !== null && up(t), e.blockedOn = n, !1;
			t.shift();
		}
		return !0;
	}
	function Np(e, t, n) {
		Mp(e) && n.delete(t);
	}
	function Pp() {
		bp = !1, xp !== null && Mp(xp) && (xp = null), Sp !== null && Mp(Sp) && (Sp = null), Cp !== null && Mp(Cp) && (Cp = null), wp.forEach(Np), Tp.forEach(Np);
	}
	function Fp(e, n) {
		e.blockedOn === n && (e.blockedOn = null, bp || (bp = !0, t.unstable_scheduleCallback(t.unstable_NormalPriority, Pp)));
	}
	var Ip = null;
	function Lp(e) {
		Ip !== e && (Ip = e, t.unstable_scheduleCallback(t.unstable_NormalPriority, function() {
			Ip === e && (Ip = null);
			for (var t = 0; t < e.length; t += 3) {
				var n = e[t], r = e[t + 1], i = e[t + 2];
				if (typeof r != "function") {
					if (vp(r || n) === null) continue;
					break;
				}
				var a = Ct(n);
				a !== null && (e.splice(t, 3), t -= 3, ks(a, {
					pending: !0,
					data: i,
					method: n.method,
					action: r
				}, r, i));
			}
		}));
	}
	function Rp(e) {
		function t(t) {
			return Fp(t, e);
		}
		xp !== null && Fp(xp, e), Sp !== null && Fp(Sp, e), Cp !== null && Fp(Cp, e), wp.forEach(t), Tp.forEach(t);
		for (var n = 0; n < Ep.length; n++) {
			var r = Ep[n];
			r.blockedOn === e && (r.blockedOn = null);
		}
		for (; 0 < Ep.length && (n = Ep[0], n.blockedOn === null);) jp(n), n.blockedOn === null && Ep.shift();
		if (n = (e.ownerDocument || e).$$reactFormReplay, n != null) for (r = 0; r < n.length; r += 3) {
			var i = n[r], a = n[r + 1], o = i[mt] || null;
			if (typeof a == "function") o || Lp(n);
			else if (o) {
				var s = null;
				if (a && a.hasAttribute("formAction")) {
					if (i = a, o = a[mt] || null) s = o.formAction;
					else if (vp(i) !== null) continue;
				} else s = o.action;
				typeof s == "function" ? n[r + 1] = s : (n.splice(r, 3), r -= 3), Lp(n);
			}
		}
	}
	function zp() {
		function e(e) {
			e.canIntercept && e.info === "react-transition" && e.intercept({
				handler: function() {
					return new Promise(function(e) {
						return i = e;
					});
				},
				focusReset: "manual",
				scroll: "manual"
			});
		}
		function t() {
			i !== null && (i(), i = null), r || setTimeout(n, 20);
		}
		function n() {
			if (!r && !navigation.transition) {
				var e = navigation.currentEntry;
				e && e.url != null && navigation.navigate(e.url, {
					state: e.getState(),
					info: "react-transition",
					history: "replace"
				});
			}
		}
		if (typeof navigation == "object") {
			var r = !1, i = null;
			return navigation.addEventListener("navigate", e), navigation.addEventListener("navigatesuccess", t), navigation.addEventListener("navigateerror", t), setTimeout(n, 100), function() {
				r = !0, navigation.removeEventListener("navigate", e), navigation.removeEventListener("navigatesuccess", t), navigation.removeEventListener("navigateerror", t), i !== null && (i(), i = null);
			};
		}
	}
	function Bp(e) {
		this._internalRoot = e;
	}
	Vp.prototype.render = Bp.prototype.render = function(e) {
		var t = this._internalRoot;
		if (t === null) throw Error(i(409));
		var n = t.current;
		sp(n, vu(), e, t, null, null);
	}, Vp.prototype.unmount = Bp.prototype.unmount = function() {
		var e = this._internalRoot;
		if (e !== null) {
			this._internalRoot = null;
			var t = e.containerInfo;
			sp(e.current, 2, null, e, null, null), Tu(), t[ht] = null;
		}
	};
	function Vp(e) {
		this._internalRoot = e;
	}
	Vp.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = ut();
			e = {
				blockedOn: null,
				target: e,
				priority: t
			};
			for (var n = 0; n < Ep.length && t !== 0 && t < Ep[n].priority; n++);
			Ep.splice(n, 0, e), n === 0 && jp(e);
		}
	};
	var Hp = n.version;
	if (Hp !== "19.2.5") throw Error(i(527, Hp, "19.2.5"));
	D.findDOMNode = function(e) {
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(i(188)) : (e = Object.keys(e).join(","), Error(i(268, e)));
		return e = d(t), e = e === null ? null : p(e), e = e === null ? null : e.stateNode, e;
	};
	var Up = {
		bundleType: 0,
		version: "19.2.5",
		rendererPackageName: "react-dom",
		currentDispatcherRef: E,
		reconcilerVersion: "19.2.5"
	};
	if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
		var Wp = __REACT_DEVTOOLS_GLOBAL_HOOK__;
		if (!Wp.isDisabled && Wp.supportsFiber) try {
			Ve = Wp.inject(Up), He = Wp;
		} catch {}
	}
	e.createRoot = function(e, t) {
		if (!a(e)) throw Error(i(299));
		var n = !1, r = "", o = Qs, s = $s, c = ec;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onUncaughtError !== void 0 && (o = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = ap(e, 1, !1, null, null, n, r, null, o, s, c, zp), e[ht] = t.current, Dd(e), new Bp(t);
	};
})), g = /* @__PURE__ */ o(((e, t) => {
	function n() {
		if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = h();
})), _ = /* @__PURE__ */ c(u()), v = g(), y = /^squilla:block:start:(\d+):(.*)$/, b = /^squilla:block:end:(\d+)$/;
function x(e = document.body) {
	let t = document.createTreeWalker(e, NodeFilter.SHOW_COMMENT), n = [], r = [], i = t.nextNode();
	for (; i;) {
		let e = i.data ?? "", a = e.match(y);
		if (a) n.push({
			idx: Number(a[1]),
			slug: a[2] ?? "",
			node: i
		});
		else {
			let t = e.match(b);
			if (t) {
				let e = Number(t[1]), a = n.findIndex((t) => t.idx === e);
				if (a >= 0) {
					let t = n[a];
					n.splice(a, 1), r.push({
						index: e,
						slug: t.slug,
						startNode: t.node,
						endNode: i
					});
				}
			}
		}
		i = t.nextNode();
	}
	return r;
}
var S = 1e5;
function C() {
	return S += 1, S;
}
function w(e, t) {
	return {
		start: document.createComment(`squilla:block:start:${e}:${t}`),
		end: document.createComment(`squilla:block:end:${e}`)
	};
}
function ee(e, t, n, r, i) {
	let a = document.createElement("template");
	if (a.innerHTML = i, t < e.length) {
		let i = e[t], o = i.startNode.parentNode;
		if (!o) return;
		o.insertBefore(n, i.startNode), o.insertBefore(a.content, i.startNode), o.insertBefore(r, i.startNode);
		return;
	}
	if (e.length > 0) {
		let t = e[e.length - 1], i = t.endNode.parentNode;
		if (!i) return;
		let o = t.endNode.nextSibling;
		o ? (i.insertBefore(n, o), i.insertBefore(a.content, o), i.insertBefore(r, o)) : (i.appendChild(n), i.appendChild(a.content), i.appendChild(r));
		return;
	}
	let o = document.querySelector("main") ?? document.body;
	o.appendChild(n), o.appendChild(a.content), o.appendChild(r);
}
function te(e) {
	let t = e.startNode;
	for (; t;) {
		let n = t.nextSibling;
		if (t.parentNode?.removeChild(t), t === e.endNode) break;
		t = n;
	}
}
function ne(e) {
	let t = [], n = e.startNode.nextSibling;
	for (; n && n !== e.endNode;) {
		if (n.nodeType === Node.ELEMENT_NODE) {
			let e = n.getBoundingClientRect();
			(e.width > 0 || e.height > 0) && t.push(e);
		}
		n = n.nextSibling;
	}
	if (t.length === 0) return null;
	let r = Infinity, i = Infinity, a = -Infinity, o = -Infinity;
	for (let e of t) e.top < r && (r = e.top), e.left < i && (i = e.left), e.right > a && (a = e.right), e.bottom > o && (o = e.bottom);
	return {
		top: r,
		left: i,
		width: a - i,
		height: o - r
	};
}
function T(e, t) {
	for (let n of t) if (oe(e, n.startNode, n.endNode)) return n;
	return null;
}
function re(e) {
	let t = document.createDocumentFragment(), n = e.startNode;
	for (; n;) {
		let r = n.nextSibling;
		if (t.appendChild(n), n === e.endNode) break;
		n = r;
	}
	return t;
}
function ie(e, t, n) {
	if (t === n) return;
	let r = e[t];
	if (!r) return;
	let i = r.startNode.parentNode;
	if (!i) return;
	let a = e.filter((e, n) => n !== t)[n] ?? null, o = re(r);
	a && a.startNode.parentNode === i ? i.insertBefore(o, a.startNode) : i.appendChild(o);
}
function ae(e, t) {
	let n = e.startNode.nextSibling;
	for (; n && n !== e.endNode;) {
		let e = n.nextSibling;
		n.parentNode?.removeChild(n), n = e;
	}
	let r = document.createElement("template");
	r.innerHTML = t, e.endNode.parentNode?.insertBefore(r.content, e.endNode);
}
function oe(e, t, n) {
	let r = e;
	for (; r && r.parentNode !== t.parentNode;) r = r.parentNode;
	if (!r) return !1;
	let i = !!(t.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING), a = !!(n.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_PRECEDING);
	return i && a;
}
//#endregion
//#region src/insertBus.ts
var se = null;
function ce(e) {
	return se = e, () => {
		se === e && (se = null);
	};
}
function le(e) {
	se && se(e);
}
//#endregion
//#region src/panelBus.ts
var E = /* @__PURE__ */ new Set();
function D(e) {
	E.forEach((t) => t(e));
}
function ue(e) {
	return E.add(e), () => E.delete(e);
}
//#endregion
//#region src/pageTargets.ts
var de = /* @__PURE__ */ new Map(), fe = (e) => e.replace(/\s+/g, " ").trim(), O = (e) => !!e.closest("[data-vedit-host]"), pe = (e) => !e.closest("main, article, [data-vedit-host]");
function k(e) {
	try {
		let t = new URL(e, window.location.href).pathname;
		return decodeURIComponent(t.split("/").pop() ?? "").replace(/\.[a-z0-9]+$/i, "").replace(/[-_]\d{2,4}x\d{2,4}$/, "");
	} catch {
		return "";
	}
}
function me(e, t) {
	let n = fe(t);
	if (!n) return null;
	let r = document.querySelector("main") ?? document.body;
	for (let t of Array.from(r.querySelectorAll(e))) if (!(O(t) || t.children.length > 0 && t.querySelector("img,svg,button")) && fe(t.textContent ?? "") === n) return t;
	return null;
}
function A(e) {
	de.clear();
	let t = (e) => {
		de.set(e.kind + ":" + (e.key ?? ""), e);
	};
	if (document.querySelectorAll("[data-sq-edit]").forEach((e) => {
		if (O(e)) return;
		let n = e.getAttribute("data-sq-edit");
		n === "title" ? t({
			kind: "title",
			el: e,
			action: "Edit title",
			caption: "Title"
		}) : n === "excerpt" ? t({
			kind: "excerpt",
			el: e,
			action: "Edit excerpt",
			caption: "Excerpt"
		}) : n === "featured_image" && t({
			kind: "featured_image",
			el: e,
			action: "Replace image",
			caption: "Featured image"
		});
	}), document.querySelectorAll("[data-sq-settings]").forEach((e) => {
		if (O(e)) return;
		let n = e.getAttribute("data-sq-settings") ?? "";
		n && t({
			kind: "settings",
			key: n,
			el: e,
			action: "Edit in Layout",
			caption: "Site-wide"
		});
	}), !de.has("title:")) {
		let n = me("h1", e.title) ?? me("h1, h2", e.title);
		n && t({
			kind: "title",
			el: n,
			action: "Edit title",
			caption: "Title"
		});
	}
	if (!de.has("excerpt:") && e.excerpt) {
		let n = me("p, div, span", e.excerpt);
		n && t({
			kind: "excerpt",
			el: n,
			action: "Edit excerpt",
			caption: "Excerpt"
		});
	}
	if (!de.has("featured_image:") && e.imageUrl) {
		let n = k(e.imageUrl), r = document.querySelector("main") ?? document.body, i = n ? Array.from(r.querySelectorAll("img")).find((e) => !O(e) && k(e.currentSrc || e.src) === n) : void 0;
		i && t({
			kind: "featured_image",
			el: i,
			action: "Replace image",
			caption: "Featured image"
		});
	}
	let n = (e) => de.has("settings:" + e);
	if (!n("header")) {
		let e = Array.from(document.querySelectorAll("header, [role=banner]")).find(pe);
		e && t({
			kind: "settings",
			key: "header",
			el: e,
			action: "Edit header",
			caption: "Header · every page"
		});
	}
	if (!n("footer")) {
		let e = Array.from(document.querySelectorAll("footer, [role=contentinfo]")).filter(pe).pop();
		e && t({
			kind: "settings",
			key: "footer",
			el: e,
			action: "Edit footer",
			caption: "Footer · every page"
		});
	}
	if (!n("announcement")) {
		let e = Array.from(document.querySelectorAll("[class*=\"announcement\" i]")).find((e) => !O(e) && pe(e));
		e && t({
			kind: "settings",
			key: "announcement",
			el: e,
			action: "Edit announcement",
			caption: "Announcement · every page"
		});
	}
}
function j() {
	return Array.from(de.values()).filter((e) => e.el.isConnected);
}
function he(e) {
	return j().find((t) => t.kind === e);
}
function ge(e) {
	let t = null;
	for (let n of j()) n.el.contains(e) && (!t || t.el.contains(n.el)) && (t = n);
	return t;
}
function _e(e, t) {
	let n = he(e);
	if (n) {
		if (e === "featured_image") {
			let e = n.el;
			if (!t || e.tagName !== "IMG") return;
			e.removeAttribute("srcset"), e.removeAttribute("sizes"), e.parentElement?.querySelectorAll("source").forEach((e) => e.remove()), e.src = t;
			return;
		}
		n.el.dataset.veditEditing !== "1" && (n.el.textContent ?? "") !== t && (n.el.textContent = t);
	}
}
var ve = null;
function ye() {
	return ve ? (ve.revert(), !0) : !1;
}
function be(e) {
	let t = e.el;
	if (t.dataset.veditEditing === "1") return;
	let n = t.textContent ?? "";
	t.dataset.veditEditing = "1", t.contentEditable = "plaintext-only", t.contentEditable !== "plaintext-only" && (t.contentEditable = "true"), t.style.outline = "none", t.style.cursor = "text", t.focus();
	let r = document.createRange();
	r.selectNodeContents(t);
	let i = window.getSelection();
	i?.removeAllRanges(), i?.addRange(r);
	let a = e.kind === "title" ? "title" : "excerpt", o = () => {
		t.removeEventListener("input", c), t.removeEventListener("keydown", l), t.removeEventListener("blur", o), t.removeAttribute("contenteditable"), t.style.outline = "", t.style.cursor = "", delete t.dataset.veditEditing, ve?.el === t && (ve = null);
	}, s = () => {
		t.textContent = n, D({
			type: "text",
			field: a,
			value: n
		}), t.blur();
	};
	ve = {
		el: t,
		revert: s
	};
	let c = () => D({
		type: "text",
		field: a,
		value: (t.textContent ?? "").replace(/\s+/g, " ")
	}), l = (e) => {
		e.stopPropagation(), e.key === "Enter" ? (e.preventDefault(), t.blur()) : e.key === "Escape" && (e.preventDefault(), s());
	};
	t.addEventListener("input", c), t.addEventListener("keydown", l), t.addEventListener("blur", o);
}
//#endregion
//#region src/resume.ts
var xe = 120 * 1e3, Se = (e) => `vedit-resume:${e}`;
function Ce(e, t) {
	try {
		sessionStorage.setItem(Se(e), JSON.stringify({
			...t,
			at: Date.now()
		}));
	} catch {}
}
function we(e) {
	try {
		let t = sessionStorage.getItem(Se(e));
		if (!t) return null;
		sessionStorage.removeItem(Se(e));
		let n = JSON.parse(t);
		return !n.at || Date.now() - n.at > xe ? null : {
			pos: typeof n.pos == "number" ? n.pos : null,
			panelScroll: Number(n.panelScroll) || 0,
			toast: n.toast
		};
	} catch {
		return null;
	}
}
//#endregion
//#region node_modules/@dnd-kit/utilities/dist/utilities.esm.js
var Te = /* @__PURE__ */ c(m());
function Ee() {
	var e = [...arguments];
	return (0, _.useMemo)(() => (t) => {
		e.forEach((e) => e(t));
	}, e);
}
var De = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0;
function Oe(e) {
	let t = Object.prototype.toString.call(e);
	return t === "[object Window]" || t === "[object global]";
}
function ke(e) {
	return "nodeType" in e;
}
function Ae(e) {
	return e ? Oe(e) ? e : ke(e) ? e.ownerDocument?.defaultView ?? window : window : window;
}
function je(e) {
	let { Document: t } = Ae(e);
	return e instanceof t;
}
function Me(e) {
	return Oe(e) ? !1 : e instanceof Ae(e).HTMLElement;
}
function Ne(e) {
	return e instanceof Ae(e).SVGElement;
}
function Pe(e) {
	return e ? Oe(e) ? e.document : ke(e) ? je(e) ? e : Me(e) || Ne(e) ? e.ownerDocument : document : document : document;
}
var Fe = De ? _.useLayoutEffect : _.useEffect;
function Ie(e) {
	let t = (0, _.useRef)(e);
	return Fe(() => {
		t.current = e;
	}), (0, _.useCallback)(function() {
		var e = [...arguments];
		return t.current == null ? void 0 : t.current(...e);
	}, []);
}
function Le() {
	let e = (0, _.useRef)(null);
	return [(0, _.useCallback)((t, n) => {
		e.current = setInterval(t, n);
	}, []), (0, _.useCallback)(() => {
		e.current !== null && (clearInterval(e.current), e.current = null);
	}, [])];
}
function Re(e, t) {
	t === void 0 && (t = [e]);
	let n = (0, _.useRef)(e);
	return Fe(() => {
		n.current !== e && (n.current = e);
	}, t), n;
}
function ze(e, t) {
	let n = (0, _.useRef)();
	return (0, _.useMemo)(() => {
		let t = e(n.current);
		return n.current = t, t;
	}, [...t]);
}
function Be(e) {
	let t = Ie(e), n = (0, _.useRef)(null);
	return [n, (0, _.useCallback)((e) => {
		e !== n.current && t?.(e, n.current), n.current = e;
	}, [])];
}
function Ve(e) {
	let t = (0, _.useRef)();
	return (0, _.useEffect)(() => {
		t.current = e;
	}, [e]), t.current;
}
var He = {};
function Ue(e, t) {
	return (0, _.useMemo)(() => {
		if (t) return t;
		let n = He[e] == null ? 0 : He[e] + 1;
		return He[e] = n, e + "-" + n;
	}, [e, t]);
}
function We(e) {
	return function(t) {
		return [...arguments].slice(1).reduce((t, n) => {
			let r = Object.entries(n);
			for (let [n, i] of r) {
				let r = t[n];
				r != null && (t[n] = r + e * i);
			}
			return t;
		}, { ...t });
	};
}
var Ge = /* @__PURE__ */ We(1), Ke = /* @__PURE__ */ We(-1);
function qe(e) {
	return "clientX" in e && "clientY" in e;
}
function Je(e) {
	if (!e) return !1;
	let { KeyboardEvent: t } = Ae(e.target);
	return t && e instanceof t;
}
function Ye(e) {
	if (!e) return !1;
	let { TouchEvent: t } = Ae(e.target);
	return t && e instanceof t;
}
function Xe(e) {
	if (Ye(e)) {
		if (e.touches && e.touches.length) {
			let { clientX: t, clientY: n } = e.touches[0];
			return {
				x: t,
				y: n
			};
		} else if (e.changedTouches && e.changedTouches.length) {
			let { clientX: t, clientY: n } = e.changedTouches[0];
			return {
				x: t,
				y: n
			};
		}
	}
	return qe(e) ? {
		x: e.clientX,
		y: e.clientY
	} : null;
}
var Ze = /* @__PURE__ */ Object.freeze({
	Translate: { toString(e) {
		if (!e) return;
		let { x: t, y: n } = e;
		return "translate3d(" + (t ? Math.round(t) : 0) + "px, " + (n ? Math.round(n) : 0) + "px, 0)";
	} },
	Scale: { toString(e) {
		if (!e) return;
		let { scaleX: t, scaleY: n } = e;
		return "scaleX(" + t + ") scaleY(" + n + ")";
	} },
	Transform: { toString(e) {
		if (e) return [Ze.Translate.toString(e), Ze.Scale.toString(e)].join(" ");
	} },
	Transition: { toString(e) {
		let { property: t, duration: n, easing: r } = e;
		return t + " " + n + "ms " + r;
	} }
}), Qe = "a,frame,iframe,input:not([type=hidden]):not(:disabled),select:not(:disabled),textarea:not(:disabled),button:not(:disabled),*[tabindex]";
function $e(e) {
	return e.matches(Qe) ? e : e.querySelector(Qe);
}
//#endregion
//#region node_modules/@dnd-kit/accessibility/dist/accessibility.esm.js
var et = { display: "none" };
function tt(e) {
	let { id: t, value: n } = e;
	return _.createElement("div", {
		id: t,
		style: et
	}, n);
}
function nt(e) {
	let { id: t, announcement: n, ariaLiveType: r = "assertive" } = e;
	return _.createElement("div", {
		id: t,
		style: {
			position: "fixed",
			top: 0,
			left: 0,
			width: 1,
			height: 1,
			margin: -1,
			border: 0,
			padding: 0,
			overflow: "hidden",
			clip: "rect(0 0 0 0)",
			clipPath: "inset(100%)",
			whiteSpace: "nowrap"
		},
		role: "status",
		"aria-live": r,
		"aria-atomic": !0
	}, n);
}
function rt() {
	let [e, t] = (0, _.useState)("");
	return {
		announce: (0, _.useCallback)((e) => {
			e != null && t(e);
		}, []),
		announcement: e
	};
}
//#endregion
//#region node_modules/@dnd-kit/core/dist/core.esm.js
var it = /* @__PURE__ */ (0, _.createContext)(null);
function at(e) {
	let t = (0, _.useContext)(it);
	(0, _.useEffect)(() => {
		if (!t) throw Error("useDndMonitor must be used within a children of <DndContext>");
		return t(e);
	}, [e, t]);
}
function ot() {
	let [e] = (0, _.useState)(() => /* @__PURE__ */ new Set()), t = (0, _.useCallback)((t) => (e.add(t), () => e.delete(t)), [e]);
	return [(0, _.useCallback)((t) => {
		let { type: n, event: r } = t;
		e.forEach((e) => e[n]?.call(e, r));
	}, [e]), t];
}
var st = { draggable: "\n    To pick up a draggable item, press the space bar.\n    While dragging, use the arrow keys to move the item.\n    Press space again to drop the item in its new position, or press escape to cancel.\n  " }, ct = {
	onDragStart(e) {
		let { active: t } = e;
		return "Picked up draggable item " + t.id + ".";
	},
	onDragOver(e) {
		let { active: t, over: n } = e;
		return n ? "Draggable item " + t.id + " was moved over droppable area " + n.id + "." : "Draggable item " + t.id + " is no longer over a droppable area.";
	},
	onDragEnd(e) {
		let { active: t, over: n } = e;
		return n ? "Draggable item " + t.id + " was dropped over droppable area " + n.id : "Draggable item " + t.id + " was dropped.";
	},
	onDragCancel(e) {
		let { active: t } = e;
		return "Dragging was cancelled. Draggable item " + t.id + " was dropped.";
	}
};
function lt(e) {
	let { announcements: t = ct, container: n, hiddenTextDescribedById: r, screenReaderInstructions: i = st } = e, { announce: a, announcement: o } = rt(), s = Ue("DndLiveRegion"), [c, l] = (0, _.useState)(!1);
	if ((0, _.useEffect)(() => {
		l(!0);
	}, []), at((0, _.useMemo)(() => ({
		onDragStart(e) {
			let { active: n } = e;
			a(t.onDragStart({ active: n }));
		},
		onDragMove(e) {
			let { active: n, over: r } = e;
			t.onDragMove && a(t.onDragMove({
				active: n,
				over: r
			}));
		},
		onDragOver(e) {
			let { active: n, over: r } = e;
			a(t.onDragOver({
				active: n,
				over: r
			}));
		},
		onDragEnd(e) {
			let { active: n, over: r } = e;
			a(t.onDragEnd({
				active: n,
				over: r
			}));
		},
		onDragCancel(e) {
			let { active: n, over: r } = e;
			a(t.onDragCancel({
				active: n,
				over: r
			}));
		}
	}), [a, t])), !c) return null;
	let u = _.createElement(_.Fragment, null, _.createElement(tt, {
		id: r,
		value: i.draggable
	}), _.createElement(nt, {
		id: s,
		announcement: o
	}));
	return n ? (0, Te.createPortal)(u, n) : u;
}
var ut;
(function(e) {
	e.DragStart = "dragStart", e.DragMove = "dragMove", e.DragEnd = "dragEnd", e.DragCancel = "dragCancel", e.DragOver = "dragOver", e.RegisterDroppable = "registerDroppable", e.SetDroppableDisabled = "setDroppableDisabled", e.UnregisterDroppable = "unregisterDroppable";
})(ut || (ut = {}));
function dt() {}
function ft(e, t) {
	return (0, _.useMemo)(() => ({
		sensor: e,
		options: t ?? {}
	}), [e, t]);
}
function pt() {
	var e = [...arguments];
	return (0, _.useMemo)(() => [...e].filter((e) => e != null), [...e]);
}
var mt = /* @__PURE__ */ Object.freeze({
	x: 0,
	y: 0
});
function ht(e, t) {
	return Math.sqrt((e.x - t.x) ** 2 + (e.y - t.y) ** 2);
}
function gt(e, t) {
	let { data: { value: n } } = e, { data: { value: r } } = t;
	return n - r;
}
function _t(e, t) {
	let { data: { value: n } } = e, { data: { value: r } } = t;
	return r - n;
}
function vt(e) {
	let { left: t, top: n, height: r, width: i } = e;
	return [
		{
			x: t,
			y: n
		},
		{
			x: t + i,
			y: n
		},
		{
			x: t,
			y: n + r
		},
		{
			x: t + i,
			y: n + r
		}
	];
}
function yt(e, t) {
	if (!e || e.length === 0) return null;
	let [n] = e;
	return t ? n[t] : n;
}
function bt(e, t, n) {
	return t === void 0 && (t = e.left), n === void 0 && (n = e.top), {
		x: t + e.width * .5,
		y: n + e.height * .5
	};
}
var xt = (e) => {
	let { collisionRect: t, droppableRects: n, droppableContainers: r } = e, i = bt(t, t.left, t.top), a = [];
	for (let e of r) {
		let { id: t } = e, r = n.get(t);
		if (r) {
			let n = ht(bt(r), i);
			a.push({
				id: t,
				data: {
					droppableContainer: e,
					value: n
				}
			});
		}
	}
	return a.sort(gt);
}, St = (e) => {
	let { collisionRect: t, droppableRects: n, droppableContainers: r } = e, i = vt(t), a = [];
	for (let e of r) {
		let { id: t } = e, r = n.get(t);
		if (r) {
			let n = vt(r), o = i.reduce((e, t, r) => e + ht(n[r], t), 0), s = Number((o / 4).toFixed(4));
			a.push({
				id: t,
				data: {
					droppableContainer: e,
					value: s
				}
			});
		}
	}
	return a.sort(gt);
};
function Ct(e, t) {
	let n = Math.max(t.top, e.top), r = Math.max(t.left, e.left), i = Math.min(t.left + t.width, e.left + e.width), a = Math.min(t.top + t.height, e.top + e.height), o = i - r, s = a - n;
	if (r < i && n < a) {
		let n = t.width * t.height, r = e.width * e.height, i = o * s, a = i / (n + r - i);
		return Number(a.toFixed(4));
	}
	return 0;
}
var wt = (e) => {
	let { collisionRect: t, droppableRects: n, droppableContainers: r } = e, i = [];
	for (let e of r) {
		let { id: r } = e, a = n.get(r);
		if (a) {
			let n = Ct(a, t);
			n > 0 && i.push({
				id: r,
				data: {
					droppableContainer: e,
					value: n
				}
			});
		}
	}
	return i.sort(_t);
};
function Tt(e, t, n) {
	return {
		...e,
		scaleX: t && n ? t.width / n.width : 1,
		scaleY: t && n ? t.height / n.height : 1
	};
}
function Et(e, t) {
	return e && t ? {
		x: e.left - t.left,
		y: e.top - t.top
	} : mt;
}
function Dt(e) {
	return function(t) {
		return [...arguments].slice(1).reduce((t, n) => ({
			...t,
			top: t.top + e * n.y,
			bottom: t.bottom + e * n.y,
			left: t.left + e * n.x,
			right: t.right + e * n.x
		}), { ...t });
	};
}
var Ot = /* @__PURE__ */ Dt(1);
function kt(e) {
	if (e.startsWith("matrix3d(")) {
		let t = e.slice(9, -1).split(/, /);
		return {
			x: +t[12],
			y: +t[13],
			scaleX: +t[0],
			scaleY: +t[5]
		};
	} else if (e.startsWith("matrix(")) {
		let t = e.slice(7, -1).split(/, /);
		return {
			x: +t[4],
			y: +t[5],
			scaleX: +t[0],
			scaleY: +t[3]
		};
	}
	return null;
}
function At(e, t, n) {
	let r = kt(t);
	if (!r) return e;
	let { scaleX: i, scaleY: a, x: o, y: s } = r, c = e.left - o - (1 - i) * parseFloat(n), l = e.top - s - (1 - a) * parseFloat(n.slice(n.indexOf(" ") + 1)), u = i ? e.width / i : e.width, d = a ? e.height / a : e.height;
	return {
		width: u,
		height: d,
		top: l,
		right: c + u,
		bottom: l + d,
		left: c
	};
}
var jt = { ignoreTransform: !1 };
function Mt(e, t) {
	t === void 0 && (t = jt);
	let n = e.getBoundingClientRect();
	if (t.ignoreTransform) {
		let { transform: t, transformOrigin: r } = Ae(e).getComputedStyle(e);
		t && (n = At(n, t, r));
	}
	let { top: r, left: i, width: a, height: o, bottom: s, right: c } = n;
	return {
		top: r,
		left: i,
		width: a,
		height: o,
		bottom: s,
		right: c
	};
}
function Nt(e) {
	return Mt(e, { ignoreTransform: !0 });
}
function Pt(e) {
	let t = e.innerWidth, n = e.innerHeight;
	return {
		top: 0,
		left: 0,
		right: t,
		bottom: n,
		width: t,
		height: n
	};
}
function Ft(e, t) {
	return t === void 0 && (t = Ae(e).getComputedStyle(e)), t.position === "fixed";
}
function It(e, t) {
	t === void 0 && (t = Ae(e).getComputedStyle(e));
	let n = /(auto|scroll|overlay)/;
	return [
		"overflow",
		"overflowX",
		"overflowY"
	].some((e) => {
		let r = t[e];
		return typeof r == "string" ? n.test(r) : !1;
	});
}
function Lt(e, t) {
	let n = [];
	function r(i) {
		if (t != null && n.length >= t || !i) return n;
		if (je(i) && i.scrollingElement != null && !n.includes(i.scrollingElement)) return n.push(i.scrollingElement), n;
		if (!Me(i) || Ne(i) || n.includes(i)) return n;
		let a = Ae(e).getComputedStyle(i);
		return i !== e && It(i, a) && n.push(i), Ft(i, a) ? n : r(i.parentNode);
	}
	return e ? r(e) : n;
}
function Rt(e) {
	let [t] = Lt(e, 1);
	return t ?? null;
}
function zt(e) {
	return !De || !e ? null : Oe(e) ? e : ke(e) ? je(e) || e === Pe(e).scrollingElement ? window : Me(e) ? e : null : null;
}
function Bt(e) {
	return Oe(e) ? e.scrollX : e.scrollLeft;
}
function Vt(e) {
	return Oe(e) ? e.scrollY : e.scrollTop;
}
function Ht(e) {
	return {
		x: Bt(e),
		y: Vt(e)
	};
}
var Ut;
(function(e) {
	e[e.Forward = 1] = "Forward", e[e.Backward = -1] = "Backward";
})(Ut || (Ut = {}));
function Wt(e) {
	return !De || !e ? !1 : e === document.scrollingElement;
}
function Gt(e) {
	let t = {
		x: 0,
		y: 0
	}, n = Wt(e) ? {
		height: window.innerHeight,
		width: window.innerWidth
	} : {
		height: e.clientHeight,
		width: e.clientWidth
	}, r = {
		x: e.scrollWidth - n.width,
		y: e.scrollHeight - n.height
	};
	return {
		isTop: e.scrollTop <= t.y,
		isLeft: e.scrollLeft <= t.x,
		isBottom: e.scrollTop >= r.y,
		isRight: e.scrollLeft >= r.x,
		maxScroll: r,
		minScroll: t
	};
}
var Kt = {
	x: .2,
	y: .2
};
function qt(e, t, n, r, i) {
	let { top: a, left: o, right: s, bottom: c } = n;
	r === void 0 && (r = 10), i === void 0 && (i = Kt);
	let { isTop: l, isBottom: u, isLeft: d, isRight: f } = Gt(e), p = {
		x: 0,
		y: 0
	}, m = {
		x: 0,
		y: 0
	}, h = {
		height: t.height * i.y,
		width: t.width * i.x
	};
	return !l && a <= t.top + h.height ? (p.y = Ut.Backward, m.y = r * Math.abs((t.top + h.height - a) / h.height)) : !u && c >= t.bottom - h.height && (p.y = Ut.Forward, m.y = r * Math.abs((t.bottom - h.height - c) / h.height)), !f && s >= t.right - h.width ? (p.x = Ut.Forward, m.x = r * Math.abs((t.right - h.width - s) / h.width)) : !d && o <= t.left + h.width && (p.x = Ut.Backward, m.x = r * Math.abs((t.left + h.width - o) / h.width)), {
		direction: p,
		speed: m
	};
}
function Jt(e) {
	if (e === document.scrollingElement) {
		let { innerWidth: e, innerHeight: t } = window;
		return {
			top: 0,
			left: 0,
			right: e,
			bottom: t,
			width: e,
			height: t
		};
	}
	let { top: t, left: n, right: r, bottom: i } = e.getBoundingClientRect();
	return {
		top: t,
		left: n,
		right: r,
		bottom: i,
		width: e.clientWidth,
		height: e.clientHeight
	};
}
function Yt(e) {
	return e.reduce((e, t) => Ge(e, Ht(t)), mt);
}
function Xt(e) {
	return e.reduce((e, t) => e + Bt(t), 0);
}
function Zt(e) {
	return e.reduce((e, t) => e + Vt(t), 0);
}
function Qt(e, t) {
	if (t === void 0 && (t = Mt), !e) return;
	let { top: n, left: r, bottom: i, right: a } = t(e);
	Rt(e) && (i <= 0 || a <= 0 || n >= window.innerHeight || r >= window.innerWidth) && e.scrollIntoView({
		block: "center",
		inline: "center"
	});
}
var $t = [[
	"x",
	["left", "right"],
	Xt
], [
	"y",
	["top", "bottom"],
	Zt
]], en = class {
	constructor(e, t) {
		this.rect = void 0, this.width = void 0, this.height = void 0, this.top = void 0, this.bottom = void 0, this.right = void 0, this.left = void 0;
		let n = Lt(t), r = Yt(n);
		this.rect = { ...e }, this.width = e.width, this.height = e.height;
		for (let [e, t, i] of $t) for (let a of t) Object.defineProperty(this, a, {
			get: () => {
				let t = i(n), o = r[e] - t;
				return this.rect[a] + o;
			},
			enumerable: !0
		});
		Object.defineProperty(this, "rect", { enumerable: !1 });
	}
}, tn = class {
	constructor(e) {
		this.target = void 0, this.listeners = [], this.removeAll = () => {
			this.listeners.forEach((e) => this.target?.removeEventListener(...e));
		}, this.target = e;
	}
	add(e, t, n) {
		var r;
		(r = this.target) == null || r.addEventListener(e, t, n), this.listeners.push([
			e,
			t,
			n
		]);
	}
};
function nn(e) {
	let { EventTarget: t } = Ae(e);
	return e instanceof t ? e : Pe(e);
}
function rn(e, t) {
	let n = Math.abs(e.x), r = Math.abs(e.y);
	return typeof t == "number" ? Math.sqrt(n ** 2 + r ** 2) > t : "x" in t && "y" in t ? n > t.x && r > t.y : "x" in t ? n > t.x : "y" in t ? r > t.y : !1;
}
var an;
(function(e) {
	e.Click = "click", e.DragStart = "dragstart", e.Keydown = "keydown", e.ContextMenu = "contextmenu", e.Resize = "resize", e.SelectionChange = "selectionchange", e.VisibilityChange = "visibilitychange";
})(an || (an = {}));
function on(e) {
	e.preventDefault();
}
function sn(e) {
	e.stopPropagation();
}
var M;
(function(e) {
	e.Space = "Space", e.Down = "ArrowDown", e.Right = "ArrowRight", e.Left = "ArrowLeft", e.Up = "ArrowUp", e.Esc = "Escape", e.Enter = "Enter", e.Tab = "Tab";
})(M || (M = {}));
var cn = {
	start: [M.Space, M.Enter],
	cancel: [M.Esc],
	end: [
		M.Space,
		M.Enter,
		M.Tab
	]
}, ln = (e, t) => {
	let { currentCoordinates: n } = t;
	switch (e.code) {
		case M.Right: return {
			...n,
			x: n.x + 25
		};
		case M.Left: return {
			...n,
			x: n.x - 25
		};
		case M.Down: return {
			...n,
			y: n.y + 25
		};
		case M.Up: return {
			...n,
			y: n.y - 25
		};
	}
}, un = class {
	constructor(e) {
		this.props = void 0, this.autoScrollEnabled = !1, this.referenceCoordinates = void 0, this.listeners = void 0, this.windowListeners = void 0, this.props = e;
		let { event: { target: t } } = e;
		this.props = e, this.listeners = new tn(Pe(t)), this.windowListeners = new tn(Ae(t)), this.handleKeyDown = this.handleKeyDown.bind(this), this.handleCancel = this.handleCancel.bind(this), this.attach();
	}
	attach() {
		this.handleStart(), this.windowListeners.add(an.Resize, this.handleCancel), this.windowListeners.add(an.VisibilityChange, this.handleCancel), setTimeout(() => this.listeners.add(an.Keydown, this.handleKeyDown));
	}
	handleStart() {
		let { activeNode: e, onStart: t } = this.props, n = e.node.current;
		n && Qt(n), t(mt);
	}
	handleKeyDown(e) {
		if (Je(e)) {
			let { active: t, context: n, options: r } = this.props, { keyboardCodes: i = cn, coordinateGetter: a = ln, scrollBehavior: o = "smooth" } = r, { code: s } = e;
			if (i.end.includes(s)) {
				this.handleEnd(e);
				return;
			}
			if (i.cancel.includes(s)) {
				this.handleCancel(e);
				return;
			}
			let { collisionRect: c } = n.current, l = c ? {
				x: c.left,
				y: c.top
			} : mt;
			this.referenceCoordinates || (this.referenceCoordinates = l);
			let u = a(e, {
				active: t,
				context: n.current,
				currentCoordinates: l
			});
			if (u) {
				let t = Ke(u, l), r = {
					x: 0,
					y: 0
				}, { scrollableAncestors: i } = n.current;
				for (let n of i) {
					let i = e.code, { isTop: a, isRight: s, isLeft: c, isBottom: l, maxScroll: d, minScroll: f } = Gt(n), p = Jt(n), m = {
						x: Math.min(i === M.Right ? p.right - p.width / 2 : p.right, Math.max(i === M.Right ? p.left : p.left + p.width / 2, u.x)),
						y: Math.min(i === M.Down ? p.bottom - p.height / 2 : p.bottom, Math.max(i === M.Down ? p.top : p.top + p.height / 2, u.y))
					}, h = i === M.Right && !s || i === M.Left && !c, g = i === M.Down && !l || i === M.Up && !a;
					if (h && m.x !== u.x) {
						let e = n.scrollLeft + t.x, a = i === M.Right && e <= d.x || i === M.Left && e >= f.x;
						if (a && !t.y) {
							n.scrollTo({
								left: e,
								behavior: o
							});
							return;
						}
						a ? r.x = n.scrollLeft - e : r.x = i === M.Right ? n.scrollLeft - d.x : n.scrollLeft - f.x, r.x && n.scrollBy({
							left: -r.x,
							behavior: o
						});
						break;
					} else if (g && m.y !== u.y) {
						let e = n.scrollTop + t.y, a = i === M.Down && e <= d.y || i === M.Up && e >= f.y;
						if (a && !t.x) {
							n.scrollTo({
								top: e,
								behavior: o
							});
							return;
						}
						a ? r.y = n.scrollTop - e : r.y = i === M.Down ? n.scrollTop - d.y : n.scrollTop - f.y, r.y && n.scrollBy({
							top: -r.y,
							behavior: o
						});
						break;
					}
				}
				this.handleMove(e, Ge(Ke(u, this.referenceCoordinates), r));
			}
		}
	}
	handleMove(e, t) {
		let { onMove: n } = this.props;
		e.preventDefault(), n(t);
	}
	handleEnd(e) {
		let { onEnd: t } = this.props;
		e.preventDefault(), this.detach(), t();
	}
	handleCancel(e) {
		let { onCancel: t } = this.props;
		e.preventDefault(), this.detach(), t();
	}
	detach() {
		this.listeners.removeAll(), this.windowListeners.removeAll();
	}
};
un.activators = [{
	eventName: "onKeyDown",
	handler: (e, t, n) => {
		let { keyboardCodes: r = cn, onActivation: i } = t, { active: a } = n, { code: o } = e.nativeEvent;
		if (r.start.includes(o)) {
			let t = a.activatorNode.current;
			return t && e.target !== t ? !1 : (e.preventDefault(), i?.({ event: e.nativeEvent }), !0);
		}
		return !1;
	}
}];
function dn(e) {
	return !!(e && "distance" in e);
}
function fn(e) {
	return !!(e && "delay" in e);
}
var pn = class {
	constructor(e, t, n) {
		n === void 0 && (n = nn(e.event.target)), this.props = void 0, this.events = void 0, this.autoScrollEnabled = !0, this.document = void 0, this.activated = !1, this.initialCoordinates = void 0, this.timeoutId = null, this.listeners = void 0, this.documentListeners = void 0, this.windowListeners = void 0, this.props = e, this.events = t;
		let { event: r } = e, { target: i } = r;
		this.props = e, this.events = t, this.document = Pe(i), this.documentListeners = new tn(this.document), this.listeners = new tn(n), this.windowListeners = new tn(Ae(i)), this.initialCoordinates = Xe(r) ?? mt, this.handleStart = this.handleStart.bind(this), this.handleMove = this.handleMove.bind(this), this.handleEnd = this.handleEnd.bind(this), this.handleCancel = this.handleCancel.bind(this), this.handleKeydown = this.handleKeydown.bind(this), this.removeTextSelection = this.removeTextSelection.bind(this), this.attach();
	}
	attach() {
		let { events: e, props: { options: { activationConstraint: t, bypassActivationConstraint: n } } } = this;
		if (this.listeners.add(e.move.name, this.handleMove, { passive: !1 }), this.listeners.add(e.end.name, this.handleEnd), e.cancel && this.listeners.add(e.cancel.name, this.handleCancel), this.windowListeners.add(an.Resize, this.handleCancel), this.windowListeners.add(an.DragStart, on), this.windowListeners.add(an.VisibilityChange, this.handleCancel), this.windowListeners.add(an.ContextMenu, on), this.documentListeners.add(an.Keydown, this.handleKeydown), t) {
			if (n != null && n({
				event: this.props.event,
				activeNode: this.props.activeNode,
				options: this.props.options
			})) return this.handleStart();
			if (fn(t)) {
				this.timeoutId = setTimeout(this.handleStart, t.delay), this.handlePending(t);
				return;
			}
			if (dn(t)) {
				this.handlePending(t);
				return;
			}
		}
		this.handleStart();
	}
	detach() {
		this.listeners.removeAll(), this.windowListeners.removeAll(), setTimeout(this.documentListeners.removeAll, 50), this.timeoutId !== null && (clearTimeout(this.timeoutId), this.timeoutId = null);
	}
	handlePending(e, t) {
		let { active: n, onPending: r } = this.props;
		r(n, e, this.initialCoordinates, t);
	}
	handleStart() {
		let { initialCoordinates: e } = this, { onStart: t } = this.props;
		e && (this.activated = !0, this.documentListeners.add(an.Click, sn, { capture: !0 }), this.removeTextSelection(), this.documentListeners.add(an.SelectionChange, this.removeTextSelection), t(e));
	}
	handleMove(e) {
		let { activated: t, initialCoordinates: n, props: r } = this, { onMove: i, options: { activationConstraint: a } } = r;
		if (!n) return;
		let o = Xe(e) ?? mt, s = Ke(n, o);
		if (!t && a) {
			if (dn(a)) {
				if (a.tolerance != null && rn(s, a.tolerance)) return this.handleCancel();
				if (rn(s, a.distance)) return this.handleStart();
			}
			if (fn(a) && rn(s, a.tolerance)) return this.handleCancel();
			this.handlePending(a, s);
			return;
		}
		e.cancelable && e.preventDefault(), i(o);
	}
	handleEnd() {
		let { onAbort: e, onEnd: t } = this.props;
		this.detach(), this.activated || e(this.props.active), t();
	}
	handleCancel() {
		let { onAbort: e, onCancel: t } = this.props;
		this.detach(), this.activated || e(this.props.active), t();
	}
	handleKeydown(e) {
		e.code === M.Esc && this.handleCancel();
	}
	removeTextSelection() {
		var e;
		(e = this.document.getSelection()) == null || e.removeAllRanges();
	}
}, mn = {
	cancel: { name: "pointercancel" },
	move: { name: "pointermove" },
	end: { name: "pointerup" }
}, hn = class extends pn {
	constructor(e) {
		let { event: t } = e, n = Pe(t.target);
		super(e, mn, n);
	}
};
hn.activators = [{
	eventName: "onPointerDown",
	handler: (e, t) => {
		let { nativeEvent: n } = e, { onActivation: r } = t;
		return !n.isPrimary || n.button !== 0 ? !1 : (r?.({ event: n }), !0);
	}
}];
var gn = {
	move: { name: "mousemove" },
	end: { name: "mouseup" }
}, _n;
(function(e) {
	e[e.RightClick = 2] = "RightClick";
})(_n || (_n = {}));
var vn = class extends pn {
	constructor(e) {
		super(e, gn, Pe(e.event.target));
	}
};
vn.activators = [{
	eventName: "onMouseDown",
	handler: (e, t) => {
		let { nativeEvent: n } = e, { onActivation: r } = t;
		return n.button === _n.RightClick ? !1 : (r?.({ event: n }), !0);
	}
}];
var yn = {
	cancel: { name: "touchcancel" },
	move: { name: "touchmove" },
	end: { name: "touchend" }
}, bn = class extends pn {
	constructor(e) {
		super(e, yn);
	}
	static setup() {
		return window.addEventListener(yn.move.name, e, {
			capture: !1,
			passive: !1
		}), function() {
			window.removeEventListener(yn.move.name, e);
		};
		function e() {}
	}
};
bn.activators = [{
	eventName: "onTouchStart",
	handler: (e, t) => {
		let { nativeEvent: n } = e, { onActivation: r } = t, { touches: i } = n;
		return i.length > 1 ? !1 : (r?.({ event: n }), !0);
	}
}];
var xn;
(function(e) {
	e[e.Pointer = 0] = "Pointer", e[e.DraggableRect = 1] = "DraggableRect";
})(xn || (xn = {}));
var Sn;
(function(e) {
	e[e.TreeOrder = 0] = "TreeOrder", e[e.ReversedTreeOrder = 1] = "ReversedTreeOrder";
})(Sn || (Sn = {}));
function Cn(e) {
	let { acceleration: t, activator: n = xn.Pointer, canScroll: r, draggingRect: i, enabled: a, interval: o = 5, order: s = Sn.TreeOrder, pointerCoordinates: c, scrollableAncestors: l, scrollableAncestorRects: u, delta: d, threshold: f } = e, p = Tn({
		delta: d,
		disabled: !a
	}), [m, h] = Le(), g = (0, _.useRef)({
		x: 0,
		y: 0
	}), v = (0, _.useRef)({
		x: 0,
		y: 0
	}), y = (0, _.useMemo)(() => {
		switch (n) {
			case xn.Pointer: return c ? {
				top: c.y,
				bottom: c.y,
				left: c.x,
				right: c.x
			} : null;
			case xn.DraggableRect: return i;
		}
	}, [
		n,
		i,
		c
	]), b = (0, _.useRef)(null), x = (0, _.useCallback)(() => {
		let e = b.current;
		if (!e) return;
		let t = g.current.x * v.current.x, n = g.current.y * v.current.y;
		e.scrollBy(t, n);
	}, []), S = (0, _.useMemo)(() => s === Sn.TreeOrder ? [...l].reverse() : l, [s, l]);
	(0, _.useEffect)(() => {
		if (!a || !l.length || !y) {
			h();
			return;
		}
		for (let e of S) {
			if (r?.(e) === !1) continue;
			let n = u[l.indexOf(e)];
			if (!n) continue;
			let { direction: i, speed: a } = qt(e, n, y, t, f);
			for (let e of ["x", "y"]) p[e][i[e]] || (a[e] = 0, i[e] = 0);
			if (a.x > 0 || a.y > 0) {
				h(), b.current = e, m(x, o), g.current = a, v.current = i;
				return;
			}
		}
		g.current = {
			x: 0,
			y: 0
		}, v.current = {
			x: 0,
			y: 0
		}, h();
	}, [
		t,
		x,
		r,
		h,
		a,
		o,
		JSON.stringify(y),
		JSON.stringify(p),
		m,
		l,
		S,
		u,
		JSON.stringify(f)
	]);
}
var wn = {
	x: {
		[Ut.Backward]: !1,
		[Ut.Forward]: !1
	},
	y: {
		[Ut.Backward]: !1,
		[Ut.Forward]: !1
	}
};
function Tn(e) {
	let { delta: t, disabled: n } = e, r = Ve(t);
	return ze((e) => {
		if (n || !r || !e) return wn;
		let i = {
			x: Math.sign(t.x - r.x),
			y: Math.sign(t.y - r.y)
		};
		return {
			x: {
				[Ut.Backward]: e.x[Ut.Backward] || i.x === -1,
				[Ut.Forward]: e.x[Ut.Forward] || i.x === 1
			},
			y: {
				[Ut.Backward]: e.y[Ut.Backward] || i.y === -1,
				[Ut.Forward]: e.y[Ut.Forward] || i.y === 1
			}
		};
	}, [
		n,
		t,
		r
	]);
}
function En(e, t) {
	let n = t == null ? void 0 : e.get(t), r = n ? n.node.current : null;
	return ze((e) => t == null ? null : r ?? e ?? null, [r, t]);
}
function Dn(e, t) {
	return (0, _.useMemo)(() => e.reduce((e, n) => {
		let { sensor: r } = n, i = r.activators.map((e) => ({
			eventName: e.eventName,
			handler: t(e.handler, n)
		}));
		return [...e, ...i];
	}, []), [e, t]);
}
var On;
(function(e) {
	e[e.Always = 0] = "Always", e[e.BeforeDragging = 1] = "BeforeDragging", e[e.WhileDragging = 2] = "WhileDragging";
})(On || (On = {}));
var kn;
(function(e) {
	e.Optimized = "optimized";
})(kn || (kn = {}));
var An = /* @__PURE__ */ new Map();
function jn(e, t) {
	let { dragging: n, dependencies: r, config: i } = t, [a, o] = (0, _.useState)(null), { frequency: s, measure: c, strategy: l } = i, u = (0, _.useRef)(e), d = g(), f = Re(d), p = (0, _.useCallback)(function(e) {
		e === void 0 && (e = []), !f.current && o((t) => t === null ? e : t.concat(e.filter((e) => !t.includes(e))));
	}, [f]), m = (0, _.useRef)(null), h = ze((t) => {
		if (d && !n) return An;
		if (!t || t === An || u.current !== e || a != null) {
			let t = /* @__PURE__ */ new Map();
			for (let n of e) {
				if (!n) continue;
				if (a && a.length > 0 && !a.includes(n.id) && n.rect.current) {
					t.set(n.id, n.rect.current);
					continue;
				}
				let e = n.node.current, r = e ? new en(c(e), e) : null;
				n.rect.current = r, r && t.set(n.id, r);
			}
			return t;
		}
		return t;
	}, [
		e,
		a,
		n,
		d,
		c
	]);
	return (0, _.useEffect)(() => {
		u.current = e;
	}, [e]), (0, _.useEffect)(() => {
		d || p();
	}, [n, d]), (0, _.useEffect)(() => {
		a && a.length > 0 && o(null);
	}, [JSON.stringify(a)]), (0, _.useEffect)(() => {
		d || typeof s != "number" || m.current !== null || (m.current = setTimeout(() => {
			p(), m.current = null;
		}, s));
	}, [
		s,
		d,
		p,
		...r
	]), {
		droppableRects: h,
		measureDroppableContainers: p,
		measuringScheduled: a != null
	};
	function g() {
		switch (l) {
			case On.Always: return !1;
			case On.BeforeDragging: return n;
			default: return !n;
		}
	}
}
function Mn(e, t) {
	return ze((n) => e ? n || (typeof t == "function" ? t(e) : e) : null, [t, e]);
}
function Nn(e, t) {
	return Mn(e, t);
}
function Pn(e) {
	let { callback: t, disabled: n } = e, r = Ie(t), i = (0, _.useMemo)(() => {
		if (n || typeof window > "u" || window.MutationObserver === void 0) return;
		let { MutationObserver: e } = window;
		return new e(r);
	}, [r, n]);
	return (0, _.useEffect)(() => () => i?.disconnect(), [i]), i;
}
function Fn(e) {
	let { callback: t, disabled: n } = e, r = Ie(t), i = (0, _.useMemo)(() => {
		if (n || typeof window > "u" || window.ResizeObserver === void 0) return;
		let { ResizeObserver: e } = window;
		return new e(r);
	}, [n]);
	return (0, _.useEffect)(() => () => i?.disconnect(), [i]), i;
}
function In(e) {
	return new en(Mt(e), e);
}
function Ln(e, t, n) {
	t === void 0 && (t = In);
	let [r, i] = (0, _.useState)(null);
	function a() {
		i((r) => {
			if (!e) return null;
			if (e.isConnected === !1) return r ?? n ?? null;
			let i = t(e);
			return JSON.stringify(r) === JSON.stringify(i) ? r : i;
		});
	}
	let o = Pn({ callback(t) {
		if (e) for (let n of t) {
			let { type: t, target: r } = n;
			if (t === "childList" && r instanceof HTMLElement && r.contains(e)) {
				a();
				break;
			}
		}
	} }), s = Fn({ callback: a });
	return Fe(() => {
		a(), e ? (s?.observe(e), o?.observe(document.body, {
			childList: !0,
			subtree: !0
		})) : (s?.disconnect(), o?.disconnect());
	}, [e]), r;
}
function Rn(e) {
	return Et(e, Mn(e));
}
var zn = [];
function Bn(e) {
	let t = (0, _.useRef)(e), n = ze((n) => e ? n && n !== zn && e && t.current && e.parentNode === t.current.parentNode ? n : Lt(e) : zn, [e]);
	return (0, _.useEffect)(() => {
		t.current = e;
	}, [e]), n;
}
function Vn(e) {
	let [t, n] = (0, _.useState)(null), r = (0, _.useRef)(e), i = (0, _.useCallback)((e) => {
		let t = zt(e.target);
		t && n((e) => e ? (e.set(t, Ht(t)), new Map(e)) : null);
	}, []);
	return (0, _.useEffect)(() => {
		let t = r.current;
		if (e !== t) {
			a(t);
			let o = e.map((e) => {
				let t = zt(e);
				return t ? (t.addEventListener("scroll", i, { passive: !0 }), [t, Ht(t)]) : null;
			}).filter((e) => e != null);
			n(o.length ? new Map(o) : null), r.current = e;
		}
		return () => {
			a(e), a(t);
		};
		function a(e) {
			e.forEach((e) => {
				zt(e)?.removeEventListener("scroll", i);
			});
		}
	}, [i, e]), (0, _.useMemo)(() => e.length ? t ? Array.from(t.values()).reduce((e, t) => Ge(e, t), mt) : Yt(e) : mt, [e, t]);
}
function Hn(e, t) {
	t === void 0 && (t = []);
	let n = (0, _.useRef)(null);
	return (0, _.useEffect)(() => {
		n.current = null;
	}, t), (0, _.useEffect)(() => {
		let t = e !== mt;
		t && !n.current && (n.current = e), !t && n.current && (n.current = null);
	}, [e]), n.current ? Ke(e, n.current) : mt;
}
function Un(e) {
	(0, _.useEffect)(() => {
		if (!De) return;
		let t = e.map((e) => {
			let { sensor: t } = e;
			return t.setup == null ? void 0 : t.setup();
		});
		return () => {
			for (let e of t) e?.();
		};
	}, e.map((e) => {
		let { sensor: t } = e;
		return t;
	}));
}
function Wn(e, t) {
	return (0, _.useMemo)(() => e.reduce((e, n) => {
		let { eventName: r, handler: i } = n;
		return e[r] = (e) => {
			i(e, t);
		}, e;
	}, {}), [e, t]);
}
function Gn(e) {
	return (0, _.useMemo)(() => e ? Pt(e) : null, [e]);
}
var Kn = [];
function qn(e, t) {
	t === void 0 && (t = Mt);
	let [n] = e, r = Gn(n ? Ae(n) : null), [i, a] = (0, _.useState)(Kn);
	function o() {
		a(() => e.length ? e.map((e) => Wt(e) ? r : new en(t(e), e)) : Kn);
	}
	let s = Fn({ callback: o });
	return Fe(() => {
		s?.disconnect(), o(), e.forEach((e) => s?.observe(e));
	}, [e]), i;
}
function Jn(e) {
	if (!e) return null;
	if (e.children.length > 1) return e;
	let t = e.children[0];
	return Me(t) ? t : e;
}
function Yn(e) {
	let { measure: t } = e, [n, r] = (0, _.useState)(null), i = Fn({ callback: (0, _.useCallback)((e) => {
		for (let { target: n } of e) if (Me(n)) {
			r((e) => {
				let r = t(n);
				return e ? {
					...e,
					width: r.width,
					height: r.height
				} : r;
			});
			break;
		}
	}, [t]) }), [a, o] = Be((0, _.useCallback)((e) => {
		let n = Jn(e);
		i?.disconnect(), n && i?.observe(n), r(n ? t(n) : null);
	}, [t, i]));
	return (0, _.useMemo)(() => ({
		nodeRef: a,
		rect: n,
		setRef: o
	}), [
		n,
		a,
		o
	]);
}
var Xn = [{
	sensor: hn,
	options: {}
}, {
	sensor: un,
	options: {}
}], Zn = { current: {} }, Qn = {
	draggable: { measure: Nt },
	droppable: {
		measure: Nt,
		strategy: On.WhileDragging,
		frequency: kn.Optimized
	},
	dragOverlay: { measure: Mt }
}, $n = class extends Map {
	get(e) {
		return e == null ? void 0 : super.get(e) ?? void 0;
	}
	toArray() {
		return Array.from(this.values());
	}
	getEnabled() {
		return this.toArray().filter((e) => {
			let { disabled: t } = e;
			return !t;
		});
	}
	getNodeFor(e) {
		return this.get(e)?.node.current ?? void 0;
	}
}, er = {
	activatorEvent: null,
	active: null,
	activeNode: null,
	activeNodeRect: null,
	collisions: null,
	containerNodeRect: null,
	draggableNodes: /* @__PURE__ */ new Map(),
	droppableRects: /* @__PURE__ */ new Map(),
	droppableContainers: /* @__PURE__ */ new $n(),
	over: null,
	dragOverlay: {
		nodeRef: { current: null },
		rect: null,
		setRef: dt
	},
	scrollableAncestors: [],
	scrollableAncestorRects: [],
	measuringConfiguration: Qn,
	measureDroppableContainers: dt,
	windowRect: null,
	measuringScheduled: !1
}, tr = {
	activatorEvent: null,
	activators: [],
	active: null,
	activeNodeRect: null,
	ariaDescribedById: { draggable: "" },
	dispatch: dt,
	draggableNodes: /* @__PURE__ */ new Map(),
	over: null,
	measureDroppableContainers: dt
}, nr = /* @__PURE__ */ (0, _.createContext)(tr), rr = /* @__PURE__ */ (0, _.createContext)(er);
function ir() {
	return {
		draggable: {
			active: null,
			initialCoordinates: {
				x: 0,
				y: 0
			},
			nodes: /* @__PURE__ */ new Map(),
			translate: {
				x: 0,
				y: 0
			}
		},
		droppable: { containers: new $n() }
	};
}
function ar(e, t) {
	switch (t.type) {
		case ut.DragStart: return {
			...e,
			draggable: {
				...e.draggable,
				initialCoordinates: t.initialCoordinates,
				active: t.active
			}
		};
		case ut.DragMove: return e.draggable.active == null ? e : {
			...e,
			draggable: {
				...e.draggable,
				translate: {
					x: t.coordinates.x - e.draggable.initialCoordinates.x,
					y: t.coordinates.y - e.draggable.initialCoordinates.y
				}
			}
		};
		case ut.DragEnd:
		case ut.DragCancel: return {
			...e,
			draggable: {
				...e.draggable,
				active: null,
				initialCoordinates: {
					x: 0,
					y: 0
				},
				translate: {
					x: 0,
					y: 0
				}
			}
		};
		case ut.RegisterDroppable: {
			let { element: n } = t, { id: r } = n, i = new $n(e.droppable.containers);
			return i.set(r, n), {
				...e,
				droppable: {
					...e.droppable,
					containers: i
				}
			};
		}
		case ut.SetDroppableDisabled: {
			let { id: n, key: r, disabled: i } = t, a = e.droppable.containers.get(n);
			if (!a || r !== a.key) return e;
			let o = new $n(e.droppable.containers);
			return o.set(n, {
				...a,
				disabled: i
			}), {
				...e,
				droppable: {
					...e.droppable,
					containers: o
				}
			};
		}
		case ut.UnregisterDroppable: {
			let { id: n, key: r } = t, i = e.droppable.containers.get(n);
			if (!i || r !== i.key) return e;
			let a = new $n(e.droppable.containers);
			return a.delete(n), {
				...e,
				droppable: {
					...e.droppable,
					containers: a
				}
			};
		}
		default: return e;
	}
}
function or(e) {
	let { disabled: t } = e, { active: n, activatorEvent: r, draggableNodes: i } = (0, _.useContext)(nr), a = Ve(r), o = Ve(n?.id);
	return (0, _.useEffect)(() => {
		if (!t && !r && a && o != null) {
			if (!Je(a) || document.activeElement === a.target) return;
			let e = i.get(o);
			if (!e) return;
			let { activatorNode: t, node: n } = e;
			if (!t.current && !n.current) return;
			requestAnimationFrame(() => {
				for (let e of [t.current, n.current]) {
					if (!e) continue;
					let t = $e(e);
					if (t) {
						t.focus();
						break;
					}
				}
			});
		}
	}, [
		r,
		t,
		i,
		o,
		a
	]), null;
}
function sr(e, t) {
	let { transform: n, ...r } = t;
	return e != null && e.length ? e.reduce((e, t) => t({
		transform: e,
		...r
	}), n) : n;
}
function cr(e) {
	return (0, _.useMemo)(() => ({
		draggable: {
			...Qn.draggable,
			...e?.draggable
		},
		droppable: {
			...Qn.droppable,
			...e?.droppable
		},
		dragOverlay: {
			...Qn.dragOverlay,
			...e?.dragOverlay
		}
	}), [
		e?.draggable,
		e?.droppable,
		e?.dragOverlay
	]);
}
function lr(e) {
	let { activeNode: t, measure: n, initialRect: r, config: i = !0 } = e, a = (0, _.useRef)(!1), { x: o, y: s } = typeof i == "boolean" ? {
		x: i,
		y: i
	} : i;
	Fe(() => {
		if (!o && !s || !t) {
			a.current = !1;
			return;
		}
		if (a.current || !r) return;
		let e = t?.node.current;
		if (!e || e.isConnected === !1) return;
		let i = Et(n(e), r);
		if (o || (i.x = 0), s || (i.y = 0), a.current = !0, Math.abs(i.x) > 0 || Math.abs(i.y) > 0) {
			let t = Rt(e);
			t && t.scrollBy({
				top: i.y,
				left: i.x
			});
		}
	}, [
		t,
		o,
		s,
		r,
		n
	]);
}
var ur = /* @__PURE__ */ (0, _.createContext)({
	...mt,
	scaleX: 1,
	scaleY: 1
}), dr;
(function(e) {
	e[e.Uninitialized = 0] = "Uninitialized", e[e.Initializing = 1] = "Initializing", e[e.Initialized = 2] = "Initialized";
})(dr || (dr = {}));
var fr = /* @__PURE__ */ (0, _.memo)(function(e) {
	let { id: t, accessibility: n, autoScroll: r = !0, children: i, sensors: a = Xn, collisionDetection: o = wt, measuring: s, modifiers: c, ...l } = e, [u, d] = (0, _.useReducer)(ar, void 0, ir), [f, p] = ot(), [m, h] = (0, _.useState)(dr.Uninitialized), g = m === dr.Initialized, { draggable: { active: v, nodes: y, translate: b }, droppable: { containers: x } } = u, S = v == null ? null : y.get(v), C = (0, _.useRef)({
		initial: null,
		translated: null
	}), w = (0, _.useMemo)(() => v == null ? null : {
		id: v,
		data: S?.data ?? Zn,
		rect: C
	}, [v, S]), ee = (0, _.useRef)(null), [te, ne] = (0, _.useState)(null), [T, re] = (0, _.useState)(null), ie = Re(l, Object.values(l)), ae = Ue("DndDescribedBy", t), oe = (0, _.useMemo)(() => x.getEnabled(), [x]), se = cr(s), { droppableRects: ce, measureDroppableContainers: le, measuringScheduled: E } = jn(oe, {
		dragging: g,
		dependencies: [b.x, b.y],
		config: se.droppable
	}), D = En(y, v), ue = (0, _.useMemo)(() => T ? Xe(T) : null, [T]), de = He(), fe = Nn(D, se.draggable.measure);
	lr({
		activeNode: v == null ? null : y.get(v),
		config: de.layoutShiftCompensation,
		initialRect: fe,
		measure: se.draggable.measure
	});
	let O = Ln(D, se.draggable.measure, fe), pe = Ln(D ? D.parentElement : null), k = (0, _.useRef)({
		activatorEvent: null,
		active: null,
		activeNode: D,
		collisionRect: null,
		collisions: null,
		droppableRects: ce,
		draggableNodes: y,
		draggingNode: null,
		draggingNodeRect: null,
		droppableContainers: x,
		over: null,
		scrollableAncestors: [],
		scrollAdjustedTranslate: null
	}), me = x.getNodeFor(k.current.over?.id), A = Yn({ measure: se.dragOverlay.measure }), j = A.nodeRef.current ?? D, he = g ? A.rect ?? O : null, ge = !!(A.nodeRef.current && A.rect), _e = Rn(ge ? null : O), ve = Gn(j ? Ae(j) : null), ye = Bn(g ? me ?? D : null), be = qn(ye), xe = sr(c, {
		transform: {
			x: b.x - _e.x,
			y: b.y - _e.y,
			scaleX: 1,
			scaleY: 1
		},
		activatorEvent: T,
		active: w,
		activeNodeRect: O,
		containerNodeRect: pe,
		draggingNodeRect: he,
		over: k.current.over,
		overlayNodeRect: A.rect,
		scrollableAncestors: ye,
		scrollableAncestorRects: be,
		windowRect: ve
	}), Se = ue ? Ge(ue, b) : null, Ce = Vn(ye), we = Hn(Ce), Ee = Hn(Ce, [O]), De = Ge(xe, we), Oe = he ? Ot(he, xe) : null, ke = w && Oe ? o({
		active: w,
		collisionRect: Oe,
		droppableRects: ce,
		droppableContainers: oe,
		pointerCoordinates: Se
	}) : null, je = yt(ke, "id"), [Me, Ne] = (0, _.useState)(null), Pe = Tt(ge ? xe : Ge(xe, Ee), Me?.rect ?? null, O), Ie = (0, _.useRef)(null), Le = (0, _.useCallback)((e, t) => {
		let { sensor: n, options: r } = t;
		if (ee.current == null) return;
		let i = y.get(ee.current);
		if (!i) return;
		let a = e.nativeEvent;
		Ie.current = new n({
			active: ee.current,
			activeNode: i,
			event: a,
			options: r,
			context: k,
			onAbort(e) {
				if (!y.get(e)) return;
				let { onDragAbort: t } = ie.current, n = { id: e };
				t?.(n), f({
					type: "onDragAbort",
					event: n
				});
			},
			onPending(e, t, n, r) {
				if (!y.get(e)) return;
				let { onDragPending: i } = ie.current, a = {
					id: e,
					constraint: t,
					initialCoordinates: n,
					offset: r
				};
				i?.(a), f({
					type: "onDragPending",
					event: a
				});
			},
			onStart(e) {
				let t = ee.current;
				if (t == null) return;
				let n = y.get(t);
				if (!n) return;
				let { onDragStart: r } = ie.current, i = {
					activatorEvent: a,
					active: {
						id: t,
						data: n.data,
						rect: C
					}
				};
				(0, Te.unstable_batchedUpdates)(() => {
					r?.(i), h(dr.Initializing), d({
						type: ut.DragStart,
						initialCoordinates: e,
						active: t
					}), f({
						type: "onDragStart",
						event: i
					}), ne(Ie.current), re(a);
				});
			},
			onMove(e) {
				d({
					type: ut.DragMove,
					coordinates: e
				});
			},
			onEnd: o(ut.DragEnd),
			onCancel: o(ut.DragCancel)
		});
		function o(e) {
			return async function() {
				let { active: t, collisions: n, over: r, scrollAdjustedTranslate: i } = k.current, o = null;
				if (t && i) {
					let { cancelDrop: s } = ie.current;
					o = {
						activatorEvent: a,
						active: t,
						collisions: n,
						delta: i,
						over: r
					}, e === ut.DragEnd && typeof s == "function" && await Promise.resolve(s(o)) && (e = ut.DragCancel);
				}
				ee.current = null, (0, Te.unstable_batchedUpdates)(() => {
					d({ type: e }), h(dr.Uninitialized), Ne(null), ne(null), re(null), Ie.current = null;
					let t = e === ut.DragEnd ? "onDragEnd" : "onDragCancel";
					if (o) {
						let e = ie.current[t];
						e?.(o), f({
							type: t,
							event: o
						});
					}
				});
			};
		}
	}, [y]), ze = Dn(a, (0, _.useCallback)((e, t) => (n, r) => {
		let i = n.nativeEvent, a = y.get(r);
		if (ee.current !== null || !a || i.dndKit || i.defaultPrevented) return;
		let o = { active: a };
		e(n, t.options, o) === !0 && (i.dndKit = { capturedBy: t.sensor }, ee.current = r, Le(n, t));
	}, [y, Le]));
	Un(a), Fe(() => {
		O && m === dr.Initializing && h(dr.Initialized);
	}, [O, m]), (0, _.useEffect)(() => {
		let { onDragMove: e } = ie.current, { active: t, activatorEvent: n, collisions: r, over: i } = k.current;
		if (!t || !n) return;
		let a = {
			active: t,
			activatorEvent: n,
			collisions: r,
			delta: {
				x: De.x,
				y: De.y
			},
			over: i
		};
		(0, Te.unstable_batchedUpdates)(() => {
			e?.(a), f({
				type: "onDragMove",
				event: a
			});
		});
	}, [De.x, De.y]), (0, _.useEffect)(() => {
		let { active: e, activatorEvent: t, collisions: n, droppableContainers: r, scrollAdjustedTranslate: i } = k.current;
		if (!e || ee.current == null || !t || !i) return;
		let { onDragOver: a } = ie.current, o = r.get(je), s = o && o.rect.current ? {
			id: o.id,
			rect: o.rect.current,
			data: o.data,
			disabled: o.disabled
		} : null, c = {
			active: e,
			activatorEvent: t,
			collisions: n,
			delta: {
				x: i.x,
				y: i.y
			},
			over: s
		};
		(0, Te.unstable_batchedUpdates)(() => {
			Ne(s), a?.(c), f({
				type: "onDragOver",
				event: c
			});
		});
	}, [je]), Fe(() => {
		k.current = {
			activatorEvent: T,
			active: w,
			activeNode: D,
			collisionRect: Oe,
			collisions: ke,
			droppableRects: ce,
			draggableNodes: y,
			draggingNode: j,
			draggingNodeRect: he,
			droppableContainers: x,
			over: Me,
			scrollableAncestors: ye,
			scrollAdjustedTranslate: De
		}, C.current = {
			initial: he,
			translated: Oe
		};
	}, [
		w,
		D,
		ke,
		Oe,
		y,
		j,
		he,
		ce,
		x,
		Me,
		ye,
		De
	]), Cn({
		...de,
		delta: b,
		draggingRect: Oe,
		pointerCoordinates: Se,
		scrollableAncestors: ye,
		scrollableAncestorRects: be
	});
	let Be = (0, _.useMemo)(() => ({
		active: w,
		activeNode: D,
		activeNodeRect: O,
		activatorEvent: T,
		collisions: ke,
		containerNodeRect: pe,
		dragOverlay: A,
		draggableNodes: y,
		droppableContainers: x,
		droppableRects: ce,
		over: Me,
		measureDroppableContainers: le,
		scrollableAncestors: ye,
		scrollableAncestorRects: be,
		measuringConfiguration: se,
		measuringScheduled: E,
		windowRect: ve
	}), [
		w,
		D,
		O,
		T,
		ke,
		pe,
		A,
		y,
		x,
		ce,
		Me,
		le,
		ye,
		be,
		se,
		E,
		ve
	]), Ve = (0, _.useMemo)(() => ({
		activatorEvent: T,
		activators: ze,
		active: w,
		activeNodeRect: O,
		ariaDescribedById: { draggable: ae },
		dispatch: d,
		draggableNodes: y,
		over: Me,
		measureDroppableContainers: le
	}), [
		T,
		ze,
		w,
		O,
		d,
		ae,
		y,
		Me,
		le
	]);
	return _.createElement(it.Provider, { value: p }, _.createElement(nr.Provider, { value: Ve }, _.createElement(rr.Provider, { value: Be }, _.createElement(ur.Provider, { value: Pe }, i)), _.createElement(or, { disabled: n?.restoreFocus === !1 })), _.createElement(lt, {
		...n,
		hiddenTextDescribedById: ae
	}));
	function He() {
		let e = te?.autoScrollEnabled === !1, t = typeof r == "object" ? r.enabled === !1 : r === !1, n = g && !e && !t;
		return typeof r == "object" ? {
			...r,
			enabled: n
		} : { enabled: n };
	}
}), pr = /* @__PURE__ */ (0, _.createContext)(null), mr = "button", hr = "Draggable";
function gr(e) {
	let { id: t, data: n, disabled: r = !1, attributes: i } = e, a = Ue(hr), { activators: o, activatorEvent: s, active: c, activeNodeRect: l, ariaDescribedById: u, draggableNodes: d, over: f } = (0, _.useContext)(nr), { role: p = mr, roleDescription: m = "draggable", tabIndex: h = 0 } = i ?? {}, g = c?.id === t, v = (0, _.useContext)(g ? ur : pr), [y, b] = Be(), [x, S] = Be(), C = Wn(o, t), w = Re(n);
	return Fe(() => (d.set(t, {
		id: t,
		key: a,
		node: y,
		activatorNode: x,
		data: w
	}), () => {
		let e = d.get(t);
		e && e.key === a && d.delete(t);
	}), [d, t]), {
		active: c,
		activatorEvent: s,
		activeNodeRect: l,
		attributes: (0, _.useMemo)(() => ({
			role: p,
			tabIndex: h,
			"aria-disabled": r,
			"aria-pressed": g && p === mr ? !0 : void 0,
			"aria-roledescription": m,
			"aria-describedby": u.draggable
		}), [
			r,
			p,
			h,
			g,
			m,
			u.draggable
		]),
		isDragging: g,
		listeners: r ? void 0 : C,
		node: y,
		over: f,
		setNodeRef: b,
		setActivatorNodeRef: S,
		transform: v
	};
}
function _r() {
	return (0, _.useContext)(rr);
}
var vr = "Droppable", yr = { timeout: 25 };
function br(e) {
	let { data: t, disabled: n = !1, id: r, resizeObserverConfig: i } = e, a = Ue(vr), { active: o, dispatch: s, over: c, measureDroppableContainers: l } = (0, _.useContext)(nr), u = (0, _.useRef)({ disabled: n }), d = (0, _.useRef)(!1), f = (0, _.useRef)(null), p = (0, _.useRef)(null), { disabled: m, updateMeasurementsFor: h, timeout: g } = {
		...yr,
		...i
	}, v = Re(h ?? r), y = Fn({
		callback: (0, _.useCallback)(() => {
			if (!d.current) {
				d.current = !0;
				return;
			}
			p.current != null && clearTimeout(p.current), p.current = setTimeout(() => {
				l(Array.isArray(v.current) ? v.current : [v.current]), p.current = null;
			}, g);
		}, [g]),
		disabled: m || !o
	}), [b, x] = Be((0, _.useCallback)((e, t) => {
		y && (t && (y.unobserve(t), d.current = !1), e && y.observe(e));
	}, [y])), S = Re(t);
	return (0, _.useEffect)(() => {
		!y || !b.current || (y.disconnect(), d.current = !1, y.observe(b.current));
	}, [b, y]), (0, _.useEffect)(() => (s({
		type: ut.RegisterDroppable,
		element: {
			id: r,
			key: a,
			disabled: n,
			node: b,
			rect: f,
			data: S
		}
	}), () => s({
		type: ut.UnregisterDroppable,
		key: a,
		id: r
	})), [r]), (0, _.useEffect)(() => {
		n !== u.current.disabled && (s({
			type: ut.SetDroppableDisabled,
			id: r,
			key: a,
			disabled: n
		}), u.current.disabled = n);
	}, [
		r,
		a,
		n,
		s
	]), {
		active: o,
		rect: f,
		isOver: c?.id === r,
		node: b,
		over: c,
		setNodeRef: x
	};
}
//#endregion
//#region node_modules/@dnd-kit/sortable/dist/sortable.esm.js
function xr(e, t, n) {
	let r = e.slice();
	return r.splice(n < 0 ? r.length + n : n, 0, r.splice(t, 1)[0]), r;
}
function Sr(e, t) {
	return e.reduce((e, n, r) => {
		let i = t.get(n);
		return i && (e[r] = i), e;
	}, Array(e.length));
}
function Cr(e) {
	return e !== null && e >= 0;
}
function wr(e, t) {
	if (e === t) return !0;
	if (e.length !== t.length) return !1;
	for (let n = 0; n < e.length; n++) if (e[n] !== t[n]) return !1;
	return !0;
}
function Tr(e) {
	return typeof e == "boolean" ? {
		draggable: e,
		droppable: e
	} : e;
}
var Er = (e) => {
	let { rects: t, activeIndex: n, overIndex: r, index: i } = e, a = xr(t, r, n), o = t[i], s = a[i];
	return !s || !o ? null : {
		x: s.left - o.left,
		y: s.top - o.top,
		scaleX: s.width / o.width,
		scaleY: s.height / o.height
	};
}, Dr = {
	scaleX: 1,
	scaleY: 1
}, Or = (e) => {
	let { activeIndex: t, activeNodeRect: n, index: r, rects: i, overIndex: a } = e, o = i[t] ?? n;
	if (!o) return null;
	if (r === t) {
		let e = i[a];
		return e ? {
			x: 0,
			y: t < a ? e.top + e.height - (o.top + o.height) : e.top - o.top,
			...Dr
		} : null;
	}
	let s = kr(i, r, t);
	return r > t && r <= a ? {
		x: 0,
		y: -o.height - s,
		...Dr
	} : r < t && r >= a ? {
		x: 0,
		y: o.height + s,
		...Dr
	} : {
		x: 0,
		y: 0,
		...Dr
	};
};
function kr(e, t, n) {
	let r = e[t], i = e[t - 1], a = e[t + 1];
	return r ? n < t ? i ? r.top - (i.top + i.height) : a ? a.top - (r.top + r.height) : 0 : a ? a.top - (r.top + r.height) : i ? r.top - (i.top + i.height) : 0 : 0;
}
var Ar = "Sortable", jr = /* @__PURE__ */ _.createContext({
	activeIndex: -1,
	containerId: Ar,
	disableTransforms: !1,
	items: [],
	overIndex: -1,
	useDragOverlay: !1,
	sortedRects: [],
	strategy: Er,
	disabled: {
		draggable: !1,
		droppable: !1
	}
});
function Mr(e) {
	let { children: t, id: n, items: r, strategy: i = Er, disabled: a = !1 } = e, { active: o, dragOverlay: s, droppableRects: c, over: l, measureDroppableContainers: u } = _r(), d = Ue(Ar, n), f = s.rect !== null, p = (0, _.useMemo)(() => r.map((e) => typeof e == "object" && "id" in e ? e.id : e), [r]), m = o != null, h = o ? p.indexOf(o.id) : -1, g = l ? p.indexOf(l.id) : -1, v = (0, _.useRef)(p), y = !wr(p, v.current), b = g !== -1 && h === -1 || y, x = Tr(a);
	Fe(() => {
		y && m && u(p);
	}, [
		y,
		p,
		m,
		u
	]), (0, _.useEffect)(() => {
		v.current = p;
	}, [p]);
	let S = (0, _.useMemo)(() => ({
		activeIndex: h,
		containerId: d,
		disabled: x,
		disableTransforms: b,
		items: p,
		overIndex: g,
		useDragOverlay: f,
		sortedRects: Sr(p, c),
		strategy: i
	}), [
		h,
		d,
		x.draggable,
		x.droppable,
		b,
		p,
		g,
		c,
		f,
		i
	]);
	return _.createElement(jr.Provider, { value: S }, t);
}
var Nr = (e) => {
	let { id: t, items: n, activeIndex: r, overIndex: i } = e;
	return xr(n, r, i).indexOf(t);
}, Pr = (e) => {
	let { containerId: t, isSorting: n, wasDragging: r, index: i, items: a, newIndex: o, previousItems: s, previousContainerId: c, transition: l } = e;
	return !l || !r || s !== a && i === o ? !1 : n ? !0 : o !== i && t === c;
}, Fr = {
	duration: 200,
	easing: "ease"
}, Ir = "transform", Lr = /* @__PURE__ */ Ze.Transition.toString({
	property: Ir,
	duration: 0,
	easing: "linear"
}), Rr = { roleDescription: "sortable" };
function zr(e) {
	let { disabled: t, index: n, node: r, rect: i } = e, [a, o] = (0, _.useState)(null), s = (0, _.useRef)(n);
	return Fe(() => {
		if (!t && n !== s.current && r.current) {
			let e = i.current;
			if (e) {
				let t = Mt(r.current, { ignoreTransform: !0 }), n = {
					x: e.left - t.left,
					y: e.top - t.top,
					scaleX: e.width / t.width,
					scaleY: e.height / t.height
				};
				(n.x || n.y) && o(n);
			}
		}
		n !== s.current && (s.current = n);
	}, [
		t,
		n,
		r,
		i
	]), (0, _.useEffect)(() => {
		a && o(null);
	}, [a]), a;
}
function Br(e) {
	let { animateLayoutChanges: t = Pr, attributes: n, disabled: r, data: i, getNewIndex: a = Nr, id: o, strategy: s, resizeObserverConfig: c, transition: l = Fr } = e, { items: u, containerId: d, activeIndex: f, disabled: p, disableTransforms: m, sortedRects: h, overIndex: g, useDragOverlay: v, strategy: y } = (0, _.useContext)(jr), b = Vr(r, p), x = u.indexOf(o), S = (0, _.useMemo)(() => ({
		sortable: {
			containerId: d,
			index: x,
			items: u
		},
		...i
	}), [
		d,
		i,
		x,
		u
	]), C = (0, _.useMemo)(() => u.slice(u.indexOf(o)), [u, o]), { rect: w, node: ee, isOver: te, setNodeRef: ne } = br({
		id: o,
		data: S,
		disabled: b.droppable,
		resizeObserverConfig: {
			updateMeasurementsFor: C,
			...c
		}
	}), { active: T, activatorEvent: re, activeNodeRect: ie, attributes: ae, setNodeRef: oe, listeners: se, isDragging: ce, over: le, setActivatorNodeRef: E, transform: D } = gr({
		id: o,
		data: S,
		attributes: {
			...Rr,
			...n
		},
		disabled: b.draggable
	}), ue = Ee(ne, oe), de = !!T, fe = de && !m && Cr(f) && Cr(g), O = !v && ce, pe = fe ? (O && fe ? D : null) ?? (s ?? y)({
		rects: h,
		activeNodeRect: ie,
		activeIndex: f,
		overIndex: g,
		index: x
	}) : null, k = Cr(f) && Cr(g) ? a({
		id: o,
		items: u,
		activeIndex: f,
		overIndex: g
	}) : x, me = T?.id, A = (0, _.useRef)({
		activeId: me,
		items: u,
		newIndex: k,
		containerId: d
	}), j = u !== A.current.items, he = t({
		active: T,
		containerId: d,
		isDragging: ce,
		isSorting: de,
		id: o,
		index: x,
		items: u,
		newIndex: A.current.newIndex,
		previousItems: A.current.items,
		previousContainerId: A.current.containerId,
		transition: l,
		wasDragging: A.current.activeId != null
	}), ge = zr({
		disabled: !he,
		index: x,
		node: ee,
		rect: w
	});
	return (0, _.useEffect)(() => {
		de && A.current.newIndex !== k && (A.current.newIndex = k), d !== A.current.containerId && (A.current.containerId = d), u !== A.current.items && (A.current.items = u);
	}, [
		de,
		k,
		d,
		u
	]), (0, _.useEffect)(() => {
		if (me === A.current.activeId) return;
		if (me && !A.current.activeId) {
			A.current.activeId = me;
			return;
		}
		let e = setTimeout(() => {
			A.current.activeId = me;
		}, 50);
		return () => clearTimeout(e);
	}, [me]), {
		active: T,
		activeIndex: f,
		attributes: ae,
		data: S,
		rect: w,
		index: x,
		newIndex: k,
		items: u,
		isOver: te,
		isSorting: de,
		isDragging: ce,
		listeners: se,
		node: ee,
		overIndex: g,
		over: le,
		setNodeRef: ue,
		setActivatorNodeRef: E,
		setDroppableNodeRef: ne,
		setDraggableNodeRef: oe,
		transform: ge ?? pe,
		transition: _e()
	};
	function _e() {
		if (ge || j && A.current.newIndex === x) return Lr;
		if (!(O && !Je(re) || !l) && (de || he)) return Ze.Transition.toString({
			...l,
			property: Ir
		});
	}
}
function Vr(e, t) {
	return typeof e == "boolean" ? {
		draggable: e,
		droppable: !1
	} : {
		draggable: e?.draggable ?? t.draggable,
		droppable: e?.droppable ?? t.droppable
	};
}
function Hr(e) {
	if (!e) return !1;
	let t = e.data.current;
	return !!(t && "sortable" in t && typeof t.sortable == "object" && "containerId" in t.sortable && "items" in t.sortable && "index" in t.sortable);
}
var Ur = [
	M.Down,
	M.Right,
	M.Up,
	M.Left
], Wr = (e, t) => {
	let { context: { active: n, collisionRect: r, droppableRects: i, droppableContainers: a, over: o, scrollableAncestors: s } } = t;
	if (Ur.includes(e.code)) {
		if (e.preventDefault(), !n || !r) return;
		let t = [];
		a.getEnabled().forEach((n) => {
			if (!n || n != null && n.disabled) return;
			let a = i.get(n.id);
			if (a) switch (e.code) {
				case M.Down:
					r.top < a.top && t.push(n);
					break;
				case M.Up:
					r.top > a.top && t.push(n);
					break;
				case M.Left:
					r.left > a.left && t.push(n);
					break;
				case M.Right:
					r.left < a.left && t.push(n);
					break;
			}
		});
		let c = St({
			active: n,
			collisionRect: r,
			droppableRects: i,
			droppableContainers: t,
			pointerCoordinates: null
		}), l = yt(c, "id");
		if (l === o?.id && c.length > 1 && (l = c[1].id), l != null) {
			let e = a.get(n.id), t = a.get(l), o = t ? i.get(t.id) : null, c = t?.node.current;
			if (c && o && e && t) {
				let n = Lt(c).some((e, t) => s[t] !== e), i = Gr(e, t), a = Kr(e, t), l = n || !i ? {
					x: 0,
					y: 0
				} : {
					x: a ? r.width - o.width : 0,
					y: a ? r.height - o.height : 0
				}, u = {
					x: o.left,
					y: o.top
				};
				return l.x && l.y ? u : Ke(u, l);
			}
		}
	}
};
function Gr(e, t) {
	return !Hr(e) || !Hr(t) ? !1 : e.data.current.sortable.containerId === t.data.current.sortable.containerId;
}
function Kr(e, t) {
	return !Hr(e) || !Hr(t) || !Gr(e, t) ? !1 : e.data.current.sortable.index < t.data.current.sortable.index;
}
//#endregion
//#region src/api.ts
function qr(e) {
	return e && (e.label || e.name || e.slug) || "(unnamed)";
}
function Jr(e) {
	return e.fields ?? e.field_schema ?? [];
}
async function Yr(e, t) {
	await Xr(`/admin/api/nodes/${e}`, {
		method: "PATCH",
		body: JSON.stringify(t)
	});
}
async function Xr(e, t) {
	let n = await fetch(e, {
		credentials: "same-origin",
		...t,
		headers: {
			Accept: "application/json",
			...t?.method && t.method !== "GET" ? { "Content-Type": "application/json" } : {},
			...t?.headers ?? {}
		}
	});
	if (!n.ok) {
		let e = `${n.status} ${n.statusText}`;
		try {
			let t = await n.json();
			t?.error?.message ? e = t.error.message : typeof t?.message == "string" && (e = t.message);
		} catch {}
		throw Error(e);
	}
	return await n.json();
}
async function Zr(e) {
	return (await Xr(`/admin/api/nodes/${e}`)).data;
}
async function Qr() {
	return (await Xr("/admin/api/node-types")).data ?? [];
}
async function $r() {
	return (await Xr("/admin/api/block-types?per_page=1000")).data ?? [];
}
async function ei(e, t) {
	let n = {};
	return new URLSearchParams(window.location.search).forEach((e, t) => {
		n[t] = e;
	}), (await Xr(`/admin/api/nodes/${e}/render-blocks`, {
		method: "POST",
		body: JSON.stringify({
			blocks: t,
			path: window.location.pathname,
			query: n
		})
	})).data?.html ?? [];
}
function ti(e) {
	let t = e.match(/<!-- block error: ([\s\S]*?) -->/);
	if (!t) return null;
	let n = document.createElement("textarea");
	return n.innerHTML = t[1] ?? "", n.value;
}
async function ni(e = {}) {
	let t = new URLSearchParams();
	return t.set("per_page", String(e.perPage ?? 50)), e.search && t.set("search", e.search), e.mime && t.set("mime_type", e.mime), (await Xr(`/admin/api/ext/media-manager/?${t.toString()}`)).data ?? [];
}
function ri(e) {
	return typeof e == "string" ? e.startsWith("theme-asset:") ? "" : e : e && typeof e == "object" && typeof e.url == "string" ? e.url : "";
}
async function ii(e = {}) {
	let t = new URLSearchParams();
	return t.set("limit", String(e.limit ?? 25)), e.search && t.set("q", e.search), e.nodeType && t.set("node_type", e.nodeType), (await Xr(`/admin/api/nodes/search?${t.toString()}`)).data ?? [];
}
async function ai(e, t, n = {}) {
	let r = new URLSearchParams();
	return r.set("per_page", String(n.perPage ?? 100)), n.search && r.set("search", n.search), (await Xr(`/admin/api/terms/${encodeURIComponent(e)}/${encodeURIComponent(t)}?${r.toString()}`)).data ?? [];
}
async function oi() {
	return (await Xr("/admin/api/icons")).data?.providers ?? [];
}
async function si(e, t, n, r = 96) {
	let i = new URLSearchParams({
		provider: e,
		page: String(n),
		per_page: String(r)
	});
	t && i.set("q", t);
	let a = await Xr(`/admin/api/icons?${i.toString()}`);
	return {
		icons: a.data?.icons ?? [],
		total: a.data?.total ?? 0
	};
}
async function ci(e) {
	let t = [];
	for (let n = 0; n < e.length; n += 50) {
		let r = e.slice(n, n + 50), i = await Xr(`/admin/api/icons?${new URLSearchParams({ values: r.join(",") }).toString()}`);
		t.push(...i.data?.icons ?? []);
	}
	return t;
}
function li(e, t) {
	return e === "page" ? `/admin/pages/${t}/edit` : e === "post" ? `/admin/posts/${t}/edit` : `/admin/content/${encodeURIComponent(e)}/${t}/edit`;
}
var ui = (e) => e ? { "X-Admin-Language": e } : {};
async function di() {
	return (await Xr("/admin/api/theme-settings")).data?.pages ?? [];
}
async function fi(e, t) {
	return (await Xr(`/admin/api/theme-settings/${encodeURIComponent(e)}`, { headers: ui(t) })).data;
}
async function pi(e, t, n) {
	await Xr(`/admin/api/theme-settings/${encodeURIComponent(e)}`, {
		method: "PUT",
		body: JSON.stringify({ values: t }),
		headers: ui(n)
	});
}
async function mi() {
	try {
		return await ni({ perPage: 1 }), !0;
	} catch {
		return !1;
	}
}
//#endregion
//#region node_modules/react/cjs/react-jsx-runtime.production.js
var hi = /* @__PURE__ */ o(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.fragment");
	function r(e, n, r) {
		var i = null;
		if (r !== void 0 && (i = "" + r), n.key !== void 0 && (i = "" + n.key), "key" in n) for (var a in r = {}, n) a !== "key" && (r[a] = n[a]);
		else r = n;
		return n = r.ref, {
			$$typeof: t,
			type: e,
			key: i,
			ref: n === void 0 ? null : n,
			props: r
		};
	}
	e.Fragment = n, e.jsx = r, e.jsxs = r;
})), N = (/* @__PURE__ */ o(((e, t) => {
	t.exports = hi();
})))(), gi = {
	"chevron-down": /* @__PURE__ */ (0, N.jsx)("path", { d: "m6 9 6 6 6-6" }),
	"arrow-up": /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)("path", { d: "m5 12 7-7 7 7" }), /* @__PURE__ */ (0, N.jsx)("path", { d: "M12 19V5" })] }),
	"arrow-down": /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)("path", { d: "M12 5v14" }), /* @__PURE__ */ (0, N.jsx)("path", { d: "m19 12-7 7-7-7" })] }),
	copy: /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)("rect", {
		width: "14",
		height: "14",
		x: "8",
		y: "8",
		rx: "2",
		ry: "2"
	}), /* @__PURE__ */ (0, N.jsx)("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })] }),
	trash: /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [
		/* @__PURE__ */ (0, N.jsx)("path", { d: "M3 6h18" }),
		/* @__PURE__ */ (0, N.jsx)("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
		/* @__PURE__ */ (0, N.jsx)("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }),
		/* @__PURE__ */ (0, N.jsx)("path", { d: "M10 11v6" }),
		/* @__PURE__ */ (0, N.jsx)("path", { d: "M14 11v6" })
	] }),
	x: /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)("path", { d: "M18 6 6 18" }), /* @__PURE__ */ (0, N.jsx)("path", { d: "m6 6 12 12" })] }),
	plus: /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)("path", { d: "M5 12h14" }), /* @__PURE__ */ (0, N.jsx)("path", { d: "M12 5v14" })] }),
	grip: /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [
		/* @__PURE__ */ (0, N.jsx)("circle", {
			cx: "9",
			cy: "12",
			r: "1"
		}),
		/* @__PURE__ */ (0, N.jsx)("circle", {
			cx: "9",
			cy: "5",
			r: "1"
		}),
		/* @__PURE__ */ (0, N.jsx)("circle", {
			cx: "9",
			cy: "19",
			r: "1"
		}),
		/* @__PURE__ */ (0, N.jsx)("circle", {
			cx: "15",
			cy: "12",
			r: "1"
		}),
		/* @__PURE__ */ (0, N.jsx)("circle", {
			cx: "15",
			cy: "5",
			r: "1"
		}),
		/* @__PURE__ */ (0, N.jsx)("circle", {
			cx: "15",
			cy: "19",
			r: "1"
		})
	] }),
	external: /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [
		/* @__PURE__ */ (0, N.jsx)("path", { d: "M15 3h6v6" }),
		/* @__PURE__ */ (0, N.jsx)("path", { d: "M10 14 21 3" }),
		/* @__PURE__ */ (0, N.jsx)("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" })
	] }),
	search: /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)("circle", {
		cx: "11",
		cy: "11",
		r: "8"
	}), /* @__PURE__ */ (0, N.jsx)("path", { d: "m21 21-4.3-4.3" })] }),
	image: /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [
		/* @__PURE__ */ (0, N.jsx)("rect", {
			width: "18",
			height: "18",
			x: "3",
			y: "3",
			rx: "2",
			ry: "2"
		}),
		/* @__PURE__ */ (0, N.jsx)("circle", {
			cx: "9",
			cy: "9",
			r: "2"
		}),
		/* @__PURE__ */ (0, N.jsx)("path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" })
	] }),
	file: /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)("path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }), /* @__PURE__ */ (0, N.jsx)("path", { d: "M14 2v4a2 2 0 0 0 2 2h4" })] }),
	check: /* @__PURE__ */ (0, N.jsx)("path", { d: "M20 6 9 17l-5-5" }),
	"corner-down-left": /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)("polyline", { points: "9 10 4 15 9 20" }), /* @__PURE__ */ (0, N.jsx)("path", { d: "M20 4v7a4 4 0 0 1-4 4H4" })] }),
	info: /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [
		/* @__PURE__ */ (0, N.jsx)("circle", {
			cx: "12",
			cy: "12",
			r: "10"
		}),
		/* @__PURE__ */ (0, N.jsx)("path", { d: "M12 16v-4" }),
		/* @__PURE__ */ (0, N.jsx)("path", { d: "M12 8h.01" })
	] }),
	alert: /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [
		/* @__PURE__ */ (0, N.jsx)("path", { d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" }),
		/* @__PURE__ */ (0, N.jsx)("path", { d: "M12 9v4" }),
		/* @__PURE__ */ (0, N.jsx)("path", { d: "M12 17h.01" })
	] }),
	square: /* @__PURE__ */ (0, N.jsx)("rect", {
		width: "16",
		height: "16",
		x: "4",
		y: "4",
		rx: "2"
	}),
	smile: /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [
		/* @__PURE__ */ (0, N.jsx)("circle", {
			cx: "12",
			cy: "12",
			r: "10"
		}),
		/* @__PURE__ */ (0, N.jsx)("path", { d: "M8 14s1.5 2 4 2 4-2 4-2" }),
		/* @__PURE__ */ (0, N.jsx)("path", { d: "M9 9h.01" }),
		/* @__PURE__ */ (0, N.jsx)("path", { d: "M15 9h.01" })
	] }),
	shapes: /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [
		/* @__PURE__ */ (0, N.jsx)("path", { d: "M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z" }),
		/* @__PURE__ */ (0, N.jsx)("rect", {
			x: "3",
			y: "14",
			width: "7",
			height: "7",
			rx: "1"
		}),
		/* @__PURE__ */ (0, N.jsx)("circle", {
			cx: "17.5",
			cy: "17.5",
			r: "3.5"
		})
	] }),
	"collapse-all": /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)("path", { d: "m7 20 5-5 5 5" }), /* @__PURE__ */ (0, N.jsx)("path", { d: "m7 4 5 5 5-5" })] }),
	"expand-all": /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)("path", { d: "m7 15 5 5 5-5" }), /* @__PURE__ */ (0, N.jsx)("path", { d: "m7 9 5-5 5 5" })] }),
	blocks: /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)("rect", {
		width: "7",
		height: "7",
		x: "14",
		y: "3",
		rx: "1"
	}), /* @__PURE__ */ (0, N.jsx)("path", { d: "M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3" })] }),
	tag: /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)("path", { d: "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" }), /* @__PURE__ */ (0, N.jsx)("circle", {
		cx: "7.5",
		cy: "7.5",
		r: ".5",
		fill: "currentColor"
	})] }),
	link: /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)("path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" }), /* @__PURE__ */ (0, N.jsx)("path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" })] }),
	loader: /* @__PURE__ */ (0, N.jsx)("path", { d: "M21 12a9 9 0 1 1-6.219-8.56" }),
	message: /* @__PURE__ */ (0, N.jsx)("path", { d: "M7.9 20A9 9 0 1 0 4 16.1L2 22Z" }),
	"map-pin": /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)("path", { d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" }), /* @__PURE__ */ (0, N.jsx)("circle", {
		cx: "12",
		cy: "10",
		r: "3"
	})] }),
	pencil: /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)("path", { d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" }), /* @__PURE__ */ (0, N.jsx)("path", { d: "m15 5 4 4" })] }),
	globe: /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [
		/* @__PURE__ */ (0, N.jsx)("circle", {
			cx: "12",
			cy: "12",
			r: "10"
		}),
		/* @__PURE__ */ (0, N.jsx)("path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" }),
		/* @__PURE__ */ (0, N.jsx)("path", { d: "M2 12h20" })
	] }),
	hash: /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [
		/* @__PURE__ */ (0, N.jsx)("path", { d: "M4 9h16" }),
		/* @__PURE__ */ (0, N.jsx)("path", { d: "M4 15h16" }),
		/* @__PURE__ */ (0, N.jsx)("path", { d: "M10 3 8 21" }),
		/* @__PURE__ */ (0, N.jsx)("path", { d: "m16 3-2 18" })
	] }),
	mail: /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)("rect", {
		width: "20",
		height: "16",
		x: "2",
		y: "4",
		rx: "2"
	}), /* @__PURE__ */ (0, N.jsx)("path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" })] }),
	phone: /* @__PURE__ */ (0, N.jsx)("path", { d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" })
};
function P({ name: e, size: t = 16, strokeWidth: n = 1.9, className: r, style: i }) {
	return /* @__PURE__ */ (0, N.jsx)("svg", {
		viewBox: "0 0 24 24",
		width: t,
		height: t,
		fill: "none",
		stroke: "currentColor",
		strokeWidth: n,
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		focusable: "false",
		className: r,
		style: i,
		children: gi[e]
	});
}
function _i({ svg: e, className: t }) {
	return /* @__PURE__ */ (0, N.jsx)("span", {
		className: t ? `vedit-svg ${t}` : "vedit-svg",
		"aria-hidden": "true",
		dangerouslySetInnerHTML: { __html: e }
	});
}
var vi = [], yi = !1;
function bi(e) {
	if (e.key !== "Escape") return;
	let t = vi[vi.length - 1];
	t && (t.exclusive && (e.preventDefault(), e.stopPropagation()), t.fn(e));
}
function xi(e, t) {
	let n = {
		fn: e,
		exclusive: t
	};
	return vi.push(n), yi || (window.addEventListener("keydown", bi, !0), yi = !0), () => {
		let e = vi.indexOf(n);
		e >= 0 && vi.splice(e, 1);
	};
}
function Si() {
	return vi.some((e) => e.exclusive);
}
var Ci = null;
function wi(e) {
	Ci = e;
}
function Ti({ title: e, subtitle: t, size: n = "md", onClose: r, footer: i, className: a, children: o }) {
	let s = (0, _.useRef)(r);
	s.current = r, (0, _.useEffect)(() => xi(() => s.current(), !0), []);
	let c = /* @__PURE__ */ (0, N.jsx)("div", {
		className: "vedit-modal-backdrop",
		onMouseDown: (e) => {
			e.target === e.currentTarget && s.current();
		},
		children: /* @__PURE__ */ (0, N.jsxs)("div", {
			className: a ? `vedit-modal ${a}` : "vedit-modal",
			"data-size": n,
			role: "dialog",
			"aria-modal": "true",
			"aria-label": e,
			children: [
				/* @__PURE__ */ (0, N.jsxs)("header", {
					className: "vedit-modal-header",
					children: [/* @__PURE__ */ (0, N.jsxs)("div", {
						className: "vedit-modal-heading",
						children: [/* @__PURE__ */ (0, N.jsx)("h2", {
							className: "vedit-modal-title",
							children: e
						}), t && /* @__PURE__ */ (0, N.jsx)("p", {
							className: "vedit-modal-subtitle",
							children: t
						})]
					}), /* @__PURE__ */ (0, N.jsx)("button", {
						type: "button",
						className: "vedit-icon-btn",
						onClick: () => s.current(),
						"aria-label": "Close",
						title: "Close (Esc)",
						children: /* @__PURE__ */ (0, N.jsx)(P, {
							name: "x",
							size: 17
						})
					})]
				}),
				/* @__PURE__ */ (0, N.jsx)("div", {
					className: "vedit-modal-body",
					children: o
				}),
				i && /* @__PURE__ */ (0, N.jsx)("footer", {
					className: "vedit-modal-footer",
					children: i
				})
			]
		})
	});
	return Ci ? (0, Te.createPortal)(c, Ci) : c;
}
function Ei({ value: e, onChange: t, placeholder: n, autoFocus: r, onEnter: i }) {
	return /* @__PURE__ */ (0, N.jsxs)("div", {
		className: "vedit-search",
		children: [/* @__PURE__ */ (0, N.jsx)(P, {
			name: "search",
			size: 15,
			className: "vedit-search-icon"
		}), /* @__PURE__ */ (0, N.jsx)("input", {
			type: "search",
			className: "vedit-input",
			placeholder: n,
			value: e,
			autoFocus: r,
			onChange: (e) => t(e.target.value),
			onKeyDown: (e) => {
				e.key === "Enter" && i && (e.preventDefault(), i());
			}
		})]
	});
}
function Di({ checked: e, onChange: t, id: n, label: r }) {
	return /* @__PURE__ */ (0, N.jsx)("button", {
		type: "button",
		role: "switch",
		id: n,
		"aria-checked": e,
		"aria-label": r,
		className: "vedit-switch",
		onClick: () => t(!e),
		children: /* @__PURE__ */ (0, N.jsx)("span", { className: "vedit-switch-thumb" })
	});
}
function Oi(e) {
	return e.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}
function ki(e) {
	return e.replace(/[-_]+/g, " ").replace(/^\w/, (e) => e.toUpperCase());
}
function Ai(e) {
	return e.title || e.label || ki(e.name);
}
function ji(e) {
	let t = e.width;
	return typeof t == "number" && t > 0 && t <= 100 ? Math.round(t) : 100;
}
function Mi(e, t = 14) {
	let n = `calc(${e}% - ${t * (100 - e) / 100}px)`;
	return {
		flex: `0 0 ${n}`,
		maxWidth: n
	};
}
var Ni = new Set([
	"text",
	"string",
	"textarea",
	"text-multiline",
	"richtext",
	"wysiwyg"
]), Pi = [
	"heading",
	"title",
	"headline",
	"name",
	"label",
	"question",
	"eyebrow",
	"text"
];
function Fi(e, t) {
	if (!t) return "";
	let n = (e) => {
		let t = Pi.findIndex((t) => e.toLowerCase().includes(t));
		return t === -1 ? Pi.length : t;
	}, r = e.filter((e) => Ni.has((e.type || "").toLowerCase())).sort((e, t) => n(e.name) - n(t.name));
	for (let e of r) {
		let n = t[e.name];
		if (typeof n != "string") continue;
		let r = Oi(n);
		if (r) return r.length > 140 ? `${r.slice(0, 140)}…` : r;
	}
	for (let n of e) {
		let e = t[n.name];
		if (e && typeof e == "object" && !Array.isArray(e)) {
			let t = e, n = t.text ?? t.label ?? t.title;
			if (typeof n == "string" && n.trim()) return n.trim();
		}
	}
	return "";
}
function Ii(e) {
	if (e.initialValue !== void 0) return e.initialValue;
	let t = (e.type || "").toLowerCase();
	return t === "boolean" || t === "toggle" ? !1 : t === "number" || t === "integer" || t === "range" ? null : t === "object" || t === "group" ? {} : t === "array" || t === "repeater" || t === "gallery" || t === "checkbox" ? [] : t === "reference" || t === "node" ? e.multiple ? [] : null : t === "image" || t === "file" || t === "media" || t === "link" || t === "term" ? null : "";
}
function Li(e) {
	let t = {};
	for (let n of e) t[n.name] = Ii(n);
	return t;
}
//#endregion
//#region src/fields/Composite.tsx
function Ri(e) {
	return typeof e == "object" && e && !Array.isArray(e) ? e : {};
}
function F({ field: e, value: t, onChange: n, ctx: r, path: i }) {
	let a = e.fields ?? [], o = Ri(t);
	return a.length === 0 ? /* @__PURE__ */ (0, N.jsx)("p", {
		className: "vedit-muted-note",
		children: "This group has no fields defined."
	}) : /* @__PURE__ */ (0, N.jsx)("div", {
		className: "vedit-subcard",
		children: /* @__PURE__ */ (0, N.jsx)(SC, {
			fields: a,
			values: o,
			onFieldChange: (e, t) => n({
				...o,
				[e]: t
			}),
			ctx: r,
			path: i
		})
	});
}
var zi = 0, Bi = () => `r${++zi}`;
function Vi({ field: e, value: t, onChange: n, ctx: r, path: i }) {
	let a = e.fields ?? [], o = Array.isArray(t) ? t.map(Ri) : [], s = (0, _.useRef)([]);
	s.current.length !== o.length && (s.current = o.map((e, t) => s.current[t] ?? Bi()));
	let c = s.current, [l, u] = (0, _.useState)(() => o.length === 1 && c[0] ? new Set([c[0]]) : /* @__PURE__ */ new Set());
	if (a.length === 0) return /* @__PURE__ */ (0, N.jsx)("p", {
		className: "vedit-muted-note",
		children: "This list has no item fields defined."
	});
	let d = (e) => u((t) => {
		let n = new Set(t);
		return n.has(e) ? n.delete(e) : n.add(e), n;
	}), f = () => {
		let e = Bi();
		s.current = [...c, e], u((t) => new Set(t).add(e)), n([...o, Li(a)]);
	}, p = (e) => {
		s.current = c.filter((t, n) => n !== e), n(o.filter((t, n) => n !== e));
	}, m = (e, t) => {
		let r = e + t;
		if (r < 0 || r >= o.length) return;
		let i = o.slice();
		[i[e], i[r]] = [i[r], i[e]];
		let a = c.slice();
		[a[e], a[r]] = [a[r], a[e]], s.current = a, n(i);
	}, h = (e, t, r) => {
		n(o.map((n, i) => i === e ? {
			...n,
			[t]: r
		} : n));
	}, g = c.every((e) => !l.has(e));
	return /* @__PURE__ */ (0, N.jsxs)("div", {
		className: "vedit-repeater",
		children: [
			o.length > 1 && /* @__PURE__ */ (0, N.jsx)("div", {
				className: "vedit-repeater-tools",
				children: /* @__PURE__ */ (0, N.jsxs)("button", {
					type: "button",
					className: "vedit-text-action",
					onClick: () => u(g ? new Set(c) : /* @__PURE__ */ new Set()),
					children: [/* @__PURE__ */ (0, N.jsx)(P, {
						name: g ? "expand-all" : "collapse-all",
						size: 14
					}), g ? "Expand all" : "Collapse all"]
				})
			}),
			o.map((e, t) => {
				let n = c[t], s = l.has(n), u = Fi(a, e);
				return /* @__PURE__ */ (0, N.jsxs)("div", {
					className: "vedit-row",
					"data-state": s ? "open" : "closed",
					children: [/* @__PURE__ */ (0, N.jsxs)("div", {
						className: "vedit-row-header",
						onClick: () => d(n),
						children: [/* @__PURE__ */ (0, N.jsxs)("button", {
							type: "button",
							className: "vedit-row-toggle",
							"aria-expanded": s,
							onClick: (e) => {
								e.stopPropagation(), d(n);
							},
							children: [/* @__PURE__ */ (0, N.jsx)("span", {
								className: "vedit-index",
								children: t + 1
							}), /* @__PURE__ */ (0, N.jsx)("span", {
								className: "vedit-row-summary",
								"data-empty": !u || void 0,
								children: u || "Empty item"
							})]
						}), /* @__PURE__ */ (0, N.jsxs)("span", {
							className: "vedit-row-actions",
							onClick: (e) => e.stopPropagation(),
							children: [
								/* @__PURE__ */ (0, N.jsx)("button", {
									type: "button",
									className: "vedit-icon-btn",
									"data-size": "sm",
									onClick: () => m(t, -1),
									disabled: t === 0,
									title: "Move up",
									"aria-label": `Move item ${t + 1} up`,
									children: /* @__PURE__ */ (0, N.jsx)(P, {
										name: "arrow-up",
										size: 14
									})
								}),
								/* @__PURE__ */ (0, N.jsx)("button", {
									type: "button",
									className: "vedit-icon-btn",
									"data-size": "sm",
									onClick: () => m(t, 1),
									disabled: t === o.length - 1,
									title: "Move down",
									"aria-label": `Move item ${t + 1} down`,
									children: /* @__PURE__ */ (0, N.jsx)(P, {
										name: "arrow-down",
										size: 14
									})
								}),
								/* @__PURE__ */ (0, N.jsx)("button", {
									type: "button",
									className: "vedit-icon-btn",
									"data-size": "sm",
									"data-tone": "danger",
									onClick: () => p(t),
									title: "Remove item",
									"aria-label": `Remove item ${t + 1}`,
									children: /* @__PURE__ */ (0, N.jsx)(P, {
										name: "trash",
										size: 14
									})
								}),
								/* @__PURE__ */ (0, N.jsx)("button", {
									type: "button",
									className: "vedit-icon-btn",
									"data-size": "sm",
									onClick: () => d(n),
									title: s ? "Collapse" : "Expand",
									"aria-label": s ? "Collapse item" : "Expand item",
									children: /* @__PURE__ */ (0, N.jsx)(P, {
										name: "chevron-down",
										size: 15,
										className: "vedit-chevron",
										style: { transform: s ? "none" : "rotate(-90deg)" }
									})
								})
							]
						})]
					}), s && /* @__PURE__ */ (0, N.jsx)("div", {
						className: "vedit-row-body",
						children: /* @__PURE__ */ (0, N.jsx)(SC, {
							fields: a,
							values: e,
							onFieldChange: (e, n) => h(t, e, n),
							ctx: r,
							path: `${i}-${t}`
						})
					})]
				}, n);
			}),
			/* @__PURE__ */ (0, N.jsxs)("button", {
				type: "button",
				className: "vedit-add-button",
				"data-size": "sm",
				onClick: f,
				children: [
					/* @__PURE__ */ (0, N.jsx)(P, {
						name: "plus",
						size: 15
					}),
					"Add ",
					o.length === 0 ? "item" : "another"
				]
			})
		]
	});
}
//#endregion
//#region src/fields/IconField.tsx
var Hi = "material", Ui = 96;
function Wi(e) {
	let t = e.trim();
	return t ? t.includes(":") ? t : `${Hi}:${t}` : "";
}
var Gi = /* @__PURE__ */ new Map(), Ki = null;
function qi() {
	return Ki || (Ki = oi().catch((e) => {
		throw Ki = null, e;
	})), Ki;
}
function Ji(e) {
	let t = e.map(Wi).filter(Boolean).sort().join(","), [, n] = (0, _.useState)(0);
	return (0, _.useEffect)(() => {
		let e = t ? t.split(",").filter((e) => !Gi.has(e)) : [];
		if (e.length === 0) return;
		let r = !1;
		return ci(e).then((t) => {
			let i = new Map(t.map((e) => [e.value, e]));
			for (let t of e) Gi.set(t, i.get(t) ?? null);
			r || n((e) => e + 1);
		}).catch(() => void 0), () => {
			r = !0;
		};
	}, [t]), Gi;
}
function Yi({ value: e, onChange: t, providers: n, label: r }) {
	let [i, a] = (0, _.useState)(!1), o = Wi(e), s = Ji(o ? [o] : []), c = o ? s.get(o) : null, l = o !== "" && s.has(o) && c === null;
	return /* @__PURE__ */ (0, N.jsxs)("div", {
		className: "vedit-icon-field",
		children: [
			/* @__PURE__ */ (0, N.jsx)("button", {
				type: "button",
				className: "vedit-icon-trigger",
				onClick: () => a(!0),
				title: "Choose an icon",
				"aria-label": e ? `Change ${r} (${e})` : `Choose ${r}`,
				children: c ? /* @__PURE__ */ (0, N.jsx)(_i, { svg: c.svg }) : /* @__PURE__ */ (0, N.jsx)(P, {
					name: "shapes",
					size: 18,
					strokeWidth: 1.7
				})
			}),
			/* @__PURE__ */ (0, N.jsxs)("span", {
				className: "vedit-icon-name",
				"data-unknown": l || void 0,
				children: [e ? l ? `${e} — not found` : c?.name ?? e : "No icon", c && /* @__PURE__ */ (0, N.jsx)("span", {
					className: "vedit-icon-provider",
					children: c.provider
				})]
			}),
			/* @__PURE__ */ (0, N.jsx)("button", {
				type: "button",
				className: "vedit-btn",
				"data-variant": "secondary",
				"data-size": "sm",
				onClick: () => a(!0),
				children: e ? "Change" : "Choose"
			}),
			e && /* @__PURE__ */ (0, N.jsx)("button", {
				type: "button",
				className: "vedit-icon-btn",
				"data-size": "sm",
				onClick: () => t(""),
				"aria-label": "Clear icon",
				title: "Clear",
				children: /* @__PURE__ */ (0, N.jsx)(P, {
					name: "x",
					size: 15
				})
			}),
			i && /* @__PURE__ */ (0, N.jsx)(Xi, {
				current: o,
				allowed: n,
				onPick: (e) => {
					t(e), a(!1);
				},
				onClose: () => a(!1)
			})
		]
	});
}
function Xi({ current: e, allowed: t, onPick: n, onClose: r }) {
	let [i, a] = (0, _.useState)(null), [o, s] = (0, _.useState)(() => e.includes(":") ? e.split(":")[0] : ""), [c, l] = (0, _.useState)(""), [u, d] = (0, _.useState)(1), [f, p] = (0, _.useState)([]), [m, h] = (0, _.useState)(0), [g, v] = (0, _.useState)(!1), [y, b] = (0, _.useState)(null);
	return (0, _.useEffect)(() => {
		qi().then((e) => {
			let n = t && t.length ? e.filter((e) => t.includes(e.id)) : e;
			a(n), s((e) => n.some((t) => t.id === e) ? e : n[0]?.id ?? "");
		}).catch((e) => b(e.message));
	}, []), (0, _.useEffect)(() => {
		if (!o) return;
		let e = !1;
		v(!0);
		let t = window.setTimeout(() => {
			si(o, c.trim(), u, Ui).then((t) => {
				if (!e) {
					for (let e of t.icons) Gi.set(e.value, e);
					p((e) => u === 1 ? t.icons : [...e, ...t.icons]), h(t.total), b(null), v(!1);
				}
			}).catch((t) => {
				e || (b(t.message), v(!1));
			});
		}, u === 1 ? 180 : 0);
		return () => {
			e = !0, window.clearTimeout(t);
		};
	}, [
		o,
		c,
		u
	]), /* @__PURE__ */ (0, N.jsxs)(Ti, {
		title: "Choose an icon",
		size: "md",
		onClose: r,
		className: "vedit-icon-modal",
		children: [
			i && i.length > 1 && /* @__PURE__ */ (0, N.jsx)("div", {
				className: "vedit-tabs",
				role: "tablist",
				children: i.map((e) => /* @__PURE__ */ (0, N.jsxs)("button", {
					type: "button",
					role: "tab",
					className: "vedit-tab",
					"aria-selected": e.id === o,
					"data-active": e.id === o,
					onClick: () => {
						s(e.id), d(1);
					},
					children: [e.label, /* @__PURE__ */ (0, N.jsx)("span", {
						className: "vedit-tab-count",
						children: e.count.toLocaleString()
					})]
				}, e.id))
			}),
			/* @__PURE__ */ (0, N.jsx)(Ei, {
				value: c,
				onChange: (e) => {
					l(e), d(1);
				},
				placeholder: "Search icons (e.g. map, food, phone)",
				autoFocus: !0,
				onEnter: () => f[0] && n(f[0].value)
			}),
			y && /* @__PURE__ */ (0, N.jsx)("div", {
				className: "vedit-alert",
				"data-tone": "danger",
				children: y
			}),
			/* @__PURE__ */ (0, N.jsxs)("div", {
				className: "vedit-icon-scroll",
				children: [f.length === 0 ? /* @__PURE__ */ (0, N.jsx)("p", {
					className: "vedit-empty",
					children: g ? "Loading…" : c ? `No icons match “${c}”.` : "No icons."
				}) : /* @__PURE__ */ (0, N.jsx)("div", {
					className: "vedit-icon-grid",
					children: f.map((t) => /* @__PURE__ */ (0, N.jsx)("button", {
						type: "button",
						className: "vedit-icon-cell",
						"data-selected": t.value === e || void 0,
						title: t.name,
						"aria-label": t.name,
						onClick: () => n(t.value),
						children: /* @__PURE__ */ (0, N.jsx)(_i, { svg: t.svg })
					}, t.value))
				}), f.length > 0 && f.length < m && /* @__PURE__ */ (0, N.jsx)("button", {
					type: "button",
					className: "vedit-add-button",
					"data-size": "sm",
					disabled: g,
					onClick: () => d((e) => e + 1),
					children: g ? "Loading…" : `Show more (${(m - f.length).toLocaleString()} left)`
				})]
			})
		]
	});
}
//#endregion
//#region src/fields/nodeTypes.tsx
function Zi(e) {
	return e ? `lucide:${e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([a-zA-Z])(\d)/g, "$1-$2").toLowerCase()}` : "";
}
var Qi = null;
function $i() {
	return Qi || (Qi = Qr().then((e) => {
		let t = /* @__PURE__ */ new Map();
		for (let n of e) {
			let e = n.label || ki(n.slug);
			t.set(n.slug, {
				label: e,
				plural: n.label_plural || `${e}s`,
				icon: Zi(n.icon)
			});
		}
		return t;
	}).catch(() => (Qi = null, /* @__PURE__ */ new Map()))), Qi;
}
function ea() {
	let [e, t] = (0, _.useState)(/* @__PURE__ */ new Map());
	return (0, _.useEffect)(() => {
		let e = !0;
		return $i().then((n) => e && t(n)), () => {
			e = !1;
		};
	}, []), Ji([...e.values()].map((e) => e.icon).filter(Boolean)), e;
}
function ta(e, t) {
	return e.get(t) ?? {
		label: ki(t),
		plural: `${ki(t)}s`,
		icon: ""
	};
}
function na({ types: e, slug: t, size: n = 16 }) {
	let r = ta(e, t).icon, i = Ji(r ? [r] : []).get(r);
	return i ? /* @__PURE__ */ (0, N.jsx)("span", {
		className: "vedit-type-icon",
		style: {
			width: n,
			height: n
		},
		children: /* @__PURE__ */ (0, N.jsx)(_i, { svg: i.svg })
	}) : /* @__PURE__ */ (0, N.jsx)(P, {
		name: "file",
		size: n
	});
}
//#endregion
//#region src/fields/linkKind.ts
function ra(e) {
	let t = e.trim();
	if (!t) return {
		kind: "empty",
		label: "No link yet",
		detail: ""
	};
	if (t.startsWith("#")) return {
		kind: "anchor",
		label: "Section",
		detail: t
	};
	if (/^mailto:/i.test(t)) return {
		kind: "email",
		label: "Email",
		detail: t.replace(/^mailto:/i, "").split("?")[0] ?? ""
	};
	if (/^tel:/i.test(t)) return {
		kind: "phone",
		label: "Phone",
		detail: t.replace(/^tel:/i, "")
	};
	if (t.startsWith("/")) return {
		kind: "page",
		label: "Page",
		detail: t
	};
	try {
		let e = new URL(/^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`);
		if (typeof window < "u" && e.host === window.location.host) return {
			kind: "page",
			label: "Page",
			detail: e.pathname + e.search + e.hash
		};
		let n = e.host.replace(/^www\./, ""), r = n + (e.pathname === "/" ? "" : e.pathname);
		return /^(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com|whatsapp\.com)$/i.test(n) ? {
			kind: "chat",
			label: "WhatsApp",
			detail: r
		} : /^(m\.me|messenger\.com|t\.me|zalo\.me)$/i.test(n) ? {
			kind: "chat",
			label: "Chat",
			detail: r
		} : /^maps\.app\.goo\.gl$/i.test(n) || /^goo\.gl$/i.test(n) && e.pathname.startsWith("/maps") || /(^|\.)google\.[a-z.]+$/i.test(n) && e.pathname.startsWith("/maps") ? {
			kind: "map",
			label: "Map",
			detail: r
		} : {
			kind: "external",
			label: "Website",
			detail: r
		};
	} catch {
		return {
			kind: "external",
			label: "Website",
			detail: t
		};
	}
}
function ia(e) {
	let t = e.trim();
	return t ? /^(https?:\/\/|\/|#|mailto:|tel:)/i.test(t) ? t : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? `mailto:${t}` : /^\+?[\d][\d\s().-]{5,}$/.test(t) ? `tel:${t.replace(/[\s().-]/g, "")}` : /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(:\d+)?(\/\S*)?$/i.test(t) ? `https://${t}` : null : null;
}
//#endregion
//#region src/fields/RefPicker.tsx
function aa(e) {
	return (Array.isArray(e) ? e : e == null || e === "" ? [] : [e]).map((e) => typeof e == "number" ? { id: e } : typeof e == "object" && e ? e : null).filter((e) => e !== null && e.id !== void 0);
}
function oa({ src: e, label: t, size: n }) {
	let [r, i] = (0, _.useState)(!1);
	return /* @__PURE__ */ (0, N.jsx)("span", {
		className: "vedit-ref-thumb",
		"data-size": n,
		"aria-hidden": "true",
		children: e && !r ? /* @__PURE__ */ (0, N.jsx)("img", {
			src: e,
			alt: "",
			loading: "lazy",
			onError: () => i(!0)
		}) : /* @__PURE__ */ (0, N.jsx)("span", { children: t.charAt(0).toUpperCase() || "?" })
	});
}
function sa({ status: e }) {
	return !e || e === "published" ? null : /* @__PURE__ */ (0, N.jsx)("span", {
		className: "vedit-status-pill",
		children: e
	});
}
function ca({ field: e, value: t, onChange: n }) {
	let [r, i] = (0, _.useState)(!1), a = e, o = !!a.multiple, s = a.node_type_filter, c = a.node_types ?? (Array.isArray(s) ? s : s ? [s] : []), l = aa(t), [u, d] = (0, _.useState)({}), [f, p] = (0, _.useState)(!1);
	(0, _.useEffect)(() => {
		if (l.length === 0) return;
		let e = !1, t = c.length ? c : [void 0];
		return Promise.all(t.map((e) => ii({
			nodeType: e,
			limit: 100
		}))).then((t) => {
			if (e) return;
			let n = {};
			for (let e of t.flat()) n[e.id] = e;
			d(n), p(t.every((e) => e.length < 100));
		}).catch(() => void 0), () => {
			e = !0;
		};
	}, [c.join(","), l.length > 0]);
	let m = (e) => {
		n(o ? e : e[0] ?? null);
	}, h = (e, t) => {
		let n = l.slice(), r = e + t;
		r < 0 || r >= n.length || ([n[e], n[r]] = [n[r], n[e]], m(n));
	}, g = c.length === 1 ? ki(c[0]).toLowerCase() : "content";
	return /* @__PURE__ */ (0, N.jsxs)("div", {
		className: "vedit-ref",
		children: [
			l.length > 0 && /* @__PURE__ */ (0, N.jsx)("ul", {
				className: "vedit-ref-list",
				children: l.map((e, t) => {
					let n = u[e.id], r = n?.title || e.title || e.slug || `#${e.id}`, i = f && !n;
					return /* @__PURE__ */ (0, N.jsxs)("li", {
						className: "vedit-ref-row",
						"data-missing": i || void 0,
						children: [
							/* @__PURE__ */ (0, N.jsx)(oa, {
								src: ri(n?.featured_image),
								label: r
							}),
							/* @__PURE__ */ (0, N.jsxs)("span", {
								className: "vedit-ref-text",
								children: [/* @__PURE__ */ (0, N.jsx)("span", {
									className: "vedit-ref-title",
									children: r
								}), /* @__PURE__ */ (0, N.jsxs)("span", {
									className: "vedit-ref-meta",
									children: [i ? "Not found — it may have been deleted" : ki(n?.node_type || e.node_type || "content"), !i && /* @__PURE__ */ (0, N.jsx)(sa, { status: n?.status })]
								})]
							}),
							/* @__PURE__ */ (0, N.jsxs)("span", {
								className: "vedit-ref-actions",
								children: [o && l.length > 1 && /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)("button", {
									type: "button",
									className: "vedit-icon-btn",
									"data-size": "sm",
									onClick: () => h(t, -1),
									disabled: t === 0,
									"aria-label": `Move ${r} up`,
									title: "Move up",
									children: /* @__PURE__ */ (0, N.jsx)(P, {
										name: "arrow-up",
										size: 14
									})
								}), /* @__PURE__ */ (0, N.jsx)("button", {
									type: "button",
									className: "vedit-icon-btn",
									"data-size": "sm",
									onClick: () => h(t, 1),
									disabled: t === l.length - 1,
									"aria-label": `Move ${r} down`,
									title: "Move down",
									children: /* @__PURE__ */ (0, N.jsx)(P, {
										name: "arrow-down",
										size: 14
									})
								})] }), /* @__PURE__ */ (0, N.jsx)("button", {
									type: "button",
									className: "vedit-icon-btn",
									"data-size": "sm",
									"data-tone": "danger",
									onClick: () => m(l.filter((e, n) => n !== t)),
									"aria-label": `Remove ${r}`,
									title: "Remove",
									children: /* @__PURE__ */ (0, N.jsx)(P, {
										name: "x",
										size: 15
									})
								})]
							})
						]
					}, e.id);
				})
			}),
			/* @__PURE__ */ (0, N.jsxs)("div", {
				className: "vedit-ref-footer",
				children: [/* @__PURE__ */ (0, N.jsxs)("button", {
					type: "button",
					className: "vedit-add-button",
					"data-size": "sm",
					"data-fit": !0,
					onClick: () => i(!0),
					children: [/* @__PURE__ */ (0, N.jsx)(P, {
						name: l.length ? "link" : "plus",
						size: 15
					}), o ? l.length ? "Add or remove" : `Choose ${g}` : l.length ? "Change" : `Choose ${g}`]
				}), o && l.length > 1 && /* @__PURE__ */ (0, N.jsx)("button", {
					type: "button",
					className: "vedit-text-action",
					onClick: () => m([]),
					children: "Clear all"
				})]
			}),
			r && /* @__PURE__ */ (0, N.jsx)(la, {
				allowedNodeTypes: c,
				multiple: o,
				initial: l,
				typeLabel: g,
				onDone: (e) => {
					m(e), i(!1);
				},
				onCancel: () => i(!1)
			})
		]
	});
}
function la({ allowedNodeTypes: e, multiple: t, initial: n, typeLabel: r, onDone: i, onCancel: a }) {
	let [o, s] = (0, _.useState)(""), [c, l] = (0, _.useState)(null), [u, d] = (0, _.useState)(null), [f, p] = (0, _.useState)(e[0] ?? ""), [m, h] = (0, _.useState)(n);
	(0, _.useEffect)(() => {
		let e = window.setTimeout(() => {
			ii({
				search: o,
				nodeType: f || void 0,
				limit: 50
			}).then((e) => {
				l(e), d(null);
			}).catch((e) => d(e.message));
		}, 200);
		return () => window.clearTimeout(e);
	}, [o, f]);
	let g = (e) => {
		let n = {
			id: e.id,
			title: e.title,
			slug: e.slug,
			node_type: e.node_type
		};
		if (!t) {
			i([n]);
			return;
		}
		h((t) => t.some((t) => t.id === e.id) ? t.filter((t) => t.id !== e.id) : [...t, n]);
	};
	return /* @__PURE__ */ (0, N.jsxs)(Ti, {
		title: `Choose ${r}`,
		subtitle: t ? "Pick as many as you need. The order you pick them in is the order they show." : void 0,
		size: "md",
		className: "vedit-ref-modal",
		onClose: a,
		footer: t ? /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [
			/* @__PURE__ */ (0, N.jsx)("span", {
				className: "vedit-modal-count",
				children: m.length ? `${m.length} selected` : "None selected"
			}),
			/* @__PURE__ */ (0, N.jsx)("button", {
				type: "button",
				className: "vedit-btn",
				"data-variant": "secondary",
				onClick: a,
				children: "Cancel"
			}),
			/* @__PURE__ */ (0, N.jsx)("button", {
				type: "button",
				className: "vedit-btn",
				"data-variant": "primary",
				onClick: () => i(m),
				children: "Done"
			})
		] }) : void 0,
		children: [
			e.length > 1 && /* @__PURE__ */ (0, N.jsx)("div", {
				className: "vedit-tabs",
				role: "tablist",
				children: e.map((e) => /* @__PURE__ */ (0, N.jsx)("button", {
					type: "button",
					role: "tab",
					className: "vedit-tab",
					"aria-selected": e === f,
					"data-active": e === f,
					onClick: () => p(e),
					children: ki(e)
				}, e))
			}),
			/* @__PURE__ */ (0, N.jsx)(Ei, {
				value: o,
				onChange: s,
				placeholder: `Search ${r} by title…`,
				autoFocus: !0
			}),
			u && /* @__PURE__ */ (0, N.jsx)("div", {
				className: "vedit-alert",
				"data-tone": "danger",
				children: u
			}),
			/* @__PURE__ */ (0, N.jsxs)("ul", {
				className: "vedit-ref-results",
				children: [
					c === null && /* @__PURE__ */ (0, N.jsx)("li", {
						className: "vedit-empty",
						children: "Loading…"
					}),
					c?.length === 0 && /* @__PURE__ */ (0, N.jsx)("li", {
						className: "vedit-empty",
						children: o ? `Nothing matches “${o}”.` : "Nothing here yet."
					}),
					c?.map((e) => {
						let n = m.findIndex((t) => t.id === e.id) >= 0;
						return /* @__PURE__ */ (0, N.jsx)("li", { children: /* @__PURE__ */ (0, N.jsxs)("button", {
							type: "button",
							className: "vedit-ref-result",
							"data-selected": n || void 0,
							"aria-pressed": t ? n : void 0,
							onClick: () => g(e),
							children: [
								/* @__PURE__ */ (0, N.jsx)(oa, {
									src: ri(e.featured_image),
									label: e.title,
									size: "lg"
								}),
								/* @__PURE__ */ (0, N.jsxs)("span", {
									className: "vedit-ref-text",
									children: [/* @__PURE__ */ (0, N.jsx)("span", {
										className: "vedit-ref-title",
										children: e.title
									}), /* @__PURE__ */ (0, N.jsxs)("span", {
										className: "vedit-ref-meta",
										children: [/* @__PURE__ */ (0, N.jsx)("span", {
											className: "vedit-ref-url",
											children: e.full_url || `/${e.slug}`
										}), /* @__PURE__ */ (0, N.jsx)(sa, { status: e.status })]
									})]
								}),
								t && /* @__PURE__ */ (0, N.jsx)("span", {
									className: "vedit-ref-check",
									"aria-hidden": "true",
									children: n ? /* @__PURE__ */ (0, N.jsx)(P, {
										name: "check",
										size: 13,
										strokeWidth: 3
									}) : null
								})
							]
						}) }, e.id);
					})
				]
			})
		]
	});
}
function ua({ field: e, value: t, onChange: n, defaultNodeType: r }) {
	let i = e, a = i.taxonomy ?? "", o = i.term_node_type ?? i.node_type ?? r, [s, c] = (0, _.useState)(!1), [l, u] = (0, _.useState)(null), [d, f] = (0, _.useState)(""), [p, m] = (0, _.useState)(null), h = typeof t == "object" && t ? t : null, g = h ? h.name ?? h.slug ?? `#${h.id}` : null;
	if ((0, _.useEffect)(() => {
		!s || !a || !o || ai(o, a, { perPage: 200 }).then(u).catch((e) => m(e.message));
	}, [
		s,
		a,
		o
	]), !a) return /* @__PURE__ */ (0, N.jsx)("p", {
		className: "vedit-muted-note",
		children: "This field has no taxonomy configured."
	});
	let v = d.trim().toLowerCase(), y = (l ?? []).filter((e) => !v || e.name.toLowerCase().includes(v) || e.slug.includes(v));
	return /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [g ? /* @__PURE__ */ (0, N.jsxs)("div", {
		className: "vedit-chip-row",
		children: [
			/* @__PURE__ */ (0, N.jsxs)("span", {
				className: "vedit-chip",
				children: [/* @__PURE__ */ (0, N.jsx)(P, {
					name: "tag",
					size: 13
				}), g]
			}),
			/* @__PURE__ */ (0, N.jsx)("button", {
				type: "button",
				className: "vedit-btn",
				"data-variant": "secondary",
				"data-size": "sm",
				onClick: () => c(!0),
				children: "Change"
			}),
			/* @__PURE__ */ (0, N.jsx)("button", {
				type: "button",
				className: "vedit-icon-btn",
				"data-size": "sm",
				"data-tone": "danger",
				onClick: () => n(null),
				title: "Clear",
				"aria-label": "Clear term",
				children: /* @__PURE__ */ (0, N.jsx)(P, {
					name: "x",
					size: 15
				})
			})
		]
	}) : /* @__PURE__ */ (0, N.jsxs)("button", {
		type: "button",
		className: "vedit-media-empty",
		onClick: () => c(!0),
		children: [
			/* @__PURE__ */ (0, N.jsx)(P, {
				name: "tag",
				size: 17,
				strokeWidth: 1.7
			}),
			"Choose ",
			ki(a).toLowerCase()
		]
	}), s && /* @__PURE__ */ (0, N.jsxs)(Ti, {
		title: `Choose ${ki(a).toLowerCase()}`,
		size: "sm",
		onClose: () => c(!1),
		children: [
			/* @__PURE__ */ (0, N.jsx)(Ei, {
				value: d,
				onChange: f,
				placeholder: "Filter…",
				autoFocus: !0
			}),
			p && /* @__PURE__ */ (0, N.jsx)("div", {
				className: "vedit-alert",
				"data-tone": "danger",
				children: p
			}),
			/* @__PURE__ */ (0, N.jsxs)("ul", {
				className: "vedit-option-list",
				children: [
					l === null && !p && /* @__PURE__ */ (0, N.jsx)("li", {
						className: "vedit-empty",
						children: "Loading…"
					}),
					l !== null && y.length === 0 && /* @__PURE__ */ (0, N.jsx)("li", {
						className: "vedit-empty",
						children: "No terms."
					}),
					y.map((e) => /* @__PURE__ */ (0, N.jsx)("li", { children: /* @__PURE__ */ (0, N.jsxs)("button", {
						type: "button",
						className: "vedit-option",
						"data-selected": h?.id === e.id || void 0,
						onClick: () => {
							n({
								id: e.id,
								slug: e.slug,
								name: e.name,
								taxonomy: a,
								node_type: o
							}), c(!1);
						},
						children: [/* @__PURE__ */ (0, N.jsx)("span", {
							className: "vedit-option-label",
							children: e.name
						}), /* @__PURE__ */ (0, N.jsx)("span", {
							className: "vedit-option-meta",
							children: e.slug
						})]
					}) }, e.id))
				]
			})
		]
	})] });
}
//#endregion
//#region src/fields/LinkField.tsx
function da(e) {
	return e && typeof e == "object" && !Array.isArray(e) ? e : {};
}
function fa(e) {
	let t = da(e), n = (e) => typeof t[e] == "string" ? t[e] : "";
	return {
		text: n("text") || n("label"),
		url: n("url"),
		alt: n("alt"),
		target: n("target")
	};
}
var pa = {
	empty: "link",
	page: "file",
	anchor: "hash",
	email: "mail",
	phone: "phone",
	chat: "message",
	map: "map-pin",
	external: "globe"
}, ma = /* @__PURE__ */ new Map();
function ha(e) {
	let t = e.split(/[?#]/)[0] ?? "";
	return t.length > 1 ? t.replace(/\/+$/, "") : t;
}
function ga(e) {
	let t = ha(e), n = ma.get(t);
	return n || (n = ii({
		search: (t.split("/").filter(Boolean).pop() ?? "") || void 0,
		limit: 50
	}).then((e) => e.find((e) => e.full_url && ha(e.full_url) === t) ?? null).catch(() => null), ma.set(t, n)), n;
}
function _a(e, t) {
	let [n, r] = (0, _.useState)(null), i = t === "page" ? ra(e).detail : "";
	return (0, _.useEffect)(() => {
		if (!i) {
			r(null);
			return;
		}
		let e = !0;
		return ga(i).then((t) => e && r(t)), () => {
			e = !1;
		};
	}, [i]), n;
}
function va({ value: e, onChange: t, id: n, label: r }) {
	let i = fa(e), [a, o] = (0, _.useState)(!1), s = ra(i.url), c = _a(i.url, s.kind), l = i.url !== "" || i.text !== "", u = (n) => {
		let r = da(e);
		t({
			...r,
			...n,
			...r.label === void 0 ? {} : { label: n.text }
		});
	};
	if (!l) return /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsxs)("button", {
		type: "button",
		id: n,
		className: "vedit-add-button vedit-link-add",
		"data-size": "sm",
		onClick: () => o(!0),
		children: [/* @__PURE__ */ (0, N.jsx)(P, {
			name: "link",
			size: 15
		}), "Add link"]
	}), a && /* @__PURE__ */ (0, N.jsx)(xa, {
		initial: i,
		title: r,
		onSave: (e) => (u(e), o(!1)),
		onCancel: () => o(!1)
	})] });
	let d = i.text || c?.title || s.detail || "Untitled link";
	return /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsxs)("div", {
		className: "vedit-link-card",
		"data-kind": s.kind,
		children: [/* @__PURE__ */ (0, N.jsxs)("button", {
			type: "button",
			id: n,
			className: "vedit-link-main",
			onClick: () => o(!0),
			title: "Edit link",
			children: [/* @__PURE__ */ (0, N.jsx)("span", {
				className: "vedit-link-icon",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, N.jsx)(P, {
					name: pa[s.kind],
					size: 16
				})
			}), /* @__PURE__ */ (0, N.jsxs)("span", {
				className: "vedit-link-text",
				children: [/* @__PURE__ */ (0, N.jsx)("span", {
					className: "vedit-link-title",
					"data-placeholder": !i.text || void 0,
					children: d
				}), /* @__PURE__ */ (0, N.jsxs)("span", {
					className: "vedit-link-meta",
					children: [s.kind === "empty" ? /* @__PURE__ */ (0, N.jsxs)("span", {
						className: "vedit-link-warn",
						children: [/* @__PURE__ */ (0, N.jsx)(P, {
							name: "alert",
							size: 13
						}), " No URL — the button won't go anywhere"]
					}) : /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)("span", {
						className: "vedit-link-kind",
						children: c ? ki(c.node_type) : s.label
					}), /* @__PURE__ */ (0, N.jsx)("span", {
						className: "vedit-link-url",
						children: c && i.text ? c.title : s.detail
					})] }), i.target === "_blank" && /* @__PURE__ */ (0, N.jsxs)("span", {
						className: "vedit-link-badge",
						children: [/* @__PURE__ */ (0, N.jsx)(P, {
							name: "external",
							size: 11,
							strokeWidth: 2.2
						}), " New tab"]
					})]
				})]
			})]
		}), /* @__PURE__ */ (0, N.jsxs)("span", {
			className: "vedit-link-actions",
			children: [
				/* @__PURE__ */ (0, N.jsx)("button", {
					type: "button",
					className: "vedit-icon-btn",
					onClick: () => o(!0),
					title: "Edit link",
					"aria-label": "Edit link",
					children: /* @__PURE__ */ (0, N.jsx)(P, {
						name: "pencil",
						size: 15
					})
				}),
				s.kind !== "empty" && /* @__PURE__ */ (0, N.jsx)("a", {
					className: "vedit-icon-btn",
					href: i.url,
					target: "_blank",
					rel: "noreferrer noopener",
					title: "Open link in a new tab",
					"aria-label": "Open link in a new tab",
					children: /* @__PURE__ */ (0, N.jsx)(P, {
						name: "external",
						size: 15
					})
				}),
				/* @__PURE__ */ (0, N.jsx)("button", {
					type: "button",
					className: "vedit-icon-btn",
					"data-tone": "danger",
					onClick: () => u({
						text: "",
						url: "",
						alt: "",
						target: ""
					}),
					title: "Remove link",
					"aria-label": "Remove link",
					children: /* @__PURE__ */ (0, N.jsx)(P, {
						name: "x",
						size: 15
					})
				})
			]
		})]
	}), a && /* @__PURE__ */ (0, N.jsx)(xa, {
		initial: i,
		title: r,
		onSave: (e) => (u(e), o(!1)),
		onRemove: () => (u({
			text: "",
			url: "",
			alt: "",
			target: ""
		}), o(!1)),
		onCancel: () => o(!1)
	})] });
}
function ya() {
	let e = [], t = /* @__PURE__ */ new Set();
	return document.querySelectorAll("body [id]").forEach((n) => {
		if (e.length >= 40 || n.closest("[data-vedit-host]") || t.has(n.id) || !/^(SECTION|ARTICLE|HEADER|FOOTER|DIV|H[1-6]|ASIDE|FORM|UL|OL)$/.test(n.tagName) || /^(__|squilla|vedit)/i.test(n.id) || /^(root|app|main|main-content|content|page|wrapper)$/i.test(n.id) || n.querySelector("section[id], article[id]") || n.getBoundingClientRect().height < 24) return;
		let r = ((/^H[1-6]$/.test(n.tagName) ? n : n.querySelector("h1, h2, h3, h4"))?.textContent ?? "").replace(/\s+/g, " ").trim();
		t.add(n.id), e.push({
			url: `#${n.id}`,
			title: r ? r.slice(0, 80) : `#${n.id}`
		});
	}), e;
}
function ba(e, t, n) {
	let r = e.toLowerCase();
	return n ? r === n ? 0 : r.startsWith(n) ? 1 : r.split(/[\s\-–—:,&/]+/).some((e) => e.startsWith(n)) || t.startsWith(n) ? 2 : 3 : 3;
}
function xa({ initial: e, title: t, onSave: n, onRemove: r, onCancel: i }) {
	let a = ea(), [o, s] = (0, _.useState)(e.url ? {
		url: e.url,
		title: ""
	} : null), [c, l] = (0, _.useState)(""), [u, d] = (0, _.useState)(e.text), [f, p] = (0, _.useState)(e.alt), [m, h] = (0, _.useState)(e.target === "_blank"), [g, v] = (0, _.useState)(e.alt !== ""), [y, b] = (0, _.useState)(null), [x, S] = (0, _.useState)(0), [C, w] = (0, _.useState)(null), ee = (0, _.useRef)(null), te = (0, _.useRef)(null), ne = (0, _.useMemo)(ya, []), T = c.trim(), re = T.startsWith("#"), ie = re ? null : ia(T), ae = !o && ie === null && !re;
	(0, _.useEffect)(() => {
		if (!ae) return;
		let e = !0, t = window.setTimeout(() => {
			ii(T ? {
				search: T,
				limit: 40
			} : {
				nodeType: "page",
				limit: 6
			}).then((t) => e && b({
				q: T,
				list: t
			})).catch(() => e && b({
				q: T,
				list: []
			}));
		}, T ? 160 : 0);
		return () => {
			e = !1, window.clearTimeout(t);
		};
	}, [T, ae]);
	let oe = (0, _.useMemo)(() => {
		if (o) return [];
		if (ie) {
			let e = ra(ie);
			return [{
				key: "url",
				label: "",
				items: [{
					key: `url:${ie}`,
					url: ie,
					title: `Link to ${e.detail}`,
					detail: e.label,
					kind: e.kind
				}]
			}];
		}
		let e = [], t = T.replace(/^#/, "").toLowerCase(), n = ne.filter((e) => !t || e.url.toLowerCase().includes(t) || e.title.toLowerCase().includes(t)).slice(0, T ? 12 : 5).map((e) => ({
			key: e.url,
			url: e.url,
			title: e.title,
			detail: e.url,
			kind: "anchor"
		}));
		if (re && T.length > 1 && !ne.some((e) => e.url === T) && n.push({
			key: `url:${T}`,
			url: T,
			title: `Link to ${T}`,
			detail: "Section",
			kind: "anchor"
		}), n.length && e.push({
			key: "sections",
			label: "On this page",
			items: n
		}), re || !y) return e;
		let r = y.q.toLowerCase(), i = /* @__PURE__ */ new Map();
		for (let e of y.list) e.full_url && i.set(e.node_type, [...i.get(e.node_type) ?? [], e]);
		let s = [...i.entries()].map(([e, t]) => (t.sort((e, t) => ba(e.title, e.slug, r) - ba(t.title, t.slug, r) || e.title.localeCompare(t.title)), {
			slug: e,
			list: t,
			best: ba(t[0].title, t[0].slug, r)
		}));
		s.sort((e, t) => e.slug === "page" ? -1 : t.slug === "page" ? 1 : e.best - t.best || e.slug.localeCompare(t.slug));
		for (let t of s) e.push({
			key: t.slug,
			label: r ? ta(a, t.slug).plural : "Pages",
			items: t.list.map((e) => ({
				key: `n:${e.id}`,
				url: e.full_url,
				title: e.title,
				detail: e.full_url,
				kind: "page",
				nodeType: e.node_type,
				thumb: ri(e.featured_image),
				status: e.status && e.status !== "published" ? e.status : void 0
			}))
		});
		return e;
	}, [
		o,
		ie,
		re,
		T,
		ne,
		y,
		a
	]), se = (0, _.useMemo)(() => oe.flatMap((e) => e.items), [oe]), ce = Math.min(x, Math.max(se.length - 1, 0));
	(0, _.useEffect)(() => {
		te.current?.querySelector("[data-active]")?.scrollIntoView({ block: "nearest" });
	}, [ce]);
	let le = (e) => {
		s({
			url: e.url,
			title: e.kind === "page" || e.kind === "anchor" && !e.key.startsWith("url:") ? e.title : "",
			nodeType: e.nodeType,
			thumb: e.thumb
		}), l(""), w(null), !u.trim() && (e.kind === "page" || e.kind === "anchor" && !e.key.startsWith("url:")) && d(e.title);
	}, E = () => {
		let e = o ? ra(o.url) : null;
		l(e && e.kind !== "page" && e.kind !== "anchor" ? o.url : ""), s(null), S(0), requestAnimationFrame(() => ee.current?.focus());
	}, D = () => {
		let e = o ? o.url : T === "" ? "" : re ? T : ie;
		if (e === null) {
			w("Pick a page from the list, or type a full address like https://example.com."), ee.current?.focus();
			return;
		}
		n({
			text: u.trim(),
			url: e,
			alt: f.trim(),
			target: m ? "_blank" : ""
		});
	}, ue = (e) => {
		if (e.key === "ArrowDown") e.preventDefault(), S(Math.min(ce + 1, se.length - 1));
		else if (e.key === "ArrowUp") e.preventDefault(), S(Math.max(ce - 1, 0));
		else if (e.key === "Enter") {
			e.preventDefault();
			let t = se[ce];
			t ? le(t) : D();
		}
	}, de = !e.url && !e.text, fe = ae && y?.q !== T;
	return /* @__PURE__ */ (0, N.jsx)(Ti, {
		title: de ? "Add link" : "Edit link",
		subtitle: t,
		size: "md",
		className: "vedit-link-modal",
		onClose: i,
		footer: /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [
			r && /* @__PURE__ */ (0, N.jsx)("button", {
				type: "button",
				className: "vedit-btn",
				"data-variant": "ghost-danger",
				onClick: r,
				style: { marginRight: "auto" },
				children: "Remove link"
			}),
			/* @__PURE__ */ (0, N.jsx)("button", {
				type: "button",
				className: "vedit-btn",
				"data-variant": "secondary",
				onClick: i,
				children: "Cancel"
			}),
			/* @__PURE__ */ (0, N.jsx)("button", {
				type: "button",
				className: "vedit-btn",
				"data-variant": "primary",
				onClick: D,
				children: de ? "Add link" : "Save link"
			})
		] }),
		children: /* @__PURE__ */ (0, N.jsxs)("div", {
			className: "vedit-link-form",
			children: [
				/* @__PURE__ */ (0, N.jsxs)("div", {
					className: "vedit-field",
					children: [
						/* @__PURE__ */ (0, N.jsx)("label", {
							className: "vedit-field-label",
							htmlFor: "vedit-link-url",
							children: "Link to"
						}),
						o ? /* @__PURE__ */ (0, N.jsx)(Sa, {
							target: o,
							types: a,
							onChange: E
						}) : /* @__PURE__ */ (0, N.jsxs)("div", {
							className: "vedit-combo",
							"data-error": C ? "" : void 0,
							children: [
								/* @__PURE__ */ (0, N.jsxs)("div", {
									className: "vedit-combo-search",
									children: [
										/* @__PURE__ */ (0, N.jsx)(P, {
											name: "search",
											size: 16
										}),
										/* @__PURE__ */ (0, N.jsx)("input", {
											ref: ee,
											id: "vedit-link-url",
											autoFocus: !0,
											autoComplete: "off",
											spellCheck: !1,
											placeholder: "Search pages, or paste a URL, email or phone",
											value: c,
											onChange: (e) => {
												l(e.target.value), w(null), S(0);
											},
											onKeyDown: ue,
											role: "combobox",
											"aria-expanded": !0,
											"aria-controls": "vedit-link-results"
										}),
										fe && T ? /* @__PURE__ */ (0, N.jsx)(P, {
											name: "loader",
											size: 15,
											className: "vedit-spin"
										}) : null,
										c && /* @__PURE__ */ (0, N.jsx)("button", {
											type: "button",
											className: "vedit-icon-btn",
											"data-size": "sm",
											onClick: () => (l(""), ee.current?.focus()),
											"aria-label": "Clear",
											title: "Clear",
											children: /* @__PURE__ */ (0, N.jsx)(P, {
												name: "x",
												size: 14
											})
										})
									]
								}),
								/* @__PURE__ */ (0, N.jsx)("div", {
									className: "vedit-combo-results",
									id: "vedit-link-results",
									role: "listbox",
									ref: te,
									children: se.length === 0 ? /* @__PURE__ */ (0, N.jsx)("div", {
										className: "vedit-combo-empty",
										children: fe ? "Searching…" : T ? /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [
											"Nothing on the site matches “",
											T,
											"”. Paste a full address to link somewhere else."
										] }) : "No pages yet."
									}) : oe.map((e) => /* @__PURE__ */ (0, N.jsxs)("div", {
										role: "group",
										"aria-label": e.label || void 0,
										children: [e.label && /* @__PURE__ */ (0, N.jsx)("div", {
											className: "vedit-combo-group",
											children: e.label
										}), e.items.map((e) => {
											let t = se.indexOf(e);
											return /* @__PURE__ */ (0, N.jsxs)("button", {
												type: "button",
												role: "option",
												"aria-selected": t === ce,
												className: "vedit-link-result",
												"data-active": t === ce || void 0,
												onMouseMove: () => S(t),
												onClick: () => le(e),
												children: [
													e.nodeType ? /* @__PURE__ */ (0, N.jsx)(na, {
														types: a,
														slug: e.nodeType
													}) : /* @__PURE__ */ (0, N.jsx)(P, {
														name: pa[e.kind],
														size: 16
													}),
													/* @__PURE__ */ (0, N.jsx)("span", {
														className: "vedit-link-result-title",
														children: e.title
													}),
													e.status && /* @__PURE__ */ (0, N.jsx)("span", {
														className: "vedit-link-result-status",
														children: e.status
													}),
													/* @__PURE__ */ (0, N.jsx)("span", {
														className: "vedit-link-result-path",
														children: /* @__PURE__ */ (0, N.jsx)("bdi", { children: e.detail })
													}),
													/* @__PURE__ */ (0, N.jsx)(P, {
														name: "corner-down-left",
														size: 14,
														className: "vedit-link-result-enter"
													})
												]
											}, e.key);
										})]
									}, e.key))
								}),
								/* @__PURE__ */ (0, N.jsxs)("div", {
									className: "vedit-combo-foot",
									children: [
										/* @__PURE__ */ (0, N.jsxs)("span", { children: [
											/* @__PURE__ */ (0, N.jsx)("kbd", { children: "↑" }),
											/* @__PURE__ */ (0, N.jsx)("kbd", { children: "↓" }),
											" to move"
										] }),
										/* @__PURE__ */ (0, N.jsxs)("span", { children: [/* @__PURE__ */ (0, N.jsx)("kbd", { children: "↵" }), " to pick"] }),
										/* @__PURE__ */ (0, N.jsx)("span", {
											className: "vedit-combo-hint",
											children: "Works with URLs, emails and #sections too"
										})
									]
								})
							]
						}),
						C && /* @__PURE__ */ (0, N.jsx)("p", {
							className: "vedit-field-error",
							children: C
						})
					]
				}),
				/* @__PURE__ */ (0, N.jsxs)("div", {
					className: "vedit-field",
					children: [/* @__PURE__ */ (0, N.jsx)("label", {
						className: "vedit-field-label",
						htmlFor: "vedit-link-text",
						children: "Text"
					}), /* @__PURE__ */ (0, N.jsx)("input", {
						id: "vedit-link-text",
						className: "vedit-input",
						placeholder: o?.title || "What the button or link says",
						value: u,
						onChange: (e) => d(e.target.value),
						onKeyDown: (e) => {
							e.key === "Enter" && (e.preventDefault(), D());
						}
					})]
				}),
				/* @__PURE__ */ (0, N.jsxs)("div", {
					className: "vedit-link-options",
					children: [/* @__PURE__ */ (0, N.jsxs)("label", {
						className: "vedit-switch-row",
						children: [/* @__PURE__ */ (0, N.jsx)(Di, {
							checked: m,
							onChange: h,
							label: "Open in a new tab"
						}), /* @__PURE__ */ (0, N.jsx)("span", { children: "Open in a new tab" })]
					}), !g && /* @__PURE__ */ (0, N.jsx)("button", {
						type: "button",
						className: "vedit-text-action",
						onClick: () => v(!0),
						children: "Add a tooltip"
					})]
				}),
				g && /* @__PURE__ */ (0, N.jsxs)("div", {
					className: "vedit-field",
					children: [/* @__PURE__ */ (0, N.jsxs)("label", {
						className: "vedit-field-label",
						htmlFor: "vedit-link-alt",
						children: ["Tooltip ", /* @__PURE__ */ (0, N.jsx)("span", {
							className: "vedit-optional",
							children: "optional"
						})]
					}), /* @__PURE__ */ (0, N.jsx)("input", {
						id: "vedit-link-alt",
						className: "vedit-input",
						placeholder: "Shown on hover and read by screen readers",
						value: f,
						onChange: (e) => p(e.target.value)
					})]
				})
			]
		})
	});
}
function Sa({ target: e, types: t, onChange: n }) {
	let r = ra(e.url), i = _a(e.title ? "" : e.url, r.kind), a = e.nodeType ?? i?.node_type, o = r.kind === "anchor" && !e.title ? ya().find((t) => t.url === e.url) : void 0, s = e.title || i?.title || o?.title || r.detail, c = e.thumb ?? (i ? ri(i.featured_image) : "");
	return /* @__PURE__ */ (0, N.jsxs)("div", {
		className: "vedit-link-picked",
		"data-kind": r.kind,
		children: [
			c ? /* @__PURE__ */ (0, N.jsx)(oa, {
				src: c,
				label: s
			}) : /* @__PURE__ */ (0, N.jsx)("span", {
				className: "vedit-link-icon",
				"aria-hidden": "true",
				children: a ? /* @__PURE__ */ (0, N.jsx)(na, {
					types: t,
					slug: a,
					size: 17
				}) : /* @__PURE__ */ (0, N.jsx)(P, {
					name: pa[r.kind],
					size: 17
				})
			}),
			/* @__PURE__ */ (0, N.jsxs)("span", {
				className: "vedit-link-text",
				children: [/* @__PURE__ */ (0, N.jsx)("span", {
					className: "vedit-link-title",
					children: s
				}), /* @__PURE__ */ (0, N.jsxs)("span", {
					className: "vedit-link-meta",
					children: [/* @__PURE__ */ (0, N.jsx)("span", {
						className: "vedit-link-kind",
						children: a ? ta(t, a).label : r.label
					}), /* @__PURE__ */ (0, N.jsx)("span", {
						className: "vedit-link-url",
						children: r.detail
					})]
				})]
			}),
			/* @__PURE__ */ (0, N.jsx)("button", {
				type: "button",
				className: "vedit-btn",
				"data-variant": "secondary",
				"data-size": "sm",
				onClick: n,
				autoFocus: !0,
				children: "Change"
			})
		]
	});
}
var Ca = {
	smileys_emotion: "😀",
	people_body: "👋",
	animals_nature: "🐻",
	food_drink: "🍜",
	travel_places: "✈️",
	activities: "⚽",
	objects: "💡",
	symbols: "❤️",
	flags: "🏁"
}, wa = null;
function Ta() {
	return wa || (wa = Promise.all([import("./chunks/data-by-group-BsmL2YiJ.js"), import("./chunks/emoji-en-US-Cr0SZVjL.js")]).then(([e, t]) => {
		let n = e.default ?? e, r = t.default ?? t;
		return n.filter((e) => e.slug !== "component").map((e) => ({
			slug: e.slug,
			name: e.name,
			tab: Ca[e.slug] ?? e.emojis[0]?.emoji ?? "•",
			items: e.emojis.filter((e) => parseFloat(e.emoji_version) <= 15).map((e) => {
				let t = r[e.emoji] ?? r[e.emoji.replace(/️/g, "")] ?? [];
				return {
					e: e.emoji,
					n: e.name,
					k: [e.name, ...t].join(" ").replace(/_/g, " ").toLowerCase()
				};
			})
		})).filter((e) => e.items.length > 0);
	}).catch((e) => {
		throw wa = null, e;
	}), wa);
}
function Ea(e, t, n = 240) {
	let r = t.toLowerCase().trim().split(/\s+/).filter(Boolean);
	if (r.length === 0) return [];
	let i = [], a = [];
	for (let t of e) for (let e of t.items) r.every((t) => e.k.includes(t)) && (r.every((t) => e.n.includes(t)) ? i.push(e) : a.push(e));
	return [...i, ...a].slice(0, n);
}
var Da = "squilla_recent_emoji", Oa = 24;
function ka() {
	try {
		let e = localStorage.getItem(Da), t = e ? JSON.parse(e) : [];
		return Array.isArray(t) ? t.filter((e) => typeof e == "string").slice(0, Oa) : [];
	} catch {
		return [];
	}
}
function Aa(e) {
	try {
		let t = [e, ...ka().filter((t) => t !== e)].slice(0, Oa);
		localStorage.setItem(Da, JSON.stringify(t));
	} catch {}
}
//#endregion
//#region src/fields/EmojiField.tsx
var ja = "__recent__";
function Ma({ id: e, value: t, onChange: n, placeholder: r }) {
	let [i, a] = (0, _.useState)(!1);
	return /* @__PURE__ */ (0, N.jsxs)("div", {
		className: "vedit-emoji-field",
		children: [
			/* @__PURE__ */ (0, N.jsx)("button", {
				type: "button",
				className: "vedit-emoji-trigger",
				onClick: () => a(!0),
				"aria-label": t ? `Change emoji (${t})` : "Choose an emoji",
				title: "Choose an emoji",
				children: t ? /* @__PURE__ */ (0, N.jsx)("span", { children: t }) : /* @__PURE__ */ (0, N.jsx)(P, {
					name: "smile",
					size: 18,
					strokeWidth: 1.7
				})
			}),
			/* @__PURE__ */ (0, N.jsx)("input", {
				id: e,
				type: "text",
				className: "vedit-input",
				value: t,
				placeholder: r || "Type or paste an emoji",
				onChange: (e) => n(e.target.value)
			}),
			t && /* @__PURE__ */ (0, N.jsx)("button", {
				type: "button",
				className: "vedit-icon-btn",
				"data-size": "sm",
				onClick: () => n(""),
				"aria-label": "Clear emoji",
				title: "Clear",
				children: /* @__PURE__ */ (0, N.jsx)(P, {
					name: "x",
					size: 15
				})
			}),
			i && /* @__PURE__ */ (0, N.jsx)(Na, {
				onPick: (e) => {
					n(e), Aa(e), a(!1);
				},
				onClose: () => a(!1)
			})
		]
	});
}
function Na({ onPick: e, onClose: t }) {
	let [n, r] = (0, _.useState)(null), [i, a] = (0, _.useState)(!1), [o, s] = (0, _.useState)(""), [c] = (0, _.useState)(() => ka()), [l, u] = (0, _.useState)(() => ka().length ? ja : "smileys_emotion"), d = (0, _.useRef)(null);
	(0, _.useEffect)(() => {
		let e = !1;
		return Ta().then((t) => !e && r(t)).catch(() => !e && a(!0)), () => {
			e = !0;
		};
	}, []), (0, _.useEffect)(() => {
		d.current?.scrollTo({ top: 0 });
	}, [l, o]);
	let f = (0, _.useMemo)(() => {
		let e = /* @__PURE__ */ new Map();
		return n?.forEach((t) => t.items.forEach((t) => e.set(t.e, t.n))), e;
	}, [n]), p = (0, _.useMemo)(() => n ? o.trim() ? Ea(n, o) : l === ja ? c.map((e) => ({
		e,
		n: f.get(e) ?? e,
		k: ""
	})) : n.find((e) => e.slug === l)?.items ?? [] : [], [
		n,
		o,
		l,
		c,
		f
	]), m = o.trim() ? `Results for “${o.trim()}”` : l === ja ? "Recently used" : n?.find((e) => e.slug === l)?.name ?? "";
	return /* @__PURE__ */ (0, N.jsxs)(Ti, {
		title: "Choose an emoji",
		size: "sm",
		onClose: t,
		className: "vedit-emoji-modal",
		children: [
			/* @__PURE__ */ (0, N.jsx)(Ei, {
				value: o,
				onChange: s,
				placeholder: "Search (e.g. noodles, flag, heart)",
				autoFocus: !0,
				onEnter: () => p[0] && e(p[0].e)
			}),
			n && /* @__PURE__ */ (0, N.jsxs)("div", {
				className: "vedit-emoji-tabs",
				role: "tablist",
				"aria-label": "Emoji categories",
				children: [c.length > 0 && /* @__PURE__ */ (0, N.jsx)("button", {
					type: "button",
					role: "tab",
					"aria-selected": !o && l === ja,
					title: "Recently used",
					onClick: () => {
						s(""), u(ja);
					},
					children: "🕘"
				}), n.map((e) => /* @__PURE__ */ (0, N.jsx)("button", {
					type: "button",
					role: "tab",
					"aria-selected": !o && l === e.slug,
					title: e.name,
					onClick: () => {
						s(""), u(e.slug);
					},
					children: e.tab
				}, e.slug))]
			}),
			/* @__PURE__ */ (0, N.jsx)("div", {
				className: "vedit-emoji-heading",
				children: m
			}),
			/* @__PURE__ */ (0, N.jsx)("div", {
				ref: d,
				className: "vedit-emoji-scroll",
				children: i ? /* @__PURE__ */ (0, N.jsx)("p", {
					className: "vedit-empty",
					children: "Couldn't load the emoji list. You can still type or paste an emoji."
				}) : n ? p.length === 0 ? /* @__PURE__ */ (0, N.jsx)("p", {
					className: "vedit-empty",
					children: "No emoji found."
				}) : /* @__PURE__ */ (0, N.jsx)("div", {
					className: "vedit-emoji-grid",
					children: p.map((t) => /* @__PURE__ */ (0, N.jsx)("button", {
						type: "button",
						title: t.n,
						"aria-label": t.n,
						onClick: () => e(t.e),
						children: t.e
					}, t.e))
				}) : /* @__PURE__ */ (0, N.jsx)("p", {
					className: "vedit-empty",
					children: "Loading…"
				})
			})
		]
	});
}
//#endregion
//#region src/fields/FormSelector.tsx
function Pa({ value: e, onChange: t, id: n }) {
	let [r, i] = (0, _.useState)([]), [a, o] = (0, _.useState)(!0), [s, c] = (0, _.useState)(null);
	(0, _.useEffect)(() => {
		let e = !1;
		return o(!0), fetch("/admin/api/ext/forms/", { credentials: "include" }).then(async (e) => {
			if (!e.ok) throw Error(`HTTP ${e.status}`);
			return e.json();
		}).then((t) => {
			e || (i(Array.isArray(t?.rows) ? t.rows : Array.isArray(t?.data) ? t.data : []), c(null));
		}).catch((t) => {
			e || c(t instanceof Error ? t.message : String(t));
		}).finally(() => {
			e || o(!1);
		}), () => {
			e = !0;
		};
	}, []);
	let l = typeof e == "string" ? e : "", u = r.some((e) => e.slug === l);
	return /* @__PURE__ */ (0, N.jsxs)("div", { children: [
		/* @__PURE__ */ (0, N.jsxs)("select", {
			id: n,
			className: "vedit-input vedit-select",
			value: l,
			onChange: (e) => t(e.target.value),
			disabled: a,
			children: [
				/* @__PURE__ */ (0, N.jsx)("option", {
					value: "",
					children: a ? "Loading forms…" : "— Select a form —"
				}),
				r.map((e) => /* @__PURE__ */ (0, N.jsxs)("option", {
					value: e.slug,
					children: [
						e.name,
						" (",
						e.slug,
						")"
					]
				}, e.id)),
				l && !u && !a && /* @__PURE__ */ (0, N.jsxs)("option", {
					value: l,
					children: [l, " (not found)"]
				})
			]
		}),
		s && /* @__PURE__ */ (0, N.jsxs)("div", {
			className: "vedit-alert",
			"data-tone": "danger",
			style: { marginTop: 6 },
			children: [
				"Failed to load forms: ",
				s,
				". The forms extension may be inactive."
			]
		}),
		!a && !s && r.length === 0 && /* @__PURE__ */ (0, N.jsx)("div", {
			className: "vedit-field-hint",
			style: { marginTop: 6 },
			children: "No forms yet. Create one in Admin → Forms."
		})
	] });
}
//#endregion
//#region src/fields/MediaPicker.tsx
function Fa({ mode: e, onPick: t, onCancel: n }) {
	let [r, i] = (0, _.useState)([]), [a, o] = (0, _.useState)(""), [s, c] = (0, _.useState)(!0), [l, u] = (0, _.useState)(null), [d, f] = (0, _.useState)([]), p = e === "gallery";
	(0, _.useEffect)(() => {
		let t = !1;
		c(!0);
		let n = window.setTimeout(() => {
			ni({
				search: a,
				mime: e === "file" ? void 0 : "image",
				perPage: 80
			}).then((e) => {
				t || (i(e), u(null), c(!1));
			}).catch((e) => {
				t || (u(e.message), c(!1));
			});
		}, 200);
		return () => {
			t = !0, window.clearTimeout(n);
		};
	}, [a, e]);
	let m = (e) => {
		if (!p) {
			t([e]);
			return;
		}
		f((t) => t.includes(e.id) ? t.filter((t) => t !== e.id) : [...t, e.id]);
	};
	return /* @__PURE__ */ (0, N.jsxs)(Ti, {
		title: e === "gallery" ? "Add images" : e === "image" ? "Choose an image" : "Choose a file",
		subtitle: "From the media library",
		size: "lg",
		onClose: n,
		footer: p ? /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [
			/* @__PURE__ */ (0, N.jsx)("span", {
				className: "vedit-modal-count",
				children: d.length ? `${d.length} selected` : "Click images to select them"
			}),
			/* @__PURE__ */ (0, N.jsx)("button", {
				type: "button",
				className: "vedit-btn",
				"data-variant": "secondary",
				onClick: n,
				children: "Cancel"
			}),
			/* @__PURE__ */ (0, N.jsxs)("button", {
				type: "button",
				className: "vedit-btn",
				"data-variant": "primary",
				disabled: d.length === 0,
				onClick: () => t(d.map((e) => r.find((t) => t.id === e)).filter((e) => !!e)),
				children: [
					"Add ",
					d.length || "",
					" ",
					d.length === 1 ? "image" : "images"
				]
			})
		] }) : void 0,
		children: [
			/* @__PURE__ */ (0, N.jsx)(Ei, {
				value: a,
				onChange: o,
				placeholder: "Search by file name…",
				autoFocus: !0
			}),
			l && /* @__PURE__ */ (0, N.jsx)("div", {
				className: "vedit-alert",
				"data-tone": "danger",
				children: l
			}),
			s && r.length === 0 ? /* @__PURE__ */ (0, N.jsx)("p", {
				className: "vedit-empty",
				children: "Loading…"
			}) : r.length === 0 ? /* @__PURE__ */ (0, N.jsx)("p", {
				className: "vedit-empty",
				children: a ? `Nothing matches “${a}”.` : "The media library is empty."
			}) : /* @__PURE__ */ (0, N.jsx)("div", {
				className: "vedit-media-grid",
				children: r.map((e) => {
					let t = (e.mime_type || "").startsWith("image/"), n = d.indexOf(e.id);
					return /* @__PURE__ */ (0, N.jsxs)("button", {
						type: "button",
						className: "vedit-media-tile",
						"data-selected": n >= 0 || void 0,
						onClick: () => m(e),
						title: e.original_name ?? e.url,
						children: [/* @__PURE__ */ (0, N.jsxs)("span", {
							className: "vedit-media-preview",
							children: [t ? /* @__PURE__ */ (0, N.jsx)("img", {
								src: e.url,
								alt: e.alt_text ?? "",
								loading: "lazy"
							}) : /* @__PURE__ */ (0, N.jsx)(P, {
								name: "file",
								size: 28,
								strokeWidth: 1.5
							}), p && n >= 0 && /* @__PURE__ */ (0, N.jsx)("span", {
								className: "vedit-media-check",
								children: n + 1
							})]
						}), /* @__PURE__ */ (0, N.jsx)("span", {
							className: "vedit-media-name",
							children: e.original_name ?? `#${e.id}`
						})]
					}, e.id);
				})
			})
		]
	});
}
function Ia(e) {
	try {
		return decodeURIComponent(e.split("?")[0].split("/").pop() || e);
	} catch {
		return e;
	}
}
function La({ value: e, onChange: t, openSignal: n }) {
	let [r, i] = (0, _.useState)(!1);
	(0, _.useEffect)(() => {
		n && i(!0);
	}, [n]);
	let a = typeof e == "object" && e ? e : {}, o = typeof e == "string" ? e : a.url;
	return /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [o ? /* @__PURE__ */ (0, N.jsxs)("div", {
		className: "vedit-image-card",
		children: [/* @__PURE__ */ (0, N.jsx)("button", {
			type: "button",
			className: "vedit-image-thumb",
			onClick: () => i(!0),
			title: "Replace image",
			children: o.startsWith("theme-asset:") ? /* @__PURE__ */ (0, N.jsx)(P, {
				name: "image",
				size: 22,
				strokeWidth: 1.6
			}) : /* @__PURE__ */ (0, N.jsx)("img", {
				src: o,
				alt: a.alt ?? ""
			})
		}), /* @__PURE__ */ (0, N.jsxs)("div", {
			className: "vedit-image-meta",
			children: [
				/* @__PURE__ */ (0, N.jsxs)("span", {
					className: "vedit-image-name",
					title: o,
					children: [Ia(o), a.width && a.height ? /* @__PURE__ */ (0, N.jsxs)("span", {
						className: "vedit-image-dims",
						children: [
							a.width,
							"×",
							a.height
						]
					}) : null]
				}),
				typeof e == "object" && !!e && /* @__PURE__ */ (0, N.jsx)("input", {
					type: "text",
					className: "vedit-input",
					"data-size": "sm",
					placeholder: "Alt text — describe the image",
					value: a.alt ?? "",
					onChange: (e) => t({
						...a,
						alt: e.target.value
					})
				}),
				/* @__PURE__ */ (0, N.jsxs)("div", {
					className: "vedit-inline-actions",
					children: [/* @__PURE__ */ (0, N.jsx)("button", {
						type: "button",
						className: "vedit-btn",
						"data-variant": "secondary",
						"data-size": "sm",
						onClick: () => i(!0),
						children: "Replace"
					}), /* @__PURE__ */ (0, N.jsx)("button", {
						type: "button",
						className: "vedit-btn",
						"data-variant": "ghost-danger",
						"data-size": "sm",
						onClick: () => t(null),
						children: "Remove"
					})]
				})
			]
		})]
	}) : /* @__PURE__ */ (0, N.jsxs)("button", {
		type: "button",
		className: "vedit-media-empty",
		onClick: () => i(!0),
		children: [/* @__PURE__ */ (0, N.jsx)(P, {
			name: "image",
			size: 18,
			strokeWidth: 1.7
		}), "Choose image"]
	}), r && /* @__PURE__ */ (0, N.jsx)(Fa, {
		mode: "image",
		onPick: (e) => {
			let n = e[0];
			n && t({
				id: n.id,
				url: n.url,
				alt: n.alt_text ?? "",
				width: n.width,
				height: n.height
			}), i(!1);
		},
		onCancel: () => i(!1)
	})] });
}
function Ra({ value: e, onChange: t }) {
	let [n, r] = (0, _.useState)(!1), i = typeof e == "object" && e ? e : {};
	return /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [i.url ? /* @__PURE__ */ (0, N.jsxs)("div", {
		className: "vedit-file-card",
		children: [
			/* @__PURE__ */ (0, N.jsx)("span", {
				className: "vedit-file-icon",
				children: /* @__PURE__ */ (0, N.jsx)(P, {
					name: "file",
					size: 18,
					strokeWidth: 1.7
				})
			}),
			/* @__PURE__ */ (0, N.jsx)("a", {
				className: "vedit-file-name",
				href: i.url,
				target: "_blank",
				rel: "noreferrer",
				title: "Open file",
				children: i.name || Ia(i.url)
			}),
			/* @__PURE__ */ (0, N.jsx)("button", {
				type: "button",
				className: "vedit-btn",
				"data-variant": "secondary",
				"data-size": "sm",
				onClick: () => r(!0),
				children: "Replace"
			}),
			/* @__PURE__ */ (0, N.jsx)("button", {
				type: "button",
				className: "vedit-icon-btn",
				"data-size": "sm",
				"data-tone": "danger",
				onClick: () => t(null),
				title: "Remove file",
				"aria-label": "Remove file",
				children: /* @__PURE__ */ (0, N.jsx)(P, {
					name: "x",
					size: 15
				})
			})
		]
	}) : /* @__PURE__ */ (0, N.jsxs)("button", {
		type: "button",
		className: "vedit-media-empty",
		onClick: () => r(!0),
		children: [/* @__PURE__ */ (0, N.jsx)(P, {
			name: "file",
			size: 18,
			strokeWidth: 1.7
		}), "Choose file"]
	}), n && /* @__PURE__ */ (0, N.jsx)(Fa, {
		mode: "file",
		onPick: (e) => {
			let n = e[0];
			n && t({
				id: n.id,
				url: n.url,
				name: n.original_name ?? ""
			}), r(!1);
		},
		onCancel: () => r(!1)
	})] });
}
function za({ value: e, onChange: t }) {
	let [n, r] = (0, _.useState)(!1), i = (0, _.useMemo)(() => Array.isArray(e) ? e : [], [e]), a = (e, n) => {
		let r = e + n;
		if (r < 0 || r >= i.length) return;
		let a = i.slice();
		[a[e], a[r]] = [a[r], a[e]], t(a);
	};
	return /* @__PURE__ */ (0, N.jsxs)("div", {
		className: "vedit-gallery-field",
		children: [
			i.length > 0 && /* @__PURE__ */ (0, N.jsx)("div", {
				className: "vedit-gallery",
				children: i.map((e, n) => {
					let r = typeof e.url == "string" ? e.url : "";
					return /* @__PURE__ */ (0, N.jsxs)("div", {
						className: "vedit-gallery-tile",
						children: [r && /* @__PURE__ */ (0, N.jsx)("img", {
							src: r,
							alt: typeof e.alt == "string" ? e.alt : ""
						}), /* @__PURE__ */ (0, N.jsxs)("span", {
							className: "vedit-gallery-actions",
							children: [
								/* @__PURE__ */ (0, N.jsx)("button", {
									type: "button",
									onClick: () => a(n, -1),
									disabled: n === 0,
									"aria-label": "Move earlier",
									title: "Move earlier",
									children: /* @__PURE__ */ (0, N.jsx)(P, {
										name: "arrow-up",
										size: 12,
										style: { transform: "rotate(-90deg)" }
									})
								}),
								/* @__PURE__ */ (0, N.jsx)("button", {
									type: "button",
									onClick: () => a(n, 1),
									disabled: n === i.length - 1,
									"aria-label": "Move later",
									title: "Move later",
									children: /* @__PURE__ */ (0, N.jsx)(P, {
										name: "arrow-down",
										size: 12,
										style: { transform: "rotate(-90deg)" }
									})
								}),
								/* @__PURE__ */ (0, N.jsx)("button", {
									type: "button",
									"data-tone": "danger",
									onClick: () => t(i.filter((e, t) => t !== n)),
									"aria-label": "Remove image",
									title: "Remove",
									children: /* @__PURE__ */ (0, N.jsx)(P, {
										name: "x",
										size: 12
									})
								})
							]
						})]
					}, `${r}-${n}`);
				})
			}),
			/* @__PURE__ */ (0, N.jsxs)("button", {
				type: "button",
				className: "vedit-add-button",
				"data-size": "sm",
				onClick: () => r(!0),
				children: [/* @__PURE__ */ (0, N.jsx)(P, {
					name: "plus",
					size: 15
				}), i.length ? "Add more images" : "Add images"]
			}),
			n && /* @__PURE__ */ (0, N.jsx)(Fa, {
				mode: "gallery",
				onPick: (e) => {
					t([...i, ...e.map((e) => ({
						id: e.id,
						url: e.url,
						alt: e.alt_text ?? "",
						width: e.width,
						height: e.height
					}))]), r(!1);
				},
				onCancel: () => r(!1)
			})
		]
	});
}
//#endregion
//#region node_modules/orderedmap/dist/index.js
function Ba(e) {
	this.content = e;
}
Ba.prototype = {
	constructor: Ba,
	find: function(e) {
		for (var t = 0; t < this.content.length; t += 2) if (this.content[t] === e) return t;
		return -1;
	},
	get: function(e) {
		var t = this.find(e);
		return t == -1 ? void 0 : this.content[t + 1];
	},
	update: function(e, t, n) {
		var r = n && n != e ? this.remove(n) : this, i = r.find(e), a = r.content.slice();
		return i == -1 ? a.push(n || e, t) : (a[i + 1] = t, n && (a[i] = n)), new Ba(a);
	},
	remove: function(e) {
		var t = this.find(e);
		if (t == -1) return this;
		var n = this.content.slice();
		return n.splice(t, 2), new Ba(n);
	},
	addToStart: function(e, t) {
		return new Ba([e, t].concat(this.remove(e).content));
	},
	addToEnd: function(e, t) {
		var n = this.remove(e).content.slice();
		return n.push(e, t), new Ba(n);
	},
	addBefore: function(e, t, n) {
		var r = this.remove(t), i = r.content.slice(), a = r.find(e);
		return i.splice(a == -1 ? i.length : a, 0, t, n), new Ba(i);
	},
	forEach: function(e) {
		for (var t = 0; t < this.content.length; t += 2) e(this.content[t], this.content[t + 1]);
	},
	prepend: function(e) {
		return e = Ba.from(e), e.size ? new Ba(e.content.concat(this.subtract(e).content)) : this;
	},
	append: function(e) {
		return e = Ba.from(e), e.size ? new Ba(this.subtract(e).content.concat(e.content)) : this;
	},
	subtract: function(e) {
		var t = this;
		e = Ba.from(e);
		for (var n = 0; n < e.content.length; n += 2) t = t.remove(e.content[n]);
		return t;
	},
	toObject: function() {
		var e = {};
		return this.forEach(function(t, n) {
			e[t] = n;
		}), e;
	},
	get size() {
		return this.content.length >> 1;
	}
}, Ba.from = function(e) {
	if (e instanceof Ba) return e;
	var t = [];
	if (e) for (var n in e) t.push(n, e[n]);
	return new Ba(t);
};
//#endregion
//#region node_modules/prosemirror-model/dist/index.js
function Va(e, t, n) {
	for (let r = 0;; r++) {
		if (r == e.childCount || r == t.childCount) return e.childCount == t.childCount ? null : n;
		let i = e.child(r), a = t.child(r);
		if (i == a) {
			n += i.nodeSize;
			continue;
		}
		if (!i.sameMarkup(a)) return n;
		if (i.isText && i.text != a.text) {
			for (let e = 0; i.text[e] == a.text[e]; e++) n++;
			return n;
		}
		if (i.content.size || a.content.size) {
			let e = Va(i.content, a.content, n + 1);
			if (e != null) return e;
		}
		n += i.nodeSize;
	}
}
function Ha(e, t, n, r) {
	for (let i = e.childCount, a = t.childCount;;) {
		if (i == 0 || a == 0) return i == a ? null : {
			a: n,
			b: r
		};
		let o = e.child(--i), s = t.child(--a), c = o.nodeSize;
		if (o == s) {
			n -= c, r -= c;
			continue;
		}
		if (!o.sameMarkup(s)) return {
			a: n,
			b: r
		};
		if (o.isText && o.text != s.text) {
			let e = 0, t = Math.min(o.text.length, s.text.length);
			for (; e < t && o.text[o.text.length - e - 1] == s.text[s.text.length - e - 1];) e++, n--, r--;
			return {
				a: n,
				b: r
			};
		}
		if (o.content.size || s.content.size) {
			let e = Ha(o.content, s.content, n - 1, r - 1);
			if (e) return e;
		}
		n -= c, r -= c;
	}
}
var I = class e {
	constructor(e, t) {
		if (this.content = e, this.size = t || 0, t == null) for (let t = 0; t < e.length; t++) this.size += e[t].nodeSize;
	}
	nodesBetween(e, t, n, r = 0, i) {
		for (let a = 0, o = 0; o < t; a++) {
			let s = this.content[a], c = o + s.nodeSize;
			if (c > e && n(s, r + o, i || null, a) !== !1 && s.content.size) {
				let i = o + 1;
				s.nodesBetween(Math.max(0, e - i), Math.min(s.content.size, t - i), n, r + i);
			}
			o = c;
		}
	}
	descendants(e) {
		this.nodesBetween(0, this.size, e);
	}
	textBetween(e, t, n, r) {
		let i = "", a = !0;
		return this.nodesBetween(e, t, (o, s) => {
			let c = o.isText ? o.text.slice(Math.max(e, s) - s, t - s) : o.isLeaf ? r ? typeof r == "function" ? r(o) : r : o.type.spec.leafText ? o.type.spec.leafText(o) : "" : "";
			o.isBlock && (o.isLeaf && c || o.isTextblock) && n && (a ? a = !1 : i += n), i += c;
		}, 0), i;
	}
	append(t) {
		if (!t.size) return this;
		if (!this.size) return t;
		let n = this.lastChild, r = t.firstChild, i = this.content.slice(), a = 0;
		for (n.isText && n.sameMarkup(r) && (i[i.length - 1] = n.withText(n.text + r.text), a = 1); a < t.content.length; a++) i.push(t.content[a]);
		return new e(i, this.size + t.size);
	}
	cut(t, n = this.size) {
		if (t == 0 && n == this.size) return this;
		let r = [], i = 0;
		if (n > t) for (let e = 0, a = 0; a < n; e++) {
			let o = this.content[e], s = a + o.nodeSize;
			s > t && ((a < t || s > n) && (o = o.isText ? o.cut(Math.max(0, t - a), Math.min(o.text.length, n - a)) : o.cut(Math.max(0, t - a - 1), Math.min(o.content.size, n - a - 1))), r.push(o), i += o.nodeSize), a = s;
		}
		return new e(r, i);
	}
	cutByIndex(t, n) {
		return t == n ? e.empty : t == 0 && n == this.content.length ? this : new e(this.content.slice(t, n));
	}
	replaceChild(t, n) {
		let r = this.content[t];
		if (r == n) return this;
		let i = this.content.slice(), a = this.size + n.nodeSize - r.nodeSize;
		return i[t] = n, new e(i, a);
	}
	addToStart(t) {
		return new e([t].concat(this.content), this.size + t.nodeSize);
	}
	addToEnd(t) {
		return new e(this.content.concat(t), this.size + t.nodeSize);
	}
	eq(e) {
		if (this.content.length != e.content.length) return !1;
		for (let t = 0; t < this.content.length; t++) if (!this.content[t].eq(e.content[t])) return !1;
		return !0;
	}
	get firstChild() {
		return this.content.length ? this.content[0] : null;
	}
	get lastChild() {
		return this.content.length ? this.content[this.content.length - 1] : null;
	}
	get childCount() {
		return this.content.length;
	}
	child(e) {
		let t = this.content[e];
		if (!t) throw RangeError("Index " + e + " out of range for " + this);
		return t;
	}
	maybeChild(e) {
		return this.content[e] || null;
	}
	forEach(e) {
		for (let t = 0, n = 0; t < this.content.length; t++) {
			let r = this.content[t];
			e(r, n, t), n += r.nodeSize;
		}
	}
	findDiffStart(e, t = 0) {
		return Va(this, e, t);
	}
	findDiffEnd(e, t = this.size, n = e.size) {
		return Ha(this, e, t, n);
	}
	findIndex(e) {
		if (e == 0) return Wa(0, e);
		if (e == this.size) return Wa(this.content.length, e);
		if (e > this.size || e < 0) throw RangeError(`Position ${e} outside of fragment (${this})`);
		for (let t = 0, n = 0;; t++) {
			let r = this.child(t), i = n + r.nodeSize;
			if (i >= e) return i == e ? Wa(t + 1, i) : Wa(t, n);
			n = i;
		}
	}
	toString() {
		return "<" + this.toStringInner() + ">";
	}
	toStringInner() {
		return this.content.join(", ");
	}
	toJSON() {
		return this.content.length ? this.content.map((e) => e.toJSON()) : null;
	}
	static fromJSON(t, n) {
		if (!n) return e.empty;
		if (!Array.isArray(n)) throw RangeError("Invalid input for Fragment.fromJSON");
		return new e(n.map(t.nodeFromJSON));
	}
	static fromArray(t) {
		if (!t.length) return e.empty;
		let n, r = 0;
		for (let e = 0; e < t.length; e++) {
			let i = t[e];
			r += i.nodeSize, e && i.isText && t[e - 1].sameMarkup(i) ? (n || (n = t.slice(0, e)), n[n.length - 1] = i.withText(n[n.length - 1].text + i.text)) : n && n.push(i);
		}
		return new e(n || t, r);
	}
	static from(t) {
		if (!t) return e.empty;
		if (t instanceof e) return t;
		if (Array.isArray(t)) return this.fromArray(t);
		if (t.attrs) return new e([t], t.nodeSize);
		throw RangeError("Can not convert " + t + " to a Fragment" + (t.nodesBetween ? " (looks like multiple versions of prosemirror-model were loaded)" : ""));
	}
};
I.empty = new I([], 0);
var Ua = {
	index: 0,
	offset: 0
};
function Wa(e, t) {
	return Ua.index = e, Ua.offset = t, Ua;
}
function Ga(e, t) {
	if (e === t) return !0;
	if (!(e && typeof e == "object") || !(t && typeof t == "object")) return !1;
	let n = Array.isArray(e);
	if (Array.isArray(t) != n) return !1;
	if (n) {
		if (e.length != t.length) return !1;
		for (let n = 0; n < e.length; n++) if (!Ga(e[n], t[n])) return !1;
	} else {
		for (let n in e) if (!(n in t) || !Ga(e[n], t[n])) return !1;
		for (let n in t) if (!(n in e)) return !1;
	}
	return !0;
}
var L = class e {
	constructor(e, t) {
		this.type = e, this.attrs = t;
	}
	addToSet(e) {
		let t, n = !1;
		for (let r = 0; r < e.length; r++) {
			let i = e[r];
			if (this.eq(i)) return e;
			if (this.type.excludes(i.type)) t || (t = e.slice(0, r));
			else if (i.type.excludes(this.type)) return e;
			else !n && i.type.rank > this.type.rank && (t || (t = e.slice(0, r)), t.push(this), n = !0), t && t.push(i);
		}
		return t || (t = e.slice()), n || t.push(this), t;
	}
	removeFromSet(e) {
		for (let t = 0; t < e.length; t++) if (this.eq(e[t])) return e.slice(0, t).concat(e.slice(t + 1));
		return e;
	}
	isInSet(e) {
		for (let t = 0; t < e.length; t++) if (this.eq(e[t])) return !0;
		return !1;
	}
	eq(e) {
		return this == e || this.type == e.type && Ga(this.attrs, e.attrs);
	}
	toJSON() {
		let e = { type: this.type.name };
		for (let t in this.attrs) {
			e.attrs = this.attrs;
			break;
		}
		return e;
	}
	static fromJSON(e, t) {
		if (!t) throw RangeError("Invalid input for Mark.fromJSON");
		let n = e.marks[t.type];
		if (!n) throw RangeError(`There is no mark type ${t.type} in this schema`);
		let r = n.create(t.attrs);
		return n.checkAttrs(r.attrs), r;
	}
	static sameSet(e, t) {
		if (e == t) return !0;
		if (e.length != t.length) return !1;
		for (let n = 0; n < e.length; n++) if (!e[n].eq(t[n])) return !1;
		return !0;
	}
	static setFrom(t) {
		if (!t || Array.isArray(t) && t.length == 0) return e.none;
		if (t instanceof e) return [t];
		let n = t.slice();
		return n.sort((e, t) => e.type.rank - t.type.rank), n;
	}
};
L.none = [];
var Ka = class extends Error {}, R = class e {
	constructor(e, t, n) {
		this.content = e, this.openStart = t, this.openEnd = n;
	}
	get size() {
		return this.content.size - this.openStart - this.openEnd;
	}
	insertAt(t, n) {
		let r = Ja(this.content, t + this.openStart, n);
		return r && new e(r, this.openStart, this.openEnd);
	}
	removeBetween(t, n) {
		return new e(qa(this.content, t + this.openStart, n + this.openStart), this.openStart, this.openEnd);
	}
	eq(e) {
		return this.content.eq(e.content) && this.openStart == e.openStart && this.openEnd == e.openEnd;
	}
	toString() {
		return this.content + "(" + this.openStart + "," + this.openEnd + ")";
	}
	toJSON() {
		if (!this.content.size) return null;
		let e = { content: this.content.toJSON() };
		return this.openStart > 0 && (e.openStart = this.openStart), this.openEnd > 0 && (e.openEnd = this.openEnd), e;
	}
	static fromJSON(t, n) {
		if (!n) return e.empty;
		let r = n.openStart || 0, i = n.openEnd || 0;
		if (typeof r != "number" || typeof i != "number") throw RangeError("Invalid input for Slice.fromJSON");
		return new e(I.fromJSON(t, n.content), r, i);
	}
	static maxOpen(t, n = !0) {
		let r = 0, i = 0;
		for (let e = t.firstChild; e && !e.isLeaf && (n || !e.type.spec.isolating); e = e.firstChild) r++;
		for (let e = t.lastChild; e && !e.isLeaf && (n || !e.type.spec.isolating); e = e.lastChild) i++;
		return new e(t, r, i);
	}
};
R.empty = new R(I.empty, 0, 0);
function qa(e, t, n) {
	let { index: r, offset: i } = e.findIndex(t), a = e.maybeChild(r), { index: o, offset: s } = e.findIndex(n);
	if (i == t || a.isText) {
		if (s != n && !e.child(o).isText) throw RangeError("Removing non-flat range");
		return e.cut(0, t).append(e.cut(n));
	}
	if (r != o) throw RangeError("Removing non-flat range");
	return e.replaceChild(r, a.copy(qa(a.content, t - i - 1, n - i - 1)));
}
function Ja(e, t, n, r) {
	let { index: i, offset: a } = e.findIndex(t), o = e.maybeChild(i);
	if (a == t || o.isText) return r && !r.canReplace(i, i, n) ? null : e.cut(0, t).append(n).append(e.cut(t));
	let s = Ja(o.content, t - a - 1, n, o);
	return s && e.replaceChild(i, o.copy(s));
}
function Ya(e, t, n) {
	if (n.openStart > e.depth) throw new Ka("Inserted content deeper than insertion position");
	if (e.depth - n.openStart != t.depth - n.openEnd) throw new Ka("Inconsistent open depths");
	return Xa(e, t, n, 0);
}
function Xa(e, t, n, r) {
	let i = e.index(r), a = e.node(r);
	if (i == t.index(r) && r < e.depth - n.openStart) {
		let o = Xa(e, t, n, r + 1);
		return a.copy(a.content.replaceChild(i, o));
	} else if (!n.content.size) return to(a, ro(e, t, r));
	else if (!n.openStart && !n.openEnd && e.depth == r && t.depth == r) {
		let r = e.parent, i = r.content;
		return to(r, i.cut(0, e.parentOffset).append(n.content).append(i.cut(t.parentOffset)));
	} else {
		let { start: i, end: o } = io(n, e);
		return to(a, no(e, i, o, t, r));
	}
}
function Za(e, t) {
	if (!t.type.compatibleContent(e.type)) throw new Ka("Cannot join " + t.type.name + " onto " + e.type.name);
}
function Qa(e, t, n) {
	let r = e.node(n);
	return Za(r, t.node(n)), r;
}
function $a(e, t) {
	let n = t.length - 1;
	n >= 0 && e.isText && e.sameMarkup(t[n]) ? t[n] = e.withText(t[n].text + e.text) : t.push(e);
}
function eo(e, t, n, r) {
	let i = (t || e).node(n), a = 0, o = t ? t.index(n) : i.childCount;
	e && (a = e.index(n), e.depth > n ? a++ : e.textOffset && ($a(e.nodeAfter, r), a++));
	for (let e = a; e < o; e++) $a(i.child(e), r);
	t && t.depth == n && t.textOffset && $a(t.nodeBefore, r);
}
function to(e, t) {
	return e.type.checkContent(t), e.copy(t);
}
function no(e, t, n, r, i) {
	let a = e.depth > i && Qa(e, t, i + 1), o = r.depth > i && Qa(n, r, i + 1), s = [];
	return eo(null, e, i, s), a && o && t.index(i) == n.index(i) ? (Za(a, o), $a(to(a, no(e, t, n, r, i + 1)), s)) : (a && $a(to(a, ro(e, t, i + 1)), s), eo(t, n, i, s), o && $a(to(o, ro(n, r, i + 1)), s)), eo(r, null, i, s), new I(s);
}
function ro(e, t, n) {
	let r = [];
	return eo(null, e, n, r), e.depth > n && $a(to(Qa(e, t, n + 1), ro(e, t, n + 1)), r), eo(t, null, n, r), new I(r);
}
function io(e, t) {
	let n = t.depth - e.openStart, r = t.node(n).copy(e.content);
	for (let e = n - 1; e >= 0; e--) r = t.node(e).copy(I.from(r));
	return {
		start: r.resolveNoCache(e.openStart + n),
		end: r.resolveNoCache(r.content.size - e.openEnd - n)
	};
}
var ao = class e {
	constructor(e, t, n) {
		this.pos = e, this.path = t, this.parentOffset = n, this.depth = t.length / 3 - 1;
	}
	resolveDepth(e) {
		return e == null ? this.depth : e < 0 ? this.depth + e : e;
	}
	get parent() {
		return this.node(this.depth);
	}
	get doc() {
		return this.node(0);
	}
	node(e) {
		return this.path[this.resolveDepth(e) * 3];
	}
	index(e) {
		return this.path[this.resolveDepth(e) * 3 + 1];
	}
	indexAfter(e) {
		return e = this.resolveDepth(e), this.index(e) + (e == this.depth && !this.textOffset ? 0 : 1);
	}
	start(e) {
		return e = this.resolveDepth(e), e == 0 ? 0 : this.path[e * 3 - 1] + 1;
	}
	end(e) {
		return e = this.resolveDepth(e), this.start(e) + this.node(e).content.size;
	}
	before(e) {
		if (e = this.resolveDepth(e), !e) throw RangeError("There is no position before the top-level node");
		return e == this.depth + 1 ? this.pos : this.path[e * 3 - 1];
	}
	after(e) {
		if (e = this.resolveDepth(e), !e) throw RangeError("There is no position after the top-level node");
		return e == this.depth + 1 ? this.pos : this.path[e * 3 - 1] + this.path[e * 3].nodeSize;
	}
	get textOffset() {
		return this.pos - this.path[this.path.length - 1];
	}
	get nodeAfter() {
		let e = this.parent, t = this.index(this.depth);
		if (t == e.childCount) return null;
		let n = this.pos - this.path[this.path.length - 1], r = e.child(t);
		return n ? e.child(t).cut(n) : r;
	}
	get nodeBefore() {
		let e = this.index(this.depth), t = this.pos - this.path[this.path.length - 1];
		return t ? this.parent.child(e).cut(0, t) : e == 0 ? null : this.parent.child(e - 1);
	}
	posAtIndex(e, t) {
		t = this.resolveDepth(t);
		let n = this.path[t * 3], r = t == 0 ? 0 : this.path[t * 3 - 1] + 1;
		for (let t = 0; t < e; t++) r += n.child(t).nodeSize;
		return r;
	}
	marks() {
		let e = this.parent, t = this.index();
		if (e.content.size == 0) return L.none;
		if (this.textOffset) return e.child(t).marks;
		let n = e.maybeChild(t - 1), r = e.maybeChild(t);
		if (!n) {
			let e = n;
			n = r, r = e;
		}
		let i = n.marks;
		for (var a = 0; a < i.length; a++) i[a].type.spec.inclusive === !1 && (!r || !i[a].isInSet(r.marks)) && (i = i[a--].removeFromSet(i));
		return i;
	}
	marksAcross(e) {
		let t = this.parent.maybeChild(this.index());
		if (!t || !t.isInline) return null;
		let n = t.marks, r = e.parent.maybeChild(e.index());
		for (var i = 0; i < n.length; i++) n[i].type.spec.inclusive === !1 && (!r || !n[i].isInSet(r.marks)) && (n = n[i--].removeFromSet(n));
		return n;
	}
	sharedDepth(e) {
		for (let t = this.depth; t > 0; t--) if (this.start(t) <= e && this.end(t) >= e) return t;
		return 0;
	}
	blockRange(e = this, t) {
		if (e.pos < this.pos) return e.blockRange(this);
		for (let n = this.depth - (this.parent.inlineContent || this.pos == e.pos ? 1 : 0); n >= 0; n--) if (e.pos <= this.end(n) && (!t || t(this.node(n)))) return new lo(this, e, n);
		return null;
	}
	sameParent(e) {
		return this.pos - this.parentOffset == e.pos - e.parentOffset;
	}
	max(e) {
		return e.pos > this.pos ? e : this;
	}
	min(e) {
		return e.pos < this.pos ? e : this;
	}
	toString() {
		let e = "";
		for (let t = 1; t <= this.depth; t++) e += (e ? "/" : "") + this.node(t).type.name + "_" + this.index(t - 1);
		return e + ":" + this.parentOffset;
	}
	static resolve(t, n) {
		if (!(n >= 0 && n <= t.content.size)) throw RangeError("Position " + n + " out of range");
		let r = [], i = 0, a = n;
		for (let e = t;;) {
			let { index: t, offset: n } = e.content.findIndex(a), o = a - n;
			if (r.push(e, t, i + n), !o || (e = e.child(t), e.isText)) break;
			a = o - 1, i += n + 1;
		}
		return new e(n, r, a);
	}
	static resolveCached(t, n) {
		let r = co.get(t);
		if (r) for (let e = 0; e < r.elts.length; e++) {
			let t = r.elts[e];
			if (t.pos == n) return t;
		}
		else co.set(t, r = new oo());
		let i = r.elts[r.i] = e.resolve(t, n);
		return r.i = (r.i + 1) % so, i;
	}
}, oo = class {
	constructor() {
		this.elts = [], this.i = 0;
	}
}, so = 12, co = /* @__PURE__ */ new WeakMap(), lo = class {
	constructor(e, t, n) {
		this.$from = e, this.$to = t, this.depth = n;
	}
	get start() {
		return this.$from.before(this.depth + 1);
	}
	get end() {
		return this.$to.after(this.depth + 1);
	}
	get parent() {
		return this.$from.node(this.depth);
	}
	get startIndex() {
		return this.$from.index(this.depth);
	}
	get endIndex() {
		return this.$to.indexAfter(this.depth);
	}
}, uo = Object.create(null), fo = class e {
	constructor(e, t, n, r = L.none) {
		this.type = e, this.attrs = t, this.marks = r, this.content = n || I.empty;
	}
	get children() {
		return this.content.content;
	}
	get nodeSize() {
		return this.isLeaf ? 1 : 2 + this.content.size;
	}
	get childCount() {
		return this.content.childCount;
	}
	child(e) {
		return this.content.child(e);
	}
	maybeChild(e) {
		return this.content.maybeChild(e);
	}
	forEach(e) {
		this.content.forEach(e);
	}
	nodesBetween(e, t, n, r = 0) {
		this.content.nodesBetween(e, t, n, r, this);
	}
	descendants(e) {
		this.nodesBetween(0, this.content.size, e);
	}
	get textContent() {
		return this.isLeaf && this.type.spec.leafText ? this.type.spec.leafText(this) : this.textBetween(0, this.content.size, "");
	}
	textBetween(e, t, n, r) {
		return this.content.textBetween(e, t, n, r);
	}
	get firstChild() {
		return this.content.firstChild;
	}
	get lastChild() {
		return this.content.lastChild;
	}
	eq(e) {
		return this == e || this.sameMarkup(e) && this.content.eq(e.content);
	}
	sameMarkup(e) {
		return this.hasMarkup(e.type, e.attrs, e.marks);
	}
	hasMarkup(e, t, n) {
		return this.type == e && Ga(this.attrs, t || e.defaultAttrs || uo) && L.sameSet(this.marks, n || L.none);
	}
	copy(t = null) {
		return t == this.content ? this : new e(this.type, this.attrs, t, this.marks);
	}
	mark(t) {
		return t == this.marks ? this : new e(this.type, this.attrs, this.content, t);
	}
	cut(e, t = this.content.size) {
		return e == 0 && t == this.content.size ? this : this.copy(this.content.cut(e, t));
	}
	slice(e, t = this.content.size, n = !1) {
		if (e == t) return R.empty;
		let r = this.resolve(e), i = this.resolve(t), a = n ? 0 : r.sharedDepth(t), o = r.start(a);
		return new R(r.node(a).content.cut(r.pos - o, i.pos - o), r.depth - a, i.depth - a);
	}
	replace(e, t, n) {
		return Ya(this.resolve(e), this.resolve(t), n);
	}
	nodeAt(e) {
		for (let t = this;;) {
			let { index: n, offset: r } = t.content.findIndex(e);
			if (t = t.maybeChild(n), !t) return null;
			if (r == e || t.isText) return t;
			e -= r + 1;
		}
	}
	childAfter(e) {
		let { index: t, offset: n } = this.content.findIndex(e);
		return {
			node: this.content.maybeChild(t),
			index: t,
			offset: n
		};
	}
	childBefore(e) {
		if (e == 0) return {
			node: null,
			index: 0,
			offset: 0
		};
		let { index: t, offset: n } = this.content.findIndex(e);
		if (n < e) return {
			node: this.content.child(t),
			index: t,
			offset: n
		};
		let r = this.content.child(t - 1);
		return {
			node: r,
			index: t - 1,
			offset: n - r.nodeSize
		};
	}
	resolve(e) {
		return ao.resolveCached(this, e);
	}
	resolveNoCache(e) {
		return ao.resolve(this, e);
	}
	rangeHasMark(e, t, n) {
		let r = !1;
		return t > e && this.nodesBetween(e, t, (e) => (n.isInSet(e.marks) && (r = !0), !r)), r;
	}
	get isBlock() {
		return this.type.isBlock;
	}
	get isTextblock() {
		return this.type.isTextblock;
	}
	get inlineContent() {
		return this.type.inlineContent;
	}
	get isInline() {
		return this.type.isInline;
	}
	get isText() {
		return this.type.isText;
	}
	get isLeaf() {
		return this.type.isLeaf;
	}
	get isAtom() {
		return this.type.isAtom;
	}
	toString() {
		if (this.type.spec.toDebugString) return this.type.spec.toDebugString(this);
		let e = this.type.name;
		return this.content.size && (e += "(" + this.content.toStringInner() + ")"), mo(this.marks, e);
	}
	contentMatchAt(e) {
		let t = this.type.contentMatch.matchFragment(this.content, 0, e);
		if (!t) throw Error("Called contentMatchAt on a node with invalid content");
		return t;
	}
	canReplace(e, t, n = I.empty, r = 0, i = n.childCount) {
		let a = this.contentMatchAt(e).matchFragment(n, r, i), o = a && a.matchFragment(this.content, t);
		if (!o || !o.validEnd) return !1;
		for (let e = r; e < i; e++) if (!this.type.allowsMarks(n.child(e).marks)) return !1;
		return !0;
	}
	canReplaceWith(e, t, n, r) {
		if (r && !this.type.allowsMarks(r)) return !1;
		let i = this.contentMatchAt(e).matchType(n), a = i && i.matchFragment(this.content, t);
		return a ? a.validEnd : !1;
	}
	canAppend(e) {
		return e.content.size ? this.canReplace(this.childCount, this.childCount, e.content) : this.type.compatibleContent(e.type);
	}
	check() {
		this.type.checkContent(this.content), this.type.checkAttrs(this.attrs);
		let e = L.none;
		for (let t = 0; t < this.marks.length; t++) {
			let n = this.marks[t];
			n.type.checkAttrs(n.attrs), e = n.addToSet(e);
		}
		if (!L.sameSet(e, this.marks)) throw RangeError(`Invalid collection of marks for node ${this.type.name}: ${this.marks.map((e) => e.type.name)}`);
		this.content.forEach((e) => e.check());
	}
	toJSON() {
		let e = { type: this.type.name };
		for (let t in this.attrs) {
			e.attrs = this.attrs;
			break;
		}
		return this.content.size && (e.content = this.content.toJSON()), this.marks.length && (e.marks = this.marks.map((e) => e.toJSON())), e;
	}
	static fromJSON(e, t) {
		if (!t) throw RangeError("Invalid input for Node.fromJSON");
		let n;
		if (t.marks) {
			if (!Array.isArray(t.marks)) throw RangeError("Invalid mark data for Node.fromJSON");
			n = t.marks.map(e.markFromJSON);
		}
		if (t.type == "text") {
			if (typeof t.text != "string") throw RangeError("Invalid text node in JSON");
			return e.text(t.text, n);
		}
		let r = I.fromJSON(e, t.content), i = e.nodeType(t.type).create(t.attrs, r, n);
		return i.type.checkAttrs(i.attrs), i;
	}
};
fo.prototype.text = void 0;
var po = class e extends fo {
	constructor(e, t, n, r) {
		if (super(e, t, null, r), !n) throw RangeError("Empty text nodes are not allowed");
		this.text = n;
	}
	toString() {
		return this.type.spec.toDebugString ? this.type.spec.toDebugString(this) : mo(this.marks, JSON.stringify(this.text));
	}
	get textContent() {
		return this.text;
	}
	textBetween(e, t) {
		return this.text.slice(e, t);
	}
	get nodeSize() {
		return this.text.length;
	}
	mark(t) {
		return t == this.marks ? this : new e(this.type, this.attrs, this.text, t);
	}
	withText(t) {
		return t == this.text ? this : new e(this.type, this.attrs, t, this.marks);
	}
	cut(e = 0, t = this.text.length) {
		return e == 0 && t == this.text.length ? this : this.withText(this.text.slice(e, t));
	}
	eq(e) {
		return this.sameMarkup(e) && this.text == e.text;
	}
	toJSON() {
		let e = super.toJSON();
		return e.text = this.text, e;
	}
};
function mo(e, t) {
	for (let n = e.length - 1; n >= 0; n--) t = e[n].type.name + "(" + t + ")";
	return t;
}
var z = class e {
	constructor(e) {
		this.validEnd = e, this.next = [], this.wrapCache = [];
	}
	static parse(t, n) {
		let r = new ho(t, n);
		if (r.next == null) return e.empty;
		let i = go(r);
		r.next && r.err("Unexpected trailing text");
		let a = Eo(Co(i));
		return Do(a, r), a;
	}
	matchType(e) {
		for (let t = 0; t < this.next.length; t++) if (this.next[t].type == e) return this.next[t].next;
		return null;
	}
	matchFragment(e, t = 0, n = e.childCount) {
		let r = this;
		for (let i = t; r && i < n; i++) r = r.matchType(e.child(i).type);
		return r;
	}
	get inlineContent() {
		return this.next.length != 0 && this.next[0].type.isInline;
	}
	get defaultType() {
		for (let e = 0; e < this.next.length; e++) {
			let { type: t } = this.next[e];
			if (!(t.isText || t.hasRequiredAttrs())) return t;
		}
		return null;
	}
	compatible(e) {
		for (let t = 0; t < this.next.length; t++) for (let n = 0; n < e.next.length; n++) if (this.next[t].type == e.next[n].type) return !0;
		return !1;
	}
	fillBefore(e, t = !1, n = 0) {
		let r = [this];
		function i(a, o) {
			let s = a.matchFragment(e, n);
			if (s && (!t || s.validEnd)) return I.from(o.map((e) => e.createAndFill()));
			for (let e = 0; e < a.next.length; e++) {
				let { type: t, next: n } = a.next[e];
				if (!(t.isText || t.hasRequiredAttrs()) && r.indexOf(n) == -1) {
					r.push(n);
					let e = i(n, o.concat(t));
					if (e) return e;
				}
			}
			return null;
		}
		return i(this, []);
	}
	findWrapping(e) {
		for (let t = 0; t < this.wrapCache.length; t += 2) if (this.wrapCache[t] == e) return this.wrapCache[t + 1];
		let t = this.computeWrapping(e);
		return this.wrapCache.push(e, t), t;
	}
	computeWrapping(e) {
		let t = Object.create(null), n = [{
			match: this,
			type: null,
			via: null
		}];
		for (; n.length;) {
			let r = n.shift(), i = r.match;
			if (i.matchType(e)) {
				let e = [];
				for (let t = r; t.type; t = t.via) e.push(t.type);
				return e.reverse();
			}
			for (let e = 0; e < i.next.length; e++) {
				let { type: a, next: o } = i.next[e];
				!a.isLeaf && !a.hasRequiredAttrs() && !(a.name in t) && (!r.type || o.validEnd) && (n.push({
					match: a.contentMatch,
					type: a,
					via: r
				}), t[a.name] = !0);
			}
		}
		return null;
	}
	get edgeCount() {
		return this.next.length;
	}
	edge(e) {
		if (e >= this.next.length) throw RangeError(`There's no ${e}th edge in this content match`);
		return this.next[e];
	}
	toString() {
		let e = [];
		function t(n) {
			e.push(n);
			for (let r = 0; r < n.next.length; r++) e.indexOf(n.next[r].next) == -1 && t(n.next[r].next);
		}
		return t(this), e.map((t, n) => {
			let r = n + (t.validEnd ? "*" : " ") + " ";
			for (let n = 0; n < t.next.length; n++) r += (n ? ", " : "") + t.next[n].type.name + "->" + e.indexOf(t.next[n].next);
			return r;
		}).join("\n");
	}
};
z.empty = new z(!0);
var ho = class {
	constructor(e, t) {
		this.string = e, this.nodeTypes = t, this.inline = null, this.pos = 0, this.tokens = e.split(/\s*(?=\b|\W|$)/), this.tokens[this.tokens.length - 1] == "" && this.tokens.pop(), this.tokens[0] == "" && this.tokens.shift();
	}
	get next() {
		return this.tokens[this.pos];
	}
	eat(e) {
		return this.next == e && (this.pos++ || !0);
	}
	err(e) {
		throw SyntaxError(e + " (in content expression '" + this.string + "')");
	}
};
function go(e) {
	let t = [];
	do
		t.push(_o(e));
	while (e.eat("|"));
	return t.length == 1 ? t[0] : {
		type: "choice",
		exprs: t
	};
}
function _o(e) {
	let t = [];
	do
		t.push(vo(e));
	while (e.next && e.next != ")" && e.next != "|");
	return t.length == 1 ? t[0] : {
		type: "seq",
		exprs: t
	};
}
function vo(e) {
	let t = So(e);
	for (;;) if (e.eat("+")) t = {
		type: "plus",
		expr: t
	};
	else if (e.eat("*")) t = {
		type: "star",
		expr: t
	};
	else if (e.eat("?")) t = {
		type: "opt",
		expr: t
	};
	else if (e.eat("{")) t = bo(e, t);
	else break;
	return t;
}
function yo(e) {
	/\D/.test(e.next) && e.err("Expected number, got '" + e.next + "'");
	let t = Number(e.next);
	return e.pos++, t;
}
function bo(e, t) {
	let n = yo(e), r = n;
	return e.eat(",") && (r = e.next == "}" ? -1 : yo(e)), e.eat("}") || e.err("Unclosed braced range"), {
		type: "range",
		min: n,
		max: r,
		expr: t
	};
}
function xo(e, t) {
	let n = e.nodeTypes, r = n[t];
	if (r) return [r];
	let i = [];
	for (let e in n) {
		let r = n[e];
		r.isInGroup(t) && i.push(r);
	}
	return i.length == 0 && e.err("No node type or group '" + t + "' found"), i;
}
function So(e) {
	if (e.eat("(")) {
		let t = go(e);
		return e.eat(")") || e.err("Missing closing paren"), t;
	} else if (/\W/.test(e.next)) e.err("Unexpected token '" + e.next + "'");
	else {
		let t = xo(e, e.next).map((t) => (e.inline == null ? e.inline = t.isInline : e.inline != t.isInline && e.err("Mixing inline and block content"), {
			type: "name",
			value: t
		}));
		return e.pos++, t.length == 1 ? t[0] : {
			type: "choice",
			exprs: t
		};
	}
}
function Co(e) {
	let t = [[]];
	return i(a(e, 0), n()), t;
	function n() {
		return t.push([]) - 1;
	}
	function r(e, n, r) {
		let i = {
			term: r,
			to: n
		};
		return t[e].push(i), i;
	}
	function i(e, t) {
		e.forEach((e) => e.to = t);
	}
	function a(e, t) {
		if (e.type == "choice") return e.exprs.reduce((e, n) => e.concat(a(n, t)), []);
		if (e.type == "seq") for (let r = 0;; r++) {
			let o = a(e.exprs[r], t);
			if (r == e.exprs.length - 1) return o;
			i(o, t = n());
		}
		else if (e.type == "star") {
			let o = n();
			return r(t, o), i(a(e.expr, o), o), [r(o)];
		} else if (e.type == "plus") {
			let o = n();
			return i(a(e.expr, t), o), i(a(e.expr, o), o), [r(o)];
		} else if (e.type == "opt") return [r(t)].concat(a(e.expr, t));
		else if (e.type == "range") {
			let o = t;
			for (let t = 0; t < e.min; t++) {
				let t = n();
				i(a(e.expr, o), t), o = t;
			}
			if (e.max == -1) i(a(e.expr, o), o);
			else for (let t = e.min; t < e.max; t++) {
				let t = n();
				r(o, t), i(a(e.expr, o), t), o = t;
			}
			return [r(o)];
		} else if (e.type == "name") return [r(t, void 0, e.value)];
		else throw Error("Unknown expr type");
	}
}
function wo(e, t) {
	return t - e;
}
function To(e, t) {
	let n = [];
	return r(t), n.sort(wo);
	function r(t) {
		let i = e[t];
		if (i.length == 1 && !i[0].term) return r(i[0].to);
		n.push(t);
		for (let e = 0; e < i.length; e++) {
			let { term: t, to: a } = i[e];
			!t && n.indexOf(a) == -1 && r(a);
		}
	}
}
function Eo(e) {
	let t = Object.create(null);
	return n(To(e, 0));
	function n(r) {
		let i = [];
		r.forEach((t) => {
			e[t].forEach(({ term: t, to: n }) => {
				if (!t) return;
				let r;
				for (let e = 0; e < i.length; e++) i[e][0] == t && (r = i[e][1]);
				To(e, n).forEach((e) => {
					r || i.push([t, r = []]), r.indexOf(e) == -1 && r.push(e);
				});
			});
		});
		let a = t[r.join(",")] = new z(r.indexOf(e.length - 1) > -1);
		for (let e = 0; e < i.length; e++) {
			let r = i[e][1].sort(wo);
			a.next.push({
				type: i[e][0],
				next: t[r.join(",")] || n(r)
			});
		}
		return a;
	}
}
function Do(e, t) {
	for (let n = 0, r = [e]; n < r.length; n++) {
		let e = r[n], i = !e.validEnd, a = [];
		for (let t = 0; t < e.next.length; t++) {
			let { type: n, next: o } = e.next[t];
			a.push(n.name), i && !(n.isText || n.hasRequiredAttrs()) && (i = !1), r.indexOf(o) == -1 && r.push(o);
		}
		i && t.err("Only non-generatable nodes (" + a.join(", ") + ") in a required position (see https://prosemirror.net/docs/guide/#generatable)");
	}
}
function Oo(e) {
	let t = Object.create(null);
	for (let n in e) {
		let r = e[n];
		if (!r.hasDefault) return null;
		t[n] = r.default;
	}
	return t;
}
function ko(e, t) {
	let n = Object.create(null);
	for (let r in e) {
		let i = t && t[r];
		if (i === void 0) {
			let t = e[r];
			if (t.hasDefault) i = t.default;
			else throw RangeError("No value supplied for attribute " + r);
		}
		n[r] = i;
	}
	return n;
}
function Ao(e, t, n, r) {
	for (let r in t) if (!(r in e)) throw RangeError(`Unsupported attribute ${r} for ${n} of type ${r}`);
	for (let n in e) {
		let r = e[n];
		r.validate && r.validate(t[n]);
	}
}
function jo(e, t) {
	let n = Object.create(null);
	if (t) for (let r in t) n[r] = new Po(e, r, t[r]);
	return n;
}
var Mo = class e {
	constructor(e, t, n) {
		this.name = e, this.schema = t, this.spec = n, this.markSet = null, this.groups = n.group ? n.group.split(" ") : [], this.attrs = jo(e, n.attrs), this.defaultAttrs = Oo(this.attrs), this.contentMatch = null, this.inlineContent = null, this.isBlock = !(n.inline || e == "text"), this.isText = e == "text";
	}
	get isInline() {
		return !this.isBlock;
	}
	get isTextblock() {
		return this.isBlock && this.inlineContent;
	}
	get isLeaf() {
		return this.contentMatch == z.empty;
	}
	get isAtom() {
		return this.isLeaf || !!this.spec.atom;
	}
	isInGroup(e) {
		return this.groups.indexOf(e) > -1;
	}
	get whitespace() {
		return this.spec.whitespace || (this.spec.code ? "pre" : "normal");
	}
	hasRequiredAttrs() {
		for (let e in this.attrs) if (this.attrs[e].isRequired) return !0;
		return !1;
	}
	compatibleContent(e) {
		return this == e || this.contentMatch.compatible(e.contentMatch);
	}
	computeAttrs(e) {
		return !e && this.defaultAttrs ? this.defaultAttrs : ko(this.attrs, e);
	}
	create(e = null, t, n) {
		if (this.isText) throw Error("NodeType.create can't construct text nodes");
		return new fo(this, this.computeAttrs(e), I.from(t), L.setFrom(n));
	}
	createChecked(e = null, t, n) {
		return t = I.from(t), this.checkContent(t), new fo(this, this.computeAttrs(e), t, L.setFrom(n));
	}
	createAndFill(e = null, t, n) {
		if (e = this.computeAttrs(e), t = I.from(t), t.size) {
			let e = this.contentMatch.fillBefore(t);
			if (!e) return null;
			t = e.append(t);
		}
		let r = this.contentMatch.matchFragment(t), i = r && r.fillBefore(I.empty, !0);
		return i ? new fo(this, e, t.append(i), L.setFrom(n)) : null;
	}
	validContent(e) {
		let t = this.contentMatch.matchFragment(e);
		if (!t || !t.validEnd) return !1;
		for (let t = 0; t < e.childCount; t++) if (!this.allowsMarks(e.child(t).marks)) return !1;
		return !0;
	}
	checkContent(e) {
		if (!this.validContent(e)) throw RangeError(`Invalid content for node ${this.name}: ${e.toString().slice(0, 50)}`);
	}
	checkAttrs(e) {
		Ao(this.attrs, e, "node", this.name);
	}
	allowsMarkType(e) {
		return this.markSet == null || this.markSet.indexOf(e) > -1;
	}
	allowsMarks(e) {
		if (this.markSet == null) return !0;
		for (let t = 0; t < e.length; t++) if (!this.allowsMarkType(e[t].type)) return !1;
		return !0;
	}
	allowedMarks(e) {
		if (this.markSet == null) return e;
		let t;
		for (let n = 0; n < e.length; n++) this.allowsMarkType(e[n].type) ? t && t.push(e[n]) : t || (t = e.slice(0, n));
		return t ? t.length ? t : L.none : e;
	}
	static compile(t, n) {
		let r = Object.create(null);
		t.forEach((t, i) => r[t] = new e(t, n, i));
		let i = n.spec.topNode || "doc";
		if (!r[i]) throw RangeError("Schema is missing its top node type ('" + i + "')");
		if (!r.text) throw RangeError("Every schema needs a 'text' type");
		for (let e in r.text.attrs) throw RangeError("The text node type should not have attributes");
		return r;
	}
};
function No(e, t, n) {
	let r = n.split("|");
	return (n) => {
		let i = n === null ? "null" : typeof n;
		if (r.indexOf(i) < 0) throw RangeError(`Expected value of type ${r} for attribute ${t} on type ${e}, got ${i}`);
	};
}
var Po = class {
	constructor(e, t, n) {
		this.hasDefault = Object.prototype.hasOwnProperty.call(n, "default"), this.default = n.default, this.validate = typeof n.validate == "string" ? No(e, t, n.validate) : n.validate;
	}
	get isRequired() {
		return !this.hasDefault;
	}
}, Fo = class e {
	constructor(e, t, n, r) {
		this.name = e, this.rank = t, this.schema = n, this.spec = r, this.attrs = jo(e, r.attrs), this.excluded = null;
		let i = Oo(this.attrs);
		this.instance = i ? new L(this, i) : null;
	}
	create(e = null) {
		return !e && this.instance ? this.instance : new L(this, ko(this.attrs, e));
	}
	static compile(t, n) {
		let r = Object.create(null), i = 0;
		return t.forEach((t, a) => r[t] = new e(t, i++, n, a)), r;
	}
	removeFromSet(e) {
		for (var t = 0; t < e.length; t++) e[t].type == this && (e = e.slice(0, t).concat(e.slice(t + 1)), t--);
		return e;
	}
	isInSet(e) {
		for (let t = 0; t < e.length; t++) if (e[t].type == this) return e[t];
	}
	checkAttrs(e) {
		Ao(this.attrs, e, "mark", this.name);
	}
	excludes(e) {
		return this.excluded.indexOf(e) > -1;
	}
}, Io = class {
	constructor(e) {
		this.linebreakReplacement = null, this.cached = Object.create(null);
		let t = this.spec = {};
		for (let n in e) t[n] = e[n];
		t.nodes = Ba.from(e.nodes), t.marks = Ba.from(e.marks || {}), this.nodes = Mo.compile(this.spec.nodes, this), this.marks = Fo.compile(this.spec.marks, this);
		let n = Object.create(null);
		for (let e in this.nodes) {
			if (e in this.marks) throw RangeError(e + " can not be both a node and a mark");
			let t = this.nodes[e], r = t.spec.content || "", i = t.spec.marks;
			if (t.contentMatch = n[r] || (n[r] = z.parse(r, this.nodes)), t.inlineContent = t.contentMatch.inlineContent, t.spec.linebreakReplacement) {
				if (this.linebreakReplacement) throw RangeError("Multiple linebreak nodes defined");
				if (!t.isInline || !t.isLeaf) throw RangeError("Linebreak replacement nodes must be inline leaf nodes");
				this.linebreakReplacement = t;
			}
			t.markSet = i == "_" ? null : i ? Lo(this, i.split(" ")) : i == "" || !t.inlineContent ? [] : null;
		}
		for (let e in this.marks) {
			let t = this.marks[e], n = t.spec.excludes;
			t.excluded = n == null ? [t] : n == "" ? [] : Lo(this, n.split(" "));
		}
		this.nodeFromJSON = (e) => fo.fromJSON(this, e), this.markFromJSON = (e) => L.fromJSON(this, e), this.topNodeType = this.nodes[this.spec.topNode || "doc"], this.cached.wrappings = Object.create(null);
	}
	node(e, t = null, n, r) {
		if (typeof e == "string") e = this.nodeType(e);
		else if (!(e instanceof Mo)) throw RangeError("Invalid node type: " + e);
		else if (e.schema != this) throw RangeError("Node type from different schema used (" + e.name + ")");
		return e.createChecked(t, n, r);
	}
	text(e, t) {
		let n = this.nodes.text;
		return new po(n, n.defaultAttrs, e, L.setFrom(t));
	}
	mark(e, t) {
		return typeof e == "string" && (e = this.marks[e]), e.create(t);
	}
	nodeType(e) {
		let t = this.nodes[e];
		if (!t) throw RangeError("Unknown node type: " + e);
		return t;
	}
};
function Lo(e, t) {
	let n = [];
	for (let r = 0; r < t.length; r++) {
		let i = t[r], a = e.marks[i], o = a;
		if (a) n.push(a);
		else for (let t in e.marks) {
			let r = e.marks[t];
			(i == "_" || r.spec.group && r.spec.group.split(" ").indexOf(i) > -1) && n.push(o = r);
		}
		if (!o) throw SyntaxError("Unknown mark type: '" + t[r] + "'");
	}
	return n;
}
function Ro(e) {
	return e.tag != null;
}
function zo(e) {
	return e.style != null;
}
var Bo = class e {
	constructor(e, t) {
		this.schema = e, this.rules = t, this.tags = [], this.styles = [];
		let n = this.matchedStyles = [];
		t.forEach((e) => {
			if (Ro(e)) this.tags.push(e);
			else if (zo(e)) {
				let t = /[^=]*/.exec(e.style)[0];
				n.indexOf(t) < 0 && n.push(t), this.styles.push(e);
			}
		}), this.normalizeLists = !this.tags.some((t) => {
			if (!/^(ul|ol)\b/.test(t.tag) || !t.node) return !1;
			let n = e.nodes[t.node];
			return n.contentMatch.matchType(n);
		});
	}
	parse(e, t = {}) {
		let n = new Yo(this, t, !1);
		return n.addAll(e, L.none, t.from, t.to), n.finish();
	}
	parseSlice(e, t = {}) {
		let n = new Yo(this, t, !0);
		return n.addAll(e, L.none, t.from, t.to), R.maxOpen(n.finish());
	}
	matchTag(e, t, n) {
		for (let r = n ? this.tags.indexOf(n) + 1 : 0; r < this.tags.length; r++) {
			let n = this.tags[r];
			if (Zo(e, n.tag) && (n.namespace === void 0 || e.namespaceURI == n.namespace) && (!n.context || t.matchesContext(n.context))) {
				if (n.getAttrs) {
					let t = n.getAttrs(e);
					if (t === !1) continue;
					n.attrs = t || void 0;
				}
				return n;
			}
		}
	}
	matchStyle(e, t, n, r) {
		for (let i = r ? this.styles.indexOf(r) + 1 : 0; i < this.styles.length; i++) {
			let r = this.styles[i], a = r.style;
			if (!(a.indexOf(e) != 0 || r.context && !n.matchesContext(r.context) || a.length > e.length && (a.charCodeAt(e.length) != 61 || a.slice(e.length + 1) != t))) {
				if (r.getAttrs) {
					let e = r.getAttrs(t);
					if (e === !1) continue;
					r.attrs = e || void 0;
				}
				return r;
			}
		}
	}
	static schemaRules(e) {
		let t = [];
		function n(e) {
			let n = e.priority == null ? 50 : e.priority, r = 0;
			for (; r < t.length; r++) {
				let e = t[r];
				if ((e.priority == null ? 50 : e.priority) < n) break;
			}
			t.splice(r, 0, e);
		}
		for (let t in e.marks) {
			let r = e.marks[t].spec.parseDOM;
			r && r.forEach((e) => {
				n(e = Qo(e)), e.mark || e.ignore || e.clearMark || (e.mark = t);
			});
		}
		for (let t in e.nodes) {
			let r = e.nodes[t].spec.parseDOM;
			r && r.forEach((e) => {
				n(e = Qo(e)), e.node || e.ignore || e.mark || (e.node = t);
			});
		}
		return t;
	}
	static fromSchema(t) {
		return t.cached.domParser || (t.cached.domParser = new e(t, e.schemaRules(t)));
	}
}, Vo = {
	address: !0,
	article: !0,
	aside: !0,
	blockquote: !0,
	canvas: !0,
	dd: !0,
	div: !0,
	dl: !0,
	fieldset: !0,
	figcaption: !0,
	figure: !0,
	footer: !0,
	form: !0,
	h1: !0,
	h2: !0,
	h3: !0,
	h4: !0,
	h5: !0,
	h6: !0,
	header: !0,
	hgroup: !0,
	hr: !0,
	li: !0,
	noscript: !0,
	ol: !0,
	output: !0,
	p: !0,
	pre: !0,
	section: !0,
	table: !0,
	tfoot: !0,
	ul: !0
}, Ho = {
	head: !0,
	noscript: !0,
	object: !0,
	script: !0,
	style: !0,
	title: !0
}, Uo = {
	ol: !0,
	ul: !0
}, Wo = 1, Go = 2, Ko = 4;
function qo(e, t, n) {
	return t == null ? e && e.whitespace == "pre" ? Wo | Go : n & ~Ko : (t ? Wo : 0) | (t === "full" ? Go : 0);
}
var Jo = class {
	constructor(e, t, n, r, i, a) {
		this.type = e, this.attrs = t, this.marks = n, this.solid = r, this.options = a, this.content = [], this.activeMarks = L.none, this.match = i || (a & Ko ? null : e.contentMatch);
	}
	findWrapping(e) {
		if (!this.match) {
			if (!this.type) return [];
			let t = this.type.contentMatch.fillBefore(I.from(e));
			if (t) this.match = this.type.contentMatch.matchFragment(t);
			else {
				let t = this.type.contentMatch, n;
				return (n = t.findWrapping(e.type)) ? (this.match = t, n) : null;
			}
		}
		return this.match.findWrapping(e.type);
	}
	finish(e) {
		if (!(this.options & Wo)) {
			let e = this.content[this.content.length - 1], t;
			if (e && e.isText && (t = /[ \t\r\n\u000c]+$/.exec(e.text))) {
				let n = e;
				e.text.length == t[0].length ? this.content.pop() : this.content[this.content.length - 1] = n.withText(n.text.slice(0, n.text.length - t[0].length));
			}
		}
		let t = I.from(this.content);
		return !e && this.match && (t = t.append(this.match.fillBefore(I.empty, !0))), this.type ? this.type.create(this.attrs, t, this.marks) : t;
	}
	inlineContext(e) {
		return this.type ? this.type.inlineContent : this.content.length ? this.content[0].isInline : e.parentNode && !Vo.hasOwnProperty(e.parentNode.nodeName.toLowerCase());
	}
}, Yo = class {
	constructor(e, t, n) {
		this.parser = e, this.options = t, this.isOpen = n, this.open = 0, this.localPreserveWS = !1;
		let r = t.topNode, i, a = qo(null, t.preserveWhitespace, 0) | (n ? Ko : 0);
		i = r ? new Jo(r.type, r.attrs, L.none, !0, t.topMatch || r.type.contentMatch, a) : n ? new Jo(null, null, L.none, !0, null, a) : new Jo(e.schema.topNodeType, null, L.none, !0, null, a), this.nodes = [i], this.find = t.findPositions, this.needsBlock = !1;
	}
	get top() {
		return this.nodes[this.open];
	}
	addDOM(e, t) {
		e.nodeType == 3 ? this.addTextNode(e, t) : e.nodeType == 1 && this.addElement(e, t);
	}
	addTextNode(e, t) {
		let n = e.nodeValue, r = this.top, i = r.options & Go ? "full" : this.localPreserveWS || (r.options & Wo) > 0, { schema: a } = this.parser;
		if (i === "full" || r.inlineContext(e) || /[^ \t\r\n\u000c]/.test(n)) {
			if (!i) {
				if (n = n.replace(/[ \t\r\n\u000c]+/g, " "), /^[ \t\r\n\u000c]/.test(n) && this.open == this.nodes.length - 1) {
					let t = r.content[r.content.length - 1], i = e.previousSibling;
					(!t || i && i.nodeName == "BR" || t.isText && /[ \t\r\n\u000c]$/.test(t.text)) && (n = n.slice(1));
				}
			} else if (i === "full") n = n.replace(/\r\n?/g, "\n");
			else if (a.linebreakReplacement && /[\r\n]/.test(n) && this.top.findWrapping(a.linebreakReplacement.create())) {
				let e = n.split(/\r?\n|\r/);
				for (let n = 0; n < e.length; n++) n && this.insertNode(a.linebreakReplacement.create(), t, !0), e[n] && this.insertNode(a.text(e[n]), t, !/\S/.test(e[n]));
				n = "";
			} else n = n.replace(/\r?\n|\r/g, " ");
			n && this.insertNode(a.text(n), t, !/\S/.test(n)), this.findInText(e);
		} else this.findInside(e);
	}
	addElement(e, t, n) {
		let r = this.localPreserveWS, i = this.top;
		(e.tagName == "PRE" || /pre/.test(e.style && e.style.whiteSpace)) && (this.localPreserveWS = !0);
		let a = e.nodeName.toLowerCase(), o;
		Uo.hasOwnProperty(a) && this.parser.normalizeLists && Xo(e);
		let s = this.options.ruleFromNode && this.options.ruleFromNode(e) || (o = this.parser.matchTag(e, this, n));
		out: if (s ? s.ignore : Ho.hasOwnProperty(a)) this.findInside(e), this.ignoreFallback(e, t);
		else if (!s || s.skip || s.closeParent) {
			s && s.closeParent ? this.open = Math.max(0, this.open - 1) : s && s.skip.nodeType && (e = s.skip);
			let n, r = this.needsBlock;
			if (Vo.hasOwnProperty(a)) i.content.length && i.content[0].isInline && this.open && (this.open--, i = this.top), n = !0, i.type || (this.needsBlock = !0);
			else if (!e.firstChild) {
				this.leafFallback(e, t);
				break out;
			}
			let o = s && s.skip ? t : this.readStyles(e, t);
			o && this.addAll(e, o), n && this.sync(i), this.needsBlock = r;
		} else {
			let n = this.readStyles(e, t);
			n && this.addElementByRule(e, s, n, s.consuming === !1 ? o : void 0);
		}
		this.localPreserveWS = r;
	}
	leafFallback(e, t) {
		e.nodeName == "BR" && this.top.type && this.top.type.inlineContent && this.addTextNode(e.ownerDocument.createTextNode("\n"), t);
	}
	ignoreFallback(e, t) {
		e.nodeName == "BR" && (!this.top.type || !this.top.type.inlineContent) && this.findPlace(this.parser.schema.text("-"), t, !0);
	}
	readStyles(e, t) {
		let n = e.style;
		if (n && n.length) for (let e = 0; e < this.parser.matchedStyles.length; e++) {
			let r = this.parser.matchedStyles[e], i = n.getPropertyValue(r);
			if (i) for (let e;;) {
				let n = this.parser.matchStyle(r, i, this, e);
				if (!n) break;
				if (n.ignore) return null;
				if (t = n.clearMark ? t.filter((e) => !n.clearMark(e)) : t.concat(this.parser.schema.marks[n.mark].create(n.attrs)), n.consuming === !1) e = n;
				else break;
			}
		}
		return t;
	}
	addElementByRule(e, t, n, r) {
		let i, a;
		if (t.node) if (a = this.parser.schema.nodes[t.node], a.isLeaf) this.insertNode(a.create(t.attrs), n, e.nodeName == "BR") || this.leafFallback(e, n);
		else {
			let e = this.enter(a, t.attrs || null, n, t.preserveWhitespace);
			e && (i = !0, n = e);
		}
		else {
			let e = this.parser.schema.marks[t.mark];
			n = n.concat(e.create(t.attrs));
		}
		let o = this.top;
		if (a && a.isLeaf) this.findInside(e);
		else if (r) this.addElement(e, n, r);
		else if (t.getContent) this.findInside(e), t.getContent(e, this.parser.schema).forEach((e) => this.insertNode(e, n, !1));
		else {
			let r = e;
			typeof t.contentElement == "string" ? r = e.querySelector(t.contentElement) : typeof t.contentElement == "function" ? r = t.contentElement(e) : t.contentElement && (r = t.contentElement), this.findAround(e, r, !0), this.addAll(r, n), this.findAround(e, r, !1);
		}
		i && this.sync(o) && this.open--;
	}
	addAll(e, t, n, r) {
		let i = n || 0;
		for (let a = n ? e.childNodes[n] : e.firstChild, o = r == null ? null : e.childNodes[r]; a != o; a = a.nextSibling, ++i) this.findAtPoint(e, i), this.addDOM(a, t);
		this.findAtPoint(e, i);
	}
	findPlace(e, t, n) {
		let r, i;
		for (let t = this.open, a = 0; t >= 0; t--) {
			let o = this.nodes[t], s = o.findWrapping(e);
			if (s && (!r || r.length > s.length + a) && (r = s, i = o, !s.length)) break;
			if (o.solid) {
				if (n) break;
				a += 2;
			}
		}
		if (!r) return null;
		this.sync(i);
		for (let e = 0; e < r.length; e++) t = this.enterInner(r[e], null, t, !1);
		return t;
	}
	insertNode(e, t, n) {
		if (e.isInline && this.needsBlock && !this.top.type) {
			let e = this.textblockFromContext();
			e && (t = this.enterInner(e, null, t));
		}
		let r = this.findPlace(e, t, n);
		if (r) {
			this.closeExtra();
			let t = this.top;
			t.match && (t.match = t.match.matchType(e.type));
			let n = L.none;
			for (let i of r.concat(e.marks)) (t.type ? t.type.allowsMarkType(i.type) : $o(i.type, e.type)) && (n = i.addToSet(n));
			return t.content.push(e.mark(n)), !0;
		}
		return !1;
	}
	enter(e, t, n, r) {
		let i = this.findPlace(e.create(t), n, !1);
		return i && (i = this.enterInner(e, t, n, !0, r)), i;
	}
	enterInner(e, t, n, r = !1, i) {
		this.closeExtra();
		let a = this.top;
		a.match = a.match && a.match.matchType(e);
		let o = qo(e, i, a.options);
		a.options & Ko && a.content.length == 0 && (o |= Ko);
		let s = L.none;
		return n = n.filter((t) => (a.type ? a.type.allowsMarkType(t.type) : $o(t.type, e)) ? (s = t.addToSet(s), !1) : !0), this.nodes.push(new Jo(e, t, s, r, null, o)), this.open++, n;
	}
	closeExtra(e = !1) {
		let t = this.nodes.length - 1;
		if (t > this.open) {
			for (; t > this.open; t--) this.nodes[t - 1].content.push(this.nodes[t].finish(e));
			this.nodes.length = this.open + 1;
		}
	}
	finish() {
		return this.open = 0, this.closeExtra(this.isOpen), this.nodes[0].finish(!!(this.isOpen || this.options.topOpen));
	}
	sync(e) {
		for (let t = this.open; t >= 0; t--) if (this.nodes[t] == e) return this.open = t, !0;
		else this.localPreserveWS && (this.nodes[t].options |= Wo);
		return !1;
	}
	get currentPos() {
		this.closeExtra();
		let e = 0;
		for (let t = this.open; t >= 0; t--) {
			let n = this.nodes[t].content;
			for (let t = n.length - 1; t >= 0; t--) e += n[t].nodeSize;
			t && e++;
		}
		return e;
	}
	findAtPoint(e, t) {
		if (this.find) for (let n = 0; n < this.find.length; n++) this.find[n].node == e && this.find[n].offset == t && (this.find[n].pos = this.currentPos);
	}
	findInside(e) {
		if (this.find) for (let t = 0; t < this.find.length; t++) this.find[t].pos == null && e.nodeType == 1 && e.contains(this.find[t].node) && (this.find[t].pos = this.currentPos);
	}
	findAround(e, t, n) {
		if (e != t && this.find) for (let r = 0; r < this.find.length; r++) this.find[r].pos == null && e.nodeType == 1 && e.contains(this.find[r].node) && t.compareDocumentPosition(this.find[r].node) & (n ? 2 : 4) && (this.find[r].pos = this.currentPos);
	}
	findInText(e) {
		if (this.find) for (let t = 0; t < this.find.length; t++) this.find[t].node == e && (this.find[t].pos = this.currentPos - (e.nodeValue.length - this.find[t].offset));
	}
	matchesContext(e) {
		if (e.indexOf("|") > -1) return e.split(/\s*\|\s*/).some(this.matchesContext, this);
		let t = e.split("/"), n = this.options.context, r = !this.isOpen && (!n || n.parent.type == this.nodes[0].type), i = -(n ? n.depth + 1 : 0) + +!r, a = (e, o) => {
			for (; e >= 0; e--) {
				let s = t[e];
				if (s == "") {
					if (e == t.length - 1 || e == 0) continue;
					for (; o >= i; o--) if (a(e - 1, o)) return !0;
					return !1;
				} else {
					let e = o > 0 || o == 0 && r ? this.nodes[o].type : n && o >= i ? n.node(o - i).type : null;
					if (!e || e.name != s && !e.isInGroup(s)) return !1;
					o--;
				}
			}
			return !0;
		};
		return a(t.length - 1, this.open);
	}
	textblockFromContext() {
		let e = this.options.context;
		if (e) for (let t = e.depth; t >= 0; t--) {
			let n = e.node(t).contentMatchAt(e.indexAfter(t)).defaultType;
			if (n && n.isTextblock && n.defaultAttrs) return n;
		}
		for (let e in this.parser.schema.nodes) {
			let t = this.parser.schema.nodes[e];
			if (t.isTextblock && t.defaultAttrs) return t;
		}
	}
};
function Xo(e) {
	for (let t = e.firstChild, n = null; t; t = t.nextSibling) {
		let e = t.nodeType == 1 ? t.nodeName.toLowerCase() : null;
		e && Uo.hasOwnProperty(e) && n ? (n.appendChild(t), t = n) : e == "li" ? n = t : e && (n = null);
	}
}
function Zo(e, t) {
	return (e.matches || e.msMatchesSelector || e.webkitMatchesSelector || e.mozMatchesSelector).call(e, t);
}
function Qo(e) {
	let t = {};
	for (let n in e) t[n] = e[n];
	return t;
}
function $o(e, t) {
	let n = t.schema.nodes;
	for (let r in n) {
		let i = n[r];
		if (!i.allowsMarkType(e)) continue;
		let a = [], o = (e) => {
			a.push(e);
			for (let n = 0; n < e.edgeCount; n++) {
				let { type: r, next: i } = e.edge(n);
				if (r == t || a.indexOf(i) < 0 && o(i)) return !0;
			}
		};
		if (o(i.contentMatch)) return !0;
	}
}
var es = class e {
	constructor(e, t) {
		this.nodes = e, this.marks = t;
	}
	serializeFragment(e, t = {}, n) {
		n || (n = ns(t).createDocumentFragment());
		let r = n, i = [];
		return e.forEach((e) => {
			if (i.length || e.marks.length) {
				let n = 0, a = 0;
				for (; n < i.length && a < e.marks.length;) {
					let t = e.marks[a];
					if (!this.marks[t.type.name]) {
						a++;
						continue;
					}
					if (!t.eq(i[n][0]) || t.type.spec.spanning === !1) break;
					n++, a++;
				}
				for (; n < i.length;) r = i.pop()[1];
				for (; a < e.marks.length;) {
					let n = e.marks[a++], o = this.serializeMark(n, e.isInline, t);
					o && (i.push([n, r]), r.appendChild(o.dom), r = o.contentDOM || o.dom);
				}
			}
			r.appendChild(this.serializeNodeInner(e, t));
		}), n;
	}
	serializeNodeInner(e, t) {
		let { dom: n, contentDOM: r } = ss(ns(t), this.nodes[e.type.name](e), null, e.attrs);
		if (r) {
			if (e.isLeaf) throw RangeError("Content hole not allowed in a leaf node spec");
			this.serializeFragment(e.content, t, r);
		}
		return n;
	}
	serializeNode(e, t = {}) {
		let n = this.serializeNodeInner(e, t);
		for (let r = e.marks.length - 1; r >= 0; r--) {
			let i = this.serializeMark(e.marks[r], e.isInline, t);
			i && ((i.contentDOM || i.dom).appendChild(n), n = i.dom);
		}
		return n;
	}
	serializeMark(e, t, n = {}) {
		let r = this.marks[e.type.name];
		return r && ss(ns(n), r(e, t), null, e.attrs);
	}
	static renderSpec(e, t, n = null, r) {
		return ss(e, t, n, r);
	}
	static fromSchema(t) {
		return t.cached.domSerializer || (t.cached.domSerializer = new e(this.nodesFromSchema(t), this.marksFromSchema(t)));
	}
	static nodesFromSchema(e) {
		let t = ts(e.nodes);
		return t.text || (t.text = (e) => e.text), t;
	}
	static marksFromSchema(e) {
		return ts(e.marks);
	}
};
function ts(e) {
	let t = {};
	for (let n in e) {
		let r = e[n].spec.toDOM;
		r && (t[n] = r);
	}
	return t;
}
function ns(e) {
	return e.document || window.document;
}
var rs = /* @__PURE__ */ new WeakMap();
function is(e) {
	let t = rs.get(e);
	return t === void 0 && rs.set(e, t = as(e)), t;
}
function as(e) {
	let t = null;
	function n(e) {
		if (e && typeof e == "object") if (Array.isArray(e)) if (typeof e[0] == "string") t || (t = []), t.push(e);
		else for (let t = 0; t < e.length; t++) n(e[t]);
		else for (let t in e) n(e[t]);
	}
	return n(e), t;
}
function ss(e, t, n, r) {
	if (typeof t == "string") return { dom: e.createTextNode(t) };
	if (t.nodeType != null) return { dom: t };
	if (t.dom && t.dom.nodeType != null) return t;
	let i = t[0], a;
	if (typeof i != "string") throw RangeError("Invalid array passed to renderSpec");
	if (r && (a = is(r)) && a.indexOf(t) > -1) throw RangeError("Using an array from an attribute object as a DOM spec. This may be an attempted cross site scripting attack.");
	let o = i.indexOf(" ");
	o > 0 && (n = i.slice(0, o), i = i.slice(o + 1));
	let s, c = n ? e.createElementNS(n, i) : e.createElement(i), l = t[1], u = 1;
	if (l && typeof l == "object" && l.nodeType == null && !Array.isArray(l)) {
		u = 2;
		for (let e in l) if (l[e] != null) {
			let t = e.indexOf(" ");
			t > 0 ? c.setAttributeNS(e.slice(0, t), e.slice(t + 1), l[e]) : e == "style" && c.style ? c.style.cssText = l[e] : c.setAttribute(e, l[e]);
		}
	}
	for (let i = u; i < t.length; i++) {
		let a = t[i];
		if (a === 0) {
			if (i < t.length - 1 || i > u) throw RangeError("Content hole must be the only child of its parent node");
			return {
				dom: c,
				contentDOM: c
			};
		} else {
			let { dom: t, contentDOM: i } = ss(e, a, n, r);
			if (c.appendChild(t), i) {
				if (s) throw RangeError("Multiple content holes");
				s = i;
			}
		}
	}
	return {
		dom: c,
		contentDOM: s
	};
}
//#endregion
//#region node_modules/prosemirror-transform/dist/index.js
var cs = 65535, ls = 2 ** 16;
function us(e, t) {
	return e + t * ls;
}
function ds(e) {
	return e & cs;
}
function fs(e) {
	return (e - (e & cs)) / ls;
}
var ps = 1, ms = 2, hs = 4, gs = 8, _s = class {
	constructor(e, t, n) {
		this.pos = e, this.delInfo = t, this.recover = n;
	}
	get deleted() {
		return (this.delInfo & gs) > 0;
	}
	get deletedBefore() {
		return (this.delInfo & (ps | hs)) > 0;
	}
	get deletedAfter() {
		return (this.delInfo & (ms | hs)) > 0;
	}
	get deletedAcross() {
		return (this.delInfo & hs) > 0;
	}
}, vs = class e {
	constructor(t, n = !1) {
		if (this.ranges = t, this.inverted = n, !t.length && e.empty) return e.empty;
	}
	recover(e) {
		let t = 0, n = ds(e);
		if (!this.inverted) for (let e = 0; e < n; e++) t += this.ranges[e * 3 + 2] - this.ranges[e * 3 + 1];
		return this.ranges[n * 3] + t + fs(e);
	}
	mapResult(e, t = 1) {
		return this._map(e, t, !1);
	}
	map(e, t = 1) {
		return this._map(e, t, !0);
	}
	_map(e, t, n) {
		let r = 0, i = this.inverted ? 2 : 1, a = this.inverted ? 1 : 2;
		for (let o = 0; o < this.ranges.length; o += 3) {
			let s = this.ranges[o] - (this.inverted ? r : 0);
			if (s > e) break;
			let c = this.ranges[o + i], l = this.ranges[o + a], u = s + c;
			if (e <= u) {
				let i = c ? e == s ? -1 : e == u ? 1 : t : t, a = s + r + (i < 0 ? 0 : l);
				if (n) return a;
				let d = e == (t < 0 ? s : u) ? null : us(o / 3, e - s), f = e == s ? ms : e == u ? ps : hs;
				return (t < 0 ? e != s : e != u) && (f |= gs), new _s(a, f, d);
			}
			r += l - c;
		}
		return n ? e + r : new _s(e + r, 0, null);
	}
	touches(e, t) {
		let n = 0, r = ds(t), i = this.inverted ? 2 : 1, a = this.inverted ? 1 : 2;
		for (let t = 0; t < this.ranges.length; t += 3) {
			let o = this.ranges[t] - (this.inverted ? n : 0);
			if (o > e) break;
			let s = this.ranges[t + i];
			if (e <= o + s && t == r * 3) return !0;
			n += this.ranges[t + a] - s;
		}
		return !1;
	}
	forEach(e) {
		let t = this.inverted ? 2 : 1, n = this.inverted ? 1 : 2;
		for (let r = 0, i = 0; r < this.ranges.length; r += 3) {
			let a = this.ranges[r], o = a - (this.inverted ? i : 0), s = a + (this.inverted ? 0 : i), c = this.ranges[r + t], l = this.ranges[r + n];
			e(o, o + c, s, s + l), i += l - c;
		}
	}
	invert() {
		return new e(this.ranges, !this.inverted);
	}
	toString() {
		return (this.inverted ? "-" : "") + JSON.stringify(this.ranges);
	}
	static offset(t) {
		return t == 0 ? e.empty : new e(t < 0 ? [
			0,
			-t,
			0
		] : [
			0,
			0,
			t
		]);
	}
};
vs.empty = new vs([]);
var ys = class e {
	constructor(e, t, n = 0, r = e ? e.length : 0) {
		this.mirror = t, this.from = n, this.to = r, this._maps = e || [], this.ownData = !(e || t);
	}
	get maps() {
		return this._maps;
	}
	slice(t = 0, n = this.maps.length) {
		return new e(this._maps, this.mirror, t, n);
	}
	appendMap(e, t) {
		this.ownData || (this._maps = this._maps.slice(), this.mirror = this.mirror && this.mirror.slice(), this.ownData = !0), this.to = this._maps.push(e), t != null && this.setMirror(this._maps.length - 1, t);
	}
	appendMapping(e) {
		for (let t = 0, n = this._maps.length; t < e._maps.length; t++) {
			let r = e.getMirror(t);
			this.appendMap(e._maps[t], r != null && r < t ? n + r : void 0);
		}
	}
	getMirror(e) {
		if (this.mirror) {
			for (let t = 0; t < this.mirror.length; t++) if (this.mirror[t] == e) return this.mirror[t + (t % 2 ? -1 : 1)];
		}
	}
	setMirror(e, t) {
		this.mirror || (this.mirror = []), this.mirror.push(e, t);
	}
	appendMappingInverted(e) {
		for (let t = e.maps.length - 1, n = this._maps.length + e._maps.length; t >= 0; t--) {
			let r = e.getMirror(t);
			this.appendMap(e._maps[t].invert(), r != null && r > t ? n - r - 1 : void 0);
		}
	}
	invert() {
		let t = new e();
		return t.appendMappingInverted(this), t;
	}
	map(e, t = 1) {
		if (this.mirror) return this._map(e, t, !0);
		for (let n = this.from; n < this.to; n++) e = this._maps[n].map(e, t);
		return e;
	}
	mapResult(e, t = 1) {
		return this._map(e, t, !1);
	}
	_map(e, t, n) {
		let r = 0;
		for (let n = this.from; n < this.to; n++) {
			let i = this._maps[n].mapResult(e, t);
			if (i.recover != null) {
				let t = this.getMirror(n);
				if (t != null && t > n && t < this.to) {
					n = t, e = this._maps[t].recover(i.recover);
					continue;
				}
			}
			r |= i.delInfo, e = i.pos;
		}
		return n ? e : new _s(e, r, null);
	}
}, bs = Object.create(null), xs = class {
	getMap() {
		return vs.empty;
	}
	merge(e) {
		return null;
	}
	static fromJSON(e, t) {
		if (!t || !t.stepType) throw RangeError("Invalid input for Step.fromJSON");
		let n = bs[t.stepType];
		if (!n) throw RangeError(`No step type ${t.stepType} defined`);
		return n.fromJSON(e, t);
	}
	static jsonID(e, t) {
		if (e in bs) throw RangeError("Duplicate use of step JSON ID " + e);
		return bs[e] = t, t.prototype.jsonID = e, t;
	}
}, Ss = class e {
	constructor(e, t) {
		this.doc = e, this.failed = t;
	}
	static ok(t) {
		return new e(t, null);
	}
	static fail(t) {
		return new e(null, t);
	}
	static fromReplace(t, n, r, i) {
		try {
			return e.ok(t.replace(n, r, i));
		} catch (t) {
			if (t instanceof Ka) return e.fail(t.message);
			throw t;
		}
	}
};
function Cs(e, t, n) {
	let r = [];
	for (let i = 0; i < e.childCount; i++) {
		let a = e.child(i);
		a.content.size && (a = a.copy(Cs(a.content, t, a))), a.isInline && (a = t(a, n, i)), r.push(a);
	}
	return I.fromArray(r);
}
var ws = class e extends xs {
	constructor(e, t, n) {
		super(), this.from = e, this.to = t, this.mark = n;
	}
	apply(e) {
		let t = e.slice(this.from, this.to), n = e.resolve(this.from), r = n.node(n.sharedDepth(this.to)), i = new R(Cs(t.content, (e, t) => !e.isAtom || !t.type.allowsMarkType(this.mark.type) ? e : e.mark(this.mark.addToSet(e.marks)), r), t.openStart, t.openEnd);
		return Ss.fromReplace(e, this.from, this.to, i);
	}
	invert() {
		return new Ts(this.from, this.to, this.mark);
	}
	map(t) {
		let n = t.mapResult(this.from, 1), r = t.mapResult(this.to, -1);
		return n.deleted && r.deleted || n.pos >= r.pos ? null : new e(n.pos, r.pos, this.mark);
	}
	merge(t) {
		return t instanceof e && t.mark.eq(this.mark) && this.from <= t.to && this.to >= t.from ? new e(Math.min(this.from, t.from), Math.max(this.to, t.to), this.mark) : null;
	}
	toJSON() {
		return {
			stepType: "addMark",
			mark: this.mark.toJSON(),
			from: this.from,
			to: this.to
		};
	}
	static fromJSON(t, n) {
		if (typeof n.from != "number" || typeof n.to != "number") throw RangeError("Invalid input for AddMarkStep.fromJSON");
		return new e(n.from, n.to, t.markFromJSON(n.mark));
	}
};
xs.jsonID("addMark", ws);
var Ts = class e extends xs {
	constructor(e, t, n) {
		super(), this.from = e, this.to = t, this.mark = n;
	}
	apply(e) {
		let t = e.slice(this.from, this.to), n = new R(Cs(t.content, (e) => e.mark(this.mark.removeFromSet(e.marks)), e), t.openStart, t.openEnd);
		return Ss.fromReplace(e, this.from, this.to, n);
	}
	invert() {
		return new ws(this.from, this.to, this.mark);
	}
	map(t) {
		let n = t.mapResult(this.from, 1), r = t.mapResult(this.to, -1);
		return n.deleted && r.deleted || n.pos >= r.pos ? null : new e(n.pos, r.pos, this.mark);
	}
	merge(t) {
		return t instanceof e && t.mark.eq(this.mark) && this.from <= t.to && this.to >= t.from ? new e(Math.min(this.from, t.from), Math.max(this.to, t.to), this.mark) : null;
	}
	toJSON() {
		return {
			stepType: "removeMark",
			mark: this.mark.toJSON(),
			from: this.from,
			to: this.to
		};
	}
	static fromJSON(t, n) {
		if (typeof n.from != "number" || typeof n.to != "number") throw RangeError("Invalid input for RemoveMarkStep.fromJSON");
		return new e(n.from, n.to, t.markFromJSON(n.mark));
	}
};
xs.jsonID("removeMark", Ts);
var Es = class e extends xs {
	constructor(e, t) {
		super(), this.pos = e, this.mark = t;
	}
	apply(e) {
		let t = e.nodeAt(this.pos);
		if (!t) return Ss.fail("No node at mark step's position");
		let n = t.type.create(t.attrs, null, this.mark.addToSet(t.marks));
		return Ss.fromReplace(e, this.pos, this.pos + 1, new R(I.from(n), 0, +!t.isLeaf));
	}
	invert(t) {
		let n = t.nodeAt(this.pos);
		if (n) {
			let t = this.mark.addToSet(n.marks);
			if (t.length == n.marks.length) {
				for (let r = 0; r < n.marks.length; r++) if (!n.marks[r].isInSet(t)) return new e(this.pos, n.marks[r]);
				return new e(this.pos, this.mark);
			}
		}
		return new Ds(this.pos, this.mark);
	}
	map(t) {
		let n = t.mapResult(this.pos, 1);
		return n.deletedAfter ? null : new e(n.pos, this.mark);
	}
	toJSON() {
		return {
			stepType: "addNodeMark",
			pos: this.pos,
			mark: this.mark.toJSON()
		};
	}
	static fromJSON(t, n) {
		if (typeof n.pos != "number") throw RangeError("Invalid input for AddNodeMarkStep.fromJSON");
		return new e(n.pos, t.markFromJSON(n.mark));
	}
};
xs.jsonID("addNodeMark", Es);
var Ds = class e extends xs {
	constructor(e, t) {
		super(), this.pos = e, this.mark = t;
	}
	apply(e) {
		let t = e.nodeAt(this.pos);
		if (!t) return Ss.fail("No node at mark step's position");
		let n = t.type.create(t.attrs, null, this.mark.removeFromSet(t.marks));
		return Ss.fromReplace(e, this.pos, this.pos + 1, new R(I.from(n), 0, +!t.isLeaf));
	}
	invert(e) {
		let t = e.nodeAt(this.pos);
		return !t || !this.mark.isInSet(t.marks) ? this : new Es(this.pos, this.mark);
	}
	map(t) {
		let n = t.mapResult(this.pos, 1);
		return n.deletedAfter ? null : new e(n.pos, this.mark);
	}
	toJSON() {
		return {
			stepType: "removeNodeMark",
			pos: this.pos,
			mark: this.mark.toJSON()
		};
	}
	static fromJSON(t, n) {
		if (typeof n.pos != "number") throw RangeError("Invalid input for RemoveNodeMarkStep.fromJSON");
		return new e(n.pos, t.markFromJSON(n.mark));
	}
};
xs.jsonID("removeNodeMark", Ds);
var Os = class e extends xs {
	constructor(e, t, n, r = !1) {
		super(), this.from = e, this.to = t, this.slice = n, this.structure = r;
	}
	apply(e) {
		return this.structure && As(e, this.from, this.to) ? Ss.fail("Structure replace would overwrite content") : Ss.fromReplace(e, this.from, this.to, this.slice);
	}
	getMap() {
		return new vs([
			this.from,
			this.to - this.from,
			this.slice.size
		]);
	}
	invert(t) {
		return new e(this.from, this.from + this.slice.size, t.slice(this.from, this.to));
	}
	map(t) {
		let n = t.mapResult(this.to, -1), r = this.from == this.to && e.MAP_BIAS < 0 ? n : t.mapResult(this.from, 1);
		return r.deletedAcross && n.deletedAcross ? null : new e(r.pos, Math.max(r.pos, n.pos), this.slice, this.structure);
	}
	merge(t) {
		if (!(t instanceof e) || t.structure || this.structure) return null;
		if (this.from + this.slice.size == t.from && !this.slice.openEnd && !t.slice.openStart) {
			let n = this.slice.size + t.slice.size == 0 ? R.empty : new R(this.slice.content.append(t.slice.content), this.slice.openStart, t.slice.openEnd);
			return new e(this.from, this.to + (t.to - t.from), n, this.structure);
		} else if (t.to == this.from && !this.slice.openStart && !t.slice.openEnd) {
			let n = this.slice.size + t.slice.size == 0 ? R.empty : new R(t.slice.content.append(this.slice.content), t.slice.openStart, this.slice.openEnd);
			return new e(t.from, this.to, n, this.structure);
		} else return null;
	}
	toJSON() {
		let e = {
			stepType: "replace",
			from: this.from,
			to: this.to
		};
		return this.slice.size && (e.slice = this.slice.toJSON()), this.structure && (e.structure = !0), e;
	}
	static fromJSON(t, n) {
		if (typeof n.from != "number" || typeof n.to != "number") throw RangeError("Invalid input for ReplaceStep.fromJSON");
		return new e(n.from, n.to, R.fromJSON(t, n.slice), !!n.structure);
	}
};
Os.MAP_BIAS = 1, xs.jsonID("replace", Os);
var ks = class e extends xs {
	constructor(e, t, n, r, i, a, o = !1) {
		super(), this.from = e, this.to = t, this.gapFrom = n, this.gapTo = r, this.slice = i, this.insert = a, this.structure = o;
	}
	apply(e) {
		if (this.structure && (As(e, this.from, this.gapFrom) || As(e, this.gapTo, this.to))) return Ss.fail("Structure gap-replace would overwrite content");
		let t = e.slice(this.gapFrom, this.gapTo);
		if (t.openStart || t.openEnd) return Ss.fail("Gap is not a flat range");
		let n = this.slice.insertAt(this.insert, t.content);
		return n ? Ss.fromReplace(e, this.from, this.to, n) : Ss.fail("Content does not fit in gap");
	}
	getMap() {
		return new vs([
			this.from,
			this.gapFrom - this.from,
			this.insert,
			this.gapTo,
			this.to - this.gapTo,
			this.slice.size - this.insert
		]);
	}
	invert(t) {
		let n = this.gapTo - this.gapFrom;
		return new e(this.from, this.from + this.slice.size + n, this.from + this.insert, this.from + this.insert + n, t.slice(this.from, this.to).removeBetween(this.gapFrom - this.from, this.gapTo - this.from), this.gapFrom - this.from, this.structure);
	}
	map(t) {
		let n = t.mapResult(this.from, 1), r = t.mapResult(this.to, -1), i = this.from == this.gapFrom ? n.pos : t.map(this.gapFrom, -1), a = this.to == this.gapTo ? r.pos : t.map(this.gapTo, 1);
		return n.deletedAcross && r.deletedAcross || i < n.pos || a > r.pos ? null : new e(n.pos, r.pos, i, a, this.slice, this.insert, this.structure);
	}
	toJSON() {
		let e = {
			stepType: "replaceAround",
			from: this.from,
			to: this.to,
			gapFrom: this.gapFrom,
			gapTo: this.gapTo,
			insert: this.insert
		};
		return this.slice.size && (e.slice = this.slice.toJSON()), this.structure && (e.structure = !0), e;
	}
	static fromJSON(t, n) {
		if (typeof n.from != "number" || typeof n.to != "number" || typeof n.gapFrom != "number" || typeof n.gapTo != "number" || typeof n.insert != "number") throw RangeError("Invalid input for ReplaceAroundStep.fromJSON");
		return new e(n.from, n.to, n.gapFrom, n.gapTo, R.fromJSON(t, n.slice), n.insert, !!n.structure);
	}
};
xs.jsonID("replaceAround", ks);
function As(e, t, n) {
	let r = e.resolve(t), i = n - t, a = r.depth;
	for (; i > 0 && a > 0 && r.indexAfter(a) == r.node(a).childCount;) a--, i--;
	if (i > 0) {
		let e = r.node(a).maybeChild(r.indexAfter(a));
		for (; i > 0;) {
			if (!e || e.isLeaf) return !0;
			e = e.firstChild, i--;
		}
	}
	return !1;
}
function js(e, t, n, r) {
	let i = [], a = [], o, s;
	e.doc.nodesBetween(t, n, (e, c, l) => {
		if (!e.isInline) return;
		let u = e.marks;
		if (!r.isInSet(u) && l.type.allowsMarkType(r.type)) {
			let l = Math.max(c, t), d = Math.min(c + e.nodeSize, n), f = r.addToSet(u);
			for (let e = 0; e < u.length; e++) u[e].isInSet(f) || (o && o.to == l && o.mark.eq(u[e]) ? o.to = d : i.push(o = new Ts(l, d, u[e])));
			s && s.to == l ? s.to = d : a.push(s = new ws(l, d, r));
		}
	}), i.forEach((t) => e.step(t)), a.forEach((t) => e.step(t));
}
function Ms(e, t, n, r) {
	let i = [], a = 0;
	e.doc.nodesBetween(t, n, (e, o) => {
		if (!e.isInline) return;
		a++;
		let s = null;
		if (r instanceof Fo) {
			let t = e.marks, n;
			for (; n = r.isInSet(t);) (s || (s = [])).push(n), t = n.removeFromSet(t);
		} else r ? r.isInSet(e.marks) && (s = [r]) : s = e.marks;
		if (s && s.length) {
			let r = Math.min(o + e.nodeSize, n);
			for (let e = 0; e < s.length; e++) {
				let n = s[e], c;
				for (let e = 0; e < i.length; e++) {
					let t = i[e];
					t.step == a - 1 && n.eq(i[e].style) && (c = t);
				}
				c ? (c.to = r, c.step = a) : i.push({
					style: n,
					from: Math.max(o, t),
					to: r,
					step: a
				});
			}
		}
	}), i.forEach((t) => e.step(new Ts(t.from, t.to, t.style)));
}
function Ns(e, t, n, r = n.contentMatch, i = !0) {
	let a = e.doc.nodeAt(t), o = [], s = t + 1;
	for (let t = 0; t < a.childCount; t++) {
		let c = a.child(t), l = s + c.nodeSize, u = r.matchType(c.type);
		if (!u) o.push(new Os(s, l, R.empty));
		else {
			r = u;
			for (let t = 0; t < c.marks.length; t++) n.allowsMarkType(c.marks[t].type) || e.step(new Ts(s, l, c.marks[t]));
			if (i && c.isText && n.whitespace != "pre") {
				let e, t = /\r?\n|\r/g, r;
				for (; e = t.exec(c.text);) r || (r = new R(I.from(n.schema.text(" ", n.allowedMarks(c.marks))), 0, 0)), o.push(new Os(s + e.index, s + e.index + e[0].length, r));
			}
		}
		s = l;
	}
	if (!r.validEnd) {
		let t = r.fillBefore(I.empty, !0);
		e.replace(s, s, new R(t, 0, 0));
	}
	for (let t = o.length - 1; t >= 0; t--) e.step(o[t]);
}
function Ps(e, t, n) {
	return (t == 0 || e.canReplace(t, e.childCount)) && (n == e.childCount || e.canReplace(0, n));
}
function Fs(e) {
	let t = e.parent.content.cutByIndex(e.startIndex, e.endIndex);
	for (let n = e.depth, r = 0, i = 0;; --n) {
		let a = e.$from.node(n), o = e.$from.index(n) + r, s = e.$to.indexAfter(n) - i;
		if (n < e.depth && a.canReplace(o, s, t)) return n;
		if (n == 0 || a.type.spec.isolating || !Ps(a, o, s)) break;
		o && (r = 1), s < a.childCount && (i = 1);
	}
	return null;
}
function Is(e, t, n) {
	let { $from: r, $to: i, depth: a } = t, o = r.before(a + 1), s = i.after(a + 1), c = o, l = s, u = I.empty, d = 0;
	for (let e = a, t = !1; e > n; e--) t || r.index(e) > 0 ? (t = !0, u = I.from(r.node(e).copy(u)), d++) : c--;
	let f = I.empty, p = 0;
	for (let e = a, t = !1; e > n; e--) t || i.after(e + 1) < i.end(e) ? (t = !0, f = I.from(i.node(e).copy(f)), p++) : l++;
	e.step(new ks(c, l, o, s, new R(u.append(f), d, p), u.size - d, !0));
}
function Ls(e, t, n = null, r = e) {
	let i = zs(e, t), a = i && Bs(r, t);
	return a ? i.map(Rs).concat({
		type: t,
		attrs: n
	}).concat(a.map(Rs)) : null;
}
function Rs(e) {
	return {
		type: e,
		attrs: null
	};
}
function zs(e, t) {
	let { parent: n, startIndex: r, endIndex: i } = e, a = n.contentMatchAt(r).findWrapping(t);
	if (!a) return null;
	let o = a.length ? a[0] : t;
	return n.canReplaceWith(r, i, o) ? a : null;
}
function Bs(e, t) {
	let { parent: n, startIndex: r, endIndex: i } = e, a = n.child(r), o = t.contentMatch.findWrapping(a.type);
	if (!o) return null;
	let s = (o.length ? o[o.length - 1] : t).contentMatch;
	for (let e = r; s && e < i; e++) s = s.matchType(n.child(e).type);
	return !s || !s.validEnd ? null : o;
}
function Vs(e, t, n) {
	let r = I.empty;
	for (let e = n.length - 1; e >= 0; e--) {
		if (r.size) {
			let t = n[e].type.contentMatch.matchFragment(r);
			if (!t || !t.validEnd) throw RangeError("Wrapper type given to Transform.wrap does not form valid content of its parent wrapper");
		}
		r = I.from(n[e].type.create(n[e].attrs, r));
	}
	let i = t.start, a = t.end;
	e.step(new ks(i, a, i, a, new R(r, 0, 0), n.length, !0));
}
function Hs(e, t, n, r, i) {
	if (!r.isTextblock) throw RangeError("Type given to setBlockType should be a textblock");
	let a = e.steps.length;
	e.doc.nodesBetween(t, n, (t, n) => {
		let o = typeof i == "function" ? i(t) : i;
		if (t.isTextblock && !t.hasMarkup(r, o) && Gs(e.doc, e.mapping.slice(a).map(n), r)) {
			let i = null;
			if (r.schema.linebreakReplacement) {
				let e = r.whitespace == "pre", t = !!r.contentMatch.matchType(r.schema.linebreakReplacement);
				e && !t ? i = !1 : !e && t && (i = !0);
			}
			i === !1 && Ws(e, t, n, a), Ns(e, e.mapping.slice(a).map(n, 1), r, void 0, i === null);
			let s = e.mapping.slice(a), c = s.map(n, 1), l = s.map(n + t.nodeSize, 1);
			return e.step(new ks(c, l, c + 1, l - 1, new R(I.from(r.create(o, null, t.marks)), 0, 0), 1, !0)), i === !0 && Us(e, t, n, a), !1;
		}
	});
}
function Us(e, t, n, r) {
	t.forEach((i, a) => {
		if (i.isText) {
			let o, s = /\r?\n|\r/g;
			for (; o = s.exec(i.text);) {
				let i = e.mapping.slice(r).map(n + 1 + a + o.index);
				e.replaceWith(i, i + 1, t.type.schema.linebreakReplacement.create());
			}
		}
	});
}
function Ws(e, t, n, r) {
	t.forEach((i, a) => {
		if (i.type == i.type.schema.linebreakReplacement) {
			let i = e.mapping.slice(r).map(n + 1 + a);
			e.replaceWith(i, i + 1, t.type.schema.text("\n"));
		}
	});
}
function Gs(e, t, n) {
	let r = e.resolve(t), i = r.index();
	return r.parent.canReplaceWith(i, i + 1, n);
}
function Ks(e, t, n, r, i) {
	let a = e.doc.nodeAt(t);
	if (!a) throw RangeError("No node at given position");
	n || (n = a.type);
	let o = n.create(r, null, i || a.marks);
	if (a.isLeaf) return e.replaceWith(t, t + a.nodeSize, o);
	if (!n.validContent(a.content)) throw RangeError("Invalid content for node type " + n.name);
	e.step(new ks(t, t + a.nodeSize, t + 1, t + a.nodeSize - 1, new R(I.from(o), 0, 0), 1, !0));
}
function qs(e, t, n = 1, r) {
	let i = e.resolve(t), a = i.depth - n, o = r && r[r.length - 1] || i.parent;
	if (a < 0 || i.parent.type.spec.isolating || !i.parent.canReplace(i.index(), i.parent.childCount) || !o.type.validContent(i.parent.content.cutByIndex(i.index(), i.parent.childCount))) return !1;
	for (let e = i.depth - 1, t = n - 2; e > a; e--, t--) {
		let n = i.node(e), a = i.index(e);
		if (n.type.spec.isolating) return !1;
		let o = n.content.cutByIndex(a, n.childCount), s = r && r[t + 1];
		s && (o = o.replaceChild(0, s.type.create(s.attrs)));
		let c = r && r[t] || n;
		if (!n.canReplace(a + 1, n.childCount) || !c.type.validContent(o)) return !1;
	}
	let s = i.indexAfter(a), c = r && r[0];
	return i.node(a).canReplaceWith(s, s, c ? c.type : i.node(a + 1).type);
}
function Js(e, t, n = 1, r) {
	let i = e.doc.resolve(t), a = I.empty, o = I.empty;
	for (let e = i.depth, t = i.depth - n, s = n - 1; e > t; e--, s--) {
		a = I.from(i.node(e).copy(a));
		let t = r && r[s];
		o = I.from(t ? t.type.create(t.attrs, o) : i.node(e).copy(o));
	}
	e.step(new Os(t, t, new R(a.append(o), n, n), !0));
}
function Ys(e, t) {
	let n = e.resolve(t), r = n.index();
	return Zs(n.nodeBefore, n.nodeAfter) && n.parent.canReplace(r, r + 1);
}
function Xs(e, t) {
	t.content.size || e.type.compatibleContent(t.type);
	let n = e.contentMatchAt(e.childCount), { linebreakReplacement: r } = e.type.schema;
	for (let i = 0; i < t.childCount; i++) {
		let a = t.child(i), o = a.type == r ? e.type.schema.nodes.text : a.type;
		if (n = n.matchType(o), !n || !e.type.allowsMarks(a.marks)) return !1;
	}
	return n.validEnd;
}
function Zs(e, t) {
	return !!(e && t && !e.isLeaf && Xs(e, t));
}
function Qs(e, t, n = -1) {
	let r = e.resolve(t);
	for (let e = r.depth;; e--) {
		let i, a, o = r.index(e);
		if (e == r.depth ? (i = r.nodeBefore, a = r.nodeAfter) : n > 0 ? (i = r.node(e + 1), o++, a = r.node(e).maybeChild(o)) : (i = r.node(e).maybeChild(o - 1), a = r.node(e + 1)), i && !i.isTextblock && Zs(i, a) && r.node(e).canReplace(o, o + 1)) return t;
		if (e == 0) break;
		t = n < 0 ? r.before(e) : r.after(e);
	}
}
function $s(e, t, n) {
	let r = null, { linebreakReplacement: i } = e.doc.type.schema, a = e.doc.resolve(t - n), o = a.node().type;
	if (i && o.inlineContent) {
		let e = o.whitespace == "pre", t = !!o.contentMatch.matchType(i);
		e && !t ? r = !1 : !e && t && (r = !0);
	}
	let s = e.steps.length;
	if (r === !1) {
		let r = e.doc.resolve(t + n);
		Ws(e, r.node(), r.before(), s);
	}
	o.inlineContent && Ns(e, t + n - 1, o, a.node().contentMatchAt(a.index()), r == null);
	let c = e.mapping.slice(s), l = c.map(t - n);
	if (e.step(new Os(l, c.map(t + n, -1), R.empty, !0)), r === !0) {
		let t = e.doc.resolve(l);
		Us(e, t.node(), t.before(), e.steps.length);
	}
	return e;
}
function ec(e, t, n) {
	let r = e.resolve(t);
	if (r.parent.canReplaceWith(r.index(), r.index(), n)) return t;
	if (r.parentOffset == 0) for (let e = r.depth - 1; e >= 0; e--) {
		let t = r.index(e);
		if (r.node(e).canReplaceWith(t, t, n)) return r.before(e + 1);
		if (t > 0) return null;
	}
	if (r.parentOffset == r.parent.content.size) for (let e = r.depth - 1; e >= 0; e--) {
		let t = r.indexAfter(e);
		if (r.node(e).canReplaceWith(t, t, n)) return r.after(e + 1);
		if (t < r.node(e).childCount) return null;
	}
	return null;
}
function tc(e, t, n) {
	let r = e.resolve(t);
	if (!n.content.size) return t;
	let i = n.content;
	for (let e = 0; e < n.openStart; e++) i = i.firstChild.content;
	for (let e = 1; e <= (n.openStart == 0 && n.size ? 2 : 1); e++) for (let t = r.depth; t >= 0; t--) {
		let n = t == r.depth ? 0 : r.pos <= (r.start(t + 1) + r.end(t + 1)) / 2 ? -1 : 1, a = r.index(t) + +(n > 0), o = r.node(t), s = !1;
		if (e == 1) s = o.canReplace(a, a, i);
		else {
			let e = o.contentMatchAt(a).findWrapping(i.firstChild.type);
			s = e && o.canReplaceWith(a, a, e[0]);
		}
		if (s) return n == 0 ? r.pos : n < 0 ? r.before(t + 1) : r.after(t + 1);
	}
	return null;
}
function nc(e, t, n = t, r = R.empty) {
	if (t == n && !r.size) return null;
	let i = e.resolve(t), a = e.resolve(n);
	return rc(i, a, r) ? new Os(t, n, r) : new ic(i, a, r).fit();
}
function rc(e, t, n) {
	return !n.openStart && !n.openEnd && e.start() == t.start() && e.parent.canReplace(e.index(), t.index(), n.content);
}
var ic = class {
	constructor(e, t, n) {
		this.$from = e, this.$to = t, this.unplaced = n, this.frontier = [], this.placed = I.empty;
		for (let t = 0; t <= e.depth; t++) {
			let n = e.node(t);
			this.frontier.push({
				type: n.type,
				match: n.contentMatchAt(e.indexAfter(t))
			});
		}
		for (let t = e.depth; t > 0; t--) this.placed = I.from(e.node(t).copy(this.placed));
	}
	get depth() {
		return this.frontier.length - 1;
	}
	fit() {
		for (; this.unplaced.size;) {
			let e = this.findFittable();
			e ? this.placeNodes(e) : this.openMore() || this.dropNode();
		}
		let e = this.mustMoveInline(), t = this.placed.size - this.depth - this.$from.depth, n = this.$from, r = this.close(e < 0 ? this.$to : n.doc.resolve(e));
		if (!r) return null;
		let i = this.placed, a = n.depth, o = r.depth;
		for (; a && o && i.childCount == 1;) i = i.firstChild.content, a--, o--;
		let s = new R(i, a, o);
		return e > -1 ? new ks(n.pos, e, this.$to.pos, this.$to.end(), s, t) : s.size || n.pos != this.$to.pos ? new Os(n.pos, r.pos, s) : null;
	}
	findFittable() {
		let e = this.unplaced.openStart;
		for (let t = this.unplaced.content, n = 0, r = this.unplaced.openEnd; n < e; n++) {
			let i = t.firstChild;
			if (t.childCount > 1 && (r = 0), i.type.spec.isolating && r <= n) {
				e = n;
				break;
			}
			t = i.content;
		}
		for (let t = 1; t <= 2; t++) for (let n = t == 1 ? e : this.unplaced.openStart; n >= 0; n--) {
			let e, r = null;
			n ? (r = sc(this.unplaced.content, n - 1).firstChild, e = r.content) : e = this.unplaced.content;
			let i = e.firstChild;
			for (let e = this.depth; e >= 0; e--) {
				let { type: a, match: o } = this.frontier[e], s, c = null;
				if (t == 1 && (i ? o.matchType(i.type) || (c = o.fillBefore(I.from(i), !1)) : r && a.compatibleContent(r.type))) return {
					sliceDepth: n,
					frontierDepth: e,
					parent: r,
					inject: c
				};
				if (t == 2 && i && (s = o.findWrapping(i.type))) return {
					sliceDepth: n,
					frontierDepth: e,
					parent: r,
					wrap: s
				};
				if (r && o.matchType(r.type)) break;
			}
		}
	}
	openMore() {
		let { content: e, openStart: t, openEnd: n } = this.unplaced, r = sc(e, t);
		return !r.childCount || r.firstChild.isLeaf ? !1 : (this.unplaced = new R(e, t + 1, Math.max(n, r.size + t >= e.size - n ? t + 1 : 0)), !0);
	}
	dropNode() {
		let { content: e, openStart: t, openEnd: n } = this.unplaced, r = sc(e, t);
		if (r.childCount <= 1 && t > 0) {
			let i = e.size - t <= t + r.size;
			this.unplaced = new R(ac(e, t - 1, 1), t - 1, i ? t - 1 : n);
		} else this.unplaced = new R(ac(e, t, 1), t, n);
	}
	placeNodes({ sliceDepth: e, frontierDepth: t, parent: n, inject: r, wrap: i }) {
		for (; this.depth > t;) this.closeFrontierNode();
		if (i) for (let e = 0; e < i.length; e++) this.openFrontierNode(i[e]);
		let a = this.unplaced, o = n ? n.content : a.content, s = a.openStart - e, c = 0, l = [], { match: u, type: d } = this.frontier[t];
		if (r) {
			for (let e = 0; e < r.childCount; e++) l.push(r.child(e));
			u = u.matchFragment(r);
		}
		let f = o.size + e - (a.content.size - a.openEnd);
		for (; c < o.childCount;) {
			let e = o.child(c), t = u.matchType(e.type);
			if (!t) break;
			c++, (c > 1 || s == 0 || e.content.size) && (u = t, l.push(cc(e.mark(d.allowedMarks(e.marks)), c == 1 ? s : 0, c == o.childCount ? f : -1)));
		}
		let p = c == o.childCount;
		p || (f = -1), this.placed = oc(this.placed, t, I.from(l)), this.frontier[t].match = u, p && f < 0 && n && n.type == this.frontier[this.depth].type && this.frontier.length > 1 && this.closeFrontierNode();
		for (let e = 0, t = o; e < f; e++) {
			let e = t.lastChild;
			this.frontier.push({
				type: e.type,
				match: e.contentMatchAt(e.childCount)
			}), t = e.content;
		}
		this.unplaced = p ? e == 0 ? R.empty : new R(ac(a.content, e - 1, 1), e - 1, f < 0 ? a.openEnd : e - 1) : new R(ac(a.content, e, c), a.openStart, a.openEnd);
	}
	mustMoveInline() {
		if (!this.$to.parent.isTextblock) return -1;
		let e = this.frontier[this.depth], t;
		if (!e.type.isTextblock || !lc(this.$to, this.$to.depth, e.type, e.match, !1) || this.$to.depth == this.depth && (t = this.findCloseLevel(this.$to)) && t.depth == this.depth) return -1;
		let { depth: n } = this.$to, r = this.$to.after(n);
		for (; n > 1 && r == this.$to.end(--n);) ++r;
		return r;
	}
	findCloseLevel(e) {
		scan: for (let t = Math.min(this.depth, e.depth); t >= 0; t--) {
			let { match: n, type: r } = this.frontier[t], i = t < e.depth && e.end(t + 1) == e.pos + (e.depth - (t + 1)), a = lc(e, t, r, n, i);
			if (a) {
				for (let n = t - 1; n >= 0; n--) {
					let { match: t, type: r } = this.frontier[n], i = lc(e, n, r, t, !0);
					if (!i || i.childCount) continue scan;
				}
				return {
					depth: t,
					fit: a,
					move: i ? e.doc.resolve(e.after(t + 1)) : e
				};
			}
		}
	}
	close(e) {
		let t = this.findCloseLevel(e);
		if (!t) return null;
		for (; this.depth > t.depth;) this.closeFrontierNode();
		t.fit.childCount && (this.placed = oc(this.placed, t.depth, t.fit)), e = t.move;
		for (let n = t.depth + 1; n <= e.depth; n++) {
			let t = e.node(n), r = t.type.contentMatch.fillBefore(t.content, !0, e.index(n));
			this.openFrontierNode(t.type, t.attrs, r);
		}
		return e;
	}
	openFrontierNode(e, t = null, n) {
		let r = this.frontier[this.depth];
		r.match = r.match.matchType(e), this.placed = oc(this.placed, this.depth, I.from(e.create(t, n))), this.frontier.push({
			type: e,
			match: e.contentMatch
		});
	}
	closeFrontierNode() {
		let e = this.frontier.pop().match.fillBefore(I.empty, !0);
		e.childCount && (this.placed = oc(this.placed, this.frontier.length, e));
	}
};
function ac(e, t, n) {
	return t == 0 ? e.cutByIndex(n, e.childCount) : e.replaceChild(0, e.firstChild.copy(ac(e.firstChild.content, t - 1, n)));
}
function oc(e, t, n) {
	return t == 0 ? e.append(n) : e.replaceChild(e.childCount - 1, e.lastChild.copy(oc(e.lastChild.content, t - 1, n)));
}
function sc(e, t) {
	for (let n = 0; n < t; n++) e = e.firstChild.content;
	return e;
}
function cc(e, t, n) {
	if (t <= 0) return e;
	let r = e.content;
	return t > 1 && (r = r.replaceChild(0, cc(r.firstChild, t - 1, r.childCount == 1 ? n - 1 : 0))), t > 0 && (r = e.type.contentMatch.fillBefore(r).append(r), n <= 0 && (r = r.append(e.type.contentMatch.matchFragment(r).fillBefore(I.empty, !0)))), e.copy(r);
}
function lc(e, t, n, r, i) {
	let a = e.node(t), o = i ? e.indexAfter(t) : e.index(t);
	if (o == a.childCount && !n.compatibleContent(a.type)) return null;
	let s = r.fillBefore(a.content, !0, o);
	return s && !uc(n, a.content, o) ? s : null;
}
function uc(e, t, n) {
	for (let r = n; r < t.childCount; r++) if (!e.allowsMarks(t.child(r).marks)) return !0;
	return !1;
}
function dc(e) {
	return e.spec.defining || e.spec.definingForContent;
}
function fc(e, t, n, r) {
	if (!r.size) return e.deleteRange(t, n);
	let i = e.doc.resolve(t), a = e.doc.resolve(n);
	if (rc(i, a, r)) return e.step(new Os(t, n, r));
	let o = gc(i, a);
	o[o.length - 1] == 0 && o.pop();
	let s = -(i.depth + 1);
	o.unshift(s);
	for (let e = i.depth, t = i.pos - 1; e > 0; e--, t--) {
		let n = i.node(e).type.spec;
		if (n.defining || n.definingAsContext || n.isolating) break;
		o.indexOf(e) > -1 ? s = e : i.before(e) == t && o.splice(1, 0, -e);
	}
	let c = o.indexOf(s), l = [], u = r.openStart;
	for (let e = r.content, t = 0;; t++) {
		let n = e.firstChild;
		if (l.push(n), t == r.openStart) break;
		e = n.content;
	}
	for (let e = u - 1; e >= 0; e--) {
		let t = l[e], n = dc(t.type);
		if (n && !t.sameMarkup(i.node(Math.abs(s) - 1))) u = e;
		else if (n || !t.type.isTextblock) break;
	}
	for (let t = r.openStart; t >= 0; t--) {
		let s = (t + u + 1) % (r.openStart + 1), d = l[s];
		if (d) for (let t = 0; t < o.length; t++) {
			let l = o[(t + c) % o.length], u = !0;
			l < 0 && (u = !1, l = -l);
			let f = i.node(l - 1), p = i.index(l - 1);
			if (f.canReplaceWith(p, p, d.type, d.marks)) return e.replace(i.before(l), u ? a.after(l) : n, new R(pc(r.content, 0, r.openStart, s), s, r.openEnd));
		}
	}
	let d = e.steps.length;
	for (let s = o.length - 1; s >= 0 && (e.replace(t, n, r), !(e.steps.length > d)); s--) {
		let e = o[s];
		e < 0 || (t = i.before(e), n = a.after(e));
	}
}
function pc(e, t, n, r, i) {
	if (t < n) {
		let i = e.firstChild;
		e = e.replaceChild(0, i.copy(pc(i.content, t + 1, n, r, i)));
	}
	if (t > r) {
		let t = i.contentMatchAt(0), n = t.fillBefore(e).append(e);
		e = n.append(t.matchFragment(n).fillBefore(I.empty, !0));
	}
	return e;
}
function mc(e, t, n, r) {
	if (!r.isInline && t == n && e.doc.resolve(t).parent.content.size) {
		let i = ec(e.doc, t, r.type);
		i != null && (t = n = i);
	}
	e.replaceRange(t, n, new R(I.from(r), 0, 0));
}
function hc(e, t, n) {
	let r = e.doc.resolve(t), i = e.doc.resolve(n);
	if (r.parent.isTextblock && i.parent.isTextblock && r.start() != i.start() && r.parentOffset == 0 && i.parentOffset == 0) {
		let a = r.sharedDepth(n), o = !1;
		for (let e = r.depth; e > a; e--) r.node(e).type.spec.isolating && (o = !0);
		for (let e = i.depth; e > a; e--) i.node(e).type.spec.isolating && (o = !0);
		if (!o) {
			for (let e = r.depth; e > 0 && t == r.start(e); e--) t = r.before(e);
			for (let e = i.depth; e > 0 && n == i.start(e); e--) n = i.before(e);
			r = e.doc.resolve(t), i = e.doc.resolve(n);
		}
	}
	let a = gc(r, i);
	for (let t = 0; t < a.length; t++) {
		let n = a[t], o = t == a.length - 1;
		if (o && n == 0 || r.node(n).type.contentMatch.validEnd) return e.delete(r.start(n), i.end(n));
		if (n > 0 && (o || r.node(n - 1).canReplace(r.index(n - 1), i.indexAfter(n - 1)))) return e.delete(r.before(n), i.after(n));
	}
	for (let a = 1; a <= r.depth && a <= i.depth; a++) if (t - r.start(a) == r.depth - a && n > r.end(a) && i.end(a) - n != i.depth - a && r.start(a - 1) == i.start(a - 1) && r.node(a - 1).canReplace(r.index(a - 1), i.index(a - 1))) return e.delete(r.before(a), n);
	e.delete(t, n);
}
function gc(e, t) {
	let n = [], r = Math.min(e.depth, t.depth);
	for (let i = r; i >= 0; i--) {
		let r = e.start(i);
		if (r < e.pos - (e.depth - i) || t.end(i) > t.pos + (t.depth - i) || e.node(i).type.spec.isolating || t.node(i).type.spec.isolating) break;
		(r == t.start(i) || i == e.depth && i == t.depth && e.parent.inlineContent && t.parent.inlineContent && i && t.start(i - 1) == r - 1) && n.push(i);
	}
	return n;
}
var _c = class e extends xs {
	constructor(e, t, n) {
		super(), this.pos = e, this.attr = t, this.value = n;
	}
	apply(e) {
		let t = e.nodeAt(this.pos);
		if (!t) return Ss.fail("No node at attribute step's position");
		let n = Object.create(null);
		for (let e in t.attrs) n[e] = t.attrs[e];
		n[this.attr] = this.value;
		let r = t.type.create(n, null, t.marks);
		return Ss.fromReplace(e, this.pos, this.pos + 1, new R(I.from(r), 0, +!t.isLeaf));
	}
	getMap() {
		return vs.empty;
	}
	invert(t) {
		return new e(this.pos, this.attr, t.nodeAt(this.pos).attrs[this.attr]);
	}
	map(t) {
		let n = t.mapResult(this.pos, 1);
		return n.deletedAfter ? null : new e(n.pos, this.attr, this.value);
	}
	toJSON() {
		return {
			stepType: "attr",
			pos: this.pos,
			attr: this.attr,
			value: this.value
		};
	}
	static fromJSON(t, n) {
		if (typeof n.pos != "number" || typeof n.attr != "string") throw RangeError("Invalid input for AttrStep.fromJSON");
		return new e(n.pos, n.attr, n.value);
	}
};
xs.jsonID("attr", _c);
var vc = class e extends xs {
	constructor(e, t) {
		super(), this.attr = e, this.value = t;
	}
	apply(e) {
		let t = Object.create(null);
		for (let n in e.attrs) t[n] = e.attrs[n];
		t[this.attr] = this.value;
		let n = e.type.create(t, e.content, e.marks);
		return Ss.ok(n);
	}
	getMap() {
		return vs.empty;
	}
	invert(t) {
		return new e(this.attr, t.attrs[this.attr]);
	}
	map(e) {
		return this;
	}
	toJSON() {
		return {
			stepType: "docAttr",
			attr: this.attr,
			value: this.value
		};
	}
	static fromJSON(t, n) {
		if (typeof n.attr != "string") throw RangeError("Invalid input for DocAttrStep.fromJSON");
		return new e(n.attr, n.value);
	}
};
xs.jsonID("docAttr", vc);
var yc = class extends Error {};
yc = function e(t) {
	let n = Error.call(this, t);
	return n.__proto__ = e.prototype, n;
}, yc.prototype = Object.create(Error.prototype), yc.prototype.constructor = yc, yc.prototype.name = "TransformError";
var bc = class {
	constructor(e) {
		this.doc = e, this.steps = [], this.docs = [], this.mapping = new ys();
	}
	get before() {
		return this.docs.length ? this.docs[0] : this.doc;
	}
	step(e) {
		let t = this.maybeStep(e);
		if (t.failed) throw new yc(t.failed);
		return this;
	}
	maybeStep(e) {
		let t = e.apply(this.doc);
		return t.failed || this.addStep(e, t.doc), t;
	}
	get docChanged() {
		return this.steps.length > 0;
	}
	changedRange() {
		let e = 1e9, t = -1e9;
		for (let n = 0; n < this.mapping.maps.length; n++) {
			let r = this.mapping.maps[n];
			n && (e = r.map(e, 1), t = r.map(t, -1)), r.forEach((n, r, i, a) => {
				e = Math.min(e, i), t = Math.max(t, a);
			});
		}
		return e == 1e9 ? null : {
			from: e,
			to: t
		};
	}
	addStep(e, t) {
		this.docs.push(this.doc), this.steps.push(e), this.mapping.appendMap(e.getMap()), this.doc = t;
	}
	replace(e, t = e, n = R.empty) {
		let r = nc(this.doc, e, t, n);
		return r && this.step(r), this;
	}
	replaceWith(e, t, n) {
		return this.replace(e, t, new R(I.from(n), 0, 0));
	}
	delete(e, t) {
		return this.replace(e, t, R.empty);
	}
	insert(e, t) {
		return this.replaceWith(e, e, t);
	}
	replaceRange(e, t, n) {
		return fc(this, e, t, n), this;
	}
	replaceRangeWith(e, t, n) {
		return mc(this, e, t, n), this;
	}
	deleteRange(e, t) {
		return hc(this, e, t), this;
	}
	lift(e, t) {
		return Is(this, e, t), this;
	}
	join(e, t = 1) {
		return $s(this, e, t), this;
	}
	wrap(e, t) {
		return Vs(this, e, t), this;
	}
	setBlockType(e, t = e, n, r = null) {
		return Hs(this, e, t, n, r), this;
	}
	setNodeMarkup(e, t, n = null, r) {
		return Ks(this, e, t, n, r), this;
	}
	setNodeAttribute(e, t, n) {
		return this.step(new _c(e, t, n)), this;
	}
	setDocAttribute(e, t) {
		return this.step(new vc(e, t)), this;
	}
	addNodeMark(e, t) {
		return this.step(new Es(e, t)), this;
	}
	removeNodeMark(e, t) {
		let n = this.doc.nodeAt(e);
		if (!n) throw RangeError("No node at position " + e);
		if (t instanceof L) t.isInSet(n.marks) && this.step(new Ds(e, t));
		else {
			let r = n.marks, i, a = [];
			for (; i = t.isInSet(r);) a.push(new Ds(e, i)), r = i.removeFromSet(r);
			for (let e = a.length - 1; e >= 0; e--) this.step(a[e]);
		}
		return this;
	}
	split(e, t = 1, n) {
		return Js(this, e, t, n), this;
	}
	addMark(e, t, n) {
		return js(this, e, t, n), this;
	}
	removeMark(e, t, n) {
		return Ms(this, e, t, n), this;
	}
	clearIncompatible(e, t, n) {
		return Ns(this, e, t, n), this;
	}
}, xc = Object.create(null), B = class {
	constructor(e, t, n) {
		this.$anchor = e, this.$head = t, this.ranges = n || [new Sc(e.min(t), e.max(t))];
	}
	get anchor() {
		return this.$anchor.pos;
	}
	get head() {
		return this.$head.pos;
	}
	get from() {
		return this.$from.pos;
	}
	get to() {
		return this.$to.pos;
	}
	get $from() {
		return this.ranges[0].$from;
	}
	get $to() {
		return this.ranges[0].$to;
	}
	get empty() {
		let e = this.ranges;
		for (let t = 0; t < e.length; t++) if (e[t].$from.pos != e[t].$to.pos) return !1;
		return !0;
	}
	content() {
		return this.$from.doc.slice(this.from, this.to, !0);
	}
	replace(e, t = R.empty) {
		let n = t.content.lastChild, r = null;
		for (let e = 0; e < t.openEnd; e++) r = n, n = n.lastChild;
		let i = e.steps.length, a = this.ranges;
		for (let o = 0; o < a.length; o++) {
			let { $from: s, $to: c } = a[o], l = e.mapping.slice(i);
			e.replaceRange(l.map(s.pos), l.map(c.pos), o ? R.empty : t), o == 0 && Ac(e, i, (n ? n.isInline : r && r.isTextblock) ? -1 : 1);
		}
	}
	replaceWith(e, t) {
		let n = e.steps.length, r = this.ranges;
		for (let i = 0; i < r.length; i++) {
			let { $from: a, $to: o } = r[i], s = e.mapping.slice(n), c = s.map(a.pos), l = s.map(o.pos);
			i ? e.deleteRange(c, l) : (e.replaceRangeWith(c, l, t), Ac(e, n, t.isInline ? -1 : 1));
		}
	}
	static findFrom(e, t, n = !1) {
		let r = e.parent.inlineContent ? new V(e) : kc(e.node(0), e.parent, e.pos, e.index(), t, n);
		if (r) return r;
		for (let r = e.depth - 1; r >= 0; r--) {
			let i = t < 0 ? kc(e.node(0), e.node(r), e.before(r + 1), e.index(r), t, n) : kc(e.node(0), e.node(r), e.after(r + 1), e.index(r) + 1, t, n);
			if (i) return i;
		}
		return null;
	}
	static near(e, t = 1) {
		return this.findFrom(e, t) || this.findFrom(e, -t) || new Dc(e.node(0));
	}
	static atStart(e) {
		return kc(e, e, 0, 0, 1) || new Dc(e);
	}
	static atEnd(e) {
		return kc(e, e, e.content.size, e.childCount, -1) || new Dc(e);
	}
	static fromJSON(e, t) {
		if (!t || !t.type) throw RangeError("Invalid input for Selection.fromJSON");
		let n = xc[t.type];
		if (!n) throw RangeError(`No selection type ${t.type} defined`);
		return n.fromJSON(e, t);
	}
	static jsonID(e, t) {
		if (e in xc) throw RangeError("Duplicate use of selection JSON ID " + e);
		return xc[e] = t, t.prototype.jsonID = e, t;
	}
	getBookmark() {
		return V.between(this.$anchor, this.$head).getBookmark();
	}
};
B.prototype.visible = !0;
var Sc = class {
	constructor(e, t) {
		this.$from = e, this.$to = t;
	}
}, Cc = !1;
function wc(e) {
	!Cc && !e.parent.inlineContent && (Cc = !0, console.warn("TextSelection endpoint not pointing into a node with inline content (" + e.parent.type.name + ")"));
}
var V = class e extends B {
	constructor(e, t = e) {
		wc(e), wc(t), super(e, t);
	}
	get $cursor() {
		return this.$anchor.pos == this.$head.pos ? this.$head : null;
	}
	map(t, n) {
		let r = t.resolve(n.map(this.head));
		if (!r.parent.inlineContent) return B.near(r);
		let i = t.resolve(n.map(this.anchor));
		return new e(i.parent.inlineContent ? i : r, r);
	}
	replace(e, t = R.empty) {
		if (super.replace(e, t), t == R.empty) {
			let t = this.$from.marksAcross(this.$to);
			t && e.ensureMarks(t);
		}
	}
	eq(t) {
		return t instanceof e && t.anchor == this.anchor && t.head == this.head;
	}
	getBookmark() {
		return new Tc(this.anchor, this.head);
	}
	toJSON() {
		return {
			type: "text",
			anchor: this.anchor,
			head: this.head
		};
	}
	static fromJSON(t, n) {
		if (typeof n.anchor != "number" || typeof n.head != "number") throw RangeError("Invalid input for TextSelection.fromJSON");
		return new e(t.resolve(n.anchor), t.resolve(n.head));
	}
	static create(e, t, n = t) {
		let r = e.resolve(t);
		return new this(r, n == t ? r : e.resolve(n));
	}
	static between(t, n, r) {
		let i = t.pos - n.pos;
		if ((!r || i) && (r = i >= 0 ? 1 : -1), !n.parent.inlineContent) {
			let e = B.findFrom(n, r, !0) || B.findFrom(n, -r, !0);
			if (e) n = e.$head;
			else return B.near(n, r);
		}
		return t.parent.inlineContent || (i == 0 ? t = n : (t = (B.findFrom(t, -r, !0) || B.findFrom(t, r, !0)).$anchor, t.pos < n.pos != i < 0 && (t = n))), new e(t, n);
	}
};
B.jsonID("text", V);
var Tc = class e {
	constructor(e, t) {
		this.anchor = e, this.head = t;
	}
	map(t) {
		return new e(t.map(this.anchor), t.map(this.head));
	}
	resolve(e) {
		return V.between(e.resolve(this.anchor), e.resolve(this.head));
	}
}, H = class e extends B {
	constructor(e) {
		let t = e.nodeAfter, n = e.node(0).resolve(e.pos + t.nodeSize);
		super(e, n), this.node = t;
	}
	map(t, n) {
		let { deleted: r, pos: i } = n.mapResult(this.anchor), a = t.resolve(i);
		return r ? B.near(a) : new e(a);
	}
	content() {
		return new R(I.from(this.node), 0, 0);
	}
	eq(t) {
		return t instanceof e && t.anchor == this.anchor;
	}
	toJSON() {
		return {
			type: "node",
			anchor: this.anchor
		};
	}
	getBookmark() {
		return new Ec(this.anchor);
	}
	static fromJSON(t, n) {
		if (typeof n.anchor != "number") throw RangeError("Invalid input for NodeSelection.fromJSON");
		return new e(t.resolve(n.anchor));
	}
	static create(t, n) {
		return new e(t.resolve(n));
	}
	static isSelectable(e) {
		return !e.isText && e.type.spec.selectable !== !1;
	}
};
H.prototype.visible = !1, B.jsonID("node", H);
var Ec = class e {
	constructor(e) {
		this.anchor = e;
	}
	map(t) {
		let { deleted: n, pos: r } = t.mapResult(this.anchor);
		return n ? new Tc(r, r) : new e(r);
	}
	resolve(e) {
		let t = e.resolve(this.anchor), n = t.nodeAfter;
		return n && H.isSelectable(n) ? new H(t) : B.near(t);
	}
}, Dc = class e extends B {
	constructor(e) {
		super(e.resolve(0), e.resolve(e.content.size));
	}
	replace(e, t = R.empty) {
		if (t == R.empty) {
			e.delete(0, e.doc.content.size);
			let t = B.atStart(e.doc);
			t.eq(e.selection) || e.setSelection(t);
		} else super.replace(e, t);
	}
	toJSON() {
		return { type: "all" };
	}
	static fromJSON(t) {
		return new e(t);
	}
	map(t) {
		return new e(t);
	}
	eq(t) {
		return t instanceof e;
	}
	getBookmark() {
		return Oc;
	}
};
B.jsonID("all", Dc);
var Oc = {
	map() {
		return this;
	},
	resolve(e) {
		return new Dc(e);
	}
};
function kc(e, t, n, r, i, a = !1) {
	if (t.inlineContent) return V.create(e, n);
	for (let o = r - (i > 0 ? 0 : 1); i > 0 ? o < t.childCount : o >= 0; o += i) {
		let r = t.child(o);
		if (!r.isAtom) {
			let t = kc(e, r, n + i, i < 0 ? r.childCount : 0, i, a);
			if (t) return t;
		} else if (!a && H.isSelectable(r)) return H.create(e, n - (i < 0 ? r.nodeSize : 0));
		n += r.nodeSize * i;
	}
	return null;
}
function Ac(e, t, n) {
	let r = e.steps.length - 1;
	if (r < t) return;
	let i = e.steps[r];
	if (!(i instanceof Os || i instanceof ks)) return;
	let a = e.mapping.maps[r], o;
	a.forEach((e, t, n, r) => {
		o ?? (o = r);
	}), e.setSelection(B.near(e.doc.resolve(o), n));
}
var jc = 1, Mc = 2, Nc = 4, Pc = class extends bc {
	constructor(e) {
		super(e.doc), this.curSelectionFor = 0, this.updated = 0, this.meta = Object.create(null), this.time = Date.now(), this.curSelection = e.selection, this.storedMarks = e.storedMarks;
	}
	get selection() {
		return this.curSelectionFor < this.steps.length && (this.curSelection = this.curSelection.map(this.doc, this.mapping.slice(this.curSelectionFor)), this.curSelectionFor = this.steps.length), this.curSelection;
	}
	setSelection(e) {
		if (e.$from.doc != this.doc) throw RangeError("Selection passed to setSelection must point at the current document");
		return this.curSelection = e, this.curSelectionFor = this.steps.length, this.updated = (this.updated | jc) & ~Mc, this.storedMarks = null, this;
	}
	get selectionSet() {
		return (this.updated & jc) > 0;
	}
	setStoredMarks(e) {
		return this.storedMarks = e, this.updated |= Mc, this;
	}
	ensureMarks(e) {
		return L.sameSet(this.storedMarks || this.selection.$from.marks(), e) || this.setStoredMarks(e), this;
	}
	addStoredMark(e) {
		return this.ensureMarks(e.addToSet(this.storedMarks || this.selection.$head.marks()));
	}
	removeStoredMark(e) {
		return this.ensureMarks(e.removeFromSet(this.storedMarks || this.selection.$head.marks()));
	}
	get storedMarksSet() {
		return (this.updated & Mc) > 0;
	}
	addStep(e, t) {
		super.addStep(e, t), this.updated &= ~Mc, this.storedMarks = null;
	}
	setTime(e) {
		return this.time = e, this;
	}
	replaceSelection(e) {
		return this.selection.replace(this, e), this;
	}
	replaceSelectionWith(e, t = !0) {
		let n = this.selection;
		return t && (e = e.mark(this.storedMarks || (n.empty ? n.$from.marks() : n.$from.marksAcross(n.$to) || L.none))), n.replaceWith(this, e), this;
	}
	deleteSelection() {
		return this.selection.replace(this), this;
	}
	insertText(e, t, n) {
		let r = this.doc.type.schema;
		if (t == null) return e ? this.replaceSelectionWith(r.text(e), !0) : this.deleteSelection();
		{
			if (n ?? (n = t), !e) return this.deleteRange(t, n);
			let i = this.storedMarks;
			if (!i) {
				let e = this.doc.resolve(t);
				i = n == t ? e.marks() : e.marksAcross(this.doc.resolve(n));
			}
			return this.replaceRangeWith(t, n, r.text(e, i)), !this.selection.empty && this.selection.to == t + e.length && this.setSelection(B.near(this.selection.$to)), this;
		}
	}
	setMeta(e, t) {
		return this.meta[typeof e == "string" ? e : e.key] = t, this;
	}
	getMeta(e) {
		return this.meta[typeof e == "string" ? e : e.key];
	}
	get isGeneric() {
		for (let e in this.meta) return !1;
		return !0;
	}
	scrollIntoView() {
		return this.updated |= Nc, this;
	}
	get scrolledIntoView() {
		return (this.updated & Nc) > 0;
	}
};
function Fc(e, t) {
	return !t || !e ? e : e.bind(t);
}
var Ic = class {
	constructor(e, t, n) {
		this.name = e, this.init = Fc(t.init, n), this.apply = Fc(t.apply, n);
	}
}, Lc = [
	new Ic("doc", {
		init(e) {
			return e.doc || e.schema.topNodeType.createAndFill();
		},
		apply(e) {
			return e.doc;
		}
	}),
	new Ic("selection", {
		init(e, t) {
			return e.selection || B.atStart(t.doc);
		},
		apply(e) {
			return e.selection;
		}
	}),
	new Ic("storedMarks", {
		init(e) {
			return e.storedMarks || null;
		},
		apply(e, t, n, r) {
			return r.selection.$cursor ? e.storedMarks : null;
		}
	}),
	new Ic("scrollToSelection", {
		init() {
			return 0;
		},
		apply(e, t) {
			return e.scrolledIntoView ? t + 1 : t;
		}
	})
], Rc = class {
	constructor(e, t) {
		this.schema = e, this.plugins = [], this.pluginsByKey = Object.create(null), this.fields = Lc.slice(), t && t.forEach((e) => {
			if (this.pluginsByKey[e.key]) throw RangeError("Adding different instances of a keyed plugin (" + e.key + ")");
			this.plugins.push(e), this.pluginsByKey[e.key] = e, e.spec.state && this.fields.push(new Ic(e.key, e.spec.state, e));
		});
	}
}, zc = class e {
	constructor(e) {
		this.config = e;
	}
	get schema() {
		return this.config.schema;
	}
	get plugins() {
		return this.config.plugins;
	}
	apply(e) {
		return this.applyTransaction(e).state;
	}
	filterTransaction(e, t = -1) {
		for (let n = 0; n < this.config.plugins.length; n++) if (n != t) {
			let t = this.config.plugins[n];
			if (t.spec.filterTransaction && !t.spec.filterTransaction.call(t, e, this)) return !1;
		}
		return !0;
	}
	applyTransaction(e) {
		if (!this.filterTransaction(e)) return {
			state: this,
			transactions: []
		};
		let t = [e], n = this.applyInner(e), r = null;
		for (;;) {
			let i = !1;
			for (let a = 0; a < this.config.plugins.length; a++) {
				let o = this.config.plugins[a];
				if (o.spec.appendTransaction) {
					let s = r ? r[a].n : 0, c = r ? r[a].state : this, l = s < t.length && o.spec.appendTransaction.call(o, s ? t.slice(s) : t, c, n);
					if (l && n.filterTransaction(l, a)) {
						if (l.setMeta("appendedTransaction", e), !r) {
							r = [];
							for (let e = 0; e < this.config.plugins.length; e++) r.push(e < a ? {
								state: n,
								n: t.length
							} : {
								state: this,
								n: 0
							});
						}
						t.push(l), n = n.applyInner(l), i = !0;
					}
					r && (r[a] = {
						state: n,
						n: t.length
					});
				}
			}
			if (!i) return {
				state: n,
				transactions: t
			};
		}
	}
	applyInner(t) {
		if (!t.before.eq(this.doc)) throw RangeError("Applying a mismatched transaction");
		let n = new e(this.config), r = this.config.fields;
		for (let e = 0; e < r.length; e++) {
			let i = r[e];
			n[i.name] = i.apply(t, this[i.name], this, n);
		}
		return n;
	}
	get tr() {
		return new Pc(this);
	}
	static create(t) {
		let n = new Rc(t.doc ? t.doc.type.schema : t.schema, t.plugins), r = new e(n);
		for (let e = 0; e < n.fields.length; e++) r[n.fields[e].name] = n.fields[e].init(t, r);
		return r;
	}
	reconfigure(t) {
		let n = new Rc(this.schema, t.plugins), r = n.fields, i = new e(n);
		for (let e = 0; e < r.length; e++) {
			let n = r[e].name;
			i[n] = this.hasOwnProperty(n) ? this[n] : r[e].init(t, i);
		}
		return i;
	}
	toJSON(e) {
		let t = {
			doc: this.doc.toJSON(),
			selection: this.selection.toJSON()
		};
		if (this.storedMarks && (t.storedMarks = this.storedMarks.map((e) => e.toJSON())), e && typeof e == "object") for (let n in e) {
			if (n == "doc" || n == "selection") throw RangeError("The JSON fields `doc` and `selection` are reserved");
			let r = e[n], i = r.spec.state;
			i && i.toJSON && (t[n] = i.toJSON.call(r, this[r.key]));
		}
		return t;
	}
	static fromJSON(t, n, r) {
		if (!n) throw RangeError("Invalid input for EditorState.fromJSON");
		if (!t.schema) throw RangeError("Required config field 'schema' missing");
		let i = new Rc(t.schema, t.plugins), a = new e(i);
		return i.fields.forEach((e) => {
			if (e.name == "doc") a.doc = fo.fromJSON(t.schema, n.doc);
			else if (e.name == "selection") a.selection = B.fromJSON(a.doc, n.selection);
			else if (e.name == "storedMarks") n.storedMarks && (a.storedMarks = n.storedMarks.map(t.schema.markFromJSON));
			else {
				if (r) for (let i in r) {
					let o = r[i], s = o.spec.state;
					if (o.key == e.name && s && s.fromJSON && Object.prototype.hasOwnProperty.call(n, i)) {
						a[e.name] = s.fromJSON.call(o, t, n[i], a);
						return;
					}
				}
				a[e.name] = e.init(t, a);
			}
		}), a;
	}
};
function Bc(e, t, n) {
	for (let r in e) {
		let i = e[r];
		i instanceof Function ? i = i.bind(t) : r == "handleDOMEvents" && (i = Bc(i, t, {})), n[r] = i;
	}
	return n;
}
var Vc = class {
	constructor(e) {
		this.spec = e, this.props = {}, e.props && Bc(e.props, this, this.props), this.key = e.key ? e.key.key : Uc("plugin");
	}
	getState(e) {
		return e[this.key];
	}
}, Hc = Object.create(null);
function Uc(e) {
	return e in Hc ? e + "$" + ++Hc[e] : (Hc[e] = 0, e + "$");
}
var Wc = class {
	constructor(e = "key") {
		this.key = Uc(e);
	}
	get(e) {
		return e.config.pluginsByKey[this.key];
	}
	getState(e) {
		return e[this.key];
	}
}, Gc = function(e) {
	for (var t = 0;; t++) if (e = e.previousSibling, !e) return t;
}, Kc = function(e) {
	let t = e.assignedSlot || e.parentNode;
	return t && t.nodeType == 11 ? t.host : t;
}, qc = null, Jc = function(e, t, n) {
	let r = qc || (qc = document.createRange());
	return r.setEnd(e, n ?? e.nodeValue.length), r.setStart(e, t || 0), r;
}, Yc = function() {
	qc = null;
}, Xc = function(e, t, n, r) {
	return n && (Qc(e, t, n, r, -1) || Qc(e, t, n, r, 1));
}, Zc = /^(img|br|input|textarea|hr)$/i;
function Qc(e, t, n, r, i) {
	for (;;) {
		if (e == n && t == r) return !0;
		if (t == (i < 0 ? 0 : $c(e))) {
			let n = e.parentNode;
			if (!n || n.nodeType != 1 || rl(e) || Zc.test(e.nodeName) || e.contentEditable == "false") return !1;
			t = Gc(e) + (i < 0 ? 0 : 1), e = n;
		} else if (e.nodeType == 1) {
			let n = e.childNodes[t + (i < 0 ? -1 : 0)];
			if (n.nodeType == 1 && n.contentEditable == "false") if (n.pmViewDesc?.ignoreForSelection) t += i;
			else return !1;
			else e = n, t = i < 0 ? $c(e) : 0;
		} else return !1;
	}
}
function $c(e) {
	return e.nodeType == 3 ? e.nodeValue.length : e.childNodes.length;
}
function el(e, t) {
	for (;;) {
		if (e.nodeType == 3 && t) return e;
		if (e.nodeType == 1 && t > 0) {
			if (e.contentEditable == "false") return null;
			e = e.childNodes[t - 1], t = $c(e);
		} else if (e.parentNode && !rl(e)) t = Gc(e), e = e.parentNode;
		else return null;
	}
}
function tl(e, t) {
	for (;;) {
		if (e.nodeType == 3 && t < e.nodeValue.length) return e;
		if (e.nodeType == 1 && t < e.childNodes.length) {
			if (e.contentEditable == "false") return null;
			e = e.childNodes[t], t = 0;
		} else if (e.parentNode && !rl(e)) t = Gc(e) + 1, e = e.parentNode;
		else return null;
	}
}
function nl(e, t, n) {
	for (let r = t == 0, i = t == $c(e); r || i;) {
		if (e == n) return !0;
		let t = Gc(e);
		if (e = e.parentNode, !e) return !1;
		r = r && t == 0, i = i && t == $c(e);
	}
}
function rl(e) {
	let t;
	for (let n = e; n && !(t = n.pmViewDesc); n = n.parentNode);
	return t && t.node && t.node.isBlock && (t.dom == e || t.contentDOM == e);
}
var il = function(e) {
	return e.focusNode && Xc(e.focusNode, e.focusOffset, e.anchorNode, e.anchorOffset);
};
function al(e, t) {
	let n = document.createEvent("Event");
	return n.initEvent("keydown", !0, !0), n.keyCode = e, n.key = n.code = t, n;
}
function ol(e) {
	let t = e.activeElement;
	for (; t && t.shadowRoot;) t = t.shadowRoot.activeElement;
	return t;
}
function sl(e, t, n) {
	if (e.caretPositionFromPoint) try {
		let r = e.caretPositionFromPoint(t, n);
		if (r) return {
			node: r.offsetNode,
			offset: Math.min($c(r.offsetNode), r.offset)
		};
	} catch {}
	if (e.caretRangeFromPoint) {
		let r = e.caretRangeFromPoint(t, n);
		if (r) return {
			node: r.startContainer,
			offset: Math.min($c(r.startContainer), r.startOffset)
		};
	}
}
var cl = typeof navigator < "u" ? navigator : null, ll = typeof document < "u" ? document : null, ul = cl && cl.userAgent || "", dl = /Edge\/(\d+)/.exec(ul), fl = /MSIE \d/.exec(ul), pl = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(ul), ml = !!(fl || pl || dl), hl = fl ? document.documentMode : pl ? +pl[1] : dl ? +dl[1] : 0, gl = !ml && /gecko\/(\d+)/i.test(ul);
gl && +(/Firefox\/(\d+)/.exec(ul) || [0, 0])[1];
var _l = !ml && /Chrome\/(\d+)/.exec(ul), vl = !!_l, yl = _l ? +_l[1] : 0, bl = !ml && !!cl && /Apple Computer/.test(cl.vendor), xl = bl && (/Mobile\/\w+/.test(ul) || !!cl && cl.maxTouchPoints > 2), Sl = xl || (cl ? /Mac/.test(cl.platform) : !1), Cl = cl ? /Win/.test(cl.platform) : !1, wl = /Android \d/.test(ul), Tl = !!ll && "webkitFontSmoothing" in ll.documentElement.style, El = Tl ? +(/\bAppleWebKit\/(\d+)/.exec(navigator.userAgent) || [0, 0])[1] : 0;
function Dl(e) {
	let t = e.defaultView && e.defaultView.visualViewport;
	return t ? {
		left: 0,
		right: t.width,
		top: 0,
		bottom: t.height
	} : {
		left: 0,
		right: e.documentElement.clientWidth,
		top: 0,
		bottom: e.documentElement.clientHeight
	};
}
function Ol(e, t) {
	return typeof e == "number" ? e : e[t];
}
function kl(e) {
	let t = e.getBoundingClientRect(), n = t.width / e.offsetWidth || 1, r = t.height / e.offsetHeight || 1;
	return {
		left: t.left,
		right: t.left + e.clientWidth * n,
		top: t.top,
		bottom: t.top + e.clientHeight * r
	};
}
function Al(e, t, n) {
	let r = e.someProp("scrollThreshold") || 0, i = e.someProp("scrollMargin") || 5, a = e.dom.ownerDocument;
	for (let o = n || e.dom; o;) {
		if (o.nodeType != 1) {
			o = Kc(o);
			continue;
		}
		let e = o, n = e == a.body, s = n ? Dl(a) : kl(e), c = 0, l = 0;
		if (t.top < s.top + Ol(r, "top") ? l = -(s.top - t.top + Ol(i, "top")) : t.bottom > s.bottom - Ol(r, "bottom") && (l = t.bottom - t.top > s.bottom - s.top ? t.top + Ol(i, "top") - s.top : t.bottom - s.bottom + Ol(i, "bottom")), t.left < s.left + Ol(r, "left") ? c = -(s.left - t.left + Ol(i, "left")) : t.right > s.right - Ol(r, "right") && (c = t.right - s.right + Ol(i, "right")), c || l) if (n) a.defaultView.scrollBy(c, l);
		else {
			let n = e.scrollLeft, r = e.scrollTop;
			l && (e.scrollTop += l), c && (e.scrollLeft += c);
			let i = e.scrollLeft - n, a = e.scrollTop - r;
			t = {
				left: t.left - i,
				top: t.top - a,
				right: t.right - i,
				bottom: t.bottom - a
			};
		}
		let u = n ? "fixed" : getComputedStyle(o).position;
		if (/^(fixed|sticky)$/.test(u)) break;
		o = u == "absolute" ? o.offsetParent : Kc(o);
	}
}
function jl(e) {
	let t = e.dom.getBoundingClientRect(), n = Math.max(0, t.top), r, i;
	for (let a = (t.left + t.right) / 2, o = n + 1; o < Math.min(innerHeight, t.bottom); o += 5) {
		let t = e.root.elementFromPoint(a, o);
		if (!t || t == e.dom || !e.dom.contains(t)) continue;
		let s = t.getBoundingClientRect();
		if (s.top >= n - 20) {
			r = t, i = s.top;
			break;
		}
	}
	return {
		refDOM: r,
		refTop: i,
		stack: Ml(e.dom)
	};
}
function Ml(e) {
	let t = [], n = e.ownerDocument;
	for (let r = e; r && (t.push({
		dom: r,
		top: r.scrollTop,
		left: r.scrollLeft
	}), e != n); r = Kc(r));
	return t;
}
function Nl({ refDOM: e, refTop: t, stack: n }) {
	let r = e ? e.getBoundingClientRect().top : 0;
	Pl(n, r == 0 ? 0 : r - t);
}
function Pl(e, t) {
	for (let n = 0; n < e.length; n++) {
		let { dom: r, top: i, left: a } = e[n];
		r.scrollTop != i + t && (r.scrollTop = i + t), r.scrollLeft != a && (r.scrollLeft = a);
	}
}
var Fl = null;
function Il(e) {
	if (e.setActive) return e.setActive();
	if (Fl) return e.focus(Fl);
	let t = Ml(e);
	e.focus(Fl == null ? { get preventScroll() {
		return Fl = { preventScroll: !0 }, !0;
	} } : void 0), Fl || (Fl = !1, Pl(t, 0));
}
function Ll(e, t) {
	let n, r = 2e8, i, a = 0, o = t.top, s = t.top, c, l;
	for (let u = e.firstChild, d = 0; u; u = u.nextSibling, d++) {
		let e;
		if (u.nodeType == 1) e = u.getClientRects();
		else if (u.nodeType == 3) e = Jc(u).getClientRects();
		else continue;
		for (let f = 0; f < e.length; f++) {
			let p = e[f];
			if (p.top <= o && p.bottom >= s) {
				o = Math.max(p.bottom, o), s = Math.min(p.top, s);
				let e = p.left > t.left ? p.left - t.left : p.right < t.left ? t.left - p.right : 0;
				if (e < r) {
					n = u, r = e, i = e && n.nodeType == 3 ? {
						left: p.right < t.left ? p.right : p.left,
						top: t.top
					} : t, u.nodeType == 1 && e && (a = d + +(t.left >= (p.left + p.right) / 2));
					continue;
				}
			} else p.top > t.top && !c && p.left <= t.left && p.right >= t.left && (c = u, l = {
				left: Math.max(p.left, Math.min(p.right, t.left)),
				top: p.top
			});
			!n && (t.left >= p.right && t.top >= p.top || t.left >= p.left && t.top >= p.bottom) && (a = d + 1);
		}
	}
	return !n && c && (n = c, i = l, r = 0), n && n.nodeType == 3 ? Rl(n, i) : !n || r && n.nodeType == 1 ? {
		node: e,
		offset: a
	} : Ll(n, i);
}
function Rl(e, t) {
	let n = e.nodeValue.length, r = document.createRange(), i;
	for (let a = 0; a < n; a++) {
		r.setEnd(e, a + 1), r.setStart(e, a);
		let n = G(r, 1);
		if (n.top != n.bottom && zl(t, n)) {
			i = {
				node: e,
				offset: a + +(t.left >= (n.left + n.right) / 2)
			};
			break;
		}
	}
	return r.detach(), i || {
		node: e,
		offset: 0
	};
}
function zl(e, t) {
	return e.left >= t.left - 1 && e.left <= t.right + 1 && e.top >= t.top - 1 && e.top <= t.bottom + 1;
}
function Bl(e, t) {
	let n = e.parentNode;
	return n && /^li$/i.test(n.nodeName) && t.left < e.getBoundingClientRect().left ? n : e;
}
function Vl(e, t, n) {
	let { node: r, offset: i } = Ll(t, n), a = -1;
	if (r.nodeType == 1 && !r.firstChild) {
		let e = r.getBoundingClientRect();
		a = e.left != e.right && n.left > (e.left + e.right) / 2 ? 1 : -1;
	}
	return e.docView.posFromDOM(r, i, a);
}
function Hl(e, t, n, r) {
	let i = -1;
	for (let n = t, a = !1; n != e.dom;) {
		let t = e.docView.nearestDesc(n, !0), o;
		if (!t) return null;
		if (t.dom.nodeType == 1 && (t.node.isBlock && t.parent || !t.contentDOM) && ((o = t.dom.getBoundingClientRect()).width || o.height) && (t.node.isBlock && t.parent && !/^T(R|BODY|HEAD|FOOT)$/.test(t.dom.nodeName) && (!a && o.left > r.left || o.top > r.top ? i = t.posBefore : (!a && o.right < r.left || o.bottom < r.top) && (i = t.posAfter), a = !0), !t.contentDOM && i < 0 && !t.node.isText)) return (t.node.isBlock ? r.top < (o.top + o.bottom) / 2 : r.left < (o.left + o.right) / 2) ? t.posBefore : t.posAfter;
		n = t.dom.parentNode;
	}
	return i > -1 ? i : e.docView.posFromDOM(t, n, -1);
}
function U(e, t, n) {
	let r = e.childNodes.length;
	if (r && n.top < n.bottom) for (let i = Math.max(0, Math.min(r - 1, Math.floor(r * (t.top - n.top) / (n.bottom - n.top)) - 2)), a = i;;) {
		let n = e.childNodes[a];
		if (n.nodeType == 1) {
			let e = n.getClientRects();
			for (let r = 0; r < e.length; r++) {
				let i = e[r];
				if (zl(t, i)) return U(n, t, i);
			}
		}
		if ((a = (a + 1) % r) == i) break;
	}
	return e;
}
function Ul(e, t) {
	let n = e.dom.ownerDocument, r, i = 0, a = sl(n, t.left, t.top);
	a && ({node: r, offset: i} = a);
	let o = (e.root.elementFromPoint ? e.root : n).elementFromPoint(t.left, t.top), s;
	if (!o || !e.dom.contains(o.nodeType == 1 ? o : o.parentNode)) {
		let n = e.dom.getBoundingClientRect();
		if (!zl(t, n) || (o = U(e.dom, t, n), !o)) return null;
	}
	if (bl) for (let e = o; r && e; e = Kc(e)) e.draggable && (r = void 0);
	if (o = Bl(o, t), r) {
		if (gl && r.nodeType == 1 && (i = Math.min(i, r.childNodes.length), i < r.childNodes.length)) {
			let e = r.childNodes[i], n;
			e.nodeName == "IMG" && (n = e.getBoundingClientRect()).right <= t.left && n.bottom > t.top && i++;
		}
		let n;
		Tl && i && r.nodeType == 1 && (n = r.childNodes[i - 1]).nodeType == 1 && n.contentEditable == "false" && n.getBoundingClientRect().top >= t.top && i--, r == e.dom && i == r.childNodes.length - 1 && r.lastChild.nodeType == 1 && t.top > r.lastChild.getBoundingClientRect().bottom ? s = e.state.doc.content.size : (i == 0 || r.nodeType != 1 || r.childNodes[i - 1].nodeName != "BR") && (s = Hl(e, r, i, t));
	}
	s ?? (s = Vl(e, o, t));
	let c = e.docView.nearestDesc(o, !0);
	return {
		pos: s,
		inside: c ? c.posAtStart - c.border : -1
	};
}
function W(e) {
	return e.top < e.bottom || e.left < e.right;
}
function G(e, t) {
	let n = e.getClientRects();
	if (n.length) {
		let e = n[t < 0 ? 0 : n.length - 1];
		if (W(e)) return e;
	}
	return Array.prototype.find.call(n, W) || e.getBoundingClientRect();
}
var K = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
function Wl(e, t, n) {
	let { node: r, offset: i, atom: a } = e.docView.domFromPos(t, n < 0 ? -1 : 1), o = Tl || gl;
	if (r.nodeType == 3) if (o && (K.test(r.nodeValue) || (n < 0 ? !i : i == r.nodeValue.length))) {
		let e = G(Jc(r, i, i), n);
		if (gl && i && /\s/.test(r.nodeValue[i - 1]) && i < r.nodeValue.length) {
			let t = G(Jc(r, i - 1, i - 1), -1);
			if (t.top == e.top) {
				let n = G(Jc(r, i, i + 1), -1);
				if (n.top != e.top) return Gl(n, n.left < t.left);
			}
		}
		return e;
	} else {
		let e = i, t = i, a = n < 0 ? 1 : -1;
		return n < 0 && !i ? (t++, a = -1) : n >= 0 && i == r.nodeValue.length ? (e--, a = 1) : n < 0 ? e-- : t++, Gl(G(Jc(r, e, t), a), a < 0);
	}
	if (!e.state.doc.resolve(t - (a || 0)).parent.inlineContent) {
		if (a == null && i && (n < 0 || i == $c(r))) {
			let e = r.childNodes[i - 1];
			if (e.nodeType == 1) return Kl(e.getBoundingClientRect(), !1);
		}
		if (a == null && i < $c(r)) {
			let e = r.childNodes[i];
			if (e.nodeType == 1) return Kl(e.getBoundingClientRect(), !0);
		}
		return Kl(r.getBoundingClientRect(), n >= 0);
	}
	if (a == null && i && (n < 0 || i == $c(r))) {
		let e = r.childNodes[i - 1], t = e.nodeType == 3 ? Jc(e, $c(e) - +!o) : e.nodeType == 1 && (e.nodeName != "BR" || !e.nextSibling) ? e : null;
		if (t) return Gl(G(t, 1), !1);
	}
	if (a == null && i < $c(r)) {
		let e = r.childNodes[i];
		for (; e.pmViewDesc && e.pmViewDesc.ignoreForCoords;) e = e.nextSibling;
		let t = e ? e.nodeType == 3 ? Jc(e, 0, +!o) : e.nodeType == 1 ? e : null : null;
		if (t) return Gl(G(t, -1), !0);
	}
	return Gl(G(r.nodeType == 3 ? Jc(r) : r, -n), n >= 0);
}
function Gl(e, t) {
	if (e.width == 0) return e;
	let n = t ? e.left : e.right;
	return {
		top: e.top,
		bottom: e.bottom,
		left: n,
		right: n
	};
}
function Kl(e, t) {
	if (e.height == 0) return e;
	let n = t ? e.top : e.bottom;
	return {
		top: n,
		bottom: n,
		left: e.left,
		right: e.right
	};
}
function ql(e, t, n) {
	let r = e.state, i = e.root.activeElement;
	r != t && e.updateState(t), i != e.dom && e.focus();
	try {
		return n();
	} finally {
		r != t && e.updateState(r), i != e.dom && i && i.focus();
	}
}
function Jl(e, t, n) {
	let r = t.selection, i = n == "up" ? r.$from : r.$to;
	return ql(e, t, () => {
		let { node: t } = e.docView.domFromPos(i.pos, n == "up" ? -1 : 1);
		for (;;) {
			let n = e.docView.nearestDesc(t, !0);
			if (!n) break;
			if (n.node.isBlock) {
				t = n.contentDOM || n.dom;
				break;
			}
			t = n.dom.parentNode;
		}
		let r = Wl(e, i.pos, 1);
		for (let e = t.firstChild; e; e = e.nextSibling) {
			let t;
			if (e.nodeType == 1) t = e.getClientRects();
			else if (e.nodeType == 3) t = Jc(e, 0, e.nodeValue.length).getClientRects();
			else continue;
			for (let e = 0; e < t.length; e++) {
				let i = t[e];
				if (i.bottom > i.top + 1 && (n == "up" ? r.top - i.top > (i.bottom - r.top) * 2 : i.bottom - r.bottom > (r.bottom - i.top) * 2)) return !1;
			}
		}
		return !0;
	});
}
var Yl = /[\u0590-\u08ac]/;
function Xl(e, t, n) {
	let { $head: r } = t.selection;
	if (!r.parent.isTextblock) return !1;
	let i = r.parentOffset, a = !i, o = i == r.parent.content.size, s = e.domSelection();
	return s ? !Yl.test(r.parent.textContent) || !s.modify ? n == "left" || n == "backward" ? a : o : ql(e, t, () => {
		let { focusNode: t, focusOffset: i, anchorNode: a, anchorOffset: o } = e.domSelectionRange(), c = s.caretBidiLevel;
		s.modify("move", n, "character");
		let l = r.depth ? e.docView.domAfterPos(r.before()) : e.dom, { focusNode: u, focusOffset: d } = e.domSelectionRange(), f = u && !l.contains(u.nodeType == 1 ? u : u.parentNode) || t == u && i == d;
		try {
			s.collapse(a, o), t && (t != a || i != o) && s.extend && s.extend(t, i);
		} catch {}
		return c != null && (s.caretBidiLevel = c), f;
	}) : r.pos == r.start() || r.pos == r.end();
}
var Zl = null, Ql = null, $l = !1;
function eu(e, t, n) {
	return Zl == t && Ql == n ? $l : (Zl = t, Ql = n, $l = n == "up" || n == "down" ? Jl(e, t, n) : Xl(e, t, n));
}
var tu = 0, nu = 1, ru = 2, iu = 3, au = class {
	constructor(e, t, n, r) {
		this.parent = e, this.children = t, this.dom = n, this.contentDOM = r, this.dirty = tu, n.pmViewDesc = this;
	}
	matchesWidget(e) {
		return !1;
	}
	matchesMark(e) {
		return !1;
	}
	matchesNode(e, t, n) {
		return !1;
	}
	matchesHack(e) {
		return !1;
	}
	parseRule() {
		return null;
	}
	stopEvent(e) {
		return !1;
	}
	get size() {
		let e = 0;
		for (let t = 0; t < this.children.length; t++) e += this.children[t].size;
		return e;
	}
	get border() {
		return 0;
	}
	destroy() {
		this.parent = void 0, this.dom.pmViewDesc == this && (this.dom.pmViewDesc = void 0);
		for (let e = 0; e < this.children.length; e++) this.children[e].destroy();
	}
	posBeforeChild(e) {
		for (let t = 0, n = this.posAtStart;; t++) {
			let r = this.children[t];
			if (r == e) return n;
			n += r.size;
		}
	}
	get posBefore() {
		return this.parent.posBeforeChild(this);
	}
	get posAtStart() {
		return this.parent ? this.parent.posBeforeChild(this) + this.border : 0;
	}
	get posAfter() {
		return this.posBefore + this.size;
	}
	get posAtEnd() {
		return this.posAtStart + this.size - 2 * this.border;
	}
	localPosFromDOM(e, t, n) {
		if (this.contentDOM && this.contentDOM.contains(e.nodeType == 1 ? e : e.parentNode)) if (n < 0) {
			let n, r;
			if (e == this.contentDOM) n = e.childNodes[t - 1];
			else {
				for (; e.parentNode != this.contentDOM;) e = e.parentNode;
				n = e.previousSibling;
			}
			for (; n && !((r = n.pmViewDesc) && r.parent == this);) n = n.previousSibling;
			return n ? this.posBeforeChild(r) + r.size : this.posAtStart;
		} else {
			let n, r;
			if (e == this.contentDOM) n = e.childNodes[t];
			else {
				for (; e.parentNode != this.contentDOM;) e = e.parentNode;
				n = e.nextSibling;
			}
			for (; n && !((r = n.pmViewDesc) && r.parent == this);) n = n.nextSibling;
			return n ? this.posBeforeChild(r) : this.posAtEnd;
		}
		let r;
		if (e == this.dom && this.contentDOM) r = t > Gc(this.contentDOM);
		else if (this.contentDOM && this.contentDOM != this.dom && this.dom.contains(this.contentDOM)) r = e.compareDocumentPosition(this.contentDOM) & 2;
		else if (this.dom.firstChild) {
			if (t == 0) for (let t = e;; t = t.parentNode) {
				if (t == this.dom) {
					r = !1;
					break;
				}
				if (t.previousSibling) break;
			}
			if (r == null && t == e.childNodes.length) for (let t = e;; t = t.parentNode) {
				if (t == this.dom) {
					r = !0;
					break;
				}
				if (t.nextSibling) break;
			}
		}
		return r ?? n > 0 ? this.posAtEnd : this.posAtStart;
	}
	nearestDesc(e, t = !1) {
		for (let n = !0, r = e; r; r = r.parentNode) {
			let i = this.getDesc(r), a;
			if (i && (!t || i.node)) if (n && (a = i.nodeDOM) && !(a.nodeType == 1 ? a.contains(e.nodeType == 1 ? e : e.parentNode) : a == e)) n = !1;
			else return i;
		}
	}
	getDesc(e) {
		let t = e.pmViewDesc;
		for (let e = t; e; e = e.parent) if (e == this) return t;
	}
	posFromDOM(e, t, n) {
		for (let r = e; r; r = r.parentNode) {
			let i = this.getDesc(r);
			if (i) return i.localPosFromDOM(e, t, n);
		}
		return -1;
	}
	descAt(e) {
		for (let t = 0, n = 0; t < this.children.length; t++) {
			let r = this.children[t], i = n + r.size;
			if (n == e && i != n) {
				for (; !r.border && r.children.length;) for (let e = 0; e < r.children.length; e++) {
					let t = r.children[e];
					if (t.size) {
						r = t;
						break;
					}
				}
				return r;
			}
			if (e < i) return r.descAt(e - n - r.border);
			n = i;
		}
	}
	domFromPos(e, t) {
		if (!this.contentDOM) return {
			node: this.dom,
			offset: 0,
			atom: e + 1
		};
		let n = 0, r = 0;
		for (let t = 0; n < this.children.length; n++) {
			let i = this.children[n], a = t + i.size;
			if (a > e || i instanceof fu) {
				r = e - t;
				break;
			}
			t = a;
		}
		if (r) return this.children[n].domFromPos(r - this.children[n].border, t);
		for (let e; n && !(e = this.children[n - 1]).size && e instanceof ou && e.side >= 0; n--);
		if (t <= 0) {
			let e, r = !0;
			for (; e = n ? this.children[n - 1] : null, !(!e || e.dom.parentNode == this.contentDOM); n--, r = !1);
			return e && t && r && !e.border && !e.domAtom ? e.domFromPos(e.size, t) : {
				node: this.contentDOM,
				offset: e ? Gc(e.dom) + 1 : 0
			};
		} else {
			let e, r = !0;
			for (; e = n < this.children.length ? this.children[n] : null, !(!e || e.dom.parentNode == this.contentDOM); n++, r = !1);
			return e && r && !e.border && !e.domAtom ? e.domFromPos(0, t) : {
				node: this.contentDOM,
				offset: e ? Gc(e.dom) : this.contentDOM.childNodes.length
			};
		}
	}
	parseRange(e, t, n = 0) {
		if (this.children.length == 0) return {
			node: this.contentDOM,
			from: e,
			to: t,
			fromOffset: 0,
			toOffset: this.contentDOM.childNodes.length
		};
		let r = -1, i = -1;
		for (let a = n, o = 0;; o++) {
			let n = this.children[o], s = a + n.size;
			if (r == -1 && e <= s) {
				let i = a + n.border;
				if (e >= i && t <= s - n.border && n.node && n.contentDOM && this.contentDOM.contains(n.contentDOM)) return n.parseRange(e, t, i);
				e = a;
				for (let t = o; t > 0; t--) {
					let n = this.children[t - 1];
					if (n.size && n.dom.parentNode == this.contentDOM && !n.emptyChildAt(1)) {
						r = Gc(n.dom) + 1;
						break;
					}
					e -= n.size;
				}
				r == -1 && (r = 0);
			}
			if (r > -1 && (s > t || o == this.children.length - 1)) {
				t = s;
				for (let e = o + 1; e < this.children.length; e++) {
					let n = this.children[e];
					if (n.size && n.dom.parentNode == this.contentDOM && !n.emptyChildAt(-1)) {
						i = Gc(n.dom);
						break;
					}
					t += n.size;
				}
				i == -1 && (i = this.contentDOM.childNodes.length);
				break;
			}
			a = s;
		}
		return {
			node: this.contentDOM,
			from: e,
			to: t,
			fromOffset: r,
			toOffset: i
		};
	}
	emptyChildAt(e) {
		if (this.border || !this.contentDOM || !this.children.length) return !1;
		let t = this.children[e < 0 ? 0 : this.children.length - 1];
		return t.size == 0 || t.emptyChildAt(e);
	}
	domAfterPos(e) {
		let { node: t, offset: n } = this.domFromPos(e, 0);
		if (t.nodeType != 1 || n == t.childNodes.length) throw RangeError("No node after pos " + e);
		return t.childNodes[n];
	}
	setSelection(e, t, n, r = !1) {
		let i = Math.min(e, t), a = Math.max(e, t);
		for (let o = 0, s = 0; o < this.children.length; o++) {
			let c = this.children[o], l = s + c.size;
			if (i > s && a < l) return c.setSelection(e - s - c.border, t - s - c.border, n, r);
			s = l;
		}
		let o = this.domFromPos(e, e ? -1 : 1), s = t == e ? o : this.domFromPos(t, t ? -1 : 1), c = n.root.getSelection(), l = n.domSelectionRange(), u = !1;
		if ((gl || bl) && e == t) {
			let { node: e, offset: t } = o;
			if (e.nodeType == 3) {
				if (u = !!(t && e.nodeValue[t - 1] == "\n"), u && t == e.nodeValue.length) for (let t = e, n; t; t = t.parentNode) {
					if (n = t.nextSibling) {
						n.nodeName == "BR" && (o = s = {
							node: n.parentNode,
							offset: Gc(n) + 1
						});
						break;
					}
					let e = t.pmViewDesc;
					if (e && e.node && e.node.isBlock) break;
				}
			} else {
				let n = e.childNodes[t - 1];
				u = n && (n.nodeName == "BR" || n.contentEditable == "false");
			}
		}
		if (gl && l.focusNode && l.focusNode != s.node && l.focusNode.nodeType == 1) {
			let e = l.focusNode.childNodes[l.focusOffset];
			e && e.contentEditable == "false" && (r = !0);
		}
		if (!(r || u && bl) && Xc(o.node, o.offset, l.anchorNode, l.anchorOffset) && Xc(s.node, s.offset, l.focusNode, l.focusOffset)) return;
		let d = !1;
		if ((c.extend || e == t) && !(u && gl)) {
			c.collapse(o.node, o.offset);
			try {
				e != t && c.extend(s.node, s.offset), d = !0;
			} catch {}
		}
		if (!d) {
			if (e > t) {
				let e = o;
				o = s, s = e;
			}
			let n = document.createRange();
			n.setEnd(s.node, s.offset), n.setStart(o.node, o.offset), c.removeAllRanges(), c.addRange(n);
		}
	}
	ignoreMutation(e) {
		return !this.contentDOM && e.type != "selection";
	}
	get contentLost() {
		return this.contentDOM && this.contentDOM != this.dom && !this.dom.contains(this.contentDOM);
	}
	markDirty(e, t) {
		for (let n = 0, r = 0; r < this.children.length; r++) {
			let i = this.children[r], a = n + i.size;
			if (n == a ? e <= a && t >= n : e < a && t > n) {
				let r = n + i.border, o = a - i.border;
				if (e >= r && t <= o) {
					this.dirty = e == n || t == a ? ru : nu, e == r && t == o && (i.contentLost || i.dom.parentNode != this.contentDOM) ? i.dirty = iu : i.markDirty(e - r, t - r);
					return;
				} else i.dirty = i.dom == i.contentDOM && i.dom.parentNode == this.contentDOM && !i.children.length ? ru : iu;
			}
			n = a;
		}
		this.dirty = ru;
	}
	markParentsDirty() {
		let e = 1;
		for (let t = this.parent; t; t = t.parent, e++) {
			let n = e == 1 ? ru : nu;
			t.dirty < n && (t.dirty = n);
		}
	}
	get domAtom() {
		return !1;
	}
	get ignoreForCoords() {
		return !1;
	}
	get ignoreForSelection() {
		return !1;
	}
	isText(e) {
		return !1;
	}
}, ou = class extends au {
	constructor(e, t, n, r) {
		let i, a = t.type.toDOM;
		if (typeof a == "function" && (a = a(n, () => {
			if (!i) return r;
			if (i.parent) return i.parent.posBeforeChild(i);
		})), !t.type.spec.raw) {
			if (a.nodeType != 1) {
				let e = document.createElement("span");
				e.appendChild(a), a = e;
			}
			a.contentEditable = "false", a.classList.add("ProseMirror-widget");
		}
		super(e, [], a, null), this.widget = t, this.widget = t, i = this;
	}
	matchesWidget(e) {
		return this.dirty == tu && e.type.eq(this.widget.type);
	}
	parseRule() {
		return { ignore: !0 };
	}
	stopEvent(e) {
		let t = this.widget.spec.stopEvent;
		return t ? t(e) : !1;
	}
	ignoreMutation(e) {
		return e.type != "selection" || this.widget.spec.ignoreSelection;
	}
	destroy() {
		this.widget.type.destroy(this.dom), super.destroy();
	}
	get domAtom() {
		return !0;
	}
	get ignoreForSelection() {
		return !!this.widget.type.spec.relaxedSide;
	}
	get side() {
		return this.widget.type.side;
	}
}, su = class extends au {
	constructor(e, t, n, r) {
		super(e, [], t, null), this.textDOM = n, this.text = r;
	}
	get size() {
		return this.text.length;
	}
	localPosFromDOM(e, t) {
		return e == this.textDOM ? this.posAtStart + t : this.posAtStart + (t ? this.size : 0);
	}
	domFromPos(e) {
		return {
			node: this.textDOM,
			offset: e
		};
	}
	ignoreMutation(e) {
		return e.type === "characterData" && e.target.nodeValue == e.oldValue;
	}
}, cu = class e extends au {
	constructor(e, t, n, r, i) {
		super(e, [], n, r), this.mark = t, this.spec = i;
	}
	static create(t, n, r, i) {
		let a = i.nodeViews[n.type.name], o = a && a(n, i, r);
		return (!o || !o.dom) && (o = es.renderSpec(document, n.type.spec.toDOM(n, r), null, n.attrs)), new e(t, n, o.dom, o.contentDOM || o.dom, o);
	}
	parseRule() {
		return this.dirty & iu || this.mark.type.spec.reparseInView ? null : {
			mark: this.mark.type.name,
			attrs: this.mark.attrs,
			contentElement: this.contentDOM
		};
	}
	matchesMark(e) {
		return this.dirty != iu && this.mark.eq(e);
	}
	markDirty(e, t) {
		if (super.markDirty(e, t), this.dirty != tu) {
			let e = this.parent;
			for (; !e.node;) e = e.parent;
			e.dirty < this.dirty && (e.dirty = this.dirty), this.dirty = tu;
		}
	}
	slice(t, n, r) {
		let i = e.create(this.parent, this.mark, !0, r), a = this.children, o = this.size;
		n < o && (a = ku(a, n, o, r)), t > 0 && (a = ku(a, 0, t, r));
		for (let e = 0; e < a.length; e++) a[e].parent = i;
		return i.children = a, i;
	}
	ignoreMutation(e) {
		return this.spec.ignoreMutation ? this.spec.ignoreMutation(e) : super.ignoreMutation(e);
	}
	destroy() {
		this.spec.destroy && this.spec.destroy(), super.destroy();
	}
}, lu = class e extends au {
	constructor(e, t, n, r, i, a, o, s, c) {
		super(e, [], i, a), this.node = t, this.outerDeco = n, this.innerDeco = r, this.nodeDOM = o;
	}
	static create(t, n, r, i, a, o) {
		let s = a.nodeViews[n.type.name], c, l = s && s(n, a, () => {
			if (!c) return o;
			if (c.parent) return c.parent.posBeforeChild(c);
		}, r, i), u = l && l.dom, d = l && l.contentDOM;
		if (n.isText) {
			if (!u) u = document.createTextNode(n.text);
			else if (u.nodeType != 3) throw RangeError("Text must be rendered as a DOM text node");
		} else if (!u) {
			let e = es.renderSpec(document, n.type.spec.toDOM(n), null, n.attrs);
			({dom: u, contentDOM: d} = e);
		}
		!d && !n.isText && u.nodeName != "BR" && (u.hasAttribute("contenteditable") || (u.contentEditable = "false"), n.type.spec.draggable && (u.draggable = !0));
		let f = u;
		return u = bu(u, r, n), l ? c = new pu(t, n, r, i, u, d || null, f, l, a, o + 1) : n.isText ? new du(t, n, r, i, u, f, a) : new e(t, n, r, i, u, d || null, f, a, o + 1);
	}
	parseRule() {
		if (this.node.type.spec.reparseInView) return null;
		let e = {
			node: this.node.type.name,
			attrs: this.node.attrs
		};
		if (this.node.type.whitespace == "pre" && (e.preserveWhitespace = "full"), !this.contentDOM) e.getContent = () => this.node.content;
		else if (!this.contentLost) e.contentElement = this.contentDOM;
		else {
			for (let t = this.children.length - 1; t >= 0; t--) {
				let n = this.children[t];
				if (this.dom.contains(n.dom.parentNode)) {
					e.contentElement = n.dom.parentNode;
					break;
				}
			}
			e.contentElement || (e.getContent = () => I.empty);
		}
		return e;
	}
	matchesNode(e, t, n) {
		return this.dirty == tu && e.eq(this.node) && xu(t, this.outerDeco) && n.eq(this.innerDeco);
	}
	get size() {
		return this.node.nodeSize;
	}
	get border() {
		return +!this.node.isLeaf;
	}
	updateChildren(e, t) {
		let n = this.node.inlineContent, r = t, i = e.composing ? this.localCompositionInfo(e, t) : null, a = i && i.pos > -1 ? i : null, o = i && i.pos < 0, s = new Cu(this, a && a.node, e);
		Eu(this.node, this.innerDeco, (t, i, a) => {
			t.spec.marks ? s.syncToMarks(t.spec.marks, n, e, i) : t.type.side >= 0 && !a && s.syncToMarks(i == this.node.childCount ? L.none : this.node.child(i).marks, n, e, i), s.placeWidget(t, e, r);
		}, (t, a, c, l) => {
			s.syncToMarks(t.marks, n, e, l);
			let u;
			s.findNodeMatch(t, a, c, l) || o && e.state.selection.from > r && e.state.selection.to < r + t.nodeSize && (u = s.findIndexWithChild(i.node)) > -1 && s.updateNodeAt(t, a, c, u, e) || s.updateNextNode(t, a, c, e, l, r) || s.addNode(t, a, c, e, r), r += t.nodeSize;
		}), s.syncToMarks([], n, e, 0), this.node.isTextblock && s.addTextblockHacks(), s.destroyRest(), (s.changed || this.dirty == ru) && (a && this.protectLocalComposition(e, a), mu(this.contentDOM, this.children, e), xl && Du(this.dom));
	}
	localCompositionInfo(e, t) {
		let { from: n, to: r } = e.state.selection;
		if (!(e.state.selection instanceof V) || n < t || r > t + this.node.content.size) return null;
		let i = e.input.compositionNode;
		if (!i || !this.dom.contains(i.parentNode)) return null;
		if (this.node.inlineContent) {
			let e = i.nodeValue, a = Ou(this.node.content, e, n - t, r - t);
			return a < 0 ? null : {
				node: i,
				pos: a,
				text: e
			};
		} else return {
			node: i,
			pos: -1,
			text: ""
		};
	}
	protectLocalComposition(e, { node: t, pos: n, text: r }) {
		if (this.getDesc(t)) return;
		let i = t;
		for (; i.parentNode != this.contentDOM; i = i.parentNode) {
			for (; i.previousSibling;) i.parentNode.removeChild(i.previousSibling);
			for (; i.nextSibling;) i.parentNode.removeChild(i.nextSibling);
			i.pmViewDesc && (i.pmViewDesc = void 0);
		}
		let a = new su(this, i, t, r);
		e.input.compositionNodes.push(a), this.children = ku(this.children, n, n + r.length, e, a);
	}
	update(e, t, n, r) {
		return this.dirty == iu || !e.sameMarkup(this.node) ? !1 : (this.updateInner(e, t, n, r), !0);
	}
	updateInner(e, t, n, r) {
		this.updateOuterDeco(t), this.node = e, this.innerDeco = n, this.contentDOM && this.updateChildren(r, this.posAtStart), this.dirty = tu;
	}
	updateOuterDeco(e) {
		if (xu(e, this.outerDeco)) return;
		let t = this.nodeDOM.nodeType != 1, n = this.dom;
		this.dom = vu(this.dom, this.nodeDOM, _u(this.outerDeco, this.node, t), _u(e, this.node, t)), this.dom != n && (n.pmViewDesc = void 0, this.dom.pmViewDesc = this), this.outerDeco = e;
	}
	selectNode() {
		this.nodeDOM.nodeType == 1 && (this.nodeDOM.classList.add("ProseMirror-selectednode"), (this.contentDOM || !this.node.type.spec.draggable) && (this.nodeDOM.draggable = !0));
	}
	deselectNode() {
		this.nodeDOM.nodeType == 1 && (this.nodeDOM.classList.remove("ProseMirror-selectednode"), (this.contentDOM || !this.node.type.spec.draggable) && this.nodeDOM.removeAttribute("draggable"));
	}
	get domAtom() {
		return this.node.isAtom;
	}
};
function uu(e, t, n, r, i) {
	bu(r, t, e);
	let a = new lu(void 0, e, t, n, r, r, r, i, 0);
	return a.contentDOM && a.updateChildren(i, 0), a;
}
var du = class e extends lu {
	constructor(e, t, n, r, i, a, o) {
		super(e, t, n, r, i, null, a, o, 0);
	}
	parseRule() {
		let e = this.nodeDOM.parentNode;
		for (; e && e != this.dom && !e.pmIsDeco;) e = e.parentNode;
		return { skip: e || !0 };
	}
	update(e, t, n, r) {
		return this.dirty == iu || this.dirty != tu && !this.inParent() || !e.sameMarkup(this.node) ? !1 : (this.updateOuterDeco(t), (this.dirty != tu || e.text != this.node.text) && e.text != this.nodeDOM.nodeValue && (this.nodeDOM.nodeValue = e.text, r.trackWrites == this.nodeDOM && (r.trackWrites = null)), this.node = e, this.dirty = tu, !0);
	}
	inParent() {
		let e = this.parent.contentDOM;
		for (let t = this.nodeDOM; t; t = t.parentNode) if (t == e) return !0;
		return !1;
	}
	domFromPos(e) {
		return {
			node: this.nodeDOM,
			offset: e
		};
	}
	localPosFromDOM(e, t, n) {
		return e == this.nodeDOM ? this.posAtStart + Math.min(t, this.node.text.length) : super.localPosFromDOM(e, t, n);
	}
	ignoreMutation(e) {
		return e.type != "characterData" && e.type != "selection";
	}
	slice(t, n, r) {
		let i = this.node.cut(t, n), a = document.createTextNode(i.text);
		return new e(this.parent, i, this.outerDeco, this.innerDeco, a, a, r);
	}
	markDirty(e, t) {
		super.markDirty(e, t), this.dom != this.nodeDOM && (e == 0 || t == this.nodeDOM.nodeValue.length) && (this.dirty = iu);
	}
	get domAtom() {
		return !1;
	}
	isText(e) {
		return this.node.text == e;
	}
}, fu = class extends au {
	parseRule() {
		return { ignore: !0 };
	}
	matchesHack(e) {
		return this.dirty == tu && this.dom.nodeName == e;
	}
	get domAtom() {
		return !0;
	}
	get ignoreForCoords() {
		return this.dom.nodeName == "IMG";
	}
}, pu = class extends lu {
	constructor(e, t, n, r, i, a, o, s, c, l) {
		super(e, t, n, r, i, a, o, c, l), this.spec = s;
	}
	update(e, t, n, r) {
		if (this.dirty == iu) return !1;
		if (this.spec.update && (this.node.type == e.type || this.spec.multiType)) {
			let i = this.spec.update(e, t, n);
			return i && this.updateInner(e, t, n, r), i;
		} else if (!this.contentDOM && !e.isLeaf) return !1;
		else return super.update(e, t, n, r);
	}
	selectNode() {
		this.spec.selectNode ? this.spec.selectNode() : super.selectNode();
	}
	deselectNode() {
		this.spec.deselectNode ? this.spec.deselectNode() : super.deselectNode();
	}
	setSelection(e, t, n, r) {
		this.spec.setSelection ? this.spec.setSelection(e, t, n.root) : super.setSelection(e, t, n, r);
	}
	destroy() {
		this.spec.destroy && this.spec.destroy(), super.destroy();
	}
	stopEvent(e) {
		return this.spec.stopEvent ? this.spec.stopEvent(e) : !1;
	}
	ignoreMutation(e) {
		return this.spec.ignoreMutation ? this.spec.ignoreMutation(e) : super.ignoreMutation(e);
	}
};
function mu(e, t, n) {
	let r = e.firstChild, i = !1;
	for (let a = 0; a < t.length; a++) {
		let o = t[a], s = o.dom;
		if (s.parentNode == e) {
			for (; s != r;) r = Su(r), i = !0;
			r = r.nextSibling;
		} else i = !0, e.insertBefore(s, r);
		if (o instanceof cu) {
			let t = r ? r.previousSibling : e.lastChild;
			mu(o.contentDOM, o.children, n), r = t ? t.nextSibling : e.firstChild;
		}
	}
	for (; r;) r = Su(r), i = !0;
	i && n.trackWrites == e && (n.trackWrites = null);
}
var hu = function(e) {
	e && (this.nodeName = e);
};
hu.prototype = Object.create(null);
var gu = [new hu()];
function _u(e, t, n) {
	if (e.length == 0) return gu;
	let r = n ? gu[0] : new hu(), i = [r];
	for (let a = 0; a < e.length; a++) {
		let o = e[a].type.attrs;
		if (o) {
			o.nodeName && i.push(r = new hu(o.nodeName));
			for (let e in o) {
				let a = o[e];
				a != null && (n && i.length == 1 && i.push(r = new hu(t.isInline ? "span" : "div")), e == "class" ? r.class = (r.class ? r.class + " " : "") + a : e == "style" ? r.style = (r.style ? r.style + ";" : "") + a : e != "nodeName" && (r[e] = a));
			}
		}
	}
	return i;
}
function vu(e, t, n, r) {
	if (n == gu && r == gu) return t;
	let i = t;
	for (let t = 0; t < r.length; t++) {
		let a = r[t], o = n[t];
		if (t) {
			let t;
			o && o.nodeName == a.nodeName && i != e && (t = i.parentNode) && t.nodeName.toLowerCase() == a.nodeName ? i = t : (t = document.createElement(a.nodeName), t.pmIsDeco = !0, t.appendChild(i), o = gu[0], i = t);
		}
		yu(i, o || gu[0], a);
	}
	return i;
}
function yu(e, t, n) {
	for (let r in t) r != "class" && r != "style" && r != "nodeName" && !(r in n) && e.removeAttribute(r);
	for (let r in n) r != "class" && r != "style" && r != "nodeName" && n[r] != t[r] && e.setAttribute(r, n[r]);
	if (t.class != n.class) {
		let r = t.class ? t.class.split(" ").filter(Boolean) : [], i = n.class ? n.class.split(" ").filter(Boolean) : [];
		for (let t = 0; t < r.length; t++) i.indexOf(r[t]) == -1 && e.classList.remove(r[t]);
		for (let t = 0; t < i.length; t++) r.indexOf(i[t]) == -1 && e.classList.add(i[t]);
		e.classList.length == 0 && e.removeAttribute("class");
	}
	if (t.style != n.style) {
		if (t.style) {
			let n = /\s*([\w\-\xa1-\uffff]+)\s*:(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\(.*?\)|[^;])*/g, r;
			for (; r = n.exec(t.style);) e.style.removeProperty(r[1]);
		}
		n.style && (e.style.cssText += n.style);
	}
}
function bu(e, t, n) {
	return vu(e, e, gu, _u(t, n, e.nodeType != 1));
}
function xu(e, t) {
	if (e.length != t.length) return !1;
	for (let n = 0; n < e.length; n++) if (!e[n].type.eq(t[n].type)) return !1;
	return !0;
}
function Su(e) {
	let t = e.nextSibling;
	return e.parentNode.removeChild(e), t;
}
var Cu = class {
	constructor(e, t, n) {
		this.lock = t, this.view = n, this.index = 0, this.stack = [], this.changed = !1, this.top = e, this.preMatch = wu(e.node.content, e);
	}
	destroyBetween(e, t) {
		if (e != t) {
			for (let n = e; n < t; n++) this.top.children[n].destroy();
			this.top.children.splice(e, t - e), this.changed = !0;
		}
	}
	destroyRest() {
		this.destroyBetween(this.index, this.top.children.length);
	}
	syncToMarks(e, t, n, r) {
		let i = 0, a = this.stack.length >> 1, o = Math.min(a, e.length);
		for (; i < o && (i == a - 1 ? this.top : this.stack[i + 1 << 1]).matchesMark(e[i]) && e[i].type.spec.spanning !== !1;) i++;
		for (; i < a;) this.destroyRest(), this.top.dirty = tu, this.index = this.stack.pop(), this.top = this.stack.pop(), a--;
		for (; a < e.length;) {
			this.stack.push(this.top, this.index + 1);
			let i = -1, o = this.top.children.length;
			r < this.preMatch.index && (o = Math.min(this.index + 3, o));
			for (let t = this.index; t < o; t++) {
				let n = this.top.children[t];
				if (n.matchesMark(e[a]) && !this.isLocked(n.dom)) {
					i = t;
					break;
				}
			}
			if (i > -1) i > this.index && (this.changed = !0, this.destroyBetween(this.index, i)), this.top = this.top.children[this.index];
			else {
				let r = cu.create(this.top, e[a], t, n);
				this.top.children.splice(this.index, 0, r), this.top = r, this.changed = !0;
			}
			this.index = 0, a++;
		}
	}
	findNodeMatch(e, t, n, r) {
		let i = -1, a;
		if (r >= this.preMatch.index && (a = this.preMatch.matches[r - this.preMatch.index]).parent == this.top && a.matchesNode(e, t, n)) i = this.top.children.indexOf(a, this.index);
		else for (let r = this.index, a = Math.min(this.top.children.length, r + 5); r < a; r++) {
			let a = this.top.children[r];
			if (a.matchesNode(e, t, n) && !this.preMatch.matched.has(a)) {
				i = r;
				break;
			}
		}
		return i < 0 ? !1 : (this.destroyBetween(this.index, i), this.index++, !0);
	}
	updateNodeAt(e, t, n, r, i) {
		let a = this.top.children[r];
		return a.dirty == iu && a.dom == a.contentDOM && (a.dirty = ru), a.update(e, t, n, i) ? (this.destroyBetween(this.index, r), this.index++, !0) : !1;
	}
	findIndexWithChild(e) {
		for (;;) {
			let t = e.parentNode;
			if (!t) return -1;
			if (t == this.top.contentDOM) {
				let t = e.pmViewDesc;
				if (t) {
					for (let e = this.index; e < this.top.children.length; e++) if (this.top.children[e] == t) return e;
				}
				return -1;
			}
			e = t;
		}
	}
	updateNextNode(e, t, n, r, i, a) {
		for (let o = this.index; o < this.top.children.length; o++) {
			let s = this.top.children[o];
			if (s instanceof lu) {
				let c = this.preMatch.matched.get(s);
				if (c != null && c != i) return !1;
				let l = s.dom, u, d = this.isLocked(l) && !(e.isText && s.node && s.node.isText && s.nodeDOM.nodeValue == e.text && s.dirty != iu && xu(t, s.outerDeco));
				if (!d && s.update(e, t, n, r)) return this.destroyBetween(this.index, o), s.dom != l && (this.changed = !0), this.index++, !0;
				if (!d && (u = this.recreateWrapper(s, e, t, n, r, a))) return this.destroyBetween(this.index, o), this.top.children[this.index] = u, u.contentDOM && (u.dirty = ru, u.updateChildren(r, a + 1), u.dirty = tu), this.changed = !0, this.index++, !0;
				break;
			}
		}
		return !1;
	}
	recreateWrapper(e, t, n, r, i, a) {
		if (e.dirty || t.isAtom || !e.children.length || !e.node.content.eq(t.content) || !xu(n, e.outerDeco) || !r.eq(e.innerDeco)) return null;
		let o = lu.create(this.top, t, n, r, i, a);
		if (o.contentDOM) {
			o.children = e.children, e.children = [];
			for (let e of o.children) e.parent = o;
		}
		return e.destroy(), o;
	}
	addNode(e, t, n, r, i) {
		let a = lu.create(this.top, e, t, n, r, i);
		a.contentDOM && a.updateChildren(r, i + 1), this.top.children.splice(this.index++, 0, a), this.changed = !0;
	}
	placeWidget(e, t, n) {
		let r = this.index < this.top.children.length ? this.top.children[this.index] : null;
		if (r && r.matchesWidget(e) && (e == r.widget || !r.widget.type.toDOM.parentNode)) this.index++;
		else {
			let r = new ou(this.top, e, t, n);
			this.top.children.splice(this.index++, 0, r), this.changed = !0;
		}
	}
	addTextblockHacks() {
		let e = this.top.children[this.index - 1], t = this.top;
		for (; e instanceof cu;) t = e, e = t.children[t.children.length - 1];
		(!e || !(e instanceof du) || /\n$/.test(e.node.text) || this.view.requiresGeckoHackNode && /\s$/.test(e.node.text)) && ((bl || vl) && e && e.dom.contentEditable == "false" && this.addHackNode("IMG", t), this.addHackNode("BR", this.top));
	}
	addHackNode(e, t) {
		if (t == this.top && this.index < t.children.length && t.children[this.index].matchesHack(e)) this.index++;
		else {
			let n = document.createElement(e);
			e == "IMG" && (n.className = "ProseMirror-separator", n.alt = ""), e == "BR" && (n.className = "ProseMirror-trailingBreak");
			let r = new fu(this.top, [], n, null);
			t == this.top ? t.children.splice(this.index++, 0, r) : t.children.push(r), this.changed = !0;
		}
	}
	isLocked(e) {
		return this.lock && (e == this.lock || e.nodeType == 1 && e.contains(this.lock.parentNode));
	}
};
function wu(e, t) {
	let n = t, r = n.children.length, i = e.childCount, a = /* @__PURE__ */ new Map(), o = [];
	outer: for (; i > 0;) {
		let s;
		for (;;) if (r) {
			let e = n.children[r - 1];
			if (e instanceof cu) n = e, r = e.children.length;
			else {
				s = e, r--;
				break;
			}
		} else if (n == t) break outer;
		else r = n.parent.children.indexOf(n), n = n.parent;
		let c = s.node;
		if (c) {
			if (c != e.child(i - 1)) break;
			--i, a.set(s, i), o.push(s);
		}
	}
	return {
		index: i,
		matched: a,
		matches: o.reverse()
	};
}
function Tu(e, t) {
	return e.type.side - t.type.side;
}
function Eu(e, t, n, r) {
	let i = t.locals(e), a = 0;
	if (i.length == 0) {
		for (let n = 0; n < e.childCount; n++) {
			let o = e.child(n);
			r(o, i, t.forChild(a, o), n), a += o.nodeSize;
		}
		return;
	}
	let o = 0, s = [], c = null;
	for (let l = 0;;) {
		let u, d;
		for (; o < i.length && i[o].to == a;) {
			let e = i[o++];
			e.widget && (u ? (d || (d = [u])).push(e) : u = e);
		}
		if (u) if (d) {
			d.sort(Tu);
			for (let e = 0; e < d.length; e++) n(d[e], l, !!c);
		} else n(u, l, !!c);
		let f, p;
		if (c) p = -1, f = c, c = null;
		else if (l < e.childCount) p = l, f = e.child(l++);
		else break;
		for (let e = 0; e < s.length; e++) s[e].to <= a && s.splice(e--, 1);
		for (; o < i.length && i[o].from <= a && i[o].to > a;) s.push(i[o++]);
		let m = a + f.nodeSize;
		if (f.isText) {
			let e = m;
			o < i.length && i[o].from < e && (e = i[o].from);
			for (let t = 0; t < s.length; t++) s[t].to < e && (e = s[t].to);
			e < m && (c = f.cut(e - a), f = f.cut(0, e - a), m = e, p = -1);
		} else for (; o < i.length && i[o].to < m;) o++;
		let h = f.isInline && !f.isLeaf ? s.filter((e) => !e.inline) : s.slice();
		r(f, h, t.forChild(a, f), p), a = m;
	}
}
function Du(e) {
	if (e.nodeName == "UL" || e.nodeName == "OL") {
		let t = e.style.cssText;
		e.style.cssText = t + "; list-style: square !important", window.getComputedStyle(e).listStyle, e.style.cssText = t;
	}
}
function Ou(e, t, n, r) {
	for (let i = 0, a = 0; i < e.childCount && a <= r;) {
		let o = e.child(i++), s = a;
		if (a += o.nodeSize, !o.isText) continue;
		let c = o.text;
		for (; i < e.childCount;) {
			let t = e.child(i++);
			if (a += t.nodeSize, !t.isText) break;
			c += t.text;
		}
		if (a >= n) {
			if (a >= r && c.slice(r - t.length - s, r - s) == t) return r - t.length;
			let e = s < r ? c.lastIndexOf(t, r - s - 1) : -1;
			if (e >= 0 && e + t.length + s >= n) return s + e;
			if (n == r && c.length >= r + t.length - s && c.slice(r - s, r - s + t.length) == t) return r;
		}
	}
	return -1;
}
function ku(e, t, n, r, i) {
	let a = [];
	for (let o = 0, s = 0; o < e.length; o++) {
		let c = e[o], l = s, u = s += c.size;
		l >= n || u <= t ? a.push(c) : (l < t && a.push(c.slice(0, t - l, r)), i && (a.push(i), i = void 0), u > n && a.push(c.slice(n - l, c.size, r)));
	}
	return a;
}
function Au(e, t = null) {
	let n = e.domSelectionRange(), r = e.state.doc;
	if (!n.focusNode) return null;
	let i = e.docView.nearestDesc(n.focusNode), a = i && i.size == 0, o = e.docView.posFromDOM(n.focusNode, n.focusOffset, 1);
	if (o < 0) return null;
	let s = r.resolve(o), c, l;
	if (il(n)) {
		for (c = o; i && !i.node;) i = i.parent;
		let e = i.node;
		if (i && e.isAtom && H.isSelectable(e) && i.parent && !(e.isInline && nl(n.focusNode, n.focusOffset, i.dom))) {
			let e = i.posBefore;
			l = new H(o == e ? s : r.resolve(e));
		}
	} else {
		if (n instanceof e.dom.ownerDocument.defaultView.Selection && n.rangeCount > 1) {
			let t = o, i = o;
			for (let r = 0; r < n.rangeCount; r++) {
				let a = n.getRangeAt(r);
				t = Math.min(t, e.docView.posFromDOM(a.startContainer, a.startOffset, 1)), i = Math.max(i, e.docView.posFromDOM(a.endContainer, a.endOffset, -1));
			}
			if (t < 0) return null;
			[c, o] = i == e.state.selection.anchor ? [i, t] : [t, i], s = r.resolve(o);
		} else c = e.docView.posFromDOM(n.anchorNode, n.anchorOffset, 1);
		if (c < 0) return null;
	}
	let u = r.resolve(c);
	if (!l) {
		let n = t == "pointer" || e.state.selection.head < s.pos && !a ? 1 : -1;
		l = Vu(e, u, s, n);
	}
	return l;
}
function ju(e) {
	return e.editable ? e.hasFocus() : Uu(e) && document.activeElement && document.activeElement.contains(e.dom);
}
function Mu(e, t = !1) {
	let n = e.state.selection;
	if (zu(e, n), ju(e)) {
		if (!t && e.input.mouseDown && e.input.mouseDown.allowDefault && vl) {
			let t = e.domSelectionRange(), n = e.domObserver.currentSelection;
			if (t.anchorNode && n.anchorNode && Xc(t.anchorNode, t.anchorOffset, n.anchorNode, n.anchorOffset)) {
				e.input.mouseDown.delayedSelectionSync = !0, e.domObserver.setCurSelection();
				return;
			}
		}
		if (e.domObserver.disconnectSelection(), e.cursorWrapper) Ru(e);
		else {
			let { anchor: r, head: i } = n, a, o;
			Nu && !(n instanceof V) && (n.$from.parent.inlineContent || (a = Pu(e, n.from)), !n.empty && !n.$from.parent.inlineContent && (o = Pu(e, n.to))), e.docView.setSelection(r, i, e, t), Nu && (a && Iu(a), o && Iu(o)), n.visible ? e.dom.classList.remove("ProseMirror-hideselection") : (e.dom.classList.add("ProseMirror-hideselection"), "onselectionchange" in document && Lu(e));
		}
		e.domObserver.setCurSelection(), e.domObserver.connectSelection();
	}
}
var Nu = bl || vl && yl < 63;
function Pu(e, t) {
	let { node: n, offset: r } = e.docView.domFromPos(t, 0), i = r < n.childNodes.length ? n.childNodes[r] : null, a = r ? n.childNodes[r - 1] : null;
	if (bl && i && i.contentEditable == "false") return Fu(i);
	if ((!i || i.contentEditable == "false") && (!a || a.contentEditable == "false")) {
		if (i) return Fu(i);
		if (a) return Fu(a);
	}
}
function Fu(e) {
	return e.contentEditable = "true", bl && e.draggable && (e.draggable = !1, e.wasDraggable = !0), e;
}
function Iu(e) {
	e.contentEditable = "false", e.wasDraggable && (e.draggable = !0, e.wasDraggable = null);
}
function Lu(e) {
	let t = e.dom.ownerDocument;
	t.removeEventListener("selectionchange", e.input.hideSelectionGuard);
	let n = e.domSelectionRange(), r = n.anchorNode, i = n.anchorOffset;
	t.addEventListener("selectionchange", e.input.hideSelectionGuard = () => {
		(n.anchorNode != r || n.anchorOffset != i) && (t.removeEventListener("selectionchange", e.input.hideSelectionGuard), setTimeout(() => {
			(!ju(e) || e.state.selection.visible) && e.dom.classList.remove("ProseMirror-hideselection");
		}, 20));
	});
}
function Ru(e) {
	let t = e.domSelection();
	if (!t) return;
	let n = e.cursorWrapper.dom, r = n.nodeName == "IMG";
	r ? t.collapse(n.parentNode, Gc(n) + 1) : t.collapse(n, 0), !r && !e.state.selection.visible && ml && hl <= 11 && (n.disabled = !0, n.disabled = !1);
}
function zu(e, t) {
	if (t instanceof H) {
		let n = e.docView.descAt(t.from);
		n != e.lastSelectedViewDesc && (Bu(e), n && n.selectNode(), e.lastSelectedViewDesc = n);
	} else Bu(e);
}
function Bu(e) {
	e.lastSelectedViewDesc && (e.lastSelectedViewDesc.parent && e.lastSelectedViewDesc.deselectNode(), e.lastSelectedViewDesc = void 0);
}
function Vu(e, t, n, r) {
	return e.someProp("createSelectionBetween", (r) => r(e, t, n)) || V.between(t, n, r);
}
function Hu(e) {
	return e.editable && !e.hasFocus() ? !1 : Uu(e);
}
function Uu(e) {
	let t = e.domSelectionRange();
	if (!t.anchorNode) return !1;
	try {
		return e.dom.contains(t.anchorNode.nodeType == 3 ? t.anchorNode.parentNode : t.anchorNode) && (e.editable || e.dom.contains(t.focusNode.nodeType == 3 ? t.focusNode.parentNode : t.focusNode));
	} catch {
		return !1;
	}
}
function Wu(e) {
	let t = e.docView.domFromPos(e.state.selection.anchor, 0), n = e.domSelectionRange();
	return Xc(t.node, t.offset, n.anchorNode, n.anchorOffset);
}
function Gu(e, t) {
	let { $anchor: n, $head: r } = e.selection, i = t > 0 ? n.max(r) : n.min(r), a = i.parent.inlineContent ? i.depth ? e.doc.resolve(t > 0 ? i.after() : i.before()) : null : i;
	return a && B.findFrom(a, t);
}
function Ku(e, t) {
	return e.dispatch(e.state.tr.setSelection(t).scrollIntoView()), !0;
}
function qu(e, t, n) {
	let r = e.state.selection;
	if (r instanceof V) {
		if (n.indexOf("s") > -1) {
			let { $head: n } = r, i = n.textOffset ? null : t < 0 ? n.nodeBefore : n.nodeAfter;
			if (!i || i.isText || !i.isLeaf) return !1;
			let a = e.state.doc.resolve(n.pos + i.nodeSize * (t < 0 ? -1 : 1));
			return Ku(e, new V(r.$anchor, a));
		} else if (!r.empty) return !1;
		else if (e.endOfTextblock(t > 0 ? "forward" : "backward")) {
			let n = Gu(e.state, t);
			return n && n instanceof H ? Ku(e, n) : !1;
		} else if (!(Sl && n.indexOf("m") > -1)) {
			let n = r.$head, i = n.textOffset ? null : t < 0 ? n.nodeBefore : n.nodeAfter, a;
			if (!i || i.isText) return !1;
			let o = t < 0 ? n.pos - i.nodeSize : n.pos;
			return i.isAtom || (a = e.docView.descAt(o)) && !a.contentDOM ? H.isSelectable(i) ? Ku(e, new H(t < 0 ? e.state.doc.resolve(n.pos - i.nodeSize) : n)) : Tl ? Ku(e, new V(e.state.doc.resolve(t < 0 ? o : o + i.nodeSize))) : !1 : !1;
		}
	} else if (r instanceof H && r.node.isInline) return Ku(e, new V(t > 0 ? r.$to : r.$from));
	else {
		let n = Gu(e.state, t);
		return n ? Ku(e, n) : !1;
	}
}
function Ju(e) {
	return e.nodeType == 3 ? e.nodeValue.length : e.childNodes.length;
}
function Yu(e, t) {
	let n = e.pmViewDesc;
	return n && n.size == 0 && (t < 0 || e.nextSibling || e.nodeName != "BR");
}
function q(e, t) {
	return t < 0 ? Xu(e) : Zu(e);
}
function Xu(e) {
	let t = e.domSelectionRange(), n = t.focusNode, r = t.focusOffset;
	if (!n) return;
	let i, a, o = !1;
	for (gl && n.nodeType == 1 && r < Ju(n) && Yu(n.childNodes[r], -1) && (o = !0);;) if (r > 0) {
		if (n.nodeType != 1) break;
		{
			let e = n.childNodes[r - 1];
			if (Yu(e, -1)) i = n, a = --r;
			else if (e.nodeType == 3) n = e, r = n.nodeValue.length;
			else break;
		}
	} else if (Qu(n)) break;
	else {
		let t = n.previousSibling;
		for (; t && Yu(t, -1);) i = n.parentNode, a = Gc(t), t = t.previousSibling;
		if (t) n = t, r = Ju(n);
		else {
			if (n = n.parentNode, n == e.dom) break;
			r = 0;
		}
	}
	o ? td(e, n, r) : i && td(e, i, a);
}
function Zu(e) {
	let t = e.domSelectionRange(), n = t.focusNode, r = t.focusOffset;
	if (!n) return;
	let i = Ju(n), a, o;
	for (;;) if (r < i) {
		if (n.nodeType != 1) break;
		let e = n.childNodes[r];
		if (Yu(e, 1)) a = n, o = ++r;
		else break;
	} else if (Qu(n)) break;
	else {
		let t = n.nextSibling;
		for (; t && Yu(t, 1);) a = t.parentNode, o = Gc(t) + 1, t = t.nextSibling;
		if (t) n = t, r = 0, i = Ju(n);
		else {
			if (n = n.parentNode, n == e.dom) break;
			r = i = 0;
		}
	}
	a && td(e, a, o);
}
function Qu(e) {
	let t = e.pmViewDesc;
	return t && t.node && t.node.isBlock;
}
function $u(e, t) {
	for (; e && t == e.childNodes.length && !rl(e);) t = Gc(e) + 1, e = e.parentNode;
	for (; e && t < e.childNodes.length;) {
		let n = e.childNodes[t];
		if (n.nodeType == 3) return n;
		if (n.nodeType == 1 && n.contentEditable == "false") break;
		e = n, t = 0;
	}
}
function ed(e, t) {
	for (; e && !t && !rl(e);) t = Gc(e), e = e.parentNode;
	for (; e && t;) {
		let n = e.childNodes[t - 1];
		if (n.nodeType == 3) return n;
		if (n.nodeType == 1 && n.contentEditable == "false") break;
		e = n, t = e.childNodes.length;
	}
}
function td(e, t, n) {
	if (t.nodeType != 3) {
		let e, r;
		(r = $u(t, n)) ? (t = r, n = 0) : (e = ed(t, n)) && (t = e, n = e.nodeValue.length);
	}
	let r = e.domSelection();
	if (!r) return;
	if (il(r)) {
		let e = document.createRange();
		e.setEnd(t, n), e.setStart(t, n), r.removeAllRanges(), r.addRange(e);
	} else r.extend && r.extend(t, n);
	e.domObserver.setCurSelection();
	let { state: i } = e;
	setTimeout(() => {
		e.state == i && Mu(e);
	}, 50);
}
function nd(e, t) {
	let n = e.state.doc.resolve(t);
	if (!(vl || Cl) && n.parent.inlineContent) {
		let r = e.coordsAtPos(t);
		if (t > n.start()) {
			let n = e.coordsAtPos(t - 1), i = (n.top + n.bottom) / 2;
			if (i > r.top && i < r.bottom && Math.abs(n.left - r.left) > 1) return n.left < r.left ? "ltr" : "rtl";
		}
		if (t < n.end()) {
			let n = e.coordsAtPos(t + 1), i = (n.top + n.bottom) / 2;
			if (i > r.top && i < r.bottom && Math.abs(n.left - r.left) > 1) return n.left > r.left ? "ltr" : "rtl";
		}
	}
	return getComputedStyle(e.dom).direction == "rtl" ? "rtl" : "ltr";
}
function rd(e, t, n) {
	let r = e.state.selection;
	if (r instanceof V && !r.empty || n.indexOf("s") > -1 || Sl && n.indexOf("m") > -1) return !1;
	let { $from: i, $to: a } = r;
	if (!i.parent.inlineContent || e.endOfTextblock(t < 0 ? "up" : "down")) {
		let n = Gu(e.state, t);
		if (n && n instanceof H) return Ku(e, n);
	}
	if (!i.parent.inlineContent) {
		let n = t < 0 ? i : a, o = r instanceof Dc ? B.near(n, t) : B.findFrom(n, t);
		return o ? Ku(e, o) : !1;
	}
	return !1;
}
function id(e, t) {
	if (!(e.state.selection instanceof V)) return !0;
	let { $head: n, $anchor: r, empty: i } = e.state.selection;
	if (!n.sameParent(r)) return !0;
	if (!i) return !1;
	if (e.endOfTextblock(t > 0 ? "forward" : "backward")) return !0;
	let a = !n.textOffset && (t < 0 ? n.nodeBefore : n.nodeAfter);
	if (a && !a.isText) {
		let r = e.state.tr;
		return t < 0 ? r.delete(n.pos - a.nodeSize, n.pos) : r.delete(n.pos, n.pos + a.nodeSize), e.dispatch(r), !0;
	}
	return !1;
}
function ad(e, t, n) {
	e.domObserver.stop(), t.contentEditable = n, e.domObserver.start();
}
function od(e) {
	if (!bl || e.state.selection.$head.parentOffset > 0) return !1;
	let { focusNode: t, focusOffset: n } = e.domSelectionRange();
	if (t && t.nodeType == 1 && n == 0 && t.firstChild && t.firstChild.contentEditable == "false") {
		let n = t.firstChild;
		ad(e, n, "true"), setTimeout(() => ad(e, n, "false"), 20);
	}
	return !1;
}
function sd(e) {
	let t = "";
	return e.ctrlKey && (t += "c"), e.metaKey && (t += "m"), e.altKey && (t += "a"), e.shiftKey && (t += "s"), t;
}
function cd(e, t) {
	let n = t.keyCode, r = sd(t);
	if (n == 8 || Sl && n == 72 && r == "c") return id(e, -1) || q(e, -1);
	if (n == 46 && !t.shiftKey || Sl && n == 68 && r == "c") return id(e, 1) || q(e, 1);
	if (n == 13 || n == 27) return !0;
	if (n == 37 || Sl && n == 66 && r == "c") {
		let t = n == 37 ? nd(e, e.state.selection.from) == "ltr" ? -1 : 1 : -1;
		return qu(e, t, r) || q(e, t);
	} else if (n == 39 || Sl && n == 70 && r == "c") {
		let t = n == 39 ? nd(e, e.state.selection.from) == "ltr" ? 1 : -1 : 1;
		return qu(e, t, r) || q(e, t);
	} else if (n == 38 || Sl && n == 80 && r == "c") return rd(e, -1, r) || q(e, -1);
	else if (n == 40 || Sl && n == 78 && r == "c") return od(e) || rd(e, 1, r) || q(e, 1);
	else if (r == (Sl ? "m" : "c") && (n == 66 || n == 73 || n == 89 || n == 90)) return !0;
	return !1;
}
function ld(e, t) {
	e.someProp("transformCopied", (n) => {
		t = n(t, e);
	});
	let n = [], { content: r, openStart: i, openEnd: a } = t;
	for (; i > 1 && a > 1 && r.childCount == 1 && r.firstChild.childCount == 1;) {
		i--, a--;
		let e = r.firstChild;
		n.push(e.type.name, e.attrs == e.type.defaultAttrs ? null : e.attrs), r = e.content;
	}
	let o = e.someProp("clipboardSerializer") || es.fromSchema(e.state.schema), s = bd(), c = s.createElement("div");
	c.appendChild(o.serializeFragment(r, { document: s }));
	let l = c.firstChild, u, d = 0;
	for (; l && l.nodeType == 1 && (u = vd[l.nodeName.toLowerCase()]);) {
		for (let e = u.length - 1; e >= 0; e--) {
			let t = s.createElement(u[e]);
			for (; c.firstChild;) t.appendChild(c.firstChild);
			c.appendChild(t), d++;
		}
		l = c.firstChild;
	}
	return l && l.nodeType == 1 && l.setAttribute("data-pm-slice", `${i} ${a}${d ? ` -${d}` : ""} ${JSON.stringify(n)}`), {
		dom: c,
		text: e.someProp("clipboardTextSerializer", (n) => n(t, e)) || t.content.textBetween(0, t.content.size, "\n\n"),
		slice: t
	};
}
function ud(e, t, n, r, i) {
	let a = i.parent.type.spec.code, o, s;
	if (!n && !t) return null;
	let c = !!t && (r || a || !n);
	if (c) {
		if (e.someProp("transformPastedText", (n) => {
			t = n(t, a || r, e);
		}), a) return s = new R(I.from(e.state.schema.text(t.replace(/\r\n?/g, "\n"))), 0, 0), e.someProp("transformPasted", (t) => {
			s = t(s, e, !0);
		}), s;
		let n = e.someProp("clipboardTextParser", (n) => n(t, i, r, e));
		if (n) s = n;
		else {
			let n = i.marks(), { schema: r } = e.state, a = es.fromSchema(r);
			o = document.createElement("div"), t.split(/(?:\r\n?|\n)+/).forEach((e) => {
				let t = o.appendChild(document.createElement("p"));
				e && t.appendChild(a.serializeNode(r.text(e, n)));
			});
		}
	} else e.someProp("transformPastedHTML", (t) => {
		n = t(n, e);
	}), o = Cd(n), Tl && wd(o);
	let l = o && o.querySelector("[data-pm-slice]"), u = l && /^(\d+) (\d+)(?: -(\d+))? (.*)/.exec(l.getAttribute("data-pm-slice") || "");
	if (u && u[3]) for (let e = +u[3]; e > 0; e--) {
		let e = o.firstChild;
		for (; e && e.nodeType != 1;) e = e.nextSibling;
		if (!e) break;
		o = e;
	}
	if (s || (s = (e.someProp("clipboardParser") || e.someProp("domParser") || Bo.fromSchema(e.state.schema)).parseSlice(o, {
		preserveWhitespace: !!(c || u),
		context: i,
		ruleFromNode(e) {
			return e.nodeName == "BR" && !e.nextSibling && e.parentNode && !dd.test(e.parentNode.nodeName) ? { ignore: !0 } : null;
		}
	})), u) s = J(_d(s, +u[1], +u[2]), u[4]);
	else if (s = R.maxOpen(fd(s.content, i), !0), s.openStart || s.openEnd) {
		let e = 0, t = 0;
		for (let t = s.content.firstChild; e < s.openStart && !t.type.spec.isolating; e++, t = t.firstChild);
		for (let e = s.content.lastChild; t < s.openEnd && !e.type.spec.isolating; t++, e = e.lastChild);
		s = _d(s, e, t);
	}
	return e.someProp("transformPasted", (t) => {
		s = t(s, e, c);
	}), s;
}
var dd = /^(a|abbr|acronym|b|cite|code|del|em|i|ins|kbd|label|output|q|ruby|s|samp|span|strong|sub|sup|time|u|tt|var)$/i;
function fd(e, t) {
	if (e.childCount < 2) return e;
	for (let n = t.depth; n >= 0; n--) {
		let r = t.node(n).contentMatchAt(t.index(n)), i, a = [];
		if (e.forEach((e) => {
			if (!a) return;
			let t = r.findWrapping(e.type), n;
			if (!t) return a = null;
			if (n = a.length && i.length && md(t, i, e, a[a.length - 1], 0)) a[a.length - 1] = n;
			else {
				a.length && (a[a.length - 1] = hd(a[a.length - 1], i.length));
				let n = pd(e, t);
				a.push(n), r = r.matchType(n.type), i = t;
			}
		}), a) return I.from(a);
	}
	return e;
}
function pd(e, t, n = 0) {
	for (let r = t.length - 1; r >= n; r--) e = t[r].create(null, I.from(e));
	return e;
}
function md(e, t, n, r, i) {
	if (i < e.length && i < t.length && e[i] == t[i]) {
		let a = md(e, t, n, r.lastChild, i + 1);
		if (a) return r.copy(r.content.replaceChild(r.childCount - 1, a));
		if (r.contentMatchAt(r.childCount).matchType(i == e.length - 1 ? n.type : e[i + 1])) return r.copy(r.content.append(I.from(pd(n, e, i + 1))));
	}
}
function hd(e, t) {
	if (t == 0) return e;
	let n = e.content.replaceChild(e.childCount - 1, hd(e.lastChild, t - 1)), r = e.contentMatchAt(e.childCount).fillBefore(I.empty, !0);
	return e.copy(n.append(r));
}
function gd(e, t, n, r, i, a) {
	let o = t < 0 ? e.firstChild : e.lastChild, s = o.content;
	return e.childCount > 1 && (a = 0), i < r - 1 && (s = gd(s, t, n, r, i + 1, a)), i >= n && (s = t < 0 ? o.contentMatchAt(0).fillBefore(s, a <= i).append(s) : s.append(o.contentMatchAt(o.childCount).fillBefore(I.empty, !0))), e.replaceChild(t < 0 ? 0 : e.childCount - 1, o.copy(s));
}
function _d(e, t, n) {
	return t < e.openStart && (e = new R(gd(e.content, -1, t, e.openStart, 0, e.openEnd), t, e.openEnd)), n < e.openEnd && (e = new R(gd(e.content, 1, n, e.openEnd, 0, 0), e.openStart, n)), e;
}
var vd = {
	thead: ["table"],
	tbody: ["table"],
	tfoot: ["table"],
	caption: ["table"],
	colgroup: ["table"],
	col: ["table", "colgroup"],
	tr: ["table", "tbody"],
	td: [
		"table",
		"tbody",
		"tr"
	],
	th: [
		"table",
		"tbody",
		"tr"
	]
}, yd = null;
function bd() {
	return yd || (yd = document.implementation.createHTMLDocument("title"));
}
var xd = null;
function Sd(e) {
	let t = window.trustedTypes;
	return t ? (xd || (xd = t.defaultPolicy || t.createPolicy("ProseMirrorClipboard", { createHTML: (e) => e })), xd.createHTML(e)) : e;
}
function Cd(e) {
	let t = /^(\s*<meta [^>]*>)*/.exec(e);
	t && (e = e.slice(t[0].length));
	let n = bd().createElement("div"), r = /<([a-z][^>\s]+)/i.exec(e), i;
	if ((i = r && vd[r[1].toLowerCase()]) && (e = i.map((e) => "<" + e + ">").join("") + e + i.map((e) => "</" + e + ">").reverse().join("")), n.innerHTML = Sd(e), i) for (let e = 0; e < i.length; e++) n = n.querySelector(i[e]) || n;
	return n;
}
function wd(e) {
	let t = e.querySelectorAll(vl ? "span:not([class]):not([style])" : "span.Apple-converted-space");
	for (let n = 0; n < t.length; n++) {
		let r = t[n];
		r.childNodes.length == 1 && r.textContent == "\xA0" && r.parentNode && r.parentNode.replaceChild(e.ownerDocument.createTextNode(" "), r);
	}
}
function J(e, t) {
	if (!e.size) return e;
	let n = e.content.firstChild.type.schema, r;
	try {
		r = JSON.parse(t);
	} catch {
		return e;
	}
	let { content: i, openStart: a, openEnd: o } = e;
	for (let e = r.length - 2; e >= 0; e -= 2) {
		let t = n.nodes[r[e]];
		if (!t || t.hasRequiredAttrs()) break;
		i = I.from(t.create(r[e + 1], i)), a++, o++;
	}
	return new R(i, a, o);
}
var Td = {}, Ed = {}, Dd = {
	touchstart: !0,
	touchmove: !0
}, Od = class {
	constructor() {
		this.shiftKey = !1, this.mouseDown = null, this.lastKeyCode = null, this.lastKeyCodeTime = 0, this.lastClick = {
			time: 0,
			x: 0,
			y: 0,
			type: "",
			button: 0
		}, this.lastSelectionOrigin = null, this.lastSelectionTime = 0, this.lastIOSEnter = 0, this.lastIOSEnterFallbackTimeout = -1, this.lastFocus = 0, this.lastTouch = 0, this.lastChromeDelete = 0, this.composing = !1, this.compositionNode = null, this.composingTimeout = -1, this.compositionNodes = [], this.compositionEndedAt = -2e8, this.compositionID = 1, this.badSafariComposition = !1, this.compositionPendingChanges = 0, this.domChangeCount = 0, this.eventHandlers = Object.create(null), this.hideSelectionGuard = null;
	}
};
function kd(e) {
	for (let t in Td) {
		let n = Td[t];
		e.dom.addEventListener(t, e.input.eventHandlers[t] = (t) => {
			Pd(e, t) && !Nd(e, t) && (e.editable || !(t.type in Ed)) && n(e, t);
		}, Dd[t] ? { passive: !0 } : void 0);
	}
	bl && e.dom.addEventListener("input", () => null), Md(e);
}
function Ad(e, t) {
	e.input.lastSelectionOrigin = t, e.input.lastSelectionTime = Date.now();
}
function jd(e) {
	e.domObserver.stop();
	for (let t in e.input.eventHandlers) e.dom.removeEventListener(t, e.input.eventHandlers[t]);
	clearTimeout(e.input.composingTimeout), clearTimeout(e.input.lastIOSEnterFallbackTimeout);
}
function Md(e) {
	e.someProp("handleDOMEvents", (t) => {
		for (let n in t) e.input.eventHandlers[n] || e.dom.addEventListener(n, e.input.eventHandlers[n] = (t) => Nd(e, t));
	});
}
function Nd(e, t) {
	return e.someProp("handleDOMEvents", (n) => {
		let r = n[t.type];
		return r ? r(e, t) || t.defaultPrevented : !1;
	});
}
function Pd(e, t) {
	if (!t.bubbles) return !0;
	if (t.defaultPrevented) return !1;
	for (let n = t.target; n != e.dom; n = n.parentNode) if (!n || n.nodeType == 11 || n.pmViewDesc && n.pmViewDesc.stopEvent(t)) return !1;
	return !0;
}
function Fd(e, t) {
	!Nd(e, t) && Td[t.type] && (e.editable || !(t.type in Ed)) && Td[t.type](e, t);
}
Ed.keydown = (e, t) => {
	let n = t;
	if (e.input.shiftKey = n.keyCode == 16 || n.shiftKey, !Jd(e, n) && (e.input.lastKeyCode = n.keyCode, e.input.lastKeyCodeTime = Date.now(), !(wl && vl && n.keyCode == 13))) if (n.keyCode != 229 && e.domObserver.forceFlush(), xl && n.keyCode == 13 && !n.ctrlKey && !n.altKey && !n.metaKey) {
		let t = Date.now();
		e.input.lastIOSEnter = t, e.input.lastIOSEnterFallbackTimeout = setTimeout(() => {
			e.input.lastIOSEnter == t && (e.someProp("handleKeyDown", (t) => t(e, al(13, "Enter"))), e.input.lastIOSEnter = 0);
		}, 200);
	} else e.someProp("handleKeyDown", (t) => t(e, n)) || cd(e, n) ? n.preventDefault() : Ad(e, "key");
}, Ed.keyup = (e, t) => {
	t.keyCode == 16 && (e.input.shiftKey = !1);
}, Ed.keypress = (e, t) => {
	let n = t;
	if (Jd(e, n) || !n.charCode || n.ctrlKey && !n.altKey || Sl && n.metaKey) return;
	if (e.someProp("handleKeyPress", (t) => t(e, n))) {
		n.preventDefault();
		return;
	}
	let r = e.state.selection;
	if (!(r instanceof V) || !r.$from.sameParent(r.$to)) {
		let t = String.fromCharCode(n.charCode), i = () => e.state.tr.insertText(t).scrollIntoView();
		!/[\r\n]/.test(t) && !e.someProp("handleTextInput", (n) => n(e, r.$from.pos, r.$to.pos, t, i)) && e.dispatch(i()), n.preventDefault();
	}
};
function Id(e) {
	return {
		left: e.clientX,
		top: e.clientY
	};
}
function Ld(e, t) {
	let n = t.x - e.clientX, r = t.y - e.clientY;
	return n * n + r * r < 100;
}
function Y(e, t, n, r, i) {
	if (r == -1) return !1;
	let a = e.state.doc.resolve(r);
	for (let r = a.depth + 1; r > 0; r--) if (e.someProp(t, (t) => r > a.depth ? t(e, n, a.nodeAfter, a.before(r), i, !0) : t(e, n, a.node(r), a.before(r), i, !1))) return !0;
	return !1;
}
function Rd(e, t, n) {
	if (e.focused || e.focus(), e.state.selection.eq(t)) return;
	let r = e.state.tr.setSelection(t);
	n == "pointer" && r.setMeta("pointer", !0), e.dispatch(r);
}
function zd(e, t) {
	if (t == -1) return !1;
	let n = e.state.doc.resolve(t), r = n.nodeAfter;
	return r && r.isAtom && H.isSelectable(r) ? (Rd(e, new H(n), "pointer"), !0) : !1;
}
function Bd(e, t) {
	if (t == -1) return !1;
	let n = e.state.selection, r, i;
	n instanceof H && (r = n.node);
	let a = e.state.doc.resolve(t);
	for (let e = a.depth + 1; e > 0; e--) {
		let t = e > a.depth ? a.nodeAfter : a.node(e);
		if (H.isSelectable(t)) {
			i = r && n.$from.depth > 0 && e >= n.$from.depth && a.before(n.$from.depth + 1) == n.$from.pos ? a.before(n.$from.depth) : a.before(e);
			break;
		}
	}
	return i == null ? !1 : (Rd(e, H.create(e.state.doc, i), "pointer"), !0);
}
function Vd(e, t, n, r, i) {
	return Y(e, "handleClickOn", t, n, r) || e.someProp("handleClick", (n) => n(e, t, r)) || (i ? Bd(e, n) : zd(e, n));
}
function Hd(e, t, n, r) {
	return Y(e, "handleDoubleClickOn", t, n, r) || e.someProp("handleDoubleClick", (n) => n(e, t, r));
}
function Ud(e, t, n, r) {
	return Y(e, "handleTripleClickOn", t, n, r) || e.someProp("handleTripleClick", (n) => n(e, t, r)) || Wd(e, n, r);
}
function Wd(e, t, n) {
	if (n.button != 0) return !1;
	let r = e.state.doc;
	if (t == -1) return r.inlineContent ? (Rd(e, V.create(r, 0, r.content.size), "pointer"), !0) : !1;
	let i = r.resolve(t);
	for (let t = i.depth + 1; t > 0; t--) {
		let n = t > i.depth ? i.nodeAfter : i.node(t), a = i.before(t);
		if (n.inlineContent) Rd(e, V.create(r, a + 1, a + 1 + n.content.size), "pointer");
		else if (H.isSelectable(n)) Rd(e, H.create(r, a), "pointer");
		else continue;
		return !0;
	}
}
function Gd(e) {
	return tf(e);
}
var Kd = Sl ? "metaKey" : "ctrlKey";
Td.mousedown = (e, t) => {
	let n = t;
	e.input.shiftKey = n.shiftKey;
	let r = Gd(e), i = Date.now(), a = "singleClick";
	i - e.input.lastClick.time < 500 && Ld(n, e.input.lastClick) && !n[Kd] && e.input.lastClick.button == n.button && (e.input.lastClick.type == "singleClick" ? a = "doubleClick" : e.input.lastClick.type == "doubleClick" && (a = "tripleClick")), e.input.lastClick = {
		time: i,
		x: n.clientX,
		y: n.clientY,
		type: a,
		button: n.button
	};
	let o = e.posAtCoords(Id(n));
	o && (a == "singleClick" ? (e.input.mouseDown && e.input.mouseDown.done(), e.input.mouseDown = new qd(e, o, n, !!r)) : (a == "doubleClick" ? Hd : Ud)(e, o.pos, o.inside, n) ? n.preventDefault() : Ad(e, "pointer"));
};
var qd = class {
	constructor(e, t, n, r) {
		this.view = e, this.pos = t, this.event = n, this.flushed = r, this.delayedSelectionSync = !1, this.mightDrag = null, this.startDoc = e.state.doc, this.selectNode = !!n[Kd], this.allowDefault = n.shiftKey;
		let i, a;
		if (t.inside > -1) i = e.state.doc.nodeAt(t.inside), a = t.inside;
		else {
			let n = e.state.doc.resolve(t.pos);
			i = n.parent, a = n.depth ? n.before() : 0;
		}
		let o = r ? null : n.target, s = o ? e.docView.nearestDesc(o, !0) : null;
		this.target = s && s.nodeDOM.nodeType == 1 ? s.nodeDOM : null;
		let { selection: c } = e.state;
		n.button == 0 && (i.type.spec.draggable && i.type.spec.selectable !== !1 || c instanceof H && c.from <= a && c.to > a) && (this.mightDrag = {
			node: i,
			pos: a,
			addAttr: !!(this.target && !this.target.draggable),
			setUneditable: !!(this.target && gl && !this.target.hasAttribute("contentEditable"))
		}), this.target && this.mightDrag && (this.mightDrag.addAttr || this.mightDrag.setUneditable) && (this.view.domObserver.stop(), this.mightDrag.addAttr && (this.target.draggable = !0), this.mightDrag.setUneditable && setTimeout(() => {
			this.view.input.mouseDown == this && this.target.setAttribute("contentEditable", "false");
		}, 20), this.view.domObserver.start()), e.root.addEventListener("mouseup", this.up = this.up.bind(this)), e.root.addEventListener("mousemove", this.move = this.move.bind(this)), Ad(e, "pointer");
	}
	done() {
		this.view.root.removeEventListener("mouseup", this.up), this.view.root.removeEventListener("mousemove", this.move), this.mightDrag && this.target && (this.view.domObserver.stop(), this.mightDrag.addAttr && this.target.removeAttribute("draggable"), this.mightDrag.setUneditable && this.target.removeAttribute("contentEditable"), this.view.domObserver.start()), this.delayedSelectionSync && setTimeout(() => Mu(this.view)), this.view.input.mouseDown = null;
	}
	up(e) {
		if (this.done(), !this.view.dom.contains(e.target)) return;
		let t = this.pos;
		this.view.state.doc != this.startDoc && (t = this.view.posAtCoords(Id(e))), this.updateAllowDefault(e), this.allowDefault || !t ? Ad(this.view, "pointer") : Vd(this.view, t.pos, t.inside, e, this.selectNode) ? e.preventDefault() : e.button == 0 && (this.flushed || bl && this.mightDrag && !this.mightDrag.node.isAtom || vl && !this.view.state.selection.visible && Math.min(Math.abs(t.pos - this.view.state.selection.from), Math.abs(t.pos - this.view.state.selection.to)) <= 2) ? (Rd(this.view, B.near(this.view.state.doc.resolve(t.pos)), "pointer"), e.preventDefault()) : Ad(this.view, "pointer");
	}
	move(e) {
		this.updateAllowDefault(e), Ad(this.view, "pointer"), e.buttons == 0 && this.done();
	}
	updateAllowDefault(e) {
		!this.allowDefault && (Math.abs(this.event.x - e.clientX) > 4 || Math.abs(this.event.y - e.clientY) > 4) && (this.allowDefault = !0);
	}
};
Td.touchstart = (e) => {
	e.input.lastTouch = Date.now(), Gd(e), Ad(e, "pointer");
}, Td.touchmove = (e) => {
	e.input.lastTouch = Date.now(), Ad(e, "pointer");
}, Td.contextmenu = (e) => Gd(e);
function Jd(e, t) {
	return e.composing ? !0 : bl && Math.abs(t.timeStamp - e.input.compositionEndedAt) < 500 ? (e.input.compositionEndedAt = -2e8, !0) : !1;
}
var Yd = wl ? 5e3 : -1;
Ed.compositionstart = Ed.compositionupdate = (e) => {
	if (!e.composing) {
		e.domObserver.flush();
		let { state: t } = e, n = t.selection.$to;
		if (t.selection instanceof V && (t.storedMarks || !n.textOffset && n.parentOffset && n.nodeBefore.marks.some((e) => e.type.spec.inclusive === !1) || vl && Cl && Xd(e))) e.markCursor = e.state.storedMarks || n.marks(), tf(e, !0), e.markCursor = null;
		else if (tf(e, !t.selection.empty), gl && t.selection.empty && n.parentOffset && !n.textOffset && n.nodeBefore.marks.length) {
			let t = e.domSelectionRange();
			for (let n = t.focusNode, r = t.focusOffset; n && n.nodeType == 1 && r != 0;) {
				let t = r < 0 ? n.lastChild : n.childNodes[r - 1];
				if (!t) break;
				if (t.nodeType == 3) {
					let n = e.domSelection();
					n && n.collapse(t, t.nodeValue.length);
					break;
				} else n = t, r = -1;
			}
		}
		e.input.composing = !0;
	}
	Zd(e, Yd);
};
function Xd(e) {
	let { focusNode: t, focusOffset: n } = e.domSelectionRange();
	if (!t || t.nodeType != 1 || n >= t.childNodes.length) return !1;
	let r = t.childNodes[n];
	return r.nodeType == 1 && r.contentEditable == "false";
}
Ed.compositionend = (e, t) => {
	e.composing && (e.input.composing = !1, e.input.compositionEndedAt = t.timeStamp, e.input.compositionPendingChanges = e.domObserver.pendingRecords().length ? e.input.compositionID : 0, e.input.compositionNode = null, e.input.badSafariComposition ? e.domObserver.forceFlush() : e.input.compositionPendingChanges && Promise.resolve().then(() => e.domObserver.flush()), e.input.compositionID++, Zd(e, 20));
};
function Zd(e, t) {
	clearTimeout(e.input.composingTimeout), t > -1 && (e.input.composingTimeout = setTimeout(() => tf(e), t));
}
function Qd(e) {
	for (e.composing && (e.input.composing = !1, e.input.compositionEndedAt = ef()); e.input.compositionNodes.length > 0;) e.input.compositionNodes.pop().markParentsDirty();
}
function $d(e) {
	let t = e.domSelectionRange();
	if (!t.focusNode) return null;
	let n = el(t.focusNode, t.focusOffset), r = tl(t.focusNode, t.focusOffset);
	if (n && r && n != r) {
		let t = r.pmViewDesc, i = e.domObserver.lastChangedTextNode;
		if (n == i || r == i) return i;
		if (!t || !t.isText(r.nodeValue)) return r;
		if (e.input.compositionNode == r) {
			let e = n.pmViewDesc;
			if (!(!e || !e.isText(n.nodeValue))) return r;
		}
	}
	return n || r;
}
function ef() {
	let e = document.createEvent("Event");
	return e.initEvent("event", !0, !0), e.timeStamp;
}
function tf(e, t = !1) {
	if (!(wl && e.domObserver.flushingSoon >= 0)) {
		if (e.domObserver.forceFlush(), Qd(e), t || e.docView && e.docView.dirty) {
			let n = Au(e), r = e.state.selection;
			return n && !n.eq(r) ? e.dispatch(e.state.tr.setSelection(n)) : (e.markCursor || t) && !r.$from.node(r.$from.sharedDepth(r.to)).inlineContent ? e.dispatch(e.state.tr.deleteSelection()) : e.updateState(e.state), !0;
		}
		return !1;
	}
}
function nf(e, t) {
	if (!e.dom.parentNode) return;
	let n = e.dom.parentNode.appendChild(document.createElement("div"));
	n.appendChild(t), n.style.cssText = "position: fixed; left: -10000px; top: 10px";
	let r = getSelection(), i = document.createRange();
	i.selectNodeContents(t), e.dom.blur(), r.removeAllRanges(), r.addRange(i), setTimeout(() => {
		n.parentNode && n.parentNode.removeChild(n), e.focus();
	}, 50);
}
var rf = ml && hl < 15 || xl && El < 604;
Td.copy = Ed.cut = (e, t) => {
	let n = t, r = e.state.selection, i = n.type == "cut";
	if (r.empty) return;
	let a = rf ? null : n.clipboardData, { dom: o, text: s } = ld(e, r.content());
	a ? (n.preventDefault(), a.clearData(), a.setData("text/html", o.innerHTML), a.setData("text/plain", s)) : nf(e, o), i && e.dispatch(e.state.tr.deleteSelection().scrollIntoView().setMeta("uiEvent", "cut"));
};
function af(e) {
	return e.openStart == 0 && e.openEnd == 0 && e.content.childCount == 1 ? e.content.firstChild : null;
}
function of(e, t) {
	if (!e.dom.parentNode) return;
	let n = e.input.shiftKey || e.state.selection.$from.parent.type.spec.code, r = e.dom.parentNode.appendChild(document.createElement(n ? "textarea" : "div"));
	n || (r.contentEditable = "true"), r.style.cssText = "position: fixed; left: -10000px; top: 10px", r.focus();
	let i = e.input.shiftKey && e.input.lastKeyCode != 45;
	setTimeout(() => {
		e.focus(), r.parentNode && r.parentNode.removeChild(r), n ? sf(e, r.value, null, i, t) : sf(e, r.textContent, r.innerHTML, i, t);
	}, 50);
}
function sf(e, t, n, r, i) {
	let a = ud(e, t, n, r, e.state.selection.$from);
	if (e.someProp("handlePaste", (t) => t(e, i, a || R.empty))) return !0;
	if (!a) return !1;
	let o = af(a), s = o ? e.state.tr.replaceSelectionWith(o, r) : e.state.tr.replaceSelection(a);
	return e.dispatch(s.scrollIntoView().setMeta("paste", !0).setMeta("uiEvent", "paste")), !0;
}
function cf(e) {
	let t = e.getData("text/plain") || e.getData("Text");
	if (t) return t;
	let n = e.getData("text/uri-list");
	return n ? n.replace(/\r?\n/g, " ") : "";
}
Ed.paste = (e, t) => {
	let n = t;
	if (e.composing && !wl) return;
	let r = rf ? null : n.clipboardData, i = e.input.shiftKey && e.input.lastKeyCode != 45;
	r && sf(e, cf(r), r.getData("text/html"), i, n) ? n.preventDefault() : of(e, n);
};
var lf = class {
	constructor(e, t, n) {
		this.slice = e, this.move = t, this.node = n;
	}
}, uf = Sl ? "altKey" : "ctrlKey";
function df(e, t) {
	let n;
	return e.someProp("dragCopies", (e) => {
		n = n || e(t);
	}), n == null ? !t[uf] : !n;
}
Td.dragstart = (e, t) => {
	let n = t, r = e.input.mouseDown;
	if (r && r.done(), !n.dataTransfer) return;
	let i = e.state.selection, a = i.empty ? null : e.posAtCoords(Id(n)), o;
	if (!(a && a.pos >= i.from && a.pos <= (i instanceof H ? i.to - 1 : i.to))) {
		if (r && r.mightDrag) o = H.create(e.state.doc, r.mightDrag.pos);
		else if (n.target && n.target.nodeType == 1) {
			let t = e.docView.nearestDesc(n.target, !0);
			t && t.node.type.spec.draggable && t != e.docView && (o = H.create(e.state.doc, t.posBefore));
		}
	}
	let { dom: s, text: c, slice: l } = ld(e, (o || e.state.selection).content());
	(!n.dataTransfer.files.length || !vl || yl > 120) && n.dataTransfer.clearData(), n.dataTransfer.setData(rf ? "Text" : "text/html", s.innerHTML), n.dataTransfer.effectAllowed = "copyMove", rf || n.dataTransfer.setData("text/plain", c), e.dragging = new lf(l, df(e, n), o);
}, Td.dragend = (e) => {
	let t = e.dragging;
	window.setTimeout(() => {
		e.dragging == t && (e.dragging = null);
	}, 50);
}, Ed.dragover = Ed.dragenter = (e, t) => t.preventDefault(), Ed.drop = (e, t) => {
	try {
		ff(e, t, e.dragging);
	} finally {
		e.dragging = null;
	}
};
function ff(e, t, n) {
	if (!t.dataTransfer) return;
	let r = e.posAtCoords(Id(t));
	if (!r) return;
	let i = e.state.doc.resolve(r.pos), a = n && n.slice;
	a ? e.someProp("transformPasted", (t) => {
		a = t(a, e, !1);
	}) : a = ud(e, cf(t.dataTransfer), rf ? null : t.dataTransfer.getData("text/html"), !1, i);
	let o = !!(n && df(e, t));
	if (e.someProp("handleDrop", (n) => n(e, t, a || R.empty, o))) {
		t.preventDefault();
		return;
	}
	if (!a) return;
	t.preventDefault();
	let s = a ? tc(e.state.doc, i.pos, a) : i.pos;
	s ?? (s = i.pos);
	let c = e.state.tr;
	if (o) {
		let { node: e } = n;
		e ? e.replace(c) : c.deleteSelection();
	}
	let l = c.mapping.map(s), u = a.openStart == 0 && a.openEnd == 0 && a.content.childCount == 1, d = c.doc;
	if (u ? c.replaceRangeWith(l, l, a.content.firstChild) : c.replaceRange(l, l, a), c.doc.eq(d)) return;
	let f = c.doc.resolve(l);
	if (u && H.isSelectable(a.content.firstChild) && f.nodeAfter && f.nodeAfter.sameMarkup(a.content.firstChild)) c.setSelection(new H(f));
	else {
		let t = c.mapping.map(s);
		c.mapping.maps[c.mapping.maps.length - 1].forEach((e, n, r, i) => t = i), c.setSelection(Vu(e, f, c.doc.resolve(t)));
	}
	e.focus(), e.dispatch(c.setMeta("uiEvent", "drop"));
}
Td.focus = (e) => {
	e.input.lastFocus = Date.now(), e.focused || (e.domObserver.stop(), e.dom.classList.add("ProseMirror-focused"), e.domObserver.start(), e.focused = !0, setTimeout(() => {
		e.docView && e.hasFocus() && !e.domObserver.currentSelection.eq(e.domSelectionRange()) && Mu(e);
	}, 20));
}, Td.blur = (e, t) => {
	let n = t;
	e.focused && (e.domObserver.stop(), e.dom.classList.remove("ProseMirror-focused"), e.domObserver.start(), n.relatedTarget && e.dom.contains(n.relatedTarget) && e.domObserver.currentSelection.clear(), e.focused = !1);
}, Td.beforeinput = (e, t) => {
	if (vl && wl && t.inputType == "deleteContentBackward") {
		e.domObserver.flushSoon();
		let { domChangeCount: t } = e.input;
		setTimeout(() => {
			if (e.input.domChangeCount != t || (e.dom.blur(), e.focus(), e.someProp("handleKeyDown", (t) => t(e, al(8, "Backspace"))))) return;
			let { $cursor: n } = e.state.selection;
			n && n.pos > 0 && e.dispatch(e.state.tr.delete(n.pos - 1, n.pos).scrollIntoView());
		}, 50);
	}
};
for (let e in Ed) Td[e] = Ed[e];
function pf(e, t) {
	if (e == t) return !0;
	for (let n in e) if (e[n] !== t[n]) return !1;
	for (let n in t) if (!(n in e)) return !1;
	return !0;
}
var mf = class e {
	constructor(e, t) {
		this.toDOM = e, this.spec = t || yf, this.side = this.spec.side || 0;
	}
	map(e, t, n, r) {
		let { pos: i, deleted: a } = e.mapResult(t.from + r, this.side < 0 ? -1 : 1);
		return a ? null : new _f(i - n, i - n, this);
	}
	valid() {
		return !0;
	}
	eq(t) {
		return this == t || t instanceof e && (this.spec.key && this.spec.key == t.spec.key || this.toDOM == t.toDOM && pf(this.spec, t.spec));
	}
	destroy(e) {
		this.spec.destroy && this.spec.destroy(e);
	}
}, hf = class e {
	constructor(e, t) {
		this.attrs = e, this.spec = t || yf;
	}
	map(e, t, n, r) {
		let i = e.map(t.from + r, this.spec.inclusiveStart ? -1 : 1) - n, a = e.map(t.to + r, this.spec.inclusiveEnd ? 1 : -1) - n;
		return i >= a ? null : new _f(i, a, this);
	}
	valid(e, t) {
		return t.from < t.to;
	}
	eq(t) {
		return this == t || t instanceof e && pf(this.attrs, t.attrs) && pf(this.spec, t.spec);
	}
	static is(t) {
		return t.type instanceof e;
	}
	destroy() {}
}, gf = class e {
	constructor(e, t) {
		this.attrs = e, this.spec = t || yf;
	}
	map(e, t, n, r) {
		let i = e.mapResult(t.from + r, 1);
		if (i.deleted) return null;
		let a = e.mapResult(t.to + r, -1);
		return a.deleted || a.pos <= i.pos ? null : new _f(i.pos - n, a.pos - n, this);
	}
	valid(e, t) {
		let { index: n, offset: r } = e.content.findIndex(t.from), i;
		return r == t.from && !(i = e.child(n)).isText && r + i.nodeSize == t.to;
	}
	eq(t) {
		return this == t || t instanceof e && pf(this.attrs, t.attrs) && pf(this.spec, t.spec);
	}
	destroy() {}
}, _f = class e {
	constructor(e, t, n) {
		this.from = e, this.to = t, this.type = n;
	}
	copy(t, n) {
		return new e(t, n, this.type);
	}
	eq(e, t = 0) {
		return this.type.eq(e.type) && this.from + t == e.from && this.to + t == e.to;
	}
	map(e, t, n) {
		return this.type.map(e, this, t, n);
	}
	static widget(t, n, r) {
		return new e(t, t, new mf(n, r));
	}
	static inline(t, n, r, i) {
		return new e(t, n, new hf(r, i));
	}
	static node(t, n, r, i) {
		return new e(t, n, new gf(r, i));
	}
	get spec() {
		return this.type.spec;
	}
	get inline() {
		return this.type instanceof hf;
	}
	get widget() {
		return this.type instanceof mf;
	}
}, vf = [], yf = {}, bf = class e {
	constructor(e, t) {
		this.local = e.length ? e : vf, this.children = t.length ? t : vf;
	}
	static create(e, t) {
		return t.length ? Of(t, e, 0, yf) : xf;
	}
	find(e, t, n) {
		let r = [];
		return this.findInner(e ?? 0, t ?? 1e9, r, 0, n), r;
	}
	findInner(e, t, n, r, i) {
		for (let a = 0; a < this.local.length; a++) {
			let o = this.local[a];
			o.from <= t && o.to >= e && (!i || i(o.spec)) && n.push(o.copy(o.from + r, o.to + r));
		}
		for (let a = 0; a < this.children.length; a += 3) if (this.children[a] < t && this.children[a + 1] > e) {
			let o = this.children[a] + 1;
			this.children[a + 2].findInner(e - o, t - o, n, r + o, i);
		}
	}
	map(e, t, n) {
		return this == xf || e.maps.length == 0 ? this : this.mapInner(e, t, 0, 0, n || yf);
	}
	mapInner(t, n, r, i, a) {
		let o;
		for (let e = 0; e < this.local.length; e++) {
			let s = this.local[e].map(t, r, i);
			s && s.type.valid(n, s) ? (o || (o = [])).push(s) : a.onRemove && a.onRemove(this.local[e].spec);
		}
		return this.children.length ? Cf(this.children, o || [], t, n, r, i, a) : o ? new e(o.sort(kf), vf) : xf;
	}
	add(t, n) {
		return n.length ? this == xf ? e.create(t, n) : this.addInner(t, n, 0) : this;
	}
	addInner(t, n, r) {
		let i, a = 0;
		t.forEach((e, t) => {
			let o = t + r, s;
			if (s = Ef(n, e, o)) {
				for (i || (i = this.children.slice()); a < i.length && i[a] < t;) a += 3;
				i[a] == t ? i[a + 2] = i[a + 2].addInner(e, s, o + 1) : i.splice(a, 0, t, t + e.nodeSize, Of(s, e, o + 1, yf)), a += 3;
			}
		});
		let o = wf(a ? Df(n) : n, -r);
		for (let e = 0; e < o.length; e++) o[e].type.valid(t, o[e]) || o.splice(e--, 1);
		return new e(o.length ? this.local.concat(o).sort(kf) : this.local, i || this.children);
	}
	remove(e) {
		return e.length == 0 || this == xf ? this : this.removeInner(e, 0);
	}
	removeInner(t, n) {
		let r = this.children, i = this.local;
		for (let e = 0; e < r.length; e += 3) {
			let i, a = r[e] + n, o = r[e + 1] + n;
			for (let e = 0, n; e < t.length; e++) (n = t[e]) && n.from > a && n.to < o && (t[e] = null, (i || (i = [])).push(n));
			if (!i) continue;
			r == this.children && (r = this.children.slice());
			let s = r[e + 2].removeInner(i, a + 1);
			s == xf ? (r.splice(e, 3), e -= 3) : r[e + 2] = s;
		}
		if (i.length) {
			for (let e = 0, r; e < t.length; e++) if (r = t[e]) for (let e = 0; e < i.length; e++) i[e].eq(r, n) && (i == this.local && (i = this.local.slice()), i.splice(e--, 1));
		}
		return r == this.children && i == this.local ? this : i.length || r.length ? new e(i, r) : xf;
	}
	forChild(t, n) {
		if (this == xf) return this;
		if (n.isLeaf) return e.empty;
		let r, i;
		for (let e = 0; e < this.children.length; e += 3) if (this.children[e] >= t) {
			this.children[e] == t && (r = this.children[e + 2]);
			break;
		}
		let a = t + 1, o = a + n.content.size;
		for (let e = 0; e < this.local.length; e++) {
			let t = this.local[e];
			if (t.from < o && t.to > a && t.type instanceof hf) {
				let e = Math.max(a, t.from) - a, n = Math.min(o, t.to) - a;
				e < n && (i || (i = [])).push(t.copy(e, n));
			}
		}
		if (i) {
			let t = new e(i.sort(kf), vf);
			return r ? new Sf([t, r]) : t;
		}
		return r || xf;
	}
	eq(t) {
		if (this == t) return !0;
		if (!(t instanceof e) || this.local.length != t.local.length || this.children.length != t.children.length) return !1;
		for (let e = 0; e < this.local.length; e++) if (!this.local[e].eq(t.local[e])) return !1;
		for (let e = 0; e < this.children.length; e += 3) if (this.children[e] != t.children[e] || this.children[e + 1] != t.children[e + 1] || !this.children[e + 2].eq(t.children[e + 2])) return !1;
		return !0;
	}
	locals(e) {
		return Af(this.localsInner(e));
	}
	localsInner(e) {
		if (this == xf) return vf;
		if (e.inlineContent || !this.local.some(hf.is)) return this.local;
		let t = [];
		for (let e = 0; e < this.local.length; e++) this.local[e].type instanceof hf || t.push(this.local[e]);
		return t;
	}
	forEachSet(e) {
		e(this);
	}
};
bf.empty = new bf([], []), bf.removeOverlap = Af;
var xf = bf.empty, Sf = class e {
	constructor(e) {
		this.members = e;
	}
	map(t, n) {
		let r = this.members.map((e) => e.map(t, n, yf));
		return e.from(r);
	}
	forChild(t, n) {
		if (n.isLeaf) return bf.empty;
		let r = [];
		for (let i = 0; i < this.members.length; i++) {
			let a = this.members[i].forChild(t, n);
			a != xf && (a instanceof e ? r = r.concat(a.members) : r.push(a));
		}
		return e.from(r);
	}
	eq(t) {
		if (!(t instanceof e) || t.members.length != this.members.length) return !1;
		for (let e = 0; e < this.members.length; e++) if (!this.members[e].eq(t.members[e])) return !1;
		return !0;
	}
	locals(e) {
		let t, n = !0;
		for (let r = 0; r < this.members.length; r++) {
			let i = this.members[r].localsInner(e);
			if (i.length) if (!t) t = i;
			else {
				n && (t = t.slice(), n = !1);
				for (let e = 0; e < i.length; e++) t.push(i[e]);
			}
		}
		return t ? Af(n ? t : t.sort(kf)) : vf;
	}
	static from(t) {
		switch (t.length) {
			case 0: return xf;
			case 1: return t[0];
			default: return new e(t.every((e) => e instanceof bf) ? t : t.reduce((e, t) => e.concat(t instanceof bf ? t : t.members), []));
		}
	}
	forEachSet(e) {
		for (let t = 0; t < this.members.length; t++) this.members[t].forEachSet(e);
	}
};
function Cf(e, t, n, r, i, a, o) {
	let s = e.slice();
	for (let e = 0, t = a; e < n.maps.length; e++) {
		let r = 0;
		n.maps[e].forEach((e, n, i, a) => {
			let o = a - i - (n - e);
			for (let i = 0; i < s.length; i += 3) {
				let a = s[i + 1];
				if (a < 0 || e > a + t - r) continue;
				let c = s[i] + t - r;
				n >= c ? s[i + 1] = e <= c ? -2 : -1 : e >= t && o && (s[i] += o, s[i + 1] += o);
			}
			r += o;
		}), t = n.maps[e].map(t, -1);
	}
	let c = !1;
	for (let t = 0; t < s.length; t += 3) if (s[t + 1] < 0) {
		if (s[t + 1] == -2) {
			c = !0, s[t + 1] = -1;
			continue;
		}
		let l = n.map(e[t] + a), u = l - i;
		if (u < 0 || u >= r.content.size) {
			c = !0;
			continue;
		}
		let d = n.map(e[t + 1] + a, -1) - i, { index: f, offset: p } = r.content.findIndex(u), m = r.maybeChild(f);
		if (m && p == u && p + m.nodeSize == d) {
			let r = s[t + 2].mapInner(n, m, l + 1, e[t] + a + 1, o);
			r == xf ? (s[t + 1] = -2, c = !0) : (s[t] = u, s[t + 1] = d, s[t + 2] = r);
		} else c = !0;
	}
	if (c) {
		let c = Of(Tf(s, e, t, n, i, a, o), r, 0, o);
		t = c.local;
		for (let e = 0; e < s.length; e += 3) s[e + 1] < 0 && (s.splice(e, 3), e -= 3);
		for (let e = 0, t = 0; e < c.children.length; e += 3) {
			let n = c.children[e];
			for (; t < s.length && s[t] < n;) t += 3;
			s.splice(t, 0, c.children[e], c.children[e + 1], c.children[e + 2]);
		}
	}
	return new bf(t.sort(kf), s);
}
function wf(e, t) {
	if (!t || !e.length) return e;
	let n = [];
	for (let r = 0; r < e.length; r++) {
		let i = e[r];
		n.push(new _f(i.from + t, i.to + t, i.type));
	}
	return n;
}
function Tf(e, t, n, r, i, a, o) {
	function s(e, t) {
		for (let a = 0; a < e.local.length; a++) {
			let s = e.local[a].map(r, i, t);
			s ? n.push(s) : o.onRemove && o.onRemove(e.local[a].spec);
		}
		for (let n = 0; n < e.children.length; n += 3) s(e.children[n + 2], e.children[n] + t + 1);
	}
	for (let n = 0; n < e.length; n += 3) e[n + 1] == -1 && s(e[n + 2], t[n] + a + 1);
	return n;
}
function Ef(e, t, n) {
	if (t.isLeaf) return null;
	let r = n + t.nodeSize, i = null;
	for (let t = 0, a; t < e.length; t++) (a = e[t]) && a.from > n && a.to < r && ((i || (i = [])).push(a), e[t] = null);
	return i;
}
function Df(e) {
	let t = [];
	for (let n = 0; n < e.length; n++) e[n] != null && t.push(e[n]);
	return t;
}
function Of(e, t, n, r) {
	let i = [], a = !1;
	t.forEach((t, o) => {
		let s = Ef(e, t, o + n);
		if (s) {
			a = !0;
			let e = Of(s, t, n + o + 1, r);
			e != xf && i.push(o, o + t.nodeSize, e);
		}
	});
	let o = wf(a ? Df(e) : e, -n).sort(kf);
	for (let e = 0; e < o.length; e++) o[e].type.valid(t, o[e]) || (r.onRemove && r.onRemove(o[e].spec), o.splice(e--, 1));
	return o.length || i.length ? new bf(o, i) : xf;
}
function kf(e, t) {
	return e.from - t.from || e.to - t.to;
}
function Af(e) {
	let t = e;
	for (let n = 0; n < t.length - 1; n++) {
		let r = t[n];
		if (r.from != r.to) for (let i = n + 1; i < t.length; i++) {
			let a = t[i];
			if (a.from == r.from) {
				a.to != r.to && (t == e && (t = e.slice()), t[i] = a.copy(a.from, r.to), jf(t, i + 1, a.copy(r.to, a.to)));
				continue;
			} else {
				a.from < r.to && (t == e && (t = e.slice()), t[n] = r.copy(r.from, a.from), jf(t, i, r.copy(a.from, r.to)));
				break;
			}
		}
	}
	return t;
}
function jf(e, t, n) {
	for (; t < e.length && kf(n, e[t]) > 0;) t++;
	e.splice(t, 0, n);
}
function Mf(e) {
	let t = [];
	return e.someProp("decorations", (n) => {
		let r = n(e.state);
		r && r != xf && t.push(r);
	}), e.cursorWrapper && t.push(bf.create(e.state.doc, [e.cursorWrapper.deco])), Sf.from(t);
}
var Nf = {
	childList: !0,
	characterData: !0,
	characterDataOldValue: !0,
	attributes: !0,
	attributeOldValue: !0,
	subtree: !0
}, Pf = ml && hl <= 11, Ff = class {
	constructor() {
		this.anchorNode = null, this.anchorOffset = 0, this.focusNode = null, this.focusOffset = 0;
	}
	set(e) {
		this.anchorNode = e.anchorNode, this.anchorOffset = e.anchorOffset, this.focusNode = e.focusNode, this.focusOffset = e.focusOffset;
	}
	clear() {
		this.anchorNode = this.focusNode = null;
	}
	eq(e) {
		return e.anchorNode == this.anchorNode && e.anchorOffset == this.anchorOffset && e.focusNode == this.focusNode && e.focusOffset == this.focusOffset;
	}
}, If = class {
	constructor(e, t) {
		this.view = e, this.handleDOMChange = t, this.queue = [], this.flushingSoon = -1, this.observer = null, this.currentSelection = new Ff(), this.onCharData = null, this.suppressingSelectionUpdates = !1, this.lastChangedTextNode = null, this.observer = window.MutationObserver && new window.MutationObserver((t) => {
			for (let e = 0; e < t.length; e++) this.queue.push(t[e]);
			ml && hl <= 11 && t.some((e) => e.type == "childList" && e.removedNodes.length || e.type == "characterData" && e.oldValue.length > e.target.nodeValue.length) ? this.flushSoon() : bl && e.composing && t.some((e) => e.type == "childList" && e.target.nodeName == "TR") ? (e.input.badSafariComposition = !0, this.flushSoon()) : this.flush();
		}), Pf && (this.onCharData = (e) => {
			this.queue.push({
				target: e.target,
				type: "characterData",
				oldValue: e.prevValue
			}), this.flushSoon();
		}), this.onSelectionChange = this.onSelectionChange.bind(this);
	}
	flushSoon() {
		this.flushingSoon < 0 && (this.flushingSoon = window.setTimeout(() => {
			this.flushingSoon = -1, this.flush();
		}, 20));
	}
	forceFlush() {
		this.flushingSoon > -1 && (window.clearTimeout(this.flushingSoon), this.flushingSoon = -1, this.flush());
	}
	start() {
		this.observer && (this.observer.takeRecords(), this.observer.observe(this.view.dom, Nf)), this.onCharData && this.view.dom.addEventListener("DOMCharacterDataModified", this.onCharData), this.connectSelection();
	}
	stop() {
		if (this.observer) {
			let e = this.observer.takeRecords();
			if (e.length) {
				for (let t = 0; t < e.length; t++) this.queue.push(e[t]);
				window.setTimeout(() => this.flush(), 20);
			}
			this.observer.disconnect();
		}
		this.onCharData && this.view.dom.removeEventListener("DOMCharacterDataModified", this.onCharData), this.disconnectSelection();
	}
	connectSelection() {
		this.view.dom.ownerDocument.addEventListener("selectionchange", this.onSelectionChange);
	}
	disconnectSelection() {
		this.view.dom.ownerDocument.removeEventListener("selectionchange", this.onSelectionChange);
	}
	suppressSelectionUpdates() {
		this.suppressingSelectionUpdates = !0, setTimeout(() => this.suppressingSelectionUpdates = !1, 50);
	}
	onSelectionChange() {
		if (Hu(this.view)) {
			if (this.suppressingSelectionUpdates) return Mu(this.view);
			if (ml && hl <= 11 && !this.view.state.selection.empty) {
				let e = this.view.domSelectionRange();
				if (e.focusNode && Xc(e.focusNode, e.focusOffset, e.anchorNode, e.anchorOffset)) return this.flushSoon();
			}
			this.flush();
		}
	}
	setCurSelection() {
		this.currentSelection.set(this.view.domSelectionRange());
	}
	ignoreSelectionChange(e) {
		if (!e.focusNode) return !0;
		let t = /* @__PURE__ */ new Set(), n;
		for (let n = e.focusNode; n; n = Kc(n)) t.add(n);
		for (let r = e.anchorNode; r; r = Kc(r)) if (t.has(r)) {
			n = r;
			break;
		}
		let r = n && this.view.docView.nearestDesc(n);
		if (r && r.ignoreMutation({
			type: "selection",
			target: n.nodeType == 3 ? n.parentNode : n
		})) return this.setCurSelection(), !0;
	}
	pendingRecords() {
		if (this.observer) for (let e of this.observer.takeRecords()) this.queue.push(e);
		return this.queue;
	}
	flush() {
		let { view: e } = this;
		if (!e.docView || this.flushingSoon > -1) return;
		let t = this.pendingRecords();
		t.length && (this.queue = []);
		let n = e.domSelectionRange(), r = !this.suppressingSelectionUpdates && !this.currentSelection.eq(n) && Hu(e) && !this.ignoreSelectionChange(n), i = -1, a = -1, o = !1, s = [];
		if (e.editable) for (let e = 0; e < t.length; e++) {
			let n = this.registerMutation(t[e], s);
			n && (i = i < 0 ? n.from : Math.min(n.from, i), a = a < 0 ? n.to : Math.max(n.to, a), n.typeOver && (o = !0));
		}
		if (s.some((e) => e.nodeName == "BR") && (e.input.lastKeyCode == 8 || e.input.lastKeyCode == 46)) {
			for (let e of s) if (e.nodeName == "BR" && e.parentNode) {
				let t = e.nextSibling;
				for (; t && t.nodeType == 1;) {
					if (t.contentEditable == "false") {
						e.parentNode.removeChild(e);
						break;
					}
					t = t.firstChild;
				}
			}
		} else if (gl && s.length) {
			let t = s.filter((e) => e.nodeName == "BR");
			if (t.length == 2) {
				let [e, n] = t;
				e.parentNode && e.parentNode.parentNode == n.parentNode ? n.remove() : e.remove();
			} else {
				let { focusNode: n } = this.currentSelection;
				for (let r of t) {
					let t = r.parentNode;
					t && t.nodeName == "LI" && (!n || Hf(e, n) != t) && r.remove();
				}
			}
		}
		let c = null;
		i < 0 && r && e.input.lastFocus > Date.now() - 200 && Math.max(e.input.lastTouch, e.input.lastClick.time) < Date.now() - 300 && il(n) && (c = Au(e)) && c.eq(B.near(e.state.doc.resolve(0), 1)) ? (e.input.lastFocus = 0, Mu(e), this.currentSelection.set(n), e.scrollToSelection()) : (i > -1 || r) && (i > -1 && (e.docView.markDirty(i, a), zf(e)), e.input.badSafariComposition && (e.input.badSafariComposition = !1, Uf(e, s)), this.handleDOMChange(i, a, o, s), e.docView && e.docView.dirty ? e.updateState(e.state) : this.currentSelection.eq(n) || Mu(e), this.currentSelection.set(n));
	}
	registerMutation(e, t) {
		if (t.indexOf(e.target) > -1) return null;
		let n = this.view.docView.nearestDesc(e.target);
		if (e.type == "attributes" && (n == this.view.docView || e.attributeName == "contenteditable" || e.attributeName == "style" && !e.oldValue && !e.target.getAttribute("style")) || !n || n.ignoreMutation(e)) return null;
		if (e.type == "childList") {
			for (let n = 0; n < e.addedNodes.length; n++) {
				let r = e.addedNodes[n];
				t.push(r), r.nodeType == 3 && (this.lastChangedTextNode = r);
			}
			if (n.contentDOM && n.contentDOM != n.dom && !n.contentDOM.contains(e.target)) return {
				from: n.posBefore,
				to: n.posAfter
			};
			let r = e.previousSibling, i = e.nextSibling;
			if (ml && hl <= 11 && e.addedNodes.length) for (let t = 0; t < e.addedNodes.length; t++) {
				let { previousSibling: n, nextSibling: a } = e.addedNodes[t];
				(!n || Array.prototype.indexOf.call(e.addedNodes, n) < 0) && (r = n), (!a || Array.prototype.indexOf.call(e.addedNodes, a) < 0) && (i = a);
			}
			let a = r && r.parentNode == e.target ? Gc(r) + 1 : 0, o = n.localPosFromDOM(e.target, a, -1), s = i && i.parentNode == e.target ? Gc(i) : e.target.childNodes.length;
			return {
				from: o,
				to: n.localPosFromDOM(e.target, s, 1)
			};
		} else if (e.type == "attributes") return {
			from: n.posAtStart - n.border,
			to: n.posAtEnd + n.border
		};
		else return this.lastChangedTextNode = e.target, {
			from: n.posAtStart,
			to: n.posAtEnd,
			typeOver: e.target.nodeValue == e.oldValue
		};
	}
}, Lf = /* @__PURE__ */ new WeakMap(), Rf = !1;
function zf(e) {
	if (!Lf.has(e) && (Lf.set(e, null), [
		"normal",
		"nowrap",
		"pre-line"
	].indexOf(getComputedStyle(e.dom).whiteSpace) !== -1)) {
		if (e.requiresGeckoHackNode = gl, Rf) return;
		console.warn("ProseMirror expects the CSS white-space property to be set, preferably to 'pre-wrap'. It is recommended to load style/prosemirror.css from the prosemirror-view package."), Rf = !0;
	}
}
function Bf(e, t) {
	let n = t.startContainer, r = t.startOffset, i = t.endContainer, a = t.endOffset, o = e.domAtPos(e.state.selection.anchor);
	return Xc(o.node, o.offset, i, a) && ([n, r, i, a] = [
		i,
		a,
		n,
		r
	]), {
		anchorNode: n,
		anchorOffset: r,
		focusNode: i,
		focusOffset: a
	};
}
function Vf(e, t) {
	if (t.getComposedRanges) {
		let n = t.getComposedRanges(e.root)[0];
		if (n) return Bf(e, n);
	}
	let n;
	function r(e) {
		e.preventDefault(), e.stopImmediatePropagation(), n = e.getTargetRanges()[0];
	}
	return e.dom.addEventListener("beforeinput", r, !0), document.execCommand("indent"), e.dom.removeEventListener("beforeinput", r, !0), n ? Bf(e, n) : null;
}
function Hf(e, t) {
	for (let n = t.parentNode; n && n != e.dom; n = n.parentNode) {
		let t = e.docView.nearestDesc(n, !0);
		if (t && t.node.isBlock) return n;
	}
	return null;
}
function Uf(e, t) {
	let { focusNode: n, focusOffset: r } = e.domSelectionRange();
	for (let i of t) if (i.parentNode?.nodeName == "TR") {
		let t = i.nextSibling;
		for (; t && t.nodeName != "TD" && t.nodeName != "TH";) t = t.nextSibling;
		if (t) {
			let a = t;
			for (;;) {
				let e = a.firstChild;
				if (!e || e.nodeType != 1 || e.contentEditable == "false" || /^(BR|IMG)$/.test(e.nodeName)) break;
				a = e;
			}
			a.insertBefore(i, a.firstChild), n == i && e.domSelection().collapse(i, r);
		} else i.parentNode.removeChild(i);
	}
}
function Wf(e, t, n) {
	let { node: r, fromOffset: i, toOffset: a, from: o, to: s } = e.docView.parseRange(t, n), c = e.domSelectionRange(), l, u = c.anchorNode;
	if (u && e.dom.contains(u.nodeType == 1 ? u : u.parentNode) && (l = [{
		node: u,
		offset: c.anchorOffset
	}], il(c) || l.push({
		node: c.focusNode,
		offset: c.focusOffset
	})), vl && e.input.lastKeyCode === 8) for (let e = a; e > i; e--) {
		let t = r.childNodes[e - 1], n = t.pmViewDesc;
		if (t.nodeName == "BR" && !n) {
			a = e;
			break;
		}
		if (!n || n.size) break;
	}
	let d = e.state.doc, f = e.someProp("domParser") || Bo.fromSchema(e.state.schema), p = d.resolve(o), m = null, h = f.parse(r, {
		topNode: p.parent,
		topMatch: p.parent.contentMatchAt(p.index()),
		topOpen: !0,
		from: i,
		to: a,
		preserveWhitespace: p.parent.type.whitespace == "pre" ? "full" : !0,
		findPositions: l,
		ruleFromNode: Gf,
		context: p
	});
	if (l && l[0].pos != null) {
		let e = l[0].pos, t = l[1] && l[1].pos;
		t ?? (t = e), m = {
			anchor: e + o,
			head: t + o
		};
	}
	return {
		doc: h,
		sel: m,
		from: o,
		to: s
	};
}
function Gf(e) {
	let t = e.pmViewDesc;
	if (t) return t.parseRule();
	if (e.nodeName == "BR" && e.parentNode) {
		if (bl && /^(ul|ol)$/i.test(e.parentNode.nodeName)) {
			let e = document.createElement("div");
			return e.appendChild(document.createElement("li")), { skip: e };
		} else if (e.parentNode.lastChild == e || bl && /^(tr|table)$/i.test(e.parentNode.nodeName)) return { ignore: !0 };
	} else if (e.nodeName == "IMG" && e.getAttribute("mark-placeholder")) return { ignore: !0 };
	return null;
}
var Kf = /^(a|abbr|acronym|b|bd[io]|big|br|button|cite|code|data(list)?|del|dfn|em|i|img|ins|kbd|label|map|mark|meter|output|q|ruby|s|samp|small|span|strong|su[bp]|time|u|tt|var)$/i;
function qf(e, t, n, r, i) {
	let a = e.input.compositionPendingChanges || (e.composing ? e.input.compositionID : 0);
	if (e.input.compositionPendingChanges = 0, t < 0) {
		let t = e.input.lastSelectionTime > Date.now() - 50 ? e.input.lastSelectionOrigin : null, n = Au(e, t);
		if (n && !e.state.selection.eq(n)) {
			if (vl && wl && e.input.lastKeyCode === 13 && Date.now() - 100 < e.input.lastKeyCodeTime && e.someProp("handleKeyDown", (t) => t(e, al(13, "Enter")))) return;
			let r = e.state.tr.setSelection(n);
			t == "pointer" ? r.setMeta("pointer", !0) : t == "key" && r.scrollIntoView(), a && r.setMeta("composition", a), e.dispatch(r);
		}
		return;
	}
	let o = e.state.doc.resolve(t), s = o.sharedDepth(n);
	t = o.before(s + 1), n = e.state.doc.resolve(n).after(s + 1);
	let c = e.state.selection, l = Wf(e, t, n), u = e.state.doc, d = u.slice(l.from, l.to), f, p;
	e.input.lastKeyCode === 8 && Date.now() - 100 < e.input.lastKeyCodeTime ? (f = e.state.selection.to, p = "end") : (f = e.state.selection.from, p = "start"), e.input.lastKeyCode = null;
	let m = Qf(d.content, l.doc.content, l.from, f, p);
	if (m && e.input.domChangeCount++, (xl && e.input.lastIOSEnter > Date.now() - 225 || wl) && i.some((e) => e.nodeType == 1 && !Kf.test(e.nodeName)) && (!m || m.endA >= m.endB) && e.someProp("handleKeyDown", (t) => t(e, al(13, "Enter")))) {
		e.input.lastIOSEnter = 0;
		return;
	}
	if (!m) if (r && c instanceof V && !c.empty && c.$head.sameParent(c.$anchor) && !e.composing && !(l.sel && l.sel.anchor != l.sel.head)) m = {
		start: c.from,
		endA: c.to,
		endB: c.to
	};
	else {
		if (l.sel) {
			let t = Jf(e, e.state.doc, l.sel);
			if (t && !t.eq(e.state.selection)) {
				let n = e.state.tr.setSelection(t);
				a && n.setMeta("composition", a), e.dispatch(n);
			}
		}
		return;
	}
	e.state.selection.from < e.state.selection.to && m.start == m.endB && e.state.selection instanceof V && (m.start > e.state.selection.from && m.start <= e.state.selection.from + 2 && e.state.selection.from >= l.from ? m.start = e.state.selection.from : m.endA < e.state.selection.to && m.endA >= e.state.selection.to - 2 && e.state.selection.to <= l.to && (m.endB += e.state.selection.to - m.endA, m.endA = e.state.selection.to)), ml && hl <= 11 && m.endB == m.start + 1 && m.endA == m.start && m.start > l.from && l.doc.textBetween(m.start - l.from - 1, m.start - l.from + 1) == " \xA0" && (m.start--, m.endA--, m.endB--);
	let h = l.doc.resolveNoCache(m.start - l.from), g = l.doc.resolveNoCache(m.endB - l.from), _ = u.resolve(m.start), v = h.sameParent(g) && h.parent.inlineContent && _.end() >= m.endA;
	if ((xl && e.input.lastIOSEnter > Date.now() - 225 && (!v || i.some((e) => e.nodeName == "DIV" || e.nodeName == "P")) || !v && h.pos < l.doc.content.size && (!h.sameParent(g) || !h.parent.inlineContent) && h.pos < g.pos && !/\S/.test(l.doc.textBetween(h.pos, g.pos, "", ""))) && e.someProp("handleKeyDown", (t) => t(e, al(13, "Enter")))) {
		e.input.lastIOSEnter = 0;
		return;
	}
	if (e.state.selection.anchor > m.start && Xf(u, m.start, m.endA, h, g) && e.someProp("handleKeyDown", (t) => t(e, al(8, "Backspace")))) {
		wl && vl && e.domObserver.suppressSelectionUpdates();
		return;
	}
	vl && m.endB == m.start && (e.input.lastChromeDelete = Date.now()), wl && !v && h.start() != g.start() && g.parentOffset == 0 && h.depth == g.depth && l.sel && l.sel.anchor == l.sel.head && l.sel.head == m.endA && (m.endB -= 2, g = l.doc.resolveNoCache(m.endB - l.from), setTimeout(() => {
		e.someProp("handleKeyDown", function(t) {
			return t(e, al(13, "Enter"));
		});
	}, 20));
	let y = m.start, b = m.endA, x = (t) => {
		let n = t || e.state.tr.replace(y, b, l.doc.slice(m.start - l.from, m.endB - l.from));
		if (l.sel) {
			let t = Jf(e, n.doc, l.sel);
			t && !(vl && e.composing && t.empty && (m.start != m.endB || e.input.lastChromeDelete < Date.now() - 100) && (t.head == y || t.head == n.mapping.map(b) - 1) || ml && t.empty && t.head == y) && n.setSelection(t);
		}
		return a && n.setMeta("composition", a), n.scrollIntoView();
	}, S;
	if (v) if (h.pos == g.pos) {
		ml && hl <= 11 && h.parentOffset == 0 && (e.domObserver.suppressSelectionUpdates(), setTimeout(() => Mu(e), 20));
		let t = x(e.state.tr.delete(y, b)), n = u.resolve(m.start).marksAcross(u.resolve(m.endA));
		n && t.ensureMarks(n), e.dispatch(t);
	} else if (m.endA == m.endB && (S = Yf(h.parent.content.cut(h.parentOffset, g.parentOffset), _.parent.content.cut(_.parentOffset, m.endA - _.start())))) {
		let t = x(e.state.tr);
		S.type == "add" ? t.addMark(y, b, S.mark) : t.removeMark(y, b, S.mark), e.dispatch(t);
	} else if (h.parent.child(h.index()).isText && h.index() == g.index() - +!g.textOffset) {
		let t = h.parent.textBetween(h.parentOffset, g.parentOffset), n = () => x(e.state.tr.insertText(t, y, b));
		e.someProp("handleTextInput", (r) => r(e, y, b, t, n)) || e.dispatch(n());
	} else e.dispatch(x());
	else e.dispatch(x());
}
function Jf(e, t, n) {
	return Math.max(n.anchor, n.head) > t.content.size ? null : Vu(e, t.resolve(n.anchor), t.resolve(n.head));
}
function Yf(e, t) {
	let n = e.firstChild.marks, r = t.firstChild.marks, i = n, a = r, o, s, c;
	for (let e = 0; e < r.length; e++) i = r[e].removeFromSet(i);
	for (let e = 0; e < n.length; e++) a = n[e].removeFromSet(a);
	if (i.length == 1 && a.length == 0) s = i[0], o = "add", c = (e) => e.mark(s.addToSet(e.marks));
	else if (i.length == 0 && a.length == 1) s = a[0], o = "remove", c = (e) => e.mark(s.removeFromSet(e.marks));
	else return null;
	let l = [];
	for (let e = 0; e < t.childCount; e++) l.push(c(t.child(e)));
	if (I.from(l).eq(e)) return {
		mark: s,
		type: o
	};
}
function Xf(e, t, n, r, i) {
	if (n - t <= i.pos - r.pos || Zf(r, !0, !1) < i.pos) return !1;
	let a = e.resolve(t);
	if (!r.parent.isTextblock) {
		let e = a.nodeAfter;
		return e != null && n == t + e.nodeSize;
	}
	if (a.parentOffset < a.parent.content.size || !a.parent.isTextblock) return !1;
	let o = e.resolve(Zf(a, !0, !0));
	return !o.parent.isTextblock || o.pos > n || Zf(o, !0, !1) < n ? !1 : r.parent.content.cut(r.parentOffset).eq(o.parent.content);
}
function Zf(e, t, n) {
	let r = e.depth, i = t ? e.end() : e.pos;
	for (; r > 0 && (t || e.indexAfter(r) == e.node(r).childCount);) r--, i++, t = !1;
	if (n) {
		let t = e.node(r).maybeChild(e.indexAfter(r));
		for (; t && !t.isLeaf;) t = t.firstChild, i++;
	}
	return i;
}
function Qf(e, t, n, r, i) {
	let a = e.findDiffStart(t, n);
	if (a == null) return null;
	let { a: o, b: s } = e.findDiffEnd(t, n + e.size, n + t.size);
	if (i == "end") {
		let e = Math.max(0, a - Math.min(o, s));
		r -= o + e - a;
	}
	if (o < a && e.size < t.size) {
		let e = r <= a && r >= o ? a - r : 0;
		a -= e, a && a < t.size && $f(t.textBetween(a - 1, a + 1)) && (a += e ? 1 : -1), s = a + (s - o), o = a;
	} else if (s < a) {
		let t = r <= a && r >= s ? a - r : 0;
		a -= t, a && a < e.size && $f(e.textBetween(a - 1, a + 1)) && (a += t ? 1 : -1), o = a + (o - s), s = a;
	}
	return {
		start: a,
		endA: o,
		endB: s
	};
}
function $f(e) {
	if (e.length != 2) return !1;
	let t = e.charCodeAt(0), n = e.charCodeAt(1);
	return t >= 56320 && t <= 57343 && n >= 55296 && n <= 56319;
}
var ep = class {
	constructor(e, t) {
		this._root = null, this.focused = !1, this.trackWrites = null, this.mounted = !1, this.markCursor = null, this.cursorWrapper = null, this.lastSelectedViewDesc = void 0, this.input = new Od(), this.prevDirectPlugins = [], this.pluginViews = [], this.requiresGeckoHackNode = !1, this.dragging = null, this._props = t, this.state = t.state, this.directPlugins = t.plugins || [], this.directPlugins.forEach(sp), this.dispatch = this.dispatch.bind(this), this.dom = e && e.mount || document.createElement("div"), e && (e.appendChild ? e.appendChild(this.dom) : typeof e == "function" ? e(this.dom) : e.mount && (this.mounted = !0)), this.editable = rp(this), np(this), this.nodeViews = ap(this), this.docView = uu(this.state.doc, tp(this), Mf(this), this.dom, this), this.domObserver = new If(this, (e, t, n, r) => qf(this, e, t, n, r)), this.domObserver.start(), kd(this), this.updatePluginViews();
	}
	get composing() {
		return this.input.composing;
	}
	get props() {
		if (this._props.state != this.state) {
			let e = this._props;
			this._props = {};
			for (let t in e) this._props[t] = e[t];
			this._props.state = this.state;
		}
		return this._props;
	}
	update(e) {
		e.handleDOMEvents != this._props.handleDOMEvents && Md(this);
		let t = this._props;
		this._props = e, e.plugins && (e.plugins.forEach(sp), this.directPlugins = e.plugins), this.updateStateInner(e.state, t);
	}
	setProps(e) {
		let t = {};
		for (let e in this._props) t[e] = this._props[e];
		t.state = this.state;
		for (let n in e) t[n] = e[n];
		this.update(t);
	}
	updateState(e) {
		this.updateStateInner(e, this._props);
	}
	updateStateInner(e, t) {
		let n = this.state, r = !1, i = !1;
		e.storedMarks && this.composing && (Qd(this), i = !0), this.state = e;
		let a = n.plugins != e.plugins || this._props.plugins != t.plugins;
		if (a || this._props.plugins != t.plugins || this._props.nodeViews != t.nodeViews) {
			let e = ap(this);
			op(e, this.nodeViews) && (this.nodeViews = e, r = !0);
		}
		(a || t.handleDOMEvents != this._props.handleDOMEvents) && Md(this), this.editable = rp(this), np(this);
		let o = Mf(this), s = tp(this), c = n.plugins != e.plugins && !n.doc.eq(e.doc) ? "reset" : e.scrollToSelection > n.scrollToSelection ? "to selection" : "preserve", l = r || !this.docView.matchesNode(e.doc, s, o);
		(l || !e.selection.eq(n.selection)) && (i = !0);
		let u = c == "preserve" && i && this.dom.style.overflowAnchor == null && jl(this);
		if (i) {
			this.domObserver.stop();
			let t = l && (ml || vl) && !this.composing && !n.selection.empty && !e.selection.empty && ip(n.selection, e.selection);
			if (l) {
				let n = vl ? this.trackWrites = this.domSelectionRange().focusNode : null;
				this.composing && (this.input.compositionNode = $d(this)), (r || !this.docView.update(e.doc, s, o, this)) && (this.docView.updateOuterDeco(s), this.docView.destroy(), this.docView = uu(e.doc, s, o, this.dom, this)), n && (!this.trackWrites || !this.dom.contains(this.trackWrites)) && (t = !0);
			}
			t || !(this.input.mouseDown && this.domObserver.currentSelection.eq(this.domSelectionRange()) && Wu(this)) ? Mu(this, t) : (zu(this, e.selection), this.domObserver.setCurSelection()), this.domObserver.start();
		}
		this.updatePluginViews(n), this.dragging?.node && !n.doc.eq(e.doc) && this.updateDraggedNode(this.dragging, n), c == "reset" ? this.dom.scrollTop = 0 : c == "to selection" ? this.scrollToSelection() : u && Nl(u);
	}
	scrollToSelection() {
		let e = this.domSelectionRange().focusNode;
		if (!(!e || !this.dom.contains(e.nodeType == 1 ? e : e.parentNode)) && !this.someProp("handleScrollToSelection", (e) => e(this))) if (this.state.selection instanceof H) {
			let t = this.docView.domAfterPos(this.state.selection.from);
			t.nodeType == 1 && Al(this, t.getBoundingClientRect(), e);
		} else Al(this, this.coordsAtPos(this.state.selection.head, 1), e);
	}
	destroyPluginViews() {
		let e;
		for (; e = this.pluginViews.pop();) e.destroy && e.destroy();
	}
	updatePluginViews(e) {
		if (!e || e.plugins != this.state.plugins || this.directPlugins != this.prevDirectPlugins) {
			this.prevDirectPlugins = this.directPlugins, this.destroyPluginViews();
			for (let e = 0; e < this.directPlugins.length; e++) {
				let t = this.directPlugins[e];
				t.spec.view && this.pluginViews.push(t.spec.view(this));
			}
			for (let e = 0; e < this.state.plugins.length; e++) {
				let t = this.state.plugins[e];
				t.spec.view && this.pluginViews.push(t.spec.view(this));
			}
		} else for (let t = 0; t < this.pluginViews.length; t++) {
			let n = this.pluginViews[t];
			n.update && n.update(this, e);
		}
	}
	updateDraggedNode(e, t) {
		let n = e.node, r = -1;
		if (n.from < this.state.doc.content.size && this.state.doc.nodeAt(n.from) == n.node) r = n.from;
		else {
			let e = n.from + (this.state.doc.content.size - t.doc.content.size);
			(e > 0 && e < this.state.doc.content.size && this.state.doc.nodeAt(e)) == n.node && (r = e);
		}
		this.dragging = new lf(e.slice, e.move, r < 0 ? void 0 : H.create(this.state.doc, r));
	}
	someProp(e, t) {
		let n = this._props && this._props[e], r;
		if (n != null && (r = t ? t(n) : n)) return r;
		for (let n = 0; n < this.directPlugins.length; n++) {
			let i = this.directPlugins[n].props[e];
			if (i != null && (r = t ? t(i) : i)) return r;
		}
		let i = this.state.plugins;
		if (i) for (let n = 0; n < i.length; n++) {
			let a = i[n].props[e];
			if (a != null && (r = t ? t(a) : a)) return r;
		}
	}
	hasFocus() {
		if (ml) {
			let e = this.root.activeElement;
			if (e == this.dom) return !0;
			if (!e || !this.dom.contains(e)) return !1;
			for (; e && this.dom != e && this.dom.contains(e);) {
				if (e.contentEditable == "false") return !1;
				e = e.parentElement;
			}
			return !0;
		}
		return this.root.activeElement == this.dom;
	}
	focus() {
		this.domObserver.stop(), this.editable && Il(this.dom), Mu(this), this.domObserver.start();
	}
	get root() {
		let e = this._root;
		if (e == null) {
			for (let e = this.dom.parentNode; e; e = e.parentNode) if (e.nodeType == 9 || e.nodeType == 11 && e.host) return e.getSelection || (Object.getPrototypeOf(e).getSelection = () => e.ownerDocument.getSelection()), this._root = e;
		}
		return e || document;
	}
	updateRoot() {
		this._root = null;
	}
	posAtCoords(e) {
		return Ul(this, e);
	}
	coordsAtPos(e, t = 1) {
		return Wl(this, e, t);
	}
	domAtPos(e, t = 0) {
		return this.docView.domFromPos(e, t);
	}
	nodeDOM(e) {
		let t = this.docView.descAt(e);
		return t ? t.nodeDOM : null;
	}
	posAtDOM(e, t, n = -1) {
		let r = this.docView.posFromDOM(e, t, n);
		if (r == null) throw RangeError("DOM position not inside the editor");
		return r;
	}
	endOfTextblock(e, t) {
		return eu(this, t || this.state, e);
	}
	pasteHTML(e, t) {
		return sf(this, "", e, !1, t || new ClipboardEvent("paste"));
	}
	pasteText(e, t) {
		return sf(this, e, null, !0, t || new ClipboardEvent("paste"));
	}
	serializeForClipboard(e) {
		return ld(this, e);
	}
	destroy() {
		this.docView && (jd(this), this.destroyPluginViews(), this.mounted ? (this.docView.update(this.state.doc, [], Mf(this), this), this.dom.textContent = "") : this.dom.parentNode && this.dom.parentNode.removeChild(this.dom), this.docView.destroy(), this.docView = null, Yc());
	}
	get isDestroyed() {
		return this.docView == null;
	}
	dispatchEvent(e) {
		return Fd(this, e);
	}
	domSelectionRange() {
		let e = this.domSelection();
		return e ? bl && this.root.nodeType === 11 && ol(this.dom.ownerDocument) == this.dom && Vf(this, e) || e : {
			focusNode: null,
			focusOffset: 0,
			anchorNode: null,
			anchorOffset: 0
		};
	}
	domSelection() {
		return this.root.getSelection();
	}
};
ep.prototype.dispatch = function(e) {
	let t = this._props.dispatchTransaction;
	t ? t.call(this, e) : this.updateState(this.state.apply(e));
};
function tp(e) {
	let t = Object.create(null);
	return t.class = "ProseMirror", t.contenteditable = String(e.editable), e.someProp("attributes", (n) => {
		if (typeof n == "function" && (n = n(e.state)), n) for (let e in n) e == "class" ? t.class += " " + n[e] : e == "style" ? t.style = (t.style ? t.style + ";" : "") + n[e] : !t[e] && e != "contenteditable" && e != "nodeName" && (t[e] = String(n[e]));
	}), t.translate || (t.translate = "no"), [_f.node(0, e.state.doc.content.size, t)];
}
function np(e) {
	if (e.markCursor) {
		let t = document.createElement("img");
		t.className = "ProseMirror-separator", t.setAttribute("mark-placeholder", "true"), t.setAttribute("alt", ""), e.cursorWrapper = {
			dom: t,
			deco: _f.widget(e.state.selection.from, t, {
				raw: !0,
				marks: e.markCursor
			})
		};
	} else e.cursorWrapper = null;
}
function rp(e) {
	return !e.someProp("editable", (t) => t(e.state) === !1);
}
function ip(e, t) {
	let n = Math.min(e.$anchor.sharedDepth(e.head), t.$anchor.sharedDepth(t.head));
	return e.$anchor.start(n) != t.$anchor.start(n);
}
function ap(e) {
	let t = Object.create(null);
	function n(e) {
		for (let n in e) Object.prototype.hasOwnProperty.call(t, n) || (t[n] = e[n]);
	}
	return e.someProp("nodeViews", n), e.someProp("markViews", n), t;
}
function op(e, t) {
	let n = 0, r = 0;
	for (let r in e) {
		if (e[r] != t[r]) return !0;
		n++;
	}
	for (let e in t) r++;
	return n != r;
}
function sp(e) {
	if (e.spec.state || e.spec.filterTransaction || e.spec.appendTransaction) throw RangeError("Plugins passed directly to the view must not have a state component");
}
for (var cp = {
	8: "Backspace",
	9: "Tab",
	10: "Enter",
	12: "NumLock",
	13: "Enter",
	16: "Shift",
	17: "Control",
	18: "Alt",
	20: "CapsLock",
	27: "Escape",
	32: " ",
	33: "PageUp",
	34: "PageDown",
	35: "End",
	36: "Home",
	37: "ArrowLeft",
	38: "ArrowUp",
	39: "ArrowRight",
	40: "ArrowDown",
	44: "PrintScreen",
	45: "Insert",
	46: "Delete",
	59: ";",
	61: "=",
	91: "Meta",
	92: "Meta",
	106: "*",
	107: "+",
	108: ",",
	109: "-",
	110: ".",
	111: "/",
	144: "NumLock",
	145: "ScrollLock",
	160: "Shift",
	161: "Shift",
	162: "Control",
	163: "Control",
	164: "Alt",
	165: "Alt",
	173: "-",
	186: ";",
	187: "=",
	188: ",",
	189: "-",
	190: ".",
	191: "/",
	192: "`",
	219: "[",
	220: "\\",
	221: "]",
	222: "'"
}, lp = {
	48: ")",
	49: "!",
	50: "@",
	51: "#",
	52: "$",
	53: "%",
	54: "^",
	55: "&",
	56: "*",
	57: "(",
	59: ":",
	61: "+",
	173: "_",
	186: ":",
	187: "+",
	188: "<",
	189: "_",
	190: ">",
	191: "?",
	192: "~",
	219: "{",
	220: "|",
	221: "}",
	222: "\""
}, up = typeof navigator < "u" && /Mac/.test(navigator.platform), dp = typeof navigator < "u" && /MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent), fp = 0; fp < 10; fp++) cp[48 + fp] = cp[96 + fp] = String(fp);
for (var fp = 1; fp <= 24; fp++) cp[fp + 111] = "F" + fp;
for (var fp = 65; fp <= 90; fp++) cp[fp] = String.fromCharCode(fp + 32), lp[fp] = String.fromCharCode(fp);
for (var pp in cp) lp.hasOwnProperty(pp) || (lp[pp] = cp[pp]);
function mp(e) {
	var t = !(up && e.metaKey && e.shiftKey && !e.ctrlKey && !e.altKey || dp && e.shiftKey && e.key && e.key.length == 1 || e.key == "Unidentified") && e.key || (e.shiftKey ? lp : cp)[e.keyCode] || e.key || "Unidentified";
	return t == "Esc" && (t = "Escape"), t == "Del" && (t = "Delete"), t == "Left" && (t = "ArrowLeft"), t == "Up" && (t = "ArrowUp"), t == "Right" && (t = "ArrowRight"), t == "Down" && (t = "ArrowDown"), t;
}
//#endregion
//#region node_modules/prosemirror-keymap/dist/index.js
var hp = typeof navigator < "u" && /Mac|iP(hone|[oa]d)/.test(navigator.platform), gp = typeof navigator < "u" && /Win/.test(navigator.platform);
function _p(e) {
	let t = e.split(/-(?!$)/), n = t[t.length - 1];
	n == "Space" && (n = " ");
	let r, i, a, o;
	for (let e = 0; e < t.length - 1; e++) {
		let n = t[e];
		if (/^(cmd|meta|m)$/i.test(n)) o = !0;
		else if (/^a(lt)?$/i.test(n)) r = !0;
		else if (/^(c|ctrl|control)$/i.test(n)) i = !0;
		else if (/^s(hift)?$/i.test(n)) a = !0;
		else if (/^mod$/i.test(n)) hp ? o = !0 : i = !0;
		else throw Error("Unrecognized modifier name: " + n);
	}
	return r && (n = "Alt-" + n), i && (n = "Ctrl-" + n), o && (n = "Meta-" + n), a && (n = "Shift-" + n), n;
}
function vp(e) {
	let t = Object.create(null);
	for (let n in e) t[_p(n)] = e[n];
	return t;
}
function yp(e, t, n = !0) {
	return t.altKey && (e = "Alt-" + e), t.ctrlKey && (e = "Ctrl-" + e), t.metaKey && (e = "Meta-" + e), n && t.shiftKey && (e = "Shift-" + e), e;
}
function bp(e) {
	return new Vc({ props: { handleKeyDown: xp(e) } });
}
function xp(e) {
	let t = vp(e);
	return function(e, n) {
		let r = mp(n), i, a = t[yp(r, n)];
		if (a && a(e.state, e.dispatch, e)) return !0;
		if (r.length == 1 && r != " ") {
			if (n.shiftKey) {
				let i = t[yp(r, n, !1)];
				if (i && i(e.state, e.dispatch, e)) return !0;
			}
			if ((n.altKey || n.metaKey || n.ctrlKey) && !(gp && n.ctrlKey && n.altKey) && (i = cp[n.keyCode]) && i != r) {
				let r = t[yp(i, n)];
				if (r && r(e.state, e.dispatch, e)) return !0;
			}
		}
		return !1;
	};
}
//#endregion
//#region node_modules/prosemirror-commands/dist/index.js
var Sp = (e, t) => e.selection.empty ? !1 : (t && t(e.tr.deleteSelection().scrollIntoView()), !0);
function Cp(e, t) {
	let { $cursor: n } = e.selection;
	return !n || (t ? !t.endOfTextblock("backward", e) : n.parentOffset > 0) ? null : n;
}
var wp = (e, t, n) => {
	let r = Cp(e, n);
	if (!r) return !1;
	let i = Ap(r);
	if (!i) {
		let n = r.blockRange(), i = n && Fs(n);
		return i == null ? !1 : (t && t(e.tr.lift(n, i).scrollIntoView()), !0);
	}
	let a = i.nodeBefore;
	if (Jp(e, i, t, -1)) return !0;
	if (r.parent.content.size == 0 && (Op(a, "end") || H.isSelectable(a))) for (let n = r.depth;; n--) {
		let o = nc(e.doc, r.before(n), r.after(n), R.empty);
		if (o && o.slice.size < o.to - o.from) {
			if (t) {
				let n = e.tr.step(o);
				n.setSelection(Op(a, "end") ? B.findFrom(n.doc.resolve(n.mapping.map(i.pos, -1)), -1) : H.create(n.doc, i.pos - a.nodeSize)), t(n.scrollIntoView());
			}
			return !0;
		}
		if (n == 1 || r.node(n - 1).childCount > 1) break;
	}
	return a.isAtom && i.depth == r.depth - 1 ? (t && t(e.tr.delete(i.pos - a.nodeSize, i.pos).scrollIntoView()), !0) : !1;
}, Tp = (e, t, n) => {
	let r = Cp(e, n);
	if (!r) return !1;
	let i = Ap(r);
	return i ? Dp(e, i, t) : !1;
}, Ep = (e, t, n) => {
	let r = jp(e, n);
	if (!r) return !1;
	let i = Pp(r);
	return i ? Dp(e, i, t) : !1;
};
function Dp(e, t, n) {
	let r = t.nodeBefore, i = t.pos - 1;
	for (; !r.isTextblock; i--) {
		if (r.type.spec.isolating) return !1;
		let e = r.lastChild;
		if (!e) return !1;
		r = e;
	}
	let a = t.nodeAfter, o = t.pos + 1;
	for (; !a.isTextblock; o++) {
		if (a.type.spec.isolating) return !1;
		let e = a.firstChild;
		if (!e) return !1;
		a = e;
	}
	let s = nc(e.doc, i, o, R.empty);
	if (!s || s.from != i || s instanceof Os && s.slice.size >= o - i) return !1;
	if (n) {
		let t = e.tr.step(s);
		t.setSelection(V.create(t.doc, i)), n(t.scrollIntoView());
	}
	return !0;
}
function Op(e, t, n = !1) {
	for (let r = e; r; r = t == "start" ? r.firstChild : r.lastChild) {
		if (r.isTextblock) return !0;
		if (n && r.childCount != 1) return !1;
	}
	return !1;
}
var kp = (e, t, n) => {
	let { $head: r, empty: i } = e.selection, a = r;
	if (!i) return !1;
	if (r.parent.isTextblock) {
		if (n ? !n.endOfTextblock("backward", e) : r.parentOffset > 0) return !1;
		a = Ap(r);
	}
	let o = a && a.nodeBefore;
	return !o || !H.isSelectable(o) ? !1 : (t && t(e.tr.setSelection(H.create(e.doc, a.pos - o.nodeSize)).scrollIntoView()), !0);
};
function Ap(e) {
	if (!e.parent.type.spec.isolating) for (let t = e.depth - 1; t >= 0; t--) {
		if (e.index(t) > 0) return e.doc.resolve(e.before(t + 1));
		if (e.node(t).type.spec.isolating) break;
	}
	return null;
}
function jp(e, t) {
	let { $cursor: n } = e.selection;
	return !n || (t ? !t.endOfTextblock("forward", e) : n.parentOffset < n.parent.content.size) ? null : n;
}
var Mp = (e, t, n) => {
	let r = jp(e, n);
	if (!r) return !1;
	let i = Pp(r);
	if (!i) return !1;
	let a = i.nodeAfter;
	if (Jp(e, i, t, 1)) return !0;
	if (r.parent.content.size == 0 && (Op(a, "start") || H.isSelectable(a))) {
		let n = nc(e.doc, r.before(), r.after(), R.empty);
		if (n && n.slice.size < n.to - n.from) {
			if (t) {
				let r = e.tr.step(n);
				r.setSelection(Op(a, "start") ? B.findFrom(r.doc.resolve(r.mapping.map(i.pos)), 1) : H.create(r.doc, r.mapping.map(i.pos))), t(r.scrollIntoView());
			}
			return !0;
		}
	}
	return a.isAtom && i.depth == r.depth - 1 ? (t && t(e.tr.delete(i.pos, i.pos + a.nodeSize).scrollIntoView()), !0) : !1;
}, Np = (e, t, n) => {
	let { $head: r, empty: i } = e.selection, a = r;
	if (!i) return !1;
	if (r.parent.isTextblock) {
		if (n ? !n.endOfTextblock("forward", e) : r.parentOffset < r.parent.content.size) return !1;
		a = Pp(r);
	}
	let o = a && a.nodeAfter;
	return !o || !H.isSelectable(o) ? !1 : (t && t(e.tr.setSelection(H.create(e.doc, a.pos)).scrollIntoView()), !0);
};
function Pp(e) {
	if (!e.parent.type.spec.isolating) for (let t = e.depth - 1; t >= 0; t--) {
		let n = e.node(t);
		if (e.index(t) + 1 < n.childCount) return e.doc.resolve(e.after(t + 1));
		if (n.type.spec.isolating) break;
	}
	return null;
}
var Fp = (e, t) => {
	let n = e.selection, r = n instanceof H, i;
	if (r) {
		if (n.node.isTextblock || !Ys(e.doc, n.from)) return !1;
		i = n.from;
	} else if (i = Qs(e.doc, n.from, -1), i == null) return !1;
	if (t) {
		let n = e.tr.join(i);
		r && n.setSelection(H.create(n.doc, i - e.doc.resolve(i).nodeBefore.nodeSize)), t(n.scrollIntoView());
	}
	return !0;
}, Ip = (e, t) => {
	let n = e.selection, r;
	if (n instanceof H) {
		if (n.node.isTextblock || !Ys(e.doc, n.to)) return !1;
		r = n.to;
	} else if (r = Qs(e.doc, n.to, 1), r == null) return !1;
	return t && t(e.tr.join(r).scrollIntoView()), !0;
}, Lp = (e, t) => {
	let { $from: n, $to: r } = e.selection, i = n.blockRange(r), a = i && Fs(i);
	return a == null ? !1 : (t && t(e.tr.lift(i, a).scrollIntoView()), !0);
}, Rp = (e, t) => {
	let { $head: n, $anchor: r } = e.selection;
	return !n.parent.type.spec.code || !n.sameParent(r) ? !1 : (t && t(e.tr.insertText("\n").scrollIntoView()), !0);
};
function zp(e) {
	for (let t = 0; t < e.edgeCount; t++) {
		let { type: n } = e.edge(t);
		if (n.isTextblock && !n.hasRequiredAttrs()) return n;
	}
	return null;
}
var Bp = (e, t) => {
	let { $head: n, $anchor: r } = e.selection;
	if (!n.parent.type.spec.code || !n.sameParent(r)) return !1;
	let i = n.node(-1), a = n.indexAfter(-1), o = zp(i.contentMatchAt(a));
	if (!o || !i.canReplaceWith(a, a, o)) return !1;
	if (t) {
		let r = n.after(), i = e.tr.replaceWith(r, r, o.createAndFill());
		i.setSelection(B.near(i.doc.resolve(r), 1)), t(i.scrollIntoView());
	}
	return !0;
}, Vp = (e, t) => {
	let n = e.selection, { $from: r, $to: i } = n;
	if (n instanceof Dc || r.parent.inlineContent || i.parent.inlineContent) return !1;
	let a = zp(i.parent.contentMatchAt(i.indexAfter()));
	if (!a || !a.isTextblock) return !1;
	if (t) {
		let n = (!r.parentOffset && i.index() < i.parent.childCount ? r : i).pos, o = e.tr.insert(n, a.createAndFill());
		o.setSelection(V.create(o.doc, n + 1)), t(o.scrollIntoView());
	}
	return !0;
}, Hp = (e, t) => {
	let { $cursor: n } = e.selection;
	if (!n || n.parent.content.size) return !1;
	if (n.depth > 1 && n.after() != n.end(-1)) {
		let r = n.before();
		if (qs(e.doc, r)) return t && t(e.tr.split(r).scrollIntoView()), !0;
	}
	let r = n.blockRange(), i = r && Fs(r);
	return i == null ? !1 : (t && t(e.tr.lift(r, i).scrollIntoView()), !0);
};
function Up(e) {
	return (t, n) => {
		let { $from: r, $to: i } = t.selection;
		if (t.selection instanceof H && t.selection.node.isBlock) return !r.parentOffset || !qs(t.doc, r.pos) ? !1 : (n && n(t.tr.split(r.pos).scrollIntoView()), !0);
		if (!r.depth) return !1;
		let a = [], o, s, c = !1, l = !1;
		for (let t = r.depth;; t--) if (r.node(t).isBlock) {
			c = r.end(t) == r.pos + (r.depth - t), l = r.start(t) == r.pos - (r.depth - t), s = zp(r.node(t - 1).contentMatchAt(r.indexAfter(t - 1)));
			let n = e && e(i.parent, c, r);
			a.unshift(n || (c && s ? { type: s } : null)), o = t;
			break;
		} else {
			if (t == 1) return !1;
			a.unshift(null);
		}
		let u = t.tr;
		(t.selection instanceof V || t.selection instanceof Dc) && u.deleteSelection();
		let d = u.mapping.map(r.pos), f = qs(u.doc, d, a.length, a);
		if (f || (a[0] = s ? { type: s } : null, f = qs(u.doc, d, a.length, a)), !f) return !1;
		if (u.split(d, a.length, a), !c && l && r.node(o).type != s) {
			let e = u.mapping.map(r.before(o)), t = u.doc.resolve(e);
			s && r.node(o - 1).canReplaceWith(t.index(), t.index() + 1, s) && u.setNodeMarkup(u.mapping.map(r.before(o)), s);
		}
		return n && n(u.scrollIntoView()), !0;
	};
}
var Wp = Up(), Gp = (e, t) => {
	let { $from: n, to: r } = e.selection, i, a = n.sharedDepth(r);
	return a == 0 ? !1 : (i = n.before(a), t && t(e.tr.setSelection(H.create(e.doc, i))), !0);
}, Kp = (e, t) => (t && t(e.tr.setSelection(new Dc(e.doc))), !0);
function qp(e, t, n) {
	let r = t.nodeBefore, i = t.nodeAfter, a = t.index();
	return !r || !i || !r.type.compatibleContent(i.type) ? !1 : !r.content.size && t.parent.canReplace(a - 1, a) ? (n && n(e.tr.delete(t.pos - r.nodeSize, t.pos).scrollIntoView()), !0) : !t.parent.canReplace(a, a + 1) || !(i.isTextblock || Ys(e.doc, t.pos)) ? !1 : (n && n(e.tr.join(t.pos).scrollIntoView()), !0);
}
function Jp(e, t, n, r) {
	let i = t.nodeBefore, a = t.nodeAfter, o, s, c = i.type.spec.isolating || a.type.spec.isolating;
	if (!c && qp(e, t, n)) return !0;
	let l = !c && t.parent.canReplace(t.index(), t.index() + 1);
	if (l && (o = (s = i.contentMatchAt(i.childCount)).findWrapping(a.type)) && s.matchType(o[0] || a.type).validEnd) {
		if (n) {
			let r = t.pos + a.nodeSize, s = I.empty;
			for (let e = o.length - 1; e >= 0; e--) s = I.from(o[e].create(null, s));
			s = I.from(i.copy(s));
			let c = e.tr.step(new ks(t.pos - 1, r, t.pos, r, new R(s, 1, 0), o.length, !0)), l = c.doc.resolve(r + 2 * o.length);
			l.nodeAfter && l.nodeAfter.type == i.type && Ys(c.doc, l.pos) && c.join(l.pos), n(c.scrollIntoView());
		}
		return !0;
	}
	let u = a.type.spec.isolating || r > 0 && c ? null : B.findFrom(t, 1), d = u && u.$from.blockRange(u.$to), f = d && Fs(d);
	if (f != null && f >= t.depth) return n && n(e.tr.lift(d, f).scrollIntoView()), !0;
	if (l && Op(a, "start", !0) && Op(i, "end")) {
		let r = i, o = [];
		for (; o.push(r), !r.isTextblock;) r = r.lastChild;
		let s = a, c = 1;
		for (; !s.isTextblock; s = s.firstChild) c++;
		if (r.canReplace(r.childCount, r.childCount, s.content)) {
			if (n) {
				let r = I.empty;
				for (let e = o.length - 1; e >= 0; e--) r = I.from(o[e].copy(r));
				n(e.tr.step(new ks(t.pos - o.length, t.pos + a.nodeSize, t.pos + c, t.pos + a.nodeSize - c, new R(r, o.length, 0), 0, !0)).scrollIntoView());
			}
			return !0;
		}
	}
	return !1;
}
function Yp(e) {
	return function(t, n) {
		let r = t.selection, i = e < 0 ? r.$from : r.$to, a = i.depth;
		for (; i.node(a).isInline;) {
			if (!a) return !1;
			a--;
		}
		return i.node(a).isTextblock ? (n && n(t.tr.setSelection(V.create(t.doc, e < 0 ? i.start(a) : i.end(a)))), !0) : !1;
	};
}
var Xp = Yp(-1), Zp = Yp(1);
function Qp(e, t = null) {
	return function(n, r) {
		let { $from: i, $to: a } = n.selection, o = i.blockRange(a), s = o && Ls(o, e, t);
		return s ? (r && r(n.tr.wrap(o, s).scrollIntoView()), !0) : !1;
	};
}
function $p(e, t = null) {
	return function(n, r) {
		let i = !1;
		for (let r = 0; r < n.selection.ranges.length && !i; r++) {
			let { $from: { pos: a }, $to: { pos: o } } = n.selection.ranges[r];
			n.doc.nodesBetween(a, o, (r, a) => {
				if (i) return !1;
				if (!(!r.isTextblock || r.hasMarkup(e, t))) if (r.type == e) i = !0;
				else {
					let t = n.doc.resolve(a), r = t.index();
					i = t.parent.canReplaceWith(r, r + 1, e);
				}
			});
		}
		if (!i) return !1;
		if (r) {
			let i = n.tr;
			for (let r = 0; r < n.selection.ranges.length; r++) {
				let { $from: { pos: a }, $to: { pos: o } } = n.selection.ranges[r];
				i.setBlockType(a, o, e, t);
			}
			r(i.scrollIntoView());
		}
		return !0;
	};
}
function em(...e) {
	return function(t, n, r) {
		for (let i = 0; i < e.length; i++) if (e[i](t, n, r)) return !0;
		return !1;
	};
}
var tm = em(Sp, wp, kp), nm = em(Sp, Mp, Np), rm = {
	Enter: em(Rp, Vp, Hp, Wp),
	"Mod-Enter": Bp,
	Backspace: tm,
	"Mod-Backspace": tm,
	"Shift-Backspace": tm,
	Delete: nm,
	"Mod-Delete": nm,
	"Mod-a": Kp
}, im = {
	"Ctrl-h": rm.Backspace,
	"Alt-Backspace": rm["Mod-Backspace"],
	"Ctrl-d": rm.Delete,
	"Ctrl-Alt-Backspace": rm["Mod-Delete"],
	"Alt-Delete": rm["Mod-Delete"],
	"Alt-d": rm["Mod-Delete"],
	"Ctrl-a": Xp,
	"Ctrl-e": Zp
};
for (let e in rm) im[e] = rm[e];
typeof navigator < "u" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : typeof os < "u" && os.platform && os.platform();
//#endregion
//#region node_modules/prosemirror-schema-list/dist/index.js
function am(e, t = null) {
	return function(n, r) {
		let { $from: i, $to: a } = n.selection, o = i.blockRange(a);
		if (!o) return !1;
		let s = r ? n.tr : null;
		return om(s, o, e, t) ? (r && r(s.scrollIntoView()), !0) : !1;
	};
}
function om(e, t, n, r = null) {
	let i = !1, a = t, o = t.$from.doc;
	if (t.depth >= 2 && t.$from.node(t.depth - 1).type.compatibleContent(n) && t.startIndex == 0) {
		if (t.$from.index(t.depth - 1) == 0) return !1;
		let e = o.resolve(t.start - 2);
		a = new lo(e, e, t.depth), t.endIndex < t.parent.childCount && (t = new lo(t.$from, o.resolve(t.$to.end(t.depth)), t.depth)), i = !0;
	}
	let s = Ls(a, n, r, t);
	return s ? (e && sm(e, t, s, i, n), !0) : !1;
}
function sm(e, t, n, r, i) {
	let a = I.empty;
	for (let e = n.length - 1; e >= 0; e--) a = I.from(n[e].type.create(n[e].attrs, a));
	e.step(new ks(t.start - (r ? 2 : 0), t.end, t.start, t.end, new R(a, 0, 0), n.length, !0));
	let o = 0;
	for (let e = 0; e < n.length; e++) n[e].type == i && (o = e + 1);
	let s = n.length - o, c = t.start + n.length - (r ? 2 : 0), l = t.parent;
	for (let n = t.startIndex, r = t.endIndex, i = !0; n < r; n++, i = !1) !i && qs(e.doc, c, s) && (e.split(c, s), c += 2 * s), c += l.child(n).nodeSize;
	return e;
}
function cm(e) {
	return function(t, n) {
		let { $from: r, $to: i } = t.selection, a = r.blockRange(i, (t) => t.childCount > 0 && t.firstChild.type == e);
		return a ? n ? r.node(a.depth - 1).type == e ? lm(t, n, e, a) : um(t, n, a) : !0 : !1;
	};
}
function lm(e, t, n, r) {
	let i = e.tr, a = r.end, o = r.$to.end(r.depth);
	a < o && (i.step(new ks(a - 1, o, a, o, new R(I.from(n.create(null, r.parent.copy())), 1, 0), 1, !0)), r = new lo(i.doc.resolve(r.$from.pos), i.doc.resolve(o), r.depth));
	let s = Fs(r);
	if (s == null) return !1;
	i.lift(r, s);
	let c = i.doc.resolve(i.mapping.map(a, -1) - 1);
	return Ys(i.doc, c.pos) && c.nodeBefore.type == c.nodeAfter.type && i.join(c.pos), t(i.scrollIntoView()), !0;
}
function um(e, t, n) {
	let r = e.tr, i = n.parent;
	for (let e = n.end, t = n.endIndex - 1, a = n.startIndex; t > a; t--) e -= i.child(t).nodeSize, r.delete(e - 1, e + 1);
	let a = r.doc.resolve(n.start), o = a.nodeAfter;
	if (r.mapping.map(n.end) != n.start + a.nodeAfter.nodeSize) return !1;
	let s = n.startIndex == 0, c = n.endIndex == i.childCount, l = a.node(-1), u = a.index(-1);
	if (!l.canReplace(u + +!s, u + 1, o.content.append(c ? I.empty : I.from(i)))) return !1;
	let d = a.pos, f = d + o.nodeSize;
	return r.step(new ks(d - +!!s, f + +!!c, d + 1, f - 1, new R((s ? I.empty : I.from(i.copy(I.empty))).append(c ? I.empty : I.from(i.copy(I.empty))), +!s, +!c), +!s)), t(r.scrollIntoView()), !0;
}
function dm(e) {
	return function(t, n) {
		let { $from: r, $to: i } = t.selection, a = r.blockRange(i, (t) => t.childCount > 0 && t.firstChild.type == e);
		if (!a) return !1;
		let o = a.startIndex;
		if (o == 0) return !1;
		let s = a.parent, c = s.child(o - 1);
		if (c.type != e) return !1;
		if (n) {
			let r = c.lastChild && c.lastChild.type == s.type, i = I.from(r ? e.create() : null), o = new R(I.from(e.create(null, I.from(s.type.create(null, i)))), r ? 3 : 1, 0), l = a.start, u = a.end;
			n(t.tr.step(new ks(l - (r ? 3 : 1), u, l, u, o, 1, !0)).scrollIntoView());
		}
		return !0;
	};
}
//#endregion
//#region node_modules/@tiptap/core/dist/index.js
function fm(e) {
	let { state: t, transaction: n } = e, { selection: r } = n, { doc: i } = n, { storedMarks: a } = n;
	return {
		...t,
		apply: t.apply.bind(t),
		applyTransaction: t.applyTransaction.bind(t),
		plugins: t.plugins,
		schema: t.schema,
		reconfigure: t.reconfigure.bind(t),
		toJSON: t.toJSON.bind(t),
		get storedMarks() {
			return a;
		},
		get selection() {
			return r;
		},
		get doc() {
			return i;
		},
		get tr() {
			return r = n.selection, i = n.doc, a = n.storedMarks, n;
		}
	};
}
var pm = class {
	constructor(e) {
		this.editor = e.editor, this.rawCommands = this.editor.extensionManager.commands, this.customState = e.state;
	}
	get hasCustomState() {
		return !!this.customState;
	}
	get state() {
		return this.customState || this.editor.state;
	}
	get commands() {
		let { rawCommands: e, editor: t, state: n } = this, { view: r } = t, { tr: i } = n, a = this.buildProps(i);
		return Object.fromEntries(Object.entries(e).map(([e, t]) => [e, (...e) => {
			let n = t(...e)(a);
			return !i.getMeta("preventDispatch") && !this.hasCustomState && r.dispatch(i), n;
		}]));
	}
	get chain() {
		return () => this.createChain();
	}
	get can() {
		return () => this.createCan();
	}
	createChain(e, t = !0) {
		let { rawCommands: n, editor: r, state: i } = this, { view: a } = r, o = [], s = !!e, c = e || i.tr, l = () => (!s && t && !c.getMeta("preventDispatch") && !this.hasCustomState && a.dispatch(c), o.every((e) => e === !0)), u = {
			...Object.fromEntries(Object.entries(n).map(([e, n]) => [e, (...e) => {
				let r = this.buildProps(c, t), i = n(...e)(r);
				return o.push(i), u;
			}])),
			run: l
		};
		return u;
	}
	createCan(e) {
		let { rawCommands: t, state: n } = this, r = e || n.tr, i = this.buildProps(r, !1);
		return {
			...Object.fromEntries(Object.entries(t).map(([e, t]) => [e, (...e) => t(...e)({
				...i,
				dispatch: void 0
			})])),
			chain: () => this.createChain(r, !1)
		};
	}
	buildProps(e, t = !0) {
		let { rawCommands: n, editor: r, state: i } = this, { view: a } = r, o = {
			tr: e,
			editor: r,
			view: a,
			state: fm({
				state: i,
				transaction: e
			}),
			dispatch: t ? () => void 0 : void 0,
			chain: () => this.createChain(e, t),
			can: () => this.createCan(e),
			get commands() {
				return Object.fromEntries(Object.entries(n).map(([e, t]) => [e, (...e) => t(...e)(o)]));
			}
		};
		return o;
	}
}, mm = class {
	constructor() {
		this.callbacks = {};
	}
	on(e, t) {
		return this.callbacks[e] || (this.callbacks[e] = []), this.callbacks[e].push(t), this;
	}
	emit(e, ...t) {
		let n = this.callbacks[e];
		return n && n.forEach((e) => e.apply(this, t)), this;
	}
	off(e, t) {
		let n = this.callbacks[e];
		return n && (t ? this.callbacks[e] = n.filter((e) => e !== t) : delete this.callbacks[e]), this;
	}
	once(e, t) {
		let n = (...r) => {
			this.off(e, n), t.apply(this, r);
		};
		return this.on(e, n);
	}
	removeAllListeners() {
		this.callbacks = {};
	}
};
function X(e, t, n) {
	return e.config[t] === void 0 && e.parent ? X(e.parent, t, n) : typeof e.config[t] == "function" ? e.config[t].bind({
		...n,
		parent: e.parent ? X(e.parent, t, n) : null
	}) : e.config[t];
}
function hm(e) {
	return {
		baseExtensions: e.filter((e) => e.type === "extension"),
		nodeExtensions: e.filter((e) => e.type === "node"),
		markExtensions: e.filter((e) => e.type === "mark")
	};
}
function gm(e) {
	let t = [], { nodeExtensions: n, markExtensions: r } = hm(e), i = [...n, ...r], a = {
		default: null,
		rendered: !0,
		renderHTML: null,
		parseHTML: null,
		keepOnSplit: !0,
		isRequired: !1
	};
	return e.forEach((e) => {
		let n = X(e, "addGlobalAttributes", {
			name: e.name,
			options: e.options,
			storage: e.storage,
			extensions: i
		});
		n && n().forEach((e) => {
			e.types.forEach((n) => {
				Object.entries(e.attributes).forEach(([e, r]) => {
					t.push({
						type: n,
						name: e,
						attribute: {
							...a,
							...r
						}
					});
				});
			});
		});
	}), i.forEach((e) => {
		let n = X(e, "addAttributes", {
			name: e.name,
			options: e.options,
			storage: e.storage
		});
		if (!n) return;
		let r = n();
		Object.entries(r).forEach(([n, r]) => {
			let i = {
				...a,
				...r
			};
			typeof i?.default == "function" && (i.default = i.default()), i?.isRequired && i?.default === void 0 && delete i.default, t.push({
				type: e.name,
				name: n,
				attribute: i
			});
		});
	}), t;
}
function _m(e, t) {
	if (typeof e == "string") {
		if (!t.nodes[e]) throw Error(`There is no node type named '${e}'. Maybe you forgot to add the extension?`);
		return t.nodes[e];
	}
	return e;
}
function vm(...e) {
	return e.filter((e) => !!e).reduce((e, t) => {
		let n = { ...e };
		return Object.entries(t).forEach(([e, t]) => {
			if (!n[e]) {
				n[e] = t;
				return;
			}
			if (e === "class") {
				let r = t ? String(t).split(" ") : [], i = n[e] ? n[e].split(" ") : [], a = r.filter((e) => !i.includes(e));
				n[e] = [...i, ...a].join(" ");
			} else if (e === "style") {
				let r = t ? t.split(";").map((e) => e.trim()).filter(Boolean) : [], i = n[e] ? n[e].split(";").map((e) => e.trim()).filter(Boolean) : [], a = /* @__PURE__ */ new Map();
				i.forEach((e) => {
					let [t, n] = e.split(":").map((e) => e.trim());
					a.set(t, n);
				}), r.forEach((e) => {
					let [t, n] = e.split(":").map((e) => e.trim());
					a.set(t, n);
				}), n[e] = Array.from(a.entries()).map(([e, t]) => `${e}: ${t}`).join("; ");
			} else n[e] = t;
		}), n;
	}, {});
}
function ym(e, t) {
	return t.filter((t) => t.type === e.type.name).filter((e) => e.attribute.rendered).map((t) => t.attribute.renderHTML ? t.attribute.renderHTML(e.attrs) || {} : { [t.name]: e.attrs[t.name] }).reduce((e, t) => vm(e, t), {});
}
function bm(e) {
	return typeof e == "function";
}
function Z(e, t = void 0, ...n) {
	return bm(e) ? t ? e.bind(t)(...n) : e(...n) : e;
}
function xm(e = {}) {
	return Object.keys(e).length === 0 && e.constructor === Object;
}
function Sm(e) {
	return typeof e == "string" ? e.match(/^[+-]?(?:\d*\.)?\d+$/) ? Number(e) : e === "true" ? !0 : e === "false" ? !1 : e : e;
}
function Cm(e, t) {
	return "style" in e ? e : {
		...e,
		getAttrs: (n) => {
			let r = e.getAttrs ? e.getAttrs(n) : e.attrs;
			if (r === !1) return !1;
			let i = t.reduce((e, t) => {
				let r = t.attribute.parseHTML ? t.attribute.parseHTML(n) : Sm(n.getAttribute(t.name));
				return r == null ? e : {
					...e,
					[t.name]: r
				};
			}, {});
			return {
				...r,
				...i
			};
		}
	};
}
function wm(e) {
	return Object.fromEntries(Object.entries(e).filter(([e, t]) => e === "attrs" && xm(t) ? !1 : t != null));
}
function Tm(e, t) {
	let n = gm(e), { nodeExtensions: r, markExtensions: i } = hm(e);
	return new Io({
		topNode: r.find((e) => X(e, "topNode"))?.name,
		nodes: Object.fromEntries(r.map((r) => {
			let i = n.filter((e) => e.type === r.name), a = {
				name: r.name,
				options: r.options,
				storage: r.storage,
				editor: t
			}, o = wm({
				...e.reduce((e, t) => {
					let n = X(t, "extendNodeSchema", a);
					return {
						...e,
						...n ? n(r) : {}
					};
				}, {}),
				content: Z(X(r, "content", a)),
				marks: Z(X(r, "marks", a)),
				group: Z(X(r, "group", a)),
				inline: Z(X(r, "inline", a)),
				atom: Z(X(r, "atom", a)),
				selectable: Z(X(r, "selectable", a)),
				draggable: Z(X(r, "draggable", a)),
				code: Z(X(r, "code", a)),
				whitespace: Z(X(r, "whitespace", a)),
				linebreakReplacement: Z(X(r, "linebreakReplacement", a)),
				defining: Z(X(r, "defining", a)),
				isolating: Z(X(r, "isolating", a)),
				attrs: Object.fromEntries(i.map((e) => [e.name, { default: e?.attribute?.default }]))
			}), s = Z(X(r, "parseHTML", a));
			s && (o.parseDOM = s.map((e) => Cm(e, i)));
			let c = X(r, "renderHTML", a);
			c && (o.toDOM = (e) => c({
				node: e,
				HTMLAttributes: ym(e, i)
			}));
			let l = X(r, "renderText", a);
			return l && (o.toText = l), [r.name, o];
		})),
		marks: Object.fromEntries(i.map((r) => {
			let i = n.filter((e) => e.type === r.name), a = {
				name: r.name,
				options: r.options,
				storage: r.storage,
				editor: t
			}, o = wm({
				...e.reduce((e, t) => {
					let n = X(t, "extendMarkSchema", a);
					return {
						...e,
						...n ? n(r) : {}
					};
				}, {}),
				inclusive: Z(X(r, "inclusive", a)),
				excludes: Z(X(r, "excludes", a)),
				group: Z(X(r, "group", a)),
				spanning: Z(X(r, "spanning", a)),
				code: Z(X(r, "code", a)),
				attrs: Object.fromEntries(i.map((e) => [e.name, { default: e?.attribute?.default }]))
			}), s = Z(X(r, "parseHTML", a));
			s && (o.parseDOM = s.map((e) => Cm(e, i)));
			let c = X(r, "renderHTML", a);
			return c && (o.toDOM = (e) => c({
				mark: e,
				HTMLAttributes: ym(e, i)
			})), [r.name, o];
		}))
	});
}
function Em(e, t) {
	return t.nodes[e] || t.marks[e] || null;
}
function Dm(e, t) {
	return Array.isArray(t) ? t.some((t) => (typeof t == "string" ? t : t.name) === e.name) : t;
}
function Om(e, t) {
	let n = es.fromSchema(t).serializeFragment(e), r = document.implementation.createHTMLDocument().createElement("div");
	return r.appendChild(n), r.innerHTML;
}
var km = (e, t = 500) => {
	let n = "", r = e.parentOffset;
	return e.parent.nodesBetween(Math.max(0, r - t), r, (e, t, i, a) => {
		var o;
		let s = (o = e.type.spec).toText?.call(o, {
			node: e,
			pos: t,
			parent: i,
			index: a
		}) || e.textContent || "%leaf%";
		n += e.isAtom && !e.isText ? s : s.slice(0, Math.max(0, r - t));
	}), n;
};
function Am(e) {
	return Object.prototype.toString.call(e) === "[object RegExp]";
}
var jm = class {
	constructor(e) {
		this.find = e.find, this.handler = e.handler;
	}
}, Mm = (e, t) => {
	if (Am(t)) return t.exec(e);
	let n = t(e);
	if (!n) return null;
	let r = [n.text];
	return r.index = n.index, r.input = e, r.data = n.data, n.replaceWith && (n.text.includes(n.replaceWith) || console.warn("[tiptap warn]: \"inputRuleMatch.replaceWith\" must be part of \"inputRuleMatch.text\"."), r.push(n.replaceWith)), r;
};
function Nm(e) {
	let { editor: t, from: n, to: r, text: i, rules: a, plugin: o } = e, { view: s } = t;
	if (s.composing) return !1;
	let c = s.state.doc.resolve(n);
	if (c.parent.type.spec.code || (c.nodeBefore || c.nodeAfter)?.marks.find((e) => e.type.spec.code)) return !1;
	let l = !1, u = km(c) + i;
	return a.forEach((e) => {
		if (l) return;
		let a = Mm(u, e.find);
		if (!a) return;
		let c = s.state.tr, d = fm({
			state: s.state,
			transaction: c
		}), f = {
			from: n - (a[0].length - i.length),
			to: r
		}, { commands: p, chain: m, can: h } = new pm({
			editor: t,
			state: d
		});
		e.handler({
			state: d,
			range: f,
			match: a,
			commands: p,
			chain: m,
			can: h
		}) === null || !c.steps.length || (c.setMeta(o, {
			transform: c,
			from: n,
			to: r,
			text: i
		}), s.dispatch(c), l = !0);
	}), l;
}
function Pm(e) {
	let { editor: t, rules: n } = e, r = new Vc({
		state: {
			init() {
				return null;
			},
			apply(e, i, a) {
				let o = e.getMeta(r);
				if (o) return o;
				let s = e.getMeta("applyInputRules");
				return s && setTimeout(() => {
					let { text: e } = s;
					e = typeof e == "string" ? e : Om(I.from(e), a.schema);
					let { from: i } = s;
					Nm({
						editor: t,
						from: i,
						to: i + e.length,
						text: e,
						rules: n,
						plugin: r
					});
				}), e.selectionSet || e.docChanged ? null : i;
			}
		},
		props: {
			handleTextInput(e, i, a, o) {
				return Nm({
					editor: t,
					from: i,
					to: a,
					text: o,
					rules: n,
					plugin: r
				});
			},
			handleDOMEvents: { compositionend: (e) => (setTimeout(() => {
				let { $cursor: i } = e.state.selection;
				i && Nm({
					editor: t,
					from: i.pos,
					to: i.pos,
					text: "",
					rules: n,
					plugin: r
				});
			}), !1) },
			handleKeyDown(e, i) {
				if (i.key !== "Enter") return !1;
				let { $cursor: a } = e.state.selection;
				return a ? Nm({
					editor: t,
					from: a.pos,
					to: a.pos,
					text: "\n",
					rules: n,
					plugin: r
				}) : !1;
			}
		},
		isInputRules: !0
	});
	return r;
}
function Fm(e) {
	return Object.prototype.toString.call(e).slice(8, -1);
}
function Im(e) {
	return Fm(e) === "Object" ? e.constructor === Object && Object.getPrototypeOf(e) === Object.prototype : !1;
}
function Lm(e, t) {
	let n = { ...e };
	return Im(e) && Im(t) && Object.keys(t).forEach((r) => {
		Im(t[r]) && Im(e[r]) ? n[r] = Lm(e[r], t[r]) : n[r] = t[r];
	}), n;
}
var Rm = class e {
	constructor(e = {}) {
		this.type = "mark", this.name = "mark", this.parent = null, this.child = null, this.config = {
			name: this.name,
			defaultOptions: {}
		}, this.config = {
			...this.config,
			...e
		}, this.name = this.config.name, e.defaultOptions && Object.keys(e.defaultOptions).length > 0 && console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${this.name}".`), this.options = this.config.defaultOptions, this.config.addOptions && (this.options = Z(X(this, "addOptions", { name: this.name }))), this.storage = Z(X(this, "addStorage", {
			name: this.name,
			options: this.options
		})) || {};
	}
	static create(t = {}) {
		return new e(t);
	}
	configure(e = {}) {
		let t = this.extend({
			...this.config,
			addOptions: () => Lm(this.options, e)
		});
		return t.name = this.name, t.parent = this.parent, t;
	}
	extend(t = {}) {
		let n = new e(t);
		return n.parent = this, this.child = n, n.name = t.name ? t.name : n.parent.name, t.defaultOptions && Object.keys(t.defaultOptions).length > 0 && console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${n.name}".`), n.options = Z(X(n, "addOptions", { name: n.name })), n.storage = Z(X(n, "addStorage", {
			name: n.name,
			options: n.options
		})), n;
	}
	static handleExit({ editor: e, mark: t }) {
		let { tr: n } = e.state, r = e.state.selection.$from;
		if (r.pos === r.end()) {
			let i = r.marks();
			if (!i.find((e) => e?.type.name === t.name)) return !1;
			let a = i.find((e) => e?.type.name === t.name);
			return a && n.removeStoredMark(a), n.insertText(" ", r.pos), e.view.dispatch(n), !0;
		}
		return !1;
	}
};
function zm(e) {
	return typeof e == "number";
}
var Bm = class {
	constructor(e) {
		this.find = e.find, this.handler = e.handler;
	}
}, Vm = (e, t, n) => {
	if (Am(t)) return [...e.matchAll(t)];
	let r = t(e, n);
	return r ? r.map((t) => {
		let n = [t.text];
		return n.index = t.index, n.input = e, n.data = t.data, t.replaceWith && (t.text.includes(t.replaceWith) || console.warn("[tiptap warn]: \"pasteRuleMatch.replaceWith\" must be part of \"pasteRuleMatch.text\"."), n.push(t.replaceWith)), n;
	}) : [];
};
function Hm(e) {
	let { editor: t, state: n, from: r, to: i, rule: a, pasteEvent: o, dropEvent: s } = e, { commands: c, chain: l, can: u } = new pm({
		editor: t,
		state: n
	}), d = [];
	return n.doc.nodesBetween(r, i, (e, t) => {
		if (!e.isTextblock || e.type.spec.code) return;
		let f = Math.max(r, t), p = Math.min(i, t + e.content.size);
		Vm(e.textBetween(f - t, p - t, void 0, "￼"), a.find, o).forEach((e) => {
			if (e.index === void 0) return;
			let t = f + e.index + 1, r = t + e[0].length, i = {
				from: n.tr.mapping.map(t),
				to: n.tr.mapping.map(r)
			}, p = a.handler({
				state: n,
				range: i,
				match: e,
				commands: c,
				chain: l,
				can: u,
				pasteEvent: o,
				dropEvent: s
			});
			d.push(p);
		});
	}), d.every((e) => e !== null);
}
var Um = null, Wm = (e) => {
	var t;
	let n = new ClipboardEvent("paste", { clipboardData: new DataTransfer() });
	return (t = n.clipboardData) == null || t.setData("text/html", e), n;
};
function Gm(e) {
	let { editor: t, rules: n } = e, r = null, i = !1, a = !1, o = typeof ClipboardEvent < "u" ? new ClipboardEvent("paste") : null, s;
	try {
		s = typeof DragEvent < "u" ? new DragEvent("drop") : null;
	} catch {
		s = null;
	}
	let c = ({ state: e, from: n, to: r, rule: i, pasteEvt: a }) => {
		let c = e.tr;
		if (!(!Hm({
			editor: t,
			state: fm({
				state: e,
				transaction: c
			}),
			from: Math.max(n - 1, 0),
			to: r.b - 1,
			rule: i,
			pasteEvent: a,
			dropEvent: s
		}) || !c.steps.length)) {
			try {
				s = typeof DragEvent < "u" ? new DragEvent("drop") : null;
			} catch {
				s = null;
			}
			return o = typeof ClipboardEvent < "u" ? new ClipboardEvent("paste") : null, c;
		}
	};
	return n.map((e) => new Vc({
		view(e) {
			let n = (n) => {
				r = e.dom.parentElement?.contains(n.target) ? e.dom.parentElement : null, r && (Um = t);
			}, i = () => {
				Um && (Um = null);
			};
			return window.addEventListener("dragstart", n), window.addEventListener("dragend", i), { destroy() {
				window.removeEventListener("dragstart", n), window.removeEventListener("dragend", i);
			} };
		},
		props: { handleDOMEvents: {
			drop: (e, t) => {
				if (a = r === e.dom.parentElement, s = t, !a) {
					let e = Um;
					e?.isEditable && setTimeout(() => {
						let t = e.state.selection;
						t && e.commands.deleteRange({
							from: t.from,
							to: t.to
						});
					}, 10);
				}
				return !1;
			},
			paste: (e, t) => {
				let n = t.clipboardData?.getData("text/html");
				return o = t, i = !!n?.includes("data-pm-slice"), !1;
			}
		} },
		appendTransaction: (t, n, r) => {
			let s = t[0], l = s.getMeta("uiEvent") === "paste" && !i, u = s.getMeta("uiEvent") === "drop" && !a, d = s.getMeta("applyPasteRules"), f = !!d;
			if (!l && !u && !f) return;
			if (f) {
				let { text: t } = d;
				t = typeof t == "string" ? t : Om(I.from(t), r.schema);
				let { from: n } = d, i = n + t.length, a = Wm(t);
				return c({
					rule: e,
					state: r,
					from: n,
					to: { b: i },
					pasteEvt: a
				});
			}
			let p = n.doc.content.findDiffStart(r.doc.content), m = n.doc.content.findDiffEnd(r.doc.content);
			if (!(!zm(p) || !m || p === m.b)) return c({
				rule: e,
				state: r,
				from: p,
				to: m,
				pasteEvt: o
			});
		}
	}));
}
function Km(e) {
	let t = e.filter((t, n) => e.indexOf(t) !== n);
	return Array.from(new Set(t));
}
var qm = class e {
	constructor(t, n) {
		this.splittableMarks = [], this.editor = n, this.extensions = e.resolve(t), this.schema = Tm(this.extensions, n), this.setupExtensions();
	}
	static resolve(t) {
		let n = e.sort(e.flatten(t)), r = Km(n.map((e) => e.name));
		return r.length && console.warn(`[tiptap warn]: Duplicate extension names found: [${r.map((e) => `'${e}'`).join(", ")}]. This can lead to issues.`), n;
	}
	static flatten(e) {
		return e.map((e) => {
			let t = X(e, "addExtensions", {
				name: e.name,
				options: e.options,
				storage: e.storage
			});
			return t ? [e, ...this.flatten(t())] : e;
		}).flat(10);
	}
	static sort(e) {
		return e.sort((e, t) => {
			let n = X(e, "priority") || 100, r = X(t, "priority") || 100;
			return n > r ? -1 : +(n < r);
		});
	}
	get commands() {
		return this.extensions.reduce((e, t) => {
			let n = X(t, "addCommands", {
				name: t.name,
				options: t.options,
				storage: t.storage,
				editor: this.editor,
				type: Em(t.name, this.schema)
			});
			return n ? {
				...e,
				...n()
			} : e;
		}, {});
	}
	get plugins() {
		let { editor: t } = this, n = e.sort([...this.extensions].reverse()), r = [], i = [], a = n.map((e) => {
			let n = {
				name: e.name,
				options: e.options,
				storage: e.storage,
				editor: t,
				type: Em(e.name, this.schema)
			}, a = [], o = X(e, "addKeyboardShortcuts", n), s = {};
			if (e.type === "mark" && X(e, "exitable", n) && (s.ArrowRight = () => Rm.handleExit({
				editor: t,
				mark: e
			})), o) {
				let e = Object.fromEntries(Object.entries(o()).map(([e, n]) => [e, () => n({ editor: t })]));
				s = {
					...s,
					...e
				};
			}
			let c = bp(s);
			a.push(c);
			let l = X(e, "addInputRules", n);
			Dm(e, t.options.enableInputRules) && l && r.push(...l());
			let u = X(e, "addPasteRules", n);
			Dm(e, t.options.enablePasteRules) && u && i.push(...u());
			let d = X(e, "addProseMirrorPlugins", n);
			if (d) {
				let e = d();
				a.push(...e);
			}
			return a;
		}).flat();
		return [
			Pm({
				editor: t,
				rules: r
			}),
			...Gm({
				editor: t,
				rules: i
			}),
			...a
		];
	}
	get attributes() {
		return gm(this.extensions);
	}
	get nodeViews() {
		let { editor: e } = this, { nodeExtensions: t } = hm(this.extensions);
		return Object.fromEntries(t.filter((e) => !!X(e, "addNodeView")).map((t) => {
			let n = this.attributes.filter((e) => e.type === t.name), r = X(t, "addNodeView", {
				name: t.name,
				options: t.options,
				storage: t.storage,
				editor: e,
				type: _m(t.name, this.schema)
			});
			return r ? [t.name, (i, a, o, s, c) => {
				let l = ym(i, n);
				return r()({
					node: i,
					view: a,
					getPos: o,
					decorations: s,
					innerDecorations: c,
					editor: e,
					extension: t,
					HTMLAttributes: l
				});
			}] : [];
		}));
	}
	setupExtensions() {
		this.extensions.forEach((e) => {
			this.editor.extensionStorage[e.name] = e.storage;
			let t = {
				name: e.name,
				options: e.options,
				storage: e.storage,
				editor: this.editor,
				type: Em(e.name, this.schema)
			};
			e.type === "mark" && (Z(X(e, "keepOnSplit", t)) ?? !0) && this.splittableMarks.push(e.name);
			let n = X(e, "onBeforeCreate", t), r = X(e, "onCreate", t), i = X(e, "onUpdate", t), a = X(e, "onSelectionUpdate", t), o = X(e, "onTransaction", t), s = X(e, "onFocus", t), c = X(e, "onBlur", t), l = X(e, "onDestroy", t);
			n && this.editor.on("beforeCreate", n), r && this.editor.on("create", r), i && this.editor.on("update", i), a && this.editor.on("selectionUpdate", a), o && this.editor.on("transaction", o), s && this.editor.on("focus", s), c && this.editor.on("blur", c), l && this.editor.on("destroy", l);
		});
	}
}, Jm = class e {
	constructor(e = {}) {
		this.type = "extension", this.name = "extension", this.parent = null, this.child = null, this.config = {
			name: this.name,
			defaultOptions: {}
		}, this.config = {
			...this.config,
			...e
		}, this.name = this.config.name, e.defaultOptions && Object.keys(e.defaultOptions).length > 0 && console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${this.name}".`), this.options = this.config.defaultOptions, this.config.addOptions && (this.options = Z(X(this, "addOptions", { name: this.name }))), this.storage = Z(X(this, "addStorage", {
			name: this.name,
			options: this.options
		})) || {};
	}
	static create(t = {}) {
		return new e(t);
	}
	configure(e = {}) {
		let t = this.extend({
			...this.config,
			addOptions: () => Lm(this.options, e)
		});
		return t.name = this.name, t.parent = this.parent, t;
	}
	extend(t = {}) {
		let n = new e({
			...this.config,
			...t
		});
		return n.parent = this, this.child = n, n.name = t.name ? t.name : n.parent.name, t.defaultOptions && Object.keys(t.defaultOptions).length > 0 && console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${n.name}".`), n.options = Z(X(n, "addOptions", { name: n.name })), n.storage = Z(X(n, "addStorage", {
			name: n.name,
			options: n.options
		})), n;
	}
};
function Ym(e, t, n) {
	let { from: r, to: i } = t, { blockSeparator: a = "\n\n", textSerializers: o = {} } = n || {}, s = "";
	return e.nodesBetween(r, i, (e, n, c, l) => {
		e.isBlock && n > r && (s += a);
		let u = o?.[e.type.name];
		if (u) return c && (s += u({
			node: e,
			pos: n,
			parent: c,
			index: l,
			range: t
		})), !1;
		e.isText && (s += (e?.text)?.slice(Math.max(r, n) - n, i - n));
	}), s;
}
function Xm(e) {
	return Object.fromEntries(Object.entries(e.nodes).filter(([, e]) => e.spec.toText).map(([e, t]) => [e, t.spec.toText]));
}
var Zm = Jm.create({
	name: "clipboardTextSerializer",
	addOptions() {
		return { blockSeparator: void 0 };
	},
	addProseMirrorPlugins() {
		return [new Vc({
			key: new Wc("clipboardTextSerializer"),
			props: { clipboardTextSerializer: () => {
				let { editor: e } = this, { state: t, schema: n } = e, { doc: r, selection: i } = t, { ranges: a } = i, o = Math.min(...a.map((e) => e.$from.pos)), s = Math.max(...a.map((e) => e.$to.pos)), c = Xm(n);
				return Ym(r, {
					from: o,
					to: s
				}, {
					...this.options.blockSeparator === void 0 ? {} : { blockSeparator: this.options.blockSeparator },
					textSerializers: c
				});
			} }
		})];
	}
}), Qm = () => ({ editor: e, view: t }) => (requestAnimationFrame(() => {
	var n;
	e.isDestroyed || (t.dom.blur(), (n = window == null ? void 0 : window.getSelection()) == null || n.removeAllRanges());
}), !0), $m = (e = !1) => ({ commands: t }) => t.setContent("", e), eh = () => ({ state: e, tr: t, dispatch: n }) => {
	let { selection: r } = t, { ranges: i } = r;
	return n && i.forEach(({ $from: n, $to: r }) => {
		e.doc.nodesBetween(n.pos, r.pos, (e, n) => {
			if (e.type.isText) return;
			let { doc: r, mapping: i } = t, a = r.resolve(i.map(n)), o = r.resolve(i.map(n + e.nodeSize)), s = a.blockRange(o);
			if (!s) return;
			let c = Fs(s);
			if (e.type.isTextblock) {
				let { defaultType: e } = a.parent.contentMatchAt(a.index());
				t.setNodeMarkup(s.start, e);
			}
			(c || c === 0) && t.lift(s, c);
		});
	}), !0;
}, th = (e) => (t) => e(t), nh = () => ({ state: e, dispatch: t }) => Vp(e, t), rh = (e, t) => ({ editor: n, tr: r }) => {
	let { state: i } = n, a = i.doc.slice(e.from, e.to);
	r.deleteRange(e.from, e.to);
	let o = r.mapping.map(t);
	return r.insert(o, a.content), r.setSelection(new V(r.doc.resolve(Math.max(o - 1, 0)))), !0;
}, ih = () => ({ tr: e, dispatch: t }) => {
	let { selection: n } = e, r = n.$anchor.node();
	if (r.content.size > 0) return !1;
	let i = e.selection.$anchor;
	for (let n = i.depth; n > 0; --n) if (i.node(n).type === r.type) {
		if (t) {
			let t = i.before(n), r = i.after(n);
			e.delete(t, r).scrollIntoView();
		}
		return !0;
	}
	return !1;
}, ah = (e) => ({ tr: t, state: n, dispatch: r }) => {
	let i = _m(e, n.schema), a = t.selection.$anchor;
	for (let e = a.depth; e > 0; --e) if (a.node(e).type === i) {
		if (r) {
			let n = a.before(e), r = a.after(e);
			t.delete(n, r).scrollIntoView();
		}
		return !0;
	}
	return !1;
}, oh = (e) => ({ tr: t, dispatch: n }) => {
	let { from: r, to: i } = e;
	return n && t.delete(r, i), !0;
}, sh = () => ({ state: e, dispatch: t }) => Sp(e, t), ch = () => ({ commands: e }) => e.keyboardShortcut("Enter"), lh = () => ({ state: e, dispatch: t }) => Bp(e, t);
function uh(e, t, n = { strict: !0 }) {
	let r = Object.keys(t);
	return r.length ? r.every((r) => n.strict ? t[r] === e[r] : Am(t[r]) ? t[r].test(e[r]) : t[r] === e[r]) : !0;
}
function dh(e, t, n = {}) {
	return e.find((e) => e.type === t && uh(Object.fromEntries(Object.keys(n).map((t) => [t, e.attrs[t]])), n));
}
function fh(e, t, n = {}) {
	return !!dh(e, t, n);
}
function ph(e, t, n) {
	if (!e || !t) return;
	let r = e.parent.childAfter(e.parentOffset);
	if ((!r.node || !r.node.marks.some((e) => e.type === t)) && (r = e.parent.childBefore(e.parentOffset)), !r.node || !r.node.marks.some((e) => e.type === t) || (n = n || r.node.marks[0]?.attrs, !dh([...r.node.marks], t, n))) return;
	let i = r.index, a = e.start() + r.offset, o = i + 1, s = a + r.node.nodeSize;
	for (; i > 0 && fh([...e.parent.child(i - 1).marks], t, n);) --i, a -= e.parent.child(i).nodeSize;
	for (; o < e.parent.childCount && fh([...e.parent.child(o).marks], t, n);) s += e.parent.child(o).nodeSize, o += 1;
	return {
		from: a,
		to: s
	};
}
function mh(e, t) {
	if (typeof e == "string") {
		if (!t.marks[e]) throw Error(`There is no mark type named '${e}'. Maybe you forgot to add the extension?`);
		return t.marks[e];
	}
	return e;
}
var hh = (e, t = {}) => ({ tr: n, state: r, dispatch: i }) => {
	let a = mh(e, r.schema), { doc: o, selection: s } = n, { $from: c, from: l, to: u } = s;
	if (i) {
		let e = ph(c, a, t);
		if (e && e.from <= l && e.to >= u) {
			let t = V.create(o, e.from, e.to);
			n.setSelection(t);
		}
	}
	return !0;
}, gh = (e) => (t) => {
	let n = typeof e == "function" ? e(t) : e;
	for (let e = 0; e < n.length; e += 1) if (n[e](t)) return !0;
	return !1;
};
function _h(e) {
	return e instanceof V;
}
function vh(e = 0, t = 0, n = 0) {
	return Math.min(Math.max(e, t), n);
}
function yh(e, t = null) {
	if (!t) return null;
	let n = B.atStart(e), r = B.atEnd(e);
	if (t === "start" || t === !0) return n;
	if (t === "end") return r;
	let i = n.from, a = r.to;
	return t === "all" ? V.create(e, vh(0, i, a), vh(e.content.size, i, a)) : V.create(e, vh(t, i, a), vh(t, i, a));
}
function bh() {
	return navigator.platform === "Android" || /android/i.test(navigator.userAgent);
}
function xh() {
	return [
		"iPad Simulator",
		"iPhone Simulator",
		"iPod Simulator",
		"iPad",
		"iPhone",
		"iPod"
	].includes(navigator.platform) || navigator.userAgent.includes("Mac") && "ontouchend" in document;
}
function Sh() {
	return typeof navigator < "u" ? /^((?!chrome|android).)*safari/i.test(navigator.userAgent) : !1;
}
var Ch = (e = null, t = {}) => ({ editor: n, view: r, tr: i, dispatch: a }) => {
	t = {
		scrollIntoView: !0,
		...t
	};
	let o = () => {
		(xh() || bh()) && r.dom.focus(), requestAnimationFrame(() => {
			n.isDestroyed || (r.focus(), Sh() && !xh() && !bh() && r.dom.focus({ preventScroll: !0 }));
		});
	};
	if (r.hasFocus() && e === null || e === !1) return !0;
	if (a && e === null && !_h(n.state.selection)) return o(), !0;
	let s = yh(i.doc, e) || n.state.selection, c = n.state.selection.eq(s);
	return a && (c || i.setSelection(s), c && i.storedMarks && i.setStoredMarks(i.storedMarks), o()), !0;
}, wh = (e, t) => (n) => e.every((e, r) => t(e, {
	...n,
	index: r
})), Th = (e, t) => ({ tr: n, commands: r }) => r.insertContentAt({
	from: n.selection.from,
	to: n.selection.to
}, e, t), Eh = (e) => {
	let t = e.childNodes;
	for (let n = t.length - 1; n >= 0; --n) {
		let r = t[n];
		r.nodeType === 3 && r.nodeValue && /^(\n\s\s|\n)$/.test(r.nodeValue) ? e.removeChild(r) : r.nodeType === 1 && Eh(r);
	}
	return e;
};
function Dh(e) {
	let t = `<body>${e}</body>`, n = new window.DOMParser().parseFromString(t, "text/html").body;
	return Eh(n);
}
function Oh(e, t, n) {
	if (e instanceof fo || e instanceof I) return e;
	n = {
		slice: !0,
		parseOptions: {},
		...n
	};
	let r = typeof e == "object" && !!e, i = typeof e == "string";
	if (r) try {
		if (Array.isArray(e) && e.length > 0) return I.fromArray(e.map((e) => t.nodeFromJSON(e)));
		let r = t.nodeFromJSON(e);
		return n.errorOnInvalidContent && r.check(), r;
	} catch (r) {
		if (n.errorOnInvalidContent) throw Error("[tiptap error]: Invalid JSON content", { cause: r });
		return console.warn("[tiptap warn]: Invalid content.", "Passed value:", e, "Error:", r), Oh("", t, n);
	}
	if (i) {
		if (n.errorOnInvalidContent) {
			let r = !1, i = "", a = new Io({
				topNode: t.spec.topNode,
				marks: t.spec.marks,
				nodes: t.spec.nodes.append({ __tiptap__private__unknown__catch__all__node: {
					content: "inline*",
					group: "block",
					parseDOM: [{
						tag: "*",
						getAttrs: (e) => (r = !0, i = typeof e == "string" ? e : e.outerHTML, null)
					}]
				} })
			});
			if (n.slice ? Bo.fromSchema(a).parseSlice(Dh(e), n.parseOptions) : Bo.fromSchema(a).parse(Dh(e), n.parseOptions), n.errorOnInvalidContent && r) throw Error("[tiptap error]: Invalid HTML content", { cause: /* @__PURE__ */ Error(`Invalid element found: ${i}`) });
		}
		let r = Bo.fromSchema(t);
		return n.slice ? r.parseSlice(Dh(e), n.parseOptions).content : r.parse(Dh(e), n.parseOptions);
	}
	return Oh("", t, n);
}
function kh(e, t, n) {
	let r = e.steps.length - 1;
	if (r < t) return;
	let i = e.steps[r];
	if (!(i instanceof Os || i instanceof ks)) return;
	let a = e.mapping.maps[r], o = 0;
	a.forEach((e, t, n, r) => {
		o === 0 && (o = r);
	}), e.setSelection(B.near(e.doc.resolve(o), n));
}
var Ah = (e) => !("type" in e), jh = (e, t, n) => ({ tr: r, dispatch: i, editor: a }) => {
	if (i) {
		n = {
			parseOptions: a.options.parseOptions,
			updateSelection: !0,
			applyInputRules: !1,
			applyPasteRules: !1,
			...n
		};
		let i, o = (e) => {
			a.emit("contentError", {
				editor: a,
				error: e,
				disableCollaboration: () => {
					a.storage.collaboration && (a.storage.collaboration.isDisabled = !0);
				}
			});
		}, s = {
			preserveWhitespace: "full",
			...n.parseOptions
		};
		if (!n.errorOnInvalidContent && !a.options.enableContentCheck && a.options.emitContentError) try {
			Oh(t, a.schema, {
				parseOptions: s,
				errorOnInvalidContent: !0
			});
		} catch (e) {
			o(e);
		}
		try {
			i = Oh(t, a.schema, {
				parseOptions: s,
				errorOnInvalidContent: n.errorOnInvalidContent ?? a.options.enableContentCheck
			});
		} catch (e) {
			return o(e), !1;
		}
		let { from: c, to: l } = typeof e == "number" ? {
			from: e,
			to: e
		} : {
			from: e.from,
			to: e.to
		}, u = !0, d = !0;
		if ((Ah(i) ? i : [i]).forEach((e) => {
			e.check(), u = u ? e.isText && e.marks.length === 0 : !1, d = d ? e.isBlock : !1;
		}), c === l && d) {
			let { parent: e } = r.doc.resolve(c);
			e.isTextblock && !e.type.spec.code && !e.childCount && (--c, l += 1);
		}
		let f;
		if (u) {
			if (Array.isArray(t)) f = t.map((e) => e.text || "").join("");
			else if (t instanceof I) {
				let e = "";
				t.forEach((t) => {
					t.text && (e += t.text);
				}), f = e;
			} else f = typeof t == "object" && t && t.text ? t.text : t;
			r.insertText(f, c, l);
		} else f = i, r.replaceWith(c, l, f);
		n.updateSelection && kh(r, r.steps.length - 1, -1), n.applyInputRules && r.setMeta("applyInputRules", {
			from: c,
			text: f
		}), n.applyPasteRules && r.setMeta("applyPasteRules", {
			from: c,
			text: f
		});
	}
	return !0;
}, Mh = () => ({ state: e, dispatch: t }) => Fp(e, t), Nh = () => ({ state: e, dispatch: t }) => Ip(e, t), Ph = () => ({ state: e, dispatch: t }) => wp(e, t), Fh = () => ({ state: e, dispatch: t }) => Mp(e, t), Ih = () => ({ state: e, dispatch: t, tr: n }) => {
	try {
		let r = Qs(e.doc, e.selection.$from.pos, -1);
		return r == null ? !1 : (n.join(r, 2), t && t(n), !0);
	} catch {
		return !1;
	}
}, Lh = () => ({ state: e, dispatch: t, tr: n }) => {
	try {
		let r = Qs(e.doc, e.selection.$from.pos, 1);
		return r == null ? !1 : (n.join(r, 2), t && t(n), !0);
	} catch {
		return !1;
	}
}, Rh = () => ({ state: e, dispatch: t }) => Tp(e, t), zh = () => ({ state: e, dispatch: t }) => Ep(e, t);
function Bh() {
	return typeof navigator < "u" ? /Mac/.test(navigator.platform) : !1;
}
function Vh(e) {
	let t = e.split(/-(?!$)/), n = t[t.length - 1];
	n === "Space" && (n = " ");
	let r, i, a, o;
	for (let e = 0; e < t.length - 1; e += 1) {
		let n = t[e];
		if (/^(cmd|meta|m)$/i.test(n)) o = !0;
		else if (/^a(lt)?$/i.test(n)) r = !0;
		else if (/^(c|ctrl|control)$/i.test(n)) i = !0;
		else if (/^s(hift)?$/i.test(n)) a = !0;
		else if (/^mod$/i.test(n)) xh() || Bh() ? o = !0 : i = !0;
		else throw Error(`Unrecognized modifier name: ${n}`);
	}
	return r && (n = `Alt-${n}`), i && (n = `Ctrl-${n}`), o && (n = `Meta-${n}`), a && (n = `Shift-${n}`), n;
}
var Hh = (e) => ({ editor: t, view: n, tr: r, dispatch: i }) => {
	let a = Vh(e).split(/-(?!$)/), o = a.find((e) => ![
		"Alt",
		"Ctrl",
		"Meta",
		"Shift"
	].includes(e)), s = new KeyboardEvent("keydown", {
		key: o === "Space" ? " " : o,
		altKey: a.includes("Alt"),
		ctrlKey: a.includes("Ctrl"),
		metaKey: a.includes("Meta"),
		shiftKey: a.includes("Shift"),
		bubbles: !0,
		cancelable: !0
	});
	return t.captureTransaction(() => {
		n.someProp("handleKeyDown", (e) => e(n, s));
	})?.steps.forEach((e) => {
		let t = e.map(r.mapping);
		t && i && r.maybeStep(t);
	}), !0;
};
function Uh(e, t, n = {}) {
	let { from: r, to: i, empty: a } = e.selection, o = t ? _m(t, e.schema) : null, s = [];
	e.doc.nodesBetween(r, i, (e, t) => {
		if (e.isText) return;
		let n = Math.max(r, t), a = Math.min(i, t + e.nodeSize);
		s.push({
			node: e,
			from: n,
			to: a
		});
	});
	let c = i - r, l = s.filter((e) => o ? o.name === e.node.type.name : !0).filter((e) => uh(e.node.attrs, n, { strict: !1 }));
	return a ? !!l.length : l.reduce((e, t) => e + t.to - t.from, 0) >= c;
}
var Wh = (e, t = {}) => ({ state: n, dispatch: r }) => Uh(n, _m(e, n.schema), t) ? Lp(n, r) : !1, Gh = () => ({ state: e, dispatch: t }) => Hp(e, t), Kh = (e) => ({ state: t, dispatch: n }) => cm(_m(e, t.schema))(t, n), qh = () => ({ state: e, dispatch: t }) => Rp(e, t);
function Jh(e, t) {
	return t.nodes[e] ? "node" : t.marks[e] ? "mark" : null;
}
function Yh(e, t) {
	let n = typeof t == "string" ? [t] : t;
	return Object.keys(e).reduce((t, r) => (n.includes(r) || (t[r] = e[r]), t), {});
}
var Xh = (e, t) => ({ tr: n, state: r, dispatch: i }) => {
	let a = null, o = null, s = Jh(typeof e == "string" ? e : e.name, r.schema);
	return s ? (s === "node" && (a = _m(e, r.schema)), s === "mark" && (o = mh(e, r.schema)), i && n.selection.ranges.forEach((e) => {
		r.doc.nodesBetween(e.$from.pos, e.$to.pos, (e, r) => {
			a && a === e.type && n.setNodeMarkup(r, void 0, Yh(e.attrs, t)), o && e.marks.length && e.marks.forEach((i) => {
				o === i.type && n.addMark(r, r + e.nodeSize, o.create(Yh(i.attrs, t)));
			});
		});
	}), !0) : !1;
}, Zh = () => ({ tr: e, dispatch: t }) => (t && e.scrollIntoView(), !0), Qh = () => ({ tr: e, dispatch: t }) => {
	if (t) {
		let t = new Dc(e.doc);
		e.setSelection(t);
	}
	return !0;
}, $h = () => ({ state: e, dispatch: t }) => kp(e, t), eg = () => ({ state: e, dispatch: t }) => Np(e, t), tg = () => ({ state: e, dispatch: t }) => Gp(e, t), ng = () => ({ state: e, dispatch: t }) => Zp(e, t), rg = () => ({ state: e, dispatch: t }) => Xp(e, t);
function ig(e, t, n = {}, r = {}) {
	return Oh(e, t, {
		slice: !1,
		parseOptions: n,
		errorOnInvalidContent: r.errorOnInvalidContent
	});
}
var ag = (e, t = !1, n = {}, r = {}) => ({ editor: i, tr: a, dispatch: o, commands: s }) => {
	let { doc: c } = a;
	if (n.preserveWhitespace !== "full") {
		let s = ig(e, i.schema, n, { errorOnInvalidContent: r.errorOnInvalidContent ?? i.options.enableContentCheck });
		return o && a.replaceWith(0, c.content.size, s).setMeta("preventUpdate", !t), !0;
	}
	return o && a.setMeta("preventUpdate", !t), s.insertContentAt({
		from: 0,
		to: c.content.size
	}, e, {
		parseOptions: n,
		errorOnInvalidContent: r.errorOnInvalidContent ?? i.options.enableContentCheck
	});
};
function og(e, t) {
	let n = mh(t, e.schema), { from: r, to: i, empty: a } = e.selection, o = [];
	a ? (e.storedMarks && o.push(...e.storedMarks), o.push(...e.selection.$head.marks())) : e.doc.nodesBetween(r, i, (e) => {
		o.push(...e.marks);
	});
	let s = o.find((e) => e.type.name === n.name);
	return s ? { ...s.attrs } : {};
}
function sg(e, t) {
	let n = new bc(e);
	return t.forEach((e) => {
		e.steps.forEach((e) => {
			n.step(e);
		});
	}), n;
}
function cg(e) {
	for (let t = 0; t < e.edgeCount; t += 1) {
		let { type: n } = e.edge(t);
		if (n.isTextblock && !n.hasRequiredAttrs()) return n;
	}
	return null;
}
function lg(e, t, n) {
	let r = [];
	return e.nodesBetween(t.from, t.to, (e, t) => {
		n(e) && r.push({
			node: e,
			pos: t
		});
	}), r;
}
function ug(e, t) {
	for (let n = e.depth; n > 0; --n) {
		let r = e.node(n);
		if (t(r)) return {
			pos: n > 0 ? e.before(n) : 0,
			start: e.start(n),
			depth: n,
			node: r
		};
	}
}
function dg(e) {
	return (t) => ug(t.$from, e);
}
function fg(e, t) {
	return Ym(e, {
		from: 0,
		to: e.content.size
	}, t);
}
function pg(e, t) {
	let n = _m(t, e.schema), { from: r, to: i } = e.selection, a = [];
	e.doc.nodesBetween(r, i, (e) => {
		a.push(e);
	});
	let o = a.reverse().find((e) => e.type.name === n.name);
	return o ? { ...o.attrs } : {};
}
function mg(e, t) {
	let n = Jh(typeof t == "string" ? t : t.name, e.schema);
	return n === "node" ? pg(e, t) : n === "mark" ? og(e, t) : {};
}
function hg(e, t = JSON.stringify) {
	let n = {};
	return e.filter((e) => {
		let r = t(e);
		return Object.prototype.hasOwnProperty.call(n, r) ? !1 : n[r] = !0;
	});
}
function gg(e) {
	let t = hg(e);
	return t.length === 1 ? t : t.filter((e, n) => !t.filter((e, t) => t !== n).some((t) => e.oldRange.from >= t.oldRange.from && e.oldRange.to <= t.oldRange.to && e.newRange.from >= t.newRange.from && e.newRange.to <= t.newRange.to));
}
function _g(e) {
	let { mapping: t, steps: n } = e, r = [];
	return t.maps.forEach((e, i) => {
		let a = [];
		if (e.ranges.length) e.forEach((e, t) => {
			a.push({
				from: e,
				to: t
			});
		});
		else {
			let { from: e, to: t } = n[i];
			if (e === void 0 || t === void 0) return;
			a.push({
				from: e,
				to: t
			});
		}
		a.forEach(({ from: e, to: n }) => {
			let a = t.slice(i).map(e, -1), o = t.slice(i).map(n), s = t.invert().map(a, -1), c = t.invert().map(o);
			r.push({
				oldRange: {
					from: s,
					to: c
				},
				newRange: {
					from: a,
					to: o
				}
			});
		});
	}), gg(r);
}
function vg(e, t, n) {
	let r = [];
	return e === t ? n.resolve(e).marks().forEach((t) => {
		let i = ph(n.resolve(e), t.type);
		i && r.push({
			mark: t,
			...i
		});
	}) : n.nodesBetween(e, t, (e, t) => {
		!e || e?.nodeSize === void 0 || r.push(...e.marks.map((n) => ({
			from: t,
			to: t + e.nodeSize,
			mark: n
		})));
	}), r;
}
function yg(e, t, n) {
	return Object.fromEntries(Object.entries(n).filter(([n]) => {
		let r = e.find((e) => e.type === t && e.name === n);
		return r ? r.attribute.keepOnSplit : !1;
	}));
}
function bg(e, t, n = {}) {
	let { empty: r, ranges: i } = e.selection, a = t ? mh(t, e.schema) : null;
	if (r) return !!(e.storedMarks || e.selection.$from.marks()).filter((e) => a ? a.name === e.type.name : !0).find((e) => uh(e.attrs, n, { strict: !1 }));
	let o = 0, s = [];
	if (i.forEach(({ $from: t, $to: n }) => {
		let r = t.pos, i = n.pos;
		e.doc.nodesBetween(r, i, (e, t) => {
			if (!e.isText && !e.marks.length) return;
			let n = Math.max(r, t), a = Math.min(i, t + e.nodeSize), c = a - n;
			o += c, s.push(...e.marks.map((e) => ({
				mark: e,
				from: n,
				to: a
			})));
		});
	}), o === 0) return !1;
	let c = s.filter((e) => a ? a.name === e.mark.type.name : !0).filter((e) => uh(e.mark.attrs, n, { strict: !1 })).reduce((e, t) => e + t.to - t.from, 0), l = s.filter((e) => a ? e.mark.type !== a && e.mark.type.excludes(a) : !0).reduce((e, t) => e + t.to - t.from, 0);
	return (c > 0 ? c + l : c) >= o;
}
function xg(e, t, n = {}) {
	if (!t) return Uh(e, null, n) || bg(e, null, n);
	let r = Jh(t, e.schema);
	return r === "node" ? Uh(e, t, n) : r === "mark" ? bg(e, t, n) : !1;
}
function Sg(e, t) {
	let { nodeExtensions: n } = hm(t), r = n.find((t) => t.name === e);
	if (!r) return !1;
	let i = Z(X(r, "group", {
		name: r.name,
		options: r.options,
		storage: r.storage
	}));
	return typeof i == "string" ? i.split(" ").includes("list") : !1;
}
function Cg(e, { checkChildren: t = !0, ignoreWhitespace: n = !1 } = {}) {
	if (n) {
		if (e.type.name === "hardBreak") return !0;
		if (e.isText) return /^\s*$/m.test(e.text ?? "");
	}
	if (e.isText) return !e.text;
	if (e.isAtom || e.isLeaf) return !1;
	if (e.content.childCount === 0) return !0;
	if (t) {
		let r = !0;
		return e.content.forEach((e) => {
			r !== !1 && (Cg(e, {
				ignoreWhitespace: n,
				checkChildren: t
			}) || (r = !1));
		}), r;
	}
	return !1;
}
function wg(e) {
	return e instanceof H;
}
function Tg(e, t, n) {
	let { selection: r } = t, i = null;
	if (_h(r) && (i = r.$cursor), i) {
		let t = e.storedMarks ?? i.marks();
		return !!n.isInSet(t) || !t.some((e) => e.type.excludes(n));
	}
	let { ranges: a } = r;
	return a.some(({ $from: t, $to: r }) => {
		let i = t.depth === 0 ? e.doc.inlineContent && e.doc.type.allowsMarkType(n) : !1;
		return e.doc.nodesBetween(t.pos, r.pos, (e, t, r) => {
			if (i) return !1;
			if (e.isInline) {
				let t = !r || r.type.allowsMarkType(n), a = !!n.isInSet(e.marks) || !e.marks.some((e) => e.type.excludes(n));
				i = t && a;
			}
			return !i;
		}), i;
	});
}
var Eg = (e, t = {}) => ({ tr: n, state: r, dispatch: i }) => {
	let { selection: a } = n, { empty: o, ranges: s } = a, c = mh(e, r.schema);
	if (i) if (o) {
		let e = og(r, c);
		n.addStoredMark(c.create({
			...e,
			...t
		}));
	} else s.forEach((e) => {
		let i = e.$from.pos, a = e.$to.pos;
		r.doc.nodesBetween(i, a, (e, r) => {
			let o = Math.max(r, i), s = Math.min(r + e.nodeSize, a);
			e.marks.find((e) => e.type === c) ? e.marks.forEach((e) => {
				c === e.type && n.addMark(o, s, c.create({
					...e.attrs,
					...t
				}));
			}) : n.addMark(o, s, c.create(t));
		});
	});
	return Tg(r, n, c);
}, Dg = (e, t) => ({ tr: n }) => (n.setMeta(e, t), !0), Og = (e, t = {}) => ({ state: n, dispatch: r, chain: i }) => {
	let a = _m(e, n.schema), o;
	return n.selection.$anchor.sameParent(n.selection.$head) && (o = n.selection.$anchor.parent.attrs), a.isTextblock ? i().command(({ commands: e }) => $p(a, {
		...o,
		...t
	})(n) ? !0 : e.clearNodes()).command(({ state: e }) => $p(a, {
		...o,
		...t
	})(e, r)).run() : (console.warn("[tiptap warn]: Currently \"setNode()\" only supports text block nodes."), !1);
}, kg = (e) => ({ tr: t, dispatch: n }) => {
	if (n) {
		let { doc: n } = t, r = vh(e, 0, n.content.size), i = H.create(n, r);
		t.setSelection(i);
	}
	return !0;
}, Ag = (e) => ({ tr: t, dispatch: n }) => {
	if (n) {
		let { doc: n } = t, { from: r, to: i } = typeof e == "number" ? {
			from: e,
			to: e
		} : e, a = V.atStart(n).from, o = V.atEnd(n).to, s = vh(r, a, o), c = vh(i, a, o), l = V.create(n, s, c);
		t.setSelection(l);
	}
	return !0;
}, jg = (e) => ({ state: t, dispatch: n }) => dm(_m(e, t.schema))(t, n);
function Mg(e, t) {
	let n = e.storedMarks || e.selection.$to.parentOffset && e.selection.$from.marks();
	if (n) {
		let r = n.filter((e) => t?.includes(e.type.name));
		e.tr.ensureMarks(r);
	}
}
var Ng = ({ keepMarks: e = !0 } = {}) => ({ tr: t, state: n, dispatch: r, editor: i }) => {
	let { selection: a, doc: o } = t, { $from: s, $to: c } = a, l = i.extensionManager.attributes, u = yg(l, s.node().type.name, s.node().attrs);
	if (a instanceof H && a.node.isBlock) return !s.parentOffset || !qs(o, s.pos) ? !1 : (r && (e && Mg(n, i.extensionManager.splittableMarks), t.split(s.pos).scrollIntoView()), !0);
	if (!s.parent.isBlock) return !1;
	let d = c.parentOffset === c.parent.content.size, f = s.depth === 0 ? void 0 : cg(s.node(-1).contentMatchAt(s.indexAfter(-1))), p = d && f ? [{
		type: f,
		attrs: u
	}] : void 0, m = qs(t.doc, t.mapping.map(s.pos), 1, p);
	if (!p && !m && qs(t.doc, t.mapping.map(s.pos), 1, f ? [{ type: f }] : void 0) && (m = !0, p = f ? [{
		type: f,
		attrs: u
	}] : void 0), r) {
		if (m && (a instanceof V && t.deleteSelection(), t.split(t.mapping.map(s.pos), 1, p), f && !d && !s.parentOffset && s.parent.type !== f)) {
			let e = t.mapping.map(s.before()), n = t.doc.resolve(e);
			s.node(-1).canReplaceWith(n.index(), n.index() + 1, f) && t.setNodeMarkup(t.mapping.map(s.before()), f);
		}
		e && Mg(n, i.extensionManager.splittableMarks), t.scrollIntoView();
	}
	return m;
}, Pg = (e, t = {}) => ({ tr: n, state: r, dispatch: i, editor: a }) => {
	let o = _m(e, r.schema), { $from: s, $to: c } = r.selection, l = r.selection.node;
	if (l && l.isBlock || s.depth < 2 || !s.sameParent(c)) return !1;
	let u = s.node(-1);
	if (u.type !== o) return !1;
	let d = a.extensionManager.attributes;
	if (s.parent.content.size === 0 && s.node(-1).childCount === s.indexAfter(-1)) {
		if (s.depth === 2 || s.node(-3).type !== o || s.index(-2) !== s.node(-2).childCount - 1) return !1;
		if (i) {
			let e = I.empty, r = s.index(-1) ? 1 : s.index(-2) ? 2 : 3;
			for (let t = s.depth - r; t >= s.depth - 3; --t) e = I.from(s.node(t).copy(e));
			let i = s.indexAfter(-1) < s.node(-2).childCount ? 1 : s.indexAfter(-2) < s.node(-3).childCount ? 2 : 3, a = {
				...yg(d, s.node().type.name, s.node().attrs),
				...t
			}, c = o.contentMatch.defaultType?.createAndFill(a) || void 0;
			e = e.append(I.from(o.createAndFill(null, c) || void 0));
			let l = s.before(s.depth - (r - 1));
			n.replace(l, s.after(-i), new R(e, 4 - r, 0));
			let u = -1;
			n.doc.nodesBetween(l, n.doc.content.size, (e, t) => {
				if (u > -1) return !1;
				e.isTextblock && e.content.size === 0 && (u = t + 1);
			}), u > -1 && n.setSelection(V.near(n.doc.resolve(u))), n.scrollIntoView();
		}
		return !0;
	}
	let f = c.pos === s.end() ? u.contentMatchAt(0).defaultType : null, p = {
		...yg(d, u.type.name, u.attrs),
		...t
	}, m = {
		...yg(d, s.node().type.name, s.node().attrs),
		...t
	};
	n.delete(s.pos, c.pos);
	let h = f ? [{
		type: o,
		attrs: p
	}, {
		type: f,
		attrs: m
	}] : [{
		type: o,
		attrs: p
	}];
	if (!qs(n.doc, s.pos, 2)) return !1;
	if (i) {
		let { selection: e, storedMarks: t } = r, { splittableMarks: o } = a.extensionManager, c = t || e.$to.parentOffset && e.$from.marks();
		if (n.split(s.pos, 2, h).scrollIntoView(), !c || !i) return !0;
		let l = c.filter((e) => o.includes(e.type.name));
		n.ensureMarks(l);
	}
	return !0;
}, Fg = (e, t) => {
	let n = dg((e) => e.type === t)(e.selection);
	if (!n) return !0;
	let r = e.doc.resolve(Math.max(0, n.pos - 1)).before(n.depth);
	if (r === void 0) return !0;
	let i = e.doc.nodeAt(r);
	return n.node.type === i?.type && Ys(e.doc, n.pos) && e.join(n.pos), !0;
}, Ig = (e, t) => {
	let n = dg((e) => e.type === t)(e.selection);
	if (!n) return !0;
	let r = e.doc.resolve(n.start).after(n.depth);
	if (r === void 0) return !0;
	let i = e.doc.nodeAt(r);
	return n.node.type === i?.type && Ys(e.doc, r) && e.join(r), !0;
}, Lg = /* @__PURE__ */ Object.freeze({
	__proto__: null,
	blur: Qm,
	clearContent: $m,
	clearNodes: eh,
	command: th,
	createParagraphNear: nh,
	cut: rh,
	deleteCurrentNode: ih,
	deleteNode: ah,
	deleteRange: oh,
	deleteSelection: sh,
	enter: ch,
	exitCode: lh,
	extendMarkRange: hh,
	first: gh,
	focus: Ch,
	forEach: wh,
	insertContent: Th,
	insertContentAt: jh,
	joinBackward: Ph,
	joinDown: Nh,
	joinForward: Fh,
	joinItemBackward: Ih,
	joinItemForward: Lh,
	joinTextblockBackward: Rh,
	joinTextblockForward: zh,
	joinUp: Mh,
	keyboardShortcut: Hh,
	lift: Wh,
	liftEmptyBlock: Gh,
	liftListItem: Kh,
	newlineInCode: qh,
	resetAttributes: Xh,
	scrollIntoView: Zh,
	selectAll: Qh,
	selectNodeBackward: $h,
	selectNodeForward: eg,
	selectParentNode: tg,
	selectTextblockEnd: ng,
	selectTextblockStart: rg,
	setContent: ag,
	setMark: Eg,
	setMeta: Dg,
	setNode: Og,
	setNodeSelection: kg,
	setTextSelection: Ag,
	sinkListItem: jg,
	splitBlock: Ng,
	splitListItem: Pg,
	toggleList: (e, t, n, r = {}) => ({ editor: i, tr: a, state: o, dispatch: s, chain: c, commands: l, can: u }) => {
		let { extensions: d, splittableMarks: f } = i.extensionManager, p = _m(e, o.schema), m = _m(t, o.schema), { selection: h, storedMarks: g } = o, { $from: _, $to: v } = h, y = _.blockRange(v), b = g || h.$to.parentOffset && h.$from.marks();
		if (!y) return !1;
		let x = dg((e) => Sg(e.type.name, d))(h);
		if (y.depth >= 1 && x && y.depth - x.depth <= 1) {
			if (x.node.type === p) return l.liftListItem(m);
			if (Sg(x.node.type.name, d) && p.validContent(x.node.content) && s) return c().command(() => (a.setNodeMarkup(x.pos, p), !0)).command(() => Fg(a, p)).command(() => Ig(a, p)).run();
		}
		return !n || !b || !s ? c().command(() => u().wrapInList(p, r) ? !0 : l.clearNodes()).wrapInList(p, r).command(() => Fg(a, p)).command(() => Ig(a, p)).run() : c().command(() => {
			let e = u().wrapInList(p, r), t = b.filter((e) => f.includes(e.type.name));
			return a.ensureMarks(t), e ? !0 : l.clearNodes();
		}).wrapInList(p, r).command(() => Fg(a, p)).command(() => Ig(a, p)).run();
	},
	toggleMark: (e, t = {}, n = {}) => ({ state: r, commands: i }) => {
		let { extendEmptyMarkRange: a = !1 } = n, o = mh(e, r.schema);
		return bg(r, o, t) ? i.unsetMark(o, { extendEmptyMarkRange: a }) : i.setMark(o, t);
	},
	toggleNode: (e, t, n = {}) => ({ state: r, commands: i }) => {
		let a = _m(e, r.schema), o = _m(t, r.schema), s = Uh(r, a, n), c;
		return r.selection.$anchor.sameParent(r.selection.$head) && (c = r.selection.$anchor.parent.attrs), s ? i.setNode(o, c) : i.setNode(a, {
			...c,
			...n
		});
	},
	toggleWrap: (e, t = {}) => ({ state: n, commands: r }) => {
		let i = _m(e, n.schema);
		return Uh(n, i, t) ? r.lift(i) : r.wrapIn(i, t);
	},
	undoInputRule: () => ({ state: e, dispatch: t }) => {
		let n = e.plugins;
		for (let r = 0; r < n.length; r += 1) {
			let i = n[r], a;
			if (i.spec.isInputRules && (a = i.getState(e))) {
				if (t) {
					let t = e.tr, n = a.transform;
					for (let e = n.steps.length - 1; e >= 0; --e) t.step(n.steps[e].invert(n.docs[e]));
					if (a.text) {
						let n = t.doc.resolve(a.from).marks();
						t.replaceWith(a.from, a.to, e.schema.text(a.text, n));
					} else t.delete(a.from, a.to);
				}
				return !0;
			}
		}
		return !1;
	},
	unsetAllMarks: () => ({ tr: e, dispatch: t }) => {
		let { selection: n } = e, { empty: r, ranges: i } = n;
		return r || t && i.forEach((t) => {
			e.removeMark(t.$from.pos, t.$to.pos);
		}), !0;
	},
	unsetMark: (e, t = {}) => ({ tr: n, state: r, dispatch: i }) => {
		let { extendEmptyMarkRange: a = !1 } = t, { selection: o } = n, s = mh(e, r.schema), { $from: c, empty: l, ranges: u } = o;
		if (!i) return !0;
		if (l && a) {
			let { from: e, to: t } = o, r = ph(c, s, c.marks().find((e) => e.type === s)?.attrs);
			r && (e = r.from, t = r.to), n.removeMark(e, t, s);
		} else u.forEach((e) => {
			n.removeMark(e.$from.pos, e.$to.pos, s);
		});
		return n.removeStoredMark(s), !0;
	},
	updateAttributes: (e, t = {}) => ({ tr: n, state: r, dispatch: i }) => {
		let a = null, o = null, s = Jh(typeof e == "string" ? e : e.name, r.schema);
		return s ? (s === "node" && (a = _m(e, r.schema)), s === "mark" && (o = mh(e, r.schema)), i && n.selection.ranges.forEach((e) => {
			let i = e.$from.pos, s = e.$to.pos, c, l, u, d;
			n.selection.empty ? r.doc.nodesBetween(i, s, (e, t) => {
				a && a === e.type && (u = Math.max(t, i), d = Math.min(t + e.nodeSize, s), c = t, l = e);
			}) : r.doc.nodesBetween(i, s, (e, r) => {
				r < i && a && a === e.type && (u = Math.max(r, i), d = Math.min(r + e.nodeSize, s), c = r, l = e), r >= i && r <= s && (a && a === e.type && n.setNodeMarkup(r, void 0, {
					...e.attrs,
					...t
				}), o && e.marks.length && e.marks.forEach((a) => {
					if (o === a.type) {
						let c = Math.max(r, i), l = Math.min(r + e.nodeSize, s);
						n.addMark(c, l, o.create({
							...a.attrs,
							...t
						}));
					}
				}));
			}), l && (c !== void 0 && n.setNodeMarkup(c, void 0, {
				...l.attrs,
				...t
			}), o && l.marks.length && l.marks.forEach((e) => {
				o === e.type && n.addMark(u, d, o.create({
					...e.attrs,
					...t
				}));
			}));
		}), !0) : !1;
	},
	wrapIn: (e, t = {}) => ({ state: n, dispatch: r }) => Qp(_m(e, n.schema), t)(n, r),
	wrapInList: (e, t = {}) => ({ state: n, dispatch: r }) => am(_m(e, n.schema), t)(n, r)
}), Rg = Jm.create({
	name: "commands",
	addCommands() {
		return { ...Lg };
	}
}), zg = Jm.create({
	name: "drop",
	addProseMirrorPlugins() {
		return [new Vc({
			key: new Wc("tiptapDrop"),
			props: { handleDrop: (e, t, n, r) => {
				this.editor.emit("drop", {
					editor: this.editor,
					event: t,
					slice: n,
					moved: r
				});
			} }
		})];
	}
}), Bg = Jm.create({
	name: "editable",
	addProseMirrorPlugins() {
		return [new Vc({
			key: new Wc("editable"),
			props: { editable: () => this.editor.options.editable }
		})];
	}
}), Vg = new Wc("focusEvents"), Hg = Jm.create({
	name: "focusEvents",
	addProseMirrorPlugins() {
		let { editor: e } = this;
		return [new Vc({
			key: Vg,
			props: { handleDOMEvents: {
				focus: (t, n) => {
					e.isFocused = !0;
					let r = e.state.tr.setMeta("focus", { event: n }).setMeta("addToHistory", !1);
					return t.dispatch(r), !1;
				},
				blur: (t, n) => {
					e.isFocused = !1;
					let r = e.state.tr.setMeta("blur", { event: n }).setMeta("addToHistory", !1);
					return t.dispatch(r), !1;
				}
			} }
		})];
	}
}), Ug = Jm.create({
	name: "keymap",
	addKeyboardShortcuts() {
		let e = () => this.editor.commands.first(({ commands: e }) => [
			() => e.undoInputRule(),
			() => e.command(({ tr: t }) => {
				let { selection: n, doc: r } = t, { empty: i, $anchor: a } = n, { pos: o, parent: s } = a, c = a.parent.isTextblock && o > 0 ? t.doc.resolve(o - 1) : a, l = c.parent.type.spec.isolating, u = a.pos - a.parentOffset, d = l && c.parent.childCount === 1 ? u === a.pos : B.atStart(r).from === o;
				return !i || !s.type.isTextblock || s.textContent.length || !d || d && a.parent.type.name === "paragraph" ? !1 : e.clearNodes();
			}),
			() => e.deleteSelection(),
			() => e.joinBackward(),
			() => e.selectNodeBackward()
		]), t = () => this.editor.commands.first(({ commands: e }) => [
			() => e.deleteSelection(),
			() => e.deleteCurrentNode(),
			() => e.joinForward(),
			() => e.selectNodeForward()
		]), n = {
			Enter: () => this.editor.commands.first(({ commands: e }) => [
				() => e.newlineInCode(),
				() => e.createParagraphNear(),
				() => e.liftEmptyBlock(),
				() => e.splitBlock()
			]),
			"Mod-Enter": () => this.editor.commands.exitCode(),
			Backspace: e,
			"Mod-Backspace": e,
			"Shift-Backspace": e,
			Delete: t,
			"Mod-Delete": t,
			"Mod-a": () => this.editor.commands.selectAll()
		}, r = { ...n }, i = {
			...n,
			"Ctrl-h": e,
			"Alt-Backspace": e,
			"Ctrl-d": t,
			"Ctrl-Alt-Backspace": t,
			"Alt-Delete": t,
			"Alt-d": t,
			"Ctrl-a": () => this.editor.commands.selectTextblockStart(),
			"Ctrl-e": () => this.editor.commands.selectTextblockEnd()
		};
		return xh() || Bh() ? i : r;
	},
	addProseMirrorPlugins() {
		return [new Vc({
			key: new Wc("clearDocument"),
			appendTransaction: (e, t, n) => {
				if (e.some((e) => e.getMeta("composition"))) return;
				let r = e.some((e) => e.docChanged) && !t.doc.eq(n.doc), i = e.some((e) => e.getMeta("preventClearDocument"));
				if (!r || i) return;
				let { empty: a, from: o, to: s } = t.selection, c = B.atStart(t.doc).from, l = B.atEnd(t.doc).to;
				if (a || !(o === c && s === l) || !Cg(n.doc)) return;
				let u = n.tr, d = fm({
					state: n,
					transaction: u
				}), { commands: f } = new pm({
					editor: this.editor,
					state: d
				});
				if (f.clearNodes(), u.steps.length) return u;
			}
		})];
	}
}), Wg = Jm.create({
	name: "paste",
	addProseMirrorPlugins() {
		return [new Vc({
			key: new Wc("tiptapPaste"),
			props: { handlePaste: (e, t, n) => {
				this.editor.emit("paste", {
					editor: this.editor,
					event: t,
					slice: n
				});
			} }
		})];
	}
}), Gg = Jm.create({
	name: "tabindex",
	addProseMirrorPlugins() {
		return [new Vc({
			key: new Wc("tabindex"),
			props: { attributes: () => this.editor.isEditable ? { tabindex: "0" } : {} }
		})];
	}
}), Kg = class e {
	get name() {
		return this.node.type.name;
	}
	constructor(e, t, n = !1, r = null) {
		this.currentNode = null, this.actualDepth = null, this.isBlock = n, this.resolvedPos = e, this.editor = t, this.currentNode = r;
	}
	get node() {
		return this.currentNode || this.resolvedPos.node();
	}
	get element() {
		return this.editor.view.domAtPos(this.pos).node;
	}
	get depth() {
		return this.actualDepth ?? this.resolvedPos.depth;
	}
	get pos() {
		return this.resolvedPos.pos;
	}
	get content() {
		return this.node.content;
	}
	set content(e) {
		let t = this.from, n = this.to;
		if (this.isBlock) {
			if (this.content.size === 0) {
				console.error(`You can’t set content on a block node. Tried to set content on ${this.name} at ${this.pos}`);
				return;
			}
			t = this.from + 1, n = this.to - 1;
		}
		this.editor.commands.insertContentAt({
			from: t,
			to: n
		}, e);
	}
	get attributes() {
		return this.node.attrs;
	}
	get textContent() {
		return this.node.textContent;
	}
	get size() {
		return this.node.nodeSize;
	}
	get from() {
		return this.isBlock ? this.pos : this.resolvedPos.start(this.resolvedPos.depth);
	}
	get range() {
		return {
			from: this.from,
			to: this.to
		};
	}
	get to() {
		return this.isBlock ? this.pos + this.size : this.resolvedPos.end(this.resolvedPos.depth) + +!this.node.isText;
	}
	get parent() {
		if (this.depth === 0) return null;
		let t = this.resolvedPos.start(this.resolvedPos.depth - 1);
		return new e(this.resolvedPos.doc.resolve(t), this.editor);
	}
	get before() {
		let t = this.resolvedPos.doc.resolve(this.from - (this.isBlock ? 1 : 2));
		return t.depth !== this.depth && (t = this.resolvedPos.doc.resolve(this.from - 3)), new e(t, this.editor);
	}
	get after() {
		let t = this.resolvedPos.doc.resolve(this.to + (this.isBlock ? 2 : 1));
		return t.depth !== this.depth && (t = this.resolvedPos.doc.resolve(this.to + 3)), new e(t, this.editor);
	}
	get children() {
		let t = [];
		return this.node.content.forEach((n, r) => {
			let i = n.isBlock && !n.isTextblock, a = n.isAtom && !n.isText, o = this.pos + r + +!a;
			if (o < 0 || o > this.resolvedPos.doc.nodeSize - 2) return;
			let s = this.resolvedPos.doc.resolve(o);
			if (!i && s.depth <= this.depth) return;
			let c = new e(s, this.editor, i, i ? n : null);
			i && (c.actualDepth = this.depth + 1), t.push(new e(s, this.editor, i, i ? n : null));
		}), t;
	}
	get firstChild() {
		return this.children[0] || null;
	}
	get lastChild() {
		let e = this.children;
		return e[e.length - 1] || null;
	}
	closest(e, t = {}) {
		let n = null, r = this.parent;
		for (; r && !n;) {
			if (r.node.type.name === e) if (Object.keys(t).length > 0) {
				let e = r.node.attrs, n = Object.keys(t);
				for (let r = 0; r < n.length; r += 1) {
					let i = n[r];
					if (e[i] !== t[i]) break;
				}
			} else n = r;
			r = r.parent;
		}
		return n;
	}
	querySelector(e, t = {}) {
		return this.querySelectorAll(e, t, !0)[0] || null;
	}
	querySelectorAll(e, t = {}, n = !1) {
		let r = [];
		if (!this.children || this.children.length === 0) return r;
		let i = Object.keys(t);
		return this.children.forEach((a) => {
			n && r.length > 0 || (a.node.type.name === e && i.every((e) => t[e] === a.node.attrs[e]) && r.push(a), !(n && r.length > 0) && (r = r.concat(a.querySelectorAll(e, t, n))));
		}), r;
	}
	setAttribute(e) {
		let { tr: t } = this.editor.state;
		t.setNodeMarkup(this.from, void 0, {
			...this.node.attrs,
			...e
		}), this.editor.view.dispatch(t);
	}
}, qg = ".ProseMirror {\n  position: relative;\n}\n\n.ProseMirror {\n  word-wrap: break-word;\n  white-space: pre-wrap;\n  white-space: break-spaces;\n  -webkit-font-variant-ligatures: none;\n  font-variant-ligatures: none;\n  font-feature-settings: \"liga\" 0; /* the above doesn't seem to work in Edge */\n}\n\n.ProseMirror [contenteditable=\"false\"] {\n  white-space: normal;\n}\n\n.ProseMirror [contenteditable=\"false\"] [contenteditable=\"true\"] {\n  white-space: pre-wrap;\n}\n\n.ProseMirror pre {\n  white-space: pre-wrap;\n}\n\nimg.ProseMirror-separator {\n  display: inline !important;\n  border: none !important;\n  margin: 0 !important;\n  width: 0 !important;\n  height: 0 !important;\n}\n\n.ProseMirror-gapcursor {\n  display: none;\n  pointer-events: none;\n  position: absolute;\n  margin: 0;\n}\n\n.ProseMirror-gapcursor:after {\n  content: \"\";\n  display: block;\n  position: absolute;\n  top: -2px;\n  width: 20px;\n  border-top: 1px solid black;\n  animation: ProseMirror-cursor-blink 1.1s steps(2, start) infinite;\n}\n\n@keyframes ProseMirror-cursor-blink {\n  to {\n    visibility: hidden;\n  }\n}\n\n.ProseMirror-hideselection *::selection {\n  background: transparent;\n}\n\n.ProseMirror-hideselection *::-moz-selection {\n  background: transparent;\n}\n\n.ProseMirror-hideselection * {\n  caret-color: transparent;\n}\n\n.ProseMirror-focused .ProseMirror-gapcursor {\n  display: block;\n}\n\n.tippy-box[data-animation=fade][data-state=hidden] {\n  opacity: 0\n}";
function Jg(e, t, n) {
	let r = document.querySelector(`style[data-tiptap-style${n ? `-${n}` : ""}]`);
	if (r !== null) return r;
	let i = document.createElement("style");
	return t && i.setAttribute("nonce", t), i.setAttribute(`data-tiptap-style${n ? `-${n}` : ""}`, ""), i.innerHTML = e, document.getElementsByTagName("head")[0].appendChild(i), i;
}
var Yg = class extends mm {
	constructor(e = {}) {
		super(), this.isFocused = !1, this.isInitialized = !1, this.extensionStorage = {}, this.options = {
			element: document.createElement("div"),
			content: "",
			injectCSS: !0,
			injectNonce: void 0,
			extensions: [],
			autofocus: !1,
			editable: !0,
			editorProps: {},
			parseOptions: {},
			coreExtensionOptions: {},
			enableInputRules: !0,
			enablePasteRules: !0,
			enableCoreExtensions: !0,
			enableContentCheck: !1,
			emitContentError: !1,
			onBeforeCreate: () => null,
			onCreate: () => null,
			onUpdate: () => null,
			onSelectionUpdate: () => null,
			onTransaction: () => null,
			onFocus: () => null,
			onBlur: () => null,
			onDestroy: () => null,
			onContentError: ({ error: e }) => {
				throw e;
			},
			onPaste: () => null,
			onDrop: () => null
		}, this.isCapturingTransaction = !1, this.capturedTransaction = null, this.setOptions(e), this.createExtensionManager(), this.createCommandManager(), this.createSchema(), this.on("beforeCreate", this.options.onBeforeCreate), this.emit("beforeCreate", { editor: this }), this.on("contentError", this.options.onContentError), this.createView(), this.injectCSS(), this.on("create", this.options.onCreate), this.on("update", this.options.onUpdate), this.on("selectionUpdate", this.options.onSelectionUpdate), this.on("transaction", this.options.onTransaction), this.on("focus", this.options.onFocus), this.on("blur", this.options.onBlur), this.on("destroy", this.options.onDestroy), this.on("drop", ({ event: e, slice: t, moved: n }) => this.options.onDrop(e, t, n)), this.on("paste", ({ event: e, slice: t }) => this.options.onPaste(e, t)), window.setTimeout(() => {
			this.isDestroyed || (this.commands.focus(this.options.autofocus), this.emit("create", { editor: this }), this.isInitialized = !0);
		}, 0);
	}
	get storage() {
		return this.extensionStorage;
	}
	get commands() {
		return this.commandManager.commands;
	}
	chain() {
		return this.commandManager.chain();
	}
	can() {
		return this.commandManager.can();
	}
	injectCSS() {
		this.options.injectCSS && document && (this.css = Jg(qg, this.options.injectNonce));
	}
	setOptions(e = {}) {
		this.options = {
			...this.options,
			...e
		}, !(!this.view || !this.state || this.isDestroyed) && (this.options.editorProps && this.view.setProps(this.options.editorProps), this.view.updateState(this.state));
	}
	setEditable(e, t = !0) {
		this.setOptions({ editable: e }), t && this.emit("update", {
			editor: this,
			transaction: this.state.tr
		});
	}
	get isEditable() {
		return this.options.editable && this.view && this.view.editable;
	}
	get state() {
		return this.view.state;
	}
	registerPlugin(e, t) {
		let n = bm(t) ? t(e, [...this.state.plugins]) : [...this.state.plugins, e], r = this.state.reconfigure({ plugins: n });
		return this.view.updateState(r), r;
	}
	unregisterPlugin(e) {
		if (this.isDestroyed) return;
		let t = this.state.plugins, n = t;
		if ([].concat(e).forEach((e) => {
			let t = typeof e == "string" ? `${e}$` : e.key;
			n = n.filter((e) => !e.key.startsWith(t));
		}), t.length === n.length) return;
		let r = this.state.reconfigure({ plugins: n });
		return this.view.updateState(r), r;
	}
	createExtensionManager() {
		let e = [...this.options.enableCoreExtensions ? [
			Bg,
			Zm.configure({ blockSeparator: this.options.coreExtensionOptions?.clipboardTextSerializer?.blockSeparator }),
			Rg,
			Hg,
			Ug,
			Gg,
			zg,
			Wg
		].filter((e) => typeof this.options.enableCoreExtensions == "object" ? this.options.enableCoreExtensions[e.name] !== !1 : !0) : [], ...this.options.extensions].filter((e) => [
			"extension",
			"node",
			"mark"
		].includes(e?.type));
		this.extensionManager = new qm(e, this);
	}
	createCommandManager() {
		this.commandManager = new pm({ editor: this });
	}
	createSchema() {
		this.schema = this.extensionManager.schema;
	}
	createView() {
		let e;
		try {
			e = ig(this.options.content, this.schema, this.options.parseOptions, { errorOnInvalidContent: this.options.enableContentCheck });
		} catch (t) {
			if (!(t instanceof Error) || !["[tiptap error]: Invalid JSON content", "[tiptap error]: Invalid HTML content"].includes(t.message)) throw t;
			this.emit("contentError", {
				editor: this,
				error: t,
				disableCollaboration: () => {
					this.storage.collaboration && (this.storage.collaboration.isDisabled = !0), this.options.extensions = this.options.extensions.filter((e) => e.name !== "collaboration"), this.createExtensionManager();
				}
			}), e = ig(this.options.content, this.schema, this.options.parseOptions, { errorOnInvalidContent: !1 });
		}
		let t = yh(e, this.options.autofocus);
		this.view = new ep(this.options.element, {
			...this.options.editorProps,
			attributes: {
				role: "textbox",
				...this.options.editorProps?.attributes
			},
			dispatchTransaction: this.dispatchTransaction.bind(this),
			state: zc.create({
				doc: e,
				selection: t || void 0
			})
		});
		let n = this.state.reconfigure({ plugins: this.extensionManager.plugins });
		this.view.updateState(n), this.createNodeViews(), this.prependClass();
		let r = this.view.dom;
		r.editor = this;
	}
	createNodeViews() {
		this.view.isDestroyed || this.view.setProps({ nodeViews: this.extensionManager.nodeViews });
	}
	prependClass() {
		this.view.dom.className = `tiptap ${this.view.dom.className}`;
	}
	captureTransaction(e) {
		this.isCapturingTransaction = !0, e(), this.isCapturingTransaction = !1;
		let t = this.capturedTransaction;
		return this.capturedTransaction = null, t;
	}
	dispatchTransaction(e) {
		if (this.view.isDestroyed) return;
		if (this.isCapturingTransaction) {
			if (!this.capturedTransaction) {
				this.capturedTransaction = e;
				return;
			}
			e.steps.forEach((e) => this.capturedTransaction?.step(e));
			return;
		}
		let t = this.state.apply(e), n = !this.state.selection.eq(t.selection);
		this.emit("beforeTransaction", {
			editor: this,
			transaction: e,
			nextState: t
		}), this.view.updateState(t), this.emit("transaction", {
			editor: this,
			transaction: e
		}), n && this.emit("selectionUpdate", {
			editor: this,
			transaction: e
		});
		let r = e.getMeta("focus"), i = e.getMeta("blur");
		r && this.emit("focus", {
			editor: this,
			event: r.event,
			transaction: e
		}), i && this.emit("blur", {
			editor: this,
			event: i.event,
			transaction: e
		}), !(!e.docChanged || e.getMeta("preventUpdate")) && this.emit("update", {
			editor: this,
			transaction: e
		});
	}
	getAttributes(e) {
		return mg(this.state, e);
	}
	isActive(e, t) {
		let n = typeof e == "string" ? e : null, r = typeof e == "string" ? t : e;
		return xg(this.state, n, r);
	}
	getJSON() {
		return this.state.doc.toJSON();
	}
	getHTML() {
		return Om(this.state.doc.content, this.schema);
	}
	getText(e) {
		let { blockSeparator: t = "\n\n", textSerializers: n = {} } = e || {};
		return fg(this.state.doc, {
			blockSeparator: t,
			textSerializers: {
				...Xm(this.schema),
				...n
			}
		});
	}
	get isEmpty() {
		return Cg(this.state.doc);
	}
	getCharacterCount() {
		return console.warn("[tiptap warn]: \"editor.getCharacterCount()\" is deprecated. Please use \"editor.storage.characterCount.characters()\" instead."), this.state.doc.content.size - 2;
	}
	destroy() {
		if (this.emit("destroy"), this.view) {
			let e = this.view.dom;
			e && e.editor && delete e.editor, this.view.destroy();
		}
		this.removeAllListeners();
	}
	get isDestroyed() {
		return !this.view?.docView;
	}
	$node(e, t) {
		return this.$doc?.querySelector(e, t) || null;
	}
	$nodes(e, t) {
		return this.$doc?.querySelectorAll(e, t) || null;
	}
	$pos(e) {
		return new Kg(this.state.doc.resolve(e), this);
	}
	get $doc() {
		return this.$pos(0);
	}
};
function Xg(e) {
	return new jm({
		find: e.find,
		handler: ({ state: t, range: n, match: r }) => {
			let i = Z(e.getAttributes, void 0, r);
			if (i === !1 || i === null) return null;
			let { tr: a } = t, o = r[r.length - 1], s = r[0];
			if (o) {
				let r = s.search(/\S/), c = n.from + s.indexOf(o), l = c + o.length;
				if (vg(n.from, n.to, t.doc).filter((t) => t.mark.type.excluded.find((n) => n === e.type && n !== t.mark.type)).filter((e) => e.to > c).length) return null;
				l < n.to && a.delete(l, n.to), c > n.from && a.delete(n.from + r, c);
				let u = n.from + r + o.length;
				a.addMark(n.from + r, u, e.type.create(i || {})), a.removeStoredMark(e.type);
			}
		}
	});
}
function Zg(e) {
	return new jm({
		find: e.find,
		handler: ({ state: t, range: n, match: r }) => {
			let i = Z(e.getAttributes, void 0, r) || {}, { tr: a } = t, o = n.from, s = n.to, c = e.type.create(i);
			if (r[1]) {
				let e = o + r[0].lastIndexOf(r[1]);
				e > s ? e = s : s = e + r[1].length;
				let t = r[0][r[0].length - 1];
				a.insertText(t, o + r[0].length - 1), a.replaceWith(e, s, c);
			} else if (r[0]) {
				let t = e.type.isInline ? o : o - 1;
				a.insert(t, e.type.create(i)).delete(a.mapping.map(o), a.mapping.map(s));
			}
			a.scrollIntoView();
		}
	});
}
function Qg(e) {
	return new jm({
		find: e.find,
		handler: ({ state: t, range: n, match: r }) => {
			let i = t.doc.resolve(n.from), a = Z(e.getAttributes, void 0, r) || {};
			if (!i.node(-1).canReplaceWith(i.index(-1), i.indexAfter(-1), e.type)) return null;
			t.tr.delete(n.from, n.to).setBlockType(n.from, n.from, e.type, a);
		}
	});
}
function $g(e) {
	return new jm({
		find: e.find,
		handler: ({ state: t, range: n, match: r, chain: i }) => {
			let a = Z(e.getAttributes, void 0, r) || {}, o = t.tr.delete(n.from, n.to), s = o.doc.resolve(n.from).blockRange(), c = s && Ls(s, e.type, a);
			if (!c) return null;
			if (o.wrap(s, c), e.keepMarks && e.editor) {
				let { selection: n, storedMarks: r } = t, { splittableMarks: i } = e.editor.extensionManager, a = r || n.$to.parentOffset && n.$from.marks();
				if (a) {
					let e = a.filter((e) => i.includes(e.type.name));
					o.ensureMarks(e);
				}
			}
			if (e.keepAttributes) {
				let t = e.type.name === "bulletList" || e.type.name === "orderedList" ? "listItem" : "taskList";
				i().updateAttributes(t, a).run();
			}
			let l = o.doc.resolve(n.from - 1).nodeBefore;
			l && l.type === e.type && Ys(o.doc, n.from - 1) && (!e.joinPredicate || e.joinPredicate(r, l)) && o.join(n.from - 1);
		}
	});
}
var e_ = class e {
	constructor(e = {}) {
		this.type = "node", this.name = "node", this.parent = null, this.child = null, this.config = {
			name: this.name,
			defaultOptions: {}
		}, this.config = {
			...this.config,
			...e
		}, this.name = this.config.name, e.defaultOptions && Object.keys(e.defaultOptions).length > 0 && console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${this.name}".`), this.options = this.config.defaultOptions, this.config.addOptions && (this.options = Z(X(this, "addOptions", { name: this.name }))), this.storage = Z(X(this, "addStorage", {
			name: this.name,
			options: this.options
		})) || {};
	}
	static create(t = {}) {
		return new e(t);
	}
	configure(e = {}) {
		let t = this.extend({
			...this.config,
			addOptions: () => Lm(this.options, e)
		});
		return t.name = this.name, t.parent = this.parent, t;
	}
	extend(t = {}) {
		let n = new e(t);
		return n.parent = this, this.child = n, n.name = t.name ? t.name : n.parent.name, t.defaultOptions && Object.keys(t.defaultOptions).length > 0 && console.warn(`[tiptap warn]: BREAKING CHANGE: "defaultOptions" is deprecated. Please use "addOptions" instead. Found in extension: "${n.name}".`), n.options = Z(X(n, "addOptions", { name: n.name })), n.storage = Z(X(n, "addStorage", {
			name: n.name,
			options: n.options
		})), n;
	}
};
function t_(e) {
	return new Bm({
		find: e.find,
		handler: ({ state: t, range: n, match: r, pasteEvent: i }) => {
			let a = Z(e.getAttributes, void 0, r, i);
			if (a === !1 || a === null) return null;
			let { tr: o } = t, s = r[r.length - 1], c = r[0], l = n.to;
			if (s) {
				let r = c.search(/\S/), i = n.from + c.indexOf(s), u = i + s.length;
				if (vg(n.from, n.to, t.doc).filter((t) => t.mark.type.excluded.find((n) => n === e.type && n !== t.mark.type)).filter((e) => e.to > i).length) return null;
				u < n.to && o.delete(u, n.to), i > n.from && o.delete(n.from + r, i), l = n.from + r + s.length, o.addMark(n.from + r, l, e.type.create(a || {})), o.removeStoredMark(e.type);
			}
		}
	});
}
function n_(e, t) {
	let { selection: n } = e, { $from: r } = n;
	if (n instanceof H) {
		let e = r.index();
		return r.parent.canReplaceWith(e, e + 1, t);
	}
	let i = r.depth;
	for (; i >= 0;) {
		let e = r.index(i);
		if (r.node(i).contentMatchAt(e).matchType(t)) return !0;
		--i;
	}
	return !1;
}
//#endregion
//#region node_modules/@tiptap/react/dist/index.js
function r_(e) {
	return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var i_ = { exports: {} }, a_ = {}, o_;
function s_() {
	if (o_) return a_;
	o_ = 1;
	var e = _.default;
	function t(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var n = typeof Object.is == "function" ? Object.is : t, r = e.useState, i = e.useEffect, a = e.useLayoutEffect, o = e.useDebugValue;
	function s(e, t) {
		var n = t(), s = r({ inst: {
			value: n,
			getSnapshot: t
		} }), l = s[0].inst, u = s[1];
		return a(function() {
			l.value = n, l.getSnapshot = t, c(l) && u({ inst: l });
		}, [
			e,
			n,
			t
		]), i(function() {
			return c(l) && u({ inst: l }), e(function() {
				c(l) && u({ inst: l });
			});
		}, [e]), o(n), n;
	}
	function c(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var r = t();
			return !n(e, r);
		} catch {
			return !0;
		}
	}
	function l(e, t) {
		return t();
	}
	var u = typeof window > "u" || window.document === void 0 || window.document.createElement === void 0 ? l : s;
	return a_.useSyncExternalStore = e.useSyncExternalStore === void 0 ? u : e.useSyncExternalStore, a_;
}
i_.exports = s_();
var c_ = i_.exports, l_ = (...e) => (t) => {
	e.forEach((e) => {
		typeof e == "function" ? e(t) : e && (e.current = t);
	});
}, u_ = ({ contentComponent: e }) => {
	let t = c_.useSyncExternalStore(e.subscribe, e.getSnapshot, e.getServerSnapshot);
	return _.createElement(_.Fragment, null, Object.values(t));
};
function d_() {
	let e = /* @__PURE__ */ new Set(), t = {};
	return {
		subscribe(t) {
			return e.add(t), () => {
				e.delete(t);
			};
		},
		getSnapshot() {
			return t;
		},
		getServerSnapshot() {
			return t;
		},
		setRenderer(n, r) {
			t = {
				...t,
				[n]: Te.createPortal(r.reactElement, r.element, n)
			}, e.forEach((e) => e());
		},
		removeRenderer(n) {
			let r = { ...t };
			delete r[n], t = r, e.forEach((e) => e());
		}
	};
}
var f_ = class extends _.Component {
	constructor(e) {
		super(e), this.editorContentRef = _.createRef(), this.initialized = !1, this.state = { hasContentComponentInitialized: !!e.editor?.contentComponent };
	}
	componentDidMount() {
		this.init();
	}
	componentDidUpdate() {
		this.init();
	}
	init() {
		let e = this.props.editor;
		if (e && !e.isDestroyed && e.options.element) {
			if (e.contentComponent) return;
			let t = this.editorContentRef.current;
			t.append(...e.options.element.childNodes), e.setOptions({ element: t }), e.contentComponent = d_(), this.state.hasContentComponentInitialized || (this.unsubscribeToContentComponent = e.contentComponent.subscribe(() => {
				this.setState((e) => e.hasContentComponentInitialized ? e : { hasContentComponentInitialized: !0 }), this.unsubscribeToContentComponent && this.unsubscribeToContentComponent();
			})), e.createNodeViews(), this.initialized = !0;
		}
	}
	componentWillUnmount() {
		let e = this.props.editor;
		if (!e || (this.initialized = !1, e.isDestroyed || e.view.setProps({ nodeViews: {} }), this.unsubscribeToContentComponent && this.unsubscribeToContentComponent(), e.contentComponent = null, !e.options.element.firstChild)) return;
		let t = document.createElement("div");
		t.append(...e.options.element.childNodes), e.setOptions({ element: t });
	}
	render() {
		let { editor: e, innerRef: t, ...n } = this.props;
		return _.createElement(_.Fragment, null, _.createElement("div", {
			ref: l_(t, this.editorContentRef),
			...n
		}), e?.contentComponent && _.createElement(u_, { contentComponent: e.contentComponent }));
	}
}, p_ = (0, _.forwardRef)((e, t) => {
	let n = _.useMemo(() => Math.floor(Math.random() * 4294967295).toString(), [e.editor]);
	return _.createElement(f_, {
		key: n,
		innerRef: t,
		...e
	});
}), m_ = _.memo(p_), h_ = /* @__PURE__ */ r_(function e(t, n) {
	if (t === n) return !0;
	if (t && n && typeof t == "object" && typeof n == "object") {
		if (t.constructor !== n.constructor) return !1;
		var r, i, a;
		if (Array.isArray(t)) {
			if (r = t.length, r != n.length) return !1;
			for (i = r; i-- !== 0;) if (!e(t[i], n[i])) return !1;
			return !0;
		}
		if (t instanceof Map && n instanceof Map) {
			if (t.size !== n.size) return !1;
			for (i of t.entries()) if (!n.has(i[0])) return !1;
			for (i of t.entries()) if (!e(i[1], n.get(i[0]))) return !1;
			return !0;
		}
		if (t instanceof Set && n instanceof Set) {
			if (t.size !== n.size) return !1;
			for (i of t.entries()) if (!n.has(i[0])) return !1;
			return !0;
		}
		if (ArrayBuffer.isView(t) && ArrayBuffer.isView(n)) {
			if (r = t.length, r != n.length) return !1;
			for (i = r; i-- !== 0;) if (t[i] !== n[i]) return !1;
			return !0;
		}
		if (t.constructor === RegExp) return t.source === n.source && t.flags === n.flags;
		if (t.valueOf !== Object.prototype.valueOf) return t.valueOf() === n.valueOf();
		if (t.toString !== Object.prototype.toString) return t.toString() === n.toString();
		if (a = Object.keys(t), r = a.length, r !== Object.keys(n).length) return !1;
		for (i = r; i-- !== 0;) if (!Object.prototype.hasOwnProperty.call(n, a[i])) return !1;
		for (i = r; i-- !== 0;) {
			var o = a[i];
			if (!(o === "_owner" && t.$$typeof) && !e(t[o], n[o])) return !1;
		}
		return !0;
	}
	return t !== t && n !== n;
}), g_ = { exports: {} }, __ = {}, v_;
function y_() {
	if (v_) return __;
	v_ = 1;
	var e = _.default, t = c_;
	function n(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var r = typeof Object.is == "function" ? Object.is : n, i = t.useSyncExternalStore, a = e.useRef, o = e.useEffect, s = e.useMemo, c = e.useDebugValue;
	return __.useSyncExternalStoreWithSelector = function(e, t, n, l, u) {
		var d = a(null);
		if (d.current === null) {
			var f = {
				hasValue: !1,
				value: null
			};
			d.current = f;
		} else f = d.current;
		d = s(function() {
			function e(e) {
				if (!i) {
					if (i = !0, a = e, e = l(e), u !== void 0 && f.hasValue) {
						var t = f.value;
						if (u(t, e)) return o = t;
					}
					return o = e;
				}
				if (t = o, r(a, e)) return t;
				var n = l(e);
				return u !== void 0 && u(t, n) ? t : (a = e, o = n);
			}
			var i = !1, a, o, s = n === void 0 ? null : n;
			return [function() {
				return e(t());
			}, s === null ? void 0 : function() {
				return e(s());
			}];
		}, [
			t,
			n,
			l,
			u
		]);
		var p = i(e, d[0], d[1]);
		return o(function() {
			f.hasValue = !0, f.value = p;
		}, [p]), c(p), p;
	}, __;
}
g_.exports = y_();
var b_ = g_.exports, x_ = typeof window < "u" ? _.useLayoutEffect : _.useEffect, S_ = class {
	constructor(e) {
		this.transactionNumber = 0, this.lastTransactionNumber = 0, this.subscribers = /* @__PURE__ */ new Set(), this.editor = e, this.lastSnapshot = {
			editor: e,
			transactionNumber: 0
		}, this.getSnapshot = this.getSnapshot.bind(this), this.getServerSnapshot = this.getServerSnapshot.bind(this), this.watch = this.watch.bind(this), this.subscribe = this.subscribe.bind(this);
	}
	getSnapshot() {
		return this.transactionNumber === this.lastTransactionNumber ? this.lastSnapshot : (this.lastTransactionNumber = this.transactionNumber, this.lastSnapshot = {
			editor: this.editor,
			transactionNumber: this.transactionNumber
		}, this.lastSnapshot);
	}
	getServerSnapshot() {
		return {
			editor: null,
			transactionNumber: 0
		};
	}
	subscribe(e) {
		return this.subscribers.add(e), () => {
			this.subscribers.delete(e);
		};
	}
	watch(e) {
		if (this.editor = e, this.editor) {
			let e = () => {
				this.transactionNumber += 1, this.subscribers.forEach((e) => e());
			}, t = this.editor;
			return t.on("transaction", e), () => {
				t.off("transaction", e);
			};
		}
	}
};
function C_(e) {
	let [t] = (0, _.useState)(() => new S_(e.editor)), n = b_.useSyncExternalStoreWithSelector(t.subscribe, t.getSnapshot, t.getServerSnapshot, e.selector, e.equalityFn ?? h_);
	return x_(() => t.watch(e.editor), [e.editor, t]), (0, _.useDebugValue)(n), n;
}
var w_ = typeof window > "u", T_ = w_ || !!(typeof window < "u" && window.next), E_ = class e {
	constructor(e) {
		this.editor = null, this.subscriptions = /* @__PURE__ */ new Set(), this.isComponentMounted = !1, this.previousDeps = null, this.instanceId = "", this.options = e, this.subscriptions = /* @__PURE__ */ new Set(), this.setEditor(this.getInitialEditor()), this.scheduleDestroy(), this.getEditor = this.getEditor.bind(this), this.getServerSnapshot = this.getServerSnapshot.bind(this), this.subscribe = this.subscribe.bind(this), this.refreshEditorInstance = this.refreshEditorInstance.bind(this), this.scheduleDestroy = this.scheduleDestroy.bind(this), this.onRender = this.onRender.bind(this), this.createEditor = this.createEditor.bind(this);
	}
	setEditor(e) {
		this.editor = e, this.instanceId = Math.random().toString(36).slice(2, 9), this.subscriptions.forEach((e) => e());
	}
	getInitialEditor() {
		return this.options.current.immediatelyRender === void 0 ? w_ || T_ ? null : this.createEditor() : (this.options.current.immediatelyRender, this.options.current.immediatelyRender ? this.createEditor() : null);
	}
	createEditor() {
		return new Yg({
			...this.options.current,
			onBeforeCreate: (...e) => {
				var t;
				return (t = this.options.current).onBeforeCreate?.call(t, ...e);
			},
			onBlur: (...e) => {
				var t;
				return (t = this.options.current).onBlur?.call(t, ...e);
			},
			onCreate: (...e) => {
				var t;
				return (t = this.options.current).onCreate?.call(t, ...e);
			},
			onDestroy: (...e) => {
				var t;
				return (t = this.options.current).onDestroy?.call(t, ...e);
			},
			onFocus: (...e) => {
				var t;
				return (t = this.options.current).onFocus?.call(t, ...e);
			},
			onSelectionUpdate: (...e) => {
				var t;
				return (t = this.options.current).onSelectionUpdate?.call(t, ...e);
			},
			onTransaction: (...e) => {
				var t;
				return (t = this.options.current).onTransaction?.call(t, ...e);
			},
			onUpdate: (...e) => {
				var t;
				return (t = this.options.current).onUpdate?.call(t, ...e);
			},
			onContentError: (...e) => {
				var t;
				return (t = this.options.current).onContentError?.call(t, ...e);
			},
			onDrop: (...e) => {
				var t;
				return (t = this.options.current).onDrop?.call(t, ...e);
			},
			onPaste: (...e) => {
				var t;
				return (t = this.options.current).onPaste?.call(t, ...e);
			}
		});
	}
	getEditor() {
		return this.editor;
	}
	getServerSnapshot() {
		return null;
	}
	subscribe(e) {
		return this.subscriptions.add(e), () => {
			this.subscriptions.delete(e);
		};
	}
	static compareOptions(e, t) {
		return Object.keys(e).every((n) => [
			"onCreate",
			"onBeforeCreate",
			"onDestroy",
			"onUpdate",
			"onTransaction",
			"onFocus",
			"onBlur",
			"onSelectionUpdate",
			"onContentError",
			"onDrop",
			"onPaste"
		].includes(n) ? !0 : n === "extensions" && e.extensions && t.extensions ? e.extensions.length === t.extensions.length ? e.extensions.every((e, n) => e === t.extensions?.[n]) : !1 : e[n] === t[n]);
	}
	onRender(t) {
		return () => (this.isComponentMounted = !0, clearTimeout(this.scheduledDestructionTimeout), this.editor && !this.editor.isDestroyed && t.length === 0 ? e.compareOptions(this.options.current, this.editor.options) || this.editor.setOptions({
			...this.options.current,
			editable: this.editor.isEditable
		}) : this.refreshEditorInstance(t), () => {
			this.isComponentMounted = !1, this.scheduleDestroy();
		});
	}
	refreshEditorInstance(e) {
		if (this.editor && !this.editor.isDestroyed) {
			if (this.previousDeps === null) {
				this.previousDeps = e;
				return;
			}
			if (this.previousDeps.length === e.length && this.previousDeps.every((t, n) => t === e[n])) return;
		}
		this.editor && !this.editor.isDestroyed && this.editor.destroy(), this.setEditor(this.createEditor()), this.previousDeps = e;
	}
	scheduleDestroy() {
		let e = this.instanceId, t = this.editor;
		this.scheduledDestructionTimeout = setTimeout(() => {
			if (this.isComponentMounted && this.instanceId === e) {
				t && t.setOptions(this.options.current);
				return;
			}
			t && !t.isDestroyed && (t.destroy(), this.instanceId === e && this.setEditor(null));
		}, 1);
	}
};
function D_(e = {}, t = []) {
	let n = (0, _.useRef)(e);
	n.current = e;
	let [r] = (0, _.useState)(() => new E_(n)), i = c_.useSyncExternalStore(r.subscribe, r.getEditor, r.getServerSnapshot);
	return (0, _.useDebugValue)(i), (0, _.useEffect)(r.onRender(t)), C_({
		editor: i,
		selector: ({ transactionNumber: t }) => e.shouldRerenderOnTransaction === !1 ? null : e.immediatelyRender && t === 0 ? 0 : t + 1
	}), i;
}
(0, _.createContext)({ editor: null }).Consumer;
var O_ = (0, _.createContext)({ onDragStart: void 0 }), k_ = () => (0, _.useContext)(O_);
_.forwardRef((e, t) => {
	let { onDragStart: n } = k_(), r = e.as || "div";
	return _.createElement(r, {
		...e,
		ref: t,
		"data-node-view-wrapper": "",
		onDragStart: n,
		style: {
			whiteSpace: "normal",
			...e.style
		}
	});
});
//#endregion
//#region node_modules/@tiptap/extension-blockquote/dist/index.js
var A_ = /^\s*>\s$/, j_ = e_.create({
	name: "blockquote",
	addOptions() {
		return { HTMLAttributes: {} };
	},
	content: "block+",
	group: "block",
	defining: !0,
	parseHTML() {
		return [{ tag: "blockquote" }];
	},
	renderHTML({ HTMLAttributes: e }) {
		return [
			"blockquote",
			vm(this.options.HTMLAttributes, e),
			0
		];
	},
	addCommands() {
		return {
			setBlockquote: () => ({ commands: e }) => e.wrapIn(this.name),
			toggleBlockquote: () => ({ commands: e }) => e.toggleWrap(this.name),
			unsetBlockquote: () => ({ commands: e }) => e.lift(this.name)
		};
	},
	addKeyboardShortcuts() {
		return { "Mod-Shift-b": () => this.editor.commands.toggleBlockquote() };
	},
	addInputRules() {
		return [$g({
			find: A_,
			type: this.type
		})];
	}
}), M_ = /(?:^|\s)(\*\*(?!\s+\*\*)((?:[^*]+))\*\*(?!\s+\*\*))$/, N_ = /(?:^|\s)(\*\*(?!\s+\*\*)((?:[^*]+))\*\*(?!\s+\*\*))/g, P_ = /(?:^|\s)(__(?!\s+__)((?:[^_]+))__(?!\s+__))$/, F_ = /(?:^|\s)(__(?!\s+__)((?:[^_]+))__(?!\s+__))/g, I_ = Rm.create({
	name: "bold",
	addOptions() {
		return { HTMLAttributes: {} };
	},
	parseHTML() {
		return [
			{ tag: "strong" },
			{
				tag: "b",
				getAttrs: (e) => e.style.fontWeight !== "normal" && null
			},
			{
				style: "font-weight=400",
				clearMark: (e) => e.type.name === this.name
			},
			{
				style: "font-weight",
				getAttrs: (e) => /^(bold(er)?|[5-9]\d{2,})$/.test(e) && null
			}
		];
	},
	renderHTML({ HTMLAttributes: e }) {
		return [
			"strong",
			vm(this.options.HTMLAttributes, e),
			0
		];
	},
	addCommands() {
		return {
			setBold: () => ({ commands: e }) => e.setMark(this.name),
			toggleBold: () => ({ commands: e }) => e.toggleMark(this.name),
			unsetBold: () => ({ commands: e }) => e.unsetMark(this.name)
		};
	},
	addKeyboardShortcuts() {
		return {
			"Mod-b": () => this.editor.commands.toggleBold(),
			"Mod-B": () => this.editor.commands.toggleBold()
		};
	},
	addInputRules() {
		return [Xg({
			find: M_,
			type: this.type
		}), Xg({
			find: P_,
			type: this.type
		})];
	},
	addPasteRules() {
		return [t_({
			find: N_,
			type: this.type
		}), t_({
			find: F_,
			type: this.type
		})];
	}
}), L_ = "listItem", R_ = "textStyle", z_ = /^\s*([-+*])\s$/, B_ = e_.create({
	name: "bulletList",
	addOptions() {
		return {
			itemTypeName: "listItem",
			HTMLAttributes: {},
			keepMarks: !1,
			keepAttributes: !1
		};
	},
	group: "block list",
	content() {
		return `${this.options.itemTypeName}+`;
	},
	parseHTML() {
		return [{ tag: "ul" }];
	},
	renderHTML({ HTMLAttributes: e }) {
		return [
			"ul",
			vm(this.options.HTMLAttributes, e),
			0
		];
	},
	addCommands() {
		return { toggleBulletList: () => ({ commands: e, chain: t }) => this.options.keepAttributes ? t().toggleList(this.name, this.options.itemTypeName, this.options.keepMarks).updateAttributes(L_, this.editor.getAttributes(R_)).run() : e.toggleList(this.name, this.options.itemTypeName, this.options.keepMarks) };
	},
	addKeyboardShortcuts() {
		return { "Mod-Shift-8": () => this.editor.commands.toggleBulletList() };
	},
	addInputRules() {
		let e = $g({
			find: z_,
			type: this.type
		});
		return (this.options.keepMarks || this.options.keepAttributes) && (e = $g({
			find: z_,
			type: this.type,
			keepMarks: this.options.keepMarks,
			keepAttributes: this.options.keepAttributes,
			getAttributes: () => this.editor.getAttributes(R_),
			editor: this.editor
		})), [e];
	}
}), V_ = /(^|[^`])`([^`]+)`(?!`)/, H_ = /(^|[^`])`([^`]+)`(?!`)/g, U_ = Rm.create({
	name: "code",
	addOptions() {
		return { HTMLAttributes: {} };
	},
	excludes: "_",
	code: !0,
	exitable: !0,
	parseHTML() {
		return [{ tag: "code" }];
	},
	renderHTML({ HTMLAttributes: e }) {
		return [
			"code",
			vm(this.options.HTMLAttributes, e),
			0
		];
	},
	addCommands() {
		return {
			setCode: () => ({ commands: e }) => e.setMark(this.name),
			toggleCode: () => ({ commands: e }) => e.toggleMark(this.name),
			unsetCode: () => ({ commands: e }) => e.unsetMark(this.name)
		};
	},
	addKeyboardShortcuts() {
		return { "Mod-e": () => this.editor.commands.toggleCode() };
	},
	addInputRules() {
		return [Xg({
			find: V_,
			type: this.type
		})];
	},
	addPasteRules() {
		return [t_({
			find: H_,
			type: this.type
		})];
	}
}), W_ = /^```([a-z]+)?[\s\n]$/, G_ = /^~~~([a-z]+)?[\s\n]$/, K_ = e_.create({
	name: "codeBlock",
	addOptions() {
		return {
			languageClassPrefix: "language-",
			exitOnTripleEnter: !0,
			exitOnArrowDown: !0,
			defaultLanguage: null,
			HTMLAttributes: {}
		};
	},
	content: "text*",
	marks: "",
	group: "block",
	code: !0,
	defining: !0,
	addAttributes() {
		return { language: {
			default: this.options.defaultLanguage,
			parseHTML: (e) => {
				let { languageClassPrefix: t } = this.options;
				return [...e.firstElementChild?.classList || []].filter((e) => e.startsWith(t)).map((e) => e.replace(t, ""))[0] || null;
			},
			rendered: !1
		} };
	},
	parseHTML() {
		return [{
			tag: "pre",
			preserveWhitespace: "full"
		}];
	},
	renderHTML({ node: e, HTMLAttributes: t }) {
		return [
			"pre",
			vm(this.options.HTMLAttributes, t),
			[
				"code",
				{ class: e.attrs.language ? this.options.languageClassPrefix + e.attrs.language : null },
				0
			]
		];
	},
	addCommands() {
		return {
			setCodeBlock: (e) => ({ commands: t }) => t.setNode(this.name, e),
			toggleCodeBlock: (e) => ({ commands: t }) => t.toggleNode(this.name, "paragraph", e)
		};
	},
	addKeyboardShortcuts() {
		return {
			"Mod-Alt-c": () => this.editor.commands.toggleCodeBlock(),
			Backspace: () => {
				let { empty: e, $anchor: t } = this.editor.state.selection, n = t.pos === 1;
				return !e || t.parent.type.name !== this.name ? !1 : n || !t.parent.textContent.length ? this.editor.commands.clearNodes() : !1;
			},
			Enter: ({ editor: e }) => {
				if (!this.options.exitOnTripleEnter) return !1;
				let { state: t } = e, { selection: n } = t, { $from: r, empty: i } = n;
				if (!i || r.parent.type !== this.type) return !1;
				let a = r.parentOffset === r.parent.nodeSize - 2, o = r.parent.textContent.endsWith("\n\n");
				return !a || !o ? !1 : e.chain().command(({ tr: e }) => (e.delete(r.pos - 2, r.pos), !0)).exitCode().run();
			},
			ArrowDown: ({ editor: e }) => {
				if (!this.options.exitOnArrowDown) return !1;
				let { state: t } = e, { selection: n, doc: r } = t, { $from: i, empty: a } = n;
				if (!a || i.parent.type !== this.type || i.parentOffset !== i.parent.nodeSize - 2) return !1;
				let o = i.after();
				return o === void 0 ? !1 : r.nodeAt(o) ? e.commands.command(({ tr: e }) => (e.setSelection(B.near(r.resolve(o))), !0)) : e.commands.exitCode();
			}
		};
	},
	addInputRules() {
		return [Qg({
			find: W_,
			type: this.type,
			getAttributes: (e) => ({ language: e[1] })
		}), Qg({
			find: G_,
			type: this.type,
			getAttributes: (e) => ({ language: e[1] })
		})];
	},
	addProseMirrorPlugins() {
		return [new Vc({
			key: new Wc("codeBlockVSCodeHandler"),
			props: { handlePaste: (e, t) => {
				if (!t.clipboardData || this.editor.isActive(this.type.name)) return !1;
				let n = t.clipboardData.getData("text/plain"), r = t.clipboardData.getData("vscode-editor-data"), i = (r ? JSON.parse(r) : void 0)?.mode;
				if (!n || !i) return !1;
				let { tr: a, schema: o } = e.state, s = o.text(n.replace(/\r\n?/g, "\n"));
				return a.replaceSelectionWith(this.type.create({ language: i }, s)), a.selection.$from.parent.type !== this.type && a.setSelection(V.near(a.doc.resolve(Math.max(0, a.selection.from - 2)))), a.setMeta("paste", !0), e.dispatch(a), !0;
			} }
		})];
	}
}), q_ = e_.create({
	name: "doc",
	topNode: !0,
	content: "block+"
});
//#endregion
//#region node_modules/prosemirror-dropcursor/dist/index.js
function J_(e = {}) {
	return new Vc({ view(t) {
		return new Y_(t, e);
	} });
}
var Y_ = class {
	constructor(e, t) {
		this.editorView = e, this.cursorPos = null, this.element = null, this.timeout = -1, this.width = t.width ?? 1, this.color = t.color === !1 ? void 0 : t.color || "black", this.class = t.class, this.handlers = [
			"dragover",
			"dragend",
			"drop",
			"dragleave"
		].map((t) => {
			let n = (e) => {
				this[t](e);
			};
			return e.dom.addEventListener(t, n), {
				name: t,
				handler: n
			};
		});
	}
	destroy() {
		this.handlers.forEach(({ name: e, handler: t }) => this.editorView.dom.removeEventListener(e, t));
	}
	update(e, t) {
		this.cursorPos != null && t.doc != e.state.doc && (this.cursorPos > e.state.doc.content.size ? this.setCursor(null) : this.updateOverlay());
	}
	setCursor(e) {
		e != this.cursorPos && (this.cursorPos = e, e == null ? (this.element.parentNode.removeChild(this.element), this.element = null) : this.updateOverlay());
	}
	updateOverlay() {
		let e = this.editorView.state.doc.resolve(this.cursorPos), t = !e.parent.inlineContent, n, r = this.editorView.dom, i = r.getBoundingClientRect(), a = i.width / r.offsetWidth, o = i.height / r.offsetHeight;
		if (t) {
			let t = e.nodeBefore, r = e.nodeAfter;
			if (t || r) {
				let e = this.editorView.nodeDOM(this.cursorPos - (t ? t.nodeSize : 0));
				if (e) {
					let i = e.getBoundingClientRect(), a = t ? i.bottom : i.top;
					t && r && (a = (a + this.editorView.nodeDOM(this.cursorPos).getBoundingClientRect().top) / 2);
					let s = this.width / 2 * o;
					n = {
						left: i.left,
						right: i.right,
						top: a - s,
						bottom: a + s
					};
				}
			}
		}
		if (!n) {
			let e = this.editorView.coordsAtPos(this.cursorPos), t = this.width / 2 * a;
			n = {
				left: e.left - t,
				right: e.left + t,
				top: e.top,
				bottom: e.bottom
			};
		}
		let s = this.editorView.dom.offsetParent;
		this.element || (this.element = s.appendChild(document.createElement("div")), this.class && (this.element.className = this.class), this.element.style.cssText = "position: absolute; z-index: 50; pointer-events: none;", this.color && (this.element.style.backgroundColor = this.color)), this.element.classList.toggle("prosemirror-dropcursor-block", t), this.element.classList.toggle("prosemirror-dropcursor-inline", !t);
		let c, l;
		if (!s || s == document.body && getComputedStyle(s).position == "static") c = -pageXOffset, l = -pageYOffset;
		else {
			let e = s.getBoundingClientRect(), t = e.width / s.offsetWidth, n = e.height / s.offsetHeight;
			c = e.left - s.scrollLeft * t, l = e.top - s.scrollTop * n;
		}
		this.element.style.left = (n.left - c) / a + "px", this.element.style.top = (n.top - l) / o + "px", this.element.style.width = (n.right - n.left) / a + "px", this.element.style.height = (n.bottom - n.top) / o + "px";
	}
	scheduleRemoval(e) {
		clearTimeout(this.timeout), this.timeout = setTimeout(() => this.setCursor(null), e);
	}
	dragover(e) {
		if (!this.editorView.editable) return;
		let t = this.editorView.posAtCoords({
			left: e.clientX,
			top: e.clientY
		}), n = t && t.inside >= 0 && this.editorView.state.doc.nodeAt(t.inside), r = n && n.type.spec.disableDropCursor, i = typeof r == "function" ? r(this.editorView, t, e) : r;
		if (t && !i) {
			let e = t.pos;
			if (this.editorView.dragging && this.editorView.dragging.slice) {
				let t = tc(this.editorView.state.doc, e, this.editorView.dragging.slice);
				t != null && (e = t);
			}
			this.setCursor(e), this.scheduleRemoval(5e3);
		}
	}
	dragend() {
		this.scheduleRemoval(20);
	}
	drop() {
		this.scheduleRemoval(20);
	}
	dragleave(e) {
		this.editorView.dom.contains(e.relatedTarget) || this.setCursor(null);
	}
}, X_ = Jm.create({
	name: "dropCursor",
	addOptions() {
		return {
			color: "currentColor",
			width: 1,
			class: void 0
		};
	},
	addProseMirrorPlugins() {
		return [J_(this.options)];
	}
}), Z_ = class e extends B {
	constructor(e) {
		super(e, e);
	}
	map(t, n) {
		let r = t.resolve(n.map(this.head));
		return e.valid(r) ? new e(r) : B.near(r);
	}
	content() {
		return R.empty;
	}
	eq(t) {
		return t instanceof e && t.head == this.head;
	}
	toJSON() {
		return {
			type: "gapcursor",
			pos: this.head
		};
	}
	static fromJSON(t, n) {
		if (typeof n.pos != "number") throw RangeError("Invalid input for GapCursor.fromJSON");
		return new e(t.resolve(n.pos));
	}
	getBookmark() {
		return new Q_(this.anchor);
	}
	static valid(e) {
		let t = e.parent;
		if (t.inlineContent || !ev(e) || !tv(e)) return !1;
		let n = t.type.spec.allowGapCursor;
		if (n != null) return n;
		let r = t.contentMatchAt(e.index()).defaultType;
		return r && r.isTextblock;
	}
	static findGapCursorFrom(t, n, r = !1) {
		search: for (;;) {
			if (!r && e.valid(t)) return t;
			let i = t.pos, a = null;
			for (let r = t.depth;; r--) {
				let o = t.node(r);
				if (n > 0 ? t.indexAfter(r) < o.childCount : t.index(r) > 0) {
					a = o.child(n > 0 ? t.indexAfter(r) : t.index(r) - 1);
					break;
				} else if (r == 0) return null;
				i += n;
				let s = t.doc.resolve(i);
				if (e.valid(s)) return s;
			}
			for (;;) {
				let o = n > 0 ? a.firstChild : a.lastChild;
				if (!o) {
					if (a.isAtom && !a.isText && !H.isSelectable(a)) {
						t = t.doc.resolve(i + a.nodeSize * n), r = !1;
						continue search;
					}
					break;
				}
				a = o, i += n;
				let s = t.doc.resolve(i);
				if (e.valid(s)) return s;
			}
			return null;
		}
	}
};
Z_.prototype.visible = !1, Z_.findFrom = Z_.findGapCursorFrom, B.jsonID("gapcursor", Z_);
var Q_ = class e {
	constructor(e) {
		this.pos = e;
	}
	map(t) {
		return new e(t.map(this.pos));
	}
	resolve(e) {
		let t = e.resolve(this.pos);
		return Z_.valid(t) ? new Z_(t) : B.near(t);
	}
};
function $_(e) {
	return e.isAtom || e.spec.isolating || e.spec.createGapCursor;
}
function ev(e) {
	for (let t = e.depth; t >= 0; t--) {
		let n = e.index(t), r = e.node(t);
		if (n == 0) {
			if (r.type.spec.isolating) return !0;
			continue;
		}
		for (let e = r.child(n - 1);; e = e.lastChild) {
			if (e.childCount == 0 && !e.inlineContent || $_(e.type)) return !0;
			if (e.inlineContent) return !1;
		}
	}
	return !0;
}
function tv(e) {
	for (let t = e.depth; t >= 0; t--) {
		let n = e.indexAfter(t), r = e.node(t);
		if (n == r.childCount) {
			if (r.type.spec.isolating) return !0;
			continue;
		}
		for (let e = r.child(n);; e = e.firstChild) {
			if (e.childCount == 0 && !e.inlineContent || $_(e.type)) return !0;
			if (e.inlineContent) return !1;
		}
	}
	return !0;
}
function nv() {
	return new Vc({ props: {
		decorations: sv,
		createSelectionBetween(e, t, n) {
			return t.pos == n.pos && Z_.valid(n) ? new Z_(n) : null;
		},
		handleClick: av,
		handleKeyDown: rv,
		handleDOMEvents: { beforeinput: ov }
	} });
}
var rv = xp({
	ArrowLeft: iv("horiz", -1),
	ArrowRight: iv("horiz", 1),
	ArrowUp: iv("vert", -1),
	ArrowDown: iv("vert", 1)
});
function iv(e, t) {
	let n = e == "vert" ? t > 0 ? "down" : "up" : t > 0 ? "right" : "left";
	return function(e, r, i) {
		let a = e.selection, o = t > 0 ? a.$to : a.$from, s = a.empty;
		if (a instanceof V) {
			if (!i.endOfTextblock(n) || o.depth == 0) return !1;
			s = !1, o = e.doc.resolve(t > 0 ? o.after() : o.before());
		}
		let c = Z_.findGapCursorFrom(o, t, s);
		return c ? (r && r(e.tr.setSelection(new Z_(c))), !0) : !1;
	};
}
function av(e, t, n) {
	if (!e || !e.editable) return !1;
	let r = e.state.doc.resolve(t);
	if (!Z_.valid(r)) return !1;
	let i = e.posAtCoords({
		left: n.clientX,
		top: n.clientY
	});
	return i && i.inside > -1 && H.isSelectable(e.state.doc.nodeAt(i.inside)) ? !1 : (e.dispatch(e.state.tr.setSelection(new Z_(r))), !0);
}
function ov(e, t) {
	if (t.inputType != "insertCompositionText" || !(e.state.selection instanceof Z_)) return !1;
	let { $from: n } = e.state.selection, r = n.parent.contentMatchAt(n.index()).findWrapping(e.state.schema.nodes.text);
	if (!r) return !1;
	let i = I.empty;
	for (let e = r.length - 1; e >= 0; e--) i = I.from(r[e].createAndFill(null, i));
	let a = e.state.tr.replace(n.pos, n.pos, new R(i, 0, 0));
	return a.setSelection(V.near(a.doc.resolve(n.pos + 1))), e.dispatch(a), !1;
}
function sv(e) {
	if (!(e.selection instanceof Z_)) return null;
	let t = document.createElement("div");
	return t.className = "ProseMirror-gapcursor", bf.create(e.doc, [_f.widget(e.selection.head, t, { key: "gapcursor" })]);
}
//#endregion
//#region node_modules/@tiptap/extension-gapcursor/dist/index.js
var cv = Jm.create({
	name: "gapCursor",
	addProseMirrorPlugins() {
		return [nv()];
	},
	extendNodeSchema(e) {
		return { allowGapCursor: Z(X(e, "allowGapCursor", {
			name: e.name,
			options: e.options,
			storage: e.storage
		})) ?? null };
	}
}), lv = e_.create({
	name: "hardBreak",
	addOptions() {
		return {
			keepMarks: !0,
			HTMLAttributes: {}
		};
	},
	inline: !0,
	group: "inline",
	selectable: !1,
	linebreakReplacement: !0,
	parseHTML() {
		return [{ tag: "br" }];
	},
	renderHTML({ HTMLAttributes: e }) {
		return ["br", vm(this.options.HTMLAttributes, e)];
	},
	renderText() {
		return "\n";
	},
	addCommands() {
		return { setHardBreak: () => ({ commands: e, chain: t, state: n, editor: r }) => e.first([() => e.exitCode(), () => e.command(() => {
			let { selection: e, storedMarks: i } = n;
			if (e.$from.parent.type.spec.isolating) return !1;
			let { keepMarks: a } = this.options, { splittableMarks: o } = r.extensionManager, s = i || e.$to.parentOffset && e.$from.marks();
			return t().insertContent({ type: this.name }).command(({ tr: e, dispatch: t }) => {
				if (t && s && a) {
					let t = s.filter((e) => o.includes(e.type.name));
					e.ensureMarks(t);
				}
				return !0;
			}).run();
		})]) };
	},
	addKeyboardShortcuts() {
		return {
			"Mod-Enter": () => this.editor.commands.setHardBreak(),
			"Shift-Enter": () => this.editor.commands.setHardBreak()
		};
	}
}), uv = e_.create({
	name: "heading",
	addOptions() {
		return {
			levels: [
				1,
				2,
				3,
				4,
				5,
				6
			],
			HTMLAttributes: {}
		};
	},
	content: "inline*",
	group: "block",
	defining: !0,
	addAttributes() {
		return { level: {
			default: 1,
			rendered: !1
		} };
	},
	parseHTML() {
		return this.options.levels.map((e) => ({
			tag: `h${e}`,
			attrs: { level: e }
		}));
	},
	renderHTML({ node: e, HTMLAttributes: t }) {
		return [
			`h${this.options.levels.includes(e.attrs.level) ? e.attrs.level : this.options.levels[0]}`,
			vm(this.options.HTMLAttributes, t),
			0
		];
	},
	addCommands() {
		return {
			setHeading: (e) => ({ commands: t }) => this.options.levels.includes(e.level) ? t.setNode(this.name, e) : !1,
			toggleHeading: (e) => ({ commands: t }) => this.options.levels.includes(e.level) ? t.toggleNode(this.name, "paragraph", e) : !1
		};
	},
	addKeyboardShortcuts() {
		return this.options.levels.reduce((e, t) => ({
			...e,
			[`Mod-Alt-${t}`]: () => this.editor.commands.toggleHeading({ level: t })
		}), {});
	},
	addInputRules() {
		return this.options.levels.map((e) => Qg({
			find: RegExp(`^(#{${Math.min(...this.options.levels)},${e}})\\s$`),
			type: this.type,
			getAttributes: { level: e }
		}));
	}
}), dv = 200, fv = function() {};
fv.prototype.append = function(e) {
	return e.length ? (e = fv.from(e), !this.length && e || e.length < dv && this.leafAppend(e) || this.length < dv && e.leafPrepend(this) || this.appendInner(e)) : this;
}, fv.prototype.prepend = function(e) {
	return e.length ? fv.from(e).append(this) : this;
}, fv.prototype.appendInner = function(e) {
	return new mv(this, e);
}, fv.prototype.slice = function(e, t) {
	return e === void 0 && (e = 0), t === void 0 && (t = this.length), e >= t ? fv.empty : this.sliceInner(Math.max(0, e), Math.min(this.length, t));
}, fv.prototype.get = function(e) {
	if (!(e < 0 || e >= this.length)) return this.getInner(e);
}, fv.prototype.forEach = function(e, t, n) {
	t === void 0 && (t = 0), n === void 0 && (n = this.length), t <= n ? this.forEachInner(e, t, n, 0) : this.forEachInvertedInner(e, t, n, 0);
}, fv.prototype.map = function(e, t, n) {
	t === void 0 && (t = 0), n === void 0 && (n = this.length);
	var r = [];
	return this.forEach(function(t, n) {
		return r.push(e(t, n));
	}, t, n), r;
}, fv.from = function(e) {
	return e instanceof fv ? e : e && e.length ? new pv(e) : fv.empty;
};
var pv = /* @__PURE__ */ function(e) {
	function t(t) {
		e.call(this), this.values = t;
	}
	e && (t.__proto__ = e), t.prototype = Object.create(e && e.prototype), t.prototype.constructor = t;
	var n = {
		length: { configurable: !0 },
		depth: { configurable: !0 }
	};
	return t.prototype.flatten = function() {
		return this.values;
	}, t.prototype.sliceInner = function(e, n) {
		return e == 0 && n == this.length ? this : new t(this.values.slice(e, n));
	}, t.prototype.getInner = function(e) {
		return this.values[e];
	}, t.prototype.forEachInner = function(e, t, n, r) {
		for (var i = t; i < n; i++) if (e(this.values[i], r + i) === !1) return !1;
	}, t.prototype.forEachInvertedInner = function(e, t, n, r) {
		for (var i = t - 1; i >= n; i--) if (e(this.values[i], r + i) === !1) return !1;
	}, t.prototype.leafAppend = function(e) {
		if (this.length + e.length <= dv) return new t(this.values.concat(e.flatten()));
	}, t.prototype.leafPrepend = function(e) {
		if (this.length + e.length <= dv) return new t(e.flatten().concat(this.values));
	}, n.length.get = function() {
		return this.values.length;
	}, n.depth.get = function() {
		return 0;
	}, Object.defineProperties(t.prototype, n), t;
}(fv);
fv.empty = new pv([]);
var mv = /* @__PURE__ */ function(e) {
	function t(t, n) {
		e.call(this), this.left = t, this.right = n, this.length = t.length + n.length, this.depth = Math.max(t.depth, n.depth) + 1;
	}
	return e && (t.__proto__ = e), t.prototype = Object.create(e && e.prototype), t.prototype.constructor = t, t.prototype.flatten = function() {
		return this.left.flatten().concat(this.right.flatten());
	}, t.prototype.getInner = function(e) {
		return e < this.left.length ? this.left.get(e) : this.right.get(e - this.left.length);
	}, t.prototype.forEachInner = function(e, t, n, r) {
		var i = this.left.length;
		if (t < i && this.left.forEachInner(e, t, Math.min(n, i), r) === !1 || n > i && this.right.forEachInner(e, Math.max(t - i, 0), Math.min(this.length, n) - i, r + i) === !1) return !1;
	}, t.prototype.forEachInvertedInner = function(e, t, n, r) {
		var i = this.left.length;
		if (t > i && this.right.forEachInvertedInner(e, t - i, Math.max(n, i) - i, r + i) === !1 || n < i && this.left.forEachInvertedInner(e, Math.min(t, i), n, r) === !1) return !1;
	}, t.prototype.sliceInner = function(e, t) {
		if (e == 0 && t == this.length) return this;
		var n = this.left.length;
		return t <= n ? this.left.slice(e, t) : e >= n ? this.right.slice(e - n, t - n) : this.left.slice(e, n).append(this.right.slice(0, t - n));
	}, t.prototype.leafAppend = function(e) {
		var n = this.right.leafAppend(e);
		if (n) return new t(this.left, n);
	}, t.prototype.leafPrepend = function(e) {
		var n = this.left.leafPrepend(e);
		if (n) return new t(n, this.right);
	}, t.prototype.appendInner = function(e) {
		return this.left.depth >= Math.max(this.right.depth, e.depth) + 1 ? new t(this.left, new t(this.right, e)) : new t(this, e);
	}, t;
}(fv), hv = 500, gv = class e {
	constructor(e, t) {
		this.items = e, this.eventCount = t;
	}
	popEvent(t, n) {
		if (this.eventCount == 0) return null;
		let r = this.items.length;
		for (;; r--) if (this.items.get(r - 1).selection) {
			--r;
			break;
		}
		let i, a;
		n && (i = this.remapping(r, this.items.length), a = i.maps.length);
		let o = t.tr, s, c, l = [], u = [];
		return this.items.forEach((t, n) => {
			if (!t.step) {
				i || (i = this.remapping(r, n + 1), a = i.maps.length), a--, u.push(t);
				return;
			}
			if (i) {
				u.push(new vv(t.map));
				let e = t.step.map(i.slice(a)), n;
				e && o.maybeStep(e).doc && (n = o.mapping.maps[o.mapping.maps.length - 1], l.push(new vv(n, void 0, void 0, l.length + u.length))), a--, n && i.appendMap(n, a);
			} else o.maybeStep(t.step);
			if (t.selection) return s = i ? t.selection.map(i.slice(a)) : t.selection, c = new e(this.items.slice(0, r).append(u.reverse().concat(l)), this.eventCount - 1), !1;
		}, this.items.length, 0), {
			remaining: c,
			transform: o,
			selection: s
		};
	}
	addTransform(t, n, r, i) {
		let a = [], o = this.eventCount, s = this.items, c = !i && s.length ? s.get(s.length - 1) : null;
		for (let e = 0; e < t.steps.length; e++) {
			let r = t.steps[e].invert(t.docs[e]), l = new vv(t.mapping.maps[e], r, n), u;
			(u = c && c.merge(l)) && (l = u, e ? a.pop() : s = s.slice(0, s.length - 1)), a.push(l), n && (o++, n = void 0), i || (c = l);
		}
		let l = o - r.depth;
		return l > bv && (s = _v(s, l), o -= l), new e(s.append(a), o);
	}
	remapping(e, t) {
		let n = new ys();
		return this.items.forEach((t, r) => {
			let i = t.mirrorOffset != null && r - t.mirrorOffset >= e ? n.maps.length - t.mirrorOffset : void 0;
			n.appendMap(t.map, i);
		}, e, t), n;
	}
	addMaps(t) {
		return this.eventCount == 0 ? this : new e(this.items.append(t.map((e) => new vv(e))), this.eventCount);
	}
	rebased(t, n) {
		if (!this.eventCount) return this;
		let r = [], i = Math.max(0, this.items.length - n), a = t.mapping, o = t.steps.length, s = this.eventCount;
		this.items.forEach((e) => {
			e.selection && s--;
		}, i);
		let c = n;
		this.items.forEach((e) => {
			let n = a.getMirror(--c);
			if (n == null) return;
			o = Math.min(o, n);
			let i = a.maps[n];
			if (e.step) {
				let o = t.steps[n].invert(t.docs[n]), l = e.selection && e.selection.map(a.slice(c + 1, n));
				l && s++, r.push(new vv(i, o, l));
			} else r.push(new vv(i));
		}, i);
		let l = [];
		for (let e = n; e < o; e++) l.push(new vv(a.maps[e]));
		let u = new e(this.items.slice(0, i).append(l).append(r), s);
		return u.emptyItemCount() > hv && (u = u.compress(this.items.length - r.length)), u;
	}
	emptyItemCount() {
		let e = 0;
		return this.items.forEach((t) => {
			t.step || e++;
		}), e;
	}
	compress(t = this.items.length) {
		let n = this.remapping(0, t), r = n.maps.length, i = [], a = 0;
		return this.items.forEach((e, o) => {
			if (o >= t) i.push(e), e.selection && a++;
			else if (e.step) {
				let t = e.step.map(n.slice(r)), o = t && t.getMap();
				if (r--, o && n.appendMap(o, r), t) {
					let s = e.selection && e.selection.map(n.slice(r));
					s && a++;
					let c = new vv(o.invert(), t, s), l, u = i.length - 1;
					(l = i.length && i[u].merge(c)) ? i[u] = l : i.push(c);
				}
			} else e.map && r--;
		}, this.items.length, 0), new e(fv.from(i.reverse()), a);
	}
};
gv.empty = new gv(fv.empty, 0);
function _v(e, t) {
	let n;
	return e.forEach((e, r) => {
		if (e.selection && t-- == 0) return n = r, !1;
	}), e.slice(n);
}
var vv = class e {
	constructor(e, t, n, r) {
		this.map = e, this.step = t, this.selection = n, this.mirrorOffset = r;
	}
	merge(t) {
		if (this.step && t.step && !t.selection) {
			let n = t.step.merge(this.step);
			if (n) return new e(n.getMap().invert(), n, this.selection);
		}
	}
}, yv = class {
	constructor(e, t, n, r, i) {
		this.done = e, this.undone = t, this.prevRanges = n, this.prevTime = r, this.prevComposition = i;
	}
}, bv = 20;
function xv(e, t, n, r) {
	let i = n.getMeta(kv), a;
	if (i) return i.historyState;
	n.getMeta(Av) && (e = new yv(e.done, e.undone, null, 0, -1));
	let o = n.getMeta("appendedTransaction");
	if (n.steps.length == 0) return e;
	if (o && o.getMeta(kv)) return o.getMeta(kv).redo ? new yv(e.done.addTransform(n, void 0, r, Ov(t)), e.undone, Cv(n.mapping.maps), e.prevTime, e.prevComposition) : new yv(e.done, e.undone.addTransform(n, void 0, r, Ov(t)), null, e.prevTime, e.prevComposition);
	if (n.getMeta("addToHistory") !== !1 && !(o && o.getMeta("addToHistory") === !1)) {
		let i = n.getMeta("composition"), a = e.prevTime == 0 || !o && e.prevComposition != i && (e.prevTime < (n.time || 0) - r.newGroupDelay || !Sv(n, e.prevRanges)), s = o ? wv(e.prevRanges, n.mapping) : Cv(n.mapping.maps);
		return new yv(e.done.addTransform(n, a ? t.selection.getBookmark() : void 0, r, Ov(t)), gv.empty, s, n.time, i ?? e.prevComposition);
	} else if (a = n.getMeta("rebased")) return new yv(e.done.rebased(n, a), e.undone.rebased(n, a), wv(e.prevRanges, n.mapping), e.prevTime, e.prevComposition);
	else return new yv(e.done.addMaps(n.mapping.maps), e.undone.addMaps(n.mapping.maps), wv(e.prevRanges, n.mapping), e.prevTime, e.prevComposition);
}
function Sv(e, t) {
	if (!t) return !1;
	if (!e.docChanged) return !0;
	let n = !1;
	return e.mapping.maps[0].forEach((e, r) => {
		for (let i = 0; i < t.length; i += 2) e <= t[i + 1] && r >= t[i] && (n = !0);
	}), n;
}
function Cv(e) {
	let t = [];
	for (let n = e.length - 1; n >= 0 && t.length == 0; n--) e[n].forEach((e, n, r, i) => t.push(r, i));
	return t;
}
function wv(e, t) {
	if (!e) return null;
	let n = [];
	for (let r = 0; r < e.length; r += 2) {
		let i = t.map(e[r], 1), a = t.map(e[r + 1], -1);
		i <= a && n.push(i, a);
	}
	return n;
}
function Tv(e, t, n) {
	let r = Ov(t), i = kv.get(t).spec.config, a = (n ? e.undone : e.done).popEvent(t, r);
	if (!a) return null;
	let o = a.selection.resolve(a.transform.doc), s = (n ? e.done : e.undone).addTransform(a.transform, t.selection.getBookmark(), i, r), c = new yv(n ? s : a.remaining, n ? a.remaining : s, null, 0, -1);
	return a.transform.setSelection(o).setMeta(kv, {
		redo: n,
		historyState: c
	});
}
var Ev = !1, Dv = null;
function Ov(e) {
	let t = e.plugins;
	if (Dv != t) {
		Ev = !1, Dv = t;
		for (let e = 0; e < t.length; e++) if (t[e].spec.historyPreserveItems) {
			Ev = !0;
			break;
		}
	}
	return Ev;
}
var kv = new Wc("history"), Av = new Wc("closeHistory");
function jv(e = {}) {
	return e = {
		depth: e.depth || 100,
		newGroupDelay: e.newGroupDelay || 500
	}, new Vc({
		key: kv,
		state: {
			init() {
				return new yv(gv.empty, gv.empty, null, 0, -1);
			},
			apply(t, n, r) {
				return xv(n, r, t, e);
			}
		},
		config: e,
		props: { handleDOMEvents: { beforeinput(e, t) {
			let n = t.inputType, r = n == "historyUndo" ? Nv : n == "historyRedo" ? Pv : null;
			return !r || !e.editable ? !1 : (t.preventDefault(), r(e.state, e.dispatch));
		} } }
	});
}
function Mv(e, t) {
	return (n, r) => {
		let i = kv.getState(n);
		if (!i || (e ? i.undone : i.done).eventCount == 0) return !1;
		if (r) {
			let a = Tv(i, n, e);
			a && r(t ? a.scrollIntoView() : a);
		}
		return !0;
	};
}
var Nv = Mv(!1, !0), Pv = Mv(!0, !0), Fv = Jm.create({
	name: "history",
	addOptions() {
		return {
			depth: 100,
			newGroupDelay: 500
		};
	},
	addCommands() {
		return {
			undo: () => ({ state: e, dispatch: t }) => Nv(e, t),
			redo: () => ({ state: e, dispatch: t }) => Pv(e, t)
		};
	},
	addProseMirrorPlugins() {
		return [jv(this.options)];
	},
	addKeyboardShortcuts() {
		return {
			"Mod-z": () => this.editor.commands.undo(),
			"Shift-Mod-z": () => this.editor.commands.redo(),
			"Mod-y": () => this.editor.commands.redo(),
			"Mod-я": () => this.editor.commands.undo(),
			"Shift-Mod-я": () => this.editor.commands.redo()
		};
	}
}), Iv = e_.create({
	name: "horizontalRule",
	addOptions() {
		return { HTMLAttributes: {} };
	},
	group: "block",
	parseHTML() {
		return [{ tag: "hr" }];
	},
	renderHTML({ HTMLAttributes: e }) {
		return ["hr", vm(this.options.HTMLAttributes, e)];
	},
	addCommands() {
		return { setHorizontalRule: () => ({ chain: e, state: t }) => {
			if (!n_(t, t.schema.nodes[this.name])) return !1;
			let { selection: n } = t, { $from: r, $to: i } = n, a = e();
			return r.parentOffset === 0 ? a.insertContentAt({
				from: Math.max(r.pos - 1, 0),
				to: i.pos
			}, { type: this.name }) : wg(n) ? a.insertContentAt(i.pos, { type: this.name }) : a.insertContent({ type: this.name }), a.command(({ tr: e, dispatch: t }) => {
				if (t) {
					let { $to: t } = e.selection, n = t.end();
					if (t.nodeAfter) t.nodeAfter.isTextblock ? e.setSelection(V.create(e.doc, t.pos + 1)) : t.nodeAfter.isBlock ? e.setSelection(H.create(e.doc, t.pos)) : e.setSelection(V.create(e.doc, t.pos));
					else {
						let r = t.parent.type.contentMatch.defaultType?.create();
						r && (e.insert(n, r), e.setSelection(V.create(e.doc, n + 1)));
					}
					e.scrollIntoView();
				}
				return !0;
			}).run();
		} };
	},
	addInputRules() {
		return [Zg({
			find: /^(?:---|—-|___\s|\*\*\*\s)$/,
			type: this.type
		})];
	}
}), Lv = /(?:^|\s)(\*(?!\s+\*)((?:[^*]+))\*(?!\s+\*))$/, Rv = /(?:^|\s)(\*(?!\s+\*)((?:[^*]+))\*(?!\s+\*))/g, zv = /(?:^|\s)(_(?!\s+_)((?:[^_]+))_(?!\s+_))$/, Bv = /(?:^|\s)(_(?!\s+_)((?:[^_]+))_(?!\s+_))/g, Vv = Rm.create({
	name: "italic",
	addOptions() {
		return { HTMLAttributes: {} };
	},
	parseHTML() {
		return [
			{ tag: "em" },
			{
				tag: "i",
				getAttrs: (e) => e.style.fontStyle !== "normal" && null
			},
			{
				style: "font-style=normal",
				clearMark: (e) => e.type.name === this.name
			},
			{ style: "font-style=italic" }
		];
	},
	renderHTML({ HTMLAttributes: e }) {
		return [
			"em",
			vm(this.options.HTMLAttributes, e),
			0
		];
	},
	addCommands() {
		return {
			setItalic: () => ({ commands: e }) => e.setMark(this.name),
			toggleItalic: () => ({ commands: e }) => e.toggleMark(this.name),
			unsetItalic: () => ({ commands: e }) => e.unsetMark(this.name)
		};
	},
	addKeyboardShortcuts() {
		return {
			"Mod-i": () => this.editor.commands.toggleItalic(),
			"Mod-I": () => this.editor.commands.toggleItalic()
		};
	},
	addInputRules() {
		return [Xg({
			find: Lv,
			type: this.type
		}), Xg({
			find: zv,
			type: this.type
		})];
	},
	addPasteRules() {
		return [t_({
			find: Rv,
			type: this.type
		}), t_({
			find: Bv,
			type: this.type
		})];
	}
}), Hv = e_.create({
	name: "listItem",
	addOptions() {
		return {
			HTMLAttributes: {},
			bulletListTypeName: "bulletList",
			orderedListTypeName: "orderedList"
		};
	},
	content: "paragraph block*",
	defining: !0,
	parseHTML() {
		return [{ tag: "li" }];
	},
	renderHTML({ HTMLAttributes: e }) {
		return [
			"li",
			vm(this.options.HTMLAttributes, e),
			0
		];
	},
	addKeyboardShortcuts() {
		return {
			Enter: () => this.editor.commands.splitListItem(this.name),
			Tab: () => this.editor.commands.sinkListItem(this.name),
			"Shift-Tab": () => this.editor.commands.liftListItem(this.name)
		};
	}
}), Uv = "listItem", Wv = "textStyle", Gv = /^(\d+)\.\s$/, Kv = e_.create({
	name: "orderedList",
	addOptions() {
		return {
			itemTypeName: "listItem",
			HTMLAttributes: {},
			keepMarks: !1,
			keepAttributes: !1
		};
	},
	group: "block list",
	content() {
		return `${this.options.itemTypeName}+`;
	},
	addAttributes() {
		return {
			start: {
				default: 1,
				parseHTML: (e) => e.hasAttribute("start") ? parseInt(e.getAttribute("start") || "", 10) : 1
			},
			type: {
				default: null,
				parseHTML: (e) => e.getAttribute("type")
			}
		};
	},
	parseHTML() {
		return [{ tag: "ol" }];
	},
	renderHTML({ HTMLAttributes: e }) {
		let { start: t, ...n } = e;
		return t === 1 ? [
			"ol",
			vm(this.options.HTMLAttributes, n),
			0
		] : [
			"ol",
			vm(this.options.HTMLAttributes, e),
			0
		];
	},
	addCommands() {
		return { toggleOrderedList: () => ({ commands: e, chain: t }) => this.options.keepAttributes ? t().toggleList(this.name, this.options.itemTypeName, this.options.keepMarks).updateAttributes(Uv, this.editor.getAttributes(Wv)).run() : e.toggleList(this.name, this.options.itemTypeName, this.options.keepMarks) };
	},
	addKeyboardShortcuts() {
		return { "Mod-Shift-7": () => this.editor.commands.toggleOrderedList() };
	},
	addInputRules() {
		let e = $g({
			find: Gv,
			type: this.type,
			getAttributes: (e) => ({ start: +e[1] }),
			joinPredicate: (e, t) => t.childCount + t.attrs.start === +e[1]
		});
		return (this.options.keepMarks || this.options.keepAttributes) && (e = $g({
			find: Gv,
			type: this.type,
			keepMarks: this.options.keepMarks,
			keepAttributes: this.options.keepAttributes,
			getAttributes: (e) => ({
				start: +e[1],
				...this.editor.getAttributes(Wv)
			}),
			joinPredicate: (e, t) => t.childCount + t.attrs.start === +e[1],
			editor: this.editor
		})), [e];
	}
}), qv = e_.create({
	name: "paragraph",
	priority: 1e3,
	addOptions() {
		return { HTMLAttributes: {} };
	},
	group: "block",
	content: "inline*",
	parseHTML() {
		return [{ tag: "p" }];
	},
	renderHTML({ HTMLAttributes: e }) {
		return [
			"p",
			vm(this.options.HTMLAttributes, e),
			0
		];
	},
	addCommands() {
		return { setParagraph: () => ({ commands: e }) => e.setNode(this.name) };
	},
	addKeyboardShortcuts() {
		return { "Mod-Alt-0": () => this.editor.commands.setParagraph() };
	}
}), Jv = /(?:^|\s)(~~(?!\s+~~)((?:[^~]+))~~(?!\s+~~))$/, Yv = /(?:^|\s)(~~(?!\s+~~)((?:[^~]+))~~(?!\s+~~))/g, Xv = Rm.create({
	name: "strike",
	addOptions() {
		return { HTMLAttributes: {} };
	},
	parseHTML() {
		return [
			{ tag: "s" },
			{ tag: "del" },
			{ tag: "strike" },
			{
				style: "text-decoration",
				consuming: !1,
				getAttrs: (e) => e.includes("line-through") ? {} : !1
			}
		];
	},
	renderHTML({ HTMLAttributes: e }) {
		return [
			"s",
			vm(this.options.HTMLAttributes, e),
			0
		];
	},
	addCommands() {
		return {
			setStrike: () => ({ commands: e }) => e.setMark(this.name),
			toggleStrike: () => ({ commands: e }) => e.toggleMark(this.name),
			unsetStrike: () => ({ commands: e }) => e.unsetMark(this.name)
		};
	},
	addKeyboardShortcuts() {
		return { "Mod-Shift-s": () => this.editor.commands.toggleStrike() };
	},
	addInputRules() {
		return [Xg({
			find: Jv,
			type: this.type
		})];
	},
	addPasteRules() {
		return [t_({
			find: Yv,
			type: this.type
		})];
	}
}), Zv = e_.create({
	name: "text",
	group: "inline"
}), Qv = Jm.create({
	name: "starterKit",
	addExtensions() {
		let e = [];
		return this.options.bold !== !1 && e.push(I_.configure(this.options.bold)), this.options.blockquote !== !1 && e.push(j_.configure(this.options.blockquote)), this.options.bulletList !== !1 && e.push(B_.configure(this.options.bulletList)), this.options.code !== !1 && e.push(U_.configure(this.options.code)), this.options.codeBlock !== !1 && e.push(K_.configure(this.options.codeBlock)), this.options.document !== !1 && e.push(q_.configure(this.options.document)), this.options.dropcursor !== !1 && e.push(X_.configure(this.options.dropcursor)), this.options.gapcursor !== !1 && e.push(cv.configure(this.options.gapcursor)), this.options.hardBreak !== !1 && e.push(lv.configure(this.options.hardBreak)), this.options.heading !== !1 && e.push(uv.configure(this.options.heading)), this.options.history !== !1 && e.push(Fv.configure(this.options.history)), this.options.horizontalRule !== !1 && e.push(Iv.configure(this.options.horizontalRule)), this.options.italic !== !1 && e.push(Vv.configure(this.options.italic)), this.options.listItem !== !1 && e.push(Hv.configure(this.options.listItem)), this.options.orderedList !== !1 && e.push(Kv.configure(this.options.orderedList)), this.options.paragraph !== !1 && e.push(qv.configure(this.options.paragraph)), this.options.strike !== !1 && e.push(Xv.configure(this.options.strike)), this.options.text !== !1 && e.push(Zv.configure(this.options.text)), e;
	}
}), $v = "aaa1rp3bb0ott3vie4c1le2ogado5udhabi7c0ademy5centure6ountant0s9o1tor4d0s1ult4e0g1ro2tna4f0l1rica5g0akhan5ency5i0g1rbus3force5tel5kdn3l0ibaba4pay4lfinanz6state5y2sace3tom5m0azon4ericanexpress7family11x2fam3ica3sterdam8nalytics7droid5quan4z2o0l2partments8p0le4q0uarelle8r0ab1mco4chi3my2pa2t0e3s0da2ia2sociates9t0hleta5torney7u0ction5di0ble3o3spost5thor3o0s4w0s2x0a2z0ure5ba0by2idu3namex4d1k2r0celona5laycard4s5efoot5gains6seball5ketball8uhaus5yern5b0c1t1va3cg1n2d1e0ats2uty4er2rlin4st0buy5t2f1g1h0arti5i0ble3d1ke2ng0o3o1z2j1lack0friday9ockbuster8g1omberg7ue3m0s1w2n0pparibas9o0ats3ehringer8fa2m1nd2o0k0ing5sch2tik2on4t1utique6x2r0adesco6idgestone9oadway5ker3ther5ussels7s1t1uild0ers6siness6y1zz3v1w1y1z0h3ca0b1fe2l0l1vinklein9m0era3p2non3petown5ital0one8r0avan4ds2e0er0s4s2sa1e1h1ino4t0ering5holic7ba1n1re3c1d1enter4o1rn3f0a1d2g1h0anel2nel4rity4se2t2eap3intai5ristmas6ome4urch5i0priani6rcle4sco3tadel4i0c2y3k1l0aims4eaning6ick2nic1que6othing5ud3ub0med6m1n1o0ach3des3ffee4llege4ogne5m0mbank4unity6pany2re3uter5sec4ndos3struction8ulting7tact3ractors9oking4l1p2rsica5untry4pon0s4rses6pa2r0edit0card4union9icket5own3s1uise0s6u0isinella9v1w1x1y0mru3ou3z2dad1nce3ta1e1ing3sun4y2clk3ds2e0al0er2s3gree4livery5l1oitte5ta3mocrat6ntal2ist5si0gn4v2hl2iamonds6et2gital5rect0ory7scount3ver5h2y2j1k1m1np2o0cs1tor4g1mains5t1wnload7rive4tv2ubai3nlop4pont4rban5vag2r2z2earth3t2c0o2deka3u0cation8e1g1mail3erck5nergy4gineer0ing9terprises10pson4quipment8r0icsson6ni3s0q1tate5t1u0rovision8s2vents5xchange6pert3osed4ress5traspace10fage2il1rwinds6th3mily4n0s2rm0ers5shion4t3edex3edback6rrari3ero6i0delity5o2lm2nal1nce1ial7re0stone6mdale6sh0ing5t0ness6j1k1lickr3ghts4r2orist4wers5y2m1o0o0d1tball6rd1ex2sale4um3undation8x2r0ee1senius7l1ogans4ntier7tr2ujitsu5n0d2rniture7tbol5yi3ga0l0lery3o1up4me0s3p1rden4y2b0iz3d0n2e0a1nt0ing5orge5f1g0ee3h1i0ft0s3ves2ing5l0ass3e1obal2o4m0ail3bh2o1x2n1odaddy5ld0point6f2o0dyear5g0le4p1t1v2p1q1r0ainger5phics5tis4een3ipe3ocery4up4s1t1u0cci3ge2ide2tars5ru3w1y2hair2mburg5ngout5us3bo2dfc0bank7ealth0care8lp1sinki6re1mes5iphop4samitsu7tachi5v2k0t2m1n1ockey4ldings5iday5medepot5goods5s0ense7nda3rse3spital5t0ing5t0els3mail5use3w2r1sbc3t1u0ghes5yatt3undai7ibm2cbc2e1u2d1e0ee3fm2kano4l1m0amat4db2mo0bilien9n0c1dustries8finiti5o2g1k1stitute6urance4e4t0ernational10uit4vestments10o1piranga7q1r0ish4s0maili5t0anbul7t0au2v3jaguar4va3cb2e0ep2tzt3welry6io2ll2m0p2nj2o0bs1urg4t1y2p0morgan6rs3uegos4niper7kaufen5ddi3e0rryhotels6properties14fh2g1h1i0a1ds2m1ndle4tchen5wi3m1n1oeln3matsu5sher5p0mg2n2r0d1ed3uokgroup8w1y0oto4z2la0caixa5mborghini8er3nd0rover6xess5salle5t0ino3robe5w0yer5b1c1ds2ease3clerc5frak4gal2o2xus4gbt3i0dl2fe0insurance9style7ghting6ke2lly3mited4o2ncoln4k2ve1ing5k1lc1p2oan0s3cker3us3l1ndon4tte1o3ve3pl0financial11r1s1t0d0a3u0ndbeck6xe1ury5v1y2ma0drid4if1son4keup4n0agement7go3p1rket0ing3s4riott5shalls7ttel5ba2c0kinsey7d1e0d0ia3et2lbourne7me1orial6n0u2rckmsd7g1h1iami3crosoft7l1ni1t2t0subishi9k1l0b1s2m0a2n1o0bi0le4da2e1i1m1nash3ey2ster5rmon3tgage6scow4to0rcycles9v0ie4p1q1r1s0d2t0n1r2u0seum3ic4v1w1x1y1z2na0b1goya4me2vy3ba2c1e0c1t0bank4flix4work5ustar5w0s2xt0direct7us4f0l2g0o2hk2i0co2ke1on3nja3ssan1y5l1o0kia3rton4w0ruz3tv4p1r0a1w2tt2u1yc2z2obi1server7ffice5kinawa6layan0group9lo3m0ega4ne1g1l0ine5oo2pen3racle3nge4g0anic5igins6saka4tsuka4t2vh3pa0ge2nasonic7ris2s1tners4s1y3y2ccw3e0t2f0izer5g1h0armacy6d1ilips5one2to0graphy6s4ysio5ics1tet2ures6d1n0g1k2oneer5zza4k1l0ace2y0station9umbing5s3m1n0c2ohl2ker3litie5rn2st3r0axi3ess3ime3o0d0uctions8f1gressive8mo2perties3y5tection8u0dential9s1t1ub2w0c2y2qa1pon3uebec3st5racing4dio4e0ad1lestate6tor2y4cipes5d0stone5umbrella9hab3ise0n3t2liance6n0t0als5pair3ort3ublican8st0aurant8view0s5xroth6ich0ardli6oh3l1o1p2o0cks3deo3gers4om3s0vp3u0gby3hr2n2w0e2yukyu6sa0arland6fe0ty4kura4le1on3msclub4ung5ndvik0coromant12ofi4p1rl2s1ve2xo3b0i1s2c0b1haeffler7midt4olarships8ol3ule3warz5ience5ot3d1e0arch3t2cure1ity6ek2lect4ner3rvices6ven3w1x0y3fr2g1h0angrila6rp3ell3ia1ksha5oes2p0ping5uji3w3i0lk2na1gles5te3j1k0i0n2y0pe4l0ing4m0art3ile4n0cf3o0ccer3ial4ftbank4ware6hu2lar2utions7ng1y2y2pa0ce3ort2t3r0l2s1t0ada2ples4r1tebank4farm7c0group6ockholm6rage3e3ream4udio2y3yle4u0cks3pplies3y2ort5rf1gery5zuki5v1watch4iss4x1y0dney4stems6z2tab1ipei4lk2obao4rget4tamotors6r2too4x0i3c0i2d0k2eam2ch0nology8l1masek5nnis4va3f1g1h0d1eater2re6iaa2ckets5enda4ps2res2ol4j0maxx4x2k0maxx5l1m0all4n1o0day3kyo3ols3p1ray3shiba5tal3urs3wn2yota3s3r0ade1ing4ining5vel0ers0insurance16ust3v2t1ube2i1nes3shu4v0s2w1z2ua1bank3s2g1k1nicom3versity8o2ol2ps2s1y1z2va0cations7na1guard7c1e0gas3ntures6risign5mögensberater2ung14sicherung10t2g1i0ajes4deo3g1king4llas4n1p1rgin4sa1ion4va1o3laanderen9n1odka3lvo3te1ing3o2yage5u2wales2mart4ter4ng0gou5tch0es6eather0channel12bcam3er2site5d0ding5ibo2r3f1hoswho6ien2ki2lliamhill9n0dows4e1ners6me2olterskluwer11odside6rk0s2ld3w2s1tc1f3xbox3erox4ihuan4n2xx2yz3yachts4hoo3maxun5ndex5e1odobashi7ga2kohama6u0tube6t1un3za0ppos4ra3ero3ip2m1one3uerich6w2", ey = "ελ1υ2бг1ел3дети4ею2католик6ом3мкд2он1сква6онлайн5рг3рус2ф2сайт3рб3укр3қаз3հայ3ישראל5קום3ابوظبي5رامكو5لاردن4بحرين5جزائر5سعودية6عليان5مغرب5مارات5یران5بارت2زار4يتك3ھارت5تونس4سودان3رية5شبكة4عراق2ب2مان4فلسطين6قطر3كاثوليك6وم3مصر2ليسيا5وريتانيا7قع4همراه5پاکستان7ڀارت4कॉम3नेट3भारत0म्3ोत5संगठन5বাংলা5ভারত2ৰত4ਭਾਰਤ4ભારત4ଭାରତ4இந்தியா6லங்கை6சிங்கப்பூர்11భారత్5ಭಾರತ4ഭാരതം5ලංකා4คอม3ไทย3ລາວ3გე2みんな3アマゾン4クラウド4グーグル4コム2ストア3セール3ファッション6ポイント4世界2中信1国1國1文网3亚马逊3企业2佛山2信息2健康2八卦2公司1益2台湾1灣2商城1店1标2嘉里0大酒店5在线2大拿2天主教3娱乐2家電2广东2微博2慈善2我爱你3手机2招聘2政务1府2新加坡2闻2时尚2書籍2机构2淡马锡3游戏2澳門2点看2移动2组织机构4网址1店1站1络2联通2谷歌2购物2通販2集团2電訊盈科4飞利浦3食品2餐厅2香格里拉3港2닷넷1컴2삼성2한국2", ty = "numeric", ny = "ascii", ry = "alpha", iy = "asciinumeric", ay = "alphanumeric", oy = "domain", sy = "emoji", cy = "scheme", ly = "slashscheme", uy = "whitespace";
function dy(e, t) {
	return e in t || (t[e] = []), t[e];
}
function fy(e, t, n) {
	t[ty] && (t[iy] = !0, t[ay] = !0), t[ny] && (t[iy] = !0, t[ry] = !0), t[iy] && (t[ay] = !0), t[ry] && (t[ay] = !0), t[ay] && (t[oy] = !0), t[sy] && (t[oy] = !0);
	for (let r in t) {
		let t = dy(r, n);
		t.indexOf(e) < 0 && t.push(e);
	}
}
function py(e, t) {
	let n = {};
	for (let r in t) t[r].indexOf(e) >= 0 && (n[r] = !0);
	return n;
}
function my(e = null) {
	this.j = {}, this.jr = [], this.jd = null, this.t = e;
}
my.groups = {}, my.prototype = {
	accepts() {
		return !!this.t;
	},
	go(e) {
		let t = this, n = t.j[e];
		if (n) return n;
		for (let n = 0; n < t.jr.length; n++) {
			let r = t.jr[n][0], i = t.jr[n][1];
			if (i && r.test(e)) return i;
		}
		return t.jd;
	},
	has(e, t = !1) {
		return t ? e in this.j : !!this.go(e);
	},
	ta(e, t, n, r) {
		for (let i = 0; i < e.length; i++) this.tt(e[i], t, n, r);
	},
	tr(e, t, n, r) {
		r = r || my.groups;
		let i;
		return t && t.j ? i = t : (i = new my(t), n && r && fy(t, n, r)), this.jr.push([e, i]), i;
	},
	ts(e, t, n, r) {
		let i = this, a = e.length;
		if (!a) return i;
		for (let t = 0; t < a - 1; t++) i = i.tt(e[t]);
		return i.tt(e[a - 1], t, n, r);
	},
	tt(e, t, n, r) {
		r = r || my.groups;
		let i = this;
		if (t && t.j) return i.j[e] = t, t;
		let a = t, o, s = i.go(e);
		return s ? (o = new my(), Object.assign(o.j, s.j), o.jr.push.apply(o.jr, s.jr), o.jd = s.jd, o.t = s.t) : o = new my(), a && (r && (o.t && typeof o.t == "string" ? fy(a, Object.assign(py(o.t, r), n), r) : n && fy(a, n, r)), o.t = a), i.j[e] = o, o;
	}
};
var Q = (e, t, n, r, i) => e.ta(t, n, r, i), hy = (e, t, n, r, i) => e.tr(t, n, r, i), gy = (e, t, n, r, i) => e.ts(t, n, r, i), $ = (e, t, n, r, i) => e.tt(t, n, r, i), _y = "WORD", vy = "UWORD", yy = "ASCIINUMERICAL", by = "ALPHANUMERICAL", xy = "LOCALHOST", Sy = "TLD", Cy = "UTLD", wy = "SCHEME", Ty = "SLASH_SCHEME", Ey = "NUM", Dy = "WS", Oy = "NL", ky = "OPENBRACE", Ay = "CLOSEBRACE", jy = "OPENBRACKET", My = "CLOSEBRACKET", Ny = "OPENPAREN", Py = "CLOSEPAREN", Fy = "OPENANGLEBRACKET", Iy = "CLOSEANGLEBRACKET", Ly = "FULLWIDTHLEFTPAREN", Ry = "FULLWIDTHRIGHTPAREN", zy = "LEFTCORNERBRACKET", By = "RIGHTCORNERBRACKET", Vy = "LEFTWHITECORNERBRACKET", Hy = "RIGHTWHITECORNERBRACKET", Uy = "FULLWIDTHLESSTHAN", Wy = "FULLWIDTHGREATERTHAN", Gy = "AMPERSAND", Ky = "APOSTROPHE", qy = "ASTERISK", Jy = "AT", Yy = "BACKSLASH", Xy = "BACKTICK", Zy = "CARET", Qy = "COLON", $y = "COMMA", eb = "DOLLAR", tb = "DOT", nb = "EQUALS", rb = "EXCLAMATION", ib = "HYPHEN", ab = "PERCENT", ob = "PIPE", sb = "PLUS", cb = "POUND", lb = "QUERY", ub = "QUOTE", db = "FULLWIDTHMIDDLEDOT", fb = "SEMI", pb = "SLASH", mb = "TILDE", hb = "UNDERSCORE", gb = "EMOJI", _b = "SYM", vb = /* @__PURE__ */ Object.freeze({
	__proto__: null,
	ALPHANUMERICAL: by,
	AMPERSAND: Gy,
	APOSTROPHE: Ky,
	ASCIINUMERICAL: yy,
	ASTERISK: qy,
	AT: Jy,
	BACKSLASH: Yy,
	BACKTICK: Xy,
	CARET: Zy,
	CLOSEANGLEBRACKET: Iy,
	CLOSEBRACE: Ay,
	CLOSEBRACKET: My,
	CLOSEPAREN: Py,
	COLON: Qy,
	COMMA: $y,
	DOLLAR: eb,
	DOT: tb,
	EMOJI: gb,
	EQUALS: nb,
	EXCLAMATION: rb,
	FULLWIDTHGREATERTHAN: Wy,
	FULLWIDTHLEFTPAREN: Ly,
	FULLWIDTHLESSTHAN: Uy,
	FULLWIDTHMIDDLEDOT: db,
	FULLWIDTHRIGHTPAREN: Ry,
	HYPHEN: ib,
	LEFTCORNERBRACKET: zy,
	LEFTWHITECORNERBRACKET: Vy,
	LOCALHOST: xy,
	NL: Oy,
	NUM: Ey,
	OPENANGLEBRACKET: Fy,
	OPENBRACE: ky,
	OPENBRACKET: jy,
	OPENPAREN: Ny,
	PERCENT: ab,
	PIPE: ob,
	PLUS: sb,
	POUND: cb,
	QUERY: lb,
	QUOTE: ub,
	RIGHTCORNERBRACKET: By,
	RIGHTWHITECORNERBRACKET: Hy,
	SCHEME: wy,
	SEMI: fb,
	SLASH: pb,
	SLASH_SCHEME: Ty,
	SYM: _b,
	TILDE: mb,
	TLD: Sy,
	UNDERSCORE: hb,
	UTLD: Cy,
	UWORD: vy,
	WORD: _y,
	WS: Dy
}), yb = /[a-z]/, bb = /\p{L}/u, xb = /\p{Emoji}/u, Sb = /\d/, Cb = /\s/, wb = "\r", Tb = "\n", Eb = "️", Db = "‍", Ob = "￼", kb = null, Ab = null;
function jb(e = []) {
	let t = {};
	my.groups = t;
	let n = new my();
	kb ?? (kb = Fb($v)), Ab ?? (Ab = Fb(ey)), $(n, "'", Ky), $(n, "{", ky), $(n, "}", Ay), $(n, "[", jy), $(n, "]", My), $(n, "(", Ny), $(n, ")", Py), $(n, "<", Fy), $(n, ">", Iy), $(n, "（", Ly), $(n, "）", Ry), $(n, "「", zy), $(n, "」", By), $(n, "『", Vy), $(n, "』", Hy), $(n, "＜", Uy), $(n, "＞", Wy), $(n, "&", Gy), $(n, "*", qy), $(n, "@", Jy), $(n, "`", Xy), $(n, "^", Zy), $(n, ":", Qy), $(n, ",", $y), $(n, "$", eb), $(n, ".", tb), $(n, "=", nb), $(n, "!", rb), $(n, "-", ib), $(n, "%", ab), $(n, "|", ob), $(n, "+", sb), $(n, "#", cb), $(n, "?", lb), $(n, "\"", ub), $(n, "/", pb), $(n, ";", fb), $(n, "~", mb), $(n, "_", hb), $(n, "\\", Yy), $(n, "・", db);
	let r = hy(n, Sb, Ey, { [ty]: !0 });
	hy(r, Sb, r);
	let i = hy(r, yb, yy, { [iy]: !0 }), a = hy(r, bb, by, { [ay]: !0 }), o = hy(n, yb, _y, { [ny]: !0 });
	hy(o, Sb, i), hy(o, yb, o), hy(i, Sb, i), hy(i, yb, i);
	let s = hy(n, bb, vy, { [ry]: !0 });
	hy(s, yb), hy(s, Sb, a), hy(s, bb, s), hy(a, Sb, a), hy(a, yb), hy(a, bb, a);
	let c = $(n, Tb, Oy, { [uy]: !0 }), l = $(n, wb, Dy, { [uy]: !0 }), u = hy(n, Cb, Dy, { [uy]: !0 });
	$(n, Ob, u), $(l, Tb, c), $(l, Ob, u), hy(l, Cb, u), $(u, wb), $(u, Tb), hy(u, Cb, u), $(u, Ob, u);
	let d = hy(n, xb, gb, { [sy]: !0 });
	$(d, "#"), hy(d, xb, d), $(d, Eb, d);
	let f = $(d, Db);
	$(f, "#"), hy(f, xb, d);
	let p = [[yb, o], [Sb, i]], m = [
		[yb, null],
		[bb, s],
		[Sb, a]
	];
	for (let e = 0; e < kb.length; e++) Pb(n, kb[e], Sy, _y, p);
	for (let e = 0; e < Ab.length; e++) Pb(n, Ab[e], Cy, vy, m);
	fy(Sy, {
		tld: !0,
		ascii: !0
	}, t), fy(Cy, {
		utld: !0,
		alpha: !0
	}, t), Pb(n, "file", wy, _y, p), Pb(n, "mailto", wy, _y, p), Pb(n, "http", Ty, _y, p), Pb(n, "https", Ty, _y, p), Pb(n, "ftp", Ty, _y, p), Pb(n, "ftps", Ty, _y, p), fy(wy, {
		scheme: !0,
		ascii: !0
	}, t), fy(Ty, {
		slashscheme: !0,
		ascii: !0
	}, t), e = e.sort((e, t) => e[0] > t[0] ? 1 : -1);
	for (let t = 0; t < e.length; t++) {
		let r = e[t][0], i = e[t][1] ? { [cy]: !0 } : { [ly]: !0 };
		r.indexOf("-") >= 0 ? i[oy] = !0 : yb.test(r) ? Sb.test(r) ? i[iy] = !0 : i[ny] = !0 : i[ty] = !0, gy(n, r, r, i);
	}
	return gy(n, "localhost", xy, { ascii: !0 }), n.jd = new my(_b), {
		start: n,
		tokens: Object.assign({ groups: t }, vb)
	};
}
function Mb(e, t) {
	let n = Nb(t.replace(/[A-Z]/g, (e) => e.toLowerCase())), r = n.length, i = [], a = 0, o = 0;
	for (; o < r;) {
		let s = e, c = null, l = 0, u = null, d = -1, f = -1;
		for (; o < r && (c = s.go(n[o]));) s = c, s.accepts() ? (d = 0, f = 0, u = s) : d >= 0 && (d += n[o].length, f++), l += n[o].length, a += n[o].length, o++;
		a -= d, o -= f, l -= d, i.push({
			t: u.t,
			v: t.slice(a - l, a),
			s: a - l,
			e: a
		});
	}
	return i;
}
function Nb(e) {
	let t = [], n = e.length, r = 0;
	for (; r < n;) {
		let i = e.charCodeAt(r), a, o = i < 55296 || i > 56319 || r + 1 === n || (a = e.charCodeAt(r + 1)) < 56320 || a > 57343 ? e[r] : e.slice(r, r + 2);
		t.push(o), r += o.length;
	}
	return t;
}
function Pb(e, t, n, r, i) {
	let a, o = t.length;
	for (let n = 0; n < o - 1; n++) {
		let o = t[n];
		e.j[o] ? a = e.j[o] : (a = new my(r), a.jr = i.slice(), e.j[o] = a), e = a;
	}
	return a = new my(n), a.jr = i.slice(), e.j[t[o - 1]] = a, a;
}
function Fb(e) {
	let t = [], n = [], r = 0;
	for (; r < e.length;) {
		let i = 0;
		for (; "0123456789".indexOf(e[r + i]) >= 0;) i++;
		if (i > 0) {
			t.push(n.join(""));
			for (let t = parseInt(e.substring(r, r + i), 10); t > 0; t--) n.pop();
			r += i;
		} else n.push(e[r]), r++;
	}
	return t;
}
var Ib = {
	defaultProtocol: "http",
	events: null,
	format: Rb,
	formatHref: Rb,
	nl2br: !1,
	tagName: "a",
	target: null,
	rel: null,
	validate: !0,
	truncate: Infinity,
	className: null,
	attributes: null,
	ignoreTags: [],
	render: null
};
function Lb(e, t = null) {
	let n = Object.assign({}, Ib);
	e && (n = Object.assign(n, e instanceof Lb ? e.o : e));
	let r = n.ignoreTags, i = [];
	for (let e = 0; e < r.length; e++) i.push(r[e].toUpperCase());
	this.o = n, t && (this.defaultRender = t), this.ignoreTags = i;
}
Lb.prototype = {
	o: Ib,
	ignoreTags: [],
	defaultRender(e) {
		return e;
	},
	check(e) {
		return this.get("validate", e.toString(), e);
	},
	get(e, t, n) {
		let r = t != null, i = this.o[e];
		return i && (typeof i == "object" ? (i = n.t in i ? i[n.t] : Ib[e], typeof i == "function" && r && (i = i(t, n))) : typeof i == "function" && r && (i = i(t, n.t, n)), i);
	},
	getObj(e, t, n) {
		let r = this.o[e];
		return typeof r == "function" && t != null && (r = r(t, n.t, n)), r;
	},
	render(e) {
		let t = e.render(this);
		return (this.get("render", null, e) || this.defaultRender)(t, e.t, e);
	}
};
function Rb(e) {
	return e;
}
function zb(e, t) {
	this.t = "token", this.v = e, this.tk = t;
}
zb.prototype = {
	isLink: !1,
	toString() {
		return this.v;
	},
	toHref(e) {
		return this.toString();
	},
	toFormattedString(e) {
		let t = this.toString(), n = e.get("truncate", t, this), r = e.get("format", t, this);
		return n && r.length > n ? r.substring(0, n) + "…" : r;
	},
	toFormattedHref(e) {
		return e.get("formatHref", this.toHref(e.get("defaultProtocol")), this);
	},
	startIndex() {
		return this.tk[0].s;
	},
	endIndex() {
		return this.tk[this.tk.length - 1].e;
	},
	toObject(e = Ib.defaultProtocol) {
		return {
			type: this.t,
			value: this.toString(),
			isLink: this.isLink,
			href: this.toHref(e),
			start: this.startIndex(),
			end: this.endIndex()
		};
	},
	toFormattedObject(e) {
		return {
			type: this.t,
			value: this.toFormattedString(e),
			isLink: this.isLink,
			href: this.toFormattedHref(e),
			start: this.startIndex(),
			end: this.endIndex()
		};
	},
	validate(e) {
		return e.get("validate", this.toString(), this);
	},
	render(e) {
		let t = this, n = this.toHref(e.get("defaultProtocol")), r = e.get("formatHref", n, this), i = e.get("tagName", n, t), a = this.toFormattedString(e), o = {}, s = e.get("className", n, t), c = e.get("target", n, t), l = e.get("rel", n, t), u = e.getObj("attributes", n, t), d = e.getObj("events", n, t);
		return o.href = r, s && (o.class = s), c && (o.target = c), l && (o.rel = l), u && Object.assign(o, u), {
			tagName: i,
			attributes: o,
			content: a,
			eventListeners: d
		};
	}
};
function Bb(e, t) {
	class n extends zb {
		constructor(t, n) {
			super(t, n), this.t = e;
		}
	}
	for (let e in t) n.prototype[e] = t[e];
	return n.t = e, n;
}
var Vb = Bb("email", {
	isLink: !0,
	toHref() {
		return "mailto:" + this.toString();
	}
}), Hb = Bb("text"), Ub = Bb("nl"), Wb = Bb("url", {
	isLink: !0,
	toHref(e = Ib.defaultProtocol) {
		return this.hasProtocol() ? this.v : `${e}://${this.v}`;
	},
	hasProtocol() {
		let e = this.tk;
		return e.length >= 2 && e[0].t !== xy && e[1].t === Qy;
	}
}), Gb = (e) => new my(e);
function Kb({ groups: e }) {
	let t = e.domain.concat([
		Gy,
		qy,
		Jy,
		Yy,
		Xy,
		Zy,
		eb,
		nb,
		ib,
		Ey,
		ab,
		ob,
		sb,
		cb,
		pb,
		_b,
		mb,
		hb
	]), n = [
		Ky,
		Qy,
		$y,
		tb,
		rb,
		ab,
		lb,
		ub,
		fb,
		Fy,
		Iy,
		ky,
		Ay,
		My,
		jy,
		Ny,
		Py,
		Ly,
		Ry,
		zy,
		By,
		Vy,
		Hy,
		Uy,
		Wy
	], r = [
		Gy,
		Ky,
		qy,
		Yy,
		Xy,
		Zy,
		eb,
		nb,
		ib,
		ky,
		Ay,
		ab,
		ob,
		sb,
		cb,
		lb,
		pb,
		_b,
		mb,
		hb
	], i = Gb(), a = $(i, mb);
	Q(a, r, a), Q(a, e.domain, a);
	let o = Gb(), s = Gb(), c = Gb();
	Q(i, e.domain, o), Q(i, e.scheme, s), Q(i, e.slashscheme, c), Q(o, r, a), Q(o, e.domain, o);
	let l = $(o, Jy);
	$(a, Jy, l), $(s, Jy, l), $(c, Jy, l);
	let u = $(a, tb);
	Q(u, r, a), Q(u, e.domain, a);
	let d = Gb();
	Q(l, e.domain, d), Q(d, e.domain, d);
	let f = $(d, tb);
	Q(f, e.domain, d);
	let p = Gb(Vb);
	Q(f, e.tld, p), Q(f, e.utld, p), $(l, xy, p);
	let m = $(d, ib);
	$(m, ib, m), Q(m, e.domain, d), Q(p, e.domain, d), $(p, tb, f), $(p, ib, m), Q($(p, Qy), e.numeric, Vb);
	let h = $(o, ib), g = $(o, tb);
	$(h, ib, h), Q(h, e.domain, o), Q(g, r, a), Q(g, e.domain, o);
	let _ = Gb(Wb);
	Q(g, e.tld, _), Q(g, e.utld, _), Q(_, e.domain, o), Q(_, r, a), $(_, tb, g), $(_, ib, h), $(_, Jy, l);
	let v = $(_, Qy), y = Gb(Wb);
	Q(v, e.numeric, y);
	let b = Gb(Wb), x = Gb();
	Q(b, t, b), Q(b, n, x), Q(x, t, b), Q(x, n, x), $(_, pb, b), $(y, pb, b);
	let S = $(s, Qy), C = $($($(c, Qy), pb), pb);
	Q(s, e.domain, o), $(s, tb, g), $(s, ib, h), Q(c, e.domain, o), $(c, tb, g), $(c, ib, h), Q(S, e.domain, b), $(S, pb, b), $(S, lb, b), Q(C, e.domain, b), Q(C, t, b), $(C, pb, b);
	let w = [
		[ky, Ay],
		[jy, My],
		[Ny, Py],
		[Fy, Iy],
		[Ly, Ry],
		[zy, By],
		[Vy, Hy],
		[Uy, Wy]
	];
	for (let e = 0; e < w.length; e++) {
		let [r, i] = w[e], a = $(b, r);
		$(x, r, a), $(a, i, b);
		let o = Gb(Wb);
		Q(a, t, o);
		let s = Gb();
		Q(a, n), Q(o, t, o), Q(o, n, s), Q(s, t, o), Q(s, n, s), $(o, i, b), $(s, i, b);
	}
	return $(i, xy, _), $(i, Oy, Ub), {
		start: i,
		tokens: vb
	};
}
function qb(e, t, n) {
	let r = n.length, i = 0, a = [], o = [];
	for (; i < r;) {
		let s = e, c = null, l = null, u = 0, d = null, f = -1;
		for (; i < r && !(c = s.go(n[i].t));) o.push(n[i++]);
		for (; i < r && (l = c || s.go(n[i].t));) c = null, s = l, s.accepts() ? (f = 0, d = s) : f >= 0 && f++, i++, u++;
		if (f < 0) i -= u, i < r && (o.push(n[i]), i++);
		else {
			o.length > 0 && (a.push(Jb(Hb, t, o)), o = []), i -= f, u -= f;
			let e = d.t, r = n.slice(i - u, i);
			a.push(Jb(e, t, r));
		}
	}
	return o.length > 0 && a.push(Jb(Hb, t, o)), a;
}
function Jb(e, t, n) {
	let r = n[0].s, i = n[n.length - 1].e;
	return new e(t.slice(r, i), n);
}
var Yb = typeof console < "u" && console && console.warn || (() => {}), Xb = "until manual call of linkify.init(). Register all schemes and plugins before invoking linkify the first time.", Zb = {
	scanner: null,
	parser: null,
	tokenQueue: [],
	pluginQueue: [],
	customSchemes: [],
	initialized: !1
};
function Qb() {
	return my.groups = {}, Zb.scanner = null, Zb.parser = null, Zb.tokenQueue = [], Zb.pluginQueue = [], Zb.customSchemes = [], Zb.initialized = !1, Zb;
}
function $b(e, t = !1) {
	if (Zb.initialized && Yb(`linkifyjs: already initialized - will not register custom scheme "${e}" ${Xb}`), !/^[0-9a-z]+(-[0-9a-z]+)*$/.test(e)) throw Error("linkifyjs: incorrect scheme format.\n1. Must only contain digits, lowercase ASCII letters or \"-\"\n2. Cannot start or end with \"-\"\n3. \"-\" cannot repeat");
	Zb.customSchemes.push([e, t]);
}
function ex() {
	Zb.scanner = jb(Zb.customSchemes);
	for (let e = 0; e < Zb.tokenQueue.length; e++) Zb.tokenQueue[e][1]({ scanner: Zb.scanner });
	Zb.parser = Kb(Zb.scanner.tokens);
	for (let e = 0; e < Zb.pluginQueue.length; e++) Zb.pluginQueue[e][1]({
		scanner: Zb.scanner,
		parser: Zb.parser
	});
	return Zb.initialized = !0, Zb;
}
function tx(e) {
	return Zb.initialized || ex(), qb(Zb.parser.start, e, Mb(Zb.scanner.start, e));
}
tx.scan = Mb;
function nx(e, t = null, n = null) {
	if (t && typeof t == "object") {
		if (n) throw Error(`linkifyjs: Invalid link type ${t}; must be a string`);
		n = t, t = null;
	}
	let r = new Lb(n), i = tx(e), a = [];
	for (let e = 0; e < i.length; e++) {
		let n = i[e];
		n.isLink && (!t || n.t === t) && r.check(n) && a.push(n.toFormattedObject(r));
	}
	return a;
}
//#endregion
//#region node_modules/@tiptap/extension-link/dist/index.js
var rx = "[\0- \xA0 ᠎ -\u2029 　]", ix = new RegExp(rx), ax = RegExp(`${rx}$`), ox = new RegExp(rx, "g");
function sx(e) {
	return e.length === 1 ? e[0].isLink : e.length === 3 && e[1].isLink ? ["()", "[]"].includes(e[0].value + e[2].value) : !1;
}
function cx(e) {
	return new Vc({
		key: new Wc("autolink"),
		appendTransaction: (t, n, r) => {
			let i = t.some((e) => e.docChanged) && !n.doc.eq(r.doc), a = t.some((e) => e.getMeta("preventAutolink"));
			if (!i || a) return;
			let { tr: o } = r;
			if (_g(sg(n.doc, [...t])).forEach(({ newRange: t }) => {
				let n = lg(r.doc, t, (e) => e.isTextblock), i, a;
				if (n.length > 1) i = n[0], a = r.doc.textBetween(i.pos, i.pos + i.node.nodeSize, void 0, " ");
				else if (n.length) {
					let e = r.doc.textBetween(t.from, t.to, " ", " ");
					if (!ax.test(e)) return;
					i = n[0], a = r.doc.textBetween(i.pos, t.to, void 0, " ");
				}
				if (i && a) {
					let t = a.split(ix).filter(Boolean);
					if (t.length <= 0) return !1;
					let n = t[t.length - 1], s = i.pos + a.lastIndexOf(n);
					if (!n) return !1;
					let c = tx(n).map((t) => t.toObject(e.defaultProtocol));
					if (!sx(c)) return !1;
					c.filter((e) => e.isLink).map((e) => ({
						...e,
						from: s + e.start + 1,
						to: s + e.end + 1
					})).filter((e) => r.schema.marks.code ? !r.doc.rangeHasMark(e.from, e.to, r.schema.marks.code) : !0).filter((t) => e.validate(t.value)).filter((t) => e.shouldAutoLink(t.value)).forEach((t) => {
						vg(t.from, t.to, r.doc).some((t) => t.mark.type === e.type) || o.addMark(t.from, t.to, e.type.create({ href: t.href }));
					});
				}
			}), o.steps.length) return o;
		}
	});
}
function lx(e) {
	return new Vc({
		key: new Wc("handleClickLink"),
		props: { handleClick: (t, n, r) => {
			if (r.button !== 0 || !t.editable) return !1;
			let i = r.target, a = [];
			for (; i.nodeName !== "DIV";) a.push(i), i = i.parentNode;
			if (!a.find((e) => e.nodeName === "A")) return !1;
			let o = mg(t.state, e.type.name), s = r.target, c = s?.href ?? o.href, l = s?.target ?? o.target;
			return s && c ? (window.open(c, l), !0) : !1;
		} }
	});
}
function ux(e) {
	return new Vc({
		key: new Wc("handlePasteLink"),
		props: { handlePaste: (t, n, r) => {
			let { state: i } = t, { selection: a } = i, { empty: o } = a;
			if (o) return !1;
			let s = "";
			r.content.forEach((e) => {
				s += e.textContent;
			});
			let c = nx(s, { defaultProtocol: e.defaultProtocol }).find((e) => e.isLink && e.value === s);
			return !s || !c ? !1 : e.editor.commands.setMark(e.type, { href: c.href });
		} }
	});
}
function dx(e, t) {
	let n = [
		"http",
		"https",
		"ftp",
		"ftps",
		"mailto",
		"tel",
		"callto",
		"sms",
		"cid",
		"xmpp"
	];
	return t && t.forEach((e) => {
		let t = typeof e == "string" ? e : e.scheme;
		t && n.push(t);
	}), !e || e.replace(ox, "").match(RegExp(`^(?:(?:${n.join("|")}):|[^a-z]|[a-z0-9+.\-]+(?:[^a-z+.\-:]|$))`, "i"));
}
var fx = Rm.create({
	name: "link",
	priority: 1e3,
	keepOnSplit: !1,
	exitable: !0,
	onCreate() {
		this.options.validate && !this.options.shouldAutoLink && (this.options.shouldAutoLink = this.options.validate, console.warn("The `validate` option is deprecated. Rename to the `shouldAutoLink` option instead.")), this.options.protocols.forEach((e) => {
			if (typeof e == "string") {
				$b(e);
				return;
			}
			$b(e.scheme, e.optionalSlashes);
		});
	},
	onDestroy() {
		Qb();
	},
	inclusive() {
		return this.options.autolink;
	},
	addOptions() {
		return {
			openOnClick: !0,
			linkOnPaste: !0,
			autolink: !0,
			protocols: [],
			defaultProtocol: "http",
			HTMLAttributes: {
				target: "_blank",
				rel: "noopener noreferrer nofollow",
				class: null
			},
			isAllowedUri: (e, t) => !!dx(e, t.protocols),
			validate: (e) => !!e,
			shouldAutoLink: (e) => !!e
		};
	},
	addAttributes() {
		return {
			href: {
				default: null,
				parseHTML(e) {
					return e.getAttribute("href");
				}
			},
			target: { default: this.options.HTMLAttributes.target },
			rel: { default: this.options.HTMLAttributes.rel },
			class: { default: this.options.HTMLAttributes.class }
		};
	},
	parseHTML() {
		return [{
			tag: "a[href]",
			getAttrs: (e) => {
				let t = e.getAttribute("href");
				return !t || !this.options.isAllowedUri(t, {
					defaultValidate: (e) => !!dx(e, this.options.protocols),
					protocols: this.options.protocols,
					defaultProtocol: this.options.defaultProtocol
				}) ? !1 : null;
			}
		}];
	},
	renderHTML({ HTMLAttributes: e }) {
		return this.options.isAllowedUri(e.href, {
			defaultValidate: (e) => !!dx(e, this.options.protocols),
			protocols: this.options.protocols,
			defaultProtocol: this.options.defaultProtocol
		}) ? [
			"a",
			vm(this.options.HTMLAttributes, e),
			0
		] : [
			"a",
			vm(this.options.HTMLAttributes, {
				...e,
				href: ""
			}),
			0
		];
	},
	addCommands() {
		return {
			setLink: (e) => ({ chain: t }) => {
				let { href: n } = e;
				return this.options.isAllowedUri(n, {
					defaultValidate: (e) => !!dx(e, this.options.protocols),
					protocols: this.options.protocols,
					defaultProtocol: this.options.defaultProtocol
				}) ? t().setMark(this.name, e).setMeta("preventAutolink", !0).run() : !1;
			},
			toggleLink: (e) => ({ chain: t }) => {
				let { href: n } = e;
				return this.options.isAllowedUri(n, {
					defaultValidate: (e) => !!dx(e, this.options.protocols),
					protocols: this.options.protocols,
					defaultProtocol: this.options.defaultProtocol
				}) ? t().toggleMark(this.name, e, { extendEmptyMarkRange: !0 }).setMeta("preventAutolink", !0).run() : !1;
			},
			unsetLink: () => ({ chain: e }) => e().unsetMark(this.name, { extendEmptyMarkRange: !0 }).setMeta("preventAutolink", !0).run()
		};
	},
	addPasteRules() {
		return [t_({
			find: (e) => {
				let t = [];
				if (e) {
					let { protocols: n, defaultProtocol: r } = this.options, i = nx(e).filter((e) => e.isLink && this.options.isAllowedUri(e.value, {
						defaultValidate: (e) => !!dx(e, n),
						protocols: n,
						defaultProtocol: r
					}));
					i.length && i.forEach((e) => t.push({
						text: e.value,
						data: { href: e.href },
						index: e.start
					}));
				}
				return t;
			},
			type: this.type,
			getAttributes: (e) => ({ href: e.data?.href })
		})];
	},
	addProseMirrorPlugins() {
		let e = [], { protocols: t, defaultProtocol: n } = this.options;
		return this.options.autolink && e.push(cx({
			type: this.type,
			defaultProtocol: this.options.defaultProtocol,
			validate: (e) => this.options.isAllowedUri(e, {
				defaultValidate: (e) => !!dx(e, t),
				protocols: t,
				defaultProtocol: n
			}),
			shouldAutoLink: this.options.shouldAutoLink
		})), this.options.openOnClick === !0 && e.push(lx({ type: this.type })), this.options.linkOnPaste && e.push(ux({
			editor: this.editor,
			defaultProtocol: this.options.defaultProtocol,
			type: this.type
		})), e;
	}
}), px, mx;
if (typeof WeakMap < "u") {
	let e = /* @__PURE__ */ new WeakMap();
	px = (t) => e.get(t), mx = (t, n) => (e.set(t, n), n);
} else {
	let e = [], t = 0;
	px = (t) => {
		for (let n = 0; n < e.length; n += 2) if (e[n] == t) return e[n + 1];
	}, mx = (n, r) => (t == 10 && (t = 0), e[t++] = n, e[t++] = r);
}
var hx = class {
	constructor(e, t, n, r) {
		this.width = e, this.height = t, this.map = n, this.problems = r;
	}
	findCell(e) {
		for (let t = 0; t < this.map.length; t++) {
			let n = this.map[t];
			if (n != e) continue;
			let r = t % this.width, i = t / this.width | 0, a = r + 1, o = i + 1;
			for (let e = 1; a < this.width && this.map[t + e] == n; e++) a++;
			for (let e = 1; o < this.height && this.map[t + this.width * e] == n; e++) o++;
			return {
				left: r,
				top: i,
				right: a,
				bottom: o
			};
		}
		throw RangeError(`No cell with offset ${e} found`);
	}
	colCount(e) {
		for (let t = 0; t < this.map.length; t++) if (this.map[t] == e) return t % this.width;
		throw RangeError(`No cell with offset ${e} found`);
	}
	nextCell(e, t, n) {
		let { left: r, right: i, top: a, bottom: o } = this.findCell(e);
		return t == "horiz" ? (n < 0 ? r == 0 : i == this.width) ? null : this.map[a * this.width + (n < 0 ? r - 1 : i)] : (n < 0 ? a == 0 : o == this.height) ? null : this.map[r + this.width * (n < 0 ? a - 1 : o)];
	}
	rectBetween(e, t) {
		let { left: n, right: r, top: i, bottom: a } = this.findCell(e), { left: o, right: s, top: c, bottom: l } = this.findCell(t);
		return {
			left: Math.min(n, o),
			top: Math.min(i, c),
			right: Math.max(r, s),
			bottom: Math.max(a, l)
		};
	}
	cellsInRect(e) {
		let t = [], n = {};
		for (let r = e.top; r < e.bottom; r++) for (let i = e.left; i < e.right; i++) {
			let a = r * this.width + i, o = this.map[a];
			n[o] || (n[o] = !0, !(i == e.left && i && this.map[a - 1] == o || r == e.top && r && this.map[a - this.width] == o) && t.push(o));
		}
		return t;
	}
	positionAt(e, t, n) {
		for (let r = 0, i = 0;; r++) {
			let a = i + n.child(r).nodeSize;
			if (r == e) {
				let n = t + e * this.width, r = (e + 1) * this.width;
				for (; n < r && this.map[n] < i;) n++;
				return n == r ? a - 1 : this.map[n];
			}
			i = a;
		}
	}
	static get(e) {
		return px(e) || mx(e, gx(e));
	}
};
function gx(e) {
	if (e.type.spec.tableRole != "table") throw RangeError("Not a table node: " + e.type.name);
	let t = _x(e), n = e.childCount, r = [], i = 0, a = null, o = [];
	for (let e = 0, i = t * n; e < i; e++) r[e] = 0;
	for (let s = 0, c = 0; s < n; s++) {
		let l = e.child(s);
		c++;
		for (let e = 0;; e++) {
			for (; i < r.length && r[i] != 0;) i++;
			if (e == l.childCount) break;
			let u = l.child(e), { colspan: d, rowspan: f, colwidth: p } = u.attrs;
			for (let e = 0; e < f; e++) {
				if (e + s >= n) {
					(a || (a = [])).push({
						type: "overlong_rowspan",
						pos: c,
						n: f - e
					});
					break;
				}
				let l = i + e * t;
				for (let e = 0; e < d; e++) {
					r[l + e] == 0 ? r[l + e] = c : (a || (a = [])).push({
						type: "collision",
						row: s,
						pos: c,
						n: d - e
					});
					let n = p && p[e];
					if (n) {
						let r = (l + e) % t * 2, i = o[r];
						i == null || i != n && o[r + 1] == 1 ? (o[r] = n, o[r + 1] = 1) : i == n && o[r + 1]++;
					}
				}
			}
			i += d, c += u.nodeSize;
		}
		let u = (s + 1) * t, d = 0;
		for (; i < u;) r[i++] == 0 && d++;
		d && (a || (a = [])).push({
			type: "missing",
			row: s,
			n: d
		}), c++;
	}
	(t === 0 || n === 0) && (a || (a = [])).push({ type: "zero_sized" });
	let s = new hx(t, n, r, a), c = !1;
	for (let e = 0; !c && e < o.length; e += 2) o[e] != null && o[e + 1] < n && (c = !0);
	return c && vx(s, o, e), s;
}
function _x(e) {
	let t = -1, n = !1;
	for (let r = 0; r < e.childCount; r++) {
		let i = e.child(r), a = 0;
		if (n) for (let t = 0; t < r; t++) {
			let n = e.child(t);
			for (let e = 0; e < n.childCount; e++) {
				let i = n.child(e);
				t + i.attrs.rowspan > r && (a += i.attrs.colspan);
			}
		}
		for (let e = 0; e < i.childCount; e++) {
			let t = i.child(e);
			a += t.attrs.colspan, t.attrs.rowspan > 1 && (n = !0);
		}
		t == -1 ? t = a : t != a && (t = Math.max(t, a));
	}
	return t;
}
function vx(e, t, n) {
	e.problems || (e.problems = []);
	let r = {};
	for (let i = 0; i < e.map.length; i++) {
		let a = e.map[i];
		if (r[a]) continue;
		r[a] = !0;
		let o = n.nodeAt(a);
		if (!o) throw RangeError(`No cell with offset ${a} found`);
		let s = null, c = o.attrs;
		for (let n = 0; n < c.colspan; n++) {
			let r = t[(i + n) % e.width * 2];
			r != null && (!c.colwidth || c.colwidth[n] != r) && ((s || (s = yx(c)))[n] = r);
		}
		s && e.problems.unshift({
			type: "colwidth mismatch",
			pos: a,
			colwidth: s
		});
	}
}
function yx(e) {
	if (e.colwidth) return e.colwidth.slice();
	let t = [];
	for (let n = 0; n < e.colspan; n++) t.push(0);
	return t;
}
function bx(e) {
	let t = e.cached.tableNodeTypes;
	if (!t) {
		t = e.cached.tableNodeTypes = {};
		for (let n in e.nodes) {
			let r = e.nodes[n], i = r.spec.tableRole;
			i && (t[i] = r);
		}
	}
	return t;
}
var xx = new Wc("selectingCells");
function Sx(e) {
	for (let t = e.depth - 1; t > 0; t--) if (e.node(t).type.spec.tableRole == "row") return e.node(0).resolve(e.before(t + 1));
	return null;
}
function Cx(e) {
	for (let t = e.depth; t > 0; t--) {
		let n = e.node(t).type.spec.tableRole;
		if (n === "cell" || n === "header_cell") return e.node(t);
	}
	return null;
}
function wx(e) {
	let t = e.selection.$head;
	for (let e = t.depth; e > 0; e--) if (t.node(e).type.spec.tableRole == "row") return !0;
	return !1;
}
function Tx(e) {
	let t = e.selection;
	if ("$anchorCell" in t && t.$anchorCell) return t.$anchorCell.pos > t.$headCell.pos ? t.$anchorCell : t.$headCell;
	if ("node" in t && t.node && t.node.type.spec.tableRole == "cell") return t.$anchor;
	let n = Sx(t.$head) || Ex(t.$head);
	if (n) return n;
	throw RangeError(`No cell found around position ${t.head}`);
}
function Ex(e) {
	for (let t = e.nodeAfter, n = e.pos; t; t = t.firstChild, n++) {
		let r = t.type.spec.tableRole;
		if (r == "cell" || r == "header_cell") return e.doc.resolve(n);
	}
	for (let t = e.nodeBefore, n = e.pos; t; t = t.lastChild, n--) {
		let r = t.type.spec.tableRole;
		if (r == "cell" || r == "header_cell") return e.doc.resolve(n - t.nodeSize);
	}
}
function Dx(e) {
	return e.parent.type.spec.tableRole == "row" && !!e.nodeAfter;
}
function Ox(e) {
	return e.node(0).resolve(e.pos + e.nodeAfter.nodeSize);
}
function kx(e, t) {
	return e.depth == t.depth && e.pos >= t.start(-1) && e.pos <= t.end(-1);
}
function Ax(e, t, n) {
	let r = e.node(-1), i = hx.get(r), a = e.start(-1), o = i.nextCell(e.pos - a, t, n);
	return o == null ? null : e.node(0).resolve(a + o);
}
function jx(e, t, n = 1) {
	let r = {
		...e,
		colspan: e.colspan - n
	};
	return r.colwidth && (r.colwidth = r.colwidth.slice(), r.colwidth.splice(t, n), r.colwidth.some((e) => e > 0) || (r.colwidth = null)), r;
}
function Mx(e, t, n = 1) {
	let r = {
		...e,
		colspan: e.colspan + n
	};
	if (r.colwidth) {
		r.colwidth = r.colwidth.slice();
		for (let e = 0; e < n; e++) r.colwidth.splice(t, 0, 0);
	}
	return r;
}
function Nx(e, t, n) {
	let r = bx(t.type.schema).header_cell;
	for (let i = 0; i < e.height; i++) if (t.nodeAt(e.map[n + i * e.width]).type != r) return !1;
	return !0;
}
var Px = class e extends B {
	constructor(e, t = e) {
		let n = e.node(-1), r = hx.get(n), i = e.start(-1), a = r.rectBetween(e.pos - i, t.pos - i), o = e.node(0), s = r.cellsInRect(a).filter((e) => e != t.pos - i);
		s.unshift(t.pos - i);
		let c = s.map((e) => {
			let t = n.nodeAt(e);
			if (!t) throw RangeError(`No cell with offset ${e} found`);
			let r = i + e + 1;
			return new Sc(o.resolve(r), o.resolve(r + t.content.size));
		});
		super(c[0].$from, c[0].$to, c), this.$anchorCell = e, this.$headCell = t;
	}
	map(t, n) {
		let r = t.resolve(n.map(this.$anchorCell.pos)), i = t.resolve(n.map(this.$headCell.pos));
		if (Dx(r) && Dx(i) && kx(r, i)) {
			let t = this.$anchorCell.node(-1) != r.node(-1);
			return t && this.isRowSelection() ? e.rowSelection(r, i) : t && this.isColSelection() ? e.colSelection(r, i) : new e(r, i);
		}
		return V.between(r, i);
	}
	content() {
		let e = this.$anchorCell.node(-1), t = hx.get(e), n = this.$anchorCell.start(-1), r = t.rectBetween(this.$anchorCell.pos - n, this.$headCell.pos - n), i = {}, a = [];
		for (let n = r.top; n < r.bottom; n++) {
			let o = [];
			for (let a = n * t.width + r.left, s = r.left; s < r.right; s++, a++) {
				let n = t.map[a];
				if (i[n]) continue;
				i[n] = !0;
				let s = t.findCell(n), c = e.nodeAt(n);
				if (!c) throw RangeError(`No cell with offset ${n} found`);
				let l = r.left - s.left, u = s.right - r.right;
				if (l > 0 || u > 0) {
					let e = c.attrs;
					if (l > 0 && (e = jx(e, 0, l)), u > 0 && (e = jx(e, e.colspan - u, u)), s.left < r.left) {
						if (c = c.type.createAndFill(e), !c) throw RangeError(`Could not create cell with attrs ${JSON.stringify(e)}`);
					} else c = c.type.create(e, c.content);
				}
				if (s.top < r.top || s.bottom > r.bottom) {
					let e = {
						...c.attrs,
						rowspan: Math.min(s.bottom, r.bottom) - Math.max(s.top, r.top)
					};
					c = s.top < r.top ? c.type.createAndFill(e) : c.type.create(e, c.content);
				}
				o.push(c);
			}
			a.push(e.child(n).copy(I.from(o)));
		}
		let o = this.isColSelection() && this.isRowSelection() ? e : a;
		return new R(I.from(o), 1, 1);
	}
	replace(e, t = R.empty) {
		let n = e.steps.length, r = this.ranges;
		for (let i = 0; i < r.length; i++) {
			let { $from: a, $to: o } = r[i], s = e.mapping.slice(n);
			e.replace(s.map(a.pos), s.map(o.pos), i ? R.empty : t);
		}
		let i = B.findFrom(e.doc.resolve(e.mapping.slice(n).map(this.to)), -1);
		i && e.setSelection(i);
	}
	replaceWith(e, t) {
		this.replace(e, new R(I.from(t), 0, 0));
	}
	forEachCell(e) {
		let t = this.$anchorCell.node(-1), n = hx.get(t), r = this.$anchorCell.start(-1), i = n.cellsInRect(n.rectBetween(this.$anchorCell.pos - r, this.$headCell.pos - r));
		for (let n = 0; n < i.length; n++) e(t.nodeAt(i[n]), r + i[n]);
	}
	isColSelection() {
		let e = this.$anchorCell.index(-1), t = this.$headCell.index(-1);
		if (Math.min(e, t) > 0) return !1;
		let n = e + this.$anchorCell.nodeAfter.attrs.rowspan, r = t + this.$headCell.nodeAfter.attrs.rowspan;
		return Math.max(n, r) == this.$headCell.node(-1).childCount;
	}
	static colSelection(t, n = t) {
		let r = t.node(-1), i = hx.get(r), a = t.start(-1), o = i.findCell(t.pos - a), s = i.findCell(n.pos - a), c = t.node(0);
		return o.top <= s.top ? (o.top > 0 && (t = c.resolve(a + i.map[o.left])), s.bottom < i.height && (n = c.resolve(a + i.map[i.width * (i.height - 1) + s.right - 1]))) : (s.top > 0 && (n = c.resolve(a + i.map[s.left])), o.bottom < i.height && (t = c.resolve(a + i.map[i.width * (i.height - 1) + o.right - 1]))), new e(t, n);
	}
	isRowSelection() {
		let e = this.$anchorCell.node(-1), t = hx.get(e), n = this.$anchorCell.start(-1), r = t.colCount(this.$anchorCell.pos - n), i = t.colCount(this.$headCell.pos - n);
		if (Math.min(r, i) > 0) return !1;
		let a = r + this.$anchorCell.nodeAfter.attrs.colspan, o = i + this.$headCell.nodeAfter.attrs.colspan;
		return Math.max(a, o) == t.width;
	}
	eq(t) {
		return t instanceof e && t.$anchorCell.pos == this.$anchorCell.pos && t.$headCell.pos == this.$headCell.pos;
	}
	static rowSelection(t, n = t) {
		let r = t.node(-1), i = hx.get(r), a = t.start(-1), o = i.findCell(t.pos - a), s = i.findCell(n.pos - a), c = t.node(0);
		return o.left <= s.left ? (o.left > 0 && (t = c.resolve(a + i.map[o.top * i.width])), s.right < i.width && (n = c.resolve(a + i.map[i.width * (s.top + 1) - 1]))) : (s.left > 0 && (n = c.resolve(a + i.map[s.top * i.width])), o.right < i.width && (t = c.resolve(a + i.map[i.width * (o.top + 1) - 1]))), new e(t, n);
	}
	toJSON() {
		return {
			type: "cell",
			anchor: this.$anchorCell.pos,
			head: this.$headCell.pos
		};
	}
	static fromJSON(t, n) {
		return new e(t.resolve(n.anchor), t.resolve(n.head));
	}
	static create(t, n, r = n) {
		return new e(t.resolve(n), t.resolve(r));
	}
	getBookmark() {
		return new Fx(this.$anchorCell.pos, this.$headCell.pos);
	}
};
Px.prototype.visible = !1, B.jsonID("cell", Px);
var Fx = class e {
	constructor(e, t) {
		this.anchor = e, this.head = t;
	}
	map(t) {
		return new e(t.map(this.anchor), t.map(this.head));
	}
	resolve(e) {
		let t = e.resolve(this.anchor), n = e.resolve(this.head);
		return t.parent.type.spec.tableRole == "row" && n.parent.type.spec.tableRole == "row" && t.index() < t.parent.childCount && n.index() < n.parent.childCount && kx(t, n) ? new Px(t, n) : B.near(n, 1);
	}
};
function Ix(e) {
	if (!(e.selection instanceof Px)) return null;
	let t = [];
	return e.selection.forEachCell((e, n) => {
		t.push(_f.node(n, n + e.nodeSize, { class: "selectedCell" }));
	}), bf.create(e.doc, t);
}
function Lx({ $from: e, $to: t }) {
	if (e.pos == t.pos || e.pos < t.pos - 6) return !1;
	let n = e.pos, r = t.pos, i = e.depth;
	for (; i >= 0 && !(e.after(i + 1) < e.end(i)); i--, n++);
	for (let e = t.depth; e >= 0 && !(t.before(e + 1) > t.start(e)); e--, r--);
	return n == r && /row|table/.test(e.node(i).type.spec.tableRole);
}
function Rx({ $from: e, $to: t }) {
	let n, r;
	for (let t = e.depth; t > 0; t--) {
		let r = e.node(t);
		if (r.type.spec.tableRole === "cell" || r.type.spec.tableRole === "header_cell") {
			n = r;
			break;
		}
	}
	for (let e = t.depth; e > 0; e--) {
		let n = t.node(e);
		if (n.type.spec.tableRole === "cell" || n.type.spec.tableRole === "header_cell") {
			r = n;
			break;
		}
	}
	return n !== r && t.parentOffset === 0;
}
function zx(e, t, n) {
	let r = (t || e).selection, i = (t || e).doc, a, o;
	if (r instanceof H && (o = r.node.type.spec.tableRole)) {
		if (o == "cell" || o == "header_cell") a = Px.create(i, r.from);
		else if (o == "row") {
			let e = i.resolve(r.from + 1);
			a = Px.rowSelection(e, e);
		} else if (!n) {
			let e = hx.get(r.node), t = r.from + 1, n = t + e.map[e.width * e.height - 1];
			a = Px.create(i, t + 1, n);
		}
	} else r instanceof V && Lx(r) ? a = V.create(i, r.from) : r instanceof V && Rx(r) && (a = V.create(i, r.$from.start(), r.$from.end()));
	return a && (t || (t = e.tr)).setSelection(a), t;
}
var Bx = new Wc("fix-tables");
function Vx(e, t, n, r) {
	let i = e.childCount, a = t.childCount;
	outer: for (let o = 0, s = 0; o < a; o++) {
		let a = t.child(o);
		for (let t = s, r = Math.min(i, o + 3); t < r; t++) if (e.child(t) == a) {
			s = t + 1, n += a.nodeSize;
			continue outer;
		}
		r(a, n), s < i && e.child(s).sameMarkup(a) ? Vx(e.child(s), a, n + 1, r) : a.nodesBetween(0, a.content.size, r, n + 1), n += a.nodeSize;
	}
}
function Hx(e, t) {
	let n, r = (t, r) => {
		t.type.spec.tableRole == "table" && (n = Ux(e, t, r, n));
	};
	return t ? t.doc != e.doc && Vx(t.doc, e.doc, 0, r) : e.doc.descendants(r), n;
}
function Ux(e, t, n, r) {
	let i = hx.get(t);
	if (!i.problems) return r;
	r || (r = e.tr);
	let a = [];
	for (let e = 0; e < i.height; e++) a.push(0);
	for (let e = 0; e < i.problems.length; e++) {
		let o = i.problems[e];
		if (o.type == "collision") {
			let e = t.nodeAt(o.pos);
			if (!e) continue;
			let i = e.attrs;
			for (let e = 0; e < i.rowspan; e++) a[o.row + e] += o.n;
			r.setNodeMarkup(r.mapping.map(n + 1 + o.pos), null, jx(i, i.colspan - o.n, o.n));
		} else if (o.type == "missing") a[o.row] += o.n;
		else if (o.type == "overlong_rowspan") {
			let e = t.nodeAt(o.pos);
			if (!e) continue;
			r.setNodeMarkup(r.mapping.map(n + 1 + o.pos), null, {
				...e.attrs,
				rowspan: e.attrs.rowspan - o.n
			});
		} else if (o.type == "colwidth mismatch") {
			let e = t.nodeAt(o.pos);
			if (!e) continue;
			r.setNodeMarkup(r.mapping.map(n + 1 + o.pos), null, {
				...e.attrs,
				colwidth: o.colwidth
			});
		} else if (o.type == "zero_sized") {
			let e = r.mapping.map(n);
			r.delete(e, e + t.nodeSize);
		}
	}
	let o, s;
	for (let e = 0; e < a.length; e++) a[e] && (o ?? (o = e), s = e);
	for (let c = 0, l = n + 1; c < i.height; c++) {
		let n = t.child(c), i = l + n.nodeSize, u = a[c];
		if (u > 0) {
			let t = "cell";
			n.firstChild && (t = n.firstChild.type.spec.tableRole);
			let a = [];
			for (let n = 0; n < u; n++) {
				let n = bx(e.schema)[t].createAndFill();
				n && a.push(n);
			}
			let d = (c == 0 || o == c - 1) && s == c ? l + 1 : i - 1;
			r.insert(r.mapping.map(d), a);
		}
		l = i;
	}
	return r.setMeta(Bx, { fixTables: !0 });
}
function Wx(e) {
	let t = e.selection, n = Tx(e), r = n.node(-1), i = n.start(-1), a = hx.get(r);
	return {
		...t instanceof Px ? a.rectBetween(t.$anchorCell.pos - i, t.$headCell.pos - i) : a.findCell(n.pos - i),
		tableStart: i,
		map: a,
		table: r
	};
}
function Gx(e, { map: t, tableStart: n, table: r }, i) {
	let a = i > 0 ? -1 : 0;
	Nx(t, r, i + a) && (a = i == 0 || i == t.width ? null : 0);
	for (let o = 0; o < t.height; o++) {
		let s = o * t.width + i;
		if (i > 0 && i < t.width && t.map[s - 1] == t.map[s]) {
			let a = t.map[s], c = r.nodeAt(a);
			e.setNodeMarkup(e.mapping.map(n + a), null, Mx(c.attrs, i - t.colCount(a))), o += c.attrs.rowspan - 1;
		} else {
			let c = a == null ? bx(r.type.schema).cell : r.nodeAt(t.map[s + a]).type, l = t.positionAt(o, i, r);
			e.insert(e.mapping.map(n + l), c.createAndFill());
		}
	}
	return e;
}
function Kx(e, t) {
	if (!wx(e)) return !1;
	if (t) {
		let n = Wx(e);
		t(Gx(e.tr, n, n.left));
	}
	return !0;
}
function qx(e, t) {
	if (!wx(e)) return !1;
	if (t) {
		let n = Wx(e);
		t(Gx(e.tr, n, n.right));
	}
	return !0;
}
function Jx(e, { map: t, table: n, tableStart: r }, i) {
	let a = e.mapping.maps.length;
	for (let o = 0; o < t.height;) {
		let s = o * t.width + i, c = t.map[s], l = n.nodeAt(c), u = l.attrs;
		if (i > 0 && t.map[s - 1] == c || i < t.width - 1 && t.map[s + 1] == c) e.setNodeMarkup(e.mapping.slice(a).map(r + c), null, jx(u, i - t.colCount(c)));
		else {
			let t = e.mapping.slice(a).map(r + c);
			e.delete(t, t + l.nodeSize);
		}
		o += u.rowspan;
	}
}
function Yx(e, t) {
	if (!wx(e)) return !1;
	if (t) {
		let n = Wx(e), r = e.tr;
		if (n.left == 0 && n.right == n.map.width) return !1;
		for (let e = n.right - 1; Jx(r, n, e), e != n.left; e--) {
			let e = n.tableStart ? r.doc.nodeAt(n.tableStart - 1) : r.doc;
			if (!e) throw RangeError("No table found");
			n.table = e, n.map = hx.get(e);
		}
		t(r);
	}
	return !0;
}
function Xx(e, t, n) {
	let r = bx(t.type.schema).header_cell;
	for (let i = 0; i < e.width; i++) if (t.nodeAt(e.map[i + n * e.width])?.type != r) return !1;
	return !0;
}
function Zx(e, { map: t, tableStart: n, table: r }, i) {
	let a = n;
	for (let e = 0; e < i; e++) a += r.child(e).nodeSize;
	let o = [], s = i > 0 ? -1 : 0;
	Xx(t, r, i + s) && (s = i == 0 || i == t.height ? null : 0);
	for (let a = 0, c = t.width * i; a < t.width; a++, c++) if (i > 0 && i < t.height && t.map[c] == t.map[c - t.width]) {
		let i = t.map[c], o = r.nodeAt(i).attrs;
		e.setNodeMarkup(n + i, null, {
			...o,
			rowspan: o.rowspan + 1
		}), a += o.colspan - 1;
	} else {
		let e = (s == null ? bx(r.type.schema).cell : r.nodeAt(t.map[c + s * t.width])?.type)?.createAndFill();
		e && o.push(e);
	}
	return e.insert(a, bx(r.type.schema).row.create(null, o)), e;
}
function Qx(e, t) {
	if (!wx(e)) return !1;
	if (t) {
		let n = Wx(e);
		t(Zx(e.tr, n, n.top));
	}
	return !0;
}
function $x(e, t) {
	if (!wx(e)) return !1;
	if (t) {
		let n = Wx(e);
		t(Zx(e.tr, n, n.bottom));
	}
	return !0;
}
function eS(e, { map: t, table: n, tableStart: r }, i) {
	let a = 0;
	for (let e = 0; e < i; e++) a += n.child(e).nodeSize;
	let o = a + n.child(i).nodeSize, s = e.mapping.maps.length;
	e.delete(a + r, o + r);
	let c = /* @__PURE__ */ new Set();
	for (let a = 0, o = i * t.width; a < t.width; a++, o++) {
		let l = t.map[o];
		if (!c.has(l)) {
			if (c.add(l), i > 0 && l == t.map[o - t.width]) {
				let t = n.nodeAt(l).attrs;
				e.setNodeMarkup(e.mapping.slice(s).map(l + r), null, {
					...t,
					rowspan: t.rowspan - 1
				}), a += t.colspan - 1;
			} else if (i < t.height && l == t.map[o + t.width]) {
				let o = n.nodeAt(l), c = o.attrs, u = o.type.create({
					...c,
					rowspan: o.attrs.rowspan - 1
				}, o.content), d = t.positionAt(i + 1, a, n);
				e.insert(e.mapping.slice(s).map(r + d), u), a += c.colspan - 1;
			}
		}
	}
}
function tS(e, t) {
	if (!wx(e)) return !1;
	if (t) {
		let n = Wx(e), r = e.tr;
		if (n.top == 0 && n.bottom == n.map.height) return !1;
		for (let e = n.bottom - 1; eS(r, n, e), e != n.top; e--) {
			let e = n.tableStart ? r.doc.nodeAt(n.tableStart - 1) : r.doc;
			if (!e) throw RangeError("No table found");
			n.table = e, n.map = hx.get(n.table);
		}
		t(r);
	}
	return !0;
}
function nS(e) {
	let t = e.content;
	return t.childCount == 1 && t.child(0).isTextblock && t.child(0).childCount == 0;
}
function rS({ width: e, height: t, map: n }, r) {
	let i = r.top * e + r.left, a = i, o = (r.bottom - 1) * e + r.left, s = i + (r.right - r.left - 1);
	for (let t = r.top; t < r.bottom; t++) {
		if (r.left > 0 && n[a] == n[a - 1] || r.right < e && n[s] == n[s + 1]) return !0;
		a += e, s += e;
	}
	for (let a = r.left; a < r.right; a++) {
		if (r.top > 0 && n[i] == n[i - e] || r.bottom < t && n[o] == n[o + e]) return !0;
		i++, o++;
	}
	return !1;
}
function iS(e, t) {
	let n = e.selection;
	if (!(n instanceof Px) || n.$anchorCell.pos == n.$headCell.pos) return !1;
	let r = Wx(e), { map: i } = r;
	if (rS(i, r)) return !1;
	if (t) {
		let n = e.tr, a = {}, o = I.empty, s, c;
		for (let e = r.top; e < r.bottom; e++) for (let t = r.left; t < r.right; t++) {
			let l = i.map[e * i.width + t], u = r.table.nodeAt(l);
			if (!(a[l] || !u)) if (a[l] = !0, s == null) s = l, c = u;
			else {
				nS(u) || (o = o.append(u.content));
				let e = n.mapping.map(l + r.tableStart);
				n.delete(e, e + u.nodeSize);
			}
		}
		if (s == null || c == null) return !0;
		if (n.setNodeMarkup(s + r.tableStart, null, {
			...Mx(c.attrs, c.attrs.colspan, r.right - r.left - c.attrs.colspan),
			rowspan: r.bottom - r.top
		}), o.size > 0) {
			let e = s + 1 + c.content.size, t = nS(c) ? s + 1 : e;
			n.replaceWith(t + r.tableStart, e + r.tableStart, o);
		}
		n.setSelection(new Px(n.doc.resolve(s + r.tableStart))), t(n);
	}
	return !0;
}
function aS(e, t) {
	let n = bx(e.schema);
	return oS(({ node: e }) => n[e.type.spec.tableRole])(e, t);
}
function oS(e) {
	return (t, n) => {
		let r = t.selection, i, a;
		if (r instanceof Px) {
			if (r.$anchorCell.pos != r.$headCell.pos) return !1;
			i = r.$anchorCell.nodeAfter, a = r.$anchorCell.pos;
		} else {
			if (i = Cx(r.$from), !i) return !1;
			a = Sx(r.$from)?.pos;
		}
		if (i == null || a == null || i.attrs.colspan == 1 && i.attrs.rowspan == 1) return !1;
		if (n) {
			let o = i.attrs, s = [], c = o.colwidth;
			o.rowspan > 1 && (o = {
				...o,
				rowspan: 1
			}), o.colspan > 1 && (o = {
				...o,
				colspan: 1
			});
			let l = Wx(t), u = t.tr;
			for (let e = 0; e < l.right - l.left; e++) s.push(c ? {
				...o,
				colwidth: c && c[e] ? [c[e]] : null
			} : o);
			let d;
			for (let t = l.top; t < l.bottom; t++) {
				let n = l.map.positionAt(t, l.left, l.table);
				t == l.top && (n += i.nodeSize);
				for (let r = l.left, a = 0; r < l.right; r++, a++) r == l.left && t == l.top || u.insert(d = u.mapping.map(n + l.tableStart, 1), e({
					node: i,
					row: t,
					col: r
				}).createAndFill(s[a]));
			}
			u.setNodeMarkup(a, e({
				node: i,
				row: l.top,
				col: l.left
			}), s[0]), r instanceof Px && u.setSelection(new Px(u.doc.resolve(r.$anchorCell.pos), d ? u.doc.resolve(d) : void 0)), n(u);
		}
		return !0;
	};
}
function sS(e, t) {
	return function(n, r) {
		if (!wx(n)) return !1;
		let i = Tx(n);
		if (i.nodeAfter.attrs[e] === t) return !1;
		if (r) {
			let a = n.tr;
			n.selection instanceof Px ? n.selection.forEachCell((n, r) => {
				n.attrs[e] !== t && a.setNodeMarkup(r, null, {
					...n.attrs,
					[e]: t
				});
			}) : a.setNodeMarkup(i.pos, null, {
				...i.nodeAfter.attrs,
				[e]: t
			}), r(a);
		}
		return !0;
	};
}
function cS(e) {
	return function(t, n) {
		if (!wx(t)) return !1;
		if (n) {
			let r = bx(t.schema), i = Wx(t), a = t.tr, o = i.map.cellsInRect(e == "column" ? {
				left: i.left,
				top: 0,
				right: i.right,
				bottom: i.map.height
			} : e == "row" ? {
				left: 0,
				top: i.top,
				right: i.map.width,
				bottom: i.bottom
			} : i), s = o.map((e) => i.table.nodeAt(e));
			for (let e = 0; e < o.length; e++) s[e].type == r.header_cell && a.setNodeMarkup(i.tableStart + o[e], r.cell, s[e].attrs);
			if (a.steps.length === 0) for (let e = 0; e < o.length; e++) a.setNodeMarkup(i.tableStart + o[e], r.header_cell, s[e].attrs);
			n(a);
		}
		return !0;
	};
}
function lS(e, t, n) {
	let r = t.map.cellsInRect({
		left: 0,
		top: 0,
		right: e == "row" ? t.map.width : 1,
		bottom: e == "column" ? t.map.height : 1
	});
	for (let e = 0; e < r.length; e++) {
		let i = t.table.nodeAt(r[e]);
		if (i && i.type !== n.header_cell) return !1;
	}
	return !0;
}
function uS(e, t) {
	return t = t || { useDeprecatedLogic: !1 }, t.useDeprecatedLogic ? cS(e) : function(t, n) {
		if (!wx(t)) return !1;
		if (n) {
			let r = bx(t.schema), i = Wx(t), a = t.tr, o = lS("row", i, r), s = lS("column", i, r), c = (e === "column" ? o : e === "row" && s) ? 1 : 0, l = e == "column" ? {
				left: 0,
				top: c,
				right: 1,
				bottom: i.map.height
			} : e == "row" ? {
				left: c,
				top: 0,
				right: i.map.width,
				bottom: 1
			} : i, u = e == "column" ? s ? r.cell : r.header_cell : e == "row" ? o ? r.cell : r.header_cell : r.cell;
			i.map.cellsInRect(l).forEach((e) => {
				let t = e + i.tableStart, n = a.doc.nodeAt(t);
				n && a.setNodeMarkup(t, u, n.attrs);
			}), n(a);
		}
		return !0;
	};
}
uS("row", { useDeprecatedLogic: !0 }), uS("column", { useDeprecatedLogic: !0 });
var dS = uS("cell", { useDeprecatedLogic: !0 });
function fS(e, t) {
	if (t < 0) {
		let t = e.nodeBefore;
		if (t) return e.pos - t.nodeSize;
		for (let t = e.index(-1) - 1, n = e.before(); t >= 0; t--) {
			let r = e.node(-1).child(t), i = r.lastChild;
			if (i) return n - 1 - i.nodeSize;
			n -= r.nodeSize;
		}
	} else {
		if (e.index() < e.parent.childCount - 1) return e.pos + e.nodeAfter.nodeSize;
		let t = e.node(-1);
		for (let n = e.indexAfter(-1), r = e.after(); n < t.childCount; n++) {
			let e = t.child(n);
			if (e.childCount) return r + 1;
			r += e.nodeSize;
		}
	}
	return null;
}
function pS(e) {
	return function(t, n) {
		if (!wx(t)) return !1;
		let r = fS(Tx(t), e);
		if (r == null) return !1;
		if (n) {
			let e = t.doc.resolve(r);
			n(t.tr.setSelection(V.between(e, Ox(e))).scrollIntoView());
		}
		return !0;
	};
}
function mS(e, t) {
	let n = e.selection.$anchor;
	for (let r = n.depth; r > 0; r--) if (n.node(r).type.spec.tableRole == "table") return t && t(e.tr.delete(n.before(r), n.after(r)).scrollIntoView()), !0;
	return !1;
}
function hS(e, t) {
	let n = e.selection;
	if (!(n instanceof Px)) return !1;
	if (t) {
		let r = e.tr, i = bx(e.schema).cell.createAndFill().content;
		n.forEachCell((e, t) => {
			e.content.eq(i) || r.replace(r.mapping.map(t + 1), r.mapping.map(t + e.nodeSize - 1), new R(i, 0, 0));
		}), r.docChanged && t(r);
	}
	return !0;
}
function gS(e) {
	if (e.size === 0) return null;
	let { content: t, openStart: n, openEnd: r } = e;
	for (; t.childCount == 1 && (n > 0 && r > 0 || t.child(0).type.spec.tableRole == "table");) n--, r--, t = t.child(0).content;
	let i = t.child(0), a = i.type.spec.tableRole, o = i.type.schema, s = [];
	if (a == "row") for (let e = 0; e < t.childCount; e++) {
		let i = t.child(e).content, a = e ? 0 : Math.max(0, n - 1), c = e < t.childCount - 1 ? 0 : Math.max(0, r - 1);
		(a || c) && (i = vS(bx(o).row, new R(i, a, c)).content), s.push(i);
	}
	else if (a == "cell" || a == "header_cell") s.push(n || r ? vS(bx(o).row, new R(t, n, r)).content : t);
	else return null;
	return _S(o, s);
}
function _S(e, t) {
	let n = [];
	for (let e = 0; e < t.length; e++) {
		let r = t[e];
		for (let t = r.childCount - 1; t >= 0; t--) {
			let { rowspan: i, colspan: a } = r.child(t).attrs;
			for (let t = e; t < e + i; t++) n[t] = (n[t] || 0) + a;
		}
	}
	let r = 0;
	for (let e = 0; e < n.length; e++) r = Math.max(r, n[e]);
	for (let i = 0; i < n.length; i++) if (i >= t.length && t.push(I.empty), n[i] < r) {
		let a = bx(e).cell.createAndFill(), o = [];
		for (let e = n[i]; e < r; e++) o.push(a);
		t[i] = t[i].append(I.from(o));
	}
	return {
		height: t.length,
		width: r,
		rows: t
	};
}
function vS(e, t) {
	let n = e.createAndFill();
	return new bc(n).replace(0, n.content.size, t).doc;
}
function yS({ width: e, height: t, rows: n }, r, i) {
	if (e != r) {
		let t = [], i = [];
		for (let e = 0; e < n.length; e++) {
			let a = n[e], o = [];
			for (let n = t[e] || 0, i = 0; n < r; i++) {
				let s = a.child(i % a.childCount);
				n + s.attrs.colspan > r && (s = s.type.createChecked(jx(s.attrs, s.attrs.colspan, n + s.attrs.colspan - r), s.content)), o.push(s), n += s.attrs.colspan;
				for (let n = 1; n < s.attrs.rowspan; n++) t[e + n] = (t[e + n] || 0) + s.attrs.colspan;
			}
			i.push(I.from(o));
		}
		n = i, e = r;
	}
	if (t != i) {
		let e = [];
		for (let r = 0, a = 0; r < i; r++, a++) {
			let o = [], s = n[a % t];
			for (let e = 0; e < s.childCount; e++) {
				let t = s.child(e);
				r + t.attrs.rowspan > i && (t = t.type.create({
					...t.attrs,
					rowspan: Math.max(1, i - t.attrs.rowspan)
				}, t.content)), o.push(t);
			}
			e.push(I.from(o));
		}
		n = e, t = i;
	}
	return {
		width: e,
		height: t,
		rows: n
	};
}
function bS(e, t, n, r, i, a, o) {
	let s = e.doc.type.schema, c = bx(s), l, u;
	if (i > t.width) for (let a = 0, s = 0; a < t.height; a++) {
		let d = n.child(a);
		s += d.nodeSize;
		let f = [], p;
		p = d.lastChild == null || d.lastChild.type == c.cell ? l || (l = c.cell.createAndFill()) : u || (u = c.header_cell.createAndFill());
		for (let e = t.width; e < i; e++) f.push(p);
		e.insert(e.mapping.slice(o).map(s - 1 + r), f);
	}
	if (a > t.height) {
		let s = [];
		for (let e = 0, r = (t.height - 1) * t.width; e < Math.max(t.width, i); e++) {
			let i = e >= t.width ? !1 : n.nodeAt(t.map[r + e]).type == c.header_cell;
			s.push(i ? u || (u = c.header_cell.createAndFill()) : l || (l = c.cell.createAndFill()));
		}
		let d = c.row.create(null, I.from(s)), f = [];
		for (let e = t.height; e < a; e++) f.push(d);
		e.insert(e.mapping.slice(o).map(r + n.nodeSize - 2), f);
	}
	return !!(l || u);
}
function xS(e, t, n, r, i, a, o, s) {
	if (o == 0 || o == t.height) return !1;
	let c = !1;
	for (let l = i; l < a; l++) {
		let i = o * t.width + l, a = t.map[i];
		if (t.map[i - t.width] == a) {
			c = !0;
			let i = n.nodeAt(a), { top: u, left: d } = t.findCell(a);
			e.setNodeMarkup(e.mapping.slice(s).map(a + r), null, {
				...i.attrs,
				rowspan: o - u
			}), e.insert(e.mapping.slice(s).map(t.positionAt(o, d, n)), i.type.createAndFill({
				...i.attrs,
				rowspan: u + i.attrs.rowspan - o
			})), l += i.attrs.colspan - 1;
		}
	}
	return c;
}
function SS(e, t, n, r, i, a, o, s) {
	if (o == 0 || o == t.width) return !1;
	let c = !1;
	for (let l = i; l < a; l++) {
		let i = l * t.width + o, a = t.map[i];
		if (t.map[i - 1] == a) {
			c = !0;
			let i = n.nodeAt(a), u = t.colCount(a), d = e.mapping.slice(s).map(a + r);
			e.setNodeMarkup(d, null, jx(i.attrs, o - u, i.attrs.colspan - (o - u))), e.insert(d + i.nodeSize, i.type.createAndFill(jx(i.attrs, 0, o - u))), l += i.attrs.rowspan - 1;
		}
	}
	return c;
}
function CS(e, t, n, r, i) {
	let a = n ? e.doc.nodeAt(n - 1) : e.doc;
	if (!a) throw Error("No table found");
	let o = hx.get(a), { top: s, left: c } = r, l = c + i.width, u = s + i.height, d = e.tr, f = 0;
	function p() {
		if (a = n ? d.doc.nodeAt(n - 1) : d.doc, !a) throw Error("No table found");
		o = hx.get(a), f = d.mapping.maps.length;
	}
	bS(d, o, a, n, l, u, f) && p(), xS(d, o, a, n, c, l, s, f) && p(), xS(d, o, a, n, c, l, u, f) && p(), SS(d, o, a, n, s, u, c, f) && p(), SS(d, o, a, n, s, u, l, f) && p();
	for (let e = s; e < u; e++) {
		let t = o.positionAt(e, c, a), r = o.positionAt(e, l, a);
		d.replace(d.mapping.slice(f).map(t + n), d.mapping.slice(f).map(r + n), new R(i.rows[e - s], 0, 0));
	}
	p(), d.setSelection(new Px(d.doc.resolve(n + o.positionAt(s, c, a)), d.doc.resolve(n + o.positionAt(u - 1, l - 1, a)))), t(d);
}
var wS = xp({
	ArrowLeft: ES("horiz", -1),
	ArrowRight: ES("horiz", 1),
	ArrowUp: ES("vert", -1),
	ArrowDown: ES("vert", 1),
	"Shift-ArrowLeft": DS("horiz", -1),
	"Shift-ArrowRight": DS("horiz", 1),
	"Shift-ArrowUp": DS("vert", -1),
	"Shift-ArrowDown": DS("vert", 1),
	Backspace: hS,
	"Mod-Backspace": hS,
	Delete: hS,
	"Mod-Delete": hS
});
function TS(e, t, n) {
	return n.eq(e.selection) ? !1 : (t && t(e.tr.setSelection(n).scrollIntoView()), !0);
}
function ES(e, t) {
	return (n, r, i) => {
		if (!i) return !1;
		let a = n.selection;
		if (a instanceof Px) return TS(n, r, B.near(a.$headCell, t));
		if (e != "horiz" && !a.empty) return !1;
		let o = jS(i, e, t);
		if (o == null) return !1;
		if (e == "horiz") return TS(n, r, B.near(n.doc.resolve(a.head + t), t));
		{
			let i = n.doc.resolve(o), a = Ax(i, e, t), s;
			return s = a ? B.near(a, 1) : t < 0 ? B.near(n.doc.resolve(i.before(-1)), -1) : B.near(n.doc.resolve(i.after(-1)), 1), TS(n, r, s);
		}
	};
}
function DS(e, t) {
	return (n, r, i) => {
		if (!i) return !1;
		let a = n.selection, o;
		if (a instanceof Px) o = a;
		else {
			let r = jS(i, e, t);
			if (r == null) return !1;
			o = new Px(n.doc.resolve(r));
		}
		let s = Ax(o.$headCell, e, t);
		return s ? TS(n, r, new Px(o.$anchorCell, s)) : !1;
	};
}
function OS(e, t) {
	let n = e.state.doc, r = Sx(n.resolve(t));
	return r ? (e.dispatch(e.state.tr.setSelection(new Px(r))), !0) : !1;
}
function kS(e, t, n) {
	if (!wx(e.state)) return !1;
	let r = gS(n), i = e.state.selection;
	if (i instanceof Px) {
		r || (r = {
			width: 1,
			height: 1,
			rows: [I.from(vS(bx(e.state.schema).cell, n))]
		});
		let t = i.$anchorCell.node(-1), a = i.$anchorCell.start(-1), o = hx.get(t).rectBetween(i.$anchorCell.pos - a, i.$headCell.pos - a);
		return r = yS(r, o.right - o.left, o.bottom - o.top), CS(e.state, e.dispatch, a, o, r), !0;
	} else if (r) {
		let t = Tx(e.state), n = t.start(-1);
		return CS(e.state, e.dispatch, n, hx.get(t.node(-1)).findCell(t.pos - n), r), !0;
	} else return !1;
}
function AS(e, t) {
	if (t.button != 0 || t.ctrlKey || t.metaKey) return;
	let n = MS(e, t.target), r;
	if (t.shiftKey && e.state.selection instanceof Px) i(e.state.selection.$anchorCell, t), t.preventDefault();
	else if (t.shiftKey && n && (r = Sx(e.state.selection.$anchor)) != null && NS(e, t)?.pos != r.pos) i(r, t), t.preventDefault();
	else if (!n) return;
	function i(t, n) {
		let r = NS(e, n), i = xx.getState(e.state) == null;
		if (!r || !kx(t, r)) if (i) r = t;
		else return;
		let a = new Px(t, r);
		if (i || !e.state.selection.eq(a)) {
			let n = e.state.tr.setSelection(a);
			i && n.setMeta(xx, t.pos), e.dispatch(n);
		}
	}
	function a() {
		e.root.removeEventListener("mouseup", a), e.root.removeEventListener("dragstart", a), e.root.removeEventListener("mousemove", o), xx.getState(e.state) != null && e.dispatch(e.state.tr.setMeta(xx, -1));
	}
	function o(r) {
		let o = r, s = xx.getState(e.state), c;
		if (s != null) c = e.state.doc.resolve(s);
		else if (MS(e, o.target) != n && (c = NS(e, t), !c)) return a();
		c && i(c, o);
	}
	e.root.addEventListener("mouseup", a), e.root.addEventListener("dragstart", a), e.root.addEventListener("mousemove", o);
}
function jS(e, t, n) {
	if (!(e.state.selection instanceof V)) return null;
	let { $head: r } = e.state.selection;
	for (let i = r.depth - 1; i >= 0; i--) {
		let a = r.node(i);
		if ((n < 0 ? r.index(i) : r.indexAfter(i)) != (n < 0 ? 0 : a.childCount)) return null;
		if (a.type.spec.tableRole == "cell" || a.type.spec.tableRole == "header_cell") {
			let a = r.before(i), o = t == "vert" ? n > 0 ? "down" : "up" : n > 0 ? "right" : "left";
			return e.endOfTextblock(o) ? a : null;
		}
	}
	return null;
}
function MS(e, t) {
	for (; t && t != e.dom; t = t.parentNode) if (t.nodeName == "TD" || t.nodeName == "TH") return t;
	return null;
}
function NS(e, t) {
	let n = e.posAtCoords({
		left: t.clientX,
		top: t.clientY
	});
	if (!n) return null;
	let { inside: r, pos: i } = n;
	return r >= 0 && Sx(e.state.doc.resolve(r)) || Sx(e.state.doc.resolve(i));
}
var PS = class {
	constructor(e, t) {
		this.node = e, this.defaultCellMinWidth = t, this.dom = document.createElement("div"), this.dom.className = "tableWrapper", this.table = this.dom.appendChild(document.createElement("table")), this.table.style.setProperty("--default-cell-min-width", `${t}px`), this.colgroup = this.table.appendChild(document.createElement("colgroup")), FS(e, this.colgroup, this.table, t), this.contentDOM = this.table.appendChild(document.createElement("tbody"));
	}
	update(e) {
		return e.type == this.node.type ? (this.node = e, FS(e, this.colgroup, this.table, this.defaultCellMinWidth), !0) : !1;
	}
	ignoreMutation(e) {
		return e.type == "attributes" && (e.target == this.table || this.colgroup.contains(e.target));
	}
};
function FS(e, t, n, r, i, a) {
	let o = 0, s = !0, c = t.firstChild, l = e.firstChild;
	if (l) {
		for (let e = 0, n = 0; e < l.childCount; e++) {
			let { colspan: u, colwidth: d } = l.child(e).attrs;
			for (let e = 0; e < u; e++, n++) {
				let l = i == n ? a : d && d[e], u = l ? l + "px" : "";
				if (o += l || r, l || (s = !1), c) c.style.width != u && (c.style.width = u), c = c.nextSibling;
				else {
					let e = document.createElement("col");
					e.style.width = u, t.appendChild(e);
				}
			}
		}
		for (; c;) {
			var u;
			let e = c.nextSibling;
			(u = c.parentNode) == null || u.removeChild(c), c = e;
		}
		s ? (n.style.width = o + "px", n.style.minWidth = "") : (n.style.width = "", n.style.minWidth = o + "px");
	}
}
var IS = new Wc("tableColumnResizing");
function LS({ handleWidth: e = 5, cellMinWidth: t = 25, defaultCellMinWidth: n = 100, View: r = PS, lastColumnResizable: i = !0 } = {}) {
	let a = new Vc({
		key: IS,
		state: {
			init(e, t) {
				var i;
				let o = (i = a.spec) == null || (i = i.props) == null ? void 0 : i.nodeViews, s = bx(t.schema).table.name;
				return r && o && (o[s] = (e, t) => new r(e, n, t)), new RS(-1, !1);
			},
			apply(e, t) {
				return t.apply(e);
			}
		},
		props: {
			attributes: (e) => {
				let t = IS.getState(e);
				return t && t.activeHandle > -1 ? { class: "resize-cursor" } : {};
			},
			handleDOMEvents: {
				mousemove: (t, n) => {
					zS(t, n, e, i);
				},
				mouseleave: (e) => {
					BS(e);
				},
				mousedown: (e, r) => {
					VS(e, r, t, n);
				}
			},
			decorations: (e) => {
				let t = IS.getState(e);
				if (t && t.activeHandle > -1) return XS(e, t.activeHandle);
			},
			nodeViews: {}
		}
	});
	return a;
}
var RS = class e {
	constructor(e, t) {
		this.activeHandle = e, this.dragging = t;
	}
	apply(t) {
		let n = this, r = t.getMeta(IS);
		if (r && r.setHandle != null) return new e(r.setHandle, !1);
		if (r && r.setDragging !== void 0) return new e(n.activeHandle, r.setDragging);
		if (n.activeHandle > -1 && t.docChanged) {
			let r = t.mapping.map(n.activeHandle, -1);
			return Dx(t.doc.resolve(r)) || (r = -1), new e(r, n.dragging);
		}
		return n;
	}
};
function zS(e, t, n, r) {
	if (!e.editable) return;
	let i = IS.getState(e.state);
	if (i && !i.dragging) {
		let a = US(t.target), o = -1;
		if (a) {
			let { left: r, right: i } = a.getBoundingClientRect();
			t.clientX - r <= n ? o = WS(e, t, "left", n) : i - t.clientX <= n && (o = WS(e, t, "right", n));
		}
		if (o != i.activeHandle) {
			if (!r && o !== -1) {
				let t = e.state.doc.resolve(o), n = t.node(-1), r = hx.get(n), i = t.start(-1);
				if (r.colCount(t.pos - i) + t.nodeAfter.attrs.colspan - 1 == r.width - 1) return;
			}
			KS(e, o);
		}
	}
}
function BS(e) {
	if (!e.editable) return;
	let t = IS.getState(e.state);
	t && t.activeHandle > -1 && !t.dragging && KS(e, -1);
}
function VS(e, t, n, r) {
	if (!e.editable) return !1;
	let i = e.dom.ownerDocument.defaultView ?? window, a = IS.getState(e.state);
	if (!a || a.activeHandle == -1 || a.dragging) return !1;
	let o = e.state.doc.nodeAt(a.activeHandle), s = HS(e, a.activeHandle, o.attrs);
	e.dispatch(e.state.tr.setMeta(IS, { setDragging: {
		startX: t.clientX,
		startWidth: s
	} }));
	function c(t) {
		i.removeEventListener("mouseup", c), i.removeEventListener("mousemove", l);
		let r = IS.getState(e.state);
		r?.dragging && (qS(e, r.activeHandle, GS(r.dragging, t, n)), e.dispatch(e.state.tr.setMeta(IS, { setDragging: null })));
	}
	function l(t) {
		if (!t.which) return c(t);
		let i = IS.getState(e.state);
		if (i && i.dragging) {
			let a = GS(i.dragging, t, n);
			JS(e, i.activeHandle, a, r);
		}
	}
	return JS(e, a.activeHandle, s, r), i.addEventListener("mouseup", c), i.addEventListener("mousemove", l), t.preventDefault(), !0;
}
function HS(e, t, { colspan: n, colwidth: r }) {
	let i = r && r[r.length - 1];
	if (i) return i;
	let a = e.domAtPos(t), o = a.node.childNodes[a.offset].offsetWidth, s = n;
	if (r) for (let e = 0; e < n; e++) r[e] && (o -= r[e], s--);
	return o / s;
}
function US(e) {
	for (; e && e.nodeName != "TD" && e.nodeName != "TH";) e = e.classList && e.classList.contains("ProseMirror") ? null : e.parentNode;
	return e;
}
function WS(e, t, n, r) {
	let i = n == "right" ? -r : r, a = e.posAtCoords({
		left: t.clientX + i,
		top: t.clientY
	});
	if (!a) return -1;
	let { pos: o } = a, s = Sx(e.state.doc.resolve(o));
	if (!s) return -1;
	if (n == "right") return s.pos;
	let c = hx.get(s.node(-1)), l = s.start(-1), u = c.map.indexOf(s.pos - l);
	return u % c.width == 0 ? -1 : l + c.map[u - 1];
}
function GS(e, t, n) {
	let r = t.clientX - e.startX;
	return Math.max(n, e.startWidth + r);
}
function KS(e, t) {
	e.dispatch(e.state.tr.setMeta(IS, { setHandle: t }));
}
function qS(e, t, n) {
	let r = e.state.doc.resolve(t), i = r.node(-1), a = hx.get(i), o = r.start(-1), s = a.colCount(r.pos - o) + r.nodeAfter.attrs.colspan - 1, c = e.state.tr;
	for (let e = 0; e < a.height; e++) {
		let t = e * a.width + s;
		if (e && a.map[t] == a.map[t - a.width]) continue;
		let r = a.map[t], l = i.nodeAt(r).attrs, u = l.colspan == 1 ? 0 : s - a.colCount(r);
		if (l.colwidth && l.colwidth[u] == n) continue;
		let d = l.colwidth ? l.colwidth.slice() : YS(l.colspan);
		d[u] = n, c.setNodeMarkup(o + r, null, {
			...l,
			colwidth: d
		});
	}
	c.docChanged && e.dispatch(c);
}
function JS(e, t, n, r) {
	let i = e.state.doc.resolve(t), a = i.node(-1), o = i.start(-1), s = hx.get(a).colCount(i.pos - o) + i.nodeAfter.attrs.colspan - 1, c = e.domAtPos(i.start(-1)).node;
	for (; c && c.nodeName != "TABLE";) c = c.parentNode;
	c && FS(a, c.firstChild, c, r, s, n);
}
function YS(e) {
	return Array(e).fill(0);
}
function XS(e, t) {
	let n = [], r = e.doc.resolve(t), i = r.node(-1);
	if (!i) return bf.empty;
	let a = hx.get(i), o = r.start(-1), s = a.colCount(r.pos - o) + r.nodeAfter.attrs.colspan - 1;
	for (let t = 0; t < a.height; t++) {
		let r = s + t * a.width;
		if ((s == a.width - 1 || a.map[r] != a.map[r + 1]) && (t == 0 || a.map[r] != a.map[r - a.width])) {
			let t = a.map[r], s = o + t + i.nodeAt(t).nodeSize - 1, c = document.createElement("div");
			c.className = "column-resize-handle", IS.getState(e)?.dragging && n.push(_f.node(o + t, o + t + i.nodeAt(t).nodeSize, { class: "column-resize-dragging" })), n.push(_f.widget(s, c));
		}
	}
	return bf.create(e.doc, n);
}
function ZS({ allowTableNodeSelection: e = !1 } = {}) {
	return new Vc({
		key: xx,
		state: {
			init() {
				return null;
			},
			apply(e, t) {
				let n = e.getMeta(xx);
				if (n != null) return n == -1 ? null : n;
				if (t == null || !e.docChanged) return t;
				let { deleted: r, pos: i } = e.mapping.mapResult(t);
				return r ? null : i;
			}
		},
		props: {
			decorations: Ix,
			handleDOMEvents: { mousedown: AS },
			createSelectionBetween(e) {
				return xx.getState(e.state) == null ? null : e.state.selection;
			},
			handleTripleClick: OS,
			handleKeyDown: wS,
			handlePaste: kS
		},
		appendTransaction(t, n, r) {
			return zx(r, Hx(r, n), e);
		}
	});
}
//#endregion
//#region node_modules/@tiptap/extension-table/dist/index.js
function QS(e, t) {
	return t ? ["width", `${Math.max(t, e)}px`] : ["min-width", `${e}px`];
}
function $S(e, t, n, r, i, a) {
	var o;
	let s = 0, c = !0, l = t.firstChild, u = e.firstChild;
	if (u !== null) for (let e = 0, n = 0; e < u.childCount; e += 1) {
		let { colspan: o, colwidth: d } = u.child(e).attrs;
		for (let e = 0; e < o; e += 1, n += 1) {
			let o = i === n ? a : d && d[e], u = o ? `${o}px` : "";
			if (s += o || r, o || (c = !1), l) {
				if (l.style.width !== u) {
					let [e, t] = QS(r, o);
					l.style.setProperty(e, t);
				}
				l = l.nextSibling;
			} else {
				let e = document.createElement("col"), [n, i] = QS(r, o);
				e.style.setProperty(n, i), t.appendChild(e);
			}
		}
	}
	for (; l;) {
		let e = l.nextSibling;
		(o = l.parentNode) == null || o.removeChild(l), l = e;
	}
	c ? (n.style.width = `${s}px`, n.style.minWidth = "") : (n.style.width = "", n.style.minWidth = `${s}px`);
}
var eC = class {
	constructor(e, t) {
		this.node = e, this.cellMinWidth = t, this.dom = document.createElement("div"), this.dom.className = "tableWrapper", this.table = this.dom.appendChild(document.createElement("table")), this.colgroup = this.table.appendChild(document.createElement("colgroup")), $S(e, this.colgroup, this.table, t), this.contentDOM = this.table.appendChild(document.createElement("tbody"));
	}
	update(e) {
		return e.type === this.node.type ? (this.node = e, $S(e, this.colgroup, this.table, this.cellMinWidth), !0) : !1;
	}
	ignoreMutation(e) {
		return e.type === "attributes" && (e.target === this.table || this.colgroup.contains(e.target));
	}
};
function tC(e, t, n, r) {
	let i = 0, a = !0, o = [], s = e.firstChild;
	if (!s) return {};
	for (let e = 0, c = 0; e < s.childCount; e += 1) {
		let { colspan: l, colwidth: u } = s.child(e).attrs;
		for (let e = 0; e < l; e += 1, c += 1) {
			let s = n === c ? r : u && u[e];
			i += s || t, s || (a = !1);
			let [l, d] = QS(t, s);
			o.push(["col", { style: `${l}: ${d}` }]);
		}
	}
	let c = a ? `${i}px` : "", l = a ? "" : `${i}px`;
	return {
		colgroup: [
			"colgroup",
			{},
			...o
		],
		tableWidth: c,
		tableMinWidth: l
	};
}
function nC(e, t) {
	return t ? e.createChecked(null, t) : e.createAndFill();
}
function rC(e) {
	if (e.cached.tableNodeTypes) return e.cached.tableNodeTypes;
	let t = {};
	return Object.keys(e.nodes).forEach((n) => {
		let r = e.nodes[n];
		r.spec.tableRole && (t[r.spec.tableRole] = r);
	}), e.cached.tableNodeTypes = t, t;
}
function iC(e, t, n, r, i) {
	let a = rC(e), o = [], s = [];
	for (let e = 0; e < n; e += 1) {
		let e = nC(a.cell, i);
		if (e && s.push(e), r) {
			let e = nC(a.header_cell, i);
			e && o.push(e);
		}
	}
	let c = [];
	for (let e = 0; e < t; e += 1) c.push(a.row.createChecked(null, r && e === 0 ? o : s));
	return a.table.createChecked(null, c);
}
function aC(e) {
	return e instanceof Px;
}
var oC = ({ editor: e }) => {
	let { selection: t } = e.state;
	if (!aC(t)) return !1;
	let n = 0;
	return ug(t.ranges[0].$from, (e) => e.type.name === "table")?.node.descendants((e) => {
		if (e.type.name === "table") return !1;
		["tableCell", "tableHeader"].includes(e.type.name) && (n += 1);
	}), n === t.ranges.length ? (e.commands.deleteTable(), !0) : !1;
}, sC = e_.create({
	name: "table",
	addOptions() {
		return {
			HTMLAttributes: {},
			resizable: !1,
			renderWrapper: !1,
			handleWidth: 5,
			cellMinWidth: 25,
			View: eC,
			lastColumnResizable: !0,
			allowTableNodeSelection: !1
		};
	},
	content: "tableRow+",
	tableRole: "table",
	isolating: !0,
	group: "block",
	parseHTML() {
		return [{ tag: "table" }];
	},
	renderHTML({ node: e, HTMLAttributes: t }) {
		let { colgroup: n, tableWidth: r, tableMinWidth: i } = tC(e, this.options.cellMinWidth), a = [
			"table",
			vm(this.options.HTMLAttributes, t, { style: r ? `width: ${r}` : `min-width: ${i}` }),
			n,
			["tbody", 0]
		];
		return this.options.renderWrapper ? [
			"div",
			{ class: "tableWrapper" },
			a
		] : a;
	},
	addCommands() {
		return {
			insertTable: ({ rows: e = 3, cols: t = 3, withHeaderRow: n = !0 } = {}) => ({ tr: r, dispatch: i, editor: a }) => {
				let o = iC(a.schema, e, t, n);
				if (i) {
					let e = r.selection.from + 1;
					r.replaceSelectionWith(o).scrollIntoView().setSelection(V.near(r.doc.resolve(e)));
				}
				return !0;
			},
			addColumnBefore: () => ({ state: e, dispatch: t }) => Kx(e, t),
			addColumnAfter: () => ({ state: e, dispatch: t }) => qx(e, t),
			deleteColumn: () => ({ state: e, dispatch: t }) => Yx(e, t),
			addRowBefore: () => ({ state: e, dispatch: t }) => Qx(e, t),
			addRowAfter: () => ({ state: e, dispatch: t }) => $x(e, t),
			deleteRow: () => ({ state: e, dispatch: t }) => tS(e, t),
			deleteTable: () => ({ state: e, dispatch: t }) => mS(e, t),
			mergeCells: () => ({ state: e, dispatch: t }) => iS(e, t),
			splitCell: () => ({ state: e, dispatch: t }) => aS(e, t),
			toggleHeaderColumn: () => ({ state: e, dispatch: t }) => uS("column")(e, t),
			toggleHeaderRow: () => ({ state: e, dispatch: t }) => uS("row")(e, t),
			toggleHeaderCell: () => ({ state: e, dispatch: t }) => dS(e, t),
			mergeOrSplit: () => ({ state: e, dispatch: t }) => iS(e, t) ? !0 : aS(e, t),
			setCellAttribute: (e, t) => ({ state: n, dispatch: r }) => sS(e, t)(n, r),
			goToNextCell: () => ({ state: e, dispatch: t }) => pS(1)(e, t),
			goToPreviousCell: () => ({ state: e, dispatch: t }) => pS(-1)(e, t),
			fixTables: () => ({ state: e, dispatch: t }) => (t && Hx(e), !0),
			setCellSelection: (e) => ({ tr: t, dispatch: n }) => {
				if (n) {
					let n = Px.create(t.doc, e.anchorCell, e.headCell);
					t.setSelection(n);
				}
				return !0;
			}
		};
	},
	addKeyboardShortcuts() {
		return {
			Tab: () => this.editor.commands.goToNextCell() ? !0 : this.editor.can().addRowAfter() ? this.editor.chain().addRowAfter().goToNextCell().run() : !1,
			"Shift-Tab": () => this.editor.commands.goToPreviousCell(),
			Backspace: oC,
			"Mod-Backspace": oC,
			Delete: oC,
			"Mod-Delete": oC
		};
	},
	addProseMirrorPlugins() {
		return [...this.options.resizable && this.editor.isEditable ? [LS({
			handleWidth: this.options.handleWidth,
			cellMinWidth: this.options.cellMinWidth,
			defaultCellMinWidth: this.options.cellMinWidth,
			View: this.options.View,
			lastColumnResizable: this.options.lastColumnResizable
		})] : [], ZS({ allowTableNodeSelection: this.options.allowTableNodeSelection })];
	},
	extendNodeSchema(e) {
		return { tableRole: Z(X(e, "tableRole", {
			name: e.name,
			options: e.options,
			storage: e.storage
		})) };
	}
}), cC = e_.create({
	name: "tableRow",
	addOptions() {
		return { HTMLAttributes: {} };
	},
	content: "(tableCell | tableHeader)*",
	tableRole: "row",
	parseHTML() {
		return [{ tag: "tr" }];
	},
	renderHTML({ HTMLAttributes: e }) {
		return [
			"tr",
			vm(this.options.HTMLAttributes, e),
			0
		];
	}
}), lC = e_.create({
	name: "tableHeader",
	addOptions() {
		return { HTMLAttributes: {} };
	},
	content: "block+",
	addAttributes() {
		return {
			colspan: { default: 1 },
			rowspan: { default: 1 },
			colwidth: {
				default: null,
				parseHTML: (e) => {
					let t = e.getAttribute("colwidth");
					return t ? t.split(",").map((e) => parseInt(e, 10)) : null;
				}
			}
		};
	},
	tableRole: "header_cell",
	isolating: !0,
	parseHTML() {
		return [{ tag: "th" }];
	},
	renderHTML({ HTMLAttributes: e }) {
		return [
			"th",
			vm(this.options.HTMLAttributes, e),
			0
		];
	}
}), uC = e_.create({
	name: "tableCell",
	addOptions() {
		return { HTMLAttributes: {} };
	},
	content: "block+",
	addAttributes() {
		return {
			colspan: { default: 1 },
			rowspan: { default: 1 },
			colwidth: {
				default: null,
				parseHTML: (e) => {
					let t = e.getAttribute("colwidth");
					return t ? t.split(",").map((e) => parseInt(e, 10)) : null;
				}
			}
		};
	},
	tableRole: "cell",
	isolating: !0,
	parseHTML() {
		return [{ tag: "td" }];
	},
	renderHTML({ HTMLAttributes: e }) {
		return [
			"td",
			vm(this.options.HTMLAttributes, e),
			0
		];
	}
}), dC = [
	"paragraph",
	"heading",
	"blockquote",
	"table",
	"tableRow",
	"tableHeader",
	"tableCell",
	"div"
], fC = Jm.create({
	name: "classAttribute",
	addGlobalAttributes() {
		return [{
			types: dC,
			attributes: { class: {
				default: null,
				parseHTML: (e) => e.getAttribute("class") || null,
				renderHTML: (e) => e.class ? { class: e.class } : {}
			} }
		}];
	}
}), pC = e_.create({
	name: "div",
	group: "block",
	content: "block+",
	defining: !0,
	parseHTML() {
		return [{ tag: "div[class]" }];
	},
	renderHTML({ HTMLAttributes: e }) {
		return [
			"div",
			vm(e),
			0
		];
	}
}), mC = [
	sC.extend({
		renderHTML({ HTMLAttributes: e }) {
			return [
				"table",
				vm(this.options.HTMLAttributes, e),
				["tbody", 0]
			];
		},
		addNodeView() {
			return ({ node: e }) => {
				let t = document.createElement("div");
				t.className = "rte-table-scroll";
				let n = t.appendChild(document.createElement("table")), r = n.appendChild(document.createElement("tbody")), i = (e) => {
					typeof e == "string" && e ? n.className = e : n.removeAttribute("class");
				};
				return i(e.attrs.class), {
					dom: t,
					contentDOM: r,
					update: (t) => t.type === e.type ? (i(t.attrs.class), !0) : !1,
					ignoreMutation: (e) => e.type === "attributes" && (e.target === t || e.target === n)
				};
			};
		}
	}).configure({ resizable: !1 }),
	cC,
	lC,
	uC,
	pC,
	fC
];
function hC(e) {
	return e.tagName === "TR" && e.children.length > 0 && Array.from(e.children).every((e) => e.tagName === "TH");
}
function gC(e) {
	if (!e.includes("<table") || typeof DOMParser > "u") return e;
	let t = new DOMParser().parseFromString(e, "text/html");
	return t.body.querySelectorAll("table").forEach((e) => {
		let n = Array.from(e.children);
		n.filter((e) => e.tagName === "COLGROUP").forEach((e) => e.remove());
		let r = n.find((e) => e.tagName === "TBODY");
		if (r && !n.some((e) => e.tagName === "THEAD")) {
			let n = Array.from(r.children), i = n.findIndex((e) => !hC(e));
			if (i > 0) {
				let a = t.createElement("thead");
				n.slice(0, i).forEach((e) => a.appendChild(e)), e.insertBefore(a, r);
			}
		}
		e.querySelectorAll("th, td").forEach((e) => {
			e.getAttribute("colspan") === "1" && e.removeAttribute("colspan"), e.getAttribute("rowspan") === "1" && e.removeAttribute("rowspan");
			let t = e.firstElementChild, n = Array.from(e.childNodes).some((e) => e.nodeType === 3 && (e.textContent || "").trim() !== "");
			e.childElementCount === 1 && t?.tagName === "P" && t.attributes.length === 0 && !n && e.replaceChildren(...Array.from(t.childNodes));
		});
	}), t.body.innerHTML;
}
//#endregion
//#region src/fields/RichText.tsx
function _C({ value: e, onChange: t }) {
	let n = D_({
		extensions: [
			Qv.configure({}),
			fx.configure({
				openOnClick: !1,
				autolink: !0,
				HTMLAttributes: {
					target: null,
					rel: null
				}
			}),
			...mC
		],
		content: e || "",
		onUpdate: ({ editor: e }) => t(gC(e.getHTML())),
		editorProps: { attributes: { class: "vedit-tiptap-content" } }
	});
	return (0, _.useEffect)(() => {
		if (!n) return;
		let t = gC(n.getHTML());
		(e || "") !== t && n.commands.setContent(e || "", !1);
	}, [n, e]), n ? /* @__PURE__ */ (0, N.jsxs)("div", {
		className: "vedit-tiptap",
		children: [/* @__PURE__ */ (0, N.jsx)(vC, { editor: n }), /* @__PURE__ */ (0, N.jsx)(m_, { editor: n })]
	}) : /* @__PURE__ */ (0, N.jsx)("div", {
		className: "vedit-tiptap-loading",
		children: "Loading editor…"
	});
}
function vC({ editor: e }) {
	let t = (e) => {
		try {
			return e();
		} catch {
			return !1;
		}
	};
	return /* @__PURE__ */ (0, N.jsxs)("div", {
		className: "vedit-tiptap-toolbar",
		children: [
			/* @__PURE__ */ (0, N.jsx)(bC, {
				active: e.isActive("bold"),
				onClick: () => e.chain().focus().toggleBold().run(),
				label: "B",
				title: "Bold",
				bold: !0
			}),
			/* @__PURE__ */ (0, N.jsx)(bC, {
				active: e.isActive("italic"),
				onClick: () => e.chain().focus().toggleItalic().run(),
				label: "i",
				title: "Italic",
				italic: !0
			}),
			/* @__PURE__ */ (0, N.jsx)(bC, {
				active: e.isActive("strike"),
				onClick: () => e.chain().focus().toggleStrike().run(),
				label: "S",
				title: "Strike"
			}),
			/* @__PURE__ */ (0, N.jsx)(bC, {
				active: e.isActive("code"),
				onClick: () => e.chain().focus().toggleCode().run(),
				label: "</>",
				title: "Inline code"
			}),
			/* @__PURE__ */ (0, N.jsx)(xC, {}),
			/* @__PURE__ */ (0, N.jsx)(bC, {
				active: e.isActive("heading", { level: 2 }),
				onClick: () => e.chain().focus().toggleHeading({ level: 2 }).run(),
				label: "H2",
				title: "Heading 2"
			}),
			/* @__PURE__ */ (0, N.jsx)(bC, {
				active: e.isActive("heading", { level: 3 }),
				onClick: () => e.chain().focus().toggleHeading({ level: 3 }).run(),
				label: "H3",
				title: "Heading 3"
			}),
			/* @__PURE__ */ (0, N.jsx)(bC, {
				active: e.isActive("paragraph"),
				onClick: () => e.chain().focus().setParagraph().run(),
				label: "P",
				title: "Paragraph"
			}),
			/* @__PURE__ */ (0, N.jsx)(xC, {}),
			/* @__PURE__ */ (0, N.jsx)(bC, {
				active: e.isActive("bulletList"),
				onClick: () => e.chain().focus().toggleBulletList().run(),
				label: "•",
				title: "Bullet list"
			}),
			/* @__PURE__ */ (0, N.jsx)(bC, {
				active: e.isActive("orderedList"),
				onClick: () => e.chain().focus().toggleOrderedList().run(),
				label: "1.",
				title: "Ordered list"
			}),
			/* @__PURE__ */ (0, N.jsx)(bC, {
				active: e.isActive("blockquote"),
				onClick: () => e.chain().focus().toggleBlockquote().run(),
				label: "❝",
				title: "Blockquote"
			}),
			/* @__PURE__ */ (0, N.jsx)(bC, {
				active: e.isActive("codeBlock"),
				onClick: () => e.chain().focus().toggleCodeBlock().run(),
				label: "{}",
				title: "Code block"
			}),
			/* @__PURE__ */ (0, N.jsx)(xC, {}),
			/* @__PURE__ */ (0, N.jsx)(bC, {
				active: e.isActive("link"),
				onClick: () => {
					let t = e.getAttributes("link").href, n = window.prompt("Link URL", t || "https://");
					if (n !== null) {
						if (n === "") {
							e.chain().focus().unsetLink().run();
							return;
						}
						e.chain().focus().extendMarkRange("link").setLink({ href: n }).run();
					}
				},
				label: "🔗",
				title: "Link"
			}),
			/* @__PURE__ */ (0, N.jsx)(bC, {
				onClick: () => e.chain().focus().setHorizontalRule().run(),
				label: "―",
				title: "Horizontal rule"
			}),
			/* @__PURE__ */ (0, N.jsx)(xC, {}),
			/* @__PURE__ */ (0, N.jsx)(yC, { editor: e }),
			/* @__PURE__ */ (0, N.jsx)(xC, {}),
			/* @__PURE__ */ (0, N.jsx)(bC, {
				onClick: () => e.chain().focus().undo().run(),
				label: "↶",
				title: "Undo",
				disabled: !t(() => e.can().undo())
			}),
			/* @__PURE__ */ (0, N.jsx)(bC, {
				onClick: () => e.chain().focus().redo().run(),
				label: "↷",
				title: "Redo",
				disabled: !t(() => e.can().redo())
			})
		]
	});
}
function yC({ editor: e }) {
	let t = e.isActive("table");
	return /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)(bC, {
		active: t,
		disabled: t,
		onClick: () => e.chain().focus().insertTable({
			rows: 3,
			cols: 3,
			withHeaderRow: !0
		}).run(),
		label: "▦",
		title: "Insert table (3×3)"
	}), t && /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [
		/* @__PURE__ */ (0, N.jsx)(bC, {
			onClick: () => e.chain().focus().addRowAfter().run(),
			label: "+R",
			title: "Add row below"
		}),
		/* @__PURE__ */ (0, N.jsx)(bC, {
			onClick: () => e.chain().focus().deleteRow().run(),
			label: "−R",
			title: "Delete row"
		}),
		/* @__PURE__ */ (0, N.jsx)(bC, {
			onClick: () => e.chain().focus().addColumnAfter().run(),
			label: "+C",
			title: "Add column right"
		}),
		/* @__PURE__ */ (0, N.jsx)(bC, {
			onClick: () => e.chain().focus().deleteColumn().run(),
			label: "−C",
			title: "Delete column"
		}),
		/* @__PURE__ */ (0, N.jsx)(bC, {
			active: e.isActive("tableHeader"),
			onClick: () => e.chain().focus().toggleHeaderRow().run(),
			label: "TH",
			title: "Toggle header row"
		}),
		/* @__PURE__ */ (0, N.jsx)(bC, {
			onClick: () => e.chain().focus().deleteTable().run(),
			label: "✕▦",
			title: "Delete table"
		})
	] })] });
}
function bC({ active: e, onClick: t, label: n, title: r, bold: i, italic: a, disabled: o }) {
	return /* @__PURE__ */ (0, N.jsx)("button", {
		type: "button",
		className: "vedit-tiptap-btn",
		"data-active": e ? "true" : "false",
		onMouseDown: (e) => e.preventDefault(),
		onClick: t,
		title: r,
		disabled: o,
		style: {
			fontWeight: i ? 700 : void 0,
			fontStyle: a ? "italic" : void 0
		},
		children: n
	});
}
function xC() {
	return /* @__PURE__ */ (0, N.jsx)("span", {
		className: "vedit-tiptap-sep",
		"aria-hidden": "true"
	});
}
//#endregion
//#region src/fields/FieldInput.tsx
function SC({ fields: e, values: t, onFieldChange: n, ctx: r, path: i }) {
	return /* @__PURE__ */ (0, N.jsx)("div", {
		className: "vedit-fields",
		children: e.map((e) => /* @__PURE__ */ (0, N.jsx)("div", {
			className: "vedit-field",
			style: Mi(ji(e)),
			"data-full": ji(e) === 100 || void 0,
			children: /* @__PURE__ */ (0, N.jsx)(CC, {
				field: e,
				value: t[e.name],
				onChange: (t) => n(e.name, t),
				ctx: r,
				path: `${i}.${e.name}`
			})
		}, e.name))
	});
}
function CC({ field: e, value: t, onChange: n, ctx: r, path: i }) {
	let a = `vedit-${i.replace(/[^\w-]+/g, "-")}`, o = Ai(e), s = e.hint || e.description, c = (e.type || "").toLowerCase();
	return /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [
		[
			"object",
			"group",
			"array",
			"repeater",
			"link",
			"radio",
			"checkbox",
			"gallery"
		].includes(c) ? /* @__PURE__ */ (0, N.jsxs)("span", {
			className: "vedit-field-label",
			children: [o, e.required && /* @__PURE__ */ (0, N.jsx)("span", {
				className: "vedit-required",
				"aria-hidden": "true",
				children: "*"
			})]
		}) : /* @__PURE__ */ (0, N.jsxs)("label", {
			htmlFor: a,
			className: "vedit-field-label",
			children: [o, e.required && /* @__PURE__ */ (0, N.jsx)("span", {
				className: "vedit-required",
				"aria-hidden": "true",
				children: "*"
			})]
		}),
		s && /* @__PURE__ */ (0, N.jsx)("p", {
			className: "vedit-field-hint",
			children: s
		}),
		/* @__PURE__ */ (0, N.jsx)(wC, {
			id: a,
			field: e,
			value: t,
			onChange: n,
			ctx: r,
			path: i
		})
	] });
}
function wC({ id: e, field: t, value: n, onChange: r, ctx: i, path: a }) {
	let o = (t.type || "").toLowerCase(), s = typeof n == "string" ? n : typeof n == "number" ? String(n) : "", c = t.placeholder || "";
	switch (o) {
		case "string":
		case "text":
		case "url":
		case "email": return /* @__PURE__ */ (0, N.jsx)(TC, {
			prepend: t.prepend,
			append: t.append,
			children: /* @__PURE__ */ (0, N.jsx)("input", {
				id: e,
				type: o === "url" ? "url" : o === "email" ? "email" : "text",
				className: "vedit-input",
				value: s,
				placeholder: c || (o === "url" ? "https://" : o === "email" ? "name@example.com" : ""),
				maxLength: t.max_length || void 0,
				onChange: (e) => r(e.target.value)
			})
		});
		case "textarea":
		case "text-multiline": return /* @__PURE__ */ (0, N.jsx)("textarea", {
			id: e,
			className: "vedit-input vedit-textarea",
			rows: t.rows || 4,
			value: s,
			placeholder: c,
			maxLength: t.max_length || void 0,
			onChange: (e) => r(e.target.value)
		});
		case "richtext":
		case "wysiwyg": return /* @__PURE__ */ (0, N.jsx)(_C, {
			value: s,
			onChange: r
		});
		case "number":
		case "integer": {
			let i = typeof n == "number" ? n : typeof n == "string" && n !== "" ? Number(n) : null;
			return /* @__PURE__ */ (0, N.jsx)(TC, {
				prepend: t.prepend,
				append: t.append,
				children: /* @__PURE__ */ (0, N.jsx)("input", {
					id: e,
					type: "number",
					className: "vedit-input",
					value: i ?? "",
					min: t.min,
					max: t.max,
					step: t.step ?? (o === "integer" ? 1 : "any"),
					placeholder: c || "0",
					onChange: (e) => r(e.target.value === "" ? null : Number(e.target.value))
				})
			});
		}
		case "range": {
			let i = t.min ?? 0, a = t.max ?? 100, o = typeof n == "number" ? n : typeof n == "string" && n !== "" ? Number(n) : i;
			return /* @__PURE__ */ (0, N.jsxs)("div", {
				className: "vedit-range",
				children: [/* @__PURE__ */ (0, N.jsx)("input", {
					id: e,
					type: "range",
					min: i,
					max: a,
					step: t.step ?? 1,
					value: o,
					onChange: (e) => r(Number(e.target.value))
				}), /* @__PURE__ */ (0, N.jsx)("span", {
					className: "vedit-range-value",
					children: o
				})]
			});
		}
		case "boolean":
		case "toggle": return /* @__PURE__ */ (0, N.jsxs)("div", {
			className: "vedit-switch-row",
			children: [/* @__PURE__ */ (0, N.jsx)(Di, {
				id: e,
				checked: n === !0,
				onChange: r,
				label: Ai(t)
			}), /* @__PURE__ */ (0, N.jsx)("span", { children: n === !0 ? "Yes" : "No" })]
		});
		case "select": {
			let n = DC(t.options), i = n.some((e) => e.value === s);
			return /* @__PURE__ */ (0, N.jsxs)("select", {
				id: e,
				className: "vedit-input vedit-select",
				value: s,
				onChange: (e) => r(e.target.value),
				children: [
					/* @__PURE__ */ (0, N.jsx)("option", {
						value: "",
						children: c || `Select ${Ai(t).toLowerCase()}`
					}),
					n.map((e) => /* @__PURE__ */ (0, N.jsx)("option", {
						value: e.value,
						children: e.label
					}, e.value)),
					s && !i && /* @__PURE__ */ (0, N.jsxs)("option", {
						value: s,
						children: [s, " (not in list)"]
					})
				]
			});
		}
		case "radio": {
			let n = DC(t.options);
			return /* @__PURE__ */ (0, N.jsx)("div", {
				className: "vedit-choice-list",
				role: "radiogroup",
				"aria-label": Ai(t),
				children: n.map((t) => /* @__PURE__ */ (0, N.jsxs)("label", {
					className: "vedit-choice",
					children: [/* @__PURE__ */ (0, N.jsx)("input", {
						type: "radio",
						name: e,
						value: t.value,
						checked: s === t.value,
						onChange: () => r(t.value)
					}), /* @__PURE__ */ (0, N.jsx)("span", { children: t.label })]
				}, t.value))
			});
		}
		case "checkbox": {
			let e = DC(t.options), i = Array.isArray(n) ? n : [];
			return /* @__PURE__ */ (0, N.jsx)("div", {
				className: "vedit-choice-list",
				children: e.map((e) => /* @__PURE__ */ (0, N.jsxs)("label", {
					className: "vedit-choice",
					children: [/* @__PURE__ */ (0, N.jsx)("input", {
						type: "checkbox",
						checked: i.includes(e.value),
						onChange: () => r(i.includes(e.value) ? i.filter((t) => t !== e.value) : [...i, e.value])
					}), /* @__PURE__ */ (0, N.jsx)("span", { children: e.label })]
				}, e.value))
			});
		}
		case "color": return /* @__PURE__ */ (0, N.jsxs)("div", {
			className: "vedit-color",
			children: [/* @__PURE__ */ (0, N.jsx)("input", {
				type: "color",
				className: "vedit-color-picker",
				value: /^#[0-9a-f]{6}$/i.test(s) ? s : "#000000",
				onChange: (e) => r(e.target.value),
				"aria-label": `${Ai(t)} picker`
			}), /* @__PURE__ */ (0, N.jsx)("input", {
				id: e,
				type: "text",
				className: "vedit-input vedit-mono",
				value: s,
				placeholder: "#000000",
				onChange: (e) => r(e.target.value)
			})]
		});
		case "date": return /* @__PURE__ */ (0, N.jsx)("input", {
			id: e,
			type: "date",
			className: "vedit-input",
			value: s,
			onChange: (e) => r(e.target.value)
		});
		case "emoji": return /* @__PURE__ */ (0, N.jsx)(Ma, {
			id: e,
			value: s,
			onChange: r,
			placeholder: c
		});
		case "icon": return /* @__PURE__ */ (0, N.jsx)(Yi, {
			value: s,
			onChange: r,
			providers: Array.isArray(t.providers) ? t.providers : void 0,
			label: Ai(t)
		});
		case "image":
		case "media": return /* @__PURE__ */ (0, N.jsx)(La, {
			value: n,
			onChange: r
		});
		case "gallery": return /* @__PURE__ */ (0, N.jsx)(za, {
			value: n,
			onChange: r
		});
		case "file": return /* @__PURE__ */ (0, N.jsx)(Ra, {
			value: n,
			onChange: r
		});
		case "link": return /* @__PURE__ */ (0, N.jsx)(va, {
			value: n,
			onChange: r,
			id: e,
			label: Ai(t)
		});
		case "reference":
		case "node": return /* @__PURE__ */ (0, N.jsx)(ca, {
			field: t,
			value: n,
			onChange: r
		});
		case "term": return /* @__PURE__ */ (0, N.jsx)(ua, {
			field: t,
			value: n,
			onChange: r,
			defaultNodeType: i.nodeType
		});
		case "form_selector": return /* @__PURE__ */ (0, N.jsx)(Pa, {
			value: n,
			onChange: r,
			id: e
		});
		case "object":
		case "group": return /* @__PURE__ */ (0, N.jsx)(F, {
			field: t,
			value: n,
			onChange: r,
			ctx: i,
			path: a
		});
		case "array":
		case "repeater": return /* @__PURE__ */ (0, N.jsx)(Vi, {
			field: t,
			value: n,
			onChange: r,
			ctx: i,
			path: a
		});
		default: return /* @__PURE__ */ (0, N.jsx)(EC, {
			id: e,
			type: t.type,
			value: n,
			onChange: r
		});
	}
}
function TC({ prepend: e, append: t, children: n }) {
	return !e && !t ? /* @__PURE__ */ (0, N.jsx)(N.Fragment, { children: n }) : /* @__PURE__ */ (0, N.jsxs)("div", {
		className: "vedit-input-group",
		children: [
			e && /* @__PURE__ */ (0, N.jsx)("span", {
				className: "vedit-addon",
				children: e
			}),
			n,
			t && /* @__PURE__ */ (0, N.jsx)("span", {
				className: "vedit-addon",
				children: t
			})
		]
	});
}
function EC({ id: e, type: t, value: n, onChange: r }) {
	let [i, a] = _.useState(() => n === void 0 ? "" : JSON.stringify(n, null, 2)), [o, s] = _.useState(!1);
	return /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)("textarea", {
		id: e,
		className: "vedit-input vedit-textarea vedit-mono",
		rows: 4,
		value: i,
		"aria-invalid": o || void 0,
		onChange: (e) => {
			a(e.target.value);
			try {
				r(e.target.value.trim() === "" ? null : JSON.parse(e.target.value)), s(!1);
			} catch {
				s(!0);
			}
		}
	}), /* @__PURE__ */ (0, N.jsx)("p", {
		className: "vedit-field-hint",
		children: o ? "Not valid JSON yet — changes apply once it parses." : `“${t}” fields are edited as JSON here. Use the admin for a full editor.`
	})] });
}
function DC(e) {
	return e ? e.map((e) => typeof e == "string" ? {
		value: e,
		label: e
	} : {
		value: e.value,
		label: e.label
	}) : [];
}
//#endregion
//#region src/BlockCard.tsx
function OC(e) {
	let t = (e ?? "").trim();
	return !t || t === "square" ? null : /^[a-z0-9-]+$/i.test(t) ? `lucide:${t.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}` : /^[a-z0-9_-]+:[a-z0-9_-]+$/i.test(t) ? t : null;
}
function kC({ icon: e, icons: t }) {
	let n = OC(e), r = n ? t.get(n) : null, i = (e ?? "").trim();
	return /* @__PURE__ */ (0, N.jsx)("span", {
		className: "vedit-block-icon",
		"aria-hidden": "true",
		children: r ? /* @__PURE__ */ (0, N.jsx)(_i, { svg: r.svg }) : i && i !== "square" && !n ? /* @__PURE__ */ (0, N.jsx)("span", {
			className: "vedit-block-emoji",
			children: i
		}) : /* @__PURE__ */ (0, N.jsx)(P, {
			name: "square",
			size: 15,
			strokeWidth: 1.8
		})
	});
}
function AC({ block: e, index: t, total: n, blockType: r, icons: i, open: a, renderError: o, ctx: s, onToggle: c, onMove: l, onDuplicate: u, onDelete: d, onFieldChange: f, cardRef: p }) {
	let { attributes: m, listeners: h, setNodeRef: g, setActivatorNodeRef: v, transform: y, transition: b, isDragging: x } = Br({ id: e.__cid }), S = r ? Jr(r) : [], C = r ? qr(r) : e.type, w = a ? "" : Fi(S, e.fields), [ee, te] = (0, _.useState)(!1), [ne, T] = (0, _.useState)(!1);
	return (0, _.useEffect)(() => {
		if (!ee || ne) return;
		let e = window.setTimeout(() => te(!1), 3500);
		return () => window.clearTimeout(e);
	}, [ee, ne]), /* @__PURE__ */ (0, N.jsxs)("div", {
		ref: (e) => {
			g(e), p(e);
		},
		className: "vedit-card",
		"data-state": a ? "open" : "closed",
		"data-dragging": x || void 0,
		style: {
			transform: Ze.Transform.toString(y),
			transition: b
		},
		children: [/* @__PURE__ */ (0, N.jsxs)("div", {
			className: "vedit-card-header",
			onClick: c,
			children: [
				/* @__PURE__ */ (0, N.jsx)("button", {
					type: "button",
					ref: v,
					className: "vedit-grip",
					"aria-label": `Drag to reorder ${C}`,
					title: "Drag to reorder",
					onClick: (e) => e.stopPropagation(),
					...m,
					...h,
					children: /* @__PURE__ */ (0, N.jsx)(P, {
						name: "grip",
						size: 15
					})
				}),
				/* @__PURE__ */ (0, N.jsxs)("button", {
					type: "button",
					className: "vedit-card-toggle",
					"aria-expanded": a,
					onClick: (e) => {
						e.stopPropagation(), c();
					},
					children: [
						/* @__PURE__ */ (0, N.jsx)("span", {
							className: "vedit-index",
							children: t + 1
						}),
						/* @__PURE__ */ (0, N.jsx)(kC, {
							icon: r?.icon,
							icons: i
						}),
						/* @__PURE__ */ (0, N.jsxs)("span", {
							className: "vedit-card-text",
							children: [/* @__PURE__ */ (0, N.jsxs)("span", {
								className: "vedit-card-titlerow",
								children: [
									/* @__PURE__ */ (0, N.jsx)("span", {
										className: "vedit-card-title",
										children: C
									}),
									e.__isNew && /* @__PURE__ */ (0, N.jsx)("span", {
										className: "vedit-badge",
										"data-tone": "accent",
										children: "New"
									}),
									o && /* @__PURE__ */ (0, N.jsx)("span", {
										className: "vedit-badge",
										"data-tone": "danger",
										children: "Error"
									})
								]
							}), w && /* @__PURE__ */ (0, N.jsx)("span", {
								className: "vedit-card-summary",
								children: w
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, N.jsxs)("span", {
					className: "vedit-card-actions",
					onClick: (e) => e.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, N.jsx)("button", {
							type: "button",
							className: "vedit-icon-btn",
							"data-optional": !0,
							onClick: () => l(-1),
							disabled: t === 0,
							title: "Move up",
							"aria-label": `Move ${C} up`,
							children: /* @__PURE__ */ (0, N.jsx)(P, {
								name: "arrow-up",
								size: 15
							})
						}),
						/* @__PURE__ */ (0, N.jsx)("button", {
							type: "button",
							className: "vedit-icon-btn",
							"data-optional": !0,
							onClick: () => l(1),
							disabled: t === n - 1,
							title: "Move down",
							"aria-label": `Move ${C} down`,
							children: /* @__PURE__ */ (0, N.jsx)(P, {
								name: "arrow-down",
								size: 15
							})
						}),
						/* @__PURE__ */ (0, N.jsx)("button", {
							type: "button",
							className: "vedit-icon-btn",
							onClick: u,
							title: "Duplicate",
							"aria-label": `Duplicate ${C}`,
							children: /* @__PURE__ */ (0, N.jsx)(P, {
								name: "copy",
								size: 15
							})
						}),
						ee ? /* @__PURE__ */ (0, N.jsx)("button", {
							type: "button",
							className: "vedit-confirm-delete",
							onClick: d,
							onPointerEnter: () => T(!0),
							onPointerLeave: () => T(!1),
							autoFocus: !0,
							"aria-label": `Confirm deleting ${C}`,
							children: "Delete?"
						}) : /* @__PURE__ */ (0, N.jsx)("button", {
							type: "button",
							className: "vedit-icon-btn",
							"data-tone": "danger",
							onClick: () => {
								T(!1), te(!0);
							},
							title: "Delete block",
							"aria-label": `Delete ${C}`,
							children: /* @__PURE__ */ (0, N.jsx)(P, {
								name: "trash",
								size: 15
							})
						}),
						/* @__PURE__ */ (0, N.jsx)("span", {
							className: "vedit-card-divider",
							"aria-hidden": "true"
						}),
						/* @__PURE__ */ (0, N.jsx)("button", {
							type: "button",
							className: "vedit-icon-btn",
							onClick: c,
							title: a ? "Collapse" : "Edit",
							"aria-label": a ? `Collapse ${C}` : `Edit ${C}`,
							children: /* @__PURE__ */ (0, N.jsx)(P, {
								name: "chevron-down",
								size: 17,
								className: "vedit-chevron",
								style: { transform: a ? "none" : "rotate(-90deg)" }
							})
						})
					]
				})
			]
		}), a && /* @__PURE__ */ (0, N.jsxs)("div", {
			className: "vedit-card-body",
			children: [o && /* @__PURE__ */ (0, N.jsxs)("div", {
				className: "vedit-alert",
				"data-tone": "danger",
				children: [/* @__PURE__ */ (0, N.jsx)(P, {
					name: "alert",
					size: 15
				}), /* @__PURE__ */ (0, N.jsxs)("span", { children: [
					/* @__PURE__ */ (0, N.jsx)("strong", { children: "This block didn't render." }),
					" ",
					o
				] })]
			}), r ? /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [r.description && /* @__PURE__ */ (0, N.jsxs)("p", {
				className: "vedit-card-description",
				children: [/* @__PURE__ */ (0, N.jsx)(P, {
					name: "info",
					size: 15
				}), /* @__PURE__ */ (0, N.jsx)("span", { children: r.description })]
			}), S.length === 0 ? /* @__PURE__ */ (0, N.jsx)("p", {
				className: "vedit-muted-note",
				children: "This block has no settings."
			}) : /* @__PURE__ */ (0, N.jsx)(SC, {
				fields: S,
				values: e.fields ?? {},
				onFieldChange: f,
				ctx: s,
				path: e.__cid
			})] }) : /* @__PURE__ */ (0, N.jsxs)("p", {
				className: "vedit-muted-note",
				children: [
					"“",
					e.type,
					"” isn't a registered block type, so it can't be edited here. Its saved content is kept as is."
				]
			})]
		})]
	});
}
//#endregion
//#region src/AddBlockDialog.tsx
function jC({ blockTypes: e, icons: t, placement: n, onPick: r, onClose: i }) {
	let [a, o] = (0, _.useState)(""), s = (0, _.useMemo)(() => [...e].sort((e, t) => qr(e).localeCompare(qr(t))), [e]), c = (0, _.useMemo)(() => {
		let e = a.toLowerCase().trim().split(/\s+/).filter(Boolean);
		return e.length === 0 ? s : s.filter((t) => {
			let n = `${qr(t)} ${t.slug} ${t.description ?? ""}`.toLowerCase();
			return e.every((e) => n.includes(e));
		});
	}, [s, a]);
	return /* @__PURE__ */ (0, N.jsxs)(Ti, {
		title: "Add a block",
		subtitle: n,
		size: "lg",
		onClose: i,
		children: [/* @__PURE__ */ (0, N.jsx)(Ei, {
			value: a,
			onChange: o,
			placeholder: "Search blocks…",
			autoFocus: !0,
			onEnter: () => c[0] && r(c[0].slug)
		}), c.length === 0 ? /* @__PURE__ */ (0, N.jsx)("p", {
			className: "vedit-empty",
			children: a ? `No blocks match “${a}”.` : "No block types are registered."
		}) : /* @__PURE__ */ (0, N.jsx)("div", {
			className: "vedit-picker-grid",
			children: c.map((e) => /* @__PURE__ */ (0, N.jsxs)("button", {
				type: "button",
				className: "vedit-picker-tile",
				onClick: () => r(e.slug),
				children: [/* @__PURE__ */ (0, N.jsx)(kC, {
					icon: e.icon,
					icons: t
				}), /* @__PURE__ */ (0, N.jsxs)("span", {
					className: "vedit-picker-text",
					children: [/* @__PURE__ */ (0, N.jsx)("span", {
						className: "vedit-picker-label",
						children: qr(e)
					}), e.description && /* @__PURE__ */ (0, N.jsx)("span", {
						className: "vedit-picker-desc",
						children: e.description
					})]
				})]
			}, e.slug))
		})]
	});
}
//#endregion
//#region src/layoutSettings.ts
function MC(e) {
	let [t, n] = (0, _.useState)(null), [r, i] = (0, _.useState)(null), a = (0, _.useRef)(!1);
	return {
		pages: t,
		error: r,
		load: (0, _.useCallback)(() => {
			a.current || (a.current = !0, di().then((t) => Promise.all(t.map((t) => fi(t.slug, e)))).then((e) => {
				n(e.map(({ page: e, values: t }) => {
					let n = e.fields.map((e) => ({
						...e.config ?? {},
						name: e.name,
						title: e.title,
						type: e.type,
						hint: e.description,
						initialValue: e.initialValue
					})), r = {};
					for (let n of e.fields) r[n.name] = t[n.name]?.value ?? n.initialValue;
					return {
						info: {
							slug: e.slug,
							name: e.name,
							icon: e.icon,
							description: e.description
						},
						fields: n,
						values: r,
						saved: JSON.stringify(r)
					};
				}));
			}).catch((e) => {
				a.current = !1, i(e.message);
			}));
		}, [e]),
		setValue: (0, _.useCallback)((e, t, r) => {
			n((n) => n && n.map((n) => n.info.slug === e ? {
				...n,
				values: {
					...n.values,
					[t]: r
				}
			} : n));
		}, []),
		dirtySlugs: (0, _.useMemo)(() => (t ?? []).filter((e) => JSON.stringify(e.values) !== e.saved).map((e) => e.info.slug), [t]),
		save: (0, _.useCallback)(async () => {
			if (!t) return;
			let r = t.filter((e) => JSON.stringify(e.values) !== e.saved);
			for (let t of r) await pi(t.info.slug, t.values, e);
			n((e) => e && e.map((e) => r.includes(e) ? {
				...e,
				saved: JSON.stringify(e.values)
			} : e));
		}, [t, e])
	};
}
//#endregion
//#region src/PageTabs.tsx
function NC({ meta: e, onChange: t, mediaOk: n, supportsExcerpt: r, focus: i }) {
	let a = (0, _.useRef)(null), o = (0, _.useRef)(null), s = (0, _.useRef)(null);
	return (0, _.useEffect)(() => {
		i && (i.field === "title" ? a.current?.focus() : i.field === "excerpt" ? o.current?.focus() : s.current?.querySelector(".vedit-page-image")?.scrollIntoView({
			block: "nearest",
			behavior: "smooth"
		}));
	}, [i]), /* @__PURE__ */ (0, N.jsx)("div", {
		className: "vedit-card vedit-page-card",
		ref: s,
		children: /* @__PURE__ */ (0, N.jsxs)("div", {
			className: "vedit-card-body vedit-page-body",
			children: [
				/* @__PURE__ */ (0, N.jsxs)("div", {
					className: "vedit-field",
					"data-full": !0,
					children: [/* @__PURE__ */ (0, N.jsx)("label", {
						className: "vedit-field-label",
						htmlFor: "vedit-page-title",
						children: "Title"
					}), /* @__PURE__ */ (0, N.jsx)("input", {
						id: "vedit-page-title",
						ref: a,
						className: "vedit-input",
						value: e.title,
						onChange: (e) => t("title", e.target.value)
					})]
				}),
				r && /* @__PURE__ */ (0, N.jsxs)("div", {
					className: "vedit-field",
					"data-full": !0,
					children: [
						/* @__PURE__ */ (0, N.jsx)("label", {
							className: "vedit-field-label",
							htmlFor: "vedit-page-excerpt",
							children: "Excerpt"
						}),
						/* @__PURE__ */ (0, N.jsx)("p", {
							className: "vedit-field-hint",
							children: "The short intro under the title, also used in listings and search results."
						}),
						/* @__PURE__ */ (0, N.jsx)("textarea", {
							id: "vedit-page-excerpt",
							ref: o,
							className: "vedit-input vedit-textarea",
							rows: 3,
							value: e.excerpt,
							onChange: (e) => t("excerpt", e.target.value)
						})
					]
				}),
				n && /* @__PURE__ */ (0, N.jsxs)("div", {
					className: "vedit-field vedit-page-image",
					"data-full": !0,
					children: [/* @__PURE__ */ (0, N.jsx)("span", {
						className: "vedit-field-label",
						children: "Featured image"
					}), /* @__PURE__ */ (0, N.jsx)(La, {
						value: e.featured_image,
						onChange: (e) => t("featured_image", e),
						openSignal: i?.field === "featured_image" ? i.n : void 0
					})]
				})
			]
		})
	});
}
function PC({ schema: e, values: t, onFieldChange: n, ctx: r, label: i }) {
	return e.length === 0 ? null : /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)("div", {
		className: "vedit-section-head",
		children: /* @__PURE__ */ (0, N.jsxs)("span", {
			className: "vedit-section-title",
			children: [i, " details"]
		})
	}), /* @__PURE__ */ (0, N.jsx)("div", {
		className: "vedit-card vedit-page-card",
		children: /* @__PURE__ */ (0, N.jsx)("div", {
			className: "vedit-card-body vedit-page-body",
			children: /* @__PURE__ */ (0, N.jsx)(SC, {
				fields: e,
				values: t,
				onFieldChange: n,
				ctx: r,
				path: "node"
			})
		})
	})] });
}
function FC({ pages: e, error: t, icons: n, openSlug: r, setOpenSlug: i, dirtySlugs: a, onChange: o, ctx: s }) {
	let c = (0, _.useRef)(/* @__PURE__ */ new Map()), l = e !== null;
	return (0, _.useEffect)(() => {
		if (!r || !l) return;
		let e = c.current.get(r);
		e && requestAnimationFrame(() => e.scrollIntoView({
			block: "start",
			behavior: "smooth"
		}));
	}, [r, l]), t ? /* @__PURE__ */ (0, N.jsxs)("div", {
		className: "vedit-alert",
		"data-tone": "danger",
		children: ["Couldn't load the layout settings: ", t]
	}) : e ? e.length === 0 ? /* @__PURE__ */ (0, N.jsx)("p", {
		className: "vedit-muted-note",
		children: "This theme has no settings."
	}) : /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsxs)("p", {
		className: "vedit-layout-note",
		children: [/* @__PURE__ */ (0, N.jsx)(P, {
			name: "globe",
			size: 15
		}), /* @__PURE__ */ (0, N.jsx)("span", { children: "These are shared by every page on the site. Changes show up everywhere once saved." })]
	}), /* @__PURE__ */ (0, N.jsx)("div", {
		className: "vedit-block-list",
		children: e.map((e) => {
			let t = e.info.slug === r, l = a.includes(e.info.slug);
			return /* @__PURE__ */ (0, N.jsxs)("div", {
				className: "vedit-card",
				"data-state": t ? "open" : "closed",
				ref: (t) => {
					t ? c.current.set(e.info.slug, t) : c.current.delete(e.info.slug);
				},
				children: [/* @__PURE__ */ (0, N.jsxs)("div", {
					className: "vedit-card-header",
					"data-flat": !0,
					onClick: () => i(t ? null : e.info.slug),
					children: [/* @__PURE__ */ (0, N.jsxs)("button", {
						type: "button",
						className: "vedit-card-toggle",
						"aria-expanded": t,
						onClick: (n) => {
							n.stopPropagation(), i(t ? null : e.info.slug);
						},
						children: [/* @__PURE__ */ (0, N.jsx)(kC, {
							icon: e.info.icon,
							icons: n
						}), /* @__PURE__ */ (0, N.jsxs)("span", {
							className: "vedit-card-text",
							children: [/* @__PURE__ */ (0, N.jsxs)("span", {
								className: "vedit-card-titlerow",
								children: [/* @__PURE__ */ (0, N.jsx)("span", {
									className: "vedit-card-title",
									children: e.info.name
								}), l && /* @__PURE__ */ (0, N.jsx)("span", {
									className: "vedit-badge",
									"data-tone": "accent",
									children: "Edited"
								})]
							}), e.info.description && !t && /* @__PURE__ */ (0, N.jsx)("span", {
								className: "vedit-card-summary",
								children: e.info.description
							})]
						})]
					}), /* @__PURE__ */ (0, N.jsx)("span", {
						className: "vedit-card-actions",
						children: /* @__PURE__ */ (0, N.jsx)(P, {
							name: "chevron-down",
							size: 17,
							className: "vedit-chevron",
							style: { transform: t ? "none" : "rotate(-90deg)" }
						})
					})]
				}), t && /* @__PURE__ */ (0, N.jsxs)("div", {
					className: "vedit-card-body",
					children: [e.info.description && /* @__PURE__ */ (0, N.jsxs)("p", {
						className: "vedit-card-description",
						children: [/* @__PURE__ */ (0, N.jsx)(P, {
							name: "info",
							size: 15
						}), /* @__PURE__ */ (0, N.jsx)("span", { children: e.info.description })]
					}), /* @__PURE__ */ (0, N.jsx)(SC, {
						fields: e.fields,
						values: e.values,
						onFieldChange: (t, n) => o(e.info.slug, t, n),
						ctx: s,
						path: `layout.${e.info.slug}`
					})]
				})]
			}, e.info.slug);
		})
	})] }) : /* @__PURE__ */ (0, N.jsxs)("p", {
		className: "vedit-muted-note",
		children: [/* @__PURE__ */ (0, N.jsx)(P, {
			name: "loader",
			size: 14,
			className: "vedit-spin"
		}), " Loading the site settings…"]
	});
}
//#endregion
//#region src/pagePreview.ts
async function IC(e, t) {
	let n = await fetch(`/admin/api/nodes/${e}/preview`, {
		method: t ? "POST" : "GET",
		credentials: "same-origin",
		headers: t ? {
			"Content-Type": "application/json",
			Accept: "text/html"
		} : { Accept: "text/html" },
		body: t ? JSON.stringify(t) : void 0
	}), r = await n.text();
	if (!n.ok) {
		let e = new DOMParser().parseFromString(r, "text/html").body.textContent?.trim().slice(0, 160);
		throw Error(e || `${n.status} ${n.statusText}`);
	}
	return r;
}
var LC = (e) => new DOMParser().parseFromString(e, "text/html"), RC = null;
async function zC(e, t) {
	let [n, r] = await Promise.all([RC ? Promise.resolve("") : IC(e), IC(e, t)]), i = LC(r), a = RC ?? LC(n);
	WC(document.body, a.body, i.body), a.title !== i.title && (document.title = i.title), RC = i;
}
function BC(e) {
	return e.hasAttribute("data-vedit-host") || [
		"SQUILLA-ADMIN-BAR",
		"SCRIPT",
		"NOSCRIPT",
		"TEMPLATE",
		"STYLE",
		"LINK"
	].includes(e.tagName);
}
var VC = (e) => Array.from(e.children).filter((e) => !BC(e)), HC = (e) => e === "contenteditable" || e.startsWith("data-vedit"), UC = (e) => Array.from(e.childNodes).some((e) => e.nodeType === Node.TEXT_NODE && (e.textContent ?? "").trim() !== "");
function WC(e, t, n) {
	let r = VC(e), i = VC(t), a = VC(n), o = null;
	for (let t = 0; t < Math.max(i.length, a.length); t++) {
		let n = r[t], s = i[t], c = a[t];
		if (!c) {
			s && n && n.tagName === s.tagName && n.remove();
			continue;
		}
		if (!s) {
			let t = document.importNode(c, !0);
			o ? o.after(t) : e.prepend(t), o = t;
			continue;
		}
		if (s.isEqualNode(c)) {
			o = n ?? o;
			continue;
		}
		if (!(!n || n.tagName !== s.tagName)) {
			if (s.tagName !== c.tagName) {
				let e = document.importNode(c, !0);
				n.replaceWith(e), o = e;
				continue;
			}
			GC(n, s, c), o = n;
		}
	}
}
function GC(e, t, n) {
	for (let r of Array.from(n.attributes)) HC(r.name) || t.getAttribute(r.name) === r.value || (r.name === "class" ? KC(e, t, n) : e.setAttribute(r.name, r.value));
	for (let r of Array.from(t.attributes)) HC(r.name) || n.hasAttribute(r.name) || e.removeAttribute(r.name);
	if (t.children.length === 0 && n.children.length === 0 || UC(t) || UC(n)) {
		t.innerHTML !== n.innerHTML && e.dataset?.veditEditing !== "1" && (e.innerHTML = n.innerHTML);
		return;
	}
	WC(e, t, n);
}
function KC(e, t, n) {
	let r = new Set(t.classList), i = new Set(n.classList);
	r.forEach((t) => {
		i.has(t) || e.classList.remove(t);
	}), i.forEach((t) => {
		r.has(t) || e.classList.add(t);
	});
}
//#endregion
//#region src/SidePanel.tsx
var qC = 0;
function JC() {
	return qC += 1, `vec-${qC}-${Math.random().toString(36).slice(2, 8)}`;
}
var YC = 480, XC = 380, ZC = "vedit-panel-width";
function QC() {
	let e = getComputedStyle(document.documentElement).getPropertyValue("--squilla-admin-bar-h");
	return parseFloat(e) || 0;
}
function $C({ config: e, domEntries: t, selectedIndex: n, onSelect: r, hidden: i, onClose: a, onReindex: o, onBlockTypes: s, resume: c, peek: l, onWake: u }) {
	let [d, f] = (0, _.useState)(null), [p, m] = (0, _.useState)("page"), [h, g] = (0, _.useState)(null), [v, y] = (0, _.useState)(""), [b, x] = (0, _.useState)([]), [S, T] = (0, _.useState)("Page"), [re, oe] = (0, _.useState)(!1), [se, le] = (0, _.useState)(null), [E, D] = (0, _.useState)(!1), [de, fe] = (0, _.useState)(null), O = MC(e.languageCode), pe = (0, _.useRef)(null), [k, me] = (0, _.useState)([]), [j, ge] = (0, _.useState)([]), [ve, be] = (0, _.useState)(null), [xe, Se] = (0, _.useState)(null), [we, Te] = (0, _.useState)({
		kind: "idle",
		saved: !1
	}), [Ee, De] = (0, _.useState)(null), [Oe, ke] = (0, _.useState)({}), [Ae, je] = (0, _.useState)(null), [Me, Ne] = (0, _.useState)(c?.toast ?? null), [Pe, Fe] = (0, _.useState)(() => {
		try {
			let e = Number(window.localStorage.getItem(ZC));
			return Number.isFinite(e) && e >= XC ? e : YC;
		} catch {
			return YC;
		}
	}), Ie = (0, _.useRef)(null), Le = (0, _.useRef)(/* @__PURE__ */ new Map()), Re = (0, _.useRef)(!1), ze = (0, _.useRef)(/* @__PURE__ */ new Map()), Be = (0, _.useRef)(/* @__PURE__ */ new Map()), Ve = (0, _.useRef)(0), He = (0, _.useRef)(t);
	He.current = t;
	let Ue = (0, _.useRef)(r);
	Ue.current = r;
	let We = (0, _.useRef)(a);
	We.current = a;
	let Ge = (0, _.useRef)(s);
	Ge.current = s;
	let Ke = (0, _.useRef)(c);
	(0, _.useEffect)(() => {
		let t = !1;
		return Promise.all([
			Zr(e.nodeId),
			$r(),
			Qr().catch(() => []),
			mi()
		]).then(([e, n, r, i]) => {
			if (t) return;
			let a = {
				title: e.title,
				excerpt: e.excerpt ?? "",
				featured_image: e.featured_image ?? null,
				fields_data: e.fields_data ?? {}
			};
			g(a), y(JSON.stringify(a)), oe(i);
			let o = r.find((t) => t.slug === e.node_type);
			x(o?.fields ?? []), T(o?.label ?? ki(e.node_type)), A({
				title: e.title,
				excerpt: e.excerpt ?? "",
				imageUrl: ri(e.featured_image)
			});
			let s = (e.blocks_data ?? []).map((e, t) => ({
				...e,
				fields: e.fields ?? {},
				__loadedIndex: t,
				__cid: JC(),
				__isNew: !1
			}));
			for (let e of s) ze.current.set(e.__cid, JSON.stringify(e.fields));
			f(e), me(n), ge(s), be(rw(s)), Ge.current(new Map(n.map((e) => [e.slug, qr(e)])));
			let c = Ke.current?.pos;
			c != null && s[c] && Ue.current(s[c].__loadedIndex);
		}).catch((e) => {
			t || Se(e.message);
		}), () => {
			t = !0;
		};
	}, [e.nodeId]);
	let qe = (0, _.useRef)(!1), Je = (0, _.useRef)(!1);
	(0, _.useLayoutEffect)(() => {
		if (Je.current || j.length === 0) return;
		Je.current = !0;
		let e = Ke.current?.panelScroll;
		e && Ie.current && (Ie.current.scrollTop = e, qe.current = !0);
	}, [j.length]);
	let Ye = (0, _.useMemo)(() => new Map(k.map((e) => [e.slug, e])), [k]), Xe = Ji((0, _.useMemo)(() => [...k.map((e) => e.icon), ...(O.pages ?? []).map((e) => e.info.icon)].map((e) => OC(e)).filter((e) => !!e), [k, O.pages])), Ze = (0, _.useMemo)(() => {
		if (n === null) return null;
		let e = j.findIndex((e) => e.__loadedIndex === n);
		return e === -1 ? null : e;
	}, [n, j]), Qe = Ze === null ? null : j[Ze]?.__cid ?? null, $e = (0, _.useMemo)(() => JSON.stringify(nw(j)), [j]), et = ve !== null && $e !== ve.json, tt = (0, _.useMemo)(() => tw(h, v), [h, v]), nt = O.dirtySlugs.length, rt = et || tt.length > 0 || nt > 0, it = (0, _.useMemo)(() => et && ve ? iw(j, ve) : 0, [
		et,
		j,
		ve
	]) + tt.length + nt, at = et || tt.length > 0;
	(0, _.useEffect)(() => {
		if (!Qe || i) return;
		if (qe.current) {
			qe.current = !1;
			return;
		}
		let e = requestAnimationFrame(() => {
			let e = Le.current.get(Qe), t = Ie.current;
			if (!e || !t) return;
			let n = e.getBoundingClientRect(), r = t.getBoundingClientRect();
			(n.top < r.top + 4 || n.top > r.bottom - 140) && t.scrollTo({
				top: t.scrollTop + (n.top - r.top) - 12,
				behavior: "smooth"
			});
		});
		return () => cancelAnimationFrame(e);
	}, [Qe, i]), (0, _.useEffect)(() => {
		if (!d) return;
		let e = j.filter((e) => ze.current.get(e.__cid) !== JSON.stringify(e.fields ?? {}));
		if (e.length === 0) return;
		let t = e.every((e) => !ze.current.has(e.__cid)), n = window.setTimeout(() => {
			let t = ++Ve.current, n = e.map((e) => (ze.current.set(e.__cid, JSON.stringify(e.fields ?? {})), Be.current.set(e.__cid, t), {
				cid: e.__cid,
				index: e.__loadedIndex,
				slug: e.type,
				payload: {
					type: e.type,
					fields: e.fields ?? {}
				}
			}));
			ei(d.id, n.map((e) => e.payload)).then((e) => {
				let r = {};
				n.forEach((n, i) => {
					if (Be.current.get(n.cid) !== t) return;
					let a = He.current.find((e) => e.index === n.index);
					if (!a) return;
					let o = e[i] ?? "";
					ae(a, o), r[n.cid] = ti(o), document.dispatchEvent(new CustomEvent("squilla:block-rendered", { detail: {
						index: n.index,
						slug: n.slug,
						start: a.startNode,
						end: a.endNode
					} }));
				}), ke((e) => {
					let t = { ...e };
					for (let [e, n] of Object.entries(r)) n ? t[e] = n : delete t[e];
					return t;
				}), je(null);
			}).catch((e) => {
				n.forEach((e) => {
					Be.current.get(e.cid) === t && ze.current.delete(e.cid);
				}), je(e.message);
			});
		}, t ? 0 : 250);
		return () => window.clearTimeout(n);
	}, [j, d]);
	let ot = (e, t) => {
		g((n) => n && {
			...n,
			[e]: t
		});
	}, st = ri(h?.featured_image);
	(0, _.useEffect)(() => {
		h && _e("title", h.title);
	}, [h?.title]), (0, _.useEffect)(() => {
		h && _e("excerpt", h.excerpt);
	}, [h?.excerpt]), (0, _.useEffect)(() => {
		st && _e("featured_image", st);
	}, [st]);
	let ct = (e) => {
		m("layout"), O.load();
		let t = O.pages;
		if (!t) {
			pe.current = e;
			return;
		}
		let n = t.find((t) => t.info.slug === e) ?? t.find((t) => t.info.slug.includes(e));
		n && fe(n.info.slug);
	};
	(0, _.useEffect)(() => {
		if (!O.pages || !pe.current) return;
		let e = pe.current;
		pe.current = null;
		let t = O.pages.find((t) => t.info.slug === e) ?? O.pages.find((t) => t.info.slug.includes(e));
		t && fe(t.info.slug);
	}, [O.pages]);
	let lt = O.load;
	(0, _.useEffect)(() => {
		p === "layout" && lt();
	}, [p, lt]);
	let ut = (0, _.useRef)(ct);
	ut.current = ct, (0, _.useEffect)(() => ue((e) => {
		e.type === "text" ? (m("page"), g((t) => t && {
			...t,
			[e.field]: e.value
		})) : e.kind === "settings" ? ut.current(e.key ?? "") : (m("page"), le((t) => ({
			field: e.kind,
			n: (t?.n ?? 0) + 1
		})));
	}), []);
	let dt = (0, _.useMemo)(() => {
		let e = {};
		for (let t of O.pages ?? []) O.dirtySlugs.includes(t.info.slug) && (e[t.info.slug] = t.values);
		return e;
	}, [O.pages, O.dirtySlugs]), mt = tt.includes("fields_data"), ht = JSON.stringify({
		f: mt ? h?.fields_data : null,
		t: dt
	}), gt = JSON.stringify({
		f: null,
		t: {}
	}), _t = (0, _.useRef)(gt), vt = (0, _.useRef)(0), yt = (0, _.useRef)(j);
	yt.current = j;
	let bt = (0, _.useRef)(h);
	bt.current = h, (0, _.useEffect)(() => {
		if (!d || ht === _t.current) return;
		let e = window.setTimeout(() => {
			let e = bt.current;
			if (!e) return;
			_t.current = ht;
			let t = ++vt.current;
			D(!0), zC(d.id, {
				title: e.title,
				excerpt: e.excerpt,
				featured_image: e.featured_image ?? {},
				fields_data: e.fields_data,
				blocks_data: nw(yt.current),
				theme_settings: dt
			}).then(() => {
				t === vt.current && (je(null), o(), A({
					title: e.title,
					excerpt: e.excerpt,
					imageUrl: ri(e.featured_image)
				}));
			}).catch((e) => {
				_t.current = "", je(e.message);
			}).finally(() => {
				t === vt.current && D(!1);
			});
		}, 450);
		return () => window.clearTimeout(e);
	}, [ht, d]);
	let St = (e, t, n) => {
		ge((r) => r.map((r) => r.__cid === e ? {
			...r,
			fields: {
				...r.fields ?? {},
				[t]: n
			}
		} : r));
	}, Ct = (e) => {
		let t = He.current.find((t) => t.index === e), n = t ? ne(t) : null;
		if (!n) return;
		let r = QC() + 72;
		n.top >= r - 24 && n.top < window.innerHeight * .5 || window.scrollTo({
			top: Math.max(0, window.scrollY + n.top - r),
			behavior: "smooth"
		});
	}, wt = (e) => {
		if (n === e.__loadedIndex) {
			r(null);
			return;
		}
		r(e.__loadedIndex), Ct(e.__loadedIndex);
	}, Tt = (e, t, n) => {
		let i = JC(), a = C(), { start: s, end: c } = w(a, t);
		ee(He.current, e, s, c, ""), ge((r) => {
			let o = r.slice();
			return o.splice(e, 0, {
				type: t,
				fields: n,
				__loadedIndex: a,
				__cid: i,
				__isNew: !0
			}), o;
		}), o(), r(a), window.setTimeout(() => Ct(a), 350);
	}, Et = (e) => {
		let t = j[e];
		t && Tt(e + 1, t.type, JSON.parse(JSON.stringify(t.fields ?? {})));
	}, Dt = (e) => {
		let t = j[e];
		if (!t) return;
		let i = He.current.find((e) => e.index === t.__loadedIndex);
		i && te(i), ze.current.delete(t.__cid), ge((e) => e.filter((e) => e.__cid !== t.__cid)), n === t.__loadedIndex && r(null), o();
	}, Ot = (e, t) => {
		if (e === t || e < 0 || t < 0 || e >= j.length || t >= j.length) return;
		ie(He.current, e, t), ge((n) => xr(n, e, t)), o();
		let r = j[e];
		r && n === r.__loadedIndex && window.setTimeout(() => Ct(r.__loadedIndex), 60);
	}, kt = pt(ft(hn, { activationConstraint: { distance: 4 } }), ft(un, { coordinateGetter: Wr })), At = ({ active: e, over: t }) => {
		!t || e.id === t.id || Ot(j.findIndex((t) => t.__cid === e.id), j.findIndex((e) => e.__cid === t.id));
	};
	(0, _.useEffect)(() => ce((e) => De(e)), []);
	let jt = async () => {
		if (!d || we.kind === "saving") return;
		Te({ kind: "saving" });
		let e = j;
		try {
			let t = {};
			et && (t.blocks_data = nw(e));
			for (let e of tt) t[e] = e === "featured_image" ? h?.featured_image ?? {} : h?.[e];
			Object.keys(t).length > 0 && await Yr(d.id, t), nt > 0 && await O.save(), be(rw(e)), h && y(JSON.stringify(h)), ge((e) => e.map((e) => e.__isNew ? {
				...e,
				__isNew: !1
			} : e)), Te({
				kind: "idle",
				saved: !0
			}), Ne("Changes saved"), _t.current = gt;
		} catch (e) {
			Te({
				kind: "error",
				message: e.message
			});
		}
	}, Mt = (0, _.useRef)(jt);
	Mt.current = jt;
	let Nt = () => {
		rt && window.confirm(`Discard ${it === 1 ? "this unsaved change" : `all ${it} unsaved changes`}?`) && (Ce(e.nodeId, {
			pos: Ze,
			panelScroll: Ie.current?.scrollTop ?? 0,
			toast: "Changes discarded"
		}), Re.current = !0, window.location.reload());
	};
	(0, _.useEffect)(() => {
		if (!rt) return;
		let e = (e) => {
			Re.current || (e.preventDefault(), e.returnValue = "");
		};
		return window.addEventListener("beforeunload", e), () => window.removeEventListener("beforeunload", e);
	}, [rt]), (0, _.useEffect)(() => {
		if (i) return;
		let e = (e) => {
			(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s" && (e.preventDefault(), !Si() && Mt.current());
		};
		return window.addEventListener("keydown", e, !0), () => window.removeEventListener("keydown", e, !0);
	}, [i]), (0, _.useEffect)(() => {
		if (!i) return xi((e) => {
			if (ye()) return;
			let t = e.composedPath()[0], n = t?.getRootNode?.();
			if (n instanceof ShadowRoot && n.host.hasAttribute("data-vedit-host") && t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) {
				t.blur();
				return;
			}
			We.current();
		}, !1);
	}, [i]), (0, _.useEffect)(() => {
		if (!Me) return;
		let e = window.setTimeout(() => Ne(null), 2600);
		return () => window.clearTimeout(e);
	}, [Me]);
	let Pt = (e) => {
		e.preventDefault();
		let t = e.clientX, n = Pe, r = n, i = (e) => {
			r = Math.round(Math.max(XC, Math.min(window.innerWidth * .7, n + (t - e.clientX)))), Fe(r);
		}, a = () => {
			document.removeEventListener("pointermove", i), document.removeEventListener("pointerup", a);
			try {
				window.localStorage.setItem(ZC, String(r));
			} catch {}
		};
		document.addEventListener("pointermove", i), document.addEventListener("pointerup", a);
	}, Ft = {
		nodeId: e.nodeId,
		nodeType: e.nodeType
	}, It = (e) => {
		if (j.length === 0) return "It will be the first block on this page.";
		if (e >= j.length) return "It goes at the end of the page.";
		let t = j[e], n = t ? qr(Ye.get(t.type)) : "";
		return `It goes above block ${e + 1}${n && n !== "(unnamed)" ? ` (${n})` : ""}.`;
	}, Lt, Rt = "muted";
	return !d && !xe ? Lt = "Loading…" : we.kind === "saving" ? Lt = /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)(P, {
		name: "loader",
		size: 14,
		className: "vedit-spin"
	}), " Saving…"] }) : we.kind === "error" ? (Lt = `Couldn't save: ${we.message}`, Rt = "danger") : E ? Lt = /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)(P, {
		name: "loader",
		size: 14,
		className: "vedit-spin"
	}), " Updating preview…"] }) : rt ? (Lt = `${it} unsaved change${it === 1 ? "" : "s"}`, Rt = "dirty") : Lt = we.saved ? /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [/* @__PURE__ */ (0, N.jsx)(P, {
		name: "check",
		size: 14
	}), " All changes saved"] }) : "No changes", /* @__PURE__ */ (0, N.jsxs)("aside", {
		className: "vedit-panel",
		"aria-label": "Page editor",
		style: { width: Pe },
		"data-peek": l || void 0,
		onPointerEnter: u,
		onPointerMove: l ? u : void 0,
		onFocusCapture: u,
		children: [
			l && /* @__PURE__ */ (0, N.jsx)("button", {
				type: "button",
				className: "vedit-peek-tab",
				onClick: u,
				title: "Show the editor",
				"aria-label": "Show the editor",
				children: /* @__PURE__ */ (0, N.jsx)(P, {
					name: "chevron-down",
					size: 18,
					style: { transform: "rotate(90deg)" }
				})
			}),
			/* @__PURE__ */ (0, N.jsx)("div", {
				className: "vedit-resize-handle",
				onPointerDown: Pt,
				title: "Drag to resize"
			}),
			/* @__PURE__ */ (0, N.jsxs)("header", {
				className: "vedit-panel-header",
				children: [
					/* @__PURE__ */ (0, N.jsxs)("div", {
						className: "vedit-panel-heading",
						children: [/* @__PURE__ */ (0, N.jsxs)("span", {
							className: "vedit-panel-eyebrow",
							children: [d ? `${ki(d.node_type)} · ${d.language_code.toUpperCase()}` : "Editing", d?.status && d.status !== "published" && /* @__PURE__ */ (0, N.jsx)("span", {
								className: "vedit-status-pill",
								children: d.status
							})]
						}), /* @__PURE__ */ (0, N.jsx)("span", {
							className: "vedit-panel-title",
							children: d ? h?.title || d.title : `#${e.nodeId}`
						})]
					}),
					/* @__PURE__ */ (0, N.jsx)("a", {
						className: "vedit-icon-btn",
						href: li(e.nodeType, e.nodeId),
						target: "_blank",
						rel: "noopener",
						title: "Open in admin",
						"aria-label": "Open this page in the admin",
						children: /* @__PURE__ */ (0, N.jsx)(P, {
							name: "external",
							size: 16
						})
					}),
					/* @__PURE__ */ (0, N.jsx)("button", {
						type: "button",
						className: "vedit-icon-btn",
						onClick: a,
						title: "Close (Esc) — unsaved changes are kept",
						"aria-label": "Close editor",
						children: /* @__PURE__ */ (0, N.jsx)(P, {
							name: "x",
							size: 18
						})
					})
				]
			}),
			/* @__PURE__ */ (0, N.jsxs)("nav", {
				className: "vedit-ptabs",
				role: "tablist",
				"aria-label": "What to edit",
				children: [/* @__PURE__ */ (0, N.jsxs)("button", {
					type: "button",
					role: "tab",
					"aria-selected": p === "page",
					className: "vedit-ptab",
					"data-active": p === "page" || void 0,
					onClick: () => m("page"),
					children: [
						"This ",
						S.toLowerCase(),
						/* @__PURE__ */ (0, N.jsx)("span", {
							className: "vedit-ptab-count",
							children: j.length
						}),
						at && /* @__PURE__ */ (0, N.jsx)("span", {
							className: "vedit-ptab-dot",
							"aria-label": "Unsaved changes"
						})
					]
				}), /* @__PURE__ */ (0, N.jsxs)("button", {
					type: "button",
					role: "tab",
					"aria-selected": p === "layout",
					className: "vedit-ptab",
					"data-active": p === "layout" || void 0,
					onClick: () => m("layout"),
					children: [
						"Site layout",
						O.pages && /* @__PURE__ */ (0, N.jsx)("span", {
							className: "vedit-ptab-count",
							children: O.pages.length
						}),
						nt > 0 && /* @__PURE__ */ (0, N.jsx)("span", {
							className: "vedit-ptab-dot",
							"aria-label": "Unsaved changes"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, N.jsxs)("div", {
				className: "vedit-panel-body",
				ref: Ie,
				children: [
					xe && /* @__PURE__ */ (0, N.jsxs)("div", {
						className: "vedit-alert",
						"data-tone": "danger",
						children: ["Couldn't load this page: ", xe]
					}),
					Ae && /* @__PURE__ */ (0, N.jsxs)("div", {
						className: "vedit-alert",
						"data-tone": "warning",
						children: [/* @__PURE__ */ (0, N.jsx)(P, {
							name: "alert",
							size: 15
						}), /* @__PURE__ */ (0, N.jsxs)("span", { children: [
							"Live preview failed (",
							Ae,
							"). Your edits are kept — save and reload to see them."
						] })]
					}),
					p === "layout" && /* @__PURE__ */ (0, N.jsx)(FC, {
						pages: O.pages,
						error: O.error,
						icons: Xe,
						openSlug: de,
						setOpenSlug: fe,
						dirtySlugs: O.dirtySlugs,
						onChange: O.setValue,
						ctx: Ft
					}),
					p === "page" && d && h && /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [
						/* @__PURE__ */ (0, N.jsx)("div", {
							className: "vedit-section-head",
							children: /* @__PURE__ */ (0, N.jsx)("span", {
								className: "vedit-section-title",
								children: S
							})
						}),
						/* @__PURE__ */ (0, N.jsx)(NC, {
							meta: h,
							onChange: (e, t) => ot(e, t),
							mediaOk: re,
							supportsExcerpt: !!d.excerpt || !!he("excerpt") || d.node_type !== "page",
							focus: se
						}),
						/* @__PURE__ */ (0, N.jsx)(PC, {
							schema: b,
							values: h.fields_data,
							onFieldChange: (e, t) => ot("fields_data", {
								...h.fields_data,
								[e]: t
							}),
							ctx: Ft,
							label: S
						})
					] }),
					p === "page" && d && /* @__PURE__ */ (0, N.jsxs)("div", {
						className: "vedit-section-head",
						children: [/* @__PURE__ */ (0, N.jsx)("span", {
							className: "vedit-section-title",
							children: "Blocks"
						}), /* @__PURE__ */ (0, N.jsx)("span", {
							className: "vedit-count",
							children: j.length
						})]
					}),
					p === "page" && d && j.length === 0 && /* @__PURE__ */ (0, N.jsxs)("div", {
						className: "vedit-empty-state",
						children: [
							/* @__PURE__ */ (0, N.jsx)("span", {
								className: "vedit-empty-icon",
								children: /* @__PURE__ */ (0, N.jsx)(P, {
									name: "blocks",
									size: 20
								})
							}),
							/* @__PURE__ */ (0, N.jsx)("p", {
								className: "vedit-empty-title",
								children: "No blocks yet"
							}),
							/* @__PURE__ */ (0, N.jsx)("p", {
								className: "vedit-empty-text",
								children: "Add a block to start building this page."
							})
						]
					}),
					p === "page" && j.length > 0 && /* @__PURE__ */ (0, N.jsx)(fr, {
						sensors: kt,
						collisionDetection: xt,
						onDragEnd: At,
						children: /* @__PURE__ */ (0, N.jsx)(Mr, {
							items: j.map((e) => e.__cid),
							strategy: Or,
							children: /* @__PURE__ */ (0, N.jsx)("div", {
								className: "vedit-block-list",
								children: j.map((e, t) => /* @__PURE__ */ (0, N.jsx)(AC, {
									block: e,
									index: t,
									total: j.length,
									blockType: Ye.get(e.type),
									icons: Xe,
									open: e.__cid === Qe,
									renderError: Oe[e.__cid],
									ctx: Ft,
									onToggle: () => wt(e),
									onMove: (e) => Ot(t, t + e),
									onDuplicate: () => Et(t),
									onDelete: () => Dt(t),
									onFieldChange: (t, n) => St(e.__cid, t, n),
									cardRef: (t) => {
										t ? Le.current.set(e.__cid, t) : Le.current.delete(e.__cid);
									}
								}, e.__cid))
							})
						})
					}),
					p === "page" && d && /* @__PURE__ */ (0, N.jsxs)("button", {
						type: "button",
						className: "vedit-add-button",
						onClick: () => De(j.length),
						disabled: k.length === 0,
						children: [/* @__PURE__ */ (0, N.jsx)(P, {
							name: "plus",
							size: 16
						}), "Add block"]
					})
				]
			}),
			Me && /* @__PURE__ */ (0, N.jsxs)("div", {
				className: "vedit-toast",
				role: "status",
				children: [/* @__PURE__ */ (0, N.jsx)(P, {
					name: "check",
					size: 14,
					strokeWidth: 2.4
				}), Me]
			}),
			/* @__PURE__ */ (0, N.jsxs)("footer", {
				className: "vedit-panel-footer",
				children: [
					/* @__PURE__ */ (0, N.jsx)("span", {
						className: "vedit-footer-status",
						"data-tone": Rt,
						children: Lt
					}),
					/* @__PURE__ */ (0, N.jsx)("button", {
						type: "button",
						className: "vedit-btn",
						"data-variant": "secondary",
						onClick: Nt,
						disabled: !rt || we.kind === "saving",
						children: "Discard"
					}),
					/* @__PURE__ */ (0, N.jsx)("button", {
						type: "button",
						className: "vedit-btn",
						"data-variant": "primary",
						onClick: () => void jt(),
						disabled: !rt || we.kind === "saving",
						title: "Save (⌘S)",
						children: we.kind === "saving" ? "Saving…" : "Save"
					})
				]
			}),
			Ee !== null && /* @__PURE__ */ (0, N.jsx)(jC, {
				blockTypes: k,
				icons: Xe,
				placement: It(Ee),
				onClose: () => De(null),
				onPick: (e) => {
					let t = Ye.get(e), n = Math.min(Ee, j.length);
					De(null), t && Tt(n, e, Li(Jr(t)));
				}
			})
		]
	});
}
var ew = [
	"title",
	"excerpt",
	"featured_image",
	"fields_data"
];
function tw(e, t) {
	if (!e || !t) return [];
	let n = JSON.parse(t);
	return ew.filter((t) => JSON.stringify(e[t] ?? null) !== JSON.stringify(n[t] ?? null));
}
function nw(e) {
	return e.map(({ __loadedIndex: e, __cid: t, __isNew: n, ...r }) => r);
}
function rw(e) {
	let t = nw(e);
	return {
		json: JSON.stringify(t),
		byCid: new Map(e.map((e, n) => [e.__cid, JSON.stringify(t[n])])),
		order: e.map((e) => e.__cid)
	};
}
function iw(e, t) {
	let n = nw(e), r = 0;
	e.forEach((e, i) => {
		let a = t.byCid.get(e.__cid);
		(a === void 0 || a !== JSON.stringify(n[i])) && r++;
	});
	let i = new Set(e.map((e) => e.__cid)), a = t.order.filter((e) => i.has(e));
	return r += t.order.length - a.length, e.map((e) => e.__cid).filter((e) => t.byCid.has(e)).some((e, t) => e !== a[t]) && r++, r;
}
//#endregion
//#region src/types.ts
function aw() {
	let e = window.Squilla?.adminBar;
	return e && e.ready === !0 ? e : null;
}
//#endregion
//#region src/EditorRoot.tsx
function ow({ config: e }) {
	let [t] = (0, _.useState)(() => we(e.nodeId)), [n, r] = (0, _.useState)(() => t !== null), [i, a] = (0, _.useState)(!1), o = n && !i, [s, c] = (0, _.useState)([]), [l, u] = (0, _.useState)(() => aw());
	(0, _.useEffect)(() => {
		if (l) return;
		let e = () => u(aw());
		return document.addEventListener("squilla:adminbar-ready", e), () => document.removeEventListener("squilla:adminbar-ready", e);
	}, [l]);
	let d = (0, _.useRef)(() => {});
	d.current = () => {
		o ? a(!0) : (r(!0), a(!1));
	}, (0, _.useEffect)(() => {
		if (!l) return;
		let e = l.add({
			id: "visual-editor",
			label: "Customize",
			title: "Edit this page's blocks in place",
			onClick: () => d.current()
		});
		return () => e?.remove();
	}, [l]), (0, _.useEffect)(() => {
		l?.update("visual-editor", {
			label: o ? "Close editor" : "Customize",
			active: o
		});
	}, [l, o]);
	let [f, p] = (0, _.useState)(!1), [m, h] = (0, _.useState)(null), [g, v] = (0, _.useState)(null), y = (0, _.useRef)(/* @__PURE__ */ new Map()), b = (0, _.useRef)(null), S = (0, _.useRef)(null), C = (0, _.useRef)(null), w = (0, _.useRef)(null), ee = (0, _.useRef)(null), te = (0, _.useRef)(null), re = (0, _.useRef)(null);
	(0, _.useEffect)(() => {
		if (!o) {
			h(null);
			return;
		}
		c(x(document.body));
	}, [o]), (0, _.useEffect)(() => {
		if (!o) return;
		let e = 0, t = -1, n = () => {
			let r = QC(), i = m == null ? -1 : s.findIndex((e) => e.index === m), a = g == null ? -1 : s.findIndex((e) => e.index === g), o = i >= 0 ? s[i] : null, c = a >= 0 ? s[a] : null;
			uw(w.current, ee.current, te.current, r, re.current), lw(b.current, o && i !== a ? ne(o) : null, o ? sw(i, o.slug, y.current) : "", r), lw(S.current, c ? ne(c) : null, c ? sw(a, c.slug, y.current) : "", r), s.length !== t && C.current && (dw(C.current, s.length), t = s.length);
			let l = /* @__PURE__ */ new Set();
			for (let e of [i, a]) e >= 0 && (l.add(e), l.add(e + 1));
			mw(C.current, s, l, pw(re.current, r)), e = requestAnimationFrame(n);
		};
		return e = requestAnimationFrame(n), () => cancelAnimationFrame(e);
	}, [
		o,
		s,
		m,
		g
	]), (0, _.useEffect)(() => {
		if (!o) return;
		let e = (e) => {
			let t = e.target;
			if (!t || e.target?.closest?.("[data-vedit-host]")) return;
			let n = ge(t);
			if (te.current = n, n) {
				h(null);
				return;
			}
			let r = T(t, s);
			h(r ? r.index : null);
		}, t = (e) => {
			let t = e.target;
			if (!t || e.target?.closest?.("[data-vedit-host]")) return;
			let n = ge(t);
			if (n) {
				if (n.el.dataset.veditEditing === "1") return;
				e.preventDefault(), e.stopPropagation(), n.kind === "title" || n.kind === "excerpt" ? p(!0) : p((e) => !e), ie(n);
				return;
			}
			let r = T(t, s);
			p((e) => r ? !e : !0), r && (e.preventDefault(), e.stopPropagation(), v(r.index));
		}, n = (e) => {
			e.target?.closest?.("[data-vedit-host]") || p(!0);
		};
		return document.addEventListener("pointermove", e, !0), document.addEventListener("click", t, !0), document.addEventListener("wheel", n, {
			capture: !0,
			passive: !0
		}), document.addEventListener("touchmove", n, {
			capture: !0,
			passive: !0
		}), () => {
			document.removeEventListener("pointermove", e, !0), document.removeEventListener("click", t, !0), document.removeEventListener("wheel", n, !0), document.removeEventListener("touchmove", n, !0);
		};
	}, [o, s]);
	let ie = (e) => {
		if (e.kind === "title" || e.kind === "excerpt") {
			be(e);
			return;
		}
		D({
			type: "activate",
			kind: e.kind,
			key: e.key
		});
	}, ae = (0, _.useRef)(ie);
	ae.current = ie;
	let oe = (0, _.useMemo)(() => () => c(x(document.body)), []), se = (0, _.useMemo)(() => (e) => {
		y.current = e;
	}, []);
	return /* @__PURE__ */ (0, N.jsxs)(N.Fragment, { children: [!o && !l && /* @__PURE__ */ (0, N.jsx)("button", {
		type: "button",
		className: "vedit-toggle",
		onClick: () => {
			r(!0), a(!1);
		},
		children: "Edit page"
	}), n && /* @__PURE__ */ (0, N.jsxs)("div", {
		ref: re,
		style: i ? { display: "none" } : void 0,
		children: [/* @__PURE__ */ (0, N.jsxs)("div", {
			className: "vedit-overlay",
			"aria-hidden": "true",
			children: [
				/* @__PURE__ */ (0, N.jsx)("div", {
					ref: b,
					className: "vedit-outline",
					"data-kind": "hover",
					style: { display: "none" },
					children: /* @__PURE__ */ (0, N.jsx)("span", { className: "vedit-label" })
				}),
				/* @__PURE__ */ (0, N.jsx)("div", {
					ref: S,
					className: "vedit-outline",
					"data-kind": "selected",
					style: { display: "none" },
					children: /* @__PURE__ */ (0, N.jsx)("span", { className: "vedit-label" })
				}),
				/* @__PURE__ */ (0, N.jsx)("div", {
					ref: w,
					className: "vedit-outline",
					"data-kind": "field",
					style: { display: "none" },
					children: /* @__PURE__ */ (0, N.jsx)("button", {
						ref: ee,
						type: "button",
						className: "vedit-field-action",
						onClick: (e) => {
							e.preventDefault(), e.stopPropagation(), p(!1), te.current && ae.current(te.current);
						}
					})
				}),
				/* @__PURE__ */ (0, N.jsx)("div", {
					ref: C,
					className: "vedit-gutters"
				})
			]
		}), /* @__PURE__ */ (0, N.jsx)($C, {
			config: e,
			domEntries: s,
			selectedIndex: g,
			onSelect: v,
			hidden: i,
			onClose: () => a(!0),
			onReindex: oe,
			onBlockTypes: se,
			resume: t,
			peek: f,
			onWake: () => p(!1)
		})]
	})] });
}
function sw(e, t, n) {
	return `${e + 1} · ${n.get(t) ?? t}`;
}
var cw = 22;
function lw(e, t, n, r) {
	if (!e) return;
	if (!t || !n || t.top + t.height < r || t.top > window.innerHeight) {
		e.style.display = "none";
		return;
	}
	e.style.display = "block", e.style.transform = `translate(${t.left}px, ${t.top}px)`, e.style.width = `${t.width}px`, e.style.height = `${t.height}px`;
	let i = e.firstElementChild;
	if (!i) return;
	i.textContent !== n && (i.textContent = n);
	let a = t.top - r >= cw;
	i.dataset.inside = a ? "" : "true", i.style.top = a ? `${-cw}px` : `${Math.max(0, r - t.top)}px`, i.style.left = `${Math.max(0, -t.left) - (a ? 2 : 0)}px`;
}
function uw(e, t, n, r, i) {
	if (!e || !t) return;
	let a = n && n.el.isConnected ? n.el.getBoundingClientRect() : null;
	if (!n || !a || a.width < 8 || a.height < 8 || a.bottom < r || a.top > window.innerHeight) {
		e.style.display = "none";
		return;
	}
	let o = n.el.dataset.veditEditing === "1";
	if (e.style.display = "block", e.dataset.editing = o ? "true" : "", e.style.transform = `translate(${a.left}px, ${a.top}px)`, e.style.width = `${a.width}px`, e.style.height = `${a.height}px`, t.dataset.k !== n.action + n.caption) {
		t.dataset.k = n.action + n.caption, t.textContent = "";
		let e = document.createElement("span");
		e.className = "vedit-field-caption", e.textContent = n.caption;
		let r = document.createElement("span");
		r.textContent = n.action, t.append(r, e);
	}
	t.style.display = o ? "none" : "inline-flex";
	let s = i?.querySelector(".vedit-panel"), c = Math.min(window.innerWidth, s ? s.getBoundingClientRect().left : window.innerWidth), l = t.offsetWidth || 120, u = a.top - r >= 38, d = Math.max(0, Math.min(Math.max(0, -a.left), a.width - l)) + (u ? 0 : 8), f = Math.max(0, Math.min(a.right, c) - a.left - l);
	t.style.left = `${Math.min(d, f)}px`, t.style.top = u ? "-34px" : `${Math.min(Math.max(8, r - a.top + 8), Math.max(8, a.height - 34))}px`;
}
function dw(e, t) {
	e.replaceChildren();
	let n = t === 0 ? 1 : t + 1;
	for (let t = 0; t < n; t++) {
		let n = document.createElement("button");
		n.type = "button", n.className = "vedit-insert-gutter", n.innerHTML = "<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" aria-hidden=\"true\"><path d=\"M5 12h14\"/><path d=\"M12 5v14\"/></svg>", n.title = "Add a block here", n.setAttribute("aria-label", `Add a block at position ${t + 1}`), n.dataset.idx = String(t), n.addEventListener("click", (e) => {
			e.preventDefault(), e.stopPropagation(), le(Number(n.dataset.idx));
		}), e.appendChild(n);
	}
}
var fw = 28;
function pw(e, t) {
	let n = e?.querySelector(".vedit-panel"), r = n ? n.getBoundingClientRect().left : window.innerWidth;
	return {
		top: t,
		bottom: window.innerHeight,
		left: 0,
		right: Math.min(window.innerWidth, r)
	};
}
function mw(e, t, n, r) {
	if (!e) return;
	let i = e.children;
	if (t.length === 0) {
		let e = i[0];
		e && (e.style.display = "grid", e.style.transform = `translate(${(r.left + r.right - fw) / 2}px, ${r.top + 24}px)`);
		return;
	}
	let a = t.map((e) => ne(e));
	for (let e = 0; e <= t.length; e++) {
		let o = i[e];
		if (!o) continue;
		let s = e === 0 ? null : a[e - 1], c = e === t.length ? null : a[e], l = [s, c].filter((e) => e != null);
		if (!n.has(e) || l.length === 0) {
			o.style.display = "none";
			continue;
		}
		let u = s && c ? (s.top + s.height + c.top) / 2 - fw / 2 : s ? s.top + s.height - fw / 2 : c.top - fw / 2, d = Math.max(r.left, Math.min(...l.map((e) => e.left))), f = Math.min(r.right, Math.max(...l.map((e) => e.left + e.width)));
		if (!(u >= r.top && u + fw <= r.bottom && f - d >= fw) || !Number.isFinite(u) || !Number.isFinite(d + f)) {
			o.style.display = "none";
			continue;
		}
		o.style.display = "grid", o.style.transform = `translate(${(d + f - fw) / 2}px, ${u}px)`;
	}
}
//#endregion
//#region src/styles.css?inline
var hw = ":host{all:initial;--accent:#2459dc;--accent-fg:#fff;--accent-weak:color-mix(in oklab, var(--accent) 9%, transparent);--accent-mid:color-mix(in oklab, var(--accent) 20%, transparent);--accent-strong:color-mix(in oklab, var(--accent) 84%, #000);--accent-soft:color-mix(in oklab, var(--accent) 7%, #fff);--app-bg:#eceff3;--card-bg:#fff;--sub-bg:#f5f7f9;--hover-bg:#eef1f5;--hover-overlay:#0f172a0f;--border:#0f172a1f;--border-strong:#0f172a30;--border-input:#0f172a42;--border-hover:#0f172a61;--divider:#0f172a17;--fg:#111827;--fg-2:#344054;--fg-muted:#4e5868;--fg-subtle:#636c7b;--fg-hint:#848d9c;--danger:#c42b2b;--danger-bg:#fdf0f0;--danger-border:#c42b2b3d;--success:#1f7a4d;--success-bg:#eaf6ef;--warning:#a1520a;--warning-bg:#fdf3e3;--radius-sm:5px;--radius-md:7px;--radius-lg:10px;--radius-xl:14px;--shadow-sm:0 1px 2px #0f172a0f;--shadow-md:0 1px 2px #0f172a0f, 0 6px 16px -4px #0f172a1a;--shadow-pop:0 0 0 1px #0f172a0d, 0 2px 6px #0f172a14, 0 12px 28px -8px #0f172a33;--shadow-panel:-1px 0 0 #0f172a14, -12px 0 32px -8px #0f172a2e;--font-body:\"Geist\", ui-sans-serif, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;--font-mono:\"Geist Mono\", ui-monospace, \"SF Mono\", Menlo, Consolas, monospace;--ease:cubic-bezier(.2, .8, .2, 1);font-family:var(--font-body);letter-spacing:-.006em;color:var(--fg);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-size:13.5px;line-height:1.5}@supports (color:color(display-p3 0 0 0)){:host{--danger-border:color(display-p3 .707191 .225685 .200224/.24)}}@supports (color:lab(0% 0 0)){:host{--danger-border:lab(44.4617% 59.6798 40.0514/.24)}}*,:before,:after{box-sizing:border-box}button{font:inherit;letter-spacing:inherit;color:inherit;cursor:pointer;background:0 0;border:0;margin:0;padding:0}button:disabled{cursor:default}input,select,textarea{font:inherit;letter-spacing:inherit;color:inherit;margin:0}a{color:inherit}h2,p,ul{margin:0}ul{padding:0;list-style:none}::placeholder{color:var(--fg-hint);opacity:1}::selection{background:var(--accent-mid)}button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}[role=switch]:focus-visible{outline:2px solid var(--accent);outline-offset:2px}.vedit-svg{place-items:center;line-height:0;display:inline-grid}.vedit-svg>svg{width:100%;height:100%}.vedit-spin{animation:.8s linear infinite vedit-spin}@keyframes vedit-spin{to{transform:rotate(360deg)}}.vedit-toggle{z-index:2147483600;background:var(--accent);height:40px;color:var(--accent-fg);box-shadow:0 10px 30px color-mix(in oklab, var(--accent) 35%, transparent);transition:transform .12s var(--ease), box-shadow .12s var(--ease);border-radius:999px;align-items:center;padding:0 18px;font-weight:600;display:inline-flex;position:fixed;bottom:24px;right:24px}.vedit-toggle:hover{transform:translateY(-1px)}.vedit-overlay{pointer-events:none;z-index:2147483500;position:fixed;top:0;bottom:0;left:0;right:0}.vedit-outline{border:2px solid var(--accent);will-change:transform, width, height;border-radius:4px;position:absolute;top:0;left:0}.vedit-outline[data-kind=hover]{border-style:dashed;border-color:color-mix(in oklab, var(--accent) 70%, transparent)}.vedit-outline[data-kind=selected]{background:color-mix(in oklab, var(--accent) 5%, transparent);box-shadow:0 0 0 4px color-mix(in oklab, var(--accent) 14%, transparent)}.vedit-label{background:var(--accent);max-width:min(360px,100%);height:22px;color:var(--accent-fg);letter-spacing:0;white-space:nowrap;text-overflow:ellipsis;border-radius:6px 6px 0 0;align-items:center;padding:0 9px;font-size:11.5px;font-weight:600;display:inline-flex;position:absolute;top:-22px;left:-2px;overflow:hidden}.vedit-label[data-inside=true]{border-radius:0 0 6px}.vedit-outline[data-kind=hover] .vedit-label{background:color-mix(in oklab, var(--accent) 80%, #fff)}.vedit-gutters{pointer-events:none;position:absolute;top:0;bottom:0;left:0;right:0}.vedit-insert-gutter{background:var(--accent);width:28px;height:28px;color:var(--accent-fg);pointer-events:auto;transition:transform .12s var(--ease);border-radius:999px;place-items:center;display:none;position:absolute;top:0;left:0;box-shadow:0 0 0 3px #fff,0 4px 14px #0f172a40}.vedit-insert-gutter:hover{background:var(--accent-strong)}.vedit-panel{top:var(--squilla-admin-bar-h,0px);z-index:2147483550;background:var(--app-bg);max-width:100vw;box-shadow:var(--shadow-panel);flex-direction:column;display:flex;position:fixed;bottom:0;right:0}@media (max-width:640px){.vedit-panel{width:100%!important}.vedit-resize-handle{display:none}}.vedit-resize-handle{z-index:2;cursor:ew-resize;width:6px;height:100%;position:absolute;top:0;left:-3px}.vedit-resize-handle:hover,.vedit-resize-handle:active{background:var(--accent-mid)}.vedit-panel-header{background:var(--card-bg);border-bottom:1px solid var(--border);align-items:center;gap:4px;min-height:60px;padding:10px 10px 10px 18px;display:flex}.vedit-panel-heading{flex-direction:column;flex:1;gap:1px;min-width:0;display:flex}.vedit-panel-eyebrow{color:var(--fg-subtle);align-items:center;gap:6px;font-size:11.5px;font-weight:500;display:flex}.vedit-panel-title{letter-spacing:-.015em;white-space:nowrap;text-overflow:ellipsis;font-size:15px;font-weight:600;overflow:hidden}.vedit-panel-body{overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#0f172a38 transparent;flex-direction:column;flex:1;gap:10px;min-height:0;padding:14px 14px 24px;display:flex;overflow-y:auto}.vedit-section-head{align-items:center;gap:8px;padding:0 2px;display:flex}.vedit-section-title{letter-spacing:.04em;text-transform:uppercase;color:var(--fg-subtle);font-size:11.5px;font-weight:600}.vedit-count{background:var(--card-bg);min-width:20px;height:18px;box-shadow:inset 0 0 0 1px var(--border);font-family:var(--font-mono);color:var(--fg-muted);border-radius:999px;place-items:center;padding:0 6px;font-size:11px;font-weight:600;display:inline-grid}.vedit-panel-footer{background:var(--card-bg);border-top:1px solid var(--border);align-items:center;gap:8px;min-height:60px;padding:10px 14px 10px 18px;display:flex}.vedit-footer-status{min-width:0;color:var(--fg-subtle);text-overflow:ellipsis;white-space:nowrap;flex:1;align-items:center;gap:6px;font-size:12.5px;display:inline-flex;overflow:hidden}.vedit-footer-status[data-tone=dirty]{color:var(--warning);font-weight:500}.vedit-footer-status[data-tone=dirty]:before{content:\"\";background:currentColor;border-radius:999px;flex-shrink:0;width:7px;height:7px}.vedit-footer-status[data-tone=danger]{color:var(--danger);white-space:normal}.vedit-toast{color:#fff;height:34px;box-shadow:var(--shadow-pop);pointer-events:none;animation:vedit-toast-in .18s var(--ease);background:#111827;border-radius:999px;align-items:center;gap:7px;padding:0 14px;font-size:12.5px;font-weight:500;display:inline-flex;position:absolute;bottom:74px;left:50%;transform:translate(-50%)}@keyframes vedit-toast-in{0%{opacity:0;transform:translate(-50%,6px)}}.vedit-btn{border-radius:var(--radius-md);white-space:nowrap;justify-content:center;align-items:center;gap:6px;height:34px;padding:0 14px;font-size:13px;font-weight:500;transition:background-color .12s,border-color .12s,color .12s,box-shadow .12s;display:inline-flex}.vedit-btn[data-size=sm]{height:28px;padding:0 10px;font-size:12.5px}.vedit-btn[data-variant=primary]{background:var(--accent);color:var(--accent-fg);box-shadow:var(--shadow-sm)}.vedit-btn[data-variant=primary]:hover:not(:disabled){background:var(--accent-strong)}.vedit-btn[data-variant=secondary]{background:var(--card-bg);color:var(--fg);box-shadow:inset 0 0 0 1px var(--border-input), var(--shadow-sm)}.vedit-btn[data-variant=secondary]:hover:not(:disabled){background:var(--hover-bg)}.vedit-btn[data-variant=ghost-danger]{color:var(--danger)}.vedit-btn[data-variant=ghost-danger]:hover:not(:disabled){background:var(--danger-bg)}.vedit-btn:disabled{opacity:.45}.vedit-icon-btn{width:30px;height:30px;color:var(--fg-muted);border-radius:6px;flex-shrink:0;place-items:center;text-decoration:none;transition:background-color .12s,color .12s;display:inline-grid}.vedit-icon-btn:hover:not(:disabled){background:var(--hover-overlay);color:var(--fg)}.vedit-icon-btn[data-tone=danger]:hover:not(:disabled){background:var(--danger-bg);color:var(--danger)}.vedit-icon-btn:disabled{opacity:.32}.vedit-icon-btn[data-size=sm]{width:26px;height:26px}.vedit-chevron{transition:transform .15s var(--ease)}.vedit-text-action{height:28px;color:var(--fg-muted);border-radius:6px;align-items:center;gap:6px;padding:0 9px;font-size:12.5px;font-weight:500;transition:background-color .12s,color .12s;display:inline-flex}.vedit-text-action:hover{background:var(--hover-overlay);color:var(--fg)}.vedit-add-button{border:1.5px dashed var(--border-input);border-radius:var(--radius-lg);width:100%;height:44px;color:var(--fg-2);flex-shrink:0;justify-content:center;align-items:center;gap:7px;font-size:13.5px;font-weight:500;transition:background-color .14s,border-color .14s,color .14s;display:inline-flex}.vedit-add-button:hover:not(:disabled){border-color:var(--accent);background:var(--accent-soft);color:var(--accent-strong)}.vedit-add-button:disabled{opacity:.5}.vedit-add-button[data-size=sm]{border-radius:var(--radius-md);height:36px;font-size:13px}.vedit-add-button[data-fit]{width:auto;padding:0 14px}.vedit-block-list{flex-direction:column;gap:10px;display:flex}.vedit-card{background:var(--card-bg);border:1px solid var(--border-strong);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);transition:border-color .14s,box-shadow .14s;position:relative}.vedit-card:hover{border-color:var(--border-hover)}.vedit-card[data-state=open]{border-color:color-mix(in oklab, var(--accent) 45%, var(--border-strong));box-shadow:var(--shadow-md)}.vedit-card[data-dragging]{z-index:5;box-shadow:var(--shadow-pop);opacity:.92}.vedit-card-header{cursor:pointer;-webkit-user-select:none;user-select:none;border-radius:calc(var(--radius-lg) - 1px);align-items:center;gap:4px;min-height:54px;padding:8px 6px 8px 4px;transition:background-color .12s;display:flex;container:vedit-card/inline-size}.vedit-card[data-state=closed]>.vedit-card-header:hover{background:var(--sub-bg)}.vedit-card[data-state=open]>.vedit-card-header{background:var(--sub-bg);border-bottom:1px solid var(--border);border-bottom-right-radius:0;border-bottom-left-radius:0}.vedit-grip{width:22px;height:34px;color:var(--fg-hint);cursor:grab;touch-action:none;border-radius:5px;flex-shrink:0;place-items:center;display:inline-grid}.vedit-grip:hover{background:var(--hover-overlay);color:var(--fg-muted)}.vedit-grip:active{cursor:grabbing}.vedit-card-toggle{text-align:left;flex:1;align-items:center;gap:10px;min-width:0;display:flex}.vedit-index{background:var(--hover-bg);min-width:24px;height:24px;box-shadow:inset 0 0 0 1px var(--border);color:var(--fg-muted);font-family:var(--font-mono);font-variant-numeric:tabular-nums;letter-spacing:0;border-radius:6px;flex-shrink:0;place-items:center;padding:0 6px;font-size:11.5px;font-weight:600;display:inline-grid}.vedit-card[data-state=open]>.vedit-card-header .vedit-index{background:var(--accent);box-shadow:none;color:var(--accent-fg)}.vedit-block-icon{background:var(--accent-soft);width:30px;height:30px;color:var(--accent-strong);border-radius:7px;flex-shrink:0;place-items:center;line-height:1;display:inline-grid}.vedit-block-icon .vedit-svg{width:16px;height:16px}.vedit-block-icon .vedit-svg svg{stroke-width:1.9px}.vedit-block-emoji{font-size:16px}.vedit-card-text{flex-direction:column;flex:1;gap:1px;min-width:0;display:flex}.vedit-card-titlerow{align-items:center;gap:7px;min-width:0;display:flex}.vedit-card-title{text-overflow:ellipsis;white-space:nowrap;letter-spacing:-.012em;font-size:14px;font-weight:600;overflow:hidden}.vedit-card-summary{text-overflow:ellipsis;white-space:nowrap;color:var(--fg-muted);font-size:12.5px;overflow:hidden}.vedit-badge{letter-spacing:.02em;border-radius:999px;flex-shrink:0;align-items:center;height:18px;padding:0 7px;font-size:10.5px;font-weight:600;display:inline-flex}.vedit-badge[data-tone=accent]{background:var(--accent-soft);color:var(--accent-strong);box-shadow:inset 0 0 0 1px var(--accent-mid)}.vedit-badge[data-tone=danger]{background:var(--danger-bg);color:var(--danger);box-shadow:inset 0 0 0 1px var(--danger-border)}.vedit-card-actions{flex-shrink:0;align-items:center;gap:1px;display:flex}.vedit-card-divider{background:var(--border);width:1px;height:20px;margin:0 3px}.vedit-confirm-delete{background:var(--danger);color:#fff;height:28px;animation:vedit-toast-in .14s var(--ease);border-radius:6px;padding:0 9px;font-size:12px;font-weight:600}.vedit-confirm-delete:hover{background:color-mix(in oklab, var(--danger) 85%, #000)}@container vedit-card (width<=420px){.vedit-card-header .vedit-block-icon,.vedit-card-actions [data-optional],.vedit-card-divider{display:none}}.vedit-card-body{flex-direction:column;gap:16px;padding:18px 18px 20px;display:flex}.vedit-card-description{color:var(--fg-muted);align-items:flex-start;gap:8px;font-size:13px;line-height:1.5;display:flex}.vedit-card-description svg{color:var(--fg-subtle);flex-shrink:0;margin-top:2px}.vedit-empty-state{border-radius:var(--radius-lg);background:var(--card-bg);border:1px solid var(--border);text-align:center;flex-direction:column;align-items:center;gap:4px;padding:32px 16px;display:flex}.vedit-empty-icon{background:var(--accent-soft);width:40px;height:40px;color:var(--accent-strong);border-radius:10px;place-items:center;margin-bottom:6px;display:inline-grid}.vedit-empty-title{font-size:14px;font-weight:600}.vedit-empty-text{color:var(--fg-muted);font-size:13px}.vedit-empty{text-align:center;color:var(--fg-subtle);padding:22px 12px;font-size:13px}.vedit-muted-note{color:var(--fg-muted);font-size:13px}.vedit-alert{border-radius:var(--radius-md);align-items:flex-start;gap:8px;padding:9px 12px;font-size:12.5px;line-height:1.45;display:flex}.vedit-alert svg{flex-shrink:0;margin-top:1px}.vedit-alert[data-tone=danger]{background:var(--danger-bg);color:var(--danger);box-shadow:inset 0 0 0 1px var(--danger-border)}.vedit-alert[data-tone=warning]{background:var(--warning-bg);color:var(--warning);box-shadow:inset 0 0 0 1px color-mix(in oklab, var(--warning) 24%, transparent)}.vedit-alert[data-tone=info]{background:var(--accent-soft);color:var(--accent-strong);box-shadow:inset 0 0 0 1px var(--accent-mid)}.vedit-status-pill{background:var(--warning-bg);height:17px;color:var(--warning);text-transform:capitalize;letter-spacing:0;border-radius:999px;align-items:center;padding:0 6px;font-size:10.5px;font-weight:600;display:inline-flex}.vedit-fields{flex-wrap:wrap;gap:18px 14px;display:flex;container:vedit-fields/inline-size}.vedit-field{flex-direction:column;gap:7px;min-width:0;display:flex}@container vedit-fields (width<=340px){.vedit-field{flex:0 0 100%!important;max-width:100%!important}}.vedit-field-label{color:var(--fg);align-items:center;gap:3px;font-size:13px;font-weight:500;display:flex}.vedit-field-label[data-size=sm]{color:var(--fg-muted);font-size:12px}.vedit-required{color:var(--danger)}.vedit-field-hint{color:var(--fg-muted);margin-top:-3px;font-size:12.5px;line-height:1.45}.vedit-field-switch{justify-content:flex-end}.vedit-input{border-radius:var(--radius-md);background:var(--card-bg);width:100%;height:34px;box-shadow:inset 0 0 0 1px var(--border-input), 0 1px 1px #0f172a08;color:var(--fg);border:0;outline:none;padding:0 10px;font-size:14px;transition:box-shadow .12s}.vedit-input:hover{box-shadow:inset 0 0 0 1px var(--border-hover)}.vedit-input:focus{box-shadow:inset 0 0 0 1px var(--accent), 0 0 0 3px var(--accent-mid)}.vedit-input[aria-invalid=true]{box-shadow:inset 0 0 0 1px var(--danger), 0 0 0 3px var(--danger-border)}.vedit-input[data-size=sm]{height:30px;font-size:13px}.vedit-textarea{resize:vertical;height:auto;min-height:84px;padding:8px 10px;line-height:1.5}.vedit-mono{font-family:var(--font-mono);font-size:12.5px}.vedit-select{-webkit-appearance:none;appearance:none;cursor:pointer;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23636c7b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\");background-position:right 9px center;background-repeat:no-repeat;padding-right:30px}.vedit-input[type=search]::-webkit-search-cancel-button{cursor:pointer}.vedit-input-group{border-radius:var(--radius-md);display:flex}.vedit-input-group .vedit-input{border-radius:0;flex:1;min-width:0}.vedit-input-group .vedit-input:first-child{border-radius:var(--radius-md) 0 0 var(--radius-md)}.vedit-input-group .vedit-input:last-child{border-radius:0 var(--radius-md) var(--radius-md) 0}.vedit-addon{background:var(--sub-bg);box-shadow:inset 0 0 0 1px var(--border-input);color:var(--fg-muted);white-space:nowrap;align-items:center;padding:0 10px;font-size:13px;display:inline-flex}.vedit-addon:first-child{border-radius:var(--radius-md) 0 0 var(--radius-md)}.vedit-addon:last-child{border-radius:0 var(--radius-md) var(--radius-md) 0}.vedit-search{flex-shrink:0;position:relative}.vedit-search .vedit-input{padding-left:32px}.vedit-search-icon{color:var(--fg-subtle);pointer-events:none;position:absolute;top:50%;left:10px;transform:translateY(-50%)}.vedit-switch{background:var(--border-strong);border-radius:999px;flex-shrink:0;width:36px;height:20px;transition:background-color .15s;position:relative}.vedit-switch[aria-checked=true]{background:var(--accent)}.vedit-switch-thumb{width:16px;height:16px;transition:transform .15s var(--ease);background:#fff;border-radius:999px;position:absolute;top:2px;left:2px;box-shadow:0 1px 2px #0f172a40}.vedit-switch[aria-checked=true] .vedit-switch-thumb{transform:translate(16px)}.vedit-switch-row{min-height:34px;color:var(--fg-muted);cursor:pointer;align-items:center;gap:10px;font-size:13px;display:inline-flex}.vedit-choice-list{flex-direction:column;gap:8px;display:flex}.vedit-choice{cursor:pointer;align-items:center;gap:9px;font-size:13.5px;display:inline-flex}.vedit-choice input{width:16px;height:16px;accent-color:var(--accent);cursor:pointer}.vedit-range{align-items:center;gap:12px;min-height:34px;display:flex}.vedit-range input[type=range]{accent-color:var(--accent);flex:1}.vedit-range-value{background:var(--sub-bg);min-width:44px;box-shadow:inset 0 0 0 1px var(--border);text-align:center;font-family:var(--font-mono);font-variant-numeric:tabular-nums;border-radius:6px;padding:3px 8px;font-size:12px}.vedit-color{align-items:center;gap:8px;display:flex}.vedit-color-picker{border-radius:var(--radius-md);background:var(--card-bg);width:42px;height:34px;box-shadow:inset 0 0 0 1px var(--border-input);cursor:pointer;border:0;flex-shrink:0;padding:3px}.vedit-color .vedit-input{max-width:140px}.vedit-subcard{border-radius:var(--radius-md);background:var(--sub-bg);box-shadow:inset 0 0 0 1px var(--border);padding:14px}.vedit-subcard .vedit-fields{gap:14px}.vedit-repeater{flex-direction:column;gap:8px;display:flex}.vedit-repeater-tools{justify-content:flex-end;margin:-4px 0 -2px;display:flex}.vedit-row{background:var(--card-bg);border:1px solid var(--border-strong);border-radius:var(--radius-md);overflow:hidden}.vedit-row-header{background:var(--sub-bg);cursor:pointer;-webkit-user-select:none;user-select:none;align-items:center;gap:6px;min-height:42px;padding:6px 4px 6px 10px;transition:background-color .12s;display:flex}.vedit-row-header:hover{background:var(--hover-bg)}.vedit-row[data-state=open]>.vedit-row-header{border-bottom:1px solid var(--border)}.vedit-row[data-state=open]>.vedit-row-header .vedit-index{background:var(--card-bg);box-shadow:inset 0 0 0 1px var(--border-hover);color:var(--fg)}.vedit-row-toggle{text-align:left;flex:1;align-items:center;gap:9px;min-width:0;display:flex}.vedit-row-summary{text-overflow:ellipsis;white-space:nowrap;font-size:13.5px;font-weight:500;overflow:hidden}.vedit-row-summary[data-empty]{color:var(--fg-subtle);font-weight:400}.vedit-row-actions{flex-shrink:0;align-items:center;gap:1px;display:flex}.vedit-row-body{padding:14px 14px 16px}.vedit-media-empty{border:1.5px dashed var(--border-input);border-radius:var(--radius-md);width:100%;height:64px;color:var(--fg-muted);justify-content:center;align-items:center;gap:8px;font-size:13px;font-weight:500;transition:background-color .14s,border-color .14s,color .14s;display:flex}.vedit-media-empty:hover{border-color:var(--accent);background:var(--accent-soft);color:var(--accent-strong)}.vedit-image-card{border-radius:var(--radius-md);background:var(--card-bg);box-shadow:inset 0 0 0 1px var(--border-input);gap:12px;padding:8px;display:flex}.vedit-image-thumb{width:92px;height:92px;color:var(--fg-subtle);background:repeating-conic-gradient(#eef1f5 0% 25%,#fff 0% 50%) 50%/14px 14px;border-radius:6px;flex-shrink:0;place-items:center;display:grid;overflow:hidden}.vedit-image-thumb img{object-fit:cover;width:100%;height:100%;display:block}.vedit-image-thumb:hover img{opacity:.85}.vedit-image-meta{flex-direction:column;flex:1;justify-content:center;gap:7px;min-width:0;display:flex}.vedit-image-name{white-space:nowrap;text-overflow:ellipsis;align-items:baseline;gap:8px;min-width:0;font-size:12.5px;font-weight:500;display:flex;overflow:hidden}.vedit-image-dims{font-family:var(--font-mono);color:var(--fg-subtle);flex-shrink:0;font-size:11px;font-weight:400}.vedit-inline-actions{gap:6px;display:flex}.vedit-file-card{border-radius:var(--radius-md);background:var(--card-bg);box-shadow:inset 0 0 0 1px var(--border-input);align-items:center;gap:8px;padding:6px 6px 6px 8px;display:flex}.vedit-file-icon{background:var(--sub-bg);width:30px;height:30px;color:var(--fg-muted);border-radius:6px;flex-shrink:0;place-items:center;display:inline-grid}.vedit-file-name{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;font-size:13px;font-weight:500;text-decoration:none;overflow:hidden}.vedit-file-name:hover{color:var(--accent);text-decoration:underline}.vedit-gallery-field{flex-direction:column;gap:8px;display:flex}.vedit-gallery{grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:6px;display:grid}.vedit-gallery-tile{aspect-ratio:1;background:var(--sub-bg);box-shadow:inset 0 0 0 1px var(--border);border-radius:6px;position:relative;overflow:hidden}.vedit-gallery-tile img{object-fit:cover;width:100%;height:100%;display:block}.vedit-gallery-actions{opacity:0;gap:2px;transition:opacity .12s;display:flex;position:absolute;bottom:4px;right:4px}.vedit-gallery-tile:hover .vedit-gallery-actions,.vedit-gallery-tile:focus-within .vedit-gallery-actions{opacity:1}.vedit-gallery-actions button{color:#fff;background:#111827c7;border-radius:5px;place-items:center;width:22px;height:22px;display:inline-grid}.vedit-gallery-actions button:hover:not(:disabled){background:#111827}.vedit-gallery-actions button[data-tone=danger]:hover{background:var(--danger)}.vedit-gallery-actions button:disabled{opacity:.4}.vedit-media-grid{grid-template-columns:repeat(auto-fill,minmax(124px,1fr));align-content:start;gap:10px;min-height:0;padding:2px;display:grid;overflow-y:auto}.vedit-media-tile{border-radius:var(--radius-lg);text-align:left;flex-direction:column;gap:6px;padding:6px;transition:background-color .12s,box-shadow .12s;display:flex}.vedit-media-tile:hover{background:var(--hover-bg)}.vedit-media-tile[data-selected]{background:var(--accent-soft);box-shadow:inset 0 0 0 2px var(--accent)}.vedit-media-preview{aspect-ratio:4/3;background:var(--sub-bg);color:var(--fg-subtle);border-radius:7px;place-items:center;display:grid;position:relative;overflow:hidden}.vedit-media-preview img{object-fit:cover;width:100%;height:100%;display:block}.vedit-media-check{background:var(--accent);color:#fff;border-radius:999px;place-items:center;min-width:22px;height:22px;padding:0 5px;font-size:11.5px;font-weight:700;display:inline-grid;position:absolute;top:6px;right:6px;box-shadow:0 0 0 2px #fff}.vedit-media-name{text-overflow:ellipsis;white-space:nowrap;color:var(--fg-muted);padding:0 2px;font-size:11.5px;overflow:hidden}.vedit-ref{flex-direction:column;gap:8px;display:flex}.vedit-ref-list{border-radius:var(--radius-lg);background:var(--card-bg);box-shadow:inset 0 0 0 1px var(--border-input);overflow:hidden}.vedit-ref-row{align-items:center;gap:10px;padding:8px 6px 8px 8px;display:flex}.vedit-ref-row+.vedit-ref-row{border-top:1px solid var(--divider)}.vedit-ref-row[data-missing] .vedit-ref-title,.vedit-ref-row[data-missing] .vedit-ref-meta{color:var(--danger)}.vedit-ref-thumb{background:var(--accent-soft);width:40px;height:40px;color:var(--accent-strong);border-radius:8px;flex-shrink:0;place-items:center;font-size:15px;font-weight:700;display:inline-grid;overflow:hidden}.vedit-ref-thumb[data-size=lg]{width:46px;height:46px}.vedit-ref-thumb img{object-fit:cover;width:100%;height:100%;display:block}.vedit-ref-text{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}.vedit-ref-title{text-overflow:ellipsis;white-space:nowrap;font-size:13.5px;font-weight:600;overflow:hidden}.vedit-ref-meta{min-width:0;color:var(--fg-subtle);align-items:center;gap:6px;font-size:12px;display:flex}.vedit-ref-url{text-overflow:ellipsis;white-space:nowrap;font-family:var(--font-mono);font-size:11.5px;overflow:hidden}.vedit-ref-actions{opacity:.6;flex-shrink:0;gap:1px;transition:opacity .15s;display:flex}.vedit-ref-row:hover .vedit-ref-actions,.vedit-ref-row:focus-within .vedit-ref-actions{opacity:1}.vedit-ref-footer{justify-content:space-between;align-items:center;gap:8px;display:flex}.vedit-ref-results{flex-direction:column;gap:3px;min-height:120px;margin:0 -6px;padding:2px 6px;display:flex;overflow-y:auto}.vedit-ref-result{text-align:left;border-radius:9px;align-items:center;gap:12px;width:100%;padding:7px 10px 7px 7px;transition:background-color .1s,box-shadow .1s;display:flex}.vedit-ref-result:hover{background:var(--hover-bg)}.vedit-ref-result[data-selected]{background:var(--accent-soft);box-shadow:inset 0 0 0 1px var(--accent-mid)}.vedit-ref-check{width:22px;height:22px;box-shadow:inset 0 0 0 1.5px var(--border-input);color:#fff;border-radius:999px;flex-shrink:0;place-items:center;transition:background-color .1s;display:inline-grid}.vedit-ref-result[data-selected] .vedit-ref-check{background:var(--accent);box-shadow:none}.vedit-chip-row{align-items:center;gap:6px;display:flex}.vedit-chip{background:var(--accent-soft);height:30px;box-shadow:inset 0 0 0 1px var(--accent-mid);color:var(--accent-strong);border-radius:999px;align-items:center;gap:6px;padding:0 11px;font-size:13px;font-weight:500;display:inline-flex}.vedit-option-list{flex-direction:column;gap:2px;min-height:80px;margin:0 -6px;padding:0 6px;display:flex;overflow-y:auto}.vedit-option{text-align:left;border-radius:7px;justify-content:space-between;align-items:center;gap:10px;width:100%;min-height:36px;padding:6px 10px;display:flex}.vedit-option:hover{background:var(--hover-bg)}.vedit-option[data-selected]{background:var(--accent-soft);color:var(--accent-strong)}.vedit-option-label{font-size:13.5px;font-weight:500}.vedit-option-meta{font-family:var(--font-mono);color:var(--fg-subtle);font-size:11.5px}.vedit-tabs{background:var(--sub-bg);box-shadow:inset 0 0 0 1px var(--border);border-radius:9px;flex-shrink:0;gap:2px;padding:3px;display:flex;overflow-x:auto}.vedit-tab{height:28px;color:var(--fg-muted);white-space:nowrap;border-radius:6px;flex:1 0 auto;justify-content:center;align-items:center;gap:6px;padding:0 12px;font-size:12.5px;font-weight:500;display:inline-flex}.vedit-tab:hover{color:var(--fg)}.vedit-tab[data-active=true]{background:var(--card-bg);color:var(--fg);box-shadow:var(--shadow-sm), inset 0 0 0 1px var(--border)}.vedit-tab-count{font-family:var(--font-mono);color:var(--fg-subtle);font-size:10.5px}.vedit-emoji-field,.vedit-icon-field{align-items:center;gap:8px;display:flex}.vedit-emoji-field .vedit-input{max-width:200px}.vedit-emoji-trigger,.vedit-icon-trigger{border-radius:var(--radius-md);background:var(--card-bg);width:44px;height:40px;box-shadow:inset 0 0 0 1px var(--border-input), 0 1px 1px #0f172a08;color:var(--fg-subtle);flex-shrink:0;place-items:center;font-size:23px;line-height:1;transition:background-color .12s,box-shadow .12s;display:inline-grid}.vedit-emoji-trigger:hover,.vedit-icon-trigger:hover{background:var(--hover-bg);box-shadow:inset 0 0 0 1px var(--border-hover)}.vedit-icon-trigger{color:var(--fg)}.vedit-icon-trigger .vedit-svg{width:22px;height:22px}.vedit-icon-name{min-width:0;font-family:var(--font-mono);color:var(--fg-2);white-space:nowrap;text-overflow:ellipsis;flex:1;align-items:center;gap:7px;font-size:12.5px;display:flex;overflow:hidden}.vedit-icon-name[data-unknown]{color:var(--danger)}.vedit-icon-provider{background:var(--sub-bg);box-shadow:inset 0 0 0 1px var(--border);font-family:var(--font-body);color:var(--fg-subtle);border-radius:999px;flex-shrink:0;padding:1px 6px;font-size:10.5px}.vedit-emoji-tabs{flex-shrink:0;gap:2px;display:flex;overflow-x:auto}.vedit-emoji-tabs button{opacity:.65;border-radius:7px;flex-shrink:0;place-items:center;width:34px;height:32px;font-size:18px;line-height:1;display:inline-grid}.vedit-emoji-tabs button:hover{background:var(--hover-bg);opacity:1}.vedit-emoji-tabs button[aria-selected=true]{background:var(--sub-bg);box-shadow:inset 0 0 0 1px var(--border);opacity:1}.vedit-emoji-heading{letter-spacing:.04em;text-transform:uppercase;color:var(--fg-subtle);flex-shrink:0;font-size:11px;font-weight:600}.vedit-emoji-scroll,.vedit-icon-scroll{flex-direction:column;flex:1 1 0;gap:10px;min-height:0;margin:0 -4px;padding:0 4px;display:flex;overflow-y:auto}.vedit-emoji-grid{grid-template-columns:repeat(auto-fill,minmax(38px,1fr));gap:2px;display:grid}.vedit-emoji-grid button{border-radius:7px;place-items:center;height:38px;font-size:23px;line-height:1;display:inline-grid}.vedit-emoji-grid button:hover{background:var(--hover-bg);outline:none}.vedit-emoji-grid button:focus-visible{background:var(--hover-bg);outline:none}.vedit-icon-grid{grid-template-columns:repeat(auto-fill,minmax(46px,1fr));gap:4px;display:grid}.vedit-icon-cell{height:46px;color:var(--fg);border-radius:8px;place-items:center;display:inline-grid}.vedit-icon-cell .vedit-svg{width:22px;height:22px}.vedit-icon-cell:hover{background:var(--hover-bg)}.vedit-icon-cell[data-selected]{background:var(--accent-soft);box-shadow:inset 0 0 0 2px var(--accent);color:var(--accent-strong)}.vedit-modal-backdrop{z-index:2147483560;background:#0f172a6b;justify-content:center;align-items:center;padding:24px;animation:.14s vedit-fade;display:flex;position:fixed;top:0;bottom:0;left:0;right:0}@keyframes vedit-fade{0%{opacity:0}}.vedit-modal{border-radius:var(--radius-xl);background:var(--card-bg);width:100%;max-width:560px;max-height:min(720px,100vh - 48px);box-shadow:var(--shadow-pop), 0 30px 80px #0f172a38;animation:vedit-pop .16s var(--ease);flex-direction:column;display:flex;overflow:hidden}@keyframes vedit-pop{0%{opacity:0;transform:translateY(6px)scale(.985)}}.vedit-modal[data-size=sm]{max-width:420px}.vedit-modal[data-size=lg]{max-width:880px}.vedit-modal-header{align-items:flex-start;gap:12px;padding:18px 14px 4px 20px;display:flex}.vedit-modal-heading{flex-direction:column;flex:1;gap:3px;min-width:0;padding-top:3px;display:flex}.vedit-modal-title{letter-spacing:-.015em;font-size:16px;font-weight:600}.vedit-modal-subtitle{color:var(--fg-muted);font-size:13px}.vedit-modal-body{flex-direction:column;flex:1;gap:12px;min-height:0;padding:12px 20px 20px;display:flex;overflow:hidden}.vedit-modal-footer{border-top:1px solid var(--border);background:var(--sub-bg);justify-content:flex-end;align-items:center;gap:8px;padding:12px 20px;display:flex}.vedit-modal-count{color:var(--fg-muted);margin-right:auto;font-size:12.5px}.vedit-ref-modal .vedit-modal-body,.vedit-emoji-modal .vedit-modal-body,.vedit-icon-modal .vedit-modal-body{min-height:0}.vedit-modal[data-size=lg],.vedit-ref-modal,.vedit-icon-modal{height:min(720px,100vh - 48px)}.vedit-emoji-modal{height:min(560px,100vh - 48px)}.vedit-picker-grid{grid-template-columns:repeat(auto-fill,minmax(230px,1fr));align-content:start;gap:8px;min-height:0;margin:0 -4px;padding:2px 4px 4px;display:grid;overflow-y:auto}.vedit-picker-tile{border-radius:var(--radius-lg);background:var(--card-bg);box-shadow:inset 0 0 0 1px var(--border-strong);text-align:left;align-items:flex-start;gap:11px;padding:12px;transition:box-shadow .12s,background-color .12s;display:flex}.vedit-picker-tile:hover{background:var(--accent-soft);box-shadow:inset 0 0 0 1px var(--accent), var(--shadow-sm)}.vedit-picker-text{flex-direction:column;gap:2px;min-width:0;padding-top:1px;display:flex}.vedit-picker-label{font-size:13.5px;font-weight:600}.vedit-picker-desc{-webkit-line-clamp:2;color:var(--fg-muted);-webkit-box-orient:vertical;font-size:12px;line-height:1.45;display:-webkit-box;overflow:hidden}.vedit-tiptap{border-radius:var(--radius-md);background:var(--card-bg);box-shadow:inset 0 0 0 1px var(--border-input);overflow:hidden}.vedit-tiptap:focus-within{box-shadow:inset 0 0 0 1px var(--accent), 0 0 0 3px var(--accent-mid)}.vedit-tiptap-toolbar{border-bottom:1px solid var(--border);background:var(--sub-bg);flex-wrap:wrap;gap:2px;padding:5px;display:flex}.vedit-tiptap-btn{min-width:28px;height:28px;color:var(--fg-2);border-radius:6px;padding:0 7px;font-size:12.5px}.vedit-tiptap-btn:hover:not(:disabled){background:var(--hover-overlay);color:var(--fg)}.vedit-tiptap-btn[data-active=true]{background:var(--card-bg);color:var(--accent-strong);box-shadow:inset 0 0 0 1px var(--accent-mid)}.vedit-tiptap-btn:disabled{opacity:.4}.vedit-tiptap-sep{background:var(--border);width:1px;margin:4px 3px}.vedit-tiptap .ProseMirror{outline:none;min-height:140px;max-height:460px;padding:10px 12px;font-size:14px;line-height:1.6;overflow-y:auto}.vedit-tiptap .ProseMirror>:first-child{margin-top:0}.vedit-tiptap .ProseMirror p{margin:0 0 .6em}.vedit-tiptap .ProseMirror h2{margin:.6em 0 .3em;font-size:1.25em;font-weight:700}.vedit-tiptap .ProseMirror h3{margin:.6em 0 .3em;font-size:1.1em;font-weight:700}.vedit-tiptap .ProseMirror ul,.vedit-tiptap .ProseMirror ol{margin:0 0 .6em;padding-left:1.4em}.vedit-tiptap .ProseMirror ul{list-style:outside}.vedit-tiptap .ProseMirror ol{list-style:decimal}.vedit-tiptap .ProseMirror blockquote{border-left:3px solid var(--border-strong);color:var(--fg-muted);margin:0 0 .6em;padding-left:10px}.vedit-tiptap .ProseMirror code{background:var(--sub-bg);font-family:var(--font-mono);border-radius:3px;padding:1px 4px;font-size:.9em}.vedit-tiptap .ProseMirror pre{color:#fff;background:#111827;border-radius:6px;padding:8px 10px;font-size:12px;overflow-x:auto}.vedit-tiptap .ProseMirror a{color:var(--accent);text-decoration:underline}.vedit-tiptap .ProseMirror .rte-table-scroll{margin:0 0 .6em;overflow-x:auto}.vedit-tiptap .ProseMirror table{border-collapse:collapse;table-layout:auto;width:100%;margin:0;font-size:13px}.vedit-tiptap .ProseMirror th,.vedit-tiptap .ProseMirror td{border:1px solid var(--border-strong);vertical-align:top;word-break:normal;overflow-wrap:normal;white-space:normal;min-width:7rem;padding:4px 6px;position:relative}.vedit-tiptap .ProseMirror th code,.vedit-tiptap .ProseMirror td code{white-space:nowrap}.vedit-tiptap .ProseMirror th{background:var(--sub-bg);text-align:left;font-weight:600}.vedit-tiptap .ProseMirror th p,.vedit-tiptap .ProseMirror td p{margin:0}.vedit-tiptap .ProseMirror .selectedCell:after{content:\"\";background:var(--accent);opacity:.15;pointer-events:none;position:absolute;top:0;bottom:0;left:0;right:0}.vedit-tiptap .ProseMirror div[class]:not(.rte-table-scroll){border:1px dashed var(--border-strong);background:var(--sub-bg);border-radius:6px;margin:0 0 .6em;padding:6px 10px}.vedit-tiptap .ProseMirror div[class]:not(.rte-table-scroll)>:last-child{margin-bottom:0}.vedit-tiptap-loading{color:var(--fg-subtle);padding:10px;font-size:12px}@media (prefers-reduced-motion:reduce){*,:before,:after{transition-duration:.01ms!important;animation-duration:.01ms!important}}.vedit-link-add{align-self:flex-start;width:auto;padding:0 14px}.vedit-link-card{border-radius:var(--radius-lg);background:var(--card-bg);min-width:0;box-shadow:inset 0 0 0 1px var(--border-input), 0 1px 1px #0f172a08;align-items:center;gap:4px;padding:5px 5px 5px 6px;transition:box-shadow .12s;display:flex}.vedit-link-card:hover{box-shadow:inset 0 0 0 1px var(--border-hover)}.vedit-link-card:focus-within{box-shadow:inset 0 0 0 1px var(--accent), 0 0 0 3px var(--accent-mid)}.vedit-link-main{text-align:left;border-radius:7px;outline:none;flex:1;align-items:center;gap:10px;min-width:0;padding:2px;display:flex}.vedit-link-icon{background:var(--accent-soft);width:34px;height:34px;color:var(--accent-strong);border-radius:8px;flex-shrink:0;place-items:center;display:inline-grid}.vedit-link-card:-webkit-any([data-kind=external],[data-kind=chat],[data-kind=map]) .vedit-link-icon{background:var(--sub-bg);color:var(--fg-muted);box-shadow:inset 0 0 0 1px var(--border)}.vedit-link-card:is([data-kind=external],[data-kind=chat],[data-kind=map]) .vedit-link-icon{background:var(--sub-bg);color:var(--fg-muted);box-shadow:inset 0 0 0 1px var(--border)}.vedit-link-card[data-kind=empty] .vedit-link-icon{background:var(--warning-bg,#fff7e6);color:var(--warning,#b45309)}.vedit-link-text{flex-direction:column;flex:1;gap:1px;min-width:0;display:flex}.vedit-link-title{text-overflow:ellipsis;white-space:nowrap;color:var(--fg);font-size:13.5px;font-weight:600;overflow:hidden}.vedit-link-title[data-placeholder]{color:var(--fg-muted);font-weight:500}.vedit-link-meta{min-width:0;color:var(--fg-subtle);align-items:center;gap:6px;font-size:12px;display:flex}.vedit-link-kind{color:var(--fg-muted);flex-shrink:0;font-weight:500}.vedit-link-kind:after{content:\"·\";color:var(--fg-hint);margin-left:6px}.vedit-link-url{text-overflow:ellipsis;white-space:nowrap;min-width:0;font-family:var(--font-mono);font-size:11.5px;overflow:hidden}.vedit-link-badge{background:var(--sub-bg);height:17px;box-shadow:inset 0 0 0 1px var(--border);color:var(--fg-muted);border-radius:999px;flex-shrink:0;align-items:center;gap:3px;padding:0 6px;font-size:10.5px;font-weight:600;display:inline-flex}.vedit-link-warn{color:var(--warning,#b45309);align-items:center;gap:4px;font-weight:500;display:inline-flex}.vedit-link-actions{opacity:.65;flex-shrink:0;gap:1px;transition:opacity .15s;display:flex}.vedit-link-card:hover .vedit-link-actions,.vedit-link-card:focus-within .vedit-link-actions{opacity:1}a.vedit-icon-btn{text-decoration:none}.vedit-modal-backdrop:has(>.vedit-link-modal){align-items:flex-start;padding-top:12vh}.vedit-link-modal .vedit-modal-body{overflow-y:auto}.vedit-link-form{flex-direction:column;gap:14px;display:flex}.vedit-link-form .vedit-field{flex-direction:column;gap:6px;display:flex}.vedit-field-error{color:var(--danger);margin:0;font-size:12.5px}.vedit-optional{color:var(--fg-hint);margin-left:4px;font-weight:400}.vedit-combo{background:var(--card-bg);min-width:0;box-shadow:inset 0 0 0 1px var(--border-input), 0 1px 2px #0f172a0a;border-radius:12px;flex-direction:column;display:flex;overflow:hidden}.vedit-combo:focus-within{box-shadow:inset 0 0 0 1px var(--accent), 0 0 0 3px var(--accent-mid)}.vedit-combo[data-error]{box-shadow:inset 0 0 0 1px var(--danger), 0 0 0 3px var(--danger-border)}.vedit-combo-search{border-bottom:1px solid var(--border);height:44px;color:var(--fg-hint);align-items:center;gap:10px;padding:0 6px 0 14px;display:flex}.vedit-combo-search>svg{flex-shrink:0}.vedit-combo-search input{min-width:0;height:100%;color:var(--fg);font:inherit;background:0 0;border:0;outline:none;flex:1;font-size:14px}.vedit-combo-search input::placeholder{color:var(--fg-hint)}.vedit-combo-results{overscroll-behavior:contain;max-height:288px;padding:4px 6px 6px;overflow:hidden auto}.vedit-combo-group{letter-spacing:.04em;text-transform:uppercase;color:var(--fg-hint);padding:10px 8px 4px;font-size:11px;font-weight:600}.vedit-combo-empty{text-align:center;color:var(--fg-subtle);padding:22px 12px;font-size:13px;line-height:1.5}.vedit-combo-foot{border-top:1px solid var(--border);background:var(--sub-bg);color:var(--fg-hint);align-items:center;gap:14px;padding:7px 12px;font-size:11.5px;display:flex}.vedit-combo-foot kbd{background:var(--card-bg);min-width:18px;height:18px;box-shadow:inset 0 0 0 1px var(--border), 0 1px 0 var(--border);color:var(--fg-subtle);border-radius:5px;place-items:center;margin-right:3px;padding:0 4px;font-family:inherit;font-size:11px;display:inline-grid}.vedit-combo-hint{text-overflow:ellipsis;white-space:nowrap;margin-left:auto;overflow:hidden}@media (max-width:560px){.vedit-combo-hint{display:none}}.vedit-link-result{width:100%;min-width:0;height:36px;color:var(--fg-subtle);text-align:left;border-radius:8px;align-items:center;gap:10px;padding:0 10px;display:flex}.vedit-link-result>svg,.vedit-link-result>.vedit-type-icon{flex-shrink:0}.vedit-link-result[data-active]{background:var(--accent-soft);color:var(--accent-strong)}.vedit-link-result-title{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--fg);flex:0 auto;font-size:13.5px;font-weight:500;overflow:hidden}.vedit-link-result[data-active] .vedit-link-result-title{color:var(--accent-strong)}.vedit-link-result-status{background:var(--sub-bg);box-shadow:inset 0 0 0 1px var(--border);text-transform:capitalize;color:var(--fg-subtle);border-radius:999px;flex-shrink:0;padding:1px 6px;font-size:10.5px;font-weight:600}.vedit-link-result-path{text-overflow:ellipsis;white-space:nowrap;text-align:right;min-width:0;font-family:var(--font-mono);color:var(--fg-hint);direction:rtl;flex:1 1 0;font-size:11.5px;overflow:hidden}.vedit-link-result-enter{opacity:0;flex-shrink:0}.vedit-link-result[data-active] .vedit-link-result-enter{opacity:1}.vedit-type-icon{flex-shrink:0;display:inline-grid}.vedit-type-icon .vedit-svg{width:100%;height:100%}.vedit-link-picked{background:var(--card-bg);min-width:0;box-shadow:inset 0 0 0 1px var(--border-input), 0 1px 2px #0f172a0a;border-radius:12px;align-items:center;gap:12px;padding:10px;display:flex}.vedit-link-picked .vedit-link-icon,.vedit-link-picked .vedit-ref-thumb{border-radius:9px;width:40px;height:40px}.vedit-link-picked:-webkit-any([data-kind=external],[data-kind=chat],[data-kind=map]) .vedit-link-icon{background:var(--sub-bg);color:var(--fg-muted);box-shadow:inset 0 0 0 1px var(--border)}.vedit-link-picked:is([data-kind=external],[data-kind=chat],[data-kind=map]) .vedit-link-icon{background:var(--sub-bg);color:var(--fg-muted);box-shadow:inset 0 0 0 1px var(--border)}.vedit-link-picked .vedit-link-title{font-size:14px}.vedit-link-options{justify-content:space-between;align-items:center;gap:10px;display:flex}.vedit-ptabs{background:var(--card-bg);box-shadow:inset 0 -1px 0 var(--border);scrollbar-width:none;flex-shrink:0;gap:2px;padding:0 12px;display:flex;overflow-x:auto}.vedit-ptabs::-webkit-scrollbar{display:none}.vedit-ptab{color:var(--fg-muted);letter-spacing:-.006em;cursor:pointer;background:0 0;border:none;border-bottom:2px solid #0000;border-radius:0;flex:none;align-items:center;gap:7px;padding:13px 12px 11px;font-size:13.5px;font-weight:500;transition:color .12s,border-color .12s;display:flex}.vedit-ptab:hover:not([data-active]){color:var(--fg);border-bottom-color:var(--border-strong)}.vedit-ptab:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}.vedit-ptab[data-active]{color:var(--fg);border-bottom-color:var(--accent);font-weight:600}.vedit-ptab-count{background:var(--hover-bg);min-width:20px;height:18px;color:var(--fg-muted);font-variant-numeric:tabular-nums;border-radius:999px;justify-content:center;align-items:center;padding:0 6px;font-size:11.5px;font-weight:600;display:inline-flex}.vedit-ptab[data-active] .vedit-ptab-count{background:var(--accent-weak);color:var(--accent-strong)}.vedit-ptab-dot{background:var(--accent);border-radius:50%;width:7px;height:7px}.vedit-page-body{flex-direction:column;gap:14px;padding:14px;display:flex}.vedit-page-card .vedit-field{width:100%}.vedit-layout-note{border-radius:var(--radius-md);background:var(--accent-soft);color:var(--fg-2);align-items:flex-start;gap:8px;margin:0;padding:9px 11px;font-size:12.5px;line-height:1.45;display:flex}.vedit-layout-note svg{color:var(--accent);flex-shrink:0;margin-top:2px}.vedit-card-header[data-flat]{padding-left:13px}.vedit-outline[data-kind=field]{border:2px dashed color-mix(in oklab, var(--accent) 75%, transparent);background:color-mix(in oklab, var(--accent) 4%, transparent);border-radius:6px}.vedit-outline[data-kind=field][data-editing=true]{border-style:solid;border-color:var(--accent);box-shadow:0 0 0 4px color-mix(in oklab, var(--accent) 16%, transparent);background:0 0}.vedit-field-action{pointer-events:auto;background:var(--accent);height:28px;color:var(--accent-fg);white-space:nowrap;cursor:pointer;box-shadow:0 4px 14px color-mix(in oklab, var(--accent) 40%, transparent);border-radius:999px;align-items:center;gap:8px;padding:0 4px 0 11px;font-size:12px;font-weight:600;display:inline-flex;position:absolute}.vedit-field-action:hover{background:var(--accent-strong)}.vedit-field-caption{background:#fff3;border-radius:999px;align-items:center;height:20px;padding:0 8px;font-size:11px;font-weight:600;display:inline-flex}.vedit-panel{transition:transform .26s var(--ease), box-shadow .26s var(--ease)}.vedit-panel[data-peek]{transform:translate(calc(100% - 40px))}.vedit-peek-tab{z-index:3;width:40px;color:var(--fg-muted);background:linear-gradient(to right, color-mix(in oklab, var(--app-bg) 70%, transparent), var(--app-bg));cursor:pointer;place-items:start center;padding-top:14px;display:grid;position:absolute;top:0;bottom:0;left:0;right:auto}.vedit-peek-tab:hover{color:var(--accent)}@media (prefers-reduced-motion:reduce){.vedit-panel{transition:none}}";
//#endregion
//#region src/main.tsx
function gw() {
	let e = document.getElementById("__squilla_vedit_config");
	if (!e) return null;
	try {
		let t = JSON.parse(e.textContent ?? "{}");
		return typeof t.nodeId == "number" ? t : null;
	} catch {
		return null;
	}
}
function _w() {
	let e = gw();
	if (!e) {
		console.warn("[squilla:visual-editor] missing or invalid config; skipping");
		return;
	}
	let t = document.createElement("div");
	t.setAttribute("data-vedit-host", ""), t.style.position = "fixed", t.style.zIndex = "2147483600", t.style.top = "0", t.style.left = "0", t.style.pointerEvents = "none", document.body.appendChild(t);
	let n = t.attachShadow({ mode: "open" }), r = document.createElement("style");
	r.textContent = hw, n.appendChild(r);
	let i = document.createElement("div");
	i.style.pointerEvents = "auto", n.appendChild(i);
	let a = document.createElement("div");
	a.style.pointerEvents = "auto", n.appendChild(a), wi(a), (0, v.createRoot)(i).render(/* @__PURE__ */ (0, N.jsx)(_.StrictMode, { children: /* @__PURE__ */ (0, N.jsx)(ow, { config: e }) }));
}
document.readyState === "complete" || document.readyState === "interactive" ? _w() : document.addEventListener("DOMContentLoaded", _w);
//#endregion

//# sourceMappingURL=editor.js.map
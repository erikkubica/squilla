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
	function ee() {}
	var C = {
		H: null,
		A: null,
		T: null,
		S: null
	}, te = Object.prototype.hasOwnProperty;
	function ne(e, n, r) {
		var i = r.ref;
		return {
			$$typeof: t,
			type: e,
			key: n,
			ref: i === void 0 ? null : i,
			props: r
		};
	}
	function re(e, t) {
		return ne(e.type, t, e.props);
	}
	function w(e) {
		return typeof e == "object" && !!e && e.$$typeof === t;
	}
	function ie(e) {
		var t = {
			"=": "=0",
			":": "=2"
		};
		return "$" + e.replace(/[=:]/g, function(e) {
			return t[e];
		});
	}
	var ae = /\/+/g;
	function oe(e, t) {
		return typeof e == "object" && e && e.key != null ? ie("" + e.key) : t.toString(36);
	}
	function se(e) {
		switch (e.status) {
			case "fulfilled": return e.value;
			case "rejected": throw e.reason;
			default: switch (typeof e.status == "string" ? e.then(ee, ee) : (e.status = "pending", e.then(function(t) {
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
	function ce(e, r, i, a, o) {
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
				case d: return c = e._init, ce(c(e._payload), r, i, a, o);
			}
		}
		if (c) return o = o(e), c = a === "" ? "." + oe(e, 0) : a, S(o) ? (i = "", c != null && (i = c.replace(ae, "$&/") + "/"), ce(o, r, i, "", function(e) {
			return e;
		})) : o != null && (w(o) && (o = re(o, i + (o.key == null || e && e.key === o.key ? "" : ("" + o.key).replace(ae, "$&/") + "/") + c)), r.push(o)), 1;
		c = 0;
		var l = a === "" ? "." : a + ":";
		if (S(e)) for (var u = 0; u < e.length; u++) a = e[u], s = l + oe(a, u), c += ce(a, r, i, s, o);
		else if (u = m(e), typeof u == "function") for (e = u.call(e), u = 0; !(a = e.next()).done;) a = a.value, s = l + oe(a, u++), c += ce(a, r, i, s, o);
		else if (s === "object") {
			if (typeof e.then == "function") return ce(se(e), r, i, a, o);
			throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		}
		return c;
	}
	function le(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return ce(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function ue(e) {
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
	var T = typeof reportError == "function" ? reportError : function(e) {
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
	}, E = {
		map: le,
		forEach: function(e, t, n) {
			le(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return le(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return le(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!w(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	};
	e.Activity = f, e.Children = E, e.Component = v, e.Fragment = r, e.Profiler = a, e.PureComponent = b, e.StrictMode = i, e.Suspense = l, e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = C, e.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(e) {
			return C.H.useMemoCache(e);
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
		if (t != null) for (a in t.key !== void 0 && (i = "" + t.key), t) !te.call(t, a) || a === "key" || a === "__self" || a === "__source" || a === "ref" && t.ref === void 0 || (r[a] = t[a]);
		var a = arguments.length - 2;
		if (a === 1) r.children = n;
		else if (1 < a) {
			for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
			r.children = o;
		}
		return ne(e.type, i, r);
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
		if (t != null) for (r in t.key !== void 0 && (a = "" + t.key), t) te.call(t, r) && r !== "key" && r !== "__self" && r !== "__source" && (i[r] = t[r]);
		var o = arguments.length - 2;
		if (o === 1) i.children = n;
		else if (1 < o) {
			for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
			i.children = s;
		}
		if (e && e.defaultProps) for (r in o = e.defaultProps, o) i[r] === void 0 && (i[r] = o[r]);
		return ne(e, a, i);
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = w, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: ue
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = function(e) {
		var t = C.T, n = {};
		C.T = n;
		try {
			var r = e(), i = C.S;
			i !== null && i(n, r), typeof r == "object" && r && typeof r.then == "function" && r.then(ee, T);
		} catch (e) {
			T(e);
		} finally {
			t !== null && n.types !== null && (t.types = n.types), C.T = t;
		}
	}, e.unstable_useCacheRefresh = function() {
		return C.H.useCacheRefresh();
	}, e.use = function(e) {
		return C.H.use(e);
	}, e.useActionState = function(e, t, n) {
		return C.H.useActionState(e, t, n);
	}, e.useCallback = function(e, t) {
		return C.H.useCallback(e, t);
	}, e.useContext = function(e) {
		return C.H.useContext(e);
	}, e.useDebugValue = function() {}, e.useDeferredValue = function(e, t) {
		return C.H.useDeferredValue(e, t);
	}, e.useEffect = function(e, t) {
		return C.H.useEffect(e, t);
	}, e.useEffectEvent = function(e) {
		return C.H.useEffectEvent(e);
	}, e.useId = function() {
		return C.H.useId();
	}, e.useImperativeHandle = function(e, t, n) {
		return C.H.useImperativeHandle(e, t, n);
	}, e.useInsertionEffect = function(e, t) {
		return C.H.useInsertionEffect(e, t);
	}, e.useLayoutEffect = function(e, t) {
		return C.H.useLayoutEffect(e, t);
	}, e.useMemo = function(e, t) {
		return C.H.useMemo(e, t);
	}, e.useOptimistic = function(e, t) {
		return C.H.useOptimistic(e, t);
	}, e.useReducer = function(e, t, n) {
		return C.H.useReducer(e, t, n);
	}, e.useRef = function(e) {
		return C.H.useRef(e);
	}, e.useState = function(e) {
		return C.H.useState(e);
	}, e.useSyncExternalStore = function(e, t, n) {
		return C.H.useSyncExternalStore(e, t, n);
	}, e.useTransition = function() {
		return C.H.useTransition();
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
		if (h = !1, b(e), !m) if (n(c) !== null) m = !0, S || (S = !0, w());
		else {
			var t = n(l);
			t !== null && oe(x, t.startTime - e);
		}
	}
	var S = !1, ee = -1, C = 5, te = -1;
	function ne() {
		return g ? !0 : !(e.unstable_now() - te < C);
	}
	function re() {
		if (g = !1, S) {
			var t = e.unstable_now();
			te = t;
			var i = !0;
			try {
				a: {
					m = !1, h && (h = !1, v(ee), ee = -1), p = !0;
					var a = f;
					try {
						b: {
							for (b(t), d = n(c); d !== null && !(d.expirationTime > t && ne());) {
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
								u !== null && oe(x, u.startTime - t), i = !1;
							}
						}
						break a;
					} finally {
						d = null, f = a, p = !1;
					}
					i = void 0;
				}
			} finally {
				i ? w() : S = !1;
			}
		}
	}
	var w;
	if (typeof y == "function") w = function() {
		y(re);
	};
	else if (typeof MessageChannel < "u") {
		var ie = new MessageChannel(), ae = ie.port2;
		ie.port1.onmessage = re, w = function() {
			ae.postMessage(null);
		};
	} else w = function() {
		_(re, 0);
	};
	function oe(t, n) {
		ee = _(function() {
			t(e.unstable_now());
		}, n);
	}
	e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(e) {
		e.callback = null;
	}, e.unstable_forceFrameRate = function(e) {
		0 > e || 125 < e ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : C = 0 < e ? Math.floor(1e3 / e) : 5;
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
		}, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (v(ee), ee = -1) : h = !0, oe(x, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, S || (S = !0, w()))), r;
	}, e.unstable_shouldYield = ne, e.unstable_wrapCallback = function(e) {
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
	var h = Object.assign, g = Symbol.for("react.element"), _ = Symbol.for("react.transitional.element"), v = Symbol.for("react.portal"), y = Symbol.for("react.fragment"), b = Symbol.for("react.strict_mode"), x = Symbol.for("react.profiler"), S = Symbol.for("react.consumer"), ee = Symbol.for("react.context"), C = Symbol.for("react.forward_ref"), te = Symbol.for("react.suspense"), ne = Symbol.for("react.suspense_list"), re = Symbol.for("react.memo"), w = Symbol.for("react.lazy"), ie = Symbol.for("react.activity"), ae = Symbol.for("react.memo_cache_sentinel"), oe = Symbol.iterator;
	function se(e) {
		return typeof e != "object" || !e ? null : (e = oe && e[oe] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var ce = Symbol.for("react.client.reference");
	function le(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.$$typeof === ce ? null : e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case y: return "Fragment";
			case x: return "Profiler";
			case b: return "StrictMode";
			case te: return "Suspense";
			case ne: return "SuspenseList";
			case ie: return "Activity";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case v: return "Portal";
			case ee: return e.displayName || "Context";
			case S: return (e._context.displayName || "Context") + ".Consumer";
			case C:
				var t = e.render;
				return e = e.displayName, e || (e = t.displayName || t.name || "", e = e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case re: return t = e.displayName || null, t === null ? le(e.type) || "Memo" : t;
			case w:
				t = e._payload, e = e._init;
				try {
					return le(e(t));
				} catch {}
		}
		return null;
	}
	var ue = Array.isArray, T = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, E = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, D = {
		pending: !1,
		data: null,
		method: null,
		action: null
	}, de = [], fe = -1;
	function pe(e) {
		return { current: e };
	}
	function me(e) {
		0 > fe || (e.current = de[fe], de[fe] = null, fe--);
	}
	function O(e, t) {
		fe++, de[fe] = e.current, e.current = t;
	}
	var he = pe(null), ge = pe(null), k = pe(null), _e = pe(null);
	function ve(e, t) {
		switch (O(k, t), O(ge, e), O(he, null), t.nodeType) {
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
		me(he), O(he, e);
	}
	function ye() {
		me(he), me(ge), me(k);
	}
	function be(e) {
		e.memoizedState !== null && O(_e, e);
		var t = he.current, n = qd(t, e.type);
		t !== n && (O(ge, e), O(he, n));
	}
	function xe(e) {
		ge.current === e && (me(he), me(ge)), _e.current === e && (me(_e), tp._currentValue = D);
	}
	var Se, Ce;
	function we(e) {
		if (Se === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			Se = t && t[1] || "", Ce = -1 < e.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + Se + e + Ce;
	}
	var Te = !1;
	function Ee(e, t) {
		if (!e || Te) return "";
		Te = !0;
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
			Te = !1, Error.prepareStackTrace = n;
		}
		return (n = e ? e.displayName || e.name : "") ? we(n) : "";
	}
	function De(e, t) {
		switch (e.tag) {
			case 26:
			case 27:
			case 5: return we(e.type);
			case 16: return we("Lazy");
			case 13: return e.child !== t && t !== null ? we("Suspense Fallback") : we("Suspense");
			case 19: return we("SuspenseList");
			case 0:
			case 15: return Ee(e.type, !1);
			case 11: return Ee(e.type.render, !1);
			case 1: return Ee(e.type, !0);
			case 31: return we("Activity");
			default: return "";
		}
	}
	function Oe(e) {
		try {
			var t = "", n = null;
			do
				t += De(e, n), n = e, e = e.return;
			while (e);
			return t;
		} catch (e) {
			return "\nError generating stack: " + e.message + "\n" + e.stack;
		}
	}
	var ke = Object.prototype.hasOwnProperty, Ae = t.unstable_scheduleCallback, je = t.unstable_cancelCallback, Me = t.unstable_shouldYield, Ne = t.unstable_requestPaint, Pe = t.unstable_now, Fe = t.unstable_getCurrentPriorityLevel, Ie = t.unstable_ImmediatePriority, Le = t.unstable_UserBlockingPriority, Re = t.unstable_NormalPriority, ze = t.unstable_LowPriority, Be = t.unstable_IdlePriority, Ve = t.log, He = t.unstable_setDisableYieldValue, Ue = null, We = null;
	function Ge(e) {
		if (typeof Ve == "function" && He(e), We && typeof We.setStrictMode == "function") try {
			We.setStrictMode(Ue, e);
		} catch {}
	}
	var Ke = Math.clz32 ? Math.clz32 : Ye, qe = Math.log, Je = Math.LN2;
	function Ye(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (qe(e) / Je | 0) | 0;
	}
	var Xe = 256, Ze = 262144, Qe = 4194304;
	function $e(e) {
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
	function et(e, t, n) {
		var r = e.pendingLanes;
		if (r === 0) return 0;
		var i = 0, a = e.suspendedLanes, o = e.pingedLanes;
		e = e.warmLanes;
		var s = r & 134217727;
		return s === 0 ? (s = r & ~a, s === 0 ? o === 0 ? n || (n = r & ~e, n !== 0 && (i = $e(n))) : i = $e(o) : i = $e(s)) : (r = s & ~a, r === 0 ? (o &= s, o === 0 ? n || (n = s & ~e, n !== 0 && (i = $e(n))) : i = $e(o)) : i = $e(r)), i === 0 ? 0 : t !== 0 && t !== i && (t & a) === 0 && (a = i & -i, n = t & -t, a >= n || a === 32 && n & 4194048) ? t : i;
	}
	function tt(e, t) {
		return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
	}
	function nt(e, t) {
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
	function rt() {
		var e = Qe;
		return Qe <<= 1, !(Qe & 62914560) && (Qe = 4194304), e;
	}
	function it(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function at(e, t) {
		e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
	}
	function ot(e, t, n, r, i, a) {
		var o = e.pendingLanes;
		e.pendingLanes = n, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= n, e.entangledLanes &= n, e.errorRecoveryDisabledLanes &= n, e.shellSuspendCounter = 0;
		var s = e.entanglements, c = e.expirationTimes, l = e.hiddenUpdates;
		for (n = o & ~n; 0 < n;) {
			var u = 31 - Ke(n), d = 1 << u;
			s[u] = 0, c[u] = -1;
			var f = l[u];
			if (f !== null) for (l[u] = null, u = 0; u < f.length; u++) {
				var p = f[u];
				p !== null && (p.lane &= -536870913);
			}
			n &= ~d;
		}
		r !== 0 && st(e, r, 0), a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t));
	}
	function st(e, t, n) {
		e.pendingLanes |= t, e.suspendedLanes &= ~t;
		var r = 31 - Ke(t);
		e.entangledLanes |= t, e.entanglements[r] = e.entanglements[r] | 1073741824 | n & 261930;
	}
	function ct(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - Ke(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	function lt(e, t) {
		var n = t & -t;
		return n = n & 42 ? 1 : ut(n), (n & (e.suspendedLanes | t)) === 0 ? n : 0;
	}
	function ut(e) {
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
	function dt(e) {
		return e &= -e, 2 < e ? 8 < e ? e & 134217727 ? 32 : 268435456 : 8 : 2;
	}
	function ft() {
		var e = E.p;
		return e === 0 ? (e = window.event, e === void 0 ? 32 : _p(e.type)) : e;
	}
	function pt(e, t) {
		var n = E.p;
		try {
			return E.p = e, t();
		} finally {
			E.p = n;
		}
	}
	var mt = Math.random().toString(36).slice(2), ht = "__reactFiber$" + mt, gt = "__reactProps$" + mt, _t = "__reactContainer$" + mt, vt = "__reactEvents$" + mt, yt = "__reactListeners$" + mt, bt = "__reactHandles$" + mt, xt = "__reactResources$" + mt, St = "__reactMarker$" + mt;
	function Ct(e) {
		delete e[ht], delete e[gt], delete e[vt], delete e[yt], delete e[bt];
	}
	function wt(e) {
		var t = e[ht];
		if (t) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[_t] || n[ht]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = gf(e); e !== null;) {
					if (n = e[ht]) return n;
					e = gf(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function Tt(e) {
		if (e = e[ht] || e[_t]) {
			var t = e.tag;
			if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
		}
		return null;
	}
	function Et(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
		throw Error(i(33));
	}
	function Dt(e) {
		var t = e[xt];
		return t || (t = e[xt] = {
			hoistableStyles: /* @__PURE__ */ new Map(),
			hoistableScripts: /* @__PURE__ */ new Map()
		}), t;
	}
	function Ot(e) {
		e[St] = !0;
	}
	var kt = /* @__PURE__ */ new Set(), At = {};
	function jt(e, t) {
		Mt(e, t), Mt(e + "Capture", t);
	}
	function Mt(e, t) {
		for (At[e] = t, e = 0; e < t.length; e++) kt.add(t[e]);
	}
	var Nt = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), Pt = {}, Ft = {};
	function It(e) {
		return ke.call(Ft, e) ? !0 : ke.call(Pt, e) ? !1 : Nt.test(e) ? Ft[e] = !0 : (Pt[e] = !0, !1);
	}
	function Lt(e, t, n) {
		if (It(t)) if (n === null) e.removeAttribute(t);
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
	function Rt(e, t, n) {
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
	function zt(e, t, n, r) {
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
	function Bt(e) {
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
	function Vt(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function A(e, t, n) {
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
	function Ht(e) {
		if (!e._valueTracker) {
			var t = Vt(e) ? "checked" : "value";
			e._valueTracker = A(e, t, "" + e[t]);
		}
	}
	function Ut(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = Vt(e) ? e.checked ? "true" : "false" : e.value), e = r, e === n ? !1 : (t.setValue(e), !0);
	}
	function Wt(e) {
		if (e = e || (typeof document < "u" ? document : void 0), e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	var Gt = /[\n"\\]/g;
	function Kt(e) {
		return e.replace(Gt, function(e) {
			return "\\" + e.charCodeAt(0).toString(16) + " ";
		});
	}
	function qt(e, t, n, r, i, a, o, s) {
		e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t == null ? o !== "submit" && o !== "reset" || e.removeAttribute("value") : o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + Bt(t)) : e.value !== "" + Bt(t) && (e.value = "" + Bt(t)), t == null ? n == null ? r != null && e.removeAttribute("value") : Yt(e, o, Bt(n)) : Yt(e, o, Bt(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" ? e.name = "" + Bt(s) : e.removeAttribute("name");
	}
	function Jt(e, t, n, r, i, a, o, s) {
		if (a != null && typeof a != "function" && typeof a != "symbol" && typeof a != "boolean" && (e.type = a), t != null || n != null) {
			if (!(a !== "submit" && a !== "reset" || t != null)) {
				Ht(e);
				return;
			}
			n = n == null ? "" : "" + Bt(n), t = t == null ? n : "" + Bt(t), s || t === e.value || (e.value = t), e.defaultValue = t;
		}
		r = r ?? i, r = typeof r != "function" && typeof r != "symbol" && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o), Ht(e);
	}
	function Yt(e, t, n) {
		t === "number" && Wt(e.ownerDocument) === e || e.defaultValue === "" + n || (e.defaultValue = "" + n);
	}
	function Xt(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + Bt(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function Zt(e, t, n) {
		if (t != null && (t = "" + Bt(t), t !== e.value && (e.value = t), n == null)) {
			e.defaultValue !== t && (e.defaultValue = t);
			return;
		}
		e.defaultValue = n == null ? "" : "" + Bt(n);
	}
	function Qt(e, t, n, r) {
		if (t == null) {
			if (r != null) {
				if (n != null) throw Error(i(92));
				if (ue(r)) {
					if (1 < r.length) throw Error(i(93));
					r = r[0];
				}
				n = r;
			}
			n ?? (n = ""), t = n;
		}
		n = Bt(t), e.defaultValue = n, r = e.textContent, r === n && r !== "" && r !== null && (e.value = r), Ht(e);
	}
	function $t(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var en = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
	function tn(e, t, n) {
		var r = t.indexOf("--") === 0;
		n == null || typeof n == "boolean" || n === "" ? r ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : r ? e.setProperty(t, n) : typeof n != "number" || n === 0 || en.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px";
	}
	function nn(e, t, n) {
		if (t != null && typeof t != "object") throw Error(i(62));
		if (e = e.style, n != null) {
			for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf("--") === 0 ? e.setProperty(r, "") : r === "float" ? e.cssFloat = "" : e[r] = "");
			for (var a in t) r = t[a], t.hasOwnProperty(a) && n[a] !== r && tn(e, a, r);
		} else for (var o in t) t.hasOwnProperty(o) && tn(e, o, t[o]);
	}
	function rn(e) {
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
	var an = new Map([
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
	]), on = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function sn(e) {
		return on.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
	}
	function cn() {}
	var ln = null;
	function un(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var dn = null, fn = null;
	function pn(e) {
		var t = Tt(e);
		if (t && (e = t.stateNode)) {
			var n = e[gt] || null;
			a: switch (e = t.stateNode, t.type) {
				case "input":
					if (qt(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === "radio" && t != null) {
						for (n = e; n.parentNode;) n = n.parentNode;
						for (n = n.querySelectorAll("input[name=\"" + Kt("" + t) + "\"][type=\"radio\"]"), t = 0; t < n.length; t++) {
							var r = n[t];
							if (r !== e && r.form === e.form) {
								var a = r[gt] || null;
								if (!a) throw Error(i(90));
								qt(r, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name);
							}
						}
						for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && Ut(r);
					}
					break a;
				case "textarea":
					Zt(e, n.value, n.defaultValue);
					break a;
				case "select": t = n.value, t != null && Xt(e, !!n.multiple, t, !1);
			}
		}
	}
	var mn = !1;
	function hn(e, t, n) {
		if (mn) return e(t, n);
		mn = !0;
		try {
			return e(t);
		} finally {
			if (mn = !1, (dn !== null || fn !== null) && (Tu(), dn && (t = dn, e = fn, fn = dn = null, pn(t), e))) for (t = 0; t < e.length; t++) pn(e[t]);
		}
	}
	function gn(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var r = n[gt] || null;
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
	var _n = !(typeof window > "u" || window.document === void 0 || window.document.createElement === void 0), vn = !1;
	if (_n) try {
		var yn = {};
		Object.defineProperty(yn, "passive", { get: function() {
			vn = !0;
		} }), window.addEventListener("test", yn, yn), window.removeEventListener("test", yn, yn);
	} catch {
		vn = !1;
	}
	var bn = null, xn = null, Sn = null;
	function Cn() {
		if (Sn) return Sn;
		var e, t = xn, n = t.length, r, i = "value" in bn ? bn.value : bn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return Sn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function wn(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function Tn() {
		return !0;
	}
	function En() {
		return !1;
	}
	function Dn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? Tn : En, this.isPropagationStopped = En, this;
		}
		return h(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = Tn);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = Tn);
			},
			persist: function() {},
			isPersistent: Tn
		}), t;
	}
	var On = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, kn = Dn(On), An = h({}, On, {
		view: 0,
		detail: 0
	}), jn = Dn(An), Mn, Nn, Pn, Fn = h({}, An, {
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
		getModifierState: Kn,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== Pn && (Pn && e.type === "mousemove" ? (Mn = e.screenX - Pn.screenX, Nn = e.screenY - Pn.screenY) : Nn = Mn = 0, Pn = e), Mn);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : Nn;
		}
	}), In = Dn(Fn), Ln = Dn(h({}, Fn, { dataTransfer: 0 })), Rn = Dn(h({}, An, { relatedTarget: 0 })), zn = Dn(h({}, On, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Bn = Dn(h({}, On, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), Vn = Dn(h({}, On, { data: 0 })), Hn = {
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
	}, Un = {
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
	}, Wn = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function Gn(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = Wn[e]) ? !!t[e] : !1;
	}
	function Kn() {
		return Gn;
	}
	var qn = Dn(h({}, An, {
		key: function(e) {
			if (e.key) {
				var t = Hn[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = wn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Un[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: Kn,
		charCode: function(e) {
			return e.type === "keypress" ? wn(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? wn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), Jn = Dn(h({}, Fn, {
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
	})), Yn = Dn(h({}, An, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: Kn
	})), Xn = Dn(h({}, On, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Zn = Dn(h({}, Fn, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), Qn = Dn(h({}, On, {
		newState: 0,
		oldState: 0
	})), $n = [
		9,
		13,
		27,
		32
	], er = _n && "CompositionEvent" in window, tr = null;
	_n && "documentMode" in document && (tr = document.documentMode);
	var nr = _n && "TextEvent" in window && !tr, rr = _n && (!er || tr && 8 < tr && 11 >= tr), ir = " ", ar = !1;
	function or(e, t) {
		switch (e) {
			case "keyup": return $n.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function sr(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var cr = !1;
	function lr(e, t) {
		switch (e) {
			case "compositionend": return sr(t);
			case "keypress": return t.which === 32 ? (ar = !0, ir) : null;
			case "textInput": return e = t.data, e === ir && ar ? null : e;
			default: return null;
		}
	}
	function ur(e, t) {
		if (cr) return e === "compositionend" || !er && or(e, t) ? (e = Cn(), Sn = xn = bn = null, cr = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return rr && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var dr = {
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
	function fr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!dr[e.type] : t === "textarea";
	}
	function pr(e, t, n, r) {
		dn ? fn ? fn.push(r) : fn = [r] : dn = r, t = jd(t, "onChange"), 0 < t.length && (n = new kn("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var mr = null, hr = null;
	function gr(e) {
		wd(e, 0);
	}
	function _r(e) {
		if (Ut(Et(e))) return e;
	}
	function vr(e, t) {
		if (e === "change") return t;
	}
	var yr = !1;
	if (_n) {
		var br;
		if (_n) {
			var xr = "oninput" in document;
			if (!xr) {
				var Sr = document.createElement("div");
				Sr.setAttribute("oninput", "return;"), xr = typeof Sr.oninput == "function";
			}
			br = xr;
		} else br = !1;
		yr = br && (!document.documentMode || 9 < document.documentMode);
	}
	function Cr() {
		mr && (mr.detachEvent("onpropertychange", wr), hr = mr = null);
	}
	function wr(e) {
		if (e.propertyName === "value" && _r(hr)) {
			var t = [];
			pr(t, hr, e, un(e)), hn(gr, t);
		}
	}
	function Tr(e, t, n) {
		e === "focusin" ? (Cr(), mr = t, hr = n, mr.attachEvent("onpropertychange", wr)) : e === "focusout" && Cr();
	}
	function Er(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return _r(hr);
	}
	function Dr(e, t) {
		if (e === "click") return _r(t);
	}
	function Or(e, t) {
		if (e === "input" || e === "change") return _r(t);
	}
	function j(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var kr = typeof Object.is == "function" ? Object.is : j;
	function Ar(e, t) {
		if (kr(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!ke.call(t, i) || !kr(e[i], t[i])) return !1;
		}
		return !0;
	}
	function jr(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function Mr(e, t) {
		var n = jr(e);
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
			n = jr(n);
		}
	}
	function Nr(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Nr(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function Pr(e) {
		e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
		for (var t = Wt(e.document); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = Wt(e.document);
		}
		return t;
	}
	function Fr(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	var Ir = _n && "documentMode" in document && 11 >= document.documentMode, Lr = null, Rr = null, zr = null, Br = !1;
	function Vr(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		Br || Lr == null || Lr !== Wt(r) || (r = Lr, "selectionStart" in r && Fr(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), zr && Ar(zr, r) || (zr = r, r = jd(Rr, "onSelect"), 0 < r.length && (t = new kn("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = Lr)));
	}
	function Hr(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var Ur = {
		animationend: Hr("Animation", "AnimationEnd"),
		animationiteration: Hr("Animation", "AnimationIteration"),
		animationstart: Hr("Animation", "AnimationStart"),
		transitionrun: Hr("Transition", "TransitionRun"),
		transitionstart: Hr("Transition", "TransitionStart"),
		transitioncancel: Hr("Transition", "TransitionCancel"),
		transitionend: Hr("Transition", "TransitionEnd")
	}, Wr = {}, Gr = {};
	_n && (Gr = document.createElement("div").style, "AnimationEvent" in window || (delete Ur.animationend.animation, delete Ur.animationiteration.animation, delete Ur.animationstart.animation), "TransitionEvent" in window || delete Ur.transitionend.transition);
	function Kr(e) {
		if (Wr[e]) return Wr[e];
		if (!Ur[e]) return e;
		var t = Ur[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in Gr) return Wr[e] = t[n];
		return e;
	}
	var qr = Kr("animationend"), Jr = Kr("animationiteration"), Yr = Kr("animationstart"), Xr = Kr("transitionrun"), Zr = Kr("transitionstart"), Qr = Kr("transitioncancel"), $r = Kr("transitionend"), ei = /* @__PURE__ */ new Map(), M = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	M.push("scrollEnd");
	function ti(e, t) {
		ei.set(e, t), jt(t, [e]);
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
	}, ri = [], N = 0, ii = 0;
	function P() {
		for (var e = N, t = ii = N = 0; t < e;) {
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
			a !== 0 && ci(n, i, a);
		}
	}
	function ai(e, t, n, r) {
		ri[N++] = e, ri[N++] = t, ri[N++] = n, ri[N++] = r, ii |= r, e.lanes |= r, e = e.alternate, e !== null && (e.lanes |= r);
	}
	function oi(e, t, n, r) {
		return ai(e, t, n, r), li(e);
	}
	function si(e, t) {
		return ai(e, null, null, t), li(e);
	}
	function ci(e, t, n) {
		e.lanes |= n;
		var r = e.alternate;
		r !== null && (r.lanes |= n);
		for (var i = !1, a = e.return; a !== null;) a.childLanes |= n, r = a.alternate, r !== null && (r.childLanes |= n), a.tag === 22 && (e = a.stateNode, e === null || e._visibility & 1 || (i = !0)), e = a, a = a.return;
		return e.tag === 3 ? (a = e.stateNode, i && t !== null && (i = 31 - Ke(n), e = a.hiddenUpdates, r = e[i], r === null ? e[i] = [t] : r.push(t), t.lane = n | 536870912), a) : null;
	}
	function li(e) {
		if (50 < gu) throw gu = 0, _u = null, Error(i(185));
		for (var t = e.return; t !== null;) e = t, t = e.return;
		return e.tag === 3 ? e.stateNode : null;
	}
	var ui = {};
	function di(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function fi(e, t, n, r) {
		return new di(e, t, n, r);
	}
	function pi(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function mi(e, t) {
		var n = e.alternate;
		return n === null ? (n = fi(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 65011712, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n.refCleanup = e.refCleanup, n;
	}
	function hi(e, t) {
		e.flags &= 65011714;
		var n = e.alternate;
		return n === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = n.childLanes, e.lanes = n.lanes, e.child = n.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = n.memoizedProps, e.memoizedState = n.memoizedState, e.updateQueue = n.updateQueue, e.type = n.type, t = n.dependencies, e.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}), e;
	}
	function gi(e, t, n, r, a, o) {
		var s = 0;
		if (r = e, typeof e == "function") pi(e) && (s = 1);
		else if (typeof e == "string") s = Kf(e, n, he.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
		else a: switch (e) {
			case ie: return e = fi(31, n, t, a), e.elementType = ie, e.lanes = o, e;
			case y: return _i(n.children, a, o, t);
			case b:
				s = 8, a |= 24;
				break;
			case x: return e = fi(12, n, t, a | 2), e.elementType = x, e.lanes = o, e;
			case te: return e = fi(13, n, t, a), e.elementType = te, e.lanes = o, e;
			case ne: return e = fi(19, n, t, a), e.elementType = ne, e.lanes = o, e;
			default:
				if (typeof e == "object" && e) switch (e.$$typeof) {
					case ee:
						s = 10;
						break a;
					case S:
						s = 9;
						break a;
					case C:
						s = 11;
						break a;
					case re:
						s = 14;
						break a;
					case w:
						s = 16, r = null;
						break a;
				}
				s = 29, n = Error(i(130, e === null ? "null" : typeof e, "")), r = null;
		}
		return t = fi(s, n, t, a), t.elementType = e, t.type = r, t.lanes = o, t;
	}
	function _i(e, t, n, r) {
		return e = fi(7, e, r, t), e.lanes = n, e;
	}
	function vi(e, t, n) {
		return e = fi(6, e, null, t), e.lanes = n, e;
	}
	function yi(e) {
		var t = fi(18, null, null, 0);
		return t.stateNode = e, t;
	}
	function bi(e, t, n) {
		return t = fi(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
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
				stack: Oe(t)
			}, xi.set(e, t), t) : n;
		}
		return {
			value: e,
			source: t,
			stack: Oe(t)
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
		var i = 32 - Ke(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - Ke(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, Ai = 1 << 32 - Ke(t) + i | n << i | r, ji = a + e;
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
		switch (t[ht] = e, t[gt] = r, n) {
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
				J("invalid", t), Jt(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0);
				break;
			case "select":
				J("invalid", t);
				break;
			case "textarea": J("invalid", t), Qt(t, r.value, r.defaultValue, r.children);
		}
		n = r.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || !0 === r.suppressHydrationWarning || Ld(t.textContent, n) ? (r.popover != null && (J("beforetoggle", t), J("toggle", t)), r.onScroll != null && J("scroll", t), r.onScrollEnd != null && J("scrollend", t), r.onClick != null && (t.onclick = cn), t = !0) : t = !1, t || Hi(e, !0);
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
	var Yi = pe(null), Xi = null, Zi = null;
	function Qi(e, t, n) {
		O(Yi, t._currentValue), t._currentValue = n;
	}
	function $i(e) {
		e._currentValue = Yi.current, me(Yi);
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
					kr(a.pendingProps.value, s.value) || (e === null ? e = [c] : e.push(c));
				}
			} else if (a === _e.current) {
				if (s = a.alternate, s === null) throw Error(i(387));
				s.memoizedState.memoizedState !== a.memoizedState.memoizedState && (e === null ? e = [tp] : e.push(tp));
			}
			a = a.return;
		}
		e !== null && ta(t, e, n, r), t.flags |= 262144;
	}
	function ra(e) {
		for (e = e.firstContext; e !== null;) {
			if (!kr(e.context._currentValue, e.memoizedValue)) return !0;
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
		$$typeof: ee,
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
	var xa = T.S;
	T.S = function(e, t) {
		au = Pe(), typeof t == "object" && t && typeof t.then == "function" && va(e, t), xa !== null && xa(e, t);
	};
	var Sa = pe(null);
	function Ca() {
		var e = Sa.current;
		return e === null ? U.pooledCache : e;
	}
	function wa(e, t) {
		t === null ? O(Sa, Sa.current) : O(Sa, t.pool);
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
		switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then(cn, cn), t = n), t.status) {
			case "fulfilled": return t.value;
			case "rejected": throw e = t.reason, Fa(e), e;
			default:
				if (typeof t.status == "string") t.then(cn, cn);
				else {
					if (e = U, e !== null && 100 < e.shellSuspendCounter) throw Error(i(482));
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
			return e = mi(e, t), e.index = 0, e.sibling = null, e;
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
			return i === y ? d(e, t, n.props.children, r, n.key) : t !== null && (t.elementType === i || typeof i == "object" && i && i.$$typeof === w && Ma(i) === t.type) ? (t = a(t, n.props), za(t, n), t.return = e, t) : (t = gi(n.type, n.key, n.props, null, e.mode, r), za(t, n), t.return = e, t);
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
					case _: return n = gi(t.type, t.key, t.props, null, e.mode, n), za(n, t), n.return = e, n;
					case v: return t = bi(t, e.mode, n), t.return = e, t;
					case w: return t = Ma(t), f(e, t, n);
				}
				if (ue(t) || se(t)) return t = _i(t, e.mode, n, null), t.return = e, t;
				if (typeof t.then == "function") return f(e, Ra(t), n);
				if (t.$$typeof === ee) return f(e, oa(e, t), n);
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
					case w: return n = Ma(n), p(e, t, n, r);
				}
				if (ue(n) || se(n)) return i === null ? d(e, t, n, r, null) : null;
				if (typeof n.then == "function") return p(e, t, Ra(n), r);
				if (n.$$typeof === ee) return p(e, t, oa(e, n), r);
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
					case w: return r = Ma(r), m(e, t, n, r, i);
				}
				if (ue(r) || se(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				if (typeof r.then == "function") return m(e, t, n, Ra(r), i);
				if (r.$$typeof === ee) return m(e, t, n, oa(t, r), i);
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
									} else if (r.elementType === l || typeof l == "object" && l && l.$$typeof === w && Ma(l) === r.type) {
										n(e, r.sibling), c = a(r, o.props), za(c, o), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								} else t(e, r);
								r = r.sibling;
							}
							o.type === y ? (c = _i(o.props.children, e.mode, c, o.key), c.return = e, e = c) : (c = gi(o.type, o.key, o.props, null, e.mode, c), za(c, o), c.return = e, e = c);
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
					case w: return o = Ma(o), b(e, r, o, c);
				}
				if (ue(o)) return h(e, r, o, c);
				if (se(o)) {
					if (l = se(o), typeof l != "function") throw Error(i(150));
					return o = l.call(o), g(e, r, o, c);
				}
				if (typeof o.then == "function") return b(e, r, Ra(o), c);
				if (o.$$typeof === ee) return b(e, r, oa(e, o), c);
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
				var a = fi(29, t, null, e.mode);
				return a.lanes = r, a.return = e, a;
			}
		};
	}
	var Ha = Va(!0), Ua = Va(!1), Wa = !1;
	function Ga(e) {
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
	function Ka(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			callbacks: null
		});
	}
	function qa(e) {
		return {
			lane: e,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function Ja(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, H & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = li(e), ci(e, null, n), t;
		}
		return ai(e, r, t, n), li(e);
	}
	function Ya(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194048)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, ct(e, n);
		}
	}
	function Xa(e, t) {
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
	var Za = !1;
	function Qa() {
		if (Za) {
			var e = _a;
			if (e !== null) throw e;
		}
	}
	function $a(e, t, n, r) {
		Za = !1;
		var i = e.updateQueue;
		Wa = !1;
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
					f !== 0 && f === ga && (Za = !0), u !== null && (u = u.next = {
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
							case 2: Wa = !0;
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
	function eo(e, t) {
		if (typeof e != "function") throw Error(i(191, e));
		e.call(t);
	}
	function to(e, t) {
		var n = e.callbacks;
		if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) eo(n[e], t);
	}
	var no = pe(null), ro = pe(0);
	function io(e, t) {
		e = Jl, O(ro, e), O(no, t), Jl = e | t.baseLanes;
	}
	function ao() {
		O(ro, Jl), O(no, no.current);
	}
	function oo() {
		Jl = ro.current, me(no), me(ro);
	}
	var so = pe(null), co = null;
	function lo(e) {
		var t = e.alternate;
		O(ho, ho.current & 1), O(so, e), co === null && (t === null || no.current !== null || t.memoizedState !== null) && (co = e);
	}
	function uo(e) {
		O(ho, ho.current), O(so, e), co === null && (co = e);
	}
	function fo(e) {
		e.tag === 22 ? (O(ho, ho.current), O(so, e), co === null && (co = e)) : po(e);
	}
	function po() {
		O(ho, ho.current), O(so, so.current);
	}
	function mo(e) {
		me(so), co === e && (co = null), me(ho);
	}
	var ho = pe(0);
	function go(e) {
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
	var _o = 0, I = null, L = null, vo = null, yo = !1, bo = !1, xo = !1, So = 0, Co = 0, wo = null, To = 0;
	function Eo() {
		throw Error(i(321));
	}
	function Do(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!kr(e[n], t[n])) return !1;
		return !0;
	}
	function Oo(e, t, n, r, i, a) {
		return _o = a, I = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, T.H = e === null || e.memoizedState === null ? Us : Ws, xo = !1, a = n(r, i), xo = !1, bo && (a = Ao(t, n, r, i)), ko(e), a;
	}
	function ko(e) {
		T.H = Hs;
		var t = L !== null && L.next !== null;
		if (_o = 0, vo = L = I = null, yo = !1, Co = 0, wo = null, t) throw Error(i(300));
		e === null || sc || (e = e.dependencies, e !== null && ra(e) && (sc = !0));
	}
	function Ao(e, t, n, r) {
		I = e;
		var a = 0;
		do {
			if (bo && (wo = null), Co = 0, bo = !1, 25 <= a) throw Error(i(301));
			if (a += 1, vo = L = null, e.updateQueue != null) {
				var o = e.updateQueue;
				o.lastEffect = null, o.events = null, o.stores = null, o.memoCache != null && (o.memoCache.index = 0);
			}
			T.H = Gs, o = t(n, r);
		} while (bo);
		return o;
	}
	function R() {
		var e = T.H, t = e.useState()[0];
		return t = typeof t.then == "function" ? Fo(t) : t, e = e.useState()[0], (L === null ? null : L.memoizedState) !== e && (I.flags |= 1024), t;
	}
	function jo() {
		var e = So !== 0;
		return So = 0, e;
	}
	function Mo(e, t, n) {
		t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~n;
	}
	function No(e) {
		if (yo) {
			for (e = e.memoizedState; e !== null;) {
				var t = e.queue;
				t !== null && (t.pending = null), e = e.next;
			}
			yo = !1;
		}
		_o = 0, vo = L = I = null, bo = !1, Co = So = 0, wo = null;
	}
	function z() {
		var e = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		return vo === null ? I.memoizedState = vo = e : vo = vo.next = e, vo;
	}
	function Po() {
		if (L === null) {
			var e = I.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = L.next;
		var t = vo === null ? I.memoizedState : vo.next;
		if (t !== null) vo = t, L = e;
		else {
			if (e === null) throw I.alternate === null ? Error(i(467)) : Error(i(310));
			L = e, e = {
				memoizedState: L.memoizedState,
				baseState: L.baseState,
				baseQueue: L.baseQueue,
				queue: L.queue,
				next: null
			}, vo === null ? I.memoizedState = vo = e : vo = vo.next = e;
		}
		return vo;
	}
	function B() {
		return {
			lastEffect: null,
			events: null,
			stores: null,
			memoCache: null
		};
	}
	function Fo(e) {
		var t = Co;
		return Co += 1, wo === null && (wo = []), e = ja(wo, e, t), t = I, (vo === null ? t.memoizedState : vo.next) === null && (t = t.alternate, T.H = t === null || t.memoizedState === null ? Us : Ws), e;
	}
	function Io(e) {
		if (typeof e == "object" && e) {
			if (typeof e.then == "function") return Fo(e);
			if (e.$$typeof === ee) return aa(e);
		}
		throw Error(i(438, String(e)));
	}
	function Lo(e) {
		var t = null, n = I.updateQueue;
		if (n !== null && (t = n.memoCache), t == null) {
			var r = I.alternate;
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
		}), n === null && (n = B(), I.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0) for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = ae;
		return t.index++, n;
	}
	function Ro(e, t) {
		return typeof t == "function" ? t(e) : t;
	}
	function zo(e) {
		return Bo(Po(), L, e);
	}
	function Bo(e, t, n) {
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
				if (f === u.lane ? (_o & f) === f : (G & f) === f) {
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
					else if ((_o & p) === p) {
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
					}, l === null ? (c = l = f, s = o) : l = l.next = f, I.lanes |= p, Xl |= p;
					f = u.action, xo && n(o, f), o = u.hasEagerState ? u.eagerState : n(o, f);
				} else p = {
					lane: f,
					revertLane: u.revertLane,
					gesture: u.gesture,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null
				}, l === null ? (c = l = p, s = o) : l = l.next = p, I.lanes |= f, Xl |= f;
				u = u.next;
			} while (u !== null && u !== t);
			if (l === null ? s = o : l.next = c, !kr(o, e.memoizedState) && (sc = !0, d && (n = _a, n !== null))) throw n;
			e.memoizedState = o, e.baseState = s, e.baseQueue = l, r.lastRenderedState = o;
		}
		return a === null && (r.lanes = 0), [e.memoizedState, r.dispatch];
	}
	function Vo(e) {
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
			kr(o, t.memoizedState) || (sc = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, r];
	}
	function Ho(e, t, n) {
		var r = I, a = Po(), o = F;
		if (o) {
			if (n === void 0) throw Error(i(407));
			n = n();
		} else n = t();
		var s = !kr((L || a).memoizedState, n);
		if (s && (a.memoizedState = n, sc = !0), a = a.queue, ms(Go.bind(null, r, a, e), [e]), a.getSnapshot !== t || s || vo !== null && vo.memoizedState.tag & 1) {
			if (r.flags |= 2048, ls(9, { destroy: void 0 }, Wo.bind(null, r, a, n, t), null), U === null) throw Error(i(349));
			o || _o & 127 || Uo(r, t, n);
		}
		return n;
	}
	function Uo(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = I.updateQueue, t === null ? (t = B(), I.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
	}
	function Wo(e, t, n, r) {
		t.value = n, t.getSnapshot = r, Ko(t) && qo(e);
	}
	function Go(e, t, n) {
		return n(function() {
			Ko(t) && qo(e);
		});
	}
	function Ko(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !kr(e, n);
		} catch {
			return !0;
		}
	}
	function qo(e) {
		var t = si(e, 2);
		t !== null && bu(t, e, 2);
	}
	function Jo(e) {
		var t = z();
		if (typeof e == "function") {
			var n = e;
			if (e = n(), xo) {
				Ge(!0);
				try {
					n();
				} finally {
					Ge(!1);
				}
			}
		}
		return t.memoizedState = t.baseState = e, t.queue = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: Ro,
			lastRenderedState: e
		}, t;
	}
	function Yo(e, t, n, r) {
		return e.baseState = n, Bo(e, L, typeof r == "function" ? r : Ro);
	}
	function Xo(e, t, n, r, a) {
		if (zs(e)) throw Error(i(485));
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
			T.T === null ? o.isTransition = !1 : n(!0), r(o), n = t.pending, n === null ? (o.next = t.pending = o, Zo(t, o)) : (o.next = n.next, t.pending = n.next = o);
		}
	}
	function Zo(e, t) {
		var n = t.action, r = t.payload, i = e.state;
		if (t.isTransition) {
			var a = T.T, o = {};
			T.T = o;
			try {
				var s = n(i, r), c = T.S;
				c !== null && c(o, s), Qo(e, t, s);
			} catch (n) {
				es(e, t, n);
			} finally {
				a !== null && o.types !== null && (a.types = o.types), T.T = a;
			}
		} else try {
			a = n(i, r), Qo(e, t, a);
		} catch (n) {
			es(e, t, n);
		}
	}
	function Qo(e, t, n) {
		typeof n == "object" && n && typeof n.then == "function" ? n.then(function(n) {
			$o(e, t, n);
		}, function(n) {
			return es(e, t, n);
		}) : $o(e, t, n);
	}
	function $o(e, t, n) {
		t.status = "fulfilled", t.value = n, ts(t), e.state = n, t = e.pending, t !== null && (n = t.next, n === t ? e.pending = null : (n = n.next, t.next = n, Zo(e, n)));
	}
	function es(e, t, n) {
		var r = e.pending;
		if (e.pending = null, r !== null) {
			r = r.next;
			do
				t.status = "rejected", t.reason = n, ts(t), t = t.next;
			while (t !== r);
		}
		e.action = null;
	}
	function ts(e) {
		e = e.listeners;
		for (var t = 0; t < e.length; t++) (0, e[t])();
	}
	function ns(e, t) {
		return t;
	}
	function rs(e, t) {
		if (F) {
			var n = U.formState;
			if (n !== null) {
				a: {
					var r = I;
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
		return n = z(), n.memoizedState = n.baseState = t, r = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: ns,
			lastRenderedState: t
		}, n.queue = r, n = Is.bind(null, I, r), r.dispatch = n, r = Jo(!1), a = Rs.bind(null, I, !1, r.queue), r = z(), i = {
			state: t,
			dispatch: null,
			action: e,
			pending: null
		}, r.queue = i, n = Xo.bind(null, I, i, a, n), i.dispatch = n, r.memoizedState = e, [
			t,
			n,
			!1
		];
	}
	function is(e) {
		return as(Po(), L, e);
	}
	function as(e, t, n) {
		if (t = Bo(e, t, ns)[0], e = zo(Ro)[0], typeof t == "object" && t && typeof t.then == "function") try {
			var r = Fo(t);
		} catch (e) {
			throw e === Ea ? Oa : e;
		}
		else r = t;
		t = Po();
		var i = t.queue, a = i.dispatch;
		return n !== t.memoizedState && (I.flags |= 2048, ls(9, { destroy: void 0 }, ss.bind(null, i, n), null)), [
			r,
			a,
			e
		];
	}
	function ss(e, t) {
		e.action = t;
	}
	function cs(e) {
		var t = Po(), n = L;
		if (n !== null) return as(t, n, e);
		Po(), t = t.memoizedState, n = Po();
		var r = n.queue.dispatch;
		return n.memoizedState = e, [
			t,
			r,
			!1
		];
	}
	function ls(e, t, n, r) {
		return e = {
			tag: e,
			create: n,
			deps: r,
			inst: t,
			next: null
		}, t = I.updateQueue, t === null && (t = B(), I.updateQueue = t), n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
	}
	function us() {
		return Po().memoizedState;
	}
	function ds(e, t, n, r) {
		var i = z();
		I.flags |= e, i.memoizedState = ls(1 | t, { destroy: void 0 }, n, r === void 0 ? null : r);
	}
	function fs(e, t, n, r) {
		var i = Po();
		r = r === void 0 ? null : r;
		var a = i.memoizedState.inst;
		L !== null && r !== null && Do(r, L.memoizedState.deps) ? i.memoizedState = ls(t, a, n, r) : (I.flags |= e, i.memoizedState = ls(1 | t, a, n, r));
	}
	function ps(e, t) {
		ds(8390656, 8, e, t);
	}
	function ms(e, t) {
		fs(2048, 8, e, t);
	}
	function hs(e) {
		I.flags |= 4;
		var t = I.updateQueue;
		if (t === null) t = B(), I.updateQueue = t, t.events = [e];
		else {
			var n = t.events;
			n === null ? t.events = [e] : n.push(e);
		}
	}
	function gs(e) {
		var t = Po().memoizedState;
		return hs({
			ref: t,
			nextImpl: e
		}), function() {
			if (H & 2) throw Error(i(440));
			return t.impl.apply(void 0, arguments);
		};
	}
	function _s(e, t) {
		return fs(4, 2, e, t);
	}
	function vs(e, t) {
		return fs(4, 4, e, t);
	}
	function ys(e, t) {
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
	function bs(e, t, n) {
		n = n == null ? null : n.concat([e]), fs(4, 4, ys.bind(null, t, e), n);
	}
	function xs() {}
	function Ss(e, t) {
		var n = Po();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return t !== null && Do(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
	}
	function Cs(e, t) {
		var n = Po();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		if (t !== null && Do(t, r[1])) return r[0];
		if (r = e(), xo) {
			Ge(!0);
			try {
				e();
			} finally {
				Ge(!1);
			}
		}
		return n.memoizedState = [r, t], r;
	}
	function ws(e, t, n) {
		return n === void 0 || _o & 1073741824 && !(G & 261930) ? e.memoizedState = t : (e.memoizedState = n, e = yu(), I.lanes |= e, Xl |= e, n);
	}
	function Ts(e, t, n, r) {
		return kr(n, t) ? n : no.current === null ? !(_o & 42) || _o & 1073741824 && !(G & 261930) ? (sc = !0, e.memoizedState = n) : (e = yu(), I.lanes |= e, Xl |= e, t) : (e = ws(e, n, r), kr(e, t) || (sc = !0), e);
	}
	function Es(e, t, n, r, i) {
		var a = E.p;
		E.p = a !== 0 && 8 > a ? a : 8;
		var o = T.T, s = {};
		T.T = s, Rs(e, !1, t, n);
		try {
			var c = i(), l = T.S;
			l !== null && l(s, c), typeof c == "object" && c && typeof c.then == "function" ? Ls(e, t, ba(c, r), vu(e)) : Ls(e, t, r, vu(e));
		} catch (n) {
			Ls(e, t, {
				then: function() {},
				status: "rejected",
				reason: n
			}, vu());
		} finally {
			E.p = a, o !== null && s.types !== null && (o.types = s.types), T.T = o;
		}
	}
	function Ds() {}
	function Os(e, t, n, r) {
		if (e.tag !== 5) throw Error(i(476));
		var a = ks(e).queue;
		Es(e, a, t, D, n === null ? Ds : function() {
			return As(e), n(r);
		});
	}
	function ks(e) {
		var t = e.memoizedState;
		if (t !== null) return t;
		t = {
			memoizedState: D,
			baseState: D,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: Ro,
				lastRenderedState: D
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
				lastRenderedReducer: Ro,
				lastRenderedState: n
			},
			next: null
		}, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
	}
	function As(e) {
		var t = ks(e);
		t.next === null && (t = e.alternate.memoizedState), Ls(e, t.next.queue, {}, vu());
	}
	function js() {
		return aa(tp);
	}
	function Ms() {
		return Po().memoizedState;
	}
	function Ns() {
		return Po().memoizedState;
	}
	function Ps(e) {
		for (var t = e.return; t !== null;) {
			switch (t.tag) {
				case 24:
				case 3:
					var n = vu();
					e = qa(n);
					var r = Ja(t, e, n);
					r !== null && (bu(r, t, n), Ya(r, t, n)), t = { cache: fa() }, e.payload = t;
					return;
			}
			t = t.return;
		}
	}
	function Fs(e, t, n) {
		var r = vu();
		n = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, zs(e) ? Bs(t, n) : (n = oi(e, t, n, r), n !== null && (bu(n, e, r), Vs(n, t, r)));
	}
	function Is(e, t, n) {
		Ls(e, t, n, vu());
	}
	function Ls(e, t, n, r) {
		var i = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (zs(e)) Bs(t, i);
		else {
			var a = e.alternate;
			if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
				var o = t.lastRenderedState, s = a(o, n);
				if (i.hasEagerState = !0, i.eagerState = s, kr(s, o)) return ai(e, t, i, 0), U === null && P(), !1;
			} catch {}
			if (n = oi(e, t, i, r), n !== null) return bu(n, e, r), Vs(n, t, r), !0;
		}
		return !1;
	}
	function Rs(e, t, n, r) {
		if (r = {
			lane: 2,
			revertLane: gd(),
			gesture: null,
			action: r,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, zs(e)) {
			if (t) throw Error(i(479));
		} else t = oi(e, n, r, 2), t !== null && bu(t, e, 2);
	}
	function zs(e) {
		var t = e.alternate;
		return e === I || t !== null && t === I;
	}
	function Bs(e, t) {
		bo = yo = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function Vs(e, t, n) {
		if (n & 4194048) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, ct(e, n);
		}
	}
	var Hs = {
		readContext: aa,
		use: Io,
		useCallback: Eo,
		useContext: Eo,
		useEffect: Eo,
		useImperativeHandle: Eo,
		useLayoutEffect: Eo,
		useInsertionEffect: Eo,
		useMemo: Eo,
		useReducer: Eo,
		useRef: Eo,
		useState: Eo,
		useDebugValue: Eo,
		useDeferredValue: Eo,
		useTransition: Eo,
		useSyncExternalStore: Eo,
		useId: Eo,
		useHostTransitionStatus: Eo,
		useFormState: Eo,
		useActionState: Eo,
		useOptimistic: Eo,
		useMemoCache: Eo,
		useCacheRefresh: Eo
	};
	Hs.useEffectEvent = Eo;
	var Us = {
		readContext: aa,
		use: Io,
		useCallback: function(e, t) {
			return z().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: aa,
		useEffect: ps,
		useImperativeHandle: function(e, t, n) {
			n = n == null ? null : n.concat([e]), ds(4194308, 4, ys.bind(null, t, e), n);
		},
		useLayoutEffect: function(e, t) {
			return ds(4194308, 4, e, t);
		},
		useInsertionEffect: function(e, t) {
			ds(4, 2, e, t);
		},
		useMemo: function(e, t) {
			var n = z();
			t = t === void 0 ? null : t;
			var r = e();
			if (xo) {
				Ge(!0);
				try {
					e();
				} finally {
					Ge(!1);
				}
			}
			return n.memoizedState = [r, t], r;
		},
		useReducer: function(e, t, n) {
			var r = z();
			if (n !== void 0) {
				var i = n(t);
				if (xo) {
					Ge(!0);
					try {
						n(t);
					} finally {
						Ge(!1);
					}
				}
			} else i = t;
			return r.memoizedState = r.baseState = i, e = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: e,
				lastRenderedState: i
			}, r.queue = e, e = e.dispatch = Fs.bind(null, I, e), [r.memoizedState, e];
		},
		useRef: function(e) {
			var t = z();
			return e = { current: e }, t.memoizedState = e;
		},
		useState: function(e) {
			e = Jo(e);
			var t = e.queue, n = Is.bind(null, I, t);
			return t.dispatch = n, [e.memoizedState, n];
		},
		useDebugValue: xs,
		useDeferredValue: function(e, t) {
			return ws(z(), e, t);
		},
		useTransition: function() {
			var e = Jo(!1);
			return e = Es.bind(null, I, e.queue, !0, !1), z().memoizedState = e, [!1, e];
		},
		useSyncExternalStore: function(e, t, n) {
			var r = I, a = z();
			if (F) {
				if (n === void 0) throw Error(i(407));
				n = n();
			} else {
				if (n = t(), U === null) throw Error(i(349));
				G & 127 || Uo(r, t, n);
			}
			a.memoizedState = n;
			var o = {
				value: n,
				getSnapshot: t
			};
			return a.queue = o, ps(Go.bind(null, r, o, e), [e]), r.flags |= 2048, ls(9, { destroy: void 0 }, Wo.bind(null, r, o, n, t), null), n;
		},
		useId: function() {
			var e = z(), t = U.identifierPrefix;
			if (F) {
				var n = ji, r = Ai;
				n = (r & ~(1 << 32 - Ke(r) - 1)).toString(32) + n, t = "_" + t + "R_" + n, n = So++, 0 < n && (t += "H" + n.toString(32)), t += "_";
			} else n = To++, t = "_" + t + "r_" + n.toString(32) + "_";
			return e.memoizedState = t;
		},
		useHostTransitionStatus: js,
		useFormState: rs,
		useActionState: rs,
		useOptimistic: function(e) {
			var t = z();
			t.memoizedState = t.baseState = e;
			var n = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: null,
				lastRenderedState: null
			};
			return t.queue = n, t = Rs.bind(null, I, !0, n), n.dispatch = t, [e, t];
		},
		useMemoCache: Lo,
		useCacheRefresh: function() {
			return z().memoizedState = Ps.bind(null, I);
		},
		useEffectEvent: function(e) {
			var t = z(), n = { impl: e };
			return t.memoizedState = n, function() {
				if (H & 2) throw Error(i(440));
				return n.impl.apply(void 0, arguments);
			};
		}
	}, Ws = {
		readContext: aa,
		use: Io,
		useCallback: Ss,
		useContext: aa,
		useEffect: ms,
		useImperativeHandle: bs,
		useInsertionEffect: _s,
		useLayoutEffect: vs,
		useMemo: Cs,
		useReducer: zo,
		useRef: us,
		useState: function() {
			return zo(Ro);
		},
		useDebugValue: xs,
		useDeferredValue: function(e, t) {
			return Ts(Po(), L.memoizedState, e, t);
		},
		useTransition: function() {
			var e = zo(Ro)[0], t = Po().memoizedState;
			return [typeof e == "boolean" ? e : Fo(e), t];
		},
		useSyncExternalStore: Ho,
		useId: Ms,
		useHostTransitionStatus: js,
		useFormState: is,
		useActionState: is,
		useOptimistic: function(e, t) {
			return Yo(Po(), L, e, t);
		},
		useMemoCache: Lo,
		useCacheRefresh: Ns
	};
	Ws.useEffectEvent = gs;
	var Gs = {
		readContext: aa,
		use: Io,
		useCallback: Ss,
		useContext: aa,
		useEffect: ms,
		useImperativeHandle: bs,
		useInsertionEffect: _s,
		useLayoutEffect: vs,
		useMemo: Cs,
		useReducer: Vo,
		useRef: us,
		useState: function() {
			return Vo(Ro);
		},
		useDebugValue: xs,
		useDeferredValue: function(e, t) {
			var n = Po();
			return L === null ? ws(n, e, t) : Ts(n, L.memoizedState, e, t);
		},
		useTransition: function() {
			var e = Vo(Ro)[0], t = Po().memoizedState;
			return [typeof e == "boolean" ? e : Fo(e), t];
		},
		useSyncExternalStore: Ho,
		useId: Ms,
		useHostTransitionStatus: js,
		useFormState: cs,
		useActionState: cs,
		useOptimistic: function(e, t) {
			var n = Po();
			return L === null ? (n.baseState = e, [e, n.queue.dispatch]) : Yo(n, L, e, t);
		},
		useMemoCache: Lo,
		useCacheRefresh: Ns
	};
	Gs.useEffectEvent = gs;
	function Ks(e, t, n, r) {
		t = e.memoizedState, n = n(r, t), n = n == null ? t : h({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
	}
	var qs = {
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = vu(), i = qa(r);
			i.payload = t, n != null && (i.callback = n), t = Ja(e, i, r), t !== null && (bu(t, e, r), Ya(t, e, r));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = vu(), i = qa(r);
			i.tag = 1, i.payload = t, n != null && (i.callback = n), t = Ja(e, i, r), t !== null && (bu(t, e, r), Ya(t, e, r));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = vu(), r = qa(n);
			r.tag = 2, t != null && (r.callback = t), t = Ja(e, r, n), t !== null && (bu(t, e, n), Ya(t, e, n));
		}
	};
	function Js(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !Ar(n, r) || !Ar(i, a) : !0;
	}
	function Ys(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && qs.enqueueReplaceState(t, t.state, null);
	}
	function Xs(e, t) {
		var n = t;
		if ("ref" in t) for (var r in n = {}, t) r !== "ref" && (n[r] = t[r]);
		if (e = e.defaultProps) for (var i in n === t && (n = h({}, n)), e) n[i] === void 0 && (n[i] = e[i]);
		return n;
	}
	function Zs(e) {
		ni(e);
	}
	function Qs(e) {
		console.error(e);
	}
	function $s(e) {
		ni(e);
	}
	function ec(e, t) {
		try {
			var n = e.onUncaughtError;
			n(t.value, { componentStack: t.stack });
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function tc(e, t, n) {
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
	function nc(e, t, n) {
		return n = qa(n), n.tag = 3, n.payload = { element: null }, n.callback = function() {
			ec(e, t);
		}, n;
	}
	function rc(e) {
		return e = qa(e), e.tag = 3, e;
	}
	function ic(e, t, n, r) {
		var i = n.type.getDerivedStateFromError;
		if (typeof i == "function") {
			var a = r.value;
			e.payload = function() {
				return i(a);
			}, e.callback = function() {
				tc(t, n, r);
			};
		}
		var o = n.stateNode;
		o !== null && typeof o.componentDidCatch == "function" && (e.callback = function() {
			tc(t, n, r), typeof i != "function" && (cu === null ? cu = new Set([this]) : cu.add(this));
			var e = r.stack;
			this.componentDidCatch(r.value, { componentStack: e === null ? "" : e });
		});
	}
	function ac(e, t, n, r, a) {
		if (n.flags |= 32768, typeof r == "object" && r && typeof r.then == "function") {
			if (t = n.alternate, t !== null && na(t, n, a, !0), n = so.current, n !== null) {
				switch (n.tag) {
					case 31:
					case 13: return co === null ? Mu() : n.alternate === null && Yl === 0 && (Yl = 3), n.flags &= -257, n.flags |= 65536, n.lanes = a, r === ka ? n.flags |= 16384 : (t = n.updateQueue, t === null ? n.updateQueue = new Set([r]) : t.add(r), Xu(e, r, a)), !1;
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
		if (F) return t = so.current, t === null ? (r !== Vi && (t = Error(i(423), { cause: r }), Ji(Si(t, n))), e = e.current.alternate, e.flags |= 65536, a &= -a, e.lanes |= a, r = Si(r, n), a = nc(e.stateNode, r, a), Xa(e, a), Yl !== 4 && (Yl = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = a, r !== Vi && (e = Error(i(422), { cause: r }), Ji(Si(e, n)))), !1;
		var o = Error(i(520), { cause: r });
		if (o = Si(o, n), tu === null ? tu = [o] : tu.push(o), Yl !== 4 && (Yl = 2), t === null) return !0;
		r = Si(r, n), n = t;
		do {
			switch (n.tag) {
				case 3: return n.flags |= 65536, e = a & -a, n.lanes |= e, e = nc(n.stateNode, r, e), Xa(n, e), !1;
				case 1: if (t = n.type, o = n.stateNode, !(n.flags & 128) && (typeof t.getDerivedStateFromError == "function" || o !== null && typeof o.componentDidCatch == "function" && (cu === null || !cu.has(o)))) return n.flags |= 65536, a &= -a, n.lanes |= a, a = rc(a), ic(a, e, n, r), Xa(n, a), !1;
			}
			n = n.return;
		} while (n !== null);
		return !1;
	}
	var oc = Error(i(461)), sc = !1;
	function cc(e, t, n, r) {
		t.child = e === null ? Ua(t, null, n, r) : Ha(t, e.child, n, r);
	}
	function lc(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		if ("ref" in r) {
			var o = {};
			for (var s in r) s !== "ref" && (o[s] = r[s]);
		} else o = r;
		return ia(t), r = Oo(e, t, n, o, a, i), s = jo(), e !== null && !sc ? (Mo(e, t, i), Nc(e, t, i)) : (F && s && Pi(t), t.flags |= 1, cc(e, t, r, i), t.child);
	}
	function uc(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !pi(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, dc(e, t, a, r, i)) : (e = gi(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, !Pc(e, i)) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? Ar : n, n(o, r) && e.ref === t.ref) return Nc(e, t, i);
		}
		return t.flags |= 1, e = mi(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function dc(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (Ar(a, r) && e.ref === t.ref) if (sc = !1, t.pendingProps = r = a, Pc(e, i)) e.flags & 131072 && (sc = !0);
			else return t.lanes = e.lanes, Nc(e, t, i);
		}
		return yc(e, t, n, r, i);
	}
	function fc(e, t, n, r) {
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
				return mc(e, t, a, n, r);
			}
			if (n & 536870912) t.memoizedState = {
				baseLanes: 0,
				cachePool: null
			}, e !== null && wa(t, a === null ? null : a.cachePool), a === null ? ao() : io(t, a), fo(t);
			else return r = t.lanes = 536870912, mc(e, t, a === null ? n : a.baseLanes | n, n, r);
		} else a === null ? (e !== null && wa(t, null), ao(), po(t)) : (wa(t, a.cachePool), io(t, a), po(t), t.memoizedState = null);
		return cc(e, t, i, n), t.child;
	}
	function pc(e, t) {
		return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), t.sibling;
	}
	function mc(e, t, n, r, i) {
		var a = Ca();
		return a = a === null ? null : {
			parent: da._currentValue,
			pool: a
		}, t.memoizedState = {
			baseLanes: n,
			cachePool: a
		}, e !== null && wa(t, null), ao(), fo(t), e !== null && na(e, t, r, !0), t.childLanes = i, null;
	}
	function hc(e, t) {
		return t = Oc({
			mode: t.mode,
			children: t.children
		}, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
	}
	function gc(e, t, n) {
		return Ha(t, e.child, null, n), e = hc(t, t.pendingProps), e.flags |= 2, mo(t), t.memoizedState = null, e;
	}
	function _c(e, t, n) {
		var r = t.pendingProps, a = (t.flags & 128) != 0;
		if (t.flags &= -129, e === null) {
			if (F) {
				if (r.mode === "hidden") return e = hc(t, r), t.lanes = 536870912, pc(null, e);
				if (uo(t), (e = Ri) ? (e = lf(e, Bi), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
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
			return hc(t, r);
		}
		var o = e.memoizedState;
		if (o !== null) {
			var s = o.dehydrated;
			if (uo(t), a) if (t.flags & 256) t.flags &= -257, t = gc(e, t, n);
			else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
			else throw Error(i(558));
			else if (sc || na(e, t, n, !1), a = (n & e.childLanes) !== 0, sc || a) {
				if (r = U, r !== null && (s = lt(r, n), s !== 0 && s !== o.retryLane)) throw o.retryLane = s, si(e, s), bu(r, e, s), oc;
				Mu(), t = gc(e, t, n);
			} else e = o.treeContext, Ri = pf(s.nextSibling), Li = t, F = !0, zi = null, Bi = !1, e !== null && Ii(t, e), t = hc(t, r), t.flags |= 4096;
			return t;
		}
		return e = mi(e.child, {
			mode: r.mode,
			children: r.children
		}), e.ref = t.ref, t.child = e, e.return = t, e;
	}
	function vc(e, t) {
		var n = t.ref;
		if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
		else {
			if (typeof n != "function" && typeof n != "object") throw Error(i(284));
			(e === null || e.ref !== n) && (t.flags |= 4194816);
		}
	}
	function yc(e, t, n, r, i) {
		return ia(t), n = Oo(e, t, n, r, void 0, i), r = jo(), e !== null && !sc ? (Mo(e, t, i), Nc(e, t, i)) : (F && r && Pi(t), t.flags |= 1, cc(e, t, n, i), t.child);
	}
	function bc(e, t, n, r, i, a) {
		return ia(t), t.updateQueue = null, n = Ao(t, r, n, i), ko(e), r = jo(), e !== null && !sc ? (Mo(e, t, a), Nc(e, t, a)) : (F && r && Pi(t), t.flags |= 1, cc(e, t, n, a), t.child);
	}
	function xc(e, t, n, r, i) {
		if (ia(t), t.stateNode === null) {
			var a = ui, o = n.contextType;
			typeof o == "object" && o && (a = aa(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = qs, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, Ga(t), o = n.contextType, a.context = typeof o == "object" && o ? aa(o) : ui, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == "function" && (Ks(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (o = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), o !== a.state && qs.enqueueReplaceState(a, a.state, null), $a(t, r, a, i), Qa(), a.state = t.memoizedState), typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !0;
		} else if (e === null) {
			a = t.stateNode;
			var s = t.memoizedProps, c = Xs(n, s);
			a.props = c;
			var l = a.context, u = n.contextType;
			o = ui, typeof u == "object" && u && (o = aa(u));
			var d = n.getDerivedStateFromProps;
			u = typeof d == "function" || typeof a.getSnapshotBeforeUpdate == "function", s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (s || l !== o) && Ys(t, a, r, o), Wa = !1;
			var f = t.memoizedState;
			a.state = f, $a(t, r, a, i), Qa(), l = t.memoizedState, s || f !== l || Wa ? (typeof d == "function" && (Ks(t, n, d, r), l = t.memoizedState), (c = Wa || Js(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			a = t.stateNode, Ka(e, t), o = t.memoizedProps, u = Xs(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = ui, typeof l == "object" && l && (c = aa(l)), s = n.getDerivedStateFromProps, (l = typeof s == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (o !== d || f !== c) && Ys(t, a, r, c), Wa = !1, f = t.memoizedState, a.state = f, $a(t, r, a, i), Qa();
			var p = t.memoizedState;
			o !== d || f !== p || Wa || e !== null && e.dependencies !== null && ra(e.dependencies) ? (typeof s == "function" && (Ks(t, n, s, r), p = t.memoizedState), (u = Wa || Js(t, n, u, r, f, p, c) || e !== null && e.dependencies !== null && ra(e.dependencies)) ? (l || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(r, p, c), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(r, p, c)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = p), a.props = r, a.state = p, a.context = c, r = u) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return a = r, vc(e, t), r = (t.flags & 128) != 0, a || r ? (a = t.stateNode, n = r && typeof n.getDerivedStateFromError != "function" ? null : a.render(), t.flags |= 1, e !== null && r ? (t.child = Ha(t, e.child, null, i), t.child = Ha(t, null, n, i)) : cc(e, t, n, i), t.memoizedState = a.state, e = t.child) : e = Nc(e, t, i), e;
	}
	function Sc(e, t, n, r) {
		return Ki(), t.flags |= 256, cc(e, t, n, r), t.child;
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
	function Tc(e, t, n) {
		return e = e === null ? 0 : e.childLanes & ~n, t && (e |= $l), e;
	}
	function Ec(e, t, n) {
		var r = t.pendingProps, a = !1, o = (t.flags & 128) != 0, s;
		if ((s = o) || (s = e !== null && e.memoizedState === null ? !1 : (ho.current & 2) != 0), s && (a = !0, t.flags &= -129), s = (t.flags & 32) != 0, t.flags &= -33, e === null) {
			if (F) {
				if (a ? lo(t) : po(t), (e = Ri) ? (e = lf(e, Bi), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
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
			return r = r.fallback, a ? (po(t), a = t.mode, c = Oc({
				mode: "hidden",
				children: c
			}, a), r = _i(r, a, n, null), c.return = t, r.return = t, c.sibling = r, t.child = c, r = t.child, r.memoizedState = wc(n), r.childLanes = Tc(e, s, n), t.memoizedState = Cc, pc(null, r)) : (lo(t), Dc(t, c));
		}
		var l = e.memoizedState;
		if (l !== null && (c = l.dehydrated, c !== null)) {
			if (o) t.flags & 256 ? (lo(t), t.flags &= -257, t = kc(e, t, n)) : t.memoizedState === null ? (po(t), c = r.fallback, a = t.mode, r = Oc({
				mode: "visible",
				children: r.children
			}, a), c = _i(c, a, n, null), c.flags |= 2, r.return = t, c.return = t, r.sibling = c, t.child = r, Ha(t, e.child, null, n), r = t.child, r.memoizedState = wc(n), r.childLanes = Tc(e, s, n), t.memoizedState = Cc, t = pc(null, r)) : (po(t), t.child = e.child, t.flags |= 128, t = null);
			else if (lo(t), df(c)) {
				if (s = c.nextSibling && c.nextSibling.dataset, s) var u = s.dgst;
				s = u, r = Error(i(419)), r.stack = "", r.digest = s, Ji({
					value: r,
					source: null,
					stack: null
				}), t = kc(e, t, n);
			} else if (sc || na(e, t, n, !1), s = (n & e.childLanes) !== 0, sc || s) {
				if (s = U, s !== null && (r = lt(s, n), r !== 0 && r !== l.retryLane)) throw l.retryLane = r, si(e, r), bu(s, e, r), oc;
				uf(c) || Mu(), t = kc(e, t, n);
			} else uf(c) ? (t.flags |= 192, t.child = e.child, t = null) : (e = l.treeContext, Ri = pf(c.nextSibling), Li = t, F = !0, zi = null, Bi = !1, e !== null && Ii(t, e), t = Dc(t, r.children), t.flags |= 4096);
			return t;
		}
		return a ? (po(t), c = r.fallback, a = t.mode, l = e.child, u = l.sibling, r = mi(l, {
			mode: "hidden",
			children: r.children
		}), r.subtreeFlags = l.subtreeFlags & 65011712, u === null ? (c = _i(c, a, n, null), c.flags |= 2) : c = mi(u, c), c.return = t, r.return = t, r.sibling = c, t.child = r, pc(null, r), r = t.child, c = e.child.memoizedState, c === null ? c = wc(n) : (a = c.cachePool, a === null ? a = Ta() : (l = da._currentValue, a = a.parent === l ? a : {
			parent: l,
			pool: l
		}), c = {
			baseLanes: c.baseLanes | n,
			cachePool: a
		}), r.memoizedState = c, r.childLanes = Tc(e, s, n), t.memoizedState = Cc, pc(e.child, r)) : (lo(t), n = e.child, e = n.sibling, n = mi(n, {
			mode: "visible",
			children: r.children
		}), n.return = t, n.sibling = null, e !== null && (s = t.deletions, s === null ? (t.deletions = [e], t.flags |= 16) : s.push(e)), t.child = n, t.memoizedState = null, n);
	}
	function Dc(e, t) {
		return t = Oc({
			mode: "visible",
			children: t
		}, e.mode), t.return = e, e.child = t;
	}
	function Oc(e, t) {
		return e = fi(22, e, null, t), e.lanes = 0, e;
	}
	function kc(e, t, n) {
		return Ha(t, e.child, null, n), e = Dc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function Ac(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), ea(e.return, t, n);
	}
	function jc(e, t, n, r, i, a) {
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
	function Mc(e, t, n) {
		var r = t.pendingProps, i = r.revealOrder, a = r.tail;
		r = r.children;
		var o = ho.current, s = (o & 2) != 0;
		if (s ? (o = o & 1 | 2, t.flags |= 128) : o &= 1, O(ho, o), cc(e, t, r, n), r = F ? Ei : 0, !s && e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
			if (e.tag === 13) e.memoizedState !== null && Ac(e, n, t);
			else if (e.tag === 19) Ac(e, n, t);
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
				for (n = t.child, i = null; n !== null;) e = n.alternate, e !== null && go(e) === null && (i = n), n = n.sibling;
				n = i, n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), jc(t, !1, i, n, a, r);
				break;
			case "backwards":
			case "unstable_legacy-backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && go(e) === null) {
						t.child = i;
						break;
					}
					e = i.sibling, i.sibling = n, n = i, i = e;
				}
				jc(t, !0, n, null, a, r);
				break;
			case "together":
				jc(t, !1, null, null, void 0, r);
				break;
			default: t.memoizedState = null;
		}
		return t.child;
	}
	function Nc(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), Xl |= t.lanes, (n & t.childLanes) === 0) if (e !== null) {
			if (na(e, t, n, !1), (n & t.childLanes) === 0) return null;
		} else return null;
		if (e !== null && t.child !== e.child) throw Error(i(153));
		if (t.child !== null) {
			for (e = t.child, n = mi(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = mi(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function Pc(e, t) {
		return (e.lanes & t) === 0 ? (e = e.dependencies, !!(e !== null && ra(e))) : !0;
	}
	function Fc(e, t, n) {
		switch (t.tag) {
			case 3:
				ve(t, t.stateNode.containerInfo), Qi(t, da, e.memoizedState.cache), Ki();
				break;
			case 27:
			case 5:
				be(t);
				break;
			case 4:
				ve(t, t.stateNode.containerInfo);
				break;
			case 10:
				Qi(t, t.type, t.memoizedProps.value);
				break;
			case 31:
				if (t.memoizedState !== null) return t.flags |= 128, uo(t), null;
				break;
			case 13:
				var r = t.memoizedState;
				if (r !== null) return r.dehydrated === null ? (n & t.child.childLanes) === 0 ? (lo(t), e = Nc(e, t, n), e === null ? null : e.sibling) : Ec(e, t, n) : (lo(t), t.flags |= 128, null);
				lo(t);
				break;
			case 19:
				var i = (e.flags & 128) != 0;
				if (r = (n & t.childLanes) !== 0, r || (na(e, t, n, !1), r = (n & t.childLanes) !== 0), i) {
					if (r) return Mc(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), O(ho, ho.current), r) break;
				return null;
			case 22: return t.lanes = 0, fc(e, t, n, t.pendingProps);
			case 24: Qi(t, da, e.memoizedState.cache);
		}
		return Nc(e, t, n);
	}
	function Ic(e, t, n) {
		if (e !== null) if (e.memoizedProps !== t.pendingProps) sc = !0;
		else {
			if (!Pc(e, n) && !(t.flags & 128)) return sc = !1, Fc(e, t, n);
			sc = !!(e.flags & 131072);
		}
		else sc = !1, F && t.flags & 1048576 && Ni(t, Ei, t.index);
		switch (t.lanes = 0, t.tag) {
			case 16:
				a: {
					var r = t.pendingProps;
					if (e = Ma(t.elementType), t.type = e, typeof e == "function") pi(e) ? (r = Xs(e, r), t.tag = 1, t = xc(null, t, e, r, n)) : (t.tag = 0, t = yc(null, t, e, r, n));
					else {
						if (e != null) {
							var a = e.$$typeof;
							if (a === C) {
								t.tag = 11, t = lc(null, t, e, r, n);
								break a;
							} else if (a === re) {
								t.tag = 14, t = uc(null, t, e, r, n);
								break a;
							}
						}
						throw t = le(e) || e, Error(i(306, t, ""));
					}
				}
				return t;
			case 0: return yc(e, t, t.type, t.pendingProps, n);
			case 1: return r = t.type, a = Xs(r, t.pendingProps), xc(e, t, r, a, n);
			case 3:
				a: {
					if (ve(t, t.stateNode.containerInfo), e === null) throw Error(i(387));
					r = t.pendingProps;
					var o = t.memoizedState;
					a = o.element, Ka(e, t), $a(t, r, null, n);
					var s = t.memoizedState;
					if (r = s.cache, Qi(t, da, r), r !== o.cache && ta(t, [da], n, !0), Qa(), r = s.element, o.isDehydrated) if (o = {
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
						for (Ri = pf(e.firstChild), Li = t, F = !0, zi = null, Bi = !0, n = Ua(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 4096, n = n.sibling;
					}
					else {
						if (Ki(), r === a) {
							t = Nc(e, t, n);
							break a;
						}
						cc(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 26: return vc(e, t), e === null ? (n = Mf(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : F || (n = t.type, e = t.pendingProps, r = Gd(k.current).createElement(n), r[ht] = t, r[gt] = e, zd(r, n, e), Ot(r), t.stateNode = r) : t.memoizedState = Mf(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
			case 27: return be(t), e === null && F && (r = t.stateNode = _f(t.type, t.pendingProps, k.current), Li = t, Bi = !0, a = Ri, nf(t.type) ? (mf = a, Ri = pf(r.firstChild)) : Ri = a), cc(e, t, t.pendingProps.children, n), vc(e, t), e === null && (t.flags |= 4194304), t.child;
			case 5: return e === null && F && ((a = r = Ri) && (r = sf(r, t.type, t.pendingProps, Bi), r === null ? a = !1 : (t.stateNode = r, Li = t, Ri = pf(r.firstChild), Bi = !1, a = !0)), a || Hi(t)), be(t), a = t.type, o = t.pendingProps, s = e === null ? null : e.memoizedProps, r = o.children, Jd(a, o) ? r = null : s !== null && Jd(a, s) && (t.flags |= 32), t.memoizedState !== null && (a = Oo(e, t, R, null, null, n), tp._currentValue = a), vc(e, t), cc(e, t, r, n), t.child;
			case 6: return e === null && F && ((e = n = Ri) && (n = cf(n, t.pendingProps, Bi), n === null ? e = !1 : (t.stateNode = n, Li = t, Ri = null, e = !0)), e || Hi(t)), null;
			case 13: return Ec(e, t, n);
			case 4: return ve(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = Ha(t, null, r, n) : cc(e, t, r, n), t.child;
			case 11: return lc(e, t, t.type, t.pendingProps, n);
			case 7: return cc(e, t, t.pendingProps, n), t.child;
			case 8: return cc(e, t, t.pendingProps.children, n), t.child;
			case 12: return cc(e, t, t.pendingProps.children, n), t.child;
			case 10: return r = t.pendingProps, Qi(t, t.type, r.value), cc(e, t, r.children, n), t.child;
			case 9: return a = t.type._context, r = t.pendingProps.children, ia(t), a = aa(a), r = r(a), t.flags |= 1, cc(e, t, r, n), t.child;
			case 14: return uc(e, t, t.type, t.pendingProps, n);
			case 15: return dc(e, t, t.type, t.pendingProps, n);
			case 19: return Mc(e, t, n);
			case 31: return _c(e, t, n);
			case 22: return fc(e, t, n, t.pendingProps);
			case 24: return ia(t), r = aa(da), e === null ? (a = Ca(), a === null && (a = U, o = fa(), a.pooledCache = o, o.refCount++, o !== null && (a.pooledCacheLanes |= n), a = o), t.memoizedState = {
				parent: r,
				cache: a
			}, Ga(t), Qi(t, da, a)) : ((e.lanes & n) !== 0 && (Ka(e, t), $a(t, null, null, n), Qa()), a = e.memoizedState, o = t.memoizedState, a.parent === r ? (r = o.cache, Qi(t, da, r), r !== a.cache && ta(t, [da], n, !0)) : (a = {
				parent: r,
				cache: r
			}, t.memoizedState = a, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = a), Qi(t, da, r))), cc(e, t, t.pendingProps.children, n), t.child;
			case 29: throw t.pendingProps;
		}
		throw Error(i(156, t.tag));
	}
	function Lc(e) {
		e.flags |= 4;
	}
	function Rc(e, t, n, r, i) {
		if ((t = (e.mode & 32) != 0) && (t = !1), t) {
			if (e.flags |= 16777216, (i & 335544128) === i) if (e.stateNode.complete) e.flags |= 8192;
			else if (ku()) e.flags |= 8192;
			else throw Na = ka, Da;
		} else e.flags &= -16777217;
	}
	function zc(e, t) {
		if (t.type !== "stylesheet" || t.state.loading & 4) e.flags &= -16777217;
		else if (e.flags |= 16777216, !qf(t)) if (ku()) e.flags |= 8192;
		else throw Na = ka, Da;
	}
	function Bc(e, t) {
		t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag === 22 ? 536870912 : rt(), e.lanes |= t, eu |= t);
	}
	function Vc(e, t) {
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
	function Hc(e) {
		var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
		if (t) for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 65011712, r |= i.flags & 65011712, i.return = e, i = i.sibling;
		else for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
		return e.subtreeFlags |= r, e.childLanes = n, t;
	}
	function Uc(e, t, n) {
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
			case 14: return Hc(t), null;
			case 1: return Hc(t), null;
			case 3: return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), $i(da), ye(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (Gi(t) ? Lc(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, qi())), Hc(t), null;
			case 26:
				var a = t.type, o = t.memoizedState;
				return e === null ? (Lc(t), o === null ? (Hc(t), Rc(t, a, null, r, n)) : (Hc(t), zc(t, o))) : o ? o === e.memoizedState ? (Hc(t), t.flags &= -16777217) : (Lc(t), Hc(t), zc(t, o)) : (e = e.memoizedProps, e !== r && Lc(t), Hc(t), Rc(t, a, e, r, n)), null;
			case 27:
				if (xe(t), n = k.current, a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && Lc(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return Hc(t), null;
					}
					e = he.current, Gi(t) ? Ui(t, e) : (e = _f(a, r, n), t.stateNode = e, Lc(t));
				}
				return Hc(t), null;
			case 5:
				if (xe(t), a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && Lc(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return Hc(t), null;
					}
					if (o = he.current, Gi(t)) Ui(t, o);
					else {
						var s = Gd(k.current);
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
						o[ht] = t, o[gt] = r;
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
						r && Lc(t);
					}
				}
				return Hc(t), Rc(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n), null;
			case 6:
				if (e && t.stateNode != null) e.memoizedProps !== r && Lc(t);
				else {
					if (typeof r != "string" && t.stateNode === null) throw Error(i(166));
					if (e = k.current, Gi(t)) {
						if (e = t.stateNode, n = t.memoizedProps, r = null, a = Li, a !== null) switch (a.tag) {
							case 27:
							case 5: r = a.memoizedProps;
						}
						e[ht] = t, e = !!(e.nodeValue === n || r !== null && !0 === r.suppressHydrationWarning || Ld(e.nodeValue, n)), e || Hi(t, !0);
					} else e = Gd(e).createTextNode(r), e[ht] = t, t.stateNode = e;
				}
				return Hc(t), null;
			case 31:
				if (n = t.memoizedState, e === null || e.memoizedState !== null) {
					if (r = Gi(t), n !== null) {
						if (e === null) {
							if (!r) throw Error(i(318));
							if (e = t.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(557));
							e[ht] = t;
						} else Ki(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						Hc(t), e = !1;
					} else n = qi(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), e = !0;
					if (!e) return t.flags & 256 ? (mo(t), t) : (mo(t), null);
					if (t.flags & 128) throw Error(i(558));
				}
				return Hc(t), null;
			case 13:
				if (r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (a = Gi(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!a) throw Error(i(318));
							if (a = t.memoizedState, a = a === null ? null : a.dehydrated, !a) throw Error(i(317));
							a[ht] = t;
						} else Ki(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						Hc(t), a = !1;
					} else a = qi(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), a = !0;
					if (!a) return t.flags & 256 ? (mo(t), t) : (mo(t), null);
				}
				return mo(t), t.flags & 128 ? (t.lanes = n, t) : (n = r !== null, e = e !== null && e.memoizedState !== null, n && (r = t.child, a = null, r.alternate !== null && r.alternate.memoizedState !== null && r.alternate.memoizedState.cachePool !== null && (a = r.alternate.memoizedState.cachePool.pool), o = null, r.memoizedState !== null && r.memoizedState.cachePool !== null && (o = r.memoizedState.cachePool.pool), o !== a && (r.flags |= 2048)), n !== e && n && (t.child.flags |= 8192), Bc(t, t.updateQueue), Hc(t), null);
			case 4: return ye(), e === null && Dd(t.stateNode.containerInfo), Hc(t), null;
			case 10: return $i(t.type), Hc(t), null;
			case 19:
				if (me(ho), r = t.memoizedState, r === null) return Hc(t), null;
				if (a = (t.flags & 128) != 0, o = r.rendering, o === null) if (a) Vc(r, !1);
				else {
					if (Yl !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
						if (o = go(e), o !== null) {
							for (t.flags |= 128, Vc(r, !1), e = o.updateQueue, t.updateQueue = e, Bc(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) hi(n, e), n = n.sibling;
							return O(ho, ho.current & 1 | 2), F && Mi(t, r.treeForkCount), t.child;
						}
						e = e.sibling;
					}
					r.tail !== null && Pe() > ou && (t.flags |= 128, a = !0, Vc(r, !1), t.lanes = 4194304);
				}
				else {
					if (!a) if (e = go(o), e !== null) {
						if (t.flags |= 128, a = !0, e = e.updateQueue, t.updateQueue = e, Bc(t, e), Vc(r, !0), r.tail === null && r.tailMode === "hidden" && !o.alternate && !F) return Hc(t), null;
					} else 2 * Pe() - r.renderingStartTime > ou && n !== 536870912 && (t.flags |= 128, a = !0, Vc(r, !1), t.lanes = 4194304);
					r.isBackwards ? (o.sibling = t.child, t.child = o) : (e = r.last, e === null ? t.child = o : e.sibling = o, r.last = o);
				}
				return r.tail === null ? (Hc(t), null) : (e = r.tail, r.rendering = e, r.tail = e.sibling, r.renderingStartTime = Pe(), e.sibling = null, n = ho.current, O(ho, a ? n & 1 | 2 : n & 1), F && Mi(t, r.treeForkCount), e);
			case 22:
			case 23: return mo(t), oo(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (Hc(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : Hc(t), n = t.updateQueue, n !== null && Bc(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && me(Sa), null;
			case 24: return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), $i(da), Hc(t), null;
			case 25: return null;
			case 30: return null;
		}
		throw Error(i(156, t.tag));
	}
	function Wc(e, t) {
		switch (Fi(t), t.tag) {
			case 1: return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return $i(da), ye(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 26:
			case 27:
			case 5: return xe(t), null;
			case 31:
				if (t.memoizedState !== null) {
					if (mo(t), t.alternate === null) throw Error(i(340));
					Ki();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 13:
				if (mo(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(i(340));
					Ki();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return me(ho), null;
			case 4: return ye(), null;
			case 10: return $i(t.type), null;
			case 22:
			case 23: return mo(t), oo(), e !== null && me(Sa), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 24: return $i(da), null;
			case 25: return null;
			default: return null;
		}
	}
	function Gc(e, t) {
		switch (Fi(t), t.tag) {
			case 3:
				$i(da), ye();
				break;
			case 26:
			case 27:
			case 5:
				xe(t);
				break;
			case 4:
				ye();
				break;
			case 31:
				t.memoizedState !== null && mo(t);
				break;
			case 13:
				mo(t);
				break;
			case 19:
				me(ho);
				break;
			case 10:
				$i(t.type);
				break;
			case 22:
			case 23:
				mo(t), oo(), e !== null && me(Sa);
				break;
			case 24: $i(da);
		}
	}
	function Kc(e, t) {
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
	function qc(e, t, n) {
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
	function Jc(e) {
		var t = e.updateQueue;
		if (t !== null) {
			var n = e.stateNode;
			try {
				to(t, n);
			} catch (t) {
				q(e, e.return, t);
			}
		}
	}
	function Yc(e, t, n) {
		n.props = Xs(e.type, e.memoizedProps), n.state = e.memoizedState;
		try {
			n.componentWillUnmount();
		} catch (n) {
			q(e, t, n);
		}
	}
	function Xc(e, t) {
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
	function Zc(e, t) {
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
	function Qc(e) {
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
	function $c(e, t, n) {
		try {
			var r = e.stateNode;
			Bd(r, e.type, n, t), r[gt] = t;
		} catch (t) {
			q(e, e.return, t);
		}
	}
	function el(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && nf(e.type) || e.tag === 4;
	}
	function tl(e) {
		a: for (;;) {
			for (; e.sibling === null;) {
				if (e.return === null || el(e.return)) return null;
				e = e.return;
			}
			for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
				if (e.tag === 27 && nf(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue a;
				e.child.return = e, e = e.child;
			}
			if (!(e.flags & 2)) return e.stateNode;
		}
	}
	function nl(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(e, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, t.appendChild(e), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = cn));
		else if (r !== 4 && (r === 27 && nf(e.type) && (n = e.stateNode, t = null), e = e.child, e !== null)) for (nl(e, t, n), e = e.sibling; e !== null;) nl(e, t, n), e = e.sibling;
	}
	function rl(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
		else if (r !== 4 && (r === 27 && nf(e.type) && (n = e.stateNode), e = e.child, e !== null)) for (rl(e, t, n), e = e.sibling; e !== null;) rl(e, t, n), e = e.sibling;
	}
	function il(e) {
		var t = e.stateNode, n = e.memoizedProps;
		try {
			for (var r = e.type, i = t.attributes; i.length;) t.removeAttributeNode(i[0]);
			zd(t, r, n), t[ht] = e, t[gt] = n;
		} catch (t) {
			q(e, e.return, t);
		}
	}
	var al = !1, V = !1, ol = !1, sl = typeof WeakSet == "function" ? WeakSet : Set, cl = null;
	function ll(e, t) {
		if (e = e.containerInfo, Ud = up, e = Pr(e), Fr(e)) {
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
		}, up = !1, cl = t; cl !== null;) if (t = cl, e = t.child, t.subtreeFlags & 1028 && e !== null) e.return = t, cl = e;
		else for (; cl !== null;) {
			switch (t = cl, o = t.alternate, e = t.flags, t.tag) {
				case 0:
					if (e & 4 && (e = t.updateQueue, e = e === null ? null : e.events, e !== null)) for (n = 0; n < e.length; n++) a = e[n], a.ref.impl = a.nextImpl;
					break;
				case 11:
				case 15: break;
				case 1:
					if (e & 1024 && o !== null) {
						e = void 0, n = t, a = o.memoizedProps, o = o.memoizedState, r = n.stateNode;
						try {
							var h = Xs(n.type, a);
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
				e.return = t.return, cl = e;
				break;
			}
			cl = t.return;
		}
	}
	function ul(e, t, n) {
		var r = n.flags;
		switch (n.tag) {
			case 0:
			case 11:
			case 15:
				Tl(e, n), r & 4 && Kc(5, n);
				break;
			case 1:
				if (Tl(e, n), r & 4) if (e = n.stateNode, t === null) try {
					e.componentDidMount();
				} catch (e) {
					q(n, n.return, e);
				}
				else {
					var i = Xs(n.type, t.memoizedProps);
					t = t.memoizedState;
					try {
						e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
					} catch (e) {
						q(n, n.return, e);
					}
				}
				r & 64 && Jc(n), r & 512 && Xc(n, n.return);
				break;
			case 3:
				if (Tl(e, n), r & 64 && (e = n.updateQueue, e !== null)) {
					if (t = null, n.child !== null) switch (n.child.tag) {
						case 27:
						case 5:
							t = n.child.stateNode;
							break;
						case 1: t = n.child.stateNode;
					}
					try {
						to(e, t);
					} catch (e) {
						q(n, n.return, e);
					}
				}
				break;
			case 27: t === null && r & 4 && il(n);
			case 26:
			case 5:
				Tl(e, n), t === null && r & 4 && Qc(n), r & 512 && Xc(n, n.return);
				break;
			case 12:
				Tl(e, n);
				break;
			case 31:
				Tl(e, n), r & 4 && gl(e, n);
				break;
			case 13:
				Tl(e, n), r & 4 && _l(e, n), r & 64 && (e = n.memoizedState, e !== null && (e = e.dehydrated, e !== null && (n = $u.bind(null, n), ff(e, n))));
				break;
			case 22:
				if (r = n.memoizedState !== null || al, !r) {
					t = t !== null && t.memoizedState !== null || V, i = al;
					var a = V;
					al = r, (V = t) && !a ? Dl(e, n, (n.subtreeFlags & 8772) != 0) : Tl(e, n), al = i, V = a;
				}
				break;
			case 30: break;
			default: Tl(e, n);
		}
	}
	function dl(e) {
		var t = e.alternate;
		t !== null && (e.alternate = null, dl(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && Ct(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	var fl = null, pl = !1;
	function ml(e, t, n) {
		for (n = n.child; n !== null;) hl(e, t, n), n = n.sibling;
	}
	function hl(e, t, n) {
		if (We && typeof We.onCommitFiberUnmount == "function") try {
			We.onCommitFiberUnmount(Ue, n);
		} catch {}
		switch (n.tag) {
			case 26:
				V || Zc(n, t), ml(e, t, n), n.memoizedState ? n.memoizedState.count-- : n.stateNode && (n = n.stateNode, n.parentNode.removeChild(n));
				break;
			case 27:
				V || Zc(n, t);
				var r = fl, i = pl;
				nf(n.type) && (fl = n.stateNode, pl = !1), ml(e, t, n), vf(n.stateNode), fl = r, pl = i;
				break;
			case 5: V || Zc(n, t);
			case 6:
				if (r = fl, i = pl, fl = null, ml(e, t, n), fl = r, pl = i, fl !== null) if (pl) try {
					(fl.nodeType === 9 ? fl.body : fl.nodeName === "HTML" ? fl.ownerDocument.body : fl).removeChild(n.stateNode);
				} catch (e) {
					q(n, t, e);
				}
				else try {
					fl.removeChild(n.stateNode);
				} catch (e) {
					q(n, t, e);
				}
				break;
			case 18:
				fl !== null && (pl ? (e = fl, rf(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, n.stateNode), Ip(e)) : rf(fl, n.stateNode));
				break;
			case 4:
				r = fl, i = pl, fl = n.stateNode.containerInfo, pl = !0, ml(e, t, n), fl = r, pl = i;
				break;
			case 0:
			case 11:
			case 14:
			case 15:
				qc(2, n, t), V || qc(4, n, t), ml(e, t, n);
				break;
			case 1:
				V || (Zc(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function" && Yc(n, t, r)), ml(e, t, n);
				break;
			case 21:
				ml(e, t, n);
				break;
			case 22:
				V = (r = V) || n.memoizedState !== null, ml(e, t, n), V = r;
				break;
			default: ml(e, t, n);
		}
	}
	function gl(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
			e = e.dehydrated;
			try {
				Ip(e);
			} catch (e) {
				q(t, t.return, e);
			}
		}
	}
	function _l(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
			Ip(e);
		} catch (e) {
			q(t, t.return, e);
		}
	}
	function vl(e) {
		switch (e.tag) {
			case 31:
			case 13:
			case 19:
				var t = e.stateNode;
				return t === null && (t = e.stateNode = new sl()), t;
			case 22: return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new sl()), t;
			default: throw Error(i(435, e.tag));
		}
	}
	function yl(e, t) {
		var n = vl(e);
		t.forEach(function(t) {
			if (!n.has(t)) {
				n.add(t);
				var r = ed.bind(null, e, t);
				t.then(r, r);
			}
		});
	}
	function bl(e, t) {
		var n = t.deletions;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var a = n[r], o = e, s = t, c = s;
			a: for (; c !== null;) {
				switch (c.tag) {
					case 27:
						if (nf(c.type)) {
							fl = c.stateNode, pl = !1;
							break a;
						}
						break;
					case 5:
						fl = c.stateNode, pl = !1;
						break a;
					case 3:
					case 4:
						fl = c.stateNode.containerInfo, pl = !0;
						break a;
				}
				c = c.return;
			}
			if (fl === null) throw Error(i(160));
			hl(o, s, a), fl = null, pl = !1, o = a.alternate, o !== null && (o.return = null), a.return = null;
		}
		if (t.subtreeFlags & 13886) for (t = t.child; t !== null;) Sl(t, e), t = t.sibling;
	}
	var xl = null;
	function Sl(e, t) {
		var n = e.alternate, r = e.flags;
		switch (e.tag) {
			case 0:
			case 11:
			case 14:
			case 15:
				bl(t, e), Cl(e), r & 4 && (qc(3, e, e.return), Kc(3, e), qc(5, e, e.return));
				break;
			case 1:
				bl(t, e), Cl(e), r & 512 && (V || n === null || Zc(n, n.return)), r & 64 && al && (e = e.updateQueue, e !== null && (r = e.callbacks, r !== null && (n = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = n === null ? r : n.concat(r))));
				break;
			case 26:
				var a = xl;
				if (bl(t, e), Cl(e), r & 512 && (V || n === null || Zc(n, n.return)), r & 4) {
					var o = n === null ? null : n.memoizedState;
					if (r = e.memoizedState, n === null) if (r === null) if (e.stateNode === null) {
						a: {
							r = e.type, n = e.memoizedProps, a = a.ownerDocument || a;
							b: switch (r) {
								case "title":
									o = a.getElementsByTagName("title")[0], (!o || o[St] || o[ht] || o.namespaceURI === "http://www.w3.org/2000/svg" || o.hasAttribute("itemprop")) && (o = a.createElement(r), a.head.insertBefore(o, a.querySelector("head > title"))), zd(o, r, n), o[ht] = e, Ot(o), r = o;
									break a;
								case "link":
									var s = Wf("link", "href", a).get(r + (n.href || ""));
									if (s) {
										for (var c = 0; c < s.length; c++) if (o = s[c], o.getAttribute("href") === (n.href == null || n.href === "" ? null : n.href) && o.getAttribute("rel") === (n.rel == null ? null : n.rel) && o.getAttribute("title") === (n.title == null ? null : n.title) && o.getAttribute("crossorigin") === (n.crossOrigin == null ? null : n.crossOrigin)) {
											s.splice(c, 1);
											break b;
										}
									}
									o = a.createElement(r), zd(o, r, n), a.head.appendChild(o);
									break;
								case "meta":
									if (s = Wf("meta", "content", a).get(r + (n.content || ""))) {
										for (c = 0; c < s.length; c++) if (o = s[c], o.getAttribute("content") === (n.content == null ? null : "" + n.content) && o.getAttribute("name") === (n.name == null ? null : n.name) && o.getAttribute("property") === (n.property == null ? null : n.property) && o.getAttribute("http-equiv") === (n.httpEquiv == null ? null : n.httpEquiv) && o.getAttribute("charset") === (n.charSet == null ? null : n.charSet)) {
											s.splice(c, 1);
											break b;
										}
									}
									o = a.createElement(r), zd(o, r, n), a.head.appendChild(o);
									break;
								default: throw Error(i(468, r));
							}
							o[ht] = e, Ot(o), r = o;
						}
						e.stateNode = r;
					} else Gf(a, e.type, e.stateNode);
					else e.stateNode = zf(a, r, e.memoizedProps);
					else o === r ? r === null && e.stateNode !== null && $c(e, e.memoizedProps, n.memoizedProps) : (o === null ? n.stateNode !== null && (n = n.stateNode, n.parentNode.removeChild(n)) : o.count--, r === null ? Gf(a, e.type, e.stateNode) : zf(a, r, e.memoizedProps));
				}
				break;
			case 27:
				bl(t, e), Cl(e), r & 512 && (V || n === null || Zc(n, n.return)), n !== null && r & 4 && $c(e, e.memoizedProps, n.memoizedProps);
				break;
			case 5:
				if (bl(t, e), Cl(e), r & 512 && (V || n === null || Zc(n, n.return)), e.flags & 32) {
					a = e.stateNode;
					try {
						$t(a, "");
					} catch (t) {
						q(e, e.return, t);
					}
				}
				r & 4 && e.stateNode != null && (a = e.memoizedProps, $c(e, a, n === null ? a : n.memoizedProps)), r & 1024 && (ol = !0);
				break;
			case 6:
				if (bl(t, e), Cl(e), r & 4) {
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
				if (Uf = null, a = xl, xl = xf(t.containerInfo), bl(t, e), xl = a, Cl(e), r & 4 && n !== null && n.memoizedState.isDehydrated) try {
					Ip(t.containerInfo);
				} catch (t) {
					q(e, e.return, t);
				}
				ol && (ol = !1, wl(e));
				break;
			case 4:
				r = xl, xl = xf(e.stateNode.containerInfo), bl(t, e), Cl(e), xl = r;
				break;
			case 12:
				bl(t, e), Cl(e);
				break;
			case 31:
				bl(t, e), Cl(e), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, yl(e, r)));
				break;
			case 13:
				bl(t, e), Cl(e), e.child.flags & 8192 && e.memoizedState !== null != (n !== null && n.memoizedState !== null) && (iu = Pe()), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, yl(e, r)));
				break;
			case 22:
				a = e.memoizedState !== null;
				var l = n !== null && n.memoizedState !== null, u = al, d = V;
				if (al = u || a, V = d || l, bl(t, e), V = d, al = u, Cl(e), r & 8192) a: for (t = e.stateNode, t._visibility = a ? t._visibility & -2 : t._visibility | 1, a && (n === null || l || al || V || El(e)), n = null, t = e;;) {
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
				r & 4 && (r = e.updateQueue, r !== null && (n = r.retryQueue, n !== null && (r.retryQueue = null, yl(e, n))));
				break;
			case 19:
				bl(t, e), Cl(e), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, yl(e, r)));
				break;
			case 30: break;
			case 21: break;
			default: bl(t, e), Cl(e);
		}
	}
	function Cl(e) {
		var t = e.flags;
		if (t & 2) {
			try {
				for (var n, r = e.return; r !== null;) {
					if (el(r)) {
						n = r;
						break;
					}
					r = r.return;
				}
				if (n == null) throw Error(i(160));
				switch (n.tag) {
					case 27:
						var a = n.stateNode;
						rl(e, tl(e), a);
						break;
					case 5:
						var o = n.stateNode;
						n.flags & 32 && ($t(o, ""), n.flags &= -33), rl(e, tl(e), o);
						break;
					case 3:
					case 4:
						var s = n.stateNode.containerInfo;
						nl(e, tl(e), s);
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
	function wl(e) {
		if (e.subtreeFlags & 1024) for (e = e.child; e !== null;) {
			var t = e;
			wl(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), e = e.sibling;
		}
	}
	function Tl(e, t) {
		if (t.subtreeFlags & 8772) for (t = t.child; t !== null;) ul(e, t.alternate, t), t = t.sibling;
	}
	function El(e) {
		for (e = e.child; e !== null;) {
			var t = e;
			switch (t.tag) {
				case 0:
				case 11:
				case 14:
				case 15:
					qc(4, t, t.return), El(t);
					break;
				case 1:
					Zc(t, t.return);
					var n = t.stateNode;
					typeof n.componentWillUnmount == "function" && Yc(t, t.return, n), El(t);
					break;
				case 27: vf(t.stateNode);
				case 26:
				case 5:
					Zc(t, t.return), El(t);
					break;
				case 22:
					t.memoizedState === null && El(t);
					break;
				case 30:
					El(t);
					break;
				default: El(t);
			}
			e = e.sibling;
		}
	}
	function Dl(e, t, n) {
		for (n = n && (t.subtreeFlags & 8772) != 0, t = t.child; t !== null;) {
			var r = t.alternate, i = e, a = t, o = a.flags;
			switch (a.tag) {
				case 0:
				case 11:
				case 15:
					Dl(i, a, n), Kc(4, a);
					break;
				case 1:
					if (Dl(i, a, n), r = a, i = r.stateNode, typeof i.componentDidMount == "function") try {
						i.componentDidMount();
					} catch (e) {
						q(r, r.return, e);
					}
					if (r = a, i = r.updateQueue, i !== null) {
						var s = r.stateNode;
						try {
							var c = i.shared.hiddenCallbacks;
							if (c !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < c.length; i++) eo(c[i], s);
						} catch (e) {
							q(r, r.return, e);
						}
					}
					n && o & 64 && Jc(a), Xc(a, a.return);
					break;
				case 27: il(a);
				case 26:
				case 5:
					Dl(i, a, n), n && r === null && o & 4 && Qc(a), Xc(a, a.return);
					break;
				case 12:
					Dl(i, a, n);
					break;
				case 31:
					Dl(i, a, n), n && o & 4 && gl(i, a);
					break;
				case 13:
					Dl(i, a, n), n && o & 4 && _l(i, a);
					break;
				case 22:
					a.memoizedState === null && Dl(i, a, n), Xc(a, a.return);
					break;
				case 30: break;
				default: Dl(i, a, n);
			}
			t = t.sibling;
		}
	}
	function Ol(e, t) {
		var n = null;
		e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== n && (e != null && e.refCount++, n != null && pa(n));
	}
	function kl(e, t) {
		e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && pa(e));
	}
	function Al(e, t, n, r) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) jl(e, t, n, r), t = t.sibling;
	}
	function jl(e, t, n, r) {
		var i = t.flags;
		switch (t.tag) {
			case 0:
			case 11:
			case 15:
				Al(e, t, n, r), i & 2048 && Kc(9, t);
				break;
			case 1:
				Al(e, t, n, r);
				break;
			case 3:
				Al(e, t, n, r), i & 2048 && (e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && pa(e)));
				break;
			case 12:
				if (i & 2048) {
					Al(e, t, n, r), e = t.stateNode;
					try {
						var a = t.memoizedProps, o = a.id, s = a.onPostCommit;
						typeof s == "function" && s(o, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0);
					} catch (e) {
						q(t, t.return, e);
					}
				} else Al(e, t, n, r);
				break;
			case 31:
				Al(e, t, n, r);
				break;
			case 13:
				Al(e, t, n, r);
				break;
			case 23: break;
			case 22:
				a = t.stateNode, o = t.alternate, t.memoizedState === null ? a._visibility & 2 ? Al(e, t, n, r) : (a._visibility |= 2, Ml(e, t, n, r, (t.subtreeFlags & 10256) != 0 || !1)) : a._visibility & 2 ? Al(e, t, n, r) : Nl(e, t), i & 2048 && Ol(o, t);
				break;
			case 24:
				Al(e, t, n, r), i & 2048 && kl(t.alternate, t);
				break;
			default: Al(e, t, n, r);
		}
	}
	function Ml(e, t, n, r, i) {
		for (i = i && ((t.subtreeFlags & 10256) != 0 || !1), t = t.child; t !== null;) {
			var a = e, o = t, s = n, c = r, l = o.flags;
			switch (o.tag) {
				case 0:
				case 11:
				case 15:
					Ml(a, o, s, c, i), Kc(8, o);
					break;
				case 23: break;
				case 22:
					var u = o.stateNode;
					o.memoizedState === null ? (u._visibility |= 2, Ml(a, o, s, c, i)) : u._visibility & 2 ? Ml(a, o, s, c, i) : Nl(a, o), i && l & 2048 && Ol(o.alternate, o);
					break;
				case 24:
					Ml(a, o, s, c, i), i && l & 2048 && kl(o.alternate, o);
					break;
				default: Ml(a, o, s, c, i);
			}
			t = t.sibling;
		}
	}
	function Nl(e, t) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) {
			var n = e, r = t, i = r.flags;
			switch (r.tag) {
				case 22:
					Nl(n, r), i & 2048 && Ol(r.alternate, r);
					break;
				case 24:
					Nl(n, r), i & 2048 && kl(r.alternate, r);
					break;
				default: Nl(n, r);
			}
			t = t.sibling;
		}
	}
	var Pl = 8192;
	function Fl(e, t, n) {
		if (e.subtreeFlags & Pl) for (e = e.child; e !== null;) Il(e, t, n), e = e.sibling;
	}
	function Il(e, t, n) {
		switch (e.tag) {
			case 26:
				Fl(e, t, n), e.flags & Pl && e.memoizedState !== null && Jf(n, xl, e.memoizedState, e.memoizedProps);
				break;
			case 5:
				Fl(e, t, n);
				break;
			case 3:
			case 4:
				var r = xl;
				xl = xf(e.stateNode.containerInfo), Fl(e, t, n), xl = r;
				break;
			case 22:
				e.memoizedState === null && (r = e.alternate, r !== null && r.memoizedState !== null ? (r = Pl, Pl = 16777216, Fl(e, t, n), Pl = r) : Fl(e, t, n));
				break;
			default: Fl(e, t, n);
		}
	}
	function Ll(e) {
		var t = e.alternate;
		if (t !== null && (e = t.child, e !== null)) {
			t.child = null;
			do
				t = e.sibling, e.sibling = null, e = t;
			while (e !== null);
		}
	}
	function Rl(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				cl = r, Vl(r, e);
			}
			Ll(e);
		}
		if (e.subtreeFlags & 10256) for (e = e.child; e !== null;) zl(e), e = e.sibling;
	}
	function zl(e) {
		switch (e.tag) {
			case 0:
			case 11:
			case 15:
				Rl(e), e.flags & 2048 && qc(9, e, e.return);
				break;
			case 3:
				Rl(e);
				break;
			case 12:
				Rl(e);
				break;
			case 22:
				var t = e.stateNode;
				e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Bl(e)) : Rl(e);
				break;
			default: Rl(e);
		}
	}
	function Bl(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				cl = r, Vl(r, e);
			}
			Ll(e);
		}
		for (e = e.child; e !== null;) {
			switch (t = e, t.tag) {
				case 0:
				case 11:
				case 15:
					qc(8, t, t.return), Bl(t);
					break;
				case 22:
					n = t.stateNode, n._visibility & 2 && (n._visibility &= -3, Bl(t));
					break;
				default: Bl(t);
			}
			e = e.sibling;
		}
	}
	function Vl(e, t) {
		for (; cl !== null;) {
			var n = cl;
			switch (n.tag) {
				case 0:
				case 11:
				case 15:
					qc(8, n, t);
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
			if (r = n.child, r !== null) r.return = n, cl = r;
			else a: for (n = e; cl !== null;) {
				r = cl;
				var i = r.sibling, a = r.return;
				if (dl(r), r === n) {
					cl = null;
					break a;
				}
				if (i !== null) {
					i.return = a, cl = i;
					break a;
				}
				cl = a;
			}
		}
	}
	var Hl = {
		getCacheForType: function(e) {
			var t = aa(da), n = t.data.get(e);
			return n === void 0 && (n = e(), t.data.set(e, n)), n;
		},
		cacheSignal: function() {
			return aa(da).controller.signal;
		}
	}, Ul = typeof WeakMap == "function" ? WeakMap : Map, H = 0, U = null, W = null, G = 0, K = 0, Wl = null, Gl = !1, Kl = !1, ql = !1, Jl = 0, Yl = 0, Xl = 0, Zl = 0, Ql = 0, $l = 0, eu = 0, tu = null, nu = null, ru = !1, iu = 0, au = 0, ou = Infinity, su = null, cu = null, lu = 0, uu = null, du = null, fu = 0, pu = 0, mu = null, hu = null, gu = 0, _u = null;
	function vu() {
		return H & 2 && G !== 0 ? G & -G : T.T === null ? ft() : gd();
	}
	function yu() {
		if ($l === 0) if (!(G & 536870912) || F) {
			var e = Ze;
			Ze <<= 1, !(Ze & 3932160) && (Ze = 262144), $l = e;
		} else $l = 536870912;
		return e = so.current, e !== null && (e.flags |= 32), $l;
	}
	function bu(e, t, n) {
		(e === U && (K === 2 || K === 9) || e.cancelPendingCommit !== null) && (Du(e, 0), wu(e, G, $l, !1)), at(e, n), (!(H & 2) || e !== U) && (e === U && (!(H & 2) && (Zl |= n), Yl === 4 && wu(e, G, $l, !1)), cd(e));
	}
	function xu(e, t, n) {
		if (H & 6) throw Error(i(327));
		var r = !n && (t & 127) == 0 && (t & e.expiredLanes) === 0 || tt(e, t), a = r ? Fu(e, t) : Nu(e, t, !0), o = r;
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
					if ((t & 62914560) === t && (a = iu + 300 - Pe(), 10 < a)) {
						if (wu(r, t, $l, !Gl), et(r, 0, !0) !== 0) break a;
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
				unsuspend: cn
			}, Il(t, a, d);
			var m = (a & 62914560) === a ? iu - Pe() : (a & 4194048) === a ? au - Pe() : 0;
			if (m = Xf(d, m), m !== null) {
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
					if (!kr(a(), i)) return !1;
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
			var a = 31 - Ke(i), o = 1 << a;
			r[a] = -1, i &= ~o;
		}
		n !== 0 && st(e, n, t);
	}
	function Tu() {
		return H & 6 ? !0 : (ld(0, !1), !1);
	}
	function Eu() {
		if (W !== null) {
			if (K === 0) var e = W.return;
			else e = W, Zi = Xi = null, No(e), Ia = null, La = 0, e = W;
			for (; e !== null;) Gc(e.alternate, e), e = e.return;
			W = null;
		}
	}
	function Du(e, t) {
		var n = e.timeoutHandle;
		n !== -1 && (e.timeoutHandle = -1, Qd(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), fu = 0, Eu(), U = e, W = n = mi(e.current, null), G = t, K = 0, Wl = null, Gl = !1, Kl = tt(e, t), ql = !1, eu = $l = Ql = Zl = Xl = Yl = 0, nu = tu = null, ru = !1, t & 8 && (t |= t & 32);
		var r = e.entangledLanes;
		if (r !== 0) for (e = e.entanglements, r &= t; 0 < r;) {
			var i = 31 - Ke(r), a = 1 << i;
			t |= e[i], r &= ~a;
		}
		return Jl = t, P(), n;
	}
	function Ou(e, t) {
		I = null, T.H = Hs, t === Ea || t === Oa ? (t = Pa(), K = 3) : t === Da ? (t = Pa(), K = 4) : K = t === oc ? 8 : typeof t == "object" && t && typeof t.then == "function" ? 6 : 1, Wl = t, W === null && (Yl = 1, ec(e, Si(t, e.current)));
	}
	function ku() {
		var e = so.current;
		return e === null ? !0 : (G & 4194048) === G ? co === null : (G & 62914560) === G || G & 536870912 ? e === co : !1;
	}
	function Au() {
		var e = T.H;
		return T.H = Hs, e === null ? Hs : e;
	}
	function ju() {
		var e = T.A;
		return T.A = Hl, e;
	}
	function Mu() {
		Yl = 4, Gl || (G & 4194048) !== G && so.current !== null || (Kl = !0), !(Xl & 134217727) && !(Zl & 134217727) || U === null || wu(U, G, $l, !1);
	}
	function Nu(e, t, n) {
		var r = H;
		H |= 2;
		var i = Au(), a = ju();
		(U !== e || G !== t) && (su = null, Du(e, t)), t = !1;
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
							so.current === null && (t = !0);
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
		return t && e.shellSuspendCounter++, Zi = Xi = null, H = r, T.H = i, T.A = a, W === null && (U = null, G = 0, P()), o;
	}
	function Pu() {
		for (; W !== null;) Lu(W);
	}
	function Fu(e, t) {
		var n = H;
		H |= 2;
		var r = Au(), a = ju();
		U !== e || G !== t ? (su = null, ou = Pe() + 500, Du(e, t)) : Kl = tt(e, t);
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
								K !== 2 && K !== 9 || U !== e || (K = 7), cd(e);
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
									if (s ? qf(s) : c.stateNode.complete) {
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
		return Zi = Xi = null, T.H = r, T.A = a, H = n, W === null ? (U = null, G = 0, P(), Yl) : 0;
	}
	function Iu() {
		for (; W !== null && !Me();) Lu(W);
	}
	function Lu(e) {
		var t = Ic(e.alternate, e, Jl);
		e.memoizedProps = e.pendingProps, t === null ? Bu(e) : W = t;
	}
	function Ru(e) {
		var t = e, n = t.alternate;
		switch (t.tag) {
			case 15:
			case 0:
				t = bc(n, t, t.pendingProps, t.type, void 0, G);
				break;
			case 11:
				t = bc(n, t, t.pendingProps, t.type.render, t.ref, G);
				break;
			case 5: No(t);
			default: Gc(n, t), t = W = hi(t, Jl), t = Ic(n, t, Jl);
		}
		e.memoizedProps = e.pendingProps, t === null ? Bu(e) : W = t;
	}
	function zu(e, t, n, r) {
		Zi = Xi = null, No(t), Ia = null, La = 0;
		var i = t.return;
		try {
			if (ac(e, i, t, n, G)) {
				Yl = 1, ec(e, Si(n, e.current)), W = null;
				return;
			}
		} catch (t) {
			if (i !== null) throw W = i, t;
			Yl = 1, ec(e, Si(n, e.current)), W = null;
			return;
		}
		t.flags & 32768 ? (F || r === 1 ? e = !0 : Kl || G & 536870912 ? e = !1 : (Gl = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = so.current, r !== null && r.tag === 13 && (r.flags |= 16384))), Vu(t, e)) : Bu(t);
	}
	function Bu(e) {
		var t = e;
		do {
			if (t.flags & 32768) {
				Vu(t, Gl);
				return;
			}
			e = t.return;
			var n = Uc(t.alternate, t, Jl);
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
			var n = Wc(e.alternate, e);
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
		if (H & 6) throw Error(i(327));
		if (t !== null) {
			if (t === e.current) throw Error(i(177));
			if (o = t.lanes | t.childLanes, o |= ii, ot(e, n, o, s, c, l), e === U && (W = U = null, G = 0), du = t, uu = e, fu = n, pu = o, mu = a, hu = r, t.subtreeFlags & 10256 || t.flags & 10256 ? (e.callbackNode = null, e.callbackPriority = 0, td(Re, function() {
				return Ju(), null;
			})) : (e.callbackNode = null, e.callbackPriority = 0), r = (t.flags & 13878) != 0, t.subtreeFlags & 13878 || r) {
				r = T.T, T.T = null, a = E.p, E.p = 2, s = H, H |= 4;
				try {
					ll(e, t, n);
				} finally {
					H = s, E.p = a, T.T = r;
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
				n = T.T, T.T = null;
				var r = E.p;
				E.p = 2;
				var i = H;
				H |= 4;
				try {
					Sl(t, e);
					var a = Wd, o = Pr(e.containerInfo), s = a.focusedElem, c = a.selectionRange;
					if (o !== s && s && s.ownerDocument && Nr(s.ownerDocument.documentElement, s)) {
						if (c !== null && Fr(s)) {
							var l = c.start, u = c.end;
							if (u === void 0 && (u = l), "selectionStart" in s) s.selectionStart = l, s.selectionEnd = Math.min(u, s.value.length);
							else {
								var d = s.ownerDocument || document, f = d && d.defaultView || window;
								if (f.getSelection) {
									var p = f.getSelection(), m = s.textContent.length, h = Math.min(c.start, m), g = c.end === void 0 ? h : Math.min(c.end, m);
									!p.extend && h > g && (o = g, g = h, h = o);
									var _ = Mr(s, h), v = Mr(s, g);
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
					up = !!Ud, Wd = Ud = null;
				} finally {
					H = i, E.p = r, T.T = n;
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
				n = T.T, T.T = null;
				var r = E.p;
				E.p = 2;
				var i = H;
				H |= 4;
				try {
					ul(e, t.alternate, t);
				} finally {
					H = i, E.p = r, T.T = n;
				}
			}
			lu = 3;
		}
	}
	function Gu() {
		if (lu === 4 || lu === 3) {
			lu = 0, Ne();
			var e = uu, t = du, n = fu, r = hu;
			t.subtreeFlags & 10256 || t.flags & 10256 ? lu = 5 : (lu = 0, du = uu = null, Ku(e, e.pendingLanes));
			var i = e.pendingLanes;
			if (i === 0 && (cu = null), dt(n), t = t.stateNode, We && typeof We.onCommitFiberRoot == "function") try {
				We.onCommitFiberRoot(Ue, t, void 0, (t.current.flags & 128) == 128);
			} catch {}
			if (r !== null) {
				t = T.T, i = E.p, E.p = 2, T.T = null;
				try {
					for (var a = e.onRecoverableError, o = 0; o < r.length; o++) {
						var s = r[o];
						a(s.value, { componentStack: s.stack });
					}
				} finally {
					T.T = t, E.p = i;
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
		var n = dt(fu), r = T.T, a = E.p;
		try {
			E.p = 32 > n ? 32 : n, T.T = null, n = mu, mu = null;
			var o = uu, s = fu;
			if (lu = 0, du = uu = null, fu = 0, H & 6) throw Error(i(331));
			var c = H;
			if (H |= 4, zl(o.current), jl(o, o.current, s, n), H = c, ld(0, !1), We && typeof We.onPostCommitFiberRoot == "function") try {
				We.onPostCommitFiberRoot(Ue, o);
			} catch {}
			return !0;
		} finally {
			E.p = a, T.T = r, Ku(e, t);
		}
	}
	function Yu(e, t, n) {
		t = Si(n, t), t = nc(e.stateNode, t, 2), e = Ja(e, t, 2), e !== null && (at(e, 2), cd(e));
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
					e = Si(n, e), n = rc(2), r = Ja(t, n, 2), r !== null && (ic(n, r, t, e), at(r, 2), cd(r));
					break;
				}
			}
			t = t.return;
		}
	}
	function Xu(e, t, n) {
		var r = e.pingCache;
		if (r === null) {
			r = e.pingCache = new Ul();
			var i = /* @__PURE__ */ new Set();
			r.set(t, i);
		} else i = r.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), r.set(t, i));
		i.has(n) || (ql = !0, i.add(n), e = Zu.bind(null, e, t, n), t.then(e, e));
	}
	function Zu(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), e.pingedLanes |= e.suspendedLanes & n, e.warmLanes &= ~n, U === e && (G & n) === n && (Yl === 4 || Yl === 3 && (G & 62914560) === G && 300 > Pe() - iu ? !(H & 2) && Du(e, 0) : Ql |= n, eu === G && (eu = 0)), cd(e);
	}
	function Qu(e, t) {
		t === 0 && (t = rt()), e = si(e, t), e !== null && (at(e, t), cd(e));
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
		return Ae(e, t);
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
							a = (1 << 31 - Ke(42 | e) + 1) - 1, a &= i & ~(o & ~s), a = a & 201326741 ? a & 201326741 | 1 : a ? a | 2 : 0;
						}
						a !== 0 && (n = !0, md(r, a));
					} else a = G, a = et(r, r === U ? a : 0, r.cancelPendingCommit !== null || r.timeoutHandle !== -1), !(a & 3) || tt(r, a) || (n = !0, md(r, a));
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
		for (var t = Pe(), n = null, r = nd; r !== null;) {
			var i = r.next, a = fd(r, t);
			a === 0 ? (r.next = null, n === null ? nd = i : n.next = i, i === null && (rd = n)) : (n = r, (e !== 0 || a & 3) && (ad = !0)), r = i;
		}
		lu !== 0 && lu !== 5 || ld(e, !1), sd !== 0 && (sd = 0);
	}
	function fd(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes & -62914561; 0 < a;) {
			var o = 31 - Ke(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = nt(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
		if (t = U, n = G, n = et(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (K === 2 || K === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && je(r), e.callbackNode = null, e.callbackPriority = 0;
		if (!(n & 3) || tt(e, n)) {
			if (t = n & -n, t === e.callbackPriority) return t;
			switch (r !== null && je(r), dt(n)) {
				case 2:
				case 8:
					n = Le;
					break;
				case 32:
					n = Re;
					break;
				case 268435456:
					n = Be;
					break;
				default: n = Re;
			}
			return r = pd.bind(null, e), n = Ae(n, r), e.callbackPriority = t, e.callbackNode = n, t;
		}
		return r !== null && r !== null && je(r), e.callbackPriority = 2, e.callbackNode = null, 2;
	}
	function pd(e, t) {
		if (lu !== 0 && lu !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
		var n = e.callbackNode;
		if (qu() && e.callbackNode !== n) return null;
		var r = G;
		return r = et(e, e === U ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (xu(e, r, t), fd(e, Pe()), e.callbackNode != null && e.callbackNode === n ? pd.bind(null, e) : null);
	}
	function md(e, t) {
		if (qu()) return null;
		xu(e, t, !0);
	}
	function hd() {
		ef(function() {
			H & 6 ? Ae(Ie, ud) : dd();
		});
	}
	function gd() {
		if (sd === 0) {
			var e = ga;
			e === 0 && (e = Xe, Xe <<= 1, !(Xe & 261888) && (Xe = 256)), sd = e;
		}
		return sd;
	}
	function _d(e) {
		return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : sn("" + e);
	}
	function vd(e, t) {
		var n = t.ownerDocument.createElement("input");
		return n.name = t.name, n.value = t.value, e.id && n.setAttribute("form", e.id), t.parentNode.insertBefore(n, t), e = new FormData(e), n.parentNode.removeChild(n), e;
	}
	function yd(e, t, n, r, i) {
		if (t === "submit" && n && n.stateNode === i) {
			var a = _d((i[gt] || null).action), o = r.submitter;
			o && (t = (t = o[gt] || null) ? _d(t.formAction) : o.getAttribute("formAction"), t !== null && (a = t, o = null));
			var s = new kn("action", "action", null, r, i);
			e.push({
				event: s,
				listeners: [{
					instance: null,
					listener: function() {
						if (r.defaultPrevented) {
							if (sd !== 0) {
								var e = o ? vd(i, o) : new FormData(i);
								Os(n, {
									pending: !0,
									data: e,
									method: i.method,
									action: a
								}, null, e);
							}
						} else typeof a == "function" && (s.preventDefault(), e = o ? vd(i, o) : new FormData(i), Os(n, {
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
	for (var bd = 0; bd < M.length; bd++) {
		var xd = M[bd];
		ti(xd.toLowerCase(), "on" + (xd[0].toUpperCase() + xd.slice(1)));
	}
	ti(qr, "onAnimationEnd"), ti(Jr, "onAnimationIteration"), ti(Yr, "onAnimationStart"), ti("dblclick", "onDoubleClick"), ti("focusin", "onFocus"), ti("focusout", "onBlur"), ti(Xr, "onTransitionRun"), ti(Zr, "onTransitionStart"), ti(Qr, "onTransitionCancel"), ti($r, "onTransitionEnd"), Mt("onMouseEnter", ["mouseout", "mouseover"]), Mt("onMouseLeave", ["mouseout", "mouseover"]), Mt("onPointerEnter", ["pointerout", "pointerover"]), Mt("onPointerLeave", ["pointerout", "pointerover"]), jt("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), jt("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), jt("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), jt("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), jt("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), jt("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
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
		var n = t[vt];
		n === void 0 && (n = t[vt] = /* @__PURE__ */ new Set());
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
			e[Ed] = !0, kt.forEach(function(t) {
				t !== "selectionchange" && (Cd.has(t) || Td(t, !1, e), Td(t, !0, e));
			});
			var t = e.nodeType === 9 ? e : e.ownerDocument;
			t === null || t[Ed] || (t[Ed] = !0, Td("selectionchange", !1, t));
		}
	}
	function Od(e, t, n, r) {
		switch (_p(t)) {
			case 2:
				var i = dp;
				break;
			case 8:
				i = fp;
				break;
			default: i = pp;
		}
		n = i.bind(null, t, n, e), i = void 0, !vn || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
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
					if (s = wt(c), s === null) return;
					if (l = s.tag, l === 5 || l === 6 || l === 26 || l === 27) {
						r = a = s;
						continue a;
					}
					c = c.parentNode;
				}
			}
			r = r.return;
		}
		hn(function() {
			var r = a, i = un(n), s = [];
			a: {
				var c = ei.get(e);
				if (c !== void 0) {
					var l = kn, u = e;
					switch (e) {
						case "keypress": if (wn(n) === 0) break a;
						case "keydown":
						case "keyup":
							l = qn;
							break;
						case "focusin":
							u = "focus", l = Rn;
							break;
						case "focusout":
							u = "blur", l = Rn;
							break;
						case "beforeblur":
						case "afterblur":
							l = Rn;
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
							l = In;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							l = Ln;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							l = Yn;
							break;
						case qr:
						case Jr:
						case Yr:
							l = zn;
							break;
						case $r:
							l = Xn;
							break;
						case "scroll":
						case "scrollend":
							l = jn;
							break;
						case "wheel":
							l = Zn;
							break;
						case "copy":
						case "cut":
						case "paste":
							l = Bn;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							l = Jn;
							break;
						case "toggle":
						case "beforetoggle": l = Qn;
					}
					var d = (t & 4) != 0, f = !d && (e === "scroll" || e === "scrollend"), p = d ? c === null ? null : c + "Capture" : c;
					d = [];
					for (var m = r, h; m !== null;) {
						var g = m;
						if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = gn(m, p), g != null && d.push(Ad(m, g, h))), f) break;
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
					if (c = e === "mouseover" || e === "pointerover", l = e === "mouseout" || e === "pointerout", c && n !== ln && (u = n.relatedTarget || n.fromElement) && (wt(u) || u[_t])) break a;
					if ((l || c) && (c = i.window === i ? i : (c = i.ownerDocument) ? c.defaultView || c.parentWindow : window, l ? (u = n.relatedTarget || n.toElement, l = r, u = u ? wt(u) : null, u !== null && (f = o(u), d = u.tag, u !== f || d !== 5 && d !== 27 && d !== 6) && (u = null)) : (l = null, u = r), l !== u)) {
						if (d = In, g = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (d = Jn, g = "onPointerLeave", p = "onPointerEnter", m = "pointer"), f = l == null ? c : Et(l), h = u == null ? c : Et(u), c = new d(g, m + "leave", l, n, i), c.target = f, c.relatedTarget = h, g = null, wt(i) === r && (d = new d(p, m + "enter", u, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, l && u) b: {
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
					if (c = r ? Et(r) : window, l = c.nodeName && c.nodeName.toLowerCase(), l === "select" || l === "input" && c.type === "file") var v = vr;
					else if (fr(c)) if (yr) v = Or;
					else {
						v = Er;
						var y = Tr;
					}
					else l = c.nodeName, !l || l.toLowerCase() !== "input" || c.type !== "checkbox" && c.type !== "radio" ? r && rn(r.elementType) && (v = vr) : v = Dr;
					if (v && (v = v(e, r))) {
						pr(s, v, n, i);
						break a;
					}
					y && y(e, c, r), e === "focusout" && r && c.type === "number" && r.memoizedProps.value != null && Yt(c, "number", c.value);
				}
				switch (y = r ? Et(r) : window, e) {
					case "focusin":
						(fr(y) || y.contentEditable === "true") && (Lr = y, Rr = r, zr = null);
						break;
					case "focusout":
						zr = Rr = Lr = null;
						break;
					case "mousedown":
						Br = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						Br = !1, Vr(s, n, i);
						break;
					case "selectionchange": if (Ir) break;
					case "keydown":
					case "keyup": Vr(s, n, i);
				}
				var b;
				if (er) b: {
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
				else cr ? or(e, n) && (x = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (x = "onCompositionStart");
				x && (rr && n.locale !== "ko" && (cr || x !== "onCompositionStart" ? x === "onCompositionEnd" && cr && (b = Cn()) : (bn = i, xn = "value" in bn ? bn.value : bn.textContent, cr = !0)), y = jd(r, x), 0 < y.length && (x = new Vn(x, e, null, n, i), s.push({
					event: x,
					listeners: y
				}), b ? x.data = b : (b = sr(n), b !== null && (x.data = b)))), (b = nr ? lr(e, n) : ur(e, n)) && (x = jd(r, "onBeforeInput"), 0 < x.length && (y = new Vn("onBeforeInput", "beforeinput", null, n, i), s.push({
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
			if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = gn(e, n), i != null && r.unshift(Ad(e, i, a)), i = gn(e, t), i != null && r.push(Ad(e, i, a))), e.tag === 3) return r;
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
			s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = gn(n, a), l != null && o.unshift(Ad(n, l, c))) : i || (l = gn(n, a), l != null && o.push(Ad(n, l, c)))), n = n.return;
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
				typeof r == "string" ? t === "body" || t === "textarea" && r === "" || $t(e, r) : (typeof r == "number" || typeof r == "bigint") && t !== "body" && $t(e, "" + r);
				break;
			case "className":
				Rt(e, "class", r);
				break;
			case "tabIndex":
				Rt(e, "tabindex", r);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				Rt(e, n, r);
				break;
			case "style":
				nn(e, r, o);
				break;
			case "data": if (t !== "object") {
				Rt(e, "data", r);
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
				r = sn("" + r), e.setAttribute(n, r);
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
				r = sn("" + r), e.setAttribute(n, r);
				break;
			case "onClick":
				r != null && (e.onclick = cn);
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
				n = sn("" + r), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
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
				J("beforetoggle", e), J("toggle", e), Lt(e, "popover", r);
				break;
			case "xlinkActuate":
				zt(e, "http://www.w3.org/1999/xlink", "xlink:actuate", r);
				break;
			case "xlinkArcrole":
				zt(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", r);
				break;
			case "xlinkRole":
				zt(e, "http://www.w3.org/1999/xlink", "xlink:role", r);
				break;
			case "xlinkShow":
				zt(e, "http://www.w3.org/1999/xlink", "xlink:show", r);
				break;
			case "xlinkTitle":
				zt(e, "http://www.w3.org/1999/xlink", "xlink:title", r);
				break;
			case "xlinkType":
				zt(e, "http://www.w3.org/1999/xlink", "xlink:type", r);
				break;
			case "xmlBase":
				zt(e, "http://www.w3.org/XML/1998/namespace", "xml:base", r);
				break;
			case "xmlLang":
				zt(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", r);
				break;
			case "xmlSpace":
				zt(e, "http://www.w3.org/XML/1998/namespace", "xml:space", r);
				break;
			case "is":
				Lt(e, "is", r);
				break;
			case "innerText":
			case "textContent": break;
			default: (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") && (n = an.get(n) || n, Lt(e, n, r));
		}
	}
	function Rd(e, t, n, r, a, o) {
		switch (n) {
			case "style":
				nn(e, r, o);
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
				typeof r == "string" ? $t(e, r) : (typeof r == "number" || typeof r == "bigint") && $t(e, "" + r);
				break;
			case "onScroll":
				r != null && J("scroll", e);
				break;
			case "onScrollEnd":
				r != null && J("scrollend", e);
				break;
			case "onClick":
				r != null && (e.onclick = cn);
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "innerHTML":
			case "ref": break;
			case "innerText":
			case "textContent": break;
			default: if (!At.hasOwnProperty(n)) a: {
				if (n[0] === "o" && n[1] === "n" && (a = n.endsWith("Capture"), t = n.slice(2, a ? n.length - 7 : void 0), o = e[gt] || null, o = o == null ? null : o[n], typeof o == "function" && e.removeEventListener(t, o, a), typeof r == "function")) {
					typeof o != "function" && o !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)), e.addEventListener(t, r, a);
					break a;
				}
				n in e ? e[n] = r : !0 === r ? e.setAttribute(n, "") : Lt(e, n, r);
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
				Jt(e, o, c, l, u, s, a, !1);
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
				t = o, n = s, e.multiple = !!r, t == null ? n != null && Xt(e, !!r, n, !0) : Xt(e, !!r, t, !1);
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
				Qt(e, r, a, o);
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
			default: if (rn(t)) {
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
				qt(e, s, c, l, u, d, o, a);
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
				t = c, n = s, r = m, p == null ? !!r != !!n && (t == null ? Xt(e, !!n, n ? [] : "", !1) : Xt(e, !!n, t, !0)) : Xt(e, !!n, p, !1);
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
				Zt(e, p, m);
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
			default: if (rn(t)) {
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
					e.removeChild(i), Ip(t);
					return;
				}
				r--;
			} else if (n === "$" || n === "$?" || n === "$~" || n === "$!" || n === "&") r++;
			else if (n === "html") vf(e.ownerDocument.documentElement);
			else if (n === "head") {
				n = e.ownerDocument.head, vf(n);
				for (var a = n.firstChild; a;) {
					var o = a.nextSibling, s = a.nodeName;
					a[St] || s === "SCRIPT" || s === "STYLE" || s === "LINK" && a.rel.toLowerCase() === "stylesheet" || n.removeChild(a), a = o;
				}
			} else n === "body" && vf(e.ownerDocument.body);
			n = i;
		} while (n);
		Ip(t);
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
					of(n), Ct(n);
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
			else if (!e[St]) switch (t) {
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
		Ct(e);
	}
	var yf = /* @__PURE__ */ new Map(), bf = /* @__PURE__ */ new Set();
	function xf(e) {
		return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument;
	}
	var Sf = E.d;
	E.d = {
		f: X,
		r: Cf,
		D: Ef,
		C: Df,
		L: Of,
		m: Z,
		X: Af,
		S: kf,
		M: jf
	};
	function X() {
		var e = Sf.f(), t = Tu();
		return e || t;
	}
	function Cf(e) {
		var t = Tt(e);
		t !== null && t.tag === 5 && t.type === "form" ? As(t) : Sf.r(e);
	}
	var wf = typeof document > "u" ? null : document;
	function Tf(e, t, n) {
		var r = wf;
		if (r && typeof t == "string" && t) {
			var i = Kt(t);
			i = "link[rel=\"" + e + "\"][href=\"" + i + "\"]", typeof n == "string" && (i += "[crossorigin=\"" + n + "\"]"), bf.has(i) || (bf.add(i), e = {
				rel: e,
				crossOrigin: n,
				href: t
			}, r.querySelector(i) === null && (t = r.createElement("link"), zd(t, "link", e), Ot(t), r.head.appendChild(t)));
		}
	}
	function Ef(e) {
		Sf.D(e), Tf("dns-prefetch", e, null);
	}
	function Df(e, t) {
		Sf.C(e, t), Tf("preconnect", e, t);
	}
	function Of(e, t, n) {
		Sf.L(e, t, n);
		var r = wf;
		if (r && e && t) {
			var i = "link[rel=\"preload\"][as=\"" + Kt(t) + "\"]";
			t === "image" && n && n.imageSrcSet ? (i += "[imagesrcset=\"" + Kt(n.imageSrcSet) + "\"]", typeof n.imageSizes == "string" && (i += "[imagesizes=\"" + Kt(n.imageSizes) + "\"]")) : i += "[href=\"" + Kt(e) + "\"]";
			var a = i;
			switch (t) {
				case "style":
					a = Nf(e);
					break;
				case "script": a = Lf(e);
			}
			yf.has(a) || (e = h({
				rel: "preload",
				href: t === "image" && n && n.imageSrcSet ? void 0 : e,
				as: t
			}, n), yf.set(a, e), r.querySelector(i) !== null || t === "style" && r.querySelector(Pf(a)) || t === "script" && r.querySelector(Rf(a)) || (t = r.createElement("link"), zd(t, "link", e), Ot(t), r.head.appendChild(t)));
		}
	}
	function Z(e, t) {
		Sf.m(e, t);
		var n = wf;
		if (n && e) {
			var r = t && typeof t.as == "string" ? t.as : "script", i = "link[rel=\"modulepreload\"][as=\"" + Kt(r) + "\"][href=\"" + Kt(e) + "\"]", a = i;
			switch (r) {
				case "audioworklet":
				case "paintworklet":
				case "serviceworker":
				case "sharedworker":
				case "worker":
				case "script": a = Lf(e);
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
					case "script": if (n.querySelector(Rf(a))) return;
				}
				r = n.createElement("link"), zd(r, "link", e), Ot(r), n.head.appendChild(r);
			}
		}
	}
	function kf(e, t, n) {
		Sf.S(e, t, n);
		var r = wf;
		if (r && e) {
			var i = Dt(r).hoistableStyles, a = Nf(e);
			t = t || "default";
			var o = i.get(a);
			if (!o) {
				var s = {
					loading: 0,
					preload: null
				};
				if (o = r.querySelector(Pf(a))) s.loading = 5;
				else {
					e = h({
						rel: "stylesheet",
						href: e,
						"data-precedence": t
					}, n), (n = yf.get(a)) && Vf(e, n);
					var c = o = r.createElement("link");
					Ot(c), zd(c, "link", e), c._p = new Promise(function(e, t) {
						c.onload = e, c.onerror = t;
					}), c.addEventListener("load", function() {
						s.loading |= 1;
					}), c.addEventListener("error", function() {
						s.loading |= 2;
					}), s.loading |= 4, Bf(o, t, r);
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
	function Af(e, t) {
		Sf.X(e, t);
		var n = wf;
		if (n && e) {
			var r = Dt(n).hoistableScripts, i = Lf(e), a = r.get(i);
			a || (a = n.querySelector(Rf(i)), a || (e = h({
				src: e,
				async: !0
			}, t), (t = yf.get(i)) && Hf(e, t), a = n.createElement("script"), Ot(a), zd(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function jf(e, t) {
		Sf.M(e, t);
		var n = wf;
		if (n && e) {
			var r = Dt(n).hoistableScripts, i = Lf(e), a = r.get(i);
			a || (a = n.querySelector(Rf(i)), a || (e = h({
				src: e,
				async: !0,
				type: "module"
			}, t), (t = yf.get(i)) && Hf(e, t), a = n.createElement("script"), Ot(a), zd(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Mf(e, t, n, r) {
		var a = (a = k.current) ? xf(a) : null;
		if (!a) throw Error(i(446));
		switch (e) {
			case "meta":
			case "title": return null;
			case "style": return typeof n.precedence == "string" && typeof n.href == "string" ? (t = Nf(n.href), n = Dt(a).hoistableStyles, r = n.get(t), r || (r = {
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
					e = Nf(n.href);
					var o = Dt(a).hoistableStyles, s = o.get(e);
					if (s || (a = a.ownerDocument || a, s = {
						type: "stylesheet",
						instance: null,
						count: 0,
						state: {
							loading: 0,
							preload: null
						}
					}, o.set(e, s), (o = a.querySelector(Pf(e))) && !o._p && (s.instance = o, s.state.loading = 5), yf.has(e) || (n = {
						rel: "preload",
						as: "style",
						href: n.href,
						crossOrigin: n.crossOrigin,
						integrity: n.integrity,
						media: n.media,
						hrefLang: n.hrefLang,
						referrerPolicy: n.referrerPolicy
					}, yf.set(e, n), o || If(a, e, n, s.state))), t && r === null) throw Error(i(528, ""));
					return s;
				}
				if (t && r !== null) throw Error(i(529, ""));
				return null;
			case "script": return t = n.async, n = n.src, typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = Lf(n), n = Dt(a).hoistableScripts, r = n.get(t), r || (r = {
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
	function Nf(e) {
		return "href=\"" + Kt(e) + "\"";
	}
	function Pf(e) {
		return "link[rel=\"stylesheet\"][" + e + "]";
	}
	function Ff(e) {
		return h({}, e, {
			"data-precedence": e.precedence,
			precedence: null
		});
	}
	function If(e, t, n, r) {
		e.querySelector("link[rel=\"preload\"][as=\"style\"][" + t + "]") ? r.loading = 1 : (t = e.createElement("link"), r.preload = t, t.addEventListener("load", function() {
			return r.loading |= 1;
		}), t.addEventListener("error", function() {
			return r.loading |= 2;
		}), zd(t, "link", n), Ot(t), e.head.appendChild(t));
	}
	function Lf(e) {
		return "[src=\"" + Kt(e) + "\"]";
	}
	function Rf(e) {
		return "script[async]" + e;
	}
	function zf(e, t, n) {
		if (t.count++, t.instance === null) switch (t.type) {
			case "style":
				var r = e.querySelector("style[data-href~=\"" + Kt(n.href) + "\"]");
				if (r) return t.instance = r, Ot(r), r;
				var a = h({}, n, {
					"data-href": n.href,
					"data-precedence": n.precedence,
					href: null,
					precedence: null
				});
				return r = (e.ownerDocument || e).createElement("style"), Ot(r), zd(r, "style", a), Bf(r, n.precedence, e), t.instance = r;
			case "stylesheet":
				a = Nf(n.href);
				var o = e.querySelector(Pf(a));
				if (o) return t.state.loading |= 4, t.instance = o, Ot(o), o;
				r = Ff(n), (a = yf.get(a)) && Vf(r, a), o = (e.ownerDocument || e).createElement("link"), Ot(o);
				var s = o;
				return s._p = new Promise(function(e, t) {
					s.onload = e, s.onerror = t;
				}), zd(o, "link", r), t.state.loading |= 4, Bf(o, n.precedence, e), t.instance = o;
			case "script": return o = Lf(n.src), (a = e.querySelector(Rf(o))) ? (t.instance = a, Ot(a), a) : (r = n, (a = yf.get(o)) && (r = h({}, n), Hf(r, a)), e = e.ownerDocument || e, a = e.createElement("script"), Ot(a), zd(a, "link", r), e.head.appendChild(a), t.instance = a);
			case "void": return null;
			default: throw Error(i(443, t.type));
		}
		else t.type === "stylesheet" && !(t.state.loading & 4) && (r = t.instance, t.state.loading |= 4, Bf(r, n.precedence, e));
		return t.instance;
	}
	function Bf(e, t, n) {
		for (var r = n.querySelectorAll("link[rel=\"stylesheet\"][data-precedence],style[data-precedence]"), i = r.length ? r[r.length - 1] : null, a = i, o = 0; o < r.length; o++) {
			var s = r[o];
			if (s.dataset.precedence === t) a = s;
			else if (a !== i) break;
		}
		a ? a.parentNode.insertBefore(e, a.nextSibling) : (t = n.nodeType === 9 ? n.head : n, t.insertBefore(e, t.firstChild));
	}
	function Vf(e, t) {
		e.crossOrigin ?? (e.crossOrigin = t.crossOrigin), e.referrerPolicy ?? (e.referrerPolicy = t.referrerPolicy), e.title ?? (e.title = t.title);
	}
	function Hf(e, t) {
		e.crossOrigin ?? (e.crossOrigin = t.crossOrigin), e.referrerPolicy ?? (e.referrerPolicy = t.referrerPolicy), e.integrity ?? (e.integrity = t.integrity);
	}
	var Uf = null;
	function Wf(e, t, n) {
		if (Uf === null) {
			var r = /* @__PURE__ */ new Map(), i = Uf = /* @__PURE__ */ new Map();
			i.set(n, r);
		} else i = Uf, r = i.get(n), r || (r = /* @__PURE__ */ new Map(), i.set(n, r));
		if (r.has(e)) return r;
		for (r.set(e, null), n = n.getElementsByTagName(e), i = 0; i < n.length; i++) {
			var a = n[i];
			if (!(a[St] || a[ht] || e === "link" && a.getAttribute("rel") === "stylesheet") && a.namespaceURI !== "http://www.w3.org/2000/svg") {
				var o = a.getAttribute(t) || "";
				o = e + o;
				var s = r.get(o);
				s ? s.push(a) : r.set(o, [a]);
			}
		}
		return r;
	}
	function Gf(e, t, n) {
		e = e.ownerDocument || e, e.head.insertBefore(n, t === "title" ? e.querySelector("head > title") : null);
	}
	function Kf(e, t, n) {
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
	function qf(e) {
		return !(e.type === "stylesheet" && !(e.state.loading & 3));
	}
	function Jf(e, t, n, r) {
		if (n.type === "stylesheet" && (typeof r.media != "string" || !1 !== matchMedia(r.media).matches) && !(n.state.loading & 4)) {
			if (n.instance === null) {
				var i = Nf(r.href), a = t.querySelector(Pf(i));
				if (a) {
					t = a._p, typeof t == "object" && t && typeof t.then == "function" && (e.count++, e = Zf.bind(e), t.then(e, e)), n.state.loading |= 4, n.instance = a, Ot(a);
					return;
				}
				a = t.ownerDocument || t, r = Ff(r), (i = yf.get(i)) && Vf(r, i), a = a.createElement("link"), Ot(a);
				var o = a;
				o._p = new Promise(function(e, t) {
					o.onload = e, o.onerror = t;
				}), zd(a, "link", r), n.instance = a;
			}
			e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(n, t), (t = n.state.preload) && !(n.state.loading & 3) && (e.count++, n = Zf.bind(e), t.addEventListener("load", n), t.addEventListener("error", n));
		}
	}
	var Yf = 0;
	function Xf(e, t) {
		return e.stylesheets && e.count === 0 && $f(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(n) {
			var r = setTimeout(function() {
				if (e.stylesheets && $f(e, e.stylesheets), e.unsuspend) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, 6e4 + t);
			0 < e.imgBytes && Yf === 0 && (Yf = 62500 * Hd());
			var i = setTimeout(function() {
				if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && $f(e, e.stylesheets), e.unsuspend)) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, (e.imgBytes > Yf ? 50 : 800) + t);
			return e.unsuspend = n, function() {
				e.unsuspend = null, clearTimeout(r), clearTimeout(i);
			};
		} : null;
	}
	function Zf() {
		if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
			if (this.stylesheets) $f(this, this.stylesheets);
			else if (this.unsuspend) {
				var e = this.unsuspend;
				this.unsuspend = null, e();
			}
		}
	}
	var Qf = null;
	function $f(e, t) {
		e.stylesheets = null, e.unsuspend !== null && (e.count++, Qf = /* @__PURE__ */ new Map(), t.forEach(ep, e), Qf = null, Zf.call(e));
	}
	function ep(e, t) {
		if (!(t.state.loading & 4)) {
			var n = Qf.get(e);
			if (n) var r = n.get(null);
			else {
				n = /* @__PURE__ */ new Map(), Qf.set(e, n);
				for (var i = e.querySelectorAll("link[data-precedence],style[data-precedence]"), a = 0; a < i.length; a++) {
					var o = i[a];
					(o.nodeName === "LINK" || o.getAttribute("media") !== "not all") && (n.set(o.dataset.precedence, o), r = o);
				}
				r && n.set(null, r);
			}
			i = t.instance, o = i.getAttribute("data-precedence"), a = n.get(o) || r, a === r && n.set(null, i), n.set(o, i), this.count++, r = Zf.bind(this), i.addEventListener("load", r), i.addEventListener("error", r), a ? a.parentNode.insertBefore(i, a.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(i, e.firstChild)), t.state.loading |= 4;
		}
	}
	var tp = {
		$$typeof: ee,
		Provider: null,
		Consumer: null,
		_currentValue: D,
		_currentValue2: D,
		_threadCount: 0
	};
	function np(e, t, n, r, i, a, o, s, c) {
		this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = it(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = it(0), this.hiddenUpdates = it(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = c, this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function rp(e, t, n, r, i, a, o, s, c, l, u, d) {
		return e = new np(e, t, n, o, c, l, u, d, s), t = 1, !0 === a && (t |= 24), a = fi(3, null, null, t), e.current = a, a.stateNode = e, t = fa(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: t
		}, Ga(a), e;
	}
	function ip(e) {
		return e ? (e = ui, e) : ui;
	}
	function ap(e, t, n, r, i, a) {
		i = ip(i), r.context === null ? r.context = i : r.pendingContext = i, r = qa(t), r.payload = { element: n }, a = a === void 0 ? null : a, a !== null && (r.callback = a), n = Ja(e, r, t), n !== null && (bu(n, e, t), Ya(n, e, t));
	}
	function op(e, t) {
		if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
			var n = e.retryLane;
			e.retryLane = n !== 0 && n < t ? n : t;
		}
	}
	function sp(e, t) {
		op(e, t), (e = e.alternate) && op(e, t);
	}
	function cp(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = si(e, 67108864);
			t !== null && bu(t, e, 67108864), sp(e, 67108864);
		}
	}
	function lp(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = vu();
			t = ut(t);
			var n = si(e, t);
			n !== null && bu(n, e, t), sp(e, t);
		}
	}
	var up = !0;
	function dp(e, t, n, r) {
		var i = T.T;
		T.T = null;
		var a = E.p;
		try {
			E.p = 2, pp(e, t, n, r);
		} finally {
			E.p = a, T.T = i;
		}
	}
	function fp(e, t, n, r) {
		var i = T.T;
		T.T = null;
		var a = E.p;
		try {
			E.p = 8, pp(e, t, n, r);
		} finally {
			E.p = a, T.T = i;
		}
	}
	function pp(e, t, n, r) {
		if (up) {
			var i = mp(r);
			if (i === null) kd(e, t, r, hp, n), Ep(e, r);
			else if (Op(i, e, t, n, r)) r.stopPropagation();
			else if (Ep(e, r), t & 4 && -1 < Tp.indexOf(e)) {
				for (; i !== null;) {
					var a = Tt(i);
					if (a !== null) switch (a.tag) {
						case 3:
							if (a = a.stateNode, a.current.memoizedState.isDehydrated) {
								var o = $e(a.pendingLanes);
								if (o !== 0) {
									var s = a;
									for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
										var c = 1 << 31 - Ke(o);
										s.entanglements[1] |= c, o &= ~c;
									}
									cd(a), !(H & 6) && (ou = Pe() + 500, ld(0, !1));
								}
							}
							break;
						case 31:
						case 13: s = si(a, 2), s !== null && bu(s, a, 2), Tu(), sp(a, 2);
					}
					if (a = mp(r), a === null && kd(e, t, r, hp, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else kd(e, t, r, null, n);
		}
	}
	function mp(e) {
		return e = un(e), gp(e);
	}
	var hp = null;
	function gp(e) {
		if (hp = null, e = wt(e), e !== null) {
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
		return hp = e, null;
	}
	function _p(e) {
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
			case "message": switch (Fe()) {
				case Ie: return 2;
				case Le: return 8;
				case Re:
				case ze: return 32;
				case Be: return 268435456;
				default: return 32;
			}
			default: return 32;
		}
	}
	var vp = !1, yp = null, bp = null, xp = null, Sp = /* @__PURE__ */ new Map(), Cp = /* @__PURE__ */ new Map(), wp = [], Tp = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
	function Ep(e, t) {
		switch (e) {
			case "focusin":
			case "focusout":
				yp = null;
				break;
			case "dragenter":
			case "dragleave":
				bp = null;
				break;
			case "mouseover":
			case "mouseout":
				xp = null;
				break;
			case "pointerover":
			case "pointerout":
				Sp.delete(t.pointerId);
				break;
			case "gotpointercapture":
			case "lostpointercapture": Cp.delete(t.pointerId);
		}
	}
	function Dp(e, t, n, r, i, a) {
		return e === null || e.nativeEvent !== a ? (e = {
			blockedOn: t,
			domEventName: n,
			eventSystemFlags: r,
			nativeEvent: a,
			targetContainers: [i]
		}, t !== null && (t = Tt(t), t !== null && cp(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
	}
	function Op(e, t, n, r, i) {
		switch (t) {
			case "focusin": return yp = Dp(yp, e, t, n, r, i), !0;
			case "dragenter": return bp = Dp(bp, e, t, n, r, i), !0;
			case "mouseover": return xp = Dp(xp, e, t, n, r, i), !0;
			case "pointerover":
				var a = i.pointerId;
				return Sp.set(a, Dp(Sp.get(a) || null, e, t, n, r, i)), !0;
			case "gotpointercapture": return a = i.pointerId, Cp.set(a, Dp(Cp.get(a) || null, e, t, n, r, i)), !0;
		}
		return !1;
	}
	function kp(e) {
		var t = wt(e.target);
		if (t !== null) {
			var n = o(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = s(n), t !== null) {
						e.blockedOn = t, pt(e.priority, function() {
							lp(n);
						});
						return;
					}
				} else if (t === 31) {
					if (t = c(n), t !== null) {
						e.blockedOn = t, pt(e.priority, function() {
							lp(n);
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
	function Ap(e) {
		if (e.blockedOn !== null) return !1;
		for (var t = e.targetContainers; 0 < t.length;) {
			var n = mp(e.nativeEvent);
			if (n === null) {
				n = e.nativeEvent;
				var r = new n.constructor(n.type, n);
				ln = r, n.target.dispatchEvent(r), ln = null;
			} else return t = Tt(n), t !== null && cp(t), e.blockedOn = n, !1;
			t.shift();
		}
		return !0;
	}
	function jp(e, t, n) {
		Ap(e) && n.delete(t);
	}
	function Mp() {
		vp = !1, yp !== null && Ap(yp) && (yp = null), bp !== null && Ap(bp) && (bp = null), xp !== null && Ap(xp) && (xp = null), Sp.forEach(jp), Cp.forEach(jp);
	}
	function Np(e, n) {
		e.blockedOn === n && (e.blockedOn = null, vp || (vp = !0, t.unstable_scheduleCallback(t.unstable_NormalPriority, Mp)));
	}
	var Pp = null;
	function Fp(e) {
		Pp !== e && (Pp = e, t.unstable_scheduleCallback(t.unstable_NormalPriority, function() {
			Pp === e && (Pp = null);
			for (var t = 0; t < e.length; t += 3) {
				var n = e[t], r = e[t + 1], i = e[t + 2];
				if (typeof r != "function") {
					if (gp(r || n) === null) continue;
					break;
				}
				var a = Tt(n);
				a !== null && (e.splice(t, 3), t -= 3, Os(a, {
					pending: !0,
					data: i,
					method: n.method,
					action: r
				}, r, i));
			}
		}));
	}
	function Ip(e) {
		function t(t) {
			return Np(t, e);
		}
		yp !== null && Np(yp, e), bp !== null && Np(bp, e), xp !== null && Np(xp, e), Sp.forEach(t), Cp.forEach(t);
		for (var n = 0; n < wp.length; n++) {
			var r = wp[n];
			r.blockedOn === e && (r.blockedOn = null);
		}
		for (; 0 < wp.length && (n = wp[0], n.blockedOn === null);) kp(n), n.blockedOn === null && wp.shift();
		if (n = (e.ownerDocument || e).$$reactFormReplay, n != null) for (r = 0; r < n.length; r += 3) {
			var i = n[r], a = n[r + 1], o = i[gt] || null;
			if (typeof a == "function") o || Fp(n);
			else if (o) {
				var s = null;
				if (a && a.hasAttribute("formAction")) {
					if (i = a, o = a[gt] || null) s = o.formAction;
					else if (gp(i) !== null) continue;
				} else s = o.action;
				typeof s == "function" ? n[r + 1] = s : (n.splice(r, 3), r -= 3), Fp(n);
			}
		}
	}
	function Lp() {
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
	function Rp(e) {
		this._internalRoot = e;
	}
	zp.prototype.render = Rp.prototype.render = function(e) {
		var t = this._internalRoot;
		if (t === null) throw Error(i(409));
		var n = t.current;
		ap(n, vu(), e, t, null, null);
	}, zp.prototype.unmount = Rp.prototype.unmount = function() {
		var e = this._internalRoot;
		if (e !== null) {
			this._internalRoot = null;
			var t = e.containerInfo;
			ap(e.current, 2, null, e, null, null), Tu(), t[_t] = null;
		}
	};
	function zp(e) {
		this._internalRoot = e;
	}
	zp.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = ft();
			e = {
				blockedOn: null,
				target: e,
				priority: t
			};
			for (var n = 0; n < wp.length && t !== 0 && t < wp[n].priority; n++);
			wp.splice(n, 0, e), n === 0 && kp(e);
		}
	};
	var Bp = n.version;
	if (Bp !== "19.2.5") throw Error(i(527, Bp, "19.2.5"));
	E.findDOMNode = function(e) {
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(i(188)) : (e = Object.keys(e).join(","), Error(i(268, e)));
		return e = d(t), e = e === null ? null : p(e), e = e === null ? null : e.stateNode, e;
	};
	var Vp = {
		bundleType: 0,
		version: "19.2.5",
		rendererPackageName: "react-dom",
		currentDispatcherRef: T,
		reconcilerVersion: "19.2.5"
	};
	if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
		var Hp = __REACT_DEVTOOLS_GLOBAL_HOOK__;
		if (!Hp.isDisabled && Hp.supportsFiber) try {
			Ue = Hp.inject(Vp), We = Hp;
		} catch {}
	}
	e.createRoot = function(e, t) {
		if (!a(e)) throw Error(i(299));
		var n = !1, r = "", o = Zs, s = Qs, c = $s;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onUncaughtError !== void 0 && (o = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = rp(e, 1, !1, null, null, n, r, null, o, s, c, Lp), e[_t] = t.current, Dd(e), new Rp(t);
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
function ee() {
	return S += 1, S;
}
function C(e, t) {
	return {
		start: document.createComment(`squilla:block:start:${e}:${t}`),
		end: document.createComment(`squilla:block:end:${e}`)
	};
}
function te(e, t, n, r, i) {
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
	document.body.appendChild(n), document.body.appendChild(a.content), document.body.appendChild(r);
}
function ne(e) {
	let t = e.startNode;
	for (; t;) {
		let n = t.nextSibling;
		if (t.parentNode?.removeChild(t), t === e.endNode) break;
		t = n;
	}
}
function re(e) {
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
function w(e, t) {
	for (let n of t) if (se(e, n.startNode, n.endNode)) return n;
	return null;
}
function ie(e) {
	let t = document.createDocumentFragment(), n = e.startNode;
	for (; n;) {
		let r = n.nextSibling;
		if (t.appendChild(n), n === e.endNode) break;
		n = r;
	}
	return t;
}
function ae(e, t, n) {
	if (t === n) return;
	let r = e[t];
	if (!r) return;
	let i = r.startNode.parentNode;
	if (!i) return;
	let a = e.filter((e, n) => n !== t)[n] ?? null, o = ie(r);
	a && a.startNode.parentNode === i ? i.insertBefore(o, a.startNode) : i.appendChild(o);
}
function oe(e, t) {
	let n = e.startNode.nextSibling;
	for (; n && n !== e.endNode;) {
		let e = n.nextSibling;
		n.parentNode?.removeChild(n), n = e;
	}
	let r = document.createElement("template");
	r.innerHTML = t, e.endNode.parentNode?.insertBefore(r.content, e.endNode);
}
function se(e, t, n) {
	let r = e;
	for (; r && r.parentNode !== t.parentNode;) r = r.parentNode;
	if (!r) return !1;
	let i = !!(t.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING), a = !!(n.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_PRECEDING);
	return i && a;
}
//#endregion
//#region src/insertBus.ts
var ce = null;
function le(e) {
	return ce = e, () => {
		ce === e && (ce = null);
	};
}
function ue(e) {
	ce && ce(e);
}
//#endregion
//#region node_modules/@dnd-kit/utilities/dist/utilities.esm.js
var T = /* @__PURE__ */ c(m());
function E() {
	var e = [...arguments];
	return (0, _.useMemo)(() => (t) => {
		e.forEach((e) => e(t));
	}, e);
}
var D = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0;
function de(e) {
	let t = Object.prototype.toString.call(e);
	return t === "[object Window]" || t === "[object global]";
}
function fe(e) {
	return "nodeType" in e;
}
function pe(e) {
	return e ? de(e) ? e : fe(e) ? e.ownerDocument?.defaultView ?? window : window : window;
}
function me(e) {
	let { Document: t } = pe(e);
	return e instanceof t;
}
function O(e) {
	return de(e) ? !1 : e instanceof pe(e).HTMLElement;
}
function he(e) {
	return e instanceof pe(e).SVGElement;
}
function ge(e) {
	return e ? de(e) ? e.document : fe(e) ? me(e) ? e : O(e) || he(e) ? e.ownerDocument : document : document : document;
}
var k = D ? _.useLayoutEffect : _.useEffect;
function _e(e) {
	let t = (0, _.useRef)(e);
	return k(() => {
		t.current = e;
	}), (0, _.useCallback)(function() {
		var e = [...arguments];
		return t.current == null ? void 0 : t.current(...e);
	}, []);
}
function ve() {
	let e = (0, _.useRef)(null);
	return [(0, _.useCallback)((t, n) => {
		e.current = setInterval(t, n);
	}, []), (0, _.useCallback)(() => {
		e.current !== null && (clearInterval(e.current), e.current = null);
	}, [])];
}
function ye(e, t) {
	t === void 0 && (t = [e]);
	let n = (0, _.useRef)(e);
	return k(() => {
		n.current !== e && (n.current = e);
	}, t), n;
}
function be(e, t) {
	let n = (0, _.useRef)();
	return (0, _.useMemo)(() => {
		let t = e(n.current);
		return n.current = t, t;
	}, [...t]);
}
function xe(e) {
	let t = _e(e), n = (0, _.useRef)(null);
	return [n, (0, _.useCallback)((e) => {
		e !== n.current && t?.(e, n.current), n.current = e;
	}, [])];
}
function Se(e) {
	let t = (0, _.useRef)();
	return (0, _.useEffect)(() => {
		t.current = e;
	}, [e]), t.current;
}
var Ce = {};
function we(e, t) {
	return (0, _.useMemo)(() => {
		if (t) return t;
		let n = Ce[e] == null ? 0 : Ce[e] + 1;
		return Ce[e] = n, e + "-" + n;
	}, [e, t]);
}
function Te(e) {
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
var Ee = /* @__PURE__ */ Te(1), De = /* @__PURE__ */ Te(-1);
function Oe(e) {
	return "clientX" in e && "clientY" in e;
}
function ke(e) {
	if (!e) return !1;
	let { KeyboardEvent: t } = pe(e.target);
	return t && e instanceof t;
}
function Ae(e) {
	if (!e) return !1;
	let { TouchEvent: t } = pe(e.target);
	return t && e instanceof t;
}
function je(e) {
	if (Ae(e)) {
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
	return Oe(e) ? {
		x: e.clientX,
		y: e.clientY
	} : null;
}
var Me = /* @__PURE__ */ Object.freeze({
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
		if (e) return [Me.Translate.toString(e), Me.Scale.toString(e)].join(" ");
	} },
	Transition: { toString(e) {
		let { property: t, duration: n, easing: r } = e;
		return t + " " + n + "ms " + r;
	} }
}), Ne = "a,frame,iframe,input:not([type=hidden]):not(:disabled),select:not(:disabled),textarea:not(:disabled),button:not(:disabled),*[tabindex]";
function Pe(e) {
	return e.matches(Ne) ? e : e.querySelector(Ne);
}
//#endregion
//#region node_modules/@dnd-kit/accessibility/dist/accessibility.esm.js
var Fe = { display: "none" };
function Ie(e) {
	let { id: t, value: n } = e;
	return _.createElement("div", {
		id: t,
		style: Fe
	}, n);
}
function Le(e) {
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
function Re() {
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
var ze = /* @__PURE__ */ (0, _.createContext)(null);
function Be(e) {
	let t = (0, _.useContext)(ze);
	(0, _.useEffect)(() => {
		if (!t) throw Error("useDndMonitor must be used within a children of <DndContext>");
		return t(e);
	}, [e, t]);
}
function Ve() {
	let [e] = (0, _.useState)(() => /* @__PURE__ */ new Set()), t = (0, _.useCallback)((t) => (e.add(t), () => e.delete(t)), [e]);
	return [(0, _.useCallback)((t) => {
		let { type: n, event: r } = t;
		e.forEach((e) => e[n]?.call(e, r));
	}, [e]), t];
}
var He = { draggable: "\n    To pick up a draggable item, press the space bar.\n    While dragging, use the arrow keys to move the item.\n    Press space again to drop the item in its new position, or press escape to cancel.\n  " }, Ue = {
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
function We(e) {
	let { announcements: t = Ue, container: n, hiddenTextDescribedById: r, screenReaderInstructions: i = He } = e, { announce: a, announcement: o } = Re(), s = we("DndLiveRegion"), [c, l] = (0, _.useState)(!1);
	if ((0, _.useEffect)(() => {
		l(!0);
	}, []), Be((0, _.useMemo)(() => ({
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
	let u = _.createElement(_.Fragment, null, _.createElement(Ie, {
		id: r,
		value: i.draggable
	}), _.createElement(Le, {
		id: s,
		announcement: o
	}));
	return n ? (0, T.createPortal)(u, n) : u;
}
var Ge;
(function(e) {
	e.DragStart = "dragStart", e.DragMove = "dragMove", e.DragEnd = "dragEnd", e.DragCancel = "dragCancel", e.DragOver = "dragOver", e.RegisterDroppable = "registerDroppable", e.SetDroppableDisabled = "setDroppableDisabled", e.UnregisterDroppable = "unregisterDroppable";
})(Ge || (Ge = {}));
function Ke() {}
function qe(e, t) {
	return (0, _.useMemo)(() => ({
		sensor: e,
		options: t ?? {}
	}), [e, t]);
}
function Je() {
	var e = [...arguments];
	return (0, _.useMemo)(() => [...e].filter((e) => e != null), [...e]);
}
var Ye = /* @__PURE__ */ Object.freeze({
	x: 0,
	y: 0
});
function Xe(e, t) {
	return Math.sqrt((e.x - t.x) ** 2 + (e.y - t.y) ** 2);
}
function Ze(e, t) {
	let { data: { value: n } } = e, { data: { value: r } } = t;
	return n - r;
}
function Qe(e, t) {
	let { data: { value: n } } = e, { data: { value: r } } = t;
	return r - n;
}
function $e(e) {
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
function et(e, t) {
	if (!e || e.length === 0) return null;
	let [n] = e;
	return t ? n[t] : n;
}
function tt(e, t, n) {
	return t === void 0 && (t = e.left), n === void 0 && (n = e.top), {
		x: t + e.width * .5,
		y: n + e.height * .5
	};
}
var nt = (e) => {
	let { collisionRect: t, droppableRects: n, droppableContainers: r } = e, i = tt(t, t.left, t.top), a = [];
	for (let e of r) {
		let { id: t } = e, r = n.get(t);
		if (r) {
			let n = Xe(tt(r), i);
			a.push({
				id: t,
				data: {
					droppableContainer: e,
					value: n
				}
			});
		}
	}
	return a.sort(Ze);
}, rt = (e) => {
	let { collisionRect: t, droppableRects: n, droppableContainers: r } = e, i = $e(t), a = [];
	for (let e of r) {
		let { id: t } = e, r = n.get(t);
		if (r) {
			let n = $e(r), o = i.reduce((e, t, r) => e + Xe(n[r], t), 0), s = Number((o / 4).toFixed(4));
			a.push({
				id: t,
				data: {
					droppableContainer: e,
					value: s
				}
			});
		}
	}
	return a.sort(Ze);
};
function it(e, t) {
	let n = Math.max(t.top, e.top), r = Math.max(t.left, e.left), i = Math.min(t.left + t.width, e.left + e.width), a = Math.min(t.top + t.height, e.top + e.height), o = i - r, s = a - n;
	if (r < i && n < a) {
		let n = t.width * t.height, r = e.width * e.height, i = o * s, a = i / (n + r - i);
		return Number(a.toFixed(4));
	}
	return 0;
}
var at = (e) => {
	let { collisionRect: t, droppableRects: n, droppableContainers: r } = e, i = [];
	for (let e of r) {
		let { id: r } = e, a = n.get(r);
		if (a) {
			let n = it(a, t);
			n > 0 && i.push({
				id: r,
				data: {
					droppableContainer: e,
					value: n
				}
			});
		}
	}
	return i.sort(Qe);
};
function ot(e, t, n) {
	return {
		...e,
		scaleX: t && n ? t.width / n.width : 1,
		scaleY: t && n ? t.height / n.height : 1
	};
}
function st(e, t) {
	return e && t ? {
		x: e.left - t.left,
		y: e.top - t.top
	} : Ye;
}
function ct(e) {
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
var lt = /* @__PURE__ */ ct(1);
function ut(e) {
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
function dt(e, t, n) {
	let r = ut(t);
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
var ft = { ignoreTransform: !1 };
function pt(e, t) {
	t === void 0 && (t = ft);
	let n = e.getBoundingClientRect();
	if (t.ignoreTransform) {
		let { transform: t, transformOrigin: r } = pe(e).getComputedStyle(e);
		t && (n = dt(n, t, r));
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
function mt(e) {
	return pt(e, { ignoreTransform: !0 });
}
function ht(e) {
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
function gt(e, t) {
	return t === void 0 && (t = pe(e).getComputedStyle(e)), t.position === "fixed";
}
function _t(e, t) {
	t === void 0 && (t = pe(e).getComputedStyle(e));
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
function vt(e, t) {
	let n = [];
	function r(i) {
		if (t != null && n.length >= t || !i) return n;
		if (me(i) && i.scrollingElement != null && !n.includes(i.scrollingElement)) return n.push(i.scrollingElement), n;
		if (!O(i) || he(i) || n.includes(i)) return n;
		let a = pe(e).getComputedStyle(i);
		return i !== e && _t(i, a) && n.push(i), gt(i, a) ? n : r(i.parentNode);
	}
	return e ? r(e) : n;
}
function yt(e) {
	let [t] = vt(e, 1);
	return t ?? null;
}
function bt(e) {
	return !D || !e ? null : de(e) ? e : fe(e) ? me(e) || e === ge(e).scrollingElement ? window : O(e) ? e : null : null;
}
function xt(e) {
	return de(e) ? e.scrollX : e.scrollLeft;
}
function St(e) {
	return de(e) ? e.scrollY : e.scrollTop;
}
function Ct(e) {
	return {
		x: xt(e),
		y: St(e)
	};
}
var wt;
(function(e) {
	e[e.Forward = 1] = "Forward", e[e.Backward = -1] = "Backward";
})(wt || (wt = {}));
function Tt(e) {
	return !D || !e ? !1 : e === document.scrollingElement;
}
function Et(e) {
	let t = {
		x: 0,
		y: 0
	}, n = Tt(e) ? {
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
var Dt = {
	x: .2,
	y: .2
};
function Ot(e, t, n, r, i) {
	let { top: a, left: o, right: s, bottom: c } = n;
	r === void 0 && (r = 10), i === void 0 && (i = Dt);
	let { isTop: l, isBottom: u, isLeft: d, isRight: f } = Et(e), p = {
		x: 0,
		y: 0
	}, m = {
		x: 0,
		y: 0
	}, h = {
		height: t.height * i.y,
		width: t.width * i.x
	};
	return !l && a <= t.top + h.height ? (p.y = wt.Backward, m.y = r * Math.abs((t.top + h.height - a) / h.height)) : !u && c >= t.bottom - h.height && (p.y = wt.Forward, m.y = r * Math.abs((t.bottom - h.height - c) / h.height)), !f && s >= t.right - h.width ? (p.x = wt.Forward, m.x = r * Math.abs((t.right - h.width - s) / h.width)) : !d && o <= t.left + h.width && (p.x = wt.Backward, m.x = r * Math.abs((t.left + h.width - o) / h.width)), {
		direction: p,
		speed: m
	};
}
function kt(e) {
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
function At(e) {
	return e.reduce((e, t) => Ee(e, Ct(t)), Ye);
}
function jt(e) {
	return e.reduce((e, t) => e + xt(t), 0);
}
function Mt(e) {
	return e.reduce((e, t) => e + St(t), 0);
}
function Nt(e, t) {
	if (t === void 0 && (t = pt), !e) return;
	let { top: n, left: r, bottom: i, right: a } = t(e);
	yt(e) && (i <= 0 || a <= 0 || n >= window.innerHeight || r >= window.innerWidth) && e.scrollIntoView({
		block: "center",
		inline: "center"
	});
}
var Pt = [[
	"x",
	["left", "right"],
	jt
], [
	"y",
	["top", "bottom"],
	Mt
]], Ft = class {
	constructor(e, t) {
		this.rect = void 0, this.width = void 0, this.height = void 0, this.top = void 0, this.bottom = void 0, this.right = void 0, this.left = void 0;
		let n = vt(t), r = At(n);
		this.rect = { ...e }, this.width = e.width, this.height = e.height;
		for (let [e, t, i] of Pt) for (let a of t) Object.defineProperty(this, a, {
			get: () => {
				let t = i(n), o = r[e] - t;
				return this.rect[a] + o;
			},
			enumerable: !0
		});
		Object.defineProperty(this, "rect", { enumerable: !1 });
	}
}, It = class {
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
function Lt(e) {
	let { EventTarget: t } = pe(e);
	return e instanceof t ? e : ge(e);
}
function Rt(e, t) {
	let n = Math.abs(e.x), r = Math.abs(e.y);
	return typeof t == "number" ? Math.sqrt(n ** 2 + r ** 2) > t : "x" in t && "y" in t ? n > t.x && r > t.y : "x" in t ? n > t.x : "y" in t ? r > t.y : !1;
}
var zt;
(function(e) {
	e.Click = "click", e.DragStart = "dragstart", e.Keydown = "keydown", e.ContextMenu = "contextmenu", e.Resize = "resize", e.SelectionChange = "selectionchange", e.VisibilityChange = "visibilitychange";
})(zt || (zt = {}));
function Bt(e) {
	e.preventDefault();
}
function Vt(e) {
	e.stopPropagation();
}
var A;
(function(e) {
	e.Space = "Space", e.Down = "ArrowDown", e.Right = "ArrowRight", e.Left = "ArrowLeft", e.Up = "ArrowUp", e.Esc = "Escape", e.Enter = "Enter", e.Tab = "Tab";
})(A || (A = {}));
var Ht = {
	start: [A.Space, A.Enter],
	cancel: [A.Esc],
	end: [
		A.Space,
		A.Enter,
		A.Tab
	]
}, Ut = (e, t) => {
	let { currentCoordinates: n } = t;
	switch (e.code) {
		case A.Right: return {
			...n,
			x: n.x + 25
		};
		case A.Left: return {
			...n,
			x: n.x - 25
		};
		case A.Down: return {
			...n,
			y: n.y + 25
		};
		case A.Up: return {
			...n,
			y: n.y - 25
		};
	}
}, Wt = class {
	constructor(e) {
		this.props = void 0, this.autoScrollEnabled = !1, this.referenceCoordinates = void 0, this.listeners = void 0, this.windowListeners = void 0, this.props = e;
		let { event: { target: t } } = e;
		this.props = e, this.listeners = new It(ge(t)), this.windowListeners = new It(pe(t)), this.handleKeyDown = this.handleKeyDown.bind(this), this.handleCancel = this.handleCancel.bind(this), this.attach();
	}
	attach() {
		this.handleStart(), this.windowListeners.add(zt.Resize, this.handleCancel), this.windowListeners.add(zt.VisibilityChange, this.handleCancel), setTimeout(() => this.listeners.add(zt.Keydown, this.handleKeyDown));
	}
	handleStart() {
		let { activeNode: e, onStart: t } = this.props, n = e.node.current;
		n && Nt(n), t(Ye);
	}
	handleKeyDown(e) {
		if (ke(e)) {
			let { active: t, context: n, options: r } = this.props, { keyboardCodes: i = Ht, coordinateGetter: a = Ut, scrollBehavior: o = "smooth" } = r, { code: s } = e;
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
			} : Ye;
			this.referenceCoordinates || (this.referenceCoordinates = l);
			let u = a(e, {
				active: t,
				context: n.current,
				currentCoordinates: l
			});
			if (u) {
				let t = De(u, l), r = {
					x: 0,
					y: 0
				}, { scrollableAncestors: i } = n.current;
				for (let n of i) {
					let i = e.code, { isTop: a, isRight: s, isLeft: c, isBottom: l, maxScroll: d, minScroll: f } = Et(n), p = kt(n), m = {
						x: Math.min(i === A.Right ? p.right - p.width / 2 : p.right, Math.max(i === A.Right ? p.left : p.left + p.width / 2, u.x)),
						y: Math.min(i === A.Down ? p.bottom - p.height / 2 : p.bottom, Math.max(i === A.Down ? p.top : p.top + p.height / 2, u.y))
					}, h = i === A.Right && !s || i === A.Left && !c, g = i === A.Down && !l || i === A.Up && !a;
					if (h && m.x !== u.x) {
						let e = n.scrollLeft + t.x, a = i === A.Right && e <= d.x || i === A.Left && e >= f.x;
						if (a && !t.y) {
							n.scrollTo({
								left: e,
								behavior: o
							});
							return;
						}
						a ? r.x = n.scrollLeft - e : r.x = i === A.Right ? n.scrollLeft - d.x : n.scrollLeft - f.x, r.x && n.scrollBy({
							left: -r.x,
							behavior: o
						});
						break;
					} else if (g && m.y !== u.y) {
						let e = n.scrollTop + t.y, a = i === A.Down && e <= d.y || i === A.Up && e >= f.y;
						if (a && !t.x) {
							n.scrollTo({
								top: e,
								behavior: o
							});
							return;
						}
						a ? r.y = n.scrollTop - e : r.y = i === A.Down ? n.scrollTop - d.y : n.scrollTop - f.y, r.y && n.scrollBy({
							top: -r.y,
							behavior: o
						});
						break;
					}
				}
				this.handleMove(e, Ee(De(u, this.referenceCoordinates), r));
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
Wt.activators = [{
	eventName: "onKeyDown",
	handler: (e, t, n) => {
		let { keyboardCodes: r = Ht, onActivation: i } = t, { active: a } = n, { code: o } = e.nativeEvent;
		if (r.start.includes(o)) {
			let t = a.activatorNode.current;
			return t && e.target !== t ? !1 : (e.preventDefault(), i?.({ event: e.nativeEvent }), !0);
		}
		return !1;
	}
}];
function Gt(e) {
	return !!(e && "distance" in e);
}
function Kt(e) {
	return !!(e && "delay" in e);
}
var qt = class {
	constructor(e, t, n) {
		n === void 0 && (n = Lt(e.event.target)), this.props = void 0, this.events = void 0, this.autoScrollEnabled = !0, this.document = void 0, this.activated = !1, this.initialCoordinates = void 0, this.timeoutId = null, this.listeners = void 0, this.documentListeners = void 0, this.windowListeners = void 0, this.props = e, this.events = t;
		let { event: r } = e, { target: i } = r;
		this.props = e, this.events = t, this.document = ge(i), this.documentListeners = new It(this.document), this.listeners = new It(n), this.windowListeners = new It(pe(i)), this.initialCoordinates = je(r) ?? Ye, this.handleStart = this.handleStart.bind(this), this.handleMove = this.handleMove.bind(this), this.handleEnd = this.handleEnd.bind(this), this.handleCancel = this.handleCancel.bind(this), this.handleKeydown = this.handleKeydown.bind(this), this.removeTextSelection = this.removeTextSelection.bind(this), this.attach();
	}
	attach() {
		let { events: e, props: { options: { activationConstraint: t, bypassActivationConstraint: n } } } = this;
		if (this.listeners.add(e.move.name, this.handleMove, { passive: !1 }), this.listeners.add(e.end.name, this.handleEnd), e.cancel && this.listeners.add(e.cancel.name, this.handleCancel), this.windowListeners.add(zt.Resize, this.handleCancel), this.windowListeners.add(zt.DragStart, Bt), this.windowListeners.add(zt.VisibilityChange, this.handleCancel), this.windowListeners.add(zt.ContextMenu, Bt), this.documentListeners.add(zt.Keydown, this.handleKeydown), t) {
			if (n != null && n({
				event: this.props.event,
				activeNode: this.props.activeNode,
				options: this.props.options
			})) return this.handleStart();
			if (Kt(t)) {
				this.timeoutId = setTimeout(this.handleStart, t.delay), this.handlePending(t);
				return;
			}
			if (Gt(t)) {
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
		e && (this.activated = !0, this.documentListeners.add(zt.Click, Vt, { capture: !0 }), this.removeTextSelection(), this.documentListeners.add(zt.SelectionChange, this.removeTextSelection), t(e));
	}
	handleMove(e) {
		let { activated: t, initialCoordinates: n, props: r } = this, { onMove: i, options: { activationConstraint: a } } = r;
		if (!n) return;
		let o = je(e) ?? Ye, s = De(n, o);
		if (!t && a) {
			if (Gt(a)) {
				if (a.tolerance != null && Rt(s, a.tolerance)) return this.handleCancel();
				if (Rt(s, a.distance)) return this.handleStart();
			}
			if (Kt(a) && Rt(s, a.tolerance)) return this.handleCancel();
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
		e.code === A.Esc && this.handleCancel();
	}
	removeTextSelection() {
		var e;
		(e = this.document.getSelection()) == null || e.removeAllRanges();
	}
}, Jt = {
	cancel: { name: "pointercancel" },
	move: { name: "pointermove" },
	end: { name: "pointerup" }
}, Yt = class extends qt {
	constructor(e) {
		let { event: t } = e, n = ge(t.target);
		super(e, Jt, n);
	}
};
Yt.activators = [{
	eventName: "onPointerDown",
	handler: (e, t) => {
		let { nativeEvent: n } = e, { onActivation: r } = t;
		return !n.isPrimary || n.button !== 0 ? !1 : (r?.({ event: n }), !0);
	}
}];
var Xt = {
	move: { name: "mousemove" },
	end: { name: "mouseup" }
}, Zt;
(function(e) {
	e[e.RightClick = 2] = "RightClick";
})(Zt || (Zt = {}));
var Qt = class extends qt {
	constructor(e) {
		super(e, Xt, ge(e.event.target));
	}
};
Qt.activators = [{
	eventName: "onMouseDown",
	handler: (e, t) => {
		let { nativeEvent: n } = e, { onActivation: r } = t;
		return n.button === Zt.RightClick ? !1 : (r?.({ event: n }), !0);
	}
}];
var $t = {
	cancel: { name: "touchcancel" },
	move: { name: "touchmove" },
	end: { name: "touchend" }
}, en = class extends qt {
	constructor(e) {
		super(e, $t);
	}
	static setup() {
		return window.addEventListener($t.move.name, e, {
			capture: !1,
			passive: !1
		}), function() {
			window.removeEventListener($t.move.name, e);
		};
		function e() {}
	}
};
en.activators = [{
	eventName: "onTouchStart",
	handler: (e, t) => {
		let { nativeEvent: n } = e, { onActivation: r } = t, { touches: i } = n;
		return i.length > 1 ? !1 : (r?.({ event: n }), !0);
	}
}];
var tn;
(function(e) {
	e[e.Pointer = 0] = "Pointer", e[e.DraggableRect = 1] = "DraggableRect";
})(tn || (tn = {}));
var nn;
(function(e) {
	e[e.TreeOrder = 0] = "TreeOrder", e[e.ReversedTreeOrder = 1] = "ReversedTreeOrder";
})(nn || (nn = {}));
function rn(e) {
	let { acceleration: t, activator: n = tn.Pointer, canScroll: r, draggingRect: i, enabled: a, interval: o = 5, order: s = nn.TreeOrder, pointerCoordinates: c, scrollableAncestors: l, scrollableAncestorRects: u, delta: d, threshold: f } = e, p = on({
		delta: d,
		disabled: !a
	}), [m, h] = ve(), g = (0, _.useRef)({
		x: 0,
		y: 0
	}), v = (0, _.useRef)({
		x: 0,
		y: 0
	}), y = (0, _.useMemo)(() => {
		switch (n) {
			case tn.Pointer: return c ? {
				top: c.y,
				bottom: c.y,
				left: c.x,
				right: c.x
			} : null;
			case tn.DraggableRect: return i;
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
	}, []), S = (0, _.useMemo)(() => s === nn.TreeOrder ? [...l].reverse() : l, [s, l]);
	(0, _.useEffect)(() => {
		if (!a || !l.length || !y) {
			h();
			return;
		}
		for (let e of S) {
			if (r?.(e) === !1) continue;
			let n = u[l.indexOf(e)];
			if (!n) continue;
			let { direction: i, speed: a } = Ot(e, n, y, t, f);
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
var an = {
	x: {
		[wt.Backward]: !1,
		[wt.Forward]: !1
	},
	y: {
		[wt.Backward]: !1,
		[wt.Forward]: !1
	}
};
function on(e) {
	let { delta: t, disabled: n } = e, r = Se(t);
	return be((e) => {
		if (n || !r || !e) return an;
		let i = {
			x: Math.sign(t.x - r.x),
			y: Math.sign(t.y - r.y)
		};
		return {
			x: {
				[wt.Backward]: e.x[wt.Backward] || i.x === -1,
				[wt.Forward]: e.x[wt.Forward] || i.x === 1
			},
			y: {
				[wt.Backward]: e.y[wt.Backward] || i.y === -1,
				[wt.Forward]: e.y[wt.Forward] || i.y === 1
			}
		};
	}, [
		n,
		t,
		r
	]);
}
function sn(e, t) {
	let n = t == null ? void 0 : e.get(t), r = n ? n.node.current : null;
	return be((e) => t == null ? null : r ?? e ?? null, [r, t]);
}
function cn(e, t) {
	return (0, _.useMemo)(() => e.reduce((e, n) => {
		let { sensor: r } = n, i = r.activators.map((e) => ({
			eventName: e.eventName,
			handler: t(e.handler, n)
		}));
		return [...e, ...i];
	}, []), [e, t]);
}
var ln;
(function(e) {
	e[e.Always = 0] = "Always", e[e.BeforeDragging = 1] = "BeforeDragging", e[e.WhileDragging = 2] = "WhileDragging";
})(ln || (ln = {}));
var un;
(function(e) {
	e.Optimized = "optimized";
})(un || (un = {}));
var dn = /* @__PURE__ */ new Map();
function fn(e, t) {
	let { dragging: n, dependencies: r, config: i } = t, [a, o] = (0, _.useState)(null), { frequency: s, measure: c, strategy: l } = i, u = (0, _.useRef)(e), d = g(), f = ye(d), p = (0, _.useCallback)(function(e) {
		e === void 0 && (e = []), !f.current && o((t) => t === null ? e : t.concat(e.filter((e) => !t.includes(e))));
	}, [f]), m = (0, _.useRef)(null), h = be((t) => {
		if (d && !n) return dn;
		if (!t || t === dn || u.current !== e || a != null) {
			let t = /* @__PURE__ */ new Map();
			for (let n of e) {
				if (!n) continue;
				if (a && a.length > 0 && !a.includes(n.id) && n.rect.current) {
					t.set(n.id, n.rect.current);
					continue;
				}
				let e = n.node.current, r = e ? new Ft(c(e), e) : null;
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
			case ln.Always: return !1;
			case ln.BeforeDragging: return n;
			default: return !n;
		}
	}
}
function pn(e, t) {
	return be((n) => e ? n || (typeof t == "function" ? t(e) : e) : null, [t, e]);
}
function mn(e, t) {
	return pn(e, t);
}
function hn(e) {
	let { callback: t, disabled: n } = e, r = _e(t), i = (0, _.useMemo)(() => {
		if (n || typeof window > "u" || window.MutationObserver === void 0) return;
		let { MutationObserver: e } = window;
		return new e(r);
	}, [r, n]);
	return (0, _.useEffect)(() => () => i?.disconnect(), [i]), i;
}
function gn(e) {
	let { callback: t, disabled: n } = e, r = _e(t), i = (0, _.useMemo)(() => {
		if (n || typeof window > "u" || window.ResizeObserver === void 0) return;
		let { ResizeObserver: e } = window;
		return new e(r);
	}, [n]);
	return (0, _.useEffect)(() => () => i?.disconnect(), [i]), i;
}
function _n(e) {
	return new Ft(pt(e), e);
}
function vn(e, t, n) {
	t === void 0 && (t = _n);
	let [r, i] = (0, _.useState)(null);
	function a() {
		i((r) => {
			if (!e) return null;
			if (e.isConnected === !1) return r ?? n ?? null;
			let i = t(e);
			return JSON.stringify(r) === JSON.stringify(i) ? r : i;
		});
	}
	let o = hn({ callback(t) {
		if (e) for (let n of t) {
			let { type: t, target: r } = n;
			if (t === "childList" && r instanceof HTMLElement && r.contains(e)) {
				a();
				break;
			}
		}
	} }), s = gn({ callback: a });
	return k(() => {
		a(), e ? (s?.observe(e), o?.observe(document.body, {
			childList: !0,
			subtree: !0
		})) : (s?.disconnect(), o?.disconnect());
	}, [e]), r;
}
function yn(e) {
	return st(e, pn(e));
}
var bn = [];
function xn(e) {
	let t = (0, _.useRef)(e), n = be((n) => e ? n && n !== bn && e && t.current && e.parentNode === t.current.parentNode ? n : vt(e) : bn, [e]);
	return (0, _.useEffect)(() => {
		t.current = e;
	}, [e]), n;
}
function Sn(e) {
	let [t, n] = (0, _.useState)(null), r = (0, _.useRef)(e), i = (0, _.useCallback)((e) => {
		let t = bt(e.target);
		t && n((e) => e ? (e.set(t, Ct(t)), new Map(e)) : null);
	}, []);
	return (0, _.useEffect)(() => {
		let t = r.current;
		if (e !== t) {
			a(t);
			let o = e.map((e) => {
				let t = bt(e);
				return t ? (t.addEventListener("scroll", i, { passive: !0 }), [t, Ct(t)]) : null;
			}).filter((e) => e != null);
			n(o.length ? new Map(o) : null), r.current = e;
		}
		return () => {
			a(e), a(t);
		};
		function a(e) {
			e.forEach((e) => {
				bt(e)?.removeEventListener("scroll", i);
			});
		}
	}, [i, e]), (0, _.useMemo)(() => e.length ? t ? Array.from(t.values()).reduce((e, t) => Ee(e, t), Ye) : At(e) : Ye, [e, t]);
}
function Cn(e, t) {
	t === void 0 && (t = []);
	let n = (0, _.useRef)(null);
	return (0, _.useEffect)(() => {
		n.current = null;
	}, t), (0, _.useEffect)(() => {
		let t = e !== Ye;
		t && !n.current && (n.current = e), !t && n.current && (n.current = null);
	}, [e]), n.current ? De(e, n.current) : Ye;
}
function wn(e) {
	(0, _.useEffect)(() => {
		if (!D) return;
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
function Tn(e, t) {
	return (0, _.useMemo)(() => e.reduce((e, n) => {
		let { eventName: r, handler: i } = n;
		return e[r] = (e) => {
			i(e, t);
		}, e;
	}, {}), [e, t]);
}
function En(e) {
	return (0, _.useMemo)(() => e ? ht(e) : null, [e]);
}
var Dn = [];
function On(e, t) {
	t === void 0 && (t = pt);
	let [n] = e, r = En(n ? pe(n) : null), [i, a] = (0, _.useState)(Dn);
	function o() {
		a(() => e.length ? e.map((e) => Tt(e) ? r : new Ft(t(e), e)) : Dn);
	}
	let s = gn({ callback: o });
	return k(() => {
		s?.disconnect(), o(), e.forEach((e) => s?.observe(e));
	}, [e]), i;
}
function kn(e) {
	if (!e) return null;
	if (e.children.length > 1) return e;
	let t = e.children[0];
	return O(t) ? t : e;
}
function An(e) {
	let { measure: t } = e, [n, r] = (0, _.useState)(null), i = gn({ callback: (0, _.useCallback)((e) => {
		for (let { target: n } of e) if (O(n)) {
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
	}, [t]) }), [a, o] = xe((0, _.useCallback)((e) => {
		let n = kn(e);
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
var jn = [{
	sensor: Yt,
	options: {}
}, {
	sensor: Wt,
	options: {}
}], Mn = { current: {} }, Nn = {
	draggable: { measure: mt },
	droppable: {
		measure: mt,
		strategy: ln.WhileDragging,
		frequency: un.Optimized
	},
	dragOverlay: { measure: pt }
}, Pn = class extends Map {
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
}, Fn = {
	activatorEvent: null,
	active: null,
	activeNode: null,
	activeNodeRect: null,
	collisions: null,
	containerNodeRect: null,
	draggableNodes: /* @__PURE__ */ new Map(),
	droppableRects: /* @__PURE__ */ new Map(),
	droppableContainers: /* @__PURE__ */ new Pn(),
	over: null,
	dragOverlay: {
		nodeRef: { current: null },
		rect: null,
		setRef: Ke
	},
	scrollableAncestors: [],
	scrollableAncestorRects: [],
	measuringConfiguration: Nn,
	measureDroppableContainers: Ke,
	windowRect: null,
	measuringScheduled: !1
}, In = {
	activatorEvent: null,
	activators: [],
	active: null,
	activeNodeRect: null,
	ariaDescribedById: { draggable: "" },
	dispatch: Ke,
	draggableNodes: /* @__PURE__ */ new Map(),
	over: null,
	measureDroppableContainers: Ke
}, Ln = /* @__PURE__ */ (0, _.createContext)(In), Rn = /* @__PURE__ */ (0, _.createContext)(Fn);
function zn() {
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
		droppable: { containers: new Pn() }
	};
}
function Bn(e, t) {
	switch (t.type) {
		case Ge.DragStart: return {
			...e,
			draggable: {
				...e.draggable,
				initialCoordinates: t.initialCoordinates,
				active: t.active
			}
		};
		case Ge.DragMove: return e.draggable.active == null ? e : {
			...e,
			draggable: {
				...e.draggable,
				translate: {
					x: t.coordinates.x - e.draggable.initialCoordinates.x,
					y: t.coordinates.y - e.draggable.initialCoordinates.y
				}
			}
		};
		case Ge.DragEnd:
		case Ge.DragCancel: return {
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
		case Ge.RegisterDroppable: {
			let { element: n } = t, { id: r } = n, i = new Pn(e.droppable.containers);
			return i.set(r, n), {
				...e,
				droppable: {
					...e.droppable,
					containers: i
				}
			};
		}
		case Ge.SetDroppableDisabled: {
			let { id: n, key: r, disabled: i } = t, a = e.droppable.containers.get(n);
			if (!a || r !== a.key) return e;
			let o = new Pn(e.droppable.containers);
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
		case Ge.UnregisterDroppable: {
			let { id: n, key: r } = t, i = e.droppable.containers.get(n);
			if (!i || r !== i.key) return e;
			let a = new Pn(e.droppable.containers);
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
function Vn(e) {
	let { disabled: t } = e, { active: n, activatorEvent: r, draggableNodes: i } = (0, _.useContext)(Ln), a = Se(r), o = Se(n?.id);
	return (0, _.useEffect)(() => {
		if (!t && !r && a && o != null) {
			if (!ke(a) || document.activeElement === a.target) return;
			let e = i.get(o);
			if (!e) return;
			let { activatorNode: t, node: n } = e;
			if (!t.current && !n.current) return;
			requestAnimationFrame(() => {
				for (let e of [t.current, n.current]) {
					if (!e) continue;
					let t = Pe(e);
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
function Hn(e, t) {
	let { transform: n, ...r } = t;
	return e != null && e.length ? e.reduce((e, t) => t({
		transform: e,
		...r
	}), n) : n;
}
function Un(e) {
	return (0, _.useMemo)(() => ({
		draggable: {
			...Nn.draggable,
			...e?.draggable
		},
		droppable: {
			...Nn.droppable,
			...e?.droppable
		},
		dragOverlay: {
			...Nn.dragOverlay,
			...e?.dragOverlay
		}
	}), [
		e?.draggable,
		e?.droppable,
		e?.dragOverlay
	]);
}
function Wn(e) {
	let { activeNode: t, measure: n, initialRect: r, config: i = !0 } = e, a = (0, _.useRef)(!1), { x: o, y: s } = typeof i == "boolean" ? {
		x: i,
		y: i
	} : i;
	k(() => {
		if (!o && !s || !t) {
			a.current = !1;
			return;
		}
		if (a.current || !r) return;
		let e = t?.node.current;
		if (!e || e.isConnected === !1) return;
		let i = st(n(e), r);
		if (o || (i.x = 0), s || (i.y = 0), a.current = !0, Math.abs(i.x) > 0 || Math.abs(i.y) > 0) {
			let t = yt(e);
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
var Gn = /* @__PURE__ */ (0, _.createContext)({
	...Ye,
	scaleX: 1,
	scaleY: 1
}), Kn;
(function(e) {
	e[e.Uninitialized = 0] = "Uninitialized", e[e.Initializing = 1] = "Initializing", e[e.Initialized = 2] = "Initialized";
})(Kn || (Kn = {}));
var qn = /* @__PURE__ */ (0, _.memo)(function(e) {
	let { id: t, accessibility: n, autoScroll: r = !0, children: i, sensors: a = jn, collisionDetection: o = at, measuring: s, modifiers: c, ...l } = e, [u, d] = (0, _.useReducer)(Bn, void 0, zn), [f, p] = Ve(), [m, h] = (0, _.useState)(Kn.Uninitialized), g = m === Kn.Initialized, { draggable: { active: v, nodes: y, translate: b }, droppable: { containers: x } } = u, S = v == null ? null : y.get(v), ee = (0, _.useRef)({
		initial: null,
		translated: null
	}), C = (0, _.useMemo)(() => v == null ? null : {
		id: v,
		data: S?.data ?? Mn,
		rect: ee
	}, [v, S]), te = (0, _.useRef)(null), [ne, re] = (0, _.useState)(null), [w, ie] = (0, _.useState)(null), ae = ye(l, Object.values(l)), oe = we("DndDescribedBy", t), se = (0, _.useMemo)(() => x.getEnabled(), [x]), ce = Un(s), { droppableRects: le, measureDroppableContainers: ue, measuringScheduled: E } = fn(se, {
		dragging: g,
		dependencies: [b.x, b.y],
		config: ce.droppable
	}), D = sn(y, v), de = (0, _.useMemo)(() => w ? je(w) : null, [w]), fe = Ze(), me = mn(D, ce.draggable.measure);
	Wn({
		activeNode: v == null ? null : y.get(v),
		config: fe.layoutShiftCompensation,
		initialRect: me,
		measure: ce.draggable.measure
	});
	let O = vn(D, ce.draggable.measure, me), he = vn(D ? D.parentElement : null), ge = (0, _.useRef)({
		activatorEvent: null,
		active: null,
		activeNode: D,
		collisionRect: null,
		collisions: null,
		droppableRects: le,
		draggableNodes: y,
		draggingNode: null,
		draggingNodeRect: null,
		droppableContainers: x,
		over: null,
		scrollableAncestors: [],
		scrollAdjustedTranslate: null
	}), _e = x.getNodeFor(ge.current.over?.id), ve = An({ measure: ce.dragOverlay.measure }), be = ve.nodeRef.current ?? D, xe = g ? ve.rect ?? O : null, Se = !!(ve.nodeRef.current && ve.rect), Ce = yn(Se ? null : O), Te = En(be ? pe(be) : null), De = xn(g ? _e ?? D : null), Oe = On(De), ke = Hn(c, {
		transform: {
			x: b.x - Ce.x,
			y: b.y - Ce.y,
			scaleX: 1,
			scaleY: 1
		},
		activatorEvent: w,
		active: C,
		activeNodeRect: O,
		containerNodeRect: he,
		draggingNodeRect: xe,
		over: ge.current.over,
		overlayNodeRect: ve.rect,
		scrollableAncestors: De,
		scrollableAncestorRects: Oe,
		windowRect: Te
	}), Ae = de ? Ee(de, b) : null, Me = Sn(De), Ne = Cn(Me), Pe = Cn(Me, [O]), Fe = Ee(ke, Ne), Ie = xe ? lt(xe, ke) : null, Le = C && Ie ? o({
		active: C,
		collisionRect: Ie,
		droppableRects: le,
		droppableContainers: se,
		pointerCoordinates: Ae
	}) : null, Re = et(Le, "id"), [Be, He] = (0, _.useState)(null), Ue = ot(Se ? ke : Ee(ke, Pe), Be?.rect ?? null, O), Ke = (0, _.useRef)(null), qe = (0, _.useCallback)((e, t) => {
		let { sensor: n, options: r } = t;
		if (te.current == null) return;
		let i = y.get(te.current);
		if (!i) return;
		let a = e.nativeEvent;
		Ke.current = new n({
			active: te.current,
			activeNode: i,
			event: a,
			options: r,
			context: ge,
			onAbort(e) {
				if (!y.get(e)) return;
				let { onDragAbort: t } = ae.current, n = { id: e };
				t?.(n), f({
					type: "onDragAbort",
					event: n
				});
			},
			onPending(e, t, n, r) {
				if (!y.get(e)) return;
				let { onDragPending: i } = ae.current, a = {
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
				let t = te.current;
				if (t == null) return;
				let n = y.get(t);
				if (!n) return;
				let { onDragStart: r } = ae.current, i = {
					activatorEvent: a,
					active: {
						id: t,
						data: n.data,
						rect: ee
					}
				};
				(0, T.unstable_batchedUpdates)(() => {
					r?.(i), h(Kn.Initializing), d({
						type: Ge.DragStart,
						initialCoordinates: e,
						active: t
					}), f({
						type: "onDragStart",
						event: i
					}), re(Ke.current), ie(a);
				});
			},
			onMove(e) {
				d({
					type: Ge.DragMove,
					coordinates: e
				});
			},
			onEnd: o(Ge.DragEnd),
			onCancel: o(Ge.DragCancel)
		});
		function o(e) {
			return async function() {
				let { active: t, collisions: n, over: r, scrollAdjustedTranslate: i } = ge.current, o = null;
				if (t && i) {
					let { cancelDrop: s } = ae.current;
					o = {
						activatorEvent: a,
						active: t,
						collisions: n,
						delta: i,
						over: r
					}, e === Ge.DragEnd && typeof s == "function" && await Promise.resolve(s(o)) && (e = Ge.DragCancel);
				}
				te.current = null, (0, T.unstable_batchedUpdates)(() => {
					d({ type: e }), h(Kn.Uninitialized), He(null), re(null), ie(null), Ke.current = null;
					let t = e === Ge.DragEnd ? "onDragEnd" : "onDragCancel";
					if (o) {
						let e = ae.current[t];
						e?.(o), f({
							type: t,
							event: o
						});
					}
				});
			};
		}
	}, [y]), Je = cn(a, (0, _.useCallback)((e, t) => (n, r) => {
		let i = n.nativeEvent, a = y.get(r);
		if (te.current !== null || !a || i.dndKit || i.defaultPrevented) return;
		let o = { active: a };
		e(n, t.options, o) === !0 && (i.dndKit = { capturedBy: t.sensor }, te.current = r, qe(n, t));
	}, [y, qe]));
	wn(a), k(() => {
		O && m === Kn.Initializing && h(Kn.Initialized);
	}, [O, m]), (0, _.useEffect)(() => {
		let { onDragMove: e } = ae.current, { active: t, activatorEvent: n, collisions: r, over: i } = ge.current;
		if (!t || !n) return;
		let a = {
			active: t,
			activatorEvent: n,
			collisions: r,
			delta: {
				x: Fe.x,
				y: Fe.y
			},
			over: i
		};
		(0, T.unstable_batchedUpdates)(() => {
			e?.(a), f({
				type: "onDragMove",
				event: a
			});
		});
	}, [Fe.x, Fe.y]), (0, _.useEffect)(() => {
		let { active: e, activatorEvent: t, collisions: n, droppableContainers: r, scrollAdjustedTranslate: i } = ge.current;
		if (!e || te.current == null || !t || !i) return;
		let { onDragOver: a } = ae.current, o = r.get(Re), s = o && o.rect.current ? {
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
		(0, T.unstable_batchedUpdates)(() => {
			He(s), a?.(c), f({
				type: "onDragOver",
				event: c
			});
		});
	}, [Re]), k(() => {
		ge.current = {
			activatorEvent: w,
			active: C,
			activeNode: D,
			collisionRect: Ie,
			collisions: Le,
			droppableRects: le,
			draggableNodes: y,
			draggingNode: be,
			draggingNodeRect: xe,
			droppableContainers: x,
			over: Be,
			scrollableAncestors: De,
			scrollAdjustedTranslate: Fe
		}, ee.current = {
			initial: xe,
			translated: Ie
		};
	}, [
		C,
		D,
		Le,
		Ie,
		y,
		be,
		xe,
		le,
		x,
		Be,
		De,
		Fe
	]), rn({
		...fe,
		delta: b,
		draggingRect: Ie,
		pointerCoordinates: Ae,
		scrollableAncestors: De,
		scrollableAncestorRects: Oe
	});
	let Ye = (0, _.useMemo)(() => ({
		active: C,
		activeNode: D,
		activeNodeRect: O,
		activatorEvent: w,
		collisions: Le,
		containerNodeRect: he,
		dragOverlay: ve,
		draggableNodes: y,
		droppableContainers: x,
		droppableRects: le,
		over: Be,
		measureDroppableContainers: ue,
		scrollableAncestors: De,
		scrollableAncestorRects: Oe,
		measuringConfiguration: ce,
		measuringScheduled: E,
		windowRect: Te
	}), [
		C,
		D,
		O,
		w,
		Le,
		he,
		ve,
		y,
		x,
		le,
		Be,
		ue,
		De,
		Oe,
		ce,
		E,
		Te
	]), Xe = (0, _.useMemo)(() => ({
		activatorEvent: w,
		activators: Je,
		active: C,
		activeNodeRect: O,
		ariaDescribedById: { draggable: oe },
		dispatch: d,
		draggableNodes: y,
		over: Be,
		measureDroppableContainers: ue
	}), [
		w,
		Je,
		C,
		O,
		d,
		oe,
		y,
		Be,
		ue
	]);
	return _.createElement(ze.Provider, { value: p }, _.createElement(Ln.Provider, { value: Xe }, _.createElement(Rn.Provider, { value: Ye }, _.createElement(Gn.Provider, { value: Ue }, i)), _.createElement(Vn, { disabled: n?.restoreFocus === !1 })), _.createElement(We, {
		...n,
		hiddenTextDescribedById: oe
	}));
	function Ze() {
		let e = ne?.autoScrollEnabled === !1, t = typeof r == "object" ? r.enabled === !1 : r === !1, n = g && !e && !t;
		return typeof r == "object" ? {
			...r,
			enabled: n
		} : { enabled: n };
	}
}), Jn = /* @__PURE__ */ (0, _.createContext)(null), Yn = "button", Xn = "Draggable";
function Zn(e) {
	let { id: t, data: n, disabled: r = !1, attributes: i } = e, a = we(Xn), { activators: o, activatorEvent: s, active: c, activeNodeRect: l, ariaDescribedById: u, draggableNodes: d, over: f } = (0, _.useContext)(Ln), { role: p = Yn, roleDescription: m = "draggable", tabIndex: h = 0 } = i ?? {}, g = c?.id === t, v = (0, _.useContext)(g ? Gn : Jn), [y, b] = xe(), [x, S] = xe(), ee = Tn(o, t), C = ye(n);
	return k(() => (d.set(t, {
		id: t,
		key: a,
		node: y,
		activatorNode: x,
		data: C
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
			"aria-pressed": g && p === Yn ? !0 : void 0,
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
		listeners: r ? void 0 : ee,
		node: y,
		over: f,
		setNodeRef: b,
		setActivatorNodeRef: S,
		transform: v
	};
}
function Qn() {
	return (0, _.useContext)(Rn);
}
var $n = "Droppable", er = { timeout: 25 };
function tr(e) {
	let { data: t, disabled: n = !1, id: r, resizeObserverConfig: i } = e, a = we($n), { active: o, dispatch: s, over: c, measureDroppableContainers: l } = (0, _.useContext)(Ln), u = (0, _.useRef)({ disabled: n }), d = (0, _.useRef)(!1), f = (0, _.useRef)(null), p = (0, _.useRef)(null), { disabled: m, updateMeasurementsFor: h, timeout: g } = {
		...er,
		...i
	}, v = ye(h ?? r), y = gn({
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
	}), [b, x] = xe((0, _.useCallback)((e, t) => {
		y && (t && (y.unobserve(t), d.current = !1), e && y.observe(e));
	}, [y])), S = ye(t);
	return (0, _.useEffect)(() => {
		!y || !b.current || (y.disconnect(), d.current = !1, y.observe(b.current));
	}, [b, y]), (0, _.useEffect)(() => (s({
		type: Ge.RegisterDroppable,
		element: {
			id: r,
			key: a,
			disabled: n,
			node: b,
			rect: f,
			data: S
		}
	}), () => s({
		type: Ge.UnregisterDroppable,
		key: a,
		id: r
	})), [r]), (0, _.useEffect)(() => {
		n !== u.current.disabled && (s({
			type: Ge.SetDroppableDisabled,
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
function nr(e, t, n) {
	let r = e.slice();
	return r.splice(n < 0 ? r.length + n : n, 0, r.splice(t, 1)[0]), r;
}
function rr(e, t) {
	return e.reduce((e, n, r) => {
		let i = t.get(n);
		return i && (e[r] = i), e;
	}, Array(e.length));
}
function ir(e) {
	return e !== null && e >= 0;
}
function ar(e, t) {
	if (e === t) return !0;
	if (e.length !== t.length) return !1;
	for (let n = 0; n < e.length; n++) if (e[n] !== t[n]) return !1;
	return !0;
}
function or(e) {
	return typeof e == "boolean" ? {
		draggable: e,
		droppable: e
	} : e;
}
var sr = (e) => {
	let { rects: t, activeIndex: n, overIndex: r, index: i } = e, a = nr(t, r, n), o = t[i], s = a[i];
	return !s || !o ? null : {
		x: s.left - o.left,
		y: s.top - o.top,
		scaleX: s.width / o.width,
		scaleY: s.height / o.height
	};
}, cr = {
	scaleX: 1,
	scaleY: 1
}, lr = (e) => {
	let { activeIndex: t, activeNodeRect: n, index: r, rects: i, overIndex: a } = e, o = i[t] ?? n;
	if (!o) return null;
	if (r === t) {
		let e = i[a];
		return e ? {
			x: 0,
			y: t < a ? e.top + e.height - (o.top + o.height) : e.top - o.top,
			...cr
		} : null;
	}
	let s = ur(i, r, t);
	return r > t && r <= a ? {
		x: 0,
		y: -o.height - s,
		...cr
	} : r < t && r >= a ? {
		x: 0,
		y: o.height + s,
		...cr
	} : {
		x: 0,
		y: 0,
		...cr
	};
};
function ur(e, t, n) {
	let r = e[t], i = e[t - 1], a = e[t + 1];
	return r ? n < t ? i ? r.top - (i.top + i.height) : a ? a.top - (r.top + r.height) : 0 : a ? a.top - (r.top + r.height) : i ? r.top - (i.top + i.height) : 0 : 0;
}
var dr = "Sortable", fr = /* @__PURE__ */ _.createContext({
	activeIndex: -1,
	containerId: dr,
	disableTransforms: !1,
	items: [],
	overIndex: -1,
	useDragOverlay: !1,
	sortedRects: [],
	strategy: sr,
	disabled: {
		draggable: !1,
		droppable: !1
	}
});
function pr(e) {
	let { children: t, id: n, items: r, strategy: i = sr, disabled: a = !1 } = e, { active: o, dragOverlay: s, droppableRects: c, over: l, measureDroppableContainers: u } = Qn(), d = we(dr, n), f = s.rect !== null, p = (0, _.useMemo)(() => r.map((e) => typeof e == "object" && "id" in e ? e.id : e), [r]), m = o != null, h = o ? p.indexOf(o.id) : -1, g = l ? p.indexOf(l.id) : -1, v = (0, _.useRef)(p), y = !ar(p, v.current), b = g !== -1 && h === -1 || y, x = or(a);
	k(() => {
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
		sortedRects: rr(p, c),
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
	return _.createElement(fr.Provider, { value: S }, t);
}
var mr = (e) => {
	let { id: t, items: n, activeIndex: r, overIndex: i } = e;
	return nr(n, r, i).indexOf(t);
}, hr = (e) => {
	let { containerId: t, isSorting: n, wasDragging: r, index: i, items: a, newIndex: o, previousItems: s, previousContainerId: c, transition: l } = e;
	return !l || !r || s !== a && i === o ? !1 : n ? !0 : o !== i && t === c;
}, gr = {
	duration: 200,
	easing: "ease"
}, _r = "transform", vr = /* @__PURE__ */ Me.Transition.toString({
	property: _r,
	duration: 0,
	easing: "linear"
}), yr = { roleDescription: "sortable" };
function br(e) {
	let { disabled: t, index: n, node: r, rect: i } = e, [a, o] = (0, _.useState)(null), s = (0, _.useRef)(n);
	return k(() => {
		if (!t && n !== s.current && r.current) {
			let e = i.current;
			if (e) {
				let t = pt(r.current, { ignoreTransform: !0 }), n = {
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
function xr(e) {
	let { animateLayoutChanges: t = hr, attributes: n, disabled: r, data: i, getNewIndex: a = mr, id: o, strategy: s, resizeObserverConfig: c, transition: l = gr } = e, { items: u, containerId: d, activeIndex: f, disabled: p, disableTransforms: m, sortedRects: h, overIndex: g, useDragOverlay: v, strategy: y } = (0, _.useContext)(fr), b = Sr(r, p), x = u.indexOf(o), S = (0, _.useMemo)(() => ({
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
	]), ee = (0, _.useMemo)(() => u.slice(u.indexOf(o)), [u, o]), { rect: C, node: te, isOver: ne, setNodeRef: re } = tr({
		id: o,
		data: S,
		disabled: b.droppable,
		resizeObserverConfig: {
			updateMeasurementsFor: ee,
			...c
		}
	}), { active: w, activatorEvent: ie, activeNodeRect: ae, attributes: oe, setNodeRef: se, listeners: ce, isDragging: le, over: ue, setActivatorNodeRef: T, transform: D } = Zn({
		id: o,
		data: S,
		attributes: {
			...yr,
			...n
		},
		disabled: b.draggable
	}), de = E(re, se), fe = !!w, pe = fe && !m && ir(f) && ir(g), me = !v && le, O = pe ? (me && pe ? D : null) ?? (s ?? y)({
		rects: h,
		activeNodeRect: ae,
		activeIndex: f,
		overIndex: g,
		index: x
	}) : null, he = ir(f) && ir(g) ? a({
		id: o,
		items: u,
		activeIndex: f,
		overIndex: g
	}) : x, ge = w?.id, k = (0, _.useRef)({
		activeId: ge,
		items: u,
		newIndex: he,
		containerId: d
	}), _e = u !== k.current.items, ve = t({
		active: w,
		containerId: d,
		isDragging: le,
		isSorting: fe,
		id: o,
		index: x,
		items: u,
		newIndex: k.current.newIndex,
		previousItems: k.current.items,
		previousContainerId: k.current.containerId,
		transition: l,
		wasDragging: k.current.activeId != null
	}), ye = br({
		disabled: !ve,
		index: x,
		node: te,
		rect: C
	});
	return (0, _.useEffect)(() => {
		fe && k.current.newIndex !== he && (k.current.newIndex = he), d !== k.current.containerId && (k.current.containerId = d), u !== k.current.items && (k.current.items = u);
	}, [
		fe,
		he,
		d,
		u
	]), (0, _.useEffect)(() => {
		if (ge === k.current.activeId) return;
		if (ge && !k.current.activeId) {
			k.current.activeId = ge;
			return;
		}
		let e = setTimeout(() => {
			k.current.activeId = ge;
		}, 50);
		return () => clearTimeout(e);
	}, [ge]), {
		active: w,
		activeIndex: f,
		attributes: oe,
		data: S,
		rect: C,
		index: x,
		newIndex: he,
		items: u,
		isOver: ne,
		isSorting: fe,
		isDragging: le,
		listeners: ce,
		node: te,
		overIndex: g,
		over: ue,
		setNodeRef: de,
		setActivatorNodeRef: T,
		setDroppableNodeRef: re,
		setDraggableNodeRef: se,
		transform: ye ?? O,
		transition: be()
	};
	function be() {
		if (ye || _e && k.current.newIndex === x) return vr;
		if (!(me && !ke(ie) || !l) && (fe || ve)) return Me.Transition.toString({
			...l,
			property: _r
		});
	}
}
function Sr(e, t) {
	return typeof e == "boolean" ? {
		draggable: e,
		droppable: !1
	} : {
		draggable: e?.draggable ?? t.draggable,
		droppable: e?.droppable ?? t.droppable
	};
}
function Cr(e) {
	if (!e) return !1;
	let t = e.data.current;
	return !!(t && "sortable" in t && typeof t.sortable == "object" && "containerId" in t.sortable && "items" in t.sortable && "index" in t.sortable);
}
var wr = [
	A.Down,
	A.Right,
	A.Up,
	A.Left
], Tr = (e, t) => {
	let { context: { active: n, collisionRect: r, droppableRects: i, droppableContainers: a, over: o, scrollableAncestors: s } } = t;
	if (wr.includes(e.code)) {
		if (e.preventDefault(), !n || !r) return;
		let t = [];
		a.getEnabled().forEach((n) => {
			if (!n || n != null && n.disabled) return;
			let a = i.get(n.id);
			if (a) switch (e.code) {
				case A.Down:
					r.top < a.top && t.push(n);
					break;
				case A.Up:
					r.top > a.top && t.push(n);
					break;
				case A.Left:
					r.left > a.left && t.push(n);
					break;
				case A.Right:
					r.left < a.left && t.push(n);
					break;
			}
		});
		let c = rt({
			active: n,
			collisionRect: r,
			droppableRects: i,
			droppableContainers: t,
			pointerCoordinates: null
		}), l = et(c, "id");
		if (l === o?.id && c.length > 1 && (l = c[1].id), l != null) {
			let e = a.get(n.id), t = a.get(l), o = t ? i.get(t.id) : null, c = t?.node.current;
			if (c && o && e && t) {
				let n = vt(c).some((e, t) => s[t] !== e), i = Er(e, t), a = Dr(e, t), l = n || !i ? {
					x: 0,
					y: 0
				} : {
					x: a ? r.width - o.width : 0,
					y: a ? r.height - o.height : 0
				}, u = {
					x: o.left,
					y: o.top
				};
				return l.x && l.y ? u : De(u, l);
			}
		}
	}
};
function Er(e, t) {
	return !Cr(e) || !Cr(t) ? !1 : e.data.current.sortable.containerId === t.data.current.sortable.containerId;
}
function Dr(e, t) {
	return !Cr(e) || !Cr(t) || !Er(e, t) ? !1 : e.data.current.sortable.index < t.data.current.sortable.index;
}
//#endregion
//#region node_modules/react/cjs/react-jsx-runtime.production.js
var Or = /* @__PURE__ */ o(((e) => {
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
})), j = (/* @__PURE__ */ o(((e, t) => {
	t.exports = Or();
})))();
function kr({ field: e, value: t, onChange: n, nodeId: r, nodeType: i, path: a }) {
	let o = e.fields ?? [], [s, c] = (0, _.useState)(!0), l = typeof t == "object" && t && !Array.isArray(t) ? t : {};
	return o.length === 0 ? /* @__PURE__ */ (0, j.jsx)("p", {
		className: "vedit-empty",
		children: "Object field has no nested schema."
	}) : /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "vedit-object",
		children: [/* @__PURE__ */ (0, j.jsxs)("button", {
			type: "button",
			className: "vedit-collapsible-head",
			onClick: () => c((e) => !e),
			children: [/* @__PURE__ */ (0, j.jsx)("span", {
				className: "vedit-collapsible-caret",
				"data-open": s,
				children: "▸"
			}), /* @__PURE__ */ (0, j.jsx)("span", { children: e.title || e.name })]
		}), s && /* @__PURE__ */ (0, j.jsx)("div", {
			className: "vedit-object-body",
			children: o.map((e) => /* @__PURE__ */ (0, j.jsx)(Ty, {
				field: e,
				value: l[e.name],
				onChange: (t) => n({
					...l,
					[e.name]: t
				}),
				nodeId: r,
				nodeType: i,
				path: `${a}.${e.name}`
			}, e.name))
		})]
	});
}
function Ar({ field: e, value: t, onChange: n, nodeId: r, nodeType: i, path: a }) {
	let o = e.fields ?? [], s = Array.isArray(t) ? t : [], c = Je(qe(Yt, { activationConstraint: { distance: 4 } })), l = s.map((e, t) => `${a}-${t}`), u = () => {
		let e = {};
		for (let t of o) t.initialValue === void 0 ? e[t.name] = Nr(t.type) : e[t.name] = t.initialValue;
		n([...s, e]);
	}, d = (e) => {
		n(s.filter((t, n) => n !== e));
	}, f = (e) => {
		let { active: t, over: r } = e;
		if (!r || t.id === r.id) return;
		let i = l.indexOf(String(t.id)), a = l.indexOf(String(r.id));
		i < 0 || a < 0 || n(nr([...s], i, a));
	}, p = (e, t) => {
		let r = [...s];
		r[e] = t, n(r);
	};
	return o.length === 0 ? /* @__PURE__ */ (0, j.jsx)("p", {
		className: "vedit-empty",
		children: "Array field has no item schema."
	}) : /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "vedit-array",
		children: [
			s.length === 0 && /* @__PURE__ */ (0, j.jsx)("p", {
				className: "vedit-empty",
				children: "No items yet."
			}),
			s.length > 0 && /* @__PURE__ */ (0, j.jsx)(qn, {
				sensors: c,
				collisionDetection: nt,
				onDragEnd: f,
				children: /* @__PURE__ */ (0, j.jsx)(pr, {
					items: l,
					strategy: lr,
					children: /* @__PURE__ */ (0, j.jsx)("ul", {
						className: "vedit-array-list",
						children: s.map((e, t) => /* @__PURE__ */ (0, j.jsx)(jr, {
							id: l[t],
							index: t,
							itemSchema: o,
							value: e,
							onChange: (e) => p(t, e),
							onRemove: () => d(t),
							nodeId: r,
							nodeType: i,
							path: `${a}[${t}]`
						}, l[t]))
					})
				})
			}),
			/* @__PURE__ */ (0, j.jsx)("button", {
				type: "button",
				className: "vedit-add-block",
				onClick: u,
				children: "+ Add item"
			})
		]
	});
}
function jr({ id: e, index: t, itemSchema: n, value: r, onChange: i, onRemove: a, nodeId: o, nodeType: s, path: c }) {
	let { attributes: l, listeners: u, setNodeRef: d, transform: f, transition: p, isDragging: m } = xr({ id: e }), [h, g] = (0, _.useState)(!0), v = {
		transform: Me.Transform.toString(f),
		transition: p,
		opacity: m ? .5 : 1
	}, y = typeof r == "object" && r && !Array.isArray(r) ? r : {}, b = n[0] ? y[n[0].name] : null, x = typeof b == "string" && b ? b : `Item ${t + 1}`;
	return /* @__PURE__ */ (0, j.jsxs)("li", {
		ref: d,
		style: v,
		className: "vedit-array-item",
		children: [/* @__PURE__ */ (0, j.jsxs)("div", {
			className: "vedit-array-item-head",
			children: [
				/* @__PURE__ */ (0, j.jsx)("button", {
					type: "button",
					className: "vedit-drag-handle",
					"aria-label": "Drag",
					...l,
					...u,
					children: "⋮⋮"
				}),
				/* @__PURE__ */ (0, j.jsxs)("button", {
					type: "button",
					className: "vedit-array-item-toggle",
					onClick: () => g((e) => !e),
					children: [/* @__PURE__ */ (0, j.jsx)("span", {
						className: "vedit-collapsible-caret",
						"data-open": h,
						children: "▸"
					}), /* @__PURE__ */ (0, j.jsx)("span", {
						className: "vedit-array-item-summary",
						children: x.length > 50 ? x.slice(0, 50) + "…" : x
					})]
				}),
				/* @__PURE__ */ (0, j.jsx)("button", {
					type: "button",
					className: "vedit-icon-btn",
					onClick: a,
					"aria-label": "Remove",
					title: "Remove item",
					children: "×"
				})
			]
		}), h && /* @__PURE__ */ (0, j.jsx)("div", {
			className: "vedit-array-item-body",
			children: n.map((e) => /* @__PURE__ */ (0, j.jsx)(Ty, {
				field: e,
				value: y[e.name],
				onChange: (t) => i({
					...y,
					[e.name]: t
				}),
				nodeId: o,
				nodeType: s,
				path: `${c}.${e.name}`
			}, e.name))
		})]
	});
}
function Mr({ value: e, onChange: t, id: n }) {
	let r = typeof e == "object" && e ? e : {};
	return /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "vedit-link-field",
		children: [
			/* @__PURE__ */ (0, j.jsx)("input", {
				id: n,
				type: "text",
				className: "vedit-input",
				placeholder: "Label",
				value: r.label ?? "",
				onChange: (e) => t({
					...r,
					label: e.target.value
				})
			}),
			/* @__PURE__ */ (0, j.jsx)("input", {
				type: "url",
				className: "vedit-input",
				placeholder: "https://…",
				value: r.url ?? "",
				onChange: (e) => t({
					...r,
					url: e.target.value
				})
			}),
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "vedit-grid-2",
				children: [/* @__PURE__ */ (0, j.jsxs)("select", {
					className: "vedit-input",
					value: r.target ?? "_self",
					onChange: (e) => t({
						...r,
						target: e.target.value
					}),
					children: [/* @__PURE__ */ (0, j.jsx)("option", {
						value: "_self",
						children: "Same tab"
					}), /* @__PURE__ */ (0, j.jsx)("option", {
						value: "_blank",
						children: "New tab"
					})]
				}), /* @__PURE__ */ (0, j.jsx)("input", {
					type: "text",
					className: "vedit-input",
					placeholder: "rel (e.g. noopener)",
					value: r.rel ?? "",
					onChange: (e) => t({
						...r,
						rel: e.target.value
					})
				})]
			})
		]
	});
}
function Nr(e) {
	let t = (e || "").toLowerCase();
	return t === "toggle" || t === "boolean" || t === "checkbox" ? !1 : t === "number" || t === "integer" || t === "range" ? null : t === "object" ? {} : t === "array" || t === "gallery" || t === "checkbox" ? [] : "";
}
//#endregion
//#region src/api.ts
function Pr(e) {
	return e && (e.label || e.name || e.slug) || "(unnamed)";
}
function Fr(e) {
	return e.fields ?? e.field_schema ?? [];
}
async function Ir(e, t) {
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
			t?.error?.message && (e = t.error.message);
		} catch {}
		throw Error(e);
	}
	return await n.json();
}
async function Lr(e) {
	return (await Ir(`/admin/api/nodes/${e}`)).data;
}
async function Rr() {
	return (await Ir("/admin/api/block-types?per_page=1000")).data;
}
async function zr(e) {
	return (await Ir(`/admin/api/block-types/${e}`)).data;
}
async function Br(e, t) {
	await Ir(`/admin/api/nodes/${e}`, {
		method: "PATCH",
		body: JSON.stringify({ blocks_data: t })
	});
}
async function Vr(e = {}) {
	let t = new URLSearchParams();
	return t.set("per_page", String(e.perPage ?? 50)), e.search && t.set("search", e.search), e.mime && t.set("mime_type", e.mime), (await Ir(`/admin/api/ext/media-manager/?${t.toString()}`)).data ?? [];
}
async function Hr(e = {}) {
	let t = new URLSearchParams();
	return t.set("limit", String(e.limit ?? 25)), e.search && t.set("q", e.search), e.nodeType && t.set("node_type", e.nodeType), (await Ir(`/admin/api/nodes/search?${t.toString()}`)).data ?? [];
}
async function Ur(e, t, n = {}) {
	let r = new URLSearchParams();
	return r.set("per_page", String(n.perPage ?? 100)), n.search && r.set("search", n.search), (await Ir(`/admin/api/terms/${encodeURIComponent(e)}/${encodeURIComponent(t)}?${r.toString()}`)).data ?? [];
}
async function Wr(e, t) {
	let n = await fetch("/admin/api/block-types/preview", {
		method: "POST",
		credentials: "same-origin",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			html_template: e,
			test_data: t
		})
	});
	if (!n.ok) throw Error(`preview ${n.status}`);
	return (await n.json()).html ?? "";
}
//#endregion
//#region src/fields/MediaPicker.tsx
function Gr({ mode: e, onPick: t, onCancel: n }) {
	let [r, i] = (0, _.useState)([]), [a, o] = (0, _.useState)(""), [s, c] = (0, _.useState)(!0), [l, u] = (0, _.useState)(null), [d, f] = (0, _.useState)(/* @__PURE__ */ new Set());
	(0, _.useEffect)(() => {
		let t = !1;
		c(!0);
		let n = window.setTimeout(() => {
			Vr({
				search: a,
				mime: e === "image" || e === "gallery" ? "image" : void 0,
				perPage: 80
			}).then((e) => {
				t || (i(e), c(!1));
			}).catch((e) => {
				t || (u(e.message), c(!1));
			});
		}, 200);
		return () => {
			t = !0, window.clearTimeout(n);
		};
	}, [a, e]), (0, _.useEffect)(() => {
		let e = (e) => {
			e.key === "Escape" && n();
		};
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [n]);
	let p = e === "gallery", m = (e) => {
		if (!p) {
			let n = r.find((t) => t.id === e);
			n && t([n]);
			return;
		}
		f((t) => {
			let n = new Set(t);
			return n.has(e) ? n.delete(e) : n.add(e), n;
		});
	};
	return /* @__PURE__ */ (0, j.jsx)("div", {
		className: "vedit-modal-backdrop",
		onClick: n,
		children: /* @__PURE__ */ (0, j.jsxs)("div", {
			className: "vedit-modal vedit-media-modal",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, j.jsxs)("header", {
					className: "vedit-modal-header",
					children: [/* @__PURE__ */ (0, j.jsx)("span", {
						className: "vedit-modal-title",
						children: e === "gallery" ? "Pick images" : e === "image" ? "Pick image" : "Pick file"
					}), /* @__PURE__ */ (0, j.jsx)("button", {
						type: "button",
						className: "vedit-link",
						onClick: n,
						children: "Cancel"
					})]
				}),
				/* @__PURE__ */ (0, j.jsx)("input", {
					type: "search",
					className: "vedit-input",
					placeholder: "Search media…",
					value: a,
					autoFocus: !0,
					onChange: (e) => o(e.target.value)
				}),
				l && /* @__PURE__ */ (0, j.jsx)("div", {
					className: "vedit-error",
					children: l
				}),
				s && r.length === 0 && /* @__PURE__ */ (0, j.jsx)("p", {
					className: "vedit-empty",
					children: "Loading…"
				}),
				!s && r.length === 0 && /* @__PURE__ */ (0, j.jsx)("p", {
					className: "vedit-empty",
					children: "No media found."
				}),
				/* @__PURE__ */ (0, j.jsx)("div", {
					className: "vedit-media-grid",
					children: r.map((e) => {
						let t = (e.mime_type || "").startsWith("image/");
						return /* @__PURE__ */ (0, j.jsxs)("button", {
							type: "button",
							className: "vedit-media-tile",
							"data-selected": d.has(e.id) ? "true" : "false",
							onClick: () => m(e.id),
							title: e.original_name ?? e.url,
							children: [t ? /* @__PURE__ */ (0, j.jsx)("img", {
								src: e.url,
								alt: e.alt_text ?? "",
								loading: "lazy"
							}) : /* @__PURE__ */ (0, j.jsx)("span", {
								className: "vedit-media-fileicon",
								children: "📄"
							}), /* @__PURE__ */ (0, j.jsx)("span", {
								className: "vedit-media-name",
								children: e.original_name ?? `#${e.id}`
							})]
						}, e.id);
					})
				}),
				p && /* @__PURE__ */ (0, j.jsxs)("footer", {
					className: "vedit-modal-footer",
					children: [/* @__PURE__ */ (0, j.jsx)("button", {
						type: "button",
						className: "vedit-btn",
						"data-variant": "secondary",
						onClick: n,
						children: "Cancel"
					}), /* @__PURE__ */ (0, j.jsxs)("button", {
						type: "button",
						className: "vedit-btn",
						"data-variant": "primary",
						onClick: () => {
							let e = r.filter((e) => d.has(e.id));
							e.length > 0 && t(e);
						},
						disabled: d.size === 0,
						children: [
							"Add ",
							d.size,
							" item",
							d.size === 1 ? "" : "s"
						]
					})]
				})
			]
		})
	});
}
function Kr({ value: e, onChange: t }) {
	let [n, r] = (0, _.useState)(!1), i = typeof e == "object" && e ? e : {};
	return /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "vedit-image-field",
		children: [i.url ? /* @__PURE__ */ (0, j.jsxs)("div", {
			className: "vedit-image-preview",
			children: [/* @__PURE__ */ (0, j.jsx)("img", {
				src: i.url,
				alt: i.alt ?? ""
			}), /* @__PURE__ */ (0, j.jsxs)("div", {
				className: "vedit-image-meta",
				children: [/* @__PURE__ */ (0, j.jsx)("input", {
					type: "text",
					className: "vedit-input",
					placeholder: "Alt text",
					value: i.alt ?? "",
					onChange: (e) => t({
						...i,
						alt: e.target.value
					})
				}), /* @__PURE__ */ (0, j.jsxs)("div", {
					className: "vedit-actions-row",
					children: [/* @__PURE__ */ (0, j.jsx)("button", {
						type: "button",
						className: "vedit-btn",
						"data-variant": "secondary",
						onClick: () => r(!0),
						children: "Replace"
					}), /* @__PURE__ */ (0, j.jsx)("button", {
						type: "button",
						className: "vedit-btn",
						"data-variant": "danger",
						onClick: () => t(null),
						children: "Remove"
					})]
				})]
			})]
		}) : /* @__PURE__ */ (0, j.jsx)("button", {
			type: "button",
			className: "vedit-add-block",
			onClick: () => r(!0),
			children: "+ Pick image"
		}), n && /* @__PURE__ */ (0, j.jsx)(Gr, {
			mode: "image",
			onPick: (e) => {
				let n = e[0];
				n && t({
					id: n.id,
					url: n.url,
					alt: n.alt_text ?? "",
					width: n.width,
					height: n.height
				}), r(!1);
			},
			onCancel: () => r(!1)
		})]
	});
}
function qr({ value: e, onChange: t }) {
	let [n, r] = (0, _.useState)(!1), i = typeof e == "object" && e ? e : {};
	return /* @__PURE__ */ (0, j.jsxs)("div", { children: [i.url ? /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "vedit-field-unsupported",
		children: [/* @__PURE__ */ (0, j.jsxs)("div", {
			className: "vedit-field-unsupported-summary",
			children: ["📄 ", i.name ?? i.url]
		}), /* @__PURE__ */ (0, j.jsxs)("div", {
			className: "vedit-actions-row",
			children: [
				/* @__PURE__ */ (0, j.jsx)("a", {
					href: i.url,
					target: "_blank",
					rel: "noreferrer",
					className: "vedit-link",
					children: "Open ↗"
				}),
				/* @__PURE__ */ (0, j.jsx)("button", {
					type: "button",
					className: "vedit-btn",
					"data-variant": "secondary",
					onClick: () => r(!0),
					children: "Replace"
				}),
				/* @__PURE__ */ (0, j.jsx)("button", {
					type: "button",
					className: "vedit-btn",
					"data-variant": "danger",
					onClick: () => t(null),
					children: "Remove"
				})
			]
		})]
	}) : /* @__PURE__ */ (0, j.jsx)("button", {
		type: "button",
		className: "vedit-add-block",
		onClick: () => r(!0),
		children: "+ Pick file"
	}), n && /* @__PURE__ */ (0, j.jsx)(Gr, {
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
function Jr({ value: e, onChange: t }) {
	let [n, r] = (0, _.useState)(!1), i = (0, _.useMemo)(() => Array.isArray(e) ? e : [], [e]), a = (e) => {
		t(i.filter((t, n) => n !== e));
	};
	return /* @__PURE__ */ (0, j.jsxs)("div", { children: [
		/* @__PURE__ */ (0, j.jsx)("div", {
			className: "vedit-gallery-grid",
			children: i.map((e, t) => {
				let n = e.url ?? "";
				return /* @__PURE__ */ (0, j.jsxs)("div", {
					className: "vedit-gallery-tile",
					children: [n && /* @__PURE__ */ (0, j.jsx)("img", {
						src: n,
						alt: e.alt ?? ""
					}), /* @__PURE__ */ (0, j.jsx)("button", {
						type: "button",
						className: "vedit-gallery-remove",
						onClick: () => a(t),
						"aria-label": "Remove",
						children: "×"
					})]
				}, t);
			})
		}),
		/* @__PURE__ */ (0, j.jsx)("button", {
			type: "button",
			className: "vedit-add-block",
			onClick: () => r(!0),
			children: "+ Add images"
		}),
		n && /* @__PURE__ */ (0, j.jsx)(Gr, {
			mode: "gallery",
			onPick: (e) => {
				let n = e.map((e) => ({
					id: e.id,
					url: e.url,
					alt: e.alt_text ?? "",
					width: e.width,
					height: e.height
				}));
				t([...i, ...n]), r(!1);
			},
			onCancel: () => r(!1)
		})
	] });
}
//#endregion
//#region src/fields/RefPicker.tsx
function Yr({ field: e, value: t, onChange: n }) {
	let [r, i] = (0, _.useState)(!1), a = typeof t == "object" && t ? t : null, o = a ? `${a.title ?? `#${a.id}`} · ${a.node_type ?? "?"}` : typeof t == "number" ? `#${t}` : null, s = e.node_types ?? [];
	return /* @__PURE__ */ (0, j.jsxs)("div", { children: [o ? /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "vedit-field-unsupported",
		children: [/* @__PURE__ */ (0, j.jsxs)("div", {
			className: "vedit-field-unsupported-summary",
			children: ["→ ", o]
		}), /* @__PURE__ */ (0, j.jsxs)("div", {
			className: "vedit-actions-row",
			children: [/* @__PURE__ */ (0, j.jsx)("button", {
				type: "button",
				className: "vedit-btn",
				"data-variant": "secondary",
				onClick: () => i(!0),
				children: "Change"
			}), /* @__PURE__ */ (0, j.jsx)("button", {
				type: "button",
				className: "vedit-btn",
				"data-variant": "danger",
				onClick: () => n(null),
				children: "Clear"
			})]
		})]
	}) : /* @__PURE__ */ (0, j.jsx)("button", {
		type: "button",
		className: "vedit-add-block",
		onClick: () => i(!0),
		children: "+ Pick content"
	}), r && /* @__PURE__ */ (0, j.jsx)(Xr, {
		allowedNodeTypes: s,
		onPick: (e) => {
			n({
				id: e.id,
				title: e.title,
				slug: e.slug,
				node_type: e.node_type
			}), i(!1);
		},
		onCancel: () => i(!1)
	})] });
}
function Xr({ allowedNodeTypes: e, onPick: t, onCancel: n }) {
	let [r, i] = (0, _.useState)(""), [a, o] = (0, _.useState)([]), [s, c] = (0, _.useState)(null), [l, u] = (0, _.useState)(e[0] ?? "");
	return (0, _.useEffect)(() => {
		let e = window.setTimeout(() => {
			Hr({
				search: r,
				nodeType: l || void 0,
				limit: 30
			}).then(o).catch((e) => c(e.message));
		}, 200);
		return () => window.clearTimeout(e);
	}, [r, l]), (0, _.useEffect)(() => {
		let e = (e) => {
			e.key === "Escape" && n();
		};
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [n]), /* @__PURE__ */ (0, j.jsx)("div", {
		className: "vedit-modal-backdrop",
		onClick: n,
		children: /* @__PURE__ */ (0, j.jsxs)("div", {
			className: "vedit-modal",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, j.jsxs)("header", {
					className: "vedit-modal-header",
					children: [/* @__PURE__ */ (0, j.jsx)("span", {
						className: "vedit-modal-title",
						children: "Pick content"
					}), /* @__PURE__ */ (0, j.jsx)("button", {
						type: "button",
						className: "vedit-link",
						onClick: n,
						children: "Cancel"
					})]
				}),
				e.length > 1 && /* @__PURE__ */ (0, j.jsx)("div", {
					className: "vedit-tabs",
					children: e.map((e) => /* @__PURE__ */ (0, j.jsx)("button", {
						type: "button",
						className: "vedit-tab",
						"data-active": e === l,
						onClick: () => u(e),
						children: e
					}, e))
				}),
				/* @__PURE__ */ (0, j.jsx)("input", {
					type: "search",
					className: "vedit-input",
					placeholder: "Search by title or slug…",
					autoFocus: !0,
					value: r,
					onChange: (e) => i(e.target.value)
				}),
				s && /* @__PURE__ */ (0, j.jsx)("div", {
					className: "vedit-error",
					children: s
				}),
				/* @__PURE__ */ (0, j.jsxs)("ul", {
					className: "vedit-block-picker-list",
					children: [a.length === 0 && /* @__PURE__ */ (0, j.jsx)("li", {
						className: "vedit-empty",
						children: "No matches."
					}), a.map((e) => /* @__PURE__ */ (0, j.jsx)("li", { children: /* @__PURE__ */ (0, j.jsxs)("button", {
						type: "button",
						className: "vedit-block-picker-item",
						onClick: () => t(e),
						children: [/* @__PURE__ */ (0, j.jsx)("strong", { children: e.title }), /* @__PURE__ */ (0, j.jsxs)("span", {
							className: "vedit-block-meta",
							children: [
								e.node_type,
								" · ",
								e.slug
							]
						})]
					}) }, e.id))]
				})
			]
		})
	});
}
function Zr({ field: e, value: t, onChange: n, defaultNodeType: r }) {
	let i = e.taxonomy ?? "", a = e.node_type ?? r, [o, s] = (0, _.useState)(!1), [c, l] = (0, _.useState)([]), [u, d] = (0, _.useState)(null), f = typeof t == "object" && t ? t : null, p = f ? f.name ?? f.slug ?? `#${f.id}` : null;
	return (0, _.useEffect)(() => {
		!o || !i || !a || Ur(a, i, { perPage: 200 }).then(l).catch((e) => d(e.message));
	}, [
		o,
		i,
		a
	]), i ? /* @__PURE__ */ (0, j.jsxs)("div", { children: [p ? /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "vedit-field-unsupported",
		children: [/* @__PURE__ */ (0, j.jsxs)("div", {
			className: "vedit-field-unsupported-summary",
			children: ["🏷 ", p]
		}), /* @__PURE__ */ (0, j.jsxs)("div", {
			className: "vedit-actions-row",
			children: [/* @__PURE__ */ (0, j.jsx)("button", {
				type: "button",
				className: "vedit-btn",
				"data-variant": "secondary",
				onClick: () => s(!0),
				children: "Change"
			}), /* @__PURE__ */ (0, j.jsx)("button", {
				type: "button",
				className: "vedit-btn",
				"data-variant": "danger",
				onClick: () => n(null),
				children: "Clear"
			})]
		})]
	}) : /* @__PURE__ */ (0, j.jsx)("button", {
		type: "button",
		className: "vedit-add-block",
		onClick: () => s(!0),
		children: "+ Pick term"
	}), o && /* @__PURE__ */ (0, j.jsx)("div", {
		className: "vedit-modal-backdrop",
		onClick: () => s(!1),
		children: /* @__PURE__ */ (0, j.jsxs)("div", {
			className: "vedit-modal",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, j.jsxs)("header", {
					className: "vedit-modal-header",
					children: [/* @__PURE__ */ (0, j.jsxs)("span", {
						className: "vedit-modal-title",
						children: ["Pick ", i]
					}), /* @__PURE__ */ (0, j.jsx)("button", {
						type: "button",
						className: "vedit-link",
						onClick: () => s(!1),
						children: "Cancel"
					})]
				}),
				u && /* @__PURE__ */ (0, j.jsx)("div", {
					className: "vedit-error",
					children: u
				}),
				/* @__PURE__ */ (0, j.jsxs)("ul", {
					className: "vedit-block-picker-list",
					children: [c.length === 0 && /* @__PURE__ */ (0, j.jsx)("li", {
						className: "vedit-empty",
						children: "No terms."
					}), c.map((e) => /* @__PURE__ */ (0, j.jsx)("li", { children: /* @__PURE__ */ (0, j.jsxs)("button", {
						type: "button",
						className: "vedit-block-picker-item",
						onClick: () => {
							n({
								id: e.id,
								slug: e.slug,
								name: e.name,
								taxonomy: i,
								node_type: a
							}), s(!1);
						},
						children: [/* @__PURE__ */ (0, j.jsx)("strong", { children: e.name }), /* @__PURE__ */ (0, j.jsx)("span", {
							className: "vedit-block-meta",
							children: e.slug
						})]
					}) }, e.id))]
				})
			]
		})
	})] }) : /* @__PURE__ */ (0, j.jsx)("p", {
		className: "vedit-empty",
		children: "Field schema is missing taxonomy."
	});
}
//#endregion
//#region node_modules/orderedmap/dist/index.js
function Qr(e) {
	this.content = e;
}
Qr.prototype = {
	constructor: Qr,
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
		return i == -1 ? a.push(n || e, t) : (a[i + 1] = t, n && (a[i] = n)), new Qr(a);
	},
	remove: function(e) {
		var t = this.find(e);
		if (t == -1) return this;
		var n = this.content.slice();
		return n.splice(t, 2), new Qr(n);
	},
	addToStart: function(e, t) {
		return new Qr([e, t].concat(this.remove(e).content));
	},
	addToEnd: function(e, t) {
		var n = this.remove(e).content.slice();
		return n.push(e, t), new Qr(n);
	},
	addBefore: function(e, t, n) {
		var r = this.remove(t), i = r.content.slice(), a = r.find(e);
		return i.splice(a == -1 ? i.length : a, 0, t, n), new Qr(i);
	},
	forEach: function(e) {
		for (var t = 0; t < this.content.length; t += 2) e(this.content[t], this.content[t + 1]);
	},
	prepend: function(e) {
		return e = Qr.from(e), e.size ? new Qr(e.content.concat(this.subtract(e).content)) : this;
	},
	append: function(e) {
		return e = Qr.from(e), e.size ? new Qr(this.subtract(e).content.concat(e.content)) : this;
	},
	subtract: function(e) {
		var t = this;
		e = Qr.from(e);
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
}, Qr.from = function(e) {
	if (e instanceof Qr) return e;
	var t = [];
	if (e) for (var n in e) t.push(n, e[n]);
	return new Qr(t);
};
//#endregion
//#region node_modules/prosemirror-model/dist/index.js
function $r(e, t, n) {
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
			let e = $r(i.content, a.content, n + 1);
			if (e != null) return e;
		}
		n += i.nodeSize;
	}
}
function ei(e, t, n, r) {
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
			let e = ei(o.content, s.content, n - 1, r - 1);
			if (e) return e;
		}
		n -= c, r -= c;
	}
}
var M = class e {
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
		return $r(this, e, t);
	}
	findDiffEnd(e, t = this.size, n = e.size) {
		return ei(this, e, t, n);
	}
	findIndex(e) {
		if (e == 0) return ni(0, e);
		if (e == this.size) return ni(this.content.length, e);
		if (e > this.size || e < 0) throw RangeError(`Position ${e} outside of fragment (${this})`);
		for (let t = 0, n = 0;; t++) {
			let r = this.child(t), i = n + r.nodeSize;
			if (i >= e) return i == e ? ni(t + 1, i) : ni(t, n);
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
M.empty = new M([], 0);
var ti = {
	index: 0,
	offset: 0
};
function ni(e, t) {
	return ti.index = e, ti.offset = t, ti;
}
function ri(e, t) {
	if (e === t) return !0;
	if (!(e && typeof e == "object") || !(t && typeof t == "object")) return !1;
	let n = Array.isArray(e);
	if (Array.isArray(t) != n) return !1;
	if (n) {
		if (e.length != t.length) return !1;
		for (let n = 0; n < e.length; n++) if (!ri(e[n], t[n])) return !1;
	} else {
		for (let n in e) if (!(n in t) || !ri(e[n], t[n])) return !1;
		for (let n in t) if (!(n in e)) return !1;
	}
	return !0;
}
var N = class e {
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
		return this == e || this.type == e.type && ri(this.attrs, e.attrs);
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
N.none = [];
var ii = class extends Error {}, P = class e {
	constructor(e, t, n) {
		this.content = e, this.openStart = t, this.openEnd = n;
	}
	get size() {
		return this.content.size - this.openStart - this.openEnd;
	}
	insertAt(t, n) {
		let r = oi(this.content, t + this.openStart, n);
		return r && new e(r, this.openStart, this.openEnd);
	}
	removeBetween(t, n) {
		return new e(ai(this.content, t + this.openStart, n + this.openStart), this.openStart, this.openEnd);
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
		return new e(M.fromJSON(t, n.content), r, i);
	}
	static maxOpen(t, n = !0) {
		let r = 0, i = 0;
		for (let e = t.firstChild; e && !e.isLeaf && (n || !e.type.spec.isolating); e = e.firstChild) r++;
		for (let e = t.lastChild; e && !e.isLeaf && (n || !e.type.spec.isolating); e = e.lastChild) i++;
		return new e(t, r, i);
	}
};
P.empty = new P(M.empty, 0, 0);
function ai(e, t, n) {
	let { index: r, offset: i } = e.findIndex(t), a = e.maybeChild(r), { index: o, offset: s } = e.findIndex(n);
	if (i == t || a.isText) {
		if (s != n && !e.child(o).isText) throw RangeError("Removing non-flat range");
		return e.cut(0, t).append(e.cut(n));
	}
	if (r != o) throw RangeError("Removing non-flat range");
	return e.replaceChild(r, a.copy(ai(a.content, t - i - 1, n - i - 1)));
}
function oi(e, t, n, r) {
	let { index: i, offset: a } = e.findIndex(t), o = e.maybeChild(i);
	if (a == t || o.isText) return r && !r.canReplace(i, i, n) ? null : e.cut(0, t).append(n).append(e.cut(t));
	let s = oi(o.content, t - a - 1, n, o);
	return s && e.replaceChild(i, o.copy(s));
}
function si(e, t, n) {
	if (n.openStart > e.depth) throw new ii("Inserted content deeper than insertion position");
	if (e.depth - n.openStart != t.depth - n.openEnd) throw new ii("Inconsistent open depths");
	return ci(e, t, n, 0);
}
function ci(e, t, n, r) {
	let i = e.index(r), a = e.node(r);
	if (i == t.index(r) && r < e.depth - n.openStart) {
		let o = ci(e, t, n, r + 1);
		return a.copy(a.content.replaceChild(i, o));
	} else if (!n.content.size) return pi(a, hi(e, t, r));
	else if (!n.openStart && !n.openEnd && e.depth == r && t.depth == r) {
		let r = e.parent, i = r.content;
		return pi(r, i.cut(0, e.parentOffset).append(n.content).append(i.cut(t.parentOffset)));
	} else {
		let { start: i, end: o } = gi(n, e);
		return pi(a, mi(e, i, o, t, r));
	}
}
function li(e, t) {
	if (!t.type.compatibleContent(e.type)) throw new ii("Cannot join " + t.type.name + " onto " + e.type.name);
}
function ui(e, t, n) {
	let r = e.node(n);
	return li(r, t.node(n)), r;
}
function di(e, t) {
	let n = t.length - 1;
	n >= 0 && e.isText && e.sameMarkup(t[n]) ? t[n] = e.withText(t[n].text + e.text) : t.push(e);
}
function fi(e, t, n, r) {
	let i = (t || e).node(n), a = 0, o = t ? t.index(n) : i.childCount;
	e && (a = e.index(n), e.depth > n ? a++ : e.textOffset && (di(e.nodeAfter, r), a++));
	for (let e = a; e < o; e++) di(i.child(e), r);
	t && t.depth == n && t.textOffset && di(t.nodeBefore, r);
}
function pi(e, t) {
	return e.type.checkContent(t), e.copy(t);
}
function mi(e, t, n, r, i) {
	let a = e.depth > i && ui(e, t, i + 1), o = r.depth > i && ui(n, r, i + 1), s = [];
	return fi(null, e, i, s), a && o && t.index(i) == n.index(i) ? (li(a, o), di(pi(a, mi(e, t, n, r, i + 1)), s)) : (a && di(pi(a, hi(e, t, i + 1)), s), fi(t, n, i, s), o && di(pi(o, hi(n, r, i + 1)), s)), fi(r, null, i, s), new M(s);
}
function hi(e, t, n) {
	let r = [];
	return fi(null, e, n, r), e.depth > n && di(pi(ui(e, t, n + 1), hi(e, t, n + 1)), r), fi(t, null, n, r), new M(r);
}
function gi(e, t) {
	let n = t.depth - e.openStart, r = t.node(n).copy(e.content);
	for (let e = n - 1; e >= 0; e--) r = t.node(e).copy(M.from(r));
	return {
		start: r.resolveNoCache(e.openStart + n),
		end: r.resolveNoCache(r.content.size - e.openEnd - n)
	};
}
var _i = class e {
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
		if (e.content.size == 0) return N.none;
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
		for (let n = this.depth - (this.parent.inlineContent || this.pos == e.pos ? 1 : 0); n >= 0; n--) if (e.pos <= this.end(n) && (!t || t(this.node(n)))) return new xi(this, e, n);
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
		let r = bi.get(t);
		if (r) for (let e = 0; e < r.elts.length; e++) {
			let t = r.elts[e];
			if (t.pos == n) return t;
		}
		else bi.set(t, r = new vi());
		let i = r.elts[r.i] = e.resolve(t, n);
		return r.i = (r.i + 1) % yi, i;
	}
}, vi = class {
	constructor() {
		this.elts = [], this.i = 0;
	}
}, yi = 12, bi = /* @__PURE__ */ new WeakMap(), xi = class {
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
}, Si = Object.create(null), Ci = class e {
	constructor(e, t, n, r = N.none) {
		this.type = e, this.attrs = t, this.marks = r, this.content = n || M.empty;
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
		return this.type == e && ri(this.attrs, t || e.defaultAttrs || Si) && N.sameSet(this.marks, n || N.none);
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
		if (e == t) return P.empty;
		let r = this.resolve(e), i = this.resolve(t), a = n ? 0 : r.sharedDepth(t), o = r.start(a);
		return new P(r.node(a).content.cut(r.pos - o, i.pos - o), r.depth - a, i.depth - a);
	}
	replace(e, t, n) {
		return si(this.resolve(e), this.resolve(t), n);
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
		return _i.resolveCached(this, e);
	}
	resolveNoCache(e) {
		return _i.resolve(this, e);
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
		return this.content.size && (e += "(" + this.content.toStringInner() + ")"), Ti(this.marks, e);
	}
	contentMatchAt(e) {
		let t = this.type.contentMatch.matchFragment(this.content, 0, e);
		if (!t) throw Error("Called contentMatchAt on a node with invalid content");
		return t;
	}
	canReplace(e, t, n = M.empty, r = 0, i = n.childCount) {
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
		let e = N.none;
		for (let t = 0; t < this.marks.length; t++) {
			let n = this.marks[t];
			n.type.checkAttrs(n.attrs), e = n.addToSet(e);
		}
		if (!N.sameSet(e, this.marks)) throw RangeError(`Invalid collection of marks for node ${this.type.name}: ${this.marks.map((e) => e.type.name)}`);
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
		let r = M.fromJSON(e, t.content), i = e.nodeType(t.type).create(t.attrs, r, n);
		return i.type.checkAttrs(i.attrs), i;
	}
};
Ci.prototype.text = void 0;
var wi = class e extends Ci {
	constructor(e, t, n, r) {
		if (super(e, t, null, r), !n) throw RangeError("Empty text nodes are not allowed");
		this.text = n;
	}
	toString() {
		return this.type.spec.toDebugString ? this.type.spec.toDebugString(this) : Ti(this.marks, JSON.stringify(this.text));
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
function Ti(e, t) {
	for (let n = e.length - 1; n >= 0; n--) t = e[n].type.name + "(" + t + ")";
	return t;
}
var Ei = class e {
	constructor(e) {
		this.validEnd = e, this.next = [], this.wrapCache = [];
	}
	static parse(t, n) {
		let r = new Di(t, n);
		if (r.next == null) return e.empty;
		let i = Oi(r);
		r.next && r.err("Unexpected trailing text");
		let a = Ri(Fi(i));
		return F(a, r), a;
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
			if (s && (!t || s.validEnd)) return M.from(o.map((e) => e.createAndFill()));
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
Ei.empty = new Ei(!0);
var Di = class {
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
function Oi(e) {
	let t = [];
	do
		t.push(ki(e));
	while (e.eat("|"));
	return t.length == 1 ? t[0] : {
		type: "choice",
		exprs: t
	};
}
function ki(e) {
	let t = [];
	do
		t.push(Ai(e));
	while (e.next && e.next != ")" && e.next != "|");
	return t.length == 1 ? t[0] : {
		type: "seq",
		exprs: t
	};
}
function Ai(e) {
	let t = Pi(e);
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
	else if (e.eat("{")) t = Mi(e, t);
	else break;
	return t;
}
function ji(e) {
	/\D/.test(e.next) && e.err("Expected number, got '" + e.next + "'");
	let t = Number(e.next);
	return e.pos++, t;
}
function Mi(e, t) {
	let n = ji(e), r = n;
	return e.eat(",") && (r = e.next == "}" ? -1 : ji(e)), e.eat("}") || e.err("Unclosed braced range"), {
		type: "range",
		min: n,
		max: r,
		expr: t
	};
}
function Ni(e, t) {
	let n = e.nodeTypes, r = n[t];
	if (r) return [r];
	let i = [];
	for (let e in n) {
		let r = n[e];
		r.isInGroup(t) && i.push(r);
	}
	return i.length == 0 && e.err("No node type or group '" + t + "' found"), i;
}
function Pi(e) {
	if (e.eat("(")) {
		let t = Oi(e);
		return e.eat(")") || e.err("Missing closing paren"), t;
	} else if (/\W/.test(e.next)) e.err("Unexpected token '" + e.next + "'");
	else {
		let t = Ni(e, e.next).map((t) => (e.inline == null ? e.inline = t.isInline : e.inline != t.isInline && e.err("Mixing inline and block content"), {
			type: "name",
			value: t
		}));
		return e.pos++, t.length == 1 ? t[0] : {
			type: "choice",
			exprs: t
		};
	}
}
function Fi(e) {
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
function Ii(e, t) {
	return t - e;
}
function Li(e, t) {
	let n = [];
	return r(t), n.sort(Ii);
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
function Ri(e) {
	let t = Object.create(null);
	return n(Li(e, 0));
	function n(r) {
		let i = [];
		r.forEach((t) => {
			e[t].forEach(({ term: t, to: n }) => {
				if (!t) return;
				let r;
				for (let e = 0; e < i.length; e++) i[e][0] == t && (r = i[e][1]);
				Li(e, n).forEach((e) => {
					r || i.push([t, r = []]), r.indexOf(e) == -1 && r.push(e);
				});
			});
		});
		let a = t[r.join(",")] = new Ei(r.indexOf(e.length - 1) > -1);
		for (let e = 0; e < i.length; e++) {
			let r = i[e][1].sort(Ii);
			a.next.push({
				type: i[e][0],
				next: t[r.join(",")] || n(r)
			});
		}
		return a;
	}
}
function F(e, t) {
	for (let n = 0, r = [e]; n < r.length; n++) {
		let e = r[n], i = !e.validEnd, a = [];
		for (let t = 0; t < e.next.length; t++) {
			let { type: n, next: o } = e.next[t];
			a.push(n.name), i && !(n.isText || n.hasRequiredAttrs()) && (i = !1), r.indexOf(o) == -1 && r.push(o);
		}
		i && t.err("Only non-generatable nodes (" + a.join(", ") + ") in a required position (see https://prosemirror.net/docs/guide/#generatable)");
	}
}
function zi(e) {
	let t = Object.create(null);
	for (let n in e) {
		let r = e[n];
		if (!r.hasDefault) return null;
		t[n] = r.default;
	}
	return t;
}
function Bi(e, t) {
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
function Vi(e, t, n, r) {
	for (let r in t) if (!(r in e)) throw RangeError(`Unsupported attribute ${r} for ${n} of type ${r}`);
	for (let n in e) {
		let r = e[n];
		r.validate && r.validate(t[n]);
	}
}
function Hi(e, t) {
	let n = Object.create(null);
	if (t) for (let r in t) n[r] = new Gi(e, r, t[r]);
	return n;
}
var Ui = class e {
	constructor(e, t, n) {
		this.name = e, this.schema = t, this.spec = n, this.markSet = null, this.groups = n.group ? n.group.split(" ") : [], this.attrs = Hi(e, n.attrs), this.defaultAttrs = zi(this.attrs), this.contentMatch = null, this.inlineContent = null, this.isBlock = !(n.inline || e == "text"), this.isText = e == "text";
	}
	get isInline() {
		return !this.isBlock;
	}
	get isTextblock() {
		return this.isBlock && this.inlineContent;
	}
	get isLeaf() {
		return this.contentMatch == Ei.empty;
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
		return !e && this.defaultAttrs ? this.defaultAttrs : Bi(this.attrs, e);
	}
	create(e = null, t, n) {
		if (this.isText) throw Error("NodeType.create can't construct text nodes");
		return new Ci(this, this.computeAttrs(e), M.from(t), N.setFrom(n));
	}
	createChecked(e = null, t, n) {
		return t = M.from(t), this.checkContent(t), new Ci(this, this.computeAttrs(e), t, N.setFrom(n));
	}
	createAndFill(e = null, t, n) {
		if (e = this.computeAttrs(e), t = M.from(t), t.size) {
			let e = this.contentMatch.fillBefore(t);
			if (!e) return null;
			t = e.append(t);
		}
		let r = this.contentMatch.matchFragment(t), i = r && r.fillBefore(M.empty, !0);
		return i ? new Ci(this, e, t.append(i), N.setFrom(n)) : null;
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
		Vi(this.attrs, e, "node", this.name);
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
		return t ? t.length ? t : N.none : e;
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
function Wi(e, t, n) {
	let r = n.split("|");
	return (n) => {
		let i = n === null ? "null" : typeof n;
		if (r.indexOf(i) < 0) throw RangeError(`Expected value of type ${r} for attribute ${t} on type ${e}, got ${i}`);
	};
}
var Gi = class {
	constructor(e, t, n) {
		this.hasDefault = Object.prototype.hasOwnProperty.call(n, "default"), this.default = n.default, this.validate = typeof n.validate == "string" ? Wi(e, t, n.validate) : n.validate;
	}
	get isRequired() {
		return !this.hasDefault;
	}
}, Ki = class e {
	constructor(e, t, n, r) {
		this.name = e, this.rank = t, this.schema = n, this.spec = r, this.attrs = Hi(e, r.attrs), this.excluded = null;
		let i = zi(this.attrs);
		this.instance = i ? new N(this, i) : null;
	}
	create(e = null) {
		return !e && this.instance ? this.instance : new N(this, Bi(this.attrs, e));
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
		Vi(this.attrs, e, "mark", this.name);
	}
	excludes(e) {
		return this.excluded.indexOf(e) > -1;
	}
}, qi = class {
	constructor(e) {
		this.linebreakReplacement = null, this.cached = Object.create(null);
		let t = this.spec = {};
		for (let n in e) t[n] = e[n];
		t.nodes = Qr.from(e.nodes), t.marks = Qr.from(e.marks || {}), this.nodes = Ui.compile(this.spec.nodes, this), this.marks = Ki.compile(this.spec.marks, this);
		let n = Object.create(null);
		for (let e in this.nodes) {
			if (e in this.marks) throw RangeError(e + " can not be both a node and a mark");
			let t = this.nodes[e], r = t.spec.content || "", i = t.spec.marks;
			if (t.contentMatch = n[r] || (n[r] = Ei.parse(r, this.nodes)), t.inlineContent = t.contentMatch.inlineContent, t.spec.linebreakReplacement) {
				if (this.linebreakReplacement) throw RangeError("Multiple linebreak nodes defined");
				if (!t.isInline || !t.isLeaf) throw RangeError("Linebreak replacement nodes must be inline leaf nodes");
				this.linebreakReplacement = t;
			}
			t.markSet = i == "_" ? null : i ? Ji(this, i.split(" ")) : i == "" || !t.inlineContent ? [] : null;
		}
		for (let e in this.marks) {
			let t = this.marks[e], n = t.spec.excludes;
			t.excluded = n == null ? [t] : n == "" ? [] : Ji(this, n.split(" "));
		}
		this.nodeFromJSON = (e) => Ci.fromJSON(this, e), this.markFromJSON = (e) => N.fromJSON(this, e), this.topNodeType = this.nodes[this.spec.topNode || "doc"], this.cached.wrappings = Object.create(null);
	}
	node(e, t = null, n, r) {
		if (typeof e == "string") e = this.nodeType(e);
		else if (!(e instanceof Ui)) throw RangeError("Invalid node type: " + e);
		else if (e.schema != this) throw RangeError("Node type from different schema used (" + e.name + ")");
		return e.createChecked(t, n, r);
	}
	text(e, t) {
		let n = this.nodes.text;
		return new wi(n, n.defaultAttrs, e, N.setFrom(t));
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
function Ji(e, t) {
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
function Yi(e) {
	return e.tag != null;
}
function Xi(e) {
	return e.style != null;
}
var Zi = class e {
	constructor(e, t) {
		this.schema = e, this.rules = t, this.tags = [], this.styles = [];
		let n = this.matchedStyles = [];
		t.forEach((e) => {
			if (Yi(e)) this.tags.push(e);
			else if (Xi(e)) {
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
		let n = new oa(this, t, !1);
		return n.addAll(e, N.none, t.from, t.to), n.finish();
	}
	parseSlice(e, t = {}) {
		let n = new oa(this, t, !0);
		return n.addAll(e, N.none, t.from, t.to), P.maxOpen(n.finish());
	}
	matchTag(e, t, n) {
		for (let r = n ? this.tags.indexOf(n) + 1 : 0; r < this.tags.length; r++) {
			let n = this.tags[r];
			if (ca(e, n.tag) && (n.namespace === void 0 || e.namespaceURI == n.namespace) && (!n.context || t.matchesContext(n.context))) {
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
				n(e = la(e)), e.mark || e.ignore || e.clearMark || (e.mark = t);
			});
		}
		for (let t in e.nodes) {
			let r = e.nodes[t].spec.parseDOM;
			r && r.forEach((e) => {
				n(e = la(e)), e.node || e.ignore || e.mark || (e.node = t);
			});
		}
		return t;
	}
	static fromSchema(t) {
		return t.cached.domParser || (t.cached.domParser = new e(t, e.schemaRules(t)));
	}
}, Qi = {
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
}, $i = {
	head: !0,
	noscript: !0,
	object: !0,
	script: !0,
	style: !0,
	title: !0
}, ea = {
	ol: !0,
	ul: !0
}, ta = 1, na = 2, ra = 4;
function ia(e, t, n) {
	return t == null ? e && e.whitespace == "pre" ? ta | na : n & ~ra : (t ? ta : 0) | (t === "full" ? na : 0);
}
var aa = class {
	constructor(e, t, n, r, i, a) {
		this.type = e, this.attrs = t, this.marks = n, this.solid = r, this.options = a, this.content = [], this.activeMarks = N.none, this.match = i || (a & ra ? null : e.contentMatch);
	}
	findWrapping(e) {
		if (!this.match) {
			if (!this.type) return [];
			let t = this.type.contentMatch.fillBefore(M.from(e));
			if (t) this.match = this.type.contentMatch.matchFragment(t);
			else {
				let t = this.type.contentMatch, n;
				return (n = t.findWrapping(e.type)) ? (this.match = t, n) : null;
			}
		}
		return this.match.findWrapping(e.type);
	}
	finish(e) {
		if (!(this.options & ta)) {
			let e = this.content[this.content.length - 1], t;
			if (e && e.isText && (t = /[ \t\r\n\u000c]+$/.exec(e.text))) {
				let n = e;
				e.text.length == t[0].length ? this.content.pop() : this.content[this.content.length - 1] = n.withText(n.text.slice(0, n.text.length - t[0].length));
			}
		}
		let t = M.from(this.content);
		return !e && this.match && (t = t.append(this.match.fillBefore(M.empty, !0))), this.type ? this.type.create(this.attrs, t, this.marks) : t;
	}
	inlineContext(e) {
		return this.type ? this.type.inlineContent : this.content.length ? this.content[0].isInline : e.parentNode && !Qi.hasOwnProperty(e.parentNode.nodeName.toLowerCase());
	}
}, oa = class {
	constructor(e, t, n) {
		this.parser = e, this.options = t, this.isOpen = n, this.open = 0, this.localPreserveWS = !1;
		let r = t.topNode, i, a = ia(null, t.preserveWhitespace, 0) | (n ? ra : 0);
		i = r ? new aa(r.type, r.attrs, N.none, !0, t.topMatch || r.type.contentMatch, a) : n ? new aa(null, null, N.none, !0, null, a) : new aa(e.schema.topNodeType, null, N.none, !0, null, a), this.nodes = [i], this.find = t.findPositions, this.needsBlock = !1;
	}
	get top() {
		return this.nodes[this.open];
	}
	addDOM(e, t) {
		e.nodeType == 3 ? this.addTextNode(e, t) : e.nodeType == 1 && this.addElement(e, t);
	}
	addTextNode(e, t) {
		let n = e.nodeValue, r = this.top, i = r.options & na ? "full" : this.localPreserveWS || (r.options & ta) > 0, { schema: a } = this.parser;
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
		ea.hasOwnProperty(a) && this.parser.normalizeLists && sa(e);
		let s = this.options.ruleFromNode && this.options.ruleFromNode(e) || (o = this.parser.matchTag(e, this, n));
		out: if (s ? s.ignore : $i.hasOwnProperty(a)) this.findInside(e), this.ignoreFallback(e, t);
		else if (!s || s.skip || s.closeParent) {
			s && s.closeParent ? this.open = Math.max(0, this.open - 1) : s && s.skip.nodeType && (e = s.skip);
			let n, r = this.needsBlock;
			if (Qi.hasOwnProperty(a)) i.content.length && i.content[0].isInline && this.open && (this.open--, i = this.top), n = !0, i.type || (this.needsBlock = !0);
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
			let n = N.none;
			for (let i of r.concat(e.marks)) (t.type ? t.type.allowsMarkType(i.type) : ua(i.type, e.type)) && (n = i.addToSet(n));
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
		let o = ia(e, i, a.options);
		a.options & ra && a.content.length == 0 && (o |= ra);
		let s = N.none;
		return n = n.filter((t) => (a.type ? a.type.allowsMarkType(t.type) : ua(t.type, e)) ? (s = t.addToSet(s), !1) : !0), this.nodes.push(new aa(e, t, s, r, null, o)), this.open++, n;
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
		else this.localPreserveWS && (this.nodes[t].options |= ta);
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
function sa(e) {
	for (let t = e.firstChild, n = null; t; t = t.nextSibling) {
		let e = t.nodeType == 1 ? t.nodeName.toLowerCase() : null;
		e && ea.hasOwnProperty(e) && n ? (n.appendChild(t), t = n) : e == "li" ? n = t : e && (n = null);
	}
}
function ca(e, t) {
	return (e.matches || e.msMatchesSelector || e.webkitMatchesSelector || e.mozMatchesSelector).call(e, t);
}
function la(e) {
	let t = {};
	for (let n in e) t[n] = e[n];
	return t;
}
function ua(e, t) {
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
var da = class e {
	constructor(e, t) {
		this.nodes = e, this.marks = t;
	}
	serializeFragment(e, t = {}, n) {
		n || (n = pa(t).createDocumentFragment());
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
		let { dom: n, contentDOM: r } = _a(pa(t), this.nodes[e.type.name](e), null, e.attrs);
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
		return r && _a(pa(n), r(e, t), null, e.attrs);
	}
	static renderSpec(e, t, n = null, r) {
		return _a(e, t, n, r);
	}
	static fromSchema(t) {
		return t.cached.domSerializer || (t.cached.domSerializer = new e(this.nodesFromSchema(t), this.marksFromSchema(t)));
	}
	static nodesFromSchema(e) {
		let t = fa(e.nodes);
		return t.text || (t.text = (e) => e.text), t;
	}
	static marksFromSchema(e) {
		return fa(e.marks);
	}
};
function fa(e) {
	let t = {};
	for (let n in e) {
		let r = e[n].spec.toDOM;
		r && (t[n] = r);
	}
	return t;
}
function pa(e) {
	return e.document || window.document;
}
var ma = /* @__PURE__ */ new WeakMap();
function ha(e) {
	let t = ma.get(e);
	return t === void 0 && ma.set(e, t = ga(e)), t;
}
function ga(e) {
	let t = null;
	function n(e) {
		if (e && typeof e == "object") if (Array.isArray(e)) if (typeof e[0] == "string") t || (t = []), t.push(e);
		else for (let t = 0; t < e.length; t++) n(e[t]);
		else for (let t in e) n(e[t]);
	}
	return n(e), t;
}
function _a(e, t, n, r) {
	if (typeof t == "string") return { dom: e.createTextNode(t) };
	if (t.nodeType != null) return { dom: t };
	if (t.dom && t.dom.nodeType != null) return t;
	let i = t[0], a;
	if (typeof i != "string") throw RangeError("Invalid array passed to renderSpec");
	if (r && (a = ha(r)) && a.indexOf(t) > -1) throw RangeError("Using an array from an attribute object as a DOM spec. This may be an attempted cross site scripting attack.");
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
			let { dom: t, contentDOM: i } = _a(e, a, n, r);
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
var va = 65535, ya = 2 ** 16;
function ba(e, t) {
	return e + t * ya;
}
function xa(e) {
	return e & va;
}
function Sa(e) {
	return (e - (e & va)) / ya;
}
var Ca = 1, wa = 2, Ta = 4, Ea = 8, Da = class {
	constructor(e, t, n) {
		this.pos = e, this.delInfo = t, this.recover = n;
	}
	get deleted() {
		return (this.delInfo & Ea) > 0;
	}
	get deletedBefore() {
		return (this.delInfo & (Ca | Ta)) > 0;
	}
	get deletedAfter() {
		return (this.delInfo & (wa | Ta)) > 0;
	}
	get deletedAcross() {
		return (this.delInfo & Ta) > 0;
	}
}, Oa = class e {
	constructor(t, n = !1) {
		if (this.ranges = t, this.inverted = n, !t.length && e.empty) return e.empty;
	}
	recover(e) {
		let t = 0, n = xa(e);
		if (!this.inverted) for (let e = 0; e < n; e++) t += this.ranges[e * 3 + 2] - this.ranges[e * 3 + 1];
		return this.ranges[n * 3] + t + Sa(e);
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
				let d = e == (t < 0 ? s : u) ? null : ba(o / 3, e - s), f = e == s ? wa : e == u ? Ca : Ta;
				return (t < 0 ? e != s : e != u) && (f |= Ea), new Da(a, f, d);
			}
			r += l - c;
		}
		return n ? e + r : new Da(e + r, 0, null);
	}
	touches(e, t) {
		let n = 0, r = xa(t), i = this.inverted ? 2 : 1, a = this.inverted ? 1 : 2;
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
Oa.empty = new Oa([]);
var ka = class e {
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
		return n ? e : new Da(e, r, null);
	}
}, Aa = Object.create(null), ja = class {
	getMap() {
		return Oa.empty;
	}
	merge(e) {
		return null;
	}
	static fromJSON(e, t) {
		if (!t || !t.stepType) throw RangeError("Invalid input for Step.fromJSON");
		let n = Aa[t.stepType];
		if (!n) throw RangeError(`No step type ${t.stepType} defined`);
		return n.fromJSON(e, t);
	}
	static jsonID(e, t) {
		if (e in Aa) throw RangeError("Duplicate use of step JSON ID " + e);
		return Aa[e] = t, t.prototype.jsonID = e, t;
	}
}, Ma = class e {
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
			if (t instanceof ii) return e.fail(t.message);
			throw t;
		}
	}
};
function Na(e, t, n) {
	let r = [];
	for (let i = 0; i < e.childCount; i++) {
		let a = e.child(i);
		a.content.size && (a = a.copy(Na(a.content, t, a))), a.isInline && (a = t(a, n, i)), r.push(a);
	}
	return M.fromArray(r);
}
var Pa = class e extends ja {
	constructor(e, t, n) {
		super(), this.from = e, this.to = t, this.mark = n;
	}
	apply(e) {
		let t = e.slice(this.from, this.to), n = e.resolve(this.from), r = n.node(n.sharedDepth(this.to)), i = new P(Na(t.content, (e, t) => !e.isAtom || !t.type.allowsMarkType(this.mark.type) ? e : e.mark(this.mark.addToSet(e.marks)), r), t.openStart, t.openEnd);
		return Ma.fromReplace(e, this.from, this.to, i);
	}
	invert() {
		return new Fa(this.from, this.to, this.mark);
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
ja.jsonID("addMark", Pa);
var Fa = class e extends ja {
	constructor(e, t, n) {
		super(), this.from = e, this.to = t, this.mark = n;
	}
	apply(e) {
		let t = e.slice(this.from, this.to), n = new P(Na(t.content, (e) => e.mark(this.mark.removeFromSet(e.marks)), e), t.openStart, t.openEnd);
		return Ma.fromReplace(e, this.from, this.to, n);
	}
	invert() {
		return new Pa(this.from, this.to, this.mark);
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
ja.jsonID("removeMark", Fa);
var Ia = class e extends ja {
	constructor(e, t) {
		super(), this.pos = e, this.mark = t;
	}
	apply(e) {
		let t = e.nodeAt(this.pos);
		if (!t) return Ma.fail("No node at mark step's position");
		let n = t.type.create(t.attrs, null, this.mark.addToSet(t.marks));
		return Ma.fromReplace(e, this.pos, this.pos + 1, new P(M.from(n), 0, +!t.isLeaf));
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
		return new La(this.pos, this.mark);
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
ja.jsonID("addNodeMark", Ia);
var La = class e extends ja {
	constructor(e, t) {
		super(), this.pos = e, this.mark = t;
	}
	apply(e) {
		let t = e.nodeAt(this.pos);
		if (!t) return Ma.fail("No node at mark step's position");
		let n = t.type.create(t.attrs, null, this.mark.removeFromSet(t.marks));
		return Ma.fromReplace(e, this.pos, this.pos + 1, new P(M.from(n), 0, +!t.isLeaf));
	}
	invert(e) {
		let t = e.nodeAt(this.pos);
		return !t || !this.mark.isInSet(t.marks) ? this : new Ia(this.pos, this.mark);
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
ja.jsonID("removeNodeMark", La);
var Ra = class e extends ja {
	constructor(e, t, n, r = !1) {
		super(), this.from = e, this.to = t, this.slice = n, this.structure = r;
	}
	apply(e) {
		return this.structure && Ba(e, this.from, this.to) ? Ma.fail("Structure replace would overwrite content") : Ma.fromReplace(e, this.from, this.to, this.slice);
	}
	getMap() {
		return new Oa([
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
			let n = this.slice.size + t.slice.size == 0 ? P.empty : new P(this.slice.content.append(t.slice.content), this.slice.openStart, t.slice.openEnd);
			return new e(this.from, this.to + (t.to - t.from), n, this.structure);
		} else if (t.to == this.from && !this.slice.openStart && !t.slice.openEnd) {
			let n = this.slice.size + t.slice.size == 0 ? P.empty : new P(t.slice.content.append(this.slice.content), t.slice.openStart, this.slice.openEnd);
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
		return new e(n.from, n.to, P.fromJSON(t, n.slice), !!n.structure);
	}
};
Ra.MAP_BIAS = 1, ja.jsonID("replace", Ra);
var za = class e extends ja {
	constructor(e, t, n, r, i, a, o = !1) {
		super(), this.from = e, this.to = t, this.gapFrom = n, this.gapTo = r, this.slice = i, this.insert = a, this.structure = o;
	}
	apply(e) {
		if (this.structure && (Ba(e, this.from, this.gapFrom) || Ba(e, this.gapTo, this.to))) return Ma.fail("Structure gap-replace would overwrite content");
		let t = e.slice(this.gapFrom, this.gapTo);
		if (t.openStart || t.openEnd) return Ma.fail("Gap is not a flat range");
		let n = this.slice.insertAt(this.insert, t.content);
		return n ? Ma.fromReplace(e, this.from, this.to, n) : Ma.fail("Content does not fit in gap");
	}
	getMap() {
		return new Oa([
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
		return new e(n.from, n.to, n.gapFrom, n.gapTo, P.fromJSON(t, n.slice), n.insert, !!n.structure);
	}
};
ja.jsonID("replaceAround", za);
function Ba(e, t, n) {
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
function Va(e, t, n, r) {
	let i = [], a = [], o, s;
	e.doc.nodesBetween(t, n, (e, c, l) => {
		if (!e.isInline) return;
		let u = e.marks;
		if (!r.isInSet(u) && l.type.allowsMarkType(r.type)) {
			let l = Math.max(c, t), d = Math.min(c + e.nodeSize, n), f = r.addToSet(u);
			for (let e = 0; e < u.length; e++) u[e].isInSet(f) || (o && o.to == l && o.mark.eq(u[e]) ? o.to = d : i.push(o = new Fa(l, d, u[e])));
			s && s.to == l ? s.to = d : a.push(s = new Pa(l, d, r));
		}
	}), i.forEach((t) => e.step(t)), a.forEach((t) => e.step(t));
}
function Ha(e, t, n, r) {
	let i = [], a = 0;
	e.doc.nodesBetween(t, n, (e, o) => {
		if (!e.isInline) return;
		a++;
		let s = null;
		if (r instanceof Ki) {
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
	}), i.forEach((t) => e.step(new Fa(t.from, t.to, t.style)));
}
function Ua(e, t, n, r = n.contentMatch, i = !0) {
	let a = e.doc.nodeAt(t), o = [], s = t + 1;
	for (let t = 0; t < a.childCount; t++) {
		let c = a.child(t), l = s + c.nodeSize, u = r.matchType(c.type);
		if (!u) o.push(new Ra(s, l, P.empty));
		else {
			r = u;
			for (let t = 0; t < c.marks.length; t++) n.allowsMarkType(c.marks[t].type) || e.step(new Fa(s, l, c.marks[t]));
			if (i && c.isText && n.whitespace != "pre") {
				let e, t = /\r?\n|\r/g, r;
				for (; e = t.exec(c.text);) r || (r = new P(M.from(n.schema.text(" ", n.allowedMarks(c.marks))), 0, 0)), o.push(new Ra(s + e.index, s + e.index + e[0].length, r));
			}
		}
		s = l;
	}
	if (!r.validEnd) {
		let t = r.fillBefore(M.empty, !0);
		e.replace(s, s, new P(t, 0, 0));
	}
	for (let t = o.length - 1; t >= 0; t--) e.step(o[t]);
}
function Wa(e, t, n) {
	return (t == 0 || e.canReplace(t, e.childCount)) && (n == e.childCount || e.canReplace(0, n));
}
function Ga(e) {
	let t = e.parent.content.cutByIndex(e.startIndex, e.endIndex);
	for (let n = e.depth, r = 0, i = 0;; --n) {
		let a = e.$from.node(n), o = e.$from.index(n) + r, s = e.$to.indexAfter(n) - i;
		if (n < e.depth && a.canReplace(o, s, t)) return n;
		if (n == 0 || a.type.spec.isolating || !Wa(a, o, s)) break;
		o && (r = 1), s < a.childCount && (i = 1);
	}
	return null;
}
function Ka(e, t, n) {
	let { $from: r, $to: i, depth: a } = t, o = r.before(a + 1), s = i.after(a + 1), c = o, l = s, u = M.empty, d = 0;
	for (let e = a, t = !1; e > n; e--) t || r.index(e) > 0 ? (t = !0, u = M.from(r.node(e).copy(u)), d++) : c--;
	let f = M.empty, p = 0;
	for (let e = a, t = !1; e > n; e--) t || i.after(e + 1) < i.end(e) ? (t = !0, f = M.from(i.node(e).copy(f)), p++) : l++;
	e.step(new za(c, l, o, s, new P(u.append(f), d, p), u.size - d, !0));
}
function qa(e, t, n = null, r = e) {
	let i = Ya(e, t), a = i && Xa(r, t);
	return a ? i.map(Ja).concat({
		type: t,
		attrs: n
	}).concat(a.map(Ja)) : null;
}
function Ja(e) {
	return {
		type: e,
		attrs: null
	};
}
function Ya(e, t) {
	let { parent: n, startIndex: r, endIndex: i } = e, a = n.contentMatchAt(r).findWrapping(t);
	if (!a) return null;
	let o = a.length ? a[0] : t;
	return n.canReplaceWith(r, i, o) ? a : null;
}
function Xa(e, t) {
	let { parent: n, startIndex: r, endIndex: i } = e, a = n.child(r), o = t.contentMatch.findWrapping(a.type);
	if (!o) return null;
	let s = (o.length ? o[o.length - 1] : t).contentMatch;
	for (let e = r; s && e < i; e++) s = s.matchType(n.child(e).type);
	return !s || !s.validEnd ? null : o;
}
function Za(e, t, n) {
	let r = M.empty;
	for (let e = n.length - 1; e >= 0; e--) {
		if (r.size) {
			let t = n[e].type.contentMatch.matchFragment(r);
			if (!t || !t.validEnd) throw RangeError("Wrapper type given to Transform.wrap does not form valid content of its parent wrapper");
		}
		r = M.from(n[e].type.create(n[e].attrs, r));
	}
	let i = t.start, a = t.end;
	e.step(new za(i, a, i, a, new P(r, 0, 0), n.length, !0));
}
function Qa(e, t, n, r, i) {
	if (!r.isTextblock) throw RangeError("Type given to setBlockType should be a textblock");
	let a = e.steps.length;
	e.doc.nodesBetween(t, n, (t, n) => {
		let o = typeof i == "function" ? i(t) : i;
		if (t.isTextblock && !t.hasMarkup(r, o) && to(e.doc, e.mapping.slice(a).map(n), r)) {
			let i = null;
			if (r.schema.linebreakReplacement) {
				let e = r.whitespace == "pre", t = !!r.contentMatch.matchType(r.schema.linebreakReplacement);
				e && !t ? i = !1 : !e && t && (i = !0);
			}
			i === !1 && eo(e, t, n, a), Ua(e, e.mapping.slice(a).map(n, 1), r, void 0, i === null);
			let s = e.mapping.slice(a), c = s.map(n, 1), l = s.map(n + t.nodeSize, 1);
			return e.step(new za(c, l, c + 1, l - 1, new P(M.from(r.create(o, null, t.marks)), 0, 0), 1, !0)), i === !0 && $a(e, t, n, a), !1;
		}
	});
}
function $a(e, t, n, r) {
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
function eo(e, t, n, r) {
	t.forEach((i, a) => {
		if (i.type == i.type.schema.linebreakReplacement) {
			let i = e.mapping.slice(r).map(n + 1 + a);
			e.replaceWith(i, i + 1, t.type.schema.text("\n"));
		}
	});
}
function to(e, t, n) {
	let r = e.resolve(t), i = r.index();
	return r.parent.canReplaceWith(i, i + 1, n);
}
function no(e, t, n, r, i) {
	let a = e.doc.nodeAt(t);
	if (!a) throw RangeError("No node at given position");
	n || (n = a.type);
	let o = n.create(r, null, i || a.marks);
	if (a.isLeaf) return e.replaceWith(t, t + a.nodeSize, o);
	if (!n.validContent(a.content)) throw RangeError("Invalid content for node type " + n.name);
	e.step(new za(t, t + a.nodeSize, t + 1, t + a.nodeSize - 1, new P(M.from(o), 0, 0), 1, !0));
}
function ro(e, t, n = 1, r) {
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
function io(e, t, n = 1, r) {
	let i = e.doc.resolve(t), a = M.empty, o = M.empty;
	for (let e = i.depth, t = i.depth - n, s = n - 1; e > t; e--, s--) {
		a = M.from(i.node(e).copy(a));
		let t = r && r[s];
		o = M.from(t ? t.type.create(t.attrs, o) : i.node(e).copy(o));
	}
	e.step(new Ra(t, t, new P(a.append(o), n, n), !0));
}
function ao(e, t) {
	let n = e.resolve(t), r = n.index();
	return so(n.nodeBefore, n.nodeAfter) && n.parent.canReplace(r, r + 1);
}
function oo(e, t) {
	t.content.size || e.type.compatibleContent(t.type);
	let n = e.contentMatchAt(e.childCount), { linebreakReplacement: r } = e.type.schema;
	for (let i = 0; i < t.childCount; i++) {
		let a = t.child(i), o = a.type == r ? e.type.schema.nodes.text : a.type;
		if (n = n.matchType(o), !n || !e.type.allowsMarks(a.marks)) return !1;
	}
	return n.validEnd;
}
function so(e, t) {
	return !!(e && t && !e.isLeaf && oo(e, t));
}
function co(e, t, n = -1) {
	let r = e.resolve(t);
	for (let e = r.depth;; e--) {
		let i, a, o = r.index(e);
		if (e == r.depth ? (i = r.nodeBefore, a = r.nodeAfter) : n > 0 ? (i = r.node(e + 1), o++, a = r.node(e).maybeChild(o)) : (i = r.node(e).maybeChild(o - 1), a = r.node(e + 1)), i && !i.isTextblock && so(i, a) && r.node(e).canReplace(o, o + 1)) return t;
		if (e == 0) break;
		t = n < 0 ? r.before(e) : r.after(e);
	}
}
function lo(e, t, n) {
	let r = null, { linebreakReplacement: i } = e.doc.type.schema, a = e.doc.resolve(t - n), o = a.node().type;
	if (i && o.inlineContent) {
		let e = o.whitespace == "pre", t = !!o.contentMatch.matchType(i);
		e && !t ? r = !1 : !e && t && (r = !0);
	}
	let s = e.steps.length;
	if (r === !1) {
		let r = e.doc.resolve(t + n);
		eo(e, r.node(), r.before(), s);
	}
	o.inlineContent && Ua(e, t + n - 1, o, a.node().contentMatchAt(a.index()), r == null);
	let c = e.mapping.slice(s), l = c.map(t - n);
	if (e.step(new Ra(l, c.map(t + n, -1), P.empty, !0)), r === !0) {
		let t = e.doc.resolve(l);
		$a(e, t.node(), t.before(), e.steps.length);
	}
	return e;
}
function uo(e, t, n) {
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
function fo(e, t, n) {
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
function po(e, t, n = t, r = P.empty) {
	if (t == n && !r.size) return null;
	let i = e.resolve(t), a = e.resolve(n);
	return mo(i, a, r) ? new Ra(t, n, r) : new ho(i, a, r).fit();
}
function mo(e, t, n) {
	return !n.openStart && !n.openEnd && e.start() == t.start() && e.parent.canReplace(e.index(), t.index(), n.content);
}
var ho = class {
	constructor(e, t, n) {
		this.$from = e, this.$to = t, this.unplaced = n, this.frontier = [], this.placed = M.empty;
		for (let t = 0; t <= e.depth; t++) {
			let n = e.node(t);
			this.frontier.push({
				type: n.type,
				match: n.contentMatchAt(e.indexAfter(t))
			});
		}
		for (let t = e.depth; t > 0; t--) this.placed = M.from(e.node(t).copy(this.placed));
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
		let s = new P(i, a, o);
		return e > -1 ? new za(n.pos, e, this.$to.pos, this.$to.end(), s, t) : s.size || n.pos != this.$to.pos ? new Ra(n.pos, r.pos, s) : null;
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
			n ? (r = I(this.unplaced.content, n - 1).firstChild, e = r.content) : e = this.unplaced.content;
			let i = e.firstChild;
			for (let e = this.depth; e >= 0; e--) {
				let { type: a, match: o } = this.frontier[e], s, c = null;
				if (t == 1 && (i ? o.matchType(i.type) || (c = o.fillBefore(M.from(i), !1)) : r && a.compatibleContent(r.type))) return {
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
		let { content: e, openStart: t, openEnd: n } = this.unplaced, r = I(e, t);
		return !r.childCount || r.firstChild.isLeaf ? !1 : (this.unplaced = new P(e, t + 1, Math.max(n, r.size + t >= e.size - n ? t + 1 : 0)), !0);
	}
	dropNode() {
		let { content: e, openStart: t, openEnd: n } = this.unplaced, r = I(e, t);
		if (r.childCount <= 1 && t > 0) {
			let i = e.size - t <= t + r.size;
			this.unplaced = new P(go(e, t - 1, 1), t - 1, i ? t - 1 : n);
		} else this.unplaced = new P(go(e, t, 1), t, n);
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
			c++, (c > 1 || s == 0 || e.content.size) && (u = t, l.push(L(e.mark(d.allowedMarks(e.marks)), c == 1 ? s : 0, c == o.childCount ? f : -1)));
		}
		let p = c == o.childCount;
		p || (f = -1), this.placed = _o(this.placed, t, M.from(l)), this.frontier[t].match = u, p && f < 0 && n && n.type == this.frontier[this.depth].type && this.frontier.length > 1 && this.closeFrontierNode();
		for (let e = 0, t = o; e < f; e++) {
			let e = t.lastChild;
			this.frontier.push({
				type: e.type,
				match: e.contentMatchAt(e.childCount)
			}), t = e.content;
		}
		this.unplaced = p ? e == 0 ? P.empty : new P(go(a.content, e - 1, 1), e - 1, f < 0 ? a.openEnd : e - 1) : new P(go(a.content, e, c), a.openStart, a.openEnd);
	}
	mustMoveInline() {
		if (!this.$to.parent.isTextblock) return -1;
		let e = this.frontier[this.depth], t;
		if (!e.type.isTextblock || !vo(this.$to, this.$to.depth, e.type, e.match, !1) || this.$to.depth == this.depth && (t = this.findCloseLevel(this.$to)) && t.depth == this.depth) return -1;
		let { depth: n } = this.$to, r = this.$to.after(n);
		for (; n > 1 && r == this.$to.end(--n);) ++r;
		return r;
	}
	findCloseLevel(e) {
		scan: for (let t = Math.min(this.depth, e.depth); t >= 0; t--) {
			let { match: n, type: r } = this.frontier[t], i = t < e.depth && e.end(t + 1) == e.pos + (e.depth - (t + 1)), a = vo(e, t, r, n, i);
			if (a) {
				for (let n = t - 1; n >= 0; n--) {
					let { match: t, type: r } = this.frontier[n], i = vo(e, n, r, t, !0);
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
		t.fit.childCount && (this.placed = _o(this.placed, t.depth, t.fit)), e = t.move;
		for (let n = t.depth + 1; n <= e.depth; n++) {
			let t = e.node(n), r = t.type.contentMatch.fillBefore(t.content, !0, e.index(n));
			this.openFrontierNode(t.type, t.attrs, r);
		}
		return e;
	}
	openFrontierNode(e, t = null, n) {
		let r = this.frontier[this.depth];
		r.match = r.match.matchType(e), this.placed = _o(this.placed, this.depth, M.from(e.create(t, n))), this.frontier.push({
			type: e,
			match: e.contentMatch
		});
	}
	closeFrontierNode() {
		let e = this.frontier.pop().match.fillBefore(M.empty, !0);
		e.childCount && (this.placed = _o(this.placed, this.frontier.length, e));
	}
};
function go(e, t, n) {
	return t == 0 ? e.cutByIndex(n, e.childCount) : e.replaceChild(0, e.firstChild.copy(go(e.firstChild.content, t - 1, n)));
}
function _o(e, t, n) {
	return t == 0 ? e.append(n) : e.replaceChild(e.childCount - 1, e.lastChild.copy(_o(e.lastChild.content, t - 1, n)));
}
function I(e, t) {
	for (let n = 0; n < t; n++) e = e.firstChild.content;
	return e;
}
function L(e, t, n) {
	if (t <= 0) return e;
	let r = e.content;
	return t > 1 && (r = r.replaceChild(0, L(r.firstChild, t - 1, r.childCount == 1 ? n - 1 : 0))), t > 0 && (r = e.type.contentMatch.fillBefore(r).append(r), n <= 0 && (r = r.append(e.type.contentMatch.matchFragment(r).fillBefore(M.empty, !0)))), e.copy(r);
}
function vo(e, t, n, r, i) {
	let a = e.node(t), o = i ? e.indexAfter(t) : e.index(t);
	if (o == a.childCount && !n.compatibleContent(a.type)) return null;
	let s = r.fillBefore(a.content, !0, o);
	return s && !yo(n, a.content, o) ? s : null;
}
function yo(e, t, n) {
	for (let r = n; r < t.childCount; r++) if (!e.allowsMarks(t.child(r).marks)) return !0;
	return !1;
}
function bo(e) {
	return e.spec.defining || e.spec.definingForContent;
}
function xo(e, t, n, r) {
	if (!r.size) return e.deleteRange(t, n);
	let i = e.doc.resolve(t), a = e.doc.resolve(n);
	if (mo(i, a, r)) return e.step(new Ra(t, n, r));
	let o = To(i, a);
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
		let t = l[e], n = bo(t.type);
		if (n && !t.sameMarkup(i.node(Math.abs(s) - 1))) u = e;
		else if (n || !t.type.isTextblock) break;
	}
	for (let t = r.openStart; t >= 0; t--) {
		let s = (t + u + 1) % (r.openStart + 1), d = l[s];
		if (d) for (let t = 0; t < o.length; t++) {
			let l = o[(t + c) % o.length], u = !0;
			l < 0 && (u = !1, l = -l);
			let f = i.node(l - 1), p = i.index(l - 1);
			if (f.canReplaceWith(p, p, d.type, d.marks)) return e.replace(i.before(l), u ? a.after(l) : n, new P(So(r.content, 0, r.openStart, s), s, r.openEnd));
		}
	}
	let d = e.steps.length;
	for (let s = o.length - 1; s >= 0 && (e.replace(t, n, r), !(e.steps.length > d)); s--) {
		let e = o[s];
		e < 0 || (t = i.before(e), n = a.after(e));
	}
}
function So(e, t, n, r, i) {
	if (t < n) {
		let i = e.firstChild;
		e = e.replaceChild(0, i.copy(So(i.content, t + 1, n, r, i)));
	}
	if (t > r) {
		let t = i.contentMatchAt(0), n = t.fillBefore(e).append(e);
		e = n.append(t.matchFragment(n).fillBefore(M.empty, !0));
	}
	return e;
}
function Co(e, t, n, r) {
	if (!r.isInline && t == n && e.doc.resolve(t).parent.content.size) {
		let i = uo(e.doc, t, r.type);
		i != null && (t = n = i);
	}
	e.replaceRange(t, n, new P(M.from(r), 0, 0));
}
function wo(e, t, n) {
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
	let a = To(r, i);
	for (let t = 0; t < a.length; t++) {
		let n = a[t], o = t == a.length - 1;
		if (o && n == 0 || r.node(n).type.contentMatch.validEnd) return e.delete(r.start(n), i.end(n));
		if (n > 0 && (o || r.node(n - 1).canReplace(r.index(n - 1), i.indexAfter(n - 1)))) return e.delete(r.before(n), i.after(n));
	}
	for (let a = 1; a <= r.depth && a <= i.depth; a++) if (t - r.start(a) == r.depth - a && n > r.end(a) && i.end(a) - n != i.depth - a && r.start(a - 1) == i.start(a - 1) && r.node(a - 1).canReplace(r.index(a - 1), i.index(a - 1))) return e.delete(r.before(a), n);
	e.delete(t, n);
}
function To(e, t) {
	let n = [], r = Math.min(e.depth, t.depth);
	for (let i = r; i >= 0; i--) {
		let r = e.start(i);
		if (r < e.pos - (e.depth - i) || t.end(i) > t.pos + (t.depth - i) || e.node(i).type.spec.isolating || t.node(i).type.spec.isolating) break;
		(r == t.start(i) || i == e.depth && i == t.depth && e.parent.inlineContent && t.parent.inlineContent && i && t.start(i - 1) == r - 1) && n.push(i);
	}
	return n;
}
var Eo = class e extends ja {
	constructor(e, t, n) {
		super(), this.pos = e, this.attr = t, this.value = n;
	}
	apply(e) {
		let t = e.nodeAt(this.pos);
		if (!t) return Ma.fail("No node at attribute step's position");
		let n = Object.create(null);
		for (let e in t.attrs) n[e] = t.attrs[e];
		n[this.attr] = this.value;
		let r = t.type.create(n, null, t.marks);
		return Ma.fromReplace(e, this.pos, this.pos + 1, new P(M.from(r), 0, +!t.isLeaf));
	}
	getMap() {
		return Oa.empty;
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
ja.jsonID("attr", Eo);
var Do = class e extends ja {
	constructor(e, t) {
		super(), this.attr = e, this.value = t;
	}
	apply(e) {
		let t = Object.create(null);
		for (let n in e.attrs) t[n] = e.attrs[n];
		t[this.attr] = this.value;
		let n = e.type.create(t, e.content, e.marks);
		return Ma.ok(n);
	}
	getMap() {
		return Oa.empty;
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
ja.jsonID("docAttr", Do);
var Oo = class extends Error {};
Oo = function e(t) {
	let n = Error.call(this, t);
	return n.__proto__ = e.prototype, n;
}, Oo.prototype = Object.create(Error.prototype), Oo.prototype.constructor = Oo, Oo.prototype.name = "TransformError";
var ko = class {
	constructor(e) {
		this.doc = e, this.steps = [], this.docs = [], this.mapping = new ka();
	}
	get before() {
		return this.docs.length ? this.docs[0] : this.doc;
	}
	step(e) {
		let t = this.maybeStep(e);
		if (t.failed) throw new Oo(t.failed);
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
	replace(e, t = e, n = P.empty) {
		let r = po(this.doc, e, t, n);
		return r && this.step(r), this;
	}
	replaceWith(e, t, n) {
		return this.replace(e, t, new P(M.from(n), 0, 0));
	}
	delete(e, t) {
		return this.replace(e, t, P.empty);
	}
	insert(e, t) {
		return this.replaceWith(e, e, t);
	}
	replaceRange(e, t, n) {
		return xo(this, e, t, n), this;
	}
	replaceRangeWith(e, t, n) {
		return Co(this, e, t, n), this;
	}
	deleteRange(e, t) {
		return wo(this, e, t), this;
	}
	lift(e, t) {
		return Ka(this, e, t), this;
	}
	join(e, t = 1) {
		return lo(this, e, t), this;
	}
	wrap(e, t) {
		return Za(this, e, t), this;
	}
	setBlockType(e, t = e, n, r = null) {
		return Qa(this, e, t, n, r), this;
	}
	setNodeMarkup(e, t, n = null, r) {
		return no(this, e, t, n, r), this;
	}
	setNodeAttribute(e, t, n) {
		return this.step(new Eo(e, t, n)), this;
	}
	setDocAttribute(e, t) {
		return this.step(new Do(e, t)), this;
	}
	addNodeMark(e, t) {
		return this.step(new Ia(e, t)), this;
	}
	removeNodeMark(e, t) {
		let n = this.doc.nodeAt(e);
		if (!n) throw RangeError("No node at position " + e);
		if (t instanceof N) t.isInSet(n.marks) && this.step(new La(e, t));
		else {
			let r = n.marks, i, a = [];
			for (; i = t.isInSet(r);) a.push(new La(e, i)), r = i.removeFromSet(r);
			for (let e = a.length - 1; e >= 0; e--) this.step(a[e]);
		}
		return this;
	}
	split(e, t = 1, n) {
		return io(this, e, t, n), this;
	}
	addMark(e, t, n) {
		return Va(this, e, t, n), this;
	}
	removeMark(e, t, n) {
		return Ha(this, e, t, n), this;
	}
	clearIncompatible(e, t, n) {
		return Ua(this, e, t, n), this;
	}
}, Ao = Object.create(null), R = class {
	constructor(e, t, n) {
		this.$anchor = e, this.$head = t, this.ranges = n || [new jo(e.min(t), e.max(t))];
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
	replace(e, t = P.empty) {
		let n = t.content.lastChild, r = null;
		for (let e = 0; e < t.openEnd; e++) r = n, n = n.lastChild;
		let i = e.steps.length, a = this.ranges;
		for (let o = 0; o < a.length; o++) {
			let { $from: s, $to: c } = a[o], l = e.mapping.slice(i);
			e.replaceRange(l.map(s.pos), l.map(c.pos), o ? P.empty : t), o == 0 && zo(e, i, (n ? n.isInline : r && r.isTextblock) ? -1 : 1);
		}
	}
	replaceWith(e, t) {
		let n = e.steps.length, r = this.ranges;
		for (let i = 0; i < r.length; i++) {
			let { $from: a, $to: o } = r[i], s = e.mapping.slice(n), c = s.map(a.pos), l = s.map(o.pos);
			i ? e.deleteRange(c, l) : (e.replaceRangeWith(c, l, t), zo(e, n, t.isInline ? -1 : 1));
		}
	}
	static findFrom(e, t, n = !1) {
		let r = e.parent.inlineContent ? new z(e) : Ro(e.node(0), e.parent, e.pos, e.index(), t, n);
		if (r) return r;
		for (let r = e.depth - 1; r >= 0; r--) {
			let i = t < 0 ? Ro(e.node(0), e.node(r), e.before(r + 1), e.index(r), t, n) : Ro(e.node(0), e.node(r), e.after(r + 1), e.index(r) + 1, t, n);
			if (i) return i;
		}
		return null;
	}
	static near(e, t = 1) {
		return this.findFrom(e, t) || this.findFrom(e, -t) || new Io(e.node(0));
	}
	static atStart(e) {
		return Ro(e, e, 0, 0, 1) || new Io(e);
	}
	static atEnd(e) {
		return Ro(e, e, e.content.size, e.childCount, -1) || new Io(e);
	}
	static fromJSON(e, t) {
		if (!t || !t.type) throw RangeError("Invalid input for Selection.fromJSON");
		let n = Ao[t.type];
		if (!n) throw RangeError(`No selection type ${t.type} defined`);
		return n.fromJSON(e, t);
	}
	static jsonID(e, t) {
		if (e in Ao) throw RangeError("Duplicate use of selection JSON ID " + e);
		return Ao[e] = t, t.prototype.jsonID = e, t;
	}
	getBookmark() {
		return z.between(this.$anchor, this.$head).getBookmark();
	}
};
R.prototype.visible = !0;
var jo = class {
	constructor(e, t) {
		this.$from = e, this.$to = t;
	}
}, Mo = !1;
function No(e) {
	!Mo && !e.parent.inlineContent && (Mo = !0, console.warn("TextSelection endpoint not pointing into a node with inline content (" + e.parent.type.name + ")"));
}
var z = class e extends R {
	constructor(e, t = e) {
		No(e), No(t), super(e, t);
	}
	get $cursor() {
		return this.$anchor.pos == this.$head.pos ? this.$head : null;
	}
	map(t, n) {
		let r = t.resolve(n.map(this.head));
		if (!r.parent.inlineContent) return R.near(r);
		let i = t.resolve(n.map(this.anchor));
		return new e(i.parent.inlineContent ? i : r, r);
	}
	replace(e, t = P.empty) {
		if (super.replace(e, t), t == P.empty) {
			let t = this.$from.marksAcross(this.$to);
			t && e.ensureMarks(t);
		}
	}
	eq(t) {
		return t instanceof e && t.anchor == this.anchor && t.head == this.head;
	}
	getBookmark() {
		return new Po(this.anchor, this.head);
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
			let e = R.findFrom(n, r, !0) || R.findFrom(n, -r, !0);
			if (e) n = e.$head;
			else return R.near(n, r);
		}
		return t.parent.inlineContent || (i == 0 ? t = n : (t = (R.findFrom(t, -r, !0) || R.findFrom(t, r, !0)).$anchor, t.pos < n.pos != i < 0 && (t = n))), new e(t, n);
	}
};
R.jsonID("text", z);
var Po = class e {
	constructor(e, t) {
		this.anchor = e, this.head = t;
	}
	map(t) {
		return new e(t.map(this.anchor), t.map(this.head));
	}
	resolve(e) {
		return z.between(e.resolve(this.anchor), e.resolve(this.head));
	}
}, B = class e extends R {
	constructor(e) {
		let t = e.nodeAfter, n = e.node(0).resolve(e.pos + t.nodeSize);
		super(e, n), this.node = t;
	}
	map(t, n) {
		let { deleted: r, pos: i } = n.mapResult(this.anchor), a = t.resolve(i);
		return r ? R.near(a) : new e(a);
	}
	content() {
		return new P(M.from(this.node), 0, 0);
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
		return new Fo(this.anchor);
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
B.prototype.visible = !1, R.jsonID("node", B);
var Fo = class e {
	constructor(e) {
		this.anchor = e;
	}
	map(t) {
		let { deleted: n, pos: r } = t.mapResult(this.anchor);
		return n ? new Po(r, r) : new e(r);
	}
	resolve(e) {
		let t = e.resolve(this.anchor), n = t.nodeAfter;
		return n && B.isSelectable(n) ? new B(t) : R.near(t);
	}
}, Io = class e extends R {
	constructor(e) {
		super(e.resolve(0), e.resolve(e.content.size));
	}
	replace(e, t = P.empty) {
		if (t == P.empty) {
			e.delete(0, e.doc.content.size);
			let t = R.atStart(e.doc);
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
		return Lo;
	}
};
R.jsonID("all", Io);
var Lo = {
	map() {
		return this;
	},
	resolve(e) {
		return new Io(e);
	}
};
function Ro(e, t, n, r, i, a = !1) {
	if (t.inlineContent) return z.create(e, n);
	for (let o = r - (i > 0 ? 0 : 1); i > 0 ? o < t.childCount : o >= 0; o += i) {
		let r = t.child(o);
		if (!r.isAtom) {
			let t = Ro(e, r, n + i, i < 0 ? r.childCount : 0, i, a);
			if (t) return t;
		} else if (!a && B.isSelectable(r)) return B.create(e, n - (i < 0 ? r.nodeSize : 0));
		n += r.nodeSize * i;
	}
	return null;
}
function zo(e, t, n) {
	let r = e.steps.length - 1;
	if (r < t) return;
	let i = e.steps[r];
	if (!(i instanceof Ra || i instanceof za)) return;
	let a = e.mapping.maps[r], o;
	a.forEach((e, t, n, r) => {
		o ?? (o = r);
	}), e.setSelection(R.near(e.doc.resolve(o), n));
}
var Bo = 1, Vo = 2, Ho = 4, Uo = class extends ko {
	constructor(e) {
		super(e.doc), this.curSelectionFor = 0, this.updated = 0, this.meta = Object.create(null), this.time = Date.now(), this.curSelection = e.selection, this.storedMarks = e.storedMarks;
	}
	get selection() {
		return this.curSelectionFor < this.steps.length && (this.curSelection = this.curSelection.map(this.doc, this.mapping.slice(this.curSelectionFor)), this.curSelectionFor = this.steps.length), this.curSelection;
	}
	setSelection(e) {
		if (e.$from.doc != this.doc) throw RangeError("Selection passed to setSelection must point at the current document");
		return this.curSelection = e, this.curSelectionFor = this.steps.length, this.updated = (this.updated | Bo) & ~Vo, this.storedMarks = null, this;
	}
	get selectionSet() {
		return (this.updated & Bo) > 0;
	}
	setStoredMarks(e) {
		return this.storedMarks = e, this.updated |= Vo, this;
	}
	ensureMarks(e) {
		return N.sameSet(this.storedMarks || this.selection.$from.marks(), e) || this.setStoredMarks(e), this;
	}
	addStoredMark(e) {
		return this.ensureMarks(e.addToSet(this.storedMarks || this.selection.$head.marks()));
	}
	removeStoredMark(e) {
		return this.ensureMarks(e.removeFromSet(this.storedMarks || this.selection.$head.marks()));
	}
	get storedMarksSet() {
		return (this.updated & Vo) > 0;
	}
	addStep(e, t) {
		super.addStep(e, t), this.updated &= ~Vo, this.storedMarks = null;
	}
	setTime(e) {
		return this.time = e, this;
	}
	replaceSelection(e) {
		return this.selection.replace(this, e), this;
	}
	replaceSelectionWith(e, t = !0) {
		let n = this.selection;
		return t && (e = e.mark(this.storedMarks || (n.empty ? n.$from.marks() : n.$from.marksAcross(n.$to) || N.none))), n.replaceWith(this, e), this;
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
			return this.replaceRangeWith(t, n, r.text(e, i)), !this.selection.empty && this.selection.to == t + e.length && this.setSelection(R.near(this.selection.$to)), this;
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
		return this.updated |= Ho, this;
	}
	get scrolledIntoView() {
		return (this.updated & Ho) > 0;
	}
};
function Wo(e, t) {
	return !t || !e ? e : e.bind(t);
}
var Go = class {
	constructor(e, t, n) {
		this.name = e, this.init = Wo(t.init, n), this.apply = Wo(t.apply, n);
	}
}, Ko = [
	new Go("doc", {
		init(e) {
			return e.doc || e.schema.topNodeType.createAndFill();
		},
		apply(e) {
			return e.doc;
		}
	}),
	new Go("selection", {
		init(e, t) {
			return e.selection || R.atStart(t.doc);
		},
		apply(e) {
			return e.selection;
		}
	}),
	new Go("storedMarks", {
		init(e) {
			return e.storedMarks || null;
		},
		apply(e, t, n, r) {
			return r.selection.$cursor ? e.storedMarks : null;
		}
	}),
	new Go("scrollToSelection", {
		init() {
			return 0;
		},
		apply(e, t) {
			return e.scrolledIntoView ? t + 1 : t;
		}
	})
], qo = class {
	constructor(e, t) {
		this.schema = e, this.plugins = [], this.pluginsByKey = Object.create(null), this.fields = Ko.slice(), t && t.forEach((e) => {
			if (this.pluginsByKey[e.key]) throw RangeError("Adding different instances of a keyed plugin (" + e.key + ")");
			this.plugins.push(e), this.pluginsByKey[e.key] = e, e.spec.state && this.fields.push(new Go(e.key, e.spec.state, e));
		});
	}
}, Jo = class e {
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
		return new Uo(this);
	}
	static create(t) {
		let n = new qo(t.doc ? t.doc.type.schema : t.schema, t.plugins), r = new e(n);
		for (let e = 0; e < n.fields.length; e++) r[n.fields[e].name] = n.fields[e].init(t, r);
		return r;
	}
	reconfigure(t) {
		let n = new qo(this.schema, t.plugins), r = n.fields, i = new e(n);
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
		let i = new qo(t.schema, t.plugins), a = new e(i);
		return i.fields.forEach((e) => {
			if (e.name == "doc") a.doc = Ci.fromJSON(t.schema, n.doc);
			else if (e.name == "selection") a.selection = R.fromJSON(a.doc, n.selection);
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
function Yo(e, t, n) {
	for (let r in e) {
		let i = e[r];
		i instanceof Function ? i = i.bind(t) : r == "handleDOMEvents" && (i = Yo(i, t, {})), n[r] = i;
	}
	return n;
}
var Xo = class {
	constructor(e) {
		this.spec = e, this.props = {}, e.props && Yo(e.props, this, this.props), this.key = e.key ? e.key.key : Qo("plugin");
	}
	getState(e) {
		return e[this.key];
	}
}, Zo = Object.create(null);
function Qo(e) {
	return e in Zo ? e + "$" + ++Zo[e] : (Zo[e] = 0, e + "$");
}
var $o = class {
	constructor(e = "key") {
		this.key = Qo(e);
	}
	get(e) {
		return e.config.pluginsByKey[this.key];
	}
	getState(e) {
		return e[this.key];
	}
}, es = function(e) {
	for (var t = 0;; t++) if (e = e.previousSibling, !e) return t;
}, ts = function(e) {
	let t = e.assignedSlot || e.parentNode;
	return t && t.nodeType == 11 ? t.host : t;
}, ns = null, rs = function(e, t, n) {
	let r = ns || (ns = document.createRange());
	return r.setEnd(e, n ?? e.nodeValue.length), r.setStart(e, t || 0), r;
}, is = function() {
	ns = null;
}, as = function(e, t, n, r) {
	return n && (cs(e, t, n, r, -1) || cs(e, t, n, r, 1));
}, ss = /^(img|br|input|textarea|hr)$/i;
function cs(e, t, n, r, i) {
	for (;;) {
		if (e == n && t == r) return !0;
		if (t == (i < 0 ? 0 : ls(e))) {
			let n = e.parentNode;
			if (!n || n.nodeType != 1 || ps(e) || ss.test(e.nodeName) || e.contentEditable == "false") return !1;
			t = es(e) + (i < 0 ? 0 : 1), e = n;
		} else if (e.nodeType == 1) {
			let n = e.childNodes[t + (i < 0 ? -1 : 0)];
			if (n.nodeType == 1 && n.contentEditable == "false") if (n.pmViewDesc?.ignoreForSelection) t += i;
			else return !1;
			else e = n, t = i < 0 ? ls(e) : 0;
		} else return !1;
	}
}
function ls(e) {
	return e.nodeType == 3 ? e.nodeValue.length : e.childNodes.length;
}
function us(e, t) {
	for (;;) {
		if (e.nodeType == 3 && t) return e;
		if (e.nodeType == 1 && t > 0) {
			if (e.contentEditable == "false") return null;
			e = e.childNodes[t - 1], t = ls(e);
		} else if (e.parentNode && !ps(e)) t = es(e), e = e.parentNode;
		else return null;
	}
}
function ds(e, t) {
	for (;;) {
		if (e.nodeType == 3 && t < e.nodeValue.length) return e;
		if (e.nodeType == 1 && t < e.childNodes.length) {
			if (e.contentEditable == "false") return null;
			e = e.childNodes[t], t = 0;
		} else if (e.parentNode && !ps(e)) t = es(e) + 1, e = e.parentNode;
		else return null;
	}
}
function fs(e, t, n) {
	for (let r = t == 0, i = t == ls(e); r || i;) {
		if (e == n) return !0;
		let t = es(e);
		if (e = e.parentNode, !e) return !1;
		r = r && t == 0, i = i && t == ls(e);
	}
}
function ps(e) {
	let t;
	for (let n = e; n && !(t = n.pmViewDesc); n = n.parentNode);
	return t && t.node && t.node.isBlock && (t.dom == e || t.contentDOM == e);
}
var ms = function(e) {
	return e.focusNode && as(e.focusNode, e.focusOffset, e.anchorNode, e.anchorOffset);
};
function hs(e, t) {
	let n = document.createEvent("Event");
	return n.initEvent("keydown", !0, !0), n.keyCode = e, n.key = n.code = t, n;
}
function gs(e) {
	let t = e.activeElement;
	for (; t && t.shadowRoot;) t = t.shadowRoot.activeElement;
	return t;
}
function _s(e, t, n) {
	if (e.caretPositionFromPoint) try {
		let r = e.caretPositionFromPoint(t, n);
		if (r) return {
			node: r.offsetNode,
			offset: Math.min(ls(r.offsetNode), r.offset)
		};
	} catch {}
	if (e.caretRangeFromPoint) {
		let r = e.caretRangeFromPoint(t, n);
		if (r) return {
			node: r.startContainer,
			offset: Math.min(ls(r.startContainer), r.startOffset)
		};
	}
}
var vs = typeof navigator < "u" ? navigator : null, ys = typeof document < "u" ? document : null, bs = vs && vs.userAgent || "", xs = /Edge\/(\d+)/.exec(bs), Ss = /MSIE \d/.exec(bs), Cs = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(bs), ws = !!(Ss || Cs || xs), Ts = Ss ? document.documentMode : Cs ? +Cs[1] : xs ? +xs[1] : 0, Es = !ws && /gecko\/(\d+)/i.test(bs);
Es && +(/Firefox\/(\d+)/.exec(bs) || [0, 0])[1];
var Ds = !ws && /Chrome\/(\d+)/.exec(bs), Os = !!Ds, ks = Ds ? +Ds[1] : 0, As = !ws && !!vs && /Apple Computer/.test(vs.vendor), js = As && (/Mobile\/\w+/.test(bs) || !!vs && vs.maxTouchPoints > 2), Ms = js || (vs ? /Mac/.test(vs.platform) : !1), Ns = vs ? /Win/.test(vs.platform) : !1, Ps = /Android \d/.test(bs), Fs = !!ys && "webkitFontSmoothing" in ys.documentElement.style, Is = Fs ? +(/\bAppleWebKit\/(\d+)/.exec(navigator.userAgent) || [0, 0])[1] : 0;
function Ls(e) {
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
function Rs(e, t) {
	return typeof e == "number" ? e : e[t];
}
function zs(e) {
	let t = e.getBoundingClientRect(), n = t.width / e.offsetWidth || 1, r = t.height / e.offsetHeight || 1;
	return {
		left: t.left,
		right: t.left + e.clientWidth * n,
		top: t.top,
		bottom: t.top + e.clientHeight * r
	};
}
function Bs(e, t, n) {
	let r = e.someProp("scrollThreshold") || 0, i = e.someProp("scrollMargin") || 5, a = e.dom.ownerDocument;
	for (let o = n || e.dom; o;) {
		if (o.nodeType != 1) {
			o = ts(o);
			continue;
		}
		let e = o, n = e == a.body, s = n ? Ls(a) : zs(e), c = 0, l = 0;
		if (t.top < s.top + Rs(r, "top") ? l = -(s.top - t.top + Rs(i, "top")) : t.bottom > s.bottom - Rs(r, "bottom") && (l = t.bottom - t.top > s.bottom - s.top ? t.top + Rs(i, "top") - s.top : t.bottom - s.bottom + Rs(i, "bottom")), t.left < s.left + Rs(r, "left") ? c = -(s.left - t.left + Rs(i, "left")) : t.right > s.right - Rs(r, "right") && (c = t.right - s.right + Rs(i, "right")), c || l) if (n) a.defaultView.scrollBy(c, l);
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
		o = u == "absolute" ? o.offsetParent : ts(o);
	}
}
function Vs(e) {
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
		stack: Hs(e.dom)
	};
}
function Hs(e) {
	let t = [], n = e.ownerDocument;
	for (let r = e; r && (t.push({
		dom: r,
		top: r.scrollTop,
		left: r.scrollLeft
	}), e != n); r = ts(r));
	return t;
}
function Us({ refDOM: e, refTop: t, stack: n }) {
	let r = e ? e.getBoundingClientRect().top : 0;
	Ws(n, r == 0 ? 0 : r - t);
}
function Ws(e, t) {
	for (let n = 0; n < e.length; n++) {
		let { dom: r, top: i, left: a } = e[n];
		r.scrollTop != i + t && (r.scrollTop = i + t), r.scrollLeft != a && (r.scrollLeft = a);
	}
}
var Gs = null;
function Ks(e) {
	if (e.setActive) return e.setActive();
	if (Gs) return e.focus(Gs);
	let t = Hs(e);
	e.focus(Gs == null ? { get preventScroll() {
		return Gs = { preventScroll: !0 }, !0;
	} } : void 0), Gs || (Gs = !1, Ws(t, 0));
}
function qs(e, t) {
	let n, r = 2e8, i, a = 0, o = t.top, s = t.top, c, l;
	for (let u = e.firstChild, d = 0; u; u = u.nextSibling, d++) {
		let e;
		if (u.nodeType == 1) e = u.getClientRects();
		else if (u.nodeType == 3) e = rs(u).getClientRects();
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
	return !n && c && (n = c, i = l, r = 0), n && n.nodeType == 3 ? Js(n, i) : !n || r && n.nodeType == 1 ? {
		node: e,
		offset: a
	} : qs(n, i);
}
function Js(e, t) {
	let n = e.nodeValue.length, r = document.createRange(), i;
	for (let a = 0; a < n; a++) {
		r.setEnd(e, a + 1), r.setStart(e, a);
		let n = nc(r, 1);
		if (n.top != n.bottom && Ys(t, n)) {
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
function Ys(e, t) {
	return e.left >= t.left - 1 && e.left <= t.right + 1 && e.top >= t.top - 1 && e.top <= t.bottom + 1;
}
function Xs(e, t) {
	let n = e.parentNode;
	return n && /^li$/i.test(n.nodeName) && t.left < e.getBoundingClientRect().left ? n : e;
}
function Zs(e, t, n) {
	let { node: r, offset: i } = qs(t, n), a = -1;
	if (r.nodeType == 1 && !r.firstChild) {
		let e = r.getBoundingClientRect();
		a = e.left != e.right && n.left > (e.left + e.right) / 2 ? 1 : -1;
	}
	return e.docView.posFromDOM(r, i, a);
}
function Qs(e, t, n, r) {
	let i = -1;
	for (let n = t, a = !1; n != e.dom;) {
		let t = e.docView.nearestDesc(n, !0), o;
		if (!t) return null;
		if (t.dom.nodeType == 1 && (t.node.isBlock && t.parent || !t.contentDOM) && ((o = t.dom.getBoundingClientRect()).width || o.height) && (t.node.isBlock && t.parent && !/^T(R|BODY|HEAD|FOOT)$/.test(t.dom.nodeName) && (!a && o.left > r.left || o.top > r.top ? i = t.posBefore : (!a && o.right < r.left || o.bottom < r.top) && (i = t.posAfter), a = !0), !t.contentDOM && i < 0 && !t.node.isText)) return (t.node.isBlock ? r.top < (o.top + o.bottom) / 2 : r.left < (o.left + o.right) / 2) ? t.posBefore : t.posAfter;
		n = t.dom.parentNode;
	}
	return i > -1 ? i : e.docView.posFromDOM(t, n, -1);
}
function $s(e, t, n) {
	let r = e.childNodes.length;
	if (r && n.top < n.bottom) for (let i = Math.max(0, Math.min(r - 1, Math.floor(r * (t.top - n.top) / (n.bottom - n.top)) - 2)), a = i;;) {
		let n = e.childNodes[a];
		if (n.nodeType == 1) {
			let e = n.getClientRects();
			for (let r = 0; r < e.length; r++) {
				let i = e[r];
				if (Ys(t, i)) return $s(n, t, i);
			}
		}
		if ((a = (a + 1) % r) == i) break;
	}
	return e;
}
function ec(e, t) {
	let n = e.dom.ownerDocument, r, i = 0, a = _s(n, t.left, t.top);
	a && ({node: r, offset: i} = a);
	let o = (e.root.elementFromPoint ? e.root : n).elementFromPoint(t.left, t.top), s;
	if (!o || !e.dom.contains(o.nodeType == 1 ? o : o.parentNode)) {
		let n = e.dom.getBoundingClientRect();
		if (!Ys(t, n) || (o = $s(e.dom, t, n), !o)) return null;
	}
	if (As) for (let e = o; r && e; e = ts(e)) e.draggable && (r = void 0);
	if (o = Xs(o, t), r) {
		if (Es && r.nodeType == 1 && (i = Math.min(i, r.childNodes.length), i < r.childNodes.length)) {
			let e = r.childNodes[i], n;
			e.nodeName == "IMG" && (n = e.getBoundingClientRect()).right <= t.left && n.bottom > t.top && i++;
		}
		let n;
		Fs && i && r.nodeType == 1 && (n = r.childNodes[i - 1]).nodeType == 1 && n.contentEditable == "false" && n.getBoundingClientRect().top >= t.top && i--, r == e.dom && i == r.childNodes.length - 1 && r.lastChild.nodeType == 1 && t.top > r.lastChild.getBoundingClientRect().bottom ? s = e.state.doc.content.size : (i == 0 || r.nodeType != 1 || r.childNodes[i - 1].nodeName != "BR") && (s = Qs(e, r, i, t));
	}
	s ?? (s = Zs(e, o, t));
	let c = e.docView.nearestDesc(o, !0);
	return {
		pos: s,
		inside: c ? c.posAtStart - c.border : -1
	};
}
function tc(e) {
	return e.top < e.bottom || e.left < e.right;
}
function nc(e, t) {
	let n = e.getClientRects();
	if (n.length) {
		let e = n[t < 0 ? 0 : n.length - 1];
		if (tc(e)) return e;
	}
	return Array.prototype.find.call(n, tc) || e.getBoundingClientRect();
}
var rc = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
function ic(e, t, n) {
	let { node: r, offset: i, atom: a } = e.docView.domFromPos(t, n < 0 ? -1 : 1), o = Fs || Es;
	if (r.nodeType == 3) if (o && (rc.test(r.nodeValue) || (n < 0 ? !i : i == r.nodeValue.length))) {
		let e = nc(rs(r, i, i), n);
		if (Es && i && /\s/.test(r.nodeValue[i - 1]) && i < r.nodeValue.length) {
			let t = nc(rs(r, i - 1, i - 1), -1);
			if (t.top == e.top) {
				let n = nc(rs(r, i, i + 1), -1);
				if (n.top != e.top) return ac(n, n.left < t.left);
			}
		}
		return e;
	} else {
		let e = i, t = i, a = n < 0 ? 1 : -1;
		return n < 0 && !i ? (t++, a = -1) : n >= 0 && i == r.nodeValue.length ? (e--, a = 1) : n < 0 ? e-- : t++, ac(nc(rs(r, e, t), a), a < 0);
	}
	if (!e.state.doc.resolve(t - (a || 0)).parent.inlineContent) {
		if (a == null && i && (n < 0 || i == ls(r))) {
			let e = r.childNodes[i - 1];
			if (e.nodeType == 1) return oc(e.getBoundingClientRect(), !1);
		}
		if (a == null && i < ls(r)) {
			let e = r.childNodes[i];
			if (e.nodeType == 1) return oc(e.getBoundingClientRect(), !0);
		}
		return oc(r.getBoundingClientRect(), n >= 0);
	}
	if (a == null && i && (n < 0 || i == ls(r))) {
		let e = r.childNodes[i - 1], t = e.nodeType == 3 ? rs(e, ls(e) - +!o) : e.nodeType == 1 && (e.nodeName != "BR" || !e.nextSibling) ? e : null;
		if (t) return ac(nc(t, 1), !1);
	}
	if (a == null && i < ls(r)) {
		let e = r.childNodes[i];
		for (; e.pmViewDesc && e.pmViewDesc.ignoreForCoords;) e = e.nextSibling;
		let t = e ? e.nodeType == 3 ? rs(e, 0, +!o) : e.nodeType == 1 ? e : null : null;
		if (t) return ac(nc(t, -1), !0);
	}
	return ac(nc(r.nodeType == 3 ? rs(r) : r, -n), n >= 0);
}
function ac(e, t) {
	if (e.width == 0) return e;
	let n = t ? e.left : e.right;
	return {
		top: e.top,
		bottom: e.bottom,
		left: n,
		right: n
	};
}
function oc(e, t) {
	if (e.height == 0) return e;
	let n = t ? e.top : e.bottom;
	return {
		top: n,
		bottom: n,
		left: e.left,
		right: e.right
	};
}
function sc(e, t, n) {
	let r = e.state, i = e.root.activeElement;
	r != t && e.updateState(t), i != e.dom && e.focus();
	try {
		return n();
	} finally {
		r != t && e.updateState(r), i != e.dom && i && i.focus();
	}
}
function cc(e, t, n) {
	let r = t.selection, i = n == "up" ? r.$from : r.$to;
	return sc(e, t, () => {
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
		let r = ic(e, i.pos, 1);
		for (let e = t.firstChild; e; e = e.nextSibling) {
			let t;
			if (e.nodeType == 1) t = e.getClientRects();
			else if (e.nodeType == 3) t = rs(e, 0, e.nodeValue.length).getClientRects();
			else continue;
			for (let e = 0; e < t.length; e++) {
				let i = t[e];
				if (i.bottom > i.top + 1 && (n == "up" ? r.top - i.top > (i.bottom - r.top) * 2 : i.bottom - r.bottom > (r.bottom - i.top) * 2)) return !1;
			}
		}
		return !0;
	});
}
var lc = /[\u0590-\u08ac]/;
function uc(e, t, n) {
	let { $head: r } = t.selection;
	if (!r.parent.isTextblock) return !1;
	let i = r.parentOffset, a = !i, o = i == r.parent.content.size, s = e.domSelection();
	return s ? !lc.test(r.parent.textContent) || !s.modify ? n == "left" || n == "backward" ? a : o : sc(e, t, () => {
		let { focusNode: t, focusOffset: i, anchorNode: a, anchorOffset: o } = e.domSelectionRange(), c = s.caretBidiLevel;
		s.modify("move", n, "character");
		let l = r.depth ? e.docView.domAfterPos(r.before()) : e.dom, { focusNode: u, focusOffset: d } = e.domSelectionRange(), f = u && !l.contains(u.nodeType == 1 ? u : u.parentNode) || t == u && i == d;
		try {
			s.collapse(a, o), t && (t != a || i != o) && s.extend && s.extend(t, i);
		} catch {}
		return c != null && (s.caretBidiLevel = c), f;
	}) : r.pos == r.start() || r.pos == r.end();
}
var dc = null, fc = null, pc = !1;
function mc(e, t, n) {
	return dc == t && fc == n ? pc : (dc = t, fc = n, pc = n == "up" || n == "down" ? cc(e, t, n) : uc(e, t, n));
}
var hc = 0, gc = 1, _c = 2, vc = 3, yc = class {
	constructor(e, t, n, r) {
		this.parent = e, this.children = t, this.dom = n, this.contentDOM = r, this.dirty = hc, n.pmViewDesc = this;
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
		if (e == this.dom && this.contentDOM) r = t > es(this.contentDOM);
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
			if (a > e || i instanceof Ec) {
				r = e - t;
				break;
			}
			t = a;
		}
		if (r) return this.children[n].domFromPos(r - this.children[n].border, t);
		for (let e; n && !(e = this.children[n - 1]).size && e instanceof bc && e.side >= 0; n--);
		if (t <= 0) {
			let e, r = !0;
			for (; e = n ? this.children[n - 1] : null, !(!e || e.dom.parentNode == this.contentDOM); n--, r = !1);
			return e && t && r && !e.border && !e.domAtom ? e.domFromPos(e.size, t) : {
				node: this.contentDOM,
				offset: e ? es(e.dom) + 1 : 0
			};
		} else {
			let e, r = !0;
			for (; e = n < this.children.length ? this.children[n] : null, !(!e || e.dom.parentNode == this.contentDOM); n++, r = !1);
			return e && r && !e.border && !e.domAtom ? e.domFromPos(0, t) : {
				node: this.contentDOM,
				offset: e ? es(e.dom) : this.contentDOM.childNodes.length
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
						r = es(n.dom) + 1;
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
						i = es(n.dom);
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
		if ((Es || As) && e == t) {
			let { node: e, offset: t } = o;
			if (e.nodeType == 3) {
				if (u = !!(t && e.nodeValue[t - 1] == "\n"), u && t == e.nodeValue.length) for (let t = e, n; t; t = t.parentNode) {
					if (n = t.nextSibling) {
						n.nodeName == "BR" && (o = s = {
							node: n.parentNode,
							offset: es(n) + 1
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
		if (Es && l.focusNode && l.focusNode != s.node && l.focusNode.nodeType == 1) {
			let e = l.focusNode.childNodes[l.focusOffset];
			e && e.contentEditable == "false" && (r = !0);
		}
		if (!(r || u && As) && as(o.node, o.offset, l.anchorNode, l.anchorOffset) && as(s.node, s.offset, l.focusNode, l.focusOffset)) return;
		let d = !1;
		if ((c.extend || e == t) && !(u && Es)) {
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
					this.dirty = e == n || t == a ? _c : gc, e == r && t == o && (i.contentLost || i.dom.parentNode != this.contentDOM) ? i.dirty = vc : i.markDirty(e - r, t - r);
					return;
				} else i.dirty = i.dom == i.contentDOM && i.dom.parentNode == this.contentDOM && !i.children.length ? _c : vc;
			}
			n = a;
		}
		this.dirty = _c;
	}
	markParentsDirty() {
		let e = 1;
		for (let t = this.parent; t; t = t.parent, e++) {
			let n = e == 1 ? _c : gc;
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
}, bc = class extends yc {
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
		return this.dirty == hc && e.type.eq(this.widget.type);
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
}, xc = class extends yc {
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
}, Sc = class e extends yc {
	constructor(e, t, n, r, i) {
		super(e, [], n, r), this.mark = t, this.spec = i;
	}
	static create(t, n, r, i) {
		let a = i.nodeViews[n.type.name], o = a && a(n, i, r);
		return (!o || !o.dom) && (o = da.renderSpec(document, n.type.spec.toDOM(n, r), null, n.attrs)), new e(t, n, o.dom, o.contentDOM || o.dom, o);
	}
	parseRule() {
		return this.dirty & vc || this.mark.type.spec.reparseInView ? null : {
			mark: this.mark.type.name,
			attrs: this.mark.attrs,
			contentElement: this.contentDOM
		};
	}
	matchesMark(e) {
		return this.dirty != vc && this.mark.eq(e);
	}
	markDirty(e, t) {
		if (super.markDirty(e, t), this.dirty != hc) {
			let e = this.parent;
			for (; !e.node;) e = e.parent;
			e.dirty < this.dirty && (e.dirty = this.dirty), this.dirty = hc;
		}
	}
	slice(t, n, r) {
		let i = e.create(this.parent, this.mark, !0, r), a = this.children, o = this.size;
		n < o && (a = Uc(a, n, o, r)), t > 0 && (a = Uc(a, 0, t, r));
		for (let e = 0; e < a.length; e++) a[e].parent = i;
		return i.children = a, i;
	}
	ignoreMutation(e) {
		return this.spec.ignoreMutation ? this.spec.ignoreMutation(e) : super.ignoreMutation(e);
	}
	destroy() {
		this.spec.destroy && this.spec.destroy(), super.destroy();
	}
}, Cc = class e extends yc {
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
			let e = da.renderSpec(document, n.type.spec.toDOM(n), null, n.attrs);
			({dom: u, contentDOM: d} = e);
		}
		!d && !n.isText && u.nodeName != "BR" && (u.hasAttribute("contenteditable") || (u.contentEditable = "false"), n.type.spec.draggable && (u.draggable = !0));
		let f = u;
		return u = Pc(u, r, n), l ? c = new Dc(t, n, r, i, u, d || null, f, l, a, o + 1) : n.isText ? new Tc(t, n, r, i, u, f, a) : new e(t, n, r, i, u, d || null, f, a, o + 1);
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
			e.contentElement || (e.getContent = () => M.empty);
		}
		return e;
	}
	matchesNode(e, t, n) {
		return this.dirty == hc && e.eq(this.node) && Fc(t, this.outerDeco) && n.eq(this.innerDeco);
	}
	get size() {
		return this.node.nodeSize;
	}
	get border() {
		return +!this.node.isLeaf;
	}
	updateChildren(e, t) {
		let n = this.node.inlineContent, r = t, i = e.composing ? this.localCompositionInfo(e, t) : null, a = i && i.pos > -1 ? i : null, o = i && i.pos < 0, s = new Lc(this, a && a.node, e);
		Bc(this.node, this.innerDeco, (t, i, a) => {
			t.spec.marks ? s.syncToMarks(t.spec.marks, n, e, i) : t.type.side >= 0 && !a && s.syncToMarks(i == this.node.childCount ? N.none : this.node.child(i).marks, n, e, i), s.placeWidget(t, e, r);
		}, (t, a, c, l) => {
			s.syncToMarks(t.marks, n, e, l);
			let u;
			s.findNodeMatch(t, a, c, l) || o && e.state.selection.from > r && e.state.selection.to < r + t.nodeSize && (u = s.findIndexWithChild(i.node)) > -1 && s.updateNodeAt(t, a, c, u, e) || s.updateNextNode(t, a, c, e, l, r) || s.addNode(t, a, c, e, r), r += t.nodeSize;
		}), s.syncToMarks([], n, e, 0), this.node.isTextblock && s.addTextblockHacks(), s.destroyRest(), (s.changed || this.dirty == _c) && (a && this.protectLocalComposition(e, a), Oc(this.contentDOM, this.children, e), js && Vc(this.dom));
	}
	localCompositionInfo(e, t) {
		let { from: n, to: r } = e.state.selection;
		if (!(e.state.selection instanceof z) || n < t || r > t + this.node.content.size) return null;
		let i = e.input.compositionNode;
		if (!i || !this.dom.contains(i.parentNode)) return null;
		if (this.node.inlineContent) {
			let e = i.nodeValue, a = Hc(this.node.content, e, n - t, r - t);
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
		let a = new xc(this, i, t, r);
		e.input.compositionNodes.push(a), this.children = Uc(this.children, n, n + r.length, e, a);
	}
	update(e, t, n, r) {
		return this.dirty == vc || !e.sameMarkup(this.node) ? !1 : (this.updateInner(e, t, n, r), !0);
	}
	updateInner(e, t, n, r) {
		this.updateOuterDeco(t), this.node = e, this.innerDeco = n, this.contentDOM && this.updateChildren(r, this.posAtStart), this.dirty = hc;
	}
	updateOuterDeco(e) {
		if (Fc(e, this.outerDeco)) return;
		let t = this.nodeDOM.nodeType != 1, n = this.dom;
		this.dom = Mc(this.dom, this.nodeDOM, jc(this.outerDeco, this.node, t), jc(e, this.node, t)), this.dom != n && (n.pmViewDesc = void 0, this.dom.pmViewDesc = this), this.outerDeco = e;
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
function wc(e, t, n, r, i) {
	Pc(r, t, e);
	let a = new Cc(void 0, e, t, n, r, r, r, i, 0);
	return a.contentDOM && a.updateChildren(i, 0), a;
}
var Tc = class e extends Cc {
	constructor(e, t, n, r, i, a, o) {
		super(e, t, n, r, i, null, a, o, 0);
	}
	parseRule() {
		let e = this.nodeDOM.parentNode;
		for (; e && e != this.dom && !e.pmIsDeco;) e = e.parentNode;
		return { skip: e || !0 };
	}
	update(e, t, n, r) {
		return this.dirty == vc || this.dirty != hc && !this.inParent() || !e.sameMarkup(this.node) ? !1 : (this.updateOuterDeco(t), (this.dirty != hc || e.text != this.node.text) && e.text != this.nodeDOM.nodeValue && (this.nodeDOM.nodeValue = e.text, r.trackWrites == this.nodeDOM && (r.trackWrites = null)), this.node = e, this.dirty = hc, !0);
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
		super.markDirty(e, t), this.dom != this.nodeDOM && (e == 0 || t == this.nodeDOM.nodeValue.length) && (this.dirty = vc);
	}
	get domAtom() {
		return !1;
	}
	isText(e) {
		return this.node.text == e;
	}
}, Ec = class extends yc {
	parseRule() {
		return { ignore: !0 };
	}
	matchesHack(e) {
		return this.dirty == hc && this.dom.nodeName == e;
	}
	get domAtom() {
		return !0;
	}
	get ignoreForCoords() {
		return this.dom.nodeName == "IMG";
	}
}, Dc = class extends Cc {
	constructor(e, t, n, r, i, a, o, s, c, l) {
		super(e, t, n, r, i, a, o, c, l), this.spec = s;
	}
	update(e, t, n, r) {
		if (this.dirty == vc) return !1;
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
function Oc(e, t, n) {
	let r = e.firstChild, i = !1;
	for (let a = 0; a < t.length; a++) {
		let o = t[a], s = o.dom;
		if (s.parentNode == e) {
			for (; s != r;) r = Ic(r), i = !0;
			r = r.nextSibling;
		} else i = !0, e.insertBefore(s, r);
		if (o instanceof Sc) {
			let t = r ? r.previousSibling : e.lastChild;
			Oc(o.contentDOM, o.children, n), r = t ? t.nextSibling : e.firstChild;
		}
	}
	for (; r;) r = Ic(r), i = !0;
	i && n.trackWrites == e && (n.trackWrites = null);
}
var kc = function(e) {
	e && (this.nodeName = e);
};
kc.prototype = Object.create(null);
var Ac = [new kc()];
function jc(e, t, n) {
	if (e.length == 0) return Ac;
	let r = n ? Ac[0] : new kc(), i = [r];
	for (let a = 0; a < e.length; a++) {
		let o = e[a].type.attrs;
		if (o) {
			o.nodeName && i.push(r = new kc(o.nodeName));
			for (let e in o) {
				let a = o[e];
				a != null && (n && i.length == 1 && i.push(r = new kc(t.isInline ? "span" : "div")), e == "class" ? r.class = (r.class ? r.class + " " : "") + a : e == "style" ? r.style = (r.style ? r.style + ";" : "") + a : e != "nodeName" && (r[e] = a));
			}
		}
	}
	return i;
}
function Mc(e, t, n, r) {
	if (n == Ac && r == Ac) return t;
	let i = t;
	for (let t = 0; t < r.length; t++) {
		let a = r[t], o = n[t];
		if (t) {
			let t;
			o && o.nodeName == a.nodeName && i != e && (t = i.parentNode) && t.nodeName.toLowerCase() == a.nodeName ? i = t : (t = document.createElement(a.nodeName), t.pmIsDeco = !0, t.appendChild(i), o = Ac[0], i = t);
		}
		Nc(i, o || Ac[0], a);
	}
	return i;
}
function Nc(e, t, n) {
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
function Pc(e, t, n) {
	return Mc(e, e, Ac, jc(t, n, e.nodeType != 1));
}
function Fc(e, t) {
	if (e.length != t.length) return !1;
	for (let n = 0; n < e.length; n++) if (!e[n].type.eq(t[n].type)) return !1;
	return !0;
}
function Ic(e) {
	let t = e.nextSibling;
	return e.parentNode.removeChild(e), t;
}
var Lc = class {
	constructor(e, t, n) {
		this.lock = t, this.view = n, this.index = 0, this.stack = [], this.changed = !1, this.top = e, this.preMatch = Rc(e.node.content, e);
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
		for (; i < a;) this.destroyRest(), this.top.dirty = hc, this.index = this.stack.pop(), this.top = this.stack.pop(), a--;
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
				let r = Sc.create(this.top, e[a], t, n);
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
		return a.dirty == vc && a.dom == a.contentDOM && (a.dirty = _c), a.update(e, t, n, i) ? (this.destroyBetween(this.index, r), this.index++, !0) : !1;
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
			if (s instanceof Cc) {
				let c = this.preMatch.matched.get(s);
				if (c != null && c != i) return !1;
				let l = s.dom, u, d = this.isLocked(l) && !(e.isText && s.node && s.node.isText && s.nodeDOM.nodeValue == e.text && s.dirty != vc && Fc(t, s.outerDeco));
				if (!d && s.update(e, t, n, r)) return this.destroyBetween(this.index, o), s.dom != l && (this.changed = !0), this.index++, !0;
				if (!d && (u = this.recreateWrapper(s, e, t, n, r, a))) return this.destroyBetween(this.index, o), this.top.children[this.index] = u, u.contentDOM && (u.dirty = _c, u.updateChildren(r, a + 1), u.dirty = hc), this.changed = !0, this.index++, !0;
				break;
			}
		}
		return !1;
	}
	recreateWrapper(e, t, n, r, i, a) {
		if (e.dirty || t.isAtom || !e.children.length || !e.node.content.eq(t.content) || !Fc(n, e.outerDeco) || !r.eq(e.innerDeco)) return null;
		let o = Cc.create(this.top, t, n, r, i, a);
		if (o.contentDOM) {
			o.children = e.children, e.children = [];
			for (let e of o.children) e.parent = o;
		}
		return e.destroy(), o;
	}
	addNode(e, t, n, r, i) {
		let a = Cc.create(this.top, e, t, n, r, i);
		a.contentDOM && a.updateChildren(r, i + 1), this.top.children.splice(this.index++, 0, a), this.changed = !0;
	}
	placeWidget(e, t, n) {
		let r = this.index < this.top.children.length ? this.top.children[this.index] : null;
		if (r && r.matchesWidget(e) && (e == r.widget || !r.widget.type.toDOM.parentNode)) this.index++;
		else {
			let r = new bc(this.top, e, t, n);
			this.top.children.splice(this.index++, 0, r), this.changed = !0;
		}
	}
	addTextblockHacks() {
		let e = this.top.children[this.index - 1], t = this.top;
		for (; e instanceof Sc;) t = e, e = t.children[t.children.length - 1];
		(!e || !(e instanceof Tc) || /\n$/.test(e.node.text) || this.view.requiresGeckoHackNode && /\s$/.test(e.node.text)) && ((As || Os) && e && e.dom.contentEditable == "false" && this.addHackNode("IMG", t), this.addHackNode("BR", this.top));
	}
	addHackNode(e, t) {
		if (t == this.top && this.index < t.children.length && t.children[this.index].matchesHack(e)) this.index++;
		else {
			let n = document.createElement(e);
			e == "IMG" && (n.className = "ProseMirror-separator", n.alt = ""), e == "BR" && (n.className = "ProseMirror-trailingBreak");
			let r = new Ec(this.top, [], n, null);
			t == this.top ? t.children.splice(this.index++, 0, r) : t.children.push(r), this.changed = !0;
		}
	}
	isLocked(e) {
		return this.lock && (e == this.lock || e.nodeType == 1 && e.contains(this.lock.parentNode));
	}
};
function Rc(e, t) {
	let n = t, r = n.children.length, i = e.childCount, a = /* @__PURE__ */ new Map(), o = [];
	outer: for (; i > 0;) {
		let s;
		for (;;) if (r) {
			let e = n.children[r - 1];
			if (e instanceof Sc) n = e, r = e.children.length;
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
function zc(e, t) {
	return e.type.side - t.type.side;
}
function Bc(e, t, n, r) {
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
			d.sort(zc);
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
function Vc(e) {
	if (e.nodeName == "UL" || e.nodeName == "OL") {
		let t = e.style.cssText;
		e.style.cssText = t + "; list-style: square !important", window.getComputedStyle(e).listStyle, e.style.cssText = t;
	}
}
function Hc(e, t, n, r) {
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
function Uc(e, t, n, r, i) {
	let a = [];
	for (let o = 0, s = 0; o < e.length; o++) {
		let c = e[o], l = s, u = s += c.size;
		l >= n || u <= t ? a.push(c) : (l < t && a.push(c.slice(0, t - l, r)), i && (a.push(i), i = void 0), u > n && a.push(c.slice(n - l, c.size, r)));
	}
	return a;
}
function Wc(e, t = null) {
	let n = e.domSelectionRange(), r = e.state.doc;
	if (!n.focusNode) return null;
	let i = e.docView.nearestDesc(n.focusNode), a = i && i.size == 0, o = e.docView.posFromDOM(n.focusNode, n.focusOffset, 1);
	if (o < 0) return null;
	let s = r.resolve(o), c, l;
	if (ms(n)) {
		for (c = o; i && !i.node;) i = i.parent;
		let e = i.node;
		if (i && e.isAtom && B.isSelectable(e) && i.parent && !(e.isInline && fs(n.focusNode, n.focusOffset, i.dom))) {
			let e = i.posBefore;
			l = new B(o == e ? s : r.resolve(e));
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
		l = tl(e, u, s, n);
	}
	return l;
}
function Gc(e) {
	return e.editable ? e.hasFocus() : rl(e) && document.activeElement && document.activeElement.contains(e.dom);
}
function Kc(e, t = !1) {
	let n = e.state.selection;
	if ($c(e, n), Gc(e)) {
		if (!t && e.input.mouseDown && e.input.mouseDown.allowDefault && Os) {
			let t = e.domSelectionRange(), n = e.domObserver.currentSelection;
			if (t.anchorNode && n.anchorNode && as(t.anchorNode, t.anchorOffset, n.anchorNode, n.anchorOffset)) {
				e.input.mouseDown.delayedSelectionSync = !0, e.domObserver.setCurSelection();
				return;
			}
		}
		if (e.domObserver.disconnectSelection(), e.cursorWrapper) Qc(e);
		else {
			let { anchor: r, head: i } = n, a, o;
			qc && !(n instanceof z) && (n.$from.parent.inlineContent || (a = Jc(e, n.from)), !n.empty && !n.$from.parent.inlineContent && (o = Jc(e, n.to))), e.docView.setSelection(r, i, e, t), qc && (a && Xc(a), o && Xc(o)), n.visible ? e.dom.classList.remove("ProseMirror-hideselection") : (e.dom.classList.add("ProseMirror-hideselection"), "onselectionchange" in document && Zc(e));
		}
		e.domObserver.setCurSelection(), e.domObserver.connectSelection();
	}
}
var qc = As || Os && ks < 63;
function Jc(e, t) {
	let { node: n, offset: r } = e.docView.domFromPos(t, 0), i = r < n.childNodes.length ? n.childNodes[r] : null, a = r ? n.childNodes[r - 1] : null;
	if (As && i && i.contentEditable == "false") return Yc(i);
	if ((!i || i.contentEditable == "false") && (!a || a.contentEditable == "false")) {
		if (i) return Yc(i);
		if (a) return Yc(a);
	}
}
function Yc(e) {
	return e.contentEditable = "true", As && e.draggable && (e.draggable = !1, e.wasDraggable = !0), e;
}
function Xc(e) {
	e.contentEditable = "false", e.wasDraggable && (e.draggable = !0, e.wasDraggable = null);
}
function Zc(e) {
	let t = e.dom.ownerDocument;
	t.removeEventListener("selectionchange", e.input.hideSelectionGuard);
	let n = e.domSelectionRange(), r = n.anchorNode, i = n.anchorOffset;
	t.addEventListener("selectionchange", e.input.hideSelectionGuard = () => {
		(n.anchorNode != r || n.anchorOffset != i) && (t.removeEventListener("selectionchange", e.input.hideSelectionGuard), setTimeout(() => {
			(!Gc(e) || e.state.selection.visible) && e.dom.classList.remove("ProseMirror-hideselection");
		}, 20));
	});
}
function Qc(e) {
	let t = e.domSelection();
	if (!t) return;
	let n = e.cursorWrapper.dom, r = n.nodeName == "IMG";
	r ? t.collapse(n.parentNode, es(n) + 1) : t.collapse(n, 0), !r && !e.state.selection.visible && ws && Ts <= 11 && (n.disabled = !0, n.disabled = !1);
}
function $c(e, t) {
	if (t instanceof B) {
		let n = e.docView.descAt(t.from);
		n != e.lastSelectedViewDesc && (el(e), n && n.selectNode(), e.lastSelectedViewDesc = n);
	} else el(e);
}
function el(e) {
	e.lastSelectedViewDesc && (e.lastSelectedViewDesc.parent && e.lastSelectedViewDesc.deselectNode(), e.lastSelectedViewDesc = void 0);
}
function tl(e, t, n, r) {
	return e.someProp("createSelectionBetween", (r) => r(e, t, n)) || z.between(t, n, r);
}
function nl(e) {
	return e.editable && !e.hasFocus() ? !1 : rl(e);
}
function rl(e) {
	let t = e.domSelectionRange();
	if (!t.anchorNode) return !1;
	try {
		return e.dom.contains(t.anchorNode.nodeType == 3 ? t.anchorNode.parentNode : t.anchorNode) && (e.editable || e.dom.contains(t.focusNode.nodeType == 3 ? t.focusNode.parentNode : t.focusNode));
	} catch {
		return !1;
	}
}
function il(e) {
	let t = e.docView.domFromPos(e.state.selection.anchor, 0), n = e.domSelectionRange();
	return as(t.node, t.offset, n.anchorNode, n.anchorOffset);
}
function al(e, t) {
	let { $anchor: n, $head: r } = e.selection, i = t > 0 ? n.max(r) : n.min(r), a = i.parent.inlineContent ? i.depth ? e.doc.resolve(t > 0 ? i.after() : i.before()) : null : i;
	return a && R.findFrom(a, t);
}
function V(e, t) {
	return e.dispatch(e.state.tr.setSelection(t).scrollIntoView()), !0;
}
function ol(e, t, n) {
	let r = e.state.selection;
	if (r instanceof z) {
		if (n.indexOf("s") > -1) {
			let { $head: n } = r, i = n.textOffset ? null : t < 0 ? n.nodeBefore : n.nodeAfter;
			if (!i || i.isText || !i.isLeaf) return !1;
			let a = e.state.doc.resolve(n.pos + i.nodeSize * (t < 0 ? -1 : 1));
			return V(e, new z(r.$anchor, a));
		} else if (!r.empty) return !1;
		else if (e.endOfTextblock(t > 0 ? "forward" : "backward")) {
			let n = al(e.state, t);
			return n && n instanceof B ? V(e, n) : !1;
		} else if (!(Ms && n.indexOf("m") > -1)) {
			let n = r.$head, i = n.textOffset ? null : t < 0 ? n.nodeBefore : n.nodeAfter, a;
			if (!i || i.isText) return !1;
			let o = t < 0 ? n.pos - i.nodeSize : n.pos;
			return i.isAtom || (a = e.docView.descAt(o)) && !a.contentDOM ? B.isSelectable(i) ? V(e, new B(t < 0 ? e.state.doc.resolve(n.pos - i.nodeSize) : n)) : Fs ? V(e, new z(e.state.doc.resolve(t < 0 ? o : o + i.nodeSize))) : !1 : !1;
		}
	} else if (r instanceof B && r.node.isInline) return V(e, new z(t > 0 ? r.$to : r.$from));
	else {
		let n = al(e.state, t);
		return n ? V(e, n) : !1;
	}
}
function sl(e) {
	return e.nodeType == 3 ? e.nodeValue.length : e.childNodes.length;
}
function cl(e, t) {
	let n = e.pmViewDesc;
	return n && n.size == 0 && (t < 0 || e.nextSibling || e.nodeName != "BR");
}
function ll(e, t) {
	return t < 0 ? ul(e) : dl(e);
}
function ul(e) {
	let t = e.domSelectionRange(), n = t.focusNode, r = t.focusOffset;
	if (!n) return;
	let i, a, o = !1;
	for (Es && n.nodeType == 1 && r < sl(n) && cl(n.childNodes[r], -1) && (o = !0);;) if (r > 0) {
		if (n.nodeType != 1) break;
		{
			let e = n.childNodes[r - 1];
			if (cl(e, -1)) i = n, a = --r;
			else if (e.nodeType == 3) n = e, r = n.nodeValue.length;
			else break;
		}
	} else if (fl(n)) break;
	else {
		let t = n.previousSibling;
		for (; t && cl(t, -1);) i = n.parentNode, a = es(t), t = t.previousSibling;
		if (t) n = t, r = sl(n);
		else {
			if (n = n.parentNode, n == e.dom) break;
			r = 0;
		}
	}
	o ? hl(e, n, r) : i && hl(e, i, a);
}
function dl(e) {
	let t = e.domSelectionRange(), n = t.focusNode, r = t.focusOffset;
	if (!n) return;
	let i = sl(n), a, o;
	for (;;) if (r < i) {
		if (n.nodeType != 1) break;
		let e = n.childNodes[r];
		if (cl(e, 1)) a = n, o = ++r;
		else break;
	} else if (fl(n)) break;
	else {
		let t = n.nextSibling;
		for (; t && cl(t, 1);) a = t.parentNode, o = es(t) + 1, t = t.nextSibling;
		if (t) n = t, r = 0, i = sl(n);
		else {
			if (n = n.parentNode, n == e.dom) break;
			r = i = 0;
		}
	}
	a && hl(e, a, o);
}
function fl(e) {
	let t = e.pmViewDesc;
	return t && t.node && t.node.isBlock;
}
function pl(e, t) {
	for (; e && t == e.childNodes.length && !ps(e);) t = es(e) + 1, e = e.parentNode;
	for (; e && t < e.childNodes.length;) {
		let n = e.childNodes[t];
		if (n.nodeType == 3) return n;
		if (n.nodeType == 1 && n.contentEditable == "false") break;
		e = n, t = 0;
	}
}
function ml(e, t) {
	for (; e && !t && !ps(e);) t = es(e), e = e.parentNode;
	for (; e && t;) {
		let n = e.childNodes[t - 1];
		if (n.nodeType == 3) return n;
		if (n.nodeType == 1 && n.contentEditable == "false") break;
		e = n, t = e.childNodes.length;
	}
}
function hl(e, t, n) {
	if (t.nodeType != 3) {
		let e, r;
		(r = pl(t, n)) ? (t = r, n = 0) : (e = ml(t, n)) && (t = e, n = e.nodeValue.length);
	}
	let r = e.domSelection();
	if (!r) return;
	if (ms(r)) {
		let e = document.createRange();
		e.setEnd(t, n), e.setStart(t, n), r.removeAllRanges(), r.addRange(e);
	} else r.extend && r.extend(t, n);
	e.domObserver.setCurSelection();
	let { state: i } = e;
	setTimeout(() => {
		e.state == i && Kc(e);
	}, 50);
}
function gl(e, t) {
	let n = e.state.doc.resolve(t);
	if (!(Os || Ns) && n.parent.inlineContent) {
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
function _l(e, t, n) {
	let r = e.state.selection;
	if (r instanceof z && !r.empty || n.indexOf("s") > -1 || Ms && n.indexOf("m") > -1) return !1;
	let { $from: i, $to: a } = r;
	if (!i.parent.inlineContent || e.endOfTextblock(t < 0 ? "up" : "down")) {
		let n = al(e.state, t);
		if (n && n instanceof B) return V(e, n);
	}
	if (!i.parent.inlineContent) {
		let n = t < 0 ? i : a, o = r instanceof Io ? R.near(n, t) : R.findFrom(n, t);
		return o ? V(e, o) : !1;
	}
	return !1;
}
function vl(e, t) {
	if (!(e.state.selection instanceof z)) return !0;
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
function yl(e, t, n) {
	e.domObserver.stop(), t.contentEditable = n, e.domObserver.start();
}
function bl(e) {
	if (!As || e.state.selection.$head.parentOffset > 0) return !1;
	let { focusNode: t, focusOffset: n } = e.domSelectionRange();
	if (t && t.nodeType == 1 && n == 0 && t.firstChild && t.firstChild.contentEditable == "false") {
		let n = t.firstChild;
		yl(e, n, "true"), setTimeout(() => yl(e, n, "false"), 20);
	}
	return !1;
}
function xl(e) {
	let t = "";
	return e.ctrlKey && (t += "c"), e.metaKey && (t += "m"), e.altKey && (t += "a"), e.shiftKey && (t += "s"), t;
}
function Sl(e, t) {
	let n = t.keyCode, r = xl(t);
	if (n == 8 || Ms && n == 72 && r == "c") return vl(e, -1) || ll(e, -1);
	if (n == 46 && !t.shiftKey || Ms && n == 68 && r == "c") return vl(e, 1) || ll(e, 1);
	if (n == 13 || n == 27) return !0;
	if (n == 37 || Ms && n == 66 && r == "c") {
		let t = n == 37 ? gl(e, e.state.selection.from) == "ltr" ? -1 : 1 : -1;
		return ol(e, t, r) || ll(e, t);
	} else if (n == 39 || Ms && n == 70 && r == "c") {
		let t = n == 39 ? gl(e, e.state.selection.from) == "ltr" ? 1 : -1 : 1;
		return ol(e, t, r) || ll(e, t);
	} else if (n == 38 || Ms && n == 80 && r == "c") return _l(e, -1, r) || ll(e, -1);
	else if (n == 40 || Ms && n == 78 && r == "c") return bl(e) || _l(e, 1, r) || ll(e, 1);
	else if (r == (Ms ? "m" : "c") && (n == 66 || n == 73 || n == 89 || n == 90)) return !0;
	return !1;
}
function Cl(e, t) {
	e.someProp("transformCopied", (n) => {
		t = n(t, e);
	});
	let n = [], { content: r, openStart: i, openEnd: a } = t;
	for (; i > 1 && a > 1 && r.childCount == 1 && r.firstChild.childCount == 1;) {
		i--, a--;
		let e = r.firstChild;
		n.push(e.type.name, e.attrs == e.type.defaultAttrs ? null : e.attrs), r = e.content;
	}
	let o = e.someProp("clipboardSerializer") || da.fromSchema(e.state.schema), s = Pl(), c = s.createElement("div");
	c.appendChild(o.serializeFragment(r, { document: s }));
	let l = c.firstChild, u, d = 0;
	for (; l && l.nodeType == 1 && (u = Ml[l.nodeName.toLowerCase()]);) {
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
function wl(e, t, n, r, i) {
	let a = i.parent.type.spec.code, o, s;
	if (!n && !t) return null;
	let c = !!t && (r || a || !n);
	if (c) {
		if (e.someProp("transformPastedText", (n) => {
			t = n(t, a || r, e);
		}), a) return s = new P(M.from(e.state.schema.text(t.replace(/\r\n?/g, "\n"))), 0, 0), e.someProp("transformPasted", (t) => {
			s = t(s, e, !0);
		}), s;
		let n = e.someProp("clipboardTextParser", (n) => n(t, i, r, e));
		if (n) s = n;
		else {
			let n = i.marks(), { schema: r } = e.state, a = da.fromSchema(r);
			o = document.createElement("div"), t.split(/(?:\r\n?|\n)+/).forEach((e) => {
				let t = o.appendChild(document.createElement("p"));
				e && t.appendChild(a.serializeNode(r.text(e, n)));
			});
		}
	} else e.someProp("transformPastedHTML", (t) => {
		n = t(n, e);
	}), o = Ll(n), Fs && Rl(o);
	let l = o && o.querySelector("[data-pm-slice]"), u = l && /^(\d+) (\d+)(?: -(\d+))? (.*)/.exec(l.getAttribute("data-pm-slice") || "");
	if (u && u[3]) for (let e = +u[3]; e > 0; e--) {
		let e = o.firstChild;
		for (; e && e.nodeType != 1;) e = e.nextSibling;
		if (!e) break;
		o = e;
	}
	if (s || (s = (e.someProp("clipboardParser") || e.someProp("domParser") || Zi.fromSchema(e.state.schema)).parseSlice(o, {
		preserveWhitespace: !!(c || u),
		context: i,
		ruleFromNode(e) {
			return e.nodeName == "BR" && !e.nextSibling && e.parentNode && !Tl.test(e.parentNode.nodeName) ? { ignore: !0 } : null;
		}
	})), u) s = zl(jl(s, +u[1], +u[2]), u[4]);
	else if (s = P.maxOpen(El(s.content, i), !0), s.openStart || s.openEnd) {
		let e = 0, t = 0;
		for (let t = s.content.firstChild; e < s.openStart && !t.type.spec.isolating; e++, t = t.firstChild);
		for (let e = s.content.lastChild; t < s.openEnd && !e.type.spec.isolating; t++, e = e.lastChild);
		s = jl(s, e, t);
	}
	return e.someProp("transformPasted", (t) => {
		s = t(s, e, c);
	}), s;
}
var Tl = /^(a|abbr|acronym|b|cite|code|del|em|i|ins|kbd|label|output|q|ruby|s|samp|span|strong|sub|sup|time|u|tt|var)$/i;
function El(e, t) {
	if (e.childCount < 2) return e;
	for (let n = t.depth; n >= 0; n--) {
		let r = t.node(n).contentMatchAt(t.index(n)), i, a = [];
		if (e.forEach((e) => {
			if (!a) return;
			let t = r.findWrapping(e.type), n;
			if (!t) return a = null;
			if (n = a.length && i.length && Ol(t, i, e, a[a.length - 1], 0)) a[a.length - 1] = n;
			else {
				a.length && (a[a.length - 1] = kl(a[a.length - 1], i.length));
				let n = Dl(e, t);
				a.push(n), r = r.matchType(n.type), i = t;
			}
		}), a) return M.from(a);
	}
	return e;
}
function Dl(e, t, n = 0) {
	for (let r = t.length - 1; r >= n; r--) e = t[r].create(null, M.from(e));
	return e;
}
function Ol(e, t, n, r, i) {
	if (i < e.length && i < t.length && e[i] == t[i]) {
		let a = Ol(e, t, n, r.lastChild, i + 1);
		if (a) return r.copy(r.content.replaceChild(r.childCount - 1, a));
		if (r.contentMatchAt(r.childCount).matchType(i == e.length - 1 ? n.type : e[i + 1])) return r.copy(r.content.append(M.from(Dl(n, e, i + 1))));
	}
}
function kl(e, t) {
	if (t == 0) return e;
	let n = e.content.replaceChild(e.childCount - 1, kl(e.lastChild, t - 1)), r = e.contentMatchAt(e.childCount).fillBefore(M.empty, !0);
	return e.copy(n.append(r));
}
function Al(e, t, n, r, i, a) {
	let o = t < 0 ? e.firstChild : e.lastChild, s = o.content;
	return e.childCount > 1 && (a = 0), i < r - 1 && (s = Al(s, t, n, r, i + 1, a)), i >= n && (s = t < 0 ? o.contentMatchAt(0).fillBefore(s, a <= i).append(s) : s.append(o.contentMatchAt(o.childCount).fillBefore(M.empty, !0))), e.replaceChild(t < 0 ? 0 : e.childCount - 1, o.copy(s));
}
function jl(e, t, n) {
	return t < e.openStart && (e = new P(Al(e.content, -1, t, e.openStart, 0, e.openEnd), t, e.openEnd)), n < e.openEnd && (e = new P(Al(e.content, 1, n, e.openEnd, 0, 0), e.openStart, n)), e;
}
var Ml = {
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
}, Nl = null;
function Pl() {
	return Nl || (Nl = document.implementation.createHTMLDocument("title"));
}
var Fl = null;
function Il(e) {
	let t = window.trustedTypes;
	return t ? (Fl || (Fl = t.defaultPolicy || t.createPolicy("ProseMirrorClipboard", { createHTML: (e) => e })), Fl.createHTML(e)) : e;
}
function Ll(e) {
	let t = /^(\s*<meta [^>]*>)*/.exec(e);
	t && (e = e.slice(t[0].length));
	let n = Pl().createElement("div"), r = /<([a-z][^>\s]+)/i.exec(e), i;
	if ((i = r && Ml[r[1].toLowerCase()]) && (e = i.map((e) => "<" + e + ">").join("") + e + i.map((e) => "</" + e + ">").reverse().join("")), n.innerHTML = Il(e), i) for (let e = 0; e < i.length; e++) n = n.querySelector(i[e]) || n;
	return n;
}
function Rl(e) {
	let t = e.querySelectorAll(Os ? "span:not([class]):not([style])" : "span.Apple-converted-space");
	for (let n = 0; n < t.length; n++) {
		let r = t[n];
		r.childNodes.length == 1 && r.textContent == "\xA0" && r.parentNode && r.parentNode.replaceChild(e.ownerDocument.createTextNode(" "), r);
	}
}
function zl(e, t) {
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
		i = M.from(t.create(r[e + 1], i)), a++, o++;
	}
	return new P(i, a, o);
}
var Bl = {}, Vl = {}, Hl = {
	touchstart: !0,
	touchmove: !0
}, Ul = class {
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
function H(e) {
	for (let t in Bl) {
		let n = Bl[t];
		e.dom.addEventListener(t, e.input.eventHandlers[t] = (t) => {
			Wl(e, t) && !K(e, t) && (e.editable || !(t.type in Vl)) && n(e, t);
		}, Hl[t] ? { passive: !0 } : void 0);
	}
	As && e.dom.addEventListener("input", () => null), G(e);
}
function U(e, t) {
	e.input.lastSelectionOrigin = t, e.input.lastSelectionTime = Date.now();
}
function W(e) {
	e.domObserver.stop();
	for (let t in e.input.eventHandlers) e.dom.removeEventListener(t, e.input.eventHandlers[t]);
	clearTimeout(e.input.composingTimeout), clearTimeout(e.input.lastIOSEnterFallbackTimeout);
}
function G(e) {
	e.someProp("handleDOMEvents", (t) => {
		for (let n in t) e.input.eventHandlers[n] || e.dom.addEventListener(n, e.input.eventHandlers[n] = (t) => K(e, t));
	});
}
function K(e, t) {
	return e.someProp("handleDOMEvents", (n) => {
		let r = n[t.type];
		return r ? r(e, t) || t.defaultPrevented : !1;
	});
}
function Wl(e, t) {
	if (!t.bubbles) return !0;
	if (t.defaultPrevented) return !1;
	for (let n = t.target; n != e.dom; n = n.parentNode) if (!n || n.nodeType == 11 || n.pmViewDesc && n.pmViewDesc.stopEvent(t)) return !1;
	return !0;
}
function Gl(e, t) {
	!K(e, t) && Bl[t.type] && (e.editable || !(t.type in Vl)) && Bl[t.type](e, t);
}
Vl.keydown = (e, t) => {
	let n = t;
	if (e.input.shiftKey = n.keyCode == 16 || n.shiftKey, !au(e, n) && (e.input.lastKeyCode = n.keyCode, e.input.lastKeyCodeTime = Date.now(), !(Ps && Os && n.keyCode == 13))) if (n.keyCode != 229 && e.domObserver.forceFlush(), js && n.keyCode == 13 && !n.ctrlKey && !n.altKey && !n.metaKey) {
		let t = Date.now();
		e.input.lastIOSEnter = t, e.input.lastIOSEnterFallbackTimeout = setTimeout(() => {
			e.input.lastIOSEnter == t && (e.someProp("handleKeyDown", (t) => t(e, hs(13, "Enter"))), e.input.lastIOSEnter = 0);
		}, 200);
	} else e.someProp("handleKeyDown", (t) => t(e, n)) || Sl(e, n) ? n.preventDefault() : U(e, "key");
}, Vl.keyup = (e, t) => {
	t.keyCode == 16 && (e.input.shiftKey = !1);
}, Vl.keypress = (e, t) => {
	let n = t;
	if (au(e, n) || !n.charCode || n.ctrlKey && !n.altKey || Ms && n.metaKey) return;
	if (e.someProp("handleKeyPress", (t) => t(e, n))) {
		n.preventDefault();
		return;
	}
	let r = e.state.selection;
	if (!(r instanceof z) || !r.$from.sameParent(r.$to)) {
		let t = String.fromCharCode(n.charCode), i = () => e.state.tr.insertText(t).scrollIntoView();
		!/[\r\n]/.test(t) && !e.someProp("handleTextInput", (n) => n(e, r.$from.pos, r.$to.pos, t, i)) && e.dispatch(i()), n.preventDefault();
	}
};
function Kl(e) {
	return {
		left: e.clientX,
		top: e.clientY
	};
}
function ql(e, t) {
	let n = t.x - e.clientX, r = t.y - e.clientY;
	return n * n + r * r < 100;
}
function Jl(e, t, n, r, i) {
	if (r == -1) return !1;
	let a = e.state.doc.resolve(r);
	for (let r = a.depth + 1; r > 0; r--) if (e.someProp(t, (t) => r > a.depth ? t(e, n, a.nodeAfter, a.before(r), i, !0) : t(e, n, a.node(r), a.before(r), i, !1))) return !0;
	return !1;
}
function Yl(e, t, n) {
	if (e.focused || e.focus(), e.state.selection.eq(t)) return;
	let r = e.state.tr.setSelection(t);
	n == "pointer" && r.setMeta("pointer", !0), e.dispatch(r);
}
function Xl(e, t) {
	if (t == -1) return !1;
	let n = e.state.doc.resolve(t), r = n.nodeAfter;
	return r && r.isAtom && B.isSelectable(r) ? (Yl(e, new B(n), "pointer"), !0) : !1;
}
function Zl(e, t) {
	if (t == -1) return !1;
	let n = e.state.selection, r, i;
	n instanceof B && (r = n.node);
	let a = e.state.doc.resolve(t);
	for (let e = a.depth + 1; e > 0; e--) {
		let t = e > a.depth ? a.nodeAfter : a.node(e);
		if (B.isSelectable(t)) {
			i = r && n.$from.depth > 0 && e >= n.$from.depth && a.before(n.$from.depth + 1) == n.$from.pos ? a.before(n.$from.depth) : a.before(e);
			break;
		}
	}
	return i == null ? !1 : (Yl(e, B.create(e.state.doc, i), "pointer"), !0);
}
function Ql(e, t, n, r, i) {
	return Jl(e, "handleClickOn", t, n, r) || e.someProp("handleClick", (n) => n(e, t, r)) || (i ? Zl(e, n) : Xl(e, n));
}
function $l(e, t, n, r) {
	return Jl(e, "handleDoubleClickOn", t, n, r) || e.someProp("handleDoubleClick", (n) => n(e, t, r));
}
function eu(e, t, n, r) {
	return Jl(e, "handleTripleClickOn", t, n, r) || e.someProp("handleTripleClick", (n) => n(e, t, r)) || tu(e, n, r);
}
function tu(e, t, n) {
	if (n.button != 0) return !1;
	let r = e.state.doc;
	if (t == -1) return r.inlineContent ? (Yl(e, z.create(r, 0, r.content.size), "pointer"), !0) : !1;
	let i = r.resolve(t);
	for (let t = i.depth + 1; t > 0; t--) {
		let n = t > i.depth ? i.nodeAfter : i.node(t), a = i.before(t);
		if (n.inlineContent) Yl(e, z.create(r, a + 1, a + 1 + n.content.size), "pointer");
		else if (B.isSelectable(n)) Yl(e, B.create(r, a), "pointer");
		else continue;
		return !0;
	}
}
function nu(e) {
	return fu(e);
}
var ru = Ms ? "metaKey" : "ctrlKey";
Bl.mousedown = (e, t) => {
	let n = t;
	e.input.shiftKey = n.shiftKey;
	let r = nu(e), i = Date.now(), a = "singleClick";
	i - e.input.lastClick.time < 500 && ql(n, e.input.lastClick) && !n[ru] && e.input.lastClick.button == n.button && (e.input.lastClick.type == "singleClick" ? a = "doubleClick" : e.input.lastClick.type == "doubleClick" && (a = "tripleClick")), e.input.lastClick = {
		time: i,
		x: n.clientX,
		y: n.clientY,
		type: a,
		button: n.button
	};
	let o = e.posAtCoords(Kl(n));
	o && (a == "singleClick" ? (e.input.mouseDown && e.input.mouseDown.done(), e.input.mouseDown = new iu(e, o, n, !!r)) : (a == "doubleClick" ? $l : eu)(e, o.pos, o.inside, n) ? n.preventDefault() : U(e, "pointer"));
};
var iu = class {
	constructor(e, t, n, r) {
		this.view = e, this.pos = t, this.event = n, this.flushed = r, this.delayedSelectionSync = !1, this.mightDrag = null, this.startDoc = e.state.doc, this.selectNode = !!n[ru], this.allowDefault = n.shiftKey;
		let i, a;
		if (t.inside > -1) i = e.state.doc.nodeAt(t.inside), a = t.inside;
		else {
			let n = e.state.doc.resolve(t.pos);
			i = n.parent, a = n.depth ? n.before() : 0;
		}
		let o = r ? null : n.target, s = o ? e.docView.nearestDesc(o, !0) : null;
		this.target = s && s.nodeDOM.nodeType == 1 ? s.nodeDOM : null;
		let { selection: c } = e.state;
		n.button == 0 && (i.type.spec.draggable && i.type.spec.selectable !== !1 || c instanceof B && c.from <= a && c.to > a) && (this.mightDrag = {
			node: i,
			pos: a,
			addAttr: !!(this.target && !this.target.draggable),
			setUneditable: !!(this.target && Es && !this.target.hasAttribute("contentEditable"))
		}), this.target && this.mightDrag && (this.mightDrag.addAttr || this.mightDrag.setUneditable) && (this.view.domObserver.stop(), this.mightDrag.addAttr && (this.target.draggable = !0), this.mightDrag.setUneditable && setTimeout(() => {
			this.view.input.mouseDown == this && this.target.setAttribute("contentEditable", "false");
		}, 20), this.view.domObserver.start()), e.root.addEventListener("mouseup", this.up = this.up.bind(this)), e.root.addEventListener("mousemove", this.move = this.move.bind(this)), U(e, "pointer");
	}
	done() {
		this.view.root.removeEventListener("mouseup", this.up), this.view.root.removeEventListener("mousemove", this.move), this.mightDrag && this.target && (this.view.domObserver.stop(), this.mightDrag.addAttr && this.target.removeAttribute("draggable"), this.mightDrag.setUneditable && this.target.removeAttribute("contentEditable"), this.view.domObserver.start()), this.delayedSelectionSync && setTimeout(() => Kc(this.view)), this.view.input.mouseDown = null;
	}
	up(e) {
		if (this.done(), !this.view.dom.contains(e.target)) return;
		let t = this.pos;
		this.view.state.doc != this.startDoc && (t = this.view.posAtCoords(Kl(e))), this.updateAllowDefault(e), this.allowDefault || !t ? U(this.view, "pointer") : Ql(this.view, t.pos, t.inside, e, this.selectNode) ? e.preventDefault() : e.button == 0 && (this.flushed || As && this.mightDrag && !this.mightDrag.node.isAtom || Os && !this.view.state.selection.visible && Math.min(Math.abs(t.pos - this.view.state.selection.from), Math.abs(t.pos - this.view.state.selection.to)) <= 2) ? (Yl(this.view, R.near(this.view.state.doc.resolve(t.pos)), "pointer"), e.preventDefault()) : U(this.view, "pointer");
	}
	move(e) {
		this.updateAllowDefault(e), U(this.view, "pointer"), e.buttons == 0 && this.done();
	}
	updateAllowDefault(e) {
		!this.allowDefault && (Math.abs(this.event.x - e.clientX) > 4 || Math.abs(this.event.y - e.clientY) > 4) && (this.allowDefault = !0);
	}
};
Bl.touchstart = (e) => {
	e.input.lastTouch = Date.now(), nu(e), U(e, "pointer");
}, Bl.touchmove = (e) => {
	e.input.lastTouch = Date.now(), U(e, "pointer");
}, Bl.contextmenu = (e) => nu(e);
function au(e, t) {
	return e.composing ? !0 : As && Math.abs(t.timeStamp - e.input.compositionEndedAt) < 500 ? (e.input.compositionEndedAt = -2e8, !0) : !1;
}
var ou = Ps ? 5e3 : -1;
Vl.compositionstart = Vl.compositionupdate = (e) => {
	if (!e.composing) {
		e.domObserver.flush();
		let { state: t } = e, n = t.selection.$to;
		if (t.selection instanceof z && (t.storedMarks || !n.textOffset && n.parentOffset && n.nodeBefore.marks.some((e) => e.type.spec.inclusive === !1) || Os && Ns && su(e))) e.markCursor = e.state.storedMarks || n.marks(), fu(e, !0), e.markCursor = null;
		else if (fu(e, !t.selection.empty), Es && t.selection.empty && n.parentOffset && !n.textOffset && n.nodeBefore.marks.length) {
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
	cu(e, ou);
};
function su(e) {
	let { focusNode: t, focusOffset: n } = e.domSelectionRange();
	if (!t || t.nodeType != 1 || n >= t.childNodes.length) return !1;
	let r = t.childNodes[n];
	return r.nodeType == 1 && r.contentEditable == "false";
}
Vl.compositionend = (e, t) => {
	e.composing && (e.input.composing = !1, e.input.compositionEndedAt = t.timeStamp, e.input.compositionPendingChanges = e.domObserver.pendingRecords().length ? e.input.compositionID : 0, e.input.compositionNode = null, e.input.badSafariComposition ? e.domObserver.forceFlush() : e.input.compositionPendingChanges && Promise.resolve().then(() => e.domObserver.flush()), e.input.compositionID++, cu(e, 20));
};
function cu(e, t) {
	clearTimeout(e.input.composingTimeout), t > -1 && (e.input.composingTimeout = setTimeout(() => fu(e), t));
}
function lu(e) {
	for (e.composing && (e.input.composing = !1, e.input.compositionEndedAt = du()); e.input.compositionNodes.length > 0;) e.input.compositionNodes.pop().markParentsDirty();
}
function uu(e) {
	let t = e.domSelectionRange();
	if (!t.focusNode) return null;
	let n = us(t.focusNode, t.focusOffset), r = ds(t.focusNode, t.focusOffset);
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
function du() {
	let e = document.createEvent("Event");
	return e.initEvent("event", !0, !0), e.timeStamp;
}
function fu(e, t = !1) {
	if (!(Ps && e.domObserver.flushingSoon >= 0)) {
		if (e.domObserver.forceFlush(), lu(e), t || e.docView && e.docView.dirty) {
			let n = Wc(e), r = e.state.selection;
			return n && !n.eq(r) ? e.dispatch(e.state.tr.setSelection(n)) : (e.markCursor || t) && !r.$from.node(r.$from.sharedDepth(r.to)).inlineContent ? e.dispatch(e.state.tr.deleteSelection()) : e.updateState(e.state), !0;
		}
		return !1;
	}
}
function pu(e, t) {
	if (!e.dom.parentNode) return;
	let n = e.dom.parentNode.appendChild(document.createElement("div"));
	n.appendChild(t), n.style.cssText = "position: fixed; left: -10000px; top: 10px";
	let r = getSelection(), i = document.createRange();
	i.selectNodeContents(t), e.dom.blur(), r.removeAllRanges(), r.addRange(i), setTimeout(() => {
		n.parentNode && n.parentNode.removeChild(n), e.focus();
	}, 50);
}
var mu = ws && Ts < 15 || js && Is < 604;
Bl.copy = Vl.cut = (e, t) => {
	let n = t, r = e.state.selection, i = n.type == "cut";
	if (r.empty) return;
	let a = mu ? null : n.clipboardData, { dom: o, text: s } = Cl(e, r.content());
	a ? (n.preventDefault(), a.clearData(), a.setData("text/html", o.innerHTML), a.setData("text/plain", s)) : pu(e, o), i && e.dispatch(e.state.tr.deleteSelection().scrollIntoView().setMeta("uiEvent", "cut"));
};
function hu(e) {
	return e.openStart == 0 && e.openEnd == 0 && e.content.childCount == 1 ? e.content.firstChild : null;
}
function gu(e, t) {
	if (!e.dom.parentNode) return;
	let n = e.input.shiftKey || e.state.selection.$from.parent.type.spec.code, r = e.dom.parentNode.appendChild(document.createElement(n ? "textarea" : "div"));
	n || (r.contentEditable = "true"), r.style.cssText = "position: fixed; left: -10000px; top: 10px", r.focus();
	let i = e.input.shiftKey && e.input.lastKeyCode != 45;
	setTimeout(() => {
		e.focus(), r.parentNode && r.parentNode.removeChild(r), n ? _u(e, r.value, null, i, t) : _u(e, r.textContent, r.innerHTML, i, t);
	}, 50);
}
function _u(e, t, n, r, i) {
	let a = wl(e, t, n, r, e.state.selection.$from);
	if (e.someProp("handlePaste", (t) => t(e, i, a || P.empty))) return !0;
	if (!a) return !1;
	let o = hu(a), s = o ? e.state.tr.replaceSelectionWith(o, r) : e.state.tr.replaceSelection(a);
	return e.dispatch(s.scrollIntoView().setMeta("paste", !0).setMeta("uiEvent", "paste")), !0;
}
function vu(e) {
	let t = e.getData("text/plain") || e.getData("Text");
	if (t) return t;
	let n = e.getData("text/uri-list");
	return n ? n.replace(/\r?\n/g, " ") : "";
}
Vl.paste = (e, t) => {
	let n = t;
	if (e.composing && !Ps) return;
	let r = mu ? null : n.clipboardData, i = e.input.shiftKey && e.input.lastKeyCode != 45;
	r && _u(e, vu(r), r.getData("text/html"), i, n) ? n.preventDefault() : gu(e, n);
};
var yu = class {
	constructor(e, t, n) {
		this.slice = e, this.move = t, this.node = n;
	}
}, bu = Ms ? "altKey" : "ctrlKey";
function xu(e, t) {
	let n;
	return e.someProp("dragCopies", (e) => {
		n = n || e(t);
	}), n == null ? !t[bu] : !n;
}
Bl.dragstart = (e, t) => {
	let n = t, r = e.input.mouseDown;
	if (r && r.done(), !n.dataTransfer) return;
	let i = e.state.selection, a = i.empty ? null : e.posAtCoords(Kl(n)), o;
	if (!(a && a.pos >= i.from && a.pos <= (i instanceof B ? i.to - 1 : i.to))) {
		if (r && r.mightDrag) o = B.create(e.state.doc, r.mightDrag.pos);
		else if (n.target && n.target.nodeType == 1) {
			let t = e.docView.nearestDesc(n.target, !0);
			t && t.node.type.spec.draggable && t != e.docView && (o = B.create(e.state.doc, t.posBefore));
		}
	}
	let { dom: s, text: c, slice: l } = Cl(e, (o || e.state.selection).content());
	(!n.dataTransfer.files.length || !Os || ks > 120) && n.dataTransfer.clearData(), n.dataTransfer.setData(mu ? "Text" : "text/html", s.innerHTML), n.dataTransfer.effectAllowed = "copyMove", mu || n.dataTransfer.setData("text/plain", c), e.dragging = new yu(l, xu(e, n), o);
}, Bl.dragend = (e) => {
	let t = e.dragging;
	window.setTimeout(() => {
		e.dragging == t && (e.dragging = null);
	}, 50);
}, Vl.dragover = Vl.dragenter = (e, t) => t.preventDefault(), Vl.drop = (e, t) => {
	try {
		Su(e, t, e.dragging);
	} finally {
		e.dragging = null;
	}
};
function Su(e, t, n) {
	if (!t.dataTransfer) return;
	let r = e.posAtCoords(Kl(t));
	if (!r) return;
	let i = e.state.doc.resolve(r.pos), a = n && n.slice;
	a ? e.someProp("transformPasted", (t) => {
		a = t(a, e, !1);
	}) : a = wl(e, vu(t.dataTransfer), mu ? null : t.dataTransfer.getData("text/html"), !1, i);
	let o = !!(n && xu(e, t));
	if (e.someProp("handleDrop", (n) => n(e, t, a || P.empty, o))) {
		t.preventDefault();
		return;
	}
	if (!a) return;
	t.preventDefault();
	let s = a ? fo(e.state.doc, i.pos, a) : i.pos;
	s ?? (s = i.pos);
	let c = e.state.tr;
	if (o) {
		let { node: e } = n;
		e ? e.replace(c) : c.deleteSelection();
	}
	let l = c.mapping.map(s), u = a.openStart == 0 && a.openEnd == 0 && a.content.childCount == 1, d = c.doc;
	if (u ? c.replaceRangeWith(l, l, a.content.firstChild) : c.replaceRange(l, l, a), c.doc.eq(d)) return;
	let f = c.doc.resolve(l);
	if (u && B.isSelectable(a.content.firstChild) && f.nodeAfter && f.nodeAfter.sameMarkup(a.content.firstChild)) c.setSelection(new B(f));
	else {
		let t = c.mapping.map(s);
		c.mapping.maps[c.mapping.maps.length - 1].forEach((e, n, r, i) => t = i), c.setSelection(tl(e, f, c.doc.resolve(t)));
	}
	e.focus(), e.dispatch(c.setMeta("uiEvent", "drop"));
}
Bl.focus = (e) => {
	e.input.lastFocus = Date.now(), e.focused || (e.domObserver.stop(), e.dom.classList.add("ProseMirror-focused"), e.domObserver.start(), e.focused = !0, setTimeout(() => {
		e.docView && e.hasFocus() && !e.domObserver.currentSelection.eq(e.domSelectionRange()) && Kc(e);
	}, 20));
}, Bl.blur = (e, t) => {
	let n = t;
	e.focused && (e.domObserver.stop(), e.dom.classList.remove("ProseMirror-focused"), e.domObserver.start(), n.relatedTarget && e.dom.contains(n.relatedTarget) && e.domObserver.currentSelection.clear(), e.focused = !1);
}, Bl.beforeinput = (e, t) => {
	if (Os && Ps && t.inputType == "deleteContentBackward") {
		e.domObserver.flushSoon();
		let { domChangeCount: t } = e.input;
		setTimeout(() => {
			if (e.input.domChangeCount != t || (e.dom.blur(), e.focus(), e.someProp("handleKeyDown", (t) => t(e, hs(8, "Backspace"))))) return;
			let { $cursor: n } = e.state.selection;
			n && n.pos > 0 && e.dispatch(e.state.tr.delete(n.pos - 1, n.pos).scrollIntoView());
		}, 50);
	}
};
for (let e in Vl) Bl[e] = Vl[e];
function Cu(e, t) {
	if (e == t) return !0;
	for (let n in e) if (e[n] !== t[n]) return !1;
	for (let n in t) if (!(n in e)) return !1;
	return !0;
}
var wu = class e {
	constructor(e, t) {
		this.toDOM = e, this.spec = t || ku, this.side = this.spec.side || 0;
	}
	map(e, t, n, r) {
		let { pos: i, deleted: a } = e.mapResult(t.from + r, this.side < 0 ? -1 : 1);
		return a ? null : new Du(i - n, i - n, this);
	}
	valid() {
		return !0;
	}
	eq(t) {
		return this == t || t instanceof e && (this.spec.key && this.spec.key == t.spec.key || this.toDOM == t.toDOM && Cu(this.spec, t.spec));
	}
	destroy(e) {
		this.spec.destroy && this.spec.destroy(e);
	}
}, Tu = class e {
	constructor(e, t) {
		this.attrs = e, this.spec = t || ku;
	}
	map(e, t, n, r) {
		let i = e.map(t.from + r, this.spec.inclusiveStart ? -1 : 1) - n, a = e.map(t.to + r, this.spec.inclusiveEnd ? 1 : -1) - n;
		return i >= a ? null : new Du(i, a, this);
	}
	valid(e, t) {
		return t.from < t.to;
	}
	eq(t) {
		return this == t || t instanceof e && Cu(this.attrs, t.attrs) && Cu(this.spec, t.spec);
	}
	static is(t) {
		return t.type instanceof e;
	}
	destroy() {}
}, Eu = class e {
	constructor(e, t) {
		this.attrs = e, this.spec = t || ku;
	}
	map(e, t, n, r) {
		let i = e.mapResult(t.from + r, 1);
		if (i.deleted) return null;
		let a = e.mapResult(t.to + r, -1);
		return a.deleted || a.pos <= i.pos ? null : new Du(i.pos - n, a.pos - n, this);
	}
	valid(e, t) {
		let { index: n, offset: r } = e.content.findIndex(t.from), i;
		return r == t.from && !(i = e.child(n)).isText && r + i.nodeSize == t.to;
	}
	eq(t) {
		return this == t || t instanceof e && Cu(this.attrs, t.attrs) && Cu(this.spec, t.spec);
	}
	destroy() {}
}, Du = class e {
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
		return new e(t, t, new wu(n, r));
	}
	static inline(t, n, r, i) {
		return new e(t, n, new Tu(r, i));
	}
	static node(t, n, r, i) {
		return new e(t, n, new Eu(r, i));
	}
	get spec() {
		return this.type.spec;
	}
	get inline() {
		return this.type instanceof Tu;
	}
	get widget() {
		return this.type instanceof wu;
	}
}, Ou = [], ku = {}, Au = class e {
	constructor(e, t) {
		this.local = e.length ? e : Ou, this.children = t.length ? t : Ou;
	}
	static create(e, t) {
		return t.length ? Ru(t, e, 0, ku) : ju;
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
		return this == ju || e.maps.length == 0 ? this : this.mapInner(e, t, 0, 0, n || ku);
	}
	mapInner(t, n, r, i, a) {
		let o;
		for (let e = 0; e < this.local.length; e++) {
			let s = this.local[e].map(t, r, i);
			s && s.type.valid(n, s) ? (o || (o = [])).push(s) : a.onRemove && a.onRemove(this.local[e].spec);
		}
		return this.children.length ? Nu(this.children, o || [], t, n, r, i, a) : o ? new e(o.sort(zu), Ou) : ju;
	}
	add(t, n) {
		return n.length ? this == ju ? e.create(t, n) : this.addInner(t, n, 0) : this;
	}
	addInner(t, n, r) {
		let i, a = 0;
		t.forEach((e, t) => {
			let o = t + r, s;
			if (s = Iu(n, e, o)) {
				for (i || (i = this.children.slice()); a < i.length && i[a] < t;) a += 3;
				i[a] == t ? i[a + 2] = i[a + 2].addInner(e, s, o + 1) : i.splice(a, 0, t, t + e.nodeSize, Ru(s, e, o + 1, ku)), a += 3;
			}
		});
		let o = Pu(a ? Lu(n) : n, -r);
		for (let e = 0; e < o.length; e++) o[e].type.valid(t, o[e]) || o.splice(e--, 1);
		return new e(o.length ? this.local.concat(o).sort(zu) : this.local, i || this.children);
	}
	remove(e) {
		return e.length == 0 || this == ju ? this : this.removeInner(e, 0);
	}
	removeInner(t, n) {
		let r = this.children, i = this.local;
		for (let e = 0; e < r.length; e += 3) {
			let i, a = r[e] + n, o = r[e + 1] + n;
			for (let e = 0, n; e < t.length; e++) (n = t[e]) && n.from > a && n.to < o && (t[e] = null, (i || (i = [])).push(n));
			if (!i) continue;
			r == this.children && (r = this.children.slice());
			let s = r[e + 2].removeInner(i, a + 1);
			s == ju ? (r.splice(e, 3), e -= 3) : r[e + 2] = s;
		}
		if (i.length) {
			for (let e = 0, r; e < t.length; e++) if (r = t[e]) for (let e = 0; e < i.length; e++) i[e].eq(r, n) && (i == this.local && (i = this.local.slice()), i.splice(e--, 1));
		}
		return r == this.children && i == this.local ? this : i.length || r.length ? new e(i, r) : ju;
	}
	forChild(t, n) {
		if (this == ju) return this;
		if (n.isLeaf) return e.empty;
		let r, i;
		for (let e = 0; e < this.children.length; e += 3) if (this.children[e] >= t) {
			this.children[e] == t && (r = this.children[e + 2]);
			break;
		}
		let a = t + 1, o = a + n.content.size;
		for (let e = 0; e < this.local.length; e++) {
			let t = this.local[e];
			if (t.from < o && t.to > a && t.type instanceof Tu) {
				let e = Math.max(a, t.from) - a, n = Math.min(o, t.to) - a;
				e < n && (i || (i = [])).push(t.copy(e, n));
			}
		}
		if (i) {
			let t = new e(i.sort(zu), Ou);
			return r ? new Mu([t, r]) : t;
		}
		return r || ju;
	}
	eq(t) {
		if (this == t) return !0;
		if (!(t instanceof e) || this.local.length != t.local.length || this.children.length != t.children.length) return !1;
		for (let e = 0; e < this.local.length; e++) if (!this.local[e].eq(t.local[e])) return !1;
		for (let e = 0; e < this.children.length; e += 3) if (this.children[e] != t.children[e] || this.children[e + 1] != t.children[e + 1] || !this.children[e + 2].eq(t.children[e + 2])) return !1;
		return !0;
	}
	locals(e) {
		return Bu(this.localsInner(e));
	}
	localsInner(e) {
		if (this == ju) return Ou;
		if (e.inlineContent || !this.local.some(Tu.is)) return this.local;
		let t = [];
		for (let e = 0; e < this.local.length; e++) this.local[e].type instanceof Tu || t.push(this.local[e]);
		return t;
	}
	forEachSet(e) {
		e(this);
	}
};
Au.empty = new Au([], []), Au.removeOverlap = Bu;
var ju = Au.empty, Mu = class e {
	constructor(e) {
		this.members = e;
	}
	map(t, n) {
		let r = this.members.map((e) => e.map(t, n, ku));
		return e.from(r);
	}
	forChild(t, n) {
		if (n.isLeaf) return Au.empty;
		let r = [];
		for (let i = 0; i < this.members.length; i++) {
			let a = this.members[i].forChild(t, n);
			a != ju && (a instanceof e ? r = r.concat(a.members) : r.push(a));
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
		return t ? Bu(n ? t : t.sort(zu)) : Ou;
	}
	static from(t) {
		switch (t.length) {
			case 0: return ju;
			case 1: return t[0];
			default: return new e(t.every((e) => e instanceof Au) ? t : t.reduce((e, t) => e.concat(t instanceof Au ? t : t.members), []));
		}
	}
	forEachSet(e) {
		for (let t = 0; t < this.members.length; t++) this.members[t].forEachSet(e);
	}
};
function Nu(e, t, n, r, i, a, o) {
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
			r == ju ? (s[t + 1] = -2, c = !0) : (s[t] = u, s[t + 1] = d, s[t + 2] = r);
		} else c = !0;
	}
	if (c) {
		let c = Ru(Fu(s, e, t, n, i, a, o), r, 0, o);
		t = c.local;
		for (let e = 0; e < s.length; e += 3) s[e + 1] < 0 && (s.splice(e, 3), e -= 3);
		for (let e = 0, t = 0; e < c.children.length; e += 3) {
			let n = c.children[e];
			for (; t < s.length && s[t] < n;) t += 3;
			s.splice(t, 0, c.children[e], c.children[e + 1], c.children[e + 2]);
		}
	}
	return new Au(t.sort(zu), s);
}
function Pu(e, t) {
	if (!t || !e.length) return e;
	let n = [];
	for (let r = 0; r < e.length; r++) {
		let i = e[r];
		n.push(new Du(i.from + t, i.to + t, i.type));
	}
	return n;
}
function Fu(e, t, n, r, i, a, o) {
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
function Iu(e, t, n) {
	if (t.isLeaf) return null;
	let r = n + t.nodeSize, i = null;
	for (let t = 0, a; t < e.length; t++) (a = e[t]) && a.from > n && a.to < r && ((i || (i = [])).push(a), e[t] = null);
	return i;
}
function Lu(e) {
	let t = [];
	for (let n = 0; n < e.length; n++) e[n] != null && t.push(e[n]);
	return t;
}
function Ru(e, t, n, r) {
	let i = [], a = !1;
	t.forEach((t, o) => {
		let s = Iu(e, t, o + n);
		if (s) {
			a = !0;
			let e = Ru(s, t, n + o + 1, r);
			e != ju && i.push(o, o + t.nodeSize, e);
		}
	});
	let o = Pu(a ? Lu(e) : e, -n).sort(zu);
	for (let e = 0; e < o.length; e++) o[e].type.valid(t, o[e]) || (r.onRemove && r.onRemove(o[e].spec), o.splice(e--, 1));
	return o.length || i.length ? new Au(o, i) : ju;
}
function zu(e, t) {
	return e.from - t.from || e.to - t.to;
}
function Bu(e) {
	let t = e;
	for (let n = 0; n < t.length - 1; n++) {
		let r = t[n];
		if (r.from != r.to) for (let i = n + 1; i < t.length; i++) {
			let a = t[i];
			if (a.from == r.from) {
				a.to != r.to && (t == e && (t = e.slice()), t[i] = a.copy(a.from, r.to), Vu(t, i + 1, a.copy(r.to, a.to)));
				continue;
			} else {
				a.from < r.to && (t == e && (t = e.slice()), t[n] = r.copy(r.from, a.from), Vu(t, i, r.copy(a.from, r.to)));
				break;
			}
		}
	}
	return t;
}
function Vu(e, t, n) {
	for (; t < e.length && zu(n, e[t]) > 0;) t++;
	e.splice(t, 0, n);
}
function Hu(e) {
	let t = [];
	return e.someProp("decorations", (n) => {
		let r = n(e.state);
		r && r != ju && t.push(r);
	}), e.cursorWrapper && t.push(Au.create(e.state.doc, [e.cursorWrapper.deco])), Mu.from(t);
}
var Uu = {
	childList: !0,
	characterData: !0,
	characterDataOldValue: !0,
	attributes: !0,
	attributeOldValue: !0,
	subtree: !0
}, Wu = ws && Ts <= 11, Gu = class {
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
}, Ku = class {
	constructor(e, t) {
		this.view = e, this.handleDOMChange = t, this.queue = [], this.flushingSoon = -1, this.observer = null, this.currentSelection = new Gu(), this.onCharData = null, this.suppressingSelectionUpdates = !1, this.lastChangedTextNode = null, this.observer = window.MutationObserver && new window.MutationObserver((t) => {
			for (let e = 0; e < t.length; e++) this.queue.push(t[e]);
			ws && Ts <= 11 && t.some((e) => e.type == "childList" && e.removedNodes.length || e.type == "characterData" && e.oldValue.length > e.target.nodeValue.length) ? this.flushSoon() : As && e.composing && t.some((e) => e.type == "childList" && e.target.nodeName == "TR") ? (e.input.badSafariComposition = !0, this.flushSoon()) : this.flush();
		}), Wu && (this.onCharData = (e) => {
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
		this.observer && (this.observer.takeRecords(), this.observer.observe(this.view.dom, Uu)), this.onCharData && this.view.dom.addEventListener("DOMCharacterDataModified", this.onCharData), this.connectSelection();
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
		if (nl(this.view)) {
			if (this.suppressingSelectionUpdates) return Kc(this.view);
			if (ws && Ts <= 11 && !this.view.state.selection.empty) {
				let e = this.view.domSelectionRange();
				if (e.focusNode && as(e.focusNode, e.focusOffset, e.anchorNode, e.anchorOffset)) return this.flushSoon();
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
		for (let n = e.focusNode; n; n = ts(n)) t.add(n);
		for (let r = e.anchorNode; r; r = ts(r)) if (t.has(r)) {
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
		let n = e.domSelectionRange(), r = !this.suppressingSelectionUpdates && !this.currentSelection.eq(n) && nl(e) && !this.ignoreSelectionChange(n), i = -1, a = -1, o = !1, s = [];
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
		} else if (Es && s.length) {
			let t = s.filter((e) => e.nodeName == "BR");
			if (t.length == 2) {
				let [e, n] = t;
				e.parentNode && e.parentNode.parentNode == n.parentNode ? n.remove() : e.remove();
			} else {
				let { focusNode: n } = this.currentSelection;
				for (let r of t) {
					let t = r.parentNode;
					t && t.nodeName == "LI" && (!n || Zu(e, n) != t) && r.remove();
				}
			}
		}
		let c = null;
		i < 0 && r && e.input.lastFocus > Date.now() - 200 && Math.max(e.input.lastTouch, e.input.lastClick.time) < Date.now() - 300 && ms(n) && (c = Wc(e)) && c.eq(R.near(e.state.doc.resolve(0), 1)) ? (e.input.lastFocus = 0, Kc(e), this.currentSelection.set(n), e.scrollToSelection()) : (i > -1 || r) && (i > -1 && (e.docView.markDirty(i, a), Yu(e)), e.input.badSafariComposition && (e.input.badSafariComposition = !1, Qu(e, s)), this.handleDOMChange(i, a, o, s), e.docView && e.docView.dirty ? e.updateState(e.state) : this.currentSelection.eq(n) || Kc(e), this.currentSelection.set(n));
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
			if (ws && Ts <= 11 && e.addedNodes.length) for (let t = 0; t < e.addedNodes.length; t++) {
				let { previousSibling: n, nextSibling: a } = e.addedNodes[t];
				(!n || Array.prototype.indexOf.call(e.addedNodes, n) < 0) && (r = n), (!a || Array.prototype.indexOf.call(e.addedNodes, a) < 0) && (i = a);
			}
			let a = r && r.parentNode == e.target ? es(r) + 1 : 0, o = n.localPosFromDOM(e.target, a, -1), s = i && i.parentNode == e.target ? es(i) : e.target.childNodes.length;
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
}, qu = /* @__PURE__ */ new WeakMap(), Ju = !1;
function Yu(e) {
	if (!qu.has(e) && (qu.set(e, null), [
		"normal",
		"nowrap",
		"pre-line"
	].indexOf(getComputedStyle(e.dom).whiteSpace) !== -1)) {
		if (e.requiresGeckoHackNode = Es, Ju) return;
		console.warn("ProseMirror expects the CSS white-space property to be set, preferably to 'pre-wrap'. It is recommended to load style/prosemirror.css from the prosemirror-view package."), Ju = !0;
	}
}
function q(e, t) {
	let n = t.startContainer, r = t.startOffset, i = t.endContainer, a = t.endOffset, o = e.domAtPos(e.state.selection.anchor);
	return as(o.node, o.offset, i, a) && ([n, r, i, a] = [
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
function Xu(e, t) {
	if (t.getComposedRanges) {
		let n = t.getComposedRanges(e.root)[0];
		if (n) return q(e, n);
	}
	let n;
	function r(e) {
		e.preventDefault(), e.stopImmediatePropagation(), n = e.getTargetRanges()[0];
	}
	return e.dom.addEventListener("beforeinput", r, !0), document.execCommand("indent"), e.dom.removeEventListener("beforeinput", r, !0), n ? q(e, n) : null;
}
function Zu(e, t) {
	for (let n = t.parentNode; n && n != e.dom; n = n.parentNode) {
		let t = e.docView.nearestDesc(n, !0);
		if (t && t.node.isBlock) return n;
	}
	return null;
}
function Qu(e, t) {
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
function $u(e, t, n) {
	let { node: r, fromOffset: i, toOffset: a, from: o, to: s } = e.docView.parseRange(t, n), c = e.domSelectionRange(), l, u = c.anchorNode;
	if (u && e.dom.contains(u.nodeType == 1 ? u : u.parentNode) && (l = [{
		node: u,
		offset: c.anchorOffset
	}], ms(c) || l.push({
		node: c.focusNode,
		offset: c.focusOffset
	})), Os && e.input.lastKeyCode === 8) for (let e = a; e > i; e--) {
		let t = r.childNodes[e - 1], n = t.pmViewDesc;
		if (t.nodeName == "BR" && !n) {
			a = e;
			break;
		}
		if (!n || n.size) break;
	}
	let d = e.state.doc, f = e.someProp("domParser") || Zi.fromSchema(e.state.schema), p = d.resolve(o), m = null, h = f.parse(r, {
		topNode: p.parent,
		topMatch: p.parent.contentMatchAt(p.index()),
		topOpen: !0,
		from: i,
		to: a,
		preserveWhitespace: p.parent.type.whitespace == "pre" ? "full" : !0,
		findPositions: l,
		ruleFromNode: ed,
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
function ed(e) {
	let t = e.pmViewDesc;
	if (t) return t.parseRule();
	if (e.nodeName == "BR" && e.parentNode) {
		if (As && /^(ul|ol)$/i.test(e.parentNode.nodeName)) {
			let e = document.createElement("div");
			return e.appendChild(document.createElement("li")), { skip: e };
		} else if (e.parentNode.lastChild == e || As && /^(tr|table)$/i.test(e.parentNode.nodeName)) return { ignore: !0 };
	} else if (e.nodeName == "IMG" && e.getAttribute("mark-placeholder")) return { ignore: !0 };
	return null;
}
var td = /^(a|abbr|acronym|b|bd[io]|big|br|button|cite|code|data(list)?|del|dfn|em|i|img|ins|kbd|label|map|mark|meter|output|q|ruby|s|samp|small|span|strong|su[bp]|time|u|tt|var)$/i;
function nd(e, t, n, r, i) {
	let a = e.input.compositionPendingChanges || (e.composing ? e.input.compositionID : 0);
	if (e.input.compositionPendingChanges = 0, t < 0) {
		let t = e.input.lastSelectionTime > Date.now() - 50 ? e.input.lastSelectionOrigin : null, n = Wc(e, t);
		if (n && !e.state.selection.eq(n)) {
			if (Os && Ps && e.input.lastKeyCode === 13 && Date.now() - 100 < e.input.lastKeyCodeTime && e.someProp("handleKeyDown", (t) => t(e, hs(13, "Enter")))) return;
			let r = e.state.tr.setSelection(n);
			t == "pointer" ? r.setMeta("pointer", !0) : t == "key" && r.scrollIntoView(), a && r.setMeta("composition", a), e.dispatch(r);
		}
		return;
	}
	let o = e.state.doc.resolve(t), s = o.sharedDepth(n);
	t = o.before(s + 1), n = e.state.doc.resolve(n).after(s + 1);
	let c = e.state.selection, l = $u(e, t, n), u = e.state.doc, d = u.slice(l.from, l.to), f, p;
	e.input.lastKeyCode === 8 && Date.now() - 100 < e.input.lastKeyCodeTime ? (f = e.state.selection.to, p = "end") : (f = e.state.selection.from, p = "start"), e.input.lastKeyCode = null;
	let m = sd(d.content, l.doc.content, l.from, f, p);
	if (m && e.input.domChangeCount++, (js && e.input.lastIOSEnter > Date.now() - 225 || Ps) && i.some((e) => e.nodeType == 1 && !td.test(e.nodeName)) && (!m || m.endA >= m.endB) && e.someProp("handleKeyDown", (t) => t(e, hs(13, "Enter")))) {
		e.input.lastIOSEnter = 0;
		return;
	}
	if (!m) if (r && c instanceof z && !c.empty && c.$head.sameParent(c.$anchor) && !e.composing && !(l.sel && l.sel.anchor != l.sel.head)) m = {
		start: c.from,
		endA: c.to,
		endB: c.to
	};
	else {
		if (l.sel) {
			let t = rd(e, e.state.doc, l.sel);
			if (t && !t.eq(e.state.selection)) {
				let n = e.state.tr.setSelection(t);
				a && n.setMeta("composition", a), e.dispatch(n);
			}
		}
		return;
	}
	e.state.selection.from < e.state.selection.to && m.start == m.endB && e.state.selection instanceof z && (m.start > e.state.selection.from && m.start <= e.state.selection.from + 2 && e.state.selection.from >= l.from ? m.start = e.state.selection.from : m.endA < e.state.selection.to && m.endA >= e.state.selection.to - 2 && e.state.selection.to <= l.to && (m.endB += e.state.selection.to - m.endA, m.endA = e.state.selection.to)), ws && Ts <= 11 && m.endB == m.start + 1 && m.endA == m.start && m.start > l.from && l.doc.textBetween(m.start - l.from - 1, m.start - l.from + 1) == " \xA0" && (m.start--, m.endA--, m.endB--);
	let h = l.doc.resolveNoCache(m.start - l.from), g = l.doc.resolveNoCache(m.endB - l.from), _ = u.resolve(m.start), v = h.sameParent(g) && h.parent.inlineContent && _.end() >= m.endA;
	if ((js && e.input.lastIOSEnter > Date.now() - 225 && (!v || i.some((e) => e.nodeName == "DIV" || e.nodeName == "P")) || !v && h.pos < l.doc.content.size && (!h.sameParent(g) || !h.parent.inlineContent) && h.pos < g.pos && !/\S/.test(l.doc.textBetween(h.pos, g.pos, "", ""))) && e.someProp("handleKeyDown", (t) => t(e, hs(13, "Enter")))) {
		e.input.lastIOSEnter = 0;
		return;
	}
	if (e.state.selection.anchor > m.start && ad(u, m.start, m.endA, h, g) && e.someProp("handleKeyDown", (t) => t(e, hs(8, "Backspace")))) {
		Ps && Os && e.domObserver.suppressSelectionUpdates();
		return;
	}
	Os && m.endB == m.start && (e.input.lastChromeDelete = Date.now()), Ps && !v && h.start() != g.start() && g.parentOffset == 0 && h.depth == g.depth && l.sel && l.sel.anchor == l.sel.head && l.sel.head == m.endA && (m.endB -= 2, g = l.doc.resolveNoCache(m.endB - l.from), setTimeout(() => {
		e.someProp("handleKeyDown", function(t) {
			return t(e, hs(13, "Enter"));
		});
	}, 20));
	let y = m.start, b = m.endA, x = (t) => {
		let n = t || e.state.tr.replace(y, b, l.doc.slice(m.start - l.from, m.endB - l.from));
		if (l.sel) {
			let t = rd(e, n.doc, l.sel);
			t && !(Os && e.composing && t.empty && (m.start != m.endB || e.input.lastChromeDelete < Date.now() - 100) && (t.head == y || t.head == n.mapping.map(b) - 1) || ws && t.empty && t.head == y) && n.setSelection(t);
		}
		return a && n.setMeta("composition", a), n.scrollIntoView();
	}, S;
	if (v) if (h.pos == g.pos) {
		ws && Ts <= 11 && h.parentOffset == 0 && (e.domObserver.suppressSelectionUpdates(), setTimeout(() => Kc(e), 20));
		let t = x(e.state.tr.delete(y, b)), n = u.resolve(m.start).marksAcross(u.resolve(m.endA));
		n && t.ensureMarks(n), e.dispatch(t);
	} else if (m.endA == m.endB && (S = id(h.parent.content.cut(h.parentOffset, g.parentOffset), _.parent.content.cut(_.parentOffset, m.endA - _.start())))) {
		let t = x(e.state.tr);
		S.type == "add" ? t.addMark(y, b, S.mark) : t.removeMark(y, b, S.mark), e.dispatch(t);
	} else if (h.parent.child(h.index()).isText && h.index() == g.index() - +!g.textOffset) {
		let t = h.parent.textBetween(h.parentOffset, g.parentOffset), n = () => x(e.state.tr.insertText(t, y, b));
		e.someProp("handleTextInput", (r) => r(e, y, b, t, n)) || e.dispatch(n());
	} else e.dispatch(x());
	else e.dispatch(x());
}
function rd(e, t, n) {
	return Math.max(n.anchor, n.head) > t.content.size ? null : tl(e, t.resolve(n.anchor), t.resolve(n.head));
}
function id(e, t) {
	let n = e.firstChild.marks, r = t.firstChild.marks, i = n, a = r, o, s, c;
	for (let e = 0; e < r.length; e++) i = r[e].removeFromSet(i);
	for (let e = 0; e < n.length; e++) a = n[e].removeFromSet(a);
	if (i.length == 1 && a.length == 0) s = i[0], o = "add", c = (e) => e.mark(s.addToSet(e.marks));
	else if (i.length == 0 && a.length == 1) s = a[0], o = "remove", c = (e) => e.mark(s.removeFromSet(e.marks));
	else return null;
	let l = [];
	for (let e = 0; e < t.childCount; e++) l.push(c(t.child(e)));
	if (M.from(l).eq(e)) return {
		mark: s,
		type: o
	};
}
function ad(e, t, n, r, i) {
	if (n - t <= i.pos - r.pos || od(r, !0, !1) < i.pos) return !1;
	let a = e.resolve(t);
	if (!r.parent.isTextblock) {
		let e = a.nodeAfter;
		return e != null && n == t + e.nodeSize;
	}
	if (a.parentOffset < a.parent.content.size || !a.parent.isTextblock) return !1;
	let o = e.resolve(od(a, !0, !0));
	return !o.parent.isTextblock || o.pos > n || od(o, !0, !1) < n ? !1 : r.parent.content.cut(r.parentOffset).eq(o.parent.content);
}
function od(e, t, n) {
	let r = e.depth, i = t ? e.end() : e.pos;
	for (; r > 0 && (t || e.indexAfter(r) == e.node(r).childCount);) r--, i++, t = !1;
	if (n) {
		let t = e.node(r).maybeChild(e.indexAfter(r));
		for (; t && !t.isLeaf;) t = t.firstChild, i++;
	}
	return i;
}
function sd(e, t, n, r, i) {
	let a = e.findDiffStart(t, n);
	if (a == null) return null;
	let { a: o, b: s } = e.findDiffEnd(t, n + e.size, n + t.size);
	if (i == "end") {
		let e = Math.max(0, a - Math.min(o, s));
		r -= o + e - a;
	}
	if (o < a && e.size < t.size) {
		let e = r <= a && r >= o ? a - r : 0;
		a -= e, a && a < t.size && cd(t.textBetween(a - 1, a + 1)) && (a += e ? 1 : -1), s = a + (s - o), o = a;
	} else if (s < a) {
		let t = r <= a && r >= s ? a - r : 0;
		a -= t, a && a < e.size && cd(e.textBetween(a - 1, a + 1)) && (a += t ? 1 : -1), o = a + (o - s), s = a;
	}
	return {
		start: a,
		endA: o,
		endB: s
	};
}
function cd(e) {
	if (e.length != 2) return !1;
	let t = e.charCodeAt(0), n = e.charCodeAt(1);
	return t >= 56320 && t <= 57343 && n >= 55296 && n <= 56319;
}
var ld = class {
	constructor(e, t) {
		this._root = null, this.focused = !1, this.trackWrites = null, this.mounted = !1, this.markCursor = null, this.cursorWrapper = null, this.lastSelectedViewDesc = void 0, this.input = new Ul(), this.prevDirectPlugins = [], this.pluginViews = [], this.requiresGeckoHackNode = !1, this.dragging = null, this._props = t, this.state = t.state, this.directPlugins = t.plugins || [], this.directPlugins.forEach(gd), this.dispatch = this.dispatch.bind(this), this.dom = e && e.mount || document.createElement("div"), e && (e.appendChild ? e.appendChild(this.dom) : typeof e == "function" ? e(this.dom) : e.mount && (this.mounted = !0)), this.editable = fd(this), dd(this), this.nodeViews = md(this), this.docView = wc(this.state.doc, ud(this), Hu(this), this.dom, this), this.domObserver = new Ku(this, (e, t, n, r) => nd(this, e, t, n, r)), this.domObserver.start(), H(this), this.updatePluginViews();
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
		e.handleDOMEvents != this._props.handleDOMEvents && G(this);
		let t = this._props;
		this._props = e, e.plugins && (e.plugins.forEach(gd), this.directPlugins = e.plugins), this.updateStateInner(e.state, t);
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
		e.storedMarks && this.composing && (lu(this), i = !0), this.state = e;
		let a = n.plugins != e.plugins || this._props.plugins != t.plugins;
		if (a || this._props.plugins != t.plugins || this._props.nodeViews != t.nodeViews) {
			let e = md(this);
			hd(e, this.nodeViews) && (this.nodeViews = e, r = !0);
		}
		(a || t.handleDOMEvents != this._props.handleDOMEvents) && G(this), this.editable = fd(this), dd(this);
		let o = Hu(this), s = ud(this), c = n.plugins != e.plugins && !n.doc.eq(e.doc) ? "reset" : e.scrollToSelection > n.scrollToSelection ? "to selection" : "preserve", l = r || !this.docView.matchesNode(e.doc, s, o);
		(l || !e.selection.eq(n.selection)) && (i = !0);
		let u = c == "preserve" && i && this.dom.style.overflowAnchor == null && Vs(this);
		if (i) {
			this.domObserver.stop();
			let t = l && (ws || Os) && !this.composing && !n.selection.empty && !e.selection.empty && pd(n.selection, e.selection);
			if (l) {
				let n = Os ? this.trackWrites = this.domSelectionRange().focusNode : null;
				this.composing && (this.input.compositionNode = uu(this)), (r || !this.docView.update(e.doc, s, o, this)) && (this.docView.updateOuterDeco(s), this.docView.destroy(), this.docView = wc(e.doc, s, o, this.dom, this)), n && (!this.trackWrites || !this.dom.contains(this.trackWrites)) && (t = !0);
			}
			t || !(this.input.mouseDown && this.domObserver.currentSelection.eq(this.domSelectionRange()) && il(this)) ? Kc(this, t) : ($c(this, e.selection), this.domObserver.setCurSelection()), this.domObserver.start();
		}
		this.updatePluginViews(n), this.dragging?.node && !n.doc.eq(e.doc) && this.updateDraggedNode(this.dragging, n), c == "reset" ? this.dom.scrollTop = 0 : c == "to selection" ? this.scrollToSelection() : u && Us(u);
	}
	scrollToSelection() {
		let e = this.domSelectionRange().focusNode;
		if (!(!e || !this.dom.contains(e.nodeType == 1 ? e : e.parentNode)) && !this.someProp("handleScrollToSelection", (e) => e(this))) if (this.state.selection instanceof B) {
			let t = this.docView.domAfterPos(this.state.selection.from);
			t.nodeType == 1 && Bs(this, t.getBoundingClientRect(), e);
		} else Bs(this, this.coordsAtPos(this.state.selection.head, 1), e);
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
		this.dragging = new yu(e.slice, e.move, r < 0 ? void 0 : B.create(this.state.doc, r));
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
		if (ws) {
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
		this.domObserver.stop(), this.editable && Ks(this.dom), Kc(this), this.domObserver.start();
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
		return ec(this, e);
	}
	coordsAtPos(e, t = 1) {
		return ic(this, e, t);
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
		return mc(this, t || this.state, e);
	}
	pasteHTML(e, t) {
		return _u(this, "", e, !1, t || new ClipboardEvent("paste"));
	}
	pasteText(e, t) {
		return _u(this, e, null, !0, t || new ClipboardEvent("paste"));
	}
	serializeForClipboard(e) {
		return Cl(this, e);
	}
	destroy() {
		this.docView && (W(this), this.destroyPluginViews(), this.mounted ? (this.docView.update(this.state.doc, [], Hu(this), this), this.dom.textContent = "") : this.dom.parentNode && this.dom.parentNode.removeChild(this.dom), this.docView.destroy(), this.docView = null, is());
	}
	get isDestroyed() {
		return this.docView == null;
	}
	dispatchEvent(e) {
		return Gl(this, e);
	}
	domSelectionRange() {
		let e = this.domSelection();
		return e ? As && this.root.nodeType === 11 && gs(this.dom.ownerDocument) == this.dom && Xu(this, e) || e : {
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
ld.prototype.dispatch = function(e) {
	let t = this._props.dispatchTransaction;
	t ? t.call(this, e) : this.updateState(this.state.apply(e));
};
function ud(e) {
	let t = Object.create(null);
	return t.class = "ProseMirror", t.contenteditable = String(e.editable), e.someProp("attributes", (n) => {
		if (typeof n == "function" && (n = n(e.state)), n) for (let e in n) e == "class" ? t.class += " " + n[e] : e == "style" ? t.style = (t.style ? t.style + ";" : "") + n[e] : !t[e] && e != "contenteditable" && e != "nodeName" && (t[e] = String(n[e]));
	}), t.translate || (t.translate = "no"), [Du.node(0, e.state.doc.content.size, t)];
}
function dd(e) {
	if (e.markCursor) {
		let t = document.createElement("img");
		t.className = "ProseMirror-separator", t.setAttribute("mark-placeholder", "true"), t.setAttribute("alt", ""), e.cursorWrapper = {
			dom: t,
			deco: Du.widget(e.state.selection.from, t, {
				raw: !0,
				marks: e.markCursor
			})
		};
	} else e.cursorWrapper = null;
}
function fd(e) {
	return !e.someProp("editable", (t) => t(e.state) === !1);
}
function pd(e, t) {
	let n = Math.min(e.$anchor.sharedDepth(e.head), t.$anchor.sharedDepth(t.head));
	return e.$anchor.start(n) != t.$anchor.start(n);
}
function md(e) {
	let t = Object.create(null);
	function n(e) {
		for (let n in e) Object.prototype.hasOwnProperty.call(t, n) || (t[n] = e[n]);
	}
	return e.someProp("nodeViews", n), e.someProp("markViews", n), t;
}
function hd(e, t) {
	let n = 0, r = 0;
	for (let r in e) {
		if (e[r] != t[r]) return !0;
		n++;
	}
	for (let e in t) r++;
	return n != r;
}
function gd(e) {
	if (e.spec.state || e.spec.filterTransaction || e.spec.appendTransaction) throw RangeError("Plugins passed directly to the view must not have a state component");
}
for (var _d = {
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
}, vd = {
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
}, yd = typeof navigator < "u" && /Mac/.test(navigator.platform), bd = typeof navigator < "u" && /MSIE \d|Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(navigator.userAgent), xd = 0; xd < 10; xd++) _d[48 + xd] = _d[96 + xd] = String(xd);
for (var xd = 1; xd <= 24; xd++) _d[xd + 111] = "F" + xd;
for (var xd = 65; xd <= 90; xd++) _d[xd] = String.fromCharCode(xd + 32), vd[xd] = String.fromCharCode(xd);
for (var Sd in _d) vd.hasOwnProperty(Sd) || (vd[Sd] = _d[Sd]);
function Cd(e) {
	var t = !(yd && e.metaKey && e.shiftKey && !e.ctrlKey && !e.altKey || bd && e.shiftKey && e.key && e.key.length == 1 || e.key == "Unidentified") && e.key || (e.shiftKey ? vd : _d)[e.keyCode] || e.key || "Unidentified";
	return t == "Esc" && (t = "Escape"), t == "Del" && (t = "Delete"), t == "Left" && (t = "ArrowLeft"), t == "Up" && (t = "ArrowUp"), t == "Right" && (t = "ArrowRight"), t == "Down" && (t = "ArrowDown"), t;
}
//#endregion
//#region node_modules/prosemirror-keymap/dist/index.js
var wd = typeof navigator < "u" && /Mac|iP(hone|[oa]d)/.test(navigator.platform), J = typeof navigator < "u" && /Win/.test(navigator.platform);
function Td(e) {
	let t = e.split(/-(?!$)/), n = t[t.length - 1];
	n == "Space" && (n = " ");
	let r, i, a, o;
	for (let e = 0; e < t.length - 1; e++) {
		let n = t[e];
		if (/^(cmd|meta|m)$/i.test(n)) o = !0;
		else if (/^a(lt)?$/i.test(n)) r = !0;
		else if (/^(c|ctrl|control)$/i.test(n)) i = !0;
		else if (/^s(hift)?$/i.test(n)) a = !0;
		else if (/^mod$/i.test(n)) wd ? o = !0 : i = !0;
		else throw Error("Unrecognized modifier name: " + n);
	}
	return r && (n = "Alt-" + n), i && (n = "Ctrl-" + n), o && (n = "Meta-" + n), a && (n = "Shift-" + n), n;
}
function Ed(e) {
	let t = Object.create(null);
	for (let n in e) t[Td(n)] = e[n];
	return t;
}
function Dd(e, t, n = !0) {
	return t.altKey && (e = "Alt-" + e), t.ctrlKey && (e = "Ctrl-" + e), t.metaKey && (e = "Meta-" + e), n && t.shiftKey && (e = "Shift-" + e), e;
}
function Od(e) {
	return new Xo({ props: { handleKeyDown: kd(e) } });
}
function kd(e) {
	let t = Ed(e);
	return function(e, n) {
		let r = Cd(n), i, a = t[Dd(r, n)];
		if (a && a(e.state, e.dispatch, e)) return !0;
		if (r.length == 1 && r != " ") {
			if (n.shiftKey) {
				let i = t[Dd(r, n, !1)];
				if (i && i(e.state, e.dispatch, e)) return !0;
			}
			if ((n.altKey || n.metaKey || n.ctrlKey) && !(J && n.ctrlKey && n.altKey) && (i = _d[n.keyCode]) && i != r) {
				let r = t[Dd(i, n)];
				if (r && r(e.state, e.dispatch, e)) return !0;
			}
		}
		return !1;
	};
}
//#endregion
//#region node_modules/prosemirror-commands/dist/index.js
var Ad = (e, t) => e.selection.empty ? !1 : (t && t(e.tr.deleteSelection().scrollIntoView()), !0);
function jd(e, t) {
	let { $cursor: n } = e.selection;
	return !n || (t ? !t.endOfTextblock("backward", e) : n.parentOffset > 0) ? null : n;
}
var Md = (e, t, n) => {
	let r = jd(e, n);
	if (!r) return !1;
	let i = Y(r);
	if (!i) {
		let n = r.blockRange(), i = n && Ga(n);
		return i == null ? !1 : (t && t(e.tr.lift(n, i).scrollIntoView()), !0);
	}
	let a = i.nodeBefore;
	if (tf(e, i, t, -1)) return !0;
	if (r.parent.content.size == 0 && (Id(a, "end") || B.isSelectable(a))) for (let n = r.depth;; n--) {
		let o = po(e.doc, r.before(n), r.after(n), P.empty);
		if (o && o.slice.size < o.to - o.from) {
			if (t) {
				let n = e.tr.step(o);
				n.setSelection(Id(a, "end") ? R.findFrom(n.doc.resolve(n.mapping.map(i.pos, -1)), -1) : B.create(n.doc, i.pos - a.nodeSize)), t(n.scrollIntoView());
			}
			return !0;
		}
		if (n == 1 || r.node(n - 1).childCount > 1) break;
	}
	return a.isAtom && i.depth == r.depth - 1 ? (t && t(e.tr.delete(i.pos - a.nodeSize, i.pos).scrollIntoView()), !0) : !1;
}, Nd = (e, t, n) => {
	let r = jd(e, n);
	if (!r) return !1;
	let i = Y(r);
	return i ? Fd(e, i, t) : !1;
}, Pd = (e, t, n) => {
	let r = Rd(e, n);
	if (!r) return !1;
	let i = Vd(r);
	return i ? Fd(e, i, t) : !1;
};
function Fd(e, t, n) {
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
	let s = po(e.doc, i, o, P.empty);
	if (!s || s.from != i || s instanceof Ra && s.slice.size >= o - i) return !1;
	if (n) {
		let t = e.tr.step(s);
		t.setSelection(z.create(t.doc, i)), n(t.scrollIntoView());
	}
	return !0;
}
function Id(e, t, n = !1) {
	for (let r = e; r; r = t == "start" ? r.firstChild : r.lastChild) {
		if (r.isTextblock) return !0;
		if (n && r.childCount != 1) return !1;
	}
	return !1;
}
var Ld = (e, t, n) => {
	let { $head: r, empty: i } = e.selection, a = r;
	if (!i) return !1;
	if (r.parent.isTextblock) {
		if (n ? !n.endOfTextblock("backward", e) : r.parentOffset > 0) return !1;
		a = Y(r);
	}
	let o = a && a.nodeBefore;
	return !o || !B.isSelectable(o) ? !1 : (t && t(e.tr.setSelection(B.create(e.doc, a.pos - o.nodeSize)).scrollIntoView()), !0);
};
function Y(e) {
	if (!e.parent.type.spec.isolating) for (let t = e.depth - 1; t >= 0; t--) {
		if (e.index(t) > 0) return e.doc.resolve(e.before(t + 1));
		if (e.node(t).type.spec.isolating) break;
	}
	return null;
}
function Rd(e, t) {
	let { $cursor: n } = e.selection;
	return !n || (t ? !t.endOfTextblock("forward", e) : n.parentOffset < n.parent.content.size) ? null : n;
}
var zd = (e, t, n) => {
	let r = Rd(e, n);
	if (!r) return !1;
	let i = Vd(r);
	if (!i) return !1;
	let a = i.nodeAfter;
	if (tf(e, i, t, 1)) return !0;
	if (r.parent.content.size == 0 && (Id(a, "start") || B.isSelectable(a))) {
		let n = po(e.doc, r.before(), r.after(), P.empty);
		if (n && n.slice.size < n.to - n.from) {
			if (t) {
				let r = e.tr.step(n);
				r.setSelection(Id(a, "start") ? R.findFrom(r.doc.resolve(r.mapping.map(i.pos)), 1) : B.create(r.doc, r.mapping.map(i.pos))), t(r.scrollIntoView());
			}
			return !0;
		}
	}
	return a.isAtom && i.depth == r.depth - 1 ? (t && t(e.tr.delete(i.pos, i.pos + a.nodeSize).scrollIntoView()), !0) : !1;
}, Bd = (e, t, n) => {
	let { $head: r, empty: i } = e.selection, a = r;
	if (!i) return !1;
	if (r.parent.isTextblock) {
		if (n ? !n.endOfTextblock("forward", e) : r.parentOffset < r.parent.content.size) return !1;
		a = Vd(r);
	}
	let o = a && a.nodeAfter;
	return !o || !B.isSelectable(o) ? !1 : (t && t(e.tr.setSelection(B.create(e.doc, a.pos)).scrollIntoView()), !0);
};
function Vd(e) {
	if (!e.parent.type.spec.isolating) for (let t = e.depth - 1; t >= 0; t--) {
		let n = e.node(t);
		if (e.index(t) + 1 < n.childCount) return e.doc.resolve(e.after(t + 1));
		if (n.type.spec.isolating) break;
	}
	return null;
}
var Hd = (e, t) => {
	let n = e.selection, r = n instanceof B, i;
	if (r) {
		if (n.node.isTextblock || !ao(e.doc, n.from)) return !1;
		i = n.from;
	} else if (i = co(e.doc, n.from, -1), i == null) return !1;
	if (t) {
		let n = e.tr.join(i);
		r && n.setSelection(B.create(n.doc, i - e.doc.resolve(i).nodeBefore.nodeSize)), t(n.scrollIntoView());
	}
	return !0;
}, Ud = (e, t) => {
	let n = e.selection, r;
	if (n instanceof B) {
		if (n.node.isTextblock || !ao(e.doc, n.to)) return !1;
		r = n.to;
	} else if (r = co(e.doc, n.to, 1), r == null) return !1;
	return t && t(e.tr.join(r).scrollIntoView()), !0;
}, Wd = (e, t) => {
	let { $from: n, $to: r } = e.selection, i = n.blockRange(r), a = i && Ga(i);
	return a == null ? !1 : (t && t(e.tr.lift(i, a).scrollIntoView()), !0);
}, Gd = (e, t) => {
	let { $head: n, $anchor: r } = e.selection;
	return !n.parent.type.spec.code || !n.sameParent(r) ? !1 : (t && t(e.tr.insertText("\n").scrollIntoView()), !0);
};
function Kd(e) {
	for (let t = 0; t < e.edgeCount; t++) {
		let { type: n } = e.edge(t);
		if (n.isTextblock && !n.hasRequiredAttrs()) return n;
	}
	return null;
}
var qd = (e, t) => {
	let { $head: n, $anchor: r } = e.selection;
	if (!n.parent.type.spec.code || !n.sameParent(r)) return !1;
	let i = n.node(-1), a = n.indexAfter(-1), o = Kd(i.contentMatchAt(a));
	if (!o || !i.canReplaceWith(a, a, o)) return !1;
	if (t) {
		let r = n.after(), i = e.tr.replaceWith(r, r, o.createAndFill());
		i.setSelection(R.near(i.doc.resolve(r), 1)), t(i.scrollIntoView());
	}
	return !0;
}, Jd = (e, t) => {
	let n = e.selection, { $from: r, $to: i } = n;
	if (n instanceof Io || r.parent.inlineContent || i.parent.inlineContent) return !1;
	let a = Kd(i.parent.contentMatchAt(i.indexAfter()));
	if (!a || !a.isTextblock) return !1;
	if (t) {
		let n = (!r.parentOffset && i.index() < i.parent.childCount ? r : i).pos, o = e.tr.insert(n, a.createAndFill());
		o.setSelection(z.create(o.doc, n + 1)), t(o.scrollIntoView());
	}
	return !0;
}, Yd = (e, t) => {
	let { $cursor: n } = e.selection;
	if (!n || n.parent.content.size) return !1;
	if (n.depth > 1 && n.after() != n.end(-1)) {
		let r = n.before();
		if (ro(e.doc, r)) return t && t(e.tr.split(r).scrollIntoView()), !0;
	}
	let r = n.blockRange(), i = r && Ga(r);
	return i == null ? !1 : (t && t(e.tr.lift(r, i).scrollIntoView()), !0);
};
function Xd(e) {
	return (t, n) => {
		let { $from: r, $to: i } = t.selection;
		if (t.selection instanceof B && t.selection.node.isBlock) return !r.parentOffset || !ro(t.doc, r.pos) ? !1 : (n && n(t.tr.split(r.pos).scrollIntoView()), !0);
		if (!r.depth) return !1;
		let a = [], o, s, c = !1, l = !1;
		for (let t = r.depth;; t--) if (r.node(t).isBlock) {
			c = r.end(t) == r.pos + (r.depth - t), l = r.start(t) == r.pos - (r.depth - t), s = Kd(r.node(t - 1).contentMatchAt(r.indexAfter(t - 1)));
			let n = e && e(i.parent, c, r);
			a.unshift(n || (c && s ? { type: s } : null)), o = t;
			break;
		} else {
			if (t == 1) return !1;
			a.unshift(null);
		}
		let u = t.tr;
		(t.selection instanceof z || t.selection instanceof Io) && u.deleteSelection();
		let d = u.mapping.map(r.pos), f = ro(u.doc, d, a.length, a);
		if (f || (a[0] = s ? { type: s } : null, f = ro(u.doc, d, a.length, a)), !f) return !1;
		if (u.split(d, a.length, a), !c && l && r.node(o).type != s) {
			let e = u.mapping.map(r.before(o)), t = u.doc.resolve(e);
			s && r.node(o - 1).canReplaceWith(t.index(), t.index() + 1, s) && u.setNodeMarkup(u.mapping.map(r.before(o)), s);
		}
		return n && n(u.scrollIntoView()), !0;
	};
}
var Zd = Xd(), Qd = (e, t) => {
	let { $from: n, to: r } = e.selection, i, a = n.sharedDepth(r);
	return a == 0 ? !1 : (i = n.before(a), t && t(e.tr.setSelection(B.create(e.doc, i))), !0);
}, $d = (e, t) => (t && t(e.tr.setSelection(new Io(e.doc))), !0);
function ef(e, t, n) {
	let r = t.nodeBefore, i = t.nodeAfter, a = t.index();
	return !r || !i || !r.type.compatibleContent(i.type) ? !1 : !r.content.size && t.parent.canReplace(a - 1, a) ? (n && n(e.tr.delete(t.pos - r.nodeSize, t.pos).scrollIntoView()), !0) : !t.parent.canReplace(a, a + 1) || !(i.isTextblock || ao(e.doc, t.pos)) ? !1 : (n && n(e.tr.join(t.pos).scrollIntoView()), !0);
}
function tf(e, t, n, r) {
	let i = t.nodeBefore, a = t.nodeAfter, o, s, c = i.type.spec.isolating || a.type.spec.isolating;
	if (!c && ef(e, t, n)) return !0;
	let l = !c && t.parent.canReplace(t.index(), t.index() + 1);
	if (l && (o = (s = i.contentMatchAt(i.childCount)).findWrapping(a.type)) && s.matchType(o[0] || a.type).validEnd) {
		if (n) {
			let r = t.pos + a.nodeSize, s = M.empty;
			for (let e = o.length - 1; e >= 0; e--) s = M.from(o[e].create(null, s));
			s = M.from(i.copy(s));
			let c = e.tr.step(new za(t.pos - 1, r, t.pos, r, new P(s, 1, 0), o.length, !0)), l = c.doc.resolve(r + 2 * o.length);
			l.nodeAfter && l.nodeAfter.type == i.type && ao(c.doc, l.pos) && c.join(l.pos), n(c.scrollIntoView());
		}
		return !0;
	}
	let u = a.type.spec.isolating || r > 0 && c ? null : R.findFrom(t, 1), d = u && u.$from.blockRange(u.$to), f = d && Ga(d);
	if (f != null && f >= t.depth) return n && n(e.tr.lift(d, f).scrollIntoView()), !0;
	if (l && Id(a, "start", !0) && Id(i, "end")) {
		let r = i, o = [];
		for (; o.push(r), !r.isTextblock;) r = r.lastChild;
		let s = a, c = 1;
		for (; !s.isTextblock; s = s.firstChild) c++;
		if (r.canReplace(r.childCount, r.childCount, s.content)) {
			if (n) {
				let r = M.empty;
				for (let e = o.length - 1; e >= 0; e--) r = M.from(o[e].copy(r));
				n(e.tr.step(new za(t.pos - o.length, t.pos + a.nodeSize, t.pos + c, t.pos + a.nodeSize - c, new P(r, o.length, 0), 0, !0)).scrollIntoView());
			}
			return !0;
		}
	}
	return !1;
}
function nf(e) {
	return function(t, n) {
		let r = t.selection, i = e < 0 ? r.$from : r.$to, a = i.depth;
		for (; i.node(a).isInline;) {
			if (!a) return !1;
			a--;
		}
		return i.node(a).isTextblock ? (n && n(t.tr.setSelection(z.create(t.doc, e < 0 ? i.start(a) : i.end(a)))), !0) : !1;
	};
}
var rf = nf(-1), af = nf(1);
function of(e, t = null) {
	return function(n, r) {
		let { $from: i, $to: a } = n.selection, o = i.blockRange(a), s = o && qa(o, e, t);
		return s ? (r && r(n.tr.wrap(o, s).scrollIntoView()), !0) : !1;
	};
}
function sf(e, t = null) {
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
function cf(...e) {
	return function(t, n, r) {
		for (let i = 0; i < e.length; i++) if (e[i](t, n, r)) return !0;
		return !1;
	};
}
var lf = cf(Ad, Md, Ld), uf = cf(Ad, zd, Bd), df = {
	Enter: cf(Gd, Jd, Yd, Zd),
	"Mod-Enter": qd,
	Backspace: lf,
	"Mod-Backspace": lf,
	"Shift-Backspace": lf,
	Delete: uf,
	"Mod-Delete": uf,
	"Mod-a": $d
}, ff = {
	"Ctrl-h": df.Backspace,
	"Alt-Backspace": df["Mod-Backspace"],
	"Ctrl-d": df.Delete,
	"Ctrl-Alt-Backspace": df["Mod-Delete"],
	"Alt-Delete": df["Mod-Delete"],
	"Alt-d": df["Mod-Delete"],
	"Ctrl-a": rf,
	"Ctrl-e": af
};
for (let e in df) ff[e] = df[e];
typeof navigator < "u" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : typeof os < "u" && os.platform && os.platform();
//#endregion
//#region node_modules/prosemirror-schema-list/dist/index.js
function pf(e, t = null) {
	return function(n, r) {
		let { $from: i, $to: a } = n.selection, o = i.blockRange(a);
		if (!o) return !1;
		let s = r ? n.tr : null;
		return mf(s, o, e, t) ? (r && r(s.scrollIntoView()), !0) : !1;
	};
}
function mf(e, t, n, r = null) {
	let i = !1, a = t, o = t.$from.doc;
	if (t.depth >= 2 && t.$from.node(t.depth - 1).type.compatibleContent(n) && t.startIndex == 0) {
		if (t.$from.index(t.depth - 1) == 0) return !1;
		let e = o.resolve(t.start - 2);
		a = new xi(e, e, t.depth), t.endIndex < t.parent.childCount && (t = new xi(t.$from, o.resolve(t.$to.end(t.depth)), t.depth)), i = !0;
	}
	let s = qa(a, n, r, t);
	return s ? (e && hf(e, t, s, i, n), !0) : !1;
}
function hf(e, t, n, r, i) {
	let a = M.empty;
	for (let e = n.length - 1; e >= 0; e--) a = M.from(n[e].type.create(n[e].attrs, a));
	e.step(new za(t.start - (r ? 2 : 0), t.end, t.start, t.end, new P(a, 0, 0), n.length, !0));
	let o = 0;
	for (let e = 0; e < n.length; e++) n[e].type == i && (o = e + 1);
	let s = n.length - o, c = t.start + n.length - (r ? 2 : 0), l = t.parent;
	for (let n = t.startIndex, r = t.endIndex, i = !0; n < r; n++, i = !1) !i && ro(e.doc, c, s) && (e.split(c, s), c += 2 * s), c += l.child(n).nodeSize;
	return e;
}
function gf(e) {
	return function(t, n) {
		let { $from: r, $to: i } = t.selection, a = r.blockRange(i, (t) => t.childCount > 0 && t.firstChild.type == e);
		return a ? n ? r.node(a.depth - 1).type == e ? _f(t, n, e, a) : vf(t, n, a) : !0 : !1;
	};
}
function _f(e, t, n, r) {
	let i = e.tr, a = r.end, o = r.$to.end(r.depth);
	a < o && (i.step(new za(a - 1, o, a, o, new P(M.from(n.create(null, r.parent.copy())), 1, 0), 1, !0)), r = new xi(i.doc.resolve(r.$from.pos), i.doc.resolve(o), r.depth));
	let s = Ga(r);
	if (s == null) return !1;
	i.lift(r, s);
	let c = i.doc.resolve(i.mapping.map(a, -1) - 1);
	return ao(i.doc, c.pos) && c.nodeBefore.type == c.nodeAfter.type && i.join(c.pos), t(i.scrollIntoView()), !0;
}
function vf(e, t, n) {
	let r = e.tr, i = n.parent;
	for (let e = n.end, t = n.endIndex - 1, a = n.startIndex; t > a; t--) e -= i.child(t).nodeSize, r.delete(e - 1, e + 1);
	let a = r.doc.resolve(n.start), o = a.nodeAfter;
	if (r.mapping.map(n.end) != n.start + a.nodeAfter.nodeSize) return !1;
	let s = n.startIndex == 0, c = n.endIndex == i.childCount, l = a.node(-1), u = a.index(-1);
	if (!l.canReplace(u + +!s, u + 1, o.content.append(c ? M.empty : M.from(i)))) return !1;
	let d = a.pos, f = d + o.nodeSize;
	return r.step(new za(d - +!!s, f + +!!c, d + 1, f - 1, new P((s ? M.empty : M.from(i.copy(M.empty))).append(c ? M.empty : M.from(i.copy(M.empty))), +!s, +!c), +!s)), t(r.scrollIntoView()), !0;
}
function yf(e) {
	return function(t, n) {
		let { $from: r, $to: i } = t.selection, a = r.blockRange(i, (t) => t.childCount > 0 && t.firstChild.type == e);
		if (!a) return !1;
		let o = a.startIndex;
		if (o == 0) return !1;
		let s = a.parent, c = s.child(o - 1);
		if (c.type != e) return !1;
		if (n) {
			let r = c.lastChild && c.lastChild.type == s.type, i = M.from(r ? e.create() : null), o = new P(M.from(e.create(null, M.from(s.type.create(null, i)))), r ? 3 : 1, 0), l = a.start, u = a.end;
			n(t.tr.step(new za(l - (r ? 3 : 1), u, l, u, o, 1, !0)).scrollIntoView());
		}
		return !0;
	};
}
//#endregion
//#region node_modules/@tiptap/core/dist/index.js
function bf(e) {
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
var xf = class {
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
			state: bf({
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
}, Sf = class {
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
function Cf(e) {
	return {
		baseExtensions: e.filter((e) => e.type === "extension"),
		nodeExtensions: e.filter((e) => e.type === "node"),
		markExtensions: e.filter((e) => e.type === "mark")
	};
}
function wf(e) {
	let t = [], { nodeExtensions: n, markExtensions: r } = Cf(e), i = [...n, ...r], a = {
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
function Tf(e, t) {
	if (typeof e == "string") {
		if (!t.nodes[e]) throw Error(`There is no node type named '${e}'. Maybe you forgot to add the extension?`);
		return t.nodes[e];
	}
	return e;
}
function Ef(...e) {
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
function Df(e, t) {
	return t.filter((t) => t.type === e.type.name).filter((e) => e.attribute.rendered).map((t) => t.attribute.renderHTML ? t.attribute.renderHTML(e.attrs) || {} : { [t.name]: e.attrs[t.name] }).reduce((e, t) => Ef(e, t), {});
}
function Of(e) {
	return typeof e == "function";
}
function Z(e, t = void 0, ...n) {
	return Of(e) ? t ? e.bind(t)(...n) : e(...n) : e;
}
function kf(e = {}) {
	return Object.keys(e).length === 0 && e.constructor === Object;
}
function Af(e) {
	return typeof e == "string" ? e.match(/^[+-]?(?:\d*\.)?\d+$/) ? Number(e) : e === "true" ? !0 : e === "false" ? !1 : e : e;
}
function jf(e, t) {
	return "style" in e ? e : {
		...e,
		getAttrs: (n) => {
			let r = e.getAttrs ? e.getAttrs(n) : e.attrs;
			if (r === !1) return !1;
			let i = t.reduce((e, t) => {
				let r = t.attribute.parseHTML ? t.attribute.parseHTML(n) : Af(n.getAttribute(t.name));
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
function Mf(e) {
	return Object.fromEntries(Object.entries(e).filter(([e, t]) => e === "attrs" && kf(t) ? !1 : t != null));
}
function Nf(e, t) {
	let n = wf(e), { nodeExtensions: r, markExtensions: i } = Cf(e);
	return new qi({
		topNode: r.find((e) => X(e, "topNode"))?.name,
		nodes: Object.fromEntries(r.map((r) => {
			let i = n.filter((e) => e.type === r.name), a = {
				name: r.name,
				options: r.options,
				storage: r.storage,
				editor: t
			}, o = Mf({
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
			s && (o.parseDOM = s.map((e) => jf(e, i)));
			let c = X(r, "renderHTML", a);
			c && (o.toDOM = (e) => c({
				node: e,
				HTMLAttributes: Df(e, i)
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
			}, o = Mf({
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
			s && (o.parseDOM = s.map((e) => jf(e, i)));
			let c = X(r, "renderHTML", a);
			return c && (o.toDOM = (e) => c({
				mark: e,
				HTMLAttributes: Df(e, i)
			})), [r.name, o];
		}))
	});
}
function Pf(e, t) {
	return t.nodes[e] || t.marks[e] || null;
}
function Ff(e, t) {
	return Array.isArray(t) ? t.some((t) => (typeof t == "string" ? t : t.name) === e.name) : t;
}
function If(e, t) {
	let n = da.fromSchema(t).serializeFragment(e), r = document.implementation.createHTMLDocument().createElement("div");
	return r.appendChild(n), r.innerHTML;
}
var Lf = (e, t = 500) => {
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
function Rf(e) {
	return Object.prototype.toString.call(e) === "[object RegExp]";
}
var zf = class {
	constructor(e) {
		this.find = e.find, this.handler = e.handler;
	}
}, Bf = (e, t) => {
	if (Rf(t)) return t.exec(e);
	let n = t(e);
	if (!n) return null;
	let r = [n.text];
	return r.index = n.index, r.input = e, r.data = n.data, n.replaceWith && (n.text.includes(n.replaceWith) || console.warn("[tiptap warn]: \"inputRuleMatch.replaceWith\" must be part of \"inputRuleMatch.text\"."), r.push(n.replaceWith)), r;
};
function Vf(e) {
	let { editor: t, from: n, to: r, text: i, rules: a, plugin: o } = e, { view: s } = t;
	if (s.composing) return !1;
	let c = s.state.doc.resolve(n);
	if (c.parent.type.spec.code || (c.nodeBefore || c.nodeAfter)?.marks.find((e) => e.type.spec.code)) return !1;
	let l = !1, u = Lf(c) + i;
	return a.forEach((e) => {
		if (l) return;
		let a = Bf(u, e.find);
		if (!a) return;
		let c = s.state.tr, d = bf({
			state: s.state,
			transaction: c
		}), f = {
			from: n - (a[0].length - i.length),
			to: r
		}, { commands: p, chain: m, can: h } = new xf({
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
function Hf(e) {
	let { editor: t, rules: n } = e, r = new Xo({
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
					e = typeof e == "string" ? e : If(M.from(e), a.schema);
					let { from: i } = s;
					Vf({
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
				return Vf({
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
				i && Vf({
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
				return a ? Vf({
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
function Uf(e) {
	return Object.prototype.toString.call(e).slice(8, -1);
}
function Wf(e) {
	return Uf(e) === "Object" ? e.constructor === Object && Object.getPrototypeOf(e) === Object.prototype : !1;
}
function Gf(e, t) {
	let n = { ...e };
	return Wf(e) && Wf(t) && Object.keys(t).forEach((r) => {
		Wf(t[r]) && Wf(e[r]) ? n[r] = Gf(e[r], t[r]) : n[r] = t[r];
	}), n;
}
var Kf = class e {
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
			addOptions: () => Gf(this.options, e)
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
function qf(e) {
	return typeof e == "number";
}
var Jf = class {
	constructor(e) {
		this.find = e.find, this.handler = e.handler;
	}
}, Yf = (e, t, n) => {
	if (Rf(t)) return [...e.matchAll(t)];
	let r = t(e, n);
	return r ? r.map((t) => {
		let n = [t.text];
		return n.index = t.index, n.input = e, n.data = t.data, t.replaceWith && (t.text.includes(t.replaceWith) || console.warn("[tiptap warn]: \"pasteRuleMatch.replaceWith\" must be part of \"pasteRuleMatch.text\"."), n.push(t.replaceWith)), n;
	}) : [];
};
function Xf(e) {
	let { editor: t, state: n, from: r, to: i, rule: a, pasteEvent: o, dropEvent: s } = e, { commands: c, chain: l, can: u } = new xf({
		editor: t,
		state: n
	}), d = [];
	return n.doc.nodesBetween(r, i, (e, t) => {
		if (!e.isTextblock || e.type.spec.code) return;
		let f = Math.max(r, t), p = Math.min(i, t + e.content.size);
		Yf(e.textBetween(f - t, p - t, void 0, "￼"), a.find, o).forEach((e) => {
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
var Zf = null, Qf = (e) => {
	var t;
	let n = new ClipboardEvent("paste", { clipboardData: new DataTransfer() });
	return (t = n.clipboardData) == null || t.setData("text/html", e), n;
};
function $f(e) {
	let { editor: t, rules: n } = e, r = null, i = !1, a = !1, o = typeof ClipboardEvent < "u" ? new ClipboardEvent("paste") : null, s;
	try {
		s = typeof DragEvent < "u" ? new DragEvent("drop") : null;
	} catch {
		s = null;
	}
	let c = ({ state: e, from: n, to: r, rule: i, pasteEvt: a }) => {
		let c = e.tr;
		if (!(!Xf({
			editor: t,
			state: bf({
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
	return n.map((e) => new Xo({
		view(e) {
			let n = (n) => {
				r = e.dom.parentElement?.contains(n.target) ? e.dom.parentElement : null, r && (Zf = t);
			}, i = () => {
				Zf && (Zf = null);
			};
			return window.addEventListener("dragstart", n), window.addEventListener("dragend", i), { destroy() {
				window.removeEventListener("dragstart", n), window.removeEventListener("dragend", i);
			} };
		},
		props: { handleDOMEvents: {
			drop: (e, t) => {
				if (a = r === e.dom.parentElement, s = t, !a) {
					let e = Zf;
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
				t = typeof t == "string" ? t : If(M.from(t), r.schema);
				let { from: n } = d, i = n + t.length, a = Qf(t);
				return c({
					rule: e,
					state: r,
					from: n,
					to: { b: i },
					pasteEvt: a
				});
			}
			let p = n.doc.content.findDiffStart(r.doc.content), m = n.doc.content.findDiffEnd(r.doc.content);
			if (!(!qf(p) || !m || p === m.b)) return c({
				rule: e,
				state: r,
				from: p,
				to: m,
				pasteEvt: o
			});
		}
	}));
}
function ep(e) {
	let t = e.filter((t, n) => e.indexOf(t) !== n);
	return Array.from(new Set(t));
}
var tp = class e {
	constructor(t, n) {
		this.splittableMarks = [], this.editor = n, this.extensions = e.resolve(t), this.schema = Nf(this.extensions, n), this.setupExtensions();
	}
	static resolve(t) {
		let n = e.sort(e.flatten(t)), r = ep(n.map((e) => e.name));
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
				type: Pf(t.name, this.schema)
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
				type: Pf(e.name, this.schema)
			}, a = [], o = X(e, "addKeyboardShortcuts", n), s = {};
			if (e.type === "mark" && X(e, "exitable", n) && (s.ArrowRight = () => Kf.handleExit({
				editor: t,
				mark: e
			})), o) {
				let e = Object.fromEntries(Object.entries(o()).map(([e, n]) => [e, () => n({ editor: t })]));
				s = {
					...s,
					...e
				};
			}
			let c = Od(s);
			a.push(c);
			let l = X(e, "addInputRules", n);
			Ff(e, t.options.enableInputRules) && l && r.push(...l());
			let u = X(e, "addPasteRules", n);
			Ff(e, t.options.enablePasteRules) && u && i.push(...u());
			let d = X(e, "addProseMirrorPlugins", n);
			if (d) {
				let e = d();
				a.push(...e);
			}
			return a;
		}).flat();
		return [
			Hf({
				editor: t,
				rules: r
			}),
			...$f({
				editor: t,
				rules: i
			}),
			...a
		];
	}
	get attributes() {
		return wf(this.extensions);
	}
	get nodeViews() {
		let { editor: e } = this, { nodeExtensions: t } = Cf(this.extensions);
		return Object.fromEntries(t.filter((e) => !!X(e, "addNodeView")).map((t) => {
			let n = this.attributes.filter((e) => e.type === t.name), r = X(t, "addNodeView", {
				name: t.name,
				options: t.options,
				storage: t.storage,
				editor: e,
				type: Tf(t.name, this.schema)
			});
			return r ? [t.name, (i, a, o, s, c) => {
				let l = Df(i, n);
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
				type: Pf(e.name, this.schema)
			};
			e.type === "mark" && (Z(X(e, "keepOnSplit", t)) ?? !0) && this.splittableMarks.push(e.name);
			let n = X(e, "onBeforeCreate", t), r = X(e, "onCreate", t), i = X(e, "onUpdate", t), a = X(e, "onSelectionUpdate", t), o = X(e, "onTransaction", t), s = X(e, "onFocus", t), c = X(e, "onBlur", t), l = X(e, "onDestroy", t);
			n && this.editor.on("beforeCreate", n), r && this.editor.on("create", r), i && this.editor.on("update", i), a && this.editor.on("selectionUpdate", a), o && this.editor.on("transaction", o), s && this.editor.on("focus", s), c && this.editor.on("blur", c), l && this.editor.on("destroy", l);
		});
	}
}, np = class e {
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
			addOptions: () => Gf(this.options, e)
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
function rp(e, t, n) {
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
function ip(e) {
	return Object.fromEntries(Object.entries(e.nodes).filter(([, e]) => e.spec.toText).map(([e, t]) => [e, t.spec.toText]));
}
var ap = np.create({
	name: "clipboardTextSerializer",
	addOptions() {
		return { blockSeparator: void 0 };
	},
	addProseMirrorPlugins() {
		return [new Xo({
			key: new $o("clipboardTextSerializer"),
			props: { clipboardTextSerializer: () => {
				let { editor: e } = this, { state: t, schema: n } = e, { doc: r, selection: i } = t, { ranges: a } = i, o = Math.min(...a.map((e) => e.$from.pos)), s = Math.max(...a.map((e) => e.$to.pos)), c = ip(n);
				return rp(r, {
					from: o,
					to: s
				}, {
					...this.options.blockSeparator === void 0 ? {} : { blockSeparator: this.options.blockSeparator },
					textSerializers: c
				});
			} }
		})];
	}
}), op = () => ({ editor: e, view: t }) => (requestAnimationFrame(() => {
	var n;
	e.isDestroyed || (t.dom.blur(), (n = window == null ? void 0 : window.getSelection()) == null || n.removeAllRanges());
}), !0), sp = (e = !1) => ({ commands: t }) => t.setContent("", e), cp = () => ({ state: e, tr: t, dispatch: n }) => {
	let { selection: r } = t, { ranges: i } = r;
	return n && i.forEach(({ $from: n, $to: r }) => {
		e.doc.nodesBetween(n.pos, r.pos, (e, n) => {
			if (e.type.isText) return;
			let { doc: r, mapping: i } = t, a = r.resolve(i.map(n)), o = r.resolve(i.map(n + e.nodeSize)), s = a.blockRange(o);
			if (!s) return;
			let c = Ga(s);
			if (e.type.isTextblock) {
				let { defaultType: e } = a.parent.contentMatchAt(a.index());
				t.setNodeMarkup(s.start, e);
			}
			(c || c === 0) && t.lift(s, c);
		});
	}), !0;
}, lp = (e) => (t) => e(t), up = () => ({ state: e, dispatch: t }) => Jd(e, t), dp = (e, t) => ({ editor: n, tr: r }) => {
	let { state: i } = n, a = i.doc.slice(e.from, e.to);
	r.deleteRange(e.from, e.to);
	let o = r.mapping.map(t);
	return r.insert(o, a.content), r.setSelection(new z(r.doc.resolve(Math.max(o - 1, 0)))), !0;
}, fp = () => ({ tr: e, dispatch: t }) => {
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
}, pp = (e) => ({ tr: t, state: n, dispatch: r }) => {
	let i = Tf(e, n.schema), a = t.selection.$anchor;
	for (let e = a.depth; e > 0; --e) if (a.node(e).type === i) {
		if (r) {
			let n = a.before(e), r = a.after(e);
			t.delete(n, r).scrollIntoView();
		}
		return !0;
	}
	return !1;
}, mp = (e) => ({ tr: t, dispatch: n }) => {
	let { from: r, to: i } = e;
	return n && t.delete(r, i), !0;
}, hp = () => ({ state: e, dispatch: t }) => Ad(e, t), gp = () => ({ commands: e }) => e.keyboardShortcut("Enter"), _p = () => ({ state: e, dispatch: t }) => qd(e, t);
function vp(e, t, n = { strict: !0 }) {
	let r = Object.keys(t);
	return r.length ? r.every((r) => n.strict ? t[r] === e[r] : Rf(t[r]) ? t[r].test(e[r]) : t[r] === e[r]) : !0;
}
function yp(e, t, n = {}) {
	return e.find((e) => e.type === t && vp(Object.fromEntries(Object.keys(n).map((t) => [t, e.attrs[t]])), n));
}
function bp(e, t, n = {}) {
	return !!yp(e, t, n);
}
function xp(e, t, n) {
	if (!e || !t) return;
	let r = e.parent.childAfter(e.parentOffset);
	if ((!r.node || !r.node.marks.some((e) => e.type === t)) && (r = e.parent.childBefore(e.parentOffset)), !r.node || !r.node.marks.some((e) => e.type === t) || (n = n || r.node.marks[0]?.attrs, !yp([...r.node.marks], t, n))) return;
	let i = r.index, a = e.start() + r.offset, o = i + 1, s = a + r.node.nodeSize;
	for (; i > 0 && bp([...e.parent.child(i - 1).marks], t, n);) --i, a -= e.parent.child(i).nodeSize;
	for (; o < e.parent.childCount && bp([...e.parent.child(o).marks], t, n);) s += e.parent.child(o).nodeSize, o += 1;
	return {
		from: a,
		to: s
	};
}
function Sp(e, t) {
	if (typeof e == "string") {
		if (!t.marks[e]) throw Error(`There is no mark type named '${e}'. Maybe you forgot to add the extension?`);
		return t.marks[e];
	}
	return e;
}
var Cp = (e, t = {}) => ({ tr: n, state: r, dispatch: i }) => {
	let a = Sp(e, r.schema), { doc: o, selection: s } = n, { $from: c, from: l, to: u } = s;
	if (i) {
		let e = xp(c, a, t);
		if (e && e.from <= l && e.to >= u) {
			let t = z.create(o, e.from, e.to);
			n.setSelection(t);
		}
	}
	return !0;
}, wp = (e) => (t) => {
	let n = typeof e == "function" ? e(t) : e;
	for (let e = 0; e < n.length; e += 1) if (n[e](t)) return !0;
	return !1;
};
function Tp(e) {
	return e instanceof z;
}
function Ep(e = 0, t = 0, n = 0) {
	return Math.min(Math.max(e, t), n);
}
function Dp(e, t = null) {
	if (!t) return null;
	let n = R.atStart(e), r = R.atEnd(e);
	if (t === "start" || t === !0) return n;
	if (t === "end") return r;
	let i = n.from, a = r.to;
	return t === "all" ? z.create(e, Ep(0, i, a), Ep(e.content.size, i, a)) : z.create(e, Ep(t, i, a), Ep(t, i, a));
}
function Op() {
	return navigator.platform === "Android" || /android/i.test(navigator.userAgent);
}
function kp() {
	return [
		"iPad Simulator",
		"iPhone Simulator",
		"iPod Simulator",
		"iPad",
		"iPhone",
		"iPod"
	].includes(navigator.platform) || navigator.userAgent.includes("Mac") && "ontouchend" in document;
}
function Ap() {
	return typeof navigator < "u" ? /^((?!chrome|android).)*safari/i.test(navigator.userAgent) : !1;
}
var jp = (e = null, t = {}) => ({ editor: n, view: r, tr: i, dispatch: a }) => {
	t = {
		scrollIntoView: !0,
		...t
	};
	let o = () => {
		(kp() || Op()) && r.dom.focus(), requestAnimationFrame(() => {
			n.isDestroyed || (r.focus(), Ap() && !kp() && !Op() && r.dom.focus({ preventScroll: !0 }));
		});
	};
	if (r.hasFocus() && e === null || e === !1) return !0;
	if (a && e === null && !Tp(n.state.selection)) return o(), !0;
	let s = Dp(i.doc, e) || n.state.selection, c = n.state.selection.eq(s);
	return a && (c || i.setSelection(s), c && i.storedMarks && i.setStoredMarks(i.storedMarks), o()), !0;
}, Mp = (e, t) => (n) => e.every((e, r) => t(e, {
	...n,
	index: r
})), Np = (e, t) => ({ tr: n, commands: r }) => r.insertContentAt({
	from: n.selection.from,
	to: n.selection.to
}, e, t), Pp = (e) => {
	let t = e.childNodes;
	for (let n = t.length - 1; n >= 0; --n) {
		let r = t[n];
		r.nodeType === 3 && r.nodeValue && /^(\n\s\s|\n)$/.test(r.nodeValue) ? e.removeChild(r) : r.nodeType === 1 && Pp(r);
	}
	return e;
};
function Fp(e) {
	let t = `<body>${e}</body>`, n = new window.DOMParser().parseFromString(t, "text/html").body;
	return Pp(n);
}
function Ip(e, t, n) {
	if (e instanceof Ci || e instanceof M) return e;
	n = {
		slice: !0,
		parseOptions: {},
		...n
	};
	let r = typeof e == "object" && !!e, i = typeof e == "string";
	if (r) try {
		if (Array.isArray(e) && e.length > 0) return M.fromArray(e.map((e) => t.nodeFromJSON(e)));
		let r = t.nodeFromJSON(e);
		return n.errorOnInvalidContent && r.check(), r;
	} catch (r) {
		if (n.errorOnInvalidContent) throw Error("[tiptap error]: Invalid JSON content", { cause: r });
		return console.warn("[tiptap warn]: Invalid content.", "Passed value:", e, "Error:", r), Ip("", t, n);
	}
	if (i) {
		if (n.errorOnInvalidContent) {
			let r = !1, i = "", a = new qi({
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
			if (n.slice ? Zi.fromSchema(a).parseSlice(Fp(e), n.parseOptions) : Zi.fromSchema(a).parse(Fp(e), n.parseOptions), n.errorOnInvalidContent && r) throw Error("[tiptap error]: Invalid HTML content", { cause: /* @__PURE__ */ Error(`Invalid element found: ${i}`) });
		}
		let r = Zi.fromSchema(t);
		return n.slice ? r.parseSlice(Fp(e), n.parseOptions).content : r.parse(Fp(e), n.parseOptions);
	}
	return Ip("", t, n);
}
function Lp(e, t, n) {
	let r = e.steps.length - 1;
	if (r < t) return;
	let i = e.steps[r];
	if (!(i instanceof Ra || i instanceof za)) return;
	let a = e.mapping.maps[r], o = 0;
	a.forEach((e, t, n, r) => {
		o === 0 && (o = r);
	}), e.setSelection(R.near(e.doc.resolve(o), n));
}
var Rp = (e) => !("type" in e), zp = (e, t, n) => ({ tr: r, dispatch: i, editor: a }) => {
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
			Ip(t, a.schema, {
				parseOptions: s,
				errorOnInvalidContent: !0
			});
		} catch (e) {
			o(e);
		}
		try {
			i = Ip(t, a.schema, {
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
		if ((Rp(i) ? i : [i]).forEach((e) => {
			e.check(), u = u ? e.isText && e.marks.length === 0 : !1, d = d ? e.isBlock : !1;
		}), c === l && d) {
			let { parent: e } = r.doc.resolve(c);
			e.isTextblock && !e.type.spec.code && !e.childCount && (--c, l += 1);
		}
		let f;
		if (u) {
			if (Array.isArray(t)) f = t.map((e) => e.text || "").join("");
			else if (t instanceof M) {
				let e = "";
				t.forEach((t) => {
					t.text && (e += t.text);
				}), f = e;
			} else f = typeof t == "object" && t && t.text ? t.text : t;
			r.insertText(f, c, l);
		} else f = i, r.replaceWith(c, l, f);
		n.updateSelection && Lp(r, r.steps.length - 1, -1), n.applyInputRules && r.setMeta("applyInputRules", {
			from: c,
			text: f
		}), n.applyPasteRules && r.setMeta("applyPasteRules", {
			from: c,
			text: f
		});
	}
	return !0;
}, Bp = () => ({ state: e, dispatch: t }) => Hd(e, t), Vp = () => ({ state: e, dispatch: t }) => Ud(e, t), Hp = () => ({ state: e, dispatch: t }) => Md(e, t), Up = () => ({ state: e, dispatch: t }) => zd(e, t), Wp = () => ({ state: e, dispatch: t, tr: n }) => {
	try {
		let r = co(e.doc, e.selection.$from.pos, -1);
		return r == null ? !1 : (n.join(r, 2), t && t(n), !0);
	} catch {
		return !1;
	}
}, Gp = () => ({ state: e, dispatch: t, tr: n }) => {
	try {
		let r = co(e.doc, e.selection.$from.pos, 1);
		return r == null ? !1 : (n.join(r, 2), t && t(n), !0);
	} catch {
		return !1;
	}
}, Kp = () => ({ state: e, dispatch: t }) => Nd(e, t), qp = () => ({ state: e, dispatch: t }) => Pd(e, t);
function Jp() {
	return typeof navigator < "u" ? /Mac/.test(navigator.platform) : !1;
}
function Yp(e) {
	let t = e.split(/-(?!$)/), n = t[t.length - 1];
	n === "Space" && (n = " ");
	let r, i, a, o;
	for (let e = 0; e < t.length - 1; e += 1) {
		let n = t[e];
		if (/^(cmd|meta|m)$/i.test(n)) o = !0;
		else if (/^a(lt)?$/i.test(n)) r = !0;
		else if (/^(c|ctrl|control)$/i.test(n)) i = !0;
		else if (/^s(hift)?$/i.test(n)) a = !0;
		else if (/^mod$/i.test(n)) kp() || Jp() ? o = !0 : i = !0;
		else throw Error(`Unrecognized modifier name: ${n}`);
	}
	return r && (n = `Alt-${n}`), i && (n = `Ctrl-${n}`), o && (n = `Meta-${n}`), a && (n = `Shift-${n}`), n;
}
var Xp = (e) => ({ editor: t, view: n, tr: r, dispatch: i }) => {
	let a = Yp(e).split(/-(?!$)/), o = a.find((e) => ![
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
function Zp(e, t, n = {}) {
	let { from: r, to: i, empty: a } = e.selection, o = t ? Tf(t, e.schema) : null, s = [];
	e.doc.nodesBetween(r, i, (e, t) => {
		if (e.isText) return;
		let n = Math.max(r, t), a = Math.min(i, t + e.nodeSize);
		s.push({
			node: e,
			from: n,
			to: a
		});
	});
	let c = i - r, l = s.filter((e) => o ? o.name === e.node.type.name : !0).filter((e) => vp(e.node.attrs, n, { strict: !1 }));
	return a ? !!l.length : l.reduce((e, t) => e + t.to - t.from, 0) >= c;
}
var Qp = (e, t = {}) => ({ state: n, dispatch: r }) => Zp(n, Tf(e, n.schema), t) ? Wd(n, r) : !1, $p = () => ({ state: e, dispatch: t }) => Yd(e, t), em = (e) => ({ state: t, dispatch: n }) => gf(Tf(e, t.schema))(t, n), tm = () => ({ state: e, dispatch: t }) => Gd(e, t);
function nm(e, t) {
	return t.nodes[e] ? "node" : t.marks[e] ? "mark" : null;
}
function rm(e, t) {
	let n = typeof t == "string" ? [t] : t;
	return Object.keys(e).reduce((t, r) => (n.includes(r) || (t[r] = e[r]), t), {});
}
var im = (e, t) => ({ tr: n, state: r, dispatch: i }) => {
	let a = null, o = null, s = nm(typeof e == "string" ? e : e.name, r.schema);
	return s ? (s === "node" && (a = Tf(e, r.schema)), s === "mark" && (o = Sp(e, r.schema)), i && n.selection.ranges.forEach((e) => {
		r.doc.nodesBetween(e.$from.pos, e.$to.pos, (e, r) => {
			a && a === e.type && n.setNodeMarkup(r, void 0, rm(e.attrs, t)), o && e.marks.length && e.marks.forEach((i) => {
				o === i.type && n.addMark(r, r + e.nodeSize, o.create(rm(i.attrs, t)));
			});
		});
	}), !0) : !1;
}, am = () => ({ tr: e, dispatch: t }) => (t && e.scrollIntoView(), !0), om = () => ({ tr: e, dispatch: t }) => {
	if (t) {
		let t = new Io(e.doc);
		e.setSelection(t);
	}
	return !0;
}, sm = () => ({ state: e, dispatch: t }) => Ld(e, t), cm = () => ({ state: e, dispatch: t }) => Bd(e, t), lm = () => ({ state: e, dispatch: t }) => Qd(e, t), um = () => ({ state: e, dispatch: t }) => af(e, t), dm = () => ({ state: e, dispatch: t }) => rf(e, t);
function fm(e, t, n = {}, r = {}) {
	return Ip(e, t, {
		slice: !1,
		parseOptions: n,
		errorOnInvalidContent: r.errorOnInvalidContent
	});
}
var pm = (e, t = !1, n = {}, r = {}) => ({ editor: i, tr: a, dispatch: o, commands: s }) => {
	let { doc: c } = a;
	if (n.preserveWhitespace !== "full") {
		let s = fm(e, i.schema, n, { errorOnInvalidContent: r.errorOnInvalidContent ?? i.options.enableContentCheck });
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
function mm(e, t) {
	let n = Sp(t, e.schema), { from: r, to: i, empty: a } = e.selection, o = [];
	a ? (e.storedMarks && o.push(...e.storedMarks), o.push(...e.selection.$head.marks())) : e.doc.nodesBetween(r, i, (e) => {
		o.push(...e.marks);
	});
	let s = o.find((e) => e.type.name === n.name);
	return s ? { ...s.attrs } : {};
}
function hm(e, t) {
	let n = new ko(e);
	return t.forEach((e) => {
		e.steps.forEach((e) => {
			n.step(e);
		});
	}), n;
}
function gm(e) {
	for (let t = 0; t < e.edgeCount; t += 1) {
		let { type: n } = e.edge(t);
		if (n.isTextblock && !n.hasRequiredAttrs()) return n;
	}
	return null;
}
function _m(e, t, n) {
	let r = [];
	return e.nodesBetween(t.from, t.to, (e, t) => {
		n(e) && r.push({
			node: e,
			pos: t
		});
	}), r;
}
function vm(e, t) {
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
function ym(e) {
	return (t) => vm(t.$from, e);
}
function bm(e, t) {
	return rp(e, {
		from: 0,
		to: e.content.size
	}, t);
}
function xm(e, t) {
	let n = Tf(t, e.schema), { from: r, to: i } = e.selection, a = [];
	e.doc.nodesBetween(r, i, (e) => {
		a.push(e);
	});
	let o = a.reverse().find((e) => e.type.name === n.name);
	return o ? { ...o.attrs } : {};
}
function Sm(e, t) {
	let n = nm(typeof t == "string" ? t : t.name, e.schema);
	return n === "node" ? xm(e, t) : n === "mark" ? mm(e, t) : {};
}
function Cm(e, t = JSON.stringify) {
	let n = {};
	return e.filter((e) => {
		let r = t(e);
		return Object.prototype.hasOwnProperty.call(n, r) ? !1 : n[r] = !0;
	});
}
function wm(e) {
	let t = Cm(e);
	return t.length === 1 ? t : t.filter((e, n) => !t.filter((e, t) => t !== n).some((t) => e.oldRange.from >= t.oldRange.from && e.oldRange.to <= t.oldRange.to && e.newRange.from >= t.newRange.from && e.newRange.to <= t.newRange.to));
}
function Tm(e) {
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
	}), wm(r);
}
function Em(e, t, n) {
	let r = [];
	return e === t ? n.resolve(e).marks().forEach((t) => {
		let i = xp(n.resolve(e), t.type);
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
function Dm(e, t, n) {
	return Object.fromEntries(Object.entries(n).filter(([n]) => {
		let r = e.find((e) => e.type === t && e.name === n);
		return r ? r.attribute.keepOnSplit : !1;
	}));
}
function Om(e, t, n = {}) {
	let { empty: r, ranges: i } = e.selection, a = t ? Sp(t, e.schema) : null;
	if (r) return !!(e.storedMarks || e.selection.$from.marks()).filter((e) => a ? a.name === e.type.name : !0).find((e) => vp(e.attrs, n, { strict: !1 }));
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
	let c = s.filter((e) => a ? a.name === e.mark.type.name : !0).filter((e) => vp(e.mark.attrs, n, { strict: !1 })).reduce((e, t) => e + t.to - t.from, 0), l = s.filter((e) => a ? e.mark.type !== a && e.mark.type.excludes(a) : !0).reduce((e, t) => e + t.to - t.from, 0);
	return (c > 0 ? c + l : c) >= o;
}
function km(e, t, n = {}) {
	if (!t) return Zp(e, null, n) || Om(e, null, n);
	let r = nm(t, e.schema);
	return r === "node" ? Zp(e, t, n) : r === "mark" ? Om(e, t, n) : !1;
}
function Am(e, t) {
	let { nodeExtensions: n } = Cf(t), r = n.find((t) => t.name === e);
	if (!r) return !1;
	let i = Z(X(r, "group", {
		name: r.name,
		options: r.options,
		storage: r.storage
	}));
	return typeof i == "string" ? i.split(" ").includes("list") : !1;
}
function jm(e, { checkChildren: t = !0, ignoreWhitespace: n = !1 } = {}) {
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
			r !== !1 && (jm(e, {
				ignoreWhitespace: n,
				checkChildren: t
			}) || (r = !1));
		}), r;
	}
	return !1;
}
function Mm(e) {
	return e instanceof B;
}
function Nm(e, t, n) {
	let { selection: r } = t, i = null;
	if (Tp(r) && (i = r.$cursor), i) {
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
var Pm = (e, t = {}) => ({ tr: n, state: r, dispatch: i }) => {
	let { selection: a } = n, { empty: o, ranges: s } = a, c = Sp(e, r.schema);
	if (i) if (o) {
		let e = mm(r, c);
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
	return Nm(r, n, c);
}, Fm = (e, t) => ({ tr: n }) => (n.setMeta(e, t), !0), Im = (e, t = {}) => ({ state: n, dispatch: r, chain: i }) => {
	let a = Tf(e, n.schema), o;
	return n.selection.$anchor.sameParent(n.selection.$head) && (o = n.selection.$anchor.parent.attrs), a.isTextblock ? i().command(({ commands: e }) => sf(a, {
		...o,
		...t
	})(n) ? !0 : e.clearNodes()).command(({ state: e }) => sf(a, {
		...o,
		...t
	})(e, r)).run() : (console.warn("[tiptap warn]: Currently \"setNode()\" only supports text block nodes."), !1);
}, Lm = (e) => ({ tr: t, dispatch: n }) => {
	if (n) {
		let { doc: n } = t, r = Ep(e, 0, n.content.size), i = B.create(n, r);
		t.setSelection(i);
	}
	return !0;
}, Rm = (e) => ({ tr: t, dispatch: n }) => {
	if (n) {
		let { doc: n } = t, { from: r, to: i } = typeof e == "number" ? {
			from: e,
			to: e
		} : e, a = z.atStart(n).from, o = z.atEnd(n).to, s = Ep(r, a, o), c = Ep(i, a, o), l = z.create(n, s, c);
		t.setSelection(l);
	}
	return !0;
}, zm = (e) => ({ state: t, dispatch: n }) => yf(Tf(e, t.schema))(t, n);
function Bm(e, t) {
	let n = e.storedMarks || e.selection.$to.parentOffset && e.selection.$from.marks();
	if (n) {
		let r = n.filter((e) => t?.includes(e.type.name));
		e.tr.ensureMarks(r);
	}
}
var Vm = ({ keepMarks: e = !0 } = {}) => ({ tr: t, state: n, dispatch: r, editor: i }) => {
	let { selection: a, doc: o } = t, { $from: s, $to: c } = a, l = i.extensionManager.attributes, u = Dm(l, s.node().type.name, s.node().attrs);
	if (a instanceof B && a.node.isBlock) return !s.parentOffset || !ro(o, s.pos) ? !1 : (r && (e && Bm(n, i.extensionManager.splittableMarks), t.split(s.pos).scrollIntoView()), !0);
	if (!s.parent.isBlock) return !1;
	let d = c.parentOffset === c.parent.content.size, f = s.depth === 0 ? void 0 : gm(s.node(-1).contentMatchAt(s.indexAfter(-1))), p = d && f ? [{
		type: f,
		attrs: u
	}] : void 0, m = ro(t.doc, t.mapping.map(s.pos), 1, p);
	if (!p && !m && ro(t.doc, t.mapping.map(s.pos), 1, f ? [{ type: f }] : void 0) && (m = !0, p = f ? [{
		type: f,
		attrs: u
	}] : void 0), r) {
		if (m && (a instanceof z && t.deleteSelection(), t.split(t.mapping.map(s.pos), 1, p), f && !d && !s.parentOffset && s.parent.type !== f)) {
			let e = t.mapping.map(s.before()), n = t.doc.resolve(e);
			s.node(-1).canReplaceWith(n.index(), n.index() + 1, f) && t.setNodeMarkup(t.mapping.map(s.before()), f);
		}
		e && Bm(n, i.extensionManager.splittableMarks), t.scrollIntoView();
	}
	return m;
}, Hm = (e, t = {}) => ({ tr: n, state: r, dispatch: i, editor: a }) => {
	let o = Tf(e, r.schema), { $from: s, $to: c } = r.selection, l = r.selection.node;
	if (l && l.isBlock || s.depth < 2 || !s.sameParent(c)) return !1;
	let u = s.node(-1);
	if (u.type !== o) return !1;
	let d = a.extensionManager.attributes;
	if (s.parent.content.size === 0 && s.node(-1).childCount === s.indexAfter(-1)) {
		if (s.depth === 2 || s.node(-3).type !== o || s.index(-2) !== s.node(-2).childCount - 1) return !1;
		if (i) {
			let e = M.empty, r = s.index(-1) ? 1 : s.index(-2) ? 2 : 3;
			for (let t = s.depth - r; t >= s.depth - 3; --t) e = M.from(s.node(t).copy(e));
			let i = s.indexAfter(-1) < s.node(-2).childCount ? 1 : s.indexAfter(-2) < s.node(-3).childCount ? 2 : 3, a = {
				...Dm(d, s.node().type.name, s.node().attrs),
				...t
			}, c = o.contentMatch.defaultType?.createAndFill(a) || void 0;
			e = e.append(M.from(o.createAndFill(null, c) || void 0));
			let l = s.before(s.depth - (r - 1));
			n.replace(l, s.after(-i), new P(e, 4 - r, 0));
			let u = -1;
			n.doc.nodesBetween(l, n.doc.content.size, (e, t) => {
				if (u > -1) return !1;
				e.isTextblock && e.content.size === 0 && (u = t + 1);
			}), u > -1 && n.setSelection(z.near(n.doc.resolve(u))), n.scrollIntoView();
		}
		return !0;
	}
	let f = c.pos === s.end() ? u.contentMatchAt(0).defaultType : null, p = {
		...Dm(d, u.type.name, u.attrs),
		...t
	}, m = {
		...Dm(d, s.node().type.name, s.node().attrs),
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
	if (!ro(n.doc, s.pos, 2)) return !1;
	if (i) {
		let { selection: e, storedMarks: t } = r, { splittableMarks: o } = a.extensionManager, c = t || e.$to.parentOffset && e.$from.marks();
		if (n.split(s.pos, 2, h).scrollIntoView(), !c || !i) return !0;
		let l = c.filter((e) => o.includes(e.type.name));
		n.ensureMarks(l);
	}
	return !0;
}, Um = (e, t) => {
	let n = ym((e) => e.type === t)(e.selection);
	if (!n) return !0;
	let r = e.doc.resolve(Math.max(0, n.pos - 1)).before(n.depth);
	if (r === void 0) return !0;
	let i = e.doc.nodeAt(r);
	return n.node.type === i?.type && ao(e.doc, n.pos) && e.join(n.pos), !0;
}, Wm = (e, t) => {
	let n = ym((e) => e.type === t)(e.selection);
	if (!n) return !0;
	let r = e.doc.resolve(n.start).after(n.depth);
	if (r === void 0) return !0;
	let i = e.doc.nodeAt(r);
	return n.node.type === i?.type && ao(e.doc, r) && e.join(r), !0;
}, Gm = /* @__PURE__ */ Object.freeze({
	__proto__: null,
	blur: op,
	clearContent: sp,
	clearNodes: cp,
	command: lp,
	createParagraphNear: up,
	cut: dp,
	deleteCurrentNode: fp,
	deleteNode: pp,
	deleteRange: mp,
	deleteSelection: hp,
	enter: gp,
	exitCode: _p,
	extendMarkRange: Cp,
	first: wp,
	focus: jp,
	forEach: Mp,
	insertContent: Np,
	insertContentAt: zp,
	joinBackward: Hp,
	joinDown: Vp,
	joinForward: Up,
	joinItemBackward: Wp,
	joinItemForward: Gp,
	joinTextblockBackward: Kp,
	joinTextblockForward: qp,
	joinUp: Bp,
	keyboardShortcut: Xp,
	lift: Qp,
	liftEmptyBlock: $p,
	liftListItem: em,
	newlineInCode: tm,
	resetAttributes: im,
	scrollIntoView: am,
	selectAll: om,
	selectNodeBackward: sm,
	selectNodeForward: cm,
	selectParentNode: lm,
	selectTextblockEnd: um,
	selectTextblockStart: dm,
	setContent: pm,
	setMark: Pm,
	setMeta: Fm,
	setNode: Im,
	setNodeSelection: Lm,
	setTextSelection: Rm,
	sinkListItem: zm,
	splitBlock: Vm,
	splitListItem: Hm,
	toggleList: (e, t, n, r = {}) => ({ editor: i, tr: a, state: o, dispatch: s, chain: c, commands: l, can: u }) => {
		let { extensions: d, splittableMarks: f } = i.extensionManager, p = Tf(e, o.schema), m = Tf(t, o.schema), { selection: h, storedMarks: g } = o, { $from: _, $to: v } = h, y = _.blockRange(v), b = g || h.$to.parentOffset && h.$from.marks();
		if (!y) return !1;
		let x = ym((e) => Am(e.type.name, d))(h);
		if (y.depth >= 1 && x && y.depth - x.depth <= 1) {
			if (x.node.type === p) return l.liftListItem(m);
			if (Am(x.node.type.name, d) && p.validContent(x.node.content) && s) return c().command(() => (a.setNodeMarkup(x.pos, p), !0)).command(() => Um(a, p)).command(() => Wm(a, p)).run();
		}
		return !n || !b || !s ? c().command(() => u().wrapInList(p, r) ? !0 : l.clearNodes()).wrapInList(p, r).command(() => Um(a, p)).command(() => Wm(a, p)).run() : c().command(() => {
			let e = u().wrapInList(p, r), t = b.filter((e) => f.includes(e.type.name));
			return a.ensureMarks(t), e ? !0 : l.clearNodes();
		}).wrapInList(p, r).command(() => Um(a, p)).command(() => Wm(a, p)).run();
	},
	toggleMark: (e, t = {}, n = {}) => ({ state: r, commands: i }) => {
		let { extendEmptyMarkRange: a = !1 } = n, o = Sp(e, r.schema);
		return Om(r, o, t) ? i.unsetMark(o, { extendEmptyMarkRange: a }) : i.setMark(o, t);
	},
	toggleNode: (e, t, n = {}) => ({ state: r, commands: i }) => {
		let a = Tf(e, r.schema), o = Tf(t, r.schema), s = Zp(r, a, n), c;
		return r.selection.$anchor.sameParent(r.selection.$head) && (c = r.selection.$anchor.parent.attrs), s ? i.setNode(o, c) : i.setNode(a, {
			...c,
			...n
		});
	},
	toggleWrap: (e, t = {}) => ({ state: n, commands: r }) => {
		let i = Tf(e, n.schema);
		return Zp(n, i, t) ? r.lift(i) : r.wrapIn(i, t);
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
		let { extendEmptyMarkRange: a = !1 } = t, { selection: o } = n, s = Sp(e, r.schema), { $from: c, empty: l, ranges: u } = o;
		if (!i) return !0;
		if (l && a) {
			let { from: e, to: t } = o, r = xp(c, s, c.marks().find((e) => e.type === s)?.attrs);
			r && (e = r.from, t = r.to), n.removeMark(e, t, s);
		} else u.forEach((e) => {
			n.removeMark(e.$from.pos, e.$to.pos, s);
		});
		return n.removeStoredMark(s), !0;
	},
	updateAttributes: (e, t = {}) => ({ tr: n, state: r, dispatch: i }) => {
		let a = null, o = null, s = nm(typeof e == "string" ? e : e.name, r.schema);
		return s ? (s === "node" && (a = Tf(e, r.schema)), s === "mark" && (o = Sp(e, r.schema)), i && n.selection.ranges.forEach((e) => {
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
	wrapIn: (e, t = {}) => ({ state: n, dispatch: r }) => of(Tf(e, n.schema), t)(n, r),
	wrapInList: (e, t = {}) => ({ state: n, dispatch: r }) => pf(Tf(e, n.schema), t)(n, r)
}), Km = np.create({
	name: "commands",
	addCommands() {
		return { ...Gm };
	}
}), qm = np.create({
	name: "drop",
	addProseMirrorPlugins() {
		return [new Xo({
			key: new $o("tiptapDrop"),
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
}), Jm = np.create({
	name: "editable",
	addProseMirrorPlugins() {
		return [new Xo({
			key: new $o("editable"),
			props: { editable: () => this.editor.options.editable }
		})];
	}
}), Ym = new $o("focusEvents"), Xm = np.create({
	name: "focusEvents",
	addProseMirrorPlugins() {
		let { editor: e } = this;
		return [new Xo({
			key: Ym,
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
}), Zm = np.create({
	name: "keymap",
	addKeyboardShortcuts() {
		let e = () => this.editor.commands.first(({ commands: e }) => [
			() => e.undoInputRule(),
			() => e.command(({ tr: t }) => {
				let { selection: n, doc: r } = t, { empty: i, $anchor: a } = n, { pos: o, parent: s } = a, c = a.parent.isTextblock && o > 0 ? t.doc.resolve(o - 1) : a, l = c.parent.type.spec.isolating, u = a.pos - a.parentOffset, d = l && c.parent.childCount === 1 ? u === a.pos : R.atStart(r).from === o;
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
		return kp() || Jp() ? i : r;
	},
	addProseMirrorPlugins() {
		return [new Xo({
			key: new $o("clearDocument"),
			appendTransaction: (e, t, n) => {
				if (e.some((e) => e.getMeta("composition"))) return;
				let r = e.some((e) => e.docChanged) && !t.doc.eq(n.doc), i = e.some((e) => e.getMeta("preventClearDocument"));
				if (!r || i) return;
				let { empty: a, from: o, to: s } = t.selection, c = R.atStart(t.doc).from, l = R.atEnd(t.doc).to;
				if (a || !(o === c && s === l) || !jm(n.doc)) return;
				let u = n.tr, d = bf({
					state: n,
					transaction: u
				}), { commands: f } = new xf({
					editor: this.editor,
					state: d
				});
				if (f.clearNodes(), u.steps.length) return u;
			}
		})];
	}
}), Qm = np.create({
	name: "paste",
	addProseMirrorPlugins() {
		return [new Xo({
			key: new $o("tiptapPaste"),
			props: { handlePaste: (e, t, n) => {
				this.editor.emit("paste", {
					editor: this.editor,
					event: t,
					slice: n
				});
			} }
		})];
	}
}), $m = np.create({
	name: "tabindex",
	addProseMirrorPlugins() {
		return [new Xo({
			key: new $o("tabindex"),
			props: { attributes: () => this.editor.isEditable ? { tabindex: "0" } : {} }
		})];
	}
}), eh = class e {
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
}, th = ".ProseMirror {\n  position: relative;\n}\n\n.ProseMirror {\n  word-wrap: break-word;\n  white-space: pre-wrap;\n  white-space: break-spaces;\n  -webkit-font-variant-ligatures: none;\n  font-variant-ligatures: none;\n  font-feature-settings: \"liga\" 0; /* the above doesn't seem to work in Edge */\n}\n\n.ProseMirror [contenteditable=\"false\"] {\n  white-space: normal;\n}\n\n.ProseMirror [contenteditable=\"false\"] [contenteditable=\"true\"] {\n  white-space: pre-wrap;\n}\n\n.ProseMirror pre {\n  white-space: pre-wrap;\n}\n\nimg.ProseMirror-separator {\n  display: inline !important;\n  border: none !important;\n  margin: 0 !important;\n  width: 0 !important;\n  height: 0 !important;\n}\n\n.ProseMirror-gapcursor {\n  display: none;\n  pointer-events: none;\n  position: absolute;\n  margin: 0;\n}\n\n.ProseMirror-gapcursor:after {\n  content: \"\";\n  display: block;\n  position: absolute;\n  top: -2px;\n  width: 20px;\n  border-top: 1px solid black;\n  animation: ProseMirror-cursor-blink 1.1s steps(2, start) infinite;\n}\n\n@keyframes ProseMirror-cursor-blink {\n  to {\n    visibility: hidden;\n  }\n}\n\n.ProseMirror-hideselection *::selection {\n  background: transparent;\n}\n\n.ProseMirror-hideselection *::-moz-selection {\n  background: transparent;\n}\n\n.ProseMirror-hideselection * {\n  caret-color: transparent;\n}\n\n.ProseMirror-focused .ProseMirror-gapcursor {\n  display: block;\n}\n\n.tippy-box[data-animation=fade][data-state=hidden] {\n  opacity: 0\n}";
function nh(e, t, n) {
	let r = document.querySelector(`style[data-tiptap-style${n ? `-${n}` : ""}]`);
	if (r !== null) return r;
	let i = document.createElement("style");
	return t && i.setAttribute("nonce", t), i.setAttribute(`data-tiptap-style${n ? `-${n}` : ""}`, ""), i.innerHTML = e, document.getElementsByTagName("head")[0].appendChild(i), i;
}
var rh = class extends Sf {
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
		this.options.injectCSS && document && (this.css = nh(th, this.options.injectNonce));
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
		let n = Of(t) ? t(e, [...this.state.plugins]) : [...this.state.plugins, e], r = this.state.reconfigure({ plugins: n });
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
			Jm,
			ap.configure({ blockSeparator: this.options.coreExtensionOptions?.clipboardTextSerializer?.blockSeparator }),
			Km,
			Xm,
			Zm,
			$m,
			qm,
			Qm
		].filter((e) => typeof this.options.enableCoreExtensions == "object" ? this.options.enableCoreExtensions[e.name] !== !1 : !0) : [], ...this.options.extensions].filter((e) => [
			"extension",
			"node",
			"mark"
		].includes(e?.type));
		this.extensionManager = new tp(e, this);
	}
	createCommandManager() {
		this.commandManager = new xf({ editor: this });
	}
	createSchema() {
		this.schema = this.extensionManager.schema;
	}
	createView() {
		let e;
		try {
			e = fm(this.options.content, this.schema, this.options.parseOptions, { errorOnInvalidContent: this.options.enableContentCheck });
		} catch (t) {
			if (!(t instanceof Error) || !["[tiptap error]: Invalid JSON content", "[tiptap error]: Invalid HTML content"].includes(t.message)) throw t;
			this.emit("contentError", {
				editor: this,
				error: t,
				disableCollaboration: () => {
					this.storage.collaboration && (this.storage.collaboration.isDisabled = !0), this.options.extensions = this.options.extensions.filter((e) => e.name !== "collaboration"), this.createExtensionManager();
				}
			}), e = fm(this.options.content, this.schema, this.options.parseOptions, { errorOnInvalidContent: !1 });
		}
		let t = Dp(e, this.options.autofocus);
		this.view = new ld(this.options.element, {
			...this.options.editorProps,
			attributes: {
				role: "textbox",
				...this.options.editorProps?.attributes
			},
			dispatchTransaction: this.dispatchTransaction.bind(this),
			state: Jo.create({
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
		return Sm(this.state, e);
	}
	isActive(e, t) {
		let n = typeof e == "string" ? e : null, r = typeof e == "string" ? t : e;
		return km(this.state, n, r);
	}
	getJSON() {
		return this.state.doc.toJSON();
	}
	getHTML() {
		return If(this.state.doc.content, this.schema);
	}
	getText(e) {
		let { blockSeparator: t = "\n\n", textSerializers: n = {} } = e || {};
		return bm(this.state.doc, {
			blockSeparator: t,
			textSerializers: {
				...ip(this.schema),
				...n
			}
		});
	}
	get isEmpty() {
		return jm(this.state.doc);
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
		return new eh(this.state.doc.resolve(e), this);
	}
	get $doc() {
		return this.$pos(0);
	}
};
function ih(e) {
	return new zf({
		find: e.find,
		handler: ({ state: t, range: n, match: r }) => {
			let i = Z(e.getAttributes, void 0, r);
			if (i === !1 || i === null) return null;
			let { tr: a } = t, o = r[r.length - 1], s = r[0];
			if (o) {
				let r = s.search(/\S/), c = n.from + s.indexOf(o), l = c + o.length;
				if (Em(n.from, n.to, t.doc).filter((t) => t.mark.type.excluded.find((n) => n === e.type && n !== t.mark.type)).filter((e) => e.to > c).length) return null;
				l < n.to && a.delete(l, n.to), c > n.from && a.delete(n.from + r, c);
				let u = n.from + r + o.length;
				a.addMark(n.from + r, u, e.type.create(i || {})), a.removeStoredMark(e.type);
			}
		}
	});
}
function ah(e) {
	return new zf({
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
function oh(e) {
	return new zf({
		find: e.find,
		handler: ({ state: t, range: n, match: r }) => {
			let i = t.doc.resolve(n.from), a = Z(e.getAttributes, void 0, r) || {};
			if (!i.node(-1).canReplaceWith(i.index(-1), i.indexAfter(-1), e.type)) return null;
			t.tr.delete(n.from, n.to).setBlockType(n.from, n.from, e.type, a);
		}
	});
}
function sh(e) {
	return new zf({
		find: e.find,
		handler: ({ state: t, range: n, match: r, chain: i }) => {
			let a = Z(e.getAttributes, void 0, r) || {}, o = t.tr.delete(n.from, n.to), s = o.doc.resolve(n.from).blockRange(), c = s && qa(s, e.type, a);
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
			l && l.type === e.type && ao(o.doc, n.from - 1) && (!e.joinPredicate || e.joinPredicate(r, l)) && o.join(n.from - 1);
		}
	});
}
var ch = class e {
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
			addOptions: () => Gf(this.options, e)
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
function lh(e) {
	return new Jf({
		find: e.find,
		handler: ({ state: t, range: n, match: r, pasteEvent: i }) => {
			let a = Z(e.getAttributes, void 0, r, i);
			if (a === !1 || a === null) return null;
			let { tr: o } = t, s = r[r.length - 1], c = r[0], l = n.to;
			if (s) {
				let r = c.search(/\S/), i = n.from + c.indexOf(s), u = i + s.length;
				if (Em(n.from, n.to, t.doc).filter((t) => t.mark.type.excluded.find((n) => n === e.type && n !== t.mark.type)).filter((e) => e.to > i).length) return null;
				u < n.to && o.delete(u, n.to), i > n.from && o.delete(n.from + r, i), l = n.from + r + s.length, o.addMark(n.from + r, l, e.type.create(a || {})), o.removeStoredMark(e.type);
			}
		}
	});
}
function uh(e, t) {
	let { selection: n } = e, { $from: r } = n;
	if (n instanceof B) {
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
function dh(e) {
	return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var fh = { exports: {} }, ph = {}, mh;
function hh() {
	if (mh) return ph;
	mh = 1;
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
	return ph.useSyncExternalStore = e.useSyncExternalStore === void 0 ? u : e.useSyncExternalStore, ph;
}
fh.exports = hh();
var gh = fh.exports, _h = (...e) => (t) => {
	e.forEach((e) => {
		typeof e == "function" ? e(t) : e && (e.current = t);
	});
}, vh = ({ contentComponent: e }) => {
	let t = gh.useSyncExternalStore(e.subscribe, e.getSnapshot, e.getServerSnapshot);
	return _.createElement(_.Fragment, null, Object.values(t));
};
function yh() {
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
				[n]: T.createPortal(r.reactElement, r.element, n)
			}, e.forEach((e) => e());
		},
		removeRenderer(n) {
			let r = { ...t };
			delete r[n], t = r, e.forEach((e) => e());
		}
	};
}
var bh = class extends _.Component {
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
			t.append(...e.options.element.childNodes), e.setOptions({ element: t }), e.contentComponent = yh(), this.state.hasContentComponentInitialized || (this.unsubscribeToContentComponent = e.contentComponent.subscribe(() => {
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
			ref: _h(t, this.editorContentRef),
			...n
		}), e?.contentComponent && _.createElement(vh, { contentComponent: e.contentComponent }));
	}
}, xh = (0, _.forwardRef)((e, t) => {
	let n = _.useMemo(() => Math.floor(Math.random() * 4294967295).toString(), [e.editor]);
	return _.createElement(bh, {
		key: n,
		innerRef: t,
		...e
	});
}), Sh = _.memo(xh), Ch = /* @__PURE__ */ dh(function e(t, n) {
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
}), wh = { exports: {} }, Th = {}, Eh;
function Dh() {
	if (Eh) return Th;
	Eh = 1;
	var e = _.default, t = gh;
	function n(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var r = typeof Object.is == "function" ? Object.is : n, i = t.useSyncExternalStore, a = e.useRef, o = e.useEffect, s = e.useMemo, c = e.useDebugValue;
	return Th.useSyncExternalStoreWithSelector = function(e, t, n, l, u) {
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
	}, Th;
}
wh.exports = Dh();
var Oh = wh.exports, kh = typeof window < "u" ? _.useLayoutEffect : _.useEffect, Ah = class {
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
function jh(e) {
	let [t] = (0, _.useState)(() => new Ah(e.editor)), n = Oh.useSyncExternalStoreWithSelector(t.subscribe, t.getSnapshot, t.getServerSnapshot, e.selector, e.equalityFn ?? Ch);
	return kh(() => t.watch(e.editor), [e.editor, t]), (0, _.useDebugValue)(n), n;
}
var Mh = typeof window > "u", Nh = Mh || !!(typeof window < "u" && window.next), Ph = class e {
	constructor(e) {
		this.editor = null, this.subscriptions = /* @__PURE__ */ new Set(), this.isComponentMounted = !1, this.previousDeps = null, this.instanceId = "", this.options = e, this.subscriptions = /* @__PURE__ */ new Set(), this.setEditor(this.getInitialEditor()), this.scheduleDestroy(), this.getEditor = this.getEditor.bind(this), this.getServerSnapshot = this.getServerSnapshot.bind(this), this.subscribe = this.subscribe.bind(this), this.refreshEditorInstance = this.refreshEditorInstance.bind(this), this.scheduleDestroy = this.scheduleDestroy.bind(this), this.onRender = this.onRender.bind(this), this.createEditor = this.createEditor.bind(this);
	}
	setEditor(e) {
		this.editor = e, this.instanceId = Math.random().toString(36).slice(2, 9), this.subscriptions.forEach((e) => e());
	}
	getInitialEditor() {
		return this.options.current.immediatelyRender === void 0 ? Mh || Nh ? null : this.createEditor() : (this.options.current.immediatelyRender, this.options.current.immediatelyRender ? this.createEditor() : null);
	}
	createEditor() {
		return new rh({
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
function Fh(e = {}, t = []) {
	let n = (0, _.useRef)(e);
	n.current = e;
	let [r] = (0, _.useState)(() => new Ph(n)), i = gh.useSyncExternalStore(r.subscribe, r.getEditor, r.getServerSnapshot);
	return (0, _.useDebugValue)(i), (0, _.useEffect)(r.onRender(t)), jh({
		editor: i,
		selector: ({ transactionNumber: t }) => e.shouldRerenderOnTransaction === !1 ? null : e.immediatelyRender && t === 0 ? 0 : t + 1
	}), i;
}
(0, _.createContext)({ editor: null }).Consumer;
var Ih = (0, _.createContext)({ onDragStart: void 0 }), Lh = () => (0, _.useContext)(Ih);
_.forwardRef((e, t) => {
	let { onDragStart: n } = Lh(), r = e.as || "div";
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
var Rh = /^\s*>\s$/, zh = ch.create({
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
			Ef(this.options.HTMLAttributes, e),
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
		return [sh({
			find: Rh,
			type: this.type
		})];
	}
}), Bh = /(?:^|\s)(\*\*(?!\s+\*\*)((?:[^*]+))\*\*(?!\s+\*\*))$/, Vh = /(?:^|\s)(\*\*(?!\s+\*\*)((?:[^*]+))\*\*(?!\s+\*\*))/g, Hh = /(?:^|\s)(__(?!\s+__)((?:[^_]+))__(?!\s+__))$/, Uh = /(?:^|\s)(__(?!\s+__)((?:[^_]+))__(?!\s+__))/g, Wh = Kf.create({
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
			Ef(this.options.HTMLAttributes, e),
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
		return [ih({
			find: Bh,
			type: this.type
		}), ih({
			find: Hh,
			type: this.type
		})];
	},
	addPasteRules() {
		return [lh({
			find: Vh,
			type: this.type
		}), lh({
			find: Uh,
			type: this.type
		})];
	}
}), Gh = "listItem", Kh = "textStyle", qh = /^\s*([-+*])\s$/, Jh = ch.create({
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
			Ef(this.options.HTMLAttributes, e),
			0
		];
	},
	addCommands() {
		return { toggleBulletList: () => ({ commands: e, chain: t }) => this.options.keepAttributes ? t().toggleList(this.name, this.options.itemTypeName, this.options.keepMarks).updateAttributes(Gh, this.editor.getAttributes(Kh)).run() : e.toggleList(this.name, this.options.itemTypeName, this.options.keepMarks) };
	},
	addKeyboardShortcuts() {
		return { "Mod-Shift-8": () => this.editor.commands.toggleBulletList() };
	},
	addInputRules() {
		let e = sh({
			find: qh,
			type: this.type
		});
		return (this.options.keepMarks || this.options.keepAttributes) && (e = sh({
			find: qh,
			type: this.type,
			keepMarks: this.options.keepMarks,
			keepAttributes: this.options.keepAttributes,
			getAttributes: () => this.editor.getAttributes(Kh),
			editor: this.editor
		})), [e];
	}
}), Yh = /(^|[^`])`([^`]+)`(?!`)/, Xh = /(^|[^`])`([^`]+)`(?!`)/g, Zh = Kf.create({
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
			Ef(this.options.HTMLAttributes, e),
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
		return [ih({
			find: Yh,
			type: this.type
		})];
	},
	addPasteRules() {
		return [lh({
			find: Xh,
			type: this.type
		})];
	}
}), Qh = /^```([a-z]+)?[\s\n]$/, $h = /^~~~([a-z]+)?[\s\n]$/, eg = ch.create({
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
			Ef(this.options.HTMLAttributes, t),
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
				return o === void 0 ? !1 : r.nodeAt(o) ? e.commands.command(({ tr: e }) => (e.setSelection(R.near(r.resolve(o))), !0)) : e.commands.exitCode();
			}
		};
	},
	addInputRules() {
		return [oh({
			find: Qh,
			type: this.type,
			getAttributes: (e) => ({ language: e[1] })
		}), oh({
			find: $h,
			type: this.type,
			getAttributes: (e) => ({ language: e[1] })
		})];
	},
	addProseMirrorPlugins() {
		return [new Xo({
			key: new $o("codeBlockVSCodeHandler"),
			props: { handlePaste: (e, t) => {
				if (!t.clipboardData || this.editor.isActive(this.type.name)) return !1;
				let n = t.clipboardData.getData("text/plain"), r = t.clipboardData.getData("vscode-editor-data"), i = (r ? JSON.parse(r) : void 0)?.mode;
				if (!n || !i) return !1;
				let { tr: a, schema: o } = e.state, s = o.text(n.replace(/\r\n?/g, "\n"));
				return a.replaceSelectionWith(this.type.create({ language: i }, s)), a.selection.$from.parent.type !== this.type && a.setSelection(z.near(a.doc.resolve(Math.max(0, a.selection.from - 2)))), a.setMeta("paste", !0), e.dispatch(a), !0;
			} }
		})];
	}
}), tg = ch.create({
	name: "doc",
	topNode: !0,
	content: "block+"
});
//#endregion
//#region node_modules/prosemirror-dropcursor/dist/index.js
function ng(e = {}) {
	return new Xo({ view(t) {
		return new rg(t, e);
	} });
}
var rg = class {
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
				let t = fo(this.editorView.state.doc, e, this.editorView.dragging.slice);
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
}, ig = np.create({
	name: "dropCursor",
	addOptions() {
		return {
			color: "currentColor",
			width: 1,
			class: void 0
		};
	},
	addProseMirrorPlugins() {
		return [ng(this.options)];
	}
}), ag = class e extends R {
	constructor(e) {
		super(e, e);
	}
	map(t, n) {
		let r = t.resolve(n.map(this.head));
		return e.valid(r) ? new e(r) : R.near(r);
	}
	content() {
		return P.empty;
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
		return new og(this.anchor);
	}
	static valid(e) {
		let t = e.parent;
		if (t.inlineContent || !cg(e) || !lg(e)) return !1;
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
					if (a.isAtom && !a.isText && !B.isSelectable(a)) {
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
ag.prototype.visible = !1, ag.findFrom = ag.findGapCursorFrom, R.jsonID("gapcursor", ag);
var og = class e {
	constructor(e) {
		this.pos = e;
	}
	map(t) {
		return new e(t.map(this.pos));
	}
	resolve(e) {
		let t = e.resolve(this.pos);
		return ag.valid(t) ? new ag(t) : R.near(t);
	}
};
function sg(e) {
	return e.isAtom || e.spec.isolating || e.spec.createGapCursor;
}
function cg(e) {
	for (let t = e.depth; t >= 0; t--) {
		let n = e.index(t), r = e.node(t);
		if (n == 0) {
			if (r.type.spec.isolating) return !0;
			continue;
		}
		for (let e = r.child(n - 1);; e = e.lastChild) {
			if (e.childCount == 0 && !e.inlineContent || sg(e.type)) return !0;
			if (e.inlineContent) return !1;
		}
	}
	return !0;
}
function lg(e) {
	for (let t = e.depth; t >= 0; t--) {
		let n = e.indexAfter(t), r = e.node(t);
		if (n == r.childCount) {
			if (r.type.spec.isolating) return !0;
			continue;
		}
		for (let e = r.child(n);; e = e.firstChild) {
			if (e.childCount == 0 && !e.inlineContent || sg(e.type)) return !0;
			if (e.inlineContent) return !1;
		}
	}
	return !0;
}
function ug() {
	return new Xo({ props: {
		decorations: hg,
		createSelectionBetween(e, t, n) {
			return t.pos == n.pos && ag.valid(n) ? new ag(n) : null;
		},
		handleClick: pg,
		handleKeyDown: dg,
		handleDOMEvents: { beforeinput: mg }
	} });
}
var dg = kd({
	ArrowLeft: fg("horiz", -1),
	ArrowRight: fg("horiz", 1),
	ArrowUp: fg("vert", -1),
	ArrowDown: fg("vert", 1)
});
function fg(e, t) {
	let n = e == "vert" ? t > 0 ? "down" : "up" : t > 0 ? "right" : "left";
	return function(e, r, i) {
		let a = e.selection, o = t > 0 ? a.$to : a.$from, s = a.empty;
		if (a instanceof z) {
			if (!i.endOfTextblock(n) || o.depth == 0) return !1;
			s = !1, o = e.doc.resolve(t > 0 ? o.after() : o.before());
		}
		let c = ag.findGapCursorFrom(o, t, s);
		return c ? (r && r(e.tr.setSelection(new ag(c))), !0) : !1;
	};
}
function pg(e, t, n) {
	if (!e || !e.editable) return !1;
	let r = e.state.doc.resolve(t);
	if (!ag.valid(r)) return !1;
	let i = e.posAtCoords({
		left: n.clientX,
		top: n.clientY
	});
	return i && i.inside > -1 && B.isSelectable(e.state.doc.nodeAt(i.inside)) ? !1 : (e.dispatch(e.state.tr.setSelection(new ag(r))), !0);
}
function mg(e, t) {
	if (t.inputType != "insertCompositionText" || !(e.state.selection instanceof ag)) return !1;
	let { $from: n } = e.state.selection, r = n.parent.contentMatchAt(n.index()).findWrapping(e.state.schema.nodes.text);
	if (!r) return !1;
	let i = M.empty;
	for (let e = r.length - 1; e >= 0; e--) i = M.from(r[e].createAndFill(null, i));
	let a = e.state.tr.replace(n.pos, n.pos, new P(i, 0, 0));
	return a.setSelection(z.near(a.doc.resolve(n.pos + 1))), e.dispatch(a), !1;
}
function hg(e) {
	if (!(e.selection instanceof ag)) return null;
	let t = document.createElement("div");
	return t.className = "ProseMirror-gapcursor", Au.create(e.doc, [Du.widget(e.selection.head, t, { key: "gapcursor" })]);
}
//#endregion
//#region node_modules/@tiptap/extension-gapcursor/dist/index.js
var gg = np.create({
	name: "gapCursor",
	addProseMirrorPlugins() {
		return [ug()];
	},
	extendNodeSchema(e) {
		return { allowGapCursor: Z(X(e, "allowGapCursor", {
			name: e.name,
			options: e.options,
			storage: e.storage
		})) ?? null };
	}
}), _g = ch.create({
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
		return ["br", Ef(this.options.HTMLAttributes, e)];
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
}), vg = ch.create({
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
			Ef(this.options.HTMLAttributes, t),
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
		return this.options.levels.map((e) => oh({
			find: RegExp(`^(#{${Math.min(...this.options.levels)},${e}})\\s$`),
			type: this.type,
			getAttributes: { level: e }
		}));
	}
}), yg = 200, bg = function() {};
bg.prototype.append = function(e) {
	return e.length ? (e = bg.from(e), !this.length && e || e.length < yg && this.leafAppend(e) || this.length < yg && e.leafPrepend(this) || this.appendInner(e)) : this;
}, bg.prototype.prepend = function(e) {
	return e.length ? bg.from(e).append(this) : this;
}, bg.prototype.appendInner = function(e) {
	return new Sg(this, e);
}, bg.prototype.slice = function(e, t) {
	return e === void 0 && (e = 0), t === void 0 && (t = this.length), e >= t ? bg.empty : this.sliceInner(Math.max(0, e), Math.min(this.length, t));
}, bg.prototype.get = function(e) {
	if (!(e < 0 || e >= this.length)) return this.getInner(e);
}, bg.prototype.forEach = function(e, t, n) {
	t === void 0 && (t = 0), n === void 0 && (n = this.length), t <= n ? this.forEachInner(e, t, n, 0) : this.forEachInvertedInner(e, t, n, 0);
}, bg.prototype.map = function(e, t, n) {
	t === void 0 && (t = 0), n === void 0 && (n = this.length);
	var r = [];
	return this.forEach(function(t, n) {
		return r.push(e(t, n));
	}, t, n), r;
}, bg.from = function(e) {
	return e instanceof bg ? e : e && e.length ? new xg(e) : bg.empty;
};
var xg = /* @__PURE__ */ function(e) {
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
		if (this.length + e.length <= yg) return new t(this.values.concat(e.flatten()));
	}, t.prototype.leafPrepend = function(e) {
		if (this.length + e.length <= yg) return new t(e.flatten().concat(this.values));
	}, n.length.get = function() {
		return this.values.length;
	}, n.depth.get = function() {
		return 0;
	}, Object.defineProperties(t.prototype, n), t;
}(bg);
bg.empty = new xg([]);
var Sg = /* @__PURE__ */ function(e) {
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
}(bg), Cg = 500, wg = class e {
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
				u.push(new Eg(t.map));
				let e = t.step.map(i.slice(a)), n;
				e && o.maybeStep(e).doc && (n = o.mapping.maps[o.mapping.maps.length - 1], l.push(new Eg(n, void 0, void 0, l.length + u.length))), a--, n && i.appendMap(n, a);
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
			let r = t.steps[e].invert(t.docs[e]), l = new Eg(t.mapping.maps[e], r, n), u;
			(u = c && c.merge(l)) && (l = u, e ? a.pop() : s = s.slice(0, s.length - 1)), a.push(l), n && (o++, n = void 0), i || (c = l);
		}
		let l = o - r.depth;
		return l > Og && (s = Tg(s, l), o -= l), new e(s.append(a), o);
	}
	remapping(e, t) {
		let n = new ka();
		return this.items.forEach((t, r) => {
			let i = t.mirrorOffset != null && r - t.mirrorOffset >= e ? n.maps.length - t.mirrorOffset : void 0;
			n.appendMap(t.map, i);
		}, e, t), n;
	}
	addMaps(t) {
		return this.eventCount == 0 ? this : new e(this.items.append(t.map((e) => new Eg(e))), this.eventCount);
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
				l && s++, r.push(new Eg(i, o, l));
			} else r.push(new Eg(i));
		}, i);
		let l = [];
		for (let e = n; e < o; e++) l.push(new Eg(a.maps[e]));
		let u = new e(this.items.slice(0, i).append(l).append(r), s);
		return u.emptyItemCount() > Cg && (u = u.compress(this.items.length - r.length)), u;
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
					let c = new Eg(o.invert(), t, s), l, u = i.length - 1;
					(l = i.length && i[u].merge(c)) ? i[u] = l : i.push(c);
				}
			} else e.map && r--;
		}, this.items.length, 0), new e(bg.from(i.reverse()), a);
	}
};
wg.empty = new wg(bg.empty, 0);
function Tg(e, t) {
	let n;
	return e.forEach((e, r) => {
		if (e.selection && t-- == 0) return n = r, !1;
	}), e.slice(n);
}
var Eg = class e {
	constructor(e, t, n, r) {
		this.map = e, this.step = t, this.selection = n, this.mirrorOffset = r;
	}
	merge(t) {
		if (this.step && t.step && !t.selection) {
			let n = t.step.merge(this.step);
			if (n) return new e(n.getMap().invert(), n, this.selection);
		}
	}
}, Dg = class {
	constructor(e, t, n, r, i) {
		this.done = e, this.undone = t, this.prevRanges = n, this.prevTime = r, this.prevComposition = i;
	}
}, Og = 20;
function kg(e, t, n, r) {
	let i = n.getMeta(Lg), a;
	if (i) return i.historyState;
	n.getMeta(Rg) && (e = new Dg(e.done, e.undone, null, 0, -1));
	let o = n.getMeta("appendedTransaction");
	if (n.steps.length == 0) return e;
	if (o && o.getMeta(Lg)) return o.getMeta(Lg).redo ? new Dg(e.done.addTransform(n, void 0, r, Ig(t)), e.undone, jg(n.mapping.maps), e.prevTime, e.prevComposition) : new Dg(e.done, e.undone.addTransform(n, void 0, r, Ig(t)), null, e.prevTime, e.prevComposition);
	if (n.getMeta("addToHistory") !== !1 && !(o && o.getMeta("addToHistory") === !1)) {
		let i = n.getMeta("composition"), a = e.prevTime == 0 || !o && e.prevComposition != i && (e.prevTime < (n.time || 0) - r.newGroupDelay || !Ag(n, e.prevRanges)), s = o ? Mg(e.prevRanges, n.mapping) : jg(n.mapping.maps);
		return new Dg(e.done.addTransform(n, a ? t.selection.getBookmark() : void 0, r, Ig(t)), wg.empty, s, n.time, i ?? e.prevComposition);
	} else if (a = n.getMeta("rebased")) return new Dg(e.done.rebased(n, a), e.undone.rebased(n, a), Mg(e.prevRanges, n.mapping), e.prevTime, e.prevComposition);
	else return new Dg(e.done.addMaps(n.mapping.maps), e.undone.addMaps(n.mapping.maps), Mg(e.prevRanges, n.mapping), e.prevTime, e.prevComposition);
}
function Ag(e, t) {
	if (!t) return !1;
	if (!e.docChanged) return !0;
	let n = !1;
	return e.mapping.maps[0].forEach((e, r) => {
		for (let i = 0; i < t.length; i += 2) e <= t[i + 1] && r >= t[i] && (n = !0);
	}), n;
}
function jg(e) {
	let t = [];
	for (let n = e.length - 1; n >= 0 && t.length == 0; n--) e[n].forEach((e, n, r, i) => t.push(r, i));
	return t;
}
function Mg(e, t) {
	if (!e) return null;
	let n = [];
	for (let r = 0; r < e.length; r += 2) {
		let i = t.map(e[r], 1), a = t.map(e[r + 1], -1);
		i <= a && n.push(i, a);
	}
	return n;
}
function Ng(e, t, n) {
	let r = Ig(t), i = Lg.get(t).spec.config, a = (n ? e.undone : e.done).popEvent(t, r);
	if (!a) return null;
	let o = a.selection.resolve(a.transform.doc), s = (n ? e.done : e.undone).addTransform(a.transform, t.selection.getBookmark(), i, r), c = new Dg(n ? s : a.remaining, n ? a.remaining : s, null, 0, -1);
	return a.transform.setSelection(o).setMeta(Lg, {
		redo: n,
		historyState: c
	});
}
var Pg = !1, Fg = null;
function Ig(e) {
	let t = e.plugins;
	if (Fg != t) {
		Pg = !1, Fg = t;
		for (let e = 0; e < t.length; e++) if (t[e].spec.historyPreserveItems) {
			Pg = !0;
			break;
		}
	}
	return Pg;
}
var Lg = new $o("history"), Rg = new $o("closeHistory");
function zg(e = {}) {
	return e = {
		depth: e.depth || 100,
		newGroupDelay: e.newGroupDelay || 500
	}, new Xo({
		key: Lg,
		state: {
			init() {
				return new Dg(wg.empty, wg.empty, null, 0, -1);
			},
			apply(t, n, r) {
				return kg(n, r, t, e);
			}
		},
		config: e,
		props: { handleDOMEvents: { beforeinput(e, t) {
			let n = t.inputType, r = n == "historyUndo" ? Vg : n == "historyRedo" ? Hg : null;
			return !r || !e.editable ? !1 : (t.preventDefault(), r(e.state, e.dispatch));
		} } }
	});
}
function Bg(e, t) {
	return (n, r) => {
		let i = Lg.getState(n);
		if (!i || (e ? i.undone : i.done).eventCount == 0) return !1;
		if (r) {
			let a = Ng(i, n, e);
			a && r(t ? a.scrollIntoView() : a);
		}
		return !0;
	};
}
var Vg = Bg(!1, !0), Hg = Bg(!0, !0), Ug = np.create({
	name: "history",
	addOptions() {
		return {
			depth: 100,
			newGroupDelay: 500
		};
	},
	addCommands() {
		return {
			undo: () => ({ state: e, dispatch: t }) => Vg(e, t),
			redo: () => ({ state: e, dispatch: t }) => Hg(e, t)
		};
	},
	addProseMirrorPlugins() {
		return [zg(this.options)];
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
}), Wg = ch.create({
	name: "horizontalRule",
	addOptions() {
		return { HTMLAttributes: {} };
	},
	group: "block",
	parseHTML() {
		return [{ tag: "hr" }];
	},
	renderHTML({ HTMLAttributes: e }) {
		return ["hr", Ef(this.options.HTMLAttributes, e)];
	},
	addCommands() {
		return { setHorizontalRule: () => ({ chain: e, state: t }) => {
			if (!uh(t, t.schema.nodes[this.name])) return !1;
			let { selection: n } = t, { $from: r, $to: i } = n, a = e();
			return r.parentOffset === 0 ? a.insertContentAt({
				from: Math.max(r.pos - 1, 0),
				to: i.pos
			}, { type: this.name }) : Mm(n) ? a.insertContentAt(i.pos, { type: this.name }) : a.insertContent({ type: this.name }), a.command(({ tr: e, dispatch: t }) => {
				if (t) {
					let { $to: t } = e.selection, n = t.end();
					if (t.nodeAfter) t.nodeAfter.isTextblock ? e.setSelection(z.create(e.doc, t.pos + 1)) : t.nodeAfter.isBlock ? e.setSelection(B.create(e.doc, t.pos)) : e.setSelection(z.create(e.doc, t.pos));
					else {
						let r = t.parent.type.contentMatch.defaultType?.create();
						r && (e.insert(n, r), e.setSelection(z.create(e.doc, n + 1)));
					}
					e.scrollIntoView();
				}
				return !0;
			}).run();
		} };
	},
	addInputRules() {
		return [ah({
			find: /^(?:---|—-|___\s|\*\*\*\s)$/,
			type: this.type
		})];
	}
}), Gg = /(?:^|\s)(\*(?!\s+\*)((?:[^*]+))\*(?!\s+\*))$/, Kg = /(?:^|\s)(\*(?!\s+\*)((?:[^*]+))\*(?!\s+\*))/g, qg = /(?:^|\s)(_(?!\s+_)((?:[^_]+))_(?!\s+_))$/, Jg = /(?:^|\s)(_(?!\s+_)((?:[^_]+))_(?!\s+_))/g, Yg = Kf.create({
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
			Ef(this.options.HTMLAttributes, e),
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
		return [ih({
			find: Gg,
			type: this.type
		}), ih({
			find: qg,
			type: this.type
		})];
	},
	addPasteRules() {
		return [lh({
			find: Kg,
			type: this.type
		}), lh({
			find: Jg,
			type: this.type
		})];
	}
}), Xg = ch.create({
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
			Ef(this.options.HTMLAttributes, e),
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
}), Zg = "listItem", Qg = "textStyle", $g = /^(\d+)\.\s$/, e_ = ch.create({
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
			Ef(this.options.HTMLAttributes, n),
			0
		] : [
			"ol",
			Ef(this.options.HTMLAttributes, e),
			0
		];
	},
	addCommands() {
		return { toggleOrderedList: () => ({ commands: e, chain: t }) => this.options.keepAttributes ? t().toggleList(this.name, this.options.itemTypeName, this.options.keepMarks).updateAttributes(Zg, this.editor.getAttributes(Qg)).run() : e.toggleList(this.name, this.options.itemTypeName, this.options.keepMarks) };
	},
	addKeyboardShortcuts() {
		return { "Mod-Shift-7": () => this.editor.commands.toggleOrderedList() };
	},
	addInputRules() {
		let e = sh({
			find: $g,
			type: this.type,
			getAttributes: (e) => ({ start: +e[1] }),
			joinPredicate: (e, t) => t.childCount + t.attrs.start === +e[1]
		});
		return (this.options.keepMarks || this.options.keepAttributes) && (e = sh({
			find: $g,
			type: this.type,
			keepMarks: this.options.keepMarks,
			keepAttributes: this.options.keepAttributes,
			getAttributes: (e) => ({
				start: +e[1],
				...this.editor.getAttributes(Qg)
			}),
			joinPredicate: (e, t) => t.childCount + t.attrs.start === +e[1],
			editor: this.editor
		})), [e];
	}
}), t_ = ch.create({
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
			Ef(this.options.HTMLAttributes, e),
			0
		];
	},
	addCommands() {
		return { setParagraph: () => ({ commands: e }) => e.setNode(this.name) };
	},
	addKeyboardShortcuts() {
		return { "Mod-Alt-0": () => this.editor.commands.setParagraph() };
	}
}), n_ = /(?:^|\s)(~~(?!\s+~~)((?:[^~]+))~~(?!\s+~~))$/, r_ = /(?:^|\s)(~~(?!\s+~~)((?:[^~]+))~~(?!\s+~~))/g, i_ = Kf.create({
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
			Ef(this.options.HTMLAttributes, e),
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
		return [ih({
			find: n_,
			type: this.type
		})];
	},
	addPasteRules() {
		return [lh({
			find: r_,
			type: this.type
		})];
	}
}), a_ = ch.create({
	name: "text",
	group: "inline"
}), o_ = np.create({
	name: "starterKit",
	addExtensions() {
		let e = [];
		return this.options.bold !== !1 && e.push(Wh.configure(this.options.bold)), this.options.blockquote !== !1 && e.push(zh.configure(this.options.blockquote)), this.options.bulletList !== !1 && e.push(Jh.configure(this.options.bulletList)), this.options.code !== !1 && e.push(Zh.configure(this.options.code)), this.options.codeBlock !== !1 && e.push(eg.configure(this.options.codeBlock)), this.options.document !== !1 && e.push(tg.configure(this.options.document)), this.options.dropcursor !== !1 && e.push(ig.configure(this.options.dropcursor)), this.options.gapcursor !== !1 && e.push(gg.configure(this.options.gapcursor)), this.options.hardBreak !== !1 && e.push(_g.configure(this.options.hardBreak)), this.options.heading !== !1 && e.push(vg.configure(this.options.heading)), this.options.history !== !1 && e.push(Ug.configure(this.options.history)), this.options.horizontalRule !== !1 && e.push(Wg.configure(this.options.horizontalRule)), this.options.italic !== !1 && e.push(Yg.configure(this.options.italic)), this.options.listItem !== !1 && e.push(Xg.configure(this.options.listItem)), this.options.orderedList !== !1 && e.push(e_.configure(this.options.orderedList)), this.options.paragraph !== !1 && e.push(t_.configure(this.options.paragraph)), this.options.strike !== !1 && e.push(i_.configure(this.options.strike)), this.options.text !== !1 && e.push(a_.configure(this.options.text)), e;
	}
}), s_ = "aaa1rp3bb0ott3vie4c1le2ogado5udhabi7c0ademy5centure6ountant0s9o1tor4d0s1ult4e0g1ro2tna4f0l1rica5g0akhan5ency5i0g1rbus3force5tel5kdn3l0ibaba4pay4lfinanz6state5y2sace3tom5m0azon4ericanexpress7family11x2fam3ica3sterdam8nalytics7droid5quan4z2o0l2partments8p0le4q0uarelle8r0ab1mco4chi3my2pa2t0e3s0da2ia2sociates9t0hleta5torney7u0ction5di0ble3o3spost5thor3o0s4w0s2x0a2z0ure5ba0by2idu3namex4d1k2r0celona5laycard4s5efoot5gains6seball5ketball8uhaus5yern5b0c1t1va3cg1n2d1e0ats2uty4er2rlin4st0buy5t2f1g1h0arti5i0ble3d1ke2ng0o3o1z2j1lack0friday9ockbuster8g1omberg7ue3m0s1w2n0pparibas9o0ats3ehringer8fa2m1nd2o0k0ing5sch2tik2on4t1utique6x2r0adesco6idgestone9oadway5ker3ther5ussels7s1t1uild0ers6siness6y1zz3v1w1y1z0h3ca0b1fe2l0l1vinklein9m0era3p2non3petown5ital0one8r0avan4ds2e0er0s4s2sa1e1h1ino4t0ering5holic7ba1n1re3c1d1enter4o1rn3f0a1d2g1h0anel2nel4rity4se2t2eap3intai5ristmas6ome4urch5i0priani6rcle4sco3tadel4i0c2y3k1l0aims4eaning6ick2nic1que6othing5ud3ub0med6m1n1o0ach3des3ffee4llege4ogne5m0mbank4unity6pany2re3uter5sec4ndos3struction8ulting7tact3ractors9oking4l1p2rsica5untry4pon0s4rses6pa2r0edit0card4union9icket5own3s1uise0s6u0isinella9v1w1x1y0mru3ou3z2dad1nce3ta1e1ing3sun4y2clk3ds2e0al0er2s3gree4livery5l1oitte5ta3mocrat6ntal2ist5si0gn4v2hl2iamonds6et2gital5rect0ory7scount3ver5h2y2j1k1m1np2o0cs1tor4g1mains5t1wnload7rive4tv2ubai3nlop4pont4rban5vag2r2z2earth3t2c0o2deka3u0cation8e1g1mail3erck5nergy4gineer0ing9terprises10pson4quipment8r0icsson6ni3s0q1tate5t1u0rovision8s2vents5xchange6pert3osed4ress5traspace10fage2il1rwinds6th3mily4n0s2rm0ers5shion4t3edex3edback6rrari3ero6i0delity5o2lm2nal1nce1ial7re0stone6mdale6sh0ing5t0ness6j1k1lickr3ghts4r2orist4wers5y2m1o0o0d1tball6rd1ex2sale4um3undation8x2r0ee1senius7l1ogans4ntier7tr2ujitsu5n0d2rniture7tbol5yi3ga0l0lery3o1up4me0s3p1rden4y2b0iz3d0n2e0a1nt0ing5orge5f1g0ee3h1i0ft0s3ves2ing5l0ass3e1obal2o4m0ail3bh2o1x2n1odaddy5ld0point6f2o0dyear5g0le4p1t1v2p1q1r0ainger5phics5tis4een3ipe3ocery4up4s1t1u0cci3ge2ide2tars5ru3w1y2hair2mburg5ngout5us3bo2dfc0bank7ealth0care8lp1sinki6re1mes5iphop4samitsu7tachi5v2k0t2m1n1ockey4ldings5iday5medepot5goods5s0ense7nda3rse3spital5t0ing5t0els3mail5use3w2r1sbc3t1u0ghes5yatt3undai7ibm2cbc2e1u2d1e0ee3fm2kano4l1m0amat4db2mo0bilien9n0c1dustries8finiti5o2g1k1stitute6urance4e4t0ernational10uit4vestments10o1piranga7q1r0ish4s0maili5t0anbul7t0au2v3jaguar4va3cb2e0ep2tzt3welry6io2ll2m0p2nj2o0bs1urg4t1y2p0morgan6rs3uegos4niper7kaufen5ddi3e0rryhotels6properties14fh2g1h1i0a1ds2m1ndle4tchen5wi3m1n1oeln3matsu5sher5p0mg2n2r0d1ed3uokgroup8w1y0oto4z2la0caixa5mborghini8er3nd0rover6xess5salle5t0ino3robe5w0yer5b1c1ds2ease3clerc5frak4gal2o2xus4gbt3i0dl2fe0insurance9style7ghting6ke2lly3mited4o2ncoln4k2ve1ing5k1lc1p2oan0s3cker3us3l1ndon4tte1o3ve3pl0financial11r1s1t0d0a3u0ndbeck6xe1ury5v1y2ma0drid4if1son4keup4n0agement7go3p1rket0ing3s4riott5shalls7ttel5ba2c0kinsey7d1e0d0ia3et2lbourne7me1orial6n0u2rckmsd7g1h1iami3crosoft7l1ni1t2t0subishi9k1l0b1s2m0a2n1o0bi0le4da2e1i1m1nash3ey2ster5rmon3tgage6scow4to0rcycles9v0ie4p1q1r1s0d2t0n1r2u0seum3ic4v1w1x1y1z2na0b1goya4me2vy3ba2c1e0c1t0bank4flix4work5ustar5w0s2xt0direct7us4f0l2g0o2hk2i0co2ke1on3nja3ssan1y5l1o0kia3rton4w0ruz3tv4p1r0a1w2tt2u1yc2z2obi1server7ffice5kinawa6layan0group9lo3m0ega4ne1g1l0ine5oo2pen3racle3nge4g0anic5igins6saka4tsuka4t2vh3pa0ge2nasonic7ris2s1tners4s1y3y2ccw3e0t2f0izer5g1h0armacy6d1ilips5one2to0graphy6s4ysio5ics1tet2ures6d1n0g1k2oneer5zza4k1l0ace2y0station9umbing5s3m1n0c2ohl2ker3litie5rn2st3r0axi3ess3ime3o0d0uctions8f1gressive8mo2perties3y5tection8u0dential9s1t1ub2w0c2y2qa1pon3uebec3st5racing4dio4e0ad1lestate6tor2y4cipes5d0stone5umbrella9hab3ise0n3t2liance6n0t0als5pair3ort3ublican8st0aurant8view0s5xroth6ich0ardli6oh3l1o1p2o0cks3deo3gers4om3s0vp3u0gby3hr2n2w0e2yukyu6sa0arland6fe0ty4kura4le1on3msclub4ung5ndvik0coromant12ofi4p1rl2s1ve2xo3b0i1s2c0b1haeffler7midt4olarships8ol3ule3warz5ience5ot3d1e0arch3t2cure1ity6ek2lect4ner3rvices6ven3w1x0y3fr2g1h0angrila6rp3ell3ia1ksha5oes2p0ping5uji3w3i0lk2na1gles5te3j1k0i0n2y0pe4l0ing4m0art3ile4n0cf3o0ccer3ial4ftbank4ware6hu2lar2utions7ng1y2y2pa0ce3ort2t3r0l2s1t0ada2ples4r1tebank4farm7c0group6ockholm6rage3e3ream4udio2y3yle4u0cks3pplies3y2ort5rf1gery5zuki5v1watch4iss4x1y0dney4stems6z2tab1ipei4lk2obao4rget4tamotors6r2too4x0i3c0i2d0k2eam2ch0nology8l1masek5nnis4va3f1g1h0d1eater2re6iaa2ckets5enda4ps2res2ol4j0maxx4x2k0maxx5l1m0all4n1o0day3kyo3ols3p1ray3shiba5tal3urs3wn2yota3s3r0ade1ing4ining5vel0ers0insurance16ust3v2t1ube2i1nes3shu4v0s2w1z2ua1bank3s2g1k1nicom3versity8o2ol2ps2s1y1z2va0cations7na1guard7c1e0gas3ntures6risign5mögensberater2ung14sicherung10t2g1i0ajes4deo3g1king4llas4n1p1rgin4sa1ion4va1o3laanderen9n1odka3lvo3te1ing3o2yage5u2wales2mart4ter4ng0gou5tch0es6eather0channel12bcam3er2site5d0ding5ibo2r3f1hoswho6ien2ki2lliamhill9n0dows4e1ners6me2olterskluwer11odside6rk0s2ld3w2s1tc1f3xbox3erox4ihuan4n2xx2yz3yachts4hoo3maxun5ndex5e1odobashi7ga2kohama6u0tube6t1un3za0ppos4ra3ero3ip2m1one3uerich6w2", c_ = "ελ1υ2бг1ел3дети4ею2католик6ом3мкд2он1сква6онлайн5рг3рус2ф2сайт3рб3укр3қаз3հայ3ישראל5קום3ابوظبي5رامكو5لاردن4بحرين5جزائر5سعودية6عليان5مغرب5مارات5یران5بارت2زار4يتك3ھارت5تونس4سودان3رية5شبكة4عراق2ب2مان4فلسطين6قطر3كاثوليك6وم3مصر2ليسيا5وريتانيا7قع4همراه5پاکستان7ڀارت4कॉम3नेट3भारत0म्3ोत5संगठन5বাংলা5ভারত2ৰত4ਭਾਰਤ4ભારત4ଭାରତ4இந்தியா6லங்கை6சிங்கப்பூர்11భారత్5ಭಾರತ4ഭാരതം5ලංකා4คอม3ไทย3ລາວ3გე2みんな3アマゾン4クラウド4グーグル4コム2ストア3セール3ファッション6ポイント4世界2中信1国1國1文网3亚马逊3企业2佛山2信息2健康2八卦2公司1益2台湾1灣2商城1店1标2嘉里0大酒店5在线2大拿2天主教3娱乐2家電2广东2微博2慈善2我爱你3手机2招聘2政务1府2新加坡2闻2时尚2書籍2机构2淡马锡3游戏2澳門2点看2移动2组织机构4网址1店1站1络2联通2谷歌2购物2通販2集团2電訊盈科4飞利浦3食品2餐厅2香格里拉3港2닷넷1컴2삼성2한국2", l_ = "numeric", u_ = "ascii", d_ = "alpha", f_ = "asciinumeric", p_ = "alphanumeric", m_ = "domain", h_ = "emoji", g_ = "scheme", __ = "slashscheme", v_ = "whitespace";
function y_(e, t) {
	return e in t || (t[e] = []), t[e];
}
function b_(e, t, n) {
	t[l_] && (t[f_] = !0, t[p_] = !0), t[u_] && (t[f_] = !0, t[d_] = !0), t[f_] && (t[p_] = !0), t[d_] && (t[p_] = !0), t[p_] && (t[m_] = !0), t[h_] && (t[m_] = !0);
	for (let r in t) {
		let t = y_(r, n);
		t.indexOf(e) < 0 && t.push(e);
	}
}
function x_(e, t) {
	let n = {};
	for (let r in t) t[r].indexOf(e) >= 0 && (n[r] = !0);
	return n;
}
function S_(e = null) {
	this.j = {}, this.jr = [], this.jd = null, this.t = e;
}
S_.groups = {}, S_.prototype = {
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
		r = r || S_.groups;
		let i;
		return t && t.j ? i = t : (i = new S_(t), n && r && b_(t, n, r)), this.jr.push([e, i]), i;
	},
	ts(e, t, n, r) {
		let i = this, a = e.length;
		if (!a) return i;
		for (let t = 0; t < a - 1; t++) i = i.tt(e[t]);
		return i.tt(e[a - 1], t, n, r);
	},
	tt(e, t, n, r) {
		r = r || S_.groups;
		let i = this;
		if (t && t.j) return i.j[e] = t, t;
		let a = t, o, s = i.go(e);
		return s ? (o = new S_(), Object.assign(o.j, s.j), o.jr.push.apply(o.jr, s.jr), o.jd = s.jd, o.t = s.t) : o = new S_(), a && (r && (o.t && typeof o.t == "string" ? b_(a, Object.assign(x_(o.t, r), n), r) : n && b_(a, n, r)), o.t = a), i.j[e] = o, o;
	}
};
var Q = (e, t, n, r, i) => e.ta(t, n, r, i), C_ = (e, t, n, r, i) => e.tr(t, n, r, i), w_ = (e, t, n, r, i) => e.ts(t, n, r, i), $ = (e, t, n, r, i) => e.tt(t, n, r, i), T_ = "WORD", E_ = "UWORD", D_ = "ASCIINUMERICAL", O_ = "ALPHANUMERICAL", k_ = "LOCALHOST", A_ = "TLD", j_ = "UTLD", M_ = "SCHEME", N_ = "SLASH_SCHEME", P_ = "NUM", F_ = "WS", I_ = "NL", L_ = "OPENBRACE", R_ = "CLOSEBRACE", z_ = "OPENBRACKET", B_ = "CLOSEBRACKET", V_ = "OPENPAREN", H_ = "CLOSEPAREN", U_ = "OPENANGLEBRACKET", W_ = "CLOSEANGLEBRACKET", G_ = "FULLWIDTHLEFTPAREN", K_ = "FULLWIDTHRIGHTPAREN", q_ = "LEFTCORNERBRACKET", J_ = "RIGHTCORNERBRACKET", Y_ = "LEFTWHITECORNERBRACKET", X_ = "RIGHTWHITECORNERBRACKET", Z_ = "FULLWIDTHLESSTHAN", Q_ = "FULLWIDTHGREATERTHAN", $_ = "AMPERSAND", ev = "APOSTROPHE", tv = "ASTERISK", nv = "AT", rv = "BACKSLASH", iv = "BACKTICK", av = "CARET", ov = "COLON", sv = "COMMA", cv = "DOLLAR", lv = "DOT", uv = "EQUALS", dv = "EXCLAMATION", fv = "HYPHEN", pv = "PERCENT", mv = "PIPE", hv = "PLUS", gv = "POUND", _v = "QUERY", vv = "QUOTE", yv = "FULLWIDTHMIDDLEDOT", bv = "SEMI", xv = "SLASH", Sv = "TILDE", Cv = "UNDERSCORE", wv = "EMOJI", Tv = "SYM", Ev = /* @__PURE__ */ Object.freeze({
	__proto__: null,
	ALPHANUMERICAL: O_,
	AMPERSAND: $_,
	APOSTROPHE: ev,
	ASCIINUMERICAL: D_,
	ASTERISK: tv,
	AT: nv,
	BACKSLASH: rv,
	BACKTICK: iv,
	CARET: av,
	CLOSEANGLEBRACKET: W_,
	CLOSEBRACE: R_,
	CLOSEBRACKET: B_,
	CLOSEPAREN: H_,
	COLON: ov,
	COMMA: sv,
	DOLLAR: cv,
	DOT: lv,
	EMOJI: wv,
	EQUALS: uv,
	EXCLAMATION: dv,
	FULLWIDTHGREATERTHAN: Q_,
	FULLWIDTHLEFTPAREN: G_,
	FULLWIDTHLESSTHAN: Z_,
	FULLWIDTHMIDDLEDOT: yv,
	FULLWIDTHRIGHTPAREN: K_,
	HYPHEN: fv,
	LEFTCORNERBRACKET: q_,
	LEFTWHITECORNERBRACKET: Y_,
	LOCALHOST: k_,
	NL: I_,
	NUM: P_,
	OPENANGLEBRACKET: U_,
	OPENBRACE: L_,
	OPENBRACKET: z_,
	OPENPAREN: V_,
	PERCENT: pv,
	PIPE: mv,
	PLUS: hv,
	POUND: gv,
	QUERY: _v,
	QUOTE: vv,
	RIGHTCORNERBRACKET: J_,
	RIGHTWHITECORNERBRACKET: X_,
	SCHEME: M_,
	SEMI: bv,
	SLASH: xv,
	SLASH_SCHEME: N_,
	SYM: Tv,
	TILDE: Sv,
	TLD: A_,
	UNDERSCORE: Cv,
	UTLD: j_,
	UWORD: E_,
	WORD: T_,
	WS: F_
}), Dv = /[a-z]/, Ov = /\p{L}/u, kv = /\p{Emoji}/u, Av = /\d/, jv = /\s/, Mv = "\r", Nv = "\n", Pv = "️", Fv = "‍", Iv = "￼", Lv = null, Rv = null;
function zv(e = []) {
	let t = {};
	S_.groups = t;
	let n = new S_();
	Lv ?? (Lv = Uv(s_)), Rv ?? (Rv = Uv(c_)), $(n, "'", ev), $(n, "{", L_), $(n, "}", R_), $(n, "[", z_), $(n, "]", B_), $(n, "(", V_), $(n, ")", H_), $(n, "<", U_), $(n, ">", W_), $(n, "（", G_), $(n, "）", K_), $(n, "「", q_), $(n, "」", J_), $(n, "『", Y_), $(n, "』", X_), $(n, "＜", Z_), $(n, "＞", Q_), $(n, "&", $_), $(n, "*", tv), $(n, "@", nv), $(n, "`", iv), $(n, "^", av), $(n, ":", ov), $(n, ",", sv), $(n, "$", cv), $(n, ".", lv), $(n, "=", uv), $(n, "!", dv), $(n, "-", fv), $(n, "%", pv), $(n, "|", mv), $(n, "+", hv), $(n, "#", gv), $(n, "?", _v), $(n, "\"", vv), $(n, "/", xv), $(n, ";", bv), $(n, "~", Sv), $(n, "_", Cv), $(n, "\\", rv), $(n, "・", yv);
	let r = C_(n, Av, P_, { [l_]: !0 });
	C_(r, Av, r);
	let i = C_(r, Dv, D_, { [f_]: !0 }), a = C_(r, Ov, O_, { [p_]: !0 }), o = C_(n, Dv, T_, { [u_]: !0 });
	C_(o, Av, i), C_(o, Dv, o), C_(i, Av, i), C_(i, Dv, i);
	let s = C_(n, Ov, E_, { [d_]: !0 });
	C_(s, Dv), C_(s, Av, a), C_(s, Ov, s), C_(a, Av, a), C_(a, Dv), C_(a, Ov, a);
	let c = $(n, Nv, I_, { [v_]: !0 }), l = $(n, Mv, F_, { [v_]: !0 }), u = C_(n, jv, F_, { [v_]: !0 });
	$(n, Iv, u), $(l, Nv, c), $(l, Iv, u), C_(l, jv, u), $(u, Mv), $(u, Nv), C_(u, jv, u), $(u, Iv, u);
	let d = C_(n, kv, wv, { [h_]: !0 });
	$(d, "#"), C_(d, kv, d), $(d, Pv, d);
	let f = $(d, Fv);
	$(f, "#"), C_(f, kv, d);
	let p = [[Dv, o], [Av, i]], m = [
		[Dv, null],
		[Ov, s],
		[Av, a]
	];
	for (let e = 0; e < Lv.length; e++) Hv(n, Lv[e], A_, T_, p);
	for (let e = 0; e < Rv.length; e++) Hv(n, Rv[e], j_, E_, m);
	b_(A_, {
		tld: !0,
		ascii: !0
	}, t), b_(j_, {
		utld: !0,
		alpha: !0
	}, t), Hv(n, "file", M_, T_, p), Hv(n, "mailto", M_, T_, p), Hv(n, "http", N_, T_, p), Hv(n, "https", N_, T_, p), Hv(n, "ftp", N_, T_, p), Hv(n, "ftps", N_, T_, p), b_(M_, {
		scheme: !0,
		ascii: !0
	}, t), b_(N_, {
		slashscheme: !0,
		ascii: !0
	}, t), e = e.sort((e, t) => e[0] > t[0] ? 1 : -1);
	for (let t = 0; t < e.length; t++) {
		let r = e[t][0], i = e[t][1] ? { [g_]: !0 } : { [__]: !0 };
		r.indexOf("-") >= 0 ? i[m_] = !0 : Dv.test(r) ? Av.test(r) ? i[f_] = !0 : i[u_] = !0 : i[l_] = !0, w_(n, r, r, i);
	}
	return w_(n, "localhost", k_, { ascii: !0 }), n.jd = new S_(Tv), {
		start: n,
		tokens: Object.assign({ groups: t }, Ev)
	};
}
function Bv(e, t) {
	let n = Vv(t.replace(/[A-Z]/g, (e) => e.toLowerCase())), r = n.length, i = [], a = 0, o = 0;
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
function Vv(e) {
	let t = [], n = e.length, r = 0;
	for (; r < n;) {
		let i = e.charCodeAt(r), a, o = i < 55296 || i > 56319 || r + 1 === n || (a = e.charCodeAt(r + 1)) < 56320 || a > 57343 ? e[r] : e.slice(r, r + 2);
		t.push(o), r += o.length;
	}
	return t;
}
function Hv(e, t, n, r, i) {
	let a, o = t.length;
	for (let n = 0; n < o - 1; n++) {
		let o = t[n];
		e.j[o] ? a = e.j[o] : (a = new S_(r), a.jr = i.slice(), e.j[o] = a), e = a;
	}
	return a = new S_(n), a.jr = i.slice(), e.j[t[o - 1]] = a, a;
}
function Uv(e) {
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
var Wv = {
	defaultProtocol: "http",
	events: null,
	format: Kv,
	formatHref: Kv,
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
function Gv(e, t = null) {
	let n = Object.assign({}, Wv);
	e && (n = Object.assign(n, e instanceof Gv ? e.o : e));
	let r = n.ignoreTags, i = [];
	for (let e = 0; e < r.length; e++) i.push(r[e].toUpperCase());
	this.o = n, t && (this.defaultRender = t), this.ignoreTags = i;
}
Gv.prototype = {
	o: Wv,
	ignoreTags: [],
	defaultRender(e) {
		return e;
	},
	check(e) {
		return this.get("validate", e.toString(), e);
	},
	get(e, t, n) {
		let r = t != null, i = this.o[e];
		return i && (typeof i == "object" ? (i = n.t in i ? i[n.t] : Wv[e], typeof i == "function" && r && (i = i(t, n))) : typeof i == "function" && r && (i = i(t, n.t, n)), i);
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
function Kv(e) {
	return e;
}
function qv(e, t) {
	this.t = "token", this.v = e, this.tk = t;
}
qv.prototype = {
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
	toObject(e = Wv.defaultProtocol) {
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
function Jv(e, t) {
	class n extends qv {
		constructor(t, n) {
			super(t, n), this.t = e;
		}
	}
	for (let e in t) n.prototype[e] = t[e];
	return n.t = e, n;
}
var Yv = Jv("email", {
	isLink: !0,
	toHref() {
		return "mailto:" + this.toString();
	}
}), Xv = Jv("text"), Zv = Jv("nl"), Qv = Jv("url", {
	isLink: !0,
	toHref(e = Wv.defaultProtocol) {
		return this.hasProtocol() ? this.v : `${e}://${this.v}`;
	},
	hasProtocol() {
		let e = this.tk;
		return e.length >= 2 && e[0].t !== k_ && e[1].t === ov;
	}
}), $v = (e) => new S_(e);
function ey({ groups: e }) {
	let t = e.domain.concat([
		$_,
		tv,
		nv,
		rv,
		iv,
		av,
		cv,
		uv,
		fv,
		P_,
		pv,
		mv,
		hv,
		gv,
		xv,
		Tv,
		Sv,
		Cv
	]), n = [
		ev,
		ov,
		sv,
		lv,
		dv,
		pv,
		_v,
		vv,
		bv,
		U_,
		W_,
		L_,
		R_,
		B_,
		z_,
		V_,
		H_,
		G_,
		K_,
		q_,
		J_,
		Y_,
		X_,
		Z_,
		Q_
	], r = [
		$_,
		ev,
		tv,
		rv,
		iv,
		av,
		cv,
		uv,
		fv,
		L_,
		R_,
		pv,
		mv,
		hv,
		gv,
		_v,
		xv,
		Tv,
		Sv,
		Cv
	], i = $v(), a = $(i, Sv);
	Q(a, r, a), Q(a, e.domain, a);
	let o = $v(), s = $v(), c = $v();
	Q(i, e.domain, o), Q(i, e.scheme, s), Q(i, e.slashscheme, c), Q(o, r, a), Q(o, e.domain, o);
	let l = $(o, nv);
	$(a, nv, l), $(s, nv, l), $(c, nv, l);
	let u = $(a, lv);
	Q(u, r, a), Q(u, e.domain, a);
	let d = $v();
	Q(l, e.domain, d), Q(d, e.domain, d);
	let f = $(d, lv);
	Q(f, e.domain, d);
	let p = $v(Yv);
	Q(f, e.tld, p), Q(f, e.utld, p), $(l, k_, p);
	let m = $(d, fv);
	$(m, fv, m), Q(m, e.domain, d), Q(p, e.domain, d), $(p, lv, f), $(p, fv, m), Q($(p, ov), e.numeric, Yv);
	let h = $(o, fv), g = $(o, lv);
	$(h, fv, h), Q(h, e.domain, o), Q(g, r, a), Q(g, e.domain, o);
	let _ = $v(Qv);
	Q(g, e.tld, _), Q(g, e.utld, _), Q(_, e.domain, o), Q(_, r, a), $(_, lv, g), $(_, fv, h), $(_, nv, l);
	let v = $(_, ov), y = $v(Qv);
	Q(v, e.numeric, y);
	let b = $v(Qv), x = $v();
	Q(b, t, b), Q(b, n, x), Q(x, t, b), Q(x, n, x), $(_, xv, b), $(y, xv, b);
	let S = $(s, ov), ee = $($($(c, ov), xv), xv);
	Q(s, e.domain, o), $(s, lv, g), $(s, fv, h), Q(c, e.domain, o), $(c, lv, g), $(c, fv, h), Q(S, e.domain, b), $(S, xv, b), $(S, _v, b), Q(ee, e.domain, b), Q(ee, t, b), $(ee, xv, b);
	let C = [
		[L_, R_],
		[z_, B_],
		[V_, H_],
		[U_, W_],
		[G_, K_],
		[q_, J_],
		[Y_, X_],
		[Z_, Q_]
	];
	for (let e = 0; e < C.length; e++) {
		let [r, i] = C[e], a = $(b, r);
		$(x, r, a), $(a, i, b);
		let o = $v(Qv);
		Q(a, t, o);
		let s = $v();
		Q(a, n), Q(o, t, o), Q(o, n, s), Q(s, t, o), Q(s, n, s), $(o, i, b), $(s, i, b);
	}
	return $(i, k_, _), $(i, I_, Zv), {
		start: i,
		tokens: Ev
	};
}
function ty(e, t, n) {
	let r = n.length, i = 0, a = [], o = [];
	for (; i < r;) {
		let s = e, c = null, l = null, u = 0, d = null, f = -1;
		for (; i < r && !(c = s.go(n[i].t));) o.push(n[i++]);
		for (; i < r && (l = c || s.go(n[i].t));) c = null, s = l, s.accepts() ? (f = 0, d = s) : f >= 0 && f++, i++, u++;
		if (f < 0) i -= u, i < r && (o.push(n[i]), i++);
		else {
			o.length > 0 && (a.push(ny(Xv, t, o)), o = []), i -= f, u -= f;
			let e = d.t, r = n.slice(i - u, i);
			a.push(ny(e, t, r));
		}
	}
	return o.length > 0 && a.push(ny(Xv, t, o)), a;
}
function ny(e, t, n) {
	let r = n[0].s, i = n[n.length - 1].e;
	return new e(t.slice(r, i), n);
}
var ry = typeof console < "u" && console && console.warn || (() => {}), iy = "until manual call of linkify.init(). Register all schemes and plugins before invoking linkify the first time.", ay = {
	scanner: null,
	parser: null,
	tokenQueue: [],
	pluginQueue: [],
	customSchemes: [],
	initialized: !1
};
function oy() {
	return S_.groups = {}, ay.scanner = null, ay.parser = null, ay.tokenQueue = [], ay.pluginQueue = [], ay.customSchemes = [], ay.initialized = !1, ay;
}
function sy(e, t = !1) {
	if (ay.initialized && ry(`linkifyjs: already initialized - will not register custom scheme "${e}" ${iy}`), !/^[0-9a-z]+(-[0-9a-z]+)*$/.test(e)) throw Error("linkifyjs: incorrect scheme format.\n1. Must only contain digits, lowercase ASCII letters or \"-\"\n2. Cannot start or end with \"-\"\n3. \"-\" cannot repeat");
	ay.customSchemes.push([e, t]);
}
function cy() {
	ay.scanner = zv(ay.customSchemes);
	for (let e = 0; e < ay.tokenQueue.length; e++) ay.tokenQueue[e][1]({ scanner: ay.scanner });
	ay.parser = ey(ay.scanner.tokens);
	for (let e = 0; e < ay.pluginQueue.length; e++) ay.pluginQueue[e][1]({
		scanner: ay.scanner,
		parser: ay.parser
	});
	return ay.initialized = !0, ay;
}
function ly(e) {
	return ay.initialized || cy(), ty(ay.parser.start, e, Bv(ay.scanner.start, e));
}
ly.scan = Bv;
function uy(e, t = null, n = null) {
	if (t && typeof t == "object") {
		if (n) throw Error(`linkifyjs: Invalid link type ${t}; must be a string`);
		n = t, t = null;
	}
	let r = new Gv(n), i = ly(e), a = [];
	for (let e = 0; e < i.length; e++) {
		let n = i[e];
		n.isLink && (!t || n.t === t) && r.check(n) && a.push(n.toFormattedObject(r));
	}
	return a;
}
//#endregion
//#region node_modules/@tiptap/extension-link/dist/index.js
var dy = "[\0- \xA0 ᠎ -\u2029 　]", fy = new RegExp(dy), py = RegExp(`${dy}$`), my = new RegExp(dy, "g");
function hy(e) {
	return e.length === 1 ? e[0].isLink : e.length === 3 && e[1].isLink ? ["()", "[]"].includes(e[0].value + e[2].value) : !1;
}
function gy(e) {
	return new Xo({
		key: new $o("autolink"),
		appendTransaction: (t, n, r) => {
			let i = t.some((e) => e.docChanged) && !n.doc.eq(r.doc), a = t.some((e) => e.getMeta("preventAutolink"));
			if (!i || a) return;
			let { tr: o } = r;
			if (Tm(hm(n.doc, [...t])).forEach(({ newRange: t }) => {
				let n = _m(r.doc, t, (e) => e.isTextblock), i, a;
				if (n.length > 1) i = n[0], a = r.doc.textBetween(i.pos, i.pos + i.node.nodeSize, void 0, " ");
				else if (n.length) {
					let e = r.doc.textBetween(t.from, t.to, " ", " ");
					if (!py.test(e)) return;
					i = n[0], a = r.doc.textBetween(i.pos, t.to, void 0, " ");
				}
				if (i && a) {
					let t = a.split(fy).filter(Boolean);
					if (t.length <= 0) return !1;
					let n = t[t.length - 1], s = i.pos + a.lastIndexOf(n);
					if (!n) return !1;
					let c = ly(n).map((t) => t.toObject(e.defaultProtocol));
					if (!hy(c)) return !1;
					c.filter((e) => e.isLink).map((e) => ({
						...e,
						from: s + e.start + 1,
						to: s + e.end + 1
					})).filter((e) => r.schema.marks.code ? !r.doc.rangeHasMark(e.from, e.to, r.schema.marks.code) : !0).filter((t) => e.validate(t.value)).filter((t) => e.shouldAutoLink(t.value)).forEach((t) => {
						Em(t.from, t.to, r.doc).some((t) => t.mark.type === e.type) || o.addMark(t.from, t.to, e.type.create({ href: t.href }));
					});
				}
			}), o.steps.length) return o;
		}
	});
}
function _y(e) {
	return new Xo({
		key: new $o("handleClickLink"),
		props: { handleClick: (t, n, r) => {
			if (r.button !== 0 || !t.editable) return !1;
			let i = r.target, a = [];
			for (; i.nodeName !== "DIV";) a.push(i), i = i.parentNode;
			if (!a.find((e) => e.nodeName === "A")) return !1;
			let o = Sm(t.state, e.type.name), s = r.target, c = s?.href ?? o.href, l = s?.target ?? o.target;
			return s && c ? (window.open(c, l), !0) : !1;
		} }
	});
}
function vy(e) {
	return new Xo({
		key: new $o("handlePasteLink"),
		props: { handlePaste: (t, n, r) => {
			let { state: i } = t, { selection: a } = i, { empty: o } = a;
			if (o) return !1;
			let s = "";
			r.content.forEach((e) => {
				s += e.textContent;
			});
			let c = uy(s, { defaultProtocol: e.defaultProtocol }).find((e) => e.isLink && e.value === s);
			return !s || !c ? !1 : e.editor.commands.setMark(e.type, { href: c.href });
		} }
	});
}
function yy(e, t) {
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
	}), !e || e.replace(my, "").match(RegExp(`^(?:(?:${n.join("|")}):|[^a-z]|[a-z0-9+.\-]+(?:[^a-z+.\-:]|$))`, "i"));
}
var by = Kf.create({
	name: "link",
	priority: 1e3,
	keepOnSplit: !1,
	exitable: !0,
	onCreate() {
		this.options.validate && !this.options.shouldAutoLink && (this.options.shouldAutoLink = this.options.validate, console.warn("The `validate` option is deprecated. Rename to the `shouldAutoLink` option instead.")), this.options.protocols.forEach((e) => {
			if (typeof e == "string") {
				sy(e);
				return;
			}
			sy(e.scheme, e.optionalSlashes);
		});
	},
	onDestroy() {
		oy();
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
			isAllowedUri: (e, t) => !!yy(e, t.protocols),
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
					defaultValidate: (e) => !!yy(e, this.options.protocols),
					protocols: this.options.protocols,
					defaultProtocol: this.options.defaultProtocol
				}) ? !1 : null;
			}
		}];
	},
	renderHTML({ HTMLAttributes: e }) {
		return this.options.isAllowedUri(e.href, {
			defaultValidate: (e) => !!yy(e, this.options.protocols),
			protocols: this.options.protocols,
			defaultProtocol: this.options.defaultProtocol
		}) ? [
			"a",
			Ef(this.options.HTMLAttributes, e),
			0
		] : [
			"a",
			Ef(this.options.HTMLAttributes, {
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
					defaultValidate: (e) => !!yy(e, this.options.protocols),
					protocols: this.options.protocols,
					defaultProtocol: this.options.defaultProtocol
				}) ? t().setMark(this.name, e).setMeta("preventAutolink", !0).run() : !1;
			},
			toggleLink: (e) => ({ chain: t }) => {
				let { href: n } = e;
				return this.options.isAllowedUri(n, {
					defaultValidate: (e) => !!yy(e, this.options.protocols),
					protocols: this.options.protocols,
					defaultProtocol: this.options.defaultProtocol
				}) ? t().toggleMark(this.name, e, { extendEmptyMarkRange: !0 }).setMeta("preventAutolink", !0).run() : !1;
			},
			unsetLink: () => ({ chain: e }) => e().unsetMark(this.name, { extendEmptyMarkRange: !0 }).setMeta("preventAutolink", !0).run()
		};
	},
	addPasteRules() {
		return [lh({
			find: (e) => {
				let t = [];
				if (e) {
					let { protocols: n, defaultProtocol: r } = this.options, i = uy(e).filter((e) => e.isLink && this.options.isAllowedUri(e.value, {
						defaultValidate: (e) => !!yy(e, n),
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
		return this.options.autolink && e.push(gy({
			type: this.type,
			defaultProtocol: this.options.defaultProtocol,
			validate: (e) => this.options.isAllowedUri(e, {
				defaultValidate: (e) => !!yy(e, t),
				protocols: t,
				defaultProtocol: n
			}),
			shouldAutoLink: this.options.shouldAutoLink
		})), this.options.openOnClick === !0 && e.push(_y({ type: this.type })), this.options.linkOnPaste && e.push(vy({
			editor: this.editor,
			defaultProtocol: this.options.defaultProtocol,
			type: this.type
		})), e;
	}
});
//#endregion
//#region src/fields/RichText.tsx
function xy({ value: e, onChange: t }) {
	let n = Fh({
		extensions: [o_.configure({}), by.configure({
			openOnClick: !1,
			autolink: !0,
			HTMLAttributes: { rel: "noopener noreferrer" }
		})],
		content: e || "",
		onUpdate: ({ editor: e }) => t(e.getHTML()),
		editorProps: { attributes: { class: "vedit-tiptap-content" } }
	});
	return (0, _.useEffect)(() => {
		if (!n) return;
		let t = n.getHTML();
		(e || "") !== t && n.commands.setContent(e || "", !1);
	}, [n, e]), n ? /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "vedit-tiptap",
		children: [/* @__PURE__ */ (0, j.jsx)(Sy, { editor: n }), /* @__PURE__ */ (0, j.jsx)(Sh, { editor: n })]
	}) : /* @__PURE__ */ (0, j.jsx)("div", {
		className: "vedit-tiptap-loading",
		children: "Loading editor…"
	});
}
function Sy({ editor: e }) {
	let t = (e) => {
		try {
			return e();
		} catch {
			return !1;
		}
	};
	return /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "vedit-tiptap-toolbar",
		children: [
			/* @__PURE__ */ (0, j.jsx)(Cy, {
				active: e.isActive("bold"),
				onClick: () => e.chain().focus().toggleBold().run(),
				label: "B",
				title: "Bold",
				bold: !0
			}),
			/* @__PURE__ */ (0, j.jsx)(Cy, {
				active: e.isActive("italic"),
				onClick: () => e.chain().focus().toggleItalic().run(),
				label: "i",
				title: "Italic",
				italic: !0
			}),
			/* @__PURE__ */ (0, j.jsx)(Cy, {
				active: e.isActive("strike"),
				onClick: () => e.chain().focus().toggleStrike().run(),
				label: "S",
				title: "Strike"
			}),
			/* @__PURE__ */ (0, j.jsx)(Cy, {
				active: e.isActive("code"),
				onClick: () => e.chain().focus().toggleCode().run(),
				label: "</>",
				title: "Inline code"
			}),
			/* @__PURE__ */ (0, j.jsx)(wy, {}),
			/* @__PURE__ */ (0, j.jsx)(Cy, {
				active: e.isActive("heading", { level: 2 }),
				onClick: () => e.chain().focus().toggleHeading({ level: 2 }).run(),
				label: "H2",
				title: "Heading 2"
			}),
			/* @__PURE__ */ (0, j.jsx)(Cy, {
				active: e.isActive("heading", { level: 3 }),
				onClick: () => e.chain().focus().toggleHeading({ level: 3 }).run(),
				label: "H3",
				title: "Heading 3"
			}),
			/* @__PURE__ */ (0, j.jsx)(Cy, {
				active: e.isActive("paragraph"),
				onClick: () => e.chain().focus().setParagraph().run(),
				label: "P",
				title: "Paragraph"
			}),
			/* @__PURE__ */ (0, j.jsx)(wy, {}),
			/* @__PURE__ */ (0, j.jsx)(Cy, {
				active: e.isActive("bulletList"),
				onClick: () => e.chain().focus().toggleBulletList().run(),
				label: "•",
				title: "Bullet list"
			}),
			/* @__PURE__ */ (0, j.jsx)(Cy, {
				active: e.isActive("orderedList"),
				onClick: () => e.chain().focus().toggleOrderedList().run(),
				label: "1.",
				title: "Ordered list"
			}),
			/* @__PURE__ */ (0, j.jsx)(Cy, {
				active: e.isActive("blockquote"),
				onClick: () => e.chain().focus().toggleBlockquote().run(),
				label: "❝",
				title: "Blockquote"
			}),
			/* @__PURE__ */ (0, j.jsx)(Cy, {
				active: e.isActive("codeBlock"),
				onClick: () => e.chain().focus().toggleCodeBlock().run(),
				label: "{}",
				title: "Code block"
			}),
			/* @__PURE__ */ (0, j.jsx)(wy, {}),
			/* @__PURE__ */ (0, j.jsx)(Cy, {
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
			/* @__PURE__ */ (0, j.jsx)(Cy, {
				onClick: () => e.chain().focus().setHorizontalRule().run(),
				label: "―",
				title: "Horizontal rule"
			}),
			/* @__PURE__ */ (0, j.jsx)(wy, {}),
			/* @__PURE__ */ (0, j.jsx)(Cy, {
				onClick: () => e.chain().focus().undo().run(),
				label: "↶",
				title: "Undo",
				disabled: !t(() => e.can().undo())
			}),
			/* @__PURE__ */ (0, j.jsx)(Cy, {
				onClick: () => e.chain().focus().redo().run(),
				label: "↷",
				title: "Redo",
				disabled: !t(() => e.can().redo())
			})
		]
	});
}
function Cy({ active: e, onClick: t, label: n, title: r, bold: i, italic: a, disabled: o }) {
	return /* @__PURE__ */ (0, j.jsx)("button", {
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
function wy() {
	return /* @__PURE__ */ (0, j.jsx)("span", {
		className: "vedit-tiptap-sep",
		"aria-hidden": "true"
	});
}
//#endregion
//#region src/fields/FieldInput.tsx
function Ty({ field: e, value: t, onChange: n, nodeId: r, nodeType: i, path: a }) {
	let o = `vedit-${a}`, s = e.title || e.name, c = (e.type || "").toLowerCase();
	return c === "object" || c === "group" ? /* @__PURE__ */ (0, j.jsx)(kr, {
		field: e,
		value: t,
		onChange: n,
		nodeId: r,
		nodeType: i,
		path: a
	}) : c === "array" || c === "repeater" ? /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "vedit-field",
		children: [
			/* @__PURE__ */ (0, j.jsxs)("label", {
				className: "vedit-field-label",
				children: [s, e.required && /* @__PURE__ */ (0, j.jsx)("span", {
					className: "vedit-required",
					children: "*"
				})]
			}),
			e.description && /* @__PURE__ */ (0, j.jsx)("p", {
				className: "vedit-field-description",
				children: e.description
			}),
			/* @__PURE__ */ (0, j.jsx)(Ar, {
				field: e,
				value: t,
				onChange: n,
				nodeId: r,
				nodeType: i,
				path: a
			})
		]
	}) : /* @__PURE__ */ (0, j.jsxs)("div", {
		className: "vedit-field",
		children: [
			/* @__PURE__ */ (0, j.jsxs)("label", {
				htmlFor: o,
				className: "vedit-field-label",
				children: [s, e.required && /* @__PURE__ */ (0, j.jsx)("span", {
					className: "vedit-required",
					children: "*"
				})]
			}),
			e.description && /* @__PURE__ */ (0, j.jsx)("p", {
				className: "vedit-field-description",
				children: e.description
			}),
			/* @__PURE__ */ (0, j.jsx)(Ey, {
				id: o,
				field: e,
				value: t,
				onChange: n,
				nodeId: r,
				nodeType: i
			})
		]
	});
}
function Ey({ id: e, field: t, value: n, onChange: r, nodeId: i, nodeType: a }) {
	let o = (t.type || "").toLowerCase();
	switch (o) {
		case "string":
		case "url":
		case "email":
		case "color":
		case "date": return /* @__PURE__ */ (0, j.jsx)("input", {
			id: e,
			type: o === "url" ? "url" : o === "email" ? "email" : o === "color" ? "color" : o === "date" ? "date" : "text",
			className: "vedit-input",
			value: typeof n == "string" ? n : "",
			onChange: (e) => r(e.target.value)
		});
		case "text":
		case "textarea":
		case "text-multiline": return /* @__PURE__ */ (0, j.jsx)("textarea", {
			id: e,
			className: "vedit-input vedit-textarea",
			rows: 4,
			value: typeof n == "string" ? n : "",
			onChange: (e) => r(e.target.value)
		});
		case "richtext":
		case "wysiwyg": return /* @__PURE__ */ (0, j.jsx)(xy, {
			value: typeof n == "string" ? n : "",
			onChange: r
		});
		case "number":
		case "integer": return /* @__PURE__ */ (0, j.jsx)("input", {
			id: e,
			type: "number",
			className: "vedit-input",
			value: (typeof n == "number" ? n : null) ?? "",
			step: o === "integer" ? 1 : "any",
			onChange: (e) => r(e.target.value === "" ? null : Number(e.target.value))
		});
		case "range": {
			let i = t, a = i.min ?? 0, o = i.max ?? 100, s = i.step ?? 1, c = typeof n == "number" ? n : a;
			return /* @__PURE__ */ (0, j.jsxs)("div", {
				className: "vedit-range",
				children: [/* @__PURE__ */ (0, j.jsx)("input", {
					id: e,
					type: "range",
					min: a,
					max: o,
					step: s,
					value: c,
					onChange: (e) => r(Number(e.target.value))
				}), /* @__PURE__ */ (0, j.jsx)("span", {
					className: "vedit-range-value",
					children: c
				})]
			});
		}
		case "boolean":
		case "toggle": return /* @__PURE__ */ (0, j.jsxs)("label", {
			className: "vedit-toggle-row",
			children: [/* @__PURE__ */ (0, j.jsx)("input", {
				id: e,
				type: "checkbox",
				checked: n === !0,
				onChange: (e) => r(e.target.checked)
			}), /* @__PURE__ */ (0, j.jsx)("span", { children: n === !0 ? "On" : "Off" })]
		});
		case "select": {
			let i = t.options ?? [];
			return /* @__PURE__ */ (0, j.jsxs)("select", {
				id: e,
				className: "vedit-input",
				value: typeof n == "string" ? n : "",
				onChange: (e) => r(e.target.value),
				children: [/* @__PURE__ */ (0, j.jsx)("option", {
					value: "",
					children: "— select —"
				}), i.map((e) => /* @__PURE__ */ (0, j.jsx)("option", {
					value: e.value,
					children: e.label
				}, e.value))]
			});
		}
		case "radio": return /* @__PURE__ */ (0, j.jsx)("div", {
			className: "vedit-radio-group",
			role: "radiogroup",
			children: (t.options ?? []).map((t) => /* @__PURE__ */ (0, j.jsxs)("label", {
				className: "vedit-radio-row",
				children: [/* @__PURE__ */ (0, j.jsx)("input", {
					type: "radio",
					name: e,
					value: t.value,
					checked: n === t.value,
					onChange: () => r(t.value)
				}), /* @__PURE__ */ (0, j.jsx)("span", { children: t.label })]
			}, t.value))
		});
		case "checkbox": {
			let e = t.options ?? [], i = Array.isArray(n) ? n : [], a = (e) => {
				i.includes(e) ? r(i.filter((t) => t !== e)) : r([...i, e]);
			};
			return /* @__PURE__ */ (0, j.jsx)("div", {
				className: "vedit-checkbox-group",
				children: e.map((e) => /* @__PURE__ */ (0, j.jsxs)("label", {
					className: "vedit-toggle-row",
					children: [/* @__PURE__ */ (0, j.jsx)("input", {
						type: "checkbox",
						checked: i.includes(e.value),
						onChange: () => a(e.value)
					}), /* @__PURE__ */ (0, j.jsx)("span", { children: e.label })]
				}, e.value))
			});
		}
		case "image": return /* @__PURE__ */ (0, j.jsx)(Kr, {
			value: n,
			onChange: r
		});
		case "gallery": return /* @__PURE__ */ (0, j.jsx)(Jr, {
			value: n,
			onChange: r
		});
		case "file": return /* @__PURE__ */ (0, j.jsx)(qr, {
			value: n,
			onChange: r
		});
		case "link": return /* @__PURE__ */ (0, j.jsx)(Mr, {
			value: n,
			onChange: r,
			id: e
		});
		case "reference": return /* @__PURE__ */ (0, j.jsx)(Yr, {
			field: t,
			value: n,
			onChange: r
		});
		case "term": return /* @__PURE__ */ (0, j.jsx)(Zr, {
			field: t,
			value: n,
			onChange: r,
			defaultNodeType: a
		});
		default: return /* @__PURE__ */ (0, j.jsx)("textarea", {
			id: e,
			className: "vedit-input vedit-textarea",
			rows: 3,
			placeholder: `Unsupported field type: ${t.type}. JSON-edit at your own risk.`,
			value: n === void 0 ? "" : JSON.stringify(n, null, 2),
			onChange: (e) => {
				try {
					r(JSON.parse(e.target.value));
				} catch {}
			}
		});
	}
}
//#endregion
//#region src/SidePanel.tsx
var Dy = 0;
function Oy() {
	return Dy += 1, `vec-${Dy}-${Math.random().toString(36).slice(2, 8)}`;
}
var ky = 540, Ay = 360;
function jy({ config: e, domEntries: t, selectedIndex: n, onSelect: r, onClose: i, onSaved: a, onReindex: o }) {
	let [s, c] = (0, _.useState)(null), [l, u] = (0, _.useState)([]), [d, f] = (0, _.useState)([]), [p, m] = (0, _.useState)(""), [h, g] = (0, _.useState)({}), [v, y] = (0, _.useState)(null), [b, x] = (0, _.useState)({ kind: "idle" }), [S, re] = (0, _.useState)(null), [w, ie] = (0, _.useState)(() => {
		let e = Number(window.localStorage.getItem("vedit-panel-width"));
		return Number.isFinite(e) && e >= Ay ? e : ky;
	}), se = (0, _.useRef)(o);
	se.current = o;
	let ce = (0, _.useRef)(t);
	ce.current = t, (0, _.useEffect)(() => {
		let t = !1;
		return Promise.all([Lr(e.nodeId), Rr()]).then(([e, n]) => {
			if (t) return;
			let r = (e.blocks_data ?? []).map((e, t) => ({
				...e,
				__loadedIndex: t,
				__cid: Oy(),
				__isNew: !1
			}));
			c(e), u(n), f(r), m(JSON.stringify(By(r)));
		}).catch((e) => {
			t || y(e.message);
		}), () => {
			t = !0;
		};
	}, [e.nodeId]);
	let ue = (0, _.useMemo)(() => {
		let e = /* @__PURE__ */ new Map();
		for (let t of l) e.set(t.slug, t);
		return e;
	}, [l]), T = (0, _.useMemo)(() => {
		if (n === null) return null;
		let e = d.findIndex((e) => e.__loadedIndex === n);
		return e === -1 ? null : e;
	}, [n, d]), E = (e) => {
		if (e === null) {
			r(null);
			return;
		}
		let t = d[e];
		if (!t) return;
		r(t.__loadedIndex);
		let n = ce.current.find((e) => e.index === t.__loadedIndex);
		if (n) {
			let e = n.startNode.nextSibling;
			for (; e && e !== n.endNode;) {
				if (e.nodeType === Node.ELEMENT_NODE) {
					e.scrollIntoView({
						behavior: "smooth",
						block: "center"
					});
					break;
				}
				e = e.nextSibling;
			}
		}
	}, D = JSON.stringify(By(d)) !== p, de = (e, t, n) => {
		f((r) => r.map((r, i) => i === e ? {
			...r,
			fields: {
				...r.fields ?? {},
				[t]: n
			}
		} : r));
	}, fe = (e) => {
		let t = d[e];
		if (!t) return;
		let n = ce.current.find((e) => e.index === t.__loadedIndex);
		n && ne(n), f((t) => t.filter((t, n) => n !== e)), r(null), se.current?.();
	}, pe = (e) => {
		let t = d[e];
		if (!t) return;
		let n = JSON.parse(JSON.stringify(t.fields ?? {}));
		me(e + 1, t.type, n);
	};
	(0, _.useEffect)(() => le((e) => re(e)), []), (0, _.useEffect)(() => {
		if (!D) return;
		let e = (e) => {
			e.preventDefault(), e.returnValue = "";
		};
		return window.addEventListener("beforeunload", e), () => window.removeEventListener("beforeunload", e);
	}, [D]), (0, _.useEffect)(() => {
		if (T === null) return;
		let e = d[T];
		if (!e || h[e.type] !== void 0) return;
		let t = ue.get(e.type);
		if (!t) return;
		let n = !1;
		return zr(t.id).then((t) => {
			n || g((n) => ({
				...n,
				[e.type]: t.html_template ?? ""
			}));
		}).catch(() => {
			n || g((t) => ({
				...t,
				[e.type]: ""
			}));
		}), () => {
			n = !0;
		};
	}, [
		T,
		d,
		ue,
		h
	]), (0, _.useEffect)(() => {
		if (T === null) return;
		let e = d[T];
		if (!e) return;
		let t = h[e.type];
		if (!t) return;
		let n = ce.current.find((t) => t.index === e.__loadedIndex);
		if (!n) return;
		let r = window.setTimeout(() => {
			Wr(t, e.fields ?? {}).then((e) => oe(n, e)).catch(() => {});
		}, 250);
		return () => window.clearTimeout(r);
	}, [
		T,
		d,
		h
	]), (0, _.useEffect)(() => {
		let e = (e) => {
			(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s" && (!D || b.kind === "saving" || (e.preventDefault(), _e()));
		};
		return window.addEventListener("keydown", e, !0), () => window.removeEventListener("keydown", e, !0);
	}, [D, b.kind]);
	let me = async (e, t, n) => {
		let i = ue.get(t);
		if (!i) return;
		let a = Oy(), o = ee();
		f((r) => {
			let i = [...r];
			return i.splice(e, 0, {
				type: t,
				fields: n,
				__loadedIndex: o,
				__cid: a,
				__isNew: !0
			}), i;
		}), r(o);
		let s = h[t];
		if (s === void 0) try {
			s = (await zr(i.id)).html_template ?? "", g((e) => ({
				...e,
				[t]: s ?? ""
			}));
		} catch {
			s = "";
		}
		let c = "";
		if (s) try {
			c = await Wr(s, n);
		} catch {}
		let { start: l, end: u } = C(o, t);
		te(ce.current, e, l, u, c), se.current?.();
	}, O = (e, t) => {
		let n = ue.get(t);
		n && me(e, t, Ry(Fr(n)));
	}, he = Je(qe(Yt, { activationConstraint: { distance: 4 } }), qe(Wt, { coordinateGetter: Tr })), ge = (0, _.useMemo)(() => d.map((e, t) => `block-${t}`), [d]), k = (e) => {
		let { active: t, over: n } = e;
		if (!n || t.id === n.id) return;
		let r = ge.indexOf(String(t.id)), i = ge.indexOf(String(n.id));
		r < 0 || i < 0 || (ae(ce.current, r, i), se.current?.(), f((e) => nr(e, r, i)));
	}, _e = async () => {
		if (s) {
			x({ kind: "saving" });
			try {
				await Br(s.id, By(d)), x({ kind: "idle" }), a();
			} catch (e) {
				x({
					kind: "error",
					message: e.message
				});
			}
		}
	}, ve = () => {
		p && window.location.reload();
	}, ye = (e) => {
		e.preventDefault();
		let t = e.clientX, n = w, r = (e) => {
			let r = t - e.clientX;
			ie(Math.max(Ay, Math.min(window.innerWidth * .7, n + r)));
		}, i = () => {
			document.removeEventListener("pointermove", r), document.removeEventListener("pointerup", i), window.localStorage.setItem("vedit-panel-width", String(Math.round(w)));
		};
		document.addEventListener("pointermove", r), document.addEventListener("pointerup", i);
	}, be = T == null ? null : d[T] ?? null, xe = be ? ue.get(be.type) : void 0, Se = Vy(d, p);
	return /* @__PURE__ */ (0, j.jsxs)("aside", {
		className: "vedit-panel",
		"aria-label": "Visual editor",
		style: { width: w },
		children: [
			/* @__PURE__ */ (0, j.jsx)("div", {
				className: "vedit-resize-handle",
				onPointerDown: ye,
				"aria-label": "Resize panel"
			}),
			/* @__PURE__ */ (0, j.jsxs)("header", {
				className: "vedit-panel-header",
				children: [/* @__PURE__ */ (0, j.jsxs)("div", {
					className: "vedit-panel-title-block",
					children: [/* @__PURE__ */ (0, j.jsx)("span", {
						className: "vedit-panel-title",
						children: s ? s.title : `Editing #${e.nodeId}`
					}), s && /* @__PURE__ */ (0, j.jsxs)("span", {
						className: "vedit-panel-subtitle",
						children: [
							s.node_type,
							" · ",
							s.language_code
						]
					})]
				}), /* @__PURE__ */ (0, j.jsx)("button", {
					type: "button",
					className: "vedit-icon-btn",
					onClick: i,
					"aria-label": "Close",
					title: "Close",
					children: "×"
				})]
			}),
			/* @__PURE__ */ (0, j.jsxs)("div", {
				className: "vedit-panel-body",
				children: [
					v && /* @__PURE__ */ (0, j.jsxs)("div", {
						className: "vedit-error",
						children: ["Failed to load page: ", v]
					}),
					/* @__PURE__ */ (0, j.jsxs)(My, {
						title: "Blocks",
						children: [d.length === 0 ? /* @__PURE__ */ (0, j.jsx)("p", {
							className: "vedit-empty",
							children: "No blocks on this page yet."
						}) : /* @__PURE__ */ (0, j.jsx)(qn, {
							sensors: he,
							collisionDetection: nt,
							onDragEnd: k,
							children: /* @__PURE__ */ (0, j.jsx)(pr, {
								items: ge,
								strategy: lr,
								children: /* @__PURE__ */ (0, j.jsx)("ul", {
									className: "vedit-block-list",
									children: d.map((e, t) => {
										let n = ue.get(e.type), r = e.__isNew, i = n ? Pr(n) : e.type;
										return /* @__PURE__ */ (0, j.jsx)(Ny, {
											id: ge[t],
											label: i,
											index: t,
											selected: t === T,
											stale: r,
											onSelect: () => E(t),
											onDuplicate: () => pe(t),
											onDelete: () => {
												window.confirm(`Delete this ${i} block?`) && fe(t);
											}
										}, e.__cid);
									})
								})
							})
						}), /* @__PURE__ */ (0, j.jsx)("button", {
							type: "button",
							className: "vedit-add-block",
							onClick: () => re(d.length),
							disabled: l.length === 0,
							children: "+ Add block"
						})]
					}),
					S !== null && /* @__PURE__ */ (0, j.jsx)(Ly, {
						blockTypes: l,
						atIndex: S,
						onCancel: () => re(null),
						onPick: (e) => {
							O(S, e), re(null);
						}
					}),
					be && T !== null && /* @__PURE__ */ (0, j.jsxs)("section", {
						className: "vedit-fields-section",
						children: [
							/* @__PURE__ */ (0, j.jsxs)("h3", {
								className: "vedit-fields-title",
								children: [xe ? Pr(xe) : be.type, /* @__PURE__ */ (0, j.jsxs)("span", {
									className: "vedit-fields-subtitle",
									children: ["block #", T]
								})]
							}),
							be.__isNew && /* @__PURE__ */ (0, j.jsx)("div", {
								className: "vedit-info",
								children: "Unsaved block — Save to keep this on the page."
							}),
							/* @__PURE__ */ (0, j.jsx)(zy, {
								block: be,
								schema: xe ? Fr(xe) : [],
								nodeId: e.nodeId,
								nodeType: e.nodeType,
								onFieldChange: (e, t) => de(T, e, t)
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, j.jsxs)("footer", {
				className: "vedit-panel-footer",
				children: [
					/* @__PURE__ */ (0, j.jsxs)("span", {
						className: "vedit-footer-status",
						children: [
							b.kind === "saving" && "Saving…",
							b.kind === "error" && /* @__PURE__ */ (0, j.jsxs)("span", {
								className: "vedit-error-text",
								children: ["Save failed: ", b.message]
							}),
							b.kind === "idle" && D && `${Se} pending change${Se === 1 ? "" : "s"}`,
							b.kind === "idle" && !D && "No changes"
						]
					}),
					/* @__PURE__ */ (0, j.jsx)("button", {
						type: "button",
						className: "vedit-btn",
						"data-variant": "secondary",
						onClick: ve,
						disabled: !D || b.kind === "saving",
						children: "Discard"
					}),
					/* @__PURE__ */ (0, j.jsx)("button", {
						type: "button",
						className: "vedit-btn",
						"data-variant": "primary",
						onClick: _e,
						disabled: !D || b.kind === "saving",
						children: "Save"
					})
				]
			})
		]
	});
}
function My({ title: e, children: t }) {
	return /* @__PURE__ */ (0, j.jsxs)("section", {
		className: "vedit-section",
		children: [/* @__PURE__ */ (0, j.jsx)("h3", {
			className: "vedit-section-title",
			children: e
		}), /* @__PURE__ */ (0, j.jsx)("div", {
			className: "vedit-section-body",
			children: t
		})]
	});
}
function Ny({ id: e, label: t, index: n, selected: r, stale: i, onSelect: a, onDuplicate: o, onDelete: s }) {
	let { attributes: c, listeners: l, setNodeRef: u, transform: d, transition: f, isDragging: p } = xr({ id: e });
	return /* @__PURE__ */ (0, j.jsx)("li", {
		ref: u,
		style: {
			transform: Me.Transform.toString(d),
			transition: f,
			opacity: p ? .5 : 1
		},
		children: /* @__PURE__ */ (0, j.jsxs)("div", {
			className: "vedit-block-row",
			"data-selected": r,
			children: [
				/* @__PURE__ */ (0, j.jsx)("button", {
					type: "button",
					className: "vedit-drag-handle",
					"aria-label": "Drag to reorder",
					...c,
					...l,
					children: /* @__PURE__ */ (0, j.jsx)(Py, {})
				}),
				/* @__PURE__ */ (0, j.jsxs)("button", {
					type: "button",
					className: "vedit-block-item",
					"aria-current": r,
					onClick: a,
					title: i ? "Added in this session — Save to keep on the page" : void 0,
					children: [/* @__PURE__ */ (0, j.jsxs)("span", {
						className: "vedit-block-item-label",
						children: [/* @__PURE__ */ (0, j.jsx)("strong", { children: t }), /* @__PURE__ */ (0, j.jsxs)("span", {
							className: "vedit-block-meta",
							children: ["#", n]
						})]
					}), i && /* @__PURE__ */ (0, j.jsx)("span", {
						className: "vedit-stale-badge",
						children: "unsaved"
					})]
				}),
				/* @__PURE__ */ (0, j.jsxs)("div", {
					className: "vedit-row-actions",
					children: [/* @__PURE__ */ (0, j.jsx)("button", {
						type: "button",
						className: "vedit-row-icon",
						"aria-label": "Duplicate",
						title: "Duplicate",
						onClick: (e) => {
							e.stopPropagation(), o();
						},
						children: /* @__PURE__ */ (0, j.jsx)(Fy, {})
					}), /* @__PURE__ */ (0, j.jsx)("button", {
						type: "button",
						className: "vedit-row-icon",
						"data-variant": "danger",
						"aria-label": "Delete",
						title: "Delete",
						onClick: (e) => {
							e.stopPropagation(), s();
						},
						children: /* @__PURE__ */ (0, j.jsx)(Iy, {})
					})]
				})
			]
		})
	});
}
function Py() {
	return /* @__PURE__ */ (0, j.jsxs)("svg", {
		width: "10",
		height: "14",
		viewBox: "0 0 10 14",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, j.jsx)("circle", {
				cx: "2",
				cy: "3",
				r: "1.2",
				fill: "currentColor"
			}),
			/* @__PURE__ */ (0, j.jsx)("circle", {
				cx: "2",
				cy: "7",
				r: "1.2",
				fill: "currentColor"
			}),
			/* @__PURE__ */ (0, j.jsx)("circle", {
				cx: "2",
				cy: "11",
				r: "1.2",
				fill: "currentColor"
			}),
			/* @__PURE__ */ (0, j.jsx)("circle", {
				cx: "8",
				cy: "3",
				r: "1.2",
				fill: "currentColor"
			}),
			/* @__PURE__ */ (0, j.jsx)("circle", {
				cx: "8",
				cy: "7",
				r: "1.2",
				fill: "currentColor"
			}),
			/* @__PURE__ */ (0, j.jsx)("circle", {
				cx: "8",
				cy: "11",
				r: "1.2",
				fill: "currentColor"
			})
		]
	});
}
function Fy() {
	return /* @__PURE__ */ (0, j.jsxs)("svg", {
		width: "14",
		height: "14",
		viewBox: "0 0 16 16",
		fill: "none",
		"aria-hidden": "true",
		children: [/* @__PURE__ */ (0, j.jsx)("rect", {
			x: "4.5",
			y: "4.5",
			width: "9",
			height: "9",
			rx: "1.5",
			stroke: "currentColor",
			strokeWidth: "1.4"
		}), /* @__PURE__ */ (0, j.jsx)("path", {
			d: "M3 11V3.5A1.5 1.5 0 0 1 4.5 2H11",
			stroke: "currentColor",
			strokeWidth: "1.4",
			strokeLinecap: "round"
		})]
	});
}
function Iy() {
	return /* @__PURE__ */ (0, j.jsx)("svg", {
		width: "14",
		height: "14",
		viewBox: "0 0 16 16",
		fill: "none",
		"aria-hidden": "true",
		children: /* @__PURE__ */ (0, j.jsx)("path", {
			d: "M3 4h10M6 4V2.5A.5.5 0 0 1 6.5 2h3a.5.5 0 0 1 .5.5V4M5 4l.5 9.5A1 1 0 0 0 6.5 14.5h3a1 1 0 0 0 1-1L11 4",
			stroke: "currentColor",
			strokeWidth: "1.4",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		})
	});
}
function Ly({ blockTypes: e, atIndex: t, onCancel: n, onPick: r }) {
	let [i, a] = (0, _.useState)(""), o = (0, _.useMemo)(() => [...e].sort((e, t) => Pr(e).localeCompare(Pr(t))), [e]), s = (0, _.useMemo)(() => {
		let e = i.trim().toLowerCase();
		return e ? o.filter((t) => Pr(t).toLowerCase().includes(e) || t.slug.toLowerCase().includes(e)) : o;
	}, [o, i]);
	return (0, _.useEffect)(() => {
		let e = (e) => {
			e.key === "Escape" && n();
		};
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [n]), /* @__PURE__ */ (0, j.jsx)("div", {
		className: "vedit-modal-backdrop",
		onClick: n,
		children: /* @__PURE__ */ (0, j.jsxs)("div", {
			className: "vedit-modal",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, j.jsxs)("header", {
					className: "vedit-modal-header",
					children: [/* @__PURE__ */ (0, j.jsxs)("span", {
						className: "vedit-modal-title",
						children: ["Insert block at position ", t]
					}), /* @__PURE__ */ (0, j.jsx)("button", {
						type: "button",
						className: "vedit-link",
						onClick: n,
						children: "Cancel"
					})]
				}),
				/* @__PURE__ */ (0, j.jsx)("input", {
					type: "text",
					className: "vedit-input",
					placeholder: "Search block types…",
					autoFocus: !0,
					value: i,
					onChange: (e) => a(e.target.value)
				}),
				/* @__PURE__ */ (0, j.jsxs)("ul", {
					className: "vedit-block-picker-list",
					children: [s.length === 0 && /* @__PURE__ */ (0, j.jsx)("li", {
						className: "vedit-empty",
						children: "No matches."
					}), s.map((e) => /* @__PURE__ */ (0, j.jsx)("li", { children: /* @__PURE__ */ (0, j.jsxs)("button", {
						type: "button",
						className: "vedit-block-picker-item",
						onClick: () => r(e.slug),
						children: [/* @__PURE__ */ (0, j.jsx)("strong", { children: Pr(e) }), /* @__PURE__ */ (0, j.jsx)("span", {
							className: "vedit-block-meta",
							children: e.slug
						})]
					}) }, e.slug))]
				})
			]
		})
	});
}
function Ry(e) {
	let t = {};
	for (let n of e) {
		if (n.initialValue !== void 0) {
			t[n.name] = n.initialValue;
			continue;
		}
		let e = (n.type || "").toLowerCase();
		e === "boolean" || e === "toggle" ? t[n.name] = !1 : e === "number" || e === "integer" || e === "range" ? t[n.name] = null : e === "object" || e === "group" ? t[n.name] = {} : e === "array" || e === "repeater" || e === "gallery" || e === "checkbox" ? t[n.name] = [] : e === "string" || e === "text" || e === "textarea" || e === "url" || e === "email" || e === "richtext" || e === "wysiwyg" ? t[n.name] = "" : t[n.name] = null;
	}
	return t;
}
function zy({ block: e, schema: t, nodeId: n, nodeType: r, onFieldChange: i }) {
	if (t.length === 0) return /* @__PURE__ */ (0, j.jsxs)("p", {
		className: "vedit-empty",
		children: [
			"No field schema registered for \"",
			e.type,
			"\". Use the admin editor for raw JSON edits."
		]
	});
	let a = e.fields ?? {};
	return /* @__PURE__ */ (0, j.jsx)("div", {
		className: "vedit-form",
		children: t.map((e) => /* @__PURE__ */ (0, j.jsx)(Ty, {
			field: e,
			value: a[e.name],
			onChange: (t) => i(e.name, t),
			nodeId: n,
			nodeType: r,
			path: e.name
		}, e.name))
	});
}
function By(e) {
	return e.map(({ __loadedIndex: e, __cid: t, __isNew: n, ...r }) => r);
}
function Vy(e, t) {
	if (!t) return 0;
	let n = [];
	try {
		n = JSON.parse(t);
	} catch {
		return 0;
	}
	let r = By(e), i = Math.max(r.length, n.length), a = 0;
	for (let e = 0; e < i; e++) JSON.stringify(r[e]) !== JSON.stringify(n[e]) && a++;
	return a;
}
//#endregion
//#region src/EditorRoot.tsx
function Hy({ config: e }) {
	let [t, n] = (0, _.useState)(!1), [r, i] = (0, _.useState)([]), [a, o] = (0, _.useState)(null), [s, c] = (0, _.useState)(null), l = (0, _.useRef)(null), u = (0, _.useRef)(null), d = (0, _.useRef)(null);
	(0, _.useEffect)(() => {
		if (!t) {
			i([]), o(null), c(null);
			return;
		}
		i(x(document.body));
	}, [t]), (0, _.useEffect)(() => {
		if (!t) return;
		let e = 0, n = "", i = () => {
			let t = a == null ? null : r.find((e) => e.index === a) ?? null, o = s == null ? null : r.find((e) => e.index === s) ?? null, c = t ? re(t) : null, f = o ? re(o) : null;
			Uy(l.current, c, t && a !== s ? t.slug : null), Uy(u.current, f, o ? o.slug : null);
			let p = `${r.length}`;
			p !== n && d.current && (Wy(d.current, r.length), n = p), Gy(d.current, r), e = requestAnimationFrame(i);
		};
		return e = requestAnimationFrame(i), () => cancelAnimationFrame(e);
	}, [
		t,
		r,
		a,
		s
	]), (0, _.useEffect)(() => {
		if (!t) return;
		let e = (e) => {
			let t = e.target;
			if (!t || e.target?.closest?.("[data-vedit-host]")) return;
			let n = w(t, r);
			o(n ? n.index : null);
		}, n = (e) => {
			let t = e.target;
			if (!t || e.target?.closest?.("[data-vedit-host]")) return;
			let n = w(t, r);
			n && (e.preventDefault(), e.stopPropagation(), c(n.index));
		};
		return document.addEventListener("pointermove", e, !0), document.addEventListener("click", n, !0), () => {
			document.removeEventListener("pointermove", e, !0), document.removeEventListener("click", n, !0);
		};
	}, [t, r]), (0, _.useEffect)(() => {
		if (!t) return;
		let e = (e) => {
			e.key === "Escape" && n(!1);
		};
		return window.addEventListener("keydown", e), () => window.removeEventListener("keydown", e);
	}, [t]);
	let f = (0, _.useMemo)(() => () => i(x(document.body)), []);
	return /* @__PURE__ */ (0, j.jsxs)(j.Fragment, { children: [/* @__PURE__ */ (0, j.jsx)("button", {
		type: "button",
		className: "vedit-toggle",
		"data-active": t,
		onClick: () => n((e) => !e),
		"aria-pressed": t,
		children: t ? "Done" : "Edit page"
	}), t && /* @__PURE__ */ (0, j.jsxs)(j.Fragment, { children: [/* @__PURE__ */ (0, j.jsxs)("div", {
		className: "vedit-overlay",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, j.jsx)("div", {
				ref: l,
				className: "vedit-outline",
				"data-kind": "hover",
				style: { display: "none" },
				children: /* @__PURE__ */ (0, j.jsx)("span", { className: "vedit-label" })
			}),
			/* @__PURE__ */ (0, j.jsx)("div", {
				ref: u,
				className: "vedit-outline",
				"data-kind": "selected",
				style: { display: "none" },
				children: /* @__PURE__ */ (0, j.jsx)("span", { className: "vedit-label" })
			}),
			/* @__PURE__ */ (0, j.jsx)("div", {
				ref: d,
				className: "vedit-gutters"
			})
		]
	}), /* @__PURE__ */ (0, j.jsx)(jy, {
		config: e,
		domEntries: r,
		selectedIndex: s,
		onSelect: c,
		onClose: () => n(!1),
		onReindex: f,
		onSaved: () => window.location.reload()
	})] })] });
}
function Uy(e, t, n) {
	if (!e) return;
	if (!t || !n) {
		e.style.display = "none";
		return;
	}
	e.style.display = "block", e.style.transform = `translate(${t.left}px, ${t.top}px)`, e.style.width = `${t.width}px`, e.style.height = `${t.height}px`;
	let r = e.firstElementChild;
	r && r.textContent !== n && (r.textContent = n);
}
function Wy(e, t) {
	e.replaceChildren();
	let n = t === 0 ? 1 : t + 1;
	for (let t = 0; t < n; t++) {
		let n = document.createElement("button");
		n.type = "button", n.className = "vedit-insert-gutter", n.textContent = "+", n.setAttribute("aria-label", `Insert block at position ${t}`), n.dataset.idx = String(t), n.addEventListener("click", (e) => {
			e.preventDefault(), e.stopPropagation(), ue(Number(n.dataset.idx));
		}), e.appendChild(n);
	}
}
function Gy(e, t) {
	if (!e) return;
	let n = e.children;
	if (t.length === 0) {
		let e = n[0];
		e && (e.style.display = "block", e.style.transform = "translate(calc(50% - 14px), 16px)");
		return;
	}
	let r = t.map((e) => re(e));
	for (let e = 0; e <= t.length; e++) {
		let i = n[e];
		if (!i) continue;
		let a = e === 0 ? null : r[e - 1], o = e === t.length ? null : r[e], s, c;
		if (a && o) s = (a.top + a.height + o.top) / 2 - 14, c = (a.left + a.width / 2 + o.left + o.width / 2) / 2;
		else if (a) s = a.top + a.height + 4, c = a.left + a.width / 2;
		else if (o) s = o.top - 28, c = o.left + o.width / 2;
		else {
			i.style.display = "none";
			continue;
		}
		if (!Number.isFinite(s) || !Number.isFinite(c)) {
			i.style.display = "none";
			continue;
		}
		i.style.display = "block", i.style.transform = `translate(${c - 14}px, ${s}px)`;
	}
}
//#endregion
//#region src/styles.css?inline
var Ky = ":host{--vedit-bg:#fff;--vedit-surface:#f8fafc;--vedit-border:#e2e8f0;--vedit-text:#0f172a;--vedit-muted:#64748b;--vedit-accent:#2563eb;--vedit-accent-soft:#2563eb1f;--vedit-danger:#dc2626;color:var(--vedit-text);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Noto Sans,Ubuntu,Cantarell,Helvetica Neue,sans-serif;font-size:14px;line-height:1.5}*{box-sizing:border-box}button{font:inherit;color:inherit;cursor:pointer;background:0 0;border:none;padding:0}.vedit-toggle{z-index:2147483600;background:var(--vedit-accent);color:#fff;border-radius:999px;align-items:center;gap:8px;padding:12px 18px;font-weight:600;transition:transform .12s,box-shadow .12s;display:inline-flex;position:fixed;bottom:24px;right:24px;box-shadow:0 10px 30px #2563eb59}.vedit-toggle:hover{transform:translateY(-1px);box-shadow:0 14px 36px #2563eb73}.vedit-toggle[data-active=true]{background:var(--vedit-text)}.vedit-overlay{pointer-events:none;z-index:2147483500;position:fixed;top:0;bottom:0;left:0;right:0}.vedit-outline{border:2px solid var(--vedit-accent);background:var(--vedit-accent-soft);will-change:transform, width, height;border-radius:4px;position:absolute}.vedit-outline[data-kind=hover]{background:0 0;border-style:dashed}.vedit-outline[data-kind=selected]{border-style:solid}.vedit-label{background:var(--vedit-accent);color:#fff;white-space:nowrap;border-radius:4px 4px 0 0;padding:2px 8px;font-size:11px;font-weight:600;position:absolute;top:-22px;left:-2px}.vedit-panel{background:var(--vedit-bg);border-left:1px solid var(--vedit-border);z-index:2147483550;flex-direction:column;display:flex;position:fixed;top:0;bottom:0;right:0;box-shadow:-10px 0 30px #0f172a1f}.vedit-resize-handle{cursor:ew-resize;z-index:1;width:6px;height:100%;position:absolute;top:0;left:-3px}.vedit-resize-handle:hover{background:var(--vedit-accent-soft)}.vedit-panel-header{border-bottom:1px solid var(--vedit-border);background:var(--vedit-surface);justify-content:space-between;align-items:center;padding:14px 16px;display:flex}.vedit-panel-title{font-size:14px;font-weight:600}.vedit-panel-body{flex:1;padding:16px;overflow-y:auto}.vedit-panel-footer{border-top:1px solid var(--vedit-border);background:var(--vedit-surface);justify-content:flex-end;gap:8px;padding:12px 16px;display:flex}.vedit-block-list{flex-direction:column;gap:4px;margin:0;padding:0;list-style:none;display:flex}.vedit-block-item{color:var(--vedit-text);background:var(--vedit-bg);border:1px solid #0000;border-radius:6px;justify-content:space-between;align-items:center;padding:8px 10px;font-size:13px;display:flex}.vedit-block-item:hover{background:var(--vedit-surface);border-color:var(--vedit-border)}.vedit-block-item[aria-current=true]{background:var(--vedit-accent-soft);border-color:var(--vedit-accent)}.vedit-btn{border-radius:6px;padding:8px 14px;font-size:13px;font-weight:600}.vedit-btn[data-variant=primary]{background:var(--vedit-accent);color:#fff}.vedit-btn[data-variant=primary]:disabled{opacity:.6;cursor:not-allowed}.vedit-btn[data-variant=secondary]{background:var(--vedit-surface);border:1px solid var(--vedit-border)}.vedit-btn[data-variant=danger]{color:var(--vedit-danger);border:1px solid var(--vedit-danger);background:#fff}.vedit-empty{color:var(--vedit-muted);text-align:center;padding:24px 12px;font-size:13px}.vedit-section{margin-bottom:18px}.vedit-section+.vedit-section{border-top:1px solid var(--vedit-border);padding-top:16px}.vedit-section-title{text-transform:uppercase;letter-spacing:.06em;color:var(--vedit-muted);margin:0 0 8px;font-size:11px;font-weight:700}.vedit-section-body{flex-direction:column;gap:6px;display:flex}.vedit-block-meta{color:var(--vedit-muted);margin-left:6px;font-size:11px}.vedit-stale-badge{background:var(--vedit-accent-soft);color:var(--vedit-accent);text-transform:uppercase;letter-spacing:.04em;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:700}.vedit-form{flex-direction:column;gap:14px;display:flex}.vedit-field{flex-direction:column;gap:4px;display:flex}.vedit-field-label{color:var(--vedit-text);font-size:12px;font-weight:600}.vedit-field-description{color:var(--vedit-muted);margin:0;font-size:11px}.vedit-input{width:100%;font:inherit;border:1px solid var(--vedit-border);background:var(--vedit-bg);color:var(--vedit-text);border-radius:6px;padding:7px 10px}.vedit-input:focus{border-color:var(--vedit-accent);box-shadow:0 0 0 3px var(--vedit-accent-soft);outline:none}.vedit-textarea{resize:vertical;min-height:80px}.vedit-toggle-row{cursor:pointer;align-items:center;gap:8px;font-size:13px;display:inline-flex}.vedit-field-unsupported{background:var(--vedit-surface);border:1px dashed var(--vedit-border);border-radius:6px;flex-direction:column;gap:4px;padding:8px 10px;display:flex}.vedit-field-unsupported-summary{color:var(--vedit-text);font-size:12px}.vedit-link{color:var(--vedit-accent);font-size:12px;text-decoration:none}.vedit-link:hover{text-decoration:underline}.vedit-error{color:#991b1b;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;margin-bottom:12px;padding:8px 10px;font-size:12px}.vedit-error-text{color:var(--vedit-danger)}.vedit-footer-status{color:var(--vedit-muted);margin-right:auto;font-size:12px}.vedit-actions-row{gap:6px;margin-bottom:12px;display:flex}.vedit-add-block{border:1px dashed var(--vedit-border);width:100%;color:var(--vedit-accent);background:var(--vedit-bg);border-radius:6px;margin-top:8px;padding:8px 10px;font-size:13px;font-weight:600}.vedit-add-block:hover{background:var(--vedit-accent-soft);border-color:var(--vedit-accent)}.vedit-add-block:disabled{opacity:.5;cursor:not-allowed}.vedit-block-picker{border:1px solid var(--vedit-border);background:var(--vedit-bg);border-radius:6px;margin-top:8px;overflow:hidden}.vedit-block-picker-header{background:var(--vedit-surface);border-bottom:1px solid var(--vedit-border);justify-content:space-between;align-items:center;padding:8px 10px;font-size:12px;font-weight:600;display:flex}.vedit-block-picker-list{max-height:240px;margin:0;padding:0;list-style:none;overflow-y:auto}.vedit-block-picker-item{text-align:left;justify-content:space-between;align-items:center;width:100%;padding:8px 10px;font-size:13px;display:flex}.vedit-block-picker-item:hover{background:var(--vedit-surface)}.vedit-block-row{align-items:stretch;gap:4px;display:flex}.vedit-block-row .vedit-block-item{flex:1}.vedit-drag-handle{width:24px;color:var(--vedit-muted);cursor:grab;-webkit-user-select:none;user-select:none;border-radius:6px;justify-content:center;align-items:center;font-weight:700;display:inline-flex}.vedit-drag-handle:hover{background:var(--vedit-surface);color:var(--vedit-text)}.vedit-drag-handle:active{cursor:grabbing}.vedit-gutters{pointer-events:none;position:absolute;top:0;bottom:0;left:0;right:0}.vedit-insert-gutter{background:var(--vedit-bg);border:2px dashed var(--vedit-accent);width:28px;height:28px;color:var(--vedit-accent);pointer-events:auto;border-radius:999px;justify-content:center;align-items:center;font-size:18px;font-weight:700;line-height:1;display:none;position:absolute;top:0;left:0;box-shadow:0 4px 12px #0f172a14}.vedit-insert-gutter:hover{background:var(--vedit-accent);color:#fff;border-style:solid}.vedit-modal-backdrop{z-index:2147483560;background:#0f172a59;justify-content:center;align-items:center;padding:24px;display:flex;position:fixed;top:0;bottom:0;left:0;right:0}.vedit-modal{background:var(--vedit-bg);border-radius:12px;flex-direction:column;gap:12px;width:100%;max-width:420px;padding:16px;display:flex;box-shadow:0 30px 80px #0f172a40}.vedit-modal-header{justify-content:space-between;align-items:center;display:flex}.vedit-modal-title{font-size:14px;font-weight:600}.vedit-panel-title-block{flex-direction:column;gap:2px;display:flex}.vedit-panel-subtitle{color:var(--vedit-muted);text-transform:uppercase;letter-spacing:.04em;font-size:11px}.vedit-icon-btn{width:28px;height:28px;color:var(--vedit-muted);border-radius:6px;justify-content:center;align-items:center;font-size:18px;display:inline-flex}.vedit-icon-btn:hover{background:var(--vedit-surface);color:var(--vedit-text)}.vedit-required{color:var(--vedit-danger);margin-left:4px}.vedit-tiptap{border:1px solid var(--vedit-border);background:var(--vedit-bg);border-radius:6px;overflow:hidden}.vedit-tiptap-toolbar{border-bottom:1px solid var(--vedit-border);background:var(--vedit-surface);flex-wrap:wrap;gap:2px;padding:6px;display:flex}.vedit-tiptap-btn{min-width:28px;height:26px;color:var(--vedit-text);border-radius:4px;padding:0 6px;font-size:12px}.vedit-tiptap-btn:hover{background:var(--vedit-bg)}.vedit-tiptap-btn[data-active=true]{background:var(--vedit-accent);color:#fff}.vedit-tiptap-btn:disabled{opacity:.4;cursor:not-allowed}.vedit-tiptap-sep{background:var(--vedit-border);width:1px;margin:2px 4px}.vedit-tiptap .ProseMirror{outline:none;min-height:140px;padding:10px 12px;font-size:14px;line-height:1.6}.vedit-tiptap .ProseMirror p{margin:0 0 .6em}.vedit-tiptap .ProseMirror h2{margin:.6em 0 .3em;font-size:1.25em;font-weight:700}.vedit-tiptap .ProseMirror h3{margin:.6em 0 .3em;font-size:1.1em;font-weight:700}.vedit-tiptap .ProseMirror ul,.vedit-tiptap .ProseMirror ol{margin:0 0 .6em;padding-left:1.4em}.vedit-tiptap .ProseMirror blockquote{border-left:3px solid var(--vedit-border);color:var(--vedit-muted);margin:0 0 .6em;padding-left:10px}.vedit-tiptap .ProseMirror code{background:var(--vedit-surface);border-radius:3px;padding:1px 4px;font-size:.9em}.vedit-tiptap .ProseMirror pre{background:var(--vedit-text);color:#fff;border-radius:6px;padding:8px 10px;font-size:12px;overflow-x:auto}.vedit-tiptap .ProseMirror a{color:var(--vedit-accent);text-decoration:underline}.vedit-tiptap-loading{color:var(--vedit-muted);padding:10px;font-size:12px}.vedit-range{align-items:center;gap:10px;display:flex}.vedit-range input[type=range]{flex:1}.vedit-range-value{text-align:right;font-variant-numeric:tabular-nums;min-width:40px;color:var(--vedit-muted);font-size:12px}.vedit-radio-group,.vedit-checkbox-group{flex-direction:column;gap:6px;display:flex}.vedit-radio-row{cursor:pointer;align-items:center;gap:8px;font-size:13px;display:inline-flex}.vedit-object{border:1px solid var(--vedit-border);background:var(--vedit-surface);border-radius:6px;overflow:hidden}.vedit-collapsible-head{text-transform:uppercase;letter-spacing:.04em;width:100%;color:var(--vedit-muted);background:var(--vedit-surface);border-bottom:1px solid var(--vedit-border);align-items:center;gap:6px;padding:8px 10px;font-size:12px;font-weight:600;display:flex}.vedit-collapsible-head:hover{color:var(--vedit-text)}.vedit-collapsible-caret{font-size:10px;transition:transform .1s;display:inline-block}.vedit-collapsible-caret[data-open=true]{transform:rotate(90deg)}.vedit-object-body{background:var(--vedit-bg);flex-direction:column;gap:12px;padding:12px;display:flex}.vedit-array{flex-direction:column;gap:8px;display:flex}.vedit-array-list{flex-direction:column;gap:6px;margin:0;padding:0;list-style:none;display:flex}.vedit-array-item{border:1px solid var(--vedit-border);background:var(--vedit-bg);border-radius:6px;overflow:hidden}.vedit-array-item-head{background:var(--vedit-surface);border-bottom:1px solid var(--vedit-border);align-items:center;gap:4px;padding:6px 8px;display:flex}.vedit-array-item-toggle{text-align:left;flex:1;align-items:center;gap:6px;font-size:12px;font-weight:500;display:flex}.vedit-array-item-summary{color:var(--vedit-text)}.vedit-array-item-body{flex-direction:column;gap:12px;padding:12px;display:flex}.vedit-link-field{flex-direction:column;gap:6px;display:flex}.vedit-grid-2{grid-template-columns:1fr 1fr;gap:6px;display:grid}.vedit-tabs{gap:2px;margin-bottom:6px;display:flex}.vedit-tab{color:var(--vedit-muted);border-radius:4px;padding:4px 10px;font-size:12px}.vedit-tab[data-active=true]{background:var(--vedit-accent-soft);color:var(--vedit-accent);font-weight:600}.vedit-media-modal{max-width:720px;max-height:80vh}.vedit-modal-footer{border-top:1px solid var(--vedit-border);justify-content:flex-end;gap:6px;padding-top:8px;display:flex}.vedit-media-grid{grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;max-height:50vh;display:grid;overflow-y:auto}.vedit-media-tile{background:var(--vedit-surface);text-align:left;border:2px solid #0000;border-radius:6px;flex-direction:column;gap:4px;padding:6px;display:flex;overflow:hidden}.vedit-media-tile:hover{background:var(--vedit-accent-soft)}.vedit-media-tile[data-selected=true]{border-color:var(--vedit-accent);background:var(--vedit-accent-soft)}.vedit-media-tile img{object-fit:cover;background:var(--vedit-border);border-radius:4px;width:100%;height:90px}.vedit-media-fileicon{background:var(--vedit-bg);border-radius:4px;justify-content:center;align-items:center;height:90px;font-size:32px;display:flex}.vedit-media-name{color:var(--vedit-muted);white-space:nowrap;text-overflow:ellipsis;font-size:11px;overflow:hidden}.vedit-image-field{flex-direction:column;gap:6px;display:flex}.vedit-image-preview{border:1px solid var(--vedit-border);background:var(--vedit-surface);border-radius:6px;gap:10px;padding:8px;display:flex}.vedit-image-preview img{object-fit:cover;background:var(--vedit-border);border-radius:4px;flex-shrink:0;width:96px;height:96px}.vedit-image-meta{flex-direction:column;flex:1;gap:6px;display:flex}.vedit-gallery-grid{grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:6px;margin-bottom:8px;display:grid}.vedit-gallery-tile{aspect-ratio:1;background:var(--vedit-surface);border-radius:4px;position:relative;overflow:hidden}.vedit-gallery-tile img{object-fit:cover;width:100%;height:100%}.vedit-gallery-remove{color:#fff;background:#0f172ab3;border-radius:999px;width:20px;height:20px;font-size:14px;line-height:1;position:absolute;top:2px;right:2px}.vedit-gallery-remove:hover{background:var(--vedit-danger)}.vedit-info{background:var(--vedit-accent-soft);color:var(--vedit-accent);border-radius:6px;margin-bottom:10px;padding:8px 10px;font-size:12px}.vedit-block-row{border:1px solid var(--vedit-border);background:var(--vedit-bg);border-radius:8px;align-items:stretch;gap:0;transition:border-color 80ms,box-shadow 80ms,background 80ms;display:flex;overflow:hidden}.vedit-block-row:hover{border-color:#cbd5e1}.vedit-block-row[data-selected=true]{border-color:var(--vedit-accent);box-shadow:0 0 0 1px var(--vedit-accent);background:var(--vedit-accent-soft)}.vedit-block-row .vedit-drag-handle{width:28px;color:var(--vedit-muted);cursor:grab;background:0 0;border:none;border-radius:0;flex:0 0 28px;justify-content:center;align-items:center;display:inline-flex}.vedit-block-row .vedit-drag-handle:hover{color:var(--vedit-text);background:var(--vedit-surface)}.vedit-block-row .vedit-drag-handle:active{cursor:grabbing}.vedit-block-row .vedit-block-item{color:var(--vedit-text);text-align:left;background:0 0;border:none;border-radius:0;flex:1;justify-content:space-between;align-items:center;min-width:0;padding:8px 4px;font-size:13px;display:flex}.vedit-block-row .vedit-block-item:hover,.vedit-block-row[data-selected=true] .vedit-block-item{background:0 0}.vedit-block-item-label{white-space:nowrap;text-overflow:ellipsis;align-items:center;gap:4px;min-width:0;display:flex;overflow:hidden}.vedit-block-item-label strong{text-overflow:ellipsis;overflow:hidden}.vedit-row-actions{opacity:0;flex:none;align-items:center;gap:0;padding-right:4px;transition:opacity 80ms;display:flex}.vedit-block-row:hover .vedit-row-actions,.vedit-block-row[data-selected=true] .vedit-row-actions,.vedit-block-row:focus-within .vedit-row-actions{opacity:1}.vedit-row-icon{width:26px;height:26px;color:var(--vedit-muted);background:0 0;border:none;border-radius:5px;justify-content:center;align-items:center;display:inline-flex}.vedit-row-icon:hover{background:var(--vedit-surface);color:var(--vedit-text)}.vedit-row-icon[data-variant=danger]:hover{color:var(--vedit-danger);background:#fee2e2}.vedit-fields-section{background:var(--vedit-surface);border-top:1px solid var(--vedit-border);margin:16px -16px 0;padding:16px 16px 4px}.vedit-fields-title{color:var(--vedit-text);align-items:baseline;gap:8px;margin:0 0 12px;font-size:14px;font-weight:600;display:flex}.vedit-fields-subtitle{color:var(--vedit-muted);text-transform:uppercase;letter-spacing:.06em;font-size:11px;font-weight:500}.vedit-section+.vedit-fields-section{margin-top:0}";
//#endregion
//#region src/main.tsx
function qy() {
	let e = document.getElementById("__squilla_vedit_config");
	if (!e) return null;
	try {
		let t = JSON.parse(e.textContent ?? "{}");
		return typeof t.nodeId == "number" ? t : null;
	} catch {
		return null;
	}
}
function Jy() {
	let e = qy();
	if (!e) {
		console.warn("[squilla:visual-editor] missing or invalid config; skipping");
		return;
	}
	let t = document.createElement("div");
	t.setAttribute("data-vedit-host", ""), t.style.position = "fixed", t.style.zIndex = "2147483600", t.style.top = "0", t.style.left = "0", t.style.pointerEvents = "none", document.body.appendChild(t);
	let n = t.attachShadow({ mode: "open" }), r = document.createElement("style");
	r.textContent = Ky, n.appendChild(r);
	let i = document.createElement("div");
	i.style.pointerEvents = "auto", n.appendChild(i), (0, v.createRoot)(i).render(/* @__PURE__ */ (0, j.jsx)(_.StrictMode, { children: /* @__PURE__ */ (0, j.jsx)(Hy, { config: e }) }));
}
document.readyState === "complete" || document.readyState === "interactive" ? Jy() : document.addEventListener("DOMContentLoaded", Jy);
//#endregion

//# sourceMappingURL=editor.js.map
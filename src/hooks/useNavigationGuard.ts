/**
 * Guard de navegación para cambios sin guardar, compatible con BrowserRouter
 * plano (sin data router, `useBlocker` de react-router NO está disponible).
 *
 * Intercepta los tres caminos de salida mientras `when` es true:
 *  - Navegación SPA (Link, useNavigate): parcha `history.pushState`/`replaceState`
 *    y aborta ANTES de que el router la aplique lanzando AbortError dentro del
 *    parche — react-router llama a pushState y recién después notifica a sus
 *    suscriptores, así que la excepción es el único punto de corte síncrono.
 *    Queda como error de consola en el handler que navegó: sin impacto en UI.
 *  - Back/forward (traverse): con Navigation API (Chromium/Edge — los navegadores
 *    estándar del cliente, GUIDE_TERMINALES §4) el evento `navigate` se dispara
 *    ANTES del cambio de URL y `preventDefault()` lo deja en nada: sin carreras
 *    con el ciclo de vida del componente. `confirm()` lo replayea con
 *    history.forward().
 *    Sin Navigation API (Firefox/Safari) el traverse no se bloquea en página:
 *    el borrador persistido + beforeunload protegen los datos igual.
 *  - Cierre/refresh de pestaña: beforeunload nativo (sin UI custom).
 *
 * `pending` expone la navegación interceptada; `confirm()` la deja continuar y
 * `cancel()` vuelve al estado quieto. Los parches se instalan al montar y se
 * restauran al desmontar con la MISMA referencia (sin .bind).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface PendingNavigation {
  url: string;
}

interface PendingReplay {
  kind: 'push' | 'traverse';
  url: string;
  /** Estado de history que RR pasó al push bloqueado (replay de confirm). */
  pushState: unknown;
  state: unknown;
  /** Dirección del traverse cancelado: el replay repite la misma. */
  dir?: 'back' | 'forward';
}

interface NavigateEventLike {
  navigationType: string;
  canIntercept: boolean;
  cancelable: boolean;
  destination: { url: string; key?: string };
  /** Bloquear el traverse: el API real es preventDefault (no `cancel()`). */
  preventDefault: () => void;
}

export function useNavigationGuard(when: boolean) {
  const [pending, setPending] = useState<PendingNavigation | null>(null);

  const whenRef = useRef(when);
  whenRef.current = when;

  const allowNextRef = useRef(false);
  const pendingRef = useRef<PendingReplay | null>(null);

  useEffect(() => {
    // Sin .bind: los originales se restauran como la MISMA referencia (los
    // métodos nativos se invocan con .call sobre window.history).
    const originalPush = window.history.pushState;
    const originalReplace = window.history.replaceState;
    const push = (state: unknown, unused: string, url?: string | URL | null) =>
      originalPush.call(window.history, state, unused, url as string | URL | null);
    const replace = (state: unknown, unused: string, url?: string | URL | null) =>
      originalReplace.call(window.history, state, unused, url as string | URL | null);

    /** ¿Interceptar esta navegación? Sólo same-document y hacia URL distinta. */
    const shouldBlock = (url: string | URL | null | undefined): boolean => {
      if (!whenRef.current || allowNextRef.current || url == null) return false;
      try {
        const next = new URL(String(url), window.location.href);
        if (next.origin !== window.location.origin) return false;
        return next.href !== window.location.href;
      } catch {
        return false;
      }
    };

    const blockPush = (state: unknown, url: string | URL): never => {
      const replay: PendingReplay = {
        kind: 'push',
        url: new URL(String(url), window.location.href).href,
        pushState: state,
        state,
      };
      pendingRef.current = replay;
      setPending({ url: replay.url });
      throw new DOMException('Navigation blocked by unsaved-changes guard', 'AbortError');
    };

    const patchedPush = (state: unknown, unused: string, url?: string | URL | null) => {
      const bypass = allowNextRef.current;
      if (!bypass && shouldBlock(url)) blockPush(state, url as string | URL);
      if (bypass) allowNextRef.current = false;
      push(state, unused, url);
    };

    const patchedReplace = (state: unknown, unused: string, url?: string | URL | null) => {
      const bypass = allowNextRef.current;
      if (!bypass && shouldBlock(url)) blockPush(state, url as string | URL);
      if (bypass) allowNextRef.current = false;
      replace(state, unused, url);
    };

    window.history.pushState = patchedPush as typeof window.history.pushState;
    window.history.replaceState = patchedReplace as typeof window.history.replaceState;

    /** ¿El traverse cancelado iba hacia atrás o adelante? Compara la posición del
     * destino contra la entrada actual en la pila (Navigation API). */
    const traverseDirection = (e: NavigateEventLike): 'back' | 'forward' => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const n = (window as any).navigation;
        const entries = n?.entries?.() as Array<{ key?: string }> | undefined;
        const curKey = n?.currentEntry?.key as string | undefined;
        if (entries && e.destination?.key && curKey) {
          const di = entries.findIndex((x) => x.key === e.destination.key);
          const ci = entries.findIndex((x) => x.key === curKey);
          if (di >= 0 && ci >= 0) return di < ci ? 'back' : 'forward';
        }
      } catch {
        // sin entries(): el caso dominante (botón atrás) es 'back'
      }
      return 'back';
    };

    // Traverse (back/forward): Navigation API lo cancela antes del cambio de URL.
    const nav = (window as unknown as {
      navigation?: {
        addEventListener?: (t: string, fn: (e: NavigateEventLike) => void) => void;
        removeEventListener?: (t: string, fn: (e: NavigateEventLike) => void) => void;
      };
    }).navigation;
    const onNavigate = (e: NavigateEventLike) => {
      if (e.navigationType !== 'traverse' && e.navigationType !== 'back_forward') return;
      if (allowNextRef.current) {
        allowNextRef.current = false; // replay del confirm: dejar pasar
        return;
      }
      if (!whenRef.current || !e.canIntercept || !e.cancelable) return;
      try {
        if (new URL(e.destination.url).origin !== window.location.origin) return;
        if (e.destination.url === window.location.href) return;
      } catch {
        return;
      }
      pendingRef.current = {
        kind: 'traverse',
        url: e.destination.url,
        pushState: null,
        state: null,
        dir: traverseDirection(e),
      };
      setPending({ url: e.destination.url });
      e.preventDefault();
    };
    nav?.addEventListener?.('navigate', onNavigate);

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!whenRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.history.pushState = originalPush;
      window.history.replaceState = originalReplace;
      nav?.removeEventListener?.('navigate', onNavigate);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  /** Deja continuar la navegación interceptada. */
  const confirm = useCallback(() => {
    const p = pendingRef.current;
    if (!p) return;
    pendingRef.current = null;
    setPending(null);
    allowNextRef.current = true;
    if (p.kind === 'traverse') {
      // El traverse corre de nuevo en su dirección original; el listener de
      // Navigation API lo deja pasar.
      if (p.dir === 'forward') window.history.forward();
      else window.history.back();
    } else {
      // Replay del push + popstate sintético para que el router aplique el destino
      // (el bloqueo abortó antes de que RR notificara a sus suscriptores).
      window.history.pushState(p.pushState, '', p.url);
      window.dispatchEvent(new PopStateEvent('popstate', { state: p.state }));
    }
  }, []);

  /** Vuelve al estado quieto: la navegación interceptada se descarta. */
  const cancel = useCallback(() => {
    pendingRef.current = null;
    allowNextRef.current = false;
    setPending(null);
  }, []);

  return { pending, confirm, cancel };
}

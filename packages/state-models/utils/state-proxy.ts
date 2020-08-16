import { StateProxy } from '@lib-form/state-models/interfaces/state-proxy';

export const getProxyStateOrNull = <ProvidedState extends {}, ExpectedState extends {}>(
  proxy: StateProxy<ProvidedState, ExpectedState>,
  state: ExpectedState
): ProvidedState | null => (isExcludedProxy(proxy, state) ? null : proxy.get(state));

export const isExcludedProxy = <ProvidedState extends {}, ExpectedState extends {}>(
  proxy: StateProxy<ProvidedState, ExpectedState>,
  state: ExpectedState
): boolean => !!(proxy.shouldBeExcluded && proxy.shouldBeExcluded(state));

export const isHandledProxy = <
  ProvidedState extends {},
  ExpectedState extends {},
  State extends ExpectedState & ProvidedState
>(
  proxy: StateProxy<ProvidedState, ExpectedState>,
  updates: Partial<State>,
  state: State
): boolean => !!(proxy.shouldBeHandled && proxy.shouldBeHandled(updates, state));

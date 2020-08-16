export interface StateProxy<ProvidedState extends {}, ExpectedState extends {}> {
  get<State extends ExpectedState>(state: State): ProvidedState;

  handle<State extends ExpectedState & ProvidedState>(
    updates: Partial<State>,
    prevState: State
  ): unknown;

  /**
   * Checks
   */
  shouldBeHandled?<State extends ExpectedState & ProvidedState>(
    updates: Partial<State>,
    prevState: State
  ): boolean;

  /**
   * If returns false we exclude prev state part from computed state object.
   * Useful for optional state blocks.
   */
  shouldBeExcluded?(state: ExpectedState): boolean;
}

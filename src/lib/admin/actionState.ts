export interface ActionState {
  error?: string;
  message?: string;
  /** The change was stored even though `error` reports a follow-up failure. */
  saved?: boolean;
  /** One-time link shown only in local development while email dry-run is on. */
  previewLink?: string;
}

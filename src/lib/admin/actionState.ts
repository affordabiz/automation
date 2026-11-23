export interface ActionState {
  error?: string;
  message?: string;
  /** One-time link shown only in local development while email dry-run is on. */
  previewLink?: string;
}

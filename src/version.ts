// Prod shows the bare tag (`v1.0.3`) -- a user has no reason to see how
// many untagged commits sit on top of the last real version bump. Dev shows
// the full `git describe` (e.g. `v1.0.3-2-gabc1234`), since knowing exactly
// which commit is running is the point while iterating locally.
export const APP_VERSION = import.meta.env.DEV ? __APP_VERSION_FULL__ : __APP_VERSION__;

// ISO commit date of the tag `APP_VERSION` (prod) / the tag underlying
// `APP_VERSION_FULL` (dev) resolves to -- i.e. when the version last
// actually changed, not when this particular commit was made.
export const APP_VERSION_DATE = __APP_VERSION_DATE__;

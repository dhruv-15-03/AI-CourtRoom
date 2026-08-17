/**
 * Shared placement for app-level snackbars/toasts.
 *
 * The primary navigation is a `variant="permanent"` MUI Drawer pinned to the
 * left (see `components/Sidebar.jsx`, width 280). MUI's default Snackbar anchor
 * is bottom-LEFT, so any snackbar that omits `anchorOrigin` renders on top of
 * the sidebar and covers its controls and footer text.
 *
 * Anchoring bottom-right sidesteps the drawer at every viewport width without
 * hard-coding a 280px offset — an offset would be wrong on narrow screens,
 * where MUI already stretches the snackbar to full width.
 */
export const SNACKBAR_ANCHOR = { vertical: 'bottom', horizontal: 'right' };

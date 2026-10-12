// OK: components this registry has.
import { ActionRow, Avatar, Button, HeaderBar, ToolbarView, Window } from "@/components/ui/adwaita"

// WRONG: no such component in this registry.
import { ActionRowx, Frobnicate } from "@/components/ui/adwaita"

// OK: not one of the registry's sources, so nothing is said about these.
import { ShellHeader } from "@/components/admin/slots"

// A fixture for the two rules. Every line marked WRONG should be reported and every line
// marked OK should not; lint/expected.txt is what oxlint says about this file.
export function Fixture() {
  return (
    <>
      {/* OK: real classes, real props, real enum values. */}
      <ActionRow title="Encryption" subtitle="End-to-end" subtitleLines={2} />
      <ActionRow title="Devices" subtitle-lines={1} />
      <HeaderBar showStartTitleButtons={false} />
      <ToolbarView topBarStyle="raised-border" />
      <Avatar text="Alice" size={32} showInitials />
      <Button iconName="go-next-symbolic" canShrink />
      <Window resizable={false} title="Matrix" />

      {/* OK: not GTK names, so the rules say nothing. */}
      <div className="flex" />
      <ShellHeader extra="anything" />

      {/* OK: React's own and the namespaced attributes. */}
      <ActionRow key="k" className="px-2" onClick={() => {}} data-state="open" aria-label="x" />

      {/* WRONG: no such property. */}
      <ActionRow subtitel="typo" />
      <Avatar initials="AB" />

      {/* WRONG: read-only. */}
      <Window isActive={true} />

      {/* WRONG: the member name rather than the nick. */}
      <ToolbarView topBarStyle="raised_border" />

      {/* WRONG: not a value of the enum at all. */}
      <ToolbarView bottomBarStyle="floating" />

      {/* WRONG: no such class. */}
      <ActionRowx title="x" />
    </>
  )
}

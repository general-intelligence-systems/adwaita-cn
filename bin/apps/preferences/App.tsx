// The same preferences window as app.rb beside this, from the registry.
//
// Nothing here reaches past the components: if a row comes out wrong, the row is
// wrong, and the comparison is there to say so.

import { ActionRow } from "@/ui/action-row"
import { Button } from "@/ui/button"
import { ComboRow } from "@/ui/combo-row"
import { EntryRow } from "@/ui/entry-row"
import { HeaderBar } from "@/ui/header-bar"
import { PreferencesGroup } from "@/ui/preferences-group"
import { PreferencesPage } from "@/ui/preferences-page"
import { SpinRow } from "@/ui/spin-row"
import { SwitchRow } from "@/ui/switch-row"
import { ToolbarView } from "@/ui/toolbar-view"
import { WindowTitle } from "@/ui/window-title"

export default function PreferencesApp() {
  return (
    <ToolbarView
      content={
        <PreferencesPage>
          <PreferencesGroup title="Appearance" description="How the window looks.">
            <ComboRow title="Theme" subtitle="Follows the system by default" selected={0} />
            <SwitchRow title="Animations" subtitle="200ms on Adwaita's own curve" active />
            <SpinRow title="Spacing" value={12} />
          </PreferencesGroup>

          <PreferencesGroup title="Account">
            <EntryRow title="Name" />
            <EntryRow title="Email" />
            <ActionRow title="Last synchronised" subtitle="Today at 09:41">
              <Button variant="suggestedAction" label="Sync now" valign="center" />
            </ActionRow>
          </PreferencesGroup>
        </PreferencesPage>
      }
    >
      <HeaderBar titleWidget={<WindowTitle title="Preferences" subtitle="Three groups" />}>
        <Button variant="flat" iconName="go-previous-symbolic" />
      </HeaderBar>
    </ToolbarView>
  )
}

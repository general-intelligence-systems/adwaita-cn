// The same widget factory as app.rb beside this, from the registry.

import { ActionRow } from "@/ui/action-row"
import { AppChooserButton } from "@/ui/app-chooser-button"
import { AppChooserWidget } from "@/ui/app-chooser-widget"
import { ApplicationWindow } from "@/ui/application-window"
import { Bin } from "@/ui/bin"
import { Box } from "@/ui/box"
import { BreakpointBin } from "@/ui/breakpoint-bin"
import { ClampScrollable } from "@/ui/clamp-scrollable"
import { ExpanderRow } from "@/ui/expander-row"
import { FileChooserWidget } from "@/ui/file-chooser-widget"
import { FontChooserWidget } from "@/ui/font-chooser-widget"
import { HeaderBar } from "@/ui/header-bar"
import { Label } from "@/ui/label"
import { LayoutSlot } from "@/ui/layout-slot"
import { LockButton } from "@/ui/lock-button"
import { MultiLayoutView } from "@/ui/multi-layout-view"
import { PasswordEntry } from "@/ui/password-entry"
import { PasswordEntryRow } from "@/ui/password-entry-row"
import { PopoverBin } from "@/ui/popover-bin"
import { PreferencesDialog } from "@/ui/preferences-dialog"
import { PreferencesGroup } from "@/ui/preferences-group"
import { PreferencesPage } from "@/ui/preferences-page"
import { PreferencesRow } from "@/ui/preferences-row"
import { PreferencesWindow } from "@/ui/preferences-window"
import { Range } from "@/ui/range"
import { ShortcutLabel } from "@/ui/shortcut-label"
import { ShortcutsGroup } from "@/ui/shortcuts-group"
import { ShortcutsShortcut } from "@/ui/shortcuts-shortcut"
import { ShortcutsWindow } from "@/ui/shortcuts-window"
import { SwitchRow } from "@/ui/switch-row"
import { TextView } from "@/ui/text-view"
import { ToolbarView } from "@/ui/toolbar-view"

export default function FactoryApp() {
  return (
    <BreakpointBin className="min-w-[360px] min-h-[320px]">
      <ToolbarView
        content={
          <PreferencesPage>
            <PreferencesGroup title="Rows">
              <ExpanderRow title="An expander row" subtitle="With a row inside it" expanded>
                <ActionRow title="Inside" />
              </ExpanderRow>
              <PasswordEntryRow title="Password" />
              <PreferencesRow title="A row an application filled itself">
                <Label label="Whatever the application put here" className="text-left m-3" />
              </PreferencesRow>
            </PreferencesGroup>
            <PreferencesGroup title="Parts">
              <Box orientation="vertical" spacing={12} className="gap-3">
                <Range className="grow" />
                <PasswordEntry showPeekIcon />
                <LockButton />
                <AppChooserButton contentType="text/plain" />
                <ShortcutLabel accelerator="<ctrl><shift>n" className="self-start" />
                <ShortcutsGroup title="Editing">
                  <ShortcutsShortcut title="Copy" accelerator="<ctrl>c" />
                </ShortcutsGroup>
                <MultiLayoutView className="h-8">
                  <LayoutSlot id="main">
                    <Label label="In the layout's slot" className="opacity-55" />
                  </LayoutSlot>
                </MultiLayoutView>
                <Bin>
                  <Label label="In a bin" className="opacity-55" />
                </Bin>
                <PopoverBin />
                <ClampScrollable maximumSize={240}>
                  <TextView className="h-8" leftMargin={6} topMargin={6} buffer="Clamped to 240px" />
                </ClampScrollable>
              </Box>
            </PreferencesGroup>
            <PreferencesGroup title="Choosers">
              <Box orientation="vertical" spacing={12} className="gap-3">
                <AppChooserWidget contentType="text/plain" className="h-[120px]" />
                <FileChooserWidget className="h-[160px]" />
                <FontChooserWidget className="h-[160px]" />
              </Box>
            </PreferencesGroup>
          </PreferencesPage>
        }
      >
        <HeaderBar />
      </ToolbarView>
    </BreakpointBin>
  )
}

// The window an application's own main window is.
export function Application() {
  return (
    <ApplicationWindow>
      <ToolbarView content={<Label label="An AdwApplicationWindow" />}>
        <HeaderBar />
      </ToolbarView>
    </ApplicationWindow>
  )
}

// The shortcuts window GTK 4.18 deprecated.
export function Shortcuts() {
  return <ShortcutsWindow />
}

// The preferences dialog, and the window it replaced.
export function Preferences() {
  return (
    <PreferencesDialog>
      <PreferencesPage title="General">
        <PreferencesGroup title="Appearance">
          <SwitchRow title="Dark mode" active />
        </PreferencesGroup>
      </PreferencesPage>
    </PreferencesDialog>
  )
}

export function PreferencesLegacy() {
  return (
    <PreferencesWindow>
      <PreferencesPage title="General">
        <PreferencesGroup title="Appearance">
          <SwitchRow title="Dark mode" active />
        </PreferencesGroup>
      </PreferencesPage>
    </PreferencesWindow>
  )
}

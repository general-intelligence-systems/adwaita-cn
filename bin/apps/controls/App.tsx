// The same controls pane as app.rb beside this, from the registry.

import { Box } from "@/ui/box"
import { Button } from "@/ui/button"
import { CheckButton } from "@/ui/check-button"
import { Clamp } from "@/ui/clamp"
import { DropDown } from "@/ui/drop-down"
import { Entry } from "@/ui/entry"
import { HeaderBar } from "@/ui/header-bar"
import { Label } from "@/ui/label"
import { LevelBar } from "@/ui/level-bar"
import { ProgressBar } from "@/ui/progress-bar"
import { Scale } from "@/ui/scale"
import { SearchEntry } from "@/ui/search-entry"
import { SpinButton } from "@/ui/spin-button"
import { Switch } from "@/ui/switch"
import { ToggleGroup } from "@/ui/toggle-group"
import { ToggleButton } from "@/ui/toggle-button"
import { ToolbarView } from "@/ui/toolbar-view"
import { WindowTitle } from "@/ui/window-title"

export default function ControlsApp() {
  return (
    <ToolbarView
      content={
        <Clamp maximumSize={400} className="m-6">
          <Box orientation="vertical" spacing={18} className="gap-[18px]">
            <Box orientation="horizontal" className="gap-2">
              <Button label="Label" />
              <Button variant="suggestedAction" label="Save" />
              <Button variant="destructiveAction" label="Delete" />
              <Button variant="flat" label="Cancel" />
              <Button size="circular" iconName="list-add-symbolic" />
            </Box>

            {/* AdwToggle is a GObject rather than a widget, so the registry has no
                component for it; what renders inside a toggle group is a button. */}
            <ToggleGroup>
              <ToggleButton label="Day" active />
              <ToggleButton label="Week" />
              <ToggleButton label="Month" />
            </ToggleGroup>

            <Entry placeholderText="Placeholder text" />
            <SearchEntry placeholderText="Search" />
            <Scale value={60} />

            <Box orientation="horizontal" className="gap-3 items-center">
              <Label label="Enabled" className="grow text-left" />
              <Switch active halign="end" />
            </Box>

            <CheckButton label="Remember me" active />
            <DropDown selected={0} />
            <ProgressBar fraction={0.6} />
            <LevelBar value={0.4} />
            <SpinButton value={3} />
          </Box>
        </Clamp>
      }
    >
      <HeaderBar titleWidget={<WindowTitle title="Controls" subtitle="One of each" />} />
    </ToolbarView>
  )
}

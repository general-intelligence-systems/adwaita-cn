// The same drawing application as app.rb beside this, from the registry.

import { Box } from "@/ui/box"
import { ColorButton } from "@/ui/color-button"
import { ColorChooserDialog } from "@/ui/color-chooser-dialog"
import { ColorChooserWidget } from "@/ui/color-chooser-widget"
import { ColorDialogButton } from "@/ui/color-dialog-button"
import { DrawingArea } from "@/ui/drawing-area"
import { FontButton } from "@/ui/font-button"
import { FontDialogButton } from "@/ui/font-dialog-button"
import { HeaderBar } from "@/ui/header-bar"
import { Scale } from "@/ui/scale"
import { ScaleButton } from "@/ui/scale-button"
import { Separator } from "@/ui/separator"
import { ToggleButton } from "@/ui/toggle-button"
import { ToolbarView } from "@/ui/toolbar-view"

export default function PaintApp() {
  return (
    <ToolbarView
      content={
        <Box orientation="horizontal" spacing={12} className="gap-3 m-3">
          <Box orientation="vertical" spacing={12} className="gap-3 w-[220px]">
            <ColorChooserWidget />
            <ColorDialogButton />
            <FontButton />
            <FontDialogButton />
            <ScaleButton icons={["zoom-in-symbolic"]} className="self-start" />
            <Scale value={80} />
          </Box>
          <Separator orientation="vertical" />
          <DrawingArea className="grow" />
        </Box>
      }
    >
      <HeaderBar
        titleWidget={
          <Box orientation="horizontal" className="linked">
            <ToggleButton iconName="edit-symbolic" active />
            <ToggleButton iconName="applications-graphics-symbolic" />
            <ToggleButton iconName="edit-clear-symbolic" />
          </Box>
        }
      >
        <ColorButton />
      </HeaderBar>
    </ToolbarView>
  )
}

// The colour chooser it opens for a colour not in the palette.
export function Palette() {
  return <ColorChooserDialog title="Pick a Colour" />
}

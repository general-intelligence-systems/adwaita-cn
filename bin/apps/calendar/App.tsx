// The same calendar as app.rb beside this, from the registry.

import { Bin } from "@/ui/bin"
import { Box } from "@/ui/box"
import { Button } from "@/ui/button"
import { Calendar } from "@/ui/calendar"
import { CenterBox } from "@/ui/center-box"
import { Dialog } from "@/ui/dialog"
import { Fixed } from "@/ui/fixed"
import { Frame } from "@/ui/frame"
import { Grid } from "@/ui/grid"
import { HeaderBar } from "@/ui/header-bar"
import { Inscription } from "@/ui/inscription"
import { Label } from "@/ui/label"
import { ToolbarView } from "@/ui/toolbar-view"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export default function CalendarApp() {
  return (
    <ToolbarView
      content={
        <Box orientation="horizontal" spacing={12} className="gap-3 m-3">
          <Box orientation="vertical" spacing={12} className="gap-3">
            <Calendar />
            <Frame label="Today">
              <Bin>
                <Inscription text="Three events, one all day" className="m-1.5" />
              </Bin>
            </Frame>
          </Box>
          <Grid columnSpacing={6} rowSpacing={6} columnHomogeneous className="grow">
            {DAYS.map((day) => (
              <Label key={day} label={day} className="heading" />
            ))}
            {DAYS.map((day, index) => (
              <Label key={`${day}-n`} label={String(12 + index)} className="dim-label" />
            ))}
            <Fixed className="h-10">
              <Button size="pill" variant="suggestedAction" label="Design review 14:00" />
            </Fixed>
          </Grid>
        </Box>
      }
    >
      <HeaderBar
        titleWidget={
          <CenterBox
            className="grow"
            startWidget={<Button variant="flat" iconName="go-previous-symbolic" />}
            centerWidget={<Label label="October 2026" className="heading" />}
            endWidget={<Button variant="flat" iconName="go-next-symbolic" />}
          />
        }
      />
    </ToolbarView>
  )
}

// The dialog which opens an event.
export function Event() {
  return (
    <Dialog title="Event" contentWidth={360} contentHeight={220}>
      <ToolbarView
        content={
          <Box orientation="vertical" spacing={6} className="gap-1.5 m-[18px]">
            <Label label="Design review" className="title-2" />
            <Label label="Today, 14:00 – 15:00" className="dim-label" />
          </Box>
        }
      >
        <HeaderBar />
      </ToolbarView>
    </Dialog>
  )
}
